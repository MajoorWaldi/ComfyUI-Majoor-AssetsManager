"""Local media operations shared by indexing and metadata adapters."""
from __future__ import annotations

import io
import math

from . import external_tools
from .ffprobe import FFProbe


def video_duration(path: str, probe_bin: str) -> float | None:
    result = FFProbe(bin_name=probe_bin, timeout=15).get_duration(path)
    if result.ok and result.data is not None and math.isfinite(result.data) and result.data >= 0:
        return result.data
    return None


def video_frame(path: str, timestamp: float, probe_bin: str):
    from PIL import Image

    if not math.isfinite(timestamp) or timestamp < 0:
        raise ValueError("Invalid frame timestamp")
    proc = external_tools.run_ffmpeg(
        [external_tools.ffmpeg_from_probe(probe_bin), "-ss", str(timestamp),
         "-i", path, "-frames:v", "1", "-f", "image2pipe", "-vcodec", "png", "-"],
        capture_output=True, timeout=30,
    )
    if proc.returncode == 0 and proc.stdout:
        with Image.open(io.BytesIO(proc.stdout)) as frame:
            return frame.convert("RGB")
    return None
