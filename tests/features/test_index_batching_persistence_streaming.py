import asyncio
import threading
from pathlib import Path
from types import SimpleNamespace

import pytest

from mjr_am_backend.features.index import index_batching as batching_mod
from mjr_am_backend.features.index import index_persistence as persist_mod
from mjr_am_backend.features.index import scan_streaming as streaming_mod
from mjr_am_backend.shared import Result


class _AsyncTx:
    def __init__(self, ok=True, error=None):
        self.ok = ok
        self.error = error

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False


class _DB:
    def __init__(self, rows=None, rows_in=None):
        self._rows = rows or []
        self._rows_in = rows_in or []

    async def aquery(self, _sql, _params):
        return Result.Ok(self._rows)

    async def aquery_in(self, _sql, _col, _values):
        return Result.Ok(self._rows_in)

    def atransaction(self, mode="immediate"):
        _ = mode
        return _AsyncTx(ok=True)


@pytest.mark.asyncio
async def test_stream_scan_batch_empty_noop() -> None:
    scanner = SimpleNamespace()
    stats = {"scanned": 0, "added": 0, "updated": 0, "skipped": 0, "errors": 0}
    await streaming_mod.scan_stream_batch(
        scanner,
        batch=[],
        base_dir="C:/x",
        incremental=False,
        source="output",
        root_id=None,
        fast=False,
        stats=stats,
        to_enrich=[],
    )


@pytest.mark.asyncio
async def test_stream_scan_batch_calls_pipeline(monkeypatch, tmp_path: Path) -> None:
    calls = {}

    async def _journal(scanner, filepaths):
        _ = scanner
        calls["journal"] = list(filepaths)
        return {filepaths[0]: "h"}

    async def _existing(scanner, filepaths):
        _ = scanner
        calls["existing"] = list(filepaths)
        return {filepaths[0]: {"id": 1, "mtime": 1}}

    async def _index(scanner, **kwargs):
        _ = scanner
        calls["index"] = kwargs

    monkeypatch.setattr(streaming_mod, "get_journal_entries", _journal)
    monkeypatch.setattr(streaming_mod, "existing_map_for_batch", _existing)
    monkeypatch.setattr(streaming_mod, "index_batch", _index)

    scanner = SimpleNamespace()
    p = tmp_path / "a.png"
    p.write_text("x")

    await streaming_mod.scan_stream_batch(
        scanner,
        batch=[p],
        base_dir=str(tmp_path),
        incremental=True,
        source="output",
        root_id="r1",
        fast=False,
        stats={"scanned": 1, "added": 0, "updated": 0, "skipped": 0, "errors": 0},
        to_enrich=[],
    )

    assert "journal" in calls
    assert "existing" in calls
    assert calls["index"]["root_id"] == "r1"


@pytest.mark.asyncio
async def test_consume_scan_queue_processes_until_sentinel(monkeypatch, tmp_path: Path) -> None:
    processed = []

    async def _proc(scanner, **kwargs):
        _ = scanner
        processed.append(list(kwargs["batch"]))

    monkeypatch.setattr(streaming_mod, "process_scan_batch", _proc)

    file_path = tmp_path / "x.png"
    file_path.write_text("x")

    seq = [[file_path, None]]

    def _drain(_q, _target):
        return seq.pop(0) if seq else []

    scanner = SimpleNamespace(_fs_walker=SimpleNamespace(drain_queue=_drain))
    stop_event = threading.Event()
    stats = {"scanned": 0, "added": 0, "updated": 0, "skipped": 0, "errors": 0}

    await streaming_mod.consume_scan_queue(
        scanner,
        q=SimpleNamespace(),
        directory=str(tmp_path),
        incremental=False,
        source="output",
        root_id=None,
        fast=False,
        stats=stats,
        to_enrich=[],
        stop_event=stop_event,
    )

    assert len(processed) == 1
    assert stats["scanned"] == 1


def test_cached_refresh_payload_variants() -> None:
    assert batching_mod.cached_refresh_payload(
        existing_id=0,
        existing_mtime=1,
        mtime=1,
        cache_map={},
        filepath="a",
        state_hash="s",
    ) == (None, False)

    assert batching_mod.cached_refresh_payload(
        existing_id=3,
        existing_mtime=5,
        mtime=5,
        cache_map={("a", "s"): "raw"},
        filepath="a",
        state_hash="s",
    ) == ("raw", False)

    assert batching_mod.cached_refresh_payload(
        existing_id=3,
        existing_mtime=5,
        mtime=5,
        cache_map={},
        filepath="a",
        state_hash="s",
    ) == (None, True)


