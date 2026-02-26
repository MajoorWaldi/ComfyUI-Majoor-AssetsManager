"""
Additional coverage tests for index_batching.py helper functions.
Targets uncovered lines: 42-47, 50-67, 104-134, 161-271, 287-436, 448, 459
"""
from __future__ import annotations

import asyncio
import time
from pathlib import Path
from types import SimpleNamespace

import pytest

from mjr_am_backend.features.index import index_batching as ib
from mjr_am_backend.shared import Result


# ─── helpers ────────────────────────────────────────────────────────────────

class _FakeDB:
    def __init__(self, rows=None, ok=True):
        self._rows = rows or []
        self._ok = ok

    async def aquery_in(self, sql, col, values):
        if not self._ok:
            return Result.Err("DB_ERROR", "fail")
        return Result.Ok(self._rows)

    async def aquery(self, sql, params):
        return Result.Ok(self._rows)


# ─── cached_refresh_payload ─────────────────────────────────────────────────

def test_cached_refresh_payload_no_existing_id():
    payload, miss = ib.cached_refresh_payload(
        existing_id=0, existing_mtime=1, mtime=1,
        cache_map={}, filepath="f.png", state_hash="h"
    )
    assert payload is None and miss is False


def test_cached_refresh_payload_mtime_mismatch():
    # mtime != existing_mtime → `not (existing_id and existing_mtime==mtime)` is True → early (None, False)
    payload, miss = ib.cached_refresh_payload(
        existing_id=1, existing_mtime=2, mtime=1,
        cache_map={}, filepath="f.png", state_hash="h"
    )
    assert payload is None and miss is False


def test_cached_refresh_payload_cache_hit():
    cache_map = {("f.png", "h"): '{"k":"v"}'}
    payload, miss = ib.cached_refresh_payload(
        existing_id=1, existing_mtime=5, mtime=5,
        cache_map=cache_map, filepath="f.png", state_hash="h"
    )
    assert payload is not None and miss is False


def test_cached_refresh_payload_cache_miss():
    # same mtime, no cache entry → miss=True
    payload, miss = ib.cached_refresh_payload(
        existing_id=1, existing_mtime=5, mtime=5,
        cache_map={}, filepath="f.png", state_hash="h"
    )
    assert payload is None and miss is True


# ─── metadata_queue_item ────────────────────────────────────────────────────

def test_metadata_queue_item_returns_tuple():
    fp = Path("C:/x.png")
    item = ib.metadata_queue_item(fp, "C:/x.png", 1000000, 1000, 512, "hash1", 7)
    assert item[0] == fp and item[6] == 7


def test_metadata_queue_item_none_existing_id():
    fp = Path("C:/x.png")
    item = ib.metadata_queue_item(fp, "C:/x.png", 1000000, 1000, 512, "hash1", 0)
    assert item[6] is None


# ─── journal_map_for_batch ──────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_journal_map_for_batch_non_incremental():
    scanner = SimpleNamespace()
    result = await ib.journal_map_for_batch(scanner, filepaths=["a"], incremental=False)
    assert result == {}


@pytest.mark.asyncio
async def test_journal_map_for_batch_empty_filepaths():
    scanner = SimpleNamespace()
    result = await ib.journal_map_for_batch(scanner, filepaths=[], incremental=True)
    assert result == {}


@pytest.mark.asyncio
async def test_journal_map_for_batch_incremental_calls_scanner():
    async def _get_journal(*, filepaths):
        return {filepaths[0]: "h1"}

    scanner = SimpleNamespace(_get_journal_entries=_get_journal)
    result = await ib.journal_map_for_batch(scanner, filepaths=["a"], incremental=True)
    assert result == {"a": "h1"}


# ─── existing_map_for_batch ─────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_existing_map_for_batch_empty():
    scanner = SimpleNamespace(db=_FakeDB())
    result = await ib.existing_map_for_batch(scanner, filepaths=[])
    assert result == {}


