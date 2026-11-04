"""Sidecar JSON next to images/videos/audio (``<file>.json`` / ``<stem>.json``)."""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from mjr_am_backend import deps
from mjr_am_backend.features.metadata import sidecar

WORKFLOW = {
    "last_node_id": 3,
    "last_link_id": 1,
    "nodes": [
        {"id": 3, "type": "KSampler", "widgets_values": [42, "fixed", 20, 7.0, "euler", "normal", 1.0]},
    ],
    "links": [],
    "version": 0.4,
}
PROMPT = {"3": {"class_type": "KSampler", "inputs": {"seed": 42, "steps": 20}}}


def _png(path: Path) -> Path:
    from PIL import Image

    Image.new("RGB", (8, 8), (10, 20, 30)).save(path)  # no embedded workflow
    return path


def test_candidates_prefer_full_name_then_stem(tmp_path: Path):
    img = tmp_path / "shot.png"
    assert sidecar.sidecar_candidates(str(img)) == [str(img) + ".json", str(tmp_path / "shot.json")]
    assert sidecar.sidecar_candidates(str(tmp_path / "a.json")) == [str(tmp_path / "a.json.json")]


def test_classify_wrapped_string_payload_and_bom(tmp_path: Path):
    img = _png(tmp_path / "x.png")
    payload = {"workflow": json.dumps(WORKFLOW), "prompt": PROMPT, "generation_time_ms": 1234}
    (tmp_path / "x.png.json").write_bytes(b"\xef\xbb\xbf" + json.dumps(payload).encode())

    data = sidecar.load_sidecar_metadata(str(img))

    assert data is not None
    assert data["workflow"]["nodes"][0]["type"] == "KSampler"
    assert data["prompt"] == PROMPT
    assert data["generation_time_ms"] == 1234
    assert data["sidecar_path"].endswith("x.png.json")


def test_unrelated_json_is_not_a_sidecar(tmp_path: Path):
    img = _png(tmp_path / "y.png")
    (tmp_path / "y.json").write_text(json.dumps({"theme": "dark"}))
    assert sidecar.load_sidecar_metadata(str(img)) is None


def test_embedded_metadata_wins_over_sidecar(tmp_path: Path):
    img = _png(tmp_path / "z.png")
    (tmp_path / "z.json").write_text(json.dumps(WORKFLOW))
    combined = {"file_info": {"filepath": str(img)}, "workflow": {"nodes": [{"id": 1}]}, "prompt": PROMPT}
    assert sidecar.apply_sidecar_fallback(combined) is False
    assert combined["workflow"] == {"nodes": [{"id": 1}]}


@pytest.mark.asyncio
async def test_scan_links_stem_sidecar_workflow_to_image(tmp_path: Path, monkeypatch):
    root = tmp_path / "out"
    root.mkdir()
    img = _png(root / "render_0001.png")
    (root / "render_0001.json").write_text(json.dumps({"workflow": WORKFLOW, "prompt": PROMPT}))
    monkeypatch.setattr(deps, "WATCHER_ENABLED", False)
    res = await deps.build_services(str(tmp_path / "db.sqlite"))
    assert res.ok, res.error
    services = res.data
    try:
        index = services["index"]
        scan = await index.scan_directory(
            directory=str(root), recursive=False, incremental=False, source="output", root_id=None
        )
        assert scan.ok, scan.error

        rows = await index.db.aquery(
            "SELECT a.filename, m.has_workflow, m.has_generation_data FROM assets a "
            "JOIN asset_metadata m ON m.asset_id = a.id",
            (),
        )
        assert rows.ok, rows.error
        by_name = {r["filename"]: r for r in rows.data}
        assert set(by_name) == {img.name}  # the .json itself is not an asset
        assert int(by_name[img.name]["has_workflow"]) == 1
    finally:
        worker = services.get("rating_tags_sync")
        if worker is not None:
            worker.stop()
        await services["db"].aclose()


def test_sidecar_media_paths_resolution(tmp_path: Path):
    from mjr_am_backend.features.index.watcher import sidecar_media_paths

    png = _png(tmp_path / "Shot.png")
    (tmp_path / "Shot.mp4").write_bytes(b"0")
    (tmp_path / "other.png").write_bytes(b"0")

    assert sidecar_media_paths(str(tmp_path / "Shot.png.json")) == [str(png)]
    stem_matches = sorted(sidecar_media_paths(str(tmp_path / "shot.json")))
    assert stem_matches == sorted([str(png), str(tmp_path / "Shot.mp4")])
    assert sidecar_media_paths(str(tmp_path / "missing.png.json")) == []
    assert sidecar_media_paths(str(tmp_path / "notes.txt")) == []


@pytest.mark.asyncio
async def test_sidecar_added_after_indexing_is_picked_up_by_forced_reindex(tmp_path: Path, monkeypatch):
    from mjr_am_backend.routes.handlers.scan_watcher import build_sidecar_reindex_callback

    root = tmp_path / "out"
    root.mkdir()
    img = _png(root / "late.png")
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

        async def _has_workflow() -> int:
            rows = await index.db.aquery(
                "SELECT m.has_workflow FROM assets a JOIN asset_metadata m ON m.asset_id = a.id "
                "WHERE a.filename = ?",
                (img.name,),
            )
            return int(rows.data[0]["has_workflow"] or 0)

        assert await _has_workflow() == 0
        (root / "late.png.json").write_text(json.dumps(WORKFLOW))

        # An incremental pass alone skips the unchanged image...
        await index.index_paths(paths=[img], base_dir=str(root), incremental=True, source="output", root_id=None)
        # ...the watcher's sidecar path forces re-extraction.
        await build_sidecar_reindex_callback(index)([str(img)], str(root), "output", None)

        assert await _has_workflow() == 1
    finally:
        worker = services.get("rating_tags_sync")
        if worker is not None:
            worker.stop()
        await services["db"].aclose()
