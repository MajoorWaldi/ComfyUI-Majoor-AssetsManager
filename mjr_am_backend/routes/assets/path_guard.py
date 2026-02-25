"""Path and download guards extracted from handlers/assets.py."""
import mimetypes
from pathlib import Path
from typing import Any

from aiohttp import web

from mjr_am_backend.shared import Result
from mjr_am_backend.shared import sanitize_error_message as safe_error_message

from ..core import _is_path_allowed, _is_path_allowed_custom, _normalize_path


def is_resolved_path_allowed(path: Path) -> bool:
    try:
        return bool(_is_path_allowed(path) or _is_path_allowed_custom(path))
    except Exception:
        return False


def delete_file_best_effort(path: Path) -> Result[bool]:
    try:
        if not path.exists() or not path.is_file():
            return Result.Ok(True, method="noop")
    except Exception as exc:
        return Result.Err("DELETE_FAILED", safe_error_message(exc, "Failed to stat file"))

    try:
        from send2trash import send2trash  # type: ignore

        try:
            send2trash(str(path))
            return Result.Ok(True, method="send2trash")
        except Exception as exc:
            try:
                path.unlink(missing_ok=True)
                return Result.Ok(True, method="unlink_fallback", warning=safe_error_message(exc, "send2trash failed"))
            except Exception as exc2:
                return Result.Err("DELETE_FAILED", safe_error_message(exc2, "Failed to delete file"))
    except Exception:
        try:
            path.unlink(missing_ok=True)
            return Result.Ok(True, method="unlink")
        except Exception as exc:
            return Result.Err("DELETE_FAILED", safe_error_message(exc, "Failed to delete file"))


def resolve_download_path(filepath: Any) -> Path | web.Response:
    candidate = _normalize_path(filepath)
    if not candidate:
        return web.Response(status=400, text="Invalid filepath")
    try:
        resolved = candidate.resolve(strict=True)
    except (OSError, RuntimeError, ValueError):
        return web.Response(status=404, text="File not found")
    if not is_resolved_path_allowed(resolved):
        return web.Response(status=403, text="Path is not within allowed roots")
    if not resolved.is_file():
        return web.Response(status=404, text="File not found")
    return resolved


def safe_download_filename(name: str) -> str:
    return str(name or "").replace('"', "").replace(";", "").replace("\r", "").replace("\n", "")[:255]


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
