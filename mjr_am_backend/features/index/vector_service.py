"""
Multimodal vector embedding service (SigLIP2 / X-CLIP / Florence-2).

Loads a SentenceTransformers-compatible multimodal model (default: SigLIP2)
and provides helpers to embed images, text queries, and video key-frames.

The service is **lazily initialised**: the (heavy) model is downloaded and
loaded into memory only on first use, making it safe to import even when
``MJR_ENABLE_VECTOR_SEARCH`` is disabled.

Design notes
------------
* All public methods return ``Result[T]`` for consistency with the rest of
  the backend.
* Embeddings are returned as flat ``list[float]`` (easy to serialise to
  BLOB via ``struct.pack``).
* Video key-frame extraction relies on *ffprobe* / *Pillow*; missing
  runtime dependencies are handled gracefully.
"""

from __future__ import annotations

import asyncio
import contextlib
import datetime as dt
import io
import logging
import os
import struct
import subprocess
import sys
import threading
import time
import warnings
import hashlib
from collections.abc import Sequence
from pathlib import Path
from typing import TYPE_CHECKING, Any, cast

from ...config import (
    FFPROBE_BIN,
    VECTOR_BATCH_SIZE,
    VECTOR_EMBEDDING_DIM,
    VECTOR_MODEL_NAME,
    VECTOR_PROMPT_MODEL_NAME,
    VECTOR_PROMPT_TASK,
    VECTOR_VIDEO_MODEL_NAME,
    VECTOR_VIDEO_KEYFRAME_INTERVAL,
)
from ...shared import Result, get_logger, log_success

if TYPE_CHECKING:
    from PIL import Image as PILImage
    from sentence_transformers import SentenceTransformer

logger = get_logger(__name__)

_MODEL_CACHE: dict[tuple[str, str], Any] = {}
_MODEL_CACHE_LOCK = threading.Lock()


def _ai_verbose_logs_enabled() -> bool:
    raw = str(
        os.environ.get("MAJOOR_AI_VERBOSE_LOGS")
        or os.environ.get("MJR_AM_AI_VERBOSE_LOGS")
        or os.environ.get("MAJOOR_VERBOSE_AI_LOGS")
        or os.environ.get("MJR_AM_VERBOSE_AI_LOGS")
        or ""
    ).strip().lower()
    return raw in {"1", "true", "yes", "on", "enabled", "enable"}


def _configure_hf_quiet_mode() -> None:
    """Configure HuggingFace/http logging behavior for model bootstrap.

    Must be called **after** ``import sentence_transformers`` (the import
    reconfigures its own loggers, overriding anything set earlier).
    """
    verbose = _ai_verbose_logs_enabled()
    if verbose:
        for key in (
            "HF_HUB_DISABLE_PROGRESS_BARS",
            "HF_HUB_DISABLE_SYMLINKS_WARNING",
            "TQDM_DISABLE",
            "TRANSFORMERS_NO_ADVISORY_WARNINGS",
        ):
            os.environ.pop(key, None)
        os.environ["TRANSFORMERS_VERBOSITY"] = "info"
        logging.getLogger("httpx").setLevel(logging.INFO)
        logging.getLogger("httpcore").setLevel(logging.INFO)
        logging.getLogger("huggingface_hub").setLevel(logging.INFO)
        logging.getLogger("transformers").setLevel(logging.INFO)
        logging.getLogger("sentence_transformers").setLevel(logging.INFO)
        return

    # Force-set (not setdefault) so repeated calls always win.
    os.environ["HF_HUB_DISABLE_PROGRESS_BARS"] = "1"
    os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
    os.environ["HF_HUB_DISABLE_EXPERIMENTAL_WARNING"] = "1"
    os.environ["TQDM_DISABLE"] = "1"
    os.environ["TRANSFORMERS_NO_ADVISORY_WARNINGS"] = "1"
    os.environ["TRANSFORMERS_VERBOSITY"] = "error"
    for _logger_name in (
        "httpx", "httpcore",
        "huggingface_hub", "huggingface_hub.file_download",
        "huggingface_hub.utils", "huggingface_hub._commit_api",
        "huggingface_hub.hub_mixin",
        "transformers", "transformers.configuration_utils",
        "transformers.modeling_utils", "transformers.tokenization_utils",
        "transformers.tokenization_utils_base",
        "transformers.image_processing_utils",
        "sentence_transformers", "sentence_transformers.SentenceTransformer",
        "sentence_transformers.util",
    ):
        logging.getLogger(_logger_name).setLevel(logging.ERROR)


@contextlib.contextmanager
def _suppress_fd_output():
    """Redirect stdout/stderr at the file-descriptor level.

    Unlike ``contextlib.redirect_stdout/stderr``, this captures output
    from sub-threads, C extensions, and logging handlers that cached a
    reference to the original ``sys.stdout``/``sys.stderr``.
    """
    old_stdout_fd = os.dup(1)
    old_stderr_fd = os.dup(2)
    devnull_fd = os.open(os.devnull, os.O_WRONLY)
    old_stdout_py = sys.stdout
    old_stderr_py = sys.stderr
    try:
        os.dup2(devnull_fd, 1)
        os.dup2(devnull_fd, 2)
        sys.stdout = io.StringIO()
        sys.stderr = io.StringIO()
        yield
    finally:
        sys.stdout = old_stdout_py
        sys.stderr = old_stderr_py
        os.dup2(old_stdout_fd, 1)
        os.dup2(old_stderr_fd, 2)
        os.close(old_stdout_fd)
        os.close(old_stderr_fd)
        os.close(devnull_fd)


