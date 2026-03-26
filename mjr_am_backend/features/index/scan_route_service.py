"""Shared request preparation for scan-related routes."""

from __future__ import annotations

import asyncio
import os
import shutil
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from aiohttp import web

from ...shared import Result
from ...utils import parse_bool


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
    services, error_result = await require_services()
    if error_result:
        return Result.Err(
            error_result.code or "SERVICE_UNAVAILABLE",
            error_result.error or "Service unavailable",
        )
    if not isinstance(services, dict):
        return Result.Err("SERVICE_UNAVAILABLE", "Service unavailable")

    if is_db_maintenance_active():
        return Result.Err("DB_MAINTENANCE", "Database maintenance in progress. Please wait.")

    csrf = csrf_error(request)
    if csrf:
        return Result.Err("CSRF", csrf)

    auth = require_write_access(request)
    if not auth.ok:
        return Result.Err(auth.code or "FORBIDDEN", auth.error or "Write access required")

    allowed, retry_after = check_rate_limit(request, rate_limit_endpoint, max_requests, window_seconds)
    if not allowed:
        return Result.Err(
            "RATE_LIMITED",
            "Too many scan requests. Please wait before retrying.",
            retry_after=retry_after,
        )

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
    async def _clear_table(table: str, prefixes: list[str] | None) -> Result[int]:
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

    async def _clear_assets(prefixes: list[str] | None) -> Result[int]:
        return await _clear_table("assets", prefixes)

    async def _clear_asset_metadata(prefixes: list[str] | None) -> Result[int]:
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

    cleared: dict[str, Any] = {"scan_journal": 0, "metadata_cache": 0, "asset_metadata": 0, "assets": 0}

    async def _do_clears() -> Result[dict[str, Any]]:
        async with db.atransaction(mode="immediate") as tx:
            if not tx.ok:
                return Result.Err("DB_ERROR", tx.error or "Failed to begin transaction")
            if clear_scan_journal:
                res = await _clear_table("scan_journal", cache_prefixes)
                if not res.ok:
                    return Result.Err(res.code, res.error or "Failed to clear scan_journal")
                cleared["scan_journal"] = int(res.data or 0)
            if clear_metadata_cache:
                res = await _clear_table("metadata_cache", cache_prefixes)
                if not res.ok:
                    return Result.Err(res.code, res.error or "Failed to clear metadata_cache")
                cleared["metadata_cache"] = int(res.data or 0)
            if clear_asset_metadata:
                res = await _clear_asset_metadata(cache_prefixes)
                if not res.ok:
                    return Result.Err(res.code, res.error or "Failed to clear asset_metadata")
                cleared["asset_metadata"] = int(res.data or 0)
            if clear_assets_table:
                res = await _clear_assets(cache_prefixes)
                if not res.ok:
                    return Result.Err(res.code, res.error or "Failed to clear assets")
                cleared["assets"] = int(res.data or 0)
        if not tx.ok:
            return Result.Err("DB_ERROR", tx.error or "Commit failed")
        return Result.Ok(cleared)

    try:
        emit_status("resetting_db", "info", None)
        if scan_lock is not None and hasattr(scan_lock, "__aenter__"):
            async with scan_lock:
                res = await _do_clears()
        else:
            res = await _do_clears()
    except Exception as exc:
        return Result.Err("RESET_FAILED", sanitize_message(exc, "Index reset failed during clear phase"))

    if not res.ok:
        if is_db_malformed_result(res):
            if preserve_vectors:
                return Result.Err(
                    "DB_MALFORMED",
                    "Database is malformed; preserving vectors is not possible. Retry with full reset.",
                )
            try:
                if scan_lock is not None and hasattr(scan_lock, "__aenter__"):
                    async with scan_lock:
                        reset_res = await db.areset()
                else:
                    reset_res = await db.areset()
            except Exception as exc:
                return Result.Err("RESET_FAILED", sanitize_message(exc, "Malformed DB and fallback hard reset failed"))
            if not reset_res.ok:
                return Result.Err(reset_res.code or "RESET_FAILED", reset_res.error or "Hard reset failed")
            cleared = {
                "scan_journal": None,
                "metadata_cache": None,
                "asset_metadata": None,
                "assets": None,
                "hard_reset_db": True,
                "fallback_reason": "malformed_db",
                "file_ops": (reset_res.meta or {}),
            }
        else:
            return Result.Err(res.code or "RESET_FAILED", res.error or "Index reset failed")

    vectors_purged: bool | None = None
    if clear_assets_table:
        try:
            purge_res = await purge_orphan_vectors(db)
            vectors_purged = bool(purge_res.ok)
        except Exception:
            vectors_purged = False

    if scope == "all" and (clear_scan_journal or clear_metadata_cache):
        try:
            await db.avacuum()
        except Exception:
            pass

        if reindex and index_dir_path.exists():
            def _cleanup_index_dir() -> None:
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
                    except Exception:
                        pass

            try:
                await asyncio.to_thread(_cleanup_index_dir)
            except Exception:
                pass

    return Result.Ok(ResetIndexClearResult(cleared=cleared, vectors_purged=vectors_purged))


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
        output_enqueued = scan_enqueued_from_kickoff(
            await kickoff_background_scan(
                output_path,
                source="output",
                recursive=recursive,
                incremental=incremental,
                fast=fast,
                background_metadata=background_metadata,
                min_interval_seconds=0.0,
                respect_bg_scan_on_list=False,
            )
        )
        input_enqueued = scan_enqueued_from_kickoff(
            await kickoff_background_scan(
                input_path,
                source="input",
                recursive=recursive,
                incremental=incremental,
                fast=fast,
                background_metadata=background_metadata,
                min_interval_seconds=0.0,
                respect_bg_scan_on_list=False,
            )
        )
        queued_targets: list[str] = []
        if output_enqueued:
            queued_targets.append("output")
        if input_enqueued:
            queued_targets.append("input")
        return Result.Ok(
            {
                "queued": bool(queued_targets),
                "mode": "background",
                "scope": "all",
                "targets": ["output", "input"],
                "enqueued_targets": queued_targets,
            }
        )

    try:
        out_res = await wait_for_with_cleanup(
            services["index"].scan_directory(
                output_path,
                recursive,
                incremental,
                "output",
                None,
                fast,
                background_metadata,
            ),
            timeout=scan_timeout_s,
        )
    except (TimeoutError, asyncio.TimeoutError, asyncio.CancelledError):
        return Result.Err("TIMEOUT", "Output scan timed out")
    except Exception as exc:
        return Result.Err("SCAN_FAILED", format_scan_error(exc, "Output scan failed"))

    try:
        in_res = await wait_for_with_cleanup(
            services["index"].scan_directory(
                input_path,
                recursive,
                incremental,
                "input",
                None,
                fast,
                background_metadata,
            ),
            timeout=scan_timeout_s,
        )
    except (TimeoutError, asyncio.TimeoutError, asyncio.CancelledError):
        return Result.Err("TIMEOUT", "Input scan timed out")
    except Exception as exc:
        return Result.Err("SCAN_FAILED", format_scan_error(exc, "Input scan failed"))

    if not out_res.ok:
        return out_res
    if not in_res.ok:
        return in_res
    return Result.Ok(merge_scan_results(out_res.data or {}, in_res.data or {}))
