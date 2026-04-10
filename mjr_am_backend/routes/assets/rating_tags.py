"""Compatibility facade for asset rating/tag helpers."""

from __future__ import annotations

from mjr_am_backend.features.assets.rating_tags_service import (
    enqueue_rating_tags_sync,
    fetch_asset_filepath,
    fetch_asset_rating_tags,
    get_rating_tags_sync_mode,
    normalize_tags_payload,
    parse_rating_value,
    resolve_rating_asset_id,
    sanitize_tags,
)

__all__ = [
    "enqueue_rating_tags_sync",
    "fetch_asset_filepath",
    "fetch_asset_rating_tags",
    "get_rating_tags_sync_mode",
    "normalize_tags_payload",
    "parse_rating_value",
    "resolve_rating_asset_id",
    "sanitize_tags",
]

