"""
Utility helpers shared across backend modules.
"""
from __future__ import annotations

import math
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


def sanitize_for_json(obj: Any) -> Any:
    """Recursively replace NaN/Infinity float values with ``None`` so the
    result is valid JSON.  ComfyUI nodes routinely store ``float('nan')`` in
    ``is_changed`` to signal *always re-execute*; Python's ``json.dumps``
    emits that as the bare token ``NaN`` which browsers reject.
    """
    if isinstance(obj, float):
        return None if (math.isnan(obj) or math.isinf(obj)) else obj
    if isinstance(obj, dict):
        return {k: sanitize_for_json(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [sanitize_for_json(v) for v in obj]
    return obj
