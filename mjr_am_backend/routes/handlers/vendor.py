"""
Vendor file serving endpoint.

Serves static vendor assets (e.g. Three.js) from the extension's ``vendor/``
directory, which lives *outside* the ComfyUI ``WEB_DIRECTORY`` so that Vite
does not discover or preload these files at startup.
"""

from __future__ import annotations

import mimetypes
from pathlib import Path

from aiohttp import web
from mjr_am_backend.shared import Result, get_logger

from ..core import _json_response

_logger = get_logger(__name__)

# Resolve once at import time – the vendor directory sits at the extension root.
_VENDOR_ROOT = Path(__file__).resolve().parents[3] / "vendor"

# Allowed file extensions to serve (whitelist for safety).
_ALLOWED_EXTENSIONS: frozenset[str] = frozenset({
    ".js", ".mjs", ".wasm", ".json", ".txt", ".md",
})


def register_vendor_routes(routes: web.RouteTableDef) -> None:
    """Register the vendor static-file route."""

    async def _serve_vendor_static(request: web.Request) -> web.StreamResponse:
        raw_path = request.match_info.get("path", "")
        if not raw_path:
            return _json_response(Result.Err("INVALID_INPUT", "Missing path"))

        # Resolve and jail to _VENDOR_ROOT.
        try:
            target = (_VENDOR_ROOT / raw_path).resolve(strict=True)
        except (FileNotFoundError, OSError):
            return web.Response(status=404, text="Not found")

        # Security: ensure target is inside vendor root.
        try:
            target.relative_to(_VENDOR_ROOT.resolve())
        except ValueError:
            return web.Response(status=403, text="Forbidden")

        if not target.is_file():
            return web.Response(status=404, text="Not found")

        if target.suffix.lower() not in _ALLOWED_EXTENSIONS:
            return web.Response(status=403, text="Forbidden file type")

        content_type = mimetypes.guess_type(str(target))[0] or "application/octet-stream"
        # .js files should be served as ES modules.
        if target.suffix.lower() in (".js", ".mjs"):
            content_type = "text/javascript"

        resp = web.FileResponse(path=str(target))
        try:
            resp.headers["Content-Type"] = content_type
            # Vendor files are versioned with the extension – aggressive caching is safe.
            resp.headers["Cache-Control"] = "public, max-age=86400, stale-while-revalidate=3600"
            resp.headers["X-Content-Type-Options"] = "nosniff"
        except Exception:
            pass
        return resp

    @routes.get("/mjr/am/vendor/{path:.*}")
    async def vendor_static(request: web.Request) -> web.StreamResponse:
        return await _serve_vendor_static(request)

    @routes.get("/extensions/majoor-assetsmanager/vendor/{path:.*}")
    async def vendor_static_legacy(request: web.Request) -> web.StreamResponse:
        return await _serve_vendor_static(request)

    @routes.get("/extensions/ComfyUI-Majoor-AssetsManager/vendor/{path:.*}")
    async def vendor_static_repo_name(request: web.Request) -> web.StreamResponse:
        return await _serve_vendor_static(request)
