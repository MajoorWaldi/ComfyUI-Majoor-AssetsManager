"""Rate limiting state machine and helpers."""

from __future__ import annotations

import os
import threading
import time
from collections import OrderedDict

from aiohttp import web

from mjr_am_backend.shared import get_logger

logger = get_logger(__name__)

_DEFAULT_MAX_RATE_LIMIT_CLIENTS = 1_000
_DEFAULT_MAX_RATE_LIMIT_ENDPOINTS_PER_CLIENT = 32
_DEFAULT_RATE_LIMIT_MIN_WINDOW_SECONDS = 60
_DEFAULT_RATE_LIMIT_BACKGROUND_CLEANUP_SECONDS = 60

try:
    _MAX_RATE_LIMIT_CLIENTS = int(
        os.environ.get("MAJOOR_RATE_LIMIT_MAX_CLIENTS", str(_DEFAULT_MAX_RATE_LIMIT_CLIENTS))
    )
except Exception:
    _MAX_RATE_LIMIT_CLIENTS = _DEFAULT_MAX_RATE_LIMIT_CLIENTS

try:
    _RATE_LIMIT_MIN_WINDOW_SECONDS = int(
        os.environ.get(
            "MAJOOR_RATE_LIMIT_MIN_WINDOW_SECONDS", str(_DEFAULT_RATE_LIMIT_MIN_WINDOW_SECONDS)
        )
    )
except Exception:
    _RATE_LIMIT_MIN_WINDOW_SECONDS = _DEFAULT_RATE_LIMIT_MIN_WINDOW_SECONDS

try:
    _MAX_RATE_LIMIT_ENDPOINTS_PER_CLIENT = int(
        os.environ.get(
            "MAJOOR_RATE_LIMIT_MAX_ENDPOINTS_PER_CLIENT",
            str(_DEFAULT_MAX_RATE_LIMIT_ENDPOINTS_PER_CLIENT),
        )
    )
except Exception:
    _MAX_RATE_LIMIT_ENDPOINTS_PER_CLIENT = _DEFAULT_MAX_RATE_LIMIT_ENDPOINTS_PER_CLIENT

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

_rate_limit_state: OrderedDict[str, dict[str, list[float]]] = OrderedDict()
# INVARIANT: threading.Lock is used intentionally because all rate-limit updates
# are purely synchronous (dict/list mutations only). This avoids the cost and
# complexity of asyncio.Lock for a hot path that never awaits.
# **DO NOT** add any `await` inside a `with _rate_limit_lock:` critical section.
_rate_limit_lock = threading.Lock()
_rate_limit_cleanup_thread: threading.Thread | None = None
_rate_limit_cleanup_thread_lock = threading.Lock()
_rate_limit_cleanup_stop = threading.Event()


def _get_or_create_client_state(
    client_id: str, max_clients: int | None = None
) -> dict[str, list[float]]:
    if client_id in _rate_limit_state:
        _rate_limit_state.move_to_end(client_id)
        return _rate_limit_state[client_id]
    # Synchronous eviction at insertion time: pop the oldest entry (FIFO) whenever
    # the dict exceeds the limit. This caps memory at all times,
    # not just at background-cleanup intervals (HIGH-002).
    limit = max_clients if max_clients is not None else _MAX_RATE_LIMIT_CLIENTS
    while len(_rate_limit_state) >= limit:
        try:
            _rate_limit_state.popitem(last=False)
        except KeyError:
            break
    state: dict[str, list[float]] = {}
    _rate_limit_state[client_id] = state
    return state


def _evict_oldest_endpoint_if_needed(client_state: dict[str, list[float]], endpoint: str) -> None:
    if endpoint in client_state:
        return
    cap = max(1, int(_MAX_RATE_LIMIT_ENDPOINTS_PER_CLIENT or 1))
    while len(client_state) >= cap:
        try:
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
    window_seconds: int = 60,
    _max_clients: int | None = None,
) -> tuple[bool, int | None]:
    """
    Check if the current client exceeded the rate limit.

    Args:
        _max_clients: override for the max-clients cap (used by security.py wrapper so that
                      monkeypatching sec._MAX_RATE_LIMIT_CLIENTS takes effect in tests).

    Returns:
        (allowed, retry_after_seconds)
    """
    _ensure_rate_limit_cleanup_thread()

    try:
        from .security import _get_client_identifier  # lazy — breaks circular import
        client_id = _get_client_identifier(request)
        now = time.time()
    except Exception as exc:
        logger.warning("Rate limit identity resolution failed; failing open: %s", exc)
        return True, None

    try:
        with _rate_limit_lock:
            client_state = _get_or_create_client_state(client_id, max_clients=_max_clients)
            _evict_oldest_endpoint_if_needed(client_state, endpoint)
            previous = client_state.get(endpoint, [])
            recent = [ts for ts in previous if now - ts < window_seconds]

            if len(recent) >= max_requests:
                retry_after = int(window_seconds - (now - recent[0])) + 1
                return False, max(1, retry_after)

            recent.append(now)
            # Cap the list to max_requests to prevent unbounded growth (Fix C-7).
            if len(recent) > max_requests:
                recent = recent[-max_requests:]
            client_state[endpoint] = recent
            return True, None
    except Exception as exc:
        logger.error("Rate limit check raised unexpectedly; failing open: %s", exc, exc_info=True)
        return True, None


def _reset_rate_limit_state_for_tests() -> None:
    try:
        with _rate_limit_lock:
            _rate_limit_state.clear()
    except Exception:
        pass
    try:
        _rate_limit_cleanup_stop.set()
    except Exception:
        pass
