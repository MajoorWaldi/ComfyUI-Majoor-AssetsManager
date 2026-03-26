"""
Video-specific metadata extraction helpers.
"""

from __future__ import annotations

from typing import Any


def apply_video_ffprobe_fields(metadata: dict[str, Any], ffprobe_data: dict[str, Any] | None) -> None:
    if not isinstance(ffprobe_data, dict):
        return
    video_stream = ffprobe_data.get("video_stream", {})
    format_info = ffprobe_data.get("format", {})
    metadata["resolution"] = (video_stream.get("width"), video_stream.get("height"))
    metadata["fps"] = video_stream.get("r_frame_rate")
    metadata["duration"] = format_info.get("duration")


def scan_video_workflow_prompt_from_sources(
    exif_data: dict[str, Any],
    ffprobe_data: dict[str, Any] | None,
    *,
    inspect_json_field: Any,
    video_workflow_keys: tuple[str, ...],
    video_prompt_keys: tuple[str, ...],
    merge_workflow_prompt_candidate: Any,
    merge_scanned_workflow_prompt: Any,
    extract_ffprobe_format_tags: Any,
    extract_ffprobe_stream_tag_dicts: Any,
) -> tuple[dict[str, Any] | None, dict[str, Any] | None, dict[str, Any], list[dict[str, Any]]]:
    workflow: dict[str, Any] | None = None
    prompt: dict[str, Any] | None = None

    potential_workflow = inspect_json_field(exif_data, video_workflow_keys)
    potential_prompt = inspect_json_field(exif_data, video_prompt_keys)
    workflow, prompt, _ = merge_workflow_prompt_candidate(potential_workflow, workflow, prompt)
    workflow, prompt, _ = merge_workflow_prompt_candidate(potential_prompt, workflow, prompt)
    if workflow is None or prompt is None:
        workflow, prompt = merge_scanned_workflow_prompt(workflow, prompt, exif_data)

    format_tags = extract_ffprobe_format_tags(ffprobe_data)
    if workflow is None or prompt is None:
        workflow, prompt = merge_scanned_workflow_prompt(workflow, prompt, format_tags)

    stream_tag_dicts = extract_ffprobe_stream_tag_dicts(ffprobe_data)
    if workflow is None or prompt is None:
        for tags in stream_tag_dicts:
            workflow, prompt = merge_scanned_workflow_prompt(workflow, prompt, tags)
            if workflow is not None and prompt is not None:
                break
    return workflow, prompt, format_tags, stream_tag_dicts


def collect_video_text_candidates(
    exif_data: dict[str, Any],
    format_tags: dict[str, Any],
    stream_tag_dicts: list[dict[str, Any]],
    *,
    collect_text_candidates: Any,
) -> list[tuple[str, str]]:
    text_candidates = collect_text_candidates(exif_data)
    if format_tags:
        text_candidates.extend(collect_text_candidates(format_tags))
    for tags in stream_tag_dicts:
        text_candidates.extend(collect_text_candidates(tags))
    return text_candidates


def extract_video_metadata_impl(
    file_path: str,
    exif_data: dict[str, Any] | None,
    ffprobe_data: dict[str, Any] | None,
    *,
    exists: Any,
    apply_video_ffprobe_fields: Any,
    scan_video_workflow_prompt_from_sources: Any,
    collect_video_text_candidates: Any,
    apply_auto1111_text_candidates: Any,
    apply_common_exif_fields: Any,
    result_ok: Any,
    result_err: Any,
    error_code: Any,
    logger: Any,
) -> Any:
    if not exists(file_path):
        return result_err(error_code.NOT_FOUND, f"File not found: {file_path}")

    exif_data = exif_data or {}
    metadata = {
        "raw": exif_data or {},
        "raw_ffprobe": ffprobe_data or {},
        "workflow": None,
        "prompt": None,
        "resolution": None,
        "fps": None,
        "duration": None,
        "quality": "none",
    }

    try:
        apply_video_ffprobe_fields(metadata, ffprobe_data)
        workflow, prompt, format_tags, stream_tag_dicts = scan_video_workflow_prompt_from_sources(exif_data, ffprobe_data)
        text_candidates = collect_video_text_candidates(exif_data, format_tags, stream_tag_dicts)
        apply_auto1111_text_candidates(
            metadata,
            text_candidates,
            prompt_graph=prompt,
            preserve_existing_prompt_text=False,
        )
        apply_common_exif_fields(metadata, exif_data, workflow=workflow, prompt=prompt)
        return result_ok(metadata, quality=metadata["quality"])
    except Exception as exc:
        logger.warning(f"Video metadata extraction error: {exc}")
        return result_err(error_code.PARSE_ERROR, str(exc), quality="degraded")
