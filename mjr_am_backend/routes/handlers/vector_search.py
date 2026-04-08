"""
Vector search routes — semantic search, find-similar, and alignment endpoints.

All endpoints are gated by ``VECTOR_SEARCH_ENABLED``; when the feature is
disabled the routes still register but return 503 Service Unavailable with
a descriptive message.
"""

from __future__ import annotations

import math
from typing import Any

from aiohttp import web

from ...config import (
    VECTOR_SIMILAR_MIN_SCORE,
    VECTOR_SIMILAR_TOPK,
    VECTOR_TEXT_SEARCH_MIN_SCORE,
    VECTOR_TEXT_SEARCH_RELATIVE_RATIO,
    is_vector_search_enabled,
)
from ...features.index.searcher import _build_filter_clauses
from ...features.index.vector_runtime import ensure_vector_runtime
from ...shared import Result, get_logger
from ..core import _json_response, _require_services, safe_error_message
from ..core.security import _check_rate_limit
from ..search.query_sanitizer import parse_request_filters

logger = get_logger(__name__)

_VECTOR_RATE_LIMIT_MAX = 30
_VECTOR_RATE_LIMIT_WINDOW = 60
_VECTOR_HEAVY_RATE_LIMIT_MAX = 10
_VECTOR_HEAVY_RATE_LIMIT_WINDOW = 60
_VECTOR_VALID_SCOPES = {"output", "input", "custom", "all"}


def _hits_to_asset_ids(hits: list[dict[str, Any]]) -> list[int]:
    """Extract positive asset_ids from a list of hit dicts."""
    ids: list[int] = []
    for hit in hits:
        try:
            aid = int(hit.get("asset_id") or 0)
        except Exception:
            aid = 0
        if aid > 0:
            ids.append(aid)
    return ids


def _rows_to_allowed_set(rows_data: list[dict[str, Any]]) -> set[int]:
    """Build a set of allowed asset_ids from DB rows."""
    allowed: set[int] = set()
    for row in rows_data:
        try:
            allowed.add(int(row.get("asset_id") or 0))
        except Exception:
            continue
    return allowed


def _safe_score(raw: Any) -> float:
    """Convert a raw score to a finite float clamped to [0.0, 1.0]."""
    try:
        value = float(raw or 0.0)
    except Exception:
        return 0.0
    return value if math.isfinite(value) else 0.0


def _filter_by_score_floor(hits: list[dict[str, Any]], min_score: float) -> list[dict[str, Any]]:
    """Return hits whose score meets the minimum threshold, with scores sanitized to [0.0, 1.0]."""
    score_floor = max(0.0, min(1.0, float(min_score or 0.0)))
    result: list[dict[str, Any]] = []
    for hit in hits:
        score = _safe_score(hit.get("score"))
        if score >= score_floor:
            result.append({**hit, "score": score})
    return result


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    if not a or not b:
        return 0.0
    n = min(len(a), len(b))
    if n <= 0:
        return 0.0
    dot = 0.0
    na = 0.0
    nb = 0.0
    for i in range(n):
        av = float(a[i])
        bv = float(b[i])
        dot += av * bv
        na += av * av
        nb += bv * bv
    den = math.sqrt(na) * math.sqrt(nb)
    if den <= 1e-12:
        return 0.0
    return dot / den


def _normalise_vector(vec: list[float]) -> list[float]:
    if not vec:
        return []
    norm = math.sqrt(sum(float(v) * float(v) for v in vec))
    if norm <= 1e-12:
        return [float(v) for v in vec]
    return [float(v) / norm for v in vec]


def _mean_vector(vectors: list[list[float]], dim: int) -> list[float]:
    if not vectors or dim <= 0:
        return [0.0] * max(dim, 0)
    out = [0.0] * dim
    for vec in vectors:
        for i in range(min(dim, len(vec))):
            out[i] += float(vec[i])
    scale = 1.0 / max(1, len(vectors))
    return [v * scale for v in out]


def _initial_kmeans_centroids(vectors: list[list[float]], k: int) -> list[list[float]]:
    return [_normalise_vector(list(vectors[i])) for i in range(max(1, min(int(k), len(vectors))))]


def _assign_kmeans_labels(
    vectors: list[list[float]],
    centroids: list[list[float]],
) -> tuple[list[int], bool]:
    labels = [0] * len(vectors)
    changed = False
    for idx, vec in enumerate(vectors):
        best_cluster = 0
        best_score = -1e18
        for cid, centroid in enumerate(centroids):
            score = _cosine_similarity(vec, centroid)
            if score > best_score:
                best_score = score
                best_cluster = cid
        if labels[idx] != best_cluster:
            labels[idx] = best_cluster
            changed = True
    return labels, changed


