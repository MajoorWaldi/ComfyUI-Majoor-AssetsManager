"""
File system watcher for manual file additions/modifications.

Watches output and custom root directories for files added outside of ComfyUI
(e.g., manual copies, external tools). Does NOT conflict with entry.js which
handles ComfyUI executed events.
"""
import asyncio
import os
import time
from collections import deque
from collections.abc import Awaitable, Callable, Coroutine
from pathlib import Path
from threading import Lock
from typing import (
    Any,
    cast,
)

from watchdog.events import (
    DirCreatedEvent,
    FileCreatedEvent,
    FileDeletedEvent,
    FileMovedEvent,
    FileSystemEventHandler,
)
from watchdog.observers import Observer

from ...config import (
    WATCHER_DEBOUNCE_MS,
    WATCHER_DEDUPE_TTL_MS,
    WATCHER_FLUSH_MAX_FILES,
    WATCHER_MAX_FILE_SIZE_BYTES,
    WATCHER_MAX_FLUSH_CONCURRENCY,
    WATCHER_MIN_FILE_SIZE_BYTES,
    WATCHER_PENDING_MAX,
    WATCHER_STREAM_ALERT_COOLDOWN_SECONDS,
    WATCHER_STREAM_ALERT_THRESHOLD,
    WATCHER_STREAM_ALERT_WINDOW_SECONDS,
)
from ...shared import EXTENSIONS, get_logger
from ..watcher_settings import get_watcher_settings

logger = get_logger(__name__)

# Extensions explicitly excluded even if they ever appear in EXTENSIONS
EXCLUDED_EXTENSIONS: set[str] = {".psd", ".json", ".txt", ".csv", ".db", ".sqlite", ".log"}

# Supported extensions (flattened)
SUPPORTED_EXTENSIONS: set[str] = set()
try:
    for kind in ("image", "video", "audio"):
        for ext in (EXTENSIONS or {}).get(kind, []):
            ext_lower = str(ext).lower()
            if ext_lower not in EXCLUDED_EXTENSIONS:
                SUPPORTED_EXTENSIONS.add(ext_lower)
except Exception:
    SUPPORTED_EXTENSIONS = {
        ".png",
        ".jpg",
        ".jpeg",
        ".webp",
        ".gif",
        ".mp4",
        ".mov",
        ".webm",
        ".mkv",
        ".wav",
        ".mp3",
        ".flac",
        ".ogg",
        ".m4a",
        ".aac",
    }

# Directories to always ignore (case-insensitive on Windows)
IGNORED_DIRS = {
    "_mjr_index",
    ".majoor",
    "__pycache__",
    ".git",
    "node_modules",
    ".thumbs",
    ".cache",
}

# Minimum file size (bytes) to avoid indexing partial/temp writes
MIN_FILE_SIZE = max(0, int(WATCHER_MIN_FILE_SIZE_BYTES))
# Maximum file size (bytes) to avoid indexing oversized files
MAX_FILE_SIZE = max(0, int(WATCHER_MAX_FILE_SIZE_BYTES))
_RECENT_GENERATED_TTL_S = 30.0
_RECENT_GENERATED_LOCK = Lock()
_RECENT_GENERATED: dict[str, float] = {}
_MAX_PENDING_FILES = max(0, WATCHER_PENDING_MAX)
_STREAM_EVENTS: deque[tuple[float, int]] = deque()
_STREAM_TOTAL_FILES = 0
_STREAM_LOCK = Lock()
_LAST_STREAM_ALERT_TIME = 0.0
_PENDING_LIMIT_WARN_INTERVAL = 30.0


