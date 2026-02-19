"""
SQLite database connection manager.

Implementation note (async-first migration):
- This adapter uses `aiosqlite` internally.
- The public API exposes async methods as primary surface.

Why this shape:
- Most of the backend logic (scanner/searcher/updater/schema) is synchronous today.
- aiohttp handlers already offload DB-heavy work via `asyncio.to_thread(...)` (Option B).
- This migration replaces the blocking `sqlite3` usage with `aiosqlite` without forcing a full
  async refactor of the whole backend at once.

Critical guarantee:
- The adapter never raises to callers; it returns `Result(...)`.
"""

from __future__ import annotations

import gc
import asyncio
import contextvars
import random
import re
import threading
import time
import uuid
import os
import json
import ctypes
from contextlib import asynccontextmanager
from pathlib import Path
from queue import Empty, Queue
from typing import Any, Dict, List, Optional, Tuple

import aiosqlite
import sqlite3

from ...config import DB_MAX_CONNECTIONS, DB_QUERY_TIMEOUT, DB_TIMEOUT
from ...shared import ErrorCode, Result, get_logger

logger = get_logger(__name__)

SQLITE_BUSY_TIMEOUT_MS = max(1000, int(float(DB_TIMEOUT) * 1000))
# Negative cache_size is in KiB. -64000 ~= 64 MiB cache.
SQLITE_CACHE_SIZE_KIB = -64000
ASSET_LOCKS_MAX = int(os.getenv("MAJOOR_ASSET_LOCKS_MAX", "10000") or 10000)
ASSET_LOCKS_TTL_S = float(os.getenv("MAJOOR_ASSET_LOCKS_TTL_SECONDS", "600") or 600.0)

_TX_TOKEN: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("mjr_db_tx_token", default=None)
_COLUMN_NAME_PATTERN = re.compile(r"^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)?$")
_KNOWN_COLUMNS = {
    # assets
    "id",
    "filename",
    "subfolder",
    "filepath",
    "source",
    "root_id",
    "kind",
    "ext",
    "size",
    "mtime",
    "width",
    "height",
    "duration",
    "created_at",
    "updated_at",
    "indexed_at",
    "content_hash",
    "phash",
    "hash_state",
    # asset_metadata
    "asset_id",
    "rating",
    "tags",
    "tags_text",
    "workflow_hash",
    "has_workflow",
    "has_generation_data",
    "metadata_quality",
    "metadata_raw",
    # scan_journal
    "dir_path",
    "state_hash",
    "last_seen",
    # metadata_cache
    "metadata_hash",
    # common aliases
    "a.id",
    "a.filepath",
    "a.filename",
    "a.subfolder",
    "a.kind",
    "a.mtime",
    "a.source",
    "a.root_id",
    "a.content_hash",
    "a.phash",
    "a.hash_state",
    "m.asset_id",
    "m.rating",
    "m.tags",
    "m.tags_text",
    "m.metadata_raw",
    "m.has_workflow",
    "m.has_generation_data",
}
_KNOWN_COLUMNS_LOWER = {c.lower(): c for c in _KNOWN_COLUMNS}
_SCHEMA_TABLE_ALIASES = {
    "assets": "a",
    "asset_metadata": "m",
    "scan_journal": None,
    "metadata_cache": None,
}


def _is_missing_column_error(exc: Exception) -> bool:
    try:
        msg = str(exc).lower()
    except Exception:
        return False
    return "no such column" in msg


def _is_missing_table_error(exc: Exception) -> bool:
    try:
        msg = str(exc).lower()
    except Exception:
        return False
    return "no such table" in msg

def _populate_known_columns_from_schema(db_path: Path) -> None:
    global _KNOWN_COLUMNS_LOWER
    try:
        if not db_path.exists():
            return
        with sqlite3.connect(str(db_path)) as conn:
            cursor = conn.cursor()
            for table, alias in _SCHEMA_TABLE_ALIASES.items():
                _populate_table_columns(cursor, table, alias)
            _KNOWN_COLUMNS_LOWER = {c.lower(): c for c in _KNOWN_COLUMNS}
    except Exception as exc:
        logger.warning("Failed to refresh known columns from schema: %s", exc)


def _populate_table_columns(cursor: sqlite3.Cursor, table: str, alias: Optional[str]) -> None:
    try:
        cursor.execute(f"PRAGMA table_info({table})")
        for row in cursor.fetchall() or []:
            col = _extract_schema_column_name(row)
            if not col:
                continue
            _KNOWN_COLUMNS.add(col)
            if alias:
                _KNOWN_COLUMNS.add(f"{alias}.{col}")
    except Exception:
        pass


def _extract_schema_column_name(row: Any) -> str:
    if not row or len(row) < 2:
        return ""
    return str(row[1]).strip()

_IN_QUERY_FORBIDDEN = re.compile(
    r"(--|/\*|\*/|;|\bpragma\b|\battach\b|\bdetach\b|\bvacuum\b|\balter\b|\bdrop\b|\binsert\b|\bupdate\b|\bdelete\b)",
    re.IGNORECASE,
)


def _validate_in_base_query(base_query: str) -> Tuple[bool, str]:
    """
    Validate the `base_query` template used by `query_in`.

    Threat model: even though `base_query` is expected to be a constant defined in code,
    enforcing a conservative allowlist prevents accidental misuse that could reintroduce
    SQL injection.
    """
    try:
        q = str(base_query or "").strip()
    except Exception:
        return False, "base_query must be a string"

    if not q:
        return False, "base_query is empty"

    if q.count("{IN_CLAUSE}") != 1:
        return False, "base_query must contain exactly one {IN_CLAUSE}"

    # Only allow SELECT (optionally with WITH) templates.
    q_lower = q.lower().lstrip()
    if not re.match(r"^(select|with)\b", q_lower):
        return False, "base_query must be a SELECT query"

    # Reject obvious multi-statement or dangerous SQL constructs.
    if _IN_QUERY_FORBIDDEN.search(q):
        return False, "base_query contains forbidden SQL tokens"

    return True, ""


def _build_in_query(base_query: str, safe_column: str, value_count: int) -> Tuple[bool, str, tuple]:
    """
    Build a parameterized IN-clause query from a validated template.

    Returns:
        (ok, query_or_error, placeholders_tuple)
    """
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
    in_clause = f"{safe_column} IN ({placeholders})"
    query = parts[0] + in_clause + parts[1]
    return True, query, tuple(["?"] * n)


def _try_repair_column_name(column: str) -> Optional[str]:
    if not column or not isinstance(column, str):
        return None

    normalized = column.strip()
    if not normalized:
        return None

    # Case-insensitive match against known columns/aliases.
    hit = _KNOWN_COLUMNS_LOWER.get(normalized.lower())
    if hit:
        return hit

    # Strip all characters except [a-zA-Z0-9_.] and try again (still must match known list).
    cleaned = re.sub(r"[^a-zA-Z0-9_.]", "", normalized)
    if not cleaned:
        return None
    if cleaned.lower() in _KNOWN_COLUMNS_LOWER:
        return _KNOWN_COLUMNS_LOWER[cleaned.lower()]
    return None


