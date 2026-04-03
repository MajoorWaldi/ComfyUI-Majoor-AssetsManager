"""
Asset management endpoints: ratings, tags, service retry.
"""
import asyncio
import errno
import html as _html_mod
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any

from aiohttp import web
from mjr_am_backend.config import TO_THREAD_TIMEOUT_S, get_runtime_output_root
from mjr_am_backend.custom_roots import list_custom_roots, resolve_custom_root
from mjr_am_backend.features.assets import (
    prepare_asset_ids_context,
    prepare_asset_path_context,
    prepare_asset_rename_context,
    prepare_asset_route_context,
    resolve_delete_target,
    resolve_rename_target,
)
from mjr_am_backend.features.index.scan_batch_utils import normalize_filepath_str
from mjr_am_backend.shared import Result, get_logger
from mjr_am_backend.shared import sanitize_error_message as _safe_error_message

from ..assets.path_guard import (
    build_download_response as _pg_build_download_response,
)
from ..assets.path_guard import (
    delete_file_best_effort as _delete_file_safe,
)
from ..assets.path_guard import (
    is_resolved_path_allowed as _is_resolved_path_allowed,
)
from ..assets.path_guard import (
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
    _is_loopback_request,
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
    audit_log_write,
    get_services_error,
)

logger = get_logger(__name__)

MAX_TAGS_PER_ASSET = 50
MAX_TAG_LENGTH = 100
MAX_RENAME_LENGTH = 255
USER_GUIDE_FILE_NAME = "user_guide.html"

# P2-E-05/06 delegation to extracted modules.
from ..assets import filename_validator as _fv  # noqa: E402

_normalize_filename = _fv.normalize_filename
_filename_separator_error = _fv.filename_separator_error
_filename_char_error = _fv.filename_char_error
_filename_boundary_error = _fv.filename_boundary_error
_filename_reserved_error = _fv.filename_reserved_error
_validate_filename = _fv.validate_filename


def _resolve_local_user_guide_path() -> Path:
    try:
        return (Path(__file__).resolve().parents[3] / USER_GUIDE_FILE_NAME).resolve(strict=False)
    except Exception:
        return Path(USER_GUIDE_FILE_NAME)


def _resolve_docs_dir() -> Path:
    """Return the absolute path to the docs/ folder in the project root."""
    try:
        return (Path(__file__).resolve().parents[3] / "docs").resolve(strict=False)
    except Exception:
        return Path("docs")


# Allowed filename pattern for doc files (letters, digits, hyphens, underscores, dots).
_DOC_FILENAME_RE = re.compile(r"^[A-Za-z0-9_\-]+\.md$")

_DOCS_HTML_TEMPLATE = """\
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title} - Majoor Assets Manager Docs</title>
<style>
:root {{
    --bg: #1e1e1e; --bg2: #2a2a2a; --fg: #ddd;
    --fg2: rgba(255,255,255,0.65); --accent: #5fb3ff;
    --border: rgba(255,255,255,0.12); --code-bg: #333;
    --font: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
}}
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
body {{ font-family: var(--font); background: var(--bg); color: var(--fg);
       line-height: 1.6; font-size: 14px; padding: 0; }}
.header {{ background: var(--bg2); padding: 16px 24px; border-bottom: 1px solid var(--border);
           display: flex; align-items: center; gap: 16px; }}
.header a {{ color: var(--accent); text-decoration: none; font-size: 13px; }}
.header a:hover {{ text-decoration: underline; }}
.header h1 {{ font-size: 16px; font-weight: 600; }}
.content {{ max-width: 960px; margin: 0 auto; padding: 24px 32px; }}
.content pre {{ background: var(--code-bg); padding: 16px; border-radius: 8px;
               overflow-x: auto; font-family: Consolas, Monaco, monospace;
               font-size: 13px; line-height: 1.5; white-space: pre-wrap;
               word-wrap: break-word; color: var(--fg2); }}
</style>
</head>
<body>
<div class="header">
    <a href="/mjr/am/user-guide">&larr; Back to User Guide</a>
    <h1>{title}</h1>
</div>
<div class="content"><pre>{content}</pre></div>
</body>
</html>
"""

