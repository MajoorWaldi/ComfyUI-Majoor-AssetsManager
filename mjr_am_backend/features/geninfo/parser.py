"""
GenInfo parser (backend-first).

Goal: deterministically extract generation parameters from a ComfyUI prompt-graph
without "guessing" across unrelated nodes.
"""

from __future__ import annotations

import os
from collections import deque
from dataclasses import dataclass
from typing import Any, Callable, Dict, List, Optional, Set, Tuple, cast

from ...shared import Result, get_logger

logger = get_logger(__name__)

DEFAULT_MAX_GRAPH_NODES = int(os.environ.get("MJR_MAX_GRAPH_NODES", "5000"))
DEFAULT_MAX_LINK_NODES = int(os.environ.get("MJR_MAX_LINK_NODES", "200"))
DEFAULT_MAX_GRAPH_DEPTH = int(os.environ.get("MJR_MAX_GRAPH_DEPTH", "100"))


SINK_CLASS_TYPES: Set[str] = {
    "saveimage",
    "saveimagewebsocket",
    "previewimage",
    "vhs_savevideo",
    "vhs_videocombine",
    "saveanimatedwebp",
    "savegif",
    "savevideo",
    "saveaudio",
    "save_audio",
    "vhs_saveaudio",
}


_VIDEO_SINK_TYPES: Set[str] = {"savevideo", "vhs_savevideo", "vhs_videocombine"}
_AUDIO_SINK_TYPES: Set[str] = {"saveaudio", "save_audio", "vhs_saveaudio"}
_IMAGE_SINK_TYPES: Set[str] = {"saveimage", "saveimagewebsocket", "saveanimatedwebp", "savegif"}


def _sink_group(ct: str) -> int:
    if _sink_is_video(ct):
        return 0
    if _sink_is_audio(ct):
        return 1
    if _sink_is_image(ct):
        return 2
    if _sink_is_preview(ct):
        return 3
    return 4


def _sink_is_video(ct: str) -> bool:
    return ct in _VIDEO_SINK_TYPES or (("save" in ct) and ("video" in ct))


def _sink_is_audio(ct: str) -> bool:
    return ct in _AUDIO_SINK_TYPES or (("save" in ct) and ("audio" in ct))


def _sink_is_image(ct: str) -> bool:
    return ct in _IMAGE_SINK_TYPES or (("save" in ct) and ("image" in ct))


def _sink_is_preview(ct: str) -> bool:
    return ct == "previewimage" or "preview" in ct


def _sink_images_tiebreak(node: Dict[str, Any]) -> int:
    try:
        return 0 if _is_link(_inputs(node).get("images")) else 1
    except Exception:
        return 1


def _sink_node_id_tiebreak(node_id: Optional[str]) -> int:
    try:
        return -int(node_id) if node_id is not None else 0
    except Exception:
        return 0


def _sink_priority(node: Dict[str, Any], node_id: Optional[str] = None) -> Tuple[int, int, int]:
    """
    Rank sinks so we pick the "real" output when multiple sinks exist.

    Video graphs often contain both PreviewImage and SaveVideo; PreviewImage can be
    attached to intermediate nodes and does not reliably reflect the final render.
    """
    ct = _lower(_node_type(node))
    prio = (_sink_group(ct), _sink_images_tiebreak(node), _sink_node_id_tiebreak(node_id))
    # print(f"DEBUG: Sink {node_id} priority {prio}")
    return prio

_MODEL_EXTS: Tuple[str, ...] = (
    ".safetensors",
    ".ckpt",
    ".pt",
    ".pth",
    ".bin",
    ".gguf",
    ".json",
)


def _clean_model_id(value: Any) -> Optional[str]:
    if value is None:
        return None
    s = str(value).strip()
    if not s:
        return None
    s = s.replace("\\", "/")
    s = s.split("/")[-1]
    lower = s.lower()
    for ext in _MODEL_EXTS:
        if lower.endswith(ext):
            return s[: -len(ext)]
    return s


def _to_int(value: Any) -> Optional[int]:
    try:
        if value is None:
            return None
        return int(value)
    except Exception:
        return None


def _looks_like_node_id(value: Any) -> bool:
    """
    Prompt-graph link node ids are usually integers, but some exporters encode ids like
    "57:35" (multi-part numeric ids). Accept only digit-or-digit+colon patterns.
    """
    if value is None:
        return False
    if isinstance(value, int):
        return True
    if not isinstance(value, str):
        return False
    s = value.strip()
    if not s:
        return False
    parts = s.split(":")
    return all(p.isdigit() for p in parts if p != "")


def _is_link(value: Any) -> bool:
    if not isinstance(value, (list, tuple)) or len(value) != 2:
        return False
    a, b = value[0], value[1]
    return _looks_like_node_id(a) and _to_int(b) is not None


def _resolve_link(value: Any) -> Optional[Tuple[str, int]]:
    if not _is_link(value):
        return None
    a, b = value[0], value[1]
    return str(a).strip(), int(_to_int(b) or 0)


def _node_type(node: Any) -> str:
    if not isinstance(node, dict):
        return ""
    return str(node.get("class_type") or node.get("type") or "")


def _inputs(node: Any) -> Dict[str, Any]:
    if not isinstance(node, dict):
        return {}
    ins = node.get("inputs")
    return ins if isinstance(ins, dict) else {}


def _lower(s: Any) -> str:
    return str(s or "").lower()


def _is_numeric_like_text(value: str) -> bool:
    return all(ch.isdigit() or ch.isspace() or ch in ".,+-" for ch in value)


def _has_control_chars(value: str) -> bool:
    return any(ord(ch) < 9 for ch in value)


def _looks_like_prompt_string(value: Any) -> bool:
    """
    Conservative heuristic: accept human-ish prompt strings; reject numbers/gibberish.
    """
    if not isinstance(value, str):
        return False
    s = value.strip()
    if not s or len(s) < 6:
        return False
    if _is_numeric_like_text(s):
        return False
    if _has_control_chars(s):
        return False
    return any(ch.isalpha() for ch in s)


def _is_reroute(node: Dict[str, Any]) -> bool:
    ct = _lower(_node_type(node))
    return ct == "reroute" or "reroute" in ct


def _walk_passthrough(
    nodes_by_id: Dict[str, Dict[str, Any]],
    start_link: Any,
    max_hops: int = 50,
) -> Optional[str]:
    """
    Follow link through obvious pass-through nodes (Reroute).
    Returns the final source node id (string) or None.
    """
    link = _resolve_link(start_link)
    if not link:
        return None
    node_id, _ = link
    hops = 0
    while hops < max_hops:
        hops += 1
        node = nodes_by_id.get(node_id)
        if not isinstance(node, dict):
            return node_id
        if not _is_reroute(node):
            return node_id
        ins = _inputs(node)
        # Reroute nodes typically have a single link input.
        next_link = None
        for v in ins.values():
            if _is_link(v):
                next_link = v
                break
        if not next_link:
            return node_id
        resolved = _resolve_link(next_link)
        if not resolved:
            return node_id
        node_id, _ = resolved
    return node_id


@dataclass(frozen=True)
class _Field:
    value: Any
    confidence: str
    source: str


def _field(value: Any, confidence: str, source: str) -> Optional[Dict[str, Any]]:
    if value is None or value == "":
        return None
    return {"value": value, "confidence": confidence, "source": source}


def _field_name(name: Any, confidence: str, source: str) -> Optional[Dict[str, Any]]:
    if not name:
        return None
    return {"name": name, "confidence": confidence, "source": source}


def _field_size(width: Any, height: Any, confidence: str, source: str) -> Optional[Dict[str, Any]]:
    if width is None or height is None:
        return None
    return {"width": width, "height": height, "confidence": confidence, "source": source}


def _pick_sink_inputs(node: Dict[str, Any]) -> Optional[Any]:
    ins = _inputs(node)
    preferred = ["audio", "audios", "waveform", "images", "image", "frames", "video", "samples", "latent", "latent_image"]
    for k in preferred:
        v = ins.get(k)
        if _is_link(v):
            return v
    for v in ins.values():
        if _is_link(v):
            return v
    return None


def _find_candidate_sinks(nodes_by_id: Dict[str, Dict[str, Any]]) -> List[str]:
    sinks: List[str] = []
    for node_id, node in nodes_by_id.items():
        ct = _lower(_node_type(node))
        if ct in SINK_CLASS_TYPES:
            sinks.append(node_id)
            continue

        # Heuristic for custom save nodes (e.g. WAS, Impact, CR, etc)
        # Must contain "save" or "preview" AND media hint
        if ("save" in ct or "preview" in ct) and ("image" in ct or "video" in ct or "audio" in ct):
            sinks.append(node_id)
            continue

    return sinks


def _collect_upstream_nodes(
    nodes_by_id: Dict[str, Dict[str, Any]],
    start_node_id: str,
    max_nodes: int = DEFAULT_MAX_GRAPH_NODES,
    max_depth: int = DEFAULT_MAX_GRAPH_DEPTH
) -> Dict[str, int]:
    """
    BFS upstream from a node id, returning node->distance.

    Args:
        nodes_by_id: Dictionary of node_id -> node data
        start_node_id: Starting node for traversal
        max_nodes: Maximum number of nodes to visit
        max_depth: Maximum depth to traverse (prevents DoS)
    """
    dist: Dict[str, int] = {}
    q: deque[Tuple[str, int]] = deque([(start_node_id, 0)])

    while q and len(dist) < max_nodes:
        nid, d = q.popleft()

        # Depth limit check
        if d > max_depth:
            continue

        if nid in dist:
            continue
        dist[nid] = d

        node = nodes_by_id.get(nid)
        if not isinstance(node, dict):
            continue

        for v in _inputs(node).values():
            if not _is_link(v):
                continue
            resolved = _resolve_link(v)
            if not resolved:
                continue
            src_id, _ = resolved
            q.append((src_id, d + 1))
    return dist


def _is_sampler(node: Dict[str, Any]) -> bool:
    """
    Return True for sampler-like nodes that represent the core diffusion step.

    Historically this was only "KSampler*", but video/custom stacks (e.g. Wan) use
    different sampler node names while still providing sampler parameters.
    """
    ct = _lower(_node_type(node))
    if not ct:
        return False
    if _is_named_sampler_type(ct):
        return True
    if _has_core_sampler_signature(node):
        return True
    return _is_custom_sampler(node, ct)


def _is_named_sampler_type(ct: str) -> bool:
    if "ksampler" in ct and "select" in ct:
        return False
    if "ksampler" in ct:
        return True
    if "iterativelatentupscale" in ct or "marigold" in ct:
        return True
    if "flux" in ct and ("sampler" in ct or "params" in ct):
        return True
    return ct == "flux2" or "flux_2" in ct


def _has_core_sampler_signature(node: Dict[str, Any]) -> bool:
    try:
        ins = _inputs(node)
    except Exception:
        return False
    has_steps = ins.get("steps") is not None
    has_cfg = any(ins.get(key) is not None for key in ("cfg", "cfg_scale", "guidance"))
    has_seed = any(ins.get(key) is not None for key in ("seed", "noise_seed"))
    return has_steps and has_cfg and has_seed


def _is_custom_sampler(node: Dict[str, Any], ct: str) -> bool:
    if "sampler" not in ct or "select" in ct or "ksamplerselect" in ct:
        return False
    try:
        ins = _inputs(node)
    except (TypeError, ValueError, KeyError):
        return False
    if _is_link(ins.get("model")):
        return True
    if any(ins.get(k) is not None for k in ("steps", "cfg", "cfg_scale", "seed", "scheduler", "denoise")):
        return True
    return _is_link(ins.get("text_embeds")) or _is_link(ins.get("hyvid_embeds"))


def _is_advanced_sampler(node: Dict[str, Any]) -> bool:
    """
    Flux/SD3 pipelines can use SamplerCustomAdvanced which orchestrates multiple nodes:
    - noise -> RandomNoise(noise_seed)
    - sigmas -> BasicScheduler(steps/scheduler/denoise/model)
    - sampler -> KSamplerSelect(sampler_name)
    - guider -> BasicGuider(conditioning/model)
    """
    ct = _lower(_node_type(node))
    if not ct:
        return False
    if "samplercustom" in ct:
        return True
    try:
        ins = _inputs(node)
        # Heuristic: orchestration sampler has these link inputs.
        # Strict check for all 4 caused issues with custom nodes that auto-provide noise/sampler.
        # "guider" + "sigmas" is the defining signature of the advanced decoupled interaction.
        if _is_link(ins.get("guider")) and _is_link(ins.get("sigmas")):
            return True
        # Also accept guider + sampler interaction (common if sigmas handled internally or named differently)
        if _is_link(ins.get("guider")) and _is_link(ins.get("sampler")):
            return True
        keys = ("noise", "guider", "sampler", "sigmas")
        return all(_is_link(ins.get(k)) for k in keys)
    except (TypeError, ValueError, KeyError):
        return False


def _extract_posneg_from_text_embeds(
    nodes_by_id: Dict[str, Dict[str, Any]], text_embeds_link: Any
) -> Tuple[Optional[Tuple[str, str]], Optional[Tuple[str, str]]]:
    """
    Wan/video stacks often encode prompts into "text_embeds" via nodes like
    WanVideoTextEncode which keep positive/negative as plain string inputs.
    """
    src_id = _walk_passthrough(nodes_by_id, text_embeds_link)
    if not src_id:
        return None, None
    node = nodes_by_id.get(src_id)
    if not isinstance(node, dict):
        return None, None
    ins = _inputs(node)

    def _get_str(*keys: str) -> Optional[str]:
        for k in keys:
            v = ins.get(k)
            if isinstance(v, str) and v.strip():
                return v.strip()
        return None

    # WanVideoTextEncode uses 'positive_prompt'/'negative_prompt'
    # HyVideoTextEncode uses 'prompt'
    pos = _get_str("positive", "prompt", "text", "text_g", "text_l", "positive_prompt")
    neg = _get_str("negative", "negative_prompt")

    pos_val = (pos, f"{_node_type(node)}:{src_id}") if pos else None
    neg_val = (neg, f"{_node_type(node)}:{src_id}") if neg else None
    return pos_val, neg_val


def _select_primary_sampler(
    nodes_by_id: Dict[str, Dict[str, Any]], sink_node_id: str
) -> Tuple[Optional[str], str]:
    return _select_sampler_from_sink(nodes_by_id, sink_node_id, _is_sampler)


def _select_advanced_sampler(
    nodes_by_id: Dict[str, Dict[str, Any]], sink_node_id: str
) -> Tuple[Optional[str], str]:
    return _select_sampler_from_sink(nodes_by_id, sink_node_id, _is_advanced_sampler)


