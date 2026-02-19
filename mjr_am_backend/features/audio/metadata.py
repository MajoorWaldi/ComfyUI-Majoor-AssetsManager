"""
Audio metadata/geninfo extraction helpers.
"""

from __future__ import annotations

import os
from typing import Any, Dict, Optional, Tuple, List

from ...shared import ErrorCode, Result
from ..metadata.parsing_utils import (
    looks_like_comfyui_prompt_graph,
    looks_like_comfyui_workflow,
    parse_auto1111_params,
    parse_json_value,
    try_parse_json_text,
)
from ..metadata.extractors import extract_rating_tags_from_exif


def _extract_json_fields(container: Any) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
    if not isinstance(container, dict):
        return (None, None)
    workflow = None
    prompt = None
    for key, value in container.items():
        parsed = parse_json_value(value)
        if not isinstance(parsed, dict):
            continue
        key_lower = str(key or "").lower()
        workflow, prompt = _merge_workflow_prompt_candidate(workflow, prompt, parsed, key_lower)
        if workflow is not None and prompt is not None:
            break
    return (workflow, prompt)


def _merge_workflow_prompt_candidate(
    workflow: Optional[Dict[str, Any]],
    prompt: Optional[Dict[str, Any]],
    parsed: Dict[str, Any],
    key_lower: str,
) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
    workflow = _workflow_candidate_or_existing(workflow, parsed, key_lower)
    prompt = _prompt_candidate_or_existing(prompt, parsed, key_lower)
    return workflow, prompt


def _workflow_candidate_or_existing(
    workflow: Optional[Dict[str, Any]],
    parsed: Dict[str, Any],
    key_lower: str,
) -> Optional[Dict[str, Any]]:
    if workflow is not None:
        return workflow
    if looks_like_comfyui_workflow(parsed):
        return parsed
    if "workflow" in key_lower and looks_like_comfyui_workflow(parsed):
        return parsed
    return workflow


def _prompt_candidate_or_existing(
    prompt: Optional[Dict[str, Any]],
    parsed: Dict[str, Any],
    key_lower: str,
) -> Optional[Dict[str, Any]]:
    if prompt is not None:
        return prompt
    if looks_like_comfyui_prompt_graph(parsed):
        return parsed
    if "prompt" in key_lower and looks_like_comfyui_prompt_graph(parsed):
        return parsed
    return prompt


def _unwrap_workflow_prompt_container(container: Any) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
    """
    Handle wrapper payloads embedded in a single text field/tag, e.g:
    {"workflow": {...}, "prompt": "{...json...}"}
    """
    if not isinstance(container, dict):
        return (None, None)

    wf = container.get("workflow") or container.get("Workflow") or None
    pr = container.get("prompt") or container.get("Prompt") or None
    return _coerce_wrapped_workflow_prompt(wf, pr)


def _coerce_wrapped_workflow_prompt(
    workflow_value: Any,
    prompt_value: Any,
) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
    wf_out = _coerce_wrapped_workflow(workflow_value)
    pr_out = _coerce_wrapped_prompt(prompt_value)
    return wf_out, pr_out


def _coerce_wrapped_workflow(workflow_value: Any) -> Optional[Dict[str, Any]]:
    if isinstance(workflow_value, dict) and looks_like_comfyui_workflow(workflow_value):
        return workflow_value
    return None


def _coerce_wrapped_prompt(prompt_value: Any) -> Optional[Dict[str, Any]]:
    if isinstance(prompt_value, dict) and looks_like_comfyui_prompt_graph(prompt_value):
        return prompt_value
    if isinstance(prompt_value, str):
        parsed = try_parse_json_text(prompt_value)
        if isinstance(parsed, dict) and looks_like_comfyui_prompt_graph(parsed):
            return parsed
    return None


def _scan_for_workflow_prompt(*containers: Any) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
    """
    Robust scan across one or multiple metadata containers.
    """
    workflow: Optional[Dict[str, Any]] = None
    prompt: Optional[Dict[str, Any]] = None

    for container in containers:
        if not isinstance(container, dict):
            continue

        workflow, prompt = _scan_single_workflow_prompt_container(container, workflow=workflow, prompt=prompt)
        if workflow is not None and prompt is not None:
            break

    return (workflow, prompt)


def _scan_single_workflow_prompt_container(
    container: Dict[str, Any],
    *,
    workflow: Optional[Dict[str, Any]],
    prompt: Optional[Dict[str, Any]],
) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
    wf, pr = _extract_json_fields(container)
    workflow = workflow or wf
    prompt = prompt or pr
    if workflow is not None and prompt is not None:
        return workflow, prompt
    return _scan_wrapper_payload_candidates(container, workflow=workflow, prompt=prompt)


def _scan_wrapper_payload_candidates(
    container: Dict[str, Any],
    *,
    workflow: Optional[Dict[str, Any]],
    prompt: Optional[Dict[str, Any]],
) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
    for value in container.values():
        parsed = parse_json_value(value)
        if not isinstance(parsed, dict):
            continue
        wf2, pr2 = _unwrap_workflow_prompt_container(parsed)
        workflow = workflow or wf2
        prompt = prompt or pr2
        if workflow is not None and prompt is not None:
            break
    return workflow, prompt


def _init_audio_metadata(
    exif_data: Dict[str, Any],
    ffprobe_data: Dict[str, Any],
) -> Dict[str, Any]:
    return {
        "raw": exif_data,
        "raw_ffprobe": ffprobe_data,
        "workflow": None,
        "prompt": None,
        "parameters": None,
        "duration": None,
        "audio_codec": None,
        "sample_rate": None,
        "channels": None,
        "bitrate": None,
        "quality": "none",
    }


