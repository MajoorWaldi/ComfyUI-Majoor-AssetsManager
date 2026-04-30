"""Transaction, lifecycle, and reset helpers extracted from ``sqlite_facade``."""

from __future__ import annotations

import asyncio
import ctypes
import gc
import os
import sqlite3
import subprocess
import uuid
from contextlib import asynccontextmanager
from pathlib import Path
from queue import Empty
from typing import Any

import aiosqlite

from ...shared import ErrorCode, Result, get_logger
from .transaction_manager import get_tx_state as tx_get_tx_state
from .transaction_manager import register_tx_token as tx_register_tx_token
from .transaction_manager import rename_or_delete as tx_rename_or_delete
from .transaction_manager import schedule_delete_on_reboot as tx_schedule_delete_on_reboot

logger = get_logger(__name__)


async def begin_tx_with_retry(self, conn: aiosqlite.Connection, begin_stmt: str) -> None:
    for attempt in range(self._lock_retry_attempts + 1):
        try:
            await conn.execute(begin_stmt)
            return
        except sqlite3.OperationalError as exc:  # type: ignore[name-defined]
            if self._is_locked_error(exc) and attempt < self._lock_retry_attempts:
                await self._sleep_backoff(attempt)
                continue
            raise


def register_tx_token(self, token: str, conn: aiosqlite.Connection, lock: asyncio.Lock | None) -> None:
    tx_register_tx_token(self, token, conn, lock)


async def abort_begin_tx(self, conn: aiosqlite.Connection | None, lock: asyncio.Lock | None) -> None:
    if conn is not None:
        try:
            await conn.rollback()
        except Exception:
            pass
        await self._release_connection_async(conn)
    if lock is not None:
        try:
            lock.release()
        except Exception:
            pass


def get_tx_state(self, token: str) -> tuple[aiosqlite.Connection | None, bool]:
    return tx_get_tx_state(self, token)


async def commit_with_retry(self, conn: aiosqlite.Connection) -> None:
    for attempt in range(self._lock_retry_attempts + 1):
        try:
            await conn.commit()
            return
        except Exception as exc:  # sqlite3.OperationalError on current runtime
            if self._is_locked_error(exc) and attempt < self._lock_retry_attempts:
                await self._sleep_backoff(attempt)
                continue
            raise


async def cleanup_tx_state(
    self,
    token: str,
    conn: aiosqlite.Connection,
    had_write_lock: bool,
    lock: asyncio.Lock | None,
) -> None:
    try:
        with self._tx_state_lock:
            self._tx_conns.pop(token, None)
            if had_write_lock:
                self._tx_write_lock_tokens.discard(token)
    except Exception:
        pass
    await self._release_connection_async(conn)
    if lock is not None and had_write_lock:
        try:
            lock.release()
        except Exception:
            pass


async def begin_tx_async(self, mode: str) -> Result[str]:
    await self._ensure_initialized_async()
    lock = self._write_lock
    if lock is not None:
        await lock.acquire()
    conn: Any = None
    try:
        conn = await self._acquire_connection_async()
        token = f"tx_{uuid.uuid4().hex}"
        begin_stmt = self._begin_stmt_for_mode(mode)
        try:
            await self._begin_tx_with_retry(conn, begin_stmt)
            self._register_tx_token(token, conn, lock)
            return Result.Ok(token)
        except Exception as exc:
            await self._abort_begin_tx(conn, lock)
            return Result.Err(ErrorCode.DB_ERROR, str(exc))
    except Exception as exc:
        await self._abort_begin_tx(conn, lock)
        return Result.Err(ErrorCode.DB_ERROR, str(exc))


async def commit_tx_async(self, token: str) -> Result[bool]:
    lock = self._write_lock
    conn, had_write_lock = self._get_tx_state(token)
    if not conn:
        return Result.Err(ErrorCode.DB_ERROR, "Transaction connection missing")
    try:
        await self._commit_with_retry(conn)
        return Result.Ok(True)
    except Exception as exc:
        try:
            await conn.rollback()
        except Exception:
            pass
        return Result.Err(ErrorCode.DB_ERROR, str(exc))
    finally:
        await self._cleanup_tx_state(token, conn, had_write_lock, lock)


async def rollback_tx_async(self, token: str) -> Result[bool]:
    lock = self._write_lock
    try:
        with self._tx_state_lock:
            conn = self._tx_conns.get(token)
            had_write_lock = token in self._tx_write_lock_tokens
    except Exception:
        conn = None
        had_write_lock = False
    if not conn:
        return Result.Err(ErrorCode.DB_ERROR, "Transaction connection missing")
    try:
        try:
            await conn.rollback()
        except Exception:
            pass
        return Result.Ok(True)
    finally:
        try:
            with self._tx_state_lock:
                self._tx_conns.pop(token, None)
                if had_write_lock:
                    self._tx_write_lock_tokens.discard(token)
        except Exception:
            pass
        await self._release_connection_async(conn)
        if lock is not None and had_write_lock:
            try:
                lock.release()
            except Exception:
                pass


