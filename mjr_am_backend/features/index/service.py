"""
Index Service - file scanning, incremental updates, and FTS search.

This service coordinates multiple specialized components:
- IndexScanner: Directory scanning and file indexing
- IndexSearcher: Search and retrieval operations
- AssetUpdater: Rating and tag updates
- MetadataEnricher: Background metadata enrichment
- MetadataHelpers: Shared metadata utilities
"""
from __future__ import annotations

import asyncio
from pathlib import Path
from typing import TYPE_CHECKING, Any

from mjr_am_shared.scan_throttle import mark_directory_indexed

from ...adapters.db.sqlite import Sqlite
from ...shared import Result, get_logger
from ...utils import sanitize_for_json
from ..metadata import MetadataService
from .enricher import MetadataEnricher
from .metadata_helpers import MetadataHelpers
from .scan_batch_utils import compute_state_hash, normalize_filepath_str
from .scanner import IndexScanner
from .searcher import IndexSearcher
from .updater import AssetUpdater
from ...config import BATCH_ASSET_PUSH_LIMIT, is_vector_search_enabled

if TYPE_CHECKING:
    from .vector_searcher import VectorSearcher
    from .vector_service import VectorService

logger = get_logger(__name__)


def _normalize_rename_paths(old_filepath: str, new_filepath: str) -> tuple[str, str]:
    return str(old_filepath or ""), normalize_filepath_str(str(new_filepath or ""))


_FILEPATH_MATCH_ALLOWED_COLUMNS = frozenset({"filepath"})


def _filepath_match_clause(path_value: str, *, column: str = "filepath") -> tuple[str, tuple[Any, ...]]:
    if column not in _FILEPATH_MATCH_ALLOWED_COLUMNS:
        raise ValueError(f"Column {column!r} is not in the allowed set: {_FILEPATH_MATCH_ALLOWED_COLUMNS}")
    raw = str(path_value or "")
    normalized = normalize_filepath_str(raw)
    keys: list[str] = []
    for value in (raw, normalized):
        val = str(value or "")
        if val and val not in keys:
            keys.append(val)
    if not keys:
        return f"{column} = ''", tuple()
    placeholders = ",".join("?" * len(keys))
    where = f"({column} IN ({placeholders}) OR {column} = ? COLLATE NOCASE)"
    return where, tuple([*keys, keys[0]])


async def _get_rename_mtime(new_path: Path) -> int | None:
    """Async-safe mtime read — offloads blocking stat() to a thread (BUG-08)."""
    try:
        stat = await asyncio.to_thread(new_path.stat)
        return int(stat.st_mtime)
    except Exception:
        return None


def _extract_rename_target_info(filepath: str) -> tuple[str, str, int | None]:
    """Extract filename, subfolder, and mtime from a filepath.

    WARNING: This is a synchronous helper — it calls os.path.getmtime() which
    performs blocking I/O.  Do NOT call from ``async def`` functions; use
    ``_get_rename_mtime`` instead (HIGH-003).
    """
    import os
    p = Path(filepath)
    name = p.name
    subfolder = str(p.parent)
    try:
        mtime = int(os.path.getmtime(filepath))
    except Exception:
        mtime = None
    return name, subfolder, mtime


async def _update_assets_filepath_row(
    db,
    old_where_sql: str,
    old_where_params: tuple[Any, ...],
    new_fp: str,
    filename: str,
    subfolder: str,
    mtime: int | None,
) -> Result[Any]:
    if mtime is None:
        return await db.aexecute(
            f"UPDATE assets SET filepath = ?, filename = ?, subfolder = ?, updated_at = CURRENT_TIMESTAMP WHERE {old_where_sql}",
            (new_fp, filename, subfolder, *old_where_params),
        )
    return await db.aexecute(
        f"UPDATE assets SET filepath = ?, filename = ?, subfolder = ?, mtime = ?, updated_at = CURRENT_TIMESTAMP WHERE {old_where_sql}",
        (new_fp, filename, subfolder, mtime, *old_where_params),
    )