def _log_model_loading_once(model_name: str) -> None:
    """Emit a single INFO line per process/model; subsequent attempts are DEBUG only."""
    key_hash = hashlib.sha1(str(model_name or "").encode("utf-8", errors="ignore")).hexdigest()[:16]
    env_key = f"MJR_AM_MODEL_LOAD_LOGGED_{key_hash}"
    if str(os.environ.get(env_key) or "").strip() == "1":
        logger.debug("Reusing previously logged model load event for '%s'", model_name)
        return
    try:
        os.environ[env_key] = "1"
    except Exception:
        pass
    logger.info("Loading multimodal embedding model '%s' …", model_name)

# ---------------------------------------------------------------------------
# Helpers: serialisation
# ---------------------------------------------------------------------------

_FLOAT_FMT = "f"  # 32-bit IEEE 754 float


def vector_to_blob(vec: list[float] | Any) -> bytes:
    """Pack a flat float list into a compact binary BLOB."""
    flat = list(vec)
    return struct.pack(f"<{len(flat)}{_FLOAT_FMT}", *flat)


def blob_to_vector(blob: bytes, dim: int | None = None) -> list[float]:
    """Unpack a binary BLOB back into a list of floats."""
    dim = dim or VECTOR_EMBEDDING_DIM
    return list(struct.unpack(f"<{dim}{_FLOAT_FMT}", blob))


def _encode_quiet(model: Any, payload: Any, **kwargs: Any) -> Any:
    if _ai_verbose_logs_enabled():
        return model.encode(payload, **kwargs)

    import logging as _stdlib_logging

    _hf_tok_logger = _stdlib_logging.getLogger("transformers.tokenization_utils_base")
    _prev_level = _hf_tok_logger.level
    _hf_tok_logger.setLevel(_stdlib_logging.ERROR)
    try:
        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            return model.encode(payload, **kwargs)
    finally:
        _hf_tok_logger.setLevel(_prev_level)


# ---------------------------------------------------------------------------
# Video key-frame extraction
# ---------------------------------------------------------------------------

def _extract_video_duration(video_path: str) -> float | None:
    """Use ffprobe to obtain video duration in seconds."""
    try:
        proc = subprocess.run(
            [
                str(FFPROBE_BIN),
                "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                str(video_path),
            ],
            capture_output=True,
            text=True,
            timeout=15,
        )
        if proc.returncode == 0 and proc.stdout.strip():
            return float(proc.stdout.strip())
    except Exception:
        pass
    return None


def _extract_frame_at(video_path: str, timestamp: float) -> PILImage.Image | None:
    """Extract a single video frame as a PIL Image at *timestamp* seconds."""
    try:
        from PIL import Image as PILImage  # noqa: F811

        proc = subprocess.run(
            [
                str(FFPROBE_BIN).replace("ffprobe", "ffmpeg"),
                "-ss", str(timestamp),
                "-i", str(video_path),
                "-frames:v", "1",
                "-f", "image2pipe",
                "-vcodec", "png",
                "-",
            ],
            capture_output=True,
            timeout=30,
        )
        if proc.returncode == 0 and proc.stdout:
            return PILImage.open(io.BytesIO(proc.stdout)).convert("RGB")
    except Exception as exc:
        logger.debug("Frame extraction at %.1fs failed: %s", timestamp, exc)
    return None


def extract_keyframes(video_path: str, interval: float | None = None) -> list[PILImage.Image]:
    """Return a list of key-frame PIL Images sampled every *interval* seconds."""
    interval = interval or VECTOR_VIDEO_KEYFRAME_INTERVAL
    duration = _extract_video_duration(video_path)
    if duration is None or duration <= 0:
        # Fallback: try a single frame at t=0
        frame = _extract_frame_at(video_path, 0.0)
        return [frame] if frame else []

    timestamps = []
    t = 0.0
    while t < duration:
        timestamps.append(t)
        t += interval
    # Always include a mid-point if duration > interval
    if duration > interval and (duration / 2) not in timestamps:
        timestamps.append(duration / 2)
    timestamps.sort()

    frames: list[PILImage.Image] = []
    for ts in timestamps:
        frame = _extract_frame_at(video_path, ts)
        if frame is not None:
            frames.append(frame)
    return frames


# ---------------------------------------------------------------------------
# VectorService
# ---------------------------------------------------------------------------

