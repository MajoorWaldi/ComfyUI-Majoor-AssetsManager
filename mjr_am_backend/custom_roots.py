"""
Custom roots persistence and resolution.

Custom roots allow browsing/staging files from arbitrary folders on disk.
Persistence is stored under the Majoor index directory so it survives restarts
without relying on ComfyUI internal userdata routes.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import sys
import threading
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

from .config import INDEX_DIR, OUTPUT_ROOT
from .shared import Result, get_logger

logger = get_logger(__name__)

_LOCK = threading.Lock()
_STORE_PATH = Path(INDEX_DIR) / "custom_roots.json"
_USER_STORES_DIR = Path(INDEX_DIR) / "users"
_DEFAULT_MAX_STORE_BYTES = 1024 * 1024  # 1MB
_USER_SEGMENT_RE = re.compile(r"[^A-Za-z0-9._-]+")

# Offline / existence probe cache.  Keyed on normcase(normpath(str(path))).
# Tuple = (exists, is_dir, monotonic_timestamp).
_OFFLINE_LOCK = threading.Lock()
_OFFLINE_CACHE: dict[str, tuple[bool, bool, float]] = {}
try:
    _OFFLINE_TTL = float(os.environ.get("MJR_CUSTOM_ROOT_OFFLINE_TTL", "8.0"))
except Exception:
    _OFFLINE_TTL = 8.0
if _OFFLINE_TTL < 0:
    _OFFLINE_TTL = 0.0
try:
    _MAX_STORE_BYTES = int(os.environ.get("MJR_CUSTOM_ROOTS_MAX_BYTES", str(_DEFAULT_MAX_STORE_BYTES)))
except Exception:
    _MAX_STORE_BYTES = _DEFAULT_MAX_STORE_BYTES
_MAX_STORE_BYTES = max(1024, int(_MAX_STORE_BYTES or _DEFAULT_MAX_STORE_BYTES))


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _effective_user_id(user_id: str | None = None) -> str:
    uid = str(user_id or "").strip()
    if uid:
        return uid
    try:
        from mjr_am_backend.routes.core.security import _current_user_id

        return str(_current_user_id() or "").strip()
    except Exception:
        return ""


def _safe_user_store_segment(user_id: str | None) -> str:
    raw = _effective_user_id(user_id)
    if not raw:
        return ""
    cleaned = _USER_SEGMENT_RE.sub("_", raw).strip("._-")
    if not cleaned:
        cleaned = hashlib.sha256(raw.encode("utf-8", errors="ignore")).hexdigest()[:24]
    if len(cleaned) > 80:
        digest = hashlib.sha256(raw.encode("utf-8", errors="ignore")).hexdigest()[:16]
        cleaned = f"{cleaned[:48]}_{digest}"
    return cleaned


def _store_path_for_user(user_id: str | None = None) -> Path:
    segment = _safe_user_store_segment(user_id)
    if not segment:
        return _STORE_PATH
    return _USER_STORES_DIR / segment / _STORE_PATH.name

def _is_symlink_like(path: Path) -> bool:
    """
    Best-effort detection for symlinks/junctions/reparse points.

    On Windows we also accept other reparse-point flavours (mount points,
    OneDrive placeholders, Dev Drive virtualisation) since any of those can
    redirect access outside the user-declared root.  See FILE_ATTRIBUTE_*
    constants in winnt.h:

      FILE_ATTRIBUTE_REPARSE_POINT          = 0x00000400
      FILE_ATTRIBUTE_OFFLINE                = 0x00001000
      FILE_ATTRIBUTE_RECALL_ON_OPEN         = 0x00040000
      FILE_ATTRIBUTE_RECALL_ON_DATA_ACCESS  = 0x00400000
    """
    try:
        if path.is_symlink():
            return True
    except Exception:
        pass
    try:
        st = path.lstat()
        # Windows: reparse points cover symlinks/junctions + cloud placeholders.
        if sys.platform == "win32" and hasattr(st, "st_file_attributes"):
            attrs = int(getattr(st, "st_file_attributes", 0))
            mask = 0x400 | 0x1000 | 0x40000 | 0x400000
            if attrs & mask:
                return True
    except Exception:
        pass
    # Detect symlink/junction traversal in parent segments.
    # If canonical real path differs from normalized absolute path,
    # a link-like indirection is involved.
    try:
        abs_norm = os.path.normcase(os.path.normpath(os.path.abspath(str(path))))
        real_norm = os.path.normcase(os.path.normpath(os.path.realpath(str(path))))
        if abs_norm and real_norm and abs_norm != real_norm:
            return True
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


def _normalize_dir_path(path: str) -> Path | None:
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


def _read_store(*, user_id: str | None = None) -> dict[str, Any]:
    store_path = _store_path_for_user(user_id)
    if not store_path.exists():
        return {"version": 1, "roots": []}
    try:
        try:
            if store_path.stat().st_size > _MAX_STORE_BYTES:
                logger.warning("Custom roots store too large, ignoring: %s", store_path)
                return {"version": 1, "roots": []}
        except Exception:
            pass
        raw = store_path.read_text(encoding="utf-8")
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


def _write_store(data: dict, *, user_id: str | None = None) -> Result[bool]:
    store_path = _store_path_for_user(user_id)
    try:
        store_path.parent.mkdir(parents=True, exist_ok=True)
        # Atomic write to prevent corruption on crash/interruption.
        payload = json.dumps(data, ensure_ascii=False, indent=2)
        tmp = store_path.with_name(store_path.name + f".tmp_{uuid4().hex}")
        tmp.write_text(payload, encoding="utf-8")
        tmp.replace(store_path)
        return Result.Ok(True)
    except Exception as exc:
        logger.warning("Failed to persist custom roots store: %s", exc)
        return Result.Err("STORE_WRITE_FAILED", "Failed to persist custom roots")


def list_custom_roots(*, user_id: str | None = None) -> Result[list[dict[str, Any]]]:
    """List configured custom root directories (id/path/label/created_at)."""
    with _LOCK:
        store = _read_store(user_id=user_id)
        roots = store.get("roots") or []
        cleaned: list[dict[str, Any]] = []
        for r in roots:
            normalized_row = _normalize_custom_root_row(r)
            if normalized_row is not None:
                cleaned.append(normalized_row)
        return Result.Ok(cleaned)


def _normalize_custom_root_row(row: Any) -> dict[str, Any] | None:
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


def _normalized_root_payload(row: dict[str, Any], *, rid: str, normalized: Path) -> dict[str, Any]:
    exists, is_dir = _path_exists_and_is_dir(normalized)
    offline = not (exists and is_dir)
    return {
        "id": rid,
        "path": str(normalized),
        "label": str(row.get("label") or "").strip() or normalized.name or str(normalized),
        "created_at": row.get("created_at"),
        "offline": bool(offline),
    }


def _path_exists_and_is_dir(path: Path) -> tuple[bool, bool]:
    """
    Existence/dir check with a small TTL cache.

    `list_custom_roots` is called from /list (every grid render) and the
    underlying `Path.exists()` / `is_dir()` syscalls hit the disk for every
    custom root.  When a root points to a slow / disconnected drive (network
    mount, removed USB key) each stat can take several seconds and blocks the
    whole listing.  Cache positive *and* negative results for a few seconds
    so the panel stays responsive — staleness is bounded by `_OFFLINE_TTL`.
    """
    now = time.monotonic()
    key = os.path.normcase(os.path.normpath(str(path)))
    with _OFFLINE_LOCK:
        cached = _OFFLINE_CACHE.get(key)
        if cached and (now - cached[2]) < _OFFLINE_TTL:
            return cached[0], cached[1]
    try:
        exists = path.exists()
        is_dir = path.is_dir() if exists else False
    except Exception:
        exists, is_dir = False, False
    with _OFFLINE_LOCK:
        # Trim cache if it grows beyond a sensible bound — custom roots are
        # typically <50 per user, so 512 leaves headroom for edge cases.
        if len(_OFFLINE_CACHE) > 512:
            _OFFLINE_CACHE.clear()
        _OFFLINE_CACHE[key] = (exists, is_dir, now)
    return exists, is_dir


def invalidate_offline_cache(path: str | Path | None = None) -> None:
    """
    Drop a single entry (or all entries) from the offline cache.  Called by
    the add/remove handlers so freshly-added roots don't pick up a stale
    "missing" entry from a previous probe.
    """
    with _OFFLINE_LOCK:
        if path is None:
            _OFFLINE_CACHE.clear()
            return
        key = os.path.normcase(os.path.normpath(str(path)))
        _OFFLINE_CACHE.pop(key, None)


def add_custom_root(path: str, label: str | None = None, *, user_id: str | None = None) -> Result[dict[str, Any]]:
    """Add a custom root directory, or return the existing one if present."""
    normalized = _normalize_dir_path(path)
    validation = _validate_new_root_path(normalized)
    if validation is not None:
        return validation
    if normalized is None:
        return Result.Err("INVALID_INPUT", "Invalid path")

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
        store = _read_store(user_id=user_id)
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
        write_result = _write_store(store, user_id=user_id)
        if not write_result.ok:
            return write_result  # type: ignore[return-value]

    invalidate_offline_cache(resolved)
    return Result.Ok(_root_row(root_id, resolved, safe_label, created_at))


def _validate_new_root_path(normalized: Path | None) -> Result[dict[str, Any]] | None:
    if not normalized:
        return Result.Err("INVALID_INPUT", "Invalid path")
    if not normalized.exists():
        return Result.Err("DIR_NOT_FOUND", f"Directory not found: {normalized}")
    if not normalized.is_dir():
        return Result.Err("NOT_A_DIRECTORY", f"Not a directory: {normalized}")
    return None


def _new_root_payload(normalized: Path, *, label: str | None) -> dict[str, str]:
    resolved = str(normalized)
    return {
        "resolved": resolved,
        "normalized_key": _canonical_path_key(resolved),
        "root_id": str(uuid4()),
        "created_at": _utc_now_iso(),
        "safe_label": (label or "").strip() or normalized.name or resolved,
    }


def _root_row(root_id: str, resolved: str, safe_label: str, created_at: str) -> dict[str, Any]:
    return {"id": root_id, "path": resolved, "label": safe_label, "created_at": created_at}


def _resolve_builtin_roots() -> tuple[Path | None, Path | None]:
    output_root: Path | None = None
    input_root: Path | None = None
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
    output_root: Path | None,
    input_root: Path | None,
) -> Result[dict[str, Any]] | None:
    if output_root and (_path_is_relative_to(normalized, output_root) or _path_is_relative_to(output_root, normalized)):
        return Result.Err("OVERLAP", f"Root overlaps with output: {output_root}")
    if input_root and (_path_is_relative_to(normalized, input_root) or _path_is_relative_to(input_root, normalized)):
        return Result.Err("OVERLAP", f"Root overlaps with input: {input_root}")
    return None


def _find_existing_or_overlap_root(
    *,
    roots: list[Any],
    normalized: Path,
    normalized_key: str,
    fallback_id: str,
    resolved: str,
    safe_label: str,
    created_at: str,
) -> Result[dict[str, Any]] | None:
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


def _existing_root_overlap(normalized: Path, existing_path: Any) -> Path | None:
    if not existing_path:
        return None
    try:
        existing_resolved = Path(str(existing_path)).expanduser().resolve(strict=False)
        if _path_is_relative_to(normalized, existing_resolved) or _path_is_relative_to(existing_resolved, normalized):
            return existing_resolved
    except Exception:
        return None
    return None


def remove_custom_root(root_id: str, *, user_id: str | None = None) -> Result[bool]:
    """Remove a custom root by id."""
    rid = str(root_id or "").strip()
    if not rid:
        return Result.Err("INVALID_INPUT", "Missing root_id")

    removed_path: str | None = None
    with _LOCK:
        store = _read_store(user_id=user_id)
        roots = store.get("roots") or []
        kept = []
        for r in roots:
            if isinstance(r, dict) and str(r.get("id") or "") == rid:
                removed_path = str(r.get("path") or "")
                continue
            kept.append(r)
        if len(kept) == len(roots):
            return Result.Err("NOT_FOUND", f"Custom root not found: {rid}")
        store["roots"] = kept
        write_result = _write_store(store, user_id=user_id)
        if not write_result.ok:
            return write_result

    if removed_path:
        invalidate_offline_cache(removed_path)
    return Result.Ok(True)


def resolve_custom_root(root_id: str, *, user_id: str | None = None) -> Result[Path]:
    """Resolve a custom root id to a validated directory path."""
    rid = str(root_id or "").strip()
    if not rid:
        logger.info("resolve_custom_root: missing root_id (user=%r)", user_id)
        return Result.Err("INVALID_INPUT", "Missing root_id")

    roots_result = list_custom_roots(user_id=user_id)
    if not roots_result.ok:
        logger.warning(
            "resolve_custom_root: list failed for rid=%s user=%r code=%s err=%s",
            rid, user_id, roots_result.code, roots_result.error,
        )
        return Result.Err(roots_result.code, roots_result.error or "Failed to list custom roots")
    root_row = _find_custom_root_row_by_id(roots_result.data or [], rid)
    if root_row is not None:
        resolved = _resolve_custom_root_path_from_row(root_row)
        if not resolved.ok:
            # Surfacing the failure (offline / invalid) at warn level lets
            # operators correlate "viewer 404" reports with the actual root
            # state without enabling debug logging.
            logger.warning(
                "resolve_custom_root: rid=%s user=%r code=%s err=%s path=%r",
                rid, user_id, resolved.code, resolved.error, root_row.get("path"),
            )
        return resolved
    logger.info("resolve_custom_root: rid=%s not found (user=%r)", rid, user_id)
    return Result.Err("NOT_FOUND", f"Custom root not found: {rid}")


def _find_custom_root_row_by_id(rows: list[dict[str, Any]], rid: str) -> dict[str, Any] | None:
    for row in rows:
        if str(row.get("id") or "") == rid:
            return row
    return None


def _resolve_custom_root_path_from_row(row: dict[str, Any]) -> Result[Path]:
    normalized = _normalize_dir_path(str(row.get("path") or ""))
    if not normalized:
        return Result.Err("INVALID_INPUT", "Invalid stored path")
    try:
        if not normalized.exists() or not normalized.is_dir():
            return Result.Err("OFFLINE", f"Custom root is offline: {normalized}")
    except Exception:
        return Result.Err("OFFLINE", f"Custom root is offline: {normalized}")
    return Result.Ok(normalized)
