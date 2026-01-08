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
    if status is None:
        if result.ok:
            status = 200
        else:
            error_code = result.code or ""
            if error_code in ("INVALID_INPUT", "INVALID_JSON", "EMPTY_QUERY", "QUERY_TOO_LONG", "RATE_LIMIT"):
                status = 400 if error_code != "RATE_LIMIT" else 429
            elif error_code in ("NOT_FOUND", "DIR_NOT_FOUND"):
                status = 404
            elif error_code in ("SERVICE_UNAVAILABLE",):
                status = 503
            elif error_code in ("CSRF",):
                status = 403
            elif error_code in ("DB_ERROR", "SCAN_FAILED", "SEARCH_FAILED"):
                status = 500
            else:
                status = 400

    return web.json_response({
        "ok": result.ok,
        "data": result.data,
        "error": result.error,
        "code": result.code,
        "meta": result.meta,
    }, status=status)
