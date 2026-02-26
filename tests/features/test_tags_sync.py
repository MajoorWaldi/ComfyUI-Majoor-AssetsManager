from __future__ import annotations

from pathlib import Path
from types import SimpleNamespace

from mjr_am_backend.features.tags import sync
from mjr_am_backend.shared import ErrorCode, Result


class _ExifOk:
    def is_available(self):
        return True

    def write(self, *_args, **_kwargs):
        return Result.Ok(True)


class _ExifFail:
    def is_available(self):
        return True

    def write(self, *_args, **_kwargs):
        return Result.Err(ErrorCode.EXIFTOOL_ERROR, "nope")


def test_windows_rating_percent_clamp():
    assert sync._windows_rating_percent(-10) == 0
    assert sync._windows_rating_percent(6) == 99
    assert sync._windows_rating_percent(3) == 50


def test_normalize_tags_filters_and_dedupes():
    long_tag = "x" * (sync.MAX_TAG_LENGTH + 1)
    assert sync._normalize_tags([" a ", "", "a", 123, long_tag, "b"]) == ["a", "b"]


def test_build_exif_payload_empty_tags():
    payload = sync._build_exiftool_rating_tags_payload(5, [])
    assert payload["XMP:Rating"] == 5
    assert payload["XMP:Subject"] == []
    assert payload["Keywords"] == ""


def test_validate_exiftool_file_path_not_found(tmp_path: Path):
    res = sync._validate_exiftool_file_path(str(tmp_path / "missing.png"))
    assert not res.ok
    assert res.code == ErrorCode.NOT_FOUND


def test_exiftool_available_guard():
    assert sync._exiftool_available(_ExifOk()) is True
    assert sync._exiftool_available(None) is False


def test_write_exiftool_payload_error_wrap():
    class _ExifRaise:
        def write(self, *_args, **_kwargs):
            raise RuntimeError("boom")

    res = sync._write_exiftool_payload(_ExifRaise(), Path("x"), {})
    assert not res.ok
    assert res.code == ErrorCode.EXIFTOOL_ERROR


def test_write_exif_rating_tags_tool_missing(tmp_path: Path):
    class _ExifMissing:
        def is_available(self):
            return False

    p = tmp_path / "f.png"
    p.write_bytes(b"x")
    res = sync.write_exif_rating_tags(_ExifMissing(), str(p), 1, ["a"])
    assert not res.ok
    assert res.code == ErrorCode.TOOL_MISSING


def test_write_exif_rating_tags_success(tmp_path: Path, monkeypatch):
    p = tmp_path / "f.png"
    p.write_bytes(b"x")
    calls: list[tuple[str, float | None]] = []
    monkeypatch.setattr(sync, "_get_file_mtime", lambda _p: 123.0)
    monkeypatch.setattr(sync, "_restore_file_mtime", lambda path, mt: calls.append((str(path), mt)))
    res = sync.write_exif_rating_tags(_ExifOk(), str(p), 10, [" a ", "a"])
    assert res.ok
    assert calls and calls[0][1] == 123.0


def test_write_windows_rating_tags_unsupported(monkeypatch):
    monkeypatch.setattr(sync, "_is_windows_os", lambda: False)
    res = sync.write_windows_rating_tags("x", 1, [])
    assert not res.ok
    assert res.code == ErrorCode.UNSUPPORTED


def test_write_windows_rating_tags_pywin32_missing(monkeypatch):
    monkeypatch.setattr(sync, "_is_windows_os", lambda: True)
    monkeypatch.setattr(sync, "_safe_import_win32com", lambda: None)
    res = sync.write_windows_rating_tags("x", 1, [])
    assert not res.ok
    assert res.code == ErrorCode.TOOL_MISSING


def test_write_windows_rating_tags_success(tmp_path: Path, monkeypatch):
    p = tmp_path / "f.png"
    p.write_bytes(b"x")
    assert p.is_file()
    monkeypatch.setattr(sync, "_is_windows_os", lambda: True)
    monkeypatch.setattr(sync, "_safe_import_win32com", lambda: object())
    monkeypatch.setattr(sync, "_co_initialize_pythoncom", lambda: SimpleNamespace(CoUninitialize=lambda: None))
    monkeypatch.setattr(sync, "_shell_write_for_path", lambda *_args, **_kwargs: None)
    monkeypatch.setattr(sync, "_get_file_mtime", lambda _p: 1.0)
    monkeypatch.setattr(sync, "_restore_file_mtime", lambda *_args, **_kwargs: None)
    res = sync.write_windows_rating_tags(str(p), 5, ["a"])
    assert res.ok


