"""Explicit metadata override support for Majoor GenInfo."""

from __future__ import annotations

import json
import re
from typing import Any

_OVERRIDE_KEYS = {"majoorgeninfo", "mjrgeninfo", "majooroverride"}
_MAX_TEXT_LEN = 20_000
_MAX_INFO_BLOCKS = 32
_MAX_LORAS = 64
_HEX_COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")


def _clean_model_name(value: Any) -> str | None:
    text = _clean_text(value, max_len=512)
    if not text:
        return None
    name = text.replace("\\", "/").split("/")[-1]
    lower = name.lower()
    for ext in (".safetensors", ".ckpt", ".pt", ".pth", ".bin", ".gguf", ".json"):
        if lower.endswith(ext):
            return name[: -len(ext)]
    return name


def _clean_text(value: Any, *, max_len: int = _MAX_TEXT_LEN) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    return text[:max_len]


def _parse_json_string(value: str) -> Any:
    try:
        return json.loads(value)
    except Exception:
        return None


def _coerce_mapping(value: Any) -> dict[str, Any] | None:
    if isinstance(value, dict):
        return value
    if isinstance(value, str) and value.strip():
        parsed = _parse_json_string(value)
        return parsed if isinstance(parsed, dict) else None
    return None


def _normalized_key(key: Any) -> str:
    text = str(key or "").strip().lower()
    for sep in (":", ".", "-"):
        if sep in text:
            text = text.split(sep)[-1]
    return text.replace("_", "")


def _iter_override_candidates(container: Any, *, depth: int = 0) -> list[dict[str, Any]]:
    if depth > 4 or not isinstance(container, dict):
        return []
    candidates: list[dict[str, Any]] = []
    for key, value in container.items():
        if _normalized_key(key) in _OVERRIDE_KEYS:
            mapping = _coerce_mapping(value)
            if mapping:
                candidates.append(mapping)
        elif isinstance(value, dict) and str(key).lower() in {
            "raw",
            "exif",
            "ffprobe",
            "raw_ffprobe",
            "format",
            "tags",
            "workflow",
        }:
            candidates.extend(_iter_override_candidates(value, depth=depth + 1))
    return candidates


def _mode_allows_override(payload: dict[str, Any]) -> bool:
    mode = payload.get("mode")
    if mode is None:
        return True
    return str(mode).strip().lower() in {"override", "force", "forced"}


def _value_field(value: Any, source: str) -> dict[str, Any] | None:
    if value is None or value == "":
        return None
    return {"value": value, "confidence": "override", "source": source}


def _name_field(value: Any, source: str, *, clean_model: bool = False) -> dict[str, Any] | None:
    name = _clean_model_name(value) if clean_model else _clean_text(value, max_len=512)
    if not name:
        return None
    return {"name": name, "confidence": "override", "source": source}


def _numeric_field(value: Any, source: str, caster: Any) -> dict[str, Any] | None:
    if value is None or value == "":
        return None
    try:
        return {"value": caster(value), "confidence": "override", "source": source}
    except Exception:
        return None


def _set_if_field(out: dict[str, Any], key: str, field: dict[str, Any] | None) -> None:
    if field:
        out[key] = field


def _build_loras(value: Any, source: str) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []
    out: list[dict[str, Any]] = []
    for item in value[:_MAX_LORAS]:
        if not isinstance(item, dict):
            continue
        name = _clean_model_name(item.get("name") or item.get("lora_name"))
        if not name:
            continue
        entry: dict[str, Any] = {"name": name, "confidence": "override", "source": source}
        strength = item.get("strength", item.get("strength_model", item.get("weight")))
        if strength is not None:
            try:
                entry["strength"] = float(strength)
            except Exception:
                pass
        out.append(entry)
    return out


def _build_custom_info(value: Any) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []
    out: list[dict[str, Any]] = []
    for item in value[:_MAX_INFO_BLOCKS]:
        if not isinstance(item, dict):
            continue
        title = _clean_text(item.get("title"), max_len=120)
        content = _clean_text(item.get("content"), max_len=_MAX_TEXT_LEN)
        if not title or not content:
            continue
        block = {"title": title, "content": content}
        color = _clean_text(item.get("color"), max_len=16)
        if color and _HEX_COLOR_RE.match(color):
            block["color"] = color
        out.append(block)
    return out


