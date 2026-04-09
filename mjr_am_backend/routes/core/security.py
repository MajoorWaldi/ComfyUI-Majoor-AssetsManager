"""
Security utilities: write-access guards and re-exports of security sub-modules.

Sub-module layout:
  security_policy.py       — env flags, operation policy, safe mode
  security_tokens.py       — token hashing and extraction
  security_proxies.py      — trusted proxy resolution, IP utilities
  security_auth_context.py — ComfyUI user bridge, request user context
  security_rate_limit.py   — rate limiting state machine
  security_csrf.py         — CSRF validation
"""

from __future__ import annotations

import ipaddress
import time
from collections.abc import Mapping
from functools import lru_cache
from typing import Any

from aiohttp import web

from mjr_am_backend.shared import Result, get_logger

# --- Sub-module re-exports (keep this module as the single import point) ---
from .security_auth_context import (
    _CURRENT_USER_ID,
    _app_key_name,
    _comfy_auth_enabled,
    _current_user_id,
    _get_comfy_user_manager,
    _get_request_user_id,
    _push_request_user_context_with,
    _request_app_user_manager,
    _require_authenticated_user,
    _reset_request_user_context,
    _resolve_request_user_id,
    _server_module_user_manager,
)
from .security_csrf import (
    _csrf_error,
    _has_csrf_header,
    _is_loopback_origin_host_match,
    _parse_origin,
    _resolve_effective_host,
    _split_host_port,
)
from .security_policy import (
    _WARNED_TOKEN_SOURCES,
    _env_truthy,
    _require_operation_enabled,
    _resolve_security_prefs,
    _safe_mode_enabled,
    _validate_token_format,
)
from .security_proxies import (
    _CLIENT_ID_HASH_HEX_CHARS,
    _extract_peer_ip,
    _forwarded_for_chain,
    _header_value,
    _is_loopback_ip,
    _is_valid_ip,
    _parse_trusted_proxies as _parse_trusted_proxies_impl,
    _real_ip_from_header,
)
from .security_rate_limit import (
    _MAX_RATE_LIMIT_CLIENTS,
    _MAX_RATE_LIMIT_ENDPOINTS_PER_CLIENT,
    _RATE_LIMIT_BACKGROUND_CLEANUP_SECONDS,
    _RATE_LIMIT_MIN_WINDOW_SECONDS,
    _check_rate_limit as _check_rate_limit_impl,
    _rate_limit_state,
)
from .security_tokens import (
    _extract_bearer_token,
    _extract_mjr_token_header,
    _extract_write_token_from_cookie,
    _extract_write_token_from_headers,
    _get_write_token,
    _get_write_token_hash,
    _hash_token,
    _hash_token_pbkdf2,
    _token_hash_matches,
)

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# Rate limit wrapper — defined here so tests can monkeypatch sec._MAX_RATE_LIMIT_CLIENTS
# and have it take effect (security_rate_limit reads its own module-level constant otherwise).
# ---------------------------------------------------------------------------


def _check_rate_limit(
    request: web.Request,
    endpoint: str,
    max_requests: int = 10,
    window_seconds: int = 60,
) -> tuple[bool, int | None]:
    return _check_rate_limit_impl(
        request,
        endpoint,
        max_requests=max_requests,
        window_seconds=window_seconds,
        _max_clients=_MAX_RATE_LIMIT_CLIENTS,
    )


# ---------------------------------------------------------------------------
# Trusted proxy state — defined HERE (not imported) so tests can monkeypatch
# sec._TRUSTED_PROXY_NETS / sec._is_trusted_proxy at the security module level.
# security_proxies.py keeps its own copy used by security_csrf and other sub-modules.
# ---------------------------------------------------------------------------


def _parse_trusted_proxies() -> list[ipaddress._BaseNetwork]:
    return _parse_trusted_proxies_impl()