def register_asset_routes(routes: web.RouteTableDef) -> None:
    """Register asset CRUD routes (get, delete, rename)."""
    async def _audit_asset_write(
        request: web.Request,
        services: dict[str, Any],
        operation: str,
        target: Any,
        result: Result,
        **details: Any,
    ) -> None:
        try:
            await audit_log_write(
                services,
                request=request,
                operation=operation,
                target=target,
                result=result,
                details=details or None,
            )
        except Exception as exc:
            logger.debug("Audit logging skipped for %s: %s", operation, exc)

    async def _load_asset_filepath_by_id(services: dict[str, Any], asset_id: int) -> Result[str]:
        db = services.get("db") if isinstance(services, dict) else None
        if not db:
            return Result.Err("SERVICE_UNAVAILABLE", "Database service unavailable")
        try:
            res = await db.aquery("SELECT filepath FROM assets WHERE id = ?", (asset_id,))
            if not res.ok or not res.data:
                return Result.Err("NOT_FOUND", "Asset not found")
            raw_path = (res.data[0] or {}).get("filepath")
        except Exception as exc:
            return Result.Err("DB_ERROR", _safe_error_message(exc, "Failed to load asset"))
        if not raw_path or not isinstance(raw_path, str):
            return Result.Err("NOT_FOUND", "Asset path not available")
        return Result.Ok(raw_path)

    async def _load_asset_row_by_id(services: dict[str, Any], asset_id: int) -> Result[dict[str, Any]]:
        db = services.get("db") if isinstance(services, dict) else None
        if not db:
            return Result.Err("SERVICE_UNAVAILABLE", "Database service unavailable")
        try:
            res = await db.aquery(
                "SELECT filepath, filename, source, root_id FROM assets WHERE id = ?",
                (asset_id,),
            )
            if not res.ok or not res.data:
                return Result.Err("NOT_FOUND", "Asset not found")
            row = res.data[0] or {}
        except Exception as exc:
            return Result.Err("DB_ERROR", _safe_error_message(exc, "Failed to load asset"))
        return Result.Ok(row if isinstance(row, dict) else {})

    async def _find_asset_id_row_by_filepath(db: Any, filepath: str) -> dict[str, Any] | None:
        return await _find_asset_row_by_filepath(db, filepath, select_sql="id")

    async def _find_rename_row_by_filepath(db: Any, filepath: str) -> dict[str, Any] | None:
        return await _find_asset_row_by_filepath(
            db,
            filepath,
            select_sql="id, filename, source, root_id",
        )

    def _filepath_db_keys(path_value: str | Path | None) -> tuple[str, ...]:
        raw = str(path_value or "").strip()
        if not raw:
            return tuple()
        keys: list[str] = []
        for candidate in (raw, normalize_filepath_str(raw)):
            value = str(candidate or "").strip()
            if value and value not in keys:
                keys.append(value)
        return tuple(keys)

    def _filepath_where_clause(keys: tuple[str, ...], *, column: str = "filepath") -> tuple[str, tuple[Any, ...]]:
        if not keys:
            return f"{column} = ''", tuple()
        placeholders = ",".join("?" * len(keys))
        where = f"{column} IN ({placeholders})"
        params: list[Any] = list(keys)
        # Extra fallback for legacy rows whose casing differs from the normalized key.
        where = f"{where} OR {column} = ? COLLATE NOCASE"
        params.append(keys[0])
        return where, tuple(params)

    async def _find_asset_row_by_filepath(
        db: Any,
        filepath: str,
        *,
        select_sql: str,
    ) -> dict[str, Any] | None:
        keys = _filepath_db_keys(filepath)
        where_clause, where_params = _filepath_where_clause(keys, column="filepath")
        res = await db.aquery(
            f"SELECT {select_sql} FROM assets WHERE {where_clause} ORDER BY id DESC LIMIT 1",
            where_params,
        )
        if not res.ok or not res.data:
            return None
        row = res.data[0] or {}
        return row if isinstance(row, dict) else None

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
            row = await asyncio.wait_for(
                _find_asset_row_by_filepath(
                    services["db"],
                    str(resolved),
                    select_sql="id",
                ),
                timeout=TO_THREAD_TIMEOUT_S,
            )
            if not row:
                return Result.Err("NOT_FOUND", "Asset not indexed")
            asset_id = row.get("id")
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
        context_res = await prepare_asset_route_context(
            request,
            operation="asset_rating",
            rate_limit_endpoint="asset_rating",
            max_requests=30,
            window_seconds=60,
            require_services=_require_services,
            resolve_security_prefs=_resolve_security_prefs,
            require_operation_enabled=_require_operation_enabled,
            require_write_access=_require_write_access,
            check_rate_limit=_check_rate_limit,
            read_json=_read_json,
            csrf_error=_csrf_error,
        )
        if not context_res.ok:
            return _normalize_result_error(context_res, "INVALID_INPUT", "Invalid request body")
        context = context_res.data
        return Result.Ok(((context.services if context else {}), (context.body if context else {})))

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
        await _audit_asset_write(
            request,
            svc,
            "asset_rating",
            f"asset:{asset_id}",
            result,
            rating=rating,
        )
        return _json_response(result)

    @routes.post("/mjr/am/asset/tags")
    async def update_asset_tags(request):
        """
        Update asset tags.

        Body:
          - {"asset_id": int, "tags": list[str]}
          - OR {"filepath": str, "type": "output|input|custom", "root_id"?: str, "tags": list[str]}
        """
        context_res = await prepare_asset_route_context(
            request,
            operation="asset_tags",
            rate_limit_endpoint="asset_tags",
            max_requests=30,
            window_seconds=60,
            require_services=_require_services,
            resolve_security_prefs=_resolve_security_prefs,
            require_operation_enabled=_require_operation_enabled,
            require_write_access=_require_write_access,
            check_rate_limit=_check_rate_limit,
            read_json=_read_json,
            csrf_error=_csrf_error,
        )
        if not context_res.ok:
            return _json_response(context_res)
        context = context_res.data
        svc = context.services if context else {}
        body = context.body if context else {}

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

        # Validate and sanitize tags: strip control chars, deduplicate, enforce limits
        sanitized_tags = []
        for tag in tags:
            if not isinstance(tag, str):
                continue
            tag = re.sub(r"[\x00-\x1f\x7f]", "", str(tag)).strip()
            if not tag or len(tag) > MAX_TAG_LENGTH:
                continue
            tag_lower = tag.lower()
            if any(existing.lower() == tag_lower for existing in sanitized_tags):
                continue
            sanitized_tags.append(tag)
            if len(sanitized_tags) > MAX_TAGS_PER_ASSET:
                return _json_response(
                    Result.Err(
                        "INVALID_INPUT",
                        f"Too many tags (max {MAX_TAGS_PER_ASSET}, got {len(sanitized_tags)})",
                    )
                )

        try:
            result = await svc["index"].update_asset_tags(asset_id, sanitized_tags)
        except Exception as exc:
            result = Result.Err(
                "UPDATE_FAILED", _safe_error_message(exc, "Failed to update tags")
            )
        if result.ok:
            await _enqueue_rating_tags_sync(request, svc, asset_id)
        await _audit_asset_write(
            request,
            svc,
            "asset_tags",
            f"asset:{int(asset_id)}",
            result,
            tag_count=len(sanitized_tags),
        )
        return _json_response(result)

    @routes.post("/mjr/am/open-in-folder")
    async def open_in_folder(request):
        """
        Open the asset's folder in the OS file manager and (when supported) select the file.

        Body: {"asset_id": int} or {"filepath": str}
        """
        path_context_res = await prepare_asset_path_context(
            request,
            operation="open_in_folder",
            rate_limit_endpoint="open_in_folder",
            max_requests=1,
            window_seconds=2,
            require_services=_require_services,
            resolve_security_prefs=_resolve_security_prefs,
            require_operation_enabled=_require_operation_enabled,
            require_write_access=_require_write_access,
            check_rate_limit=_check_rate_limit,
            read_json=_read_json,
            csrf_error=_csrf_error,
            normalize_path=lambda raw: _normalize_path(str(raw)),
            resolve_body_filepath=_resolve_body_filepath,
            load_asset_filepath=_load_asset_filepath_by_id,
        )
        if not path_context_res.ok:
            return _json_response(path_context_res)
        path_context = path_context_res.data
        candidate = path_context.candidate_path if path_context else None
        if candidate is None:
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
            try:
                subprocess.Popen(
                    command,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    shell=False,
                )
            except OSError as exc:
                raise RuntimeError(f"Failed to launch {command[0]}: {exc}") from exc

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

    @routes.get("/mjr/am/user-guide")
    async def open_local_user_guide(_request):
        """
        Serve the local user_guide.html from this custom node folder.
        """
        guide_path = _resolve_local_user_guide_path()
        try:
            if not guide_path.is_file():
                return web.Response(status=404, text="User guide not found")
            return web.FileResponse(path=str(guide_path))
        except Exception as exc:
            return _json_response(
                Result.Err("FS_ERROR", _safe_error_message(exc, "Failed to open user guide"))
            )

    @routes.get("/mjr/am/docs/{filename}")
    async def serve_doc_file(request):
        """Serve a markdown documentation file from the docs/ folder."""
        filename = request.match_info.get("filename", "")
        if not _DOC_FILENAME_RE.match(filename):
            return web.Response(status=400, text="Invalid document filename")
        docs_dir = _resolve_docs_dir()
        doc_path = (docs_dir / filename).resolve()
        # Path traversal guard: resolved path must stay inside docs_dir.
        if not str(doc_path).startswith(str(docs_dir.resolve())):
            return web.Response(status=403, text="Access denied")
        if not doc_path.is_file():
            return web.Response(status=404, text="Document not found")
        try:
            content = doc_path.read_text(encoding="utf-8")
            title = filename.replace("_", " ").replace(".md", "")
            html_page = _DOCS_HTML_TEMPLATE.format(
                title=_html_mod.escape(title),
                content=_html_mod.escape(content),
            )
            return web.Response(text=html_page, content_type="text/html")
        except Exception as exc:
            return _json_response(
                Result.Err("FS_ERROR", _safe_error_message(exc, "Failed to read document"))
            )

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
            {"method": "GET", "path": "/mjr/am/user-guide", "description": "Open local Assets Manager user guide"},
            {"method": "GET", "path": "/mjr/am/docs/{filename}", "description": "Serve a markdown documentation file"},
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
        filepath_keys = _filepath_db_keys(filepath)
        filepath_where, filepath_params = _filepath_where_clause(filepath_keys, column="filepath")

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
            f"""
            SELECT id, filename, subfolder, filepath, source, root_id, kind, ext, size, mtime,
                   width, height, duration, enhanced_caption, job_id, stack_id,
                   source_node_id, source_node_type,
                   created_at, updated_at, indexed_at, content_hash, phash, hash_state
            FROM assets
            WHERE {filepath_where}
            ORDER BY id DESC
            LIMIT 1
            """,
            filepath_params,
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
                       has_generation_data, metadata_quality, metadata_raw, metadata_text
                FROM asset_metadata
                WHERE asset_id = ?
                LIMIT 1
                """,
                (asset_id,),
            )

        backups["scan_journal"] = await _query_one(
            f"""
            SELECT filepath, dir_path, state_hash, mtime, size, last_seen
            FROM scan_journal
            WHERE {filepath_where}
            LIMIT 1
            """,
            filepath_params,
        )
        backups["metadata_cache"] = await _query_one(
            f"""
            SELECT filepath, state_hash, metadata_hash, metadata_raw, last_updated
            FROM metadata_cache
            WHERE {filepath_where}
            LIMIT 1
            """,
            filepath_params,
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
                        INSERT INTO assets
                        (id, filename, subfolder, filepath, source, root_id, kind, ext, size, mtime, width, height, duration, enhanced_caption, job_id, stack_id, source_node_id, source_node_type, created_at, updated_at, indexed_at, content_hash, phash, hash_state)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(id) DO UPDATE SET
                            filename = excluded.filename,
                            subfolder = excluded.subfolder,
                            filepath = excluded.filepath,
                            source = excluded.source,
                            root_id = excluded.root_id,
                            kind = excluded.kind,
                            ext = excluded.ext,
                            size = excluded.size,
                            mtime = excluded.mtime,
                            width = excluded.width,
                            height = excluded.height,
                            duration = excluded.duration,
                            enhanced_caption = excluded.enhanced_caption,
                            job_id = excluded.job_id,
                            stack_id = excluded.stack_id,
                            source_node_id = excluded.source_node_id,
                            source_node_type = excluded.source_node_type,
                            created_at = excluded.created_at,
                            updated_at = excluded.updated_at,
                            indexed_at = excluded.indexed_at,
                            content_hash = excluded.content_hash,
                            phash = excluded.phash,
                            hash_state = excluded.hash_state
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
                            asset.get("enhanced_caption"),
                            asset.get("job_id"),
                            asset.get("stack_id"),
                            asset.get("source_node_id"),
                            asset.get("source_node_type"),
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
                        INSERT INTO asset_metadata
                        (asset_id, rating, tags, tags_text, workflow_hash, has_workflow, has_generation_data, metadata_quality, metadata_raw, metadata_text)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(asset_id) DO UPDATE SET
                            rating = excluded.rating,
                            tags = excluded.tags,
                            tags_text = excluded.tags_text,
                            workflow_hash = excluded.workflow_hash,
                            has_workflow = excluded.has_workflow,
                            has_generation_data = excluded.has_generation_data,
                            metadata_quality = excluded.metadata_quality,
                            metadata_raw = excluded.metadata_raw,
                            metadata_text = excluded.metadata_text
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
                            asset_meta.get("metadata_text"),
                        ),
                    )
                if scan_journal:
                    await db.aexecute(
                        """
                        INSERT INTO scan_journal
                        (filepath, dir_path, state_hash, mtime, size, last_seen)
                        VALUES (?, ?, ?, ?, ?, ?)
                        ON CONFLICT(filepath) DO UPDATE SET
                            dir_path = excluded.dir_path,
                            state_hash = excluded.state_hash,
                            mtime = excluded.mtime,
                            size = excluded.size,
                            last_seen = excluded.last_seen
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
                        INSERT INTO metadata_cache
                        (filepath, state_hash, metadata_hash, metadata_raw, last_updated)
                        VALUES (?, ?, ?, ?, ?)
                        ON CONFLICT(filepath) DO UPDATE SET
                            state_hash = excluded.state_hash,
                            metadata_hash = excluded.metadata_hash,
                            metadata_raw = excluded.metadata_raw,
                            last_updated = excluded.last_updated
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
        path_context_res = await prepare_asset_path_context(
            request,
            operation="asset_delete",
            rate_limit_endpoint="asset_delete",
            max_requests=20,
            window_seconds=60,
            require_services=_require_services,
            resolve_security_prefs=_resolve_security_prefs,
            require_operation_enabled=_require_operation_enabled,
            require_write_access=_require_write_access,
            check_rate_limit=_check_rate_limit,
            read_json=_read_json,
            csrf_error=_csrf_error,
            normalize_path=lambda raw: _normalize_path(str(raw)),
            resolve_body_filepath=_resolve_body_filepath,
            load_asset_filepath=_load_asset_filepath_by_id,
        )
        if not path_context_res.ok:
            return _json_response(path_context_res)
        path_context = path_context_res.data
        svc = path_context.services if path_context else {}
        candidate = path_context.candidate_path if path_context else None
        if candidate is None:
            return _json_response(Result.Err("INVALID_INPUT", "Missing filepath or asset_id"))

        target_res = await resolve_delete_target(
            context=path_context,
            find_asset_row_by_filepath=_find_asset_id_row_by_filepath,
            filepath_db_keys=_filepath_db_keys,
            filepath_where_clause=lambda keys, column="filepath": _filepath_where_clause(keys, column=column),
            is_resolved_path_allowed=_is_resolved_path_allowed,
        )
        if not target_res.ok:
            return _json_response(target_res)
        target = target_res.data
        if target is None:
            return _json_response(Result.Err("INVALID_INPUT", "Missing filepath or asset_id"))
        matched_asset_id = target.matched_asset_id
        resolved = target.resolved_path
        resolved_filepath_where = target.filepath_where
        resolved_filepath_params = target.filepath_params

        # Phase 1: Delete the physical file FIRST.
        # This avoids the NM-8 inconsistency window where the DB record is gone
        # but the file still exists.  If the file delete fails we abort early
        # without touching the DB, leaving everything consistent.
        try:
            del_res = _delete_file_safe(resolved)
            if not del_res.ok:
                raise RuntimeError(str(del_res.error or "delete failed"))
        except Exception as exc:
            result = Result.Err(
                "DELETE_FAILED",
                "Failed to delete file",
                errors=[{"asset_id": matched_asset_id, "error": _safe_error_message(exc, "File deletion failed")}],
                aborted=True
            )
            await _audit_asset_write(
                request,
                svc,
                "asset_delete",
                f"asset:{matched_asset_id}" if matched_asset_id is not None else str(resolved),
                result,
            )
            return _json_response(result)

        # Phase 2: Clean up DB records.  The file is already gone; if this
        # fails we have harmless orphan rows that the next scan/cleanup will
        # prune automatically.
        try:
            async with svc["db"].atransaction(mode="immediate"):
                if matched_asset_id is not None:
                    del_res = await svc["db"].aexecute("DELETE FROM assets WHERE id = ?", (matched_asset_id,))
                    if not del_res.ok:
                        logger.warning("DB cleanup after file delete failed: %s", del_res.error)
                else:
                    await svc["db"].aexecute(
                        f"DELETE FROM assets WHERE {resolved_filepath_where}",
                        resolved_filepath_params,
                    )
                await svc["db"].aexecute(
                    f"DELETE FROM scan_journal WHERE {resolved_filepath_where}",
                    resolved_filepath_params,
                )
                await svc["db"].aexecute(
                    f"DELETE FROM metadata_cache WHERE {resolved_filepath_where}",
                    resolved_filepath_params,
                )
        except Exception as exc:
            # File is deleted; DB cleanup failed.  Log but still report success
            # since the primary goal (remove the file) succeeded.
            logger.error(
                "File deleted but DB cleanup failed for asset_id=%s path=%s: %s",
                matched_asset_id, resolved, exc,
            )

        result = Result.Ok({"deleted": 1})
        await _audit_asset_write(
            request,
            svc,
            "asset_delete",
            f"asset:{matched_asset_id}" if matched_asset_id is not None else str(resolved),
            result,
        )
        return _json_response(result)

    @routes.post("/mjr/am/asset/rename")
    async def rename_asset(request):
        """
        Rename an asset file and update its database record.

        Body: {"asset_id": int, "new_name": str} or {"filepath": str, "new_name": str}
        """
        rename_ctx_res = await prepare_asset_rename_context(
            request,
            max_name_length=MAX_RENAME_LENGTH,
            validate_filename=_validate_filename,
            require_services=_require_services,
            resolve_security_prefs=_resolve_security_prefs,
            require_operation_enabled=_require_operation_enabled,
            require_write_access=_require_write_access,
            check_rate_limit=_check_rate_limit,
            read_json=_read_json,
            csrf_error=_csrf_error,
        )
        if not rename_ctx_res.ok:
            return _json_response(rename_ctx_res)
        rename_ctx = rename_ctx_res.data
        svc = rename_ctx.services if rename_ctx else {}
        new_name = rename_ctx.new_name if rename_ctx else ""

        target_res = await resolve_rename_target(
            context=rename_ctx,
            normalize_path=lambda raw: _normalize_path(str(raw)),
            resolve_body_filepath=_resolve_body_filepath,
            load_asset_row_by_id=_load_asset_row_by_id,
            find_asset_row_by_filepath=_find_rename_row_by_filepath,
            filepath_db_keys=_filepath_db_keys,
            filepath_where_clause=lambda keys, column="filepath": _filepath_where_clause(keys, column=column),
            is_resolved_path_allowed=_is_resolved_path_allowed,
        )
        if not target_res.ok:
            return _json_response(target_res)
        target = target_res.data
        if target is None:
            return _json_response(Result.Err("INVALID_INPUT", "Missing filepath or asset_id"))
        matched_asset_id = target.matched_asset_id
        current_resolved = target.current_resolved
        current_filename = target.current_filename
        current_source = target.current_source
        current_root_id = target.current_root_id
        current_filepath_where = target.filepath_where
        current_filepath_params = target.filepath_params
        new_name = target.new_name

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
                result = Result.Err("CONFLICT", f"File '{new_name}' already exists")
                await _audit_asset_write(
                    request,
                    svc,
                    "asset_rename",
                    f"asset:{matched_asset_id}" if matched_asset_id is not None else str(current_resolved),
                    result,
                    new_name=new_name,
                )
                return _json_response(result)

        # Perform the rename
        try:
            current_resolved.rename(new_path)
        except Exception as exc:
            result = Result.Err(
                "RENAME_FAILED",
                _safe_error_message(exc, "Failed to rename file"),
            )
            await _audit_asset_write(
                request,
                svc,
                "asset_rename",
                f"asset:{matched_asset_id}" if matched_asset_id is not None else str(current_resolved),
                result,
                new_name=new_name,
            )
            return _json_response(result)

        async def _rollback_physical_rename() -> None:
            try:
                if new_path.exists() and not current_resolved.exists():
                    new_path.rename(current_resolved)
            except Exception as rollback_exc:
                logger.error("Failed to rollback rename for asset %s: %s", matched_asset_id, rollback_exc)

        # Update database record
        try:
            try:
                mtime = int(new_path.stat().st_mtime)
            except FileNotFoundError:
                await _rollback_physical_rename()
                result = Result.Err("NOT_FOUND", "Renamed file does not exist")
                await _audit_asset_write(
                    request,
                    svc,
                    "asset_rename",
                    f"asset:{matched_asset_id}" if matched_asset_id is not None else str(current_resolved),
                    result,
                    new_name=new_name,
                )
                return _json_response(result)
            except Exception as exc:
                await _rollback_physical_rename()
                result = Result.Err(
                    "FS_ERROR",
                    _safe_error_message(exc, "Failed to stat renamed file"),
                )
                await _audit_asset_write(
                    request,
                    svc,
                    "asset_rename",
                    f"asset:{matched_asset_id}" if matched_asset_id is not None else str(current_resolved),
                    result,
                    new_name=new_name,
                )
                return _json_response(result)

            async with svc["db"].atransaction(mode="immediate"):
                defer_fk = await svc["db"].aexecute("PRAGMA defer_foreign_keys = ON")
                if not defer_fk.ok:
                    raise RuntimeError(defer_fk.error or "Failed to defer foreign key checks")

                if matched_asset_id is not None:
                    update_res = await svc["db"].aexecute(
                        "UPDATE assets SET filename = ?, filepath = ?, mtime = ? WHERE id = ?",
                        (new_name, str(new_path), mtime, matched_asset_id)
                    )
                    if not update_res.ok:
                        raise RuntimeError(update_res.error or "Failed to update assets filepath")
                    try:
                        updated_rows = int(update_res.data or 0)
                    except Exception:
                        updated_rows = 0
                    if updated_rows <= 0:
                        raise RuntimeError("Asset row not found for rename")
                else:
                    up2 = await svc["db"].aexecute(
                        f"UPDATE assets SET filename = ?, filepath = ?, mtime = ? WHERE {current_filepath_where}",
                        (new_name, str(new_path), mtime, *current_filepath_params),
                    )
                    if not up2.ok:
                        raise RuntimeError(up2.error or "Failed to update assets filepath")

                # Keep FK-linked tables in sync with renamed filepath.
                sj_res = await svc["db"].aexecute(
                    f"UPDATE scan_journal SET filepath = ? WHERE {current_filepath_where}",
                    (str(new_path), *current_filepath_params),
                )
                if not sj_res.ok:
                    raise RuntimeError(sj_res.error or "Failed to update scan_journal filepath")

                mc_res = await svc["db"].aexecute(
                    f"UPDATE metadata_cache SET filepath = ? WHERE {current_filepath_where}",
                    (str(new_path), *current_filepath_params),
                )
                if not mc_res.ok:
                    raise RuntimeError(mc_res.error or "Failed to update metadata_cache filepath")
        except Exception as exc:
            await _rollback_physical_rename()
            result = Result.Err(
                "DB_ERROR",
                _safe_error_message(exc, "Failed to update asset record"),
            )
            await _audit_asset_write(
                request,
                svc,
                "asset_rename",
                f"asset:{matched_asset_id}" if matched_asset_id is not None else str(current_resolved),
                result,
                new_name=new_name,
            )
            return _json_response(result)

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
        if matched_asset_id is not None:
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
                    (matched_asset_id,),
                )
                if fr.ok and fr.data:
                    fresh_asset = fr.data[0]
            except Exception:
                fresh_asset = None

        result = Result.Ok({
            "renamed": 1,
            "old_name": current_filename,
            "new_name": new_name,
            "old_path": str(current_resolved),
            "new_path": str(new_path),
            "asset": fresh_asset,
        })
        await _audit_asset_write(
            request,
            svc,
            "asset_rename",
            f"asset:{matched_asset_id}" if matched_asset_id is not None else str(current_resolved),
            result,
            old_name=current_filename,
            new_name=new_name,
        )
        return _json_response(result)

    @routes.post("/mjr/am/assets/delete")
    async def delete_assets(request):
        """
        Delete multiple assets by ID.

        Body: {"ids": [int, int, ...]}
        """
        ids_ctx_res = await prepare_asset_ids_context(
            request,
            operation="assets_delete",
            rate_limit_endpoint="assets_delete",
            max_requests=10,
            window_seconds=60,
            require_services=_require_services,
            resolve_security_prefs=_resolve_security_prefs,
            require_operation_enabled=_require_operation_enabled,
            require_write_access=_require_write_access,
            check_rate_limit=_check_rate_limit,
            read_json=_read_json,
            csrf_error=_csrf_error,
        )
        if not ids_ctx_res.ok:
            return _json_response(ids_ctx_res)
        ids_ctx = ids_ctx_res.data
        svc = ids_ctx.services if ids_ctx else {}
        validated_ids = ids_ctx.asset_ids if ids_ctx else []

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
                    del_res = _delete_file_safe(resolved)
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
                # Allowlist guards against SQL injection if callers ever pass non-literal names.
                _allowed: dict[str, frozenset[str]] = {
                    "assets":         frozenset({"id", "filepath"}),
                    "scan_journal":   frozenset({"id", "filepath"}),
                    "metadata_cache": frozenset({"id", "filepath"}),
                }
                if table not in _allowed or column not in _allowed[table]:
                    return Result.Err("INVALID_INPUT", f"Disallowed delete target: {table!r}.{column!r}")
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
                result = Result.Ok(
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
                )
                await _audit_asset_write(
                    request,
                    svc,
                    "assets_delete",
                    f"assets:{','.join(str(v) for v in validated_ids[:25])}",
                    result,
                    attempted=len(validated_assets),
                    deleted=len(deleted_ids),
                    failed=len(set(failed_ids)),
                )
                return _json_response(result)

            result = Result.Ok({"deleted": len(deleted_ids), "deleted_ids": deleted_ids})
            await _audit_asset_write(
                request,
                svc,
                "assets_delete",
                f"assets:{','.join(str(v) for v in validated_ids[:25])}",
                result,
                attempted=len(validated_assets),
                deleted=len(deleted_ids),
                failed=0,
            )
            return _json_response(result)
        except Exception as exc:
            logger.error("Database deletion failed: %s", exc)
            result = Result.Err(
                "DB_ERROR",
                _safe_error_message(exc, "Failed to delete asset records"),
            )
            await _audit_asset_write(
                request,
                svc,
                "assets_delete",
                f"assets:{','.join(str(v) for v in validated_ids[:25])}",
                result,
                attempted=len(validated_assets),
            )
            return _json_response(result)

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
    # Loopback clients are local users — skip rate limiting entirely.
    if _is_loopback_request(request):
        return None
    key = "download_asset_preview" if preview else "download_asset"
    max_requests = 200 if preview else 30
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
    except Exception as _e:
        # is_symlink() can raise on some platforms/edge cases; the path
        # will be re-checked by resolve(strict=True) below.
        logger.debug("is_symlink check failed (OS edge case): %s", _e)
    try:
        resolved = candidate.resolve(strict=True)
    except (OSError, RuntimeError, ValueError):
        return web.Response(status=404, text="File not found")
    if not _is_resolved_path_allowed(resolved):
        return web.Response(status=403, text="Path is not within allowed roots")
    if not resolved.is_file():
        return web.Response(status=404, text="File not found")
    symlink_status = _validate_no_symlink_open(resolved)
    if symlink_status == "symlink":
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


