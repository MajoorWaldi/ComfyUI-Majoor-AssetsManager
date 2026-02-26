from pathlib import Path

import pytest

from mjr_am_backend.routes.search import result_filter as rf


def test_search_db_from_services_returns_db_only_for_dict() -> None:
    assert rf.search_db_from_services({"db": 123}) == 123
    assert rf.search_db_from_services(None) is None
    assert rf.search_db_from_services("x") is None


def test_exclude_under_root_filters_matching_filepaths(tmp_path: Path) -> None:
    root = tmp_path / "root"
    root.mkdir()
    under = root / "a.png"
    under.write_text("x", encoding="utf-8")
    outside = tmp_path / "b.png"
    outside.write_text("y", encoding="utf-8")
    assets = [{"filepath": str(under)}, {"filepath": str(outside)}, {"kind": "folder"}]
    out = rf.exclude_under_root(assets, str(root))
    assert len(out) == 2
    assert str(out[0].get("filepath", "")) == str(outside)


def test_touch_enrichment_pause_is_best_effort() -> None:
    called = {"v": 0}

    class _Idx:
        def pause_enrichment_for_interaction(self, *, seconds):
            called["v"] = seconds

    rf.touch_enrichment_pause({"index": _Idx()}, seconds=2.5)
    assert called["v"] == 2.5
    rf.touch_enrichment_pause({"index": object()}, seconds=1.0)
    rf.touch_enrichment_pause(None, seconds=1.0)


@pytest.mark.asyncio
async def test_runtime_output_root_uses_settings_override() -> None:
    class _Settings:
        async def get_output_directory(self):
            return "."

    out = await rf.runtime_output_root({"settings": _Settings()})
    assert isinstance(out, str)
    assert out

