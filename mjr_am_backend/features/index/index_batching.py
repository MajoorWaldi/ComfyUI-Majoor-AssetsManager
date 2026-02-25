"""
Index batch preparation helpers extracted from scanner.py.
"""
import asyncio
import logging
import time
from datetime import datetime
from pathlib import Path
from typing import Any

from ...config import IS_WINDOWS
from ...shared import Result, classify_file, get_logger
from .entry_builder import (
    asset_ids_from_existing_rows,
    batch_stat_to_values,
    build_cached_refresh_entry,
    build_fast_batch_entry,
    extract_existing_asset_state,
    safe_relative_path,
)
from .metadata_helpers import MetadataHelpers
from .scan_batch_utils import (
    chunk_file_batches,
    compute_state_hash,
    journal_state_hash,
    normalize_filepath_str,
    should_skip_by_journal,
)

logger = get_logger(__name__)


def cached_refresh_payload(
    *,
    existing_id: int,
    existing_mtime: int,
    mtime: int,
    cache_map: dict[tuple[str, str], Any],
    filepath: str,
    state_hash: str,
) -> tuple[Any | None, bool]:
    if not (existing_id and existing_mtime == mtime):
        return None, False
    cached_raw = cache_map.get((filepath, state_hash))
    if cached_raw:
        return cached_raw, False
    return None, True


def metadata_queue_item(
    file_path: Path,
    filepath: str,
    mtime_ns: int,
    mtime: int,
    size: int,
    state_hash: str,
    existing_id: int,
) -> tuple[Path, str, int, int, int, str, int | None]:
    return (
        file_path,
        filepath,
        mtime_ns,
        mtime,
        size,
        state_hash,
        existing_id if existing_id else None,
    )


async def index_paths_batches(
    scanner: Any,
    *,
    paths: list[Path],
    base_dir: str,
    incremental: bool,
    source: str,
    root_id: str | None,
    stats: dict[str, Any],
    added_ids: list[int],
) -> None:
    for batch in chunk_file_batches(paths):
        if not batch:
            continue
        filepaths = [normalize_filepath_str(p) for p in batch]
        journal_map = await journal_map_for_batch(scanner, filepaths=filepaths, incremental=incremental)
        existing_map = await existing_map_for_batch(scanner, filepaths=filepaths)
        await index_batch(
            scanner,
            batch=batch,
            base_dir=base_dir,
            incremental=incremental,
            source=source,
            root_id=root_id,
            fast=False,
            journal_map=journal_map,
            existing_map=existing_map,
            stats=stats,
            to_enrich=None,
            added_ids=added_ids,
        )
        await asyncio.sleep(0)


async def journal_map_for_batch(scanner: Any, *, filepaths: list[str], incremental: bool) -> dict[str, str]:
    if not incremental or not filepaths:
        return {}
    return await scanner._get_journal_entries(filepaths=filepaths)


async def existing_map_for_batch(scanner: Any, *, filepaths: list[str]) -> dict[str, dict[str, Any]]:
    existing_map: dict[str, dict[str, Any]] = {}
    if not filepaths:
        return existing_map
    existing_rows = await scanner.db.aquery_in(
        "SELECT filepath, id, mtime FROM assets WHERE {IN_CLAUSE}",
        "filepath",
        filepaths,
    )
    if not existing_rows.ok or not existing_rows.data:
        return existing_map
    for row in existing_rows.data:
        fp = row.get("filepath")
        if fp:
            existing_map[str(fp)] = row
    return existing_map


