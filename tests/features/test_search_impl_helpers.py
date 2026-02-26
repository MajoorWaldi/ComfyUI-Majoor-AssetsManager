import datetime

import pytest

from mjr_am_backend.routes.handlers import search_impl as s


def test_dedupe_assets_payload_total_adjusted() -> None:
    payload = {
        "assets": [
            {"filepath": "A"},
            {"filepath": "A"},
            {"filepath": "B"},
            {"x": 1},
        ],
        "total": 99,
    }
    out = s._dedupe_result_assets_payload(payload)
    assert len(out["assets"]) == 3
    assert out["total"] == 3


def test_collect_hydration_paths_skips_folder_and_invalid() -> None:
    assets = [
        {"kind": "folder", "filepath": "C:/x"},
        {"kind": "image", "filepath": "C:/y.png"},
        "bad",
        {},
    ]
    assert s._collect_hydration_filepaths(assets) == ["C:/y.png"]


def test_index_rows_and_hydrate_asset_from_row() -> None:
    rows = [{"filepath": "C:/a.png", "id": 3, "rating": 5, "tags": '["x"]'}]
    by = s._index_rows_by_filepath(rows)
    asset = {"kind": "image", "filepath": "C:/a.png"}
    s._hydrate_browser_asset_from_row(asset, by)
    assert asset["id"] == 3
    assert asset["rating"] == 5
    assert asset["tags"] == ["x"]


def test_coerce_browser_tags_variants() -> None:
    assert s._coerce_browser_tags('["a",1]') == ["a"]
    assert s._coerce_browser_tags(["a", 1]) == ["a"]
    assert s._coerce_browser_tags("bad-json") == []


@pytest.mark.asyncio
async def test_hydrate_browser_assets_from_db_no_db_returns_input() -> None:
    assets = [{"filepath": "C:/a.png"}]
    out = await s._hydrate_browser_assets_from_db(None, assets)
    assert out is assets


@pytest.mark.asyncio
async def test_hydrate_browser_assets_from_db_applies_rows(monkeypatch) -> None:
    assets = [{"kind": "image", "filepath": "C:/a.png"}]

    class _DB:
        async def aquery_in(self, *_args, **_kwargs):
            return type("R", (), {"ok": True, "data": [{"filepath": "C:/a.png", "id": 9, "rating": 4, "tags": []}]})

    out = await s._hydrate_browser_assets_from_db({"db": _DB()}, assets)
    assert out[0]["id"] == 9


def test_date_bounds_helpers() -> None:
    ref = datetime.datetime(2026, 2, 25, 10, 0, tzinfo=datetime.timezone.utc)
    start, end = s._date_bounds_for_range("today", reference=ref)
    assert isinstance(start, int)
    assert end > start

    start2, end2 = s._date_bounds_for_exact("2026-02-01")
    assert isinstance(start2, int)
    assert end2 > start2

    bad = s._date_bounds_for_exact("bad")
    assert bad == (None, None)


def test_exclude_assets_under_root(tmp_path) -> None:
    root = tmp_path / "root"
    root.mkdir()
    inside = root / "a.png"
    inside.write_text("x")
    outside = tmp_path / "b.png"
    outside.write_text("y")

    out = s._exclude_assets_under_root(
        [{"filepath": str(inside)}, {"filepath": str(outside)}, {"x": 1}],
        str(root),
    )
    assert len(out) == 2
