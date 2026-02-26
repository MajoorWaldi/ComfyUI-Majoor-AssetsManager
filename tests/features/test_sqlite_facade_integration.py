import asyncio
from pathlib import Path

import pytest

from mjr_am_backend.adapters.db.sqlite_facade import Sqlite


@pytest.mark.asyncio
async def test_sqlite_facade_basic_queries(tmp_path: Path):
    db_path = tmp_path / "it.db"
    db = Sqlite(str(db_path), max_connections=2, timeout=2.0)
    try:
        r1 = await db.aexecute("CREATE TABLE IF NOT EXISTS t (id INTEGER PRIMARY KEY, name TEXT)")
        assert r1.ok

        r2 = await db.aexecutemany("INSERT INTO t (name) VALUES (?)", [("a",), ("b",), ("c",)])
        assert r2.ok

        q1 = await db.aquery("SELECT id, name FROM t ORDER BY id")
        assert q1.ok and len(q1.data) == 3

        q2 = await db.aquery_in("SELECT id, name FROM t WHERE {IN_CLAUSE} ORDER BY id", "id", [1, 3])
        assert q2.ok and [row["id"] for row in q2.data] == [1, 3]
    finally:
        await db.aclose()


@pytest.mark.asyncio
async def test_sqlite_facade_tx_and_schema_helpers(tmp_path: Path):
    db_path = tmp_path / "it2.db"
    db = Sqlite(str(db_path), max_connections=2, timeout=2.0)
    try:
        await db.aexecute("CREATE TABLE IF NOT EXISTS tx_t (id INTEGER PRIMARY KEY, v INTEGER)")

        async with db.atransaction(mode="immediate") as tx:
            assert tx.ok
            token = tx.data
            assert token
            await db.aexecute("INSERT INTO tx_t (v) VALUES (?)", (10,))

        q = await db.aquery("SELECT COUNT(*) AS c FROM tx_t")
        assert q.ok and int((q.data[0] or {}).get("c") or 0) >= 1

        has_t = await db.ahas_table("tx_t")
        assert has_t is True

        v1 = await db.aget_schema_version()
        assert isinstance(v1, int)

        sv = await db.aset_schema_version(v1 + 1)
        assert sv.ok

        v2 = await db.aget_schema_version()
        assert v2 == v1 + 1

        vac = await db.avacuum()
        assert vac.ok
    finally:
        await db.aclose()


@pytest.mark.asyncio
async def test_sqlite_facade_reset_path(tmp_path: Path):
    db_path = tmp_path / "it3.db"
    db = Sqlite(str(db_path), max_connections=2, timeout=2.0)
    try:
        await db.aexecute("CREATE TABLE IF NOT EXISTS z (id INTEGER PRIMARY KEY)")
        rr = await db.areset()
        assert rr.ok or rr.code in {"DELETE_FAILED", "FS_ERROR"}
    finally:
        await db.aclose()
