"""
Custom roots management endpoints.
"""
import os
import sys
import errno
import asyncio
import shutil
from pathlib import Path
from aiohttp import web
from mjr_am_backend.custom_roots import (
    add_custom_root,
    list_custom_roots,
    remove_custom_root,
    resolve_custom_root,
)
from mjr_am_backend.shared import Result, get_logger, sanitize_error_message
from ..core import (
    _json_response,
    _csrf_error,
    _safe_rel_path,
    _is_within_root,
    _normalize_path,
    _is_path_allowed,
    _is_path_allowed_custom,
    _read_json,
    _guess_content_type_for_file,
    _is_allowed_view_media_file,
    _require_services,
)
from ..core.security import _check_rate_limit
from .filesystem import _kickoff_background_scan, _invalidate_fs_list_cache

# Import tkinter only when needed to avoid startup issues
tk = None
filedialog = None
try:
    import tkinter as tk_module
    from tkinter import filedialog as fd_module
    tk = tk_module
    filedialog = fd_module
except ImportError:
    pass  # tkinter not available, native browser will not work

logger = get_logger(__name__)


def _compute_folder_stats(folder_path: Path, *, max_entries: int = 200000) -> dict:
    files = 0
    folders = 0
    total_size = 0
    scanned = 0
    truncated = False

    stack = [folder_path]
    while stack:
        cur = stack.pop()
        try:
            with os.scandir(cur) as it:
                for entry in it:
                    scanned += 1
                    if scanned > max_entries:
                        truncated = True
                        break
                    try:
                        if entry.is_symlink():
                            continue
                    except Exception:
                        continue
                    try:
                        if entry.is_dir(follow_symlinks=False):
                            folders += 1
                            try:
                                stack.append(Path(entry.path))
                            except Exception:
                                continue
                            continue
                        if entry.is_file(follow_symlinks=False):
                            files += 1
                            try:
                                total_size += int(entry.stat(follow_symlinks=False).st_size or 0)
                            except Exception:
                                continue
                    except Exception:
                        continue
        except Exception:
            continue
        if truncated:
            break

    try:
        st = folder_path.stat()
        mtime = int(st.st_mtime)
        ctime = int(st.st_ctime)
    except Exception:
        mtime = 0
        ctime = 0

    return {
        "path": str(folder_path),
        "name": folder_path.name or str(folder_path),
        "files": int(files),
        "folders": int(folders),
        "size": int(total_size),
        "mtime": int(mtime),
        "ctime": int(ctime),
        "scanned_entries": int(scanned),
        "truncated": bool(truncated),
    }


