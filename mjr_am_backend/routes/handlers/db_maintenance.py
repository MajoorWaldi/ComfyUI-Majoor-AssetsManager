"""
Database maintenance endpoints (safe, opt-in).
"""

from __future__ import annotations

import asyncio
import datetime
import gc
import json
import os
import shutil
import sqlite3
import threading
import time
import uuid
from pathlib import Path
from typing import Any

from aiohttp import web
from mjr_am_backend.config import INDEX_DB_PATH, get_runtime_output_root, is_vector_search_enabled
from mjr_am_backend.custom_roots import resolve_custom_root
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

logger = get_logger(__name__)

_DB_ARCHIVE_DIR = INDEX_DB_PATH.parent / "archive"
_DB_MAINTENANCE_ACTIVE = False
_DB_MAINT_LOCK = threading.Lock()
_VECTOR_BACKFILL_LOCK = threading.Lock()
_VECTOR_BACKFILL_JOBS: dict[str, dict[str, Any]] = {}
_VECTOR_BACKFILL_ACTIVE_JOB_ID: str | None = None
_VECTOR_BACKFILL_HISTORY_LIMIT = 20
_VECTOR_BACKFILL_PRIORITY_LOCK = threading.Lock()
_VECTOR_BACKFILL_PRIORITY_UNTIL_MONO: float = 0.0
_VECTOR_BACKFILL_PRIORITY_REASON: str = ""
_VECTOR_BACKFILL_PRIORITY_MAX_WINDOW_S = 120.0
_VECTOR_BACKFILL_PRIORITY_SLEEP_SLICE_S = 0.25
_VECTOR_BACKFILL_VALID_SCOPES = {"output", "input", "custom", "all"}


def _parse_bool_flag(value: Any, default: bool = False) -> bool:
    try:
        if value is None:
            return bool(default)
        if isinstance(value, bool):
            return value
        s = str(value).strip().lower()
        if not s:
            return bool(default)
        if s in {"1", "true", "yes", "on", "enabled", "enable"}:
            return True
        if s in {"0", "false", "no", "off", "disabled", "disable"}:
            return False
        return bool(default)
    except Exception:
        return bool(default)


def _normalize_backfill_scope(value: Any) -> str:
    raw = str(value or "output").strip().lower()
    if raw == "outputs":
        return "output"
    if raw == "inputs":
        return "input"
    return raw if raw in _VECTOR_BACKFILL_VALID_SCOPES else ""


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


def _utc_now_iso() -> str:
    try:
        return datetime.datetime.now(datetime.timezone.utc).isoformat()
    except Exception:
        return ""


