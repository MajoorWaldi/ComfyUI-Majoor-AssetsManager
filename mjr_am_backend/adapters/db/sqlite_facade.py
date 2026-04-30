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

import asyncio
import concurrent.futures
import contextvars
import os
import re
import threading
from contextlib import asynccontextmanager
from pathlib import Path
from queue import Queue
from typing import Any

import aiosqlite

from ...config import DB_MAX_CONNECTIONS, DB_QUERY_TIMEOUT, DB_TIMEOUT
from ...shared import ErrorCode, Result, get_logger
from . import sqlite_connections as conn_runtime
from . import sqlite_execution as exec_runtime
from . import sqlite_lifecycle as life_runtime
from . import sqlite_recovery as recovery_runtime
from .connection_pool import (
    asset_lock_is_locked as pool_asset_lock_is_locked,
)
from .connection_pool import (
    asset_lock_last as pool_asset_lock_last,
)
from .connection_pool import (
    diagnostics as pool_diagnostics,
)
from .connection_pool import (
    get_or_create_asset_lock as pool_get_or_create_asset_lock,
)
from .connection_pool import (
    init_db as pool_init_db,
)
from .connection_pool import (
    load_user_db_config as pool_load_user_db_config,
)
from .connection_pool import (
    maybe_set_config_number as pool_maybe_set_config_number,
)
from .connection_pool import (
    normalize_user_db_config as pool_normalize_user_db_config,
)
from .connection_pool import (
    prune_asset_locks_by_cap as pool_prune_asset_locks_by_cap,
)
from .connection_pool import (
    prune_asset_locks_by_ttl as pool_prune_asset_locks_by_ttl,
)
from .connection_pool import (
    prune_asset_locks_locked as pool_prune_asset_locks_locked,
)
from .connection_pool import (
    read_user_db_config_file as pool_read_user_db_config_file,
)
from .connection_pool import (
    resolve_user_db_config_path as pool_resolve_user_db_config_path,
)
from .connection_pool import (
    start_asset_lock_pruner as pool_start_asset_lock_pruner,
)
from .connection_pool import (
    stop_asset_lock_pruner as pool_stop_asset_lock_pruner,
)
from .db_recovery import (
    extract_schema_column_name as recovery_extract_schema_column_name,
)
from .db_recovery import (
    is_auto_reset_enabled as recovery_is_auto_reset_enabled,
)
from .db_recovery import (
    is_auto_reset_throttled as recovery_is_auto_reset_throttled,
)
from .db_recovery import (
    is_locked_error as recovery_is_locked_error,
)
from .db_recovery import (
    is_malformed_error as recovery_is_malformed_error,
)
from .db_recovery import (
    mark_auto_reset_attempt as recovery_mark_auto_reset_attempt,
)
from .db_recovery import (
    mark_locked_event as recovery_mark_locked_event,
)
from .db_recovery import (
    mark_malformed_event as recovery_mark_malformed_event,
)
from .db_recovery import (
    populate_known_columns_from_schema as recovery_populate_known_columns_from_schema,
)
from .db_recovery import (
    record_auto_reset_result as recovery_record_auto_reset_result,
)
from .db_recovery import (
    set_recovery_state as recovery_set_recovery_state,
)
from .transaction_manager import (
    begin_stmt_for_mode as tx_begin_stmt_for_mode,
)
from .transaction_manager import (
    build_in_query as tx_build_in_query,
)
from .transaction_manager import (
    cursor_write_result as tx_cursor_write_result,
)
from .transaction_manager import (
    get_tx_state as tx_get_tx_state,
)
from .transaction_manager import (
    is_missing_column_error as tx_is_missing_column_error,
)
from .transaction_manager import (
    is_missing_table_error as tx_is_missing_table_error,
)
from .transaction_manager import (
    is_write_sql as tx_is_write_sql,
)
from .transaction_manager import (
    register_tx_token as tx_register_tx_token,
)
from .transaction_manager import (
    repair_column_name as tx_repair_column_name,
)
from .transaction_manager import (
    rows_to_dicts as tx_rows_to_dicts,
)
from .transaction_manager import (
    tx_token as tx_ctx_token,
)
from .transaction_manager import (
    validate_and_repair_column_name as tx_validate_and_repair_column_name,
)
from .transaction_manager import (
    validate_in_base_query as tx_validate_in_base_query,
)

