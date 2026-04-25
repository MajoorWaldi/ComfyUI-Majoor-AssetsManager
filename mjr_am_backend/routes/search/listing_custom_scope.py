"""Custom-scope listing helper extracted from ``listing_scopes``."""

from __future__ import annotations

import asyncio
import os
from collections.abc import Callable
from typing import Any

from aiohttp import web
from mjr_am_backend.shared import Result

# Maximum wall-clock duration (seconds) for a single custom-root filesystem
# listing.  A custom root pointing to an unresponsive network share or to a
# folder with millions of entries can otherwise pin a request worker
# indefinitely.  Override via ``MJR_CUSTOM_LIST_TIMEOUT`` for slow drives.
try:
    _CUSTOM_LIST_TIMEOUT = float(os.environ.get("MJR_CUSTOM_LIST_TIMEOUT", "20.0"))
except Exception:
    _CUSTOM_LIST_TIMEOUT = 20.0
if _CUSTOM_LIST_TIMEOUT < 1.0:
    _CUSTOM_LIST_TIMEOUT = 1.0


def _is_browser_mode(request: web.Request) -> bool:
    return str(request.query.get("browser_mode", "") or "").strip().lower() in {"1", "true", "yes", "on"}


def _browser_filter_value(filters: dict[str, Any] | None, key: str) -> int:
    return int((filters or {}).get(key) or 0)


async def _load_browser_entries(
    *,
    svc: dict[str, Any],
    subfolder: str,
    query: str,
    limit: int,
    offset: int,
    sort_key: str,
    filters: dict[str, Any],
    browser_mode_needs_post_filters: Callable[[dict[str, Any] | None], bool],
    hydrate_browser_assets_from_db: Callable[[Any, list[dict[str, Any]]], Any],
    postfilter_browser_assets: Callable[..., tuple[list[dict[str, Any]], int]],
    dedupe_result_assets_payload: Callable[[dict[str, Any]], dict[str, Any]],
    list_filesystem_browser_entries: Callable[..., Any],
    logger: Any,
) -> Result[Any]:
    needs_post_filters = browser_mode_needs_post_filters(filters or None)
    browser_limit = 0 if needs_post_filters else limit
    browser_offset = 0 if needs_post_filters else offset
    browser_result = await asyncio.to_thread(
        list_filesystem_browser_entries,
        subfolder,
        query,
        browser_limit,
        browser_offset,
        kind_filter=str(filters.get("kind") or "") if filters else "",
        min_size_bytes=_browser_filter_value(filters, "min_size_bytes"),
        max_size_bytes=_browser_filter_value(filters, "max_size_bytes"),
        min_width=_browser_filter_value(filters, "min_width"),
        min_height=_browser_filter_value(filters, "min_height"),
        max_width=_browser_filter_value(filters, "max_width"),
        max_height=_browser_filter_value(filters, "max_height"),
    )
    if not browser_result.ok or not isinstance(browser_result.data, dict):
        return browser_result

    try:
        assets = browser_result.data.get("assets") or []
        hydrated_assets = await hydrate_browser_assets_from_db(svc, assets)
        if needs_post_filters:
            paged_assets, total = postfilter_browser_assets(
                hydrated_assets,
                query=query,
                filters=filters or None,
                sort_key=sort_key,
                limit=limit,
                offset=offset,
            )
            browser_result.data["assets"] = paged_assets
            browser_result.data["total"] = total
            browser_result.data["limit"] = limit
            browser_result.data["offset"] = offset
            browser_result.data["query"] = query
        else:
            browser_result.data["assets"] = hydrated_assets
        browser_result.data = dedupe_result_assets_payload(browser_result.data)
        return browser_result
    except Exception as exc:
        logger.debug("Failed to hydrate browser assets from DB: %s", exc)
        raw_assets = browser_result.data.get("assets") or []
        paged_assets, total = postfilter_browser_assets(
            raw_assets,
            query=query,
            filters=filters or None,
            sort_key=sort_key,
            limit=limit,
            offset=offset,
        )
        browser_result.data["assets"] = paged_assets
        browser_result.data["total"] = total
        browser_result.data["limit"] = limit
        browser_result.data["offset"] = offset
        return browser_result


