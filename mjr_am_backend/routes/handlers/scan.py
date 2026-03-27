"""
Directory scanning and file indexing endpoints.
"""
import asyncio
from contextlib import suppress
import os
import shutil
import time
from pathlib import Path
from typing import Any

from aiohttp import web

try:
    import folder_paths  # type: ignore
except Exception:
    class _FolderPathsStub:
        @staticmethod
        def get_input_directory() -> str:
            return str((Path(__file__).resolve().parents[3] / "input").resolve())

    folder_paths = _FolderPathsStub()  # type: ignore

from mjr_am_backend.adapters.db.schema import purge_orphan_vec_embeddings, rebuild_fts
from mjr_am_backend.config import (
    COLLECTIONS_DIR_PATH,
    INDEX_DIR_PATH,
    SCAN_DEFAULT_BACKGROUND_METADATA,
    SCAN_DEFAULT_FAST,
    TO_THREAD_TIMEOUT_S,
)
from mjr_am_backend.custom_roots import resolve_custom_root
from mjr_am_backend.features.index.scan_route_service import (
    build_reset_scan_summary,
    parse_scan_request_payload,
    parse_reset_index_payload,
    prepare_scan_route_context,
    resolve_reset_index_target_roots,
    run_reset_clear_phase,
    run_reset_reindex,
    run_all_scope_scan,
)
from mjr_am_backend.features.index.metadata_helpers import MetadataHelpers
from mjr_am_backend.shared import Result, get_logger, sanitize_error_message
from mjr_am_backend.utils import parse_bool, sanitize_for_json

from ..core import (
    audit_log_write,
    _check_rate_limit,
    _csrf_error,
    _is_path_allowed,
    _is_path_allowed_custom,
    _is_within_root,
    _json_response,
    _normalize_path,
    _read_json,
    _require_operation_enabled,
    _require_services,
    _require_write_access,
    _resolve_security_prefs,
    _safe_rel_path,
    safe_error_message,
)
from .db_maintenance import (
    is_db_maintenance_active,
    is_vector_backfill_active,
    request_vector_backfill_priority_window,
    set_db_maintenance_active,
    _restart_watcher_if_needed,
)
from .scan_staging import (
    StageDestination,
    _resolve_stage_destination,
    register_staging_routes,
)
from mjr_am_backend.features.watcher_settings import get_watcher_settings, update_watcher_settings
from mjr_am_backend.features.index.watcher_scope import build_watch_paths

from .scan_upload import (
    _index_uploaded_input_best_effort,
    register_upload_routes,
)
from .scan_watcher import (
    _build_watcher_callbacks,
    _delay_for_recent_generated_marker,
    _filter_recent_generated_files,
    _start_watcher_for_scope,
    _stop_watcher_if_running,
    _watcher_scope_config,
    register_watcher_routes,
)
from .filesystem import _kickoff_background_scan
from .scan_consistency import (
    _collect_missing_asset_rows,
    _delete_missing_asset_rows,
    _missing_asset_row,
    _query_consistency_sample,
    _run_consistency_check,
)
from .scan_helpers import (
    _DB_CONSISTENCY_COOLDOWN_SECONDS,
    _DB_CONSISTENCY_SAMPLE,
    _FILE_COMPARE_CHUNK_BYTES,
    _INDEX_SEMAPHORE,
    _MAX_CONCURRENT_INDEX,
    _MAX_FILENAME_LEN,
    _MAX_RENAME_ATTEMPTS,
    _MAX_UPLOAD_SIZE,
    _UPLOAD_READ_CHUNK_BYTES,
    _add_env_upload_extensions,
    _allowed_upload_exts,
    _cleanup_temp_upload_file,
    _default_allowed_upload_exts,
    _emit_maintenance_status,
    _file_sizes_equal,
    _files_equal_content,
    _files_exist_and_are_regular,
    _is_db_malformed_result,
    _normalize_upload_extension,
    _paths_are_same_file,
    _read_upload_file_field,
    _refresh_watcher_runtime_settings,
    _resolve_input_directory,
    _resolve_scan_root,
    _runtime_output_root,
    _schedule_index_task,
    _stream_content_equal,
    _unique_upload_destination,
    _upload_skip_index,
    _validate_upload_filename,
    _watcher_settings_from_body,
    _write_multipart_file_atomic,
    _write_upload_chunks,
)

logger = get_logger(__name__)


def _scan_enqueued_from_kickoff(result: Any) -> bool:
    # Backward-compatible for monkeypatched tests that return None.
    if result is None:
        return True
    return bool(result)


def _scan_fast_enabled(body: dict[str, Any]) -> bool:
    if not isinstance(body, dict):
        return bool(SCAN_DEFAULT_FAST)
    mode = str(body.get("mode") or "").strip().lower()
    if mode == "fast" or parse_bool(body.get("manifest_only"), False):
        return True
    if "fast" in body:
        return parse_bool(body.get("fast"), bool(SCAN_DEFAULT_FAST))
    return bool(SCAN_DEFAULT_FAST)


def _scan_background_metadata_enabled(body: dict[str, Any]) -> bool:
    if not isinstance(body, dict):
        return bool(SCAN_DEFAULT_BACKGROUND_METADATA)
    for key in ("background_metadata", "backgroundMetadata", "enrich_metadata", "enqueue_metadata"):
        if key in body:
            return parse_bool(body.get(key), False)
    return bool(SCAN_DEFAULT_BACKGROUND_METADATA)


