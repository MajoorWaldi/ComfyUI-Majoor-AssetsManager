"""
Metadata extraction endpoint.
"""
import asyncio
from aiohttp import web
from backend.shared import Result
from backend.config import OUTPUT_ROOT
from backend.custom_roots import resolve_custom_root
from ..core import _json_response, _require_services, _check_rate_limit, _normalize_path, _is_path_allowed, _is_path_allowed_custom, _is_within_root

try:
    import folder_paths  # type: ignore
except Exception:
    from pathlib import Path

    class _FolderPathsStub:
        @staticmethod
        def get_input_directory() -> str:
            return str((Path(__file__).resolve().parents[3] / "input").resolve())

    folder_paths = _FolderPathsStub()  # type: ignore


def register_metadata_routes(routes: web.RouteTableDef) -> None:
    @routes.get("/mjr/am/metadata")
    async def get_metadata(request):
        """
        Get metadata for a file.

        Query params:
            path: File path
        """
        svc, error_result = _require_services()
        if error_result:
            return _json_response(error_result)

        allowed, retry_after = _check_rate_limit(request, "metadata", max_requests=20, window_seconds=60)
        if not allowed:
            return _json_response(Result.Err("RATE_LIMITED", "Too many metadata requests. Please wait before retrying.", retry_after=retry_after))

        file_path = (request.query.get("path") or "").strip()
        normalized = None

        if file_path:
            normalized = _normalize_path(file_path)
            if not normalized or not (_is_path_allowed(normalized) or _is_path_allowed_custom(normalized)):
                result = Result.Err("INVALID_INPUT", "Path not allowed")
                return _json_response(result)
        else:
            # Backward compatible extension: allow resolving a file from (type, filename, subfolder, root_id)
            # so callers don't need to send absolute paths.
            file_type = (request.query.get("type") or request.query.get("scope") or "output").strip().lower()
            filename = (request.query.get("filename") or "").strip()
            subfolder = (request.query.get("subfolder") or "").strip()
            root_id = (request.query.get("root_id") or request.query.get("custom_root_id") or "").strip()

            if not filename:
                return _json_response(Result.Err("INVALID_INPUT", "Missing 'path' or 'filename' parameter"))

            # Resolve base root
            if file_type == "input":
                base_root = folder_paths.get_input_directory()
            elif file_type == "custom":
                root_res = resolve_custom_root(root_id)
                if not root_res.ok:
                    return _json_response(Result.Err("INVALID_INPUT", root_res.error or "Invalid custom root"))
                base_root = str(root_res.data)
            else:
                base_root = OUTPUT_ROOT

            # Build candidate and validate root containment
            from pathlib import Path

            base_dir = Path(str(base_root)).resolve(strict=False)
            candidate = (base_dir / subfolder / filename) if subfolder else (base_dir / filename)
            normalized = _normalize_path(str(candidate))
            if not normalized or not normalized.exists():
                return _json_response(Result.Err("NOT_FOUND", "File not found"))

            if file_type == "custom":
                if not _is_within_root(normalized, base_dir):
                    return _json_response(Result.Err("FORBIDDEN", "Source file outside custom root"))
            else:
                if not _is_path_allowed(normalized):
                    return _json_response(Result.Err("INVALID_INPUT", "Path not allowed"))

        try:
            mode = (request.query.get("mode") or "").strip().lower()
            workflow_only = (request.query.get("workflow_only") or "").strip().lower() in ("1", "true", "yes")
            if mode in ("workflow", "workflow_only", "workflow-only") or workflow_only:
                result = await asyncio.to_thread(svc["metadata"].get_workflow_only, str(normalized))
            else:
                result = await asyncio.to_thread(svc["metadata"].get_metadata, str(normalized))
        except Exception as exc:
            result = Result.Err("METADATA_FAILED", f"Failed to extract metadata: {exc}")
        return _json_response(result)
