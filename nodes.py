"""
Majoor Assets Manager – ComfyUI custom nodes.

MajoorSaveImage : drop-in replacement for ComfyUI SaveImage that persists
                  ``generation_time_ms`` (and any extra metadata) inside the
                  PNG text chunks so Majoor can index it later.

MajoorSaveVideo : saves a VIDEO *or* a batch of IMAGE frames as a video file
                  (MP4 h264) using PyAV – same approach as ComfyUI's native
                  ``SaveVideo`` node – while embedding ``generation_time_ms``
                  directly in the MP4 container metadata alongside the full
                  prompt / workflow JSON.
                  Also supports GIF / WebP export via Pillow for animated
                  image formats.
"""

from __future__ import annotations

import datetime
import json
import logging
import math
import os
import re
import time
from fractions import Fraction
from typing import Any

import av  # type: ignore[import-untyped]
import folder_paths  # type: ignore[import-untyped]
import numpy as np
import torch
from comfy.cli_args import args  # type: ignore[import-untyped]
from PIL import Image
from PIL.PngImagePlugin import PngInfo

try:
    from .mjr_am_backend.video_ui import build_video_ui as _build_video_ui
except ImportError:
    from mjr_am_backend.video_ui import build_video_ui as _build_video_ui

_log = logging.getLogger("majoor_assets_manager.nodes")


class _AnyType(str):
    def __ne__(self, other: object) -> bool:
        return False


MAJOOR_ANY = _AnyType("*")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _get_generation_time_ms() -> int:
    """
    Compute elapsed time since the current prompt started.

    Uses *mjr_am_backend.runtime_activity* (which hooks into the ComfyUI
    prompt lifecycle) to know when the prompt was queued. Falls back to 0
    if the runtime module is unavailable.
    """
    try:
        from mjr_am_backend.runtime_activity import _LOCK, _STATE

        with _LOCK:
            started = float(_STATE.get("last_started_at") or 0.0)
        if started <= 0.0:
            return 0
        # last_started_at is time.monotonic(), so compare with same clock
        return max(0, int(round((time.monotonic() - started) * 1000)))
    except Exception:
        return 0


def _tensor_to_bytes(t: torch.Tensor) -> np.ndarray:
    """Convert a CHW/HWC float [0-1] tensor to uint8 HWC numpy array."""
    arr = 255.0 * t.cpu().numpy()
    return np.clip(arr, 0, 255).astype(np.uint8)


def _next_counter(directory: str, prefix: str) -> int:
    """Find the next available counter for *prefix_NNNNN* in *directory*."""
    max_counter = 0
    matcher = re.compile(rf"{re.escape(prefix)}_(\d+)\D*\..+", re.IGNORECASE)
    try:
        for entry in os.listdir(directory):
            m = matcher.fullmatch(entry)
            if m:
                max_counter = max(max_counter, int(m.group(1)))
    except FileNotFoundError:
        pass
    return max_counter + 1


def _build_metadata(
    prompt: Any | None,
    extra_pnginfo: dict | None,
    generation_time_ms: int,
    geninfo_override: Any | None = None,
    unique_id: Any | None = None,
) -> PngInfo:
    metadata = PngInfo()
    if prompt is not None:
        metadata.add_text("prompt", json.dumps(prompt))
    if extra_pnginfo is not None:
        for key in extra_pnginfo:
            metadata.add_text(key, json.dumps(extra_pnginfo[key]))
    override_payload = _coerce_geninfo_override_payload(geninfo_override)
    if override_payload is not None:
        metadata.add_text("majoor_geninfo", json.dumps(override_payload))
    for key, value in _resolve_execution_metadata(prompt, extra_pnginfo, unique_id).items():
        metadata.add_text(key, value)
    metadata.add_text("generation_time_ms", str(generation_time_ms))
    metadata.add_text(
        "CreationTime",
        datetime.datetime.now().isoformat(" ")[:19],
    )
    return metadata


def _runtime_active_prompt_id() -> str | None:
    try:
        from mjr_am_backend.runtime_activity import _LOCK, _STATE

        with _LOCK:
            return _clean_optional_text(_STATE.get("active_prompt_id"), max_len=255)
    except Exception:
        return None


def _workflow_id_from_extra_pnginfo(extra_pnginfo: dict | None) -> str | None:
    if not isinstance(extra_pnginfo, dict):
        return None
    candidates: list[Any] = [extra_pnginfo.get("workflow_id")]
    workflow = extra_pnginfo.get("workflow")
    if isinstance(workflow, dict):
        candidates.extend((workflow.get("id"), workflow.get("workflow_id")))
    for value in candidates:
        text = _clean_optional_text(value, max_len=255)
        if text:
            return text
    return None


def _job_id_from_prompt(prompt: Any | None) -> str | None:
    if isinstance(prompt, (list, tuple)) and len(prompt) >= 2:
        text = _clean_optional_text(prompt[1], max_len=255)
        if text:
            return text
    if isinstance(prompt, dict):
        for key in ("prompt_id", "job_id"):
            text = _clean_optional_text(prompt.get(key), max_len=255)
            if text:
                return text
    return None


def _resolve_execution_metadata(
    prompt: Any | None,
    extra_pnginfo: dict | None,
    unique_id: Any | None = None,
) -> dict[str, str]:
    out: dict[str, str] = {}
    job_id = _runtime_active_prompt_id() or _job_id_from_prompt(prompt)
    workflow_id = _workflow_id_from_extra_pnginfo(extra_pnginfo)
    source_node_id = _clean_optional_text(unique_id, max_len=255)
    if job_id:
        out["job_id"] = job_id
        out["prompt_id"] = job_id
    if workflow_id:
        out["workflow_id"] = workflow_id
    if source_node_id:
        out["source_node_id"] = source_node_id
    return out


def _clean_optional_text(value: Any, max_len: int = 20_000) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    return text[:max_len]


