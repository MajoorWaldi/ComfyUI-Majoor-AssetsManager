"""
Security utilities: CSRF protection and rate limiting.
"""
import time
import threading
from collections import defaultdict
from typing import Optional
from urllib.parse import urlparse
from aiohttp import web

_rate_limit_state = defaultdict(list)
_rate_limit_lock = threading.Lock()


def _check_rate_limit(endpoint: str, max_requests: int = 3, window_seconds: int = 60) -> bool:
    now = time.time()
    with _rate_limit_lock:
        recent = [
            ts for ts in _rate_limit_state[endpoint]
            if now - ts < window_seconds
        ]
        if not recent:
            _rate_limit_state.pop(endpoint, None)
        else:
            _rate_limit_state[endpoint] = recent

        if len(recent) >= max_requests:
            return False
        recent.append(now)
        _rate_limit_state[endpoint] = recent
        return True


def _csrf_error(request: web.Request) -> Optional[str]:
    """
    Basic CSRF protection for state-changing endpoints.

    Strategy: if the browser sends an Origin header, require it to match Host.
    Requests without Origin are allowed (e.g. scripts/CLI).
    """
    origin = request.headers.get("Origin")
    if not origin:
        return None
    if origin == "null":
        return "Cross-site request blocked (Origin=null)"

    host = request.headers.get("Host")
    if not host:
        return None

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
            # `Host` may include port.
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