def _invalidate_vector_searcher(svc: dict | None) -> None:
    """Best-effort: tell the in-memory VectorSearcher to drop cached results."""
    try:
        searcher = svc.get("vector_searcher") if isinstance(svc, dict) else None
        if searcher and hasattr(searcher, "invalidate"):
            searcher.invalidate()
    except Exception:
        pass


async def _wait_for_with_cleanup(awaitable, *, timeout: float):
    """Wait for an awaitable with timeout and always clean up the underlying task."""
    task = asyncio.get_running_loop().create_task(awaitable)
    try:
        return await asyncio.wait_for(task, timeout=timeout)
    except Exception as exc:
        if not task.done():
            task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass
        raise exc


# These module-level names are kept here so test monkeypatching on `scan_mod`
# (i.e. `scan_mod._LAST_CONSISTENCY_CHECK = 0.0`, `scan_mod.time.time`) works.
_LAST_CONSISTENCY_CHECK = 0.0
_CONSISTENCY_LOCK = asyncio.Lock()


async def _maybe_schedule_consistency_check(db) -> None:
    """Schedule a consistency check if the cooldown period has elapsed."""
    global _LAST_CONSISTENCY_CHECK
    if not db:
        return
    async with _CONSISTENCY_LOCK:
        now = time.time()
        if (now - _LAST_CONSISTENCY_CHECK) < _DB_CONSISTENCY_COOLDOWN_SECONDS:
            return
        _LAST_CONSISTENCY_CHECK = now
    try:
        # Add a done-callback so unhandled exceptions inside the task are surfaced
        # in the log rather than silently swallowed by the event loop (NL-3).
        _task = asyncio.create_task(_run_consistency_check(db))
        _task.add_done_callback(
            lambda t: logger.error("Consistency check task failed: %s", t.exception())
            if not t.cancelled() and t.exception() else None
        )
    except Exception as exc:
        logger.debug("Failed to schedule consistency check: %s", exc)


