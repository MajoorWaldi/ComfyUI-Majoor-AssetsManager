"""
Index persistence helpers extracted from scanner.py.
"""
from pathlib import Path
from typing import Any, Callable

from ...shared import Result, get_logger
from .entry_builder import (
    added_asset_id_from_result,
    entry_display_path,
    extract_add_entry_context,
    extract_update_entry_context,
    fallback_correct_error,
    handle_invalid_prepared_entry,
    handle_update_or_add_failure,
    invalid_refresh_entry,
    refresh_entry_context,
)
from .metadata_helpers import MetadataHelpers

logger = get_logger(__name__)


async def persist_prepared_entries(
    scanner: Any,
    *,
    prepared: list[dict[str, Any]],
    base_dir: str,
    source: str,
    root_id: str | None,
    stats: dict[str, Any],
    to_enrich: list[str] | None,
    added_ids: list[int] | None,
    is_fatal_db_error: Callable[[Exception], bool],
) -> None:
    try:
        await persist_prepared_entries_tx(
            scanner,
            prepared=prepared,
            base_dir=base_dir,
            source=source,
            root_id=root_id,
            stats=stats,
            to_enrich=to_enrich,
            added_ids=added_ids,
        )
    except Exception as batch_error:
        if is_fatal_db_error(batch_error):
            logger.error(
                "Batch transaction failed with fatal database error (%s); aborting fallback.",
                type(batch_error).__name__,
                exc_info=batch_error,
            )
            raise

        suspect_fp, suspect_reason = scanner._diagnose_batch_failure(prepared, batch_error)
        if suspect_fp:
            logger.warning(
                "Batch transaction failed near file '%s' (%s). Falling back to individual processing.",
                suspect_fp,
                suspect_reason,
            )
        else:
            logger.warning(
                "Batch transaction failed (%s). Falling back to individual processing.",
                suspect_reason,
            )
        logger.warning(
            "Batch transaction failed: %s. Falling back to individual processing.",
            str(batch_error),
        )
        await persist_prepared_entries_fallback(
            scanner,
            prepared=prepared,
            base_dir=base_dir,
            source=source,
            root_id=root_id,
            stats=stats,
            to_enrich=to_enrich,
        )


async def persist_prepared_entries_tx(
    scanner: Any,
    *,
    prepared: list[dict[str, Any]],
    base_dir: str,
    source: str,
    root_id: str | None,
    stats: dict[str, Any],
    to_enrich: list[str] | None,
    added_ids: list[int] | None,
) -> None:
    async with scanner.db.atransaction(mode="immediate") as tx:
        if not tx.ok:
            raise RuntimeError(tx.error or "Failed to begin transaction")
        for entry in prepared:
            await process_prepared_entry_tx(
                scanner,
                entry=entry,
                base_dir=base_dir,
                source=source,
                root_id=root_id,
                stats=stats,
                to_enrich=to_enrich,
                added_ids=added_ids,
            )
    if not tx.ok:
        raise RuntimeError(tx.error or "Commit failed")


async def process_prepared_entry_tx(
    scanner: Any,
    *,
    entry: dict[str, Any],
    base_dir: str,
    source: str,
    root_id: str | None,
    stats: dict[str, Any],
    to_enrich: list[str] | None,
    added_ids: list[int] | None,
) -> None:
    action = entry.get("action")
    if action in ("skipped", "skipped_journal"):
        stats["skipped"] += 1
        return
    if scanner._entry_state_drifted(entry=entry, stats=stats):
        return
    if action == "refresh":
        await process_refresh_entry(
            scanner,
            entry=entry,
            base_dir=base_dir,
            stats=stats,
            to_enrich=to_enrich,
            fallback_mode=False,
            respect_enrich_limit=True,
        )
        return
    if action == "updated":
        await process_updated_entry(
            scanner,
            entry=entry,
            base_dir=base_dir,
            source=source,
            root_id=root_id,
            stats=stats,
            to_enrich=to_enrich,
            added_ids=added_ids,
            fallback_mode=False,
            respect_enrich_limit=True,
        )
        return
    if action == "added":
        await process_added_entry(
            scanner,
            entry=entry,
            base_dir=base_dir,
            source=source,
            root_id=root_id,
            stats=stats,
            to_enrich=to_enrich,
            added_ids=added_ids,
            fallback_mode=False,
            respect_enrich_limit=True,
        )
        return
    stats["skipped"] += 1


