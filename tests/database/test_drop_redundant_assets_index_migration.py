import sqlite3

import pytest
from mjr_am_backend.adapters.db.migrations.m022_drop_redundant_assets_index import MIGRATION
from mjr_am_backend.adapters.db.sqlite_facade import Sqlite

_LEGACY_SCHEMA = """
CREATE TABLE assets (
    id INTEGER PRIMARY KEY,
    filepath TEXT NOT NULL UNIQUE,
    source TEXT,
    root_id TEXT
);
CREATE UNIQUE INDEX idx_assets_filepath_source_root ON assets(filepath, source, root_id);
"""


def _index_names(db_path: str) -> set[str]:
    con = sqlite3.connect(db_path)
    try:
        return {
            row[0]
            for row in con.execute(
                "SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'"
            )
        }
    finally:
        con.close()


def _seed_legacy_db(db_path: str) -> None:
    con = sqlite3.connect(db_path)
    try:
        con.executescript(_LEGACY_SCHEMA)
        con.execute("INSERT INTO assets (filepath, source, root_id) VALUES ('/a.png', 'output', NULL)")
        con.commit()
    finally:
        con.close()


@pytest.mark.asyncio
async def test_drops_redundant_index_from_legacy_db(tmp_path):
    db_path = tmp_path / "legacy.sqlite"
    _seed_legacy_db(str(db_path))
    assert "idx_assets_filepath_source_root" in _index_names(str(db_path))

    db = Sqlite(str(db_path))
    try:
        result = await MIGRATION.upgrade(db)
        assert result.ok, result.error
    finally:
        await db.aclose()

    assert "idx_assets_filepath_source_root" not in _index_names(str(db_path))


@pytest.mark.asyncio
async def test_migration_is_idempotent_and_safe_on_fresh_db(tmp_path):
    # Fresh DB: no assets table at all -> no-op, must not error.
    fresh = Sqlite(str(tmp_path / "fresh.sqlite"))
    try:
        result = await MIGRATION.upgrade(fresh)
        assert result.ok, result.error
    finally:
        await fresh.aclose()

    # Legacy DB: re-running after a successful drop stays green.
    db_path = tmp_path / "legacy.sqlite"
    _seed_legacy_db(str(db_path))
    db = Sqlite(str(db_path))
    try:
        assert (await MIGRATION.upgrade(db)).ok
        assert (await MIGRATION.upgrade(db)).ok
    finally:
        await db.aclose()


@pytest.mark.asyncio
async def test_filepath_uniqueness_still_enforced_after_drop(tmp_path):
    """The dropped index was redundant precisely because assets.filepath is
    already UNIQUE - that guarantee must survive the migration."""
    db_path = tmp_path / "legacy.sqlite"
    _seed_legacy_db(str(db_path))

    db = Sqlite(str(db_path))
    try:
        assert (await MIGRATION.upgrade(db)).ok
    finally:
        await db.aclose()

    con = sqlite3.connect(str(db_path))
    try:
        # Same filepath, different source/root_id: rejected by the column-level
        # UNIQUE constraint, exactly as the composite index would have.
        with pytest.raises(sqlite3.IntegrityError):
            con.execute(
                "INSERT INTO assets (filepath, source, root_id) VALUES ('/a.png', 'input', 'r2')"
            )
    finally:
        con.close()
