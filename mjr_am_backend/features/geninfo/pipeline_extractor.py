"""Pipeline sampler pass extraction helpers extracted from parser_impl."""

from __future__ import annotations

import json
from typing import Any

from .graph_converter import (
    _collect_upstream_nodes,
    _inputs,
    _is_link,
    _lower,
    _node_type,
    _pick_sink_inputs,
    _walk_passthrough,
)
from .prompt_tracer import _extract_prompt_trace
from .sampler_tracer import _is_advanced_sampler, _is_sampler, _select_sampler_context
from .sampler_widget_extractor import (
    _apply_proxy_widget_sampler_values,
    _looks_like_pipeline_pass_node,
    _node_has_detailer_signals,
)

_SAMPLER_FIELD_SPECS: list[tuple[str, type[int] | type[float] | type[str]]] = [
    ("sampler_name", str),
    ("scheduler", str),
    ("steps", int),
    ("cfg", float),
    ("denoise", float),
    ("seed_val", int),
]


def _cast_sampler_fields(sampler_values: dict[str, Any], target: dict[str, Any]) -> None:
    """Copy and type-cast known sampler fields from *sampler_values* into *target*."""
    for key, caster in _SAMPLER_FIELD_SPECS:
        val = sampler_values.get(key)
        if val is None:
            continue
        try:
            target[key] = caster(val)  # type: ignore[operator]
        except Exception:
            pass


def _classify_pipeline_pass_name(
    index: int,
    total: int,
    *,
    is_detailer: bool,
    hint: str,
    denoise: float | None,
) -> str:
    if is_detailer or "facedetailer" in hint or "detailer" in hint:
        return "Detailer"
    if index == 0:
        return "Base"
    if denoise is not None or total > 1:
        return "Refine / Upscale"
    return f"Pass {index + 1}"


_INTERNAL_PASS_KEYS = ("_node_id", "_node_type", "_title", "_is_detailer", "_keep_when_sparse", "_add_noise")


def _assign_pass_name(sampler_pass: dict[str, Any], index: int, total: int) -> None:
    denoise_value = _coerce_float(sampler_pass.get("denoise"))
    hint = _lower(f"{sampler_pass.get('_node_type') or ''} {sampler_pass.get('_title') or ''}")
    sampler_pass["pass_name"] = _classify_pipeline_pass_name(
        index,
        total,
        is_detailer=sampler_pass.get("_is_detailer") is True,
        hint=hint,
        denoise=denoise_value,
    )


def _propagate_missing_seed_steps(
    sampler_pass: dict[str, Any],
    index: int,
    previous_seed: int | None,
    previous_steps: int | None,
) -> tuple[int | None, int | None]:
    if sampler_pass.get("seed_val") is None and sampler_pass.get("_add_noise") is False and previous_seed is not None:
        sampler_pass["seed_val"] = previous_seed
    if sampler_pass.get("steps") is None and index > 0 and previous_steps is not None:
        sampler_pass["steps"] = previous_steps
    new_seed = _coerce_int(sampler_pass.get("seed_val"), previous_seed)
    new_steps = _coerce_int(sampler_pass.get("steps"), previous_steps)
    return new_seed, new_steps


def _finalize_pipeline_passes(passes: list[dict[str, Any]]) -> None:
    previous_seed: int | None = None
    previous_steps: int | None = None
    for index, sampler_pass in enumerate(passes):
        _assign_pass_name(sampler_pass, index, len(passes))
        previous_seed, previous_steps = _propagate_missing_seed_steps(
            sampler_pass, index, previous_seed, previous_steps
        )
        for key in _INTERNAL_PASS_KEYS:
            sampler_pass.pop(key, None)


def _coerce_float(value: Any) -> float | None:
    try:
        return None if value is None else float(value)
    except Exception:
        return None


def _coerce_int(value: Any, default: int | None = None) -> int | None:
    try:
        return default if value is None else int(value)
    except Exception:
        return default


def _pipeline_pass_identity(export_sampler: dict[str, Any]) -> str:
    dedupe_sampler = {k: v for k, v in export_sampler.items() if not k.startswith("_")}
    identity = {
        "fields": dedupe_sampler,
        "node_id": str(export_sampler.get("_node_id") or ""),
        "node_type": str(export_sampler.get("_node_type") or ""),
        "title": str(export_sampler.get("_title") or ""),
        "is_detailer": export_sampler.get("_is_detailer") is True,
    }
    return json.dumps(identity, sort_keys=True)


