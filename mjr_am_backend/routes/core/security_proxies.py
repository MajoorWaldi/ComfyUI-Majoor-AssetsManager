"""Trusted proxy resolution and IP utility helpers."""

from __future__ import annotations

import hashlib
import ipaddress
import os
from collections.abc import Mapping
from functools import lru_cache

from aiohttp import web

_DEFAULT_TRUSTED_PROXIES = "127.0.0.1,::1"
_DEFAULT_CLIENT_ID_HASH_HEX_CHARS = 16

try:
    _CLIENT_ID_HASH_HEX_CHARS = int(
        os.environ.get("MAJOOR_CLIENT_ID_HASH_CHARS", str(_DEFAULT_CLIENT_ID_HASH_HEX_CHARS))
    )
except Exception:
    _CLIENT_ID_HASH_HEX_CHARS = _DEFAULT_CLIENT_ID_HASH_HEX_CHARS


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


def _parse_trusted_proxies() -> list[ipaddress._BaseNetwork]:
    from .security_policy import _env_truthy

    raw = os.environ.get("MAJOOR_TRUSTED_PROXIES", _DEFAULT_TRUSTED_PROXIES)
    allow_insecure = _env_truthy("MAJOOR_ALLOW_INSECURE_TRUSTED_PROXIES", default=False)
    out: list[ipaddress._BaseNetwork] = []
    for part in (raw or "").split(","):
        s = part.strip()
        if not s:
            continue
        try:
            if "/" in s:
                out.append(ipaddress.ip_network(s, strict=False))
            else:
                ip = ipaddress.ip_address(s)
                out.append(ipaddress.ip_network(f"{ip}/{ip.max_prefixlen}", strict=False))
        except Exception:
            continue
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


def _real_ip_from_header(headers: Mapping[str, str]) -> str:
    real_ip = _header_value(headers, "X-Real-IP")
    if not real_ip:
        return ""
    return real_ip if _is_valid_ip(real_ip) else ""


def _extract_peer_ip(request: web.Request) -> str:
    try:
        peername = request.transport.get_extra_info("peername") if request.transport else None
        return peername[0] if peername else "unknown"
    except Exception:
        return "unknown"
