"""
Directory scanning and file indexing endpoints.
"""
import asyncio
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

from mjr_am_backend.adapters.db.schema import rebuild_fts
from mjr_am_backend.config import (
    COLLECTIONS_DIR_PATH,
    INDEX_DIR_PATH,
    TO_THREAD_TIMEOUT_S,
)
from mjr_am_backend.custom_roots import resolve_custom_root
from mjr_am_backend.features.index.metadata_helpers import MetadataHelpers
from mjr_am_backend.shared import Result, get_logger, sanitize_error_message
from mjr_am_backend.utils import parse_bool

from ..core import (
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
from .db_maintenance import is_db_maintenance_active
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

# These module-level names are kept here so test monkeypatching on `scan_mod`
# (i.e. `scan_mod._LAST_CONSISTENCY_CHECK = 0.0`, `scan_mod.time.time`) works.
_LAST_CONSISTENCY_CHECK = 0.0
_CONSISTENCY_LOCK = asyncio.Lock()


async def _maybe_schedule_consistency_check(db) -> None:
    """Schedule a consistency check if the cooldown period has elapsed."""
    global _LAST_CONSISTENCY_CHECK
    if not db:
        return
    now = time.time()
    async with _CONSISTENCY_LOCK:
        if (now - _LAST_CONSISTENCY_CHECK) < _DB_CONSISTENCY_COOLDOWN_SECONDS:
            return
        _LAST_CONSISTENCY_CHECK = now
    try:
        asyncio.create_task(_run_consistency_check(db))
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
        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)
        if is_db_maintenance_active():
            return _json_response(Result.Err("DB_MAINTENANCE", "Database maintenance in progress. Please wait."))

        csrf = _csrf_error(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))
        auth = _require_write_access(request)
        if not auth.ok:
            return _json_response(auth)

        allowed, retry_after = _check_rate_limit(request, "scan", max_requests=3, window_seconds=60)
        if not allowed:
            return _json_response(Result.Err("RATE_LIMITED", "Too many scan requests. Please wait before retrying.", retry_after=retry_after))

        body_res = await _read_json(request)
        if not body_res.ok:
            return _json_response(body_res)
        body = body_res.data or {}

        scope = (body.get("scope") or "").lower().strip()
        custom_root_id = body.get("custom_root_id") or body.get("root_id") or body.get("customRootId")
        output_root = await _runtime_output_root(svc)

        # Use ComfyUI output directory if not specified (backwards-compatible)
        directory = body.get("directory", output_root)
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
                # Run both output and input scans sequentially.
                recursive = body.get("recursive", True)
                incremental = body.get("incremental", True)
                fast = bool(body.get("fast") or body.get("mode") == "fast" or body.get("manifest_only") is True)
                background_metadata = bool(body.get("background_metadata") or body.get("enrich_metadata") or body.get("enqueue_metadata"))
                try:
                    # [OPTIMIZATION] Parallel Scan (Output + Input)
                    # Use gather instead of sequential await
                    out_coro = svc['index'].scan_directory(
                        str(Path(output_root).resolve()),
                        recursive,
                        incremental,
                        "output",
                        None,
                        fast,
                        background_metadata,
                    )
                    in_coro = svc['index'].scan_directory(
                        str(Path(folder_paths.get_input_directory()).resolve()),
                        recursive,
                        incremental,
                        "input",
                        None,
                        fast,
                        background_metadata,
                    )

                    results = await asyncio.wait_for(
                        asyncio.gather(out_coro, in_coro, return_exceptions=True),
                        timeout=TO_THREAD_TIMEOUT_S
                    )

                    out_res = results[0]
                    in_res = results[1]

                    # Handle exceptions if any (never raise to UI).
                    if isinstance(out_res, Exception):
                        logger.error("Output scan failed: %s", out_res)
                        return _json_response(Result.Err("SCAN_FAILED", safe_error_message(out_res, "Output scan failed")))
                    if isinstance(in_res, Exception):
                        logger.error("Input scan failed: %s", in_res)
                        return _json_response(Result.Err("SCAN_FAILED", safe_error_message(in_res, "Input scan failed")))

                except asyncio.TimeoutError:
                    return _json_response(Result.Err("TIMEOUT", "Scan timed out"))
                if not out_res.ok:
                    return _json_response(out_res)
                if not in_res.ok:
                    return _json_response(in_res)
                out_stats = out_res.data or {}
                in_stats = in_res.data or {}
                merged = {
                    "scanned": out_stats.get("scanned", 0) + in_stats.get("scanned", 0),
                    "added": out_stats.get("added", 0) + in_stats.get("added", 0),
                    "updated": out_stats.get("updated", 0) + in_stats.get("updated", 0),
                    "skipped": out_stats.get("skipped", 0) + in_stats.get("skipped", 0),
                    "errors": out_stats.get("errors", 0) + in_stats.get("errors", 0),
                    "start_time": out_stats.get("start_time") or in_stats.get("start_time"),
                    "end_time": in_stats.get("end_time") or out_stats.get("end_time"),
                    "scope": "all",
                }
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

        recursive = body.get("recursive", True)
        incremental = body.get("incremental", True)
        fast = bool(body.get("fast") or body.get("mode") == "fast" or body.get("manifest_only") is True)
        background_metadata = bool(body.get("background_metadata") or body.get("enrich_metadata") or body.get("enqueue_metadata"))

        try:
            try:
                result = await asyncio.wait_for(
                    svc['index'].scan_directory(
                        str(normalized_dir),
                        recursive,
                        incremental,
                        scan_source,
                        scan_root_id,
                        fast,
                        background_metadata,
                    ),
                    timeout=TO_THREAD_TIMEOUT_S,
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
        if is_db_maintenance_active():
            return _json_response(Result.Err("DB_MAINTENANCE", "Database maintenance in progress. Please wait."))

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
        if not isinstance(files, list) or not files:
            result = Result.Err("INVALID_INPUT", "Missing or invalid 'files' list")
            return _json_response(result)

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
                    result = await asyncio.wait_for(
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

            stats = result.data or {}
            if not total_stats["start_time"]:
                total_stats["start_time"] = str(stats.get("start_time") or "")
            total_stats["end_time"] = str(stats.get("end_time") or total_stats["end_time"] or "")
            total_stats["scanned"] += stats.get("scanned", 0)
            total_stats["added"] += stats.get("added", 0)
            total_stats["updated"] += stats.get("updated", 0)
            total_stats["skipped"] += stats.get("skipped", 0)
            total_stats["errors"] += stats.get("errors", 0)

        # POST-PROCESSING: Enhance metadata with frontend-provided info (e.g. generation_time_ms)
        # We process this via a temporary table batch update to avoid N+1 queries.
        _enhancement_map: dict[str, dict[str, Any]] = {}

        insert_params = []
        for item in files:
            gen_time = item.get("generation_time_ms") or item.get("duration_ms")
            if gen_time and isinstance(gen_time, (int, float)) and gen_time > 0:
                fname = item.get("filename")
                if not fname:
                    continue
                s_name = item.get("subfolder") or ""
                s_src = (item.get("type") or "output").lower()

                # Check duplication in params list
                # (Simple dedupe by tuple key)
                key = (fname, str(s_name), s_src)
                if key not in _enhancement_map:
                    _enhancement_map[key] = True
                    insert_params.append((str(fname), str(s_name), s_src, int(gen_time)))

        if insert_params:
            try:
                db_adapter = svc['db']

                async with db_adapter.atransaction() as tx:
                    if not tx.ok:
                        raise RuntimeError(tx.error or "Failed to begin transaction")
                    # A. Create Temp Table for Batch Processing
                    await db_adapter.aexecute("CREATE TEMPORARY TABLE IF NOT EXISTS temp_gen_updates (filename TEXT, subfolder TEXT, source TEXT, gen_time INTEGER)")
                    await db_adapter.aexecute("DELETE FROM temp_gen_updates")

                    # B. Bulk Insert
                    await db_adapter.aexecutemany("INSERT INTO temp_gen_updates (filename, subfolder, source, gen_time) VALUES (?, ?, ?, ?)", insert_params)

                    # C. Fetch joined data in ONE query
                    q_res = await db_adapter.aquery("""
                        SELECT a.id, am.metadata_raw, t.gen_time
                        FROM temp_gen_updates t
                        JOIN assets a ON a.filename = t.filename AND a.subfolder = t.subfolder AND a.source = t.source
                        LEFT JOIN asset_metadata am ON a.id = am.asset_id
                    """)

                    if q_res.ok and q_res.data:
                        import json
                        upsert_params = []

                        for row in q_res.data:
                            asset_id = row["id"]
                            raw = row["metadata_raw"]
                            new_time = row["gen_time"]

                            current_meta = {}
                            if raw:
                                try:
                                    current_meta = json.loads(raw)
                                except (json.JSONDecodeError, TypeError, ValueError):
                                    pass

                            # Merge updates
                            current_meta["generation_time_ms"] = new_time
                            new_json = json.dumps(current_meta, ensure_ascii=False)

                            upsert_params.append((asset_id, new_json))

                        # D. Bulk Upsert (INSERT or UPDATE)
                        # Prefer per-asset locked writes using MetadataHelpers to avoid races
                        # with other concurrent metadata writers (background enrichers, manual edits).
                        if upsert_params:
                            try:
                                for asset_id, new_json in upsert_params:
                                    try:
                                        async with db_adapter.lock_for_asset(int(asset_id)):
                                            cur = await db_adapter.aquery("SELECT metadata_raw FROM asset_metadata WHERE asset_id = ? LIMIT 1", (int(asset_id),))
                                            cur_meta = {}
                                            if cur.ok and cur.data and cur.data[0].get("metadata_raw"):
                                                try:
                                                    cur_meta = json.loads(cur.data[0].get("metadata_raw") or "{}")
                                                except Exception:
                                                    cur_meta = {}

                                            incoming_meta = {}
                                            try:
                                                incoming_meta = json.loads(new_json) if new_json else {}
                                            except Exception:
                                                incoming_meta = {}

                                            merged = dict(cur_meta)
                                            merged.update(incoming_meta)

                                            await MetadataHelpers.write_asset_metadata_row(db_adapter, int(asset_id), Result.Ok(merged))
                                    except Exception:
                                        logger.debug("Failed to upsert generation time for asset %s", asset_id)
                            except Exception:
                                try:
                                    await db_adapter.aexecutemany("""
                                        INSERT INTO asset_metadata (asset_id, metadata_raw)
                                        SELECT ?, ?
                                        WHERE EXISTS (SELECT 1 FROM assets WHERE id = ?)
                                        ON CONFLICT(asset_id) DO UPDATE SET
                                            metadata_raw = excluded.metadata_raw
                                        WHERE EXISTS (SELECT 1 FROM assets WHERE id = excluded.asset_id)
                                    """, [(asset_id, new_json, asset_id) for asset_id, new_json in upsert_params])
                                except Exception:
                                    logger.debug("Fallback SQL bulk upsert failed")

                    # Cleanup
                    await db_adapter.aexecute("DROP TABLE IF EXISTS temp_gen_updates")
                if not tx.ok:
                    raise RuntimeError(tx.error or "Commit failed")

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

        def _bool_option(keys, default):
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

        reindex = _bool_option(("reindex",), True)
        clear_scan_journal = _bool_option(("clear_scan_journal", "clearScanJournal"), True)
        clear_metadata_cache = _bool_option(("clear_metadata_cache", "clearMetadataCache"), True)
        clear_asset_metadata = _bool_option(("clear_asset_metadata", "clearAssetMetadata"), True)
        clear_assets_table = _bool_option(("clear_assets", "clearAssets"), True)
        rebuild_fts_flag = _bool_option(("rebuild_fts", "rebuildFts"), True)
        incremental = _bool_option(("incremental",), False)
        fast = _bool_option(("fast",), True)
        background_metadata = _bool_option(("background_metadata", "backgroundMetadata"), True)

        # Hard reset deletes and recreates the SQLite DB files (assets.sqlite, -wal, -shm).
        # This matches the "Reset Index Now" maintenance intent.
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

        output_root = await _runtime_output_root(svc)
        target_roots: list[dict[str, str | None]] = []
        try:
            if scope in ("output", "outputs"):
                target_roots.append({"source": "output", "path": str(Path(output_root).resolve(strict=False)), "root_id": None})
            elif scope in ("input", "inputs"):
                target_roots.append(
                    {
                        "source": "input",
                        "path": str(Path(folder_paths.get_input_directory()).resolve(strict=False)),
                        "root_id": None,
                    }
                )
            elif scope == "all":
                target_roots.append({"source": "output", "path": str(Path(output_root).resolve(strict=False)), "root_id": None})
                target_roots.append(
                    {
                        "source": "input",
                        "path": str(Path(folder_paths.get_input_directory()).resolve(strict=False)),
                        "root_id": None,
                    }
                )
            elif scope == "custom":
                if not custom_root_id:
                    return _json_response(Result.Err("INVALID_INPUT", "Missing custom_root_id for custom scope"))
                root_result = resolve_custom_root(custom_root_id)
                if not root_result.ok:
                    return _json_response(root_result)
                resolved = str(root_result.data)
                target_roots.append({"source": "custom", "path": resolved, "root_id": custom_root_id})
            else:
                return _json_response(Result.Err("INVALID_INPUT", f"Unknown scope: {scope}"))
        except Exception as exc:
            logger.debug("Failed to resolve reset index roots: %s", exc)
            return _json_response(Result.Err("INVALID_INPUT", "Unable to resolve reset scope"))

        db = svc.get("db")
        if not db:
            _emit_maintenance_status("failed", "error", "Database service unavailable", operation="reset_index")
            return _json_response(Result.Err("SERVICE_UNAVAILABLE", "Database service unavailable"))

        # Best-effort coordination with concurrent scans.
        # Do NOT hold the scan lock while invoking scan_directory() (it also uses the same lock).
        scan_lock = None
        try:
            index_svc = svc.get("index")
            scan_lock = getattr(index_svc, "_scan_lock", None)
            _emit_maintenance_status("stopping_workers", "info", operation="reset_index")
            if index_svc and hasattr(index_svc, "stop_enrichment"):
                try:
                    await index_svc.stop_enrichment(clear_queue=True)
                except Exception:
                    pass
        except Exception:
            scan_lock = None

        cache_prefixes: list[str] | None = None if scope == "all" else [entry["path"] for entry in target_roots]

        # If the caller is effectively requesting a full wipe (the usual UI path),
        # treat it as a hard reset by default when scope=all.
        implied_full_clear = bool(clear_scan_journal and clear_metadata_cache and clear_asset_metadata and clear_assets_table)
        should_hard_reset_db = bool(scope == "all" and (hard_reset_db or implied_full_clear))

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
                for target in target_roots:
                    try:
                        result = await asyncio.wait_for(
                            svc['index'].scan_directory(
                                target["path"],
                                True,
                                incremental,
                                target["source"],
                                target.get("root_id"),
                                fast,
                                background_metadata,
                            ),
                            timeout=TO_THREAD_TIMEOUT_S,
                        )
                    except asyncio.TimeoutError:
                        _emit_maintenance_status("failed", "error", "Index reset scan timed out", operation="reset_index")
                        return _json_response(Result.Err("TIMEOUT", "Index reset scan timed out"))
                    except Exception as exc:
                        logger.error("Index reset scan failed", exc_info=True)
                        _emit_maintenance_status("failed", "error", sanitize_error_message(exc, "Index reset scan failed"), operation="reset_index")
                        return _json_response(
                            Result.Err(
                                "RESET_FAILED",
                                sanitize_error_message(exc, "Index reset scan failed"),
                            )
                        )

                    if not result.ok:
                        _emit_maintenance_status("failed", "error", result.error or "Index reset scan failed", operation="reset_index")
                        return _json_response(result)

                    stats = result.data or {}
                    counts = {key: int(stats.get(key) or 0) for key in totals}
                    for key in totals:
                        totals[key] += counts[key]
                    scan_details.append(
                        {
                            "source": target["source"],
                            "root_id": target.get("root_id"),
                            **counts,
                        }
                    )

            scan_summary = {
                "scope": scope,
                "reindex": bool(reindex),
                "details": scan_details,
                **totals,
            }

            # No need to VACUUM or rebuild FTS here: db.areset() reinitializes schema + indexes.
            _emit_maintenance_status("done", "success", operation="reset_index")
            return _json_response(Result.Ok({"cleared": cleared, "scan_summary": scan_summary, "rebuild_fts": None}))

        async def _clear_table(table: str, prefixes: list[str] | None) -> Result[int]:
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
            # Deleting from assets cascades to asset_metadata/scan_journal/metadata_cache.
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

        cleared = {"scan_journal": 0, "metadata_cache": 0, "asset_metadata": 0, "assets": 0}

        async def _do_clears() -> Result[dict]:
            # Make clears atomic and resistant to concurrent writers.
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

                # IMPORTANT: scope-aware clears.
                # Previous implementation cleared the entire tables, even for output/custom scope.
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
            _emit_maintenance_status("resetting_db", "info", operation="reset_index")
            if scan_lock is not None and hasattr(scan_lock, "__aenter__"):
                async with scan_lock:
                    res = await _do_clears()
            else:
                res = await _do_clears()
        except Exception as exc:
            logger.error("Index reset clear phase failed", exc_info=True)
            _emit_maintenance_status("failed", "error", sanitize_error_message(exc, "Index reset failed during clear phase"), operation="reset_index")
            return _json_response(
                Result.Err(
                    "RESET_FAILED",
                    sanitize_error_message(exc, "Index reset failed during clear phase"),
                )
            )

        if not res.ok:
            # Fallback: if scoped clear hits a malformed DB, escalate to hard adapter reset.
            if _is_db_malformed_result(res):
                try:
                    if scan_lock is not None and hasattr(scan_lock, "__aenter__"):
                        async with scan_lock:
                            reset_res = await db.areset()
                    else:
                        reset_res = await db.areset()
                except Exception as exc:
                    logger.error("Fallback hard reset after malformed DB failed", exc_info=True)
                    _emit_maintenance_status("failed", "error", sanitize_error_message(exc, "Malformed DB and fallback hard reset failed"), operation="reset_index")
                    return _json_response(
                        Result.Err(
                            "RESET_FAILED",
                            sanitize_error_message(exc, "Malformed DB and fallback hard reset failed"),
                        )
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
                    "fallback_reason": "malformed_db",
                    "file_ops": (reset_res.meta or {}),
                }
                # Continue with optional reindex path below.
            else:
                _emit_maintenance_status("failed", "error", res.error or "Index reset failed", operation="reset_index")
                return _json_response(res)

        # FULL RESET CLEANUP: VACUUM and Physical Files
        if scope == "all" and (clear_scan_journal or clear_metadata_cache):
            # 1. Vacuum DB to reclaim space and rebuild file
            try:
                await db.avacuum()
                logger.info("Database VACUUM completed during index reset")
            except Exception as exc:
                logger.warning(f"Failed to VACUUM database: {exc}")

            # 2. Cleanup physical stray files in index directory
            # Verify we are cleaning the right folder and safeguard critical files
            if reindex and INDEX_DIR_PATH.exists():
                def _cleanup_index_dir():
                    for item in INDEX_DIR_PATH.iterdir():
                        if item.name.startswith("assets.sqlite"):
                            continue
                        if item == COLLECTIONS_DIR_PATH:
                            continue
                        # Preserve user configuration/state stored in the index directory.
                        if item.name == "custom_roots.json":
                            continue

                        try:
                            if item.is_dir():
                                shutil.rmtree(item)
                            else:
                                item.unlink()
                            logger.info(f"Deleted stray index item: {item.name}")
                        except Exception as e:
                            logger.warning(f"Failed to delete {item.name}: {e}")

                try:
                    await asyncio.to_thread(_cleanup_index_dir)
                except Exception as exc:
                    logger.warning(f"Index directory cleanup failed: {exc}")

        scan_details: list[dict[str, Any]] = []
        totals = {key: 0 for key in ("scanned", "added", "updated", "skipped", "errors")}
        if reindex:
            _emit_maintenance_status("restarting_scan", "info", operation="reset_index")
            for target in target_roots:
                try:
                    result = await asyncio.wait_for(
                        svc['index'].scan_directory(
                            target["path"],
                            True,
                            incremental,
                            target["source"],
                            target.get("root_id"),
                            fast,
                            background_metadata,
                        ),
                        timeout=TO_THREAD_TIMEOUT_S,
                    )
                except asyncio.TimeoutError:
                    _emit_maintenance_status("failed", "error", "Index reset scan timed out", operation="reset_index")
                    return _json_response(Result.Err("TIMEOUT", "Index reset scan timed out"))
                except Exception as exc:
                    logger.error("Index reset scan failed", exc_info=True)
                    _emit_maintenance_status("failed", "error", sanitize_error_message(exc, "Index reset scan failed"), operation="reset_index")
                    return _json_response(
                        Result.Err(
                            "RESET_FAILED",
                            sanitize_error_message(exc, "Index reset scan failed"),
                        )
                    )

                if not result.ok:
                    _emit_maintenance_status("failed", "error", result.error or "Index reset scan failed", operation="reset_index")
                    return _json_response(result)

                stats = result.data or {}
                counts = {key: int(stats.get(key) or 0) for key in totals}
                for key in totals:
                    totals[key] += counts[key]
                scan_details.append(
                    {
                        "source": target["source"],
                        "root_id": target.get("root_id"),
                        **counts,
                    }
                )

        scan_summary = {
            "scope": scope,
            "reindex": bool(reindex),
            "details": scan_details,
            **totals,
        }

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

        _emit_maintenance_status("done", "success", operation="reset_index")
        return _json_response(
            Result.Ok(
                {
                    "cleared": cleared,
                    "scan_summary": scan_summary,
                    "rebuild_fts": rebuild_status,
                }
            )
        )

    register_staging_routes(routes, deps=globals())
    register_upload_routes(routes, deps=globals())
    register_watcher_routes(routes, deps=globals())
