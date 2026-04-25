"""
Vector indexer — bridges the scan pipeline with VectorService.

After the standard metadata-extraction step, the scanner can call
``index_asset_vector`` to compute and persist the SigLIP2 embedding for a
newly-added or updated asset.

This module also implements **auto-tagging**: the image embedding is
compared against a dictionary of canonical text prompts and any match
above `VECTOR_AUTOTAG_THRESHOLD` is appended to the asset's tags.

Prompt-image alignment
~~~~~~~~~~~~~~~~~~~~~~
``compute_prompt_alignment`` calculates a calibrated alignment score between
an asset's original generation prompt and its image embedding.
The raw cosine similarity is remapped to a meaningful 0–1 scale so that
UI percentages are intuitive.  When a negative prompt is available in the
metadata, its similarity to the image is subtracted (weighted) to penalise
unwanted content that leaked through.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import re
from pathlib import Path
from typing import Any

from ...adapters.db.sqlite import Sqlite
from ...config import (
    VECTOR_AUTOTAG_NSFW_ENABLED,
    VECTOR_AUTOTAG_THRESHOLD,
    is_vector_caption_on_index_enabled,
    is_vector_search_enabled,
)
from ...shared import FileKind, Result, get_logger
from .vector_service import VectorService, vector_to_blob

logger = get_logger(__name__)

_NEG_PROMPT_MARKER_RE = re.compile(r"(?:^|\n)\s*negative prompt:\s*", re.IGNORECASE)
_STEPS_MARKER_RE = re.compile(r"(?:^|\n)\s*steps\s*:\s*\d+", re.IGNORECASE)

# Regex patterns for cleaning prompt text before embedding
_LORA_TAG_RE = re.compile(r"<lora:[^>]*>", re.IGNORECASE)
_EMBEDDING_TAG_RE = re.compile(r"\b(?:embedding|ti):([\w.\-]+)(?::[\d.]+)?", re.IGNORECASE)
_WEIGHT_SYNTAX_RE = re.compile(r"([({\[])([^){}\]]+?):[\d.]+([)}\]])")
_A1111_PARAMS_RE = re.compile(
    r"(?:^|\n)\s*(?:Sampler|CFG scale|Seed|Size|Model hash|Model"
    r"|Clip skip|Denoising strength|Hires \w+|Version|ENSD"
    r"|Eta|Face restoration|Variation seed|Variation seed strength"
    r"|Seed resize from)\s*:",
    re.IGNORECASE,
)
_PATH_LIKE_PROMPT_RE = re.compile(
    r"^(?:[a-z]:[\\/]|[\\/]{1,2}|\.{1,2}[\\/]|~[\\/]).+?[\\/][^\\/\n]+\.(?:png|jpe?g|webp|gif|bmp|tiff?|avif|heic|heif|apng|hdr|svg|mp4|webm|mov|mkv|avi|m4v|mp3|wav|flac|ogg|glb|gltf|obj|fbx|ply|stl|ckpt|safetensors|pt|pth|bin|gguf|json|ya?ml)$",
    re.IGNORECASE,
)

# Regex to split prompts into semantic segments (commas, periods, semicolons)
_SEGMENT_SPLIT_RE = re.compile(r"[,;.]+")
_MIN_SEGMENT_CHARS = 4  # ignore segments shorter than this

# ── Score calibration constants ────────────────────────────────────────────
# SigLIP2 native features (get_image_features / get_text_features) produce
# L2-normalised embeddings whose cosine similarity for well-aligned pairs
# typically falls in the −0.06 to +0.05 range (sigmoid loss → lower raw
# values than CLIP).  We remap this band to a 0–1 UI scale.
_CALIB_LOW = 0.00    # raw score mapped to 0 (floor)
_CALIB_HIGH = 0.06   # raw score mapped to 1 (ceiling)
_NEG_PENALTY_WEIGHT = 0.25  # how much negative-prompt match penalises the score

# ── Multi-signal fusion weights ────────────────────────────────────────────
_W_IMAGE_TEXT = 0.60    # weight for image↔text multi-segment score
_W_CAPTION_TEXT = 0.20  # weight for enhanced_caption↔prompt text similarity
_W_SEMANTIC = 0.20      # weight for semantic dimension decomposition
_SEGMENT_MAX_BOOST = 0.10  # bonus factor for best-matching segment

# ── Semantic dimension categories ──────────────────────────────────────────
# Each dimension has a prefix used to construct a probing prompt.
_SEMANTIC_DIMENSIONS: dict[str, str] = {
    "subject": "a photo depicting",
    "style": "an artwork in the style of",
    "medium": "created using the medium of",
    "mood": "an image with the mood of",
    "color": "an image with the color palette of",
}

# ── Canonical auto-tag vocabulary ──────────────────────────────────────────
# Each entry maps a human-readable tag to a text prompt.
# The prompt is intentionally verbose to improve multimodal classification accuracy.
AUTOTAG_VOCABULARY: dict[str, str] = {
    "portrait": "a close-up portrait photograph of a person",
    "landscape": "a scenic landscape photograph with mountains or fields",
    "cyberpunk": "a cyberpunk style digital artwork with neon lights",
    "anime": "an anime or manga style illustration",
    "photorealistic": "a photorealistic high-resolution photograph",
    "abstract": "an abstract colorful digital artwork",
    "fantasy": "a fantasy illustration with magical elements",
    "sci-fi": "a science fiction scene with futuristic technology",
    "horror": "a dark horror-themed illustration",
    "nature": "a nature photograph of plants, animals, or scenery",
    "architecture": "an architectural photograph of a building or interior",
    "food": "a photograph of food or a dish",
    "vehicle": "a photograph or illustration of a car, motorcycle, or vehicle",
    "character": "a character design or concept art of a person or creature",
    "nsfw": "explicit or suggestive adult content",
    "black-and-white": "a monochrome black and white photograph",
    "watercolor": "a watercolor painting style illustration",
    "pixel-art": "pixel art style retro digital artwork",
    "3d-render": "a 3D rendered digital scene or object",
    "sketch": "a pencil or ink sketch drawing",
}

# Pre-computed text embeddings for the vocabulary (populated lazily).
_autotag_cache: dict[str, list[float]] = {}
_autotag_cache_lock = asyncio.Lock()
_autotag_cache_version: str = ""


def _autotag_cache_version_key(vs: VectorService) -> str:
    payload = {
        "model_name": str(getattr(vs, "_model_name", "") or "").strip(),
        "vocabulary": sorted(_active_autotag_vocabulary().items()),
    }
    encoded = json.dumps(payload, ensure_ascii=False, sort_keys=True).encode("utf-8", errors="ignore")
    return hashlib.sha256(encoded).hexdigest()[:16]


def _active_autotag_vocabulary() -> dict[str, str]:
    """Return the vocabulary actually used for tagging (NSFW gated by setting)."""
    if VECTOR_AUTOTAG_NSFW_ENABLED:
        return AUTOTAG_VOCABULARY
    return {tag: prompt for tag, prompt in AUTOTAG_VOCABULARY.items() if tag != "nsfw"}


def invalidate_autotag_cache() -> None:
    global _autotag_cache, _autotag_cache_version
    _autotag_cache = {}
    _autotag_cache_version = ""


async def _get_autotag_embeddings(vs: VectorService) -> dict[str, list[float]]:
    """Return cached text embeddings for each auto-tag prompt."""
    global _autotag_cache, _autotag_cache_version
    version = _autotag_cache_version_key(vs)

    async with _autotag_cache_lock:
        if _autotag_cache and _autotag_cache_version == version:
            return _autotag_cache

        cache: dict[str, list[float]] = {}
        vocabulary = _active_autotag_vocabulary()
        for tag, prompt in vocabulary.items():
            result = await vs.get_text_embedding(prompt)
            if result.ok and result.data:
                cache[tag] = result.data
            else:
                logger.debug("Auto-tag embedding failed for '%s': %s", tag, result.error)
        _autotag_cache = cache
        _autotag_cache_version = version
        logger.info("Auto-tag vocabulary embedded (%d / %d tags)", len(cache), len(vocabulary))
        return cache


# ── Public API ─────────────────────────────────────────────────────────────


async def index_asset_vector(
    db: Sqlite,
    vs: VectorService,
    asset_id: int,
    filepath: str,
    kind: FileKind,
    *,
    metadata_raw: dict[str, Any] | None = None,
) -> Result[bool]:
    """Compute and persist the multimodal embedding for a single asset.

    Parameters
    ----------
    db : Sqlite
        Database adapter.
    vs : VectorService
        Initialised vector service.
    asset_id : int
        Primary key in the ``assets`` table.
    filepath : str
        Absolute path to the asset file on disk.
    kind : FileKind
        ``"image"`` or ``"video"`` (other kinds are silently skipped).
    metadata_raw : dict, optional
        Parsed metadata JSON for prompt-alignment scoring.

    Returns
    -------
    Result[bool]
        ``Ok(True)`` on success, ``Err(…)`` on failure (non-fatal).
    """
    if not is_vector_search_enabled():
        return Result.Ok(False)

    if kind not in ("image", "video"):
        return Result.Ok(False)

    # 1. Generate embedding
    if kind == "image":
        emb_result = await vs.get_image_embedding(filepath)
    else:
        emb_result = await vs.get_video_embedding(filepath)

    if not emb_result.ok or not emb_result.data:
        logger.debug("Skipping vector index for asset %d: %s", asset_id, emb_result.error)
        return Result.Ok(False)

    vector = emb_result.data

    # 2. Enhanced caption (Florence-2) for image assets (best-effort).
    #    This is intentionally opt-in for automatic indexing: Florence is much
    #    heavier than SigLIP embeddings and made scan/backfill jobs monopolize
    #    the runtime while the grid was waiting for normal indexed assets.
    caption: str | None = None
    if kind == "image" and is_vector_caption_on_index_enabled():
        caption = await _generate_and_store_caption(db, vs, asset_id, filepath)

    # 3. Prompt-image alignment score (optional, uses caption if available)
    aesthetic = await _compute_prompt_alignment(
        vs, vector, metadata_raw, enhanced_caption=caption,
    )

    # 4. Persist embedding
    blob = vector_to_blob(vector)
    store_result = await _store_embedding(db, asset_id, blob, aesthetic, vs._model_name)
    if not store_result.ok:
        return store_result

    # 5. Auto-tagging
    await _apply_autotags(db, vs, asset_id, vector)

    return Result.Ok(True)


async def index_assets_vector_batch(
    db: Sqlite,
    vs: VectorService,
    entries: list[dict[str, Any]],
) -> Result[dict[str, int]]:
    """Batch-index embeddings for multiple assets.

    *entries* is a list of dicts with keys ``asset_id``, ``filepath``,
    ``kind``, and optionally ``metadata_raw``.
    """
    if not is_vector_search_enabled():
        return Result.Ok({"indexed": 0, "skipped": len(entries), "errors": 0})

    stats = {"indexed": 0, "skipped": 0, "errors": 0}
    for entry in entries:
        result = await index_asset_vector(
            db,
            vs,
            asset_id=entry["asset_id"],
            filepath=entry["filepath"],
            kind=entry.get("kind", "image"),
            metadata_raw=entry.get("metadata_raw"),
        )
        if result.ok and result.data:
            stats["indexed"] += 1
        elif result.ok:
            stats["skipped"] += 1
        else:
            stats["errors"] += 1

    return Result.Ok(stats)


def _calibrate_score(raw: float) -> float:
    """Map a raw cosine similarity to a calibrated 0–1 range.

    SigLIP2 cosine similarity for image-text pairs typically clusters in the
    0.15–0.45 band.  This linear rescaling makes the resulting percentage
    meaningful in the UI.
    """
    return max(0.0, min(1.0, (raw - _CALIB_LOW) / (_CALIB_HIGH - _CALIB_LOW)))


def _caption_fallback_title(filepath: str) -> str:
    return Path(filepath).stem.replace("_", " ").replace("-", " ").strip() or "Untitled"


def _normalize_generated_caption(value: Any, *, filepath: str) -> str | None:
    caption = _normalise_title_caption(str(value or "").strip(), fallback_title=_caption_fallback_title(filepath))
    return caption or None


def _coerce_metadata_payload(raw: Any) -> dict[str, Any] | None:
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str) and raw.strip():
        try:
            parsed = json.loads(raw)
        except Exception:
            return None
        return parsed if isinstance(parsed, dict) else None
    return None


def _extract_metadata_text(
    meta: dict[str, Any],
    key_paths: tuple[str, ...],
    *,
    normalizer: Any,
) -> str | None:
    for key_path in key_paths:
        cleaned = _normalize_metadata_candidate(_resolve_key_path(meta, key_path), normalizer)
        if cleaned:
            return cleaned
    return None


def _normalize_metadata_candidate(value: Any, normalizer: Any) -> str | None:
    if isinstance(value, str) and value.strip():
        cleaned = normalizer(value)
        if cleaned:
            return cleaned
    if isinstance(value, list):
        joined = " ".join(str(x) for x in value if isinstance(x, str) and x.strip())
        if joined.strip():
            cleaned = normalizer(joined)
            if cleaned:
                return cleaned
    return None


async def _resolve_image_caption_source(db: Sqlite, asset_id: int) -> Result[dict[str, Any]]:
    row = await db.aquery(
        "SELECT filepath, kind FROM assets WHERE id = ? LIMIT 1",
        (asset_id,),
    )
    if not row.ok:
        return Result.Err("DB_ERROR", row.error or "Failed to query asset")
    if not row.data:
        return Result.Err("NOT_FOUND", f"Asset {asset_id} not found")

    data = row.data[0]
    kind = str(data.get("kind") or "").strip().lower()
    if kind != "image":
        return Result.Err("INVALID_INPUT", "Enhanced prompt generation is only available for image assets")

    filepath = str(data.get("filepath") or "").strip()
    if not filepath:
        return Result.Err("INVALID_INPUT", "Asset filepath is empty")

    return Result.Ok({"filepath": filepath, "kind": kind})


async def _generate_caption_text(vs: VectorService, filepath: str) -> Result[str]:
    try:
        generated = await asyncio.wait_for(vs.generate_enhanced_caption(filepath), timeout=90)
    except asyncio.TimeoutError:
        return Result.Err("METADATA_FAILED", "Enhanced caption generation timed out")

    if not generated.ok or not generated.data:
        return Result.Err(generated.code or "METADATA_FAILED", generated.error or "Enhanced caption generation failed")

    caption = _normalize_generated_caption(generated.data, filepath=filepath)
    if not caption:
        return Result.Err("METADATA_FAILED", "Enhanced caption generation returned empty output")
    return Result.Ok(caption)


async def _generate_caption_with_fallback(
    db: Sqlite,
    vs: VectorService,
    asset_id: int,
    filepath: str,
) -> Result[str]:
    caption = await _resolve_caption_text_with_fallback(db, vs, asset_id, filepath)
    if not caption.ok or not caption.data:
        return caption

    write = await _store_enhanced_caption(db, asset_id, caption.data)
    if not write.ok:
        return Result.Err(write.code or "DB_ERROR", write.error or "Failed to store enhanced caption")
    return Result.Ok(caption.data)


async def _resolve_caption_text_with_fallback(
    db: Sqlite,
    vs: VectorService,
    asset_id: int,
    filepath: str,
) -> Result[str]:
    generated = await _generate_caption_text(vs, filepath)
    if generated.ok and generated.data:
        return generated

    fallback = await _fallback_enhanced_caption(db, asset_id)
    if not fallback.ok or not fallback.data:
        return Result.Err(generated.code or "METADATA_FAILED", generated.error or "Enhanced caption generation failed")

    caption = _normalize_generated_caption(fallback.data, filepath=filepath) or ""
    if not caption:
        return Result.Err("METADATA_FAILED", "Enhanced caption generation returned empty output")
    return Result.Ok(caption)


def _alignment_fusion(
    adjusted_image_text: float,
    *,
    caption_score: float | None,
    semantic_score: float | None,
) -> float:
    total_weight = _W_IMAGE_TEXT
    weighted_sum = adjusted_image_text * _W_IMAGE_TEXT

    if caption_score is not None:
        weighted_sum += caption_score * _W_CAPTION_TEXT
        total_weight += _W_CAPTION_TEXT

    if semantic_score is not None:
        weighted_sum += semantic_score * _W_SEMANTIC
        total_weight += _W_SEMANTIC

    return weighted_sum / total_weight if total_weight > 0 else adjusted_image_text


async def _resolve_image_text_alignment(
    vs: VectorService,
    asset_embedding: list[float],
    prompt: str,
) -> Result[float]:
    raw_image_text = await _multi_segment_score(vs, asset_embedding, prompt)
    if raw_image_text is not None:
        return Result.Ok(raw_image_text)

    text_result = await vs.get_text_embedding(prompt)
    if not text_result.ok or not text_result.data:
        return Result.Err("METADATA_FAILED", text_result.error or "Text embedding failed")
    return Result.Ok(VectorService.cosine_similarity(asset_embedding, text_result.data))


async def _resolve_negative_prompt_penalty(
    vs: VectorService,
    asset_embedding: list[float],
    negative_prompt: str | None,
) -> float:
    if not negative_prompt:
        return 0.0
    neg_result = await vs.get_text_embedding(negative_prompt)
    if not neg_result.ok or not neg_result.data:
        return 0.0
    raw_neg = VectorService.cosine_similarity(asset_embedding, neg_result.data)
    return max(0.0, raw_neg) * _NEG_PENALTY_WEIGHT


async def compute_prompt_alignment(
    vs: VectorService,
    asset_embedding: list[float],
    prompt: str,
    *,
    negative_prompt: str | None = None,
    enhanced_caption: str | None = None,
) -> Result[float]:
    """Compute calibrated alignment between an image embedding and a prompt.

    Returns a float in [0, 1].  Higher means the image closely matches the
    textual prompt.
    """
    image_text_result = await _resolve_image_text_alignment(vs, asset_embedding, prompt)
    if not image_text_result.ok:
        return image_text_result

    adjusted_image_text = float(image_text_result.data or 0.0)
    adjusted_image_text -= await _resolve_negative_prompt_penalty(vs, asset_embedding, negative_prompt)

    caption_score = None
    if enhanced_caption and enhanced_caption.strip():
        caption_score = await _caption_prompt_similarity(vs, enhanced_caption, prompt)

    semantic_score = await _semantic_dimension_score(vs, asset_embedding, prompt)
    calibrated = _calibrate_score(
        _alignment_fusion(
            adjusted_image_text,
            caption_score=caption_score,
            semantic_score=semantic_score,
        )
    )
    return Result.Ok(round(calibrated, 4))


def _length_weighted_average(scores: list[tuple[float, int]]) -> float | None:
    total_len = sum(length for _, length in scores)
    if total_len == 0:
        return None
    return sum(sim * length for sim, length in scores) / total_len


async def _multi_segment_score(
    vs: VectorService,
    asset_embedding: list[float],
    prompt: str,
) -> float | None:
    """Split prompt into segments and compute a weighted similarity score.

    Each segment is embedded independently and scored against the image.
    The final score is a length-weighted average with a bonus for the
    best-matching segment, which captures the "main subject" better.
    """
    segments = [s.strip() for s in _SEGMENT_SPLIT_RE.split(prompt) if len(s.strip()) >= _MIN_SEGMENT_CHARS]
    if len(segments) <= 1:
        # Not worth splitting — return None to use the full prompt
        return None

    scores: list[tuple[float, int]] = []  # (similarity, char_length)
    for seg in segments:
        emb = await vs.get_text_embedding(seg)
        if emb.ok and emb.data:
            sim = VectorService.cosine_similarity(asset_embedding, emb.data)
            scores.append((sim, len(seg)))

    if not scores:
        return None

    weighted_avg = _length_weighted_average(scores)
    if weighted_avg is None:
        return None

    best_sim = max(sim for sim, _ in scores)
    return weighted_avg + (best_sim - weighted_avg) * _SEGMENT_MAX_BOOST


async def _caption_prompt_similarity(
    vs: VectorService,
    caption: str,
    prompt: str,
) -> float | None:
    """Text↔text cosine similarity between enhanced caption and prompt."""
    cap_emb = await vs.get_text_embedding(caption)
    if not cap_emb.ok or not cap_emb.data:
        return None
    prompt_emb = await vs.get_text_embedding(prompt)
    if not prompt_emb.ok or not prompt_emb.data:
        return None
    return VectorService.cosine_similarity(cap_emb.data, prompt_emb.data)


async def _semantic_dimension_score(
    vs: VectorService,
    asset_embedding: list[float],
    prompt: str,
) -> float | None:
    """Score the image against semantic concept dimensions extracted from the prompt.

    For each semantic dimension (subject, style, medium, mood, color),
    we construct a probing prompt "<prefix> <extracted_concept>" and
    measure its similarity to the image embedding.  The final score is
    the average of the individual dimension scores (only counting
    dimensions where a concept was actually extracted).
    """
    concepts = _extract_semantic_concepts(prompt)
    if not concepts:
        return None

    dim_scores: list[float] = []
    for dim, concept in concepts.items():
        prefix = _SEMANTIC_DIMENSIONS.get(dim, "")
        probe = f"{prefix} {concept}" if prefix else concept
        emb = await vs.get_text_embedding(probe)
        if emb.ok and emb.data:
            sim = VectorService.cosine_similarity(asset_embedding, emb.data)
            dim_scores.append(sim)

    return sum(dim_scores) / len(dim_scores) if dim_scores else None


def _first_matching_keyword(lower: str, keywords: tuple[str, ...]) -> str | None:
    for kw in keywords:
        if kw in lower:
            return kw
    return None


def _extract_semantic_concepts(prompt: str) -> dict[str, str]:
    """Heuristic extraction of semantic dimensions from a prompt.

    Attempts to identify subject, style, medium, mood, and color palette
    concepts by matching known keywords.  Returns a dict of dimension→concept
    for the dimensions that were detected.
    """
    lower = prompt.lower()
    concepts: dict[str, str] = {}

    segments = [s.strip() for s in _SEGMENT_SPLIT_RE.split(prompt) if len(s.strip()) >= _MIN_SEGMENT_CHARS]
    if segments:
        concepts["subject"] = segments[0]

    style_kws = (
        "anime", "manga", "photorealistic", "realistic", "cartoon", "oil painting",
        "watercolor", "impressionist", "surrealist", "art nouveau", "art deco",
        "pixel art", "comic", "3d render", "concept art", "digital art",
        "cinematic", "studio ghibli", "ukiyo-e", "pop art", "minimalist",
        "gothic", "baroque", "renaissance", "cubist", "futuristic",
    )
    medium_kws = (
        "oil painting", "watercolor", "photograph", "photo", "illustration",
        "painting", "drawing", "sketch", "render", "sculpture", "collage",
        "engraving", "print", "pencil", "charcoal", "pastel", "acrylic",
        "fresco", "mosaic", "tapestry",
    )
    mood_kws = (
        "dark", "bright", "moody", "cheerful", "mysterious", "serene",
        "dramatic", "peaceful", "ethereal", "gloomy", "vibrant", "melancholic",
        "nostalgic", "whimsical", "epic", "dreamy", "eerie", "cozy",
        "romantic", "surreal", "ominous", "tranquil",
    )
    color_kws = (
        "monochrome", "black and white", "pastel colors", "neon", "warm tones",
        "cool tones", "golden hour", "blue hour", "sepia", "high contrast",
        "muted colors", "saturated", "desaturated", "earth tones",
    )

    style = _first_matching_keyword(lower, style_kws)
    if style:
        concepts["style"] = style
    medium = _first_matching_keyword(lower, medium_kws)
    if medium:
        concepts["medium"] = medium
    mood = _first_matching_keyword(lower, mood_kws)
    if mood:
        concepts["mood"] = mood
    color = _first_matching_keyword(lower, color_kws)
    if color:
        concepts["color"] = color

    return concepts


async def generate_enhanced_prompt(
    db: Sqlite,
    vs: VectorService,
    asset_id: int,
) -> Result[str]:
    """Generate and persist an enhanced Florence-2 caption for one image asset."""
    source = await _resolve_image_caption_source(db, asset_id)
    if not source.ok or not source.data:
        return Result.Err(source.code or "METADATA_FAILED", source.error or "Enhanced caption generation failed")

    filepath = str(source.data["filepath"])
    return await _generate_caption_with_fallback(db, vs, asset_id, filepath)


async def _compute_prompt_alignment(
    vs: VectorService,
    vector: list[float],
    metadata_raw: dict[str, Any] | None,
    *,
    enhanced_caption: str | None = None,
) -> float | None:
    """Extract the original prompt from metadata and compute alignment."""
    if not metadata_raw:
        return None

    prompt = _extract_prompt_from_metadata(metadata_raw)
    if not prompt:
        return None

    negative = _extract_negative_prompt(metadata_raw)
    result = await compute_prompt_alignment(
        vs, vector, prompt,
        negative_prompt=negative,
        enhanced_caption=enhanced_caption,
    )
    return result.data if result.ok else None


async def _fallback_enhanced_caption(db: Sqlite, asset_id: int) -> Result[str]:
    row = await db.aquery(
        """
        SELECT a.filename, am.metadata_raw
        FROM assets a
        LEFT JOIN asset_metadata am ON am.asset_id = a.id
        WHERE a.id = ?
        LIMIT 1
        """,
        (asset_id,),
    )
    if not row.ok:
        return Result.Err("DB_ERROR", row.error or "Failed to query fallback metadata")
    if not row.data:
        return Result.Err("NOT_FOUND", f"Asset {asset_id} not found")

    data = row.data[0]
    meta_obj = _coerce_metadata_payload(data.get("metadata_raw"))
    if meta_obj:
        prompt = _extract_prompt_from_metadata(meta_obj)
        if prompt:
            return Result.Ok(prompt)

    filename = str(data.get("filename") or "").strip()
    if filename:
        stem = _caption_fallback_title(filename)
        if stem:
            return Result.Ok(stem)

    return Result.Err("METADATA_FAILED", "No fallback prompt available")


def _resolve_key_path(meta: dict[str, Any], key_path: str) -> Any:
    """Walk a dot-separated key path and return the leaf value."""
    obj: Any = meta
    for part in key_path.split("."):
        if isinstance(obj, dict):
            obj = obj.get(part)
        else:
            return None
    return obj


def _extract_prompt_from_metadata(meta: dict[str, Any]) -> str | None:
    """Best-effort extraction of the generation prompt from metadata JSON."""
    prompt = _extract_metadata_text(
        meta,
        (
            "prompt",
            "parameters",
            "geninfo.prompt",
            "geninfo.positive.value",
            "geninfo.positive.text",
            "geninfo.positive_prompt",
            "positive_prompt",
            "sd_prompt",
            "generation.prompt",
            "workflow.prompt",
            "comfy.positive",
            "comfyui.positive",
            "dream.prompt",
            "invokeai.positive_conditioning",
        ),
        normalizer=_sanitize_prompt_text,
    )
    if prompt:
        return prompt
    for blob_key in (
        "PNG:Parameters",
        "EXIF:UserComment",
        "UserComment",
        "ImageDescription",
    ):
        blob = meta.get(blob_key)
        if isinstance(blob, str) and blob.strip():
            cleaned = _sanitize_prompt_text(blob)
            if cleaned:
                return cleaned
    return None


def _extract_negative_prompt(meta: dict[str, Any]) -> str | None:
    """Best-effort extraction of the negative prompt from metadata JSON."""
    for key_path in (
        "negative_prompt",
        "geninfo.negative.value",
        "geninfo.negative.text",
        "geninfo.negative_prompt",
        "comfy.negative",
        "comfyui.negative",
        "invokeai.negative_conditioning",
    ):
        obj = _resolve_key_path(meta, key_path)
        if isinstance(obj, str) and obj.strip():
            cleaned = _normalise_whitespace(obj)
            if cleaned:
                return cleaned
    # A1111 embeds negative prompt inside "parameters" blob — extract it
    params = meta.get("parameters")
    if isinstance(params, str):
        neg_match = _NEG_PROMPT_MARKER_RE.search(params)
        if neg_match:
            after_neg = params[neg_match.end():]
            step_match = _STEPS_MARKER_RE.search(after_neg)
            neg_text = after_neg[: step_match.start()].strip() if step_match else after_neg.strip()
            neg_text = _normalise_whitespace(neg_text)
            if neg_text:
                return neg_text
    return None


async def _store_embedding(
    db: Sqlite,
    asset_id: int,
    blob: bytes,
    aesthetic_score: float | None,
    model_name: str,
) -> Result[bool]:
    """INSERT OR REPLACE the embedding row."""
    return await db.aexecute(
        """
        INSERT INTO vec.asset_embeddings (asset_id, vector, aesthetic_score, model_name, updated_at)
        SELECT ?, ?, ?, ?, CURRENT_TIMESTAMP
        WHERE EXISTS (SELECT 1 FROM assets WHERE id = ?)
        ON CONFLICT(asset_id) DO UPDATE SET
            vector = excluded.vector,
            aesthetic_score = excluded.aesthetic_score,
            model_name = excluded.model_name,
            updated_at = CURRENT_TIMESTAMP
        WHERE EXISTS (SELECT 1 FROM assets WHERE id = excluded.asset_id)
        """,
        (asset_id, blob, aesthetic_score, model_name, asset_id),
    )


async def _store_enhanced_caption(
    db: Sqlite,
    asset_id: int,
    caption: str,
) -> Result[bool]:
    return await db.aexecute(
        """
        UPDATE assets
        SET enhanced_caption = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        """,
        (caption, asset_id),
    )


async def _try_store_enhanced_caption(
    db: Sqlite,
    vs: VectorService,
    asset_id: int,
    filepath: str,
) -> None:
    try:
        generated = await vs.generate_enhanced_caption(filepath)
        if not generated.ok or not generated.data:
            return
        fallback_title = (
            Path(filepath).stem.replace("_", " ").replace("-", " ").strip()
            or "Untitled"
        )
        caption = _normalise_title_caption(
            str(generated.data).strip(),
            fallback_title=fallback_title,
        )
        if not caption:
            return
        await _store_enhanced_caption(db, asset_id, caption)
    except Exception as exc:
        logger.debug("Enhanced caption generation skipped for asset %d: %s", asset_id, exc)


async def _generate_and_store_caption(
    db: Sqlite,
    vs: VectorService,
    asset_id: int,
    filepath: str,
) -> str | None:
    """Generate, store, and return the enhanced caption (or None on failure)."""
    try:
        generated = await vs.generate_enhanced_caption(filepath)
        if not generated.ok or not generated.data:
            return None
        fallback_title = (
            Path(filepath).stem.replace("_", " ").replace("-", " ").strip()
            or "Untitled"
        )
        caption = _normalise_title_caption(
            str(generated.data).strip(),
            fallback_title=fallback_title,
        )
        if not caption:
            return None
        await _store_enhanced_caption(db, asset_id, caption)
        return caption
    except Exception as exc:
        logger.debug("Enhanced caption generation skipped for asset %d: %s", asset_id, exc)
        return None


async def _apply_autotags(
    db: Sqlite,
    vs: VectorService,
    asset_id: int,
    image_vector: list[float],
) -> None:
    """Compare image embedding against canonical tag prompts and store matches as AI suggestions.

    Matched tags are stored in ``asset_embeddings.auto_tags`` (separate from user tags)
    so the UI can display them as suggestions the user can accept or dismiss.
    """
    try:
        tag_embeddings = await _get_autotag_embeddings(vs)
    except Exception as exc:
        logger.debug("Auto-tag embedding fetch failed: %s", exc)
        return

    matched_tags: list[str] = []
    for tag, tag_vec in tag_embeddings.items():
        score = VectorService.cosine_similarity(image_vector, tag_vec)
        if score >= VECTOR_AUTOTAG_THRESHOLD:
            matched_tags.append(tag)

    if not matched_tags:
        return

    await db.aexecute(
        "UPDATE vec.asset_embeddings SET auto_tags = ? WHERE asset_id = ?",
        (json.dumps(matched_tags), asset_id),
    )
    logger.debug("Auto-tag suggestions stored for asset %d: %s", asset_id, matched_tags)


def _normalise_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip())


def _sanitize_prompt_text(value: str) -> str:
    """Clean a raw prompt string for embedding: strip technical noise."""
    raw = str(value or "").strip()
    if not raw:
        return ""

    base = raw
    # Remove everything after "Negative prompt:" marker
    split = _NEG_PROMPT_MARKER_RE.split(base, maxsplit=1)
    if split:
        base = split[0].strip()

    # Remove everything after "Steps:" and other A1111 param lines
    step_match = _STEPS_MARKER_RE.search(base)
    if step_match:
        base = base[: step_match.start()].strip()
    a1111_match = _A1111_PARAMS_RE.search(base)
    if a1111_match:
        base = base[: a1111_match.start()].strip()

    # Strip LoRA tags: <lora:name:weight>
    base = _LORA_TAG_RE.sub("", base)

    # Strip embedding references: embedding:name or ti:name
    base = _EMBEDDING_TAG_RE.sub("", base)

    # Unwrap weight syntax: (text:1.5) → text, [text:0.8] → text
    prev = ""
    while prev != base:
        prev = base
        base = _WEIGHT_SYNTAX_RE.sub(r"\2", base)

    base = _normalise_whitespace(base).strip(" ,")
    if _looks_like_path_prompt(base):
        return ""
    return base


def _looks_like_path_prompt(value: str) -> bool:
    raw = str(value or "").strip()
    if not raw or "\n" in raw:
        return False
    if _PATH_LIKE_PROMPT_RE.match(raw):
        return True
    normalised = raw.replace("\\", "/")
    if "/" not in normalised or re.search(r"[,;]", normalised):
        return False
    if re.search(
        r"\b(?:cinematic|portrait|landscape|lighting|style|detailed|masterpiece|photo|render)\b",
        normalised,
        re.IGNORECASE,
    ):
        return False
    return bool(
        re.search(
            r"(?:/[^/\n]+){2,}\.(?:png|jpe?g|webp|gif|bmp|tiff?|avif|heic|heif|apng|hdr|svg|mp4|webm|mov|mkv|avi|m4v|mp3|wav|flac|ogg|glb|gltf|obj|fbx|ply|stl|ckpt|safetensors|pt|pth|bin|gguf|json|ya?ml)$",
            normalised,
            re.IGNORECASE,
        )
    )


def _normalise_title_caption(raw_caption: str, *, fallback_title: str = "Untitled") -> str:
    _ = fallback_title
    raw = str(raw_caption or "").strip()
    if not raw:
        return ""

    lines: list[str] = []
    for line in raw.replace("\r\n", "\n").split("\n"):
        item = str(line or "").strip()
        if not item:
            continue
        low = item.lower()
        if low.startswith("title:"):
            continue
        if low.startswith("caption:"):
            item = item.split(":", 1)[1].strip()
        if item:
            lines.append(item)

    caption = _normalise_whitespace(" ".join(lines)) or _normalise_whitespace(raw)
    caption = re.sub(r"(?i)^\s*(?:title|caption)\s*:\s*", "", caption).strip()
    # Some truncated generations end with delimiter artifacts such as "::".
    caption = re.sub(r":{2,}\s*$", "", caption).strip()
    return caption
