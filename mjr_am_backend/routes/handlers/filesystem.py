"""
Filesystem operations: background scanning and file listing.
"""

from __future__ import annotations

import asyncio
import datetime
import os
import time
from collections import OrderedDict
from pathlib import Path
from typing import Any, Dict, Mapping, Optional

from mjr_am_backend.shared import Result, classify_file, get_logger, sanitize_error_message
from mjr_am_backend.config import (
    FS_LIST_CACHE_MAX,
    FS_LIST_CACHE_TTL_SECONDS,
    BG_SCAN_FAILURE_HISTORY_MAX,
    SCAN_PENDING_MAX,
    MANUAL_BG_SCAN_GRACE_SECONDS,
    BG_SCAN_ON_LIST,
    BG_SCAN_MIN_INTERVAL_SECONDS,
)
from mjr_am_backend.adapters.fs.list_cache_watcher import (
    ensure_fs_list_cache_watching,
    get_fs_list_cache_token,
)
from mjr_am_shared.scan_throttle import normalize_scan_directory, should_skip_background_scan
from .db_maintenance import is_db_maintenance_active
from ..core import _safe_rel_path, _is_within_root, _require_services

logger = get_logger(__name__)
VALID_SORT_KEYS = {"mtime_desc", "mtime_asc", "name_asc", "name_desc", "none"}


def _normalize_sort_key(sort: Optional[str]) -> str:
    s = str(sort or "").strip().lower()
    if s in VALID_SORT_KEYS:
        return s
    return "mtime_desc"

# Locks for async concurrency safety
_BACKGROUND_SCAN_LOCKS_GUARD = asyncio.Lock()
_BACKGROUND_SCAN_LOCKS: dict[str, asyncio.Lock] = {}
_BACKGROUND_SCAN_LOCKS_ORDER: OrderedDict[str, None] = OrderedDict()
_BACKGROUND_SCAN_LOCKS_MAX = max(32, int(os.getenv("MAJOOR_BG_SCAN_LOCKS_MAX", "1024") or 1024))
_BACKGROUND_SCAN_LAST: OrderedDict[str, dict[str, Any]] = OrderedDict()
_BACKGROUND_SCAN_FAILURES: list[dict[str, Any]] = []
_MAX_FAILURE_HISTORY = int(BG_SCAN_FAILURE_HISTORY_MAX)
_BACKGROUND_SCAN_HISTORY_MAX = 1000

_SCAN_PENDING_LOCK = asyncio.Lock()
_SCAN_PENDING: OrderedDict[str, dict[str, Any]] = OrderedDict()
_SCAN_TASK: Optional[asyncio.Task[Any]] = None
_SCAN_PENDING_MAX = int(SCAN_PENDING_MAX)

_FS_LIST_CACHE_LOCK = asyncio.Lock()
_FS_LIST_CACHE: OrderedDict[str, dict[str, Any]] = OrderedDict()


async def _invalidate_fs_list_cache() -> None:
    """Best-effort invalidation for filesystem listing cache."""
    try:
        async with _FS_LIST_CACHE_LOCK:
            _FS_LIST_CACHE.clear()
    except Exception:
        return


def _safe_mtime_int(value: Any) -> int:
    try:
        if isinstance(value, bool):
            return 0
        if isinstance(value, (int, float)):
            return int(value)
        if isinstance(value, str):
            text = value.strip()
            if not text:
                return 0
            return int(float(text))
    except Exception:
        return 0
    return 0


async def _get_background_scan_lock(key: str) -> asyncio.Lock:
    async with _BACKGROUND_SCAN_LOCKS_GUARD:
        lock = _BACKGROUND_SCAN_LOCKS.get(key)
        if lock is None:
            lock = asyncio.Lock()
            _BACKGROUND_SCAN_LOCKS[key] = lock
        _BACKGROUND_SCAN_LOCKS_ORDER[key] = None
        _BACKGROUND_SCAN_LOCKS_ORDER.move_to_end(key)
        while len(_BACKGROUND_SCAN_LOCKS_ORDER) > _BACKGROUND_SCAN_LOCKS_MAX:
            removed = False
            # Bounded sweep: never loop forever when many old locks are still in use.
            sweep = max(1, len(_BACKGROUND_SCAN_LOCKS_ORDER))
            for _ in range(sweep):
                old_key, _ = _BACKGROUND_SCAN_LOCKS_ORDER.popitem(last=False)
                old_lock = _BACKGROUND_SCAN_LOCKS.get(old_key)
                if old_key == key:
                    _BACKGROUND_SCAN_LOCKS_ORDER[old_key] = None
                    _BACKGROUND_SCAN_LOCKS_ORDER.move_to_end(old_key)
                    continue
                try:
                    if old_lock is not None and old_lock.locked():
                        _BACKGROUND_SCAN_LOCKS_ORDER[old_key] = None
                        _BACKGROUND_SCAN_LOCKS_ORDER.move_to_end(old_key)
                        continue
                except Exception:
                    pass
                _BACKGROUND_SCAN_LOCKS.pop(old_key, None)
                removed = True
                break
            if not removed:
                # No removable unlocked entries right now; keep table as-is and exit.
                break
        return lock


