"""
DB consistency check helpers for scan handlers.

Runs a periodic background sample check to remove stale asset records
that point to files no longer present on disk.
"""
import asyncio
import time
from typing import Any

from mjr_am_backend.shared import Result, get_logger

from ..core import _normalize_path
from .scan_helpers import _DB_CONSISTENCY_COOLDOWN_SECONDS, _DB_CONSISTENCY_SAMPLE

logger = get_logger(__name__)

_LAST_CONSISTENCY_CHECK = 0.0
_CONSISTENCY_LOCK = asyncio.Lock()


async def _run_consistency_check(db: Any) -> None:
    if not db:
        return
    res = await _query_consistency_sample(db)
    if not res.ok or not isinstance(res.data, list):
        return

    missing = _collect_missing_asset_rows(res.data)
    if not missing:
        return

    logger.warning(
        "Consistency check removed %d stale asset records",
        len(missing),
    )
    await _delete_missing_asset_rows(db, missing)


async def _query_consistency_sample(db: Any) -> Any:
    try:
        return await db.aquery(
            "SELECT id, filepath FROM assets WHERE filepath IS NOT NULL ORDER BY RANDOM() LIMIT ?",
            (_DB_CONSISTENCY_SAMPLE,),
        )
    except Exception as exc:
        logger.debug("Consistency check query failed: %s", exc)
        return Result.Err("QUERY_FAILED", str(exc))


def _collect_missing_asset_rows(rows: list[Any]) -> list[tuple[Any, str]]:
    missing: list[tuple[Any, str]] = []
    for row in rows:
        pair = _missing_asset_row(row)
        if pair is not None:
            missing.append(pair)
    return missing


def _missing_asset_row(row: Any) -> tuple[Any, str] | None:
    if not isinstance(row, dict):
        return None
    asset_id = row.get("id")
    filepath = row.get("filepath")
    if asset_id is None or not filepath:
        return None
    candidate = _normalize_path(str(filepath))
    if not candidate or candidate.exists():
        return None
    return asset_id, str(filepath)


async def _delete_missing_asset_rows(db: Any, missing: list[tuple[Any, str]]) -> None:
    try:
        async with db.atransaction(mode="immediate"):
            for asset_id, filepath in missing:
                await db.aexecute("DELETE FROM assets WHERE id = ?", (asset_id,))
                await db.aexecute("DELETE FROM scan_journal WHERE filepath = ?", (filepath,))
                await db.aexecute("DELETE FROM metadata_cache WHERE filepath = ?", (filepath,))
    except Exception as exc:
        logger.warning("Failed to cleanup stale assets: %s", exc)


async def _maybe_schedule_consistency_check(db: Any) -> None:
    global _LAST_CONSISTENCY_CHECK
    if not db:
        return
    now = time.time()
    async with _CONSISTENCY_LOCK:
        if (now - _LAST_CONSISTENCY_CHECK) < _DB_CONSISTENCY_COOLDOWN_SECONDS:
            return
        _LAST_CONSISTENCY_CHECK = now
    try:
        asyncio.create_task(_run_consistency_check(db))
    except Exception as exc:
        logger.debug("Failed to schedule consistency check: %s", exc)