@pytest.mark.asyncio
async def test_existing_map_for_batch_db_error():
    scanner = SimpleNamespace(db=_FakeDB(ok=False))
    result = await ib.existing_map_for_batch(scanner, filepaths=["a"])
    assert result == {}


@pytest.mark.asyncio
async def test_existing_map_for_batch_with_rows():
    rows = [{"filepath": "C:/x.png", "id": 1, "mtime": 100}]
    scanner = SimpleNamespace(db=_FakeDB(rows=rows))
    result = await ib.existing_map_for_batch(scanner, filepaths=["C:/x.png"])
    assert "C:/x.png" in result


# ─── finalize_index_paths ───────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_finalize_index_paths_with_changes(monkeypatch):
    calls = {}

    async def _set_meta(db, key, value):
        calls["meta"] = (key, value)

    monkeypatch.setattr(ib.MetadataHelpers, "set_metadata_value", _set_meta)

    log_calls = []
    scanner = SimpleNamespace(
        db=_FakeDB(),
        _log_scan_event=lambda level, msg, **kw: log_calls.append((level, msg)),
    )
    stats = {"scanned": 5, "added": 2, "updated": 0, "skipped": 3, "errors": 0, "end_time": None}
    await ib.finalize_index_paths(scanner, scan_start=time.perf_counter() - 0.1, stats=stats)
    assert "meta" in calls


@pytest.mark.asyncio
async def test_finalize_index_paths_no_changes(monkeypatch):
    async def _set_meta(db, key, value):
        pass

    monkeypatch.setattr(ib.MetadataHelpers, "set_metadata_value", _set_meta)

    scanner = SimpleNamespace(
        db=_FakeDB(),
        _log_scan_event=lambda level, msg, **kw: None,
    )
    stats = {"scanned": 0, "added": 0, "updated": 0, "skipped": 0, "errors": 0, "end_time": None}
    await ib.finalize_index_paths(scanner, scan_start=time.perf_counter(), stats=stats)


# ─── prefetch_metadata_cache_rows ───────────────────────────────────────────

@pytest.mark.asyncio
async def test_prefetch_metadata_cache_rows_empty_result():
    scanner = SimpleNamespace(db=_FakeDB(ok=False))
    cache_map = {}
    await ib.prefetch_metadata_cache_rows(scanner, filepaths=["a"], cache_map=cache_map)
    assert cache_map == {}


@pytest.mark.asyncio
async def test_prefetch_metadata_cache_rows_with_data():
    rows = [{"filepath": "a.png", "state_hash": "h1", "metadata_raw": '{"k":"v"}'}]
    scanner = SimpleNamespace(db=_FakeDB(rows=rows))
    cache_map = {}
    await ib.prefetch_metadata_cache_rows(scanner, filepaths=["a.png"], cache_map=cache_map)
    assert ("a.png", "h1") in cache_map


# ─── prefetch_rich_metadata_rows ────────────────────────────────────────────

@pytest.mark.asyncio
async def test_prefetch_rich_metadata_rows_empty():
    scanner = SimpleNamespace(db=_FakeDB(ok=False))
    s = set()
    await ib.prefetch_rich_metadata_rows(scanner, asset_ids=[1], has_rich_meta_set=s)
    assert not s


@pytest.mark.asyncio
async def test_prefetch_rich_metadata_rows_with_rich():
    rows = [{"asset_id": 5, "metadata_quality": "full", "metadata_raw": '{"a":1}'}]
    scanner = SimpleNamespace(db=_FakeDB(rows=rows))
    s = set()
    await ib.prefetch_rich_metadata_rows(scanner, asset_ids=[5], has_rich_meta_set=s)
    assert 5 in s


@pytest.mark.asyncio
async def test_prefetch_rich_metadata_rows_not_rich():
    rows = [{"asset_id": 3, "metadata_quality": "none", "metadata_raw": "{}"}]
    scanner = SimpleNamespace(db=_FakeDB(rows=rows))
    s = set()
    await ib.prefetch_rich_metadata_rows(scanner, asset_ids=[3], has_rich_meta_set=s)
    assert 3 not in s


