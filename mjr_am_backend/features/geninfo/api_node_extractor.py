"""
ComfyUI API-node extraction helpers.

Handles workflows that use external-API image-generation nodes instead of a
local KSampler (e.g. GeminiImageNode, OpenAI DALL-E nodes, Anthropic nodes …).
These nodes receive a text prompt and a model name directly as widget inputs,
call a remote API, and return IMAGE tensors — so the standard sampler-tracer
finds nothing and falls through to the no-sampler path.

Public entry-point consumed by payload_builder._build_no_sampler_result:
    _extract_api_node_geninfo_fallback(nodes_by_id, workflow_meta) -> dict | None
"""

from __future__ import annotations

from typing import Any

from ...shared import get_logger
from .graph_converter import _inputs, _lower, _node_type, _set_value_field
from .parser_impl import _extract_input_files
from .sampler_tracer import _scalar

logger = get_logger(__name__)

# ---------------------------------------------------------------------------
# Node-type detection
# ---------------------------------------------------------------------------

# (class_type_fragment, api_provider_label)
# Fragments are matched as substrings of the lowercase class_type.
# More specific fragments must come before broader fallbacks.
_API_NODE_SIGNATURES: list[tuple[str, str]] = [
    # ── ByteDance Seedance / Seedream (dotted-key inputs) ────────────────────
    ("bytedance2referencenode",  "bytedance_seedance"),
    ("bytedanceseedancenode",    "bytedance_seedance"),
    ("bytedanceseedream",        "bytedance_seedance"),
    ("bytedance2videonode",      "bytedance_seedance"),
    ("bytedance2texttovideonode","bytedance_seedance"),
    ("bytedance2firstlastframe", "bytedance_seedance"),
    ("bytedanceimagereference",  "bytedance_seedance"),
    ("bytedanceimagetovideo",    "bytedance_seedance"),
    ("bytedanceimagenode",       "bytedance_seedance"),
    ("bytedancetexttovideo",     "bytedance_seedance"),
    ("bytedance",                "bytedance_seedance"),  # broad catch-all last
    ("seedance",                 "bytedance_seedance"),
    # ── Google Gemini ─────────────────────────────────────────────────────────
    ("geminiimage2node",         "google_gemini"),
    ("geminiimagenode",          "google_gemini"),
    ("gemininode",               "google_gemini"),
    ("gemini",                   "google_gemini"),
    # ── Google Veo ────────────────────────────────────────────────────────────
    ("veovideogeneration",       "google_veo"),
    ("veo3videogeneration",      "google_veo"),
    ("veo3firstlastframe",       "google_veo"),
    # ── OpenAI / DALL-E / Sora ────────────────────────────────────────────────
    ("openaiimagenode",          "openai"),
    ("openaiimage",              "openai"),
    ("openaivideosora",          "openai"),
    ("openaichat",               "openai"),
    ("dallenode",                "openai"),
    ("dall_e",                   "openai"),
    ("openaiapi",                "openai"),
    # ── Anthropic / Claude ────────────────────────────────────────────────────
    ("claudenode",               "anthropic"),
    ("anthropicnode",            "anthropic"),
    ("claude",                   "anthropic"),
    # ── Black Forest Labs / Flux API ─────────────────────────────────────────
    ("fluxkontextproimagenode",  "black_forest_labs"),
    ("fluxkontextmaximagenode",  "black_forest_labs"),
    ("fluxkontext",              "black_forest_labs"),
    ("flux2proimagenode",        "black_forest_labs"),
    ("flux2maximagenode",        "black_forest_labs"),
    ("fluxproultraimagenode",    "black_forest_labs"),
    ("fluxprofillnode",          "black_forest_labs"),
    ("fluxproexpandnode",        "black_forest_labs"),
    # ── Stability AI ─────────────────────────────────────────────────────────
    ("stabilitystableimage",     "stability_ai"),
    ("stabilityupscale",         "stability_ai"),
    ("stabilityainode",          "stability_ai"),
    ("stabilitynode",            "stability_ai"),
    # ── Alibaba Wan ──────────────────────────────────────────────────────────
    ("wan2texttovideoapi",       "alibaba_wan"),
    ("wan2imagetovideoapi",      "alibaba_wan"),
    ("wan2referencevideoapi",    "alibaba_wan"),
    ("wan2videocontinuationapi", "alibaba_wan"),
    ("wan2videoeditapi",         "alibaba_wan"),
    ("wantexttovideoapi",        "alibaba_wan"),
    ("wanimagetovideoapi",       "alibaba_wan"),
    ("wanreferencevideoapi",     "alibaba_wan"),
    ("wantexttoimageapi",        "alibaba_wan"),
    ("wanimagetoimageapi",       "alibaba_wan"),
    # ── Kling AI ─────────────────────────────────────────────────────────────
    ("klingomnipro",             "kling_ai"),
    ("klingimage2video",         "kling_ai"),
    ("klingtexttovideo",         "kling_ai"),
    ("klingimagegeneration",     "kling_ai"),
    ("klingfirstlastframe",      "kling_ai"),
    ("klingstartendframe",       "kling_ai"),
    ("klingcameracontrol",       "kling_ai"),
    ("klingvideoextend",         "kling_ai"),
    ("klingsingleimage",         "kling_ai"),
    ("klingdualcharacter",       "kling_ai"),
    ("klingavatar",              "kling_ai"),
    ("klinglipsync",             "kling_ai"),
    ("klingvirtualtryon",        "kling_ai"),
    ("klingvideonode",           "kling_ai"),
    # ── Luma Dream Machine ───────────────────────────────────────────────────
    ("lumaimagetovideo",         "luma_dream_machine"),
    ("lumavideo",                "luma_dream_machine"),
    ("lumaimage",                "luma_dream_machine"),
    ("lumareference",            "luma_dream_machine"),
    ("lumaconcepts",             "luma_dream_machine"),
    # ── MiniMax / Hailuo ─────────────────────────────────────────────────────
    ("minimaxhailuo",            "minimax_hailuo"),
    ("minimaximagetovideo",      "minimax_hailuo"),
    ("minimaxsubjecttovideo",    "minimax_hailuo"),
    ("minimaxtexttovideo",       "minimax_hailuo"),
    ("hailuo",                   "minimax_hailuo"),
    # ── Runway ───────────────────────────────────────────────────────────────
    ("runwayfirstlastframe",     "runway"),
    ("runwayimagetovideo",       "runway"),
    ("runwaytexttoimage",        "runway"),
    # ── Vidu ─────────────────────────────────────────────────────────────────
    ("vidutexttovideo",          "vidu"),
    ("viduimagetovideo",         "vidu"),
    ("vidureferencevideo",       "vidu"),
    ("vidumultiframe",           "vidu"),
    ("viduextend",               "vidu"),
    ("vidustartend",             "vidu"),
    ("vidu2",                    "vidu"),
    ("vidu3",                    "vidu"),
    # ── Moonvalley ───────────────────────────────────────────────────────────
    ("moonvalleytxt2video",      "moonvalley"),
    ("moonvalleyimg2video",      "moonvalley"),
    ("moonvalleyvideo2video",    "moonvalley"),
    # ── Pixverse ─────────────────────────────────────────────────────────────
    ("pixversetexttovideo",      "pixverse"),
    ("pixverseimagetovideo",     "pixverse"),
    ("pixversetemplate",         "pixverse"),
    ("pixversetransition",       "pixverse"),
    # ── Ideogram ─────────────────────────────────────────────────────────────
    ("ideogramv1",               "ideogram"),
    ("ideogramv2",               "ideogram"),
    ("ideogramv3",               "ideogram"),
    # ── Recraft ──────────────────────────────────────────────────────────────
    ("recraftv4",                "recraft"),
    ("recraftcreate",            "recraft"),
    ("recrafttext",              "recraft"),
    ("recraftimage",             "recraft"),
    ("recraftvectorize",         "recraft"),
    ("recraftstyle",             "recraft"),
    ("recraftremove",            "recraft"),
    ("recraftreplace",           "recraft"),
    ("recraftcrisp",             "recraft"),
    ("recraftcreative",          "recraft"),
    # ── Grok / xAI ───────────────────────────────────────────────────────────
    ("grokimage",                "xai_grok"),
    ("grokvideo",                "xai_grok"),
    # ── LTX Video API ────────────────────────────────────────────────────────
    ("ltxvapiimage",             "ltxv_api"),
    ("ltxvapitext",              "ltxv_api"),
    # ── Reve ─────────────────────────────────────────────────────────────────
    ("reveimage",                "reve"),
    # ── Bria ─────────────────────────────────────────────────────────────────
    ("briaimageedit",            "bria"),
    # ── Magnific ─────────────────────────────────────────────────────────────
    ("magnificimage",            "magnific"),
    # ── Topaz ────────────────────────────────────────────────────────────────
    ("topazimage",               "topaz"),
    ("topazvideo",               "topaz"),
    # ── HitPaw ───────────────────────────────────────────────────────────────
    ("hitpawgeneral",            "hitpaw"),
    ("hitpawvideo",              "hitpaw"),
    # ── Wavespeed ────────────────────────────────────────────────────────────
    ("wavespeedflash",           "wavespeed"),
    ("wavespeedimage",           "wavespeed"),
    # ── Quiver ───────────────────────────────────────────────────────────────
    ("quiverimage",              "quiver"),
    ("quivertext",               "quiver"),
    # ── Sonilo (music) ───────────────────────────────────────────────────────
    ("sonilotexttomusic",        "sonilo"),
    ("sonilovideotomusic",       "sonilo"),
    # ── ElevenLabs (TTS / audio) ─────────────────────────────────────────────
    ("elevenlabstextto",         "eleven_labs"),
    ("elevenlabsspeech",         "eleven_labs"),
    ("elevenlabsvoice",          "eleven_labs"),
    ("elevenlabsaudio",          "eleven_labs"),
    # ── Generic "API image/video" heuristic — must come last ─────────────────
    ("apiimagenode",             "api"),
    ("apigenerate",              "api"),
]

