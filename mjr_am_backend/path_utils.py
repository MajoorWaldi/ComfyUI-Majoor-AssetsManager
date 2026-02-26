"""
Shared path normalization and safety helpers.
"""

from __future__ import annotations

import os
from pathlib import Path


def normalize_path(value: str) -> Path | None:
    if not value:
        return None
    if "\x00" in value:
        return None
    try:
        return Path(value).expanduser().resolve(strict=False)
    except (OSError, ValueError):
        return None


def safe_rel_path(value: str) -> Path | None:
    if value is None:
        return Path("")
    raw = str(value).strip()
    if raw == "":
        return Path("")
    if "\x00" in raw:
        return None
    try:
        rel = Path(raw)
    except (OSError, ValueError):
        return None
    if getattr(rel, "drive", ""):
        return None
    if rel.is_absolute():
        return None
    if any(part == ".." for part in rel.parts):
        return None
    return rel


def is_within_root(candidate: Path, root: Path) -> bool:
    try:
        root_resolved = root.resolve(strict=True)
        cand_resolved = candidate.resolve(strict=True)
    except (OSError, RuntimeError, ValueError):
        return False
    try:
        return cand_resolved == root_resolved or cand_resolved.is_relative_to(root_resolved)
    except AttributeError:
        try:
            common = os.path.commonpath([str(cand_resolved), str(root_resolved)])
            return os.path.normcase(common) == os.path.normcase(str(root_resolved))
        except ValueError:
            return False

