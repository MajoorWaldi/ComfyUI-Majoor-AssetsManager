"""
Filesystem browser helpers for hybrid folder/file listing.
"""

from __future__ import annotations

import os
import stat
from pathlib import Path

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
    try:
        base = root_dir.resolve()
    except OSError as exc:
        return Result.Err("INVALID_INPUT", f"Invalid root directory: {exc}")

    rel = _safe_rel_path(subfolder or "")
    if rel is None:
        return Result.Err("INVALID_INPUT", "Invalid subfolder")

    target_dir = (base / rel)
    try:
        target_resolved = target_dir.resolve(strict=True)
    except OSError:
        return Result.Err("DIR_NOT_FOUND", f"Directory not found: {target_dir}")

    if not _is_within_root(target_resolved, base):
        return Result.Err("INVALID_INPUT", "Subfolder outside root")

    folders: list[dict] = []
    try:
        for entry in target_resolved.iterdir():
            try:
                if not entry.is_dir():
                    continue
                if _is_hidden_directory(entry):
                    continue
                resolved_child = entry.resolve(strict=True)
                if not _is_within_root(resolved_child, base):
                    continue
                child_rel = str(resolved_child.relative_to(base)).replace("\\", "/")
                folders.append(
                    {
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
                )
            except Exception:
                continue
    except OSError as exc:
        return Result.Err("LIST_FAILED", f"Failed to list subfolders: {exc}")

    folders.sort(key=_folder_sort_key)
    return Result.Ok(folders)


def _safe_name(path: Path) -> str:
    try:
        if path.name:
            return path.name
        return str(path)
    except Exception:
        return str(path)


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
    folders: list[dict] = []
    q = str(query or "*").strip()
    ql = q.lower()
    browse_all = q in ("", "*")
    filter_kind = str(kind_filter or "").strip().lower()
    min_size = max(0, int(min_size_bytes or 0))
    max_size = max(0, int(max_size_bytes or 0))
    if max_size > 0 and min_size > 0 and max_size < min_size:
        max_size = min_size
    min_w = max(0, int(min_width or 0))
    min_h = max(0, int(min_height or 0))
    max_w = max(0, int(max_width or 0))
    max_h = max(0, int(max_height or 0))
    if not str(path_value or "").strip():
        roots_res = list_browser_roots()
        if not roots_res.ok:
            return Result.Err(roots_res.code, roots_res.error or "Failed to list roots")
        folders = roots_res.data or []
        if filter_kind:
            folders = []
        if not browse_all:
            folders = [f for f in folders if ql in str(f.get("filename") or "").lower()]
        total = len(folders)
        start = max(0, int(offset or 0))
        end = start + int(limit or 0) if int(limit or 0) > 0 else None
        return Result.Ok(
            {
                "assets": folders[start:end] if end is not None else folders[start:],
                "total": total,
                "limit": limit,
                "offset": offset,
                "query": q,
                "scope": "custom",
            }
        )

    try:
        target = Path(path_value).resolve(strict=True)
    except OSError:
        return Result.Err("DIR_NOT_FOUND", f"Directory not found: {path_value}")
    if not target.is_dir():
        return Result.Err("INVALID_INPUT", "Path is not a directory")

    files: list[dict] = []
    try:
        for entry in target.iterdir():
            try:
                name = entry.name
                if name.startswith("."):
                    continue
                if not browse_all and ql not in name.lower():
                    continue
                if entry.is_dir():
                    if _is_hidden_directory(entry):
                        continue
                    resolved_child = entry.resolve(strict=True)
                    folders.append(
                        {
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
                    )
                    continue
                if not entry.is_file():
                    continue
                kind = classify_file(name)
                if kind == "unknown":
                    continue
                if filter_kind and kind != filter_kind:
                    continue
                st = entry.stat()
                size = int(st.st_size or 0)
                if min_size > 0 and size < min_size:
                    continue
                if max_size > 0 and size > max_size:
                    continue
                files.append(
                    {
                        "id": None,
                        "filename": name,
                        "subfolder": str(target),
                        "filepath": str(entry),
                        "kind": kind,
                        "ext": entry.suffix.lower(),
                        "size": size,
                        "mtime": int(st.st_mtime),
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
                )
            except Exception:
                continue
    except OSError as exc:
        return Result.Err("LIST_FAILED", f"Failed to list directory: {exc}")

    folders.sort(key=_folder_sort_key)
    if min_w > 0 or min_h > 0 or max_w > 0 or max_h > 0:
        # Browser-mode filesystem rows usually don't have probed dimensions yet.
        # Apply resolution filter only when dimensions are known.
        filtered_files: list[dict] = []
        for f in files:
            w_raw = f.get("width")
            h_raw = f.get("height")
            if w_raw is None or h_raw is None:
                filtered_files.append(f)
                continue
            try:
                w = int(w_raw or 0)
                h = int(h_raw or 0)
                if min_w > 0 and w < min_w:
                    continue
                if min_h > 0 and h < min_h:
                    continue
                if max_w > 0 and w > max_w:
                    continue
                if max_h > 0 and h > max_h:
                    continue
            except Exception:
                continue
            filtered_files.append(f)
        files = filtered_files

    files.sort(key=lambda x: int(x.get("mtime") or 0), reverse=True)
    hybrid = folders + files
    total = len(hybrid)
    start = max(0, int(offset or 0))
    end = start + int(limit or 0) if int(limit or 0) > 0 else None
    page = hybrid[start:end] if end is not None else hybrid[start:]
    return Result.Ok(
        {
            "assets": page,
            "total": total,
            "limit": limit,
            "offset": offset,
            "query": q,
            "scope": "custom",
            "path": str(target),
            "current_path": str(target),
            "display_name": _safe_name(target),
        }
    )
