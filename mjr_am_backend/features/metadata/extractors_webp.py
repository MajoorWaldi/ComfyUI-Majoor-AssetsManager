"""
WEBP-specific metadata extraction helpers.
"""

from __future__ import annotations

from typing import Any


def try_merge_webp_json_candidate(
    candidate_text: str,
    workflow: dict[str, Any] | None,
    prompt: dict[str, Any] | None,
    *,
    try_parse_json_text: Any,
    merge_workflow_prompt_candidate: Any,
) -> tuple[dict[str, Any] | None, dict[str, Any] | None, bool]:
    parsed_json = try_parse_json_text(candidate_text)
    if parsed_json is None:
        return workflow, prompt, False
    return merge_workflow_prompt_candidate(parsed_json, workflow, prompt)


def apply_webp_auto1111_candidate(
    metadata: dict[str, Any],
    candidate_text: str,
    prompt: dict[str, Any] | None,
    *,
    parse_auto1111_params: Any,
    bump_quality: Any,
) -> None:
    parsed_a1111 = parse_auto1111_params(candidate_text)
    if not parsed_a1111:
        return
    metadata["parameters"] = candidate_text
    metadata.update(parsed_a1111)
    if metadata.get("quality") != "full":
        bump_quality(metadata, "partial")
    if prompt is None and not metadata.get("prompt") and parsed_a1111.get("prompt"):
        metadata["prompt"] = parsed_a1111["prompt"]


def scan_webp_text_fields(
    metadata: dict[str, Any],
    exif_data: dict[str, Any],
    workflow: dict[str, Any] | None,
    prompt: dict[str, Any] | None,
    *,
    webp_text_keys: tuple[str, ...],
    try_merge_webp_json_candidate: Any,
    apply_webp_auto1111_candidate: Any,
) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    for key in webp_text_keys:
        candidate = exif_data.get(key)
        if not isinstance(candidate, str) or not candidate:
            continue
        workflow, prompt, matched = try_merge_webp_json_candidate(candidate, workflow, prompt)
        if matched:
            continue
        apply_webp_auto1111_candidate(metadata, candidate, prompt)
    return workflow, prompt


def extract_webp_metadata_impl(
    file_path: str,
    exif_data: dict[str, Any] | None,
    *,
    exists: Any,
    inspect_json_field: Any,
    webp_workflow_keys: tuple[str, ...],
    webp_prompt_keys: tuple[str, ...],
    merge_workflow_prompt_candidate: Any,
    merge_scanned_workflow_prompt: Any,
    scan_webp_text_fields: Any,
    apply_common_exif_fields: Any,
    result_ok: Any,
    result_err: Any,
    error_code: Any,
    logger: Any,
) -> Any:
    if not exists(file_path):
        return result_err(error_code.NOT_FOUND, f"File not found: {file_path}")

    metadata = {
        "raw": exif_data or {},
        "workflow": None,
        "prompt": None,
        "quality": "none",
    }
    if not exif_data:
        return result_ok(metadata, quality="none")

    try:
        workflow = None
        prompt = None

        potential_workflow = inspect_json_field(exif_data, webp_workflow_keys)
        potential_prompt = inspect_json_field(exif_data, webp_prompt_keys)
        workflow, prompt, _ = merge_workflow_prompt_candidate(potential_workflow, workflow, prompt)
        workflow, prompt, _ = merge_workflow_prompt_candidate(potential_prompt, workflow, prompt)

        if workflow is None or prompt is None:
            workflow, prompt = merge_scanned_workflow_prompt(workflow, prompt, exif_data)

        workflow, prompt = scan_webp_text_fields(metadata, exif_data, workflow, prompt)
        apply_common_exif_fields(metadata, exif_data, workflow=workflow, prompt=prompt)
        return result_ok(metadata, quality=metadata["quality"])
    except Exception as exc:
        logger.warning(f"WEBP metadata extraction error: {exc}")
        return result_err(error_code.PARSE_ERROR, str(exc), quality="degraded")
