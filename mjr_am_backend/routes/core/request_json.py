"""
Safe JSON request parsing with size limits.

Guarantees:
- Never raises to handlers (returns Result)
- Enforces an upper bound on JSON payload size to avoid memory DoS
"""

from __future__ import annotations

import json
import os
from typing import Any, Optional

from aiohttp import web

from mjr_am_backend.shared import Result, ErrorCode

DEFAULT_MAX_JSON_BYTES = 10 * 1024 * 1024  # 10MB
MIN_JSON_BYTES = 1024
REQUEST_STREAM_CHUNK_BYTES = 64 * 1024


def _max_json_bytes() -> int:
    try:
        raw = os.environ.get("MJR_MAX_JSON_SIZE", "")
        if raw:
            n = int(raw)
            if n > 0:
                return n
    except Exception:
        pass
    return DEFAULT_MAX_JSON_BYTES


async def _read_json(request: web.Request, *, max_bytes: Optional[int] = None) -> Result[dict]:
    """
    Read and decode a JSON request body with a strict max size.

    Returns:
        Result.Ok(dict) or Result.Err(code, error, ...)
    """
    limit = int(max_bytes) if max_bytes is not None else _max_json_bytes()
    limit = max(MIN_JSON_BYTES, limit)

    length_error = _content_length_error(request, limit)
    if length_error is not None:
        return length_error
    body = await _read_request_body_limited(request, limit)
    if not body.ok:
        return Result.Err(body.code or ErrorCode.INVALID_JSON, body.error or "Invalid request body", **(body.meta or {}))
    payload = body.data
    if not isinstance(payload, (bytes, bytearray)):
        return Result.Err(ErrorCode.INVALID_JSON, "Invalid request body payload")
    return _decode_and_parse_json_dict(bytes(payload))


def _content_length_error(request: web.Request, limit: int) -> Optional[Result[dict]]:
    try:
        cl = request.headers.get("Content-Length")
        if not cl:
            return None
        size = int(cl)
        if size <= limit:
            return None
        return Result.Err(ErrorCode.INVALID_INPUT, f"JSON body too large ({size} > {limit})", limit=limit, size=size)
    except Exception:
        return None


async def _read_request_body_limited(request: web.Request, limit: int) -> Result[bytes]:
    buf = bytearray()
    try:
        async for chunk in request.content.iter_chunked(REQUEST_STREAM_CHUNK_BYTES):
            if not chunk:
                continue
            buf.extend(chunk)
            if len(buf) > limit:
                return Result.Err(ErrorCode.INVALID_INPUT, f"JSON body too large (> {limit})", limit=limit, size=len(buf))
    except Exception as exc:
        return Result.Err(ErrorCode.INVALID_JSON, f"Failed to read request body: {exc}")
    return Result.Ok(bytes(buf))


def _decode_and_parse_json_dict(body: bytes) -> Result[dict]:
    try:
        text = body.decode("utf-8", errors="strict")
    except Exception as exc:
        return Result.Err(ErrorCode.INVALID_JSON, f"Invalid UTF-8 JSON body: {exc}")
    try:
        parsed: Any = json.loads(text) if text else {}
    except Exception as exc:
        return Result.Err(ErrorCode.INVALID_JSON, f"Invalid JSON body: {exc}")
    if not isinstance(parsed, dict):
        return Result.Err(ErrorCode.INVALID_JSON, "JSON body must be an object")
    return Result.Ok(parsed)
