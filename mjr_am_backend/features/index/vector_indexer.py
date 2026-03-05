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
import json
import re
from pathlib import Path
from typing import Any

from ...adapters.db.sqlite import Sqlite
from ...config import (
    VECTOR_AUTOTAG_THRESHOLD,
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

# ── Score calibration constants ────────────────────────────────────────────
# Raw SigLIP2 cosine similarity for well-aligned image-text pairs typically
# falls in the 0.15–0.45 range.  We remap this to a 0–1 scale so that
# the UI percentage is meaningful to users.
_CALIB_LOW = 0.15   # raw score mapped to 0 (floor)
_CALIB_HIGH = 0.45  # raw score mapped to 1 (ceiling)
_NEG_PENALTY_WEIGHT = 0.25  # how much negative-prompt match penalises the score

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


async def _get_autotag_embeddings(vs: VectorService) -> dict[str, list[float]]:
    """Return cached text embeddings for each auto-tag prompt."""
    global _autotag_cache
    if _autotag_cache:
        return _autotag_cache

    async with _autotag_cache_lock:
        if _autotag_cache:
            return _autotag_cache

        cache: dict[str, list[float]] = {}
        for tag, prompt in AUTOTAG_VOCABULARY.items():
            result = await vs.get_text_embedding(prompt)
            if result.ok and result.data:
                cache[tag] = result.data
            else:
                logger.debug("Auto-tag embedding failed for '%s': %s", tag, result.error)
        _autotag_cache = cache
        logger.info("Auto-tag vocabulary embedded (%d / %d tags)", len(cache), len(AUTOTAG_VOCABULARY))
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

    # 2. Prompt-image alignment score (optional)
    aesthetic = await _compute_prompt_alignment(vs, vector, metadata_raw)

    # 3. Persist embedding
    blob = vector_to_blob(vector)
    store_result = await _store_embedding(db, asset_id, blob, aesthetic, vs._model_name)
    if not store_result.ok:
        return store_result

    # 3b. Enhanced caption (Florence-2) for image assets (best-effort).
    if kind == "image":
        await _try_store_enhanced_caption(db, vs, asset_id, filepath)

    # 4. Auto-tagging
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


async def compute_prompt_alignment(
    vs: VectorService,
    asset_embedding: list[float],
    prompt: str,
    *,
    negative_prompt: str | None = None,
) -> Result[float]:
    """Compute calibrated alignment between an image embedding and a prompt.

    Returns a float in [0, 1].  Higher means the image closely matches the
    textual prompt.  If *negative_prompt* is provided, its similarity to the
    image is subtracted (weighted) to penalise unwanted content leaking in.
    """
    text_result = await vs.get_text_embedding(prompt)
    if not text_result.ok or not text_result.data:
        return Result.Err("METADATA_FAILED", text_result.error or "Text embedding failed")
    raw_pos = VectorService.cosine_similarity(asset_embedding, text_result.data)

    neg_penalty = 0.0
    if negative_prompt:
        neg_result = await vs.get_text_embedding(negative_prompt)
        if neg_result.ok and neg_result.data:
            raw_neg = VectorService.cosine_similarity(asset_embedding, neg_result.data)
            neg_penalty = max(0.0, raw_neg) * _NEG_PENALTY_WEIGHT

    calibrated = _calibrate_score(raw_pos - neg_penalty)
    return Result.Ok(round(calibrated, 4))


async def generate_enhanced_prompt(
    db: Sqlite,
    vs: VectorService,
    asset_id: int,
) -> Result[str]:
    """Generate and persist an enhanced Florence-2 caption for one image asset."""
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

    try:
        generated = await asyncio.wait_for(vs.generate_enhanced_caption(filepath), timeout=90)
    except asyncio.TimeoutError:
        generated = Result.Err("METADATA_FAILED", "Enhanced caption generation timed out")

    if generated.ok and generated.data:
        caption = str(generated.data).strip()
    else:
        fallback = await _fallback_enhanced_caption(db, asset_id)
        if not fallback.ok or not fallback.data:
            return Result.Err(generated.code or "METADATA_FAILED", generated.error or "Enhanced caption generation failed")
        caption = str(fallback.data).strip()

    if not caption:
        return Result.Err("METADATA_FAILED", "Enhanced caption generation returned empty output")
    fallback_title = (
        Path(filepath).stem.replace("_", " ").replace("-", " ").strip()
        or "Untitled"
    )
    caption = _normalise_title_caption(caption, fallback_title=fallback_title)

    write = await _store_enhanced_caption(db, asset_id, caption)
    if not write.ok:
        return Result.Err(write.code or "DB_ERROR", write.error or "Failed to store enhanced caption")
    return Result.Ok(caption)


# ── Private helpers ────────────────────────────────────────────────────────


async def _compute_prompt_alignment(
    vs: VectorService,
    vector: list[float],
    metadata_raw: dict[str, Any] | None,
) -> float | None:
    """Extract the original prompt from metadata and compute alignment."""
    if not metadata_raw:
        return None

    prompt = _extract_prompt_from_metadata(metadata_raw)
    if not prompt:
        return None

    negative = _extract_negative_prompt(metadata_raw)
    result = await compute_prompt_alignment(vs, vector, prompt, negative_prompt=negative)
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
    raw = data.get("metadata_raw")
    meta_obj: dict[str, Any] | None = None
    if isinstance(raw, str) and raw.strip():
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, dict):
                meta_obj = parsed
        except Exception:
            meta_obj = None
    elif isinstance(raw, dict):
        meta_obj = raw

    if meta_obj:
        prompt = _extract_prompt_from_metadata(meta_obj)
        if prompt:
            return Result.Ok(prompt)

    filename = str(data.get("filename") or "").strip()
    if filename:
        stem = filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").strip()
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
    # ComfyUI / A1111 / various formats
    for key_path in (
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
    ):
        obj = _resolve_key_path(meta, key_path)
        if isinstance(obj, str) and obj.strip():
            cleaned = _sanitize_prompt_text(obj)
            if cleaned:
                return cleaned
        # Some formats store the prompt as a list of strings
        if isinstance(obj, list):
            joined = " ".join(str(x) for x in obj if isinstance(x, str) and x.strip())
            if joined.strip():
                cleaned = _sanitize_prompt_text(joined)
                if cleaned:
                    return cleaned
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

    return _normalise_whitespace(base).strip(" ,")


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
