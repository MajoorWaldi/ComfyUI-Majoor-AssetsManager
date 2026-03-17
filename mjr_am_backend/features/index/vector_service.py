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
import hashlib
import io
import logging
import math
import os
import struct
import subprocess
import sys
import threading
import time
import warnings
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
    VECTOR_VIDEO_KEYFRAME_INTERVAL,
    VECTOR_VIDEO_MODEL_NAME,
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
    # NOTE: HF_HUB_DISABLE_PROGRESS_BARS and TQDM_DISABLE are intentionally
    # NOT set — download progress bars are kept visible for user feedback.
    os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
    os.environ["HF_HUB_DISABLE_EXPERIMENTAL_WARNING"] = "1"
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
def _suppress_stdout_only():
    """Redirect stdout to /dev/null while keeping stderr (tqdm progress bars).

    Download progress bars write to stderr, so they remain visible.
    Only stdout noise (e.g. ``print()`` from transformers internals) is captured.
    """
    old_stdout_fd = os.dup(1)
    devnull_fd = os.open(os.devnull, os.O_WRONLY)
    old_stdout_py = sys.stdout
    try:
        os.dup2(devnull_fd, 1)
        sys.stdout = io.StringIO()
        yield
    finally:
        sys.stdout = old_stdout_py
        os.dup2(old_stdout_fd, 1)
        os.close(old_stdout_fd)
        os.close(devnull_fd)


def _log_model_loading_once(model_name: str) -> None:
    """Emit a single INFO line per process/model; subsequent attempts are DEBUG only."""
    key_hash = hashlib.sha256(str(model_name or "").encode("utf-8", errors="ignore")).hexdigest()[:16]
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


def _extract_keyframes_cv2(video_path: str, interval: float) -> list[PILImage.Image]:
    """Fallback: extract key-frames using OpenCV when ffprobe/ffmpeg are unavailable."""
    try:
        import cv2
        from PIL import Image as PILImage  # noqa: F811
    except ImportError:
        return []

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        logger.debug("cv2.VideoCapture failed to open %s", video_path)
        return []

    try:
        fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        duration = total_frames / fps if fps > 0 and total_frames > 0 else 0.0

        if duration <= 0:
            # Try a single frame
            ret, frame_bgr = cap.read()
            if ret and frame_bgr is not None:
                frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
                return [PILImage.fromarray(frame_rgb)]
            return []

        timestamps: list[float] = []
        t = 0.0
        while t < duration:
            timestamps.append(t)
            t += interval
        if duration > interval and (duration / 2) not in timestamps:
            timestamps.append(duration / 2)
        timestamps.sort()

        frames: list[PILImage.Image] = []
        for ts in timestamps:
            frame_no = int(ts * fps)
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_no)
            ret, frame_bgr = cap.read()
            if ret and frame_bgr is not None:
                frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
                frames.append(PILImage.fromarray(frame_rgb))
        return frames
    finally:
        cap.release()