# Inputs that, if present on an API node, are meaningless for geninfo
_SKIP_EXTRA_KEYS: frozenset[str] = frozenset({
    "images", "files", "mask", "control_net", "ipadapter",
    "response_modalities", "control_after_generate",
})


def _detect_api_node(ct: str) -> str | None:
    """Return the API-provider label if *ct* matches a known API node, else None."""
    for fragment, provider in _API_NODE_SIGNATURES:
        if fragment in ct:
            return provider
    return None


# Model-name keyword → provider (ordered, first match wins).
# Each entry: (tuple_of_keywords, provider_label).
_MODEL_NAME_PROVIDERS: list[tuple[tuple[str, ...], str]] = [
    (("seedance", "seedream", "bytedance"),       "bytedance_seedance"),
    (("gemini",),                                 "google_gemini"),
    (("veo",),                                    "google_veo"),
    (("gpt", "dall-e", "dall_e", "sora"),         "openai"),
    (("claude", "anthropic"),                     "anthropic"),
    (("flux-kontext", "flux-pro", "flux-ultra"),  "black_forest_labs"),
    (("stable-diffusion", "stability", "sdxl"),   "stability_ai"),
    (("kling",),                                  "kling_ai"),
    (("luma", "dream-machine"),                   "luma_dream_machine"),
    (("minimax", "hailuo"),                       "minimax_hailuo"),
    (("runway",),                                 "runway"),
    (("vidu",),                                   "vidu"),
    (("ideogram",),                               "ideogram"),
    (("recraft",),                                "recraft"),
    (("grok",),                                   "xai_grok"),
    (("pixverse",),                               "pixverse"),
]


