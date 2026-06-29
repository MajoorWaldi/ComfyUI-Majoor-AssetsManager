"""Thumbnail routes."""

from __future__ import annotations

import asyncio
from pathlib import Path

from aiohttp import web
from mjr_am_backend.features.metadata.thumbnail_cache import get_or_create_thumbnail
from mjr_am_backend.shared import Result, sanitize_error_message

from ..core import _is_path_allowed, _json_response, _normalize_path


def register_thumbnail_routes(routes: web.RouteTableDef) -> None:
    @routes.get("/mjr/am/thumbnail")
    async def get_thumbnail(request: web.Request) -> web.StreamResponse:
        filepath = str(request.query.get("filepath") or "").strip()
        if not filepath:
            return _json_response(Result.Err("INVALID_INPUT", "Missing filepath"))
        normalized = _normalize_path(filepath)
        if not normalized or not normalized.exists() or not _is_path_allowed(normalized):
            return _json_response(Result.Err("FORBIDDEN", "Path not allowed"))
        size = request.query.get("size", "320")
        try:
            loop = asyncio.get_running_loop()
            result = await loop.run_in_executor(None, lambda: get_or_create_thumbnail(str(normalized), size=size))
        except Exception as exc:
            return _json_response(Result.Err("THUMBNAIL_FAILED", sanitize_error_message(exc, "Failed to generate thumbnail")))
        if not result.ok:
            return _json_response(result)
        thumb_path = Path(str((result.data or {}).get("path") or ""))
        if not thumb_path.is_file():
            return _json_response(Result.Err("NOT_FOUND", "Thumbnail not found"))
        return web.FileResponse(
            thumb_path,
            headers={
                "Content-Type": "image/jpeg",
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        )
