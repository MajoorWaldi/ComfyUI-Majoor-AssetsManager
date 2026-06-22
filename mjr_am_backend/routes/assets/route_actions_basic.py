"""Basic asset route actions extracted from ``route_actions``."""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
from collections.abc import Awaitable, Callable, Mapping
from pathlib import Path
from typing import Any

from aiohttp import web
from mjr_am_backend.features.assets.request_context_service import PrepareAssetPathContext
from mjr_am_backend.shared import Result
from mjr_am_backend.shared import sanitize_error_message as _safe_error_message


async def handle_retry_services(
    request: web.Request,
    *,
    csrf_error: Callable[[web.Request], str | None],
    require_write_access: Callable[[web.Request], Result[Any]],
    build_services: Callable[..., Awaitable[Any]],
    get_services_error: Callable[[], str | None],
    json_response: Callable[[Any], web.Response],
) -> web.Response:
    csrf = csrf_error(request)
    if csrf:
        return json_response(Result.Err("CSRF", csrf))
    auth = require_write_access(request)
    if not auth.ok:
        return json_response(auth)

    services = await build_services(force=True)
    if services:
        return json_response(Result.Ok({"reinitialized": True}))

    error_message = get_services_error() or "Unknown error"
    return json_response(Result.Err("SERVICE_UNAVAILABLE", f"Failed to initialize services: {error_message}"))


async def handle_update_asset_rating(
    request: web.Request,
    *,
    prepare_asset_rating_request: Callable[[web.Request], Awaitable[Result[tuple[dict[str, Any], dict[str, Any]]]]],
    resolve_rating_asset_id: Callable[[dict[str, Any], dict[str, Any]], Awaitable[Result[int]]],
    parse_rating_value: Callable[[object], Result[int]],
    enqueue_rating_tags_sync: Callable[[web.Request, dict[str, Any], int], Awaitable[None]],
    audit_asset_write: Callable[..., Awaitable[None]],
    json_response: Callable[[Any], web.Response],
    safe_error_message: Callable[[Exception, str], str] = _safe_error_message,
) -> web.Response:
    prep = await prepare_asset_rating_request(request)
    if not prep.ok:
        return json_response(prep)
    svc, body = prep.data or ({}, {})

    asset_res = await resolve_rating_asset_id(body, svc)
    if not asset_res.ok:
        return json_response(asset_res)
    rating_res = parse_rating_value(body.get("rating"))
    if not rating_res.ok:
        return json_response(rating_res)
    asset_id = int(asset_res.data or 0)
    rating = int(rating_res.data or 0)

    try:
        result = await svc["index"].update_asset_rating(asset_id, rating)
    except Exception as exc:
        result = Result.Err("UPDATE_FAILED", safe_error_message(exc, "Failed to update rating"))
    if result.ok:
        await enqueue_rating_tags_sync(request, svc, asset_id)
    await audit_asset_write(
        request,
        svc,
        "asset_rating",
        f"asset:{asset_id}",
        result,
        rating=rating,
    )
    return json_response(result)


async def handle_update_asset_tags(
    request: web.Request,
    *,
    prepare_asset_tags_request: Callable[[web.Request], Awaitable[Result[tuple[dict[str, Any], dict[str, Any]]]]],
    resolve_rating_asset_id: Callable[[dict[str, Any], dict[str, Any]], Awaitable[Result[int]]],
    sanitize_tags: Callable[[object], Result[list[str]]],
    enqueue_rating_tags_sync: Callable[[web.Request, dict[str, Any], int], Awaitable[None]],
    audit_asset_write: Callable[..., Awaitable[None]],
    json_response: Callable[[Any], web.Response],
    safe_error_message: Callable[[Exception, str], str] = _safe_error_message,
) -> web.Response:
    context_res = await prepare_asset_tags_request(request)
    if not context_res.ok:
        return json_response(context_res)
    svc, body = context_res.data or ({}, {})

    asset_res = await resolve_rating_asset_id(body, svc)
    if not asset_res.ok:
        return json_response(asset_res)
    asset_id = int(asset_res.data or 0)

    sanitized_tags_res = sanitize_tags(body.get("tags"))
    if not sanitized_tags_res.ok:
        return json_response(sanitized_tags_res)
    sanitized_tags = sanitized_tags_res.data or []

    try:
        result = await svc["index"].update_asset_tags(asset_id, sanitized_tags)
    except Exception as exc:
        result = Result.Err("UPDATE_FAILED", safe_error_message(exc, "Failed to update tags"))
    if result.ok:
        await enqueue_rating_tags_sync(request, svc, asset_id)
    await audit_asset_write(
        request,
        svc,
        "asset_tags",
        f"asset:{int(asset_id)}",
        result,
        tag_count=len(sanitized_tags),
    )
    return json_response(result)


