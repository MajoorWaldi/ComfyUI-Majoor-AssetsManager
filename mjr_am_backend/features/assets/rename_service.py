"""Rename-oriented asset business logic."""

from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Any, Awaitable, Callable

from ...shared import Result
from .models import AssetRenameTarget


async def rename_asset_and_sync(
    *,
    services: dict[str, Any],
    target: AssetRenameTarget,
    infer_source_and_root_id_from_path: Callable[..., Awaitable[tuple[str, str]]],
    is_within_root: Callable[[Path, Path], bool],
    get_runtime_output_root: Callable[[], str],
    get_input_directory: Callable[[], str],
    list_custom_roots: Callable[[], Any],
    to_thread_timeout_s: int | float,
    safe_error_message: Callable[[Exception, str], str],
    logger: Any = None,
) -> Result[dict[str, Any]]:
    matched_asset_id = target.matched_asset_id
    current_resolved = target.current_resolved
    current_filename = target.current_filename
    current_source = target.current_source
    current_root_id = target.current_root_id
    current_filepath_where = target.filepath_where
    current_filepath_params = target.filepath_params
    new_name = target.new_name

    new_path = current_resolved.parent / new_name
    if new_path.exists():
        same_file = False
        try:
            same_file = bool(new_path.samefile(current_resolved))
        except Exception:
            same_file = False
        same_path_ignoring_case = str(new_path).lower() == str(current_resolved).lower()
        if not (same_file and same_path_ignoring_case):
            return Result.Err("CONFLICT", f"File '{new_name}' already exists")

    try:
        current_resolved.rename(new_path)
    except Exception as exc:
        return Result.Err("RENAME_FAILED", safe_error_message(exc, "Failed to rename file"))

    async def _rollback_physical_rename() -> None:
        try:
            if new_path.exists() and not current_resolved.exists():
                new_path.rename(current_resolved)
        except Exception as rollback_exc:
            if logger:
                logger.error("Failed to rollback rename for asset %s: %s", matched_asset_id, rollback_exc)

    try:
        try:
            mtime = int(new_path.stat().st_mtime)
        except FileNotFoundError:
            await _rollback_physical_rename()
            return Result.Err("NOT_FOUND", "Renamed file does not exist")
        except Exception as exc:
            await _rollback_physical_rename()
            return Result.Err("FS_ERROR", safe_error_message(exc, "Failed to stat renamed file"))

        async with services["db"].atransaction(mode="immediate"):
            defer_fk = await services["db"].aexecute("PRAGMA defer_foreign_keys = ON")
            if not defer_fk.ok:
                raise RuntimeError(defer_fk.error or "Failed to defer foreign key checks")

            if matched_asset_id is not None:
                update_res = await services["db"].aexecute(
                    "UPDATE assets SET filename = ?, filepath = ?, mtime = ? WHERE id = ?",
                    (new_name, str(new_path), mtime, matched_asset_id),
                )
                if not update_res.ok:
                    raise RuntimeError(update_res.error or "Failed to update assets filepath")
                try:
                    updated_rows = int(update_res.data or 0)
                except Exception:
                    updated_rows = 0
                if updated_rows <= 0:
                    raise RuntimeError("Asset row not found for rename")
            else:
                up2 = await services["db"].aexecute(
                    f"UPDATE assets SET filename = ?, filepath = ?, mtime = ? WHERE {current_filepath_where}",
                    (new_name, str(new_path), mtime, *current_filepath_params),
                )
                if not up2.ok:
                    raise RuntimeError(up2.error or "Failed to update assets filepath")

            sj_res = await services["db"].aexecute(
                f"UPDATE scan_journal SET filepath = ? WHERE {current_filepath_where}",
                (str(new_path), *current_filepath_params),
            )
            if not sj_res.ok:
                raise RuntimeError(sj_res.error or "Failed to update scan_journal filepath")

            mc_res = await services["db"].aexecute(
                f"UPDATE metadata_cache SET filepath = ? WHERE {current_filepath_where}",
                (str(new_path), *current_filepath_params),
            )
            if not mc_res.ok:
                raise RuntimeError(mc_res.error or "Failed to update metadata_cache filepath")
    except Exception as exc:
        await _rollback_physical_rename()
        return Result.Err("DB_ERROR", safe_error_message(exc, "Failed to update asset record"))

    try:
        source = current_source
        root_id = current_root_id or None
        if not source:
            inferred_source, inferred_root_id = await infer_source_and_root_id_from_path(
                new_path,
                get_runtime_output_root(),
                is_within_root=is_within_root,
                get_runtime_output_root_fn=get_runtime_output_root,
                get_input_directory=get_input_directory,
                list_custom_roots_fn=list_custom_roots,
                logger=logger,
            )
            source = inferred_source
            root_id = inferred_root_id
        index_svc = services.get("index") if isinstance(services, dict) else None
        if index_svc and hasattr(index_svc, "index_paths"):
            await asyncio.wait_for(
                index_svc.index_paths([new_path], str(new_path.parent), False, source or "output", root_id),
                timeout=to_thread_timeout_s,
            )
    except Exception as exc:
        if logger:
            logger.debug("Post-rename targeted reindex skipped: %s", exc)

    fresh_asset = None
    if matched_asset_id is not None:
        try:
            fr = await services["db"].aquery(
                """
                SELECT a.id, a.filename, a.subfolder, a.filepath, a.source, a.root_id, a.kind, a.ext,
                       a.size, a.mtime, a.width, a.height, a.duration,
                       COALESCE(m.rating, 0) AS rating, COALESCE(m.tags, '[]') AS tags
                FROM assets a
                LEFT JOIN asset_metadata m ON m.asset_id = a.id
                WHERE a.id = ?
                LIMIT 1
                """,
                (matched_asset_id,),
            )
            if fr.ok and fr.data:
                fresh_asset = fr.data[0]
        except Exception:
            fresh_asset = None

    return Result.Ok(
        {
            "renamed": 1,
            "old_name": current_filename,
            "new_name": new_name,
            "old_path": str(current_resolved),
            "new_path": str(new_path),
            "asset": fresh_asset,
        }
    )


__all__ = ["rename_asset_and_sync"]