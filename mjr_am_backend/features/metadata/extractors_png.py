"""
PNG-specific metadata extraction helpers.
"""

from __future__ import annotations

from typing import Any


def read_png_text_chunks(file_path: str) -> dict[str, Any]:
    """Best-effort PNG text chunk reader for prompt/workflow fallback."""
    try:
        from PIL import Image
    except Exception:
        return {}

    try:
        with Image.open(file_path) as img:
            info = dict(getattr(img, "info", {}) or {})
    except Exception:
        return {}

    out: dict[str, Any] = {}
    for key in (
        "prompt",
        "workflow",
        "parameters",
        "generation_time_ms",
        "majoor_geninfo",
        "MajoorOverride",
        "job_id",
        "prompt_id",
        "workflow_id",
        "source_node_id",
    ):
        value = info.get(key)
        if isinstance(value, str) and value.strip():
            out[f"PNG:{key.capitalize()}"] = value
    return out


def _merge_png_exif(
    exif_data: dict[str, Any] | None,
    read_png_text_chunks: Any,
    file_path: str,
) -> dict[str, Any]:
    png_text_exif = read_png_text_chunks(file_path)
    merged: dict[str, Any] = {}
    if isinstance(exif_data, dict):
        merged.update(exif_data)
    for key, value in png_text_exif.items():
        merged.setdefault(key, value)
    return merged


def _resolve_workflow_and_prompt(
    merged_exif: dict[str, Any],
    inspect_json_field: Any,
    merge_workflow_prompt_candidate: Any,
    merge_scanned_workflow_prompt: Any,
) -> tuple[Any, Any]:
    potential_workflow = inspect_json_field(
        merged_exif,
        ("PNG:Workflow", "Keys:Workflow", "comfyui:workflow"),
    )
    potential_prompt = inspect_json_field(
        merged_exif,
        ("PNG:Prompt", "Keys:Prompt", "comfyui:prompt"),
    )
    workflow, prompt, _ = merge_workflow_prompt_candidate(potential_workflow, None, None)
    workflow, prompt, _ = merge_workflow_prompt_candidate(potential_prompt, workflow, prompt)
    if workflow is None or prompt is None:
        workflow, prompt = merge_scanned_workflow_prompt(workflow, prompt, merged_exif)
    return workflow, prompt


def _apply_png_parameters(
    metadata: dict[str, Any],
    merged_exif: dict[str, Any],
    parse_auto1111_params: Any,
    bump_quality: Any,
    build_a1111_geninfo: Any,
) -> None:
    png_params = merged_exif.get("PNG:Parameters")
    if not png_params:
        return
    metadata["parameters"] = png_params
    bump_quality(metadata, "partial")
    parsed = parse_auto1111_params(png_params)
    if parsed:
        metadata.update(parsed)
        metadata["geninfo"] = build_a1111_geninfo(parsed) or {}


def extract_png_metadata_impl(
    file_path: str,
    exif_data: dict[str, Any] | None,
    *,
    exists: Any,
    read_png_text_chunks: Any,
    inspect_json_field: Any,
    merge_workflow_prompt_candidate: Any,
    merge_scanned_workflow_prompt: Any,
    parse_auto1111_params: Any,
    bump_quality: Any,
    build_a1111_geninfo: Any,
    apply_common_exif_fields: Any,
    result_ok: Any,
    result_err: Any,
    error_code: Any,
    logger: Any,
) -> Any:
    if not exists(file_path):
        return result_err(error_code.NOT_FOUND, f"File not found: {file_path}")

    merged_exif = _merge_png_exif(exif_data, read_png_text_chunks, file_path)

    metadata = {
        "raw": merged_exif,
        "workflow": None,
        "prompt": None,
        "parameters": None,
        "quality": "none",
    }
    if not merged_exif:
        return result_ok(metadata, quality="none")

    try:
        workflow, prompt = _resolve_workflow_and_prompt(
            merged_exif, inspect_json_field, merge_workflow_prompt_candidate, merge_scanned_workflow_prompt
        )
        _apply_png_parameters(metadata, merged_exif, parse_auto1111_params, bump_quality, build_a1111_geninfo)
        apply_common_exif_fields(metadata, merged_exif, workflow=workflow, prompt=prompt)
        return result_ok(metadata, quality=metadata["quality"])
    except Exception as exc:
        logger.warning(f"PNG metadata extraction error: {exc}")
        return result_err(error_code.PARSE_ERROR, str(exc), quality="degraded")