def _provider_from_model_name(model: str) -> str | None:
    """Infer API provider from the model name string (secondary heuristic)."""
    m = model.lower()
    # Wan: only match when combined with "video" or "image" to avoid false positives
    if "wan" in m and ("video" in m or "image" in m):
        return "alibaba_wan"
    for keywords, provider in _MODEL_NAME_PROVIDERS:
        if any(kw in m for kw in keywords):
            return provider
    return None


def _is_api_image_node(node: dict[str, Any]) -> bool:
    """True when *node* looks like an external-API image/video-generation node."""
    ct = _lower(_node_type(node))
    if not ct:
        return False
    # Fast path — known class_type fragment
    if _detect_api_node(ct) is not None:
        return True
    # Heuristic fallback: node has a direct `prompt` (or dotted `model.prompt`)
    # string input, a `model` string input, but NO sampler-signature fields.
    ins = _inputs(node)
    has_prompt = (
        (isinstance(ins.get("prompt"), str) and ins["prompt"].strip())
        or (isinstance(ins.get("model.prompt"), str) and ins["model.prompt"].strip())
    )
    has_model  = isinstance(ins.get("model"), str) and ins["model"].strip()
    has_sampler_fields = any(
        ins.get(k) is not None
        for k in ("cfg", "steps", "scheduler", "sampler_name", "latent_image", "samples")
    )
    return has_prompt and has_model and not has_sampler_fields