def _json_object_or_array(value: Any) -> Any | None:
    if value is None:
        return None
    if isinstance(value, (dict, list)):
        return value
    text = _clean_optional_text(value)
    if not text:
        return None
    try:
        parsed = json.loads(text)
    except Exception:
        return None
    return parsed if isinstance(parsed, (dict, list)) else None


def _coerce_geninfo_override_payload(value: Any | None) -> dict[str, Any] | None:
    if value is None:
        return None
    payload = value
    if isinstance(value, str):
        parsed = _json_object_or_array(value)
        payload = parsed if isinstance(parsed, dict) else None
    if not isinstance(payload, dict):
        return None
    if "majoor_geninfo" in payload and isinstance(payload.get("majoor_geninfo"), dict):
        payload = payload["majoor_geninfo"]
    if "MajoorOverride" in payload and isinstance(payload.get("MajoorOverride"), dict):
        payload = payload["MajoorOverride"]
    if not isinstance(payload, dict):
        return None
    out = dict(payload)
    out.setdefault("version", 1)
    out.setdefault("mode", "override")
    return out


def _assign_text(payload: dict[str, Any], key: str, value: Any) -> None:
    text = _clean_optional_text(value)
    if text is not None:
        payload[key] = text


def _assign_numeric(payload: dict[str, Any], key: str, value: Any, caster: Any, *, default: Any = None) -> None:
    if value is None or value == default or value == "":
        return
    try:
        payload[key] = caster(value)
    except Exception:
        return


def _assign_json(payload: dict[str, Any], key: str, value: Any, expected_type: type) -> None:
    parsed = _json_object_or_array(value)
    if isinstance(parsed, expected_type):
        payload[key] = parsed


def _assign_custom_info(payload: dict[str, Any], value: Any) -> None:
    parsed = _json_object_or_array(value)
    if isinstance(parsed, list):
        payload["custom_info"] = parsed
        return
    text = _clean_optional_text(value)
    if text is not None:
        payload["custom_info"] = [{"title": "Custom Info", "content": text}]


def _build_geninfo_override_payload(
    positive_prompt: str = "",
    negative_prompt: str = "",
    seed: int = -1,
    steps: int = -1,
    cfg: float = -1.0,
    sampler: str = "",
    scheduler: str = "",
    model: str = "",
    vae: str = "",
    clip: str = "",
    denoise: float = -1.0,
    loras_json: str = "",
    workflow_notes: str = "",
    custom_info_json: str = "",
) -> dict[str, Any]:
    payload: dict[str, Any] = {"version": 1, "mode": "override"}
    _assign_text(payload, "prompt", positive_prompt)
    _assign_text(payload, "negative_prompt", negative_prompt)
    _assign_numeric(payload, "seed", seed, int, default=-1)
    _assign_numeric(payload, "steps", steps, int, default=-1)
    _assign_numeric(payload, "cfg", cfg, float, default=-1.0)
    _assign_numeric(payload, "denoise", denoise, float, default=-1.0)
    _assign_text(payload, "sampler", sampler)
    _assign_text(payload, "scheduler", scheduler)
    _assign_text(payload, "model", model)
    _assign_text(payload, "vae", vae)
    _assign_text(payload, "clip", clip)
    _assign_json(payload, "loras", loras_json, list)
    _assign_text(payload, "workflow_notes", workflow_notes)
    _assign_custom_info(payload, custom_info_json)
    return payload


def _geninfo_value(parsed: dict[str, Any] | None, key: str, value_key: str = "value") -> Any:
    if not isinstance(parsed, dict):
        return None
    value = parsed.get(key)
    if isinstance(value, dict):
        return value.get(value_key) or value.get("value") or value.get("name")
    return value


def _first_model_name(parsed: dict[str, Any] | None) -> str:
    if not isinstance(parsed, dict):
        return ""
    checkpoint = parsed.get("checkpoint")
    if isinstance(checkpoint, dict) and checkpoint.get("name"):
        return str(checkpoint.get("name") or "").strip()
    models = parsed.get("models")
    if isinstance(models, dict):
        for key in ("checkpoint", "unet", "model", "diffusion_model", "base"):
            item = models.get(key)
            if isinstance(item, dict) and item.get("name"):
                return str(item.get("name") or "").strip()
        for item in models.values():
            if isinstance(item, dict) and item.get("name"):
                return str(item.get("name") or "").strip()
    return ""


def _loras_json_from_parsed(parsed: dict[str, Any] | None) -> str:
    if not isinstance(parsed, dict):
        return ""
    loras = parsed.get("loras")
    if not isinstance(loras, list) or not loras:
        return ""
    out: list[dict[str, Any]] = []
    for item in loras:
        if not isinstance(item, dict):
            continue
        name = str(item.get("name") or "").strip()
        if not name:
            continue
        entry: dict[str, Any] = {"name": name}
        strength = item.get("strength", item.get("model_strength", item.get("strength_model")))
        if strength is not None:
            entry["strength"] = strength
        out.append(entry)
    return json.dumps(out) if out else ""


def _parsed_geninfo_to_override_payload(parsed: dict[str, Any] | None) -> dict[str, Any]:
    return _build_geninfo_override_payload(
        positive_prompt=str(_geninfo_value(parsed, "positive") or ""),
        negative_prompt=str(_geninfo_value(parsed, "negative") or ""),
        seed=int(_geninfo_value(parsed, "seed") or -1),
        steps=int(_geninfo_value(parsed, "steps") or -1),
        cfg=float(_geninfo_value(parsed, "cfg") or -1.0),
        sampler=str(_geninfo_value(parsed, "sampler", "name") or ""),
        scheduler=str(_geninfo_value(parsed, "scheduler", "name") or ""),
        model=_first_model_name(parsed),
        vae=str(_geninfo_value(parsed, "vae", "name") or ""),
        clip=str(_geninfo_value(parsed, "clip", "name") or ""),
        denoise=float(_geninfo_value(parsed, "denoise") or -1.0),
        loras_json=_loras_json_from_parsed(parsed),
    )


