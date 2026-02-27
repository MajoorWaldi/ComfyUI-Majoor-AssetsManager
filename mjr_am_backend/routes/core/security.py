"""
Security utilities: CSRF protection and rate limiting.
"""

from __future__ import annotations

import hashlib
import ipaddress
import os
import threading
import time
from collections import OrderedDict
from collections.abc import Mapping
from functools import lru_cache
from http.cookies import SimpleCookie
from typing import Any
from urllib.parse import urlparse

from aiohttp import web
from mjr_am_backend.shared import Result, get_logger

logger = get_logger(__name__)

# Per-client rate limiting state: {client_id: {endpoint: [timestamps]}}
# Use LRU eviction to prevent unbounded memory growth from spoofed client IPs.
_DEFAULT_MAX_RATE_LIMIT_CLIENTS = 1_000
_DEFAULT_MAX_RATE_LIMIT_ENDPOINTS_PER_CLIENT = 32
_DEFAULT_RATE_LIMIT_MIN_WINDOW_SECONDS = 60
_DEFAULT_CLIENT_ID_HASH_HEX_CHARS = 16
_DEFAULT_TRUSTED_PROXIES = "127.0.0.1,::1"
_DEFAULT_RATE_LIMIT_BACKGROUND_CLEANUP_SECONDS = 60

try:
    _MAX_RATE_LIMIT_CLIENTS = int(os.environ.get("MAJOOR_RATE_LIMIT_MAX_CLIENTS", str(_DEFAULT_MAX_RATE_LIMIT_CLIENTS)))
except Exception:
    _MAX_RATE_LIMIT_CLIENTS = _DEFAULT_MAX_RATE_LIMIT_CLIENTS

try:
    _RATE_LIMIT_MIN_WINDOW_SECONDS = int(
        os.environ.get("MAJOOR_RATE_LIMIT_MIN_WINDOW_SECONDS", str(_DEFAULT_RATE_LIMIT_MIN_WINDOW_SECONDS))
    )
except Exception:
    _RATE_LIMIT_MIN_WINDOW_SECONDS = _DEFAULT_RATE_LIMIT_MIN_WINDOW_SECONDS

try:
    _CLIENT_ID_HASH_HEX_CHARS = int(
        os.environ.get("MAJOOR_CLIENT_ID_HASH_CHARS", str(_DEFAULT_CLIENT_ID_HASH_HEX_CHARS))
    )
except Exception:
    _CLIENT_ID_HASH_HEX_CHARS = _DEFAULT_CLIENT_ID_HASH_HEX_CHARS

try:
    _MAX_RATE_LIMIT_ENDPOINTS_PER_CLIENT = int(
        os.environ.get(
            "MAJOOR_RATE_LIMIT_MAX_ENDPOINTS_PER_CLIENT",
            str(_DEFAULT_MAX_RATE_LIMIT_ENDPOINTS_PER_CLIENT),
        )
    )
except Exception:
    _MAX_RATE_LIMIT_ENDPOINTS_PER_CLIENT = _DEFAULT_MAX_RATE_LIMIT_ENDPOINTS_PER_CLIENT

_rate_limit_state: OrderedDict[str, dict[str, list[float]]] = OrderedDict()
# threading.Lock is intentional here: rate-limit updates are synchronous and never await.
# Do not add `await` inside a `with _rate_limit_lock:` critical section.
_rate_limit_lock = threading.Lock()
_rate_limit_cleanup_thread: threading.Thread | None = None
_rate_limit_cleanup_thread_lock = threading.Lock()
_rate_limit_cleanup_stop = threading.Event()
try:
    _RATE_LIMIT_BACKGROUND_CLEANUP_SECONDS = int(
        os.environ.get(
            "MAJOOR_RATE_LIMIT_BACKGROUND_CLEANUP_SECONDS",
            str(_DEFAULT_RATE_LIMIT_BACKGROUND_CLEANUP_SECONDS),
        )
    )
except Exception:
    _RATE_LIMIT_BACKGROUND_CLEANUP_SECONDS = _DEFAULT_RATE_LIMIT_BACKGROUND_CLEANUP_SECONDS
_RATE_LIMIT_BACKGROUND_CLEANUP_SECONDS = max(10, _RATE_LIMIT_BACKGROUND_CLEANUP_SECONDS)


