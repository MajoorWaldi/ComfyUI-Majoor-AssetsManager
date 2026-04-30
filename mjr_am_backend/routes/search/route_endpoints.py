"""Focused search route handlers extracted from ``search_impl``."""

from __future__ import annotations

import asyncio
from collections.abc import Callable
from typing import Any

from aiohttp import web
from mjr_am_backend.shared import Result


async def autocomplete_assets(
    request: web.Request,
    *,
    check_rate_limit: Callable[..., tuple[bool, int | None]],
    require_services: Callable[[], Any],
    touch_enrichment_pause: Callable[..., Any],
    json_response: Callable[[Any], web.Response],
    max_requests: int,
    window_seconds: int,
) -> web.Response:
    prefix = (request.query.get("q") or "").strip()
    try:
        limit = int(request.query.get("limit", "10"))
    except Exception:
        limit = 10
    limit = max(1, min(50, limit))

    allowed, retry_after = check_rate_limit(
        request,
        "autocomplete",
        max_requests=max_requests,
        window_seconds=window_seconds,
    )
    if not allowed:
        return json_response(
            Result.Err(
                "RATE_LIMITED",
                "Rate limit exceeded. Please wait before retrying.",
                retry_after=retry_after,
            )
        )

    services, error = await require_services()
    if error:
        return json_response(error)
    touch_enrichment_pause(services, seconds=1.2)

    index_service = services["index"]
    if not hasattr(index_service, "searcher"):
        return json_response(Result.Err("INTERNAL_ERROR", "Search service unavailable"))

    result = await index_service.searcher.autocomplete(prefix, limit)
    return json_response(result)


async def get_assets_batch(
    request: web.Request,
    *,
    require_services: Callable[[], Any],
    read_json: Callable[[web.Request], Any],
    parse_asset_ids: Callable[[Any, int], Result],
    json_response: Callable[[Any], web.Response],
    search_max_batch_ids: int,
) -> web.Response:
    svc, error_result = await require_services()
    if error_result:
        return json_response(error_result)

    body_res = await read_json(request)
    if not body_res.ok:
        return json_response(body_res)
    body = body_res.data or {}

    raw_ids = body.get("asset_ids") or body.get("ids") or []
    parsed_ids = parse_asset_ids(raw_ids, search_max_batch_ids)
    if not parsed_ids.ok:
        return json_response(parsed_ids)
    ids = parsed_ids.data or []

    result = await svc["index"].get_assets_batch(ids)
    return json_response(result)


async def get_workflow_quick(
    request: web.Request,
    *,
    check_rate_limit: Callable[..., tuple[bool, int | None]],
    require_services: Callable[[], Any],
    workflow_quick_query_parts: Callable[[str, str, str, str], tuple[str, tuple[Any, ...]]],
    extract_workflow_from_metadata_raw: Callable[[Any, Any], Any],
    json_response: Callable[[Any], web.Response],
    safe_error_message: Callable[[BaseException, str], str],
    logger: Any,
) -> web.StreamResponse:
    allowed, retry_after = check_rate_limit(
        request,
        "workflow_quick",
        max_requests=60,
        window_seconds=60,
    )
    if not allowed:
        return json_response(Result.Err("RATE_LIMITED", "Rate limit exceeded", retry_after=retry_after))

    svc, error_result = await require_services()
    if error_result:
        return json_response(error_result)

    filename = request.query.get("filename", "").strip()
    if not filename:
        return json_response(Result.Err("INVALID_INPUT", "Missing filename"))

    subfolder = request.query.get("subfolder", "").strip()
    asset_type = request.query.get("type", "output").strip().lower()
    root_id = request.query.get("root_id", "").strip()

    try:
        where_clause, params = workflow_quick_query_parts(filename, subfolder, asset_type, root_id)
        result = await svc["index"].db.aquery(
            f"""
            SELECT m.metadata_raw, m.has_workflow
            FROM assets a
            LEFT JOIN asset_metadata m ON a.id = m.asset_id
            WHERE {where_clause}
            LIMIT 1
            """,
            params,
        )

        if result.ok and result.data and len(result.data) > 0:
            metadata_raw = result.data[0].get("metadata_raw")
            has_workflow = result.data[0].get("has_workflow")
            workflow = extract_workflow_from_metadata_raw(metadata_raw, has_workflow)
            if workflow:
                return web.json_response({"ok": True, "workflow": workflow})

        return web.json_response({"ok": True, "workflow": None})
    except Exception as exc:
        logger.error("workflow-quick lookup failed: %s", exc)
        return json_response(Result.Err("QUERY_ERROR", safe_error_message(exc, "Query failed")))


