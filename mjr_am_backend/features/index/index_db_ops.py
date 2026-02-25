"""
Database write operations for indexing.
"""
import logging
from pathlib import Path
from typing import Any

from ...shared import FileKind, Result
from .entry_builder import asset_dimensions_from_metadata
from .metadata_helpers import MetadataHelpers


async def add_asset(
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
    source: str = "output",
    root_id: str | None = None,
    write_metadata: bool = True,
    skip_lock: bool = False,
) -> Result[dict[str, str]]:
    width, height, duration = asset_dimensions_from_metadata(metadata_result)

    insert_result = await scanner.db.aexecute(
        """
        INSERT INTO assets
        (filename, subfolder, filepath, source, root_id, kind, ext, width, height, duration, size, mtime)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            filename,
            subfolder,
            filepath,
            str(source or "output"),
            str(root_id) if root_id else None,
            kind,
            Path(filename).suffix.lower(),
            width,
            height,
            duration,
            size,
            mtime,
        ),
    )

    if not insert_result.ok:
        return Result.Err("INSERT_FAILED", insert_result.error or "Failed to insert asset")

    asset_id = insert_result.data if insert_result.ok else None
    if not asset_id:
        return Result.Err("INSERT_FAILED", "Failed to get inserted asset ID")
    await write_asset_metadata_if_needed(
        scanner,
        asset_id=asset_id,
        metadata_result=metadata_result,
        filepath=filepath,
        write_metadata=write_metadata,
        skip_lock=skip_lock,
    )

    return Result.Ok({"action": "added", "asset_id": asset_id})


async def write_asset_metadata_if_needed(
    scanner: Any,
    *,
    asset_id: Any,
    metadata_result: Result[dict[str, Any]],
    filepath: str,
    write_metadata: bool,
    skip_lock: bool,
) -> None:
    if not write_metadata or skip_lock:
        return
    metadata_write = await MetadataHelpers.write_asset_metadata_row(
        scanner.db,
        asset_id,
        metadata_result,
        filepath=filepath,
    )
    if metadata_write.ok:
        return
    scanner._log_scan_event(
        logging.WARNING,
        "Failed to insert metadata row",
        asset_id=asset_id,
        error=metadata_write.error,
        stage="metadata_write",
    )


async def update_asset(
    scanner: Any,
    *,
    asset_id: int,
    file_path: Path,
    mtime: int,
    size: int,
    metadata_result: Result[dict[str, Any]],
    source: str = "output",
    root_id: str | None = None,
    write_metadata: bool = True,
    skip_lock: bool = False,
) -> Result[dict[str, str]]:
    width = None
    height = None
    duration = None

    if metadata_result.ok and metadata_result.data:
        meta = metadata_result.data
        width = meta.get("width")
        height = meta.get("height")
        duration = meta.get("duration")

    async def _run_update():
        update_result = await scanner.db.aexecute(
            """
            UPDATE assets
            SET width = COALESCE(?, width),
                height = COALESCE(?, height),
                duration = COALESCE(?, duration),
                size = ?, mtime = ?,
                source = ?, root_id = ?,
                content_hash = NULL,
                phash = NULL,
                hash_state = NULL,
                indexed_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (width, height, duration, size, mtime, str(source or "output"), str(root_id) if root_id else None, asset_id),
        )

        if not update_result.ok:
            return Result.Err("UPDATE_FAILED", update_result.error)

        if write_metadata and not skip_lock:
            metadata_write = await MetadataHelpers.write_asset_metadata_row(
                scanner.db,
                asset_id,
                metadata_result,
                filepath=str(file_path) if file_path else None,
            )
            if not metadata_write.ok:
                scanner._log_scan_event(
                    logging.WARNING,
                    "Failed to update metadata row",
                    asset_id=asset_id,
                    error=metadata_write.error,
                    stage="metadata_write",
                )
        return Result.Ok({"action": "updated", "asset_id": asset_id})

    if skip_lock:
        return await _run_update()

    async with scanner.db.lock_for_asset(asset_id):
        return await _run_update()