async def persist_prepared_entries_fallback(
    scanner: Any,
    *,
    prepared: list[dict[str, Any]],
    base_dir: str,
    source: str,
    root_id: str | None,
    stats: dict[str, Any],
    to_enrich: list[str] | None,
) -> None:
    stats["batch_fallbacks"] = int(stats.get("batch_fallbacks") or 0) + 1
    with scanner._batch_fallback_lock:
        scanner._batch_fallback_count += 1
    stats["errors"] += len(prepared)
    failed_entries: list[str] = []

    for entry in prepared:
        action = entry.get("action")
        filepath_value = entry_display_path(entry)

        if action in ("skipped", "skipped_journal"):
            stats["skipped"] += 1
            fallback_correct_error(stats)
            continue
        try:
            if scanner._entry_state_drifted(entry=entry, stats=stats):
                fallback_correct_error(stats)
                continue

            async with scanner.db.atransaction(mode="immediate") as tx:
                if not tx.ok:
                    failed_entries.append(filepath_value)
                    continue
                ok = await process_prepared_entry_fallback(
                    scanner,
                    entry=entry,
                    base_dir=base_dir,
                    source=source,
                    root_id=root_id,
                    stats=stats,
                    to_enrich=to_enrich,
                )
                if not ok:
                    failed_entries.append(filepath_value)
                    continue
            if not tx.ok:
                failed_entries.append(filepath_value)
        except Exception as individual_error:
            failed_entries.append(filepath_value)
            logger.warning(
                "Individual processing failed for entry: %s. Error: %s",
                filepath_value,
                str(individual_error),
                exc_info=individual_error,
            )

    if failed_entries:
        sample = failed_entries[:5]
        logger.warning(
            "Batch fallback completed with %s failures (sample: %s)",
            len(failed_entries),
            sample,
        )


async def process_prepared_entry_fallback(
    scanner: Any,
    *,
    entry: dict[str, Any],
    base_dir: str,
    source: str,
    root_id: str | None,
    stats: dict[str, Any],
    to_enrich: list[str] | None,
) -> bool:
    action = entry.get("action")
    if action == "refresh":
        return await process_refresh_entry(
            scanner,
            entry=entry,
            base_dir=base_dir,
            stats=stats,
            to_enrich=to_enrich,
            fallback_mode=True,
            respect_enrich_limit=True,
        )
    if action == "updated":
        return await process_updated_entry(
            scanner,
            entry=entry,
            base_dir=base_dir,
            source=source,
            root_id=root_id,
            stats=stats,
            to_enrich=to_enrich,
            added_ids=None,
            fallback_mode=True,
            respect_enrich_limit=False,
        )
    if action == "added":
        return await process_added_entry(
            scanner,
            entry=entry,
            base_dir=base_dir,
            source=source,
            root_id=root_id,
            stats=stats,
            to_enrich=to_enrich,
            added_ids=None,
            fallback_mode=True,
            respect_enrich_limit=False,
        )

    stats["skipped"] += 1
    fallback_correct_error(stats)
    return True


async def process_refresh_entry(
    scanner: Any,
    *,
    entry: dict[str, Any],
    base_dir: str,
    stats: dict[str, Any],
    to_enrich: list[str] | None,
    fallback_mode: bool,
    respect_enrich_limit: bool,
) -> bool:
    asset_id = entry.get("asset_id")
    metadata_result = entry.get("metadata_result")
    invalid_refresh = invalid_refresh_entry(asset_id, metadata_result, stats, fallback_mode)
    if invalid_refresh is not None:
        return invalid_refresh

    try:
        if not isinstance(metadata_result, Result):
            if fallback_mode:
                return False
            stats["skipped"] += 1
            return True
        if asset_id is None:
            if fallback_mode:
                return False
            stats["skipped"] += 1
            return True
        try:
            asset_id_int = int(asset_id)
        except Exception:
            if fallback_mode:
                return False
            stats["skipped"] += 1
            return True
        refreshed = await MetadataHelpers.refresh_metadata_if_needed(
            scanner.db,
            asset_id_int,
            metadata_result,
            *refresh_entry_context(entry, base_dir),
            scanner._write_scan_journal_entry,
        )
        scanner._record_refresh_outcome(
            stats=stats,
            fallback_mode=fallback_mode,
            refreshed=refreshed,
            entry=entry,
            to_enrich=to_enrich,
            respect_enrich_limit=respect_enrich_limit,
        )
        return True
    except Exception as exc:
        if not fallback_mode:
            stats["errors"] += 1
        logger.warning("Metadata refresh failed for asset_id=%s: %s", asset_id, exc)
        return not fallback_mode


