"""Helper functions extracted from ``search_impl``."""

from __future__ import annotations

import json
from collections.abc import Callable
from typing import Any

from mjr_am_backend.shared import Result


def parse_asset_ids(raw_ids: object, max_ids: int) -> Result[list[int]]:
    if not isinstance(raw_ids, list):
        return Result.Err("INVALID_INPUT", "asset_ids must be a list")
    ids: list[int] = []
    for raw in raw_ids:
        try:
            value = int(raw)
        except Exception:
            continue
        if value <= 0:
            continue
        ids.append(value)
        if len(ids) >= max_ids:
            break
    return Result.Ok(ids)


def workflow_quick_query_parts(
    filename: str,
    subfolder: str,
    asset_type: str,
    root_id: str,
) -> tuple[str, tuple[object, ...]]:
    where_parts = ["a.filename = ?", "a.subfolder = ?", "a.source = ?"]
    params: list[object] = [filename, subfolder, asset_type]
    if root_id:
        where_parts.append("a.root_id = ?")
        params.append(root_id)
    return " AND ".join(where_parts), tuple(params)


def extract_workflow_from_metadata_raw(metadata_raw: object, has_workflow: object) -> object | None:
    if not metadata_raw or not (has_workflow or has_workflow is None):
        return None
    try:
        metadata = json.loads(metadata_raw) if isinstance(metadata_raw, str) else metadata_raw
    except Exception:
        return None
    if not isinstance(metadata, dict):
        return None
    return metadata.get("workflow")


def browser_mode_needs_post_filters(filters: dict[str, Any] | None) -> bool:
    return has_meaningful_filters(filters)


def has_meaningful_filters(filters: dict[str, Any] | None) -> bool:
    if not filters:
        return False
    min_rating = filters.get("min_rating")
    try:
        has_min_rating = min_rating is not None and int(min_rating or 0) > 0
    except Exception:
        has_min_rating = False
    if has_min_rating:
        return True
    return any(
        key in filters
        for key in (
            "extensions",
            "tags",
            "has_workflow",
            "workflow_type",
            "mtime_start",
            "mtime_end",
        )
    )


def postfilter_browser_assets(
    assets: list[dict[str, Any]],
    *,
    query: str,
    filters: dict[str, Any] | None,
    sort_key: str,
    limit: int,
    offset: int,
    parse_filesystem_listing_filters: Callable[[str, dict[str, Any] | None, str], dict[str, Any]],
    paginate_filesystem_listing_entries: Callable[..., tuple[list[dict[str, Any]], int]],
) -> tuple[list[dict[str, Any]], int]:
    opts = parse_filesystem_listing_filters(query, filters, sort_key)
    return paginate_filesystem_listing_entries(
        assets,
        filter_extensions=list(opts.get("filter_extensions") or []),
        filter_tags=list(opts.get("filter_tags") or []),
        filter_kind=str(opts.get("filter_kind") or ""),
        filter_min_rating=int(opts.get("filter_min_rating") or 0),
        filter_workflow_only=opts.get("filter_workflow_only"),
        filter_workflow_type=str(opts.get("filter_workflow_type") or ""),
        filter_mtime_start=opts.get("filter_mtime_start"),
        filter_mtime_end=opts.get("filter_mtime_end"),
        browse_all=bool(opts.get("browse_all")),
        q_lower=str(opts.get("q_lower") or ""),
        limit=limit,
        offset=offset,
    )
