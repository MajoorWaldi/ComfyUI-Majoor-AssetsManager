"""Shared request preparation for scan-related routes."""

from __future__ import annotations

import asyncio
import os
import shutil
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from pathlib import Path
from typing import Any, cast

from aiohttp import web

from ...shared import Result, get_logger
from ...utils import parse_bool

_log = get_logger(__name__)


@dataclass(slots=True)
class ScanRouteContext:
    services: dict[str, Any]
    body: dict[str, Any]


@dataclass(slots=True)
class ResetIndexTargetRoot:
    source: str
    path: str
    root_id: str | None


@dataclass(slots=True)
class ScanRequestPayload:
    body: dict[str, Any]
    scan_timeout_s: float
    async_scan: bool
    scope: str
    custom_root_id: str
    directory: str
    recursive: bool
    incremental: bool
    fast: bool
    background_metadata: bool


@dataclass(slots=True)
class ResetIndexPayload:
    body: dict[str, Any]
    scope: str
    custom_root_id: str
    reindex: bool
    clear_scan_journal: bool
    clear_metadata_cache: bool
    clear_asset_metadata: bool
    clear_assets_table: bool
    preserve_vectors: bool
    rebuild_fts_flag: bool
    incremental: bool
    fast: bool
    background_metadata: bool
    reset_scan_timeout_s: float
    hard_reset_db: bool


@dataclass(slots=True)
class ResetIndexClearResult:
    cleared: dict[str, Any]
    vectors_purged: bool | None


async def prepare_scan_route_context(
    request: web.Request,
    *,
    require_services: Callable[[], Awaitable[tuple[dict[str, Any] | None, Result[Any] | None]]],
    is_db_maintenance_active: Callable[[], bool],
    csrf_error: Callable[[web.Request], str | None],
    require_write_access: Callable[[web.Request], Result[Any]],
    check_rate_limit: Callable[[web.Request, str, int, int], tuple[bool, int | None]],
    read_json: Callable[[web.Request], Awaitable[Result[dict[str, Any]]]],
    rate_limit_endpoint: str = "scan",
    max_requests: int = 3,
    window_seconds: int = 60,
) -> Result[ScanRouteContext]:
    services_result = await _resolve_scan_route_services(require_services)
    if not services_result.ok:
        return Result.Err(
            services_result.code or "SERVICE_UNAVAILABLE",
            services_result.error or "Service unavailable",
        )
    request_guard = _validate_scan_route_request(
        request,
        is_db_maintenance_active=is_db_maintenance_active,
        csrf_error=csrf_error,
        require_write_access=require_write_access,
        check_rate_limit=check_rate_limit,
        rate_limit_endpoint=rate_limit_endpoint,
        max_requests=max_requests,
        window_seconds=window_seconds,
    )
    if not request_guard.ok:
        return Result.Err(
            request_guard.code or "INVALID_INPUT",
            request_guard.error or "Request validation failed",
        )
    services = services_result.data
    if not isinstance(services, dict):
        return Result.Err("SERVICE_UNAVAILABLE", "Service unavailable")
    return await _build_scan_route_context(request, services, read_json)


async def _resolve_scan_route_services(
    require_services: Callable[[], Awaitable[tuple[dict[str, Any] | None, Result[Any] | None]]],
) -> Result[dict[str, Any]]:
    services, error_result = await require_services()
    if error_result:
        return Result.Err(
            error_result.code or "SERVICE_UNAVAILABLE",
            error_result.error or "Service unavailable",
        )
    if not isinstance(services, dict):
        return Result.Err("SERVICE_UNAVAILABLE", "Service unavailable")
    return Result.Ok(services)


def _validate_scan_route_request(
    request: web.Request,
    *,
    is_db_maintenance_active: Callable[[], bool],
    csrf_error: Callable[[web.Request], str | None],
    require_write_access: Callable[[web.Request], Result[Any]],
    check_rate_limit: Callable[[web.Request, str, int, int], tuple[bool, int | None]],
    rate_limit_endpoint: str,
    max_requests: int,
    window_seconds: int,
) -> Result[None]:
    if is_db_maintenance_active():
        return Result.Err("DB_MAINTENANCE", "Database maintenance in progress. Please wait.")
    csrf = csrf_error(request)
    if csrf:
        return Result.Err("CSRF", csrf)
    auth = require_write_access(request)
    if not auth.ok:
        return Result.Err(auth.code or "FORBIDDEN", auth.error or "Write access required")
    allowed, retry_after = check_rate_limit(request, rate_limit_endpoint, max_requests, window_seconds)
    if allowed:
        return Result.Ok(None)
    return Result.Err(
        "RATE_LIMITED",
        "Too many scan requests. Please wait before retrying.",
        retry_after=retry_after,
    )


