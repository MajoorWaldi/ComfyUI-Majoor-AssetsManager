import threading
from pathlib import Path
from queue import Queue

import pytest

from mjr_am_backend.features.index import fs_walker as m


class _BrokenEntry:
    name = "x.png"
    path = "x.png"

    def is_dir(self, follow_symlinks=False):
        raise OSError("x")

    def is_file(self, follow_symlinks=True):
        raise OSError("x")


@pytest.fixture(scope="session", autouse=True)
def _shutdown_walker_executor_after_session():
    yield
    try:
        m._FS_WALK_EXECUTOR.shutdown(wait=False, cancel_futures=True)
    except Exception:
        pass


def test_is_supported_file_and_candidate_paths(tmp_path: Path):
    walker = m.FileSystemWalker(scan_iops_limit=0.0)
    p = tmp_path / "a.png"
    p.write_bytes(b"x")
    q = tmp_path / "a.txt"
    q.write_text("x", encoding="utf-8")
    assert walker.is_supported_file(p) is True
    assert walker.is_supported_file(q) is False
    assert walker._next_dir(_BrokenEntry()) is None
    assert walker._candidate(_BrokenEntry()) is None


def test_scan_iops_wait_and_drain_queue(monkeypatch):
    walker = m.FileSystemWalker(scan_iops_limit=10.0)
    calls = []
    now = [1.0]

    def _perf():
        return now[0]

    def _sleep(dt):
        calls.append(dt)
        now[0] += dt

    monkeypatch.setattr(m.time, "perf_counter", _perf)
    monkeypatch.setattr(m.time, "sleep", _sleep)
    walker._scan_iops_wait()
    walker._scan_iops_wait()
    assert calls and calls[0] >= 0

    q = Queue()
    q.put(Path("a"))
    q.put(Path("b"))
    out = m.FileSystemWalker.drain_queue(q, max_items=2)
    assert len(out) == 2


def test_walk_and_enqueue_handles_stop_and_sentinel(monkeypatch, tmp_path: Path):
    walker = m.FileSystemWalker(scan_iops_limit=0.0)
    q = Queue()
    stop = threading.Event()

    monkeypatch.setattr(walker, "iter_files", lambda *args, **kwargs: [tmp_path / "a.png", tmp_path / "b.png"])
    stop.set()
    walker.walk_and_enqueue(tmp_path, recursive=True, stop_event=stop, q=q)
    items = []
    while not q.empty():
        items.append(q.get())
    assert items == [None]


class _NonFileEntry:
    """Entry whose is_file() returns False (e.g., a socket or broken symlink)."""
    name = "x.png"
    path = "x.png"

    def is_dir(self, follow_symlinks=False):
        return False

    def is_file(self, follow_symlinks=True):
        return False


class _FileEntryNotSupported:
    """Entry whose is_file() returns True but is_supported_file() would return False."""
    name = "x.exe"
    path = "x.exe"

    def is_dir(self, follow_symlinks=False):
        return False

    def is_file(self, follow_symlinks=True):
        return True


def test_candidate_returns_none_when_entry_is_not_file() -> None:
    """Line 148 — entry.is_file() returns False → _candidate returns None."""
    walker = m.FileSystemWalker(scan_iops_limit=0.0)
    assert walker._candidate(_NonFileEntry()) is None


def test_candidate_returns_none_for_unsupported_file() -> None:
    """Line 157 — is_file=True but is_supported_file returns False → returns None."""
    walker = m.FileSystemWalker(scan_iops_limit=0.0)
    # .exe is not a supported extension
    result = walker._candidate(_FileEntryNotSupported())
    assert result is None


def test_is_supported_file_no_extension_falls_back_to_classify_file() -> None:
    """Line 133 — path with no extension → falls back to classify_file."""
    walker = m.FileSystemWalker(scan_iops_limit=0.0)
    # A path with no extension — classify_file will return "unknown"
    result = walker.is_supported_file(Path("noextension"))
    assert result is False


def test_iter_files_recursive_handles_permission_error(tmp_path: Path) -> None:
    """Lines 117-118 — OSError/PermissionError from scandir → continue."""
    walker = m.FileSystemWalker(scan_iops_limit=0.0)

    real_scandir = __import__("os").scandir

    scan_count = [0]

    class _FakeScanDirCtx:
        def __enter__(self):
            scan_count[0] += 1
            if scan_count[0] == 1:
                raise OSError("permission denied")
            return iter([])

        def __exit__(self, *args):
            pass

    import os
    original = os.scandir

    def _fake_scandir(path):
        return _FakeScanDirCtx()

    old_scandir = m.os.scandir
    m.os.scandir = _fake_scandir
    try:
        files = list(walker.iter_files(tmp_path, recursive=True))
    finally:
        m.os.scandir = old_scandir

    # Should have continued gracefully (no exception propagated)
    assert isinstance(files, list)


def test_drain_queue_invalid_max_items_falls_back_to_one() -> None:
    """Lines 201-202 — invalid max_items (non-integer string) → limit=1."""
    q = Queue()
    q.put(Path("a"))
    q.put(Path("b"))
    # "bad" triggers ValueError in int("bad" or 1) path
    out = m.FileSystemWalker.drain_queue(q, max_items="bad")
    # With limit=1, only the first item should be returned
    assert len(out) == 1
