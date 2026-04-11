"""
In-memory state management for async vector backfill jobs.

Extracted from routes/handlers/db_maintenance.py to keep the job lifecycle
logic (register, update, complete, fail, prune, priority window) separate
from the HTTP route handlers that orchestrate it.

The job dict lives here so there is exactly one authoritative place for
all job-state reads and writes.
"""

from __future__ import annotations

import asyncio
import datetime
import threading
import time
import uuid
from typing import Any

_VECTOR_BACKFILL_LOCK = threading.Lock()
_VECTOR_BACKFILL_JOBS: dict[str, dict[str, Any]] = {}
_VECTOR_BACKFILL_ACTIVE_JOB_ID: str | None = None
_VECTOR_BACKFILL_HISTORY_LIMIT = 20

_VECTOR_BACKFILL_PRIORITY_LOCK = threading.Lock()
_VECTOR_BACKFILL_PRIORITY_UNTIL_MONO: float = 0.0
_VECTOR_BACKFILL_PRIORITY_REASON: str = ""
_VECTOR_BACKFILL_PRIORITY_MAX_WINDOW_S = 120.0
_VECTOR_BACKFILL_PRIORITY_SLEEP_SLICE_S = 0.25

VALID_SCOPES: frozenset[str] = frozenset({"output", "input", "custom", "all"})


# ---------------------------------------------------------------------------
# Pure utilities
# ---------------------------------------------------------------------------

def utc_now_iso() -> str:
    try:
        return datetime.datetime.now(datetime.timezone.utc).isoformat()
    except Exception:
        return ""


def parse_bool_flag(value: Any, default: bool = False) -> bool:
    try:
        if value is None:
            return bool(default)
        if isinstance(value, bool):
            return value
        s = str(value).strip().lower()
        if not s:
            return bool(default)
        if s in {"1", "true", "yes", "on", "enabled", "enable"}:
            return True
        if s in {"0", "false", "no", "off", "disabled", "disable"}:
            return False
        return bool(default)
    except Exception:
        return bool(default)


def normalize_scope(value: Any) -> str:
    """Normalise a backfill scope value to a canonical member of VALID_SCOPES."""
    raw = str(value or "output").strip().lower()
    if raw == "outputs":
        return "output"
    if raw == "inputs":
        return "input"
    return raw if raw in VALID_SCOPES else ""


# ---------------------------------------------------------------------------
# Job public serialisation
# ---------------------------------------------------------------------------

def _job_public_base(job: dict[str, Any]) -> dict[str, Any]:
    return {
        "backfill_id": str(job.get("backfill_id") or ""),
        "status": str(job.get("status") or "unknown"),
        "async": True,
        "batch_size": int(job.get("batch_size") or 64),
        "scope": str(job.get("scope") or "output"),
        "custom_root_id": str(job.get("custom_root_id") or "") or None,
    }


def _job_public_timing(job: dict[str, Any]) -> dict[str, Any]:
    return {
        "created_at": str(job.get("created_at") or ""),
        "updated_at": str(job.get("updated_at") or ""),
        "started_at": str(job.get("started_at") or ""),
        "finished_at": str(job.get("finished_at") or ""),
    }


def _job_public_payload(job: dict[str, Any]) -> dict[str, Any]:
    return {
        "progress": job.get("progress") if isinstance(job.get("progress"), dict) else None,
        "result": job.get("result") if isinstance(job.get("result"), dict) else None,
        "code": str(job.get("code") or "") or None,
        "error": str(job.get("error") or "") or None,
    }


def job_public(job: dict[str, Any]) -> dict[str, Any]:
    """Return the public-safe serialised form of a backfill job dict."""
    if not isinstance(job, dict):
        return {"backfill_id": "", "status": "idle", "async": True}
    result = _job_public_base(job)
    result.update(_job_public_timing(job))
    result.update(_job_public_payload(job))
    return result


