"""
Storage and state helpers for scan/index operations.
"""
import asyncio
import logging
from pathlib import Path
from typing import Any

from ...shared import Result, get_logger
from .metadata_helpers import MetadataHelpers
from .scan_batch_utils import (
    STAT_RETRY_BASE_DELAY_S,
    STAT_RETRY_COUNT,
    clean_journal_lookup_paths,
    journal_rows_to_map,
)

logger = get_logger(__name__)


async def get_journal_entry(scanner: Any, *, filepath: str) -> dict[str, Any] | None:
    result = await scanner.db.aquery(
        "SELECT state_hash FROM scan_journal WHERE filepath = ?",
        (filepath,),
    )
    if not result.ok or not result.data:
        return None
    return result.data[0]


async def get_journal_entries(scanner: Any, *, filepaths: list[str]) -> dict[str, str]:
    cleaned = clean_journal_lookup_paths(filepaths)
    if not cleaned:
        return {}
    res = await scanner.db.aquery_in(
        "SELECT filepath, state_hash FROM scan_journal WHERE {IN_CLAUSE}",
        "filepath",
        cleaned,
    )
    if not res.ok:
        return {}
    return journal_rows_to_map(res.data or [])


async def write_scan_journal_entry(
    scanner: Any,
    *,
    filepath: str,
    base_dir: str,
    state_hash: str,
    mtime: int,
    size: int,
) -> Result[Any]:
    dir_path = str(Path(base_dir).resolve())
    return await scanner.db.aexecute(
        """
        INSERT OR REPLACE INTO scan_journal
        (filepath, dir_path, state_hash, mtime, size, last_seen)
        SELECT ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
        WHERE EXISTS (SELECT 1 FROM assets WHERE filepath = ?)
        """,
        (filepath, dir_path, state_hash, mtime, size, filepath),
    )


async def stat_with_retry(scanner: Any, *, file_path: Path):
    for attempt in range(STAT_RETRY_COUNT):
        try:
            stat = await asyncio.to_thread(file_path.stat)
            return True, stat
        except OSError as exc:
            if attempt < (STAT_RETRY_COUNT - 1):
                await asyncio.sleep(STAT_RETRY_BASE_DELAY_S * (attempt + 1))
                continue
            logger.warning("Failed to stat %s after retries: %s", file_path, exc)
            return False, exc


async def asset_has_rich_metadata(scanner: Any, *, asset_id: int) -> bool:
    if not asset_id:
        return False
    row = await scanner.db.aquery(
        "SELECT metadata_quality, metadata_raw FROM asset_metadata WHERE asset_id = ? LIMIT 1",
        (int(asset_id),),
    )
    if not row.ok or not row.data:
        return False
    try:
        data = row.data[0] or {}
        metadata_quality = str(data.get("metadata_quality") or "").strip().lower()
        metadata_raw = str(data.get("metadata_raw") or "").strip()
        return metadata_quality not in ("", "none") or metadata_raw not in ("", "{}", "null")
    except Exception:
        return False


async def write_metadata_row(
    scanner: Any,
    *,
    asset_id: int,
    metadata_result: Result[dict[str, Any]],
    filepath: str | None = None,
) -> None:
    if not metadata_result.ok:
        return
    metadata_write = await MetadataHelpers.write_asset_metadata_row(
        scanner.db,
        asset_id,
        metadata_result,
        filepath=filepath,
    )
    if not metadata_write.ok:
        scanner._log_scan_event(
            logging.WARNING,
            "Failed to write metadata row after transaction",
            asset_id=asset_id,
            error=metadata_write.error,
            stage="metadata_write",
        )
