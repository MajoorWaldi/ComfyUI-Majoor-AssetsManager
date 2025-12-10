from __future__ import annotations
import logging
from typing import Dict

from .utils import load_metadata, save_metadata, apply_system_metadata

logger = logging.getLogger(__name__)


def get_metadata(path: str) -> Dict:
    """Load sidecar JSON (or fallback) for the given path."""
    return load_metadata(path)


def update_metadata(path: str, updates: dict) -> Dict:
    """Update and persist the sidecar JSON for a file."""
    meta = load_metadata(path)
    meta.update(updates or {})
    save_metadata(path, meta)
    return meta


def update_metadata_with_windows(path: str, updates: dict) -> Dict:
    """
    Update local sidecar + Windows properties (rating/tags).
    Main entry used by routes.py.
    """
    meta = load_metadata(path)
    meta.update(updates or {})

    if isinstance(updates, dict) and ("rating" in updates or "tags" in updates):
        applied = apply_system_metadata(path, updates.get("rating"), updates.get("tags") or [])
        meta["rating"] = applied.get("rating", meta.get("rating", 0))
        meta["tags"] = applied.get("tags", meta.get("tags", []))

    save_metadata(path, meta)
    return meta


__all__ = ["get_metadata", "update_metadata", "update_metadata_with_windows"]
