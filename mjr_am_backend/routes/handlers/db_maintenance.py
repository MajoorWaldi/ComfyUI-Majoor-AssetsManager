"""
Database maintenance endpoints (safe, opt-in).
"""

from __future__ import annotations

import asyncio
import datetime
import gc
import os
import threading
from pathlib import Path
from typing import Any

from aiohttp import web
from mjr_am_backend.config import INDEX_DB_PATH, get_runtime_output_root, is_vector_search_enabled
from mjr_am_backend.custom_roots import resolve_custom_root
from mjr_am_backend.runtime_activity import is_generation_busy
from mjr_am_backend.shared import FileKind, Result, get_logger

from ..core import (
    _csrf_error,
    _json_response,
    _read_json,
    _require_operation_enabled,
    _require_services,
    _require_write_access,
    _resolve_security_prefs,
    audit_log_write,
    safe_error_message,
)
from ..db_maintenance import archive_runtime, backfill_jobs, vector_runtime

logger = get_logger(__name__)

_DB_ARCHIVE_DIR = INDEX_DB_PATH.parent / "archive"
_DB_MAINTENANCE_ACTIVE = False
_DB_MAINT_LOCK = threading.Lock()

# Backfill job scope validation (kept here for HTTP param parsing)
_VECTOR_BACKFILL_VALID_SCOPES = backfill_jobs.VALID_SCOPES


_parse_bool_flag = backfill_jobs.parse_bool_flag
_normalize_backfill_scope = backfill_jobs.normalize_scope


def _read_vector_backfill_scope_params(request: web.Request) -> tuple[str, str, Result | None]:
    scope = _normalize_backfill_scope(request.query.get("scope"))
    if not scope:
        return "", "", Result.Err(
            "INVALID_INPUT",
            "Invalid scope. Must be one of: output, input, custom, all",
        )

    custom_root_id = str(
        request.query.get("custom_root_id")
        or request.query.get("root_id")
        or ""
    ).strip()

    if scope == "custom":
        if not custom_root_id:
            return "", "", Result.Err("INVALID_INPUT", "Missing custom_root_id for custom scope")
        root_result = resolve_custom_root(custom_root_id)
        if not root_result.ok:
            return "", "", Result.Err("INVALID_INPUT", root_result.error or "Invalid custom root")
    else:
        custom_root_id = ""

    return scope, custom_root_id, None


# ---------------------------------------------------------------------------
# Backfill job state — delegated to backfill_jobs module
# ---------------------------------------------------------------------------
_utc_now_iso = backfill_jobs.utc_now_iso
_vector_backfill_job_public = backfill_jobs.job_public
_vector_backfill_get_job = backfill_jobs.get_job
_vector_backfill_get_active_or_latest_job = backfill_jobs.get_active_or_latest_job
is_vector_backfill_active = backfill_jobs.is_active
_vector_backfill_priority_remaining_seconds = backfill_jobs.priority_remaining_seconds
request_vector_backfill_priority_window = backfill_jobs.request_priority_window
_clear_vector_backfill_priority_window = backfill_jobs.clear_priority_window
_vector_backfill_wait_for_priority_window = backfill_jobs.wait_for_priority_window
_vector_backfill_register_job = backfill_jobs.register_job
_vector_backfill_prune_history = backfill_jobs.prune_history
_vector_backfill_update_job = backfill_jobs.update_job


async def _stop_index_enrichment(index_service: Any) -> None:
    """Stop metadata enrichment on the index service, if supported."""
    if index_service and hasattr(index_service, "stop_enrichment"):
        try:
            await index_service.stop_enrichment(clear_queue=True)
        except Exception:
            pass


def _invalidate_vector_searcher(svc: Any) -> None:
    """Invalidate the vector searcher cache, if present in *svc*."""
    if not isinstance(svc, dict):
        return
    searcher = svc.get("vector_searcher")
    if searcher and hasattr(searcher, "invalidate"):
        try:
            searcher.invalidate()
        except Exception:
            pass


async def _run_vector_backfill_job(
    *,
    backfill_id: str,
    svc: dict[str, Any],
    db: Any,
    vector_service: Any,
    batch_size: int,
    scope: str = "output",
    custom_root_id: str = "",
) -> None:
    _vector_backfill_update_job(backfill_id, status="running", started_at=_utc_now_iso(), code=None, error=None)
    _clear_vector_backfill_priority_window()
    set_db_maintenance_active(True)
    watcher_was_running = False
    try:
        watcher_was_running = await _stop_watcher_if_running(svc if isinstance(svc, dict) else None)
        await _stop_index_enrichment(_vector_backfill_index_service(svc))
        backfill_res = await _run_vector_backfill_payload(
            backfill_id=backfill_id,
            db=db,
            vector_service=vector_service,
            batch_size=batch_size,
            scope=scope,
            custom_root_id=custom_root_id,
        )
        if not backfill_res.ok:
            _vector_backfill_update_job(
                backfill_id,
                status="failed",
                finished_at=_utc_now_iso(),
                code=str(backfill_res.code or "DB_ERROR"),
                error=str(backfill_res.error or "Vector backfill failed"),
            )
            return
        _invalidate_vector_searcher(svc)
        _vector_backfill_complete_job(backfill_id, scope=scope, custom_root_id=custom_root_id, payload=backfill_res.data or {})
    except Exception as exc:
        backfill_jobs.fail_job(backfill_id, safe_error_message(exc, "Vector backfill failed"))
    finally:
        _clear_vector_backfill_priority_window()
        try:
            await _restart_watcher_if_needed(svc if isinstance(svc, dict) else None, watcher_was_running)
        except Exception:
            pass
        set_db_maintenance_active(False)
        backfill_jobs.clear_active_job_id(backfill_id)
        _vector_backfill_prune_history()


