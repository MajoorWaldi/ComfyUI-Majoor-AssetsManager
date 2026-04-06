"""
Metadata extractors for different file types.
Extracts ComfyUI workflow and generation parameters from PNG, WEBP, MP4.
"""
import os
from typing import Any

from ...shared import ErrorCode, Result, get_logger
from . import extractors_png as _png
from . import extractors_video as _video
from . import extractors_webp as _webp
from .parsing_utils import (
    looks_like_comfyui_prompt_graph,
    looks_like_comfyui_workflow,
    parse_auto1111_params,
    parse_json_value,
    try_parse_json_text,
)

logger = get_logger(__name__)

# Constants removed (moved to parsing_utils)
MAX_TAG_LENGTH = 100
MAX_METADATA_JSON_CHARS = 2_000_000
MAX_METADATA_JSON_TOPLEVEL_KEYS = 20_000
_WEBP_WORKFLOW_KEYS = ("EXIF:Make", "IFD0:Make", "Keys:Workflow", "comfyui:workflow")
_WEBP_PROMPT_KEYS = ("EXIF:Model", "IFD0:Model", "Keys:Prompt", "comfyui:prompt")
_WEBP_TEXT_KEYS = (
    "EXIF:ImageDescription",
    "IFD0:ImageDescription",
    "ImageDescription",
    "EXIF:UserComment",
    "IFD0:UserComment",
    "UserComment",
    "EXIF:Comment",
    "IFD0:Comment",
    "EXIF:Subject",
    "IFD0:Subject",
)
_AVIF_WORKFLOW_KEYS = _WEBP_WORKFLOW_KEYS
_AVIF_PROMPT_KEYS = _WEBP_PROMPT_KEYS
_AVIF_TEXT_KEYS = _WEBP_TEXT_KEYS
_VIDEO_WORKFLOW_KEYS = ("QuickTime:Workflow", "Keys:Workflow", "comfyui:workflow")
_VIDEO_PROMPT_KEYS = ("QuickTime:Prompt", "Keys:Prompt", "comfyui:prompt")
_RATING_CANDIDATE_KEYS = (
    "xmp:rating",
    "xmp-xmp:rating",
    "microsoft:ratingpercent",
    "xmp-microsoft:ratingpercent",
    "microsoft:shareduserrating",
    "xmp-microsoft:shareduserrating",
    "rating",
    "ratingpercent",
    "shareduserrating",
)
_TAG_CANDIDATE_KEYS = (
    "dc:subject",
    "xmp-dc:subject",
    "xmp:subject",
    "iptc:keywords",
    "photoshop:keywords",
    "lr:hierarchicalsubject",
    "microsoft:category",
    "xmp-microsoft:category",
    "xpkeywords",
    "keywords",
    "subject",
    "category",
)
_DIM_WIDTH_KEYS = (
    "Image:ImageWidth",
    "EXIF:ImageWidth",
    "EXIF:ExifImageWidth",
    "IFD0:ImageWidth",
    "Composite:ImageWidth",
    "QuickTime:ImageWidth",
    "PNG:ImageWidth",
    "File:ImageWidth",
    "width",
)
_DIM_HEIGHT_KEYS = (
    "Image:ImageHeight",
    "EXIF:ImageHeight",
    "EXIF:ExifImageHeight",
    "IFD0:ImageHeight",
    "Composite:ImageHeight",
    "QuickTime:ImageHeight",
    "PNG:ImageHeight",
    "File:ImageHeight",
    "height",
)
_DIM_PAIR_KEYS = ("Composite:ImageSize", "Image:ImageSize", "QuickTime:ImageSize", "ImageSize")


def _inspect_json_field(container: Any, key_names: tuple[str, ...]) -> Any | None:
    if not isinstance(container, dict):
        return None
    for key in key_names:
        parsed = parse_json_value(container.get(key))
        if parsed is not None:
            return parsed
    return None


def _unwrap_workflow_prompt_container(container: Any) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    """
    Some pipelines embed:
      {"workflow": {...}, "prompt": "{...json...}"}
    in a single metadata tag.
    """
    if not isinstance(container, dict):
        return (None, None)

    wf = _container_json_candidate(container, "workflow")
    pr = _container_json_candidate(container, "prompt")
    wf_out = wf if isinstance(wf, dict) and looks_like_comfyui_workflow(wf) else None
    pr_out = _prompt_graph_from_container_value(pr)
    return wf_out, pr_out


def _container_json_candidate(container: dict[str, Any], key: str) -> Any:
    return container.get(key) or container.get(key.capitalize())


def _prompt_graph_from_container_value(value: Any) -> dict[str, Any] | None:
    if isinstance(value, dict) and looks_like_comfyui_prompt_graph(value):
        return value
    text = _prompt_graph_candidate_text(value)
    if text is None:
        return None
    return _parse_prompt_graph_text(text)


