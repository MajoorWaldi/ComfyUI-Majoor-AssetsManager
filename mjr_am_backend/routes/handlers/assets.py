"""Assets handler facade.

Public route registration API remains stable.
"""

from .assets_impl import download_asset, register_asset_routes, register_download_routes

__all__ = ["register_asset_routes", "register_download_routes", "download_asset"]
