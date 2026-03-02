"""
Vector search routes — semantic search, find-similar, and alignment endpoints.

All endpoints are gated by ``VECTOR_SEARCH_ENABLED``; when the feature is
disabled the routes still register but return 503 Service Unavailable with
a descriptive message.
"""

from __future__ import annotations

from typing import Any

from aiohttp import web
from mjr_am_backend.config import VECTOR_SIMILAR_TOPK, is_vector_search_enabled
from mjr_am_backend.shared import Result, get_logger

from ..core import _json_response, _require_services
from ..core.security import _check_rate_limit

logger = get_logger(__name__)

_VECTOR_RATE_LIMIT_MAX = 30
_VECTOR_RATE_LIMIT_WINDOW = 60


def _services_dict(services: dict[str, Any] | None) -> dict[str, Any]:
    return services if isinstance(services, dict) else {}


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
        db = services.get("db")
        if db is not None:
            try:
                from ...features.index.vector_searcher import VectorSearcher
                from ...features.index.vector_service import VectorService

                vector_service = services.get("vector_service")
                if vector_service is None:
                    vector_service = VectorService()
                    services["vector_service"] = vector_service
                vs = VectorSearcher(db, vector_service)
                services["vector_searcher"] = vs
                logger.info("Vector services initialized lazily")
            except Exception as exc:
                logger.warning("Lazy vector service init failed: %s", exc)
                vs = None

    if vs is None:
        return None, _json_response(
            Result.Err(
                "SERVICE_UNAVAILABLE",
                "Vector search is unavailable (dependencies/model not ready).",
            ),
        )
    return vs, None


