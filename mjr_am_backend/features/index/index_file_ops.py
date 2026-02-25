"""
Single-file indexing helpers extracted from scanner.py.
"""
import logging
import sqlite3
from pathlib import Path
from typing import Any, cast

from ...config import IS_WINDOWS
from ...shared import ErrorCode, FileKind, Result, classify_file, get_logger
from .entry_builder import extract_existing_asset_state, safe_relative_path
from .metadata_helpers import MetadataHelpers
from .scan_batch_utils import compute_state_hash, normalize_filepath_str

logger = get_logger(__name__)


async def index_file(
    scanner: Any,
    *,
    file_path: Path,
    base_dir: str,
    incremental: bool,
    existing_state: dict[str, Any] | None = None,
    source: str = "output",
    root_id: str | None = None,
    fast: bool = False,
) -> Result[dict[str, str]]:
    state = await build_index_file_state(scanner, file_path=file_path)
    if isinstance(state, Result):
        return state
    file_path, filepath, state_hash, mtime, size = state

    entry_journal_state_hash = await get_journal_state_hash_for_index_file(
        scanner,
        filepath=filepath,
        existing_state=existing_state,
        incremental=incremental,
    )
    existing_asset = await resolve_existing_asset_for_index_file(
        scanner,
        filepath=filepath,
        existing_state=existing_state,
    )
    existing_id, existing_mtime = extract_existing_asset_state(existing_asset)

    skip_journal = await try_skip_by_journal(
        scanner,
        incremental=incremental,
        journal_state_hash=entry_journal_state_hash,
        state_hash=state_hash,
        fast=fast,
        existing_id=existing_id,
    )
    if skip_journal is not None:
        return skip_journal

    cached_refresh = await try_cached_incremental_refresh(
        scanner,
        incremental=incremental,
        existing_id=existing_id,
        existing_mtime=existing_mtime,
        mtime=mtime,
        filepath=filepath,
        state_hash=state_hash,
        base_dir=base_dir,
        size=size,
    )
    if cached_refresh is not None:
        return cached_refresh

    metadata_result = await extract_metadata_for_index_file(
        scanner,
        file_path=file_path,
        filepath=filepath,
        state_hash=state_hash,
        fast=fast,
    )

    existing_id, existing_mtime = extract_existing_asset_state(existing_asset)
    incremental_refresh = await try_incremental_refresh_with_metadata(
        scanner,
        incremental=incremental,
        existing_id=existing_id,
        existing_mtime=existing_mtime,
        mtime=mtime,
        filepath=filepath,
        state_hash=state_hash,
        base_dir=base_dir,
        size=size,
        metadata_result=metadata_result,
    )
    if incremental_refresh is not None:
        return incremental_refresh

    rel_path = safe_relative_path(file_path, base_dir)
    filename = file_path.name
    subfolder = str(rel_path.parent) if rel_path.parent != Path(".") else ""
    kind = classify_file(filename)

    return await insert_new_asset_for_index_file(
        scanner,
        filename=filename,
        subfolder=subfolder,
        filepath=filepath,
        kind=kind,
        mtime=mtime,
        size=size,
        file_path=file_path,
        metadata_result=metadata_result,
        base_dir=base_dir,
        state_hash=state_hash,
        source=source,
        root_id=root_id,
    )


async def build_index_file_state(
    scanner: Any,
    *,
    file_path: Path,
) -> Result[dict[str, str]] | tuple[Path, str, str, int, int]:
    stat_result = await scanner._stat_with_retry(file_path=file_path)
    if not stat_result[0]:
        return Result.Err("STAT_FAILED", f"Failed to stat file: {stat_result[1]}")
    stat = stat_result[1]
    mtime_ns = int(stat.st_mtime_ns)
    mtime = int(stat.st_mtime)
    size = int(stat.st_size)
    resolved_path = resolve_index_file_path(file_path)
    filepath = normalize_filepath_str(resolved_path)
    state_hash = compute_state_hash(filepath, mtime_ns, size)
    return resolved_path, filepath, state_hash, mtime, size