class DebouncedWatchHandler(FileSystemEventHandler):
    """
    Handles file system events with deduplication and debouncing.

    - Ignores non-media files and internal directories
    - Deduplicates rapid events for the same file
    - Batches files before triggering indexing
    - Only reacts to file creation (not modification noise)
    """

    def __init__(
        self,
        on_files_ready: Callable[[list], Awaitable[None]],
        on_files_removed: Callable[[list], Awaitable[None]] | None,
        on_files_moved: Callable[[list], Awaitable[None]] | None,
        loop: asyncio.AbstractEventLoop,
        debounce_ms: int = 500,
        dedupe_ttl_ms: int = 3000,
        flush_concurrency: int = 1,
    ):
        super().__init__()
        self._on_files_ready = on_files_ready
        self._on_files_removed = on_files_removed
        self._on_files_moved = on_files_moved
        self._loop = loop
        self._debounce_s = debounce_ms / 1000.0
        self._dedupe_ttl_s = dedupe_ttl_ms / 1000.0

        self._lock = Lock()
        self._pending: dict[str, float] = {}  # filepath -> timestamp
        self._overflow: dict[str, float] = {}  # overflow queue when pending cap is reached
        self._recent: dict[str, float] = {}   # filepath -> last processed timestamp
        self._flush_timer: asyncio.TimerHandle | None = None
        concurrency = max(1, flush_concurrency or 1)
        self._flush_semaphore = asyncio.Semaphore(concurrency)
        self._last_pending_warning = 0.0
        self._refresh_runtime_settings()

    def _is_ignored_path(self, path: str) -> bool:
        """Check if path is inside an ignored directory."""
        try:
            parts = Path(path).parts
            for part in parts:
                if part.lower() in IGNORED_DIRS or part.startswith("."):
                    return True
        except Exception:
            pass
        return False

    def _is_supported(self, path: str) -> bool:
        """Check if file has a supported extension."""
        try:
            ext = Path(path).suffix.lower()
            return ext in SUPPORTED_EXTENSIONS
        except Exception:
            return False

    def _normalize_path(self, path: str) -> str:
        """Normalize path for deduplication."""
        try:
            return os.path.normcase(os.path.normpath(path))
        except Exception:
            return path

    def _refresh_runtime_settings(self) -> None:
        try:
            settings = get_watcher_settings()
            self._debounce_s = max(0.05, settings.debounce_ms / 1000.0)
            self._dedupe_ttl_s = max(0.1, settings.dedupe_ttl_ms / 1000.0)
        except Exception:
            pass

    def refresh_runtime_settings(self) -> None:
        """Expose runtime tuning for external callers."""
        self._refresh_runtime_settings()

    def flush_pending(self) -> bool:
        """
        Trigger an immediate flush of pending files.

        Returns True when a flush task was successfully scheduled.
        """
        try:
            if self._flush_timer:
                self._flush_timer.cancel()
                self._flush_timer = None
            asyncio.run_coroutine_threadsafe(self._flush(), self._loop)
            return True
        except Exception:
            return False

    def get_pending_count(self) -> int:
        """Return pending file count in debounce queue."""
        try:
            with self._lock:
                return int(len(self._pending) + len(self._overflow))
        except Exception:
            return 0

    def _maybe_log_pending_limit(self, path: str) -> None:
        now = time.time()
        if _MAX_PENDING_FILES <= 0:
            return
        if (now - self._last_pending_warning) < _PENDING_LIMIT_WARN_INTERVAL:
            return
        try:
            logger.warning(
                "Watcher pending queue capped at %d entries; deferring %s",
                _MAX_PENDING_FILES,
                path,
            )
        except Exception:
            pass
        self._last_pending_warning = now

    def on_created(self, event):
        if isinstance(event, DirCreatedEvent):
            return
        if not isinstance(event, FileCreatedEvent):
            return
        self._handle_file(str(event.src_path))

    def on_modified(self, event):
        # Modified events are needed for slow/network writes where the create event
        # happens before file content is fully available.
        try:
            if getattr(event, "is_directory", False):
                return
        except Exception:
            return
        self._handle_file(str(getattr(event, "src_path", "")))

    def on_deleted(self, event):
        if isinstance(event, FileDeletedEvent):
            self._handle_deleted_file(str(event.src_path))

    def on_moved(self, event):
        if isinstance(event, FileMovedEvent):
            self._handle_moved_file(str(event.src_path), str(event.dest_path))

    def _handle_file(self, path: str):
        """Queue a file for indexing with deduplication."""
        if not path:
            return

        self._refresh_runtime_settings()

        # Fast rejections
        if self._is_ignored_path(path):
            return
        if not self._is_supported(path):
            return
        # NOTE: _is_recent_generated is checked at flush time (not here) to avoid
        # a race condition where the watcher detects a file before the frontend
        # executed-event handler has called mark_recent_generated().

        key = self._normalize_path(path)
        now = time.time()

        with self._lock:
            # Skip if recently processed
            last = self._recent.get(key, 0)
            if last and (now - last) < self._dedupe_ttl_s:
                return

            # Prevent unbounded memory growth under bursts.
            if _MAX_PENDING_FILES > 0 and len(self._pending) >= _MAX_PENDING_FILES:
                # Keep overflow candidates for later flush instead of dropping permanently.
                if key not in self._overflow:
                    self._overflow[key] = now
                self._maybe_log_pending_limit(path)
                self._schedule_flush()
                return

            # Add to pending batch
            self._pending[key] = now

            # Schedule flush
            self._schedule_flush()

    def _schedule_flush(self):
        """Schedule a debounced flush of pending files."""
        try:
            self._refresh_runtime_settings()
            if self._flush_timer:
                self._flush_timer.cancel()
            self._flush_timer = self._loop.call_later(
                self._debounce_s,
                lambda: asyncio.run_coroutine_threadsafe(self._flush(), self._loop)
            )
        except Exception:
            pass

    def _handle_deleted_file(self, path: str):
        if not path:
            return
        if self._is_ignored_path(path):
            return
        if not self._is_supported(path):
            return
        if not self._on_files_removed:
            return
        key = self._normalize_path(path)
        try:
            coro = cast(Coroutine[Any, Any, None], self._on_files_removed([key]))
            asyncio.run_coroutine_threadsafe(coro, self._loop)
        except Exception:
            return

    def _handle_moved_file(self, src_path: str, dest_path: str):
        if not src_path or not dest_path:
            return
        if self._is_ignored_path(src_path) or self._is_ignored_path(dest_path):
            return
        src_ok = self._is_supported(src_path)
        dst_ok = self._is_supported(dest_path)

        src_norm = self._normalize_path(src_path)
        dst_norm = self._normalize_path(dest_path)
        mode = self._moved_file_mode(src_ok=src_ok, dst_ok=dst_ok)
        if mode == "ignore":
            return
        if mode == "delete":
            self._emit_removed_files([src_norm])
            return
        if mode == "create":
            self._handle_file(dst_norm)
            return
        if mode == "move" and self._emit_moved_files([(src_norm, dst_norm)]):
            return

        # Fallback: index new path and remove old path as separate operations.
        self._handle_file(dst_norm)
        self._emit_removed_files([src_norm])

    @staticmethod
    def _moved_file_mode(*, src_ok: bool, dst_ok: bool) -> str:
        if not src_ok and not dst_ok:
            return "ignore"
        if src_ok and not dst_ok:
            return "delete"
        if dst_ok and not src_ok:
            return "create"
        return "move"

    def _emit_removed_files(self, paths: list[str]) -> None:
        if not self._on_files_removed:
            return
        try:
            coro = cast(Coroutine[Any, Any, None], self._on_files_removed(paths))
            asyncio.run_coroutine_threadsafe(coro, self._loop)
        except Exception:
            return

    def _emit_moved_files(self, moves: list[tuple[str, str]]) -> bool:
        if not self._on_files_moved:
            return False
        try:
            coro = cast(Coroutine[Any, Any, None], self._on_files_moved(moves))
            asyncio.run_coroutine_threadsafe(coro, self._loop)
            return True
        except Exception:
            return False

    async def _flush(self):
        """Flush pending files to the indexer."""
        self._refresh_runtime_settings()
        candidates = self._drain_pending_candidates()
        if not candidates:
            return

        async with self._flush_semaphore:
            _record_flush_volume(len(candidates))
            files = self._filter_flush_candidates(candidates)
            if not files:
                return

            files = self._apply_flush_backpressure(files)
            self._mark_recent_files(files)
            try:
                await self._on_files_ready(files)
            except Exception as e:
                logger.debug("Watcher flush error: %s", e)

    def _drain_pending_candidates(self) -> list[str]:
        with self._lock:
            if not self._pending and not self._overflow:
                return []
            candidates = list(self._pending.keys())
            if self._overflow:
                candidates.extend(list(self._overflow.keys()))
            self._pending.clear()
            self._overflow.clear()
            self._flush_timer = None
            return candidates

    def _filter_flush_candidates(self, candidates: list[str]) -> list[str]:
        files: list[str] = []
        for f in candidates:
            if _is_recent_generated(f):
                continue
            if not self._is_supported_flush_file(f):
                continue
            size = self._flush_file_size_if_eligible(f)
            if size is None:
                continue
            max_size = MAX_FILE_SIZE
            if max_size > 0 and size > max_size:
                logger.debug("Watcher skipping oversized file %s (%d bytes > %d)", f, size, max_size)
                continue
            files.append(f)
        return files

    @staticmethod
    def _is_supported_flush_file(filepath: str) -> bool:
        try:
            ext = Path(filepath).suffix.lower()
            return ext not in EXCLUDED_EXTENSIONS and ext in SUPPORTED_EXTENSIONS
        except Exception:
            return False

    @staticmethod
    def _flush_file_size_if_eligible(filepath: str) -> int | None:
        try:
            size = os.path.getsize(filepath)
        except OSError:
            return None
        if size < MIN_FILE_SIZE:
            return None
        return size

    def _apply_flush_backpressure(self, files: list[str]) -> list[str]:
        if WATCHER_FLUSH_MAX_FILES <= 0 or len(files) <= WATCHER_FLUSH_MAX_FILES:
            return files
        now = time.time()
        deferred = files[WATCHER_FLUSH_MAX_FILES:]
        files = files[:WATCHER_FLUSH_MAX_FILES]
        with self._lock:
            for f in deferred:
                if f not in self._pending and f not in self._overflow:
                    self._overflow[f] = now
        try:
            logger.warning(
                "Watcher flush capped to %d files (requested %d); deferring %d for next flush.",
                WATCHER_FLUSH_MAX_FILES,
                len(files) + len(deferred),
                len(deferred),
            )
        except Exception:
            pass
        self._schedule_flush()
        return files

    def _mark_recent_files(self, files: list[str]) -> None:
        with self._lock:
            now = time.time()
            for f in files:
                self._recent[f] = now
            to_remove = [k for k, v in self._recent.items() if (now - v) > self._dedupe_ttl_s * 2]
            for k in to_remove:
                self._recent.pop(k, None)


