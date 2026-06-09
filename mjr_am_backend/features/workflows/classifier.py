"""Workflow graph classification helpers."""

from __future__ import annotations

import re
from typing import Any

from .models import WorkflowDetectionResult

_MODEL_ALIASES: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("Qwen", ("qwen", "qwenimage", "qwen-image", "qwen_image", "qwen_image_edit", "qwenimageedit")),
    ("Wan", ("wan", "wan2.1", "wan2.2", "wanvideo", "wan 2")),
    ("Flux", ("flux", "flux kontext", "kontext", "black forest", "blackforest", "bfl")),
    ("LTX", ("ltx", "ltxv")),
    ("Seedance", ("seedance", "seedream", "bytedance", "byte dance")),
    ("SDXL", ("sdxl", "sd_xl", "sd-xl", "juggernaut-xl", "juggernaut xl", "xl_base")),
    ("Zimage", ("zimage", "z-image", "zimage turbo", "z-image turbo")),
    ("Ideogram", ("ideogram",)),
    ("Hunyuan", ("hunyuan", "hunyuanvideo")),
    ("Kling", ("kling",)),
    ("Veo", ("veo", "googleveo")),
    ("Grok", ("grok", "xai")),
    ("Stable Diffusion", ("stable diffusion", "sd15", "sd1.5")),
)

_PROVIDER_ALIASES: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("Google", ("google", "gemini", "veo")),
    ("ByteDance", ("bytedance", "byte dance", "seedance", "seedream")),
    ("OpenAI", ("openai", "gpt-image", "gptimage")),
    ("Runway", ("runway",)),
    ("Kling", ("kling",)),
    ("Grok", ("grok", "xai")),
    ("Luma", ("luma",)),
    ("MiniMax", ("minimax", "hailuo")),
    ("Ideogram", ("ideogram",)),
    ("Recraft", ("recraft",)),
)

_API_NODE_HINTS = ("api", "google", "gemini", "veo", "kling", "runway", "luma", "minimax", "ideogram", "recraft", "gpt")
_LOCAL_API_FALSE_POSITIVES = ("sam2", "sam-2", "segmentanything", "segment anything", "impact", "maskapi")


def _compact(value: Any) -> str:
    return re.sub(r"[^a-z0-9]+", "", str(value or "").lower())


def _node_type(node: dict[str, Any]) -> str:
    return str(node.get("type") or node.get("class_type") or "").strip()


def _node_title(node: dict[str, Any]) -> str:
    return str(node.get("title") or node.get("_meta", {}).get("title") or "").strip()


def _node_strings(node: dict[str, Any]) -> list[str]:
    out = [_node_type(node), _node_title(node)]
    widgets = node.get("widgets_values")
    if isinstance(widgets, list):
        out.extend(str(v) for v in widgets if isinstance(v, str) and v.strip())
    inputs = node.get("inputs")
    if isinstance(inputs, dict):
        out.extend(str(v) for v in inputs.values() if isinstance(v, str) and v.strip())
    elif isinstance(inputs, list):
        for item in inputs:
            if isinstance(item, dict):
                out.extend(str(v) for v in item.values() if isinstance(v, str) and v.strip())
    return out


def workflow_node_text(nodes: list[dict[str, Any]] | None) -> str:
    return " ".join(" ".join(_node_strings(node)) for node in nodes or [] if isinstance(node, dict))


def _detect_alias(text: str, aliases: tuple[tuple[str, tuple[str, ...]], ...]) -> str:
    lower = str(text or "").lower()
    compact = _compact(lower)
    for label, candidates in aliases:
        for candidate in candidates:
            if candidate in lower or _compact(candidate) in compact:
                return label
    return ""


def _explicit_metadata(metadata: dict[str, Any] | None) -> dict[str, str]:
    src = metadata if isinstance(metadata, dict) else {}
    return {
        "task": str(src.get("task") or src.get("workflow_type") or "").strip(),
        "model_family": str(src.get("model_family") or src.get("model") or src.get("checkpoint") or "").strip(),
        "provider": str(src.get("provider") or src.get("api_provider") or "").strip(),
        "runs_on": str(src.get("runs_on") or "").strip().lower(),
    }


