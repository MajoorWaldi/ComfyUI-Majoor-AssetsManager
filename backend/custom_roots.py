"""
Custom roots persistence and resolution.

Custom roots allow browsing/staging files from arbitrary folders on disk.
Persistence is stored under the Majoor index directory so it survives restarts
without relying on ComfyUI internal userdata routes.
"""

from __future__ import annotations

import json
import threading
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import uuid4

from .shared import Result, get_logger
from .config import INDEX_DIR

logger = get_logger(__name__)

_LOCK = threading.Lock()
_STORE_PATH = Path(INDEX_DIR) / "custom_roots.json"


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _normalize_dir_path(path: str) -> Optional[Path]:
    if not path or "\x00" in path:
        return None
    try:
        return Path(path).expanduser().resolve()
    except (OSError, RuntimeError, ValueError):
        return None


def _read_store() -> Dict[str, Any]:
    if not _STORE_PATH.exists():
        return {"version": 1, "roots": []}
    try:
        raw = _STORE_PATH.read_text(encoding="utf-8")
        data = json.loads(raw) if raw else {}
        if not isinstance(data, dict):
            return {"version": 1, "roots": []}
        roots = data.get("roots")
        if not isinstance(roots, list):
            roots = []
        return {"version": int(data.get("version") or 1), "roots": roots}
    except Exception as exc:
        logger.warning("Failed to read custom roots store: %s", exc)
        return {"version": 1, "roots": []}


def _write_store(data: dict) -> Result[bool]:
    try:
        _STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
        _STORE_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        return Result.Ok(True)
    except Exception as exc:
        logger.warning("Failed to persist custom roots store: %s", exc)
        return Result.Err("STORE_WRITE_FAILED", f"Failed to persist custom roots: {exc}")


def list_custom_roots() -> Result[List[Dict[str, Any]]]:
    with _LOCK:
        store = _read_store()
        roots = store.get("roots") or []
        cleaned: List[Dict[str, Any]] = []
        for r in roots:
            if not isinstance(r, dict):
                continue
            rid = str(r.get("id") or "").strip()
            path = str(r.get("path") or "").strip()
            if not rid or not path:
                continue
            cleaned.append(
                {
                    "id": rid,
                    "path": path,
                    "label": str(r.get("label") or "").strip() or Path(path).name or path,
                    "created_at": r.get("created_at"),
                }
            )
        return Result.Ok(cleaned)


def add_custom_root(path: str, label: Optional[str] = None) -> Result[Dict[str, Any]]:
    normalized = _normalize_dir_path(path)
    if not normalized:
        return Result.Err("INVALID_INPUT", "Invalid path")
    if not normalized.exists():
        return Result.Err("DIR_NOT_FOUND", f"Directory not found: {normalized}")
    if not normalized.is_dir():
        return Result.Err("NOT_A_DIRECTORY", f"Not a directory: {normalized}")

    resolved = str(normalized)
    root_id = str(uuid4())
    created_at = _utc_now_iso()
    safe_label = (label or "").strip() or normalized.name or resolved

    with _LOCK:
        store = _read_store()
        roots = store.get("roots") or []
        for r in roots:
            if not isinstance(r, dict):
                continue
            existing_path = r.get("path")
            if existing_path and str(existing_path) == resolved:
                existing_id = str(r.get("id") or "")
                return Result.Ok(
                    {
                        "id": existing_id or root_id,
                        "path": resolved,
                        "label": str(r.get("label") or safe_label),
                        "created_at": r.get("created_at") or created_at,
                        "already_exists": True,
                    }
                )

        roots.append({"id": root_id, "path": resolved, "label": safe_label, "created_at": created_at})
        store["roots"] = roots
        write_result = _write_store(store)
        if not write_result.ok:
            return write_result  # type: ignore[return-value]

    return Result.Ok({"id": root_id, "path": resolved, "label": safe_label, "created_at": created_at})


def remove_custom_root(root_id: str) -> Result[bool]:
    rid = str(root_id or "").strip()
    if not rid:
        return Result.Err("INVALID_INPUT", "Missing root_id")

    with _LOCK:
        store = _read_store()
        roots = store.get("roots") or []
        kept = [r for r in roots if not (isinstance(r, dict) and str(r.get("id") or "") == rid)]
        if len(kept) == len(roots):
            return Result.Err("NOT_FOUND", f"Custom root not found: {rid}")
        store["roots"] = kept
        write_result = _write_store(store)
        if not write_result.ok:
            return write_result

    return Result.Ok(True)


def resolve_custom_root(root_id: str) -> Result[Path]:
    rid = str(root_id or "").strip()
    if not rid:
        return Result.Err("INVALID_INPUT", "Missing root_id")

    roots_result = list_custom_roots()
    if not roots_result.ok:
        return Result.Err(roots_result.code, roots_result.error)
    for r in roots_result.data or []:
        if str(r.get("id") or "") == rid:
            normalized = _normalize_dir_path(str(r.get("path") or ""))
            if not normalized:
                return Result.Err("INVALID_INPUT", "Invalid stored path")
            return Result.Ok(normalized)
    return Result.Err("NOT_FOUND", f"Custom root not found: {rid}")
