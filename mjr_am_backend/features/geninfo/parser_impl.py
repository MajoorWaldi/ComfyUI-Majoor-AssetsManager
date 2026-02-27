"""
GenInfo parser (backend-first).

Goal: deterministically extract generation parameters from a ComfyUI prompt-graph
without "guessing" across unrelated nodes.
"""

from __future__ import annotations

import os
from collections import deque
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any, cast

from ...shared import Result, get_logger

logger = get_logger(__name__)

def _env_int(name: str, default: int, *, minimum: int = 1) -> int:
    try:
        value = int(os.environ.get(name, str(default)))
    except Exception:
        value = default
    return max(minimum, value)


DEFAULT_MAX_GRAPH_NODES = _env_int("MJR_MAX_GRAPH_NODES", 5000, minimum=100)
DEFAULT_MAX_LINK_NODES = _env_int("MJR_MAX_LINK_NODES", 200, minimum=10)
DEFAULT_MAX_GRAPH_DEPTH = _env_int("MJR_MAX_GRAPH_DEPTH", 100, minimum=5)


SINK_CLASS_TYPES: set[str] = {
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


_VIDEO_SINK_TYPES: set[str] = {"savevideo", "vhs_savevideo", "vhs_videocombine"}
_AUDIO_SINK_TYPES: set[str] = {"saveaudio", "save_audio", "vhs_saveaudio"}
_IMAGE_SINK_TYPES: set[str] = {"saveimage", "saveimagewebsocket", "saveanimatedwebp", "savegif"}


# Sink and graph-link helpers are delegated to `graph_converter` near the end
# of this module (P2-D cleanup). Keep only non-delegated helpers here.

_MODEL_EXTS: tuple[str, ...] = (
    ".safetensors",
    ".ckpt",
    ".pt",
    ".pth",
    ".bin",
    ".gguf",
    ".json",
)


def _clean_model_id(value: Any) -> str | None:
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


def _to_int(value: Any) -> int | None:
    try:
        if value is None:
            return None
        return int(value)
    except Exception:
        return None


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


@dataclass(frozen=True)
class _Field:
    value: Any
    confidence: str
    source: str


def _field(value: Any, confidence: str, source: str) -> dict[str, Any] | None:  # pragma: no cover
    if value is None or value == "":
        return None
    return {"value": value, "confidence": confidence, "source": source}


def _field_name(name: Any, confidence: str, source: str) -> dict[str, Any] | None:  # pragma: no cover
    if not name:
        return None
    return {"name": name, "confidence": confidence, "source": source}


def _field_size(width: Any, height: Any, confidence: str, source: str) -> dict[str, Any] | None:  # pragma: no cover
    if width is None or height is None:
        return None
    return {"width": width, "height": height, "confidence": confidence, "source": source}


def _next_latent_link(ins: dict[str, Any]) -> Any | None:  # pragma: no cover
    for key in ("samples", "latent", "latent_image", "image"):
        value = ins.get(key)
        if isinstance(value, (list, tuple)) and len(value) == 2:
            return value
    return None


def _size_field_from_node(node: dict[str, Any], node_id: str, node_type: str, ins: dict[str, Any], confidence: str) -> dict[str, Any] | None:  # pragma: no cover
    width = ins.get("width")
    height = ins.get("height")
    if "emptylatentimage" in node_type:
        return _field_size(width, height, confidence, f"{_node_type(node)}:{node_id}")
    if width is None or height is None:
        return None
    return _field_size(width, height, confidence, f"{_node_type(node)}:{node_id}")


def _trace_size(nodes_by_id: dict[str, dict[str, Any]], latent_link: Any, confidence: str) -> dict[str, Any] | None:  # pragma: no cover
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
        ct = str(_node_type(node) or "").lower()
        ins = _inputs(node)
        size = _size_field_from_node(node, node_id, ct, ins, confidence)
        if size:
            return size
        next_link = _next_latent_link(ins)
        if not next_link:
            return None
        current_link = next_link
    return None


def _scalar(value: Any) -> Any | None:
    if value is None:
        return None
    if isinstance(value, (int, float, str)):
        return value
    return None


_INPUT_ROLE_PRIORITY: tuple[str, ...] = (
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
_INPUT_FILENAME_KEYS: tuple[str, ...] = (
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


def _extract_lyrics_from_prompt_nodes(nodes_by_id: dict[str, dict[str, Any]]) -> tuple[str | None, Any | None, str | None]:
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


def _extract_lyrics_from_node(node: dict[str, Any], ct: str) -> tuple[str | None, Any | None]:
    ins = _inputs(node)
    lyrics = _extract_lyrics_from_inputs(ins, ct)
    strength = _extract_lyrics_strength(ins)
    return _apply_lyrics_widget_fallback(node.get("widgets_values"), lyrics, strength)


def _extract_lyrics_from_inputs(ins: dict[str, Any], ct: str) -> str | None:
    lyric_keys: tuple[str, ...] = ("lyrics", "lyric", "lyric_text", "text_lyrics")
    if "acestep15tasktextencode" in ct or "acesteptasktextencode" in ct:
        lyric_keys = ("lyrics", "lyric", "lyric_text", "text_lyrics", "task_text", "task", "text")
    for key in lyric_keys:
        value = ins.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def _extract_lyrics_strength(ins: dict[str, Any]) -> Any | None:
    for key in ("lyrics_strength", "lyric_strength"):
        value = _scalar(ins.get(key))
        if value is not None:
            return value
    return None


def _apply_lyrics_widget_fallback(widgets: Any, lyrics: str | None, strength: Any | None) -> tuple[str | None, Any | None]:
    if isinstance(widgets, list):
        return _lyrics_widget_fallback_from_list(widgets, lyrics, strength)
    if isinstance(widgets, dict):
        return _lyrics_widget_fallback_from_dict(widgets, lyrics, strength)
    return lyrics, strength


def _lyrics_widget_fallback_from_list(
    widgets: list[Any], lyrics: str | None, strength: Any | None
) -> tuple[str | None, Any | None]:
    if not lyrics and len(widgets) > 1 and isinstance(widgets[1], str) and widgets[1].strip():
        lyrics = widgets[1].strip()
    if strength is None and len(widgets) > 2:
        strength = _scalar(widgets[2])
    return lyrics, strength


def _lyrics_widget_fallback_from_dict(
    widgets: dict[str, Any], lyrics: str | None, strength: Any | None
) -> tuple[str | None, Any | None]:
    lyrics = lyrics or _first_non_empty_string(
        widgets, ("lyrics", "lyric_text", "text_lyrics", "task_text", "task", "text")
    )
    if strength is None:
        strength = _first_non_none_scalar(widgets, ("lyrics_strength", "lyric_strength"))
    return lyrics, strength


def _first_non_empty_string(source: dict[str, Any], keys: tuple[str, ...]) -> str | None:
    for key in keys:
        value = source.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def _extract_text(nodes_by_id: dict[str, dict[str, Any]], link: Any) -> tuple[str, str] | None:
    node_id = _walk_passthrough(nodes_by_id, link)
    if not node_id:
        return None
    node = nodes_by_id.get(node_id)
    if not isinstance(node, dict):
        return None
    ins = _inputs(node)
    # Text-encode nodes vary: SDXL often uses text_g/text_l, some nodes use "prompt".
    candidates: list[str] = []
    for key in ("text", "prompt", "text_g", "text_l"):
        v = ins.get(key)
        if isinstance(v, str) and v.strip():
            candidates.append(v.strip())
    if candidates:
        return "\n".join(candidates), f"{_node_type(node)}:{node_id}"
    return None


def _looks_like_text_encoder(node: dict[str, Any]) -> bool:
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


def _looks_like_conditioning_text(node: dict[str, Any]) -> bool:
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
    nodes_by_id: dict[str, dict[str, Any]],
    start_link: Any,
    max_nodes: int = DEFAULT_MAX_LINK_NODES,
    max_depth: int = DEFAULT_MAX_GRAPH_DEPTH,
    branch: str | None = None
) -> list[str]:
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

    visited: set[str] = set()
    stack: list[tuple[str, int]] = [(start_id, 0)]
    found: list[str] = []

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
    def _nid_key(x: str) -> tuple[int, str]:
        try:
            return int(x), x
        except Exception:
            return 10**9, x

    found.sort(key=_nid_key)
    return found


def _conditioning_should_expand(node: dict[str, Any], branch: str | None) -> bool:
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


def _conditioning_is_blocked_by_branch(ct: str, branch: str | None) -> bool:
    return branch == "negative" and "conditioningzeroout" in ct


def _conditioning_is_expand_node(ct: str, node: dict[str, Any]) -> bool:
    return "conditioningsetarea" in ct or _is_reroute(node) or "conditioning" in ct


def _conditioning_has_branch_links(ins: dict[str, Any], branch: str | None) -> bool:
    if branch in ("positive", "negative") and _is_link(ins.get(branch)):
        return True
    return _is_link(ins.get("positive")) or _is_link(ins.get("negative"))


def _expand_conditioning_frontier(
    nodes_by_id: dict[str, dict[str, Any]],
    stack: list[tuple[str, int]],
    visited: set[str],
    ins: dict[str, Any],
    depth: int,
    branch: str | None,
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


def _conditioning_key_allowed(key: Any, branch: str | None) -> bool:
    key_s = str(key).lower()
    if branch == "positive":
        return key_s not in ("negative", "neg", "negative_prompt") and not key_s.startswith("negative_")
    if branch == "negative":
        return key_s not in ("positive", "pos", "positive_prompt") and not key_s.startswith("positive_")
    return True


def _first_model_string_from_inputs(ins: dict[str, Any]) -> str | None:
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


def _guidance_should_expand(node: dict[str, Any], ins: dict[str, Any]) -> bool:
    if _is_reroute(node):
        return True
    ct = _lower(_node_type(node))
    if "conditioning" in ct or "guider" in ct or "flux" in ct:
        return True
    return any("conditioning" in str(k).lower() for k in ins.keys())


def _iter_guidance_conditioning_sources(
    nodes_by_id: dict[str, dict[str, Any]], ins: dict[str, Any]
) -> list[str]:
    sources: list[str] = []
    for key, value in ins.items():
        if "conditioning" not in str(key).lower() or not _is_link(value):
            continue
        src = _walk_passthrough(nodes_by_id, value)
        if src:
            sources.append(src)
    return sources


def _loader_kind_from_node_type(node_type: str) -> str | None:
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


def _node_type_matches_any(node_type_clean: str, needles: tuple[str, ...]) -> bool:
    return any(needle in node_type_clean for needle in needles)


def _extract_loader_filename(node: dict[str, Any], ins: dict[str, Any]) -> str | None:
    direct = _loader_filename_from_inputs(ins)
    if direct:
        return direct
    return _loader_filename_from_widgets(node.get("widgets_values"))


def _loader_filename_from_inputs(ins: dict[str, Any]) -> str | None:
    for key in _INPUT_FILENAME_KEYS:
        value = ins.get(key)
        if isinstance(value, str) and value:
            return value
    return None


def _loader_filename_from_widgets(widgets: Any) -> str | None:
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


def _extract_input_files(nodes_by_id: dict[str, Any]) -> list[dict[str, Any]]:
    """
    Extract input file references (LoadImage/LoadVideo/LoadAudio, etc) with usage context.
    """
    inputs: list[dict[str, Any]] = []
    seen: set[tuple[str, str, str]] = set()

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
    nodes_by_id: dict[str, Any],
    sinks: list[str],
    max_sinks: int = 20
) -> tuple[list[str], list[str]]:
    """
    Collect all distinct positive and negative prompts from multiple sinks.

    For multi-output workflows (like batch generation with different prompts),
    this gathers all unique prompts to show the user what variants were generated.

    Returns:
        (all_positive_prompts, all_negative_prompts) - deduplicated lists
    """
    all_positive: list[str] = []
    all_negative: list[str] = []
    seen_pos: set[str] = set()
    seen_neg: set[str] = set()

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


def _collect_prompt_branch_from_input(
    nodes_by_id: dict[str, Any],
    input_value: Any,
    branch: str,
    seen: set[str],
    out: list[str],
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


def parse_geninfo_from_prompt(prompt_graph: Any, workflow: Any = None) -> Result[dict[str, Any] | None]:
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
        logger.error("Unexpected error in GenInfo parsing: %s", e, exc_info=True)
        return _geninfo_metadata_only_result(workflow_meta)


def _first_prompt_field(ins: dict[str, Any], keys: tuple[str, ...], source_prefix: str) -> tuple[str, str] | None:
    for key in keys:
        value = ins.get(key)
        if _looks_like_prompt_string(value):
            return str(value).strip(), f"{source_prefix}:{key}"
    return None


def _init_sampler_values(nodes_by_id: dict[str, Any], sampler_node: dict[str, Any], ins: dict[str, Any]) -> dict[str, Any]:
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


def _sampler_name_from_inputs(sampler_node: dict[str, Any], ins: dict[str, Any]) -> Any:
    sampler_name = _scalar(ins.get("sampler_name")) or _scalar(ins.get("sampler"))
    if sampler_name:
        return sampler_name
    if "marigold" in _lower(_node_type(sampler_node)):
        return _node_type(sampler_node)
    return None


def _seed_value_from_inputs(nodes_by_id: dict[str, Any], ins: dict[str, Any]) -> Any:
    seed_val = _scalar(ins.get("seed"))
    if seed_val is not None:
        return seed_val
    if _is_link(ins.get("seed")):
        return _resolve_scalar_from_link(nodes_by_id, ins.get("seed"))
    return None


def _cfg_value_from_inputs(ins: dict[str, Any]) -> Any:
    for key in ("cfg", "cfg_scale", "guidance", "guidance_scale", "embedded_guidance_scale"):
        value = _scalar(ins.get(key))
        if value is not None:
            return value
    return None


def _apply_widget_sampler_values(values: dict[str, Any], sampler_node: dict[str, Any]) -> None:
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


def _resolve_model_link_for_chain(ins: dict[str, Any], trace: dict[str, Any]) -> Any:
    model_link_for_chain = ins.get("model") if _is_link(ins.get("model")) else None
    if model_link_for_chain is None and _is_link(trace.get("guider_model_link")):
        model_link_for_chain = trace.get("guider_model_link")
    return model_link_for_chain


def _apply_advanced_sampler_values(
    nodes_by_id: dict[str, Any],
    ins: dict[str, Any],
    values: dict[str, Any],
    trace: dict[str, Any],
    field_sources: dict[str, str],
    field_confidence: dict[str, str],
    model_link_for_chain: Any,
) -> Any:
    _apply_advanced_sampler_name(nodes_by_id, ins, values)
    model_link_for_chain = _apply_advanced_sigmas(
        nodes_by_id, ins, values, field_sources, field_confidence, model_link_for_chain
    )
    _apply_advanced_noise_seed(nodes_by_id, ins, values, field_sources)
    _apply_advanced_cfg_from_conditioning(nodes_by_id, trace, values, field_sources)
    return model_link_for_chain


def _apply_advanced_sampler_name(nodes_by_id: dict[str, Any], ins: dict[str, Any], values: dict[str, Any]) -> None:
    if not _is_link(ins.get("sampler")) or values.get("sampler_name"):
        return
    traced_sampler = _trace_sampler_name(nodes_by_id, ins.get("sampler"))
    if traced_sampler:
        values["sampler_name"] = traced_sampler[0]


def _apply_advanced_sigmas(
    nodes_by_id: dict[str, Any],
    ins: dict[str, Any],
    values: dict[str, Any],
    field_sources: dict[str, str],
    field_confidence: dict[str, str],
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
    values: dict[str, Any],
    field_sources: dict[str, str],
    field_confidence: dict[str, str],
    *,
    steps: Any,
    scheduler: Any,
    denoise: Any,
    source_name: str | None,
    steps_confidence: str | None,
) -> None:
    steps_assigned = _assign_advanced_sigma_field(values, field_sources, "steps", steps, source_name)
    _assign_advanced_sigma_field(values, field_sources, "scheduler", scheduler, source_name)
    _assign_advanced_sigma_field(values, field_sources, "denoise", denoise, source_name)
    if steps_assigned and steps_confidence:
        field_confidence["steps"] = steps_confidence


def _assign_advanced_sigma_field(
    values: dict[str, Any], field_sources: dict[str, str], key: str, value: Any, source_name: str | None
) -> bool:
    if value is None or values.get(key) is not None:
        return False
    values[key] = value
    if source_name:
        field_sources[key] = source_name
    return True


def _apply_advanced_noise_seed(
    nodes_by_id: dict[str, Any],
    ins: dict[str, Any],
    values: dict[str, Any],
    field_sources: dict[str, str],
) -> None:
    if not _is_link(ins.get("noise")) or values.get("seed_val") is not None:
        return
    traced_seed = _trace_noise_seed(nodes_by_id, ins.get("noise"))
    if traced_seed:
        values["seed_val"] = traced_seed[0]
        field_sources["seed"] = traced_seed[1]


def _apply_advanced_cfg_from_conditioning(
    nodes_by_id: dict[str, Any],
    trace: dict[str, Any],
    values: dict[str, Any],
    field_sources: dict[str, str],
) -> None:
    if not trace.get("conditioning_link") or values.get("cfg") is not None:
        return
    traced_cfg = _trace_guidance_from_conditioning(nodes_by_id, trace.get("conditioning_link"))
    if traced_cfg:
        values["cfg"] = traced_cfg[0]
        field_sources["cfg"] = traced_cfg[1]


def _apply_guider_cfg_fallback(values: dict[str, Any], trace: dict[str, Any], field_sources: dict[str, str]) -> None:
    if values.get("cfg") is not None:
        return
    if trace.get("guider_cfg_value") is None:
        return
    values["cfg"] = trace.get("guider_cfg_value")
    cfg_source = trace.get("guider_cfg_source")
    if cfg_source:
        field_sources["cfg"] = str(cfg_source)


def _extract_sampler_values(
    nodes_by_id: dict[str, Any],
    sampler_node: dict[str, Any],
    sampler_id: str,
    ins: dict[str, Any],
    advanced: bool,
    confidence: str,
    trace: dict[str, Any],
) -> dict[str, Any]:
    _ = sampler_id, confidence
    field_sources: dict[str, str] = {}
    field_confidence: dict[str, str] = {}

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


# P2-D-01: delegate graph conversion and sink helpers to dedicated module.
from . import graph_converter as _gc

_sink_group = _gc._sink_group
_sink_is_video = _gc._sink_is_video
_sink_is_audio = _gc._sink_is_audio
_sink_is_image = _gc._sink_is_image
_sink_is_preview = _gc._sink_is_preview
_sink_images_tiebreak = _gc._sink_images_tiebreak
_sink_node_id_tiebreak = _gc._sink_node_id_tiebreak
_sink_priority = _gc._sink_priority
_is_link = _gc._is_link
_resolve_link = _gc._resolve_link
_node_type = _gc._node_type
_inputs = _gc._inputs
_lower = _gc._lower
_is_reroute = _gc._is_reroute
_walk_passthrough = _gc._walk_passthrough
_pick_sink_inputs = _gc._pick_sink_inputs
_find_candidate_sinks = _gc._find_candidate_sinks
_collect_upstream_nodes = _gc._collect_upstream_nodes
_workflow_sink_suffix = _gc._workflow_sink_suffix
_scan_graph_input_kinds = _gc._scan_graph_input_kinds
_workflow_input_prefix = _gc._workflow_input_prefix
_determine_workflow_type = _gc._determine_workflow_type
_resolve_graph_target = _gc._resolve_graph_target
_build_link_source_map = _gc._build_link_source_map
_convert_litegraph_node = _gc._convert_litegraph_node
_init_litegraph_converted_node = _gc._init_litegraph_converted_node
_populate_converted_inputs = _gc._populate_converted_inputs
_populate_converted_inputs_from_list = _gc._populate_converted_inputs_from_list
_merge_widget_dict_inputs = _gc._merge_widget_dict_inputs
_set_text_fallback_from_widgets = _gc._set_text_fallback_from_widgets
_normalize_graph_input = _gc._normalize_graph_input
_set_named_field = _gc._set_named_field
_set_value_field = _gc._set_value_field

# P2-D-02: delegate sampler tracing helpers to dedicated module.
from . import sampler_tracer as _st

_is_sampler = _st._is_sampler
_is_named_sampler_type = _st._is_named_sampler_type
_has_core_sampler_signature = _st._has_core_sampler_signature
_is_custom_sampler = _st._is_custom_sampler
_is_advanced_sampler = _st._is_advanced_sampler
_select_primary_sampler = _st._select_primary_sampler
_select_advanced_sampler = _st._select_advanced_sampler
_select_sampler_from_sink = _st._select_sampler_from_sink
_sink_start_source = _st._sink_start_source
_upstream_sampler_candidates = _st._upstream_sampler_candidates
_best_candidate = _st._best_candidate
_select_any_sampler = _st._select_any_sampler
_global_sampler_candidates = _st._global_sampler_candidates
_sampler_candidate_score = _st._sampler_candidate_score
_stable_numeric_node_id = _st._stable_numeric_node_id
_trace_sampler_name = _st._trace_sampler_name
_trace_noise_seed = _st._trace_noise_seed
_trace_scheduler_sigmas = _st._trace_scheduler_sigmas
_steps_from_manual_sigmas = _st._steps_from_manual_sigmas
_count_numeric_sigma_values = _st._count_numeric_sigma_values
_extract_ksampler_widget_params = _st._extract_ksampler_widget_params
_ksampler_values_from_widgets = _st._ksampler_values_from_widgets
_widget_value_at = _st._widget_value_at
_resolve_sink_sampler_node = _st._resolve_sink_sampler_node
_find_special_sampler_id = _st._find_special_sampler_id
_select_sampler_context = _st._select_sampler_context


# P2-D-03: delegate model tracing helpers to dedicated module.
from . import model_tracer as _mt

_is_lora_loader_node = _mt._is_lora_loader_node
_append_lora_entries = _mt._append_lora_entries
_build_lora_payload_from_nested_value = _mt._build_lora_payload_from_nested_value
_is_nested_lora_key = _mt._is_nested_lora_key
_is_enabled_lora_value = _mt._is_enabled_lora_value
_nested_lora_name = _mt._nested_lora_name
_nested_lora_strength = _mt._nested_lora_strength
_build_lora_payload_from_inputs = _mt._build_lora_payload_from_inputs
_is_diffusion_loader_node = _mt._is_diffusion_loader_node
_is_generic_model_loader_node = _mt._is_generic_model_loader_node
_is_checkpoint_loader_node = _mt._is_checkpoint_loader_node
_chain_result = _mt._chain_result
_handle_lora_chain_node = _mt._handle_lora_chain_node
_handle_modelsampling_chain_node = _mt._handle_modelsampling_chain_node
_handle_diffusion_loader_chain_node = _mt._handle_diffusion_loader_chain_node
_set_model_entry_if_missing = _mt._set_model_entry_if_missing
_chain_result_from_model_input = _mt._chain_result_from_model_input
_handle_generic_loader_chain_node = _mt._handle_generic_loader_chain_node
_handle_checkpoint_loader_chain_node = _mt._handle_checkpoint_loader_chain_node
_handle_switch_selector_chain_node = _mt._handle_switch_selector_chain_node
_handle_fallback_chain_node = _mt._handle_fallback_chain_node
_process_model_chain_node = _mt._process_model_chain_node
_trace_model_chain = _mt._trace_model_chain
_trace_named_loader = _mt._trace_named_loader
_extract_named_loader_model = _mt._extract_named_loader_model
_extract_dual_clip_name = _mt._extract_dual_clip_name
_next_named_loader_link = _mt._next_named_loader_link
_trace_vae_from_sink = _mt._trace_vae_from_sink
_trace_clip_from_text_encoder = _mt._trace_clip_from_text_encoder
_trace_clip_skip = _mt._trace_clip_skip
_trace_clip_skip_from_conditioning = _mt._trace_clip_skip_from_conditioning
_trace_models_and_loras = _mt._trace_models_and_loras
_collect_model_related_fields = _mt._collect_model_related_fields
_ensure_upscaler_model = _mt._ensure_upscaler_model
_upscaler_model_entry = _mt._upscaler_model_entry
_is_upscaler_loader_type = _mt._is_upscaler_loader_type
_upscaler_model_name = _mt._upscaler_model_name
_merge_models_payload = _mt._merge_models_payload

# P2-D-04: delegate prompt tracing helpers to dedicated module.
from . import prompt_tracer as _pt

_collect_texts_from_conditioning = _pt._collect_texts_from_conditioning
_extract_prompt_from_conditioning = _pt._extract_prompt_from_conditioning
_source_from_items = _pt._source_from_items
_extract_prompt_trace = _pt._extract_prompt_trace
_apply_direct_sampler_prompt_hints = _pt._apply_direct_sampler_prompt_hints
_apply_embed_prompt_hints = _pt._apply_embed_prompt_hints
_extract_posneg_from_text_embeds = _pt._extract_posneg_from_text_embeds
_apply_conditioning_prompt_hints = _pt._apply_conditioning_prompt_hints
_apply_advanced_guider_prompt_trace = _pt._apply_advanced_guider_prompt_trace
_apply_guider_conditioning_prompt_hints = _pt._apply_guider_conditioning_prompt_hints
_apply_guider_positive_prompt_hints = _pt._apply_guider_positive_prompt_hints
_apply_guider_negative_prompt_hints = _pt._apply_guider_negative_prompt_hints
_trace_guidance_from_conditioning = _pt._trace_guidance_from_conditioning
_trace_guidance_value = _pt._trace_guidance_value
_apply_prompt_text_fallback = _pt._apply_prompt_text_fallback
_first_non_none_scalar = _pt._first_non_none_scalar
_resolve_scalar_from_link = _pt._resolve_scalar_from_link

# P2-D-05: delegate TTS extraction helpers to dedicated module.
from . import tts_extractor as _te

_find_tts_nodes = _te._find_tts_nodes
_is_tts_text_node_type = _te._is_tts_text_node_type
_is_tts_engine_node_type = _te._is_tts_engine_node_type
_apply_tts_text_node_fields = _te._apply_tts_text_node_fields
_apply_tts_text_direct_fields = _te._apply_tts_text_direct_fields
_apply_tts_text_widget_fallback = _te._apply_tts_text_widget_fallback
_first_long_widget_text = _te._first_long_widget_text
_first_nonnegative_int_scalar = _te._first_nonnegative_int_scalar
_widget_voice_name = _te._widget_voice_name
_apply_tts_narrator_link_voice = _te._apply_tts_narrator_link_voice
_apply_tts_engine_node_fields = _te._apply_tts_engine_node_fields
_apply_tts_engine_direct_fields = _te._apply_tts_engine_direct_fields
_apply_tts_engine_widget_fields = _te._apply_tts_engine_widget_fields
_apply_tts_engine_widget_checkpoint = _te._apply_tts_engine_widget_checkpoint
_apply_tts_engine_widget_language = _te._apply_tts_engine_widget_language
_apply_tts_engine_qwen_widgets = _te._apply_tts_engine_qwen_widgets
_extract_tts_geninfo_fallback = _te._extract_tts_geninfo_fallback
_apply_tts_text_node_fields_safe = _te._apply_tts_text_node_fields_safe
_apply_tts_engine_node_fields_safe = _te._apply_tts_engine_node_fields_safe
_apply_tts_input_files = _te._apply_tts_input_files

# P2-D-06: delegate role/classification helpers to dedicated module.
from . import role_classifier as _rc

_extract_workflow_metadata = _rc._extract_workflow_metadata
_subject_role_hints = _rc._subject_role_hints
_contains_any_token = _rc._contains_any_token
_add_subject_role_if_match = _rc._add_subject_role_if_match
_linked_input_from_frontier = _rc._linked_input_from_frontier
_classify_control_or_mask_role = _rc._classify_control_or_mask_role
_classify_vace_or_range_role = _rc._classify_vace_or_range_role
_is_vace_target_type = _rc._is_vace_target_type
_is_frame_range_target_type = _rc._is_frame_range_target_type
_frame_edge_role = _rc._frame_edge_role
_classify_generic_source_role = _rc._classify_generic_source_role
_edge_role_from_input_name = _rc._edge_role_from_input_name
_target_type_is_source_like = _rc._target_type_is_source_like
_sampler_input_is_source = _rc._sampler_input_is_source
_classify_downstream_input_role = _rc._classify_downstream_input_role
_detect_input_role = _rc._detect_input_role
_detect_roles_from_downstream = _rc._detect_roles_from_downstream
_scan_downstream_frontier = _rc._scan_downstream_frontier
_is_image_loader_node_type = _rc._is_image_loader_node_type
_is_video_loader_node_type = _rc._is_video_loader_node_type
_is_audio_loader_node_type = _rc._is_audio_loader_node_type
_vae_pixel_input_kind = _rc._vae_pixel_input_kind
_next_latent_upstream_id = _rc._next_latent_upstream_id
_trace_sampler_latent_input_kind = _rc._trace_sampler_latent_input_kind
_update_inputs_from_latent_node = _rc._update_inputs_from_latent_node


# P2-D-07: delegate payload assembly helpers to dedicated module (safe subset).
# Imported last to avoid circular: payload_builder → model_tracer → parser_impl.
from . import payload_builder as _pb

_geninfo_metadata_only_result = _pb._geninfo_metadata_only_result
_build_no_sampler_result = _pb._build_no_sampler_result
_source_from_items = _pb._source_from_items
_build_geninfo_payload = _pb._build_geninfo_payload
_apply_trace_prompt_fields = _pb._apply_trace_prompt_fields
_apply_lyrics_fields = _pb._apply_lyrics_fields
_apply_model_fields = _pb._apply_model_fields
_apply_preferred_checkpoint_field = _pb._apply_preferred_checkpoint_field
_set_if_present = _pb._set_if_present
_apply_sampler_fields = _pb._apply_sampler_fields
_apply_optional_model_metrics = _pb._apply_optional_model_metrics
_apply_input_files_field = _pb._apply_input_files_field
_apply_multi_sink_prompt_fields = _pb._apply_multi_sink_prompt_fields
_extract_geninfo = _pb._extract_geninfo