def _vector_backfill_index_service(svc: dict[str, Any] | None) -> Any:
    return svc.get("index") if isinstance(svc, dict) else None


async def _run_vector_backfill_payload(
    *,
    backfill_id: str,
    db: Any,
    vector_service: Any,
    batch_size: int,
    scope: str,
    custom_root_id: str,
) -> Result[dict[str, int | str | None]]:
    def _on_progress(progress: dict[str, int]) -> None:
        _vector_backfill_update_job(backfill_id, progress=dict(progress or {}))

    return await _backfill_missing_asset_vectors(
        db,
        vector_service,
        batch_size=batch_size,
        scope=scope,
        custom_root_id=custom_root_id,
        on_progress=_on_progress,
    )


_vector_backfill_complete_job = backfill_jobs.complete_job


def _archive_root_resolved() -> Path:
    return archive_runtime.archive_root_resolved(_DB_ARCHIVE_DIR)


def _resolve_archive_source(name: str) -> Path | None:
    return archive_runtime.resolve_archive_source(name, _DB_ARCHIVE_DIR)


def _basename_list(paths: list[str]) -> str:
    return archive_runtime.basename_list(paths)


def _task_done_logger(label: str):
    return archive_runtime.task_done_logger(label)


def _spawn_background_task(coro, *, label: str) -> None:
    return archive_runtime.spawn_background_task(coro, label=label)


def is_db_maintenance_active() -> bool:
    with _DB_MAINT_LOCK:
        return bool(_DB_MAINTENANCE_ACTIVE)


def set_db_maintenance_active(active: bool) -> None:
    global _DB_MAINTENANCE_ACTIVE
    with _DB_MAINT_LOCK:
        _DB_MAINTENANCE_ACTIVE = bool(active)


def _generation_busy_result() -> Result[dict[str, Any]]:
    return Result.Err(
        "COMFY_BUSY",
        "ComfyUI is currently executing. Retry this database operation when the queue is idle.",
    )


async def _stop_watcher_if_running(svc: dict | None) -> bool:
    return await archive_runtime.stop_watcher_if_running(svc)


async def _restart_watcher_if_needed(svc: dict | None, should_restart: bool) -> None:
    return await archive_runtime.restart_watcher_if_needed(
        svc,
        should_restart,
        resolve_watcher_restart_paths_fn=_resolve_watcher_restart_paths,
    )


def _resolve_watcher_restart_paths(svc: dict[str, Any], build_watch_paths: Any) -> list[Path]:
    return archive_runtime.resolve_watcher_restart_paths(svc, build_watch_paths)


def _backup_name(now: datetime.datetime | None = None) -> str:
    return archive_runtime.backup_name(now)


def _next_backup_target() -> Path:
    return archive_runtime.next_backup_target(_DB_ARCHIVE_DIR, backup_name_fn=_backup_name)


def _list_backup_files() -> list[dict[str, str | int]]:
    return archive_runtime.list_backup_files(_DB_ARCHIVE_DIR)


def _sqlite_backup_file(src: Path, dst: Path) -> None:
    return archive_runtime.sqlite_backup_file(src, dst)


def _emit_restore_status(step: str, level: str = "info", message: str | None = None, **extra) -> None:
    return archive_runtime.emit_restore_status(step, level, message, **extra)


async def _remove_with_retry(path: Path, attempts: int = 6) -> None:
    return await archive_runtime.remove_with_retry(path, attempts)


def _is_windows_sharing_violation(exc: Exception) -> bool:
    return archive_runtime.is_windows_sharing_violation(exc)


async def _release_windows_db_lockers(path: Path, db: Any | None) -> list[int]:
    return await archive_runtime.release_windows_db_lockers(path, db)


async def _replace_db_from_backup(src: Path, dst: Path) -> None:
    return await archive_runtime.replace_db_from_backup(
        src,
        dst,
        remove_with_retry_fn=_remove_with_retry,
    )


def _normalize_asset_row_for_case_cleanup(row: dict) -> tuple[int, str]:
    return vector_runtime.normalize_asset_row_for_case_cleanup(row)


def _collect_case_duplicate_ids(rows: list[dict]) -> tuple[int, list[int], int]:
    return vector_runtime.collect_case_duplicate_ids(rows)


async def _cleanup_assets_case_duplicates(db) -> Result[dict[str, int]]:
    return await vector_runtime.cleanup_assets_case_duplicates(db)


def _extract_filename_prefix(filename: str) -> str:
    return vector_runtime.extract_filename_prefix(filename)


async def _backfill_job_ids_by_prefix(db) -> Result[dict[str, int]]:
    return await vector_runtime.backfill_job_ids_by_prefix(db)


def _build_backfill_scope_clause(normalized_scope: str, normalized_custom_root: str) -> tuple[str, list[Any]]:
    return vector_runtime.build_backfill_scope_clause(normalized_scope, normalized_custom_root)


async def _process_backfill_row(
    db: Any,
    vector_service: Any,
    row: dict[str, Any],
    index_asset_vector: Any,
) -> tuple[str, int]:
    return await vector_runtime.process_backfill_row(
        db,
        vector_service,
        row,
        index_asset_vector,
        wait_for_priority_window_fn=_vector_backfill_wait_for_priority_window,
    )


def _parse_backfill_asset_id(row: dict[str, Any]) -> int:
    return vector_runtime.parse_backfill_asset_id(row)


def _parse_backfill_file_context(row: dict[str, Any]) -> tuple[str, FileKind]:
    return vector_runtime.parse_backfill_file_context(row)


def _parse_backfill_metadata_raw(row: dict[str, Any]) -> dict[str, Any] | None:
    return vector_runtime.parse_backfill_metadata_raw(row)


