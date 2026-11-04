"""Prune indexed assets that disappeared from disk during a directory scan.

Like ComfyUI core's asset reconciler (``app/assets/scanner_changes.py``), a
file is only treated as gone when the filesystem positively says so. A stat
that fails for any other reason (permission error, network share hiccup,
unmounted drive) is "unknown" and never deletes a row -- deleting it would
throw away the user's ratings, tags and collections for a file that is
still there. Removed ids are announced with a ``mjr-assets-removed`` event so
open grids drop the cards without a full reload.
"""

from __future__ import annotations

import asyncio
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


_MAX_REMOVED_IDS_IN_EVENT = 1000


def _path_state(filepath: str) -> bool | None:
    """True = on disk, False = definitely gone, None = could not tell."""
    try:
        os.stat(filepath)
        return True
    except (FileNotFoundError, NotADirectoryError):
        return False
    except OSError:
        return None
    except Exception:
        return None


def _path_exists(filepath: str) -> bool:
    """Backward-compatible helper: only a *confirmed* absence returns False."""
    return _path_state(filepath) is not False


def _root_is_readable(directory: str) -> bool:
    """A scan root that cannot be listed (unmounted, offline share) must not be pruned."""
    try:
        with os.scandir(directory) as entries:
            next(entries, None)
        return True
    except OSError:
        return False


def _find_missing_filepaths(candidates: list[tuple[int, str]]) -> list[int]:
    """Stat every candidate off the event loop; return asset ids confirmed missing."""
    return [asset_id for asset_id, filepath in candidates if _path_state(filepath) is False]


def _emit_removed(asset_ids: list[int], *, reason: str, directory: str = "") -> None:
    if not asset_ids:
        return
    try:
        from ...adapters.comfy_events import emit_event

        emit_event(
            "mjr-assets-removed",
            {
                "ids": [int(i) for i in asset_ids[:_MAX_REMOVED_IDS_IN_EVENT]],
                "count": len(asset_ids),
                "truncated": len(asset_ids) > _MAX_REMOVED_IDS_IN_EVENT,
                "reason": reason,
                "directory": directory,
            },
        )
    except Exception:
        logger.debug("_emit_removed: suppressed exception", exc_info=True)


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
            logger.debug("_delete_asset_ids: suppressed exception", exc_info=True)
        res = await scanner.db.aexecute(
            f"DELETE FROM assets WHERE id IN ({placeholders})",
            tuple(batch),
        )
        if not res.ok:
            return Result.Err("DB_ERROR", res.error or "Failed to prune stale assets")
        # ``res.data`` is SQLite's change count, which also includes rows touched
        # by ON DELETE CASCADE and FTS triggers; report assets, not rows.
        try:
            changed = int(res.data or 0)
        except Exception:
            changed = len(batch)
        total += min(len(batch), changed) if changed > 0 else 0
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
    candidates: list[tuple[int, str]] = []
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
        if asset_id > 0:
            candidates.append((asset_id, filepath))

    if not candidates:
        return Result.Ok(0)

    if not await asyncio.to_thread(_root_is_readable, directory):
        logger.warning(
            "Skipping prune: scan root %s is not readable (offline or unmounted?); "
            "%s indexed asset(s) kept",
            directory,
            len(candidates),
        )
        return Result.Ok(0)

    stale_ids = await asyncio.to_thread(_find_missing_filepaths, candidates)
    if not stale_ids:
        return Result.Ok(0)

    deleted_res = await _delete_asset_ids(scanner, stale_ids)
    if deleted_res.ok and int(deleted_res.data or 0) > 0:
        logger.info(
            "Pruned %s stale indexed asset(s) missing from disk under %s",
            int(deleted_res.data or 0),
            directory,
        )
        _emit_removed(stale_ids, reason="scan_prune", directory=directory)
    return deleted_res


__all__ = ["prune_missing_assets_after_scan"]
