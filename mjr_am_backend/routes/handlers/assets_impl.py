"""
Asset management endpoints: ratings, tags, service retry.
"""
import asyncio
import errno
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any

from aiohttp import web
from mjr_am_backend.config import TO_THREAD_TIMEOUT_S, get_runtime_output_root
from mjr_am_backend.custom_roots import list_custom_roots, resolve_custom_root
from mjr_am_backend.shared import Result, get_logger
from mjr_am_backend.shared import sanitize_error_message as _safe_error_message

from ..assets.path_guard import (
    build_download_response as _pg_build_download_response,
    delete_file_best_effort as _delete_file_best_effort,
    is_resolved_path_allowed as _is_resolved_path_allowed,
    safe_download_filename as _pg_safe_download_filename,
)

try:
    import folder_paths  # type: ignore
except Exception:  # pragma: no cover
    class _FolderPathsStub:
        @staticmethod
        def get_input_directory() -> str:
            return str((Path(__file__).resolve().parents[3] / "input").resolve())

    folder_paths = _FolderPathsStub()  # type: ignore

from ..core import (
    _build_services,
    _check_rate_limit,
    _csrf_error,
    _is_path_allowed,
    _is_path_allowed_custom,
    _is_within_root,
    _json_response,
    _normalize_path,
    _read_json,
    _require_operation_enabled,
    _require_services,
    _require_write_access,
    _resolve_security_prefs,
    get_services_error,
)

logger = get_logger(__name__)

MAX_TAGS_PER_ASSET = 50
MAX_TAG_LENGTH = 100
MAX_RENAME_LENGTH = 255

# P2-E-05/06 delegation to extracted modules.
from ..assets import filename_validator as _fv
from ..assets import path_guard as _pg

_normalize_filename = _fv.normalize_filename
_filename_separator_error = _fv.filename_separator_error
_filename_char_error = _fv.filename_char_error
_filename_boundary_error = _fv.filename_boundary_error
_filename_reserved_error = _fv.filename_reserved_error
_validate_filename = _fv.validate_filename

_is_resolved_path_allowed = _pg.is_resolved_path_allowed
_delete_file_best_effort = _pg.delete_file_best_effort
_pg_build_download_response = _pg.build_download_response
_pg_safe_download_filename = _pg.safe_download_filename


