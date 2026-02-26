import sqlite3
from pathlib import Path
from types import SimpleNamespace

import pytest

from mjr_am_backend.features.index import index_file_ops as ifo
from mjr_am_backend.shared import ErrorCode, Result


class _Stat:
    st_mtime_ns = 100
    st_mtime = 10
    st_size = 42


class _Tx:
    def __init__(self, ok=True, error=""):
        self.ok = ok
        self.error = error


class _TxCtx:
    def __init__(self, tx):
        self.tx = tx

    async def __aenter__(self):
        return self.tx

    async def __aexit__(self, exc_type, exc, tb):
        return False


class _Db:
    def __init__(self, tx=None):
        self._tx = tx or _Tx(ok=True)

    def atransaction(self, mode="immediate"):
        return _TxCtx(self._tx)

    async def aquery(self, _sql, _params):
        return Result.Ok([])

    def _is_locked_error(self, exc):
        return "locked" in str(exc).lower()

    def lock_for_asset(self, _asset_id):
        return _TxCtx(_Tx(ok=True))


@pytest.mark.asyncio
async def test_build_index_file_state_stat_failed() -> None:
    async def _stat_with_retry(*, file_path):
        return False, "boom"

    scanner = SimpleNamespace(_stat_with_retry=_stat_with_retry)
    out = await ifo.build_index_file_state(scanner, file_path=Path("x"))
    assert not out.ok
    assert out.code == "STAT_FAILED"


@pytest.mark.asyncio
async def test_build_index_file_state_success() -> None:
    async def _stat_with_retry(*, file_path):
        return True, _Stat()

    scanner = SimpleNamespace(_stat_with_retry=_stat_with_retry)
    out = await ifo.build_index_file_state(scanner, file_path=Path("x.png"))
    assert isinstance(out, tuple)
    _, filepath, state_hash, mtime, size = out
    assert filepath.endswith("x.png")
    assert state_hash
    assert mtime == 10 and size == 42


@pytest.mark.asyncio
async def test_try_skip_by_journal_fast_or_rich() -> None:
    async def _asset_has_rich_metadata(*, asset_id):
        return asset_id == 9

    scanner = SimpleNamespace(_asset_has_rich_metadata=_asset_has_rich_metadata)
    out_fast = await ifo.try_skip_by_journal(
        scanner,
        incremental=True,
        journal_state_hash="h",
        state_hash="h",
        fast=True,
        existing_id=0,
    )
    out_rich = await ifo.try_skip_by_journal(
        scanner,
        incremental=True,
        journal_state_hash="h",
        state_hash="h",
        fast=False,
        existing_id=9,
    )
    assert out_fast.ok and out_fast.data["action"] == "skipped_journal"
    assert out_rich.ok and out_rich.data["action"] == "skipped_journal"


@pytest.mark.asyncio
async def test_get_journal_state_hash_prefers_existing_state() -> None:
    scanner = SimpleNamespace(_get_journal_entry=None)
    out = await ifo.get_journal_state_hash_for_index_file(
        scanner,
        filepath="x",
        existing_state={"journal_state_hash": "abc"},
        incremental=True,
    )
    assert out == "abc"


@pytest.mark.asyncio
async def test_extract_metadata_for_index_file_ffprobe_error(monkeypatch) -> None:
    async def _get_metadata(_filepath, scan_id=None):
        return Result.Err(ErrorCode.FFPROBE_ERROR, "ffprobe failed")

    async def _store_cache(*args, **kwargs):
        return None

    def _payload(_res, _fp):
        return Result.Ok({"quality": "degraded"})

    scanner = SimpleNamespace(
        metadata=SimpleNamespace(get_metadata=_get_metadata),
        _current_scan_id="s",
        _log_scan_event=lambda *args, **kwargs: None,
        db=object(),
    )
    monkeypatch.setattr(ifo.MetadataHelpers, "store_metadata_cache", _store_cache)
    monkeypatch.setattr(ifo.MetadataHelpers, "metadata_error_payload", _payload)
    out = await ifo.extract_metadata_for_index_file(
        scanner,
        file_path=Path("x.png"),
        filepath="x.png",
        state_hash="h",
        fast=False,
    )
    assert out.ok
    assert out.data["quality"] == "degraded"


@pytest.mark.asyncio
async def test_try_incremental_refresh_with_metadata_handles_db_busy(monkeypatch) -> None:
    async def _locked(*args, **kwargs):
        raise sqlite3.OperationalError("database is locked")

    scanner = SimpleNamespace()
    monkeypatch.setattr(ifo, "run_incremental_metadata_refresh_locked", _locked)
    out = await ifo.try_incremental_refresh_with_metadata(
        scanner,
        incremental=True,
        existing_id=1,
        existing_mtime=10,
        mtime=10,
        filepath="x",
        state_hash="h",
        base_dir=".",
        size=1,
        metadata_result=Result.Ok({}),
    )
    assert not out.ok
    assert out.code == "DB_BUSY"


