from pathlib import Path
from types import SimpleNamespace

import pytest

from mjr_am_backend.features.index import scan_orchestrator as so


class _DummyLock:
    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False


def test_validate_scan_directory_errors(tmp_path: Path) -> None:
    missing = tmp_path / "missing"
    assert so.validate_scan_directory(missing, str(missing)) is not None
    file_path = tmp_path / "a.txt"
    file_path.write_text("x", encoding="utf-8")
    assert so.validate_scan_directory(file_path, str(file_path)) is not None


def test_filter_indexable_paths_keeps_known_extensions() -> None:
    paths = [Path("a.png"), Path("b.mp4"), Path("c.unknown")]
    out = so.filter_indexable_paths(paths)
    names = {p.name for p in out}
    assert "a.png" in names
    assert "b.mp4" in names
    assert "c.unknown" not in names


@pytest.mark.asyncio
async def test_index_paths_returns_empty_stats_when_no_indexable_paths() -> None:
    scanner = SimpleNamespace(
        _index_lock=_DummyLock(),
        _current_scan_id=None,
    )
    res = await so.index_paths(
        scanner,
        paths=[Path("x.unknown")],
        base_dir=".",
        incremental=True,
    )
    assert res.ok
    assert res.data.get("scanned") == 0
    assert res.data.get("added") == 0


@pytest.mark.asyncio
async def test_index_paths_runs_batch_and_finalize(monkeypatch) -> None:
    called = {"batches": False, "finalize": False}

    async def _fake_batches(scanner, **kwargs):
        called["batches"] = True
        kwargs["stats"]["added"] = 1
        kwargs["added_ids"].append(9)

    async def _fake_finalize(scanner, *, scan_start, stats):
        called["finalize"] = True
        stats["duration_seconds"] = 0.01

    monkeypatch.setattr(so, "index_paths_batches", _fake_batches)
    monkeypatch.setattr(so, "finalize_index_paths", _fake_finalize)

    scanner = SimpleNamespace(
        _index_lock=_DummyLock(),
        _current_scan_id=None,
        _log_scan_event=lambda *args, **kwargs: None,
    )
    res = await so.index_paths(
        scanner,
        paths=[Path("x.png")],
        base_dir=".",
        incremental=True,
    )
    assert res.ok
    assert called["batches"] and called["finalize"]
    assert res.data.get("added") == 1
    assert res.data.get("added_ids") == [9]
    assert scanner._current_scan_id is None
