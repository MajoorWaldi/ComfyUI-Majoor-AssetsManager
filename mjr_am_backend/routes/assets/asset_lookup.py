"""Compatibility facade — re-exports from features.assets.lookup_service."""

from __future__ import annotations

from mjr_am_backend.features.assets.lookup_service import (
    filepath_db_keys,
    filepath_where_clause,
    find_asset_id_row_by_filepath,
    find_asset_row_by_filepath,
    find_rename_row_by_filepath,
    folder_paths,
    infer_source_and_root_id_from_path,
    load_asset_filepath_by_id,
    load_asset_row_by_id,
    resolve_or_create_asset_id,
)

__all__ = [
    "filepath_db_keys",
    "filepath_where_clause",
    "find_asset_id_row_by_filepath",
    "find_asset_row_by_filepath",
    "find_rename_row_by_filepath",
    "folder_paths",
    "infer_source_and_root_id_from_path",
    "load_asset_filepath_by_id",
    "load_asset_row_by_id",
    "resolve_or_create_asset_id",
]