def _is_truthy_boolish(value: Any) -> bool:
    if value is True:
        return True
    if value is False or value is None:
        return False
    if value in (1, "1"):
        return True
    if value in (0, "0"):
        return False
    return False


def _normalize_extension(value: Any) -> str:
    if value is None:
        return ""
    try:
        text = str(value).strip()
    except Exception:
        return ""
    if not text:
        return ""
    text = text.lstrip(".").strip(",;")
    return text.lower()


def _normalize_extensions(raw_list: Optional[Any]) -> list[str]:
    if not isinstance(raw_list, list):
        return []
    normalized: list[str] = []
    for item in raw_list:
        ext = _normalize_extension(item)
        if ext and ext not in normalized:
            normalized.append(ext)
    return normalized


async def _kickoff_background_scan(
    directory: str,
    *,
    source: str = "output",
    root_id: Optional[str] = None,
    recursive: bool = True,
    incremental: bool = True,
    fast: bool = True,
    background_metadata: bool = True,
    min_interval_seconds: float = float(BG_SCAN_MIN_INTERVAL_SECONDS),
) -> None:
    """
    Fire-and-forget indexing into the DB.

    Used to ensure input/custom folders get indexed without blocking list requests.
    """
    if not BG_SCAN_ON_LIST:
        return
    if is_db_maintenance_active():
        return
    normalized_dir = normalize_scan_directory(directory)
    if should_skip_background_scan(normalized_dir, source, root_id, MANUAL_BG_SCAN_GRACE_SECONDS):
        return

    try:
        key = f"{source}|{str(root_id or '')}|{normalized_dir}"
        now_mono = time.monotonic()
        if _should_skip_scan_enqueue(key, now_mono, min_interval_seconds):
            return

        scan_lock = await _get_background_scan_lock(key)
        async with scan_lock:
            # Double-check under lock
            if _should_skip_scan_enqueue(key, now_mono, min_interval_seconds):
                return

            job = {
                "directory": str(normalized_dir),
                "source": str(source),
                "root_id": str(root_id) if root_id is not None else None,
                "recursive": bool(recursive),
                "incremental": bool(incremental),
                "fast": bool(fast),
                "background_metadata": bool(background_metadata),
            }

            _ensure_worker()

            async with _SCAN_PENDING_LOCK:
                if not _enqueue_background_scan_job(key, job):
                    return

            # Only mark as enqueued once we've successfully updated _SCAN_PENDING.
            _set_background_entry(key, {"last_mono": now_mono, "in_progress": False, "last_wall": time.time()})
    except Exception:
        return


def _ensure_worker() -> None:
    global _SCAN_TASK
    if _SCAN_TASK and not _SCAN_TASK.done():
        return

    _SCAN_TASK = asyncio.create_task(_worker_loop())


def _set_background_entry(key: str, value: dict[str, Any]) -> None:
    _BACKGROUND_SCAN_LAST[key] = value
    try:
        _BACKGROUND_SCAN_LAST.move_to_end(key)
    except Exception:
        pass
    while len(_BACKGROUND_SCAN_LAST) > _BACKGROUND_SCAN_HISTORY_MAX:
        _BACKGROUND_SCAN_LAST.popitem(last=False)


async def _worker_loop() -> None:
    while True:
        task = await _pop_pending_scan_task()
        if not task:
            await asyncio.sleep(0.5)
            continue
        if is_db_maintenance_active():
            await asyncio.sleep(0.5)
            continue

        entry: Optional[dict[str, Any]] = None
        try:
            key = _build_task_key(task)
            entry = _ensure_background_entry(key)
            entry["in_progress"] = True
            entry["last_mono"] = time.monotonic()
            entry["last_wall"] = time.time()
            svc, error_result = await _require_services()
            if error_result:
                _record_scan_failure(str(task.get("directory")), str(task.get("source")), "SERVICE_UNAVAILABLE", str(error_result.error or ""))
                await asyncio.sleep(2) # Backoff if services unavailable
                continue
            if svc is None:
                _record_scan_failure(str(task.get("directory")), str(task.get("source")), "SERVICE_UNAVAILABLE", "Services are unavailable")
                await asyncio.sleep(2)
                continue

            try:
                await _run_scan_directory_task(svc, task)
            except Exception as exc:
                _record_scan_failure(str(task.get("directory")), str(task.get("source")), "SCAN_FAILED", str(exc))
                logger.warning("Background scan failed: %s", exc)
        finally:
            if entry is not None:
                entry["in_progress"] = False
                entry["last_mono"] = time.monotonic()
                entry["last_wall"] = time.time()
        # Yield to event loop
        await asyncio.sleep(0)