async def _build_scan_route_context(
    request: web.Request,
    services: dict[str, Any],
    read_json: Callable[[web.Request], Awaitable[Result[dict[str, Any]]]],
) -> Result[ScanRouteContext]:
    body_res = await read_json(request)
    if not body_res.ok:
        return Result.Err(body_res.code or "INVALID_INPUT", body_res.error or "Invalid request body")
    body = body_res.data if isinstance(body_res.data, dict) else {}
    return Result.Ok(ScanRouteContext(services=services, body=body))


def coerce_scan_timeout(value: Any, *, default: float) -> float:
    if value is None:
        return default
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return default
    if parsed < 1.0:
        return 1.0
    if parsed > 900.0:
        return 900.0
    return parsed


def parse_scan_request_payload(
    body: dict[str, Any],
    *,
    output_root: str,
    default_timeout: float,
    scan_fast_enabled: Callable[[dict[str, Any]], bool],
    scan_background_metadata_enabled: Callable[[dict[str, Any]], bool],
) -> ScanRequestPayload:
    return ScanRequestPayload(
        body=body,
        scan_timeout_s=coerce_scan_timeout(
            body.get("scan_timeout_s", body.get("scanTimeoutS", body.get("timeout_s", body.get("timeoutS")))),
            default=default_timeout,
        ),
        async_scan=parse_bool(body.get("async", body.get("background", False)), False),
        scope=str(body.get("scope") or "").strip().lower(),
        custom_root_id=str(body.get("custom_root_id") or body.get("root_id") or body.get("customRootId") or "").strip(),
        directory=str(body.get("directory", output_root) or ""),
        recursive=bool(body.get("recursive", True)),
        incremental=bool(body.get("incremental", True)),
        fast=bool(scan_fast_enabled(body)),
        background_metadata=bool(scan_background_metadata_enabled(body)),
    )


def parse_reset_index_payload(
    body: dict[str, Any],
    *,
    default_timeout: float,
) -> ResetIndexPayload:
    def _bool_option(keys: tuple[str, ...], default: bool) -> bool:
        for key in keys:
            if key in body:
                return parse_bool(body[key], default)
        return default

    scope = str(body.get("scope") or "output").strip().lower() or "output"
    custom_root_id = ""
    for key in ("custom_root_id", "root_id", "customRootId", "customRoot"):
        candidate = body.get(key)
        if candidate:
            custom_root_id = str(candidate).strip()
            break

    preserve_vectors = _bool_option(
        (
            "preserve_vectors",
            "preserveVectors",
            "keep_vectors",
            "keepVectors",
            "keep_embeddings",
            "keepEmbeddings",
        ),
        False,
    )
    clear_assets_table = _bool_option(("clear_assets", "clearAssets"), True)
    hard_reset_db = _bool_option(
        (
            "hard_reset_db",
            "hardResetDb",
            "delete_db_files",
            "deleteDbFiles",
            "delete_db",
            "deleteDb",
        ),
        False,
    )
    if preserve_vectors:
        clear_assets_table = False
        hard_reset_db = False

    return ResetIndexPayload(
        body=body,
        scope=scope,
        custom_root_id=custom_root_id,
        reindex=_bool_option(("reindex",), True),
        clear_scan_journal=_bool_option(("clear_scan_journal", "clearScanJournal"), True),
        clear_metadata_cache=_bool_option(("clear_metadata_cache", "clearMetadataCache"), True),
        clear_asset_metadata=_bool_option(("clear_asset_metadata", "clearAssetMetadata"), True),
        clear_assets_table=clear_assets_table,
        preserve_vectors=preserve_vectors,
        rebuild_fts_flag=_bool_option(("rebuild_fts", "rebuildFts"), True),
        incremental=_bool_option(("incremental",), False),
        fast=_bool_option(("fast",), True),
        background_metadata=_bool_option(("background_metadata", "backgroundMetadata"), True),
        reset_scan_timeout_s=coerce_scan_timeout(
            body.get("scan_timeout_s", body.get("scanTimeoutS", body.get("timeout_s", body.get("timeoutS")))),
            default=default_timeout,
        ),
        hard_reset_db=hard_reset_db,
    )