async def search_assets(
    request: web.Request,
    *,
    require_services: Callable[[], Any],
    touch_enrichment_pause: Callable[..., Any],
    check_rate_limit: Callable[..., tuple[bool, int | None]],
    parse_search_request_fn: Callable[..., Any],
    parse_inline_query_filters: Callable[..., Any],
    parse_request_filters: Callable[..., Any],
    normalize_sort_key: Callable[[Any], str],
    json_response: Callable[[Any], web.Response],
    dedupe_result_assets_payload: Callable[[dict[str, Any]], dict[str, Any]],
    max_list_limit: int,
    max_list_offset: int,
) -> web.Response:
    svc, error_result = await require_services()
    if error_result:
        return json_response(error_result)
    touch_enrichment_pause(svc, seconds=1.5)

    allowed, retry_after = check_rate_limit(
        request,
        "search_assets",
        max_requests=50,
        window_seconds=60,
    )
    if not allowed:
        return json_response(
            Result.Err(
                "RATE_LIMITED",
                "Rate limit exceeded. Please wait before retrying.",
                retry_after=retry_after,
            )
        )

    request_ctx_res = parse_search_request_fn(
        request.query,
        default_limit=50,
        default_offset=0,
        max_limit=max_list_limit,
        max_offset=max_list_offset,
        parse_inline_query_filters=parse_inline_query_filters,
        parse_request_filters=parse_request_filters,
        normalize_sort_key=normalize_sort_key,
        clamp_limit=False,
    )
    if not request_ctx_res.ok:
        return json_response(request_ctx_res)
    request_ctx = request_ctx_res.data
    query = request_ctx.query if request_ctx else "*"
    limit = request_ctx.limit if request_ctx else 50
    offset = request_ctx.offset if request_ctx else 0
    filters = request_ctx.filters if request_ctx else {}
    include_total = request_ctx.include_total if request_ctx else True

    result = await svc["index"].search(
        query,
        limit,
        offset,
        filters if filters else None,
        include_total=include_total,
    )
    if result.ok and isinstance(result.data, dict):
        result.data = dedupe_result_assets_payload(result.data)
    return json_response(result)


async def get_asset(
    request: web.Request,
    *,
    require_services: Callable[[], Any],
    json_response: Callable[[Any], web.Response],
    to_thread_timeout_s: int | float,
    write_asset_metadata_row: Callable[..., Any],
) -> web.Response:
    svc, error_result = await require_services()
    if error_result:
        return json_response(error_result)

    try:
        asset_id = int(request.match_info["asset_id"])
    except ValueError:
        return json_response(Result.Err("INVALID_INPUT", "Invalid asset_id"))

    hydrate = (request.query.get("hydrate") or "").strip().lower()

    result = await svc["index"].get_asset(asset_id)
    if not result.ok or not result.data:
        return json_response(result)

    if hydrate in ("rating_tags", "ratingtags", "rt"):
        try:
            current = result.data or {}
            rating = int(current.get("rating") or 0)
            tags = current.get("tags") or []
            tags_empty = True
            if isinstance(tags, list):
                tags_empty = len(tags) == 0
            elif isinstance(tags, str):
                tags_empty = tags.strip() in ("", "[]")

            if rating <= 0 or tags_empty:
                filepath = current.get("filepath")
                if isinstance(filepath, str) and filepath:
                    meta_svc = svc.get("metadata")
                    db = svc.get("db")
                    if meta_svc and db:
                        try:
                            meta_res = await asyncio.wait_for(
                                asyncio.to_thread(meta_svc.extract_rating_tags_only, filepath),
                                timeout=to_thread_timeout_s,
                            )
                        except asyncio.TimeoutError:
                            meta_res = Result.Err("TIMEOUT", "Rating/tags extraction timed out")
                        if meta_res and meta_res.ok and meta_res.data:
                            try:
                                await asyncio.wait_for(
                                    write_asset_metadata_row(
                                        db,
                                        asset_id,
                                        Result.Ok(
                                            {
                                                "rating": meta_res.data.get("rating"),
                                                "tags": meta_res.data.get("tags") or [],
                                                "quality": "partial",
                                            }
                                        ),
                                    ),
                                    timeout=to_thread_timeout_s,
                                )
                            except Exception:
                                pass
                            result = await svc["index"].get_asset(asset_id)
        except Exception:
            pass

    return json_response(result)