async def handle_open_in_folder(
    request: web.Request,
    *,
    prepare_asset_path_context: PrepareAssetPathContext,
    resolve_body_filepath: Callable[[dict[str, Any] | None], Path | None],
    load_asset_filepath_by_id: Callable[[dict[str, Any], int], Awaitable[Result[str]]],
    normalize_path: Callable[[str], Path | None],
    read_json: Callable[[web.Request], Awaitable[Any]],
    require_services: Callable[[], Awaitable[tuple[dict[str, Any], Result[Any] | None]]],
    resolve_security_prefs: Callable[[Mapping[str, Any] | None], Awaitable[Mapping[str, Any] | None]],
    require_operation_enabled: Callable[..., Result[Any]],
    require_write_access: Callable[[web.Request], Result[Any]],
    check_rate_limit: Callable[..., tuple[bool, int | None]],
    csrf_error: Callable[[web.Request], str | None],
    json_response: Callable[[Any], web.Response],
    logger: Any,
) -> web.Response:
    path_context_res = await prepare_asset_path_context(
        request,
        operation="open_in_folder",
        rate_limit_endpoint="open_in_folder",
        max_requests=1,
        window_seconds=2,
        require_services=require_services,
        resolve_security_prefs=resolve_security_prefs,
        require_operation_enabled=require_operation_enabled,
        require_write_access=require_write_access,
        check_rate_limit=check_rate_limit,
        read_json=read_json,
        csrf_error=csrf_error,
        normalize_path=normalize_path,
        resolve_body_filepath=resolve_body_filepath,
        load_asset_filepath=load_asset_filepath_by_id,
    )
    if not path_context_res.ok:
        return json_response(path_context_res)
    path_context = path_context_res.data
    candidate = path_context.candidate_path if path_context else None
    if candidate is None:
        return json_response(Result.Err("INVALID_INPUT", "Missing filepath or asset_id"))

    try:
        resolved = candidate.resolve(strict=True)
    except Exception:
        return json_response(Result.Err("NOT_FOUND", "File does not exist"))

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
            payload: dict[str, Any] = {"opened": True, "selected": selected}
            if cmd[0] == "xdg-open":
                payload["fallback"] = "xdg-open"
            return json_response(Result.Ok(payload))
        except Exception as exc:
            last_exception = exc

    if fallback_command:
        try:
            _execute_command(fallback_command)
            return json_response(Result.Ok({"opened": True, "selected": False, "fallback": "open"}))
        except Exception as exc:
            last_exception = exc

    logger.debug("Open in folder fallback exhausted: %s", last_exception)
    return json_response(
        Result.Err(
            "DEGRADED",
            _safe_error_message(last_exception or ValueError("Failed to open folder"), "Failed to open folder"),
        )
    )


async def handle_get_all_tags(
    request: web.Request,
    *,
    require_services: Callable[[], Awaitable[tuple[dict[str, Any], Result[Any] | None]]],
    json_response: Callable[[Any], web.Response],
    safe_error_message: Callable[[Exception, str], str] = _safe_error_message,
) -> web.Response:
    _ = request
    svc, error_result = await require_services()
    if error_result:
        return json_response(error_result)

    try:
        result = await svc["index"].get_all_tags()
    except Exception as exc:
        result = Result.Err("DB_ERROR", safe_error_message(exc, "Failed to load tags"))
    return json_response(result)