# ─── prefetch_batch_cache_and_rich_meta ─────────────────────────────────────

@pytest.mark.asyncio
async def test_prefetch_batch_cache_and_rich_meta_empty():
    scanner = SimpleNamespace(db=_FakeDB())
    cache_map, rich_set = await ib.prefetch_batch_cache_and_rich_meta(
        scanner, filepaths=[], existing_map={}
    )
    assert cache_map == {} and rich_set == set()


# ─── resolve_existing_state_for_batch ───────────────────────────────────────

@pytest.mark.asyncio
async def test_resolve_existing_state_incremental_with_journal():
    scanner = SimpleNamespace(db=_FakeDB())
    existing_map = {"a.png": {"id": 1, "mtime": 100}}
    journal_map = {"a.png": "hash_j"}
    state = await ib.resolve_existing_state_for_batch(
        scanner, fp="a.png", incremental=True,
        journal_map=journal_map, existing_map=existing_map
    )
    assert state is not None
    assert state.get("journal_state_hash") == "hash_j"


@pytest.mark.asyncio
async def test_resolve_existing_state_non_incremental():
    scanner = SimpleNamespace(db=_FakeDB())
    existing_map = {"a.png": {"id": 1}}
    state = await ib.resolve_existing_state_for_batch(
        scanner, fp="a.png", incremental=False,
        journal_map={}, existing_map=existing_map
    )
    assert state == {"id": 1}


@pytest.mark.asyncio
async def test_resolve_existing_state_not_found():
    scanner = SimpleNamespace(db=_FakeDB())
    state = await ib.resolve_existing_state_for_batch(
        scanner, fp="missing.png", incremental=False,
        journal_map={}, existing_map={}
    )
    assert state is None


# ─── append_batch_metadata_entries ──────────────────────────────────────────

@pytest.mark.asyncio
async def test_append_batch_metadata_entries_empty():
    scanner = SimpleNamespace()
    prepared = []
    await ib.append_batch_metadata_entries(
        scanner, prepared=prepared, needs_metadata=[], base_dir="C:/", fast=False
    )
    assert prepared == []


@pytest.mark.asyncio
async def test_append_batch_metadata_entries_missing_result(tmp_path, monkeypatch):
    p = tmp_path / "a.png"
    p.write_text("x")

    async def _get_batch(paths, scan_id):
        return {}  # no results

    scanner = SimpleNamespace(
        metadata=SimpleNamespace(get_metadata_batch=_get_batch),
        _current_scan_id=None,
    )
    prepared = []
    item = (p, str(p), 1000000, 1000, 10, "h1", None)
    await ib.append_batch_metadata_entries(
        scanner, prepared=prepared, needs_metadata=[item], base_dir=str(tmp_path), fast=False
    )
    assert len(prepared) == 1
    assert prepared[0]["action"] == "added"


@pytest.mark.asyncio
async def test_append_batch_metadata_entries_existing_id(tmp_path):
    p = tmp_path / "b.png"
    p.write_text("x")

    async def _get_batch(paths, scan_id):
        return {str(p): Result.Ok({"prompt": "x"})}

    scanner = SimpleNamespace(
        metadata=SimpleNamespace(get_metadata_batch=_get_batch),
        _current_scan_id=None,
    )
    prepared = []
    item = (p, str(p), 1000000, 1000, 10, "h1", 5)  # existing_id=5
    await ib.append_batch_metadata_entries(
        scanner, prepared=prepared, needs_metadata=[item], base_dir=str(tmp_path), fast=False
    )
    assert len(prepared) == 1
    assert prepared[0]["action"] == "updated" and prepared[0]["asset_id"] == 5


# ─── prepare_single_batch_entry ─────────────────────────────────────────────

class _FakeStat:
    st_mtime_ns = 1_000_000_000
    st_mtime = 1.0
    st_size = 512