def _collect_graph_signals(nodes: list[dict[str, Any]] | None) -> dict[str, Any]:
    node_list = [node for node in nodes or [] if isinstance(node, dict)]
    types = [_node_type(node) for node in node_list]
    compact_types = [_compact(t) for t in types]
    model_texts = []
    all_texts = []
    for node in node_list:
        node_type = _compact(_node_type(node))
        strings = _node_strings(node)
        all_texts.extend(strings)
        if any(key in node_type for key in ("checkpoint", "unetloader", "loadeffusionmodel", "loraloader", "diffusionmodel")):
            model_texts.extend(strings)
    all_text = " ".join(all_texts)
    model_text = " ".join(model_texts) or all_text
    flags = _graph_type_flags(compact_types)
    return {
        "node_count": len(node_list),
        "node_types": types[:120],
        **flags,
        "model_text": model_text[:4000],
        "graph_text": all_text[:4000],
    }


def _is_video_sink_type(text: str) -> bool:
    return (
        "savevideo" in text
        or "videocombine" in text
        or "vhs" in text
        or ("video" in text and any(hint in text for hint in ("generation", "generate", "qwen", "google", "veo", "wan", "ltx")))
    )


def _graph_type_flags(compact_types: list[str]) -> dict[str, bool]:
    api_types = [t for t in compact_types if any(hint in t for hint in _API_NODE_HINTS)]
    return {
        "has_image_input": _has_type(compact_types, "loadimage", "imageinput", "referenceimage", "ipadapter"),
        "has_video_input": _has_type(compact_types, "loadvideo", "videoinput"),
        "has_audio_input": _has_type(compact_types, "loadaudio", "audioinput"),
        "has_image_sink": _has_type(compact_types, "saveimage", "previewimage"),
        "has_video_sink": any(_is_video_sink_type(t) for t in compact_types),
        "has_audio_sink": _has_type(compact_types, "saveaudio", "vhsaudio", "tts"),
        "has_mask_edit": _has_type(compact_types, "inpaint", "outpaint", "mask", "fill"),
        "has_upscale_model": _has_type(compact_types, "upscalemodel", "loadupscale"),
        "has_upscale_step": _has_type(compact_types, "upscale", "imagescale"),
        "has_api_node": any(not any(false in t for false in _LOCAL_API_FALSE_POSITIVES) for t in api_types),
    }


def _has_type(types: list[str], *needles: str) -> bool:
    return any(any(needle in item for needle in needles) for item in types)


def _detect_task(signals: dict[str, Any]) -> tuple[str, float]:
    image_in = bool(signals.get("has_image_input"))
    video_in = bool(signals.get("has_video_input"))
    audio_in = bool(signals.get("has_audio_input"))
    image_out = bool(signals.get("has_image_sink"))
    video_out = bool(signals.get("has_video_sink"))
    audio_out = bool(signals.get("has_audio_sink"))
    if audio_out and not image_out and not video_out:
        return "Audio", 0.92
    if signals.get("has_mask_edit") and (image_out or not video_out):
        return "Image Edit", 0.9
    if signals.get("has_upscale_model") and not video_out:
        return "Upscale", 0.84
    if video_in and video_out:
        return "Video Edit", 0.92
    if video_in and image_out:
        return "I2I", 0.78
    if image_in and video_out:
        return "I2V", 0.9
    if image_in and image_out:
        return "I2I", 0.86
    if video_out and not image_in and not video_in and not audio_in:
        return "T2V", 0.86
    if image_out:
        return "T2I", 0.72
    return "Workflow", 0.45


