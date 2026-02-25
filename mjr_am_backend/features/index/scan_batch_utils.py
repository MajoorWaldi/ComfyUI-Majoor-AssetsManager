"""
Scan batch utilities — pure functions for batching, journal lookups, state hashing,
and stats initialisation. No I/O, no DB access, no side effects.
"""
import hashlib
import os
from collections.abc import Iterable
from datetime import datetime
from pathlib import Path
from typing import Any

from ...config import (
    IS_WINDOWS,
    SCAN_BATCH_INITIAL,
    SCAN_BATCH_LARGE,
    SCAN_BATCH_LARGE_THRESHOLD,
    SCAN_BATCH_MED,
    SCAN_BATCH_MED_THRESHOLD,
    SCAN_BATCH_MIN,
    SCAN_BATCH_SMALL,
    SCAN_BATCH_SMALL_THRESHOLD,
    SCAN_BATCH_XL,
)

# ---------------------------------------------------------------------------
# Shared constants (previously module-level in scanner.py)
# ---------------------------------------------------------------------------

MAX_TRANSACTION_BATCH_SIZE = 500
MAX_SCAN_JOURNAL_LOOKUP = 5000
STAT_RETRY_COUNT = 3
STAT_RETRY_BASE_DELAY_S = 0.15


# ---------------------------------------------------------------------------
# Filepath normalisation
# ---------------------------------------------------------------------------

def normalize_filepath_str(file_path: Path | str) -> str:
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


# ---------------------------------------------------------------------------
# Batch sizing
# ---------------------------------------------------------------------------

def stream_batch_target(scanned_count: int) -> int:
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


def chunk_file_batches(files: list[Path]) -> Iterable[list[Path]]:
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


# ---------------------------------------------------------------------------
# State hashing
# ---------------------------------------------------------------------------

def compute_state_hash(filepath: str, mtime_ns: int, size: int) -> str:
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


# ---------------------------------------------------------------------------
# Journal helpers
# ---------------------------------------------------------------------------

def journal_state_hash(existing_state: dict[str, Any] | None) -> str | None:
    if isinstance(existing_state, dict):
        return existing_state.get("journal_state_hash")
    return None


def clean_journal_lookup_paths(filepaths: list[str]) -> list[str]:
    cleaned = [str(p) for p in (filepaths or []) if p]
    if len(cleaned) > MAX_SCAN_JOURNAL_LOOKUP:
        return cleaned[:MAX_SCAN_JOURNAL_LOOKUP]
    return cleaned


def journal_rows_to_map(rows: list[Any]) -> dict[str, str]:
    out: dict[str, str] = {}
    for row in rows:
        if not isinstance(row, dict):
            continue
        fp = row.get("filepath")
        sh = row.get("state_hash")
        if fp and sh:
            out[str(fp)] = str(sh)
    return out


def should_skip_by_journal(
    *,
    incremental: bool,
    journal_state_hash: str | None,
    state_hash: str,
    fast: bool,
    existing_id: int,
    has_rich_meta_set: set[int],
) -> bool:
    if not (incremental and journal_state_hash and str(journal_state_hash) == state_hash):
        return False
    return bool(fast or (existing_id and existing_id in has_rich_meta_set))


# ---------------------------------------------------------------------------
# Incremental helpers
# ---------------------------------------------------------------------------

def is_incremental_unchanged(prepare_ctx: dict[str, Any], incremental: bool) -> bool:
    return bool(
        incremental
        and prepare_ctx["existing_id"]
        and prepare_ctx["existing_mtime"] == prepare_ctx["mtime"]
    )


def file_state_drifted(file_path: Path, expected_mtime_ns: int, expected_size: int) -> bool:
    """Return True when file changed between initial stat and DB write time."""
    try:
        st = file_path.stat()
        return int(st.st_mtime_ns) != int(expected_mtime_ns) or int(st.st_size) != int(expected_size)
    except Exception:
        return True


# ---------------------------------------------------------------------------
# Stats initialisers
# ---------------------------------------------------------------------------

def new_scan_stats() -> dict[str, Any]:
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


def empty_index_stats() -> dict[str, Any]:
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


def new_index_stats(scanned: int) -> dict[str, Any]:
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


# ---------------------------------------------------------------------------
# Batch error diagnosis helpers
# ---------------------------------------------------------------------------

def prepared_filepath(entry: dict[str, Any]) -> str:
    return str(entry.get("filepath") or entry.get("file_path") or "").strip()


def first_prepared_filepath(prepared: list[dict[str, Any]]) -> str | None:
    for entry in prepared:
        fp = prepared_filepath(entry)
        if fp:
            return fp
    return None


def first_duplicate_filepath_in_batch(
    prepared: list[dict[str, Any]],
    is_windows: bool = IS_WINDOWS,
) -> str | None:
    seen: set[str] = set()
    for entry in prepared:
        fp = prepared_filepath(entry)
        if not fp:
            continue
        key = fp.lower() if is_windows else fp
        if key in seen:
            return fp
        seen.add(key)
    return None
