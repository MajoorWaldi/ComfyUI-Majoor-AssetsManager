"""Shared request preparation for asset mutation routes."""

from __future__ import annotations

from collections.abc import Awaitable, Callable, Mapping
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from aiohttp import web

from ..index.scan_batch_utils import normalize_filepath_str
from ...shared import Result


@dataclass(slots=True)
class AssetRouteContext:
    services: dict[str, Any]
    body: dict[str, Any]


@dataclass(slots=True)
class AssetPathContext:
    services: dict[str, Any]
    body: dict[str, Any]
    asset_id: int | None
    candidate_path: Path


@dataclass(slots=True)
class AssetRenameContext:
    services: dict[str, Any]
    body: dict[str, Any]
    asset_id: int | None
    new_name: str


@dataclass(slots=True)
class AssetIdsContext:
    services: dict[str, Any]
    body: dict[str, Any]
    asset_ids: list[int]


@dataclass(slots=True)
class AssetDeleteTarget:
    services: dict[str, Any]
    matched_asset_id: int | None
    resolved_path: Path
    filepath_where: str
    filepath_params: tuple[Any, ...]


@dataclass(slots=True)
class AssetRenameTarget:
    services: dict[str, Any]
    matched_asset_id: int | None
    current_resolved: Path
    current_filename: str
    current_source: str
    current_root_id: str
    filepath_where: str
    filepath_params: tuple[Any, ...]
    new_name: str


@dataclass(slots=True)
class _RenameState:
    current_filepath: str
    current_filename: str
    current_source: str
    current_root_id: str


async def load_asset_filepath_by_id(services: dict[str, Any], asset_id: int) -> Result[str]:
    """Load the filepath for an asset by its DB id."""
    from mjr_am_backend.shared import sanitize_error_message as _safe_error

    db = services.get("db") if isinstance(services, dict) else None
    if not db:
        return Result.Err("SERVICE_UNAVAILABLE", "Database service unavailable")
    try:
        res = await db.aquery("SELECT filepath FROM assets WHERE id = ?", (asset_id,))
        if not res.ok or not res.data:
            return Result.Err("NOT_FOUND", "Asset not found")
        raw_path = (res.data[0] or {}).get("filepath")
    except Exception as exc:
        return Result.Err("DB_ERROR", _safe_error(exc, "Failed to load asset"))
    if not raw_path or not isinstance(raw_path, str):
        return Result.Err("NOT_FOUND", "Asset path not available")
    return Result.Ok(raw_path)


async def load_asset_row_by_id(services: dict[str, Any], asset_id: int) -> Result[dict[str, Any]]:
    """Load filepath/filename/source/root_id for an asset by its DB id."""
    from mjr_am_backend.shared import sanitize_error_message as _safe_error

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
        return Result.Err("DB_ERROR", _safe_error(exc, "Failed to load asset"))
    return Result.Ok(row if isinstance(row, dict) else {})


def _result_error(result: Result[Any], default_code: str, default_error: str) -> Result[Any]:
    return Result.Err(result.code or default_code, result.error or default_error)


def _rename_state_from_row(row: Mapping[str, Any] | None) -> _RenameState:
    row_dict = row if isinstance(row, Mapping) else {}
    return _RenameState(
        current_filepath=str(row_dict.get("filepath") or ""),
        current_filename=str(row_dict.get("filename") or ""),
        current_source=str(row_dict.get("source") or "").strip().lower(),
        current_root_id=str(row_dict.get("root_id") or "").strip(),
    )


def _parse_asset_ids(raw_ids: list[Any]) -> Result[list[int]]:
    asset_ids: list[int] = []
    for raw in raw_ids:
        try:
            asset_ids.append(int(raw))
        except (TypeError, ValueError):
            return Result.Err("INVALID_INPUT", f"Invalid asset_id: {raw}")
    if not asset_ids:
        return Result.Err("INVALID_INPUT", "No valid asset IDs provided")
    return Result.Ok(asset_ids)


def filepath_db_keys(path_value: str | Path | None) -> tuple[str, ...]:
    raw = str(path_value or "").strip()
    if not raw:
        return tuple()
    keys: list[str] = []
    for candidate in (raw, normalize_filepath_str(raw)):
        value = str(candidate or "").strip()
        if value and value not in keys:
            keys.append(value)
    return tuple(keys)