async def _handle_browser_scope_without_root(
    *,
    request: web.Request,
    query: str,
    limit: int,
    offset: int,
    sort_key: str,
    filters: dict[str, Any],
    subfolder: str,
    require_services: Callable[[], Any],
    is_loopback_request: Callable[[web.Request], bool],
    browser_mode_needs_post_filters: Callable[[dict[str, Any] | None], bool],
    hydrate_browser_assets_from_db: Callable[[Any, list[dict[str, Any]]], Any],
    postfilter_browser_assets: Callable[..., tuple[list[dict[str, Any]], int]],
    dedupe_result_assets_payload: Callable[[dict[str, Any]], dict[str, Any]],
    list_filesystem_browser_entries: Callable[..., Any],
    logger: Any,
) -> Result[Any]:
    if not is_loopback_request(request):
        return Result.Err("FORBIDDEN", "Custom browser mode is loopback-only")
    svc, _ = await require_services()
    return await _load_browser_entries(
        svc=svc,
        subfolder=subfolder,
        query=query,
        limit=limit,
        offset=offset,
        sort_key=sort_key,
        filters=filters,
        browser_mode_needs_post_filters=browser_mode_needs_post_filters,
        hydrate_browser_assets_from_db=hydrate_browser_assets_from_db,
        postfilter_browser_assets=postfilter_browser_assets,
        dedupe_result_assets_payload=dedupe_result_assets_payload,
        list_filesystem_browser_entries=list_filesystem_browser_entries,
        logger=logger,
    )


def _filter_folder_assets(folder_assets: list[dict[str, Any]], *, query: str, filters: dict[str, Any]) -> list[dict[str, Any]]:
    filtered_assets = folder_assets
    if query not in ("", "*"):
        query_lower = query.lower()
        filtered_assets = [item for item in filtered_assets if query_lower in str(item.get("filename") or "").lower()]
    if filters and filters.get("kind"):
        return []
    return filtered_assets


def _merge_custom_scope_assets(
    result: Result[Any],
    *,
    folder_assets: list[dict[str, Any]],
    offset: int,
) -> Result[Any]:
    if not result.ok or not isinstance(result.data, dict):
        return result
    file_assets = result.data.get("assets") or []
    hybrid_assets = folder_assets + file_assets if offset == 0 else file_assets
    result.data["assets"] = hybrid_assets
    try:
        base_total = int(result.data.get("total") or 0)
    except Exception:
        base_total = len(file_assets)
    result.data["total"] = base_total + (len(folder_assets) if offset == 0 else 0)
    result.data["scope"] = "custom"
    return result