def _recompute_kmeans_centroids(
    vectors: list[list[float]],
    labels: list[int],
    k: int,
    dim: int,
) -> list[list[float]]:
    grouped: list[list[list[float]]] = [[] for _ in range(k)]
    for idx, lbl in enumerate(labels):
        grouped[int(lbl)].append(vectors[idx])

    centroids: list[list[float]] = []
    for cid in range(k):
        if grouped[cid]:
            centroids.append(_normalise_vector(_mean_vector(grouped[cid], dim)))
        else:
            centroids.append(_normalise_vector(list(vectors[cid % len(vectors)])))
    return centroids


def _kmeans_python(vectors: list[list[float]], k: int, max_iter: int = 12) -> tuple[list[int], list[list[float]]]:
    if not vectors:
        return [], []
    n = len(vectors)
    k = max(1, min(int(k), n))
    dim = len(vectors[0])
    centroids = _initial_kmeans_centroids(vectors, k)
    labels = [0] * n
    for _ in range(max(1, int(max_iter))):
        labels, changed = _assign_kmeans_labels(vectors, centroids)
        centroids = _recompute_kmeans_centroids(vectors, labels, k, dim)
        if not changed:
            break
    return labels, centroids


def _services_dict(services: dict[str, Any] | None) -> dict[str, Any]:
    return services if isinstance(services, dict) else {}


def _vector_rate_limit_response(
    request: web.Request,
    endpoint: str,
    *,
    max_requests: int = _VECTOR_HEAVY_RATE_LIMIT_MAX,
    window_seconds: int = _VECTOR_HEAVY_RATE_LIMIT_WINDOW,
) -> web.Response | None:
    allowed, retry = _check_rate_limit(
        request,
        endpoint,
        max_requests=max_requests,
        window_seconds=window_seconds,
    )
    if allowed:
        return None
    return _json_response(Result.Err("RATE_LIMITED", "Rate limit exceeded", retry_after=retry))


def _normalize_scope_value(raw: Any) -> str:
    scope = str(raw or "all").strip().lower()
    return scope if scope in _VECTOR_VALID_SCOPES else ""


def _read_vector_scope_params(request: web.Request) -> tuple[str, str, Result | None]:
    scope = _normalize_scope_value(request.query.get("scope"))
    if not scope:
        return "", "", Result.Err(
            "INVALID_INPUT",
            "Invalid scope. Must be one of: output, input, custom, all",
        )
    custom_root_id = str(
        request.query.get("custom_root_id")
        or request.query.get("root_id")
        or ""
    ).strip()
    return scope, custom_root_id, None


def _filter_hits_to_allowed_asset_ids(
    hits: list[dict[str, Any]],
    allowed: set[int],
) -> list[dict[str, Any]]:
    if not allowed:
        return []
    return [hit for hit in hits if int(hit.get("asset_id") or 0) in allowed]


async def _filter_hits_by_scope_query(
    db: Any,
    hits: list[dict[str, Any]],
    *,
    scope: str,
    custom_root_id: str,
    filters: dict[str, Any],
) -> list[dict[str, Any]]:
    asset_ids = _hits_to_asset_ids(hits)
    if not asset_ids:
        return []

    placeholders = ",".join("?" for _ in asset_ids)
    where_parts = [f"a.id IN ({placeholders})"]
    params: list[Any] = list(asset_ids)
    if scope in {"output", "input", "custom"}:
        where_parts.append("LOWER(COALESCE(a.source, '')) = ?")
        params.append(scope)
    if scope == "custom" and custom_root_id:
        where_parts.append("a.root_id = ?")
        params.append(custom_root_id)
    filter_clauses, filter_params = _build_filter_clauses(filters, alias="a")
    params.extend(filter_params)

    where_sql = " AND ".join(where_parts)
    rows = await db.aquery(
        (
            "SELECT a.id AS asset_id "
            "FROM assets a "
            "LEFT JOIN asset_metadata m ON a.id = m.asset_id "
            f"WHERE {where_sql} {' '.join(filter_clauses)}"
        ),
        tuple(params),
    )
    if not rows.ok or not rows.data:
        return []
    return _filter_hits_to_allowed_asset_ids(hits, _rows_to_allowed_set(rows.data))


def _parse_hydrated_tags(tags_raw: Any) -> list[Any]:
    import json as _json

    if isinstance(tags_raw, str) and tags_raw.strip():
        try:
            parsed = _json.loads(tags_raw)
        except (ValueError, TypeError):
            return []
        return parsed if isinstance(parsed, list) else []
    if isinstance(tags_raw, list):
        return tags_raw
    return []