def resolve_reset_index_target_roots(
    *,
    scope: str,
    custom_root_id: str,
    output_root: str,
    input_root: str,
    resolve_custom_root: Callable[[str], Result[Any]],
) -> Result[list[ResetIndexTargetRoot]]:
    try:
        if scope in ("output", "outputs"):
            return Result.Ok(
                [ResetIndexTargetRoot(source="output", path=str(Path(output_root).resolve(strict=False)), root_id=None)]
            )
        if scope in ("input", "inputs"):
            return Result.Ok(
                [ResetIndexTargetRoot(source="input", path=str(Path(input_root).resolve(strict=False)), root_id=None)]
            )
        if scope == "all":
            return Result.Ok(
                [
                    ResetIndexTargetRoot(source="output", path=str(Path(output_root).resolve(strict=False)), root_id=None),
                    ResetIndexTargetRoot(source="input", path=str(Path(input_root).resolve(strict=False)), root_id=None),
                ]
            )
        if scope == "custom":
            if not custom_root_id:
                return Result.Err("INVALID_INPUT", "Missing custom_root_id for custom scope")
            root_result = resolve_custom_root(custom_root_id)
            if not root_result.ok:
                return Result.Err(root_result.code or "INVALID_INPUT", root_result.error or "Invalid custom root")
            return Result.Ok(
                [ResetIndexTargetRoot(source="custom", path=str(root_result.data), root_id=custom_root_id)]
            )
        return Result.Err("INVALID_INPUT", f"Unknown scope: {scope}")
    except Exception:
        return Result.Err("INVALID_INPUT", "Unable to resolve reset scope")


def build_reset_scan_summary(
    *,
    scope: str,
    reindex: bool,
    details: list[dict[str, Any]],
    totals: dict[str, int],
) -> dict[str, Any]:
    return {
        "scope": scope,
        "reindex": bool(reindex),
        "details": details,
        **totals,
    }


async def _clear_table_rows(db: Any, table: str, prefixes: list[str] | None) -> Result[int]:
    allowed_tables = frozenset({"assets", "scan_journal", "metadata_cache", "asset_metadata"})
    if table not in allowed_tables:
        return Result.Err("INVALID_INPUT", f"Attempt to clear unknown table: {table!r}")
    total_deleted = 0
    if prefixes is None:
        res = await db.aexecute(f"DELETE FROM {table}")
        if not res.ok:
            return res
        return Result.Ok(int(res.data or 0))
    for prefix in prefixes:
        try:
            normalized = str(Path(prefix).resolve(strict=False))
        except Exception:
            return Result.Err("INVALID_INPUT", f"Invalid path for cache clearing: {prefix}")
        resolved_parts = Path(normalized).parts
        if len(resolved_parts) < 2:
            return Result.Err("INVALID_INPUT", f"Path too shallow for safe clearing: {prefix!r}")
        like = normalized.rstrip(os.path.sep) + os.path.sep + "%"
        res = await db.aexecute(
            f"DELETE FROM {table} WHERE filepath = ? OR filepath LIKE ?",
            (normalized, like),
        )
        if not res.ok:
            return res
        total_deleted += int(res.data or 0)
    return Result.Ok(total_deleted)


async def _clear_asset_metadata_rows(db: Any, prefixes: list[str] | None) -> Result[int]:
    total_deleted = 0
    if prefixes is None:
        res = await db.aexecute("DELETE FROM asset_metadata")
        if not res.ok:
            return res
        return Result.Ok(int(res.data or 0))
    for prefix in prefixes:
        try:
            normalized = str(Path(prefix).resolve(strict=False))
        except Exception:
            return Result.Err("INVALID_INPUT", f"Invalid path for metadata clearing: {prefix}")
        like = normalized.rstrip(os.path.sep) + os.path.sep + "%"
        res = await db.aexecute(
            """
            DELETE FROM asset_metadata
            WHERE asset_id IN (
                SELECT id FROM assets
                WHERE filepath = ? OR filepath LIKE ?
            )
            """,
            (normalized, like),
        )
        if not res.ok:
            return res
        total_deleted += int(res.data or 0)
    return Result.Ok(total_deleted)


_CLEAR_STEPS: tuple[tuple[str, str], ...] = (
    ("scan_journal", "scan_journal"),
    ("metadata_cache", "metadata_cache"),
    ("asset_metadata", "asset_metadata"),
    ("assets", "assets"),
)

