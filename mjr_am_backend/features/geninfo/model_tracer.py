"""Model and LoRA tracing helpers extracted from parser.py."""

from __future__ import annotations

from collections import deque
from collections.abc import Callable
from typing import Any

from ...shared import Result, get_logger
from .graph_converter import _inputs, _is_link, _lower, _node_type, _resolve_link, _walk_passthrough, _collect_upstream_nodes
from .sampler_tracer import _scalar
from .parser_impl import (
    _clean_model_id,
    _collect_text_encoder_nodes_from_conditioning,
    _field,
    _first_model_string_from_inputs,
    _trace_size,
)

logger = get_logger(__name__)

def _is_lora_loader_node(ct: str, ins: dict[str, Any]) -> bool:
    return ("lora" in ct) or (ins.get("lora_name") is not None and _is_link(ins.get("model")))



def _append_lora_entries(
    node: dict[str, Any],
    node_id: str,
    ins: dict[str, Any],
    confidence: str,
    loras: list[dict[str, Any]],
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
    node: dict[str, Any],
    node_id: str,
    key: Any,
    value: Any,
    confidence: str,
) -> dict[str, Any] | None:
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



def _is_enabled_lora_value(value: dict[str, Any]) -> bool:
    return value.get("on") is not False



def _nested_lora_name(value: dict[str, Any]) -> str | None:
    return _clean_model_id(value.get("lora") or value.get("lora_name") or value.get("name"))



def _nested_lora_strength(value: dict[str, Any]) -> Any:
    return value.get("strength") or value.get("strength_model") or value.get("weight") or value.get("lora_strength")



def _build_lora_payload_from_inputs(
    *,
    node: dict[str, Any],
    node_id: str,
    ins: dict[str, Any],
    confidence: str,
) -> dict[str, Any] | None:
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



def _is_checkpoint_loader_node(ct: str, ins: dict[str, Any]) -> bool:
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



def _chain_result(next_link: Any | None, should_stop: bool) -> tuple[Any | None, bool]:
    return next_link, should_stop



def _handle_lora_chain_node(
    node: dict[str, Any],
    node_id: str,
    ct: str,
    ins: dict[str, Any],
    loras: list[dict[str, Any]],
    confidence: str,
) -> tuple[Any | None, bool] | None:
    if not _is_lora_loader_node(ct, ins):
        return None
    _append_lora_entries(node, node_id, ins, confidence, loras)
    next_model = ins.get("model")
    if _is_link(next_model):
        return _chain_result(next_model, False)
    return _chain_result(None, True)



def _handle_modelsampling_chain_node(ct: str, ins: dict[str, Any]) -> tuple[Any | None, bool] | None:
    if ("modelsampling" in ct or "model_sampling" in ct) and _is_link(ins.get("model")):
        return _chain_result(ins.get("model"), False)
    return None



def _handle_diffusion_loader_chain_node(
    node: dict[str, Any],
    node_id: str,
    ct: str,
    ins: dict[str, Any],
    models: dict[str, dict[str, Any]],
    confidence: str,
) -> tuple[Any | None, bool] | None:
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
    models: dict[str, dict[str, Any]],
    key: str,
    name: str | None,
    confidence: str,
    source: str,
) -> None:
    if name and key not in models:
        models[key] = {"name": name, "confidence": confidence, "source": source}



def _chain_result_from_model_input(ins: dict[str, Any]) -> tuple[Any | None, bool]:
    next_model = ins.get("model")
    if _is_link(next_model):
        return _chain_result(next_model, False)
    return _chain_result(None, True)



def _handle_generic_loader_chain_node(
    node: dict[str, Any],
    node_id: str,
    ct: str,
    ins: dict[str, Any],
    models: dict[str, dict[str, Any]],
    confidence: str,
) -> tuple[Any | None, bool] | None:
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
    node: dict[str, Any],
    node_id: str,
    ct: str,
    ins: dict[str, Any],
    models: dict[str, dict[str, Any]],
    confidence: str,
) -> tuple[Any | None, bool] | None:
    if not _is_checkpoint_loader_node(ct, ins):
        return None
    ckpt = _clean_model_id(ins.get("ckpt_name") or ins.get("model_name"))
    if ckpt:
        models.setdefault(
            "checkpoint",
            {"name": ckpt, "confidence": confidence, "source": f"{_node_type(node)}:{node_id}"},
        )
    return _chain_result(None, True)



def _handle_switch_selector_chain_node(ct: str, ins: dict[str, Any]) -> tuple[Any | None, bool] | None:
    if ("switch" in ct or "selector" in ct) and not _is_link(ins.get("model")):
        links = [value for value in ins.values() if _is_link(value)]
        if len(links) == 1:
            return _chain_result(links[0], False)
    return None



def _handle_fallback_chain_node(
    node: dict[str, Any],
    node_id: str,
    ins: dict[str, Any],
    models: dict[str, dict[str, Any]],
    confidence: str,
) -> tuple[Any | None, bool]:
    name = _clean_model_id(_first_model_string_from_inputs(ins))
    if name and "checkpoint" not in models:
        models["checkpoint"] = {"name": name, "confidence": confidence, "source": f"{_node_type(node)}:{node_id}"}
    next_model = ins.get("model")
    if _is_link(next_model):
        return _chain_result(next_model, False)
    return _chain_result(None, True)



