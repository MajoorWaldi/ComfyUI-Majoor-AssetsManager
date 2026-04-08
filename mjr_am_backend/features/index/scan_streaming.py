"""
Streaming scan helpers extracted from scanner.py.

These functions keep scan orchestration logic separate while preserving the
existing IndexScanner behavior through thin method wrappers.
"""
import asyncio
import logging
import threading
import time
from pathlib import Path
from queue import Queue
from typing import Any

from ...config import SCAN_BATCH_XL, SCAN_LOG_PROGRESS_EVERY, SCAN_LOG_PROGRESS_MIN_SECONDS
from .fs_walker import _FS_WALK_EXECUTOR, ScanQueueItem, scan_candidate_path
from .index_batching import BatchCandidate, existing_map_for_batch, index_batch
from .scan_batch_utils import normalize_filepath_str, stream_batch_target
from .scan_storage_ops import get_journal_entries


async def run_scan_streaming_loop(
    scanner: Any,
    *,
    dir_path: Path,
    directory: str,
    recursive: bool,
    incremental: bool,
    source: str,
    root_id: str | None,
    fast: bool,
    stats: dict[str, Any],
    to_enrich: list[str],
    added_ids: list[int] | None = None,
) -> None:
    loop = asyncio.get_running_loop()
    stop_event = threading.Event()
    q: Queue[ScanQueueItem] = Queue(maxsize=max(1000, int(SCAN_BATCH_XL) * 4))
    walk_future = loop.run_in_executor(
        _FS_WALK_EXECUTOR,
        scanner._fs_walker.walk_and_enqueue,
        dir_path,
        recursive,
        stop_event,
        q,
    )
    try:
        await consume_scan_queue(
            scanner,
            q=q,
            directory=directory,
            incremental=incremental,
            source=source,
            root_id=root_id,
            fast=fast,
            stats=stats,
            to_enrich=to_enrich,
            added_ids=added_ids,
            stop_event=stop_event,
        )
    finally:
        stop_event.set()
        try:
            await asyncio.wait_for(walk_future, timeout=2.0)
        except Exception:
            pass


def _should_log_progress(
    scanned_count: int,
    last_progress_scanned: int,
    now: float,
    last_progress_ts: float,
    progress_every: int,
    progress_min_seconds: float,
) -> bool:
    return (
        progress_every > 0
        and scanned_count - last_progress_scanned >= progress_every
        and (now - last_progress_ts) >= progress_min_seconds
    )


def _emit_scan_progress(scanner: Any, stats: dict[str, Any], batch: list[ScanQueueItem], scanned_count: int) -> None:
    try:
        log_event = getattr(scanner, "_log_scan_event", None)
        if callable(log_event):
            log_event(
                logging.INFO,
                "Directory scan progress",
                scanned=scanned_count,
                added=int(stats.get("added") or 0),
                updated=int(stats.get("updated") or 0),
                skipped=int(stats.get("skipped") or 0),
                errors=int(stats.get("errors") or 0),
                queue_batch_size=len(batch),
            )
    except Exception:
        pass


async def _process_pulled_files(
    scanner: Any,
    pulled: list[ScanQueueItem],
    batch: list[ScanQueueItem],
    stats: dict[str, Any],
    progress_every: int,
    progress_min_seconds: float,
    last_progress_scanned: int,
    last_progress_ts: float,
    directory: str,
    incremental: bool,
    source: str,
    root_id: str | None,
    fast: bool,
    to_enrich: list[str],
    added_ids: list[int] | None,
) -> tuple[list[ScanQueueItem], bool, int, float]:
    done = False
    for file_path in pulled:
        if file_path is None:
            done = True
            break
        batch.append(file_path)
        stats["scanned"] += 1
        scanned_count = int(stats.get("scanned") or 0)
        now = time.monotonic()
        if _should_log_progress(scanned_count, last_progress_scanned, now, last_progress_ts, progress_every, progress_min_seconds):
            _emit_scan_progress(scanner, stats, batch, scanned_count)
            last_progress_scanned = scanned_count
            last_progress_ts = now
        if len(batch) >= stream_batch_target(stats["scanned"]):
            await process_scan_batch(
                scanner,
                batch=batch,
                directory=directory,
                incremental=incremental,
                source=source,
                root_id=root_id,
                fast=fast,
                stats=stats,
                to_enrich=to_enrich,
                added_ids=added_ids,
            )
            batch = []
    return batch, done, last_progress_scanned, last_progress_ts