async def _pop_pending_scan_task() -> Optional[dict[str, Any]]:
    async with _SCAN_PENDING_LOCK:
        if not _SCAN_PENDING:
            return None
        _, task = _SCAN_PENDING.popitem(last=False)
        return task


def _peek_background_entry(key: str) -> tuple[float, bool]:
    try:
        entry = _BACKGROUND_SCAN_LAST.get(key)
        if isinstance(entry, dict):
            last_v = float(entry.get("last_mono") or entry.get("last") or 0.0)
            in_prog = bool(entry.get("in_progress"))
            return last_v, in_prog
        if isinstance(entry, (int, float)):
            return float(entry), False
    except Exception:
        pass
    return 0.0, False


def _should_skip_scan_enqueue(key: str, now_mono: float, min_interval_seconds: float) -> bool:
    last_seen, in_progress = _peek_background_entry(key)
    if in_progress:
        return True
    return (now_mono - last_seen) < min_interval_seconds


def _enqueue_background_scan_job(key: str, job: dict[str, Any]) -> bool:
    if key in _SCAN_PENDING:
        return False
    _SCAN_PENDING[key] = job
    while len(_SCAN_PENDING) > _SCAN_PENDING_MAX:
        _SCAN_PENDING.popitem(last=False)
    return True


async def _run_scan_directory_task(svc: dict[str, Any], task: dict[str, Any]) -> None:
    try:
        await svc["index"].scan_directory(
            str(task.get("directory")),
            bool(task.get("recursive")),
            bool(task.get("incremental")),
            source=str(task.get("source") or "output"),
            root_id=task.get("root_id"),
            fast=bool(task.get("fast")),
            background_metadata=bool(task.get("background_metadata")),
        )
    except TypeError:
        # Fallback in case of call signature mismatch
        await svc["index"].scan_directory(
            str(task.get("directory")),
            bool(task.get("recursive")),
            bool(task.get("incremental")),
            source=str(task.get("source") or "output"),
            root_id=task.get("root_id"),
        )


def _record_scan_failure(directory: str, source: str, code: str, error: str) -> None:
    # No async lock needed for simple append/pop in main thread
    _BACKGROUND_SCAN_FAILURES.insert(0, {
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "directory": directory,
        "source": source,
        "code": code,
        "error": error
    })
    # Trim
    while len(_BACKGROUND_SCAN_FAILURES) > _MAX_FAILURE_HISTORY:
        _BACKGROUND_SCAN_FAILURES.pop()


def _ensure_background_entry(key: str) -> dict[str, Any]:
    entry = _BACKGROUND_SCAN_LAST.get(key)
    if isinstance(entry, dict):
        _set_background_entry(key, entry)
        return entry
    if isinstance(entry, (int, float)):
        entry = {"last_mono": float(entry), "in_progress": False}
    else:
        entry = {"last_mono": 0.0, "in_progress": False}
    _set_background_entry(key, entry)
    return entry


def _build_task_key(task: dict[str, Any]) -> str:
    source = str(task.get("source") or "output")
    root_id = str(task.get("root_id") or "")
    directory = normalize_scan_directory(str(task.get("directory") or ""))
    return f"{source}|{root_id}|{directory}"


def _collect_filesystem_entries(
    target_dir_resolved: Path,
    base: Path,
    asset_type: str,
    root_id: Optional[str],
) -> list[dict[str, Any]]:
    entries: list[dict[str, Any]] = []
    for entry in target_dir_resolved.iterdir():
        if not entry.is_file():
            continue
        filename = entry.name
        kind = classify_file(filename)
        if kind == "unknown":
            continue
        try:
            stat = entry.stat()
        except OSError:
            continue

        try:
            rel_to_root = entry.parent.relative_to(base)
            sub = "" if str(rel_to_root) == "." else str(rel_to_root).replace("\\", "/")
        except ValueError:
            sub = ""
        entries.append(
            {
                "id": None,
                "filename": filename,
                "subfolder": sub,
                "filepath": str(entry),
                "kind": kind,
                "ext": entry.suffix.lower(),
                "size": stat.st_size,
                "mtime": int(stat.st_mtime),
                "width": None,
                "height": None,
                "duration": None,
                "rating": 0,
                "tags": [],
                "has_workflow": None,
                "has_generation_data": None,
                "type": asset_type,
                "root_id": root_id,
            }
        )
    return entries


