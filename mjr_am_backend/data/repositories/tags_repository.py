"""Repository for the normalized ``tags`` / ``asset_tags`` tables (v17+).

The legacy JSON-based ``asset_metadata.tags`` column is read by
:meth:`TagsRepository.sync_from_legacy_row` to support the dual-write
transition: writers continue to update the legacy column, then call
``sync_from_legacy_row`` so the normalized tables stay in lockstep. Once all
readers have migrated, the legacy column will be dropped.

All public methods return ``Result``. Tag names are case-insensitive at the
storage layer (``COLLATE NOCASE``); we still normalize input by stripping
whitespace before passing to SQL.
"""

from __future__ import annotations

import json
from dataclasses import dataclass

from ...shared import Result
from .base import Repository


@dataclass(frozen=True)
class Tag:
    """A persisted tag row."""

    id: int
    name: str


def _normalize(name: str) -> str:
    return name.strip()


class _TagWriteFailed(Exception):
    """Raised inside a replace_all transaction to force a rollback on a failed write."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


class TagsRepository(Repository):
    """CRUD + relationship management for normalized tags."""

    # ── tags table ───────────────────────────────────────────────────── #

    async def ensure(self, name: str) -> Result[Tag]:
        """Insert *name* if missing and return the resolved :class:`Tag`."""
        clean = _normalize(name)
        if not clean:
            return Result.Err("INVALID_INPUT", "Tag name cannot be empty")
        insert = await self._db.aexecute(
            "INSERT OR IGNORE INTO tags (name) VALUES (?)", (clean,)
        )
        if not insert.ok:
            return Result.Err(insert.code, insert.error or "")
        row_result = await self._db.aquery(
            "SELECT id, name FROM tags WHERE name = ?", (clean,)
        )
        if not row_result.ok:
            return Result.Err(row_result.code, row_result.error or "")
        rows = row_result.data or []
        if not rows:
            return Result.Err("NOT_FOUND", f"Tag insert silently dropped: {clean!r}")
        return Result.Ok(Tag(id=int(rows[0]["id"]), name=str(rows[0]["name"])))

    async def get_by_name(self, name: str) -> Result[Tag | None]:
        """Return the tag matching *name* (case-insensitive) or ``None``."""
        clean = _normalize(name)
        if not clean:
            return Result.Ok(None)
        result = await self._db.aquery(
            "SELECT id, name FROM tags WHERE name = ?", (clean,)
        )
        if not result.ok:
            return Result.Err(result.code, result.error or "")
        rows = result.data or []
        if not rows:
            return Result.Ok(None)
        return Result.Ok(Tag(id=int(rows[0]["id"]), name=str(rows[0]["name"])))

    async def list_all(self, *, limit: int | None = None) -> Result[list[Tag]]:
        """Return all tags ordered by name."""
        if limit is not None:
            if limit < 0:
                return Result.Err("INVALID_INPUT", "limit must be >= 0")
            result = await self._db.aquery(
                "SELECT id, name FROM tags ORDER BY name LIMIT ?", (int(limit),)
            )
        else:
            result = await self._db.aquery("SELECT id, name FROM tags ORDER BY name")
        if not result.ok:
            return Result.Err(result.code, result.error or "")
        return Result.Ok(
            [Tag(id=int(r["id"]), name=str(r["name"])) for r in (result.data or [])]
        )

    # ── asset_tags relationship ──────────────────────────────────────── #

    async def attach(self, asset_id: int, name: str) -> Result[Tag]:
        """Ensure tag *name* exists and link it to *asset_id*. Idempotent."""
        tag_result = await self.ensure(name)
        if not tag_result.ok:
            return tag_result
        tag = tag_result.data
        if tag is None:
            return Result.Err("INTERNAL", "ensure() returned no tag despite Ok")
        link = await self._db.aexecute(
            "INSERT OR IGNORE INTO asset_tags (asset_id, tag_id) VALUES (?, ?)",
            (int(asset_id), tag.id),
        )
        if not link.ok:
            return Result.Err(link.code, link.error or "")
        return Result.Ok(tag)

    async def detach(self, asset_id: int, name: str) -> Result[bool]:
        """Remove the link between *asset_id* and tag *name*.

        Returns ``Ok(True)`` whether or not a row was actually deleted.
        """
        clean = _normalize(name)
        if not clean:
            return Result.Err("INVALID_INPUT", "Tag name cannot be empty")
        result = await self._db.aexecute(
            "DELETE FROM asset_tags WHERE asset_id = ? AND tag_id = "
            "(SELECT id FROM tags WHERE name = ?)",
            (int(asset_id), clean),
        )
        if not result.ok:
            return Result.Err(result.code, result.error or "")
        return Result.Ok(True)

    async def list_for_asset(self, asset_id: int) -> Result[list[Tag]]:
        """Return all tags attached to *asset_id*."""
        result = await self._db.aquery(
            "SELECT t.id AS id, t.name AS name "
            "FROM asset_tags at JOIN tags t ON t.id = at.tag_id "
            "WHERE at.asset_id = ? ORDER BY t.name",
            (int(asset_id),),
        )
        if not result.ok:
            return Result.Err(result.code, result.error or "")
        return Result.Ok(
            [Tag(id=int(r["id"]), name=str(r["name"])) for r in (result.data or [])]
        )

    async def list_assets_with_tag(self, name: str) -> Result[list[int]]:
        """Return ordered asset ids carrying tag *name* (case-insensitive)."""
        clean = _normalize(name)
        if not clean:
            return Result.Ok([])
        result = await self._db.aquery(
            "SELECT at.asset_id AS asset_id FROM asset_tags at "
            "JOIN tags t ON t.id = at.tag_id WHERE t.name = ? ORDER BY at.asset_id",
            (clean,),
        )
        if not result.ok:
            return Result.Err(result.code, result.error or "")
        return Result.Ok([int(r["asset_id"]) for r in (result.data or [])])

    async def count(self) -> Result[int]:
        """Return the total number of distinct tags."""
        result = await self._db.aquery("SELECT COUNT(*) AS n FROM tags")
        if not result.ok:
            return Result.Err(result.code, result.error or "")
        rows = result.data or []
        if not rows:
            return Result.Ok(0)
        return Result.Ok(int(rows[0]["n"]))

    # ── dual-write helpers (transition only) ─────────────────────────── #

    async def replace_all(self, asset_id: int, names: list[str]) -> Result[list[Tag]]:
        """Atomically replace the tag set attached to *asset_id*.

        Deletes existing ``asset_tags`` rows for the asset, ensures each
        provided tag exists in ``tags``, then re-links. Duplicates and
        empty/whitespace names are dropped (case-insensitive dedup).
        """
        aid = int(asset_id)
        # Normalize + dedup (case-insensitive).
        cleaned: list[str] = []
        seen: set[str] = set()
        for raw in names or []:
            if not isinstance(raw, str):
                continue
            name = _normalize(raw)
            if not name:
                continue
            key = name.casefold()
            if key in seen:
                continue
            seen.add(key)
            cleaned.append(name)

        attached: list[Tag] = []
        try:
            async with self._db.atransaction(mode="immediate") as tx:
                if not tx.ok:
                    return Result.Err("DB_ERROR", tx.error or "Failed to begin transaction")

                delete = await self._db.aexecute(
                    "DELETE FROM asset_tags WHERE asset_id = ?", (aid,)
                )
                if not delete.ok:
                    raise _TagWriteFailed(delete.code, delete.error or "")

                for name in cleaned:
                    tag_result = await self.attach(aid, name)
                    if not tag_result.ok:
                        raise _TagWriteFailed(tag_result.code, tag_result.error or "")
                    if tag_result.data is not None:
                        attached.append(tag_result.data)
            if not tx.ok:
                return Result.Err(tx.code or "DB_ERROR", tx.error or "Commit failed")
        except _TagWriteFailed as exc:
            return Result.Err(exc.code, exc.message)

        return Result.Ok(attached)

    async def sync_from_legacy_row(self, asset_id: int) -> Result[list[Tag]]:
        """Read ``asset_metadata.tags`` JSON for *asset_id* and mirror it
        into ``tags`` / ``asset_tags``.

        Used by writer sites during the dual-write transition: after they
        update the legacy JSON column, they call this method so the
        normalized tables stay consistent with whatever the UPSERT/UPDATE
        actually committed (handles CASE-WHEN preservation logic).

        Missing rows or malformed JSON are treated as empty tag sets.
        """
        aid = int(asset_id)
        columns = await self._db.aquery("PRAGMA table_info(asset_metadata)")
        if not columns.ok:
            return Result.Err(columns.code, columns.error or "")
        if "tags" not in {str(row.get("name")) for row in (columns.data or [])}:
            return await self.replace_all(aid, [])
        row_result = await self._db.aquery(
            "SELECT tags FROM asset_metadata WHERE asset_id = ?", (aid,)
        )
        if not row_result.ok:
            return Result.Err(row_result.code, row_result.error or "")
        rows = row_result.data or []
        if not rows:
            return await self.replace_all(aid, [])
        raw = rows[0].get("tags")
        names: list[str] = []
        if isinstance(raw, str) and raw:
            try:
                parsed = json.loads(raw)
            except (ValueError, TypeError):
                parsed = []
            if isinstance(parsed, list):
                names = [t for t in parsed if isinstance(t, str)]
        return await self.replace_all(aid, names)
