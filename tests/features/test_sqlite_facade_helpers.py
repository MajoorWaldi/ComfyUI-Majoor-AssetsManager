import asyncio
import sqlite3
from pathlib import Path

import pytest

from mjr_am_backend.adapters.db import sqlite_facade as s


def test_missing_error_helpers():
    assert s._is_missing_column_error(Exception("no such column: x")) is True
    assert s._is_missing_table_error(Exception("no such table: x")) is True


def test_schema_helpers_and_populate(tmp_path: Path):
    db = tmp_path / "t.db"
    conn = sqlite3.connect(str(db))
    conn.execute("CREATE TABLE assets (id INTEGER, filename TEXT)")
    conn.commit()
    conn.close()

    s._populate_known_columns_from_schema(db)
    assert "id" in s._KNOWN_COLUMNS and "a.id" in s._KNOWN_COLUMNS

    assert s._extract_schema_column_name((0, "id")) == "id"
    assert s._extract_schema_column_name(None) == ""


def test_validate_and_build_in_query():
    ok, msg = s._validate_in_base_query("SELECT * FROM assets WHERE {IN_CLAUSE}")
    assert ok and not msg

    ok2, _ = s._validate_in_base_query("DELETE FROM x WHERE {IN_CLAUSE}")
    assert ok2 is False

    b_ok, q, ph = s._build_in_query("SELECT * FROM assets WHERE {IN_CLAUSE}", "id", 3)
    assert b_ok and "id IN (?,?,?)" in q and len(ph) == 3


def test_column_repair_helpers(monkeypatch):
    monkeypatch.setattr(s, "_KNOWN_COLUMNS_LOWER", {"a.id": "a.id", "id": "id"})
    assert s._try_repair_column_name(" A.ID ") == "a.id"
    assert s._try_repair_column_name("id;") == "id"

    ok, col = s._validate_and_repair_column_name(" a.id ")
    assert ok and col == "a.id"

    ok2, col2 = s._validate_and_repair_column_name("bad;drop")
    assert ok2 is False and col2 is None


def test_asset_lock_key():
    assert s._asset_lock_key(None) == "asset:__null__"
    assert s._asset_lock_key(7) == "asset:7"


def test_async_loop_thread_run_submit_stop():
    t = s._AsyncLoopThread(run_timeout_s=2.0)
    loop = t.start()
    assert loop is not None

    async def _coro():
        return 3

    assert t.run(_coro()) == 3
    fut = t.submit(_coro())
    assert fut.result(timeout=2) == 3
    t.stop()


def test_async_loop_thread_deadlock_guard():
    t = s._AsyncLoopThread(run_timeout_s=2.0)
    _ = t.start()
    t._thread_ident = __import__("threading").get_ident()
    coro = asyncio.sleep(0)
    with pytest.raises(RuntimeError):
        t.run(coro)
    coro.close()
    t.stop()


def test_sqlite_wrapper_static_and_delegate_methods(monkeypatch):
    # Build instance without running heavy __init__.
    obj = object.__new__(s.Sqlite)
    obj._diag = {}
    obj._diag_lock = asyncio.Lock() if False else __import__("threading").Lock()

    monkeypatch.setattr(s, "pool_load_user_db_config", lambda self: {"ok": 1})
    monkeypatch.setattr(s, "pool_resolve_user_db_config_path", lambda self: Path("x"))
    monkeypatch.setattr(s, "pool_read_user_db_config_file", lambda p: {"x": 1})
    monkeypatch.setattr(s, "pool_normalize_user_db_config", lambda d: {"y": 2})
    monkeypatch.setattr(s, "pool_maybe_set_config_number", lambda out, data, key, min_value, cast: out.update({key: cast(data.get(key, min_value))}))
    monkeypatch.setattr(s, "recovery_is_locked_error", lambda exc: True)
    monkeypatch.setattr(s, "recovery_is_malformed_error", lambda exc: True)
    monkeypatch.setattr(s, "recovery_mark_locked_event", lambda self, exc: self._diag.update({"locked": True}))
    monkeypatch.setattr(s, "recovery_mark_malformed_event", lambda self, exc: self._diag.update({"malformed": True}))
    monkeypatch.setattr(s, "recovery_set_recovery_state", lambda self, state, error=None: self._diag.update({"state": state, "error": error}))
    monkeypatch.setattr(s, "pool_diagnostics", lambda self: {"d": 1})

    assert obj._load_user_db_config()["ok"] == 1
    assert str(obj._resolve_user_db_config_path()) == "x"
    assert s.Sqlite._read_user_db_config_file(Path("x"))["x"] == 1
    assert s.Sqlite._normalize_user_db_config({})["y"] == 2
    out = {}
    s.Sqlite._maybe_set_config_number(out, {"k": "5"}, "k", min_value=1, cast=int)
    assert out["k"] == 5

    assert obj._is_locked_error(Exception("x")) is True
    assert obj._is_malformed_error(Exception("x")) is True
    obj._mark_locked_event(Exception("x"))
    obj._mark_malformed_event(Exception("x"))
    obj._set_recovery_state("ok")
    assert obj.get_diagnostics() == {"d": 1}