# ---------------------------------------------------------------------------
# Node discovery
# ---------------------------------------------------------------------------

def _find_api_image_nodes(
    nodes_by_id: dict[str, Any],
) -> list[tuple[str, dict[str, Any]]]:
    """Return all (node_id, node) pairs that look like API image-generation nodes."""
    found: list[tuple[str, dict[str, Any]]] = []
    for nid, node in nodes_by_id.items():
        if isinstance(node, dict) and _is_api_image_node(node):
            found.append((str(nid), node))
    return found


# ---------------------------------------------------------------------------
# Field extraction helpers
# ---------------------------------------------------------------------------

def _api_provider_for_node(node: dict[str, Any]) -> str:
    ct = _lower(_node_type(node))
    provider = _detect_api_node(ct)
    if provider:
        return provider
    # Try from model name
    ins = _inputs(node)
    model_raw = ins.get("model")
    if isinstance(model_raw, str):
        p = _provider_from_model_name(model_raw)
        if p:
            return p
    return "api"


# ---------------------------------------------------------------------------
# ByteDance Seedance helpers (dotted-key input pattern)
# ---------------------------------------------------------------------------

_SEEDANCE_RESOLUTION_MAP: dict[str, tuple[int, int]] = {
    "480p":  (854, 480),
    "720p":  (1280, 720),
    "1080p": (1920, 1080),
    "4k":    (3840, 2160),
}


def _is_seedance_node(ct: str) -> bool:
    return "bytedance" in ct or "seedance" in ct


def _seedance_media_type(ins: dict[str, Any]) -> str:
    """Return 'img2vid' if reference image/video inputs are wired, else 'txt2vid'."""
    for key in ins:
        if "reference_images" in key or "reference_videos" in key:
            val = ins[key]
            if isinstance(val, (list, tuple)) and len(val) == 2:
                return "img2vid"
    return "txt2vid"


def _seedance_size_from_resolution(resolution: str) -> tuple[int, int] | None:
    """Convert a Seedance resolution string (e.g. '480p') to (width, height)."""
    return _SEEDANCE_RESOLUTION_MAP.get(resolution.lower().strip())


