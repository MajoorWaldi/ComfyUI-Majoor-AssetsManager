"""
Service management and initialization.
"""
import asyncio
import threading
from typing import Any

from mjr_am_backend.config import VECTOR_PREWARM_ON_STARTUP
from mjr_am_backend.deps import build_services
from mjr_am_backend.shared import Result, get_logger

logger = get_logger(__name__)

_services = None
_services_error = None
_services_lock: asyncio.Lock | None = None
_services_lock_guard = threading.Lock()


def _get_services_lock() -> asyncio.Lock:
    global _services_lock
    if _services_lock is not None:
        return _services_lock
    with _services_lock_guard:
        if _services_lock is None:
            # Created lazily so it binds to the running event loop.
            # All callers must be in the same loop (single-loop assumption).
            _services_lock = asyncio.Lock()
        return _services_lock


async def _dispose_services():
    """
    Dispose of all services, ensuring each resource is cleaned up independently.
    Errors in one service disposal do not prevent others from being disposed.
    """
    global _services
    if not _services:
        return

    disposal_errors = []

    # Dispose database connection
    db = _services.get("db")
    if db:
        try:
            await db.aclose()
            logger.debug("Database connection closed successfully")
        except Exception as exc:
            error_msg = f"Error closing database: {exc}"
            logger.warning(error_msg, exc_info=True)
            disposal_errors.append(error_msg)

    # Clear services reference
    _services = None

    # Log summary if there were any errors
    if disposal_errors:
        logger.warning("Service disposal completed with %d error(s)", len(disposal_errors))


async def _build_services(force: bool = False):
    global _services, _services_error
    async with _get_services_lock():
        if _services and not force:
            return _services

        if force:
            await _dispose_services()

        try:
            services_result = await build_services()
        except Exception as exc:
            _services_error = str(exc)
            logger.error(f"Failed to initialize services: {exc}", exc_info=True)
            _services = None
            return None

        if not services_result or not getattr(services_result, "ok", False):
            _services_error = getattr(services_result, "error", None) or "Initialization failed"
            logger.error("Failed to initialize services: %s", _services_error)
            _services = None
            return None

        _services = services_result.data
        _services_error = None
        return _services


async def _require_services() -> tuple[dict[str, Any] | None, Result[Any] | None]:
    services = await _build_services()
    if services:
        return services, None
    return None, Result.Err(
        "SERVICE_UNAVAILABLE",
        "Services are unavailable",
        detail=_services_error or "Initialization failed"
    )


def get_services_error():
    """Get the current services error if any."""
    return _services_error


async def _run_vector_prewarm_step(label: str, runner: Any) -> None:
    try:
        result = await runner()
    except Exception as exc:
        logger.warning("%s failed during startup prewarm: %s", label, exc)
        return

    if not getattr(result, "ok", False):
        logger.warning("%s failed during startup prewarm: %s", label, getattr(result, "error", None) or "unknown error")
        return

    logger.info("%s prewarmed", label)


async def _prewarm_vector_components(services: dict[str, Any] | None) -> None:
    if not VECTOR_PREWARM_ON_STARTUP or not isinstance(services, dict):
        return

    vector_service = services.get("vector_service")
    vector_searcher = services.get("vector_searcher")
    steps: list[asyncio.Future[Any] | asyncio.Task[Any] | Any] = []

    prewarm_text = getattr(vector_service, "prewarm_text_queries", None)
    if callable(prewarm_text):
        steps.append(_run_vector_prewarm_step("Vector text-query model", prewarm_text))

    prewarm_index = getattr(vector_searcher, "prewarm_index", None)
    if callable(prewarm_index):
        steps.append(_run_vector_prewarm_step("Vector search index", prewarm_index))

    if steps:
        await asyncio.gather(*steps)


async def prewarm_services() -> None:
    """Pre-warm services in the background so the first user request is fast."""
    services = await _build_services()
    await _prewarm_vector_components(services)
