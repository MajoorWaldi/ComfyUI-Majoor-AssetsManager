"""Input-scope listing helper extracted from ``listing_scopes``."""

from __future__ import annotations

from collections.abc import Callable
from pathlib import Path
from typing import Any

from aiohttp import web


async def handle_input_scope(
    *,
    query: str,
    limit: int,
    offset: int,
    sort_key: str,
    filters: dict[str, Any],
    include_total: bool,
    subfolder: str,
    require_services: Callable[[], Any],
    touch_enrichment_pause: Callable[..., Any],
    get_input_directory: Callable[[], str],
    kickoff_background_scan: Callable[..., Any],
    list_filesystem_assets: Callable[..., Any],
    dedupe_result_assets_payload: Callable[[dict[str, Any]], dict[str, Any]],
    json_response: Callable[[Any], web.Response],
) -> web.Response:
    root_dir = Path(get_input_directory())
    svc, _ = await require_services()
    touch_enrichment_pause(svc, seconds=1.5)

    if svc and svc.get("index"):
        root_path = str(root_dir.resolve(strict=False))
        scoped_filters = dict(filters or {})
        scoped_filters["source"] = "input"
        if subfolder:
            scoped_filters["subfolder"] = str(subfolder)

        db_result = await svc["index"].search_scoped(
            query,
            roots=[root_path],
            limit=limit,
            offset=offset,
            filters=scoped_filters,
            include_total=include_total,
            sort=sort_key,
        )

        if db_result.ok:
            for asset in db_result.data.get("assets") or []:
                asset["type"] = "input"
            db_result.data["scope"] = "input"
            db_result.data = dedupe_result_assets_payload(db_result.data)
            return json_response(db_result)

    if query == "*" and offset == 0 and not filters:
        await kickoff_background_scan(
            str(root_dir),
            source="input",
            recursive=False,
            incremental=True,
        )
    result = await list_filesystem_assets(
        root_dir,
        subfolder,
        query,
        limit,
        offset,
        asset_type="input",
        filters=filters or None,
        index_service=(svc or {}).get("index") if isinstance(svc, dict) else None,
        sort=sort_key,
    )
    if result.ok and isinstance(result.data, dict):
        result.data = dedupe_result_assets_payload(result.data)
    return json_response(result)
