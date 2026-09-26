"""Connection and pool helpers extracted from ``sqlite_facade``."""

from __future__ import annotations

import asyncio
import sqlite3
from contextlib import asynccontextmanager
from pathlib import Path
from queue import Empty
from typing import Any

import aiosqlite
from mjr_am_backend.shared import get_logger

from .connection_pool import runtime_status as pool_runtime_status

logger = get_logger(__name__)


def get_runtime_status(self, *, busy_timeout_ms: int) -> dict[str, Any]:
    return pool_runtime_status(self, busy_timeout_ms=busy_timeout_ms)


async def apply_connection_pragmas(
    conn: aiosqlite.Connection,
    *,
    cache_size_kib: int,
    busy_timeout_ms: int,
) -> None:
    await conn.execute("PRAGMA journal_mode=WAL")
    await conn.execute("PRAGMA synchronous=NORMAL")
    if not isinstance(cache_size_kib, int):
        raise TypeError(f"cache_size_kib must be int, got {type(cache_size_kib).__name__}")
    await conn.execute(f"PRAGMA cache_size={cache_size_kib}")
    await conn.execute("PRAGMA temp_store=MEMORY")
    if not isinstance(busy_timeout_ms, int):
        raise TypeError(f"busy_timeout_ms must be int, got {type(busy_timeout_ms).__name__}")
    await conn.execute(f"PRAGMA busy_timeout={busy_timeout_ms}")
    await conn.execute("PRAGMA foreign_keys=ON")


async def create_connection(
    self,
    *,
    cache_size_kib: int,
    busy_timeout_ms: int,
) -> aiosqlite.Connection:
    conn = await aiosqlite.connect(str(self.db_path), timeout=self._timeout, isolation_level=None)
    conn.row_factory = sqlite3.Row
    await apply_connection_pragmas(conn, cache_size_kib=cache_size_kib, busy_timeout_ms=busy_timeout_ms)
    for schema_name, attach_path in self._attach_dbs.items():
        Path(attach_path).parent.mkdir(parents=True, exist_ok=True)
        await conn.execute(f"ATTACH DATABASE ? AS [{schema_name}]", (attach_path,))
    return conn


async def acquire_connection_async(self) -> aiosqlite.Connection:
    if self._async_sem is None:
        with self._lock:
            if self._async_sem is None:
                self._async_sem = asyncio.Semaphore(self._max_conn_limit)

    with self._lock:
        if self._resetting:
            raise RuntimeError("Database is resetting - connection rejected")

    sem = self._async_sem
    await sem.acquire()
    try:
        with self._lock:
            if self._resetting:
                raise RuntimeError("Database is resetting - connection rejected")
        try:
            conn = self._pool.get_nowait()
        except Empty:
            conn = await self._create_connection()
        self._active_conns.add(conn)
        self._active_conns_idle.clear()
        return conn
    except Exception:
        sem.release()
        raise


async def release_connection_async(self, conn: aiosqlite.Connection):
    try:
        self._active_conns.discard(conn)
        if not self._active_conns:
            self._active_conns_idle.set()
        if not conn:
            return
        if getattr(conn, "_mjr_closed", False):
            return
        if not self._pool.full():
            self._pool.put(conn)
        else:
            try:
                await conn.close()
            except Exception:
                logger.debug("release_connection_async: suppressed exception", exc_info=True)
    finally:
        if self._async_sem:
            self._async_sem.release()


async def ensure_initialized_async(
    self,
    *,
    allow_during_reset: bool = False,
    cache_size_kib: int,
    busy_timeout_ms: int,
) -> None:
    if self._initialized:
        return
    with self._lock:
        if self._initialized:
            return
    direct_conn = bool(self._resetting and allow_during_reset)
    if direct_conn:
        conn = await create_connection(self, cache_size_kib=cache_size_kib, busy_timeout_ms=busy_timeout_ms)
    else:
        conn = await acquire_connection_async(self)
    try:
        await apply_connection_pragmas(conn, cache_size_kib=cache_size_kib, busy_timeout_ms=busy_timeout_ms)
        await conn.commit()
    finally:
        if direct_conn:
            try:
                await conn.close()
            except Exception:
                logger.debug("ensure_initialized_async: suppressed exception", exc_info=True)
        else:
            await release_connection_async(self, conn)
    with self._lock:
        self._initialized = True
        if self._write_lock is None:
            self._write_lock = asyncio.Lock()


@asynccontextmanager
async def lock_for_asset(self, asset_id: Any):
    lock = self._get_or_create_asset_lock(asset_id)
    await asyncio.to_thread(lock.acquire)
    try:
        yield
    finally:
        lock.release()