async def _init_backfill_counters(
    db: Any,
    scope_sql: str,
    scope_params: list[Any],
    batch_size: int,
    on_progress: Any | None,
) -> Result[_BackfillCounters]:
    return await vector_runtime.init_backfill_counters(
        db,
        scope_sql,
        scope_params,
        batch_size,
        on_progress,
    )


async def _backfill_missing_asset_vectors(
    db: Any,
    vector_service: Any,
    *,
    batch_size: int = 64,
    scope: str = "output",
    custom_root_id: str = "",
    on_progress: Any | None = None,
) -> Result[dict[str, int | str | None]]:
    return await vector_runtime.backfill_missing_asset_vectors(
        db,
        vector_service,
        batch_size=batch_size,
        scope=scope,
        custom_root_id=custom_root_id,
        on_progress=on_progress,
        normalize_scope_fn=_normalize_backfill_scope,
        wait_for_priority_window_fn=_vector_backfill_wait_for_priority_window,
    )


def _normalize_backfill_batch_size(batch_size: int) -> int:
    return vector_runtime.normalize_backfill_batch_size(batch_size)


_BACKFILL_SCOPE_TOTALS_SQL = """
        SELECT
            COUNT(*) AS eligible_total,
            COALESCE(
                SUM(
                    CASE
                        WHEN ae.asset_id IS NULL OR ae.vector IS NULL OR length(ae.vector) = 0 THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS candidate_total
        FROM assets a
        LEFT JOIN vec.asset_embeddings ae ON ae.asset_id = a.id
        WHERE a.kind IN ('image', 'video')
        """


def _safe_row_int(row: Any, key: str) -> int:
    return vector_runtime.safe_row_int(row, key)


async def _count_backfill_scope_totals(
    *,
    db: Any,
    scope_sql: str,
    scope_params: list[Any],
) -> Result[dict[str, int]]:
    return await vector_runtime.count_backfill_scope_totals(
        db=db,
        scope_sql=scope_sql,
        scope_params=scope_params,
    )


def _normalize_backfill_custom_root(normalized_scope: str, custom_root_id: str) -> str:
    return vector_runtime.normalize_backfill_custom_root(normalized_scope, custom_root_id)


_BackfillCounters = vector_runtime.BackfillCounters


def _emit_backfill_progress(on_progress: Any | None, counters: _BackfillCounters) -> None:
    return vector_runtime.emit_backfill_progress(on_progress, counters)


async def _run_backfill_vector_query_loop(
    *,
    db: Any,
    vector_service: Any,
    index_asset_vector: Any,
    scope_sql: str,
    scope_params: list[Any],
    counters: _BackfillCounters,
    on_progress: Any | None,
) -> Result[dict[str, int | str | None]]:
    return await vector_runtime.run_backfill_vector_query_loop(
        db=db,
        vector_service=vector_service,
        index_asset_vector=index_asset_vector,
        scope_sql=scope_sql,
        scope_params=scope_params,
        counters=counters,
        on_progress=on_progress,
        wait_for_priority_window_fn=_vector_backfill_wait_for_priority_window,
    )


async def _query_missing_vector_rows(
    *,
    db: Any,
    last_id: int,
    scope_sql: str,
    scope_params: list[Any],
    batch_size: int,
) -> Result[list[dict[str, Any]]]:
    return await vector_runtime.query_missing_vector_rows(
        db=db,
        last_id=last_id,
        scope_sql=scope_sql,
        scope_params=scope_params,
        batch_size=batch_size,
    )


async def _process_backfill_rows(
    rows: list[dict[str, Any]],
    db: Any,
    vector_service: Any,
    index_asset_vector: Any,
    counters: _BackfillCounters,
    on_progress: Any | None,
) -> int:
    return await vector_runtime.process_backfill_rows(
        rows,
        db,
        vector_service,
        index_asset_vector,
        counters,
        on_progress,
        wait_for_priority_window_fn=_vector_backfill_wait_for_priority_window,
    )


def _accumulate_backfill_outcome(counters: _BackfillCounters, outcome: str) -> None:
    return vector_runtime.accumulate_backfill_outcome(counters, outcome)