def _build_download_response(resolved: Path, *, preview: bool) -> web.StreamResponse:
    return _pg_build_download_response(resolved, preview=preview)


def _safe_download_filename(name: str) -> str:
    return _pg_safe_download_filename(name)


_COMFYUI_STRIP_TAGS_WEBP = [
    "EXIF:Make", "IFD0:Make",           # workflow
    "EXIF:Model", "IFD0:Model",         # prompt
    "EXIF:ImageDescription", "IFD0:ImageDescription",
    "EXIF:UserComment", "IFD0:UserComment",
]
_COMFYUI_STRIP_TAGS_VIDEO = [
    "QuickTime:Workflow", "QuickTime:Prompt",
    "Keys:Workflow", "Keys:Prompt",
]
_STRIP_SUPPORTED_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".mp4", ".mov"}

# PNG tEXt/iTXt/zTXt chunk keywords used by ComfyUI to embed metadata.
_PNG_COMFYUI_KEYWORDS = frozenset({b"workflow", b"prompt", b"parameters"})
_PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
_PNG_TEXT_CHUNK_TYPES = frozenset({b"tEXt", b"iTXt", b"zTXt"})


def _strip_png_comfyui_chunks(data: bytes) -> bytes:
    """Remove tEXt/iTXt/zTXt chunks whose keyword matches ComfyUI metadata.

    Works at the binary PNG level — no ExifTool dependency.
    Returns the cleaned PNG bytes, or the original data unchanged on error.
    """
    if len(data) < 8 or data[:8] != _PNG_SIGNATURE:
        return data

    out = bytearray(data[:8])
    pos = 8
    try:
        while pos + 8 <= len(data):
            chunk_len = int.from_bytes(data[pos:pos + 4], "big")
            chunk_type = data[pos + 4:pos + 8]
            # 4 (length) + 4 (type) + chunk_len (data) + 4 (CRC)
            total = 12 + chunk_len
            if pos + total > len(data):
                # Truncated chunk — keep the rest as-is.
                out.extend(data[pos:])
                break

            if chunk_type in _PNG_TEXT_CHUNK_TYPES:
                chunk_data = data[pos + 8:pos + 8 + chunk_len]
                # The keyword is a null-terminated string at the start of the chunk data.
                null_idx = chunk_data.find(b"\x00")
                keyword = chunk_data[:null_idx] if null_idx >= 0 else chunk_data
                if keyword.lower() in _PNG_COMFYUI_KEYWORDS:
                    # Skip this chunk entirely.
                    pos += total
                    continue

            out.extend(data[pos:pos + total])
            pos += total
    except Exception:
        return data
    return bytes(out)


