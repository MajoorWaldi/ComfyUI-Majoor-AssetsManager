"""Live change events for files added, moved or removed outside the Majoor UI.

Mirrors ComfyUI core's reconciler rules: only a confirmed absence removes an
indexed asset, an unreadable scan root is never pruned, and every removal or
move is announced so open grids update without a full reload.
"""

from __future__ import annotations

import os
from pathlib import Path

import pytest
from mjr_am_backend import deps
from mjr_am_backend.adapters import comfy_core
from mjr_am_backend.features.index import scan_prune


@pytest.fixture
def emitted(monkeypatch):
    events: list[tuple[str, dict]] = []

    def _send_event(event, payload, *_args):
        events.append((event, payload))
        return True

    monkeypatch.setattr(comfy_core, "send_event", _send_event)
    return events


def _payloads(events, name):
    return [payload for event, payload in events if event == name]


async def _services(tmp_path: Path, monkeypatch):
    monkeypatch.setattr(deps, "WATCHER_ENABLED", False)
    res = await deps.build_services(str(tmp_path / "events.sqlite"))
    assert res.ok, res.error
    return res.data


async def _close(services):
    worker = services.get("rating_tags_sync")
    if worker is not None:
        try:
            worker.stop()
        except Exception:
            pass
    await services["db"].aclose()


async def _scan(index, root: Path):
    res = await index.scan_directory(
        directory=str(root), recursive=False, incremental=True, source="output", root_id=None
    )
    assert res.ok, res.error
    return res.data


async def _asset_id(index, path: Path) -> int:
    res = await index.db.aquery("SELECT id FROM assets WHERE filename = ?", (path.name,))
    assert res.ok and res.data, res.error
    return int(res.data[0]["id"])


def test_path_state_distinguishes_missing_from_unreadable(tmp_path: Path, monkeypatch):
    present = tmp_path / "a.png"
    present.write_bytes(b"x")
    assert scan_prune._path_state(str(present)) is True
    assert scan_prune._path_state(str(tmp_path / "gone.png")) is False

    def _boom(_path):
        raise PermissionError("share offline")

    monkeypatch.setattr(scan_prune.os, "stat", _boom)
    assert scan_prune._path_state(str(present)) is None
    assert scan_prune._find_missing_filepaths([(1, str(present))]) == []


@pytest.mark.asyncio
async def test_scan_prune_announces_removed_ids(tmp_path: Path, monkeypatch, emitted):
    root = tmp_path / "root"
    root.mkdir()
    keep, gone = root / "keep.png", root / "gone.png"
    keep.write_bytes(b"x")
    gone.write_bytes(b"y")
    services = await _services(tmp_path, monkeypatch)
    try:
        index = services["index"]
        await _scan(index, root)
        gone_id = await _asset_id(index, gone)
        gone.unlink()
        emitted.clear()

        stats = await _scan(index, root)

        assert stats["pruned"] == 1
        removed = _payloads(emitted, "mjr-assets-removed")
        assert removed and removed[0]["ids"] == [gone_id]
        assert removed[0]["reason"] == "scan_prune"
        complete = _payloads(emitted, "mjr-scan-complete")[-1]
        assert complete["origin"] == "directory_scan"
        assert complete["needs_refresh"] is True
        assert "added_ids" not in complete
    finally:
        await _close(services)


@pytest.mark.asyncio
async def test_unreadable_scan_root_is_never_pruned(tmp_path: Path, monkeypatch, emitted):
    root = tmp_path / "root"
    root.mkdir()
    (root / "a.png").write_bytes(b"x")
    services = await _services(tmp_path, monkeypatch)
    try:
        index = services["index"]
        await _scan(index, root)
        monkeypatch.setattr(scan_prune, "_root_is_readable", lambda _d: False)
        monkeypatch.setattr(scan_prune, "_path_state", lambda _p: False)

        res = await scan_prune.prune_missing_assets_after_scan(
            index._scanner, directory=str(root), recursive=False, source="output", root_id=None
        )

        assert res.ok and res.data == 0
        assert not _payloads(emitted, "mjr-assets-removed")
        count = await index.db.aquery("SELECT COUNT(*) AS n FROM assets", ())
        assert int(count.data[0]["n"]) == 1
    finally:
        await _close(services)


