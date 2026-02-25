"""
Runtime helper functions for index persistence accounting and enrichment.
"""
from pathlib import Path
from typing import Any

from ...shared import Result, get_logger
from .entry_builder import entry_display_path, fallback_correct_error
from .metadata_helpers import MetadataHelpers
from .scan_batch_utils import file_state_drifted

logger = get_logger(__name__)


async def maybe_store_entry_cache(scanner: Any, *, entry: dict[str, Any], metadata_result: Result[Any]) -> None:
    if not bool(entry.get("cache_store")):
        return
    try:
        await MetadataHelpers.store_metadata_cache(
            scanner.db,
            entry.get("filepath") or "",
            entry.get("state_hash") or "",
            metadata_result,
        )
    except Exception:
        return


def record_refresh_outcome(
    scanner: Any,
    *,
    stats: dict[str, Any],
    fallback_mode: bool,
    refreshed: bool,
    entry: dict[str, Any],
    to_enrich: list[str] | None,
    respect_enrich_limit: bool,
) -> None:
    stats["skipped"] += 1
    if fallback_mode:
        fallback_correct_error(stats)
    if refreshed:
        scanner._append_to_enrich(
            entry=entry,
            to_enrich=to_enrich,
            respect_limit=respect_enrich_limit,
        )


def record_index_entry_success(
    scanner: Any,
    *,
    stats: dict[str, Any],
    fallback_mode: bool,
    added_ids: list[int] | None,
    added_asset_id: int | None,
    entry: dict[str, Any],
    action: str,
    to_enrich: list[str] | None,
    respect_enrich_limit: bool,
) -> None:
    stats[action] += 1
    if fallback_mode:
        fallback_correct_error(stats)
    elif added_ids is not None and added_asset_id:
        try:
            added_ids.append(int(added_asset_id))
        except Exception:
            pass
    scanner._append_to_enrich(entry=entry, to_enrich=to_enrich, respect_limit=respect_enrich_limit)
    try:
        logger.debug(
            "Indexed file (%s%s): %s [asset_id=%s]",
            action,
            "/fallback" if fallback_mode else "",
            entry.get("filepath") or "",
            added_asset_id,
        )
    except Exception:
        pass


def entry_state_drifted(scanner: Any, *, entry: dict[str, Any], stats: dict[str, Any]) -> bool:
    file_path_value = entry.get("file_path")
    if not isinstance(file_path_value, Path):
        return False
    expected_mtime_ns = int(entry.get("mtime_ns") or 0)
    expected_size = int(entry.get("size") or 0)
    if not file_state_drifted(file_path_value, expected_mtime_ns, expected_size):
        return False
    stats["skipped"] += 1
    stats["skipped_state_changed"] = int(stats.get("skipped_state_changed") or 0) + 1
    return True


def append_to_enrich(scanner: Any, *, entry: dict[str, Any], to_enrich: list[str] | None, respect_limit: bool) -> None:
    if to_enrich is None or not entry.get("fast"):
        return
    max_items = int(getattr(scanner, "_max_to_enrich_items", 0) or 0)
    if respect_limit and max_items > 0 and len(to_enrich) >= max_items:
        return
    to_enrich.append(entry_display_path(entry))