def _populate_seedance_output(
    out: dict[str, Any],
    nodes_by_id: dict[str, Any],
    node_id: str,
    node: dict[str, Any],
) -> None:
    """Extract fields from a ByteDance Seedance node (dotted-key inputs)."""
    ins = _inputs(node)
    source = f"{_node_type(node)}:{node_id}"

    # Prompt — stored under the dotted key 'model.prompt'
    prompt = ins.get("model.prompt")
    if not isinstance(prompt, str) or not prompt.strip():
        # Fallback: some variants may use plain 'prompt'
        prompt = ins.get("prompt")
    if isinstance(prompt, str) and prompt.strip():
        out["positive"] = {"value": prompt.strip(), "confidence": "high", "source": source}

    # Negative prompt
    for neg_key in ("model.negative_prompt", "negative_prompt", "negative"):
        neg = ins.get(neg_key)
        if isinstance(neg, str) and neg.strip():
            out["negative"] = {"value": neg.strip(), "confidence": "high", "source": source}
            break

    # Model name ('model' widget — e.g. "Seedance 2.0")
    model_raw = ins.get("model")
    if isinstance(model_raw, str) and model_raw.strip():
        model_field = {"name": model_raw.strip(), "confidence": "high", "source": source}
        out["checkpoint"] = model_field
        out["models"] = {"checkpoint": model_field}

    # Seed
    seed_val = _scalar(ins.get("seed") or ins.get("noise_seed"))
    _set_value_field(out, "seed", seed_val, source)

    # Duration (seconds)
    duration = _scalar(ins.get("model.duration") or ins.get("duration"))
    if duration is not None:
        out["duration"] = {"value": duration, "confidence": "high", "source": source}

    # Resolution → size
    resolution = ins.get("model.resolution") or ins.get("resolution")
    if isinstance(resolution, str):
        wh = _seedance_size_from_resolution(resolution)
        if wh:
            out["size"] = {"width": wh[0], "height": wh[1], "confidence": "high", "source": source}
        out["resolution"] = {"value": resolution.strip(), "confidence": "high", "source": source}

    # Aspect ratio
    ratio = ins.get("model.ratio") or ins.get("aspect_ratio")
    if isinstance(ratio, str) and ratio.strip() and ratio.lower() not in ("auto", "none", ""):
        out["aspect_ratio"] = {"value": ratio.strip(), "confidence": "high", "source": source}

    # Audio generation flag
    gen_audio = ins.get("model.generate_audio")
    if gen_audio is not None:
        out["generate_audio"] = {"value": bool(gen_audio), "confidence": "high", "source": source}

    # Media type: img2vid or txt2vid
    out["engine"]["type"] = _seedance_media_type(ins)

    # Input files (reference images/videos)
    input_files = _extract_input_files(nodes_by_id)
    if input_files:
        out["inputs"] = input_files


# ---------------------------------------------------------------------------
# Generic API node helpers
# ---------------------------------------------------------------------------

def _extract_api_node_prompt(ins: dict[str, Any]) -> str | None:
    for key in ("prompt", "text", "positive_prompt", "positive"):
        val = ins.get(key)
        if isinstance(val, str) and val.strip():
            return val.strip()
    return None


def _extract_api_node_negative(ins: dict[str, Any]) -> str | None:
    for key in ("negative_prompt", "negative", "negative_text"):
        val = ins.get(key)
        if isinstance(val, str) and val.strip():
            return val.strip()
    return None


def _extract_api_node_model(ins: dict[str, Any], node_id: str, node: dict[str, Any]) -> dict[str, Any] | None:
    raw = ins.get("model")
    if not isinstance(raw, str) or not raw.strip():
        return None
    # Keep the full API model string (no extension stripping — it's not a filename)
    name = raw.strip()
    return {"name": name, "confidence": "high", "source": f"{_node_type(node)}:{node_id}"}


def _extract_api_system_prompt(ins: dict[str, Any]) -> str | None:
    for key in ("system_prompt", "system", "system_instruction"):
        val = ins.get(key)
        if isinstance(val, str) and val.strip():
            return val.strip()
    return None


