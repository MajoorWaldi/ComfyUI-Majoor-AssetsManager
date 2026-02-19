"""
Filesystem browser helpers for hybrid folder/file listing.
"""

from __future__ import annotations

import os
import stat
from pathlib import Path
from typing import Any

from mjr_am_backend.shared import Result, classify_file
from mjr_am_backend.routes.core import _is_within_root, _safe_rel_path


def _is_hidden_directory(entry: Path) -> bool:
    name = entry.name
    if name.startswith("."):
        return True
    try:
        if os.name == "nt":
            attrs = os.stat(str(entry)).st_file_attributes  # type: ignore[attr-defined]
            return bool(attrs & stat.FILE_ATTRIBUTE_HIDDEN)  # type: ignore[attr-defined]
    except Exception:
        return False
    return False


def _folder_sort_key(item: dict) -> tuple[str, str]:
    return (str(item.get("filename") or "").lower(), str(item.get("subfolder") or "").lower())


def list_visible_subfolders(root_dir: Path, subfolder: str, root_id: str) -> Result[list[dict]]:
    """
    List physical subfolders under `root_dir/subfolder` while enforcing root confinement.
    """
    resolved = _resolve_browser_target_dir(root_dir, subfolder)
    if not resolved.ok:
        return resolved
    base, target_resolved = resolved.data

    folders: list[dict] = []
    try:
        for entry in target_resolved.iterdir():
            row = _subfolder_row(entry, base, root_id)
            if row is not None:
                folders.append(row)
    except OSError as exc:
        return Result.Err("LIST_FAILED", f"Failed to list subfolders: {exc}")

    folders.sort(key=_folder_sort_key)
    return Result.Ok(folders)


def _resolve_browser_target_dir(root_dir: Path, subfolder: str) -> Result[tuple[Path, Path]]:
    try:
        base = root_dir.resolve()
    except OSError as exc:
        return Result.Err("INVALID_INPUT", f"Invalid root directory: {exc}")
    rel = _safe_rel_path(subfolder or "")
    if rel is None:
        return Result.Err("INVALID_INPUT", "Invalid subfolder")
    target_dir = base / rel
    try:
        target_resolved = target_dir.resolve(strict=True)
    except OSError:
        return Result.Err("DIR_NOT_FOUND", f"Directory not found: {target_dir}")
    if not _is_within_root(target_resolved, base):
        return Result.Err("INVALID_INPUT", "Subfolder outside root")
    return Result.Ok((base, target_resolved))


def _subfolder_row(entry: Path, base: Path, root_id: str) -> dict | None:
    try:
        if not entry.is_dir() or _is_hidden_directory(entry):
            return None
        resolved_child = entry.resolve(strict=True)
        if not _is_within_root(resolved_child, base):
            return None
        child_rel = str(resolved_child.relative_to(base)).replace("\\", "/")
        return {
            "id": f"folder::{root_id}::{child_rel}",
            "filename": entry.name,
            "subfolder": child_rel,
            "filepath": str(resolved_child),
            "kind": "folder",
            "type": "custom",
            "root_id": str(root_id or ""),
            "mtime": int(entry.stat().st_mtime),
            "size": None,
            "ext": "",
            "rating": 0,
            "tags": [],
            "has_workflow": None,
            "has_generation_data": None,
            "width": None,
            "height": None,
            "duration": None,
        }
    except Exception:
        return None


def _safe_name(path: Path) -> str:
    try:
        if path.name:
            return path.name
        return str(path)
    except Exception:
        return str(path)


def _normalize_browser_query_filters(
    query: str,
    kind_filter: str,
    min_size_bytes: int,
    max_size_bytes: int,
    min_width: int,
    min_height: int,
    max_width: int,
    max_height: int,
) -> dict[str, int | str | bool]:
    q = str(query or "*").strip()
    ql = q.lower()
    browse_all = q in ("", "*")
    filter_kind = str(kind_filter or "").strip().lower()
    min_size, max_size = _normalized_size_bounds(min_size_bytes, max_size_bytes)
    return {
        "q": q,
        "ql": ql,
        "browse_all": browse_all,
        "filter_kind": filter_kind,
        "min_size": min_size,
        "max_size": max_size,
        "min_w": _nonnegative_int(min_width),
        "min_h": _nonnegative_int(min_height),
        "max_w": _nonnegative_int(max_width),
        "max_h": _nonnegative_int(max_height),
    }


