"""
Entry builder — pure functions that construct and inspect index entry dicts.

All functions are stateless and have no side effects.
Each dict returned has an "action" key: "added" | "updated" | "refresh".
"""
import os
from pathlib import Path
from typing import Any, cast

from ...shared import FileKind, Result, classify_file, get_logger

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# Path helper
# ---------------------------------------------------------------------------

def safe_relative_path(file_path: Path, base_dir: str) -> Path:
    try:
        return file_path.relative_to(base_dir)
    except Exception:
        try:
            rel = os.path.relpath(str(file_path), base_dir)
            return Path(rel)
        except Exception:
            logger.warning(
                "Could not compute relative path for %s from %s; using absolute path",
                str(file_path),
                str(base_dir),
            )
            return file_path


# ---------------------------------------------------------------------------
# Entry dict constructors
# ---------------------------------------------------------------------------

def build_refresh_entry(
    *,
    asset_id: int,
    metadata_result: Result[dict[str, Any]],
    filepath: str,
    file_path: Path,
    state_hash: str,
    mtime: int,
    size: int,
    fast: bool,
    cache_store: bool,
) -> dict[str, Any]:
    return {
        "action": "refresh",
        "asset_id": asset_id,
        "metadata_result": metadata_result,
        "filepath": filepath,
        "file_path": file_path,
        "state_hash": state_hash,
        "mtime": mtime,
        "size": size,
        "fast": fast,
        "cache_store": cache_store,
    }


def build_updated_entry(
    *,
    asset_id: int,
    metadata_result: Result[dict[str, Any]],
    filepath: str,
    file_path: Path,
    state_hash: str,
    mtime: int,
    size: int,
    fast: bool,
    cache_store: bool,
    mtime_ns: int | None = None,
) -> dict[str, Any]:
    entry: dict[str, Any] = {
        "action": "updated",
        "asset_id": asset_id,
        "metadata_result": metadata_result,
        "filepath": filepath,
        "file_path": file_path,
        "state_hash": state_hash,
        "mtime": mtime,
        "size": size,
        "fast": fast,
        "cache_store": cache_store,
    }
    if mtime_ns is not None:
        entry["mtime_ns"] = int(mtime_ns)
    return entry


def build_added_entry(
    *,
    filename: str,
    subfolder: str,
    filepath: str,
    kind: FileKind,
    metadata_result: Result[dict[str, Any]],
    file_path: Path,
    state_hash: str,
    mtime: int,
    size: int,
    fast: bool,
    cache_store: bool,
    mtime_ns: int | None = None,
) -> dict[str, Any]:
    entry: dict[str, Any] = {
        "action": "added",
        "filename": filename,
        "subfolder": subfolder,
        "filepath": filepath,
        "kind": kind,
        "metadata_result": metadata_result,
        "file_path": file_path,
        "state_hash": state_hash,
        "mtime": mtime,
        "size": size,
        "fast": fast,
        "cache_store": cache_store,
    }
    if mtime_ns is not None:
        entry["mtime_ns"] = int(mtime_ns)
    return entry


def build_cached_refresh_entry(
    *,
    existing_id: int,
    cached_raw: Any,
    filepath: str,
    file_path: Path,
    state_hash: str,
    mtime: int,
    size: int,
    fast: bool,
) -> dict[str, Any]:
    return build_refresh_entry(
        asset_id=existing_id,
        metadata_result=Result.Ok({"metadata_raw": cached_raw}, source="cache"),
        filepath=filepath,
        file_path=file_path,
        state_hash=state_hash,
        mtime=mtime,
        size=size,
        fast=fast,
        cache_store=False,
    )


def build_fast_batch_entry(
    *,
    existing_id: int,
    file_path: Path,
    base_dir: str,
    filepath: str,
    mtime_ns: int,
    mtime: int,
    size: int,
    state_hash: str,
) -> dict[str, Any]:
    if existing_id:
        return build_updated_entry(
            asset_id=existing_id,
            metadata_result=Result.Ok({}),
            filepath=filepath,
            file_path=file_path,
            state_hash=state_hash,
            mtime=mtime,
            size=size,
            fast=True,
            cache_store=False,
            mtime_ns=mtime_ns,
        )

    rel_path = safe_relative_path(file_path, base_dir)
    return build_added_entry(
        filename=file_path.name,
        subfolder=str(rel_path.parent) if rel_path.parent != Path(".") else "",
        filepath=filepath,
        kind=classify_file(file_path.name),
        metadata_result=Result.Ok({}),
        file_path=file_path,
        state_hash=state_hash,
        mtime=mtime,
        size=size,
        fast=True,
        cache_store=False,
        mtime_ns=mtime_ns,
    )