def _validate_and_repair_column_name(column: str) -> Tuple[bool, Optional[str]]:
    """
    Validate a SQL column identifier (optionally with table alias), and best-effort
    repair common user/legacy mistakes without weakening injection protections.

    Returns:
        (is_valid, safe_column_or_none)
    """
    if not column or not isinstance(column, str):
        return False, None

    stripped = column.strip()
    if not stripped:
        return False, None

    # Fast path: already valid after trimming.
    if _COLUMN_NAME_PATTERN.match(stripped):
        return True, stripped

    repaired = _try_repair_column_name(stripped)
    if repaired and _COLUMN_NAME_PATTERN.match(repaired):
        return True, repaired

    return False, None


def _asset_lock_key(asset_id: Any) -> str:
    if asset_id is None:
        return "asset:__null__"
    return f"asset:{str(asset_id)}"


class _AsyncLoopThread:
    def __init__(self):
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._thread: Optional[threading.Thread] = None
        self._thread_ident: Optional[int] = None
        self._ready = threading.Event()

    def start(self) -> asyncio.AbstractEventLoop:
        if self._loop and self._thread and self._thread.is_alive():
            return self._loop

        self._ready.clear()

        def _run():
            self._thread_ident = threading.get_ident()
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            self._loop = loop
            self._ready.set()
            try:
                loop.run_forever()
            finally:
                try:
                    pending = asyncio.all_tasks(loop)
                    for task in pending:
                        task.cancel()
                    if pending:
                        loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))
                except Exception:
                    pass
                try:
                    loop.close()
                except Exception:
                    pass

        self._thread = threading.Thread(target=_run, daemon=True)
        self._thread.start()
        self._ready.wait(timeout=10.0)
        if not self._loop:
            raise RuntimeError("Failed to start DB async loop thread")
        return self._loop

    def run(self, coro):
        loop = self.start()
        # Calling run() from the loop thread deadlocks on fut.result().
        if self._thread_ident == threading.get_ident():
            raise RuntimeError(
                "Synchronous DB API called from DB loop thread; use async DB methods to avoid deadlock"
            )
        fut = asyncio.run_coroutine_threadsafe(coro, loop)
        return fut.result()

    def submit(self, coro):
        loop = self.start()
        return asyncio.run_coroutine_threadsafe(coro, loop)

    def stop(self):
        loop = self._loop
        if not loop:
            return
        try:
            loop.call_soon_threadsafe(loop.stop)
        except Exception:
            pass
        self._thread_ident = None


