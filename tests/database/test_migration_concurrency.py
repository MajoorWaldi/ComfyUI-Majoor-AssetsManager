import asyncio

import pytest

from mjr_am_backend.adapters.db.schema import migrate_schema
from mjr_am_backend.adapters.db.sqlite_facade import Sqlite


@pytest.mark.asyncio
async def test_migrate_schema_while_queries_are_active(tmp_path) -> None:
    db = Sqlite(str(tmp_path / "concurrent_migrate.sqlite"))
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
