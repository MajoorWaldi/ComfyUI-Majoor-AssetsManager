"""Execution helpers extracted from ``sqlite_facade``."""

from __future__ import annotations

import asyncio
import sqlite3
from collections.abc import Callable
from typing import Any

import aiosqlite

from ...shared import ErrorCode, Result


async def with_query_timeout(self, coro):
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


async def execute_async(
    self,
    query: str,
    params: tuple | None,
    fetch: bool,
    *,
    tx_token: str | None,
    find_unresolved_sql_template_fn: Callable[[str], str | None],
    logger: Any,
) -> Result[Any]:
    unresolved_template = find_unresolved_sql_template_fn(query)
    if unresolved_template:
        query_preview = " ".join(str(query or "").split())
        if len(query_preview) > 220:
            query_preview = query_preview[:217] + "..."
        logger.error(
            "Rejected SQL with unresolved template %s. Query preview: %s",
            unresolved_template,
            query_preview,
        )
        msg = (
            f"Rejected SQL query containing unresolved template token {unresolved_template}. "
            "For IN-list templates use aquery_in()/query_in() so {IN_CLAUSE} is expanded safely."
        )
        return Result.Err(ErrorCode.INVALID_INPUT, msg)

    await self._ensure_initialized_async()

    token = tx_token or self._tx_token()
    if token:
        conn = self._tx_conns.get(token)
        if not conn:
            return Result.Err(ErrorCode.DB_ERROR, "Transaction connection missing")
        return await self._execute_on_conn_async(
            conn,
            query,
            params,
            fetch,
            commit=False,
            tx_token=token,
        )

    conn = await self._acquire_connection_async()
    try:
        return await self._execute_on_conn_async(
            conn,
            query,
            params,
            fetch,
            commit=True,
            tx_token=None,
        )
    finally:
        await self._release_connection_async(conn)


async def execute_on_conn_async(
    self,
    conn: aiosqlite.Connection,
    query: str,
    params: tuple | None,
    fetch: bool,
    *,
    commit: bool,
    tx_token: str | None,
    logger: Any,
    is_missing_column_error_fn: Callable[[Exception], bool],
    is_missing_table_error_fn: Callable[[Exception], bool],
) -> Result[Any]:
    async def _execute_inner() -> Result[Any]:
        try:
            lock = self._write_lock
            is_write = self._is_write_sql(query)
            if is_write and lock is None:
                return Result.Err(
                    ErrorCode.DB_ERROR,
                    "Write lock unavailable: database not yet initialized",
                )
            if is_write and lock is not None:
                if tx_token:
                    try:
                        with self._tx_state_lock:
                            in_tx = tx_token in self._tx_write_lock_tokens
                    except Exception:
                        in_tx = False
                else:
                    in_tx = False
                if in_tx:
                    return await self._execute_on_conn_locked_async(
                        conn,
                        query,
                        params,
                        fetch,
                        commit=commit,
                    )
                async with lock:
                    return await self._execute_on_conn_locked_async(
                        conn,
                        query,
                        params,
                        fetch,
                        commit=commit,
                    )
            return await self._execute_on_conn_locked_async(
                conn,
                query,
                params,
                fetch,
                commit=commit,
            )
        except sqlite3.IntegrityError as exc:
            logger.warning("Integrity error: %s", exc)
            return Result.Err(ErrorCode.DB_ERROR, f"Integrity error: {exc}")
        except sqlite3.OperationalError as exc:
            if "interrupted" in str(exc).lower():
                return Result.Err(ErrorCode.TIMEOUT, "Database operation interrupted (query timeout)")
            if self._is_locked_error(exc):
                self._mark_locked_event(exc)
            if is_missing_column_error_fn(exc):
                try:
                    from .schema import ensure_columns_exist

                    heal_res = await ensure_columns_exist(self)
                    if heal_res.ok:
                        return await self._execute_on_conn_locked_async(
                            conn,
                            query,
                            params,
                            fetch,
                            commit=commit,
                        )
                except Exception as heal_exc:
                    logger.warning("Schema self-heal after missing column failed: %s", heal_exc)
            if is_missing_table_error_fn(exc):
                repaired = await self._attempt_missing_table_recovery_async()
                if repaired:
                    return await self._execute_on_conn_locked_async(
                        conn,
                        query,
                        params,
                        fetch,
                        commit=commit,
                    )
            logger.error("Operational error: %s", exc)
            return Result.Err(ErrorCode.DB_ERROR, f"Operational error: {exc}")
        except sqlite3.DatabaseError as exc:
            if not self._is_malformed_error(exc):
                logger.error("Database error: %s", exc)
                return Result.Err(ErrorCode.DB_ERROR, str(exc))
            self._mark_malformed_event(exc)
            try:
                await conn.close()
                conn._mjr_closed = True  # type: ignore[attr-defined]
            except Exception:
                conn._mjr_closed = True  # type: ignore[attr-defined]
            recovered = await self._attempt_malformed_recovery_async()
            if recovered:
                retry_conn: aiosqlite.Connection | None = None
                try:
                    retry_conn = await self._acquire_connection_async()
                    return await self._execute_on_conn_locked_async(
                        retry_conn,
                        query,
                        params,
                        fetch,
                        commit=commit,
                    )
                except Exception as retry_exc:
                    logger.error("Database malformed after recovery retry: %s", retry_exc)
                    return Result.Err(ErrorCode.DB_ERROR, str(retry_exc))
                finally:
                    if retry_conn is not None:
                        await self._release_connection_async(retry_conn)
            await self._maybe_auto_reset_on_corruption(exc)
            logger.error("Database malformed and recovery failed: %s", exc)
            return Result.Err(ErrorCode.DB_ERROR, str(exc))
        except Exception as exc:
            logger.error("Unexpected database error: %s", exc)
            return Result.Err(ErrorCode.DB_ERROR, str(exc))

    return await self._with_query_timeout(_execute_inner())