# ---------------------------------------------------------------------------
# Job registry reads
# ---------------------------------------------------------------------------

def get_job(backfill_id: str) -> dict[str, Any] | None:
    with _VECTOR_BACKFILL_LOCK:
        return _VECTOR_BACKFILL_JOBS.get(str(backfill_id or ""))


def get_active_or_latest_job() -> dict[str, Any] | None:
    with _VECTOR_BACKFILL_LOCK:
        if _VECTOR_BACKFILL_ACTIVE_JOB_ID:
            active = _VECTOR_BACKFILL_JOBS.get(_VECTOR_BACKFILL_ACTIVE_JOB_ID)
            if isinstance(active, dict):
                return active
        if not _VECTOR_BACKFILL_JOBS:
            return None
        ordered = sorted(
            _VECTOR_BACKFILL_JOBS.values(),
            key=lambda j: str(j.get("created_at") or ""),
            reverse=True,
        )
        return ordered[0] if ordered else None


def is_active() -> bool:
    """Return True when an async vector backfill job is queued or running."""
    with _VECTOR_BACKFILL_LOCK:
        if not _VECTOR_BACKFILL_ACTIVE_JOB_ID:
            return False
        job = _VECTOR_BACKFILL_JOBS.get(_VECTOR_BACKFILL_ACTIVE_JOB_ID)
        if not isinstance(job, dict):
            return False
        status = str(job.get("status") or "").strip().lower()
        return status in {"queued", "running"}


# ---------------------------------------------------------------------------
# Priority window (cooperative pause for running jobs)
# ---------------------------------------------------------------------------

def priority_remaining_seconds() -> float:
    global _VECTOR_BACKFILL_PRIORITY_UNTIL_MONO, _VECTOR_BACKFILL_PRIORITY_REASON
    now = time.monotonic()
    with _VECTOR_BACKFILL_PRIORITY_LOCK:
        remaining = float(_VECTOR_BACKFILL_PRIORITY_UNTIL_MONO - now)
        if remaining <= 0:
            _VECTOR_BACKFILL_PRIORITY_UNTIL_MONO = 0.0
            _VECTOR_BACKFILL_PRIORITY_REASON = ""
            return 0.0
        return remaining


def request_priority_window(seconds: float = 18.0, *, reason: str = "generation") -> float:
    """
    Request a temporary cooperative pause window for the running backfill.

    Returns the remaining window in seconds.
    """
    duration = max(0.5, min(_VECTOR_BACKFILL_PRIORITY_MAX_WINDOW_S, float(seconds or 0.0)))
    now = time.monotonic()
    requested_until = now + duration
    with _VECTOR_BACKFILL_PRIORITY_LOCK:
        global _VECTOR_BACKFILL_PRIORITY_UNTIL_MONO, _VECTOR_BACKFILL_PRIORITY_REASON
        if requested_until > _VECTOR_BACKFILL_PRIORITY_UNTIL_MONO:
            _VECTOR_BACKFILL_PRIORITY_UNTIL_MONO = requested_until
            _VECTOR_BACKFILL_PRIORITY_REASON = str(reason or "generation")
        return max(0.0, _VECTOR_BACKFILL_PRIORITY_UNTIL_MONO - now)


def clear_priority_window() -> None:
    with _VECTOR_BACKFILL_PRIORITY_LOCK:
        global _VECTOR_BACKFILL_PRIORITY_UNTIL_MONO, _VECTOR_BACKFILL_PRIORITY_REASON
        _VECTOR_BACKFILL_PRIORITY_UNTIL_MONO = 0.0
        _VECTOR_BACKFILL_PRIORITY_REASON = ""


async def wait_for_priority_window() -> None:
    """Cooperative yield point — sleeps in short slices while a priority window is active."""
    while True:
        remaining = priority_remaining_seconds()
        if remaining <= 0:
            return
        await asyncio.sleep(min(_VECTOR_BACKFILL_PRIORITY_SLEEP_SLICE_S, remaining))