def _workflow_node_widget_map(node: dict[str, Any]) -> dict[str, Any]:
    values = node.get("widgets_values")
    widgets = values if isinstance(values, list) else []
    inputs = node.get("inputs")
    out: dict[str, Any] = {}
    if isinstance(inputs, list):
        widget_index = 0
        for inp in inputs:
            if not isinstance(inp, dict):
                continue
            widget_name = inp.get("widget", {}).get("name") if isinstance(inp.get("widget"), dict) else None
            if inp.get("link") is None and widget_index < len(widgets):
                name = str(widget_name or inp.get("name") or "").strip()
                if name:
                    out[name] = widgets[widget_index]
                widget_index += 1
    if isinstance(values, dict):
        out.update(values)
    return out


def _iter_workflow_nodes(workflow: Any, definitions: dict[str, dict[str, Any]] | None = None, seen: set[str] | None = None):
    if not isinstance(workflow, dict):
        return
    defs = definitions
    if defs is None:
        defs = {}
        raw_defs = workflow.get("definitions", {}).get("subgraphs") if isinstance(workflow.get("definitions"), dict) else []
        if isinstance(raw_defs, list):
            for sg in raw_defs:
                if isinstance(sg, dict) and sg.get("id") is not None:
                    defs[str(sg.get("id"))] = sg
    active = seen or set()
    for node in workflow.get("nodes", []) if isinstance(workflow.get("nodes"), list) else []:
        if not isinstance(node, dict):
            continue
        yield node
        node_type = str(node.get("type") or "")
        subgraph = defs.get(node_type)
        if subgraph and node_type not in active:
            yield from _iter_workflow_nodes(subgraph, defs, {*active, node_type})


def _first_named_or_string_value(values: dict[str, Any], names: tuple[str, ...]) -> str:
    for name in names:
        value = values.get(name)
        if isinstance(value, str) and value.strip():
            return value.strip()
    for value in values.values():
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ""


def _first_named_value(values: dict[str, Any], names: tuple[str, ...]) -> str:
    for name in names:
        value = values.get(name)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ""


def _apply_workflow_text_fallback(
    out: dict[str, Any],
    node_type: str,
    values: dict[str, Any],
    text_values: list[str],
) -> None:
    if "prompt" not in out and ("textencode" in node_type or "text" in node_type):
        text = _first_named_or_string_value(values, ("text", "prompt", "positive_prompt", "string"))
        if text and "negative" not in node_type:
            out["prompt"] = text
    if "negative_prompt" not in out:
        text = _first_named_value(values, ("negative", "negative_prompt", "negative_text"))
        if text or ("negative" in node_type and text_values):
            out["negative_prompt"] = text or text_values[0]


def _apply_workflow_model_fallback(
    out: dict[str, Any],
    node_type: str,
    values: dict[str, Any],
) -> None:
    if "model" not in out and any(token in node_type for token in ("checkpoint", "unet", "model")):
        model = _first_named_or_string_value(values, ("ckpt_name", "unet_name", "model_name", "model"))
        if model:
            out["model"] = model
    if "vae" not in out and "vae" in node_type:
        vae = _first_named_or_string_value(values, ("vae_name", "vae"))
        if vae:
            out["vae"] = vae
    if "clip" not in out and "clip" in node_type:
        clip = _first_named_or_string_value(values, ("clip_name", "clip_name1", "clip_name2", "clip"))
        if clip:
            out["clip"] = clip


def _widget_value(values: dict[str, Any], widgets: list[Any], key: str, index: int, default: Any = None) -> Any:
    return values.get(key, widgets[index] if len(widgets) > index else default)


def _set_nonnegative_number(
    out: dict[str, Any],
    key: str,
    value: Any,
    caster: type[int] | type[float],
) -> None:
    if key in out or not isinstance(value, (int, float)) or value < 0:
        return
    out[key] = caster(value)


def _set_nonempty_string(out: dict[str, Any], key: str, value: Any) -> None:
    if key in out or not isinstance(value, str) or not value.strip():
        return
    out[key] = value.strip()


def _apply_workflow_sampler_fallback(
    out: dict[str, Any],
    node_type: str,
    values: dict[str, Any],
    widgets: list[Any],
) -> None:
    if "ksampler" not in node_type and "sampler" not in node_type:
        return
    _set_nonnegative_number(out, "seed", _widget_value(values, widgets, "seed", 0), int)
    _set_nonnegative_number(out, "steps", _widget_value(values, widgets, "steps", 1), int)
    _set_nonnegative_number(out, "cfg", _widget_value(values, widgets, "cfg", 2), float)
    _set_nonempty_string(out, "sampler", _widget_value(values, widgets, "sampler_name", 3, ""))
    _set_nonempty_string(out, "scheduler", _widget_value(values, widgets, "scheduler", 4, ""))
    _set_nonnegative_number(out, "denoise", _widget_value(values, widgets, "denoise", 5), float)


def _workflow_context_fallback_payload(extra_pnginfo: dict | None) -> dict[str, Any]:
    workflow = extra_pnginfo.get("workflow") if isinstance(extra_pnginfo, dict) else None
    out: dict[str, Any] = {"version": 1, "mode": "override"}
    if not isinstance(workflow, dict):
        return out
    for node in _iter_workflow_nodes(workflow):
        node_type = str(node.get("type") or node.get("class_type") or "").lower()
        if "majoorgeninfooverride" in node_type or "geninfooverride" in node_type:
            continue
        values = _workflow_node_widget_map(node)
        widgets = node.get("widgets_values") if isinstance(node.get("widgets_values"), list) else []
        text_values = [str(v).strip() for v in widgets if isinstance(v, str) and v.strip()]

        _apply_workflow_text_fallback(out, node_type, values, text_values)
        _apply_workflow_model_fallback(out, node_type, values)
        _apply_workflow_sampler_fallback(out, node_type, values, widgets)
    return out


