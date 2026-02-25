"""Visual dimension normalization helpers extracted from service.py."""
from typing import Any, Callable


def coerce_dimension(value: Any) -> int | None:
    try:
        if value is None:
            return None
        if isinstance(value, str):
            s = value.strip().lower().replace("px", "").strip()
            if not s:
                return None
            value = s
        out = int(float(value))
        return out if out > 0 else None
    except Exception:
        return None


def fill_dims_from_resolution(payload: dict[str, Any], w: int | None, h: int | None, coerce: Callable[[Any], int | None]) -> tuple[int | None, int | None]:
    resolution = payload.get("resolution")
    if (w is not None and h is not None) or not resolution:
        return w, h
    if not isinstance(resolution, (list, tuple)) or len(resolution) < 2:
        return w, h
    try:
        rw, rh = resolution[0], resolution[1]
        if w is None:
            w = coerce(rw)
        if h is None:
            h = coerce(rh)
    except Exception:
        return w, h
    return w, h


def pick_first_coerced(source: dict[str, Any], keys: tuple[str, ...], coerce: Callable[[Any], int | None]) -> int | None:
    for key in keys:
        value = coerce(source.get(key))
        if value is not None:
            return value
    return None


def fill_dims_from_ffprobe(ffprobe_data: dict[str, Any] | None, w: int | None, h: int | None, coerce: Callable[[Any], int | None]) -> tuple[int | None, int | None]:
    if w is not None and h is not None:
        return w, h
    if not isinstance(ffprobe_data, dict):
        return w, h
    try:
        video_stream = ffprobe_data.get("video_stream") or {}
        if w is None:
            w = coerce(video_stream.get("width"))
        if h is None:
            h = coerce(video_stream.get("height"))
    except Exception:
        return w, h
    return w, h


def fill_dims_from_exif(exif_data: dict[str, Any] | None, w: int | None, h: int | None, coerce: Callable[[Any], int | None]) -> tuple[int | None, int | None]:
    if w is not None and h is not None:
        return w, h
    if not isinstance(exif_data, dict):
        return w, h
    width_keys = (
        "Image:ImageWidth", "EXIF:ImageWidth", "EXIF:ExifImageWidth", "IFD0:ImageWidth", "Composite:ImageWidth", "QuickTime:ImageWidth", "PNG:ImageWidth", "File:ImageWidth", "width",
    )
    height_keys = (
        "Image:ImageHeight", "EXIF:ImageHeight", "EXIF:ExifImageHeight", "IFD0:ImageHeight", "Composite:ImageHeight", "QuickTime:ImageHeight", "PNG:ImageHeight", "File:ImageHeight", "height",
    )
    if w is None:
        w = pick_first_coerced(exif_data, width_keys, coerce)
    if h is None:
        h = pick_first_coerced(exif_data, height_keys, coerce)
    return w, h


def normalize_dimensions(payload: dict[str, Any], exif_data: dict[str, Any] | None = None, ffprobe_data: dict[str, Any] | None = None) -> None:
    w = coerce_dimension(payload.get("width"))
    h = coerce_dimension(payload.get("height"))
    w, h = fill_dims_from_resolution(payload, w, h, coerce_dimension)
    w, h = fill_dims_from_ffprobe(ffprobe_data, w, h, coerce_dimension)
    w, h = fill_dims_from_exif(exif_data, w, h, coerce_dimension)
    if w is not None and h is not None:
        payload["width"] = int(w)
        payload["height"] = int(h)


def get_file_info(file_path: str, classify_file) -> dict[str, Any]:
    import os
    stat = os.stat(file_path)
    info = {
        "filename": os.path.basename(file_path),
        "filepath": file_path,
        "size": stat.st_size,
        "mtime": stat.st_mtime,
        "ctime": stat.st_ctime,
        "kind": classify_file(file_path),
        "ext": os.path.splitext(file_path)[1].lower(),
    }
    birthtime = getattr(stat, "st_birthtime", None)
    if birthtime is not None:
        info["birthtime"] = birthtime
    return info
