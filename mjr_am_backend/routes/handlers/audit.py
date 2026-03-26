"""
Library audit — surfaces assets by completeness / quality score.

Useful for finding assets that are missing tags, ratings, workflow data,
or that have a low prompt-alignment score (image doesn't match its prompt).
"""

from __future__ import annotations

import json as _json
from typing import Any

from aiohttp import web
from mjr_am_backend.shared import Result, get_logger

from ..core import _json_response, _require_services

logger = get_logger(__name__)

_DEFAULT_AUDIT_LIMIT = 200
_MAX_AUDIT_LIMIT = 500
_DEFAULT_AUDIT_OFFSET = 0
_MAX_AUDIT_OFFSET = 100_000


def register_audit_routes(routes: web.RouteTableDef) -> None:
    """Register library audit routes."""

    @routes.get("/mjr/am/audit")
    async def audit_assets(request: web.Request) -> web.Response:
        """Return assets with completeness metadata for library health review.

        Query params:
          scope      : output | input | custom (default: output)
          filter     : incomplete | low_alignment | no_tags | no_rating | no_workflow
                       (default: incomplete)
          sort       : alignment_asc | alignment_desc | completeness_asc | newest | oldest
                       (default: alignment_asc — worst first)
          limit      : max results (default 200, max 500)
          custom_root_id : for scope=custom
        """
        svc, err = await _require_services()
        if err:
            return _json_response(err)
        if not isinstance(svc, dict):
            return _json_response(Result.Err("SERVICE_UNAVAILABLE", "Services unavailable"))
        services = svc

        db = services.get("db")
        scope = (request.query.get("scope") or "output").strip()
        filter_mode = (request.query.get("filter") or "incomplete").strip()
        sort_mode = (request.query.get("sort") or "alignment_asc").strip()
        custom_root_id = (request.query.get("custom_root_id") or "").strip() or None

        try:
            limit = int(request.query.get("limit", str(_DEFAULT_AUDIT_LIMIT)))
        except (ValueError, TypeError):
            limit = _DEFAULT_AUDIT_LIMIT
        limit = max(1, min(_MAX_AUDIT_LIMIT, limit))

        try:
            offset = int(request.query.get("offset", str(_DEFAULT_AUDIT_OFFSET)))
        except (ValueError, TypeError):
            offset = _DEFAULT_AUDIT_OFFSET
        offset = max(0, min(_MAX_AUDIT_OFFSET, offset))

        where: list[str] = ["a.source = ?"]
        params: list[Any] = [scope]

        if custom_root_id:
            where.append("a.root_id = ?")
            params.append(custom_root_id)

        if filter_mode == "no_tags":
            where.append("(COALESCE(m.tags, '') IN ('', '[]'))")
        elif filter_mode == "no_rating":
            where.append("COALESCE(m.rating, 0) = 0")
        elif filter_mode == "no_workflow":
            where.append("COALESCE(m.has_workflow, 0) = 0")
        elif filter_mode == "low_alignment":
            where.append("e.aesthetic_score IS NOT NULL AND e.aesthetic_score < 0.4")
        else:  # incomplete (default): missing any quality signal
            where.append(
                "(COALESCE(m.tags, '') IN ('', '[]') "
                "OR COALESCE(m.rating, 0) = 0 "
                "OR COALESCE(m.has_workflow, 0) = 0)"
            )

        _COMPLETENESS_EXPR = (
            "(CASE WHEN COALESCE(m.tags,'') NOT IN ('','[]') THEN 1 ELSE 0 END "
            "+ CASE WHEN COALESCE(m.rating,0) > 0 THEN 1 ELSE 0 END "
            "+ CASE WHEN COALESCE(m.has_workflow,0) > 0 THEN 1 ELSE 0 END)"
        )

        order_map = {
            "alignment_desc": "e.aesthetic_score DESC NULLS LAST, a.mtime DESC",
            "completeness_asc": f"{_COMPLETENESS_EXPR} ASC, a.mtime DESC",
            "newest": "a.mtime DESC",
            "oldest": "a.mtime ASC",
        }
        order_by = order_map.get(sort_mode, "e.aesthetic_score ASC NULLS FIRST, a.mtime DESC")

        where_sql = " AND ".join(where)
        count_query = (
            f"SELECT COUNT(*) AS total "
            f"FROM assets a "
            f"LEFT JOIN asset_metadata m ON a.id = m.asset_id "
            f"LEFT JOIN vec.asset_embeddings e ON a.id = e.asset_id "
            f"WHERE {where_sql}"
        )
        query = (
            f"SELECT a.id, a.filename, a.subfolder, a.filepath, a.kind, a.source AS type, "
            f"a.mtime, a.size AS file_size, a.width, a.height, "
            f"m.rating, m.tags, m.has_workflow, m.has_generation_data, "
            f"e.aesthetic_score, e.auto_tags "
            f"FROM assets a "
            f"LEFT JOIN asset_metadata m ON a.id = m.asset_id "
            f"LEFT JOIN vec.asset_embeddings e ON a.id = e.asset_id "
            f"WHERE {where_sql} "
            f"ORDER BY {order_by} "
            f"LIMIT ? OFFSET ?"
        )
        page_params = [*params, limit, offset]

        if db is None:
            return _json_response(Result.Err("SERVICE_UNAVAILABLE", "Database service unavailable"))

        try:
            total_rows = await db.aquery(count_query, tuple(params))
            rows = await db.aquery(query, tuple(page_params))
        except Exception as exc:
            return _json_response(Result.Err("DB_ERROR", f"Query failed: {exc}"))

        if not total_rows.ok:
            return _json_response(Result.Err("DB_ERROR", total_rows.error or "Count query failed"))
        if not rows.ok:
            return _json_response(Result.Err("DB_ERROR", rows.error or "Query failed"))

        total = 0
        if total_rows.data:
            try:
                total = int(total_rows.data[0].get("total") or 0)
            except (TypeError, ValueError, AttributeError, IndexError):
                total = 0

        assets = []
        for row in rows.data or []:
            tags_raw = row.get("tags") or ""
            try:
                tags: list[str] = _json.loads(tags_raw) if tags_raw.strip() else []
            except Exception:
                tags = []

            auto_tags_raw = row.get("auto_tags") or "[]"
            try:
                auto_tags: list[str] = _json.loads(auto_tags_raw) if auto_tags_raw.strip() else []
            except Exception:
                auto_tags = []

            has_tags = bool(tags)
            has_rating = int(row.get("rating") or 0) > 0
            has_workflow = bool(row.get("has_workflow"))
            completeness = round(sum([has_tags, has_rating, has_workflow]) / 3.0, 2)

            score = row.get("aesthetic_score")
            assets.append({
                "id": int(row["id"]),
                "filename": row["filename"],
                "subfolder": row.get("subfolder", ""),
                "filepath": row["filepath"],
                "kind": row["kind"],
                "type": row.get("type", "output"),
                "mtime": row.get("mtime"),
                "file_size": row.get("file_size"),
                "width": row.get("width"),
                "height": row.get("height"),
                "rating": int(row.get("rating") or 0),
                "tags": tags,
                "has_workflow": has_workflow,
                "has_generation_data": bool(row.get("has_generation_data")),
                "alignment_score": round(float(score), 4) if score is not None else None,
                "auto_tags": auto_tags,
                "completeness_score": completeness,
                "has_tags": has_tags,
                "has_rating": has_rating,
            })

        response = _json_response(Result.Ok(assets))
        response.headers["X-Total-Count"] = str(total)
        response.headers["X-Limit"] = str(limit)
        response.headers["X-Offset"] = str(offset)
        return response
