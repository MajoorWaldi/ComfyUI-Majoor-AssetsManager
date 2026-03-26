"""Sampler widget fallback helpers extracted from parser_impl."""

from __future__ import annotations

from typing import Any

from .graph_converter import _inputs, _is_link, _lower, _node_type
from .sampler_tracer import _scalar


def _looks_like_pipeline_pass_node(node: dict[str, Any]) -> bool:
    node_type = _lower(_node_type(node))
    title = _lower(node.get("title"))
    hint = f"{node_type} {title}"
    if not any(k in hint for k in ("detailer", "highres", "upscale", "refine")):
        return False

    ins = _inputs(node)
    has_model = _is_link(ins.get("model")) or _is_link(ins.get("model_1"))
    has_conditioning = (
        _is_link(ins.get("positive"))
        or _is_link(ins.get("positive_1"))
        or _is_link(ins.get("negative"))
        or _is_link(ins.get("negative_1"))
    )
    has_image_or_pixel = _is_link(ins.get("image")) or _is_link(ins.get("images")) or _is_link(ins.get("pixels"))
    return has_model or has_conditioning or has_image_or_pixel


def _node_has_detailer_signals(node: dict[str, Any]) -> bool:
    if not isinstance(node, dict):
        return False
    node_type = _lower(_node_type(node))
    title = _lower(node.get("title"))
    hint = f"{node_type} {title}"
    if any(token in hint for token in ("detailer", "facedetailer", "inpaint")):
        return True
    ins = _inputs(node)
    return any(key in ins for key in ("mask", "masks", "bbox", "segs", "sam_mask"))


def _apply_proxy_widget_sampler_values(values: dict[str, Any], sampler_node: dict[str, Any]) -> None:
    if not isinstance(values, dict) or not isinstance(sampler_node, dict):
        return
    proxy_values = _extract_proxy_widget_sampler_values(sampler_node)
    if not proxy_values:
        return

    if values.get("sampler_name") is None and proxy_values.get("sampler_name") is not None:
        values["sampler_name"] = _scalar(proxy_values.get("sampler_name"))
    if values.get("scheduler") is None and proxy_values.get("scheduler") is not None:
        values["scheduler"] = _scalar(proxy_values.get("scheduler"))
    if values.get("steps") is None and proxy_values.get("steps") is not None:
        values["steps"] = _scalar(proxy_values.get("steps"))
    if values.get("cfg") is None and proxy_values.get("cfg") is not None:
        values["cfg"] = _scalar(proxy_values.get("cfg"))
    if values.get("denoise") is None and proxy_values.get("denoise") is not None:
        values["denoise"] = _scalar(proxy_values.get("denoise"))
    if values.get("seed_val") is None and proxy_values.get("seed_val") is not None:
        values["seed_val"] = _scalar(proxy_values.get("seed_val"))


def _extract_proxy_widget_sampler_values(node: dict[str, Any]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    props = node.get("properties")
    if not isinstance(props, dict):
        return out

    proxy_widgets = props.get("proxyWidgets")
    widgets_values = node.get("widgets_values")
    if not isinstance(proxy_widgets, list) or not isinstance(widgets_values, list):
        return out

    def _map_proxy_key(name: str) -> str | None:
        key = _lower(name)
        if key in ("sampler_name", "sampler"):
            return "sampler_name"
        if key == "scheduler":
            return "scheduler"
        if key == "steps":
            return "steps"
        if key in ("cfg", "cfg_scale"):
            return "cfg"
        if key == "denoise":
            return "denoise"
        if key in ("seed", "noise_seed"):
            return "seed_val"
        return None

    for idx, proxy_item in enumerate(proxy_widgets):
        if idx >= len(widgets_values):
            break
        if not isinstance(proxy_item, list) or not proxy_item:
            continue

        raw_name: str | None = None
        for candidate in reversed(proxy_item):
            if isinstance(candidate, str) and candidate.strip():
                raw_name = candidate.strip()
                break
        if not raw_name:
            continue

        mapped = _map_proxy_key(raw_name)
        if not mapped or mapped in out:
            continue
        out[mapped] = widgets_values[idx]

    return out