async def finalize_index_paths(scanner: Any, *, scan_start: float, stats: dict[str, Any]) -> None:
    stats["end_time"] = datetime.now().isoformat()
    duration = time.perf_counter() - scan_start
    await MetadataHelpers.set_metadata_value(scanner.db, "last_index_end", stats["end_time"])
    has_changes = stats["added"] > 0 or stats["updated"] > 0 or stats["errors"] > 0
    complete_log_level = logging.INFO if has_changes else logging.DEBUG
    scanner._log_scan_event(
        complete_log_level,
        "File list index complete",
        duration_seconds=duration,
        scanned=stats["scanned"],
        added=stats["added"],
        updated=stats["updated"],
        skipped=stats["skipped"],
        errors=stats["errors"],
    )


async def index_batch(
    scanner: Any,
    *,
    batch: list[Path],
    base_dir: str,
    incremental: bool,
    source: str,
    root_id: str | None,
    fast: bool,
    journal_map: dict[str, str],
    existing_map: dict[str, dict[str, Any]],
    stats: dict[str, Any],
    to_enrich: list[str] | None = None,
    added_ids: list[int] | None = None,
) -> None:
    batch_start = time.perf_counter()
    filepaths = [normalize_filepath_str(p) for p in batch]

    cache_map, has_rich_meta_set = await prefetch_batch_cache_and_rich_meta(
        scanner,
        filepaths=filepaths,
        existing_map=existing_map,
    )
    prepared, needs_metadata = await prepare_batch_entries(
        scanner,
        batch=batch,
        base_dir=base_dir,
        incremental=incremental,
        fast=fast,
        journal_map=journal_map,
        existing_map=existing_map,
        cache_map=cache_map,
        has_rich_meta_set=has_rich_meta_set,
        stats=stats,
    )
    await append_batch_metadata_entries(
        scanner,
        prepared=prepared,
        needs_metadata=needs_metadata,
        base_dir=base_dir,
        fast=fast,
    )

    if not prepared:
        return

    await scanner._persist_prepared_entries(
        prepared=prepared,
        base_dir=base_dir,
        source=source,
        root_id=root_id,
        stats=stats,
        to_enrich=to_enrich,
        added_ids=added_ids,
    )

    duration = time.perf_counter() - batch_start
    if duration > 0.2:
        logger.debug("_index_batch timing: %.3fs (batch=%s)", duration, len(batch) if batch is not None else 0)


async def prefetch_batch_cache_and_rich_meta(
    scanner: Any,
    *,
    filepaths: list[str],
    existing_map: dict[str, dict[str, Any]],
) -> tuple[dict[tuple[str, str], Any], set[int]]:
    cache_map: dict[tuple[str, str], Any] = {}
    has_rich_meta_set: set[int] = set()
    if not filepaths:
        return cache_map, has_rich_meta_set

    await prefetch_metadata_cache_rows(scanner, filepaths=filepaths, cache_map=cache_map)
    asset_ids = asset_ids_from_existing_rows(filepaths, existing_map)
    if not asset_ids:
        return cache_map, has_rich_meta_set

    await prefetch_rich_metadata_rows(scanner, asset_ids=asset_ids, has_rich_meta_set=has_rich_meta_set)
    return cache_map, has_rich_meta_set


async def prefetch_metadata_cache_rows(
    scanner: Any,
    *,
    filepaths: list[str],
    cache_map: dict[tuple[str, str], Any],
) -> None:
    cache_rows = await scanner.db.aquery_in(
        "SELECT filepath, state_hash, metadata_raw FROM metadata_cache WHERE {IN_CLAUSE}",
        "filepath",
        filepaths,
    )
    if not cache_rows.ok or not cache_rows.data:
        return
    for row in cache_rows.data:
        fp = row.get("filepath")
        state_hash = row.get("state_hash")
        if fp and state_hash:
            cache_map[(str(fp), str(state_hash))] = row.get("metadata_raw")


