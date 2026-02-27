import types
import threading

import pytest

from mjr_am_backend.adapters.db import sqlite_facade as sf
from mjr_am_backend.shared import Result


def _make_stub_sqlite() -> sf.Sqlite:
    db = sf.Sqlite.__new__(sf.Sqlite)
    db._lock = threading.Lock()
    db._initialized = True
    db._resetting = False
    return db


@pytest.mark.asyncio
async def test_areset_uses_async_reinit_and_not_sync_init(monkeypatch) -> None:
    db = _make_stub_sqlite()
    calls: list[str] = []

    async def _drain(self):
        calls.append("drain")

    async def _delete(self, deleted_files, renamed_files):
        deleted_files.append("x.sqlite")
        _ = renamed_files
        calls.append("delete")
        return None

    async def _ensure(self, *, allow_during_reset: bool = False):
        calls.append(f"ensure:{allow_during_reset}")

    def _init_db(self):
        calls.append("init_db")

    import mjr_am_backend.adapters.db.schema as schema_mod

    async def _tables(_db):
        return Result.Ok(True)

    async def _indexes(_db):
        return Result.Ok(True)

    db._drain_for_reset = types.MethodType(_drain, db)
    db._delete_reset_files = types.MethodType(_delete, db)
    db._ensure_initialized_async = types.MethodType(_ensure, db)
    db._init_db = types.MethodType(_init_db, db)
    monkeypatch.setattr(schema_mod, "ensure_tables_exist", _tables)
    monkeypatch.setattr(schema_mod, "ensure_indexes_and_triggers", _indexes)

    out = await sf.Sqlite.areset(db)
    assert out.ok is True
    assert "drain" in calls
    assert "delete" in calls
    assert "ensure:True" in calls
    assert "init_db" not in calls
    assert db._resetting is False


@pytest.mark.asyncio
async def test_areset_unlocks_when_schema_step_fails(monkeypatch) -> None:
    db = _make_stub_sqlite()

    async def _drain(self):
        return None

    async def _delete(self, deleted_files, renamed_files):
        _ = (deleted_files, renamed_files)
        return None

    async def _ensure(self, *, allow_during_reset: bool = False):
        _ = allow_during_reset
        return None

    import mjr_am_backend.adapters.db.schema as schema_mod

    async def _tables(_db):
        return Result.Err("DB_ERROR", "schema failed")

    async def _indexes(_db):
        return Result.Ok(True)

    db._drain_for_reset = types.MethodType(_drain, db)
    db._delete_reset_files = types.MethodType(_delete, db)
    db._ensure_initialized_async = types.MethodType(_ensure, db)
    monkeypatch.setattr(schema_mod, "ensure_tables_exist", _tables)
    monkeypatch.setattr(schema_mod, "ensure_indexes_and_triggers", _indexes)

    out = await sf.Sqlite.areset(db)
    assert out.ok is False
    assert out.code == "DB_ERROR"
    assert db._resetting is False
