"""aiohttp middleware definitions for the Majoor API."""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from typing import Any

from aiohttp import web
from mjr_am_backend.shared import Result

from .core import (
    _get_request_user_id,
    _json_response,
    _push_request_user_context,
    _require_authenticated_user,
    _reset_request_user_context,
)

API_PREFIX = "/mjr/am/"

# The OpenAPI-aligned read-only compat surface (routes/handlers/api_v2_assets.py).
# It is part of this extension's HTTP surface and must sit behind the same
# security boundary as API_PREFIX.
COMPAT_API_PREFIX = "/api/v2/assets"

# ComfyUI's PromptServer mirrors EVERY registered route under an additional
# "/api" prefix -- see `add_routes()` in ComfyUI/server.py, which rebuilds the
# route table as `api_routes.route(route.method, "/api" + route.path)` before
# adding both tables to the app. So /mjr/am/x is also served at /api/mjr/am/x.
# Middleware that matches only the canonical prefix silently does NOT apply to
# the mirrored path, which previously let a request to /api/mjr/am/<mutation>
# skip the authentication check entirely.
_COMFY_API_MIRROR_PREFIX = "/api"

_MAJOOR_PATH_PREFIXES: tuple[str, ...] = tuple(
    prefix
    for canonical in (API_PREFIX, COMPAT_API_PREFIX)
    for prefix in (canonical, _COMFY_API_MIRROR_PREFIX + canonical)
)

def _is_majoor_path(path: str) -> bool:
    """True when ``path`` addresses this extension's own HTTP surface.

    Matches the canonical prefixes and ComfyUI's mirrored ``/api`` variants, so
    every middleware guarding this extension applies to both spellings of the
    same route.
    """
    try:
        return str(path or "").startswith(_MAJOOR_PATH_PREFIXES)
    except Exception:
        return False

# Paths under which ComfyUI serves our `WEB_DIRECTORY` (dist/). We force
# revalidation on these so users always get the freshly built bundle after a
# plugin update — mirroring the no-store fix the ComfyUI core applied to its
# own frontend chunks (PR #12911).
_STATIC_EXTENSION_PREFIXES = (
    "/extensions/majoor-assetsmanager/",
    "/extensions/ComfyUI-Majoor-AssetsManager/",
    "/api/extensions/majoor-assetsmanager/",
    "/api/extensions/ComfyUI-Majoor-AssetsManager/",
)


@web.middleware
async def static_extension_cache_middleware(
    request: web.Request,
    handler: Callable[[web.Request], Awaitable[web.StreamResponse]],
) -> web.StreamResponse:
    """Force revalidation for the plugin's compiled JS/CSS chunks.

    Without this, browsers happily cache stale chunks across upgrades and the
    user gets a half-broken UI until a hard reload. Modeled after Comfy core's
    middleware fix for stale frontend chunks.
    """
    response = await handler(request)
    try:
        path = request.path or ""
    except Exception:
        return response
    if not any(path.startswith(prefix) for prefix in _STATIC_EXTENSION_PREFIXES):
        return response
    try:
        # `no-cache` (not `no-store`) preserves ETag/304 revalidation, which is
        # cheaper than re-downloading the whole bundle.
        response.headers["Cache-Control"] = "no-cache, must-revalidate"
        response.headers.setdefault("Pragma", "no-cache")
    except Exception:
        pass
    return response


@web.middleware
async def security_headers_middleware(
    request: web.Request,
    handler: Callable[[web.Request], Awaitable[web.StreamResponse]],
) -> web.StreamResponse:
    """Apply strict security headers to Majoor API responses only."""
    response = await handler(request)

    # Only apply to Majoor API endpoints. Applying `nosniff` / CSP globally can break
    # ComfyUI's own static assets (e.g. user.css) and frontend runtime.
    try:
        path = request.path or ""
    except Exception:
        path = ""
    if not _is_majoor_path(path):
        return response

    try:
        response.headers.setdefault("Content-Security-Policy", "default-src 'none'")
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("Cache-Control", "no-store, no-cache, must-revalidate")
        response.headers.setdefault("Pragma", "no-cache")
    except Exception:
        pass

    return response


@web.middleware
async def api_versioning_middleware(
    request: web.Request,
    handler: Callable[[web.Request], Awaitable[web.StreamResponse]],
) -> web.StreamResponse:
    """
    Support versioned routes without breaking existing clients.

    `/mjr/am/v1/...` redirects to legacy `/mjr/am/...` using 308 (method-preserving).
    """
    try:
        path = request.path or ""
    except Exception:
        path = ""

    # Handle the canonical path and ComfyUI's mirrored "/api" variant, keeping
    # the caller on whichever spelling they used.
    for mirror in ("", _COMFY_API_MIRROR_PREFIX):
        prefix = mirror + API_PREFIX + "v1"
        if path == prefix or path.startswith(prefix + "/"):
            tail = path[len(prefix):] or "/"
            target = mirror + API_PREFIX.rstrip("/") + tail
            qs = ""
            try:
                qs = request.query_string or ""
            except Exception:
                qs = ""
            if qs:
                target = target + "?" + qs
            raise web.HTTPPermanentRedirect(location=target)

    return await handler(request)


def _request_path_and_method(request: web.Request) -> tuple[str, str]:
    try:
        return request.path or "", str(request.method or "GET").upper()
    except Exception:
        return "", "GET"


def _requires_auth(path: str, method: str) -> bool:
    """Every request on this extension's HTTP surface requires auth when Comfy
    auth is enabled -- reads leak the same custom-root paths, tags, ratings and
    generation metadata that writes would let an attacker tamper with, so GET
    must sit behind the same boundary as POST/PUT/PATCH/DELETE. ``method`` is
    accepted for backward compatibility with existing call sites but no longer
    changes the outcome; ``_require_authenticated_user`` itself is a no-op
    (auth_mode="disabled"/"unavailable") on the default single-user setup, so
    this costs nothing until Comfy's own multi-user auth is turned on.
    """
    return _is_majoor_path(path)


def _store_request_user_id(request: web.Request, user_id: Any) -> None:
    try:
        request["mjr_user_id"] = str(user_id or "").strip()
    except Exception:
        pass


def _auth_error_response_or_none(request: web.Request) -> web.StreamResponse | None:
    auth = _require_authenticated_user(request)
    if not auth.ok:
        return _json_response(
            Result.Err(
                auth.code or "AUTH_REQUIRED",
                auth.error or "Authentication required. Please sign in first.",
            ),
            status=401,
        )
    _store_request_user_id(request, auth.data)
    return None


@web.middleware
async def auth_required_middleware(
    request: web.Request,
    handler: Callable[[web.Request], Awaitable[web.StreamResponse]],
) -> web.StreamResponse:
    """
    Require authenticated ComfyUI user for sensitive Majoor routes when auth is enabled.
    """
    token = _push_request_user_context(request)
    try:
        path, method = _request_path_and_method(request)
        user_id = _get_request_user_id(request)
        if user_id:
            _store_request_user_id(request, user_id)
        if _requires_auth(path, method):
            failure = _auth_error_response_or_none(request)
            if failure is not None:
                return failure

        return await handler(request)
    finally:
        _reset_request_user_context(token)