def _merge_missing_override_fields(manual: dict[str, Any], fallback: dict[str, Any]) -> dict[str, Any]:
    merged = dict(fallback)
    merged.update({k: v for k, v in manual.items() if k in ("version", "mode")})
    for key, value in manual.items():
        if key in ("version", "mode"):
            continue
        if value is None:
            continue
        if isinstance(value, str) and not value.strip():
            continue
        if isinstance(value, (int, float)) and value < 0:
            continue
        if isinstance(value, list) and not value:
            continue
        merged[key] = value
    merged["version"] = 1
    merged["mode"] = "override"
    return merged


def _payload_has_meaningful_value(payload: dict[str, Any], key: str) -> bool:
    value = payload.get(key)
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, (int, float)):
        return value >= 0
    if isinstance(value, list):
        return bool(value)
    return True


def _prefer_prompt_runtime_fields(payload: dict[str, Any], prompt_payload: dict[str, Any]) -> dict[str, Any]:
    merged = dict(payload)
    # ComfyUI mutates seed/control widgets before graphToPrompt. The prompt graph
    # is therefore the executed truth; workflow JSON can still contain stale widget values.
    for key in ("seed", "steps", "cfg", "denoise", "sampler", "scheduler"):
        if _payload_has_meaningful_value(prompt_payload, key):
            merged[key] = prompt_payload[key]
    return merged


def _parse_context_geninfo(prompt: Any | None, extra_pnginfo: dict | None) -> dict[str, Any] | None:
    workflow = extra_pnginfo.get("workflow") if isinstance(extra_pnginfo, dict) else None
    try:
        from mjr_am_backend.features.geninfo.parser import parse_geninfo_from_prompt

        result = parse_geninfo_from_prompt(prompt, workflow=workflow)
        return result.data if result.ok and isinstance(result.data, dict) else None
    except Exception as exc:
        _log.debug("Majoor Gen Info Override context parse failed: %s", exc, exc_info=True)
        return None


def _coerce_runtime_seed(value: Any) -> int | None:
    if isinstance(value, bool) or value is None or value == "":
        return None
    try:
        seed = int(value)
    except Exception:
        return None
    return seed if seed >= 0 else None


def _runtime_seed_from_link(nodes_by_id: dict[str, Any], link_or_value: Any) -> int | None:
    seed = _coerce_runtime_seed(link_or_value)
    if seed is not None:
        return seed
    try:
        from mjr_am_backend.features.geninfo.graph_converter import _is_link
        from mjr_am_backend.features.geninfo.prompt_tracer import _resolve_scalar_from_link

        if _is_link(link_or_value):
            return _coerce_runtime_seed(_resolve_scalar_from_link(nodes_by_id, link_or_value))
    except Exception:
        return None
    return None


def _runtime_seed_from_node_inputs(nodes_by_id: dict[str, Any], inputs: dict[str, Any]) -> int | None:
    for key in ("seed", "noise_seed", "rand_seed", "random_seed", "value", "int", "number"):
        if key not in inputs:
            continue
        seed = _runtime_seed_from_link(nodes_by_id, inputs.get(key))
        if seed is not None:
            return seed
    return None


def _runtime_sampler_payload_from_node(
    nodes_by_id: dict[str, Any],
    node_id: str,
    node: dict[str, Any],
) -> dict[str, Any]:
    try:
        from mjr_am_backend.features.geninfo.graph_converter import _inputs, _lower, _node_type
        from mjr_am_backend.features.geninfo.sampler_tracer import _is_advanced_sampler
        from mjr_am_backend.features.geninfo.sampler_value_extractor import _extract_sampler_values
    except Exception:
        return {}

    ins = _inputs(node)
    if _lower(_node_type(node)).find("geninfooverride") >= 0:
        return {}
    try:
        values = _extract_sampler_values(nodes_by_id, node, node_id, ins, _is_advanced_sampler(node), "high", {})
    except Exception:
        values = {}

    out: dict[str, Any] = {"version": 1, "mode": "override"}
    seed = _coerce_runtime_seed(values.get("seed_val"))
    if seed is None:
        seed = _runtime_seed_from_node_inputs(nodes_by_id, ins)
    if seed is not None:
        out["seed"] = seed
    for src_key, dst_key, caster in (
        ("steps", "steps", int),
        ("cfg", "cfg", float),
        ("denoise", "denoise", float),
    ):
        val = values.get(src_key)
        if val is None:
            val = ins.get(src_key)
        try:
            if val is not None and val != "":
                out[dst_key] = caster(val)
        except Exception:
            pass
    for src_key, dst_key in (("sampler_name", "sampler"), ("sampler", "sampler"), ("scheduler", "scheduler")):
        val = values.get(src_key)
        if val is None:
            val = ins.get(src_key)
        if isinstance(val, str) and val.strip() and dst_key not in out:
            out[dst_key] = val.strip()
    return out


def _workflow_context_start_ids(nodes_by_id: dict[str, Any]) -> list[str]:
    try:
        from mjr_am_backend.features.geninfo.graph_converter import (
            _inputs,
            _lower,
            _node_type,
            _walk_passthrough,
        )
    except Exception:
        return []

    start_ids: list[str] = []
    for node in nodes_by_id.values():
        if not isinstance(node, dict):
            continue
        node_type = _lower(_node_type(node))
        if "majoorgeninfooverride" not in node_type and "geninfooverride" not in node_type:
            continue
        start_id = _walk_passthrough(nodes_by_id, _inputs(node).get("workflow_context"))
        if start_id:
            start_ids.append(start_id)
    return start_ids


def _runtime_sampler_candidates(
    nodes_by_id: dict[str, Any],
    start_ids: list[str],
) -> list[tuple[int, str, dict[str, Any]]]:
    try:
        from mjr_am_backend.features.geninfo.graph_converter import (
            _collect_upstream_nodes,
            _inputs,
            _lower,
            _node_type,
        )
        from mjr_am_backend.features.geninfo.sampler_tracer import _is_sampler
    except Exception:
        return []

    candidates: list[tuple[int, str, dict[str, Any]]] = []
    for start_id in start_ids:
        distances = _collect_upstream_nodes(nodes_by_id, start_id)
        if not distances and start_id in nodes_by_id:
            distances = {start_id: 0}
        for node_id, distance in distances.items():
            node = nodes_by_id.get(node_id)
            if not isinstance(node, dict):
                continue
            node_type = _lower(_node_type(node))
            if "majoorgeninfooverride" in node_type or "geninfooverride" in node_type:
                continue
            if _is_sampler(node) or any(key in _inputs(node) for key in ("seed", "noise_seed")):
                candidates.append((distance, str(node_id), node))
    return candidates