def _strip_tags_for_ext(ext: str) -> list[str]:
    ext = ext.lower()
    if ext == ".png":
        return []  # PNG uses pure-Python chunk removal, not ExifTool
    if ext in (".webp", ".jpg", ".jpeg"):
        return _COMFYUI_STRIP_TAGS_WEBP
    if ext in (".mp4", ".mov"):
        return _COMFYUI_STRIP_TAGS_VIDEO
    return []


async def _download_clean_png(resolved_path: Path) -> web.StreamResponse:
    import mimetypes

    try:
        raw = await asyncio.to_thread(resolved_path.read_bytes)
        data = await asyncio.to_thread(_strip_png_comfyui_chunks, raw)
        mime_type, _ = mimetypes.guess_type(str(resolved_path))
        safe_name = _safe_download_filename(resolved_path.name)
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
        return _build_download_response(resolved_path, preview=False)


async def _download_clean_exiftool(resolved_path: Path, ext: str, exiftool: Any) -> web.StreamResponse:
    import mimetypes
    import tempfile

    tmp_dir = None
    try:
        tmp_dir = tempfile.mkdtemp(prefix="mjr_clean_")
        tmp_path = Path(tmp_dir) / resolved_path.name
        shutil.copy2(str(resolved_path), str(tmp_path))

        tags_to_strip = _strip_tags_for_ext(ext)
        stripped = False

        if tags_to_strip:
            metadata_clear = {tag: None for tag in tags_to_strip}
            strip_result = await asyncio.to_thread(
                exiftool.write, str(tmp_path), metadata_clear, False
            )
            if strip_result.ok:
                stripped = True
            else:
                logger.warning("Targeted metadata strip failed: %s — trying -all=", strip_result.error)

        if not stripped:
            fallback_result = await asyncio.to_thread(
                exiftool.write, str(tmp_path), {"all": None}, False
            )
            if not fallback_result.ok:
                logger.warning("Fallback metadata strip also failed: %s — serving original", fallback_result.error)
                shutil.rmtree(tmp_dir, ignore_errors=True)
                return _build_download_response(resolved_path, preview=False)

        data = await asyncio.to_thread(tmp_path.read_bytes)
        shutil.rmtree(tmp_dir, ignore_errors=True)
        tmp_dir = None

        mime_type, _ = mimetypes.guess_type(str(resolved_path))
        safe_name = _safe_download_filename(resolved_path.name)
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
        return _build_download_response(resolved_path, preview=False)


