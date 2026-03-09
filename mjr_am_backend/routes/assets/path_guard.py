"""Path and download guards extracted from handlers/assets.py."""
import errno
import mimetypes
import os
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
        if candidate.is_symlink():
            return web.Response(status=403, text="Symlinked file not allowed")
    except Exception:
        pass
    try:
        resolved = candidate.resolve(strict=True)
    except (OSError, RuntimeError, ValueError):
        return web.Response(status=404, text="File not found")
    if not is_resolved_path_allowed(resolved):
        return web.Response(status=403, text="Path is not within allowed roots")
    if not resolved.is_file():
        return web.Response(status=404, text="File not found")
    symlink_status = _validate_no_symlink_open(resolved)
    if symlink_status == "symlink" or symlink_status is False:
        return web.Response(status=403, text="Symlinked file not allowed")
    if symlink_status == "error":
        return web.Response(status=403, text="Unable to verify file safety")
    return resolved


def _validate_no_symlink_open(path: Path) -> str:
    """Check that *path* is not a symlink.

    Returns:
        "ok"      – path is a regular file and not a symlink.
        "symlink" – path is (or contains) a symlink.
        "error"   – an unexpected error prevented the check.
    """
    # On Windows O_NOFOLLOW is unavailable; fall back to explicit checks.
    if os.name == "nt" or not hasattr(os, "O_NOFOLLOW"):
        try:
            if os.path.islink(str(path)):
                return "symlink"
            # Also compare resolved path to catch intermediate symlinks.
            resolved = Path(os.path.realpath(str(path)))
            if resolved != path and resolved != path.resolve():
                return "symlink"
            return "ok"
        except Exception:
            return "error"
    # Unix: use O_NOFOLLOW for an atomic open-time check.
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
