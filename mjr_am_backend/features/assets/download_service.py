"""Download-oriented asset helpers and handlers."""

from __future__ import annotations

import asyncio
import errno
import mimetypes
import os
import shutil
from pathlib import Path
from typing import Any, Callable

from aiohttp import web

COMFYUI_STRIP_TAGS_WEBP = [
    "EXIF:Make",
    "IFD0:Make",
    "EXIF:Model",
    "IFD0:Model",
    "EXIF:ImageDescription",
    "IFD0:ImageDescription",
    "EXIF:UserComment",
    "IFD0:UserComment",
]
COMFYUI_STRIP_TAGS_VIDEO = [
    "QuickTime:Workflow",
    "QuickTime:Prompt",
    "Keys:Workflow",
    "Keys:Prompt",
]
STRIP_SUPPORTED_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".avif", ".mp4", ".mov"}

PNG_COMFYUI_KEYWORDS = frozenset({b"workflow", b"prompt", b"parameters"})
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
PNG_TEXT_CHUNK_TYPES = frozenset({b"tEXt", b"iTXt", b"zTXt"})


def is_preview_download_request(request: web.Request) -> bool:
    return str(request.query.get("preview", "")).strip().lower() in ("1", "true", "yes", "on")


def download_rate_limit_response_or_none(
    request: web.Request,
    *,
    preview: bool,
    is_loopback_request: Callable[[web.Request], bool],
    check_rate_limit: Callable[..., tuple[bool, int | None]],
) -> web.Response | None:
    if is_loopback_request(request):
        return None
    key = "download_asset_preview" if preview else "download_asset"
    max_requests = 200 if preview else 30
    allowed, retry_after = check_rate_limit(request, key, max_requests=max_requests, window_seconds=60)
    if allowed:
        return None
    return web.Response(status=429, text=f"Rate limit exceeded. Retry after {retry_after}s")


def validate_no_symlink_open(path: Path) -> str:
    if os.name == "nt" or not hasattr(os, "O_NOFOLLOW"):
        try:
            if os.path.islink(str(path)):
                return "symlink"
            resolved = Path(os.path.realpath(str(path)))
            if resolved != path and resolved != path.resolve():
                return "symlink"
            return "ok"
        except Exception:
            return "error"
    try:
        flags = os.O_RDONLY | os.O_NOFOLLOW
        fd = os.open(str(path), flags)
        os.close(fd)
        return "ok"
    except OSError as exc:
        if getattr(exc, "errno", None) in (errno.ELOOP, errno.EACCES, errno.EPERM):
            return "symlink"
        return "error"
    except Exception:
        return "error"


def resolve_download_path(
    filepath: Any,
    *,
    normalize_path: Callable[[Any], Path | None],
    is_resolved_path_allowed: Callable[[Path], bool],
    logger: Any,
) -> Path | web.Response:
    candidate = normalize_path(filepath)
    if not candidate:
        return web.Response(status=400, text="Invalid filepath")
    try:
        if candidate.is_symlink():
            return web.Response(status=403, text="Symlinked file not allowed")
    except Exception as exc:
        logger.debug("is_symlink check failed (OS edge case): %s", exc)
    try:
        resolved = candidate.resolve(strict=True)
    except (OSError, RuntimeError, ValueError):
        return web.Response(status=404, text="File not found")
    if not is_resolved_path_allowed(resolved):
        return web.Response(status=403, text="Path is not within allowed roots")
    if not resolved.is_file():
        return web.Response(status=404, text="File not found")
    symlink_status = validate_no_symlink_open(resolved)
    if symlink_status == "symlink":
        return web.Response(status=403, text="Symlinked file not allowed")
    if symlink_status == "error":
        return web.Response(status=403, text="Unable to verify file safety")
    return resolved


