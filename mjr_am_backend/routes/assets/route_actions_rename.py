"""Rename-oriented asset route action extracted from ``route_actions_crud``."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Awaitable, Callable

from aiohttp import web

from mjr_am_backend.features.assets.rename_service import rename_asset_and_sync
from mjr_am_backend.shared import Result
from mjr_am_backend.shared import sanitize_error_message as _safe_error_message


async def handle_rename_asset(
    request: web.Request,
    *,
    prepare_asset_rename_context: Callable[[web.Request], Awaitable[Result[Any]]],
    validate_filename: Callable[[str], Result[str]],
    resolve_rename_target: Callable[..., Awaitable[Result[Any]]],
    load_asset_row_by_id: Callable[..., Awaitable[Result[dict[str, Any]]]],
    find_asset_row_by_filepath: Callable[..., Any],
    filepath_db_keys: Callable[[str], Any],
    filepath_where_clause: Callable[..., Any],
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
    is_resolved_path_allowed: Callable[[Path], bool],
    infer_source_and_root_id_from_path: Callable[..., Awaitable[tuple[str, str]]],
    is_within_root: Callable[[Path, Path], bool],
    get_runtime_output_root: Callable[[], str],
    get_input_directory: Callable[[], str],
    list_custom_roots: Callable[[], Any],
    to_thread_timeout_s: int | float,
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
        get_runtime_output_root,
        get_input_directory,
        list_custom_roots,
    )
    rename_ctx_res = await prepare_asset_rename_context(
        request,
        max_name_length=255,
        validate_filename=validate_filename,
        require_services=require_services,
        resolve_security_prefs=resolve_security_prefs,
        require_operation_enabled=require_operation_enabled,
        require_write_access=require_write_access,
        check_rate_limit=check_rate_limit,
        read_json=read_json,
        csrf_error=csrf_error,
    )
    if not rename_ctx_res.ok:
        return json_response(rename_ctx_res)
    rename_ctx = rename_ctx_res.data
    svc = rename_ctx.services if rename_ctx else {}

    target_res = await resolve_rename_target(
        context=rename_ctx,
        normalize_path=lambda raw: normalize_path(str(raw)),
        resolve_body_filepath=lambda body: normalize_path(str((body or {}).get("filepath") or (body or {}).get("path") or "")),
        load_asset_row_by_id=load_asset_row_by_id,
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
    current_resolved = target.current_resolved
    current_filename = target.current_filename
    new_name = target.new_name

    result = await rename_asset_and_sync(
        services=svc,
        target=target,
        infer_source_and_root_id_from_path=infer_source_and_root_id_from_path,
        is_within_root=is_within_root,
        get_runtime_output_root=get_runtime_output_root,
        get_input_directory=get_input_directory,
        list_custom_roots=list_custom_roots,
        to_thread_timeout_s=to_thread_timeout_s,
        safe_error_message=safe_error_message,
        logger=logger,
    )
    await audit_asset_write(
        request,
        svc,
        "asset_rename",
        f"asset:{matched_asset_id}" if matched_asset_id is not None else str(current_resolved),
        result,
        old_name=current_filename,
        new_name=new_name,
    )
    return json_response(result)