def resolve_index_file_path(file_path: Path) -> Path:
    if not IS_WINDOWS:
        return file_path
    try:
        return Path(str(file_path)).resolve(strict=True)
    except Exception:
        return file_path


async def try_skip_by_journal(
    scanner: Any,
    *,
    incremental: bool,
    journal_state_hash: str | None,
    state_hash: str,
    fast: bool,
    existing_id: int,
) -> Result[dict[str, str]] | None:
    if not (incremental and journal_state_hash and str(journal_state_hash) == state_hash):
        return None
    if fast:
        return Result.Ok({"action": "skipped_journal"})
    if existing_id and await scanner._asset_has_rich_metadata(asset_id=existing_id):
        return Result.Ok({"action": "skipped_journal"})
    return None


async def get_journal_state_hash_for_index_file(
    scanner: Any,
    *,
    filepath: str,
    existing_state: dict[str, Any] | None,
    incremental: bool,
) -> str | None:
    if isinstance(existing_state, dict) and "journal_state_hash" in existing_state:
        return cast(str | None, existing_state.get("journal_state_hash"))
    if not incremental:
        return None
    journal_entry = await scanner._get_journal_entry(filepath=filepath)
    if not isinstance(journal_entry, dict):
        return None
    value = journal_entry.get("state_hash")
    return str(value) if value else None


async def resolve_existing_asset_for_index_file(
    scanner: Any,
    *,
    filepath: str,
    existing_state: dict[str, Any] | None,
) -> dict[str, Any] | None:
    if isinstance(existing_state, dict) and existing_state.get("id") is not None:
        return existing_state

    existing = await scanner.db.aquery("SELECT id, mtime, filepath FROM assets WHERE filepath = ?", (filepath,))
    if existing.ok and existing.data:
        return existing.data[0]

    if not IS_WINDOWS:
        return None

    try:
        existing_ci = await scanner.db.aquery(
            "SELECT id, mtime, filepath FROM assets WHERE filepath = ? COLLATE NOCASE",
            (filepath,),
        )
    except Exception:
        return None
    if existing_ci.ok and existing_ci.data:
        return existing_ci.data[0]
    return None


async def try_cached_incremental_refresh(
    scanner: Any,
    *,
    incremental: bool,
    existing_id: int,
    existing_mtime: int,
    mtime: int,
    filepath: str,
    state_hash: str,
    base_dir: str,
    size: int,
) -> Result[dict[str, str]] | None:
    if not (incremental and existing_id and existing_mtime == mtime):
        return None

    cached_metadata = await MetadataHelpers.retrieve_cached_metadata(scanner.db, filepath, state_hash)
    if cached_metadata and cached_metadata.ok:
        return await refresh_from_cached_metadata(
            scanner,
            existing_id=existing_id,
            cached_metadata=cached_metadata,
            filepath=filepath,
            base_dir=base_dir,
            state_hash=state_hash,
            mtime=mtime,
            size=size,
        )

    if await scanner._asset_has_rich_metadata(asset_id=existing_id):
        return Result.Ok({"action": "skipped"})
    return None


async def refresh_from_cached_metadata(
    scanner: Any,
    *,
    existing_id: int,
    cached_metadata: Result[dict[str, Any]],
    filepath: str,
    base_dir: str,
    state_hash: str,
    mtime: int,
    size: int,
) -> Result[dict[str, str]]:
    tx_state, refreshed = await refresh_from_cached_metadata_tx(
        scanner,
        existing_id=existing_id,
        cached_metadata=cached_metadata,
        filepath=filepath,
        base_dir=base_dir,
        state_hash=state_hash,
        mtime=mtime,
        size=size,
    )
    if not tx_state:
        return Result.Ok({"action": "skipped"})
    if not tx_state.ok:
        logger.warning("Metadata refresh commit failed for %s: %s", filepath, tx_state.error)
        return Result.Ok({"action": "skipped"})
    return Result.Ok({"action": "skipped_refresh" if refreshed else "skipped"})


