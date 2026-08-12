"""Output-scope listing helper extracted from ``listing_scopes``."""

from __future__ import annotations

from collections.abc import Callable
from pathlib import Path
from typing import Any

from aiohttp import web
from mjr_am_backend.shared import Result

from .route_helpers import has_meaningful_filters


def _merge_folders_into_assets(
    assets: list[dict[str, Any]],
    folders: list[dict[str, Any]],
    total: int | None,
) -> tuple[list[dict[str, Any]], int | None]:
    """Prepend folder entries into the assets list and adjust total."""
    if not folders:
        return assets, total
    merged = folders + assets
    if total is not None:
        total = total + len(folders)
    return merged, total


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



async def _attach_filesystem_folders(
    payload: dict[str, Any],
    *,
    output_root: Any,
    subfolder: str,
    offset: int = 0,
    list_filesystem_folders: Callable[..., Any],
    show_folders: bool = True,
) -> dict[str, Any]:
    """List subdirectories under output_root/subfolder and merge into assets.

    Folders are only attached on the first page (offset == 0) — subsequent
    pages skip them since the folders already appear at the top of the grid.
    The *show_folders* parameter only controls the root-level folder-only
    mode; folders for navigation are always attached when the user is inside
    a subfolder.
    """
    # Only show folders when the setting is enabled.  When disabled the
    # behaviour is the original flat index listing — no folder entries at all.
    # When enabled, folders are attached on every page (the frontend deduplicates
    # them so they appear only once at the top of the grid).
    if not show_folders:
        return payload
    try:
        root_path = Path(output_root) if isinstance(output_root, (Path, str)) else None
        if root_path is None:
            return payload
        folder_result = await list_filesystem_folders(
            root_path, subfolder, asset_type="output"
        )
        if folder_result.ok and isinstance(folder_result.data, list):
            folders = folder_result.data
            assets = payload.get("assets") or []
            merged, _ = _merge_folders_into_assets(assets, folders, None)
            payload["assets"] = merged
            existing_total = payload.get("total")
            if existing_total is not None:
                payload["total"] = int(existing_total) + len(folders)
    except Exception:
        pass
    return payload


async def _build_browse_response(
    *,
    output_root: Any,
    subfolder: str,
    query: str,
    limit: int,
    offset: int,
    sort_key: str,
    filters: dict[str, Any] | None,
    list_filesystem_assets: Callable[..., Any],
    list_filesystem_folders: Callable[..., Any],
    index_service: Any,
    json_response: Callable[[Any], web.Response],
) -> web.Response | None:
    """Return current-level folders + files (non-recursive).

    Uses filesystem listing instead of the recursive index search so the
    user sees only items at the current directory level — like a file browser.
    Folders are only included on the first page (offset == 0); subsequent pages
    skip them since they already appear at the top of the grid.
    Returns None if the directory is empty, so the caller can fall through to
    the normal recursive search.
    """
    try:
        root_path = Path(output_root) if isinstance(output_root, (Path, str)) else None
        if root_path is None:
            return None

        # Get ALL folders at current level (usually few)
        folder_result = await list_filesystem_folders(
            root_path, subfolder, asset_type="output"
        )
        all_folders: list[dict] = folder_result.data if (folder_result.ok and isinstance(folder_result.data, list)) else []

        # Sort folders by mtime to match the requested sort order.
        # ".." (parent navigation) always stays at the top.
        parent_entry = None
        regular_folders = []
        for f in all_folders:
            if f.get("filename") == "..":
                parent_entry = f
            else:
                regular_folders.append(f)
        reverse = sort_key != "mtime_asc"
        regular_folders.sort(
            key=lambda x: int(x.get("mtime") or 0) if x.get("mtime") is not None else 0,
            reverse=reverse,
        )
        all_folders = ([parent_entry] if parent_entry else []) + regular_folders

        folder_count = len(all_folders)

        # Paginate: folders first, then files.  Adjust file offset by folder count
        # so the combined list scrolls naturally.
        file_offset = max(0, int(offset or 0) - folder_count)
        file_limit = int(limit or 200)

        # Folders slice for this page
        page_folders = all_folders[offset:offset + file_limit] if offset < folder_count else []

        # Files fill the remaining space
        files_used = len(page_folders)
        remaining = file_limit - files_used

        files: list[dict] = []
        file_total = 0
        if remaining > 0:
            files_result = await list_filesystem_assets(
                root_path, subfolder, query, remaining, file_offset,
                asset_type="output",
                filters=filters or None,
                index_service=index_service,
                sort=sort_key,
            )
            if files_result.ok and isinstance(files_result.data, dict):
                files = files_result.data.get("assets") or []
                file_total = int(files_result.data.get("total") or 0)

        # Browse mode is valid once folders are found — even on subsequent pages
        # (offset beyond folder count, no files at this level) return an empty
        # page instead of falling through to the recursive index search.
        hybrid = page_folders + files
        total = folder_count + file_total
        payload = {
            "assets": hybrid,
            "total": total,
            "limit": limit,
            "offset": offset,
            "query": query,
            "scope": "output",
            "mode": "filesystem",
        }
        return json_response(Result.Ok(payload))
    except Exception:
        return None