def _prompt_runtime_sampler_payload(prompt: Any | None, workflow: Any | None) -> dict[str, Any]:
    """Read executed sampler/noise values from ComfyUI's runtime PROMPT graph.

    This intentionally starts at MajoorGenInfoOverride.workflow_context when it
    is linked, so an override node connected behind VAE Decode captures the
    sampler branch that produced that image instead of its own seed widget.
    """
    out: dict[str, Any] = {"version": 1, "mode": "override"}
    try:
        from mjr_am_backend.features.geninfo.graph_converter import _normalize_graph_input
        from mjr_am_backend.features.geninfo.sampler_tracer import _is_sampler
    except Exception:
        return out

    nodes_by_id = _normalize_graph_input(prompt, workflow)
    if not nodes_by_id:
        return out

    start_ids = _workflow_context_start_ids(nodes_by_id)
    if not start_ids:
        start_ids = [nid for nid, node in nodes_by_id.items() if isinstance(node, dict)]

    candidates = _runtime_sampler_candidates(nodes_by_id, start_ids)
    candidates.sort(key=lambda item: (0 if _is_sampler(item[2]) else 1, item[0]))
    for _, node_id, node in candidates:
        payload = _runtime_sampler_payload_from_node(nodes_by_id, node_id, node)
        if _payload_has_meaningful_value(payload, "seed"):
            return payload
        for key in ("steps", "cfg", "denoise", "sampler", "scheduler"):
            if key not in out and _payload_has_meaningful_value(payload, key):
                out[key] = payload[key]
    return out


class MajoorGenInfoOverride:
    """Build explicit Majoor geninfo metadata for Save Image/Video nodes."""

    @classmethod
    def INPUT_TYPES(cls):  # noqa: N802
        return {
            "required": {
                "positive_prompt": ("STRING", {"default": "", "multiline": True}),
                "negative_prompt": ("STRING", {"default": "", "multiline": True}),
            },
            "optional": {
                "workflow_context": (
                    MAJOOR_ANY,
                    {
                        "tooltip": "Optional dependency input. Connect a late workflow node, for example VAE Decode IMAGE, so this node runs with full graph context.",
                    },
                ),
                "seed": ("INT", {"default": -1, "min": -1, "max": 0xffffffffffffffff, "control_after_generate": False}),
                "steps": ("INT", {"default": -1, "min": -1}),
                "cfg": ("FLOAT", {"default": -1.0, "min": -1.0, "step": 0.1}),
                "sampler": ("STRING", {"default": ""}),
                "scheduler": ("STRING", {"default": ""}),
                "model": ("STRING", {"default": ""}),
                "vae": ("STRING", {"default": ""}),
                "clip": ("STRING", {"default": ""}),
                "denoise": ("FLOAT", {"default": -1.0, "min": -1.0, "max": 1.0, "step": 0.01}),
                "loras_json": (
                    "STRING",
                    {
                        "default": "",
                        "multiline": True,
                        "tooltip": "JSON array: [{\"name\":\"lora.safetensors\",\"strength\":0.8}]",
                    },
                ),
                "workflow_notes": ("STRING", {"default": "", "multiline": True}),
                "custom_info_json": (
                    "STRING",
                    {
                        "default": "",
                        "multiline": True,
                        "tooltip": "JSON array: [{\"title\":\"Notes\",\"content\":\"...\",\"color\":\"#4CAF50\"}]",
                    },
                ),
            },
            "hidden": {
                "prompt": "PROMPT",
                "extra_pnginfo": "EXTRA_PNGINFO",
            },
        }

    RETURN_TYPES = ("MAJOOR_GENINFO",)
    RETURN_NAMES = ("geninfo_override",)
    FUNCTION = "build"
    CATEGORY = "Majoor"
    DESCRIPTION = "Build explicit geninfo metadata consumed by Majoor Save Image/Video."

    @classmethod
    def VALIDATE_INPUTS(cls, **kwargs):  # noqa: N802
        return True

    def build(
        self,
        positive_prompt: str = "",
        negative_prompt: str = "",
        workflow_context: Any | None = None,
        seed: int = -1,
        steps: int = -1,
        cfg: float = -1.0,
        sampler: str = "",
        scheduler: str = "",
        model: str = "",
        vae: str = "",
        clip: str = "",
        denoise: float = -1.0,
        loras_json: str = "",
        workflow_notes: str = "",
        custom_info_json: str = "",
        prompt: Any | None = None,
        extra_pnginfo: dict | None = None,
    ):
        manual = _build_geninfo_override_payload(
            positive_prompt=positive_prompt,
            negative_prompt=negative_prompt,
            seed=seed,
            steps=steps,
            cfg=cfg,
            sampler=sampler,
            scheduler=scheduler,
            model=model,
            vae=vae,
            clip=clip,
            denoise=denoise,
            loras_json=loras_json,
            workflow_notes=workflow_notes,
            custom_info_json=custom_info_json,
        )
        parsed = _parse_context_geninfo(prompt, extra_pnginfo)
        parsed_payload = _parsed_geninfo_to_override_payload(parsed)
        runtime_payload = _prompt_runtime_sampler_payload(
            prompt,
            extra_pnginfo.get("workflow") if isinstance(extra_pnginfo, dict) else None,
        )
        fallback = _merge_missing_override_fields(
            _workflow_context_fallback_payload(extra_pnginfo),
            parsed_payload,
        )
        fallback = _prefer_prompt_runtime_fields(fallback, parsed_payload)
        fallback = _prefer_prompt_runtime_fields(fallback, runtime_payload)
        if workflow_context is not None and fallback.get("seed") is not None:
            manual.pop("seed", None)
        payload = _merge_missing_override_fields(manual, fallback)
        if workflow_context is not None:
            payload = _prefer_prompt_runtime_fields(payload, fallback)
            for key in ("prompt", "negative_prompt", "model", "vae", "clip", "loras"):
                if _payload_has_meaningful_value(fallback, key):
                    payload[key] = fallback[key]
        if _payload_has_meaningful_value(runtime_payload, "seed"):
            payload["seed"] = runtime_payload["seed"]
        return {"ui": {"majoor_geninfo_override": [payload]}, "result": (payload,)}


