from pathlib import Path

import pytest

from mjr_am_backend.features.index import service as isvc
from mjr_am_backend.shared import Result


class _DummyScanner:
    def __init__(self, *_args, **_kwargs):
        self.scan_result = Result.Ok({"added": 1})

    async def scan_directory(self, **_kwargs):
        return self.scan_result

    async def index_paths(self, **_kwargs):
        return Result.Ok({"updated": 1})


class _DummySearcher:
    def __init__(self, *_args, **_kwargs):
        pass

    async def search(self, *_a, **_k):
        return Result.Ok({"assets": [], "total": 0})

    async def search_scoped(self, *_a, **_k):
        return Result.Ok({"assets": [], "total": 0})

    async def has_assets_under_root(self, _root):
        return Result.Ok(True)

    async def date_histogram_scoped(self, *_a, **_k):
        return Result.Ok({"2026-01-01": 1})

    async def get_asset(self, _asset_id):
        return Result.Ok({"id": 1})

    async def get_assets(self, _ids):
        return Result.Ok([{"id": 1}])

    async def lookup_assets_by_filepaths(self, _fps):
        return Result.Ok({"x": {"id": 1}})


class _DummyUpdater:
    def __init__(self, *_args, **_kwargs):
        pass

    async def update_asset_rating(self, _asset_id, _rating):
        return Result.Ok({"id": 1, "rating": 4})

    async def update_asset_tags(self, _asset_id, _tags):
        return Result.Ok({"id": 1, "tags": ["a"]})

    async def get_all_tags(self):
        return Result.Ok(["a", "b"])


class _DummyEnricher:
    def __init__(self, *_args, **_kwargs):
        self.paused = 0

    def begin_scan_pause(self):
        return None

    def end_scan_pause(self):
        return None

    async def start_enrichment(self, _items):
        return None

    def pause_for_interaction(self, seconds=1.5):
        self.paused = seconds

    async def stop_enrichment(self, clear_queue=True):
        _ = clear_queue
        return None

    def get_queue_length(self):
        return 3


def _build_service(monkeypatch):
    monkeypatch.setattr(isvc, "IndexScanner", _DummyScanner)
    monkeypatch.setattr(isvc, "IndexSearcher", _DummySearcher)
    monkeypatch.setattr(isvc, "AssetUpdater", _DummyUpdater)
    monkeypatch.setattr(isvc, "MetadataEnricher", _DummyEnricher)
    return isvc.IndexService(db=object(), metadata_service=object(), has_tags_text_column=False)


def test_rename_helper_functions(tmp_path: Path) -> None:
    old_fp, new_fp = isvc._normalize_rename_paths("a", "b")
    assert old_fp == "a" and new_fp == "b"

    p = tmp_path / "x.png"
    p.write_bytes(b"x")
    name, sub, mtime = isvc._extract_rename_target_info(str(p))
    assert name == "x.png"
    assert sub
    assert isinstance(mtime, int)


@pytest.mark.asyncio
async def test_scan_directory_fast_background_starts_enrichment(monkeypatch) -> None:
    svc = _build_service(monkeypatch)

    emitted = {"n": 0}

    class _PS:
        class instance:
            @staticmethod
            def send_sync(_event, _payload):
                emitted["n"] += 1

    monkeypatch.setitem(__import__("sys").modules, "mjr_am_backend.routes.registry", type("M", (), {"PromptServer": _PS}))
    monkeypatch.setattr(isvc, "mark_directory_indexed", lambda *args, **kwargs: None)

    svc._scanner.scan_result = Result.Ok({"to_enrich": ["a"], "added": 1})
    res = await svc.scan_directory(".", fast=True, background_metadata=True)
    assert res.ok
    assert emitted["n"] == 1


@pytest.mark.asyncio
async def test_index_service_delegates_to_components(monkeypatch) -> None:
    svc = _build_service(monkeypatch)

    assert (await svc.search("q")).ok
    assert (await svc.search_scoped("q", roots=["."])).ok
    assert (await svc.has_assets_under_root(".")).ok
    assert (await svc.date_histogram_scoped(["."], 1, 2)).ok
    assert (await svc.get_asset(1)).ok
    assert (await svc.get_assets_batch([1])).ok
    assert (await svc.lookup_assets_by_filepaths(["x"])).ok

    assert (await svc.update_asset_rating(1, 4)).ok
    assert (await svc.update_asset_tags(1, ["a"])).ok
    assert (await svc.get_all_tags()).ok


@pytest.mark.asyncio
async def test_index_paths_and_runtime_helpers(monkeypatch) -> None:
    svc = _build_service(monkeypatch)
    monkeypatch.setattr(isvc, "mark_directory_indexed", lambda *args, **kwargs: None)

    res = await svc.index_paths([Path("x")], base_dir=".")
    assert res.ok

    svc.pause_enrichment_for_interaction(seconds=2.0)
    assert svc.get_runtime_status()["enrichment_queue_length"] == 3
    await svc.stop_enrichment(clear_queue=True)


@pytest.mark.asyncio
async def test_remove_file_and_rename_file(monkeypatch) -> None:
    class _Tx:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

    class _Db:
        async def aexecute(self, sql, params=None):
            _ = (sql, params)
            return Result.Ok(True)

        def atransaction(self, mode="immediate"):
            assert mode == "immediate"
            return _Tx()

    svc = _build_service(monkeypatch)
    svc.db = _Db()

    assert (await svc.remove_file("x")).ok
    assert (await svc.rename_file("a", "b")).ok
