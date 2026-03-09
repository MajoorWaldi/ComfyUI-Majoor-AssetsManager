"""
Search and list endpoints.
"""
import asyncio
import datetime
import json
import os
import re
from pathlib import Path
from typing import Any

from aiohttp import web

try:
    import folder_paths  # type: ignore
except Exception:
    class _FolderPathsStub:
        @staticmethod
        def get_input_directory() -> str:
            return str((Path(__file__).resolve().parents[3] / "input").resolve())

    folder_paths = _FolderPathsStub()  # type: ignore

from mjr_am_backend.config import OUTPUT_ROOT, TO_THREAD_TIMEOUT_S
from mjr_am_backend.custom_roots import resolve_custom_root
from mjr_am_backend.features.index.metadata_helpers import MetadataHelpers
from mjr_am_backend.shared import Result, get_logger

from ..core import _is_loopback_request, _json_response, _read_json, _require_services, safe_error_message
from ..core.security import _check_rate_limit
# MED-004: Query sanitization pipeline.
# - DB-backed endpoints (list, search) always go through _parse_request_filters()
#   (via _qs.parse_request_filters) which validates kind, rating, date-range, etc.
# - _parse_filesystem_listing_filters is only used in _postfilter_browser_assets()
#   for the browser_mode fallback that operates on raw filesystem entries.
from .filesystem import (
    _kickoff_background_scan,
    _list_filesystem_assets,
    _paginate_filesystem_listing_entries,
    _parse_filesystem_listing_filters,
)

DEFAULT_LIST_LIMIT = 50
DEFAULT_LIST_OFFSET = 0
MAX_LIST_LIMIT = 5000
MAX_LIST_OFFSET = 100_000  # Fix M-8: 1M offset causes DB to scan/skip millions of rows; cap at 100k
MAX_RATING = 5
VALID_KIND_FILTERS = {"image", "video", "audio", "model3d"}
VALID_SORT_KEYS = {"mtime_desc", "mtime_asc", "name_asc", "name_desc", "rating_desc", "size_desc", "size_asc", "none"}

LIST_RATE_LIMIT_MAX_REQUESTS = 50
LIST_RATE_LIMIT_WINDOW_SECONDS = 60

SEARCH_CHUNK_MIN = 50
SEARCH_CHUNK_MAX = 500
SEARCH_MERGE_TRIM_START = 256
SEARCH_MERGE_TRIM_RATIO = 2
SEARCH_MAX_BATCH_IDS = 200
AUTOCOMPLETE_RATE_LIMIT_MAX_REQUESTS = 40
AUTOCOMPLETE_RATE_LIMIT_WINDOW_SECONDS = 60

logger = get_logger(__name__)


# P2-E-01..03 delegation to extracted modules.
from ..search import query_sanitizer as _qs
from ..search import result_filter as _rf
from ..search import result_hydrator as _rh

_asset_dedupe_key = _rh.dedupe_key
_dedupe_assets_by_filepath = _rh.dedupe_by_filepath
_dedupe_result_assets_payload = _rh.dedupe_result_payload
_norm_fp = _rh.norm_filepath
_is_folder_asset = _rh.is_folder_asset
_collect_hydration_filepaths = _rh.collect_hydration_paths
_query_browser_asset_rows = _rh.query_browser_rows
_index_rows_by_filepath = _rh.index_rows_by_filepath
_coerce_browser_tags = _rh.coerce_browser_tags
_hydrate_browser_asset_from_row = _rh.hydrate_asset_from_row
_apply_browser_hydration_rows = _rh.apply_hydration_rows
_search_db_from_services = _rf.search_db_from_services
_hydrate_browser_assets_from_db = lambda svc, assets: _rh.hydrate_assets(svc, assets, _search_db_from_services)
_touch_enrichment_pause = _rf.touch_enrichment_pause
_is_under_root = _rf.is_under_root
_exclude_assets_under_root = _rf.exclude_under_root
_runtime_output_root = _rf.runtime_output_root

_reference_as_utc = _qs.reference_as_utc
_date_bounds_for_range = _qs.date_bounds_for_range
_date_bounds_for_exact = _qs.date_bounds_for_exact
_normalize_extension = _qs.normalize_extension
_parse_inline_query_filters = _qs.parse_inline_filters
_parse_request_filters = _qs.parse_request_filters
_consume_inline_filter_token = _qs.consume_filter_token
_consume_inline_extension = _qs.consume_extension
_consume_inline_kind = _qs.consume_kind
_consume_inline_rating = _qs.consume_rating
_normalize_sort_key = _qs.normalize_sort_key


