"""
Watcher scope persistence and watch path resolution.
"""
from __future__ import annotations

import os
from typing import Optional

from ...config import get_runtime_output_root

WATCHER_SCOPE_KEY = "watcher_scope"
WATCHER_CUSTOM_ROOT_ID_KEY = "watcher_custom_root_id"


def normalize_scope(scope: Optional[str]) -> str:
    s = str(scope or "").strip().lower()
    if s in ("custom",):
        return "custom"
    return "output"


def build_watch_paths(scope: str, custom_root_id: Optional[str]) -> list[dict]:
    watch_paths: list[dict] = []
    s = normalize_scope(scope)

    if s == "output":
        output_entry = _output_watch_entry()
        if output_entry is not None:
            watch_paths.append(output_entry)
        return watch_paths

    if s == "custom":
        custom_entry = _custom_watch_entry(custom_root_id)
        if custom_entry is not None:
            watch_paths.append(custom_entry)
        return watch_paths

    return watch_paths


def _output_watch_entry() -> Optional[dict]:
    output_root = str(get_runtime_output_root() or "")
    if output_root and os.path.isdir(output_root):
        return {"path": output_root, "source": "output", "root_id": None}
    return None


def _custom_watch_entry(custom_root_id: Optional[str]) -> Optional[dict]:
    rid = str(custom_root_id or "").strip()
    if not rid:
        return None
    try:
        from ...custom_roots import resolve_custom_root
        root_result = resolve_custom_root(rid)
    except Exception:
        return None
    if not root_result.ok or not root_result.data:
        return None
    root_path = str(root_result.data)
    if not (root_path and os.path.isdir(root_path)):
        return None
    return {"path": root_path, "source": "custom", "root_id": rid}


async def load_watcher_scope(db) -> dict:
    scope = "output"
    custom_root_id = ""
    res = await _query_watcher_scope_rows(db)
    if res:
        scope, custom_root_id = _parse_watcher_scope_rows(res, scope, custom_root_id)
    normalized_scope = normalize_scope(scope)
    return {
        "scope": normalized_scope,
        "custom_root_id": str(custom_root_id or "").strip() if normalized_scope == "custom" else "",
    }


async def _query_watcher_scope_rows(db):
    try:
        res = await db.aquery(
            "SELECT key, value FROM metadata WHERE key IN (?, ?)",
            (WATCHER_SCOPE_KEY, WATCHER_CUSTOM_ROOT_ID_KEY),
        )
    except Exception:
        return None
    if not res.ok or not res.data:
        return None
    return res.data


def _parse_watcher_scope_rows(rows, scope: str, custom_root_id: str) -> tuple[str, str]:
    for row in rows:
        key = str(row.get("key") or "")
        val = str(row.get("value") or "")
        if key == WATCHER_SCOPE_KEY and val:
            scope = val
        elif key == WATCHER_CUSTOM_ROOT_ID_KEY:
            custom_root_id = val
    return scope, custom_root_id
