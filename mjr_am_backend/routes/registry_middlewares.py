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
_SENSITIVE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


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
    if not path.startswith(API_PREFIX):
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

    prefix = API_PREFIX + "v1"
    if path == prefix or path.startswith(prefix + "/"):
        tail = path[len(prefix):] or "/"
        target = API_PREFIX.rstrip("/") + tail
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
    return path.startswith(API_PREFIX) and method in _SENSITIVE_METHODS


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