async def _do_reset_clears(
    db: Any,
    clear_scan_journal: bool,
    clear_metadata_cache: bool,
    clear_asset_metadata: bool,
    clear_assets_table: bool,
    cache_prefixes: list[str] | None,
) -> Result[dict[str, Any]]:
    flags = {
        "scan_journal": clear_scan_journal,
        "metadata_cache": clear_metadata_cache,
        "asset_metadata": clear_asset_metadata,
        "assets": clear_assets_table,
    }
    cleared: dict[str, Any] = {k: 0 for k in flags}
    async with db.atransaction(mode="immediate") as tx:
        if not tx.ok:
            return Result.Err("DB_ERROR", tx.error or "Failed to begin transaction")
        clear_res = await _run_enabled_reset_clears(db, flags=flags, cache_prefixes=cache_prefixes)
        if not clear_res.ok:
            return clear_res
        cleared.update(clear_res.data or {})
    if not tx.ok:
        return Result.Err("DB_ERROR", tx.error or "Commit failed")
    return Result.Ok(cleared)


async def _run_enabled_reset_clears(
    db: Any,
    *,
    flags: dict[str, bool],
    cache_prefixes: list[str] | None,
) -> Result[dict[str, int]]:
    cleared: dict[str, int] = {}
    for key, _ in _CLEAR_STEPS:
        if not flags.get(key):
            continue
        res = await _clear_reset_table(db, key=key, cache_prefixes=cache_prefixes)
        if not res.ok:
            return Result.Err(res.code, res.error or f"Failed to clear {key}")
        cleared[key] = int(res.data or 0)
    return Result.Ok(cleared)


async def _clear_reset_table(db: Any, *, key: str, cache_prefixes: list[str] | None) -> Result[int]:
    if key in {"scan_journal", "metadata_cache", "assets"}:
        return await _clear_table_rows(db, key, cache_prefixes)
    if key == "asset_metadata":
        return await _clear_asset_metadata_rows(db, cache_prefixes)
    return Result.Err("INVALID_INPUT", f"Unknown reset table: {key}")


def _cleanup_index_dir_contents(
    index_dir_path: Path,
    collections_dir_path: Path,
    preserve_vectors: bool,
) -> None:
    keep_prefixes = {"assets.sqlite"}
    if preserve_vectors:
        keep_prefixes.add("vectors.sqlite")
    keep_names: set[str] = {"custom_roots.json"}
    if preserve_vectors:
        keep_names.add("vectors")
    for item in index_dir_path.iterdir():
        if any(item.name.startswith(prefix) for prefix in keep_prefixes):
            continue
        if item == collections_dir_path:
            continue
        if item.name in keep_names:
            continue
        try:
            if item.is_dir():
                shutil.rmtree(item)
            else:
                item.unlink()
        except Exception as _e:
            _log.debug("cleanup_index_dir: could not remove %s: %s", item, _e)


async def run_reset_clear_phase(
    *,
    db: Any,
    scan_lock: Any,
    cache_prefixes: list[str] | None,
    clear_scan_journal: bool,
    clear_metadata_cache: bool,
    clear_asset_metadata: bool,
    clear_assets_table: bool,
    preserve_vectors: bool,
    scope: str,
    reindex: bool,
    purge_orphan_vectors: Callable[[Any], Awaitable[Result[Any]]],
    index_dir_path: Path,
    collections_dir_path: Path,
    is_db_malformed_result: Callable[[Result[Any]], bool],
    emit_status: Callable[[str, str, str | None], None],
    sanitize_message: Callable[[Exception, str], str],
) -> Result[ResetIndexClearResult]:
    use_lock = scan_lock is not None and hasattr(scan_lock, "__aenter__")
    res = await _run_reset_clear_transaction(
        db=db,
        scan_lock=scan_lock,
        use_lock=use_lock,
        cache_prefixes=cache_prefixes,
        clear_scan_journal=clear_scan_journal,
        clear_metadata_cache=clear_metadata_cache,
        clear_asset_metadata=clear_asset_metadata,
        clear_assets_table=clear_assets_table,
        emit_status=emit_status,
        sanitize_message=sanitize_message,
    )
    cleared_result = await _resolve_reset_clear_result(
        db=db,
        scan_lock=scan_lock,
        use_lock=use_lock,
        clear_result=res,
        preserve_vectors=preserve_vectors,
        is_db_malformed_result=is_db_malformed_result,
        sanitize_message=sanitize_message,
    )
    if not cleared_result.ok:
        return Result.Err(
            cleared_result.code or "RESET_FAILED",
            cleared_result.error or "Index reset failed",
        )
    cleared = cast(dict[str, Any], cleared_result.data)
    vectors_purged = await _maybe_purge_reset_vectors(
        db=db,
        clear_assets_table=clear_assets_table,
        purge_orphan_vectors=purge_orphan_vectors,
    )
    await _maybe_finalize_reset_clear_phase(
        db=db,
        scope=scope,
        clear_scan_journal=clear_scan_journal,
        clear_metadata_cache=clear_metadata_cache,
        reindex=reindex,
        index_dir_path=index_dir_path,
        collections_dir_path=collections_dir_path,
        preserve_vectors=preserve_vectors,
    )
    return Result.Ok(ResetIndexClearResult(cleared=cleared, vectors_purged=vectors_purged))