def _extract_ffprobe_parts(ffprobe_data: Dict[str, Any]) -> tuple[Dict[str, Any], Dict[str, Any], Dict[str, Any], List[Dict[str, Any]]]:
    if not isinstance(ffprobe_data, dict):
        return {}, {}, {}, []

    audio_stream = _dict_field(ffprobe_data, "audio_stream")
    fmt = _dict_field(ffprobe_data, "format")
    format_tags = _dict_field(fmt, "tags")
    stream_tag_dicts = _stream_tag_dicts(ffprobe_data.get("streams"))
    return audio_stream, fmt, format_tags, stream_tag_dicts


def _dict_field(container: Any, key: str) -> Dict[str, Any]:
    if not isinstance(container, dict):
        return {}
    value = container.get(key) or {}
    return value if isinstance(value, dict) else {}


def _stream_tag_dicts(streams: Any) -> List[Dict[str, Any]]:
    tags_list: List[Dict[str, Any]] = []
    if not isinstance(streams, list):
        return tags_list
    for stream in streams:
        if not isinstance(stream, dict):
            continue
        tags = stream.get("tags")
        if isinstance(tags, dict):
            tags_list.append(tags)
    return tags_list


def _apply_audio_technical_fields(
    metadata: Dict[str, Any],
    audio_stream: Dict[str, Any],
    fmt: Dict[str, Any],
) -> None:
    if isinstance(audio_stream, dict):
        metadata["audio_codec"] = audio_stream.get("codec_name")
        metadata["sample_rate"] = audio_stream.get("sample_rate")
        metadata["channels"] = audio_stream.get("channels")
        metadata["bitrate"] = audio_stream.get("bit_rate")
        metadata["duration"] = audio_stream.get("duration")
    if metadata.get("duration") is None and isinstance(fmt, dict):
        metadata["duration"] = fmt.get("duration")
        if metadata.get("bitrate") is None:
            metadata["bitrate"] = fmt.get("bit_rate")


def _apply_workflow_prompt_quality(
    metadata: Dict[str, Any],
    workflow: Optional[Dict[str, Any]],
    prompt: Optional[Dict[str, Any]],
) -> None:
    if workflow is not None:
        metadata["workflow"] = workflow
        metadata["quality"] = "full"
    if prompt is not None:
        metadata["prompt"] = prompt
        if metadata.get("quality") != "full":
            metadata["quality"] = "partial"


def _collect_audio_text_candidates(
    exif_data: Dict[str, Any],
    fmt: Dict[str, Any],
) -> List[str]:
    text_candidates: List[str] = []
    if isinstance(exif_data, dict):
        text_candidates.extend(v for v in exif_data.values() if isinstance(v, str))
    if isinstance(fmt, dict) and isinstance(fmt.get("tags"), dict):
        tags_dict = fmt.get("tags")
        if isinstance(tags_dict, dict):
            text_candidates.extend(v for v in tags_dict.values() if isinstance(v, str))
    return text_candidates


def _apply_auto1111_candidates(
    metadata: Dict[str, Any],
    text_candidates: List[str],
) -> None:
    for text in text_candidates:
        text_s = str(text or "").strip()
        if text_s.startswith("{") or text_s.startswith("["):
            continue
        parsed = parse_auto1111_params(text)
        if not parsed:
            continue
        metadata["parameters"] = text
        for key, value in parsed.items():
            if key in ("workflow", "prompt") and isinstance(metadata.get(key), dict):
                continue
            metadata[key] = value
        if metadata.get("quality") != "full":
            metadata["quality"] = "partial"
        break


def _apply_audio_rating_tags(metadata: Dict[str, Any], exif_data: Dict[str, Any]) -> None:
    rating, tags = extract_rating_tags_from_exif(exif_data)
    if rating is not None:
        metadata["rating"] = rating
    if tags:
        metadata["tags"] = tags


def extract_audio_metadata(
    file_path: str,
    exif_data: Optional[Dict[str, Any]] = None,
    ffprobe_data: Optional[Dict[str, Any]] = None,
) -> Result[Dict[str, Any]]:
    """
    Extract audio technical metadata + embedded generation metadata when present.
    """
    if not os.path.exists(file_path):
        return Result.Err(ErrorCode.NOT_FOUND, f"File not found: {file_path}")

    exif_data = exif_data or {}
    ffprobe_data = ffprobe_data or {}
    metadata: Dict[str, Any] = _init_audio_metadata(exif_data, ffprobe_data)

    try:
        audio_stream, fmt, format_tags, stream_tag_dicts = _extract_ffprobe_parts(ffprobe_data)
        _apply_audio_technical_fields(metadata, audio_stream, fmt)
        workflow, prompt = _scan_for_workflow_prompt(exif_data, format_tags, *stream_tag_dicts)
        _apply_workflow_prompt_quality(metadata, workflow, prompt)
        text_candidates = _collect_audio_text_candidates(exif_data, fmt)
        _apply_auto1111_candidates(metadata, text_candidates)
        _apply_audio_rating_tags(metadata, exif_data)
        if metadata.get("quality") == "none" and (exif_data or ffprobe_data):
            metadata["quality"] = "partial"

        return Result.Ok(metadata, quality=metadata["quality"])
    except Exception as exc:
        return Result.Err(ErrorCode.PARSE_ERROR, str(exc), quality="degraded")