def _collect_filesystem_entries_window(
    target_dir_resolved: Path,
    base: Path,
    asset_type: str,
    root_id: Optional[str],
    *,
    query_lower: str,
    browse_all: bool,
    filter_kind: str,
    filter_extensions: list[str],
    offset: int,
    limit: int,
) -> tuple[list[dict[str, Any]], int]:
    """
    Streaming collection for sort=none.

    Scans all entries to compute exact `total`, but only stats/builds rows for
    the requested pagination window.
    """
    out: list[dict[str, Any]] = []
    total = 0
    start = max(0, int(offset or 0))
    lim = int(limit or 0)
    window_size = lim if lim > 0 else None

    for entry in os.scandir(target_dir_resolved):
        decision = _filesystem_entry_window_decision(
            entry,
            query_lower=query_lower,
            browse_all=browse_all,
            filter_kind=filter_kind,
            filter_extensions=filter_extensions,
        )
        if decision is None:
            continue
        filename, kind = decision
        idx = total
        total += 1
        if idx < start:
            continue
        if window_size is not None and len(out) >= window_size:
            continue
        row = _build_filesystem_window_row(entry, filename, kind, base, asset_type, root_id)
        if row is not None:
            out.append(row)
    return out, total


def _filesystem_entry_window_decision(
    entry: os.DirEntry[str],
    *,
    query_lower: str,
    browse_all: bool,
    filter_kind: str,
    filter_extensions: list[str],
) -> Optional[tuple[str, str]]:
    if not _is_regular_dir_entry_file(entry):
        return None
    filename = str(entry.name or "")
    if not filename:
        return None
    kind = classify_file(filename)
    if not _filesystem_entry_matches_filters(
        filename=filename,
        kind=kind,
        query_lower=query_lower,
        browse_all=browse_all,
        filter_kind=filter_kind,
        filter_extensions=filter_extensions,
    ):
        return None
    return filename, kind


def _filesystem_entry_matches_filters(
    *,
    filename: str,
    kind: str,
    query_lower: str,
    browse_all: bool,
    filter_kind: str,
    filter_extensions: list[str],
) -> bool:
    if kind == "unknown":
        return False
    if filter_kind and kind != filter_kind:
        return False
    if not browse_all and query_lower not in filename.lower():
        return False
    ext = _normalize_extension(Path(filename).suffix.lower())
    if filter_extensions and ext and ext not in filter_extensions:
        return False
    return True


def _is_regular_dir_entry_file(entry: os.DirEntry[str]) -> bool:
    try:
        return bool(entry.is_file())
    except OSError:
        return False


def _build_filesystem_window_row(
    entry: os.DirEntry[str],
    filename: str,
    kind: str,
    base: Path,
    asset_type: str,
    root_id: Optional[str],
) -> Optional[dict[str, Any]]:
    try:
        stat = entry.stat()
    except OSError:
        return None
    try:
        rel_to_root = Path(entry.path).parent.relative_to(base)
        sub = "" if str(rel_to_root) == "." else str(rel_to_root).replace("\\", "/")
    except Exception:
        sub = ""
    return {
        "id": None,
        "filename": filename,
        "subfolder": sub,
        "filepath": str(entry.path),
        "kind": kind,
        "ext": Path(filename).suffix.lower(),
        "size": stat.st_size,
        "mtime": int(stat.st_mtime),
        "width": None,
        "height": None,
        "duration": None,
        "rating": 0,
        "tags": [],
        "has_workflow": None,
        "has_generation_data": None,
        "type": asset_type,
        "root_id": root_id,
    }


async def _fs_cache_get_or_build(
    base: Path,
    target_dir_resolved: Path,
    asset_type: str,
    root_id: Optional[str],
) -> Result[dict[str, Any]]:
    # Made async to allow async locking if needed, though mostly sync logic
    dir_stat = _filesystem_dir_cache_state(base, target_dir_resolved)
    if not dir_stat.ok:
        return dir_stat
    state = dir_stat.data if isinstance(dir_stat.data, dict) else {}
    dir_mtime_ns = int(state.get("dir_mtime_ns") or 0)
    watch_token = int(state.get("watch_token") or 0)
    cache_key = f"{str(base)}|{str(target_dir_resolved)}|{asset_type}|{str(root_id or '')}"

    async with _FS_LIST_CACHE_LOCK:
        cached = _FS_LIST_CACHE.get(cache_key)
        if _cache_entry_matches_dir_state(cached, dir_mtime_ns=dir_mtime_ns, watch_token=watch_token):
            if _cache_entry_is_fresh(cached):
                _FS_LIST_CACHE.move_to_end(cache_key)
                return Result.Ok({"entries": cached["entries"], "dir_mtime_ns": dir_mtime_ns})
            _FS_LIST_CACHE.move_to_end(cache_key)

    try:
        entries = await asyncio.to_thread(
            _collect_filesystem_entries,
            target_dir_resolved,
            base,
            asset_type,
            root_id,
        )
    except OSError as exc:
        return Result.Err(
            "LIST_FAILED", sanitize_error_message(exc, "Failed to list directory")
        )

    async with _FS_LIST_CACHE_LOCK:
        _FS_LIST_CACHE[cache_key] = {
            "dir_mtime_ns": dir_mtime_ns,
            "watch_token": watch_token,
            "entries": entries,
            "cached_at_mono": time.monotonic(),
            "cached_at": time.time(),
        }
        _FS_LIST_CACHE.move_to_end(cache_key)
        while len(_FS_LIST_CACHE) > int(FS_LIST_CACHE_MAX):
            _FS_LIST_CACHE.popitem(last=False)

    return Result.Ok({"entries": entries, "dir_mtime_ns": dir_mtime_ns})


