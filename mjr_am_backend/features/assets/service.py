"""Shared request preparation for asset mutation routes."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Awaitable, Callable, Mapping

from aiohttp import web

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

    services, error_result = await require_services()
    if error_result:
        return Result.Err(
            error_result.code or "SERVICE_UNAVAILABLE",
            error_result.error or "Service unavailable",
        )
    if not isinstance(services, dict):
        return Result.Err("SERVICE_UNAVAILABLE", "Service unavailable")

    prefs = await resolve_security_prefs(services)
    op = require_operation_enabled(operation, prefs=prefs)
    if not op.ok:
        return Result.Err(op.code or "FORBIDDEN", op.error or "Operation not allowed")

    auth = require_write_access(request)
    if not auth.ok:
        return Result.Err(auth.code or "FORBIDDEN", auth.error or "Write access required")

    allowed, retry_after = check_rate_limit(request, rate_limit_endpoint, max_requests, window_seconds)
    if not allowed:
        return Result.Err(
            "RATE_LIMITED",
            "Rate limit exceeded. Please wait before retrying.",
            retry_after=retry_after,
        )

    body_res = await read_json(request)
    if not body_res.ok:
        return Result.Err(body_res.code or "INVALID_INPUT", body_res.error or "Invalid request body")

    body = body_res.data if isinstance(body_res.data, dict) else {}
    return Result.Ok(AssetRouteContext(services=services, body=body))


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
        return Result.Err(context_res.code or "INVALID_INPUT", context_res.error or "Invalid request")

    context = context_res.data
    services = context.services if context else {}
    body = context.body if context else {}

    raw_asset_id = body.get("asset_id")
    asset_id: int | None
    if raw_asset_id is not None and str(raw_asset_id).strip() != "":
        try:
            asset_id = int(raw_asset_id)
        except (TypeError, ValueError):
            return Result.Err("INVALID_INPUT", "Invalid asset_id")
        filepath_res = await load_asset_filepath(services, asset_id)
        if not filepath_res.ok:
            return Result.Err(filepath_res.code or "NOT_FOUND", filepath_res.error or "Asset path not available")
        candidate_path = normalize_path(str(filepath_res.data or ""))
    else:
        asset_id = None
        candidate_path = resolve_body_filepath(body)

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
        return Result.Err(context_res.code or "INVALID_INPUT", context_res.error or "Invalid request")

    context = context_res.data
    services = context.services if context else {}
    body = context.body if context else {}

    raw_new_name = body.get("new_name")
    if not raw_new_name:
        return Result.Err("INVALID_INPUT", "Missing new_name")
    new_name = str(raw_new_name).strip()
    valid, message = validate_filename(new_name)
    if not valid:
        return Result.Err("INVALID_INPUT", message)
    if len(new_name) > max_name_length:
        return Result.Err("INVALID_INPUT", f"New name is too long (max {max_name_length} chars)")

    raw_asset_id = body.get("asset_id")
    asset_id: int | None
    if raw_asset_id is not None and str(raw_asset_id).strip() != "":
        try:
            asset_id = int(raw_asset_id)
        except (TypeError, ValueError):
            return Result.Err("INVALID_INPUT", "Invalid asset_id")
    else:
        asset_id = None

    return Result.Ok(
        AssetRenameContext(
            services=services,
            body=body,
            asset_id=asset_id,
            new_name=new_name,
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
        return Result.Err(context_res.code or "INVALID_INPUT", context_res.error or "Invalid request")

    context = context_res.data
    services = context.services if context else {}
    body = context.body if context else {}
    raw_ids = body.get(ids_key)
    if not raw_ids or not isinstance(raw_ids, list):
        return Result.Err("INVALID_INPUT", "Missing or invalid 'ids' array")

    asset_ids: list[int] = []
    for raw in raw_ids:
        try:
            asset_ids.append(int(raw))
        except (TypeError, ValueError):
            return Result.Err("INVALID_INPUT", f"Invalid asset_id: {raw}")

    if not asset_ids:
        return Result.Err("INVALID_INPUT", "No valid asset IDs provided")

    return Result.Ok(AssetIdsContext(services=services, body=body, asset_ids=asset_ids))


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
            return Result.Err(row_res.code or "NOT_FOUND", row_res.error or "Asset not found")
        row = row_res.data or {}
        return Result.Ok(
            _RenameState(
                current_filepath=str(row.get("filepath") or ""),
                current_filename=str(row.get("filename") or ""),
                current_source=str(row.get("source") or "").strip().lower(),
                current_root_id=str(row.get("root_id") or "").strip(),
            )
        )

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

    lookup_dict = lookup_row if isinstance(lookup_row, dict) else {}
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
    return Result.Ok((matched_asset_id, current_filename, current_source, current_root_id))


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
        return Result.Err(state_res.code or "NOT_FOUND", state_res.error or "Asset not found")
    state = state_res.data or _RenameState("", "", "", "")
    current_filepath = state.current_filepath
    current_filename = state.current_filename
    current_source = state.current_source
    current_root_id = state.current_root_id
    if not current_filepath:
        return Result.Err("INVALID_INPUT", "Missing filepath or asset_id")

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
        return Result.Err(lookup_res.code or "DB_ERROR", lookup_res.error or "Failed to resolve asset id")
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