def _select_sampler_from_sink(
    nodes_by_id: Dict[str, Dict[str, Any]],
    sink_node_id: str,
    selector: Callable[[Dict[str, Any]], bool],
) -> Tuple[Optional[str], str]:
    start_src = _sink_start_source(nodes_by_id, sink_node_id)
    if not start_src:
        return None, "none"
    candidates = _upstream_sampler_candidates(nodes_by_id, start_src, selector)
    return _best_candidate(candidates)


def _sink_start_source(nodes_by_id: Dict[str, Dict[str, Any]], sink_node_id: str) -> Optional[str]:
    sink = nodes_by_id.get(sink_node_id)
    if not isinstance(sink, dict):
        return None
    start_link = _pick_sink_inputs(sink)
    return _walk_passthrough(nodes_by_id, start_link) if start_link else None


def _upstream_sampler_candidates(
    nodes_by_id: Dict[str, Dict[str, Any]],
    start_src: str,
    selector: Callable[[Dict[str, Any]], bool],
) -> List[Tuple[str, int]]:
    dist = _collect_upstream_nodes(nodes_by_id, start_src)
    candidates: List[Tuple[str, int]] = []
    for nid, depth in dist.items():
        node = nodes_by_id.get(nid)
        if isinstance(node, dict) and selector(node):
            candidates.append((nid, depth))
    return candidates


def _best_candidate(candidates: List[Tuple[str, int]]) -> Tuple[Optional[str], str]:
    if not candidates:
        return None, "none"
    candidates.sort(key=lambda item: item[1])
    best_depth = candidates[0][1]
    best = [nid for nid, depth in candidates if depth == best_depth]
    if len(best) == 1:
        return best[0], "high"
    return best[0], "medium"


def _select_any_sampler(nodes_by_id: Dict[str, Dict[str, Any]]) -> Tuple[Optional[str], str]:
    """
    Last resort when sinks exist but are not linked to the generation branch.
    Choose the "best" sampler-like node in the whole prompt graph.
    """
    candidates = _global_sampler_candidates(nodes_by_id)
    if not candidates:
        return None, "none"
    candidates.sort()
    return candidates[0][2], "low"


def _global_sampler_candidates(nodes_by_id: Dict[str, Dict[str, Any]]) -> List[Tuple[int, int, str]]:
    candidates: List[Tuple[int, int, str]] = []
    for nid, node in nodes_by_id.items():
        if not isinstance(node, dict) or not _is_sampler(node):
            continue
        score = _sampler_candidate_score(_inputs(node))
        candidates.append((-score, _stable_numeric_node_id(nid), nid))
    return candidates


def _sampler_candidate_score(ins: Dict[str, Any]) -> int:
    score = 0
    if _is_link(ins.get("model")):
        score += 3
    if _is_link(ins.get("positive")) or _is_link(ins.get("text_embeds")):
        score += 3
    for key in ("steps", "cfg", "cfg_scale", "seed", "denoise", "scheduler"):
        if ins.get(key) is not None:
            score += 1
    return score


def _stable_numeric_node_id(node_id: str) -> int:
    try:
        return int(node_id)
    except Exception:
        return 10**9


def _trace_sampler_name(nodes_by_id: Dict[str, Dict[str, Any]], link: Any) -> Optional[Tuple[str, str]]:
    src_id = _walk_passthrough(nodes_by_id, link)
    if not src_id:
        return None
    node = nodes_by_id.get(src_id)
    if not isinstance(node, dict):
        return None
    ins = _inputs(node)
    val = _scalar(ins.get("sampler_name")) or _scalar(ins.get("sampler"))
    if val is None:
        return None
    return str(val), f"{_node_type(node)}:{src_id}"


def _trace_noise_seed(nodes_by_id: Dict[str, Dict[str, Any]], link: Any) -> Optional[Tuple[Any, str]]:
    src_id = _walk_passthrough(nodes_by_id, link)
    if not src_id:
        return None
    node = nodes_by_id.get(src_id)
    if not isinstance(node, dict):
        return None
    ins = _inputs(node)
    for k in ("noise_seed", "seed", "value", "int", "number"):
        v = _scalar(ins.get(k))
        if v is not None:
            return v, f"{_node_type(node)}:{src_id}"
    return None


def _trace_scheduler_sigmas(
    nodes_by_id: Dict[str, Dict[str, Any]], link: Any
) -> Tuple[Optional[Any], Optional[Any], Optional[Any], Optional[Any], Optional[Tuple[str, str]], Optional[str]]:
    """
    For advanced sampler pipelines, `sigmas` points to a scheduler node that carries steps/scheduler/denoise
    and sometimes a `model` link.
    """
    src_id = _walk_passthrough(nodes_by_id, link)
    if not src_id:
        return (None, None, None, None, None, None)
    node = nodes_by_id.get(src_id)
    if not isinstance(node, dict):
        return (None, None, None, None, None, None)
    ins = _inputs(node)
    steps = _scalar(ins.get("steps"))
    steps_confidence: Optional[str] = "high" if steps is not None else None
    if steps is None:
        steps, steps_confidence = _steps_from_manual_sigmas(ins)
    scheduler = _scalar(ins.get("scheduler"))
    denoise = _scalar(ins.get("denoise"))
    model_link = ins.get("model") if _is_link(ins.get("model")) else None
    src = f"{_node_type(node)}:{src_id}"
    return (steps, scheduler, denoise, model_link, (src_id, src), steps_confidence)


def _steps_from_manual_sigmas(ins: Dict[str, Any]) -> Tuple[Optional[Any], Optional[str]]:
    # Some video workflows use manual sigma schedules instead of explicit `steps`.
    numeric = _count_numeric_sigma_values(ins.get("sigmas"))
    if numeric >= 2:
        return max(1, numeric - 1), "low"
    return None, None


def _count_numeric_sigma_values(sigmas: Any) -> int:
    try:
        if not (isinstance(sigmas, str) and sigmas.strip()):
            return 0
        raw_parts = [p.strip() for p in sigmas.replace("\n", " ").split(",")]
        parts = [p for p in raw_parts if p]
        numeric = 0
        for p in parts:
            try:
                float(p)
                numeric += 1
            except Exception:
                continue
        return numeric
    except Exception:
        return 0


def _trace_guidance_from_conditioning(nodes_by_id: Dict[str, Dict[str, Any]], conditioning_link: Any) -> Optional[Tuple[Any, str]]:
    start_id = _walk_passthrough(nodes_by_id, conditioning_link)
    if not start_id:
        return None
    dist = _collect_upstream_nodes(nodes_by_id, start_id)
    for nid, d in sorted(dist.items(), key=lambda x: x[1]):
        node = nodes_by_id.get(nid)
        if not isinstance(node, dict):
            continue
        ins = _inputs(node)
        for k in ("guidance", "cfg", "cfg_scale"):
            v = _scalar(ins.get(k))
            if v is not None:
                return v, f"{_node_type(node)}:{nid}"
    return None


def _scalar(value: Any) -> Optional[Any]:
    if value is None:
        return None
    if isinstance(value, (int, float, str)):
        return value
    return None


