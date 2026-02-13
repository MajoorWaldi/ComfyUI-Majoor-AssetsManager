"""
Fallback metadata readers that do not depend on external binaries.

These readers provide a best-effort degraded mode when ExifTool/ffprobe
are unavailable.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from PIL import Image, ExifTags


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
            for key, value in info.items():
                if value is None:
                    continue
                key_s = str(key)
                key_l = key_s.lower()
                if key_l == "parameters":
                    out["PNG:Parameters"] = value
                    out["Parameters"] = value
                elif key_l == "workflow":
                    out["PNG:Workflow"] = value
                    out["Keys:Workflow"] = value
                    out["comfyui:workflow"] = value
                elif key_l == "prompt":
                    out["PNG:Prompt"] = value
                    out["Keys:Prompt"] = value
                    out["comfyui:prompt"] = value
                elif key_l in ("comment", "description"):
                    out["EXIF:ImageDescription"] = value
                    out["ImageDescription"] = value
                else:
                    out[f"Pillow:{key_s}"] = value

            try:
                exif = img.getexif()
            except Exception:
                exif = None
            if exif:
                for tag_id, value in dict(exif).items():
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
    except Exception:
        return {}
    return out


def read_media_probe_like(path: str) -> Dict[str, Any]:
    """
    Build an ffprobe-like dict from hachoir (if installed) for audio/video files.

    Returns an empty dict when hachoir is unavailable or parsing fails.
    """
    try:
        from hachoir.parser import createParser
        from hachoir.metadata import extractMetadata
    except Exception:
        return {}

    try:
        parser = createParser(path)
        if parser is None:
            return {}
    except Exception:
        return {}

    format_info: Dict[str, Any] = {"tags": {}}
    video_stream: Dict[str, Any] = {}
    audio_stream: Dict[str, Any] = {}

    try:
        with parser:
            meta = extractMetadata(parser)
            if meta is None:
                return {}
            lines = list(meta.exportPlaintext() or [])
    except Exception:
        return {}

    for raw_line in lines:
        line = str(raw_line).strip()
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        key_l = key.strip().lower()
        val = value.strip()

        if key_l == "duration":
            format_info["duration"] = val
        elif key_l in ("image width", "width"):
            w = _to_int(val)
            if w is not None:
                video_stream["width"] = w
        elif key_l in ("image height", "height"):
            h = _to_int(val)
            if h is not None:
                video_stream["height"] = h
        elif key_l in ("frame rate", "framerate", "fps"):
            video_stream["r_frame_rate"] = val
        elif key_l in ("audio codec", "codec"):
            audio_stream["codec_name"] = val
        elif key_l in ("sample rate", "samplerate"):
            sr = _to_int(val)
            audio_stream["sample_rate"] = sr if sr is not None else val
        elif key_l in ("channel", "channels"):
            ch = _to_int(val)
            audio_stream["channels"] = ch if ch is not None else val
        elif key_l in ("bit rate", "bitrate"):
            br = _to_int(val)
            if br is not None:
                format_info["bit_rate"] = str(br)
                audio_stream["bit_rate"] = str(br)
        else:
            if val:
                format_info["tags"][key.strip()] = val

    streams = []
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
