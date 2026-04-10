"""
Search and list endpoints.
"""
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

from mjr_am_backend.config import TO_THREAD_TIMEOUT_S
from mjr_am_backend.custom_roots import resolve_custom_root
from mjr_am_backend.features.index.metadata_helpers import MetadataHelpers
from mjr_am_backend.features.search import parse_search_request
from mjr_am_backend.shared import get_logger

from ..core import (
    _is_loopback_request,
    _json_response,
    _read_json,
    _require_services,
    safe_error_message,
)
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

# Aligned with frontend DEFAULT_PAGE_SIZE for optimal batch loading
DEFAULT_LIST_LIMIT = 200
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


def _safe_error_message_for_base_exception(exc: BaseException, fallback: str) -> str:
    if isinstance(exc, Exception):
        return safe_error_message(exc, fallback)
    return fallback


# P2-E-01..03 delegation to extracted modules.
from ..search import listing_endpoint as _listing_endpoint  # noqa: E402
from ..search import query_sanitizer as _qs  # noqa: E402
from ..search import result_filter as _rf  # noqa: E402
from ..search import result_hydrator as _rh  # noqa: E402
from ..search import route_endpoints as _route_endpoints  # noqa: E402
from ..search import route_helpers as _route_helpers  # noqa: E402

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
_parse_asset_ids = _route_helpers.parse_asset_ids
_workflow_quick_query_parts = _route_helpers.workflow_quick_query_parts
_extract_workflow_from_metadata_raw = _route_helpers.extract_workflow_from_metadata_raw
_browser_mode_needs_post_filters = _route_helpers.browser_mode_needs_post_filters
asyncio = _route_endpoints.asyncio


async def _hydrate_browser_assets_from_db(svc: Any, assets: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return await _rh.hydrate_assets(svc, assets, _search_db_from_services)


def _postfilter_browser_assets(
    assets: list[dict[str, Any]],
    *,
    query: str,
    filters: dict[str, Any] | None,
    sort_key: str,
    limit: int,
    offset: int,
) -> tuple[list[dict[str, Any]], int]:
    return _route_helpers.postfilter_browser_assets(
        assets,
        query=query,
        filters=filters,
        sort_key=sort_key,
        limit=limit,
        offset=offset,
        parse_filesystem_listing_filters=_parse_filesystem_listing_filters,
        paginate_filesystem_listing_entries=_paginate_filesystem_listing_entries,
    )


async def autocomplete_assets(request: web.Request) -> web.Response:
    return await _route_endpoints.autocomplete_assets(
        request,
        check_rate_limit=_check_rate_limit,
        require_services=_require_services,
        touch_enrichment_pause=_touch_enrichment_pause,
        json_response=_json_response,
        max_requests=AUTOCOMPLETE_RATE_LIMIT_MAX_REQUESTS,
        window_seconds=AUTOCOMPLETE_RATE_LIMIT_WINDOW_SECONDS,
    )


async def get_assets_batch(request: web.Request) -> web.Response:
    return await _route_endpoints.get_assets_batch(
        request,
        require_services=_require_services,
        read_json=_read_json,
        parse_asset_ids=_parse_asset_ids,
        json_response=_json_response,
        search_max_batch_ids=SEARCH_MAX_BATCH_IDS,
    )


async def get_workflow_quick(request: web.Request) -> web.StreamResponse:
    return await _route_endpoints.get_workflow_quick(
        request,
        check_rate_limit=_check_rate_limit,
        require_services=_require_services,
        workflow_quick_query_parts=_workflow_quick_query_parts,
        extract_workflow_from_metadata_raw=_extract_workflow_from_metadata_raw,
        json_response=_json_response,
        safe_error_message=_safe_error_message_for_base_exception,
        logger=logger,
    )


async def list_assets(request: web.Request) -> web.Response:
    return await _listing_endpoint.list_assets(
        request,
        check_rate_limit=_check_rate_limit,
        parse_search_request_fn=parse_search_request,
        default_list_limit=DEFAULT_LIST_LIMIT,
        default_list_offset=DEFAULT_LIST_OFFSET,
        max_list_limit=MAX_LIST_LIMIT,
        max_list_offset=MAX_LIST_OFFSET,
        parse_inline_query_filters=_parse_inline_query_filters,
        parse_request_filters=_parse_request_filters,
        normalize_sort_key=_normalize_sort_key,
        require_services=_require_services,
        touch_enrichment_pause=_touch_enrichment_pause,
        get_input_directory=folder_paths.get_input_directory,
        kickoff_background_scan=_kickoff_background_scan,
        list_filesystem_assets=_list_filesystem_assets,
        dedupe_result_assets_payload=_dedupe_result_assets_payload,
        resolve_custom_root_fn=resolve_custom_root,
        is_loopback_request=_is_loopback_request,
        browser_mode_needs_post_filters=_browser_mode_needs_post_filters,
        hydrate_browser_assets_from_db=_hydrate_browser_assets_from_db,
        postfilter_browser_assets=_postfilter_browser_assets,
        runtime_output_root=_runtime_output_root,
        is_under_root=_is_under_root,
        exclude_assets_under_root=_exclude_assets_under_root,
        json_response=_json_response,
        search_chunk_min=SEARCH_CHUNK_MIN,
        search_chunk_max=SEARCH_CHUNK_MAX,
        search_merge_trim_start=SEARCH_MERGE_TRIM_START,
        search_merge_trim_ratio=SEARCH_MERGE_TRIM_RATIO,
        list_rate_limit_max_requests=LIST_RATE_LIMIT_MAX_REQUESTS,
        list_rate_limit_window_seconds=LIST_RATE_LIMIT_WINDOW_SECONDS,
        logger=logger,
    )


async def search_assets(request: web.Request) -> web.Response:
    return await _route_endpoints.search_assets(
        request,
        require_services=_require_services,
        touch_enrichment_pause=_touch_enrichment_pause,
        check_rate_limit=_check_rate_limit,
        parse_search_request_fn=parse_search_request,
        parse_inline_query_filters=_parse_inline_query_filters,
        parse_request_filters=_parse_request_filters,
        normalize_sort_key=_normalize_sort_key,
        json_response=_json_response,
        dedupe_result_assets_payload=_dedupe_result_assets_payload,
        max_list_limit=MAX_LIST_LIMIT,
        max_list_offset=MAX_LIST_OFFSET,
    )


async def get_asset(request: web.Request) -> web.Response:
    return await _route_endpoints.get_asset(
        request,
        require_services=_require_services,
        json_response=_json_response,
        to_thread_timeout_s=TO_THREAD_TIMEOUT_S,
        write_asset_metadata_row=MetadataHelpers.write_asset_metadata_row,
    )


def register_search_routes(routes: web.RouteTableDef) -> None:
    """Register listing/search routes."""
    routes.get("/mjr/am/autocomplete")(autocomplete_assets)
    routes.get("/mjr/am/list")(list_assets)
    routes.get("/mjr/am/search")(search_assets)
    routes.post("/mjr/am/assets/batch")(get_assets_batch)
    routes.get("/mjr/am/workflow-quick")(get_workflow_quick)
    routes.get("/mjr/am/asset/{asset_id}")(get_asset)
