import asyncio
from pathlib import Path

import pytest
from mjr_am_backend.routes.handlers import scan as scan_mod


def test_is_db_malformed_result_detects_known_messages() -> None:
    class _Res:
        ok = False
        error = "database disk image is malformed"

    assert scan_mod._is_db_malformed_result(_Res())
    assert not scan_mod._is_db_malformed_result(None)


def test_normalize_upload_extension() -> None:
    assert scan_mod._normalize_upload_extension("PNG") == ".png"
    assert scan_mod._normalize_upload_extension(".webp") == ".webp"
    assert scan_mod._normalize_upload_extension("") == ""


def test_validate_upload_filename_rejects_unsafe_names() -> None:
    assert scan_mod._validate_upload_filename("ok.png") == "ok.png"
    # Parent segments are collapsed to basename by Path(...).name in current implementation.
    assert scan_mod._validate_upload_filename("../x.png") == "x.png"
    assert scan_mod._validate_upload_filename(".hidden") is None


def test_files_equal_content_and_resolve_stage_destination(tmp_path: Path) -> None:
    src = tmp_path / "src.png"
    same = tmp_path / "same.png"
    diff = tmp_path / "diff.png"
    src.write_bytes(b"abc")
    same.write_bytes(b"abc")
    diff.write_bytes(b"xyz")

    assert scan_mod._files_equal_content(src, same)
    assert not scan_mod._files_equal_content(src, diff)

    reused = scan_mod._resolve_stage_destination(tmp_path, "same.png", src)
    assert reused.reused_existing is True
    assert reused.path.name == "same.png"

    renamed = scan_mod._resolve_stage_destination(tmp_path, "diff.png", src)
    assert renamed.reused_existing is False
    assert renamed.path.name.startswith("diff_")


def test_resolve_scan_root_validates_directory(tmp_path: Path) -> None:
    ok = scan_mod._resolve_scan_root(str(tmp_path))
    assert ok.ok

    missing = scan_mod._resolve_scan_root(str(tmp_path / "missing"))
    assert not missing.ok
    assert missing.code == "DIR_NOT_FOUND"


def test_allowed_upload_exts_adds_env(monkeypatch) -> None:
    monkeypatch.setenv("MJR_UPLOAD_EXTRA_EXT", "abc,.def")
    allowed = scan_mod._allowed_upload_exts()
    assert ".abc" in allowed
    assert ".def" in allowed


def test_unique_upload_destination_and_cleanup(tmp_path: Path) -> None:
    existing = tmp_path / "x.png"
    existing.write_bytes(b"1")
    out = scan_mod._unique_upload_destination(tmp_path, "x.png", ".png")
    assert out.name.startswith("x_")

    tmp = tmp_path / ".upload_tmp.png"
    tmp.write_bytes(b"z")
    scan_mod._cleanup_temp_upload_file(None, str(tmp))
    assert not tmp.exists()


@pytest.mark.asyncio
async def test_write_multipart_file_atomic_success(tmp_path: Path, monkeypatch) -> None:
    class _Field:
        def __init__(self, chunks):
            self._chunks = list(chunks)
            self._i = 0

        async def read_chunk(self, size=None):
            _ = size
            if self._i >= len(self._chunks):
                return b""
            c = self._chunks[self._i]
            self._i += 1
            return c

    monkeypatch.setattr(scan_mod, "_MAX_UPLOAD_SIZE", 1024 * 1024)
    res = await scan_mod._write_multipart_file_atomic(tmp_path, "ok.png", _Field([b"ab", b"cd"]))
    assert res.ok
    assert isinstance(res.data, Path)
    assert res.data.exists()
    assert res.data.read_bytes() == b"abcd"


@pytest.mark.asyncio
async def test_write_multipart_file_atomic_rejects_disallowed_ext(tmp_path: Path) -> None:
    class _Field:
        async def read_chunk(self, size=None):
            _ = size
            return b""

    res = await scan_mod._write_multipart_file_atomic(tmp_path, "bad.exe", _Field())
    assert not res.ok
    assert res.code == "INVALID_INPUT"


def test_missing_asset_row_and_collect(tmp_path: Path) -> None:
    missing_file = tmp_path / "missing.png"
    existing_file = tmp_path / "existing.png"
    existing_file.write_bytes(b"x")

    rows = [
        {"id": 1, "filepath": str(missing_file)},
        {"id": 2, "filepath": str(existing_file)},
        {"id": None, "filepath": str(missing_file)},
        "bad",
    ]
    out = scan_mod._collect_missing_asset_rows(rows)
    assert out == [(1, str(missing_file))]


@pytest.mark.asyncio
async def test_delete_missing_asset_rows_executes_deletes() -> None:
    calls = []

    class _Tx:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

    class _Db:
        def atransaction(self, mode="immediate"):
            assert mode == "immediate"
            return _Tx()

        async def aexecute(self, sql, params):
            calls.append((sql, params))

    await scan_mod._delete_missing_asset_rows(_Db(), [(5, "/x.png")])
    assert len(calls) == 3


@pytest.mark.asyncio
async def test_maybe_schedule_consistency_check_obeys_cooldown(monkeypatch) -> None:
    scheduled = {"n": 0}

    def _fake_create_task(coro):
        scheduled["n"] += 1
        coro.close()
        return None

    monkeypatch.setattr(scan_mod.asyncio, "create_task", _fake_create_task)
    monkeypatch.setattr(scan_mod.time, "time", lambda: 1000.0)
    monkeypatch.setattr(scan_mod, "_DB_CONSISTENCY_COOLDOWN_SECONDS", 60.0)
    scan_mod._LAST_CONSISTENCY_CHECK = 0.0

    await scan_mod._maybe_schedule_consistency_check(object())
    await scan_mod._maybe_schedule_consistency_check(object())
    assert scheduled["n"] == 1


@pytest.mark.asyncio
async def test_schedule_index_task_runs_function() -> None:
    called = {"n": 0}
    done = asyncio.Event()

    async def _fn():
        called["n"] += 1
        done.set()

    scan_mod._schedule_index_task(_fn)
    await asyncio.wait_for(done.wait(), timeout=1.0)
    assert called["n"] == 1
