"""Tests for the versioned migration runner (Phase 3.2)."""

from __future__ import annotations

import pytest
from mjr_am_backend.adapters.db.migrations import (
    Migration,
    MigrationError,
    MigrationRunner,
)
from mjr_am_backend.adapters.db.migrations.base import (
    LEGACY_REPAIR_MAX_VERSION,
    MIGRATIONS_TABLE,
)
from mjr_am_backend.adapters.db.migrations.registry import MIGRATIONS
from mjr_am_shared.result import Result

pytestmark = pytest.mark.asyncio


# ── helpers ─────────────────────────────────────────────────────────── #


class _CountingMigration(Migration):
    """Stub migration that records how many times it was applied."""

    def __init__(self, version: int, name: str) -> None:
        self.version = version
        self.name = name
        self.applied = 0

    async def upgrade(self, db) -> Result[bool]:  # noqa: ANN001
        self.applied += 1
        # touch the DB so the call is realistic
        await db.aexecute(f"CREATE TABLE IF NOT EXISTS test_m{self.version} (x INT)")
        return Result.Ok(True)


class _FailingMigration(Migration):
    version = 99
    name = "always_fails"

    async def upgrade(self, db) -> Result[bool]:  # noqa: ANN001
        return Result.Err("BOOM", "intentional failure")


# ── version validation ─────────────────────────────────────────────── #


async def test_migration_rejects_legacy_version() -> None:
    with pytest.raises(MigrationError, match="legacy"):

        class _Bad(Migration):
            version = LEGACY_REPAIR_MAX_VERSION
            name = "too_low"

            async def upgrade(self, db) -> Result[bool]:  # noqa: ANN001
                return Result.Ok(True)


async def test_migration_requires_name() -> None:
    with pytest.raises(MigrationError, match="name"):

        class _NoName(Migration):
            version = 17
            name = ""

            async def upgrade(self, db) -> Result[bool]:  # noqa: ANN001
                return Result.Ok(True)


# ── runner behaviour ───────────────────────────────────────────────── #


async def test_runner_applies_pending_then_idempotent(services) -> None:
    db = services["db"]
    # Use versions well above the live registry so the bootstrap-applied
    # migrations (e.g. v17) don't shadow them.
    m_a = _CountingMigration(900, "stub_a")
    m_b = _CountingMigration(901, "stub_b")

    first = await MigrationRunner([m_a, m_b]).run(db)
    assert first.ok, first.error
    versions_first = sorted(r.version for r in (first.data or []))
    assert versions_first == [900, 901]
    assert m_a.applied == 1
    assert m_b.applied == 1

    second = await MigrationRunner([m_a, m_b]).run(db)
    assert second.ok, second.error
    # nothing pending => empty list returned
    assert second.data == []
    assert m_a.applied == 1
    assert m_b.applied == 1


async def test_runner_records_bookkeeping_rows(services) -> None:
    db = services["db"]
    m = _CountingMigration(910, "stub_record")

    result = await MigrationRunner([m]).run(db)
    assert result.ok, result.error

    rows_res = await db.aquery(
        f"SELECT version, name, duration_ms FROM {MIGRATIONS_TABLE} WHERE version = ?",
        (910,),
    )
    assert rows_res.ok, rows_res.error
    rows = rows_res.data or []
    assert len(rows) == 1
    assert rows[0]["name"] == "stub_record"
    assert int(rows[0]["duration_ms"]) >= 0


async def test_runner_propagates_failure(services) -> None:
    db = services["db"]
    result = await MigrationRunner([_FailingMigration()]).run(db)
    assert not result.ok
    assert "BOOM" in (result.error or "") or "MIGRATION_FAILED" == result.code


# ── real registry: m017 ────────────────────────────────────────────── #


async def test_registry_m017_creates_normalized_tables(services) -> None:
    db = services["db"]
    # Registry migrations are already applied by the bootstrap inside the
    # ``services`` fixture — re-running must be a no-op.
    result = await MigrationRunner(MIGRATIONS).run(db)
    assert result.ok, result.error
    assert result.data == []

    assert await db.ahas_table("tags") is True
    assert await db.ahas_table("asset_tags") is True