def build_added_entry_from_prepare_ctx(
    prepare_ctx: dict[str, Any],
    file_path: Path,
    base_dir: str,
    metadata_result: Result[dict[str, Any]],
    cache_store: bool,
    fast: bool,
) -> dict[str, Any]:
    rel_path = safe_relative_path(file_path, base_dir)
    filename = file_path.name
    subfolder = str(rel_path.parent) if rel_path.parent != Path(".") else ""
    kind = classify_file(filename)
    return build_added_entry(
        filename=filename,
        subfolder=subfolder,
        filepath=prepare_ctx["filepath"],
        kind=kind,
        metadata_result=metadata_result,
        file_path=file_path,
        state_hash=prepare_ctx["state_hash"],
        mtime=prepare_ctx["mtime"],
        size=prepare_ctx["size"],
        fast=fast,
        cache_store=cache_store,
    )


# ---------------------------------------------------------------------------
# Entry inspectors / context extractors
# ---------------------------------------------------------------------------

def batch_stat_to_values(stat_obj: os.stat_result) -> tuple[int, int, int]:
    return int(stat_obj.st_mtime_ns), int(stat_obj.st_mtime), int(stat_obj.st_size)


def extract_existing_asset_state(existing_asset: dict[str, Any] | None) -> tuple[int, int]:
    if not isinstance(existing_asset, dict):
        return 0, 0
    try:
        existing_id = int(existing_asset.get("id") or 0)
        existing_mtime = int(existing_asset.get("mtime") or 0)
    except Exception:
        return 0, 0
    return existing_id, existing_mtime


def asset_dimensions_from_metadata(metadata_result: Result[dict[str, Any]]) -> tuple[Any, Any, Any]:
    if metadata_result.ok and metadata_result.data:
        meta = metadata_result.data
        return meta.get("width"), meta.get("height"), meta.get("duration")
    return None, None, None


def asset_ids_from_existing_rows(filepaths: list[str], existing_map: dict[str, dict[str, Any]]) -> list[int]:
    asset_ids: list[int] = []
    for fp in filepaths:
        existing_row = existing_map.get(fp)
        if not existing_row or not existing_row.get("id"):
            continue
        try:
            existing_id = int(existing_row.get("id") or 0)
        except (TypeError, ValueError):
            continue
        if existing_id:
            asset_ids.append(existing_id)
    return asset_ids


def added_asset_id_from_result(add_result: Result[dict[str, Any]]) -> int | None:
    try:
        if add_result.data and add_result.data.get("asset_id"):
            return int(add_result.data["asset_id"])
    except Exception:
        return None
    return None


def entry_display_path(entry: dict[str, Any]) -> str:
    return str(entry.get("filepath") or entry.get("file_path") or "unknown")


def refresh_entry_context(entry: dict[str, Any], base_dir: str) -> tuple[str, str, str, int, int]:
    return (
        str(entry.get("filepath") or ""),
        base_dir,
        str(entry.get("state_hash") or ""),
        int(entry.get("mtime") or 0),
        int(entry.get("size") or 0),
    )


def extract_update_entry_context(entry: dict[str, Any]) -> dict[str, Any] | None:
    asset_id = entry.get("asset_id")
    metadata_result = entry.get("metadata_result")
    file_path_value = entry.get("file_path")
    if not asset_id or not isinstance(metadata_result, Result) or not isinstance(file_path_value, Path):
        return None
    return {
        "asset_id": int(asset_id),
        "metadata_result": metadata_result,
        "file_path": file_path_value,
    }


def extract_add_entry_context(entry: dict[str, Any]) -> dict[str, Any] | None:
    metadata_result = entry.get("metadata_result")
    kind_value = entry.get("kind")
    file_path_value = entry.get("file_path")
    if (
        not isinstance(metadata_result, Result)
        or not isinstance(kind_value, str)
        or not isinstance(file_path_value, Path)
    ):
        return None
    return {
        "metadata_result": metadata_result,
        "kind": cast(FileKind, kind_value),
        "file_path": file_path_value,
    }


# ---------------------------------------------------------------------------
# Result / stats helpers
# ---------------------------------------------------------------------------

def invalid_refresh_entry(
    asset_id: Any,
    metadata_result: Any,
    stats: dict[str, Any],
    fallback_mode: bool,
) -> bool | None:
    if asset_id and isinstance(metadata_result, Result):
        return None
    if fallback_mode:
        return False
    stats["skipped"] += 1
    return True


def fallback_correct_error(stats: dict[str, Any]) -> None:
    stats["errors"] = max(0, int(stats.get("errors") or 0) - 1)


def handle_invalid_prepared_entry(stats: dict[str, Any], fallback_mode: bool) -> bool:
    if fallback_mode:
        return False
    stats["errors"] += 1
    return True


def handle_update_or_add_failure(stats: dict[str, Any], fallback_mode: bool) -> bool:
    if fallback_mode:
        return False
    stats["errors"] += 1
    return True
