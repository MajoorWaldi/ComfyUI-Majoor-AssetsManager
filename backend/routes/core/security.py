"""
Security utilities: CSRF protection and rate limiting.
"""

from __future__ import annotations

import hashlib
import threading
import time
from collections import defaultdict
from typing import Optional, Tuple
from urllib.parse import urlparse

from aiohttp import web

# Per-client rate limiting state: {client_id: {endpoint: [timestamps]}}
_rate_limit_state = defaultdict(lambda: defaultdict(list))
_rate_limit_lock = threading.Lock()
_rate_limit_cleanup_counter = 0
_rate_limit_cleanup_interval = 100


def _get_client_identifier(request: web.Request) -> str:
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()
    else:
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            client_ip = real_ip.strip()
        else:
            peername = request.transport.get_extra_info("peername") if request.transport else None
            client_ip = peername[0] if peername else "unknown"
    return hashlib.sha256(client_ip.encode("utf-8", errors="ignore")).hexdigest()[:16]


def _cleanup_rate_limit_state(now: float, window_seconds: int) -> None:
    with _rate_limit_lock:
        for client_id, endpoints in list(_rate_limit_state.items()):
            for endpoint, timestamps in list(endpoints.items()):
                recent = [ts for ts in timestamps if now - ts < window_seconds]
                if recent:
                    endpoints[endpoint] = recent
                else:
                    endpoints.pop(endpoint, None)
            if not endpoints:
                _rate_limit_state.pop(client_id, None)


def _check_rate_limit(
    request: web.Request,
    endpoint: str,
    max_requests: int = 10,
    window_seconds: int = 60
) -> Tuple[bool, Optional[int]]:
    """
    Check if the current client exceeded the rate limit.

    Returns:
        (allowed, retry_after_seconds)
    """
    global _rate_limit_cleanup_counter

    try:
        client_id = _get_client_identifier(request)
        now = time.time()
    except Exception:
        # If we can't identify the client, fail open to avoid breaking UI.
        return True, None

    try:
        with _rate_limit_lock:
            _rate_limit_cleanup_counter += 1
            if _rate_limit_cleanup_counter >= _rate_limit_cleanup_interval:
                _cleanup_rate_limit_state(now, max(window_seconds, 60))
                _rate_limit_cleanup_counter = 0

            recent = [
                ts for ts in _rate_limit_state[client_id][endpoint]
                if now - ts < window_seconds
            ]

            if len(recent) >= max_requests:
                retry_after = int(window_seconds - (now - recent[0])) + 1
                return False, max(1, retry_after)

            recent.append(now)
            _rate_limit_state[client_id][endpoint] = recent
            return True, None
    except Exception:
        return True, None


def _csrf_error(request: web.Request) -> Optional[str]:
    """
    Enhanced CSRF protection for state-changing endpoints.

    Layers:
      1) Require an anti-CSRF header for state-changing methods (X-Requested-With or X-CSRF-Token)
      2) If Origin is present, validate it against Host (with loopback allowance)
    """
    method = request.method.upper()
    if method not in ("POST", "PUT", "DELETE", "PATCH"):
        return None

    try:
        has_xrw = bool(request.headers.get("X-Requested-With"))
        has_token = bool(request.headers.get("X-CSRF-Token"))
    except Exception:
        has_xrw = False
        has_token = False
    if not has_xrw and not has_token:
        return "Missing anti-CSRF header (X-Requested-With or X-CSRF-Token)"

    origin = request.headers.get("Origin")
    if not origin:
        return None
    if origin == "null":
        return "Cross-site request blocked (Origin=null)"

    host = request.headers.get("Host")
    if not host:
        return "Missing Host header"

    try:
        parsed = urlparse(origin)
    except Exception:
        return "Cross-site request blocked (invalid Origin)"

    if not parsed.scheme or not parsed.netloc:
        return "Cross-site request blocked (invalid Origin)"

    if parsed.netloc != host:
        # Allow loopback aliases (localhost, 127.0.0.1, ::1) to interoperate when the
        # user opens ComfyUI via a different hostname than the server reports.
        try:
            origin_host = parsed.hostname or ""
            origin_port = parsed.port
        except Exception:
            origin_host = ""
            origin_port = None

        try:
            if ":" in host and not host.endswith("]"):
                host_name, host_port_raw = host.rsplit(":", 1)
                host_port = int(host_port_raw)
            else:
                host_name = host
                host_port = None
        except Exception:
            host_name = host
            host_port = None

        loopback = {"localhost", "127.0.0.1", "::1"}
        if origin_host in loopback and host_name in loopback:
            if origin_port is None or host_port is None or origin_port == host_port:
                return None

        return f"Cross-site request blocked ({parsed.netloc} != {host})"

    return None


def _reset_security_state_for_tests() -> None:
    try:
        with _rate_limit_lock:
            _rate_limit_state.clear()
    except Exception:
        pass