def _env_truthy(name: str, default: bool = False) -> bool:
    try:
        raw = os.environ.get(name)
    except Exception:
        raw = None
    if raw is None:
        return bool(default)
    return str(raw).strip().lower() in ("1", "true", "yes", "on")


@lru_cache(maxsize=1)
def _safe_mode_enabled() -> bool:
    """
    Return True when Majoor Safe Mode is enabled.

    Safe Mode is enabled by default to reduce risk when ComfyUI is exposed to remote clients
    (via --listen, tunnels, reverse proxies, etc.).
    """
    # Default: enabled when unset.
    try:
        raw = os.environ.get("MAJOOR_SAFE_MODE")
    except Exception:
        raw = None
    if raw is None:
        return True
    return str(raw).strip().lower() in ("1", "true", "yes", "on")


def _require_operation_enabled(operation: str, *, prefs: Mapping[str, Any] | None = None) -> Result[bool]:
    """
    Gate "dangerous" or state-changing operations behind explicit opt-ins.

    Policy:
      - Safe Mode enabled by default: blocks write operations unless explicitly allowed.
      - Delete/Rename/Open-in-folder are always opt-in (even when Safe Mode is off).

    Environment variables:
      - MAJOOR_SAFE_MODE=0 to disable safe mode
      - MAJOOR_ALLOW_WRITE=1 to enable rating/tags writes while in safe mode
      - MAJOOR_ALLOW_DELETE=1 to enable deletion
      - MAJOOR_ALLOW_RENAME=1 to enable renaming
      - MAJOOR_ALLOW_OPEN_IN_FOLDER=1 to enable open-in-folder
    """
    from ...shared import Result

    op = str(operation or "").strip().lower()
    safe_mode = bool(prefs.get("safe_mode")) if (prefs and "safe_mode" in prefs) else _safe_mode_enabled()

    def _pref_truthy(key: str, env_var: str) -> bool:
        if prefs is not None and key in prefs:
            try:
                return bool(prefs[key])
            except Exception:
                pass
        return _env_truthy(env_var)

    static_gates = _operation_static_gates()
    for ops, pref_key, env_var, message in static_gates:
        if op not in ops:
            continue
        if _pref_truthy(pref_key, env_var):
            return Result.Ok(True, operation=op, safe_mode=safe_mode)
        return Result.Err("FORBIDDEN", message, operation=op, safe_mode=safe_mode)

    if op in ("write", "rating", "tags", "asset_rating", "asset_tags"):
        if _write_allowed_in_context(safe_mode=safe_mode, pref_truthy=_pref_truthy):
            return Result.Ok(True, operation=op, safe_mode=safe_mode)
        return Result.Err(
            "FORBIDDEN",
            "Write operations are disabled in Safe Mode. Set MAJOOR_SAFE_MODE=0 to disable safe mode, or MAJOOR_ALLOW_WRITE=1 to allow rating/tags writes.",
            operation=op,
            safe_mode=safe_mode,
        )

    # Unknown operation: fail closed only in safe mode.
    if safe_mode:
        return Result.Err(
            "FORBIDDEN",
            "Operation blocked in Safe Mode (unknown operation).",
            operation=op,
            safe_mode=safe_mode,
        )
    return Result.Ok(True, operation=op, safe_mode=safe_mode)


def _operation_static_gates() -> tuple[tuple[tuple[str, ...], str, str, str], ...]:
    return (
        (
            ("reset_index",),
            "allow_reset_index",
            "MAJOOR_ALLOW_RESET_INDEX",
            "Reset index is disabled by default. Enable 'allow_reset_index' in settings or set MAJOOR_ALLOW_RESET_INDEX=1.",
        ),
        (
            ("delete", "asset_delete", "assets_delete"),
            "allow_delete",
            "MAJOOR_ALLOW_DELETE",
            "Delete is disabled by default. Set MAJOOR_ALLOW_DELETE=1 to enable asset deletion.",
        ),
        (
            ("rename", "asset_rename"),
            "allow_rename",
            "MAJOOR_ALLOW_RENAME",
            "Rename is disabled by default. Set MAJOOR_ALLOW_RENAME=1 to enable asset renaming.",
        ),
        (
            ("open_in_folder", "open-in-folder"),
            "allow_open_in_folder",
            "MAJOOR_ALLOW_OPEN_IN_FOLDER",
            "Open-in-folder is disabled by default. Set MAJOOR_ALLOW_OPEN_IN_FOLDER=1 to enable it.",
        ),
    )


