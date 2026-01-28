"""
Utility helpers shared across backend modules.
"""
from __future__ import annotations

import os
from typing import Any

BOOL_TRUE_VALUES = frozenset({"1", "true", "yes", "on", "enabled"})
BOOL_FALSE_VALUES = frozenset({"0", "false", "no", "off", "disabled"})


def parse_bool(value: Any, default: bool = False) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in BOOL_TRUE_VALUES:
            return True
        if normalized in BOOL_FALSE_VALUES:
            return False
        try:
            return bool(float(normalized))
        except Exception:
            pass
    return default


def env_bool(name: str, default: bool) -> bool:
    if not name:
        return default
    try:
        raw = os.environ.get(name)
    except Exception:
        raw = None
    if raw is None:
        return default
    return parse_bool(raw, default)


def env_float(name: str, default: float) -> float:
    if not name:
        return default
    try:
        raw = os.environ.get(name)
    except Exception:
        raw = None
    if raw is None:
        return default
    try:
        return float(raw)
    except (ValueError, TypeError):
        return default
