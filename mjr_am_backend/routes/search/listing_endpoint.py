"""Listing route entrypoint extracted from ``search_impl``."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from aiohttp import web

from . import listing_scopes as _scopes


async def list_assets(
    request: web.Request,
    *,
    check_rate_limit: Callable[..., tuple[bool, int | None]],
    parse_search_request_fn: Callable[..., Any],
    default_list_limit: int,
    default_list_offset: int,
    max_list_limit: int,
    max_list_offset: int,
    parse_inline_query_filters: Callable[..., Any],
    parse_request_filters: Callable[..., Any],
    normalize_sort_key: Callable[[Any], str],
    require_services: Callable[[], Any],
    touch_enrichment_pause: Callable[..., Any],
    get_input_directory: Callable[[], str],
    kickoff_background_scan: Callable[..., Any],
    list_filesystem_assets: Callable[..., Any],
    dedupe_result_assets_payload: Callable[[dict[str, Any]], dict[str, Any]],
    resolve_custom_root_fn: Callable[[str], Any],
    is_loopback_request: Callable[[web.Request], bool],
    browser_mode_needs_post_filters: Callable[[dict[str, Any] | None], bool],
    hydrate_browser_assets_from_db: Callable[[Any, list[dict[str, Any]]], Any],
    postfilter_browser_assets: Callable[..., tuple[list[dict[str, Any]], int]],
    runtime_output_root: Callable[[Any], Any],
    is_under_root: Callable[[str, str], bool],
    exclude_assets_under_root: Callable[[list[dict[str, Any]], str], list[dict[str, Any]]],
    json_response: Callable[[Any], web.Response],
    search_chunk_min: int,
    search_chunk_max: int,
    search_merge_trim_start: int,
    search_merge_trim_ratio: int,
    list_rate_limit_max_requests: int,
    list_rate_limit_window_seconds: int,
    logger: Any,
) -> web.Response:
    scope = (request.query.get("scope") or "output").strip().lower()

    allowed, retry_after = check_rate_limit(
        request,
        "list_assets",
        max_requests=list_rate_limit_max_requests,
        window_seconds=list_rate_limit_window_seconds,
    )
    if not allowed:
        from mjr_am_backend.shared import Result

        return json_response(
            Result.Err(
                "RATE_LIMITED",
                "Rate limit exceeded. Please wait before retrying.",
                retry_after=retry_after,
            )
        )

    request_ctx_res = parse_search_request_fn(
        request.query,
        default_limit=default_list_limit,
        default_offset=default_list_offset,
        max_limit=max_list_limit,
        max_offset=max_list_offset,
        parse_inline_query_filters=parse_inline_query_filters,
        parse_request_filters=parse_request_filters,
        normalize_sort_key=normalize_sort_key,
        clamp_limit=True,
    )
    if not request_ctx_res.ok:
        return json_response(request_ctx_res)

    request_ctx = request_ctx_res.data
    query = request_ctx.query if request_ctx else "*"
    limit = request_ctx.limit if request_ctx else default_list_limit
    offset = request_ctx.offset if request_ctx else default_list_offset
    sort_key = request_ctx.sort_key if request_ctx else normalize_sort_key(None)
    filters = request_ctx.filters if request_ctx else {}
    include_total = request_ctx.include_total if request_ctx else True
    subfolder = request.query.get("subfolder", "")
    cursor = (request.query.get("cursor") or "").strip()

    if scope == "input":
        return await _scopes.handle_input_scope(
            query=query,
            limit=limit,
            offset=offset,
            sort_key=sort_key,
            filters=filters,
            include_total=include_total,
            subfolder=subfolder,
            require_services=require_services,
            touch_enrichment_pause=touch_enrichment_pause,
            get_input_directory=get_input_directory,
            kickoff_background_scan=kickoff_background_scan,
            list_filesystem_assets=list_filesystem_assets,
            dedupe_result_assets_payload=dedupe_result_assets_payload,
            json_response=json_response,
        )

    if scope == "custom":
        root_id = request.query.get("custom_root_id", "") or request.query.get("root_id", "")
        return await _scopes.handle_custom_scope(
            request=request,
            query=query,
            limit=limit,
            offset=offset,
            sort_key=sort_key,
            filters=filters,
            subfolder=subfolder,
            root_id=str(root_id),
            require_services=require_services,
            touch_enrichment_pause=touch_enrichment_pause,
            resolve_custom_root_fn=resolve_custom_root_fn,
            is_loopback_request=is_loopback_request,
            browser_mode_needs_post_filters=browser_mode_needs_post_filters,
            hydrate_browser_assets_from_db=hydrate_browser_assets_from_db,
            postfilter_browser_assets=postfilter_browser_assets,
            kickoff_background_scan=kickoff_background_scan,
            list_filesystem_assets=list_filesystem_assets,
            dedupe_result_assets_payload=dedupe_result_assets_payload,
            json_response=json_response,
            logger=logger,
        )

    if scope == "all":
        return await _scopes.handle_all_scope(
            query=query,
            limit=limit,
            offset=offset,
            sort_key=sort_key,
            filters=filters,
            include_total=include_total,
            require_services=require_services,
            touch_enrichment_pause=touch_enrichment_pause,
            runtime_output_root=runtime_output_root,
            get_input_directory=get_input_directory,
            kickoff_background_scan=kickoff_background_scan,
            list_filesystem_assets=list_filesystem_assets,
            dedupe_result_assets_payload=dedupe_result_assets_payload,
            is_under_root=is_under_root,
            exclude_assets_under_root=exclude_assets_under_root,
            json_response=json_response,
            search_chunk_min=search_chunk_min,
            search_chunk_max=search_chunk_max,
            search_merge_trim_start=search_merge_trim_start,
            search_merge_trim_ratio=search_merge_trim_ratio,
        )

    if scope not in ("output", "outputs"):
        from mjr_am_backend.shared import Result

        return json_response(Result.Err("INVALID_INPUT", f"Unknown scope: {scope}"))

    return await _scopes.handle_output_scope(
        query=query,
        limit=limit,
        offset=offset,
        cursor=cursor,
        sort_key=sort_key,
        filters=filters,
        include_total=include_total,
        subfolder=subfolder,
        require_services=require_services,
        touch_enrichment_pause=touch_enrichment_pause,
        runtime_output_root=runtime_output_root,
        get_input_directory=get_input_directory,
        kickoff_background_scan=kickoff_background_scan,
        list_filesystem_assets=list_filesystem_assets,
        dedupe_result_assets_payload=dedupe_result_assets_payload,
        exclude_assets_under_root=exclude_assets_under_root,
        json_response=json_response,
    )
