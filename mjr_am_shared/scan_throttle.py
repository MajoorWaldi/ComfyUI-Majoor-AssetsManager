"""
Throttle helpers so background scans can skip directories that were just indexed.
"""
from __future__ import annotations

import os
import threading
import time
from pathlib import Path

from mjr_am_backend.config import MANUAL_BG_SCAN_GRACE_SECONDS

_LOCK = threading.Lock()
_MANUAL_SCAN_TIMES: dict[str, float] = {}
_RECENT_SCAN_TIMES: dict[str, float] = {}
_MAX_ENTRY_AGE = max(600, int(MANUAL_BG_SCAN_GRACE_SECONDS * 5))
_CLEANUP_INTERVAL_S = 60.0
_LAST_CLEANUP = 0.0

# Cache resolved paths to avoid repeated Path(...).resolve() filesystem stats
# on hot throttle-check paths. The throttle key only needs a stable
# normalization, not strict realpath, so a small TTL cache is safe.
_NORMALIZE_CACHE: dict[str, str] = {}
_NORMALIZE_CACHE_MAX = 1024


def normalize_scan_directory(directory: str) -> str:
    """Normalize and resolve a directory path for consistent throttling keys."""
    if not directory:
        return ""
    cached = _NORMALIZE_CACHE.get(directory)
    if cached is not None:
        return cached
    try:
        resolved = Path(directory).resolve()
        result = str(resolved)
    except Exception:
        try:
            result = os.path.abspath(directory)
        except Exception:
            result = str(directory)
    if len(_NORMALIZE_CACHE) >= _NORMALIZE_CACHE_MAX:
        # Simple bounded cache: drop one arbitrary entry rather than grow unbounded.
        try:
            _NORMALIZE_CACHE.pop(next(iter(_NORMALIZE_CACHE)))
        except StopIteration:
            pass
    _NORMALIZE_CACHE[directory] = result
    return result


def _scan_key(directory: str, source: str, root_id: str | None) -> str:
    norm_dir = normalize_scan_directory(directory or "")
    return f"{str(source or 'output')}|{str(root_id or '')}|{norm_dir}"


def mark_directory_indexed(
    directory: str,
    source: str = "output",
    root_id: str | None = None,
    metadata_complete: bool = True,
) -> None:
    """
    Record that a directory was just re-indexed, so we can skip redundant background scans.
    Only mark directories when metadata extraction completed (`metadata_complete=True`).
    """
    if not metadata_complete:
        return
    now = time.time()
    key = _scan_key(directory, source, root_id)
    with _LOCK:
        _MANUAL_SCAN_TIMES[key] = now
        _maybe_cleanup_locked(now)


def mark_directory_scanned(
    directory: str,
    source: str = "output",
    root_id: str | None = None,
) -> None:
    """
    Record that a background scan was scheduled/executed, regardless of metadata completeness.
    Used to avoid repeated fast scans when the DB is empty.
    """
    now = time.time()
    key = _scan_key(directory, source, root_id)
    with _LOCK:
        _RECENT_SCAN_TIMES[key] = now
        _maybe_cleanup_locked(now)


def should_skip_background_scan(
    directory: str,
    source: str = "output",
    root_id: str | None = None,
    grace_seconds: float = MANUAL_BG_SCAN_GRACE_SECONDS,
    include_recent: bool = False,
) -> bool:
    """
    Return True if a recent manual index was recorded for the same directory/source/root.
    """
    now = time.time()
    key = _scan_key(directory, source, root_id)
    with _LOCK:
        ts = _MANUAL_SCAN_TIMES.get(key)
        if ts is None:
            if include_recent:
                ts = _RECENT_SCAN_TIMES.get(key)
                if ts is None:
                    return False
            else:
                return False
        if now - ts < grace_seconds:
            return True
        if now - ts > _MAX_ENTRY_AGE:
            _MANUAL_SCAN_TIMES.pop(key, None)
            _RECENT_SCAN_TIMES.pop(key, None)
    return False


def _cleanup_locked(now: float) -> None:
    """Prune old entries (expects caller to hold `_LOCK`)."""
    cutoff = now - _MAX_ENTRY_AGE
    keys_to_remove = [k for k, v in _MANUAL_SCAN_TIMES.items() if v < cutoff]
    for k in keys_to_remove:
        _MANUAL_SCAN_TIMES.pop(k, None)
    keys_to_remove = [k for k, v in _RECENT_SCAN_TIMES.items() if v < cutoff]
    for k in keys_to_remove:
        _RECENT_SCAN_TIMES.pop(k, None)


def _maybe_cleanup_locked(now: float) -> None:
    """Run cleanup opportunistically, but at most once per interval."""
    global _LAST_CLEANUP
    if (now - _LAST_CLEANUP) < _CLEANUP_INTERVAL_S:
        return
    _LAST_CLEANUP = now
    _cleanup_locked(now)


def _reset_scan_throttle_state_for_tests() -> None:
    """
    Test helper: clear all in-memory scan throttle state.
    """
    with _LOCK:
        _MANUAL_SCAN_TIMES.clear()
        _RECENT_SCAN_TIMES.clear()
        global _LAST_CLEANUP
        _LAST_CLEANUP = 0.0
