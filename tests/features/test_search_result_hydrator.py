import pytest

from mjr_am_backend.routes.search import result_hydrator as rh


def test_dedupe_result_payload_updates_assets_and_total() -> None:
    payload = {
        "assets": [
            {"filepath": "/a/x.png"},
            {"filepath": "/a/x.png"},
            {"filepath": "/a/y.png"},
        ],
        "total": 99,
    }
    out = rh.dedupe_result_payload(payload)
    assert len(out["assets"]) == 2
    assert out["total"] == 2


def test_coerce_browser_tags_accepts_json_list_and_list() -> None:
    assert rh.coerce_browser_tags('["a","b",1]') == ["a", "b"]
    assert rh.coerce_browser_tags(["x", 1, "y"]) == ["x", "y"]
    assert rh.coerce_browser_tags("not-json") == []


def test_collect_hydration_paths_skips_folder_assets() -> None:
    assets = [
        {"kind": "folder", "filepath": "/a"},
        {"kind": "image", "filepath": "/a/x.png"},
        {"kind": "video", "filepath": "/a/y.mp4"},
    ]
    assert rh.collect_hydration_paths(assets) == ["/a/x.png", "/a/y.mp4"]


def test_apply_hydration_rows_sets_id_rating_tags() -> None:
    assets = [{"filepath": "/a/x.png", "kind": "image"}, {"filepath": "/a/folder", "kind": "folder"}]
    rows = [{"id": "7", "filepath": "/a/x.png", "rating": 5, "tags": '["tag1"]'}]
    rh.apply_hydration_rows(assets, rows)
    assert assets[0]["id"] == 7
    assert assets[0]["rating"] == 5
    assert assets[0]["tags"] == ["tag1"]
    assert "id" not in assets[1]


class _Db:
    async def aquery_in(self, _query, _column, _filepaths):
        from mjr_am_backend.shared import Result

        return Result.Ok([{"id": 3, "filepath": "/a/x.png", "rating": 2, "tags": ["t"]}])


@pytest.mark.asyncio
async def test_hydrate_assets_roundtrip() -> None:
    svc = {"db": _Db()}
    assets = [{"filepath": "/a/x.png", "kind": "image"}]
    out = await rh.hydrate_assets(svc, assets, lambda s: s.get("db"))
    assert out[0]["id"] == 3
    assert out[0]["rating"] == 2
    assert out[0]["tags"] == ["t"]

