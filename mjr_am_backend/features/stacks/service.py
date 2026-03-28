"""
Asset stacks service — groups assets produced by the same workflow execution.

A *stack* is a set of assets that share the same `job_id` (the prompt_id from
ComfyUI execution).  For example a single workflow run might produce a mask,
a controlnet guide, intermediate images, and the final output — all sharing
the same job_id.  This service manages their grouping.
"""

from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any

from ...adapters.db.sqlite import Sqlite
from ...shared import Result, get_logger

logger = get_logger(__name__)

MAX_STACK_NAME_LEN = 200
MAX_STACK_MEMBERS = 500


@dataclass
class StackInfo:
    id: int
    job_id: str
    name: str
    cover_asset_id: int | None
    asset_count: int
    created_at: str
    updated_at: str


@dataclass
class StackMember:
    asset_id: int
    filename: str
    filepath: str
    kind: str
    size: int
    mtime: int
    width: int | None
    height: int | None


class StacksService:
    """CRUD operations for asset stacks."""

    def __init__(self, db: Sqlite):
        self.db = db

    # ── Stack CRUD ───────────────────────────────────────────────────────

    async def create_or_get_stack(self, job_id: str, name: str = "") -> Result[int]:
        """Return the stack id for *job_id*, creating a new row if needed."""
        if not job_id or not str(job_id).strip():
            return Result.Err("INVALID_INPUT", "job_id is required")
        job_id = str(job_id).strip()
        name = str(name or "").strip()[:MAX_STACK_NAME_LEN]

        existing = await self.db.aquery(
            "SELECT id FROM asset_stacks WHERE job_id = ?", (job_id,)
        )
        if existing.ok and existing.data:
            return Result.Ok(int(existing.data[0]["id"]))

        now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        insert = await self.db.aexecute(
            "INSERT INTO asset_stacks (job_id, name, asset_count, created_at, updated_at) "
            "VALUES (?, ?, 0, ?, ?)",
            (job_id, name, now, now),
        )
        if not insert.ok:
            # Another worker may have created the row after our existence check.
            existing = await self.db.aquery(
                "SELECT id FROM asset_stacks WHERE job_id = ?", (job_id,)
            )
            if existing.ok and existing.data:
                return Result.Ok(int(existing.data[0]["id"]))
            return Result.Err("DB_ERROR", insert.error or "Failed to create stack")

        # Fetch the new id
        row = await self.db.aquery(
            "SELECT id FROM asset_stacks WHERE job_id = ?", (job_id,)
        )
        if row.ok and row.data:
            return Result.Ok(int(row.data[0]["id"]))
        return Result.Err("DB_ERROR", "Stack created but id not found")

    async def get_stack(self, stack_id: int) -> Result[StackInfo]:
        row = await self.db.aquery(
            "SELECT * FROM asset_stacks WHERE id = ?", (stack_id,)
        )
        if not row.ok or not row.data:
            return Result.Err("NOT_FOUND", f"Stack {stack_id} not found")
        return Result.Ok(_row_to_stack_info(row.data[0]))

    async def get_stack_by_job_id(self, job_id: str) -> Result[StackInfo]:
        row = await self.db.aquery(
            "SELECT * FROM asset_stacks WHERE job_id = ?", (str(job_id).strip(),)
        )
        if not row.ok or not row.data:
            return Result.Err("NOT_FOUND", f"No stack for job_id={job_id}")
        return Result.Ok(_row_to_stack_info(row.data[0]))

    async def list_stacks(
        self,
        limit: int = 50,
        offset: int = 0,
        include_total: bool = False,
    ) -> Result[dict[str, Any]]:
        limit = max(1, min(200, int(limit)))
        offset = max(0, int(offset))

        rows_res = await self.db.aquery(
            "SELECT s.*, "
            "  a.filename AS cover_filename, a.filepath AS cover_filepath, "
            "  a.kind AS cover_kind, a.width AS cover_width, a.height AS cover_height "
            "FROM asset_stacks s "
            "LEFT JOIN assets a ON s.cover_asset_id = a.id "
            "WHERE s.asset_count > 0 "
            "ORDER BY s.created_at DESC "
            "LIMIT ? OFFSET ?",
            (limit, offset),
        )
        if not rows_res.ok:
            return Result.Err("DB_ERROR", rows_res.error or "Failed to list stacks")

        stacks = []
        for r in rows_res.data or []:
            info = _row_to_stack_info(r)
            entry: dict[str, Any] = {
                "id": info.id,
                "job_id": info.job_id,
                "name": info.name,
                "cover_asset_id": info.cover_asset_id,
                "asset_count": info.asset_count,
                "created_at": info.created_at,
                "updated_at": info.updated_at,
                "cover_filename": r.get("cover_filename"),
                "cover_filepath": r.get("cover_filepath"),
                "cover_kind": r.get("cover_kind"),
                "cover_width": r.get("cover_width"),
                "cover_height": r.get("cover_height"),
            }
            stacks.append(entry)

        total = None
        if include_total:
            count_res = await self.db.aquery(
                "SELECT COUNT(*) as total FROM asset_stacks WHERE asset_count > 0"
            )
            if count_res.ok and count_res.data:
                total = int(count_res.data[0]["total"])

        return Result.Ok({"stacks": stacks, "total": total, "limit": limit, "offset": offset})

    # ── Membership ───────────────────────────────────────────────────────

    async def assign_asset(self, asset_id: int, stack_id: int) -> Result[bool]:
        """Assign an asset to a stack and update the stack's asset_count."""
        res = await self.db.aexecute(
            "UPDATE assets SET stack_id = ? WHERE id = ?", (stack_id, asset_id)
        )
        if not res.ok:
            return Result.Err("DB_ERROR", res.error or "Failed to assign asset to stack")
        await self._refresh_stack_count(stack_id)
        return Result.Ok(True)

    async def assign_asset_by_job_id(self, asset_id: int, job_id: str) -> Result[int]:
        """Ensure a stack exists for *job_id*, assign the asset, return stack_id."""
        stack_res = await self.create_or_get_stack(job_id)
        if not stack_res.ok:
            return stack_res
        stack_id = _coerce_stack_id(stack_res.data)
        if stack_id is None:
            return Result.Err("DB_ERROR", "Stack created but id is invalid")
        assign_res = await self.assign_asset(asset_id, stack_id)
        if not assign_res.ok:
            return Result.Err(str(assign_res.code or "DB_ERROR"), assign_res.error or "Failed to assign asset")
        return Result.Ok(stack_id)

    async def get_members(self, stack_id: int) -> Result[list[dict[str, Any]]]:
        """Return all assets belonging to a stack."""
        res = await self.db.aquery(
            "SELECT a.id, a.filename, a.filepath, a.kind, a.ext, "
            "  a.size, a.mtime, a.width, a.height, a.duration, "
            "  a.source, a.root_id, "
            "  a.source_node_id, a.source_node_type, "
            "  COALESCE(m.rating, 0) as rating, "
            "  COALESCE(m.tags, '[]') as tags, "
            "  m.has_workflow, m.has_generation_data "
            "FROM assets a "
            "LEFT JOIN asset_metadata m ON a.id = m.asset_id "
            "WHERE a.stack_id = ? "
            "ORDER BY a.mtime ASC",
            (stack_id,),
        )
        if not res.ok:
            return Result.Err("DB_ERROR", res.error or "Failed to get stack members")
        return Result.Ok([dict(r) for r in res.data or []])

    async def get_members_by_job_id(self, job_id: str) -> Result[list[dict[str, Any]]]:
        """Return all assets sharing *job_id* (even if no stack row exists yet)."""
        res = await self.db.aquery(
            "SELECT a.id, a.filename, a.filepath, a.kind, a.ext, "
            "  a.size, a.mtime, a.width, a.height, a.duration, "
            "  a.source, a.root_id, "
            "  a.source_node_id, a.source_node_type, "
            "  COALESCE(m.rating, 0) as rating, "
            "  COALESCE(m.tags, '[]') as tags, "
            "  m.has_workflow, m.has_generation_data "
            "FROM assets a "
            "LEFT JOIN asset_metadata m ON a.id = m.asset_id "
            "WHERE a.job_id = ? "
            "ORDER BY a.mtime ASC",
            (str(job_id).strip(),),
        )
        if not res.ok:
            return Result.Err("DB_ERROR", res.error or "Failed to get members by job_id")
        return Result.Ok([dict(r) for r in res.data or []])

    # ── Cover management ─────────────────────────────────────────────────

    async def set_cover(self, stack_id: int, cover_asset_id: int) -> Result[bool]:
        now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        res = await self.db.aexecute(
            "UPDATE asset_stacks SET cover_asset_id = ?, updated_at = ? WHERE id = ?",
            (cover_asset_id, now, stack_id),
        )
        if not res.ok:
            return Result.Err("DB_ERROR", res.error or "Failed to set cover")
        return Result.Ok(True)

    async def auto_select_cover(self, stack_id: int) -> Result[int | None]:
        """Pick the best cover asset for a stack (largest image, or last file)."""
        res = await self.db.aquery(
            "SELECT id FROM assets "
            "WHERE stack_id = ? AND kind = 'image' "
            "ORDER BY size DESC, mtime DESC LIMIT 1",
            (stack_id,),
        )
        if res.ok and res.data:
            cover_id = int(res.data[0]["id"])
            await self.set_cover(stack_id, cover_id)
            return Result.Ok(cover_id)

        # Fallback: last created file of any kind
        res = await self.db.aquery(
            "SELECT id FROM assets WHERE stack_id = ? ORDER BY mtime DESC LIMIT 1",
            (stack_id,),
        )
        if res.ok and res.data:
            cover_id = int(res.data[0]["id"])
            await self.set_cover(stack_id, cover_id)
            return Result.Ok(cover_id)

        return Result.Ok(None)

    # ── Dissolve / merge ─────────────────────────────────────────────────

    async def dissolve(self, stack_id: int) -> Result[bool]:
        """Remove the stack and un-assign all member assets."""
        await self.db.aexecute(
            "UPDATE assets SET stack_id = NULL WHERE stack_id = ?", (stack_id,)
        )
        await self.db.aexecute(
            "DELETE FROM asset_stacks WHERE id = ?", (stack_id,)
        )
        return Result.Ok(True)

    async def merge_into(self, target_stack_id: int, source_stack_ids: list[int]) -> Result[bool]:
        """Move all assets from source stacks into target, then delete sources."""
        for src_id in source_stack_ids:
            if src_id == target_stack_id:
                continue
            await self.db.aexecute(
                "UPDATE assets SET stack_id = ? WHERE stack_id = ?",
                (target_stack_id, src_id),
            )
            await self.db.aexecute(
                "DELETE FROM asset_stacks WHERE id = ?", (src_id,)
            )
        await self._refresh_stack_count(target_stack_id)
        return Result.Ok(True)

    # ── Auto-stacking ────────────────────────────────────────────────────

    async def auto_stack_by_job_id(self, job_id: str | None = None) -> Result[dict[str, Any]]:
        """Scan for assets with a job_id but no stack_id, and group them.

        When *job_id* is provided, only that exact execution job is finalized.
        """
        job_ids: list[str] = []
        exact_job_id = str(job_id or "").strip()

        if exact_job_id:
            res = await self.db.aquery(
                "SELECT DISTINCT job_id FROM assets "
                "WHERE job_id = ? AND stack_id IS NULL",
                (exact_job_id,),
            )
        else:
            res = await self.db.aquery(
                "SELECT DISTINCT job_id FROM assets "
                "WHERE job_id IS NOT NULL AND job_id != '' AND stack_id IS NULL"
            )
        if not res.ok:
            return Result.Err("DB_ERROR", res.error or "Failed to query pending stacks")

        for row in res.data or []:
            current_job_id = str(row.get("job_id") or "").strip()
            if current_job_id:
                job_ids.append(current_job_id)

        created = 0
        finalized: list[dict[str, Any]] = []

        for current_job_id in job_ids:
            finalized_entry = await self._finalize_job_stack(current_job_id)
            if not finalized_entry:
                continue
            created += 1
            finalized.append(finalized_entry)

        logger.info("Auto-stacking finalized %d stack(s)", created)
        return Result.Ok(
            {
                "created": created,
                "targeted_job_id": exact_job_id or None,
                "stacks": finalized,
            }
        )

    async def auto_stack_by_workflow_hash(self, mtime_window_s: int = 30) -> Result[int]:
        """Heuristic stacking for assets without job_id.

        Groups assets sharing the same workflow_hash whose mtime values are
        within *mtime_window_s* seconds of each other.  This is a fallback
        when core assets is not enabled.

        Returns the number of newly created stacks.
        """
        res = await self.db.aquery(
            "SELECT a.id, a.mtime, m.workflow_hash "
            "FROM assets a "
            "JOIN asset_metadata m ON a.id = m.asset_id "
            "WHERE a.stack_id IS NULL "
            "  AND (a.job_id IS NULL OR a.job_id = '') "
            "  AND m.workflow_hash IS NOT NULL AND m.workflow_hash != '' "
            "ORDER BY m.workflow_hash, a.mtime"
        )
        if not res.ok or not res.data:
            return Result.Ok(0)

        # Group contiguous assets by (workflow_hash, mtime proximity)
        groups: list[list[dict]] = []
        current_group: list[dict] = []
        prev_hash: str = ""
        prev_mtime: int = 0

        for row in res.data:
            wh = str(row.get("workflow_hash") or "")
            mt = int(row.get("mtime") or 0)
            if wh == prev_hash and abs(mt - prev_mtime) <= mtime_window_s:
                current_group.append(dict(row))
            else:
                if len(current_group) > 1:
                    groups.append(current_group)
                current_group = [dict(row)]
            prev_hash = wh
            prev_mtime = mt
        if len(current_group) > 1:
            groups.append(current_group)

        created = 0
        for group in groups:
            # Use workflow_hash + first mtime as synthetic job_id
            wh = str(group[0].get("workflow_hash") or "")
            mt = int(group[0].get("mtime") or 0)
            synthetic_job_id = f"wfh:{wh}:{mt}"

            stack_res = await self.create_or_get_stack(synthetic_job_id)
            if not stack_res.ok:
                continue
            stack_id = _coerce_stack_id(stack_res.data)
            if stack_id is None:
                logger.warning("Invalid synthetic stack id for workflow_hash=%s", wh)
                continue

            for member in group:
                await self.db.aexecute(
                    "UPDATE assets SET stack_id = ? WHERE id = ?",
                    (stack_id, int(member["id"])),
                )
            await self._refresh_stack_count(stack_id)
            await self.auto_select_cover(stack_id)
            created += 1

        logger.info("Heuristic stacking created %d stacks", created)
        return Result.Ok(created)

    # ── Internal helpers ─────────────────────────────────────────────────

    async def _refresh_stack_count(self, stack_id: int) -> None:
        now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        await self.db.aexecute(
            "UPDATE asset_stacks SET "
            "  asset_count = (SELECT COUNT(*) FROM assets WHERE stack_id = ?), "
            "  updated_at = ? "
            "WHERE id = ?",
            (stack_id, now, stack_id),
        )

    async def _finalize_job_stack(self, job_id: str) -> dict[str, Any] | None:
        current_job_id = str(job_id or "").strip()
        if not current_job_id:
            return None

        async with self.db.atransaction(mode="immediate") as tx:
            if not tx.ok:
                logger.warning("Failed to begin stack finalization transaction for job_id=%s: %s", current_job_id, tx.error)
                return None

            stack_res = await self.create_or_get_stack(current_job_id)
            if not stack_res.ok:
                logger.warning("Failed to create stack for job_id=%s: %s", current_job_id, stack_res.error)
                return None
            stack_id = _coerce_stack_id(stack_res.data)
            if stack_id is None:
                logger.warning("Invalid stack id for job_id=%s", current_job_id)
                return None

            assign_res = await self.db.aexecute(
                "UPDATE assets SET stack_id = ? "
                "WHERE job_id = ? AND stack_id IS NULL",
                (stack_id, current_job_id),
            )
            if not assign_res.ok:
                logger.warning("Failed to assign assets to stack for job_id=%s: %s", current_job_id, assign_res.error)
                return None

            count_res = await self.db.aquery(
                "SELECT COUNT(*) AS total FROM assets WHERE stack_id = ?",
                (stack_id,),
            )
            member_count = 0
            if count_res.ok and count_res.data:
                try:
                    member_count = int(count_res.data[0].get("total") or 0)
                except Exception:
                    member_count = 0

            await self._refresh_stack_count(stack_id)
            await self.auto_select_cover(stack_id)

        return {
            "job_id": current_job_id,
            "stack_id": stack_id,
            "asset_count": member_count,
        }


def _row_to_stack_info(row: dict[str, Any]) -> StackInfo:
    return StackInfo(
        id=int(row.get("id") or 0),
        job_id=str(row.get("job_id") or ""),
        name=str(row.get("name") or ""),
        cover_asset_id=int(row["cover_asset_id"]) if row.get("cover_asset_id") else None,
        asset_count=int(row.get("asset_count") or 0),
        created_at=str(row.get("created_at") or ""),
        updated_at=str(row.get("updated_at") or ""),
    )


def _coerce_stack_id(value: object) -> int | None:
    if isinstance(value, int):
        return value if value > 0 else None
    if isinstance(value, str):
        raw = value.strip()
        if not raw:
            return None
        try:
            parsed = int(raw)
        except ValueError:
            return None
        return parsed if parsed > 0 else None
    return None