def filepath_where_clause(
    keys: tuple[str, ...],
    column: str = "filepath",
) -> tuple[str, tuple[Any, ...]]:
    if not keys:
        return f"{column} = ''", tuple()
    placeholders = ",".join("?" * len(keys))
    where = f"{column} IN ({placeholders})"
    params: list[Any] = list(keys)
    # Extra fallback for legacy rows whose casing differs from the normalized key.
    where = f"{where} OR {column} = ? COLLATE NOCASE"
    params.append(keys[0])
    return where, tuple(params)


async def find_asset_row_by_filepath(
    db: Any,
    filepath: str,
    *,
    select_sql: str,
) -> dict[str, Any] | None:
    keys = filepath_db_keys(filepath)
    where_clause, where_params = filepath_where_clause(keys, column="filepath")
    res = await db.aquery(
        f"SELECT {select_sql} FROM assets WHERE {where_clause} ORDER BY id DESC LIMIT 1",
        where_params,
    )
    if not res.ok or not res.data:
        return None
    row = res.data[0] or {}
    return row if isinstance(row, dict) else None


async def find_asset_id_row_by_filepath(db: Any, filepath: str) -> dict[str, Any] | None:
    return await find_asset_row_by_filepath(db, filepath, select_sql="id")


async def find_rename_row_by_filepath(db: Any, filepath: str) -> dict[str, Any] | None:
    return await find_asset_row_by_filepath(
        db,
        filepath,
        select_sql="id, filename, source, root_id",
    )


def _rename_lookup_details(
    lookup_row: dict[str, Any] | None,
    *,
    current_filename: str,
    current_source: str,
    current_root_id: str,
) -> tuple[int | None, str, str, str]:
    lookup_dict = lookup_row if isinstance(lookup_row, dict) else {}
    matched_asset_id: int | None = None
    try:
        raw_id = lookup_dict.get("id")
        if raw_id is not None:
            matched_asset_id = int(raw_id)
    except Exception:
        matched_asset_id = None
    if not current_filename:
        current_filename = str(lookup_dict.get("filename") or current_filename)
    if not current_source:
        current_source = str(lookup_dict.get("source") or "").strip().lower()
    if not current_root_id:
        current_root_id = str(lookup_dict.get("root_id") or "").strip()
    return matched_asset_id, current_filename, current_source, current_root_id


async def _load_services(
    require_services: Callable[[], Awaitable[tuple[dict[str, Any] | None, Result[Any] | None]]],
) -> Result[dict[str, Any]]:
    services, error_result = await require_services()
    if error_result:
        return _result_error(error_result, "SERVICE_UNAVAILABLE", "Service unavailable")
    if not isinstance(services, dict):
        return Result.Err("SERVICE_UNAVAILABLE", "Service unavailable")
    return Result.Ok(services)


async def _check_operation_auth(
    request: web.Request,
    *,
    operation: str,
    services: dict[str, Any],
    resolve_security_prefs: Callable[[Mapping[str, Any] | None], Awaitable[Mapping[str, Any] | None]],
    require_operation_enabled: Callable[..., Result[Any]],
    require_write_access: Callable[[web.Request], Result[Any]],
) -> Result[None]:
    prefs = await resolve_security_prefs(services)
    op = require_operation_enabled(operation, prefs=prefs)
    if not op.ok:
        return _result_error(op, "FORBIDDEN", "Operation not allowed")
    auth = require_write_access(request)
    if not auth.ok:
        return _result_error(auth, "FORBIDDEN", "Write access required")
    return Result.Ok(None)


async def _check_rate_limit_and_read_body(
    request: web.Request,
    *,
    rate_limit_endpoint: str,
    max_requests: int,
    window_seconds: int,
    check_rate_limit: Callable[[web.Request, str, int, int], tuple[bool, int | None]],
    read_json: Callable[[web.Request], Awaitable[Result[dict[str, Any]]]],
) -> Result[dict[str, Any]]:
    allowed, retry_after = check_rate_limit(request, rate_limit_endpoint, max_requests, window_seconds)
    if not allowed:
        return Result.Err(
            "RATE_LIMITED",
            "Rate limit exceeded. Please wait before retrying.",
            retry_after=retry_after,
    )
    body_res = await read_json(request)
    if not body_res.ok:
        return _result_error(body_res, "INVALID_INPUT", "Invalid request body")
    body = body_res.data if isinstance(body_res.data, dict) else {}
    return Result.Ok(body)


