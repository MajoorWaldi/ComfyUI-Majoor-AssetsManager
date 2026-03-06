"""
Viewer helper endpoints.

These endpoints provide lightweight media info for the frontend viewer without
requiring the full metadata payload.
"""

from __future__ import annotations

from aiohttp import web
from mjr_am_backend.features.viewer.info import build_viewer_media_info
from mjr_am_backend.shared import Result, get_logger

from ..core import (
    _guess_content_type_for_file,
    _is_path_allowed,
    _is_path_allowed_custom,
    _json_response,
    _normalize_path,
    _require_services,
    safe_error_message,
)

logger = get_logger(__name__)

_POPOUT_HTML = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#1e1e1e">
  <title>Majoor Viewer</title>
  <style>
    html, body {
      margin: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #111;
      color: #ddd;
      font-family: system-ui, sans-serif;
    }
    body {
      display: flex;
      min-height: 100vh;
    }
    #mjr-mfv-popout-root {
      flex: 1;
      min-width: 0;
      min-height: 0;
      display: flex;
      align-items: stretch;
      justify-content: stretch;
      background:
        radial-gradient(circle at top, rgba(95, 179, 255, 0.12), transparent 35%),
        linear-gradient(180deg, #1a1a1a 0%, #101010 100%);
    }
    .mjr-mfv-popout-loading {
      margin: auto;
      padding: 12px 16px;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(20,20,20,0.82);
      font-size: 12px;
      letter-spacing: 0.02em;
      opacity: 0.84;
    }
  </style>
</head>
<body>
  <div id="mjr-mfv-popout-root">
    <div class="mjr-mfv-popout-loading">Preparing viewer…</div>
  </div>
</body>
</html>
"""


def register_viewer_routes(routes: web.RouteTableDef) -> None:
    """Register viewer info and file-serving routes."""
    @routes.get("/mjr/viewer/popout")
    async def viewer_popout_page(_request: web.Request):
        return web.Response(text=_POPOUT_HTML, content_type="text/html")

    @routes.get("/mjr/am/viewer/info")
    async def viewer_info(request: web.Request):
        """
        Get compact viewer-oriented media info by asset id.

        Query params:
          asset_id: int
        """
        try:
            raw_id = str(request.query.get("asset_id", "")).strip()
        except Exception:
            raw_id = ""
        if not raw_id:
            return _json_response(Result.Err("INVALID_INPUT", "Missing asset_id"))

        try:
            asset_id = int(raw_id)
        except Exception:
            return _json_response(Result.Err("INVALID_INPUT", "Invalid asset_id"))
        if asset_id <= 0:
            return _json_response(Result.Err("INVALID_INPUT", "Invalid asset_id"))

        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)
        if not isinstance(svc, dict):
            return _json_response(Result.Err("SERVICE_UNAVAILABLE", "Index service unavailable"))

        try:
            asset_res = await svc["index"].get_asset(asset_id)
        except Exception as exc:
            return _json_response(Result.Err("QUERY_FAILED", safe_error_message(exc, "Failed to load asset")))
        if not asset_res.ok:
            return _json_response(Result.Err(asset_res.code, asset_res.error or "Failed to load asset"))

        asset = asset_res.data
        if not isinstance(asset, dict) or not asset:
            return _json_response(Result.Err("NOT_FOUND", "Asset not found"))

        raw_path = asset.get("filepath")
        if not raw_path or not isinstance(raw_path, str):
            return _json_response(Result.Err("NOT_FOUND", "Asset path not available"))

        candidate = _normalize_path(raw_path)
        if not candidate:
            return _json_response(Result.Err("INVALID_INPUT", "Invalid asset path"))

        if not (_is_path_allowed(candidate) or _is_path_allowed_custom(candidate)):
            return _json_response(Result.Err("FORBIDDEN", "Path is not within allowed roots"))

        # Best-effort strict resolution for accurate stat; do not follow symlinks outside roots
        resolved = None
        try:
            resolved = candidate.resolve(strict=True)
        except Exception:
            resolved = None

        refresh = (request.query.get("refresh") or "").strip().lower() in ("1", "true", "yes")

        info = build_viewer_media_info(asset, resolved_path=resolved, refresh=refresh)
        try:
            if resolved is not None:
                info["mime"] = _guess_content_type_for_file(resolved)
        except Exception:
            info["mime"] = None

        return _json_response(Result.Ok(info))
