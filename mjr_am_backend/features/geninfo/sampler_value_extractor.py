"""Sampler value assembly helpers extracted from parser_impl."""

from __future__ import annotations

from typing import Any

from .graph_converter import _inputs, _is_link, _lower, _node_type
from .prompt_tracer import _resolve_scalar_from_link, _trace_guidance_from_conditioning
from .sampler_tracer import (
    _extract_ksampler_widget_params,
    _scalar,
    _trace_noise_seed,
    _trace_sampler_name,
    _trace_scheduler_sigmas,
)


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
    for key in ("seed", "noise_seed"):
        link_or_val = ins.get(key)
        seed_val = _scalar(link_or_val)
        if seed_val is not None:
            if key == "noise_seed" and seed_val == 0 and ins.get("add_noise") is False:
                continue
            return seed_val
        if _is_link(link_or_val):
            return _resolve_scalar_from_link(nodes_by_id, link_or_val)
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
    if values.get("seed_val") is not None:
        return
    for seed_key in ("noise", "noise_seed"):
        link_or_val = ins.get(seed_key)
        if _is_link(link_or_val):
            traced_seed = _trace_noise_seed(nodes_by_id, link_or_val)
            if traced_seed:
                values["seed_val"] = traced_seed[0]
                field_sources["seed"] = traced_seed[1]
                return
    if ins.get("add_noise") is False:
        latent_link = ins.get("latent_image")
        if _is_link(latent_link):
            parent_id = str(latent_link[0]) if isinstance(latent_link, list) else None
            if parent_id:
                parent_node = nodes_by_id.get(parent_id)
                if isinstance(parent_node, dict):
                    _apply_advanced_noise_seed(nodes_by_id, _inputs(parent_node), values, field_sources)


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