def _make_scanner(stat_ok=True, db_rows=None):
    async def _stat(*, file_path):
        if stat_ok:
            return (True, _FakeStat())
        return (False, "stat error")

    db = _FakeDB(rows=db_rows or [])
    return SimpleNamespace(db=db, _stat_with_retry=_stat)


@pytest.mark.asyncio
async def test_prepare_single_batch_entry_stat_fails(tmp_path, monkeypatch):
    async def _resolve(scanner, *, fp, incremental, journal_map, existing_map):
        return None

    monkeypatch.setattr(ib, "resolve_existing_state_for_batch", _resolve)
    scanner = _make_scanner(stat_ok=False)
    stats = {"errors": 0, "skipped": 0}
    p = tmp_path / "a.png"

    result = await ib.prepare_single_batch_entry(
        scanner,
        file_path=p,
        base_dir=str(tmp_path),
        incremental=False,
        fast=False,
        journal_map={},
        existing_map={},
        cache_map={},
        has_rich_meta_set=set(),
        stats=stats,
    )
    assert result == (None, None)
    assert stats["errors"] == 1


@pytest.mark.asyncio
async def test_prepare_single_batch_entry_skip_by_journal(tmp_path, monkeypatch):
    async def _resolve(scanner, *, fp, incremental, journal_map, existing_map):
        return {"id": 1, "mtime": 1, "journal_state_hash": "h"}

    def _skip_journal(**kwargs):
        return True

    monkeypatch.setattr(ib, "resolve_existing_state_for_batch", _resolve)
    monkeypatch.setattr(ib, "should_skip_by_journal", _skip_journal)
    scanner = _make_scanner(stat_ok=True)
    stats = {"errors": 0, "skipped": 0}
    p = tmp_path / "b.png"

    entry, meta = await ib.prepare_single_batch_entry(
        scanner,
        file_path=p,
        base_dir=str(tmp_path),
        incremental=True,
        fast=False,
        journal_map={"x": "h"},
        existing_map={},
        cache_map={},
        has_rich_meta_set=set(),
        stats=stats,
    )
    assert entry == {"action": "skipped_journal"}
    assert meta is None


@pytest.mark.asyncio
async def test_prepare_single_batch_entry_cached_refresh(tmp_path, monkeypatch):
    async def _resolve(scanner, *, fp, incremental, journal_map, existing_map):
        return {"id": 2, "mtime": 1}

    def _skip_journal(**kwargs):
        return False

    def _cached_payload(**kwargs):
        return ('{"k":"v"}', False)

    def _build_cached(**kwargs):
        return {"action": "updated", "asset_id": 2, "from_cache": True}

    monkeypatch.setattr(ib, "resolve_existing_state_for_batch", _resolve)
    monkeypatch.setattr(ib, "should_skip_by_journal", _skip_journal)
    monkeypatch.setattr(ib, "cached_refresh_payload", _cached_payload)
    monkeypatch.setattr(ib, "build_cached_refresh_entry", _build_cached)
    scanner = _make_scanner(stat_ok=True)
    stats = {"errors": 0}
    p = tmp_path / "c.png"

    entry, meta = await ib.prepare_single_batch_entry(
        scanner,
        file_path=p,
        base_dir=str(tmp_path),
        incremental=False,
        fast=False,
        journal_map={},
        existing_map={},
        cache_map={},
        has_rich_meta_set=set(),
        stats=stats,
    )
    assert entry is not None and entry.get("from_cache") is True
    assert meta is None


