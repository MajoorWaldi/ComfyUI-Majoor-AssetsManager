"""
Hybrid search — combines FTS (BM25) and semantic (CLIP) results with Reciprocal Rank Fusion.

Understands inline search filters:
  rating:N       – minimum star rating
  tag:X          – must have this tag
  kind:image     – filter by file type (image|video|audio|model3d)
  after:YYYY-MM-DD / before:YYYY-MM-DD – asset date window
  ext:png        – file extension filter

Remaining text after stripping filters becomes both the FTS query and the
semantic (CLIP) query, so results from both engines are merged and ranked.
"""

from __future__ import annotations

import asyncio
import re
from typing import Any

from aiohttp import web

from ...config import VECTOR_TEXT_SEARCH_MIN_SCORE, VECTOR_TEXT_SEARCH_RELATIVE_RATIO
from ...features.index.searcher import _build_filter_clauses
from ...shared import Result, get_logger
from ..core import _json_response, _require_services
from ..core.security import _check_rate_limit
from ..search.query_sanitizer import date_bounds_for_exact, parse_request_filters
from .vector_search import (
    _filter_text_search_hits,
    _hits_to_asset_ids,
    _hydrate_vector_results,
    _require_vector_services,
    _rows_to_allowed_set,
)

logger = get_logger(__name__)

_HYBRID_RATE_LIMIT_MAX = 30
_HYBRID_RATE_LIMIT_WINDOW = 60
_HYBRID_VALID_SCOPES = {"output", "input", "custom", "all"}

# ── Inline filter regex patterns ────────────────────────────────────────────

_RE_RATING = re.compile(r"\brating:([1-5])\b", re.IGNORECASE)
_RE_TAG = re.compile(r'\btag:"([^"]+)"|\btag:(\S+)', re.IGNORECASE)
_RE_KIND = re.compile(r"\bkind:(image|video|audio|model3d)\b", re.IGNORECASE)
_RE_AFTER = re.compile(r"\bafter:(\d{4}-\d{2}-\d{2})\b", re.IGNORECASE)
_RE_BEFORE = re.compile(r"\bbefore:(\d{4}-\d{2}-\d{2})\b", re.IGNORECASE)
_RE_EXT = re.compile(r"\bext:(\w+)\b", re.IGNORECASE)


def _normalize_scope(scope: str) -> str:
    value = str(scope or "output").strip().lower()
    return value if value in _HYBRID_VALID_SCOPES else ""


def _build_scope_clauses(scope: str, custom_root_id: str | None) -> tuple[list[str], list[Any]]:
    where: list[str] = []
    params: list[Any] = []
    if scope in {"output", "input", "custom"}:
        where.append("a.source = ?")
        params.append(scope)
    if scope == "custom" and custom_root_id:
        where.append("a.root_id = ?")
        params.append(str(custom_root_id))
    return where, params


async def _filter_semantic_hits(
    db: Any | None,
    hits: list[dict[str, Any]],
    *,
    filters: dict[str, Any],
    scope: str,
    custom_root_id: str | None,
    min_score: float,
    relative_ratio: float,
) -> list[dict[str, Any]]:
    if db is None or not isinstance(hits, list) or not hits:
        return hits if isinstance(hits, list) else []

    hits = _filter_text_search_hits(
        list(hits),
        min_score=min_score,
        relative_ratio=relative_ratio,
    )
    if not hits:
        return []

    asset_ids = _hits_to_asset_ids(hits)
    if not asset_ids:
        return []

    placeholders = ",".join("?" for _ in asset_ids)
    where = [f"a.id IN ({placeholders})"]
    params: list[Any] = list(asset_ids)
    scope_where, scope_params = _build_scope_clauses(scope, custom_root_id)
    filter_where, filter_params = _build_filter_clauses(filters, alias="a")
    where.extend(scope_where)
    params.extend(scope_params)
    params.extend(filter_params)
    where_sql = " AND ".join(where)

    rows = await db.aquery(
        f"""
        SELECT a.id AS asset_id
        FROM assets a
        LEFT JOIN asset_metadata m ON a.id = m.asset_id
        WHERE {where_sql} {' '.join(filter_where)}
        """,
        tuple(params),
    )
    if not rows.ok or not rows.data:
        return []

    allowed = _rows_to_allowed_set(rows.data)
    if not allowed:
        return []

    return [hit for hit in hits if int(hit.get("asset_id") or 0) in allowed]