async def close_all_async(self):
    tokens = list(self._tx_conns.keys())
    for token in tokens:
        conn = self._tx_conns.pop(token, None)
        if not conn:
            continue
        try:
            await conn.close()
        except Exception:
            pass

    while True:
        try:
            conn = self._pool.get_nowait()
        except Empty:
            break
        try:
            await conn.close()
        except Exception:
            pass

    active_list = list(self._active_conns)
    for conn in active_list:
        try:
            await conn.close()
        except Exception:
            pass
    self._active_conns.clear()
    self._active_conns_idle.set()
    self._async_sem = None


async def aclose_async(self):
    if getattr(self, "_closing", False):
        return
    self._closing = True
    fut = self._loop_thread.submit(self._close_all_async())
    try:
        await asyncio.wrap_future(fut)
    finally:
        self._stop_asset_lock_pruner()
        self._loop_thread.stop()
        self._closing = False


async def checkpoint_wal_before_reset_async(self) -> None:
    await self._ensure_initialized_async()
    conn = await self._acquire_connection_async()
    try:
        for attempt in range(self._lock_retry_attempts + 1):
            try:
                cur = await conn.execute("PRAGMA wal_checkpoint(TRUNCATE)")
                try:
                    await cur.fetchall()
                finally:
                    try:
                        await cur.close()
                    except Exception:
                        pass
                break
            except Exception as exc:
                if self._is_locked_error(exc) and attempt < self._lock_retry_attempts:
                    await self._sleep_backoff(attempt)
                    continue
                raise
    finally:
        await self._release_connection_async(conn)


async def drain_for_reset_async(self):
    self._resetting = True
    try:
        await self._checkpoint_wal_before_reset_async()
    except Exception as exc:
        logger.debug("DB Reset: WAL checkpoint pre-drain failed: %s", exc)
    drained = await asyncio.to_thread(self._active_conns_idle.wait, 5.0)
    if not drained and self._active_conns:
        logger.warning("DB Reset: Forced close with %d active connections", len(self._active_conns))
    await self._close_all_async()


async def drain_for_reset(self) -> None:
    fut = self._loop_thread.submit(self._drain_for_reset_async())
    await asyncio.wrap_future(fut)
    await asyncio.sleep(0.5)
    gc.collect()


def has_async_runtime_state(self) -> bool:
    return all(hasattr(self, attr) for attr in ("_loop_thread", "_pool", "_tx_conns"))


async def areset(self) -> Result[bool]:
    try:
        deleted_files: list[str] = []
        renamed_files: list[dict[str, str]] = []
        await self._drain_for_reset()
        delete_err = await self._delete_reset_files(deleted_files, renamed_files)
        if delete_err is not None:
            with self._lock:
                self._resetting = False
            return delete_err

        with self._lock:
            self._initialized = False
            self._resetting = True

        await self._ensure_initialized_async(allow_during_reset=True)
        with self._lock:
            self._resetting = False

        from .schema import (
            ensure_columns_exist,
            ensure_indexes_and_triggers,
            ensure_tables_exist,
        )

        schema_res = await ensure_tables_exist(self)
        if not schema_res.ok:
            return schema_res

        if self._has_async_runtime_state():
            columns_res = await ensure_columns_exist(self)
            if not columns_res.ok:
                return columns_res
        else:
            logger.debug("Skipping ensure_columns_exist during reset for partially constructed Sqlite instance")

        indexes_res = await ensure_indexes_and_triggers(self)
        if not indexes_res.ok:
            return indexes_res

        return Result.Ok(True, deleted_files=deleted_files, renamed_files=renamed_files)
    except Exception as exc:
        with self._lock:
            self._resetting = False
        logger.error("DB Reset failed: %s", exc)
        return Result.Err("RESET_FAILED", str(exc))


def schedule_delete_on_reboot(path: Path) -> bool:
    return tx_schedule_delete_on_reboot(path)


async def delete_reset_files(
    self,
    deleted_files: list[str],
    renamed_files: list[dict[str, str]],
) -> Result[bool] | None:
    base = str(self.db_path)
    for ext in ["", "-wal", "-shm", "-journal"]:
        path = Path(base + ext)
        if not path.exists():
            continue
        err = await self._delete_or_recover_reset_file(path, deleted_files, renamed_files)
        if err is not None:
            return err
    return None


