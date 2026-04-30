"""Installation helpers for observability."""

from __future__ import annotations

import asyncio
import threading
from typing import Any

from aiohttp import web

from .config import OBS_INSTALL_GLOBAL_ASYNCIO_HANDLER
from .observability_runtime import _is_client_disconnect, request_context_middleware
from .shared import get_logger

logger = get_logger(__name__)

_APPKEY_OBS_INSTALLED = web.AppKey("mjr_observability_installed", bool)
_OBS_INSTALL_LOCK = threading.Lock()
_ASYNCIO_HANDLER_LOCK = threading.Lock()
_ASYNCIO_HANDLER_INSTALLED = False


def ensure_observability(app: web.Application) -> None:
    """Install middleware once."""
    with _OBS_INSTALL_LOCK:
        try:
            if app.get(_APPKEY_OBS_INSTALLED):
                return
            app[_APPKEY_OBS_INSTALLED] = True
        except Exception:
            return

        try:
            app.middlewares.append(request_context_middleware)
        except Exception as exc:
            logger.debug("Failed to install observability middleware: %s", exc)

    _install_asyncio_exception_handler()


def _install_asyncio_exception_handler() -> None:
    global _ASYNCIO_HANDLER_INSTALLED
    if not OBS_INSTALL_GLOBAL_ASYNCIO_HANDLER:
        return
    with _ASYNCIO_HANDLER_LOCK:
        if _ASYNCIO_HANDLER_INSTALLED:
            return

        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            return

        original_handler = loop.get_exception_handler()

        def _quiet_exception_handler(loop: asyncio.AbstractEventLoop, context: dict[str, Any]) -> None:
            exc = context.get("exception")
            if exc is not None and _is_client_disconnect(exc):
                return
            if original_handler is not None:
                original_handler(loop, context)
            else:
                loop.default_exception_handler(context)

        try:
            loop.set_exception_handler(_quiet_exception_handler)
            _ASYNCIO_HANDLER_INSTALLED = True
            logger.debug("Installed asyncio exception handler for client disconnect errors")
        except Exception as exc:
            logger.debug("Failed to install asyncio exception handler: %s", exc)


__all__ = ["ensure_observability", "_APPKEY_OBS_INSTALLED", "_install_asyncio_exception_handler"]
