"""
Database recovery and diagnostics helpers extracted from sqlite.py.
"""
import os
import re
import sqlite3
import time
from pathlib import Path
from typing import Any

from ...shared import get_logger

logger = get_logger(__name__)
_SAFE_IDENTIFIER_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def _is_safe_identifier(value: str) -> bool:
    try:
        return bool(_SAFE_IDENTIFIER_RE.match(str(value or "")))
    except Exception:
        return False


def _quoted_identifier(value: str) -> str:
    if not _is_safe_identifier(value):
        raise ValueError(f"Invalid identifier: {value!r}")
    safe = str(value).replace('"', '""')
    return f'"{safe}"'


def is_locked_error(exc: Exception) -> bool:
    try:
        msg = str(exc).lower()
    except Exception:
        return False
    return (
        "database is locked" in msg
        or "database table is locked" in msg
        or "database schema is locked" in msg
        or "sqlite_busy" in msg
    )


def is_malformed_error(exc: Exception) -> bool:
    try:
        msg = str(exc).lower()
    except Exception:
        return False
    return (
        "database disk image is malformed" in msg
        or "malformed database schema" in msg
        or "file is not a database" in msg
    )


def mark_locked_event(sqlite_obj: Any, exc: Exception) -> None:
    now = time.time()
    with sqlite_obj._diag_lock:
        sqlite_obj._diag["locked"] = True
        sqlite_obj._diag["last_locked_at"] = now
        sqlite_obj._diag["last_locked_error"] = str(exc)


def mark_malformed_event(sqlite_obj: Any, exc: Exception) -> None:
    now = time.time()
    with sqlite_obj._diag_lock:
        sqlite_obj._diag["malformed"] = True
        sqlite_obj._diag["last_malformed_at"] = now
        sqlite_obj._diag["last_malformed_error"] = str(exc)


def set_recovery_state(sqlite_obj: Any, state: str, error: str | None = None) -> None:
    now = time.time()
    with sqlite_obj._diag_lock:
        sqlite_obj._diag["recovery_state"] = str(state)
        sqlite_obj._diag["last_recovery_at"] = now
        sqlite_obj._diag["last_recovery_error"] = str(error) if error else None
        if state == "in_progress":
            sqlite_obj._diag["recovery_attempts"] = int(sqlite_obj._diag.get("recovery_attempts") or 0) + 1
        elif state == "success":
            sqlite_obj._diag["recovery_successes"] = int(sqlite_obj._diag.get("recovery_successes") or 0) + 1
        elif state in ("failed", "skipped_locked"):
            sqlite_obj._diag["recovery_failures"] = int(sqlite_obj._diag.get("recovery_failures") or 0) + 1


def is_auto_reset_enabled() -> bool:
    try:
        return str(os.getenv("MAJOOR_DB_AUTO_RESET", "true")).strip().lower() in (
            "1",
            "true",
            "yes",
            "on",
        )
    except Exception:
        return False


def is_auto_reset_throttled(sqlite_obj: Any, now: float) -> bool:
    with sqlite_obj._auto_reset_lock:
        if now - float(sqlite_obj._auto_reset_last_ts or 0.0) < float(sqlite_obj._auto_reset_cooldown_s):
            return True
        sqlite_obj._auto_reset_last_ts = now
        return False


def mark_auto_reset_attempt(sqlite_obj: Any, now: float) -> None:
    with sqlite_obj._diag_lock:
        sqlite_obj._diag["auto_reset_attempts"] = int(sqlite_obj._diag.get("auto_reset_attempts") or 0) + 1
        sqlite_obj._diag["last_auto_reset_at"] = now
        sqlite_obj._diag["last_auto_reset_error"] = None


def record_auto_reset_result(sqlite_obj: Any, reset_res: Any) -> None:
    if reset_res and reset_res.ok:
        logger.warning("Database auto-reset completed after corruption")
        with sqlite_obj._diag_lock:
            sqlite_obj._diag["auto_reset_successes"] = int(sqlite_obj._diag.get("auto_reset_successes") or 0) + 1
        return
    error_text = str(getattr(reset_res, "error", "unknown error"))
    logger.error("Database auto-reset failed after corruption: %s", error_text)
    with sqlite_obj._diag_lock:
        sqlite_obj._diag["auto_reset_failures"] = int(sqlite_obj._diag.get("auto_reset_failures") or 0) + 1
        sqlite_obj._diag["last_auto_reset_error"] = error_text


def extract_schema_column_name(row: Any) -> str:
    if not row or len(row) < 2:
        return ""
    return str(row[1]).strip()


def populate_table_columns(
    cursor: sqlite3.Cursor,
    table: str,
    alias: str | None,
    known_columns: set[str],
) -> None:
    try:
        table_ident = _quoted_identifier(table)
    except ValueError:
        logger.warning("Refusing unsafe table identifier in schema refresh: %r", table)
        return
    try:
        cursor.execute(f"PRAGMA table_info({table_ident})")
        for row in cursor.fetchall() or []:
            col = extract_schema_column_name(row)
            if not col:
                continue
            known_columns.add(col)
            if alias:
                known_columns.add(f"{alias}.{col}")
    except Exception as exc:
        logger.debug("Failed to inspect table columns for %s: %s", table, exc)


def populate_known_columns_from_schema(
    db_path: Path,
    known_columns: set[str],
    known_columns_lock: Any,
    schema_table_aliases: dict[str, str | None],
) -> dict[str, str]:
    if not db_path.exists():
        return {c.lower(): c for c in known_columns}
    try:
        with known_columns_lock:
            with sqlite3.connect(str(db_path)) as conn:
                cursor = conn.cursor()
                for table, alias in schema_table_aliases.items():
                    populate_table_columns(cursor, table, alias, known_columns)
            return {c.lower(): c for c in known_columns}
    except Exception as exc:
        logger.warning("Failed to refresh known columns from schema: %s", exc)
        return {c.lower(): c for c in known_columns}
