"""Targeted metadata parser-version backfill."""

from __future__ import annotations

from typing import Any

from mjr_am_backend.features.metadata.section_catalog import PARSER_FAMILY_VERSION
from mjr_am_backend.shared import Result

_OUTDATED_WHERE = (
    "json_valid(COALESCE(metadata_raw, '')) "
    "AND COALESCE(json_extract(metadata_raw, '$.metadata_parser_version'), '') <> ?"
)


async def metadata_parser_backfill_status(db: Any) -> Result[dict[str, Any]]:
    res = await db.aquery(
        f"SELECT COUNT(*) AS count FROM asset_metadata WHERE {_OUTDATED_WHERE}",
        (PARSER_FAMILY_VERSION,),
    )
    if not res.ok:
        return Result.Err("METADATA_BACKFILL_STATUS_FAILED", res.error or "Failed to inspect metadata parser versions")
    rows = res.data or []
    count = int((rows[0] if rows else {}).get("count") or 0)
    return Result.Ok({"parser_family_version": PARSER_FAMILY_VERSION, "outdated": count})


async def run_metadata_parser_backfill(db: Any, *, limit: int = 1000) -> Result[dict[str, Any]]:
    batch_limit = max(1, min(10_000, int(limit or 1000)))
    res = await db.aexecute(
        f"""
        UPDATE asset_metadata
        SET metadata_raw = json_set(metadata_raw, '$.metadata_parser_version', ?)
        WHERE asset_id IN (
            SELECT asset_id
            FROM asset_metadata
            WHERE {_OUTDATED_WHERE}
            LIMIT ?
        )
        """,
        (PARSER_FAMILY_VERSION, PARSER_FAMILY_VERSION, batch_limit),
    )
    if not res.ok:
        return Result.Err("METADATA_BACKFILL_FAILED", res.error or "Failed to backfill metadata parser version")
    status = await metadata_parser_backfill_status(db)
    if not status.ok:
        return status
    return Result.Ok(
        {
            "parser_family_version": PARSER_FAMILY_VERSION,
            "updated": int(res.data or 0),
            "remaining": int((status.data or {}).get("outdated") or 0),
        }
    )
