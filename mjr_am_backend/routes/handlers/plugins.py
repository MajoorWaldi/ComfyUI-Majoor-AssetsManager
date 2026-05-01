"""
Plugin management HTTP handlers.

Exposes endpoints:
- GET  /mjr/am/plugins/list
- POST /mjr/am/plugins/{name}/enable
- POST /mjr/am/plugins/reload
"""
from __future__ import annotations

from aiohttp import web
from mjr_am_backend.shared import Result

from ..core import (
    _check_rate_limit,
    _csrf_error,
    _json_response,
    _require_services,
    _require_write_access,
)


def _require_plugin_mutation(request: web.Request, endpoint: str) -> Result[bool]:
    csrf = _csrf_error(request)
    if csrf:
        return Result.Err("CSRF", csrf)
    auth = _require_write_access(request)
    if not auth.ok:
        return auth
    allowed, retry_after = _check_rate_limit(request, endpoint, max_requests=20, window_seconds=60)
    if not allowed:
        return Result.Err(
            "RATE_LIMITED",
            "Rate limit exceeded. Please wait before retrying.",
            retry_after=retry_after,
        )
    return Result.Ok(True)


def register_plugin_routes(routes: web.RouteTableDef) -> None:
    @routes.get("/mjr/am/plugins/list")
    async def list_plugins(request: web.Request):
        svc, err = await _require_services()
        if err:
            return _json_response(err)

        metadata = svc.get("metadata") if isinstance(svc, dict) else None
        if not metadata or not hasattr(metadata, "plugin_manager"):
            return _json_response(Result.Err("NOT_AVAILABLE", "Plugin manager not available"))

        try:
            plugins = metadata.plugin_manager.list_plugins()
            return _json_response(Result.Ok(plugins))
        except Exception as exc:
            return _json_response(Result.Err("PLUGIN_ERROR", f"Failed to list plugins: {exc}"))

    @routes.post("/mjr/am/plugins/{name}/enable")
    async def enable_plugin(request: web.Request):
        auth = _require_plugin_mutation(request, "plugins_enable")
        if not auth.ok:
            return _json_response(auth)

        svc, err = await _require_services()
        if err:
            return _json_response(err)

        metadata = svc.get("metadata") if isinstance(svc, dict) else None
        if not metadata or not hasattr(metadata, "plugin_manager"):
            return _json_response(Result.Err("NOT_AVAILABLE", "Plugin manager not available"))

        name = request.match_info.get("name", "")
        try:
            ok = metadata.plugin_manager.enable_plugin(name)
            if not ok:
                return _json_response(Result.Err("NOT_FOUND", f"Plugin not found or could not be enabled: {name}"))
            return _json_response(Result.Ok({"enabled": True}))
        except Exception as exc:
            return _json_response(Result.Err("PLUGIN_ERROR", f"Failed to enable plugin: {exc}"))

    @routes.post("/mjr/am/plugins/reload")
    async def reload_plugins(request: web.Request):
        auth = _require_plugin_mutation(request, "plugins_reload")
        if not auth.ok:
            return _json_response(auth)

        svc, err = await _require_services()
        if err:
            return _json_response(err)

        metadata = svc.get("metadata") if isinstance(svc, dict) else None
        if not metadata or not hasattr(metadata, "plugin_manager"):
            return _json_response(Result.Err("NOT_AVAILABLE", "Plugin manager not available"))

        try:
            count = await metadata.plugin_manager.reload()
            return _json_response(Result.Ok({"reloaded": count}))
        except Exception as exc:
            return _json_response(Result.Err("PLUGIN_ERROR", f"Failed to reload plugins: {exc}"))
