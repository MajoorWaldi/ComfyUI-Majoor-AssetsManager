"""Regression tests for GitHub issue #175 — prompts must be searchable.

Since migration v18/v19 the ``asset_metadata_fts.metadata_text`` column is
sourced exclusively from ``asset_metadata.metadata_text``. These tests prove:

* ``write_asset_metadata_row`` persists a searchable ``metadata_text``
  (positive/negative prompt, Majoor GenInfo override, custom info blocks).
* FTS ``MATCH`` finds assets by prompt words after a metadata write.
* Migration v21 backfills ``metadata_text`` for already-indexed rows.
"""

from __future__ import annotations

import itertools
import json
from pathlib import Path

import pytest
from mjr_am_backend.adapters.db.migrations import MigrationRunner
from mjr_am_backend.adapters.db.migrations.m021_backfill_metadata_text import (
    MIGRATION as M021,
)
from mjr_am_backend.adapters.db.migrations.registry import MIGRATIONS
from mjr_am_backend.adapters.db.schema import migrate_schema
from mjr_am_backend.adapters.db.sqlite import Sqlite
from mjr_am_backend.features.index import metadata_helpers as mh
from mjr_am_backend.features.index.metadata_helpers import MetadataHelpers
from mjr_am_backend.shared import Result

pytestmark = pytest.mark.asyncio

_seed_counter = itertools.count(90_000)

# Metadata payload mirroring a PNG with a Majoor GenInfo override chunk
# (as produced by the workflow attached to issue #175).
_OVERRIDE_META = {
    "quality": "full",
    "geninfo": {
        "engine": {
            "parser_version": "geninfo-override-v1",
            "source": "majoor_geninfo",
            "mode": "override",
        },
        "positive": {
            "value": "@mishiro shinza, 1girl, under cherry blossoms",
            "confidence": "override",
            "source": "majoor_geninfo",
        },
        "negative": {
            "value": "ignored cfg 1",
            "confidence": "override",
            "source": "majoor_geninfo",
        },
        "checkpoint": {"name": "anima_aestheticV11", "confidence": "override", "source": "majoor_geninfo"},
        "sampler": {"name": "er_sde", "confidence": "override", "source": "majoor_geninfo"},
        "loras": [{"name": "anima-turbo-lora-v0.2", "confidence": "override", "source": "majoor_geninfo"}],
        "custom_info": [
            {"title": "Raw Prompt", "content": "@__aartists__, 1girl, __places__", "color": "#FF0000"}
        ],
    },
}


async def _make_db(tmp_path: Path) -> Sqlite:
    db_path = tmp_path / "metadata-text-fts.db"
    db = Sqlite(str(db_path), attach={"vec": str(tmp_path / "vectors.sqlite")})
    mig = await migrate_schema(db)
    assert mig.ok, mig.error
    runner_res = await MigrationRunner(MIGRATIONS).run(db)
    assert runner_res.ok, runner_res.error
    return db


async def _seed_asset(db: Sqlite) -> int:
    seq = next(_seed_counter)
    cols = await db.aquery("PRAGMA table_info(assets)")
    notnull_cols = [
        c["name"]
        for c in (cols.data or [])
        if c["notnull"] and c["dflt_value"] is None and c["name"] != "id"
    ]
    values: list[object] = []
    filepath = f"/tmp/mtxt_{seq}.png"
    for col in notnull_cols:
        if col == "filepath":
            values.append(filepath)
        elif col in ("size", "mtime", "width", "height"):
            values.append(0)
        else:
            values.append(f"mtxt_{col}_{seq}")
    placeholders = ", ".join(["?"] * len(notnull_cols))
    col_list = ", ".join(notnull_cols)
    ins = await db.aexecute(
        f"INSERT INTO assets ({col_list}) VALUES ({placeholders})", tuple(values)
    )
    assert ins.ok, ins.error
    row = await db.aquery("SELECT id FROM assets WHERE filepath = ?", (filepath,))
    assert row.ok and row.data
    return int(row.data[0]["id"])


async def _fts_match_ids(db: Sqlite, query: str) -> set[int]:
    row = await db.aquery(
        "SELECT rowid AS r FROM asset_metadata_fts WHERE asset_metadata_fts MATCH ?",
        (query,),
    )
    assert row.ok, row.error
    return {int(r["r"]) for r in (row.data or [])}


async def test_build_metadata_fts_text_includes_override_fields() -> None:
    text = mh._build_metadata_fts_text(_OVERRIDE_META, "", mh._collect_geninfo_extras(_OVERRIDE_META))
    assert "under cherry blossoms" in text
    assert "ignored cfg 1" in text
    assert "anima_aestheticV11" in text
    assert "anima-turbo-lora-v0.2" in text
    # custom_info blocks are searchable too (title + content)
    assert "Raw Prompt" in text
    assert "__places__" in text


async def test_write_asset_metadata_row_persists_metadata_text(tmp_path: Path) -> None:
    db = await _make_db(tmp_path)
    try:
        asset_id = await _seed_asset(db)
        res = await MetadataHelpers.write_asset_metadata_row(db, asset_id, Result.Ok(dict(_OVERRIDE_META)))
        assert res.ok, res.error

        row = await db.aquery(
            "SELECT metadata_text FROM asset_metadata WHERE asset_id = ?", (asset_id,)
        )
        assert row.ok and row.data
        text = str(row.data[0]["metadata_text"] or "")
        assert "cherry blossoms" in text

        # FTS trigger propagated metadata_text — prompt words must MATCH.
        assert asset_id in await _fts_match_ids(db, "blossoms")
        assert asset_id in await _fts_match_ids(db, "mishiro")
        # negative prompt + custom info content
        assert asset_id in await _fts_match_ids(db, "ignored")
    finally:
        await db.aclose()


async def test_migration_v21_backfills_metadata_text(tmp_path: Path) -> None:
    db = await _make_db(tmp_path)
    try:
        asset_id = await _seed_asset(db)
        # Simulate a pre-fix row: metadata_raw stored, metadata_text empty.
        ins = await db.aexecute(
            "INSERT INTO asset_metadata (asset_id, metadata_raw, metadata_quality) VALUES (?, ?, 'full')",
            (asset_id, json.dumps(_OVERRIDE_META)),
        )
        assert ins.ok, ins.error
        before = await db.aquery(
            "SELECT COALESCE(metadata_text, '') AS t FROM asset_metadata WHERE asset_id = ?",
            (asset_id,),
        )
        assert before.ok and before.data
        assert (before.data[0]["t"] or "") == ""

        res = await M021.upgrade(db)
        assert res.ok, res.error

        after = await db.aquery(
            "SELECT metadata_text FROM asset_metadata WHERE asset_id = ?", (asset_id,)
        )
        assert after.ok and after.data
        text = str(after.data[0]["metadata_text"] or "")
        assert "cherry blossoms" in text
        assert "__places__" in text

        assert asset_id in await _fts_match_ids(db, "blossoms")
    finally:
        await db.aclose()
