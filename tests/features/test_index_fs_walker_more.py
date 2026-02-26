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
