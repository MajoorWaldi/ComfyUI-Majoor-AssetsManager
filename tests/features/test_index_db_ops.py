"""
Coverage tests for index_db_ops.py.
Targets lines: 29-68, 80-96, 112-164.
"""
from __future__ import annotations

from pathlib import Path
from types import SimpleNamespace

import pytest

from mjr_am_backend.features.index import index_db_ops as dbo
from mjr_am_backend.shared import Result


# ─── helpers ────────────────────────────────────────────────────────────────

class _DB:
    def __init__(self, insert_ok=True, update_ok=True, asset_id=1):
        self._insert_ok = insert_ok
        self._update_ok = update_ok
        self._asset_id = asset_id
        self._lock_called = False

    async def aexecute(self, sql, params):
        if "INSERT" in sql:
            if not self._insert_ok:
                return Result.Err("INSERT_FAILED", "db error")
            return Result.Ok(self._asset_id)
        if "UPDATE" in sql:
            if not self._update_ok:
                return Result.Err("UPDATE_FAILED", "db error")
            return Result.Ok(1)
        return Result.Ok(None)

    class _Lock:
        def __init__(self, asset_id):
            self.asset_id = asset_id

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

    def lock_for_asset(self, asset_id):
        return self._Lock(asset_id)


def _make_metadata_result(ok=True):
    if ok:
        return Result.Ok({"width": 512, "height": 768, "prompt": "test"})
    return Result.Err("META_ERR", "fail")


# ─── add_asset ───────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_add_asset_success(monkeypatch):
    async def _write_row(db, asset_id, metadata_result, *, filepath):
        return Result.Ok(None)

    monkeypatch.setattr(dbo.MetadataHelpers, "write_asset_metadata_row", _write_row)

    db = _DB(insert_ok=True, asset_id=42)
    scanner = SimpleNamespace(db=db, _log_scan_event=lambda *a, **kw: None)

    result = await dbo.add_asset(
        scanner,
        filename="img.png",
        subfolder="",
        filepath="C:/x/img.png",
        kind="image",
        mtime=1000,
        size=4096,
        file_path=Path("C:/x/img.png"),
        metadata_result=_make_metadata_result(),
        write_metadata=True,
    )
    assert result.ok
    assert result.data["action"] == "added"
    assert result.data["asset_id"] == 42


@pytest.mark.asyncio
async def test_add_asset_insert_failure():
    db = _DB(insert_ok=False)
    scanner = SimpleNamespace(db=db)

    result = await dbo.add_asset(
        scanner,
        filename="img.png",
        subfolder="",
        filepath="C:/img.png",
        kind="image",
        mtime=1000,
        size=512,
        file_path=Path("C:/img.png"),
        metadata_result=_make_metadata_result(),
    )
    assert not result.ok and "INSERT_FAILED" in result.code


@pytest.mark.asyncio
async def test_add_asset_no_asset_id():
    db = _DB(insert_ok=True, asset_id=None)
    scanner = SimpleNamespace(db=db)

    result = await dbo.add_asset(
        scanner,
        filename="img.png",
        subfolder="",
        filepath="C:/img.png",
        kind="image",
        mtime=1000,
        size=512,
        file_path=Path("C:/img.png"),
        metadata_result=_make_metadata_result(),
    )
    assert not result.ok


# ─── write_asset_metadata_if_needed ─────────────────────────────────────────

@pytest.mark.asyncio
async def test_write_asset_metadata_if_needed_skip_lock():
    scanner = SimpleNamespace()
    # skip_lock=True → early return
    await dbo.write_asset_metadata_if_needed(
        scanner, asset_id=1, metadata_result=_make_metadata_result(),
        filepath="x.png", write_metadata=True, skip_lock=True
    )


@pytest.mark.asyncio
async def test_write_asset_metadata_if_needed_no_write():
    scanner = SimpleNamespace()
    # write_metadata=False → early return
    await dbo.write_asset_metadata_if_needed(
        scanner, asset_id=1, metadata_result=_make_metadata_result(),
        filepath="x.png", write_metadata=False, skip_lock=False
    )


@pytest.mark.asyncio
async def test_write_asset_metadata_if_needed_write_fails(monkeypatch):
    async def _write_row(db, asset_id, metadata_result, *, filepath):
        return Result.Err("FAIL", "write error")

    monkeypatch.setattr(dbo.MetadataHelpers, "write_asset_metadata_row", _write_row)
    log_calls = []
    scanner = SimpleNamespace(
        db=object(),
        _log_scan_event=lambda level, msg, **kw: log_calls.append(msg),
    )
    await dbo.write_asset_metadata_if_needed(
        scanner, asset_id=5, metadata_result=_make_metadata_result(),
        filepath="x.png", write_metadata=True, skip_lock=False
    )
    assert any("Failed" in c for c in log_calls)


# ─── update_asset ────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_update_asset_success_with_lock(monkeypatch):
    async def _write_row(db, asset_id, metadata_result, *, filepath):
        return Result.Ok(None)

    monkeypatch.setattr(dbo.MetadataHelpers, "write_asset_metadata_row", _write_row)

    db = _DB(update_ok=True)
    scanner = SimpleNamespace(db=db, _log_scan_event=lambda *a, **kw: None)

    result = await dbo.update_asset(
        scanner,
        asset_id=1,
        file_path=Path("C:/x.png"),
        mtime=2000,
        size=1024,
        metadata_result=_make_metadata_result(),
        write_metadata=True,
        skip_lock=False,
    )
    assert result.ok and result.data["action"] == "updated"


@pytest.mark.asyncio
async def test_update_asset_skip_lock(monkeypatch):
    async def _write_row(db, asset_id, metadata_result, *, filepath):
        return Result.Ok(None)

    monkeypatch.setattr(dbo.MetadataHelpers, "write_asset_metadata_row", _write_row)

    db = _DB(update_ok=True)
    scanner = SimpleNamespace(db=db)

    result = await dbo.update_asset(
        scanner,
        asset_id=2,
        file_path=Path("C:/y.png"),
        mtime=3000,
        size=2048,
        metadata_result=_make_metadata_result(),
        write_metadata=True,
        skip_lock=True,
    )
    assert result.ok


@pytest.mark.asyncio
async def test_update_asset_db_error():
    db = _DB(update_ok=False)
    scanner = SimpleNamespace(db=db)

    result = await dbo.update_asset(
        scanner,
        asset_id=3,
        file_path=Path("C:/z.png"),
        mtime=4000,
        size=512,
        metadata_result=_make_metadata_result(),
        write_metadata=False,
        skip_lock=True,
    )
    assert not result.ok


@pytest.mark.asyncio
async def test_update_asset_metadata_write_fails(monkeypatch):
    async def _write_row(db, asset_id, metadata_result, *, filepath):
        return Result.Err("FAIL", "write error")

    monkeypatch.setattr(dbo.MetadataHelpers, "write_asset_metadata_row", _write_row)

    log_calls = []
    db = _DB(update_ok=True)
    scanner = SimpleNamespace(db=db, _log_scan_event=lambda level, msg, **kw: log_calls.append(msg))

    result = await dbo.update_asset(
        scanner,
        asset_id=4,
        file_path=Path("C:/w.png"),
        mtime=5000,
        size=256,
        metadata_result=_make_metadata_result(),
        write_metadata=True,
        skip_lock=False,
    )
    assert result.ok
    assert any("Failed" in c for c in log_calls)