_TRUSTED_PROXY_NETS: list[ipaddress._BaseNetwork] = _parse_trusted_proxies()


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


def _refresh_trusted_proxy_cache() -> None:
    global _TRUSTED_PROXY_NETS
    _TRUSTED_PROXY_NETS = _parse_trusted_proxies()
    try:
        _is_trusted_proxy.cache_clear()
    except Exception:
        pass
    # Also refresh the proxies sub-module (used by security_csrf, etc.)
    from .security_proxies import _refresh_trusted_proxy_cache as _proxies_refresh
    _proxies_refresh()


# ---------------------------------------------------------------------------
# Proxy-aware IP resolution
# (defined here so tests can monkeypatch _is_trusted_proxy at this module level)
# ---------------------------------------------------------------------------


def _client_ip_from_forwarded_chain(forwarded_chain: list[str], *, peer: str) -> str:
    """
    Resolve client IP from X-Forwarded-For using trusted-proxy chain semantics.

    Trims trusted proxies from the right (closest hop first), then picks the
    nearest untrusted hop. Safer than blindly taking the first XFF value.
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


def _resolve_client_ip(peer_ip: str, headers: Mapping[str, str]) -> str:
    """
    Resolve client IP, honoring X-Forwarded-For / X-Real-IP only from trusted proxies.

    Note: Defined here (not in security_proxies) so that monkeypatching
    `_is_trusted_proxy` at this module level works correctly in tests.
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


def _get_client_identifier(request: web.Request) -> str:
    import hashlib

    peer_ip = _extract_peer_ip(request)
    headers: Mapping[str, str]
    try:
        headers = request.headers
    except Exception:
        headers = {}
    client_ip = _resolve_client_ip(peer_ip, headers)
    return hashlib.sha256(client_ip.encode("utf-8", errors="ignore")).hexdigest()[
        :_CLIENT_ID_HASH_HEX_CHARS
    ]


# ---------------------------------------------------------------------------
# Write-access checking
# ---------------------------------------------------------------------------


def _is_loopback_fallback_unknown_peer(client_ip: str, headers: Mapping[str, str] | None) -> bool:
    """
    Check if client_ip is 'unknown' and headers is None, indicating a true local/direct call
    where peer IP extraction failed (e.g., WebSocket, Unix socket). In this rare edge case,
    grant loopback privileges since true remote clients would have populated headers.
    """
    normalized = str(client_ip or "").strip().lower()
    return normalized == "unknown" and headers is None


def _check_write_access_with_token(
    *,
    client_ip: str,
    configured_hash: str,
    provided: str,
    peer_ip: str,
    headers: Mapping[str, str],
    request_scheme: str,
    require_auth: bool,
) -> Result[bool]:
    if _token_hash_matches(provided, configured_hash):
        if not _request_transport_is_secure(
            peer_ip=peer_ip, headers=headers, request_scheme=request_scheme
        ):
            if not _env_truthy("MAJOOR_ALLOW_INSECURE_TOKEN_TRANSPORT", default=False):
                return Result.Err(
                    "FORBIDDEN",
                    "Write operation blocked: API token over insecure transport. Use HTTPS (or trusted proxy with X-Forwarded-Proto=https), or set MAJOOR_ALLOW_INSECURE_TOKEN_TRANSPORT=1.",
                    auth="token_insecure_transport",
                    client_ip=client_ip,
                )
        return Result.Ok(True, auth="token", client_ip=client_ip)
    if not require_auth and _is_loopback_ip(client_ip):
        return Result.Ok(True, auth="loopback", client_ip=client_ip)
    if not require_auth and _is_loopback_fallback_unknown_peer(client_ip, headers):
        return Result.Ok(True, auth="loopback_unknown_peer", client_ip=client_ip)
    return Result.Err(
        "AUTH_REQUIRED",
        "Write operation blocked: missing or invalid API token. Set MAJOOR_API_TOKEN and send it via X-MJR-Token or Authorization: Bearer <token>.",
        auth="token",
        client_ip=client_ip,
    )


