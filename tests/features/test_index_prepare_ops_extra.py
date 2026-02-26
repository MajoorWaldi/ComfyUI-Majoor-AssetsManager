"""
Additional coverage tests for index_prepare_ops.py.
Targets: lines 26-29, 43-97, 110-127, 138-147, 157-166, 178.
"""
from __future__ import annotations

from pathlib import Path
from types import SimpleNamespace

import pytest

from mjr_am_backend.features.index import index_prepare_ops as ipo
from mjr_am_backend.shared import Result


# ─── prepare_metadata_for_entry ─────────────────────────────────────────────

@pytest.mark.asyncio
async def test_prepare_metadata_for_entry_non_fast_ok():
    async def _get_metadata(filepath, scan_id):
        return Result.Ok({"prompt": "test"})

    scanner = SimpleNamespace(
        metadata=SimpleNamespace(get_metadata=_get_metadata),
        _current_scan_id=None,
    )
    res, cache_store = await ipo.prepare_metadata_for_entry(scanner, filepath="x.png", fast=False)
    assert res.ok is True
    assert cache_store is True


@pytest.mark.asyncio
async def test_prepare_metadata_for_entry_non_fast_error(monkeypatch):
    async def _get_metadata(filepath, scan_id):
        return Result.Err("FAIL", "extraction failed")

    def _error_payload(result, filepath):
        return Result.Ok({"error": "extraction failed"})

    scanner = SimpleNamespace(
        metadata=SimpleNamespace(get_metadata=_get_metadata),
        _current_scan_id=None,
    )
    monkeypatch.setattr(ipo.MetadataHelpers, "metadata_error_payload", _error_payload)

    res, cache_store = await ipo.prepare_metadata_for_entry(scanner, filepath="x.png", fast=False)
    assert cache_store is False


# ─── prepare_index_entry_context ────────────────────────────────────────────

@pytest.mark.asyncio
async def test_prepare_index_entry_context_success(tmp_path):
    p = tmp_path / "img.png"
    p.write_text("x")

    class _FakeStat:
        st_mtime_ns = 1_000_000_000
        st_mtime = 1.0
        st_size = 1

    async def _stat_with_retry(*, file_path):
        return True, _FakeStat()

    async def _get_journal(*, filepath, existing_state, incremental):
        return "hash_j"

    scanner = SimpleNamespace(
        _stat_with_retry=_stat_with_retry,
        _get_journal_state_hash_for_index_file=_get_journal,
    )
    ctx, err = await ipo.prepare_index_entry_context(
        scanner, file_path=p, existing_state=None, incremental=True
    )
    assert ctx is not None and err is None
    assert "filepath" in ctx and "state_hash" in ctx


# ─── should_skip_by_journal_state ───────────────────────────────────────────

@pytest.mark.asyncio
async def test_should_skip_non_incremental():
    scanner = SimpleNamespace()
    ctx = {"journal_state_hash": "h", "state_hash": "h", "existing_id": 1}
    assert await ipo.should_skip_by_journal_state(scanner, prepare_ctx=ctx, incremental=False, fast=True) is False


@pytest.mark.asyncio
async def test_should_skip_no_journal_hash():
    scanner = SimpleNamespace()
    ctx = {"journal_state_hash": None, "state_hash": "h", "existing_id": 1}
    assert await ipo.should_skip_by_journal_state(scanner, prepare_ctx=ctx, incremental=True, fast=True) is False


@pytest.mark.asyncio
async def test_should_skip_hash_mismatch():
    scanner = SimpleNamespace()
    ctx = {"journal_state_hash": "a", "state_hash": "b", "existing_id": 1}
    assert await ipo.should_skip_by_journal_state(scanner, prepare_ctx=ctx, incremental=True, fast=True) is False


@pytest.mark.asyncio
async def test_should_skip_no_existing_id():
    scanner = SimpleNamespace()
    ctx = {"journal_state_hash": "h", "state_hash": "h", "existing_id": 0}
    assert await ipo.should_skip_by_journal_state(scanner, prepare_ctx=ctx, incremental=True, fast=False) is False


# ─── refresh_entry_from_cached_metadata ─────────────────────────────────────

@pytest.mark.asyncio
async def test_refresh_entry_from_cached_metadata_no_cache(monkeypatch):
    async def _cached(db, fp, state_hash):
        return None

    monkeypatch.setattr(ipo.MetadataHelpers, "retrieve_cached_metadata", _cached)
    scanner = SimpleNamespace(db=object())
    prepare_ctx = {"filepath": "x.png", "state_hash": "h", "existing_id": 1, "mtime": 1, "size": 2}
    out = await ipo.refresh_entry_from_cached_metadata(
        scanner, prepare_ctx=prepare_ctx, file_path=Path("x.png"), fast=False
    )
    assert out is None


