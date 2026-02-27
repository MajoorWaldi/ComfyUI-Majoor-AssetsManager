import asyncio
from pathlib import Path
from types import SimpleNamespace

import pytest

from mjr_am_backend.features.index import watcher as w


class _FakeTimer:
    def __init__(self):
        self.cancelled = False

    def cancel(self):
        self.cancelled = True


class _FakeLoop:
    def __init__(self):
        self.calls = []

    def call_later(self, delay, fn):
        self.calls.append((delay, fn))
        return _FakeTimer()


class _FakeObserver:
    def __init__(self):
        self.started = False
        self.stopped = False
        self.joined = False
        self.scheduled = []
        self.unscheduled = []

    def schedule(self, handler, path, recursive=True):
        watch = {"handler": handler, "path": path, "recursive": recursive}
        self.scheduled.append(watch)
        return watch

    def unschedule(self, watch):
        self.unscheduled.append(watch)

    def start(self):
        self.started = True

    def stop(self):
        self.stopped = True

    def join(self, timeout=0):
        _ = timeout
        self.joined = True


@pytest.fixture(autouse=True)
def _reset_watcher_globals():
    w._RECENT_GENERATED.clear()
    w._STREAM_EVENTS.clear()
    w._STREAM_TOTAL_FILES = 0
    w._LAST_STREAM_ALERT_TIME = 0.0
    yield
    w._RECENT_GENERATED.clear()
    w._STREAM_EVENTS.clear()
    w._STREAM_TOTAL_FILES = 0
    w._LAST_STREAM_ALERT_TIME = 0.0


@pytest.fixture
def handler(monkeypatch):
    async def _ready(_files):
        return None

    async def _removed(_files):
        return None

    async def _moved(_moves):
        return None

    monkeypatch.setattr(w, "get_watcher_settings", lambda: SimpleNamespace(debounce_ms=100, dedupe_ttl_ms=200))
    return w.DebouncedWatchHandler(_ready, _removed, _moved, _FakeLoop(), debounce_ms=100, dedupe_ttl_ms=500)


def test_recent_generated_roundtrip_and_prune(monkeypatch):
    monkeypatch.setattr(w.time, "time", lambda: 1000.0)
    w.mark_recent_generated(["C:/a.png", ""]) 
    assert w.is_recent_generated("C:/a.png") is True

    monkeypatch.setattr(w.time, "time", lambda: 1000.0 + w._RECENT_GENERATED_TTL_S + 1)
    assert w.is_recent_generated("C:/a.png") is False


def test_normalize_recent_key_handles_error(monkeypatch):
    monkeypatch.setattr(w.os.path, "normpath", lambda _p: (_ for _ in ()).throw(RuntimeError("x")))
    assert w._normalize_recent_key("x") == "x"


def test_stream_event_helpers(monkeypatch):
    monkeypatch.setattr(w, "WATCHER_STREAM_ALERT_THRESHOLD", 3)
    monkeypatch.setattr(w, "WATCHER_STREAM_ALERT_WINDOW_SECONDS", 5.0)
    monkeypatch.setattr(w, "WATCHER_STREAM_ALERT_COOLDOWN_SECONDS", 0.0)
    monkeypatch.setattr(w.time, "time", lambda: 100.0)

    w._record_flush_volume(2)
    assert w._STREAM_TOTAL_FILES == 2
    assert w._should_emit_stream_alert(100.0) is False

    w._record_flush_volume(2)
    assert w._STREAM_TOTAL_FILES == 4
    assert w._should_emit_stream_alert(100.0) is True

    w._prune_stream_events(110.0, 5.0)
    assert w._STREAM_TOTAL_FILES == 0


def test_apply_flush_limit(monkeypatch):
    monkeypatch.setattr(w, "WATCHER_FLUSH_MAX_FILES", 2)
    assert w._apply_flush_limit(["a", "b", "c"]) == ["a", "b"]


def test_handler_path_support_and_ignore(handler):
    assert handler._is_supported("x.png") is True
    assert handler._is_supported("x.txt") is False
    assert handler._is_ignored_path("/tmp/.git/a.png") is True
    assert handler._is_ignored_path("/tmp/ok/a.png") is False


def test_handler_normalize_path_fallback(handler, monkeypatch):
    monkeypatch.setattr(w.os.path, "normpath", lambda _p: (_ for _ in ()).throw(RuntimeError("x")))
    assert handler._normalize_path("A") == "A"