logger = get_logger(__name__)

SQLITE_BUSY_TIMEOUT_MS = max(1000, int(float(DB_TIMEOUT) * 1000))
# Negative cache_size is in KiB. -64000 ~= 64 MiB cache.
SQLITE_CACHE_SIZE_KIB = -64000
ASSET_LOCKS_MAX = int(os.getenv("MAJOOR_ASSET_LOCKS_MAX", "10000") or 10000)
ASSET_LOCKS_TTL_S = float(os.getenv("MAJOOR_ASSET_LOCKS_TTL_SECONDS", "600") or 600.0)
ASSET_LOCKS_PRUNE_INTERVAL_S = float(os.getenv("MAJOOR_ASSET_LOCKS_PRUNE_INTERVAL_SECONDS", "60") or 60.0)
ASYNC_LOOP_RUN_TIMEOUT_S = float(
    os.getenv(
        "MAJOOR_DB_LOOP_RUN_TIMEOUT_SECONDS",
        str(max(5.0, float(DB_QUERY_TIMEOUT) if DB_QUERY_TIMEOUT else 60.0)),
    )
    or 60.0
)

_TX_TOKEN: contextvars.ContextVar[str | None] = contextvars.ContextVar("mjr_db_tx_token", default=None)
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
    "workflow_type",
    "generation_time_ms",
    "positive_prompt",
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
    "m.workflow_type",
    "m.generation_time_ms",
    "m.positive_prompt",
    "m.has_workflow",
    "m.has_generation_data",
}
_KNOWN_COLUMNS_LOWER = {c.lower(): c for c in _KNOWN_COLUMNS}
_KNOWN_COLUMNS_LOCK = threading.RLock()
_SCHEMA_TABLE_ALIASES = {
    "assets": "a",
    "asset_metadata": "m",
    "scan_journal": None,
    "metadata_cache": None,
}


# ---------------------------------------------------------------------------
# Thin wrappers — delegate to sub-modules so tests can monkeypatch at this
# module level while actual logic lives in transaction_manager / db_recovery.
# ---------------------------------------------------------------------------


def _is_missing_column_error(exc: Exception) -> bool:
    return tx_is_missing_column_error(exc)


def _is_missing_table_error(exc: Exception) -> bool:
    return tx_is_missing_table_error(exc)


def _populate_known_columns_from_schema(db_path: Path) -> None:
    """Populate _KNOWN_COLUMNS / _KNOWN_COLUMNS_LOWER from the DB schema."""
    global _KNOWN_COLUMNS_LOWER
    _KNOWN_COLUMNS_LOWER = recovery_populate_known_columns_from_schema(
        db_path, _KNOWN_COLUMNS, _KNOWN_COLUMNS_LOCK, _SCHEMA_TABLE_ALIASES
    )


def _extract_schema_column_name(row: Any) -> str:
    return recovery_extract_schema_column_name(row)


_UNRESOLVED_SQL_TEMPLATE = re.compile(r"\{[a-zA-Z_][a-zA-Z0-9_]*\}")


def _validate_in_base_query(base_query: str) -> tuple[bool, str]:
    return tx_validate_in_base_query(base_query)


def _build_in_query(base_query: str, safe_column: str, value_count: int) -> tuple[bool, str, int]:
    ok, query, n = tx_build_in_query(base_query, safe_column, value_count)
    return ok, query, n if isinstance(n, int) else len(n)


def _try_repair_column_name(column: str) -> str | None:
    return tx_repair_column_name(column, _KNOWN_COLUMNS_LOWER, _KNOWN_COLUMNS_LOCK)


def _validate_and_repair_column_name(column: str) -> tuple[bool, str | None]:
    return tx_validate_and_repair_column_name(column, _KNOWN_COLUMNS_LOWER, _KNOWN_COLUMNS_LOCK)