async def _update_path_keyed_index_tables(
    db,
    old_where_sql: str,
    old_where_params: tuple[Any, ...],
    new_fp: str,
    subfolder: str,
    mtime: int | None,
) -> Result[bool]:
    sj = await db.aexecute(
        f"UPDATE scan_journal SET filepath = ?, dir_path = ?, mtime = COALESCE(?, mtime), last_seen = CURRENT_TIMESTAMP WHERE {old_where_sql}",
        (new_fp, subfolder, mtime, *old_where_params),
    )
    if not sj.ok:
        return Result.Err("DB_ERROR", sj.error or "Failed to update scan_journal filepath")

    mc = await db.aexecute(
        f"UPDATE metadata_cache SET filepath = ?, last_updated = CURRENT_TIMESTAMP WHERE {old_where_sql}",
        (new_fp, *old_where_params),
    )
    if not mc.ok:
        return Result.Err("DB_ERROR", mc.error or "Failed to update metadata_cache filepath")
    return Result.Ok(True)


def _build_runtime_vector_services(db: Sqlite) -> tuple[VectorService, VectorSearcher]:
    from .vector_searcher import VectorSearcher as _VS
    from .vector_service import VectorService as _VSvc

    vector_service = _VSvc()
    return vector_service, _VS(db, vector_service)


