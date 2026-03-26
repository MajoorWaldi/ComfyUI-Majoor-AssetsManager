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
    for key in ("prompt", "workflow", "parameters"):
        value = info.get(key)
        if isinstance(value, str) and value.strip():
            out[f"PNG:{key.capitalize()}"] = value
    return out


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

    png_text_exif = read_png_text_chunks(file_path)
    merged_exif: dict[str, Any] = {}
    if isinstance(exif_data, dict):
        merged_exif.update(exif_data)
    for key, value in png_text_exif.items():
        merged_exif.setdefault(key, value)

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

        png_params = merged_exif.get("PNG:Parameters")
        if png_params:
            metadata["parameters"] = png_params
            bump_quality(metadata, "partial")
            parsed = parse_auto1111_params(png_params)
            if parsed:
                metadata.update(parsed)
                metadata["geninfo"] = build_a1111_geninfo(parsed) or {}

        apply_common_exif_fields(metadata, merged_exif, workflow=workflow, prompt=prompt)
        return result_ok(metadata, quality=metadata["quality"])
    except Exception as exc:
        logger.warning(f"PNG metadata extraction error: {exc}")
        return result_err(error_code.PARSE_ERROR, str(exc), quality="degraded")
