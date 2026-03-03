"""
Index scanner - handles directory scanning and file indexing operations.
"""
import asyncio
import json
import sqlite3
import threading
from typing import Any

from ...adapters.db.sqlite import Sqlite
from ...config import MAX_TO_ENRICH_ITEMS
from ...shared import get_logger
from ..metadata import MetadataService
from .fs_walker import SCAN_IOPS_LIMIT, FileSystemWalker
from .index_batching import append_batch_metadata_entries, existing_map_for_batch, journal_map_for_batch, prefetch_batch_cache_and_rich_meta, prefetch_metadata_cache_rows, prefetch_rich_metadata_rows, prepare_batch_entries, prepare_single_batch_entry, resolve_existing_state_for_batch
from .index_persistence import apply_add_entry, apply_update_entry, persist_prepared_entries, persist_prepared_entries_fallback, persist_prepared_entries_tx, process_added_entry, process_prepared_entry_fallback, process_prepared_entry_tx, process_refresh_entry, process_updated_entry, write_entry_scan_journal
from .index_file_ops import build_index_file_state, extract_metadata_for_index_file, get_journal_state_hash_for_index_file, index_file, insert_new_asset_for_index_file, insert_new_asset_tx, refresh_from_cached_metadata, refresh_from_cached_metadata_tx, resolve_existing_asset_for_index_file, resolve_index_file_path, run_incremental_metadata_refresh_locked, run_incremental_metadata_refresh_tx, try_cached_incremental_refresh, try_incremental_refresh_with_metadata, try_skip_by_journal
from .scan_orchestrator import filter_indexable_paths, index_paths, log_index_paths_start, scan_directory, validate_scan_directory
from .scan_storage_ops import asset_has_rich_metadata, get_journal_entries, get_journal_entry, stat_with_retry, write_metadata_row, write_scan_journal_entry
from .index_prepare_ops import maybe_skip_prepare_for_incremental, prepare_index_entry, prepare_index_entry_context, prepare_metadata_for_entry, refresh_entry_from_cached_metadata, should_skip_by_journal_state
from .index_db_ops import add_asset, update_asset, write_asset_metadata_if_needed
from .scan_diagnostics import batch_error_messages, diagnose_batch_failure, diagnose_unique_filepath_error, is_unique_filepath_error
from .index_runtime_helpers import append_to_enrich, entry_state_drifted, maybe_store_entry_cache, record_index_entry_success, record_refresh_outcome

logger = get_logger(__name__)
_VECTOR_INDEX_PER_ASSET_TIMEOUT_S = 180.0


def _is_fatal_db_error(exc: Exception) -> bool:
    if not isinstance(exc, sqlite3.DatabaseError):
        return False
    if "busy" in str(exc).lower() or "locked" in str(exc).lower():
        return False
    return True