async def _run_reset_clear_transaction(
    *,
    db: Any,
    scan_lock: Any,
    use_lock: bool,
    cache_prefixes: list[str] | None,
    clear_scan_journal: bool,
    clear_metadata_cache: bool,
    clear_asset_metadata: bool,
    clear_assets_table: bool,
    emit_status: Callable[[str, str, str | None], None],
    sanitize_message: Callable[[Exception, str], str],
) -> Result[dict[str, Any]]:
    try:
        emit_status("resetting_db", "info", None)
        coro = _do_reset_clears(
            db,
            clear_scan_journal,
            clear_metadata_cache,
            clear_asset_metadata,
            clear_assets_table,
            cache_prefixes,
        )
        return await _await_reset_operation(coro=coro, scan_lock=scan_lock, use_lock=use_lock)
    except Exception as exc:
        return Result.Err("RESET_FAILED", sanitize_message(exc, "Index reset failed during clear phase"))


async def _await_reset_operation(
    *,
    coro: Awaitable[Result[Any]],
    scan_lock: Any,
    use_lock: bool,
) -> Result[Any]:
    if not use_lock:
        return await coro
    async with scan_lock:
        return await coro


async def _resolve_reset_clear_result(
    *,
    db: Any,
    scan_lock: Any,
    use_lock: bool,
    clear_result: Result[dict[str, Any]],
    preserve_vectors: bool,
    is_db_malformed_result: Callable[[Result[Any]], bool],
    sanitize_message: Callable[[Exception, str], str],
) -> Result[dict[str, Any]]:
    if clear_result.ok:
        return Result.Ok(clear_result.data or {})
    if not is_db_malformed_result(clear_result):
        return Result.Err(clear_result.code or "RESET_FAILED", clear_result.error or "Index reset failed")
    if preserve_vectors:
        return Result.Err(
            "DB_MALFORMED",
            "Database is malformed; preserving vectors is not possible. Retry with full reset.",
        )
    return await _run_malformed_db_reset(
        db=db,
        scan_lock=scan_lock,
        use_lock=use_lock,
        sanitize_message=sanitize_message,
    )


async def _run_malformed_db_reset(
    *,
    db: Any,
    scan_lock: Any,
    use_lock: bool,
    sanitize_message: Callable[[Exception, str], str],
) -> Result[dict[str, Any]]:
    try:
        reset_res = await _await_reset_operation(coro=db.areset(), scan_lock=scan_lock, use_lock=use_lock)
    except Exception as exc:
        return Result.Err("RESET_FAILED", sanitize_message(exc, "Malformed DB and fallback hard reset failed"))
    if not reset_res.ok:
        return Result.Err(reset_res.code or "RESET_FAILED", reset_res.error or "Hard reset failed")
    return Result.Ok(
        {
            "scan_journal": None,
            "metadata_cache": None,
            "asset_metadata": None,
            "assets": None,
            "hard_reset_db": True,
            "fallback_reason": "malformed_db",
            "file_ops": (reset_res.meta or {}),
        }
    )


async def _maybe_purge_reset_vectors(
    *,
    db: Any,
    clear_assets_table: bool,
    purge_orphan_vectors: Callable[[Any], Awaitable[Result[Any]]],
) -> bool | None:
    if not clear_assets_table:
        return None
    try:
        purge_res = await purge_orphan_vectors(db)
        return bool(purge_res.ok)
    except Exception:
        return False


