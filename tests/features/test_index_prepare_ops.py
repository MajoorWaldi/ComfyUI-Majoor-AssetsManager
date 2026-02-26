from pathlib import Path
from types import SimpleNamespace

import pytest

from mjr_am_backend.features.index import index_prepare_ops as ipo
from mjr_am_backend.shared import Result


@pytest.mark.asyncio
async def test_prepare_metadata_for_entry_fast_short_circuit() -> None:
    scanner = SimpleNamespace(metadata=None, _current_scan_id=None)
    res, cache_store = await ipo.prepare_metadata_for_entry(scanner, filepath="x", fast=True)
    assert res.ok
    assert res.data == {}
    assert cache_store is False


@pytest.mark.asyncio
async def test_should_skip_by_journal_state_fast_true() -> None:
    scanner = SimpleNamespace(_asset_has_rich_metadata=lambda **kwargs: True)
    prepare_ctx = {"journal_state_hash": "s", "state_hash": "s", "existing_id": 1}
    assert await ipo.should_skip_by_journal_state(scanner, prepare_ctx=prepare_ctx, incremental=True, fast=True)


@pytest.mark.asyncio
async def test_should_skip_by_journal_state_checks_rich_metadata_when_not_fast() -> None:
    async def _has_rich_metadata(*, asset_id):
        return asset_id == 5

    scanner = SimpleNamespace(_asset_has_rich_metadata=_has_rich_metadata)
    prepare_ctx = {"journal_state_hash": "s", "state_hash": "s", "existing_id": 5}
    assert await ipo.should_skip_by_journal_state(scanner, prepare_ctx=prepare_ctx, incremental=True, fast=False)


@pytest.mark.asyncio
async def test_refresh_entry_from_cached_metadata_returns_refresh_entry(monkeypatch) -> None:
    async def _cached(_db, _fp, _state_hash):
        return Result.Ok({"metadata_raw": {"k": "v"}})

    monkeypatch.setattr(ipo.MetadataHelpers, "retrieve_cached_metadata", _cached)
    scanner = SimpleNamespace(db=object())
    prepare_ctx = {
        "filepath": "C:/x.png",
        "state_hash": "h",
        "existing_id": 9,
        "mtime": 1,
        "size": 2,
    }
    out = await ipo.refresh_entry_from_cached_metadata(
        scanner,
        prepare_ctx=prepare_ctx,
        file_path=Path("C:/x.png"),
        fast=False,
    )
    assert out is not None and out.ok
    assert out.data["action"] == "refresh"
    assert out.data["asset_id"] == 9


@pytest.mark.asyncio
async def test_prepare_index_entry_context_stat_failure() -> None:
    async def _stat_with_retry(*, file_path):
        return False, "boom"

    scanner = SimpleNamespace(_stat_with_retry=_stat_with_retry)
    ctx, err = await ipo.prepare_index_entry_context(
        scanner,
        file_path=Path("x"),
        existing_state=None,
        incremental=True,
    )
    assert ctx is None
    assert err == "boom"