def _normalize_recent_key(path: str) -> str:
    try:
        return os.path.normcase(os.path.normpath(path))
    except Exception:
        return str(path or "")


def _is_recent_generated(path: str) -> bool:
    key = _normalize_recent_key(path)
    if not key:
        return False
    try:
        with _RECENT_GENERATED_LOCK:
            now = time.time()
            _prune_recent_generated(now)
            return _is_recent_generated_key_locked(key, now)
    except Exception:
        return False


def _prune_recent_generated(now: float) -> None:
    if not _RECENT_GENERATED:
        return
    to_remove = [k for k, ts in _RECENT_GENERATED.items() if (now - float(ts or 0)) > _RECENT_GENERATED_TTL_S]
    for key in to_remove:
        _RECENT_GENERATED.pop(key, None)


def _is_recent_generated_key_locked(key: str, now: float) -> bool:
    ts = _RECENT_GENERATED.get(key)
    if not ts:
        return False
    return (now - float(ts or 0)) <= _RECENT_GENERATED_TTL_S


def is_recent_generated(path: str) -> bool:
    return _is_recent_generated(path)


def mark_recent_generated(paths: list[str]) -> None:
    if not paths:
        return
    now = time.time()
    try:
        with _RECENT_GENERATED_LOCK:
            for p in paths:
                key = _normalize_recent_key(p)
                if key:
                    _RECENT_GENERATED[key] = now
            if len(_RECENT_GENERATED) > 5000:
                # Drop oldest entries (best-effort)
                for k, _ in sorted(_RECENT_GENERATED.items(), key=lambda kv: kv[1])[:1000]:
                    _RECENT_GENERATED.pop(k, None)
    except Exception:
        return


