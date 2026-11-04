"""Typed per-request storage keys shared by Majoor middlewares and handlers.

aiohttp >= 3.13 introduces ``web.RequestKey`` and emits ``NotAppKeyWarning``
for plain-string request storage keys. ComfyUI only pins ``aiohttp>=3.11``, so
we fall back to the historical string keys on older runtimes. Every reader and
writer must go through these constants so both spellings stay consistent.
"""

from __future__ import annotations

from typing import Any

from aiohttp import web

_RequestKey: Any = getattr(web, "RequestKey", None)


def _key(name: str, value_type: Any) -> Any:
    if _RequestKey is None:
        return name
    try:
        return _RequestKey(name, value_type)
    except Exception:
        return name


REQUEST_USER_ID_KEY: Any = _key("mjr_user_id", str)
REQUEST_ID_KEY: Any = _key("mjr_request_id", str)
REQUEST_DURATION_MS_KEY: Any = _key("mjr_duration_ms", float)
REQUEST_STATS_KEY: Any = _key("mjr_stats", dict)

__all__ = [
    "REQUEST_DURATION_MS_KEY",
    "REQUEST_ID_KEY",
    "REQUEST_STATS_KEY",
    "REQUEST_USER_ID_KEY",
]