def _parse_query_filters(raw: str) -> tuple[str, dict[str, Any]]:
    """Strip inline filters from *raw* and return (clean_text, filters_dict)."""
    filters: dict[str, Any] = {}
    q = raw

    m = _RE_RATING.search(q)
    if m:
        filters["min_rating"] = int(m.group(1))
        q = _RE_RATING.sub("", q)

    for m in _RE_TAG.finditer(q):
        tag = (m.group(1) or m.group(2) or "").strip()
        if tag:
            filters.setdefault("tags", []).append(tag)
    q = _RE_TAG.sub("", q)

    m = _RE_KIND.search(q)
    if m:
        filters["kind"] = m.group(1).lower()
        q = _RE_KIND.sub("", q)

    m = _RE_AFTER.search(q)
    if m:
        start, _ = date_bounds_for_exact(m.group(1))
        if start is not None:
            filters["mtime_start"] = start
        q = _RE_AFTER.sub("", q)

    m = _RE_BEFORE.search(q)
    if m:
        _, end = date_bounds_for_exact(m.group(1))
        if end is not None:
            filters["mtime_end"] = end
        q = _RE_BEFORE.sub("", q)

    m = _RE_EXT.search(q)
    if m:
        ext = m.group(1).lower()
        filters.setdefault("extensions", [])
        if ext not in filters["extensions"]:
            filters["extensions"].append(ext)
    q = _RE_EXT.sub("", q)

    return " ".join(q.split()), filters


def _reciprocal_rank_fusion(
    fts_results: list[dict[str, Any]],
    sem_results: list[dict[str, Any]],
    k: int = 60,
) -> list[dict[str, Any]]:
    """Merge two ranked lists with Reciprocal Rank Fusion (RRF).

    Returns items sorted by combined score (descending), with ``_hybridScore``
    and ``_matchType`` fields added to each dict.
    """
    scores: dict[int, float] = {}
    match_types: dict[int, list[str]] = {}

    for rank, item in enumerate(fts_results):
        aid = item.get("asset_id")
        if aid is None:
            continue
        scores[aid] = scores.get(aid, 0.0) + 1.0 / max(1, k + rank + 1)
        match_types.setdefault(aid, []).append("fts")

    for rank, item in enumerate(sem_results):
        aid = item.get("asset_id")
        if aid is None:
            continue
        scores[aid] = scores.get(aid, 0.0) + 1.0 / max(1, k + rank + 1)
        if "semantic" not in match_types.get(aid, []):
            match_types.setdefault(aid, []).append("semantic")

    sorted_ids = sorted(scores, key=lambda x: scores[x], reverse=True)
    return [
        {
            "asset_id": aid,
            "_hybridScore": round(scores[aid], 5),
            "_matchType": "+".join(match_types.get(aid, [])),
        }
        for aid in sorted_ids
    ]


async def _run_fts_search(
    db: Any | None,
    clean_q: str,
    filters: dict[str, Any],
    scope: str,
    custom_root_id: str | None,
    top_k: int,
) -> list[dict[str, Any]]:
    """Run FTS search with filter constraints, return [{asset_id, score}]."""
    if db is None:
        return []
    try:
        where: list[str] = []
        params: list[Any] = []
        scope_where, scope_params = _build_scope_clauses(scope, custom_root_id)
        filter_where, filter_params = _build_filter_clauses(filters, alias="a")
        where.extend(scope_where)
        params.extend(scope_params)
        params.extend(filter_params)

        where_sql = " AND ".join(where) if where else "1=1"

        if clean_q:
            # Blend classic FTS with AI textual hints so short visual queries
            # (e.g. "green") can still match enhanced captions / auto-tags.
            safe_q = clean_q.replace('"', '""')
            like_q = f"%{clean_q.lower()}%"
            query = (
                f"WITH candidates AS ( "
                f"    SELECT a.id AS asset_id, bm25(assets_fts) AS _rank "
                f"    FROM assets_fts "
                f"    JOIN assets a ON assets_fts.rowid = a.id "
                f"    WHERE assets_fts MATCH ? "
                f"    UNION ALL "
                f"    SELECT a.id AS asset_id, bm25(asset_metadata_fts) AS _rank "
                f"    FROM asset_metadata_fts "
                f"    JOIN assets a ON asset_metadata_fts.rowid = a.id "
                f"    WHERE asset_metadata_fts MATCH ? "
                f"    UNION ALL "
                f"    SELECT a.id AS asset_id, 25.0 AS _rank "
                f"    FROM assets a "
                f"    LEFT JOIN vec.asset_embeddings ae ON ae.asset_id = a.id "
                f"    WHERE LOWER(COALESCE(a.enhanced_caption, '')) LIKE ? "
                f"       OR LOWER(COALESCE(ae.auto_tags, '')) LIKE ? "
                f") "
                f"SELECT c.asset_id, MIN(c._rank) AS _rank "
                f"FROM candidates c "
                f"JOIN assets a ON a.id = c.asset_id "
                f"LEFT JOIN asset_metadata m ON a.id = m.asset_id "
                f"WHERE {where_sql} {' '.join(filter_where)} "
                f"GROUP BY c.asset_id "
                f"ORDER BY _rank LIMIT ?"
            )
            rows = await db.aquery(query, (safe_q, safe_q, like_q, like_q, *params, top_k))
        else:
            query = (
                f"SELECT a.id AS asset_id, 0.0 AS _rank "
                f"FROM assets a "
                f"LEFT JOIN asset_metadata m ON a.id = m.asset_id "
                f"WHERE {where_sql} {' '.join(filter_where)} "
                f"ORDER BY a.mtime DESC LIMIT ?"
            )
            rows = await db.aquery(query, (*params, top_k))

        if not rows.ok or not rows.data:
            return []
        return [
            {"asset_id": int(r["asset_id"]), "score": float(r.get("_rank") or 0)}
            for r in rows.data
        ]
    except Exception as exc:
        logger.debug("FTS sub-search failed: %s", exc)
        return []