async def prepare_asset_route_context(
    request: web.Request,
    *,
    operation: str,
    rate_limit_endpoint: str,
    max_requests: int,
    window_seconds: int,
    require_services: Callable[[], Awaitable[tuple[dict[str, Any] | None, Result[Any] | None]]],
    resolve_security_prefs: Callable[[Mapping[str, Any] | None], Awaitable[Mapping[str, Any] | None]],
    require_operation_enabled: Callable[..., Result[Any]],
    require_write_access: Callable[[web.Request], Result[Any]],
    check_rate_limit: Callable[[web.Request, str, int, int], tuple[bool, int | None]],
    read_json: Callable[[web.Request], Awaitable[Result[dict[str, Any]]]],
    csrf_error: Callable[[web.Request], str | None],
) -> Result[AssetRouteContext]:
    csrf = csrf_error(request)
    if csrf:
        return Result.Err("CSRF", csrf)

    svc_res = await _load_services(require_services)
    if not svc_res.ok:
        return _result_error(svc_res, "SERVICE_UNAVAILABLE", "Service unavailable")
    services = svc_res.data or {}

    auth_res = await _check_operation_auth(
        request,
        operation=operation,
        services=services,
        resolve_security_prefs=resolve_security_prefs,
        require_operation_enabled=require_operation_enabled,
        require_write_access=require_write_access,
    )
    if not auth_res.ok:
        return _result_error(auth_res, "FORBIDDEN", "Forbidden")

    body_res = await _check_rate_limit_and_read_body(
        request,
        rate_limit_endpoint=rate_limit_endpoint,
        max_requests=max_requests,
        window_seconds=window_seconds,
        check_rate_limit=check_rate_limit,
        read_json=read_json,
    )
    if not body_res.ok:
        return _result_error(body_res, "INVALID_INPUT", "Invalid request body")

    return Result.Ok(AssetRouteContext(services=services, body=body_res.data or {}))


async def _resolve_asset_id_and_path(
    body: dict[str, Any],
    *,
    services: dict[str, Any],
    normalize_path: Callable[[str], Path | None],
    resolve_body_filepath: Callable[[dict[str, Any] | None], Path | None],
    load_asset_filepath: Callable[[dict[str, Any], int], Awaitable[Result[str]]],
) -> Result[tuple[int | None, Path | None]]:
    raw_asset_id = body.get("asset_id")
    if raw_asset_id is not None and str(raw_asset_id).strip() != "":
        try:
            asset_id = int(raw_asset_id)
        except (TypeError, ValueError):
            return Result.Err("INVALID_INPUT", "Invalid asset_id")
        filepath_res = await load_asset_filepath(services, asset_id)
        if not filepath_res.ok:
            return Result.Err(filepath_res.code or "NOT_FOUND", filepath_res.error or "Asset path not available")
        return Result.Ok((asset_id, normalize_path(str(filepath_res.data or ""))))
    return Result.Ok((None, resolve_body_filepath(body)))


async def prepare_asset_path_context(
    request: web.Request,
    *,
    operation: str,
    rate_limit_endpoint: str,
    max_requests: int,
    window_seconds: int,
    require_services: Callable[[], Awaitable[tuple[dict[str, Any] | None, Result[Any] | None]]],
    resolve_security_prefs: Callable[[Mapping[str, Any] | None], Awaitable[Mapping[str, Any] | None]],
    require_operation_enabled: Callable[..., Result[Any]],
    require_write_access: Callable[[web.Request], Result[Any]],
    check_rate_limit: Callable[[web.Request, str, int, int], tuple[bool, int | None]],
    read_json: Callable[[web.Request], Awaitable[Result[dict[str, Any]]]],
    csrf_error: Callable[[web.Request], str | None],
    normalize_path: Callable[[str], Path | None],
    resolve_body_filepath: Callable[[dict[str, Any] | None], Path | None],
    load_asset_filepath: Callable[[dict[str, Any], int], Awaitable[Result[str]]],
) -> Result[AssetPathContext]:
    context_res = await prepare_asset_route_context(
        request,
        operation=operation,
        rate_limit_endpoint=rate_limit_endpoint,
        max_requests=max_requests,
        window_seconds=window_seconds,
        require_services=require_services,
        resolve_security_prefs=resolve_security_prefs,
        require_operation_enabled=require_operation_enabled,
        require_write_access=require_write_access,
        check_rate_limit=check_rate_limit,
        read_json=read_json,
        csrf_error=csrf_error,
    )
    if not context_res.ok:
        return _result_error(context_res, "INVALID_INPUT", "Invalid request")

    context = context_res.data
    services = context.services if context else {}
    body = context.body if context else {}

    path_res = await _resolve_asset_id_and_path(
        body,
        services=services,
        normalize_path=normalize_path,
        resolve_body_filepath=resolve_body_filepath,
        load_asset_filepath=load_asset_filepath,
    )
    if not path_res.ok:
        return _result_error(path_res, "INVALID_INPUT", "Invalid request")
    asset_id, candidate_path = path_res.data or (None, None)

    if candidate_path is None:
        return Result.Err("INVALID_INPUT", "Missing filepath or asset_id")
    return Result.Ok(
        AssetPathContext(
            services=services,
            body=body,
            asset_id=asset_id,
            candidate_path=candidate_path,
        )
    )


