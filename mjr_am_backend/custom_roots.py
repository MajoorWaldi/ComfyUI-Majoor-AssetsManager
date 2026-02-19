"""
Custom roots persistence and resolution.

Custom roots allow browsing/staging files from arbitrary folders on disk.
Persistence is stored under the Majoor index directory so it survives restarts
without relying on ComfyUI internal userdata routes.
"""

from __future__ import annotations

import json
import os
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from uuid import uuid4

from .shared import Result, get_logger
from .config import INDEX_DIR, OUTPUT_ROOT

logger = get_logger(__name__)

_LOCK = threading.Lock()
_STORE_PATH = Path(INDEX_DIR) / "custom_roots.json"
_DEFAULT_MAX_STORE_BYTES = 1024 * 1024  # 1MB
_MAX_STORE_BYTES = int(os.environ.get("MJR_CUSTOM_ROOTS_MAX_BYTES", str(_DEFAULT_MAX_STORE_BYTES)))


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def _is_symlink_like(path: Path) -> bool:
    """
    Best-effort detection for symlinks/junctions/reparse points.
    """
    try:
        if path.is_symlink():
            return True
    except Exception:
        pass
    try:
        st = path.lstat()
        # Windows: reparse points cover symlinks/junctions.
        if hasattr(st, "st_file_attributes"):
            return bool(int(getattr(st, "st_file_attributes") or 0) & 0x400)
    except Exception:
        pass
    return False


def _path_is_relative_to(path: Path, root: Path) -> bool:
    try:
        if hasattr(path, "is_relative_to"):
            return path.is_relative_to(root)  # type: ignore[attr-defined]
        path.relative_to(root)
        return True
    except Exception:
        return False


def _normalize_dir_path(path: str) -> Optional[Path]:
    if not path or "\x00" in path:
        return None
    try:
        p = Path(path).expanduser()
        allow_symlinks = os.environ.get("MJR_ALLOW_SYMLINKS", "").strip().lower() in ("1", "true", "yes", "on")
        if not allow_symlinks and _is_symlink_like(p):
            return None
        resolved = p.resolve(strict=False)
        return resolved
    except (OSError, RuntimeError, ValueError):
        return None


def _canonical_path_key(path_value: str) -> str:
    """
    Build a normalized path key for duplicate detection across case/format variants.

    Example on Windows:
      D:\\Images == d:\\images == D:/Images
    """
    try:
        expanded = os.path.expanduser(str(path_value or "").strip())
        absolute = os.path.abspath(expanded)
        normalized = os.path.normpath(absolute)
        return os.path.normcase(normalized)
    except Exception:
        return str(path_value or "").strip().lower()


def _read_store() -> Dict[str, Any]:
    if not _STORE_PATH.exists():
        return {"version": 1, "roots": []}
    try:
        try:
            if _STORE_PATH.stat().st_size > _MAX_STORE_BYTES:
                logger.warning("Custom roots store too large, ignoring: %s", _STORE_PATH)
                return {"version": 1, "roots": []}
        except Exception:
            pass
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
        # Atomic write to prevent corruption on crash/interruption.
        payload = json.dumps(data, ensure_ascii=False, indent=2)
        tmp = _STORE_PATH.with_name(_STORE_PATH.name + f".tmp_{uuid4().hex}")
        tmp.write_text(payload, encoding="utf-8")
        tmp.replace(_STORE_PATH)
        return Result.Ok(True)
    except Exception as exc:
        logger.warning("Failed to persist custom roots store: %s", exc)
        return Result.Err("STORE_WRITE_FAILED", f"Failed to persist custom roots: {exc}")


def list_custom_roots() -> Result[List[Dict[str, Any]]]:
    """List configured custom root directories (id/path/label/created_at)."""
    with _LOCK:
        store = _read_store()
        roots = store.get("roots") or []
        cleaned: List[Dict[str, Any]] = []
        for r in roots:
            normalized_row = _normalize_custom_root_row(r)
            if normalized_row is not None:
                cleaned.append(normalized_row)
        return Result.Ok(cleaned)


def _normalize_custom_root_row(row: Any) -> Optional[Dict[str, Any]]:
    if not isinstance(row, dict):
        return None
    rid = str(row.get("id") or "").strip()
    path = str(row.get("path") or "").strip()
    if not rid or not path:
        return None
    normalized = _normalize_dir_path(path)
    if not normalized:
        return {
            "id": rid,
            "path": path,
            "label": str(row.get("label") or "").strip() or path,
            "created_at": row.get("created_at"),
            "offline": True,
            "invalid": True,
        }
    return _normalized_root_payload(row, rid=rid, normalized=normalized)


def _normalized_root_payload(row: Dict[str, Any], *, rid: str, normalized: Path) -> Dict[str, Any]:
    exists, is_dir = _path_exists_and_is_dir(normalized)
    offline = not (exists and is_dir)
    return {
        "id": rid,
        "path": str(normalized),
        "label": str(row.get("label") or "").strip() or normalized.name or str(normalized),
        "created_at": row.get("created_at"),
        "offline": bool(offline),
    }


def _path_exists_and_is_dir(path: Path) -> Tuple[bool, bool]:
    try:
        return path.exists(), path.is_dir()
    except Exception:
        return False, False