# ---------------------------------------------------------------------------
# MajoorSaveImage
# ---------------------------------------------------------------------------

class MajoorSaveImage:
    """
    Save images to the ComfyUI output directory with **generation_time_ms**
    persisted in the PNG text metadata.

    Behaves identically to the built-in *SaveImage* node but adds an
    optional ``generation_time_ms`` input.  When left unconnected the
    node automatically computes the time elapsed since the prompt started.
    """

    def __init__(self) -> None:
        self.output_dir = folder_paths.get_output_directory()
        self.type = "output"
        self.prefix_append = ""
        self.compress_level = 4

    @classmethod
    def INPUT_TYPES(cls):  # noqa: N802
        return {
            "required": {
                "images": ("IMAGE", {"tooltip": "The images to save."}),
                "filename_prefix": (
                    "STRING",
                    {
                        "default": "Majoor",
                        "tooltip": "Prefix for the saved file. Supports ComfyUI formatting placeholders.",
                    },
                ),
            },
            "optional": {
                "generation_time_ms": (
                    "INT",
                    {
                        "default": -1,
                        "min": -1,
                        "tooltip": "Generation time in milliseconds. -1 = auto-detect from prompt lifecycle.",
                    },
                ),
                "geninfo_override": (
                    "MAJOOR_GENINFO",
                    {"tooltip": "Explicit geninfo override from Majoor Gen Info Override."},
                ),
            },
            "hidden": {
                "prompt": "PROMPT",
                "extra_pnginfo": "EXTRA_PNGINFO",
                "unique_id": "UNIQUE_ID",
            },
        }

    RETURN_TYPES = ()
    FUNCTION = "save_images"
    OUTPUT_NODE = True
    CATEGORY = "Majoor"
    DESCRIPTION = "Save images with generation_time_ms metadata for Majoor Assets Manager."

    def save_images(
        self,
        images: torch.Tensor,
        filename_prefix: str = "Majoor",
        generation_time_ms: int = -1,
        geninfo_override: Any | None = None,
        prompt: Any | None = None,
        extra_pnginfo: dict | None = None,
        unique_id: Any | None = None,
    ):
        filename_prefix += self.prefix_append
        full_output_folder, filename, counter, subfolder, filename_prefix = (
            folder_paths.get_save_image_path(
                filename_prefix,
                self.output_dir,
                images[0].shape[1],
                images[0].shape[0],
            )
        )

        gen_time = generation_time_ms if generation_time_ms >= 0 else _get_generation_time_ms()

        results: list[dict[str, str]] = []
        for batch_number, image in enumerate(images):
            img = Image.fromarray(_tensor_to_bytes(image))

            metadata: PngInfo | None = None
            if not args.disable_metadata:
                metadata = _build_metadata(prompt, extra_pnginfo, gen_time, geninfo_override, unique_id)

            fname = filename.replace("%batch_num%", str(batch_number))
            file = f"{fname}_{counter:05}_.png"
            img.save(
                os.path.join(full_output_folder, file),
                pnginfo=metadata,
                compress_level=self.compress_level,
            )
            results.append(
                {"filename": file, "subfolder": subfolder, "type": self.type}
            )
            counter += 1

        return {"ui": {"images": results}}


# ---------------------------------------------------------------------------
# MajoorSaveVideo
# ---------------------------------------------------------------------------

_SUPPORTED_VIDEO_FORMATS = [
    "mp4 (h264)",
    "gif",
    "webp",
]


def _resolve_video_inputs(
    video: Any | None,
    images: torch.Tensor | None,
    audio: dict | None,
    frame_rate: float,
) -> tuple[torch.Tensor, float, dict | None] | None:
    """Return (images, fps, audio) or None when nothing to encode."""

    def _coerce_audio_input(candidate: Any | None) -> dict | None:
        if candidate is None:
            return None
        if isinstance(candidate, dict):
            return candidate if candidate.get("waveform") is not None else None
        waveform = getattr(candidate, "waveform", None)
        if waveform is not None:
            return {
                "waveform": waveform,
                "sample_rate": getattr(candidate, "sample_rate", 44100),
            }
        if hasattr(candidate, "__getitem__"):
            try:
                waveform = candidate["waveform"]
                if waveform is not None:
                    sample_rate = candidate["sample_rate"] if "sample_rate" in candidate else 44100
                    return {
                        "waveform": waveform,
                        "sample_rate": sample_rate,
                    }
            except Exception:
                pass
        return None

    resolved_images: torch.Tensor | None = None
    resolved_audio: dict | None = audio
    resolved_fps: float = frame_rate

    if video is not None:
        get_components = getattr(video, "get_components", None)
        if callable(get_components):
            components = get_components()
            resolved_images = components.images
            resolved_fps = float(components.frame_rate) if components.frame_rate else frame_rate
            if resolved_audio is None and components.audio is not None:
                resolved_audio = components.audio
        else:
            # Accept AUDIO payloads accidentally/explicitly routed to the video socket.
            if resolved_audio is None:
                resolved_audio = _coerce_audio_input(video)
            if images is not None:
                resolved_images = images
            else:
                return None
    elif images is not None:
        resolved_images = images
    else:
        return None

    if resolved_images is None or (isinstance(resolved_images, torch.Tensor) and resolved_images.size(0) == 0):
        return None
    return resolved_images, resolved_fps, resolved_audio


