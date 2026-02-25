"""
FileSystemWalker — handles filesystem traversal and I/O throttling for directory scans.

The walker runs on a thread-pool executor and pushes discovered file paths into a
thread-safe Queue consumed by the async scan loop.
"""
import os
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from queue import Empty, Queue

from ...config import IS_WINDOWS
from ...shared import EXTENSIONS, FileKind, classify_file, get_logger

logger = get_logger(__name__)

# ---------------------------------------------------------------------------
# Module-level globals (previously in scanner.py)
# ---------------------------------------------------------------------------

try:
    _FS_WALK_MAX_WORKERS = max(1, int(os.getenv("MAJOOR_FS_WALK_MAX_WORKERS", "4") or 4))
except Exception:
    _FS_WALK_MAX_WORKERS = 4

# Each scan has its own producer/queue; allow moderate parallelism across independent scans.
_FS_WALK_EXECUTOR = ThreadPoolExecutor(
    max_workers=_FS_WALK_MAX_WORKERS, thread_name_prefix="mjr-fs-walk"
)

try:
    SCAN_IOPS_LIMIT = float(os.getenv("MAJOOR_SCAN_IOPS_LIMIT", "0") or 0.0)
except Exception:
    SCAN_IOPS_LIMIT = 0.0

# Extensions explicitly excluded from indexing
_EXCLUDED_EXTENSIONS: set = {".psd", ".json", ".txt", ".csv", ".db", ".sqlite", ".log"}

_EXT_TO_KIND: dict[str, FileKind] = {}
try:
    for _kind, _exts in (EXTENSIONS or {}).items():
        for _ext in _exts or []:
            ext_lower = str(_ext).lower()
            if ext_lower not in _EXCLUDED_EXTENSIONS:
                _EXT_TO_KIND[ext_lower] = _kind  # type: ignore[assignment]
except Exception:
    _EXT_TO_KIND = {}


# ---------------------------------------------------------------------------
# FileSystemWalker class
# ---------------------------------------------------------------------------

class FileSystemWalker:
    """
    Walks a directory tree on a background thread, emitting supported file paths
    into a Queue. Supports optional I/O throttling via SCAN_IOPS_LIMIT.
    """

    def __init__(self, scan_iops_limit: float) -> None:
        self._scan_iops_limit = scan_iops_limit
        self._scan_iops_next_ts = 0.0

    # ------------------------------------------------------------------
    # I/O throttling
    # ------------------------------------------------------------------

    def _scan_iops_wait(self) -> None:
        """
        Best-effort I/O pacing for directory scans.
        Runs in the walk producer thread to avoid blocking the event loop.
        """
        limit = self._scan_iops_limit
        if limit <= 0.0:
            return
        now = time.perf_counter()
        next_ts = self._scan_iops_next_ts
        if next_ts > now:
            time.sleep(next_ts - now)
            now = time.perf_counter()
        step = 1.0 / limit if limit > 0.0 else 0.0
        self._scan_iops_next_ts = max(next_ts, now) + step

    # ------------------------------------------------------------------
    # File iteration
    # ------------------------------------------------------------------

    def iter_files(self, directory: Path, recursive: bool):
        """
        Generator — iterate over all asset files from directory (streaming).

        Args:
            directory: Directory to scan
            recursive: Scan subdirectories

        Yields:
            File paths one by one
        """
        if recursive:
            # Iterative scandir is generally faster than os.walk on large trees/NAS shares.
            stack: list[Path] = [directory]
            while stack:
                current = stack.pop()
                try:
                    with os.scandir(current) as it:
                        for entry in it:
                            self._scan_iops_wait()
                            next_dir = self._next_dir(entry)
                            if isinstance(next_dir, Path):
                                stack.append(next_dir)
                                continue
                            file_path = self._candidate(entry)
                            if file_path is not None:
                                yield file_path
                except (OSError, PermissionError):
                    continue
        else:
            for item in directory.iterdir():
                self._scan_iops_wait()
                if item.is_file() and self.is_supported_file(item):
                    yield item

    @staticmethod
    def is_supported_file(path: Path) -> bool:
        try:
            ext = path.suffix.lower()
        except Exception:
            ext = ""
        if ext and _EXT_TO_KIND:
            return _EXT_TO_KIND.get(ext, "unknown") != "unknown"
        return classify_file(str(path)) != "unknown"

    @staticmethod
    def _next_dir(entry) -> Path | None:
        try:
            if entry.is_dir(follow_symlinks=False):
                return Path(entry.path)
        except (OSError, PermissionError):
            return None
        return None

    def _candidate(self, entry) -> Path | None:
        try:
            # Keep historical behavior: index symlinks to files, but do not recurse into symlinked dirs.
            if not entry.is_file(follow_symlinks=True):
                return None
            ext = os.path.splitext(entry.name)[1].lower()
            if ext and _EXT_TO_KIND and _EXT_TO_KIND.get(ext, "unknown") == "unknown":
                return None
            file_path = Path(entry.path)
            if self.is_supported_file(file_path):
                return file_path
        except (OSError, PermissionError):
            return None
        return None

    # ------------------------------------------------------------------
    # Walk + queue
    # ------------------------------------------------------------------

    def walk_and_enqueue(
        self,
        dir_path: Path,
        recursive: bool,
        stop_event: threading.Event,
        q: "Queue[Path | None]",
    ) -> None:
        """Producer running on executor: walks filesystem and pushes paths into queue."""
        # Reset pacing window for each full walk.
        self._scan_iops_next_ts = 0.0
        try:
            for fp in self.iter_files(dir_path, recursive):
                if stop_event.is_set():
                    break
                try:
                    q.put(fp)
                except Exception:
                    logger.debug("Walk queue push failed; stopping producer for %s", dir_path, exc_info=True)
                    break
        except Exception:
            logger.debug("Filesystem walk failed for %s", dir_path, exc_info=True)
        finally:
            try:
                q.put(None)
            except Exception:
                logger.debug("Walk queue sentinel push failed for %s", dir_path, exc_info=True)

    @staticmethod
    def drain_queue(q: "Queue[Path | None]", max_items: int) -> list[Path | None]:
        """Read one-or-more items from walk queue with bounded non-blocking drain."""
        items: list[Path | None] = []
        try:
            first = q.get()
        except Exception:
            return items
        items.append(first)
        try:
            limit = max(1, int(max_items or 1))
        except (TypeError, ValueError):
            limit = 1
        while len(items) < limit:
            try:
                items.append(q.get_nowait())
            except Empty:
                break
            except Exception:
                break
        return items
