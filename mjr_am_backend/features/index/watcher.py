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
from pathlib import Path
from threading import Lock
from typing import Deque, Dict, Set, Tuple, Optional, Callable, Awaitable, Coroutine, Any, cast

from watchdog.observers import Observer
from watchdog.events import (
    FileSystemEventHandler,
    FileCreatedEvent,
    FileDeletedEvent,
    FileMovedEvent,
    DirCreatedEvent,
)

from ...shared import get_logger, EXTENSIONS
from ...config import (
    WATCHER_DEBOUNCE_MS,
    WATCHER_DEDUPE_TTL_MS,
    WATCHER_FLUSH_MAX_FILES,
    WATCHER_MAX_FILE_SIZE_BYTES,
    WATCHER_MIN_FILE_SIZE_BYTES,
    WATCHER_MAX_FLUSH_CONCURRENCY,
    WATCHER_STREAM_ALERT_COOLDOWN_SECONDS,
    WATCHER_STREAM_ALERT_THRESHOLD,
    WATCHER_STREAM_ALERT_WINDOW_SECONDS,
    WATCHER_PENDING_MAX,
)
from ..watcher_settings import get_watcher_settings

logger = get_logger(__name__)

# Extensions explicitly excluded even if they ever appear in EXTENSIONS
EXCLUDED_EXTENSIONS: Set[str] = {".psd", ".json", ".txt", ".csv", ".db", ".sqlite", ".log"}

# Supported extensions (flattened)
SUPPORTED_EXTENSIONS: Set[str] = set()
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
_RECENT_GENERATED: Dict[str, float] = {}
_MAX_PENDING_FILES = max(0, WATCHER_PENDING_MAX)
_STREAM_EVENTS: Deque[Tuple[float, int]] = deque()
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
        on_files_removed: Optional[Callable[[list], Awaitable[None]]],
        on_files_moved: Optional[Callable[[list], Awaitable[None]]],
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
        self._pending: Dict[str, float] = {}  # filepath -> timestamp
        self._overflow: Dict[str, float] = {}  # overflow queue when pending cap is reached
        self._recent: Dict[str, float] = {}   # filepath -> last processed timestamp
        self._flush_timer: Optional[asyncio.TimerHandle] = None
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
        self._handle_file(event.src_path)

    def on_modified(self, event):
        # Modified events are needed for slow/network writes where the create event
        # happens before file content is fully available.
        try:
            if getattr(event, "is_directory", False):
                return
        except Exception:
            return
        self._handle_file(getattr(event, "src_path", ""))

    def on_deleted(self, event):
        if isinstance(event, FileDeletedEvent):
            self._handle_deleted_file(event.src_path)

    def on_moved(self, event):
        if isinstance(event, FileMovedEvent):
            self._handle_moved_file(event.src_path, event.dest_path)

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

        if not src_ok and not dst_ok:
            return

        src_norm = self._normalize_path(src_path)
        dst_norm = self._normalize_path(dest_path)

        # If extension changed from supported->unsupported, treat as deletion.
        if src_ok and not dst_ok and self._on_files_removed:
            try:
                coro = cast(Coroutine[Any, Any, None], self._on_files_removed([src_norm]))
                asyncio.run_coroutine_threadsafe(coro, self._loop)
            except Exception:
                pass
            return

        # If extension changed from unsupported->supported, treat as creation.
        if dst_ok and not src_ok:
            self._handle_file(dst_norm)
            return

        if self._on_files_moved:
            try:
                coro = cast(Coroutine[Any, Any, None], self._on_files_moved([(src_norm, dst_norm)]))
                asyncio.run_coroutine_threadsafe(coro, self._loop)
                return
            except Exception:
                pass

        # Fallback: index new path and remove old path as separate operations.
        self._handle_file(dst_norm)
        if self._on_files_removed:
            try:
                coro = cast(Coroutine[Any, Any, None], self._on_files_removed([src_norm]))
                asyncio.run_coroutine_threadsafe(coro, self._loop)
            except Exception:
                pass

    async def _flush(self):
        """Flush pending files to the indexer."""
        self._refresh_runtime_settings()
        with self._lock:
            if not self._pending and not self._overflow:
                return

            now = time.time()
            candidates = list(self._pending.keys())
            if self._overflow:
                candidates.extend(list(self._overflow.keys()))
            self._pending.clear()
            self._overflow.clear()
            self._flush_timer = None

        async with self._flush_semaphore:
            _record_flush_volume(len(candidates))

            # Filter out files that are too small (still being written), vanished,
            # or recently indexed via the frontend executed-event path.
            # TOCTOU: re-validate extension at flush time in case file was renamed.
            files = []
            for f in candidates:
                if _is_recent_generated(f):
                    continue
                try:
                    ext = Path(f).suffix.lower()
                    if ext in EXCLUDED_EXTENSIONS or ext not in SUPPORTED_EXTENSIONS:
                        continue
                except Exception:
                    continue
                try:
                    size = os.path.getsize(f)
                except OSError:
                    continue
                if size < MIN_FILE_SIZE:
                    continue
                max_size = MAX_FILE_SIZE
                if max_size > 0 and size > max_size:
                    logger.debug("Watcher skipping oversized file %s (%d bytes > %d)", f, size, max_size)
                    continue
                files.append(f)

            if not files:
                return

            # Backpressure handling: process a bounded chunk now and defer remainder.
            if WATCHER_FLUSH_MAX_FILES > 0 and len(files) > WATCHER_FLUSH_MAX_FILES:
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
                # Keep draining deferred backlog without waiting for fresh fs events.
                self._schedule_flush()

            # Mark as recently processed
            with self._lock:
                now = time.time()
                for f in files:
                    self._recent[f] = now

                # Prune old entries from recent
                to_remove = [k for k, v in self._recent.items() if (now - v) > self._dedupe_ttl_s * 2]
                for k in to_remove:
                    self._recent.pop(k, None)

            try:
                await self._on_files_ready(files)
            except Exception as e:
                logger.debug("Watcher flush error: %s", e)


