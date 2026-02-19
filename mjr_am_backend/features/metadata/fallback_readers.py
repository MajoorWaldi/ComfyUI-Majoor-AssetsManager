"""
Fallback metadata readers that do not depend on external binaries.

These readers provide a best-effort degraded mode when ExifTool/ffprobe
are unavailable.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from PIL import Image, ExifTags


def _apply_image_info_exif_like(out: Dict[str, Any], info: Dict[str, Any]) -> None:
    for key, value in info.items():
        if value is None:
            continue
        key_s = str(key)
        key_l = key_s.lower()
        if key_l == "parameters":
            out["PNG:Parameters"] = value
            out["Parameters"] = value
            continue
        if key_l == "workflow":
            out["PNG:Workflow"] = value
            out["Keys:Workflow"] = value
            out["comfyui:workflow"] = value
            continue
        if key_l == "prompt":
            out["PNG:Prompt"] = value
            out["Keys:Prompt"] = value
            out["comfyui:prompt"] = value
            continue
        if key_l in ("comment", "description"):
            out["EXIF:ImageDescription"] = value
            out["ImageDescription"] = value
            continue
        out[f"Pillow:{key_s}"] = value


def _safe_image_exif_dict(img: Any) -> Dict[Any, Any]:
    try:
        exif = img.getexif()
    except Exception:
        exif = None
    return dict(exif) if exif else {}


def _apply_pillow_exif_fields(out: Dict[str, Any], exif_map: Dict[Any, Any]) -> None:
    for tag_id, value in exif_map.items():
        try:
            tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
        except Exception:
            tag_name = str(tag_id)
        out[f"EXIF:{tag_name}"] = value
        if tag_name == "ImageDescription":
            out["IFD0:ImageDescription"] = value
        if tag_name == "Make":
            out["IFD0:Make"] = value
        if tag_name == "Model":
            out["IFD0:Model"] = value


def read_image_exif_like(path: str) -> Dict[str, Any]:
    """
    Build an ExifTool-like dict from Pillow data for image files.

    Returns an empty dict on failure.
    """
    out: Dict[str, Any] = {}
    try:
        with Image.open(path) as img:
            out["Composite:ImageSize"] = f"{img.width} {img.height}"
            out["Image:ImageWidth"] = int(img.width)
            out["Image:ImageHeight"] = int(img.height)

            info = dict(getattr(img, "info", {}) or {})
            _apply_image_info_exif_like(out, info)
            _apply_pillow_exif_fields(out, _safe_image_exif_dict(img))
    except Exception:
        return {}
    return out


def read_media_probe_like(path: str) -> Dict[str, Any]:
    """
    Build an ffprobe-like dict from hachoir (if installed) for audio/video files.

    Returns an empty dict when hachoir is unavailable or parsing fails.
    """
    parser, extract_metadata = _load_hachoir_parser(path)
    if parser is None or extract_metadata is None:
        return {}
    lines = _extract_hachoir_lines(parser, extract_metadata)
    if lines is None:
        return {}

    format_info: Dict[str, Any] = {"tags": {}}
    video_stream: Dict[str, Any] = {}
    audio_stream: Dict[str, Any] = {}

    for raw_line in lines:
        _apply_probe_line(str(raw_line), format_info, video_stream, audio_stream)

    return _build_media_probe_payload(format_info, video_stream, audio_stream)


def _load_hachoir_parser(path: str):
    try:
        from hachoir.parser import createParser
        from hachoir.metadata import extractMetadata
    except Exception:
        return None, None
    try:
        parser = createParser(path)
        if parser is None:
            return None, None
    except Exception:
        return None, None
    return parser, extractMetadata


def _extract_hachoir_lines(parser: Any, extract_metadata: Any) -> Optional[list[Any]]:
    try:
        with parser:
            meta = extract_metadata(parser)
            if meta is None:
                return None
            return list(meta.exportPlaintext() or [])
    except Exception:
        return None


def _apply_probe_line(
    raw_line: str,
    format_info: Dict[str, Any],
    video_stream: Dict[str, Any],
    audio_stream: Dict[str, Any],
) -> None:
    line = str(raw_line).strip()
    if ":" not in line:
        return
    key, value = line.split(":", 1)
    key_l = key.strip().lower()
    val = value.strip()
    if _apply_known_probe_line(key_l, val, format_info, video_stream, audio_stream):
        return
    if val:
        format_info["tags"][key.strip()] = val


def _apply_known_probe_line(
    key_l: str,
    val: str,
    format_info: Dict[str, Any],
    video_stream: Dict[str, Any],
    audio_stream: Dict[str, Any],
) -> bool:
    if key_l == "duration":
        format_info["duration"] = val
        return True
    if key_l in ("image width", "width"):
        _set_int_if_present(video_stream, "width", val)
        return True
    if key_l in ("image height", "height"):
        _set_int_if_present(video_stream, "height", val)
        return True
    if key_l in ("frame rate", "framerate", "fps"):
        video_stream["r_frame_rate"] = val
        return True
    if key_l in ("audio codec", "codec"):
        audio_stream["codec_name"] = val
        return True
    if key_l in ("sample rate", "samplerate"):
        _set_int_or_raw(audio_stream, "sample_rate", val)
        return True
    if key_l in ("channel", "channels"):
        _set_int_or_raw(audio_stream, "channels", val)
        return True
    if key_l in ("bit rate", "bitrate"):
        _apply_probe_bitrate(val, format_info, audio_stream)
        return True
    return False


def _apply_probe_bitrate(val: str, format_info: Dict[str, Any], audio_stream: Dict[str, Any]) -> None:
    bitrate = _to_int(val)
    if bitrate is None:
        return
    bitrate_str = str(bitrate)
    format_info["bit_rate"] = bitrate_str
    audio_stream["bit_rate"] = bitrate_str


def _set_int_if_present(target: Dict[str, Any], key: str, value: Any) -> None:
    parsed = _to_int(value)
    if parsed is not None:
        target[key] = parsed


def _set_int_or_raw(target: Dict[str, Any], key: str, value: Any) -> None:
    parsed = _to_int(value)
    target[key] = parsed if parsed is not None else value


def _build_media_probe_payload(
    format_info: Dict[str, Any],
    video_stream: Dict[str, Any],
    audio_stream: Dict[str, Any],
) -> Dict[str, Any]:
    streams: list[Dict[str, Any]] = []
    if video_stream:
        video_stream["codec_type"] = "video"
        streams.append(video_stream)
    if audio_stream:
        audio_stream["codec_type"] = "audio"
        streams.append(audio_stream)
    if not format_info.get("duration") and not streams and not format_info.get("tags"):
        return {}
    return {
        "format": format_info,
        "streams": streams,
        "video_stream": video_stream,
        "audio_stream": audio_stream,
    }


def _to_int(text: Any) -> Optional[int]:
    s = str(text or "")
    digits = "".join(ch for ch in s if ch.isdigit())
    if not digits:
        return None
    try:
        return int(digits)
    except Exception:
        return None