async def _maybe_finalize_reset_clear_phase(
    *,
    db: Any,
    scope: str,
    clear_scan_journal: bool,
    clear_metadata_cache: bool,
    reindex: bool,
    index_dir_path: Path,
    collections_dir_path: Path,
    preserve_vectors: bool,
) -> None:
    if scope != "all" or not (clear_scan_journal or clear_metadata_cache):
        return
    try:
        await db.avacuum()
    except Exception:
        pass
    if not (reindex and index_dir_path.exists()):
        return
    try:
        await asyncio.to_thread(
            _cleanup_index_dir_contents,
            index_dir_path,
            collections_dir_path,
            preserve_vectors,
        )
    except Exception as _e:
        _log.debug("run_reset_reindex: index dir cleanup failed: %s", _e)


async def run_reset_reindex(
    *,
    index_service: Any,
    targets: list[ResetIndexTargetRoot],
    incremental: bool,
    fast: bool,
    background_metadata: bool,
    reset_scan_timeout_s: float,
    wait_for_with_cleanup: Callable[..., Awaitable[Any]],
    format_scan_error: Callable[[Exception, str], str],
) -> Result[dict[str, Any]]:
    totals = {key: 0 for key in ("scanned", "added", "updated", "skipped", "errors")}
    details: list[dict[str, Any]] = []

    for target in targets:
        try:
            result = await wait_for_with_cleanup(
                index_service.scan_directory(
                    target.path,
                    True,
                    incremental,
                    target.source,
                    target.root_id,
                    fast,
                    background_metadata,
                ),
                timeout=reset_scan_timeout_s,
            )
        except (TimeoutError, asyncio.TimeoutError, asyncio.CancelledError):
            return Result.Err("TIMEOUT", "Index reset scan timed out")
        except Exception as exc:
            return Result.Err("RESET_FAILED", format_scan_error(exc, "Index reset scan failed"))

        if not result.ok:
            return result

        stats = result.data or {}
        counts = {key: int(stats.get(key) or 0) for key in totals}
        for key in totals:
            totals[key] += counts[key]
        details.append(
            {
                "source": target.source,
                "root_id": target.root_id,
                **counts,
            }
        )

    return Result.Ok({"details": details, "totals": totals})


def merge_scan_results(out_stats: dict[str, Any], in_stats: dict[str, Any]) -> dict[str, Any]:
    return {
        "scanned": out_stats.get("scanned", 0) + in_stats.get("scanned", 0),
        "added": out_stats.get("added", 0) + in_stats.get("added", 0),
        "updated": out_stats.get("updated", 0) + in_stats.get("updated", 0),
        "skipped": out_stats.get("skipped", 0) + in_stats.get("skipped", 0),
        "errors": out_stats.get("errors", 0) + in_stats.get("errors", 0),
        "start_time": out_stats.get("start_time") or in_stats.get("start_time"),
        "end_time": in_stats.get("end_time") or out_stats.get("end_time"),
        "scope": "all",
    }


async def run_all_scope_scan(
    *,
    services: dict[str, Any],
    output_root: str,
    input_root: str,
    recursive: bool,
    incremental: bool,
    fast: bool,
    background_metadata: bool,
    async_scan: bool,
    scan_timeout_s: float,
    kickoff_background_scan: Callable[..., Awaitable[Any]],
    scan_enqueued_from_kickoff: Callable[[Any], bool],
    wait_for_with_cleanup: Callable[..., Awaitable[Any]],
    format_scan_error: Callable[[Exception, str], str],
) -> Result[dict[str, Any]]:
    output_path = str(Path(output_root).resolve())
    input_path = str(Path(input_root).resolve())

    if async_scan:
        return await _run_all_scope_background_scan(
            output_path=output_path,
            input_path=input_path,
            recursive=recursive,
            incremental=incremental,
            fast=fast,
            background_metadata=background_metadata,
            kickoff_background_scan=kickoff_background_scan,
            scan_enqueued_from_kickoff=scan_enqueued_from_kickoff,
        )
    return await _run_all_scope_foreground_scan(
        index_service=services["index"],
        output_path=output_path,
        input_path=input_path,
        recursive=recursive,
        incremental=incremental,
        fast=fast,
        background_metadata=background_metadata,
        scan_timeout_s=scan_timeout_s,
        wait_for_with_cleanup=wait_for_with_cleanup,
        format_scan_error=format_scan_error,
    )


