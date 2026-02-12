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
        output_root = str(get_runtime_output_root() or "")
        if output_root and os.path.isdir(output_root):
            watch_paths.append({"path": output_root, "source": "output", "root_id": None})
        return watch_paths

    if s == "custom":
        rid = str(custom_root_id or "").strip()
        if not rid:
            return watch_paths
        try:
            from ...custom_roots import resolve_custom_root
            root_result = resolve_custom_root(rid)
            if root_result.ok and root_result.data:
                root_path = str(root_result.data)
                if root_path and os.path.isdir(root_path):
                    watch_paths.append({"path": root_path, "source": "custom", "root_id": rid})
        except Exception:
            return watch_paths
        return watch_paths

    return watch_paths


async def load_watcher_scope(db) -> dict:
    scope = "output"
    custom_root_id = ""
    try:
        res = await db.aquery(
            "SELECT key, value FROM metadata WHERE key IN (?, ?)",
            (WATCHER_SCOPE_KEY, WATCHER_CUSTOM_ROOT_ID_KEY),
        )
        if res.ok and res.data:
            for row in res.data:
                key = str(row.get("key") or "")
                val = str(row.get("value") or "")
                if key == WATCHER_SCOPE_KEY and val:
                    scope = val
                elif key == WATCHER_CUSTOM_ROOT_ID_KEY:
                    custom_root_id = val
    except Exception:
        pass
    normalized_scope = normalize_scope(scope)
    return {
        "scope": normalized_scope,
        "custom_root_id": str(custom_root_id or "").strip() if normalized_scope == "custom" else "",
    }
