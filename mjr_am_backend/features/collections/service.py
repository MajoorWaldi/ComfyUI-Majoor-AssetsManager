"""
Collections service - persistent user-curated sets of assets.

Collections are stored as JSON files under `config.COLLECTIONS_DIR`.
"""

from __future__ import annotations

import json
import os
import re
import threading
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from uuid import uuid4

from ...config import COLLECTIONS_DIR_PATH
from ...shared import Result, ErrorCode, get_logger, classify_file

logger = get_logger(__name__)

MIN_COLLECTION_ID_LEN = 6
MAX_COLLECTION_ID_LEN = 80
MAX_COLLECTION_NAME_LEN = 80

DEFAULT_MAX_COLLECTION_ITEMS = 50_000
MIN_COLLECTION_ITEMS = 100
HARD_MAX_COLLECTION_ITEMS = 500_000

_ID_RE = re.compile(rf"^[a-zA-Z0-9_-]{{{MIN_COLLECTION_ID_LEN},{MAX_COLLECTION_ID_LEN}}}$")
_DEFAULT_MAX_ITEMS = DEFAULT_MAX_COLLECTION_ITEMS
try:
    _MAX_COLLECTION_ITEMS = int(os.environ.get("MJR_COLLECTION_MAX_ITEMS", str(_DEFAULT_MAX_ITEMS)))
except Exception:
    _MAX_COLLECTION_ITEMS = _DEFAULT_MAX_ITEMS
_MAX_COLLECTION_ITEMS = max(MIN_COLLECTION_ITEMS, min(HARD_MAX_COLLECTION_ITEMS, int(_MAX_COLLECTION_ITEMS or _DEFAULT_MAX_ITEMS)))


def _now_iso() -> str:
    try:
        return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    except Exception:
        return ""


def _normalize_fp(fp: str) -> str:
    try:
        p = Path(fp)
        # Prefer strict resolution when the path exists (resolves symlinks/junctions).
        try:
            if p.exists():
                p = p.resolve(strict=True)
            else:
                p = p.resolve(strict=False)
        except Exception:
            p = p.resolve(strict=False)
        normalized = str(p)
        # Windows filesystems are case-insensitive by default; preserve case on POSIX.
        if os.name == "nt":
            return os.path.normcase(normalized)
        return normalized
    except Exception:
        fallback = str(fp or "").strip()
        if os.name == "nt":
            return os.path.normcase(fallback)
        return fallback


def _safe_id(value: str) -> Optional[str]:
    s = str(value or "").strip()
    if not s:
        return None
    if not _ID_RE.match(s):
        return None
    return s


def _safe_name(value: str) -> Optional[str]:
    s = str(value or "").strip()
    if not s:
        return None
    if len(s) > MAX_COLLECTION_NAME_LEN:
        s = s[:MAX_COLLECTION_NAME_LEN].strip()
    return s or None


def _collection_path(collection_id: str) -> Optional[Path]:
    cid = _safe_id(collection_id)
    if not cid:
        return None
    try:
        base = COLLECTIONS_DIR_PATH.resolve(strict=False)
        p = (base / f"{cid}.json").resolve(strict=False)
        if p.parent != base:
            return None
        return p
    except Exception:
        return None


@dataclass(frozen=True)
class CollectionSummary:
    """Lightweight summary row for collection listings."""
    id: str
    name: str
    count: int
    updated_at: str


def _read_collection_summary_row(path: Path) -> Optional[CollectionSummary]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None
    if not isinstance(data, dict):
        return None
    cid = str(data.get("id") or path.stem)
    if not _safe_id(cid):
        return None
    name = str(data.get("name") or "").strip() or cid
    count = int(len(data.get("items") or []))
    updated_at = str(data.get("updated_at") or "")
    return CollectionSummary(cid, name, count, updated_at)


