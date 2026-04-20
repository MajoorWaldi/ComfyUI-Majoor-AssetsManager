"""Payload assembly helpers extracted from parser.py."""

from __future__ import annotations

from typing import Any

from ...shared import Result
from .graph_converter import _inputs, _node_type, _pick_sink_inputs, _walk_passthrough
from .model_tracer import _collect_model_related_fields, _merge_models_payload
from .prompt_tracer import _extract_prompt_trace
from .sampler_tracer import _scalar


def _field(value: Any, confidence: str, source: str) -> dict[str, Any] | None:
    if value is None or value == "":
        return None
    return {"value": value, "confidence": confidence, "source": source}


def _field_name(name: Any, confidence: str, source: str) -> dict[str, Any] | None:
    if not name:
        return None
    return {"name": name, "confidence": confidence, "source": source}


def _field_size(width: Any, height: Any, confidence: str, source: str) -> dict[str, Any] | None:
    if width is None or height is None:
        return None
    return {"width": width, "height": height, "confidence": confidence, "source": source}


def _set_if_present(out: dict[str, Any], key: str, value: Any) -> None:
    if value:
        out[key] = value


def _apply_preferred_checkpoint_field(out: dict[str, Any], models: dict[str, Any]) -> None:
    if not models:
        return
    preferred = models.get("checkpoint") or models.get("unet") or models.get("diffusion")
    if preferred:
        out["checkpoint"] = preferred


def _apply_trace_prompt_fields(out: dict[str, Any], trace: dict[str, Any], confidence: str) -> None:
    if trace.get("pos_val"):
        out["positive"] = {"value": trace["pos_val"][0], "confidence": confidence, "source": trace["pos_val"][1]}
    if trace.get("neg_val"):
        out["negative"] = {"value": trace["neg_val"][0], "confidence": confidence, "source": trace["neg_val"][1]}


def _apply_lyrics_fields(out: dict[str, Any], nodes_by_id: dict[str, Any], sampler_source: str) -> None:
    from . import parser_impl as _p

    lyrics_text, lyrics_strength, lyrics_source = _p._extract_lyrics_from_prompt_nodes(nodes_by_id)
    if lyrics_text:
        out["lyrics"] = {"value": lyrics_text, "confidence": "high", "source": lyrics_source or sampler_source}
    if lyrics_strength is not None:
        lyric_field = _field(lyrics_strength, "high", lyrics_source or sampler_source)
        if lyric_field:
            out["lyrics_strength"] = lyric_field


def _apply_model_fields(out: dict[str, Any], model_related: dict[str, Any]) -> None:
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


def _apply_sampler_fields(out: dict[str, Any], sampler_values: dict[str, Any], confidence: str, sampler_source: str) -> None:
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


def _apply_optional_model_metrics(out: dict[str, Any], model_related: dict[str, Any]) -> None:
    if model_related.get("size"):
        out["size"] = model_related["size"]
    if model_related.get("clip_skip"):
        out["clip_skip"] = model_related["clip_skip"]


def _apply_input_files_field(out: dict[str, Any], nodes_by_id: dict[str, Any]) -> None:
    from . import parser_impl as _p

    input_files = _p._extract_input_files(nodes_by_id)
    if input_files:
        out["inputs"] = input_files


def _apply_multi_sink_prompt_fields(out: dict[str, Any], nodes_by_id: dict[str, Any], sinks: list[str]) -> None:
    if len(sinks) <= 1:
        return
    from . import parser_impl as _p

    all_pos, all_neg = _p._collect_all_prompts_from_sinks(nodes_by_id, sinks)
    if len(all_pos) > 1:
        out["all_positive_prompts"] = all_pos
    if len(all_neg) > 1:
        out["all_negative_prompts"] = all_neg


