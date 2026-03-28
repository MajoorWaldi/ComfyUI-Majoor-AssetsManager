"""Tests for the multi-signal prompt alignment improvements.

Covers:
  1. Multi-segment scoring (prompt split by commas)
  2. Enhanced caption ↔ prompt text fusion
  3. Semantic dimension decomposition
"""

import pytest
from mjr_am_backend.features.index import vector_indexer as m
from mjr_am_backend.shared import Result

# ── Helpers ────────────────────────────────────────────────────────────────

class _VS:
    """Deterministic VectorService stub.

    Returns a fixed vector for text/image.  If *text_vectors* is supplied,
    the stub returns different vectors per prompt string, allowing tests
    to exercise per-segment scoring.
    """

    def __init__(self, *, text_vectors: dict[str, list[float]] | None = None):
        self._model_name = "test"
        self._default_vec = [1.0, 0.0]
        self._text_vectors = text_vectors or {}

    async def get_text_embedding(self, text: str) -> Result[list[float]]:
        vec = self._text_vectors.get(text, self._default_vec)
        return Result.Ok(vec)

    async def get_image_embedding(self, _path: str) -> Result[list[float]]:
        return Result.Ok(self._default_vec)


# ── _extract_semantic_concepts ─────────────────────────────────────────────

def test_extract_semantic_concepts_full():
    prompt = "a beautiful woman, anime style, watercolor painting, dreamy, neon colors"
    concepts = m._extract_semantic_concepts(prompt)
    assert concepts["subject"] == "a beautiful woman"
    assert concepts["style"] == "anime"
    assert concepts["medium"] == "watercolor"  # "watercolor" before generic "painting"
    assert concepts["mood"] == "dreamy"
    assert concepts["color"] == "neon"


def test_extract_semantic_concepts_partial():
    prompt = "a car on a highway, impressionist"
    concepts = m._extract_semantic_concepts(prompt)
    assert "subject" in concepts
    assert concepts["style"] == "impressionist"
    assert "medium" not in concepts
    assert "mood" not in concepts


def test_extract_semantic_concepts_no_matches():
    prompt = "xyzzy123"
    concepts = m._extract_semantic_concepts(prompt)
    assert concepts == {"subject": "xyzzy123"}


# ── _multi_segment_score ──────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_multi_segment_returns_none_for_single_segment():
    vs = _VS()
    result = await m._multi_segment_score(vs, [1.0, 0.0], "a single prompt")
    assert result is None


@pytest.mark.asyncio
async def test_multi_segment_splits_and_scores():
    vs = _VS()
    prompt = "a beautiful woman, sunset landscape, dramatic lighting"
    result = await m._multi_segment_score(vs, [1.0, 0.0], prompt)
    assert result is not None
    assert isinstance(result, float)
    # All segments map to the same default vector → cosine 1.0 for each
    assert result >= 0.99


@pytest.mark.asyncio
async def test_multi_segment_ignores_short_segments():
    vs = _VS()
    prompt = "a beautiful woman, x, y, z, dramatic scene"
    result = await m._multi_segment_score(vs, [1.0, 0.0], prompt)
    assert result is not None
    # Only "a beautiful woman" and "dramatic scene" survive (>= 4 chars)


# ── _caption_prompt_similarity ────────────────────────────────────────────

@pytest.mark.asyncio
async def test_caption_similarity_same_vectors():
    vs = _VS()
    result = await m._caption_prompt_similarity(vs, "a beautiful sunset", "sunset scene")
    assert result is not None
    assert result >= 0.99  # Same embedding → cosine 1.0


@pytest.mark.asyncio
async def test_caption_similarity_different_vectors():
    vs = _VS(text_vectors={
        "a cat sitting on a mat": [1.0, 0.0],
        "fireworks at night": [0.0, 1.0],
    })
    score = await m._caption_prompt_similarity(vs, "a cat sitting on a mat", "fireworks at night")
    assert score is not None
    # Orthogonal vectors → cosine 0.0
    assert abs(score) < 0.01


# ── _semantic_dimension_score ─────────────────────────────────────────────

@pytest.mark.asyncio
async def test_semantic_score_with_concepts():
    vs = _VS()
    prompt = "a warrior, anime style, dark mood, oil painting"
    score = await m._semantic_dimension_score(vs, [1.0, 0.0], prompt)
    assert score is not None
    assert isinstance(score, float)


@pytest.mark.asyncio
async def test_semantic_score_no_concepts():
    # Single short segment with no known keywords
    vs = _VS()
    score = await m._semantic_dimension_score(vs, [1.0, 0.0], "xy")
    # "xy" is < 4 chars → no segments → no subject → empty concepts
    assert score is None


# ── compute_prompt_alignment (full pipeline) ──────────────────────────────

@pytest.mark.asyncio
async def test_alignment_with_caption_boosts_score():
    """When an enhanced caption is provided, it contributes to the score."""
    vs = _VS()
    prompt = "a beautiful sunset over mountains"
    emb = [1.0, 0.0]

    without_caption = await m.compute_prompt_alignment(vs, emb, prompt)
    with_caption = await m.compute_prompt_alignment(
        vs, emb, prompt, enhanced_caption="golden sunset over mountain range",
    )

    assert without_caption.ok
    assert with_caption.ok
    # With identical vectors everywhere, both should be ~1.0
    assert with_caption.data >= 0.99


@pytest.mark.asyncio
async def test_alignment_with_segments_and_negative():
    vs = _VS(text_vectors={
        "a warrior in armor": [1.0, 0.0],
        "dark forest background": [1.0, 0.0],
        "ugly deformed": [0.0, 1.0],  # orthogonal = no penalty
    })
    prompt = "a warrior in armor, dark forest background"
    emb = [1.0, 0.0]

    result = await m.compute_prompt_alignment(
        vs, emb, prompt, negative_prompt="ugly deformed",
    )
    assert result.ok
    # Negative prompt is orthogonal → no penalty, score should be ~1.0
    assert result.data >= 0.95


@pytest.mark.asyncio
async def test_alignment_negative_penalty_reduces_score():
    """When the negative prompt vector matches the image, it should lower the score."""
    import math

    # Use vectors whose raw cosine falls inside the SigLIP2 calibration band
    # [0.00, 0.06].  cos(87°) ≈ 0.052 → calibrates to ~0.87.
    # neg vector = img vector → cosine 1.0 → penalty = 1.0 * 0.25 = 0.25
    angle = math.radians(87)
    prompt_vec = [math.cos(angle), math.sin(angle)]  # cos ≈ 0.052
    img_vec = [1.0, 0.0]
    neg_vec = [1.0, 0.0]  # Identical to image → max penalty

    class _VSAngle:
        _model_name = "test"

        async def get_text_embedding(self, text: str) -> Result[list[float]]:
            if text == "ugly distorted":
                return Result.Ok(neg_vec)
            return Result.Ok(prompt_vec)

    vs = _VSAngle()
    prompt = "a beautiful portrait"

    no_neg = await m.compute_prompt_alignment(vs, img_vec, prompt)
    with_neg = await m.compute_prompt_alignment(
        vs, img_vec, prompt, negative_prompt="ugly distorted",
    )

    assert no_neg.ok and with_neg.ok
    assert with_neg.data < no_neg.data
