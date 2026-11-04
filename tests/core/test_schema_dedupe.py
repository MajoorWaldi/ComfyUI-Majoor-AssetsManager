"""Rows that are one file under different Windows path spellings get merged."""

from __future__ import annotations

from pathlib import Path

import pytest
from mjr_am_backend import deps
from mjr_am_backend.adapters.db.schema_dedupe import merge_duplicate_asset_rows


async def _insert(db, filepath: str, **extra) -> int:
    cols = {
        "filename": "a.png", "subfolder": "Out", "filepath": filepath, "source": "output",
        "kind": "image", "ext": ".png", "size": 1, "mtime": 1, **extra,
    }
    names = ",".join(cols)
    res = await db.aexecute(
        f"INSERT INTO assets ({names}) VALUES ({','.join('?' for _ in cols)})", tuple(cols.values())
    )
    assert res.ok, res.error
    row = await db.aquery("SELECT id FROM assets WHERE filepath = ?", (filepath,))
    return int(row.data[0]["id"])


@pytest.mark.asyncio
async def test_merges_case_variants_and_keeps_user_data(tmp_path: Path, monkeypatch):
    monkeypatch.setattr(deps, "WATCHER_ENABLED", False)
    res = await deps.build_services(str(tmp_path / "db.sqlite"))
    assert res.ok, res.error
    services = res.data
    db = services["db"]
    try:
        a = await _insert(db, "C:\\Out\\a.png")
        b = await _insert(db, "c:\\out\\a.png", job_id="job-1")
        other = await _insert(db, "C:\\Out\\b.png")
        await db.aexecute("INSERT INTO asset_metadata(asset_id, rating) VALUES (?, ?)", (a, 2))
        await db.aexecute("INSERT INTO asset_metadata(asset_id, rating) VALUES (?, ?)", (b, 5))
        await db.aexecute("INSERT OR IGNORE INTO tags(name) VALUES ('keep'), ('fav')")
        tag_rows = await db.aquery("SELECT id, name FROM tags", ())
        tag_ids = {r["name"]: int(r["id"]) for r in tag_rows.data}
        await db.aexecute("INSERT INTO asset_tags(asset_id, tag_id) VALUES (?, ?)", (a, tag_ids["keep"]))
        await db.aexecute("INSERT INTO asset_tags(asset_id, tag_id) VALUES (?, ?)", (b, tag_ids["fav"]))

        assert (await merge_duplicate_asset_rows(db, case_insensitive=False)).data == 0
        merged = await merge_duplicate_asset_rows(db, case_insensitive=True)

        assert merged.ok and merged.data == 1
        ids = {int(r["id"]) for r in (await db.aquery("SELECT id FROM assets", ())).data}
        assert other in ids and len(ids) == 2
        keep = (ids - {other}).pop()
        rating = await db.aquery("SELECT rating FROM asset_metadata WHERE asset_id = ?", (keep,))
        assert int(rating.data[0]["rating"]) == 5
        tags = await db.aquery(
            "SELECT t.name FROM asset_tags at JOIN tags t ON t.id = at.tag_id WHERE at.asset_id = ?", (keep,)
        )
        assert {r["name"] for r in tags.data} == {"keep", "fav"}
        job = await db.aquery("SELECT job_id FROM assets WHERE id = ?", (keep,))
        assert job.data[0]["job_id"] == "job-1"

        assert (await merge_duplicate_asset_rows(db, case_insensitive=True)).data == 0
    finally:
        worker = services.get("rating_tags_sync")
        if worker is not None:
            worker.stop()
        await db.aclose()
