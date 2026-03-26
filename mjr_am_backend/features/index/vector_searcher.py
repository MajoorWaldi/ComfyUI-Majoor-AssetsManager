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
an in-memory index.  For small datasets (< ``_IVF_THRESHOLD`` vectors)
a flat inner-product index (``IndexFlatIP``) is used — exact results,
zero training overhead.  For larger datasets an **IVF** (Inverted File)
index is built (``IndexIVFFlat`` with ``nlist ≈ √n``), reducing query
time from O(n) to O(√n) at the cost of a brief one-time training step.
Both index types operate on L2-normalised vectors so inner-product
equals cosine similarity.

The index is **rebuilt lazily** on first use and can be manually
invalidated via ``invalidate()``.
"""

from __future__ import annotations

import asyncio
import math
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

# Datasets below this size use a flat index (exact, no training).
# Above this threshold an IVF index is built for O(√n) queries.
_IVF_THRESHOLD = 4_096

# How many Voronoi cells to probe at query time (higher = more accurate,
# slower). 16 is a good default for nlist ≈ √n up to ~100 K vectors.
_IVF_NPROBE = 16


class VectorSearcher:
    """Faiss-backed nearest-neighbour searcher over asset embeddings."""

    def __init__(self, db: Sqlite, vector_service: VectorService) -> None:
        self.db = db
        self.vs = vector_service
        self._dim = VECTOR_EMBEDDING_DIM
        self._index: Any | None = None  # faiss.IndexFlatIP or faiss.IndexIVFFlat
        self._id_map: list[int] = []   # position → asset_id
        self._lock = asyncio.Lock()
        self._dirty = True

    # ── Index lifecycle ────────────────────────────────────────────────

    def invalidate(self) -> None:
        """Mark the in-memory index as stale (will be rebuilt on next query)."""
        self._dirty = True

    async def prewarm_index(self) -> Result[dict[str, Any]]:
        """Build the in-memory Faiss index ahead of the first semantic query."""
        try:
            await self._ensure_index()
        except Exception as exc:
            return Result.Err("SERVICE_UNAVAILABLE", f"Vector index warmup failed: {exc}")

        total = 0
        try:
            total = int(getattr(self._index, "ntotal", 0) or 0)
        except Exception:
            total = 0

        return Result.Ok({
            "loaded": bool(self._index is not None),
            "total": total,
            "dirty": bool(self._dirty),
        })

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
        """Load embeddings from ``asset_embeddings`` and build the best-fit Faiss index."""
        try:
            import faiss
            import numpy as np
        except ImportError:
            logger.warning("faiss-cpu or numpy not installed — vector search unavailable")
            self._index = None
            self._id_map = []
            return

        # H-12: cap loaded vectors to avoid OOM. Most-recent rows first so
        # freshest assets are always searchable.
        _MAX_ROWS = 100_000
        rows = await self.db.aquery(
            "SELECT asset_id, vector FROM vec.asset_embeddings "
            "WHERE vector IS NOT NULL "
            "ORDER BY rowid DESC "
            f"LIMIT {_MAX_ROWS}"
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
        faiss.normalize_L2(mat)

        n_vectors = mat.shape[0]
        index = self._create_index(faiss, mat, n_vectors)

        self._index = index
        self._id_map = id_map
        logger.info("Vector index built (%d vectors, type=%s)", n_vectors, type(index).__name__)

    @staticmethod
    def _create_index(faiss: Any, mat: Any, n_vectors: int) -> Any:
        """Choose the right Faiss index type based on dataset size.

        - < _IVF_THRESHOLD  → IndexFlatIP  (exact, O(n) but n is small)
        - >= _IVF_THRESHOLD → IndexIVFFlat (approximate, O(√n) per query)
        """
        dim = mat.shape[1]

        if n_vectors < _IVF_THRESHOLD:
            index = faiss.IndexFlatIP(dim)
            index.add(mat)
            return index

        # IVF: nlist ≈ √n, clamped to [16, 1024] for sanity.
        nlist = max(16, min(1024, int(math.sqrt(n_vectors))))
        quantizer = faiss.IndexFlatIP(dim)
        index = faiss.IndexIVFFlat(quantizer, dim, nlist, faiss.METRIC_INNER_PRODUCT)
        index.nprobe = _IVF_NPROBE
        # Training requires a representative sample. Full matrix is fine up to
        # 100 K rows; for much larger datasets we'd sub-sample, but _MAX_ROWS
        # already caps us at 100 K.
        index.train(mat)
        index.add(mat)
        return index

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

        variants = self._semantic_query_variants(query)
        last_error: Result | None = None

        for idx, candidate in enumerate(variants):
            try:
                emb = await self.vs.get_text_embedding(candidate)
            except ModuleNotFoundError as exc:
                return Result.Err("SERVICE_UNAVAILABLE", f"Missing dependency: {exc}")
            except Exception as exc:
                if idx == 0:
                    return Result.Err("SERVICE_UNAVAILABLE", f"Text embedding unavailable: {exc}")
                continue

            if not emb.ok or not emb.data:
                code = str(emb.code or "") if hasattr(emb, "code") else ""
                if code == "SERVICE_UNAVAILABLE":
                    if idx == 0:
                        return Result.Err("SERVICE_UNAVAILABLE", emb.error or "Text embedding unavailable")
                    continue
                last_error = Result.Err("METADATA_FAILED", emb.error or "Text embedding failed")
                continue

            result = await self._query_index(emb.data, top_k=top_k, exclude_ids=set())
            if result.ok and result.data:
                return result
            if not result.ok:
                last_error = result

        if last_error is not None:
            return last_error
        return Result.Ok([])

    @staticmethod
    def _semantic_query_variants(query: str) -> list[str]:
        base = str(query or "").strip()
        if not base:
            return []

        variants: list[str] = [base]
        seen = {base.lower()}

        key = base.lower()
        fr_to_en: dict[str, str] = {
            "animal": "animals pets dog cat",
            "animaux": "animals pets dog cat",
            "chien": "dog puppy canine",
            "chiens": "dogs puppies canines",
            "chat": "cat kitten feline",
            "chats": "cats kittens felines",
            "oiseau": "bird",
            "oiseaux": "birds",
            "cheval": "horse",
            "chevaux": "horses",
            "voiture": "car",
            "voitures": "cars",
            # Common FR -> EN visual color mappings.
            "vert": "green",
            "bleu": "blue",
            "rouge": "red",
            "jaune": "yellow",
            "orange": "orange",
            "violet": "purple",
            "rose": "pink",
            "noir": "black",
            "blanc": "white",
            "gris": "gray",
        }

        color_query_expansions: dict[str, list[str]] = {
            "green": [
                "images with dominant green color tones",
                "green colored objects, backgrounds, or scenes",
            ],
            "blue": [
                "images with dominant blue color tones",
                "blue colored objects, backgrounds, or scenes",
            ],
            "red": [
                "images with dominant red color tones",
                "red colored objects, backgrounds, or scenes",
            ],
            "yellow": [
                "images with dominant yellow color tones",
                "yellow colored objects, backgrounds, or scenes",
            ],
            "orange": [
                "images with dominant orange color tones",
                "orange colored objects, backgrounds, or scenes",
            ],
            "purple": [
                "images with dominant purple color tones",
                "purple colored objects, backgrounds, or scenes",
            ],
            "pink": [
                "images with dominant pink color tones",
                "pink colored objects, backgrounds, or scenes",
            ],
            "black": [
                "dark images with dominant black tones",
                "black colored objects, backgrounds, or scenes",
            ],
            "white": [
                "bright images with dominant white tones",
                "white colored objects, backgrounds, or scenes",
            ],
            "gray": [
                "images with dominant gray tones",
                "gray colored objects, backgrounds, or scenes",
            ],
            "grey": [
                "images with dominant gray tones",
                "gray colored objects, backgrounds, or scenes",
            ],
        }

        translated = str(fr_to_en.get(key, "")).strip()
        if translated and translated.lower() not in seen:
            variants.append(translated)
            seen.add(translated.lower())

        if " " not in base and translated:
            combined = f"{base} {translated}".strip()
            if combined.lower() not in seen:
                variants.append(combined)

        expansion_key = translated.lower() if translated else key
        for phrase in color_query_expansions.get(expansion_key, []):
            candidate = str(phrase or "").strip()
            if candidate and candidate.lower() not in seen:
                variants.append(candidate)
                seen.add(candidate.lower())

        return variants

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
            "SELECT vector FROM vec.asset_embeddings WHERE asset_id = ?",
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
            "SELECT aesthetic_score FROM vec.asset_embeddings WHERE asset_id = ?",
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
            f"SELECT asset_id, aesthetic_score FROM vec.asset_embeddings WHERE asset_id IN ({placeholders})",
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
            "SELECT COUNT(*) as total, AVG(aesthetic_score) as avg_score FROM vec.asset_embeddings"
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
