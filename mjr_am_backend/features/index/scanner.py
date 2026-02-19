"""
Index scanner - handles directory scanning and file indexing operations.
"""
import hashlib
import logging
import os
import time
import threading
import asyncio
import sqlite3
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from queue import Empty, Queue
from typing import List, Dict, Any, Iterable, Optional, cast
from datetime import datetime
from uuid import uuid4

from ...shared import get_logger, Result, classify_file, FileKind, ErrorCode, log_structured, EXTENSIONS
from ...adapters.db.sqlite import Sqlite
from ...config import (
    SCAN_BATCH_SMALL_THRESHOLD,
    SCAN_BATCH_MED_THRESHOLD,
    SCAN_BATCH_LARGE_THRESHOLD,
    SCAN_BATCH_SMALL,
    SCAN_BATCH_MED,
    SCAN_BATCH_LARGE,
    SCAN_BATCH_XL,
    SCAN_BATCH_INITIAL,
    SCAN_BATCH_MIN,
    MAX_TO_ENRICH_ITEMS,
    IS_WINDOWS,
)
from ..metadata import MetadataService
from .metadata_helpers import MetadataHelpers


logger = get_logger(__name__)

# Single-thread executor to ensure the directory walk generator is never advanced from
# different threads (which can cause subtle corruption / deadlocks).
_FS_WALK_EXECUTOR = ThreadPoolExecutor(max_workers=1, thread_name_prefix="mjr-fs-walk")

MAX_TRANSACTION_BATCH_SIZE = 500
MAX_SCAN_JOURNAL_LOOKUP = 5000
STAT_RETRY_COUNT = 3
STAT_RETRY_BASE_DELAY_S = 0.15
try:
    # 0 disables scan I/O throttling (default: current behavior).
    SCAN_IOPS_LIMIT = float(os.getenv("MAJOOR_SCAN_IOPS_LIMIT", "0") or 0.0)
except Exception:
    SCAN_IOPS_LIMIT = 0.0

# Extensions explicitly excluded from indexing
_EXCLUDED_EXTENSIONS: set = {".psd", ".json", ".txt", ".csv", ".db", ".sqlite", ".log"}

_EXT_TO_KIND: Dict[str, FileKind] = {}
try:
    for _kind, _exts in (EXTENSIONS or {}).items():
        for _ext in _exts or []:
            ext_lower = str(_ext).lower()
            if ext_lower not in _EXCLUDED_EXTENSIONS:
                _EXT_TO_KIND[ext_lower] = _kind  # type: ignore[assignment]
except Exception:
    _EXT_TO_KIND = {}


def _is_fatal_db_error(exc: Exception) -> bool:
    if not isinstance(exc, sqlite3.DatabaseError):
        return False
    if "busy" in str(exc).lower() or "locked" in str(exc).lower():
        return False
    return True


