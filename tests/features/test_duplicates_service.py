import asyncio
from pathlib import Path

import pytest

from mjr_am_backend.features.duplicates.service import DuplicatesService
from mjr_am_backend.shared import Result


class _DB:
    def __init__(self):
        self.rows = []

    async def aquery(self, sql, params=()):
        if "content_hash" in sql and "GROUP BY content_hash" in sql:
            return Result.Ok(
                [
                    {"id": 1, "filepath": "a.png", "filename": "a.png", "content_hash": "h1", "tags": "[]"},
                    {"id": 2, "filepath": "b.png", "filename": "b.png", "content_hash": "h1", "tags": "[]"},
                ]
            )
        if "phash" in sql and "kind = 'image'" in sql:
            return Result.Ok(
                [
                    {"id": 1, "filepath": "a.png", "filename": "a.png", "phash": "0000000000000000"},
                    {"id": 2, "filepath": "b.png", "filename": "b.png", "phash": "0000000000000001"},
                ]
            )
        return Result.Ok(self.rows)

    async def aquery_in(self, _sql, _col, _ids):
        return Result.Ok([{"asset_id": 1, "tags": '["a"]'}, {"asset_id": 2, "tags": '["b","A"]'}])

    async def aexecute(self, _sql, _params=()):
        return Result.Ok({"ok": True})


@pytest.mark.asyncio
async def test_duplicates_alerts_and_merge_tags():
    svc = DuplicatesService(_DB())
    alerts = await svc.get_alerts(roots=[], max_groups=5, max_pairs=5, phash_distance=4)
    assert alerts.ok and alerts.data["exact_groups"] and alerts.data["similar_pairs"]

    merged = await svc.merge_tags_for_group(1, [2, 3, 0])
    assert merged.ok and "a" in merged.data["tags"] and "b" in merged.data["tags"]


@pytest.mark.asyncio
async def test_duplicates_background_analysis(monkeypatch, tmp_path: Path):
    f = tmp_path / "x.bin"
    f.write_bytes(b"abc")
    db = _DB()
    db.rows = [{"id": 1, "filepath": str(f), "kind": "image", "size": f.stat().st_size, "mtime": int(f.stat().st_mtime), "content_hash": "", "phash": "", "hash_state": ""}]
    svc = DuplicatesService(db)

    monkeypatch.setattr("mjr_am_backend.features.duplicates.service._compute_file_hash", lambda p: "h")
    monkeypatch.setattr("mjr_am_backend.features.duplicates.service._compute_phash_hex", lambda p: "0" * 16)
    started = await svc.start_background_analysis(limit=10)
    assert started.ok
    await asyncio.sleep(0.05)
    st = await svc.get_status()
    assert st.ok
