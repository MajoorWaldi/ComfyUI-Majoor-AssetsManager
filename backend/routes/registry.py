"""
Route registration system.
Coordinates all route handlers and registers them with PromptServer or aiohttp app.
"""
from aiohttp import web
from backend.shared import get_logger
from backend.observability import ensure_observability

try:
    from server import PromptServer  # type: ignore
except Exception:
    class _PromptServerStub:
        instance = type("PromptServerInstance", (), {"routes": web.RouteTableDef()})()

    PromptServer = _PromptServerStub  # type: ignore

from .handlers import (
    register_health_routes,
    register_metadata_routes,
    register_custom_roots_routes,
    register_search_routes,
    register_scan_routes,
    register_asset_routes,
)

logger = get_logger(__name__)


def register_all_routes() -> web.RouteTableDef:
    """
    Register all route handlers and return the RouteTableDef.
    This is the central registration point for all routes.
    """
    routes = PromptServer.instance.routes

    # Register all handler modules
    register_health_routes(routes)
    register_metadata_routes(routes)
    register_custom_roots_routes(routes)
    register_search_routes(routes)
    register_scan_routes(routes)
    register_asset_routes(routes)

    logger.info("=" * 60)
    logger.info("Routes registered:")
    logger.info("  GET /mjr/am/health")
    logger.info("  GET /mjr/am/health/counters")
    logger.info("  GET /mjr/am/config")
    logger.info("  GET /mjr/am/tools/status")
    logger.info("  GET /mjr/am/metadata?path=<file>")
    logger.info("  POST /mjr/am/scan")
    logger.info("  POST /mjr/am/index-files")
    logger.info("  POST /mjr/am/stage-to-input")
    logger.info("  POST /mjr/am/open-in-folder")
    logger.info("  GET /mjr/am/search?q=<query>")
    logger.info("  GET /mjr/am/asset/{asset_id}")
    logger.info("  POST /mjr/am/assets/delete")
    logger.info("  POST /mjr/am/assets/rename")
    logger.info("=" * 60)

    return routes


def register_routes(app: web.Application) -> None:
    """
    Register routes onto an aiohttp application.

    This is primarily used for unit tests; in ComfyUI, routes are registered
    via PromptServer decorators at import time.
    """
    try:
        ensure_observability(app)
    except Exception as exc:
        logger.debug("Observability not installed on aiohttp app: %s", exc)
    try:
        app.add_routes(PromptServer.instance.routes)
    except Exception as exc:
        logger.warning("Failed to register routes on aiohttp app: %s", exc)


def _install_observability_on_prompt_server() -> None:
    """
    Best-effort installation of the middleware into ComfyUI's PromptServer app.
    If PromptServer doesn't expose `app`, this safely no-ops.
    """
    try:
        app = getattr(PromptServer.instance, "app", None)
        if app is not None:
            ensure_observability(app)
    except Exception as exc:
        logger.debug("Observability not installed on PromptServer app: %s", exc)
        return
