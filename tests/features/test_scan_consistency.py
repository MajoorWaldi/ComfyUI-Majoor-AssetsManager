"""Tests for DB consistency check helpers (scan_consistency module)."""

from __future__ import annotations

from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock

import pytest

from mjr_am_backend.routes.handlers import scan_consistency as m
from mjr_am_backend.shared import Result


# -- _missing_asset_row --------------------------------------------------------


def test_missing_asset_row_returns_none_for_non_dict():
    assert m._missing_asset_row("not a dict") is None
    assert m._missing_asset_row(42) is None
    assert m._missing_asset_row(None) is None


def test_missing_asset_row_returns_none_when_id_missing():
    assert m._missing_asset_row({"filepath": "/some/path"}) is None


def test_missing_asset_row_returns_none_when_filepath_empty():
    assert m._missing_asset_row({"id": 1, "filepath": ""}) is None
    assert m._missing_asset_row({"id": 1, "filepath": None}) is None


def test_missing_asset_row_returns_none_when_file_exists(tmp_path: Path):
    f = tmp_path / "exists.png"
    f.write_bytes(b"img")
    result = m._missing_asset_row({"id": 1, "filepath": str(f)})
    assert result is None


def test_missing_asset_row_returns_pair_when_file_missing():
    result = m._missing_asset_row({"id": 7, "filepath": "/nonexistent/file.png"})
    assert result is not None
    asset_id, filepath = result
    assert asset_id == 7
    assert filepath == "/nonexistent/file.png"


# -- _collect_missing_asset_rows -----------------------------------------------


def test_collect_missing_filters_existing_files(tmp_path: Path):
    existing = tmp_path / "exists.png"
    existing.write_bytes(b"x")
    rows = [
        {"id": 1, "filepath": str(existing)},
        {"id": 2, "filepath": "/nonexistent/gone.png"},
        {"id": 3, "filepath": "/also/missing.jpg"},
        "not a dict",
    ]
    missing = m._collect_missing_asset_rows(rows)
    assert len(missing) == 2
    ids = {pair[0] for pair in missing}
    assert ids == {2, 3}


# -- _query_consistency_sample -------------------------------------------------


@pytest.mark.asyncio
async def test_query_consistency_sample_returns_result():
    db = AsyncMock()
    db.aquery = AsyncMock(return_value=Result.Ok([{"id": 1, "filepath": "/a.png"}]))
    result = await m._query_consistency_sample(db)
    assert result.ok is True
    assert len(result.data) == 1


@pytest.mark.asyncio
async def test_query_consistency_sample_returns_error_on_exception():
    db = AsyncMock()
    db.aquery = AsyncMock(side_effect=RuntimeError("db gone"))
    result = await m._query_consistency_sample(db)
    assert result.ok is False
    assert result.code == "QUERY_FAILED"


# -- _delete_missing_asset_rows ------------------------------------------------


@pytest.mark.asyncio
async def test_delete_missing_asset_rows_calls_delete():
    call_count = 0

    class _FakeDB:
        async def aexecute(self, *_args):
            nonlocal call_count
            call_count += 1
            return Result.Ok(None)

        def atransaction(self, **_kw):
            return self

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

    db = _FakeDB()
    missing = [(1, "/a.png"), (2, "/b.jpg")]
    await m._delete_missing_asset_rows(db, missing)
    # 3 deletes per missing row (assets, scan_journal, metadata_cache)
    assert call_count == 6


@pytest.mark.asyncio
async def test_delete_missing_asset_rows_handles_exception_gracefully():
    class _FailDB:
        def atransaction(self, **_kw):
            return self

        async def __aenter__(self):
            raise RuntimeError("locked")

        async def __aexit__(self, *args):
            pass

    # Should not raise
    await m._delete_missing_asset_rows(_FailDB(), [(1, "/a.png")])


# -- _run_consistency_check_inner ----------------------------------------------


@pytest.mark.asyncio
async def test_run_consistency_check_inner_skips_when_query_fails():
    db = AsyncMock()
    db.aquery = AsyncMock(return_value=Result.Err("FAIL", "nope"))
    # Should not raise, just return early
    await m._run_consistency_check_inner(db)


@pytest.mark.asyncio
async def test_run_consistency_check_inner_skips_when_no_missing():
    db = AsyncMock()
    db.aquery = AsyncMock(return_value=Result.Ok([]))
    await m._run_consistency_check_inner(db)
    # No delete calls expected
    assert not hasattr(db, "atransaction") or not db.atransaction.called


# -- _run_consistency_check ----------------------------------------------------


@pytest.mark.asyncio
async def test_run_consistency_check_noop_when_db_is_none():
    await m._run_consistency_check(None)  # Should not raise


@pytest.mark.asyncio
async def test_run_consistency_check_handles_timeout(monkeypatch):
    import asyncio

    async def _slow_inner(_db: Any) -> None:
        await asyncio.sleep(10)

    monkeypatch.setattr(m, "_run_consistency_check_inner", _slow_inner)
    monkeypatch.setattr(m, "_CONSISTENCY_CHECK_TIMEOUT_S", 0.01)

    db = AsyncMock()
    # Should not raise — timeout is caught
    await m._run_consistency_check(db)


# -- _maybe_schedule_consistency_check -----------------------------------------


@pytest.mark.asyncio
async def test_maybe_schedule_noop_when_db_is_none():
    await m._maybe_schedule_consistency_check(None)  # Should not raise


@pytest.mark.asyncio
async def test_maybe_schedule_respects_cooldown(monkeypatch):
    import time

    monkeypatch.setattr(m, "_LAST_CONSISTENCY_CHECK", time.time())
    monkeypatch.setattr(m, "_DB_CONSISTENCY_COOLDOWN_SECONDS", 9999)

    db = AsyncMock()
    # Should skip due to cooldown
    await m._maybe_schedule_consistency_check(db)