def register_custom_roots_routes(routes: web.RouteTableDef) -> None:
    """Register custom root directory routes."""

    def _is_filesystem_root(path: Path) -> bool:
        try:
            p = path.resolve(strict=True)
        except Exception:
            return True
        try:
            if os.name == "nt":
                text = str(p).replace("\\", "/").rstrip("/")
                return len(text) == 2 and text[1] == ":"
            return str(p) == "/"
        except Exception:
            return True

    def _safe_folder_name(value: str) -> str:
        name = str(value or "").strip()
        if not name or "\x00" in name:
            return ""
        if name in (".", ".."):
            return ""
        if "/" in name or "\\" in name:
            return ""
        return name

    @routes.post("/mjr/sys/browse-folder")
    async def browse_folder_dialog(request):
        import os

        allowed, retry_after = _check_rate_limit(request, "browse_folder", max_requests=3, window_seconds=30)
        if not allowed:
            return _json_response(Result.Err("RATE_LIMIT", "Too many browse requests", retry_after=retry_after))

        # Check if tkinter is available
        if tk is None or filedialog is None:
            logger.error("Tkinter is not available in this environment")
            return _json_response(Result.Err("TKINTER_UNAVAILABLE", "Tkinter is not available"))

        # Check if we're in a headless environment (Linux only).
        # macOS does not rely on DISPLAY for native dialogs.
        if os.getenv("DISPLAY") is None and sys.platform.startswith("linux"):
            # On Linux systems without a display, tkinter won't work.
            logger.info("Running in headless environment, skipping tkinter dialog")
            return _json_response(Result.Err("HEADLESS_ENV", "No display available for folder browser"))

        # Check if tkinter is working properly
        try:
            # For tkinter to work properly in some environments, we may need to ensure it runs in main thread
            def run_tkinter():
                # Initialize tkinter in a way that works better with web servers
                root = tk.Tk()
                root.withdraw()  # Hide the main window
                root.attributes('-topmost', True)  # Bring window to front

                # Open the selector
                directory = filedialog.askdirectory(title="Select Folder for Majoor Assets")

                root.destroy()  # Close the Tkinter instance
                return directory

            # Run tkinter in the current thread (for web server compatibility)
            directory = run_tkinter()

            if directory:
                return _json_response(Result.Ok({"path": directory}))
            else:
                return _json_response(Result.Err("CANCELLED", "Selection cancelled"))
        except Exception as e:
            logger.error(f"Tkinter browse dialog failed: {e}")
            # Return an error that the frontend can handle
            return _json_response(Result.Err("TKINTER_ERROR", "Browse dialog failed"))

    @routes.get("/mjr/am/custom-roots")
    async def get_custom_roots(request):
        result = list_custom_roots()
        return _json_response(result)

    @routes.post("/mjr/am/custom-roots")
    async def post_custom_roots(request):
        csrf = _csrf_error(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))

        body_res = await _read_json(request)
        if not body_res.ok:
            return _json_response(body_res)
        body = body_res.data or {}

        path = body.get("path") or body.get("directory") or body.get("root")
        label = body.get("label")
        result = add_custom_root(str(path or ""), label=str(label) if label is not None else None)
        if result.ok and isinstance(result.data, dict):
            root_path = str(result.data.get("path") or "")
            root_id = str(result.data.get("id") or "")
            # Add to watcher if available
            try:
                svc, _ = await _require_services()
                watcher = svc.get("watcher") if svc else None
                if watcher and root_path:
                    watcher.add_path(root_path, source="custom", root_id=root_id)
            except Exception:
                pass
            # Trigger background scan
            try:
                if root_path and root_id:
                    await _kickoff_background_scan(root_path, source="custom", root_id=root_id, recursive=True, incremental=True)
            except Exception as exc:
                logger.debug("Background scan kickoff skipped: %s", exc)
        return _json_response(result)

    @routes.post("/mjr/am/custom-roots/remove")
    async def post_custom_roots_remove(request):
        csrf = _csrf_error(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))

        body_res = await _read_json(request)
        if not body_res.ok:
            return _json_response(body_res)
        body = body_res.data or {}

        rid = body.get("id") or body.get("root_id")
        root_path = None
        try:
            resolved = resolve_custom_root(str(rid or ""))
            if resolved.ok:
                root_path = resolved.data
        except Exception:
            root_path = None

        result = remove_custom_root(str(rid or ""))
        if result.ok and root_path:
            try:
                svc, _ = await _require_services()
                if svc:
                    # Remove from watcher
                    watcher = svc.get("watcher")
                    if watcher:
                        watcher.remove_path(str(root_path))
                    # Clean up database
                    db = svc.get("db")
                    if db:
                        await db.aexecute(
                            "DELETE FROM assets WHERE source = 'custom' AND root_id = ?",
                            (str(rid or ""),),
                        )
            except Exception:
                pass
        return _json_response(result)

    @routes.get("/mjr/am/custom-view")
    async def custom_view(request):
        """
        Serve a media file for custom scope.

        Query params:
          root_id: custom root id
          filename: file name
          subfolder: optional subfolder under the root
          filepath: absolute file path (browser mode, no root_id required)
        """
        root_id = request.query.get("root_id", "").strip()
        filename = request.query.get("filename", "").strip()
        subfolder = request.query.get("subfolder", "").strip()
        filepath = request.query.get("filepath", "").strip()
        browser_mode = str(request.query.get("browser_mode", "") or "").strip().lower() in {"1", "true", "yes", "on"}

        if filepath:
            candidate = _normalize_path(filepath)
            if not candidate:
                return _json_response(Result.Err("INVALID_INPUT", "Invalid filepath"))
            if not (_is_path_allowed(candidate, must_exist=True) or _is_path_allowed_custom(candidate) or browser_mode):
                return _json_response(Result.Err("FORBIDDEN", "Path is not within allowed roots"))
            root_dir = None
        else:
            if not root_id or not filename:
                return _json_response(Result.Err("INVALID_INPUT", "Missing root_id or filename"))

            root_result = resolve_custom_root(root_id)
            if not root_result.ok:
                return _json_response(root_result)

            root_dir = root_result.data
            rel = _safe_rel_path(subfolder)
            if rel is None:
                return _json_response(Result.Err("INVALID_INPUT", "Invalid subfolder"))

            # Ensure filename is a basename (no traversal)
            if Path(filename).name != filename:
                return _json_response(Result.Err("INVALID_INPUT", "Invalid filename"))

            candidate = (root_dir / rel / filename)

            # SECURITY: Validate path is within root before any file operations
            if not _is_within_root(candidate, root_dir):
                return _json_response(Result.Err("INVALID_INPUT", "Path outside root"))

        def _validate_no_symlink_open(path: Path) -> bool:
            try:
                flags = os.O_RDONLY
                if os.name == "nt" and hasattr(os, "O_BINARY"):
                    flags |= os.O_BINARY
                # Best-effort: disallow following symlinks where supported.
                if hasattr(os, "O_NOFOLLOW"):
                    flags |= os.O_NOFOLLOW
                fd = os.open(str(path), flags)
                os.close(fd)
                return True
            except OSError as exc:
                if getattr(exc, "errno", None) in (errno.ELOOP, errno.EACCES, errno.EPERM):
                    return False
                return False
            except Exception:
                return False

        try:
            resolved_path = candidate.resolve(strict=True)
            # Prevent symlink/junction escapes for rooted mode.
            if root_dir is not None and not _is_within_root(resolved_path, root_dir):
                return _json_response(Result.Err("FORBIDDEN", "Path escapes root"))
            if not resolved_path.is_file():
                return _json_response(Result.Err("NOT_FOUND", "File not found or not a regular file"))
            if not _validate_no_symlink_open(resolved_path):
                return _json_response(Result.Err("FORBIDDEN", "Symlinked file not allowed"))

            # Viewer hardening: only serve image/video media files from custom roots.
            if not _is_allowed_view_media_file(resolved_path):
                return _json_response(Result.Err("UNSUPPORTED", "Unsupported file type for viewer"))

            content_type = _guess_content_type_for_file(resolved_path)
            resp = web.FileResponse(path=str(resolved_path))
            try:
                resp.headers["Content-Type"] = content_type
                resp.headers["Cache-Control"] = "no-cache"
                resp.headers["X-Content-Type-Options"] = "nosniff"
                resp.headers["Content-Security-Policy"] = "default-src 'none'"
                resp.headers["X-Frame-Options"] = "DENY"
            except Exception:
                pass
            return resp
        except FileNotFoundError:
            return _json_response(Result.Err("NOT_FOUND", "File not found"))
        except (OSError, RuntimeError, ValueError) as exc:
            return _json_response(
                Result.Err("VIEW_FAILED", sanitize_error_message(exc, "Failed to serve file"))
            )

    @routes.get("/mjr/am/folder-info")
    async def folder_info(request):
        """
        Return folder details for sidebar metadata panel.

        Query params:
          - filepath: absolute folder path (browser mode)
          - root_id + subfolder: folder under a configured custom root
        """
        filepath = str(request.query.get("filepath", "") or "").strip()
        root_id = str(request.query.get("root_id", "") or "").strip()
        subfolder = str(request.query.get("subfolder", "") or "").strip()
        browser_mode = str(request.query.get("browser_mode", "") or "").strip().lower() in {"1", "true", "yes", "on"}

        target = None
        base_root = None

        if filepath:
            try:
                normalized = _normalize_path(filepath)
                if not normalized:
                    return _json_response(Result.Err("INVALID_INPUT", "Invalid filepath"))
                if not (_is_path_allowed(normalized, must_exist=True) or _is_path_allowed_custom(normalized) or browser_mode):
                    return _json_response(Result.Err("FORBIDDEN", "Path is not within allowed roots"))
                target = normalized.resolve(strict=True)
            except Exception:
                return _json_response(Result.Err("DIR_NOT_FOUND", "Directory not found"))
        else:
            if not root_id:
                return _json_response(Result.Err("INVALID_INPUT", "Missing filepath or root_id"))
            root_result = resolve_custom_root(root_id)
            if not root_result.ok:
                return _json_response(root_result)
            base_root = Path(root_result.data).resolve(strict=False)
            rel = _safe_rel_path(subfolder or "")
            if rel is None:
                return _json_response(Result.Err("INVALID_INPUT", "Invalid subfolder"))
            target = (base_root / rel)
            try:
                target = target.resolve(strict=True)
            except Exception:
                return _json_response(Result.Err("DIR_NOT_FOUND", "Directory not found"))
            if not _is_within_root(target, base_root):
                return _json_response(Result.Err("FORBIDDEN", "Path outside root"))

        if not target or not target.exists() or not target.is_dir():
            return _json_response(Result.Err("DIR_NOT_FOUND", "Directory not found"))

        try:
            stats = await asyncio.to_thread(_compute_folder_stats, target)
        except Exception:
            stats = _compute_folder_stats(target)

        if base_root is not None:
            try:
                stats["root_id"] = root_id
                stats["relative_path"] = str(target.relative_to(base_root)).replace("\\", "/")
            except Exception:
                pass
        return _json_response(Result.Ok(stats))

    @routes.post("/mjr/am/browser/folder-op")
    async def browser_folder_op(request):
        csrf = _csrf_error(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))

        allowed, retry_after = _check_rate_limit(request, "browser_folder_op", max_requests=20, window_seconds=30)
        if not allowed:
            return _json_response(Result.Err("RATE_LIMIT", "Too many folder operations", retry_after=retry_after))

        body_res = await _read_json(request)
        if not body_res.ok:
            return _json_response(body_res)
        body = body_res.data or {}

        op = str(body.get("op") or "").strip().lower()
        source_raw = str(body.get("path") or body.get("filepath") or "").strip()
        source = _normalize_path(source_raw)
        if not source:
            return _json_response(Result.Err("INVALID_INPUT", "Invalid folder path"))

        try:
            source = source.resolve(strict=True)
        except Exception:
            return _json_response(Result.Err("DIR_NOT_FOUND", "Directory not found"))
        if not source.is_dir():
            return _json_response(Result.Err("INVALID_INPUT", "Path is not a directory"))

        if op == "create":
            parent = source
            name = _safe_folder_name(str(body.get("name") or ""))
            if not name:
                return _json_response(Result.Err("INVALID_INPUT", "Invalid folder name"))
            target = (parent / name)
            try:
                target.mkdir(parents=False, exist_ok=False)
                await _invalidate_fs_list_cache()
                return _json_response(Result.Ok({"path": str(target.resolve(strict=False))}))
            except FileExistsError:
                return _json_response(Result.Err("ALREADY_EXISTS", "Folder already exists"))
            except Exception as exc:
                return _json_response(Result.Err("CREATE_FAILED", sanitize_error_message(exc, "Failed to create folder")))

        if _is_filesystem_root(source):
            return _json_response(Result.Err("FORBIDDEN", "Operation not allowed on filesystem root"))

        if op == "rename":
            name = _safe_folder_name(str(body.get("name") or ""))
            if not name:
                return _json_response(Result.Err("INVALID_INPUT", "Invalid folder name"))
            target = source.parent / name
            try:
                if target.exists():
                    return _json_response(Result.Err("ALREADY_EXISTS", "Target folder already exists"))
                source.rename(target)
                await _invalidate_fs_list_cache()
                return _json_response(Result.Ok({"path": str(target.resolve(strict=False))}))
            except Exception as exc:
                return _json_response(Result.Err("RENAME_FAILED", sanitize_error_message(exc, "Failed to rename folder")))

        if op == "move":
            destination_raw = str(body.get("destination") or body.get("dest") or "").strip()
            dest_dir = _normalize_path(destination_raw)
            if not dest_dir:
                return _json_response(Result.Err("INVALID_INPUT", "Invalid destination path"))
            try:
                dest_dir = dest_dir.resolve(strict=True)
            except Exception:
                return _json_response(Result.Err("DIR_NOT_FOUND", "Destination directory not found"))
            if not dest_dir.is_dir():
                return _json_response(Result.Err("INVALID_INPUT", "Destination is not a directory"))
            try:
                src_res = source.resolve(strict=True)
                dst_res = dest_dir.resolve(strict=True)
                if src_res == dst_res or _is_within_root(dst_res, src_res):
                    return _json_response(Result.Err("INVALID_INPUT", "Cannot move folder into itself"))
                target = dst_res / source.name
                if target.exists():
                    return _json_response(Result.Err("ALREADY_EXISTS", "Target folder already exists"))
                moved = await asyncio.to_thread(shutil.move, str(src_res), str(dst_res))
                await _invalidate_fs_list_cache()
                return _json_response(Result.Ok({"path": str(Path(str(moved)).resolve(strict=False))}))
            except Exception as exc:
                return _json_response(Result.Err("MOVE_FAILED", sanitize_error_message(exc, "Failed to move folder")))

        if op == "delete":
            recursive = bool(body.get("recursive", True))
            try:
                if recursive:
                    await asyncio.to_thread(shutil.rmtree, str(source))
                else:
                    source.rmdir()
                await _invalidate_fs_list_cache()
                return _json_response(Result.Ok({"deleted": True}))
            except Exception as exc:
                return _json_response(Result.Err("DELETE_FAILED", sanitize_error_message(exc, "Failed to delete folder")))

        return _json_response(Result.Err("INVALID_INPUT", "Unsupported folder operation"))

