"""
Filesystem operations: background scanning and file listing.
"""
import datetime
import time
import threading
from collections import OrderedDict
from pathlib import Path
from typing import Any, Dict, Optional

from backend.shared import Result, classify_file, get_logger
from ..core import _safe_rel_path, _is_within_root

logger = get_logger(__name__)

_BACKGROUND_SCAN_LOCK = threading.Lock()
_BACKGROUND_SCAN_LAST: Dict[str, float] = {}
_BACKGROUND_SCAN_FAILURES: list[dict] = []
_MAX_FAILURE_HISTORY = 50

_FS_LIST_CACHE_LOCK = threading.Lock()
_FS_LIST_CACHE: "OrderedDict[str, Dict[str, Any]]" = OrderedDict()
_FS_LIST_CACHE_MAX = 32


def _kickoff_background_scan(
    directory: str,
    *,
    source: str = "output",
    root_id: Optional[str] = None,
    recursive: bool = True,
    incremental: bool = True,
    fast: bool = True,
    background_metadata: bool = True,
    min_interval_seconds: float = 10.0,
) -> None:
    """
    Fire-and-forget indexing into the DB.

    Used to ensure input/custom folders get indexed without blocking list requests.
    """
    try:
        key = f"{source}|{str(root_id or '')}|{str(directory)}"
        now = time.time()
        with _BACKGROUND_SCAN_LOCK:
            last = _BACKGROUND_SCAN_LAST.get(key, 0.0)
            if now - last < float(min_interval_seconds):
                return
            _BACKGROUND_SCAN_LAST[key] = now
    except Exception:
        return

    def _run():
        try:
            from ..core import _require_services
            svc, error_result = _require_services()
            if error_result:
                try:
                    _record_scan_failure(str(directory), str(source), "SERVICE_UNAVAILABLE", str(error_result.error or ""))
                except Exception:
                    pass
                return
            try:
                # Prefer a fast scan to populate the grid quickly, then enrich in background.
                # Keep backward compatibility if older IndexService doesn't support these args.
                try:
                    svc["index"].scan_directory(
                        str(directory),
                        recursive,
                        incremental,
                        source=source,
                        root_id=root_id,
                        fast=bool(fast),
                        background_metadata=bool(background_metadata),
                    )
                except TypeError:
                    svc["index"].scan_directory(str(directory), recursive, incremental, source=source, root_id=root_id)
            except Exception as exc:
                _record_scan_failure(str(directory), str(source), "SCAN_FAILED", str(exc))
                logger.warning("Background scan failed: %s", exc)
        except Exception:
            try:
                _record_scan_failure(str(directory), str(source), "EXCEPTION", "Unhandled exception")
            except Exception:
                pass
            return

    try:
        threading.Thread(target=_run, daemon=True).start()
    except Exception:
        return


def _record_scan_failure(directory: str, source: str, code: str, error: str) -> None:
    global _BACKGROUND_SCAN_FAILURES
    try:
        entry = {
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "directory": str(directory),
            "source": str(source),
            "code": str(code),
            "error": str(error)[:500],
        }
        _BACKGROUND_SCAN_FAILURES.append(entry)
        if len(_BACKGROUND_SCAN_FAILURES) > _MAX_FAILURE_HISTORY:
            _BACKGROUND_SCAN_FAILURES = _BACKGROUND_SCAN_FAILURES[-_MAX_FAILURE_HISTORY:]
    except Exception:
        return


def _fs_cache_get_or_build(
    base: Path,
    target_dir_resolved: Path,
    asset_type: str,
    root_id: Optional[str],
) -> Result[Dict[str, Any]]:
    try:
        dir_mtime_ns = target_dir_resolved.stat().st_mtime_ns
    except OSError as exc:
        return Result.Err("DIR_NOT_FOUND", f"Directory not found: {exc}")

    cache_key = f"{str(base)}|{str(target_dir_resolved)}|{asset_type}|{str(root_id or '')}"
    with _FS_LIST_CACHE_LOCK:
        cached = _FS_LIST_CACHE.get(cache_key)
        if cached and cached.get("dir_mtime_ns") == dir_mtime_ns and isinstance(cached.get("entries"), list):
            _FS_LIST_CACHE.move_to_end(cache_key)
            return Result.Ok({"entries": cached["entries"], "dir_mtime_ns": dir_mtime_ns})

    entries = []
    try:
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

            rel_to_root = entry.parent.relative_to(base)
            sub = "" if str(rel_to_root) == "." else str(rel_to_root).replace("\\", "/")
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
                    "has_workflow": 0,
                    # Keep both keys for backward compatibility; the DB column is `has_generation_data`.
                    "has_generation_data": 0,
                    "has_generation_metadata": 0,
                    "type": asset_type,
                    "root_id": root_id,
                }
            )
    except OSError as exc:
        return Result.Err("LIST_FAILED", f"Failed to list directory: {exc}")

    with _FS_LIST_CACHE_LOCK:
        _FS_LIST_CACHE[cache_key] = {"dir_mtime_ns": dir_mtime_ns, "entries": entries}
        _FS_LIST_CACHE.move_to_end(cache_key)
        while len(_FS_LIST_CACHE) > _FS_LIST_CACHE_MAX:
            _FS_LIST_CACHE.popitem(last=False)

    return Result.Ok({"entries": entries, "dir_mtime_ns": dir_mtime_ns})


