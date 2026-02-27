"""
Transaction and SQL utility helpers extracted from sqlite.py.
"""
import ctypes
import os
import re
import uuid
from pathlib import Path
from typing import Any

import aiosqlite


# Allow bare column names and qualified table.column identifiers.
_COLUMN_NAME_PATTERN = re.compile(r"^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)?$")
_IN_QUERY_FORBIDDEN = re.compile(
    r"(--|/\*|\*/|;|\bpragma\b|\battach\b|\bdetach\b|\bvacuum\b|\balter\b|\bdrop\b|\binsert\b|\bupdate\b|\bdelete\b)",
    re.IGNORECASE,
)


def tx_token(ctx_var: Any) -> str | None:
    try:
        ctx_tok = ctx_var.get()
    except Exception:
        ctx_tok = None
    return str(ctx_tok) if ctx_tok else None


def rows_to_dicts(rows: Any) -> list[dict[str, Any]]:
    if not rows:
        return []
    try:
        return [dict(r) for r in rows]
    except Exception:
        out: list[dict[str, Any]] = []
        for r in rows:
            try:
                out.append(dict(r))
            except Exception:
                pass
        return out


def is_write_sql(query: str) -> bool:
    q = str(query or "").lstrip()
    if not q:
        return False
    head = q.split(None, 1)[0].upper()
    if head in ("SELECT", "PRAGMA", "WITH", "EXPLAIN"):
        return False
    return True


def begin_stmt_for_mode(mode: str) -> str:
    mode_l = str(mode or "").strip().lower()
    if mode_l in ("immediate", "write"):
        return "BEGIN IMMEDIATE"
    if mode_l in ("exclusive",):
        return "BEGIN EXCLUSIVE"
    return "BEGIN"


def register_tx_token(sqlite_obj: Any, token: str, conn: aiosqlite.Connection, lock: Any) -> None:
    with sqlite_obj._tx_state_lock:
        sqlite_obj._tx_conns[token] = conn
        if lock is not None:
            sqlite_obj._tx_write_lock_tokens.add(token)
        else:
            sqlite_obj._tx_write_lock_tokens.discard(token)


def get_tx_state(sqlite_obj: Any, token: str) -> tuple[aiosqlite.Connection | None, bool]:
    with sqlite_obj._tx_state_lock:
        conn = sqlite_obj._tx_conns.get(token)
        is_writer = token in sqlite_obj._tx_write_lock_tokens
    return conn, is_writer


def cursor_write_result(cursor: Any):
    last_id = getattr(cursor, "lastrowid", None)
    rowcount = getattr(cursor, "rowcount", None)
    from ...shared import Result
    if last_id:
        return Result.Ok(last_id)
    return Result.Ok(rowcount if rowcount is not None else 0)


def is_missing_column_error(exc: Exception) -> bool:
    try:
        msg = str(exc).lower()
    except Exception:
        return False
    return "no such column" in msg


def is_missing_table_error(exc: Exception) -> bool:
    try:
        msg = str(exc).lower()
    except Exception:
        return False
    return "no such table" in msg


def validate_in_base_query(base_query: str) -> tuple[bool, str]:
    try:
        q = str(base_query or "").strip()
    except Exception:
        return False, "base_query must be a string"
    if not q:
        return False, "base_query is empty"
    if q.count("{IN_CLAUSE}") != 1:
        return False, "base_query must contain exactly one {IN_CLAUSE}"
    if not re.match(r"^(select|with)\b", q.lower().lstrip()):
        return False, "base_query must be a SELECT query"
    if _IN_QUERY_FORBIDDEN.search(q):
        return False, "base_query contains forbidden SQL tokens"
    return True, ""


def build_in_query(base_query: str, safe_column: str, value_count: int) -> tuple[bool, str, tuple]:
    try:
        n = int(value_count)
    except Exception:
        n = 0
    if n <= 0:
        return True, "", tuple()
    try:
        parts = str(base_query).split("{IN_CLAUSE}")
    except Exception:
        return False, "Invalid base_query template", tuple()
    if len(parts) != 2:
        return False, "base_query must contain exactly one {IN_CLAUSE}", tuple()
    placeholders = ",".join(["?"] * n)
    query = parts[0] + f"{safe_column} IN ({placeholders})" + parts[1]
    return True, query, tuple(["?"] * n)


def repair_column_name(column: str, known_columns_lower: dict[str, str], known_columns_lock: Any) -> str | None:
    if not column or not isinstance(column, str):
        return None
    normalized = column.strip()
    if not normalized:
        return None
    with known_columns_lock:
        hit = known_columns_lower.get(normalized.lower())
    if hit:
        return hit
    cleaned = re.sub(r"[^a-zA-Z0-9_.]", "", normalized)
    if not cleaned:
        return None
    with known_columns_lock:
        return known_columns_lower.get(cleaned.lower())


def validate_and_repair_column_name(
    column: str,
    known_columns_lower: dict[str, str],
    known_columns_lock: Any,
) -> tuple[bool, str | None]:
    if not column or not isinstance(column, str):
        return False, None
    stripped = column.strip()
    if not stripped:
        return False, None
    if _COLUMN_NAME_PATTERN.match(stripped):
        return True, stripped
    repaired = repair_column_name(stripped, known_columns_lower, known_columns_lock)
    if repaired and _COLUMN_NAME_PATTERN.match(repaired):
        return True, repaired
    return False, None


def schedule_delete_on_reboot(path: Path) -> bool:
    if os.name != "nt":
        return False
    try:
        windll = getattr(ctypes, "windll", None)
        kernel32 = getattr(windll, "kernel32", None) if windll is not None else None
        if kernel32 is None:
            return False
        return bool(kernel32.MoveFileExW(str(path), None, 0x4))
    except Exception:
        return False


def rename_or_delete(path: Path, renamed_files: list[dict[str, str]], last_error: Exception | None):
    from ...shared import Result
    try:
        trash = path.with_name(f"{path.name}.trash_{uuid.uuid4().hex}")
        path.rename(trash)
        renamed_files.append({"from": str(path), "to": str(trash)})
        return Result.Ok(True)
    except Exception as rename_err:
        scheduled = schedule_delete_on_reboot(path)
        if scheduled:
            return Result.Err(
                "DELETE_PENDING_REBOOT",
                f"Could not delete {path} now; scheduled for deletion at reboot. "
                f"Delete error: {last_error} | Rename failed: {rename_err}",
            )
        return Result.Err(
            "DELETE_FAILED",
            f"Could not delete {path}: {last_error} | Rename failed: {rename_err}",
        )
