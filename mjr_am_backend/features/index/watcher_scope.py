"""
Watcher scope persistence and watch path resolution.
"""
from __future__ import annotations

import hashlib
import os
import re
from collections.abc import Mapping

from ...config import get_runtime_output_root
from ...shared import get_logger

logger = get_logger(__name__)

WATCHER_SCOPE_KEY = "watcher_scope"
WATCHER_CUSTOM_ROOT_ID_KEY = "watcher_custom_root_id"
_USER_SCOPE_PREFIX = "__user__"
_USER_SCOPE_SEGMENT_RE = re.compile(r"^[A-Za-z0-9._-]{1,128}$")


def normalize_scope(scope: str | None) -> str:
    s = str(scope or "").strip().lower()
    if s in ("custom",):
        return "custom"
    return "output"


def _current_request_user_id() -> str:
    try:
        from ...routes.core import _current_user_id

        return str(_current_user_id() or "").strip()
    except Exception:
        return ""


def _effective_user_id(user_id: str | None = None) -> str:
    explicit = str(user_id or "").strip()
    if explicit:
        return explicit
    return _current_request_user_id()


def _safe_user_scope_segment(user_id: str) -> str:
    normalized = str(user_id or "").strip()
    if not normalized:
        return ""
    if _USER_SCOPE_SEGMENT_RE.match(normalized):
        return normalized
    return hashlib.sha256(normalized.encode("utf-8", errors="ignore")).hexdigest()


def _storage_key(key: str, *, user_id: str | None = None) -> str:
    effective_user_id = _effective_user_id(user_id)
    if not effective_user_id:
        return key
    return f"{_USER_SCOPE_PREFIX}:{_safe_user_scope_segment(effective_user_id)}:{key}"


def _read_candidate_keys(key: str, *, user_id: str | None = None) -> tuple[str, ...]:
    scoped_key = _storage_key(key, user_id=user_id)
    if scoped_key == key:
        return (key,)
    return (scoped_key, key)


def resolve_service_watcher_scope(
    services: Mapping[str, object] | None,
    *,
    user_id: str | None = None,
) -> dict[str, str]:
    effective_user_id = _effective_user_id(user_id)
    if effective_user_id and isinstance(services, Mapping):
        scope_map = services.get("watcher_scope_by_user")
        if isinstance(scope_map, Mapping):
            user_scope = scope_map.get(effective_user_id)
            if isinstance(user_scope, Mapping):
                if "scope" not in user_scope:
                    logger.warning(
                        "watcher_scope_by_user entry for user %r is missing 'scope' key; "
                        "defaulting to 'output'",
                        effective_user_id,
                    )
                scope = normalize_scope(user_scope.get("scope"))
                custom_root_id = str(user_scope.get("custom_root_id") or "").strip()
                return {
                    "scope": scope,
                    "custom_root_id": custom_root_id if scope == "custom" else "",
                }

    scope_cfg = services.get("watcher_scope") if isinstance(services, Mapping) else None
    if isinstance(scope_cfg, Mapping):
        scope = normalize_scope(scope_cfg.get("scope"))
        custom_root_id = str(scope_cfg.get("custom_root_id") or "").strip()
        return {
            "scope": scope,
            "custom_root_id": custom_root_id if scope == "custom" else "",
        }
    return {"scope": "output", "custom_root_id": ""}


def build_watch_paths(scope: str, custom_root_id: str | None, user_id: str | None = None) -> list[dict]:
    watch_paths: list[dict] = []
    s = normalize_scope(scope)

    if s == "output":
        output_entry = _output_watch_entry()
        if output_entry is not None:
            watch_paths.append(output_entry)
        return watch_paths

    if s == "custom":
        custom_entry = _custom_watch_entry(custom_root_id, user_id=user_id)
        if custom_entry is not None:
            watch_paths.append(custom_entry)
        return watch_paths

    return watch_paths


def _output_watch_entry() -> dict | None:
    output_root = str(get_runtime_output_root() or "")
    if output_root and os.path.isdir(output_root):
        return {"path": output_root, "source": "output", "root_id": None}
    return None


def _custom_watch_entry(custom_root_id: str | None, *, user_id: str | None = None) -> dict | None:
    rid = str(custom_root_id or "").strip()
    if not rid:
        return None
    try:
        from ...custom_roots import resolve_custom_root

        effective_user_id = _effective_user_id(user_id)
        root_result = resolve_custom_root(rid, user_id=effective_user_id or None)
    except Exception:
        return None
    if not root_result.ok or not root_result.data:
        return None
    root_path = os.path.normpath(str(root_result.data))
    if not (root_path and os.path.isdir(root_path)):
        return None
    return {"path": root_path, "source": "custom", "root_id": rid}


async def load_watcher_scope(db, *, user_id: str | None = None) -> dict:
    scope = await _read_metadata_fallback(db, WATCHER_SCOPE_KEY, user_id=user_id) or "output"
    custom_root_id = await _read_metadata_fallback(db, WATCHER_CUSTOM_ROOT_ID_KEY, user_id=user_id) or ""
    normalized_scope = normalize_scope(scope)
    return {
        "scope": normalized_scope,
        "custom_root_id": str(custom_root_id or "").strip() if normalized_scope == "custom" else "",
    }


async def persist_watcher_scope(
    db,
    scope: str | None,
    custom_root_id: str | None,
    *,
    user_id: str | None = None,
) -> None:
    normalized_scope = normalize_scope(scope)
    normalized_root_id = str(custom_root_id or "").strip() if normalized_scope == "custom" else ""
    await _write_metadata_value(db, _storage_key(WATCHER_SCOPE_KEY, user_id=user_id), normalized_scope)
    await _write_metadata_value(db, _storage_key(WATCHER_CUSTOM_ROOT_ID_KEY, user_id=user_id), normalized_root_id)


async def _read_metadata_value_exact(db, key: str) -> str | None:
    try:
        res = await db.aquery("SELECT value FROM metadata WHERE key = ?", (key,))
    except Exception:
        return None
    if not res.ok or not res.data:
        return None
    raw = res.data[0].get("value")
    if isinstance(raw, str):
        return raw.strip()
    return None


async def _read_metadata_fallback(db, key: str, *, user_id: str | None = None) -> str | None:
    for storage_key in _read_candidate_keys(key, user_id=user_id):
        value = await _read_metadata_value_exact(db, storage_key)
        if value is not None:
            return value
    return None


async def _write_metadata_value(db, key: str, value: str) -> None:
    await db.aexecute(
        "INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)",
        (key, value),
    )