def test_write_windows_rating_tags_failure_wrap(tmp_path: Path, monkeypatch):
    p = tmp_path / "f.png"
    p.write_bytes(b"x")
    assert p.is_file()
    monkeypatch.setattr(sync, "_is_windows_os", lambda: True)
    monkeypatch.setattr(sync, "_safe_import_win32com", lambda: object())
    monkeypatch.setattr(sync, "_co_initialize_pythoncom", lambda: None)
    monkeypatch.setattr(sync, "_shell_write_for_path", lambda *_args, **_kwargs: (_ for _ in ()).throw(RuntimeError("bad")))
    res = sync.write_windows_rating_tags(str(p), 2, [])
    assert not res.ok
    assert res.code == ErrorCode.UPDATE_FAILED


def test_discover_shell_indices_and_cache(monkeypatch):
    class _Folder:
        def GetDetailsOf(self, _item, idx):
            if idx == 5:
                return "rating"
            if idx == 6:
                return "tags"
            return ""

    sync._WIN_RATING_IDX = None
    sync._WIN_TAGS_IDX = None
    monkeypatch.setattr(sync, "WIN_SHELL_COL_SCAN_MAX", 8)
    r, t = sync._resolve_shell_indices(_Folder())
    assert (r, t) == (5, 6)
    r2, t2 = sync._resolve_shell_indices(_Folder())
    assert (r2, t2) == (5, 6)


def test_shell_write_for_path_calls_setdetails(tmp_path: Path, monkeypatch):
    p = tmp_path / "x.png"
    p.write_bytes(b"x")
    writes: list[tuple[int, str]] = []

    class _Folder:
        def ParseName(self, _name):
            return object()

        def GetDetailsOf(self, _item, _idx):
            return ""

        def SetDetailsOf(self, _item, idx, val):
            writes.append((idx, val))

    class _Shell:
        def Namespace(self, _parent):
            return _Folder()

    class _Com:
        def Dispatch(self, _name):
            return _Shell()

    monkeypatch.setattr(sync, "_resolve_shell_indices", lambda _f: (1, 2))
    sync._shell_write_for_path(_Com(), p, 50, ["a", "b"])
    assert (1, "50") in writes
    assert (2, "a; b") in writes


def test_worker_enqueue_coalesce_and_cap(monkeypatch):
    class _DummyThread:
        def __init__(self, *args, **kwargs):
            self.joined = False

        def start(self):
            return None

        def join(self, timeout=None):
            self.joined = True

    monkeypatch.setattr(sync.threading, "Thread", _DummyThread)
    monkeypatch.setattr(sync, "RT_SYNC_PENDING_MAX", 2)
    w = sync.RatingTagsSyncWorker(_ExifOk())
    w.enqueue("a", 1, ["x"], "on")
    w.enqueue("b", 1, ["x"], "on")
    w.enqueue("c", 1, ["x"], "on")
    assert len(w._pending) <= 2
    w.enqueue("c", 5, ["y"], "both")
    assert w._pending["c"].mode == "on"
    w.stop()


def test_worker_process_off_and_fallback(monkeypatch):
    class _DummyThread:
        def __init__(self, *args, **kwargs):
            return None

        def start(self):
            return None

        def join(self, timeout=None):
            return None

    monkeypatch.setattr(sync.threading, "Thread", _DummyThread)
    monkeypatch.setattr(sync.time, "sleep", lambda *_args, **_kwargs: None)
    w = sync.RatingTagsSyncWorker(_ExifOk())

    task_off = sync.RatingTagsSyncTask("x", 1, [], "off")
    w._process(task_off)

    monkeypatch.setattr(sync, "write_exif_rating_tags", lambda *_args, **_kwargs: Result.Err(ErrorCode.UPDATE_FAILED, "x"))
    called = {"win": 0}

    def _win(*_args, **_kwargs):
        called["win"] += 1
        return Result.Ok(True)

    monkeypatch.setattr(sync, "write_windows_rating_tags", _win)
    task_on = sync.RatingTagsSyncTask("x", 1, ["a"], "on")
    w._process(task_on)
    assert called["win"] == 1

