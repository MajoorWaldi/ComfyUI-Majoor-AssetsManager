from collections import OrderedDict

from mjr_am_backend.routes.handlers import filesystem as fs


def test_normalize_sort_key_accepts_known_and_fallback() -> None:
    assert fs._normalize_sort_key("name_asc") == "name_asc"
    assert fs._normalize_sort_key("  MTIME_ASC ") == "mtime_asc"
    assert fs._normalize_sort_key("bad") == "mtime_desc"
    assert fs._normalize_sort_key(None) == "mtime_desc"


def test_safe_mtime_int_handles_common_inputs() -> None:
    assert fs._safe_mtime_int(True) == 0
    assert fs._safe_mtime_int(12) == 12
    assert fs._safe_mtime_int(12.8) == 12
    assert fs._safe_mtime_int("13") == 13
    assert fs._safe_mtime_int("13.7") == 13
    assert fs._safe_mtime_int("") == 0
    assert fs._safe_mtime_int("x") == 0


def test_boolish_and_extension_normalizers() -> None:
    assert fs._is_truthy_boolish(True)
    assert fs._is_truthy_boolish(1)
    assert fs._is_truthy_boolish("1")
    assert not fs._is_truthy_boolish(False)
    assert not fs._is_truthy_boolish("yes")

    assert fs._normalize_extension(".PNG,") == "png"
    assert fs._normalize_extension("  jpg  ") == "jpg"
    assert fs._normalize_extension(None) == ""
    assert fs._normalize_extensions([".PNG", "png", "jpg", None]) == ["png", "jpg"]


def test_background_entry_peek_and_skip_logic(monkeypatch) -> None:
    monkeypatch.setattr(fs, "_BACKGROUND_SCAN_LAST", OrderedDict())

    fs._BACKGROUND_SCAN_LAST["a"] = {"last_mono": 100.0, "in_progress": True}
    assert fs._peek_background_entry("a") == (100.0, True)
    assert fs._should_skip_scan_enqueue("a", 200.0, 10.0)

    fs._BACKGROUND_SCAN_LAST["b"] = 50.0
    assert fs._peek_background_entry("b") == (50.0, False)
    assert not fs._should_skip_scan_enqueue("b", 80.0, 10.0)


def test_enqueue_background_scan_job_caps_queue(monkeypatch) -> None:
    monkeypatch.setattr(fs, "_SCAN_PENDING", OrderedDict())
    monkeypatch.setattr(fs, "_SCAN_PENDING_MAX", 2)

    assert fs._enqueue_background_scan_job("k1", {"v": 1})
    assert fs._enqueue_background_scan_job("k2", {"v": 2})
    assert not fs._enqueue_background_scan_job("k2", {"v": 22})
    assert fs._enqueue_background_scan_job("k3", {"v": 3})
    assert list(fs._SCAN_PENDING.keys()) == ["k2", "k3"]


def test_filesystem_entry_matching_predicates() -> None:
    assert not fs._filesystem_entry_matches_filters(
        filename="x.bin",
        kind="unknown",
        query_lower="x",
        browse_all=False,
        filter_kind="",
        filter_extensions=[],
    )

    assert not fs._filesystem_entry_matches_filters(
        filename="photo.png",
        kind="image",
        query_lower="abc",
        browse_all=False,
        filter_kind="",
        filter_extensions=[],
    )

    assert not fs._filesystem_entry_matches_filters(
        filename="photo.png",
        kind="image",
        query_lower="photo",
        browse_all=False,
        filter_kind="video",
        filter_extensions=[],
    )

    assert fs._filesystem_entry_matches_filters(
        filename="photo.png",
        kind="image",
        query_lower="photo",
        browse_all=False,
        filter_kind="image",
        filter_extensions=["png"],
    )


def test_parse_filters_and_fast_path_flag() -> None:
    opts = fs._parse_filesystem_listing_filters(
        "*",
        {
            "kind": "image",
            "min_rating": 0,
            "has_workflow": 0,
            "extensions": [".png"],
            "mtime_start": None,
            "mtime_end": None,
        },
        "none",
    )
    assert opts["browse_all"] is True
    assert opts["sort_key"] == "none"
    assert opts["filter_extensions"] == ["png"]
    assert fs._can_use_listing_fast_path(opts)

    opts2 = dict(opts)
    opts2["filter_min_rating"] = 1
    assert not fs._can_use_listing_fast_path(opts2)