def _validate_new_name(
    body: dict[str, Any],
    *,
    max_name_length: int,
    validate_filename: Callable[[str], tuple[bool, str]],
) -> Result[str]:
    raw_new_name = body.get("new_name")
    if not raw_new_name:
        return Result.Err("INVALID_INPUT", "Missing new_name")
    new_name = str(raw_new_name).strip()
    valid, message = validate_filename(new_name)
    if not valid:
        return Result.Err("INVALID_INPUT", message)
    if len(new_name) > max_name_length:
        return Result.Err("INVALID_INPUT", f"New name is too long (max {max_name_length} chars)")
    return Result.Ok(new_name)


def _parse_optional_asset_id(body: dict[str, Any]) -> Result[int | None]:
    raw_asset_id = body.get("asset_id")
    if raw_asset_id is not None and str(raw_asset_id).strip() != "":
        try:
            return Result.Ok(int(raw_asset_id))
        except (TypeError, ValueError):
            return Result.Err("INVALID_INPUT", "Invalid asset_id")
    return Result.Ok(None)


async def prepare_asset_rename_context(
    request: web.Request,
    *,
    max_name_length: int,
    validate_filename: Callable[[str], tuple[bool, str]],
    require_services: Callable[[], Awaitable[tuple[dict[str, Any] | None, Result[Any] | None]]],
    resolve_security_prefs: Callable[[Mapping[str, Any] | None], Awaitable[Mapping[str, Any] | None]],
    require_operation_enabled: Callable[..., Result[Any]],
    require_write_access: Callable[[web.Request], Result[Any]],
    check_rate_limit: Callable[[web.Request, str, int, int], tuple[bool, int | None]],
    read_json: Callable[[web.Request], Awaitable[Result[dict[str, Any]]]],
    csrf_error: Callable[[web.Request], str | None],
) -> Result[AssetRenameContext]:
    context_res = await prepare_asset_route_context(
        request,
        operation="asset_rename",
        rate_limit_endpoint="asset_rename",
        max_requests=20,
        window_seconds=60,
        require_services=require_services,
        resolve_security_prefs=resolve_security_prefs,
        require_operation_enabled=require_operation_enabled,
        require_write_access=require_write_access,
        check_rate_limit=check_rate_limit,
        read_json=read_json,
        csrf_error=csrf_error,
    )
    if not context_res.ok:
        return _result_error(context_res, "INVALID_INPUT", "Invalid request")

    context = context_res.data
    services = context.services if context else {}
    body = context.body if context else {}

    name_res = _validate_new_name(body, max_name_length=max_name_length, validate_filename=validate_filename)
    if not name_res.ok:
        return _result_error(name_res, "INVALID_INPUT", "Invalid name")

    id_res = _parse_optional_asset_id(body)
    if not id_res.ok:
        return _result_error(id_res, "INVALID_INPUT", "Invalid asset_id")

    return Result.Ok(
        AssetRenameContext(
            services=services,
            body=body,
            asset_id=id_res.data,
            new_name=name_res.data or "",
        )
    )


