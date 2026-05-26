"""Generic GenInfo extraction for unknown ComfyUI/custom-node graphs."""

from __future__ import annotations

from typing import Any

from .graph_converter import _inputs, _is_link, _node_type

_VALUE_FIELD_KEYS: dict[str, tuple[str, ...]] = {
    "seed": ("seed", "noise_seed", "rand_seed", "random_seed"),
    "steps": ("steps", "num_steps", "sampling_steps"),
    "cfg": ("cfg", "cfg_scale", "guidance", "guidance_scale"),
    "denoise": ("denoise", "denoise_strength", "strength"),
}

_NAME_FIELD_KEYS: dict[str, tuple[str, ...]] = {
    "sampler": ("sampler_name", "sampler"),
    "scheduler": ("scheduler", "scheduler_name"),
    "checkpoint": ("ckpt_name", "checkpoint", "checkpoint_name", "model_name", "unet_name", "diffusion_name"),
    "vae": ("vae_name", "vae"),
    "clip": ("clip_name", "clip"),
}

_PROMPT_KEYS: tuple[str, ...] = (
    "positive",
    "positive_prompt",
    "prompt",
    "text",
    "text_g",
    "text_l",
    "caption",
    "description",
)

_NEGATIVE_KEYS: tuple[str, ...] = ("negative", "negative_prompt", "neg_prompt")

_MODEL_EXTS: tuple[str, ...] = (".safetensors", ".ckpt", ".pt", ".pth", ".bin", ".gguf")


def _source(node: dict[str, Any], node_id: str, key: str) -> str:
    return f"{_node_type(node)}:{node_id}:{key}"


def _clean_string(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    text = value.strip()
    return text or None


def _is_scalar(value: Any) -> bool:
    return isinstance(value, (str, int, float, bool)) and not isinstance(value, bool)


def _looks_like_prompt(value: Any) -> bool:
    text = _clean_string(value)
    if not text or len(text) < 6:
        return False
    if all(ch.isdigit() or ch.isspace() or ch in ".,+-" for ch in text):
        return False
    return any(ch.isalpha() for ch in text)


def _clean_model_name(value: Any) -> str | None:
    text = _clean_string(value)
    if not text:
        return None
    name = text.replace("\\", "/").split("/")[-1]
    lower = name.lower()
    for ext in _MODEL_EXTS:
        if lower.endswith(ext):
            return name[: -len(ext)]
    return name


def _set_value(out: dict[str, Any], key: str, value: Any, source: str, confidence: str = "low") -> None:
    if key in out or value is None or value == "":
        return
    out[key] = {"value": value, "confidence": confidence, "source": source}


def _set_name(out: dict[str, Any], key: str, value: Any, source: str, confidence: str = "low") -> None:
    if key in out:
        return
    name = _clean_model_name(value) if key in {"checkpoint", "vae", "clip"} else _clean_string(value)
    if not name:
        return
    out[key] = {"name": name, "confidence": confidence, "source": source}


def _iter_input_scalars(node: dict[str, Any]) -> list[tuple[str, Any]]:
    values: list[tuple[str, Any]] = []
    for key, value in _inputs(node).items():
        if _is_link(value) or not _is_scalar(value):
            continue
        values.append((str(key), value))
    widgets = node.get("widgets_values")
    if isinstance(widgets, dict):
        for key, value in widgets.items():
            if _is_scalar(value):
                values.append((str(key), value))
    return values


def _apply_field_patterns(out: dict[str, Any], node: dict[str, Any], node_id: str, key: str, value: Any) -> None:
    lower_key = key.lower()
    src = _source(node, node_id, key)
    for field, names in _VALUE_FIELD_KEYS.items():
        if lower_key in names:
            _set_value(out, field, value, src)
    for field, names in _NAME_FIELD_KEYS.items():
        if lower_key in names:
            _set_name(out, field, value, src)


def _apply_prompt_patterns(out: dict[str, Any], node: dict[str, Any], node_id: str, key: str, value: Any) -> None:
    if not _looks_like_prompt(value):
        return
    lower_key = key.lower()
    src = _source(node, node_id, key)
    if lower_key in _NEGATIVE_KEYS or lower_key.startswith("negative_"):
        _set_value(out, "negative", str(value).strip(), src)
        return
    if lower_key in _PROMPT_KEYS or lower_key.startswith("positive_"):
        _set_value(out, "positive", str(value).strip(), src)


def _collect_raw_summary(nodes_by_id: dict[str, Any]) -> dict[str, Any]:
    types: dict[str, int] = {}
    for node in nodes_by_id.values():
        if not isinstance(node, dict):
            continue
        node_type = _node_type(node) or "Unknown"
        types[node_type] = types.get(node_type, 0) + 1
    return {"node_count": len(nodes_by_id), "node_types": types}


def extract_generic_geninfo(nodes_by_id: dict[str, Any]) -> dict[str, Any]:
    """Best-effort generic fields for graphs not covered by typed extractors."""
    out: dict[str, Any] = {}
    for node_id, node in nodes_by_id.items():
        if not isinstance(node, dict):
            continue
        node_type = _node_type(node).lower()
        if "majoorgeninfooverride" in node_type or "geninfooverride" in node_type:
            continue
        for key, value in _iter_input_scalars(node):
            _apply_field_patterns(out, node, str(node_id), key, value)
            _apply_prompt_patterns(out, node, str(node_id), key, value)
    if out:
        out["generic_fields"] = {
            "confidence": "low",
            "source": "generic_graph_scan",
            "raw_summary": _collect_raw_summary(nodes_by_id),
        }
    return out