def test_metadata_queue_item_shape(tmp_path: Path) -> None:
    p = tmp_path / "a.png"
    out = batching_mod.metadata_queue_item(p, "fp", 1, 2, 3, "h", 4)
    assert out[1] == "fp"
    assert out[-1] == 4


@pytest.mark.asyncio
async def test_journal_map_for_batch_skips_when_not_incremental() -> None:
    scanner = SimpleNamespace(_get_journal_entries=lambda **kwargs: Result.Ok(kwargs))
    out = await batching_mod.journal_map_for_batch(scanner, filepaths=["a"], incremental=False)
    assert out == {}


@pytest.mark.asyncio
async def test_existing_map_for_batch_hydrates_rows() -> None:
    db = _DB(rows_in=[{"filepath": "a", "id": 1, "mtime": 2}, {"filepath": "", "id": 2}])
    scanner = SimpleNamespace(db=db)
    out = await batching_mod.existing_map_for_batch(scanner, filepaths=["a", "b"])
    assert out["a"]["id"] == 1


@pytest.mark.asyncio
async def test_prefetch_metadata_cache_rows_populates_map() -> None:
    db = _DB(rows_in=[{"filepath": "a", "state_hash": "h", "metadata_raw": "{}"}])
    scanner = SimpleNamespace(db=db)
    cache_map = {}
    await batching_mod.prefetch_metadata_cache_rows(scanner, filepaths=["a"], cache_map=cache_map)
    assert cache_map[("a", "h")] == "{}"


@pytest.mark.asyncio
async def test_prefetch_rich_metadata_rows_marks_asset_ids() -> None:
    db = _DB(rows_in=[{"asset_id": 7, "metadata_quality": "rich", "metadata_raw": "{}"}])
    scanner = SimpleNamespace(db=db)
    s = set()
    await batching_mod.prefetch_rich_metadata_rows(scanner, asset_ids=[7], has_rich_meta_set=s)
    assert 7 in s


@pytest.mark.asyncio
async def test_append_batch_metadata_entries_add_and_update(monkeypatch, tmp_path: Path) -> None:
    p1 = tmp_path / "a.png"
    p2 = tmp_path / "b.png"

    class _Meta:
        async def get_metadata_batch(self, _paths, scan_id=None):
            _ = scan_id
            return {str(p1): Result.Ok({"x": 1}), str(p2): Result.Err("X", "bad")}

    def _err_payload(result, fp):
        return Result.Err(result.code or "ERR", f"{fp}:bad")

    monkeypatch.setattr(batching_mod.MetadataHelpers, "metadata_error_payload", staticmethod(_err_payload))

    scanner = SimpleNamespace(metadata=_Meta(), _current_scan_id="s1")
    prepared = []
    needs_metadata = [
        (p1, "fp1", 1, 2, 3, "h1", 10),
        (p2, "fp2", 1, 2, 3, "h2", None),
    ]

    await batching_mod.append_batch_metadata_entries(
        scanner,
        prepared=prepared,
        needs_metadata=needs_metadata,
        base_dir=str(tmp_path),
        fast=False,
    )

    assert len(prepared) == 2
    assert prepared[0]["action"] == "updated"
    assert prepared[1]["action"] == "added"


@pytest.mark.asyncio
async def test_apply_update_entry_uses_scanner_update() -> None:
    called = {}

    class _Scanner:
        async def _update_asset(self, **kwargs):
            called.update(kwargs)
            return Result.Ok({})

    ok = await persist_mod.apply_update_entry(
        _Scanner(),
        entry={"mtime": 1, "size": 2, "fast": False},
        ctx={"asset_id": 3, "file_path": Path("x"), "metadata_result": Result.Ok({})},
        source="output",
        root_id=None,
    )

    assert ok is True
    assert called["asset_id"] == 3


@pytest.mark.asyncio
async def test_apply_add_entry_uses_scanner_add() -> None:
    class _Scanner:
        async def _add_asset(self, **kwargs):
            return Result.Ok(kwargs)

    res = await persist_mod.apply_add_entry(
        _Scanner(),
        entry={"filename": "a", "subfolder": "", "filepath": "fp", "mtime": 1, "size": 2},
        ctx={"kind": "image", "file_path": Path("x"), "metadata_result": Result.Ok({})},
        source="output",
        root_id="r1",
    )

    assert res.ok is True
    assert res.data["root_id"] == "r1"