def _apply_text_fallback(signals: dict[str, Any], text: str) -> None:
    if signals.get("node_count") or not text:
        return
    fallback = str(text or "").lower()
    compact = _compact(fallback)
    video_model = any(name in compact for name in ("seedance", "seedream", "wan", "ltx", "veo", "kling"))
    signals.update(
        {
            "has_image_input": "loadimage" in compact or "imageinput" in compact,
            "has_video_input": "loadvideo" in compact or "videoinput" in compact,
            "has_audio_input": "loadaudio" in compact or "audioinput" in compact,
            "has_video_sink": "video" in fallback or "t2v" in compact or "i2v" in compact or video_model,
            "has_image_sink": "saveimage" in compact or "image edit" in fallback or "inpaint" in fallback,
            "has_audio_sink": "audio" in fallback or "tts" in fallback,
            "has_mask_edit": "inpaint" in fallback or "outpaint" in fallback or "mask" in fallback,
            "has_upscale_model": "upscale" in fallback,
            "has_api_node": "cloud" in fallback or "provider" in fallback,
            "model_text": fallback,
            "graph_text": fallback,
        }
    )


def _detect_model_provider(signals: dict[str, Any], text: str, file_hint: str) -> tuple[str, str, str]:
    source = "graph" if signals.get("node_count") else "filename"
    model_family = _detect_alias(str(signals.get("model_text") or ""), _MODEL_ALIASES)
    provider = _detect_alias(str(signals.get("graph_text") or ""), _PROVIDER_ALIASES)
    if not model_family:
        model_family = _detect_alias(text, _MODEL_ALIASES)
    if not provider:
        provider = _detect_alias(text, _PROVIDER_ALIASES)
    if not model_family and file_hint:
        model_family = _detect_alias(file_hint, _MODEL_ALIASES)
        if model_family:
            source = "filename"
    if not provider and file_hint:
        provider = _detect_alias(file_hint, _PROVIDER_ALIASES)
    return model_family, provider, source


def _apply_explicit_metadata(
    *,
    explicit: dict[str, str],
    task: str,
    model_family: str,
    provider: str,
    confidence: float,
    source: str,
) -> tuple[str, str, str, float, str]:
    if explicit["task"]:
        task = explicit["task"]
        confidence = max(confidence, 0.96)
        source = "metadata"
    if explicit["model_family"]:
        model_family = _detect_alias(explicit["model_family"], _MODEL_ALIASES) or explicit["model_family"]
        confidence = max(confidence, 0.96)
        source = "metadata"
    if explicit["provider"]:
        provider = _detect_alias(explicit["provider"], _PROVIDER_ALIASES) or explicit["provider"]
        confidence = max(confidence, 0.96)
        source = "metadata"
    return task, model_family, provider, confidence, source


def classify_workflow(
    text: str = "",
    nodes: list[dict[str, Any]] | None = None,
    *,
    metadata: dict[str, Any] | None = None,
    file_hint: str = "",
) -> WorkflowDetectionResult:
    explicit = _explicit_metadata(metadata)
    signals = _collect_graph_signals(nodes)
    _apply_text_fallback(signals, text)
    task, confidence = _detect_task(signals)
    model_family, provider, source = _detect_model_provider(signals, text, file_hint)
    if source == "filename":
        confidence = min(confidence, 0.55)
    task, model_family, provider, confidence, source = _apply_explicit_metadata(
        explicit=explicit,
        task=task,
        model_family=model_family,
        provider=provider,
        confidence=confidence,
        source=source,
    )
    runs_on = explicit["runs_on"] or ("api" if signals.get("has_api_node") or provider else "local")
    signals.update(
        {
            "explicit_metadata": {k: v for k, v in explicit.items() if v},
            "detected_model_family": model_family,
            "detected_provider": provider,
        }
    )
    return WorkflowDetectionResult(
        task=task,
        model_family=model_family,
        provider=provider,
        runs_on=runs_on,
        confidence=round(min(0.99, confidence + (0.04 if model_family else 0) + (0.03 if provider else 0)), 3),
        source=source,
        signals=signals,
    )
