"""
Route registration system.
Coordinates all route handlers and registers them with PromptServer or aiohttp app.
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from typing import Any, ClassVar, Protocol, cast

from aiohttp import web
from mjr_am_backend.observability import ensure_observability
from mjr_am_backend.shared import Result, get_logger

from .core import _json_response, _require_authenticated_user
from .handlers import (
    register_asset_routes,
    register_batch_zip_routes,
    register_calendar_routes,
    register_collections_routes,
    register_custom_roots_routes,
    register_db_maintenance_routes,
    register_download_routes,
    register_duplicates_routes,
    register_health_routes,
    register_metadata_routes,
    register_releases_routes,
    register_scan_routes,
    register_search_routes,
    register_version_routes,
    register_viewer_routes,
)

# --- CONFIGURATION ---
API_PREFIX = "/mjr/am/"
_SENSITIVE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}
_APP_KEY_SECURITY_MIDDLEWARES_INSTALLED: web.AppKey[bool] = web.AppKey(
    "_mjr_security_middlewares_installed", bool
)
_APP_KEY_ROUTES_REGISTERED: web.AppKey[bool] = web.AppKey("_mjr_routes_registered", bool)
_APP_KEY_OBSERVABILITY_INSTALLED: web.AppKey[bool] = web.AppKey("_mjr_observability_installed", bool)
_APP_KEY_USER_MANAGER: web.AppKey[object] = web.AppKey("_mjr_user_manager", object)
_APP_KEY_BG_SCAN_CLEANUP_INSTALLED: web.AppKey[bool] = web.AppKey("_mjr_bg_scan_cleanup_installed", bool)


class _PromptServerInstance(Protocol):
    routes: web.RouteTableDef
    app: web.Application | None
    def send_sync(self, event: str, data: object) -> None: ...


class _PromptServer(Protocol):
    instance: ClassVar[_PromptServerInstance]

class _PromptServerInstanceStub:
    routes: web.RouteTableDef = web.RouteTableDef()
    app: web.Application | None = None
    def send_sync(self, event: str, data: object) -> None:
        return None


class _PromptServerStub:
    instance: ClassVar[_PromptServerInstanceStub] = _PromptServerInstanceStub()


def _get_prompt_server() -> type[_PromptServer]:
    # IMPORTANT (ComfyUI compatibility):
    # Never `import server` here. Importing ComfyUI's `server.py` can trigger heavy
    # initialization cascades in non-Comfy contexts.
    import sys

    try:
        _server_mod = sys.modules.get("server")
        if _server_mod is None or not hasattr(_server_mod, "PromptServer"):
            raise ImportError("ComfyUI server not loaded")
        return cast(type[_PromptServer], _server_mod.PromptServer)
    except Exception:
        return cast(type[_PromptServer], _PromptServerStub)


class _PromptServerProxy:
    @property
    def instance(self) -> _PromptServerInstance:
        return _get_prompt_server().instance


# Public compatibility symbol used by several modules.
PromptServer = _PromptServerProxy()

logger = get_logger(__name__)
_ROUTES_REGISTERED = False


def _extract_app_paths(app: web.Application) -> set[str]:
    paths: set[str] = set()
    try:
        for route in app.router.routes():
            try:
                resource = getattr(route, "resource", None)
                canonical = getattr(resource, "canonical", None)
                if isinstance(canonical, str) and canonical:
                    paths.add(canonical)
            except Exception:
                continue
    except Exception:
        pass
    return paths


def _extract_table_paths(routes: web.RouteTableDef) -> set[str]:
    paths: set[str] = set()
    try:
        for item in routes:
            path = getattr(item, "path", None)
            if isinstance(path, str) and path:
                paths.add(path)
    except Exception:
        pass
    return paths


def _log_route_collisions(app: web.Application, routes: web.RouteTableDef) -> None:
    try:
        app_paths = _extract_app_paths(app)
        table_paths = _extract_table_paths(routes)
        overlaps = sorted(app_paths.intersection(table_paths))
        if overlaps:
            logger.warning(
                "Potential route path collisions detected before registration: %s",
                ", ".join(overlaps[:20]),
            )
    except Exception:
        pass


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
    # FIX: Utilisation de la constante au lieu du hardcoding
    if not path.startswith(API_PREFIX):
        return response

    try:
        # API responses should never be treated as a document.
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


@web.middleware
async def auth_required_middleware(
    request: web.Request,
    handler: Callable[[web.Request], Awaitable[web.StreamResponse]],
) -> web.StreamResponse:
    """
    Require authenticated ComfyUI user for sensitive Majoor routes when auth is enabled.
    """
    path, method = _request_path_and_method(request)
    if _requires_auth(path, method):
        failure = _auth_error_response_or_none(request)
        if failure is not None:
            return failure

    return await handler(request)


def _request_path_and_method(request: web.Request) -> tuple[str, str]:
    try:
        return request.path or "", str(request.method or "GET").upper()
    except Exception:
        return "", "GET"


def _requires_auth(path: str, method: str) -> bool:
    return path.startswith(API_PREFIX) and method in _SENSITIVE_METHODS


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


def _store_request_user_id(request: web.Request, user_id: Any) -> None:
    try:
        request["mjr_user_id"] = str(user_id or "").strip()
    except Exception:
        pass


def _install_security_middlewares(app: web.Application) -> None:
    try:
        if app.get(_APP_KEY_SECURITY_MIDDLEWARES_INSTALLED):
            return
        app.middlewares.insert(0, auth_required_middleware)
        app.middlewares.insert(0, security_headers_middleware)
        app.middlewares.insert(0, api_versioning_middleware)
        app[_APP_KEY_SECURITY_MIDDLEWARES_INSTALLED] = True
    except Exception as exc:
        logger.debug("Failed to install security middlewares: %s", exc)


def _install_background_scan_cleanup(app: web.Application) -> None:
    try:
        if app.get(_APP_KEY_BG_SCAN_CLEANUP_INSTALLED):
            return
    except Exception:
        pass

    async def _on_cleanup(_app: web.Application) -> None:
        try:
            from .handlers.filesystem import stop_background_scan_worker

            await stop_background_scan_worker(drain=True, timeout_s=2.0)
        except Exception:
            return

    try:
        app.on_cleanup.append(_on_cleanup)
        app[_APP_KEY_BG_SCAN_CLEANUP_INSTALLED] = True
    except Exception as exc:
        logger.debug("Failed to install background scan cleanup hook: %s", exc)


def register_all_routes() -> web.RouteTableDef:
    """
    Register all route handlers and return the RouteTableDef.
    This is the central registration point for all routes.
    """
    global _ROUTES_REGISTERED
    routes = _get_prompt_server().instance.routes
    if _ROUTES_REGISTERED:
        logger.debug("register_all_routes() skipped: already registered")
        return routes

    # Register all handler modules
    register_health_routes(routes)
    register_metadata_routes(routes)
    register_custom_roots_routes(routes)
    register_search_routes(routes)
    register_scan_routes(routes)
    register_asset_routes(routes)
    register_collections_routes(routes)
    register_batch_zip_routes(routes)
    register_calendar_routes(routes)
    register_viewer_routes(routes)
    register_db_maintenance_routes(routes)
    # Register releases route (exposes tags/branches + zip template)
    try:
        register_releases_routes(routes)
        logger.info("  GET /mjr/am/releases (Added)")
    except Exception as e:
        logger.error(f"Failed to register releases routes: {e}")

    try:
        register_version_routes(routes)
        logger.info("  GET /mjr/am/version (Added)")
        logger.info("  GET /majoor/version (Legacy alias)")
    except Exception as e:
        logger.error(f"Failed to register version route: {e}")

    # FIX: Enregistrement de la route de tÃ©lÃ©chargement
    try:
        register_download_routes(routes)
        register_duplicates_routes(routes)
        logger.info("  GET /mjr/am/download (Added)")
    except Exception as e:
        logger.error(f"Failed to register download routes: {e}")

    logger.info("=" * 60)
    logger.info("Routes registered:")
    logger.info("  GET /mjr/am/health")
    logger.info("  GET /mjr/am/health/counters")
    logger.info("  GET /mjr/am/health/db")
    logger.info("  GET /mjr/am/config")
    logger.info("  GET /mjr/am/tools/status")
    logger.info("  GET /mjr/am/metadata?type=<scope>&filename=<name>&subfolder=<sub>&root_id=<id>")
    logger.info("  POST /mjr/am/scan")
    logger.info("  POST /mjr/am/index-files")
    logger.info("  POST /mjr/am/stage-to-input")
    logger.info("  POST /mjr/am/open-in-folder")
    logger.info("  GET /mjr/am/search?q=<query>")
    logger.info("  GET /mjr/am/asset/{asset_id}")
    logger.info("  POST /mjr/am/asset/rename")
    logger.info("  POST /mjr/am/assets/delete")
    logger.info("  POST /mjr/am/assets/rename")
    logger.info("  GET /mjr/am/collections")
    logger.info("  GET /mjr/am/date-histogram?month=YYYY-MM")
    logger.info("  POST /mjr/am/batch-zip")
    logger.info("  GET /mjr/am/batch-zip/{token}")
    logger.info("  GET /mjr/am/viewer/info?asset_id=<id>")
    logger.info("  POST /mjr/am/db/optimize")
    logger.info("  POST /mjr/am/db/cleanup-case-duplicates")
    logger.info("  POST /mjr/am/db/force-delete")
    logger.info("  GET /mjr/am/download")
    logger.info("  GET /mjr/am/releases")
    logger.info("  GET /mjr/am/duplicates/alerts")
    logger.info("=" * 60)

    _ROUTES_REGISTERED = True
    return routes


def register_routes(app: web.Application, user_manager=None) -> None:
    """
    Register routes onto an aiohttp application.

    This is primarily used for unit tests; in ComfyUI, routes are registered
    via PromptServer decorators at import time.
    """
    try:
        if user_manager is not None:
            try:
                app[_APP_KEY_USER_MANAGER] = user_manager
            except Exception:
                pass
        # Ensure decorators are registered exactly once globally.
        register_all_routes()
    except Exception as exc:
        logger.warning("Failed to prepare route table: %s", exc)
        return

    try:
        ensure_observability(app)
    except Exception as exc:
        logger.debug("Observability not installed on aiohttp app: %s", exc)
    try:
        _install_security_middlewares(app)
    except Exception as exc:
        logger.debug("Security middlewares not installed on aiohttp app: %s", exc)
    try:
        _install_background_scan_cleanup(app)
    except Exception as exc:
        logger.debug("Background scan cleanup hook not installed: %s", exc)

    try:
        if app.get(_APP_KEY_ROUTES_REGISTERED):
            logger.debug("register_routes(app) skipped: routes already registered on this app")
            return
    except Exception:
        pass

    try:
        route_table = _get_prompt_server().instance.routes
        _log_route_collisions(app, route_table)
        app.add_routes(route_table)
        try:
            app[_APP_KEY_ROUTES_REGISTERED] = True
        except Exception:
            pass
    except Exception as exc:
        logger.warning("Failed to register routes on aiohttp app: %s", exc)


def _install_observability_on_prompt_server() -> None:
    """
    Best-effort installation of the middleware into ComfyUI's PromptServer app.
    If PromptServer doesn't expose `app`, this safely no-ops.
    """
    try:
        app = getattr(_get_prompt_server().instance, "app", None)
        if app is not None:
            if not app.get(_APP_KEY_OBSERVABILITY_INSTALLED):
                ensure_observability(app)
                app[_APP_KEY_OBSERVABILITY_INSTALLED] = True
            _install_security_middlewares(app)
    except Exception as exc:
        logger.debug("Observability not installed on PromptServer app: %s", exc)
        return