class CollectionsService:
    """Filesystem-backed collections service (JSON files under `COLLECTIONS_DIR`)."""

    def __init__(self, base_dir: Optional[str | Path] = None):
        self._base = Path(base_dir) if base_dir is not None else Path(COLLECTIONS_DIR_PATH)
        self._lock = threading.Lock()
        try:
            self._base.mkdir(parents=True, exist_ok=True)
        except Exception:
            pass

    def list(self) -> Result[List[Dict[str, Any]]]:
        """List collections with basic metadata and item counts."""
        base_res = self._resolve_collections_base_dir()
        if not base_res.ok:
            return Result.Err(base_res.code or ErrorCode.DB_ERROR, base_res.error or "Collections dir unavailable")
        base = base_res.data
        if not isinstance(base, Path):
            return Result.Err(ErrorCode.DB_ERROR, "Collections dir unavailable")

        items: List[CollectionSummary] = []
        with self._lock:
            try:
                for p in base.glob("*.json"):
                    summary = _read_collection_summary_row(p)
                    if summary is not None:
                        items.append(summary)
            except Exception as exc:
                return Result.Err(ErrorCode.DB_ERROR, f"Failed to list collections: {exc}")

        # Sort newest-ish first (fallback to id)
        items.sort(key=lambda x: (x.updated_at or "", x.id), reverse=True)
        return Result.Ok([i.__dict__ for i in items])

    def _resolve_collections_base_dir(self) -> Result[Path]:
        try:
            return Result.Ok(self._base.resolve(strict=False))
        except Exception as exc:
            return Result.Err(ErrorCode.DB_ERROR, f"Collections dir unavailable: {exc}")

    def create(self, name: str) -> Result[Dict[str, Any]]:
        """Create a new empty collection."""
        cname = _safe_name(name)
        if not cname:
            return Result.Err(ErrorCode.INVALID_INPUT, "Missing collection name")

        cid = uuid4().hex[:12]
        path = _collection_path(cid)
        if not path:
            return Result.Err(ErrorCode.DB_ERROR, "Failed to allocate collection id")

        payload: Dict[str, Any] = {
            "id": cid,
            "name": cname,
            "created_at": _now_iso(),
            "updated_at": _now_iso(),
            "items": [],
        }

        with self._lock:
            try:
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
            except Exception as exc:
                return Result.Err(ErrorCode.DB_ERROR, f"Failed to create collection: {exc}")

        return Result.Ok({"id": cid, "name": cname})

    def get(self, collection_id: str) -> Result[Dict[str, Any]]:
        """Get a collection by id (including items)."""
        path = _collection_path(collection_id)
        if not path:
            return Result.Err(ErrorCode.INVALID_INPUT, "Invalid collection id")
        loaded = self._load_collection_data(path)
        if not loaded.ok:
            return loaded
        return self._build_collection_get_result(loaded.data or {}, collection_id)

    @staticmethod
    def _load_collection_data(path: Path) -> Result[Dict[str, Any]]:
        try:
            return Result.Ok(json.loads(path.read_text(encoding="utf-8")))
        except FileNotFoundError:
            return Result.Err(ErrorCode.NOT_FOUND, "Collection not found")
        except Exception as exc:
            return Result.Err(ErrorCode.PARSE_ERROR, f"Failed to read collection: {exc}")

    @staticmethod
    def _build_collection_get_result(data: Dict[str, Any], collection_id: str) -> Result[Dict[str, Any]]:
        cid = str(data.get("id") or collection_id)
        if not _safe_id(cid):
            return Result.Err(ErrorCode.PARSE_ERROR, "Collection file is corrupted (bad id)")
        return Result.Ok(
            {
                "id": cid,
                "name": str(data.get("name") or "").strip() or cid,
                "created_at": data.get("created_at") or "",
                "updated_at": data.get("updated_at") or "",
                "items": data.get("items") if isinstance(data.get("items"), list) else [],
            }
        )

    def delete(self, collection_id: str) -> Result[bool]:
        """Delete a collection file by id."""
        path = _collection_path(collection_id)
        if not path:
            return Result.Err(ErrorCode.INVALID_INPUT, "Invalid collection id")
        with self._lock:
            try:
                path.unlink(missing_ok=True)  # py3.8+; safe on 3.11+
            except TypeError:
                try:
                    if path.exists():
                        path.unlink()
                except Exception as exc:
                    return Result.Err(ErrorCode.DB_ERROR, f"Failed to delete collection: {exc}")
            except Exception as exc:
                return Result.Err(ErrorCode.DB_ERROR, f"Failed to delete collection: {exc}")
        return Result.Ok(True)

    def _load_for_update(self, collection_id: str) -> Tuple[Optional[Path], Optional[Dict[str, Any]], Optional[Result[Any]]]:
        path = _collection_path(collection_id)
        if not path:
            return None, None, Result.Err(ErrorCode.INVALID_INPUT, "Invalid collection id")
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except FileNotFoundError:
            return path, None, Result.Err(ErrorCode.NOT_FOUND, "Collection not found")
        except Exception as exc:
            return path, None, Result.Err(ErrorCode.PARSE_ERROR, f"Failed to read collection: {exc}")
        if not isinstance(data, dict):
            return path, None, Result.Err(ErrorCode.PARSE_ERROR, "Invalid collection format")
        if not _safe_id(str(data.get("id") or collection_id)):
            return path, None, Result.Err(ErrorCode.PARSE_ERROR, "Collection file is corrupted (bad id)")
        if not isinstance(data.get("items"), list):
            data["items"] = []
        return path, data, None

    @staticmethod
    def _normalize_add_asset_item(asset: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if not isinstance(asset, dict):
            return None
        fp = str(asset.get("filepath") or "").strip()
        if not fp:
            return None
        root_id = CollectionsService._normalize_asset_root_id(asset)
        kind = CollectionsService._normalize_asset_kind(asset, fp)
        return {
            "filepath": fp,
            "filename": str(asset.get("filename") or "").strip(),
            "subfolder": str(asset.get("subfolder") or "").strip(),
            "type": str(asset.get("type") or "output").strip().lower(),
            "root_id": root_id,
            "kind": kind,
            "added_at": _now_iso(),
        }

    @staticmethod
    def _normalize_asset_root_id(asset: Dict[str, Any]) -> Optional[str]:
        root_id = str(
            asset.get("root_id")
            or asset.get("rootId")
            or asset.get("custom_root_id")
            or ""
        ).strip()
        return root_id or None

    @staticmethod
    def _normalize_asset_kind(asset: Dict[str, Any], filepath: str) -> str:
        return str(asset.get("kind") or classify_file(filepath) or "unknown").strip().lower()

    def _clean_add_assets_input(self, assets: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        cleaned: List[Dict[str, Any]] = []
        for asset in assets:
            item = self._normalize_add_asset_item(asset)
            if item is None:
                continue
            cleaned.append(item)
        return cleaned

    @staticmethod
    def _existing_items_with_indexes(raw_items: Any) -> Tuple[List[Dict[str, Any]], set[str], set[str]]:
        existing: List[Dict[str, Any]] = (
            [it for it in raw_items if isinstance(it, dict)] if isinstance(raw_items, list) else []
        )
        seen: set[str] = set()
        existing_seen: set[str] = set()
        for item in existing:
            existing_fp = item.get("filepath")
            if not existing_fp:
                continue
            key = _normalize_fp(str(existing_fp))
            seen.add(key)
            existing_seen.add(key)
        return existing, seen, existing_seen

    def _append_collection_items(
        self,
        existing: List[Dict[str, Any]],
        cleaned: List[Dict[str, Any]],
        seen: set[str],
        existing_seen: set[str],
    ) -> Dict[str, int]:
        added = 0
        skipped_existing = 0
        skipped_duplicate = 0
        skipped_limit = 0
        for item in cleaned:
            if len(existing) >= _MAX_COLLECTION_ITEMS:
                skipped_limit += 1
                continue
            key = _normalize_fp(item["filepath"])
            if key in seen:
                if key in existing_seen:
                    skipped_existing += 1
                else:
                    skipped_duplicate += 1
                continue
            existing.append(item)
            seen.add(key)
            added += 1
        return {
            "added": int(added),
            "skipped_existing": int(skipped_existing),
            "skipped_duplicate": int(skipped_duplicate),
            "skipped_limit": int(skipped_limit),
        }

    @staticmethod
    def _write_collection_payload(path: Path, data: Dict[str, Any]) -> Optional[Result[Any]]:
        try:
            path.write_text(
                json.dumps(data, ensure_ascii=False, separators=(",", ":")),
                encoding="utf-8",
            )
        except Exception as exc:
            return Result.Err(ErrorCode.DB_ERROR, f"Failed to update collection: {exc}")
        return None

    def add_assets(self, collection_id: str, assets: List[Dict[str, Any]]) -> Result[Dict[str, Any]]:
        """Add assets (by filepath) to a collection (deduplicated, bounded)."""
        if not isinstance(assets, list) or not assets:
            return Result.Err(ErrorCode.INVALID_INPUT, "No assets provided")

        cleaned = self._clean_add_assets_input(assets)
        if not cleaned:
            return Result.Err(ErrorCode.INVALID_INPUT, "No valid assets provided")

        with self._lock:
            path, data, err = self._load_for_update(collection_id)
            if err:
                return err
            assert path is not None and data is not None

            existing, seen, existing_seen = self._existing_items_with_indexes(data.get("items"))
            counts = self._append_collection_items(existing, cleaned, seen, existing_seen)

            data["items"] = existing
            data["updated_at"] = _now_iso()

            write_err = self._write_collection_payload(path, data)
            if write_err:
                return write_err

        return Result.Ok(
            {
                "id": str(data.get("id") or collection_id),
                "added": counts["added"],
                "skipped_existing": counts["skipped_existing"],
                "skipped_duplicate": counts["skipped_duplicate"],
                "skipped_limit": counts["skipped_limit"],
                "max_items": int(_MAX_COLLECTION_ITEMS),
                "count": len(existing),
            }
        )

    def remove_filepaths(self, collection_id: str, filepaths: List[str]) -> Result[Dict[str, Any]]:
        """Remove items from a collection by filepath."""
        targets_res = self._remove_targets(filepaths)
        if not targets_res.ok:
            return Result.Err(targets_res.code or ErrorCode.INVALID_INPUT, targets_res.error or "No valid filepaths provided")
        targets = targets_res.data or set()

        with self._lock:
            path, data, err = self._load_for_update(collection_id)
            if err:
                return err
            assert path is not None and data is not None

            existing = self._collection_items_as_dicts(data.get("items"))
            kept, removed = self._partition_removed_items(existing, targets)
            data["items"] = kept
            data["updated_at"] = _now_iso()
            write_err = self._write_collection_payload(path, data)
            if write_err:
                return write_err

        return Result.Ok({"id": str(data.get("id") or collection_id), "removed": int(removed), "count": len(kept)})

    @staticmethod
    def _remove_targets(filepaths: List[str]) -> Result[set[str]]:
        if not isinstance(filepaths, list) or not filepaths:
            return Result.Err(ErrorCode.INVALID_INPUT, "No filepaths provided")
        targets = set(_normalize_fp(str(p)) for p in filepaths if str(p or "").strip())
        if not targets:
            return Result.Err(ErrorCode.INVALID_INPUT, "No valid filepaths provided")
        return Result.Ok(targets)

    @staticmethod
    def _collection_items_as_dicts(raw_items: Any) -> List[Dict[str, Any]]:
        return [it for it in raw_items if isinstance(it, dict)] if isinstance(raw_items, list) else []

    @staticmethod
    def _partition_removed_items(existing: List[Dict[str, Any]], targets: set[str]) -> Tuple[List[Any], int]:
        kept: List[Any] = []
        removed = 0
        for item in existing:
            fp = item.get("filepath")
            if fp and _normalize_fp(str(fp)) in targets:
                removed += 1
                continue
            kept.append(item)
        return kept, removed