async def prefetch_rich_metadata_rows(
    scanner: Any,
    *,
    asset_ids: list[int],
    has_rich_meta_set: set[int],
) -> None:
    meta_rows = await scanner.db.aquery_in(
        "SELECT asset_id, metadata_quality, metadata_raw FROM asset_metadata WHERE {IN_CLAUSE}",
        "asset_id",
        asset_ids,
    )
    if not meta_rows.ok or not meta_rows.data:
        return
    for row in meta_rows.data:
        asset_id = row.get("asset_id")
        if not asset_id:
            continue
        try:
            metadata_quality = str(row.get("metadata_quality") or "").strip().lower()
            metadata_raw = str(row.get("metadata_raw") or "").strip()
            has_rich = metadata_quality not in ("", "none") or metadata_raw not in ("", "{}", "null")
            if has_rich:
                has_rich_meta_set.add(int(asset_id))
        except Exception:
            continue


async def prepare_batch_entries(
    scanner: Any,
    *,
    batch: list[Path],
    base_dir: str,
    incremental: bool,
    fast: bool,
    journal_map: dict[str, str],
    existing_map: dict[str, dict[str, Any]],
    cache_map: dict[tuple[str, str], Any],
    has_rich_meta_set: set[int],
    stats: dict[str, Any],
) -> tuple[list[dict[str, Any]], list[tuple[Path, str, int, int, int, str, int | None]]]:
    prepared: list[dict[str, Any]] = []
    needs_metadata: list[tuple[Path, str, int, int, int, str, int | None]] = []

    for file_path in batch:
        prepared_entry, metadata_item = await scanner._prepare_single_batch_entry(
            file_path=file_path,
            base_dir=base_dir,
            incremental=incremental,
            fast=fast,
            journal_map=journal_map,
            existing_map=existing_map,
            cache_map=cache_map,
            has_rich_meta_set=has_rich_meta_set,
            stats=stats,
        )
        if prepared_entry is not None:
            prepared.append(prepared_entry)
        if metadata_item is not None:
            needs_metadata.append(metadata_item)

    return prepared, needs_metadata


async def prepare_single_batch_entry(
    scanner: Any,
    *,
    file_path: Path,
    base_dir: str,
    incremental: bool,
    fast: bool,
    journal_map: dict[str, str],
    existing_map: dict[str, dict[str, Any]],
    cache_map: dict[tuple[str, str], Any],
    has_rich_meta_set: set[int],
    stats: dict[str, Any],
) -> tuple[dict[str, Any] | None, tuple[Path, str, int, int, int, str, int | None] | None]:
    fp = normalize_filepath_str(file_path)
    existing_state = await resolve_existing_state_for_batch(
        scanner,
        fp=fp,
        incremental=incremental,
        journal_map=journal_map,
        existing_map=existing_map,
    )

    stat_result = await scanner._stat_with_retry(file_path=file_path)
    if not stat_result[0]:
        stats["errors"] += 1
        logger.warning("Failed to stat %s: %s", str(file_path), stat_result[1])
        return None, None

    stat = stat_result[1]
    mtime_ns, mtime, size = batch_stat_to_values(stat)
    filepath = normalize_filepath_str(file_path)
    state_hash = compute_state_hash(filepath, mtime_ns, size)

    entry_journal_state_hash = journal_state_hash(existing_state if isinstance(existing_state, dict) else None)
    existing_id, existing_mtime = extract_existing_asset_state(
        existing_state if isinstance(existing_state, dict) else None
    )

    if should_skip_by_journal(
        incremental=incremental,
        journal_state_hash=entry_journal_state_hash,
        state_hash=state_hash,
        fast=fast,
        existing_id=existing_id,
        has_rich_meta_set=has_rich_meta_set,
    ):
        return {"action": "skipped_journal"}, None

    cached_raw, has_cached_miss = cached_refresh_payload(
        existing_id=existing_id,
        existing_mtime=existing_mtime,
        mtime=mtime,
        cache_map=cache_map,
        filepath=filepath,
        state_hash=state_hash,
    )
    if cached_raw is not None:
        return (
            build_cached_refresh_entry(
                existing_id=existing_id,
                cached_raw=cached_raw,
                filepath=filepath,
                file_path=file_path,
                state_hash=state_hash,
                mtime=mtime,
                size=size,
                fast=fast,
            ),
            None,
        )
    if has_cached_miss and existing_id in has_rich_meta_set:
        return {"action": "skipped"}, None

    if fast:
        return (
            build_fast_batch_entry(
                existing_id=existing_id,
                file_path=file_path,
                base_dir=base_dir,
                filepath=filepath,
                mtime_ns=mtime_ns,
                mtime=mtime,
                size=size,
                state_hash=state_hash,
            ),
            None,
        )

    return None, metadata_queue_item(
        file_path,
        filepath,
        mtime_ns,
        mtime,
        size,
        state_hash,
        existing_id,
    )