def _write_allowed_in_context(*, safe_mode: bool, pref_truthy) -> bool:
    if not safe_mode:
        return True
    return bool(pref_truthy("allow_write", "MAJOOR_ALLOW_WRITE"))


async def _resolve_security_prefs(services: Mapping[str, Any] | None) -> Mapping[str, Any] | None:
    """
    Extract stored security preferences from the services container safely.
    """
    if not services:
        return None
    settings_service = services.get("settings")
    if not settings_service:
        return None
    try:
        return await settings_service.get_security_prefs()
    except Exception:
        return None


def _get_write_token() -> str:
    """
    Return configured API token used to authorize destructive/write operations.

    Supported env vars:
      - MAJOOR_API_TOKEN (preferred)
      - MJR_API_TOKEN (compat / shorter alias)
    """
    try:
        raw = (os.environ.get("MAJOOR_API_TOKEN") or os.environ.get("MJR_API_TOKEN") or "").strip()
    except Exception:
        raw = ""
    return raw

def _hash_token(value: str) -> str:
    try:
        normalized = str(value or "").strip()
    except Exception:
        normalized = ""
    try:
        pepper = str(os.environ.get("MAJOOR_API_TOKEN_PEPPER") or "").strip()
    except Exception:
        pepper = ""
    payload = f"{pepper}\0{normalized}".encode("utf-8", errors="ignore")
    return hashlib.sha256(payload).hexdigest()

def _get_write_token_hash() -> str:
    try:
        configured_hash = (
            os.environ.get("MAJOOR_API_TOKEN_HASH")
            or os.environ.get("MJR_API_TOKEN_HASH")
            or ""
        ).strip().lower()
    except Exception:
        configured_hash = ""
    if configured_hash:
        return configured_hash
    configured_plain = _get_write_token()
    if configured_plain:
        return _hash_token(configured_plain)
    return ""


def _extract_bearer_token(headers: Mapping[str, str]) -> str:
    try:
        auth = str(headers.get("Authorization") or "").strip()
    except Exception:
        auth = ""
    if not auth:
        return ""
    prefix = "bearer "
    if auth.lower().startswith(prefix):
        return auth[len(prefix):].strip()
    return ""


def _extract_write_token_from_headers(headers: Mapping[str, str]) -> str:
    """
    Extract a user-provided write token from request headers.

    Accepted:
      - Authorization: Bearer <token>
      - X-MJR-Token: <token>
    """
    bearer = _extract_bearer_token(headers)
    if bearer:
        return bearer

    try:
        token = str(headers.get("X-MJR-Token") or "").strip()
    except Exception:
        token = ""
    if token:
        return token

    try:
        cookie_header = str(headers.get("Cookie") or "").strip()
    except Exception:
        cookie_header = ""
    if cookie_header:
        try:
            parsed = SimpleCookie()
            parsed.load(cookie_header)
            raw = parsed.get("mjr_write_token")
            if raw is not None:
                return str(raw.value or "").strip()
        except Exception:
            pass
    return ""


def _resolve_client_ip(peer_ip: str, headers: Mapping[str, str]) -> str:
    """
    Resolve client IP, honoring X-Forwarded-For / X-Real-IP only from trusted proxies.

    Note: This mirrors the rate-limit identity resolution but returns the IP string (not a hash),
    so it can be used for local/remote authorization checks.
    """
    peer = str(peer_ip or "").strip()
    if not peer:
        return "unknown"

    if _is_trusted_proxy(peer):
        forwarded_chain = _forwarded_for_chain(headers)
        forwarded_ip = _client_ip_from_forwarded_chain(forwarded_chain, peer=peer)
        if forwarded_ip:
            return forwarded_ip
        real_ip = _real_ip_from_header(headers)
        if real_ip:
            return real_ip

    return peer


def _forwarded_for_chain(headers: Mapping[str, str]) -> list[str]:
    forwarded_for = _header_value(headers, "X-Forwarded-For")
    if not forwarded_for:
        return []
    out: list[str] = []
    for part in forwarded_for.split(","):
        candidate = part.strip()
        if _is_valid_ip(candidate):
            out.append(candidate)
    return out


