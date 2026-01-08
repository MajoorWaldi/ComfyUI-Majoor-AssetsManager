"""
Asset management endpoints: ratings, tags, service retry.
"""
from aiohttp import web
import asyncio
import json
import os
import subprocess
from pathlib import Path

from backend.shared import Result, get_logger
from backend.config import OUTPUT_ROOT
from backend.custom_roots import list_custom_roots, resolve_custom_root

try:
    import folder_paths  # type: ignore
except Exception:  # pragma: no cover
    class _FolderPathsStub:
        @staticmethod
        def get_input_directory() -> str:
            return str((Path(__file__).resolve().parents[3] / "input").resolve())

    folder_paths = _FolderPathsStub()  # type: ignore

from ..core import (
    _json_response,
    _require_services,
    _csrf_error,
    _build_services,
    get_services_error,
    _normalize_path,
    _is_path_allowed,
    _is_path_allowed_custom,
    _is_within_root,
)

logger = get_logger(__name__)


def register_asset_routes(routes: web.RouteTableDef) -> None:
    async def _resolve_or_create_asset_id(
        *,
        services: dict,
        filepath: str,
        file_type: str = "",
        root_id: str = "",
    ) -> Result[int]:
        """
        Resolve an asset_id for a file path, indexing it if needed.

        This allows rating/tags persistence even when a file is shown from the filesystem
        (input/custom) before it exists in the DB.
        """
        if not filepath or not isinstance(filepath, str):
            return Result.Err("INVALID_INPUT", "Missing filepath")

        candidate = _normalize_path(filepath)
        if not candidate:
            return Result.Err("INVALID_INPUT", "Invalid filepath")

        if not (_is_path_allowed(candidate) or _is_path_allowed_custom(candidate)):
            return Result.Err("FORBIDDEN", "Path is not within allowed roots")

        try:
            resolved = candidate.resolve(strict=True)
        except Exception:
            return Result.Err("NOT_FOUND", "File does not exist")

        source = str(file_type or "").strip().lower()
        base_dir: Path | None = None
        resolved_root_id: str | None = None

        out_root = Path(OUTPUT_ROOT).resolve(strict=False)
        in_root = Path(folder_paths.get_input_directory()).resolve(strict=False)

        if source in ("output", "outputs", "") and _is_within_root(resolved, out_root):
            source = "output"
            base_dir = out_root
        elif source in ("input", "inputs", "") and _is_within_root(resolved, in_root):
            source = "input"
            base_dir = in_root
        else:
            # Custom roots must be registered; pick a matching root.
            roots_res = list_custom_roots()
            if roots_res.ok:
                for item in roots_res.data or []:
                    if not isinstance(item, dict):
                        continue
                    rid = str(item.get("id") or "")
                    rpath = item.get("path")
                    if not rpath:
                        continue
                    try:
                        rp = Path(str(rpath)).resolve(strict=False)
                    except Exception:
                        continue
                    if _is_within_root(resolved, rp):
                        base_dir = rp
                        resolved_root_id = rid or None
                        source = "custom"
                        break

            # If caller provided a root_id, validate and prefer it when it matches.
            if root_id:
                root_result = resolve_custom_root(str(root_id))
                if root_result.ok:
                    try:
                        rp = Path(str(root_result.data)).resolve(strict=False)
                    except Exception:
                        rp = None
                    if rp and _is_within_root(resolved, rp):
                        base_dir = rp
                        resolved_root_id = str(root_id)
                        source = "custom"

        if not base_dir:
            return Result.Err("INVALID_INPUT", "Unable to infer asset root for filepath")

        # Index the file (best-effort) so it gets a stable asset_id.
        try:
            await asyncio.to_thread(
                services["index"].index_paths,
                [Path(resolved)],
                str(base_dir),
                True,  # incremental
                source,
                (resolved_root_id or None),
            )
        except Exception as exc:
            logger.debug("Index-on-demand skipped for %s: %s", filepath, exc)

        try:
            q = await asyncio.to_thread(
                services["db"].query,
                "SELECT id FROM assets WHERE filepath = ?",
                (str(resolved),),
            )
            if not q.ok or not q.data:
                return Result.Err("NOT_FOUND", "Asset not indexed")
            asset_id = (q.data[0] or {}).get("id")
            if asset_id is None:
                return Result.Err("NOT_FOUND", "Asset id not available")
            return Result.Ok(int(asset_id))
        except Exception as exc:
            return Result.Err("DB_ERROR", f"Failed to resolve asset id: {exc}")

    def _get_rating_tags_sync_mode(request: web.Request) -> str:
        try:
            raw = (request.headers.get("X-MJR-RTSYNC") or "").strip().lower()
        except Exception:
            raw = ""
        if raw in ("", "0", "false", "off", "disable", "disabled", "no"):
            return "off"
        if raw in ("1", "true", "on", "enable", "enabled"):
            return "on"
        # Backward compatible values from previous iterations.
        if raw in ("sidecar", "both", "exiftool", "on", "off"):
            return raw
        return "off"

    def _enqueue_rating_tags_sync(
        request: web.Request,
        services: dict,
        asset_id: int,
    ) -> None:
        mode = _get_rating_tags_sync_mode(request)
        if mode == "off":
            return

        worker = services.get("rating_tags_sync")
        db = services.get("db")
        if not worker or not db:
            return

        try:
            fp_res = db.query("SELECT filepath FROM assets WHERE id = ?", (asset_id,))
            if not fp_res.ok or not fp_res.data:
                return
            filepath = fp_res.data[0].get("filepath")
            if not filepath or not isinstance(filepath, str):
                return
        except Exception:
            return

        rating = 0
        tags = []
        try:
            meta_res = db.query("SELECT rating, tags FROM asset_metadata WHERE asset_id = ?", (asset_id,))
            if meta_res.ok and meta_res.data:
                row = meta_res.data[0] or {}
                rating = int(row.get("rating") or 0)
                raw_tags = row.get("tags")
                if isinstance(raw_tags, str):
                    try:
                        parsed = json.loads(raw_tags)
                    except Exception:
                        parsed = []
                    tags = parsed if isinstance(parsed, list) else []
                elif isinstance(raw_tags, list):
                    tags = raw_tags
        except Exception:
            rating = 0
            tags = []

        try:
            worker.enqueue(filepath, rating, tags, mode)
        except Exception:
            return

    @routes.post("/mjr/am/retry-services")
    async def retry_services(request):
        """
        Retry initializing the services if they previously failed.
        """
        csrf = _csrf_error(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))

        services = _build_services(force=True)
        if services:
            return _json_response(Result.Ok({"reinitialized": True}))

        error_message = get_services_error() or "Unknown error"
        return _json_response(Result.Err("SERVICE_UNAVAILABLE", f"Failed to initialize services: {error_message}"))

    @routes.post("/mjr/am/asset/rating")
    async def update_asset_rating(request):
        """
        Update asset rating (0-5 stars).

        Body:
          - {"asset_id": int, "rating": int}
          - OR {"filepath": str, "type": "output|input|custom", "root_id"?: str, "rating": int}
        """
        csrf = _csrf_error(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))

        svc, error_result = _require_services()
        if error_result:
            return _json_response(error_result)

        try:
            body = await request.json()
        except Exception as exc:
            return _json_response(Result.Err("INVALID_JSON", f"Invalid JSON body: {exc}"))

        asset_id = body.get("asset_id")
        rating = body.get("rating")

        if asset_id is None:
            fp = body.get("filepath") or body.get("path") or ""
            typ = body.get("type") or ""
            rid = body.get("root_id") or body.get("custom_root_id") or ""
            resolved = await _resolve_or_create_asset_id(services=svc, filepath=str(fp), file_type=str(typ), root_id=str(rid))
            if not resolved.ok:
                return _json_response(resolved)
            asset_id = resolved.data
        else:
            try:
                asset_id = int(asset_id)
            except (ValueError, TypeError):
                return _json_response(Result.Err("INVALID_INPUT", "Invalid asset_id"))

        try:
            rating = max(0, min(5, int(rating or 0)))
        except (ValueError, TypeError):
            return _json_response(Result.Err("INVALID_INPUT", "Invalid rating"))

        try:
            result = await asyncio.to_thread(svc["index"].update_asset_rating, asset_id, rating)
        except Exception as exc:
            result = Result.Err("UPDATE_FAILED", f"Failed to update rating: {exc}")
        if result.ok:
            _enqueue_rating_tags_sync(request, svc, asset_id)
        return _json_response(result)

    @routes.post("/mjr/am/asset/tags")
    async def update_asset_tags(request):
        """
        Update asset tags.

        Body:
          - {"asset_id": int, "tags": list[str]}
          - OR {"filepath": str, "type": "output|input|custom", "root_id"?: str, "tags": list[str]}
        """
        csrf = _csrf_error(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))

        svc, error_result = _require_services()
        if error_result:
            return _json_response(error_result)

        try:
            body = await request.json()
        except Exception as exc:
            return _json_response(Result.Err("INVALID_JSON", f"Invalid JSON body: {exc}"))

        asset_id = body.get("asset_id")
        tags = body.get("tags")

        if asset_id is None:
            fp = body.get("filepath") or body.get("path") or ""
            typ = body.get("type") or ""
            rid = body.get("root_id") or body.get("custom_root_id") or ""
            resolved = await _resolve_or_create_asset_id(services=svc, filepath=str(fp), file_type=str(typ), root_id=str(rid))
            if not resolved.ok:
                return _json_response(resolved)
            asset_id = resolved.data
        else:
            try:
                asset_id = int(asset_id)
            except (ValueError, TypeError):
                return _json_response(Result.Err("INVALID_INPUT", "Invalid asset_id"))

        if not isinstance(tags, list):
            return _json_response(Result.Err("INVALID_INPUT", "Tags must be a list"))

        # Validate and sanitize tags
        sanitized_tags = []
        for tag in tags:
            if not isinstance(tag, str):
                continue
            tag = str(tag).strip()
            if not tag or len(tag) > 100:
                continue
            sanitized_tags.append(tag)

        try:
            result = await asyncio.to_thread(svc["index"].update_asset_tags, asset_id, sanitized_tags)
        except Exception as exc:
            result = Result.Err("UPDATE_FAILED", f"Failed to update tags: {exc}")
        if result.ok:
            _enqueue_rating_tags_sync(request, svc, asset_id)
        return _json_response(result)

    @routes.post("/mjr/am/open-in-folder")
    async def open_in_folder(request):
        """
        Open the asset's folder in the OS file manager and (when supported) select the file.

        Body: {"asset_id": int}
        """
        csrf = _csrf_error(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))

        svc, error_result = _require_services()
        if error_result:
            return _json_response(error_result)

        try:
            body = await request.json()
        except Exception as exc:
            return _json_response(Result.Err("INVALID_JSON", f"Invalid JSON body: {exc}"))

        asset_id = body.get("asset_id")
        if not asset_id:
            return _json_response(Result.Err("INVALID_INPUT", "Missing asset_id"))

        try:
            asset_id = int(asset_id)
        except (ValueError, TypeError):
            return _json_response(Result.Err("INVALID_INPUT", "Invalid asset_id"))

        db = svc.get("db") if isinstance(svc, dict) else None
        if not db:
            return _json_response(Result.Err("SERVICE_UNAVAILABLE", "Database service unavailable"))

        try:
            res = db.query("SELECT filepath FROM assets WHERE id = ?", (asset_id,))
            if not res.ok or not res.data:
                return _json_response(Result.Err("NOT_FOUND", "Asset not found"))
            raw_path = (res.data[0] or {}).get("filepath")
        except Exception as exc:
            return _json_response(Result.Err("DB_ERROR", f"Failed to load asset: {exc}"))

        if not raw_path or not isinstance(raw_path, str):
            return _json_response(Result.Err("NOT_FOUND", "Asset path not available"))

        candidate = _normalize_path(raw_path)
        if not candidate:
            return _json_response(Result.Err("INVALID_INPUT", "Invalid asset path"))

        allowed = _is_path_allowed(candidate) or _is_path_allowed_custom(candidate)
        if not allowed:
            return _json_response(Result.Err("FORBIDDEN", "Path is not within allowed roots"))

        try:
            # Require strict resolution to avoid following symlinks outside allowed roots.
            resolved = candidate.resolve(strict=True)
        except Exception:
            return _json_response(Result.Err("NOT_FOUND", "File does not exist"))

        if os.name != "nt":
            # Non-Windows: best-effort open directory only.
            try:
                subprocess.Popen(["xdg-open", str(Path(resolved).parent)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                return _json_response(Result.Ok({"opened": True, "selected": False}))
            except Exception as exc:
                return _json_response(Result.Err("DEGRADED", f"Open-in-folder not supported: {exc}"))

        # Windows: open Explorer and select the file.
        try:
            subprocess.Popen(["explorer.exe", f"/select,{str(resolved)}"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return _json_response(Result.Ok({"opened": True, "selected": True}))
        except Exception as exc:
            try:
                os.startfile(str(Path(resolved).parent))
                return _json_response(Result.Ok({"opened": True, "selected": False, "fallback": "startfile"}))
            except Exception:
                return _json_response(Result.Err("DEGRADED", f"Failed to open folder: {exc}"))

    @routes.get("/mjr/am/tags")
    async def get_all_tags(request):
        """
        Get all unique tags from the database for autocomplete.

        Returns: {"ok": true, "data": ["tag1", "tag2", ...]}
        """
        svc, error_result = _require_services()
        if error_result:
            return _json_response(error_result)

        result = svc["index"].get_all_tags()
        return _json_response(result)

    @routes.get("/mjr/am/routes")
    async def list_routes(request):
        """List all available API routes."""
        routes_info = [
            {"method": "GET", "path": "/mjr/am/health", "description": "Get health status"},
            {"method": "GET", "path": "/mjr/am/health/counters", "description": "Get database counters"},
            {"method": "GET", "path": "/mjr/am/config", "description": "Get configuration"},
            {"method": "GET", "path": "/mjr/am/roots", "description": "Get core and custom roots"},
            {"method": "GET", "path": "/mjr/am/custom-roots", "description": "List custom roots"},
            {"method": "POST", "path": "/mjr/am/custom-roots", "description": "Add custom root"},
            {"method": "POST", "path": "/mjr/am/custom-roots/remove", "description": "Remove custom root"},
            {"method": "GET", "path": "/mjr/am/custom-view", "description": "Serve file from custom root"},
            {"method": "GET", "path": "/mjr/am/list", "description": "List assets (scoped)"},
            {"method": "POST", "path": "/mjr/am/scan", "description": "Scan a directory for assets"},
            {"method": "POST", "path": "/mjr/am/index-files", "description": "Index specific files"},
            {"method": "GET", "path": "/mjr/am/search", "description": "Search assets using FTS5"},
            {"method": "POST", "path": "/mjr/am/assets/batch", "description": "Batch fetch assets by ID"},
            {"method": "GET", "path": "/mjr/am/metadata", "description": "Get metadata for a file"},
            {"method": "POST", "path": "/mjr/am/stage-to-input", "description": "Copy files to input directory"},
            {"method": "GET", "path": "/mjr/am/asset/{asset_id}", "description": "Get single asset by ID"},
            {"method": "POST", "path": "/mjr/am/asset/rating", "description": "Update asset rating (0-5 stars)"},
            {"method": "POST", "path": "/mjr/am/asset/tags", "description": "Update asset tags"},
            {"method": "POST", "path": "/mjr/am/open-in-folder", "description": "Open asset in OS file manager"},
            {"method": "GET", "path": "/mjr/am/tags", "description": "Get all unique tags for autocomplete"},
            {"method": "POST", "path": "/mjr/am/retry-services", "description": "Retry service initialization"},
            {"method": "GET", "path": "/mjr/am/routes", "description": "List all available routes (this endpoint)"},
        ]
        return _json_response(Result.Ok({"routes": routes_info}))

    @routes.post("/mjr/am/asset/delete")
    async def delete_asset(request):
        """
        Delete a single asset file and its database record.

        Body: {"asset_id": int}
        """
        csrf = _csrf_error(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))

        svc, error_result = _require_services()
        if error_result:
            return _json_response(error_result)

        try:
            body = await request.json()
        except Exception as exc:
            return _json_response(Result.Err("INVALID_JSON", f"Invalid JSON body: {exc}"))

        asset_id = body.get("asset_id")
        if not asset_id:
            return _json_response(Result.Err("INVALID_INPUT", "Missing asset_id"))

        try:
            asset_id = int(asset_id)
        except (ValueError, TypeError):
            return _json_response(Result.Err("INVALID_INPUT", "Invalid asset_id"))

        # Get file path from database
        try:
            res = svc["db"].query("SELECT filepath FROM assets WHERE id = ?", (asset_id,))
            if not res.ok or not res.data:
                return _json_response(Result.Err("NOT_FOUND", "Asset not found"))
            raw_path = (res.data[0] or {}).get("filepath")
        except Exception as exc:
            return _json_response(Result.Err("DB_ERROR", f"Failed to load asset: {exc}"))

        if not raw_path or not isinstance(raw_path, str):
            return _json_response(Result.Err("NOT_FOUND", "Asset path not available"))

        candidate = _normalize_path(raw_path)
        if not candidate:
            return _json_response(Result.Err("INVALID_INPUT", "Invalid asset path"))

        allowed = _is_path_allowed(candidate) or _is_path_allowed_custom(candidate)
        if not allowed:
            return _json_response(Result.Err("FORBIDDEN", "Path is not within allowed roots"))

        try:
            # Require strict resolution to avoid following symlinks outside allowed roots.
            resolved = candidate.resolve(strict=True)
        except Exception:
            return _json_response(Result.Err("NOT_FOUND", "File does not exist"))

        # Check if file exists before attempting deletion
        if not resolved.exists() or not resolved.is_file():
            # Even if file doesn't exist, we can still remove the DB record
            pass

        # Delete the file if it exists
        if resolved.exists() and resolved.is_file():
            try:
                resolved.unlink(missing_ok=True)
            except Exception as exc:
                return _json_response(Result.Err("DELETE_FAILED", f"Failed to delete file: {exc}"))

        # Delete from database
        try:
            # Delete from main assets table (this should cascade to asset_metadata)
            del_res = svc["db"].execute("DELETE FROM assets WHERE id = ?", (asset_id,))
            if not del_res.ok:
                return _json_response(del_res)

            # Clean up related tables
            svc["db"].execute("DELETE FROM scan_journal WHERE filepath = ?", (str(resolved),))
            svc["db"].execute("DELETE FROM metadata_cache WHERE filepath = ?", (str(resolved),))
        except Exception as exc:
            return _json_response(Result.Err("DB_ERROR", f"Failed to delete asset record: {exc}"))

        return _json_response(Result.Ok({"deleted": 1}))

    @routes.post("/mjr/am/asset/rename")
    async def rename_asset(request):
        """
        Rename an asset file and update its database record.

        Body: {"asset_id": int, "new_name": str}
        """
        csrf = _csrf_error(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))

        svc, error_result = _require_services()
        if error_result:
            return _json_response(error_result)

        try:
            body = await request.json()
        except Exception as exc:
            return _json_response(Result.Err("INVALID_JSON", f"Invalid JSON body: {exc}"))

        asset_id = body.get("asset_id")
        new_name = body.get("new_name")

        if not asset_id:
            return _json_response(Result.Err("INVALID_INPUT", "Missing asset_id"))
        if not new_name:
            return _json_response(Result.Err("INVALID_INPUT", "Missing new_name"))

        try:
            asset_id = int(asset_id)
        except (ValueError, TypeError):
            return _json_response(Result.Err("INVALID_INPUT", "Invalid asset_id"))

        # Sanitize new_name
        new_name = str(new_name).strip()
        if not new_name:
            return _json_response(Result.Err("INVALID_INPUT", "New name cannot be empty"))

        # Validate new_name doesn't contain dangerous characters
        if "/" in new_name or "\\" in new_name:
            return _json_response(Result.Err("INVALID_INPUT", "New name cannot contain path separators"))

        if len(new_name) > 255:
            return _json_response(Result.Err("INVALID_INPUT", "New name is too long (max 255 chars)"))

        # Get current asset info from database
        try:
            res = svc["db"].query("SELECT filepath, filename FROM assets WHERE id = ?", (asset_id,))
            if not res.ok or not res.data:
                return _json_response(Result.Err("NOT_FOUND", "Asset not found"))
            row = res.data[0] or {}
            current_filepath = row.get("filepath")
            current_filename = row.get("filename")
        except Exception as exc:
            return _json_response(Result.Err("DB_ERROR", f"Failed to load asset: {exc}"))

        if not current_filepath or not isinstance(current_filepath, str):
            return _json_response(Result.Err("NOT_FOUND", "Asset path not available"))

        current_path = _normalize_path(current_filepath)
        if not current_path:
            return _json_response(Result.Err("INVALID_INPUT", "Invalid current asset path"))

        allowed = _is_path_allowed(current_path) or _is_path_allowed_custom(current_path)
        if not allowed:
            return _json_response(Result.Err("FORBIDDEN", "Current path is not within allowed roots"))

        try:
            # Require strict resolution to avoid following symlinks outside allowed roots.
            current_resolved = current_path.resolve(strict=True)
        except Exception:
            return _json_response(Result.Err("NOT_FOUND", "Current file does not exist"))

        if not current_resolved.exists() or not current_resolved.is_file():
            return _json_response(Result.Err("NOT_FOUND", "Current file does not exist"))

        # Determine the new file path
        new_path = current_resolved.parent / new_name

        # Check if new name already exists
        if new_path.exists():
            return _json_response(Result.Err("CONFLICT", f"File '{new_name}' already exists"))

        # Perform the rename
        try:
            current_resolved.rename(new_path)
        except Exception as exc:
            return _json_response(Result.Err("RENAME_FAILED", f"Failed to rename file: {exc}"))

        # Update database record
        try:
            # Update assets table
            mtime = int(new_path.stat().st_mtime)
            update_res = svc["db"].execute(
                "UPDATE assets SET filename = ?, filepath = ?, mtime = ? WHERE id = ?",
                (new_name, str(new_path), mtime, asset_id)
            )
            if not update_res.ok:
                return _json_response(update_res)

            # Update related tables - clean old cache entries
            svc["db"].execute("DELETE FROM scan_journal WHERE filepath = ?", (str(current_path),))
            svc["db"].execute("DELETE FROM metadata_cache WHERE filepath = ?", (str(current_path),))
        except Exception as exc:
            return _json_response(Result.Err("DB_ERROR", f"Failed to update asset record: {exc}"))

        return _json_response(Result.Ok({
            "renamed": 1,
            "old_name": current_filename,
            "new_name": new_name,
            "old_path": str(current_path),
            "new_path": str(new_path)
        }))