def test_prefilter_and_sort_entries() -> None:
    all_entries = [
        {"filename": "b.png", "kind": "image", "mtime": 10},
        {"filename": "a.png", "kind": "image", "mtime": 20},
        {"filename": "x.mp4", "kind": "video", "mtime": 5},
        {"filename": "", "kind": "image", "mtime": 1},
        "bad",
    ]
    filtered = fs._prefilter_cached_filesystem_entries(
        all_entries, filter_kind="image", browse_all=False, q_lower=".png"
    )
    assert [x["filename"] for x in filtered] == ["b.png", "a.png"]

    fs._sort_filesystem_entries(filtered, "name_asc")
    assert [x["filename"] for x in filtered] == ["a.png", "b.png"]

    fs._sort_filesystem_entries(filtered, "mtime_desc")
    assert [x["filename"] for x in filtered] == ["a.png", "b.png"]


def test_post_filters_helpers_and_pagination() -> None:
    items = [
        {
            "filename": "a.png",
            "kind": "image",
            "ext": ".png",
            "rating": 5,
            "has_workflow": 1,
            "mtime": 200,
        },
        {
            "filename": "b.jpg",
            "kind": "image",
            "ext": ".jpg",
            "rating": 1,
            "has_workflow": 0,
            "mtime": 100,
        },
    ]

    assert fs._passes_extension_filter(items[0], ["png"])
    assert not fs._passes_extension_filter(items[1], ["png"])
    assert fs._passes_kind_filter(items[0], "image")
    assert fs._passes_rating_filter(items[0], 3)
    assert not fs._passes_rating_filter(items[1], 3)
    assert fs._passes_workflow_filter(items[0], True)
    assert not fs._passes_workflow_filter(items[1], True)
    assert fs._passes_mtime_window(items[0], 150, 300)
    assert not fs._passes_mtime_window(items[1], 150, 300)
    assert fs._passes_name_query(items[0], browse_all=False, q_lower="a.")

    paged, total = fs._paginate_filesystem_listing_entries(
        items,
        filter_extensions=["png", "jpg"],
        filter_kind="image",
        filter_min_rating=1,
        filter_workflow_only=False,
        filter_mtime_start=50,
        filter_mtime_end=250,
        browse_all=False,
        q_lower=".",
        limit=1,
        offset=1,
    )
    assert total == 2
    assert len(paged) == 1
    assert paged[0]["filename"] == "b.jpg"


def test_listing_payload_and_args() -> None:
    payload = fs._build_filesystem_listing_payload([], total=0, limit=10, offset=5, query="q", sort_key="none")
    assert payload["sort"] == "none"
    assert payload["offset"] == 5

    args = fs._listing_args_from_opts(
        {
            "q": "*",
            "q_lower": "*",
            "browse_all": True,
            "filter_kind": "",
            "filter_min_rating": 0,
            "filter_workflow_only": False,
            "filter_extensions": ["png"],
            "filter_mtime_start": None,
            "filter_mtime_end": None,
            "sort_key": "mtime_desc",
        }
    )
    assert args["sort_key"] == "mtime_desc"
    assert args["filter_extensions"] == ["png"]


def test_lookup_and_enrichment_helpers() -> None:
    class _Svc:
        def lookup_assets_by_filepaths(self, _fps):
            return None

    lookup, fps = fs._resolve_filesystem_lookup(_Svc(), [{"filepath": "a"}, {"filepath": ""}])
    assert callable(lookup)
    assert fps == ["a"]

    assert fs._extract_enrichment_mapping(None) is None

    class _Res:
        ok = True
        data = {"a": {"id": 5, "rating": 2, "tags": ["x"], "has_workflow": 1, "has_generation_data": 0, "root_id": "r"}}

    mapping = fs._extract_enrichment_mapping(_Res())
    assert mapping is not None

    asset = {"filepath": "a", "rating": 0, "tags": []}
    fs._apply_db_enrichment_row(asset, mapping)
    assert asset["id"] == 5
    assert asset["root_id"] == "r"