def _filesystem_dir_cache_state(base: Path, target_dir_resolved: Path) -> Result[dict[str, int]]:
    try:
        dir_mtime_ns = target_dir_resolved.stat().st_mtime_ns
    except OSError as exc:
        return Result.Err("DIR_NOT_FOUND", sanitize_error_message(exc, "Directory not found"))
    try:
        ensure_fs_list_cache_watching(str(base))
    except Exception:
        pass
    try:
        watch_token = int(get_fs_list_cache_token(str(base)))
    except Exception:
        watch_token = 0
    return Result.Ok({"dir_mtime_ns": int(dir_mtime_ns), "watch_token": int(watch_token)})


def _cache_entry_matches_dir_state(
    cached: Optional[dict[str, Any]], *, dir_mtime_ns: int, watch_token: int
) -> bool:
    return bool(
        cached
        and cached.get("dir_mtime_ns") == dir_mtime_ns
        and int(cached.get("watch_token") or 0) == watch_token
        and isinstance(cached.get("entries"), list)
    )


def _cache_entry_is_fresh(cached: dict[str, Any]) -> bool:
    try:
        now = time.monotonic()
        cached_at = float(cached.get("cached_at_mono") or cached.get("cached_at") or 0.0)
        return bool(cached_at and (now - cached_at) <= float(FS_LIST_CACHE_TTL_SECONDS))
    except Exception:
        return False


def _resolve_filesystem_listing_target(
    root_dir: Path,
    subfolder: str,
) -> Result[dict[str, Path]]:
    try:
        base = root_dir.resolve()
    except OSError as exc:
        return Result.Err(
            "INVALID_INPUT", sanitize_error_message(exc, "Invalid root directory")
        )

    rel = _safe_rel_path(subfolder or "")
    if rel is None:
        return Result.Err("INVALID_INPUT", "Invalid subfolder")

    target_dir = (base / rel)
    try:
        target_dir_resolved = target_dir.resolve(strict=True)
    except OSError:
        return Result.Err("DIR_NOT_FOUND", f"Directory not found: {target_dir}")

    if not _is_within_root(target_dir_resolved, base):
        return Result.Err("INVALID_INPUT", "Subfolder outside root")

    return Result.Ok(
        {
            "base": base,
            "target_dir_resolved": target_dir_resolved,
        }
    )


def _parse_filesystem_listing_filters(
    query: str,
    filters: Optional[Mapping[str, Any]],
    sort: Optional[str],
) -> dict[str, Any]:
    q = (query or "*").strip()
    q_lower = q.lower()
    browse_all = q in ("*", "")
    source = filters if filters is not None else {}

    filter_kind = str(source.get("kind") or "").strip().lower()
    filter_min_rating = int(source.get("min_rating") or 0)
    filter_workflow_only = bool(source.get("has_workflow"))
    filter_extensions = _normalize_extensions(source.get("extensions"))

    mtime_start_raw = source.get("mtime_start")
    mtime_end_raw = source.get("mtime_end")
    filter_mtime_start = int(mtime_start_raw) if mtime_start_raw is not None else None
    filter_mtime_end = int(mtime_end_raw) if mtime_end_raw is not None else None

    return {
        "q": q,
        "q_lower": q_lower,
        "browse_all": browse_all,
        "filter_kind": filter_kind,
        "filter_min_rating": filter_min_rating,
        "filter_workflow_only": filter_workflow_only,
        "filter_extensions": filter_extensions,
        "filter_mtime_start": filter_mtime_start,
        "filter_mtime_end": filter_mtime_end,
        "sort_key": _normalize_sort_key(sort),
    }