def register_asset_routes(routes: web.RouteTableDef) -> None:
    """Register asset CRUD routes (get, delete, rename)."""
    def _resolve_body_filepath(body: dict | None) -> Path | None:
        try:
            raw = ""
            if isinstance(body, dict):
                raw = body.get("filepath") or body.get("path") or ""
            candidate = _normalize_path(str(raw))
            if not candidate:
                return None
            return candidate
        except Exception:
            return None

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

        try:
            resolved = candidate.resolve(strict=True)
        except Exception:
            return Result.Err("NOT_FOUND", "File does not exist")

        source = str(file_type or "").strip().lower()
        base_dir: Path | None = None
        resolved_root_id: str | None = None

        out_root = Path(get_runtime_output_root()).resolve(strict=False)
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
                    if not rid:
                        continue
                    root_result = resolve_custom_root(rid)
                    if not root_result.ok or not root_result.data:
                        continue
                    try:
                        rp = Path(str(root_result.data)).resolve(strict=False)
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
                    rp2: Path | None
                    try:
                        rp2 = Path(str(root_result.data)).resolve(strict=False)
                    except Exception:
                        rp2 = None
                    if rp2 and _is_within_root(resolved, rp2):
                        base_dir = rp2
                        resolved_root_id = str(root_id)
                        source = "custom"

        if not base_dir:
            return Result.Err("FORBIDDEN", "Path is not within allowed roots")

        # Index the file (best-effort) so it gets a stable asset_id.
        try:
            await asyncio.wait_for(
                services["index"].index_paths(
                    [Path(resolved)],
                    str(base_dir),
                    True,  # incremental
                    source,
                    (resolved_root_id or None),
                ),
                timeout=TO_THREAD_TIMEOUT_S,
            )
        except asyncio.TimeoutError:
            logger.debug("Index-on-demand timed out for %s", filepath)
        except Exception as exc:
            logger.debug("Index-on-demand skipped for %s: %s", filepath, exc)

        try:
            q = await asyncio.wait_for(
                services["db"].aquery(
                    "SELECT id FROM assets WHERE filepath = ?",
                    (str(resolved),),
                ),
                timeout=TO_THREAD_TIMEOUT_S,
            )
            if not q.ok or not q.data:
                return Result.Err("NOT_FOUND", "Asset not indexed")
            asset_id = (q.data[0] or {}).get("id")
            if asset_id is None:
                return Result.Err("NOT_FOUND", "Asset id not available")
            return Result.Ok(int(asset_id))
        except asyncio.TimeoutError:
            return Result.Err("TIMEOUT", "Asset lookup timed out")
        except Exception as exc:
            return Result.Err(
                "DB_ERROR",
                _safe_error_message(exc, "Failed to resolve asset id"),
            )

    async def _infer_source_and_root_id_from_path(path: Path, output_root: str) -> tuple[str, str | None]:
        try:
            out_root = Path(output_root).resolve(strict=False)
        except Exception:
            out_root = Path(get_runtime_output_root()).resolve(strict=False)
        try:
            in_root = Path(folder_paths.get_input_directory()).resolve(strict=False)
        except Exception:
            in_root = Path(__file__).resolve().parents[3] / "input"
            in_root = in_root.resolve(strict=False)

        if _is_within_root(path, out_root):
            return "output", None
        if _is_within_root(path, in_root):
            return "input", None

        custom_root_id = _match_custom_root_id_for_path(path)
        if custom_root_id:
            return "custom", custom_root_id

        logger.warning(
            "Post-rename: could not classify %s under any known root; defaulting to 'output'",
            path,
        )
        return "output", None

    def _match_custom_root_id_for_path(path: Path) -> str | None:
        roots_res = list_custom_roots()
        if not roots_res.ok:
            return None
        for item in roots_res.data or []:
            candidate = _custom_root_candidate(item)
            if not candidate:
                continue
            rid, rp = candidate
            if _is_within_root(path, rp):
                return rid
        return None

    def _custom_root_candidate(item: object) -> tuple[str, Path] | None:
        if not isinstance(item, dict):
            return None
        rid = str(item.get("id") or "").strip()
        root_path = str(item.get("path") or "").strip()
        if not rid or not root_path:
            return None
        try:
            return rid, Path(root_path).resolve(strict=False)
        except Exception:
            return None

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
        if raw in ("sidecar", "both", "exiftool"):
            return raw
        return "off"

    async def _enqueue_rating_tags_sync(
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

        filepath = await _fetch_asset_filepath(db, asset_id)
        if not filepath:
            return

        rating, tags = await _fetch_asset_rating_tags(db, asset_id)

        try:
            worker.enqueue(filepath, rating, tags, mode)
        except Exception as exc:
            logger.debug("Failed to enqueue rating/tags sync for asset_id=%s: %s", asset_id, exc)
            return

    async def _fetch_asset_filepath(db: Any, asset_id: int) -> str | None:
        try:
            fp_res = await db.aquery("SELECT filepath FROM assets WHERE id = ?", (asset_id,))
            if not fp_res.ok or not fp_res.data:
                return None
            filepath = fp_res.data[0].get("filepath")
            return filepath if isinstance(filepath, str) and filepath else None
        except Exception:
            return None

    def _normalize_tags_payload(raw_tags: object) -> list:
        if isinstance(raw_tags, list):
            return raw_tags
        if isinstance(raw_tags, str):
            try:
                parsed = json.loads(raw_tags)
            except Exception:
                parsed = []
            return parsed if isinstance(parsed, list) else []
        return []

    async def _fetch_asset_rating_tags(db: Any, asset_id: int) -> tuple[int, list]:
        try:
            meta_res = await db.aquery(
                "SELECT rating, tags FROM asset_metadata WHERE asset_id = ?",
                (asset_id,),
            )
            if not meta_res.ok or not meta_res.data:
                return 0, []
            row = meta_res.data[0] or {}
            rating = int(row.get("rating") or 0)
            tags = _normalize_tags_payload(row.get("tags"))
            return rating, tags
        except Exception:
            return 0, []

    async def _resolve_rating_asset_id(body: dict[str, Any], svc: dict[str, Any]) -> Result[int]:
        asset_id = body.get("asset_id")
        if asset_id is not None:
            try:
                return Result.Ok(int(asset_id))
            except (ValueError, TypeError):
                return Result.Err("INVALID_INPUT", "Invalid asset_id")
        fp = body.get("filepath") or body.get("path") or ""
        typ = body.get("type") or ""
        rid = body.get("root_id") or body.get("custom_root_id") or ""
        return await _resolve_or_create_asset_id(
            services=svc,
            filepath=str(fp),
            file_type=str(typ),
            root_id=str(rid),
        )

    def _parse_rating_value(value: object) -> Result[int]:
        if not isinstance(value, (int, float, str, bytes, bytearray)) and value is not None:
            return Result.Err("INVALID_INPUT", "Invalid rating")
        try:
            return Result.Ok(max(0, min(5, int(value or 0))))
        except (ValueError, TypeError):
            return Result.Err("INVALID_INPUT", "Invalid rating")

    async def _require_asset_rating_services() -> Result[dict[str, Any]]:
        svc, error_result = await _require_services()
        if error_result:
            return Result.Err(error_result.code or "SERVICE_UNAVAILABLE", error_result.error or "Service unavailable")
        if not isinstance(svc, dict):
            return Result.Err("SERVICE_UNAVAILABLE", "Service unavailable")
        return Result.Ok(svc)

    async def _check_asset_rating_permissions(request: web.Request, svc: dict[str, Any]) -> Result[bool]:
        prefs = await _resolve_security_prefs(svc)
        op = _require_operation_enabled("asset_rating", prefs=prefs)
        if not op.ok:
            return Result.Err(op.code or "FORBIDDEN", op.error or "Operation not allowed")
        auth = _require_write_access(request)
        if not auth.ok:
            return Result.Err(auth.code or "FORBIDDEN", auth.error or "Write access required")
        allowed, retry_after = _check_rate_limit(request, "asset_rating", max_requests=30, window_seconds=60)
        if not allowed:
            return Result.Err(
                "RATE_LIMITED",
                "Rate limit exceeded. Please wait before retrying.",
                retry_after=retry_after,
            )
        return Result.Ok(True)

    async def _read_asset_rating_body(request: web.Request) -> Result[dict[str, Any]]:
        body_res = await _read_json(request)
        if not body_res.ok:
            return Result.Err(body_res.code or "INVALID_INPUT", body_res.error or "Invalid request body")
        body = body_res.data if isinstance(body_res.data, dict) else {}
        return Result.Ok(body)

    def _normalize_result_error(res: Result[Any], default_code: str, default_error: str) -> Result[Any]:
        return Result.Err(res.code if res.code else default_code, res.error if res.error else default_error)

    async def _prepare_asset_rating_request(request: web.Request) -> Result[tuple[dict[str, Any], dict[str, Any]]]:
        csrf = _csrf_error(request)
        if csrf:
            return Result.Err("CSRF", csrf)
        svc_res = await _require_asset_rating_services()
        if not svc_res.ok:
            return _normalize_result_error(svc_res, "SERVICE_UNAVAILABLE", "Service unavailable")
        svc = svc_res.data or {}
        perm_res = await _check_asset_rating_permissions(request, svc)
        if not perm_res.ok:
            return _normalize_result_error(perm_res, "FORBIDDEN", "Operation not allowed")
        body_res = await _read_asset_rating_body(request)
        if not body_res.ok:
            return _normalize_result_error(body_res, "INVALID_INPUT", "Invalid request body")
        body = body_res.data or {}
        return Result.Ok((svc, body))

    @routes.post("/mjr/am/retry-services")
    async def retry_services(request):
        """
        Retry initializing the services if they previously failed.
        """
        csrf = _csrf_error(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))
        auth = _require_write_access(request)
        if not auth.ok:
            return _json_response(auth)

        services = await _build_services(force=True)
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
        prep = await _prepare_asset_rating_request(request)
        if not prep.ok:
            return _json_response(prep)
        svc, body = prep.data or ({}, {})

        asset_res = await _resolve_rating_asset_id(body, svc)
        if not asset_res.ok:
            return _json_response(asset_res)
        rating_res = _parse_rating_value(body.get("rating"))
        if not rating_res.ok:
            return _json_response(rating_res)
        asset_id = int(asset_res.data or 0)
        rating = int(rating_res.data or 0)

        try:
            result = await svc["index"].update_asset_rating(asset_id, rating)
        except Exception as exc:
            result = Result.Err(
                "UPDATE_FAILED", _safe_error_message(exc, "Failed to update rating")
            )
        if result.ok:
            await _enqueue_rating_tags_sync(request, svc, asset_id)
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

        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)

        prefs = await _resolve_security_prefs(svc)
        op = _require_operation_enabled("asset_tags", prefs=prefs)
        if not op.ok:
            return _json_response(op)

        auth = _require_write_access(request)
        if not auth.ok:
            return _json_response(auth)

        allowed, retry_after = _check_rate_limit(request, "asset_tags", max_requests=30, window_seconds=60)
        if not allowed:
            return _json_response(Result.Err("RATE_LIMITED", "Rate limit exceeded. Please wait before retrying.", retry_after=retry_after))

        body_res = await _read_json(request)
        if not body_res.ok:
            return _json_response(body_res)
        body = body_res.data or {}

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

        if len(tags) > MAX_TAGS_PER_ASSET:
            return _json_response(Result.Err("INVALID_INPUT", f"Too many tags (max {MAX_TAGS_PER_ASSET}, got {len(tags)})"))

        # Validate and sanitize tags
        sanitized_tags = []
        for tag in tags:
            if not isinstance(tag, str):
                continue
            tag = str(tag).strip()
            if not tag or len(tag) > MAX_TAG_LENGTH:
                continue
            tag_lower = tag.lower()
            if any(existing.lower() == tag_lower for existing in sanitized_tags):
                continue
            sanitized_tags.append(tag)
            if len(sanitized_tags) >= MAX_TAGS_PER_ASSET:
                break

        try:
            result = await svc["index"].update_asset_tags(asset_id, sanitized_tags)
        except Exception as exc:
            result = Result.Err(
                "UPDATE_FAILED", _safe_error_message(exc, "Failed to update tags")
            )
        if result.ok:
            await _enqueue_rating_tags_sync(request, svc, asset_id)
        return _json_response(result)

    @routes.post("/mjr/am/open-in-folder")
    async def open_in_folder(request):
        """
        Open the asset's folder in the OS file manager and (when supported) select the file.

        Body: {"asset_id": int} or {"filepath": str}
        """
        csrf = _csrf_error(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))
        auth = _require_write_access(request)
        if not auth.ok:
            return _json_response(auth)

        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)
        prefs = await _resolve_security_prefs(svc)
        op = _require_operation_enabled("open_in_folder", prefs=prefs)
        if not op.ok:
            return _json_response(op)

        allowed, retry_after = _check_rate_limit(request, "open_in_folder", max_requests=1, window_seconds=2)
        if not allowed:
            return _json_response(Result.Err("RATE_LIMITED", "Rate limit exceeded. Please wait before retrying.", retry_after=retry_after))

        body_res = await _read_json(request)
        if not body_res.ok:
            return _json_response(body_res)
        body = body_res.data or {}

        asset_id = body.get("asset_id")
        candidate = None

        if asset_id is not None and str(asset_id).strip() != "":
            try:
                asset_id = int(asset_id)
            except (ValueError, TypeError):
                return _json_response(Result.Err("INVALID_INPUT", "Invalid asset_id"))

            db = svc.get("db") if isinstance(svc, dict) else None
            if not db:
                return _json_response(Result.Err("SERVICE_UNAVAILABLE", "Database service unavailable"))
            try:
                res = await db.aquery("SELECT filepath FROM assets WHERE id = ?", (asset_id,))
                if not res.ok or not res.data:
                    return _json_response(Result.Err("NOT_FOUND", "Asset not found"))
                raw_path = (res.data[0] or {}).get("filepath")
            except Exception as exc:
                return _json_response(
                    Result.Err("DB_ERROR", _safe_error_message(exc, "Failed to load asset"))
                )
            if not raw_path or not isinstance(raw_path, str):
                return _json_response(Result.Err("NOT_FOUND", "Asset path not available"))
            candidate = _normalize_path(raw_path)
        else:
            candidate = _resolve_body_filepath(body)

        if not candidate:
            return _json_response(Result.Err("INVALID_INPUT", "Missing filepath or asset_id"))

        try:
            # Require strict resolution to avoid following symlinks outside allowed roots.
            resolved = candidate.resolve(strict=True)
        except Exception:
            return _json_response(Result.Err("NOT_FOUND", "File does not exist"))
        if not _is_resolved_path_allowed(resolved):
            return _json_response(Result.Err("FORBIDDEN", "Path is not within allowed roots"))

        def _execute_command(command: list[str]) -> None:
            if not shutil.which(command[0]):
                raise FileNotFoundError(command[0])
            subprocess.Popen(
                command,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                shell=False,
            )

        commands: list[list[str]] = []
        fallback_command: list[str] | None = None

        if sys.platform == "darwin":
            commands.append(["open", "-R", str(resolved)])
            fallback_command = ["open", str(resolved.parent)]
            selected = True
        elif os.name == "nt":
            commands.append(["explorer.exe", f"/select,{str(resolved)}"])
            fallback_command = ["explorer.exe", str(resolved.parent)]
            selected = True
        else:
            commands.append(["xdg-open", str(resolved.parent)])
            selected = False

        last_exception: Exception | None = None

        for cmd in commands:
            try:
                _execute_command(cmd)
                payload = {"opened": True, "selected": selected}
                if cmd[0] == "xdg-open":
                    payload["fallback"] = "xdg-open"
                return _json_response(Result.Ok(payload))
            except Exception as exc:
                last_exception = exc

        if fallback_command:
            try:
                _execute_command(fallback_command)
                return _json_response(
                    Result.Ok(
                        {"opened": True, "selected": False, "fallback": "open"}
                    )
                )
            except Exception as exc:
                last_exception = exc

        return _json_response(
            Result.Err(
                "DEGRADED",
                _safe_error_message(
                    last_exception or ValueError("Failed to open folder"),
                    "Failed to open folder",
                ),
            )
        )

    @routes.get("/mjr/am/tags")
    async def get_all_tags(request):
        """
        Get all unique tags from the database for autocomplete.

        Returns: {"ok": true, "data": ["tag1", "tag2", ...]}
        """
        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)

        try:
            result = await svc["index"].get_all_tags()
        except Exception as exc:
            result = Result.Err(
                "DB_ERROR", _safe_error_message(exc, "Failed to load tags")
            )
        return _json_response(result)

    @routes.get("/mjr/am/routes")
    async def list_routes(request):
        """List all available API routes."""
        routes_info = [
            {"method": "GET", "path": "/mjr/am/health", "description": "Get health status"},
            {"method": "GET", "path": "/mjr/am/health/counters", "description": "Get database counters"},
            {"method": "GET", "path": "/mjr/am/health/db", "description": "Get DB lock/corruption/recovery diagnostics"},
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
            {"method": "POST", "path": "/mjr/am/asset/rename", "description": "Rename a single asset file"},
            {"method": "POST", "path": "/mjr/am/assets/rename", "description": "Alias: rename a single asset file"},
            {"method": "POST", "path": "/mjr/am/open-in-folder", "description": "Open asset in OS file manager"},
            {"method": "GET", "path": "/mjr/am/tags", "description": "Get all unique tags for autocomplete"},
            {"method": "POST", "path": "/mjr/am/retry-services", "description": "Retry service initialization"},
            {"method": "GET", "path": "/mjr/am/routes", "description": "List all available routes (this endpoint)"},
        ]
        return _json_response(Result.Ok({"routes": routes_info}))

    async def _collect_asset_delete_backups(db: Any, *, filepath: str) -> dict[str, dict[str, Any] | None]:
        backups: dict[str, dict[str, Any] | None] = {
            "asset": None,
            "asset_metadata": None,
            "scan_journal": None,
            "metadata_cache": None,
        }

        async def _query_one(sql: str, params: tuple[Any, ...]) -> dict[str, Any] | None:
            try:
                res = await db.aquery(sql, params)
                if not res.ok or not res.data:
                    return None
                row = res.data[0] or {}
                return row if isinstance(row, dict) else None
            except Exception:
                return None

        asset_row = await _query_one(
            """
            SELECT id, filename, subfolder, filepath, source, root_id, kind, ext, size, mtime,
                   width, height, duration, created_at, updated_at, indexed_at, content_hash, phash, hash_state
            FROM assets
            WHERE filepath = ?
            LIMIT 1
            """,
            (filepath,),
        )
        backups["asset"] = asset_row

        asset_id: int | None = None
        try:
            if isinstance(asset_row, dict):
                raw_asset_id = asset_row.get("id")
                if raw_asset_id is not None:
                    asset_id = int(raw_asset_id)
        except Exception:
            asset_id = None

        if asset_id is not None:
            backups["asset_metadata"] = await _query_one(
                """
                SELECT asset_id, rating, tags, tags_text, workflow_hash, has_workflow,
                       has_generation_data, metadata_quality, metadata_raw
                FROM asset_metadata
                WHERE asset_id = ?
                LIMIT 1
                """,
                (asset_id,),
            )

        backups["scan_journal"] = await _query_one(
            """
            SELECT filepath, dir_path, state_hash, mtime, size, last_seen
            FROM scan_journal
            WHERE filepath = ?
            LIMIT 1
            """,
            (filepath,),
        )
        backups["metadata_cache"] = await _query_one(
            """
            SELECT filepath, state_hash, metadata_hash, metadata_raw, last_updated
            FROM metadata_cache
            WHERE filepath = ?
            LIMIT 1
            """,
            (filepath,),
        )
        return backups

    async def _restore_asset_delete_backups(db: Any, backups: dict[str, dict[str, Any] | None]) -> None:
        if not isinstance(backups, dict):
            return
        asset = backups.get("asset") if isinstance(backups.get("asset"), dict) else None
        asset_meta = backups.get("asset_metadata") if isinstance(backups.get("asset_metadata"), dict) else None
        scan_journal = backups.get("scan_journal") if isinstance(backups.get("scan_journal"), dict) else None
        metadata_cache = backups.get("metadata_cache") if isinstance(backups.get("metadata_cache"), dict) else None
        if not any((asset, asset_meta, scan_journal, metadata_cache)):
            return

        try:
            async with db.atransaction(mode="immediate"):
                if asset:
                    await db.aexecute(
                        """
                        INSERT OR REPLACE INTO assets
                        (id, filename, subfolder, filepath, source, root_id, kind, ext, size, mtime, width, height, duration, created_at, updated_at, indexed_at, content_hash, phash, hash_state)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            asset.get("id"),
                            asset.get("filename"),
                            asset.get("subfolder"),
                            asset.get("filepath"),
                            asset.get("source"),
                            asset.get("root_id"),
                            asset.get("kind"),
                            asset.get("ext"),
                            asset.get("size"),
                            asset.get("mtime"),
                            asset.get("width"),
                            asset.get("height"),
                            asset.get("duration"),
                            asset.get("created_at"),
                            asset.get("updated_at"),
                            asset.get("indexed_at"),
                            asset.get("content_hash"),
                            asset.get("phash"),
                            asset.get("hash_state"),
                        ),
                    )
                if asset_meta:
                    await db.aexecute(
                        """
                        INSERT OR REPLACE INTO asset_metadata
                        (asset_id, rating, tags, tags_text, workflow_hash, has_workflow, has_generation_data, metadata_quality, metadata_raw)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            asset_meta.get("asset_id"),
                            asset_meta.get("rating"),
                            asset_meta.get("tags"),
                            asset_meta.get("tags_text"),
                            asset_meta.get("workflow_hash"),
                            asset_meta.get("has_workflow"),
                            asset_meta.get("has_generation_data"),
                            asset_meta.get("metadata_quality"),
                            asset_meta.get("metadata_raw"),
                        ),
                    )
                if scan_journal:
                    await db.aexecute(
                        """
                        INSERT OR REPLACE INTO scan_journal
                        (filepath, dir_path, state_hash, mtime, size, last_seen)
                        VALUES (?, ?, ?, ?, ?, ?)
                        """,
                        (
                            scan_journal.get("filepath"),
                            scan_journal.get("dir_path"),
                            scan_journal.get("state_hash"),
                            scan_journal.get("mtime"),
                            scan_journal.get("size"),
                            scan_journal.get("last_seen"),
                        ),
                    )
                if metadata_cache:
                    await db.aexecute(
                        """
                        INSERT OR REPLACE INTO metadata_cache
                        (filepath, state_hash, metadata_hash, metadata_raw, last_updated)
                        VALUES (?, ?, ?, ?, ?)
                        """,
                        (
                            metadata_cache.get("filepath"),
                            metadata_cache.get("state_hash"),
                            metadata_cache.get("metadata_hash"),
                            metadata_cache.get("metadata_raw"),
                            metadata_cache.get("last_updated"),
                        ),
                    )
        except Exception as exc:
            logger.error("Failed to restore DB state after file delete failure: %s", exc)

    @routes.post("/mjr/am/asset/delete")
    async def delete_asset(request):
        """
        Delete a single asset file and its database record.

        Body: {"asset_id": int} or {"filepath": str}
        """
        csrf = _csrf_error(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))

        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)
        prefs = await _resolve_security_prefs(svc)
        op = _require_operation_enabled("asset_delete", prefs=prefs)
        if not op.ok:
            return _json_response(op)
        auth = _require_write_access(request)
        if not auth.ok:
            return _json_response(auth)

        allowed, retry_after = _check_rate_limit(request, "asset_delete", max_requests=20, window_seconds=60)
        if not allowed:
            return _json_response(Result.Err("RATE_LIMITED", "Rate limit exceeded. Please wait before retrying.", retry_after=retry_after))

        body_res = await _read_json(request)
        if not body_res.ok:
            return _json_response(body_res)
        body = body_res.data or {}

        asset_id = body.get("asset_id")
        raw_path = None
        if asset_id is not None and str(asset_id).strip() != "":
            try:
                asset_id = int(asset_id)
            except (ValueError, TypeError):
                return _json_response(Result.Err("INVALID_INPUT", "Invalid asset_id"))
            try:
                res = await svc["db"].aquery("SELECT filepath FROM assets WHERE id = ?", (asset_id,))
                if not res.ok or not res.data:
                    return _json_response(Result.Err("NOT_FOUND", "Asset not found"))
                raw_path = (res.data[0] or {}).get("filepath")
            except Exception as exc:
                return _json_response(
                    Result.Err("DB_ERROR", _safe_error_message(exc, "Failed to load asset"))
                )
            if not raw_path or not isinstance(raw_path, str):
                return _json_response(Result.Err("NOT_FOUND", "Asset path not available"))
            candidate = _normalize_path(raw_path)
        else:
            candidate = _resolve_body_filepath(body)

        if not candidate:
            return _json_response(Result.Err("INVALID_INPUT", "Missing filepath or asset_id"))

        try:
            # Require strict resolution to avoid following symlinks outside allowed roots.
            resolved = candidate.resolve(strict=True)
        except Exception:
            return _json_response(Result.Err("NOT_FOUND", "File does not exist"))
        if not _is_resolved_path_allowed(resolved):
            return _json_response(Result.Err("FORBIDDEN", "Path is not within allowed roots"))

        if not (resolved.exists() and resolved.is_file()):
            return _json_response(Result.Err("NOT_FOUND", "File does not exist"))

        backups = await _collect_asset_delete_backups(svc["db"], filepath=str(resolved))

        deleted_db = False
        try:
            async with svc["db"].atransaction(mode="immediate"):
                if asset_id is not None:
                    del_res = await svc["db"].aexecute("DELETE FROM assets WHERE id = ?", (asset_id,))
                    if not del_res.ok:
                        return _json_response(Result.Err("DB_ERROR", str(del_res.error or "DB delete failed")))
                    deleted_db = True
                else:
                    # Browser mode can operate on files not yet indexed.
                    del_res = await svc["db"].aexecute("DELETE FROM assets WHERE filepath = ?", (str(resolved),))
                    if not del_res.ok:
                        return _json_response(Result.Err("DB_ERROR", str(del_res.error or "DB delete failed")))
                    deleted_db = True
                sj_res = await svc["db"].aexecute("DELETE FROM scan_journal WHERE filepath = ?", (str(resolved),))
                if not sj_res.ok:
                    return _json_response(Result.Err("DB_ERROR", str(sj_res.error or "DB delete failed")))
                mc_res = await svc["db"].aexecute("DELETE FROM metadata_cache WHERE filepath = ?", (str(resolved),))
                if not mc_res.ok:
                    return _json_response(Result.Err("DB_ERROR", str(mc_res.error or "DB delete failed")))
        except Exception as exc:
            logger.error("Database deletion failed: %s", exc)
            return _json_response(
                Result.Err(
                    "DB_ERROR",
                    _safe_error_message(exc, "Failed to delete asset record"),
                )
            )

        try:
            del_res = _delete_file_best_effort(resolved)
            if not del_res.ok:
                raise RuntimeError(str(del_res.error or "delete failed"))
        except Exception as exc:
            if deleted_db:
                await _restore_asset_delete_backups(svc["db"], backups)
            return _json_response(Result.Err(
                "DELETE_FAILED",
                "Failed to delete file",
                errors=[{"asset_id": asset_id, "error": _safe_error_message(exc, "File deletion failed")}],
                aborted=True
            ))

        return _json_response(Result.Ok({"deleted": 1}))

    @routes.post("/mjr/am/asset/rename")
    async def rename_asset(request):
        """
        Rename an asset file and update its database record.

        Body: {"asset_id": int, "new_name": str} or {"filepath": str, "new_name": str}
        """
        csrf = _csrf_error(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))

        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)
        prefs = await _resolve_security_prefs(svc)
        op = _require_operation_enabled("asset_rename", prefs=prefs)
        if not op.ok:
            return _json_response(op)
        auth = _require_write_access(request)
        if not auth.ok:
            return _json_response(auth)

        body_res = await _read_json(request)
        if not body_res.ok:
            return _json_response(body_res)
        body = body_res.data or {}

        asset_id = body.get("asset_id")
        new_name = body.get("new_name")

        if not new_name:
            return _json_response(Result.Err("INVALID_INPUT", "Missing new_name"))
        if asset_id is not None and str(asset_id).strip() != "":
            try:
                asset_id = int(asset_id)
            except (ValueError, TypeError):
                return _json_response(Result.Err("INVALID_INPUT", "Invalid asset_id"))
        else:
            asset_id = None

        # Sanitize and validate new_name
        new_name = str(new_name).strip()
        valid, msg = _validate_filename(new_name)
        if not valid:
            return _json_response(Result.Err("INVALID_INPUT", msg))

        if len(new_name) > MAX_RENAME_LENGTH:
            return _json_response(Result.Err("INVALID_INPUT", f"New name is too long (max {MAX_RENAME_LENGTH} chars)"))

        current_filepath = ""
        current_filename = ""
        current_source = ""
        current_root_id = ""
        if asset_id is not None:
            try:
                res = await svc["db"].aquery("SELECT filepath, filename, source, root_id FROM assets WHERE id = ?", (asset_id,))
                if not res.ok or not res.data:
                    return _json_response(Result.Err("NOT_FOUND", "Asset not found"))
                row = res.data[0] or {}
                current_filepath = str(row.get("filepath") or "")
                current_filename = str(row.get("filename") or "")
                current_source = str(row.get("source") or "").strip().lower()
                current_root_id = str(row.get("root_id") or "").strip()
            except Exception as exc:
                return _json_response(
                    Result.Err("DB_ERROR", _safe_error_message(exc, "Failed to load asset"))
                )
        else:
            fp = _resolve_body_filepath(body)
            current_filepath = str(fp) if fp else ""
            current_filename = Path(current_filepath).name if current_filepath else ""

        if not current_filepath:
            return _json_response(Result.Err("INVALID_INPUT", "Missing filepath or asset_id"))

        current_path = _normalize_path(current_filepath)
        if not current_path:
            return _json_response(Result.Err("INVALID_INPUT", "Invalid current asset path"))

        try:
            # Require strict resolution to avoid following symlinks outside allowed roots.
            current_resolved = current_path.resolve(strict=True)
        except Exception:
            return _json_response(Result.Err("NOT_FOUND", "Current file does not exist"))
        if not _is_resolved_path_allowed(current_resolved):
            return _json_response(Result.Err("FORBIDDEN", "Path is not within allowed roots"))

        if not current_resolved.exists() or not current_resolved.is_file():
            return _json_response(Result.Err("NOT_FOUND", "Current file does not exist"))

        # Determine the new file path
        new_path = current_resolved.parent / new_name

        # Check if new name already exists (allow case-only rename on any filesystem).
        if new_path.exists():
            same_file = False
            try:
                same_file = bool(new_path.samefile(current_resolved))
            except Exception:
                same_file = False
            same_path_ignoring_case = str(new_path).lower() == str(current_resolved).lower()
            if not (same_file and same_path_ignoring_case):
                return _json_response(Result.Err("CONFLICT", f"File '{new_name}' already exists"))

        # Perform the rename
        try:
            current_resolved.rename(new_path)
        except Exception as exc:
            return _json_response(
                Result.Err(
                    "RENAME_FAILED",
                    _safe_error_message(exc, "Failed to rename file"),
                )
            )

        async def _rollback_physical_rename() -> None:
            try:
                if new_path.exists() and not current_resolved.exists():
                    new_path.rename(current_resolved)
            except Exception as rollback_exc:
                logger.error("Failed to rollback rename for asset %s: %s", asset_id, rollback_exc)

        # Update database record
        try:
            try:
                mtime = int(new_path.stat().st_mtime)
            except FileNotFoundError:
                await _rollback_physical_rename()
                return _json_response(Result.Err("NOT_FOUND", "Renamed file does not exist"))
            except Exception as exc:
                await _rollback_physical_rename()
                return _json_response(
                    Result.Err(
                        "FS_ERROR",
                        _safe_error_message(exc, "Failed to stat renamed file"),
                    )
                )

            async with svc["db"].atransaction(mode="immediate"):
                defer_fk = await svc["db"].aexecute("PRAGMA defer_foreign_keys = ON")
                if not defer_fk.ok:
                    raise RuntimeError(defer_fk.error or "Failed to defer foreign key checks")

                if asset_id is not None:
                    update_res = await svc["db"].aexecute(
                        "UPDATE assets SET filename = ?, filepath = ?, mtime = ? WHERE id = ?",
                        (new_name, str(new_path), mtime, asset_id)
                    )
                    if not update_res.ok:
                        raise RuntimeError(update_res.error or "Failed to update assets filepath")
                else:
                    up2 = await svc["db"].aexecute(
                        "UPDATE assets SET filename = ?, filepath = ?, mtime = ? WHERE filepath = ?",
                        (new_name, str(new_path), mtime, str(current_resolved)),
                    )
                    if not up2.ok:
                        raise RuntimeError(up2.error or "Failed to update assets filepath")

                # Keep FK-linked tables in sync with renamed filepath.
                sj_res = await svc["db"].aexecute(
                    "UPDATE scan_journal SET filepath = ? WHERE filepath = ?",
                    (str(new_path), str(current_resolved)),
                )
                if not sj_res.ok:
                    raise RuntimeError(sj_res.error or "Failed to update scan_journal filepath")

                mc_res = await svc["db"].aexecute(
                    "UPDATE metadata_cache SET filepath = ? WHERE filepath = ?",
                    (str(new_path), str(current_resolved)),
                )
                if not mc_res.ok:
                    raise RuntimeError(mc_res.error or "Failed to update metadata_cache filepath")
        except Exception as exc:
            await _rollback_physical_rename()
            return _json_response(
                Result.Err(
                    "DB_ERROR",
                    _safe_error_message(exc, "Failed to update asset record"),
                )
            )

        # Targeted index refresh for the renamed file only (no full rescan).
        try:
            source = current_source
            root_id = current_root_id or None
            if not source:
                inferred_source, inferred_root_id = await _infer_source_and_root_id_from_path(new_path, get_runtime_output_root())
                source = inferred_source
                root_id = inferred_root_id
            index_svc = svc.get("index") if isinstance(svc, dict) else None
            if index_svc and hasattr(index_svc, "index_paths"):
                await asyncio.wait_for(
                    index_svc.index_paths(
                        [new_path],
                        str(new_path.parent),
                        False,  # force refresh to avoid stale row/path mismatch
                        source or "output",
                        root_id,
                    ),
                    timeout=TO_THREAD_TIMEOUT_S,
                )
        except Exception as exc:
            logger.debug("Post-rename targeted reindex skipped: %s", exc)

        fresh_asset = None
        if asset_id is not None:
            try:
                fr = await svc["db"].aquery(
                    """
                    SELECT a.id, a.filename, a.subfolder, a.filepath, a.source, a.root_id, a.kind, a.ext,
                           a.size, a.mtime, a.width, a.height, a.duration,
                           COALESCE(m.rating, 0) AS rating, COALESCE(m.tags, '[]') AS tags
                    FROM assets a
                    LEFT JOIN asset_metadata m ON m.asset_id = a.id
                    WHERE a.id = ?
                    LIMIT 1
                    """,
                    (asset_id,),
                )
                if fr.ok and fr.data:
                    fresh_asset = fr.data[0]
            except Exception:
                fresh_asset = None

        return _json_response(Result.Ok({
            "renamed": 1,
            "old_name": current_filename,
            "new_name": new_name,
            "old_path": str(current_resolved),
            "new_path": str(new_path),
            "asset": fresh_asset,
        }))

    @routes.post("/mjr/am/assets/delete")
    async def delete_assets(request):
        """
        Delete multiple assets by ID.

        Body: {"ids": [int, int, ...]}
        """
        csrf = _csrf_error(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))

        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)
        prefs = await _resolve_security_prefs(svc)
        op = _require_operation_enabled("assets_delete", prefs=prefs)
        if not op.ok:
            return _json_response(op)
        auth = _require_write_access(request)
        if not auth.ok:
            return _json_response(auth)

        allowed, retry_after = _check_rate_limit(request, "assets_delete", max_requests=10, window_seconds=60)
        if not allowed:
            return _json_response(Result.Err("RATE_LIMITED", "Rate limit exceeded. Please wait before retrying.", retry_after=retry_after))

        body_res = await _read_json(request)
        if not body_res.ok:
            return _json_response(body_res)
        body = body_res.data or {}

        asset_ids = body.get("ids")
        if not asset_ids or not isinstance(asset_ids, list):
            return _json_response(Result.Err("INVALID_INPUT", "Missing or invalid 'ids' array"))

        # Validate all IDs are integers
        validated_ids = []
        for aid in asset_ids:
            try:
                validated_ids.append(int(aid))
            except (ValueError, TypeError):
                return _json_response(Result.Err("INVALID_INPUT", f"Invalid asset_id: {aid}"))

        if not validated_ids:
            return _json_response(Result.Err("INVALID_INPUT", "No valid asset IDs provided"))

        # PHASE 1: Validate all assets exist
        try:
            res = await svc["db"].aquery_in(
                "SELECT id, filepath FROM assets WHERE {IN_CLAUSE}",
                "id",
                validated_ids,
            )
            if not res.ok:
                return _json_response(res)

            found_assets = res.data or []
            found_ids = {row["id"] for row in found_assets if isinstance(row, dict) and "id" in row}
            missing_ids = set(validated_ids) - found_ids
            if missing_ids:
                return _json_response(Result.Err("NOT_FOUND", f"Assets not found: {sorted(missing_ids)}"))
        except Exception as exc:
            return _json_response(
                Result.Err(
                    "DB_ERROR",
                    _safe_error_message(exc, "Failed to validate assets"),
                )
            )

        # PHASE 2: Validate and resolve file paths
        validated_assets = []
        for asset_row in found_assets:
            asset_id = asset_row.get("id")
            raw_path = asset_row.get("filepath")

            if asset_id is None:
                return _json_response(Result.Err("DB_ERROR", "Missing asset id in DB row"))
            if not raw_path or not isinstance(raw_path, str):
                return _json_response(Result.Err("INVALID_INPUT", f"Invalid path for asset ID {asset_id}"))

            candidate = _normalize_path(raw_path)
            if not candidate:
                return _json_response(Result.Err("INVALID_INPUT", f"Invalid asset path for ID {asset_id}"))

            allowed_path = _is_path_allowed(candidate) or _is_path_allowed_custom(candidate)
            if not allowed_path:
                return _json_response(Result.Err("FORBIDDEN", f"Path for asset ID {asset_id} is not within allowed roots"))

            try:
                resolved = candidate.resolve(strict=True)
            except Exception:
                resolved = None
            if resolved is not None and not _is_resolved_path_allowed(resolved):
                return _json_response(Result.Err("FORBIDDEN", f"Path for asset ID {asset_id} is not within allowed roots"))

            validated_assets.append({"id": int(asset_id), "filepath": str(raw_path), "resolved": resolved})

        validated_assets.sort(key=lambda x: x["id"])

        # PHASE 3: Delete files first and track per-asset outcomes for partial success.
        file_deletion_errors = []
        assets_ready_for_db_delete = []
        for asset_info in validated_assets:
            resolved = asset_info["resolved"]
            if resolved and resolved.exists() and resolved.is_file():
                try:
                    del_res = _delete_file_best_effort(resolved)
                    if not del_res.ok:
                        file_deletion_errors.append({"asset_id": asset_info["id"], "error": str(del_res.error or "delete failed")})
                        continue
                except Exception as exc:
                    file_deletion_errors.append(
                        {
                            "asset_id": asset_info["id"],
                            "error": _safe_error_message(exc, "File deletion failed"),
                        }
                    )
                    continue
            assets_ready_for_db_delete.append(asset_info)

        # PHASE 4: Delete DB rows for assets that were physically deleted (or had no file to delete).
        async def _db_delete_many(selected_assets: list[dict[str, Any]]) -> Result:
            if not selected_assets:
                return Result.Ok({"deleted_ids": [], "db_errors": [], "deleted": 0})

            deleted_ids: list[int] = []
            db_errors: list[dict[str, Any]] = []
            unique_ids = sorted({int(asset_info["id"]) for asset_info in selected_assets})
            unique_paths = sorted({str(asset_info["filepath"]) for asset_info in selected_assets if asset_info.get("filepath")})

            def _chunks(values: list[Any], size: int) -> list[list[Any]]:
                if size <= 0:
                    return [values]
                return [values[i:i + size] for i in range(0, len(values), size)]

            SQLITE_IN_MAX = 900

            async def _delete_where_in(column: str, table: str, values: list[Any]) -> Result:
                if not values:
                    return Result.Ok(True)
                for chunk in _chunks(values, SQLITE_IN_MAX):
                    placeholders = ",".join(["?"] * len(chunk))
                    q = f"DELETE FROM {table} WHERE {column} IN ({placeholders})"
                    dr = await svc["db"].aexecute(q, tuple(chunk))
                    if not dr.ok:
                        return Result.Err("DB_ERROR", str(dr.error or f"Failed deleting from {table}"))
                return Result.Ok(True)

            # Fast path: batch delete in a single transaction (O(1) queries for common batch sizes).
            try:
                async with svc["db"].atransaction(mode="immediate"):
                    assets_del = await _delete_where_in("id", "assets", unique_ids)
                    if not assets_del.ok:
                        raise RuntimeError(str(assets_del.error or "assets batch delete failed"))
                    sj_del = await _delete_where_in("filepath", "scan_journal", unique_paths)
                    if not sj_del.ok:
                        raise RuntimeError(str(sj_del.error or "scan_journal batch delete failed"))
                    mc_del = await _delete_where_in("filepath", "metadata_cache", unique_paths)
                    if not mc_del.ok:
                        raise RuntimeError(str(mc_del.error or "metadata_cache batch delete failed"))
                deleted_ids.extend(unique_ids)
                return Result.Ok({"deleted_ids": deleted_ids, "db_errors": db_errors, "deleted": len(deleted_ids)})
            except Exception as exc:
                logger.warning("Batch delete failed, falling back to per-asset deletion: %s", exc)

            # Fallback path: preserve partial success information when a batch query fails.
            for asset_info in selected_assets:
                aid = int(asset_info["id"])
                filepath = str(asset_info["filepath"])
                try:
                    del_res = await svc["db"].aexecute("DELETE FROM assets WHERE id = ?", (aid,))
                    if not del_res.ok:
                        db_errors.append({"asset_id": aid, "error": str(del_res.error or "DB delete failed")})
                        continue
                    await svc["db"].aexecute("DELETE FROM scan_journal WHERE filepath = ?", (filepath,))
                    await svc["db"].aexecute("DELETE FROM metadata_cache WHERE filepath = ?", (filepath,))
                    deleted_ids.append(aid)
                except Exception as exc:
                    db_errors.append({"asset_id": aid, "error": _safe_error_message(exc, "DB delete failed")})

            return Result.Ok({"deleted_ids": deleted_ids, "db_errors": db_errors, "deleted": len(deleted_ids)})

        try:
            db_res = await _db_delete_many(assets_ready_for_db_delete)
            if not db_res.ok:
                return _json_response(db_res)

            payload = db_res.data or {}
            deleted_ids = [int(x) for x in (payload.get("deleted_ids") or [])]
            db_errors = payload.get("db_errors") or []
            failed_ids = [int(item.get("asset_id")) for item in file_deletion_errors if isinstance(item, dict) and item.get("asset_id") is not None]
            failed_ids += [int(item.get("asset_id")) for item in db_errors if isinstance(item, dict) and item.get("asset_id") is not None]

            if file_deletion_errors or db_errors:
                return _json_response(Result.Ok(
                    {
                        "deleted": len(deleted_ids),
                        "deleted_ids": deleted_ids,
                        "failed_ids": sorted(set(failed_ids)),
                    },
                    partial=True,
                    errors=[*file_deletion_errors, *db_errors],
                    attempted=len(validated_assets),
                    deleted=len(deleted_ids),
                    failed=len(set(failed_ids)),
                ))

            return _json_response(Result.Ok({"deleted": len(deleted_ids), "deleted_ids": deleted_ids}))
        except Exception as exc:
            logger.error("Database deletion failed: %s", exc)
            return _json_response(
                Result.Err(
                    "DB_ERROR",
                    _safe_error_message(exc, "Failed to delete asset records"),
                )
            )

    @routes.post("/mjr/am/assets/rename")
    async def rename_asset_endpoint(request):
        """
        Rename a single asset file and update its database record.
        This endpoint is aliased to match the client function name.

        Body: {"asset_id": int, "new_name": str}
        """
        # This is an alias for the existing rename_asset function
        return await rename_asset(request)


