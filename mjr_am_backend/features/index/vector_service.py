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
import io
import struct
import subprocess
from collections.abc import Sequence
from pathlib import Path
from typing import TYPE_CHECKING, Any

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

    # ── Model lifecycle ────────────────────────────────────────────────

    def _load_model(self) -> SentenceTransformer:
        """Synchronous model loading (called inside a thread)."""
        from sentence_transformers import SentenceTransformer  # noqa: F811

        logger.info("Loading CLIP model '%s' …", self._model_name)
        model = SentenceTransformer(self._model_name, device=self._device)
        logger.info("CLIP model loaded  (dim=%d)", model.get_sentence_embedding_dimension())
        return model

    async def _ensure_model(self) -> SentenceTransformer:
        """Thread-safe lazy initialisation of the model."""
        if self._model is not None:
            return self._model
        async with self._lock:
            if self._model is not None:
                return self._model
            self._model = await asyncio.to_thread(self._load_model)
            self._dim = self._model.get_sentence_embedding_dimension()
            return self._model

    @property
    def dim(self) -> int:
        return self._dim

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
            vec = await asyncio.to_thread(lambda: model.encode(img, convert_to_numpy=True))
            return Result.Ok(_normalise_vector(vec))
        except Exception as exc:
            logger.warning("Image embedding failed for %s: %s", path.name, exc)
            return Result.Err("METADATA_FAILED", f"Embedding failed: {exc}")

    # ── Text embeddings ────────────────────────────────────────────────

    async def get_text_embedding(self, text: str) -> Result[list[float]]:
        """Encode a free-form text query into the CLIP embedding space."""
        if not text or not text.strip():
            return Result.Err("INVALID_INPUT", "Text query cannot be empty")
        try:
            model = await self._ensure_model()
            vec = await asyncio.to_thread(lambda: model.encode(text.strip(), convert_to_numpy=True))
            return Result.Ok(_normalise_vector(vec))
        except Exception as exc:
            logger.warning("Text embedding failed: %s", exc)
            return Result.Err("METADATA_FAILED", f"Text embedding failed: {exc}")

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
                    lambda s=sub: model.encode(s, convert_to_numpy=True, batch_size=len(s))
                )
                for i, vec in zip(sub_idx, vecs, strict=True):
                    results[i] = Result.Ok(_normalise_vector(vec))
            except Exception as exc:
                logger.warning("Batch embedding failed (batch %d): %s", start, exc)
                for i in sub_idx:
                    results[i] = Result.Err("METADATA_FAILED", f"Batch embedding failed: {exc}")

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
                lambda: model.encode(frames, convert_to_numpy=True, batch_size=min(len(frames), VECTOR_BATCH_SIZE))
            )
            mean_vec = np.mean(vecs, axis=0)
            return Result.Ok(_normalise_vector(mean_vec))
        except Exception as exc:
            logger.warning("Video embedding failed for %s: %s", path.name, exc)
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
