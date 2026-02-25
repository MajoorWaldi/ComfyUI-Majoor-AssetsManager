"""Sampler tracing helpers extracted from parser.py."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from .graph_converter import (
    _collect_upstream_nodes,
    _inputs,
    _is_link,
    _lower,
    _node_type,
    _pick_sink_inputs,
    _resolve_link,
    _walk_passthrough,
)


def _scalar(value: Any) -> Any | None:
    if value is None:
        return None
    if isinstance(value, (int, float, str)):
        return value
    return None


def _is_sampler(node: dict[str, Any]) -> bool:
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


def _has_core_sampler_signature(node: dict[str, Any]) -> bool:
    try:
        ins = _inputs(node)
    except Exception:
        return False
    has_steps = ins.get("steps") is not None
    has_cfg = any(ins.get(key) is not None for key in ("cfg", "cfg_scale", "guidance"))
    has_seed = any(ins.get(key) is not None for key in ("seed", "noise_seed"))
    return has_steps and has_cfg and has_seed


def _is_custom_sampler(node: dict[str, Any], ct: str) -> bool:
    if "sampler" not in ct or "select" in ct or "ksamplerselect" in ct:
        return False
    try:
        ins = _inputs(node)
    except Exception:
        return False
    if _is_link(ins.get("model")):
        return True
    if any(ins.get(k) is not None for k in ("steps", "cfg", "cfg_scale", "seed", "scheduler", "denoise")):
        return True
    return _is_link(ins.get("text_embeds")) or _is_link(ins.get("hyvid_embeds"))


def _is_advanced_sampler(node: dict[str, Any]) -> bool:
    ct = _lower(_node_type(node))
    if not ct:
        return False
    if "samplercustom" in ct:
        return True
    try:
        ins = _inputs(node)
        if _is_link(ins.get("guider")) and _is_link(ins.get("sigmas")):
            return True
        if _is_link(ins.get("guider")) and _is_link(ins.get("sampler")):
            return True
        keys = ("noise", "guider", "sampler", "sigmas")
        return all(_is_link(ins.get(k)) for k in keys)
    except Exception:
        return False


def _select_primary_sampler(nodes_by_id: dict[str, dict[str, Any]], sink_node_id: str) -> tuple[str | None, str]:
    return _select_sampler_from_sink(nodes_by_id, sink_node_id, _is_sampler)


def _select_advanced_sampler(nodes_by_id: dict[str, dict[str, Any]], sink_node_id: str) -> tuple[str | None, str]:
    return _select_sampler_from_sink(nodes_by_id, sink_node_id, _is_advanced_sampler)


def _select_sampler_from_sink(nodes_by_id: dict[str, dict[str, Any]], sink_node_id: str, selector: Callable[[dict[str, Any]], bool]) -> tuple[str | None, str]:
    start_src = _sink_start_source(nodes_by_id, sink_node_id)
    if not start_src:
        return None, "none"
    candidates = _upstream_sampler_candidates(nodes_by_id, start_src, selector)
    return _best_candidate(candidates)


def _sink_start_source(nodes_by_id: dict[str, dict[str, Any]], sink_node_id: str) -> str | None:
    sink = nodes_by_id.get(sink_node_id)
    if not isinstance(sink, dict):
        return None
    start_link = _pick_sink_inputs(sink)
    return _walk_passthrough(nodes_by_id, start_link) if start_link else None


def _upstream_sampler_candidates(nodes_by_id: dict[str, dict[str, Any]], start_src: str, selector: Callable[[dict[str, Any]], bool]) -> list[tuple[str, int]]:
    dist = _collect_upstream_nodes(nodes_by_id, start_src)
    out: list[tuple[str, int]] = []
    for nid, depth in dist.items():
        node = nodes_by_id.get(nid)
        if isinstance(node, dict) and selector(node):
            out.append((nid, depth))
    return out


def _best_candidate(candidates: list[tuple[str, int]]) -> tuple[str | None, str]:
    if not candidates:
        return None, "none"
    candidates.sort(key=lambda item: item[1])
    best_depth = candidates[0][1]
    best = [nid for nid, depth in candidates if depth == best_depth]
    if len(best) == 1:
        return best[0], "high"
    return best[0], "medium"


def _select_any_sampler(nodes_by_id: dict[str, dict[str, Any]]) -> tuple[str | None, str]:
    candidates = _global_sampler_candidates(nodes_by_id)
    if not candidates:
        return None, "none"
    candidates.sort()
    return candidates[0][2], "low"


def _global_sampler_candidates(nodes_by_id: dict[str, dict[str, Any]]) -> list[tuple[int, int, str]]:
    candidates: list[tuple[int, int, str]] = []
    for nid, node in nodes_by_id.items():
        if not isinstance(node, dict) or not _is_sampler(node):
            continue
        score = _sampler_candidate_score(_inputs(node))
        candidates.append((-score, _stable_numeric_node_id(nid), nid))
    return candidates


def _sampler_candidate_score(ins: dict[str, Any]) -> int:
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


def _trace_sampler_name(nodes_by_id: dict[str, dict[str, Any]], link: Any) -> tuple[str, str] | None:
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


def _trace_noise_seed(nodes_by_id: dict[str, dict[str, Any]], link: Any) -> tuple[Any, str] | None:
    src_id = _walk_passthrough(nodes_by_id, link)
    if not src_id:
        return None
    node = nodes_by_id.get(src_id)
    if not isinstance(node, dict):
        return None
    ins = _inputs(node)
    for key in ("noise_seed", "seed", "value", "int", "number"):
        value = _scalar(ins.get(key))
        if value is not None:
            return value, f"{_node_type(node)}:{src_id}"
    return None


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


def _steps_from_manual_sigmas(ins: dict[str, Any]) -> tuple[Any | None, str | None]:
    numeric = _count_numeric_sigma_values(ins.get("sigmas"))
    if numeric >= 2:
        return max(1, numeric - 1), "low"
    return None, None


def _trace_scheduler_sigmas(nodes_by_id: dict[str, dict[str, Any]], link: Any) -> tuple[Any | None, Any | None, Any | None, Any | None, tuple[str, str] | None, str | None]:
    src_id = _walk_passthrough(nodes_by_id, link)
    if not src_id:
        return (None, None, None, None, None, None)
    node = nodes_by_id.get(src_id)
    if not isinstance(node, dict):
        return (None, None, None, None, None, None)
    ins = _inputs(node)
    steps = _scalar(ins.get("steps"))
    steps_confidence: str | None = "high" if steps is not None else None
    if steps is None:
        steps, steps_confidence = _steps_from_manual_sigmas(ins)
    scheduler = _scalar(ins.get("scheduler"))
    denoise = _scalar(ins.get("denoise"))
    model_link = ins.get("model") if _is_link(ins.get("model")) else None
    src = f"{_node_type(node)}:{src_id}"
    return (steps, scheduler, denoise, model_link, (src_id, src), steps_confidence)


def _extract_ksampler_widget_params(node: dict[str, Any]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    if not isinstance(node, dict):
        return out
    ct = _lower(_node_type(node))
    if "ksampler" not in ct:
        return out
    widgets = node.get("widgets_values")
    if not isinstance(widgets, list):
        return out
    return _ksampler_values_from_widgets(widgets)


def _ksampler_values_from_widgets(widgets: list[Any]) -> dict[str, Any]:
    index_map = {
        "seed": 0,
        "steps": 2,
        "cfg": 3,
        "sampler_name": 4,
        "scheduler": 5,
        "denoise": 6,
    }
    out: dict[str, Any] = {}
    for field, idx in index_map.items():
        value = _widget_value_at(widgets, idx)
        if value is not None:
            out[field] = value
    return out


def _widget_value_at(widgets: list[Any], index: int) -> Any | None:
    if index < 0 or index >= len(widgets):
        return None
    return widgets[index]


def _resolve_sink_sampler_node(nodes_by_id: dict[str, Any], sink_id: str) -> dict[str, Any] | None:
    sampler_id, _ = _select_primary_sampler(nodes_by_id, sink_id)
    if not sampler_id:
        sampler_id, _ = _select_advanced_sampler(nodes_by_id, sink_id)
    if not sampler_id:
        return None
    sampler_node = nodes_by_id.get(sampler_id)
    return sampler_node if isinstance(sampler_node, dict) else None


def _find_special_sampler_id(nodes_by_id: dict[str, Any]) -> str | None:
    for nid, node in nodes_by_id.items():
        ct = _lower(_node_type(node))
        if "marigold" in ct:
            return str(nid)
        if "instruction" in ct and "qwen" in ct:
            return str(nid)
    return None


def _select_sampler_context(nodes_by_id: dict[str, Any], sink_id: str) -> tuple[str | None, str, str]:
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
