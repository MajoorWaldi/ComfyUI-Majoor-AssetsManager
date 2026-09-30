"""Migration v19 - drop legacy tag columns from ``asset_metadata``.

The normalized ``tags`` / ``asset_tags`` tables are now the source of truth.
This migration removes ``asset_metadata.tags`` and
``asset_metadata.tags_text`` using SQLite's portable create-copy-swap
procedure.
"""

from __future__ import annotations

import json
from typing import TYPE_CHECKING

from ....shared import Result, get_logger
from .base import Migration
from .m018_fts_from_normalized_tags import (
    _DROP_LEGACY_TRIGGERS,
    _create_triggers_sql,
    _reindex_sql,
)

if TYPE_CHECKING:
    from ..sqlite_facade import Sqlite

logger = get_logger(__name__)


class _MigrationStepFailed(Exception):
    """Raised inside the v19 transaction to force a rollback on a failed DDL step."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


_CREATE_ASSET_METADATA_V19 = """
CREATE TABLE asset_metadata__v19 (
    asset_id INTEGER PRIMARY KEY,
    rating INTEGER DEFAULT 0,
    metadata_text TEXT DEFAULT '',
    workflow_hash TEXT,
    has_workflow BOOLEAN DEFAULT 0,
    has_generation_data BOOLEAN DEFAULT 0,
    metadata_quality TEXT DEFAULT 'none',
    workflow_type TEXT DEFAULT '',
    generation_time_ms INTEGER,
    positive_prompt TEXT DEFAULT '',
    metadata_raw TEXT DEFAULT '{}',
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);
"""

_COPY_ASSET_METADATA_V19 = """
INSERT INTO asset_metadata__v19 (
    asset_id,
    rating,
    metadata_text,
    workflow_hash,
    has_workflow,
    has_generation_data,
    metadata_quality,
    workflow_type,
    generation_time_ms,
    positive_prompt,
    metadata_raw
)
SELECT
    asset_id,
    rating,
    metadata_text,
    workflow_hash,
    has_workflow,
    has_generation_data,
    metadata_quality,
    workflow_type,
    generation_time_ms,
    positive_prompt,
    metadata_raw
FROM asset_metadata;
"""

_RECREATE_ASSET_METADATA_INDEXES = """
CREATE INDEX IF NOT EXISTS idx_metadata_rating ON asset_metadata(rating);
CREATE INDEX IF NOT EXISTS idx_metadata_workflow_hash ON asset_metadata(workflow_hash);
CREATE INDEX IF NOT EXISTS idx_metadata_quality_workflow ON asset_metadata(metadata_quality, has_workflow);
CREATE INDEX IF NOT EXISTS idx_metadata_workflow_type ON asset_metadata(workflow_type);
CREATE INDEX IF NOT EXISTS idx_asset_metadata_has_workflow_true ON asset_metadata(has_workflow) WHERE has_workflow = 1;
CREATE INDEX IF NOT EXISTS idx_asset_metadata_has_generation_data_true ON asset_metadata(has_generation_data) WHERE has_generation_data = 1;
"""


class DropLegacyTagColumnsMigration(Migration):
    """v19 - remove ``asset_metadata.tags`` and ``tags_text``."""

    version = 19
    name = "drop_legacy_tag_columns"

    async def upgrade(self, db: Sqlite) -> Result[bool]:
        columns_res = await db.aquery("PRAGMA table_info(asset_metadata)")
        if not columns_res.ok:
            return Result.Err(
                "MIGRATION_QUERY_FAILED",
                f"v19 column lookup failed: {columns_res.error}",
            )
        columns = {str(row.get("name")) for row in (columns_res.data or [])}
        if "tags" not in columns and "tags_text" not in columns:
            logger.info("v19: legacy tag columns already absent")
            return Result.Ok(True)

        invariant = await self._check_invariant(db)
        if not invariant.ok:
            return invariant

        try:
            async with db.atransaction(mode="immediate") as tx:
                if not tx.ok:
                    return Result.Err("DB_ERROR", tx.error or "Failed to begin transaction")

                drop_triggers = await db.aexecutescript(_DROP_LEGACY_TRIGGERS)
                if not drop_triggers.ok:
                    raise _MigrationStepFailed(
                        "MIGRATION_DDL_FAILED",
                        f"v19 drop FTS triggers failed: {drop_triggers.error}",
                    )

                rebuild = await db.aexecutescript(
                    f"""
                    DROP TABLE IF EXISTS asset_metadata__v19;
                    {_CREATE_ASSET_METADATA_V19}
                    {_COPY_ASSET_METADATA_V19}
                    DROP TABLE asset_metadata;
                    ALTER TABLE asset_metadata__v19 RENAME TO asset_metadata;
                    {_RECREATE_ASSET_METADATA_INDEXES}
                    """
                )
                if not rebuild.ok:
                    raise _MigrationStepFailed(
                        "MIGRATION_DDL_FAILED",
                        f"v19 asset_metadata rebuild failed: {rebuild.error}",
                    )

                create_triggers = await db.aexecutescript(_create_triggers_sql())
                if not create_triggers.ok:
                    raise _MigrationStepFailed(
                        "MIGRATION_DDL_FAILED",
                        f"v19 recreate FTS triggers failed: {create_triggers.error}",
                    )

                reindex = await db.aexecutescript(_reindex_sql())
                if not reindex.ok:
                    raise _MigrationStepFailed(
                        "MIGRATION_REINDEX_FAILED",
                        f"v19 FTS reindex failed: {reindex.error}",
                    )
            if not tx.ok:
                return Result.Err("MIGRATION_DDL_FAILED", tx.error or "v19 commit failed")
        except _MigrationStepFailed as exc:
            return Result.Err(exc.code, exc.message)

        logger.info("v19: legacy asset_metadata tag columns dropped")
        return Result.Ok(True)

    async def _check_invariant(self, db: Sqlite) -> Result[bool]:
        rows_res = await db.aquery(
            "SELECT asset_id, tags FROM asset_metadata "
            "WHERE COALESCE(tags, '') NOT IN ('', '[]')"
        )
        if not rows_res.ok:
            return Result.Err(
                "MIGRATION_QUERY_FAILED",
                f"v19 legacy tag invariant lookup failed: {rows_res.error}",
            )

        for row in rows_res.data or []:
            asset_id = int(row.get("asset_id") or 0)
            if asset_id <= 0:
                continue
            if not self._legacy_tags_nonempty(row.get("tags")):
                continue
            links = await db.aquery(
                "SELECT COUNT(*) AS n FROM asset_tags WHERE asset_id = ?",
                (asset_id,),
            )
            if not links.ok:
                return Result.Err(
                    "MIGRATION_QUERY_FAILED",
                    f"v19 normalized tag invariant lookup failed: {links.error}",
                )
            count = int((links.data or [{"n": 0}])[0].get("n") or 0)
            if count <= 0:
                return Result.Err(
                    "MIGRATION_INVARIANT_FAILED",
                    f"asset {asset_id} has legacy JSON tags but no normalized asset_tags rows",
                )
        return Result.Ok(True)

    @staticmethod
    def _legacy_tags_nonempty(raw: object) -> bool:
        if not isinstance(raw, str) or not raw.strip():
            return False
        try:
            parsed = json.loads(raw)
        except Exception:
            return True
        return isinstance(parsed, list) and any(isinstance(t, str) and t.strip() for t in parsed)


MIGRATION = DropLegacyTagColumnsMigration()