def build_geninfo_override(metadata: Any) -> dict[str, Any] | None:
    candidates = _iter_override_candidates(metadata)
    for payload in candidates:
        out = _normalize_override_payload(payload)
        if out:
            return out
    return None


def merge_geninfo_override(base: Any, override: Any) -> dict[str, Any] | None:
    """Apply an override payload on top of normally parsed geninfo.

    Empty fields are omitted by ``build_geninfo_override`` and therefore fall
    back to ``base``. The override badge is preserved by marking the engine,
    even when only one field was explicitly overridden.
    """
    if not isinstance(base, dict) and not isinstance(override, dict):
        return None
    if not isinstance(override, dict):
        return dict(base) if isinstance(base, dict) else None
    if not isinstance(base, dict):
        return dict(override)

    merged = dict(base)
    base_engine_raw = base.get("engine")
    override_engine_raw = override.get("engine")
    base_engine: dict[str, Any] = base_engine_raw if isinstance(base_engine_raw, dict) else {}
    override_engine: dict[str, Any] = override_engine_raw if isinstance(override_engine_raw, dict) else {}
    merged["engine"] = {
        **base_engine,
        **override_engine,
        "mode": "override",
        "source": override_engine.get("source") or "majoor_geninfo",
        "parser_version": override_engine.get("parser_version") or "geninfo-override-v1",
    }

    for key, value in override.items():
        if key == "engine":
            continue
        merged[key] = value

    checkpoint = merged.get("checkpoint")
    if checkpoint:
        models = dict(merged.get("models") or {}) if isinstance(merged.get("models"), dict) else {}
        models["checkpoint"] = checkpoint
        merged["models"] = models
    return merged


def _normalize_override_payload(payload: dict[str, Any]) -> dict[str, Any] | None:
    if not _mode_allows_override(payload):
        return None
    source = "majoor_geninfo"
    out: dict[str, Any] = {
        "engine": {
            "parser_version": "geninfo-override-v1",
            "source": source,
            "mode": "override",
        }
    }

    positive = payload.get("positive", payload.get("positive_prompt", payload.get("prompt")))
    negative = payload.get("negative", payload.get("negative_prompt"))
    _set_if_field(out, "positive", _value_field(_clean_text(positive), source))
    _set_if_field(out, "negative", _value_field(_clean_text(negative), source))
    _set_if_field(out, "seed", _numeric_field(payload.get("seed"), source, int))
    _set_if_field(out, "steps", _numeric_field(payload.get("steps"), source, int))
    _set_if_field(out, "cfg", _numeric_field(payload.get("cfg", payload.get("cfg_scale")), source, float))
    _set_if_field(out, "denoise", _numeric_field(payload.get("denoise"), source, float))
    _set_if_field(out, "sampler", _name_field(payload.get("sampler"), source))
    _set_if_field(out, "scheduler", _name_field(payload.get("scheduler"), source))

    checkpoint = payload.get("checkpoint", payload.get("ckpt_name", payload.get("model")))
    _set_if_field(out, "checkpoint", _name_field(checkpoint, source, clean_model=True))
    _set_if_field(out, "vae", _name_field(payload.get("vae"), source, clean_model=True))
    _set_if_field(out, "clip", _name_field(payload.get("clip"), source, clean_model=True))
    if out.get("checkpoint"):
        out["models"] = {"checkpoint": out["checkpoint"]}

    loras = _build_loras(payload.get("loras"), source)
    if loras:
        out["loras"] = loras

    notes = _clean_text(payload.get("notes", payload.get("workflow_notes")))
    if notes:
        out["notes"] = {"value": notes, "confidence": "override", "source": source}

    custom_info = _build_custom_info(payload.get("custom_info"))
    if custom_info:
        out["custom_info"] = custom_info

    return out if len(out) > 1 else None