@pytest.mark.asyncio
async def test_prepare_single_batch_entry_cache_miss_rich(tmp_path, monkeypatch):
    async def _resolve(scanner, *, fp, incremental, journal_map, existing_map):
        return {"id": 3, "mtime": 1}

    def _skip_journal(**kwargs):
        return False

    def _cached_payload(**kwargs):
        return (None, True)  # miss=True

    monkeypatch.setattr(ib, "resolve_existing_state_for_batch", _resolve)
    monkeypatch.setattr(ib, "should_skip_by_journal", _skip_journal)
    monkeypatch.setattr(ib, "cached_refresh_payload", _cached_payload)
    scanner = _make_scanner(stat_ok=True)
    stats = {"errors": 0}
    p = tmp_path / "d.png"

    entry, meta = await ib.prepare_single_batch_entry(
        scanner,
        file_path=p,
        base_dir=str(tmp_path),
        incremental=False,
        fast=False,
        journal_map={},
        existing_map={},
        cache_map={},
        has_rich_meta_set={3},  # existing_id=3 in rich set
        stats=stats,
    )
    assert entry == {"action": "skipped"}
    assert meta is None


@pytest.mark.asyncio
async def test_prepare_single_batch_entry_fast_mode(tmp_path, monkeypatch):
    async def _resolve(scanner, *, fp, incremental, journal_map, existing_map):
        return None

    def _skip_journal(**kwargs):
        return False

    def _cached_payload(**kwargs):
        return (None, False)

    def _build_fast(**kwargs):
        return {"action": "added", "fast": True}

    monkeypatch.setattr(ib, "resolve_existing_state_for_batch", _resolve)
    monkeypatch.setattr(ib, "should_skip_by_journal", _skip_journal)
    monkeypatch.setattr(ib, "cached_refresh_payload", _cached_payload)
    monkeypatch.setattr(ib, "build_fast_batch_entry", _build_fast)
    scanner = _make_scanner(stat_ok=True)
    stats = {"errors": 0}
    p = tmp_path / "e.png"

    entry, meta = await ib.prepare_single_batch_entry(
        scanner,
        file_path=p,
        base_dir=str(tmp_path),
        incremental=False,
        fast=True,
        journal_map={},
        existing_map={},
        cache_map={},
        has_rich_meta_set=set(),
        stats=stats,
    )
    assert entry is not None and entry.get("fast") is True
    assert meta is None


@pytest.mark.asyncio
async def test_prepare_single_batch_entry_needs_metadata(tmp_path, monkeypatch):
    async def _resolve(scanner, *, fp, incremental, journal_map, existing_map):
        return None

    def _skip_journal(**kwargs):
        return False

    def _cached_payload(**kwargs):
        return (None, False)

    monkeypatch.setattr(ib, "resolve_existing_state_for_batch", _resolve)
    monkeypatch.setattr(ib, "should_skip_by_journal", _skip_journal)
    monkeypatch.setattr(ib, "cached_refresh_payload", _cached_payload)
    scanner = _make_scanner(stat_ok=True)
    stats = {"errors": 0}
    p = tmp_path / "f.png"

    entry, meta = await ib.prepare_single_batch_entry(
        scanner,
        file_path=p,
        base_dir=str(tmp_path),
        incremental=False,
        fast=False,
        journal_map={},
        existing_map={},
        cache_map={},
        has_rich_meta_set=set(),
        stats=stats,
    )
    assert entry is None
    assert meta is not None  # tuple for metadata queue


# ─── prefetch_batch_cache_and_rich_meta with asset_ids ───────────────────────

@pytest.mark.asyncio
async def test_prefetch_batch_cache_and_rich_meta_with_existing(monkeypatch):
    async def _cache_rows(scanner, *, filepaths, cache_map):
        cache_map[("a.png", "h")] = '{"k":"v"}'

    async def _rich_rows(scanner, *, asset_ids, has_rich_meta_set):
        has_rich_meta_set.add(asset_ids[0])

    monkeypatch.setattr(ib, "prefetch_metadata_cache_rows", _cache_rows)
    monkeypatch.setattr(ib, "prefetch_rich_metadata_rows", _rich_rows)
    scanner = SimpleNamespace(db=_FakeDB())
    existing_map = {"a.png": {"id": 5, "mtime": 100}}

    cache_map, rich_set = await ib.prefetch_batch_cache_and_rich_meta(
        scanner, filepaths=["a.png"], existing_map=existing_map
    )
    assert 5 in rich_set
