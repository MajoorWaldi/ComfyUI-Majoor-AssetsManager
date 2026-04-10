"""Request preparation helpers for asset mutation routes."""

from __future__ import annotations

from collections.abc import Awaitable, Callable, Mapping
from pathlib import Path
from typing import Any

from aiohttp import web

from ...shared import Result
from .models import AssetIdsContext, AssetPathContext, AssetRenameContext, AssetRouteContext


def _result_error(result: Result[Any], default_code: str, default_error: str) -> Result[Any]:
    return Result.Err(result.code or default_code, result.error or default_error)


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


__all__ = [
    "prepare_asset_ids_context",
    "prepare_asset_path_context",
    "prepare_asset_rename_context",
    "prepare_asset_route_context",
]