def _parse_asset_ids(raw_ids: object, max_ids: int) -> Result[list[int]]:
    if not isinstance(raw_ids, list):
        return Result.Err("INVALID_INPUT", "asset_ids must be a list")
    ids: list[int] = []
    for raw in raw_ids:
        try:
            n = int(raw)
        except Exception:
            continue
        if n <= 0:
            continue
        ids.append(n)
        if len(ids) >= max_ids:
            break
    return Result.Ok(ids)


def _workflow_quick_query_parts(
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


def _extract_workflow_from_metadata_raw(metadata_raw: object, has_workflow: object) -> object | None:
    if not metadata_raw or not (has_workflow or has_workflow is None):
        return None
    try:
        metadata = json.loads(metadata_raw) if isinstance(metadata_raw, str) else metadata_raw
    except Exception:
        return None
    if not isinstance(metadata, dict):
        return None
    return metadata.get("workflow")


def _browser_mode_needs_post_filters(filters: dict[str, Any] | None) -> bool:
    if not filters:
        return False
    return any(
        key in filters
        for key in (
            "extensions",
            "tags",
            "min_rating",
            "has_workflow",
            "workflow_type",
            "mtime_start",
            "mtime_end",
        )
    )


def _postfilter_browser_assets(
    assets: list[dict[str, Any]],
    *,
    query: str,
    filters: dict[str, Any] | None,
    sort_key: str,
    limit: int,
    offset: int,
) -> tuple[list[dict[str, Any]], int]:
    opts = _parse_filesystem_listing_filters(query, filters, sort_key)
    return _paginate_filesystem_listing_entries(
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


def register_search_routes(routes: web.RouteTableDef) -> None:
    """Register listing/search routes."""
    @routes.get("/mjr/am/autocomplete")
    async def autocomplete_assets(request):
        """
        Autocomplete tags/terms.

        Query params:
          q: prefix to complete
          limit: max results (default 10)
        """
        prefix = (request.query.get("q") or "").strip()
        try:
            limit = int(request.query.get("limit", "10"))
        except Exception:
            limit = 10
        limit = max(1, min(50, limit))

        allowed, retry_after = _check_rate_limit(
            request,
            "autocomplete",
            max_requests=AUTOCOMPLETE_RATE_LIMIT_MAX_REQUESTS,
            window_seconds=AUTOCOMPLETE_RATE_LIMIT_WINDOW_SECONDS,
        )
        if not allowed:
            return _json_response(
                Result.Err(
                    "RATE_LIMITED",
                    "Rate limit exceeded. Please wait before retrying.",
                    retry_after=retry_after,
                )
            )

        services, error = await _require_services()
        if error:
             return _json_response(error)
        _touch_enrichment_pause(services, seconds=1.2)

        # services["index"] is user's IndexService instance
        # IndexService exposes .searcher as a public attribute
        index_service = services["index"]
        if not hasattr(index_service, "searcher"):
             return _json_response(Result.Err("INTERNAL_ERROR", "Search service unavailable"))

        result = await index_service.searcher.autocomplete(prefix, limit)
        return _json_response(result)

    @routes.get("/mjr/am/list")
    async def list_assets(request):
        """
        List assets for a given UI scope.

        Query params:
          scope: output|input|all|custom  (default: output)
          q: search query (default: '*')
          limit: number of items (default: 50)
          offset: pagination offset (default: 0)
          subfolder: for input/custom browsing (default: '')
          custom_root_id: required when scope=custom
        """
        scope = (request.query.get("scope") or "output").strip().lower()
        raw_query = (request.query.get("q") or "").strip()
        parsed_query, inline_filters = _parse_inline_query_filters(raw_query)
        query = parsed_query or "*"

        allowed, retry_after = _check_rate_limit(
            request,
            "list_assets",
            max_requests=LIST_RATE_LIMIT_MAX_REQUESTS,
            window_seconds=LIST_RATE_LIMIT_WINDOW_SECONDS,
        )
        if not allowed:
            return _json_response(Result.Err("RATE_LIMITED", "Rate limit exceeded. Please wait before retrying.", retry_after=retry_after))

        MAX_OFFSET = MAX_LIST_OFFSET
        try:
            limit = int(request.query.get("limit", str(DEFAULT_LIST_LIMIT)))
            offset = int(request.query.get("offset", str(DEFAULT_LIST_OFFSET)))
        except ValueError:
            return _json_response(Result.Err("INVALID_INPUT", "Invalid limit or offset"))

        limit = max(0, min(MAX_LIST_LIMIT, limit))
        offset = max(0, min(MAX_OFFSET, offset))
        sort_key = _normalize_sort_key(request.query.get("sort"))

        filters_res = _parse_request_filters(request.query, inline_filters)
        if not filters_res.ok:
            return _json_response(filters_res)
        filters = filters_res.data or {}

        # Keep default aligned with pre-refactor behavior:
        # list endpoints should include total unless explicitly disabled.
        include_total = request.query.get("include_total", "1").strip().lower() not in ("0", "false", "no", "off")

        if scope == "input":
            subfolder = request.query.get("subfolder", "")
            root_dir = Path(folder_paths.get_input_directory())
            svc, _ = await _require_services()
            _touch_enrichment_pause(svc, seconds=1.5)

            # If index service is available, try DB-first approach
            if svc and svc.get("index"):
                # Normalize root path for DB lookup
                root_path = str(root_dir.resolve(strict=False))
                scoped_filters = dict(filters or {})
                scoped_filters["source"] = "input"
                # Only apply subfolder filter when an explicit non-empty value is provided,
                # matching the behavior of the output scope (same as calendar.py).
                if subfolder:
                    scoped_filters["subfolder"] = str(subfolder)

                # Call index searcher with filters, limit, and offset
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
                    # Add type to results for consistency
                    for a in db_result.data.get("assets") or []:
                        a["type"] = "input"

                    # Add scope info to response
                    db_result.data["scope"] = "input"

                    db_result.data = _dedupe_result_assets_payload(db_result.data)
                    return _json_response(db_result)

            # Fallback to filesystem if DB approach fails or is unavailable
            if query == "*" and offset == 0 and not filters:
                # Avoid scanning entire input trees just by opening the tab; only scan the current folder.
                await _kickoff_background_scan(str(root_dir), source="input", recursive=False, incremental=True)
            result = await _list_filesystem_assets(
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
                result.data = _dedupe_result_assets_payload(result.data)
            return _json_response(result)

        if scope == "custom":
            from mjr_am_backend.features.browser import (
                list_filesystem_browser_entries,
                list_visible_subfolders,
            )
            subfolder = request.query.get("subfolder", "")
            root_id = request.query.get("custom_root_id", "") or request.query.get("root_id", "")
            browser_mode = str(request.query.get("browser_mode", "") or "").strip().lower() in {"1", "true", "yes", "on"}
            if not str(root_id or "").strip():
                if not browser_mode:
                    return _json_response(Result.Err("INVALID_INPUT", "Missing custom_root_id"))
                if not _is_loopback_request(request):
                    return _json_response(Result.Err("FORBIDDEN", "Custom browser mode is loopback-only"))
                svc, _ = await _require_services()
                needs_post_filters = _browser_mode_needs_post_filters(filters or None)
                browser_limit = 0 if needs_post_filters else limit
                browser_offset = 0 if needs_post_filters else offset
                browser_result = await asyncio.to_thread(
                    list_filesystem_browser_entries,
                    subfolder,
                    query,
                    browser_limit,
                    browser_offset,
                    kind_filter=str(filters.get("kind") or "") if filters else "",
                    min_size_bytes=int((filters or {}).get("min_size_bytes") or 0),
                    max_size_bytes=int((filters or {}).get("max_size_bytes") or 0),
                    min_width=int((filters or {}).get("min_width") or 0),
                    min_height=int((filters or {}).get("min_height") or 0),
                    max_width=int((filters or {}).get("max_width") or 0),
                    max_height=int((filters or {}).get("max_height") or 0),
                )
                try:
                    if browser_result.ok and isinstance(browser_result.data, dict):
                        assets = browser_result.data.get("assets") or []
                        hydrated_assets = await _hydrate_browser_assets_from_db(svc, assets)
                        if needs_post_filters:
                            paged_assets, total = _postfilter_browser_assets(
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
                        browser_result.data = _dedupe_result_assets_payload(browser_result.data)
                except Exception as _e:
                    logger.debug("Failed to hydrate browser assets from DB: %s", _e)
                    if needs_post_filters and browser_result.ok and isinstance(browser_result.data, dict):
                        raw_assets = browser_result.data.get("assets") or []
                        paged_assets, total = _postfilter_browser_assets(
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
                return _json_response(browser_result)
            root_result = resolve_custom_root(str(root_id or ""))
            if not root_result.ok:
                return _json_response(root_result)
            root_dir = root_result.data
            svc, _ = await _require_services()
            _touch_enrichment_pause(svc, seconds=1.5)

            # Fallback to filesystem if DB approach fails or is unavailable
            if query == "*" and offset == 0 and not filters:
                # Avoid scanning entire custom trees just by opening the tab; only scan the current folder.
                await _kickoff_background_scan(str(root_dir), source="custom", root_id=str(root_id), recursive=False, incremental=True)
            result = await _list_filesystem_assets(
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
            )
            if result.ok and isinstance(result.data, dict):
                result.data = _dedupe_result_assets_payload(result.data)
                folder_result = list_visible_subfolders(root_dir, subfolder, str(root_id or ""))
                if not folder_result.ok:
                    return _json_response(folder_result)
                folder_assets = folder_result.data or []
                if query not in ("", "*"):
                    ql = query.lower()
                    folder_assets = [f for f in folder_assets if ql in str(f.get("filename") or "").lower()]
                if filters and filters.get("kind"):
                    folder_assets = []
                file_assets = result.data.get("assets") or []
                hybrid_assets = folder_assets + file_assets if offset == 0 else file_assets
                result.data["assets"] = hybrid_assets
                try:
                    base_total = int(result.data.get("total") or 0)
                except Exception:
                    base_total = len(file_assets)
                result.data["total"] = base_total + (len(folder_assets) if offset == 0 else 0)
                result.data["scope"] = "custom"
            return _json_response(result)

        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)
        _touch_enrichment_pause(svc, seconds=1.5)

        output_root = await _runtime_output_root(svc)
        input_root = str(Path(folder_paths.get_input_directory()).resolve(strict=False))

        if scope == "all":
            # Prefer a single DB query when Inputs have been indexed (fast LIMIT/OFFSET, avoids O(offset) merges).
            # Fallback to the legacy Output(DB)+Input(filesystem) behavior until the Input root is present in DB.
            input_indexed = False
            try:
                has_input = await svc["index"].has_assets_under_root(input_root)
                if has_input.ok:
                    input_indexed = bool(has_input.data)
            except Exception:
                input_indexed = False

            if not input_indexed and query == "*" and offset == 0 and not filters:
                # Opportunistically index the input root so `scope=all` can become DB-only on later requests.
                await _kickoff_background_scan(str(Path(input_root)), source="input", recursive=False, incremental=True)

            if input_indexed:
                scoped = await svc["index"].search_scoped(
                    query,
                    roots=[output_root, input_root],
                    limit=limit,
                    offset=offset,
                    filters=filters or None,
                    include_total=include_total,
                    sort=sort_key,
                )
                if not scoped.ok:
                    return _json_response(scoped)
                data = scoped.data or {}
                assets = data.get("assets") or []

                for a in assets:
                    src = str((a or {}).get("source") or "").strip().lower()
                    if src in ("input", "output", "custom"):
                        a["type"] = src
                    else:
                        fp = str((a or {}).get("filepath") or "")
                        if fp and _is_under_root(input_root, fp):
                            a["type"] = "input"
                        else:
                            a["type"] = "output"

                payload = _dedupe_result_assets_payload(
                    {
                        "assets": assets,
                        "total": int(data.get("total") or 0),
                        "limit": limit,
                        "offset": offset,
                        "query": query,
                        "scope": scope,
                        "sort": sort_key,
                    }
                )
                return _json_response(Result.Ok(payload))

            if not limit:
                # Keep behavior predictable when limit==0: return empty page but valid total.
                out_count = await svc["index"].search_scoped(
                    query,
                    roots=[output_root],
                    limit=0,
                    offset=0,
                    filters={**(filters or {}), "source": "output"},
                    include_total=True,
                    sort=sort_key,
                )
                if not out_count.ok:
                    return _json_response(out_count)
                in_count = await _list_filesystem_assets(Path(input_root), "", query, 0, 0, asset_type="input", filters=filters or None, sort=sort_key)
                if not in_count.ok:
                    return _json_response(in_count)
                total = int((out_count.data or {}).get("total") or 0) + int((in_count.data or {}).get("total") or 0)
                return _json_response(Result.Ok({"assets": [], "total": total, "limit": 0, "offset": offset, "query": query, "scope": scope, "sort": sort_key}))

            # Fallback mode (input not indexed):
            # Merge output(DB) + input(filesystem) in global sort order for stable pagination.
            chunk = max(SEARCH_CHUNK_MIN, min(SEARCH_CHUNK_MAX, int(limit) * 2))
            out_offset = 0
            in_offset = 0
            out_buf = []
            in_buf = []
            out_i = 0
            in_i = 0
            out_total = None
            in_total = None

            def _mtime(item) -> int:
                try:
                    return int((item or {}).get("mtime") or 0)
                except Exception:
                    return 0

            def _name(item) -> str:
                try:
                    return str((item or {}).get("filename") or "").lower()
                except Exception:
                    return ""

            def _path(item) -> str:
                try:
                    return str((item or {}).get("filepath") or "").lower()
                except Exception:
                    return ""

            def _asset_key(item):
                if sort_key == "name_asc":
                    return (_name(item), _path(item))
                if sort_key == "name_desc":
                    return (_name(item), _path(item))
                if sort_key == "mtime_asc":
                    return (_mtime(item), _path(item))
                # mtime_desc (default)
                return (_mtime(item), _path(item))

            def _pick_output_item(out_item, in_item) -> bool:
                out_key = _asset_key(out_item)
                in_key = _asset_key(in_item)
                if sort_key == "name_desc":
                    return out_key >= in_key
                if sort_key == "mtime_desc":
                    return out_key >= in_key
                return out_key <= in_key

            async def _fill_out():
                nonlocal out_total, out_offset
                if out_total is not None and out_offset >= out_total:
                    return
                res = await svc["index"].search_scoped(
                    query,
                    roots=[output_root],
                    limit=chunk,
                    offset=out_offset,
                    filters={**(filters or {}), "source": "output"},
                    include_total=True,
                    sort=sort_key,
                )
                if not res.ok:
                    return res
                data = res.data or {}
                incoming_total = data.get("total")
                if incoming_total is not None:
                    out_total = int(incoming_total or 0)
                items = data.get("assets") or []
                for a in items:
                    a["type"] = "output"
                out_offset += len(items)
                out_buf.extend(items)
                return None

            async def _fill_in():
                nonlocal in_total, in_offset
                if in_total is not None and in_offset >= in_total:
                    return
                res = await _list_filesystem_assets(
                    Path(input_root),
                    "",
                    query,
                    chunk,
                    in_offset,
                    asset_type="input",
                    filters=filters or None,
                    sort=sort_key,
                )
                if not res.ok:
                    return res
                data = res.data or {}
                in_total = int(data.get("total") or 0)
                items = data.get("assets") or []
                in_offset += len(items)
                in_buf.extend(items)
                return None

            # Prime buffers (and totals)
            err = await _fill_out()
            if err:
                return _json_response(err)
            err = await _fill_in()
            if err:
                return _json_response(err)

            total = int(out_total or 0) + int(in_total or 0)
            target = offset + limit
            produced = 0
            page = []

            while produced < target:
                if out_i >= len(out_buf) and (out_total is None or out_offset < out_total):
                    err = await _fill_out()
                    if err:
                        return _json_response(err)
                if in_i >= len(in_buf) and (in_total is None or in_offset < in_total):
                    err = await _fill_in()
                    if err:
                        return _json_response(err)

                if out_i >= len(out_buf) and in_i >= len(in_buf):
                    break

                pick_out = False
                out_has = out_i < len(out_buf)
                in_has = in_i < len(in_buf)
                if out_has and in_has:
                    pick_out = _pick_output_item(out_buf[out_i], in_buf[in_i])
                elif out_has:
                    pick_out = True

                if pick_out:
                    item = out_buf[out_i]
                    out_i += 1
                else:
                    item = in_buf[in_i]
                    in_i += 1

                # Periodically truncate consumed prefixes to keep buffers small.
                if out_i > SEARCH_MERGE_TRIM_START and out_i >= len(out_buf) // SEARCH_MERGE_TRIM_RATIO:
                    out_buf = out_buf[out_i:]
                    out_i = 0
                if in_i > SEARCH_MERGE_TRIM_START and in_i >= len(in_buf) // SEARCH_MERGE_TRIM_RATIO:
                    in_buf = in_buf[in_i:]
                    in_i = 0

                if produced >= offset:
                    page.append(item)
                    if len(page) >= limit:
                        break
                produced += 1

            payload = _dedupe_result_assets_payload({"assets": page, "total": total, "limit": limit, "offset": offset, "query": query, "scope": scope, "sort": sort_key})
            return _json_response(Result.Ok(payload))

        if scope not in ("output", "outputs"):
            return _json_response(Result.Err("INVALID_INPUT", f"Unknown scope: {scope}"))

        # Use DB search for output scope
        raw_subfolder = request.query.get("subfolder")
        subfolder = str(raw_subfolder or "")
        output_filters = {
            **(filters or {}),
            "source": "output",
            "exclude_root": input_root,
        }
        # Keep output scope recursive by default.
        # Only apply a subfolder filter when an explicit non-empty value is provided.
        if subfolder:
            output_filters["subfolder"] = subfolder
        out_res = await svc["index"].search_scoped(
            query,
            roots=[output_root],
            limit=limit,
            offset=offset,
            filters=output_filters,
            include_total=include_total,
            sort=sort_key,
        )
        # If nothing is indexed yet, fall back to a fast filesystem listing so the grid can populate
        # immediately (old behavior), and kick off a fast background scan to build the DB.
        try:
            is_initial = query == "*" and offset == 0 and not (filters or None)
            total = int((out_res.data or {}).get("total") or 0) if out_res.ok else 0
            if is_initial and out_res.ok and total == 0:
                await _kickoff_background_scan(
                    str(Path(output_root)),
                    source="output",
                    recursive=False,
                    incremental=True,
                    fast=True,
                    background_metadata=True,
                )
                fs_res = await _list_filesystem_assets(
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
                if fs_res.ok and isinstance(fs_res.data, dict):
                    filtered_assets = _exclude_assets_under_root(fs_res.data.get("assets") or [], input_root)
                    fs_res.data["assets"] = filtered_assets
                    for a in filtered_assets:
                        if isinstance(a, dict):
                            a["type"] = "output"
                    fs_res.data["scope"] = "output"
                    fs_res.data["mode"] = "filesystem"
                    fs_res.data = _dedupe_result_assets_payload(fs_res.data)
                return _json_response(fs_res)
        except Exception:
            pass

        if not out_res.ok:
            return _json_response(out_res)
        filtered_assets = _exclude_assets_under_root((out_res.data or {}).get("assets") or [], input_root)
        out_res.data["assets"] = filtered_assets
        for a in filtered_assets:
            a["type"] = "output"
        payload = _dedupe_result_assets_payload({**out_res.data, "scope": "output", "sort": sort_key})
        return _json_response(Result.Ok(payload))

    @routes.get("/mjr/am/search")
    async def search_assets(request):
        """
        Search assets using FTS5.

        Query params:
            q: Search query
            limit: Max results (default: 50)
            offset: Pagination offset (default: 0)
            kind: Filter by file kind (image, video, audio, model3d)
            min_rating: Filter by minimum rating (0-5)
            has_workflow: Filter by workflow presence (true/false)
        """
        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)
        _touch_enrichment_pause(svc, seconds=1.5)

        raw_query = request.query.get("q", "").strip()
        parsed_query, inline_filters = _parse_inline_query_filters(raw_query)
        query = parsed_query or "*"

        allowed, retry_after = _check_rate_limit(request, "search_assets", max_requests=50, window_seconds=60)
        if not allowed:
            return _json_response(Result.Err("RATE_LIMITED", "Rate limit exceeded. Please wait before retrying.", retry_after=retry_after))

        # Parse pagination

        MAX_OFFSET = MAX_LIST_OFFSET
        try:
            limit = int(request.query.get("limit", "50"))
            offset = int(request.query.get("offset", "0"))
        except ValueError:
            result = Result.Err("INVALID_INPUT", "Invalid limit or offset")
            return _json_response(result)

        if limit < 0 or limit > MAX_LIST_LIMIT:
            result = Result.Err("INVALID_INPUT", f"limit must be between 0 and {MAX_LIST_LIMIT}")
            return _json_response(result)
        if offset < 0 or offset > MAX_OFFSET:
            result = Result.Err("INVALID_INPUT", f"offset must be between 0 and {MAX_OFFSET}")
            return _json_response(result)

        filters_res = _parse_request_filters(request.query, inline_filters)
        if not filters_res.ok:
            return _json_response(filters_res)
        filters = filters_res.data or {}

        include_total = request.query.get("include_total", "1").strip().lower() not in ("0", "false", "no", "off")
        result = await svc["index"].search(
            query,
            limit,
            offset,
            filters if filters else None,
            include_total=include_total,
        )
        if result.ok and isinstance(result.data, dict):
            result.data = _dedupe_result_assets_payload(result.data)
        return _json_response(result)

    @routes.post("/mjr/am/assets/batch")
    async def get_assets_batch(request):
        """
        Batch fetch assets by ID.

        JSON body:
            asset_ids: [1, 2, 3, ...]
        """
        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)

        body_res = await _read_json(request)
        if not body_res.ok:
            return _json_response(body_res)
        body = body_res.data or {}

        raw_ids = body.get("asset_ids") or body.get("ids") or []
        parsed_ids = _parse_asset_ids(raw_ids, SEARCH_MAX_BATCH_IDS)
        if not parsed_ids.ok:
            return _json_response(parsed_ids)
        ids = parsed_ids.data or []

        result = await svc["index"].get_assets_batch(ids)
        return _json_response(result)

    @routes.get("/mjr/am/workflow-quick")
    async def get_workflow_quick(request):
        """
        Ultra-fast workflow-only lookup (no self-heal, no metadata extraction).

        Query params:
            filename: Asset filename
            subfolder: Optional subfolder
            type: Asset type (output, input, custom)
            root_id: Optional custom root ID

        Returns just the workflow JSON if available, or null.
        Designed for drag & drop operations where speed is critical.
        """
        # Rate limit to prevent DB spam
        allowed, retry_after = _check_rate_limit(request, "workflow_quick", max_requests=60, window_seconds=60)
        if not allowed:
            return _json_response(Result.Err("RATE_LIMITED", "Rate limit exceeded", retry_after=retry_after))

        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)

        filename = request.query.get("filename", "").strip()
        if not filename:
            return _json_response(Result.Err("INVALID_INPUT", "Missing filename"))

        subfolder = request.query.get("subfolder", "").strip()
        asset_type = request.query.get("type", "output").strip().lower()
        root_id = request.query.get("root_id", "").strip()

        try:
            where_clause, params = _workflow_quick_query_parts(filename, subfolder, asset_type, root_id)

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
                workflow = _extract_workflow_from_metadata_raw(metadata_raw, has_workflow)
                if workflow:
                    return web.json_response({"ok": True, "workflow": workflow})

            return web.json_response({"ok": True, "workflow": None})

        except Exception as e:
            logger.error(f"workflow-quick lookup failed: {e}")
            return _json_response(Result.Err("QUERY_ERROR", safe_error_message(e, "Query failed")))

    @routes.get("/mjr/am/asset/{asset_id}")
    async def get_asset(request):
        """
        Get a single asset by ID.

        Path params:
            asset_id: Asset database ID
        """
        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)

        try:
            asset_id = int(request.match_info["asset_id"])
        except ValueError:
            result = Result.Err("INVALID_INPUT", "Invalid asset_id")
            return _json_response(result)

        hydrate = (request.query.get("hydrate") or "").strip().lower()

        result = await svc["index"].get_asset(asset_id)
        if not result.ok or not result.data:
            return _json_response(result)

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

                # Only hydrate when DB doesn't have values yet.
                if rating <= 0 or tags_empty:
                    fp = current.get("filepath")
                    if isinstance(fp, str) and fp:
                        meta_svc = svc.get("metadata")
                        db = svc.get("db")
                        if meta_svc and db:
                            try:
                                meta_res = await asyncio.wait_for(asyncio.to_thread(meta_svc.extract_rating_tags_only, fp), timeout=TO_THREAD_TIMEOUT_S)
                            except asyncio.TimeoutError:
                                meta_res = Result.Err("TIMEOUT", "Rating/tags extraction timed out")
                            if meta_res and meta_res.ok and meta_res.data:
                                try:
                                    await asyncio.wait_for(
                                        MetadataHelpers.write_asset_metadata_row(
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
                                        timeout=TO_THREAD_TIMEOUT_S,
                                    )
                                except Exception:
                                    pass
                                # Re-fetch after best-effort update.
                                result = await svc["index"].get_asset(asset_id)
            except Exception:
                pass

        return _json_response(result)
