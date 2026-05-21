"""
Frontend-facing integration endpoints.

These thin handlers receive hints from the ComfyUI graph (e.g. "the user just
right-clicked SaveImage and chose 'Send to Asset Manager'") and trigger the
matching backend work (incremental indexing of the produced output files).

Kept deliberately small and side-effect free beyond scheduling background
ingestion so they can be exercised without a full ComfyUI server.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

from aiohttp import web
from mjr_am_backend.adapters.comfy_core import get_output_directory
from mjr_am_backend.shared import Result, get_logger

from ..core import (
    _is_path_allowed,
    _json_response,
    _normalize_path,
    _require_services,
    safe_error_message,
)

logger = get_logger(__name__)


def _resolve_output_descriptor(item: dict[str, Any]) -> Path | None:
    """Translate a frontend ``{filename, subfolder, type}`` record to a path."""
    if not isinstance(item, dict):
        return None
    filename = str(item.get("filename") or "").strip()
    if not filename:
        return None
    subfolder = str(item.get("subfolder") or "").strip()
    item_type = str(item.get("type") or "output").strip().lower() or "output"

    # Only "output" / "temp" are reachable via the SaveImage menu integration.
    # Anything else (e.g. "input") would let users bypass the standard input
    # upload flow, which is a footgun we'd rather avoid.
    if item_type not in ("output", "temp"):
        return None

    try:
        from mjr_am_backend.adapters.comfy_core import get_comfy_core

        adapter = get_comfy_core()
        base = adapter.get_directory_by_type(item_type)
    except Exception:
        base = None
    if not base:
        base = get_output_directory()
    if not base:
        return None

    candidate = Path(base)
    if subfolder:
        candidate = candidate / subfolder
    candidate = candidate / filename
    try:
        return candidate.resolve(strict=False)
    except Exception:
        return None


def register_integration_routes(routes: web.RouteTableDef) -> None:
    """Register frontend integration helpers under /mjr/am/integration/*."""

    @routes.post("/mjr/am/integration/send-from-node")
    async def send_from_node(request: web.Request):
        try:
            payload = await request.json()
        except Exception:
            return _json_response(Result.Err("INVALID_INPUT", "Invalid JSON body"))

        items = payload.get("items") if isinstance(payload, dict) else None
        if not isinstance(items, list) or not items:
            return _json_response(Result.Err("INVALID_INPUT", "Missing items"))

        # Cap input list to a safe upper bound — a SaveImage node returning more
        # than ~64 files at once is almost certainly buggy or hostile.
        if len(items) > 64:
            return _json_response(Result.Err("INVALID_INPUT", "Too many items"))

        resolved_paths: list[Path] = []
        for item in items:
            resolved = _resolve_output_descriptor(item)
            if resolved is None:
                continue
            normalized = _normalize_path(str(resolved))
            if not normalized:
                continue
            # Defence in depth: never index a file outside the allowed roots.
            if not _is_path_allowed(normalized, must_exist=True):
                continue
            if normalized.is_file():
                resolved_paths.append(normalized)

        if not resolved_paths:
            return _json_response(
                Result.Err("NOT_FOUND", "No reachable output files in payload")
            )

        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)
        if not isinstance(svc, dict) or "index" not in svc:
            return _json_response(Result.Err("SERVICE_UNAVAILABLE", "Index unavailable"))

        index_paths = getattr(svc["index"], "index_paths", None)
        if not callable(index_paths):
            return _json_response(
                Result.Err("SERVICE_UNAVAILABLE", "index service does not support index_paths")
            )

        try:
            base_dir = str(resolved_paths[0].parent)
            res = await index_paths(
                resolved_paths,
                base_dir=base_dir,
                incremental=True,
                source="output",
                root_id=None,
            )
        except Exception as exc:
            return _json_response(
                Result.Err("INDEX_ERROR", safe_error_message(exc, "Indexing failed"))
            )
        if not res.ok:
            return _json_response(
                Result.Err(res.code or "INDEX_ERROR", res.error or "Indexing failed")
            )

        return _json_response(
            Result.Ok(
                {
                    "indexed": len(resolved_paths),
                    "paths": [str(p) for p in resolved_paths],
                }
            )
        )


__all__ = ["register_integration_routes"]
