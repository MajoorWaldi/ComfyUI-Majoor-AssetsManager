"""Input-scope listing helper extracted from ``listing_scopes``."""

from __future__ import annotations

from collections.abc import Callable
from pathlib import Path
from typing import Any

from aiohttp import web
from mjr_am_backend.shared import Result
from .route_helpers import has_meaningful_filters


async def _attach_filesystem_folders(
    payload: dict[str, Any],
    *,
    root_dir: Path,
    subfolder: str,
    offset: int = 0,
    list_filesystem_folders: Callable[..., Any],
    show_folders: bool = True,
) -> dict[str, Any]:
    """List subdirectories under root_dir/subfolder and merge into assets.

    Folders are only attached on the first page (offset == 0) — subsequent
    pages skip them since the folders already appear at the top of the grid.
    The *show_folders* parameter only controls root-level folder-only mode;
    folders for navigation are always attached when inside a subfolder.
    """
    # Only show folders when the setting is enabled.  When disabled the
    # behaviour is the original flat index listing — no folder entries at all.
    # When enabled, folders are attached on every page (the frontend deduplicates
    # them so they appear only once at the top of the grid).
    if not show_folders:
        return payload
    try:
        folder_result = await list_filesystem_folders(
            root_dir, subfolder, asset_type="input"
        )
        if folder_result.ok and isinstance(folder_result.data, list):
            folders = folder_result.data
            assets = payload.get("assets") or []
            if not folders:
                return payload
            payload["assets"] = folders + assets
            existing_total = payload.get("total")
            if existing_total is not None:
                payload["total"] = int(existing_total) + len(folders)
    except Exception:
        pass
    return payload


async def _build_browse_response(
    *,
    root_dir: Path,
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
    """Return current-level folders + files (non-recursive), paginated together."""
    try:
        # Get ALL folders at current level
        folder_result = await list_filesystem_folders(
            root_dir, subfolder, asset_type="input"
        )
        all_folders: list[dict] = folder_result.data if (folder_result.ok and isinstance(folder_result.data, list)) else []
        folder_count = len(all_folders)

        # Paginate: folders first, adjust file offset by folder count
        file_offset = max(0, int(offset or 0) - folder_count)
        file_limit = int(limit or 200)

        page_folders = all_folders[offset:offset + file_limit] if offset < folder_count else []

        files_used = len(page_folders)
        remaining = file_limit - files_used

        page_files: list[dict] = []
        file_total = 0
        if remaining > 0:
            files_result = await list_filesystem_assets(
                root_dir, subfolder, query, remaining, file_offset,
                asset_type="input",
                filters=filters or None,
                index_service=index_service,
                sort=sort_key,
            )
            if files_result.ok and isinstance(files_result.data, dict):
                page_files = files_result.data.get("assets") or []
                file_total = int(files_result.data.get("total") or 0)

        # Don't return None even when the current page is empty — browse mode is
        # valid once folders were found; empty pages just mean we've scrolled past
        # the last item.
        hybrid = page_folders + page_files
        total = folder_count + file_total

        payload = {
            "assets": hybrid,
            "total": total,
            "limit": limit,
            "offset": offset,
            "query": query,
            "scope": "input",
        }
        return json_response(Result.Ok(payload))
    except Exception:
        return None


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
    list_filesystem_folders: Callable[..., Any],
    dedupe_result_assets_payload: Callable[[dict[str, Any]], dict[str, Any]],
    json_response: Callable[[Any], web.Response],
) -> web.Response:
    root_dir = Path(get_input_directory())
    svc, _ = await require_services()
    touch_enrichment_pause(svc, seconds=1.5)

    _show_folders = False
    try:
        _settings_svc = svc.get("settings") if isinstance(svc, dict) else None
        if _settings_svc is not None:
            _show_folders = await _settings_svc.get_browser_show_folders()
    except Exception:
        pass

    # ── Browse mode: show current-level folders + files (non-recursive) ────
    # When the folder setting is on and the user is browsing normally, use
    # the filesystem listing so each directory level shows only its own content.
    is_browse_mode = (
        _show_folders
        and query == "*"
        and not has_meaningful_filters(filters)
    )
    if is_browse_mode:
        browse_resp = await _build_browse_response(
            root_dir=root_dir,
            subfolder=subfolder,
            query=query,
            limit=limit,
            offset=offset,
            sort_key=sort_key,
            filters=filters,
            list_filesystem_assets=list_filesystem_assets,
            list_filesystem_folders=list_filesystem_folders,
            index_service=svc.get("index") if isinstance(svc, dict) else None,
            json_response=json_response,
        )
        if browse_resp is not None:
            # Index unindexed files so status dots resolve instead of staying
            # "pending" (blue) forever. Scan from the root (recursive when a
            # subfolder is open) so stored subfolder paths stay root-relative.
            if offset == 0:
                await kickoff_background_scan(
                    str(root_dir),
                    source="input",
                    recursive=bool(subfolder),
                    incremental=True,
                )
            return browse_resp

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
            db_result.data = await _attach_filesystem_folders(
                db_result.data,
                root_dir=root_dir,
                subfolder=subfolder,
                offset=offset,
                list_filesystem_folders=list_filesystem_folders,
                show_folders=_show_folders,
            )
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
        result.data = await _attach_filesystem_folders(
            result.data,
            root_dir=root_dir,
            subfolder=subfolder,
            offset=offset,
            list_filesystem_folders=list_filesystem_folders,
            show_folders=_show_folders,
        )
    return json_response(result)