def _nonnegative_int(value: Any) -> int:
    try:
        return max(0, int(value or 0))
    except Exception:
        return 0


def _normalized_size_bounds(min_size_bytes: int, max_size_bytes: int) -> tuple[int, int]:
    min_size = _nonnegative_int(min_size_bytes)
    max_size = _nonnegative_int(max_size_bytes)
    if max_size > 0 and min_size > 0 and max_size < min_size:
        max_size = min_size
    return min_size, max_size


def _paginate_assets(assets: list[dict], limit: int, offset: int) -> list[dict]:
    start = max(0, int(offset or 0))
    end = start + int(limit or 0) if int(limit or 0) > 0 else None
    return assets[start:end] if end is not None else assets[start:]


def _build_browser_listing_payload(
    assets: list[dict],
    limit: int,
    offset: int,
    query: str,
    *,
    target: Path | None = None,
) -> dict:
    payload: dict = {
        "assets": assets,
        "total": len(assets),
        "limit": limit,
        "offset": offset,
        "query": query,
        "scope": "custom",
    }
    if isinstance(target, Path):
        payload["path"] = str(target)
        payload["current_path"] = str(target)
        payload["display_name"] = _safe_name(target)
    return payload


def _make_browser_folder_entry(name: str, entry: Path, resolved_child: Path) -> dict:
    return {
        "id": f"folder::fs::{resolved_child}",
        "filename": name,
        "subfolder": str(resolved_child),
        "filepath": str(resolved_child),
        "kind": "folder",
        "type": "custom",
        "root_id": "",
        "mtime": int(entry.stat().st_mtime),
        "size": None,
        "ext": "",
        "rating": 0,
        "tags": [],
        "has_workflow": None,
        "has_generation_data": None,
        "width": None,
        "height": None,
        "duration": None,
    }


def _make_browser_file_entry(target: Path, name: str, entry: Path, kind: str, size: int, mtime: int) -> dict:
    return {
        "id": None,
        "filename": name,
        "subfolder": str(target),
        "filepath": str(entry),
        "kind": kind,
        "ext": entry.suffix.lower(),
        "size": size,
        "mtime": mtime,
        "width": None,
        "height": None,
        "duration": None,
        "rating": 0,
        "tags": [],
        "has_workflow": None,
        "has_generation_data": None,
        "type": "custom",
        "root_id": "",
    }


def _filter_browser_roots(roots: list[dict], *, filter_kind: str, browse_all: bool, ql: str) -> list[dict]:
    if filter_kind:
        return []
    if browse_all:
        return roots
    return [f for f in roots if ql in str(f.get("filename") or "").lower()]


def _collect_browser_folders_and_files(
    target: Path,
    *,
    browse_all: bool,
    ql: str,
    filter_kind: str,
    min_size: int,
    max_size: int,
) -> Result[dict[str, list[dict]]]:
    folders: list[dict] = []
    files: list[dict] = []
    try:
        for entry in target.iterdir():
            try:
                _collect_browser_single_entry(
                    entry=entry,
                    target=target,
                    folders=folders,
                    files=files,
                    browse_all=browse_all,
                    ql=ql,
                    filter_kind=filter_kind,
                    min_size=min_size,
                    max_size=max_size,
                )
            except Exception:
                continue
    except OSError as exc:
        return Result.Err("LIST_FAILED", f"Failed to list directory: {exc}")
    return Result.Ok({"folders": folders, "files": files})


