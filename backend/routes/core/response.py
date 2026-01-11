"""
Response utilities for route handlers.
"""
from typing import Optional
from aiohttp import web
from backend.shared import Result


def _json_response(result: Result, status: Optional[int] = None):
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

    response = web.json_response({
        "ok": result.ok,
        "data": result.data,
        "error": result.error,
        "code": result.code,
        "meta": result.meta,
    }, status=status)

    # Optional standard headers derived from Result meta.
    try:
        meta = result.meta if isinstance(result.meta, dict) else {}
        retry_after = meta.get("retry_after")
        if retry_after is not None:
            response.headers["Retry-After"] = str(int(retry_after))
    except Exception:
        pass

    return response