def _pipeline_sampler_sort_key(
    nodes_by_id: dict[str, Any],
    candidates: list[tuple[int, int, str]],
    item: tuple[int, int, str],
) -> tuple[int, int, int]:
    depth, stable, nid = item
    upstream = _collect_upstream_nodes(nodes_by_id, nid, max_nodes=300, max_depth=120)
    ancestor_count = sum(1 for _, _, other_id in candidates if other_id != nid and other_id in upstream)
    return (ancestor_count, -depth, stable)


def _build_pipeline_pass_entry(nodes_by_id: dict[str, Any], sampler_id: str) -> dict[str, Any] | None:
    from . import parser_impl as _p

    sampler_node = nodes_by_id.get(sampler_id)
    if not isinstance(sampler_node, dict):
        return None
    ins = _inputs(sampler_node)
    advanced = _is_advanced_sampler(sampler_node)
    trace = _extract_prompt_trace(nodes_by_id, sampler_node, sampler_id, ins, advanced)
    sampler_values = _p._extract_sampler_values(nodes_by_id, sampler_node, sampler_id, ins, advanced, "medium", trace)
    _apply_proxy_widget_sampler_values(sampler_values, sampler_node)
    stage_hint = _lower(f"{_node_type(sampler_node) or ''} {sampler_node.get('title') or ''}")
    entry: dict[str, Any] = {
        "_node_id": str(sampler_id),
        "_node_type": str(_node_type(sampler_node) or ""),
        "_title": str(sampler_node.get("title") or ""),
        "_is_detailer": _node_has_detailer_signals(sampler_node),
        "_keep_when_sparse": ("sampler" in stage_hint) or _node_has_detailer_signals(sampler_node),
        "_add_noise": ins.get("add_noise"),
    }
    _cast_sampler_fields(sampler_values, entry)
    return entry


def _collect_all_samplers_from_sinks(
    nodes_by_id: dict[str, Any],
    sinks: list[str],
    max_sinks: int = 20,
) -> list[dict[str, Any]]:
    from . import parser_impl as _p

    all_samplers: list[dict[str, Any]] = []
    seen_hashes: set[str] = set()

    for sink_id in sinks[:max_sinks]:
        try:
            sampler_id, sampler_conf, _ = _select_sampler_context(nodes_by_id, sink_id)
            if not sampler_id:
                continue

            sampler_node = nodes_by_id.get(sampler_id)
            if not isinstance(sampler_node, dict):
                continue

            ins = _inputs(sampler_node)
            advanced = _is_advanced_sampler(sampler_node)
            trace = _extract_prompt_trace(nodes_by_id, sampler_node, sampler_id, ins, advanced)
            confidence = sampler_conf if sampler_conf != "none" else "low"
            sampler_values = _p._extract_sampler_values(nodes_by_id, sampler_node, sampler_id, ins, advanced, confidence, trace)

            export_sampler: dict[str, Any] = {
                "_node_id": str(sampler_id),
                "_node_type": str(_node_type(sampler_node) or ""),
                "_title": str(sampler_node.get("title") or ""),
                "_is_detailer": _node_has_detailer_signals(sampler_node),
            }
            _cast_sampler_fields(sampler_values, export_sampler)
            val_str = _pipeline_pass_identity(export_sampler)
            if val_str not in seen_hashes:
                seen_hashes.add(val_str)
                all_samplers.append(export_sampler)
        except Exception:
            continue

    return all_samplers


def _collect_chained_samplers_from_sink(
    nodes_by_id: dict[str, Any],
    sink_id: str,
    max_depth: int = 10,
) -> list[dict[str, Any]]:
    sampler_id, sampler_conf, _ = _select_sampler_context(nodes_by_id, sink_id)
    if not sampler_id:
        return []

    collected = _walk_advanced_sampler_chain(nodes_by_id, sampler_id, sampler_conf, max_depth)
    ordered = list(reversed(collected))
    _label_chained_passes(ordered)
    return ordered


