import asyncio
import sqlite3
from pathlib import Path

import pytest

from mjr_am_backend.features.index.scanner import IndexScanner
from mjr_am_backend.features.index import scanner as scanner_mod
from mjr_am_backend.shared import Result


class _DbStub:
    def __init__(self, rows):
        self._rows = list(rows)

    async def aquery_in(self, _sql, _column, _asset_ids):
        return Result.Ok(list(self._rows))


class _SearcherStub:
    def __init__(self):
        self.invalidated = 0

    def invalidate(self):
        self.invalidated += 1


@pytest.mark.asyncio
async def test_index_added_vectors_includes_image_and_video(monkeypatch, tmp_path: Path):
    image_path = tmp_path / "img.png"
    image_path.write_bytes(b"\x89PNG\r\n\x1a\n")
    video_path = tmp_path / "clip.mp4"
    video_path.write_bytes(b"\x00\x00\x00\x20ftyp")

    rows = [
        {"id": 1, "filepath": str(image_path), "kind": "image", "metadata_raw": "{}"},
        {"id": 2, "filepath": str(video_path), "kind": "video", "metadata_raw": "{}"},
    ]
    scanner = IndexScanner(_DbStub(rows), metadata_service=object(), scan_lock=asyncio.Lock())
    searcher = _SearcherStub()
    scanner.set_vector_services(vector_service=object(), vector_searcher=searcher)

    calls = []

    async def _fake_index_asset_vector(_db, _vs, asset_id, filepath, kind, metadata_raw=None):
        calls.append(
            {
                "asset_id": int(asset_id),
                "filepath": str(filepath),
                "kind": str(kind),
                "metadata_raw": metadata_raw,
            }
        )
        return Result.Ok(True)

    import mjr_am_backend.features.index.vector_indexer as vector_indexer_mod

    monkeypatch.setattr(vector_indexer_mod, "index_asset_vector", _fake_index_asset_vector)

    updated = {"asset_ids": None}

    async def _fake_notify(*, asset_ids):
        updated["asset_ids"] = list(asset_ids)

    monkeypatch.setattr(scanner, "_notify_vector_asset_updates", _fake_notify)

    await scanner._index_added_image_vectors(asset_ids=[1, 2])

    assert len(calls) == 2
    assert {c["kind"] for c in calls} == {"image", "video"}
    assert searcher.invalidated == 1
    assert updated["asset_ids"] == [1, 2]


@pytest.mark.asyncio
async def test_schedule_added_vectors_respects_scan_toggle(monkeypatch) -> None:
    scanner = IndexScanner(_DbStub([]), metadata_service=object(), scan_lock=asyncio.Lock())
    scanner.set_vector_services(vector_service=object(), vector_searcher=None)

    called = {"n": 0}

    async def _fake_index(*, asset_ids):
        _ = asset_ids
        called["n"] += 1

    monkeypatch.setattr(
        "mjr_am_backend.features.index.scanner.is_vector_index_on_scan_enabled",
        lambda: False,
    )
    monkeypatch.setattr(scanner, "_index_added_image_vectors", _fake_index)

    scanner._schedule_added_image_vector_index(prev_added_count=0, added_ids=[1, 2, 3])
    await asyncio.sleep(0)

    assert called["n"] == 0


@pytest.mark.asyncio
async def test_schedule_prepared_vectors_includes_refreshed_and_updated_assets(monkeypatch) -> None:
    scanner = IndexScanner(_DbStub([]), metadata_service=object(), scan_lock=asyncio.Lock())
    scanner.set_vector_services(vector_service=object(), vector_searcher=None)

    captured = {"asset_ids": None}

    async def _fake_index(*, asset_ids):
        captured["asset_ids"] = list(asset_ids)

    monkeypatch.setattr(scanner, "_index_missing_asset_vectors", _fake_index)

    scanner._schedule_prepared_vector_index(
        prepared=[
            {"action": "refresh", "asset_id": 4},
            {"action": "updated", "asset_id": 5},
            {"action": "skipped", "asset_id": 6},
            {"action": "updated", "asset_id": 4},
        ],
        prev_added_count=1,
        added_ids=[3, 7, 5],
    )
    await asyncio.sleep(0)

    assert captured["asset_ids"] == [7, 5, 4]


def test_is_fatal_db_error_uses_exception_type_not_message() -> None:
    assert scanner_mod._is_fatal_db_error(sqlite3.DatabaseError("disk image malformed")) is True
    assert scanner_mod._is_fatal_db_error(sqlite3.OperationalError("database is locked")) is False
    assert scanner_mod._is_fatal_db_error(RuntimeError("database is locked")) is False


def test_vector_index_concurrency_reads_env(monkeypatch) -> None:
    monkeypatch.setenv("MJR_VECTOR_CONCURRENCY", "5")
    assert scanner_mod._vector_index_concurrency() == 5

    monkeypatch.setenv("MJR_VECTOR_CONCURRENCY", "bad")
    assert scanner_mod._vector_index_concurrency() == scanner_mod._VECTOR_INDEX_DEFAULT_CONCURRENCY


@pytest.mark.asyncio
async def test_run_vector_index_loop_reraises_fatal_db_error(monkeypatch) -> None:
    entries = [{"asset_id": 7, "filepath": "C:/x.png", "kind": "image", "metadata_raw": None}]

    async def _boom(*_args, **_kwargs):
        raise sqlite3.DatabaseError("disk image malformed")

    monkeypatch.setenv("MJR_VECTOR_CONCURRENCY", "1")

    with pytest.raises(sqlite3.DatabaseError):
        await scanner_mod._run_vector_index_loop(object(), object(), entries, _boom)


@pytest.mark.asyncio
async def test_run_vector_index_loop_treats_locked_operational_error_as_nonfatal(monkeypatch) -> None:
    entries = [{"asset_id": 8, "filepath": "C:/y.png", "kind": "image", "metadata_raw": None}]

    async def _locked(*_args, **_kwargs):
        raise sqlite3.OperationalError("database is locked")

    monkeypatch.setenv("MJR_VECTOR_CONCURRENCY", "1")
    out = await scanner_mod._run_vector_index_loop(object(), object(), entries, _locked)
    assert out[2] == 1