def _asset_lock_key(asset_id: Any) -> str:
    if asset_id is None:
        return "asset:__null__"
    return f"asset:{str(asset_id)}"


def _find_unresolved_sql_template(query: str) -> str | None:
    """Return first unresolved `{TOKEN}` marker found in SQL, if any."""
    try:
        text = str(query or "")
    except Exception:
        return None
    if not text:
        return None
    hit = _UNRESOLVED_SQL_TEMPLATE.search(text)
    if not hit:
        return None
    return hit.group(0)


class _AsyncLoopThread:
    def __init__(self, run_timeout_s: float = ASYNC_LOOP_RUN_TIMEOUT_S):
        self._loop: asyncio.AbstractEventLoop | None = None
        self._thread: threading.Thread | None = None
        self._thread_ident: int | None = None
        self._ready = threading.Event()
        self._run_timeout_s = max(1.0, float(run_timeout_s))
        self._stop_lock = threading.Lock()

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
        try:
            return fut.result(timeout=self._run_timeout_s)
        except concurrent.futures.TimeoutError as exc:
            fut.cancel()
            raise TimeoutError(
                f"Timed out waiting for DB async loop result after {self._run_timeout_s:.1f}s"
            ) from exc

    def submit(self, coro):
        loop = self.start()
        return asyncio.run_coroutine_threadsafe(coro, loop)

    def stop(self):
        with self._stop_lock:
            loop = self._loop
            thread = self._thread
            if not loop:
                return
            try:
                loop.call_soon_threadsafe(loop.stop)
            except Exception:
                pass
            if thread and thread.is_alive() and thread.ident != threading.get_ident():
                try:
                    thread.join(timeout=5.0)
                except Exception:
                    pass
            self._thread_ident = None
            self._thread = None
            self._loop = None