def _vector_backfill_job_public(job: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(job, dict):
        return {
            "backfill_id": "",
            "status": "idle",
            "async": True,
        }
    public_job = _vector_backfill_job_public_base(job)
    public_job.update(_vector_backfill_job_public_timing(job))
    public_job.update(_vector_backfill_job_public_payload(job))
    return public_job


def _vector_backfill_job_public_base(job: dict[str, Any]) -> dict[str, Any]:
    return {
        "backfill_id": str(job.get("backfill_id") or ""),
        "status": str(job.get("status") or "unknown"),
        "async": True,
        "batch_size": int(job.get("batch_size") or 64),
        "scope": str(job.get("scope") or "output"),
        "custom_root_id": str(job.get("custom_root_id") or "") or None,
    }


def _vector_backfill_job_public_timing(job: dict[str, Any]) -> dict[str, Any]:
    return {
        "created_at": str(job.get("created_at") or ""),
        "updated_at": str(job.get("updated_at") or ""),
        "started_at": str(job.get("started_at") or ""),
        "finished_at": str(job.get("finished_at") or ""),
    }


def _vector_backfill_job_public_payload(job: dict[str, Any]) -> dict[str, Any]:
    return {
        "progress": job.get("progress") if isinstance(job.get("progress"), dict) else None,
        "result": job.get("result") if isinstance(job.get("result"), dict) else None,
        "code": str(job.get("code") or "") or None,
        "error": str(job.get("error") or "") or None,
    }


def _vector_backfill_get_job(backfill_id: str) -> dict[str, Any] | None:
    with _VECTOR_BACKFILL_LOCK:
        return _VECTOR_BACKFILL_JOBS.get(str(backfill_id or ""))


def _vector_backfill_get_active_or_latest_job() -> dict[str, Any] | None:
    with _VECTOR_BACKFILL_LOCK:
        if _VECTOR_BACKFILL_ACTIVE_JOB_ID:
            active = _VECTOR_BACKFILL_JOBS.get(_VECTOR_BACKFILL_ACTIVE_JOB_ID)
            if isinstance(active, dict):
                return active
        if not _VECTOR_BACKFILL_JOBS:
            return None
        ordered = sorted(
            _VECTOR_BACKFILL_JOBS.values(),
            key=lambda j: str(j.get("created_at") or ""),
            reverse=True,
        )
        return ordered[0] if ordered else None


def is_vector_backfill_active() -> bool:
    """Return True when an async vector backfill job is queued/running."""
    with _VECTOR_BACKFILL_LOCK:
        if not _VECTOR_BACKFILL_ACTIVE_JOB_ID:
            return False
        job = _VECTOR_BACKFILL_JOBS.get(_VECTOR_BACKFILL_ACTIVE_JOB_ID)
        if not isinstance(job, dict):
            return False
        status = str(job.get("status") or "").strip().lower()
        return status in {"queued", "running"}


def _vector_backfill_priority_remaining_seconds() -> float:
    global _VECTOR_BACKFILL_PRIORITY_UNTIL_MONO, _VECTOR_BACKFILL_PRIORITY_REASON
    now = time.monotonic()
    with _VECTOR_BACKFILL_PRIORITY_LOCK:
        remaining = float(_VECTOR_BACKFILL_PRIORITY_UNTIL_MONO - now)
        if remaining <= 0:
            _VECTOR_BACKFILL_PRIORITY_UNTIL_MONO = 0.0
            _VECTOR_BACKFILL_PRIORITY_REASON = ""
            return 0.0
        return remaining


def request_vector_backfill_priority_window(seconds: float = 18.0, *, reason: str = "generation") -> float:
    """
    Request a temporary cooperative pause window for the running vector backfill job.

    Returns the remaining requested window (seconds).
    """
    duration = max(0.5, min(_VECTOR_BACKFILL_PRIORITY_MAX_WINDOW_S, float(seconds or 0.0)))
    now = time.monotonic()
    requested_until = now + duration
    with _VECTOR_BACKFILL_PRIORITY_LOCK:
        global _VECTOR_BACKFILL_PRIORITY_UNTIL_MONO, _VECTOR_BACKFILL_PRIORITY_REASON
        if requested_until > _VECTOR_BACKFILL_PRIORITY_UNTIL_MONO:
            _VECTOR_BACKFILL_PRIORITY_UNTIL_MONO = requested_until
            _VECTOR_BACKFILL_PRIORITY_REASON = str(reason or "generation")
        return max(0.0, _VECTOR_BACKFILL_PRIORITY_UNTIL_MONO - now)


def _clear_vector_backfill_priority_window() -> None:
    with _VECTOR_BACKFILL_PRIORITY_LOCK:
        global _VECTOR_BACKFILL_PRIORITY_UNTIL_MONO, _VECTOR_BACKFILL_PRIORITY_REASON
        _VECTOR_BACKFILL_PRIORITY_UNTIL_MONO = 0.0
        _VECTOR_BACKFILL_PRIORITY_REASON = ""


async def _vector_backfill_wait_for_priority_window() -> None:
    """
    Cooperative yield point used by backfill loops.
    Sleeps in short slices while a priority window is active.
    """
    while True:
        remaining = _vector_backfill_priority_remaining_seconds()
        if remaining <= 0:
            return
        await asyncio.sleep(min(_VECTOR_BACKFILL_PRIORITY_SLEEP_SLICE_S, remaining))


def _vector_backfill_register_job(*, batch_size: int, scope: str = "output", custom_root_id: str = "") -> dict[str, Any]:
    normalized_scope = _normalize_backfill_scope(scope) or "output"
    normalized_custom_root = str(custom_root_id or "").strip() if normalized_scope == "custom" else ""
    backfill_id = uuid.uuid4().hex
    job = {
        "backfill_id": backfill_id,
        "status": "queued",
        "batch_size": int(max(1, min(200, batch_size))),
        "scope": normalized_scope,
        "custom_root_id": normalized_custom_root,
        "created_at": _utc_now_iso(),
        "updated_at": _utc_now_iso(),
        "started_at": "",
        "finished_at": "",
        "progress": {
            "candidates": 0,
            "indexed": 0,
            "skipped": 0,
            "errors": 0,
            "batch_size": int(max(1, min(200, batch_size))),
        },
        "result": None,
        "code": None,
        "error": None,
    }
    with _VECTOR_BACKFILL_LOCK:
        _VECTOR_BACKFILL_JOBS[backfill_id] = job
        global _VECTOR_BACKFILL_ACTIVE_JOB_ID
        _VECTOR_BACKFILL_ACTIVE_JOB_ID = backfill_id
    return job


def _vector_backfill_prune_history() -> None:
    with _VECTOR_BACKFILL_LOCK:
        if len(_VECTOR_BACKFILL_JOBS) <= _VECTOR_BACKFILL_HISTORY_LIMIT:
            return
        keep_ids = set()
        if _VECTOR_BACKFILL_ACTIVE_JOB_ID:
            keep_ids.add(_VECTOR_BACKFILL_ACTIVE_JOB_ID)
        ordered = sorted(
            _VECTOR_BACKFILL_JOBS.values(),
            key=lambda j: str(j.get("created_at") or ""),
            reverse=True,
        )
        for item in ordered[:_VECTOR_BACKFILL_HISTORY_LIMIT]:
            keep_ids.add(str(item.get("backfill_id") or ""))
        for key in list(_VECTOR_BACKFILL_JOBS.keys()):
            if key not in keep_ids:
                _VECTOR_BACKFILL_JOBS.pop(key, None)


def _vector_backfill_update_job(backfill_id: str, **updates: Any) -> None:
    with _VECTOR_BACKFILL_LOCK:
        job = _VECTOR_BACKFILL_JOBS.get(str(backfill_id or ""))
        if not isinstance(job, dict):
            return
        job["updated_at"] = _utc_now_iso()
        job.update(updates)


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
        _vector_backfill_fail_job(backfill_id, exc)
    finally:
        _clear_vector_backfill_priority_window()
        try:
            await _restart_watcher_if_needed(svc if isinstance(svc, dict) else None, watcher_was_running)
        except Exception:
            pass
        set_db_maintenance_active(False)
        with _VECTOR_BACKFILL_LOCK:
            global _VECTOR_BACKFILL_ACTIVE_JOB_ID
            if _VECTOR_BACKFILL_ACTIVE_JOB_ID == backfill_id:
                _VECTOR_BACKFILL_ACTIVE_JOB_ID = None
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


def _vector_backfill_complete_job(backfill_id: str, *, scope: str, custom_root_id: str, payload: dict[str, Any]) -> None:
    job_payload = {
        "ran": True,
        "scope": _normalize_backfill_scope(scope) or "output",
        "custom_root_id": str(custom_root_id or "") or None,
        **payload,
    }
    _vector_backfill_update_job(
        backfill_id,
        status="succeeded",
        finished_at=_utc_now_iso(),
        result=job_payload,
        code=None,
        error=None,
    )


def _vector_backfill_fail_job(backfill_id: str, exc: Exception) -> None:
    _vector_backfill_update_job(
        backfill_id,
        status="failed",
        finished_at=_utc_now_iso(),
        code="DB_ERROR",
        error=safe_error_message(exc, "Vector backfill failed"),
    )


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
        running = False
        if watcher:
            raw_running = getattr(watcher, "is_running", False)
            running = bool(raw_running() if callable(raw_running) else raw_running)
        if running and watcher is not None:
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
        paths = _resolve_watcher_restart_paths(svc, build_watch_paths)
        if paths:
            import asyncio
            await watcher.start(paths, asyncio.get_running_loop())
    except Exception as exc:
        logger.debug("Failed to restart watcher after DB maintenance: %s", exc)


def _resolve_watcher_restart_paths(svc: dict[str, Any], build_watch_paths: Any) -> list[Path]:
    scope_cfg = svc.get("watcher_scope") if isinstance(svc.get("watcher_scope"), dict) else {}
    scope = str((scope_cfg or {}).get("scope") or "output")
    custom_root_id = (scope_cfg or {}).get("custom_root_id")
    active_user_id = str(svc.get("watcher_scope_active_user_id") or "").strip()
    return build_watch_paths(scope, custom_root_id, user_id=active_user_id or None)


def _backup_name(now: datetime.datetime | None = None) -> str:
    ts = (now or datetime.datetime.now(datetime.timezone.utc)).strftime("%Y%m%d_%H%M%S_%f")[:-3]
    return f"assets_{ts}.sqlite"


def _next_backup_target() -> Path:
    target = _DB_ARCHIVE_DIR / _backup_name()
    if not target.exists():
        return target
    stem = target.stem
    suffix = target.suffix or ".sqlite"
    for index in range(2, 1000):
        candidate = target.with_name(f"{stem}_{index}{suffix}")
        if not candidate.exists():
            return candidate
    raise RuntimeError("Failed to reserve unique DB backup filename")


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


def _is_windows_sharing_violation(exc: Exception) -> bool:
    if os.name != "nt":
        return False
    try:
        winerror = int(getattr(exc, "winerror", 0) or 0)
        if winerror in (32, 33):
            return True
    except Exception:
        pass
    msg = str(exc).lower()
    return (
        "winerror 32" in msg
        or "winerror 33" in msg
        or "used by another process" in msg
        or "cannot access the file" in msg
    )


async def _release_windows_db_lockers(path: Path, db: Any | None) -> list[int]:
    if os.name != "nt" or db is None:
        return []
    terminator = getattr(db, "_terminate_locking_processes_windows", None)
    if not callable(terminator):
        return []
    try:
        killed = await asyncio.to_thread(terminator, path)
    except Exception as exc:
        logger.debug("Failed to terminate locking process(es) for %s: %s", path, exc)
        return []
    if not isinstance(killed, list):
        return []
    pids: list[int] = []
    for pid in killed:
        try:
            n = int(pid)
            if n > 0:
                pids.append(n)
        except Exception:
            continue
    return pids


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


def _build_backfill_scope_clause(normalized_scope: str, normalized_custom_root: str) -> tuple[str, list[Any]]:
    """Build the SQL WHERE fragment and params for backfill scope filtering."""
    where: list[str] = []
    params: list[Any] = []
    if normalized_scope in {"output", "input", "custom"}:
        where.append("LOWER(COALESCE(a.source, '')) = ?")
        params.append(normalized_scope)
    if normalized_scope == "custom":
        where.append("a.root_id = ?")
        params.append(normalized_custom_root)
    scope_sql = (" AND " + " AND ".join(where)) if where else ""
    return scope_sql, params


async def _process_backfill_row(
    db: Any,
    vector_service: Any,
    row: dict[str, Any],
    index_asset_vector: Any,
) -> tuple[str, int]:
    """Process one backfill row; returns (outcome, asset_id).

    outcome is one of: 'skip_invalid', 'skipped_missing', 'indexed', 'skipped', 'error'.
    """
    await _vector_backfill_wait_for_priority_window()
    asset_id = _parse_backfill_asset_id(row)
    if asset_id <= 0:
        return "skip_invalid", 0

    filepath, kind = _parse_backfill_file_context(row)
    if not filepath or not Path(filepath).is_file():
        return "skipped_missing", asset_id

    metadata_raw = _parse_backfill_metadata_raw(row)
    result = await index_asset_vector(db, vector_service, asset_id, filepath, kind, metadata_raw=metadata_raw)
    if result.ok and bool(result.data):
        return "indexed", asset_id
    if result.ok:
        return "skipped", asset_id
    return "error", asset_id


def _parse_backfill_asset_id(row: dict[str, Any]) -> int:
    try:
        return int(row.get("id") or 0)
    except Exception:
        return 0


def _parse_backfill_file_context(row: dict[str, Any]) -> tuple[str, FileKind]:
    filepath = str(row.get("filepath") or "").strip()
    kind: FileKind = "video" if str(row.get("kind") or "").strip().lower() == "video" else "image"
    return filepath, kind


def _parse_backfill_metadata_raw(row: dict[str, Any]) -> dict[str, Any] | None:
    raw = row.get("metadata_raw")
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str) and raw.strip():
        try:
            parsed = json.loads(raw)
            return parsed if isinstance(parsed, dict) else None
        except Exception:
            return None
    return None