def register_scan_routes(routes: web.RouteTableDef) -> None:
    """Register scan/index/stage/open-in-folder routes."""
    @routes.post("/mjr/am/scan")
    async def scan_directory(request):
        """
        Scan a directory for assets.

        JSON body:
            directory: Path to scan (optional, defaults to ComfyUI output directory)
            recursive: Scan subdirectories (default: true)
            incremental: Only update changed files (default: true)
        """
        context_res = await prepare_scan_route_context(
            request,
            require_services=_require_services,
            is_db_maintenance_active=is_db_maintenance_active,
            csrf_error=_csrf_error,
            require_write_access=_require_write_access,
            check_rate_limit=_check_rate_limit,
            read_json=_read_json,
        )
        if not context_res.ok:
            return _json_response(context_res)
        context = context_res.data
        svc = context.services if context else {}
        output_root = await _runtime_output_root(svc)
        body = context.body if context else {}
        payload = parse_scan_request_payload(
            body,
            output_root=output_root,
            default_timeout=max(float(TO_THREAD_TIMEOUT_S), 120.0),
            scan_fast_enabled=_scan_fast_enabled,
            scan_background_metadata_enabled=_scan_background_metadata_enabled,
        )
        scan_timeout_s = payload.scan_timeout_s
        async_scan = payload.async_scan
        scope = payload.scope
        custom_root_id = payload.custom_root_id

        # Use ComfyUI output directory if not specified (backwards-compatible)
        directory = payload.directory
        if not directory:
            result = Result.Err("INVALID_INPUT", "No directory specified and no output directory configured")
            return _json_response(result)

        scan_source = "output"
        scan_root_id = None

        # Optional scoped scans (output/input/custom/all)
        if scope:
            if scope in ("output", "outputs"):
                directory = output_root
                scan_source = "output"
                custom_root_id = None
            elif scope in ("input", "inputs"):
                directory = folder_paths.get_input_directory()
                scan_source = "input"
                custom_root_id = None
            elif scope == "custom":
                root_result = resolve_custom_root(str(custom_root_id or ""))
                if not root_result.ok:
                    return _json_response(Result.Err("INVALID_INPUT", root_result.error))
                directory = str(root_result.data)
                scan_source = "custom"
                scan_root_id = str(custom_root_id) if custom_root_id else None
            elif scope == "all":
                all_scope_result = await run_all_scope_scan(
                    services=svc,
                    output_root=output_root,
                    input_root=folder_paths.get_input_directory(),
                    recursive=payload.recursive,
                    incremental=payload.incremental,
                    fast=payload.fast,
                    background_metadata=payload.background_metadata,
                    async_scan=async_scan,
                    scan_timeout_s=scan_timeout_s,
                    kickoff_background_scan=_kickoff_background_scan,
                    scan_enqueued_from_kickoff=_scan_enqueued_from_kickoff,
                    wait_for_with_cleanup=_wait_for_with_cleanup,
                    format_scan_error=safe_error_message,
                )
                if not all_scope_result.ok:
                    return _json_response(all_scope_result)
                merged = all_scope_result.data or {}
                try:
                    if isinstance(merged, dict):
                        request["mjr_stats"] = {
                            "scanned": merged.get("scanned", 0),
                            "added": merged.get("added", 0),
                            "updated": merged.get("updated", 0),
                            "skipped": merged.get("skipped", 0),
                            "errors": merged.get("errors", 0),
                            "scope": "all",
                        }
                except Exception as exc:
                    logger.debug("Failed to attach scan stats: %s", exc)
                return _json_response(Result.Ok(merged))
            else:
                return _json_response(Result.Err("INVALID_INPUT", f"Unknown scope: {scope}"))

        # SECURITY: resolve directory strictly (follows symlinks) and validate it stays within allowed roots.
        resolved_dir_res = _resolve_scan_root(str(directory))
        if not resolved_dir_res.ok:
            return _json_response(resolved_dir_res)
        normalized_dir = resolved_dir_res.data

        # Validate with strict root containment to prevent symlink/junction traversal outside roots.
        allowed = False
        try:
            if scan_source == "output":
                base_root_res = _resolve_scan_root(str(output_root))
                allowed = base_root_res.ok and _is_within_root(normalized_dir, base_root_res.data)
            elif scan_source == "input":
                base_root_res = _resolve_scan_root(str(folder_paths.get_input_directory()))
                allowed = base_root_res.ok and _is_within_root(normalized_dir, base_root_res.data)
            elif scan_source == "custom":
                root_result = resolve_custom_root(str(custom_root_id or scan_root_id or ""))
                if root_result.ok:
                    base_root_res = _resolve_scan_root(str(root_result.data))
                    allowed = base_root_res.ok and _is_within_root(normalized_dir, base_root_res.data)
                else:
                    allowed = False
            else:
                # No explicit scope: allow only within configured output/input or registered custom roots.
                out_root = _resolve_scan_root(str(output_root))
                in_root = _resolve_scan_root(str(folder_paths.get_input_directory()))
                allowed = (
                    (out_root.ok and _is_within_root(normalized_dir, out_root.data))
                    or (in_root.ok and _is_within_root(normalized_dir, in_root.data))
                    or _is_path_allowed_custom(normalized_dir)
                )
        except Exception as exc:
            logger.debug("Scan root containment check failed: %s", exc)
            allowed = False

        if not allowed or not (_is_path_allowed(normalized_dir) or _is_path_allowed_custom(normalized_dir)):
            return _json_response(Result.Err("INVALID_INPUT", "Directory not allowed"))

        recursive = payload.recursive
        incremental = payload.incremental
        fast = payload.fast
        background_metadata = payload.background_metadata

        if async_scan:
            queued = _scan_enqueued_from_kickoff(await _kickoff_background_scan(
                str(normalized_dir),
                source=scan_source,
                root_id=scan_root_id,
                recursive=bool(recursive),
                incremental=bool(incremental),
                fast=bool(fast),
                background_metadata=bool(background_metadata),
                min_interval_seconds=0.0,
                respect_bg_scan_on_list=False,
            ))
            return _json_response(
                Result.Ok(
                    {
                        "queued": bool(queued),
                        "mode": "background",
                        "scope": scan_source,
                        "directory": str(normalized_dir),
                        "root_id": scan_root_id,
                    }
                )
            )

        try:
            try:
                result = await _wait_for_with_cleanup(
                    svc['index'].scan_directory(
                        str(normalized_dir),
                        recursive,
                        incremental,
                        scan_source,
                        scan_root_id,
                        fast,
                        background_metadata,
                    ),
                    timeout=scan_timeout_s,
                )
            except asyncio.TimeoutError:
                return _json_response(Result.Err("TIMEOUT", "Scan timed out"))
            try:
                if result.ok and isinstance(result.data, dict):
                    request["mjr_stats"] = {
                        "scanned": result.data.get("scanned", 0),
                        "added": result.data.get("added", 0),
                        "updated": result.data.get("updated", 0),
                        "skipped": result.data.get("skipped", 0),
                        "errors": result.data.get("errors", 0),
                        "scope": scan_source,
                        "fast": bool(fast),
                    }
            except Exception as exc:
                logger.debug("Failed to attach scan stats: %s", exc)
        except Exception as exc:
            logger.error("Unhandled error while scanning directory", exc_info=True)
            error_result = Result.Err(
                "SCAN_FAILED",
                "Internal error while scanning assets",
                detail=sanitize_error_message(exc, "Internal error while scanning assets"),
            )
            return _json_response(error_result)

        db = svc.get("db") if isinstance(svc, dict) else None
        asyncio.create_task(_maybe_schedule_consistency_check(db))
        return _json_response(result)

    @routes.post("/mjr/am/index-files")
    async def index_files(request):
        """
        Index a list of files (no directory scan).

        JSON body:
            files: [{ filename, subfolder?, type? }]
            incremental: Only update changed files (default: true)
        """
        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)

        csrf = _csrf_error(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))
        auth = _require_write_access(request)
        if not auth.ok:
            return _json_response(auth)

        body_res = await _read_json(request)
        if not body_res.ok:
            return _json_response(body_res)
        body = body_res.data or {}

        files = body.get("files")
        origin = str(body.get("origin") or body.get("source") or "").strip().lower()
        prompt_id = str(body.get("prompt_id") or "").strip()
        if not isinstance(files, list) or not files:
            result = Result.Err("INVALID_INPUT", "Missing or invalid 'files' list")
            return _json_response(result)

        generation_origins = {"generation", "executed", "comfy", "comfyui"}
        is_generation_origin = origin in generation_origins
        if is_db_maintenance_active():
            # Allow generation-origin index requests to preempt an active vector backfill:
            # pause backfill briefly, process generated asset(s), then resume backfill.
            if is_generation_origin and is_vector_backfill_active():
                try:
                    pause_seconds = max(8.0, min(90.0, 6.0 + (2.0 * float(len(files)))))
                    request_vector_backfill_priority_window(
                        pause_seconds,
                        reason="generation_index",
                    )
                except Exception:
                    pass
            else:
                return _json_response(Result.Err("DB_MAINTENANCE", "Database maintenance in progress. Please wait."))

        output_root = await _runtime_output_root(svc)
        incremental = body.get("incremental", True)
        grouped_paths: dict[tuple[str, str, str], list] = {}
        recent_generated_paths: list[str] = []

        for item in files:
            if not isinstance(item, dict):
                continue
            filename = item.get("filename") or item.get("name")
            if not filename:
                filename = None
            subfolder = item.get("subfolder") or ""
            file_type = (item.get("type") or "output").lower()
            root_id = item.get("root_id") or item.get("custom_root_id")
            raw_path = item.get("path") or item.get("filepath") or item.get("fullpath") or item.get("full_path")

            # If an absolute path is provided, prefer it (more robust across ComfyUI variants).
            if raw_path:
                normalized = None
                try:
                    p = Path(str(raw_path)).expanduser()
                    if p.is_absolute() or getattr(p, "drive", ""):
                        normalized = p.resolve(strict=True)
                except Exception:
                    normalized = None

                if normalized is not None:
                    base_root = None
                    base_type = None
                    base_root_id = root_id

                    try:
                        out_root = Path(output_root).resolve(strict=True)
                    except Exception:
                        out_root = None
                    try:
                        in_root = Path(folder_paths.get_input_directory()).resolve(strict=True)
                    except Exception:
                        in_root = None

                    if out_root and _is_within_root(normalized, out_root):
                        base_root = str(out_root)
                        base_type = "output"
                        base_root_id = None
                    elif in_root and _is_within_root(normalized, in_root):
                        base_root = str(in_root)
                        base_type = "input"
                        base_root_id = None
                    elif file_type == "custom":
                        root_result = resolve_custom_root(str(root_id or ""))
                        if root_result.ok:
                            try:
                                custom_root = Path(str(root_result.data)).resolve(strict=True)
                            except Exception:
                                custom_root = None
                            if custom_root and _is_within_root(normalized, custom_root):
                                base_root = str(custom_root)
                                base_type = "custom"
                    else:
                        try:
                            if _is_path_allowed_custom(normalized):
                                from mjr_am_backend.custom_roots import list_custom_roots

                                roots_res = list_custom_roots()
                                if roots_res.ok and isinstance(roots_res.data, list):
                                    for r in roots_res.data:
                                        try:
                                            rp = Path(str(r.get("path") or "")).resolve(strict=True)
                                            if _is_within_root(normalized, rp):
                                                base_root = str(rp)
                                                base_type = "custom"
                                                base_root_id = r.get("id") or root_id
                                                break
                                        except Exception:
                                            continue
                        except Exception:
                            pass

                    if base_root and base_type:
                        # Enforce allowlist checks
                        if base_type == "custom":
                            if not _is_path_allowed_custom(normalized):
                                continue
                        else:
                            if not _is_path_allowed(normalized):
                                continue
                        grouped_paths.setdefault((base_root, base_type, str(base_root_id or "")), []).append(normalized)
                        if origin in ("generation", "executed", "comfy", "comfyui"):
                            try:
                                recent_generated_paths.append(str(normalized))
                            except Exception:
                                pass
                        continue

            if not filename:
                continue

            if file_type == "input":
                base_root = folder_paths.get_input_directory()
            elif file_type == "custom":
                root_result = resolve_custom_root(str(root_id or ""))
                if not root_result.ok:
                    continue
                base_root = str(root_result.data)
            else:
                base_root = output_root

            # SECURITY: subfolder must be a safe relative path (no traversal, no absolute/drive).
            rel = _safe_rel_path(subfolder or "")
            if rel is None:
                continue

            base_dir = str(Path(base_root).resolve(strict=False))
            candidate = (Path(base_dir) / rel / filename) if str(rel) else (Path(base_dir) / filename)
            try:
                normalized = candidate.resolve(strict=True)
            except Exception:
                continue
            if not normalized.exists() or not normalized.is_file():
                continue
            if not _is_within_root(normalized, Path(base_dir)):
                continue
            if file_type == "custom":
                if not _is_path_allowed_custom(normalized):
                    continue
            else:
                if not _is_path_allowed(normalized):
                    continue

            grouped_paths.setdefault((base_dir, file_type, str(root_id or "")), []).append(normalized)
            if origin in ("generation", "executed", "comfy", "comfyui"):
                try:
                    recent_generated_paths.append(str(normalized))
                except Exception:
                    pass

        if not grouped_paths:
            result = Result.Err("INVALID_INPUT", "No valid files to index")
            return _json_response(result)

        try:
            PromptServer.instance.send_sync("mjr.scan.progress", sanitize_for_json({
                "status": "started",
                "scope": "index-files",
                "origin": origin,
                "prompt_id": prompt_id or None,
                "files": len(files),
            }))
            for item in files:
                if isinstance(item, dict):
                    PromptServer.instance.send_sync("mjr.asset.indexing", sanitize_for_json({
                        "filename": item.get("filename") or item.get("name"),
                        "subfolder": item.get("subfolder") or "",
                        "type": item.get("type") or "output",
                        "prompt_id": prompt_id or item.get("prompt_id") or None,
                    }))
        except Exception:
            pass

        if recent_generated_paths:
            try:
                from mjr_am_backend.features.index.watcher import mark_recent_generated
                mark_recent_generated(recent_generated_paths)
            except Exception:
                pass

        total_stats = {
            "scanned": 0,
            "added": 0,
            "updated": 0,
            "skipped": 0,
            "errors": 0,
            "start_time": "",
            "end_time": ""
        }

        for (base_dir, file_type, root_id), paths in grouped_paths.items():
            source = file_type if file_type in ("output", "input", "custom") else "output"
            try:
                try:
                    result = await _wait_for_with_cleanup(
                        svc['index'].index_paths(
                            paths,
                            base_dir,
                            incremental,
                            source,
                            (root_id or None),
                        ),
                        timeout=TO_THREAD_TIMEOUT_S,
                    )
                except asyncio.TimeoutError:
                    result = Result.Err("TIMEOUT", "Indexing timed out")
            except Exception as exc:
                result = Result.Err(
                    "INDEX_FAILED", sanitize_error_message(exc, "Indexing failed")
                )
            if not result.ok:
                return _json_response(result)

            stats = result.data if isinstance(result.data, dict) else {}
            if not total_stats["start_time"]:
                total_stats["start_time"] = str(stats.get("start_time") or "")
            total_stats["end_time"] = str(stats.get("end_time") or total_stats["end_time"] or "")
            total_stats["scanned"] += stats.get("scanned", 0)
            total_stats["added"] += stats.get("added", 0)
            total_stats["updated"] += stats.get("updated", 0)
            total_stats["skipped"] += stats.get("skipped", 0)
            total_stats["errors"] += stats.get("errors", 0)

        # POST-PROCESSING: Enhance metadata with frontend-provided info (e.g. generation_time_ms).
        # BUG-04: replaced SQLite TEMP TABLE (connection-affinity issue with pool) with a direct
        # IN-clause query.  BUG-09: metadata_raw is fetched once in the batch query and reused
        # directly — no per-asset re-read (was N+1 before).
        import json
        gen_time_lookup: dict[tuple[str, str, str, str], int] = {}
        prompt_lookup: dict[tuple[str, str, str, str], str] = {}
        for item in files:
            gen_time = item.get("generation_time_ms") or item.get("duration_ms")
            if gen_time and isinstance(gen_time, (int, float)) and gen_time > 0:
                fname = item.get("filename")
                if not fname:
                    continue
                key = (
                    str(fname),
                    str(item.get("subfolder") or ""),
                    str(item.get("type") or "output").lower(),
                    str(item.get("root_id") or item.get("custom_root_id") or ""),
                )
                gen_time_lookup.setdefault(key, int(gen_time))
            item_prompt_id = str(item.get("prompt_id") or prompt_id or "").strip()
            if item_prompt_id:
                fname = item.get("filename")
                if fname:
                    key = (
                        str(fname),
                        str(item.get("subfolder") or ""),
                        str(item.get("type") or "output").lower(),
                        str(item.get("root_id") or item.get("custom_root_id") or ""),
                    )
                    prompt_lookup.setdefault(key, item_prompt_id)

        if gen_time_lookup or prompt_lookup:
            try:
                db_adapter = svc['db']
                fnames = list({k[0] for k in gen_time_lookup})
                fnames_for_prompt = list({k[0] for k in prompt_lookup})
                all_fnames = list(dict.fromkeys(fnames + fnames_for_prompt))
                # Chunk to ≤500 to stay well within SQLite's SQLITE_MAX_VARIABLE_NUMBER
                # and avoid O(n) SQL compile time for large batches (NL-1).
                _MAX_IN_BATCH = 500
                gen_time_by_id: dict[int, int] = {}
                for start in range(0, len(all_fnames), _MAX_IN_BATCH):
                    chunk = all_fnames[start:start + _MAX_IN_BATCH]
                    if not chunk:
                        continue
                    placeholders = ",".join("?" * len(chunk))
                    # Single batch query per chunk - no temp table, no connection-affinity risk.
                    q_res = await db_adapter.aquery(
                        f"SELECT a.id, a.filename, a.subfolder, a.source, a.root_id, am.metadata_raw "
                        f"FROM assets a LEFT JOIN asset_metadata am ON a.id = am.asset_id "
                        f"WHERE a.filename IN ({placeholders})",
                        tuple(chunk),
                    )
                    if not (q_res.ok and q_res.data):
                        continue
                    for row in q_res.data:
                        key = (
                            str(row.get("filename") or ""),
                            str(row.get("subfolder") or ""),
                            str(row.get("source") or "output").lower(),
                            str(row.get("root_id") or ""),
                        )
                        gt = gen_time_lookup.get(key)
                        if gt is None:
                            continue
                        asset_id = row.get("id")
                        if not asset_id:
                            continue
                        # Reuse metadata_raw already fetched in this query (BUG-09: was re-read).
                        cur_meta: dict[str, Any] = {}
                        raw = row.get("metadata_raw")
                        if raw:
                            try:
                                cur_meta = json.loads(raw)
                            except Exception:
                                pass
                        merged = dict(cur_meta)
                        merged["generation_time_ms"] = gt
                        try:
                            async with db_adapter.lock_for_asset(int(asset_id)):
                                await MetadataHelpers.write_asset_metadata_row(
                                    db_adapter, int(asset_id), Result.Ok(merged)
                                )
                            gen_time_by_id[int(asset_id)] = gt
                        except Exception:
                            logger.debug("Failed to upsert generation time for asset %s", asset_id)
                assigned_stack_by_id: dict[int, int] = {}
                if prompt_lookup:
                    try:
                        from ...features.stacks.service import StacksService
                        stack_service = StacksService(db_adapter)
                        for start in range(0, len(fnames_for_prompt), _MAX_IN_BATCH):
                            chunk = fnames_for_prompt[start:start + _MAX_IN_BATCH]
                            if not chunk:
                                continue
                            placeholders = ",".join("?" * len(chunk))
                            q_res = await db_adapter.aquery(
                                f"SELECT id, filename, subfolder, source, root_id FROM assets WHERE filename IN ({placeholders})",
                                tuple(chunk),
                            )
                            if not (q_res.ok and q_res.data):
                                continue
                            for row in q_res.data:
                                key = (
                                    str(row.get("filename") or ""),
                                    str(row.get("subfolder") or ""),
                                    str(row.get("source") or "output").lower(),
                                    str(row.get("root_id") or ""),
                                )
                                row_prompt_id = prompt_lookup.get(key)
                                if not row_prompt_id:
                                    continue
                                asset_id = int(row.get("id") or 0)
                                if not asset_id:
                                    continue
                                await db_adapter.aexecute(
                                    "UPDATE assets SET job_id = ? WHERE id = ?",
                                    (row_prompt_id, asset_id),
                                )
                                stack_res = await stack_service.assign_asset_by_job_id(asset_id, row_prompt_id)
                                if stack_res.ok and stack_res.data is not None:
                                    assigned_stack_by_id[asset_id] = int(stack_res.data)
                    except Exception as ex:
                        logger.debug("Failed to assign prompt/job/stack correlation: %s", ex)

                if gen_time_by_id or assigned_stack_by_id:
                    try:
                        from ..registry import PromptServer
                        payloads_by_id: dict[int, dict[str, Any]] = {}
                        index_service = svc.get("index") if isinstance(svc, dict) else None
                        target_ids = list(dict.fromkeys(list(gen_time_by_id.keys()) + list(assigned_stack_by_id.keys())))
                        if index_service and hasattr(index_service, "get_assets_batch"):
                            try:
                                batch_res = await index_service.get_assets_batch(target_ids)
                                if batch_res.ok and isinstance(batch_res.data, list):
                                    for item in batch_res.data:
                                        if not isinstance(item, dict):
                                            continue
                                        try:
                                            item_id = int(item.get("id") or 0)
                                        except Exception:
                                            item_id = 0
                                        if not item_id or item_id not in gen_time_by_id:
                                            continue
                                        payload = dict(item)
                                        if item_id in gen_time_by_id:
                                            payload["generation_time_ms"] = gen_time_by_id[item_id]
                                        if item_id in assigned_stack_by_id:
                                            payload["stack_id"] = assigned_stack_by_id[item_id]
                                        row_prompt = str(item.get("job_id") or prompt_id or "")
                                        if row_prompt:
                                            payload["job_id"] = row_prompt
                                        payloads_by_id[item_id] = payload
                            except Exception:
                                payloads_by_id = {}

                        # Emit only renderable/full payloads to avoid creating "ghost" cards
                        # in the grid from id-only updates.
                        for item_id in list(gen_time_by_id.keys()):
                            payload = payloads_by_id.get(int(item_id))
                            if not isinstance(payload, dict):
                                continue
                            PromptServer.instance.send_sync(
                                "mjr-asset-updated",
                                sanitize_for_json(payload),
                            )
                            try:
                                PromptServer.instance.send_sync(
                                    "mjr.asset.indexed",
                                    sanitize_for_json(payload),
                                )
                            except Exception:
                                pass
                    except Exception:
                        pass

            except Exception as ex:
                logger.debug("Failed during batch metadata enhancement: %s", ex)


        try:
            request["mjr_stats"] = {
                "scanned": total_stats.get("scanned", 0),
                "added": total_stats.get("added", 0),
                "updated": total_stats.get("updated", 0),
                "skipped": total_stats.get("skipped", 0),
                "errors": total_stats.get("errors", 0),
                "scope": "index-files",
            }
        except Exception as exc:
            logger.debug("Failed to attach scan stats: %s", exc)

        try:
            PromptServer.instance.send_sync("mjr.scan.progress", sanitize_for_json({
                "status": "completed",
                "scope": "index-files",
                "origin": origin,
                "prompt_id": prompt_id or None,
                "stats": total_stats,
            }))
            PromptServer.instance.send_sync("mjr.runtime.status", sanitize_for_json({
                "active_prompt_id": prompt_id or None,
                "origin": origin,
                "stats": total_stats,
            }))
        except Exception:
            pass

        return _json_response(Result.Ok(total_stats))

    @routes.post("/mjr/am/index/reset")
    async def reset_index(request):
        """
        Reset index caches and optionally re-run scans.

        Body fields:
            scope: "output"|"input"|"custom"|"all" (default: "output")
            custom_root_id/root_id: required when scope="custom"
            reindex: bool (default: true)
            clear_scan_journal: bool (default: true)
            clear_metadata_cache: bool (default: true)
            preserve_vectors: bool (default: false)
            rebuild_fts: bool (default: true)
            incremental: bool (default: false)
            fast: bool (default: true)
            background_metadata: bool (default: true)
        """
        csrf = _csrf_error(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))
        auth = _require_write_access(request)
        if not auth.ok:
            return _json_response(auth)

        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)
        prefs = await _resolve_security_prefs(svc)
        op = _require_operation_enabled("reset_index", prefs=prefs)
        if not op.ok:
            return _json_response(op)
        if is_db_maintenance_active():
            return _json_response(Result.Err("DB_MAINTENANCE", "Database maintenance in progress. Please wait."))

        body_res = await _read_json(request)
        if not body_res.ok:
            return _json_response(body_res)
        body = body_res.data or {}
        _emit_maintenance_status("started", "info", operation="reset_index")
        reset_payload = parse_reset_index_payload(
            body,
            default_timeout=max(float(TO_THREAD_TIMEOUT_S), 120.0),
        )
        scope = reset_payload.scope
        custom_root_id = reset_payload.custom_root_id
        reindex = reset_payload.reindex
        clear_scan_journal = reset_payload.clear_scan_journal
        clear_metadata_cache = reset_payload.clear_metadata_cache
        clear_asset_metadata = reset_payload.clear_asset_metadata
        clear_assets_table = reset_payload.clear_assets_table
        preserve_vectors = reset_payload.preserve_vectors
        rebuild_fts_flag = reset_payload.rebuild_fts_flag
        incremental = reset_payload.incremental
        fast = reset_payload.fast
        background_metadata = reset_payload.background_metadata
        reset_scan_timeout_s = reset_payload.reset_scan_timeout_s
        hard_reset_db = reset_payload.hard_reset_db

        output_root = await _runtime_output_root(svc)
        target_roots_res = resolve_reset_index_target_roots(
            scope=scope,
            custom_root_id=custom_root_id,
            output_root=output_root,
            input_root=folder_paths.get_input_directory(),
            resolve_custom_root=resolve_custom_root,
        )
        if not target_roots_res.ok:
            if target_roots_res.error == "Unable to resolve reset scope":
                logger.debug("Failed to resolve reset index roots")
            return _json_response(target_roots_res)
        target_roots = target_roots_res.data or []

        db = svc.get("db")
        if not db:
            _emit_maintenance_status("failed", "error", "Database service unavailable", operation="reset_index")
            return _json_response(Result.Err("SERVICE_UNAVAILABLE", "Database service unavailable"))

        # ── Maintenance guard ─────────────────────────────────────────────
        # Mark maintenance active so concurrent scans / other maintenance
        # routes refuse to start while we are clearing / resetting tables.
        set_db_maintenance_active(True)
        watcher_was_running = False

        # Best-effort coordination with concurrent scans.
        # Do NOT hold the scan lock while invoking scan_directory() (it also uses the same lock).
        scan_lock = None
        try:
            index_svc = svc.get("index")
            scan_lock = getattr(index_svc, "_scan_lock", None)
            _emit_maintenance_status("stopping_workers", "info", operation="reset_index")
            watcher_was_running = await _stop_watcher_if_running(svc)
            if index_svc and hasattr(index_svc, "stop_enrichment"):
                try:
                    await index_svc.stop_enrichment(clear_queue=True)
                except Exception:
                    pass
        except Exception:
            scan_lock = None

        cache_prefixes: list[str] | None = None if scope == "all" else [entry.path for entry in target_roots]

        # If the caller is effectively requesting a full wipe (the usual UI path),
        # treat it as a hard reset by default when scope=all.
        implied_full_clear = bool(clear_scan_journal and clear_metadata_cache and clear_asset_metadata and clear_assets_table)
        should_hard_reset_db = bool(scope == "all" and (hard_reset_db or implied_full_clear))

        try:  # ── outer try/finally for maintenance cleanup ──

            if should_hard_reset_db:
                # 1) Hard reset DB files (includes -wal/-shm) using adapter logic (Windows-safe).
                _emit_maintenance_status("resetting_db", "info", operation="reset_index")
                try:
                    if scan_lock is not None and hasattr(scan_lock, "__aenter__"):
                        async with scan_lock:
                            reset_res = await db.areset()
                    else:
                        reset_res = await db.areset()
                except Exception as exc:
                    logger.error("Hard reset DB failed", exc_info=True)
                    _emit_maintenance_status("failed", "error", sanitize_error_message(exc, "Hard reset failed"), operation="reset_index")
                    return _json_response(
                        Result.Err("RESET_FAILED", sanitize_error_message(exc, "Hard reset failed"))
                    )

                if not reset_res.ok:
                    _emit_maintenance_status("failed", "error", reset_res.error or "Hard reset failed", operation="reset_index")
                    return _json_response(reset_res)

                cleared = {
                    "scan_journal": None,
                    "metadata_cache": None,
                    "asset_metadata": None,
                    "assets": None,
                    "hard_reset_db": True,
                    "file_ops": (reset_res.meta or {}),
                }

                # 2) Optionally reindex after reset.
                scan_details: list[dict[str, Any]] = []
                totals = {key: 0 for key in ("scanned", "added", "updated", "skipped", "errors")}
                if reindex:
                    if not svc.get("index"):
                        _emit_maintenance_status("failed", "error", "Index service unavailable", operation="reset_index")
                        return _json_response(Result.Err("SERVICE_UNAVAILABLE", "Index service unavailable"))
                    _emit_maintenance_status("restarting_scan", "info", operation="reset_index")
                    reindex_res = await run_reset_reindex(
                        index_service=svc["index"],
                        targets=target_roots,
                        incremental=incremental,
                        fast=fast,
                        background_metadata=background_metadata,
                        reset_scan_timeout_s=reset_scan_timeout_s,
                        wait_for_with_cleanup=_wait_for_with_cleanup,
                        format_scan_error=sanitize_error_message,
                    )
                    if not reindex_res.ok:
                        _emit_maintenance_status("failed", "error", reindex_res.error or "Index reset scan failed", operation="reset_index")
                        return _json_response(reindex_res)
                    reindex_data = reindex_res.data or {}
                    scan_details = list(reindex_data.get("details") or [])
                    totals = dict(reindex_data.get("totals") or totals)

                scan_summary = build_reset_scan_summary(
                    scope=scope,
                    reindex=reindex,
                    details=scan_details,
                    totals=totals,
                )

                # Invalidate vector searcher cache after hard reset (stale embeddings).
                _invalidate_vector_searcher(svc)

                # No need to VACUUM or rebuild FTS here: db.areset() reinitializes schema + indexes.
                _emit_maintenance_status("done", "success", operation="reset_index")
                return _json_response(Result.Ok({"cleared": cleared, "scan_summary": scan_summary, "rebuild_fts": None}))

            clear_res = await run_reset_clear_phase(
                db=db,
                scan_lock=scan_lock,
                cache_prefixes=cache_prefixes,
                clear_scan_journal=clear_scan_journal,
                clear_metadata_cache=clear_metadata_cache,
                clear_asset_metadata=clear_asset_metadata,
                clear_assets_table=clear_assets_table,
                preserve_vectors=preserve_vectors,
                scope=scope,
                reindex=reindex,
                purge_orphan_vectors=purge_orphan_vec_embeddings,
                index_dir_path=INDEX_DIR_PATH,
                collections_dir_path=COLLECTIONS_DIR_PATH,
                is_db_malformed_result=_is_db_malformed_result,
                emit_status=lambda phase, level, message: _emit_maintenance_status(
                    phase,
                    level,
                    message,
                    operation="reset_index",
                ),
                sanitize_message=sanitize_error_message,
            )
            if not clear_res.ok:
                _emit_maintenance_status("failed", "error", clear_res.error or "Index reset failed", operation="reset_index")
                return _json_response(clear_res)
            clear_data = clear_res.data
            cleared = clear_data.cleared if clear_data else {}
            vectors_purged = clear_data.vectors_purged if clear_data else None

            scan_details: list[dict[str, Any]] = []
            totals = {key: 0 for key in ("scanned", "added", "updated", "skipped", "errors")}
            if reindex:
                _emit_maintenance_status("restarting_scan", "info", operation="reset_index")
                reindex_res = await run_reset_reindex(
                    index_service=svc["index"],
                    targets=target_roots,
                    incremental=incremental,
                    fast=fast,
                    background_metadata=background_metadata,
                    reset_scan_timeout_s=reset_scan_timeout_s,
                    wait_for_with_cleanup=_wait_for_with_cleanup,
                    format_scan_error=sanitize_error_message,
                )
                if not reindex_res.ok:
                    _emit_maintenance_status("failed", "error", reindex_res.error or "Index reset scan failed", operation="reset_index")
                    return _json_response(reindex_res)
                reindex_data = reindex_res.data or {}
                scan_details = list(reindex_data.get("details") or [])
                totals = dict(reindex_data.get("totals") or totals)

            scan_summary = build_reset_scan_summary(
                scope=scope,
                reindex=reindex,
                details=scan_details,
                totals=totals,
            )

            rebuild_status = None
            if rebuild_fts_flag:
                try:
                    async with db.atransaction(mode="immediate") as tx:
                        if not tx.ok:
                            return _json_response(Result.Err("DB_ERROR", tx.error or "Failed to begin transaction"))
                        rebuild_result = await rebuild_fts(db)
                    if not tx.ok:
                        return _json_response(Result.Err("DB_ERROR", tx.error or "Commit failed"))
                except Exception as exc:
                    logger.error("FTS rebuild failed during index reset", exc_info=True)
                    _emit_maintenance_status("failed", "error", sanitize_error_message(exc, "FTS rebuild failed"), operation="reset_index")
                    return _json_response(
                        Result.Err("DB_ERROR", sanitize_error_message(exc, "FTS rebuild failed"))
                    )
                if not rebuild_result.ok:
                    _emit_maintenance_status("failed", "error", rebuild_result.error or "FTS rebuild failed", operation="reset_index")
                    return _json_response(rebuild_result)
                rebuild_status = True

            # Invalidate vector searcher cache after clearing assets/embeddings.
            _invalidate_vector_searcher(svc)

            _emit_maintenance_status("done", "success", operation="reset_index")
            return _json_response(
                Result.Ok(
                    {
                        "cleared": cleared,
                        "preserve_vectors": bool(preserve_vectors),
                        "vectors_purged": vectors_purged,
                        "scan_summary": scan_summary,
                        "rebuild_fts": rebuild_status,
                    }
                )
            )
        finally:
            try:
                await _restart_watcher_if_needed(svc, watcher_was_running)
            except Exception:
                pass
            set_db_maintenance_active(False)

    register_staging_routes(routes, deps=globals())
    register_upload_routes(routes, deps=globals())
    register_watcher_routes(routes, deps=globals())