def _dedup_sinks_by_start(
    nodes_by_id: dict[str, Any], sinks: list[str]
) -> tuple[list[str], dict[str, str]]:
    deduped: list[str] = []
    seen_starts: set[str] = set()
    sink_starts: dict[str, str] = {}
    for sink_id in sinks:
        sink = nodes_by_id.get(sink_id)
        if not isinstance(sink, dict):
            continue
        sink_link = _pick_sink_inputs(sink)
        start = _walk_passthrough(nodes_by_id, sink_link) if sink_link else None
        key = start or f"sink:{sink_id}"
        if key in seen_starts:
            continue
        seen_starts.add(key)
        deduped.append(sink_id)
        if start:
            sink_starts[sink_id] = start
    return deduped, sink_starts


def _is_sink_upstream_of_another(
    nodes_by_id: dict[str, Any],
    sink_id: str,
    deduped: list[str],
    sink_starts: dict[str, str],
) -> bool:
    from . import parser_impl as _p

    start = sink_starts.get(sink_id)
    if not start:
        return False
    for other_sink in deduped:
        if other_sink == sink_id:
            continue
        other_start = sink_starts.get(other_sink)
        if not other_start:
            continue
        upstream = _p._collect_upstream_nodes(nodes_by_id, other_start, max_nodes=500, max_depth=80)
        if start in upstream:
            return True
    return False


def _prune_intermediate_sinks(
    nodes_by_id: dict[str, Any],
    deduped: list[str],
    sink_starts: dict[str, str],
) -> list[str]:
    keep = set(deduped)
    for sink_id in deduped:
        if _is_sink_upstream_of_another(nodes_by_id, sink_id, deduped, sink_starts):
            keep.discard(sink_id)
    return [sid for sid in deduped if sid in keep]


def _effective_sampler_sinks(nodes_by_id: dict[str, Any], sinks: list[str]) -> list[str]:
    if len(sinks) <= 1:
        return sinks

    deduped, sink_starts = _dedup_sinks_by_start(nodes_by_id, sinks)

    if len(deduped) <= 1:
        return deduped or sinks

    pruned = _prune_intermediate_sinks(nodes_by_id, deduped, sink_starts)
    return pruned or deduped or sinks


def _apply_multi_sink_sampler_fields(out: dict[str, Any], nodes_by_id: dict[str, Any], sinks: list[str]) -> None:
    from . import parser_impl as _p

    effective_sinks = _effective_sampler_sinks(nodes_by_id, sinks)

    if len(effective_sinks) > 1:
        # Multiple independent sinks (different outputs) → one sampler entry per sink
        all_samplers = _p._collect_all_samplers_from_sinks(nodes_by_id, effective_sinks)
        if len(all_samplers) > 1:
            out["all_samplers"] = all_samplers
    else:
        # Single sink — check for chained sampler passes (2-pass / hires-fix pattern)
        primary_sink = effective_sinks[0] if effective_sinks else (sinks[0] if sinks else None)
        chained_passes = _p._collect_chained_samplers_from_sink(nodes_by_id, primary_sink) if primary_sink else []
        if len(chained_passes) <= 1 and primary_sink:
            # Fallback for PIPE/context workflows that do not expose latent_image chains.
            chained_passes = _p._collect_sampler_pipeline_from_sink(nodes_by_id, primary_sink)
        if len(chained_passes) > 1:
            out["chained_passes"] = chained_passes
            # Keep legacy field for existing clients while new UI migrates to chained_passes.
            out["all_samplers"] = chained_passes


def _apply_multi_checkpoint_fields(out: dict[str, Any], nodes_by_id: dict[str, Any], sinks: list[str]) -> None:
    if not sinks:
        return

    from .pipeline_extractor import _collect_all_checkpoints_from_chained_samplers

    all_collected = []
    seen_names = set()

    for sink_id in sinks:
        collected = _collect_all_checkpoints_from_chained_samplers(nodes_by_id, sink_id)
        for ckpt in collected:
            name = ckpt.get("name")
            if name and name not in seen_names:
                seen_names.add(name)
                all_collected.append(ckpt)

    if len(all_collected) > 1:
        def get_id(c):
            source = c.get("source", "")
            return int(source.split(":")[-1]) if ":" in source else 999

        all_collected.sort(key=get_id)

        out["all_checkpoints"] = all_collected
        out["checkpoint"] = all_collected[0]


