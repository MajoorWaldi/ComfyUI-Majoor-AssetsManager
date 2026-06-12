import asyncio
from pathlib import Path

import pytest
from mjr_am_backend.features.duplicates.service import DuplicatesService
from mjr_am_backend.shared import Result


class _DB:
    def __init__(self):
        self.rows = []
        self.executed = []

    async def aquery(self, sql, params=()):
        self.last_query = sql
        self.last_params = params
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
        self.executed.append((_sql, _params))
        return Result.Ok({"ok": True})


@pytest.mark.asyncio
async def test_duplicates_alerts_and_merge_tags():
    svc = DuplicatesService(_DB())  # type: ignore[arg-type]
    alerts = await svc.get_alerts(roots=[], max_groups=5, max_pairs=5, phash_distance=4)
    assert alerts.ok
    assert alerts.data is not None
    assert alerts.data["exact_groups"] and alerts.data["similar_pairs"]

    merged = await svc.merge_tags_for_group(1, [2, 3, 0])
    assert merged.ok and merged.data is not None
    assert "a" in merged.data["tags"] and "b" in merged.data["tags"]  # type: ignore[index]


@pytest.mark.asyncio
async def test_duplicates_background_analysis(monkeypatch, tmp_path: Path):
    f = tmp_path / "x.bin"
    f.write_bytes(b"abc")
    db = _DB()
    db.rows = [
        {
            "id": 1,
            "filepath": str(f),
            "filename": f.name,
            "kind": "image",
            "size": f.stat().st_size,
            "mtime": int(f.stat().st_mtime),
            "content_hash": "",
            "phash": "",
            "hash_state": "",
        }
    ]
    svc = DuplicatesService(db)  # type: ignore[arg-type]

    monkeypatch.setattr(
        "mjr_am_backend.features.duplicates.service._compute_file_hash_with_algo",
        lambda p: ("h", "test"),
    )
    monkeypatch.setattr("mjr_am_backend.features.duplicates.service._compute_phash_hex", lambda p: "0" * 16)
    started = await svc.start_background_analysis(limit=10)
    assert started.ok
    await asyncio.sleep(0.05)
    st = await svc.get_status()
    assert st.ok
    assert st.data is not None
    assert st.data["processed"] == 1  # type: ignore[index]
    assert st.data["updated"] == 1  # type: ignore[index]
    assert st.data["errors"] == 0  # type: ignore[index]
    assert db.executed


@pytest.mark.asyncio
async def test_duplicates_background_query_selects_filename() -> None:
    db = _DB()
    svc = DuplicatesService(db)  # type: ignore[arg-type]

    await svc._fetch_analysis_rows(10)

    assert "filename" in db.last_query


def test_duplicates_root_filter_is_path_boundary_safe(tmp_path: Path):
    root = tmp_path / "out"
    where, params = DuplicatesService._alerts_where_clause([str(root)])

    assert "a.filepath = ?" in where
    assert "LIKE ? ESCAPE '~'" in where
    assert params[0] == str(root.resolve(strict=False))
    assert str(root.resolve(strict=False)) + "%" not in params


def test_duplicates_merge_ids_ignore_invalid_values() -> None:
    svc = DuplicatesService(_DB())  # type: ignore[arg-type]

    assert svc._normalize_merge_ids(1, [2, "3", "x", None, 1, -4]) == [2, 3]  # type: ignore[list-item]