def _walk_advanced_sampler_chain(
    nodes_by_id: dict[str, Any],
    start_id: str,
    sampler_conf: str,
    max_depth: int,
) -> list[dict[str, Any]]:
    collected: list[dict[str, Any]] = []
    seen_ids: set[str] = set()
    seen_hashes: set[str] = set()
    current_id: str | None = start_id
    depth = 0

    while current_id and depth < max_depth:
        next_id = _advance_advanced_sampler_chain_step(
            nodes_by_id,
            current_id,
            sampler_conf,
            depth + 1,
            seen_ids,
            seen_hashes,
            collected,
        )
        if not next_id:
            break
        current_id = next_id
        depth += 1

    return collected


def _advance_advanced_sampler_chain_step(
    nodes_by_id: dict[str, Any],
    current_id: str,
    sampler_conf: str,
    depth: int,
    seen_ids: set[str],
    seen_hashes: set[str],
    collected: list[dict[str, Any]],
) -> str | None:
    from . import parser_impl as _p

    if current_id in seen_ids:
        return None
    seen_ids.add(current_id)

    sampler_node = nodes_by_id.get(current_id)
    if not isinstance(sampler_node, dict) or not _is_advanced_sampler(sampler_node):
        return None

    ins = _inputs(sampler_node)
    trace = _extract_prompt_trace(nodes_by_id, sampler_node, current_id, ins, True)
    confidence = sampler_conf if depth == 1 else "medium"
    sampler_values = _p._extract_sampler_values(nodes_by_id, sampler_node, current_id, ins, True, confidence, trace)

    entry: dict[str, Any] = {
        "_node_id": str(current_id),
        "_node_type": str(_node_type(sampler_node) or ""),
        "_title": str(sampler_node.get("title") or ""),
        "_is_detailer": _node_has_detailer_signals(sampler_node),
    }
    _cast_sampler_fields(sampler_values, entry)

    val_str = _pipeline_pass_identity(entry)
    if val_str not in seen_hashes:
        seen_hashes.add(val_str)
        collected.append(entry)

    latent_link = ins.get("latent_image")
    if not _is_link(latent_link):
        return None
    next_id = str(latent_link[0])
    next_node = nodes_by_id.get(next_id)
    if not isinstance(next_node, dict) or not _is_advanced_sampler(next_node):
        return None
    return next_id


def _label_chained_passes(ordered: list[dict[str, Any]]) -> None:
    for index, sampler_pass in enumerate(ordered):
        pass_name = _classify_pipeline_pass_name(
            index,
            len(ordered),
            is_detailer=False,
            hint=_lower(str(sampler_pass.get("_node_type") or "")),
            denoise=_coerce_float(sampler_pass.get("denoise")),
        )
        if pass_name:
            sampler_pass["pass_name"] = pass_name
        sampler_pass.pop("_node_type", None)


def _collect_pipeline_sampler_ids(nodes_by_id: dict[str, Any], dist: dict[str, int]) -> list[tuple[int, int, str]]:
    sampler_ids: list[tuple[int, int, str]] = []
    for nid, depth in dist.items():
        node = nodes_by_id.get(nid)
        if not isinstance(node, dict):
            continue
        if not (_is_sampler(node) or _looks_like_pipeline_pass_node(node)):
            continue
        try:
            stable = int(nid)
        except Exception:
            stable = 10**9
        sampler_ids.append((depth, stable, nid))
    candidates = list(sampler_ids)
    sampler_ids.sort(key=lambda item: _pipeline_sampler_sort_key(nodes_by_id, candidates, item))
    return sampler_ids


def _deduplicate_pipeline_passes(
    nodes_by_id: dict[str, Any],
    sampler_ids: list[tuple[int, int, str]],
) -> list[dict[str, Any]]:
    passes: list[dict[str, Any]] = []
    seen_hashes: set[str] = set()
    for _, _, sampler_id in sampler_ids:
        export_sampler = _build_pipeline_pass_entry(nodes_by_id, sampler_id)
        if _should_keep_pipeline_pass(export_sampler, seen_hashes) and export_sampler is not None:
            passes.append(export_sampler)
    return passes


def _should_keep_pipeline_pass(
    export_sampler: dict[str, Any] | None,
    seen_hashes: set[str],
) -> bool:
    if export_sampler is None:
        return False
    dedupe_sampler = {k: v for k, v in export_sampler.items() if not k.startswith("_")}
    if not dedupe_sampler and export_sampler.get("_keep_when_sparse") is not True:
        return False
    val_str = _pipeline_pass_identity(export_sampler)
    if val_str in seen_hashes:
        return False
    seen_hashes.add(val_str)
    return True