async def process_updated_entry(
    scanner: Any,
    *,
    entry: dict[str, Any],
    base_dir: str,
    source: str,
    root_id: str | None,
    stats: dict[str, Any],
    to_enrich: list[str] | None,
    added_ids: list[int] | None,
    fallback_mode: bool,
    respect_enrich_limit: bool,
) -> bool:
    ctx = extract_update_entry_context(entry)
    if ctx is None:
        return handle_invalid_prepared_entry(stats, fallback_mode)

    await scanner._maybe_store_entry_cache(entry=entry, metadata_result=ctx["metadata_result"])
    if not await apply_update_entry(scanner, entry=entry, ctx=ctx, source=source, root_id=root_id):
        return handle_update_or_add_failure(stats, fallback_mode)

    await write_entry_scan_journal(scanner, entry=entry, base_dir=base_dir)
    scanner._record_index_entry_success(
        stats=stats,
        fallback_mode=fallback_mode,
        added_ids=added_ids,
        added_asset_id=ctx["asset_id"],
        entry=entry,
        action="updated",
        to_enrich=to_enrich,
        respect_enrich_limit=respect_enrich_limit,
    )
    return True


async def process_added_entry(
    scanner: Any,
    *,
    entry: dict[str, Any],
    base_dir: str,
    source: str,
    root_id: str | None,
    stats: dict[str, Any],
    to_enrich: list[str] | None,
    added_ids: list[int] | None,
    fallback_mode: bool,
    respect_enrich_limit: bool,
) -> bool:
    ctx = extract_add_entry_context(entry)
    if ctx is None:
        return handle_invalid_prepared_entry(stats, fallback_mode)

    add_result = await apply_add_entry(scanner, entry=entry, ctx=ctx, source=source, root_id=root_id)
    if not add_result.ok:
        return handle_update_or_add_failure(stats, fallback_mode)

    await scanner._maybe_store_entry_cache(entry=entry, metadata_result=ctx["metadata_result"])
    await write_entry_scan_journal(scanner, entry=entry, base_dir=base_dir)
    added_asset_id = added_asset_id_from_result(add_result)
    scanner._record_index_entry_success(
        stats=stats,
        fallback_mode=fallback_mode,
        added_ids=added_ids,
        added_asset_id=added_asset_id,
        entry=entry,
        action="added",
        to_enrich=to_enrich,
        respect_enrich_limit=respect_enrich_limit,
    )
    return True


async def apply_update_entry(
    scanner: Any,
    *,
    entry: dict[str, Any],
    ctx: dict[str, Any],
    source: str,
    root_id: str | None,
) -> bool:
    res = await scanner._update_asset(
        asset_id=ctx["asset_id"],
        file_path=ctx["file_path"],
        mtime=int(entry.get("mtime") or 0),
        size=int(entry.get("size") or 0),
        metadata_result=ctx["metadata_result"],
        source=source,
        root_id=root_id,
        write_metadata=not bool(entry.get("fast")),
    )
    return bool(res.ok)


async def apply_add_entry(
    scanner: Any,
    *,
    entry: dict[str, Any],
    ctx: dict[str, Any],
    source: str,
    root_id: str | None,
) -> Result[dict[str, Any]]:
    return await scanner._add_asset(
        filename=entry.get("filename") or "",
        subfolder=entry.get("subfolder") or "",
        filepath=entry.get("filepath") or "",
        kind=ctx["kind"],
        mtime=int(entry.get("mtime") or 0),
        size=int(entry.get("size") or 0),
        file_path=ctx["file_path"],
        metadata_result=ctx["metadata_result"],
        source=source,
        root_id=root_id,
        write_metadata=True,
    )


async def write_entry_scan_journal(scanner: Any, *, entry: dict[str, Any], base_dir: str) -> None:
    await scanner._write_scan_journal_entry(
        filepath=entry.get("filepath") or "",
        base_dir=base_dir,
        state_hash=entry.get("state_hash") or "",
        mtime=int(entry.get("mtime") or 0),
        size=int(entry.get("size") or 0),
    )
