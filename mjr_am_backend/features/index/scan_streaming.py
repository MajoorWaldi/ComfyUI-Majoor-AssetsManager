"""
Streaming scan helpers extracted from scanner.py.

These functions keep scan orchestration logic separate while preserving the
existing IndexScanner behavior through thin method wrappers.
"""
import asyncio
import threading
from pathlib import Path
from queue import Queue
from typing import Any

from ...config import SCAN_BATCH_XL
from .fs_walker import _FS_WALK_EXECUTOR
from .index_batching import existing_map_for_batch, index_batch
from .scan_storage_ops import get_journal_entries
from .scan_batch_utils import normalize_filepath_str, stream_batch_target


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
) -> None:
    loop = asyncio.get_running_loop()
    stop_event = threading.Event()
    q: Queue[Path | None] = Queue(maxsize=max(1000, int(SCAN_BATCH_XL) * 4))
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
            stop_event=stop_event,
        )
    finally:
        stop_event.set()
        try:
            await asyncio.wait_for(walk_future, timeout=2.0)
        except Exception:
            pass


async def consume_scan_queue(
    scanner: Any,
    *,
    q: "Queue[Path | None]",
    directory: str,
    incremental: bool,
    source: str,
    root_id: str | None,
    fast: bool,
    stats: dict[str, Any],
    to_enrich: list[str],
    stop_event: threading.Event,
) -> None:
    batch: list[Path] = []
    done = False
    try:
        while not done:
            target = stream_batch_target(stats["scanned"])
            pulled = await asyncio.to_thread(scanner._fs_walker.drain_queue, q, target)
            if not pulled:
                await asyncio.sleep(0)
                continue
            for file_path in pulled:
                if file_path is None:
                    done = True
                    break
                batch.append(file_path)
                stats["scanned"] += 1
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
                    )
                    batch = []
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
            )
    except asyncio.CancelledError:
        stop_event.set()
        raise asyncio.CancelledError()


async def process_scan_batch(
    scanner: Any,
    *,
    batch: list[Path],
    directory: str,
    incremental: bool,
    source: str,
    root_id: str | None,
    fast: bool,
    stats: dict[str, Any],
    to_enrich: list[str],
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
    )


async def scan_stream_batch(
    scanner: Any,
    *,
    batch: list[Path],
    base_dir: str,
    incremental: bool,
    source: str,
    root_id: str | None,
    fast: bool,
    stats: dict[str, Any],
    to_enrich: list[str],
) -> None:
    if not batch:
        return

    filepaths = [normalize_filepath_str(p) for p in batch]
    journal_map = (await get_journal_entries(scanner, filepaths=filepaths)) if incremental and filepaths else {}
    existing_map = await existing_map_for_batch(scanner, filepaths=filepaths)

    await index_batch(
        scanner,
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