async def _run_all_scope_background_scan(
    *,
    output_path: str,
    input_path: str,
    recursive: bool,
    incremental: bool,
    fast: bool,
    background_metadata: bool,
    kickoff_background_scan: Callable[..., Awaitable[Any]],
    scan_enqueued_from_kickoff: Callable[[Any], bool],
) -> Result[dict[str, Any]]:
    output_enqueued = await _enqueue_all_scope_target(
        path=output_path,
        source="output",
        recursive=recursive,
        incremental=incremental,
        fast=fast,
        background_metadata=background_metadata,
        kickoff_background_scan=kickoff_background_scan,
        scan_enqueued_from_kickoff=scan_enqueued_from_kickoff,
    )
    input_enqueued = await _enqueue_all_scope_target(
        path=input_path,
        source="input",
        recursive=recursive,
        incremental=incremental,
        fast=fast,
        background_metadata=background_metadata,
        kickoff_background_scan=kickoff_background_scan,
        scan_enqueued_from_kickoff=scan_enqueued_from_kickoff,
    )
    queued_targets = [source for source, queued in (("output", output_enqueued), ("input", input_enqueued)) if queued]
    return Result.Ok(
        {
            "queued": bool(queued_targets),
            "mode": "background",
            "scope": "all",
            "targets": ["output", "input"],
            "enqueued_targets": queued_targets,
        }
    )


async def _enqueue_all_scope_target(
    *,
    path: str,
    source: str,
    recursive: bool,
    incremental: bool,
    fast: bool,
    background_metadata: bool,
    kickoff_background_scan: Callable[..., Awaitable[Any]],
    scan_enqueued_from_kickoff: Callable[[Any], bool],
) -> bool:
    result = await kickoff_background_scan(
        path,
        source=source,
        recursive=recursive,
        incremental=incremental,
        fast=fast,
        background_metadata=background_metadata,
        min_interval_seconds=0.0,
        respect_bg_scan_on_list=False,
    )
    return bool(scan_enqueued_from_kickoff(result))


async def _run_all_scope_foreground_scan(
    *,
    index_service: Any,
    output_path: str,
    input_path: str,
    recursive: bool,
    incremental: bool,
    fast: bool,
    background_metadata: bool,
    scan_timeout_s: float,
    wait_for_with_cleanup: Callable[..., Awaitable[Any]],
    format_scan_error: Callable[[Exception, str], str],
) -> Result[dict[str, Any]]:
    out_res = await _scan_all_scope_target(
        index_service=index_service,
        path=output_path,
        source="output",
        recursive=recursive,
        incremental=incremental,
        fast=fast,
        background_metadata=background_metadata,
        scan_timeout_s=scan_timeout_s,
        wait_for_with_cleanup=wait_for_with_cleanup,
        format_scan_error=format_scan_error,
        timeout_message="Output scan timed out",
        failure_message="Output scan failed",
    )
    if not out_res.ok:
        return out_res
    in_res = await _scan_all_scope_target(
        index_service=index_service,
        path=input_path,
        source="input",
        recursive=recursive,
        incremental=incremental,
        fast=fast,
        background_metadata=background_metadata,
        scan_timeout_s=scan_timeout_s,
        wait_for_with_cleanup=wait_for_with_cleanup,
        format_scan_error=format_scan_error,
        timeout_message="Input scan timed out",
        failure_message="Input scan failed",
    )
    if not in_res.ok:
        return in_res
    return Result.Ok(merge_scan_results(out_res.data or {}, in_res.data or {}))


async def _scan_all_scope_target(
    *,
    index_service: Any,
    path: str,
    source: str,
    recursive: bool,
    incremental: bool,
    fast: bool,
    background_metadata: bool,
    scan_timeout_s: float,
    wait_for_with_cleanup: Callable[..., Awaitable[Any]],
    format_scan_error: Callable[[Exception, str], str],
    timeout_message: str,
    failure_message: str,
) -> Result[dict[str, Any]]:
    try:
        return await wait_for_with_cleanup(
            index_service.scan_directory(
                path,
                recursive,
                incremental,
                source,
                None,
                fast,
                background_metadata,
            ),
            timeout=scan_timeout_s,
        )
    except (TimeoutError, asyncio.TimeoutError, asyncio.CancelledError):
        return Result.Err("TIMEOUT", timeout_message)
    except Exception as exc:
        return Result.Err("SCAN_FAILED", format_scan_error(exc, failure_message))