def _collect_browser_single_entry(
    *,
    entry: Path,
    target: Path,
    folders: list[dict],
    files: list[dict],
    browse_all: bool,
    ql: str,
    filter_kind: str,
    min_size: int,
    max_size: int,
) -> None:
    name = entry.name
    if _skip_browser_entry_name(name, browse_all=browse_all, ql=ql):
        return
    if entry.is_dir():
        _append_browser_folder_if_visible(folders, name=name, entry=entry)
        return
    if not entry.is_file():
        return
    kind = _browser_file_kind_or_none(name=name, filter_kind=filter_kind)
    if kind is None:
        return
    st = entry.stat()
    size = int(st.st_size or 0)
    if not _size_within_bounds(size=size, min_size=min_size, max_size=max_size):
        return
    files.append(_make_browser_file_entry(target, name, entry, kind, size, int(st.st_mtime)))


def _skip_browser_entry_name(name: str, *, browse_all: bool, ql: str) -> bool:
    if name.startswith("."):
        return True
    return (not browse_all) and (ql not in name.lower())


def _append_browser_folder_if_visible(folders: list[dict], *, name: str, entry: Path) -> None:
    if _is_hidden_directory(entry):
        return
    folders.append(_make_browser_folder_entry(name, entry, entry.resolve(strict=True)))


def _browser_file_kind_or_none(*, name: str, filter_kind: str) -> str | None:
    kind = classify_file(name)
    if kind == "unknown":
        return None
    if filter_kind and kind != filter_kind:
        return None
    return kind


def _size_within_bounds(*, size: int, min_size: int, max_size: int) -> bool:
    if min_size > 0 and size < min_size:
        return False
    if max_size > 0 and size > max_size:
        return False
    return True


def _filter_browser_files_by_dimensions(
    files: list[dict],
    *,
    min_w: int,
    min_h: int,
    max_w: int,
    max_h: int,
) -> list[dict]:
    if min_w <= 0 and min_h <= 0 and max_w <= 0 and max_h <= 0:
        return files

    filtered_files: list[dict] = []
    for f in files:
        if _browser_file_matches_dimensions(f, min_w=min_w, min_h=min_h, max_w=max_w, max_h=max_h):
            filtered_files.append(f)
    return filtered_files


def _browser_file_matches_dimensions(
    file_row: dict,
    *,
    min_w: int,
    min_h: int,
    max_w: int,
    max_h: int,
) -> bool:
    w_raw = file_row.get("width")
    h_raw = file_row.get("height")
    if w_raw is None or h_raw is None:
        return True
    try:
        w = int(w_raw or 0)
        h = int(h_raw or 0)
    except Exception:
        return False
    return _value_matches_bounds(value=w, min_value=min_w, max_value=max_w) and _value_matches_bounds(
        value=h, min_value=min_h, max_value=max_h
    )


def _value_matches_bounds(*, value: int, min_value: int, max_value: int) -> bool:
    if min_value > 0 and value < min_value:
        return False
    if max_value > 0 and value > max_value:
        return False
    return True


def _list_browser_root_mode_entries(
    *,
    q: str,
    ql: str,
    browse_all: bool,
    filter_kind: str,
    limit: int,
    offset: int,
) -> Result[dict]:
    roots_res = list_browser_roots()
    if not roots_res.ok:
        return Result.Err(roots_res.code, roots_res.error or "Failed to list roots")
    roots = roots_res.data or []
    filtered = _filter_browser_roots(
        roots,
        filter_kind=filter_kind,
        browse_all=browse_all,
        ql=ql,
    )
    payload = _build_browser_listing_payload(filtered, limit, offset, q)
    payload["assets"] = _paginate_assets(filtered, limit, offset)
    return Result.Ok(payload)


