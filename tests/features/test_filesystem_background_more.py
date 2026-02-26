from collections import OrderedDict
from pathlib import Path
from types import SimpleNamespace

import pytest

from mjr_am_backend.routes.handlers import filesystem as fs
from mjr_am_backend.shared import Result


@pytest.mark.asyncio
async def test_get_background_scan_lock_and_pruning(monkeypatch):
    monkeypatch.setattr(fs, "_BACKGROUND_SCAN_LOCKS", {})
    monkeypatch.setattr(fs, "_BACKGROUND_SCAN_LOCKS_ORDER", OrderedDict())
    monkeypatch.setattr(fs, "_BACKGROUND_SCAN_LOCKS_MAX", 1)

    a = await fs._get_background_scan_lock("a")
    b = await fs._get_background_scan_lock("b")
    assert a is not None and b is not None
    assert len(fs._BACKGROUND_SCAN_LOCKS) <= 2


@pytest.mark.asyncio
async def test_kickoff_background_scan_skip_and_enqueue(monkeypatch):
    monkeypatch.setattr(fs, "BG_SCAN_ON_LIST", True)
    monkeypatch.setattr(fs, "is_db_maintenance_active", lambda: False)
    monkeypatch.setattr(fs, "normalize_scan_directory", lambda d: d)
    monkeypatch.setattr(fs, "should_skip_background_scan", lambda *args, **kwargs: False)
    monkeypatch.setattr(fs, "_should_skip_scan_enqueue", lambda *args, **kwargs: False)
    monkeypatch.setattr(fs, "_ensure_worker", lambda: None)
    monkeypatch.setattr(fs, "_SCAN_PENDING", OrderedDict())
    monkeypatch.setattr(fs, "_SCAN_PENDING_MAX", 10)
    monkeypatch.setattr(fs, "_BACKGROUND_SCAN_LAST", OrderedDict())

    await fs._kickoff_background_scan("C:/x", source="output")
    assert fs._SCAN_PENDING

    monkeypatch.setattr(fs, "is_db_maintenance_active", lambda: True)
    before = len(fs._SCAN_PENDING)
    await fs._kickoff_background_scan("C:/y", source="output")
    assert len(fs._SCAN_PENDING) == before


@pytest.mark.asyncio
async def test_worker_loop_single_iteration_and_helpers(monkeypatch):
    fs._WORKER_STOP.set()
    await fs._worker_loop()

    called = {"run": 0}

    async def _scan_directory(*args, **kwargs):
        called["run"] += 1
        return Result.Ok({})

    svc = {"index": SimpleNamespace(scan_directory=_scan_directory)}
    await fs._run_scan_directory_task(svc, {"directory": "d", "recursive": True, "incremental": True, "source": "output", "root_id": None, "fast": True, "background_metadata": True})
    assert called["run"] == 1

    async def _scan_type_error(*args, **kwargs):
        raise TypeError("bad sig")

    svc2 = {"index": SimpleNamespace(scan_directory=_scan_type_error)}
    with pytest.raises(TypeError):
        await fs._run_scan_directory_task(svc2, {"directory": "d", "recursive": True, "incremental": True, "source": "output", "root_id": None})


@pytest.mark.asyncio
async def test_cache_get_or_build_and_list_paths(monkeypatch, tmp_path: Path):
    base = tmp_path
    d = tmp_path / "sub"
    d.mkdir()
    (d / "a.png").write_bytes(b"x")

    monkeypatch.setattr(fs, "_FS_LIST_CACHE", OrderedDict())
    monkeypatch.setattr(fs, "FS_LIST_CACHE_MAX", 10)
    monkeypatch.setattr(fs, "_filesystem_dir_cache_state", lambda b, t: Result.Ok({"dir_mtime_ns": 1, "watch_token": 2}))
    monkeypatch.setattr(fs, "_collect_filesystem_entries", lambda *args, **kwargs: [{"filename": "a.png", "filepath": str(d / "a.png"), "kind": "image", "mtime": 1, "ext": ".png"}])
    r1 = await fs._fs_cache_get_or_build(base, d, "input", None)
    assert r1.ok and r1.data["entries"]
    r2 = await fs._fs_cache_get_or_build(base, d, "input", None)
    assert r2.ok

    monkeypatch.setattr(fs, "_resolve_filesystem_listing_target", lambda *args, **kwargs: Result.Ok({"base": base, "target_dir_resolved": d}))

    async def _dispatch(*args, **kwargs):
        return Result.Ok({"assets": [], "total": 0})

    monkeypatch.setattr(fs, "_dispatch_filesystem_listing_path", _dispatch)
    out = await fs._list_filesystem_assets(base, "sub", "*", 10, 0, "input")
    assert out.ok
