"""
Database maintenance endpoints (safe, opt-in).
"""

from __future__ import annotations

import asyncio
import datetime
import gc
import os
import shutil
import sqlite3
import threading
from pathlib import Path

from aiohttp import web
from mjr_am_backend.config import INDEX_DB_PATH, get_runtime_output_root
from mjr_am_backend.shared import Result, get_logger

from ..core import (
    _csrf_error,
    _json_response,
    _read_json,
    _require_services,
    _require_write_access,
    safe_error_message,
)

logger = get_logger(__name__)

_DB_ARCHIVE_DIR = INDEX_DB_PATH.parent / "archive"
_DB_MAINTENANCE_ACTIVE = False
_DB_MAINT_LOCK = threading.Lock()


def _archive_root_resolved() -> Path:
    try:
        return _DB_ARCHIVE_DIR.resolve(strict=False)
    except Exception:
        return _DB_ARCHIVE_DIR


def _resolve_archive_source(name: str) -> Path | None:
    safe_name = str(name or "").strip()
    if not safe_name:
        return None
    if "/" in safe_name or "\\" in safe_name or "\x00" in safe_name:
        return None
    try:
        src = (_DB_ARCHIVE_DIR / safe_name).resolve(strict=False)
    except Exception:
        return None
    try:
        src.relative_to(_archive_root_resolved())
    except Exception:
        return None
    return src


def _basename_list(paths: list[str]) -> str:
    names: list[str] = []
    for p in paths or []:
        try:
            names.append(Path(str(p)).name)
        except Exception:
            continue
    return ", ".join(names)


def _task_done_logger(label: str):
    def _done(task: asyncio.Task) -> None:
        try:
            exc = task.exception()
        except asyncio.CancelledError:
            return
        except Exception:
            return
        if exc is not None:
            error_text = safe_error_message(exc, "task failed") if isinstance(exc, Exception) else "task failed"
            logger.warning("Background task '%s' failed: %s", label, error_text)

    return _done


def _spawn_background_task(coro, *, label: str) -> None:
    try:
        task = asyncio.create_task(coro)
        task.add_done_callback(_task_done_logger(label))
    except Exception as exc:
        logger.debug("Unable to start background task '%s': %s", label, exc)


def is_db_maintenance_active() -> bool:
    with _DB_MAINT_LOCK:
        return bool(_DB_MAINTENANCE_ACTIVE)


def set_db_maintenance_active(active: bool) -> None:
    global _DB_MAINTENANCE_ACTIVE
    with _DB_MAINT_LOCK:
        _DB_MAINTENANCE_ACTIVE = bool(active)


async def _stop_watcher_if_running(svc: dict | None) -> bool:
    watcher = svc.get("watcher") if isinstance(svc, dict) else None
    try:
        if watcher and bool(getattr(watcher, "is_running", False)):
            await watcher.stop()
            return True
    except Exception as exc:
        logger.debug("Failed to stop watcher during DB maintenance: %s", exc)
    return False


async def _restart_watcher_if_needed(svc: dict | None, should_restart: bool) -> None:
    if not should_restart or not isinstance(svc, dict):
        return
    watcher = svc.get("watcher")
    if not watcher:
        return
    try:
        from mjr_am_backend.features.index.watcher_scope import build_watch_paths
        scope_cfg = svc.get("watcher_scope") if isinstance(svc.get("watcher_scope"), dict) else {}
        scope = str((scope_cfg or {}).get("scope") or "output")
        custom_root_id = (scope_cfg or {}).get("custom_root_id")
        paths = build_watch_paths(scope, custom_root_id)
        if paths:
            import asyncio
            await watcher.start(paths, asyncio.get_running_loop())
    except Exception as exc:
        logger.debug("Failed to restart watcher after DB maintenance: %s", exc)


def _backup_name(now: datetime.datetime | None = None) -> str:
    ts = (now or datetime.datetime.now(datetime.timezone.utc)).strftime("%Y%m%d_%H%M%S")
    return f"assets_{ts}.sqlite"