@pytest.mark.asyncio
async def test_process_prepared_entry_tx_skipped_increments_stats() -> None:
    scanner = SimpleNamespace(_entry_state_drifted=lambda **kwargs: False)
    stats = {"skipped": 0, "errors": 0}

    await persist_mod.process_prepared_entry_tx(
        scanner,
        entry={"action": "skipped"},
        base_dir="C:/x",
        source="output",
        root_id=None,
        stats=stats,
        to_enrich=[],
        added_ids=[],
    )

    assert stats["skipped"] == 1


@pytest.mark.asyncio
async def test_persist_prepared_entries_routes_to_fallback_on_nonfatal(monkeypatch) -> None:
    called = {"fallback": False}

    async def _tx(*args, **kwargs):
        _ = (args, kwargs)
        raise RuntimeError("nonfatal")

    async def _fallback(*args, **kwargs):
        _ = (args, kwargs)
        called["fallback"] = True

    monkeypatch.setattr(persist_mod, "persist_prepared_entries_tx", _tx)
    monkeypatch.setattr(persist_mod, "persist_prepared_entries_fallback", _fallback)

    scanner = SimpleNamespace(_diagnose_batch_failure=lambda prepared, err: ("fp", "r"))
    await persist_mod.persist_prepared_entries(
        scanner,
        prepared=[{"action": "added"}],
        base_dir="C:/x",
        source="output",
        root_id=None,
        stats={"errors": 0},
        to_enrich=[],
        added_ids=[],
        is_fatal_db_error=lambda _exc: False,
    )

    assert called["fallback"] is True


@pytest.mark.asyncio
async def test_persist_prepared_entries_raises_on_fatal(monkeypatch) -> None:
    async def _tx(*args, **kwargs):
        _ = (args, kwargs)
        raise RuntimeError("fatal")

    monkeypatch.setattr(persist_mod, "persist_prepared_entries_tx", _tx)

    scanner = SimpleNamespace(_diagnose_batch_failure=lambda prepared, err: (None, "x"))
    with pytest.raises(RuntimeError):
        await persist_mod.persist_prepared_entries(
            scanner,
            prepared=[{"action": "added"}],
            base_dir="C:/x",
            source="output",
            root_id=None,
            stats={"errors": 0},
            to_enrich=[],
            added_ids=[],
            is_fatal_db_error=lambda _exc: True,
        )

@pytest.mark.asyncio
async def test_persist_prepared_entries_tx_commit_failure() -> None:
    scanner = SimpleNamespace(
        db=SimpleNamespace(atransaction=lambda mode="immediate": _AsyncTx(ok=False, error="begin failed")),
    )
    stats = {"skipped": 0, "errors": 0}
    with pytest.raises(RuntimeError):
        await persist_mod.persist_prepared_entries_tx(
            scanner,
            prepared=[],
            base_dir="C:/x",
            source="output",
            root_id=None,
            stats=stats,
            to_enrich=[],
            added_ids=[],
        )


@pytest.mark.asyncio
async def test_process_prepared_entry_tx_routes(monkeypatch) -> None:
    called = {"r": 0, "u": 0, "a": 0}

    async def _refresh(*args, **kwargs):
        called["r"] += 1
        return True

    async def _updated(*args, **kwargs):
        called["u"] += 1
        return True

    async def _added(*args, **kwargs):
        called["a"] += 1
        return True

    monkeypatch.setattr(persist_mod, "process_refresh_entry", _refresh)
    monkeypatch.setattr(persist_mod, "process_updated_entry", _updated)
    monkeypatch.setattr(persist_mod, "process_added_entry", _added)

    scanner = SimpleNamespace(_entry_state_drifted=lambda **kwargs: False)
    stats = {"skipped": 0, "errors": 0}

    await persist_mod.process_prepared_entry_tx(scanner, entry={"action": "refresh"}, base_dir=".", source="output", root_id=None, stats=stats, to_enrich=[], added_ids=[])
    await persist_mod.process_prepared_entry_tx(scanner, entry={"action": "updated"}, base_dir=".", source="output", root_id=None, stats=stats, to_enrich=[], added_ids=[])
    await persist_mod.process_prepared_entry_tx(scanner, entry={"action": "added"}, base_dir=".", source="output", root_id=None, stats=stats, to_enrich=[], added_ids=[])

    assert called == {"r": 1, "u": 1, "a": 1}


