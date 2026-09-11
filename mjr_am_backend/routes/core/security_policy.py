"""Security policy and preference helpers."""

from __future__ import annotations

import os
from collections.abc import Mapping
from functools import lru_cache
from typing import Any

from mjr_am_backend.shared import Result, get_logger

logger = get_logger(__name__)
_WARNED_TOKEN_SOURCES: set[str] = set()


def _env_truthy(name: str, default: bool = False) -> bool:
    try:
        raw = os.environ.get(name)
    except Exception:
        raw = None
    if raw is None:
        return bool(default)
    return str(raw).strip().lower() in ("1", "true", "yes", "on")


def _warn_invalid_token_once(source: str, message: str, *args: Any) -> None:
    if source in _WARNED_TOKEN_SOURCES:
        return
    _WARNED_TOKEN_SOURCES.add(source)
    logger.warning(message, *args)


def _validate_token_format(token: str, source: str) -> str | None:
    normalized = str(token or "").strip()
    if not normalized:
        return None
    length = len(normalized)
    if length < 16:
        _warn_invalid_token_once(
            source,
            "Token from %s too short (%d chars), minimum 16",
            source,
            length,
        )
        return None
    if length > 512:
        _warn_invalid_token_once(
            source,
            "Token from %s too long (%d chars), maximum 512",
            source,
            length,
        )
        return None
    return normalized


@lru_cache(maxsize=1)
def _safe_mode_enabled() -> bool:
    try:
        raw = os.environ.get("MAJOOR_SAFE_MODE")
    except Exception:
        raw = None
    if raw is None:
        return True
    return str(raw).strip().lower() in ("1", "true", "yes", "on")


def _resolve_safe_mode(prefs: Mapping[str, Any] | None) -> bool:
    if prefs and "safe_mode" in prefs:
        safe_mode_raw = prefs.get("safe_mode")
        return safe_mode_raw is True or str(safe_mode_raw).strip().lower() in (
            "1",
            "true",
            "yes",
            "on",
        )
    return _safe_mode_enabled()


def _coerce_pref_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    if isinstance(value, str):
        return value.strip().lower() in ("1", "true", "yes", "on")
    return bool(value)


def _pref_truthy(key: str, env_var: str, prefs: Mapping[str, Any] | None) -> bool:
    if prefs is not None and key in prefs:
        try:
            return _coerce_pref_bool(prefs[key])
        except Exception:
            logger.debug("_pref_truthy: suppressed exception", exc_info=True)
    return _env_truthy(env_var)


def _require_operation_enabled(
    operation: str, *, prefs: Mapping[str, Any] | None = None
) -> Result[bool]:
    op = str(operation or "").strip().lower()
    safe_mode = _resolve_safe_mode(prefs)

    def _pt(key: str, env_var: str) -> bool:
        return _pref_truthy(key, env_var, prefs)

    static_gates = _operation_static_gates()
    for ops, pref_key, env_var, message in static_gates:
        if op not in ops:
            continue
        if _pt(pref_key, env_var):
            return Result.Ok(True, operation=op, safe_mode=safe_mode)
        return Result.Err("FORBIDDEN", message, operation=op, safe_mode=safe_mode)

    if op in ("write", "rating", "tags", "asset_rating", "asset_tags"):
        if _write_allowed_in_context(safe_mode=safe_mode, pref_truthy=_pt):
            return Result.Ok(True, operation=op, safe_mode=safe_mode)
        return Result.Err(
            "FORBIDDEN",
            "Write operations are disabled in Safe Mode. Set MAJOOR_SAFE_MODE=0 to disable safe mode, or MAJOOR_ALLOW_WRITE=1 to allow rating/tags writes.",
            operation=op,
            safe_mode=safe_mode,
        )

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
    if not services:
        return None
    settings_service = services.get("settings")
    if not settings_service:
        return None
    try:
        return await settings_service.get_security_prefs()
    except Exception:
        return None

