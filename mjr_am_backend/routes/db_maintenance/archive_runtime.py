"""Backup, restore, and maintenance task helpers extracted from db_maintenance routes."""

from __future__ import annotations

import asyncio
import datetime
import gc
import os
import shutil
import sqlite3
from pathlib import Path
from typing import Any

from ...shared import get_logger
from ..core import safe_error_message

logger = get_logger(__name__)


def archive_root_resolved(archive_dir: Path) -> Path:
    try:
        return archive_dir.resolve(strict=False)
    except Exception:
        return archive_dir


def resolve_archive_source(name: str, archive_dir: Path) -> Path | None:
    safe_name = str(name or "").strip()
    if not safe_name:
        return None
    if "/" in safe_name or "\\" in safe_name or "\x00" in safe_name:
        return None
    try:
        src = (archive_dir / safe_name).resolve(strict=False)
    except Exception:
        return None
    try:
        src.relative_to(archive_root_resolved(archive_dir))
    except Exception:
        return None
    return src


def basename_list(paths: list[str]) -> str:
    names: list[str] = []
    for p in paths or []:
        try:
            names.append(Path(str(p)).name)
        except Exception:
            continue
    return ", ".join(names)


def task_done_logger(label: str):
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


def spawn_background_task(coro, *, label: str) -> None:
    try:
        task = asyncio.create_task(coro)
        task.add_done_callback(task_done_logger(label))
    except Exception as exc:
        logger.debug("Unable to start background task '%s': %s", label, exc)


async def stop_watcher_if_running(svc: dict | None) -> bool:
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


async def restart_watcher_if_needed(
    svc: dict | None,
    should_restart: bool,
    *,
    resolve_watcher_restart_paths_fn: Any,
) -> None:
    if not should_restart or not isinstance(svc, dict):
        return
    watcher = svc.get("watcher")
    if not watcher:
        return
    try:
        from mjr_am_backend.features.index.watcher_scope import build_watch_paths

        paths = resolve_watcher_restart_paths_fn(svc, build_watch_paths)
        if paths:
            await watcher.start(paths, asyncio.get_running_loop())
    except Exception as exc:
        logger.debug("Failed to restart watcher after DB maintenance: %s", exc)


def resolve_watcher_restart_paths(svc: dict[str, Any], build_watch_paths: Any) -> list[Path]:
    scope_cfg = svc.get("watcher_scope") if isinstance(svc.get("watcher_scope"), dict) else {}
    scope = str((scope_cfg or {}).get("scope") or "output")
    custom_root_id = (scope_cfg or {}).get("custom_root_id")
    active_user_id = str(svc.get("watcher_scope_active_user_id") or "").strip()
    return build_watch_paths(scope, custom_root_id, user_id=active_user_id or None)


def backup_name(now: datetime.datetime | None = None) -> str:
    ts = (now or datetime.datetime.now(datetime.timezone.utc)).strftime("%Y%m%d_%H%M%S_%f")[:-3]
    return f"assets_{ts}.sqlite"


def next_backup_target(archive_dir: Path, *, backup_name_fn: Any) -> Path:
    target = archive_dir / backup_name_fn()
    if not target.exists():
        return target
    stem = target.stem
    suffix = target.suffix or ".sqlite"
    for index in range(2, 1000):
        candidate = target.with_name(f"{stem}_{index}{suffix}")
        if not candidate.exists():
            return candidate
    raise RuntimeError("Failed to reserve unique DB backup filename")


def list_backup_files(archive_dir: Path) -> list[dict[str, str | int]]:
    if not archive_dir.exists():
        return []
    rows: list[dict[str, str | int]] = []
    for p in archive_dir.glob("*.sqlite"):
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


def sqlite_backup_file(src: Path, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(str(src)) as src_conn:
        with sqlite3.connect(str(dst)) as dst_conn:
            src_conn.backup(dst_conn)


def emit_restore_status(step: str, level: str = "info", message: str | None = None, **extra) -> None:
    try:
        from ..registry import PromptServer

        payload = {"step": str(step or ""), "level": str(level or "info")}
        if message:
            payload["message"] = str(message)
        if extra:
            payload.update(extra)
        prompt_server = getattr(PromptServer, "instance", None)
        if prompt_server is not None:
            prompt_server.send_sync("mjr-db-restore-status", payload)
    except Exception:
        pass


async def remove_with_retry(path: Path, attempts: int = 6) -> None:
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


def is_windows_sharing_violation(exc: Exception) -> bool:
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


async def release_windows_db_lockers(path: Path, db: Any | None) -> list[int]:
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


async def replace_db_from_backup(src: Path, dst: Path, *, remove_with_retry_fn: Any) -> None:
    for suffix in ("", "-wal", "-shm", "-journal"):
        await remove_with_retry_fn(Path(str(dst) + suffix))
    await asyncio.to_thread(shutil.copy2, src, dst)