@pytest.mark.asyncio
async def test_insert_new_asset_for_index_file_commit_failure(monkeypatch) -> None:
    async def _insert_tx(*args, **kwargs):
        return _Tx(ok=False, error="commit failed"), Result.Ok({"asset_id": 1})

    scanner = SimpleNamespace(db=_Db(), _write_metadata_row=lambda **kwargs: None)
    monkeypatch.setattr(ifo, "insert_new_asset_tx", _insert_tx)
    out = await ifo.insert_new_asset_for_index_file(
        scanner,
        filename="x.png",
        subfolder="",
        filepath="x.png",
        kind="image",
        mtime=1,
        size=1,
        file_path=Path("x.png"),
        metadata_result=Result.Ok({}),
        base_dir=".",
        state_hash="h",
        source="output",
        root_id=None,
    )
    assert not out.ok
    assert out.code == "DB_ERROR"


class _DbQuerySeq(_Db):
    def __init__(self, seq):
        super().__init__()
        self.seq = list(seq)

    async def aquery(self, _sql, _params):
        if not self.seq:
            return Result.Ok([])
        return self.seq.pop(0)


@pytest.mark.asyncio
async def test_resolve_index_file_path_windows_fallback(monkeypatch) -> None:
    monkeypatch.setattr(ifo, "IS_WINDOWS", True)
    out = ifo.resolve_index_file_path(Path("not-real"))
    assert isinstance(out, Path)


@pytest.mark.asyncio
async def test_get_journal_state_hash_paths() -> None:
    async def _journal(filepath):
        _ = filepath
        return {"state_hash": "h1"}

    scanner = SimpleNamespace(_get_journal_entry=_journal)
    out = await ifo.get_journal_state_hash_for_index_file(scanner, filepath="x", existing_state=None, incremental=True)
    assert out == "h1"

    out2 = await ifo.get_journal_state_hash_for_index_file(scanner, filepath="x", existing_state=None, incremental=False)
    assert out2 is None


@pytest.mark.asyncio
async def test_resolve_existing_asset_windows_case_insensitive(monkeypatch) -> None:
    monkeypatch.setattr(ifo, "IS_WINDOWS", True)
    db = _DbQuerySeq([Result.Ok([]), Result.Ok([{"id": 3, "mtime": 1, "filepath": "X"}])])
    scanner = SimpleNamespace(db=db)
    out = await ifo.resolve_existing_asset_for_index_file(scanner, filepath="x", existing_state=None)
    assert out and out["id"] == 3


@pytest.mark.asyncio
async def test_try_cached_incremental_refresh_refresh_and_skip(monkeypatch) -> None:
    async def _cached(_db, _fp, _state):
        return Result.Ok({"k": 1})

    async def _refresh(*args, **kwargs):
        return Result.Ok({"action": "skipped_refresh"})

    async def _rich(asset_id):
        return asset_id == 9

    scanner = SimpleNamespace(db=object(), _asset_has_rich_metadata=_rich)
    monkeypatch.setattr(ifo.MetadataHelpers, "retrieve_cached_metadata", _cached)
    monkeypatch.setattr(ifo, "refresh_from_cached_metadata", _refresh)

    out = await ifo.try_cached_incremental_refresh(scanner, incremental=True, existing_id=1, existing_mtime=2, mtime=2, filepath="x", state_hash="h", base_dir=".", size=1)
    assert out and out.ok

    async def _cached_none(_db, _fp, _state):
        return None

    monkeypatch.setattr(ifo.MetadataHelpers, "retrieve_cached_metadata", _cached_none)
    out2 = await ifo.try_cached_incremental_refresh(scanner, incremental=True, existing_id=9, existing_mtime=2, mtime=2, filepath="x", state_hash="h", base_dir=".", size=1)
    assert out2 and out2.data["action"] == "skipped"


@pytest.mark.asyncio
async def test_refresh_from_cached_metadata_tx_and_wrapper(monkeypatch) -> None:
    async def _refresh(*args, **kwargs):
        return True

    async def _write_scan_journal_entry(**kwargs):
        _ = kwargs
        return None

    scanner = SimpleNamespace(db=_Db(), _write_scan_journal_entry=_write_scan_journal_entry)
    monkeypatch.setattr(ifo.MetadataHelpers, "refresh_metadata_if_needed", _refresh)

    tx, refreshed = await ifo.refresh_from_cached_metadata_tx(scanner, existing_id=1, cached_metadata=Result.Ok({}), filepath="x", base_dir=".", state_hash="h", mtime=1, size=1)
    assert tx.ok and refreshed

    async def _tx_call(*args, **kwargs):
        return _Tx(ok=True), True

    monkeypatch.setattr(ifo, "refresh_from_cached_metadata_tx", _tx_call)
    out = await ifo.refresh_from_cached_metadata(scanner, existing_id=1, cached_metadata=Result.Ok({}), filepath="x", base_dir=".", state_hash="h", mtime=1, size=1)
    assert out.ok and out.data["action"] == "skipped_refresh"