def _client_ip_from_forwarded_chain(forwarded_chain: list[str], *, peer: str) -> str:
    """
    Resolve client IP from X-Forwarded-For using trusted-proxy chain semantics.

    We trim trusted proxies from the right side (closest hop first), then pick the
    nearest untrusted hop. This is safer than blindly taking the first XFF value.
    """
    if not forwarded_chain:
        return ""
    hops = list(forwarded_chain)
    hops.append(str(peer or "").strip())
    while hops:
        tail = str(hops[-1] or "").strip()
        if not tail:
            hops.pop()
            continue
        if _is_trusted_proxy(tail):
            hops.pop()
            continue
        return tail
    return ""


def _real_ip_from_header(headers: Mapping[str, str]) -> str:
    real_ip = _header_value(headers, "X-Real-IP")
    if not real_ip:
        return ""
    return real_ip if _is_valid_ip(real_ip) else ""


def _header_value(headers: Mapping[str, str], key: str) -> str:
    try:
        return str(headers.get(key) or "").strip()
    except Exception:
        return ""


def _is_valid_ip(value: str) -> bool:
    try:
        ipaddress.ip_address(value)
        return True
    except Exception:
        return False


def _is_loopback_ip(value: str) -> bool:
    try:
        return ipaddress.ip_address(str(value or "").strip()).is_loopback
    except Exception:
        return False


def _check_write_access(*, peer_ip: str, headers: Mapping[str, str], request_scheme: str = "") -> Result[bool]:
    """
    Authorization guard for destructive/write endpoints.

    Default policy:
      - Loopback clients are trusted by default (same machine = same user).
      - If a token is configured AND the client is remote: token is required.
      - If no token is configured: allow loopback, deny remote.

    Overrides:
      - MAJOOR_REQUIRE_AUTH=1 forces token auth even for loopback.
      - MAJOOR_ALLOW_REMOTE_WRITE=1 allows remote writes when no token is set.

    Returns a Result that never raises (route handlers should return 200 with this Result on error).
    """
    import hmac

    # Local import to avoid cycles: core/security must remain lightweight.
    from ...shared import Result

    configured_hash = _get_write_token_hash()
    require_auth = _env_truthy("MAJOOR_REQUIRE_AUTH")
    # Default: deny remote writes when no token is configured.
    allow_remote = _env_truthy("MAJOOR_ALLOW_REMOTE_WRITE", default=False)

    client_ip = _resolve_client_ip(peer_ip, headers)

    provided = _extract_write_token_from_headers(headers)
    if configured_hash:
        # If the client provides a valid token, always accept it (any transport policy applies).
        if provided and hmac.compare_digest(_hash_token(provided), configured_hash):
            if not _request_transport_is_secure(peer_ip=peer_ip, headers=headers, request_scheme=request_scheme):
                if not _env_truthy("MAJOOR_ALLOW_INSECURE_TOKEN_TRANSPORT", default=False):
                    return Result.Err(
                        "FORBIDDEN",
                        "Write operation blocked: API token over insecure transport. Use HTTPS (or trusted proxy with X-Forwarded-Proto=https), or set MAJOOR_ALLOW_INSECURE_TOKEN_TRANSPORT=1.",
                        auth="token_insecure_transport",
                        client_ip=client_ip,
                    )
            return Result.Ok(True, auth="token", client_ip=client_ip)
        # Token missing or invalid.
        # Loopback clients (same machine) are trusted by default unless MAJOOR_REQUIRE_AUTH=1
        # is explicitly set. This prevents auto-generated or rotated token hashes that were
        # persisted in the database from locking out local users who never configured a token.
        if not require_auth and _is_loopback_ip(client_ip):
            return Result.Ok(True, auth="loopback", client_ip=client_ip)
        return Result.Err(
            "AUTH_REQUIRED",
            "Write operation blocked: missing or invalid API token. Set MAJOOR_API_TOKEN and send it via X-MJR-Token or Authorization: Bearer <token>.",
            auth="token",
            client_ip=client_ip,
        )

    if require_auth:
        return Result.Err(
            "AUTH_REQUIRED",
            "Write operation blocked: MAJOOR_REQUIRE_AUTH=1 is set but no MAJOOR_API_TOKEN is configured.",
            auth="required_missing_token",
            client_ip=client_ip,
        )

    if allow_remote:
        return Result.Ok(True, auth="allow_remote_no_token", client_ip=client_ip)

    if _is_loopback_ip(client_ip):
        return Result.Ok(True, auth="loopback", client_ip=client_ip)

    return Result.Err(
        "FORBIDDEN",
        "Write operation blocked for non-local clients. Configure MAJOOR_API_TOKEN (recommended) or set MAJOOR_ALLOW_REMOTE_WRITE=1 to allow remote writes when no token is configured.",
        auth="loopback_only",
        client_ip=client_ip,
    )


