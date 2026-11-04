"""Merge index rows that point at the same file through different path spellings.

On Windows, paths are case-insensitive and accept both separators, but the
``assets.filepath`` UNIQUE constraint compares exact strings. Indexes built by
older versions (before every insert went through ``normalize_filepath_str``)
can therefore hold several rows for one file, e.g. ``C:\\Out\\a.png`` and
``c:\\out\\a.png``. The grid shows them as a duplicate stack and the user's
rating/tags are split between the copies.

Each group is collapsed onto one row (the canonical spelling when present),
keeping the user's data: the highest rating, the union of tags, the stack
cover, execution/stack ids and the vector embedding. Collections reference
assets by normalized file path, so they are unaffected. Runs at startup and is
a no-op once the index is clean.
"""

from __future__ import annotations

import os
from typing import Any

from ...shared import Result, get_logger

logger = get_logger(__name__)

_COPY_IF_EMPTY_COLUMNS = ("job_id", "stack_id", "workflow_id", "source_node_id")
_SPECIFIC_ASSET_ID_TABLES = {"asset_metadata", "asset_tags"}


def _group_key(filepath: str) -> str:
    return str(filepath or "").replace("\\", "/").lower()


def _canonical(filepath: str) -> str:
    try:
        return os.path.normcase(os.path.normpath(filepath))
    except Exception:
        return filepath


async def _rows(db: Any, sql: str, params: tuple = ()) -> list[dict[str, Any]]:
    res = await db.aquery(sql, params)
    return list(res.data or []) if res.ok else []


async def _existing_columns(db: Any, table: str) -> set[str]:
    return {str(r.get("name")) for r in await _rows(db, f"PRAGMA table_info('{table}')")}


async def _other_asset_id_tables(db: Any) -> list[str]:
    tables = await _rows(db, "SELECT name FROM sqlite_master WHERE type='table'")
    out: list[str] = []
    for row in tables:
        name = str(row.get("name") or "")
        if not name or name in _SPECIFIC_ASSET_ID_TABLES or name == "assets" or "fts" in name:
            continue
        if not name.replace("_", "").isalnum():
            continue
        if "asset_id" in await _existing_columns(db, name):
            out.append(name)
    return out


def _pick_keeper(rows: list[dict[str, Any]]) -> dict[str, Any]:
    for row in rows:
        fp = str(row.get("filepath") or "")
        if fp and fp == _canonical(fp):
            return row
    return min(rows, key=lambda r: int(r.get("id") or 0))


async def _merge_group(db: Any, keep_id: int, dup_ids: list[int], other_tables: list[str]) -> None:
    placeholders = ",".join("?" for _ in dup_ids)
    all_ids = (keep_id, *dup_ids)
    all_ph = ",".join("?" for _ in all_ids)

    # Metadata row: move one over if the keeper has none, then keep the best rating.
    for dup in dup_ids:
        await db.aexecute("UPDATE OR IGNORE asset_metadata SET asset_id = ? WHERE asset_id = ?", (keep_id, dup))
    await db.aexecute(
        f"UPDATE asset_metadata SET rating = (SELECT MAX(COALESCE(rating, 0)) FROM asset_metadata "
        f"WHERE asset_id IN ({all_ph})) WHERE asset_id = ?",
        (*all_ids, keep_id),
    )
    # Tags: INSERT (not UPDATE) so the asset_tags insert trigger refreshes FTS.
    await db.aexecute(
        f"INSERT OR IGNORE INTO asset_tags(asset_id, tag_id) "
        f"SELECT ?, tag_id FROM asset_tags WHERE asset_id IN ({placeholders})",
        (keep_id, *dup_ids),
    )
    await db.aexecute(
        f"UPDATE asset_stacks SET cover_asset_id = ? WHERE cover_asset_id IN ({placeholders})",
        (keep_id, *dup_ids),
    )
    columns = await _existing_columns(db, "assets")
    for col in _COPY_IF_EMPTY_COLUMNS:
        if col not in columns:
            continue
        await db.aexecute(
            f"UPDATE assets SET {col} = (SELECT {col} FROM assets WHERE id IN ({placeholders}) "
            f"AND {col} IS NOT NULL AND {col} != '' LIMIT 1) "
            f"WHERE id = ? AND ({col} IS NULL OR {col} = '')",
            (*dup_ids, keep_id),
        )
    for table in other_tables:
        await db.aexecute(
            f"UPDATE OR IGNORE {table} SET asset_id = ? WHERE asset_id IN ({placeholders})",
            (keep_id, *dup_ids),
        )
    try:
        await db.aexecute(
            f"UPDATE OR IGNORE vec.asset_embeddings SET asset_id = ? WHERE asset_id IN ({placeholders})",
            (keep_id, *dup_ids),
        )
        await db.aexecute(
            f"DELETE FROM vec.asset_embeddings WHERE asset_id IN ({placeholders})", tuple(dup_ids)
        )
    except Exception:
        logger.debug("vector embeddings merge skipped", exc_info=True)
    await db.aexecute(f"DELETE FROM assets WHERE id IN ({placeholders})", tuple(dup_ids))


async def merge_duplicate_asset_rows(db: Any, *, case_insensitive: bool | None = None) -> Result[int]:
    """Collapse rows that are the same file on a case-insensitive filesystem.

    Returns the number of duplicate rows removed (0 when nothing to do).
    """
    if case_insensitive is None:
        case_insensitive = os.name == "nt"
    if not case_insensitive:
        return Result.Ok(0)
    try:
        candidates = await _rows(
            db,
            "SELECT id, filepath FROM assets WHERE LOWER(REPLACE(filepath, '\\', '/')) IN ("
            "SELECT LOWER(REPLACE(filepath, '\\', '/')) FROM assets "
            "GROUP BY LOWER(REPLACE(filepath, '\\', '/')) HAVING COUNT(*) > 1)",
        )
        if not candidates:
            return Result.Ok(0)
        groups: dict[str, list[dict[str, Any]]] = {}
        for row in candidates:
            groups.setdefault(_group_key(str(row.get("filepath") or "")), []).append(row)
        other_tables = await _other_asset_id_tables(db)
        removed = 0
        async with db.atransaction(mode="immediate") as tx:
            if not tx.ok:
                return Result.Err("DB_ERROR", tx.error or "Failed to begin transaction")
            for rows in groups.values():
                if len(rows) < 2:
                    continue
                keeper = _pick_keeper(rows)
                keep_id = int(keeper["id"])
                dup_ids = [int(r["id"]) for r in rows if int(r["id"]) != keep_id]
                await _merge_group(db, keep_id, dup_ids, other_tables)
                removed += len(dup_ids)
        if not tx.ok:
            return Result.Err("DB_ERROR", tx.error or "Commit failed")
        if removed:
            logger.info("Merged %s duplicate index row(s) that pointed at the same file", removed)
        return Result.Ok(removed)
    except Exception as exc:
        logger.warning("Duplicate asset row merge skipped: %s", exc)
        return Result.Err("DB_ERROR", str(exc))


__all__ = ["merge_duplicate_asset_rows"]
