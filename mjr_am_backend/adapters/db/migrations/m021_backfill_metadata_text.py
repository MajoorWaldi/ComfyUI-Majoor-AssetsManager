"""Migration v21 — backfill ``asset_metadata.metadata_text`` for search.

Regression fix (GitHub issue #175 "Search not working"): since the Phase C
tag normalization (v18/v19), the FTS ``metadata_text`` column is sourced
exclusively from ``asset_metadata.metadata_text`` — but the indexer never
wrote that column, so prompts, models, LoRAs and Majoor GenInfo overrides
were absent from the full-text index and unmatchable from the search bar.

The indexer now persists ``metadata_text`` on every metadata write (see
``features/index/metadata_helpers.write_asset_metadata_row``). This
migration backfills already-indexed rows from ``metadata_raw`` using pure
SQL ``json_extract`` so newly upgraded databases become searchable without
requiring an index reset.

The backfill is a best-effort projection of the most valuable searchable
fields (positive/negative prompt including overrides, A1111 parameters,
model/checkpoint names, LoRA names, custom info blocks, workflow type).
Rows written after the fix are richer; the UPDATE only touches rows whose
``metadata_text`` is still empty, so it is idempotent and re-runnable.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from ....shared import Result, get_logger
from .base import Migration

if TYPE_CHECKING:
    from ..sqlite_facade import Sqlite

logger = get_logger(__name__)

# Per-field cap keeps pathological rows bounded (metadata_raw can reach MBs).
_FIELD_CAP = 4000
_TOTAL_CAP = 12000


def _extract(path: str) -> str:
    return (
        f"SUBSTR(COALESCE(CAST(json_extract(metadata_raw, '{path}') AS TEXT), ''), 1, {_FIELD_CAP})"
    )


def _custom_info_expr() -> str:
    # Space-joined "title content" pairs from geninfo.custom_info blocks.
    return (
        "COALESCE(("
        "SELECT SUBSTR(group_concat("
        "COALESCE(json_extract(ci.value, '$.title'), '') || ' ' || "
        f"COALESCE(json_extract(ci.value, '$.content'), ''), ' '), 1, {_FIELD_CAP}) "
        "FROM json_each(metadata_raw, '$.geninfo.custom_info') AS ci "
        "WHERE json_type(metadata_raw, '$.geninfo.custom_info') = 'array'"
        "), '')"
    )


def _lora_names_expr() -> str:
    return (
        "COALESCE(("
        "SELECT SUBSTR(group_concat(COALESCE(json_extract(lo.value, '$.name'), ''), ' '), 1, 1024) "
        "FROM json_each(metadata_raw, '$.geninfo.loras') AS lo "
        "WHERE json_type(metadata_raw, '$.geninfo.loras') = 'array'"
        "), '')"
    )


def _metadata_text_projection() -> str:
    pieces = [
        _extract("$.geninfo.positive.value"),
        _extract("$.geninfo.negative.value"),
        _extract("$.positive_prompt"),
        _extract("$.negative_prompt"),
        _extract("$.parameters"),
        _extract("$.geninfo.checkpoint.name"),
        _extract("$.geninfo.sampler.name"),
        _extract("$.geninfo.vae.name"),
        _extract("$.geninfo.notes.value"),
        _extract("$.model"),
        _extract("$.workflow_type"),
        _lora_names_expr(),
        _custom_info_expr(),
    ]
    joined = " || ' ' || ".join(pieces)
    return f"SUBSTR(TRIM({joined}), 1, {_TOTAL_CAP})"


def _backfill_sql() -> str:
    projection = _metadata_text_projection()
    return f"""
    UPDATE asset_metadata
    SET metadata_text = {projection}
    WHERE COALESCE(metadata_text, '') = ''
      AND json_valid(COALESCE(metadata_raw, ''))
      AND TRIM(COALESCE(metadata_raw, '')) NOT IN ('', '{{}}', 'null')
    """


class BackfillMetadataTextMigration(Migration):
    """v21 — backfill ``asset_metadata.metadata_text`` from ``metadata_raw``."""

    version = 21
    name = "backfill_metadata_text"

    async def upgrade(self, db: Sqlite) -> Result[bool]:
        has_table = await db.aquery(
            "SELECT 1 FROM sqlite_master WHERE type='table' AND name='asset_metadata'"
        )
        if not has_table.ok:
            return Result.Err(
                "MIGRATION_QUERY_FAILED",
                f"v21 lookup failed: {has_table.error}",
            )
        if not has_table.data:
            logger.info("v21: asset_metadata missing (fresh DB) — nothing to backfill")
            return Result.Ok(True)

        res = await db.aexecute(_backfill_sql())
        if not res.ok:
            return Result.Err(
                "MIGRATION_FAILED",
                f"v21 metadata_text backfill failed: {res.error}",
            )
        logger.info("v21: backfilled asset_metadata.metadata_text for FTS search")
        return Result.Ok(True)


MIGRATION = BackfillMetadataTextMigration()
