"""
Auto-clustering utility — groups assets by visual similarity via K-Means.

Usage (CLI)::

    python -m scripts.cluster_assets --db path/to/assets.sqlite --k 10

Or call programmatically::

    from scripts.cluster_assets import cluster_assets
    clusters = await cluster_assets(db, k=10)

The script reads all asset embeddings from the ``asset_embeddings`` table,
runs K-Means clustering (scikit-learn or Faiss), and returns a mapping from
cluster label to a list of ``asset_id`` values.  The caller can then use
these clusters to suggest automatic "Collections".

Design notes
------------
* Pure read-only on the DB — clusters are returned, **not** written.
* Both ``scikit-learn`` and ``faiss-cpu`` K-Means are supported.  The
  script auto-selects whichever is installed (Faiss is preferred for large
  datasets because of GPU/AVX2 acceleration).
* Cross-platform: no OS-specific calls.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Allow running as  ``python -m scripts.cluster_assets``  from project root.
# ---------------------------------------------------------------------------
_PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from mjr_am_backend.config import VECTOR_EMBEDDING_DIM  # noqa: E402
from mjr_am_backend.features.index.vector_service import blob_to_vector  # noqa: E402
from mjr_am_backend.shared import Result, get_logger  # noqa: E402

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# K-Means implementations
# ---------------------------------------------------------------------------


def _kmeans_faiss(matrix, k: int, *, niter: int = 20, seed: int = 42):
    """Run K-Means via Faiss (fast, SIMD-accelerated)."""
    import faiss
    import numpy as np

    dim = matrix.shape[1]
    kmeans = faiss.Kmeans(dim, k, niter=niter, seed=seed, verbose=False)
    kmeans.train(matrix.astype(np.float32))
    _, labels = kmeans.index.search(matrix.astype(np.float32), 1)
    return [int(lbl) for lbl in labels.flatten()]


def _kmeans_sklearn(matrix, k: int, *, seed: int = 42):
    """Run K-Means via scikit-learn (pure-Python fallback)."""
    from sklearn.cluster import KMeans

    model = KMeans(n_clusters=k, random_state=seed, n_init="auto")
    return model.fit_predict(matrix)


def _run_kmeans(matrix, k: int) -> list[int]:
    """Auto-select the best available K-Means backend."""
    try:
        labels = _kmeans_faiss(matrix, k)
        logger.info("K-Means via Faiss completed (%d clusters)", k)
        return [int(lbl) for lbl in labels]
    except ImportError:
        pass
    try:
        labels = _kmeans_sklearn(matrix, k)
        logger.info("K-Means via scikit-learn completed (%d clusters)", k)
        return [int(lbl) for lbl in labels]
    except ImportError:
        raise RuntimeError("Neither faiss-cpu nor scikit-learn is installed") from None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def cluster_assets(
    db,
    *,
    k: int = 10,
    dim: int | None = None,
) -> Result[dict[int, list[int]]]:
    """Cluster all embedded assets into *k* groups.

    Parameters
    ----------
    db : Sqlite
        Database adapter with ``aquery`` method.
    k : int
        Number of clusters.
    dim : int, optional
        Embedding vector dimensionality (defaults to config value).

    Returns
    -------
    Result[dict[int, list[int]]]
        Mapping ``cluster_label → [asset_id, ...]`` on success.
    """
    dim = dim or VECTOR_EMBEDDING_DIM

    rows_result = await db.aquery(
        "SELECT asset_id, vector FROM asset_embeddings WHERE vector IS NOT NULL"
    )
    if not rows_result.ok or not rows_result.data:
        return Result.Err("NOT_FOUND", "No embeddings found in the database")

    try:
        import numpy as np
    except ImportError:
        return Result.Err("TOOL_MISSING", "numpy is required for clustering")

    ids: list[int] = []
    vectors: list[list[float]] = []
    for row in rows_result.data:
        try:
            aid = int(row["asset_id"])
            vec = blob_to_vector(row["vector"], dim)
            ids.append(aid)
            vectors.append(vec)
        except Exception:
            continue

    if len(ids) < k:
        return Result.Err(
            "INVALID_INPUT",
            f"Need at least {k} embeddings to form {k} clusters (found {len(ids)})",
        )

    matrix = np.array(vectors, dtype=np.float32)

    try:
        labels = await asyncio.to_thread(_run_kmeans, matrix, k)
    except RuntimeError as exc:
        return Result.Err("TOOL_MISSING", str(exc))

    clusters: dict[int, list[int]] = {}
    for aid, label in zip(ids, labels, strict=True):
        clusters.setdefault(label, []).append(aid)

    return Result.Ok(clusters)


# ---------------------------------------------------------------------------
# CLI entry-point
# ---------------------------------------------------------------------------


async def _main(args: argparse.Namespace) -> None:
    from mjr_am_backend.adapters.db.sqlite import Sqlite

    db = Sqlite(args.db)
    result = await cluster_assets(db, k=args.k)

    if not result.ok:
        print(f"Error: [{result.code}] {result.error}", file=sys.stderr)
        sys.exit(1)

    clusters = result.data
    print(json.dumps({str(k): v for k, v in clusters.items()}, indent=2))
    print(f"\n{len(clusters)} clusters formed from {sum(len(v) for v in clusters.values())} assets.")

    await db.aclose()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Cluster assets by visual similarity using K-Means on CLIP embeddings."
    )
    parser.add_argument(
        "--db",
        type=str,
        required=True,
        help="Path to the SQLite database (e.g. _mjr_index/assets.sqlite)",
    )
    parser.add_argument(
        "--k",
        type=int,
        default=10,
        help="Number of clusters (default: 10)",
    )
    args = parser.parse_args()
    asyncio.run(_main(args))


if __name__ == "__main__":
    main()