def _save_animated(
    resolved_images: torch.Tensor,
    fmt: str,
    fps: float,
    loop_count: int,
    output_folder: str,
    filename: str,
    counter: int,
) -> str:
    """Save GIF / WebP via Pillow. Returns the output filename."""
    out_file = f"{filename}_{counter:05}.{fmt}"
    out_path = os.path.join(output_folder, out_file)
    num_frames = resolved_images.size(0)
    frames = [Image.fromarray(_tensor_to_bytes(resolved_images[i])) for i in range(num_frames)]
    save_kwargs: dict[str, Any] = {
        "save_all": True,
        "append_images": frames[1:],
        "duration": round(1000 / fps),
        "loop": loop_count,
    }
    if fmt == "gif":
        save_kwargs["disposal"] = 2
    if fmt == "webp":
        save_kwargs["lossless"] = False
    frames[0].save(out_path, format=fmt.upper(), **save_kwargs)
    return out_file


def _build_container_metadata(
    prompt: Any | None,
    extra_pnginfo: dict | None,
    generation_time_ms: int,
    geninfo_override: Any | None = None,
    unique_id: Any | None = None,
) -> dict[str, str]:
    """Build the metadata dict to embed into an MP4 container."""
    meta: dict[str, str] = {}
    if args.disable_metadata:
        return meta
    if prompt is not None:
        meta["prompt"] = json.dumps(prompt)
    if extra_pnginfo is not None:
        for key in extra_pnginfo:
            meta[key] = json.dumps(extra_pnginfo[key])
    override_payload = _coerce_geninfo_override_payload(geninfo_override)
    if override_payload is not None:
        meta["majoor_geninfo"] = json.dumps(override_payload)
    meta.update(_resolve_execution_metadata(prompt, extra_pnginfo, unique_id))
    meta["generation_time_ms"] = str(generation_time_ms)
    meta["CreationTime"] = datetime.datetime.now().isoformat(" ")[:19]
    return meta


def _prepare_audio(
    audio_input: Any | None,
    fps_fraction: Fraction,
    num_frames: int,
) -> tuple[Any, int, str] | None:
    """Extract waveform, sample_rate, layout from an AUDIO input. Returns None if no audio."""

    def _extract_audio_payload(candidate: Any | None) -> tuple[Any | None, int]:
        if candidate is None:
            return None, 44100

        if isinstance(candidate, dict):
            if candidate.get("waveform") is not None:
                return candidate.get("waveform"), int(candidate.get("sample_rate", 44100) or 44100)
            for key in ("audio", "sound", "data"):
                nested = candidate.get(key)
                if nested is not None:
                    waveform, sr = _extract_audio_payload(nested)
                    if waveform is not None:
                        return waveform, sr

        if isinstance(candidate, (list, tuple)):
            for item in candidate:
                waveform, sr = _extract_audio_payload(item)
                if waveform is not None:
                    return waveform, sr

        waveform = getattr(candidate, "waveform", None)
        if waveform is not None:
            return waveform, int(getattr(candidate, "sample_rate", 44100) or 44100)

        if hasattr(candidate, "__getitem__"):
            try:
                waveform = candidate["waveform"]
                sample_rate = candidate["sample_rate"] if "sample_rate" in candidate else 44100
                if waveform is not None:
                    return waveform, int(sample_rate or 44100)
            except Exception:
                pass

        return None, 44100

    def _normalize_waveform_channels_samples(waveform: Any) -> torch.Tensor | None:
        if not torch.is_tensor(waveform):
            return None

        w = waveform
        if w.ndim == 1:
            w = w.unsqueeze(0)
        elif w.ndim == 3:
            # Prefer first batch item.
            w = w[0]

        if w.ndim != 2:
            return None

        # Support both [channels, samples] and [samples, channels].
        if w.shape[0] > 8 and w.shape[1] <= 8:
            w = w.transpose(0, 1)

        return w.contiguous()

    if audio_input is None:
        return None

    waveform_raw, sample_rate = _extract_audio_payload(audio_input)
    waveform = _normalize_waveform_channels_samples(waveform_raw)
    if waveform is None:
        return None

    max_samples = math.ceil((float(sample_rate) / float(fps_fraction)) * num_frames)
    trimmed = waveform[:, :max_samples]
    channels = trimmed.shape[0]
    layout = {1: "mono", 2: "stereo", 6: "5.1"}.get(channels, "stereo")
    return trimmed, int(sample_rate), layout


def _encode_mp4(
    out_path: str,
    resolved_images: torch.Tensor,
    fps: float,
    crf: int,
    container_meta: dict[str, str],
    audio_input: Any | None,
    num_frames: int,
) -> None:
    """Encode frames + optional audio into an MP4 via PyAV."""
    fps_fraction = Fraction(round(fps * 1000), 1000)
    audio_info = _prepare_audio(audio_input, fps_fraction, num_frames)

    with av.open(out_path, mode="w", options={"movflags": "use_metadata_tags"}) as container:
        for key, value in container_meta.items():
            container.metadata[key] = value

        stream = container.add_stream("libx264", rate=fps_fraction)
        stream.width = resolved_images.shape[2]
        stream.height = resolved_images.shape[1]
        stream.pix_fmt = "yuv420p"
        stream.bit_rate = 0
        stream.options = {"crf": str(crf)}

        audio_stream = None
        if audio_info is not None:
            waveform, sample_rate, layout = audio_info
            audio_stream = container.add_stream("aac", rate=sample_rate, layout=layout)

        for frame_tensor in resolved_images:
            img = (frame_tensor * 255).clamp(0, 255).byte().cpu().numpy()
            video_frame = av.VideoFrame.from_ndarray(img, format="rgb24")
            video_frame = video_frame.reformat(format="yuv420p")
            for packet in stream.encode(video_frame):
                container.mux(packet)
        for packet in stream.encode():
            container.mux(packet)

        if audio_stream is not None and audio_info is not None:
            waveform, sample_rate, layout = audio_info
            audio_frame = av.AudioFrame.from_ndarray(
                waveform.float().cpu().contiguous().numpy(),
                format="fltp",
                layout=layout,
            )
            audio_frame.sample_rate = sample_rate
            audio_frame.pts = 0
            for packet in audio_stream.encode(audio_frame):
                container.mux(packet)
            for packet in audio_stream.encode():
                container.mux(packet)


