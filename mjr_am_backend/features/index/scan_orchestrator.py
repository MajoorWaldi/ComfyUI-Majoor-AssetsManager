"""
High-level scan/index orchestration helpers.
"""
import logging
import time
from datetime import datetime
from pathlib import Path
from typing import Any
from uuid import uuid4

from ...shared import ErrorCode, Result, classify_file, get_logger
from .fs_walker import _EXT_TO_KIND
from .index_batching import finalize_index_paths, index_paths_batches
from .metadata_helpers import MetadataHelpers
from .scan_batch_utils import empty_index_stats, new_index_stats, new_scan_stats
from .scan_streaming import run_scan_streaming_loop

logger = get_logger(__name__)


def validate_scan_directory(dir_path: Path, directory: str) -> Result[dict[str, Any]] | None:
    try:
        if not str(directory or "").strip():
            return Result.Err(ErrorCode.INVALID_INPUT, "Directory path is required")
        if not dir_path.exists():
            return Result.Err(ErrorCode.NOT_FOUND, f"Directory does not exist: {directory}")
        if not dir_path.is_dir():
            return Result.Err(ErrorCode.INVALID_INPUT, f"Path is not a directory: {directory}")
    except Exception as exc:
        return Result.Err(ErrorCode.INVALID_INPUT, f"Invalid directory path: {exc}")
    return None


async def scan_directory(
    scanner: Any,
    *,
    directory: str,
    recursive: bool = True,
    incremental: bool = True,
    source: str = "output",
    root_id: str | None = None,
    fast: bool = False,
    background_metadata: bool = False,
) -> Result[dict[str, Any]]:
    to_enrich: list[str] = []
    async with scanner._scan_lock:
        dir_path = Path(directory)
        validation_error = validate_scan_directory(dir_path, directory)
        if validation_error is not None:
            return validation_error

        scan_id = str(uuid4())
        scanner._current_scan_id = scan_id
        scan_start = time.perf_counter()

        scanner._log_scan_event(
            logging.INFO,
            "Starting directory scan",
            directory=directory,
            recursive=recursive,
            incremental=incremental,
            files_root=str(dir_path),
            background_metadata=bool(background_metadata),
        )

        stats: dict[str, Any] = new_scan_stats()
        try:
            await run_scan_streaming_loop(
                scanner,
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
            await MetadataHelpers.set_metadata_value(scanner.db, "last_scan_end", stats["end_time"])

            scanner._log_scan_event(
                logging.INFO,
                "Directory scan complete",
                duration_seconds=duration,
                scanned=stats["scanned"],
                added=stats["added"],
                updated=stats["updated"],
                skipped=stats["skipped"],
                errors=stats["errors"],
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
            scanner._current_scan_id = None

    if to_enrich:
        stats["to_enrich"] = to_enrich

    logger.debug(
        "Scan complete: %s added, %s updated, %s skipped, %s errors",
        stats.get("added"),
        stats.get("updated"),
        stats.get("skipped"),
        stats.get("errors"),
    )
    return Result.Ok(stats)


async def index_paths(
    scanner: Any,
    *,
    paths: list[Path],
    base_dir: str,
    incremental: bool = True,
    source: str = "output",
    root_id: str | None = None,
) -> Result[dict[str, Any]]:
    async with scanner._index_lock:
        paths = filter_indexable_paths(paths)
        if not paths:
            return Result.Ok(empty_index_stats())

        scan_id = str(uuid4())
        scanner._current_scan_id = scan_id
        scan_start = time.perf_counter()
        log_index_paths_start(scanner, paths=paths, base_dir=base_dir, incremental=incremental)
        stats = new_index_stats(len(paths))
        added_ids: list[int] = []
        try:
            await index_paths_batches(
                scanner,
                paths=paths,
                base_dir=base_dir,
                incremental=incremental,
                source=source,
                root_id=root_id,
                stats=stats,
                added_ids=added_ids,
            )
        finally:
            await finalize_index_paths(scanner, scan_start=scan_start, stats=stats)
            scanner._current_scan_id = None

    if added_ids:
        stats["added_ids"] = added_ids
    return Result.Ok(stats)


def filter_indexable_paths(paths: list[Path]) -> list[Path]:
    filtered_paths: list[Path] = []
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


def log_index_paths_start(scanner: Any, *, paths: list[Path], base_dir: str, incremental: bool) -> None:
    start_log_level = logging.DEBUG if len(paths) == 1 else logging.INFO
    scanner._log_scan_event(
        start_log_level,
        "Starting file list index",
        file_count=len(paths),
        base_dir=base_dir,
        incremental=incremental,
    )