async def _backfill_missing_asset_vectors(
    db: Any,
    vector_service: Any,
    *,
    batch_size: int = 64,
    scope: str = "output",
    custom_root_id: str = "",
    on_progress: Any | None = None,
) -> Result[dict[str, int | str | None]]:
    """
    Generate embeddings for existing assets that currently have no vector.

    Targets image and video assets.
    """
    try:
        from ...features.index.vector_indexer import index_asset_vector
    except Exception as exc:
        return Result.Err("SERVICE_UNAVAILABLE", safe_error_message(exc, "Vector indexer unavailable"))

    size = _normalize_backfill_batch_size(batch_size)
    normalized_scope = _normalize_backfill_scope(scope)
    if not normalized_scope:
        return Result.Err("INVALID_INPUT", "Invalid scope. Must be one of: output, input, custom, all")
    normalized_custom_root = _normalize_backfill_custom_root(normalized_scope, custom_root_id)
    if normalized_scope == "custom" and not normalized_custom_root:
        return Result.Err("INVALID_INPUT", "Missing custom_root_id for custom scope")

    scope_sql, scope_params = _build_backfill_scope_clause(normalized_scope, normalized_custom_root)
    counters = _BackfillCounters(batch_size=size)
    totals_res = await _count_backfill_scope_totals(db=db, scope_sql=scope_sql, scope_params=scope_params)
    if not totals_res.ok:
        return Result.Err(totals_res.code, totals_res.error or "Failed to count backfill totals")
    totals = totals_res.data or {}
    counters.eligible_total = int(totals.get("eligible_total") or 0)
    counters.candidate_total = int(totals.get("candidate_total") or 0)
    _emit_backfill_progress(on_progress, counters)
    result = await _run_backfill_vector_query_loop(
        db=db,
        vector_service=vector_service,
        index_asset_vector=index_asset_vector,
        scope_sql=scope_sql,
        scope_params=scope_params,
        counters=counters,
        on_progress=on_progress,
    )
    if not result.ok:
        return result
    return Result.Ok(
        {
            **counters.as_payload(),
            "scope": normalized_scope,
            "custom_root_id": normalized_custom_root or None,
        }
    )