@pytest.mark.asyncio
async def test_run_incremental_refresh_locked_and_tx_paths(monkeypatch) -> None:
    scanner = SimpleNamespace(db=_Db(), _write_scan_journal_entry=lambda **kwargs: None)

    async def _refresh(*args, **kwargs):
        return False

    monkeypatch.setattr(ifo.MetadataHelpers, "refresh_metadata_if_needed", _refresh)
    tx, refreshed = await ifo.run_incremental_metadata_refresh_tx(scanner, existing_id=1, metadata_result=Result.Ok({}), filepath="x", base_dir=".", state_hash="h", mtime=1, size=1)
    assert tx.ok and refreshed is False

    async def _raise(*args, **kwargs):
        raise sqlite3.OperationalError("database is locked")

    monkeypatch.setattr(ifo, "run_incremental_metadata_refresh_tx", _raise)
    with pytest.raises(RuntimeError):
        await ifo.run_incremental_metadata_refresh_locked(scanner, existing_id=1, metadata_result=Result.Ok({}), filepath="x", base_dir=".", state_hash="h", mtime=1, size=1)


@pytest.mark.asyncio
async def test_insert_new_asset_paths(monkeypatch) -> None:
    async def _insert_ok(*args, **kwargs):
        return _Tx(ok=True), Result.Ok({"asset_id": 5})

    called = {"w": 0}

    async def _write_metadata_row(**kwargs):
        _ = kwargs
        called["w"] += 1

    scanner = SimpleNamespace(db=_Db(), _write_metadata_row=_write_metadata_row)
    monkeypatch.setattr(ifo, "insert_new_asset_tx", _insert_ok)

    out = await ifo.insert_new_asset_for_index_file(scanner, filename="x", subfolder="", filepath="x", kind="image", mtime=1, size=1, file_path=Path("x"), metadata_result=Result.Ok({}), base_dir=".", state_hash="h", source="output", root_id=None)
    assert out.ok and called["w"] == 1

    async def _insert_raise(*args, **kwargs):
        raise sqlite3.OperationalError("database is locked")

    monkeypatch.setattr(ifo, "insert_new_asset_tx", _insert_raise)
    out2 = await ifo.insert_new_asset_for_index_file(scanner, filename="x", subfolder="", filepath="x", kind="image", mtime=1, size=1, file_path=Path("x"), metadata_result=Result.Ok({}), base_dir=".", state_hash="h", source="output", root_id=None)
    assert out2.code == "DB_BUSY"


@pytest.mark.asyncio
async def test_insert_new_asset_tx_paths() -> None:
    class _Scanner:
        def __init__(self):
            self.db = _Db()

        async def _add_asset(self, **kwargs):
            _ = kwargs
            return Result.Ok({"asset_id": 1})

        async def _write_scan_journal_entry(self, **kwargs):
            _ = kwargs
            return None

    scanner = _Scanner()
    tx, res = await ifo.insert_new_asset_tx(scanner, filename="x", subfolder="", filepath="x", kind="image", mtime=1, size=1, file_path=Path("x"), metadata_result=Result.Ok({}), base_dir=".", state_hash="h", source="output", root_id=None)
    assert tx.ok and res.ok


@pytest.mark.asyncio
async def test_index_file_main_flow(monkeypatch) -> None:
    async def _build(*args, **kwargs):
        return Path("x"), "x", "h", 1, 1

    async def _journal(*args, **kwargs):
        return None

    async def _resolve(*args, **kwargs):
        return {"id": 1, "mtime": 1}

    async def _skip(*args, **kwargs):
        return None

    async def _cached(*args, **kwargs):
        return None

    async def _meta(*args, **kwargs):
        return Result.Ok({})

    async def _inc(*args, **kwargs):
        return None

    async def _insert(*args, **kwargs):
        return Result.Ok({"action": "inserted"})

    scanner = SimpleNamespace()
    monkeypatch.setattr(ifo, "build_index_file_state", _build)
    monkeypatch.setattr(ifo, "get_journal_state_hash_for_index_file", _journal)
    monkeypatch.setattr(ifo, "resolve_existing_asset_for_index_file", _resolve)
    monkeypatch.setattr(ifo, "try_skip_by_journal", _skip)
    monkeypatch.setattr(ifo, "try_cached_incremental_refresh", _cached)
    monkeypatch.setattr(ifo, "extract_metadata_for_index_file", _meta)
    monkeypatch.setattr(ifo, "try_incremental_refresh_with_metadata", _inc)
    monkeypatch.setattr(ifo, "insert_new_asset_for_index_file", _insert)

    out = await ifo.index_file(scanner, file_path=Path("x"), base_dir=".", incremental=True)
    assert out.ok and out.data["action"] == "inserted"
