"""
Background duplicate/similarity analysis.
"""
from __future__ import annotations

import asyncio
import hashlib
import json
from pathlib import Path
from typing import Any, Dict, List, Optional

from PIL import Image

from ...adapters.db.sqlite import Sqlite
from ...shared import Result, get_logger

logger = get_logger(__name__)


def _safe_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except Exception:
        return default


def _compute_file_hash(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        while True:
            chunk = f.read(1024 * 1024)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()


def _compute_phash_hex(path: Path) -> Optional[str]:
    try:
        with Image.open(path) as im:
            g = im.convert("L").resize((8, 8), Image.Resampling.LANCZOS)
            px = list(g.tobytes())
        if not px:
            return None
        avg = sum(px) / len(px)
        bits = 0
        for i, v in enumerate(px):
            if v >= avg:
                bits |= (1 << i)
        return f"{bits:016x}"
    except Exception:
        return None


def _hamming_hex(a: str, b: str) -> int:
    try:
        return (int(a, 16) ^ int(b, 16)).bit_count()
    except Exception:
        return 64


def _build_known_hash_fields(row: Dict[str, Any]) -> tuple[str, str, str]:
    return (
        str(row.get("hash_state") or ""),
        str(row.get("content_hash") or ""),
        str(row.get("phash") or ""),
    )


def _exact_group_item(row: Dict[str, Any]) -> Dict[str, Any]:
    row_data = row or {}
    return {
        "id": _safe_int(row_data.get("id")),
        "filepath": row_data.get("filepath"),
        "filename": row_data.get("filename"),
        "tags": row_data.get("tags") or "[]",
    }


def _similar_pair_side(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": _safe_int(row.get("id")),
        "filepath": row.get("filepath"),
        "filename": row.get("filename"),
    }


def _similar_pair_row(distance: int, left: Dict[str, Any], right: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "distance": distance,
        "left": _similar_pair_side(left),
        "right": _similar_pair_side(right),
    }


def _phash_value(row: Dict[str, Any]) -> str:
    return str((row or {}).get("phash") or "")


class DuplicatesService:
    def __init__(self, db: Sqlite):
        self.db = db
        self._lock = asyncio.Lock()
        self._task: Optional[asyncio.Task] = None
        self._status: Dict[str, Any] = {
            "running": False,
            "processed": 0,
            "updated": 0,
            "errors": 0,
            "last_error": None,
        }

    def _set_status(self, **kwargs) -> None:
        try:
            self._status.update(kwargs)
        except Exception:
            pass

    async def start_background_analysis(self, limit: int = 250) -> Result[Dict[str, Any]]:
        async with self._lock:
            if self._task and not self._task.done():
                return Result.Ok({"started": False, "running": True, "status": self._status})
            self._set_status(running=True, processed=0, updated=0, errors=0, last_error=None)
            self._task = asyncio.create_task(self._run_background(limit=max(10, min(5000, int(limit or 250)))))
            return Result.Ok({"started": True, "running": True, "status": self._status})

    async def get_status(self) -> Result[Dict[str, Any]]:
        running = bool(self._task and not self._task.done())
        self._set_status(running=running)
        return Result.Ok(dict(self._status))

    async def _run_background(self, limit: int) -> None:
        try:
            rows_res = await self._fetch_analysis_rows(limit)
            if not rows_res.ok:
                self._set_status(running=False, last_error=rows_res.error or "Query failed")
                return

            rows = rows_res.data or []
            for row in rows:
                item = self._build_row_context(row)
                self._inc_status("processed")
                if not self._is_row_processable(item):
                    self._inc_status("errors")
                    continue
                if self._row_is_up_to_date(item):
                    continue
                await self._process_hash_update(item)
        except Exception as exc:
            self._set_status(last_error=str(exc))
        finally:
            self._set_status(running=False)

    async def _fetch_analysis_rows(self, limit: int):
        return await self.db.aquery(
            """
            SELECT id, filepath, kind, size, mtime, content_hash, phash, hash_state
            FROM assets
            ORDER BY indexed_at DESC, id DESC
            LIMIT ?
            """,
            (int(limit),),
        )

    def _build_row_context(self, row: Dict[str, Any]) -> Dict[str, Any]:
        row_data = row or {}
        aid = _safe_int(row_data.get("id"))
        fp = str(row_data.get("filepath") or "")
        kind = str(row_data.get("kind") or "").lower()
        size = _safe_int(row_data.get("size"))
        mtime = _safe_int(row_data.get("mtime"))
        known_state, known_content, known_phash = _build_known_hash_fields(row_data)
        return {
            "aid": aid,
            "fp": fp,
            "kind": kind,
            "path": Path(fp),
            "current_state": f"{mtime}:{size}",
            "known_state": known_state,
            "known_content": known_content,
            "known_phash": known_phash,
        }

    def _is_row_processable(self, item: Dict[str, Any]) -> bool:
        path = item["path"]
        return bool(item["aid"] and item["fp"] and path.exists() and path.is_file())

    def _row_is_up_to_date(self, item: Dict[str, Any]) -> bool:
        if item["known_state"] != item["current_state"]:
            return False
        if not item["known_content"]:
            return False
        if item["kind"] == "image" and not item["known_phash"]:
            return False
        return True

    async def _process_hash_update(self, item: Dict[str, Any]) -> None:
        try:
            content_hash = await asyncio.to_thread(_compute_file_hash, item["path"])
            phash = await asyncio.to_thread(_compute_phash_hex, item["path"]) if item["kind"] == "image" else None
            upd = await self.db.aexecute(
                """
                UPDATE assets
                SET content_hash = ?, phash = ?, hash_state = ?
                WHERE id = ?
                """,
                (content_hash, phash, item["current_state"], item["aid"]),
            )
            if upd.ok:
                self._inc_status("updated")
            else:
                self._inc_status("errors")
        except Exception as exc:
            self._inc_status("errors")
            self._status["last_error"] = str(exc)

    def _inc_status(self, key: str, amount: int = 1) -> None:
        self._status[key] = _safe_int(self._status.get(key)) + int(amount)

    @staticmethod
    def _alerts_where_clause(roots: List[str]) -> tuple[str, List[Any]]:
        params: List[Any] = []
        if not roots:
            return "", params
        clauses: List[str] = []
        for root in roots:
            clauses.append("a.filepath LIKE ?")
            params.append(str(Path(str(root)).resolve(strict=False)) + "%")
        return f"WHERE ({' OR '.join(clauses)})", params

    @staticmethod
    def _exact_duplicates_query(where: str) -> str:
        if where:
            return f"""
                SELECT a.id, a.filepath, a.filename, a.content_hash, m.tags
                FROM assets a
                LEFT JOIN asset_metadata m ON m.asset_id = a.id
                {where}
                AND a.content_hash IS NOT NULL
                AND a.content_hash IN (
                    SELECT content_hash
                    FROM assets
                    WHERE content_hash IS NOT NULL
                    GROUP BY content_hash
                    HAVING COUNT(1) > 1
                )
                ORDER BY a.content_hash, a.id
            """
        return """
            SELECT a.id, a.filepath, a.filename, a.content_hash, m.tags
            FROM assets a
            LEFT JOIN asset_metadata m ON m.asset_id = a.id
            WHERE a.content_hash IS NOT NULL
            AND a.content_hash IN (
                SELECT content_hash
                FROM assets
                WHERE content_hash IS NOT NULL
                GROUP BY content_hash
                HAVING COUNT(1) > 1
            )
            ORDER BY a.content_hash, a.id
        """

    @staticmethod
    def _similarity_query(where: str) -> str:
        if where:
            return f"""
                SELECT a.id, a.filepath, a.filename, a.phash
                FROM assets a
                {where}
                AND a.kind = 'image'
                AND a.phash IS NOT NULL
                ORDER BY a.id DESC
                LIMIT 800
            """
        return """
            SELECT a.id, a.filepath, a.filename, a.phash
            FROM assets a
            WHERE a.kind = 'image'
            AND a.phash IS NOT NULL
            ORDER BY a.id DESC
            LIMIT 800
        """

    @staticmethod
    def _build_exact_groups(rows: List[Dict[str, Any]], max_groups: int) -> List[Dict[str, Any]]:
        groups: Dict[str, List[Dict[str, Any]]] = {}
        for row in rows or []:
            row_data = row or {}
            key = str(row_data.get("content_hash") or "")
            if not key:
                continue
            groups.setdefault(key, []).append(_exact_group_item(row_data))

        exact_groups: List[Dict[str, Any]] = []
        for key, items in groups.items():
            if len(items) < 2:
                continue
            exact_groups.append({"hash": key, "count": len(items), "assets": items[:25]})
        exact_groups.sort(key=lambda g: _safe_int(g.get("count")), reverse=True)
        return exact_groups[:max_groups]

    @staticmethod
    def _build_similar_pairs(
        images: List[Dict[str, Any]],
        *,
        phash_distance: int,
        max_pairs: int,
    ) -> List[Dict[str, Any]]:
        similar_pairs: List[Dict[str, Any]] = []
        for i, left_raw in enumerate(images):
            left = left_raw or {}
            lp = _phash_value(left)
            if not lp:
                continue
            reached_limit = DuplicatesService._append_similar_pairs_for_left(
                similar_pairs,
                left,
                lp,
                images[i + 1:],
                phash_distance=phash_distance,
                max_pairs=max_pairs,
            )
            if reached_limit:
                break
        similar_pairs.sort(key=lambda p: _safe_int(p.get("distance"), 64))
        return similar_pairs

    @staticmethod
    def _append_similar_pairs_for_left(
        similar_pairs: List[Dict[str, Any]],
        left: Dict[str, Any],
        left_phash: str,
        right_rows: List[Dict[str, Any]],
        *,
        phash_distance: int,
        max_pairs: int,
    ) -> bool:
        for right_raw in right_rows:
            right = right_raw or {}
            right_phash = _phash_value(right)
            if not right_phash:
                continue
            distance = _hamming_hex(left_phash, right_phash)
            if distance > phash_distance:
                continue
            similar_pairs.append(_similar_pair_row(distance, left, right))
            if len(similar_pairs) >= max_pairs:
                return True
        return False

    async def get_alerts(
        self,
        roots: Optional[List[str]] = None,
        max_groups: int = 6,
        max_pairs: int = 10,
        phash_distance: int = 6,
    ) -> Result[Dict[str, Any]]:
        roots, max_groups, max_pairs, phash_distance = self._normalize_alert_args(
            roots=roots,
            max_groups=max_groups,
            max_pairs=max_pairs,
            phash_distance=phash_distance,
        )
        where, params = self._alerts_where_clause(roots)
        exact_groups_res = await self._query_exact_groups(where, params, max_groups=max_groups)
        if not exact_groups_res.ok:
            return Result.Err("DB_ERROR", exact_groups_res.error or "Duplicate query failed")
        sim_rows_res = await self._query_similarity_rows(where, params)
        if not sim_rows_res.ok:
            return Result.Err("DB_ERROR", sim_rows_res.error or "Similarity query failed")
        similar_pairs = self._build_similar_pairs(
            sim_rows_res.data or [],
            phash_distance=phash_distance,
            max_pairs=max_pairs,
        )
        return Result.Ok({
            "exact_groups": exact_groups_res.data or [],
            "similar_pairs": similar_pairs,
            "status": dict(self._status),
        })

    @staticmethod
    def _normalize_alert_args(
        *,
        roots: Optional[List[str]],
        max_groups: int,
        max_pairs: int,
        phash_distance: int,
    ) -> tuple[List[str], int, int, int]:
        return (
            roots or [],
            max(1, min(50, int(max_groups or 6))),
            max(1, min(100, int(max_pairs or 10))),
            max(0, min(32, int(phash_distance or 6))),
        )

    async def _query_exact_groups(self, where: str, params: List[Any], *, max_groups: int) -> Result[List[Dict[str, Any]]]:
        dup_rows = await self.db.aquery(self._exact_duplicates_query(where), tuple(params))
        if not dup_rows.ok:
            return Result.Err("DB_ERROR", dup_rows.error or "Duplicate query failed")
        return Result.Ok(self._build_exact_groups(dup_rows.data or [], max_groups))

    async def _query_similarity_rows(self, where: str, params: List[Any]) -> Result[List[Dict[str, Any]]]:
        sim_rows = await self.db.aquery(self._similarity_query(where), tuple(params))
        if not sim_rows.ok:
            return Result.Err("DB_ERROR", sim_rows.error or "Similarity query failed")
        return Result.Ok(sim_rows.data or [])

    async def merge_tags_for_group(self, keep_asset_id: int, merge_asset_ids: List[int]) -> Result[Dict[str, Any]]:
        keep_asset_id = int(keep_asset_id or 0)
        merge_ids = self._normalize_merge_ids(keep_asset_id, merge_asset_ids)
        if not keep_asset_id or not merge_ids:
            return Result.Err("INVALID_INPUT", "Invalid keep/merge asset ids")

        ids = [keep_asset_id] + merge_ids
        rows = await self.db.aquery_in(
            "SELECT asset_id, tags FROM asset_metadata WHERE {IN_CLAUSE}",
            "asset_id",
            ids,
        )
        if not rows.ok:
            return Result.Err("DB_ERROR", rows.error or "Failed to load tags")

        merged = self._collect_merged_tags(rows.data or [])

        upd = await self.db.aexecute(
            "UPDATE asset_metadata SET tags = ?, tags_text = ? WHERE asset_id = ?",
            (json.dumps(merged, ensure_ascii=False), " ".join(merged), keep_asset_id),
        )
        if not upd.ok:
            return Result.Err("DB_ERROR", upd.error or "Failed to update tags")
        return Result.Ok({"asset_id": keep_asset_id, "tags": merged, "merged_from": merge_ids})

    def _normalize_merge_ids(self, keep_asset_id: int, merge_asset_ids: List[int]) -> List[int]:
        out: List[int] = []
        for value in merge_asset_ids or []:
            candidate = int(value or 0)
            if candidate > 0 and candidate != keep_asset_id:
                out.append(candidate)
        return out

    def _collect_merged_tags(self, rows: List[Dict[str, Any]]) -> List[str]:
        merged: List[str] = []
        seen: set[str] = set()
        for row in rows:
            for tag in self._extract_tags_from_row(row):
                normalized = tag.strip()
                if not normalized:
                    continue
                key = normalized.lower()
                if key in seen:
                    continue
                seen.add(key)
                merged.append(normalized)
        return merged

    def _extract_tags_from_row(self, row: Dict[str, Any]) -> List[str]:
        raw = (row or {}).get("tags")
        if isinstance(raw, list):
            return [value for value in raw if isinstance(value, str)]
        if not isinstance(raw, str):
            return []
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                return [value for value in parsed if isinstance(value, str)]
        except Exception:
            return []
        return []
