import sys
from types import SimpleNamespace

import pytest
from mjr_am_backend.adapters import core_assets


def _fake_session_module(session):
    class _Ctx:
        def __enter__(self):
            return session

        def __exit__(self, *exc):
            return False

    return SimpleNamespace(create_session=lambda: _Ctx())


@pytest.mark.asyncio
async def test_fetch_by_path_uses_real_query_and_detail_functions(monkeypatch):
    record = SimpleNamespace(id="ref-1")
    detail = SimpleNamespace(
        ref=SimpleNamespace(
            id="ref-1",
            file_path="C:/out/final.png",
            job_id="job-1",
            user_metadata={"note": "kept"},
            system_metadata={},
        ),
        asset=SimpleNamespace(hash="hash-1", size_bytes=10, mime_type="image/png"),
        tags=["tag"],
    )

    calls = {}

    def _get_record_by_path_or_none(session, path):
        calls["path"] = path
        return record

    def _get_asset_detail(reference_id):
        calls["reference_id"] = reference_id
        return detail

    monkeypatch.setattr(core_assets, "is_available", lambda: True)
    monkeypatch.setitem(
        sys.modules,
        "app.assets.database.queries.records",
        SimpleNamespace(get_record_by_path_or_none=_get_record_by_path_or_none),
    )
    monkeypatch.setitem(
        sys.modules,
        "app.assets.services",
        SimpleNamespace(get_asset_detail=_get_asset_detail),
    )
    monkeypatch.setitem(sys.modules, "app.database.db", _fake_session_module(object()))

    info = await core_assets.fetch_by_path("C:/out/final.png")

    assert info is not None
    assert info.reference_id == "ref-1"
    assert info.job_id == "job-1"
    assert calls["reference_id"] == "ref-1"
    # Core normalizes stored content paths with os.path.abspath(); the lookup
    # must use the same normalization or it will never match a stored row.
    assert calls["path"].endswith("final.png")


@pytest.mark.asyncio
async def test_fetch_by_path_returns_none_when_record_missing(monkeypatch):
    monkeypatch.setattr(core_assets, "is_available", lambda: True)
    monkeypatch.setitem(
        sys.modules,
        "app.assets.database.queries.records",
        SimpleNamespace(get_record_by_path_or_none=lambda session, path: None),
    )
    monkeypatch.setitem(sys.modules, "app.database.db", _fake_session_module(object()))

    info = await core_assets.fetch_by_path("C:/out/missing.png")

    assert info is None


@pytest.mark.asyncio
async def test_sync_user_metadata_merges_onto_existing_metadata(monkeypatch):
    existing_info = core_assets.CoreAssetInfo(
        reference_id="ref-1",
        file_path="C:/out/final.png",
        hash="hash-1",
        size_bytes=10,
        mime_type="image/png",
        job_id="job-1",
        tags=[],
        user_metadata={"other_tool_field": "keep-me"},
    )

    async def _asset_filepath_by_id(db, asset_id):
        return "C:/out/final.png"

    async def _fetch_by_path(path):
        return existing_info

    captured = {}

    def _update_sync(reference_id, tags, user_metadata):
        captured["reference_id"] = reference_id
        captured["tags"] = tags
        captured["user_metadata"] = user_metadata
        return True

    monkeypatch.setattr(core_assets, "is_available", lambda: True)
    monkeypatch.setattr(core_assets, "_asset_filepath_by_id", _asset_filepath_by_id)
    monkeypatch.setattr(core_assets, "fetch_by_path", _fetch_by_path)
    monkeypatch.setattr(core_assets, "_update_asset_metadata_sync", _update_sync)

    ok = await core_assets.sync_user_metadata_by_asset_id(
        object(), 1, rating=4, tags=["a", "A", " b "]
    )

    assert ok is True
    assert captured["reference_id"] == "ref-1"
    assert captured["tags"] == ["a", "b"]
    # Existing core metadata must survive the write, not be clobbered.
    assert captured["user_metadata"]["other_tool_field"] == "keep-me"
    assert captured["user_metadata"]["rating"] == 4


@pytest.mark.asyncio
async def test_sync_user_metadata_noop_when_nothing_to_write(monkeypatch):
    async def _asset_filepath_by_id(db, asset_id):
        return "C:/out/final.png"

    async def _fetch_by_path(path):
        return core_assets.CoreAssetInfo(
            reference_id="ref-1",
            file_path=path,
            hash=None,
            size_bytes=None,
            mime_type=None,
            job_id=None,
            tags=[],
        )

    monkeypatch.setattr(core_assets, "is_available", lambda: True)
    monkeypatch.setattr(core_assets, "_asset_filepath_by_id", _asset_filepath_by_id)
    monkeypatch.setattr(core_assets, "fetch_by_path", _fetch_by_path)

    ok = await core_assets.sync_user_metadata_by_asset_id(object(), 1)

    assert ok is False


@pytest.mark.asyncio
async def test_fetch_by_job_id_delegates_to_sync_helper(monkeypatch):
    expected = [
        core_assets.CoreAssetInfo(
            reference_id="ref-1",
            file_path="C:/out/a.png",
            hash=None,
            size_bytes=None,
            mime_type=None,
            job_id="job-1",
            tags=[],
        )
    ]
    monkeypatch.setattr(core_assets, "is_available", lambda: True)
    monkeypatch.setattr(core_assets, "_fetch_by_job_id_sync", lambda job_id: expected)

    result = await core_assets.fetch_by_job_id("job-1")

    assert result == expected


@pytest.mark.asyncio
async def test_fetch_by_job_id_short_circuits_when_unavailable(monkeypatch):
    monkeypatch.setattr(core_assets, "is_available", lambda: False)

    assert await core_assets.fetch_by_job_id("job-1") == []
    assert await core_assets.fetch_by_path("x") is None