def _list_browser_path_mode_entries(
    target: Path,
    *,
    q: str,
    ql: str,
    browse_all: bool,
    filter_kind: str,
    min_size: int,
    max_size: int,
    min_w: int,
    min_h: int,
    max_w: int,
    max_h: int,
    limit: int,
    offset: int,
) -> Result[dict]:
    collect_res = _collect_browser_folders_and_files(
        target,
        browse_all=browse_all,
        ql=ql,
        filter_kind=filter_kind,
        min_size=min_size,
        max_size=max_size,
    )
    if not collect_res.ok:
        return collect_res
    data = collect_res.data if isinstance(collect_res.data, dict) else {}
    folders = data.get("folders") if isinstance(data.get("folders"), list) else []
    files = data.get("files") if isinstance(data.get("files"), list) else []

    folders.sort(key=_folder_sort_key)
    files = _filter_browser_files_by_dimensions(
        files,
        min_w=min_w,
        min_h=min_h,
        max_w=max_w,
        max_h=max_h,
    )
    files.sort(key=lambda x: int(x.get("mtime") or 0), reverse=True)
    hybrid = folders + files

    payload = _build_browser_listing_payload(hybrid, limit, offset, q, target=target)
    payload["assets"] = _paginate_assets(hybrid, limit, offset)
    return Result.Ok(payload)


def list_browser_roots() -> Result[list[dict]]:
    """
    List top-level filesystem roots for browser-mode custom scope.
    """
    roots: list[dict] = []
    if os.name == "nt":
        for letter in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
            p = Path(f"{letter}:\\")
            try:
                if not p.exists():
                    continue
                roots.append(
                    {
                        "id": f"folder::fs::{letter}:",
                        "filename": f"{letter}:",
                        "subfolder": str(p),
                        "filepath": str(p),
                        "kind": "folder",
                        "type": "custom",
                        "root_id": "",
                        "mtime": 0,
                        "size": None,
                        "ext": "",
                        "rating": 0,
                        "tags": [],
                        "has_workflow": None,
                        "has_generation_data": None,
                        "width": None,
                        "height": None,
                        "duration": None,
                    }
                )
            except Exception:
                continue
    else:
        p = Path("/")
        roots.append(
            {
                "id": "folder::fs::/",
                "filename": "/",
                "subfolder": "/",
                "filepath": "/",
                "kind": "folder",
                "type": "custom",
                "root_id": "",
                "mtime": 0,
                "size": None,
                "ext": "",
                "rating": 0,
                "tags": [],
                "has_workflow": None,
                "has_generation_data": None,
                "width": None,
                "height": None,
                "duration": None,
            }
        )
    roots.sort(key=_folder_sort_key)
    return Result.Ok(roots)


def list_filesystem_browser_entries(
    path_value: str,
    query: str,
    limit: int,
    offset: int,
    *,
    kind_filter: str = "",
    min_size_bytes: int = 0,
    max_size_bytes: int = 0,
    min_width: int = 0,
    min_height: int = 0,
    max_width: int = 0,
    max_height: int = 0,
) -> Result[dict]:
    """
    Browser-mode listing for custom scope (no pre-selected root).
    Returns folders + media files under absolute `path_value`, or roots when empty.
    """
    opts = _normalize_browser_query_filters(
        query,
        kind_filter,
        min_size_bytes,
        max_size_bytes,
        min_width,
        min_height,
        max_width,
        max_height,
    )
    q = str(opts["q"])
    ql = str(opts["ql"])
    browse_all = bool(opts["browse_all"])
    filter_kind = str(opts["filter_kind"])
    min_size = int(opts["min_size"])
    max_size = int(opts["max_size"])
    min_w = int(opts["min_w"])
    min_h = int(opts["min_h"])
    max_w = int(opts["max_w"])
    max_h = int(opts["max_h"])

    if not str(path_value or "").strip():
        return _list_browser_root_mode_entries(
            q=q,
            ql=ql,
            browse_all=browse_all,
            filter_kind=filter_kind,
            limit=limit,
            offset=offset,
        )

    try:
        target = Path(path_value).resolve(strict=True)
    except OSError:
        return Result.Err("DIR_NOT_FOUND", f"Directory not found: {path_value}")
    if not target.is_dir():
        return Result.Err("INVALID_INPUT", "Path is not a directory")

    return _list_browser_path_mode_entries(
        target,
        q=q,
        ql=ql,
        browse_all=browse_all,
        filter_kind=filter_kind,
        min_size=min_size,
        max_size=max_size,
        min_w=min_w,
        min_h=min_h,
        max_w=max_w,
        max_h=max_h,
        limit=limit,
        offset=offset,
    )