def _check_write_access_without_token(
    *,
    client_ip: str,
    allow_remote: bool,
    require_auth: bool,
    headers: Mapping[str, str] | None = None,
    request_scheme: str = "",
) -> Result[bool]:
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
    if _is_loopback_fallback_unknown_peer(client_ip, headers):
        return Result.Ok(True, auth="loopback_unknown_peer", client_ip=client_ip)
    return Result.Err(
        "FORBIDDEN",
        "Write operation blocked for non-local clients. Configure MAJOOR_API_TOKEN (recommended) or set MAJOOR_ALLOW_REMOTE_WRITE=1 to allow remote writes when no token is configured.",
        auth="loopback_only",
        client_ip=client_ip,
    )


def _check_write_access(
    *, peer_ip: str, headers: Mapping[str, str], request_scheme: str = ""
) -> Result[bool]:
    """
    Authorization guard for destructive/write endpoints.

    Default policy:
      - Loopback clients are trusted by default (same machine = same user).
      - If a token is configured AND the client is remote: token is required.
      - If no token is configured: allow loopback, deny remote.

    Overrides:
      - MAJOOR_REQUIRE_AUTH=1 forces token auth even for loopback.
      - MAJOOR_ALLOW_REMOTE_WRITE=1 allows remote writes when no token is set.
    """
    configured_hash = _get_write_token_hash()
    require_auth = _env_truthy("MAJOOR_REQUIRE_AUTH")
    allow_remote = _env_truthy("MAJOOR_ALLOW_REMOTE_WRITE", default=False)

    client_ip = _resolve_client_ip(peer_ip, headers)
    provided = _extract_write_token_from_headers(headers)
    if configured_hash:
        return _check_write_access_with_token(
            client_ip=client_ip,
            configured_hash=configured_hash,
            provided=provided,
            peer_ip=peer_ip,
            headers=headers,
            request_scheme=request_scheme,
            require_auth=require_auth,
        )
    return _check_write_access_without_token(
        client_ip=client_ip,
        allow_remote=allow_remote,
        require_auth=require_auth,
        headers=headers,
        request_scheme=request_scheme,
    )


def _has_configured_write_token() -> bool:
    try:
        return bool(_get_write_token_hash())
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Request-level guards
# ---------------------------------------------------------------------------


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
        headers = request.headers
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


def _request_transport_is_secure(
    *, peer_ip: str, headers: Mapping[str, str], request_scheme: str
) -> bool:
    scheme = str(request_scheme or "").strip().lower()
    if scheme == "https":
        return True

    client_ip = _resolve_client_ip(peer_ip, headers)
    if _is_loopback_ip(client_ip):
        return True

    if not _is_trusted_proxy(peer_ip):
        return False

    from .security_proxies import _header_value

    forwarded_proto = _header_value(headers, "X-Forwarded-Proto")
    if not forwarded_proto:
        return False
    first = forwarded_proto.split(",")[0].strip().lower()
    return first == "https"


# ---------------------------------------------------------------------------
# Test helpers
# ---------------------------------------------------------------------------


def _push_request_user_context(request: web.Request | None) -> Any:
    """
    Push current user id into async context. Defined here (not in security_auth_context)
    so tests can monkeypatch sec._get_request_user_id and have it take effect.
    """
    return _push_request_user_context_with(request, _get_request_user_id)


def _reset_security_state_for_tests() -> None:
    from .security_rate_limit import _reset_rate_limit_state_for_tests

    _reset_rate_limit_state_for_tests()
    try:
        _is_trusted_proxy.cache_clear()
    except Exception:
        pass
    try:
        _safe_mode_enabled.cache_clear()
    except Exception:
        pass
    try:
        _WARNED_TOKEN_SOURCES.clear()
    except Exception:
        pass