async def consume_scan_queue(
    scanner: Any,
    *,
    q: "Queue[ScanQueueItem]",
    directory: str,
    incremental: bool,
    source: str,
    root_id: str | None,
    fast: bool,
    stats: dict[str, Any],
    to_enrich: list[str],
    added_ids: list[int] | None = None,
    stop_event: threading.Event,
) -> None:
    batch: list[ScanQueueItem] = []
    done = False
    progress_every = max(0, int(SCAN_LOG_PROGRESS_EVERY))
    progress_min_seconds = max(0.0, float(SCAN_LOG_PROGRESS_MIN_SECONDS))
    last_progress_scanned = int(stats.get("scanned") or 0)
    last_progress_ts = time.monotonic()
    try:
        while not done:
            target = stream_batch_target(stats["scanned"])
            pulled = await asyncio.to_thread(scanner._fs_walker.drain_queue, q, target)
            if not pulled:
                await asyncio.sleep(0)
                continue
            batch, done, last_progress_scanned, last_progress_ts = await _process_pulled_files(
                scanner,
                pulled,
                batch,
                stats,
                progress_every,
                progress_min_seconds,
                last_progress_scanned,
                last_progress_ts,
                directory,
                incremental,
                source,
                root_id,
                fast,
                to_enrich,
                added_ids,
            )
            await asyncio.sleep(0)
        if batch:
            await process_scan_batch(
                scanner,
                batch=batch,
                directory=directory,
                incremental=incremental,
                source=source,
                root_id=root_id,
                fast=fast,
                stats=stats,
                to_enrich=to_enrich,
                added_ids=added_ids,
            )
    except asyncio.CancelledError:
        stop_event.set()
        raise


async def process_scan_batch(
    scanner: Any,
    *,
    batch: list[ScanQueueItem],
    directory: str,
    incremental: bool,
    source: str,
    root_id: str | None,
    fast: bool,
    stats: dict[str, Any],
    to_enrich: list[str],
    added_ids: list[int] | None = None,
) -> None:
    await scan_stream_batch(
        scanner,
        batch=batch,
        base_dir=directory,
        incremental=incremental,
        source=source,
        root_id=root_id,
        fast=fast,
        stats=stats,
        to_enrich=to_enrich,
        added_ids=added_ids,
    )


async def scan_stream_batch(
    scanner: Any,
    *,
    batch: list[ScanQueueItem],
    base_dir: str,
    incremental: bool,
    source: str,
    root_id: str | None,
    fast: bool,
    stats: dict[str, Any],
    to_enrich: list[str],
    added_ids: list[int] | None = None,
) -> None:
    if not batch:
        return

    batch_candidates: list[BatchCandidate] = [item for item in batch if item is not None]
    if not batch_candidates:
        return

    filepaths = [normalize_filepath_str(scan_candidate_path(p)) for p in batch_candidates]
    journal_map = (await get_journal_entries(scanner, filepaths=filepaths)) if incremental and filepaths else {}
    existing_map = await existing_map_for_batch(scanner, filepaths=filepaths)

    await index_batch(
        scanner,
        batch=batch_candidates,
        base_dir=base_dir,
        incremental=incremental,
        source=source,
        root_id=root_id,
        fast=fast,
        journal_map=journal_map,
        existing_map=existing_map,
        stats=stats,
        to_enrich=to_enrich,
        added_ids=added_ids,
    )