# Classify engine type from class_type name fragments
_TXT2IMG_KWS  = ("texttoimageapi", "texttoimage", "txt2imageapi", "txt2img", "t2inode", "imagecreate")
_TXT2VID_KWS  = ("texttovideo", "txt2video", "t2vnode", "t2vapi", "txt2vidapi")
_IMG2VID_KWS  = ("imagetovideo", "img2video", "image2video", "firstlastframe",
                 "startendframe", "startend", "referencevideo", "imagetovid",
                 "i2vnode", "i2vapi")
_IMG2IMG_KWS  = ("imagetoimageapi", "imagetoimage", "imageedit", "imagemodify",
                 "imageinpaint", "imageremix", "imagefill", "imageexpand")
_VID2VID_KWS  = ("videotovideo", "videoedit", "videoextend", "videocontinuation",
                 "video2video", "vid2vid")
_AUDIO_KWS    = ("texttospeech", "texttosound", "texttodialogue", "texttomusic",
                 "speechtotext", "speechtospeech", "audioisolation", "texttosong")


def _refine_engine_type(out: dict[str, Any], ct: str, ins: dict[str, Any]) -> None:
    """Refine out['engine']['type'] based on class_type fragments and inputs."""
    if any(kw in ct for kw in _TXT2IMG_KWS):
        out["engine"]["type"] = "txt2img"
        return
    if any(kw in ct for kw in _TXT2VID_KWS):
        out["engine"]["type"] = "txt2vid"
        return
    if any(kw in ct for kw in _IMG2VID_KWS):
        out["engine"]["type"] = "img2vid"
        return
    if any(kw in ct for kw in _IMG2IMG_KWS):
        out["engine"]["type"] = "img2img"
        return
    if any(kw in ct for kw in _VID2VID_KWS):
        out["engine"]["type"] = "vid2vid"
        return
    if any(kw in ct for kw in _AUDIO_KWS):
        out["engine"]["type"] = "audio"
        return
    # Generic "video node": determine img2vid vs txt2vid by whether image inputs are wired
    if "video" in ct:
        has_image_input = any(
            isinstance(v, list) and len(v) == 2
            for v in ins.values()
            if isinstance(v, list)
        )
        out["engine"]["type"] = "img2vid" if has_image_input else "txt2vid"


def _populate_api_node_output(
    out: dict[str, Any],
    nodes_by_id: dict[str, Any],
    node_id: str,
    node: dict[str, Any],
) -> None:
    ins = _inputs(node)
    source = f"{_node_type(node)}:{node_id}"
    ct = _lower(_node_type(node))

    # Delegate to Seedance-specific extractor for ByteDance nodes
    if _is_seedance_node(ct):
        _populate_seedance_output(out, nodes_by_id, node_id, node)
        return

    # Prompt / negative
    prompt = _extract_api_node_prompt(ins)
    if prompt:
        out["positive"] = {"value": prompt, "confidence": "high", "source": source}

    negative = _extract_api_node_negative(ins)
    if negative:
        out["negative"] = {"value": negative, "confidence": "high", "source": source}

    # Model (used as "checkpoint" so UI panels already know how to display it)
    model_field = _extract_api_node_model(ins, node_id, node)
    if model_field:
        out["checkpoint"] = model_field
        out["models"] = {"checkpoint": model_field}

    # Seed
    seed_val = _scalar(ins.get("seed") or ins.get("noise_seed"))
    _set_value_field(out, "seed", seed_val, source)

    # Aspect ratio — try multiple field names
    aspect = (
        ins.get("aspect_ratio")
        or ins.get("ratio")
        or ins.get("ar")
    )
    if isinstance(aspect, str) and aspect.strip() and aspect.lower() not in ("auto", "none", ""):
        out["aspect_ratio"] = {"value": aspect.strip(), "confidence": "high", "source": source}

    # Explicit width / height
    width  = _scalar(ins.get("width"))
    height = _scalar(ins.get("height"))
    if width is not None and height is not None:
        try:
            out["size"] = {
                "width": int(width), "height": int(height),
                "confidence": "high", "source": source,
            }
        except Exception:
            pass

    # Resolution string (e.g. "1080p", "720p") — convert to size when possible
    resolution = ins.get("resolution")
    if isinstance(resolution, str) and resolution.strip():
        out["resolution"] = {"value": resolution.strip(), "confidence": "high", "source": source}
        if "size" not in out:
            wh = _seedance_size_from_resolution(resolution)
            if wh:
                out["size"] = {"width": wh[0], "height": wh[1], "confidence": "medium", "source": source}

    # Duration (seconds or frames)
    duration = _scalar(ins.get("duration"))
    if duration is not None:
        out["duration"] = {"value": duration, "confidence": "high", "source": source}

    # System prompt (optional — many Gemini nodes expose one)
    sys_prompt = _extract_api_system_prompt(ins)
    if sys_prompt:
        out["system_prompt"] = {"value": sys_prompt, "confidence": "high", "source": source}

    # Refine engine.type based on class_type name and inputs
    _refine_engine_type(out, ct, ins)

    # Input files fed to this API node (image-to-image context)
    input_files = _extract_input_files(nodes_by_id)
    if input_files:
        out["inputs"] = input_files