def _can_use_listing_fast_path(opts: Mapping[str, Any]) -> bool:
    return (
        str(opts.get("sort_key") or "") == "none"
        and int(opts.get("filter_min_rating") or 0) <= 0
        and not bool(opts.get("filter_workflow_only"))
        and opts.get("filter_mtime_start") is None
        and opts.get("filter_mtime_end") is None
    )


def _build_filesystem_listing_payload(
    assets: list[dict[str, Any]],
    total: int,
    limit: int,
    offset: int,
    query: str,
    sort_key: str,
) -> dict[str, Any]:
    return {
        "assets": assets,
        "total": int(total),
        "limit": limit,
        "offset": offset,
        "query": query,
        "sort": sort_key,
    }


async def _enrich_filesystem_entries_from_db(
    index_service: Optional[Any],
    entries: list[dict[str, Any]],
    *,
    log_label: str,
) -> None:
    try:
        lookup, filepaths = _resolve_filesystem_lookup(index_service, entries)
        if lookup is None or not filepaths:
            return
        enrich_result = await lookup(filepaths)
        mapping = _extract_enrichment_mapping(enrich_result)
        if mapping is None:
            return
        for asset in entries:
            _apply_db_enrichment_row(asset, mapping)
    except Exception as exc:
        logger.debug("%s: %s", log_label, exc)


def _resolve_filesystem_lookup(
    index_service: Optional[Any],
    entries: list[dict[str, Any]],
) -> tuple[Optional[Any], list[str]]:
    lookup = getattr(index_service, "lookup_assets_by_filepaths", None)
    if not callable(lookup) or not entries:
        return None, []
    filepaths = [str(a.get("filepath") or "") for a in entries if isinstance(a, dict)]
    return lookup, [p for p in filepaths if p]


def _extract_enrichment_mapping(enrich_result: Any) -> Optional[dict]:
    if not enrich_result or not getattr(enrich_result, "ok", False):
        return None
    if not isinstance(getattr(enrich_result, "data", None), dict):
        return None
    return enrich_result.data


def _apply_db_enrichment_row(asset: Any, mapping: dict) -> None:
    if not isinstance(asset, dict):
        return
    fp = str(asset.get("filepath") or "")
    db_row = mapping.get(fp)
    if not isinstance(db_row, dict):
        return
    asset["id"] = db_row.get("id")
    asset["rating"] = int(db_row.get("rating") or 0)
    asset["tags"] = db_row.get("tags") or []
    asset["has_workflow"] = db_row.get("has_workflow")
    asset["has_generation_data"] = db_row.get("has_generation_data")
    if db_row.get("root_id"):
        asset["root_id"] = db_row.get("root_id")


async def _list_filesystem_assets_fast_path(
    base: Path,
    target_dir_resolved: Path,
    asset_type: str,
    root_id: Optional[str],
    *,
    q: str,
    q_lower: str,
    browse_all: bool,
    filter_kind: str,
    filter_extensions: list[str],
    sort_key: str,
    limit: int,
    offset: int,
    index_service: Optional[Any],
) -> Result[dict[str, Any]]:
    try:
        entries_window, total_window = await asyncio.to_thread(
            _collect_filesystem_entries_window,
            target_dir_resolved,
            base,
            asset_type,
            root_id,
            query_lower=q_lower,
            browse_all=browse_all,
            filter_kind=filter_kind,
            filter_extensions=filter_extensions,
            offset=int(offset or 0),
            limit=int(limit or 0),
        )
    except OSError as exc:
        return Result.Err(
            "LIST_FAILED", sanitize_error_message(exc, "Failed to list directory")
        )

    await _enrich_filesystem_entries_from_db(
        index_service,
        entries_window,
        log_label="Filesystem DB enrichment skipped (sort=none path)",
    )
    return Result.Ok(
        _build_filesystem_listing_payload(
            entries_window,
            total_window,
            limit,
            offset,
            q,
            sort_key,
        )
    )


def _prefilter_cached_filesystem_entries(
    all_entries: list[Any],
    *,
    filter_kind: str,
    browse_all: bool,
    q_lower: str,
) -> list[dict[str, Any]]:
    entries: list[dict[str, Any]] = []
    for item in all_entries:
        if not _is_listing_prefilter_match(
            item,
            filter_kind=filter_kind,
            browse_all=browse_all,
            q_lower=q_lower,
        ):
            continue
        entries.append(item)
    return entries


def _is_listing_prefilter_match(
    item: Any,
    *,
    filter_kind: str,
    browse_all: bool,
    q_lower: str,
) -> bool:
    if not isinstance(item, dict):
        return False
    filename = str(item.get("filename") or "")
    kind = str(item.get("kind") or "")
    if not filename or kind == "unknown":
        return False
    if filter_kind and kind != filter_kind:
        return False
    if not browse_all and q_lower not in filename.lower():
        return False
    return True


