"""
Entry preparation helpers for batch indexing.
"""
from pathlib import Path
from typing import Any

from ...shared import Result
from .entry_builder import (
    build_added_entry_from_prepare_ctx,
    build_refresh_entry,
    build_updated_entry,
    extract_existing_asset_state,
)
from .metadata_helpers import MetadataHelpers
from .scan_batch_utils import compute_state_hash, is_incremental_unchanged, normalize_filepath_str


async def prepare_metadata_for_entry(
    scanner: Any,
    *,
    filepath: str,
    fast: bool,
) -> tuple[Result[dict[str, Any]], bool]:
    if fast:
        return Result.Ok({}), False
    metadata_result = await scanner.metadata.get_metadata(filepath, scan_id=scanner._current_scan_id)
    if metadata_result.ok:
        return metadata_result, True
    return MetadataHelpers.metadata_error_payload(metadata_result, filepath), False


async def prepare_index_entry(
    scanner: Any,
    *,
    file_path: Path,
    base_dir: str,
    incremental: bool,
    existing_state: dict[str, Any] | None = None,
    source: str = "output",
    root_id: str | None = None,
    fast: bool = False,
) -> Result[dict[str, Any]]:
    prepare_ctx, stat_error = await prepare_index_entry_context(
        scanner,
        file_path=file_path,
        existing_state=existing_state,
        incremental=incremental,
    )
    if prepare_ctx is None:
        return Result.Err("STAT_FAILED", f"Failed to stat file: {stat_error}")

    skip = await maybe_skip_prepare_for_incremental(
        scanner,
        prepare_ctx=prepare_ctx,
        incremental=incremental,
        fast=fast,
        file_path=file_path,
    )
    if skip is not None:
        return skip

    metadata_result, cache_store = await prepare_metadata_for_entry(
        scanner,
        filepath=prepare_ctx["filepath"],
        fast=fast,
    )
    if is_incremental_unchanged(prepare_ctx, incremental):
        return Result.Ok(
            build_refresh_entry(
                asset_id=prepare_ctx["existing_id"],
                metadata_result=metadata_result,
                filepath=prepare_ctx["filepath"],
                file_path=file_path,
                state_hash=prepare_ctx["state_hash"],
                mtime=prepare_ctx["mtime"],
                size=prepare_ctx["size"],
                fast=fast,
                cache_store=cache_store,
            )
        )
    if prepare_ctx["existing_id"]:
        return Result.Ok(
            build_updated_entry(
                asset_id=prepare_ctx["existing_id"],
                metadata_result=metadata_result,
                filepath=prepare_ctx["filepath"],
                file_path=file_path,
                state_hash=prepare_ctx["state_hash"],
                mtime=prepare_ctx["mtime"],
                size=prepare_ctx["size"],
                fast=fast,
                cache_store=cache_store,
            )
        )
    return Result.Ok(
        build_added_entry_from_prepare_ctx(prepare_ctx, file_path, base_dir, metadata_result, cache_store, fast)
    )


async def prepare_index_entry_context(
    scanner: Any,
    *,
    file_path: Path,
    existing_state: dict[str, Any] | None,
    incremental: bool,
) -> tuple[dict[str, Any] | None, str | None]:
    stat_result = await scanner._stat_with_retry(file_path=file_path)
    if not stat_result[0]:
        return None, str(stat_result[1])
    stat = stat_result[1]
    mtime_ns = int(stat.st_mtime_ns)
    mtime = int(stat.st_mtime)
    size = int(stat.st_size)
    filepath = normalize_filepath_str(file_path)
    state_hash = compute_state_hash(filepath, mtime_ns, size)
    entry_journal_state_hash = await scanner._get_journal_state_hash_for_index_file(filepath=filepath, existing_state=existing_state, incremental=incremental)
    existing_asset = existing_state if isinstance(existing_state, dict) and existing_state.get("id") is not None else None
    existing_id, existing_mtime = extract_existing_asset_state(existing_asset)
    return {
        "filepath": filepath,
        "state_hash": state_hash,
        "journal_state_hash": entry_journal_state_hash,
        "existing_id": existing_id,
        "existing_mtime": existing_mtime,
        "mtime": mtime,
        "size": size,
    }, None


async def maybe_skip_prepare_for_incremental(
    scanner: Any,
    *,
    prepare_ctx: dict[str, Any],
    incremental: bool,
    fast: bool,
    file_path: Path,
) -> Result[dict[str, Any]] | None:
    if await should_skip_by_journal_state(scanner, prepare_ctx=prepare_ctx, incremental=incremental, fast=fast):
        return Result.Ok({"action": "skipped_journal"})
    if not is_incremental_unchanged(prepare_ctx, incremental):
        return None
    cached_result = await refresh_entry_from_cached_metadata(scanner, prepare_ctx=prepare_ctx, file_path=file_path, fast=fast)
    if cached_result is not None:
        return cached_result
    if await scanner._asset_has_rich_metadata(asset_id=prepare_ctx["existing_id"]):
        return Result.Ok({"action": "skipped"})
    return None


async def should_skip_by_journal_state(
    scanner: Any,
    *,
    prepare_ctx: dict[str, Any],
    incremental: bool,
    fast: bool,
) -> bool:
    if not incremental:
        return False
    if not prepare_ctx["journal_state_hash"]:
        return False
    if str(prepare_ctx["journal_state_hash"]) != prepare_ctx["state_hash"]:
        return False
    if fast:
        return True
    existing_id = int(prepare_ctx.get("existing_id") or 0)
    return bool(existing_id and await scanner._asset_has_rich_metadata(asset_id=existing_id))


async def refresh_entry_from_cached_metadata(
    scanner: Any,
    *,
    prepare_ctx: dict[str, Any],
    file_path: Path,
    fast: bool,
) -> Result[dict[str, Any]] | None:
    cached = await MetadataHelpers.retrieve_cached_metadata(scanner.db, prepare_ctx["filepath"], prepare_ctx["state_hash"])
    if not (cached and cached.ok):
        return None
    return Result.Ok(
        build_refresh_entry(
            asset_id=prepare_ctx["existing_id"],
            metadata_result=cached,
            filepath=prepare_ctx["filepath"],
            file_path=file_path,
            state_hash=prepare_ctx["state_hash"],
            mtime=prepare_ctx["mtime"],
            size=prepare_ctx["size"],
            fast=fast,
            cache_store=False,
        )
    )