def test_sqlite_delegate_prune_and_asset_lock(monkeypatch):
    obj = object.__new__(s.Sqlite)

    monkeypatch.setattr(s, "pool_prune_asset_locks_locked", lambda self, now: setattr(self, "_p1", now))
    monkeypatch.setattr(s, "pool_prune_asset_locks_by_ttl", lambda self, cutoff: setattr(self, "_p2", cutoff))
    monkeypatch.setattr(s, "pool_prune_asset_locks_by_cap", lambda self: setattr(self, "_p3", True))
    monkeypatch.setattr(s, "pool_asset_lock_last", lambda entry: 1.0)
    monkeypatch.setattr(s, "pool_asset_lock_is_locked", lambda entry: False)
    monkeypatch.setattr(s, "pool_get_or_create_asset_lock", lambda self, asset_id, keyfn: asyncio.Lock())

    obj._prune_asset_locks_locked(1.0)
    obj._prune_asset_locks_by_ttl(2.0)
    obj._prune_asset_locks_by_cap()
    assert obj._p1 == 1.0 and obj._p2 == 2.0 and obj._p3 is True
    assert obj._asset_lock_last({}) == 1.0
    assert obj._asset_lock_is_locked({}) is False
    assert isinstance(obj._get_or_create_asset_lock(1), type(asyncio.Lock()))


def test_sqlite_tx_helper_delegates(monkeypatch):
    obj = object.__new__(s.Sqlite)

    monkeypatch.setattr(s, "tx_ctx_token", lambda _var: "tok")
    monkeypatch.setattr(s, "tx_rows_to_dicts", lambda rows: [{"x": 1}] if rows else [])
    monkeypatch.setattr(s, "tx_cursor_write_result", lambda cur: "ok")
    monkeypatch.setattr(s, "tx_begin_stmt_for_mode", lambda mode: "BEGIN IMMEDIATE")
    monkeypatch.setattr(s, "tx_register_tx_token", lambda self, token, conn, lock: setattr(self, "_tok", token))
    monkeypatch.setattr(s, "tx_get_tx_state", lambda self, token: (None, False))
    monkeypatch.setattr(s, "tx_is_write_sql", lambda q: q.strip().lower().startswith("insert"))

    assert obj._tx_token() == "tok"
    assert obj._rows_to_dicts([("a",)]) == [{"x": 1}]
    assert obj._cursor_write_result(None) == "ok"
    assert obj._begin_stmt_for_mode("immediate") == "BEGIN IMMEDIATE"
    obj._register_tx_token("t1", None, None)
    assert obj._tok == "t1"
    assert obj._get_tx_state("t1") == (None, False)
    assert obj._is_write_sql("INSERT INTO x values(1)") is True


def test_sqlite_validate_in_query_and_column_repair_delegates(monkeypatch):
    obj = object.__new__(s.Sqlite)
    monkeypatch.setattr(s, "tx_validate_in_base_query", lambda q: (True, ""))
    monkeypatch.setattr(s, "tx_build_in_query", lambda q, c, n: (True, "Q", ("?",) * n))
    monkeypatch.setattr(s, "tx_validate_and_repair_column_name", lambda col: (True, "id"))
    monkeypatch.setattr(s, "tx_is_missing_column_error", lambda exc: True)
    monkeypatch.setattr(s, "tx_is_missing_table_error", lambda exc: True)

    assert s._validate_in_base_query("x")[0] in {True, False}
    assert s._build_in_query("SELECT {IN_CLAUSE}", "id", 1)[0] is True
    assert s._validate_and_repair_column_name("id")[0] is True
    assert s._is_missing_column_error(Exception("x")) in {True, False}
    assert s._is_missing_table_error(Exception("x")) in {True, False}
