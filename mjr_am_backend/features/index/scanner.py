"""
Index scanner - handles directory scanning and file indexing operations.
"""
import asyncio
import sqlite3
import threading
from typing import Any

from ...adapters.db.sqlite import Sqlite
from ...config import MAX_TO_ENRICH_ITEMS
from ...shared import get_logger, log_structured
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
        self._index_lock = index_lock or scan_lock
        self._current_scan_id: str | None = None
        self._max_to_enrich_items = int(MAX_TO_ENRICH_ITEMS)
        self._batch_fallback_count = 0
        self._batch_fallback_lock = threading.Lock()
        self._fs_walker = FileSystemWalker(scan_iops_limit=max(0.0, float(SCAN_IOPS_LIMIT)))

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
        log_structured(logger, level, message, **self._scan_context(**context))

    _write_metadata_row = write_metadata_row