class MajoorSaveVideo:
    """
    Save a VIDEO or a batch of IMAGE frames as a video file.

    For MP4 output the node uses **PyAV** (same as ComfyUI's native SaveVideo)
    and writes all metadata – including ``generation_time_ms`` – directly into
    the MP4 container so it persists long-term.

    For GIF / WebP the node uses Pillow, with a PNG sidecar for metadata.
    """

    def __init__(self) -> None:
        self.output_dir = folder_paths.get_output_directory()
        self.type = "output"

    @classmethod
    def INPUT_TYPES(cls):  # noqa: N802
        return {
            "required": {
                "filename_prefix": ("STRING", {"default": "MajoorVideo"}),
                "format": (_SUPPORTED_VIDEO_FORMATS, {"default": "mp4 (h264)"}),
            },
            "optional": {
                "images": ("IMAGE", {"tooltip": "Batch of frames to encode as video."}),
                "video": (
                    "*",
                    {"tooltip": "A VIDEO input, or AUDIO routed into this socket (native SaveVideo style)."},
                ),
                "frame_rate": (
                    "FLOAT",
                    {"default": 24.0, "min": 1.0, "max": 120.0, "step": 1.0,
                     "tooltip": "FPS – ignored when a VIDEO input already carries its own frame rate."},
                ),
                "loop_count": ("INT", {"default": 0, "min": 0, "max": 100, "step": 1}),
                "generation_time_ms": (
                    "INT",
                    {"default": -1, "min": -1,
                     "tooltip": "Generation time in ms. -1 = auto-detect."},
                ),
                "geninfo_override": (
                    "MAJOOR_GENINFO",
                    {"tooltip": "Explicit geninfo override from Majoor Gen Info Override."},
                ),
                "audio": ("AUDIO", {"tooltip": "Audio to mux into the video."}),
                "crf": (
                    "INT",
                    {"default": 19, "min": 0, "max": 63,
                     "tooltip": "Constant Rate Factor (lower = higher quality)."},
                ),
                "save_first_frame": (
                    "BOOLEAN",
                    {"default": True,
                     "tooltip": "Save a PNG sidecar of the first frame with full metadata."},
                ),
            },
            "hidden": {
                "prompt": "PROMPT",
                "extra_pnginfo": "EXTRA_PNGINFO",
                "unique_id": "UNIQUE_ID",
            },
        }

    RETURN_TYPES = ()
    FUNCTION = "save_video"
    OUTPUT_NODE = True
    CATEGORY = "Majoor"
    DESCRIPTION = "Save images or video with generation_time_ms metadata for Majoor Assets Manager."

    # ------------------------------------------------------------------ #

    def save_video(
        self,
        filename_prefix: str = "MajoorVideo",
        format: str = "mp4 (h264)",
        images: torch.Tensor | None = None,
        video: Any | None = None,
        frame_rate: float = 24.0,
        loop_count: int = 0,
        generation_time_ms: int = -1,
        geninfo_override: Any | None = None,
        audio: dict | None = None,
        crf: int = 19,
        save_first_frame: bool = True,
        prompt: Any | None = None,
        extra_pnginfo: dict | None = None,
        unique_id: Any | None = None,
    ):
        resolved = _resolve_video_inputs(video, images, audio, frame_rate)
        if resolved is None:
            return {"ui": {"videos": []}}
        resolved_images, resolved_fps, resolved_audio = resolved

        gen_time = generation_time_ms if generation_time_ms >= 0 else _get_generation_time_ms()
        num_frames = resolved_images.size(0)

        full_output_folder, filename, _counter, subfolder, _prefix = (
            folder_paths.get_save_image_path(
                filename_prefix,
                self.output_dir,
                resolved_images[0].shape[1],
                resolved_images[0].shape[0],
            )
        )
        counter = _next_counter(full_output_folder, filename)

        # --- PNG sidecar with full metadata ---
        png_metadata = _build_metadata(prompt, extra_pnginfo, gen_time, geninfo_override, unique_id)

        sidecar_file: str | None = None
        if save_first_frame:
            sidecar_file = f"{filename}_{counter:05}.png"
            Image.fromarray(_tensor_to_bytes(resolved_images[0])).save(
                os.path.join(full_output_folder, sidecar_file),
                pnginfo=png_metadata,
                compress_level=4,
            )

        # --- GIF / WebP via Pillow ---
        if format in ("gif", "webp"):
            out_file = _save_animated(
                resolved_images, format, resolved_fps, loop_count,
                full_output_folder, filename, counter,
            )
            return _build_video_ui(out_file, subfolder, self.type, out_file)

        # --- MP4 via PyAV ---
        container_meta = _build_container_metadata(prompt, extra_pnginfo, gen_time, geninfo_override, unique_id)
        out_file = f"{filename}_{counter:05}_.mp4"
        out_path = os.path.join(full_output_folder, out_file)

        _encode_mp4(out_path, resolved_images, resolved_fps, crf, container_meta, resolved_audio, num_frames)

        return _build_video_ui(out_file, subfolder, self.type, sidecar_file)

# ---------------------------------------------------------------------------
# Registration helpers
# ---------------------------------------------------------------------------

NODE_CLASS_MAPPINGS: dict[str, type] = {
    "MajoorGenInfoOverride": MajoorGenInfoOverride,
    "MajoorSaveImage": MajoorSaveImage,
    "MajoorSaveVideo": MajoorSaveVideo,
}

NODE_DISPLAY_NAME_MAPPINGS: dict[str, str] = {
    "MajoorGenInfoOverride": "〽️ Majoor Gen Info Override",
    "MajoorSaveImage": "〽️ Majoor Save Image 💾",
    "MajoorSaveVideo": "〽️ Majoor Save Video 🎬",
}
