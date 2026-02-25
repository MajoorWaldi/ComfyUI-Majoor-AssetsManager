"""Metadata extraction helper registry functions extracted from service.py."""
import logging
import os
from typing import Any

from ...probe_router import pick_probe_backend
from ...shared import Result, classify_file
from ..geninfo.parser import parse_geninfo_from_prompt
from .extractors import extract_png_metadata, extract_video_metadata, extract_webp_metadata
from .parsing_utils import parse_auto1111_params

logger = logging.getLogger(__name__)


def clean_model_name(value: Any) -> str | None:
    if value is None:
        return None
    s = str(value).strip()
    if not s:
        return None
    s = s.replace("\\", "/").split("/")[-1]
    lower = s.lower()
    for ext in (".safetensors", ".ckpt", ".pt", ".pth", ".bin", ".gguf", ".json"):
        if lower.endswith(ext):
            return s[: -len(ext)]
    return s


def merge_parsed_params(meta: dict[str, Any]) -> dict[str, Any]:
    parsed_meta = dict(meta)
    params_text = parsed_meta.get("parameters")
    if not isinstance(params_text, str) or not params_text.strip():
        return parsed_meta
    parsed_params = parse_auto1111_params(params_text)
    if parsed_params:
        for key, value in parsed_params.items():
            if value is not None:
                parsed_meta[key] = value
    return parsed_meta


def has_any_parameter_signal(*values: Any) -> bool:
    return any(value is not None and value != "" for value in values)


def apply_prompt_fields(out: dict[str, Any], pos: Any, neg: Any) -> None:
    if isinstance(pos, str) and pos.strip():
        out["positive"] = {"value": pos.strip(), "confidence": "high", "source": "parameters"}
    if isinstance(neg, str) and neg.strip():
        out["negative"] = {"value": neg.strip(), "confidence": "high", "source": "parameters"}


def apply_sampler_fields(out: dict[str, Any], sampler: Any, scheduler: Any) -> None:
    if sampler is not None:
        out["sampler"] = {"name": str(sampler), "confidence": "high", "source": "parameters"}
    if scheduler is not None:
        out["scheduler"] = {"name": str(scheduler), "confidence": "high", "source": "parameters"}


def set_numeric_field(out: dict[str, Any], key: str, value: Any, caster) -> None:
    if value is None:
        return
    try:
        out[key] = {"value": caster(value), "confidence": "high", "source": "parameters"}
    except Exception:
        return


def apply_numeric_fields(out: dict[str, Any], steps: Any, cfg: Any, seed: Any) -> None:
    set_numeric_field(out, "steps", steps, int)
    set_numeric_field(out, "cfg", cfg, float)
    set_numeric_field(out, "seed", seed, int)


def apply_size_field(out: dict[str, Any], width: Any, height: Any) -> None:
    if width is None or height is None:
        return
    try:
        out["size"] = {"width": int(width), "height": int(height), "confidence": "high", "source": "parameters"}
    except Exception:
        return


def apply_checkpoint_fields(out: dict[str, Any], model: Any) -> None:
    ckpt = clean_model_name(model)
    if not ckpt:
        return
    out["checkpoint"] = {"name": ckpt, "confidence": "high", "source": "parameters"}
    out["models"] = {"checkpoint": out["checkpoint"]}


def build_geninfo_from_parameters(meta: dict[str, Any]) -> dict[str, Any] | None:
    if not isinstance(meta, dict):
        return None
    parsed_meta = merge_parsed_params(meta)
    pos = parsed_meta.get("prompt")
    neg = parsed_meta.get("negative_prompt")
    steps = parsed_meta.get("steps")
    sampler = parsed_meta.get("sampler")
    scheduler = parsed_meta.get("scheduler")
    cfg = parsed_meta.get("cfg")
    seed = parsed_meta.get("seed")
    w = parsed_meta.get("width")
    h = parsed_meta.get("height")
    model = parsed_meta.get("model")
    if not has_any_parameter_signal(pos, neg, steps, sampler, cfg, seed, w, h, model):
        return {}
    out: dict[str, Any] = {"engine": {"parser_version": "geninfo-params-v1", "source": "parameters"}}
    apply_prompt_fields(out, pos, neg)
    apply_sampler_fields(out, sampler, scheduler)
    apply_numeric_fields(out, steps, cfg, seed)
    apply_size_field(out, w, h)
    apply_checkpoint_fields(out, model)
    return out if len(out.keys()) > 1 else None


def collect_prompt_graph_types(prompt_graph: dict[str, Any]) -> list[str]:
    types: list[str] = []
    for node in prompt_graph.values():
        if not isinstance(node, dict):
            continue
        ct = str(node.get("class_type") or node.get("type") or "").lower()
        if ct:
            types.append(ct)
    return types


def has_generation_sampler(types: list[str]) -> bool:
    if any(("ksampler" in token and "select" not in token) or ("samplercustom" in token) for token in types):
        return True
    return any("sampler" in token and "select" not in token for token in types)


