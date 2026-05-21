"""Base classes for versioned schema migrations.

See :mod:`mjr_am_backend.adapters.db.migrations` for the design contract.
"""

from __future__ import annotations

import time
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import TYPE_CHECKING

from ....shared import Result, get_logger

if TYPE_CHECKING:
    from ..sqlite_facade import Sqlite

logger = get_logger(__name__)


# Versions strictly less than this are owned by the legacy implicit-repair
# path in ``schema._ensure_schema()``. The runner refuses to apply any
# migration whose ``version`` is below this threshold.
LEGACY_REPAIR_MAX_VERSION = 16

# Name of the bookkeeping table tracking applied migrations.
MIGRATIONS_TABLE = "schema_migrations"


class MigrationError(Exception):
    """Raised when a migration cannot be applied or recorded."""


class Migration(ABC):
    """A single immutable, additive, idempotent schema upgrade step.

    Subclasses must declare ``version`` (int > 16), ``name`` (short slug),
    and implement :meth:`upgrade`.
    """

    #: Strictly increasing positive integer identifying this migration.
    version: int = 0

    #: Short human-readable slug, e.g. ``"normalize_tags"``.
    name: str = ""

    @abstractmethod
    async def upgrade(self, db: Sqlite) -> Result[bool]:
        """Apply the migration. Must be idempotent (safe to re-run)."""
        raise NotImplementedError

    def __init_subclass__(cls, **kwargs: object) -> None:
        super().__init_subclass__(**kwargs)
        if cls.version and cls.version <= LEGACY_REPAIR_MAX_VERSION:
            raise MigrationError(
                f"Migration {cls.__name__}: version {cls.version} overlaps the "
                f"legacy implicit-repair range (<= {LEGACY_REPAIR_MAX_VERSION})"
            )
        if cls.version and not cls.name:
            raise MigrationError(f"Migration {cls.__name__}: missing 'name' attribute")


@dataclass(frozen=True)
class MigrationRecord:
    """In-DB record of an applied migration."""

    version: int
    name: str
    applied_at: float  # unix epoch seconds
    duration_ms: int


# --------------------------------------------------------------------------- #
# Runner
# --------------------------------------------------------------------------- #


class MigrationRunner:
    """Discover, order, and apply pending migrations against a DB facade.

    Usage:
        runner = MigrationRunner(MIGRATIONS)
        result = await runner.run(db)

    The runner is **safe to call on every startup**: already-applied
    migrations are short-circuited via the ``schema_migrations`` table.
    """

    def __init__(self, migrations: list[Migration]) -> None:
        self._migrations = self._validate(migrations)

    # -- public API -------------------------------------------------------- #

    async def run(self, db: Sqlite) -> Result[list[MigrationRecord]]:
        """Apply all pending migrations in version order.

        Returns the list of records actually inserted this call (empty if
        nothing was pending).
        """
        ensure = await self._ensure_tracking_table(db)
        if not ensure.ok:
            return Result.Err(ensure.code, ensure.error or "")

        applied_result = await self._fetch_applied_versions(db)
        if not applied_result.ok:
            return Result.Err(applied_result.code, applied_result.error or "")
        applied = set(applied_result.data or [])

        records: list[MigrationRecord] = []
        for migration in self._migrations:
            if migration.version in applied:
                continue
            record_result = await self._apply_one(db, migration)
            if not record_result.ok:
                return Result.Err(record_result.code, record_result.error or "")
            if record_result.data is None:
                return Result.Err(
                    "MIGRATION_RECORD_FAILED",
                    f"Migration v{migration.version} returned no record",
                )
            records.append(record_result.data)
        return Result.Ok(records)

    async def applied_versions(self, db: Sqlite) -> Result[list[int]]:
        """Return the sorted list of migration versions applied to *db*."""
        return await self._fetch_applied_versions(db)

    # -- internals --------------------------------------------------------- #

    @staticmethod
    def _validate(migrations: list[Migration]) -> list[Migration]:
        seen: set[int] = set()
        ordered: list[Migration] = []
        for m in sorted(migrations, key=lambda x: x.version):
            if m.version in seen:
                raise MigrationError(f"Duplicate migration version: {m.version}")
            if m.version <= LEGACY_REPAIR_MAX_VERSION:
                raise MigrationError(
                    f"Migration {m.name!r}: version {m.version} <= "
                    f"{LEGACY_REPAIR_MAX_VERSION} (legacy range)"
                )
            seen.add(m.version)
            ordered.append(m)
        return ordered

    @staticmethod
    async def _ensure_tracking_table(db: Sqlite) -> Result[bool]:
        sql = f"""
            CREATE TABLE IF NOT EXISTS {MIGRATIONS_TABLE} (
                version INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                applied_at REAL NOT NULL,
                duration_ms INTEGER NOT NULL DEFAULT 0
            )
        """
        return await db.aexecute(sql)

    @staticmethod
    async def _fetch_applied_versions(db: Sqlite) -> Result[list[int]]:
        result = await db.aquery(f"SELECT version FROM {MIGRATIONS_TABLE} ORDER BY version")
        if not result.ok:
            return Result.Err(result.code, result.error or "")
        return Result.Ok([int(row["version"]) for row in (result.data or [])])

    @staticmethod
    async def _apply_one(db: Sqlite, migration: Migration) -> Result[MigrationRecord]:
        logger.info("Applying migration v%s (%s)", migration.version, migration.name)
        started = time.perf_counter()
        try:
            upgrade_result = await migration.upgrade(db)
        except Exception as exc:  # noqa: BLE001 — surfaced as Result
            logger.exception("Migration v%s (%s) raised", migration.version, migration.name)
            return Result.Err(
                "MIGRATION_FAILED",
                f"Migration v{migration.version} ({migration.name}) crashed: {exc}",
            )
        if not upgrade_result.ok:
            return Result.Err(
                "MIGRATION_FAILED",
                f"Migration v{migration.version} ({migration.name}) failed: "
                f"{upgrade_result.error}",
            )

        duration_ms = int((time.perf_counter() - started) * 1000)
        applied_at = time.time()
        record_result = await db.aexecute(
            f"INSERT INTO {MIGRATIONS_TABLE} (version, name, applied_at, duration_ms) "
            f"VALUES (?, ?, ?, ?)",
            (migration.version, migration.name, applied_at, duration_ms),
        )
        if not record_result.ok:
            return Result.Err(
                "MIGRATION_RECORD_FAILED",
                f"Migration v{migration.version} applied but record insert failed: "
                f"{record_result.error}",
            )
        logger.info(
            "Migration v%s (%s) applied in %d ms", migration.version, migration.name, duration_ms
        )
        return Result.Ok(
            MigrationRecord(
                version=migration.version,
                name=migration.name,
                applied_at=applied_at,
                duration_ms=duration_ms,
            )
        )