def _has_configured_write_token() -> bool:
    try:
        return bool(_get_write_token_hash())
    except Exception:
        return False


def _require_write_access(request: web.Request) -> Result[bool]:
    """
    Request-level wrapper for `_check_write_access()`.

    Never raises. Meant to be used at the top of handlers that modify filesystem/DB.
    """
    try:
        peer = str(getattr(request, "remote", None) or "").strip()
    except Exception:
        peer = ""
    if not peer:
        peer = _extract_peer_ip(request)
    try:
        request_scheme = str(getattr(request, "scheme", "") or "").strip().lower()
    except Exception:
        request_scheme = ""
    headers: Mapping[str, str]
    try:
        headers = request.headers  # CIMultiDictProxy
    except Exception:
        headers = {}
    return _check_write_access(peer_ip=peer, headers=headers, request_scheme=request_scheme)


def _is_loopback_request(request: web.Request) -> bool:
    try:
        peer = _extract_peer_ip(request)
    except Exception:
        peer = "unknown"
    headers: Mapping[str, str]
    try:
        headers = request.headers
    except Exception:
        headers = {}
    client_ip = _resolve_client_ip(peer, headers)
    return _is_loopback_ip(client_ip)


def _request_transport_is_secure(*, peer_ip: str, headers: Mapping[str, str], request_scheme: str) -> bool:
    scheme = str(request_scheme or "").strip().lower()
    if scheme == "https":
        return True

    client_ip = _resolve_client_ip(peer_ip, headers)
    if _is_loopback_ip(client_ip):
        return True

    if not _is_trusted_proxy(peer_ip):
        return False

    forwarded_proto = _header_value(headers, "X-Forwarded-Proto")
    if not forwarded_proto:
        return False
    first = forwarded_proto.split(",")[0].strip().lower()
    return first == "https"


def _get_comfy_user_manager(request: web.Request | None = None) -> Any:
    """
    Best-effort resolver for ComfyUI user manager object.
    """
    app_manager = _request_app_user_manager(request)
    if app_manager is not None:
        return app_manager
    return _server_module_user_manager()


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


def _app_key_name(key: Any) -> str:
    try:
        return str(getattr(key, "name", "") or "")
    except Exception:
        return ""


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
    except Exception:
        return None
    return None


def _comfy_auth_enabled(user_manager: Any) -> bool:
    """
    Determine whether ComfyUI auth should be treated as enabled.
    """
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
    """
    Resolve ComfyUI user id from request, if available.
    """
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


def _require_authenticated_user(request: web.Request) -> Result[str]:
    """
    Require an authenticated ComfyUI user when Comfy auth is enabled.
    """
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


def _parse_trusted_proxies() -> list[ipaddress._BaseNetwork]:
    raw = os.environ.get("MAJOOR_TRUSTED_PROXIES", _DEFAULT_TRUSTED_PROXIES)
    allow_insecure = _env_truthy("MAJOOR_ALLOW_INSECURE_TRUSTED_PROXIES", default=False)
    out: list[ipaddress._BaseNetwork] = []
    for part in (raw or "").split(","):
        s = part.strip()
        if not s:
            continue
        try:
            # Accept either an IP or a CIDR.
            if "/" in s:
                out.append(ipaddress.ip_network(s, strict=False))
            else:
                ip = ipaddress.ip_address(s)
                out.append(ipaddress.ip_network(f"{ip}/{ip.max_prefixlen}", strict=False))
        except Exception:
            continue
    # Refuse universal trust by default. This blocks spoofing via X-Forwarded-For from arbitrary peers.
    if not allow_insecure:
        filtered: list[ipaddress._BaseNetwork] = []
        for net in out:
            try:
                if int(getattr(net, "prefixlen", 0)) == 0:
                    continue
            except Exception:
                pass
            filtered.append(net)
        out = filtered
    return out