def classify_media_nodes(types: list[str]) -> tuple[bool, bool, bool]:
    has_load = any("loadvideo" in token or "vhs_loadvideo" in token for token in types)
    has_combine = any("videocombine" in token or "video_combine" in token or "vhs_videocombine" in token for token in types)
    has_save = any(token.startswith("save") or "savevideo" in token or "savegif" in token or "saveanimatedwebp" in token for token in types)
    return has_load, has_combine, has_save


def looks_like_media_pipeline(prompt_graph: Any) -> bool:
    if not isinstance(prompt_graph, dict) or not prompt_graph:
        return False
    try:
        types = collect_prompt_graph_types(prompt_graph)
        if not types:
            return False
        if has_generation_sampler(types):
            return False
        has_load, has_combine, has_save = classify_media_nodes(types)
        return has_load and (has_combine or has_save)
    except Exception:
        return False


def should_parse_geninfo(meta: dict[str, Any]) -> bool:
    try:
        if not isinstance(meta, dict):
            return False
        if isinstance(meta.get("prompt"), dict) and meta.get("prompt"):
            return True
        if isinstance(meta.get("workflow"), dict) and meta.get("workflow"):
            return True
        params = meta.get("parameters")
        return isinstance(params, str) and bool(params.strip())
    except Exception:
        return False


def group_existing_paths(paths: list[str]) -> tuple[list[str], list[str], list[str], list[str]]:
    images: list[str] = []
    videos: list[str] = []
    audios: list[str] = []
    others: list[str] = []
    for path in paths:
        if not os.path.exists(path):
            continue
        kind = classify_file(path)
        if kind == "image":
            images.append(path)
        elif kind == "video":
            videos.append(path)
        elif kind == "audio":
            audios.append(path)
        else:
            others.append(path)
    return images, videos, audios, others


def build_batch_probe_targets(paths: list[str], probe_mode: str) -> tuple[list[str], list[str]]:
    exif_targets: list[str] = []
    ffprobe_targets: list[str] = []
    seen_exif: set[str] = set()
    seen_ffprobe: set[str] = set()
    for path in paths:
        backends = pick_probe_backend(path, settings_override=probe_mode)
        if "exiftool" in backends and path not in seen_exif:
            seen_exif.add(path)
            exif_targets.append(path)
        if "ffprobe" in backends and path not in seen_ffprobe:
            seen_ffprobe.add(path)
            ffprobe_targets.append(path)
    return exif_targets, ffprobe_targets


def batch_tool_data(result_map: dict[str, Result[dict[str, Any]]], path: str) -> dict[str, Any] | None:
    item = result_map.get(path)
    return item.data if item and item.ok else None


def extract_workflow_only_payload(kind: str, ext: str, file_path: str, exif_data: dict[str, Any]) -> Result[dict[str, Any]]:
    if kind == "image":
        if ext == ".png":
            return extract_png_metadata(file_path, exif_data)
        if ext == ".webp":
            return extract_webp_metadata(file_path, exif_data)
        return Result.Ok({"workflow": None, "prompt": None, "quality": "none"}, quality="none")
    return extract_video_metadata(file_path, exif_data, ffprobe_data=None)


def extract_image_by_extension(file_path: str, ext: str, exif_data: dict[str, Any] | None) -> Result[dict[str, Any]]:
    if ext == ".png":
        return extract_png_metadata(file_path, exif_data)
    if ext == ".webp":
        return extract_webp_metadata(file_path, exif_data)
    return Result.Ok({"workflow": None, "prompt": None, "quality": "partial" if exif_data else "none"})


def build_image_metadata_payload(file_path: str, file_info: dict[str, Any], exif_data: dict[str, Any] | None, metadata_result: Result[dict[str, Any]]) -> dict[str, Any]:
    return {"file_info": file_info, "exif": exif_data, **(metadata_result.data or {})}


def expand_video_resolution_fields(metadata_result: Result[dict[str, Any]]) -> None:
    data = metadata_result.data or {}
    if not data.get("resolution"):
        return
    try:
        w, h = data["resolution"]
        data["width"] = w
        data["height"] = h
    except (ValueError, TypeError):
        return


def expand_resolution_scalars(payload: dict[str, Any]) -> None:
    resolution = payload.get("resolution")
    if not resolution:
        return
    if payload.get("width") is not None and payload.get("height") is not None:
        return
    dims = coerce_resolution_pair(resolution)
    if dims is None:
        return
    w, h = dims
    if payload.get("width") is None:
        payload["width"] = coerce_dimension_value(w)
    if payload.get("height") is None:
        payload["height"] = coerce_dimension_value(h)


def coerce_resolution_pair(resolution: Any) -> tuple[Any, Any] | None:
    try:
        w, h = resolution
        return w, h
    except Exception:
        return None


def coerce_dimension_value(value: Any) -> Any:
    try:
        return int(value) if value is not None else None
    except Exception:
        return value