class IndexScanner:
    def __init__(
        self,
        db: Sqlite,
        metadata_service: MetadataService,
        scan_lock: asyncio.Lock,
        index_lock: asyncio.Lock | None = None,
    ):
        self.db = db
        self.metadata = metadata_service
        self._scan_lock = scan_lock
        # NOTE (NL-5): when index_lock is None (the typical call from IndexService),
        # _index_lock aliases _scan_lock — so scan_directory and index_paths serialize
        # through the same lock.  This is intentional: it prevents concurrent DB writes
        # during a full scan.  If a separate index_lock is ever passed, the two operations
        # can run concurrently.
        self._index_lock = index_lock or scan_lock
        self._current_scan_id: str | None = None
        self._max_to_enrich_items = int(MAX_TO_ENRICH_ITEMS)
        self._batch_fallback_count = 0
        self._batch_fallback_lock = threading.Lock()
        self._fs_walker = FileSystemWalker(scan_iops_limit=max(0.0, float(SCAN_IOPS_LIMIT)))
        self._vector_service: Any | None = None
        self._vector_searcher: Any | None = None
        self._vector_index_lock = asyncio.Lock()
        self._vector_index_tasks: set[asyncio.Task[Any]] = set()

    _diagnose_batch_failure = diagnose_batch_failure

    _batch_error_messages = staticmethod(batch_error_messages)
    _is_unique_filepath_error = staticmethod(is_unique_filepath_error)
    _diagnose_unique_filepath_error = staticmethod(diagnose_unique_filepath_error)
    scan_directory = scan_directory

    _existing_map_for_filepaths = existing_map_for_batch
    index_paths = index_paths

    _filter_indexable_paths = staticmethod(filter_indexable_paths)
    _log_index_paths_start = log_index_paths_start
    _validate_scan_directory = staticmethod(validate_scan_directory)

    _journal_map_for_batch = journal_map_for_batch
    _existing_map_for_batch = existing_map_for_batch
    _prefetch_batch_cache_and_rich_meta = prefetch_batch_cache_and_rich_meta
    _prefetch_metadata_cache_rows = prefetch_metadata_cache_rows
    _prefetch_rich_metadata_rows = prefetch_rich_metadata_rows
    _prepare_batch_entries = prepare_batch_entries

    _prepare_single_batch_entry = prepare_single_batch_entry
    _resolve_existing_state_for_batch = resolve_existing_state_for_batch
    _append_batch_metadata_entries = append_batch_metadata_entries

    async def _persist_prepared_entries(
        self,
        prepared: list[dict[str, Any]],
        base_dir: str,
        source: str,
        root_id: str | None,
        stats: dict[str, Any],
        to_enrich: list[str] | None,
        added_ids: list[int] | None,
    ) -> None:
        prev_added_count = len(added_ids) if isinstance(added_ids, list) else 0
        await persist_prepared_entries(
            self,
            prepared=prepared,
            base_dir=base_dir,
            source=source,
            root_id=root_id,
            stats=stats,
            to_enrich=to_enrich,
            added_ids=added_ids,
            is_fatal_db_error=_is_fatal_db_error,
        )
        self._schedule_added_image_vector_index(prev_added_count=prev_added_count, added_ids=added_ids)

    def set_vector_services(self, vector_service: Any, vector_searcher: Any | None = None) -> None:
        self._vector_service = vector_service
        self._vector_searcher = vector_searcher

    def _schedule_added_image_vector_index(self, *, prev_added_count: int, added_ids: list[int] | None) -> None:
        if self._vector_service is None or not isinstance(added_ids, list) or len(added_ids) <= prev_added_count:
            return

        new_ids: list[int] = []
        for aid in added_ids[prev_added_count:]:
            try:
                parsed_id = int(aid)
            except Exception:
                continue
            if parsed_id > 0:
                new_ids.append(parsed_id)
        if not new_ids:
            return

        try:
            task = asyncio.create_task(self._index_added_image_vectors(asset_ids=new_ids))
            self._vector_index_tasks.add(task)
            task.add_done_callback(self._vector_index_tasks.discard)
        except Exception as exc:
            logger.debug("Scanner vector indexing scheduling failed: %s", exc)

    async def _index_added_image_vectors(self, *, asset_ids: list[int]) -> None:
        if self._vector_service is None or not isinstance(asset_ids, list) or not asset_ids:
            return

        try:
            async with self._vector_index_lock:
                rows = await self.db.aquery_in(
                    """
                    SELECT a.id, a.filepath, a.kind, m.metadata_raw
                    FROM assets a
                    LEFT JOIN asset_metadata m ON a.id = m.asset_id
                    WHERE a.kind = 'image' AND {IN_CLAUSE}
                    """,
                    "a.id",
                    asset_ids,
                )
                if not rows.ok or not rows.data:
                    return

                entries: list[dict[str, Any]] = []
                for row in rows.data:
                    raw = row.get("metadata_raw")
                    metadata_raw: dict[str, Any] | None = None
                    if isinstance(raw, dict):
                        metadata_raw = raw
                    elif isinstance(raw, str) and raw.strip():
                        try:
                            parsed = json.loads(raw)
                            metadata_raw = parsed if isinstance(parsed, dict) else None
                        except Exception:
                            metadata_raw = None
                    entries.append(
                        {
                            "asset_id": int(row["id"]),
                            "filepath": str(row["filepath"]),
                            "kind": "image",
                            "metadata_raw": metadata_raw,
                        }
                    )

                if not entries:
                    return

                from .vector_indexer import index_asset_vector

                indexed = 0
                skipped = 0
                errors = 0
                timed_out = 0
                timed_out_ids: list[int] = []

                for entry in entries:
                    aid = int(entry.get("asset_id") or 0)
                    try:
                        filepath = str(entry.get("filepath") or "")
                        if not filepath:
                            skipped += 1
                            continue
                        result = await asyncio.wait_for(
                            index_asset_vector(
                                self.db,
                                self._vector_service,
                                asset_id=aid,
                                filepath=filepath,
                                kind=str(entry.get("kind") or "image"),
                                metadata_raw=entry.get("metadata_raw"),
                            ),
                            timeout=_VECTOR_INDEX_PER_ASSET_TIMEOUT_S,
                        )
                    except asyncio.TimeoutError:
                        timed_out += 1
                        if aid > 0:
                            timed_out_ids.append(aid)
                        continue
                    except Exception as exc:
                        errors += 1
                        logger.debug("Scanner vector indexing failed for asset_id=%s: %s", aid, exc)
                        continue

                    if result.ok and bool(result.data):
                        indexed += 1
                    elif result.ok:
                        skipped += 1
                    else:
                        errors += 1

                if self._vector_searcher is not None and indexed > 0:
                    self._vector_searcher.invalidate()

                if timed_out > 0:
                    sample = ", ".join(str(x) for x in timed_out_ids[:8]) or "n/a"
                    logger.warning(
                        "Scanner vector indexing timed out for %d/%d new images "
                        "(indexed=%d skipped=%d errors=%d timeout_per_asset=%.0fs sample_asset_ids=%s)",
                        timed_out,
                        len(entries),
                        indexed,
                        skipped,
                        errors,
                        _VECTOR_INDEX_PER_ASSET_TIMEOUT_S,
                        sample,
                    )
                elif errors > 0:
                    logger.warning(
                        "Scanner vector indexing completed with errors for %d new images "
                        "(indexed=%d skipped=%d errors=%d)",
                        len(entries),
                        indexed,
                        skipped,
                        errors,
                    )
                else:
                    logger.debug(
                        "Scanner vector indexing complete for %d new images "
                        "(indexed=%d skipped=%d)",
                        len(entries),
                        indexed,
                        skipped,
                    )
        except Exception as exc:
            logger.debug("Scanner vector indexing failed for new images: %s", exc)

    _persist_prepared_entries_tx = persist_prepared_entries_tx
    _process_prepared_entry_tx = process_prepared_entry_tx
    _persist_prepared_entries_fallback = persist_prepared_entries_fallback
    _process_prepared_entry_fallback = process_prepared_entry_fallback
    _process_refresh_entry = process_refresh_entry

    _record_refresh_outcome = record_refresh_outcome

    _process_updated_entry = process_updated_entry
    _process_added_entry = process_added_entry

    _maybe_store_entry_cache = maybe_store_entry_cache

    _apply_update_entry = apply_update_entry
    _apply_add_entry = apply_add_entry
    _write_entry_scan_journal = write_entry_scan_journal

    _record_index_entry_success = record_index_entry_success
    _entry_state_drifted = entry_state_drifted
    _append_to_enrich = append_to_enrich

    _prepare_metadata_for_entry = prepare_metadata_for_entry
    _prepare_index_entry = prepare_index_entry
    _prepare_index_entry_context = prepare_index_entry_context
    _maybe_skip_prepare_for_incremental = maybe_skip_prepare_for_incremental
    _should_skip_by_journal_state = should_skip_by_journal_state
    _refresh_entry_from_cached_metadata = refresh_entry_from_cached_metadata

    def get_runtime_status(self) -> dict[str, Any]:
        try:
            with self._batch_fallback_lock:
                fallback_count = int(self._batch_fallback_count)
        except Exception:
            fallback_count = 0
        return {
            "batch_fallbacks_total": fallback_count,
            "scan_iops_limit": float(self._fs_walker._scan_iops_limit),
        }

    _get_journal_entry = get_journal_entry
    _get_journal_entries = get_journal_entries
    _write_scan_journal_entry = write_scan_journal_entry
    _stat_with_retry = stat_with_retry
    _asset_has_rich_metadata = asset_has_rich_metadata

    _index_file = index_file
    _build_index_file_state = build_index_file_state
    _resolve_index_file_path = staticmethod(resolve_index_file_path)
    _try_skip_by_journal = try_skip_by_journal
    _get_journal_state_hash_for_index_file = get_journal_state_hash_for_index_file
    _resolve_existing_asset_for_index_file = resolve_existing_asset_for_index_file
    _try_cached_incremental_refresh = try_cached_incremental_refresh
    _refresh_from_cached_metadata = refresh_from_cached_metadata
    _refresh_from_cached_metadata_tx = refresh_from_cached_metadata_tx
    _extract_metadata_for_index_file = extract_metadata_for_index_file
    _try_incremental_refresh_with_metadata = try_incremental_refresh_with_metadata
    _run_incremental_metadata_refresh_locked = run_incremental_metadata_refresh_locked
    _run_incremental_metadata_refresh_tx = run_incremental_metadata_refresh_tx
    _insert_new_asset_for_index_file = insert_new_asset_for_index_file
    _insert_new_asset_tx = insert_new_asset_tx

    _add_asset = add_asset
    _write_asset_metadata_if_needed = write_asset_metadata_if_needed
    _update_asset = update_asset

    def _scan_context(self, **kwargs) -> dict[str, Any]:
        context = {"scan_id": self._current_scan_id} if self._current_scan_id else {}
        context.update(kwargs)
        return context

    def _log_scan_event(self, level: int, message: str, **context):
        full_context = self._scan_context(**context)
        parts = [f"{k}={v}" for k, v in full_context.items()]
        logger.log(level, "%s | %s", message, " ".join(parts))

    _write_metadata_row = write_metadata_row