def test_cache_entry_helpers(monkeypatch) -> None:
    cached = {"dir_mtime_ns": 10, "watch_token": 3, "entries": []}
    assert fs._cache_entry_matches_dir_state(cached, dir_mtime_ns=10, watch_token=3)
    assert not fs._cache_entry_matches_dir_state(cached, dir_mtime_ns=9, watch_token=3)

    monkeypatch.setattr(fs, "FS_LIST_CACHE_TTL_SECONDS", 10)
    monkeypatch.setattr(fs.time, "monotonic", lambda: 200.0)
    assert fs._cache_entry_is_fresh({"cached_at_mono": 195.0})
    assert not fs._cache_entry_is_fresh({"cached_at_mono": 100.0})
from pathlib import Path

import pytest

from mjr_am_backend.routes.handlers import filesystem as fs


def test_resolve_filesystem_listing_target_ok_and_invalid(tmp_path: Path) -> None:
    root = tmp_path / "root"
    sub = root / "sub"
    sub.mkdir(parents=True)

    ok = fs._resolve_filesystem_listing_target(root, "sub")
    assert ok.ok
    assert ok.data["target_dir_resolved"] == sub.resolve()

    bad = fs._resolve_filesystem_listing_target(root, "../outside")
    assert not bad.ok
    assert bad.code == "INVALID_INPUT"


def test_collect_filesystem_entries_and_window(tmp_path: Path) -> None:
    root = tmp_path / "root"
    root.mkdir()
    good = root / "a.png"
    other = root / "b.jpg"
    unknown = root / "c.zzz"
    good.write_bytes(b"x")
    other.write_bytes(b"y")
    unknown.write_bytes(b"z")

    entries = fs._collect_filesystem_entries(root, root, "input", "rid")
    names = sorted([e["filename"] for e in entries])
    assert names == ["a.png", "b.jpg"]

    out, total = fs._collect_filesystem_entries_window(
        root,
        root,
        "input",
        "rid",
        query_lower="a",
        browse_all=False,
        filter_kind="image",
        filter_extensions=["png"],
        offset=0,
        limit=10,
    )
    assert total == 1
    assert len(out) == 1
    assert out[0]["filename"] == "a.png"


def test_filesystem_dir_cache_state_handles_watch_token(tmp_path: Path, monkeypatch) -> None:
    base = tmp_path
    target = tmp_path

    called = {"watch": 0}

    def _watch(_base: str) -> None:
        called["watch"] += 1

    monkeypatch.setattr(fs, "ensure_fs_list_cache_watching", _watch)
    monkeypatch.setattr(fs, "get_fs_list_cache_token", lambda _b: 9)

    res = fs._filesystem_dir_cache_state(base, target)
    assert res.ok
    assert res.data["watch_token"] == 9
    assert called["watch"] == 1


@pytest.mark.asyncio
async def test_dispatch_filesystem_listing_path_selects_fast_and_cached(monkeypatch, tmp_path: Path) -> None:
    async def _fast(*_args, **_kwargs):
        return fs.Result.Ok({"path": "fast"})

    async def _cached(*_args, **_kwargs):
        return fs.Result.Ok({"path": "cached"})

    monkeypatch.setattr(fs, "_list_filesystem_assets_fast_path", _fast)
    monkeypatch.setattr(fs, "_list_filesystem_assets_cached_path", _cached)

    base = tmp_path
    target = tmp_path

    listing_args_fast = {
        "q": "*",
        "q_lower": "*",
        "browse_all": True,
        "filter_kind": "",
        "filter_min_rating": 0,
        "filter_workflow_only": False,
        "filter_extensions": [],
        "filter_mtime_start": None,
        "filter_mtime_end": None,
        "sort_key": "none",
        "opts": {
            "sort_key": "none",
            "filter_min_rating": 0,
            "filter_workflow_only": False,
            "filter_mtime_start": None,
            "filter_mtime_end": None,
        },
    }

    r1 = await fs._dispatch_filesystem_listing_path(
        base,
        target,
        "input",
        None,
        listing_args=listing_args_fast,
        limit=10,
        offset=0,
        index_service=None,
    )
    assert r1.ok
    assert r1.data["path"] == "fast"

    listing_args_cached = dict(listing_args_fast)
    listing_args_cached["opts"] = {"sort_key": "mtime_desc"}

    r2 = await fs._dispatch_filesystem_listing_path(
        base,
        target,
        "input",
        None,
        listing_args=listing_args_cached,
        limit=10,
        offset=0,
        index_service=None,
    )
    assert r2.ok
    assert r2.data["path"] == "cached"