async def download_clean_asset(request: web.Request) -> web.StreamResponse:
    """
    Download an asset with ComfyUI metadata (workflow, prompt) stripped.

    - PNG: pure-Python tEXt/iTXt/zTXt chunk removal (ExifTool can't delete custom PNG text chunks).
    - WEBP/JPEG: ExifTool to clear standard EXIF tags used by ComfyUI.
    - Video: ExifTool to clear QuickTime metadata tags.

    Query param: filepath (absolute path, must be within allowed roots)
    """
    rate_limited = _download_rate_limit_response_or_none(request, preview=False)
    if rate_limited is not None:
        return rate_limited

    filepath = request.query.get("filepath")
    if not filepath:
        return web.Response(status=400, text="Missing 'filepath' parameter")

    resolved_path = _resolve_download_path(filepath)
    if not isinstance(resolved_path, Path):
        return resolved_path

    ext = resolved_path.suffix.lower()
    if ext not in _STRIP_SUPPORTED_EXTS:
        return _build_download_response(resolved_path, preview=False)

    if ext == ".png":
        return await _download_clean_png(resolved_path)

    svc, svc_err = await _require_services()
    if svc_err or not svc:
        return _build_download_response(resolved_path, preview=False)

    exiftool = svc.get("exiftool")
    if not exiftool or not getattr(exiftool, "_available", False):
        logger.warning("ExifTool not available — serving original file without stripping")
        return _build_download_response(resolved_path, preview=False)

    return await _download_clean_exiftool(resolved_path, ext, exiftool)


def register_download_routes(routes: web.RouteTableDef):
    routes.get("/mjr/am/download")(download_asset)
    routes.get("/mjr/am/download-clean")(download_clean_asset)