def extract_keyframes(video_path: str, interval: float | None = None) -> list[PILImage.Image]:
    """Return a list of key-frame PIL Images sampled every *interval* seconds.

    Tries ffprobe/ffmpeg first, then falls back to OpenCV (cv2) if the
    ffmpeg-based extraction yields no frames.
    """
    interval = interval or VECTOR_VIDEO_KEYFRAME_INTERVAL
    duration = _extract_video_duration(video_path)
    if duration is None or duration <= 0:
        # Fallback: try a single frame at t=0
        frame = _extract_frame_at(video_path, 0.0)
        if frame:
            return [frame]
        # ffmpeg unavailable — try OpenCV
        return _extract_keyframes_cv2(video_path, interval)

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
    # If ffmpeg extraction failed for every frame, fall back to OpenCV
    if not frames:
        frames = _extract_keyframes_cv2(video_path, interval)
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

    @staticmethod
    def _normalise_model_name(value: Any, fallback: str) -> str:
        raw = str(value or "").strip()
        if not raw or raw.lower() in {"none", "null"}:
            return str(fallback).strip()
        return raw

    def __init__(self, model_name: str | None = None, device: str | None = None) -> None:
        self._model_name = self._normalise_model_name(model_name or VECTOR_MODEL_NAME, "google/siglip-so400m-patch14-384")
        self._video_model_name = self._normalise_model_name(VECTOR_VIDEO_MODEL_NAME, "microsoft/xclip-base-patch32")
        self._prompt_model_name = self._normalise_model_name(VECTOR_PROMPT_MODEL_NAME, "microsoft/Florence-2-base")
        self._prompt_task = str(VECTOR_PROMPT_TASK or "<MORE_DETAILED_CAPTION>").strip() or "<MORE_DETAILED_CAPTION>"
        self._device = device  # None → auto-detect (CPU / CUDA)
        self._model: SentenceTransformer | None = None
        self._lock = asyncio.Lock()
        self._video_model: Any | None = None
        self._video_processor: Any | None = None
        self._video_lock = asyncio.Lock()
        self._siglip_model: Any | None = None
        self._siglip_processor: Any | None = None
        self._siglip_lock = asyncio.Lock()
        self._prompt_model: Any | None = None
        self._prompt_processor: Any | None = None
        self._prompt_lock = asyncio.Lock()
        self._text_query_warmed = False
        self._text_query_warm_lock = asyncio.Lock()
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

        # Fix C-1: do NOT hold _MODEL_CACHE_LOCK during model loading.
        # Holding threading.Lock for 10-30s blocks all other thread-pool threads.
        # Pattern: check-under-lock, load-without-lock, write-under-lock.
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
                    message=r"Using a slow image processor as  is unset.*",
                )
                warnings.filterwarnings(
                    "ignore",
                    message=r".*huggingface_hub.*cache-system uses symlinks.*",
                )
                self._patch_global_siglip_config_hidden_size()

                def _build_st_model() -> Any:
                    if verbose:
                        return SentenceTransformer(**st_kwargs)
                    # Redirect stdout only; stderr (tqdm) stays visible.
                    with _suppress_stdout_only():
                        return SentenceTransformer(**st_kwargs)

                try:
                    model = _build_st_model()
                except Exception as exc:
                    if not self._is_hidden_size_error(exc):
                        raise
                    self._patch_global_siglip_config_hidden_size()
                    logger.debug("Retrying SentenceTransformer load after hidden_size class patch")
                    model = _build_st_model()
        finally:
            hf_logging.set_verbosity(previous_hf_verbosity)

        # Write to cache under lock.  If another thread loaded the same model
        # concurrently, reuse theirs to keep a single shared instance.
        with _MODEL_CACHE_LOCK:
            existing = _MODEL_CACHE.get(cache_key)
            if existing is not None:
                logger.debug("Concurrent load: reusing cached model '%s'", self._model_name)
                model = existing
            else:
                _MODEL_CACHE[cache_key] = model
                logger.debug("Model cached under key %s", cache_key)

        # ── Patch SigLIP-family configs missing top-level hidden_size ──
        self._patch_model_hidden_size(model)

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
        tokenizer = (
            self._tokenizer_from_first_module(model)
            or self._tokenizer_from_model_attr(model)
            or self._tokenizer_from_modules_dict(model)
            or self._tokenizer_from_deep_walk(model)
        )
        if tokenizer is None:
            self._log_tokenizer_not_found(model)
        return tokenizer

    @staticmethod
    def _unwrap_tokenizer(obj: Any) -> Any | None:
        """Return *obj* if it is a usable tokenizer, unwrap processor wrappers, else None."""
        if obj is None:
            return None
        if hasattr(obj, "tokenize") and hasattr(obj, "encode") and hasattr(obj, "decode"):
            return obj
        inner = getattr(obj, "tokenizer", None)
        if inner is not None and hasattr(inner, "tokenize") and hasattr(inner, "encode"):
            logger.debug("Unwrapped %s → %s", type(obj).__name__, type(inner).__name__)
            return inner
        return None

    def _tokenizer_from_first_module(self, model: SentenceTransformer) -> Any | None:
        """Strategy 1: _first_module().tokenizer / .processor."""
        try:
            first_module_getter = getattr(model, "_first_module", None)
            first_module = first_module_getter() if callable(first_module_getter) else None
            if first_module is not None:
                tok = self._unwrap_tokenizer(getattr(first_module, "tokenizer", None))
                if tok is None:
                    tok = self._unwrap_tokenizer(getattr(first_module, "processor", None))
                return tok
        except Exception:
            pass
        return None

    def _tokenizer_from_model_attr(self, model: SentenceTransformer) -> Any | None:
        """Strategy 2: model.tokenizer (newer SentenceTransformer versions)."""
        return self._unwrap_tokenizer(getattr(model, "tokenizer", None))

    def _tokenizer_from_modules_dict(self, model: SentenceTransformer) -> Any | None:
        """Strategy 3: Walk _modules OrderedDict."""
        try:
            modules_obj = getattr(model, "_modules", None)
            if isinstance(modules_obj, dict):
                for _name, module in modules_obj.items():
                    tok = self._unwrap_tokenizer(getattr(module, "tokenizer", None))
                    if tok is not None:
                        logger.debug("Found tokenizer in _modules['%s']", _name)
                        return tok
                    tok = self._unwrap_tokenizer(getattr(module, "processor", None))
                    if tok is not None:
                        logger.debug("Found tokenizer in _modules['%s'].processor", _name)
                        return tok
        except Exception:
            pass
        return None

    def _tokenizer_from_deep_walk(self, model: SentenceTransformer) -> Any | None:
        """Strategy 4: Walk all public attributes of the model."""
        try:
            for attr_name in dir(model):
                if attr_name.startswith("_"):
                    continue
                candidate = self._unwrap_tokenizer(getattr(model, attr_name, None))
                if candidate is not None:
                    logger.debug("Found tokenizer via deep walk: model.%s", attr_name)
                    return candidate
        except Exception:
            pass
        return None

    def _log_tokenizer_not_found(self, model: SentenceTransformer) -> None:
        """Log a warning with model structure details when no tokenizer is found."""
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

    def _use_native_siglip(self) -> bool:
        return "siglip" in str(self._model_name or "").strip().lower()

    async def _ensure_siglip_components(self) -> tuple[Any, Any]:
        if self._siglip_model is not None and self._siglip_processor is not None:
            return self._siglip_processor, self._siglip_model

        async with self._siglip_lock:
            if self._siglip_model is None or self._siglip_processor is None:
                from transformers import AutoModel, AutoProcessor
                from transformers.utils import logging as hf_logging

                _configure_hf_quiet_mode()
                previous_hf_verbosity = hf_logging.get_verbosity()
                verbose = _ai_verbose_logs_enabled()
                if not verbose:
                    hf_logging.set_verbosity_error()
                try:
                    self._patch_global_siglip_config_hidden_size()
                    # Model refs are user-configurable and may be local paths.
                    if verbose:
                        self._siglip_processor = AutoProcessor.from_pretrained(  # nosec B615
                            self._model_name, use_fast=False
                        )
                        self._siglip_model = AutoModel.from_pretrained(self._model_name)  # nosec B615
                    else:
                        with warnings.catch_warnings(), _suppress_stdout_only():
                            warnings.filterwarnings(
                                "ignore",
                                message=r".*huggingface_hub.*cache-system uses symlinks.*",
                            )
                            self._siglip_processor = AutoProcessor.from_pretrained(  # nosec B615
                                self._model_name, use_fast=False
                            )
                            self._siglip_model = AutoModel.from_pretrained(self._model_name)  # nosec B615
                finally:
                    hf_logging.set_verbosity(previous_hf_verbosity)

                try:
                    self._siglip_model.eval()
                except Exception:
                    pass

                cfg = getattr(self._siglip_model, "config", None)
                resolved_dim = self._derive_hidden_size_from_subconfigs(cfg) if cfg is not None else None
                if resolved_dim is not None and int(resolved_dim) > 0:
                    self._dim = int(resolved_dim)

            return self._siglip_processor, self._siglip_model

    @staticmethod
    def _is_hidden_size_error(exc: Exception) -> bool:
        return "hidden_size" in str(exc or "").lower()

    @staticmethod
    def _is_siglip_like_config(cfg: Any) -> bool:
        try:
            # Only patch top-level SigLIP config objects.
            # Sub-configs like SiglipTextConfig / SiglipVisionConfig must never
            # be patched with a synthetic hidden_size property (can break
            # transformers setters with "property ... has no setter").
            has_text_cfg = getattr(cfg, "text_config", None) is not None
            has_vision_cfg = getattr(cfg, "vision_config", None) is not None
            if not (has_text_cfg and has_vision_cfg):
                return False

            model_type = str(getattr(cfg, "model_type", "") or "").strip().lower()
            if model_type in {"siglip", "siglip2"}:
                return True

            cls_name = str(getattr(type(cfg), "__name__", "") or "").strip().lower()
            return cls_name in {"siglipconfig", "siglip2config"}
        except Exception:
            return False

    @staticmethod
    def _derive_hidden_size_from_subconfigs(cfg: Any) -> int | None:
        for sub in ("text_config", "vision_config"):
            sub_cfg = getattr(cfg, sub, None)
            if sub_cfg is None:
                continue
            candidate = getattr(sub_cfg, "hidden_size", None)
            if candidate is None:
                continue
            try:
                candidate_i = int(candidate)
                if candidate_i > 0:
                    return candidate_i
            except Exception:
                continue
        return None

    @classmethod
    def _patch_hidden_size_on_config_class(cls, cfg: Any) -> bool:
        if cfg is None or not cls._is_siglip_like_config(cfg):
            return False
        cfg_cls = type(cfg)
        if hasattr(cfg_cls, "hidden_size"):
            return False

        def _hidden_size_getter(instance: Any) -> int:
            resolved = cls._derive_hidden_size_from_subconfigs(instance)
            if resolved is not None:
                return int(resolved)
            raise AttributeError("hidden_size")

        try:
            cfg_cls.hidden_size = property(_hidden_size_getter)
            return True
        except Exception:
            return False

    @classmethod
    def _patch_global_siglip_config_hidden_size(cls) -> bool:
        patched_any = False
        targets: list[type[Any]] = []
        for module_name, class_name in (
            ("transformers.models.siglip.configuration_siglip", "SiglipConfig"),
            ("transformers.models.siglip2.configuration_siglip2", "Siglip2Config"),
        ):
            try:
                module = __import__(module_name, fromlist=[class_name])
                cfg_cls = getattr(module, class_name, None)
                if isinstance(cfg_cls, type):
                    targets.append(cfg_cls)
            except Exception:
                continue

        for cfg_cls in targets:
            if hasattr(cfg_cls, "hidden_size"):
                continue

            def _build_hidden_size_getter(config_cls: type[Any]):
                def _hidden_size_getter(instance: Any) -> int:
                    resolved = cls._derive_hidden_size_from_subconfigs(instance)
                    if resolved is not None:
                        return int(resolved)
                    raise AttributeError(f"{config_cls.__name__}.hidden_size")

                return _hidden_size_getter

            try:
                cfg_cls.hidden_size = property(_build_hidden_size_getter(cfg_cls))
                patched_any = True
            except Exception:
                continue

        if patched_any:
            logger.debug("Applied global SigLIP hidden_size class patch")
        return patched_any

    def _patch_model_hidden_size(self, model: Any) -> bool:
        """Best-effort patch for SigLIP-family configs missing top-level hidden_size."""
        try:
            patch_targets: list[Any] = []

            def _collect_cfg(obj: Any) -> None:
                if obj is None:
                    return
                cfg = getattr(obj, "config", None)
                if cfg is not None:
                    patch_targets.append(cfg)

            _collect_cfg(model)

            first_mod_fn = getattr(model, "_first_module", None)
            first_mod = first_mod_fn() if callable(first_mod_fn) else None
            if first_mod is not None:
                _collect_cfg(first_mod)
                for attr_name in ("model", "auto_model", "text_model", "vision_model"):
                    inner = getattr(first_mod, attr_name, None)
                    _collect_cfg(inner)
                    for nested in ("model", "auto_model", "text_model", "vision_model"):
                        _collect_cfg(getattr(inner, nested, None) if inner is not None else None)

            patched_any = False
            for cfg in patch_targets:
                if cfg is None or not self._is_siglip_like_config(cfg):
                    continue

                class_patched = self._patch_hidden_size_on_config_class(cfg)
                hidden_size = self._derive_hidden_size_from_subconfigs(cfg)

                instance_patched = False
                if not hasattr(cfg, "hidden_size") and hidden_size is not None:
                    try:
                        cfg.hidden_size = int(hidden_size)
                        instance_patched = True
                    except Exception:
                        instance_patched = False

                patched_any = patched_any or class_patched or instance_patched

            if patched_any:
                logger.debug("Applied hidden_size auto-heal patch on SigLIP config(s)")
            return patched_any
        except Exception as exc:
            logger.debug("Config hidden_size patch skipped: %s", exc)
            return False

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

    async def prewarm_text_queries(self, probe_text: str = "warmup") -> Result[dict[str, Any]]:
        """Preload the text-query path so the first AI search is not cold."""
        if self._text_query_warmed:
            return Result.Ok(self.get_runtime_status())

        async with self._text_query_warm_lock:
            if self._text_query_warmed:
                return Result.Ok(self.get_runtime_status())

            result = await self.get_text_embedding(probe_text)
            if not result.ok or not result.data:
                return Result.Err(
                    result.code or "SERVICE_UNAVAILABLE",
                    result.error or "Vector text-query warmup failed",
                )

            self._text_query_warmed = True
            return Result.Ok(self.get_runtime_status())

    def get_runtime_status(self) -> dict[str, Any]:
        siglip_loaded = bool(self._siglip_model is not None and self._siglip_processor is not None)
        sentence_transformer_loaded = bool(self._model is not None)
        prompt_model_loaded = bool(self._prompt_model is not None and self._prompt_processor is not None)
        video_model_loaded = bool(self._video_model is not None and self._video_processor is not None)
        return {
            "model_name": self._model_name,
            "video_model_name": self._video_model_name,
            "prompt_model_name": self._prompt_model_name,
            "loaded": bool(sentence_transformer_loaded or siglip_loaded),
            "sentence_transformer_loaded": sentence_transformer_loaded,
            "siglip_loaded": siglip_loaded,
            "video_model_loaded": video_model_loaded,
            "prompt_model_loaded": prompt_model_loaded,
            "text_query_warmed": bool(self._text_query_warmed),
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

        if self._use_native_siglip():
            try:
                processor, native_model = await self._ensure_siglip_components()

                def _encode_native_image() -> list[float]:
                    import torch

                    with torch.inference_mode():
                        inputs = processor(images=[img], return_tensors="pt")
                        vec = _extract_hf_feature_vector(
                            native_model.get_image_features(**inputs),
                            preferred_fields=("image_embeds", "pooler_output", "last_hidden_state"),
                            error_label="SigLIP image output",
                        )
                        return _coerce_vector_dim(vec, self._dim)

                vec = await asyncio.to_thread(_encode_native_image)
                self._clear_error()
                return Result.Ok(vec)
            except Exception as exc:
                self._record_error(f"Image embedding failed for {path.name}: {exc}")
                logger.debug("Native SigLIP image embedding failed for %s: %s", path.name, exc)
                return Result.Err("METADATA_FAILED", f"Embedding failed: {exc}")

        model: Any | None = None
        try:
            model = await self._ensure_model()

            def _encode_single_image() -> Any:
                return _encode_quiet(
                    model,
                    cast(Any, [img]),
                    convert_to_numpy=True,
                    batch_size=1,
                    show_progress_bar=False,
                )

            vec = await asyncio.to_thread(
                _encode_single_image
            )
            self._clear_error()
            return Result.Ok(_normalise_vector(vec[0]))
        except Exception as exc:
            if model is not None and self._is_hidden_size_error(exc):
                try:
                    self._patch_model_hidden_size(model)

                    def _retry_encode_single_image() -> Any:
                        return _encode_quiet(
                            model,
                            cast(Any, [img]),
                            convert_to_numpy=True,
                            batch_size=1,
                            show_progress_bar=False,
                        )

                    vec = await asyncio.to_thread(
                        _retry_encode_single_image
                    )
                    self._clear_error()
                    return Result.Ok(_normalise_vector(vec[0]))
                except Exception as retry_exc:
                    exc = retry_exc
            self._record_error(f"Image embedding failed for {path.name}: {exc}")
            logger.debug("Image embedding failed for %s: %s", path.name, exc)
            return Result.Err("METADATA_FAILED", f"Embedding failed: {exc}")

    # ── Text embeddings ────────────────────────────────────────────────

    async def get_text_embedding(self, text: str) -> Result[list[float]]:
        """Encode a free-form text query into the multimodal embedding space."""
        if not text or not text.strip():
            return Result.Err("INVALID_INPUT", "Text query cannot be empty")

        if self._use_native_siglip():
            cleaned = " ".join(str(text).split()).strip()
            if not cleaned:
                return Result.Err("INVALID_INPUT", "Text query cannot be empty")
            try:
                processor, model = await self._ensure_siglip_components()

                def _encode_native_text() -> list[float]:
                    import torch

                    with torch.inference_mode():
                        inputs = processor(text=[cleaned], return_tensors="pt", padding=True, truncation=True)
                        vec = _extract_hf_feature_vector(
                            model.get_text_features(**inputs),
                            preferred_fields=("text_embeds", "pooler_output", "last_hidden_state"),
                            error_label="SigLIP text output",
                        )
                        return _coerce_vector_dim(vec, self._dim)

                vec = await asyncio.to_thread(_encode_native_text)
                self._clear_error()
                return Result.Ok(vec)
            except Exception as exc:
                self._record_error(f"Text embedding failed: {exc}")
                logger.debug("Native SigLIP text embedding failed: %s", exc)
                return Result.Err("METADATA_FAILED", f"Text embedding failed: {exc}")

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
                if self._is_hidden_size_error(exc):
                    try:
                        self._patch_model_hidden_size(model)

                        def _retry_encode_text(q: str = candidate) -> Any:
                            return _encode_quiet(
                                model, q, convert_to_numpy=True, show_progress_bar=False,
                            )

                        vec = await asyncio.to_thread(_retry_encode_text)
                        self._clear_error()
                        return Result.Ok(_normalise_vector(vec))
                    except Exception as retry_exc:
                        last_exc = retry_exc
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
                if self._is_hidden_size_error(exc):
                    try:
                        self._patch_model_hidden_size(model)

                        def _retry_encode_batch(s: list[Any] = sub) -> Any:
                            return _encode_quiet(
                                model,
                                cast(Any, s),
                                convert_to_numpy=True,
                                batch_size=len(s),
                                show_progress_bar=False,
                            )

                        vecs = await asyncio.to_thread(_retry_encode_batch)
                        for i, vec in zip(sub_idx, vecs, strict=True):
                            results[i] = Result.Ok(_normalise_vector(vec))
                        continue
                    except Exception as retry_exc:
                        exc = retry_exc
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

        # Use the same native SigLIP2 path that works for image embeddings
        # to encode each keyframe, then average.
        if self._use_native_siglip():
            try:
                import torch

                processor, native_model = await self._ensure_siglip_components()

                def _embed_frames_native() -> list[float]:
                    vecs = []
                    with torch.inference_mode():
                        for frame in frames:
                            inputs = processor(images=[frame], return_tensors="pt")
                            vecs.append(
                                _extract_hf_feature_vector(
                                    native_model.get_image_features(**inputs),
                                    preferred_fields=("image_embeds", "pooler_output", "last_hidden_state"),
                                    error_label="SigLIP video frame output",
                                )
                            )
                    mean_vec = _mean_float32(vecs, axis=0)
                    vec = _normalise_vector(mean_vec)
                    return _coerce_vector_dim(vec, self._dim)

                vec = await asyncio.to_thread(_embed_frames_native)
                self._clear_error()
                return Result.Ok(vec)
            except Exception as exc:
                self._record_error(f"Video embedding failed for {path.name}: {exc}")
                logger.debug("Native SigLIP video embedding failed for %s: %s", path.name, exc)
                return Result.Err("METADATA_FAILED", f"Video embedding failed: {exc}")

        # Legacy SentenceTransformer fallback
        try:

            model = await self._ensure_model()

            def _coerce_first_vector(payload: Any) -> list[float]:
                try:
                    if isinstance(payload, Sequence) and not isinstance(payload, (str, bytes, bytearray)):
                        if len(payload) > 0:
                            first = payload[0]
                            if isinstance(first, Sequence) and not isinstance(first, (str, bytes, bytearray)):
                                return _normalise_vector(first)
                    return _normalise_vector(payload)
                except Exception:
                    return _normalise_vector(payload)

            try:
                vecs = await asyncio.to_thread(
                    lambda: _encode_quiet(
                        model,
                        cast(Any, frames),
                        convert_to_numpy=True,
                        batch_size=min(len(frames), VECTOR_BATCH_SIZE),
                        show_progress_bar=False,
                    )
                )
            except Exception as batch_exc:
                # Some model/pipeline combos fail on batched PIL frames
                # (e.g. "'Image' object is not subscriptable"). Retry one frame at a time.
                logger.debug(
                    "Video batch embedding failed for %s, retrying frame-by-frame: %s",
                    path.name,
                    batch_exc,
                )

                def _encode_single_frame(frame_obj: Any) -> Any:
                    return _encode_quiet(
                        model,
                        cast(Any, [frame_obj]),
                        convert_to_numpy=True,
                        batch_size=1,
                        show_progress_bar=False,
                    )

                vecs = []
                for frame in frames:
                    encoded = await asyncio.to_thread(_encode_single_frame, frame)
                    vecs.append(_coerce_first_vector(encoded))

            mean_vec = _mean_float32(vecs, axis=0)
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
                    input_ids = None
                    attention_mask = None
                    pixel_values = None
                    pixel_mask = None

                    tokenizer = getattr(processor, "tokenizer", None)
                    image_processor = getattr(processor, "image_processor", None)

                    def _get_field(container: Any, field: str) -> Any:
                        try:
                            getter = getattr(container, "get", None)
                            if callable(getter):
                                return getter(field)
                        except Exception:
                            pass
                        try:
                            return container[field]
                        except Exception:
                            return None

                    try:
                        combo = processor(
                            text=[self._prompt_task],
                            images=[image],
                            return_tensors="pt",
                            padding=True,
                        )
                        input_ids = _get_field(combo, "input_ids")
                        attention_mask = _get_field(combo, "attention_mask")
                        pixel_values = _get_field(combo, "pixel_values")
                        pixel_mask = _get_field(combo, "pixel_mask")
                    except Exception:
                        pass

                    if input_ids is None and tokenizer is not None:
                        try:
                            tok_out = tokenizer([self._prompt_task], return_tensors="pt", padding=True)
                            input_ids = _get_field(tok_out, "input_ids")
                            attention_mask = _get_field(tok_out, "attention_mask")
                        except Exception:
                            input_ids = None
                            attention_mask = None

                    if pixel_values is None and image_processor is not None:
                        try:
                            img_out = image_processor(images=[image], return_tensors="pt")
                            pixel_values = _get_field(img_out, "pixel_values")
                            pixel_mask = _get_field(img_out, "pixel_mask")
                        except Exception:
                            pixel_values = None
                            pixel_mask = None

                    if input_ids is None or pixel_values is None:
                        raise RuntimeError("Florence processor returned incomplete tensors")

                    generate_kwargs: dict[str, Any] = {
                        "input_ids": input_ids,
                        "pixel_values": pixel_values,
                        # Keep enough room for long descriptive outputs to avoid
                        # truncation in the middle of a sentence.
                        "max_new_tokens": 256,
                        "num_beams": 1,
                        "do_sample": False,
                        "use_cache": False,
                    }
                    if attention_mask is not None:
                        generate_kwargs["attention_mask"] = attention_mask
                    if pixel_mask is not None:
                        generate_kwargs["pixel_mask"] = pixel_mask

                    generated = model.generate(**generate_kwargs)
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
            logger.exception("Enhanced caption generation failed for %s: %s", path.name, exc)
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
                try:
                    from transformers.models.florence2.modeling_florence2 import (
                        Florence2ForConditionalGeneration,
                    )

                    if not hasattr(Florence2ForConditionalGeneration, "_supports_sdpa"):
                        Florence2ForConditionalGeneration._supports_sdpa = False
                except Exception:
                    pass

                prompt_model_name = self._normalise_model_name(
                    self._prompt_model_name,
                    "microsoft/Florence-2-base",
                )
                if prompt_model_name != self._prompt_model_name:
                    logger.warning(
                        "Invalid Florence-2 model name configured ('%s'); falling back to '%s'",
                        self._prompt_model_name,
                        prompt_model_name,
                    )
                    self._prompt_model_name = prompt_model_name

                def _load_prompt_processor(*, use_fast: bool | None) -> Any:
                    kwargs: dict[str, Any] = {
                        "trust_remote_code": True,
                    }
                    if use_fast is not None:
                        kwargs["use_fast"] = use_fast
                    return AutoProcessor.from_pretrained(prompt_model_name, **kwargs)  # nosec B615

                def _load_prompt_model_with_compat() -> Any:
                    try:
                        return AutoModelForCausalLM.from_pretrained(  # nosec B615
                            prompt_model_name,
                            trust_remote_code=True,
                            attn_implementation="eager",
                        )
                    except AttributeError as exc:
                        if "_supports_sdpa" not in str(exc or ""):
                            raise
                        try:
                            from transformers.modeling_utils import PreTrainedModel

                            if not hasattr(PreTrainedModel, "_supports_sdpa"):
                                PreTrainedModel._supports_sdpa = False
                        except Exception:
                            pass
                        try:
                            for _module in list(sys.modules.values()):
                                if _module is None:
                                    continue
                                cls = getattr(_module, "Florence2ForConditionalGeneration", None)
                                if cls is None:
                                    continue
                                if not hasattr(cls, "_supports_sdpa"):
                                    cls._supports_sdpa = False
                        except Exception:
                            pass
                        return AutoModelForCausalLM.from_pretrained(  # nosec B615
                            prompt_model_name,
                            trust_remote_code=True,
                            attn_implementation="eager",
                        )

                logger.info("Loading Florence prompt model '%s' …", prompt_model_name)
                previous_hf_verbosity = hf_logging.get_verbosity()
                verbose = _ai_verbose_logs_enabled()
                if not verbose:
                    hf_logging.set_verbosity_error()
                try:
                    if verbose:
                        try:
                            self._prompt_processor = _load_prompt_processor(use_fast=None)
                        except TypeError as exc:
                            msg = str(exc or "")
                            if "os.PathLike" in msg or "NoneType" in msg:
                                logger.debug(
                                    "Florence processor auto-detect failed, retrying with use_fast=False: %s",
                                    exc,
                                )
                                self._prompt_processor = _load_prompt_processor(use_fast=False)
                            else:
                                raise
                        self._prompt_model = _load_prompt_model_with_compat()
                    else:
                        with warnings.catch_warnings(), _suppress_stdout_only():
                            warnings.filterwarnings(
                                "ignore",
                                message=r".*huggingface_hub.*cache-system uses symlinks.*",
                            )
                            try:
                                self._prompt_processor = _load_prompt_processor(use_fast=None)
                            except TypeError as exc:
                                msg = str(exc or "")
                                if "os.PathLike" in msg or "NoneType" in msg:
                                    logger.debug(
                                        "Florence processor auto-detect failed, retrying with use_fast=False: %s",
                                        exc,
                                    )
                                    self._prompt_processor = _load_prompt_processor(use_fast=False)
                                else:
                                    raise
                            self._prompt_model = _load_prompt_model_with_compat()
                finally:
                    hf_logging.set_verbosity(previous_hf_verbosity)
                if not hasattr(self._prompt_model, "_supports_sdpa"):
                    try:
                        self._prompt_model._supports_sdpa = False
                    except Exception:
                        pass
                self._prompt_model.eval()
                log_success(logger, "Florence-2 model loaded and ready: '%s'" % prompt_model_name)
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
                    # Model refs are user-configurable and may be local paths.
                    if verbose:
                        self._video_processor = AutoProcessor.from_pretrained(  # nosec B615
                            self._video_model_name,
                            use_fast=False,
                        )
                        self._video_model = AutoModel.from_pretrained(self._video_model_name)  # nosec B615
                    else:
                        with warnings.catch_warnings(), _suppress_stdout_only():
                            warnings.filterwarnings(
                                "ignore",
                                message=r".*huggingface_hub.*cache-system uses symlinks.*",
                            )
                            self._video_processor = AutoProcessor.from_pretrained(  # nosec B615
                                self._video_model_name,
                                use_fast=False,
                            )
                            self._video_model = AutoModel.from_pretrained(self._video_model_name)  # nosec B615
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
                import torch

                rgb_frames = [f.convert("RGB") for f in frames]
                if not rgb_frames:
                    raise RuntimeError("No RGB frames available for X-CLIP embedding")

                # X-CLIP expects exactly 8 frames; pad by repeating if fewer.
                target_nframes = 8
                while len(rgb_frames) < target_nframes:
                    rgb_frames.append(rgb_frames[len(rgb_frames) % len(rgb_frames)])

                with torch.inference_mode():
                    # XCLIPProcessor uses images= (not videos=) to build
                    # pixel_values with shape [batch, num_frames, C, H, W].
                    inputs = processor(images=rgb_frames, return_tensors="pt")
                    pixel_values = inputs.get("pixel_values")
                    if pixel_values is None:
                        raise RuntimeError("X-CLIP processor returned no pixel_values")

                    if hasattr(model, "get_video_features"):
                        out = model.get_video_features(pixel_values=pixel_values)
                    else:
                        out = model(pixel_values=pixel_values)
                    vec = _extract_hf_feature_vector(
                        out,
                        preferred_fields=("video_embeds", "pooler_output", "last_hidden_state"),
                        error_label="X-CLIP output",
                    )
                    return _coerce_vector_dim(vec, self._dim)

            vec = await asyncio.to_thread(_encode_frames)
            return Result.Ok(vec)
        except Exception as exc:
            logger.debug("X-CLIP video embedding failed for %s: %s", path.name, exc)
            return Result.Err("METADATA_FAILED", f"X-CLIP video embedding failed: {exc}")


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _as_float32_array(value: Any) -> Any:
    """Coerce tensor/list/array-like payloads to float32-compatible values."""
    import numpy as np  # noqa: F811

    arr = np.asarray(value, dtype=np.float32)
    return arr.tolist() if hasattr(arr, "tolist") else arr


def _model_output_field(value: Any, field_name: str) -> Any | None:
    try:
        candidate = getattr(value, field_name, None)
    except Exception:
        candidate = None
    if candidate is not None:
        return candidate

    if isinstance(value, dict):
        return value.get(field_name)

    getter = getattr(value, "get", None)
    if callable(getter):
        try:
            return getter(field_name, None)
        except TypeError:
            try:
                return getter(field_name)
            except Exception:
                return None
        except Exception:
            return None
    return None


def _tensor_to_numpy_payload(value: Any) -> Any:
    current = value
    for method_name in ("detach", "cpu"):
        method = getattr(current, method_name, None)
        if callable(method):
            current = method()
    numpy_method = getattr(current, "numpy", None)
    if callable(numpy_method):
        current = numpy_method()
    return current


def _mean_pool_sequence_features(value: Any) -> Any:
    mean_method = getattr(value, "mean", None)
    if callable(mean_method):
        for args, kwargs in (
            ((), {"dim": 1}),
            ((), {"axis": 1}),
            ((1,), {}),
        ):
            try:
                return mean_method(*args, **kwargs)
            except Exception:
                continue
    return _mean_float32(_tensor_to_numpy_payload(value), axis=1)


def _unwrap_single_batch_vector(value: Any) -> Any:
    try:
        if isinstance(value, Sequence) and not isinstance(value, (str, bytes, bytearray)) and len(value) > 0:
            first = value[0]
            if isinstance(first, Sequence) and not isinstance(first, (str, bytes, bytearray)):
                return first
    except Exception:
        pass
    return value


def _extract_hf_feature_vector(
    output: Any,
    *,
    preferred_fields: Sequence[str],
    error_label: str,
) -> list[float]:
    candidate = output
    if isinstance(candidate, tuple):
        candidate = next((item for item in candidate if item is not None), None)

    for field_name in preferred_fields:
        extracted = _model_output_field(candidate, field_name)
        if extracted is None:
            continue
        candidate = _mean_pool_sequence_features(extracted) if field_name == "last_hidden_state" else extracted
        break

    if candidate is None:
        raise RuntimeError(f"{error_label} did not expose usable features")

    arr = _as_float32_array(_tensor_to_numpy_payload(candidate))
    vec = _normalise_vector(_unwrap_single_batch_vector(arr))
    if not vec:
        raise RuntimeError(f"{error_label} produced an empty embedding")
    return vec


def _mean_float32(values: Any, axis: int = 0) -> Any:
    """Compute a mean that stays float32 and also works with lightweight NumPy mocks."""
    import numpy as np  # noqa: F811

    try:
        mean_value = np.mean(values, axis=axis, dtype=np.float32)
    except TypeError:
        mean_value = np.mean(values, axis=axis)
    arr = np.asarray(mean_value, dtype=np.float32)
    return arr.tolist() if hasattr(arr, "tolist") else arr


def _normalise_vector(vec: Any) -> list[float]:
    """Flatten a vector-like payload to ``list[float]`` and L2-normalise it."""
    try:
        import numpy as np  # noqa: F811

        arr_np = np.asarray(vec, dtype=np.float32).flatten()
        norm_np = float(np.linalg.norm(arr_np))
        if norm_np > 0.0:
            arr_norm = np.asarray(arr_np / np.float32(norm_np), dtype=np.float32)
            return [float(x) for x in arr_norm.tolist()]
        return [float(x) for x in arr_np.tolist()]
    except Exception:
        pass

    def _flatten_floats(value: Any) -> list[float]:
        if value is None:
            return []
        if isinstance(value, Sequence) and not isinstance(value, (str, bytes, bytearray)):
            out: list[float] = []
            for item in value:
                out.extend(_flatten_floats(item))
            return out
        try:
            return [float(value)]
        except Exception:
            return []

    arr_list = _flatten_floats(vec)
    if not arr_list:
        return []
    norm_list = math.sqrt(sum(v * v for v in arr_list))
    if norm_list > 0.0:
        arr_list = [v / norm_list for v in arr_list]
    return arr_list


def _coerce_vector_dim(vec: list[float], dim: int) -> list[float]:
    if len(vec) == dim:
        return vec
    if len(vec) > dim:
        out = vec[:dim]
    else:
        out = vec + ([0.0] * (dim - len(vec)))
    return _normalise_vector(out)
