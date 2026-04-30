"""Tests for sqlite_recovery sub-module (malformed recovery, FTS rebuild, backoff)."""

from __future__ import annotations

import time

import pytest
import pytest_asyncio
from mjr_am_backend.adapters.db import sqlite_recovery as recovery_mod
from mjr_am_backend.adapters.db.sqlite_facade import Sqlite


@pytest_asyncio.fixture
async def db(tmp_path):
    inst = Sqlite(str(tmp_path / "recov_test.sqlite"), attach={"vec": str(tmp_path / "vectors.sqlite")})
    yield inst
    await inst.aclose()


class TestMalformedRecoveryWindow:
    def test_first_call_returns_true(self, db) -> None:
        assert recovery_mod.mark_malformed_recovery_window(db, time.time()) is True

    def test_second_call_within_5s_returns_false(self, db) -> None:
        now = time.time()
        recovery_mod.mark_malformed_recovery_window(db, now)
        assert recovery_mod.mark_malformed_recovery_window(db, now + 1.0) is False

    def test_call_after_5s_returns_true_again(self, db) -> None:
        now = time.time()
        recovery_mod.mark_malformed_recovery_window(db, now)
        assert recovery_mod.mark_malformed_recovery_window(db, now + 6.0) is True


@pytest.mark.asyncio
async def test_run_recovery_pragma_quick_check(db) -> None:
    await db._ensure_initialized_async()
    conn = await db._acquire_connection_async()
    try:
        row = await recovery_mod.run_recovery_pragma(
            db, conn, "PRAGMA quick_check", fetch_one=True,
        )
        assert row is not None
        assert str(row[0]).lower() == "ok"
    finally:
        await db._release_connection_async(conn)


@pytest.mark.asyncio
async def test_run_recovery_pragma_wal_checkpoint(db) -> None:
    await db._ensure_initialized_async()
    conn = await db._acquire_connection_async()
    try:
        result = await recovery_mod.run_recovery_pragma(
            db, conn, "PRAGMA wal_checkpoint(TRUNCATE)",
        )
        assert result is True
    finally:
        await db._release_connection_async(conn)


@pytest.mark.asyncio
async def test_attempt_malformed_recovery_on_healthy_db(db) -> None:
    """On a healthy database, malformed recovery should succeed (nothing is broken)."""
    await db._ensure_initialized_async()
    recovered = await recovery_mod.attempt_malformed_recovery_async(db)
    assert recovered is True


@pytest.mark.asyncio
async def test_sleep_backoff_is_within_bounds(db) -> None:
    """Backoff delay should stay within configured limits."""
    import asyncio
    start = asyncio.get_event_loop().time()
    await recovery_mod.sleep_backoff(db, 0)
    elapsed = asyncio.get_event_loop().time() - start
    assert elapsed < 2.0


@pytest.mark.asyncio
async def test_attempt_missing_table_recovery_creates_tables(tmp_path) -> None:
    """missing-table recovery should trigger schema migration and restore schema."""
    import sqlite3 as sql_mod

    db_path = tmp_path / "missing_table_recov.sqlite"
    conn = sql_mod.connect(str(db_path))
    try:
        conn.execute("CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL)")
        conn.execute("INSERT INTO metadata (key, value) VALUES ('schema_version', '0')")
        conn.commit()
    finally:
        conn.close()

    db = Sqlite(str(db_path), attach={"vec": str(tmp_path / "vectors.sqlite")})
    try:
        await db._ensure_initialized_async()
        repaired = await recovery_mod.attempt_missing_table_recovery_async(
            db,
            known_columns=set(),
            known_columns_lock=db._lock,
            schema_table_aliases=getattr(db, "_schema_table_aliases", {}),
            update_known_columns_lower=lambda d: None,
        )
        assert repaired is True
        rows = await db.aquery("SELECT COUNT(*) AS cnt FROM assets")
        assert rows.ok
    finally:
        await db.aclose()
