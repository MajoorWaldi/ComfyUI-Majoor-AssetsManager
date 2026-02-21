"""
Response utilities for route handlers.
"""

import math
from aiohttp import web
from mjr_am_backend.shared import Result


def safe_error_message(exc: Exception, generic_message: str) -> str:
    """
    Return a safe message for clients.

    By default, avoid leaking internal details. When `MJR_DEBUG` is enabled,
    include the exception string to help debugging.
    """
    try:
        debug = str(__import__("os").environ.get("MJR_DEBUG", "")).strip().lower() in ("1", "true", "yes", "on")
    except Exception:
        debug = False
    if debug:
        try:
            return f"{generic_message}: {exc}"
        except Exception:
            return generic_message
    return generic_message


def _json_response(result: Result, status: int | None = None):
    """
    Convert Result to JSON response.

    Args:
        result: Result object
        status: HTTP status code (optional, auto-determined if None)

    Returns:
        aiohttp web.Response
    """
    # Majoor policy: business / validation errors return HTTP 200 with {ok:false,...}.
    # Use explicit status only for genuine server bugs/unhandled exceptions.
    if status is None:
        status = 200

    payload = _sanitize_json_payload(
        {
            "ok": result.ok,
            "data": result.data,
            "error": result.error,
            "code": result.code,
            "meta": result.meta,
        }
    )

    response = web.json_response(payload, status=status)

    # Optional standard headers derived from Result meta.
    try:
        meta = result.meta if isinstance(result.meta, dict) else {}
        retry_after = meta.get("retry_after")
        if retry_after is not None:
            response.headers["Retry-After"] = str(int(retry_after))
    except Exception:
        pass

    return response


def _sanitize_json_payload(value):
    """
    Normalize payload values so they are always valid strict JSON.
    - Converts NaN/Infinity floats to None.
    - Recurses through dict/list/tuple containers.
    """
    if isinstance(value, float):
        return value if math.isfinite(value) else None
    if isinstance(value, dict):
        return {k: _sanitize_json_payload(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_sanitize_json_payload(v) for v in value]
    if isinstance(value, tuple):
        return [_sanitize_json_payload(v) for v in value]
    return value