class IndexService:
    """
    Handles file indexing and search operations.

    Features:
    - Recursive directory scanning
    - Incremental updates based on mtime
    - FTS5 full-text search with BM25 ranking
    - Asset metadata extraction integration

    This service acts as a coordinator, delegating to specialized components
    for each area of functionality.
    """

    def __init__(self, db: Sqlite, metadata_service: MetadataService, has_tags_text_column: bool = False):
        self.db = db
        self.metadata = metadata_service
        self._scan_lock = asyncio.Lock()
        self._has_tags_text_column = has_tags_text_column
        self._vector_service: VectorService | None = None
        self._vector_searcher: VectorSearcher | None = None
        logger.debug("asset_metadata.tags_text column available: %s", self._has_tags_text_column)

        # Initialize specialized components
        self._scanner = IndexScanner(db, metadata_service, self._scan_lock)
        self.searcher = IndexSearcher(db, self._has_tags_text_column)
        self._updater = AssetUpdater(db, self._has_tags_text_column)
        self._enricher = MetadataEnricher(
            db,
            metadata_service,
            compute_state_hash,
            MetadataHelpers.prepare_metadata_fields,
            MetadataHelpers.metadata_error_payload,
        )

    def set_vector_services(self, vector_service: VectorService, vector_searcher: VectorSearcher | None = None) -> None:
        """Attach CLIP vector services for automatic background embedding on index."""
        self._vector_service = vector_service
        self._vector_searcher = vector_searcher
        self._scanner.set_vector_services(vector_service, vector_searcher)

    def _ensure_vector_services(self) -> None:
        if self._vector_service is not None:
            self._scanner.set_vector_services(self._vector_service, self._vector_searcher)
            return
        if not is_vector_search_enabled():
            return
        try:
            vector_service, vector_searcher = _build_runtime_vector_services(self.db)
        except Exception as exc:
            logger.debug("Runtime vector service initialization skipped: %s", exc)
            return
        self.set_vector_services(vector_service, vector_searcher)
        logger.info("Runtime vector services initialized for automatic indexing")

    # ==================== Scanning Operations ====================

    async def scan_directory(
        self,
        directory: str,
        recursive: bool = True,
        incremental: bool = True,
        source: str = "output",
        root_id: str | None = None,
        fast: bool = False,
        background_metadata: bool = False,
    ) -> Result[dict[str, Any]]:
        """
        Scan a directory for asset files.

        Args:
            directory: Path to scan
            recursive: Scan subdirectories
            incremental: Only update changed files (based on mtime)
            source: Source identifier for the scan
            root_id: Root identifier for the scan
            fast: Skip metadata extraction during scan
            background_metadata: Enable background metadata enrichment

        Returns:
            Result with scan statistics
        """
        self._ensure_vector_services()
        self._enricher.begin_scan_pause()
        try:
            result = await self._scanner.scan_directory(
                directory=directory,
                recursive=recursive,
                incremental=incremental,
                source=source,
                root_id=root_id,
                fast=fast,
                background_metadata=background_metadata,
            )
        finally:
            self._enricher.end_scan_pause()

        if result.ok:
            try:
                # Notify frontend of scan completion
                from ...routes.registry import PromptServer
                PromptServer.instance.send_sync("mjr-scan-complete", result.data)
            except Exception as e:
                logger.debug("Failed to emit scan-complete event: %s", e)
            if not fast:
                mark_directory_indexed(directory, source, root_id, metadata_complete=True)

        # Handle background enrichment if requested
        if result.ok and fast and background_metadata:
            result_data = result.data if isinstance(result.data, dict) else {}
            to_enrich = result_data.get("to_enrich", [])
            if to_enrich:
                try:
                    # H-7: cap enrichment startup at 5 minutes so a hung enricher
                    # cannot block scan completion indefinitely.
                    await asyncio.wait_for(
                        self._enricher.start_enrichment(to_enrich),
                        timeout=300,
                    )
                except asyncio.TimeoutError:
                    logger.warning(
                        "start_enrichment timed out after 300 s — enrichment skipped for this scan batch"
                    )
                except Exception as exc:
                    logger.debug("Background enrichment start skipped: %s", exc)
                # Remove from stats as it's internal
                result_data.pop("to_enrich", None)

        return result

    async def index_paths(
        self,
        paths: list[Path],
        base_dir: str,
        incremental: bool = True,
        source: str = "output",
        root_id: str | None = None,
    ) -> Result[dict[str, Any]]:
        """
        Index a list of file paths (no directory scan).

        Args:
            paths: List of file paths to index
            base_dir: Base directory for relative path calculation
            incremental: Skip if already indexed and unchanged
            source: Source identifier for the index
            root_id: Root identifier for the index

        Returns:
            Result with indexing statistics
        """
        self._ensure_vector_services()
        res = await self._scanner.index_paths(
            paths=paths,
            base_dir=base_dir,
            incremental=incremental,
            source=source,
            root_id=root_id,
        )
        if res.ok:
            # Single import shared by both notifications below (MED-05).
            try:
                from ...routes.registry import PromptServer as _PS
            except Exception:
                _PS = None
            try:
                if _PS is not None:
                    # Notify frontend (useful for drag-drop staging updates)
                    _PS.instance.send_sync("mjr-scan-complete", res.data)
                    _PS.instance.send_sync("mjr.scan.progress", sanitize_for_json({
                        "status": "completed",
                        "scope": str(source or "output"),
                        "root_id": root_id,
                        "stats": dict(res.data or {}),
                    }))
            except Exception as e:
                logger.debug("Failed to emit scan-complete event: %s", e)
            # Push newly-added assets immediately so the frontend can upsert them
            # into the grid without waiting for the next polling cycle.
            # Limit raised to 50 so batch workflows (e.g. grid/xyz nodes) get full
            # immediate coverage; files beyond 50 still appear on next counter poll.
            added_ids = (res.data or {}).get("added_ids") or []
            if added_ids and _PS is not None:
                try:
                    batch_res = await self.get_assets_batch(list(added_ids[:BATCH_ASSET_PUSH_LIMIT]))
                    if batch_res.ok and batch_res.data:
                        for asset in batch_res.data:
                            try:
                                _PS.instance.send_sync("mjr-asset-added", sanitize_for_json(dict(asset)))
                                _PS.instance.send_sync("mjr.asset.indexed", sanitize_for_json(dict(asset)))
                            except Exception as exc:
                                logger.debug("Failed to push mjr-asset-added for one asset: %s", exc)
                except Exception as e:
                    logger.warning("Failed to emit mjr-asset-added events: %s", e)
            mark_directory_indexed(base_dir, source, root_id)
        return res

    async def remove_file(self, filepath: str) -> Result[bool]:
        """
        Remove a file from the index.

        Args:
            filepath: Absolute path of the file to remove

        Returns:
            Result indicating success
        """
        # ON DELETE CASCADE handles asset_metadata, scan_journal, etc.
        where_sql, where_params = _filepath_match_clause(filepath, column="filepath")
        res = await self.db.aexecute(
            f"DELETE FROM assets WHERE {where_sql}",
            where_params,
        )
        if not res.ok:
            logger.warning("Failed to remove asset from index (%s): %s", filepath, res.error)
            return Result.Err("DB_ERROR", res.error or "Failed to delete asset")
        try:
            deleted_rows = int(res.data or 0)
        except Exception:
            deleted_rows = 0
        if deleted_rows <= 0:
            return Result.Err("NOT_FOUND", "Asset not found")
        logger.debug(f"Removed from index: {filepath}")
        return Result.Ok(True)

    async def rename_file(self, old_filepath: str, new_filepath: str) -> Result[bool]:
        """
        Rename/move a file path in index tables without rescanning directories.

        This keeps DB metadata attached to the asset while updating path-keyed tables.
        """
        old_fp, new_fp = _normalize_rename_paths(old_filepath, new_filepath)
        if not old_fp or not new_fp:
            return Result.Err("INVALID_INPUT", "Missing old/new filepath")
        if normalize_filepath_str(old_fp) == normalize_filepath_str(new_fp):
            return Result.Ok(True)

        try:
            old_where_sql, old_where_params = _filepath_match_clause(old_fp, column="filepath")
            new_path = Path(new_fp)
            filename = new_path.name
            subfolder = str(new_path.parent)
            mtime = await _get_rename_mtime(new_path)

            async with self.db.atransaction(mode="immediate"):
                # PRAGMA defer_foreign_keys is per-connection and per-transaction.
                # atransaction pins all operations to a single connection via _TX_TOKEN
                # (see sqlite_facade.py), so the PRAGMA and the subsequent UPDATEs are
                # guaranteed to run on the same physical connection (LOW-05).
                defer_fk = await self.db.aexecute("PRAGMA defer_foreign_keys = ON")
                if not defer_fk.ok:
                    return Result.Err("DB_ERROR", defer_fk.error or "Failed to defer foreign key checks")

                upd = await _update_assets_filepath_row(
                    self.db,
                    old_where_sql,
                    old_where_params,
                    new_fp,
                    filename,
                    subfolder,
                    mtime,
                )
                if not upd.ok:
                    return Result.Err("DB_ERROR", upd.error or "Failed to update asset filepath")
                try:
                    updated_rows = int(upd.data or 0)
                except Exception:
                    updated_rows = 0
                if updated_rows <= 0:
                    return Result.Err("NOT_FOUND", "Asset not found")

                side_updates = await _update_path_keyed_index_tables(
                    self.db,
                    old_where_sql,
                    old_where_params,
                    new_fp,
                    subfolder,
                    mtime,
                )
                if not side_updates.ok:
                    return side_updates
        except Exception as exc:
            return Result.Err("DB_ERROR", str(exc))

        logger.debug("Renamed in index: %s -> %s", old_fp, new_fp)
        return Result.Ok(True)

    # ==================== Search Operations ====================

    async def search(
        self,
        query: str,
        limit: int = 50,
        offset: int = 0,
        filters: dict[str, Any] | None = None,
        include_total: bool = True,
    ) -> Result[dict[str, Any]]:
        """
        Search assets using FTS5 full-text search, or browse all if query is '*'.

        Args:
            query: Search query (FTS5 syntax supported, or '*' to browse all)
            limit: Max results to return
            offset: Pagination offset
            filters: Optional filters (kind, rating, tags, etc.)

        Returns:
            Result with search results and metadata
        """
        return await self.searcher.search(query, limit, offset, filters, include_total=include_total)

    async def search_scoped(
        self,
        query: str,
        roots: list[str],
        limit: int = 50,
        offset: int = 0,
        filters: dict[str, Any] | None = None,
        include_total: bool = True,
        sort: str | None = None,
    ) -> Result[dict[str, Any]]:
        """
        Search assets but restrict results to files whose absolute filepath is under one of the provided roots.

        This is used for UI scopes like Outputs / Inputs / All without breaking the existing DB structure.
        """
        return await self.searcher.search_scoped(
            query,
            roots,
            limit,
            offset,
            filters,
            include_total=include_total,
            sort=sort,
        )

    async def has_assets_under_root(self, root: str) -> Result[bool]:
        """
        Return True if the DB has at least one asset under the provided root.
        """
        return await self.searcher.has_assets_under_root(root)

    async def date_histogram_scoped(
        self,
        roots: list[str],
        month_start: int,
        month_end: int,
        filters: dict[str, Any] | None = None,
    ) -> Result[dict[str, int]]:
        """
        Return a day->count mapping for assets within a month for the given roots.

        Used by the UI calendar to mark days that have assets.
        """
        return await self.searcher.date_histogram_scoped(roots, month_start, month_end, filters)

    async def get_asset(self, asset_id: int) -> Result[dict[str, Any] | None]:
        """Fetch a single asset row by id."""
        # Async path: return the DB row; deep "self-heal" is handled by scan/enrich flows.
        return await self.searcher.get_asset(asset_id)

    async def get_assets_batch(self, asset_ids: list[int]) -> Result[list[dict[str, Any]]]:
        """
        Batch fetch assets by ID (single query).

        This is used by the UI to reduce network chatter and avoid triggering per-asset self-heal
        paths that may invoke external tools.
        """
        return await self.searcher.get_assets(asset_ids)

    async def lookup_assets_by_filepaths(self, filepaths: list[str]) -> Result[dict[str, dict[str, Any]]]:
        """
        Lookup DB-enriched asset fields for a set of absolute filepaths.

        This is used to enrich filesystem listings (input/custom) without requiring
        a full directory scan on every request.
        """
        return await self.searcher.lookup_assets_by_filepaths(filepaths)

    # ==================== Update Operations ====================

    async def update_asset_rating(self, asset_id: int, rating: int) -> Result[dict[str, Any]]:
        """
        Update the rating for an asset.

        Args:
            asset_id: Asset ID
            rating: Rating value (0-5)

        Returns:
            Result with updated asset info
        """
        return await self._updater.update_asset_rating(asset_id, rating)

    async def update_asset_tags(self, asset_id: int, tags: list[str]) -> Result[dict[str, Any]]:
        """
        Update the tags for an asset.

        Args:
            asset_id: Asset ID
            tags: List of tag strings

        Returns:
            Result with updated asset info
        """
        return await self._updater.update_asset_tags(asset_id, tags)

    async def get_all_tags(self) -> Result[list[str]]:
        """
        Get all unique tags from the database for autocomplete.

        Returns:
            Result with list of unique tags sorted alphabetically
        """
        return await self._updater.get_all_tags()

    def pause_enrichment_for_interaction(self, seconds: float = 1.5) -> None:
        """
        Temporarily pause background metadata enrichment during interactive UI reads
        (search/sort/list) to reduce DB contention.
        """
        try:
            self._enricher.pause_for_interaction(seconds=seconds)
        except Exception:
            pass

    async def stop_enrichment(self, clear_queue: bool = True) -> None:
        """
        Stop metadata enrichment worker (used during DB maintenance/restore).
        """
        try:
            await self._enricher.stop_enrichment(clear_queue=clear_queue)
        except Exception:
            pass

    def get_runtime_status(self) -> dict[str, Any]:
        """Return lightweight runtime counters for diagnostics/dashboard."""
        try:
            queue_len = int(self._enricher.get_queue_length())
        except Exception:
            queue_len = 0
        return {
            "enrichment_queue_length": queue_len,
        }
