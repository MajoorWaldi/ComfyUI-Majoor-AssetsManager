"""Extra tests for db_recovery.py — covering uncovered branches."""
import sqlite3
import threading
from pathlib import Path

import pytest

from mjr_am_backend.adapters.db import db_recovery as dr


def test_extract_schema_column_name_with_none() -> None:
    """Line 113 — not row → return ''."""
    assert dr.extract_schema_column_name(None) == ""


def test_extract_schema_column_name_with_short_tuple() -> None:
    """Line 113 — len(row) < 2 → return ''."""
    assert dr.extract_schema_column_name((0,)) == ""


def test_populate_table_columns_skips_empty_col_name(tmp_path: Path) -> None:
    """Line 128 — col is empty string → continue."""
    db = tmp_path / "test.db"
    with sqlite3.connect(str(db)) as conn:
        conn.execute("CREATE TABLE t (id INTEGER)")
        conn.commit()

    class _MockCursor:
        def execute(self, sql: str) -> None:
            pass

        def fetchall(self):
            # Return row with only 1 element so extract_schema_column_name returns ""
            return [(0,)]

    known: set[str] = set()
    dr.populate_table_columns(_MockCursor(), "t", "a", known)
    # No columns should be added since all rows returned empty col names
    assert "id" not in known


def test_populate_table_columns_cursor_execute_raises() -> None:
    """Lines 132-133 — cursor.execute raises → except passes silently."""

    class _BadCursor:
        def execute(self, sql: str) -> None:
            raise sqlite3.OperationalError("no such table: nonexistent")

        def fetchall(self):
            return []

    known: set[str] = set()
    # Should not raise
    dr.populate_table_columns(_BadCursor(), "nonexistent", None, known)
    assert len(known) == 0


def test_populate_known_columns_from_schema_nonexistent_db(tmp_path: Path) -> None:
    """Line 143 — db_path does not exist → early return with empty lowercase map."""
    db = tmp_path / "does_not_exist.db"
    known: set[str] = {"ExistingCol"}
    result = dr.populate_known_columns_from_schema(
        db_path=db,
        known_columns=known,
        known_columns_lock=threading.Lock(),
        schema_table_aliases={"assets": "a"},
    )
    assert result == {"existingcol": "ExistingCol"}


def test_populate_known_columns_from_schema_lock_raises(tmp_path: Path) -> None:
    """Lines 151-153 — lock context manager raises → except logs and returns map."""
    db = tmp_path / "x.db"
    import sqlite3 as _sqlite3

    with _sqlite3.connect(str(db)) as conn:
        conn.execute("CREATE TABLE t(id INTEGER)")
        conn.commit()

    class _BadLock:
        def __enter__(self):
            raise RuntimeError("lock failed")

        def __exit__(self, *args):
            pass

    known: set[str] = {"col1"}
    result = dr.populate_known_columns_from_schema(
        db_path=db,
        known_columns=known,
        known_columns_lock=_BadLock(),
        schema_table_aliases={"t": None},
    )
    # Should still return the map with existing known columns
    assert "col1" in result