async def refresh_from_cached_metadata_tx(
    scanner: Any,
    *,
    existing_id: int,
    cached_metadata: Result[dict[str, Any]],
    filepath: str,
    base_dir: str,
    state_hash: str,
    mtime: int,
    size: int,
) -> tuple[Any | None, bool]:
    refreshed = False
    async with scanner.db.atransaction(mode="immediate") as tx:
        if not tx.ok:
            logger.warning("Metadata refresh skipped (transaction begin failed) for %s: %s", filepath, tx.error)
            return None, False
        refreshed = await MetadataHelpers.refresh_metadata_if_needed(
            scanner.db,
            existing_id,
            cached_metadata,
            filepath,
            base_dir,
            state_hash,
            mtime,
            size,
            scanner._write_scan_journal_entry,
        )
        if refreshed:
            await scanner._write_scan_journal_entry(filepath=filepath, base_dir=base_dir, state_hash=state_hash, mtime=mtime, size=size)
        return tx, refreshed


async def extract_metadata_for_index_file(
    scanner: Any,
    *,
    file_path: Path,
    filepath: str,
    state_hash: str,
    fast: bool,
) -> Result[dict[str, Any]]:
    if fast:
        return Result.Ok({})

    metadata_result = await scanner.metadata.get_metadata(filepath, scan_id=scanner._current_scan_id)
    if metadata_result.ok:
        quality = metadata_result.meta.get("quality", "full")
        if quality in ("degraded", "partial"):
            logger.debug("Metadata extraction completed with degraded quality for %s: %s", file_path, quality)
        await MetadataHelpers.store_metadata_cache(scanner.db, filepath, state_hash, metadata_result)
        return metadata_result

    if metadata_result.code == ErrorCode.FFPROBE_ERROR:
        scanner._log_scan_event(
            logging.WARNING,
            "FFprobe error during metadata extraction",
            filepath=str(file_path),
            tool="ffprobe",
            error=metadata_result.error,
            code=metadata_result.code,
        )
    else:
        scanner._log_scan_event(
            logging.WARNING,
            "Metadata extraction issue",
            filepath=str(file_path),
            error=metadata_result.error,
            code=metadata_result.code,
        )
    return MetadataHelpers.metadata_error_payload(metadata_result, str(file_path))


async def try_incremental_refresh_with_metadata(
    scanner: Any,
    *,
    incremental: bool,
    existing_id: int,
    existing_mtime: int,
    mtime: int,
    filepath: str,
    state_hash: str,
    base_dir: str,
    size: int,
    metadata_result: Result[dict[str, Any]],
) -> Result[dict[str, str]] | None:
    if not (incremental and existing_id and existing_mtime == mtime):
        return None

    refreshed = False
    try:
        tx_state, refreshed = await run_incremental_metadata_refresh_locked(
            scanner,
            existing_id=existing_id,
            metadata_result=metadata_result,
            filepath=filepath,
            base_dir=base_dir,
            state_hash=state_hash,
            mtime=mtime,
            size=size,
        )
    except sqlite3.OperationalError:
        return Result.Err("DB_BUSY", "Database busy while refreshing metadata")

    if not tx_state or not tx_state.ok:
        return Result.Err("DB_ERROR", tx_state.error or "Commit failed")
    action = "skipped_refresh" if refreshed else "skipped"
    return Result.Ok({"action": action})


