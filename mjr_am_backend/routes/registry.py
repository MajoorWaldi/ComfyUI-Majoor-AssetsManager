"""Route registration system."""

from __future__ import annotations

from aiohttp import web
from mjr_am_backend.config import SERVICES_PREWARM_ON_STARTUP
from mjr_am_backend.observability import ensure_observability
from mjr_am_backend.shared import get_logger

from .core import _json_response, _require_authenticated_user
from .registry_app import (
    _install_app_middlewares_best_effort as _install_app_middlewares_best_effort_impl,
)
from .registry_app import (
    _install_background_scan_cleanup as _install_background_scan_cleanup_impl,
)
from .registry_app import (
    _install_observability_on_prompt_server as _install_observability_on_prompt_server_impl,
)
from .registry_app import (
    _install_security_middlewares as _install_security_middlewares_impl,
)
from .registry_app import (
    _is_app_routes_registered as _is_app_routes_registered_impl,
)
from .registry_app import (
    _mark_routes_registered_best_effort as _mark_routes_registered_best_effort_impl,
)
from .registry_app import (
    _prepare_route_table as _prepare_route_table_impl,
)
from .registry_app import (
    _register_app_routes_best_effort as _register_app_routes_best_effort_impl,
)
from .registry_app import (
    _schedule_services_prewarm as _schedule_services_prewarm_impl,
)
from .registry_app import (
    _set_user_manager_best_effort as _set_user_manager_best_effort_impl,
)
from .registry_logging import (
    _extract_app_paths,
    _extract_table_paths,
    _log_route_collisions,
    _log_route_registration_summary,
    _route_verbose_logs_enabled,
)
from .registry_middlewares import (
    _request_path_and_method,
    _requires_auth,
    _store_request_user_id,
    api_versioning_middleware,
    auth_required_middleware,
    security_headers_middleware,
)
from .registry_prompt import PromptServer as PromptServer
from .registry_prompt import _get_prompt_server
from .route_catalog import CORE_ROUTE_REGISTRATIONS, OPTIONAL_ROUTE_REGISTRATIONS

# --- CONFIGURATION ---
_APP_KEY_SECURITY_MIDDLEWARES_INSTALLED: web.AppKey[bool] = web.AppKey(
    "_mjr_security_middlewares_installed", bool
)
_APP_KEY_ROUTES_REGISTERED: web.AppKey[bool] = web.AppKey("_mjr_routes_registered", bool)
_APP_KEY_OBSERVABILITY_INSTALLED: web.AppKey[bool] = web.AppKey("_mjr_observability_installed", bool)
_APP_KEY_USER_MANAGER: web.AppKey[object] = web.AppKey("_mjr_user_manager", object)
_APP_KEY_BG_SCAN_CLEANUP_INSTALLED: web.AppKey[bool] = web.AppKey("_mjr_bg_scan_cleanup_installed", bool)

logger = get_logger(__name__)
_ROUTES_REGISTERED = False


def _auth_error_response_or_none(request: web.Request) -> web.StreamResponse | None:
    """Re-defined locally so tests can monkeypatch r._require_authenticated_user."""
    from mjr_am_backend.shared import Result

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


def _install_security_middlewares(app: web.Application) -> None:
    _install_security_middlewares_impl(
        app,
        auth_required_middleware=auth_required_middleware,
        security_headers_middleware=security_headers_middleware,
        api_versioning_middleware=api_versioning_middleware,
        installed_key=_APP_KEY_SECURITY_MIDDLEWARES_INSTALLED,
        logger=logger,
    )


def _install_background_scan_cleanup(app: web.Application) -> None:
    _install_background_scan_cleanup_impl(
        app,
        installed_key=_APP_KEY_BG_SCAN_CLEANUP_INSTALLED,
        logger=logger,
    )



def _bootstrap_record(name: str, status: str, severity: str = "none", detail: str | None = None) -> None:
    """Best-effort helper — never raises."""
    try:
        from mjr_am_backend.bootstrap_report import record_stage
        record_stage(name, status, severity, detail)
    except Exception:
        pass


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
    verbose = _route_verbose_logs_enabled()

    for route_group in CORE_ROUTE_REGISTRATIONS:
        route_group.register_fn(routes)

    failed_optional: list[str] = []
    for route_group in OPTIONAL_ROUTE_REGISTRATIONS:
        try:
            route_group.register_fn(routes)
            if verbose:
                for msg in route_group.verbose_messages:
                    logger.info(msg)
        except Exception as exc:
            logger.error("Failed to register %s routes: %s", route_group.label, exc)
            failed_optional.append(route_group.label)

    if failed_optional:
        _bootstrap_record(
            "optional_routes",
            "degraded",
            "internal",
            f"failed optional route groups: {', '.join(failed_optional)}",
        )
    else:
        _bootstrap_record("optional_routes", "ok")

    _log_route_registration_summary(verbose)
    _ROUTES_REGISTERED = True
    return routes


def register_routes(app: web.Application, user_manager=None) -> None:
    """
    Register routes onto an aiohttp application.

    This is primarily used for unit tests; in ComfyUI, routes are registered
    via PromptServer decorators at import time.
    """
    if not _prepare_route_table(app, user_manager):
        return
    _install_app_middlewares_best_effort(app)
    if _is_app_routes_registered(app):
        logger.debug("register_routes(app) skipped: routes already registered on this app")
        return
    _register_app_routes_best_effort(app)
    _schedule_services_prewarm()


def _schedule_services_prewarm() -> None:
    _schedule_services_prewarm_impl(
        services_prewarm_on_startup=SERVICES_PREWARM_ON_STARTUP,
        logger=logger,
    )


def _prepare_route_table(app: web.Application, user_manager: object | None) -> bool:
    return _prepare_route_table_impl(
        app,
        user_manager,
        set_user_manager_fn=_set_user_manager_best_effort,
        register_all_routes_fn=register_all_routes,
        logger=logger,
    )


def _set_user_manager_best_effort(app: web.Application, user_manager: object) -> None:
    _set_user_manager_best_effort_impl(
        app,
        user_manager,
        user_manager_key=_APP_KEY_USER_MANAGER,
    )


def _install_app_middlewares_best_effort(app: web.Application) -> None:
    _install_app_middlewares_best_effort_impl(
        app,
        ensure_observability_fn=ensure_observability,
        install_security_middlewares_fn=_install_security_middlewares,
        install_background_scan_cleanup_fn=_install_background_scan_cleanup,
        logger=logger,
    )


def _is_app_routes_registered(app: web.Application) -> bool:
    return _is_app_routes_registered_impl(
        app,
        routes_registered_key=_APP_KEY_ROUTES_REGISTERED,
    )


def _register_app_routes_best_effort(app: web.Application) -> None:
    _register_app_routes_best_effort_impl(
        app,
        get_prompt_server_fn=_get_prompt_server,
        log_route_collisions_fn=_log_route_collisions,
        mark_routes_registered_fn=_mark_routes_registered_best_effort,
        logger=logger,
    )


def _mark_routes_registered_best_effort(app: web.Application) -> None:
    _mark_routes_registered_best_effort_impl(
        app,
        routes_registered_key=_APP_KEY_ROUTES_REGISTERED,
    )


def _install_observability_on_prompt_server() -> None:
    _install_observability_on_prompt_server_impl(
        get_prompt_server_fn=_get_prompt_server,
        ensure_observability_fn=ensure_observability,
        observability_installed_key=_APP_KEY_OBSERVABILITY_INSTALLED,
        install_security_middlewares_fn=_install_security_middlewares,
        logger=logger,
    )
