"""Helpers to reduce noisy Majoor bootstrap logs when startup verbosity is disabled."""

from __future__ import annotations

import os
import sqlite3
from typing import Any

from .config import get_runtime_index_db_path
from .shared import log_success
from .utils import parse_bool

_STARTUP_VERBOSE_LOGS_DB_KEY = "startup_verbose_logs"
_STARTUP_VERBOSE_LOG_ENV_KEYS = (
    "MAJOOR_STARTUP_VERBOSE_LOGS",
    "MJR_AM_STARTUP_VERBOSE_LOGS",
    "MAJOOR_VERBOSE_STARTUP_LOGS",
    "MJR_AM_VERBOSE_STARTUP_LOGS",
)


def startup_verbose_logs_enabled(db_path: str | None = None) -> bool:
    env_value = _read_startup_verbose_logs_env()
    if env_value is not None:
        return env_value
    return _read_startup_verbose_logs_from_db(db_path)


def startup_log_info(logger: Any, message: str, *args: Any, db_path: str | None = None) -> None:
    if startup_verbose_logs_enabled(db_path):
        logger.info(message, *args)


def startup_log_success(logger: Any, message: str, *, db_path: str | None = None) -> None:
    if startup_verbose_logs_enabled(db_path):
        log_success(logger, message)


def _read_startup_verbose_logs_env() -> bool | None:
    for key in _STARTUP_VERBOSE_LOG_ENV_KEYS:
        try:
            raw = os.environ.get(key)
        except Exception:
            raw = None
        if raw is None or str(raw).strip() == "":
            continue
        return parse_bool(raw, False)
    return None


def _read_startup_verbose_logs_from_db(db_path: str | None = None) -> bool:
    target_db = str(db_path or get_runtime_index_db_path() or "").strip()
    if not target_db:
        return False
    try:
        with sqlite3.connect(target_db) as conn:
            row = conn.execute(
                "SELECT value FROM metadata WHERE key = ?",
                (_STARTUP_VERBOSE_LOGS_DB_KEY,),
            ).fetchone()
    except Exception:
        return False
    if not row:
        return False
    try:
        return parse_bool(row[0], False)
    except Exception:
        return False
