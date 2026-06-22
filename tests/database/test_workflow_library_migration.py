import pytest
from mjr_am_backend.adapters.db.migrations.m020_workflow_library_tables import MIGRATION
from mjr_am_backend.adapters.db.sqlite_facade import Sqlite


@pytest.mark.asyncio
async def test_workflow_library_migration_creates_tables(tmp_path):
    db_path = tmp_path / "workflow-library.sqlite"
    db = Sqlite(str(db_path))
    try:
        result = await MIGRATION.upgrade(db)

        assert result.ok, result.error
        assert await db.ahas_table("workflows") is True
        assert await db.ahas_table("workflow_categories") is True
    finally:
        await db.aclose()