async def resolve_existing_state_for_batch(
    scanner: Any,
    *,
    fp: str,
    incremental: bool,
    journal_map: dict[str, str],
    existing_map: dict[str, dict[str, Any]],
) -> dict[str, Any] | None:
    existing_state: dict[str, Any] | None
    if incremental and fp in journal_map:
        existing_state = dict(existing_map.get(fp) or {})
        existing_state["journal_state_hash"] = journal_map.get(fp)
    else:
        existing_state = existing_map.get(fp)

    # Preserve previous Windows case-insensitive lookup fallback.
    if IS_WINDOWS and not existing_state:
        try:
            existing_ci = await scanner.db.aquery(
                "SELECT id, mtime, filepath FROM assets WHERE filepath = ? COLLATE NOCASE LIMIT 1",
                (fp,),
            )
            if existing_ci.ok and existing_ci.data:
                existing_state = existing_ci.data[0]
                existing_map[fp] = existing_state
        except Exception:
            pass
    return existing_state


async def append_batch_metadata_entries(
    scanner: Any,
    *,
    prepared: list[dict[str, Any]],
    needs_metadata: list[tuple[Path, str, int, int, int, str, int | None]],
    base_dir: str,
    fast: bool,
) -> None:
    if not needs_metadata:
        return

    paths_to_extract = [item[0] for item in needs_metadata]
    batch_metadata = await scanner.metadata.get_metadata_batch(
        [str(p) for p in paths_to_extract],
        scan_id=scanner._current_scan_id,
    )

    for file_path, filepath, mtime_ns, mtime, size, state_hash, existing_id_opt in needs_metadata:
        metadata_result: Result[dict[str, Any]] | None = batch_metadata.get(str(file_path))
        if not metadata_result:
            metadata_result = MetadataHelpers.metadata_error_payload(
                Result.Err("METADATA_MISSING", "No metadata returned"),
                filepath,
            )
        elif not metadata_result.ok:
            metadata_result = MetadataHelpers.metadata_error_payload(metadata_result, filepath)

        cache_store = bool(metadata_result.ok)
        if existing_id_opt:
            prepared.append(
                {
                    "action": "updated",
                    "asset_id": existing_id_opt,
                    "metadata_result": metadata_result,
                    "filepath": filepath,
                    "file_path": file_path,
                    "mtime_ns": int(mtime_ns),
                    "state_hash": state_hash,
                    "mtime": mtime,
                    "size": size,
                    "fast": fast,
                    "cache_store": cache_store,
                }
            )
            continue

        rel_path = safe_relative_path(file_path, base_dir)
        filename = file_path.name
        subfolder = str(rel_path.parent) if rel_path.parent != Path(".") else ""
        kind = classify_file(filename)
        prepared.append(
            {
                "action": "added",
                "filename": filename,
                "subfolder": subfolder,
                "filepath": filepath,
                "kind": kind,
                "metadata_result": metadata_result,
                "file_path": file_path,
                "mtime_ns": int(mtime_ns),
                "state_hash": state_hash,
                "mtime": mtime,
                "size": size,
                "fast": fast,
                "cache_store": cache_store,
            }
        )