async def prepare_asset_ids_context(
    request: web.Request,
    *,
    operation: str,
    rate_limit_endpoint: str,
    max_requests: int,
    window_seconds: int,
    require_services: Callable[[], Awaitable[tuple[dict[str, Any] | None, Result[Any] | None]]],
    resolve_security_prefs: Callable[[Mapping[str, Any] | None], Awaitable[Mapping[str, Any] | None]],
    require_operation_enabled: Callable[..., Result[Any]],
    require_write_access: Callable[[web.Request], Result[Any]],
    check_rate_limit: Callable[[web.Request, str, int, int], tuple[bool, int | None]],
    read_json: Callable[[web.Request], Awaitable[Result[dict[str, Any]]]],
    csrf_error: Callable[[web.Request], str | None],
    ids_key: str = "ids",
) -> Result[AssetIdsContext]:
    context_res = await prepare_asset_route_context(
        request,
        operation=operation,
        rate_limit_endpoint=rate_limit_endpoint,
        max_requests=max_requests,
        window_seconds=window_seconds,
        require_services=require_services,
        resolve_security_prefs=resolve_security_prefs,
        require_operation_enabled=require_operation_enabled,
        require_write_access=require_write_access,
        check_rate_limit=check_rate_limit,
        read_json=read_json,
        csrf_error=csrf_error,
    )
    if not context_res.ok:
        return _result_error(context_res, "INVALID_INPUT", "Invalid request")

    context = context_res.data
    services = context.services if context else {}
    body = context.body if context else {}
    raw_ids = body.get(ids_key)
    if not raw_ids or not isinstance(raw_ids, list):
        return Result.Err("INVALID_INPUT", "Missing or invalid 'ids' array")

    asset_ids_res = _parse_asset_ids(raw_ids)
    if not asset_ids_res.ok:
        return _result_error(asset_ids_res, "INVALID_INPUT", "Invalid asset IDs")

    return Result.Ok(AssetIdsContext(services=services, body=body, asset_ids=asset_ids_res.data or []))


async def resolve_delete_target(
    *,
    context: AssetPathContext,
    find_asset_row_by_filepath: Callable[[Any, str], Awaitable[dict[str, Any] | None]],
    filepath_db_keys: Callable[[str], tuple[str, ...]],
    filepath_where_clause: Callable[[tuple[str, ...], str], tuple[str, tuple[Any, ...]]],
    is_resolved_path_allowed: Callable[[Path], bool],
) -> Result[AssetDeleteTarget]:
    try:
        resolved = context.candidate_path.resolve(strict=True)
    except Exception:
        return Result.Err("NOT_FOUND", "File does not exist")
    if not is_resolved_path_allowed(resolved):
        return Result.Err("FORBIDDEN", "Path is not within allowed roots")

    matched_asset_id = context.asset_id
    resolved_str = str(resolved)
    filepath_keys = filepath_db_keys(resolved_str)
    filepath_where, filepath_params = filepath_where_clause(filepath_keys, "filepath")

    if matched_asset_id is None:
        try:
            asset_row = await find_asset_row_by_filepath(context.services["db"], resolved_str)
        except Exception as exc:
            if isinstance(exc, TimeoutError):
                return Result.Err("TIMEOUT", "Asset lookup timed out")
            return Result.Err("DB_ERROR", f"Failed to resolve asset id: {exc}")
        try:
            raw_id = asset_row.get("id") if isinstance(asset_row, dict) else None
            if raw_id is not None:
                matched_asset_id = int(raw_id)
        except Exception:
            matched_asset_id = None

    return Result.Ok(
        AssetDeleteTarget(
            services=context.services,
            matched_asset_id=matched_asset_id,
            resolved_path=resolved,
            filepath_where=filepath_where,
            filepath_params=filepath_params,
        )
    )


async def _load_initial_rename_state(
    *,
    context: AssetRenameContext,
    resolve_body_filepath: Callable[[dict[str, Any] | None], Path | None],
    load_asset_row_by_id: Callable[[dict[str, Any], int], Awaitable[Result[dict[str, Any]]]],
) -> Result[_RenameState]:
    if context.asset_id is not None:
        row_res = await load_asset_row_by_id(context.services, context.asset_id)
        if not row_res.ok:
            return _result_error(row_res, "NOT_FOUND", "Asset not found")
        return Result.Ok(_rename_state_from_row(row_res.data))

    fp = resolve_body_filepath(context.body)
    current_filepath = str(fp) if fp else ""
    current_filename = Path(current_filepath).name if current_filepath else ""
    return Result.Ok(
        _RenameState(
            current_filepath=current_filepath,
            current_filename=current_filename,
            current_source="",
            current_root_id="",
        )
    )


