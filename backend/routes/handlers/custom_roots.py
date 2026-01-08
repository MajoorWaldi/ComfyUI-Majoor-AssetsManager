"""
Custom roots management endpoints.
"""
from pathlib import Path
from aiohttp import web
from backend.custom_roots import (
    add_custom_root,
    list_custom_roots,
    remove_custom_root,
    resolve_custom_root,
)
from backend.shared import Result, get_logger
from ..core import _json_response, _csrf_error, _safe_rel_path, _is_within_root
from .filesystem import _kickoff_background_scan

logger = get_logger(__name__)


def register_custom_roots_routes(routes: web.RouteTableDef) -> None:
    @routes.get("/mjr/am/custom-roots")
    async def get_custom_roots(request):
        result = list_custom_roots()
        return _json_response(result)

    @routes.post("/mjr/am/custom-roots")
    async def post_custom_roots(request):
        csrf = _csrf_error(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))

        try:
            body = await request.json()
        except Exception as exc:
            return _json_response(Result.Err("INVALID_JSON", f"Invalid JSON body: {exc}"))

        path = body.get("path") or body.get("directory") or body.get("root")
        label = body.get("label")
        result = add_custom_root(str(path or ""), label=str(label) if label is not None else None)
        if result.ok and isinstance(result.data, dict):
            try:
                root_path = str(result.data.get("path") or "")
                root_id = str(result.data.get("id") or "")
                if root_path and root_id:
                    _kickoff_background_scan(root_path, source="custom", root_id=root_id, recursive=True, incremental=True)
            except Exception as exc:
                # Best-effort: never fail the request because background scan scheduling failed.
                logger.debug("Background scan kickoff skipped: %s", exc)
        return _json_response(result)

    @routes.post("/mjr/am/custom-roots/remove")
    async def post_custom_roots_remove(request):
        csrf = _csrf_error(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))

        try:
            body = await request.json()
        except Exception as exc:
            return _json_response(Result.Err("INVALID_JSON", f"Invalid JSON body: {exc}"))

        rid = body.get("id") or body.get("root_id")
        result = remove_custom_root(str(rid or ""))
        return _json_response(result)

    @routes.get("/mjr/am/custom-view")
    async def custom_view(request):
        """
        Serve a file from a registered custom root.

        Query params:
          root_id: custom root id
          filename: file name
          subfolder: optional subfolder under the root
        """
        root_id = request.query.get("root_id", "").strip()
        filename = request.query.get("filename", "").strip()
        subfolder = request.query.get("subfolder", "").strip()

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

        # Fix TOCTOU: Use FileResponse directly and let it handle file existence
        # This avoids race condition between exists() check and file serving
        try:
            resolved_path = candidate.resolve(strict=True)
            if not resolved_path.is_file():
                return _json_response(Result.Err("NOT_FOUND", "File not found or not a regular file"))
            return web.FileResponse(path=str(resolved_path))
        except FileNotFoundError:
            return _json_response(Result.Err("NOT_FOUND", "File not found"))
        except (OSError, RuntimeError, ValueError) as exc:
            return _json_response(Result.Err("VIEW_FAILED", f"Failed to serve file: {exc}"))