def add_custom_root(path: str, label: Optional[str] = None) -> Result[Dict[str, Any]]:
    """Add a custom root directory, or return the existing one if present."""
    normalized = _normalize_dir_path(path)
    validation = _validate_new_root_path(normalized)
    if validation is not None:
        return validation

    payload = _new_root_payload(normalized, label=label)
    resolved = payload["resolved"]
    normalized_key = payload["normalized_key"]
    root_id = payload["root_id"]
    created_at = payload["created_at"]
    safe_label = payload["safe_label"]

    output_root, input_root = _resolve_builtin_roots()
    overlap_err = _check_builtin_root_overlap(normalized, output_root, input_root)
    if overlap_err is not None:
        return overlap_err

    with _LOCK:
        store = _read_store()
        roots = store.get("roots") or []
        existing_result = _find_existing_or_overlap_root(
            roots=roots,
            normalized=normalized,
            normalized_key=normalized_key,
            fallback_id=root_id,
            resolved=resolved,
            safe_label=safe_label,
            created_at=created_at,
        )
        if existing_result is not None:
            return existing_result

        roots.append(_root_row(root_id, resolved, safe_label, created_at))
        store["roots"] = roots
        write_result = _write_store(store)
        if not write_result.ok:
            return write_result  # type: ignore[return-value]

    return Result.Ok(_root_row(root_id, resolved, safe_label, created_at))


def _validate_new_root_path(normalized: Optional[Path]) -> Optional[Result[Dict[str, Any]]]:
    if not normalized:
        return Result.Err("INVALID_INPUT", "Invalid path")
    if not normalized.exists():
        return Result.Err("DIR_NOT_FOUND", f"Directory not found: {normalized}")
    if not normalized.is_dir():
        return Result.Err("NOT_A_DIRECTORY", f"Not a directory: {normalized}")
    return None


def _new_root_payload(normalized: Path, *, label: Optional[str]) -> Dict[str, str]:
    resolved = str(normalized)
    return {
        "resolved": resolved,
        "normalized_key": _canonical_path_key(resolved),
        "root_id": str(uuid4()),
        "created_at": _utc_now_iso(),
        "safe_label": (label or "").strip() or normalized.name or resolved,
    }


def _root_row(root_id: str, resolved: str, safe_label: str, created_at: str) -> Dict[str, Any]:
    return {"id": root_id, "path": resolved, "label": safe_label, "created_at": created_at}


def _resolve_builtin_roots() -> tuple[Optional[Path], Optional[Path]]:
    output_root: Optional[Path] = None
    input_root: Optional[Path] = None
    try:
        if OUTPUT_ROOT:
            output_root = Path(OUTPUT_ROOT).resolve()
    except Exception:
        output_root = None
    try:
        import folder_paths

        input_root = Path(folder_paths.get_input_directory()).resolve()
    except Exception:
        input_root = None
    return output_root, input_root


def _check_builtin_root_overlap(
    normalized: Path,
    output_root: Optional[Path],
    input_root: Optional[Path],
) -> Optional[Result[Dict[str, Any]]]:
    if output_root and (_path_is_relative_to(normalized, output_root) or _path_is_relative_to(output_root, normalized)):
        return Result.Err("OVERLAP", f"Root overlaps with output: {output_root}")
    if input_root and (_path_is_relative_to(normalized, input_root) or _path_is_relative_to(input_root, normalized)):
        return Result.Err("OVERLAP", f"Root overlaps with input: {input_root}")
    return None


def _find_existing_or_overlap_root(
    *,
    roots: List[Any],
    normalized: Path,
    normalized_key: str,
    fallback_id: str,
    resolved: str,
    safe_label: str,
    created_at: str,
) -> Optional[Result[Dict[str, Any]]]:
    for root in roots:
        if not isinstance(root, dict):
            continue
        existing_path = root.get("path")
        same_path = existing_path and _canonical_path_key(str(existing_path)) == normalized_key
        if same_path:
            existing_id = str(root.get("id") or "")
            return Result.Ok(
                {
                    "id": existing_id or fallback_id,
                    "path": resolved,
                    "label": str(root.get("label") or safe_label),
                    "created_at": root.get("created_at") or created_at,
                    "already_exists": True,
                }
            )
        overlap = _existing_root_overlap(normalized, existing_path)
        if overlap:
            return Result.Err("OVERLAP", f"Root overlaps with existing: {overlap}")
    return None


def _existing_root_overlap(normalized: Path, existing_path: Any) -> Optional[Path]:
    if not existing_path:
        return None
    try:
        existing_resolved = Path(str(existing_path)).expanduser().resolve(strict=False)
        if _path_is_relative_to(normalized, existing_resolved) or _path_is_relative_to(existing_resolved, normalized):
            return existing_resolved
    except Exception:
        return None
    return None


def remove_custom_root(root_id: str) -> Result[bool]:
    """Remove a custom root by id."""
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
    """Resolve a custom root id to a validated directory path."""
    rid = str(root_id or "").strip()
    if not rid:
        return Result.Err("INVALID_INPUT", "Missing root_id")

    roots_result = list_custom_roots()
    if not roots_result.ok:
        return Result.Err(roots_result.code, roots_result.error or "Failed to list custom roots")
    root_row = _find_custom_root_row_by_id(roots_result.data or [], rid)
    if root_row is not None:
        return _resolve_custom_root_path_from_row(root_row)
    return Result.Err("NOT_FOUND", f"Custom root not found: {rid}")


def _find_custom_root_row_by_id(rows: List[Dict[str, Any]], rid: str) -> Optional[Dict[str, Any]]:
    for row in rows:
        if str(row.get("id") or "") == rid:
            return row
    return None


def _resolve_custom_root_path_from_row(row: Dict[str, Any]) -> Result[Path]:
    normalized = _normalize_dir_path(str(row.get("path") or ""))
    if not normalized:
        return Result.Err("INVALID_INPUT", "Invalid stored path")
    try:
        if not normalized.exists() or not normalized.is_dir():
            return Result.Err("OFFLINE", f"Custom root is offline: {normalized}")
    except Exception:
        return Result.Err("OFFLINE", f"Custom root is offline: {normalized}")
    return Result.Ok(normalized)
