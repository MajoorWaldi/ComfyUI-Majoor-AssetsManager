from types import SimpleNamespace

import pytest
from mjr_am_backend.adapters import core_assets


@pytest.mark.asyncio
async def test_fetch_by_path_fallback_filters_by_basename(monkeypatch):
    calls = []

    async def _direct(_path):
        return None

    async def _list_assets_page(**kwargs):
        calls.append(kwargs)
        item = SimpleNamespace(
            ref=SimpleNamespace(
                id="ref-1",
                file_path="C:/out/final.png",
                job_id="job-1",
                user_metadata={},
                system_metadata={},
            ),
            asset=SimpleNamespace(hash="hash-1", size_bytes=10, mime_type="image/png"),
            tags=["tag"],
        )
        return SimpleNamespace(items=[item])

    monkeypatch.setattr(core_assets, "is_available", lambda: True)
    monkeypatch.setattr(core_assets, "_fetch_by_path_direct", _direct)
    monkeypatch.setitem(
        __import__("sys").modules,
        "app.assets.services",
        SimpleNamespace(list_assets_page=_list_assets_page),
    )

    info = await core_assets.fetch_by_path("C:/out/final.png")

    assert info is not None
    assert info.reference_id == "ref-1"
    assert info.job_id == "job-1"
    assert calls[0]["name_contains"] == "final.png"
    assert calls[0]["limit"] == 200