def build_download_response(resolved: Path, *, preview: bool) -> web.StreamResponse:
    mime_type, _ = mimetypes.guess_type(str(resolved))
    safe_mime = mime_type or "application/octet-stream"
    filename = safe_download_filename(resolved.name)
    disposition = "inline" if preview else "attachment"

    response = web.FileResponse(path=str(resolved))
    try:
        response.headers["Content-Type"] = safe_mime
        response.headers["Content-Disposition"] = f'{disposition}; filename="{filename}"'
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Cache-Control"] = "private, max-age=60" if preview else "private, no-cache"
    except Exception:
        pass
    return response


def safe_download_filename(name: str) -> str:
    raw = str(name or "")
    cleaned = "".join(ch for ch in raw if ch.isprintable() and ch not in ('"', ';', '\x00'))
    return cleaned[:255]


def strip_png_comfyui_chunks(data: bytes) -> bytes:
    if len(data) < 8 or data[:8] != PNG_SIGNATURE:
        return data

    out = bytearray(data[:8])
    pos = 8
    try:
        while pos + 8 <= len(data):
            chunk_len = int.from_bytes(data[pos : pos + 4], "big")
            chunk_type = data[pos + 4 : pos + 8]
            total = 12 + chunk_len
            if pos + total > len(data):
                out.extend(data[pos:])
                break

            if chunk_type in PNG_TEXT_CHUNK_TYPES:
                chunk_data = data[pos + 8 : pos + 8 + chunk_len]
                null_idx = chunk_data.find(b"\x00")
                keyword = chunk_data[:null_idx] if null_idx >= 0 else chunk_data
                if keyword.lower() in PNG_COMFYUI_KEYWORDS:
                    pos += total
                    continue

            out.extend(data[pos : pos + total])
            pos += total
    except Exception:
        return data
    return bytes(out)


def strip_tags_for_ext(ext: str) -> list[str]:
    ext = ext.lower()
    if ext == ".png":
        return []
    if ext in (".webp", ".avif", ".jpg", ".jpeg"):
        return COMFYUI_STRIP_TAGS_WEBP
    if ext in (".mp4", ".mov"):
        return COMFYUI_STRIP_TAGS_VIDEO
    return []


async def download_clean_png(
    resolved_path: Path,
    *,
    logger: Any,
    build_download_response: Callable[[Path], web.StreamResponse],
    safe_download_filename: Callable[[str], str],
) -> web.StreamResponse:
    import mimetypes

    try:
        raw = await asyncio.to_thread(resolved_path.read_bytes)
        data = await asyncio.to_thread(strip_png_comfyui_chunks, raw)
        mime_type, _ = mimetypes.guess_type(str(resolved_path))
        safe_name = safe_download_filename(resolved_path.name)
        return web.Response(
            body=data,
            content_type=mime_type or "image/png",
            headers={
                "Content-Disposition": f'attachment; filename="{safe_name}"',
                "X-Content-Type-Options": "nosniff",
                "X-MJR-Metadata-Stripped": "true",
                "Cache-Control": "private, no-cache",
            },
        )
    except Exception as exc:
        logger.error("PNG metadata strip failed: %s", exc)
        return build_download_response(resolved_path)