def register_db_maintenance_routes(routes: web.RouteTableDef) -> None:
    """Register database maintenance routes."""
    async def _audit_db_maintenance_write(
        services: dict[str, Any] | None,
        request: web.Request,
        operation: str,
        target: str,
        result: Result,
        **details: Any,
    ) -> None:
        try:
            await audit_log_write(
                services if isinstance(services, dict) else {},
                request=request,
                operation=operation,
                target=target,
                result=result,
                details=details or None,
            )
        except Exception as exc:
            logger.debug("DB maintenance audit logging skipped for %s: %s", operation, exc)

    @routes.post("/mjr/am/db/optimize")
    async def db_optimize(request: web.Request):
        """
        Run SQLite maintenance pragmas (best-effort).

        This is useful after large scans or deletes.
        Always returns Result (never throws to UI).
        """
        csrf = _csrf_error(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))
        auth = _require_write_access(request)
        if not auth.ok:
            return _json_response(auth)
        if is_generation_busy(include_cooldown=False):
            return _json_response(_generation_busy_result())

        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)

        db = svc.get("db") if isinstance(svc, dict) else None
        if not db:
            return _json_response(Result.Err("SERVICE_UNAVAILABLE", "Database service unavailable"))

        steps = []
        try:
            try:
                await db.aquery("PRAGMA optimize", ())
                steps.append("PRAGMA optimize")
            except Exception as exc:
                logger.debug("DB optimize step failed: %s", exc)
            try:
                await db.aquery("ANALYZE", ())
                steps.append("ANALYZE")
            except Exception as exc:
                logger.debug("DB analyze step failed: %s", exc)
        except Exception as exc:
            result: Result[Any] = Result.Err("DB_ERROR", safe_error_message(exc, "Database optimize failed"))
            await _audit_db_maintenance_write(svc, request, "db_optimize", "db:optimize", result)
            return _json_response(result)

        result = Result.Ok({"ran": steps})
        await _audit_db_maintenance_write(svc, request, "db_optimize", "db:optimize", result, steps=steps)
        return _json_response(result)

    @routes.post("/mjr/am/db/force-delete")
    async def db_force_delete(request: web.Request):
        """
        Emergency nuclear DB delete.

        Bypasses the DB adapter entirely: closes connections, force-deletes the
        SQLite files from disk (with retry + GC for Windows file locks), then
        reinitializes the adapter and triggers a background rescan.

        This works even when the DB is malformed and normal reset/security-pref
        queries would fail.  Only requires CSRF check (no DB-dependent security).
        """
        from pathlib import Path

        from mjr_am_backend.config import INDEX_DB_PATH

        csrf = _csrf_error(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))
        if is_generation_busy(include_cooldown=False):
            return _json_response(_generation_busy_result())
        auth = _require_write_access(request)
        if not auth.ok:
            return _json_response(auth)

        try:
            svc_gate, err_gate = await _require_services()
        except Exception:
            svc_gate, err_gate = None, None
        if not err_gate and isinstance(svc_gate, dict):
            prefs = await _resolve_security_prefs(svc_gate)
            if prefs is not None:
                op = _require_operation_enabled("reset_index", prefs=prefs)
                if not op.ok:
                    return _json_response(op)
            else:
                logger.warning("Force-delete DB: security prefs unavailable, skipping reset_index gate")

        set_db_maintenance_active(True)
        _emit_restore_status("started", "info", operation="delete_db")
        watcher_was_running = False
        # Best-effort: get services, but don't fail if DB is broken
        svc = None
        db = None
        index_service = None
        try:
            svc, _ = await _require_services()
            if isinstance(svc, dict):
                db = svc.get("db")
                index_service = svc.get("index")
                watcher_was_running = await _stop_watcher_if_running(svc)
                _emit_restore_status("stopping_workers", "info", operation="delete_db")
                if index_service and hasattr(index_service, "stop_enrichment"):
                    try:
                        await index_service.stop_enrichment(clear_queue=True)
                    except Exception:
                        pass
        except Exception:
            pass

        logger.warning("Force-delete DB requested (emergency recovery)")
        try:
            # 1. Try to drain the adapter's connections (best-effort)
            if db is not None:
                try:
                    _emit_restore_status("delete_db", "info", operation="delete_db")
                    reset_res = await db.areset()
                    if not bool(getattr(reset_res, "ok", False)):
                        raise RuntimeError(str(getattr(reset_res, "error", None) or "DB adapter areset() returned error"))
                    logger.info("DB adapter areset() succeeded")
                    _emit_restore_status("recreate_db", "info", operation="delete_db")
                    # If areset worked, skip the manual file deletion
                    started_scans = []
                    if index_service:
                        try:
                            base_path = str(Path(get_runtime_output_root()).resolve(strict=False))
                            _emit_restore_status("restarting_scan", "info", operation="delete_db")
                            _spawn_background_task(
                                index_service.scan_directory(
                                    base_path,
                                    recursive=True,
                                    incremental=False,
                                    source="output",
                                    fast=True,
                                    background_metadata=True,
                                ),
                                label="db_force_delete_scan_output",
                            )
                            started_scans.append(base_path)
                        except Exception:
                            pass
                        try:
                            import folder_paths  # type: ignore
                            input_path = str(Path(folder_paths.get_input_directory()).resolve())
                            _spawn_background_task(
                                index_service.scan_directory(
                                    input_path,
                                    recursive=True,
                                    incremental=False,
                                    source="input",
                                    fast=True,
                                    background_metadata=True,
                                ),
                                label="db_force_delete_scan_input",
                            )
                            started_scans.append(input_path)
                        except Exception:
                            pass
                    _emit_restore_status("done", "success", operation="delete_db")
                    result = Result.Ok({
                        "method": "adapter_reset",
                        "deleted": True,
                        "scans_triggered": started_scans,
                    })
                    await _audit_db_maintenance_write(
                        svc if isinstance(svc, dict) else {},
                        request,
                        "db_force_delete",
                        "db:force_delete",
                        result,
                        method="adapter_reset",
                        scans=len(started_scans),
                    )
                    return _json_response(result)
                except Exception as exc:
                    logger.warning("DB adapter areset() failed (%s), falling back to manual file delete", exc)
                    # Close whatever we can before manual delete
                    try:
                        await db.aclose()
                    except Exception:
                        pass

            # 2. Force GC to release file handles (critical on Windows)
            gc.collect()
            await asyncio.sleep(0.3)
            gc.collect()

            # 3. Manually delete DB files from disk
            base = str(INDEX_DB_PATH)
            deleted_files = []
            failed_files = []
            _emit_restore_status("delete_db", "info", operation="delete_db")
            for suffix in ("", "-wal", "-shm", "-journal"):
                p = Path(base + suffix)
                if not p.exists():
                    continue
                removed = False
                forced_release_attempted = False
                for attempt in range(6):
                    try:
                        p.unlink()
                        deleted_files.append(str(p))
                        removed = True
                        break
                    except Exception as exc:
                        if (
                            not forced_release_attempted
                            and _is_windows_sharing_violation(exc)
                        ):
                            forced_release_attempted = True
                            killed = await _release_windows_db_lockers(p, db)
                            if killed:
                                logger.warning(
                                    "Force-delete terminated locking process(es) for %s: %s",
                                    p,
                                    ", ".join(str(pid) for pid in killed),
                                )
                                gc.collect()
                                await asyncio.sleep(0.5)
                                continue
                        gc.collect()
                        if isinstance(exc, PermissionError) or _is_windows_sharing_violation(exc):
                            await asyncio.sleep(0.3 * (attempt + 1))
                            continue
                        break
                if not removed and p.exists():
                    failed_files.append(str(p))

            if failed_files:
                logger.error("Force-delete: could not remove files: %s", failed_files)
                failed_basenames = _basename_list(failed_files)
                _emit_restore_status(
                    "failed",
                    "error",
                    f"Could not delete: {failed_basenames}",
                    operation="delete_db",
                )
                result = Result.Err(
                    "DELETE_FAILED",
                    f"Could not delete: {failed_basenames}. "
                    "Stop ComfyUI, manually delete the files, then restart.",
                )
                await _audit_db_maintenance_write(
                    svc if isinstance(svc, dict) else {},
                    request,
                    "db_force_delete",
                    "db:force_delete",
                    result,
                    failed_files=failed_files,
                )
                return _json_response(result)

            logger.info("Force-delete: removed %s", deleted_files)

            # 4. Re-initialize the DB adapter so it creates a fresh database
            if db is not None:
                try:
                    _emit_restore_status("recreate_db", "info", operation="delete_db")
                    await db._ensure_initialized_async()
                    from mjr_am_backend.adapters.db.schema import (
                        ensure_indexes_and_triggers,
                        ensure_tables_exist,
                    )
                    await ensure_tables_exist(db)
                    await ensure_indexes_and_triggers(db)
                    logger.info("DB re-initialized after force delete")
                except Exception as exc:
                    logger.warning("DB re-init after force delete failed: %s", exc)

            # 5. Trigger background rescan
            started_scans = []
            if index_service is not None:
                try:
                    base_path = str(Path(get_runtime_output_root()).resolve(strict=False))
                    _emit_restore_status("restarting_scan", "info", operation="delete_db")
                    _spawn_background_task(
                        index_service.scan_directory(
                            base_path,
                            recursive=True,
                            incremental=False,
                            source="output",
                            fast=True,
                            background_metadata=True,
                        ),
                        label="db_force_delete_scan_output",
                    )
                    started_scans.append(base_path)
                except Exception:
                    pass
                try:
                    import folder_paths  # type: ignore
                    input_path = str(Path(folder_paths.get_input_directory()).resolve())
                    _spawn_background_task(
                        index_service.scan_directory(
                            input_path,
                            recursive=True,
                            incremental=False,
                            source="input",
                            fast=True,
                            background_metadata=True,
                        ),
                        label="db_force_delete_scan_input",
                    )
                    started_scans.append(input_path)
                except Exception:
                    pass

            _emit_restore_status("done", "success", operation="delete_db")
            result = Result.Ok({
                "method": "manual_delete",
                "deleted_files": deleted_files,
                "scans_triggered": started_scans,
            })
            await _audit_db_maintenance_write(
                svc if isinstance(svc, dict) else {},
                request,
                "db_force_delete",
                "db:force_delete",
                result,
                method="manual_delete",
                deleted_files=len(deleted_files),
                scans=len(started_scans),
            )
            return _json_response(result)
        except Exception as exc:
            _emit_restore_status("failed", "error", safe_error_message(exc, "Delete DB failed"), operation="delete_db")
            result = Result.Err("DB_ERROR", safe_error_message(exc, "Delete DB failed"))
            await _audit_db_maintenance_write(
                svc if isinstance(svc, dict) else {},
                request,
                "db_force_delete",
                "db:force_delete",
                result,
            )
            return _json_response(result)
        finally:
            try:
                await _restart_watcher_if_needed(svc if isinstance(svc, dict) else None, watcher_was_running)
            except Exception:
                pass
            set_db_maintenance_active(False)

    @routes.post("/mjr/am/db/cleanup-case-duplicates")
    async def db_cleanup_case_duplicates(request: web.Request):
        """
        Cleanup historical duplicate assets caused by filepath case differences.
        """
        csrf = _csrf_error(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))
        auth = _require_write_access(request)
        if not auth.ok:
            return _json_response(auth)
        if is_generation_busy(include_cooldown=False):
            return _json_response(_generation_busy_result())

        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)
        prefs = await _resolve_security_prefs(svc if isinstance(svc, dict) else None)
        if prefs is not None:
            op = _require_operation_enabled("reset_index", prefs=prefs)
            if not op.ok:
                return _json_response(op)
        else:
            logger.warning("Cleanup case-duplicates: security prefs unavailable, skipping reset_index gate")
        db = svc.get("db") if isinstance(svc, dict) else None
        if not db:
            return _json_response(Result.Err("SERVICE_UNAVAILABLE", "Database service unavailable"))

        # This maintenance action targets Windows case-insensitive filesystems.
        if os.name != "nt":
            return _json_response(
                Result.Ok(
                    {
                        "ran": False,
                        "reason": "non_windows",
                        "groups": 0,
                        "deleted": 0,
                        "kept": 0,
                    }
                )
            )

        set_db_maintenance_active(True)
        watcher_was_running = False
        try:
            watcher_was_running = await _stop_watcher_if_running(svc if isinstance(svc, dict) else None)
            index_service = svc.get("index") if isinstance(svc, dict) else None
            if index_service and hasattr(index_service, "stop_enrichment"):
                try:
                    await index_service.stop_enrichment(clear_queue=True)
                except Exception:
                    pass

            async with db.atransaction(mode="immediate") as tx:
                if not tx.ok:
                    return _json_response(Result.Err("DB_ERROR", tx.error or "Failed to begin transaction"))
                cleanup_res = await _cleanup_assets_case_duplicates(db)
                if not cleanup_res.ok:
                    return _json_response(cleanup_res)

            if not tx.ok:
                return _json_response(Result.Err("DB_ERROR", tx.error or "Commit failed"))

            # Best-effort maintenance after cleanup.
            try:
                await db.aquery("PRAGMA optimize", ())
            except Exception:
                pass

            payload = {"ran": True, **(cleanup_res.data or {})}
            result = Result.Ok(payload)
            await _audit_db_maintenance_write(
                svc if isinstance(svc, dict) else {},
                request,
                "db_cleanup_case_duplicates",
                "db:cleanup_case_duplicates",
                result,
                deleted=int((cleanup_res.data or {}).get("deleted") or 0),
            )
            return _json_response(result)
        except Exception as exc:
            result = Result.Err("DB_ERROR", safe_error_message(exc, "Cleanup case-duplicates failed"))
            await _audit_db_maintenance_write(
                svc if isinstance(svc, dict) else {},
                request,
                "db_cleanup_case_duplicates",
                "db:cleanup_case_duplicates",
                result,
            )
            return _json_response(result)
        finally:
            try:
                await _restart_watcher_if_needed(svc if isinstance(svc, dict) else None, watcher_was_running)
            except Exception:
                pass
            set_db_maintenance_active(False)

    @routes.post("/mjr/am/db/backfill-job-ids-by-prefix")
    async def db_backfill_job_ids_by_prefix(request: web.Request):
        """
        Backfill missing job_ids by propagating from sibling files with same prefix.

        For example, if ltx-23_audio_00001-audio.mp4 has a job_id but
        ltx-23_audio_00001.mp4 and ltx-23_audio_00001.png don't, this will
        propagate the job_id to all files with the same prefix.
        """
        csrf = _csrf_error(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))
        auth = _require_write_access(request)
        if not auth.ok:
            return _json_response(auth)
        if is_generation_busy(include_cooldown=False):
            return _json_response(_generation_busy_result())

        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)
        db = svc.get("db") if isinstance(svc, dict) else None
        if not db:
            return _json_response(Result.Err("SERVICE_UNAVAILABLE", "Database service unavailable"))

        set_db_maintenance_active(True)
        watcher_was_running = False
        try:
            watcher_was_running = await _stop_watcher_if_running(svc if isinstance(svc, dict) else None)

            async with db.atransaction(mode="immediate") as tx:
                if not tx.ok:
                    return _json_response(Result.Err("DB_ERROR", tx.error or "Failed to begin transaction"))
                backfill_res = await _backfill_job_ids_by_prefix(db)
                if not backfill_res.ok:
                    return _json_response(backfill_res)

            if not tx.ok:
                return _json_response(Result.Err("DB_ERROR", tx.error or "Commit failed"))

            # Trigger stack finalization for updated assets
            try:
                index_svc = svc.get("index") if isinstance(svc, dict) else None
                if index_svc and hasattr(index_svc, "scanner") and backfill_res.data:
                    # Re-stack affected assets
                    pass  # Stacking will be handled on next list
            except Exception:
                pass

            payload = {"ran": True, **(backfill_res.data or {})}
            result = Result.Ok(payload)
            await _audit_db_maintenance_write(
                svc if isinstance(svc, dict) else {},
                request,
                "db_backfill_job_ids_by_prefix",
                "db:backfill_job_ids_by_prefix",
                result,
                updated=int((backfill_res.data or {}).get("updated") or 0),
            )
            return _json_response(result)
        except Exception as exc:
            result = Result.Err("DB_ERROR", safe_error_message(exc, "Backfill job_ids failed"))
            await _audit_db_maintenance_write(
                svc if isinstance(svc, dict) else {},
                request,
                "db_backfill_job_ids_by_prefix",
                "db:backfill_job_ids_by_prefix",
                result,
            )
            return _json_response(result)
        finally:
            try:
                await _restart_watcher_if_needed(svc if isinstance(svc, dict) else None, watcher_was_running)
            except Exception:
                pass
            set_db_maintenance_active(False)

    @routes.post("/mjr/am/db/backfill-missing-vectors")
    async def db_backfill_missing_vectors(request: web.Request):
        """
        Backfill missing vector embeddings for already indexed assets.

        Query params:
          - batch_size: optional int in [1..200], default 64
          - scope: output | input | custom | all (default: output)
          - custom_root_id: required when scope=custom
        """
        csrf = _csrf_error(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))
        auth = _require_write_access(request)
        if not auth.ok:
            return _json_response(auth)
        if is_generation_busy(include_cooldown=False):
            return _json_response(_generation_busy_result())

        if not is_vector_search_enabled():
            return _json_response(
                Result.Err(
                    "SERVICE_UNAVAILABLE",
                    "Vector search is disabled. Enable it in Majoor settings (AI toggle) first.",
                )
            )

        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)
        db = svc.get("db") if isinstance(svc, dict) else None
        if not db:
            return _json_response(Result.Err("SERVICE_UNAVAILABLE", "Database service unavailable"))

        vector_service = svc.get("vector_service") if isinstance(svc, dict) else None
        if vector_service is None:
            try:
                from ...features.index.vector_service import VectorService

                vector_service = VectorService()
                if isinstance(svc, dict):
                    svc["vector_service"] = vector_service
            except Exception as exc:
                return _json_response(Result.Err("SERVICE_UNAVAILABLE", safe_error_message(exc, "Vector service unavailable")))

        try:
            requested_batch = int(request.query.get("batch_size", "64"))
        except Exception:
            requested_batch = 64

        scope, custom_root_id, scope_error = _read_vector_backfill_scope_params(request)
        if scope_error:
            return _json_response(scope_error)

        async_mode = _parse_bool_flag(request.query.get("async"), default=False)

        if async_mode:
            active = _vector_backfill_get_active_or_latest_job()
            if isinstance(active, dict) and str(active.get("status") or "") in {"queued", "running"}:
                return _json_response(Result.Ok(_vector_backfill_job_public(active)))

            job = _vector_backfill_register_job(
                batch_size=requested_batch,
                scope=scope,
                custom_root_id=custom_root_id,
            )
            _spawn_background_task(
                _run_vector_backfill_job(
                    backfill_id=str(job.get("backfill_id") or ""),
                    svc=svc if isinstance(svc, dict) else {},
                    db=db,
                    vector_service=vector_service,
                    batch_size=int(requested_batch),
                    scope=scope,
                    custom_root_id=custom_root_id,
                ),
                label=f"vector-backfill-{job.get('backfill_id')}",
            )
            result = Result.Ok(_vector_backfill_job_public(job))
            await _audit_db_maintenance_write(
                svc if isinstance(svc, dict) else {},
                request,
                "db_backfill_missing_vectors",
                "db:backfill_vectors",
                result,
                async_mode=True,
                scope=scope,
                custom_root_id=custom_root_id,
                batch_size=int(requested_batch),
            )
            return _json_response(result)

        set_db_maintenance_active(True)
        watcher_was_running = False
        try:
            watcher_was_running = await _stop_watcher_if_running(svc if isinstance(svc, dict) else None)
            index_service = svc.get("index") if isinstance(svc, dict) else None
            if index_service and hasattr(index_service, "stop_enrichment"):
                try:
                    await index_service.stop_enrichment(clear_queue=True)
                except Exception:
                    pass

            backfill_res = await _backfill_missing_asset_vectors(
                db,
                vector_service,
                batch_size=requested_batch,
                scope=scope,
                custom_root_id=custom_root_id,
            )
            if not backfill_res.ok:
                return _json_response(backfill_res)

            searcher = svc.get("vector_searcher") if isinstance(svc, dict) else None
            if searcher and hasattr(searcher, "invalidate"):
                try:
                    searcher.invalidate()
                except Exception:
                    pass

            payload = {
                "ran": True,
                "scope": scope,
                "custom_root_id": custom_root_id or None,
                **(backfill_res.data or {}),
            }
            result = Result.Ok(payload)
            await _audit_db_maintenance_write(
                svc if isinstance(svc, dict) else {},
                request,
                "db_backfill_missing_vectors",
                "db:backfill_vectors",
                result,
                async_mode=False,
                scope=scope,
                custom_root_id=custom_root_id,
                batch_size=int(requested_batch),
            )
            return _json_response(result)
        except Exception as exc:
            result = Result.Err("DB_ERROR", safe_error_message(exc, "Vector backfill failed"))
            await _audit_db_maintenance_write(
                svc if isinstance(svc, dict) else {},
                request,
                "db_backfill_missing_vectors",
                "db:backfill_vectors",
                result,
                async_mode=False,
                scope=scope,
                custom_root_id=custom_root_id,
                batch_size=int(requested_batch),
            )
            return _json_response(result)
        finally:
            try:
                await _restart_watcher_if_needed(svc if isinstance(svc, dict) else None, watcher_was_running)
            except Exception:
                pass
            set_db_maintenance_active(False)

    @routes.get("/mjr/am/db/backfill-missing-vectors/status")
    async def db_backfill_missing_vectors_status(request: web.Request):
        """Return status for async vector backfill jobs."""
        auth = _require_write_access(request)
        if not auth.ok:
            return _json_response(auth)

        backfill_id = str(request.query.get("backfill_id") or request.query.get("job_id") or "").strip()
        job = _vector_backfill_get_job(backfill_id) if backfill_id else _vector_backfill_get_active_or_latest_job()
        if not isinstance(job, dict):
            return _json_response(Result.Ok({"status": "idle", "async": True}))
        return _json_response(Result.Ok(_vector_backfill_job_public(job)))

    @routes.get("/mjr/am/db/backups")
    async def db_backups_list(_request: web.Request):
        """List archived DB backups (newest first)."""
        try:
            rows = _list_backup_files()
            latest = rows[0]["name"] if rows else None
            return _json_response(Result.Ok({"archive_dir": _DB_ARCHIVE_DIR.name, "items": rows, "latest": latest}))
        except Exception as exc:
            return _json_response(Result.Err("DB_ERROR", safe_error_message(exc, "Failed to list DB backups")))

    @routes.post("/mjr/am/db/backup-save")
    async def db_backup_save(request: web.Request):
        """Create a consistent DB snapshot into archive folder."""

        csrf = _csrf_error(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))
        auth = _require_write_access(request)
        if not auth.ok:
            return _json_response(auth)
        if is_generation_busy(include_cooldown=False):
            return _json_response(_generation_busy_result())

        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)
        db = svc.get("db") if isinstance(svc, dict) else None
        if not db:
            return _json_response(Result.Err("SERVICE_UNAVAILABLE", "Database service unavailable"))

        target = _next_backup_target()
        try:
            try:
                await db.aquery("PRAGMA wal_checkpoint(TRUNCATE)", ())
            except Exception:
                pass
            await asyncio.to_thread(_sqlite_backup_file, INDEX_DB_PATH, target)
        except Exception as exc:
            result: Result[Any] = Result.Err("DB_ERROR", safe_error_message(exc, "Failed to save DB backup"))
            await _audit_db_maintenance_write(
                svc if isinstance(svc, dict) else {},
                request,
                "db_backup_save",
                "db:backup_save",
                result,
                name=target.name,
            )
            return _json_response(result)

        save_result = Result.Ok(
            {
                "saved": True,
                "archive_dir": _DB_ARCHIVE_DIR.name,
                "name": target.name,
                "size_bytes": int(target.stat().st_size) if target.exists() else 0,
                "mtime": int(target.stat().st_mtime) if target.exists() else 0,
            }
        )
        await _audit_db_maintenance_write(
            svc if isinstance(svc, dict) else {},
            request,
            "db_backup_save",
            "db:backup_save",
            save_result,
            name=target.name,
        )
        return _json_response(save_result)

    @routes.post("/mjr/am/db/backup-restore")
    async def db_backup_restore(request: web.Request):
        """
        Restore DB from archive.
        Body: { name?: str, use_latest?: bool }
        """
        csrf = _csrf_error(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))
        auth = _require_write_access(request)
        if not auth.ok:
            return _json_response(auth)
        if is_generation_busy(include_cooldown=False):
            return _json_response(_generation_busy_result())

        payload_res = await _read_json(request)
        if not payload_res.ok:
            return _json_response(payload_res)
        payload = payload_res.data or {}
        requested_name = str(payload.get("name") or "").strip()
        use_latest = bool(payload.get("use_latest") or not requested_name)

        try:
            items = _list_backup_files()
            if not items:
                return _json_response(Result.Err("NOT_FOUND", "No DB backup found in archive"))
            if use_latest:
                chosen = items[0]
            else:
                chosen = next((x for x in items if str(x.get("name")) == requested_name), {})
                if not chosen:
                    return _json_response(Result.Err("NOT_FOUND", f"Backup not found: {requested_name}"))
            src = _resolve_archive_source(str(chosen.get("name") or ""))
            if src is None:
                return _json_response(Result.Err("INVALID_INPUT", "Invalid backup name"))
            if not src.exists():
                return _json_response(Result.Err("NOT_FOUND", f"Backup file missing: {src.name}"))
        except Exception as exc:
            return _json_response(Result.Err("DB_ERROR", safe_error_message(exc, "Failed to resolve backup file")))

        set_db_maintenance_active(True)
        _emit_restore_status("started", "info", operation="restore_db", name=src.name)
        svc, error_result = await _require_services()
        if error_result:
            set_db_maintenance_active(False)
            _emit_restore_status("failed", "error", error_result.error if hasattr(error_result, "error") else None, operation="restore_db", name=src.name)
            return _json_response(error_result)
        db = svc.get("db") if isinstance(svc, dict) else None
        index_service = svc.get("index") if isinstance(svc, dict) else None
        if not db:
            set_db_maintenance_active(False)
            _emit_restore_status("failed", "error", "Database service unavailable", operation="restore_db", name=src.name)
            return _json_response(Result.Err("SERVICE_UNAVAILABLE", "Database service unavailable"))
        watcher_was_running = await _stop_watcher_if_running(svc if isinstance(svc, dict) else None)

        try:
            _emit_restore_status("stopping_workers", "info", operation="restore_db", name=src.name)
            if index_service and hasattr(index_service, "stop_enrichment"):
                try:
                    await index_service.stop_enrichment(clear_queue=True)
                except Exception:
                    pass

            _emit_restore_status("resetting_db", "info", operation="restore_db", name=src.name)
            reset_res = await db.areset()
            if not reset_res.ok:
                _emit_restore_status("failed", "error", reset_res.error or "Failed to reset DB", operation="restore_db", name=src.name)
                result: Result[Any] = Result.Err(reset_res.code or "DB_ERROR", reset_res.error or "Failed to reset DB")
                await _audit_db_maintenance_write(
                    svc if isinstance(svc, dict) else {},
                    request,
                    "db_backup_restore",
                    "db:backup_restore",
                    result,
                    name=src.name,
                )
                return _json_response(result)
            _emit_restore_status("replacing_files", "info", operation="restore_db", name=src.name)
            await _replace_db_from_backup(src, INDEX_DB_PATH)
            try:
                await db._ensure_initialized_async()
            except Exception:
                pass
            try:
                from mjr_am_backend.adapters.db.schema import migrate_schema

                await migrate_schema(db)
            except Exception:
                pass

            scans_triggered: list[str] = []
            if index_service:
                _emit_restore_status("restarting_scan", "info", operation="restore_db", name=src.name)
                try:
                    out_path = str(Path(get_runtime_output_root()).resolve(strict=False))
                    _spawn_background_task(
                        index_service.scan_directory(
                            out_path,
                            recursive=True,
                            incremental=False,
                            source="output",
                            fast=True,
                            background_metadata=True,
                        ),
                        label="db_restore_scan_output",
                    )
                    scans_triggered.append(out_path)
                except Exception:
                    pass
                try:
                    import folder_paths  # type: ignore
                    input_path = str(Path(folder_paths.get_input_directory()).resolve())
                    _spawn_background_task(
                        index_service.scan_directory(
                            input_path,
                            recursive=True,
                            incremental=False,
                            source="input",
                            fast=True,
                            background_metadata=True,
                        ),
                        label="db_restore_scan_input",
                    )
                    scans_triggered.append(input_path)
                except Exception:
                    pass
        except Exception as exc:
            _emit_restore_status("failed", "error", safe_error_message(exc, "Failed to restore DB backup"), operation="restore_db", name=src.name)
            result = Result.Err("DB_ERROR", safe_error_message(exc, "Failed to restore DB backup"))
            await _audit_db_maintenance_write(
                svc if isinstance(svc, dict) else {},
                request,
                "db_backup_restore",
                "db:backup_restore",
                result,
                name=src.name,
            )
            return _json_response(result)
        finally:
            try:
                await _restart_watcher_if_needed(svc if isinstance(svc, dict) else None, watcher_was_running)
            except Exception:
                pass
            set_db_maintenance_active(False)
        _emit_restore_status("done", "success", "Database restore completed", operation="restore_db", name=src.name)
        result = Result.Ok(
            {
                "restored": True,
                "name": src.name,
                "scans_triggered": scans_triggered if "scans_triggered" in locals() else [],
                "steps": [
                    "stopping_workers",
                    "resetting_db",
                    "replacing_files",
                    "restarting_scan",
                    "done",
                ],
            }
        )
        await _audit_db_maintenance_write(
            svc if isinstance(svc, dict) else {},
            request,
            "db_backup_restore",
            "db:backup_restore",
            result,
            name=src.name,
            scans=len(scans_triggered if "scans_triggered" in locals() else []),
        )
        return _json_response(result)