async def _handle_custom_root_listing(
    *,
    query: str,
    limit: int,
    offset: int,
    sort_key: str,
    filters: dict[str, Any],
    subfolder: str,
    root_id: str,
    require_services: Callable[[], Any],
    touch_enrichment_pause: Callable[..., Any],
    resolve_custom_root_fn: Callable[[str], Any],
    kickoff_background_scan: Callable[..., Any],
    list_filesystem_assets: Callable[..., Any],
    dedupe_result_assets_payload: Callable[[dict[str, Any]], dict[str, Any]],
    list_visible_subfolders: Callable[..., Any],
) -> Result[Any]:
    root_result = resolve_custom_root_fn(str(root_id or ""))
    if not root_result.ok:
        return root_result
    root_dir = root_result.data
    svc, _ = await require_services()
    touch_enrichment_pause(svc, seconds=1.5)

    if query == "*" and offset == 0 and not filters:
        await kickoff_background_scan(
            str(root_dir),
            source="custom",
            root_id=str(root_id),
            recursive=False,
            incremental=True,
        )

    # Bound the synchronous filesystem walk: a custom root pointing at a slow
    # network mount or a directory with millions of entries can pin the
    # request worker for minutes.  Cap at _CUSTOM_LIST_TIMEOUT seconds and
    # surface a TIMEOUT result so the panel can render an empty grid + retry
    # button instead of stalling.
    try:
        result = await asyncio.wait_for(
            list_filesystem_assets(
                root_dir,
                subfolder,
                query,
                limit,
                offset,
                asset_type="custom",
                root_id=str(root_id),
                filters=filters or None,
                index_service=(svc or {}).get("index") if isinstance(svc, dict) else None,
                sort=sort_key,
            ),
            timeout=_CUSTOM_LIST_TIMEOUT,
        )
    except asyncio.TimeoutError:
        return Result.Err(
            "TIMEOUT",
            f"Custom root listing exceeded {_CUSTOM_LIST_TIMEOUT:.0f}s",
        )
    if not result.ok or not isinstance(result.data, dict):
        return result

    result.data = dedupe_result_assets_payload(result.data)
    folder_result = list_visible_subfolders(root_dir, subfolder, str(root_id or ""))
    if not folder_result.ok:
        return folder_result
    folder_assets = _filter_folder_assets(folder_result.data or [], query=query, filters=filters)
    return _merge_custom_scope_assets(result, folder_assets=folder_assets, offset=offset)


async def handle_custom_scope(
    *,
    request: web.Request,
    query: str,
    limit: int,
    offset: int,
    sort_key: str,
    filters: dict[str, Any],
    subfolder: str,
    root_id: str,
    require_services: Callable[[], Any],
    touch_enrichment_pause: Callable[..., Any],
    resolve_custom_root_fn: Callable[[str], Any],
    is_loopback_request: Callable[[web.Request], bool],
    browser_mode_needs_post_filters: Callable[[dict[str, Any] | None], bool],
    hydrate_browser_assets_from_db: Callable[[Any, list[dict[str, Any]]], Any],
    postfilter_browser_assets: Callable[..., tuple[list[dict[str, Any]], int]],
    kickoff_background_scan: Callable[..., Any],
    list_filesystem_assets: Callable[..., Any],
    dedupe_result_assets_payload: Callable[[dict[str, Any]], dict[str, Any]],
    json_response: Callable[[Any], web.Response],
    logger: Any,
) -> web.Response:
    from mjr_am_backend.features.browser import (
        list_filesystem_browser_entries,
        list_visible_subfolders,
    )

    browser_mode = _is_browser_mode(request)
    if not str(root_id or "").strip():
        if not browser_mode:
            return json_response(Result.Err("INVALID_INPUT", "Missing custom_root_id"))
        browser_result = await _handle_browser_scope_without_root(
            request=request,
            query=query,
            limit=limit,
            offset=offset,
            sort_key=sort_key,
            filters=filters,
            subfolder=subfolder,
            require_services=require_services,
            is_loopback_request=is_loopback_request,
            browser_mode_needs_post_filters=browser_mode_needs_post_filters,
            hydrate_browser_assets_from_db=hydrate_browser_assets_from_db,
            postfilter_browser_assets=postfilter_browser_assets,
            dedupe_result_assets_payload=dedupe_result_assets_payload,
            list_filesystem_browser_entries=list_filesystem_browser_entries,
            logger=logger,
        )
        return json_response(browser_result)

    result = await _handle_custom_root_listing(
        query=query,
        limit=limit,
        offset=offset,
        sort_key=sort_key,
        filters=filters,
        subfolder=subfolder,
        root_id=root_id,
        require_services=require_services,
        touch_enrichment_pause=touch_enrichment_pause,
        resolve_custom_root_fn=resolve_custom_root_fn,
        kickoff_background_scan=kickoff_background_scan,
        list_filesystem_assets=list_filesystem_assets,
        dedupe_result_assets_payload=dedupe_result_assets_payload,
        list_visible_subfolders=list_visible_subfolders,
    )
    return json_response(result)