def test_handler_moved_file_mode_matrix():
    assert w.DebouncedWatchHandler._moved_file_mode(src_ok=False, dst_ok=False) == "ignore"
    assert w.DebouncedWatchHandler._moved_file_mode(src_ok=True, dst_ok=False) == "delete"
    assert w.DebouncedWatchHandler._moved_file_mode(src_ok=False, dst_ok=True) == "create"
    assert w.DebouncedWatchHandler._moved_file_mode(src_ok=True, dst_ok=True) == "move"


def test_handler_pending_count(handler):
    handler._pending["a"] = 1.0
    handler._overflow["b"] = 1.0
    assert handler.get_pending_count() == 2


def test_handle_file_rejects_and_adds(handler):
    handler._handle_file("")
    handler._handle_file("/tmp/.git/a.png")
    handler._handle_file("/tmp/a.txt")
    assert not handler._pending

    handler._handle_file("/tmp/a.png")
    assert len(handler._pending) == 1


def test_handle_deleted_and_emit_paths(monkeypatch):
    removed = []

    async def _ready(_files):
        return None

    async def _removed(paths):
        removed.extend(paths)

    h = w.DebouncedWatchHandler(_ready, _removed, None, _FakeLoop(), debounce_ms=100, dedupe_ttl_ms=200)
    calls = []

    def _run_coroutine_threadsafe(coro, loop):
        calls.append((coro, loop))
        close = getattr(coro, "close", None)
        if callable(close):
            close()

    monkeypatch.setattr(w.asyncio, "run_coroutine_threadsafe", _run_coroutine_threadsafe)

    h._handle_deleted_file("x.txt")
    h._handle_deleted_file("x.png")
    assert len(calls) == 1


def test_handle_moved_file_paths(monkeypatch):
    seen = {"removed": [], "moved": [], "new": []}

    async def _ready(_files):
        return None

    async def _removed(paths):
        seen["removed"].extend(paths)

    async def _moved(moves):
        seen["moved"].extend(moves)

    h = w.DebouncedWatchHandler(_ready, _removed, _moved, _FakeLoop(), debounce_ms=100, dedupe_ttl_ms=200)
    monkeypatch.setattr(h, "_handle_file", lambda p: seen["new"].append(p))
    monkeypatch.setattr(h, "_emit_removed_files", lambda p: seen["removed"].extend(p))
    monkeypatch.setattr(h, "_emit_moved_files", lambda m: (seen["moved"].extend(m), True)[1])

    h._handle_moved_file("a.txt", "b.txt")
    h._handle_moved_file("a.png", "b.txt")
    h._handle_moved_file("a.txt", "b.png")
    h._handle_moved_file("a.png", "b.png")

    assert seen["removed"]
    assert seen["new"]
    assert seen["moved"]


@pytest.mark.asyncio
async def test_flush_pipeline_filters_backpressure_and_mark(monkeypatch, handler):
    monkeypatch.setattr(w, "WATCHER_FLUSH_MAX_FILES", 2)
    monkeypatch.setattr(w, "MAX_FILE_SIZE", 10_000)
    monkeypatch.setattr(w.os.path, "getsize", lambda p: 100 if "ok" in p else 0)
    handler._pending = {
        "/tmp/ok1.png": 1,
        "/tmp/ok2.png": 1,
        "/tmp/ok3.png": 1,
        "/tmp/no.txt": 1,
    }

    flushed = []

    async def _ready(files):
        flushed.extend(files)

    handler._on_files_ready = _ready
    await handler._flush()

    assert len(flushed) == 2
    assert handler._overflow


def test_filter_flush_candidates_size_and_recent(monkeypatch, handler):
    monkeypatch.setattr(
        w.os.path,
        "getsize",
        lambda p: 99999999 if p.endswith("big.png") else (1 if p.endswith(".png") else 99999999),
    )
    monkeypatch.setattr(w, "MIN_FILE_SIZE", 1)
    monkeypatch.setattr(w, "MAX_FILE_SIZE", 100)
    monkeypatch.setattr(w, "_is_recent_generated", lambda p: p.endswith("skip.png"))

    out = handler._filter_flush_candidates(["a.png", "skip.png", "x.txt", "big.png"])
    assert out == ["a.png"]