class VectorService:
    """Manages multimodal model lifecycle and embedding generation.

    The model is loaded lazily on the first call to any public method that
    needs it.  This keeps import time and memory footprint low when the
    vector-search feature is disabled.
    """

    def __init__(self, model_name: str | None = None, device: str | None = None) -> None:
        self._model_name = model_name or VECTOR_MODEL_NAME
        self._video_model_name = VECTOR_VIDEO_MODEL_NAME
        self._prompt_model_name = VECTOR_PROMPT_MODEL_NAME
        self._prompt_task = VECTOR_PROMPT_TASK
        self._device = device  # None → auto-detect (CPU / CUDA)
        self._model: SentenceTransformer | None = None
        self._lock = asyncio.Lock()
        self._video_model: Any | None = None
        self._video_processor: Any | None = None
        self._video_lock = asyncio.Lock()
        self._prompt_model: Any | None = None
        self._prompt_processor: Any | None = None
        self._prompt_lock = asyncio.Lock()
        self._dim = VECTOR_EMBEDDING_DIM
        self._last_error: str = ""
        self._last_error_at: str | None = None
        self._error_count: int = 0
        self._truncation_log_window_start: float = 0.0
        self._truncation_log_count: int = 0

    # ── Model lifecycle ────────────────────────────────────────────────

    def _load_model(self) -> SentenceTransformer:
        """Synchronous model loading (called inside a thread).

        Uses a process-wide ``_MODEL_CACHE`` (guarded by
        ``_MODEL_CACHE_LOCK``) so that even when multiple
        ``VectorService`` instances exist the heavy model is loaded
        at most **once**.
        """
        cache_key = (str(self._model_name or ""), str(self._device or "auto"))

        with _MODEL_CACHE_LOCK:
            cached_model = _MODEL_CACHE.get(cache_key)
        if cached_model is not None:
            self._cached_tokenizer = self._discover_tokenizer(cached_model)
            logger.debug("Reusing cached multimodal model '%s'", self._model_name)
            return cached_model

        # Import first, THEN silence — the import itself reconfigures
        # loggers, which would override earlier settings.
        from sentence_transformers import SentenceTransformer  # noqa: F811
        from transformers.utils import logging as hf_logging
        _configure_hf_quiet_mode()

        # Pre-check whether SentenceTransformer accepts model_kwargs /
        # tokenizer_kwargs so we never load the model only to discard
        # it on TypeError.
        import inspect as _inspect
        _st_sig = _inspect.signature(SentenceTransformer.__init__)
        _accepts_model_kw = "model_kwargs" in _st_sig.parameters
        _accepts_tok_kw = "tokenizer_kwargs" in _st_sig.parameters

        with _MODEL_CACHE_LOCK:
            cached_model = _MODEL_CACHE.get(cache_key)
            if cached_model is not None:
                self._cached_tokenizer = self._discover_tokenizer(cached_model)
                logger.debug("Reusing cached multimodal model '%s'", self._model_name)
                return cached_model

            _log_model_loading_once(self._model_name)
            previous_hf_verbosity = hf_logging.get_verbosity()
            verbose = _ai_verbose_logs_enabled()
            if not verbose:
                hf_logging.set_verbosity_error()
                _configure_hf_quiet_mode()  # re-apply in case another thread reset loggers
            try:
                st_kwargs: dict[str, Any] = {
                    "model_name_or_path": self._model_name,
                    "device": self._device,
                }
                # use_fast only applies to tokenizers/processors, NOT to models.
                if _accepts_tok_kw:
                    st_kwargs["tokenizer_kwargs"] = {"use_fast": False}

                with warnings.catch_warnings():
                    warnings.filterwarnings(
                        "ignore",
                        message=r"Using a slow image processor as `use_fast` is unset.*",
                    )
                    if verbose:
                        model = SentenceTransformer(**st_kwargs)
                    else:
                        # Redirect at fd-level to suppress native print()
                        # from transformers internals AND sub-threads.
                        with _suppress_fd_output():
                            model = SentenceTransformer(**st_kwargs)
            finally:
                hf_logging.set_verbosity(previous_hf_verbosity)
            _MODEL_CACHE[cache_key] = model
            logger.debug("Model cached under key %s", cache_key)

        # ── Patch SigLIP-family configs missing top-level hidden_size ──
        # SentenceTransformer's pooling layer reads ``config.hidden_size``
        # but SigLIP2's top-level ``SiglipConfig`` stores it only inside
        # ``text_config`` / ``vision_config``.  Patching the config after
        # construction prevents ``AttributeError`` during ``encode()``.
        try:
            _patch_targets = []
            _first_mod_fn = getattr(model, "_first_module", None)
            _first_mod = _first_mod_fn() if callable(_first_mod_fn) else None
            if _first_mod is not None:
                for _attr_name in ("model", "auto_model"):
                    _inner = getattr(_first_mod, _attr_name, None)
                    if _inner is not None:
                        _cfg = getattr(_inner, "config", None)
                        if _cfg is not None:
                            _patch_targets.append(_cfg)
            # Also check top-level model.config
            _top_cfg = getattr(model, "config", None)
            if _top_cfg is not None:
                _patch_targets.append(_top_cfg)

            for _cfg in _patch_targets:
                if not hasattr(_cfg, "hidden_size"):
                    # Try text_config.hidden_size → vision_config.hidden_size
                    _hs = None
                    for _sub in ("text_config", "vision_config"):
                        _sub_cfg = getattr(_cfg, _sub, None)
                        if _sub_cfg is not None:
                            _hs = getattr(_sub_cfg, "hidden_size", None)
                            if _hs is not None and int(_hs) > 0:
                                break
                    if _hs is not None and int(_hs) > 0:
                        _cfg.hidden_size = int(_hs)
                        logger.debug(
                            "Patched missing config.hidden_size = %d (from sub-config)",
                            _hs,
                        )
        except Exception as exc:
            logger.debug("Config hidden_size patch skipped: %s", exc)

        # ── Force CLIP/SigLIP style token limit ─────────────────────
        # SentenceTransformer may default to a higher max_seq_length.
        # CLIP's hard limit is 77 tokens; exceeding it triggers a noisy
        # HuggingFace warning *and* risks silent embedding corruption.
        clip_max = 77
        current_max = getattr(model, "max_seq_length", None)
        if current_max is None or int(current_max) > clip_max:
            model.max_seq_length = clip_max
            logger.debug("Capped model.max_seq_length %s → %d", current_max, clip_max)

        # ── Diagnostic: discover tokenizer location ─────────────────
        self._cached_tokenizer = self._discover_tokenizer(model)

        effective_dim = self._resolve_sentence_embedding_dim(model)
        log_success(
            logger,
            "SigLIP2 model loaded and ready: '%s' (dim=%d, max_seq=%d, tokenizer=%s)"
            % (
                self._model_name,
                effective_dim,
                model.max_seq_length,
                type(self._cached_tokenizer).__name__ if self._cached_tokenizer else "NOT_FOUND",
            ),
        )
        return model

    def _resolve_sentence_embedding_dim(self, model: SentenceTransformer) -> int:
        """Resolve embedding dimension with robust fallbacks for model/config quirks."""
        try:
            parsed_dim = model.get_sentence_embedding_dimension()
            if parsed_dim is not None and int(parsed_dim) > 0:
                return int(parsed_dim)
        except Exception as exc:
            logger.debug("Could not read sentence embedding dim directly: %s", exc)

        try:
            probe = _encode_quiet(
                model,
                ["dim probe"],
                convert_to_numpy=True,
                normalize_embeddings=True,
                show_progress_bar=False,
            )
            shape = tuple(getattr(probe, "shape", ()) or ())
            if len(shape) >= 2 and int(shape[-1]) > 0:
                return int(shape[-1])
            if len(shape) == 1 and int(shape[0]) > 0:
                return int(shape[0])

            if isinstance(probe, (list, tuple)) and probe:
                first = probe[0]
                if isinstance(first, (list, tuple)):
                    return int(len(first))
                if isinstance(first, (int, float)):
                    return int(len(probe))
        except Exception as exc:
            logger.debug("Could not infer sentence embedding dim from probe: %s", exc)

        return int(VECTOR_EMBEDDING_DIM)

    def _discover_tokenizer(self, model: SentenceTransformer) -> Any | None:
        """Walk the model structure to find a usable HF tokenizer and cache it.

        A usable tokenizer must have ``.tokenize()``, ``.encode()``, and
        ``.decode()`` methods.  ``CLIPProcessor`` objects are automatically
        unwrapped to their inner ``.tokenizer``.
        """
        tokenizer: Any | None = None

        def _unwrap(obj: Any) -> Any | None:
            """If *obj* is a processor wrapping a real tokenizer, return the inner tokenizer."""
            if obj is None:
                return None
            # Already a real tokenizer?
            if hasattr(obj, "tokenize") and hasattr(obj, "encode") and hasattr(obj, "decode"):
                return obj
            # Processor wrapping a tokenizer (e.g. CLIPProcessor)?
            inner = getattr(obj, "tokenizer", None)
            if inner is not None and hasattr(inner, "tokenize") and hasattr(inner, "encode"):
                logger.debug("Unwrapped %s → %s", type(obj).__name__, type(inner).__name__)
                return inner
            return None

        # 1) _first_module().tokenizer / .processor.tokenizer
        try:
            first_module_getter = getattr(model, "_first_module", None)
            first_module = first_module_getter() if callable(first_module_getter) else None
            if first_module is not None:
                tokenizer = _unwrap(getattr(first_module, "tokenizer", None))
                if tokenizer is None:
                    proc = getattr(first_module, "processor", None)
                    tokenizer = _unwrap(proc)
        except Exception:
            pass

        # 2) model.tokenizer (newer SentenceTransformer versions)
        if tokenizer is None:
            tokenizer = _unwrap(getattr(model, "tokenizer", None))

        # 3) Walk _modules OrderedDict
        if tokenizer is None:
            try:
                modules_obj = getattr(model, "_modules", None)
                if isinstance(modules_obj, dict):
                    for _name, module in modules_obj.items():
                        tokenizer = _unwrap(getattr(module, "tokenizer", None))
                        if tokenizer is not None:
                            logger.debug("Found tokenizer in _modules['%s']", _name)
                            break
                        proc = getattr(module, "processor", None)
                        tokenizer = _unwrap(proc)
                        if tokenizer is not None:
                            logger.debug("Found tokenizer in _modules['%s'].processor", _name)
                            break
            except Exception:
                pass

        # 4) Deep walk: any public attribute that looks like a tokenizer
        if tokenizer is None:
            try:
                for attr_name in dir(model):
                    if attr_name.startswith("_"):
                        continue
                    candidate = _unwrap(getattr(model, attr_name, None))
                    if candidate is not None:
                        tokenizer = candidate
                        logger.debug("Found tokenizer via deep walk: model.%s", attr_name)
                        break
            except Exception:
                pass

        if tokenizer is None:
            # Log model structure for future debugging
            try:
                module_names = list(getattr(model, "_modules", {}).keys())
                first_module_getter = getattr(model, "_first_module", None)
                fm = first_module_getter() if callable(first_module_getter) else None
                fm_attrs = [a for a in dir(fm) if not a.startswith("_")] if fm else []
                logger.warning(
                    "Tokenizer NOT FOUND. Model modules: %s  First module attrs: %s",
                    module_names,
                    fm_attrs[:30],
                )
            except Exception:
                logger.warning("CLIP tokenizer NOT FOUND and model introspection failed")

        return tokenizer

    async def _ensure_model(self) -> SentenceTransformer:
        """Thread-safe lazy initialisation of the model."""
        if self._model is not None:
            return self._model
        async with self._lock:
            if self._model is not None:
                return self._model
            self._model = await asyncio.to_thread(self._load_model)
            self._dim = self._resolve_sentence_embedding_dim(self._model)
            return self._model

    @property
    def dim(self) -> int:
        return self._dim

    def _record_error(self, message: str) -> None:
        self._last_error = str(message or "").strip()
        self._last_error_at = dt.datetime.now(dt.timezone.utc).isoformat()
        self._error_count = int(self._error_count or 0) + 1

    def _clear_error(self) -> None:
        self._last_error = ""
        self._last_error_at = None

    def get_runtime_status(self) -> dict[str, Any]:
        return {
            "model_name": self._model_name,
            "video_model_name": self._video_model_name,
            "prompt_model_name": self._prompt_model_name,
            "loaded": bool(self._model is not None),
            "dim": int(self._dim),
            "last_error": self._last_error or None,
            "last_error_at": self._last_error_at,
            "error_count": int(self._error_count or 0),
            "degraded": bool(self._last_error),
        }

    def _log_text_truncation(self, original: str, truncated: str, reason: str) -> None:
        if not original or not truncated:
            return
        if original == truncated:
            return

        now = time.monotonic()
        if (now - self._truncation_log_window_start) > 10.0:
            self._truncation_log_window_start = now
            self._truncation_log_count = 0
        if self._truncation_log_count >= 5:
            return
        self._truncation_log_count += 1

        preview = " ".join(str(original).split())[:120]
        logger.debug(
            "Model text truncated (%s): %d→%d chars, preview='%s…'",
            str(reason or "unknown"),
            len(original),
            len(truncated),
            preview,
        )

    def _truncate_text_for_model(self, model: SentenceTransformer, text: str) -> str:
        cleaned = " ".join(str(text or "").split()).strip()
        if not cleaned:
            return ""

        max_len: int | None = 77
        try:
            max_len = int(getattr(model, "max_seq_length", 77) or 77)
        except Exception:
            max_len = 77

        # Use cached tokenizer from model load (avoids repeated discovery)
        tokenizer = getattr(self, "_cached_tokenizer", None)
        if tokenizer is not None:
            try:
                tokenizer_max_len: int | None = None
                try:
                    raw_tok_max = int(getattr(tokenizer, "model_max_length", 0) or 0)
                    if 0 < raw_tok_max < 100000:
                        tokenizer_max_len = raw_tok_max
                except Exception:
                    pass

                effective_max_len = max(4, int(max_len or 77))
                if tokenizer_max_len is not None:
                    effective_max_len = max(4, min(effective_max_len, int(tokenizer_max_len)))

                full_token_len: int | None = None
                try:
                    token_count = len(tokenizer.tokenize(cleaned))
                    full_token_len = int(token_count) + 2
                except Exception:
                    pass

                token_ids = tokenizer.encode(
                    cleaned,
                    add_special_tokens=True,
                    truncation=True,
                    max_length=effective_max_len,
                )
                decoded = tokenizer.decode(token_ids, skip_special_tokens=True).strip()
                if decoded:
                    if full_token_len is not None and full_token_len > effective_max_len:
                        self._log_text_truncation(
                            cleaned,
                            decoded,
                            f"tokenizer {full_token_len}→{effective_max_len} tokens",
                        )
                    return decoded
            except Exception:
                pass

        # Fallback when tokenizer is unavailable: clamp both words and characters.
        # CLIP BPE averages ~3.5 tokens/word, so 18 words ≈ 63 tokens (safe under 77).
        original_for_fallback = cleaned
        words = cleaned.split()
        if len(words) > 18:
            cleaned = " ".join(words[:18])
        if len(cleaned) > 140:
            cleaned = cleaned[:140].rsplit(" ", 1)[0].strip() or cleaned[:140].strip()
        if cleaned != original_for_fallback:
            self._log_text_truncation(
                original_for_fallback,
                cleaned,
                f"fallback {len(original_for_fallback.split())}→{len(cleaned.split())} words",
            )
        return cleaned

    def _text_retry_candidates(self, model: SentenceTransformer, text: str) -> list[str]:
        base = self._truncate_text_for_model(model, text)
        if not base:
            return []

        words = base.split()
        if not words:
            return [base]

        ratios = (1.0, 0.85, 0.7, 0.55, 0.4, 0.3, 0.2, 0.12)
        candidates: list[str] = []
        seen: set[str] = set()
        for ratio in ratios:
            count = max(1, int(len(words) * ratio))
            candidate = " ".join(words[:count]).strip()
            if candidate and candidate not in seen:
                seen.add(candidate)
                candidates.append(candidate)

        if base not in seen:
            candidates.insert(0, base)
        return candidates

    # ── Image embeddings ───────────────────────────────────────────────

    async def get_image_embedding(self, path: str | Path) -> Result[list[float]]:
        """Generate an embedding vector for a single image file.

        Returns ``Result.Ok(list[float])`` or ``Result.Err(...)`` when the
        file is unreadable / not a valid image.
        """
        try:
            from PIL import Image as PILImage  # noqa: F811
        except ImportError:
            return Result.Err("TOOL_MISSING", "Pillow is required for image embeddings")

        path = Path(path)
        if not path.is_file():
            return Result.Err("NOT_FOUND", f"Image file not found: {path.name}")

        try:
            img = await asyncio.to_thread(lambda: PILImage.open(str(path)).convert("RGB"))
        except Exception as exc:
            return Result.Err("UNSUPPORTED", f"Cannot open image: {exc}")

        try:
            model = await self._ensure_model()
            vec = await asyncio.to_thread(
                lambda: _encode_quiet(
                    model,
                    cast(Any, img),
                    convert_to_numpy=True,
                    show_progress_bar=False,
                )
            )
            self._clear_error()
            return Result.Ok(_normalise_vector(vec))
        except Exception as exc:
            self._record_error(f"Image embedding failed for {path.name}: {exc}")
            logger.debug("Image embedding failed for %s: %s", path.name, exc)
            return Result.Err("METADATA_FAILED", f"Embedding failed: {exc}")

    # ── Text embeddings ────────────────────────────────────────────────

    async def get_text_embedding(self, text: str) -> Result[list[float]]:
        """Encode a free-form text query into the multimodal embedding space."""
        if not text or not text.strip():
            return Result.Err("INVALID_INPUT", "Text query cannot be empty")
        try:
            model = await self._ensure_model()
        except Exception as exc:
            self._record_error(f"Text embedding model unavailable: {exc}")
            logger.debug("Text embedding model unavailable: %s", exc)
            return Result.Err("SERVICE_UNAVAILABLE", f"Text embedding model unavailable: {exc}")
        last_exc: Exception | None = None
        for candidate in self._text_retry_candidates(model, text):
            try:
                def _encode_text(q: str = candidate) -> Any:
                    return _encode_quiet(
                        model, q, convert_to_numpy=True, show_progress_bar=False,
                    )

                vec = await asyncio.to_thread(_encode_text)
                self._clear_error()
                return Result.Ok(_normalise_vector(vec))
            except Exception as exc:
                last_exc = exc
                msg = str(exc).lower()
                if "max_position_embeddings" in msg or "sequence length" in msg:
                    continue
                self._record_error(f"Text embedding failed: {exc}")
                logger.debug("Text embedding failed: %s", exc)
                return Result.Err("METADATA_FAILED", f"Text embedding failed: {exc}")

        final_exc = last_exc or RuntimeError("Unknown text embedding failure")
        self._record_error(f"Text embedding failed after truncation retries: {final_exc}")
        logger.debug("Text embedding failed after all truncation retries: %s", final_exc)
        return Result.Err("METADATA_FAILED", f"Text embedding failed: {final_exc}")

    # ── Batch embeddings ──────────────────────────────────────────────

    async def get_image_embeddings_batch(
        self, paths: Sequence[str | Path]
    ) -> list[Result[list[float]]]:
        """Compute embeddings for a batch of images.

        Returns a list of ``Result`` objects in the same order as *paths*.
        Individual failures do **not** abort the whole batch.
        """
        try:
            from PIL import Image as PILImage  # noqa: F811
        except ImportError:
            return [Result.Err("TOOL_MISSING", "Pillow is required")] * len(paths)

        model = await self._ensure_model()

        results: list[Result[list[float]]] = []
        batch_imgs: list[Any] = []
        batch_indices: list[int] = []

        # Pre-load images
        for idx, p in enumerate(paths):
            p = Path(p)
            if not p.is_file():
                results.append(Result.Err("NOT_FOUND", f"File not found: {p.name}"))
                continue
            try:
                img = PILImage.open(str(p)).convert("RGB")
                batch_imgs.append(img)
                batch_indices.append(idx)
                results.append(Result.Ok([]))  # placeholder
            except Exception as exc:
                results.append(Result.Err("UNSUPPORTED", f"Cannot open image: {exc}"))

        # Encode in sub-batches
        for start in range(0, len(batch_imgs), VECTOR_BATCH_SIZE):
            sub = batch_imgs[start : start + VECTOR_BATCH_SIZE]
            sub_idx = batch_indices[start : start + VECTOR_BATCH_SIZE]
            try:
                def _encode_batch(s: list[Any] = sub) -> Any:
                    return _encode_quiet(
                        model, cast(Any, s),
                        convert_to_numpy=True, batch_size=len(s),
                        show_progress_bar=False,
                    )

                vecs = await asyncio.to_thread(_encode_batch)
                for i, vec in zip(sub_idx, vecs, strict=True):
                    results[i] = Result.Ok(_normalise_vector(vec))
            except Exception as exc:
                self._record_error(f"Batch embedding failed (batch {start}): {exc}")
                logger.debug("Batch embedding failed (batch %d): %s", start, exc)
                for i in sub_idx:
                    results[i] = Result.Err("METADATA_FAILED", f"Batch embedding failed: {exc}")

        if any(bool(r.ok) for r in results):
            self._clear_error()

        return results

    # ── Video embeddings ───────────────────────────────────────────────

    async def get_video_embedding(self, path: str | Path) -> Result[list[float]]:
        """Generate an embedding for a video by averaging key-frame embeddings."""
        path = Path(path)
        if not path.is_file():
            return Result.Err("NOT_FOUND", f"Video file not found: {path.name}")

        xclip_result = await self._get_video_embedding_xclip(path)
        if xclip_result.ok and xclip_result.data:
            self._clear_error()
            return xclip_result

        frames = await asyncio.to_thread(extract_keyframes, str(path))
        if not frames:
            return Result.Err("UNSUPPORTED", "No frames could be extracted from video")

        try:
            import numpy as np  # noqa: F811

            model = await self._ensure_model()
            vecs = await asyncio.to_thread(
                lambda: _encode_quiet(
                    model,
                    cast(Any, frames),
                    convert_to_numpy=True,
                    batch_size=min(len(frames), VECTOR_BATCH_SIZE),
                    show_progress_bar=False,
                )
            )
            mean_vec = np.mean(vecs, axis=0)
            self._clear_error()
            return Result.Ok(_normalise_vector(mean_vec))
        except Exception as exc:
            self._record_error(f"Video embedding failed for {path.name}: {exc}")
            logger.debug("Video embedding failed for %s: %s", path.name, exc)
            return Result.Err("METADATA_FAILED", f"Video embedding failed: {exc}")

    async def generate_enhanced_caption(self, path: str | Path) -> Result[str]:
        """Generate a long descriptive caption for an image using Florence-2."""
        path = Path(path)
        if not path.is_file():
            return Result.Err("NOT_FOUND", f"Image file not found: {path.name}")
        try:
            from PIL import Image as PILImage  # noqa: F811
        except ImportError:
            return Result.Err("TOOL_MISSING", "Pillow is required for enhanced captions")

        try:
            processor, model, torch = await self._ensure_florence_components()
        except Exception as exc:
            self._record_error(f"Florence-2 unavailable: {exc}")
            return Result.Err("SERVICE_UNAVAILABLE", f"Florence-2 unavailable: {exc}")

        try:
            image = await asyncio.to_thread(lambda: PILImage.open(str(path)).convert("RGB"))

            def _infer_caption() -> str:
                with torch.inference_mode():
                    inputs = processor(
                        text=self._prompt_task,
                        images=image,
                        return_tensors="pt",
                    )
                    generated = model.generate(
                        input_ids=inputs.get("input_ids"),
                        pixel_values=inputs.get("pixel_values"),
                        max_new_tokens=160,
                        num_beams=3,
                    )
                    text = processor.batch_decode(generated, skip_special_tokens=True)[0]
                    text = str(text or "").strip()
                    post = getattr(processor, "post_process_generation", None)
                    if callable(post):
                        try:
                            parsed = post(text, task=self._prompt_task, image_size=image.size)
                            if isinstance(parsed, dict):
                                val = parsed.get(self._prompt_task)
                                if isinstance(val, str) and val.strip():
                                    text = val.strip()
                        except Exception:
                            pass
                    return text

            caption = await asyncio.to_thread(_infer_caption)
            if not caption:
                return Result.Err("METADATA_FAILED", "Enhanced caption generation returned empty output")
            self._clear_error()
            return Result.Ok(caption)
        except Exception as exc:
            self._record_error(f"Enhanced caption generation failed: {exc}")
            logger.debug("Enhanced caption generation failed for %s: %s", path.name, exc)
            return Result.Err("METADATA_FAILED", f"Enhanced caption generation failed: {exc}")

    # ── Similarity helpers ─────────────────────────────────────────────

    @staticmethod
    def cosine_similarity(a: list[float], b: list[float]) -> float:
        """Compute cosine similarity between two vectors (pure-Python fallback)."""
        dot = sum(x * y for x, y in zip(a, b, strict=True))
        norm_a = sum(x * x for x in a) ** 0.5
        norm_b = sum(x * x for x in b) ** 0.5
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot / (norm_a * norm_b)

    async def _ensure_florence_components(self) -> tuple[Any, Any, Any]:
        if self._prompt_model is not None and self._prompt_processor is not None:
            import torch

            return self._prompt_processor, self._prompt_model, torch

        async with self._prompt_lock:
            if self._prompt_model is None or self._prompt_processor is None:
                import torch
                from transformers import AutoModelForCausalLM, AutoProcessor
                from transformers.utils import logging as hf_logging
                _configure_hf_quiet_mode()  # apply AFTER imports

                logger.info("Loading Florence prompt model '%s' …", self._prompt_model_name)
                previous_hf_verbosity = hf_logging.get_verbosity()
                verbose = _ai_verbose_logs_enabled()
                if not verbose:
                    hf_logging.set_verbosity_error()
                try:
                    if verbose:
                        self._prompt_processor = AutoProcessor.from_pretrained(
                            self._prompt_model_name,
                            trust_remote_code=True,
                            use_fast=False,
                        )
                        self._prompt_model = AutoModelForCausalLM.from_pretrained(
                            self._prompt_model_name,
                            trust_remote_code=True,
                        )
                    else:
                        with _suppress_fd_output():
                            self._prompt_processor = AutoProcessor.from_pretrained(
                                self._prompt_model_name,
                                trust_remote_code=True,
                                use_fast=False,
                            )
                            self._prompt_model = AutoModelForCausalLM.from_pretrained(
                                self._prompt_model_name,
                                trust_remote_code=True,
                            )
                finally:
                    hf_logging.set_verbosity(previous_hf_verbosity)
                self._prompt_model.eval()
                log_success(logger, "Florence-2 model loaded and ready: '%s'" % self._prompt_model_name)
            import torch

            return self._prompt_processor, self._prompt_model, torch

    async def _ensure_xclip_components(self) -> tuple[Any, Any]:
        if self._video_model is not None and self._video_processor is not None:
            return self._video_processor, self._video_model

        async with self._video_lock:
            if self._video_model is None or self._video_processor is None:
                from transformers import AutoModel, AutoProcessor
                from transformers.utils import logging as hf_logging
                _configure_hf_quiet_mode()  # apply AFTER imports

                logger.info("Loading video embedding model '%s' …", self._video_model_name)
                previous_hf_verbosity = hf_logging.get_verbosity()
                verbose = _ai_verbose_logs_enabled()
                if not verbose:
                    hf_logging.set_verbosity_error()
                try:
                    if verbose:
                        self._video_processor = AutoProcessor.from_pretrained(
                            self._video_model_name,
                            use_fast=False,
                        )
                        self._video_model = AutoModel.from_pretrained(self._video_model_name)
                    else:
                        with _suppress_fd_output():
                            self._video_processor = AutoProcessor.from_pretrained(
                                self._video_model_name,
                                use_fast=False,
                            )
                            self._video_model = AutoModel.from_pretrained(self._video_model_name)
                finally:
                    hf_logging.set_verbosity(previous_hf_verbosity)
                try:
                    self._video_model.eval()
                except Exception:
                    pass
                log_success(logger, "X-CLIP video model loaded and ready: '%s'" % self._video_model_name)
            return self._video_processor, self._video_model

    async def _get_video_embedding_xclip(self, path: Path) -> Result[list[float]]:
        model_name = str(self._video_model_name or "").strip()
        if not model_name:
            return Result.Err("SERVICE_UNAVAILABLE", "Video model disabled")

        try:
            processor, model = await self._ensure_xclip_components()
            frames = await asyncio.to_thread(extract_keyframes, str(path))
            if not frames:
                return Result.Err("UNSUPPORTED", "No frames extracted for X-CLIP")

            def _encode_frames() -> list[float]:
                import numpy as np
                import torch

                rgb_frames = [f.convert("RGB") for f in frames]
                with torch.inference_mode():
                    inputs = processor(images=rgb_frames, return_tensors="pt", padding=True)
                    if hasattr(model, "get_image_features"):
                        feats = model.get_image_features(pixel_values=inputs["pixel_values"])
                    else:
                        out = model(**inputs)
                        feats = getattr(out, "pooler_output", None)
                        if feats is None:
                            feats = getattr(out, "last_hidden_state", None)
                            if feats is None:
                                raise RuntimeError("X-CLIP output does not expose usable features")
                            feats = feats.mean(dim=1)
                    arr = feats.detach().cpu().numpy()
                    mean_vec = np.mean(arr, axis=0)
                    vec = _normalise_vector(mean_vec)
                    return _coerce_vector_dim(vec, self._dim)

            vec = await asyncio.to_thread(_encode_frames)
            return Result.Ok(vec)
        except Exception as exc:
            logger.debug("X-CLIP video embedding failed for %s: %s", path.name, exc)
            return Result.Err("METADATA_FAILED", f"X-CLIP video embedding failed: {exc}")


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _normalise_vector(vec: Any) -> list[float]:
    """Flatten a numpy array to ``list[float]`` and L2-normalise it."""
    import numpy as np  # noqa: F811

    arr = np.asarray(vec, dtype=np.float32).flatten()
    norm = np.linalg.norm(arr)
    if norm > 0:
        arr = arr / norm
    return arr.tolist()


def _coerce_vector_dim(vec: list[float], dim: int) -> list[float]:
    if len(vec) == dim:
        return vec
    if len(vec) > dim:
        out = vec[:dim]
    else:
        out = vec + ([0.0] * (dim - len(vec)))
    return _normalise_vector(out)
