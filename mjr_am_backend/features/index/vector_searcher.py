"""
Vector searcher — semantic search & similarity retrieval via Faiss.

This module provides:

1. **Semantic text search** — encode a natural-language query with CLIP
   and retrieve the closest asset embeddings from the Faiss index.
2. **Find Similar** — given an ``asset_id``, return assets whose
   embeddings are closest in cosine distance.
3. **Prompt-alignment score** retrieval — read the pre-computed
   ``aesthetic_score`` stored during indexing.

The Faiss index is loaded from the SQLite ``asset_embeddings`` table into
an in-memory ``IndexFlatIP`` (inner-product, which equals cosine
similarity when vectors are L2-normalised).

The index is **rebuilt lazily** on first use and can be manually
invalidated via ``invalidate()``.
"""

from __future__ import annotations

import asyncio
from typing import Any

from ...adapters.db.sqlite import Sqlite
from ...config import (
    VECTOR_EMBEDDING_DIM,
    is_vector_search_enabled,
    VECTOR_SIMILAR_TOPK,
)
from ...shared import Result, get_logger
from .vector_service import VectorService, blob_to_vector

logger = get_logger(__name__)


class VectorSearcher:
    """Faiss-backed nearest-neighbour searcher over asset embeddings."""

    def __init__(self, db: Sqlite, vector_service: VectorService) -> None:
        self.db = db
        self.vs = vector_service
        self._dim = VECTOR_EMBEDDING_DIM
        self._index: Any | None = None  # faiss.IndexFlatIP
        self._id_map: list[int] = []   # position → asset_id
        self._lock = asyncio.Lock()
        self._dirty = True

    # ── Index lifecycle ────────────────────────────────────────────────

    def invalidate(self) -> None:
        """Mark the in-memory index as stale (will be rebuilt on next query)."""
        self._dirty = True

    async def _ensure_index(self) -> None:
        """Build (or rebuild) the Faiss index from the database."""
        if not self._dirty and self._index is not None:
            return
        async with self._lock:
            if not self._dirty and self._index is not None:
                return
            await self._build_index()
            self._dirty = False

    async def _build_index(self) -> None:
        """Load all embeddings from ``asset_embeddings`` into a Faiss index."""
        try:
            import faiss
            import numpy as np
        except ImportError:
            logger.warning("faiss-cpu or numpy not installed — vector search unavailable")
            self._index = None
            self._id_map = []
            return

        rows = await self.db.aquery(
            "SELECT asset_id, vector FROM asset_embeddings WHERE vector IS NOT NULL"
        )
        if not rows.ok or not rows.data:
            self._index = faiss.IndexFlatIP(self._dim)
            self._id_map = []
            logger.info("Vector index built (0 vectors)")
            return

        id_map: list[int] = []
        vectors: list[list[float]] = []
        for row in rows.data:
            try:
                aid = int(row["asset_id"])
                vec = blob_to_vector(row["vector"], self._dim)
                vectors.append(vec)
                id_map.append(aid)
            except Exception:
                continue

        if not vectors:
            self._index = faiss.IndexFlatIP(self._dim)
            self._id_map = []
            return

        mat = np.array(vectors, dtype=np.float32)
        # Normalise rows (should already be normalised, but be safe)
        faiss.normalize_L2(mat)

        index = faiss.IndexFlatIP(self._dim)
        index.add(mat)

        self._index = index
        self._id_map = id_map
        logger.info("Vector index built (%d vectors)", len(id_map))

    # ── Semantic text search ───────────────────────────────────────────

    async def search_by_text(
        self,
        query: str,
        *,
        top_k: int | None = None,
        filters: dict[str, Any] | None = None,
    ) -> Result[list[dict[str, Any]]]:
        """Search assets using a natural-language text query.

        Returns a list of ``{"asset_id": int, "score": float}`` dicts
        sorted by descending similarity.
        """
        if not is_vector_search_enabled():
            return Result.Err("SERVICE_UNAVAILABLE", "Vector search is disabled")

        top_k = top_k or VECTOR_SIMILAR_TOPK

        emb = await self.vs.get_text_embedding(query)
        if not emb.ok or not emb.data:
            return Result.Err("METADATA_FAILED", emb.error or "Text embedding failed")

        return await self._query_index(emb.data, top_k=top_k, exclude_ids=set())

    # ── Find Similar ───────────────────────────────────────────────────

    async def find_similar(
        self,
        asset_id: int,
        *,
        top_k: int | None = None,
    ) -> Result[list[dict[str, Any]]]:
        """Find assets visually similar to the given *asset_id*.

        The reference asset is excluded from the results.
        """
        if not is_vector_search_enabled():
            return Result.Err("SERVICE_UNAVAILABLE", "Vector search is disabled")

        top_k = top_k or VECTOR_SIMILAR_TOPK

        row = await self.db.aquery(
            "SELECT vector FROM asset_embeddings WHERE asset_id = ?",
            (asset_id,),
        )
        if not row.ok or not row.data:
            return Result.Err("NOT_FOUND", f"No embedding found for asset {asset_id}")

        try:
            vec = blob_to_vector(row.data[0]["vector"], self._dim)
        except Exception as exc:
            return Result.Err("PARSE_ERROR", f"Failed to decode embedding: {exc}")

        return await self._query_index(vec, top_k=top_k + 1, exclude_ids={asset_id})

    # ── Prompt-alignment retrieval ─────────────────────────────────────

    async def get_alignment_score(self, asset_id: int) -> Result[float | None]:
        """Return the pre-computed prompt-alignment score for an asset."""
        row = await self.db.aquery(
            "SELECT aesthetic_score FROM asset_embeddings WHERE asset_id = ?",
            (asset_id,),
        )
        if not row.ok or not row.data:
            return Result.Ok(None)
        score = row.data[0].get("aesthetic_score")
        return Result.Ok(float(score) if score is not None else None)

    # ── Bulk alignment retrieval ───────────────────────────────────────

    async def get_alignment_scores_batch(
        self, asset_ids: list[int]
    ) -> Result[dict[int, float | None]]:
        """Return alignment scores for multiple assets in one query."""
        if not asset_ids:
            return Result.Ok({})
        placeholders = ",".join("?" for _ in asset_ids)
        rows = await self.db.aquery(
            f"SELECT asset_id, aesthetic_score FROM asset_embeddings WHERE asset_id IN ({placeholders})",
            tuple(asset_ids),
        )
        if not rows.ok:
            return Result.Err("DB_ERROR", rows.error or "Query failed")
        result: dict[int, float | None] = {}
        for row in rows.data or []:
            aid = int(row["asset_id"])
            score = row.get("aesthetic_score")
            result[aid] = float(score) if score is not None else None
        return Result.Ok(result)

    # ── Stats ──────────────────────────────────────────────────────────

    async def stats(self) -> Result[dict[str, Any]]:
        """Return basic statistics about the vector index."""
        row = await self.db.aquery(
            "SELECT COUNT(*) as total, AVG(aesthetic_score) as avg_score FROM asset_embeddings"
        )
        if not row.ok or not row.data:
            return Result.Ok({"total": 0, "avg_score": None})
        data = row.data[0]
        return Result.Ok({
            "total": int(data.get("total") or 0),
            "avg_score": round(float(data["avg_score"]), 4) if data.get("avg_score") is not None else None,
            "dim": self._dim,
            "enabled": is_vector_search_enabled(),
        })

    # ── Private helpers ────────────────────────────────────────────────

    async def _query_index(
        self,
        query_vec: list[float],
        *,
        top_k: int,
        exclude_ids: set[int],
    ) -> Result[list[dict[str, Any]]]:
        """Run a Faiss nearest-neighbour query and return scored results."""
        try:
            import faiss
            import numpy as np
        except ImportError:
            return Result.Err("TOOL_MISSING", "faiss-cpu is required for vector search")

        await self._ensure_index()
        if self._index is None or self._index.ntotal == 0:
            return Result.Ok([])

        q = np.array([query_vec], dtype=np.float32)
        faiss.normalize_L2(q)

        # Request more results than needed to account for exclusions.
        k = min(top_k + len(exclude_ids), self._index.ntotal)
        distances, indices = await asyncio.to_thread(self._index.search, q, k)

        results: list[dict[str, Any]] = []
        for dist, idx in zip(distances[0], indices[0], strict=True):
            if idx < 0 or idx >= len(self._id_map):
                continue
            aid = self._id_map[idx]
            if aid in exclude_ids:
                continue
            results.append({"asset_id": aid, "score": round(float(dist), 4)})
            if len(results) >= top_k:
                break

        return Result.Ok(results)
