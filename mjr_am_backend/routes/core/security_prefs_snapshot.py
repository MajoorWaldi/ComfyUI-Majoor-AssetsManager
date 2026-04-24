"""
In-memory snapshot of persisted security preferences.

The write-access guard (`_check_write_access`) and the bootstrap-token endpoint
must consult policy values synchronously while serving requests. Reading the
DB inline on every request is expensive and not always possible from sync
contexts, so this module keeps a thread-safe snapshot updated at startup and
on every `set_security_prefs` write.

Design notes
------------
- Source of truth is still the DB (managed by `AppSettings`).
- Env vars remain a fallback for fields not present in the snapshot.
- Snapshot is intentionally minimal (booleans only) to avoid leaking secrets.
"""

from __future__ import annotations

import threading
from collections.abc import Mapping
from typing import Any

_SNAPSHOT_LOCK = threading.Lock()
_SNAPSHOT: dict[str, bool] = {}
_HAS_SNAPSHOT: bool = False

_TRACKED_KEYS: tuple[str, ...] = (
    "safe_mode",
    "allow_write",
    "require_auth",
    "allow_remote_write",
    "allow_insecure_token_transport",
    "allow_delete",
    "allow_rename",
    "allow_open_in_folder",
    "allow_reset_index",
)


def _coerce(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    if isinstance(value, str):
        return value.strip().lower() in ("1", "true", "yes", "on")
    return bool(value)


def update_security_prefs_snapshot(prefs: Mapping[str, Any] | None) -> None:
    """Replace the in-memory snapshot with the supplied prefs."""
    global _HAS_SNAPSHOT
    if not prefs:
        return
    next_snapshot: dict[str, bool] = {}
    for key in _TRACKED_KEYS:
        if key in prefs:
            try:
                next_snapshot[key] = _coerce(prefs[key])
            except Exception:
                continue
    if not next_snapshot:
        return
    with _SNAPSHOT_LOCK:
        _SNAPSHOT.update(next_snapshot)
        _HAS_SNAPSHOT = True


def get_security_pref(key: str) -> bool | None:
    """Return the snapshot value for `key`, or None if not yet loaded."""
    with _SNAPSHOT_LOCK:
        if not _HAS_SNAPSHOT:
            return None
        if key in _SNAPSHOT:
            return _SNAPSHOT[key]
    return None


def has_snapshot() -> bool:
    with _SNAPSHOT_LOCK:
        return _HAS_SNAPSHOT


def reset_snapshot_for_tests() -> None:
    global _HAS_SNAPSHOT
    with _SNAPSHOT_LOCK:
        _SNAPSHOT.clear()
        _HAS_SNAPSHOT = False