class Sqlite:
    """
    Connection pool manager for SQLite (aiosqlite-backed).

    Synchronous API, async execution on a dedicated loop thread.
    """

    def _init_vec_attach(self) -> None:
        if "vec" not in self._attach_dbs:
            default_vec = self.db_path.with_name("vectors.sqlite")
            try:
                if default_vec.resolve(strict=False) != self.db_path.resolve(strict=False):
                    self._attach_dbs["vec"] = str(default_vec)
            except Exception:
                if default_vec != self.db_path:
                    self._attach_dbs["vec"] = str(default_vec)

    def _resolve_max_connections(self, max_connections: int | None, user_config: dict[str, Any]) -> int:
        max_conn = (
            int(max_connections)
            if max_connections is not None
            else int(user_config.get("maxConnections", DB_MAX_CONNECTIONS or 8))
        )
        return max(1, max_conn)

    def _init_reset_state(self) -> None:
        self._resetting = False
        self._active_conns: set[aiosqlite.Connection] = set()
        self._active_conns_idle = threading.Event()
        self._active_conns_idle.set()

    def _init_diag(self) -> None:
        self._diag_lock = threading.Lock()
        self._diag: dict[str, Any] = {
            "locked": False,
            "last_locked_error": None,
            "last_locked_at": None,
            "malformed": False,
            "last_malformed_error": None,
            "last_malformed_at": None,
            "recovery_state": "idle",
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

    def __init__(self, db_path: str, max_connections: int | None = None, timeout: float = 30.0, *, attach: dict[str, str] | None = None):
        self.db_path = Path(db_path)
        self._attach_dbs: dict[str, str] = dict(attach) if attach else {}
        self._init_vec_attach()
        user_config = self._load_user_db_config()
        max_conn = self._resolve_max_connections(max_connections, user_config)
        self._max_conn_limit = max_conn
        self._pool: Queue[aiosqlite.Connection] = Queue(maxsize=max_conn)
        self._initialized = False
        self._lock = threading.Lock()
        self._async_sem: asyncio.Semaphore | None = None

        self._init_reset_state()

        self._timeout = float(user_config.get("timeout", timeout))
        self._query_timeout = float(user_config.get("queryTimeout", DB_QUERY_TIMEOUT if DB_QUERY_TIMEOUT is not None else 0.0))
        self._lock_retry_attempts = 6
        self._lock_retry_base_seconds = 0.05
        self._lock_retry_max_seconds = 0.75

        self._tx_conns: dict[str, aiosqlite.Connection] = {}

        loop_run_timeout = self._query_timeout if self._query_timeout and self._query_timeout > 0 else ASYNC_LOOP_RUN_TIMEOUT_S
        self._loop_thread = _AsyncLoopThread(run_timeout_s=loop_run_timeout)
        self._write_lock: asyncio.Lock | None = None
        self._tx_write_lock_tokens: set[str] = set()
        self._tx_state_lock = threading.Lock()
        self._asset_locks: dict[str, dict[str, Any]] = {}
        self._asset_locks_lock = threading.Lock()
        self._asset_locks_stop = threading.Event()
        self._asset_locks_pruner: threading.Thread | None = None
        self._asset_locks_max = int(ASSET_LOCKS_MAX)
        self._asset_locks_ttl_s = float(ASSET_LOCKS_TTL_S)
        self._malformed_recovery_lock = threading.Lock()
        self._malformed_recovery_last_ts = 0.0
        self._auto_reset_lock = threading.Lock()
        self._auto_reset_last_ts = 0.0
        self._auto_reset_cooldown_s = 30.0
        self._schema_repair_lock = threading.Lock()
        self._schema_repair_last_ts = 0.0
        self._init_diag()

        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()
        global _KNOWN_COLUMNS_LOWER
        _KNOWN_COLUMNS_LOWER = recovery_populate_known_columns_from_schema(
            self.db_path,
            _KNOWN_COLUMNS,
            _KNOWN_COLUMNS_LOCK,
            _SCHEMA_TABLE_ALIASES,
        )
        self._start_asset_lock_pruner()

    def _start_asset_lock_pruner(self) -> None:
        pool_start_asset_lock_pruner(self, interval_s=float(ASSET_LOCKS_PRUNE_INTERVAL_S))

    def _stop_asset_lock_pruner(self) -> None:
        pool_stop_asset_lock_pruner(self)

    def _load_user_db_config(self) -> dict[str, Any]:
        return pool_load_user_db_config(self)

    def _resolve_user_db_config_path(self) -> Path:
        return pool_resolve_user_db_config_path(self)

    @staticmethod
    def _read_user_db_config_file(cfg_path: Path) -> Any:
        return pool_read_user_db_config_file(cfg_path)

    @staticmethod
    def _normalize_user_db_config(data: dict[str, Any]) -> dict[str, Any]:
        return pool_normalize_user_db_config(data)

    @staticmethod
    def _maybe_set_config_number(
        out: dict[str, Any],
        data: dict[str, Any],
        key: str,
        *,
        min_value: float,
        cast,
    ) -> None:
        pool_maybe_set_config_number(out, data, key, min_value=min_value, cast=cast)

    def _is_locked_error(self, exc: Exception) -> bool:
        return recovery_is_locked_error(exc)

    def _is_malformed_error(self, exc: Exception) -> bool:
        return recovery_is_malformed_error(exc)

    def _mark_locked_event(self, exc: Exception) -> None:
        recovery_mark_locked_event(self, exc)

    def _mark_malformed_event(self, exc: Exception) -> None:
        recovery_mark_malformed_event(self, exc)

    def _set_recovery_state(self, state: str, error: str | None = None) -> None:
        recovery_set_recovery_state(self, state, error)

    async def _maybe_auto_reset_on_corruption(self, error: Exception) -> None:
        return await recovery_runtime.maybe_auto_reset_on_corruption(self, error)

    @staticmethod
    def _is_auto_reset_enabled() -> bool:
        return recovery_is_auto_reset_enabled()

    def _is_auto_reset_throttled(self, now: float) -> bool:
        return recovery_is_auto_reset_throttled(self, now)

    def _mark_auto_reset_attempt(self, now: float) -> None:
        recovery_mark_auto_reset_attempt(self, now)

    def _record_auto_reset_result(self, reset_res: Any) -> None:
        recovery_record_auto_reset_result(self, reset_res)

    def get_diagnostics(self) -> dict[str, Any]:
        return pool_diagnostics(self)

    def _mark_malformed_recovery_window(self, now: float) -> bool:
        return recovery_runtime.mark_malformed_recovery_window(self, now)

    async def _run_recovery_pragma(
        self,
        rec_conn: aiosqlite.Connection,
        sql: str,
        *,
        fetch_one: bool = False,
    ) -> Any | None:
        return await recovery_runtime.run_recovery_pragma(self, rec_conn, sql, fetch_one=fetch_one)

    async def _rebuild_assets_fts(self, rec_conn: aiosqlite.Connection) -> None:
        return await recovery_runtime.rebuild_assets_fts(self, rec_conn)

    async def _reindex_asset_metadata_fts(self, rec_conn: aiosqlite.Connection) -> None:
        return await recovery_runtime.reindex_asset_metadata_fts(self, rec_conn)

    async def _rebuild_fts_during_recovery(self, rec_conn: aiosqlite.Connection) -> None:
        return await recovery_runtime.rebuild_fts_during_recovery(self, rec_conn)

    async def _attempt_malformed_recovery_async(self) -> bool:
        return await recovery_runtime.attempt_malformed_recovery_async(self)

    async def _attempt_missing_table_recovery_async(self) -> bool:
        def _update_known_columns_lower(lower: dict[str, str]) -> None:
            global _KNOWN_COLUMNS_LOWER
            _KNOWN_COLUMNS_LOWER = lower

        return await recovery_runtime.attempt_missing_table_recovery_async(
            self,
            known_columns=_KNOWN_COLUMNS,
            known_columns_lock=_KNOWN_COLUMNS_LOCK,
            schema_table_aliases=_SCHEMA_TABLE_ALIASES,
            update_known_columns_lower=_update_known_columns_lower,
        )

    async def _sleep_backoff(self, attempt: int):
        return await recovery_runtime.sleep_backoff(self, attempt)

    def get_runtime_status(self) -> dict[str, Any]:
        return conn_runtime.get_runtime_status(self, busy_timeout_ms=SQLITE_BUSY_TIMEOUT_MS)

    async def _apply_connection_pragmas(self, conn: aiosqlite.Connection):
        return await conn_runtime.apply_connection_pragmas(
            conn,
            cache_size_kib=SQLITE_CACHE_SIZE_KIB,
            busy_timeout_ms=SQLITE_BUSY_TIMEOUT_MS,
        )

    async def _create_connection(self) -> aiosqlite.Connection:
        return await conn_runtime.create_connection(
            self,
            cache_size_kib=SQLITE_CACHE_SIZE_KIB,
            busy_timeout_ms=SQLITE_BUSY_TIMEOUT_MS,
        )

    async def _acquire_connection_async(self) -> aiosqlite.Connection:
        return await conn_runtime.acquire_connection_async(self)

    async def _release_connection_async(self, conn: aiosqlite.Connection):
        return await conn_runtime.release_connection_async(self, conn)

    async def _ensure_initialized_async(self, *, allow_during_reset: bool = False):
        return await conn_runtime.ensure_initialized_async(
            self,
            allow_during_reset=allow_during_reset,
            cache_size_kib=SQLITE_CACHE_SIZE_KIB,
            busy_timeout_ms=SQLITE_BUSY_TIMEOUT_MS,
        )

    def _prune_asset_locks_locked(self, now: float) -> None:
        pool_prune_asset_locks_locked(self, now)

    def _prune_asset_locks_by_ttl(self, cutoff: float) -> None:
        pool_prune_asset_locks_by_ttl(self, cutoff)

    def _prune_asset_locks_by_cap(self) -> None:
        pool_prune_asset_locks_by_cap(self)

    @staticmethod
    def _asset_lock_last(entry: dict[str, Any]) -> float:
        return pool_asset_lock_last(entry)

    @staticmethod
    def _asset_lock_is_locked(entry: dict[str, Any]) -> bool:
        return pool_asset_lock_is_locked(entry)

    def _get_or_create_asset_lock(self, asset_id: Any) -> threading.Lock:
        return pool_get_or_create_asset_lock(self, asset_id, _asset_lock_key)

    @asynccontextmanager
    async def lock_for_asset(self, asset_id: Any):
        """
        Async context manager that serializes work per asset.

        The per-asset lock is a threading.Lock (see connection_pool.get_or_create_asset_lock).
        threading.Lock.acquire() is synchronous and returns a bool — it must NOT be awaited
        directly.  We offload the blocking acquire() to a thread via asyncio.to_thread so that
        the event loop is not blocked while waiting for a contended lock.
        """
        async with conn_runtime.lock_for_asset(self, asset_id):
            yield

    def _init_db(self):
        pool_init_db(self)

    def _tx_token(self) -> str | None:
        return tx_ctx_token(_TX_TOKEN)

    @staticmethod
    def _rows_to_dicts(rows: Any) -> list[dict[str, Any]]:
        return tx_rows_to_dicts(rows)

    async def _with_query_timeout(self, coro):
        return await exec_runtime.with_query_timeout(self, coro)

    async def _execute_async(
        self,
        query: str,
        params: tuple | None,
        fetch: bool,
        *,
        tx_token: str | None = None,
    ) -> Result[Any]:
        return await exec_runtime.execute_async(
            self,
            query,
            params,
            fetch,
            tx_token=tx_token,
            find_unresolved_sql_template_fn=_find_unresolved_sql_template,
            logger=logger,
        )

    @staticmethod
    def _is_write_sql(query: str) -> bool:
        return tx_is_write_sql(query)

    async def _execute_on_conn_async(
        self,
        conn: aiosqlite.Connection,
        query: str,
        params: tuple | None,
        fetch: bool,
        *,
        commit: bool,
        tx_token: str | None = None,
    ) -> Result[Any]:
        return await exec_runtime.execute_on_conn_async(
            self,
            conn,
            query,
            params,
            fetch,
            commit=commit,
            tx_token=tx_token,
            logger=logger,
            is_missing_column_error_fn=tx_is_missing_column_error,
            is_missing_table_error_fn=tx_is_missing_table_error,
        )

    async def _execute_on_conn_locked_async(
        self,
        conn: aiosqlite.Connection,
        query: str,
        params: tuple | None,
        fetch: bool,
        *,
        commit: bool,
    ) -> Result[Any]:
        return await exec_runtime.execute_on_conn_locked_async(
            self,
            conn,
            query,
            params,
            fetch,
            commit=commit,
        )

    async def _execute_with_cursor_result(
        self,
        conn: aiosqlite.Connection,
        query: str,
        params: tuple | None,
        *,
        fetch: bool,
        commit: bool,
    ) -> Result[Any]:
        return await exec_runtime.execute_with_cursor_result(
            self,
            conn,
            query,
            params,
            fetch=fetch,
            commit=commit,
        )

    @staticmethod
    def _cursor_write_result(cursor: Any) -> Result[Any]:
        return tx_cursor_write_result(cursor)

    async def aexecute(self, query: str, params: tuple | None = None, fetch: bool = False) -> Result[Any]:
        """Execute SQL on the DB loop thread (async)."""
        token = _TX_TOKEN.get()
        fut = self._loop_thread.submit(self._execute_async(query, params, fetch, tx_token=token))
        return await asyncio.wrap_future(fut)

    async def aquery(self, sql: str, params: tuple | None = None) -> Result[list[dict[str, Any]]]:
        """Execute a SELECT query and return rows (async)."""
        return await self.aexecute(sql, params, fetch=True)

    async def aquery_in(
        self,
        base_query: str,
        column: str,
        values: list[Any],
        additional_params: tuple | None = None,
    ) -> Result[list[dict[str, Any]]]:
        """Async variant of `query_in()` for IN-clause queries."""
        if not values:
            return Result.Ok([])
        if not isinstance(values, (list, tuple)):
            return Result.Err(ErrorCode.INVALID_INPUT, "values must be a list or tuple")
        ok_col, safe_col = tx_validate_and_repair_column_name(column, _KNOWN_COLUMNS_LOWER, _KNOWN_COLUMNS_LOCK)
        if not ok_col or not safe_col:
            return Result.Err(ErrorCode.INVALID_INPUT, f"Invalid column name: {column}")
        ok_tpl, why = tx_validate_in_base_query(base_query)
        if not ok_tpl:
            return Result.Err(ErrorCode.INVALID_INPUT, why or "Invalid base_query template")

        ok_q, query_or_err, _ = tx_build_in_query(str(base_query), safe_col, len(values))
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
        params_list: list[tuple],
        *,
        tx_token: str | None = None,
    ) -> Result[int]:
        return await exec_runtime.executemany_async(
            self,
            query,
            params_list,
            tx_token=tx_token,
        )

    async def _executemany_on_conn_async(
        self,
        conn: aiosqlite.Connection,
        query: str,
        params_list: list[tuple],
        *,
        commit: bool,
        tx_token: str | None = None,
    ) -> Result[int]:
        return await exec_runtime.executemany_on_conn_async(
            self,
            conn,
            query,
            params_list,
            commit=commit,
            tx_token=tx_token,
            logger=logger,
        )

    async def _executemany_on_conn_locked_async(
        self, conn: aiosqlite.Connection, query: str, params_list: list[tuple], *, commit: bool
    ) -> Result[int]:
        return await exec_runtime.executemany_on_conn_locked_async(
            self,
            conn,
            query,
            params_list,
            commit=commit,
        )

    async def aexecutemany(self, query: str, params_list: list[tuple]) -> Result[int]:
        """Execute a parameterized statement over multiple param tuples (async)."""
        token = _TX_TOKEN.get()
        fut = self._loop_thread.submit(self._executemany_async(query, params_list, tx_token=token))
        return await asyncio.wrap_future(fut)

    async def _executescript_async(self, script: str, *, tx_token: str | None = None) -> Result[bool]:
        return await exec_runtime.executescript_async(
            self,
            script,
            tx_token=tx_token,
        )

    async def _executescript_on_conn_async(self, conn: aiosqlite.Connection, script: str, *, commit: bool) -> Result[bool]:
        return await exec_runtime.executescript_on_conn_async(
            self,
            conn,
            script,
            commit=commit,
            logger=logger,
        )

    async def aexecutescript(self, script: str) -> Result[bool]:
        """Execute a multi-statement SQL script (async)."""
        token = _TX_TOKEN.get()
        fut = self._loop_thread.submit(self._executescript_async(script, tx_token=token))
        return await asyncio.wrap_future(fut)

    async def _vacuum_async(self) -> Result[bool]:
        return await exec_runtime.vacuum_async(self, logger=logger)

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
        return tx_begin_stmt_for_mode(mode)

    async def _begin_tx_with_retry(self, conn: aiosqlite.Connection, begin_stmt: str) -> None:
        return await life_runtime.begin_tx_with_retry(self, conn, begin_stmt)

    def _register_tx_token(self, token: str, conn: aiosqlite.Connection, lock: asyncio.Lock | None) -> None:
        return tx_register_tx_token(self, token, conn, lock)

    async def _abort_begin_tx(
        self,
        conn: aiosqlite.Connection,
        lock: asyncio.Lock | None,
    ) -> None:
        return await life_runtime.abort_begin_tx(self, conn, lock)

    def _get_tx_state(self, token: str) -> tuple[aiosqlite.Connection | None, bool]:
        return tx_get_tx_state(self, token)

    async def _commit_with_retry(self, conn: aiosqlite.Connection) -> None:
        return await life_runtime.commit_with_retry(self, conn)

    async def _cleanup_tx_state(
        self,
        token: str,
        conn: aiosqlite.Connection,
        had_write_lock: bool,
        lock: asyncio.Lock | None,
    ) -> None:
        return await life_runtime.cleanup_tx_state(self, token, conn, had_write_lock, lock)

    async def _begin_tx_async(self, mode: str) -> Result[str]:
        return await life_runtime.begin_tx_async(self, mode)

    async def _commit_tx_async(self, token: str) -> Result[bool]:
        return await life_runtime.commit_tx_async(self, token)

    async def _rollback_tx_async(self, token: str) -> Result[bool]:
        return await life_runtime.rollback_tx_async(self, token)

    async def _close_all_async(self):
        return await life_runtime.close_all_async(self)

    async def aclose(self):
        return await life_runtime.aclose_async(self)

    async def _drain_for_reset_async(self):
        return await life_runtime.drain_for_reset_async(self)

    async def _checkpoint_wal_before_reset_async(self) -> None:
        return await life_runtime.checkpoint_wal_before_reset_async(self)

    @staticmethod
    def _schedule_delete_on_reboot(path: Path) -> bool:
        return life_runtime.schedule_delete_on_reboot(path)

    def _has_async_runtime_state(self) -> bool:
        return life_runtime.has_async_runtime_state(self)

    async def areset(self) -> Result[bool]:
        return await life_runtime.areset(self)

    async def _drain_for_reset(self) -> None:
        return await life_runtime.drain_for_reset(self)

    async def _delete_reset_files(
        self,
        deleted_files: list[str],
        renamed_files: list[dict[str, str]],
    ) -> Result[bool] | None:
        return await life_runtime.delete_reset_files(self, deleted_files, renamed_files)

    async def _delete_or_recover_reset_file(
        self,
        path: Path,
        deleted_files: list[str],
        renamed_files: list[dict[str, str]],
    ) -> Result[bool] | None:
        return await life_runtime.delete_or_recover_reset_file(self, path, deleted_files, renamed_files)

    async def _delete_reset_file_with_retries(self, path: Path, deleted_files: list[str]) -> tuple[bool, Exception | None]:
        return await life_runtime.delete_reset_file_with_retries(self, path, deleted_files)

    @staticmethod
    def _is_windows_sharing_violation(exc: Exception) -> bool:
        return life_runtime.is_windows_sharing_violation(exc)

    @staticmethod
    def _lock_kill_enabled() -> bool:
        return life_runtime.lock_kill_enabled()

    @staticmethod
    def _build_rm_ctypes_types(wintypes: Any) -> tuple[Any, Any, Any]:
        return life_runtime.build_rm_ctypes_types(wintypes)

    @staticmethod
    def _configure_rm_dll(rm: Any, wintypes: Any, RM_PROCESS_INFO: Any) -> None:
        return life_runtime.configure_rm_dll(rm, wintypes, RM_PROCESS_INFO)

    @staticmethod
    def _rm_query_pids(rm: Any, session: Any, path: Path, wintypes: Any, RM_PROCESS_INFO: Any) -> list[int]:
        return life_runtime.rm_query_pids(rm, session, path, wintypes, RM_PROCESS_INFO)

    @classmethod
    def _find_locking_pids_windows(cls, path: Path) -> list[int]:
        return life_runtime.find_locking_pids_windows(cls, path)

    @classmethod
    def _terminate_locking_processes_windows(cls, path: Path) -> list[int]:
        return life_runtime.terminate_locking_processes_windows(cls, path)

    def _rename_or_schedule_delete(
        self,
        path: Path,
        renamed_files: list[dict[str, str]],
        last_error: Exception | None,
    ) -> Result[bool]:
        return life_runtime.rename_or_schedule_delete(path, renamed_files, last_error)

    async def _begin_tx_for_async(self, mode: str) -> Result[str]:
        return await life_runtime.begin_tx_for_async(self, mode)

    async def _commit_tx_for_async(self, token: str) -> Result[bool]:
        return await life_runtime.commit_tx_for_async(self, token)

    async def _rollback_tx_for_async(self, token: str) -> Result[bool]:
        return await life_runtime.rollback_tx_for_async(self, token)

    @asynccontextmanager
    async def atransaction(self, mode: str = "immediate"):
        async with life_runtime.transaction_context(self, _TX_TOKEN, mode) as tx_state:
            yield tx_state