def _normalize_recent_key(path: str) -> str:
    try:
        return os.path.normcase(os.path.normpath(path))
    except Exception:
        return str(path or "")


def _is_recent_generated(path: str) -> bool:
    key = _normalize_recent_key(path)
    if not key:
        return False
    now = time.time()
    try:
        with _RECENT_GENERATED_LOCK:
            if _RECENT_GENERATED:
                to_remove = [k for k, ts in _RECENT_GENERATED.items() if (now - float(ts or 0)) > _RECENT_GENERATED_TTL_S]
                for k in to_remove:
                    _RECENT_GENERATED.pop(k, None)
            ts = _RECENT_GENERATED.get(key)
            if ts and (now - float(ts or 0)) <= _RECENT_GENERATED_TTL_S:
                return True
    except Exception:
        return False
    return False


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
    cutoff_time = now - window
    with _STREAM_LOCK:
        _STREAM_EVENTS.append((now, count))
        _STREAM_TOTAL_FILES += count
        while _STREAM_EVENTS and _STREAM_EVENTS[0][0] < cutoff_time:
            _, stale = _STREAM_EVENTS.popleft()
            _STREAM_TOTAL_FILES -= stale
        if _STREAM_TOTAL_FILES < 0:
            _STREAM_TOTAL_FILES = 0
        cooldown = max(WATCHER_STREAM_ALERT_COOLDOWN_SECONDS, 0.0)
        if _STREAM_TOTAL_FILES >= WATCHER_STREAM_ALERT_THRESHOLD:
            if cooldown <= 0 or (now - _LAST_STREAM_ALERT_TIME) >= cooldown:
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
        index_callback: Callable[[list, str, Optional[str], Optional[str]], Awaitable[None]],
        remove_callback: Optional[Callable[[list, str, Optional[str], Optional[str]], Awaitable[None]]] = None,
        move_callback: Optional[Callable[[list, str, Optional[str], Optional[str]], Awaitable[None]]] = None,
    ):
        """
        Args:
            index_callback: async function(filepaths, base_dir, source, root_id) to index files
        """
        self._index_callback = index_callback
        self._remove_callback = remove_callback
        self._move_callback = move_callback
        self._observer: Optional[Any] = None
        self._handler: Optional[DebouncedWatchHandler] = None
        self._watched_paths: Dict[str, dict] = {}  # watch_key -> {path, source, root_id, watch}
        self._lock = Lock()
        self._running = False
        self._allowed_sources: set[str] = set()

    async def start(self, paths: list, loop: Optional[asyncio.AbstractEventLoop] = None):
        """Start watching the given directories."""
        if self._running:
            return

        loop = loop or asyncio.get_event_loop()
        self._allowed_sources = set()

        async def on_files_ready(files: list):
            if not files:
                return
            # Group by watched root for proper base_dir
            by_dir: Dict[str, dict] = {}
            for f in files:
                try:
                    # Find the watched root this file belongs to
                    normalized_f = os.path.normcase(os.path.normpath(f))
                    best = None
                    best_len = -1
                    for entry in self._watched_paths.values():
                        watched = entry.get("path")
                        if not watched:
                            continue
                        normalized_watched = os.path.normcase(os.path.normpath(watched))
                        if _is_under_path(normalized_f, normalized_watched) and len(normalized_watched) > best_len:
                            best = entry
                            best_len = len(normalized_watched)

                    if not best:
                        continue

                    base = best.get("path")
                    if not base:
                        continue
                    key = str(base)
                    if key not in by_dir:
                        by_dir[key] = {
                            "files": [],
                            "source": best.get("source"),
                            "root_id": best.get("root_id"),
                        }
                    by_dir[key]["files"].append(f)
                except Exception:
                    pass

            for base_dir, payload in by_dir.items():
                try:
                    await self._index_callback(
                        payload.get("files") or [],
                        base_dir,
                        payload.get("source"),
                        payload.get("root_id"),
                    )
                except Exception as e:
                    logger.debug("Watcher index error: %s", e)

        async def on_files_removed(files: list):
            if not files or not callable(self._remove_callback):
                return
            by_dir: Dict[str, dict] = {}
            for f in files:
                try:
                    normalized_f = os.path.normcase(os.path.normpath(f))
                    best = None
                    best_len = -1
                    for entry in self._watched_paths.values():
                        watched = entry.get("path")
                        if not watched:
                            continue
                        normalized_watched = os.path.normcase(os.path.normpath(watched))
                        if _is_under_path(normalized_f, normalized_watched) and len(normalized_watched) > best_len:
                            best = entry
                            best_len = len(normalized_watched)
                    if not best:
                        continue
                    base = best.get("path")
                    if not base:
                        continue
                    key = str(base)
                    if key not in by_dir:
                        by_dir[key] = {"files": [], "source": best.get("source"), "root_id": best.get("root_id")}
                    by_dir[key]["files"].append(f)
                except Exception:
                    continue
            for base_dir, payload in by_dir.items():
                try:
                    await self._remove_callback(
                        payload.get("files") or [],
                        base_dir,
                        payload.get("source"),
                        payload.get("root_id"),
                    )
                except Exception as e:
                    logger.debug("Watcher remove error: %s", e)

        async def on_files_moved(moves: list):
            if not moves:
                return
            if callable(self._move_callback):
                by_dir: Dict[str, dict] = {}
                for src, dst in moves:
                    try:
                        normalized_dst = os.path.normcase(os.path.normpath(dst))
                        best = None
                        best_len = -1
                        for entry in self._watched_paths.values():
                            watched = entry.get("path")
                            if not watched:
                                continue
                            normalized_watched = os.path.normcase(os.path.normpath(watched))
                            if _is_under_path(normalized_dst, normalized_watched) and len(normalized_watched) > best_len:
                                best = entry
                                best_len = len(normalized_watched)
                        if not best:
                            continue
                        base = best.get("path")
                        if not base:
                            continue
                        key = str(base)
                        if key not in by_dir:
                            by_dir[key] = {"moves": [], "source": best.get("source"), "root_id": best.get("root_id")}
                        by_dir[key]["moves"].append((src, dst))
                    except Exception:
                        continue
                for base_dir, payload in by_dir.items():
                    try:
                        await self._move_callback(
                            payload.get("moves") or [],
                            base_dir,
                            payload.get("source"),
                            payload.get("root_id"),
                        )
                    except Exception as e:
                        logger.debug("Watcher move error: %s", e)
                return
            # Fallback if no move callback: reindex destination and remove source.
            try:
                src_files = [m[0] for m in moves if isinstance(m, (list, tuple)) and len(m) == 2]
                dst_files = [m[1] for m in moves if isinstance(m, (list, tuple)) and len(m) == 2]
                if dst_files:
                    await on_files_ready(dst_files)
                if src_files:
                    await on_files_removed(src_files)
            except Exception:
                return

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
                if isinstance(path, dict):
                    raw_path = path.get("path")
                    source = path.get("source")
                    root_id = path.get("root_id")
                else:
                    raw_path = path
                    source = None
                    root_id = None

                if not raw_path:
                    continue
                normalized = os.path.normpath(raw_path)
                if os.path.isdir(normalized):
                    watch = self._observer.schedule(self._handler, normalized, recursive=True)
                    source_norm = str(source or "").strip().lower() if source is not None else None
                    if source_norm:
                        self._allowed_sources.add(source_norm)
                    self._watched_paths[str(id(watch))] = {
                        "path": normalized,
                        "source": source_norm,
                        "root_id": root_id,
                        "watch": watch,
                    }
                    logger.info("Watcher started for: %s", normalized)
            except Exception as e:
                logger.warning("Failed to watch %s: %s", path, e)

        if self._watched_paths:
            self._observer.start()
            self._running = True
            logger.info("File watcher started for %d directories", len(self._watched_paths))

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

    def add_path(self, path: str, *, source: Optional[str] = None, root_id: Optional[str] = None):
        """Add a new path to watch (e.g., when custom root is added)."""
        if not self._running or not self._observer or not self._handler:
            return

        try:
            normalized = os.path.normpath(path)
            if os.path.isdir(normalized):
                # Check if already watched
                for entry in self._watched_paths.values():
                    if entry.get("path") == normalized:
                        return
                source_norm = str(source or "").strip().lower() if source is not None else None
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

    def _allows_source(self, source: Optional[str]) -> bool:
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