def register_hybrid_search_routes(routes: web.RouteTableDef) -> None:
    """Register the hybrid search route."""

    @routes.get("/mjr/am/search/hybrid")
    async def hybrid_search(request: web.Request) -> web.Response:
        """Hybrid FTS + semantic search with inline filter parsing.

        Query params:
          q          : raw query (may contain rating:N, tag:X, kind:image, …)
          top_k      : max results (default 50, max 200)
          scope      : output | input | custom (default: output)
          custom_root_id : for scope=custom
        """
        allowed, retry = _check_rate_limit(
            request, "hybrid_search",
            max_requests=_HYBRID_RATE_LIMIT_MAX,
            window_seconds=_HYBRID_RATE_LIMIT_WINDOW,
        )
        if not allowed:
            return _json_response(
                Result.Err("RATE_LIMITED", "Rate limit exceeded", retry_after=retry)
            )

        services, err = await _require_services()
        if err:
            return _json_response(err)
        services_dict = services if isinstance(services, dict) else {}

        raw_q = (request.query.get("q") or "").strip()
        scope = _normalize_scope(request.query.get("scope") or "output")
        if not scope:
            return _json_response(
                Result.Err("INVALID_INPUT", "Invalid scope. Must be one of: output, input, custom, all")
            )
        custom_root_id = (request.query.get("custom_root_id") or "").strip() or None

        try:
            top_k = int(request.query.get("top_k", "50"))
        except (ValueError, TypeError):
            top_k = 50
        top_k = max(1, min(200, top_k))

        clean_q, inline_filters = _parse_query_filters(raw_q)
        filters_res = parse_request_filters(request.query, inline_filters)
        if not filters_res.ok:
            return _json_response(filters_res)
        filters = filters_res.data or {}
        if scope in {"output", "input", "custom"}:
            filters["subfolder"] = str(request.query.get("subfolder") or "")

        db = services_dict.get("db")
        searcher = services_dict.get("vector_searcher")
        if searcher is None:
            # Lazy-init vector services like /vector/search does.
            # If unavailable/disabled, keep hybrid route operational in FTS-only mode.
            try:
                searcher, _verr = _require_vector_services(services_dict)
                if _verr is not None:
                    searcher = None
            except Exception:
                searcher = None

        # Run FTS and semantic in parallel
        fts_coro = _run_fts_search(db, clean_q, filters, scope, custom_root_id, top_k * 2)

        async def _sem_search() -> list[dict[str, Any]]:
            if searcher is None or not clean_q:
                return []
            try:
                res = await searcher.search_by_text(clean_q, top_k=max(top_k * 4, top_k * 2))
                if not res.ok or not res.data:
                    return []
                return await _filter_semantic_hits(
                    db,
                    list(res.data),
                    filters=filters,
                    scope=scope,
                    custom_root_id=custom_root_id,
                    min_score=VECTOR_TEXT_SEARCH_MIN_SCORE,
                    relative_ratio=VECTOR_TEXT_SEARCH_RELATIVE_RATIO,
                )
            except Exception:
                return []

        fts_results, sem_results = await asyncio.gather(fts_coro, _sem_search())

        # Merge results
        if sem_results:
            merged = _reciprocal_rank_fusion(fts_results, sem_results)
        else:
            # FTS-only: assign decreasing RRF-equivalent scores
            merged = [
                {
                    "asset_id": r["asset_id"],
                    "_hybridScore": round(1.0 / (60 + i + 1), 5),
                    "_matchType": "fts",
                }
                for i, r in enumerate(fts_results)
            ]

        merged = merged[:top_k]

        hydrated = await _hydrate_vector_results(services_dict, Result.Ok(merged))
        return _json_response(hydrated)