async def download_clean_exiftool(
    resolved_path: Path,
    ext: str,
    exiftool: Any,
    *,
    logger: Any,
    build_download_response: Callable[[Path], web.StreamResponse],
    safe_download_filename: Callable[[str], str],
) -> web.StreamResponse:
    import mimetypes
    import tempfile

    tmp_dir = None
    try:
        tmp_dir = tempfile.mkdtemp(prefix="mjr_clean_")
        tmp_path = Path(tmp_dir) / resolved_path.name
        shutil.copy2(str(resolved_path), str(tmp_path))

        tags_to_strip = strip_tags_for_ext(ext)
        stripped = False

        if tags_to_strip:
            metadata_clear = {tag: None for tag in tags_to_strip}
            strip_result = await asyncio.to_thread(exiftool.write, str(tmp_path), metadata_clear, False)
            if strip_result.ok:
                stripped = True
            else:
                logger.warning("Targeted metadata strip failed: %s - trying -all=", strip_result.error)

        if not stripped:
            fallback_result = await asyncio.to_thread(exiftool.write, str(tmp_path), {"all": None}, False)
            if not fallback_result.ok:
                logger.warning(
                    "Fallback metadata strip also failed: %s - serving original",
                    fallback_result.error,
                )
                shutil.rmtree(tmp_dir, ignore_errors=True)
                return build_download_response(resolved_path)

        data = await asyncio.to_thread(tmp_path.read_bytes)
        shutil.rmtree(tmp_dir, ignore_errors=True)
        tmp_dir = None

        mime_type, _ = mimetypes.guess_type(str(resolved_path))
        safe_name = safe_download_filename(resolved_path.name)
        return web.Response(
            body=data,
            content_type=mime_type or "application/octet-stream",
            headers={
                "Content-Disposition": f'attachment; filename="{safe_name}"',
                "X-Content-Type-Options": "nosniff",
                "X-MJR-Metadata-Stripped": "true",
                "Cache-Control": "private, no-cache",
            },
        )
    except Exception as exc:
        logger.error("download-clean failed: %s", exc)
        if tmp_dir:
            try:
                shutil.rmtree(tmp_dir, ignore_errors=True)
            except Exception:
                pass
        return build_download_response(resolved_path)


async def handle_download_asset(
    request: web.Request,
    *,
    is_preview_download_request: Callable[[web.Request], bool],
    download_rate_limit_response_or_none: Callable[..., web.Response | None],
    resolve_download_path: Callable[[Any], Path | web.Response],
    build_download_response: Callable[[Path], web.StreamResponse],
) -> web.StreamResponse:
    preview = is_preview_download_request(request)
    rate_limited = download_rate_limit_response_or_none(request, preview=preview)
    if rate_limited is not None:
        return rate_limited

    filepath = request.query.get("filepath")
    if not filepath:
        return web.Response(status=400, text="Missing 'filepath' parameter")

    resolved_path = resolve_download_path(filepath)
    if not isinstance(resolved_path, Path):
        return resolved_path
    return build_download_response(resolved_path)


async def handle_download_clean_asset(
    request: web.Request,
    *,
    download_rate_limit_response_or_none: Callable[..., web.Response | None],
    resolve_download_path: Callable[[Any], Path | web.Response],
    strip_supported_exts: set[str],
    build_download_response: Callable[[Path], web.StreamResponse],
    download_clean_png: Callable[[Path], Any],
    require_services: Callable[[], Any],
    logger: Any,
    download_clean_exiftool: Callable[[Path, str, Any], Any],
) -> web.StreamResponse:
    rate_limited = download_rate_limit_response_or_none(request, preview=False)
    if rate_limited is not None:
        return rate_limited

    filepath = request.query.get("filepath")
    if not filepath:
        return web.Response(status=400, text="Missing 'filepath' parameter")

    resolved_path = resolve_download_path(filepath)
    if not isinstance(resolved_path, Path):
        return resolved_path

    ext = resolved_path.suffix.lower()
    if ext not in strip_supported_exts:
        return build_download_response(resolved_path)

    if ext == ".png":
        return await download_clean_png(resolved_path)

    svc, svc_err = await require_services()
    if svc_err or not svc:
        return build_download_response(resolved_path)

    exiftool = svc.get("exiftool")
    if not exiftool or not getattr(exiftool, "_available", False):
        logger.warning("ExifTool not available - serving original file without stripping")
        return build_download_response(resolved_path)

    return await download_clean_exiftool(resolved_path, ext, exiftool)


__all__ = [
    "COMFYUI_STRIP_TAGS_VIDEO",
    "COMFYUI_STRIP_TAGS_WEBP",
    "STRIP_SUPPORTED_EXTS",
    "build_download_response",
    "download_clean_exiftool",
    "download_clean_png",
    "download_rate_limit_response_or_none",
    "handle_download_asset",
    "handle_download_clean_asset",
    "is_preview_download_request",
    "resolve_download_path",
    "safe_download_filename",
    "strip_png_comfyui_chunks",
    "strip_tags_for_ext",
    "validate_no_symlink_open",
]