def _sort_filesystem_entries(entries: list[dict[str, Any]], sort_key: str) -> None:
    if sort_key == "name_asc":
        entries.sort(key=lambda x: str(x.get("filename") or "").lower())
    elif sort_key == "name_desc":
        entries.sort(key=lambda x: str(x.get("filename") or "").lower(), reverse=True)
    elif sort_key == "mtime_asc":
        entries.sort(key=lambda x: _safe_mtime_int(x.get("mtime")))
    else:
        entries.sort(key=lambda x: _safe_mtime_int(x.get("mtime")), reverse=True)


def _entry_passes_listing_post_filters(
    item: dict[str, Any],
    *,
    filter_extensions: list[str],
    filter_kind: str,
    filter_min_rating: int,
    filter_workflow_only: bool,
    filter_mtime_start: Optional[int],
    filter_mtime_end: Optional[int],
    browse_all: bool,
    q_lower: str,
) -> bool:
    if not _passes_extension_filter(item, filter_extensions):
        return False
    if not _passes_kind_filter(item, filter_kind):
        return False
    if not _passes_rating_filter(item, filter_min_rating):
        return False
    if not _passes_workflow_filter(item, filter_workflow_only):
        return False
    if not _passes_mtime_window(item, filter_mtime_start, filter_mtime_end):
        return False
    if not _passes_name_query(item, browse_all=browse_all, q_lower=q_lower):
        return False
    return True


def _passes_extension_filter(item: dict[str, Any], filter_extensions: list[str]) -> bool:
    entry_ext = _normalize_extension(item.get("ext"))
    if filter_extensions and entry_ext and entry_ext not in filter_extensions:
        return False
    return True


def _passes_kind_filter(item: dict[str, Any], filter_kind: str) -> bool:
    return not (filter_kind and item.get("kind") != filter_kind)


def _passes_rating_filter(item: dict[str, Any], filter_min_rating: int) -> bool:
    return not (filter_min_rating > 0 and int(item.get("rating", 0)) < filter_min_rating)


def _passes_workflow_filter(item: dict[str, Any], filter_workflow_only: bool) -> bool:
    return not (filter_workflow_only and not _is_truthy_boolish(item.get("has_workflow")))


def _item_mtime_or_zero(item: dict[str, Any]) -> int:
    try:
        return int(item.get("mtime") or 0)
    except Exception:
        return 0


def _passes_mtime_window(item: dict[str, Any], start: Optional[int], end: Optional[int]) -> bool:
    entry_mtime = _item_mtime_or_zero(item)
    if start is not None and entry_mtime < start:
        return False
    if end is not None and entry_mtime >= end:
        return False
    return True


def _passes_name_query(item: dict[str, Any], *, browse_all: bool, q_lower: str) -> bool:
    if browse_all:
        return True
    return q_lower in str(item.get("filename", "")).lower()


def _paginate_filesystem_listing_entries(
    entries: list[dict[str, Any]],
    *,
    filter_extensions: list[str],
    filter_kind: str,
    filter_min_rating: int,
    filter_workflow_only: bool,
    filter_mtime_start: Optional[int],
    filter_mtime_end: Optional[int],
    browse_all: bool,
    q_lower: str,
    limit: int,
    offset: int,
) -> tuple[list[dict[str, Any]], int]:
    total = 0
    paged: list[dict[str, Any]] = []
    start = max(0, int(offset or 0))
    limit_int = int(limit or 0)
    end = start + limit_int if limit_int > 0 else None

    for item in entries:
        if not _entry_passes_listing_post_filters(
            item,
            filter_extensions=filter_extensions,
            filter_kind=filter_kind,
            filter_min_rating=filter_min_rating,
            filter_workflow_only=filter_workflow_only,
            filter_mtime_start=filter_mtime_start,
            filter_mtime_end=filter_mtime_end,
            browse_all=browse_all,
            q_lower=q_lower,
        ):
            continue
        if total >= start:
            if end is None or len(paged) < (end - start):
                paged.append(item)
        total += 1
    return paged, total


