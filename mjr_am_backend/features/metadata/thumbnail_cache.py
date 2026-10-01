"""Content-addressed thumbnail generation for indexed media previews."""

from __future__ import annotations

import hashlib
import os
import shutil
import threading
import time
from pathlib import Path
from typing import Any

from mjr_am_backend.adapters.tools import external_tools
from mjr_am_backend.shared import Result, classify_file
from mjr_am_shared.runtime_env import get_env

THUMB_CACHE_VERSION = "thumb-v2"
THUMB_MAX_SIZE = 1024
PREVIEW_MAX_SIZE = 2560
# Formats browsers cannot render: the viewer serves a converted JPEG preview instead.
PREVIEW_ONLY_EXTENSIONS = frozenset({".exr", ".tif", ".tiff"})
THUMB_CACHE_MAX_BYTES = 2 * 1024 * 1024 * 1024
_FFMPEG_SEM = threading.Semaphore(2)
_gc_running = threading.Event()


def thumbnail_cache_dir() -> Path:
    root = Path(__file__).resolve().parents[3] / ".majoor_thumbs"
    root.mkdir(parents=True, exist_ok=True)
    return root


def _thumb_key(path: Path, size: int) -> str:
    try:
        st = path.stat()
        stamp = f"{path.resolve(strict=False)}:{st.st_mtime_ns}:{st.st_size}:{size}:{THUMB_CACHE_VERSION}"
    except OSError:
        stamp = f"{path}:{size}:{THUMB_CACHE_VERSION}"
    return hashlib.sha256(stamp.encode("utf-8", errors="replace")).hexdigest()[:32]


def _thumb_path(path: Path, size: int) -> Path:
    return thumbnail_cache_dir() / f"{_thumb_key(path, size)}.jpg"


def _clamp_size(value: Any, maximum: int = THUMB_MAX_SIZE) -> int:
    try:
        n = int(value)
    except Exception:
        n = 320
    return max(64, min(maximum, n))


def _linear_to_srgb(linear: Any) -> Any:
    import numpy as np

    clipped = np.clip(linear, 0.0, 1.0)
    return np.where(clipped <= 0.0031308, clipped * 12.92, 1.055 * np.power(clipped, 1 / 2.4) - 0.055)


def _decode_exr_rgb(source: Path) -> Any | None:
    """Decode an EXR to an sRGB uint8 HxWx3 array through PyAV (scene-linear input, no exposure change)."""
    import av
    import numpy as np

    with av.open(str(source)) as container:
        frame = next(container.decode(video=0))
        for pixel_format in ("gbrpf32le", "gbrapf32le", "grayf32le"):
            try:
                pixels = frame.to_ndarray(format=pixel_format)
            except Exception:
                continue
            if pixels.ndim == 2:
                pixels = np.stack([pixels] * 3, axis=-1)
            rgb = _linear_to_srgb(pixels[..., :3])
            return (rgb * 255.0 + 0.5).astype(np.uint8)
    return None


def _generate_image_thumb(source: Path, target: Path, size: int) -> bool:
    tmp = target.with_name(f"tmp_{target.name}")
    try:
        from PIL import Image, ImageOps

        if source.suffix.lower() == ".exr":
            decoded = _decode_exr_rgb(source)
            if decoded is None:
                return False
            rgb = Image.fromarray(decoded)
            rgb.thumbnail((size, size))
            rgb.save(tmp, "JPEG", quality=85, optimize=True)
        else:
            with Image.open(source) as img:
                try:
                    normalized = ImageOps.exif_transpose(img)
                except Exception:
                    normalized = img
                rgb = normalized.convert("RGB")
                rgb.thumbnail((size, size))
                rgb.save(tmp, "JPEG", quality=85, optimize=True)
        if tmp.exists() and tmp.stat().st_size > 0:
            os.replace(tmp, target)
            return True
    except Exception:
        return False
    finally:
        try:
            if tmp.exists():
                tmp.unlink()
        except OSError:
            pass
    return False


def _ffmpeg_bin() -> str | None:
    return shutil.which("ffmpeg") or get_env("FFMPEG")


def _generate_video_thumb(source: Path, target: Path, size: int) -> bool:
    ffmpeg = _ffmpeg_bin()
    if not ffmpeg:
        return False
    tmp = target.with_name(f"tmp_{target.name}")
    try:
        with _FFMPEG_SEM:
            proc = external_tools.run_ffmpeg(
                [
                    ffmpeg,
                    "-y",
                    "-ss",
                    "0.5",
                    "-i",
                    str(source),
                    "-vframes",
                    "1",
                    "-vf",
                    f"scale={size}:{size}:force_original_aspect_ratio=decrease:flags=lanczos",
                    "-q:v",
                    "2",
                    str(tmp),
                ],
                capture_output=True,
                timeout=20,
            )
        if proc.returncode == 0 and tmp.exists() and tmp.stat().st_size > 0:
            os.replace(tmp, target)
            return True
    except Exception:
        return False
    finally:
        try:
            if tmp.exists():
                tmp.unlink()
        except OSError:
            pass
    return False


def gc_thumbnail_cache(max_bytes: int = THUMB_CACHE_MAX_BYTES) -> None:
    if _gc_running.is_set():
        return
    _gc_running.set()
    try:
        entries = []
        total = 0
        for path in thumbnail_cache_dir().glob("*.jpg"):
            try:
                st = path.stat()
            except OSError:
                continue
            total += st.st_size
            entries.append((st.st_mtime, st.st_size, path))
        if total <= max_bytes:
            return
        for _mtime, size, path in sorted(entries):
            if total <= max_bytes:
                break
            try:
                path.unlink()
                total -= size
            except OSError:
                pass
    except Exception:
        return
    finally:
        _gc_running.clear()


def get_or_create_thumbnail(source_path: str, *, size: Any = 320, max_size: int = THUMB_MAX_SIZE) -> Result[dict[str, Any]]:
    source = Path(str(source_path)).resolve(strict=False)
    if not source.is_file():
        return Result.Err("NOT_FOUND", "File not found")
    target_size = _clamp_size(size, max_size)
    target = _thumb_path(source, target_size)
    if target.exists() and target.stat().st_size > 0:
        return Result.Ok({"path": str(target), "cache": "hit", "version": THUMB_CACHE_VERSION})
    kind = classify_file(str(source))
    ok = False
    if kind == "image":
        ok = _generate_image_thumb(source, target, target_size)
        # Pillow builds do not consistently ship a JPEG XL decoder yet.
        if not ok and source.suffix.lower() == ".jxl":
            ok = _generate_video_thumb(source, target, target_size)
    elif kind == "video":
        ok = _generate_video_thumb(source, target, target_size)
    if not ok:
        return Result.Err("THUMBNAIL_FAILED", "Failed to generate thumbnail")
    try:
        os.utime(target, (time.time(), time.time()))
    except OSError:
        pass
    threading.Thread(target=gc_thumbnail_cache, daemon=True).start()
    return Result.Ok({"path": str(target), "cache": "miss", "version": THUMB_CACHE_VERSION})


def get_or_create_preview(source_path: str) -> Result[dict[str, Any]]:
    """Full-size JPEG preview for image formats the browser cannot decode (EXR, TIFF)."""
    return get_or_create_thumbnail(source_path, size=PREVIEW_MAX_SIZE, max_size=PREVIEW_MAX_SIZE)
