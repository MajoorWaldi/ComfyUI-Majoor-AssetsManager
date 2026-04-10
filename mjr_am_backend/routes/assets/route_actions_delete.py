"""Delete-oriented asset route action extracted from ``route_actions_crud``."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Awaitable, Callable

from aiohttp import web

from mjr_am_backend.features.assets.delete_service import delete_asset_and_cleanup
from mjr_am_backend.shared import Result
from mjr_am_backend.shared import sanitize_error_message as _safe_error_message


async def handle_delete_asset(
    request: web.Request,
    *,
    prepare_asset_path_context: Callable[[web.Request], Awaitable[Result[Any]]],
    resolve_delete_target: Callable[..., Awaitable[Result[Any]]],
    load_asset_filepath_by_id: Callable[[dict[str, Any], int], Awaitable[Result[str]]],
    find_asset_row_by_filepath: Callable[..., Any],
    filepath_db_keys: Callable[[str], Any],
    filepath_where_clause: Callable[..., Any],
    delete_file_safe: Callable[[Path], Result[Any]],
    audit_asset_write: Callable[..., Awaitable[None]],
    json_response: Callable[[Any], web.Response],
    require_services: Callable[[], Awaitable[tuple[dict[str, Any], Result[Any] | None]]],
    resolve_security_prefs: Callable[[dict[str, Any]], Awaitable[dict[str, Any]]],
    require_operation_enabled: Callable[..., Result[Any]],
    require_write_access: Callable[[web.Request], Result[Any]],
    check_rate_limit: Callable[..., tuple[bool, int | None]],
    read_json: Callable[[web.Request], Awaitable[Any]],
    csrf_error: Callable[[web.Request], str | None],
    normalize_path: Callable[[str], Path | None],
    is_path_allowed: Callable[[Path], bool],
    is_path_allowed_custom: Callable[[Path], bool],
    is_resolved_path_allowed: Callable[[Path], bool],
    safe_error_message: Callable[[Exception, str], str] = _safe_error_message,
    logger: Any = None,
) -> web.Response:
    _ = (
        find_asset_row_by_filepath,
        filepath_db_keys,
        filepath_where_clause,
        resolve_security_prefs,
        require_operation_enabled,
        require_write_access,
        check_rate_limit,
        read_json,
        csrf_error,
        is_path_allowed,
        is_path_allowed_custom,
    )
    path_context_res = await prepare_asset_path_context(
        request,
        operation="asset_delete",
        rate_limit_endpoint="asset_delete",
        max_requests=20,
        window_seconds=60,
        require_services=require_services,
        resolve_security_prefs=resolve_security_prefs,
        require_operation_enabled=require_operation_enabled,
        require_write_access=require_write_access,
        check_rate_limit=check_rate_limit,
        read_json=read_json,
        csrf_error=csrf_error,
        normalize_path=lambda raw: normalize_path(str(raw)),
        resolve_body_filepath=lambda body: normalize_path(str((body or {}).get("filepath") or (body or {}).get("path") or "")),
        load_asset_filepath=load_asset_filepath_by_id,
    )
    if not path_context_res.ok:
        return json_response(path_context_res)
    path_context = path_context_res.data
    svc = path_context.services if path_context else {}
    candidate = path_context.candidate_path if path_context else None
    if candidate is None:
        return json_response(Result.Err("INVALID_INPUT", "Missing filepath or asset_id"))

    target_res = await resolve_delete_target(
        context=path_context,
        find_asset_row_by_filepath=find_asset_row_by_filepath,
        filepath_db_keys=filepath_db_keys,
        filepath_where_clause=filepath_where_clause,
        is_resolved_path_allowed=is_resolved_path_allowed,
    )
    if not target_res.ok:
        return json_response(target_res)
    target = target_res.data
    if target is None:
        return json_response(Result.Err("INVALID_INPUT", "Missing filepath or asset_id"))
    matched_asset_id = target.matched_asset_id
    resolved = target.resolved_path
    result = await delete_asset_and_cleanup(
        services=svc,
        target=target,
        delete_file_safe=delete_file_safe,
        safe_error_message=safe_error_message,
        logger=logger,
    )
    await audit_asset_write(
        request,
        svc,
        "asset_delete",
        f"asset:{matched_asset_id}" if matched_asset_id is not None else str(resolved),
        result,
    )
    return json_response(result)