class IndexScanner:
    """
    Handles directory scanning and file indexing operations.

    Provides recursive directory scanning, incremental updates based on mtime,
    and integration with metadata extraction.
    """

    def __init__(
        self,
        db: Sqlite,
        metadata_service: MetadataService,
        scan_lock: asyncio.Lock,
        index_lock: Optional[asyncio.Lock] = None,
    ):
        """
        Initialize index scanner.

        Args:
            db: Database adapter instance
            metadata_service: Metadata service for extraction
            scan_lock: Shared lock for database operations
        """
        self.db = db
        self.metadata = metadata_service
        self._scan_lock = scan_lock
        self._index_lock = index_lock or scan_lock
        self._current_scan_id: Optional[str] = None
        self._batch_fallback_count = 0
        self._batch_fallback_lock = threading.Lock()
        # Throttle only directory walk I/O operations (scandir entry processing).
        self._scan_iops_limit = max(0.0, float(SCAN_IOPS_LIMIT))
        self._scan_iops_next_ts = 0.0

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

    def _normalize_filepath_str(self, file_path: Path | str) -> str:
        """
        Build a canonical filepath key for DB/cache/journal lookups.
        On Windows we normalize case to avoid duplicates that differ only by casing.
        """
        raw = str(file_path) if file_path is not None else ""
        if not IS_WINDOWS:
            return raw
        try:
            return os.path.normcase(os.path.normpath(raw))
        except Exception:
            return raw

    def _diagnose_batch_failure(
        self,
        prepared: List[Dict[str, Any]],
        batch_error: Exception,
    ) -> tuple[Optional[str], str]:
        """
        Best-effort diagnosis for batch transaction failures.
        Returns (filepath, reason) where filepath may be None if unknown.
        """
        message, message_lower = self._batch_error_messages(batch_error)
        if self._is_unique_filepath_error(message_lower):
            diagnosed = self._diagnose_unique_filepath_error(prepared)
            if diagnosed is not None:
                return diagnosed
        fp = self._first_prepared_filepath(prepared)
        return fp, (message or type(batch_error).__name__)

    @staticmethod
    def _batch_error_messages(batch_error: Exception) -> tuple[str, str]:
        try:
            message = str(batch_error or "")
        except Exception:
            return "", ""
        return message, message.lower()

    @staticmethod
    def _is_unique_filepath_error(message_lower: str) -> bool:
        return "unique constraint failed" in message_lower and "assets.filepath" in message_lower

    def _diagnose_unique_filepath_error(self, prepared: List[Dict[str, Any]]) -> Optional[tuple[Optional[str], str]]:
        duplicate = self._first_duplicate_filepath_in_batch(prepared)
        if duplicate:
            return duplicate, "duplicate filepath in batch payload (UNIQUE assets.filepath)"
        fp = self._first_prepared_filepath(prepared)
        if fp:
            return fp, "filepath conflicts with existing database row (UNIQUE assets.filepath)"
        return None, "UNIQUE constraint on assets.filepath"

    @staticmethod
    def _first_duplicate_filepath_in_batch(prepared: List[Dict[str, Any]]) -> Optional[str]:
        seen: set[str] = set()
        for entry in prepared:
            fp = IndexScanner._prepared_filepath(entry)
            if not fp:
                continue
            key = fp.lower() if IS_WINDOWS else fp
            if key in seen:
                return fp
            seen.add(key)
        return None

    @staticmethod
    def _first_prepared_filepath(prepared: List[Dict[str, Any]]) -> Optional[str]:
        for entry in prepared:
            fp = IndexScanner._prepared_filepath(entry)
            if fp:
                return fp
        return None

    @staticmethod
    def _prepared_filepath(entry: Dict[str, Any]) -> str:
        return str(entry.get("filepath") or entry.get("file_path") or "").strip()

    @staticmethod
    def _drain_walk_queue(q: "Queue[Optional[Path]]", max_items: int) -> list[Optional[Path]]:
        """Read one-or-more items from walk queue with bounded non-blocking drain."""
        items: list[Optional[Path]] = []
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

    def _walk_and_enqueue(self, dir_path: Path, recursive: bool, stop_event: threading.Event, q: "Queue[Optional[Path]]") -> None:
        """Producer running on executor: walks filesystem and pushes paths into queue."""
        # Reset pacing window for each full walk.
        self._scan_iops_next_ts = 0.0
        try:
            for fp in self._iter_files(dir_path, recursive):
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

    async def scan_directory(
        self,
        directory: str,
        recursive: bool = True,
        incremental: bool = True,
        source: str = "output",
        root_id: Optional[str] = None,
        fast: bool = False,
        background_metadata: bool = False,
    ) -> Result[Dict[str, Any]]:
        """
        Scan a directory for asset files.

        Args:
            directory: Path to scan
            recursive: Scan subdirectories
            incremental: Only update changed files (based on mtime)
            source: Source identifier for the scan
            root_id: Root identifier for the scan
            fast: Skip metadata extraction during scan
            background_metadata: Enable background metadata enrichment

        Returns:
            Result with scan statistics
        """
        to_enrich: List[str] = []
        async with self._scan_lock:
            dir_path = Path(directory)
            validation_error = self._validate_scan_directory(dir_path, directory)
            if validation_error is not None:
                return validation_error

            scan_id = str(uuid4())
            self._current_scan_id = scan_id
            scan_start = time.perf_counter()

            self._log_scan_event(
                logging.INFO,
                "Starting directory scan",
                directory=directory,
                recursive=recursive,
                incremental=incremental,
                files_root=str(dir_path)
            )

            stats: Dict[str, Any] = self._new_scan_stats()

            try:
                await self._run_scan_streaming_loop(
                    dir_path=dir_path,
                    directory=directory,
                    recursive=recursive,
                    incremental=incremental,
                    source=source,
                    root_id=root_id,
                    fast=fast,
                    stats=stats,
                    to_enrich=to_enrich,
                )
            finally:
                stats["end_time"] = datetime.now().isoformat()
                duration = time.perf_counter() - scan_start

                await MetadataHelpers.set_metadata_value(self.db, "last_scan_end", stats["end_time"])

                self._log_scan_event(
                    logging.INFO,
                    "Directory scan complete",
                    duration_seconds=duration,
                    scanned=stats["scanned"],
                    added=stats["added"],
                    updated=stats["updated"],
                    skipped=stats["skipped"],
                    errors=stats["errors"]
                )
                if duration > 0.5:
                    logger.debug(
                        "scan_directory timing: %.3fs (scanned=%s added=%s updated=%s skipped=%s errors=%s)",
                        duration,
                        stats.get("scanned"),
                        stats.get("added"),
                        stats.get("updated"),
                        stats.get("skipped"),
                        stats.get("errors"),
                    )
                self._current_scan_id = None

        # Return to_enrich list for background enrichment
        if to_enrich:
            stats["to_enrich"] = to_enrich

        logger.debug(
            f"Scan complete: {stats['added']} added, "
            f"{stats['updated']} updated, {stats['skipped']} skipped, "
            f"{stats['errors']} errors"
        )

        return Result.Ok(stats)

    @staticmethod
    def _new_scan_stats() -> Dict[str, Any]:
        return {
            "scanned": 0,
            "added": 0,
            "updated": 0,
            "skipped": 0,
            "errors": 0,
            "batch_fallbacks": 0,
            "skipped_state_changed": 0,
            "start_time": datetime.now().isoformat(),
        }

    @staticmethod
    def _validate_scan_directory(dir_path: Path, directory: str) -> Optional[Result[Dict[str, Any]]]:
        if not dir_path.exists():
            return Result.Err("DIR_NOT_FOUND", f"Directory not found: {directory}")
        if not dir_path.is_dir():
            return Result.Err("NOT_A_DIRECTORY", f"Not a directory: {directory}")
        return None

    @staticmethod
    def _stream_batch_target(scanned_count: int) -> int:
        try:
            n = int(scanned_count or 0)
        except (ValueError, TypeError):
            n = 0
        if n <= 0:
            return max(1, int(SCAN_BATCH_INITIAL))
        if n <= SCAN_BATCH_SMALL_THRESHOLD:
            return max(int(SCAN_BATCH_MIN), int(SCAN_BATCH_SMALL))
        if n <= SCAN_BATCH_MED_THRESHOLD:
            return max(int(SCAN_BATCH_MIN), int(SCAN_BATCH_MED))
        if n <= SCAN_BATCH_LARGE_THRESHOLD:
            return max(int(SCAN_BATCH_MIN), int(SCAN_BATCH_LARGE))
        return max(int(SCAN_BATCH_MIN), int(SCAN_BATCH_XL))

    async def _run_scan_streaming_loop(
        self,
        *,
        dir_path: Path,
        directory: str,
        recursive: bool,
        incremental: bool,
        source: str,
        root_id: Optional[str],
        fast: bool,
        stats: Dict[str, Any],
        to_enrich: List[str],
    ) -> None:
        loop = asyncio.get_running_loop()
        stop_event = threading.Event()
        q: "Queue[Optional[Path]]" = Queue(maxsize=max(1000, int(SCAN_BATCH_XL) * 4))
        walk_future = loop.run_in_executor(
            _FS_WALK_EXECUTOR,
            self._walk_and_enqueue,
            dir_path,
            recursive,
            stop_event,
            q,
        )
        try:
            await self._consume_scan_queue(
                q=q,
                directory=directory,
                incremental=incremental,
                source=source,
                root_id=root_id,
                fast=fast,
                stats=stats,
                to_enrich=to_enrich,
                stop_event=stop_event,
            )
        finally:
            stop_event.set()
            try:
                await asyncio.wait_for(walk_future, timeout=2.0)
            except Exception:
                pass

    async def _consume_scan_queue(
        self,
        *,
        q: "Queue[Optional[Path]]",
        directory: str,
        incremental: bool,
        source: str,
        root_id: Optional[str],
        fast: bool,
        stats: Dict[str, Any],
        to_enrich: List[str],
        stop_event: threading.Event,
    ) -> None:
        batch: List[Path] = []
        done = False
        try:
            while not done:
                target = self._stream_batch_target(stats["scanned"])
                pulled = await asyncio.to_thread(self._drain_walk_queue, q, target)
                if not pulled:
                    await asyncio.sleep(0)
                    continue
                for file_path in pulled:
                    if file_path is None:
                        done = True
                        break
                    batch.append(file_path)
                    stats["scanned"] += 1
                    if len(batch) >= self._stream_batch_target(stats["scanned"]):
                        await self._process_scan_batch(
                            batch=batch,
                            directory=directory,
                            incremental=incremental,
                            source=source,
                            root_id=root_id,
                            fast=fast,
                            stats=stats,
                            to_enrich=to_enrich,
                        )
                        batch = []
                await asyncio.sleep(0)
            if batch:
                await self._process_scan_batch(
                    batch=batch,
                    directory=directory,
                    incremental=incremental,
                    source=source,
                    root_id=root_id,
                    fast=fast,
                    stats=stats,
                    to_enrich=to_enrich,
                )
        except asyncio.CancelledError:
            stop_event.set()
            raise

    async def _process_scan_batch(
        self,
        *,
        batch: List[Path],
        directory: str,
        incremental: bool,
        source: str,
        root_id: Optional[str],
        fast: bool,
        stats: Dict[str, Any],
        to_enrich: List[str],
    ) -> None:
        await self._scan_stream_batch(
            batch=batch,
            base_dir=directory,
            incremental=incremental,
            source=source,
            root_id=root_id,
            fast=fast,
            stats=stats,
            to_enrich=to_enrich,
        )

    async def _scan_stream_batch(
        self,
        *,
        batch: List[Path],
        base_dir: str,
        incremental: bool,
        source: str,
        root_id: Optional[str],
        fast: bool,
        stats: Dict[str, Any],
        to_enrich: List[str],
    ) -> None:
        if not batch:
            return

        filepaths = [self._normalize_filepath_str(p) for p in batch]
        journal_map = (await self._get_journal_entries(filepaths)) if incremental and filepaths else {}
        existing_map = await self._existing_map_for_filepaths(filepaths)

        await self._index_batch(
            batch=batch,
            base_dir=base_dir,
            incremental=incremental,
            source=source,
            root_id=root_id,
            fast=fast,
            journal_map=journal_map,
            existing_map=existing_map,
            stats=stats,
            to_enrich=to_enrich,
        )

    async def _existing_map_for_filepaths(self, filepaths: List[str]) -> Dict[str, Dict[str, Any]]:
        return await self._existing_map_for_batch(filepaths)

    async def index_paths(
        self,
        paths: List[Path],
        base_dir: str,
        incremental: bool = True,
        source: str = "output",
        root_id: Optional[str] = None,
    ) -> Result[Dict[str, Any]]:
        """
        Index a list of file paths (no directory scan).

        Args:
            paths: List of file paths to index
            base_dir: Base directory for relative path calculation
            incremental: Skip if already indexed and unchanged
            source: Source identifier for the index
            root_id: Root identifier for the index

        Returns:
            Result with indexing statistics
        """
        async with self._index_lock:
            paths = self._filter_indexable_paths(paths)
            if not paths:
                return Result.Ok(self._empty_index_stats())

            scan_id = str(uuid4())
            self._current_scan_id = scan_id
            scan_start = time.perf_counter()
            self._log_index_paths_start(paths, base_dir, incremental)
            stats = self._new_index_stats(len(paths))
            added_ids: List[int] = []
            try:
                await self._index_paths_batches(paths, base_dir, incremental, source, root_id, stats, added_ids)
            finally:
                await self._finalize_index_paths(scan_start, stats)
                self._current_scan_id = None

        # Include added/updated asset IDs for WebSocket notification
        if added_ids:
            stats["added_ids"] = added_ids
        return Result.Ok(stats)

    @staticmethod
    def _filter_indexable_paths(paths: List[Path]) -> List[Path]:
        filtered_paths: List[Path] = []
        for p in paths:
            try:
                ext = p.suffix.lower() if p.suffix else ""
                if ext and _EXT_TO_KIND and _EXT_TO_KIND.get(ext, "unknown") != "unknown":
                    filtered_paths.append(p)
                    continue
                if classify_file(str(p)) != "unknown":
                    filtered_paths.append(p)
            except Exception:
                continue
        return filtered_paths

    @staticmethod
    def _empty_index_stats() -> Dict[str, Any]:
        now = datetime.now().isoformat()
        return {
            "scanned": 0,
            "added": 0,
            "updated": 0,
            "skipped": 0,
            "errors": 0,
            "start_time": now,
            "end_time": now,
        }

    def _log_index_paths_start(self, paths: List[Path], base_dir: str, incremental: bool) -> None:
        start_log_level = logging.DEBUG if len(paths) == 1 else logging.INFO
        self._log_scan_event(
            start_log_level,
            "Starting file list index",
            file_count=len(paths),
            base_dir=base_dir,
            incremental=incremental,
        )

    @staticmethod
    def _new_index_stats(scanned: int) -> Dict[str, Any]:
        return {
            "scanned": scanned,
            "added": 0,
            "updated": 0,
            "skipped": 0,
            "errors": 0,
            "batch_fallbacks": 0,
            "skipped_state_changed": 0,
            "start_time": datetime.now().isoformat(),
        }

    async def _index_paths_batches(
        self,
        paths: List[Path],
        base_dir: str,
        incremental: bool,
        source: str,
        root_id: Optional[str],
        stats: Dict[str, Any],
        added_ids: List[int],
    ) -> None:
        for batch in self._chunk_file_batches(paths):
            if not batch:
                continue
            filepaths = [self._normalize_filepath_str(p) for p in batch]
            journal_map = await self._journal_map_for_batch(filepaths, incremental)
            existing_map = await self._existing_map_for_batch(filepaths)
            await self._index_batch(
                batch=batch,
                base_dir=base_dir,
                incremental=incremental,
                source=source,
                root_id=root_id,
                fast=False,
                journal_map=journal_map,
                existing_map=existing_map,
                stats=stats,
                to_enrich=None,
                added_ids=added_ids,
            )
            await asyncio.sleep(0)

    async def _journal_map_for_batch(self, filepaths: List[str], incremental: bool) -> Dict[str, str]:
        if not incremental or not filepaths:
            return {}
        return await self._get_journal_entries(filepaths)

    async def _existing_map_for_batch(self, filepaths: List[str]) -> Dict[str, Dict[str, Any]]:
        existing_map: Dict[str, Dict[str, Any]] = {}
        if not filepaths:
            return existing_map
        existing_rows = await self.db.aquery_in(
            "SELECT filepath, id, mtime FROM assets WHERE {IN_CLAUSE}",
            "filepath",
            filepaths,
        )
        if not existing_rows.ok or not existing_rows.data:
            return existing_map
        for row in existing_rows.data:
            fp = row.get("filepath")
            if fp:
                existing_map[str(fp)] = row
        return existing_map

    async def _finalize_index_paths(self, scan_start: float, stats: Dict[str, Any]) -> None:
        stats["end_time"] = datetime.now().isoformat()
        duration = time.perf_counter() - scan_start
        await MetadataHelpers.set_metadata_value(self.db, "last_index_end", stats["end_time"])
        has_changes = stats["added"] > 0 or stats["updated"] > 0 or stats["errors"] > 0
        complete_log_level = logging.INFO if has_changes else logging.DEBUG
        self._log_scan_event(
            complete_log_level,
            "File list index complete",
            duration_seconds=duration,
            scanned=stats["scanned"],
            added=stats["added"],
            updated=stats["updated"],
            skipped=stats["skipped"],
            errors=stats["errors"],
        )

    async def _index_batch(
        self,
        batch: List[Path],
        base_dir: str,
        incremental: bool,
        source: str,
        root_id: Optional[str],
        fast: bool,
        journal_map: Dict[str, str],
        existing_map: Dict[str, Dict[str, Any]],
        stats: Dict[str, Any],
        to_enrich: Optional[List[str]] = None,
        added_ids: Optional[List[int]] = None,
    ) -> None:
        # Index a batch of files using one DB transaction for writes.
        batch_start = time.perf_counter()
        filepaths = [self._normalize_filepath_str(p) for p in batch]

        cache_map, has_rich_meta_set = await self._prefetch_batch_cache_and_rich_meta(
            filepaths,
            existing_map,
        )
        prepared, needs_metadata = await self._prepare_batch_entries(
            batch=batch,
            base_dir=base_dir,
            incremental=incremental,
            fast=fast,
            journal_map=journal_map,
            existing_map=existing_map,
            cache_map=cache_map,
            has_rich_meta_set=has_rich_meta_set,
            stats=stats,
        )
        await self._append_batch_metadata_entries(
            prepared=prepared,
            needs_metadata=needs_metadata,
            base_dir=base_dir,
            fast=fast,
        )

        if not prepared:
            return

        await self._persist_prepared_entries(
            prepared=prepared,
            base_dir=base_dir,
            source=source,
            root_id=root_id,
            stats=stats,
            to_enrich=to_enrich,
            added_ids=added_ids,
        )

        duration = time.perf_counter() - batch_start
        if duration > 0.2:
            logger.debug(
                "_index_batch timing: %.3fs (batch=%s)",
                duration,
                len(batch) if batch is not None else 0,
            )

    async def _prefetch_batch_cache_and_rich_meta(
        self,
        filepaths: List[str],
        existing_map: Dict[str, Dict[str, Any]],
    ) -> tuple[Dict[tuple[str, str], Any], set[int]]:
        cache_map: Dict[tuple[str, str], Any] = {}
        has_rich_meta_set: set[int] = set()
        if not filepaths:
            return cache_map, has_rich_meta_set

        await self._prefetch_metadata_cache_rows(filepaths, cache_map)
        asset_ids = self._asset_ids_from_existing_rows(filepaths, existing_map)
        if not asset_ids:
            return cache_map, has_rich_meta_set

        await self._prefetch_rich_metadata_rows(asset_ids, has_rich_meta_set)
        return cache_map, has_rich_meta_set

    async def _prefetch_metadata_cache_rows(
        self,
        filepaths: List[str],
        cache_map: Dict[tuple[str, str], Any],
    ) -> None:
        cache_rows = await self.db.aquery_in(
            "SELECT filepath, state_hash, metadata_raw FROM metadata_cache WHERE {IN_CLAUSE}",
            "filepath",
            filepaths,
        )
        if not cache_rows.ok or not cache_rows.data:
            return
        for row in cache_rows.data:
            fp = row.get("filepath")
            state_hash = row.get("state_hash")
            if fp and state_hash:
                cache_map[(str(fp), str(state_hash))] = row.get("metadata_raw")

    @staticmethod
    def _asset_ids_from_existing_rows(filepaths: List[str], existing_map: Dict[str, Dict[str, Any]]) -> List[int]:
        asset_ids: List[int] = []
        for fp in filepaths:
            existing_row = existing_map.get(fp)
            if not existing_row or not existing_row.get("id"):
                continue
            try:
                existing_id = int(existing_row.get("id") or 0)
            except (TypeError, ValueError):
                continue
            if existing_id:
                asset_ids.append(existing_id)
        return asset_ids

    async def _prefetch_rich_metadata_rows(self, asset_ids: List[int], has_rich_meta_set: set[int]) -> None:
        meta_rows = await self.db.aquery_in(
            "SELECT asset_id, metadata_quality, metadata_raw FROM asset_metadata WHERE {IN_CLAUSE}",
            "asset_id",
            asset_ids,
        )
        if not meta_rows.ok or not meta_rows.data:
            return
        for row in meta_rows.data:
            asset_id = row.get("asset_id")
            if not asset_id:
                continue
            try:
                metadata_quality = str(row.get("metadata_quality") or "").strip().lower()
                metadata_raw = str(row.get("metadata_raw") or "").strip()
                has_rich = metadata_quality not in ("", "none") or metadata_raw not in ("", "{}", "null")
                if has_rich:
                    has_rich_meta_set.add(int(asset_id))
            except Exception:
                continue

    async def _prepare_batch_entries(
        self,
        batch: List[Path],
        base_dir: str,
        incremental: bool,
        fast: bool,
        journal_map: Dict[str, str],
        existing_map: Dict[str, Dict[str, Any]],
        cache_map: Dict[tuple[str, str], Any],
        has_rich_meta_set: set[int],
        stats: Dict[str, Any],
    ) -> tuple[List[Dict[str, Any]], List[tuple[Path, str, int, int, int, str, Optional[int]]]]:
        prepared: List[Dict[str, Any]] = []
        needs_metadata: List[tuple[Path, str, int, int, int, str, Optional[int]]] = []

        for file_path in batch:
            prepared_entry, metadata_item = await self._prepare_single_batch_entry(
                file_path=file_path,
                base_dir=base_dir,
                incremental=incremental,
                fast=fast,
                journal_map=journal_map,
                existing_map=existing_map,
                cache_map=cache_map,
                has_rich_meta_set=has_rich_meta_set,
                stats=stats,
            )
            if prepared_entry is not None:
                prepared.append(prepared_entry)
            if metadata_item is not None:
                needs_metadata.append(metadata_item)

        return prepared, needs_metadata

    def _build_fast_batch_entry(
        self,
        *,
        existing_id: int,
        file_path: Path,
        base_dir: str,
        filepath: str,
        mtime_ns: int,
        mtime: int,
        size: int,
        state_hash: str,
    ) -> Dict[str, Any]:
        if existing_id:
            return self._build_updated_entry(
                asset_id=existing_id,
                metadata_result=Result.Ok({}),
                filepath=filepath,
                file_path=file_path,
                state_hash=state_hash,
                mtime=mtime,
                size=size,
                fast=True,
                cache_store=False,
                mtime_ns=mtime_ns,
            )

        rel_path = self._safe_relative_path(file_path, base_dir)
        return self._build_added_entry(
            filename=file_path.name,
            subfolder=str(rel_path.parent) if rel_path.parent != Path(".") else "",
            filepath=filepath,
            kind=classify_file(file_path.name),
            metadata_result=Result.Ok({}),
            file_path=file_path,
            state_hash=state_hash,
            mtime=mtime,
            size=size,
            fast=True,
            cache_store=False,
            mtime_ns=mtime_ns,
        )

    @staticmethod
    def _batch_stat_to_values(stat_obj: os.stat_result) -> tuple[int, int, int]:
        return int(stat_obj.st_mtime_ns), int(stat_obj.st_mtime), int(stat_obj.st_size)

    @staticmethod
    def _should_skip_by_journal(
        *,
        incremental: bool,
        journal_state_hash: Optional[str],
        state_hash: str,
        fast: bool,
        existing_id: int,
        has_rich_meta_set: set[int],
    ) -> bool:
        if not (incremental and journal_state_hash and str(journal_state_hash) == state_hash):
            return False
        return bool(fast or (existing_id and existing_id in has_rich_meta_set))

    @staticmethod
    def _cached_refresh_payload(
        *,
        existing_id: int,
        existing_mtime: int,
        mtime: int,
        cache_map: Dict[tuple[str, str], Any],
        filepath: str,
        state_hash: str,
    ) -> tuple[Optional[Any], bool]:
        if not (existing_id and existing_mtime == mtime):
            return None, False
        cached_raw = cache_map.get((filepath, state_hash))
        if cached_raw:
            return cached_raw, False
        return None, True

    def _build_cached_refresh_entry(
        self,
        *,
        existing_id: int,
        cached_raw: Any,
        filepath: str,
        file_path: Path,
        state_hash: str,
        mtime: int,
        size: int,
        fast: bool,
    ) -> Dict[str, Any]:
        return self._build_refresh_entry(
            asset_id=existing_id,
            metadata_result=Result.Ok({"metadata_raw": cached_raw}, source="cache"),
            filepath=filepath,
            file_path=file_path,
            state_hash=state_hash,
            mtime=mtime,
            size=size,
            fast=fast,
            cache_store=False,
        )

    @staticmethod
    def _journal_state_hash(existing_state: Optional[Dict[str, Any]]) -> Optional[str]:
        if isinstance(existing_state, dict):
            return existing_state.get("journal_state_hash")
        return None

    @staticmethod
    def _metadata_queue_item(
        file_path: Path,
        filepath: str,
        mtime_ns: int,
        mtime: int,
        size: int,
        state_hash: str,
        existing_id: int,
    ) -> tuple[Path, str, int, int, int, str, Optional[int]]:
        return (
            file_path,
            filepath,
            mtime_ns,
            mtime,
            size,
            state_hash,
            existing_id if existing_id else None,
        )

    async def _prepare_single_batch_entry(
        self,
        file_path: Path,
        base_dir: str,
        incremental: bool,
        fast: bool,
        journal_map: Dict[str, str],
        existing_map: Dict[str, Dict[str, Any]],
        cache_map: Dict[tuple[str, str], Any],
        has_rich_meta_set: set[int],
        stats: Dict[str, Any],
    ) -> tuple[Optional[Dict[str, Any]], Optional[tuple[Path, str, int, int, int, str, Optional[int]]]]:
        fp = self._normalize_filepath_str(file_path)
        existing_state = await self._resolve_existing_state_for_batch(
            fp=fp,
            incremental=incremental,
            journal_map=journal_map,
            existing_map=existing_map,
        )

        stat_result = await self._stat_with_retry(file_path)
        if not stat_result[0]:
            stats["errors"] += 1
            logger.warning("Failed to stat %s: %s", str(file_path), stat_result[1])
            return None, None

        stat = stat_result[1]
        mtime_ns, mtime, size = self._batch_stat_to_values(stat)
        filepath = self._normalize_filepath_str(file_path)
        state_hash = self._compute_state_hash(filepath, mtime_ns, size)

        journal_state_hash = self._journal_state_hash(existing_state if isinstance(existing_state, dict) else None)

        existing_id, existing_mtime = self._extract_existing_asset_state(
            existing_state if isinstance(existing_state, dict) else None
        )

        if self._should_skip_by_journal(
            incremental=incremental,
            journal_state_hash=journal_state_hash,
            state_hash=state_hash,
            fast=fast,
            existing_id=existing_id,
            has_rich_meta_set=has_rich_meta_set,
        ):
            return {"action": "skipped_journal"}, None

        cached_raw, has_cached_miss = self._cached_refresh_payload(
            existing_id=existing_id,
            existing_mtime=existing_mtime,
            mtime=mtime,
            cache_map=cache_map,
            filepath=filepath,
            state_hash=state_hash,
        )
        if cached_raw is not None:
            return (
                self._build_cached_refresh_entry(
                    existing_id=existing_id,
                    cached_raw=cached_raw,
                    filepath=filepath,
                    file_path=file_path,
                    state_hash=state_hash,
                    mtime=mtime,
                    size=size,
                    fast=fast,
                ),
                None,
            )
        if has_cached_miss and existing_id in has_rich_meta_set:
            return {"action": "skipped"}, None

        if fast:
            return (
                self._build_fast_batch_entry(
                    existing_id=existing_id,
                    file_path=file_path,
                    base_dir=base_dir,
                    filepath=filepath,
                    mtime_ns=mtime_ns,
                    mtime=mtime,
                    size=size,
                    state_hash=state_hash,
                ),
                None,
            )

        return None, self._metadata_queue_item(
            file_path,
            filepath,
            mtime_ns,
            mtime,
            size,
            state_hash,
            existing_id,
        )

    async def _resolve_existing_state_for_batch(
        self,
        fp: str,
        incremental: bool,
        journal_map: Dict[str, str],
        existing_map: Dict[str, Dict[str, Any]],
    ) -> Optional[Dict[str, Any]]:
        existing_state: Optional[Dict[str, Any]]
        if incremental and fp in journal_map:
            existing_state = dict(existing_map.get(fp) or {})
            existing_state["journal_state_hash"] = journal_map.get(fp)
        else:
            existing_state = existing_map.get(fp)

        if IS_WINDOWS and not existing_state:
            try:
                existing_ci = await self.db.aquery(
                    "SELECT id, mtime, filepath FROM assets WHERE filepath = ? COLLATE NOCASE LIMIT 1",
                    (fp,),
                )
                if existing_ci.ok and existing_ci.data:
                    existing_state = existing_ci.data[0]
                    existing_map[fp] = existing_state
            except Exception:
                pass
        return existing_state

    async def _append_batch_metadata_entries(
        self,
        prepared: List[Dict[str, Any]],
        needs_metadata: List[tuple[Path, str, int, int, int, str, Optional[int]]],
        base_dir: str,
        fast: bool,
    ) -> None:
        if not needs_metadata:
            return

        paths_to_extract = [item[0] for item in needs_metadata]
        batch_metadata = await self.metadata.get_metadata_batch(
            [str(p) for p in paths_to_extract],
            scan_id=self._current_scan_id,
        )

        for file_path, filepath, mtime_ns, mtime, size, state_hash, existing_id_opt in needs_metadata:
            metadata_result: Optional[Result[Dict[str, Any]]] = batch_metadata.get(str(file_path))
            if not metadata_result:
                metadata_result = MetadataHelpers.metadata_error_payload(
                    Result.Err("METADATA_MISSING", "No metadata returned"),
                    filepath,
                )
            elif not metadata_result.ok:
                metadata_result = MetadataHelpers.metadata_error_payload(metadata_result, filepath)

            cache_store = bool(metadata_result.ok)
            if existing_id_opt:
                prepared.append(
                    {
                        "action": "updated",
                        "asset_id": existing_id_opt,
                        "metadata_result": metadata_result,
                        "filepath": filepath,
                        "file_path": file_path,
                        "mtime_ns": int(mtime_ns),
                        "state_hash": state_hash,
                        "mtime": mtime,
                        "size": size,
                        "fast": fast,
                        "cache_store": cache_store,
                    }
                )
                continue

            rel_path = self._safe_relative_path(file_path, base_dir)
            filename = file_path.name
            subfolder = str(rel_path.parent) if rel_path.parent != Path(".") else ""
            kind = classify_file(filename)
            prepared.append(
                {
                    "action": "added",
                    "filename": filename,
                    "subfolder": subfolder,
                    "filepath": filepath,
                    "kind": kind,
                    "metadata_result": metadata_result,
                    "file_path": file_path,
                    "mtime_ns": int(mtime_ns),
                    "state_hash": state_hash,
                    "mtime": mtime,
                    "size": size,
                    "fast": fast,
                    "cache_store": cache_store,
                }
            )

    async def _persist_prepared_entries(
        self,
        prepared: List[Dict[str, Any]],
        base_dir: str,
        source: str,
        root_id: Optional[str],
        stats: Dict[str, Any],
        to_enrich: Optional[List[str]],
        added_ids: Optional[List[int]],
    ) -> None:
        try:
            await self._persist_prepared_entries_tx(
                prepared=prepared,
                base_dir=base_dir,
                source=source,
                root_id=root_id,
                stats=stats,
                to_enrich=to_enrich,
                added_ids=added_ids,
            )
        except Exception as batch_error:
            if _is_fatal_db_error(batch_error):
                logger.error(
                    "Batch transaction failed with fatal database error (%s); aborting fallback.",
                    type(batch_error).__name__,
                    exc_info=batch_error,
                )
                raise

            suspect_fp, suspect_reason = self._diagnose_batch_failure(prepared, batch_error)
            if suspect_fp:
                logger.warning(
                    "Batch transaction failed near file '%s' (%s). Falling back to individual processing.",
                    suspect_fp,
                    suspect_reason,
                )
            else:
                logger.warning(
                    "Batch transaction failed (%s). Falling back to individual processing.",
                    suspect_reason,
                )
            logger.warning(
                "Batch transaction failed: %s. Falling back to individual processing.",
                str(batch_error),
            )
            await self._persist_prepared_entries_fallback(
                prepared=prepared,
                base_dir=base_dir,
                source=source,
                root_id=root_id,
                stats=stats,
                to_enrich=to_enrich,
            )

    async def _persist_prepared_entries_tx(
        self,
        prepared: List[Dict[str, Any]],
        base_dir: str,
        source: str,
        root_id: Optional[str],
        stats: Dict[str, Any],
        to_enrich: Optional[List[str]],
        added_ids: Optional[List[int]],
    ) -> None:
        async with self.db.atransaction(mode="immediate") as tx:
            if not tx.ok:
                raise RuntimeError(tx.error or "Failed to begin transaction")
            for entry in prepared:
                await self._process_prepared_entry_tx(
                    entry=entry,
                    base_dir=base_dir,
                    source=source,
                    root_id=root_id,
                    stats=stats,
                    to_enrich=to_enrich,
                    added_ids=added_ids,
                )
        if not tx.ok:
            raise RuntimeError(tx.error or "Commit failed")

    async def _process_prepared_entry_tx(
        self,
        entry: Dict[str, Any],
        base_dir: str,
        source: str,
        root_id: Optional[str],
        stats: Dict[str, Any],
        to_enrich: Optional[List[str]],
        added_ids: Optional[List[int]],
    ) -> None:
        action = entry.get("action")
        if action in ("skipped", "skipped_journal"):
            stats["skipped"] += 1
            return
        if self._entry_state_drifted(entry, stats):
            return
        if action == "refresh":
            await self._process_refresh_entry(
                entry=entry,
                base_dir=base_dir,
                stats=stats,
                to_enrich=to_enrich,
                fallback_mode=False,
                respect_enrich_limit=True,
            )
            return
        if action == "updated":
            await self._process_updated_entry(
                entry=entry,
                base_dir=base_dir,
                source=source,
                root_id=root_id,
                stats=stats,
                to_enrich=to_enrich,
                added_ids=added_ids,
                fallback_mode=False,
                respect_enrich_limit=True,
            )
            return
        if action == "added":
            await self._process_added_entry(
                entry=entry,
                base_dir=base_dir,
                source=source,
                root_id=root_id,
                stats=stats,
                to_enrich=to_enrich,
                added_ids=added_ids,
                fallback_mode=False,
                respect_enrich_limit=True,
            )
            return
        stats["skipped"] += 1

    async def _persist_prepared_entries_fallback(
        self,
        prepared: List[Dict[str, Any]],
        base_dir: str,
        source: str,
        root_id: Optional[str],
        stats: Dict[str, Any],
        to_enrich: Optional[List[str]],
    ) -> None:
        stats["batch_fallbacks"] = int(stats.get("batch_fallbacks") or 0) + 1
        with self._batch_fallback_lock:
            self._batch_fallback_count += 1
        stats["errors"] += len(prepared)
        failed_entries: List[str] = []

        for entry in prepared:
            action = entry.get("action")
            filepath_value = self._entry_display_path(entry)

            if action in ("skipped", "skipped_journal"):
                stats["skipped"] += 1
                self._fallback_correct_error(stats)
                continue
            try:
                if self._entry_state_drifted(entry, stats):
                    self._fallback_correct_error(stats)
                    continue

                async with self.db.atransaction(mode="immediate") as tx:
                    if not tx.ok:
                        failed_entries.append(filepath_value)
                        continue
                    ok = await self._process_prepared_entry_fallback(
                        entry=entry,
                        base_dir=base_dir,
                        source=source,
                        root_id=root_id,
                        stats=stats,
                        to_enrich=to_enrich,
                    )
                    if not ok:
                        failed_entries.append(filepath_value)
                        continue
                if not tx.ok:
                    failed_entries.append(filepath_value)
            except Exception as individual_error:
                failed_entries.append(filepath_value)
                logger.warning(
                    "Individual processing failed for entry: %s. Error: %s",
                    filepath_value,
                    str(individual_error),
                    exc_info=individual_error,
                )

        if failed_entries:
            sample = failed_entries[:5]
            logger.warning(
                "Batch fallback completed with %s failures (sample: %s)",
                len(failed_entries),
                sample,
            )

    async def _process_prepared_entry_fallback(
        self,
        entry: Dict[str, Any],
        base_dir: str,
        source: str,
        root_id: Optional[str],
        stats: Dict[str, Any],
        to_enrich: Optional[List[str]],
    ) -> bool:
        action = entry.get("action")
        if action == "refresh":
            return await self._process_refresh_entry(
                entry=entry,
                base_dir=base_dir,
                stats=stats,
                to_enrich=to_enrich,
                fallback_mode=True,
                respect_enrich_limit=True,
            )
        if action == "updated":
            return await self._process_updated_entry(
                entry=entry,
                base_dir=base_dir,
                source=source,
                root_id=root_id,
                stats=stats,
                to_enrich=to_enrich,
                added_ids=None,
                fallback_mode=True,
                respect_enrich_limit=False,
            )
        if action == "added":
            return await self._process_added_entry(
                entry=entry,
                base_dir=base_dir,
                source=source,
                root_id=root_id,
                stats=stats,
                to_enrich=to_enrich,
                added_ids=None,
                fallback_mode=True,
                respect_enrich_limit=False,
            )

        stats["skipped"] += 1
        self._fallback_correct_error(stats)
        return True

    async def _process_refresh_entry(
        self,
        entry: Dict[str, Any],
        base_dir: str,
        stats: Dict[str, Any],
        to_enrich: Optional[List[str]],
        fallback_mode: bool,
        respect_enrich_limit: bool,
    ) -> bool:
        asset_id = entry.get("asset_id")
        metadata_result = entry.get("metadata_result")
        invalid_refresh = self._invalid_refresh_entry(asset_id, metadata_result, stats, fallback_mode)
        if invalid_refresh is not None:
            return invalid_refresh

        try:
            if not isinstance(metadata_result, Result):
                if fallback_mode:
                    return False
                stats["skipped"] += 1
                return True
            if asset_id is None:
                if fallback_mode:
                    return False
                stats["skipped"] += 1
                return True
            try:
                asset_id_int = int(asset_id)
            except Exception:
                if fallback_mode:
                    return False
                stats["skipped"] += 1
                return True
            refreshed = await MetadataHelpers.refresh_metadata_if_needed(
                self.db,
                asset_id_int,
                metadata_result,
                *self._refresh_entry_context(entry, base_dir),
                self._write_scan_journal_entry,
            )
            self._record_refresh_outcome(
                stats=stats,
                fallback_mode=fallback_mode,
                refreshed=refreshed,
                entry=entry,
                to_enrich=to_enrich,
                respect_enrich_limit=respect_enrich_limit,
            )
            return True
        except Exception as exc:
            if not fallback_mode:
                stats["errors"] += 1
            logger.warning("Metadata refresh failed for asset_id=%s: %s", asset_id, exc)
            return not fallback_mode

    @staticmethod
    def _invalid_refresh_entry(
        asset_id: Any,
        metadata_result: Any,
        stats: Dict[str, Any],
        fallback_mode: bool,
    ) -> Optional[bool]:
        if asset_id and isinstance(metadata_result, Result):
            return None
        if fallback_mode:
            return False
        stats["skipped"] += 1
        return True

    @staticmethod
    def _refresh_entry_context(entry: Dict[str, Any], base_dir: str) -> tuple[str, str, str, int, int]:
        return (
            str(entry.get("filepath") or ""),
            base_dir,
            str(entry.get("state_hash") or ""),
            int(entry.get("mtime") or 0),
            int(entry.get("size") or 0),
        )

    def _record_refresh_outcome(
        self,
        *,
        stats: Dict[str, Any],
        fallback_mode: bool,
        refreshed: bool,
        entry: Dict[str, Any],
        to_enrich: Optional[List[str]],
        respect_enrich_limit: bool,
    ) -> None:
        stats["skipped"] += 1
        if fallback_mode:
            self._fallback_correct_error(stats)
        if refreshed:
            self._append_to_enrich(
                entry=entry,
                to_enrich=to_enrich,
                respect_limit=respect_enrich_limit,
            )

    async def _process_updated_entry(
        self,
        entry: Dict[str, Any],
        base_dir: str,
        source: str,
        root_id: Optional[str],
        stats: Dict[str, Any],
        to_enrich: Optional[List[str]],
        added_ids: Optional[List[int]],
        fallback_mode: bool,
        respect_enrich_limit: bool,
    ) -> bool:
        ctx = self._extract_update_entry_context(entry)
        if ctx is None:
            return self._handle_invalid_prepared_entry(stats, fallback_mode)

        await self._maybe_store_entry_cache(entry, ctx["metadata_result"])
        if not await self._apply_update_entry(entry, ctx, source, root_id):
            return self._handle_update_or_add_failure(stats, fallback_mode)

        await self._write_entry_scan_journal(entry, base_dir)
        self._record_index_entry_success(
            stats=stats,
            fallback_mode=fallback_mode,
            added_ids=added_ids,
            added_asset_id=ctx["asset_id"],
            entry=entry,
            action="updated",
            to_enrich=to_enrich,
            respect_enrich_limit=respect_enrich_limit,
        )
        return True

    async def _process_added_entry(
        self,
        entry: Dict[str, Any],
        base_dir: str,
        source: str,
        root_id: Optional[str],
        stats: Dict[str, Any],
        to_enrich: Optional[List[str]],
        added_ids: Optional[List[int]],
        fallback_mode: bool,
        respect_enrich_limit: bool,
    ) -> bool:
        ctx = self._extract_add_entry_context(entry)
        if ctx is None:
            return self._handle_invalid_prepared_entry(stats, fallback_mode)

        add_result = await self._apply_add_entry(entry, ctx, source, root_id)
        if not add_result.ok:
            return self._handle_update_or_add_failure(stats, fallback_mode)

        await self._maybe_store_entry_cache(entry, ctx["metadata_result"])
        await self._write_entry_scan_journal(entry, base_dir)
        added_asset_id = self._added_asset_id_from_result(add_result)
        self._record_index_entry_success(
            stats=stats,
            fallback_mode=fallback_mode,
            added_ids=added_ids,
            added_asset_id=added_asset_id,
            entry=entry,
            action="added",
            to_enrich=to_enrich,
            respect_enrich_limit=respect_enrich_limit,
        )
        return True

    def _extract_update_entry_context(self, entry: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        asset_id = entry.get("asset_id")
        metadata_result = entry.get("metadata_result")
        file_path_value = entry.get("file_path")
        if not asset_id or not isinstance(metadata_result, Result) or not isinstance(file_path_value, Path):
            return None
        return {
            "asset_id": int(asset_id),
            "metadata_result": metadata_result,
            "file_path": file_path_value,
        }

    def _extract_add_entry_context(self, entry: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        metadata_result = entry.get("metadata_result")
        kind_value = entry.get("kind")
        file_path_value = entry.get("file_path")
        if (
            not isinstance(metadata_result, Result)
            or not isinstance(kind_value, str)
            or not isinstance(file_path_value, Path)
        ):
            return None
        return {
            "metadata_result": metadata_result,
            "kind": cast(FileKind, kind_value),
            "file_path": file_path_value,
        }

    @staticmethod
    def _handle_invalid_prepared_entry(stats: Dict[str, Any], fallback_mode: bool) -> bool:
        if fallback_mode:
            return False
        stats["errors"] += 1
        return True

    @staticmethod
    def _handle_update_or_add_failure(stats: Dict[str, Any], fallback_mode: bool) -> bool:
        if fallback_mode:
            return False
        stats["errors"] += 1
        return True

    async def _maybe_store_entry_cache(self, entry: Dict[str, Any], metadata_result: Result[Any]) -> None:
        if not bool(entry.get("cache_store")):
            return
        try:
            await MetadataHelpers.store_metadata_cache(
                self.db,
                entry.get("filepath") or "",
                entry.get("state_hash") or "",
                metadata_result,
            )
        except Exception:
            return

    async def _apply_update_entry(
        self,
        entry: Dict[str, Any],
        ctx: Dict[str, Any],
        source: str,
        root_id: Optional[str],
    ) -> bool:
        res = await self._update_asset(
            ctx["asset_id"],
            ctx["file_path"],
            int(entry.get("mtime") or 0),
            int(entry.get("size") or 0),
            ctx["metadata_result"],
            source=source,
            root_id=root_id,
            write_metadata=not bool(entry.get("fast")),
        )
        return bool(res.ok)

    async def _apply_add_entry(
        self,
        entry: Dict[str, Any],
        ctx: Dict[str, Any],
        source: str,
        root_id: Optional[str],
    ) -> Result[Dict[str, Any]]:
        return await self._add_asset(
            entry.get("filename") or "",
            entry.get("subfolder") or "",
            entry.get("filepath") or "",
            ctx["kind"],
            int(entry.get("mtime") or 0),
            int(entry.get("size") or 0),
            ctx["file_path"],
            ctx["metadata_result"],
            source=source,
            root_id=root_id,
            write_metadata=True,
        )

    async def _write_entry_scan_journal(self, entry: Dict[str, Any], base_dir: str) -> None:
        await self._write_scan_journal_entry(
            entry.get("filepath") or "",
            base_dir,
            entry.get("state_hash") or "",
            int(entry.get("mtime") or 0),
            int(entry.get("size") or 0),
        )

    @staticmethod
    def _added_asset_id_from_result(add_result: Result[Dict[str, Any]]) -> Optional[int]:
        try:
            if add_result.data and add_result.data.get("asset_id"):
                return int(add_result.data["asset_id"])
        except Exception:
            return None
        return None

    def _record_index_entry_success(
        self,
        *,
        stats: Dict[str, Any],
        fallback_mode: bool,
        added_ids: Optional[List[int]],
        added_asset_id: Optional[int],
        entry: Dict[str, Any],
        action: str,
        to_enrich: Optional[List[str]],
        respect_enrich_limit: bool,
    ) -> None:
        stats[action] += 1
        if fallback_mode:
            self._fallback_correct_error(stats)
        elif added_ids is not None and added_asset_id:
            try:
                added_ids.append(int(added_asset_id))
            except Exception:
                pass
        self._append_to_enrich(entry=entry, to_enrich=to_enrich, respect_limit=respect_enrich_limit)
        try:
            logger.debug(
                "Indexed file (%s%s): %s [asset_id=%s]",
                action,
                "/fallback" if fallback_mode else "",
                entry.get("filepath") or "",
                added_asset_id,
            )
        except Exception:
            pass

    def _entry_state_drifted(self, entry: Dict[str, Any], stats: Dict[str, Any]) -> bool:
        file_path_value = entry.get("file_path")
        if not isinstance(file_path_value, Path):
            return False
        expected_mtime_ns = int(entry.get("mtime_ns") or 0)
        expected_size = int(entry.get("size") or 0)
        if not self._file_state_drifted(file_path_value, expected_mtime_ns, expected_size):
            return False
        stats["skipped"] += 1
        stats["skipped_state_changed"] = int(stats.get("skipped_state_changed") or 0) + 1
        return True

    def _append_to_enrich(
        self,
        entry: Dict[str, Any],
        to_enrich: Optional[List[str]],
        respect_limit: bool,
    ) -> None:
        if to_enrich is None or not entry.get("fast"):
            return
        if respect_limit and len(to_enrich) >= MAX_TO_ENRICH_ITEMS:
            return
        to_enrich.append(self._entry_display_path(entry))

    @staticmethod
    def _fallback_correct_error(stats: Dict[str, Any]) -> None:
        stats["errors"] = max(0, int(stats.get("errors") or 0) - 1)

    @staticmethod
    def _entry_display_path(entry: Dict[str, Any]) -> str:
        return str(entry.get("filepath") or entry.get("file_path") or "unknown")

    @staticmethod
    def _build_refresh_entry(
        *,
        asset_id: int,
        metadata_result: Result[Dict[str, Any]],
        filepath: str,
        file_path: Path,
        state_hash: str,
        mtime: int,
        size: int,
        fast: bool,
        cache_store: bool,
    ) -> Dict[str, Any]:
        return {
            "action": "refresh",
            "asset_id": asset_id,
            "metadata_result": metadata_result,
            "filepath": filepath,
            "file_path": file_path,
            "state_hash": state_hash,
            "mtime": mtime,
            "size": size,
            "fast": fast,
            "cache_store": cache_store,
        }

    @staticmethod
    def _build_updated_entry(
        *,
        asset_id: int,
        metadata_result: Result[Dict[str, Any]],
        filepath: str,
        file_path: Path,
        state_hash: str,
        mtime: int,
        size: int,
        fast: bool,
        cache_store: bool,
        mtime_ns: Optional[int] = None,
    ) -> Dict[str, Any]:
        entry: Dict[str, Any] = {
            "action": "updated",
            "asset_id": asset_id,
            "metadata_result": metadata_result,
            "filepath": filepath,
            "file_path": file_path,
            "state_hash": state_hash,
            "mtime": mtime,
            "size": size,
            "fast": fast,
            "cache_store": cache_store,
        }
        if mtime_ns is not None:
            entry["mtime_ns"] = int(mtime_ns)
        return entry

    @staticmethod
    def _build_added_entry(
        *,
        filename: str,
        subfolder: str,
        filepath: str,
        kind: FileKind,
        metadata_result: Result[Dict[str, Any]],
        file_path: Path,
        state_hash: str,
        mtime: int,
        size: int,
        fast: bool,
        cache_store: bool,
        mtime_ns: Optional[int] = None,
    ) -> Dict[str, Any]:
        entry: Dict[str, Any] = {
            "action": "added",
            "filename": filename,
            "subfolder": subfolder,
            "filepath": filepath,
            "kind": kind,
            "metadata_result": metadata_result,
            "file_path": file_path,
            "state_hash": state_hash,
            "mtime": mtime,
            "size": size,
            "fast": fast,
            "cache_store": cache_store,
        }
        if mtime_ns is not None:
            entry["mtime_ns"] = int(mtime_ns)
        return entry

    async def _prepare_metadata_for_entry(
        self,
        filepath: str,
        fast: bool,
    ) -> tuple[Result[Dict[str, Any]], bool]:
        if fast:
            return Result.Ok({}), False
        metadata_result = await self.metadata.get_metadata(filepath, scan_id=self._current_scan_id)
        if metadata_result.ok:
            return metadata_result, True
        return MetadataHelpers.metadata_error_payload(metadata_result, filepath), False

    async def _prepare_index_entry(
        self,
        file_path: Path,
        base_dir: str,
        incremental: bool,
        existing_state: Optional[Dict[str, Any]] = None,
        source: str = "output",
        root_id: Optional[str] = None,
        fast: bool = False,
    ) -> Result[Dict[str, Any]]:
        """
        Prepare indexing work for a file (stat + incremental decision + metadata extraction),
        but do not write to the DB. DB writes are applied in a batch transaction.
        """
        prepare_ctx, stat_error = await self._prepare_index_entry_context(file_path, existing_state, incremental)
        if prepare_ctx is None:
            return Result.Err("STAT_FAILED", f"Failed to stat file: {stat_error}")

        skip = await self._maybe_skip_prepare_for_incremental(
            prepare_ctx=prepare_ctx,
            incremental=incremental,
            fast=fast,
            file_path=file_path,
        )
        if skip is not None:
            return skip

        metadata_result, cache_store = await self._prepare_metadata_for_entry(prepare_ctx["filepath"], fast)
        if self._is_incremental_unchanged(prepare_ctx, incremental):
            return Result.Ok(
                self._build_refresh_entry(
                    asset_id=prepare_ctx["existing_id"],
                    metadata_result=metadata_result,
                    filepath=prepare_ctx["filepath"],
                    file_path=file_path,
                    state_hash=prepare_ctx["state_hash"],
                    mtime=prepare_ctx["mtime"],
                    size=prepare_ctx["size"],
                    fast=fast,
                    cache_store=cache_store,
                )
            )
        if prepare_ctx["existing_id"]:
            return Result.Ok(
                self._build_updated_entry(
                    asset_id=prepare_ctx["existing_id"],
                    metadata_result=metadata_result,
                    filepath=prepare_ctx["filepath"],
                    file_path=file_path,
                    state_hash=prepare_ctx["state_hash"],
                    mtime=prepare_ctx["mtime"],
                    size=prepare_ctx["size"],
                    fast=fast,
                    cache_store=cache_store,
                )
            )
        return Result.Ok(self._build_added_entry_from_prepare_ctx(prepare_ctx, file_path, base_dir, metadata_result, cache_store, fast))

    async def _prepare_index_entry_context(
        self,
        file_path: Path,
        existing_state: Optional[Dict[str, Any]],
        incremental: bool,
    ) -> tuple[Optional[Dict[str, Any]], Optional[str]]:
        stat_result = await self._stat_with_retry(file_path)
        if not stat_result[0]:
            return None, str(stat_result[1])
        stat = stat_result[1]
        mtime_ns = int(stat.st_mtime_ns)
        mtime = int(stat.st_mtime)
        size = int(stat.st_size)
        filepath = self._normalize_filepath_str(file_path)
        state_hash = self._compute_state_hash(filepath, mtime_ns, size)
        journal_state_hash = await self._get_journal_state_hash_for_index_file(filepath, existing_state, incremental)
        existing_asset = existing_state if isinstance(existing_state, dict) and existing_state.get("id") is not None else None
        existing_id, existing_mtime = self._extract_existing_asset_state(existing_asset)
        return {
            "filepath": filepath,
            "state_hash": state_hash,
            "journal_state_hash": journal_state_hash,
            "existing_id": existing_id,
            "existing_mtime": existing_mtime,
            "mtime": mtime,
            "size": size,
        }, None

    async def _maybe_skip_prepare_for_incremental(
        self,
        *,
        prepare_ctx: Dict[str, Any],
        incremental: bool,
        fast: bool,
        file_path: Path,
    ) -> Optional[Result[Dict[str, Any]]]:
        if await self._should_skip_by_journal_state(prepare_ctx, incremental=incremental, fast=fast):
            return Result.Ok({"action": "skipped_journal"})
        if not self._is_incremental_unchanged(prepare_ctx, incremental):
            return None
        cached_result = await self._refresh_entry_from_cached_metadata(prepare_ctx, file_path=file_path, fast=fast)
        if cached_result is not None:
            return cached_result
        if await self._asset_has_rich_metadata(prepare_ctx["existing_id"]):
            return Result.Ok({"action": "skipped"})
        return None

    async def _should_skip_by_journal_state(
        self,
        prepare_ctx: Dict[str, Any],
        *,
        incremental: bool,
        fast: bool,
    ) -> bool:
        if not incremental:
            return False
        if not prepare_ctx["journal_state_hash"]:
            return False
        if str(prepare_ctx["journal_state_hash"]) != prepare_ctx["state_hash"]:
            return False
        if fast:
            return True
        existing_id = int(prepare_ctx.get("existing_id") or 0)
        return bool(existing_id and await self._asset_has_rich_metadata(existing_id))

    async def _refresh_entry_from_cached_metadata(
        self,
        prepare_ctx: Dict[str, Any],
        *,
        file_path: Path,
        fast: bool,
    ) -> Optional[Result[Dict[str, Any]]]:
        cached = await MetadataHelpers.retrieve_cached_metadata(self.db, prepare_ctx["filepath"], prepare_ctx["state_hash"])
        if not (cached and cached.ok):
            return None
        return Result.Ok(
            self._build_refresh_entry(
                asset_id=prepare_ctx["existing_id"],
                metadata_result=cached,
                filepath=prepare_ctx["filepath"],
                file_path=file_path,
                state_hash=prepare_ctx["state_hash"],
                mtime=prepare_ctx["mtime"],
                size=prepare_ctx["size"],
                fast=fast,
                cache_store=False,
            )
        )

    @staticmethod
    def _is_incremental_unchanged(prepare_ctx: Dict[str, Any], incremental: bool) -> bool:
        return bool(incremental and prepare_ctx["existing_id"] and prepare_ctx["existing_mtime"] == prepare_ctx["mtime"])

    def _build_added_entry_from_prepare_ctx(
        self,
        prepare_ctx: Dict[str, Any],
        file_path: Path,
        base_dir: str,
        metadata_result: Result[Dict[str, Any]],
        cache_store: bool,
        fast: bool,
    ) -> Dict[str, Any]:
        rel_path = self._safe_relative_path(file_path, base_dir)
        filename = file_path.name
        subfolder = str(rel_path.parent) if rel_path.parent != Path(".") else ""
        kind = classify_file(filename)
        return self._build_added_entry(
            filename=filename,
            subfolder=subfolder,
            filepath=prepare_ctx["filepath"],
            kind=kind,
            metadata_result=metadata_result,
            file_path=file_path,
            state_hash=prepare_ctx["state_hash"],
            mtime=prepare_ctx["mtime"],
            size=prepare_ctx["size"],
            fast=fast,
            cache_store=cache_store,
        )



    def _iter_files(self, directory: Path, recursive: bool):
        """
        Generator to iterate over all asset files from directory (streaming).

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
                            next_dir = self._iter_files_next_dir(entry)
                            if isinstance(next_dir, Path):
                                stack.append(next_dir)
                                continue
                            file_path = self._iter_files_candidate(entry)
                            if file_path is not None:
                                yield file_path
                except (OSError, PermissionError):
                    continue
        else:
            for item in directory.iterdir():
                self._scan_iops_wait()
                if item.is_file() and self._is_supported_scan_file(item):
                    yield item

    @staticmethod
    def _is_supported_scan_file(path: Path) -> bool:
        try:
            ext = path.suffix.lower()
        except Exception:
            ext = ""
        if ext and _EXT_TO_KIND:
            return _EXT_TO_KIND.get(ext, "unknown") != "unknown"
        return classify_file(str(path)) != "unknown"

    @staticmethod
    def _iter_files_next_dir(entry) -> Optional[Path]:
        try:
            if entry.is_dir(follow_symlinks=False):
                return Path(entry.path)
        except (OSError, PermissionError):
            return None
        return None

    def _iter_files_candidate(self, entry) -> Optional[Path]:
        try:
            # Keep historical behavior: index symlinks to files, but do not recurse into symlinked dirs.
            if not entry.is_file(follow_symlinks=True):
                return None
            ext = os.path.splitext(entry.name)[1].lower()
            if ext and _EXT_TO_KIND and _EXT_TO_KIND.get(ext, "unknown") == "unknown":
                return None
            file_path = Path(entry.path)
            if self._is_supported_scan_file(file_path):
                return file_path
        except (OSError, PermissionError):
            return None
        return None

    @staticmethod
    def _file_state_drifted(file_path: Path, expected_mtime_ns: int, expected_size: int) -> bool:
        """Return True when file changed between initial stat and DB write time."""
        try:
            st = file_path.stat()
            return int(st.st_mtime_ns) != int(expected_mtime_ns) or int(st.st_size) != int(expected_size)
        except Exception:
            return True

    def get_runtime_status(self) -> Dict[str, Any]:
        try:
            with self._batch_fallback_lock:
                fallback_count = int(self._batch_fallback_count)
        except Exception:
            fallback_count = 0
        return {
            "batch_fallbacks_total": fallback_count,
            "scan_iops_limit": float(self._scan_iops_limit),
        }

    def _chunk_file_batches(self, files: List[Path]) -> Iterable[List[Path]]:
        """Yield batches of files for bounded transactions."""
        total = len(files)
        if total <= 0:
            return

        # Dynamic batch sizing: fewer transactions for large scans, but still bounded.
        if total < int(SCAN_BATCH_SMALL_THRESHOLD):
            batch_size = int(SCAN_BATCH_SMALL)
        elif total < int(SCAN_BATCH_MED_THRESHOLD):
            batch_size = int(SCAN_BATCH_MED)
        elif total < int(SCAN_BATCH_LARGE_THRESHOLD):
            batch_size = int(SCAN_BATCH_LARGE)
        else:
            batch_size = int(SCAN_BATCH_XL)

        batch_size = max(1, min(MAX_TRANSACTION_BATCH_SIZE, int(batch_size)))

        for start in range(0, total, batch_size):
            yield files[start:start + batch_size]

    def _safe_relative_path(self, file_path: Path, base_dir: str) -> Path:
        try:
            return file_path.relative_to(base_dir)
        except Exception:
            try:
                rel = os.path.relpath(str(file_path), base_dir)
                return Path(rel)
            except Exception:
                logger.warning(
                    "Could not compute relative path for %s from %s; using absolute path",
                    str(file_path),
                    str(base_dir),
                )
                return file_path

    def _compute_state_hash(self, filepath: str, mtime_ns: int, size: int) -> str:
        filepath = str(filepath or "")
        parts = [
            filepath.encode("utf-8"),
            str(mtime_ns).encode("utf-8"),
            str(size).encode("utf-8"),
        ]
        h = hashlib.sha256()
        for part in parts:
            h.update(part)
            h.update(b"\x00")
        return h.hexdigest()

    async def _get_journal_entry(self, filepath: str) -> Optional[Dict[str, Any]]:
        result = await self.db.aquery(
            "SELECT state_hash FROM scan_journal WHERE filepath = ?",
            (filepath,)
        )
        if not result.ok or not result.data:
            return None
        return result.data[0]

    async def _get_journal_entries(self, filepaths: List[str]) -> Dict[str, str]:
        """
        Batch lookup scan_journal state_hash for a list of filepaths.
        Returns {filepath: state_hash}.
        """
        cleaned = self._clean_journal_lookup_paths(filepaths)
        if not cleaned:
            return {}
        res = await self.db.aquery_in(
            "SELECT filepath, state_hash FROM scan_journal WHERE {IN_CLAUSE}",
            "filepath",
            cleaned,
        )
        if not res.ok:
            return {}
        return self._journal_rows_to_map(res.data or [])

    @staticmethod
    def _clean_journal_lookup_paths(filepaths: List[str]) -> List[str]:
        cleaned = [str(p) for p in (filepaths or []) if p]
        if len(cleaned) > MAX_SCAN_JOURNAL_LOOKUP:
            return cleaned[:MAX_SCAN_JOURNAL_LOOKUP]
        return cleaned

    @staticmethod
    def _journal_rows_to_map(rows: List[Any]) -> Dict[str, str]:
        out: Dict[str, str] = {}
        for row in rows:
            if not isinstance(row, dict):
                continue
            fp = row.get("filepath")
            sh = row.get("state_hash")
            if fp and sh:
                out[str(fp)] = str(sh)
        return out

    async def _write_scan_journal_entry(
        self,
        filepath: str,
        base_dir: str,
        state_hash: str,
        mtime: int,
        size: int
    ) -> Result[Any]:
        dir_path = str(Path(base_dir).resolve())
        return await self.db.aexecute(
            """
            INSERT OR REPLACE INTO scan_journal
            (filepath, dir_path, state_hash, mtime, size, last_seen)
            SELECT ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
            WHERE EXISTS (SELECT 1 FROM assets WHERE filepath = ?)
            """,
            (filepath, dir_path, state_hash, mtime, size, filepath)
        )

    async def _stat_with_retry(self, file_path: Path):
        for attempt in range(STAT_RETRY_COUNT):
            try:
                stat = await asyncio.to_thread(file_path.stat)
                return True, stat
            except OSError as exc:
                if attempt < (STAT_RETRY_COUNT - 1):
                    await asyncio.sleep(STAT_RETRY_BASE_DELAY_S * (attempt + 1))
                    continue
                logger.warning("Failed to stat %s after retries: %s", file_path, exc)
                return False, exc

    async def _asset_has_rich_metadata(self, asset_id: int) -> bool:
        if not asset_id:
            return False
        row = await self.db.aquery(
            "SELECT metadata_quality, metadata_raw FROM asset_metadata WHERE asset_id = ? LIMIT 1",
            (int(asset_id),),
        )
        if not row.ok or not row.data:
            return False
        try:
            data = row.data[0] or {}
            metadata_quality = str(data.get("metadata_quality") or "").strip().lower()
            metadata_raw = str(data.get("metadata_raw") or "").strip()
            return metadata_quality not in ("", "none") or metadata_raw not in ("", "{}", "null")
        except Exception:
            return False

    async def _index_file(
        self,
        file_path: Path,
        base_dir: str,
        incremental: bool,
        existing_state: Optional[Dict[str, Any]] = None,
        source: str = "output",
        root_id: Optional[str] = None,
        fast: bool = False,
    ) -> Result[Dict[str, str]]:
        """
        Index a single file.

        Args:
            file_path: File to index
            base_dir: Base directory for relative path calculation
            incremental: Skip if already indexed and unchanged
            existing_state: Pre-fetched existing state
            source: Source identifier
            root_id: Root identifier
            fast: Skip metadata extraction

        Returns:
            Result with action taken (added, updated, skipped)
        """
        state = await self._build_index_file_state(file_path)
        if isinstance(state, Result):
            return state
        file_path, filepath, state_hash, mtime, size = state

        journal_state_hash = await self._get_journal_state_hash_for_index_file(
            filepath,
            existing_state,
            incremental,
        )
        existing_asset = await self._resolve_existing_asset_for_index_file(filepath, existing_state)
        existing_id, existing_mtime = self._extract_existing_asset_state(existing_asset)

        skip_journal = await self._try_skip_by_journal(
            incremental=incremental,
            journal_state_hash=journal_state_hash,
            state_hash=state_hash,
            fast=fast,
            existing_id=existing_id,
        )
        if skip_journal is not None:
            return skip_journal

        cached_refresh = await self._try_cached_incremental_refresh(
            incremental=incremental,
            existing_id=existing_id,
            existing_mtime=existing_mtime,
            mtime=mtime,
            filepath=filepath,
            state_hash=state_hash,
            base_dir=base_dir,
            size=size,
        )
        if cached_refresh is not None:
            return cached_refresh

        metadata_result = await self._extract_metadata_for_index_file(
            file_path=file_path,
            filepath=filepath,
            state_hash=state_hash,
            fast=fast,
        )

        existing_id, existing_mtime = self._extract_existing_asset_state(existing_asset)
        incremental_refresh = await self._try_incremental_refresh_with_metadata(
            incremental=incremental,
            existing_id=existing_id,
            existing_mtime=existing_mtime,
            mtime=mtime,
            filepath=filepath,
            state_hash=state_hash,
            base_dir=base_dir,
            size=size,
            metadata_result=metadata_result,
        )
        if incremental_refresh is not None:
            return incremental_refresh

        rel_path = self._safe_relative_path(file_path, base_dir)
        filename = file_path.name
        subfolder = str(rel_path.parent) if rel_path.parent != Path(".") else ""
        kind = classify_file(filename)

        return await self._insert_new_asset_for_index_file(
            filename=filename,
            subfolder=subfolder,
            filepath=filepath,
            kind=kind,
            mtime=mtime,
            size=size,
            file_path=file_path,
            metadata_result=metadata_result,
            base_dir=base_dir,
            state_hash=state_hash,
            source=source,
            root_id=root_id,
        )

    async def _build_index_file_state(
        self,
        file_path: Path,
    ) -> Result[Dict[str, str]] | tuple[Path, str, str, int, int]:
        stat_result = await self._stat_with_retry(file_path)
        if not stat_result[0]:
            return Result.Err("STAT_FAILED", f"Failed to stat file: {stat_result[1]}")
        stat = stat_result[1]
        mtime_ns = int(stat.st_mtime_ns)
        mtime = int(stat.st_mtime)
        size = int(stat.st_size)
        resolved_path = self._resolve_index_file_path(file_path)
        filepath = self._normalize_filepath_str(resolved_path)
        state_hash = self._compute_state_hash(filepath, mtime_ns, size)
        return resolved_path, filepath, state_hash, mtime, size

    @staticmethod
    def _resolve_index_file_path(file_path: Path) -> Path:
        if not IS_WINDOWS:
            return file_path
        try:
            return Path(str(file_path)).resolve(strict=True)
        except Exception:
            return file_path

    async def _try_skip_by_journal(
        self,
        *,
        incremental: bool,
        journal_state_hash: Optional[str],
        state_hash: str,
        fast: bool,
        existing_id: int,
    ) -> Optional[Result[Dict[str, str]]]:
        if not (incremental and journal_state_hash and str(journal_state_hash) == state_hash):
            return None
        if fast:
            return Result.Ok({"action": "skipped_journal"})
        if existing_id and await self._asset_has_rich_metadata(existing_id):
            return Result.Ok({"action": "skipped_journal"})
        return None

    async def _get_journal_state_hash_for_index_file(
        self,
        filepath: str,
        existing_state: Optional[Dict[str, Any]],
        incremental: bool,
    ) -> Optional[str]:
        if isinstance(existing_state, dict) and "journal_state_hash" in existing_state:
            return cast(Optional[str], existing_state.get("journal_state_hash"))
        if not incremental:
            return None
        journal_entry = await self._get_journal_entry(filepath)
        if not isinstance(journal_entry, dict):
            return None
        value = journal_entry.get("state_hash")
        return str(value) if value else None

    async def _resolve_existing_asset_for_index_file(
        self,
        filepath: str,
        existing_state: Optional[Dict[str, Any]],
    ) -> Optional[Dict[str, Any]]:
        if isinstance(existing_state, dict) and existing_state.get("id") is not None:
            return existing_state

        existing = await self.db.aquery(
            "SELECT id, mtime, filepath FROM assets WHERE filepath = ?",
            (filepath,),
        )
        if existing.ok and existing.data:
            return existing.data[0]

        if not IS_WINDOWS:
            return None

        try:
            existing_ci = await self.db.aquery(
                "SELECT id, mtime, filepath FROM assets WHERE filepath = ? COLLATE NOCASE",
                (filepath,),
            )
        except Exception:
            return None
        if existing_ci.ok and existing_ci.data:
            return existing_ci.data[0]
        return None

    @staticmethod
    def _extract_existing_asset_state(existing_asset: Optional[Dict[str, Any]]) -> tuple[int, int]:
        if not isinstance(existing_asset, dict):
            return 0, 0
        try:
            existing_id = int(existing_asset.get("id") or 0)
            existing_mtime = int(existing_asset.get("mtime") or 0)
        except Exception:
            return 0, 0
        return existing_id, existing_mtime

    async def _try_cached_incremental_refresh(
        self,
        incremental: bool,
        existing_id: int,
        existing_mtime: int,
        mtime: int,
        filepath: str,
        state_hash: str,
        base_dir: str,
        size: int,
    ) -> Optional[Result[Dict[str, str]]]:
        if not (incremental and existing_id and existing_mtime == mtime):
            return None

        cached_metadata = await MetadataHelpers.retrieve_cached_metadata(self.db, filepath, state_hash)
        if cached_metadata and cached_metadata.ok:
            return await self._refresh_from_cached_metadata(
                existing_id=existing_id,
                cached_metadata=cached_metadata,
                filepath=filepath,
                base_dir=base_dir,
                state_hash=state_hash,
                mtime=mtime,
                size=size,
            )

        if await self._asset_has_rich_metadata(existing_id):
            return Result.Ok({"action": "skipped"})
        return None

    async def _refresh_from_cached_metadata(
        self,
        *,
        existing_id: int,
        cached_metadata: Result[Dict[str, Any]],
        filepath: str,
        base_dir: str,
        state_hash: str,
        mtime: int,
        size: int,
    ) -> Result[Dict[str, str]]:
        tx_state, refreshed = await self._refresh_from_cached_metadata_tx(
            existing_id=existing_id,
            cached_metadata=cached_metadata,
            filepath=filepath,
            base_dir=base_dir,
            state_hash=state_hash,
            mtime=mtime,
            size=size,
        )
        if not tx_state:
            return Result.Ok({"action": "skipped"})
        if not tx_state.ok:
            logger.warning("Metadata refresh commit failed for %s: %s", filepath, tx_state.error)
            return Result.Ok({"action": "skipped"})
        return Result.Ok({"action": "skipped_refresh" if refreshed else "skipped"})

    async def _refresh_from_cached_metadata_tx(
        self,
        *,
        existing_id: int,
        cached_metadata: Result[Dict[str, Any]],
        filepath: str,
        base_dir: str,
        state_hash: str,
        mtime: int,
        size: int,
    ) -> tuple[Optional[Any], bool]:
        refreshed = False
        async with self.db.atransaction(mode="immediate") as tx:
            if not tx.ok:
                logger.warning(
                    "Metadata refresh skipped (transaction begin failed) for %s: %s",
                    filepath,
                    tx.error,
                )
                return None, False
            refreshed = await MetadataHelpers.refresh_metadata_if_needed(
                self.db,
                existing_id,
                cached_metadata,
                filepath,
                base_dir,
                state_hash,
                mtime,
                size,
                self._write_scan_journal_entry,
            )
            if refreshed:
                await self._write_scan_journal_entry(filepath, base_dir, state_hash, mtime, size)
            return tx, refreshed

    async def _extract_metadata_for_index_file(
        self,
        file_path: Path,
        filepath: str,
        state_hash: str,
        fast: bool,
    ) -> Result[Dict[str, Any]]:
        if fast:
            return Result.Ok({})

        metadata_result = await self.metadata.get_metadata(filepath, scan_id=self._current_scan_id)
        if metadata_result.ok:
            quality = metadata_result.meta.get("quality", "full")
            if quality in ("degraded", "partial"):
                logger.debug(
                    "Metadata extraction completed with degraded quality for %s: %s",
                    file_path,
                    quality,
                )
            await MetadataHelpers.store_metadata_cache(self.db, filepath, state_hash, metadata_result)
            return metadata_result

        if metadata_result.code == ErrorCode.FFPROBE_ERROR:
            self._log_scan_event(
                logging.WARNING,
                "FFprobe error during metadata extraction",
                filepath=str(file_path),
                tool="ffprobe",
                error=metadata_result.error,
                code=metadata_result.code,
            )
        else:
            self._log_scan_event(
                logging.WARNING,
                "Metadata extraction issue",
                filepath=str(file_path),
                error=metadata_result.error,
                code=metadata_result.code,
            )
        return MetadataHelpers.metadata_error_payload(metadata_result, str(file_path))

    async def _try_incremental_refresh_with_metadata(
        self,
        incremental: bool,
        existing_id: int,
        existing_mtime: int,
        mtime: int,
        filepath: str,
        state_hash: str,
        base_dir: str,
        size: int,
        metadata_result: Result[Dict[str, Any]],
    ) -> Optional[Result[Dict[str, str]]]:
        if not (incremental and existing_id and existing_mtime == mtime):
            return None

        refreshed = False
        try:
            tx_state, refreshed = await self._run_incremental_metadata_refresh_locked(
                existing_id,
                metadata_result,
                filepath,
                base_dir,
                state_hash,
                mtime,
                size,
            )
        except sqlite3.OperationalError:
            return Result.Err("DB_BUSY", "Database busy while refreshing metadata")

        if not tx_state or not tx_state.ok:
            return Result.Err("DB_ERROR", tx_state.error or "Commit failed")
        action = "skipped_refresh" if refreshed else "skipped"
        return Result.Ok({"action": action})

    async def _run_incremental_metadata_refresh_locked(
        self,
        existing_id: int,
        metadata_result: Result[Dict[str, Any]],
        filepath: str,
        base_dir: str,
        state_hash: str,
        mtime: int,
        size: int,
    ) -> tuple[Any, bool]:
        async with self.db.lock_for_asset(existing_id):
            try:
                return await self._run_incremental_metadata_refresh_tx(
                    existing_id,
                    metadata_result,
                    filepath,
                    base_dir,
                    state_hash,
                    mtime,
                    size,
                )
            except sqlite3.OperationalError as exc:
                if self.db._is_locked_error(exc):
                    logger.warning(
                        "Database busy while refreshing metadata (asset=%s): %s",
                        existing_id,
                        exc,
                    )
                raise

    async def _run_incremental_metadata_refresh_tx(
        self,
        existing_id: int,
        metadata_result: Result[Dict[str, Any]],
        filepath: str,
        base_dir: str,
        state_hash: str,
        mtime: int,
        size: int,
    ) -> tuple[Any, bool]:
        refreshed = False
        async with self.db.atransaction(mode="immediate") as tx:
            if not tx.ok:
                return tx, refreshed
            refreshed = await MetadataHelpers.refresh_metadata_if_needed(
                self.db,
                existing_id,
                metadata_result,
                filepath,
                base_dir,
                state_hash,
                mtime,
                size,
                self._write_scan_journal_entry,
            )
            if refreshed:
                await self._write_scan_journal_entry(filepath, base_dir, state_hash, mtime, size)
            return tx, refreshed

    async def _insert_new_asset_for_index_file(
        self,
        filename: str,
        subfolder: str,
        filepath: str,
        kind: FileKind,
        mtime: int,
        size: int,
        file_path: Path,
        metadata_result: Result[Dict[str, Any]],
        base_dir: str,
        state_hash: str,
        source: str,
        root_id: Optional[str],
    ) -> Result[Dict[str, str]]:
        try:
            tx_state, result = await self._insert_new_asset_tx(
                filename,
                subfolder,
                filepath,
                kind,
                mtime,
                size,
                file_path,
                metadata_result,
                base_dir,
                state_hash,
                source,
                root_id,
            )
        except sqlite3.OperationalError as exc:
            if self.db._is_locked_error(exc):
                logger.warning("Database busy while inserting asset %s: %s", filepath, exc)
                return Result.Err("DB_BUSY", "Database busy while inserting asset")
            raise

        if not tx_state or not tx_state.ok:
            return Result.Err("DB_ERROR", tx_state.error or "Commit failed")
        if result.ok and isinstance(result.data, dict):
            asset_id = result.data.get("asset_id")
            if asset_id is not None:
                await self._write_metadata_row(int(asset_id), metadata_result, filepath=filepath)
        return result

    async def _insert_new_asset_tx(
        self,
        filename: str,
        subfolder: str,
        filepath: str,
        kind: FileKind,
        mtime: int,
        size: int,
        file_path: Path,
        metadata_result: Result[Dict[str, Any]],
        base_dir: str,
        state_hash: str,
        source: str,
        root_id: Optional[str],
    ) -> tuple[Any, Result[Dict[str, str]]]:
        async with self.db.atransaction(mode="immediate") as tx:
            if not tx.ok:
                return tx, Result.Err("DB_ERROR", tx.error or "Failed to begin transaction")
            result = await self._add_asset(
                filename,
                subfolder,
                filepath,
                kind,
                mtime,
                size,
                file_path,
                metadata_result,
                source=source,
                root_id=root_id,
                write_metadata=False,
                skip_lock=True,
            )
            if result.ok:
                await self._write_scan_journal_entry(filepath, base_dir, state_hash, mtime, size)
            return tx, result

    async def _add_asset(
        self,
        filename: str,
        subfolder: str,
        filepath: str,
        kind: FileKind,
        mtime: int,
        size: int,
        file_path: Path,
        metadata_result: Result[Dict[str, Any]],
        source: str = "output",
        root_id: Optional[str] = None,
        write_metadata: bool = True,
        skip_lock: bool = False,
    ) -> Result[Dict[str, str]]:
        """
        Add new asset to database.
        """
        width, height, duration = self._asset_dimensions_from_metadata(metadata_result)

        # Insert into assets table (NO workflow fields here)
        insert_result = await self.db.aexecute(
            """
            INSERT INTO assets
            (filename, subfolder, filepath, source, root_id, kind, ext, width, height, duration, size, mtime)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                filename,
                subfolder,
                filepath,
                str(source or "output"),
                str(root_id) if root_id else None,
                kind,
                Path(filename).suffix.lower(),
                width,
                height,
                duration,
                size,
                mtime,
            )
        )

        if not insert_result.ok:
            return Result.Err("INSERT_FAILED", insert_result.error or "Failed to insert asset")

        asset_id = insert_result.data if insert_result.ok else None
        if not asset_id:
            return Result.Err("INSERT_FAILED", "Failed to get inserted asset ID")
        await self._write_asset_metadata_if_needed(
            asset_id,
            metadata_result,
            filepath=filepath,
            write_metadata=write_metadata,
            skip_lock=skip_lock,
        )

        return Result.Ok({"action": "added", "asset_id": asset_id})

    @staticmethod
    def _asset_dimensions_from_metadata(metadata_result: Result[Dict[str, Any]]) -> tuple[Any, Any, Any]:
        if metadata_result.ok and metadata_result.data:
            meta = metadata_result.data
            return meta.get("width"), meta.get("height"), meta.get("duration")
        return None, None, None

    async def _write_asset_metadata_if_needed(
        self,
        asset_id: Any,
        metadata_result: Result[Dict[str, Any]],
        *,
        filepath: str,
        write_metadata: bool,
        skip_lock: bool,
    ) -> None:
        if not write_metadata or skip_lock:
            return
        metadata_write = await MetadataHelpers.write_asset_metadata_row(
            self.db,
            asset_id,
            metadata_result,
            filepath=filepath,
        )
        if metadata_write.ok:
            return
        self._log_scan_event(
            logging.WARNING,
            "Failed to insert metadata row",
            asset_id=asset_id,
            error=metadata_write.error,
            stage="metadata_write"
        )

    async def _update_asset(
        self,
        asset_id: int,
        file_path: Path,
        mtime: int,
        size: int,
        metadata_result: Result[Dict[str, Any]],
        source: str = "output",
        root_id: Optional[str] = None,
        write_metadata: bool = True,
        skip_lock: bool = False,
    ) -> Result[Dict[str, str]]:
        """
        Update existing asset in database.
        """
        width = None
        height = None
        duration = None

        if metadata_result.ok and metadata_result.data:
            meta = metadata_result.data
            width = meta.get("width")
            height = meta.get("height")
            duration = meta.get("duration")

        async def _run_update():
            update_result = await self.db.aexecute(
                """
                UPDATE assets
                SET width = COALESCE(?, width),
                    height = COALESCE(?, height),
                    duration = COALESCE(?, duration),
                    size = ?, mtime = ?,
                    source = ?, root_id = ?,
                    content_hash = NULL,
                    phash = NULL,
                    hash_state = NULL,
                    indexed_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                (width, height, duration, size, mtime, str(source or "output"), str(root_id) if root_id else None, asset_id)
            )

            if not update_result.ok:
                return Result.Err("UPDATE_FAILED", update_result.error)

            if write_metadata and not skip_lock:
                metadata_write = await MetadataHelpers.write_asset_metadata_row(
                    self.db,
                    asset_id,
                    metadata_result,
                    filepath=str(file_path) if file_path else None,
                )
                if not metadata_write.ok:
                    self._log_scan_event(
                        logging.WARNING,
                        "Failed to update metadata row",
                        asset_id=asset_id,
                        error=metadata_write.error,
                        stage="metadata_write"
                    )
            return Result.Ok({"action": "updated", "asset_id": asset_id})

        if skip_lock:
            return await _run_update()

        async with self.db.lock_for_asset(asset_id):
            return await _run_update()

        return Result.Ok({"action": "updated", "asset_id": asset_id})

    def _scan_context(self, **kwargs) -> Dict[str, Any]:
        context = {"scan_id": self._current_scan_id} if self._current_scan_id else {}
        context.update(kwargs)
        return context

    def _log_scan_event(self, level: int, message: str, **context):
        log_structured(logger, level, message, **self._scan_context(**context))

    async def _write_metadata_row(
        self,
        asset_id: int,
        metadata_result: Result[Dict[str, Any]],
        filepath: Optional[str] = None,
    ) -> None:
        if not metadata_result.ok:
            return
        metadata_write = await MetadataHelpers.write_asset_metadata_row(
            self.db,
            asset_id,
            metadata_result,
            filepath=filepath,
        )
        if not metadata_write.ok:
            self._log_scan_event(
                logging.WARNING,
                "Failed to write metadata row after transaction",
                asset_id=asset_id,
                error=metadata_write.error,
                stage="metadata_write"
            )
