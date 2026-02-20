"""
Audio metadata/geninfo extraction helpers.
"""

from __future__ import annotations

import os
from typing import Any

from ...shared import ErrorCode, Result
from ..metadata.extractors import extract_rating_tags_from_exif
from ..metadata.parsing_utils import (
    looks_like_comfyui_prompt_graph,
    looks_like_comfyui_workflow,
    parse_auto1111_params,
    parse_json_value,
    try_parse_json_text,
)


def _extract_json_fields(container: Any) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
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
    workflow: dict[str, Any] | None,
    prompt: dict[str, Any] | None,
    parsed: dict[str, Any],
    key_lower: str,
) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    workflow = _workflow_candidate_or_existing(workflow, parsed, key_lower)
    prompt = _prompt_candidate_or_existing(prompt, parsed, key_lower)
    return workflow, prompt


def _workflow_candidate_or_existing(
    workflow: dict[str, Any] | None,
    parsed: dict[str, Any],
    key_lower: str,
) -> dict[str, Any] | None:
    if workflow is not None:
        return workflow
    if looks_like_comfyui_workflow(parsed):
        return parsed
    if "workflow" in key_lower and looks_like_comfyui_workflow(parsed):
        return parsed
    return workflow


def _prompt_candidate_or_existing(
    prompt: dict[str, Any] | None,
    parsed: dict[str, Any],
    key_lower: str,
) -> dict[str, Any] | None:
    if prompt is not None:
        return prompt
    if looks_like_comfyui_prompt_graph(parsed):
        return parsed
    if "prompt" in key_lower and looks_like_comfyui_prompt_graph(parsed):
        return parsed
    return prompt


def _unwrap_workflow_prompt_container(container: Any) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
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
) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    wf_out = _coerce_wrapped_workflow(workflow_value)
    pr_out = _coerce_wrapped_prompt(prompt_value)
    return wf_out, pr_out


def _coerce_wrapped_workflow(workflow_value: Any) -> dict[str, Any] | None:
    if isinstance(workflow_value, dict) and looks_like_comfyui_workflow(workflow_value):
        return workflow_value
    return None


def _coerce_wrapped_prompt(prompt_value: Any) -> dict[str, Any] | None:
    if isinstance(prompt_value, dict) and looks_like_comfyui_prompt_graph(prompt_value):
        return prompt_value
    if isinstance(prompt_value, str):
        parsed = try_parse_json_text(prompt_value)
        if isinstance(parsed, dict) and looks_like_comfyui_prompt_graph(parsed):
            return parsed
    return None


def _scan_for_workflow_prompt(*containers: Any) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    """
    Robust scan across one or multiple metadata containers.
    """
    workflow: dict[str, Any] | None = None
    prompt: dict[str, Any] | None = None

    for container in containers:
        if not isinstance(container, dict):
            continue

        workflow, prompt = _scan_single_workflow_prompt_container(container, workflow=workflow, prompt=prompt)
        if workflow is not None and prompt is not None:
            break

    return (workflow, prompt)


def _scan_single_workflow_prompt_container(
    container: dict[str, Any],
    *,
    workflow: dict[str, Any] | None,
    prompt: dict[str, Any] | None,
) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    wf, pr = _extract_json_fields(container)
    workflow = workflow or wf
    prompt = prompt or pr
    if workflow is not None and prompt is not None:
        return workflow, prompt
    return _scan_wrapper_payload_candidates(container, workflow=workflow, prompt=prompt)


def _scan_wrapper_payload_candidates(
    container: dict[str, Any],
    *,
    workflow: dict[str, Any] | None,
    prompt: dict[str, Any] | None,
) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
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
    exif_data: dict[str, Any],
    ffprobe_data: dict[str, Any],
) -> dict[str, Any]:
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


def _extract_ffprobe_parts(ffprobe_data: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any], list[dict[str, Any]]]:
    if not isinstance(ffprobe_data, dict):
        return {}, {}, {}, []

    audio_stream = _dict_field(ffprobe_data, "audio_stream")
    fmt = _dict_field(ffprobe_data, "format")
    format_tags = _dict_field(fmt, "tags")
    stream_tag_dicts = _stream_tag_dicts(ffprobe_data.get("streams"))
    return audio_stream, fmt, format_tags, stream_tag_dicts


def _dict_field(container: Any, key: str) -> dict[str, Any]:
    if not isinstance(container, dict):
        return {}
    value = container.get(key) or {}
    return value if isinstance(value, dict) else {}


def _stream_tag_dicts(streams: Any) -> list[dict[str, Any]]:
    tags_list: list[dict[str, Any]] = []
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
    metadata: dict[str, Any],
    audio_stream: dict[str, Any],
    fmt: dict[str, Any],
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
    metadata: dict[str, Any],
    workflow: dict[str, Any] | None,
    prompt: dict[str, Any] | None,
) -> None:
    if workflow is not None:
        metadata["workflow"] = workflow
        metadata["quality"] = "full"
    if prompt is not None:
        metadata["prompt"] = prompt
        if metadata.get("quality") != "full":
            metadata["quality"] = "partial"


def _collect_audio_text_candidates(
    exif_data: dict[str, Any],
    fmt: dict[str, Any],
) -> list[str]:
    text_candidates: list[str] = []
    if isinstance(exif_data, dict):
        text_candidates.extend(v for v in exif_data.values() if isinstance(v, str))
    if isinstance(fmt, dict) and isinstance(fmt.get("tags"), dict):
        tags_dict = fmt.get("tags")
        if isinstance(tags_dict, dict):
            text_candidates.extend(v for v in tags_dict.values() if isinstance(v, str))
    return text_candidates


def _apply_auto1111_candidates(
    metadata: dict[str, Any],
    text_candidates: list[str],
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


def _apply_audio_rating_tags(metadata: dict[str, Any], exif_data: dict[str, Any]) -> None:
    rating, tags = extract_rating_tags_from_exif(exif_data)
    if rating is not None:
        metadata["rating"] = rating
    if tags:
        metadata["tags"] = tags


def extract_audio_metadata(
    file_path: str,
    exif_data: dict[str, Any] | None = None,
    ffprobe_data: dict[str, Any] | None = None,
) -> Result[dict[str, Any]]:
    """
    Extract audio technical metadata + embedded generation metadata when present.
    """
    if not os.path.exists(file_path):
        return Result.Err(ErrorCode.NOT_FOUND, f"File not found: {file_path}")

    exif_data = exif_data or {}
    ffprobe_data = ffprobe_data or {}
    metadata: dict[str, Any] = _init_audio_metadata(exif_data, ffprobe_data)

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
