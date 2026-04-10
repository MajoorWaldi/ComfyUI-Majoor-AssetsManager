"""Compatibility facade for asset download helpers."""

from __future__ import annotations

from mjr_am_backend.features.assets.download_service import (
    COMFYUI_STRIP_TAGS_VIDEO,
    COMFYUI_STRIP_TAGS_WEBP,
    STRIP_SUPPORTED_EXTS,
    build_download_response,
    download_clean_exiftool,
    download_clean_png,
    download_rate_limit_response_or_none,
    handle_download_asset,
    handle_download_clean_asset,
    is_preview_download_request,
    resolve_download_path,
    safe_download_filename,
    strip_png_comfyui_chunks,
    strip_tags_for_ext,
    validate_no_symlink_open,
)


def register_download_routes(routes, *, download_asset_handler, download_clean_asset_handler) -> None:
    routes.get("/mjr/am/download")(download_asset_handler)
    routes.get("/mjr/am/download-clean")(download_clean_asset_handler)


__all__ = [
    "COMFYUI_STRIP_TAGS_VIDEO",
    "COMFYUI_STRIP_TAGS_WEBP",
    "STRIP_SUPPORTED_EXTS",
    "build_download_response",
    "download_clean_exiftool",
    "download_clean_png",
    "download_rate_limit_response_or_none",
    "handle_download_asset",
    "handle_download_clean_asset",
    "is_preview_download_request",
    "register_download_routes",
    "resolve_download_path",
    "safe_download_filename",
    "strip_png_comfyui_chunks",
    "strip_tags_for_ext",
    "validate_no_symlink_open",
]
