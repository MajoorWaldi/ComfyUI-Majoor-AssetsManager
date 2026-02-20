"""
Metadata enricher - handles background metadata enrichment for assets.
"""
from __future__ import annotations

import asyncio
import os
import time
from typing import Any

from ...adapters.db.sqlite import Sqlite
from ...shared import Result, get_logger
from ..metadata import MetadataService

logger = get_logger(__name__)
_DB_RESETTING_MSG = "database is resetting - connection rejected"
_DB_LOCKED_MSGS = ("database is locked", "busy")
_MAX_ENRICH_RETRIES = 5


def _is_db_resetting_error(exc: Exception) -> bool:
    try:
        return _DB_RESETTING_MSG in str(exc).lower()
    except Exception:
        return False


def _is_transient_db_error(exc: Exception) -> bool:
    try:
        msg = str(exc).lower()
    except Exception:
        return False
    if _DB_RESETTING_MSG in msg:
        return True
    return any(token in msg for token in _DB_LOCKED_MSGS)


class MetadataEnricher:
    """
    Handles background metadata enrichment for assets.

    Manages a queue of files that need metadata enrichment and processes
    them in the background using a worker thread. This is used for fast
    scans that skip metadata extraction during the initial pass.
    """

    def __init__(
        self,
        db: Sqlite,
        metadata_service: MetadataService,
        compute_state_hash_fn,
        prepare_metadata_fields_fn,
        metadata_error_payload_fn,
    ):
        """
        Initialize metadata enricher.

        Args:
            db: Database adapter instance
            metadata_service: Metadata service for extraction
            compute_state_hash_fn: Function to compute state hash
            prepare_metadata_fields_fn: Function to prepare metadata fields
            metadata_error_payload_fn: Function to create error payload
        """
        self.db = db
        self.metadata = metadata_service
        self._compute_state_hash = compute_state_hash_fn
        self._prepare_metadata_fields = prepare_metadata_fields_fn
        self._metadata_error_payload = metadata_error_payload_fn
        self._enrich_lock = asyncio.Lock()
        self._enrich_queue: list[tuple[int, str]] = []
        self._enrich_task: asyncio.Task[None] | None = None
        self._enrich_running = False
        self._retry_counts: dict[str, int] = {}
        self._pause_until_monotonic: float = 0.0
        self._scan_pause_count: int = 0
        self._status_active: bool = False

    def _emit_status(self, active: bool, **extra: Any) -> None:
        try:
            if self._status_active == bool(active):
                return
            self._status_active = bool(active)
            from ...routes.registry import PromptServer
            payload = {"active": bool(active), **extra}
            PromptServer.instance.send_sync("mjr-enrichment-status", payload)
        except Exception:
            pass

    def pause_for_interaction(self, seconds: float = 1.5) -> None:
        """
        Pause enrichment briefly during UI interactions (search/sort/list).
        """
        try:
            ttl = max(0.1, min(5.0, float(seconds)))
        except Exception:
            ttl = 1.5
        now = time.monotonic()
        self._pause_until_monotonic = max(self._pause_until_monotonic, now + ttl)

    def begin_scan_pause(self) -> None:
        """Pause enrichment while a scan is actively writing to the DB."""
        try:
            self._scan_pause_count = max(0, int(self._scan_pause_count)) + 1
        except Exception:
            self._scan_pause_count = 1

    def end_scan_pause(self) -> None:
        """Release one active scan pause token."""
        try:
            self._scan_pause_count = max(0, int(self._scan_pause_count) - 1)
        except Exception:
            self._scan_pause_count = 0

    async def start_enrichment(self, filepaths: list[str]) -> None:
        """
        Enqueue files for background metadata enrichment.

        Args:
            filepaths: List of file paths to enqueue
        """
        cleaned = self._clean_paths(filepaths)
        if not cleaned:
            return
        async with self._enrich_lock:
            self._append_queue_items(cleaned, priority=0)
            self._ensure_worker_started_locked(emit_on_running=False)

    async def enqueue(self, path: str, priority: int = 0) -> None:
        """
        Enqueue a single path with priority.
        priority 0 = normal, negative = higher priority.
        """
        fp = str(path or "").strip()
        if not fp:
            return
        async with self._enrich_lock:
            self._append_queue_items([fp], priority=priority)
            self._ensure_worker_started_locked(emit_on_running=True)

    @staticmethod
    def _clean_paths(filepaths: list[str]) -> list[str]:
        return [str(p) for p in (filepaths or []) if p]

    @staticmethod
    def _normalize_priority(priority: int) -> int:
        try:
            return int(priority)
        except Exception:
            return 0

    def _append_queue_items(self, filepaths: list[str], priority: int) -> None:
        existing = {fp for _, fp in self._enrich_queue}
        prio = self._normalize_priority(priority)
        for fp in filepaths:
            if fp in existing:
                continue
            self._enrich_queue.append((prio, fp))
            existing.add(fp)
        # Keep highest priority first (negative = higher priority).
        self._enrich_queue.sort(key=lambda item: item[0])

    def _ensure_worker_started_locked(self, emit_on_running: bool) -> None:
        running = self._enrich_running and self._enrich_task and not self._enrich_task.done()
        if running:
            if emit_on_running:
                self._emit_status(True, queued=len(self._enrich_queue))
            return
        self._emit_status(True, queued=len(self._enrich_queue))
        self._enrich_running = True
        self._enrich_task = asyncio.create_task(self._enrichment_worker())

    async def stop_enrichment(self, clear_queue: bool = True) -> None:
        """
        Stop background enrichment worker and optionally clear pending queue.
        """
        task: asyncio.Task[None] | None = None
        async with self._enrich_lock:
            task = self._enrich_task
            self._enrich_task = None
            self._enrich_running = False
            if clear_queue:
                self._enrich_queue.clear()
                self._retry_counts.clear()
        if task and not task.done():
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
            except Exception:
                pass
        self._emit_status(False, queue_left=0 if clear_queue else len(self._enrich_queue))

    async def _enrichment_worker(self) -> None:
        """Background worker that processes the enrichment queue."""
        try:
            while True:
                if self._scan_pause_count > 0:
                    await asyncio.sleep(0.25)
                    continue
                now = time.monotonic()
                if self._pause_until_monotonic > now:
                    await asyncio.sleep(min(0.25, self._pause_until_monotonic - now))
                    continue
                async with self._enrich_lock:
                    if not self._enrich_queue:
                        return
                    size = max(1, int(self._CHUNK_SIZE or 64))
                    chunk_items = self._enrich_queue[:size]
                    del self._enrich_queue[:size]
                    chunk = [fp for _, fp in chunk_items if fp]
                await self._enrich_metadata_chunk(chunk)
        except Exception as exc:
            if _is_db_resetting_error(exc):
                logger.info("Metadata enrichment paused during DB maintenance/reset: %s", exc)
            else:
                logger.warning("Metadata enrichment worker failed: %s", exc)
        finally:
            async with self._enrich_lock:
                self._enrich_running = False
                self._enrich_task = None
                queue_left = len(self._enrich_queue)
            self._emit_status(False, queue_left=queue_left)

    async def _load_asset_ids_for_filepaths(self, filepaths: list[str]) -> Result[dict[str, int]]:
        id_res = await self.db.aquery_in(
            "SELECT id, filepath FROM assets WHERE {IN_CLAUSE}",
            "filepath",
            filepaths,
        )
        if not id_res.ok:
            return Result.Err(id_res.code, id_res.error or "Failed to query asset ids")

        id_by_fp: dict[str, int] = {}
        for row in id_res.data or []:
            if not isinstance(row, dict):
                continue
            fp = row.get("filepath")
            try:
                aid = int(row.get("id") or 0)
            except Exception:
                aid = 0
            if fp and aid:
                id_by_fp[str(fp)] = aid
        return Result.Ok(id_by_fp)

    def _build_state_hash_for_file(self, filepath: str) -> str | None:
        try:
            stat = os.stat(filepath)
        except Exception:
            return None
        mtime_ns = getattr(stat, "st_mtime_ns", int(stat.st_mtime * 1_000_000_000))
        return self._compute_state_hash(filepath, int(mtime_ns), int(stat.st_size))

    @staticmethod
    def _extract_dimensions(metadata_result: Result[dict[str, Any]]) -> tuple[Any, Any, Any]:
        width = None
        height = None
        duration = None
        if metadata_result.ok and metadata_result.data:
            meta = metadata_result.data
            width = meta.get("width")
            height = meta.get("height")
            duration = meta.get("duration")
        return width, height, duration

    def _build_update_item(
        self,
        asset_id: int,
        filepath: str,
        metadata_result: Result[dict[str, Any]],
    ) -> dict[str, Any]:
        width, height, duration = self._extract_dimensions(metadata_result)
        return {
            "asset_id": asset_id,
            "width": width,
            "height": height,
            "duration": duration,
            "metadata_result": metadata_result,
            "filepath": filepath,
        }

    async def _prepare_updates_from_cache(
        self,
        cleaned: list[str],
        id_by_fp: dict[str, int],
        metadata_helpers_cls: Any,
    ) -> tuple[list[dict[str, Any]], list[tuple[str, int, str]]]:
        updates: list[dict[str, Any]] = []
        to_extract: list[tuple[str, int, str]] = []
        for fp in cleaned:
            asset_id = id_by_fp.get(fp)
            if not asset_id:
                continue

            state_hash = self._build_state_hash_for_file(fp)
            if not state_hash:
                continue

            metadata_result = await metadata_helpers_cls.retrieve_cached_metadata(
                self.db,
                fp,
                state_hash,
            )
            if not (metadata_result and metadata_result.ok):
                to_extract.append((fp, int(asset_id), state_hash))
                continue
            updates.append(self._build_update_item(int(asset_id), fp, metadata_result))
        return updates, to_extract

    async def _prepare_updates_from_extraction(
        self,
        to_extract: list[tuple[str, int, str]],
        metadata_helpers_cls: Any,
    ) -> list[dict[str, Any]]:
        if not to_extract:
            return []
        updates: list[dict[str, Any]] = []
        batch_results = await self.metadata.get_metadata_batch(
            [fp for fp, _, _ in to_extract],
            scan_id=None,
        )
        for fp, asset_id, state_hash in to_extract:
            metadata_result = batch_results.get(fp)
            if not metadata_result:
                metadata_result = self._metadata_error_payload(
                    Result.Err("METADATA_MISSING", "No metadata returned"),
                    fp,
                )
            elif not metadata_result.ok:
                metadata_result = self._metadata_error_payload(metadata_result, fp)
            else:
                try:
                    await metadata_helpers_cls.store_metadata_cache(
                        self.db,
                        fp,
                        state_hash,
                        metadata_result,
                    )
                except Exception:
                    pass
            updates.append(self._build_update_item(asset_id, fp, metadata_result))
        return updates

    async def _notify_asset_updated(self, asset_id: int) -> None:
        try:
            res = await self.db.aquery(
                """
                SELECT a.id, m.has_workflow AS has_workflow,
                       m.has_generation_data AS has_generation_data
                FROM assets a
                LEFT JOIN asset_metadata m ON a.id = m.asset_id
                WHERE a.id = ?
                LIMIT 1
                """,
                (int(asset_id),),
            )
            if res.ok and res.data:
                payload = dict(res.data[0])
                from ...routes.registry import PromptServer
                PromptServer.instance.send_sync("mjr-asset-updated", payload)
        except Exception:
            pass

    async def _apply_update_item(self, item: dict[str, Any], metadata_helpers_cls: Any) -> str | None:
        asset_id = item.get("asset_id")
        if not asset_id:
            return None
        meta_res = item.get("metadata_result")
        if not isinstance(meta_res, Result):
            return None
        fp = str(item.get("filepath") or "")

        try:
            update_error = await self._apply_metadata_update_transaction(
                asset_id=asset_id,
                item=item,
                meta_res=meta_res,
                metadata_helpers_cls=metadata_helpers_cls,
            )
            if update_error is not None:
                return update_error
            if fp:
                self._retry_counts.pop(fp, None)
            await self._notify_asset_updated(int(asset_id))
            return None
        except Exception as exc:
            if _is_transient_db_error(exc):
                logger.info(
                    "Metadata enrichment deferred for asset_id=%s due to DB contention/reset: %s",
                    asset_id,
                    exc,
                )
                return fp or None
            logger.warning("Metadata enrichment update failed for asset_id=%s: %s", asset_id, exc)
            return None

    async def _apply_metadata_update_transaction(
        self,
        *,
        asset_id: Any,
        item: dict[str, Any],
        meta_res: Result[dict[str, Any]],
        metadata_helpers_cls: Any,
    ) -> str | None:
        fp = str(item.get("filepath") or "")
        async with self.db.lock_for_asset(asset_id):
            async with self.db.atransaction(mode="deferred") as tx:
                if not tx.ok:
                    logger.warning(
                        "Metadata enrichment skipped (transaction begin failed) for asset_id=%s: %s",
                        asset_id,
                        tx.error,
                    )
                    return fp or None
                await self._apply_metadata_update_queries(asset_id, item, meta_res, metadata_helpers_cls)
            if not tx.ok:
                logger.warning(
                    "Metadata enrichment commit failed for asset_id=%s: %s",
                    asset_id,
                    tx.error,
                )
                return fp or None
        return None

    async def _apply_metadata_update_queries(
        self,
        asset_id: Any,
        item: dict[str, Any],
        meta_res: Result[dict[str, Any]],
        metadata_helpers_cls: Any,
    ) -> None:
        await self.db.aexecute(
            """
            UPDATE assets
            SET width = COALESCE(?, width),
                height = COALESCE(?, height),
                duration = COALESCE(?, duration),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (
                item.get("width"),
                item.get("height"),
                item.get("duration"),
                asset_id,
            ),
        )
        await metadata_helpers_cls.write_asset_metadata_row(
            self.db,
            asset_id,
            meta_res,
            filepath=item.get("filepath"),
        )

    async def _apply_updates_and_collect_retries(
        self,
        updates: list[dict[str, Any]],
        metadata_helpers_cls: Any,
    ) -> list[str]:
        retry_paths: list[str] = []
        for item in updates:
            retry_fp = await self._apply_update_item(item, metadata_helpers_cls)
            if retry_fp:
                retry_paths.append(retry_fp)
        return retry_paths

    async def _requeue_retry_paths(self, retry_paths: list[str]) -> None:
        if not retry_paths:
            return
        to_requeue: list[str] = []
        for fp in retry_paths:
            try:
                count = int(self._retry_counts.get(fp, 0)) + 1
            except Exception:
                count = 1
            self._retry_counts[fp] = count
            if count <= _MAX_ENRICH_RETRIES:
                to_requeue.append(fp)
                continue
            logger.warning(
                "Metadata enrichment dropped after max retries (%s): %s",
                _MAX_ENRICH_RETRIES,
                fp,
            )
            self._retry_counts.pop(fp, None)
        if to_requeue:
            await asyncio.sleep(0.2)
            await self.start_enrichment(to_requeue)

    async def _enrich_metadata_chunk(self, filepaths: list[str]) -> None:
        """
        Process a chunk of files for metadata enrichment.

        Args:
            filepaths: List of file paths to process
        """
        cleaned = [str(p) for p in (filepaths or []) if p]
        if not cleaned:
            return

        id_map_res = await self._load_asset_ids_for_filepaths(cleaned)
        if not id_map_res.ok:
            return
        id_by_fp = id_map_res.data or {}

        # Import helper locally to use shared logic (including FTS population)
        from .metadata_helpers import MetadataHelpers

        updates, to_extract = await self._prepare_updates_from_cache(
            cleaned,
            id_by_fp,
            MetadataHelpers,
        )
        extracted_updates = await self._prepare_updates_from_extraction(
            to_extract,
            MetadataHelpers,
        )
        if extracted_updates:
            updates.extend(extracted_updates)

        if not updates:
            return

        retry_paths = await self._apply_updates_and_collect_retries(
            updates,
            MetadataHelpers,
        )
        await self._requeue_retry_paths(retry_paths)

    def get_queue_length(self) -> int:
        """Return pending enrichment queue length."""
        try:
            return int(len(self._enrich_queue))
        except Exception:
            return 0
    # Batch size configurable via MAJOOR_ENRICHER_CHUNK_SIZE.
    _CHUNK_SIZE = int(os.getenv("MAJOOR_ENRICHER_CHUNK_SIZE", 64))