def _extract_ksampler_widget_params(node: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fallback extraction for KSampler values stored in LiteGraph `widgets_values`.
    Common order:
      [seed, control_after_generate, steps, cfg, sampler_name, scheduler, denoise]
    """
    out: Dict[str, Any] = {}
    if not isinstance(node, dict):
        return out
    ct = _lower(_node_type(node))
    if "ksampler" not in ct:
        return out
    widgets = node.get("widgets_values")
    if not isinstance(widgets, list):
        return out
    return _ksampler_values_from_widgets(widgets)


def _ksampler_values_from_widgets(widgets: List[Any]) -> Dict[str, Any]:
    index_map = {
        "seed": 0,
        "steps": 2,
        "cfg": 3,
        "sampler_name": 4,
        "scheduler": 5,
        "denoise": 6,
    }
    out: Dict[str, Any] = {}
    for field, idx in index_map.items():
        value = _widget_value_at(widgets, idx)
        if value is not None:
            out[field] = value
    return out


def _widget_value_at(widgets: List[Any], index: int) -> Optional[Any]:
    if index < 0 or index >= len(widgets):
        return None
    return widgets[index]


def _extract_lyrics_from_prompt_nodes(nodes_by_id: Dict[str, Dict[str, Any]]) -> Tuple[Optional[str], Optional[Any], Optional[str]]:
    """
    Best-effort lyrics extraction for audio text-encode nodes (AceStep-like nodes).
    Returns: (lyrics, lyrics_strength, source)
    """
    for nid, node in nodes_by_id.items():
        if not isinstance(node, dict):
            continue
        ct = _lower(_node_type(node))
        if "textencode" not in ct and "lyrics" not in ct:
            continue
        lyrics, strength = _extract_lyrics_from_node(node, ct)
        if isinstance(lyrics, str) and lyrics.strip():
            return lyrics, strength, f"{_node_type(node)}:{nid}"
    return None, None, None


def _extract_lyrics_from_node(node: Dict[str, Any], ct: str) -> Tuple[Optional[str], Optional[Any]]:
    ins = _inputs(node)
    lyrics = _extract_lyrics_from_inputs(ins, ct)
    strength = _extract_lyrics_strength(ins)
    return _apply_lyrics_widget_fallback(node.get("widgets_values"), lyrics, strength)


def _extract_lyrics_from_inputs(ins: Dict[str, Any], ct: str) -> Optional[str]:
    lyric_keys: Tuple[str, ...] = ("lyrics", "lyric", "lyric_text", "text_lyrics")
    if "acestep15tasktextencode" in ct or "acesteptasktextencode" in ct:
        lyric_keys = ("lyrics", "lyric", "lyric_text", "text_lyrics", "task_text", "task", "text")
    for key in lyric_keys:
        value = ins.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def _extract_lyrics_strength(ins: Dict[str, Any]) -> Optional[Any]:
    for key in ("lyrics_strength", "lyric_strength"):
        value = _scalar(ins.get(key))
        if value is not None:
            return value
    return None


def _apply_lyrics_widget_fallback(widgets: Any, lyrics: Optional[str], strength: Optional[Any]) -> Tuple[Optional[str], Optional[Any]]:
    if isinstance(widgets, list):
        return _lyrics_widget_fallback_from_list(widgets, lyrics, strength)
    if isinstance(widgets, dict):
        return _lyrics_widget_fallback_from_dict(widgets, lyrics, strength)
    return lyrics, strength


def _lyrics_widget_fallback_from_list(
    widgets: list[Any], lyrics: Optional[str], strength: Optional[Any]
) -> Tuple[Optional[str], Optional[Any]]:
    if not lyrics and len(widgets) > 1 and isinstance(widgets[1], str) and widgets[1].strip():
        lyrics = widgets[1].strip()
    if strength is None and len(widgets) > 2:
        strength = _scalar(widgets[2])
    return lyrics, strength


def _lyrics_widget_fallback_from_dict(
    widgets: Dict[str, Any], lyrics: Optional[str], strength: Optional[Any]
) -> Tuple[Optional[str], Optional[Any]]:
    lyrics = lyrics or _first_non_empty_string(
        widgets, ("lyrics", "lyric_text", "text_lyrics", "task_text", "task", "text")
    )
    if strength is None:
        strength = _first_non_none_scalar(widgets, ("lyrics_strength", "lyric_strength"))
    return lyrics, strength


def _first_non_empty_string(source: Dict[str, Any], keys: Tuple[str, ...]) -> Optional[str]:
    for key in keys:
        value = source.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def _first_non_none_scalar(source: Dict[str, Any], keys: Tuple[str, ...]) -> Optional[Any]:
    for key in keys:
        value = _scalar(source.get(key))
        if value is not None:
            return value
    return None


def _resolve_scalar_from_link(nodes_by_id: Dict[str, Dict[str, Any]], value: Any) -> Optional[Any]:
    src_id = _walk_passthrough(nodes_by_id, value)
    if not src_id:
        return None
    node = nodes_by_id.get(src_id)
    if not isinstance(node, dict):
        return None
    ins = _inputs(node)
    for k in (
        "seed", "value", "number", "int", "float", "text",
        "string", "prompt", "input", "text_a", "text_b"
    ):
        v = ins.get(k)
        s = _scalar(v)
        if s is not None:
            return s
    return None


def _extract_text(nodes_by_id: Dict[str, Dict[str, Any]], link: Any) -> Optional[Tuple[str, str]]:
    node_id = _walk_passthrough(nodes_by_id, link)
    if not node_id:
        return None
    node = nodes_by_id.get(node_id)
    if not isinstance(node, dict):
        return None
    ins = _inputs(node)
    # Text-encode nodes vary: SDXL often uses text_g/text_l, some nodes use "prompt".
    candidates: List[str] = []
    for key in ("text", "prompt", "text_g", "text_l"):
        v = ins.get(key)
        if isinstance(v, str) and v.strip():
            candidates.append(v.strip())
    if candidates:
        return "\n".join(candidates), f"{_node_type(node)}:{node_id}"
    return None


def _looks_like_text_encoder(node: Dict[str, Any]) -> bool:
    """
    Conservative signal: a node that has textual inputs AND a linked `clip` input.
    This avoids "guessing" prompts from unrelated nodes.
    """
    try:
        ins = _inputs(node)
        if not _is_link(ins.get("clip")):
            return False
        for key in ("text", "prompt", "text_g", "text_l", "instruction"):
            v = ins.get(key)
            if isinstance(v, str) and v.strip():
                return True
            if _is_link(v):
                return True
        return False
    except Exception:
        return False


def _looks_like_conditioning_text(node: Dict[str, Any]) -> bool:
    """
    Some custom nodes output CONDITIONING directly without an explicit `clip` link
    but still store the prompt text in a `text`/`prompt` field. Only accept nodes
    that look clearly related to conditioning/prompt generation.
    """
    try:
        ct = _lower(_node_type(node))
        if "conditioning" not in ct and "prompt" not in ct and "textencode" not in ct:
            return False
        ins = _inputs(node)
        for key in ("text", "prompt", "text_g", "text_l", "instruction"):
            v = ins.get(key)
            if _looks_like_prompt_string(v):
                return True
            if _is_link(v):
                return True
        return False
    except Exception:
        return False


def _collect_text_encoder_nodes_from_conditioning(
    nodes_by_id: Dict[str, Dict[str, Any]],
    start_link: Any,
    max_nodes: int = DEFAULT_MAX_LINK_NODES,
    max_depth: int = DEFAULT_MAX_GRAPH_DEPTH,
    branch: Optional[str] = None
) -> List[str]:
    """
    DFS upstream from a conditioning link, collecting "text-encoder-like" node ids.
    Traversal expands only through nodes that look like conditioning composition or
    reroute-ish passthrough nodes.

    Args:
        nodes_by_id: Node dictionary
        start_link: Starting link to trace
        max_nodes: Maximum nodes to visit
        max_depth: Maximum traversal depth
        branch: Optional branch hint ("positive" or "negative")
    """
    start_id = _walk_passthrough(nodes_by_id, start_link)
    if not start_id:
        return []

    visited: Set[str] = set()
    stack: List[Tuple[str, int]] = [(start_id, 0)]
    found: List[str] = []

    while stack and len(visited) < max_nodes:
        nid, depth = stack.pop()
        if depth > max_depth or nid in visited:
            continue
        visited.add(nid)
        node = nodes_by_id.get(nid)
        if not isinstance(node, dict):
            continue

        if _looks_like_text_encoder(node) or _looks_like_conditioning_text(node):
            found.append(nid)
            continue
        if not _conditioning_should_expand(node, branch):
            continue
        _expand_conditioning_frontier(nodes_by_id, stack, visited, _inputs(node), depth, branch)

    # Stable ordering: node id is usually numeric
    def _nid_key(x: str) -> Tuple[int, str]:
        try:
            return int(x), x
        except Exception:
            return 10**9, x

    found.sort(key=_nid_key)
    return found


def _conditioning_should_expand(node: Dict[str, Any], branch: Optional[str]) -> bool:
    ct = _lower(_node_type(node))
    if _conditioning_is_blocked_by_branch(ct, branch):
        return False
    if _conditioning_is_expand_node(ct, node):
        return True
    ins = _inputs(node)
    if any("conditioning" in str(key).lower() for key in ins.keys()):
        return True
    try:
        return _conditioning_has_branch_links(ins, branch)
    except (TypeError, ValueError, KeyError):
        return False


def _conditioning_is_blocked_by_branch(ct: str, branch: Optional[str]) -> bool:
    return branch == "negative" and "conditioningzeroout" in ct


def _conditioning_is_expand_node(ct: str, node: Dict[str, Any]) -> bool:
    return "conditioningsetarea" in ct or _is_reroute(node) or "conditioning" in ct


def _conditioning_has_branch_links(ins: Dict[str, Any], branch: Optional[str]) -> bool:
    if branch in ("positive", "negative") and _is_link(ins.get(branch)):
        return True
    return _is_link(ins.get("positive")) or _is_link(ins.get("negative"))


def _expand_conditioning_frontier(
    nodes_by_id: Dict[str, Dict[str, Any]],
    stack: List[Tuple[str, int]],
    visited: Set[str],
    ins: Dict[str, Any],
    depth: int,
    branch: Optional[str],
) -> None:
    if branch in ("positive", "negative") and _is_link(ins.get(branch)):
        src_id = _walk_passthrough(nodes_by_id, ins.get(branch))
        if src_id and src_id not in visited:
            stack.append((src_id, depth + 1))
        return
    for key, value in ins.items():
        if not _conditioning_key_allowed(key, branch):
            continue
        if not _is_link(value):
            continue
        src_id = _walk_passthrough(nodes_by_id, value)
        if src_id and src_id not in visited:
            stack.append((src_id, depth + 1))


def _conditioning_key_allowed(key: Any, branch: Optional[str]) -> bool:
    key_s = str(key).lower()
    if branch == "positive":
        return key_s not in ("negative", "neg", "negative_prompt") and not key_s.startswith("negative_")
    if branch == "negative":
        return key_s not in ("positive", "pos", "positive_prompt") and not key_s.startswith("positive_")
    return True


def _collect_texts_from_conditioning(
    nodes_by_id: Dict[str, Dict[str, Any]], start_link: Any, max_nodes: int = DEFAULT_MAX_LINK_NODES, branch: Optional[str] = None
) -> List[Tuple[str, str]]:
    """
    Collect prompt text fragments from a conditioning link, returning (text, source).
    Deterministic order; never invents text when none is present.
    """
    node_ids = _collect_text_encoder_nodes_from_conditioning(nodes_by_id, start_link, max_nodes=max_nodes, branch=branch)
    out: List[Tuple[str, str]] = []
    for nid in node_ids:
        node = nodes_by_id.get(nid)
        if not isinstance(node, dict):
            continue
        ins = _inputs(node)
        candidates: List[str] = []
        for key in ("text", "prompt", "text_g", "text_l", "instruction"):
            v = ins.get(key)
            if isinstance(v, str) and v.strip():
                candidates.append(v.strip())
            elif _is_link(v):
                resolved = _resolve_scalar_from_link(nodes_by_id, v)
                if _looks_like_prompt_string(resolved):
                    candidates.append(str(resolved).strip())
        if candidates:
            out.append(("\n".join(candidates), f"{_node_type(node)}:{nid}"))
    return out


def _first_model_string_from_inputs(ins: Dict[str, Any]) -> Optional[str]:
    for key in (
        "ckpt_name",
        "checkpoint",
        "checkpoint_name",
        "model_name",
        "model",
        "diffusion_name",
        "diffusion",
        "diffusion_model",
        "unet_name",
        "unet",
    ):
        value = ins.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()

    for value in ins.values():
        if not isinstance(value, str):
            continue
        model_value = value.strip()
        if not model_value:
            continue
        lower_value = model_value.lower().replace("\\", "/")
        if any(lower_value.endswith(ext) for ext in _MODEL_EXTS):
            return model_value
    return None


def _is_lora_loader_node(ct: str, ins: Dict[str, Any]) -> bool:
    return ("lora" in ct) or (ins.get("lora_name") is not None and _is_link(ins.get("model")))


def _append_lora_entries(
    node: Dict[str, Any],
    node_id: str,
    ins: Dict[str, Any],
    confidence: str,
    loras: List[Dict[str, Any]],
) -> None:
    for key, value in ins.items():
        payload = _build_lora_payload_from_nested_value(
            node=node,
            node_id=node_id,
            key=key,
            value=value,
            confidence=confidence,
        )
        if payload is not None:
            loras.append(payload)

    root_payload = _build_lora_payload_from_inputs(node=node, node_id=node_id, ins=ins, confidence=confidence)
    if root_payload is not None:
        loras.append(root_payload)


def _build_lora_payload_from_nested_value(
    *,
    node: Dict[str, Any],
    node_id: str,
    key: Any,
    value: Any,
    confidence: str,
) -> Optional[Dict[str, Any]]:
    if not _is_nested_lora_key(key) or not isinstance(value, dict):
        return None
    if not _is_enabled_lora_value(value):
        return None
    name = _nested_lora_name(value)
    if not name:
        return None
    return {
        "name": name,
        "strength_model": _nested_lora_strength(value),
        "strength_clip": value.get("strength_clip") or value.get("clip_strength"),
        "confidence": confidence,
        "source": f"{_node_type(node)}:{node_id}:{key}",
    }


def _is_nested_lora_key(key: Any) -> bool:
    return str(key).lower().startswith("lora_")


def _is_enabled_lora_value(value: Dict[str, Any]) -> bool:
    return value.get("on") is not False


def _nested_lora_name(value: Dict[str, Any]) -> Optional[str]:
    return _clean_model_id(value.get("lora") or value.get("lora_name") or value.get("name"))


def _nested_lora_strength(value: Dict[str, Any]) -> Any:
    return value.get("strength") or value.get("strength_model") or value.get("weight") or value.get("lora_strength")


def _build_lora_payload_from_inputs(
    *,
    node: Dict[str, Any],
    node_id: str,
    ins: Dict[str, Any],
    confidence: str,
) -> Optional[Dict[str, Any]]:
    name = _clean_model_id(ins.get("lora_name") or ins.get("lora") or ins.get("name"))
    if not name:
        return None
    strength_model = ins.get("strength_model") or ins.get("strength") or ins.get("weight") or ins.get("lora_strength")
    strength_clip = ins.get("strength_clip") or ins.get("clip_strength")
    return {
        "name": name,
        "strength_model": strength_model,
        "strength_clip": strength_clip,
        "confidence": confidence,
        "source": f"{_node_type(node)}:{node_id}",
    }


def _is_diffusion_loader_node(ct: str) -> bool:
    return (
        "loaddiffusionmodel" in ct
        or "diffusionmodel" in ct
        or "unetloader" in ct
        or "loadunet" in ct
        or ct == "unet"
        or "videomodel" in ct
    )


def _is_generic_model_loader_node(ct: str) -> bool:
    return (
        "modelloader" in ct
        or "model_loader" in ct
        or "model-loader" in ct
        or "ltxvideomodel" in ct
        or "wanvideomodel" in ct
        or "hyvideomodel" in ct
        or "cogvideomodel" in ct
    )


def _is_checkpoint_loader_node(ct: str, ins: Dict[str, Any]) -> bool:
    if ins.get("ckpt_name") is not None:
        return True
    return any(
        token in ct
        for token in (
            "checkpointloader",
            "checkpoint_loader",
            "loadcheckpoint",
            "load_checkpoint",
        )
    )


def _chain_result(next_link: Optional[Any], should_stop: bool) -> Tuple[Optional[Any], bool]:
    return next_link, should_stop


def _handle_lora_chain_node(
    node: Dict[str, Any],
    node_id: str,
    ct: str,
    ins: Dict[str, Any],
    loras: List[Dict[str, Any]],
    confidence: str,
) -> Optional[Tuple[Optional[Any], bool]]:
    if not _is_lora_loader_node(ct, ins):
        return None
    _append_lora_entries(node, node_id, ins, confidence, loras)
    next_model = ins.get("model")
    if _is_link(next_model):
        return _chain_result(next_model, False)
    return _chain_result(None, True)


def _handle_modelsampling_chain_node(ct: str, ins: Dict[str, Any]) -> Optional[Tuple[Optional[Any], bool]]:
    if ("modelsampling" in ct or "model_sampling" in ct) and _is_link(ins.get("model")):
        return _chain_result(ins.get("model"), False)
    return None


def _handle_diffusion_loader_chain_node(
    node: Dict[str, Any],
    node_id: str,
    ct: str,
    ins: Dict[str, Any],
    models: Dict[str, Dict[str, Any]],
    confidence: str,
) -> Optional[Tuple[Optional[Any], bool]]:
    if not _is_diffusion_loader_node(ct):
        return None
    source = f"{_node_type(node)}:{node_id}"
    _set_model_entry_if_missing(
        models,
        "unet",
        _clean_model_id(ins.get("unet_name") or ins.get("unet")),
        confidence,
        source,
    )
    _set_model_entry_if_missing(
        models,
        "diffusion",
        _clean_model_id(
            ins.get("diffusion_name") or ins.get("diffusion") or ins.get("model_name") or ins.get("ckpt_name") or ins.get("model")
        ),
        confidence,
        source,
    )
    return _chain_result_from_model_input(ins)


def _set_model_entry_if_missing(
    models: Dict[str, Dict[str, Any]],
    key: str,
    name: Optional[str],
    confidence: str,
    source: str,
) -> None:
    if name and key not in models:
        models[key] = {"name": name, "confidence": confidence, "source": source}


def _chain_result_from_model_input(ins: Dict[str, Any]) -> Tuple[Optional[Any], bool]:
    next_model = ins.get("model")
    if _is_link(next_model):
        return _chain_result(next_model, False)
    return _chain_result(None, True)


def _handle_generic_loader_chain_node(
    node: Dict[str, Any],
    node_id: str,
    ct: str,
    ins: Dict[str, Any],
    models: Dict[str, Dict[str, Any]],
    confidence: str,
) -> Optional[Tuple[Optional[Any], bool]]:
    if not _is_generic_model_loader_node(ct):
        return None
    name = _clean_model_id(_first_model_string_from_inputs(ins))
    if name:
        models.setdefault(
            "checkpoint",
            {"name": name, "confidence": confidence, "source": f"{_node_type(node)}:{node_id}"},
        )
    return _chain_result(None, True)


def _handle_checkpoint_loader_chain_node(
    node: Dict[str, Any],
    node_id: str,
    ct: str,
    ins: Dict[str, Any],
    models: Dict[str, Dict[str, Any]],
    confidence: str,
) -> Optional[Tuple[Optional[Any], bool]]:
    if not _is_checkpoint_loader_node(ct, ins):
        return None
    ckpt = _clean_model_id(ins.get("ckpt_name") or ins.get("model_name"))
    if ckpt:
        models.setdefault(
            "checkpoint",
            {"name": ckpt, "confidence": confidence, "source": f"{_node_type(node)}:{node_id}"},
        )
    return _chain_result(None, True)


def _handle_switch_selector_chain_node(ct: str, ins: Dict[str, Any]) -> Optional[Tuple[Optional[Any], bool]]:
    if ("switch" in ct or "selector" in ct) and not _is_link(ins.get("model")):
        links = [value for value in ins.values() if _is_link(value)]
        if len(links) == 1:
            return _chain_result(links[0], False)
    return None


def _handle_fallback_chain_node(
    node: Dict[str, Any],
    node_id: str,
    ins: Dict[str, Any],
    models: Dict[str, Dict[str, Any]],
    confidence: str,
) -> Tuple[Optional[Any], bool]:
    name = _clean_model_id(_first_model_string_from_inputs(ins))
    if name and "checkpoint" not in models:
        models["checkpoint"] = {"name": name, "confidence": confidence, "source": f"{_node_type(node)}:{node_id}"}
    next_model = ins.get("model")
    if _is_link(next_model):
        return _chain_result(next_model, False)
    return _chain_result(None, True)


def _process_model_chain_node(
    node: Dict[str, Any],
    node_id: str,
    ct: str,
    ins: Dict[str, Any],
    models: Dict[str, Dict[str, Any]],
    loras: List[Dict[str, Any]],
    confidence: str,
) -> Tuple[Optional[Any], bool]:
    for handler in (
        lambda: _handle_lora_chain_node(node, node_id, ct, ins, loras, confidence),
        lambda: _handle_modelsampling_chain_node(ct, ins),
        lambda: _handle_diffusion_loader_chain_node(node, node_id, ct, ins, models, confidence),
        lambda: _handle_generic_loader_chain_node(node, node_id, ct, ins, models, confidence),
        lambda: _handle_checkpoint_loader_chain_node(node, node_id, ct, ins, models, confidence),
        lambda: _handle_switch_selector_chain_node(ct, ins),
    ):
        handled = handler()
        if handled is not None:
            return handled
    return _handle_fallback_chain_node(node, node_id, ins, models, confidence)


def _trace_model_chain(
    nodes_by_id: Dict[str, Dict[str, Any]], model_link: Any, confidence: str
) -> Tuple[Dict[str, Dict[str, Any]], List[Dict[str, Any]]]:
    loras: List[Dict[str, Any]] = []
    models: Dict[str, Dict[str, Any]] = {}

    current_link = model_link
    hops = 0
    while current_link is not None and hops < 80:
        hops += 1
        node_id = _walk_passthrough(nodes_by_id, current_link)
        if not node_id:
            break
        node = nodes_by_id.get(node_id)
        if not isinstance(node, dict):
            break

        next_link, should_stop = _process_model_chain_node(
            node,
            node_id,
            _lower(_node_type(node)),
            _inputs(node),
            models,
            loras,
            confidence,
        )
        if should_stop:
            break
        current_link = next_link

    return models, loras


def _trace_named_loader(nodes_by_id: Dict[str, Dict[str, Any]], link: Any, keys: Tuple[str, ...], confidence: str) -> Optional[Dict[str, Any]]:
    current_link = link
    hops = 0
    while current_link is not None and hops < 80:
        hops += 1
        node_id = _walk_passthrough(nodes_by_id, current_link)
        if not node_id:
            return None
        node = nodes_by_id.get(node_id)
        if not isinstance(node, dict):
            return None
        ins = _inputs(node)
        source = f"{_node_type(node)}:{node_id}"
        named = _extract_named_loader_model(ins, keys, confidence=confidence, source=source)
        if named is not None:
            return named
        current_link = _next_named_loader_link(ins)
        if current_link is None:
            return None
    return None


def _extract_named_loader_model(
    ins: Dict[str, Any], keys: Tuple[str, ...], *, confidence: str, source: str
) -> Optional[Dict[str, Any]]:
    dual_clip = _extract_dual_clip_name(ins, keys)
    if dual_clip is not None:
        return {"name": dual_clip, "confidence": confidence, "source": source}
    for key in keys:
        name = _clean_model_id(ins.get(key))
        if name:
            return {"name": name, "confidence": confidence, "source": source}
    return None


def _extract_dual_clip_name(ins: Dict[str, Any], keys: Tuple[str, ...]) -> Optional[str]:
    if "clip_name1" not in keys or "clip_name2" not in keys:
        return None
    c1 = _clean_model_id(ins.get("clip_name1"))
    c2 = _clean_model_id(ins.get("clip_name2"))
    if c1 and c2:
        return f"{c1} + {c2}"
    return None


def _next_named_loader_link(ins: Dict[str, Any]) -> Optional[Any]:
    for key in ("clip", "vae", "model"):
        value = ins.get(key)
        if _is_link(value):
            return value
    return None


def _trace_vae_from_sink(nodes_by_id: Dict[str, Dict[str, Any]], sink_start_id: str, confidence: str) -> Optional[Dict[str, Any]]:
    dist = _collect_upstream_nodes(nodes_by_id, sink_start_id)
    candidates: List[Tuple[str, int]] = []
    for nid, d in dist.items():
        node = nodes_by_id.get(nid)
        if not isinstance(node, dict):
            continue
        ct = _lower(_node_type(node))
        if "vaedecode" in ct:
            candidates.append((nid, d))
    if not candidates:
        return None
    candidates.sort(key=lambda x: x[1])
    node_id = candidates[0][0]
    node = nodes_by_id.get(node_id) or {}
    ins = _inputs(node)
    if _is_link(ins.get("vae")):
        return _trace_named_loader(nodes_by_id, ins.get("vae"), ("vae_name", "name"), confidence)
    return None


def _trace_clip_from_text_encoder(nodes_by_id: Dict[str, Dict[str, Any]], encoder_link: Any, confidence: str) -> Optional[Dict[str, Any]]:
    encoder_id = _walk_passthrough(nodes_by_id, encoder_link)
    if encoder_id:
        node = nodes_by_id.get(encoder_id)
        if isinstance(node, dict) and _is_link(_inputs(node).get("clip")):
            return _trace_named_loader(
                nodes_by_id,
                _inputs(node).get("clip"),
                ("clip_name", "clip_name1", "clip_name2", "clip_name_l", "clip_name_g", "name"),
                confidence,
            )

    # Fallback: encoder_link might point to a Conditioning* node; collect upstream encoders.
    encoders = _collect_text_encoder_nodes_from_conditioning(nodes_by_id, encoder_link, branch="positive")
    if not encoders:
        return None
    node = nodes_by_id.get(encoders[0])
    if not isinstance(node, dict):
        return None
    clip_link = _inputs(node).get("clip")
    if not _is_link(clip_link):
        return None
    return _trace_named_loader(
        nodes_by_id, clip_link, ("clip_name", "clip_name1", "clip_name2", "clip_name_l", "clip_name_g", "name"), confidence
    )


def _trace_clip_skip(nodes_by_id: Dict[str, Dict[str, Any]], clip_link: Any, confidence: str) -> Optional[Dict[str, Any]]:
    current_link = clip_link
    hops = 0
    while current_link is not None and hops < 60:
        hops += 1
        node_id = _walk_passthrough(nodes_by_id, current_link)
        if not node_id:
            return None
        node = nodes_by_id.get(node_id)
        if not isinstance(node, dict):
            return None
        ct = _lower(_node_type(node))
        ins = _inputs(node)
        if "clipsetlastlayer" in ct or "clipsetlastlayer" in ct.replace("_", ""):
            val = ins.get("stop_at_clip_layer") or ins.get("clip_stop_at_layer") or ins.get("clip_skip")
            v = _scalar(val)
            return _field(v, confidence, f"{_node_type(node)}:{node_id}")
        next_clip = ins.get("clip")
        if _is_link(next_clip):
            current_link = next_clip
            continue
        return None
    return None


def _trace_size(nodes_by_id: Dict[str, Dict[str, Any]], latent_link: Any, confidence: str) -> Optional[Dict[str, Any]]:
    current_link = latent_link
    hops = 0
    while current_link is not None and hops < 80:
        hops += 1
        node_id = _walk_passthrough(nodes_by_id, current_link)
        if not node_id:
            return None
        node = nodes_by_id.get(node_id)
        if not isinstance(node, dict):
            return None
        ct = _lower(_node_type(node))
        ins = _inputs(node)
        size = _size_field_from_node(node, node_id, ct, ins, confidence)
        if size:
            return size
        next_link = _next_latent_link(ins)
        if not next_link:
            return None
        current_link = next_link
    return None


def _size_field_from_node(
    node: Dict[str, Any],
    node_id: str,
    node_type: str,
    ins: Dict[str, Any],
    confidence: str,
) -> Optional[Dict[str, Any]]:
    width = _scalar(ins.get("width"))
    height = _scalar(ins.get("height"))
    if "emptylatentimage" in node_type:
        return _field_size(width, height, confidence, f"{_node_type(node)}:{node_id}")
    if width is None or height is None:
        return None
    return _field_size(width, height, confidence, f"{_node_type(node)}:{node_id}")


def _next_latent_link(ins: Dict[str, Any]) -> Optional[Any]:
    for key in ("samples", "latent", "latent_image", "image"):
        value = ins.get(key)
        if _is_link(value):
            return value
    return None


def _trace_guidance_value(nodes_by_id: Dict[str, Dict[str, Any]], start_link: Any, max_hops: int = 15) -> Optional[Tuple[float, str]]:
    """
    Traverse conditioning chain upstream to find a node providing 'guidance' (Flux).
    """
    start_id = _walk_passthrough(nodes_by_id, start_link)
    if not start_id:
        return None

    # stack: (node_id, depth)
    stack = [(start_id, 0)]
    visited = set()

    while stack:
        nid, depth = stack.pop()
        if nid in visited or depth > max_hops:
            continue
        visited.add(nid)

        node = nodes_by_id.get(nid)
        if not isinstance(node, dict):
            continue

        ins = _inputs(node)
        # Check if this node has guidance
        g_val = _scalar(ins.get("guidance"))
        if g_val is not None:
             return float(g_val), f"{_node_type(node)}:{nid}"

        if not _guidance_should_expand(node, ins):
            continue
        for src in _iter_guidance_conditioning_sources(nodes_by_id, ins):
            if src not in visited:
                stack.append((src, depth + 1))
    return None


def _guidance_should_expand(node: Dict[str, Any], ins: Dict[str, Any]) -> bool:
    if _is_reroute(node):
        return True
    ct = _lower(_node_type(node))
    if "conditioning" in ct or "guider" in ct or "flux" in ct:
        return True
    return any("conditioning" in str(k).lower() for k in ins.keys())


def _iter_guidance_conditioning_sources(
    nodes_by_id: Dict[str, Dict[str, Any]], ins: Dict[str, Any]
) -> List[str]:
    sources: List[str] = []
    for key, value in ins.items():
        if "conditioning" not in str(key).lower() or not _is_link(value):
            continue
        src = _walk_passthrough(nodes_by_id, value)
        if src:
            sources.append(src)
    return sources


def _extract_workflow_metadata(workflow: Any) -> Dict[str, Any]:
    meta = {}
    if isinstance(workflow, dict):
        extra = workflow.get("extra", {})
        if isinstance(extra, dict):
            for k in ("title", "author", "license", "version", "description"):
                if extra.get(k):
                    meta[k] = str(extra[k]).strip()
    return meta



_INPUT_ROLE_PRIORITY: Tuple[str, ...] = (
    "first_frame",
    "last_frame",
    "mask/inpaint",
    "depth",
    "control_video",
    "control_image",
    "control",
    "source",
    "style/reference",
    "frame_range",
)
_INPUT_FILENAME_KEYS: Tuple[str, ...] = (
    "image",
    "video",
    "filename",
    "audio",
    "file",
    "media_source",
    "path",
    "image_path",
    "video_path",
    "audio_path",
)


def _subject_role_hints(subject: Optional[Dict[str, Any]]) -> Set[str]:
    roles: Set[str] = set()
    if not isinstance(subject, dict):
        return roles
    title = _lower(subject.get("_meta", {}).get("title", "") or subject.get("title", ""))
    ins = _inputs(subject)
    filename = _lower(str(ins.get("image", "") or ins.get("video", "") or ""))
    _add_subject_role_if_match(roles, "first_frame", title=title, filename=filename, title_tokens=("first", "start"), filename_tokens=("first",))
    _add_subject_role_if_match(roles, "last_frame", title=title, filename=filename, title_tokens=("last", "end"), filename_tokens=("last",))
    _add_subject_role_if_match(roles, "control", title=title, filename=filename, title_tokens=("control",), filename_tokens=())
    _add_subject_role_if_match(roles, "mask/inpaint", title=title, filename=filename, title_tokens=("mask", "inpaint"), filename_tokens=())
    _add_subject_role_if_match(roles, "depth", title=title, filename=filename, title_tokens=("depth",), filename_tokens=())
    _add_subject_role_if_match(
        roles,
        "style/reference",
        title=title,
        filename=filename,
        title_tokens=("reference", "ref", "style"),
        filename_tokens=(),
    )
    return roles


def _contains_any_token(value: str, tokens: Tuple[str, ...]) -> bool:
    return any(token in value for token in tokens)


def _add_subject_role_if_match(
    roles: Set[str],
    role: str,
    *,
    title: str,
    filename: str,
    title_tokens: Tuple[str, ...],
    filename_tokens: Tuple[str, ...],
) -> None:
    if _contains_any_token(title, title_tokens) or _contains_any_token(filename, filename_tokens):
        roles.add(role)


def _linked_input_from_frontier(node: Dict[str, Any], frontier: Set[str]) -> Optional[str]:
    for key, value in _inputs(node).items():
        if not _is_link(value):
            continue
        resolved = _resolve_link(value)
        if not resolved:
            continue
        src_id, _ = resolved
        if str(src_id) in frontier:
            return str(key).lower()
    return None


def _classify_control_or_mask_role(
    target_type: str,
    hit_input_name: str,
    subject_is_video: bool,
) -> Optional[str]:
    if "ipadapter" in target_type:
        return "style/reference"
    if "controlnet" in target_type:
        return "control_video" if subject_is_video else "control_image"
    if "mask" in hit_input_name or "mask" in target_type or "inpaint" in target_type:
        return "mask/inpaint"
    if "depth" in target_type or "depth" in hit_input_name:
        return "depth"
    return None


def _classify_vace_or_range_role(target_type: str, hit_input_name: str) -> Optional[str]:
    if _is_vace_target_type(target_type):
        edge_role = _frame_edge_role(hit_input_name)
        if "control" in hit_input_name or "reference" in hit_input_name:
            return "control_video"
        return edge_role or "source"
    if _is_frame_range_target_type(target_type):
        return _frame_edge_role(hit_input_name) or "frame_range"
    return None


def _is_vace_target_type(target_type: str) -> bool:
    return "vace" in target_type or "wanvace" in target_type


def _is_frame_range_target_type(target_type: str) -> bool:
    return "starttoend" in target_type or "framerange" in target_type


def _frame_edge_role(hit_input_name: str) -> Optional[str]:
    if "start" in hit_input_name or "first" in hit_input_name:
        return "first_frame"
    if "end" in hit_input_name or "last" in hit_input_name:
        return "last_frame"
    return None


def _classify_generic_source_role(target_type: str, hit_input_name: str) -> Optional[str]:
    edge_role = _edge_role_from_input_name(hit_input_name)
    if edge_role:
        return edge_role
    if _target_type_is_source_like(target_type):
        return "source"
    if _sampler_input_is_source(target_type, hit_input_name):
        return "source"
    return None


def _edge_role_from_input_name(hit_input_name: str) -> Optional[str]:
    if "first" in hit_input_name or "start" in hit_input_name:
        return "first_frame"
    if "last" in hit_input_name or "end" in hit_input_name:
        return "last_frame"
    return None


def _target_type_is_source_like(target_type: str) -> bool:
    return "img2vid" in target_type or "i2v" in target_type or "vaeencode" in target_type


def _sampler_input_is_source(target_type: str, hit_input_name: str) -> bool:
    return "sampler" in target_type and ("image" in hit_input_name or "latent" in hit_input_name)


def _classify_downstream_input_role(
    target_type: str,
    hit_input_name: str,
    subject_is_video: bool,
) -> Tuple[Optional[str], bool]:
    role = _classify_control_or_mask_role(target_type, hit_input_name, subject_is_video)
    if role:
        return role, False
    role = _classify_vace_or_range_role(target_type, hit_input_name)
    if role:
        return role, False
    role = _classify_generic_source_role(target_type, hit_input_name)
    if role:
        return role, False
    return None, True


def _detect_input_role(nodes_by_id: Dict[str, Any], subject_node_id: str) -> str:
    """
    Determine how an input node is used (e.g. 'first_frame', 'last_frame', 'reference',
    'control_video', 'control_image', 'mask/inpaint', 'source', 'style', 'depth').
    Performs a limited-depth BFS downstream to handle intermediate nodes (Resize, VAE, etc).
    """
    subject_id = str(subject_node_id)
    subject = nodes_by_id.get(subject_id) or nodes_by_id.get(subject_node_id)
    roles = _subject_role_hints(subject if isinstance(subject, dict) else None)
    subject_is_video = isinstance(subject, dict) and ("video" in _lower(_node_type(subject)))
    roles.update(_detect_roles_from_downstream(nodes_by_id, subject_id, subject_is_video))

    for role in _INPUT_ROLE_PRIORITY:
        if role in roles:
            return role
    return "input"


def _detect_roles_from_downstream(
    nodes_by_id: Dict[str, Any],
    subject_id: str,
    subject_is_video: bool,
) -> Set[str]:
    roles: Set[str] = set()
    frontier: Set[str] = {subject_id}
    visited: Set[str] = {subject_id}
    for _ in range(8):
        if not frontier:
            break
        next_frontier = _scan_downstream_frontier(
            nodes_by_id,
            frontier,
            visited,
            subject_is_video,
            roles,
        )
        visited.update(next_frontier)
        frontier = next_frontier
    return roles


def _scan_downstream_frontier(
    nodes_by_id: Dict[str, Any],
    frontier: Set[str],
    visited: Set[str],
    subject_is_video: bool,
    roles: Set[str],
) -> Set[str]:
    next_frontier: Set[str] = set()
    for nid, node in nodes_by_id.items():
        nid_s = str(nid)
        if nid_s in visited or not isinstance(node, dict):
            continue
        hit_input_name = _linked_input_from_frontier(node, frontier)
        if hit_input_name is None:
            continue
        role, should_expand = _classify_downstream_input_role(
            _lower(_node_type(node)),
            hit_input_name,
            subject_is_video,
        )
        if role:
            roles.add(role)
        if should_expand:
            next_frontier.add(nid_s)
    return next_frontier


def _loader_kind_from_node_type(node_type: str) -> Optional[str]:
    ntype_clean = node_type.replace(" ", "").replace("_", "").replace("-", "")
    is_image_load = _node_type_matches_any(ntype_clean, ("loadimage", "imageloader", "inputimage"))
    is_video_load = _node_type_matches_any(ntype_clean, ("loadvideo", "videoloader", "inputvideo"))
    is_audio_load = _node_type_matches_any(ntype_clean, ("loadaudio", "audioloader", "inputaudio"))
    if "ipadapter" in ntype_clean and "image" in ntype_clean:
        is_image_load = True
    if is_audio_load:
        return "audio"
    if is_video_load:
        return "video"
    if is_image_load:
        return "image"
    return None


def _node_type_matches_any(node_type_clean: str, needles: Tuple[str, ...]) -> bool:
    return any(needle in node_type_clean for needle in needles)


def _extract_loader_filename(node: Dict[str, Any], ins: Dict[str, Any]) -> Optional[str]:
    direct = _loader_filename_from_inputs(ins)
    if direct:
        return direct
    return _loader_filename_from_widgets(node.get("widgets_values"))


def _loader_filename_from_inputs(ins: Dict[str, Any]) -> Optional[str]:
    for key in _INPUT_FILENAME_KEYS:
        value = ins.get(key)
        if isinstance(value, str) and value:
            return value
    return None


def _loader_filename_from_widgets(widgets: Any) -> Optional[str]:
    if not isinstance(widgets, list):
        return None
    for widget_value in widgets:
        if _looks_like_loader_filename(widget_value):
            return str(widget_value)
    return None


def _looks_like_loader_filename(value: Any) -> bool:
    if not isinstance(value, str):
        return False
    return ("." in value or "/" in value or "\\" in value) and len(value) > 4


def _extract_input_files(nodes_by_id: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Extract input file references (LoadImage/LoadVideo/LoadAudio, etc) with usage context.
    """
    inputs: List[Dict[str, Any]] = []
    seen: Set[Tuple[str, str, str]] = set()

    for nid, node in nodes_by_id.items():
        if not isinstance(node, dict):
            continue
        node_type = _lower(_node_type(node))
        kind = _loader_kind_from_node_type(node_type)
        if kind is None:
            continue

        ins = _inputs(node)
        filename = _extract_loader_filename(node, ins)
        if not isinstance(filename, str) or not filename:
            continue

        subfolder = ins.get("subfolder", "") or ""
        dedupe_key = (filename, str(subfolder), node_type)
        if dedupe_key in seen:
            continue
        seen.add(dedupe_key)

        inputs.append(
            {
                "filename": filename,
                "subfolder": subfolder,
                "type": kind,
                "node_id": nid,
                "folder_type": ins.get("type", "input"),
                "role": _detect_input_role(nodes_by_id, nid),
            }
        )

    return inputs


def _collect_all_prompts_from_sinks(
    nodes_by_id: Dict[str, Any],
    sinks: List[str],
    max_sinks: int = 20
) -> Tuple[List[str], List[str]]:
    """
    Collect all distinct positive and negative prompts from multiple sinks.

    For multi-output workflows (like batch generation with different prompts),
    this gathers all unique prompts to show the user what variants were generated.

    Returns:
        (all_positive_prompts, all_negative_prompts) - deduplicated lists
    """
    all_positive: List[str] = []
    all_negative: List[str] = []
    seen_pos: Set[str] = set()
    seen_neg: Set[str] = set()

    for sink_id in sinks[:max_sinks]:
        try:
            sampler_node = _resolve_sink_sampler_node(nodes_by_id, sink_id)
            if sampler_node is None:
                continue
            ins = _inputs(sampler_node)
            _collect_prompt_branch_from_input(nodes_by_id, ins.get("positive"), "positive", seen_pos, all_positive)
            _collect_prompt_branch_from_input(nodes_by_id, ins.get("negative"), "negative", seen_neg, all_negative)
        except Exception:
            continue

    return all_positive, all_negative


def _resolve_sink_sampler_node(nodes_by_id: Dict[str, Any], sink_id: str) -> Optional[Dict[str, Any]]:
    sampler_id, _ = _select_primary_sampler(nodes_by_id, sink_id)
    if not sampler_id:
        sampler_id, _ = _select_advanced_sampler(nodes_by_id, sink_id)
    if not sampler_id:
        return None
    sampler_node = nodes_by_id.get(sampler_id)
    return sampler_node if isinstance(sampler_node, dict) else None


def _collect_prompt_branch_from_input(
    nodes_by_id: Dict[str, Any],
    input_value: Any,
    branch: str,
    seen: Set[str],
    out: List[str],
) -> None:
    if not _is_link(input_value):
        return
    items = _collect_texts_from_conditioning(nodes_by_id, input_value, branch=branch)
    for text, _ in items:
        stripped = text.strip()
        if not stripped or stripped in seen:
            continue
        seen.add(stripped)
        out.append(stripped)


def _workflow_sink_suffix(sink_type: str) -> str:
    is_audio_out = ("audio" in sink_type) and ("image" not in sink_type) and ("video" not in sink_type)
    is_video_out = (not is_audio_out) and ("video" in sink_type or "animate" in sink_type or "gif" in sink_type)
    return "A" if is_audio_out else ("V" if is_video_out else "I")


def _scan_graph_input_kinds(nodes_by_id: Dict[str, Any]) -> Tuple[bool, bool, bool]:
    has_image_input = False
    has_video_input = False
    has_audio_input = False

    for node in nodes_by_id.values():
        if not isinstance(node, dict):
            continue
        ct = _lower(_node_type(node))

        if "vaeencode" in ct:
            pixel_kind = _vae_pixel_input_kind(nodes_by_id, node)
            if pixel_kind == "video":
                has_video_input = True
            elif pixel_kind == "image":
                has_image_input = True

        if _is_image_loader_node_type(ct):
            has_image_input = True
        if _is_video_loader_node_type(ct):
            has_video_input = True
        if _is_audio_loader_node_type(ct):
            has_audio_input = True

    return has_image_input, has_video_input, has_audio_input


def _is_image_loader_node_type(ct: str) -> bool:
    return "loadimage" in ct or "imageloader" in ct


def _is_video_loader_node_type(ct: str) -> bool:
    return "loadvideo" in ct or "videoloader" in ct


def _is_audio_loader_node_type(ct: str) -> bool:
    return "loadaudio" in ct or "audioloader" in ct or ("load" in ct and "audio" in ct)


def _vae_pixel_input_kind(nodes_by_id: Dict[str, Any], vae_node: Dict[str, Any]) -> Optional[str]:
    vae_ins = _inputs(vae_node)
    pixel_link = vae_ins.get("pixels") or vae_ins.get("image")
    if not _is_link(pixel_link):
        return None
    pix_src_id = _walk_passthrough(nodes_by_id, pixel_link)
    if not pix_src_id:
        return None
    pct = _lower(_node_type(nodes_by_id.get(pix_src_id)))
    if _is_video_loader_node_type(pct):
        return "video"
    if _is_image_loader_node_type(pct):
        return "image"
    return None


def _next_latent_upstream_id(nodes_by_id: Dict[str, Any], node: Dict[str, Any]) -> Optional[str]:
    for key in ("samples", "latent", "latent_image"):
        value = _inputs(node).get(key)
        if _is_link(value):
            return _walk_passthrough(nodes_by_id, value)
    return None


def _trace_sampler_latent_input_kind(
    nodes_by_id: Dict[str, Any],
    sampler_id: Optional[str],
    has_image_input: bool,
    has_video_input: bool,
) -> Tuple[bool, bool]:
    if not sampler_id:
        return has_image_input, has_video_input
    sampler = nodes_by_id.get(sampler_id)
    if not isinstance(sampler, dict):
        return has_image_input, has_video_input

    ins = _inputs(sampler)
    latent_link = ins.get("latent_image") or ins.get("samples") or ins.get("latent")
    if not _is_link(latent_link):
        return has_image_input, has_video_input

    curr_id = _walk_passthrough(nodes_by_id, latent_link)
    hops = 0
    while curr_id and hops < 15:
        hops += 1
        node = nodes_by_id.get(curr_id)
        if not isinstance(node, dict):
            break
        has_image_input, has_video_input, should_stop = _update_inputs_from_latent_node(
            nodes_by_id,
            node,
            has_image_input=has_image_input,
            has_video_input=has_video_input,
        )
        if should_stop:
            break

        curr_id = _next_latent_upstream_id(nodes_by_id, node)

    return has_image_input, has_video_input


def _update_inputs_from_latent_node(
    nodes_by_id: Dict[str, Any],
    node: Dict[str, Any],
    *,
    has_image_input: bool,
    has_video_input: bool,
) -> Tuple[bool, bool, bool]:
    ct = _lower(_node_type(node))
    if "emptylatent" in ct:
        return has_image_input, has_video_input, True
    if "vaeencode" in ct:
        pixel_kind = _vae_pixel_input_kind(nodes_by_id, node)
        if pixel_kind == "video":
            has_video_input = True
        else:
            has_image_input = True
        return has_image_input, has_video_input, True
    if "loadlatent" in ct:
        return True, has_video_input, True
    return has_image_input, has_video_input, False


def _workflow_input_prefix(has_image_input: bool, has_video_input: bool, has_audio_input: bool) -> str:
    if has_audio_input:
        return "A"
    if has_video_input:
        return "V"
    if has_image_input:
        return "I"
    return "T"


def _determine_workflow_type(nodes_by_id: Dict[str, Any], sink_node_id: str, sampler_id: Optional[str]) -> str:
    """
    Classify: T2I/I2I/T2V/I2V/V2V and audio variants (T2A/A2A)

    Improved detection:
    - Checks latent path (EmptyLatent vs VAEEncode)
    - Also scans for LoadImage/LoadVideo nodes feeding into VAEEncode anywhere in the graph
      (for reference-based workflows like Flux2 Redux, IP-Adapter, ControlNet, etc.)
    """
    sink = nodes_by_id.get(sink_node_id)
    suffix = _workflow_sink_suffix(_lower(_node_type(sink)))
    has_image_input, has_video_input, has_audio_input = _scan_graph_input_kinds(nodes_by_id)
    has_image_input, has_video_input = _trace_sampler_latent_input_kind(
        nodes_by_id,
        sampler_id,
        has_image_input,
        has_video_input,
    )
    prefix = _workflow_input_prefix(has_image_input, has_video_input, has_audio_input)
    return f"{prefix}2{suffix}"


def parse_geninfo_from_prompt(prompt_graph: Any, workflow: Any = None) -> Result[Optional[Dict[str, Any]]]:
    """
    Parse generation information from a ComfyUI prompt graph (dict of nodes).
    Returns Ok(None) when not enough information is available (do-not-lie).
    """
    # Extract workflow metadata (safe operation)
    workflow_meta = _extract_workflow_metadata(workflow)

    # Validate and normalize input graph
    try:
        nodes_by_id = _normalize_graph_input(prompt_graph, workflow)
    except ValueError:
        return _geninfo_metadata_only_result(workflow_meta)

    if not nodes_by_id:
        return _geninfo_metadata_only_result(workflow_meta)

    # Find sink nodes
    try:
        sinks = _find_candidate_sinks(nodes_by_id)
    except Exception as e:
        logger.warning(f"Sink detection failed: {e}")
        sinks = []

    if not sinks:
        return _geninfo_metadata_only_result(workflow_meta)

    # Prefer "real" sinks (SaveVideo over PreviewImage, etc.)
    try:
        sinks.sort(key=lambda nid: _sink_priority(nodes_by_id.get(nid, {}) or {}, nid))

        sink_id = sinks[0]
        sampler_id, sampler_conf = _select_primary_sampler(nodes_by_id, sink_id)

        # ... logic continues ...
        # Since I'm refactoring the monolithic block, I'll call a helper for the core logic
        # OR I can inline the rest if it's manageable. The main issue was the huge try/except.
        # Let's delegate the rest of extraction to a helper or just protect the extraction part.

        return _extract_geninfo(nodes_by_id, sinks, workflow_meta)

    except (ValueError, TypeError, KeyError, AttributeError) as e:
        logger.warning(f"GenInfo parsing failed: {e}")
        return _geninfo_metadata_only_result(workflow_meta)
    except Exception as e:
        # Unexpected error - log with full traceback for debugging
        logger.exception(f"Unexpected error in GenInfo parsing: {e}")
        return _geninfo_metadata_only_result(workflow_meta)


def _geninfo_metadata_only_result(workflow_meta: Optional[Dict[str, Any]]) -> Result[Optional[Dict[str, Any]]]:
    if workflow_meta:
        return Result.Ok({"metadata": workflow_meta})
    return Result.Ok(None)

def _resolve_graph_target(prompt_graph: Any, workflow: Any) -> Optional[Dict[str, Any]]:
    if isinstance(prompt_graph, dict) and prompt_graph:
        return prompt_graph
    if isinstance(workflow, dict) and "nodes" in workflow:
        return workflow
    return None


def _build_link_source_map(links: Any) -> Dict[int, Tuple[int, int]]:
    link_to_source: Dict[int, Tuple[int, int]] = {}
    if not isinstance(links, list):
        return link_to_source
    for link in links:
        if isinstance(link, list) and len(link) >= 3:
            link_id, src_node, src_slot = link[0], link[1], link[2]
            link_to_source[link_id] = (src_node, src_slot)
    return link_to_source


def _convert_litegraph_node(
    node: Dict[str, Any],
    link_to_source: Dict[int, Tuple[int, int]],
) -> Dict[str, Any]:
    converted = _init_litegraph_converted_node(node)
    raw_inputs = node.get("inputs", [])
    widgets_values = node.get("widgets_values", [])
    widgets_list = widgets_values if isinstance(widgets_values, list) else []
    converted_inputs = _populate_converted_inputs(converted, raw_inputs, widgets_list, link_to_source)
    _merge_widget_dict_inputs(converted_inputs, widgets_values)
    _set_text_fallback_from_widgets(converted_inputs, widgets_list, node)
    return converted


def _init_litegraph_converted_node(node: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "class_type": node.get("type"),
        "type": node.get("type"),
        "id": node.get("id"),
        "inputs": {},
        "widgets_values": node.get("widgets_values"),
        "outputs": node.get("outputs"),
        "properties": node.get("properties"),
        "title": node.get("title"),
        "mode": node.get("mode"),
    }


def _populate_converted_inputs(
    converted: Dict[str, Any],
    raw_inputs: Any,
    widgets_list: List[Any],
    link_to_source: Dict[int, Tuple[int, int]],
) -> Dict[str, Any]:
    converted_inputs = converted.get("inputs")
    if isinstance(raw_inputs, list) and isinstance(converted_inputs, dict):
        _populate_converted_inputs_from_list(converted_inputs, raw_inputs, widgets_list, link_to_source)
        return converted_inputs
    if isinstance(raw_inputs, dict):
        converted["inputs"] = cast(Dict[str, Any], raw_inputs)
        converted_inputs = converted.get("inputs")
    return cast(Dict[str, Any], converted_inputs or {})


def _populate_converted_inputs_from_list(
    converted_inputs: Dict[str, Any],
    raw_inputs: List[Any],
    widgets_list: List[Any],
    link_to_source: Dict[int, Tuple[int, int]],
) -> None:
    widget_idx = 0
    for inp in raw_inputs:
        if not isinstance(inp, dict):
            continue
        name = inp.get("name")
        if not name:
            continue
        link_id = inp.get("link")
        if link_id is not None and link_id in link_to_source:
            src_node_id, src_slot = link_to_source[link_id]
            converted_inputs[name] = [str(src_node_id), src_slot]
            continue
        if "widget" in inp:
            if widget_idx < len(widgets_list):
                converted_inputs[name] = widgets_list[widget_idx]
            widget_idx += 1


def _merge_widget_dict_inputs(converted_inputs: Dict[str, Any], widgets_values: Any) -> None:
    if not isinstance(widgets_values, dict):
        return
    for key, value in widgets_values.items():
        if key not in converted_inputs:
            converted_inputs[key] = value


def _set_text_fallback_from_widgets(converted_inputs: Dict[str, Any], widgets_list: List[Any], node: Dict[str, Any]) -> None:
    if not widgets_list or "text" in converted_inputs:
        return
    node_type_lower = _lower(node.get("type"))
    if not any(token in node_type_lower for token in ("primitive", "string", "text", "encode")):
        return
    for widget_value in widgets_list:
        if isinstance(widget_value, str) and len(widget_value.strip()) > 10:
            converted_inputs["text"] = widget_value
            converted_inputs["value"] = widget_value
            return


def _normalize_graph_input(prompt_graph: Any, workflow: Any) -> Optional[Dict[str, Dict[str, Any]]]:
    """Normalize prompt graph or workflow into nodes_by_id dict.

    Handles both ComfyUI prompt-graph format and LiteGraph workflow format.
    LiteGraph format has:
      - nodes: list of {id, type, inputs: [{name, link}], widgets_values: [...]}
      - links: list of [link_id, src_node, src_slot, tgt_node, tgt_slot, type]
    Prompt-graph format has:
      - dict with node_id as key: {class_type, inputs: {name: value}}
    """
    target_graph = _resolve_graph_target(prompt_graph, workflow)
    if not isinstance(target_graph, dict):
        return None

    nodes_by_id: Dict[str, Dict[str, Any]] = {}

    if "nodes" in target_graph and isinstance(target_graph["nodes"], list):
        link_to_source = _build_link_source_map(target_graph.get("links", []))
        for node in target_graph["nodes"]:
            if not isinstance(node, dict):
                continue
            node_id = str(node.get("id"))
            nodes_by_id[node_id] = _convert_litegraph_node(node, link_to_source)
    else:
        for key, value in target_graph.items():
            if isinstance(value, dict):
                nodes_by_id[str(key)] = value

    return nodes_by_id if nodes_by_id else None


def _set_named_field(out: Dict[str, Any], key: str, value: Any, source: str, confidence: str = "high") -> None:
    if value is None:
        return
    name = str(value).strip()
    if not name:
        return
    out[key] = {"name": name, "confidence": confidence, "source": source}


def _set_value_field(out: Dict[str, Any], key: str, value: Any, source: str, confidence: str = "high") -> None:
    if value is None:
        return
    out[key] = {"value": value, "confidence": confidence, "source": source}


def _find_tts_nodes(nodes_by_id: Dict[str, Any]) -> Tuple[Optional[str], Optional[Dict[str, Any]], Optional[str], Optional[Dict[str, Any]]]:
    text_node_id: Optional[str] = None
    text_node: Optional[Dict[str, Any]] = None
    engine_node_id: Optional[str] = None
    engine_node: Optional[Dict[str, Any]] = None

    for nid, node in nodes_by_id.items():
        if not isinstance(node, dict):
            continue
        ct = _lower(_node_type(node))
        if text_node is None and _is_tts_text_node_type(ct):
            text_node_id = str(nid)
            text_node = node
        if engine_node is None and _is_tts_engine_node_type(ct):
            engine_node_id = str(nid)
            engine_node = node
        if text_node is not None and engine_node is not None:
            break

    return text_node_id, text_node, engine_node_id, engine_node


def _is_tts_text_node_type(ct: str) -> bool:
    return "unifiedttstextnode" in ct or "tts_text_node" in ct or ("tts" in ct and "text" in ct)


def _is_tts_engine_node_type(ct: str) -> bool:
    return "ttsengine" in ct or ("qwen" in ct and "tts" in ct and "engine" in ct) or ("engine_node" in ct and "tts" in ct)


def _apply_tts_text_node_fields(
    out: Dict[str, Any],
    nodes_by_id: Dict[str, Any],
    text_node_id: str,
    text_node: Dict[str, Any],
) -> None:
    tins = _inputs(text_node)
    source = f"{_node_type(text_node)}:{text_node_id}"
    out["sampler"] = {"name": str(_node_type(text_node) or "TTS"), "confidence": "high", "source": source}

    _apply_tts_text_direct_fields(out, tins, source)
    _apply_tts_text_widget_fallback(out, text_node.get("widgets_values"), source)
    _apply_tts_narrator_link_voice(out, nodes_by_id, tins)


def _apply_tts_text_direct_fields(out: Dict[str, Any], tins: Dict[str, Any], source: str) -> None:
    text_value = tins.get("text")
    if isinstance(text_value, str) and text_value.strip():
        out["positive"] = {"value": text_value.strip(), "confidence": "high", "source": source}
    _set_value_field(out, "seed", _scalar(tins.get("seed")) or _scalar(tins.get("noise_seed")), source)
    _set_named_field(out, "voice", _scalar(tins.get("narrator_voice")), source)
    for key in (
        "enable_chunking",
        "max_chars_per_chunk",
        "chunk_combination_method",
        "silence_between_chunks_ms",
        "enable_audio_cache",
        "batch_size",
        "control_after_generate",
    ):
        _set_value_field(out, key, _scalar(tins.get(key)), source)


def _apply_tts_text_widget_fallback(out: Dict[str, Any], widgets: Any, source: str) -> None:
    if not isinstance(widgets, list):
        return
    if "positive" not in out:
        text = _first_long_widget_text(widgets)
        if text:
            out["positive"] = {"value": text, "confidence": "medium", "source": source}
    if "seed" not in out:
        seed = _first_nonnegative_int_scalar(widgets)
        if seed is not None:
            out["seed"] = {"value": seed, "confidence": "medium", "source": source}
    if "voice" not in out:
        voice_name = _widget_voice_name(widgets)
        if voice_name:
            out["voice"] = {"name": voice_name, "confidence": "medium", "source": source}


def _first_long_widget_text(widgets: List[Any]) -> Optional[str]:
    for value in widgets:
        if not isinstance(value, str):
            continue
        stripped = value.strip()
        if len(stripped) > 20:
            return stripped
    return None


def _first_nonnegative_int_scalar(widgets: List[Any]) -> Optional[int]:
    for value in widgets:
        scalar_value = _scalar(value)
        if isinstance(scalar_value, int) and scalar_value >= 0:
            return scalar_value
    return None


def _widget_voice_name(widgets: List[Any]) -> Optional[str]:
    if len(widgets) < 2:
        return None
    voice = widgets[1]
    if isinstance(voice, str) and voice.strip():
        return voice.strip()
    return None


def _apply_tts_narrator_link_voice(out: Dict[str, Any], nodes_by_id: Dict[str, Any], tins: Dict[str, Any]) -> None:
    narrator_link = tins.get("opt_narrator")
    narrator_id = _walk_passthrough(nodes_by_id, narrator_link) if _is_link(narrator_link) else None
    narrator_node = nodes_by_id.get(narrator_id) if narrator_id else None
    if not isinstance(narrator_node, dict):
        return
    voice_name = _scalar(_inputs(narrator_node).get("voice_name"))
    if voice_name is None or not str(voice_name).strip():
        return
    out["voice"] = {
        "name": str(voice_name).strip(),
        "confidence": "high",
        "source": f"{_node_type(narrator_node)}:{narrator_id}",
    }


def _apply_tts_engine_node_fields(out: Dict[str, Any], engine_node_id: str, engine_node: Dict[str, Any]) -> None:
    eins = _inputs(engine_node)
    source = f"{_node_type(engine_node)}:{engine_node_id}"
    _apply_tts_engine_direct_fields(out, eins, source)
    _apply_tts_engine_widget_fields(out, engine_node, source)


def _apply_tts_engine_direct_fields(out: Dict[str, Any], eins: Dict[str, Any], source: str) -> None:
    model_name = _clean_model_id(eins.get("model_size") or eins.get("model") or eins.get("checkpoint") or eins.get("model_name"))
    if model_name:
        out["checkpoint"] = {"name": model_name, "confidence": "high", "source": source}
        out["models"] = {"checkpoint": out["checkpoint"]}
    for key in ("device", "voice_preset", "instruct", "language"):
        _set_value_field(out, key, _scalar(eins.get(key)), source)
    for key in (
        "temperature",
        "top_p",
        "top_k",
        "repetition_penalty",
        "max_new_tokens",
        "dtype",
        "attn_implementation",
        "x_vector_only_mode",
        "use_torch_compile",
        "use_cuda_graphs",
        "compile_mode",
    ):
        _set_value_field(out, key, _scalar(eins.get(key)), source)


def _apply_tts_engine_widget_fields(out: Dict[str, Any], engine_node: Dict[str, Any], source: str) -> None:
    ewidgets = engine_node.get("widgets_values")
    if not isinstance(ewidgets, list):
        return
    ect = _lower(_node_type(engine_node))
    _apply_tts_engine_widget_checkpoint(out, ewidgets, source)
    _apply_tts_engine_widget_language(out, ewidgets, ect, source)
    if "qwen3ttsengine" in ect:
        _apply_tts_engine_qwen_widgets(out, ewidgets, source)


def _apply_tts_engine_widget_checkpoint(out: Dict[str, Any], ewidgets: List[Any], source: str) -> None:
    if "checkpoint" in out or not ewidgets:
        return
    guess_model = _clean_model_id(ewidgets[0])
    if not guess_model:
        return
    out["checkpoint"] = {"name": guess_model, "confidence": "medium", "source": source}
    out["models"] = {"checkpoint": out["checkpoint"]}


def _apply_tts_engine_widget_language(out: Dict[str, Any], ewidgets: List[Any], ect: str, source: str) -> None:
    if "language" in out:
        return
    guess_lang = _scalar(ewidgets[3]) if "qwen3ttsengine" in ect and len(ewidgets) > 3 else None
    if guess_lang is None:
        for value in ewidgets:
            if isinstance(value, str) and value.strip() and value.strip().lower() not in ("auto", "default"):
                guess_lang = value
                break
    if guess_lang is not None:
        out["language"] = {"value": str(guess_lang).strip(), "confidence": "medium", "source": source}


def _apply_tts_engine_qwen_widgets(out: Dict[str, Any], ewidgets: List[Any], source: str) -> None:
    qwen_widget_indices = {
        "device": 1,
        "voice_preset": 2,
        "top_k": 5,
        "top_p": 6,
        "temperature": 7,
        "repetition_penalty": 8,
        "max_new_tokens": 9,
    }
    for key, idx in qwen_widget_indices.items():
        if key in out or len(ewidgets) <= idx:
            continue
        value = _scalar(ewidgets[idx])
        if value is None:
            continue
        out[key] = {
            "value": value if key not in ("device", "voice_preset") else str(value).strip(),
            "confidence": "medium",
            "source": source,
        }


def _extract_tts_geninfo_fallback(nodes_by_id: Dict[str, Any], workflow_meta: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    text_node_id, text_node, engine_node_id, engine_node = _find_tts_nodes(nodes_by_id)
    if not text_node and not engine_node:
        return None

    out: Dict[str, Any] = {
        "engine": {
            "parser_version": "geninfo-tts-v1",
            "type": "tts",
            "sink": "audio",
        }
    }
    if workflow_meta:
        out["metadata"] = workflow_meta

    _apply_tts_text_node_fields_safe(out, nodes_by_id, text_node_id, text_node)
    _apply_tts_engine_node_fields_safe(out, engine_node_id, engine_node)
    _apply_tts_input_files(out, nodes_by_id)

    if len(out.keys()) <= 1:
        return None
    return out


def _apply_tts_text_node_fields_safe(
    out: Dict[str, Any],
    nodes_by_id: Dict[str, Any],
    text_node_id: Optional[str],
    text_node: Any,
) -> None:
    try:
        if text_node_id and isinstance(text_node, dict):
            _apply_tts_text_node_fields(out, nodes_by_id, text_node_id, text_node)
    except Exception:
        pass


def _apply_tts_engine_node_fields_safe(
    out: Dict[str, Any],
    engine_node_id: Optional[str],
    engine_node: Any,
) -> None:
    try:
        if engine_node_id and isinstance(engine_node, dict):
            _apply_tts_engine_node_fields(out, engine_node_id, engine_node)
    except Exception:
        pass


def _apply_tts_input_files(out: Dict[str, Any], nodes_by_id: Dict[str, Any]) -> None:
    input_files = _extract_input_files(nodes_by_id)
    if input_files:
        out["inputs"] = input_files


def _find_special_sampler_id(nodes_by_id: Dict[str, Any]) -> Optional[str]:
    for nid, node in nodes_by_id.items():
        ct = _lower(_node_type(node))
        if "marigold" in ct:
            return str(nid)
        if "instruction" in ct and "qwen" in ct:
            return str(nid)
    return None


def _select_sampler_context(nodes_by_id: Dict[str, Any], sink_id: str) -> Tuple[Optional[str], str, str]:
    sampler_id, sampler_conf = _select_primary_sampler(nodes_by_id, sink_id)
    sampler_mode = "primary"

    if not sampler_id:
        sampler_id, sampler_conf = _select_advanced_sampler(nodes_by_id, sink_id)
        if sampler_id:
            sampler_mode = "advanced"

    if not sampler_id:
        sampler_id, sampler_conf = _select_any_sampler(nodes_by_id)
        if sampler_id:
            sampler_mode = "global"

    if not sampler_id:
        special_sampler = _find_special_sampler_id(nodes_by_id)
        if special_sampler:
            sampler_id = special_sampler
            sampler_conf = "low"
            sampler_mode = "fallback"

    return sampler_id, sampler_conf, sampler_mode


def _build_no_sampler_result(nodes_by_id: Dict[str, Any], workflow_meta: Optional[Dict[str, Any]]) -> Result:
    tts_fallback = _extract_tts_geninfo_fallback(nodes_by_id, workflow_meta)
    if tts_fallback:
        return Result.Ok(tts_fallback)

    out_fallback: Dict[str, Any] = {}
    if workflow_meta:
        out_fallback["metadata"] = workflow_meta

    input_files = _extract_input_files(nodes_by_id)
    if input_files:
        out_fallback["inputs"] = input_files

    if out_fallback:
        return Result.Ok(out_fallback)
    return Result.Ok(None)


def _source_from_items(items: List[Tuple[str, str]]) -> Optional[Tuple[str, str]]:
    if not items:
        return None
    text = "\n".join([t for t, _ in items]).strip()
    if not text:
        return None
    sources = [s for _, s in items]
    source = sources[0] if len(set(sources)) <= 1 else f"{sources[0]} (+{len(sources)-1})"
    return text, source


def _extract_prompt_from_conditioning(nodes_by_id: Dict[str, Any], link: Any, branch: Optional[str] = None) -> Optional[Tuple[str, str]]:
    if not _is_link(link):
        return None
    items = _collect_texts_from_conditioning(nodes_by_id, link, branch=branch)
    return _source_from_items(items)


def _apply_advanced_guider_prompt_trace(
    nodes_by_id: Dict[str, Any],
    guider_link: Any,
    trace: Dict[str, Any],
) -> None:
    guider_id = _walk_passthrough(nodes_by_id, guider_link)
    guider_node = nodes_by_id.get(guider_id) if guider_id else None
    if not isinstance(guider_node, dict):
        return

    gins = _inputs(guider_node)
    _apply_guider_conditioning_prompt_hints(nodes_by_id, gins, trace)
    _apply_guider_positive_prompt_hints(nodes_by_id, gins, trace)
    _apply_guider_negative_prompt_hints(nodes_by_id, gins, trace)

    cfg_val = _scalar(gins.get("cfg")) or _scalar(gins.get("cfg_scale")) or _scalar(gins.get("guidance"))
    if cfg_val is not None:
        trace["guider_cfg_value"] = cfg_val
        trace["guider_cfg_source"] = f"{_node_type(guider_node)}:{guider_id}"
    else:
        found_guidance = _trace_guidance_value(nodes_by_id, gins.get("conditioning"))
        if found_guidance:
            trace["guider_cfg_value"], trace["guider_cfg_source"] = found_guidance

    if _is_link(gins.get("model")):
        trace["guider_model_link"] = gins.get("model")


def _apply_guider_conditioning_prompt_hints(nodes_by_id: Dict[str, Any], gins: Dict[str, Any], trace: Dict[str, Any]) -> None:
    conditioning = gins.get("conditioning")
    if not _is_link(conditioning):
        return
    trace["conditioning_link"] = conditioning
    extracted = _extract_prompt_from_conditioning(nodes_by_id, conditioning)
    if extracted and not trace["pos_val"]:
        trace["pos_val"] = extracted


def _apply_guider_positive_prompt_hints(nodes_by_id: Dict[str, Any], gins: Dict[str, Any], trace: Dict[str, Any]) -> None:
    positive = gins.get("positive")
    if not _is_link(positive):
        return
    trace["conditioning_link"] = trace["conditioning_link"] or positive
    if trace["pos_val"]:
        return
    extracted = _extract_prompt_from_conditioning(nodes_by_id, positive, branch="positive")
    if extracted:
        trace["pos_val"] = extracted


def _apply_guider_negative_prompt_hints(nodes_by_id: Dict[str, Any], gins: Dict[str, Any], trace: Dict[str, Any]) -> None:
    negative = gins.get("negative")
    if trace.get("neg_val") or not _is_link(negative):
        return
    extracted = _extract_prompt_from_conditioning(nodes_by_id, negative, branch="negative")
    if extracted:
        trace["neg_val"] = extracted


def _extract_prompt_trace(
    nodes_by_id: Dict[str, Any],
    sampler_node: Dict[str, Any],
    sampler_id: str,
    ins: Dict[str, Any],
    advanced: bool,
) -> Dict[str, Any]:
    trace: Dict[str, Any] = {
        "pos_val": None,
        "neg_val": None,
        "conditioning_link": None,
        "guider_cfg_value": None,
        "guider_cfg_source": None,
        "guider_model_link": None,
    }

    sampler_ct = _lower(_node_type(sampler_node))
    _apply_direct_sampler_prompt_hints(trace, sampler_node, sampler_id, ins, sampler_ct)
    _apply_embed_prompt_hints(trace, nodes_by_id, ins)
    _apply_conditioning_prompt_hints(trace, nodes_by_id, ins)
    if advanced and _is_link(ins.get("guider")):
        _apply_advanced_guider_prompt_trace(nodes_by_id, ins.get("guider"), trace)
    _apply_prompt_text_fallback(trace, sampler_node, sampler_id, ins)

    return trace


def _apply_direct_sampler_prompt_hints(
    trace: Dict[str, Any],
    sampler_node: Dict[str, Any],
    sampler_id: str,
    ins: Dict[str, Any],
    sampler_ct: str,
) -> None:
    if "instruction" in sampler_ct and "qwen" in sampler_ct:
        prompt_value = ins.get("instruction") or ins.get("text")
        if isinstance(prompt_value, str) and prompt_value.strip():
            trace["pos_val"] = (prompt_value.strip(), f"{_node_type(sampler_node)}:{sampler_id}:instruction")
    if "flux" in sampler_ct and "trainer" in sampler_ct:
        prompt_value = ins.get("prompt")
        if isinstance(prompt_value, str) and prompt_value.strip():
            trace["pos_val"] = (prompt_value.strip(), f"{_node_type(sampler_node)}:{sampler_id}:prompt")


def _apply_embed_prompt_hints(trace: Dict[str, Any], nodes_by_id: Dict[str, Any], ins: Dict[str, Any]) -> None:
    if not (_is_link(ins.get("text_embeds")) or _is_link(ins.get("hyvid_embeds"))):
        return
    embeds_link = ins.get("text_embeds") or ins.get("hyvid_embeds")
    pos_embed, neg_embed = _extract_posneg_from_text_embeds(nodes_by_id, embeds_link)
    trace["pos_val"] = trace["pos_val"] or pos_embed
    trace["neg_val"] = trace["neg_val"] or neg_embed


def _apply_conditioning_prompt_hints(trace: Dict[str, Any], nodes_by_id: Dict[str, Any], ins: Dict[str, Any]) -> None:
    if _is_link(ins.get("positive")):
        extracted = _extract_prompt_from_conditioning(nodes_by_id, ins.get("positive"), branch="positive")
        if extracted:
            trace["pos_val"] = extracted
        trace["conditioning_link"] = ins.get("positive")
    if _is_link(ins.get("negative")):
        extracted = _extract_prompt_from_conditioning(nodes_by_id, ins.get("negative"), branch="negative")
        if extracted:
            trace["neg_val"] = extracted


def _apply_prompt_text_fallback(trace: Dict[str, Any], sampler_node: Dict[str, Any], sampler_id: str, ins: Dict[str, Any]) -> None:
    if not trace.get("pos_val"):
        trace["pos_val"] = _first_prompt_field(
            ins,
            ("positive_prompt", "prompt", "positive", "text", "text_g", "text_l"),
            f"{_node_type(sampler_node)}:{sampler_id}",
        )
    if not trace.get("neg_val"):
        trace["neg_val"] = _first_prompt_field(
            ins,
            ("negative_prompt", "negative", "neg", "text_negative"),
            f"{_node_type(sampler_node)}:{sampler_id}",
        )


def _first_prompt_field(ins: Dict[str, Any], keys: Tuple[str, ...], source_prefix: str) -> Optional[Tuple[str, str]]:
    for key in keys:
        value = ins.get(key)
        if _looks_like_prompt_string(value):
            return str(value).strip(), f"{source_prefix}:{key}"
    return None


def _init_sampler_values(nodes_by_id: Dict[str, Any], sampler_node: Dict[str, Any], ins: Dict[str, Any]) -> Dict[str, Any]:
    sampler_name = _sampler_name_from_inputs(sampler_node, ins)
    seed_val = _seed_value_from_inputs(nodes_by_id, ins)
    return {
        "sampler_name": sampler_name,
        "scheduler": _scalar(ins.get("scheduler")),
        "steps": _scalar(ins.get("steps")) or _scalar(ins.get("denoise_steps")),
        "cfg": _cfg_value_from_inputs(ins),
        "denoise": _scalar(ins.get("denoise")),
        "seed_val": seed_val,
    }


def _sampler_name_from_inputs(sampler_node: Dict[str, Any], ins: Dict[str, Any]) -> Any:
    sampler_name = _scalar(ins.get("sampler_name")) or _scalar(ins.get("sampler"))
    if sampler_name:
        return sampler_name
    if "marigold" in _lower(_node_type(sampler_node)):
        return _node_type(sampler_node)
    return None


def _seed_value_from_inputs(nodes_by_id: Dict[str, Any], ins: Dict[str, Any]) -> Any:
    seed_val = _scalar(ins.get("seed"))
    if seed_val is not None:
        return seed_val
    if _is_link(ins.get("seed")):
        return _resolve_scalar_from_link(nodes_by_id, ins.get("seed"))
    return None


def _cfg_value_from_inputs(ins: Dict[str, Any]) -> Any:
    for key in ("cfg", "cfg_scale", "guidance", "guidance_scale", "embedded_guidance_scale"):
        value = _scalar(ins.get(key))
        if value is not None:
            return value
    return None


def _apply_widget_sampler_values(values: Dict[str, Any], sampler_node: Dict[str, Any]) -> None:
    if not any(values.get(key) is None for key in ("sampler_name", "scheduler", "steps", "cfg", "denoise", "seed_val")):
        return
    ks_w = _extract_ksampler_widget_params(sampler_node)
    if values.get("sampler_name") is None:
        values["sampler_name"] = _scalar(ks_w.get("sampler_name"))
    if values.get("scheduler") is None:
        values["scheduler"] = _scalar(ks_w.get("scheduler"))
    if values.get("steps") is None:
        values["steps"] = _scalar(ks_w.get("steps"))
    if values.get("cfg") is None:
        values["cfg"] = _scalar(ks_w.get("cfg"))
    if values.get("denoise") is None:
        values["denoise"] = _scalar(ks_w.get("denoise"))
    if values.get("seed_val") is None:
        values["seed_val"] = _scalar(ks_w.get("seed"))


def _resolve_model_link_for_chain(ins: Dict[str, Any], trace: Dict[str, Any]) -> Any:
    model_link_for_chain = ins.get("model") if _is_link(ins.get("model")) else None
    if model_link_for_chain is None and _is_link(trace.get("guider_model_link")):
        model_link_for_chain = trace.get("guider_model_link")
    return model_link_for_chain


def _apply_advanced_sampler_values(
    nodes_by_id: Dict[str, Any],
    ins: Dict[str, Any],
    values: Dict[str, Any],
    trace: Dict[str, Any],
    field_sources: Dict[str, str],
    field_confidence: Dict[str, str],
    model_link_for_chain: Any,
) -> Any:
    _apply_advanced_sampler_name(nodes_by_id, ins, values)
    model_link_for_chain = _apply_advanced_sigmas(
        nodes_by_id, ins, values, field_sources, field_confidence, model_link_for_chain
    )
    _apply_advanced_noise_seed(nodes_by_id, ins, values, field_sources)
    _apply_advanced_cfg_from_conditioning(nodes_by_id, trace, values, field_sources)
    return model_link_for_chain


def _apply_advanced_sampler_name(nodes_by_id: Dict[str, Any], ins: Dict[str, Any], values: Dict[str, Any]) -> None:
    if not _is_link(ins.get("sampler")) or values.get("sampler_name"):
        return
    traced_sampler = _trace_sampler_name(nodes_by_id, ins.get("sampler"))
    if traced_sampler:
        values["sampler_name"] = traced_sampler[0]


def _apply_advanced_sigmas(
    nodes_by_id: Dict[str, Any],
    ins: Dict[str, Any],
    values: Dict[str, Any],
    field_sources: Dict[str, str],
    field_confidence: Dict[str, str],
    model_link_for_chain: Any,
) -> Any:
    if not _is_link(ins.get("sigmas")):
        return model_link_for_chain
    st, sch, den, model_link, src, st_conf = _trace_scheduler_sigmas(nodes_by_id, ins.get("sigmas"))
    src_name = src[1] if src and isinstance(src, tuple) and len(src) == 2 else None
    _assign_advanced_sigma_values(
        values,
        field_sources,
        field_confidence,
        steps=st,
        scheduler=sch,
        denoise=den,
        source_name=src_name,
        steps_confidence=st_conf,
    )
    if model_link and not model_link_for_chain:
        return model_link
    return model_link_for_chain


def _assign_advanced_sigma_values(
    values: Dict[str, Any],
    field_sources: Dict[str, str],
    field_confidence: Dict[str, str],
    *,
    steps: Any,
    scheduler: Any,
    denoise: Any,
    source_name: Optional[str],
    steps_confidence: Optional[str],
) -> None:
    steps_assigned = _assign_advanced_sigma_field(values, field_sources, "steps", steps, source_name)
    _assign_advanced_sigma_field(values, field_sources, "scheduler", scheduler, source_name)
    _assign_advanced_sigma_field(values, field_sources, "denoise", denoise, source_name)
    if steps_assigned and steps_confidence:
        field_confidence["steps"] = steps_confidence


def _assign_advanced_sigma_field(
    values: Dict[str, Any], field_sources: Dict[str, str], key: str, value: Any, source_name: Optional[str]
) -> bool:
    if value is None or values.get(key) is not None:
        return False
    values[key] = value
    if source_name:
        field_sources[key] = source_name
    return True


def _apply_advanced_noise_seed(
    nodes_by_id: Dict[str, Any],
    ins: Dict[str, Any],
    values: Dict[str, Any],
    field_sources: Dict[str, str],
) -> None:
    if not _is_link(ins.get("noise")) or values.get("seed_val") is not None:
        return
    traced_seed = _trace_noise_seed(nodes_by_id, ins.get("noise"))
    if traced_seed:
        values["seed_val"] = traced_seed[0]
        field_sources["seed"] = traced_seed[1]


def _apply_advanced_cfg_from_conditioning(
    nodes_by_id: Dict[str, Any],
    trace: Dict[str, Any],
    values: Dict[str, Any],
    field_sources: Dict[str, str],
) -> None:
    if not trace.get("conditioning_link") or values.get("cfg") is not None:
        return
    traced_cfg = _trace_guidance_from_conditioning(nodes_by_id, trace.get("conditioning_link"))
    if traced_cfg:
        values["cfg"] = traced_cfg[0]
        field_sources["cfg"] = traced_cfg[1]


def _apply_guider_cfg_fallback(values: Dict[str, Any], trace: Dict[str, Any], field_sources: Dict[str, str]) -> None:
    if values.get("cfg") is not None:
        return
    if trace.get("guider_cfg_value") is None:
        return
    values["cfg"] = trace.get("guider_cfg_value")
    cfg_source = trace.get("guider_cfg_source")
    if cfg_source:
        field_sources["cfg"] = str(cfg_source)


def _extract_sampler_values(
    nodes_by_id: Dict[str, Any],
    sampler_node: Dict[str, Any],
    sampler_id: str,
    ins: Dict[str, Any],
    advanced: bool,
    confidence: str,
    trace: Dict[str, Any],
) -> Dict[str, Any]:
    _ = sampler_id, confidence
    field_sources: Dict[str, str] = {}
    field_confidence: Dict[str, str] = {}

    values = _init_sampler_values(nodes_by_id, sampler_node, ins)
    _apply_widget_sampler_values(values, sampler_node)

    model_link_for_chain = _resolve_model_link_for_chain(ins, trace)
    if advanced:
        model_link_for_chain = _apply_advanced_sampler_values(
            nodes_by_id,
            ins,
            values,
            trace,
            field_sources,
            field_confidence,
            model_link_for_chain,
        )
    _apply_guider_cfg_fallback(values, trace, field_sources)

    return {
        **values,
        "model_link_for_chain": model_link_for_chain,
        "field_sources": field_sources,
        "field_confidence": field_confidence,
    }


def _collect_model_related_fields(
    nodes_by_id: Dict[str, Any],
    ins: Dict[str, Any],
    confidence: str,
    sink_start_id: Optional[str],
    conditioning_link: Any,
    model_link_for_chain: Any,
) -> Dict[str, Any]:
    models, loras = _trace_models_and_loras(nodes_by_id, model_link_for_chain, confidence)
    _ensure_upscaler_model(nodes_by_id, models)
    size = _trace_size(nodes_by_id, ins.get("latent_image"), confidence) if _is_link(ins.get("latent_image")) else None
    clip_skip = _trace_clip_skip_from_conditioning(nodes_by_id, conditioning_link, confidence)
    clip = _trace_clip_from_text_encoder(nodes_by_id, conditioning_link, confidence) if conditioning_link and _is_link(conditioning_link) else None
    vae = _trace_vae_from_sink(nodes_by_id, sink_start_id, confidence) if sink_start_id else None

    return {
        "models": models,
        "loras": loras,
        "size": size,
        "clip_skip": clip_skip,
        "clip": clip,
        "vae": vae,
    }


def _trace_models_and_loras(
    nodes_by_id: Dict[str, Any],
    model_link_for_chain: Any,
    confidence: str,
) -> Tuple[Dict[str, Dict[str, Any]], List[Dict[str, Any]]]:
    if model_link_for_chain and _is_link(model_link_for_chain):
        return _trace_model_chain(nodes_by_id, model_link_for_chain, confidence)
    return {}, []


def _ensure_upscaler_model(nodes_by_id: Dict[str, Any], models: Dict[str, Dict[str, Any]]) -> None:
    if "upscaler" in models:
        return
    try:
        for node_id, node in nodes_by_id.items():
            model_entry = _upscaler_model_entry(node, node_id)
            if not model_entry:
                continue
            models["upscaler"] = model_entry
            return
    except Exception:
        return


def _upscaler_model_entry(node: Any, node_id: Any) -> Optional[Dict[str, Any]]:
    if not isinstance(node, dict):
        return None
    if not _is_upscaler_loader_type(_lower(_node_type(node))):
        return None
    name: Optional[str] = _clean_model_id(_upscaler_model_name(_inputs(node)))
    if not name:
        return None
    return {"name": name, "confidence": "medium", "source": f"{_node_type(node)}:{node_id}"}


def _is_upscaler_loader_type(node_type: str) -> bool:
    return "upscalemodelloader" in node_type or "upscale_model" in node_type or "latentupscale" in node_type


def _upscaler_model_name(ins: Dict[str, Any]) -> Any:
    return ins.get("model_name") or ins.get("upscale_model") or ins.get("upscale_model_name")


def _trace_clip_skip_from_conditioning(nodes_by_id: Dict[str, Any], conditioning_link: Any, confidence: str) -> Optional[Dict[str, Any]]:
    if not conditioning_link or not _is_link(conditioning_link):
        return None
    encoders = _collect_text_encoder_nodes_from_conditioning(nodes_by_id, conditioning_link, branch="positive")
    encoder_id = encoders[0] if encoders else _walk_passthrough(nodes_by_id, conditioning_link)
    pos_node = nodes_by_id.get(encoder_id) if encoder_id else None
    if not isinstance(pos_node, dict) or not _is_link(_inputs(pos_node).get("clip")):
        return None
    return _trace_clip_skip(nodes_by_id, _inputs(pos_node).get("clip"), confidence)


def _merge_models_payload(models: Dict[str, Dict[str, Any]], clip: Optional[Dict[str, Any]], vae: Optional[Dict[str, Any]]) -> Optional[Dict[str, Dict[str, Any]]]:
    if not models and not clip and not vae:
        return None

    merged: Dict[str, Dict[str, Any]] = {}
    for key in ("checkpoint", "unet", "diffusion", "upscaler"):
        if models.get(key):
            merged[key] = models[key]
    if clip:
        merged["clip"] = clip
    if vae:
        merged["vae"] = vae
    return merged or None


def _build_geninfo_payload(
    nodes_by_id: Dict[str, Any],
    sinks: List[str],
    sink_id: str,
    sampler_id: str,
    sampler_mode: str,
    sampler_source: str,
    confidence: str,
    workflow_meta: Optional[Dict[str, Any]],
    trace: Dict[str, Any],
    sampler_values: Dict[str, Any],
    model_related: Dict[str, Any],
) -> Dict[str, Any]:
    wf_type = _determine_workflow_type(nodes_by_id, sink_id, sampler_id)

    out: Dict[str, Any] = {
        "engine": {
            "parser_version": "geninfo-v1",
            "sink": str(_node_type(nodes_by_id.get(sink_id, {}))),
            "sampler_mode": sampler_mode,
            "type": wf_type,
        },
    }
    if workflow_meta:
        out["metadata"] = workflow_meta

    _apply_trace_prompt_fields(out, trace, confidence)
    _apply_lyrics_fields(out, nodes_by_id, sampler_source)
    _apply_model_fields(out, model_related)
    _apply_sampler_fields(out, sampler_values, confidence, sampler_source)
    _apply_optional_model_metrics(out, model_related)
    _apply_input_files_field(out, nodes_by_id)
    _apply_multi_sink_prompt_fields(out, nodes_by_id, sinks)

    return out


def _apply_trace_prompt_fields(out: Dict[str, Any], trace: Dict[str, Any], confidence: str) -> None:
    if trace.get("pos_val"):
        out["positive"] = {"value": trace["pos_val"][0], "confidence": confidence, "source": trace["pos_val"][1]}
    if trace.get("neg_val"):
        out["negative"] = {"value": trace["neg_val"][0], "confidence": confidence, "source": trace["neg_val"][1]}


def _apply_lyrics_fields(out: Dict[str, Any], nodes_by_id: Dict[str, Any], sampler_source: str) -> None:
    lyrics_text, lyrics_strength, lyrics_source = _extract_lyrics_from_prompt_nodes(nodes_by_id)
    if lyrics_text:
        out["lyrics"] = {"value": lyrics_text, "confidence": "high", "source": lyrics_source or sampler_source}
    if lyrics_strength is not None:
        lyric_field = _field(lyrics_strength, "high", lyrics_source or sampler_source)
        if lyric_field:
            out["lyrics_strength"] = lyric_field


def _apply_model_fields(out: Dict[str, Any], model_related: Dict[str, Any]) -> None:
    models = model_related.get("models") or {}
    loras = model_related.get("loras") or []
    clip = model_related.get("clip")
    vae = model_related.get("vae")
    _apply_preferred_checkpoint_field(out, models)
    _set_if_present(out, "loras", loras)
    _set_if_present(out, "clip", clip)
    _set_if_present(out, "vae", vae)
    merged_models = _merge_models_payload(models, clip, vae)
    if merged_models:
        out["models"] = merged_models


def _apply_preferred_checkpoint_field(out: Dict[str, Any], models: Dict[str, Any]) -> None:
    if not models:
        return
    preferred = models.get("checkpoint") or models.get("unet") or models.get("diffusion")
    if preferred:
        out["checkpoint"] = preferred


def _set_if_present(out: Dict[str, Any], key: str, value: Any) -> None:
    if value:
        out[key] = value


def _apply_sampler_fields(out: Dict[str, Any], sampler_values: Dict[str, Any], confidence: str, sampler_source: str) -> None:
    sampler_name_field = _field_name(sampler_values.get("sampler_name"), confidence, sampler_source)
    if sampler_name_field:
        out["sampler"] = sampler_name_field
    scheduler_field = _field_name(sampler_values.get("scheduler"), confidence, sampler_source)
    if scheduler_field:
        out["scheduler"] = scheduler_field
    for key in ("steps", "cfg", "seed", "denoise"):
        value_key = "seed_val" if key == "seed" else key
        field_value = _field(
            sampler_values.get(value_key),
            sampler_values.get("field_confidence", {}).get(key, confidence),
            sampler_values.get("field_sources", {}).get(key, sampler_source),
        )
        if field_value:
            out[key] = field_value


def _apply_optional_model_metrics(out: Dict[str, Any], model_related: Dict[str, Any]) -> None:
    if model_related.get("size"):
        out["size"] = model_related["size"]
    if model_related.get("clip_skip"):
        out["clip_skip"] = model_related["clip_skip"]


def _apply_input_files_field(out: Dict[str, Any], nodes_by_id: Dict[str, Any]) -> None:
    input_files = _extract_input_files(nodes_by_id)
    if input_files:
        out["inputs"] = input_files


def _apply_multi_sink_prompt_fields(out: Dict[str, Any], nodes_by_id: Dict[str, Any], sinks: List[str]) -> None:
    if len(sinks) <= 1:
        return
    all_pos, all_neg = _collect_all_prompts_from_sinks(nodes_by_id, sinks)
    if len(all_pos) > 1:
        out["all_positive_prompts"] = all_pos
    if len(all_neg) > 1:
        out["all_negative_prompts"] = all_neg


def _extract_geninfo(nodes_by_id: Dict[str, Any], sinks: List[str], workflow_meta: Optional[Dict]) -> Result:
    sink_id = sinks[0]
    sampler_id, sampler_conf, sampler_mode = _select_sampler_context(nodes_by_id, sink_id)

    if not sampler_id:
        return _build_no_sampler_result(nodes_by_id, workflow_meta)

    sink = nodes_by_id.get(sink_id) or {}
    sink_link = _pick_sink_inputs(sink)
    sink_start_id = _walk_passthrough(nodes_by_id, sink_link) if sink_link else None

    sampler_node = nodes_by_id.get(sampler_id) or {}
    if not isinstance(sampler_node, dict):
        return _build_no_sampler_result(nodes_by_id, workflow_meta)

    confidence = sampler_conf if sampler_conf != "none" else "low"
    ins = _inputs(sampler_node)
    sampler_source = f"{_node_type(sampler_node)}:{sampler_id}"
    advanced = _is_advanced_sampler(sampler_node)

    trace = _extract_prompt_trace(nodes_by_id, sampler_node, sampler_id, ins, advanced)
    sampler_values = _extract_sampler_values(nodes_by_id, sampler_node, sampler_id, ins, advanced, confidence, trace)
    model_related = _collect_model_related_fields(
        nodes_by_id,
        ins,
        confidence,
        sink_start_id,
        trace.get("conditioning_link"),
        sampler_values.get("model_link_for_chain"),
    )

    out = _build_geninfo_payload(
        nodes_by_id,
        sinks,
        sink_id,
        sampler_id,
        sampler_mode,
        sampler_source,
        confidence,
        workflow_meta,
        trace,
        sampler_values,
        model_related,
    )

    if len(out.keys()) <= 1:
        if workflow_meta:
            return Result.Ok({"metadata": workflow_meta})
        return Result.Ok(None)

    return Result.Ok(out)