# ---------------------------------------------------------------------------
# Public fallback entry-point
# ---------------------------------------------------------------------------

def _extract_api_node_geninfo_fallback(
    nodes_by_id: dict[str, Any],
    workflow_meta: dict[str, Any] | None,
) -> dict[str, Any] | None:
    """
    Build a geninfo payload for API-node workflows (no local KSampler).
    Returns None if no recognisable API image node is found.
    """
    api_nodes = _find_api_image_nodes(nodes_by_id)
    if not api_nodes:
        return None

    # Use the first detected API node as primary
    primary_id, primary_node = api_nodes[0]
    provider = _api_provider_for_node(primary_node)
    ct = _lower(_node_type(primary_node))
    # Compute a sensible default before _populate_* refines it
    if any(kw in ct for kw in _TXT2IMG_KWS):
        default_type = "txt2img"
    elif any(kw in ct for kw in _TXT2VID_KWS):
        default_type = "txt2vid"
    elif any(kw in ct for kw in _IMG2VID_KWS):
        default_type = "img2vid"
    elif any(kw in ct for kw in _AUDIO_KWS):
        default_type = "audio"
    elif "video" in ct or "seedance" in ct or "bytedance" in ct:
        default_type = "img2vid"
    else:
        default_type = "txt2img"

    out: dict[str, Any] = {
        "engine": {
            "parser_version": "geninfo-api-v1",
            "sampler_mode": "api",
            "type": default_type,
            "sink": str(_node_type(primary_node) or "api"),
            "api_provider": provider,
        }
    }
    if workflow_meta:
        out["metadata"] = workflow_meta

    try:
        _populate_api_node_output(out, nodes_by_id, primary_id, primary_node)
    except Exception as exc:
        logger.debug("API node extraction failed for %s: %s", primary_id, exc)

    # If we have more than one API node, attach the rest as extra passes
    if len(api_nodes) > 1:
        extra: list[dict[str, Any]] = []
        for nid, node in api_nodes[1:]:
            try:
                extra_out: dict[str, Any] = {}
                _populate_api_node_output(extra_out, nodes_by_id, nid, node)
                if extra_out:
                    extra_out["node_id"] = nid
                    extra_out["api_provider"] = _api_provider_for_node(node)
                    extra.append(extra_out)
            except Exception:
                pass
        if extra:
            out["extra_api_passes"] = extra

    # Require at least one meaningful field beyond engine + metadata
    meaningful_keys = {k for k in out if k not in ("engine", "metadata")}
    if not meaningful_keys:
        return None
    return out