@pytest.mark.asyncio
async def test_watcher_delete_and_move_emit_live_events(tmp_path: Path, monkeypatch, emitted):
    root = tmp_path / "root"
    root.mkdir()
    deleted, moved = root / "deleted.png", root / "moved.png"
    deleted.write_bytes(b"x")
    moved.write_bytes(b"y")
    services = await _services(tmp_path, monkeypatch)
    try:
        index = services["index"]
        await _scan(index, root)
        deleted_id = await _asset_id(index, deleted)
        moved_id = await _asset_id(index, moved)
        emitted.clear()

        deleted.unlink()
        assert (await index.remove_file(str(deleted))).ok
        target = root / "renamed.png"
        os.replace(moved, target)
        rn = await index.rename_file(str(moved), str(target))
        assert rn.ok, (rn.code, rn.error)

        removed = _payloads(emitted, "mjr-assets-removed")
        assert removed and removed[0]["ids"] == [deleted_id]
        assert removed[0]["reason"] == "file_deleted"
        updated = _payloads(emitted, "mjr-asset-updated")
        assert any(int(p.get("id")) == moved_id and p.get("filename") == "renamed.png" for p in updated)
    finally:
        await _close(services)


_OLD_BUGGY_TRIGGERS = """
DROP TRIGGER IF EXISTS assets_fts_delete;
DROP TRIGGER IF EXISTS assets_fts_update;
CREATE TRIGGER assets_fts_delete AFTER DELETE ON assets BEGIN
    DELETE FROM assets_fts WHERE rowid = old.id;
END;
CREATE TRIGGER assets_fts_update AFTER UPDATE ON assets BEGIN
    UPDATE assets_fts SET filename = new.filename, subfolder = new.subfolder
    WHERE rowid = new.id;
END;
"""


async def _fts_ids(db, term: str) -> set[int]:
    res = await db.aquery("SELECT rowid AS id FROM assets_fts WHERE assets_fts MATCH ?", (term,))
    assert res.ok, res.error
    return {int(r["id"]) for r in res.data or []}


@pytest.mark.asyncio
async def test_rename_keeps_full_text_index_consistent(tmp_path: Path, monkeypatch, emitted):
    root = tmp_path / "root"
    root.mkdir()
    src = root / "oldname.png"
    src.write_bytes(b"x")
    services = await _services(tmp_path, monkeypatch)
    try:
        index = services["index"]
        await _scan(index, root)
        asset_id = await _asset_id(index, src)
        target = root / "freshname.png"
        os.replace(src, target)

        res = await index.rename_file(str(src), str(target))

        assert res.ok, res.error
        assert asset_id in await _fts_ids(index.db, "freshname")
        assert asset_id not in await _fts_ids(index.db, "oldname")
    finally:
        await _close(services)


@pytest.mark.asyncio
async def test_startup_repairs_legacy_external_content_fts_triggers(tmp_path: Path, monkeypatch, emitted):
    from mjr_am_backend.adapters.db.schema import ensure_indexes_and_triggers

    root = tmp_path / "root"
    root.mkdir()
    src = root / "legacy.png"
    src.write_bytes(b"x")
    services = await _services(tmp_path, monkeypatch)
    try:
        index = services["index"]
        await _scan(index, root)
        assert (await index.db.aexecutescript(_OLD_BUGGY_TRIGGERS)).ok

        assert (await ensure_indexes_and_triggers(index.db)).ok

        trig = await index.db.aquery(
            "SELECT sql FROM sqlite_master WHERE type='trigger' AND name='assets_fts_update'", ()
        )
        assert "'delete'" in str(trig.data[0]["sql"]).lower()
        target = root / "migrated.png"
        os.replace(src, target)
        res = await index.rename_file(str(src), str(target))
        assert res.ok, res.error
        assert await _fts_ids(index.db, "migrated")
    finally:
        await _close(services)