_TRUSTED_PROXY_NETS = _parse_trusted_proxies()


def _refresh_trusted_proxy_cache() -> None:
    global _TRUSTED_PROXY_NETS
    _TRUSTED_PROXY_NETS = _parse_trusted_proxies()
    try:
        _is_trusted_proxy.cache_clear()
    except Exception:
        pass


@lru_cache(maxsize=2048)
def _is_trusted_proxy(ip: str) -> bool:
    try:
        addr = ipaddress.ip_address(str(ip or "").strip())
    except Exception:
        return False
    try:
        for net in _TRUSTED_PROXY_NETS:
            try:
                if addr in net:
                    return True
            except Exception:
                continue
    except Exception:
        return False
    return False


def _extract_peer_ip(request: web.Request) -> str:
    try:
        peername = request.transport.get_extra_info("peername") if request.transport else None
        return peername[0] if peername else "unknown"
    except Exception:
        return "unknown"


def _get_client_identifier(request: web.Request) -> str:
    peer_ip = _extract_peer_ip(request)
    headers: Mapping[str, str]
    try:
        headers = request.headers
    except Exception:
        headers = {}
    client_ip = _resolve_client_ip(peer_ip, headers)
    return hashlib.sha256(client_ip.encode("utf-8", errors="ignore")).hexdigest()[:_CLIENT_ID_HASH_HEX_CHARS]

def _evict_oldest_clients_if_needed() -> None:
    # Evict more aggressively when near capacity
    target = int(_MAX_RATE_LIMIT_CLIENTS * 0.9)
    while len(_rate_limit_state) > target:
        try:
            _rate_limit_state.popitem(last=False)
        except KeyError:
            break

def _get_or_create_client_state(client_id: str) -> dict[str, list[float]]:
    if client_id in _rate_limit_state:
        _rate_limit_state.move_to_end(client_id)
        return _rate_limit_state[client_id]
    # Under client-ID flood, keep per-client isolation by evicting oldest entries.
    # This avoids collapsing all overflow traffic into a shared global bucket.
    if len(_rate_limit_state) >= _MAX_RATE_LIMIT_CLIENTS:
        try:
            _rate_limit_state.popitem(last=False)
        except KeyError:
            pass
    _evict_oldest_clients_if_needed()
    state: dict[str, list[float]] = {}
    _rate_limit_state[client_id] = state
    return state


def _evict_oldest_endpoint_if_needed(client_state: dict[str, list[float]], endpoint: str) -> None:
    if endpoint in client_state:
        return
    cap = max(1, int(_MAX_RATE_LIMIT_ENDPOINTS_PER_CLIENT or 1))
    while len(client_state) >= cap:
        try:
            # Dict preserves insertion order in modern Python.
            oldest_key = next(iter(client_state))
            client_state.pop(oldest_key, None)
        except Exception:
            break


def _cleanup_rate_limit_state_locked(now: float, window_seconds: int) -> None:
    for client_id, endpoints in list(_rate_limit_state.items()):
        for endpoint, timestamps in list(endpoints.items()):
            recent = [ts for ts in timestamps if now - ts < window_seconds]
            if recent:
                endpoints[endpoint] = recent
            else:
                endpoints.pop(endpoint, None)
        if not endpoints:
            _rate_limit_state.pop(client_id, None)


def _rate_limit_cleanup_loop() -> None:
    while not _rate_limit_cleanup_stop.wait(timeout=float(_RATE_LIMIT_BACKGROUND_CLEANUP_SECONDS)):
        try:
            now = time.time()
            with _rate_limit_lock:
                _cleanup_rate_limit_state_locked(now, max(_RATE_LIMIT_MIN_WINDOW_SECONDS, 60))
        except Exception as exc:
            logger.debug("Rate limit background cleanup failed: %s", exc)


def _ensure_rate_limit_cleanup_thread() -> None:
    global _rate_limit_cleanup_thread
    with _rate_limit_cleanup_thread_lock:
        if _rate_limit_cleanup_thread and _rate_limit_cleanup_thread.is_alive():
            return
        _rate_limit_cleanup_stop.clear()
        _rate_limit_cleanup_thread = threading.Thread(
            target=_rate_limit_cleanup_loop,
            name="mjr-rate-limit-cleanup",
            daemon=True,
        )
        _rate_limit_cleanup_thread.start()


