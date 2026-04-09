"""ComfyUI user manager bridge and request user context helpers."""

from __future__ import annotations

from contextvars import ContextVar, Token
from typing import Any

from aiohttp import web

from mjr_am_backend.shared import Result

_CURRENT_USER_ID: ContextVar[str] = ContextVar("mjr_current_user_id", default="")


def _current_user_id() -> str:
    try:
        return str(_CURRENT_USER_ID.get() or "").strip()
    except Exception:
        return ""


def _app_key_name(key: Any) -> str:
    try:
        return str(getattr(key, "name", "") or "")
    except Exception:
        return ""


def _request_app_user_manager(request: web.Request | None) -> Any:
    if request is None:
        return None
    try:
        app_mgr = request.app.get("_mjr_user_manager")
        if app_mgr is not None:
            return app_mgr
        for key in request.app.keys():
            key_name = _app_key_name(key)
            if key_name != "_mjr_user_manager":
                continue
            candidate = request.app.get(key)
            if candidate is not None:
                return candidate
    except Exception:
        return None
    return None


def _server_module_user_manager() -> Any:
    try:
        import sys

        server_mod = sys.modules.get("server")
        if server_mod is None:
            return None
        for key in ("USER_MANAGER", "user_manager"):
            manager = getattr(server_mod, key, None)
            if manager is not None:
                return manager
        prompt_server = getattr(server_mod, "PromptServer", None)
        instance = getattr(prompt_server, "instance", None)
        manager = getattr(instance, "user_manager", None)
        if manager is not None:
            return manager
    except Exception:
        return None
    return None


def _get_comfy_user_manager(request: web.Request | None = None) -> Any:
    """Best-effort resolver for ComfyUI user manager object."""
    app_manager = _request_app_user_manager(request)
    if app_manager is not None:
        return app_manager
    return _server_module_user_manager()


def _comfy_auth_enabled(user_manager: Any) -> bool:
    """Determine whether ComfyUI auth should be treated as enabled."""
    if user_manager is None:
        return False
    try:
        for attr in ("enabled", "is_enabled", "auth_enabled", "users_enabled"):
            value = getattr(user_manager, attr, None)
            if isinstance(value, bool):
                return value
            if callable(value):
                out = value()
                if isinstance(out, bool):
                    return out
    except Exception:
        pass
    # If manager exists but does not expose flags, assume enabled to fail safe.
    return True


def _resolve_request_user_id(request: web.Request) -> str:
    """Resolve ComfyUI user id from request, if available."""
    um = _get_comfy_user_manager(request)
    if um is None:
        return ""
    try:
        getter = getattr(um, "get_request_user_id", None)
        if callable(getter):
            uid = getter(request)
            if uid is None:
                return ""
            return str(uid).strip()
    except Exception:
        return ""
    return ""


def _get_request_user_id(request: web.Request | None) -> str:
    if request is None:
        return ""
    try:
        stored = str(request.get("mjr_user_id") or "").strip()
        if stored:
            return stored
    except Exception:
        pass
    try:
        return _resolve_request_user_id(request)
    except Exception:
        return ""


def _push_request_user_context_with(
    request: web.Request | None,
    get_user_id_fn: Any,
) -> Token[str]:
    """Inner implementation — caller provides the get_user_id function so it can be patched."""
    return _CURRENT_USER_ID.set(get_user_id_fn(request))


def _push_request_user_context(request: web.Request | None) -> Token[str]:
    return _push_request_user_context_with(request, _get_request_user_id)


def _reset_request_user_context(token: Token[str]) -> None:
    try:
        _CURRENT_USER_ID.reset(token)
    except Exception:
        return


def _require_authenticated_user(request: web.Request) -> Result[str]:
    """Require an authenticated ComfyUI user when Comfy auth is enabled."""
    um = _get_comfy_user_manager(request)
    if um is None:
        # Backward compatibility: Comfy auth subsystem unavailable.
        return Result.Ok("", auth_mode="unavailable")

    if not _comfy_auth_enabled(um):
        return Result.Ok("", auth_mode="disabled")

    user_id = _resolve_request_user_id(request)
    if user_id:
        return Result.Ok(user_id, auth_mode="comfy_user")

    return Result.Err(
        "AUTH_REQUIRED",
        "Authentication required. Please sign in to ComfyUI first.",
        auth_mode="comfy_user",
    )