def _hydrate_vector_row(row: dict[str, Any], score_map: dict[int, Any], aid: int, extra_fields: dict[int, dict[str, Any]] | None = None) -> dict[str, Any]:
    result = {
        "id": aid,
        "asset_id": aid,
        "filepath": row.get("filepath", ""),
        "filename": row.get("filename", ""),
        "subfolder": row.get("subfolder", ""),
        "kind": row.get("kind", "image"),
        "type": row.get("type", "output"),
        "file_size": row.get("file_size"),
        "width": row.get("width"),
        "height": row.get("height"),
        "mtime": row.get("mtime"),
        "enhanced_caption": row.get("enhanced_caption", "") or "",
        "rating": row.get("rating", 0),
        "tags": _parse_hydrated_tags(row.get("tags", "")),
        "has_workflow": bool(row.get("has_workflow")),
        "has_generation_data": bool(row.get("has_generation_data")),
        "_vectorScore": score_map.get(aid, 0),
    }
    # Preserve hybrid search fields if present
    if extra_fields and aid in extra_fields:
        extras = extra_fields[aid]
        if "_matchType" in extras:
            result["_matchType"] = extras["_matchType"]
        if "_hybridScore" in extras:
            result["_hybridScore"] = extras["_hybridScore"]
    return result


def _hydrate_vector_rows(
    rows: list[dict[str, Any]],
    asset_ids: list[int],
    score_map: dict[int, Any],
    extra_fields: dict[int, dict[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    row_map: dict[int, Any] = {int(row["id"]): row for row in rows}
    hydrated = []
    for aid in asset_ids:
        row = row_map.get(aid)
        if row:
            hydrated.append(_hydrate_vector_row(row, score_map, aid, extra_fields))
    return hydrated


def _best_text_search_threshold(hits: list[dict[str, Any]], min_score: float, relative_ratio: float) -> float:
    ratio = max(0.0, min(1.0, float(relative_ratio or 0.0)))
    floor = max(0.0, min(1.0, float(min_score or 0.0)))
    best_score = 0.0
    for hit in hits:
        try:
            score = float(hit.get("score") or 0.0)
        except Exception:
            score = 0.0
        if score > best_score:
            best_score = score
    return max(floor, best_score * ratio)


def _filter_hits_above_threshold(hits: list[dict[str, Any]], threshold: float) -> list[dict[str, Any]]:
    filtered: list[dict[str, Any]] = []
    for hit in hits:
        try:
            score = float(hit.get("score") or 0.0)
        except Exception:
            score = 0.0
        if score >= threshold:
            filtered.append(hit)
    return filtered


async def _filter_hits_by_kind(db: Any, hits: list[dict[str, Any]], *, query_asset_id: int) -> list[dict[str, Any]]:
    source_row = await db.aquery(
        "SELECT LOWER(COALESCE(kind, '')) AS kind FROM assets WHERE id = ?",
        (int(query_asset_id),),
    )
    if not source_row.ok or not source_row.data:
        return hits
    source_kind = str(source_row.data[0].get("kind") or "").strip().lower()
    if not source_kind:
        return hits

    asset_ids = _hits_to_asset_ids(hits)
    if not asset_ids:
        return []

    placeholders = ",".join("?" for _ in asset_ids)
    rows = await db.aquery(
        f"SELECT id AS asset_id FROM assets WHERE id IN ({placeholders}) AND LOWER(COALESCE(kind, '')) = ?",
        tuple(asset_ids + [source_kind]),
    )
    if not rows.ok or not rows.data:
        return []
    return _filter_hits_to_allowed_asset_ids(hits, _rows_to_allowed_set(rows.data))


async def _filter_hits_by_scope(
    db: Any,
    hits: list[dict[str, Any]],
    *,
    scope: str,
    custom_root_id: str,
    filters: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    if db is None or not isinstance(hits, list) or not hits:
        return hits if isinstance(hits, list) else []
    if scope == "all" and not filters:
        return hits
    return await _filter_hits_by_scope_query(db, hits, scope=scope, custom_root_id=custom_root_id, filters=filters or {})


async def _filter_similar_hits(
    db: Any,
    hits: list[dict[str, Any]],
    *,
    query_asset_id: int,
    min_score: float,
) -> list[dict[str, Any]]:
    if not isinstance(hits, list) or not hits:
        return []

    filtered = _filter_by_score_floor(hits, min_score)
    if not filtered or db is None:
        return filtered
    return await _filter_hits_by_kind(db, filtered, query_asset_id=query_asset_id)


def _filter_text_search_hits(
    hits: list[dict[str, Any]],
    *,
    min_score: float,
    relative_ratio: float,
) -> list[dict[str, Any]]:
    if not isinstance(hits, list) or not hits:
        return []
    threshold = _best_text_search_threshold(hits, min_score, relative_ratio)
    return _filter_hits_above_threshold(hits, threshold)


def _require_vector_services(services: dict[str, Any]):
    """Return (vector_searcher, error_response | None)."""
    if not is_vector_search_enabled():
        return None, _json_response(
            Result.Err(
                "SERVICE_UNAVAILABLE",
                "Vector search is disabled. Enable it in Majoor settings (AI toggle) or set MJR_AM_ENABLE_VECTOR_SEARCH=1.",
            ),
        )

    vs = services.get("vector_searcher")
    if vs is None:
        return None, _json_response(
            Result.Err(
                "SERVICE_UNAVAILABLE",
                "Vector search is unavailable (dependencies/model not ready).",
            ),
        )

    if vs is None:
        return None, _json_response(
            Result.Err(
                "SERVICE_UNAVAILABLE",
                "Vector search is unavailable (dependencies/model not ready).",
            ),
        )
    return vs, None


async def _require_vector_services_async(services: dict[str, Any]):
    if not is_vector_search_enabled():
        return None, _json_response(
            Result.Err(
                "SERVICE_UNAVAILABLE",
                "Vector search is disabled. Enable it in Majoor settings (AI toggle) or set MJR_AM_ENABLE_VECTOR_SEARCH=1.",
            ),
        )
    existing = services.get("vector_searcher") if isinstance(services, dict) else None
    if existing is not None:
        return existing, None
    try:
        _vector_service, vector_searcher = await ensure_vector_runtime(
            services,
            logger=logger,
            reason="vector-routes",
        )
    except Exception as exc:
        logger.warning("Lazy vector service init failed: %s", exc)
        vector_searcher = None
    if vector_searcher is None:
        return None, _json_response(
            Result.Err(
                "SERVICE_UNAVAILABLE",
                "Vector search is unavailable (dependencies/model not ready).",
            ),
        )
    return vector_searcher, None


async def _hydrate_vector_results(
    services: dict[str, Any],
    result: Result,
) -> Result:
    """Enrich vector search results with full asset data for grid rendering.

    Takes a ``Result`` whose ``.data`` is a list of ``{"asset_id": int, "score": float}``
    and returns a ``Result`` with ``.data`` being a list of full hydrated asset dicts
    (filepath, filename, kind, tags, rating, …) plus the ``_vectorScore`` field.
    
    Also preserves ``_matchType`` and ``_hybridScore`` from hybrid search results.
    """
    items = result.data or []
    if not items:
        return result

    asset_ids = [r["asset_id"] for r in items]
    # Build score map: prefer _hybridScore, fall back to score
    score_map = {r["asset_id"]: r.get("_hybridScore") or r.get("score", 0) for r in items}
    # Capture extra hybrid fields (_matchType, _hybridScore) to preserve after hydration
    extra_fields: dict[int, dict[str, Any]] = {}
    for r in items:
        aid = r["asset_id"]
        extras = {}
        if "_matchType" in r:
            extras["_matchType"] = r["_matchType"]
        if "_hybridScore" in r:
            extras["_hybridScore"] = r["_hybridScore"]
        if extras:
            extra_fields[aid] = extras
    placeholders = ",".join("?" for _ in asset_ids)

    db = services.get("db")
    if db is None:
        return result

    try:
        rows = await db.aquery(
            f"""
            SELECT a.id, a.filepath, a.filename, a.subfolder, a.kind,
                     a.source AS type,
                                         a.size AS file_size, a.width, a.height, a.mtime, a.enhanced_caption,
                   m.rating, m.tags, m.has_workflow, m.has_generation_data
            FROM assets a
            LEFT JOIN asset_metadata m ON a.id = m.asset_id
            WHERE a.id IN ({placeholders})
            """,
            tuple(asset_ids),
        )
    except Exception as exc:
        logger.warning("Hydration query failed: %s", exc)
        return result

    if not rows.ok or not rows.data:
        return result

    return Result.Ok(_hydrate_vector_rows(rows.data, asset_ids, score_map, extra_fields))


def register_vector_search_routes(routes: web.RouteTableDef) -> None:
    """Register all vector/semantic search routes."""

    # ── Semantic text search ───────────────────────────────────────────

    @routes.get("/mjr/am/vector/search")
    async def vector_search(request: web.Request) -> web.Response:
        """Semantic search by natural-language query.

        Query params:
          q: text query (required)
          top_k: max results (default: 20)
        """
        allowed, retry = _check_rate_limit(
            request, "vector_search",
            max_requests=_VECTOR_RATE_LIMIT_MAX,
            window_seconds=_VECTOR_RATE_LIMIT_WINDOW,
        )
        if not allowed:
            return _json_response(Result.Err("RATE_LIMITED", "Rate limit exceeded", retry_after=retry))

        services, err = await _require_services()
        if err:
            return _json_response(err)
        services_dict = _services_dict(services)

        searcher, verr = await _require_vector_services_async(services_dict)
        if verr or searcher is None:
            return verr or _json_response(
                Result.Err("SERVICE_UNAVAILABLE", "Vector search is unavailable.")
            )

        query = (request.query.get("q") or "").strip()
        if not query:
            return _json_response(Result.Err("INVALID_INPUT", "Query parameter 'q' is required"))
        scope, custom_root_id, scope_error = _read_vector_scope_params(request)
        if scope_error is not None:
            return _json_response(scope_error)
        filters_res = parse_request_filters(request.query)
        if not filters_res.ok:
            return _json_response(filters_res)
        filters = filters_res.data or {}
        if scope in {"output", "input", "custom"}:
            filters["subfolder"] = str(request.query.get("subfolder") or "")

        try:
            top_k = int(request.query.get("top_k", str(VECTOR_SIMILAR_TOPK)))
        except (ValueError, TypeError):
            top_k = VECTOR_SIMILAR_TOPK
        top_k = max(1, min(200, top_k))

        try:
            search_k = max(top_k, min(1200, top_k * 4))
            result = await searcher.search_by_text(query, top_k=search_k)

            # Hydrate results with full asset data for grid rendering
            if result.ok and result.data:
                db = services_dict.get("db")
                result.data = _filter_text_search_hits(
                    list(result.data or []),
                    min_score=VECTOR_TEXT_SEARCH_MIN_SCORE,
                    relative_ratio=VECTOR_TEXT_SEARCH_RELATIVE_RATIO,
                )
                result.data = (await _filter_hits_by_scope(
                    db,
                    list(result.data or []),
                    scope=scope,
                    custom_root_id=custom_root_id,
                    filters=filters,
                ))[:top_k]
                result = await _hydrate_vector_results(services_dict, result)

            return _json_response(result)
        except Exception as exc:
            logger.warning("Vector text search failed: %s", exc)
            return _json_response(Result.Err("SERVICE_UNAVAILABLE", safe_error_message(exc, "Vector text search failed")))

    # ── Find Similar ───────────────────────────────────────────────────

    @routes.get("/mjr/am/vector/similar/{asset_id}")
    async def vector_find_similar(request: web.Request) -> web.Response:
        """Find assets visually similar to a given asset.

        Path params:
          asset_id: integer asset ID

        Query params:
          top_k: max results (default: 20)
        """
        allowed, retry = _check_rate_limit(
            request, "vector_similar",
            max_requests=_VECTOR_RATE_LIMIT_MAX,
            window_seconds=_VECTOR_RATE_LIMIT_WINDOW,
        )
        if not allowed:
            return _json_response(Result.Err("RATE_LIMITED", "Rate limit exceeded", retry_after=retry))

        services, err = await _require_services()
        if err:
            return _json_response(err)
        services_dict = _services_dict(services)

        searcher, verr = await _require_vector_services_async(services_dict)
        if verr or searcher is None:
            return verr or _json_response(
                Result.Err("SERVICE_UNAVAILABLE", "Vector search is unavailable.")
            )

        try:
            asset_id = int(request.match_info["asset_id"])
        except (ValueError, KeyError):
            return _json_response(Result.Err("INVALID_INPUT", "Invalid asset_id"))

        try:
            top_k = int(request.query.get("top_k", str(VECTOR_SIMILAR_TOPK)))
        except (ValueError, TypeError):
            top_k = VECTOR_SIMILAR_TOPK
        top_k = max(1, min(200, top_k))
        scope, custom_root_id, scope_error = _read_vector_scope_params(request)
        if scope_error is not None:
            return _json_response(scope_error)

        try:
            search_k = max(top_k + 1, min(1201, top_k * 4 + 1))
            result = await searcher.find_similar(asset_id, top_k=search_k)

            # Hydrate results with full asset data for grid rendering
            if result.ok and result.data:
                db = services_dict.get("db")
                result.data = await _filter_similar_hits(
                    db,
                    list(result.data or []),
                    query_asset_id=asset_id,
                    min_score=VECTOR_SIMILAR_MIN_SCORE,
                )
                result.data = (await _filter_hits_by_scope(
                    db,
                    list(result.data or []),
                    scope=scope,
                    custom_root_id=custom_root_id,
                ))[:top_k]
                result = await _hydrate_vector_results(services_dict, result)

            return _json_response(result)
        except Exception as exc:
            logger.warning("Find similar failed: %s", exc)
            return _json_response(Result.Err("SERVICE_UNAVAILABLE", safe_error_message(exc, "Find similar failed")))

    # ── Prompt-alignment score ─────────────────────────────────────────

    @routes.get("/mjr/am/vector/alignment/{asset_id}")
    async def vector_alignment(request: web.Request) -> web.Response:
        """Retrieve the prompt-alignment score for an asset."""
        rate_limited = _vector_rate_limit_response(request, "vector_alignment")
        if rate_limited is not None:
            return rate_limited

        services, err = await _require_services()
        if err:
            return _json_response(err)
        services_dict = _services_dict(services)

        searcher, verr = await _require_vector_services_async(services_dict)
        if verr or searcher is None:
            return verr or _json_response(
                Result.Err("SERVICE_UNAVAILABLE", "Vector search is unavailable.")
            )

        try:
            asset_id = int(request.match_info["asset_id"])
        except (ValueError, KeyError):
            return _json_response(Result.Err("INVALID_INPUT", "Invalid asset_id"))

        try:
            result = await searcher.get_alignment_score(asset_id)
            return _json_response(result)
        except Exception as exc:
            logger.warning("Alignment score failed: %s", exc)
            return _json_response(Result.Err("SERVICE_UNAVAILABLE", safe_error_message(exc, "Alignment score retrieval failed")))

    # ── Re-index a single asset ────────────────────────────────────────

    @routes.post("/mjr/am/vector/index/{asset_id}")
    async def vector_index_single(request: web.Request) -> web.Response:
        """Force re-indexing of a single asset's vector embedding."""
        rate_limited = _vector_rate_limit_response(request, "vector_index")
        if rate_limited is not None:
            return rate_limited

        services, err = await _require_services()
        if err:
            return _json_response(err)
        services_dict = _services_dict(services)

        vs = services_dict.get("vector_service")
        if vs is None:
            return _json_response(
                Result.Err("SERVICE_UNAVAILABLE", "Vector search is not enabled.")
            )

        try:
            asset_id = int(request.match_info["asset_id"])
        except (ValueError, KeyError):
            return _json_response(Result.Err("INVALID_INPUT", "Invalid asset_id"))

        db = services_dict.get("db")
        if db is None:
            return _json_response(Result.Err("SERVICE_UNAVAILABLE", "Database service unavailable"))
        row = await db.aquery(
            "SELECT filepath, kind FROM assets WHERE id = ?", (asset_id,)
        )
        if not row.ok or not row.data:
            return _json_response(Result.Err("NOT_FOUND", f"Asset {asset_id} not found"))

        filepath = row.data[0]["filepath"]
        kind = row.data[0]["kind"]

        from ...features.index.vector_indexer import index_asset_vector

        result = await index_asset_vector(db, vs, asset_id, filepath, kind)

        # Invalidate in-memory Faiss index
        searcher = services_dict.get("vector_searcher")
        if searcher:
            searcher.invalidate()

        return _json_response(result)

    @routes.post("/mjr/am/vector/caption/{asset_id}")
    @routes.post("/mjr/am/vector/enhanced-prompt/{asset_id}")
    async def generate_asset_caption(request: web.Request) -> web.Response:
        """Generate and persist Florence-2 caption for an image asset.

        Primary route: ``/mjr/am/vector/caption/{asset_id}``
        Legacy alias: ``/mjr/am/vector/enhanced-prompt/{asset_id}``
        """
        rate_limited = _vector_rate_limit_response(request, "vector_caption")
        if rate_limited is not None:
            return rate_limited

        services, err = await _require_services()
        if err:
            return _json_response(err)
        services_dict = _services_dict(services)

        if not is_vector_search_enabled():
            return _json_response(Result.Err("SERVICE_UNAVAILABLE", "Vector AI features are disabled"))

        try:
            asset_id = int(request.match_info["asset_id"])
        except (ValueError, KeyError):
            return _json_response(Result.Err("INVALID_INPUT", "Invalid asset_id"))

        db = services_dict.get("db")
        vs = services_dict.get("vector_service")
        if db is None or vs is None:
            return _json_response(Result.Err("SERVICE_UNAVAILABLE", "Vector services are unavailable"))

        try:
            from ...features.index.vector_indexer import generate_enhanced_prompt as _generate

            result = await _generate(db, vs, asset_id)
            return _json_response(result)
        except Exception as exc:
            logger.warning("Caption generation failed: %s", exc)
            return _json_response(Result.Err("SERVICE_UNAVAILABLE", safe_error_message(exc, "Caption generation failed")))

    # Legacy alias requested by user (dash-separated path variant).
    @routes.post("/mjr-am/assets/enhance-prompt")
    @routes.post("/mjr-am/assets/caption")
    async def caption_alias(request: web.Request) -> web.Response:
        """Alias for /mjr/am/vector/caption/{asset_id} accepting JSON body."""
        rate_limited = _vector_rate_limit_response(request, "vector_caption")
        if rate_limited is not None:
            return rate_limited

        services, err = await _require_services()
        if err:
            return _json_response(err)
        services_dict = _services_dict(services)

        if not is_vector_search_enabled():
            return _json_response(Result.Err("SERVICE_UNAVAILABLE", "Vector AI features are disabled"))

        try:
            body = await request.json()
            asset_id = int(body.get("asset_id", 0))
            if asset_id <= 0:
                raise ValueError("asset_id must be a positive integer")
        except Exception:
            return _json_response(Result.Err("INVALID_INPUT", "Request body must contain a valid 'asset_id'"))

        db = services_dict.get("db")
        vs = services_dict.get("vector_service")
        if db is None or vs is None:
            return _json_response(Result.Err("SERVICE_UNAVAILABLE", "Vector services are unavailable"))

        try:
            from ...features.index.vector_indexer import generate_enhanced_prompt as _generate

            result = await _generate(db, vs, asset_id)
            return _json_response(result)
        except Exception as exc:
            logger.warning("Caption generation failed (alias): %s", exc)
            return _json_response(Result.Err("SERVICE_UNAVAILABLE", safe_error_message(exc, "Caption generation failed")))

    # ── Vector stats ───────────────────────────────────────────────────

    @routes.get("/mjr/am/vector/stats")
    async def vector_stats(request: web.Request) -> web.Response:
        """Return basic statistics about the vector index."""
        services, err = await _require_services()
        if err:
            return _json_response(err)
        services_dict = _services_dict(services)

        searcher, verr = await _require_vector_services_async(services_dict)
        if verr or searcher is None:
            return verr or _json_response(
                Result.Err("SERVICE_UNAVAILABLE", "Vector search is unavailable.")
            )

        try:
            result = await searcher.stats()
            return _json_response(result)
        except Exception as exc:
            logger.warning("Vector stats failed: %s", exc)
            return _json_response(Result.Err("SERVICE_UNAVAILABLE", safe_error_message(exc, "Vector stats retrieval failed")))

    # ── AI auto-tags for an asset ──────────────────────────────────────

    @routes.get("/mjr/am/vector/auto-tags/{asset_id}")
    async def vector_auto_tags(request: web.Request) -> web.Response:
        """Return AI-suggested tags for an asset (stored separately from user tags)."""
        rate_limited = _vector_rate_limit_response(request, "vector_auto_tags")
        if rate_limited is not None:
            return rate_limited

        services, err = await _require_services()
        if err:
            return _json_response(err)
        services_dict = _services_dict(services)
        if not is_vector_search_enabled():
            return _json_response(
                Result.Err("SERVICE_UNAVAILABLE", "Vector search is not enabled.")
            )

        try:
            asset_id = int(request.match_info["asset_id"])
        except (ValueError, KeyError):
            return _json_response(Result.Err("INVALID_INPUT", "Invalid asset_id"))

        import json as _json

        db = services_dict.get("db")
        if db is None:
            return _json_response(Result.Err("SERVICE_UNAVAILABLE", "Database service unavailable"))
        row = await db.aquery(
            "SELECT auto_tags FROM vec.asset_embeddings WHERE asset_id = ?", (asset_id,)
        )
        if not row.ok or not row.data:
            return _json_response(Result.Ok([]))

        raw = row.data[0].get("auto_tags") or "[]"
        try:
            tags = _json.loads(raw) if isinstance(raw, str) else []
        except Exception:
            tags = []
        return _json_response(Result.Ok(tags))

    # ── Suggest collections via k-means clustering ─────────────────────

    @routes.post("/mjr/am/vector/suggest-collections")
    async def vector_suggest_collections(request: web.Request) -> web.Response:
        """Cluster asset embeddings and return suggested collection groups.

        Body params (JSON):
          k: number of clusters (default: 8, range: 2-20)
        """
        allowed, retry = _check_rate_limit(
            request, "vector_suggest",
            max_requests=5,
            window_seconds=60,
        )
        if not allowed:
            return _json_response(Result.Err("RATE_LIMITED", "Rate limit exceeded", retry_after=retry))

        services, err = await _require_services()
        if err:
            return _json_response(err)
        services_dict = _services_dict(services)

        searcher, verr = await _require_vector_services_async(services_dict)
        if verr or searcher is None:
            return verr or _json_response(
                Result.Err("SERVICE_UNAVAILABLE", "Vector search is unavailable.")
            )

        try:
            body = await request.json()
            k = int(body.get("k", 8))
        except Exception:
            k = 8
        k = max(2, min(20, k))

        db = services_dict.get("db")
        if db is None:
            return _json_response(Result.Err("SERVICE_UNAVAILABLE", "Database service unavailable"))

        rows = await db.aquery(
            "SELECT ae.asset_id, ae.vector, ae.auto_tags "
            "FROM vec.asset_embeddings ae WHERE ae.vector IS NOT NULL"
        )
        if not rows.ok or not rows.data or len(rows.data) < k:
            return _json_response(
                Result.Err("INSUFFICIENT_DATA", "Not enough indexed assets for clustering")
            )

        try:
            import json as _json

            from ...features.index.vector_service import blob_to_vector

            DIM = int(getattr(searcher, "_dim", 768) or 768)
            id_map: list[int] = []
            vectors: list[list[float]] = []
            auto_tags_map: dict[int, list[str]] = {}

            for row in rows.data:
                try:
                    vec = blob_to_vector(row["vector"], DIM)
                    aid = int(row["asset_id"])
                    vectors.append(vec)
                    id_map.append(aid)
                    raw_tags = row.get("auto_tags", "[]") or "[]"
                    try:
                        auto_tags_map[aid] = _json.loads(raw_tags)
                    except Exception:
                        auto_tags_map[aid] = []
                except Exception:
                    continue

            if len(vectors) < k:
                return _json_response(
                    Result.Err("INSUFFICIENT_DATA", "Not enough valid embeddings for clustering")
                )

            labels_py: list[int]
            centroids_py: list[list[float]]
            try:
                import numpy as np

                mat = np.array(vectors, dtype=np.float32)
                labels_any: Any | None = None
                centroids_any: Any | None = None
                try:
                    from sklearn.cluster import MiniBatchKMeans

                    km = MiniBatchKMeans(n_clusters=k, random_state=42, n_init=3, max_iter=100)
                    labels_any = km.fit_predict(mat)
                    centroids_any = km.cluster_centers_
                except Exception:
                    try:
                        import faiss

                        kmeans_faiss = faiss.Kmeans(mat.shape[1], k, niter=20, verbose=False)
                        kmeans_faiss.train(mat)
                        _, labels_arr = kmeans_faiss.index.search(mat, 1)
                        labels_any = labels_arr.flatten()
                        centroids_any = kmeans_faiss.centroids
                    except Exception:
                        labels_any = None
                        centroids_any = None

                if labels_any is None or centroids_any is None:
                    labels_py, centroids_py = _kmeans_python(vectors, k)
                else:
                    labels_py = [int(x) for x in labels_any.tolist()]
                    centroids_py = [
                        [float(v) for v in row]
                        for row in centroids_any.tolist()
                    ]
            except Exception:
                labels_py, centroids_py = _kmeans_python(vectors, k)

            # Fetch filenames for sample thumbnails
            all_ids_flat = list(id_map)
            placeholders = ",".join("?" for _ in all_ids_flat)
            asset_rows = await db.aquery(
                f"SELECT id, filepath, filename, subfolder, source AS type, kind "
                f"FROM assets WHERE id IN ({placeholders})",
                tuple(all_ids_flat),
            )
            asset_map: dict[int, Any] = {}
            if asset_rows.ok and asset_rows.data:
                for r in asset_rows.data:
                    asset_map[int(r["id"])] = r

            clusters = []
            for cluster_id in range(k):
                mask = [idx for idx, label in enumerate(labels_py) if int(label) == int(cluster_id)]
                if not mask:
                    continue

                centroid = centroids_py[cluster_id] if cluster_id < len(centroids_py) else []
                scored = [(float(_cosine_similarity(vectors[idx], centroid)), idx) for idx in mask]
                scored.sort(key=lambda t: t[0], reverse=True)
                if scored:
                    top_local = [idx for _, idx in scored[:3]]
                else:
                    top_local = mask[:3]

                sample_ids = [id_map[idx] for idx in top_local]

                # Count tag frequencies for label
                tag_counts: dict[str, int] = {}
                for idx in mask:
                    for tag in auto_tags_map.get(id_map[idx], []):
                        tag_counts[tag] = tag_counts.get(tag, 0) + 1
                top_tags = sorted(tag_counts, key=lambda t: -tag_counts[t])[:3]
                label = " / ".join(top_tags) if top_tags else f"Group {cluster_id + 1}"

                sample_assets = [
                    {
                        "id": sid,
                        "filepath": asset_map[sid]["filepath"] if sid in asset_map else "",
                        "filename": asset_map[sid]["filename"] if sid in asset_map else "",
                        "subfolder": asset_map[sid].get("subfolder", "") if sid in asset_map else "",
                        "type": asset_map[sid].get("type", "output") if sid in asset_map else "output",
                        "kind": asset_map[sid].get("kind", "image") if sid in asset_map else "image",
                    }
                    for sid in sample_ids if sid in asset_map
                ]

                clusters.append({
                    "cluster_id": cluster_id,
                    "label": label,
                    "size": int(len(mask)),
                    "sample_assets": sample_assets,
                    "dominant_tags": top_tags,
                    "all_asset_ids": [id_map[i] for i in mask],
                })

            def _cluster_sort_key(item: dict[str, object]) -> int:
                size_value = item.get("size", 0)
                if isinstance(size_value, int):
                    return -size_value
                if isinstance(size_value, float):
                    return -int(size_value)
                if isinstance(size_value, str):
                    try:
                        return -int(size_value)
                    except ValueError:
                        return 0
                return 0

            clusters.sort(key=_cluster_sort_key)
            return _json_response(Result.Ok(clusters))

        except Exception as exc:
            logger.error("Clustering failed: %s", exc)
            return _json_response(Result.Err("CLUSTERING_FAILED", f"Clustering failed: {exc}"))