def test_output_watcher_helpers_grouping_and_split():
    async def _index(_files, _base, _source, _rid):
        return None

    ow = w.OutputWatcher(_index)
    ow._watched_paths = {
        "1": {"path": "C:/root", "source": "output", "root_id": "r1", "watch": object()},
        "2": {"path": "C:/root/sub", "source": "output", "root_id": "r2", "watch": object()},
    }

    best = ow._best_watched_entry_for_path("C:/root/sub/a.png")
    assert best and best["root_id"] == "r2"

    grouped = ow._group_files_by_watched_root(["C:/root/sub/a.png", "C:/root/b.png"])
    assert "C:/root/sub" in grouped
    assert "C:/root" in grouped

    moves = ow._group_moves_by_watched_root([("a", "C:/root/sub/x.png"), ("bad",)])
    assert "C:/root/sub" in moves

    src, dst = ow._split_move_pairs([("a", "b"), ("c",), "x"])
    assert src == ["a"] and dst == ["b"]


@pytest.mark.asyncio
async def test_output_watcher_dispatch_and_fallback():
    idx, rem, mov = [], [], []

    async def _index(files, base, source, rid):
        idx.append((files, base, source, rid))

    async def _remove(files, base, source, rid):
        rem.append((files, base, source, rid))

    async def _move(moves, base, source, rid):
        mov.append((moves, base, source, rid))

    ow = w.OutputWatcher(_index, _remove, _move)
    grouped = {"C:/r": {"files": ["a"], "source": "output", "root_id": "r1"}}
    await ow._dispatch_file_groups(grouped, _index, "index")
    assert idx

    await ow._dispatch_move_groups({"C:/r": {"moves": [("a", "b")], "source": "output", "root_id": "r1"}})
    assert mov

    ow2 = w.OutputWatcher(_index, _remove, None)
    async def _ready(files):
        idx.append((files, "ready", None, None))
    async def _removed(files):
        rem.append((files, "removed", None, None))
    ow2._handle_ready_files = _ready
    ow2._handle_removed_files = _removed
    await ow2._handle_move_fallback([("a", "b")])
    assert any(x[1] == "ready" for x in idx)
    assert any(x[1] == "removed" for x in rem)


@pytest.mark.asyncio
async def test_output_watcher_start_add_remove_stop(monkeypatch, tmp_path: Path):
    d1 = tmp_path / "a"
    d2 = tmp_path / "b"
    d1.mkdir()
    d2.mkdir()

    fake_observer = _FakeObserver()
    monkeypatch.setattr(w, "Observer", lambda: fake_observer)

    async def _index(_files, _base, _source, _rid):
        return None

    ow = w.OutputWatcher(_index)
    await ow.start([{"path": str(d1), "source": "output", "root_id": "r1"}, {"path": str(tmp_path / "missing")}], loop=asyncio.get_running_loop())

    assert ow.is_running is True
    assert fake_observer.started is True
    assert ow.watched_directories

    ow.add_path(str(d2), source="output", root_id="r2")
    assert any(Path(p) == d2 for p in ow.watched_directories)

    ow.remove_path(str(d2))
    assert not any(Path(p) == d2 for p in ow.watched_directories)

    await ow.stop()
    assert ow.is_running is False
    assert fake_observer.stopped is True


def test_output_watcher_misc_helpers():
    async def _index(_files, _base, _source, _rid):
        return None

    ow = w.OutputWatcher(_index)
    assert ow._normalize_source(" OutPut ") == "output"
    assert ow._normalize_source(None) is None
    ow._allowed_sources = {"output"}
    assert ow._allows_source("output") is True
    assert ow._allows_source("input") is False
    assert ow._allows_source(None) is False


@pytest.mark.asyncio
async def test_output_watcher_handler_passthroughs():
    async def _index(_files, _base, _source, _rid):
        return None

    ow = w.OutputWatcher(_index)
    assert ow.flush_pending() is False
    assert ow.get_pending_count() == 0

    class _H:
        def refresh_runtime_settings(self):
            return None

        def flush_pending(self):
            return True

        def get_pending_count(self):
            return 7

    ow._handler = _H()
    ow.refresh_runtime_settings()
    assert ow.flush_pending() is True
    assert ow.get_pending_count() == 7


def test_is_under_path_variants(monkeypatch):
    root = w.os.path.normpath("C:/a")
    child = w.os.path.normpath("C:/a/b")
    other = w.os.path.normpath("C:/x")
    assert w._is_under_path(child, root) is True
    assert w._is_under_path(other, root) is False

    monkeypatch.setattr(w.os.path, "commonpath", lambda _v: (_ for _ in ()).throw(ValueError("x")))
    assert w._is_under_path(child, root) is True
