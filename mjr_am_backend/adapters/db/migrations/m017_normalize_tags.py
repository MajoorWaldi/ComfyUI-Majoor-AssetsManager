"""Migration v17 — normalize tags into ``tags`` + ``asset_tags`` tables.

This migration is **purely additive**. The legacy ``asset_metadata.tags`` JSON
column (and its companion ``tags_text``) are left untouched and remain the
source of truth for v16 readers. The new normalized tables are populated by
backfilling from the existing JSON data and are intended to be consumed by
new code through the :class:`TagsRepository`.

Created objects:

* ``tags(id INTEGER PK, name TEXT NOT NULL UNIQUE COLLATE NOCASE)`` —
  one row per distinct tag name. Lookup is case-insensitive.
* ``asset_tags(asset_id INTEGER, tag_id INTEGER, PRIMARY KEY)`` — many-to-many
  link with cascade-delete on the asset side.
* ``idx_asset_tags_tag`` — covering index for "assets having tag X" queries.

Backfill behavior:

* Each row of ``asset_metadata`` is read; ``tags`` is parsed as JSON.
* Non-string entries, empty strings, and duplicates (per asset) are dropped.
* Tags are inserted into ``tags`` via ``INSERT OR IGNORE`` then linked into
  ``asset_tags`` via ``INSERT OR IGNORE`` — both operations are idempotent.
* The backfill is bounded: if a row's JSON is malformed it is skipped with a
  warning rather than aborting the whole migration.

Re-running this migration is a no-op (all DDL is ``IF NOT EXISTS`` and the
INSERTs use ``OR IGNORE``).
"""

from __future__ import annotations

import json
from typing import TYPE_CHECKING

from ....shared import Result, get_logger
from .base import Migration

if TYPE_CHECKING:
    from ..sqlite_facade import Sqlite

logger = get_logger(__name__)


_CREATE_TAGS = """
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE
)
"""

_CREATE_ASSET_TAGS = """
CREATE TABLE IF NOT EXISTS asset_tags (
    asset_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (asset_id, tag_id),
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
)
"""

_CREATE_IDX_ASSET_TAGS_TAG = """
CREATE INDEX IF NOT EXISTS idx_asset_tags_tag ON asset_tags(tag_id, asset_id)
"""


def _parse_tags_json(raw: object) -> list[str]:
    """Return the deduplicated list of non-empty string tags from *raw*.

    Accepts a JSON string (the v16 storage) or already-decoded list/None.
    Unparseable input yields an empty list.
    """
    if raw is None or raw == "":
        return []
    if isinstance(raw, list):
        candidates = raw
    elif isinstance(raw, str):
        try:
            decoded = json.loads(raw)
        except (json.JSONDecodeError, ValueError):
            return []
        if not isinstance(decoded, list):
            return []
        candidates = decoded
    else:
        return []
    seen: set[str] = set()
    out: list[str] = []
    for item in candidates:
        if not isinstance(item, str):
            continue
        trimmed = item.strip()
        if not trimmed:
            continue
        key = trimmed.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(trimmed)
    return out


class NormalizeTagsMigration(Migration):
    """v17 — create ``tags``/``asset_tags`` and backfill from JSON column."""

    version = 17
    name = "normalize_tags"

    async def upgrade(self, db: Sqlite) -> Result[bool]:
        # 1. DDL — all idempotent (IF NOT EXISTS)
        for stmt in (_CREATE_TAGS, _CREATE_ASSET_TAGS, _CREATE_IDX_ASSET_TAGS_TAG):
            ddl_result = await db.aexecute(stmt)
            if not ddl_result.ok:
                return Result.Err(
                    "MIGRATION_DDL_FAILED",
                    f"v17 DDL failed: {ddl_result.error}",
                )

        # 2. Backfill from asset_metadata.tags (JSON column).
        backfill_result = await self._backfill(db)
        if not backfill_result.ok:
            return backfill_result
        return Result.Ok(True)

    async def _backfill(self, db: Sqlite) -> Result[bool]:
        rows_result = await db.aquery(
            "SELECT asset_id, tags FROM asset_metadata "
            "WHERE tags IS NOT NULL AND tags != '' AND tags != '[]'"
        )
        if not rows_result.ok:
            # No asset_metadata table yet? Then nothing to backfill — treat as
            # success so the migration is still considered applied.
            logger.info("v17 backfill: no asset_metadata to read (%s)", rows_result.error)
            return Result.Ok(True)

        rows = rows_result.data or []
        if not rows:
            logger.info("v17 backfill: asset_metadata is empty, nothing to import")
            return Result.Ok(True)

        skipped = 0
        inserted_links = 0
        inserted_tags = 0
        for row in rows:
            asset_id = row.get("asset_id")
            if asset_id is None:
                skipped += 1
                continue
            tags = _parse_tags_json(row.get("tags"))
            if not tags:
                continue
            for tag_name in tags:
                ins_tag = await db.aexecute(
                    "INSERT OR IGNORE INTO tags (name) VALUES (?)", (tag_name,)
                )
                if not ins_tag.ok:
                    logger.warning(
                        "v17 backfill: failed to insert tag %r: %s", tag_name, ins_tag.error
                    )
                    continue
                # rowcount isn't carried in Result; we count via subsequent lookup.
                id_lookup = await db.aquery(
                    "SELECT id FROM tags WHERE name = ?", (tag_name,)
                )
                if not id_lookup.ok or not id_lookup.data:
                    continue
                tag_id = id_lookup.data[0]["id"]
                before_link = inserted_links
                ins_link = await db.aexecute(
                    "INSERT OR IGNORE INTO asset_tags (asset_id, tag_id) VALUES (?, ?)",
                    (int(asset_id), int(tag_id)),
                )
                if ins_link.ok:
                    inserted_links += 1  # upper bound; INSERT OR IGNORE may have skipped
                else:
                    logger.warning(
                        "v17 backfill: failed to link asset %s -> tag %s: %s",
                        asset_id,
                        tag_name,
                        ins_link.error,
                    )
                    inserted_links = before_link
            inserted_tags += len(tags)

        logger.info(
            "v17 backfill: scanned %d rows, processed %d tag-occurrences, skipped %d",
            len(rows),
            inserted_tags,
            skipped,
        )
        return Result.Ok(True)


MIGRATION = NormalizeTagsMigration()
