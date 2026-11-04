"""
Asset updater - handles rating and tag updates.
"""
from typing import Any

from ...adapters.core_assets import sync_user_metadata_by_asset_id
from ...adapters.db.sqlite import Sqlite
from ...data.repositories import TagsRepository
from ...shared import Result, get_logger

logger = get_logger(__name__)

MAX_TAG_LENGTH = 100
MAX_TAGS_PER_ASSET = 50


class AssetUpdater:
    """
    Handles asset metadata updates (ratings and tags).

    Provides methods to update asset ratings and normalized tags while
    maintaining data integrity.
    """

    def __init__(self, db: Sqlite, has_tags_text_column: bool = False):
        """
        Initialize asset updater.

        Args:
            db: Database adapter instance
            has_tags_text_column: Legacy compatibility parameter; ignored after v19.
        """
        self.db = db
        self._has_tags_text_column = False

    async def update_asset_rating(self, asset_id: int, rating: int) -> Result[dict[str, Any]]:
        """
        Update the rating for an asset.

        Args:
            asset_id: Asset ID
            rating: Rating value (0-5)

        Returns:
            Result with updated asset info
        """
        rating = max(0, min(5, int(rating or 0)))

        # Ensure asset exists
        check_result = await self.db.aquery(
            "SELECT id FROM assets WHERE id = ?",
            (asset_id,)
        )
        if not check_result.ok or not check_result.data or len(check_result.data) == 0:
            return Result.Err("NOT_FOUND", f"Asset not found: {asset_id}")

        # Update or insert asset_metadata (serialize per-asset to avoid race with enrichers)
        async with self.db.lock_for_asset(asset_id):
                result = await self.db.aexecute(
                    """
                    INSERT INTO asset_metadata (asset_id, rating)
                    SELECT ?, ?
                    WHERE EXISTS (SELECT 1 FROM assets WHERE id = ?)
                    ON CONFLICT(asset_id) DO UPDATE SET
                        rating = excluded.rating
                    WHERE EXISTS (SELECT 1 FROM assets WHERE id = excluded.asset_id)
                    """,
                    (asset_id, rating, asset_id)
                )

        if not result.ok:
            return Result.Err("UPDATE_FAILED", result.error or "Failed to update rating")

        await sync_user_metadata_by_asset_id(self.db, asset_id, rating=rating)
        return Result.Ok({"asset_id": asset_id, "rating": rating})

    async def update_asset_tags(self, asset_id: int, tags: list[str]) -> Result[dict[str, Any]]:
        """
        Update the tags for an asset.

        Args:
            asset_id: Asset ID
            tags: List of tag strings

        Returns:
            Result with updated asset info
        """
        # Ensure asset exists
        check_result = await self.db.aquery(
            "SELECT id FROM assets WHERE id = ?",
            (asset_id,)
        )
        if not check_result.ok or not check_result.data or len(check_result.data) == 0:
            return Result.Err("NOT_FOUND", f"Asset not found: {asset_id}")

        sanitized = self._sanitize_tags(tags)
        result = await self._write_asset_tags(asset_id, sanitized)

        if not result.ok:
            return Result.Err("UPDATE_FAILED", result.error or "Failed to update tags")

        await sync_user_metadata_by_asset_id(self.db, asset_id, tags=sanitized)
        return Result.Ok({"asset_id": asset_id, "tags": sanitized})

    @staticmethod
    def _clean_bulk_add_tags(add: list[str]) -> list[str]:
        """Trim/dedupe the caller-sanitized add list (case-insensitive)."""
        add_tags: list[str] = []
        seen_add: set[str] = set()
        for tag in add or []:
            cleaned = str(tag or "").strip()
            if not cleaned or len(cleaned) > MAX_TAG_LENGTH:
                continue
            key = cleaned.casefold()
            if key in seen_add:
                continue
            seen_add.add(key)
            add_tags.append(cleaned)
        return add_tags

    @staticmethod
    def _merged_tag_set(
        existing: list[str], add_tags: list[str], remove_keys: set[str]
    ) -> list[str]:
        """Compute ``(existing ∪ add) − remove`` keeping existing casing first."""
        merged: list[str] = []
        merged_keys: set[str] = set()
        for tag in existing + add_tags:
            key = tag.casefold()
            if key in remove_keys or key in merged_keys:
                continue
            merged.append(tag)
            merged_keys.add(key)
        return merged

    async def merge_asset_tags(
        self, asset_id: int, add: list[str], remove: list[str]
    ) -> Result[dict[str, Any]]:
        """
        Merge tag additions/removals into an asset's current tag set.

        Computes ``(existing ∪ add) − remove`` case-insensitively inside the
        per-asset lock: existing tags keep their casing, added tags keep the
        request's casing. Writes only when the resulting set differs from the
        current one.

        Args:
            asset_id: Asset ID
            add: Tags to add (already sanitized by the caller)
            remove: Tags to remove (already sanitized by the caller)

        Returns:
            Result with ``{"asset_id": int, "changed": bool, "tags": [str]}``;
            ``INVALID_INPUT`` when the merged set would exceed
            ``MAX_TAGS_PER_ASSET`` while introducing a tag the asset did not
            already have (asset left untouched; an over-cap asset can still
            have tags removed); ``NOT_FOUND`` for a missing asset.
        """
        check_result = await self.db.aquery(
            "SELECT id FROM assets WHERE id = ?",
            (asset_id,)
        )
        if not check_result.ok:
            return Result.Err("DB_ERROR", check_result.error or "Failed to load asset")
        if not check_result.data or len(check_result.data) == 0:
            return Result.Err("NOT_FOUND", f"Asset not found: {asset_id}")

        remove_keys = {
            str(tag).strip().casefold()
            for tag in (remove or [])
            if str(tag or "").strip()
        }
        add_tags = self._clean_bulk_add_tags(add)

        async with self.db.lock_for_asset(asset_id):
            read_result = await self.db.aquery(
                """
                SELECT t.name AS name
                FROM asset_tags at JOIN tags t ON t.id = at.tag_id
                WHERE at.asset_id = ?
                ORDER BY t.name
                """,
                (asset_id,),
            )
            if not read_result.ok:
                return Result.Err(
                    "DB_ERROR", read_result.error or "Failed to read asset tags"
                )
            existing = [
                str(row.get("name"))
                for row in (read_result.data or [])
                if isinstance(row, dict) and row.get("name")
            ]

            merged = self._merged_tag_set(existing, add_tags, remove_keys)

            existing_keys = {tag.casefold() for tag in existing}
            if len(merged) > MAX_TAGS_PER_ASSET and any(
                tag.casefold() not in existing_keys for tag in add_tags
            ):
                return Result.Err(
                    "INVALID_INPUT", f"Too many tags (max {MAX_TAGS_PER_ASSET})"
                )

            if {tag.casefold() for tag in merged} == existing_keys:
                return Result.Ok(
                    {"asset_id": asset_id, "changed": False, "tags": existing}
                )

            write_result = await self._write_asset_tags_locked(asset_id, merged)
            if not write_result.ok:
                return Result.Err(
                    "UPDATE_FAILED", write_result.error or "Failed to update tags"
                )

        await sync_user_metadata_by_asset_id(self.db, asset_id, tags=merged)
        return Result.Ok({"asset_id": asset_id, "changed": True, "tags": merged})

    def _sanitize_tags(self, tags: list[str]) -> list[str]:
        sanitized: list[str] = []
        seen: set[str] = set()
        for tag in tags:
            if not isinstance(tag, str):
                continue
            cleaned = str(tag).strip()
            if not cleaned or len(cleaned) > MAX_TAG_LENGTH:
                continue
            key = cleaned.casefold()
            if key in seen:
                continue
            seen.add(key)
            sanitized.append(cleaned)
        return sanitized

    async def _write_asset_tags(self, asset_id: int, tags: list[str]) -> Result[Any]:
        async with self.db.lock_for_asset(asset_id):
            return await self._write_asset_tags_locked(asset_id, tags)

    async def _write_asset_tags_locked(self, asset_id: int, tags: list[str]) -> Result[Any]:
        """Replace an asset's tags; caller must already hold the per-asset lock."""
        metadata_res = await self.db.aexecute(
            """
            INSERT INTO asset_metadata (asset_id, rating)
            SELECT ?, 0
            WHERE EXISTS (SELECT 1 FROM assets WHERE id = ?)
            ON CONFLICT(asset_id) DO NOTHING
            """,
            (asset_id, asset_id)
        )
        if not metadata_res.ok:
            return metadata_res
        return await TagsRepository(self.db).replace_all(asset_id, tags)

    async def get_all_tags(self) -> Result[list[str]]:
        """
        Get all unique tags from the database for autocomplete.

        Returns:
            Result with list of unique tags sorted alphabetically
        """
        result = await self.db.aquery(
            """
            SELECT name FROM tags ORDER BY name
            """
        )

        if not result.ok:
            return Result.Err("DB_ERROR", result.error or "Failed to read tags")

        return Result.Ok([str(row["name"]) for row in (result.data or [])])