def _check_rate_limit(
    request: web.Request,
    endpoint: str,
    max_requests: int = 10,
    window_seconds: int = 60
) -> tuple[bool, int | None]:
    """
    Check if the current client exceeded the rate limit.

    Returns:
        (allowed, retry_after_seconds)
    """
    _ensure_rate_limit_cleanup_thread()

    try:
        client_id = _get_client_identifier(request)
        now = time.time()
    except Exception as exc:
        # If we can't identify the client, fail open to avoid breaking UI.
        logger.warning("Rate limit identity resolution failed; failing open: %s", exc)
        return True, None

    try:
        with _rate_limit_lock:
            client_state = _get_or_create_client_state(client_id)
            _evict_oldest_endpoint_if_needed(client_state, endpoint)
            previous = client_state.get(endpoint, [])
            recent = [ts for ts in previous if now - ts < window_seconds]

            if len(recent) >= max_requests:
                retry_after = int(window_seconds - (now - recent[0])) + 1
                return False, max(1, retry_after)

            recent.append(now)
            client_state[endpoint] = recent
            return True, None
    except Exception as exc:
        logger.error("Rate limit check raised unexpectedly; failing open: %s", exc, exc_info=True)
        return True, None


def _csrf_error(request: web.Request) -> str | None:
    """
    Enhanced CSRF protection for state-changing endpoints.

    Layers:
      1) Require an anti-CSRF header for state-changing methods (X-Requested-With or X-CSRF-Token)
      2) If Origin is present, validate it against Host (with loopback allowance)
    """
    if request.method.upper() not in ("POST", "PUT", "DELETE", "PATCH"):
        return None
    if not _has_csrf_header(request):
        return "Missing anti-CSRF header (X-Requested-With or X-CSRF-Token)"
    origin = request.headers.get("Origin")
    if not origin:
        return None
    if origin == "null":
        return "Cross-site request blocked (Origin=null)"
    host = _resolve_effective_host(request)
    if not host:
        return "Missing Host header"
    parsed = _parse_origin(origin)
    if parsed is None:
        return "Cross-site request blocked (invalid Origin)"
    if parsed.netloc == host:
        return None
    if _is_loopback_origin_host_match(parsed, host):
        return None
    return f"Cross-site request blocked ({parsed.netloc} != {host})"


def _has_csrf_header(request: web.Request) -> bool:
    try:
        return bool(request.headers.get("X-Requested-With")) or bool(request.headers.get("X-CSRF-Token"))
    except Exception:
        return False


def _resolve_effective_host(request: web.Request) -> str:
    host = request.headers.get("Host") or ""
    if not host:
        return ""
    try:
        peer_ip = _extract_peer_ip(request)
    except Exception:
        peer_ip = "unknown"
    if not _is_trusted_proxy(peer_ip):
        return host
    xf_host = str(request.headers.get("X-Forwarded-Host") or "").strip()
    if not xf_host:
        return host
    return xf_host.split(",")[0].strip()


def _parse_origin(origin: str):
    try:
        parsed = urlparse(origin)
    except Exception:
        return None
    if not parsed.scheme or not parsed.netloc:
        return None
    return parsed


def _is_loopback_origin_host_match(parsed_origin: Any, host: str) -> bool:
    try:
        origin_host = parsed_origin.hostname or ""
        origin_port = parsed_origin.port
    except Exception:
        return False
    host_name, host_port = _split_host_port(host)
    loopback = {"localhost", "127.0.0.1", "::1"}
    if origin_host not in loopback or host_name not in loopback:
        return False
    return origin_port is None or host_port is None or origin_port == host_port


def _split_host_port(host: str) -> tuple[str, int | None]:
    try:
        if ":" in host and not host.endswith("]"):
            host_name, host_port_raw = host.rsplit(":", 1)
            return host_name, int(host_port_raw)
    except Exception:
        return host, None
    return host, None


def _reset_security_state_for_tests() -> None:
    try:
        with _rate_limit_lock:
            _rate_limit_state.clear()
    except Exception:
        pass
    try:
        _rate_limit_cleanup_stop.set()
    except Exception:
        pass
    try:
        _is_trusted_proxy.cache_clear()
    except Exception:
        pass
    try:
        _safe_mode_enabled.cache_clear()
    except Exception:
        pass
