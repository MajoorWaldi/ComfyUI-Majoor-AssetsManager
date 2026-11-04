"""Single-word searches also match file names that *contain* the text."""

from __future__ import annotations

from pathlib import Path

import pytest
from mjr_am_backend import deps
from mjr_am_backend.features.index.searcher import _filename_substring_pattern

NAMES = ["ComfyUI_00001_.png", "Flux_portrait.png", "field.png", "sunflower.png", "cat.png", "50%_off.png", "a_b.png", "axb.png"]


def test_pattern_rules():
    assert _filename_substring_pattern("F") == "%F%"
    assert _filename_substring_pattern("red car") is None  # multi-word: FTS only
    assert _filename_substring_pattern('"exact"') is None
    assert _filename_substring_pattern("*") is None
    assert _filename_substring_pattern("a_b") == "%a\\_b%"  # LIKE wildcards escaped
    assert _filename_substring_pattern("50%") == "%50\\%%"


@pytest.mark.asyncio
async def test_single_letter_lists_every_file_containing_it(tmp_path: Path, monkeypatch):
    root = tmp_path / "out"
    root.mkdir()
    for name in NAMES:
        (root / name).write_bytes(b"\x89PNG\r\n\x1a\n")
    monkeypatch.setattr(deps, "WATCHER_ENABLED", False)
    res = await deps.build_services(str(tmp_path / "db.sqlite"))
    assert res.ok, res.error
    services = res.data
    try:
        index = services["index"]
        scan = await index.scan_directory(
            directory=str(root), recursive=False, incremental=True, source="output", root_id=None
        )
        assert scan.ok, scan.error

        async def names(query: str, *, scoped: bool) -> set[str]:
            if scoped:
                r = await index.search_scoped(
                    query, roots=[str(root)], limit=50, offset=0, filters=None, include_total=True
                )
            else:
                r = await index.search(query, limit=50, offset=0, filters=None, include_total=True)
            assert r.ok, r.error
            found = {a["filename"] for a in r.data["assets"]}
            assert r.data.get("total") in (None, len(found))
            return found

        for scoped in (True, False):
            assert await names("F", scoped=scoped) == {
                "ComfyUI_00001_.png", "Flux_portrait.png", "field.png", "sunflower.png", "50%_off.png",
            }
            assert await names("flow", scoped=scoped) == {"sunflower.png"}
            # "_" and "%" are literal, not LIKE wildcards.
            assert await names("a_b", scoped=scoped) == {"a_b.png"}
    finally:
        worker = services.get("rating_tags_sync")
        if worker is not None:
            worker.stop()
        await services["db"].aclose()