def _process_model_chain_node(
    node: dict[str, Any],
    node_id: str,
    ct: str,
    ins: dict[str, Any],
    models: dict[str, dict[str, Any]],
    loras: list[dict[str, Any]],
    confidence: str,
) -> tuple[Any | None, bool]:
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
    nodes_by_id: dict[str, dict[str, Any]], model_link: Any, confidence: str
) -> tuple[dict[str, dict[str, Any]], list[dict[str, Any]]]:
    loras: list[dict[str, Any]] = []
    models: dict[str, dict[str, Any]] = {}

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



def _trace_named_loader(nodes_by_id: dict[str, dict[str, Any]], link: Any, keys: tuple[str, ...], confidence: str) -> dict[str, Any] | None:
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
    ins: dict[str, Any], keys: tuple[str, ...], *, confidence: str, source: str
) -> dict[str, Any] | None:
    dual_clip = _extract_dual_clip_name(ins, keys)
    if dual_clip is not None:
        return {"name": dual_clip, "confidence": confidence, "source": source}
    for key in keys:
        name = _clean_model_id(ins.get(key))
        if name:
            return {"name": name, "confidence": confidence, "source": source}
    return None



def _extract_dual_clip_name(ins: dict[str, Any], keys: tuple[str, ...]) -> str | None:
    if "clip_name1" not in keys or "clip_name2" not in keys:
        return None
    c1 = _clean_model_id(ins.get("clip_name1"))
    c2 = _clean_model_id(ins.get("clip_name2"))
    if c1 and c2:
        return f"{c1} + {c2}"
    return None



def _next_named_loader_link(ins: dict[str, Any]) -> Any | None:
    for key in ("clip", "vae", "model"):
        value = ins.get(key)
        if _is_link(value):
            return value
    return None



def _trace_vae_from_sink(nodes_by_id: dict[str, dict[str, Any]], sink_start_id: str, confidence: str) -> dict[str, Any] | None:
    dist = _collect_upstream_nodes(nodes_by_id, sink_start_id)
    candidates: list[tuple[str, int]] = []
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



def _trace_clip_from_text_encoder(nodes_by_id: dict[str, dict[str, Any]], encoder_link: Any, confidence: str) -> dict[str, Any] | None:
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



def _trace_clip_skip(nodes_by_id: dict[str, dict[str, Any]], clip_link: Any, confidence: str) -> dict[str, Any] | None:
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



def _trace_clip_skip_from_conditioning(nodes_by_id: dict[str, Any], conditioning_link: Any, confidence: str) -> dict[str, Any] | None:
    if not conditioning_link or not _is_link(conditioning_link):
        return None
    encoders = _collect_text_encoder_nodes_from_conditioning(nodes_by_id, conditioning_link, branch="positive")
    encoder_id = encoders[0] if encoders else _walk_passthrough(nodes_by_id, conditioning_link)
    pos_node = nodes_by_id.get(encoder_id) if encoder_id else None
    if not isinstance(pos_node, dict) or not _is_link(_inputs(pos_node).get("clip")):
        return None
    return _trace_clip_skip(nodes_by_id, _inputs(pos_node).get("clip"), confidence)



def _trace_models_and_loras(
    nodes_by_id: dict[str, Any],
    model_link_for_chain: Any,
    confidence: str,
) -> tuple[dict[str, dict[str, Any]], list[dict[str, Any]]]:
    if model_link_for_chain and _is_link(model_link_for_chain):
        return _trace_model_chain(nodes_by_id, model_link_for_chain, confidence)
    return {}, []



def _collect_model_related_fields(
    nodes_by_id: dict[str, Any],
    ins: dict[str, Any],
    confidence: str,
    sink_start_id: str | None,
    conditioning_link: Any,
    model_link_for_chain: Any,
) -> dict[str, Any]:
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



def _ensure_upscaler_model(nodes_by_id: dict[str, Any], models: dict[str, dict[str, Any]]) -> None:
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



def _upscaler_model_entry(node: Any, node_id: Any) -> dict[str, Any] | None:
    if not isinstance(node, dict):
        return None
    if not _is_upscaler_loader_type(_lower(_node_type(node))):
        return None
    name: str | None = _clean_model_id(_upscaler_model_name(_inputs(node)))
    if not name:
        return None
    return {"name": name, "confidence": "medium", "source": f"{_node_type(node)}:{node_id}"}



def _is_upscaler_loader_type(node_type: str) -> bool:
    return "upscalemodelloader" in node_type or "upscale_model" in node_type or "latentupscale" in node_type



def _upscaler_model_name(ins: dict[str, Any]) -> Any:
    return ins.get("model_name") or ins.get("upscale_model") or ins.get("upscale_model_name")



def _merge_models_payload(models: dict[str, dict[str, Any]], clip: dict[str, Any] | None, vae: dict[str, Any] | None) -> dict[str, dict[str, Any]] | None:
    if not models and not clip and not vae:
        return None

    merged: dict[str, dict[str, Any]] = {}
    for key in ("checkpoint", "unet", "diffusion", "upscaler"):
        if models.get(key):
            merged[key] = models[key]
    if clip:
        merged["clip"] = clip
    if vae:
        merged["vae"] = vae
    return merged or None



