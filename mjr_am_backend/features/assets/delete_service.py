"""Delete-oriented asset business logic."""

from __future__ import annotations

from collections.abc import Callable
from pathlib import Path
from typing import Any

from ...shared import Result
from ...shared import sanitize_error_message as _safe_error_message
from .models import AssetDeleteTarget


async def _execute_cleanup_delete(
    services: dict[str, Any],
    sql: str,
    params: tuple[Any, ...],
    *,
    label: str,
) -> str | None:
    result = await services["db"].aexecute(sql, params)
    if result.ok:
        return None
    return f"{label}: {result.error or 'delete failed'}"


def delete_file_best_effort(path: Path) -> Result[bool]:
    """Delete a file using send2trash, falling back to unlink."""
    try:
        if not path.exists() or not path.is_file():
            return Result.Ok(True, method="noop")
    except Exception as exc:
        return Result.Err("DELETE_FAILED", _safe_error_message(exc, "Failed to stat file"))

    try:
        from send2trash import send2trash  # type: ignore

        try:
            send2trash(str(path))
            return Result.Ok(True, method="send2trash")
        except Exception as exc:
            try:
                path.unlink(missing_ok=True)
                return Result.Ok(True, method="unlink_fallback", warning=_safe_error_message(exc, "send2trash failed"))
            except Exception as exc2:
                return Result.Err("DELETE_FAILED", _safe_error_message(exc2, "Failed to delete file"))
    except Exception:
        try:
            path.unlink(missing_ok=True)
            return Result.Ok(True, method="unlink")
        except Exception as exc:
            return Result.Err("DELETE_FAILED", _safe_error_message(exc, "Failed to delete file"))


async def delete_asset_and_cleanup(
    *,
    services: dict[str, Any],
    target: AssetDeleteTarget,
    delete_file_safe: Callable[[Path], Result[Any]],
    safe_error_message: Callable[[Exception, str], str],
    logger: Any = None,
) -> Result[dict[str, Any]]:
    matched_asset_id = target.matched_asset_id
    resolved = target.resolved_path
    resolved_filepath_where = target.filepath_where
    resolved_filepath_params = target.filepath_params

    try:
        del_res = delete_file_safe(resolved)
        if not del_res.ok:
            raise RuntimeError(str(del_res.error or "delete failed"))
    except Exception as exc:
        return Result.Err(
            "DELETE_FAILED",
            "Failed to delete file",
            errors=[{"asset_id": matched_asset_id, "error": safe_error_message(exc, "File deletion failed")}],
            aborted=True,
        )

    db_cleanup_errors: list[str] = []
    try:
        async with services["db"].atransaction(mode="immediate"):
            if matched_asset_id is not None:
                cleanup_error = await _execute_cleanup_delete(
                    services,
                    "DELETE FROM assets WHERE id = ?",
                    (matched_asset_id,),
                    label="assets",
                )
                if cleanup_error:
                    db_cleanup_errors.append(cleanup_error)
            else:
                cleanup_error = await _execute_cleanup_delete(
                    services,
                    f"DELETE FROM assets WHERE {resolved_filepath_where}",
                    resolved_filepath_params,
                    label="assets",
                )
                if cleanup_error:
                    db_cleanup_errors.append(cleanup_error)
            cleanup_error = await _execute_cleanup_delete(
                services,
                f"DELETE FROM scan_journal WHERE {resolved_filepath_where}",
                resolved_filepath_params,
                label="scan_journal",
            )
            if cleanup_error:
                db_cleanup_errors.append(cleanup_error)
            cleanup_error = await _execute_cleanup_delete(
                services,
                f"DELETE FROM metadata_cache WHERE {resolved_filepath_where}",
                resolved_filepath_params,
                label="metadata_cache",
            )
            if cleanup_error:
                db_cleanup_errors.append(cleanup_error)
    except Exception as exc:
        db_cleanup_errors.append(safe_error_message(exc, "DB cleanup failed"))

    if db_cleanup_errors:
        if logger:
            logger.error(
                "File deleted but DB cleanup failed for asset_id=%s path=%s: %s",
                matched_asset_id,
                resolved,
                "; ".join(db_cleanup_errors),
            )
        return Result.Ok(
            {
                "deleted": 1,
                "db_cleanup_ok": False,
                "warning": "File deleted but database cleanup failed",
                "db_errors": db_cleanup_errors,
            }
        )

    return Result.Ok({"deleted": 1, "db_cleanup_ok": True})


__all__ = ["delete_asset_and_cleanup", "delete_file_best_effort"]