def _apply_flush_limit(files: list[str]) -> list[str]:
    if WATCHER_FLUSH_MAX_FILES <= 0:
        return files
    if len(files) <= WATCHER_FLUSH_MAX_FILES:
        return files
    try:
        logger.warning(
            "Watcher flush capped to %d files (requested %d); check for bulk imports or attacks.",
            WATCHER_FLUSH_MAX_FILES,
            len(files),
        )
    except Exception:
        pass
    return files[:WATCHER_FLUSH_MAX_FILES]


def _record_flush_volume(count: int) -> None:
    global _STREAM_TOTAL_FILES, _LAST_STREAM_ALERT_TIME
    if count <= 0 or WATCHER_STREAM_ALERT_THRESHOLD <= 0 or WATCHER_STREAM_ALERT_WINDOW_SECONDS <= 0:
        return
    now = time.time()
    window = WATCHER_STREAM_ALERT_WINDOW_SECONDS
    with _STREAM_LOCK:
        _STREAM_EVENTS.append((now, count))
        _STREAM_TOTAL_FILES += count
        _prune_stream_events(now, window)
        if not _should_emit_stream_alert(now):
            return
        _LAST_STREAM_ALERT_TIME = now
        try:
            logger.warning(
                "Watcher ingest rate high: %d files in the last %.1f seconds (threshold=%d).",
                _STREAM_TOTAL_FILES,
                window,
                WATCHER_STREAM_ALERT_THRESHOLD,
            )
        except Exception:
            pass


