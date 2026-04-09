"""CSRF validation helpers."""

from __future__ import annotations

from typing import Any
from urllib.parse import urlparse

from aiohttp import web

from .security_proxies import _extract_peer_ip, _is_trusted_proxy


def _has_csrf_header(request: web.Request) -> bool:
    try:
        return bool(request.headers.get("X-Requested-With")) or bool(
            request.headers.get("X-CSRF-Token")
        )
    except Exception:
        return False


def _parse_origin(origin: str) -> Any:
    try:
        parsed = urlparse(origin)
    except Exception:
        return None
    if not parsed.scheme or not parsed.netloc:
        return None
    return parsed


def _split_host_port(host: str) -> tuple[str, int | None]:
    try:
        if ":" in host and not host.endswith("]"):
            host_name, host_port_raw = host.rsplit(":", 1)
            return host_name, int(host_port_raw)
    except Exception:
        return host, None
    return host, None


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


def _csrf_error(request: web.Request) -> str | None:
    """
    Enhanced CSRF protection for state-changing endpoints.

    Layers:
      1) Require an anti-CSRF header (X-Requested-With or X-CSRF-Token)
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
