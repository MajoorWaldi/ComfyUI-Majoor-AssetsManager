"""Rating/tag helpers for asset routes."""

from __future__ import annotations

import json
import re
from collections.abc import Awaitable, Callable
from typing import Any

from aiohttp import web

from ...shared import Result


def get_rating_tags_sync_mode(request: web.Request) -> str:
    try:
        raw = (request.headers.get("X-MJR-RTSYNC") or "").strip().lower()
    except Exception:
        raw = ""
    if raw in ("", "0", "false", "off", "disable", "disabled", "no"):
        return "off"
    if raw in ("1", "true", "on", "enable", "enabled"):
        return "on"
    if raw in ("sidecar", "both", "exiftool"):
        return raw
    return "off"


async def fetch_asset_filepath(db: Any, asset_id: int) -> str | None:
    try:
        fp_res = await db.aquery("SELECT filepath FROM assets WHERE id = ?", (asset_id,))
        if not fp_res.ok or not fp_res.data:
            return None
        filepath = fp_res.data[0].get("filepath")
        return filepath if isinstance(filepath, str) and filepath else None
    except Exception:
        return None


def normalize_tags_payload(raw_tags: object) -> list[str]:
    if isinstance(raw_tags, list):
        return [tag for tag in raw_tags if isinstance(tag, str)]
    if isinstance(raw_tags, str):
        try:
            parsed = json.loads(raw_tags)
        except Exception:
            parsed = []
        if isinstance(parsed, list):
            return [tag for tag in parsed if isinstance(tag, str)]
    return []


async def fetch_asset_rating_tags(db: Any, asset_id: int) -> tuple[int, list[str]]:
    try:
        meta_res = await db.aquery(
            "SELECT rating, tags FROM asset_metadata WHERE asset_id = ?",
            (asset_id,),
        )
        if not meta_res.ok or not meta_res.data:
            return 0, []
        row = meta_res.data[0] or {}
        rating = int(row.get("rating") or 0)
        tags = normalize_tags_payload(row.get("tags"))
        return rating, tags
    except Exception:
        return 0, []


async def enqueue_rating_tags_sync(
    request: web.Request,
    services: dict[str, Any],
    asset_id: int,
    *,
    logger: Any,
) -> None:
    mode = get_rating_tags_sync_mode(request)
    if mode == "off":
        return

    worker = services.get("rating_tags_sync")
    db = services.get("db")
    if not worker or not db:
        return

    filepath = await fetch_asset_filepath(db, asset_id)
    if not filepath:
        return

    rating, tags = await fetch_asset_rating_tags(db, asset_id)

    try:
        worker.enqueue(filepath, rating, tags, mode)
    except Exception as exc:
        logger.debug("Failed to enqueue rating/tags sync for asset_id=%s: %s", asset_id, exc)


async def resolve_rating_asset_id(
    body: dict[str, Any],
    services: dict[str, Any],
    *,
    resolve_or_create_asset_id: Callable[..., Awaitable[Result[int]]],
) -> Result[int]:
    asset_id = body.get("asset_id")
    if asset_id is not None:
        try:
            return Result.Ok(int(asset_id))
        except (ValueError, TypeError):
            return Result.Err("INVALID_INPUT", "Invalid asset_id")
    filepath = body.get("filepath") or body.get("path") or ""
    file_type = body.get("type") or ""
    root_id = body.get("root_id") or body.get("custom_root_id") or ""
    return await resolve_or_create_asset_id(
        services=services,
        filepath=str(filepath),
        file_type=str(file_type),
        root_id=str(root_id),
    )


def parse_rating_value(value: object) -> Result[int]:
    if not isinstance(value, (int, float, str, bytes, bytearray)) and value is not None:
        return Result.Err("INVALID_INPUT", "Invalid rating")
    try:
        return Result.Ok(max(0, min(5, int(value or 0))))
    except (ValueError, TypeError):
        return Result.Err("INVALID_INPUT", "Invalid rating")


def sanitize_tags(
    tags: object,
    *,
    max_tag_length: int,
    max_tags_per_asset: int,
) -> Result[list[str]]:
    if not isinstance(tags, list):
        return Result.Err("INVALID_INPUT", "Tags must be a list")

    sanitized_tags: list[str] = []
    for tag in tags:
        if not isinstance(tag, str):
            continue
        cleaned = re.sub(r"[\x00-\x1f\x7f]", "", str(tag)).strip()
        if not cleaned or len(cleaned) > max_tag_length:
            continue
        cleaned_lower = cleaned.lower()
        if any(existing.lower() == cleaned_lower for existing in sanitized_tags):
            continue
        sanitized_tags.append(cleaned)
        if len(sanitized_tags) > max_tags_per_asset:
            return Result.Err(
                "INVALID_INPUT",
                f"Too many tags (max {max_tags_per_asset}, got {len(sanitized_tags)})",
            )
    return Result.Ok(sanitized_tags)


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