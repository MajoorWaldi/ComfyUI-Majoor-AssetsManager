"""Output-scope listing helper extracted from ``listing_scopes``."""

from __future__ import annotations

from collections.abc import Callable
from pathlib import Path
from typing import Any

from aiohttp import web
from mjr_am_backend.shared import Result


def _extract_total(raw_total):
    total_known = raw_total is not None
    try:
        total = int(raw_total or 0) if total_known else None
    except Exception:
        total = None
        total_known = False
    return total, total_known

def _prepare_filesystem_response(
    fs_res, exclude_assets_under_root, dedupe_result_assets_payload, input_root
):
    if fs_res.ok and isinstance(fs_res.data, dict):
        filtered_assets = exclude_assets_under_root(fs_res.data.get("assets") or [], input_root)
        fs_res.data["assets"] = filtered_assets
        for asset in filtered_assets:
            if isinstance(asset, dict):
                asset["type"] = "output"
        fs_res.data["scope"] = "output"
        fs_res.data["mode"] = "filesystem"
        fs_res.data = dedupe_result_assets_payload(fs_res.data)
    return fs_res

def _finalize_response(
    out_res, exclude_assets_under_root, dedupe_result_assets_payload, input_root, sort_key
):
    filtered_assets = exclude_assets_under_root((out_res.data or {}).get("assets") or [], input_root)
    out_res.data["assets"] = filtered_assets
    for asset in filtered_assets:
        asset["type"] = "output"
    payload = dedupe_result_assets_payload({**out_res.data, "scope": "output", "sort": sort_key})
    return payload



async def handle_output_scope(
    *,
    query: str,
    limit: int,
    offset: int,
    sort_key: str,
    cursor: str = "",
    filters: dict[str, Any],
    include_total: bool,
    subfolder: str,
    require_services: Callable[[], Any],
    touch_enrichment_pause: Callable[..., Any],
    runtime_output_root: Callable[[Any], Any],
    get_input_directory: Callable[[], str],
    kickoff_background_scan: Callable[..., Any],
    list_filesystem_assets: Callable[..., Any],
    dedupe_result_assets_payload: Callable[[dict[str, Any]], dict[str, Any]],
    exclude_assets_under_root: Callable[[list[dict[str, Any]], str], list[dict[str, Any]]],
    json_response: Callable[[Any], web.Response],
) -> web.Response:
    svc, error_result = await require_services()
    if error_result:
        return json_response(error_result)
    touch_enrichment_pause(svc, seconds=1.5)

    output_root = await runtime_output_root(svc)
    input_root = str(Path(get_input_directory()).resolve(strict=False))
    output_filters = {
        **(filters or {}),
        "source": "output",
        "exclude_root": input_root,
    }
    if subfolder:
        output_filters["subfolder"] = subfolder

    search_kwargs = {
        "roots": [output_root],
        "limit": limit,
        "offset": offset,
        "filters": output_filters,
        "include_total": include_total,
        "sort": sort_key,
    }
    if cursor:
        search_kwargs["cursor"] = cursor
    out_res = await svc["index"].search_scoped(query, **search_kwargs)
    try:
        is_initial = query == "*" and offset == 0 and not (filters or None)
        out_data = out_res.data or {}
        assets = out_data.get("assets") or []
        raw_total = out_data.get("total")
        total, total_known = _extract_total(raw_total)

        if is_initial and out_res.ok and total_known and total == 0 and not assets:
            await kickoff_background_scan(
                str(Path(output_root)),
                source="output",
                recursive=False,
                incremental=True,
                fast=True,
                background_metadata=True,
            )
            fs_res = await list_filesystem_assets(
                Path(output_root),
                subfolder,
                query,
                limit,
                offset,
                asset_type="output",
                filters=filters or None,
                index_service=svc.get("index"),
                sort=sort_key,
            )
            fs_res = _prepare_filesystem_response(
                fs_res, exclude_assets_under_root, dedupe_result_assets_payload, input_root
            )
            return json_response(fs_res)
    except Exception:
        pass

    if not out_res.ok:
        return json_response(out_res)
    payload = _finalize_response(
        out_res, exclude_assets_under_root, dedupe_result_assets_payload, input_root, sort_key
    )
    return json_response(Result.Ok(payload))