def _collect_sampler_pipeline_from_sink(
    nodes_by_id: dict[str, Any],
    sink_id: str,
    max_nodes: int = 120,
) -> list[dict[str, Any]]:
    sink = nodes_by_id.get(sink_id)
    if not isinstance(sink, dict):
        return []

    sink_start_id = _resolve_pipeline_start(nodes_by_id, sink)
    if not sink_start_id:
        return []
    dist = _collect_upstream_nodes(nodes_by_id, sink_start_id, max_nodes=max_nodes)
    if not dist:
        return []
    detailer_present_in_branch = _branch_has_detailer(nodes_by_id, dist)
    sampler_ids = _collect_pipeline_sampler_ids(nodes_by_id, dist)
    passes = _deduplicate_pipeline_passes(nodes_by_id, sampler_ids)
    _finalize_pipeline_passes(passes)

    if detailer_present_in_branch and passes and not any(p.get("pass_name") == "Detailer" for p in passes):
        passes[-1]["pass_name"] = "Detailer"

    return passes


def _resolve_pipeline_start(nodes_by_id: dict[str, Any], sink: dict[str, Any]) -> str | None:
    sink_link = _pick_sink_inputs(sink)
    if not sink_link:
        return None
    return _walk_passthrough(nodes_by_id, sink_link)


def _branch_has_detailer(nodes_by_id: dict[str, Any], dist: dict[str, int]) -> bool:
    return any(
        isinstance(nodes_by_id.get(nid), dict) and _node_has_detailer_signals(nodes_by_id[nid])
        for nid in dist
    )


def _find_checkpoint_for_sampler(nodes_by_id: dict[str, Any], sampler_node: dict[str, Any]) -> dict[str, Any] | None:
    from .model_tracer import _clean_model_id, _is_checkpoint_loader_node

    model_link = _inputs(sampler_node).get("model")
    seen: set[str] = set()
    while _is_link(model_link):
        src_id = str(model_link[0])
        if src_id in seen:
            break
        seen.add(src_id)
        node = nodes_by_id.get(src_id)
        if not isinstance(node, dict):
            break
        ct = _lower(_node_type(node))
        nins = _inputs(node)
        if _is_checkpoint_loader_node(ct, nins):
            name = _clean_model_id(nins.get("ckpt_name") or nins.get("model_name"))
            if name:
                return {"name": name, "source": f"{_node_type(node)}:{src_id}"}
            break
        model_link = nins.get("model")
    return None


def _collect_all_checkpoints_from_chained_samplers(
    nodes_by_id: dict[str, Any],
    sink_id: str,
    max_depth: int = 10,
) -> list[dict[str, Any]]:
    sampler_id, _, _ = _select_sampler_context(nodes_by_id, sink_id)
    if not sampler_id:
        return []

    collected = _collect_checkpoint_chain(nodes_by_id, sampler_id, max_depth=max_depth)
    return list(reversed(collected))


def _collect_checkpoint_chain(
    nodes_by_id: dict[str, Any],
    start_id: str,
    *,
    max_depth: int,
) -> list[dict[str, Any]]:
    collected: list[dict[str, Any]] = []
    seen_names: set[str] = set()
    seen_ids: set[str] = set()
    current_id: str | None = start_id
    depth = 0

    while current_id and depth < max_depth:
        next_id = _advance_checkpoint_chain_step(
            nodes_by_id,
            current_id,
            seen_ids,
            seen_names,
            collected,
        )
        if not next_id:
            break
        current_id = next_id
        depth += 1

    return collected


def _advance_checkpoint_chain_step(
    nodes_by_id: dict[str, Any],
    current_id: str,
    seen_ids: set[str],
    seen_names: set[str],
    collected: list[dict[str, Any]],
) -> str | None:
    if current_id in seen_ids:
        return None
    seen_ids.add(current_id)

    node = nodes_by_id.get(current_id)
    if not isinstance(node, dict):
        return None

    ckpt = _find_checkpoint_for_sampler(nodes_by_id, node)
    if ckpt and ckpt["name"] not in seen_names:
        seen_names.add(ckpt["name"])
        collected.append(ckpt)

    ins = _inputs(node)
    latent_link = ins.get("latent_image")
    if not _is_link(latent_link):
        return None
    next_id = str(latent_link[0])
    next_node = nodes_by_id.get(next_id)
    if not isinstance(next_node, dict) or not _is_advanced_sampler(next_node):
        return None
    return next_id
