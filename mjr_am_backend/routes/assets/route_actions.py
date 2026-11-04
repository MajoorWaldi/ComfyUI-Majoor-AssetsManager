"""Compatibility facade for extracted asset route actions."""

from __future__ import annotations

from .route_actions_basic import (
    handle_get_all_tags,
    handle_open_in_folder,
    handle_retry_services,
    handle_update_asset_rating,
    handle_update_asset_tags,
)
from .route_actions_batch_rating import (  # noqa: F401
    handle_update_assets_rating,
)
from .route_actions_crud import (
    handle_delete_asset,
    handle_delete_assets,
    handle_rename_asset,
)

__all__ = [
    "handle_delete_asset",
    "handle_delete_assets",
    "handle_get_all_tags",
    "handle_open_in_folder",
    "handle_rename_asset",
    "handle_retry_services",
    "handle_update_asset_rating",
    "handle_update_assets_rating",
    "handle_update_asset_tags",
]
