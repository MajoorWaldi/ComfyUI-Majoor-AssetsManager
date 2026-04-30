"""
Lightweight runtime activity tracking shared across background workers.

This keeps ComfyUI generation as the top-priority workload by allowing Majoor
background jobs to detect when execution is active or still within a short
post-generation cooldown window.
"""

from __future__ import annotations

import threading
import time
from typing import Any

_LOCK = threading.Lock()
_STATE: dict[str, Any] = {
    "generation_active": False,
    "active_prompt_id": "",
    "last_started_at": 0.0,
    "last_finished_at": 0.0,
    "cooldown_until": 0.0,
}


def _now() -> float:
    return time.monotonic()


def mark_generation_started(prompt_id: str | None = None) -> dict[str, Any]:
    now = _now()
    with _LOCK:
        _STATE["generation_active"] = True
        _STATE["active_prompt_id"] = str(prompt_id or "").strip()
        _STATE["last_started_at"] = now
        _STATE["cooldown_until"] = 0.0
        return _snapshot_locked(now)


def mark_generation_finished(
    prompt_id: str | None = None,
    *,
    cooldown_seconds: float = 0.0,
) -> dict[str, Any]:
    now = _now()
    requested_prompt_id = str(prompt_id or "").strip()
    try:
        cooldown = max(0.0, float(cooldown_seconds or 0.0))
    except Exception:
        cooldown = 0.0

    with _LOCK:
        active_prompt_id = str(_STATE.get("active_prompt_id") or "").strip()
        if requested_prompt_id and active_prompt_id and requested_prompt_id != active_prompt_id:
            return _snapshot_locked(now)
        _STATE["generation_active"] = False
        _STATE["active_prompt_id"] = ""
        _STATE["last_finished_at"] = now
        _STATE["cooldown_until"] = max(float(_STATE.get("cooldown_until") or 0.0), now + cooldown)
        return _snapshot_locked(now)


def is_generation_busy(*, include_cooldown: bool = True) -> bool:
    now = _now()
    with _LOCK:
        return _is_generation_busy_locked(now, include_cooldown=include_cooldown)


def get_runtime_activity_status() -> dict[str, Any]:
    now = _now()
    with _LOCK:
        return _snapshot_locked(now)


def _is_generation_busy_locked(now: float, *, include_cooldown: bool) -> bool:
    if bool(_STATE.get("generation_active")):
        return True
    if include_cooldown and float(_STATE.get("cooldown_until") or 0.0) > now:
        return True
    return False


def _snapshot_locked(now: float) -> dict[str, Any]:
    cooldown_until = float(_STATE.get("cooldown_until") or 0.0)
    cooldown_remaining = max(0.0, cooldown_until - now)
    generation_active = bool(_STATE.get("generation_active"))
    return {
        "generation_active": generation_active,
        "busy": generation_active or cooldown_remaining > 0.0,
        "active_prompt_id": str(_STATE.get("active_prompt_id") or "").strip() or None,
        "cooldown_remaining_ms": int(round(cooldown_remaining * 1000.0)),
        "last_started_at_monotonic": float(_STATE.get("last_started_at") or 0.0),
        "last_finished_at_monotonic": float(_STATE.get("last_finished_at") or 0.0),
    }


_PROMPT_LIFECYCLE_PROVIDER = None
_PROMPT_LIFECYCLE_REGISTERED = False
_PROMPT_LIFECYCLE_LOCK = threading.Lock()


def ensure_prompt_lifecycle_provider_registered() -> bool:
    """
    Register a tiny ComfyUI cache provider used only for prompt lifecycle hooks.

    ComfyUI emits prompt start/end through the external cache-provider API during
    backend execution. Using that hook keeps generation tracking correct even
    when no browser tab is connected.
    """
    global _PROMPT_LIFECYCLE_PROVIDER, _PROMPT_LIFECYCLE_REGISTERED
    with _PROMPT_LIFECYCLE_LOCK:
        if _PROMPT_LIFECYCLE_REGISTERED:
            return True
        try:
            from comfy_api.latest._caching import CacheProvider
            from comfy_execution.cache_provider import register_cache_provider
        except Exception:
            return False

        class _PromptLifecycleProvider(CacheProvider):
            async def on_lookup(self, context):  # type: ignore[override]
                _ = context
                return None

            async def on_store(self, context, value):  # type: ignore[override]
                _ = (context, value)
                return None

            def on_prompt_start(self, prompt_id: str) -> None:
                mark_generation_started(prompt_id)

            def on_prompt_end(self, prompt_id: str) -> None:
                try:
                    from .config import EXECUTION_IDLE_GRACE_SECONDS

                    cooldown_seconds = float(EXECUTION_IDLE_GRACE_SECONDS or 0.0)
                except Exception:
                    cooldown_seconds = 0.0
                mark_generation_finished(prompt_id, cooldown_seconds=cooldown_seconds)

        try:
            provider = _PromptLifecycleProvider()
            register_cache_provider(provider)
        except Exception:
            return False

        _PROMPT_LIFECYCLE_PROVIDER = provider
        _PROMPT_LIFECYCLE_REGISTERED = True
        return True
