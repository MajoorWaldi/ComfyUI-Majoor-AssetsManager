"""Graph conversion and sink-selection helpers extracted from parser.py."""

from __future__ import annotations

from collections import deque
from typing import Any, cast

DEFAULT_MAX_GRAPH_NODES = 5000
DEFAULT_MAX_GRAPH_DEPTH = 100

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


def _to_int(value: Any) -> int | None:
    try:
        if value is None:
            return None
        return int(value)
    except Exception:
        return None


def _looks_like_node_id(value: Any) -> bool:
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


def _sink_images_tiebreak(node: dict[str, Any]) -> int:
    try:
        return 0 if _is_link(_inputs(node).get("images")) else 1
    except Exception:
        return 1


def _sink_node_id_tiebreak(node_id: str | None) -> int:
    try:
        return -int(node_id) if node_id is not None else 0
    except Exception:
        return 0


def _sink_priority(node: dict[str, Any], node_id: str | None = None) -> tuple[int, int, int]:
    ct = _lower(_node_type(node))
    return (_sink_group(ct), _sink_images_tiebreak(node), _sink_node_id_tiebreak(node_id))


def _is_link(value: Any) -> bool:
    if not isinstance(value, (list, tuple)) or len(value) != 2:
        return False
    a, b = value[0], value[1]
    return _looks_like_node_id(a) and _to_int(b) is not None


def _resolve_link(value: Any) -> tuple[str, int] | None:
    if not _is_link(value):
        return None
    a, b = value[0], value[1]
    return str(a).strip(), int(_to_int(b) or 0)


def _node_type(node: Any) -> str:
    if not isinstance(node, dict):
        return ""
    return str(node.get("class_type") or node.get("type") or "")


def _inputs(node: Any) -> dict[str, Any]:
    if not isinstance(node, dict):
        return {}
    ins = node.get("inputs")
    return ins if isinstance(ins, dict) else {}


def _lower(s: Any) -> str:
    return str(s or "").lower()


def _is_reroute(node: dict[str, Any]) -> bool:
    ct = _lower(_node_type(node))
    return ct == "reroute" or "reroute" in ct


def _next_reroute_link(node: dict[str, Any]) -> Any | None:
    ins = _inputs(node)
    next_link = ins.get("")
    if _is_link(next_link):
        return next_link
    next_link = ins.get("input")
    if _is_link(next_link):
        return next_link
    for val in ins.values():
        if _is_link(val):
            return val
    return None


def _walk_passthrough(nodes_by_id: dict[str, dict[str, Any]], start_link: Any, max_hops: int = 50) -> str | None:
    resolved = _resolve_link(start_link)
    if not resolved:
        return None
    node_id, _ = resolved
    hops = 0
    while hops < max_hops:
        hops += 1
        node = nodes_by_id.get(node_id)
        if not isinstance(node, dict):
            return node_id
        if not _is_reroute(node):
            return node_id
        next_link = _next_reroute_link(node)
        if not _is_link(next_link):
            return node_id
        resolved = _resolve_link(next_link)
        if not resolved:
            return node_id
        node_id, _ = resolved
    return node_id


def _pick_sink_inputs(node: dict[str, Any]) -> Any | None:
    ins = _inputs(node)
    preferred = ["audio", "audios", "waveform", "images", "image", "frames", "video", "samples", "latent", "latent_image"]
    for key in preferred:
        value = ins.get(key)
        if _is_link(value):
            return value
    for value in ins.values():
        if _is_link(value):
            return value
    return None


def _find_candidate_sinks(nodes_by_id: dict[str, dict[str, Any]]) -> list[str]:
    sinks: list[str] = []
    for node_id, node in nodes_by_id.items():
        ct = _lower(_node_type(node))
        if ct in SINK_CLASS_TYPES:
            sinks.append(node_id)
            continue
        if ("save" in ct or "preview" in ct) and ("image" in ct or "video" in ct or "audio" in ct):
            sinks.append(node_id)
    return sinks


def _collect_upstream_nodes(nodes_by_id: dict[str, dict[str, Any]], start_node_id: str, max_nodes: int = DEFAULT_MAX_GRAPH_NODES, max_depth: int = DEFAULT_MAX_GRAPH_DEPTH) -> dict[str, int]:
    dist: dict[str, int] = {}
    q: deque[tuple[str, int]] = deque([(start_node_id, 0)])
    while q and len(dist) < max_nodes:
        nid, depth = q.popleft()
        if depth > max_depth:
            continue
        if nid in dist:
            continue
        dist[nid] = depth
        node = nodes_by_id.get(nid)
        if not isinstance(node, dict):
            continue
        for value in _inputs(node).values():
            if not _is_link(value):
                continue
            resolved = _resolve_link(value)
            if not resolved:
                continue
            src_id, _ = resolved
            q.append((src_id, depth + 1))
    return dist


def _workflow_sink_suffix(sink_type: str) -> str:
    is_audio_out = ("audio" in sink_type) and ("image" not in sink_type) and ("video" not in sink_type)
    is_video_out = (not is_audio_out) and ("video" in sink_type or "animate" in sink_type or "gif" in sink_type)
    return "A" if is_audio_out else ("V" if is_video_out else "I")


def _is_image_loader_node_type(ct: str) -> bool:
    return "loadimage" in ct or "imageloader" in ct


def _is_video_loader_node_type(ct: str) -> bool:
    return "loadvideo" in ct or "videoloader" in ct