async def _list_filesystem_assets_cached_path(
    base: Path,
    target_dir_resolved: Path,
    asset_type: str,
    root_id: Optional[str],
    *,
    q: str,
    q_lower: str,
    browse_all: bool,
    filter_kind: str,
    filter_min_rating: int,
    filter_workflow_only: bool,
    filter_extensions: list[str],
    filter_mtime_start: Optional[int],
    filter_mtime_end: Optional[int],
    sort_key: str,
    limit: int,
    offset: int,
    index_service: Optional[Any],
) -> Result[dict[str, Any]]:
    cache_result = await _fs_cache_get_or_build(base, target_dir_resolved, asset_type, root_id)
    if not cache_result.ok:
        return cache_result
    all_entries = cache_result.data.get("entries") if isinstance(cache_result.data, dict) else None
    if not isinstance(all_entries, list):
        return Result.Err("LIST_FAILED", "Failed to list directory")

    entries = _prefilter_cached_filesystem_entries(
        all_entries,
        filter_kind=filter_kind,
        browse_all=browse_all,
        q_lower=q_lower,
    )
    _sort_filesystem_entries(entries, sort_key)

    await _enrich_filesystem_entries_from_db(
        index_service,
        entries,
        log_label="Filesystem DB enrichment skipped",
    )

    paged, total = _paginate_filesystem_listing_entries(
        entries,
        filter_extensions=filter_extensions,
        filter_kind=filter_kind,
        filter_min_rating=filter_min_rating,
        filter_workflow_only=filter_workflow_only,
        filter_mtime_start=filter_mtime_start,
        filter_mtime_end=filter_mtime_end,
        browse_all=browse_all,
        q_lower=q_lower,
        limit=limit,
        offset=offset,
    )
    return Result.Ok(
        _build_filesystem_listing_payload(
            paged,
            total,
            limit,
            offset,
            q,
            sort_key,
        )
    )


async def _list_filesystem_assets(
    root_dir: Path,
    subfolder: str,
    query: str,
    limit: int,
    offset: int,
    asset_type: str,
    root_id: Optional[str] = None,
    filters: Optional[Mapping[str, Any]] = None,
    index_service: Optional[Any] = None,
    sort: Optional[str] = None,
) -> Result[dict[str, Any]]:
    target_result = _resolve_filesystem_listing_target(root_dir, subfolder)
    if not target_result.ok:
        return target_result
    target_data = target_result.data if isinstance(target_result.data, dict) else {}
    base = target_data.get("base")
    target_dir_resolved = target_data.get("target_dir_resolved")
    if not isinstance(base, Path) or not isinstance(target_dir_resolved, Path):
        return Result.Err("LIST_FAILED", "Failed to resolve listing directory")

    opts = _parse_filesystem_listing_filters(query, filters, sort)
    listing_args = _listing_args_from_opts(opts)
    return await _dispatch_filesystem_listing_path(
        base,
        target_dir_resolved,
        asset_type,
        root_id,
        listing_args=listing_args,
        limit=limit,
        offset=offset,
        index_service=index_service,
    )


def _listing_args_from_opts(opts: Mapping[str, Any]) -> Dict[str, Any]:
    return {
        "q": str(opts.get("q") or "*"),
        "q_lower": str(opts.get("q_lower") or ""),
        "browse_all": bool(opts.get("browse_all")),
        "filter_kind": str(opts.get("filter_kind") or ""),
        "filter_min_rating": int(opts.get("filter_min_rating") or 0),
        "filter_workflow_only": bool(opts.get("filter_workflow_only")),
        "filter_extensions": list(opts.get("filter_extensions") or []),
        "filter_mtime_start": opts.get("filter_mtime_start"),
        "filter_mtime_end": opts.get("filter_mtime_end"),
        "sort_key": str(opts.get("sort_key") or "mtime_desc"),
        "opts": opts,
    }


async def _dispatch_filesystem_listing_path(
    base: Path,
    target_dir_resolved: Path,
    asset_type: str,
    root_id: Optional[str],
    *,
    listing_args: Dict[str, Any],
    limit: int,
    offset: int,
    index_service: Optional[Any],
) -> Result[dict[str, Any]]:
    opts = listing_args.get("opts") if isinstance(listing_args.get("opts"), Mapping) else {}
    if _can_use_listing_fast_path(opts):
        return await _list_filesystem_assets_fast_path(
            base,
            target_dir_resolved,
            asset_type,
            root_id,
            q=listing_args["q"],
            q_lower=listing_args["q_lower"],
            browse_all=listing_args["browse_all"],
            filter_kind=listing_args["filter_kind"],
            filter_extensions=listing_args["filter_extensions"],
            sort_key=listing_args["sort_key"],
            limit=limit,
            offset=offset,
            index_service=index_service,
        )
    return await _list_filesystem_assets_cached_path(
        base,
        target_dir_resolved,
        asset_type,
        root_id,
        q=listing_args["q"],
        q_lower=listing_args["q_lower"],
        browse_all=listing_args["browse_all"],
        filter_kind=listing_args["filter_kind"],
        filter_min_rating=listing_args["filter_min_rating"],
        filter_workflow_only=listing_args["filter_workflow_only"],
        filter_extensions=listing_args["filter_extensions"],
        filter_mtime_start=listing_args["filter_mtime_start"],
        filter_mtime_end=listing_args["filter_mtime_end"],
        sort_key=listing_args["sort_key"],
        limit=limit,
        offset=offset,
        index_service=index_service,
    )