def _prompt_graph_candidate_text(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    text = value.strip()
    if not text or len(text) > MAX_METADATA_JSON_CHARS or not text.startswith("{"):
        return None
    return text


def _parse_prompt_graph_text(text: str) -> dict[str, Any] | None:
    parsed = try_parse_json_text(text)
    if isinstance(parsed, dict) and len(parsed) > MAX_METADATA_JSON_TOPLEVEL_KEYS:
        return None
    if isinstance(parsed, dict) and looks_like_comfyui_prompt_graph(parsed):
        return parsed
    return None


def _merge_workflow_prompt_candidate(
    candidate: Any,
    workflow: dict[str, Any] | None,
    prompt: dict[str, Any] | None,
) -> tuple[dict[str, Any] | None, dict[str, Any] | None, bool]:
    matched = False
    wf_candidate: dict[str, Any] | None = None
    pr_candidate: dict[str, Any] | None = None

    if looks_like_comfyui_workflow(candidate):
        wf_candidate = candidate
    if looks_like_comfyui_prompt_graph(candidate):
        pr_candidate = candidate
    if wf_candidate is None and pr_candidate is None:
        wf_candidate, pr_candidate = _unwrap_workflow_prompt_container(candidate)

    if workflow is None and wf_candidate is not None:
        workflow = wf_candidate
        matched = True
    if prompt is None and pr_candidate is not None:
        prompt = pr_candidate
        matched = True
    return workflow, prompt, matched


def _coerce_dim(value: Any) -> int | None:
    try:
        if value is None:
            return None
        if isinstance(value, str):
            txt = value.strip().lower().replace("px", "").strip()
            if not txt or "x" in txt:
                return None
            value = txt
        out = int(float(value))
        return out if out > 0 else None
    except Exception:
        return None


def _first_available_dim(exif_data: dict[str, Any], keys: tuple[str, ...]) -> int | None:
    for key in keys:
        value = _coerce_dim(exif_data.get(key))
        if value is not None:
            return value
    return None


def _parse_size_pair(raw: Any) -> tuple[int | None, int | None]:
    if raw is None:
        return (None, None)
    try:
        txt = str(raw).strip().lower().replace("px", "").replace("Ã—", "x")
        txt = txt.replace(",", " ").replace(";", " ")
        if "x" in txt:
            left, right = [s.strip() for s in txt.split("x", 1)]
        else:
            parts = [part for part in txt.split() if part]
            if len(parts) < 2:
                return (None, None)
            left, right = parts[0], parts[1]
        return (_coerce_dim(left), _coerce_dim(right))
    except Exception:
        return (None, None)


def _apply_dimensions_from_exif(metadata: dict[str, Any], exif_data: dict[str, Any]) -> None:
    width = metadata.get("width") or _first_available_dim(exif_data, _DIM_WIDTH_KEYS)
    height = metadata.get("height") or _first_available_dim(exif_data, _DIM_HEIGHT_KEYS)
    width, height = _fill_missing_dims_from_pairs(width, height, exif_data)
    if width is not None and height is not None:
        metadata["width"] = int(width)
        metadata["height"] = int(height)


def _fill_missing_dims_from_pairs(
    width: int | None,
    height: int | None,
    exif_data: dict[str, Any],
) -> tuple[int | None, int | None]:
    if width is not None and height is not None:
        return width, height
    for key in _DIM_PAIR_KEYS:
        pair_w, pair_h = _parse_size_pair(exif_data.get(key))
        if width is None and pair_w is not None:
            width = pair_w
        if height is None and pair_h is not None:
            height = pair_h
        if width is not None and height is not None:
            break
    return width, height


def _extract_ffprobe_format_tags(ffprobe_data: dict[str, Any] | None) -> dict[str, Any]:
    if not isinstance(ffprobe_data, dict):
        return {}
    fmt = ffprobe_data.get("format") or {}
    if not isinstance(fmt, dict):
        return {}
    tags = fmt.get("tags")
    return tags if isinstance(tags, dict) else {}


def _extract_ffprobe_stream_tag_dicts(ffprobe_data: dict[str, Any] | None) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    if not isinstance(ffprobe_data, dict):
        return out
    streams = ffprobe_data.get("streams")
    if not isinstance(streams, list):
        return out
    for stream in streams:
        if not isinstance(stream, dict):
            continue
        tags = stream.get("tags")
        if isinstance(tags, dict):
            out.append(tags)
    return out


def _collect_text_candidates(container: Any) -> list[tuple[str, str]]:
    if not isinstance(container, dict):
        return []
    out: list[tuple[str, str]] = []
    for key, value in container.items():
        if isinstance(value, str):
            out.append((str(key), value))
        elif isinstance(value, (list, tuple)):
            for item in value:
                if isinstance(item, str):
                    out.append((str(key), item))
    return out


def _apply_auto1111_text_candidates(
    metadata: dict[str, Any],
    candidates: list[tuple[str, str]],
    *,
    prompt_graph: dict[str, Any] | None,
    preserve_existing_prompt_text: bool,
) -> None:
    if metadata.get("parameters") is not None:
        return
    for _, text in candidates:
        parsed = parse_auto1111_params(text)
        if not parsed:
            continue
        metadata["parameters"] = text
        metadata.update(parsed)
        if metadata.get("quality") != "full":
            _bump_quality(metadata, "partial")
        if prompt_graph is None and parsed.get("prompt"):
            if not preserve_existing_prompt_text or not metadata.get("prompt"):
                metadata["prompt"] = parsed.get("prompt")
            if parsed.get("negative_prompt"):
                metadata["negative_prompt"] = parsed.get("negative_prompt")
        return


def _workflow_build_link_lookup(links: Any) -> dict[Any, tuple[Any, Any, Any, Any]]:
    link_lookup: dict[Any, tuple[Any, Any, Any, Any]] = {}
    if not isinstance(links, list):
        return link_lookup
    for link in links:
        if isinstance(link, list) and len(link) >= 5:
            link_lookup[link[0]] = (link[1], link[2], link[3], link[4])
    return link_lookup


def _workflow_get_source_data(
    node_map: dict[Any, dict[str, Any]],
    link_lookup: dict[Any, tuple[Any, Any, Any, Any]],
    target_node_id: Any,
    input_name: str,
) -> tuple[dict[str, Any] | None, Any] | None:
    target_node = node_map.get(target_node_id)
    if not isinstance(target_node, dict):
        return None

    inp_def = next((item for item in target_node.get("inputs", []) if item.get("name") == input_name), None)
    if not isinstance(inp_def, dict):
        return None

    link_id = inp_def.get("link")
    if not link_id:
        return None

    link_info = link_lookup.get(link_id)
    if not link_info:
        return None

    origin_id = link_info[0]
    return (node_map.get(origin_id), link_id)


def _workflow_get_node_text(node: dict[str, Any], context: str | None = None) -> str | None:
    widgets = node.get("widgets_values")
    if not isinstance(widgets, list) or not widgets:
        return None

    str_widgets = [value for value in widgets if isinstance(value, str) and value.strip()]
    if not str_widgets:
        return None
    if len(str_widgets) == 1:
        return str_widgets[0]
    if context == "negative":
        return str_widgets[-1]
    return str_widgets[0]


def _workflow_find_upstream_text(
    node_map: dict[Any, dict[str, Any]],
    link_lookup: dict[Any, tuple[Any, Any, Any, Any]],
    start_node: dict[str, Any] | None,
    *,
    context: str | None = None,
    depth: int = 0,
    seen: set[Any] | None = None,
) -> list[str]:
    if not isinstance(start_node, dict):
        return []

    local_seen: set[Any] = seen if seen is not None else set()
    found_texts: list[str] = []
    stack: list[tuple[dict[str, Any], int]] = [(start_node, depth)]
    max_depth = 32

    while stack:
        node, d = stack.pop()
        if not _workflow_trace_node_allowed(node, d, max_depth, local_seen):
            continue
        _workflow_collect_node_text(node, context, found_texts)
        _workflow_push_upstream_inputs(node_map, link_lookup, node, context, d, stack)
    return found_texts


def _workflow_trace_node_allowed(node: Any, depth: int, max_depth: int, local_seen: set[Any]) -> bool:
    if not isinstance(node, dict) or depth > max_depth:
        return False
    node_id = node.get("id")
    if node_id is None:
        return True
    if node_id in local_seen:
        return False
    local_seen.add(node_id)
    return True


def _workflow_collect_node_text(node: dict[str, Any], context: str | None, found_texts: list[str]) -> None:
    node_type = str(node.get("type", "")).lower()
    if "loader" in node_type or "checkpoint" in node_type or "loadimage" in node_type:
        return
    text = _workflow_get_node_text(node, context)
    if text:
        found_texts.append(text)


def _workflow_push_upstream_inputs(
    node_map: dict[Any, dict[str, Any]],
    link_lookup: dict[Any, tuple[Any, Any, Any, Any]],
    node: dict[str, Any],
    context: str | None,
    depth: int,
    stack: list[tuple[dict[str, Any], int]],
) -> None:
    inputs = node.get("inputs", [])
    if not isinstance(inputs, list) or not inputs:
        return
    for inp in reversed(inputs):
        if not isinstance(inp, dict):
            continue
        if not _workflow_input_context_allowed(inp, context):
            continue
        link_id = inp.get("link")
        if not link_id:
            continue
        link_info = link_lookup.get(link_id)
        if not link_info:
            continue
        origin_node = node_map.get(link_info[0])
        if isinstance(origin_node, dict):
            stack.append((origin_node, depth + 1))


def _workflow_input_context_allowed(inp: dict[str, Any], context: str | None) -> bool:
    input_name = str(inp.get("name", "")).lower()
    if context == "positive" and "negative" in input_name:
        return False
    if context == "negative" and "positive" in input_name:
        return False
    return True


def _workflow_apply_sampler_widget_params(params: dict[str, Any], widgets: Any) -> None:
    if not isinstance(widgets, list):
        return
    for value in widgets:
        _workflow_apply_sampler_widget_value(params, value)


def _workflow_apply_sampler_widget_value(params: dict[str, Any], value: Any) -> None:
    if isinstance(value, int):
        _workflow_apply_sampler_int(params, value)
        return
    if isinstance(value, float):
        if 1.0 <= value <= 30.0 and "cfg" not in params:
            params["cfg"] = value
        return
    if isinstance(value, str):
        _workflow_apply_sampler_name(params, value)


def _workflow_apply_sampler_int(params: dict[str, Any], value: int) -> None:
    if value > 10000 and "seed" not in params:
        params["seed"] = value
    elif 1 <= value <= 200 and "steps" not in params:
        params["steps"] = value


def _workflow_apply_sampler_name(params: dict[str, Any], value: str) -> None:
    if "sampler" in params:
        return
    if value.lower() in ["euler", "euler_a", "dpm++", "ddim", "uni_pc"]:
        params["sampler"] = value


def _workflow_trace_sampler_fields(
    node: dict[str, Any],
    node_map: dict[Any, dict[str, Any]],
    link_lookup: dict[Any, tuple[Any, Any, Any, Any]],
    params: dict[str, Any],
    unique_prompts: set[str],
    unique_negatives: set[str],
    visited_nodes: set[Any],
) -> None:
    node_id = node.get("id")
    if node_id is None:
        return
    _workflow_apply_sampler_widget_params(params, node.get("widgets_values", []))

    _workflow_collect_source_texts(node_map, link_lookup, node_id, "positive", "positive", unique_prompts, visited_nodes)
    _workflow_collect_source_texts(node_map, link_lookup, node_id, "negative", "negative", unique_negatives, visited_nodes)
    _workflow_trace_guider_fields(node_map, link_lookup, node_id, unique_prompts, unique_negatives, visited_nodes)
    _workflow_trace_model_field(node_map, link_lookup, node_id, params)


def _workflow_trace_guider_fields(
    node_map: dict[Any, dict[str, Any]],
    link_lookup: dict[Any, tuple[Any, Any, Any, Any]],
    node_id: Any,
    unique_prompts: set[str],
    unique_negatives: set[str],
    visited_nodes: set[Any],
) -> None:
    guider_info = _workflow_get_source_data(node_map, link_lookup, node_id, "guider")
    if not guider_info or not isinstance(guider_info[0], dict):
        return
    guider_id = guider_info[0].get("id")
    cond_info = _workflow_get_source_data(node_map, link_lookup, guider_id, "conditioning")
    if not cond_info:
        cond_info = _workflow_get_source_data(node_map, link_lookup, guider_id, "positive")
    if cond_info:
        _workflow_collect_from_source_info(node_map, link_lookup, cond_info, "positive", unique_prompts, visited_nodes)
    neg_guider_info = _workflow_get_source_data(node_map, link_lookup, guider_id, "negative")
    if neg_guider_info:
        _workflow_collect_from_source_info(node_map, link_lookup, neg_guider_info, "negative", unique_negatives, visited_nodes)


def _workflow_trace_model_field(
    node_map: dict[Any, dict[str, Any]],
    link_lookup: dict[Any, tuple[Any, Any, Any, Any]],
    node_id: Any,
    params: dict[str, Any],
) -> None:
    model_info = _workflow_get_source_data(node_map, link_lookup, node_id, "model")
    if not model_info or not isinstance(model_info[0], dict):
        return
    for item in model_info[0].get("widgets_values", []):
        if isinstance(item, str) and (".safetensors" in item or ".ckpt" in item):
            params["model"] = item
            return


def _workflow_collect_source_texts(
    node_map: dict[Any, dict[str, Any]],
    link_lookup: dict[Any, tuple[Any, Any, Any, Any]],
    node_id: Any,
    source_name: str,
    context: str,
    out: set[str],
    visited_nodes: set[Any],
) -> None:
    source_info = _workflow_get_source_data(node_map, link_lookup, node_id, source_name)
    if source_info:
        _workflow_collect_from_source_info(node_map, link_lookup, source_info, context, out, visited_nodes)


def _workflow_collect_from_source_info(
    node_map: dict[Any, dict[str, Any]],
    link_lookup: dict[Any, tuple[Any, Any, Any, Any]],
    source_info: tuple[Any, Any],
    context: str,
    out: set[str],
    visited_nodes: set[Any],
) -> None:
    trace_seen: set[Any] = set()
    texts = _workflow_find_upstream_text(
        node_map,
        link_lookup,
        source_info[0],
        context=context,
        seen=trace_seen,
    )
    out.update(texts)
    visited_nodes.update(trace_seen)


def _workflow_classify_unconnected_node(
    start_node: dict[str, Any],
    node_map: dict[Any, dict[str, Any]],
    link_lookup: dict[Any, tuple[Any, Any, Any, Any]],
    *,
    depth: int = 0,
    visited_trace: set[Any] | None = None,
) -> str:
    local_visited = visited_trace if visited_trace is not None else set()
    nid = start_node.get("id")
    if nid in local_visited or depth > 6:
        return "unknown"
    local_visited.add(nid)

    outputs = start_node.get("outputs", [])
    if not isinstance(outputs, list):
        return "unknown"
    for link_id in _workflow_iter_output_link_ids(outputs):
        tgt_node = _workflow_target_node_from_link(link_id, node_map, link_lookup)
        if not isinstance(tgt_node, dict):
            continue
        direct_role = _workflow_role_from_target_input_link(tgt_node, link_id)
        if direct_role != "unknown":
            return direct_role
        role = _workflow_classify_unconnected_node(
            tgt_node,
            node_map,
            link_lookup,
            depth=depth + 1,
            visited_trace=local_visited,
        )
        if role != "unknown":
            return role

    return "unknown"


def _workflow_iter_output_link_ids(outputs: list[Any]) -> list[Any]:
    link_ids: list[Any] = []
    for output in outputs:
        if not isinstance(output, dict):
            continue
        links = output.get("links")
        if not links:
            continue
        if isinstance(links, list):
            link_ids.extend(links)
        else:
            link_ids.append(links)
    return link_ids


def _workflow_target_node_from_link(
    link_id: Any,
    node_map: dict[Any, dict[str, Any]],
    link_lookup: dict[Any, tuple[Any, Any, Any, Any]],
) -> dict[str, Any] | None:
    link_target = link_lookup.get(link_id)
    if not link_target:
        return None
    tgt_node = node_map.get(link_target[2])
    return tgt_node if isinstance(tgt_node, dict) else None


def _workflow_role_from_target_input_link(target_node: dict[str, Any], link_id: Any) -> str:
    tgt_inputs = target_node.get("inputs", [])
    if not isinstance(tgt_inputs, list):
        return "unknown"
    for inp in tgt_inputs:
        if not isinstance(inp, dict):
            continue
        if inp.get("link") != link_id:
            continue
        input_name = str(inp.get("name", "")).lower()
        if "positive" in input_name:
            return "positive"
        if "negative" in input_name:
            return "negative"
    return "unknown"


def _workflow_collect_unconnected_texts(
    nodes: list[dict[str, Any]],
    node_map: dict[Any, dict[str, Any]],
    link_lookup: dict[Any, tuple[Any, Any, Any, Any]],
    unique_prompts: set[str],
    unique_negatives: set[str],
    visited_nodes: set[Any],
    sampler_found: bool,
) -> None:
    for node in nodes:
        uid = node.get("id")
        if uid in visited_nodes:
            continue

        node_type = str(node.get("type", "")).lower()
        title = str(node.get("title", "")).lower()
        if not _workflow_is_text_prompt_node(node_type):
            continue

        text = _workflow_get_node_text(node)
        if not text:
            continue

        _workflow_store_unconnected_text(
            text,
            title,
            node,
            node_map,
            link_lookup,
            unique_prompts,
            unique_negatives,
            sampler_found,
        )


def _workflow_store_unconnected_text(
    text: str,
    title: str,
    node: dict[str, Any],
    node_map: dict[Any, dict[str, Any]],
    link_lookup: dict[Any, tuple[Any, Any, Any, Any]],
    unique_prompts: set[str],
    unique_negatives: set[str],
    sampler_found: bool,
) -> None:
    if "negative" in title:
        unique_negatives.add(text)
        return
    if "positive" in title:
        unique_prompts.add(text)
        return
    role = _workflow_classify_unconnected_node(node, node_map, link_lookup)
    if role == "positive":
        unique_prompts.add(text)
    elif role == "negative":
        unique_negatives.add(text)
    elif not sampler_found:
        pass


def _workflow_apply_prompt_fallback(
    nodes: list[dict[str, Any]],
    unique_prompts: set[str],
    unique_negatives: set[str],
) -> None:
    if unique_prompts or unique_negatives:
        return

    for node in nodes:
        widgets = node.get("widgets_values")
        if not isinstance(widgets, list) or not widgets:
            continue
        node_type = str(node.get("type", "")).lower()
        title = str(node.get("title", "")).lower()
        if not _workflow_is_text_prompt_node(node_type):
            continue
        value = _workflow_first_nontrivial_text(widgets)
        if not value:
            continue
        if _workflow_is_negative_prompt_node(title, node_type):
            unique_negatives.add(value)
        else:
            unique_prompts.add(value)


def _workflow_is_text_prompt_node(node_type: str) -> bool:
    return "text" in node_type or "string" in node_type or "prompt" in node_type


def _workflow_first_nontrivial_text(widgets: list[Any]) -> str | None:
    for value in widgets:
        if isinstance(value, str) and len(value) > 2:
            return value
    return None


def _workflow_is_negative_prompt_node(title: str, node_type: str) -> bool:
    return "negative" in title or "negative" in node_type


def _workflow_finalize_params(
    params: dict[str, Any],
    unique_prompts: set[str],
    unique_negatives: set[str],
) -> None:
    if unique_prompts:
        params["positive_prompt"] = "\n".join(unique_prompts)
    if unique_negatives:
        params["negative_prompt"] = "\n".join(unique_negatives)
    fake_text_parts = _workflow_prompt_lines(params)
    details = _workflow_detail_lines(params)
    if details:
        fake_text_parts.append(", ".join(details))
    if fake_text_parts:
        params["parameters"] = "\n".join(fake_text_parts)


def _workflow_prompt_lines(params: dict[str, Any]) -> list[str]:
    out: list[str] = []
    if "positive_prompt" in params:
        out.append(params["positive_prompt"])
    if "negative_prompt" in params:
        out.append(f"Negative prompt: {params['negative_prompt']}")
    return out


def _workflow_detail_lines(params: dict[str, Any]) -> list[str]:
    out: list[str] = []
    if "steps" in params:
        out.append(f"Steps: {params['steps']}")
    if "sampler" in params:
        out.append(f"Sampler: {params['sampler']}")
    if "cfg" in params:
        out.append(f"CFG scale: {params['cfg']}")
    if "seed" in params:
        out.append(f"Seed: {params['seed']}")
    if "model" in params:
        out.append(f"Model: {params['model']}")
    return out


def _reconstruct_params_from_workflow(workflow: dict[str, Any]) -> dict[str, Any]:
    """
    Fallback: Extract prompts and parameters directly from the Workflow nodes.
    Uses link traversal to distinguish Positive vs Negative prompts.
    """
    params: dict[str, Any] = {}
    raw_nodes = workflow.get("nodes", [])
    links = workflow.get("links", [])
    if not isinstance(raw_nodes, list) or not raw_nodes:
        return params

    nodes = [node for node in raw_nodes if isinstance(node, dict)]
    node_map = {node["id"]: node for node in nodes if "id" in node}
    link_lookup = _workflow_build_link_lookup(links)

    unique_prompts: set[str] = set()
    unique_negatives: set[str] = set()
    visited_nodes: set[Any] = set()
    sampler_found = False

    for node in nodes:
        node_type = str(node.get("type", "")).lower()
        if "ksampler" not in node_type and "sampler" not in node_type:
            continue
        sampler_found = True
        _workflow_trace_sampler_fields(
            node,
            node_map,
            link_lookup,
            params,
            unique_prompts,
            unique_negatives,
            visited_nodes,
        )

    _workflow_collect_unconnected_texts(
        nodes,
        node_map,
        link_lookup,
        unique_prompts,
        unique_negatives,
        visited_nodes,
        sampler_found,
    )
    _workflow_apply_prompt_fallback(nodes, unique_prompts, unique_negatives)
    _workflow_finalize_params(params, unique_prompts, unique_negatives)
    return params


def _coerce_rating_to_stars(value: Any) -> int | None:
    """
    Normalize rating values to 0..5 stars.

    Accepts:
    - 0..5 directly
    - 0..100-ish "percent" (Windows SharedUserRating / RatingPercent)
    - string numbers
    """
    v = _coerce_rating_number(value)
    if v is None:
        return None
    if v <= 5.0:
        stars = int(round(v))
        return max(0, min(5, stars))
    return _coerce_percent_rating_to_stars(v)


def _coerce_rating_number(value: Any) -> float | None:
    if value is None:
        return None
    try:
        if isinstance(value, list) and value:
            value = value[0]
        if isinstance(value, str):
            value = value.strip()
            if not value:
                return None
            value = float(value.replace(",", "."))
        if isinstance(value, (int, float)):
            return float(value)
    except Exception:
        return None
    return None


def _coerce_percent_rating_to_stars(value: float) -> int:
    if value <= 0:
        return 0
    if value >= 88:
        return 5
    if value >= 63:
        return 4
    if value >= 38:
        return 3
    if value >= 13:
        return 2
    return 1


def _split_tags(text: str) -> list[str]:
    raw = str(text or "").strip()
    if not raw:
        return []
    # Common separators: semicolon (Windows), comma (many tools), pipe/newlines.
    parts = []
    for chunk in raw.replace("\r", "\n").replace("|", ";").split("\n"):
        parts.extend(chunk.split(";"))
    out: list[str] = []
    seen = set()
    for p in parts:
        for t in p.split(","):
            tag = str(t).strip()
            if not tag:
                continue
            if tag in seen:
                continue
            if len(tag) > MAX_TAG_LENGTH:
                continue
            seen.add(tag)
            out.append(tag)
    return out


def _extract_rating_tags(exif_data: dict | None) -> tuple[int | None, list[str]]:
    if not exif_data or not isinstance(exif_data, dict):
        return (None, [])
    norm = _build_exif_norm_map(exif_data)
    rating = _extract_rating_from_norm(norm)
    tags = _extract_tags_from_norm(norm)
    return (rating, _dedupe_tag_list(tags))


def _build_exif_norm_map(data: dict[str, Any]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for key, value in data.items():
        kl = _normalized_exif_key(key)
        if not kl:
            continue
        out.setdefault(kl, value)
        _add_exif_aliases(out, kl, value)
    return out


def _normalized_exif_key(key: Any) -> str:
    try:
        text = str(key)
    except Exception:
        return ""
    if not text:
        return ""
    return text.strip().lower()


def _add_exif_aliases(out: dict[str, Any], key_lower: str, value: Any) -> None:
    if ":" not in key_lower:
        return
    group, tag = key_lower.split(":", 1)
    if not tag:
        return
    out.setdefault(tag, value)
    group_last = group.split("-")[-1] if group else ""
    if group_last and group_last != group:
        out.setdefault(f"{group_last}:{tag}", value)


def _extract_rating_from_norm(norm: dict[str, Any]) -> int | None:
    for key in _RATING_CANDIDATE_KEYS:
        if key not in norm:
            continue
        rating = _coerce_rating_to_stars(norm.get(key))
        if rating is not None:
            return rating
    return None


def _extract_tags_from_norm(norm: dict[str, Any]) -> list[str]:
    tags: list[str] = []
    for key in _TAG_CANDIDATE_KEYS:
        if key not in norm:
            continue
        tags.extend(_split_tag_value(norm.get(key)))
    return tags


def _split_tag_value(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        out: list[str] = []
        for item in value:
            if item is not None:
                out.extend(_split_tags(str(item)))
        return out
    return _split_tags(str(value))


def _dedupe_tag_list(tags: list[str]) -> list[str]:
    seen: set[str] = set()
    deduped: list[str] = []
    for tag in tags:
        if tag in seen:
            continue
        seen.add(tag)
        deduped.append(tag)
    return deduped


def _extract_date_created(exif_data: dict[str, Any] | None) -> str | None:
    """
    Extract the best candidate for 'Generation Time' (Content Creation) from Exif.
    """
    if not exif_data:
        return None

    # Priority list for "Date Taken" / "Content Created"
    candidates = [
        "ExifIFD:DateTimeOriginal",
        "ExifIFD:CreateDate",
        "DateTimeOriginal",
        "CreateDate",
        "QuickTime:CreateDate",
        "QuickTime:CreationDate",
        "RIFF:DateTimeOriginal",
        "IPTC:DateCreated",
        "XMP-photoshop:DateCreated",
        "Composite:DateTimeCreated"
    ]

    for key in candidates:
        val = exif_data.get(key)
        if val and isinstance(val, str):
            # Basic validation/cleaning could happen here
            # ExifTool usually returns "YYYY:MM:DD HH:MM:SS" or similar
            return val

    return None


def extract_rating_tags_from_exif(exif_data: dict | None) -> tuple[int | None, list[str]]:
    """
    Public wrapper for rating/tags extraction from ExifTool metadata dict.

    This is used by lightweight backends that only want rating/tags without parsing workflows.
    """
    return _extract_rating_tags(exif_data)

def _bump_quality(metadata: dict[str, Any], quality: str) -> None:
    """
    Upgrade metadata["quality"] without downgrading.

    Expected values: none < partial < full
    """
    order = {"none": 0, "partial": 1, "full": 2}
    try:
        current = str(metadata.get("quality") or "none")
    except Exception:
        current = "none"
    if order.get(quality, 0) > order.get(current, 0):
        metadata["quality"] = quality


def _resolve_workflow_prompt_fields(
    exif_data: dict[str, Any],
    workflow: dict[str, Any] | None,
    prompt: dict[str, Any] | None,
) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    wf = workflow
    pr = prompt
    if wf is None or pr is None:
        scanned_workflow, scanned_prompt = _extract_json_fields(exif_data)
        if wf is None:
            wf = scanned_workflow
        if pr is None:
            pr = scanned_prompt
    return wf, pr


def _apply_workflow_prompt_quality(
    metadata: dict[str, Any],
    workflow: dict[str, Any] | None,
    prompt: dict[str, Any] | None,
) -> None:
    if looks_like_comfyui_workflow(workflow):
        metadata["workflow"] = workflow
        _bump_quality(metadata, "full")
    if looks_like_comfyui_prompt_graph(prompt):
        metadata["prompt"] = prompt
        if str(metadata.get("quality") or "none") != "full":
            _bump_quality(metadata, "partial")


def _apply_reconstructed_workflow_params(metadata: dict[str, Any]) -> None:
    if not metadata.get("workflow") or metadata.get("parameters"):
        return
    reconstructed = _reconstruct_params_from_workflow(metadata["workflow"])
    if not reconstructed:
        return
    metadata.update(reconstructed)
    if metadata.get("quality") != "full":
        _bump_quality(metadata, "partial")


def _apply_rating_tags_and_generation_time(metadata: dict[str, Any], exif_data: dict[str, Any]) -> None:
    rating, tags = _extract_rating_tags(exif_data)
    if rating is not None:
        metadata["rating"] = rating
    if tags:
        metadata["tags"] = tags

    date_created = _extract_date_created(exif_data)
    if date_created:
        metadata["generation_time"] = date_created


def _apply_common_exif_fields(
    metadata: dict[str, Any],
    exif_data: dict[str, Any],
    *,
    workflow: dict[str, Any] | None = None,
    prompt: dict[str, Any] | None = None,
) -> None:
    """
    Apply workflow/prompt + rating/tags into an existing metadata dict.
    """
    wf, pr = _resolve_workflow_prompt_fields(exif_data, workflow, prompt)
    _apply_workflow_prompt_quality(metadata, wf, pr)
    _apply_reconstructed_workflow_params(metadata)
    _apply_rating_tags_and_generation_time(metadata, exif_data)
    if metadata.get("width") is None or metadata.get("height") is None:
        _apply_dimensions_from_exif(metadata, exif_data)


def _build_a1111_geninfo(parsed: dict[str, Any]) -> dict[str, Any] | None:
    """Build a minimal geninfo payload from parsed A1111 parameters."""
    if not isinstance(parsed, dict):
        return None

    out: dict[str, Any] = {"engine": {"parser_version": "geninfo-params-v1", "source": "parameters"}}

    _apply_a1111_prompt_fields(out, parsed)
    _apply_a1111_numeric_fields(out, parsed)
    _apply_a1111_size_field(out, parsed)
    _apply_a1111_checkpoint_field(out, parsed)

    return out if len(out) > 1 else None


def _apply_a1111_prompt_fields(out: dict[str, Any], parsed: dict[str, Any]) -> None:
    pos = parsed.get("prompt")
    neg = parsed.get("negative_prompt")
    if isinstance(pos, str) and pos.strip():
        out["positive"] = {"value": pos.strip(), "confidence": "high", "source": "parameters"}
    if isinstance(neg, str) and neg.strip():
        out["negative"] = {"value": neg.strip(), "confidence": "high", "source": "parameters"}


def _apply_a1111_numeric_fields(out: dict[str, Any], parsed: dict[str, Any]) -> None:
    _apply_a1111_numeric_field(out, "steps", parsed.get("steps"), int)
    _apply_a1111_numeric_field(out, "cfg", parsed.get("cfg"), float)
    _apply_a1111_numeric_field(out, "seed", parsed.get("seed"), int)


def _apply_a1111_numeric_field(out: dict[str, Any], key: str, value: Any, caster: Any) -> None:
    if value is None:
        return
    try:
        out[key] = {"value": caster(value), "confidence": "high", "source": "parameters"}
    except Exception:
        return


def _apply_a1111_size_field(out: dict[str, Any], parsed: dict[str, Any]) -> None:
    width = parsed.get("width")
    height = parsed.get("height")
    if width is None or height is None:
        return
    try:
        out["size"] = {
            "width": int(width),
            "height": int(height),
            "confidence": "high",
            "source": "parameters",
        }
    except Exception:
        return


def _apply_a1111_checkpoint_field(out: dict[str, Any], parsed: dict[str, Any]) -> None:
    model = parsed.get("model")
    if not isinstance(model, str) or not model.strip():
        return
    checkpoint = model.strip().replace("\\", "/").split("/")[-1]
    lower = checkpoint.lower()
    for ext in (".safetensors", ".ckpt", ".pt", ".pth", ".bin", ".gguf", ".json"):
        if lower.endswith(ext):
            checkpoint = checkpoint[: -len(ext)]
            break
    if checkpoint:
        out["checkpoint"] = {"name": checkpoint, "confidence": "high", "source": "parameters"}


def _read_png_text_chunks(file_path: str) -> dict[str, Any]:
    return _png.read_png_text_chunks(file_path)


def extract_png_metadata(file_path: str, exif_data: dict | None = None) -> Result[dict[str, Any]]:
    return _png.extract_png_metadata_impl(
        file_path,
        exif_data,
        exists=os.path.exists,
        read_png_text_chunks=_read_png_text_chunks,
        inspect_json_field=_inspect_json_field,
        merge_workflow_prompt_candidate=_merge_workflow_prompt_candidate,
        merge_scanned_workflow_prompt=_merge_scanned_workflow_prompt,
        parse_auto1111_params=parse_auto1111_params,
        bump_quality=_bump_quality,
        build_a1111_geninfo=_build_a1111_geninfo,
        apply_common_exif_fields=_apply_common_exif_fields,
        result_ok=Result.Ok,
        result_err=Result.Err,
        error_code=ErrorCode,
        logger=logger,
    )


def _merge_scanned_workflow_prompt(
    workflow: dict[str, Any] | None,
    prompt: dict[str, Any] | None,
    container: dict[str, Any] | None,
) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    if not isinstance(container, dict):
        return workflow, prompt
    scanned_workflow, scanned_prompt = _extract_json_fields(container)
    if workflow is None and looks_like_comfyui_workflow(scanned_workflow):
        workflow = scanned_workflow
    if prompt is None and looks_like_comfyui_prompt_graph(scanned_prompt):
        prompt = scanned_prompt
    return workflow, prompt


def _scan_webp_text_fields(
    metadata: dict[str, Any],
    exif_data: dict[str, Any],
    workflow: dict[str, Any] | None,
    prompt: dict[str, Any] | None,
) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    return _webp.scan_webp_text_fields(
        metadata,
        exif_data,
        workflow,
        prompt,
        webp_text_keys=_WEBP_TEXT_KEYS,
        try_merge_webp_json_candidate=_try_merge_webp_json_candidate,
        apply_webp_auto1111_candidate=_apply_webp_auto1111_candidate,
    )


def _scan_avif_text_fields(
    metadata: dict[str, Any],
    exif_data: dict[str, Any],
    workflow: dict[str, Any] | None,
    prompt: dict[str, Any] | None,
) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    return _webp.scan_webp_text_fields(
        metadata,
        exif_data,
        workflow,
        prompt,
        webp_text_keys=_AVIF_TEXT_KEYS,
        try_merge_webp_json_candidate=_try_merge_avif_json_candidate,
        apply_webp_auto1111_candidate=_apply_avif_auto1111_candidate,
    )


def _try_merge_webp_json_candidate(
    candidate_text: str,
    workflow: dict[str, Any] | None,
    prompt: dict[str, Any] | None,
) -> tuple[dict[str, Any] | None, dict[str, Any] | None, bool]:
    return _webp.try_merge_webp_json_candidate(
        candidate_text,
        workflow,
        prompt,
        try_parse_json_text=try_parse_json_text,
        merge_workflow_prompt_candidate=_merge_workflow_prompt_candidate,
    )


def _try_merge_avif_json_candidate(
    candidate_text: str,
    workflow: dict[str, Any] | None,
    prompt: dict[str, Any] | None,
) -> tuple[dict[str, Any] | None, dict[str, Any] | None, bool]:
    return _webp.try_merge_webp_json_candidate(
        candidate_text,
        workflow,
        prompt,
        try_parse_json_text=try_parse_json_text,
        merge_workflow_prompt_candidate=_merge_workflow_prompt_candidate,
    )


def _apply_webp_auto1111_candidate(
    metadata: dict[str, Any],
    candidate_text: str,
    prompt: dict[str, Any] | None,
) -> None:
    _webp.apply_webp_auto1111_candidate(
        metadata,
        candidate_text,
        prompt,
        parse_auto1111_params=parse_auto1111_params,
        bump_quality=_bump_quality,
    )


def _apply_avif_auto1111_candidate(
    metadata: dict[str, Any],
    candidate_text: str,
    prompt: dict[str, Any] | None,
) -> None:
    _webp.apply_webp_auto1111_candidate(
        metadata,
        candidate_text,
        prompt,
        parse_auto1111_params=parse_auto1111_params,
        bump_quality=_bump_quality,
    )


def _apply_video_ffprobe_fields(metadata: dict[str, Any], ffprobe_data: dict[str, Any] | None) -> None:
    _video.apply_video_ffprobe_fields(metadata, ffprobe_data)


def _scan_video_workflow_prompt_from_sources(
    exif_data: dict[str, Any],
    ffprobe_data: dict[str, Any] | None,
) -> tuple[dict[str, Any] | None, dict[str, Any] | None, dict[str, Any], list[dict[str, Any]]]:
    return _video.scan_video_workflow_prompt_from_sources(
        exif_data,
        ffprobe_data,
        inspect_json_field=_inspect_json_field,
        video_workflow_keys=_VIDEO_WORKFLOW_KEYS,
        video_prompt_keys=_VIDEO_PROMPT_KEYS,
        merge_workflow_prompt_candidate=_merge_workflow_prompt_candidate,
        merge_scanned_workflow_prompt=_merge_scanned_workflow_prompt,
        extract_ffprobe_format_tags=_extract_ffprobe_format_tags,
        extract_ffprobe_stream_tag_dicts=_extract_ffprobe_stream_tag_dicts,
    )


def _collect_video_text_candidates(
    exif_data: dict[str, Any],
    format_tags: dict[str, Any],
    stream_tag_dicts: list[dict[str, Any]],
) -> list[tuple[str, str]]:
    return _video.collect_video_text_candidates(
        exif_data,
        format_tags,
        stream_tag_dicts,
        collect_text_candidates=_collect_text_candidates,
    )

def extract_webp_metadata(file_path: str, exif_data: dict | None = None) -> Result[dict[str, Any]]:
    return _webp.extract_webp_metadata_impl(
        file_path,
        exif_data,
        exists=os.path.exists,
        inspect_json_field=_inspect_json_field,
        webp_workflow_keys=_WEBP_WORKFLOW_KEYS,
        webp_prompt_keys=_WEBP_PROMPT_KEYS,
        merge_workflow_prompt_candidate=_merge_workflow_prompt_candidate,
        merge_scanned_workflow_prompt=_merge_scanned_workflow_prompt,
        scan_webp_text_fields=_scan_webp_text_fields,
        apply_common_exif_fields=_apply_common_exif_fields,
        result_ok=Result.Ok,
        result_err=Result.Err,
        error_code=ErrorCode,
        logger=logger,
    )


def extract_avif_metadata(file_path: str, exif_data: dict | None = None) -> Result[dict[str, Any]]:
    return _webp.extract_webp_metadata_impl(
        file_path,
        exif_data,
        exists=os.path.exists,
        inspect_json_field=_inspect_json_field,
        webp_workflow_keys=_AVIF_WORKFLOW_KEYS,
        webp_prompt_keys=_AVIF_PROMPT_KEYS,
        merge_workflow_prompt_candidate=_merge_workflow_prompt_candidate,
        merge_scanned_workflow_prompt=_merge_scanned_workflow_prompt,
        scan_webp_text_fields=_scan_avif_text_fields,
        apply_common_exif_fields=_apply_common_exif_fields,
        result_ok=Result.Ok,
        result_err=Result.Err,
        error_code=ErrorCode,
        logger=logger,
    )

def extract_video_metadata(file_path: str, exif_data: dict | None = None, ffprobe_data: dict | None = None) -> Result[dict[str, Any]]:
    return _video.extract_video_metadata_impl(
        file_path,
        exif_data,
        ffprobe_data,
        exists=os.path.exists,
        apply_video_ffprobe_fields=_apply_video_ffprobe_fields,
        scan_video_workflow_prompt_from_sources=_scan_video_workflow_prompt_from_sources,
        collect_video_text_candidates=_collect_video_text_candidates,
        apply_auto1111_text_candidates=_apply_auto1111_text_candidates,
        apply_common_exif_fields=_apply_common_exif_fields,
        result_ok=Result.Ok,
        result_err=Result.Err,
        error_code=ErrorCode,
        logger=logger,
    )

def _extract_json_fields(exif_data: dict[str, Any]) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    """
    Optimized scan of EXIF/ffprobe metadata for workflow/prompt JSON fields.
    Prioritizes known keys before scanning strictly.
    """
    workflow: dict[str, Any] | None = None
    prompt: dict[str, Any] | None = None
    for key, value in _priority_sorted_exif_items(exif_data):
        if workflow and prompt:
            break
        if isinstance(value, str) and len(value) < 10:
            continue
        parsed = parse_json_value(value)
        if not parsed:
            continue
        workflow, prompt = _merge_json_candidate(workflow, prompt, parsed, key, value)
    return workflow, prompt


def _priority_sorted_exif_items(exif_data: dict[str, Any]) -> list[tuple[Any, Any]]:
    priority_keys = (
        "UserComment",
        "Comment",
        "Description",
        "ImageDescription",
        "Parameters",
        "Workflow",
        "Prompt",
        "ExifOffset",
        "Make",
        "Model",
    )
    return sorted(
        exif_data.items(),
        key=lambda item: 0 if _is_priority_key(str(item[0]), priority_keys) else 1,
    )


def _is_priority_key(key: str, priority_keys: tuple[str, ...]) -> bool:
    key_lower = key.lower()
    return any(token.lower() in key_lower for token in priority_keys)


def _merge_json_candidate(
    workflow: dict[str, Any] | None,
    prompt: dict[str, Any] | None,
    parsed: Any,
    key: Any,
    value: Any,
) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    workflow, prompt = _merge_container_candidate(workflow, prompt, parsed)
    workflow = _merge_direct_workflow_candidate(workflow, parsed)
    prompt = _merge_direct_prompt_candidate(prompt, parsed)
    return _merge_prefixed_json_candidate(workflow, prompt, parsed, key, value)


def _merge_container_candidate(
    workflow: dict[str, Any] | None,
    prompt: dict[str, Any] | None,
    parsed: Any,
) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    if workflow is not None and prompt is not None:
        return workflow, prompt
    wf_candidate, pr_candidate = _unwrap_workflow_prompt_container(parsed)
    if workflow is None and wf_candidate:
        workflow = wf_candidate
    if prompt is None and pr_candidate:
        prompt = pr_candidate
    return workflow, prompt


def _merge_direct_workflow_candidate(workflow: dict[str, Any] | None, parsed: Any) -> dict[str, Any] | None:
    if workflow is None and looks_like_comfyui_workflow(parsed):
        return parsed
    return workflow


def _merge_direct_prompt_candidate(prompt: dict[str, Any] | None, parsed: Any) -> dict[str, Any] | None:
    if prompt is None and looks_like_comfyui_prompt_graph(parsed):
        return parsed
    return prompt


def _merge_prefixed_json_candidate(
    workflow: dict[str, Any] | None,
    prompt: dict[str, Any] | None,
    parsed: Any,
    key: Any,
    value: Any,
) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    if not isinstance(value, str):
        return workflow, prompt
    normalized = _normalized_json_key(key)
    text_lower = value.strip().lower()
    if workflow is None and _looks_like_workflow_prefixed(text_lower, normalized) and looks_like_comfyui_workflow(parsed):
        workflow = parsed
    if prompt is None and _looks_like_prompt_prefixed(text_lower, normalized) and looks_like_comfyui_prompt_graph(parsed):
        prompt = parsed
    return workflow, prompt


def _normalized_json_key(key: Any) -> str:
    return key.lower() if isinstance(key, str) else ""


def _looks_like_workflow_prefixed(text_lower: str, normalized: str) -> bool:
    return text_lower.startswith("workflow:") or "workflow" in normalized


def _looks_like_prompt_prefixed(text_lower: str, normalized: str) -> bool:
    return text_lower.startswith("prompt:") or "prompt" in normalized