def _normalize_backfill_batch_size(batch_size: int) -> int:
    return max(1, min(200, int(batch_size or 64)))


async def _count_backfill_scope_totals(
    *,
    db: Any,
    scope_sql: str,
    scope_params: list[Any],
) -> Result[dict[str, int]]:
    count_res = await db.aquery(
        """
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
        + scope_sql,
        tuple(scope_params),
    )
    if not count_res.ok:
        return Result.Err("DB_ERROR", count_res.error or "Failed to count eligible assets")
    rows = count_res.data or []
    row = rows[0] if rows else {}
    try:
        eligible_total = int((row or {}).get("eligible_total") or 0)
    except Exception:
        eligible_total = 0
    try:
        candidate_total = int((row or {}).get("candidate_total") or 0)
    except Exception:
        candidate_total = 0
    return Result.Ok(
        {
            "eligible_total": max(0, eligible_total),
            "candidate_total": max(0, candidate_total),
        }
    )


def _normalize_backfill_custom_root(normalized_scope: str, custom_root_id: str) -> str:
    return str(custom_root_id or "").strip() if normalized_scope == "custom" else ""


class _BackfillCounters:
    def __init__(self, *, batch_size: int) -> None:
        self.eligible_total = 0
        self.candidate_total = 0
        self.candidates = 0
        self.indexed = 0
        self.skipped = 0
        self.skipped_missing_files = 0
        self.errors = 0
        self.batch_size = int(batch_size)

    def as_payload(self) -> dict[str, int]:
        return {
            "eligible_total": int(self.eligible_total),
            "total_assets": int(self.eligible_total),
            "candidate_total": int(self.candidate_total),
            "candidates": int(self.candidates),
            "indexed": int(self.indexed),
            "skipped": int(self.skipped),
            "skipped_missing_files": int(self.skipped_missing_files),
            "errors": int(self.errors),
            "batch_size": int(self.batch_size),
        }


def _emit_backfill_progress(on_progress: Any | None, counters: _BackfillCounters) -> None:
    if not callable(on_progress):
        return
    try:
        on_progress(counters.as_payload())
    except Exception:
        return


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
    last_id = 0
    while True:
        await _vector_backfill_wait_for_priority_window()
        rows_res = await _query_missing_vector_rows(
            db=db,
            last_id=last_id,
            scope_sql=scope_sql,
            scope_params=scope_params,
            batch_size=counters.batch_size,
        )
        if not rows_res.ok:
            return Result.Err(rows_res.code, rows_res.error or "Failed to query missing vector rows")
        rows = rows_res.data or []
        if not rows:
            break
        last_id = await _process_backfill_rows(rows, db, vector_service, index_asset_vector, counters, on_progress)
        if len(rows) < counters.batch_size:
            break
        _emit_backfill_progress(on_progress, counters)
    _emit_backfill_progress(on_progress, counters)
    return Result.Ok({})


async def _query_missing_vector_rows(
    *,
    db: Any,
    last_id: int,
    scope_sql: str,
    scope_params: list[Any],
    batch_size: int,
) -> Result[list[dict[str, Any]]]:
    rows_res = await db.aquery(
        """
        SELECT a.id, a.filepath, a.kind, m.metadata_raw
        FROM assets a
        LEFT JOIN vec.asset_embeddings ae ON ae.asset_id = a.id
        LEFT JOIN asset_metadata m ON m.asset_id = a.id
        WHERE a.id > ?
          AND a.kind IN ('image', 'video')
          AND (ae.asset_id IS NULL OR ae.vector IS NULL OR length(ae.vector) = 0)
        """
        + scope_sql
        + """
        ORDER BY a.id ASC
        LIMIT ?
        """,
        (int(last_id), *scope_params, int(batch_size)),
    )
    if not rows_res.ok:
        return Result.Err("DB_ERROR", rows_res.error or "Failed to query missing vectors")
    return Result.Ok(rows_res.data or [])


async def _process_backfill_rows(
    rows: list[dict[str, Any]],
    db: Any,
    vector_service: Any,
    index_asset_vector: Any,
    counters: _BackfillCounters,
    on_progress: Any | None,
) -> int:
    last_id = 0
    for row in rows:
        outcome, row_asset_id = await _process_backfill_row(db, vector_service, row, index_asset_vector)
        if outcome == "skip_invalid":
            continue
        last_id = row_asset_id
        _accumulate_backfill_outcome(counters, outcome)
        _emit_backfill_progress(on_progress, counters)
    return last_id


def _accumulate_backfill_outcome(counters: _BackfillCounters, outcome: str) -> None:
    counters.candidates += 1
    if outcome == "indexed":
        counters.indexed += 1
    elif outcome == "skipped_missing":
        counters.skipped += 1
        counters.skipped_missing_files += 1
    elif outcome == "skipped":
        counters.skipped += 1
    else:
        counters.errors += 1


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