class Sqlite:
    """
    Connection pool manager for SQLite (aiosqlite-backed).

    Synchronous API, async execution on a dedicated loop thread.
    """

    def __init__(self, db_path: str, max_connections: Optional[int] = None, timeout: float = 30.0):
        self.db_path = Path(db_path)
        user_config = self._load_user_db_config()
        max_conn = (
            int(max_connections)
            if max_connections is not None
            else int(user_config.get("maxConnections", DB_MAX_CONNECTIONS or 8))
        )
        max_conn = max(1, max_conn)
        self._max_conn_limit = max_conn
        self._pool: "Queue[aiosqlite.Connection]" = Queue(maxsize=max_conn)
        self._initialized = False
        self._lock = threading.Lock()
        self._async_sem: Optional[asyncio.Semaphore] = None

        # Reset mechanics
        self._resetting = False
        self._active_conns: set[aiosqlite.Connection] = set()
        self._active_conns_idle = threading.Event()
        self._active_conns_idle.set()

        self._timeout = float(user_config.get("timeout", timeout))
        self._query_timeout = float(user_config.get("queryTimeout", DB_QUERY_TIMEOUT if DB_QUERY_TIMEOUT is not None else 0.0))
        self._lock_retry_attempts = 6
        self._lock_retry_base_seconds = 0.05
        self._lock_retry_max_seconds = 0.75

        # Transaction connections live on the loop thread; keyed by token.
        self._tx_conns: Dict[str, aiosqlite.Connection] = {}

        self._loop_thread = _AsyncLoopThread()
        self._write_lock: Optional[asyncio.Lock] = None
        self._tx_write_lock_tokens: set[str] = set()
        self._tx_state_lock = threading.Lock()
        self._asset_locks: Dict[str, Dict[str, Any]] = {}
        self._asset_locks_lock = threading.Lock()
        self._malformed_recovery_lock = threading.Lock()
        self._malformed_recovery_last_ts = 0.0
        self._auto_reset_lock = threading.Lock()
        self._auto_reset_last_ts = 0.0
        self._auto_reset_cooldown_s = 30.0
        self._schema_repair_lock = threading.Lock()
        self._schema_repair_last_ts = 0.0
        self._diag_lock = threading.Lock()
        self._diag: Dict[str, Any] = {
            "locked": False,
            "last_locked_error": None,
            "last_locked_at": None,
            "malformed": False,
            "last_malformed_error": None,
            "last_malformed_at": None,
            "recovery_state": "idle",  # idle|in_progress|success|failed|skipped_locked
            "last_recovery_at": None,
            "last_recovery_error": None,
            "recovery_attempts": 0,
            "recovery_successes": 0,
            "recovery_failures": 0,
            "auto_reset_attempts": 0,
            "auto_reset_successes": 0,
            "auto_reset_failures": 0,
            "last_auto_reset_at": None,
            "last_auto_reset_error": None,
        }

        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()
        _populate_known_columns_from_schema(self.db_path)

    def _load_user_db_config(self) -> Dict[str, Any]:
        """
        Load optional user DB overrides from JSON file.

        Path resolution order:
        1) MAJOOR_DB_CONFIG_PATH
        2) <db parent>/db_config.json
        """
        try:
            cfg_path = self._resolve_user_db_config_path()
            data = self._read_user_db_config_file(cfg_path)
            if not isinstance(data, dict):
                return {}
            return self._normalize_user_db_config(data)
        except Exception as exc:
            logger.debug("Ignoring invalid DB user config: %s", exc)
            return {}

    def _resolve_user_db_config_path(self) -> Path:
        cfg_path_raw = os.getenv("MAJOOR_DB_CONFIG_PATH", "").strip()
        return Path(cfg_path_raw).expanduser() if cfg_path_raw else (self.db_path.parent / "db_config.json")

    @staticmethod
    def _read_user_db_config_file(cfg_path: Path) -> Any:
        if not cfg_path.exists() or not cfg_path.is_file():
            return {}
        with cfg_path.open("r", encoding="utf-8") as f:
            return json.load(f)

    @staticmethod
    def _normalize_user_db_config(data: Dict[str, Any]) -> Dict[str, Any]:
        out: Dict[str, Any] = {}
        Sqlite._maybe_set_config_number(out, data, "timeout", min_value=1.0, cast=float)
        Sqlite._maybe_set_config_number(out, data, "maxConnections", min_value=1, cast=int)
        Sqlite._maybe_set_config_number(out, data, "queryTimeout", min_value=0.0, cast=float)
        return out

    @staticmethod
    def _maybe_set_config_number(
        out: Dict[str, Any],
        data: Dict[str, Any],
        key: str,
        *,
        min_value: float,
        cast,
    ) -> None:
        try:
            if key not in data:
                return
            raw = data.get(key)
            if raw is None:
                return
            out[key] = max(min_value, cast(raw))
        except Exception:
            return

    def _is_locked_error(self, exc: Exception) -> bool:
        try:
            msg = str(exc).lower()
        except Exception:
            return False
        return (
            "database is locked" in msg
            or "database table is locked" in msg
            or "database schema is locked" in msg
            or "busy" in msg
            or "locked" in msg
        )

    def _is_malformed_error(self, exc: Exception) -> bool:
        try:
            msg = str(exc).lower()
        except Exception:
            return False
        return (
            "database disk image is malformed" in msg
            or "malformed database schema" in msg
            or "file is not a database" in msg
        )

    def _mark_locked_event(self, exc: Exception) -> None:
        now = time.time()
        with self._diag_lock:
            self._diag["locked"] = True
            self._diag["last_locked_at"] = now
            self._diag["last_locked_error"] = str(exc)

    def _mark_malformed_event(self, exc: Exception) -> None:
        now = time.time()
        with self._diag_lock:
            self._diag["malformed"] = True
            self._diag["last_malformed_at"] = now
            self._diag["last_malformed_error"] = str(exc)

    def _set_recovery_state(self, state: str, error: Optional[str] = None) -> None:
        now = time.time()
        with self._diag_lock:
            self._diag["recovery_state"] = str(state)
            self._diag["last_recovery_at"] = now
            self._diag["last_recovery_error"] = str(error) if error else None
            if state == "in_progress":
                self._diag["recovery_attempts"] = int(self._diag.get("recovery_attempts") or 0) + 1
            elif state == "success":
                self._diag["recovery_successes"] = int(self._diag.get("recovery_successes") or 0) + 1
            elif state in ("failed", "skipped_locked"):
                self._diag["recovery_failures"] = int(self._diag.get("recovery_failures") or 0) + 1

    async def _maybe_auto_reset_on_corruption(self, error: Exception) -> None:
        """
        Auto-reset DB on corruption by default; can be disabled with MAJOOR_DB_AUTO_RESET=false.
        """
        if not self._is_auto_reset_enabled():
            logger.error(
                "Corruption detected (%s). Auto-reset disabled (MAJOOR_DB_AUTO_RESET=false)",
                error,
            )
            return

        now = time.time()
        if self._is_auto_reset_throttled(now):
            logger.warning("Corruption auto-reset throttled (cooldown %.1fs)", float(self._auto_reset_cooldown_s))
            return
        self._mark_auto_reset_attempt(now)

        try:
            reset_res = await self.areset()
            self._record_auto_reset_result(reset_res)
        except Exception as exc:
            logger.error("Database auto-reset exception after corruption: %s", exc)
            with self._diag_lock:
                self._diag["auto_reset_failures"] = int(self._diag.get("auto_reset_failures") or 0) + 1
                self._diag["last_auto_reset_error"] = str(exc)

    @staticmethod
    def _is_auto_reset_enabled() -> bool:
        try:
            return str(os.getenv("MAJOOR_DB_AUTO_RESET", "true")).strip().lower() in (
                "1",
                "true",
                "yes",
                "on",
            )
        except Exception:
            return False

    def _is_auto_reset_throttled(self, now: float) -> bool:
        with self._auto_reset_lock:
            if now - float(self._auto_reset_last_ts or 0.0) < float(self._auto_reset_cooldown_s):
                return True
            self._auto_reset_last_ts = now
            return False

    def _mark_auto_reset_attempt(self, now: float) -> None:
        with self._diag_lock:
            self._diag["auto_reset_attempts"] = int(self._diag.get("auto_reset_attempts") or 0) + 1
            self._diag["last_auto_reset_at"] = now
            self._diag["last_auto_reset_error"] = None

    def _record_auto_reset_result(self, reset_res: Any) -> None:
        if reset_res and reset_res.ok:
            logger.warning("Database auto-reset completed after corruption")
            with self._diag_lock:
                self._diag["auto_reset_successes"] = int(self._diag.get("auto_reset_successes") or 0) + 1
            return
        error_text = str(getattr(reset_res, "error", "unknown error"))
        logger.error("Database auto-reset failed after corruption: %s", error_text)
        with self._diag_lock:
            self._diag["auto_reset_failures"] = int(self._diag.get("auto_reset_failures") or 0) + 1
            self._diag["last_auto_reset_error"] = error_text

    def get_diagnostics(self) -> Dict[str, Any]:
        with self._diag_lock:
            data = dict(self._diag)
        # reset volatile "locked" flag if no recent lock event
        try:
            last = float(data.get("last_locked_at") or 0.0)
            if last and (time.time() - last) > 10.0:
                data["locked"] = False
        except Exception:
            pass
        return data

    async def _attempt_malformed_recovery_async(self, conn: aiosqlite.Connection) -> bool:
        """
        Best-effort online recovery for transient malformed errors.

        This is intentionally conservative: checkpoint WAL, run quick check,
        and rebuild FTS indexes if available. Hard reset remains an explicit operation.
        """
        now = time.time()
        with self._malformed_recovery_lock:
            if now - float(self._malformed_recovery_last_ts or 0.0) < 5.0:
                return False
            self._malformed_recovery_last_ts = now

        async def _run_pragma_with_lock_retry(sql: str, fetch_one: bool = False) -> Optional[Any]:
            for attempt in range(self._lock_retry_attempts + 1):
                try:
                    cur = await conn.execute(sql)
                    try:
                        if fetch_one:
                            return await cur.fetchone()
                        await cur.fetchall()
                        return True
                    finally:
                        try:
                            await cur.close()
                        except Exception:
                            pass
                except sqlite3.OperationalError as exc:
                    if self._is_locked_error(exc) and attempt < self._lock_retry_attempts:
                        await self._sleep_backoff(attempt)
                        continue
                    raise
            return None

        try:
            self._set_recovery_state("in_progress")
            logger.warning("DB malformed detected; attempting online recovery")

            # Flush/merge WAL first; malformed bursts can come from partial WAL state.
            await _run_pragma_with_lock_retry("PRAGMA wal_checkpoint(TRUNCATE)")

            # Lightweight consistency check.
            row = await _run_pragma_with_lock_retry("PRAGMA quick_check", fetch_one=True)
            if not row or str(row[0]).lower() != "ok":
                return False

            # Rebuild FTS tables if present (best-effort).
            for stmt in (
                "INSERT INTO assets_fts(assets_fts) VALUES('rebuild')",
                "INSERT INTO asset_metadata_fts(asset_metadata_fts) VALUES('rebuild')",
            ):
                try:
                    await _run_pragma_with_lock_retry(stmt)
                except Exception:
                    # Not fatal: FTS table may not exist yet.
                    pass

            self._set_recovery_state("success")
            return True
        except sqlite3.OperationalError as rec_exc:
            if self._is_locked_error(rec_exc):
                # This can happen during concurrent reset/scan churn; keep signal but avoid noisy hard-error spam.
                self._mark_locked_event(rec_exc)
                self._set_recovery_state("skipped_locked", str(rec_exc))
                logger.warning("Online recovery skipped due to active DB lock: %s", rec_exc)
                return False
            self._set_recovery_state("failed", str(rec_exc))
            logger.error("Online recovery failed: %s", rec_exc)
            return False

    async def _attempt_missing_table_recovery_async(self) -> bool:
        """
        Best-effort schema recovery when a query fails with "no such table".
        Throttled to avoid repeated heavy repairs under concurrent failures.
        """
        now = time.time()
        with self._schema_repair_lock:
            if (now - self._schema_repair_last_ts) < 5.0:
                return False
            self._schema_repair_last_ts = now
        try:
            from .schema import migrate_schema

            result = await migrate_schema(self)
            if result and result.ok:
                try:
                    _populate_known_columns_from_schema(self.db_path)
                except Exception:
                    pass
                return True
        except Exception as exc:
            logger.warning("Schema self-heal after missing table failed: %s", exc)
        return False

    async def _sleep_backoff(self, attempt: int):
        base = float(self._lock_retry_base_seconds)
        max_s = float(self._lock_retry_max_seconds)
        delay = min(max_s, base * (2 ** max(0, attempt)))
        delay = delay + (random.random() * 0.03)
        try:
            logger.debug("DB lock backoff: attempt=%d delay=%.3fs", int(attempt), float(delay))
        except Exception:
            pass
        await asyncio.sleep(delay)

    def get_runtime_status(self) -> Dict[str, Any]:
        """Return lightweight runtime counters for diagnostics/dashboard."""
        try:
            active = len(self._active_conns)
        except Exception:
            active = 0
        try:
            pooled = int(self._pool.qsize())
        except Exception:
            pooled = 0
        return {
            "active_connections": int(active),
            "pooled_connections": int(pooled),
            "max_connections": int(self._max_conn_limit),
            "query_timeout_s": float(self._query_timeout),
            "busy_timeout_ms": int(SQLITE_BUSY_TIMEOUT_MS),
        }

    async def _apply_connection_pragmas(self, conn: aiosqlite.Connection):
        await conn.execute("PRAGMA journal_mode=WAL")
        await conn.execute("PRAGMA synchronous=NORMAL")
        await conn.execute(f"PRAGMA cache_size={SQLITE_CACHE_SIZE_KIB}")
        await conn.execute("PRAGMA temp_store=MEMORY")
        await conn.execute(f"PRAGMA busy_timeout = {SQLITE_BUSY_TIMEOUT_MS}")
        await conn.execute("PRAGMA foreign_keys=ON")

    async def _create_connection(self) -> aiosqlite.Connection:
        # Use autocommit mode; we manage transactions explicitly (BEGIN/COMMIT) when needed.
        conn = await aiosqlite.connect(str(self.db_path), timeout=self._timeout, isolation_level=None)
        conn.row_factory = sqlite3.Row
        await self._apply_connection_pragmas(conn)
        return conn

    async def _acquire_connection_async(self) -> aiosqlite.Connection:
        if self._async_sem is None:
            self._async_sem = asyncio.Semaphore(self._max_conn_limit)

        # Check reset flag before acquiring
        if self._resetting:
            raise RuntimeError("Database is resetting - connection rejected")

        sem = self._async_sem
        await sem.acquire()
        try:
            # Re-check after waiting: reset may start while this waiter is queued.
            if self._resetting:
                raise RuntimeError("Database is resetting - connection rejected")
            try:
                conn = self._pool.get_nowait()
            except Empty:
                conn = await self._create_connection()
            self._active_conns.add(conn)
            self._active_conns_idle.clear()
            return conn
        except Exception:
            sem.release()
            raise

    async def _release_connection_async(self, conn: aiosqlite.Connection):
        try:
            self._active_conns.discard(conn)
            if not self._active_conns:
                self._active_conns_idle.set()
            if not conn:
                return
            if not self._pool.full():
                self._pool.put(conn)
            else:
                try:
                    await conn.close()
                except Exception:
                    pass
        finally:
            if self._async_sem:
                self._async_sem.release()

    async def _ensure_initialized_async(self, *, allow_during_reset: bool = False):
        if self._initialized:
            return
        # Only one caller initializes; lock is sync, but init runs once and quickly.
        with self._lock:
            if self._initialized:
                return
            # mark initialized *after* successful probe
        direct_conn = bool(self._resetting and allow_during_reset)
        if direct_conn:
            # Reset flow cannot use pooled acquisition because reset guard rejects it.
            conn = await self._create_connection()
        else:
            conn = await self._acquire_connection_async()
        try:
            await self._apply_connection_pragmas(conn)
            await conn.commit()
        finally:
            if direct_conn:
                try:
                    await conn.close()
                except Exception:
                    pass
            else:
                await self._release_connection_async(conn)
        with self._lock:
            self._initialized = True
        if self._write_lock is None:
            self._write_lock = asyncio.Lock()

    def _prune_asset_locks_locked(self, now: float) -> None:
        if not self._asset_locks:
            return
        cutoff = now - float(ASSET_LOCKS_TTL_S)
        self._prune_asset_locks_by_ttl(cutoff)
        self._prune_asset_locks_by_cap()

    def _prune_asset_locks_by_ttl(self, cutoff: float) -> None:
        try:
            for key, entry in list(self._asset_locks.items()):
                last = self._asset_lock_last(entry)
                if not last or last >= cutoff:
                    continue
                if self._asset_lock_is_locked(entry):
                    continue
                self._asset_locks.pop(key, None)
        except Exception:
            return

    def _prune_asset_locks_by_cap(self) -> None:
        if ASSET_LOCKS_MAX <= 0 or len(self._asset_locks) <= ASSET_LOCKS_MAX:
            return
        try:
            items = sorted(self._asset_locks.items(), key=lambda kv: self._asset_lock_last(kv[1]))
            to_drop = max(0, len(items) - ASSET_LOCKS_MAX)
            for key, entry in items[:to_drop]:
                if self._asset_lock_is_locked(entry):
                    continue
                self._asset_locks.pop(key, None)
        except Exception:
            return

    @staticmethod
    def _asset_lock_last(entry: Dict[str, Any]) -> float:
        try:
            return float(entry.get("last") or 0)
        except Exception:
            return 0.0

    @staticmethod
    def _asset_lock_is_locked(entry: Dict[str, Any]) -> bool:
        try:
            lock = entry.get("lock")
            return bool(lock is not None and getattr(lock, "locked", None) and lock.locked())
        except Exception:
            return False

    def _get_or_create_asset_lock(self, asset_id: Any) -> asyncio.Lock:
        key = _asset_lock_key(asset_id)
        now = time.time()
        with self._asset_locks_lock:
            entry = self._asset_locks.get(key)
            if entry:
                try:
                    entry["last"] = now
                    return entry["lock"]
                except Exception:
                    pass
            lock = asyncio.Lock()
            self._asset_locks[key] = {"lock": lock, "last": now}
            self._prune_asset_locks_locked(now)
            return lock

    @asynccontextmanager
    async def lock_for_asset(self, asset_id: Any):
        """
        Async context manager that serializes work per asset.
        """
        lock = self._get_or_create_asset_lock(asset_id)
        await lock.acquire()
        try:
            yield
        finally:
            lock.release()

    def _init_db(self):
        try:
            self._loop_thread.run(self._ensure_initialized_async())
            logger.info("Database initialized: %s", self.db_path)
        except Exception as exc:
            logger.error("Failed to initialize database: %s", exc)
            raise

    def _tx_token(self) -> Optional[str]:
        try:
            ctx_tok = _TX_TOKEN.get()
        except Exception:
            ctx_tok = None
        return str(ctx_tok) if ctx_tok else None

    @staticmethod
    def _rows_to_dicts(rows: Any) -> List[Dict[str, Any]]:
        if not rows:
            return []
        try:
            return [dict(r) for r in rows]
        except Exception:
            # Best-effort fallback if driver returns mixed row shapes.
            out: List[Dict[str, Any]] = []
            for r in rows:
                try:
                    out.append(dict(r))
                except Exception:
                    pass
            return out

    async def _with_query_timeout(self, coro):
        try:
            timeout = float(self._query_timeout or 0)
        except Exception:
            timeout = 0.0
        if timeout > 0:
            try:
                return await asyncio.wait_for(coro, timeout=timeout)
            except asyncio.TimeoutError:
                return Result.Err(ErrorCode.TIMEOUT, "Database operation timed out")
        return await coro

    async def _execute_async(
        self,
        query: str,
        params: Optional[tuple],
        fetch: bool,
        *,
        tx_token: Optional[str] = None,
    ) -> Result[Any]:
        await self._ensure_initialized_async()

        token = tx_token or self._tx_token()
        if token:
            conn = self._tx_conns.get(token)
            if not conn:
                return Result.Err(ErrorCode.DB_ERROR, "Transaction connection missing")
            return await self._execute_on_conn_async(conn, query, params, fetch, commit=False, tx_token=token)

        conn = await self._acquire_connection_async()
        try:
            res = await self._execute_on_conn_async(conn, query, params, fetch, commit=True, tx_token=None)
            return res
        finally:
            await self._release_connection_async(conn)

    @staticmethod
    def _is_write_sql(query: str) -> bool:
        q = str(query or "").lstrip()
        if not q:
            return False
        head = q.split(None, 1)[0].upper()
        # Treat CTEs as reads by default (they can still write, but rare in our codebase).
        if head in ("SELECT", "PRAGMA", "WITH", "EXPLAIN"):
            return False
        return True

    async def _execute_on_conn_async(
        self,
        conn: aiosqlite.Connection,
        query: str,
        params: Optional[tuple],
        fetch: bool,
        *,
        commit: bool,
        tx_token: Optional[str] = None,
    ) -> Result[Any]:
        async def _execute_inner() -> Result[Any]:
            try:
                lock = self._write_lock
                is_write = self._is_write_sql(query)
                if is_write and lock is not None:
                    # BEGIN acquires the write lock already; avoid deadlocking by reacquiring it
                    # for statements executed within the same transaction.
                    if tx_token:
                        try:
                            with self._tx_state_lock:
                                in_tx = tx_token in self._tx_write_lock_tokens
                        except Exception:
                            in_tx = False
                    else:
                        in_tx = False
                    if in_tx:
                        return await self._execute_on_conn_locked_async(conn, query, params, fetch, commit=commit)
                    async with lock:
                        return await self._execute_on_conn_locked_async(conn, query, params, fetch, commit=commit)
                return await self._execute_on_conn_locked_async(conn, query, params, fetch, commit=commit)
            except sqlite3.IntegrityError as exc:
                logger.warning("Integrity error: %s", exc)
                return Result.Err(ErrorCode.DB_ERROR, f"Integrity error: {exc}")
            except sqlite3.OperationalError as exc:
                if "interrupted" in str(exc).lower():
                    return Result.Err(ErrorCode.TIMEOUT, "Database operation interrupted (query timeout)")
                if self._is_locked_error(exc):
                    self._mark_locked_event(exc)
                if _is_missing_column_error(exc):
                    # Best-effort self-heal for legacy/partial DBs: add missing expected columns,
                    # then retry the original statement once.
                    try:
                        from .schema import ensure_columns_exist
                        heal_res = await ensure_columns_exist(self)
                        if heal_res.ok:
                            return await self._execute_on_conn_locked_async(
                                conn, query, params, fetch, commit=commit
                            )
                    except Exception as heal_exc:
                        logger.warning("Schema self-heal after missing column failed: %s", heal_exc)
                if _is_missing_table_error(exc):
                    repaired = await self._attempt_missing_table_recovery_async()
                    if repaired:
                        return await self._execute_on_conn_locked_async(
                            conn, query, params, fetch, commit=commit
                        )
                logger.error("Operational error: %s", exc)
                return Result.Err(ErrorCode.DB_ERROR, f"Operational error: {exc}")
            except sqlite3.DatabaseError as exc:
                if not self._is_malformed_error(exc):
                    logger.error("Database error: %s", exc)
                    return Result.Err(ErrorCode.DB_ERROR, str(exc))
                self._mark_malformed_event(exc)
                recovered = await self._attempt_malformed_recovery_async(conn)
                if recovered:
                    try:
                        return await self._execute_on_conn_locked_async(conn, query, params, fetch, commit=commit)
                    except Exception as retry_exc:
                        logger.error("Database malformed after recovery retry: %s", retry_exc)
                        return Result.Err(ErrorCode.DB_ERROR, str(retry_exc))
                await self._maybe_auto_reset_on_corruption(exc)
                logger.error("Database malformed and recovery failed: %s", exc)
                return Result.Err(ErrorCode.DB_ERROR, str(exc))
            except Exception as exc:
                logger.error("Unexpected database error: %s", exc)
                return Result.Err(ErrorCode.DB_ERROR, str(exc))
        return await self._with_query_timeout(_execute_inner())

    async def _execute_on_conn_locked_async(
        self,
        conn: aiosqlite.Connection,
        query: str,
        params: Optional[tuple],
        fetch: bool,
        *,
        commit: bool,
    ) -> Result[Any]:
        try:
            for attempt in range(self._lock_retry_attempts + 1):
                try:
                    return await self._execute_with_cursor_result(
                        conn,
                        query,
                        params,
                        fetch=fetch,
                        commit=commit,
                    )
                except sqlite3.OperationalError as exc:
                    if self._is_locked_error(exc) and attempt < self._lock_retry_attempts:
                        await self._sleep_backoff(attempt)
                        continue
                    raise
            return Result.Err(ErrorCode.DB_ERROR, "Query failed after retries")
        except Exception:
            raise

    async def _execute_with_cursor_result(
        self,
        conn: aiosqlite.Connection,
        query: str,
        params: Optional[tuple],
        *,
        fetch: bool,
        commit: bool,
    ) -> Result[Any]:
        cursor = await conn.execute(query, params or ())
        try:
            if fetch:
                rows = await cursor.fetchall()
                return Result.Ok(self._rows_to_dicts(rows))
            if commit:
                await conn.commit()
            return self._cursor_write_result(cursor)
        finally:
            try:
                await cursor.close()
            except Exception:
                pass

    @staticmethod
    def _cursor_write_result(cursor: Any) -> Result[Any]:
        last_id = getattr(cursor, "lastrowid", None)
        rowcount = getattr(cursor, "rowcount", None)
        if last_id:
            return Result.Ok(last_id)
        return Result.Ok(rowcount if rowcount is not None else 0)

    async def aexecute(self, query: str, params: Optional[tuple] = None, fetch: bool = False) -> Result[Any]:
        """Execute SQL on the DB loop thread (async)."""
        token = _TX_TOKEN.get()
        fut = self._loop_thread.submit(self._execute_async(query, params, fetch, tx_token=token))
        return await asyncio.wrap_future(fut)

    async def aquery(self, sql: str, params: Optional[tuple] = None) -> Result[List[Dict[str, Any]]]:
        """Execute a SELECT query and return rows (async)."""
        return await self.aexecute(sql, params, fetch=True)

    async def aquery_in(
        self,
        base_query: str,
        column: str,
        values: List[Any],
        additional_params: Optional[tuple] = None,
    ) -> Result[List[Dict[str, Any]]]:
        """Async variant of `query_in()` for IN-clause queries."""
        if not values:
            return Result.Ok([])
        if not isinstance(values, (list, tuple)):
            return Result.Err(ErrorCode.INVALID_INPUT, "values must be a list or tuple")
        ok_col, safe_col = _validate_and_repair_column_name(column)
        if not ok_col or not safe_col:
            return Result.Err(ErrorCode.INVALID_INPUT, f"Invalid column name: {column}")
        ok_tpl, why = _validate_in_base_query(base_query)
        if not ok_tpl:
            return Result.Err(ErrorCode.INVALID_INPUT, why or "Invalid base_query template")

        ok_q, query_or_err, _ = _build_in_query(str(base_query), safe_col, len(values))
        if not ok_q:
            return Result.Err(ErrorCode.INVALID_INPUT, str(query_or_err))
        query = query_or_err

        params = tuple(values)
        if additional_params:
            params = params + tuple(additional_params)
        return await self.aquery(query, params)

    async def _executemany_async(
        self,
        query: str,
        params_list: List[Tuple],
        *,
        tx_token: Optional[str] = None,
    ) -> Result[int]:
        await self._ensure_initialized_async()
        token = tx_token or self._tx_token()
        if token:
            conn = self._tx_conns.get(token)
            if not conn:
                return Result.Err(ErrorCode.DB_ERROR, "Transaction connection missing")
            return await self._executemany_on_conn_async(conn, query, params_list, commit=False, tx_token=token)

        conn = await self._acquire_connection_async()
        try:
            return await self._executemany_on_conn_async(conn, query, params_list, commit=True, tx_token=None)
        finally:
            await self._release_connection_async(conn)

    async def _executemany_on_conn_async(
        self,
        conn: aiosqlite.Connection,
        query: str,
        params_list: List[Tuple],
        *,
        commit: bool,
        tx_token: Optional[str] = None,
    ) -> Result[int]:
        async def _execute_inner() -> Result[int]:
            try:
                lock = self._write_lock
                is_write = self._is_write_sql(query)
                if is_write and lock is not None:
                    # Check if we're inside an existing transaction that holds the write lock.
                    # Use _tx_state_lock to avoid race conditions with concurrent rollback/commit.
                    if tx_token:
                        try:
                            with self._tx_state_lock:
                                in_tx = tx_token in self._tx_write_lock_tokens
                        except Exception:
                            in_tx = False
                    else:
                        in_tx = False
                    if in_tx:
                        return await self._executemany_on_conn_locked_async(conn, query, params_list, commit=commit)
                    async with lock:
                        return await self._executemany_on_conn_locked_async(conn, query, params_list, commit=commit)
                return await self._executemany_on_conn_locked_async(conn, query, params_list, commit=commit)
            except sqlite3.OperationalError as exc:
                if "interrupted" in str(exc).lower():
                    return Result.Err(ErrorCode.TIMEOUT, "Database operation interrupted (query timeout)")
                logger.error("Batch execute error: %s", exc)
                return Result.Err(ErrorCode.DB_ERROR, str(exc))
            except Exception as exc:
                logger.error("Batch execute error: %s", exc)
                return Result.Err(ErrorCode.DB_ERROR, str(exc))
        return await self._with_query_timeout(_execute_inner())

    async def _executemany_on_conn_locked_async(
        self, conn: aiosqlite.Connection, query: str, params_list: List[Tuple], *, commit: bool
    ) -> Result[int]:
        try:
            for attempt in range(self._lock_retry_attempts + 1):
                try:
                    cursor = await conn.executemany(query, params_list)
                    try:
                        if commit:
                            await conn.commit()
                        rowcount = getattr(cursor, "rowcount", None)
                        return Result.Ok(int(rowcount or 0))
                    finally:
                        try:
                            await cursor.close()
                        except Exception:
                            pass
                except sqlite3.OperationalError as exc:
                    if self._is_locked_error(exc) and attempt < self._lock_retry_attempts:
                        await self._sleep_backoff(attempt)
                        continue
                    raise
            return Result.Err(ErrorCode.DB_ERROR, "Batch execute failed after retries")
        except Exception:
            raise

    async def aexecutemany(self, query: str, params_list: List[Tuple]) -> Result[int]:
        """Execute a parameterized statement over multiple param tuples (async)."""
        token = _TX_TOKEN.get()
        fut = self._loop_thread.submit(self._executemany_async(query, params_list, tx_token=token))
        return await asyncio.wrap_future(fut)

    async def _executescript_async(self, script: str, *, tx_token: Optional[str] = None) -> Result[bool]:
        await self._ensure_initialized_async()
        token = tx_token or self._tx_token()
        if token:
            conn = self._tx_conns.get(token)
            if not conn:
                return Result.Err(ErrorCode.DB_ERROR, "Transaction connection missing")
            return await self._executescript_on_conn_async(conn, script, commit=False)

        conn = await self._acquire_connection_async()
        try:
            lock = self._write_lock
            if lock is not None:
                async with lock:
                    return await self._executescript_on_conn_async(conn, script, commit=True)
            return await self._executescript_on_conn_async(conn, script, commit=True)
        finally:
            await self._release_connection_async(conn)

    async def _executescript_on_conn_async(self, conn: aiosqlite.Connection, script: str, *, commit: bool) -> Result[bool]:
        async def _execute_inner() -> Result[bool]:
            try:
                for attempt in range(self._lock_retry_attempts + 1):
                    try:
                        await conn.executescript(script)
                        if commit:
                            await conn.commit()
                        return Result.Ok(True)
                    except sqlite3.OperationalError as exc:
                        if self._is_locked_error(exc) and attempt < self._lock_retry_attempts:
                            await self._sleep_backoff(attempt)
                            continue
                        raise
                return Result.Err(ErrorCode.DB_ERROR, "Script execution failed after retries")
            except sqlite3.OperationalError as exc:
                if "interrupted" in str(exc).lower():
                    return Result.Err(ErrorCode.TIMEOUT, "Database operation interrupted (query timeout)")
                logger.error("Script execution error: %s", exc)
                return Result.Err(ErrorCode.DB_ERROR, str(exc))
            except Exception as exc:
                logger.error("Script execution error: %s", exc)
                return Result.Err(ErrorCode.DB_ERROR, str(exc))
        return await self._with_query_timeout(_execute_inner())

    async def aexecutescript(self, script: str) -> Result[bool]:
        """Execute a multi-statement SQL script (async)."""
        token = _TX_TOKEN.get()
        fut = self._loop_thread.submit(self._executescript_async(script, tx_token=token))
        return await asyncio.wrap_future(fut)

    async def _vacuum_async(self) -> Result[bool]:
        await self._ensure_initialized_async()
        conn = await self._acquire_connection_async()
        try:
            await conn.execute("VACUUM")
            await conn.commit()
            logger.info("Database vacuumed successfully")
            return Result.Ok(True)
        except Exception as exc:
            logger.error("Vacuum error: %s", exc)
            return Result.Err(ErrorCode.DB_ERROR, str(exc))
        finally:
            await self._release_connection_async(conn)

    async def avacuum(self) -> Result[bool]:
        """Run SQLite VACUUM (async)."""
        fut = self._loop_thread.submit(self._vacuum_async())
        return await asyncio.wrap_future(fut)

    async def ahas_table(self, table_name: str) -> bool:
        """Return True if `table_name` exists in sqlite_master (async)."""
        result = await self.aexecute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
            (table_name,),
            fetch=True,
        )
        return bool(result.ok and result.data and len(result.data) > 0)

    async def aget_schema_version(self) -> int:
        """Get the schema version from the `metadata` table (0 if missing) (async)."""
        if not await self.ahas_table("metadata"):
            return 0

        result = await self.aexecute(
            "SELECT value FROM metadata WHERE key = 'schema_version'",
            fetch=True,
        )
        if result.ok and result.data and len(result.data) > 0:
            try:
                return int(result.data[0]["value"])
            except (ValueError, KeyError, TypeError):
                logger.warning("Invalid schema_version value in database")
                return 0
        return 0

    async def aset_schema_version(self, version: int) -> Result[bool]:
        """Set the schema version in the `metadata` table (async)."""
        return await self.aexecute(
            "INSERT OR REPLACE INTO metadata (key, value) VALUES ('schema_version', ?)",
            (str(version),),
        )

    @staticmethod
    def _begin_stmt_for_mode(mode: str) -> str:
        begin_stmt = "BEGIN IMMEDIATE"
        if isinstance(mode, str) and mode.lower() in ("deferred", "immediate", "exclusive"):
            begin_stmt = f"BEGIN {mode.upper()}"
        elif isinstance(mode, str) and mode.strip() == "":
            begin_stmt = "BEGIN"
        return begin_stmt

    async def _begin_tx_with_retry(self, conn: aiosqlite.Connection, begin_stmt: str) -> None:
        for attempt in range(self._lock_retry_attempts + 1):
            try:
                await conn.execute(begin_stmt)
                return
            except sqlite3.OperationalError as exc:
                if self._is_locked_error(exc) and attempt < self._lock_retry_attempts:
                    await self._sleep_backoff(attempt)
                    continue
                raise

    def _register_tx_token(self, token: str, conn: aiosqlite.Connection, lock: Optional[asyncio.Lock]) -> None:
        with self._tx_state_lock:
            self._tx_conns[token] = conn
            if lock is not None:
                self._tx_write_lock_tokens.add(token)

    async def _abort_begin_tx(
        self,
        conn: aiosqlite.Connection,
        lock: Optional[asyncio.Lock],
    ) -> None:
        try:
            await conn.rollback()
        except Exception:
            pass
        await self._release_connection_async(conn)
        if lock is not None:
            try:
                lock.release()
            except Exception:
                pass

    def _get_tx_state(self, token: str) -> tuple[Optional[aiosqlite.Connection], bool]:
        try:
            with self._tx_state_lock:
                conn = self._tx_conns.get(token)
                had_write_lock = token in self._tx_write_lock_tokens
        except Exception:
            return None, False
        return conn, had_write_lock

    async def _commit_with_retry(self, conn: aiosqlite.Connection) -> None:
        for attempt in range(self._lock_retry_attempts + 1):
            try:
                await conn.commit()
                return
            except sqlite3.OperationalError as exc:
                if self._is_locked_error(exc) and attempt < self._lock_retry_attempts:
                    await self._sleep_backoff(attempt)
                    continue
                raise

    async def _cleanup_tx_state(
        self,
        token: str,
        conn: aiosqlite.Connection,
        had_write_lock: bool,
        lock: Optional[asyncio.Lock],
    ) -> None:
        try:
            with self._tx_state_lock:
                self._tx_conns.pop(token, None)
                if had_write_lock:
                    self._tx_write_lock_tokens.discard(token)
        except Exception:
            pass
        await self._release_connection_async(conn)
        if lock is not None and had_write_lock:
            try:
                lock.release()
            except Exception:
                pass

    async def _begin_tx_async(self, mode: str) -> Result[str]:
        await self._ensure_initialized_async()
        lock = self._write_lock
        if lock is not None:
            await lock.acquire()
        conn = await self._acquire_connection_async()
        token = f"tx_{uuid.uuid4().hex}"

        begin_stmt = self._begin_stmt_for_mode(mode)

        try:
            await self._begin_tx_with_retry(conn, begin_stmt)
            self._register_tx_token(token, conn, lock)
            return Result.Ok(token)
        except Exception as exc:
            await self._abort_begin_tx(conn, lock)
            return Result.Err(ErrorCode.DB_ERROR, str(exc))

    async def _commit_tx_async(self, token: str) -> Result[bool]:
        lock = self._write_lock
        conn, had_write_lock = self._get_tx_state(token)
        if not conn:
            return Result.Err(ErrorCode.DB_ERROR, "Transaction connection missing")
        try:
            await self._commit_with_retry(conn)
            return Result.Ok(True)
        except Exception as exc:
            # Best-effort rollback to avoid returning a connection with an open transaction to the pool.
            try:
                await conn.rollback()
            except Exception:
                pass
            return Result.Err(ErrorCode.DB_ERROR, str(exc))
        finally:
            await self._cleanup_tx_state(token, conn, had_write_lock, lock)

    async def _rollback_tx_async(self, token: str) -> Result[bool]:
        lock = self._write_lock
        try:
            with self._tx_state_lock:
                conn = self._tx_conns.get(token)
                had_write_lock = token in self._tx_write_lock_tokens
        except Exception:
            conn = None
            had_write_lock = False
        if not conn:
            return Result.Err(ErrorCode.DB_ERROR, "Transaction connection missing")
        try:
            try:
                await conn.rollback()
            except Exception:
                pass
            return Result.Ok(True)
        finally:
            try:
                with self._tx_state_lock:
                    self._tx_conns.pop(token, None)
                    if had_write_lock:
                        self._tx_write_lock_tokens.discard(token)
            except Exception:
                pass
            await self._release_connection_async(conn)
            if lock is not None and had_write_lock:
                try:
                    lock.release()
                except Exception:
                    pass

    async def _close_all_async(self):
        # 1. Close transaction connections first.
        tokens = list(self._tx_conns.keys())
        for token in tokens:
            conn = self._tx_conns.pop(token, None)
            if not conn:
                continue
            try:
                await conn.close()
            except Exception:
                pass

        # 2. Emptry the pool
        while True:
            try:
                conn = self._pool.get_nowait()
            except Empty:
                break
            try:
                await conn.close()
            except Exception:
                pass

        # 3. FORCE CLOSE any checked-out connections (critical for reset)
        active_list = list(self._active_conns)
        for conn in active_list:
             try:
                 await conn.close()
             except Exception:
                 pass
        self._active_conns.clear()
        self._active_conns_idle.set()

        # Reset counters/semaphores as everything is closed
        self._async_sem = None

    async def aclose(self):
        """Close connections and stop the DB loop thread (async)."""
        fut = self._loop_thread.submit(self._close_all_async())
        try:
            await asyncio.wrap_future(fut)
        finally:
            self._loop_thread.stop()

    async def _drain_for_reset_async(self):
        """Prepare for reset: lock new connections, wait for active ones, close all."""
        self._resetting = True

        # Best effort: force WAL checkpoint while connections are still alive.
        # This reduces the chance of carrying stale WAL state into a reset on Windows.
        try:
            await self._checkpoint_wal_before_reset_async()
        except Exception as exc:
            logger.debug("DB Reset: WAL checkpoint pre-drain failed: %s", exc)

        # Wait deterministically for in-flight checkouts to drain (max 5s), then force close.
        drained = await asyncio.to_thread(self._active_conns_idle.wait, 5.0)
        if not drained and self._active_conns:
            logger.warning("DB Reset: Forced close with %d active connections", len(self._active_conns))

        await self._close_all_async()

    async def _checkpoint_wal_before_reset_async(self) -> None:
        """
        Best-effort checkpoint prior to hard reset.
        Must be called on DB loop thread while connections are still valid.
        """
        await self._ensure_initialized_async()
        conn = await self._acquire_connection_async()
        try:
            for attempt in range(self._lock_retry_attempts + 1):
                try:
                    cur = await conn.execute("PRAGMA wal_checkpoint(TRUNCATE)")
                    try:
                        await cur.fetchall()
                    finally:
                        try:
                            await cur.close()
                        except Exception:
                            pass
                    break
                except sqlite3.OperationalError as exc:
                    if self._is_locked_error(exc) and attempt < self._lock_retry_attempts:
                        await self._sleep_backoff(attempt)
                        continue
                    raise
        finally:
            await self._release_connection_async(conn)

    @staticmethod
    def _schedule_delete_on_reboot(path: Path) -> bool:
        """
        Windows fallback: request deletion on next reboot for locked files.
        """
        if os.name != "nt":
            return False
        try:
            MOVEFILE_DELAY_UNTIL_REBOOT = 0x4
            windll = getattr(ctypes, "windll", None)
            if windll is None:
                return False
            kernel32 = getattr(windll, "kernel32", None)
            if kernel32 is None:
                return False
            ok = kernel32.MoveFileExW(str(path), None, MOVEFILE_DELAY_UNTIL_REBOOT)
            return bool(ok)
        except Exception:
            return False

    async def areset(self) -> Result[bool]:
        """
        Aggressive reset:
        1. Close all connections (drain)
        2. Force GC to release file handles (Windows fix)
        3. Delete DB files
        4. Re-init
        """
        try:
            deleted_files: list[str] = []
            renamed_files: list[dict[str, str]] = []
            await self._drain_for_reset()
            delete_err = await self._delete_reset_files(deleted_files, renamed_files)
            if delete_err is not None:
                with self._lock:
                    self._resetting = False
                return delete_err

            # 4. Reset initialization state
            with self._lock:
                self._initialized = False
                # Keep reset lock active until async re-init + schema complete.
                self._resetting = True

            # 5. Re-initialize (async-safe; do not call sync _init_db from DB loop thread).
            await self._ensure_initialized_async(allow_during_reset=True)
            # Release reset guard before schema helpers, which execute through normal DB APIs.
            with self._lock:
                self._resetting = False

            # 6. Re-apply schema
            from .schema import ensure_tables_exist, ensure_indexes_and_triggers
            schema_res = await ensure_tables_exist(self)
            if not schema_res.ok:
                return schema_res

            indexes_res = await ensure_indexes_and_triggers(self)
            if not indexes_res.ok:
                return indexes_res

            return Result.Ok(True, deleted_files=deleted_files, renamed_files=renamed_files)
        except Exception as exc:
            with self._lock:
                self._resetting = False # Ensure unlock on error
            logger.error(f"DB Reset failed: {exc}")
            return Result.Err("RESET_FAILED", str(exc))

    async def _drain_for_reset(self) -> None:
        # 1. Drain and close on loop thread.
        fut = self._loop_thread.submit(self._drain_for_reset_async())
        await asyncio.wrap_future(fut)
        # 2. Wait a bit for OS to release file locks & force GC.
        await asyncio.sleep(0.5)
        gc.collect()

    async def _delete_reset_files(
        self,
        deleted_files: list[str],
        renamed_files: list[dict[str, str]],
    ) -> Optional[Result[bool]]:
        base = str(self.db_path)
        for ext in ["", "-wal", "-shm", "-journal"]:
            path = Path(base + ext)
            if not path.exists():
                continue
            err = await self._delete_or_recover_reset_file(path, deleted_files, renamed_files)
            if err is not None:
                return err
        return None

    async def _delete_or_recover_reset_file(
        self,
        path: Path,
        deleted_files: list[str],
        renamed_files: list[dict[str, str]],
    ) -> Optional[Result[bool]]:
        deleted, last_error = await self._delete_reset_file_with_retries(path, deleted_files)
        if deleted:
            return None
        logger.warning(f"Failed to delete {path} after retries: {last_error}")
        recover = self._rename_or_schedule_delete(path, renamed_files, last_error)
        return None if recover.ok else recover

    async def _delete_reset_file_with_retries(self, path: Path, deleted_files: list[str]) -> tuple[bool, Optional[Exception]]:
        last_error: Optional[Exception] = None
        for attempt in range(5):
            try:
                path.unlink()
                deleted_files.append(str(path))
                return True, None
            except Exception as exc:
                last_error = exc
                await asyncio.sleep(0.5 + (attempt * 0.2))
                gc.collect()
        return False, last_error

    def _rename_or_schedule_delete(
        self,
        path: Path,
        renamed_files: list[dict[str, str]],
        last_error: Optional[Exception],
    ) -> Result[bool]:
        try:
            trash = path.with_name(f"{path.name}.trash_{uuid.uuid4().hex}")
            path.rename(trash)
            renamed_files.append({"from": str(path), "to": str(trash)})
            logger.info(f"Renamed locked DB file to {trash}")
            return Result.Ok(True)
        except Exception as rename_err:
            scheduled = self._schedule_delete_on_reboot(path)
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

    async def _begin_tx_for_async(self, mode: str) -> Result[str]:
        fut = self._loop_thread.submit(self._begin_tx_async(mode))
        return await asyncio.wrap_future(fut)

    async def _commit_tx_for_async(self, token: str) -> Result[bool]:
        fut = self._loop_thread.submit(self._commit_tx_async(token))
        return await asyncio.wrap_future(fut)

    async def _rollback_tx_for_async(self, token: str) -> Result[bool]:
        fut = self._loop_thread.submit(self._rollback_tx_async(token))
        return await asyncio.wrap_future(fut)

    @asynccontextmanager
    async def atransaction(self, mode: str = "immediate"):
        """Async context manager for a DB transaction."""
        tx_state = Result.Ok(True)
        begin_res = await self._begin_tx_for_async(mode)
        if not begin_res.ok or not begin_res.data:
            tx_state = Result.Err(ErrorCode.DB_ERROR, str(begin_res.error or "Failed to begin transaction"))
            yield tx_state
            return

        token = str(begin_res.data)
        token_handle = _TX_TOKEN.set(token)
        try:
            yield tx_state
            commit_res = await self._commit_tx_for_async(token)
            if not commit_res.ok:
                tx_state.ok = False
                tx_state.code = str(getattr(commit_res, "code", None) or ErrorCode.DB_ERROR)
                tx_state.error = str(commit_res.error or "Commit failed")
        except Exception:
            try:
                await self._rollback_tx_for_async(token)
            except Exception:
                pass
            raise
        finally:
            _TX_TOKEN.reset(token_handle)
