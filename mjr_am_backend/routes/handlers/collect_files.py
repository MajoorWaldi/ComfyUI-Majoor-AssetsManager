"""
Collect-files endpoint: bundles an asset, its workflow JSON, referenced media
inputs and a manifest into a ZIP written next to the asset.
"""

from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Any

from aiohttp import web
from mjr_am_backend.features.assets.collect_service import build_collect_zip
from mjr_am_backend.shared import Result, get_logger, sanitize_error_message

from ..core import (
    _check_rate_limit,
    _csrf_error,
    _is_path_allowed,
    _is_path_allowed_custom,
    _json_response,
    _normalize_path,
    _read_json,
    _require_services,
    _require_write_access,
)

logger = get_logger(__name__)

_RATE_LIMIT_MAX_REQUESTS = 10
_RATE_LIMIT_WINDOW_SECONDS = 60
_WORKFLOW_EXTRACT_TIMEOUT_S = 30.0
_BUILD_TIMEOUT_S = 300.0


def _resolve_asset_path(body: dict[str, Any]) -> Result[Path]:
    raw = str(body.get("filepath") or body.get("path") or "").strip()
    if not raw:
        return Result.Err("INVALID_INPUT", "Missing 'filepath'")
    candidate = _normalize_path(raw)
    if candidate is None:
        return Result.Err("INVALID_INPUT", "Invalid filepath")
    try:
        resolved = candidate.resolve(strict=True)
    except Exception:
        return Result.Err("NOT_FOUND", "File does not exist")
    if not resolved.is_file():
        return Result.Err("INVALID_INPUT", "Not a file")
    if not (_is_path_allowed(resolved, must_exist=True) or _is_path_allowed_custom(resolved)):
        return Result.Err("FORBIDDEN", "Path is outside allowed folders")
    return Result.Ok(resolved)


def register_collect_files_routes(routes: web.RouteTableDef) -> None:
    """Register the collect-files route."""

    @routes.post("/mjr/am/collect-files")
    async def collect_files(request: web.Request) -> web.Response:
        csrf = _csrf_error(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))
        auth = _require_write_access(request)
        if not auth.ok:
            return _json_response(auth)

        allowed, retry_after = _check_rate_limit(
            request,
            "collect_files",
            max_requests=_RATE_LIMIT_MAX_REQUESTS,
            window_seconds=_RATE_LIMIT_WINDOW_SECONDS,
        )
        if not allowed:
            return _json_response(
                Result.Err(
                    "RATE_LIMITED",
                    "Too many collect requests. Please wait before retrying.",
                    retry_after=retry_after,
                )
            )

        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)
        metadata_service = (svc or {}).get("metadata")
        if metadata_service is None:
            return _json_response(Result.Err("SERVICE_UNAVAILABLE", "Metadata service unavailable"))

        payload_res = await _read_json(request)
        if not payload_res.ok:
            return _json_response(payload_res)
        body = payload_res.data or {}
        if not isinstance(body, dict):
            return _json_response(Result.Err("INVALID_INPUT", "Invalid request body"))

        path_res = _resolve_asset_path(body)
        if not path_res.ok:
            return _json_response(path_res)
        asset_path = path_res.data
        if asset_path is None:
            return _json_response(Result.Err("INVALID_INPUT", "Missing 'filepath'"))

        workflow: Any = None
        prompt: Any = None
        try:
            wf_res = await asyncio.wait_for(
                metadata_service.get_workflow_only(str(asset_path)),
                timeout=_WORKFLOW_EXTRACT_TIMEOUT_S,
            )
            if wf_res.ok and isinstance(wf_res.data, dict):
                workflow = wf_res.data.get("workflow")
                prompt = wf_res.data.get("prompt")
        except Exception as exc:
            logger.debug("Collect files: workflow extraction failed for %s: %s", asset_path, exc)

        try:
            result = await asyncio.wait_for(
                asyncio.to_thread(
                    build_collect_zip,
                    asset_path,
                    workflow=workflow,
                    prompt=prompt,
                ),
                timeout=_BUILD_TIMEOUT_S,
            )
        except asyncio.TimeoutError:
            return _json_response(Result.Err("TIMEOUT", "Collect operation timed out"))
        except Exception as exc:
            return _json_response(
                Result.Err("IO_ERROR", sanitize_error_message(exc, "Failed to collect files"))
            )
        return _json_response(result)
