"""App-installation helpers for route registration."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from aiohttp import web


def _install_security_middlewares(
    app: web.Application,
    *,
    auth_required_middleware: Any,
    security_headers_middleware: Any,
    api_versioning_middleware: Any,
    installed_key: web.AppKey[bool],
    logger: Any,
) -> None:
    try:
        if app.get(installed_key):
            return
        app.middlewares.insert(0, auth_required_middleware)
        app.middlewares.insert(0, security_headers_middleware)
        app.middlewares.insert(0, api_versioning_middleware)
        app[installed_key] = True
        try:
            from mjr_am_backend.bootstrap_report import record_stage
            record_stage("security_middlewares", "ok")
        except Exception:
            pass
    except Exception as exc:
        logger.debug("Failed to install security middlewares: %s", exc)
        try:
            from mjr_am_backend.bootstrap_report import record_stage
            record_stage("security_middlewares", "degraded", "fatal", str(exc)[:120])
        except Exception:
            pass


def _install_background_scan_cleanup(
    app: web.Application,
    *,
    installed_key: web.AppKey[bool],
    logger: Any,
) -> None:
    try:
        if app.get(installed_key):
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
        app[installed_key] = True
    except Exception as exc:
        logger.debug("Failed to install background scan cleanup hook: %s", exc)


def _schedule_services_prewarm(*, services_prewarm_on_startup: bool, logger: Any) -> None:
    if not services_prewarm_on_startup:
        return
    import asyncio

    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        return
    try:
        from mjr_am_backend.routes.core.services import prewarm_services

        loop.create_task(prewarm_services())
        logger.debug("Services pre-warm task scheduled")
    except Exception as exc:
        logger.debug("Could not schedule services pre-warm: %s", exc)


def _prepare_route_table(
    app: web.Application,
    user_manager: object | None,
    *,
    set_user_manager_fn: Callable[[web.Application, object], None],
    register_all_routes_fn: Callable[[], web.RouteTableDef],
    logger: Any,
) -> bool:
    try:
        if user_manager is not None:
            set_user_manager_fn(app, user_manager)
        register_all_routes_fn()
        return True
    except Exception as exc:
        logger.warning("Failed to prepare route table: %s", exc)
        return False


def _set_user_manager_best_effort(
    app: web.Application,
    user_manager: object,
    *,
    user_manager_key: web.AppKey[object],
) -> None:
    try:
        app[user_manager_key] = user_manager
    except Exception:
        return


def _install_app_middlewares_best_effort(
    app: web.Application,
    *,
    ensure_observability_fn: Callable[[web.Application], None],
    install_security_middlewares_fn: Callable[[web.Application], None],
    install_background_scan_cleanup_fn: Callable[[web.Application], None],
    logger: Any,
) -> None:
    try:
        ensure_observability_fn(app)
    except Exception as exc:
        logger.debug("Observability not installed on aiohttp app: %s", exc)
    try:
        install_security_middlewares_fn(app)
    except Exception as exc:
        logger.debug("Security middlewares not installed on aiohttp app: %s", exc)
    try:
        install_background_scan_cleanup_fn(app)
    except Exception as exc:
        logger.debug("Background scan cleanup hook not installed: %s", exc)


def _is_app_routes_registered(
    app: web.Application, *, routes_registered_key: web.AppKey[bool]
) -> bool:
    try:
        return bool(app[routes_registered_key])
    except KeyError:
        return False
    except Exception:
        return False


def _register_app_routes_best_effort(
    app: web.Application,
    *,
    get_prompt_server_fn: Callable[[], Any],
    log_route_collisions_fn: Callable[[web.Application, web.RouteTableDef], None],
    mark_routes_registered_fn: Callable[[web.Application], None],
    logger: Any,
) -> None:
    try:
        route_table = get_prompt_server_fn().instance.routes
        log_route_collisions_fn(app, route_table)
        app.add_routes(route_table)
        mark_routes_registered_fn(app)
    except Exception as exc:
        logger.warning("Failed to register routes on aiohttp app: %s", exc)


def _mark_routes_registered_best_effort(
    app: web.Application, *, routes_registered_key: web.AppKey[bool]
) -> None:
    try:
        app[routes_registered_key] = True
    except Exception:
        return


def _install_observability_on_prompt_server(
    *,
    get_prompt_server_fn: Callable[[], Any],
    ensure_observability_fn: Callable[[web.Application], None],
    observability_installed_key: web.AppKey[bool],
    install_security_middlewares_fn: Callable[[web.Application], None],
    logger: Any,
) -> None:
    try:
        app = getattr(get_prompt_server_fn().instance, "app", None)
        if app is not None:
            if not app.get(observability_installed_key):
                ensure_observability_fn(app)
                app[observability_installed_key] = True
            install_security_middlewares_fn(app)
    except Exception as exc:
        logger.debug("Observability not installed on PromptServer app: %s", exc)
        return


__all__ = [
    "_install_app_middlewares_best_effort",
    "_install_background_scan_cleanup",
    "_install_observability_on_prompt_server",
    "_install_security_middlewares",
    "_is_app_routes_registered",
    "_mark_routes_registered_best_effort",
    "_prepare_route_table",
    "_register_app_routes_best_effort",
    "_schedule_services_prewarm",
    "_set_user_manager_best_effort",
]
