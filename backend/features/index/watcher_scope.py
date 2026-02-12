"""
Watcher scope persistence and watch path resolution.
"""
from __future__ import annotations

import os
from typing import Optional

from ...config import OUTPUT_ROOT

WATCHER_SCOPE_KEY = "watcher_scope"
WATCHER_CUSTOM_ROOT_ID_KEY = "watcher_custom_root_id"


def normalize_scope(scope: Optional[str]) -> str:
    # Watcher scope is intentionally restricted to output only to avoid
    # accidentally monitoring huge non-ComfyUI trees (entire drives/custom roots).
    _ = str(scope or "").strip().lower()
    return "output"


def build_watch_paths(scope: str, custom_root_id: Optional[str]) -> list[dict]:
    watch_paths: list[dict] = []
    s = normalize_scope(scope)

    if s == "output":
        if OUTPUT_ROOT and os.path.isdir(OUTPUT_ROOT):
            watch_paths.append({"path": OUTPUT_ROOT, "source": "output", "root_id": None})
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
    return {
        "scope": normalize_scope(scope),
        "custom_root_id": str(custom_root_id or "").strip(),
    }
