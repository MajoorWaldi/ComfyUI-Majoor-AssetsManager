"""Prompt tracing helpers extracted from parser.py."""

from __future__ import annotations

from collections import deque
from collections.abc import Callable
from typing import Any

from ...shared import Result, get_logger
from .graph_converter import _inputs, _is_link, _lower, _node_type, _resolve_link, _walk_passthrough, _collect_upstream_nodes
from .sampler_tracer import _scalar
from .parser_impl import (
    DEFAULT_MAX_LINK_NODES,
    _collect_text_encoder_nodes_from_conditioning,
    _first_prompt_field,
    _guidance_should_expand,
    _iter_guidance_conditioning_sources,
    _looks_like_prompt_string,
)

logger = get_logger(__name__)

def _collect_texts_from_conditioning(
    nodes_by_id: dict[str, dict[str, Any]], start_link: Any, max_nodes: int = DEFAULT_MAX_LINK_NODES, branch: str | None = None
) -> list[tuple[str, str]]:
    """
    Collect prompt text fragments from a conditioning link, returning (text, source).
    Deterministic order; never invents text when none is present.
    """
    node_ids = _collect_text_encoder_nodes_from_conditioning(nodes_by_id, start_link, max_nodes=max_nodes, branch=branch)
    out: list[tuple[str, str]] = []
    for nid in node_ids:
        node = nodes_by_id.get(nid)
        if not isinstance(node, dict):
            continue
        ins = _inputs(node)
        candidates: list[str] = []
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



def _extract_prompt_from_conditioning(nodes_by_id: dict[str, Any], link: Any, branch: str | None = None) -> tuple[str, str] | None:
    if not _is_link(link):
        return None
    items = _collect_texts_from_conditioning(nodes_by_id, link, branch=branch)
    return _source_from_items(items)



def _source_from_items(items: list[tuple[str, str]]) -> tuple[str, str] | None:
    if not items:
        return None
    text = "\n".join([t for t, _ in items]).strip()
    if not text:
        return None
    sources = [s for _, s in items]
    source = sources[0] if len(set(sources)) <= 1 else f"{sources[0]} (+{len(sources)-1})"
    return text, source



def _extract_prompt_trace(
    nodes_by_id: dict[str, Any],
    sampler_node: dict[str, Any],
    sampler_id: str,
    ins: dict[str, Any],
    advanced: bool,
) -> dict[str, Any]:
    trace: dict[str, Any] = {
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
    trace: dict[str, Any],
    sampler_node: dict[str, Any],
    sampler_id: str,
    ins: dict[str, Any],
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



def _apply_embed_prompt_hints(trace: dict[str, Any], nodes_by_id: dict[str, Any], ins: dict[str, Any]) -> None:
    if not (_is_link(ins.get("text_embeds")) or _is_link(ins.get("hyvid_embeds"))):
        return
    embeds_link = ins.get("text_embeds") or ins.get("hyvid_embeds")
    pos_embed, neg_embed = _extract_posneg_from_text_embeds(nodes_by_id, embeds_link)
    trace["pos_val"] = trace["pos_val"] or pos_embed
    trace["neg_val"] = trace["neg_val"] or neg_embed



def _extract_posneg_from_text_embeds(
    nodes_by_id: dict[str, dict[str, Any]], text_embeds_link: Any
) -> tuple[tuple[str, str] | None, tuple[str, str] | None]:
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

    def _get_str(*keys: str) -> str | None:
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



def _apply_conditioning_prompt_hints(trace: dict[str, Any], nodes_by_id: dict[str, Any], ins: dict[str, Any]) -> None:
    if _is_link(ins.get("positive")):
        extracted = _extract_prompt_from_conditioning(nodes_by_id, ins.get("positive"), branch="positive")
        if extracted:
            trace["pos_val"] = extracted
        trace["conditioning_link"] = ins.get("positive")
    if _is_link(ins.get("negative")):
        extracted = _extract_prompt_from_conditioning(nodes_by_id, ins.get("negative"), branch="negative")
        if extracted:
            trace["neg_val"] = extracted



def _apply_advanced_guider_prompt_trace(
    nodes_by_id: dict[str, Any],
    guider_link: Any,
    trace: dict[str, Any],
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



def _apply_guider_conditioning_prompt_hints(nodes_by_id: dict[str, Any], gins: dict[str, Any], trace: dict[str, Any]) -> None:
    conditioning = gins.get("conditioning")
    if not _is_link(conditioning):
        return
    trace["conditioning_link"] = conditioning
    extracted = _extract_prompt_from_conditioning(nodes_by_id, conditioning)
    if extracted and not trace["pos_val"]:
        trace["pos_val"] = extracted



def _apply_guider_positive_prompt_hints(nodes_by_id: dict[str, Any], gins: dict[str, Any], trace: dict[str, Any]) -> None:
    positive = gins.get("positive")
    if not _is_link(positive):
        return
    trace["conditioning_link"] = trace["conditioning_link"] or positive
    if trace["pos_val"]:
        return
    extracted = _extract_prompt_from_conditioning(nodes_by_id, positive, branch="positive")
    if extracted:
        trace["pos_val"] = extracted



def _apply_guider_negative_prompt_hints(nodes_by_id: dict[str, Any], gins: dict[str, Any], trace: dict[str, Any]) -> None:
    negative = gins.get("negative")
    if trace.get("neg_val") or not _is_link(negative):
        return
    extracted = _extract_prompt_from_conditioning(nodes_by_id, negative, branch="negative")
    if extracted:
        trace["neg_val"] = extracted



def _trace_guidance_from_conditioning(nodes_by_id: dict[str, dict[str, Any]], conditioning_link: Any) -> tuple[Any, str] | None:
    start_id = _walk_passthrough(nodes_by_id, conditioning_link)
    if not start_id:
        return None
    dist = _collect_upstream_nodes(nodes_by_id, start_id)
    for nid, _ in sorted(dist.items(), key=lambda x: x[1]):
        node = nodes_by_id.get(nid)
        if not isinstance(node, dict):
            continue
        ins = _inputs(node)
        for k in ("guidance", "cfg", "cfg_scale"):
            v = _scalar(ins.get(k))
            if v is not None:
                return v, f"{_node_type(node)}:{nid}"
    return None



def _trace_guidance_value(nodes_by_id: dict[str, dict[str, Any]], start_link: Any, max_hops: int = 15) -> tuple[float, str] | None:
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



def _apply_prompt_text_fallback(trace: dict[str, Any], sampler_node: dict[str, Any], sampler_id: str, ins: dict[str, Any]) -> None:
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



def _first_non_none_scalar(source: dict[str, Any], keys: tuple[str, ...]) -> Any | None:
    for key in keys:
        value = _scalar(source.get(key))
        if value is not None:
            return value
    return None



def _resolve_scalar_from_link(nodes_by_id: dict[str, dict[str, Any]], value: Any) -> Any | None:
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