async def download_asset(request: web.Request) -> web.StreamResponse:
    """
    Download an asset file by filepath.

    Query param: filepath (absolute path, must be within allowed roots)
    """
    preview = _is_preview_download_request(request)
    rate_limited = _download_rate_limit_response_or_none(request, preview=preview)
    if rate_limited is not None:
        return rate_limited

    filepath = request.query.get("filepath")
    if not filepath:
        return web.Response(status=400, text="Missing 'filepath' parameter")

    resolved_path = _resolve_download_path(filepath)
    if not isinstance(resolved_path, Path):
        return resolved_path
    return _build_download_response(resolved_path, preview=preview)


def _is_preview_download_request(request: web.Request) -> bool:
    return str(request.query.get("preview", "")).strip().lower() in ("1", "true", "yes", "on")


def _download_rate_limit_response_or_none(request: web.Request, *, preview: bool) -> web.Response | None:
    key = "download_asset_preview" if preview else "download_asset"
    max_requests = 2000 if preview else 30
    allowed, retry_after = _check_rate_limit(request, key, max_requests=max_requests, window_seconds=60)
    if allowed:
        return None
    return web.Response(status=429, text=f"Rate limit exceeded. Retry after {retry_after}s")


def _resolve_download_path(filepath: Any) -> Path | web.Response:
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
    if not _is_resolved_path_allowed(resolved):
        return web.Response(status=403, text="Path is not within allowed roots")
    if not resolved.is_file():
        return web.Response(status=404, text="File not found")
    if not _validate_no_symlink_open(resolved):
        return web.Response(status=403, text="Symlinked file not allowed")
    return resolved


def _validate_no_symlink_open(path: Path) -> bool:
    try:
        flags = os.O_RDONLY
        if os.name == "nt" and hasattr(os, "O_BINARY"):
            flags |= os.O_BINARY
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


def _build_download_response(resolved: Path, *, preview: bool) -> web.StreamResponse:
    return _pg_build_download_response(resolved, preview=preview)


def _safe_download_filename(name: str) -> str:
    return _pg_safe_download_filename(name)


def register_download_routes(routes: web.RouteTableDef):
    routes.get("/mjr/am/download")(download_asset)