@pytest.mark.asyncio
async def test_persist_prepared_entries_fallback_counts(monkeypatch) -> None:
    class _Lock:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

    async def _proc(*args, **kwargs):
        return False

    monkeypatch.setattr(persist_mod, "process_prepared_entry_fallback", _proc)

    scanner = SimpleNamespace(
        _batch_fallback_lock=_Lock(),
        _batch_fallback_count=0,
        _entry_state_drifted=lambda **kwargs: False,
        db=SimpleNamespace(atransaction=lambda mode="immediate": _AsyncTx(ok=True)),
    )
    stats = {"errors": 0, "skipped": 0}

    await persist_mod.persist_prepared_entries_fallback(
        scanner,
        prepared=[{"action": "updated", "filepath": "x"}],
        base_dir=".",
        source="output",
        root_id=None,
        stats=stats,
        to_enrich=[],
    )
    assert stats["batch_fallbacks"] == 1


@pytest.mark.asyncio
async def test_process_prepared_entry_fallback_unknown() -> None:
    scanner = SimpleNamespace()
    stats = {"errors": 0, "skipped": 0}
    ok = await persist_mod.process_prepared_entry_fallback(
        scanner,
        entry={"action": "unknown"},
        base_dir=".",
        source="output",
        root_id=None,
        stats=stats,
        to_enrich=[],
    )
    assert ok is True


@pytest.mark.asyncio
async def test_process_refresh_entry_invalid_and_exception(monkeypatch) -> None:
    async def _refresh_fail(*args, **kwargs):
        raise RuntimeError("x")

    monkeypatch.setattr(persist_mod.MetadataHelpers, "refresh_metadata_if_needed", _refresh_fail)

    scanner = SimpleNamespace(
        db=object(),
        _write_scan_journal_entry=lambda **kwargs: None,
        _record_refresh_outcome=lambda **kwargs: None,
    )
    stats = {"errors": 0, "skipped": 0}

    out = await persist_mod.process_refresh_entry(
        scanner,
        entry={"asset_id": None, "metadata_result": None},
        base_dir=".",
        stats=stats,
        to_enrich=[],
        fallback_mode=True,
        respect_enrich_limit=True,
    )
    assert out is False

    out2 = await persist_mod.process_refresh_entry(
        scanner,
        entry={"asset_id": 1, "metadata_result": Result.Ok({}), "filepath": "x", "state_hash": "h", "mtime": 1, "size": 1},
        base_dir=".",
        stats=stats,
        to_enrich=[],
        fallback_mode=False,
        respect_enrich_limit=True,
    )
    assert out2 is True


@pytest.mark.asyncio
async def test_process_updated_and_added_invalid(monkeypatch) -> None:
    scanner = SimpleNamespace()
    stats = {"errors": 0, "skipped": 0}

    monkeypatch.setattr(persist_mod, "extract_update_entry_context", lambda _entry: None)
    ok_u = await persist_mod.process_updated_entry(
        scanner,
        entry={},
        base_dir=".",
        source="output",
        root_id=None,
        stats=stats,
        to_enrich=[],
        added_ids=[],
        fallback_mode=True,
        respect_enrich_limit=True,
    )
    assert ok_u is False

    monkeypatch.setattr(persist_mod, "extract_add_entry_context", lambda _entry: None)
    ok_a = await persist_mod.process_added_entry(
        scanner,
        entry={},
        base_dir=".",
        source="output",
        root_id=None,
        stats=stats,
        to_enrich=[],
        added_ids=[],
        fallback_mode=True,
        respect_enrich_limit=True,
    )
    assert ok_a is False


@pytest.mark.asyncio
async def test_write_entry_scan_journal_smoke() -> None:
    called = {"n": 0}

    async def _write_scan_journal_entry(**kwargs):
        _ = kwargs
        called["n"] += 1

    scanner = SimpleNamespace(_write_scan_journal_entry=_write_scan_journal_entry)
    await persist_mod.write_entry_scan_journal(scanner, entry={"filepath": "x", "state_hash": "h", "mtime": 1, "size": 1}, base_dir=".")
    assert called["n"] == 1
