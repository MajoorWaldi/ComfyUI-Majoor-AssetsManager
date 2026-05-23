"""Prune indexed assets that disappeared from disk during a directory scan."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from ...shared import Result, get_logger
from .scan_batch_utils import normalize_filepath_str

logger = get_logger(__name__)

_DELETE_BATCH_SIZE = 500


def _escape_like(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _normalize_root(directory: str) -> str:
    return normalize_filepath_str(str(Path(directory).resolve(strict=False)))


def _is_direct_child(filepath: str, root: str) -> bool:
    try:
        return normalize_filepath_str(str(Path(filepath).parent)) == root
    except Exception:
        return False


def _path_exists(filepath: str) -> bool:
    try:
        return Path(filepath).exists()
    except OSError:
        return False


def _source_root_clause(source: str, root_id: str | None) -> tuple[str, list[Any]]:
    params: list[Any] = [str(source or "output").strip().lower() or "output"]
    clause = "LOWER(COALESCE(source, '')) = ?"
    if root_id:
        clause += " AND COALESCE(root_id, '') = ?"
        params.append(str(root_id))
    else:
        clause += " AND COALESCE(root_id, '') = ''"
    return clause, params


async def _candidate_rows(
    scanner: Any,
    *,
    directory: str,
    source: str,
    root_id: str | None,
) -> Result[list[dict[str, Any]]]:
    root = _normalize_root(directory)
    prefix = root.rstrip(os.sep) + os.sep
    escaped_prefix = _escape_like(prefix)
    source_clause, params = _source_root_clause(source, root_id)
    sql = f"""
        SELECT id, filepath
        FROM assets
        WHERE {source_clause}
          AND (filepath = ? OR filepath LIKE ? ESCAPE '\\')
    """
    params.extend([root, f"{escaped_prefix}%"])
    return await scanner.db.aquery(sql, tuple(params))


async def _delete_asset_ids(scanner: Any, asset_ids: list[int]) -> Result[int]:
    total = 0
    for start in range(0, len(asset_ids), _DELETE_BATCH_SIZE):
        batch = asset_ids[start : start + _DELETE_BATCH_SIZE]
        placeholders = ",".join("?" for _ in batch)
        try:
            await scanner.db.aexecute(
                f"DELETE FROM vec.asset_embeddings WHERE asset_id IN ({placeholders})",
                tuple(batch),
            )
        except Exception:
            pass
        res = await scanner.db.aexecute(
            f"DELETE FROM assets WHERE id IN ({placeholders})",
            tuple(batch),
        )
        if not res.ok:
            return Result.Err("DB_ERROR", res.error or "Failed to prune stale assets")
        try:
            total += int(res.data or 0)
        except Exception:
            total += len(batch)
    return Result.Ok(total)


async def prune_missing_assets_after_scan(
    scanner: Any,
    *,
    directory: str,
    recursive: bool,
    source: str,
    root_id: str | None,
) -> Result[int]:
    rows_res = await _candidate_rows(
        scanner,
        directory=directory,
        source=source,
        root_id=root_id,
    )
    if not rows_res.ok:
        return Result.Err(rows_res.code or "DB_ERROR", rows_res.error or "Failed to inspect indexed assets")

    root = _normalize_root(directory)
    stale_ids: list[int] = []
    for row in rows_res.data or []:
        filepath = normalize_filepath_str(str(row.get("filepath") or ""))
        if not filepath:
            continue
        if not recursive and not _is_direct_child(filepath, root):
            continue
        try:
            asset_id = int(row.get("id") or 0)
        except (TypeError, ValueError):
            continue
        if asset_id > 0 and not _path_exists(filepath):
            stale_ids.append(asset_id)

    if not stale_ids:
        return Result.Ok(0)

    deleted_res = await _delete_asset_ids(scanner, stale_ids)
    if deleted_res.ok and int(deleted_res.data or 0) > 0:
        logger.info(
            "Pruned %s stale indexed asset(s) missing from disk under %s",
            int(deleted_res.data or 0),
            directory,
        )
    return deleted_res


__all__ = ["prune_missing_assets_after_scan"]