# ---------------------------------------------------------------------------
# Job lifecycle writes
# ---------------------------------------------------------------------------

def register_job(*, batch_size: int, scope: str = "output", custom_root_id: str = "") -> dict[str, Any]:
    normalized_scope = normalize_scope(scope) or "output"
    normalized_custom_root = str(custom_root_id or "").strip() if normalized_scope == "custom" else ""
    backfill_id = uuid.uuid4().hex
    now = utc_now_iso()
    job: dict[str, Any] = {
        "backfill_id": backfill_id,
        "status": "queued",
        "batch_size": int(max(1, min(200, batch_size))),
        "scope": normalized_scope,
        "custom_root_id": normalized_custom_root,
        "created_at": now,
        "updated_at": now,
        "started_at": "",
        "finished_at": "",
        "progress": {
            "candidates": 0,
            "indexed": 0,
            "skipped": 0,
            "errors": 0,
            "batch_size": int(max(1, min(200, batch_size))),
        },
        "result": None,
        "code": None,
        "error": None,
    }
    with _VECTOR_BACKFILL_LOCK:
        _VECTOR_BACKFILL_JOBS[backfill_id] = job
        global _VECTOR_BACKFILL_ACTIVE_JOB_ID
        _VECTOR_BACKFILL_ACTIVE_JOB_ID = backfill_id
    return job


def prune_history() -> None:
    with _VECTOR_BACKFILL_LOCK:
        if len(_VECTOR_BACKFILL_JOBS) <= _VECTOR_BACKFILL_HISTORY_LIMIT:
            return
        keep_ids: set[str] = set()
        if _VECTOR_BACKFILL_ACTIVE_JOB_ID:
            keep_ids.add(_VECTOR_BACKFILL_ACTIVE_JOB_ID)
        ordered = sorted(
            _VECTOR_BACKFILL_JOBS.values(),
            key=lambda j: str(j.get("created_at") or ""),
            reverse=True,
        )
        for item in ordered[:_VECTOR_BACKFILL_HISTORY_LIMIT]:
            keep_ids.add(str(item.get("backfill_id") or ""))
        for key in list(_VECTOR_BACKFILL_JOBS.keys()):
            if key not in keep_ids:
                _VECTOR_BACKFILL_JOBS.pop(key, None)


def update_job(backfill_id: str, **updates: Any) -> None:
    with _VECTOR_BACKFILL_LOCK:
        job = _VECTOR_BACKFILL_JOBS.get(str(backfill_id or ""))
        if not isinstance(job, dict):
            return
        job["updated_at"] = utc_now_iso()
        job.update(updates)


def complete_job(backfill_id: str, *, scope: str, custom_root_id: str, payload: dict[str, Any]) -> None:
    job_payload = {
        "ran": True,
        "scope": normalize_scope(scope) or "output",
        "custom_root_id": str(custom_root_id or "") or None,
        **payload,
    }
    update_job(
        backfill_id,
        status="succeeded",
        finished_at=utc_now_iso(),
        result=job_payload,
        code=None,
        error=None,
    )


def fail_job(backfill_id: str, error_message: str, code: str = "DB_ERROR") -> None:
    """Mark a backfill job as failed.

    The caller is responsible for formatting *error_message* (e.g. via
    ``safe_error_message(exc, fallback)``).  This keeps the module free of
    route-level dependencies.
    """
    update_job(
        backfill_id,
        status="failed",
        finished_at=utc_now_iso(),
        code=code,
        error=error_message,
    )


def clear_active_job_id(backfill_id: str) -> None:
    """Release the active job pointer if it still points to *backfill_id*."""
    with _VECTOR_BACKFILL_LOCK:
        global _VECTOR_BACKFILL_ACTIVE_JOB_ID
        if _VECTOR_BACKFILL_ACTIVE_JOB_ID == backfill_id:
            _VECTOR_BACKFILL_ACTIVE_JOB_ID = None