async def delete_or_recover_reset_file(
    self,
    path: Path,
    deleted_files: list[str],
    renamed_files: list[dict[str, str]],
) -> Result[bool] | None:
    deleted, last_error = await self._delete_reset_file_with_retries(path, deleted_files)
    if deleted:
        return None
    logger.warning("Failed to delete %s after retries: %s", path, last_error)
    recover = self._rename_or_schedule_delete(path, renamed_files, last_error)
    return None if recover.ok else recover


async def delete_reset_file_with_retries(
    self,
    path: Path,
    deleted_files: list[str],
) -> tuple[bool, Exception | None]:
    last_error: Exception | None = None
    forced_release_attempted = False
    for attempt in range(5):
        try:
            path.unlink()
            deleted_files.append(str(path))
            return True, None
        except Exception as exc:
            last_error = exc
            if not forced_release_attempted and self._is_windows_sharing_violation(exc):
                forced_release_attempted = True
                try:
                    terminated = await asyncio.to_thread(self._terminate_locking_processes_windows, path)
                    if terminated:
                        logger.warning(
                            "Terminated locking process(es) for %s: %s",
                            path,
                            ", ".join(str(pid) for pid in terminated),
                        )
                        await asyncio.sleep(0.6)
                        gc.collect()
                        continue
                except Exception as kill_exc:
                    logger.debug("Failed to terminate locking process(es) for %s: %s", path, kill_exc)
            await asyncio.sleep(0.5 + (attempt * 0.2))
            gc.collect()
    return False, last_error


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


def lock_kill_enabled() -> bool:
    raw = os.getenv("MJR_AM_DB_FORCE_KILL_LOCKERS", os.getenv("MAJOOR_DB_FORCE_KILL_LOCKERS", "1"))
    return str(raw or "").strip().lower() in {"1", "true", "yes", "on"}


def build_rm_ctypes_types(wintypes: Any) -> tuple[Any, Any, Any]:
    class FILETIME(ctypes.Structure):
        _fields_ = [
            ("dwLowDateTime", wintypes.DWORD),
            ("dwHighDateTime", wintypes.DWORD),
        ]

    class RM_UNIQUE_PROCESS(ctypes.Structure):
        _fields_ = [
            ("dwProcessId", wintypes.DWORD),
            ("ProcessStartTime", FILETIME),
        ]

    class RM_PROCESS_INFO(ctypes.Structure):
        _fields_ = [
            ("Process", RM_UNIQUE_PROCESS),
            ("strAppName", wintypes.WCHAR * 256),
            ("strServiceShortName", wintypes.WCHAR * 64),
            ("ApplicationType", wintypes.DWORD),
            ("AppStatus", wintypes.ULONG),
            ("TSSessionId", wintypes.DWORD),
            ("bRestartable", wintypes.BOOL),
        ]

    return FILETIME, RM_UNIQUE_PROCESS, RM_PROCESS_INFO


def configure_rm_dll(rm: Any, wintypes: Any, RM_PROCESS_INFO: Any) -> None:
    rm.RmStartSession.argtypes = [ctypes.POINTER(wintypes.DWORD), wintypes.DWORD, wintypes.LPWSTR]
    rm.RmStartSession.restype = wintypes.DWORD
    rm.RmRegisterResources.argtypes = [
        wintypes.DWORD,
        ctypes.c_uint,
        ctypes.POINTER(wintypes.LPCWSTR),
        ctypes.c_uint,
        ctypes.c_void_p,
        ctypes.c_uint,
        ctypes.c_void_p,
    ]
    rm.RmRegisterResources.restype = wintypes.DWORD
    rm.RmGetList.argtypes = [
        wintypes.DWORD,
        ctypes.POINTER(ctypes.c_uint),
        ctypes.POINTER(ctypes.c_uint),
        ctypes.POINTER(RM_PROCESS_INFO),
        ctypes.POINTER(wintypes.DWORD),
    ]
    rm.RmGetList.restype = wintypes.DWORD
    rm.RmEndSession.argtypes = [wintypes.DWORD]
    rm.RmEndSession.restype = wintypes.DWORD