async def _hydrate_vector_results(
    services: dict[str, Any],
    result: Result,
) -> Result:
    """Enrich vector search results with full asset data for grid rendering.

    Takes a ``Result`` whose ``.data`` is a list of ``{"asset_id": int, "score": float}``
    and returns a ``Result`` with ``.data`` being a list of full hydrated asset dicts
    (filepath, filename, kind, tags, rating, …) plus the ``_vectorScore`` field.
    """
    items = result.data or []
    if not items:
        return result

    import json as _json

    asset_ids = [r["asset_id"] for r in items]
    score_map = {r["asset_id"]: r.get("score", 0) for r in items}
    placeholders = ",".join("?" for _ in asset_ids)

    db = services.get("db")
    if db is None:
        return result

    try:
        rows = await db.aquery(
            f"""
            SELECT a.id, a.filepath, a.filename, a.subfolder, a.kind, a.type,
                   a.file_size, a.width, a.height, a.mtime,
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

    row_map: dict[int, Any] = {}
    for row in rows.data:
        row_map[int(row["id"])] = row

    hydrated = []
    for aid in asset_ids:
        row = row_map.get(aid)
        if not row:
            continue

        tags_raw = row.get("tags", "")
        if isinstance(tags_raw, str) and tags_raw.strip():
            try:
                tags = _json.loads(tags_raw)
            except (ValueError, TypeError):
                tags = []
        elif isinstance(tags_raw, list):
            tags = tags_raw
        else:
            tags = []

        hydrated.append({
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
            "rating": row.get("rating", 0),
            "tags": tags,
            "has_workflow": bool(row.get("has_workflow")),
            "has_generation_data": bool(row.get("has_generation_data")),
            "_vectorScore": score_map.get(aid, 0),
        })

    return Result.Ok(hydrated)


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

        searcher, verr = _require_vector_services(services_dict)
        if verr:
            return verr

        query = (request.query.get("q") or "").strip()
        if not query:
            return _json_response(Result.Err("INVALID_INPUT", "Query parameter 'q' is required"))

        try:
            top_k = int(request.query.get("top_k", str(VECTOR_SIMILAR_TOPK)))
        except (ValueError, TypeError):
            top_k = VECTOR_SIMILAR_TOPK
        top_k = max(1, min(200, top_k))

        result = await searcher.search_by_text(query, top_k=top_k)

        # Hydrate results with full asset data for grid rendering
        if result.ok and result.data:
            result = await _hydrate_vector_results(services_dict, result)

        return _json_response(result)

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

        searcher, verr = _require_vector_services(services_dict)
        if verr:
            return verr

        try:
            asset_id = int(request.match_info["asset_id"])
        except (ValueError, KeyError):
            return _json_response(Result.Err("INVALID_INPUT", "Invalid asset_id"))

        try:
            top_k = int(request.query.get("top_k", str(VECTOR_SIMILAR_TOPK)))
        except (ValueError, TypeError):
            top_k = VECTOR_SIMILAR_TOPK
        top_k = max(1, min(200, top_k))

        result = await searcher.find_similar(asset_id, top_k=top_k)

        # Hydrate results with full asset data for grid rendering
        if result.ok and result.data:
            result = await _hydrate_vector_results(services_dict, result)

        return _json_response(result)

    # ── Prompt-alignment score ─────────────────────────────────────────

    @routes.get("/mjr/am/vector/alignment/{asset_id}")
    async def vector_alignment(request: web.Request) -> web.Response:
        """Retrieve the prompt-alignment score for an asset."""
        services, err = await _require_services()
        if err:
            return _json_response(err)
        services_dict = _services_dict(services)

        searcher, verr = _require_vector_services(services_dict)
        if verr:
            return verr

        try:
            asset_id = int(request.match_info["asset_id"])
        except (ValueError, KeyError):
            return _json_response(Result.Err("INVALID_INPUT", "Invalid asset_id"))

        result = await searcher.get_alignment_score(asset_id)
        return _json_response(result)

    # ── Re-index a single asset ────────────────────────────────────────

    @routes.post("/mjr/am/vector/index/{asset_id}")
    async def vector_index_single(request: web.Request) -> web.Response:
        """Force re-indexing of a single asset's vector embedding."""
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

        from mjr_am_backend.features.index.vector_indexer import index_asset_vector

        result = await index_asset_vector(db, vs, asset_id, filepath, kind)

        # Invalidate in-memory Faiss index
        searcher = services_dict.get("vector_searcher")
        if searcher:
            searcher.invalidate()

        return _json_response(result)

    # ── Vector stats ───────────────────────────────────────────────────

    @routes.get("/mjr/am/vector/stats")
    async def vector_stats(request: web.Request) -> web.Response:
        """Return basic statistics about the vector index."""
        services, err = await _require_services()
        if err:
            return _json_response(err)
        services_dict = _services_dict(services)

        searcher, verr = _require_vector_services(services_dict)
        if verr:
            return verr

        result = await searcher.stats()
        return _json_response(result)

    # ── AI auto-tags for an asset ──────────────────────────────────────

    @routes.get("/mjr/am/vector/auto-tags/{asset_id}")
    async def vector_auto_tags(request: web.Request) -> web.Response:
        """Return AI-suggested tags for an asset (stored separately from user tags)."""
        services, err = await _require_services()
        if err:
            return _json_response(err)
        services_dict = _services_dict(services)

        try:
            asset_id = int(request.match_info["asset_id"])
        except (ValueError, KeyError):
            return _json_response(Result.Err("INVALID_INPUT", "Invalid asset_id"))

        import json as _json

        db = services_dict.get("db")
        if db is None:
            return _json_response(Result.Err("SERVICE_UNAVAILABLE", "Database service unavailable"))
        row = await db.aquery(
            "SELECT auto_tags FROM asset_embeddings WHERE asset_id = ?", (asset_id,)
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

        searcher, verr = _require_vector_services(services_dict)
        if verr:
            return verr

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
            "FROM asset_embeddings ae WHERE ae.vector IS NOT NULL"
        )
        if not rows.ok or not rows.data or len(rows.data) < k:
            return _json_response(
                Result.Err("INSUFFICIENT_DATA", "Not enough indexed assets for clustering")
            )

        try:
            import json as _json
            import numpy as np
            from mjr_am_backend.features.index.vector_service import blob_to_vector

            DIM = 768
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

            mat = np.array(vectors, dtype=np.float32)
            labels: Any
            centroids: Any

            try:
                from sklearn.cluster import MiniBatchKMeans
                km = MiniBatchKMeans(n_clusters=k, random_state=42, n_init=3, max_iter=100)
                labels = km.fit_predict(mat)
                centroids = km.cluster_centers_
            except ImportError:
                try:
                    import faiss
                    kmeans_faiss = faiss.Kmeans(mat.shape[1], k, niter=20, verbose=False)
                    kmeans_faiss.train(mat)
                    _, labels_arr = kmeans_faiss.index.search(mat, 1)
                    labels = labels_arr.flatten()
                    centroids = kmeans_faiss.centroids
                except Exception as exc:
                    return _json_response(
                        Result.Err("TOOL_MISSING", f"Clustering requires scikit-learn or faiss: {exc}")
                    )

            # Fetch filenames for sample thumbnails
            all_ids_flat = list(id_map)
            placeholders = ",".join("?" for _ in all_ids_flat)
            asset_rows = await db.aquery(
                f"SELECT id, filepath, filename, subfolder, type, kind "
                f"FROM assets WHERE id IN ({placeholders})",
                tuple(all_ids_flat),
            )
            asset_map: dict[int, Any] = {}
            if asset_rows.ok and asset_rows.data:
                for r in asset_rows.data:
                    asset_map[int(r["id"])] = r

            clusters = []
            for cluster_id in range(k):
                mask = np.where(labels == cluster_id)[0]
                if len(mask) == 0:
                    continue

                member_vecs = mat[mask]
                centroid = centroids[cluster_id]
                norm = np.linalg.norm(centroid)
                if norm > 0:
                    dists = member_vecs @ centroid / (
                        np.linalg.norm(member_vecs, axis=1) * norm + 1e-8
                    )
                    top3_local = np.argsort(dists)[::-1][:3]
                else:
                    top3_local = range(min(3, len(mask)))

                sample_ids = [id_map[mask[i]] for i in top3_local]

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

            clusters.sort(key=lambda c: -c["size"])
            return _json_response(Result.Ok(clusters))

        except Exception as exc:
            logger.error("Clustering failed: %s", exc)
            return _json_response(Result.Err("CLUSTERING_FAILED", f"Clustering failed: {exc}"))
