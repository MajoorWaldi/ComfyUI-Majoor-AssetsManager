"""
Index Service - file scanning, incremental updates, and FTS search.

This service coordinates multiple specialized components:
- IndexScanner: Directory scanning and file indexing
- IndexSearcher: Search and retrieval operations
- AssetUpdater: Rating and tag updates
- MetadataEnricher: Background metadata enrichment
- MetadataHelpers: Shared metadata utilities
"""
import threading
import os
from pathlib import Path
from typing import Optional, List, Dict, Any

from ...shared import get_logger, Result
from ...adapters.db.sqlite import Sqlite
from ...adapters.db.schema import table_has_column
from ..metadata import MetadataService
from ..geninfo.parser import parse_geninfo_from_prompt
from .scanner import IndexScanner
from .searcher import IndexSearcher
from .updater import AssetUpdater
from .enricher import MetadataEnricher
from .metadata_helpers import MetadataHelpers


logger = get_logger(__name__)


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

    def __init__(self, db: Sqlite, metadata_service: MetadataService):
        self.db = db
        self.metadata = metadata_service
        self._scan_lock = threading.Lock()
        self._has_tags_text_column = table_has_column(self.db, "asset_metadata", "tags_text")
        logger.debug("asset_metadata.tags_text column available: %s", self._has_tags_text_column)

        # Initialize specialized components
        self._scanner = IndexScanner(db, metadata_service, self._scan_lock)
        self._searcher = IndexSearcher(db, self._has_tags_text_column)
        self._updater = AssetUpdater(db, self._has_tags_text_column)
        self._enricher = MetadataEnricher(
            db,
            metadata_service,
            self._scan_lock,
            self._scanner._compute_state_hash,
            MetadataHelpers.prepare_metadata_fields,
            MetadataHelpers.metadata_error_payload,
        )

    # ==================== Scanning Operations ====================

    def scan_directory(
        self,
        directory: str,
        recursive: bool = True,
        incremental: bool = True,
        source: str = "output",
        root_id: Optional[str] = None,
        fast: bool = False,
        background_metadata: bool = False,
    ) -> Result[Dict[str, Any]]:
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
        result = self._scanner.scan_directory(
            directory,
            recursive,
            incremental,
            source,
            root_id,
            fast,
            background_metadata,
        )

        # Handle background enrichment if requested
        if result.ok and fast and background_metadata:
            to_enrich = result.data.get("to_enrich", [])
            if to_enrich:
                try:
                    self._enricher.start_enrichment(to_enrich)
                except Exception as exc:
                    logger.debug("Background enrichment start skipped: %s", exc)
                # Remove from stats as it's internal
                result.data.pop("to_enrich", None)

        return result

    def index_paths(
        self,
        paths: List[Path],
        base_dir: str,
        incremental: bool = True,
        source: str = "output",
        root_id: Optional[str] = None,
    ) -> Result[Dict[str, Any]]:
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
        return self._scanner.index_paths(paths, base_dir, incremental, source, root_id)

    # ==================== Search Operations ====================

    def search(
        self,
        query: str,
        limit: int = 50,
        offset: int = 0,
        filters: Optional[Dict[str, Any]] = None,
        include_total: bool = True,
    ) -> Result[Dict[str, Any]]:
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
        return self._searcher.search(query, limit, offset, filters, include_total=include_total)

    def search_scoped(
        self,
        query: str,
        roots: List[str],
        limit: int = 50,
        offset: int = 0,
        filters: Optional[Dict[str, Any]] = None,
        include_total: bool = True,
    ) -> Result[Dict[str, Any]]:
        """
        Search assets but restrict results to files whose absolute filepath is under one of the provided roots.

        This is used for UI scopes like Outputs / Inputs / All without breaking the existing DB structure.
        """
        return self._searcher.search_scoped(query, roots, limit, offset, filters, include_total=include_total)

    def has_assets_under_root(self, root: str) -> Result[bool]:
        """
        Return True if the DB has at least one asset under the provided root.
        """
        return self._searcher.has_assets_under_root(root)

    def get_asset(self, asset_id: int) -> Result[Optional[Dict[str, Any]]]:
        """
        Get a single asset by ID.

        Args:
            asset_id: Asset database ID

        Returns:
            Result with asset data or None if not found
        """
        result = self._searcher.get_asset(asset_id)
        if not result.ok or not result.data:
            return result

        asset = result.data
        filepath = asset.get("filepath")
        if not filepath or not isinstance(filepath, str):
            return result

        try:
            has_workflow = int(asset.get("has_workflow") or 0)
            has_generation_data = int(asset.get("has_generation_data") or 0)
        except (TypeError, ValueError):
            has_workflow = 0
            has_generation_data = 0

        # Opportunistic self-heal: if geninfo is missing but we already have a prompt graph,
        # we can compute it without calling external tools.
        geninfo = asset.get("geninfo")
        prompt_graph = asset.get("prompt")
        workflow = asset.get("workflow")
        metadata_raw = asset.get("metadata_raw")

        did_update = False

        def _geninfo_score(value: Any) -> int:
            if not isinstance(value, dict):
                return 0
            score = 0
            if isinstance(value.get("positive"), dict) and value["positive"].get("value"):
                score += 3
            if isinstance(value.get("negative"), dict) and value["negative"].get("value"):
                score += 2
            models_obj = value.get("models") if isinstance(value.get("models"), dict) else None
            if isinstance(models_obj, dict):
                # Count "primary" models higher than accessory models (clip/vae).
                if any(k in models_obj for k in ("checkpoint", "unet", "diffusion")):
                    score += 3
                if isinstance(value.get("clip"), dict) and value["clip"].get("name"):
                    score += 1
                if isinstance(value.get("vae"), dict) and value["vae"].get("name"):
                    score += 1
            if isinstance(value.get("checkpoint"), dict) and value["checkpoint"].get("name"):
                score += 2
            if isinstance(value.get("loras"), list) and value["loras"]:
                score += 1
            if isinstance(value.get("sampler"), dict) and value["sampler"].get("name"):
                score += 1
            return score

        def _geninfo_is_incomplete(value: Any) -> bool:
            if not isinstance(value, dict):
                return True
            # If we only have sampler-ish fields but no prompts or models, treat as incomplete.
            has_prompt = isinstance(value.get("positive"), dict) and bool(value["positive"].get("value"))
            has_negative = isinstance(value.get("negative"), dict) and bool(value["negative"].get("value"))
            models_obj = value.get("models") if isinstance(value.get("models"), dict) else None
            has_primary_model = isinstance(models_obj, dict) and any(k in models_obj for k in ("checkpoint", "unet", "diffusion"))
            has_checkpoint = isinstance(value.get("checkpoint"), dict) and bool(value["checkpoint"].get("name"))
            # If we don't have any prompt text AND we don't have a primary model id,
            # it's likely a stale/partial geninfo and should be recomputed from the prompt graph.
            return not (has_prompt or has_negative or has_primary_model or has_checkpoint)

        if isinstance(prompt_graph, dict) and (not geninfo or _geninfo_is_incomplete(geninfo)):
            try:
                gi_res = parse_geninfo_from_prompt(prompt_graph, workflow=workflow)
                if gi_res.ok and gi_res.data:
                    if _geninfo_score(gi_res.data) <= _geninfo_score(geninfo):
                        # Keep existing geninfo if it's already as rich (or richer) than the new parse.
                        raise RuntimeError("Geninfo recompute did not improve richness")
                    meta_obj = metadata_raw if isinstance(metadata_raw, dict) else {}
                    meta_obj = dict(meta_obj)
                    meta_obj.setdefault("prompt", prompt_graph)
                    if workflow is not None:
                        meta_obj.setdefault("workflow", workflow)
                    meta_obj["geninfo"] = gi_res.data

                    metadata_result = Result.Ok(meta_obj, quality=str(meta_obj.get("quality") or "partial"))
                    with self._scan_lock:
                        MetadataHelpers.write_asset_metadata_row(self.db, asset_id, metadata_result)
                    did_update = True
            except Exception as exc:
                logger.debug("Geninfo self-heal skipped for asset_id=%s: %s", asset_id, exc)

        # If we still don't have generation flags, try a targeted extraction (video sidecars, ffprobe tags, etc.).
        if not did_update and (has_workflow == 0 and has_generation_data == 0):
            try:
                if os.path.exists(filepath) and os.path.isfile(filepath):
                    stat = os.stat(filepath)
                    mtime_ns = getattr(stat, "st_mtime_ns", int(stat.st_mtime * 1_000_000_000))
                    size = int(stat.st_size)
                    state_hash = self._scanner._compute_state_hash(filepath, int(mtime_ns), int(size))

                    cached = None
                    try:
                        cached = MetadataHelpers.retrieve_cached_metadata(self.db, filepath, state_hash)
                    except Exception:
                        cached = None

                    meta_res = cached or self.metadata.get_metadata(filepath, scan_id=None)
                    if meta_res and meta_res.ok and meta_res.data:
                        meta = meta_res.data
                        width = meta.get("width")
                        height = meta.get("height")
                        duration = meta.get("duration")

                        try:
                            MetadataHelpers.store_metadata_cache(self.db, filepath, state_hash, meta_res)
                        except Exception as exc:
                            logger.debug("Metadata cache store skipped for asset_id=%s: %s", asset_id, exc)

                        with self._scan_lock:
                            with self.db.transaction(mode="immediate"):
                                self.db.execute(
                                    """
                                    UPDATE assets
                                    SET width = COALESCE(?, width),
                                        height = COALESCE(?, height),
                                        duration = COALESCE(?, duration),
                                        updated_at = CURRENT_TIMESTAMP
                                    WHERE id = ?
                                    """,
                                    (width, height, duration, asset_id),
                                )
                                MetadataHelpers.write_asset_metadata_row(self.db, asset_id, meta_res)
                        did_update = True
            except Exception as exc:
                logger.debug("Targeted metadata extraction skipped for asset_id=%s: %s", asset_id, exc)

        if did_update:
            return self._searcher.get_asset(asset_id)

        return result

    def get_assets_batch(self, asset_ids: List[int]) -> Result[List[Dict[str, Any]]]:
        """
        Batch fetch assets by ID (single query).

        This is used by the UI to reduce network chatter and avoid triggering per-asset self-heal
        paths that may invoke external tools.
        """
        return self._searcher.get_assets(asset_ids)

    def lookup_assets_by_filepaths(self, filepaths: List[str]) -> Result[Dict[str, Dict[str, Any]]]:
        """
        Lookup DB-enriched asset fields for a set of absolute filepaths.

        This is used to enrich filesystem listings (input/custom) without requiring
        a full directory scan on every request.
        """
        return self._searcher.lookup_assets_by_filepaths(filepaths)

    # ==================== Update Operations ====================

    def update_asset_rating(self, asset_id: int, rating: int) -> Result[Dict[str, Any]]:
        """
        Update the rating for an asset.

        Args:
            asset_id: Asset ID
            rating: Rating value (0-5)

        Returns:
            Result with updated asset info
        """
        return self._updater.update_asset_rating(asset_id, rating)

    def update_asset_tags(self, asset_id: int, tags: List[str]) -> Result[Dict[str, Any]]:
        """
        Update the tags for an asset.

        Args:
            asset_id: Asset ID
            tags: List of tag strings

        Returns:
            Result with updated asset info
        """
        return self._updater.update_asset_tags(asset_id, tags)

    def get_all_tags(self) -> Result[List[str]]:
        """
        Get all unique tags from the database for autocomplete.

        Returns:
            Result with list of unique tags sorted alphabetically
        """
        return self._updater.get_all_tags()