async def _list_filesystem_assets(
    root_dir: Path,
    subfolder: str,
    query: str,
    limit: int,
    offset: int,
    asset_type: str,
    root_id: Optional[str] = None,
    filters: Optional[dict] = None,
    index_service: Optional[Any] = None,
) -> Result[dict]:
    try:
        base = root_dir.resolve()
    except OSError as exc:
        return Result.Err("INVALID_INPUT", f"Invalid root directory: {exc}")

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

    q = (query or "*").strip()
    q_lower = q.lower()
    browse_all = q == "*" or q == ""

    filter_kind = str(filters.get("kind") or "").strip().lower() if isinstance(filters, dict) else ""
    filter_min_rating = int(filters.get("min_rating") or 0) if isinstance(filters, dict) else 0
    filter_workflow_only = bool(filters.get("has_workflow")) if isinstance(filters, dict) else False
    filter_mtime_start = (
        int(filters.get("mtime_start")) if isinstance(filters, dict) and filters.get("mtime_start") is not None else None
    )
    filter_mtime_end = (
        int(filters.get("mtime_end")) if isinstance(filters, dict) and filters.get("mtime_end") is not None else None
    )

    # Removed the early return that was causing filters to return empty results
    # The filtering will now be handled properly below after metadata enrichment

    cache_result = _fs_cache_get_or_build(base, target_dir_resolved, asset_type, root_id)
    if not cache_result.ok:
        return cache_result
    all_entries = cache_result.data.get("entries") if isinstance(cache_result.data, dict) else None
    if not isinstance(all_entries, list):
        return Result.Err("LIST_FAILED", "Failed to list directory")

    entries = []
    for item in all_entries:
        if not isinstance(item, dict):
            continue
        filename = str(item.get("filename") or "")
        kind = str(item.get("kind") or "")
        if not filename or kind == "unknown":
            continue
        if filter_kind and kind != filter_kind:
            continue
        if not browse_all and q_lower not in filename.lower():
            continue
        entries.append(item)

    entries.sort(key=lambda x: x.get("mtime") or 0, reverse=True)

    # Enrich with DB fields (workflow/generation/tags/rating) when available.
    try:
        lookup = getattr(index_service, "lookup_assets_by_filepaths", None)
        if callable(lookup) and entries:
            filepaths = [str(a.get("filepath") or "") for a in entries if isinstance(a, dict)]
            filepaths = [p for p in filepaths if p]
            if filepaths:
                enrich_result = await lookup(filepaths)
                if enrich_result and getattr(enrich_result, "ok", False) and isinstance(enrich_result.data, dict):
                    mapping = enrich_result.data
                    for asset in entries:
                        if not isinstance(asset, dict):
                            continue
                        fp = str(asset.get("filepath") or "")
                        db_row = mapping.get(fp)
                        if not isinstance(db_row, dict):
                            continue
                        asset["id"] = db_row.get("id")
                        asset["rating"] = int(db_row.get("rating") or 0)
                        asset["tags"] = db_row.get("tags") or []
                        asset["has_workflow"] = int(db_row.get("has_workflow") or 0)
                        has_gen = db_row.get("has_generation_data")
                        if has_gen is None:
                            has_gen = db_row.get("has_generation_metadata")
                        has_gen = int(has_gen or 0)
                        asset["has_generation_data"] = has_gen
                        asset["has_generation_metadata"] = has_gen
                        # Prefer stored root_id if present (custom)
                        if db_row.get("root_id"):
                            asset["root_id"] = db_row.get("root_id")
    except Exception as exc:
        logger.debug("Filesystem DB enrichment skipped: %s", exc)

    # Apply filters after enrichment
    filtered_entries = []
    for item in entries:
        if filter_kind and item.get("kind") != filter_kind:
            continue
        if filter_min_rating > 0 and int(item.get("rating", 0)) < filter_min_rating:
            continue
        if filter_workflow_only and not int(item.get("has_workflow", 0)):
            continue
        try:
            entry_mtime = int(item.get("mtime") or 0)
        except Exception:
            entry_mtime = 0
        if filter_mtime_start is not None and entry_mtime < filter_mtime_start:
            continue
        if filter_mtime_end is not None and entry_mtime >= filter_mtime_end:
            continue
        if not browse_all and q_lower not in str(item.get("filename", "")).lower():
            continue
        filtered_entries.append(item)

    total = len(filtered_entries)
    paged = filtered_entries[offset: offset + limit] if limit > 0 else filtered_entries[offset:]

    return Result.Ok({"assets": paged, "total": total, "limit": limit, "offset": offset, "query": q})