async def _resolve_rename_lookup_overrides(
    *,
    context: AssetRenameContext,
    current_resolved_str: str,
    current_filename: str,
    current_source: str,
    current_root_id: str,
    matched_asset_id: int | None,
    find_asset_row_by_filepath: Callable[[Any, str], Awaitable[dict[str, Any] | None]],
) -> Result[tuple[int | None, str, str, str]]:
    if matched_asset_id is not None:
        return Result.Ok((matched_asset_id, current_filename, current_source, current_root_id))
    try:
        lookup_row = await find_asset_row_by_filepath(context.services["db"], current_resolved_str)
    except Exception as exc:
        if isinstance(exc, TimeoutError):
            return Result.Err("TIMEOUT", "Asset lookup timed out")
        return Result.Err("DB_ERROR", f"Failed to resolve asset id: {exc}")

    return Result.Ok(
        _rename_lookup_details(
            lookup_row,
            current_filename=current_filename,
            current_source=current_source,
            current_root_id=current_root_id,
        )
    )


def _resolve_existing_rename_path(
    current_filepath: str,
    *,
    normalize_path: Callable[[str], Path | None],
    is_resolved_path_allowed: Callable[[Path], bool],
) -> Result[Path]:
    current_path = normalize_path(current_filepath)
    if not current_path:
        return Result.Err("INVALID_INPUT", "Invalid current asset path")

    try:
        current_resolved = current_path.resolve(strict=True)
    except Exception:
        return Result.Err("NOT_FOUND", "Current file does not exist")
    if not is_resolved_path_allowed(current_resolved):
        return Result.Err("FORBIDDEN", "Path is not within allowed roots")
    if not current_resolved.exists() or not current_resolved.is_file():
        return Result.Err("NOT_FOUND", "Current file does not exist")
    return Result.Ok(current_resolved)


async def resolve_rename_target(
    *,
    context: AssetRenameContext,
    normalize_path: Callable[[str], Path | None],
    resolve_body_filepath: Callable[[dict[str, Any] | None], Path | None],
    load_asset_row_by_id: Callable[[dict[str, Any], int], Awaitable[Result[dict[str, Any]]]],
    find_asset_row_by_filepath: Callable[[Any, str], Awaitable[dict[str, Any] | None]],
    filepath_db_keys: Callable[[str], tuple[str, ...]],
    filepath_where_clause: Callable[[tuple[str, ...], str], tuple[str, tuple[Any, ...]]],
    is_resolved_path_allowed: Callable[[Path], bool],
) -> Result[AssetRenameTarget]:
    state_res = await _load_initial_rename_state(
        context=context,
        resolve_body_filepath=resolve_body_filepath,
        load_asset_row_by_id=load_asset_row_by_id,
    )
    if not state_res.ok:
        return _result_error(state_res, "NOT_FOUND", "Asset not found")
    state = state_res.data or _RenameState("", "", "", "")
    current_filepath = state.current_filepath
    current_filename = state.current_filename
    current_source = state.current_source
    current_root_id = state.current_root_id
    if not current_filepath:
        return Result.Err("INVALID_INPUT", "Missing filepath or asset_id")

    current_resolved_res = _resolve_existing_rename_path(
        current_filepath,
        normalize_path=normalize_path,
        is_resolved_path_allowed=is_resolved_path_allowed,
    )
    if not current_resolved_res.ok:
        return _result_error(current_resolved_res, "NOT_FOUND", "Current file does not exist")
    current_resolved = current_resolved_res.data
    if current_resolved is None:
        return Result.Err("NOT_FOUND", "Current file does not exist")

    current_resolved_str = str(current_resolved)
    filepath_keys = filepath_db_keys(current_resolved_str)
    filepath_where, filepath_params = filepath_where_clause(filepath_keys, "filepath")
    lookup_res = await _resolve_rename_lookup_overrides(
        context=context,
        current_resolved_str=current_resolved_str,
        current_filename=current_filename,
        current_source=current_source,
        current_root_id=current_root_id,
        matched_asset_id=context.asset_id,
        find_asset_row_by_filepath=find_asset_row_by_filepath,
    )
    if not lookup_res.ok:
        return _result_error(lookup_res, "DB_ERROR", "Failed to resolve asset id")
    matched_asset_id, current_filename, current_source, current_root_id = lookup_res.data or (
        context.asset_id,
        current_filename,
        current_source,
        current_root_id,
    )

    return Result.Ok(
        AssetRenameTarget(
            services=context.services,
            matched_asset_id=matched_asset_id,
            current_resolved=current_resolved,
            current_filename=current_filename,
            current_source=current_source,
            current_root_id=current_root_id,
            filepath_where=filepath_where,
            filepath_params=filepath_params,
            new_name=context.new_name,
        )
    )