def _build_geninfo_payload(
    nodes_by_id: dict[str, Any],
    sinks: list[str],
    sink_id: str,
    sampler_id: str,
    sampler_mode: str,
    sampler_source: str,
    confidence: str,
    workflow_meta: dict[str, Any] | None,
    trace: dict[str, Any],
    sampler_values: dict[str, Any],
    model_related: dict[str, Any],
) -> dict[str, Any]:
    from . import parser_impl as _p

    wf_type = _p._determine_workflow_type(nodes_by_id, sink_id, sampler_id)
    out: dict[str, Any] = {
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
    _apply_multi_sink_sampler_fields(out, nodes_by_id, sinks)
    _apply_multi_checkpoint_fields(out, nodes_by_id, sinks)
    return out


def _source_from_items(items: list[tuple[str, str]]) -> tuple[str, str] | None:
    if not items:
        return None
    text = "\n".join([t for t, _ in items]).strip()
    if not text:
        return None
    sources = [s for _, s in items]
    source = sources[0] if len(set(sources)) <= 1 else f"{sources[0]} (+{len(sources)-1})"
    return text, source


def _geninfo_metadata_only_result(workflow_meta: dict[str, Any] | None) -> Result[dict[str, Any] | None]:
    if workflow_meta:
        return Result.Ok({"metadata": workflow_meta})
    return Result.Ok(None)


def _build_no_sampler_result(nodes_by_id: dict[str, Any], workflow_meta: dict[str, Any] | None) -> Result:
    from . import parser_impl as _p
    from .api_node_extractor import _extract_api_node_geninfo_fallback
    from .tts_extractor import _extract_tts_geninfo_fallback
    from .upscaler_extractor import _extract_upscaler_geninfo_fallback

    api_fallback = _extract_api_node_geninfo_fallback(nodes_by_id, workflow_meta)
    if api_fallback:
        return Result.Ok(api_fallback)

    tts_fallback = _extract_tts_geninfo_fallback(nodes_by_id, workflow_meta)
    if tts_fallback:
        return Result.Ok(tts_fallback)

    upscaler_fallback = _extract_upscaler_geninfo_fallback(nodes_by_id, workflow_meta)
    if upscaler_fallback:
        return Result.Ok(upscaler_fallback)
    out_fallback: dict[str, Any] = {}
    if workflow_meta:
        out_fallback["metadata"] = workflow_meta
    input_files = _p._extract_input_files(nodes_by_id)
    if input_files:
        out_fallback["inputs"] = input_files
    if out_fallback:
        return Result.Ok(out_fallback)
    return Result.Ok(None)


def _find_sampler_in_sinks(
    nodes_by_id: dict[str, Any], sinks: list[str]
) -> tuple[str, str, str, str] | None:
    from . import parser_impl as _p

    for candidate in sinks:
        sampler_id, sampler_conf, sampler_mode = _p._select_sampler_context(nodes_by_id, candidate)
        if sampler_id:
            return candidate, sampler_id, sampler_conf, sampler_mode
    return None


def _build_pipeline_passes_result(
    nodes_by_id: dict[str, Any],
    sink_id: str,
    sinks: list[str],
    workflow_meta: dict[str, Any] | None,
) -> Result | None:
    from . import parser_impl as _p

    pipeline_passes = _p._collect_sampler_pipeline_from_sink(nodes_by_id, sink_id)
    if len(pipeline_passes) <= 1:
        return None
    out_fallback: dict[str, Any] = {
        "engine": {
            "parser_version": "geninfo-v1",
            "sink": str(_node_type(nodes_by_id.get(sink_id, {}))),
            "sampler_mode": "fallback",
            "type": _p._determine_workflow_type(nodes_by_id, sink_id, ""),
        },
        "chained_passes": pipeline_passes,
        "all_samplers": pipeline_passes,
    }
    if workflow_meta:
        out_fallback["metadata"] = workflow_meta
    _apply_multi_checkpoint_fields(out_fallback, nodes_by_id, sinks)
    _apply_input_files_field(out_fallback, nodes_by_id)
    return Result.Ok(out_fallback)


def _trace_size(nodes_by_id: dict[str, dict[str, Any]], latent_link: Any, confidence: str) -> dict[str, Any] | None:
    from . import parser_impl as _p

    current_link = latent_link
    hops = 0
    while current_link is not None and hops < _p.DEFAULT_MAX_TRACE_HOPS:
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


def _size_field_from_node(node: dict[str, Any], node_id: str, node_type: str, ins: dict[str, Any], confidence: str) -> dict[str, Any] | None:
    width = _scalar(ins.get("width"))
    height = _scalar(ins.get("height"))
    if "emptylatentimage" in node_type:
        return _field_size(width, height, confidence, f"{_node_type(node)}:{node_id}")
    if width is None or height is None:
        return None
    return _field_size(width, height, confidence, f"{_node_type(node)}:{node_id}")


def _next_latent_link(ins: dict[str, Any]) -> Any | None:
    for key in ("samples", "latent", "latent_image", "image"):
        value = ins.get(key)
        if isinstance(value, (list, tuple)) and len(value) == 2:
            return value
    return None


def _extract_geninfo(nodes_by_id: dict[str, Any], sinks: list[str], workflow_meta: dict | None) -> Result:
    sink_id = sinks[0]
    sampler_context = _resolve_sampler_context_for_geninfo(nodes_by_id, sink_id, sinks)
    if sampler_context is None:
        pipeline_result = _build_pipeline_passes_result(nodes_by_id, sink_id, sinks, workflow_meta)
        if pipeline_result is not None:
            return pipeline_result
        return _build_no_sampler_result(nodes_by_id, workflow_meta)

    sampler_id, sampler_conf, sampler_mode = sampler_context
    return _build_sampler_geninfo_result(
        nodes_by_id,
        sinks,
        sink_id,
        sampler_id,
        sampler_conf,
        sampler_mode,
        workflow_meta,
    )


def _resolve_sampler_context_for_geninfo(
    nodes_by_id: dict[str, Any],
    sink_id: str,
    sinks: list[str],
) -> tuple[str, str, str] | None:
    from . import parser_impl as _p

    sampler_id, sampler_conf, sampler_mode = _p._select_sampler_context(nodes_by_id, sink_id)
    if sampler_id or len(sinks) <= 1:
        return (sampler_id, sampler_conf, sampler_mode) if sampler_id else None
    found = _find_sampler_in_sinks(nodes_by_id, sinks[1:])
    if found:
        return found[1], found[2], found[3]
    return None


def _build_sampler_geninfo_result(
    nodes_by_id: dict[str, Any],
    sinks: list[str],
    sink_id: str,
    sampler_id: str,
    sampler_conf: str,
    sampler_mode: str,
    workflow_meta: dict[str, Any] | None,
) -> Result:
    from . import parser_impl as _p

    sink = nodes_by_id.get(sink_id) or {}
    sink_link = _pick_sink_inputs(sink)
    sink_start_id = _walk_passthrough(nodes_by_id, sink_link) if sink_link else None

    sampler_node = nodes_by_id.get(sampler_id) or {}
    if not isinstance(sampler_node, dict):
        return _build_no_sampler_result(nodes_by_id, workflow_meta)

    confidence = sampler_conf if sampler_conf != "none" else "low"
    ins = _inputs(sampler_node)
    sampler_source = f"{_node_type(sampler_node)}:{sampler_id}"
    advanced = _p._is_advanced_sampler(sampler_node)

    trace = _extract_prompt_trace(nodes_by_id, sampler_node, sampler_id, ins, advanced)
    sampler_values = _p._extract_sampler_values(nodes_by_id, sampler_node, sampler_id, ins, advanced, confidence, trace)
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
    return _finalize_geninfo_payload(out, workflow_meta)


def _finalize_geninfo_payload(out: dict[str, Any], workflow_meta: dict[str, Any] | None) -> Result:
    if len(out.keys()) <= 1:
        return Result.Ok({"metadata": workflow_meta}) if workflow_meta else Result.Ok(None)
    return Result.Ok(out)
