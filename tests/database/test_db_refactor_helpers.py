from mjr_am_backend.adapters.db.db_recovery import is_locked_error
from mjr_am_backend.adapters.db.transaction_manager import is_write_sql


def test_is_locked_error_detects_common_sqlite_lock_messages() -> None:
    assert is_locked_error(Exception("database is locked"))
    assert is_locked_error(Exception("database table is locked"))
    assert is_locked_error(Exception("database schema is locked"))
    assert is_locked_error(Exception("SQLITE_BUSY: busy"))


def test_is_locked_error_false_for_unrelated_errors() -> None:
    assert not is_locked_error(Exception("no such table: assets"))
    assert not is_locked_error(Exception("syntax error near SELECT"))


def test_is_write_sql_read_queries() -> None:
    assert not is_write_sql("SELECT * FROM assets")
    assert not is_write_sql("  PRAGMA journal_mode")
    assert not is_write_sql("WITH q AS (SELECT 1) SELECT * FROM q")
    assert not is_write_sql("EXPLAIN SELECT * FROM assets")


def test_is_write_sql_mutation_queries() -> None:
    assert is_write_sql("INSERT INTO assets(filename) VALUES('x')")
    assert is_write_sql("UPDATE assets SET mtime = 1")
    assert is_write_sql("DELETE FROM assets WHERE id = 1")
    assert is_write_sql("BEGIN IMMEDIATE")
