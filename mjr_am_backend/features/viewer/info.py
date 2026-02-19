from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


def _parse_fps(value: Any) -> Optional[float]:
    """Safely parse FPS from various formats (number, string, fraction)."""
    if value is None:
        return None

    try:
        if isinstance(value, (int, float)):
            v = float(value)
            return v if v > 0 else None

        val_str = str(value).strip()
        if not val_str:
            return None

        # Check for fraction format '30000/1001'
        if "/" in val_str:
            num_s, den_s = val_str.split("/", 1)
            num = float(num_s)
            den = float(den_s)
            if den == 0:
                return None
            result = num / den
        else:
            # Direct number check
            result = float(val_str)

        return result if result > 0 else None

    except (ValueError, TypeError, AttributeError):
        # Expected parsing errors for invalid data
        return None
    except Exception:
        # Unexpected errors
        return None


def _pick_ffprobe_video_stream(metadata_raw: Any) -> Dict[str, Any]:
    if not isinstance(metadata_raw, dict):
        return {}
    ff = metadata_raw.get("raw_ffprobe")
    if not isinstance(ff, dict):
        return {}
    vs = ff.get("video_stream")
    return vs if isinstance(vs, dict) else {}


def _pick_ffprobe_audio_stream(metadata_raw: Any) -> Dict[str, Any]:
    if not isinstance(metadata_raw, dict):
        return {}
    ff = metadata_raw.get("raw_ffprobe")
    if not isinstance(ff, dict):
        return {}
    a = ff.get("audio_stream")
    return a if isinstance(a, dict) else {}


def _safe_cast(value: Any, caster: Any) -> Any:
    try:
        if value is None:
            return None
        return caster(value)
    except Exception:
        return None


def _asset_field(asset: Dict[str, Any], key: str, caster: Any) -> Any:
    try:
        value = asset.get(key)
    except Exception:
        return None
    return _safe_cast(value, caster)


def _extract_video_fields(info: Dict[str, Any], metadata_raw: Any) -> None:
    vs = _pick_ffprobe_video_stream(metadata_raw)
    fps_raw = _extract_fps_raw(metadata_raw, vs)
    fps = _parse_fps(fps_raw)
    info["fps"] = fps
    info["fps_raw"] = str(fps_raw) if fps_raw is not None else None
    info["frame_count"] = _extract_frame_count(vs, info, fps)


def _extract_fps_raw(metadata_raw: Any, video_stream: Dict[str, Any]) -> Any:
    if isinstance(metadata_raw, dict):
        fps_raw = metadata_raw.get("fps")
        if fps_raw is not None:
            return fps_raw
    return video_stream.get("avg_frame_rate") or video_stream.get("r_frame_rate")


def _extract_frame_count(video_stream: Dict[str, Any], info: Dict[str, Any], fps: Optional[float]) -> Optional[int]:
    frame_count = _extract_stream_frame_count(video_stream)
    if frame_count is not None:
        return frame_count
    return _estimate_frame_count(info.get("duration_s"), fps)


def _extract_stream_frame_count(video_stream: Dict[str, Any]) -> Optional[int]:
    for key in ("nb_frames", "nb_read_frames"):
        try:
            raw_val = video_stream.get(key)
            if raw_val is None:
                continue
            val = int(raw_val)
            if val > 0:
                return val
        except (ValueError, TypeError):
            continue
    return None


def _estimate_frame_count(duration_s: Any, fps: Optional[float]) -> Optional[int]:
    if not fps or not isinstance(duration_s, (int, float)) or duration_s <= 0:
        return None
    try:
        return max(1, int(round(duration_s * fps)))
    except Exception:
        return None


def _extract_audio_fields(info: Dict[str, Any], metadata_raw: Any) -> None:
    astream = _pick_ffprobe_audio_stream(metadata_raw)
    info["audio_codec"] = str(astream.get("codec_name")) if astream.get("codec_name") else None
    info["sample_rate"] = _safe_cast(astream.get("sample_rate"), int)
    info["channels"] = _safe_cast(astream.get("channels"), int)
    info["bitrate"] = _safe_cast(astream.get("bit_rate"), int)


def _apply_live_stats(info: Dict[str, Any], resolved_path: Optional[Path]) -> None:
    if resolved_path is None:
        return
    try:
        st = resolved_path.stat()
        info["size_bytes"] = st.st_size
        info["mtime"] = int(st.st_mtime)
    except OSError as exc:
        logger.warning(f"Failed to access file stats for {resolved_path}: {exc}")
    except Exception as exc:
        logger.debug(f"Unexpected error reading stats {resolved_path}: {exc}")


def build_viewer_media_info(asset: Dict[str, Any], resolved_path: Optional[Path] = None, refresh: bool = False) -> Dict[str, Any]:
    """
    Build a compact media info payload for the viewer UI.
    Must be safe to call on partially populated assets.
    """
    if not isinstance(asset, dict):
        return {}

    info: Dict[str, Any] = {}

    # Basic Info
    info["asset_id"] = asset.get("id")
    kind = str(asset.get("kind") or "").lower()
    info["kind"] = kind or None
    ext = str(asset.get("ext") or "").lower()
    info["ext"] = ext or None

    info["width"] = _asset_field(asset, "width", int)
    info["height"] = _asset_field(asset, "height", int)
    info["duration_s"] = _asset_field(asset, "duration", float)

    metadata_raw = asset.get("metadata_raw")

    if kind == "video":
        _extract_video_fields(info, metadata_raw)
    elif kind == "audio":
        _extract_audio_fields(info, metadata_raw)

    # File stats - prefer DB values initially
    info["size_bytes"] = _asset_field(asset, "size", int)
    info["mtime"] = _asset_field(asset, "mtime", int)

    # Override with live filesystem stats if path is provided
    _apply_live_stats(info, resolved_path)

    return info