async def _maybe_fallback_to_filesystem(
    *,
    out_res: Result[Any],
    query: str,
    offset: int,
    filters: dict[str, Any],
    output_root: Any,
    subfolder: str,
    limit: int,
    sort_key: str,
    svc: Any,
    show_folders: bool,
    input_root: str,
    kickoff_background_scan: Callable[..., Any],
    list_filesystem_assets: Callable[..., Any],
    list_filesystem_folders: Callable[..., Any],
    exclude_assets_under_root: Callable[[list[dict[str, Any]], str], list[dict[str, Any]]],
    dedupe_result_assets_payload: Callable[[dict[str, Any]], dict[str, Any]],
    json_response: Callable[[Any], web.Response],
):
    """Return a filesystem-based response when the index is initially empty."""
    try:
        is_initial = query == "*" and offset == 0 and not has_meaningful_filters(filters)
        out_data = out_res.data or {}
        assets = out_data.get("assets") or []
        raw_total = out_data.get("total")
        total, total_known = _extract_total(raw_total)
        if not (is_initial and out_res.ok and total_known and total == 0 and not assets):
            return None
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
        if fs_res.ok and isinstance(fs_res.data, dict):
            fs_res.data = await _attach_filesystem_folders(
                fs_res.data,
                output_root=output_root,
                subfolder=subfolder,
                offset=offset,
                list_filesystem_folders=list_filesystem_folders,
                show_folders=show_folders,
            )
        return json_response(fs_res)
    except Exception:
        return None


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
    list_filesystem_folders: Callable[..., Any],
    dedupe_result_assets_payload: Callable[[dict[str, Any]], dict[str, Any]],
    exclude_assets_under_root: Callable[[list[dict[str, Any]], str], list[dict[str, Any]]],
    json_response: Callable[[Any], web.Response],
) -> web.Response:
    svc, error_result = await require_services()
    if error_result:
        return json_response(error_result)
    touch_enrichment_pause(svc, seconds=1.5)

    _show_folders = False
    try:
        _settings_svc = svc.get("settings") if isinstance(svc, dict) else None
        if _settings_svc is not None:
            _show_folders = await _settings_svc.get_browser_show_folders()
    except Exception:
        pass

    output_root = await runtime_output_root(svc)
    input_root = str(Path(get_input_directory()).resolve(strict=False))

    # ── Browse mode: show current-level folders + files (non-recursive) ────
    # When the folder setting is on and the user is browsing normally (no
    # search query, no meaningful filters), use the filesystem listing so
    # each directory level shows only its own content — like a file explorer.
    # This applies to both root and subfolder levels.
    is_browse_mode = (
        _show_folders
        and query == "*"
        and not has_meaningful_filters(filters)
    )
    if is_browse_mode:
        browse_resp = await _build_browse_response(
            output_root=output_root,
            subfolder=subfolder,
            query=query,
            limit=limit,
            offset=offset,
            sort_key=sort_key,
            filters=filters,
            list_filesystem_assets=list_filesystem_assets,
            list_filesystem_folders=list_filesystem_folders,
            index_service=svc.get("index"),
            json_response=json_response,
        )
        if browse_resp is not None:
            # Index unindexed files so status dots resolve instead of staying
            # "pending" (blue) forever. Scan from the root (recursive when a
            # subfolder is open) so stored subfolder paths stay root-relative.
            if offset == 0:
                await kickoff_background_scan(
                    str(Path(output_root)),
                    source="output",
                    recursive=bool(subfolder),
                    incremental=True,
                    fast=True,
                    background_metadata=True,
                )
            return browse_resp

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
    fallback = await _maybe_fallback_to_filesystem(
        out_res=out_res,
        query=query,
        offset=offset,
        filters=filters,
        output_root=output_root,
        subfolder=subfolder,
        limit=limit,
        sort_key=sort_key,
        svc=svc,
        show_folders=_show_folders,
        input_root=input_root,
        kickoff_background_scan=kickoff_background_scan,
        list_filesystem_assets=list_filesystem_assets,
        list_filesystem_folders=list_filesystem_folders,
        exclude_assets_under_root=exclude_assets_under_root,
        dedupe_result_assets_payload=dedupe_result_assets_payload,
        json_response=json_response,
    )
    if fallback is not None:
        return fallback

    if not out_res.ok:
        return json_response(out_res)
    payload = _finalize_response(
        out_res, exclude_assets_under_root, dedupe_result_assets_payload, input_root, sort_key
    )
    payload = await _attach_filesystem_folders(
        payload,
        output_root=output_root,
        subfolder=subfolder,
        offset=offset,
        list_filesystem_folders=list_filesystem_folders,
        show_folders=_show_folders,
    )
    return json_response(Result.Ok(payload))