def _prune_stream_events(now: float, window: float) -> None:
    global _STREAM_TOTAL_FILES
    cutoff_time = now - window
    while _STREAM_EVENTS and _STREAM_EVENTS[0][0] < cutoff_time:
        _, stale = _STREAM_EVENTS.popleft()
        _STREAM_TOTAL_FILES -= stale
    if _STREAM_TOTAL_FILES < 0:
        _STREAM_TOTAL_FILES = 0


def _should_emit_stream_alert(now: float) -> bool:
    if _STREAM_TOTAL_FILES < WATCHER_STREAM_ALERT_THRESHOLD:
        return False
    cooldown = max(WATCHER_STREAM_ALERT_COOLDOWN_SECONDS, 0.0)
    return cooldown <= 0 or (now - _LAST_STREAM_ALERT_TIME) >= cooldown


class OutputWatcher:
    """
    Watches output and custom root directories for manual file additions.

    Usage:
        watcher = OutputWatcher(index_callback)
        await watcher.start([{"path": "/path/to/output", "source": "output"}])
        ...
        await watcher.stop()
    """

    def __init__(
        self,
        index_callback: Callable[[list, str, str | None, str | None], Awaitable[None]],
        remove_callback: Callable[[list, str, str | None, str | None], Awaitable[None]] | None = None,
        move_callback: Callable[[list, str, str | None, str | None], Awaitable[None]] | None = None,
    ):
        """
        Args:
            index_callback: async function(filepaths, base_dir, source, root_id) to index files
        """
        self._index_callback = index_callback
        self._remove_callback = remove_callback
        self._move_callback = move_callback
        self._observer: Any | None = None
        self._handler: DebouncedWatchHandler | None = None
        self._watched_paths: dict[str, dict] = {}  # watch_key -> {path, source, root_id, watch}
        self._lock = Lock()
        self._running = False
        self._allowed_sources: set[str] = set()

    async def start(self, paths: list, loop: asyncio.AbstractEventLoop | None = None):
        """Start watching the given directories."""
        if self._running:
            return

        loop = loop or asyncio.get_event_loop()
        self._allowed_sources = set()
        on_files_ready = self._handle_ready_files
        on_files_removed = self._handle_removed_files
        on_files_moved = self._handle_moved_files

        self._handler = DebouncedWatchHandler(
            on_files_ready,
            on_files_removed,
            on_files_moved,
            loop,
            debounce_ms=WATCHER_DEBOUNCE_MS,
            dedupe_ttl_ms=WATCHER_DEDUPE_TTL_MS,
            flush_concurrency=WATCHER_MAX_FLUSH_CONCURRENCY,
        )
        self._observer = Observer()

        for path in paths:
            try:
                raw_path, source, root_id = self._resolve_watch_path(path)
                self._register_watch_path(raw_path, source=source, root_id=root_id, log_label="started")
            except Exception as e:
                logger.warning("Failed to watch %s: %s", path, e)

        if self._watched_paths:
            self._observer.start()
            self._running = True
            logger.info("File watcher started for %d directories", len(self._watched_paths))

    async def _handle_ready_files(self, files: list) -> None:
        if not files:
            return
        grouped = self._group_files_by_watched_root(files)
        await self._dispatch_file_groups(grouped, self._index_callback, "index")

    async def _handle_removed_files(self, files: list) -> None:
        if not files or not callable(self._remove_callback):
            return
        grouped = self._group_files_by_watched_root(files)
        await self._dispatch_file_groups(grouped, self._remove_callback, "remove")

    async def _handle_moved_files(self, moves: list) -> None:
        if not moves:
            return
        if callable(self._move_callback):
            await self._dispatch_move_groups(self._group_moves_by_watched_root(moves))
            return
        await self._handle_move_fallback(moves)

    async def _dispatch_move_groups(self, grouped_moves: dict[str, dict]) -> None:
        if not callable(self._move_callback):
            return
        for base_dir, payload in grouped_moves.items():
            try:
                await self._move_callback(
                    payload.get("moves") or [],
                    base_dir,
                    payload.get("source"),
                    payload.get("root_id"),
                )
            except Exception as exc:
                logger.debug("Watcher move error: %s", exc)

    async def _handle_move_fallback(self, moves: list) -> None:
        # Fallback if no move callback: reindex destination and remove source.
        try:
            src_files, dst_files = self._split_move_pairs(moves)
            if dst_files:
                await self._handle_ready_files(dst_files)
            if src_files:
                await self._handle_removed_files(src_files)
        except Exception:
            return

    @staticmethod
    def _resolve_watch_path(path: Any) -> tuple[Any, str | None, str | None]:
        if isinstance(path, dict):
            return path.get("path"), path.get("source"), path.get("root_id")
        return path, None, None

    def _register_watch_path(
        self,
        raw_path: Any,
        *,
        source: str | None,
        root_id: str | None,
        log_label: str,
    ) -> bool:
        if not self._observer or not self._handler or not raw_path:
            return False
        normalized = os.path.normpath(raw_path)
        if not os.path.isdir(normalized):
            return False
        watch = self._observer.schedule(self._handler, normalized, recursive=True)
        source_norm = self._normalize_source(source)
        if source_norm:
            self._allowed_sources.add(source_norm)
        self._watched_paths[str(id(watch))] = {
            "path": normalized,
            "source": source_norm,
            "root_id": root_id,
            "watch": watch,
        }
        logger.info("Watcher %s for: %s", log_label, normalized)
        return True

    async def stop(self):
        """Stop watching all directories."""
        if not self._running:
            return

        try:
            if self._observer:
                self._observer.stop()
                self._observer.join(timeout=2)
                self._observer = None
        except Exception as e:
            logger.debug("Watcher stop error: %s", e)

        self._watched_paths.clear()
        self._handler = None
        self._running = False
        logger.info("File watcher stopped")

    def add_path(self, path: str, *, source: str | None = None, root_id: str | None = None):
        """Add a new path to watch (e.g., when custom root is added)."""
        if not self._running or not self._observer or not self._handler:
            return

        try:
            normalized = os.path.normpath(path)
            if not os.path.isdir(normalized):
                return
            if self._is_already_watched(normalized):
                return
            source_norm = self._normalize_source(source)
            if not self._allows_source(source_norm):
                try:
                    logger.debug("Watcher ignored path (scope mismatch): %s (source=%s)", normalized, source_norm)
                except Exception:
                    pass
                return
            watch = self._observer.schedule(self._handler, normalized, recursive=True)
            self._watched_paths[str(id(watch))] = {
                "path": normalized,
                "source": source_norm,
                "root_id": root_id,
                "watch": watch,
            }
            logger.info("Watcher added: %s", normalized)
        except Exception as e:
            logger.warning("Failed to add watch for %s: %s", path, e)

    def _normalize_source(self, source: str | None) -> str | None:
        return str(source or "").strip().lower() if source is not None else None

    def _is_already_watched(self, normalized: str) -> bool:
        for entry in self._watched_paths.values():
            if entry.get("path") == normalized:
                return True
        return False

    def _best_watched_entry_for_path(self, path_value: str) -> dict | None:
        normalized_path = os.path.normcase(os.path.normpath(path_value))
        best = None
        best_len = -1
        for entry in self._watched_paths.values():
            watched = entry.get("path")
            if not watched:
                continue
            normalized_watched = os.path.normcase(os.path.normpath(watched))
            if _is_under_path(normalized_path, normalized_watched) and len(normalized_watched) > best_len:
                best = entry
                best_len = len(normalized_watched)
        return best

    def _group_files_by_watched_root(self, files: list[str]) -> dict[str, dict]:
        by_dir: dict[str, dict] = {}
        for file_path in files:
            try:
                best = self._best_watched_entry_for_path(file_path)
                if not best:
                    continue
                base = best.get("path")
                if not base:
                    continue
                key = str(base)
                if key not in by_dir:
                    by_dir[key] = {"files": [], "source": best.get("source"), "root_id": best.get("root_id")}
                by_dir[key]["files"].append(file_path)
            except Exception:
                continue
        return by_dir

    def _group_moves_by_watched_root(self, moves: list[Any]) -> dict[str, dict]:
        by_dir: dict[str, dict] = {}
        for move in moves:
            try:
                src, dst = move
            except Exception:
                continue
            best = self._best_watched_entry_for_path(str(dst))
            if not best:
                continue
            base = best.get("path")
            if not base:
                continue
            key = str(base)
            if key not in by_dir:
                by_dir[key] = {"moves": [], "source": best.get("source"), "root_id": best.get("root_id")}
            by_dir[key]["moves"].append((src, dst))
        return by_dir

    async def _dispatch_file_groups(
        self,
        grouped: dict[str, dict],
        callback: Callable[[list, str, str | None, str | None], Awaitable[None]],
        label: str,
    ) -> None:
        for base_dir, payload in grouped.items():
            try:
                await callback(
                    payload.get("files") or [],
                    base_dir,
                    payload.get("source"),
                    payload.get("root_id"),
                )
            except Exception as exc:
                logger.debug("Watcher %s error: %s", label, exc)

    @staticmethod
    def _split_move_pairs(moves: list[Any]) -> tuple[list[str], list[str]]:
        src_files: list[str] = []
        dst_files: list[str] = []
        for move in moves:
            if not isinstance(move, (list, tuple)) or len(move) != 2:
                continue
            src_files.append(str(move[0]))
            dst_files.append(str(move[1]))
        return src_files, dst_files

    def remove_path(self, path: str):
        """Remove a path from watching (e.g., when custom root is removed)."""
        if not self._running or not self._observer:
            return

        try:
            normalized = os.path.normpath(path)
            # Find and remove the watch
            to_remove = None
            for key, entry in self._watched_paths.items():
                if entry.get("path") == normalized:
                    to_remove = key
                    break

            if to_remove:
                entry = self._watched_paths.pop(to_remove, {"path": None, "source": None, "root_id": None, "watch": None})
                try:
                    if self._observer and entry.get("watch"):
                        self._observer.unschedule(entry.get("watch"))
                except Exception:
                    pass
                logger.info("Watcher removed: %s", normalized)
        except Exception as e:
            logger.debug("Failed to remove watch for %s: %s", path, e)

    @property
    def is_running(self) -> bool:
        return self._running

    @property
    def watched_directories(self) -> list:
        return [entry.get("path") for entry in self._watched_paths.values() if entry.get("path")]

    def _allows_source(self, source: str | None) -> bool:
        if not self._allowed_sources:
            return True
        if not source:
            return False
        return str(source).strip().lower() in self._allowed_sources

    def refresh_runtime_settings(self) -> None:
        """Refresh handler timing parameters without restarting."""
        if not self._handler:
            return
        try:
            self._handler.refresh_runtime_settings()
        except Exception:
            pass

    def flush_pending(self) -> bool:
        """Flush watcher pending queue immediately (best-effort)."""
        if not self._handler:
            return False
        try:
            return bool(self._handler.flush_pending())
        except Exception:
            return False

    def get_pending_count(self) -> int:
        """Return pending watcher files waiting for flush."""
        if not self._handler:
            return 0
        try:
            return int(self._handler.get_pending_count())
        except Exception:
            return 0


def _is_under_path(candidate: str, root: str) -> bool:
    if not candidate or not root:
        return False
    try:
        common = os.path.commonpath([candidate, root])
        if common == root:
            return True
    except Exception:
        pass
    try:
        root_sep = root if root.endswith(os.sep) else root + os.sep
        return candidate.startswith(root_sep) or candidate == root
    except Exception:
        return False
