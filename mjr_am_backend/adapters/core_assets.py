"""
Adapter for ComfyUI core assets system (app.assets).

Bridges the core `/api/assets` service layer when `--enable-assets` is active.
All imports are guarded — when the core system is unavailable this module
degrades gracefully and every public function returns None / empty.

The core service layer (`app.assets.services`, `app.database.db`) is
synchronous and SQLAlchemy-session-based; every DB-touching call here runs
through `asyncio.to_thread` so it doesn't block the event loop.
"""

from __future__ import annotations

import asyncio
import os
from dataclasses import dataclass
from typing import Any

from ..shared import get_logger
from .comfy_core import get_comfy_core

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
        core = get_comfy_core()
        if core.get_prompt_server_instance() is None:
            _core_available = False
            return False

        # Check the feature-flag that ComfyUI sets when --enable-assets is used.
        flags = core.get_feature_flags()
        if "assets" in flags and not bool(flags.get("assets")):
            _core_available = False
            return False

        # Final check: can we actually import the service layer?
        _core_available = core.core_assets_enabled()
        if not _core_available:
            return False
        logger.info("Core assets system detected and available")
    except Exception:
        _core_available = False

    return _core_available


def _ref_to_info(detail) -> CoreAssetInfo | None:
    """Convert a core AssetDetailResult into CoreAssetInfo."""
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


def _fetch_by_path_sync(file_path: str) -> CoreAssetInfo | None:
    from app.assets.database.queries.records import get_record_by_path_or_none
    from app.assets.services import get_asset_detail
    from app.database.db import create_session

    # Core's writer normalizes stored content paths with os.path.abspath()
    # (create_content_reporting_insert); match that exactly rather than
    # resolving symlinks, which could miss the stored row.
    abs_path = os.path.abspath(file_path)
    with create_session() as session:
        record = get_record_by_path_or_none(session, abs_path)
        if record is None:
            return None
        reference_id = record.id
    detail = get_asset_detail(reference_id)
    if detail is None:
        return None
    return _ref_to_info(detail)


async def fetch_by_path(file_path: str) -> CoreAssetInfo | None:
    """Look up a core asset reference by its absolute file path.

    Returns None if the core system is unavailable or the file is not tracked.
    """
    if not is_available():
        return None
    try:
        return await asyncio.to_thread(_fetch_by_path_sync, str(file_path))
    except Exception as exc:
        logger.debug("Core asset lookup by path failed: %s", exc)
        return None


def _fetch_by_job_id_sync(job_id: str) -> list[CoreAssetInfo]:
    import sqlalchemy as sa
    from app.assets.database.models import Asset, AssetContent
    from app.assets.services.schemas import AssetData, AssetDetailResult, ReferenceData
    from app.database.db import create_session

    infos: list[CoreAssetInfo] = []
    with create_session() as session:
        rows = session.execute(
            sa.select(Asset, AssetContent)
            .join(AssetContent, Asset.content_id == AssetContent.id)
            .where(Asset.job_id == job_id, AssetContent.is_missing.is_(False))
        ).all()
        for record, content in rows:
            ref = ReferenceData(
                id=record.id,
                name=record.name,
                file_path=content.path,
                user_metadata=record.user_metadata,
                preview_id=record.preview_id,
                created_at=record.created_at,
                updated_at=record.updated_at,
                loader_path=record.loader_path,
                system_metadata=record.system_metadata,
                job_id=record.job_id,
                last_access_time=record.last_access_time,
            )
            asset = AssetData(
                hash=content.hash,
                size_bytes=content.size_bytes,
                mime_type=record.mime_type,
                is_missing=content.is_missing,
            )
            info = _ref_to_info(AssetDetailResult(ref=ref, asset=asset, tags=[]))
            if info is not None:
                infos.append(info)
    return infos


async def fetch_by_job_id(job_id: str) -> list[CoreAssetInfo]:
    """Return all core asset references that share the given job_id."""
    if not is_available() or not job_id:
        return []
    try:
        return await asyncio.to_thread(_fetch_by_job_id_sync, str(job_id))
    except Exception as exc:
        logger.debug("Core asset lookup by job_id failed: %s", exc)
        return []


def _clean_sync_tags(tags: list[str] | tuple[str, ...] | None) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for tag in tags or []:
        text = str(tag or "").strip()
        if not text:
            continue
        key = text.casefold()
        if key in seen:
            continue
        seen.add(key)
        out.append(text)
    return out


async def _asset_filepath_by_id(db: Any, asset_id: int) -> str:
    try:
        res = await db.aquery("SELECT filepath FROM assets WHERE id = ?", (int(asset_id),))
        if res.ok and res.data:
            return str((res.data[0] or {}).get("filepath") or "").strip()
    except Exception as exc:
        logger.debug("Core asset sync filepath lookup failed for asset %s: %s", asset_id, exc)
    return ""


def _update_asset_metadata_sync(
    reference_id: str,
    tags: list[str] | None,
    user_metadata: dict[str, Any] | None,
) -> bool:
    from app.assets.services import update_asset_metadata

    update_asset_metadata(
        reference_id,
        tags=tags,
        user_metadata=user_metadata,
        tag_origin="manual",
    )
    return True


async def sync_user_metadata_by_asset_id(
    db: Any,
    asset_id: int,
    *,
    rating: int | None = None,
    tags: list[str] | tuple[str, ...] | None = None,
    metadata: dict[str, Any] | None = None,
) -> bool:
    """Best-effort write-through of Majoor metadata into Comfy core assets."""
    if not is_available():
        return False
    filepath = await _asset_filepath_by_id(db, asset_id)
    if not filepath:
        return False
    info = await fetch_by_path(filepath)
    if not info:
        return False

    # update_asset_metadata() replaces user_metadata wholesale, so merge onto
    # the current value rather than clobbering fields another tool set.
    merged_metadata = dict(info.user_metadata or {})
    if metadata:
        merged_metadata.update(metadata)
    if rating is not None:
        merged_metadata["rating"] = max(0, min(5, int(rating or 0)))

    clean_tags = _clean_sync_tags(tags) if tags is not None else None
    user_metadata_arg = merged_metadata if (metadata or rating is not None) else None
    if user_metadata_arg is None and clean_tags is None:
        return False

    try:
        return await asyncio.to_thread(
            _update_asset_metadata_sync,
            info.reference_id,
            clean_tags,
            user_metadata_arg,
        )
    except Exception as exc:
        logger.debug("Core asset metadata sync failed for %s: %s", info.reference_id, exc)
        return False
