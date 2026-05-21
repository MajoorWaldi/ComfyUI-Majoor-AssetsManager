"""Versioned schema-migration framework for the Majoor Assets Manager DB.

This package introduces a *complementary* migration system that lives **on top
of** the existing implicit ``schema._ensure_schema()`` repair routine. Where
``_ensure_schema`` keeps the legacy v16 schema healed and reactive, this
runner applies **immutable, append-only, additive** migrations starting at
schema version 17 (the first version this runner manages).

Design constraints (Phase 3.2):

* **Additive only**: a migration may *create* new tables/indexes/views,
  *backfill* data, and *add* nullable columns. It must NOT drop or alter
  existing v16 columns/tables. The legacy repair path is the source of truth
  for any v16 object.
* **Idempotent**: each migration's ``upgrade`` must safely re-run on a database
  where it has already been applied (we use ``IF NOT EXISTS`` everywhere).
  Tracking is done in a dedicated ``schema_migrations`` table so the runner
  also short-circuits already-applied versions.
* **No downgrade**: migrations are forward-only. A ``downgrade`` hook is
  intentionally omitted from the base class.
* **Pure**: a migration receives only the async DB facade; no global state,
  no env vars, no logging side effects beyond the runner's own logger.

Naming: migrations are Python modules ``mXXX_short_name.py`` exporting a
``MIGRATION`` instance of :class:`Migration`. The runner discovers them by
import order from :data:`MIGRATIONS`.
"""

from __future__ import annotations

from .base import Migration, MigrationError, MigrationRunner
from .registry import MIGRATIONS

__all__ = ["MIGRATIONS", "Migration", "MigrationError", "MigrationRunner"]