@pytest.mark.asyncio
async def test_refresh_entry_from_cached_metadata_error_result(monkeypatch):
    async def _cached(db, fp, state_hash):
        return Result.Err("MISS", "not found")

    monkeypatch.setattr(ipo.MetadataHelpers, "retrieve_cached_metadata", _cached)
    scanner = SimpleNamespace(db=object())
    prepare_ctx = {"filepath": "x.png", "state_hash": "h", "existing_id": 1, "mtime": 1, "size": 2}
    out = await ipo.refresh_entry_from_cached_metadata(
        scanner, prepare_ctx=prepare_ctx, file_path=Path("x.png"), fast=False
    )
    assert out is None


# ─── maybe_skip_prepare_for_incremental ─────────────────────────────────────

@pytest.mark.asyncio
async def test_maybe_skip_journal_path(monkeypatch):
    async def _should_skip(scanner, *, prepare_ctx, incremental, fast):
        return True

    monkeypatch.setattr(ipo, "should_skip_by_journal_state", _should_skip)

    scanner = SimpleNamespace()
    ctx = {"journal_state_hash": "h", "state_hash": "h", "existing_id": 1, "mtime": 1, "size": 2, "existing_mtime": 1}
    result = await ipo.maybe_skip_prepare_for_incremental(
        scanner, prepare_ctx=ctx, incremental=True, fast=False, file_path=Path("x.png")
    )
    assert result is not None and result.data == {"action": "skipped_journal"}


@pytest.mark.asyncio
async def test_maybe_skip_incremental_unchanged_rich_metadata(monkeypatch):
    async def _should_skip(scanner, *, prepare_ctx, incremental, fast):
        return False

    async def _refresh_cached(scanner, *, prepare_ctx, file_path, fast):
        return None

    async def _has_rich(*, asset_id):
        return True

    monkeypatch.setattr(ipo, "should_skip_by_journal_state", _should_skip)
    monkeypatch.setattr(ipo, "refresh_entry_from_cached_metadata", _refresh_cached)

    scanner = SimpleNamespace(_asset_has_rich_metadata=_has_rich)
    # mtime==existing_mtime → incremental_unchanged = True
    ctx = {"state_hash": "h", "journal_state_hash": "diff", "existing_id": 1, "mtime": 5, "size": 10, "existing_mtime": 5}
    result = await ipo.maybe_skip_prepare_for_incremental(
        scanner, prepare_ctx=ctx, incremental=True, fast=False, file_path=Path("x.png")
    )
    assert result is not None and result.data == {"action": "skipped"}


@pytest.mark.asyncio
async def test_maybe_skip_not_incremental_unchanged_returns_none(monkeypatch):
    async def _should_skip(scanner, *, prepare_ctx, incremental, fast):
        return False

    monkeypatch.setattr(ipo, "should_skip_by_journal_state", _should_skip)
    scanner = SimpleNamespace()
    # different mtime → not unchanged
    ctx = {"state_hash": "h", "journal_state_hash": None, "existing_id": 1, "mtime": 5, "size": 10, "existing_mtime": 3}
    result = await ipo.maybe_skip_prepare_for_incremental(
        scanner, prepare_ctx=ctx, incremental=True, fast=False, file_path=Path("x.png")
    )
    assert result is None


# ─── prepare_index_entry (full flow) ────────────────────────────────────────

@pytest.mark.asyncio
async def test_prepare_index_entry_stat_failure(monkeypatch):
    async def _ctx(scanner, *, file_path, existing_state, incremental):
        return None, "stat failed"

    monkeypatch.setattr(ipo, "prepare_index_entry_context", _ctx)
    scanner = SimpleNamespace()
    result = await ipo.prepare_index_entry(
        scanner, file_path=Path("x.png"), base_dir="C:/", incremental=False
    )
    assert not result.ok and "STAT_FAILED" in result.code


@pytest.mark.asyncio
async def test_prepare_index_entry_skip_path(monkeypatch):
    async def _ctx(scanner, *, file_path, existing_state, incremental):
        return {"state_hash": "h", "journal_state_hash": None, "existing_id": 1,
                "existing_mtime": 5, "mtime": 5, "size": 10, "filepath": "x.png"}, None

    async def _skip(scanner, *, prepare_ctx, incremental, fast, file_path):
        return Result.Ok({"action": "skipped"})

    monkeypatch.setattr(ipo, "prepare_index_entry_context", _ctx)
    monkeypatch.setattr(ipo, "maybe_skip_prepare_for_incremental", _skip)
    scanner = SimpleNamespace()
    result = await ipo.prepare_index_entry(
        scanner, file_path=Path("x.png"), base_dir="C:/", incremental=True
    )
    assert result.ok and result.data["action"] == "skipped"
