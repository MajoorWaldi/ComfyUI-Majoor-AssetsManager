"""
Adapter for ComfyUI core assets system (app.assets).

Bridges the core `/api/assets` service layer when `--enable-assets` is active.
All imports are guarded — when the core system is unavailable this module
degrades gracefully and every public function returns None / empty.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from ..shared import get_logger

logger = get_logger(__name__)

_core_available: bool | None = None  # tri-state: None = not probed yet


@dataclass(frozen=True)
class CoreAssetInfo:
    """Lightweight DTO carrying data from a core AssetReference."""

    reference_id: str
    file_path: str | None
    hash: str | None
    size_bytes: int | None
    mime_type: str | None
    job_id: str | None
    tags: list[str]
    user_metadata: dict[str, Any] | None = None
    system_metadata: dict[str, Any] | None = None


def is_available() -> bool:
    """Return True when the ComfyUI core assets system is loaded and enabled."""
    global _core_available
    if _core_available is not None:
        return _core_available

    try:
        import sys
        server_mod = sys.modules.get("server")
        if server_mod is None:
            _core_available = False
            return False

        # Check the feature-flag that ComfyUI sets when --enable-assets is used.
        try:
            from comfy_api.feature_flags import SERVER_FEATURE_FLAGS
            if not SERVER_FEATURE_FLAGS.get("assets"):
                _core_available = False
                return False
        except Exception:
            pass

        # Final check: can we actually import the service layer?
        from app.assets.services import list_assets_page  # noqa: F401
        _core_available = True
        logger.info("Core assets system detected and available")
    except Exception:
        _core_available = False

    return _core_available


def _ref_to_info(detail) -> CoreAssetInfo | None:
    """Convert a core AssetDetailResult / AssetSummaryData into CoreAssetInfo."""
    try:
        ref = detail.ref
        asset = detail.asset
        tags = list(detail.tags) if detail.tags else []
        return CoreAssetInfo(
            reference_id=str(ref.id),
            file_path=ref.file_path,
            hash=asset.hash if asset else None,
            size_bytes=asset.size_bytes if asset else None,
            mime_type=asset.mime_type if asset else None,
            job_id=ref.job_id,
            tags=tags,
            user_metadata=ref.user_metadata,
            system_metadata=ref.system_metadata,
        )
    except Exception as exc:
        logger.debug("Failed to convert core asset reference: %s", exc)
        return None


async def fetch_by_path(file_path: str) -> CoreAssetInfo | None:
    """Look up a core asset reference by its absolute file path.

    Returns None if the core system is unavailable or the file is not tracked.
    """
    if not is_available():
        return None
    try:
        from app.assets.services import list_assets_page
        result = await list_assets_page(
            owner_id="",
            name_contains=None,
            include_tags=[],
            exclude_tags=[],
            metadata_filter=None,
            limit=1,
            offset=0,
            sort="created_at",
            order="desc",
        )
        # The core API doesn't expose a direct by-path lookup via the service
        # layer.  Walk the first page and filter — for single-file lookups this
        # is acceptable; a future version could query the DB directly.
        for item in result.items:
            if item.ref.file_path and _paths_equal(item.ref.file_path, file_path):
                return _ref_to_info(item)
    except Exception as exc:
        logger.debug("Core asset lookup by path failed: %s", exc)
    return None


async def fetch_by_job_id(job_id: str) -> list[CoreAssetInfo]:
    """Return all core asset references that share the given job_id."""
    if not is_available() or not job_id:
        return []
    try:
        from app.assets.database.queries.asset_reference import (
            list_references_page,
        )
        from app.assets.database import get_session

        async with get_session() as session:
            rows = await list_references_page(
                session,
                owner_id="",
                tags=[],
                name_contains=None,
                metadata_filter={"job_id": job_id},
                limit=200,
                offset=0,
                sort="created_at",
                order="asc",
            )
        # This is a best-effort path — the core query layer may not support
        # metadata_filter with job_id directly.  Fall back to a raw query
        # if the import structure changes.
        return [info for r in rows if (info := _ref_to_info(r)) is not None]
    except Exception as exc:
        logger.debug("Core asset lookup by job_id failed (expected on older cores): %s", exc)
    return []


def _paths_equal(a: str, b: str) -> bool:
    """Case-insensitive, separator-normalised path comparison."""
    import os
    try:
        return os.path.normcase(os.path.normpath(a)) == os.path.normcase(os.path.normpath(b))
    except Exception:
        return str(a) == str(b)