def _list_backup_files() -> list[dict[str, str | int]]:
    if not _DB_ARCHIVE_DIR.exists():
        return []
    rows: list[dict[str, str | int]] = []
    for p in _DB_ARCHIVE_DIR.glob("*.sqlite"):
        try:
            st = p.stat()
            rows.append(
                {
                    "name": p.name,
                    "size_bytes": int(st.st_size),
                    "mtime": int(st.st_mtime),
                }
            )
        except Exception:
            continue
    rows.sort(key=lambda x: int(x.get("mtime") or 0), reverse=True)
    return rows


def _sqlite_backup_file(src: Path, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(str(src)) as src_conn:
        with sqlite3.connect(str(dst)) as dst_conn:
            src_conn.backup(dst_conn)


def _emit_restore_status(step: str, level: str = "info", message: str | None = None, **extra) -> None:
    try:
        from ..registry import PromptServer
        payload = {"step": str(step or ""), "level": str(level or "info")}
        if message:
            payload["message"] = str(message)
        if extra:
            payload.update(extra)
        _ps = getattr(PromptServer, "instance", None)
        if _ps is not None:
            _ps.send_sync("mjr-db-restore-status", payload)
    except Exception:
        pass


async def _remove_with_retry(path: Path, attempts: int = 6) -> None:
    if not path.exists():
        return
    last_exc = None
    for attempt in range(max(1, int(attempts))):
        try:
            path.unlink()
            return
        except Exception as exc:
            last_exc = exc
            gc.collect()
            await asyncio.sleep(0.2 * (attempt + 1))
    if path.exists():
        raise last_exc or RuntimeError(f"Failed to delete file: {path}")


async def _replace_db_from_backup(src: Path, dst: Path) -> None:
    for suffix in ("", "-wal", "-shm", "-journal"):
        await _remove_with_retry(Path(str(dst) + suffix))
    await asyncio.to_thread(shutil.copy2, src, dst)


def _normalize_asset_row_for_case_cleanup(row: dict) -> tuple[int, str]:
    try:
        asset_id = int(row.get("id") or 0)
    except Exception:
        return 0, ""
    if asset_id <= 0:
        return 0, ""
    key = str(row.get("filepath") or "").strip().lower()
    if not key:
        return 0, ""
    return asset_id, key


def _collect_case_duplicate_ids(rows: list[dict]) -> tuple[int, list[int], int]:
    keep_ids: set[int] = set()
    delete_ids: list[int] = []
    groups = 0
    current_key = None
    seen_in_group = 0

    for row in rows:
        asset_id, key = _normalize_asset_row_for_case_cleanup(row)
        if asset_id <= 0 or not key:
            continue
        if key != current_key:
            if seen_in_group > 1:
                groups += 1
            current_key = key
            seen_in_group = 1
            keep_ids.add(asset_id)
            continue
        delete_ids.append(asset_id)
        seen_in_group += 1

    if seen_in_group > 1:
        groups += 1
    return groups, delete_ids, len(keep_ids)


async def _cleanup_assets_case_duplicates(db) -> Result[dict[str, int]]:
    """
    Remove duplicate assets that differ only by filepath casing.

    Keeps the most recent row per normalized filepath (mtime DESC, id DESC),
    then deletes other rows. Intended for Windows environments where paths are
    case-insensitive.
    """
    try:
        rows_res = await db.aquery(
            """
            SELECT id, filepath, mtime
            FROM assets
            WHERE filepath IS NOT NULL AND filepath != ''
            ORDER BY lower(filepath), mtime DESC, id DESC
            """
        )
        if not rows_res.ok:
            return Result.Err("DB_ERROR", rows_res.error or "Failed to scan assets for duplicates")
        rows = rows_res.data or []
        if not rows:
            return Result.Ok({"groups": 0, "deleted": 0, "kept": 0})

        groups, delete_ids, kept_count = _collect_case_duplicate_ids(rows)

        if not delete_ids:
            return Result.Ok({"groups": 0, "deleted": 0, "kept": kept_count})

        placeholders = ",".join("?" for _ in delete_ids)
        del_res = await db.aexecute(f"DELETE FROM assets WHERE id IN ({placeholders})", tuple(delete_ids))
        if not del_res.ok:
            return Result.Err("DB_ERROR", del_res.error or "Failed to delete duplicate assets")

        return Result.Ok({"groups": int(groups), "deleted": len(delete_ids), "kept": kept_count})
    except Exception as exc:
        return Result.Err("DB_ERROR", safe_error_message(exc, "Failed to cleanup case duplicates"))


def register_db_maintenance_routes(routes: web.RouteTableDef) -> None:
    """Register database maintenance routes."""
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
            return _json_response(Result.Err("DB_ERROR", safe_error_message(exc, "Database optimize failed")))

        return _json_response(Result.Ok({"ran": steps}))

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
        import asyncio
        import gc
        from pathlib import Path

        from mjr_am_backend.config import INDEX_DB_PATH

        csrf = _csrf_error(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))
        auth = _require_write_access(request)
        if not auth.ok:
            return _json_response(auth)

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
                    await db.areset()
                    logger.info("DB adapter areset() succeeded")
                    _emit_restore_status("recreate_db", "info", operation="delete_db")
                    # If areset worked, skip the manual file deletion
                    started_scans = []
                    if index_service:
                        try:
                            base_path = str(Path(get_runtime_output_root()).resolve(strict=False))
                            _emit_restore_status("restarting_scan", "info", operation="delete_db")
                            _spawn_background_task(
                                index_service.scan_directory(base_path, recursive=True, incremental=False, source="output"),
                                label="db_force_delete_scan_output",
                            )
                            started_scans.append(base_path)
                        except Exception:
                            pass
                        try:
                            import folder_paths  # type: ignore
                            input_path = str(Path(folder_paths.get_input_directory()).resolve())
                            _spawn_background_task(
                                index_service.scan_directory(input_path, recursive=True, incremental=False, source="input"),
                                label="db_force_delete_scan_input",
                            )
                            started_scans.append(input_path)
                        except Exception:
                            pass
                    _emit_restore_status("done", "success", operation="delete_db")
                    return _json_response(Result.Ok({
                        "method": "adapter_reset",
                        "deleted": True,
                        "scans_triggered": started_scans,
                    }))
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
                for attempt in range(6):
                    try:
                        p.unlink()
                        deleted_files.append(str(p))
                        removed = True
                        break
                    except PermissionError:
                        gc.collect()
                        await asyncio.sleep(0.3 * (attempt + 1))
                    except Exception:
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
                return _json_response(Result.Err(
                    "DELETE_FAILED",
                    f"Could not delete: {failed_basenames}. "
                    "Stop ComfyUI, manually delete the files, then restart.",
                ))

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
                        index_service.scan_directory(base_path, recursive=True, incremental=False, source="output"),
                        label="db_force_delete_scan_output",
                    )
                    started_scans.append(base_path)
                except Exception:
                    pass
                try:
                    import folder_paths  # type: ignore
                    input_path = str(Path(folder_paths.get_input_directory()).resolve())
                    _spawn_background_task(
                        index_service.scan_directory(input_path, recursive=True, incremental=False, source="input"),
                        label="db_force_delete_scan_input",
                    )
                    started_scans.append(input_path)
                except Exception:
                    pass

            _emit_restore_status("done", "success", operation="delete_db")
            return _json_response(Result.Ok({
                "method": "manual_delete",
                "deleted_files": deleted_files,
                "scans_triggered": started_scans,
            }))
        except Exception as exc:
            _emit_restore_status("failed", "error", safe_error_message(exc, "Delete DB failed"), operation="delete_db")
            return _json_response(Result.Err("DB_ERROR", safe_error_message(exc, "Delete DB failed")))
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

        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)
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
            return _json_response(Result.Ok(payload))
        except Exception as exc:
            return _json_response(Result.Err("DB_ERROR", safe_error_message(exc, "Cleanup case-duplicates failed")))
        finally:
            try:
                await _restart_watcher_if_needed(svc if isinstance(svc, dict) else None, watcher_was_running)
            except Exception:
                pass
            set_db_maintenance_active(False)

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
        import asyncio

        csrf = _csrf_error(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))
        auth = _require_write_access(request)
        if not auth.ok:
            return _json_response(auth)

        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)
        db = svc.get("db") if isinstance(svc, dict) else None
        if not db:
            return _json_response(Result.Err("SERVICE_UNAVAILABLE", "Database service unavailable"))

        target = _DB_ARCHIVE_DIR / _backup_name()
        try:
            try:
                await db.aquery("PRAGMA wal_checkpoint(TRUNCATE)", ())
            except Exception:
                pass
            await asyncio.to_thread(_sqlite_backup_file, INDEX_DB_PATH, target)
        except Exception as exc:
            return _json_response(Result.Err("DB_ERROR", safe_error_message(exc, "Failed to save DB backup")))

        return _json_response(
            Result.Ok(
                {
                    "saved": True,
                    "archive_dir": _DB_ARCHIVE_DIR.name,
                    "name": target.name,
                    "size_bytes": int(target.stat().st_size) if target.exists() else 0,
                }
            )
        )

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
        _emit_restore_status("started", "info", operation="restore_db")
        svc, error_result = await _require_services()
        if error_result:
            set_db_maintenance_active(False)
            _emit_restore_status("failed", "error", error_result.error if hasattr(error_result, "error") else None, operation="restore_db")
            return _json_response(error_result)
        db = svc.get("db") if isinstance(svc, dict) else None
        index_service = svc.get("index") if isinstance(svc, dict) else None
        if not db:
            set_db_maintenance_active(False)
            _emit_restore_status("failed", "error", "Database service unavailable", operation="restore_db")
            return _json_response(Result.Err("SERVICE_UNAVAILABLE", "Database service unavailable"))
        watcher_was_running = await _stop_watcher_if_running(svc if isinstance(svc, dict) else None)

        try:
            _emit_restore_status("stopping_workers", "info", operation="restore_db")
            if index_service and hasattr(index_service, "stop_enrichment"):
                try:
                    await index_service.stop_enrichment(clear_queue=True)
                except Exception:
                    pass

            _emit_restore_status("resetting_db", "info", operation="restore_db")
            reset_res = await db.areset()
            if not reset_res.ok:
                _emit_restore_status("failed", "error", reset_res.error or "Failed to reset DB", operation="restore_db")
                return _json_response(Result.Err(reset_res.code or "DB_ERROR", reset_res.error or "Failed to reset DB"))
            _emit_restore_status("replacing_files", "info", operation="restore_db")
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
                _emit_restore_status("restarting_scan", "info", operation="restore_db")
                try:
                    out_path = str(Path(get_runtime_output_root()).resolve(strict=False))
                    _spawn_background_task(
                        index_service.scan_directory(out_path, recursive=True, incremental=False, source="output"),
                        label="db_restore_scan_output",
                    )
                    scans_triggered.append(out_path)
                except Exception:
                    pass
                try:
                    import folder_paths  # type: ignore
                    input_path = str(Path(folder_paths.get_input_directory()).resolve())
                    _spawn_background_task(
                        index_service.scan_directory(input_path, recursive=True, incremental=False, source="input"),
                        label="db_restore_scan_input",
                    )
                    scans_triggered.append(input_path)
                except Exception:
                    pass
        except Exception as exc:
            _emit_restore_status("failed", "error", safe_error_message(exc, "Failed to restore DB backup"), operation="restore_db")
            return _json_response(Result.Err("DB_ERROR", safe_error_message(exc, "Failed to restore DB backup")))
        finally:
            try:
                await _restart_watcher_if_needed(svc if isinstance(svc, dict) else None, watcher_was_running)
            except Exception:
                pass
            set_db_maintenance_active(False)
        _emit_restore_status("done", "success", "Database restore completed", operation="restore_db")
        return _json_response(
            Result.Ok(
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
        )