def rm_query_pids(rm: Any, session: Any, path: Path, wintypes: Any, RM_PROCESS_INFO: Any) -> list[int]:
    ERROR_MORE_DATA = 234
    files = (wintypes.LPCWSTR * 1)(str(path))
    reg_res = rm.RmRegisterResources(session, 1, files, 0, None, 0, None)
    if int(reg_res) != 0:
        return []

    needed = ctypes.c_uint(0)
    count = ctypes.c_uint(0)
    reasons = wintypes.DWORD(0)
    get_res = rm.RmGetList(session, ctypes.byref(needed), ctypes.byref(count), None, ctypes.byref(reasons))
    if int(get_res) not in (0, ERROR_MORE_DATA):
        return []
    if int(needed.value) <= 0:
        return []

    infos = (RM_PROCESS_INFO * int(needed.value))()
    count = ctypes.c_uint(int(needed.value))
    get_res = rm.RmGetList(
        session,
        ctypes.byref(needed),
        ctypes.byref(count),
        infos,
        ctypes.byref(reasons),
    )
    if int(get_res) != 0:
        return []

    pids: list[int] = []
    for i in range(int(count.value)):
        pid = int(getattr(infos[i].Process, "dwProcessId", 0) or 0)
        if pid > 0:
            pids.append(pid)
    seen: set[int] = set()
    out: list[int] = []
    for pid in pids:
        if pid in seen:
            continue
        seen.add(pid)
        out.append(pid)
    return out


def find_locking_pids_windows(cls, path: Path) -> list[int]:
    if os.name != "nt":
        return []
    try:
        from ctypes import wintypes

        CCH_RM_SESSION_KEY = 32
        _FILETIME, _RM_UNIQUE_PROCESS, RM_PROCESS_INFO = build_rm_ctypes_types(wintypes)

        win_dll = getattr(ctypes, "WinDLL", None)
        if win_dll is None:
            return []
        rm = win_dll("Rstrtmgr")
        configure_rm_dll(rm, wintypes, RM_PROCESS_INFO)

        session = wintypes.DWORD(0)
        session_key = ctypes.create_unicode_buffer(CCH_RM_SESSION_KEY + 1)
        start_res = rm.RmStartSession(ctypes.byref(session), 0, session_key)
        if int(start_res) != 0:
            return []
        try:
            return rm_query_pids(rm, session, path, wintypes, RM_PROCESS_INFO)
        finally:
            try:
                rm.RmEndSession(session)
            except Exception:
                pass
    except Exception:
        return []


def terminate_locking_processes_windows(self, path: Path) -> list[int]:
    if os.name != "nt" or not lock_kill_enabled():
        return []
    pids = find_locking_pids_windows(self, path)
    if not pids:
        return []

    current_pid = int(os.getpid())
    terminated: list[int] = []
    for pid in pids:
        if pid <= 0 or pid == current_pid:
            continue
        try:
            proc = subprocess.run(
                ["taskkill", "/PID", str(pid), "/T", "/F"],
                capture_output=True,
                text=True,
                timeout=8,
            )
            if int(proc.returncode) == 0:
                terminated.append(pid)
            else:
                logger.debug(
                    "taskkill failed for PID %s (path=%s): rc=%s stderr=%s",
                    pid,
                    path,
                    proc.returncode,
                    (proc.stderr or "").strip(),
                )
        except Exception as exc:
            logger.debug("taskkill exception for PID %s (path=%s): %s", pid, path, exc)
    return terminated


def rename_or_schedule_delete(path: Path, renamed_files: list[dict[str, str]], last_error: Exception | None):
    return tx_rename_or_delete(path, renamed_files, last_error)


async def begin_tx_for_async(self, mode: str) -> Result[str]:
    fut = self._loop_thread.submit(self._begin_tx_async(mode))
    return await asyncio.wrap_future(fut)


async def commit_tx_for_async(self, token: str) -> Result[bool]:
    fut = self._loop_thread.submit(self._commit_tx_async(token))
    return await asyncio.wrap_future(fut)


async def rollback_tx_for_async(self, token: str) -> Result[bool]:
    fut = self._loop_thread.submit(self._rollback_tx_async(token))
    return await asyncio.wrap_future(fut)


@asynccontextmanager
async def transaction_context(self, token_ctx: Any, mode: str = "immediate"):
    try:
        current_token = token_ctx.get()
    except Exception:
        current_token = None
    if current_token:
        yield Result.Ok(True)
        return

    tx_state = Result.Ok(True)
    begin_res = await self._begin_tx_for_async(mode)
    if not begin_res.ok or not begin_res.data:
        tx_state = Result.Err(ErrorCode.DB_ERROR, str(begin_res.error or "Failed to begin transaction"))
        yield tx_state
        return

    token = str(begin_res.data)
    token_handle = token_ctx.set(token)
    try:
        yield tx_state
        commit_res = await self._commit_tx_for_async(token)
        if not commit_res.ok:
            tx_state.ok = False
            tx_state.code = str(getattr(commit_res, "code", None) or ErrorCode.DB_ERROR)
            tx_state.error = str(commit_res.error or "Commit failed")
    except Exception:
        try:
            await self._rollback_tx_for_async(token)
        except Exception:
            pass
        raise
    finally:
        token_ctx.reset(token_handle)
