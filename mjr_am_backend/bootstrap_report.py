"""
Bootstrap Report — structured observability of the plugin startup sequence.

Every bootstrap stage calls ``record_stage()`` with its outcome.
The accumulated state is exposed via ``get_report()`` and surfaced on the
/mjr/am/health endpoint under the ``bootstrap`` key.

Failure taxonomy
----------------
FATAL        Plugin cannot function at all. ComfyUI may still start but the
             extension is effectively disabled.
DEGRADED     Plugin starts but a *capability* is unavailable (e.g. vector
             search, exiftool). User impact: reduced functionality.
RECOVERABLE  A transient problem that can resolve without a restart (e.g.
             retry, lazy init). No immediate user action needed.
USER_FACING  Something the user should know about (e.g. missing optional dep
             they may want to install).
INTERNAL     Purely operational log; never surfaced to the user.
NONE         Stage succeeded with no issues.

Stage status values
-------------------
ok           Stage completed successfully.
degraded     Stage completed but with reduced capability.
disabled     Stage skipped intentionally (feature flag / missing dep).
fatal        Stage failed in a way that blocks the plugin.
"""

from __future__ import annotations

import threading
import time
from enum import Enum
from typing import Any


class StageStatus(str, Enum):
    OK = "ok"
    DEGRADED = "degraded"
    DISABLED = "disabled"
    FATAL = "fatal"


class FailureSeverity(str, Enum):
    NONE = "none"
    INTERNAL = "internal"
    USER_FACING = "user_facing"
    RECOVERABLE = "recoverable"
    DEGRADED = "degraded"
    FATAL = "fatal"


_SEVERITY_ORDER: dict[str, int] = {
    FailureSeverity.NONE: 0,
    FailureSeverity.INTERNAL: 1,
    FailureSeverity.RECOVERABLE: 2,
    FailureSeverity.USER_FACING: 3,
    FailureSeverity.DEGRADED: 4,
    FailureSeverity.FATAL: 5,
}

_STATUS_TO_OVERALL: dict[str, str] = {
    StageStatus.OK: "ok",
    StageStatus.DISABLED: "ok",
    StageStatus.DEGRADED: "degraded",
    StageStatus.FATAL: "fatal",
}


class _BootstrapRegistry:
    """Thread-safe registry of bootstrap stage outcomes."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._stages: dict[str, dict[str, Any]] = {}
        self._started_at: float = time.time()

    def record(
        self,
        name: str,
        status: StageStatus | str,
        severity: FailureSeverity | str = FailureSeverity.NONE,
        detail: str | None = None,
    ) -> None:
        """Record or update a stage outcome.

        Args:
            name:     Stable stage identifier, e.g. ``"routes"`` or ``"security_middlewares"``.
            status:   Outcome of the stage (ok / degraded / disabled / fatal).
            severity: Failure severity classification (NONE for successful stages).
            detail:   Optional short human-readable explanation (max ~200 chars).
        """
        entry: dict[str, Any] = {
            "status": str(status),
            "severity": str(severity),
            "detail": str(detail)[:200] if detail else None,
        }
        with self._lock:
            self._stages[name] = entry

    def get_report(self) -> dict[str, Any]:
        """Return a snapshot of the bootstrap state as a plain dict.

        The ``overall`` field is the worst outcome across all stages:
        ``fatal`` > ``degraded`` > ``ok``.
        """
        with self._lock:
            stages = dict(self._stages)

        overall = "ok"
        for entry in stages.values():
            candidate = _STATUS_TO_OVERALL.get(entry["status"], "degraded")
            if _SEVERITY_ORDER.get(candidate, 0) > _SEVERITY_ORDER.get(overall, 0):
                overall = candidate

        import datetime

        return {
            "overall": overall,
            "stages": stages,
            "started_at_utc": datetime.datetime.fromtimestamp(
                self._started_at, tz=datetime.timezone.utc
            ).isoformat(),
        }

    def reset(self) -> None:
        """Clear all recorded stages (for testing idempotency only)."""
        with self._lock:
            self._stages.clear()
            self._started_at = time.time()


# Module-level singleton — imported everywhere
_registry = _BootstrapRegistry()


def record_stage(
    name: str,
    status: StageStatus | str,
    severity: FailureSeverity | str = FailureSeverity.NONE,
    detail: str | None = None,
) -> None:
    """Record a bootstrap stage outcome.

    Meant to be called from ``__init__.py`` bootstrap steps, the route
    registry, and feature module init.  Thread-safe; safe to call from any
    context (import time, async, thread pool).

    Example::

        from mjr_am_backend.bootstrap_report import record_stage, StageStatus, FailureSeverity

        try:
            install_observability()
            record_stage("observability", StageStatus.OK)
        except ImportError as exc:
            record_stage(
                "observability",
                StageStatus.DISABLED,
                FailureSeverity.INTERNAL,
                f"optional dep missing: {exc}",
            )
    """
    _registry.record(name, status, severity, detail)


def get_report() -> dict[str, Any]:
    """Return a snapshot of the bootstrap report as a JSON-serialisable dict."""
    return _registry.get_report()


def reset_report() -> None:
    """Reset the registry (only for unit tests)."""
    _registry.reset()


__all__ = [
    "FailureSeverity",
    "StageStatus",
    "get_report",
    "record_stage",
    "reset_report",
]
