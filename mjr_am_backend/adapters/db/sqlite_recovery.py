"""Recovery helpers extracted from ``sqlite_facade``."""

from __future__ import annotations

import asyncio
import random
import sqlite3
import time
from collections.abc import Callable
from typing import Any

import aiosqlite

from ...shared import get_logger
from .db_recovery import (
    populate_known_columns_from_schema as recovery_populate_known_columns_from_schema,
)
from .transaction_manager import (
    is_missing_table_error as tx_is_missing_table_error,
)

logger = get_logger(__name__)


async def maybe_auto_reset_on_corruption(self, error: Exception) -> None:
    """
    Auto-reset DB on corruption by default; can be disabled with MAJOOR_DB_AUTO_RESET=false.
    """
    if not self._is_auto_reset_enabled():
        logger.error(
            "Corruption detected (%s). Auto-reset disabled (MAJOOR_DB_AUTO_RESET=false)",
            error,
        )
        return

    now = time.time()
    if self._is_auto_reset_throttled(now):
        logger.warning("Corruption auto-reset throttled (cooldown %.1fs)", float(self._auto_reset_cooldown_s))
        return
    self._mark_auto_reset_attempt(now)

    try:
        reset_res = await self.areset()
        self._record_auto_reset_result(reset_res)
    except Exception as exc:
        logger.error("Database auto-reset exception after corruption: %s", exc)
        with self._diag_lock:
            self._diag["auto_reset_failures"] = int(self._diag.get("auto_reset_failures") or 0) + 1
            self._diag["last_auto_reset_error"] = str(exc)


def mark_malformed_recovery_window(self, now: float) -> bool:
    with self._malformed_recovery_lock:
        if now - float(self._malformed_recovery_last_ts or 0.0) < 5.0:
            return False
        self._malformed_recovery_last_ts = now
        return True


async def run_recovery_pragma(
    self,
    rec_conn: aiosqlite.Connection,
    sql: str,
    *,
    fetch_one: bool = False,
) -> Any | None:
    for attempt in range(self._lock_retry_attempts + 1):
        try:
            cur = await rec_conn.execute(sql)
            try:
                if fetch_one:
                    return await cur.fetchone()
                await cur.fetchall()
                return True
            finally:
                try:
                    await cur.close()
                except Exception:
                    pass
        except sqlite3.OperationalError as exc:
            if self._is_locked_error(exc) and attempt < self._lock_retry_attempts:
                await sleep_backoff(self, attempt)
                continue
            raise
    return None


async def rebuild_assets_fts(self, rec_conn: aiosqlite.Connection) -> None:
    try:
        await run_recovery_pragma(self, rec_conn, "INSERT INTO assets_fts(assets_fts) VALUES('rebuild')")
    except sqlite3.OperationalError as fts_exc:
        if not tx_is_missing_table_error(fts_exc):
            logger.warning("FTS rebuild skipped during recovery: %s", fts_exc)
    except Exception as fts_exc:
        logger.warning("FTS rebuild error during recovery: %s", fts_exc)


async def reindex_asset_metadata_fts(self, rec_conn: aiosqlite.Connection) -> None:
    try:
        await run_recovery_pragma(self, rec_conn, "DELETE FROM asset_metadata_fts")
        await run_recovery_pragma(
            self,
            rec_conn,
            "INSERT INTO asset_metadata_fts(rowid, tags, tags_text, metadata_text)"
            " SELECT asset_id, COALESCE(tags, ''), COALESCE(tags_text, ''), COALESCE(metadata_text, '')"
            " FROM asset_metadata",
        )
    except sqlite3.OperationalError as fts_exc:
        if not tx_is_missing_table_error(fts_exc):
            logger.warning("FTS reindex skipped during recovery (asset_metadata_fts): %s", fts_exc)
    except Exception as fts_exc:
        logger.warning("FTS reindex error during recovery (asset_metadata_fts): %s", fts_exc)


async def rebuild_fts_during_recovery(self, rec_conn: aiosqlite.Connection) -> None:
    lock = self._write_lock
    fts_lock_acquired = False
    if lock is not None and not lock.locked():
        await lock.acquire()
        fts_lock_acquired = True
    try:
        await rebuild_assets_fts(self, rec_conn)
        await reindex_asset_metadata_fts(self, rec_conn)
    finally:
        if fts_lock_acquired and lock is not None:
            lock.release()


async def attempt_malformed_recovery_async(self) -> bool:
    """
    Best-effort online recovery for transient malformed errors.

    Uses a fresh connection (not the dirty one that triggered the error).
    FTS rebuild acquires the write lock when available.
    """
    now = time.time()
    if not mark_malformed_recovery_window(self, now):
        return False

    rec_conn: aiosqlite.Connection | None = None
    try:
        self._set_recovery_state("in_progress")
        logger.warning("DB malformed detected; attempting online recovery")

        try:
            rec_conn = await self._acquire_connection_async()
        except Exception as conn_exc:
            logger.warning("Online recovery: could not acquire fresh connection: %s", conn_exc)
            self._set_recovery_state("failed", str(conn_exc))
            return False

        await run_recovery_pragma(self, rec_conn, "PRAGMA wal_checkpoint(TRUNCATE)")
        row = await run_recovery_pragma(self, rec_conn, "PRAGMA quick_check", fetch_one=True)
        if not row or str(row[0]).lower() != "ok":
            self._set_recovery_state("failed", "quick_check failed")
            return False

        await rebuild_fts_during_recovery(self, rec_conn)

        self._set_recovery_state("success")
        return True
    except sqlite3.OperationalError as rec_exc:
        if self._is_locked_error(rec_exc):
            self._mark_locked_event(rec_exc)
            self._set_recovery_state("skipped_locked", str(rec_exc))
            logger.warning("Online recovery skipped due to active DB lock: %s", rec_exc)
            return False
        self._set_recovery_state("failed", str(rec_exc))
        logger.error("Online recovery failed: %s", rec_exc)
        return False
    finally:
        if rec_conn is not None:
            await self._release_connection_async(rec_conn)


async def attempt_missing_table_recovery_async(
    self,
    *,
    known_columns: set[str],
    known_columns_lock: Any,
    schema_table_aliases: dict[str, str | None],
    update_known_columns_lower: Callable[[dict[str, str]], None],
) -> bool:
    """
    Best-effort schema recovery when a query fails with "no such table".
    Throttled to avoid repeated heavy repairs under concurrent failures.
    """
    now = time.time()
    with self._schema_repair_lock:
        if (now - self._schema_repair_last_ts) < 5.0:
            return False
        self._schema_repair_last_ts = now
    try:
        from .schema import migrate_schema

        result = await migrate_schema(self)
        if result and result.ok:
            try:
                new_known_columns_lower = recovery_populate_known_columns_from_schema(
                    self.db_path,
                    known_columns,
                    known_columns_lock,
                    schema_table_aliases,
                )
                update_known_columns_lower(new_known_columns_lower)
            except Exception:
                pass
            return True
    except Exception as exc:
        logger.warning("Schema self-heal after missing table failed: %s", exc)
    return False


async def sleep_backoff(self, attempt: int):
    base = float(self._lock_retry_base_seconds)
    max_s = float(self._lock_retry_max_seconds)
    delay = min(max_s, base * (2 ** max(0, attempt)))
    delay = delay + (random.random() * 0.03)
    try:
        logger.debug("DB lock backoff: attempt=%d delay=%.3fs", int(attempt), float(delay))
    except Exception:
        pass
    await asyncio.sleep(delay)