def _is_audio_loader_node_type(ct: str) -> bool:
    return "loadaudio" in ct or "audioloader" in ct or ("load" in ct and "audio" in ct)


def _vae_pixel_input_kind(nodes_by_id: dict[str, Any], vae_node: dict[str, Any]) -> str | None:
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


def _next_latent_upstream_id(nodes_by_id: dict[str, Any], node: dict[str, Any]) -> str | None:
    for key in ("samples", "latent", "latent_image"):
        value = _inputs(node).get(key)
        if _is_link(value):
            return _walk_passthrough(nodes_by_id, value)
    return None


def _update_inputs_from_latent_node(nodes_by_id: dict[str, Any], node: dict[str, Any], *, has_image_input: bool, has_video_input: bool) -> tuple[bool, bool, bool]:
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


def _trace_sampler_latent_input_kind(nodes_by_id: dict[str, Any], sampler_id: str | None, has_image_input: bool, has_video_input: bool) -> tuple[bool, bool]:
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


def _scan_graph_input_kinds(nodes_by_id: dict[str, Any]) -> tuple[bool, bool, bool]:
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


def _workflow_input_prefix(has_image_input: bool, has_video_input: bool, has_audio_input: bool) -> str:
    if has_audio_input:
        return "A"
    if has_video_input:
        return "V"
    if has_image_input:
        return "I"
    return "T"


def _determine_workflow_type(nodes_by_id: dict[str, Any], sink_node_id: str, sampler_id: str | None) -> str:
    sink = nodes_by_id.get(sink_node_id)
    suffix = _workflow_sink_suffix(_lower(_node_type(sink)))
    has_image_input, has_video_input, has_audio_input = _scan_graph_input_kinds(nodes_by_id)
    has_image_input, has_video_input = _trace_sampler_latent_input_kind(nodes_by_id, sampler_id, has_image_input, has_video_input)
    prefix = _workflow_input_prefix(has_image_input, has_video_input, has_audio_input)
    return f"{prefix}2{suffix}"


def _resolve_graph_target(prompt_graph: Any, workflow: Any) -> dict[str, Any] | None:
    if isinstance(prompt_graph, dict) and prompt_graph:
        return prompt_graph
    if isinstance(workflow, dict) and "nodes" in workflow:
        return workflow
    return None


def _build_link_source_map(links: Any) -> dict[int, tuple[int, int]]:
    link_to_source: dict[int, tuple[int, int]] = {}
    if not isinstance(links, list):
        return link_to_source
    for link in links:
        if isinstance(link, list) and len(link) >= 3:
            link_to_source[link[0]] = (link[1], link[2])
    return link_to_source


def _init_litegraph_converted_node(node: dict[str, Any]) -> dict[str, Any]:
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


def _populate_converted_inputs_from_list(converted_inputs: dict[str, Any], raw_inputs: list[Any], widgets_list: list[Any], link_to_source: dict[int, tuple[int, int]]) -> None:
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


def _populate_converted_inputs(converted: dict[str, Any], raw_inputs: Any, widgets_list: list[Any], link_to_source: dict[int, tuple[int, int]]) -> dict[str, Any]:
    converted_inputs = converted.get("inputs")
    if isinstance(raw_inputs, list) and isinstance(converted_inputs, dict):
        _populate_converted_inputs_from_list(converted_inputs, raw_inputs, widgets_list, link_to_source)
        return converted_inputs
    if isinstance(raw_inputs, dict):
        converted["inputs"] = cast(dict[str, Any], raw_inputs)
        converted_inputs = converted.get("inputs")
    return cast(dict[str, Any], converted_inputs or {})


def _merge_widget_dict_inputs(converted_inputs: dict[str, Any], widgets_values: Any) -> None:
    if not isinstance(widgets_values, dict):
        return
    for key, value in widgets_values.items():
        if key not in converted_inputs:
            converted_inputs[key] = value


def _set_text_fallback_from_widgets(converted_inputs: dict[str, Any], widgets_list: list[Any], node: dict[str, Any]) -> None:
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


def _convert_litegraph_node(node: dict[str, Any], link_to_source: dict[int, tuple[int, int]]) -> dict[str, Any]:
    converted = _init_litegraph_converted_node(node)
    raw_inputs = node.get("inputs", [])
    widgets_values = node.get("widgets_values", [])
    widgets_list = widgets_values if isinstance(widgets_values, list) else []
    converted_inputs = _populate_converted_inputs(converted, raw_inputs, widgets_list, link_to_source)
    _merge_widget_dict_inputs(converted_inputs, widgets_values)
    _set_text_fallback_from_widgets(converted_inputs, widgets_list, node)
    return converted


def _normalize_graph_input(prompt_graph: Any, workflow: Any) -> dict[str, dict[str, Any]] | None:
    target_graph = _resolve_graph_target(prompt_graph, workflow)
    if not isinstance(target_graph, dict):
        return None
    nodes_by_id: dict[str, dict[str, Any]] = {}
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


def _set_named_field(out: dict[str, Any], key: str, value: Any, source: str, confidence: str = "high") -> None:
    if value is None:
        return
    name = str(value).strip()
    if not name:
        return
    out[key] = {"name": name, "confidence": confidence, "source": source}


def _set_value_field(out: dict[str, Any], key: str, value: Any, source: str, confidence: str = "high") -> None:
    if value is None:
        return
    out[key] = {"value": value, "confidence": confidence, "source": source}
