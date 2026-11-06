"""Batch-rating asset route action (rate many assets in one request)."""

from __future__ import annotations

from collections.abc import Awaitable, Callable, Mapping
from typing import Any

from aiohttp import web
from mjr_am_backend.features.assets.request_context_service import PrepareAssetIdsContext
from mjr_am_backend.shared import Result
from mjr_am_backend.shared import sanitize_error_message as _safe_error_message

MAX_BULK_RATING_IDS = 500
_EXISTENCE_CHECK_CHUNK = 900


def _rating_audit_target(asset_ids: list[int]) -> str:
    return f"assets:{','.join(str(value) for value in asset_ids[:25])}"


def _chunk_values(values: list[Any], size: int) -> list[list[Any]]:
    return [values[i:i + size] for i in range(0, len(values), size)] if size > 0 else [values]


async def _find_existing_asset_ids(
    services: dict[str, Any],
    asset_ids: list[int],
    *,
    safe_error_message: Callable[[Exception, str], str],
) -> Result[set[int]]:
    found: set[int] = set()
    for chunk in _chunk_values(asset_ids, _EXISTENCE_CHECK_CHUNK):
        try:
            res = await services["db"].aquery_in(
                "SELECT id FROM assets WHERE {IN_CLAUSE}",
                "id",
                chunk,
            )
        except Exception as exc:
            return Result.Err("DB_ERROR", safe_error_message(exc, "Failed to validate assets"))
        if not res.ok:
            return Result.Err(res.code or "DB_ERROR", str(res.error or "Failed to validate assets"))
        for row in res.data or []:
            if not isinstance(row, dict) or "id" not in row:
                continue
            try:
                found.add(int(row["id"]))
            except (TypeError, ValueError):
                continue
    return Result.Ok(found)


async def handle_update_assets_rating(
    request: web.Request,
    *,
    prepare_asset_ids_context: PrepareAssetIdsContext,
    parse_rating_value: Callable[[object], Result[int]],
    enqueue_rating_tags_sync: Callable[[web.Request, dict[str, Any], int], Awaitable[None]],
    audit_asset_write: Callable[..., Awaitable[None]],
    json_response: Callable[[Any], web.Response],
    require_services: Callable[[], Awaitable[tuple[dict[str, Any] | None, Result[Any] | None]]],
    resolve_security_prefs: Callable[[Mapping[str, Any] | None], Awaitable[Mapping[str, Any] | None]],
    require_operation_enabled: Callable[..., Result[Any]],
    require_write_access: Callable[[web.Request], Result[Any]],
    check_rate_limit: Callable[..., tuple[bool, int | None]],
    read_json: Callable[[web.Request], Awaitable[Any]],
    csrf_error: Callable[[web.Request], str | None],
    max_ids: int = MAX_BULK_RATING_IDS,
    safe_error_message: Callable[[Exception, str], str] = _safe_error_message,
    logger: Any = None,
) -> web.Response:
    ids_ctx_res = await prepare_asset_ids_context(
        request,
        operation="assets_rating",
        rate_limit_endpoint="assets_rating",
        max_requests=10,
        window_seconds=60,
        require_services=require_services,
        resolve_security_prefs=resolve_security_prefs,
        require_operation_enabled=require_operation_enabled,
        require_write_access=require_write_access,
        check_rate_limit=check_rate_limit,
        read_json=read_json,
        csrf_error=csrf_error,
    )
    if not ids_ctx_res.ok:
        return json_response(ids_ctx_res)
    ids_ctx = ids_ctx_res.data
    svc = ids_ctx.services if ids_ctx else {}
    body = ids_ctx.body if ids_ctx else {}
    parsed_ids = list(ids_ctx.asset_ids if ids_ctx else [])

    if len(parsed_ids) > max_ids:
        return json_response(Result.Err("INVALID_INPUT", f"Too many asset IDs (max {max_ids})"))

    if "rating" not in body:
        return json_response(Result.Err("INVALID_INPUT", "Missing 'rating'"))
    rating_res = parse_rating_value(body.get("rating"))
    if not rating_res.ok:
        return json_response(rating_res)
    rating = int(rating_res.data or 0)

    asset_ids = list(dict.fromkeys(parsed_ids))

    found_res = await _find_existing_asset_ids(svc, asset_ids, safe_error_message=safe_error_message)
    if not found_res.ok:
        return json_response(found_res)
    existing_ids = found_res.data or set()

    updated_ids: list[int] = []
    failed: list[dict[str, Any]] = [
        {"id": asset_id, "code": "NOT_FOUND", "error": f"Asset not found: {asset_id}"}
        for asset_id in asset_ids
        if asset_id not in existing_ids
    ]

    for asset_id in asset_ids:
        if asset_id not in existing_ids:
            continue
        try:
            result = await svc["index"].update_asset_rating(asset_id, rating)
        except Exception as exc:
            if logger:
                logger.debug("Bulk rating update failed for asset_id=%s: %s", asset_id, exc)
            result = Result.Err("UPDATE_FAILED", safe_error_message(exc, "Failed to update rating"))
        if result.ok:
            updated_ids.append(asset_id)
            await enqueue_rating_tags_sync(request, svc, asset_id)
        else:
            failed.append(
                {
                    "id": asset_id,
                    "code": result.code or "UPDATE_FAILED",
                    "error": str(result.error or "Failed to update rating"),
                }
            )

    payload: dict[str, Any] = {
        "updated_ids": updated_ids,
        "failed": failed,
        "rating": rating,
    }
    if failed:
        result_out = Result.Ok(
            payload,
            partial=True,
            attempted=len(asset_ids),
            updated=len(updated_ids),
            failed=len(failed),
        )
    else:
        result_out = Result.Ok(
            payload,
            attempted=len(asset_ids),
            updated=len(updated_ids),
            failed=0,
        )
    await audit_asset_write(
        request,
        svc,
        "assets_rating",
        _rating_audit_target(asset_ids),
        result_out,
        rating=rating,
        updated=len(updated_ids),
        failed=len(failed),
    )
    return json_response(result_out)


__all__ = ["handle_update_assets_rating"]