async def run_incremental_metadata_refresh_locked(
    scanner: Any,
    *,
    existing_id: int,
    metadata_result: Result[dict[str, Any]],
    filepath: str,
    base_dir: str,
    state_hash: str,
    mtime: int,
    size: int,
) -> tuple[Any, bool]:
    async with scanner.db.lock_for_asset(existing_id):
        try:
            return await run_incremental_metadata_refresh_tx(
                scanner,
                existing_id=existing_id,
                metadata_result=metadata_result,
                filepath=filepath,
                base_dir=base_dir,
                state_hash=state_hash,
                mtime=mtime,
                size=size,
            )
        except sqlite3.OperationalError as exc:
            if scanner.db._is_locked_error(exc):
                logger.warning("Database busy while refreshing metadata (asset=%s): %s", existing_id, exc)
            raise


async def run_incremental_metadata_refresh_tx(
    scanner: Any,
    *,
    existing_id: int,
    metadata_result: Result[dict[str, Any]],
    filepath: str,
    base_dir: str,
    state_hash: str,
    mtime: int,
    size: int,
) -> tuple[Any, bool]:
    refreshed = False
    async with scanner.db.atransaction(mode="immediate") as tx:
        if not tx.ok:
            return tx, refreshed
        refreshed = await MetadataHelpers.refresh_metadata_if_needed(
            scanner.db,
            existing_id,
            metadata_result,
            filepath,
            base_dir,
            state_hash,
            mtime,
            size,
            scanner._write_scan_journal_entry,
        )
        if refreshed:
            await scanner._write_scan_journal_entry(filepath=filepath, base_dir=base_dir, state_hash=state_hash, mtime=mtime, size=size)
        return tx, refreshed


async def insert_new_asset_for_index_file(
    scanner: Any,
    *,
    filename: str,
    subfolder: str,
    filepath: str,
    kind: FileKind,
    mtime: int,
    size: int,
    file_path: Path,
    metadata_result: Result[dict[str, Any]],
    base_dir: str,
    state_hash: str,
    source: str,
    root_id: str | None,
) -> Result[dict[str, str]]:
    try:
        tx_state, result = await insert_new_asset_tx(
            scanner,
            filename=filename,
            subfolder=subfolder,
            filepath=filepath,
            kind=kind,
            mtime=mtime,
            size=size,
            file_path=file_path,
            metadata_result=metadata_result,
            base_dir=base_dir,
            state_hash=state_hash,
            source=source,
            root_id=root_id,
        )
    except sqlite3.OperationalError as exc:
        if scanner.db._is_locked_error(exc):
            logger.warning("Database busy while inserting asset %s: %s", filepath, exc)
            return Result.Err("DB_BUSY", "Database busy while inserting asset")
        raise

    if not tx_state or not tx_state.ok:
        return Result.Err("DB_ERROR", tx_state.error or "Commit failed")
    if result.ok and isinstance(result.data, dict):
        asset_id = result.data.get("asset_id")
        if asset_id is not None:
            await scanner._write_metadata_row(asset_id=int(asset_id), metadata_result=metadata_result, filepath=filepath)
    return result


async def insert_new_asset_tx(
    scanner: Any,
    *,
    filename: str,
    subfolder: str,
    filepath: str,
    kind: FileKind,
    mtime: int,
    size: int,
    file_path: Path,
    metadata_result: Result[dict[str, Any]],
    base_dir: str,
    state_hash: str,
    source: str,
    root_id: str | None,
) -> tuple[Any, Result[dict[str, str]]]:
    async with scanner.db.atransaction(mode="immediate") as tx:
        if not tx.ok:
            return tx, Result.Err("DB_ERROR", tx.error or "Failed to begin transaction")
        result = await scanner._add_asset(
            filename=filename,
            subfolder=subfolder,
            filepath=filepath,
            kind=kind,
            mtime=mtime,
            size=size,
            file_path=file_path,
            metadata_result=metadata_result,
            source=source,
            root_id=root_id,
            write_metadata=False,
            skip_lock=True,
        )
        if result.ok:
            await scanner._write_scan_journal_entry(filepath=filepath, base_dir=base_dir, state_hash=state_hash, mtime=mtime, size=size)
        return tx, result
