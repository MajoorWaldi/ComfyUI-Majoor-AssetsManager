"""Migration v22 — drop the redundant ``idx_assets_filepath_source_root`` index.

``assets.filepath`` is declared ``TEXT NOT NULL UNIQUE`` at the column level,
which SQLite backs with an implicit unique autoindex. The additional
``UNIQUE INDEX idx_assets_filepath_source_root ON assets(filepath, source,
root_id)`` therefore carried no integrity or lookup value:

* **Integrity**: a tuple whose first component is already globally unique is
  trivially unique, so the composite index can never reject a row that the
  column constraint does not already reject.
* **Lookups**: any ``WHERE filepath = ?`` predicate is satisfied by the
  filepath autoindex, which already narrows to exactly one row - adding
  ``source`` / ``root_id`` cannot narrow it further.

What it *did* cost was a second unique B-tree write on every asset insert and
update, i.e. once per file on the scan hot path. Dropping it is a pure win at
the library sizes this indexer targets.

No ``ON CONFLICT(filepath, source, root_id)`` upsert exists anywhere in the
codebase, so no statement depends on this index as a conflict target.

The index is also removed from ``schema_sql.INDEXES_AND_TRIGGERS`` so the
legacy repair path stops recreating it on subsequent boots.

Note: this is a redundancy cleanup only. It deliberately does not take a
position on the open question of whether asset identity should migrate from an
absolute ``filepath`` to ``(root_id, relative_path)`` - the dropped index
serves neither model.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from ....shared import Result, get_logger
from .base import Migration

if TYPE_CHECKING:
    from ..sqlite_facade import Sqlite

logger = get_logger(__name__)

_INDEX_NAME = "idx_assets_filepath_source_root"


class DropRedundantAssetsIndexMigration(Migration):
    """v22 — drop the redundant unique index on ``assets``."""

    version = 22
    name = "drop_redundant_assets_index"

    async def upgrade(self, db: Sqlite) -> Result[bool]:
        exists = await db.aquery(
            "SELECT 1 FROM sqlite_master WHERE type='index' AND name=?",
            (_INDEX_NAME,),
        )
        if not exists.ok:
            return Result.Err(
                "MIGRATION_QUERY_FAILED",
                f"v22 lookup failed: {exists.error}",
            )
        if not exists.data:
            # Fresh database, or the migration already ran. Idempotent no-op.
            return Result.Ok(True)

        res = await db.aexecute(f"DROP INDEX IF EXISTS {_INDEX_NAME}")
        if not res.ok:
            return Result.Err(
                "MIGRATION_FAILED",
                f"v22 failed to drop {_INDEX_NAME}: {res.error}",
            )
        logger.info(
            "v22: dropped redundant unique index %s (assets.filepath is already UNIQUE)",
            _INDEX_NAME,
        )
        return Result.Ok(True)


MIGRATION = DropRedundantAssetsIndexMigration()
