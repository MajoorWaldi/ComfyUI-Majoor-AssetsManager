"""Batch tag add/remove route action (bulk tagging across a selection)."""

from __future__ import annotations

from collections.abc import Awaitable, Callable, Mapping
from typing import Any

from aiohttp import web
from mjr_am_backend.features.assets.request_context_service import PrepareAssetIdsContext
from mjr_am_backend.shared import Result
from mjr_am_backend.shared import sanitize_error_message as _safe_error_message

MAX_ASSETS_PER_REQUEST = 500


def _tags_audit_target(asset_ids: list[int]) -> str:
    return f"assets:{','.join(str(value) for value in asset_ids[:25])}"


def _dedupe_asset_ids(raw_ids: list[int]) -> list[int]:
    """Drop duplicate ids, preserving request order."""
    asset_ids: list[int] = []
    seen_ids: set[int] = set()
    for asset_id in raw_ids:
        if asset_id in seen_ids:
            continue
        seen_ids.add(asset_id)
        asset_ids.append(asset_id)
    return asset_ids


def _sanitize_tag_list(
    raw: Any, sanitize_tags: Callable[[object], Result[list[str]]]
) -> Result[list[str]]:
    if raw is None:
        return Result.Ok([])
    sanitized = sanitize_tags(raw)
    if not sanitized.ok:
        return Result.Err(
            sanitized.code or "INVALID_INPUT", str(sanitized.error or "Invalid tags")
        )
    return Result.Ok(sanitized.data or [])


async def handle_update_assets_tags(
    request: web.Request,
    *,
    prepare_asset_ids_context: PrepareAssetIdsContext,
    sanitize_tags: Callable[[object], Result[list[str]]],
    enqueue_rating_tags_sync: Callable[[web.Request, dict[str, Any], int], Awaitable[None]],
    audit_asset_write: Callable[..., Awaitable[None]],
    json_response: Callable[[Any], web.Response],
    require_services: Callable[[], Awaitable[tuple[dict[str, Any], Result[Any] | None]]],
    resolve_security_prefs: Callable[[Mapping[str, Any] | None], Awaitable[Mapping[str, Any] | None]],
    require_operation_enabled: Callable[..., Result[Any]],
    require_write_access: Callable[[web.Request], Result[Any]],
    check_rate_limit: Callable[[web.Request, str, int, int], tuple[bool, int | None]],
    read_json: Callable[[web.Request], Awaitable[Any]],
    csrf_error: Callable[[web.Request], str | None],
    max_assets_per_request: int = MAX_ASSETS_PER_REQUEST,
    safe_error_message: Callable[[Exception, str], str] = _safe_error_message,
) -> web.Response:
    ids_ctx_res = await prepare_asset_ids_context(
        request,
        operation="assets_tags",
        rate_limit_endpoint="assets_tags",
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
    asset_ids = _dedupe_asset_ids(list(ids_ctx.asset_ids if ids_ctx else []))

    if len(asset_ids) > max_assets_per_request:
        return json_response(
            Result.Err(
                "INVALID_INPUT",
                f"Too many asset ids (max {max_assets_per_request})",
            )
        )

    add_res = _sanitize_tag_list(body.get("add"), sanitize_tags)
    if not add_res.ok:
        return json_response(add_res)
    remove_res = _sanitize_tag_list(body.get("remove"), sanitize_tags)
    if not remove_res.ok:
        return json_response(remove_res)
    add_tags = add_res.data or []
    remove_tags = remove_res.data or []

    if not add_tags and not remove_tags:
        return json_response(
            Result.Err("INVALID_INPUT", "Provide at least one tag to add or remove")
        )

    updated_ids: list[int] = []
    unchanged_ids: list[int] = []
    failed: list[dict[str, Any]] = []
    final_tags: dict[str, list[str]] = {}

    for asset_id in asset_ids:
        try:
            merge_res = await svc["index"].merge_asset_tags(asset_id, add_tags, remove_tags)
        except Exception as exc:
            failed.append(
                {
                    "id": asset_id,
                    "code": "INTERNAL",
                    "error": safe_error_message(exc, "Failed to update tags"),
                }
            )
            continue
        if not merge_res.ok:
            failed.append(
                {
                    "id": asset_id,
                    "code": merge_res.code or "UPDATE_FAILED",
                    "error": str(merge_res.error or "Failed to update tags"),
                }
            )
            continue
        payload = merge_res.data or {}
        tags = [str(tag) for tag in (payload.get("tags") or []) if str(tag or "").strip()]
        final_tags[str(asset_id)] = tags
        if payload.get("changed"):
            updated_ids.append(asset_id)
        else:
            unchanged_ids.append(asset_id)

    for asset_id in updated_ids:
        await enqueue_rating_tags_sync(request, svc, asset_id)

    data = {
        "updated_ids": updated_ids,
        "unchanged_ids": unchanged_ids,
        "failed": failed,
        "tags": final_tags,
    }
    meta: dict[str, Any] = {
        "updated": len(updated_ids),
        "unchanged": len(unchanged_ids),
        "failed": len(failed),
    }
    if failed:
        meta["partial"] = True
    result = Result.Ok(data, **meta)

    await audit_asset_write(
        request,
        svc,
        "assets_tags",
        _tags_audit_target(asset_ids),
        result,
        add_count=len(add_tags),
        remove_count=len(remove_tags),
        updated=len(updated_ids),
        unchanged=len(unchanged_ids),
        failed=len(failed),
    )
    return json_response(result)
