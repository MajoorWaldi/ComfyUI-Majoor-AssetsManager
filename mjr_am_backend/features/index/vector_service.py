"""
CLIP-based vector embedding service.

Loads a SentenceTransformers CLIP model (default: ``clip-ViT-L-14``) and
provides helpers to embed images, text queries, and video key-frames.

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
import os
import struct
import subprocess
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
    VECTOR_VIDEO_KEYFRAME_INTERVAL,
)
from ...shared import Result, get_logger

if TYPE_CHECKING:
    from PIL import Image as PILImage
    from sentence_transformers import SentenceTransformer

logger = get_logger(__name__)

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
    with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
        return model.encode(payload, **kwargs)


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
    """Manages the CLIP model lifecycle and embedding generation.

    The model is loaded lazily on the first call to any public method that
    needs it.  This keeps import time and memory footprint low when the
    vector-search feature is disabled.
    """

    def __init__(self, model_name: str | None = None, device: str | None = None) -> None:
        self._model_name = model_name or VECTOR_MODEL_NAME
        self._device = device  # None → auto-detect (CPU / CUDA)
        self._model: SentenceTransformer | None = None
        self._lock = asyncio.Lock()
        self._dim = VECTOR_EMBEDDING_DIM
        self._last_error: str = ""
        self._last_error_at: str | None = None
        self._error_count: int = 0
        self._truncation_log_window_start: float = 0.0
        self._truncation_log_count: int = 0

    # ── Model lifecycle ────────────────────────────────────────────────

    def _load_model(self) -> SentenceTransformer:
        """Synchronous model loading (called inside a thread)."""
        os.environ.setdefault("HF_HUB_DISABLE_PROGRESS_BARS", "1")
        os.environ.setdefault("TQDM_DISABLE", "1")
        os.environ.setdefault("TRANSFORMERS_NO_ADVISORY_WARNINGS", "1")
        from sentence_transformers import SentenceTransformer  # noqa: F811
        from transformers.utils import logging as hf_logging

        logger.info("Loading CLIP model '%s' …", self._model_name)
        previous_hf_verbosity = hf_logging.get_verbosity()
        hf_logging.set_verbosity_error()
        try:
            with warnings.catch_warnings():
                warnings.filterwarnings(
                    "ignore",
                    message=r"Using a slow image processor as `use_fast` is unset.*",
                )
                try:
                    model = SentenceTransformer(
                        self._model_name,
                        device=self._device,
                        model_kwargs={"use_fast": False},
                        tokenizer_kwargs={"use_fast": False},
                    )
                except TypeError:
                    model = SentenceTransformer(self._model_name, device=self._device)
        finally:
            hf_logging.set_verbosity(previous_hf_verbosity)
        dim_value = model.get_sentence_embedding_dimension()
        effective_dim = int(dim_value) if dim_value is not None else int(VECTOR_EMBEDDING_DIM)
        logger.info("CLIP model loaded  (dim=%d)", effective_dim)
        return model

    async def _ensure_model(self) -> SentenceTransformer:
        """Thread-safe lazy initialisation of the model."""
        if self._model is not None:
            return self._model
        async with self._lock:
            if self._model is not None:
                return self._model
            self._model = await asyncio.to_thread(self._load_model)
            parsed_dim = self._model.get_sentence_embedding_dimension()
            self._dim = int(parsed_dim) if parsed_dim is not None else int(VECTOR_EMBEDDING_DIM)
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
        if self._truncation_log_count >= 8:
            return
        self._truncation_log_count += 1

        preview = " ".join(str(original).split())[:180]
        logger.warning(
            "CLIP text truncated (%s): chars %d→%d, words %d→%d, preview='%s'",
            str(reason or "unknown"),
            len(original),
            len(truncated),
            len(original.split()),
            len(truncated.split()),
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

        tokenizer_max_len: int | None = None
        tokenizer: Any | None = None
        try:
            first_module_getter = getattr(model, "_first_module", None)
            first_module = first_module_getter() if callable(first_module_getter) else None
            tokenizer = getattr(first_module, "tokenizer", None)
            if tokenizer is None:
                tokenizer = getattr(model, "tokenizer", None)
            if tokenizer is None:
                modules_getter = getattr(model, "_modules", None)
                modules_obj = modules_getter() if callable(modules_getter) else None
                if isinstance(modules_obj, dict):
                    for module in modules_obj.values():
                        tokenizer = getattr(module, "tokenizer", None)
                        if tokenizer is not None:
                            break
            if tokenizer is not None:
                try:
                    raw_tok_max = int(getattr(tokenizer, "model_max_length", 0) or 0)
                    if 0 < raw_tok_max < 100000:
                        tokenizer_max_len = raw_tok_max
                except Exception:
                    tokenizer_max_len = None

                effective_max_len = max(4, int(max_len or 77))
                if tokenizer_max_len is not None:
                    effective_max_len = max(4, min(effective_max_len, int(tokenizer_max_len)))

                full_token_len: int | None = None
                try:
                    token_count = len(tokenizer.tokenize(cleaned))
                    full_token_len = int(token_count) + 2
                except Exception:
                    full_token_len = None

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
                            f"token_limit {full_token_len}>{effective_max_len}",
                        )
                    return decoded
        except Exception:
            pass

        # Strong fallback when tokenizer is unavailable: clamp both words and characters.
        # This prevents extremely long metadata prompts from reaching CLIP with >77 tokens.
        char_budget = 220
        original_for_fallback = cleaned
        if len(cleaned) > char_budget:
            cleaned = cleaned[:char_budget].rsplit(" ", 1)[0].strip() or cleaned[:char_budget].strip()
            self._log_text_truncation(original_for_fallback, cleaned, f"char_budget>{char_budget}")

        words = cleaned.split()
        if len(words) > 24:
            shortened = " ".join(words[:24])
            self._log_text_truncation(cleaned, shortened, "word_budget>24")
            return shortened
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
        """Encode a free-form text query into the CLIP embedding space."""
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
                vec = await asyncio.to_thread(
                    lambda q=candidate: _encode_quiet(
                        model,
                        q,
                        convert_to_numpy=True,
                        show_progress_bar=False,
                    )
                )
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
                vecs = await asyncio.to_thread(
                    lambda s=sub: _encode_quiet(
                        model,
                        cast(Any, s),
                        convert_to_numpy=True,
                        batch_size=len(s),
                        show_progress_bar=False,
                    )
                )
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
