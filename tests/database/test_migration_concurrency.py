import asyncio

import pytest

from mjr_am_backend.adapters.db.schema import migrate_schema
from mjr_am_backend.adapters.db.sqlite_facade import Sqlite


@pytest.mark.asyncio
async def test_migrate_schema_while_queries_are_active(tmp_path) -> None:
    db = Sqlite(str(tmp_path / "concurrent_migrate.sqlite"), attach={"vec": str(tmp_path / "vectors.sqlite")})
    try:
        await db.aexecute("CREATE TABLE IF NOT EXISTS t_conc (id INTEGER PRIMARY KEY, v TEXT)")
        await db.aexecute("INSERT INTO t_conc(v) VALUES (?)", ("x",))

        async def _query_burst():
            for _ in range(8):
                out = await db.aquery("SELECT id, v FROM t_conc")
                assert out.ok
                await asyncio.sleep(0)

        query_task = asyncio.create_task(_query_burst())
        migrate_out = await migrate_schema(db)
        await query_task

        assert migrate_out.ok
    finally:
        await db.aclose()


@pytest.mark.asyncio
async def test_nested_atransaction_reuses_outer_transaction(tmp_path) -> None:
    db = Sqlite(str(tmp_path / "nested_tx.sqlite"), attach={"vec": str(tmp_path / "vectors.sqlite")})
    try:
        create_out = await db.aexecute("CREATE TABLE IF NOT EXISTS nested_tx (id INTEGER PRIMARY KEY, v TEXT)")
        assert create_out.ok

        async with db.atransaction(mode="immediate") as outer_tx:
            assert outer_tx.ok
            async with db.atransaction(mode="immediate") as inner_tx:
                assert inner_tx.ok
                insert_out = await db.aexecute("INSERT INTO nested_tx(v) VALUES (?)", ("ok",))
                assert insert_out.ok

        rows = await db.aquery("SELECT v FROM nested_tx ORDER BY id")
        assert rows.ok
        assert [row["v"] for row in (rows.data or [])] == ["ok"]
    finally:
        await db.aclose()
