import json
import threading
from pathlib import Path
from types import SimpleNamespace

from mjr_am_backend.adapters.db import connection_pool as cp
from mjr_am_backend.adapters.db import db_recovery as dr
from mjr_am_backend.shared import Result


def _sqlite_obj(tmp_path: Path):
    return SimpleNamespace(
        db_path=tmp_path / "db.sqlite3",
        _asset_locks={},
        _asset_locks_lock=threading.Lock(),
        _asset_locks_ttl_s=1.0,
        _asset_locks_max=2,
        _asset_locks_stop=threading.Event(),
        _asset_locks_pruner=None,
        _diag_lock=threading.Lock(),
        _diag={},
        _active_conns=set(),
        _pool=SimpleNamespace(qsize=lambda: 3),
        _max_conn_limit=8,
        _query_timeout=2.5,
        _auto_reset_lock=threading.Lock(),
        _auto_reset_last_ts=0.0,
        _auto_reset_cooldown_s=5.0,
    )


def test_connection_pool_config_helpers(monkeypatch, tmp_path: Path):
    s = _sqlite_obj(tmp_path)
    cfg = tmp_path / "db_config.json"
    cfg.write_text(json.dumps({"timeout": 0.1, "maxConnections": "4", "queryTimeout": 2}), encoding="utf-8")
    monkeypatch.setenv("MAJOOR_DB_CONFIG_PATH", str(cfg))
    loaded = cp.load_user_db_config(s)
    assert loaded["timeout"] >= 1.0 and loaded["maxConnections"] == 4

    assert cp.resolve_user_db_config_path(s) == cfg
    assert cp.read_user_db_config_file(tmp_path / "missing.json") == {}
    out = {}
    cp.maybe_set_config_number(out, {"k": "2"}, "k", min_value=1, cast=int)
    assert out["k"] == 2


def test_connection_pool_lock_pruning_and_runtime(tmp_path: Path):
    s = _sqlite_obj(tmp_path)
    s._asset_locks = {
        "a": {"lock": threading.Lock(), "last": 1.0},
        "b": {"lock": threading.Lock(), "last": 5.0},
        "c": {"lock": threading.Lock(), "last": 9.0},
    }
    cp.prune_asset_locks_by_ttl(s, cutoff=6.0)
    assert "a" not in s._asset_locks
    cp.prune_asset_locks_by_cap(s)
    assert len(s._asset_locks) <= 2

    status = cp.runtime_status(s, busy_timeout_ms=5000)
    assert status["pooled_connections"] == 3 and status["busy_timeout_ms"] == 5000
    diag = cp.diagnostics(s)
    assert isinstance(diag, dict)


def test_connection_pool_asset_lock_get_or_create_and_pruner_stop(tmp_path: Path):
    s = _sqlite_obj(tmp_path)
    lock1 = cp.get_or_create_asset_lock(s, 12, key_builder=lambda v: f"k:{v}")
    lock2 = cp.get_or_create_asset_lock(s, 12, key_builder=lambda v: f"k:{v}")
    assert lock1 is lock2
    cp.stop_asset_lock_pruner(s)
    assert s._asset_locks_pruner is None


def test_db_recovery_flags_and_markers(monkeypatch, tmp_path: Path):
    s = _sqlite_obj(tmp_path)
    assert dr.is_locked_error(Exception("database is locked"))
    assert dr.is_malformed_error(Exception("file is not a database"))

    dr.mark_locked_event(s, Exception("x"))
    dr.mark_malformed_event(s, Exception("y"))
    dr.set_recovery_state(s, "in_progress")
    dr.set_recovery_state(s, "success")
    dr.set_recovery_state(s, "failed", error="e")
    assert s._diag["locked"] is True and s._diag["malformed"] is True

    monkeypatch.setenv("MAJOOR_DB_AUTO_RESET", "true")
    assert dr.is_auto_reset_enabled() is True
    assert dr.is_auto_reset_throttled(s, now=1.0) is True
    s._auto_reset_last_ts = 0.0
    assert dr.is_auto_reset_throttled(s, now=10.0) is False
    dr.mark_auto_reset_attempt(s, now=11.0)
    dr.record_auto_reset_result(s, Result.Ok(True))
    dr.record_auto_reset_result(s, Result.Err("E", "boom"))
    assert s._diag.get("auto_reset_attempts", 0) >= 1


def test_db_recovery_schema_population(tmp_path: Path):
    db = tmp_path / "x.db"
    import sqlite3

    with sqlite3.connect(str(db)) as conn:
        cur = conn.cursor()
        cur.execute("CREATE TABLE assets(id INTEGER, filepath TEXT)")
        conn.commit()

    known = set()
    out = dr.populate_known_columns_from_schema(
        db_path=db,
        known_columns=known,
        known_columns_lock=threading.Lock(),
        schema_table_aliases={"assets": "a"},
    )
    assert "id" in out and "a.id" in out