async def execute_on_conn_locked_async(
    self,
    conn: aiosqlite.Connection,
    query: str,
    params: tuple | None,
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


async def execute_with_cursor_result(
    self,
    conn: aiosqlite.Connection,
    query: str,
    params: tuple | None,
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


async def executemany_async(
    self,
    query: str,
    params_list: list[tuple],
    *,
    tx_token: str | None,
) -> Result[int]:
    await self._ensure_initialized_async()
    token = tx_token or self._tx_token()
    if token:
        conn = self._tx_conns.get(token)
        if not conn:
            return Result.Err(ErrorCode.DB_ERROR, "Transaction connection missing")
        return await self._executemany_on_conn_async(
            conn,
            query,
            params_list,
            commit=False,
            tx_token=token,
        )

    conn = await self._acquire_connection_async()
    try:
        return await self._executemany_on_conn_async(
            conn,
            query,
            params_list,
            commit=True,
            tx_token=None,
        )
    finally:
        await self._release_connection_async(conn)


async def executemany_on_conn_async(
    self,
    conn: aiosqlite.Connection,
    query: str,
    params_list: list[tuple],
    *,
    commit: bool,
    tx_token: str | None,
    logger: Any,
) -> Result[int]:
    async def _execute_inner() -> Result[int]:
        try:
            lock = self._write_lock
            is_write = self._is_write_sql(query)
            if is_write and lock is not None:
                if tx_token:
                    try:
                        with self._tx_state_lock:
                            in_tx = tx_token in self._tx_write_lock_tokens
                    except Exception:
                        in_tx = False
                else:
                    in_tx = False
                if in_tx:
                    return await self._executemany_on_conn_locked_async(
                        conn,
                        query,
                        params_list,
                        commit=commit,
                    )
                async with lock:
                    return await self._executemany_on_conn_locked_async(
                        conn,
                        query,
                        params_list,
                        commit=commit,
                    )
            return await self._executemany_on_conn_locked_async(
                conn,
                query,
                params_list,
                commit=commit,
            )
        except sqlite3.OperationalError as exc:
            if "interrupted" in str(exc).lower():
                return Result.Err(ErrorCode.TIMEOUT, "Database operation interrupted (query timeout)")
            logger.error("Batch execute error: %s", exc)
            return Result.Err(ErrorCode.DB_ERROR, str(exc))
        except Exception as exc:
            logger.error("Batch execute error: %s", exc)
            return Result.Err(ErrorCode.DB_ERROR, str(exc))

    return await self._with_query_timeout(_execute_inner())


async def executemany_on_conn_locked_async(
    self,
    conn: aiosqlite.Connection,
    query: str,
    params_list: list[tuple],
    *,
    commit: bool,
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


async def executescript_async(
    self,
    script: str,
    *,
    tx_token: str | None,
) -> Result[bool]:
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


async def executescript_on_conn_async(
    self,
    conn: aiosqlite.Connection,
    script: str,
    *,
    commit: bool,
    logger: Any,
) -> Result[bool]:
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


async def vacuum_async(self, *, logger: Any) -> Result[bool]:
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
