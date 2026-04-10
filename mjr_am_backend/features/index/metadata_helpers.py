"""
Metadata helpers - shared utilities for metadata operations.
"""

import asyncio
import hashlib
import json
import re
import time
from datetime import datetime, timedelta, timezone
from typing import Any

from ...adapters.db.sqlite import Sqlite
from ...config import (
    MAX_METADATA_JSON_BYTES,
    METADATA_CACHE_CLEANUP_INTERVAL_SECONDS,
    METADATA_CACHE_MAX,
    METADATA_CACHE_TTL_SECONDS,
)
from ...shared import Result, get_logger
from ...utils import sanitize_for_json
from ..metadata.parsing_utils import (
    looks_like_comfyui_prompt_graph,
    looks_like_comfyui_workflow,
    try_parse_json_text,
)

MAX_TAG_LENGTH = 100
logger = get_logger(__name__)
_METADATA_CACHE_CLEANUP_LOCK = asyncio.Lock()
_METADATA_CACHE_LAST_CLEANUP = 0.0
_SAMPLER_PARAM_RE = re.compile(r"(?:^|\n)\s*Sampler\s*:\s*([^\n,]+)", re.IGNORECASE)
_MODEL_PARAM_RE = re.compile(r"(?:^|\n)\s*Model\s*:\s*([^\n,]+)", re.IGNORECASE)
_GENERATION_TIME_WITH_UNIT_RE = re.compile(
    r"^\s*(-?\d+(?:[.,]\d+)?)\s*"
    r"(ms|msec|millisecond|milliseconds|s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours)"
    r"\s*$",
    re.IGNORECASE,
)
_TRUNCATION_OPTIONAL_KEYS = (
    "workflow",
    "geninfo",
    "engine",
    "negative_prompt",
    "parameters",
    "positive_prompt",
    "prompt",
    "model",
    "sampler",
    "checkpoint",
    "workflow_type",
)


def _metadata_quality_rank_sql(value_sql: str) -> str:
    return (
        f"CASE {value_sql} WHEN 'full' THEN 3 WHEN 'partial' THEN 2 "
        "WHEN 'degraded' THEN 1 ELSE 0 END"
    )


def _metadata_quality_should_upgrade_sql(*, allow_equal: bool = False) -> str:
    quality_rank_excluded = _metadata_quality_rank_sql("excluded.metadata_quality")
    quality_rank_current = _metadata_quality_rank_sql("COALESCE(asset_metadata.metadata_quality, 'none')")
    op = ">=" if allow_equal else ">"
    return f"({quality_rank_excluded} {op} {quality_rank_current})"


def _metadata_quality_is_equal_sql() -> str:
    quality_rank_excluded = _metadata_quality_rank_sql("excluded.metadata_quality")
    quality_rank_current = _metadata_quality_rank_sql("COALESCE(asset_metadata.metadata_quality, 'none')")
    return f"({quality_rank_excluded} = {quality_rank_current})"


def _metadata_raw_is_empty_sql(value_sql: str) -> str:
    return f"({value_sql} IS NULL OR TRIM({value_sql}) IN ('', '{{}}', 'null'))"


def _metadata_raw_should_replace_on_equal_quality_sql() -> str:
    current_raw_empty = _metadata_raw_is_empty_sql("asset_metadata.metadata_raw")
    excluded_raw_empty = _metadata_raw_is_empty_sql("excluded.metadata_raw")
    excluded_richer = (
        "LENGTH(COALESCE(excluded.metadata_raw, '')) > "
        "LENGTH(COALESCE(asset_metadata.metadata_raw, ''))"
    )
    return f"(NOT {excluded_raw_empty} AND ({current_raw_empty} OR {excluded_richer}))"


def _apply_metadata_json_size_guard(
    asset_id: int,
    metadata_result: Result[dict[str, Any]],
    metadata_raw_json: str,
    filepath: str | None = None,
) -> str:
    max_bytes = _safe_max_metadata_bytes()
    truncated, original_bytes, metadata_raw_json = _truncate_metadata_json_if_needed(
        metadata_raw_json, max_bytes
    )
    if not truncated:
        return metadata_raw_json
    _mark_metadata_truncated(metadata_result, original_bytes=original_bytes, max_bytes=max_bytes)
    _log_metadata_truncation(
        asset_id,
        metadata_result,
        filepath=filepath,
        original_bytes=original_bytes,
        max_bytes=max_bytes,
    )
    return metadata_raw_json


def _safe_max_metadata_bytes() -> int:
    try:
        return int(MAX_METADATA_JSON_BYTES or 0)
    except (TypeError, ValueError):
        return 0


def _truncate_metadata_json_if_needed(metadata_raw_json: str, max_bytes: int) -> tuple[bool, int, str]:
    if not (max_bytes and isinstance(metadata_raw_json, str)):
        return False, 0, metadata_raw_json
    nbytes = _json_payload_size_bytes(metadata_raw_json)
    if nbytes <= max_bytes:
        return False, 0, metadata_raw_json
    candidate = _build_truncated_metadata_candidate(metadata_raw_json, nbytes=nbytes, max_bytes=max_bytes)
    if candidate is not None:
        return True, int(nbytes), candidate
    return True, int(nbytes), _fallback_truncated_metadata_json(nbytes)


def _build_truncated_metadata_candidate(metadata_raw_json: str, *, nbytes: int, max_bytes: int) -> str | None:
    try:
        data = json.loads(metadata_raw_json)
    except (TypeError, ValueError, json.JSONDecodeError):
        return None
    if not isinstance(data, dict):
        return None
    candidate_dict = _priority_metadata_candidate(data, original_bytes=int(nbytes), max_bytes=max_bytes)
    return _fit_truncated_metadata_candidate(candidate_dict, max_bytes=max_bytes)


def _fit_truncated_metadata_candidate(candidate_dict: dict[str, Any], *, max_bytes: int) -> str | None:
    candidate = _dump_compact_json(candidate_dict)
    if _json_payload_size_bytes(candidate) <= max_bytes:
        return candidate
    reduced = dict(candidate_dict)
    for key in _TRUNCATION_OPTIONAL_KEYS:
        if key not in reduced:
            continue
        reduced.pop(key, None)
        candidate = _dump_compact_json(reduced)
        if _json_payload_size_bytes(candidate) <= max_bytes:
            return candidate
    return None


def _fallback_truncated_metadata_json(nbytes: int) -> str:
    try:
        return json.dumps(
            {"_truncated": True, "original_bytes": int(nbytes)},
            ensure_ascii=False,
            separators=(",", ":"),
        )
    except (TypeError, ValueError):
        return "{}"


def _priority_metadata_candidate(data: dict[str, Any], *, original_bytes: int, max_bytes: int) -> dict[str, Any]:
    text_budget = _priority_text_budget(max_bytes)
    candidate = _priority_metadata_base(data, original_bytes=original_bytes)
    _append_priority_scalar_fields(candidate, data)
    _append_priority_text_fields(candidate, data, text_budget=text_budget)
    _append_priority_named_fields(candidate, data, text_budget=text_budget)
    _append_priority_nested_fields(candidate, data, text_budget=text_budget)
    return candidate


def _priority_metadata_base(data: dict[str, Any], *, original_bytes: int) -> dict[str, Any]:
    candidate: dict[str, Any] = {
        "_truncated": True,
        "original_bytes": int(original_bytes),
    }
    if "quality" in data:
        candidate["quality"] = data.get("quality")
    if "workflow" in data:
        candidate["workflow"] = {"_truncated": True}
    return candidate


def _append_priority_scalar_fields(candidate: dict[str, Any], data: dict[str, Any]) -> None:
    for key in ("workflow_type", "seed", "steps", "cfg", "cfg_scale", "scheduler", "width", "height"):
        value = data.get(key)
        if value not in (None, "", [], {}):
            candidate[key] = value


def _append_priority_text_fields(candidate: dict[str, Any], data: dict[str, Any], *, text_budget: int) -> None:
    prompt_text = _best_effort_prompt_text(data, text_budget=text_budget)
    if prompt_text:
        candidate["prompt"] = prompt_text
    negative_prompt = _best_effort_negative_prompt_text(data, text_budget=text_budget)
    if negative_prompt:
        candidate["negative_prompt"] = negative_prompt
    positive_prompt = _compact_text_value(data.get("positive_prompt"), max_chars=text_budget)
    if positive_prompt:
        candidate["positive_prompt"] = positive_prompt
    parameters = _compact_text_value(data.get("parameters"), max_chars=text_budget)
    if parameters:
        candidate["parameters"] = parameters
    workflow_type = _best_effort_workflow_type(data)
    if workflow_type:
        candidate["workflow_type"] = workflow_type


def _append_priority_named_fields(candidate: dict[str, Any], data: dict[str, Any], *, text_budget: int) -> None:
    model_name = _best_effort_model_name(data, text_budget=text_budget)
    if model_name:
        candidate["model"] = model_name
    sampler_name = _best_effort_sampler_name(data, text_budget=text_budget)
    if sampler_name:
        candidate["sampler"] = sampler_name
    checkpoint = _compact_named_value(data.get("checkpoint"), max_chars=text_budget)
    if checkpoint:
        candidate["checkpoint"] = checkpoint


def _append_priority_nested_fields(candidate: dict[str, Any], data: dict[str, Any], *, text_budget: int) -> None:
    engine = _compact_engine_value(data.get("engine"), max_chars=text_budget)
    if engine:
        candidate["engine"] = engine
    geninfo = _compact_geninfo_value(data.get("geninfo"), max_chars=text_budget)
    if geninfo:
        candidate["geninfo"] = geninfo


def _priority_text_budget(max_bytes: int) -> int:
    return max(64, min(2048, int(max_bytes // 3) if max_bytes > 0 else 256))


def _json_payload_size_bytes(payload: str) -> int:
    try:
        return len(payload.encode("utf-8", errors="ignore"))
    except (AttributeError, TypeError, UnicodeError):
        return 0


def _dump_compact_json(value: dict[str, Any]) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def _resolve_key_path(value: Any, key_path: str) -> Any:
    current = value
    for part in key_path.split("."):
        if not isinstance(current, dict):
            return None
        current = current.get(part)
    return current


def _compact_text_value(value: Any, *, max_chars: int) -> str | None:
    if isinstance(value, str):
        cleaned = " ".join(value.split()).strip()
        if not cleaned:
            return None
        return cleaned[:max_chars]
    if isinstance(value, list):
        joined = " ".join(str(item).strip() for item in value if isinstance(item, str) and str(item).strip())
        return _compact_text_value(joined, max_chars=max_chars)
    return None


def _compact_named_value(value: Any, *, max_chars: int) -> str | None:
    if isinstance(value, dict):
        for key in ("name", "value", "type", "model", "checkpoint"):
            compact = _compact_text_value(value.get(key), max_chars=max_chars)
            if compact:
                return compact
        return None
    return _compact_text_value(value, max_chars=max_chars)


def _best_effort_prompt_text(meta: dict[str, Any], *, text_budget: int) -> str | None:
    for key_path in (
        "prompt",
        "parameters",
        "geninfo.prompt",
        "geninfo.positive.value",
        "geninfo.positive.text",
        "geninfo.positive_prompt",
        "positive_prompt",
        "sd_prompt",
        "generation.prompt",
        "workflow.prompt",
        "comfy.positive",
        "comfyui.positive",
        "dream.prompt",
        "invokeai.positive_conditioning",
    ):
        compact = _compact_text_value(_resolve_key_path(meta, key_path), max_chars=text_budget)
        if compact:
            return compact
    return None


def _best_effort_negative_prompt_text(meta: dict[str, Any], *, text_budget: int) -> str | None:
    for key_path in (
        "negative_prompt",
        "geninfo.negative.value",
        "geninfo.negative.text",
        "geninfo.negative_prompt",
        "comfy.negative",
        "comfyui.negative",
        "invokeai.negative_conditioning",
    ):
        compact = _compact_text_value(_resolve_key_path(meta, key_path), max_chars=text_budget)
        if compact:
            return compact

    params = meta.get("parameters")
    if isinstance(params, str):
        neg_marker = params.lower().find("negative prompt:")
        if neg_marker >= 0:
            neg_text = params[neg_marker + len("negative prompt:"):]
            steps_match = re.search(r"(?:^|\n)\s*steps\s*:\s*\d+", neg_text, re.IGNORECASE)
            if steps_match:
                neg_text = neg_text[:steps_match.start()]
            compact = _compact_text_value(neg_text, max_chars=text_budget)
            if compact:
                return compact
    return None


def _best_effort_workflow_type(meta: dict[str, Any]) -> str | None:
    for key_path in ("workflow_type", "geninfo.engine.type", "engine.type"):
        value = _resolve_key_path(meta, key_path)
        if isinstance(value, str) and value.strip():
            return value.strip().upper()
    return None


def _best_effort_generation_time_ms(meta: dict[str, Any]) -> int | None:
    for key_path in (
        "generation_time_ms",
        "geninfo.generation_time_ms",
        "generation.time_ms",
        "generation_time",
        "geninfo.generation_time",
        "timing.generation_time_ms",
        "timing.total_ms",
        "timing.elapsed_ms",
        "metrics.generation_time_ms",
    ):
        value = _resolve_key_path(meta, key_path)
        parsed = _parse_generation_time_ms(value)
        if parsed is not None:
            return parsed
    return None


def _parse_generation_time_ms(value: Any) -> int | None:
    if value in (None, "", [], {}):
        return None
    if isinstance(value, bool):
        return None
    numeric: float
    if isinstance(value, str):
        raw = value.strip().lower()
        if not raw:
            return None
        unit_match = _GENERATION_TIME_WITH_UNIT_RE.match(raw)
        if unit_match:
            numeric = float(unit_match.group(1).replace(",", "."))
            unit = unit_match.group(2)
            if unit.startswith("h"):
                numeric *= 3_600_000
            elif unit.startswith("m") and not unit.startswith("ms"):
                numeric *= 60_000
            elif unit.startswith("s"):
                numeric *= 1000
        else:
            try:
                numeric = float(raw.replace(",", "."))
            except (TypeError, ValueError):
                return None
    else:
        try:
            numeric = float(value)
        except (TypeError, ValueError):
            return None
    if numeric <= 0:
        return None
    if numeric >= 86_400_000:
        return None
    return int(round(numeric))


def _denormalized_metadata_fields(metadata_result: Result[dict[str, Any]]) -> tuple[str, int | None, str]:
    if not (metadata_result and metadata_result.ok and isinstance(metadata_result.data, dict)):
        return "", None, ""
    meta = metadata_result.data
    workflow_type = _best_effort_workflow_type(meta) or ""
    generation_time_ms = _best_effort_generation_time_ms(meta)
    positive_prompt = _best_effort_prompt_text(meta, text_budget=250) or ""
    return workflow_type, generation_time_ms, positive_prompt


def _best_effort_model_name(meta: dict[str, Any], *, text_budget: int) -> str | None:
    direct = _first_compact_named_value(
        meta,
        (
            "model",
            "model_name",
            "checkpoint",
            "checkpoint.name",
            "geninfo.model",
            "geninfo.checkpoint.name",
        ),
        text_budget=text_budget,
    )
    if direct:
        return direct
    nested = _first_geninfo_model_name(meta.get("geninfo"), text_budget=text_budget)
    if nested:
        return nested
    return _match_parameter_name(meta.get("parameters"), _MODEL_PARAM_RE, text_budget=text_budget)


def _best_effort_sampler_name(meta: dict[str, Any], *, text_budget: int) -> str | None:
    for key_path in (
        "sampler",
        "sampler_name",
        "geninfo.sampler.name",
        "geninfo.sampler.value",
        "geninfo.engine.sampler",
    ):
        compact = _compact_named_value(_resolve_key_path(meta, key_path), max_chars=text_budget)
        if compact:
            return compact

    parameters = meta.get("parameters")
    if isinstance(parameters, str):
        match = _SAMPLER_PARAM_RE.search(parameters)
        if match:
            compact = _compact_text_value(match.group(1), max_chars=text_budget)
            if compact:
                return compact
    return None


def _first_compact_named_value(meta: dict[str, Any], key_paths: tuple[str, ...], *, text_budget: int) -> str | None:
    for key_path in key_paths:
        compact = _compact_named_value(_resolve_key_path(meta, key_path), max_chars=text_budget)
        if compact:
            return compact
    return None


def _iter_geninfo_model_items(geninfo: Any) -> list[Any]:
    if not isinstance(geninfo, dict):
        return []
    models = geninfo.get("models")
    if isinstance(models, dict):
        return list(models.values())
    if isinstance(models, list):
        return list(models)
    return []


def _first_geninfo_model_name(geninfo: Any, *, text_budget: int) -> str | None:
    for item in _iter_geninfo_model_items(geninfo):
        compact = _compact_named_value(item, max_chars=text_budget)
        if compact:
            return compact
    return None


def _match_parameter_name(parameters: Any, pattern: re.Pattern[str], *, text_budget: int) -> str | None:
    if not isinstance(parameters, str):
        return None
    match = pattern.search(parameters)
    if not match:
        return None
    return _compact_text_value(match.group(1), max_chars=text_budget)


def _compact_engine_value(value: Any, *, max_chars: int) -> dict[str, Any] | None:
    if not isinstance(value, dict):
        return None
    compact: dict[str, Any] = {}
    for key in ("type", "name"):
        text = _compact_text_value(value.get(key), max_chars=max_chars)
        if text:
            compact[key] = text
    return compact or None


def _compact_geninfo_node_fields(value: dict[str, Any], compact: dict[str, Any], *, max_chars: int) -> None:
    for key in ("positive", "negative", "sampler", "checkpoint"):
        item = value.get(key)
        if isinstance(item, dict):
            node: dict[str, Any] = {}
            for field in ("value", "text", "name", "type"):
                text = _compact_text_value(item.get(field), max_chars=max_chars)
                if text:
                    node[field] = text
            if node:
                compact[key] = node


def _compact_geninfo_model_entries(value: dict[str, Any], *, max_chars: int) -> list[Any] | None:
    models = value.get("models")
    if not isinstance(models, dict):
        return None
    model_names = [
        name
        for name in (
            _compact_named_value(item, max_chars=max_chars)
            for item in list(models.values())[:3]
        )
        if name
    ]
    return model_names or None


def _compact_geninfo_lora_entries(value: dict[str, Any], *, max_chars: int) -> list[Any] | None:
    loras = value.get("loras")
    if not isinstance(loras, list):
        return None
    lora_names = [
        name
        for name in (
            _compact_named_value(item, max_chars=max_chars)
            for item in loras[:3]
        )
        if name
    ]
    return lora_names or None


def _compact_geninfo_scalar_fields(value: dict[str, Any], compact: dict[str, Any]) -> None:
    for key in ("seed", "steps", "cfg", "cfg_scale", "scheduler"):
        scalar = value.get(key)
        if scalar not in (None, "", [], {}):
            compact[key] = scalar


def _compact_geninfo_value(value: Any, *, max_chars: int) -> dict[str, Any] | None:
    if not isinstance(value, dict):
        return None
    compact: dict[str, Any] = {}

    engine = _compact_engine_value(value.get("engine"), max_chars=max_chars)
    if engine:
        compact["engine"] = engine

    _compact_geninfo_node_fields(value, compact, max_chars=max_chars)

    for key in ("positive_prompt", "negative_prompt", "prompt", "model"):
        text = _compact_text_value(value.get(key), max_chars=max_chars)
        if text:
            compact[key] = text

    model_names = _compact_geninfo_model_entries(value, max_chars=max_chars)
    if model_names:
        compact["models"] = model_names

    lora_names = _compact_geninfo_lora_entries(value, max_chars=max_chars)
    if lora_names:
        compact["loras"] = lora_names

    _compact_geninfo_scalar_fields(value, compact)

    return compact or None


def _mark_metadata_truncated(metadata_result: Result[dict[str, Any]], *, original_bytes: int, max_bytes: int) -> None:
    try:
        metadata_result.meta["truncated"] = True
        metadata_result.meta["original_bytes"] = int(original_bytes)
        metadata_result.meta["max_bytes"] = int(max_bytes)
    except (AttributeError, TypeError) as exc:
        logger.debug("Cannot mark metadata truncated: %s", exc)


def _resolve_metadata_filepath(
    metadata_result: Result[dict[str, Any]], filepath: str | None
) -> str | None:
    if filepath:
        return filepath
    if metadata_result and isinstance(metadata_result.data, dict):
        fp = metadata_result.data.get("filepath")
        return fp if isinstance(fp, str) and fp else None
    return None


def _log_metadata_truncation(
    asset_id: int,
    metadata_result: Result[dict[str, Any]],
    *,
    filepath: str | None,
    original_bytes: int,
    max_bytes: int,
) -> None:
    try:
        fp = _resolve_metadata_filepath(metadata_result, filepath)
        suffix = f" filepath={fp}" if fp else ""
        logger.warning(
            "Metadata JSON truncated for asset_id=%s%s (bytes=%s > max=%s)",
            asset_id,
            suffix,
            original_bytes,
            max_bytes,
        )
    except Exception:
        return


def _sanitize_metadata_tags(raw_tags: Any) -> list[str]:
    if not isinstance(raw_tags, list):
        return []
    cleaned: list[str] = []
    seen: set[str] = set()
    for item in raw_tags:
        if not isinstance(item, str):
            continue
        tag = item.strip()
        if not tag or len(tag) > MAX_TAG_LENGTH or tag in seen:
            continue
        seen.add(tag)
        cleaned.append(tag)
    return cleaned


def _extract_rating_and_tags(metadata_result: Result[dict[str, Any]]) -> tuple[int, str, str]:
    extracted_rating = 0
    extracted_tags_json = "[]"
    extracted_tags_text = ""
    if not (metadata_result and metadata_result.ok and metadata_result.data):
        return extracted_rating, extracted_tags_json, extracted_tags_text

    meta = metadata_result.data
    try:
        rating_val = meta.get("rating")
        if rating_val is not None:
            extracted_rating = max(0, min(5, int(rating_val)))
    except (TypeError, ValueError):
        extracted_rating = 0

    try:
        cleaned = _sanitize_metadata_tags(meta.get("tags"))
        extracted_tags_json = json.dumps(cleaned, ensure_ascii=False)
        extracted_tags_text = " ".join(cleaned)
    except (TypeError, ValueError):
        extracted_tags_json = "[]"
        extracted_tags_text = ""
    return extracted_rating, extracted_tags_json, extracted_tags_text


def _collect_geninfo_extras(meta: dict[str, Any]) -> list[str]:
    extras: list[str] = []
    geninfo = meta.get("geninfo")
    if not isinstance(geninfo, dict):
        return extras

    extras.extend(_collect_named_values(geninfo.get("models"), "name"))
    extras.extend(_collect_named_values(geninfo.get("loras"), "name"))
    extras.extend(_collect_nested_text_values(geninfo, [("positive", "value"), ("engine", "type")]))
    extras.extend(_collect_input_filenames(geninfo.get("inputs")))
    return extras


def _collect_named_values(container: Any, field: str) -> list[str]:
    out: list[str] = []
    values: list[Any]
    if isinstance(container, dict):
        values = list(container.values())
    elif isinstance(container, list):
        values = container
    else:
        return out
    for item in values:
        if not isinstance(item, dict):
            continue
        value = str(item.get(field) or "").strip()
        if value:
            out.append(value)
    return out


def _collect_nested_text_values(geninfo: dict[str, Any], paths: list[tuple[str, str]]) -> list[str]:
    out: list[str] = []
    for parent_key, child_key in paths:
        parent = geninfo.get(parent_key)
        if not isinstance(parent, dict):
            continue
        value = str(parent.get(child_key) or "").strip()
        if value:
            out.append(value)
    return out


def _collect_input_filenames(inputs: Any) -> list[str]:
    out: list[str] = []
    if not isinstance(inputs, list):
        return out
    for item in inputs:
        if not isinstance(item, dict):
            continue
        fname = str(item.get("filename") or "").strip()
        if fname:
            out.append(fname)
    return out


def _enrich_tags_text_with_metadata(
    metadata_result: Result[dict[str, Any]],
    extracted_tags_text: str,
) -> str:
    if not (metadata_result and metadata_result.ok and metadata_result.data):
        return extracted_tags_text
    meta = metadata_result.data
    extras = _collect_geninfo_extras(meta)
    extracted_tags_text = _append_extra_tags(extracted_tags_text, extras)
    _build_metadata_payload_preview(meta, extracted_tags_text, extras)
    return extracted_tags_text


def _append_extra_tags(extracted_tags_text: str, extras: list[str]) -> str:
    if not extras:
        return extracted_tags_text
    extra_text = " ".join(extras)
    if extracted_tags_text:
        return f"{extracted_tags_text} {extra_text}"
    return extra_text


def _build_metadata_payload_preview(meta: dict[str, Any], extracted_tags_text: str, extras: list[str]) -> None:
    # Keep this payload preparation for parity with previous behavior.
    meta_fields = [extracted_tags_text] + extras
    if meta.get("prompt"):
        meta_fields.append(str(meta.get("prompt")))
    if meta.get("parameters"):
        meta_fields.append(str(meta.get("parameters")))
    if meta.get("model"):
        meta_fields.append(str(meta.get("model")))
    if meta.get("workflow_type"):
        meta_fields.append(str(meta.get("workflow_type")))
    if meta.get("metadata_raw"):
        meta_fields.append(str(meta.get("metadata_raw")))
    " ".join([str(f) for f in meta_fields if f])


def _graph_has_sampler(graph: Any) -> bool:
    try:
        # Workflow export: dict with `nodes: []` and nodes have `type`.
        if isinstance(graph, dict) and isinstance(graph.get("nodes"), list):
            for node in graph.get("nodes") or []:
                if _node_looks_like_sampler(node, require_sampling_inputs=False):
                    return True
            return False

        # Prompt graph: dict of nodes with `class_type`.
        if isinstance(graph, dict):
            for node in graph.values():
                if _node_looks_like_sampler(node, require_sampling_inputs=True):
                    return True
            return False
    except Exception:
        return False
    return False


def _node_looks_like_sampler(node: Any, *, require_sampling_inputs: bool) -> bool:
    if not isinstance(node, dict):
        return False
    ct = _sampler_class_type(node)
    if not ct or not _sampler_class_matches(ct):
        return False
    if not require_sampling_inputs:
        return True
    return _sampler_inputs_look_sampling(node.get("inputs"))


def _sampler_class_type(node: dict[str, Any]) -> str:
    return str(node.get("class_type") or node.get("type") or "").lower()


def _sampler_class_matches(ct: str) -> bool:
    if "select" in ct:
        return False
    if "ksampler" in ct or "samplercustom" in ct:
        return True
    return "sampler" in ct


def _sampler_inputs_look_sampling(inputs: Any) -> bool:
    if not isinstance(inputs, dict):
        return False
    return any(key in inputs for key in ("steps", "cfg", "cfg_scale", "seed", "denoise"))


def _coerce_json_dict(value: Any) -> dict[str, Any] | None:
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        parsed = try_parse_json_text(value)
        return parsed if isinstance(parsed, dict) else None
    return None


def _metadata_presence_flags(meta: dict[str, Any]) -> tuple[bool, bool]:
    raw_workflow = meta.get("workflow")
    raw_prompt = meta.get("prompt")
    workflow_obj = _coerce_json_dict(raw_workflow)
    prompt_obj = _coerce_json_dict(raw_prompt)

    has_workflow = _has_workflow_payload(meta, raw_workflow, raw_prompt, workflow_obj, prompt_obj)
    has_generation_data = _has_generation_payload(meta, raw_workflow, raw_prompt, workflow_obj, prompt_obj)
    return has_workflow, has_generation_data


def _has_workflow_payload(
    meta: dict[str, Any],
    raw_workflow: Any,
    raw_prompt: Any,
    workflow_obj: dict[str, Any] | None,
    prompt_obj: dict[str, Any] | None,
) -> bool:
    workflow_ok = bool(workflow_obj and looks_like_comfyui_workflow(workflow_obj))
    prompt_ok = bool(prompt_obj and looks_like_comfyui_prompt_graph(prompt_obj))
    return bool(workflow_ok or prompt_ok or raw_workflow or raw_prompt or meta.get("parameters"))


def _has_generation_payload(
    meta: dict[str, Any],
    raw_workflow: Any,
    raw_prompt: Any,
    workflow_obj: dict[str, Any] | None,
    prompt_obj: dict[str, Any] | None,
) -> bool:
    if meta.get("parameters") or meta.get("geninfo") or meta.get("model") or meta.get("seed"):
        return True
    if _graph_has_sampler(prompt_obj or raw_prompt):
        return True
    return _graph_has_sampler(workflow_obj or raw_workflow)


class MetadataHelpers:
    """
    Shared utilities for metadata operations.

    Provides static methods for metadata caching, field preparation,
    and error handling that are used across multiple components.
    """

    @staticmethod
    def prepare_metadata_fields(metadata_result: Result[dict[str, Any]]) -> tuple[bool | None, bool | None, str, str]:
        """
        Extract the workflow/generation metadata attributes and JSON payload.

        Args:
            metadata_result: Result from metadata extraction

        Returns:
            Tuple of (has_workflow, has_generation_data, metadata_quality, metadata_raw_json)
        """
        has_workflow: bool | None = None
        has_generation_data: bool | None = None
        metadata_quality = "none"
        metadata_raw_json = "{}"

        if metadata_result and metadata_result.ok and isinstance(metadata_result.data, dict) and metadata_result.data:
            meta = metadata_result.data
            has_workflow, has_generation_data = _metadata_presence_flags(meta)

            metadata_quality = meta.get("quality", "none")
            metadata_raw_json = json.dumps(sanitize_for_json(meta))

        return has_workflow, has_generation_data, metadata_quality, metadata_raw_json

    @staticmethod
    def _bool_to_db(value: bool | None) -> int | None:
        if value is True:
            return 1
        if value is False:
            return 0
        return None

    @staticmethod
    def metadata_error_payload(metadata_result: Result[dict[str, Any]], filepath: str) -> Result[dict[str, Any]]:
        """
        Build a degraded metadata payload when extraction failed.

        Args:
            metadata_result: Failed result from metadata extraction
            filepath: File path for context

        Returns:
            Result with degraded payload
        """
        quality = metadata_result.meta.get("quality", "degraded")
        payload = {
            "filepath": filepath,
            "error": metadata_result.error or "Metadata extraction failed",
            "code": metadata_result.code,
            # Persist quality in the payload so downstream DB writes can avoid treating
            # degraded results as "none" and inadvertently downgrading existing metadata.
            "quality": quality,
        }

        for key, value in metadata_result.meta.items():
            if key == "quality" or value is None:
                continue
            payload[key] = value

        return Result.Ok(payload, quality=quality)

    @staticmethod
    async def write_asset_metadata_row(
        db: Sqlite,
        asset_id: int,
        metadata_result: Result[dict[str, Any]],
        filepath: str | None = None,
    ) -> Result[Any]:
        """
        Insert or update the asset_metadata row with the latest metadata flags.

        Args:
            db: Database adapter instance
            asset_id: Asset ID to update
            metadata_result: Result from metadata extraction

        Returns:
            Result from database operation
        """
        has_workflow, has_generation_data, metadata_quality, metadata_raw_json = MetadataHelpers.prepare_metadata_fields(metadata_result)
        db_has_workflow = MetadataHelpers._bool_to_db(has_workflow)
        db_has_generation = MetadataHelpers._bool_to_db(has_generation_data)

        metadata_raw_json = _apply_metadata_json_size_guard(
            asset_id,
            metadata_result,
            metadata_raw_json,
            filepath=filepath,
        )
        extracted_rating, extracted_tags_json, extracted_tags_text = _extract_rating_and_tags(metadata_result)
        extracted_tags_text = _enrich_tags_text_with_metadata(metadata_result, extracted_tags_text)
        workflow_type, generation_time_ms, positive_prompt = _denormalized_metadata_fields(metadata_result)

        # Import existing OS/file metadata when DB has defaults, without overriding user edits.
        # - rating: only set if current rating is 0
        # - tags: only set if current tags are empty ('[]' or '')
        # Never downgrade metadata flags/raw on transient tool failures.
        # We keep the best known metadata_quality for a file unless a newer extraction
        # yields an equal-or-better quality. This prevents counters/progress from
        # "going backwards" during background enrichment retries.
        should_upgrade = _metadata_quality_should_upgrade_sql()
        same_quality = _metadata_quality_is_equal_sql()
        replace_raw_on_equal = _metadata_raw_should_replace_on_equal_quality_sql()

        return await db.aexecute(
            f"""
            INSERT INTO asset_metadata
            (
                asset_id, rating, tags, tags_text, has_workflow, has_generation_data,
                metadata_quality, workflow_type, generation_time_ms, positive_prompt, metadata_raw
            )
            SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            WHERE EXISTS (SELECT 1 FROM assets WHERE id = ?)
            ON CONFLICT(asset_id) DO UPDATE SET
                rating = CASE
                    WHEN COALESCE(asset_metadata.rating, 0) = 0 THEN excluded.rating
                    ELSE asset_metadata.rating
                END,
                tags = CASE
                    WHEN COALESCE(asset_metadata.tags, '[]') IN ('[]', '') THEN excluded.tags
                    ELSE asset_metadata.tags
                END,
                tags_text = CASE
                    WHEN COALESCE(asset_metadata.tags, '[]') IN ('[]', '') THEN excluded.tags_text
                    ELSE asset_metadata.tags_text
                END,
                has_workflow = CASE
                    WHEN {should_upgrade} THEN excluded.has_workflow
                    WHEN {same_quality} THEN CASE
                        WHEN COALESCE(asset_metadata.has_workflow, 0) = 1 THEN 1
                        WHEN excluded.has_workflow IS NOT NULL THEN excluded.has_workflow
                        ELSE asset_metadata.has_workflow
                    END
                    ELSE asset_metadata.has_workflow
                END,
                has_generation_data = CASE
                    WHEN {should_upgrade} THEN excluded.has_generation_data
                    WHEN {same_quality} THEN CASE
                        WHEN COALESCE(asset_metadata.has_generation_data, 0) = 1 THEN 1
                        WHEN excluded.has_generation_data IS NOT NULL THEN excluded.has_generation_data
                        ELSE asset_metadata.has_generation_data
                    END
                    ELSE asset_metadata.has_generation_data
                END,
                metadata_quality = CASE
                    WHEN {should_upgrade} THEN excluded.metadata_quality
                    ELSE asset_metadata.metadata_quality
                END,
                workflow_type = CASE
                    WHEN {should_upgrade} THEN excluded.workflow_type
                    WHEN {same_quality}
                         AND COALESCE(asset_metadata.workflow_type, '') = ''
                         AND COALESCE(excluded.workflow_type, '') <> ''
                    THEN excluded.workflow_type
                    ELSE asset_metadata.workflow_type
                END,
                generation_time_ms = CASE
                    WHEN excluded.generation_time_ms IS NOT NULL
                         AND {should_upgrade}
                    THEN excluded.generation_time_ms
                    WHEN excluded.generation_time_ms IS NOT NULL
                         AND {same_quality}
                         AND asset_metadata.generation_time_ms IS NULL
                    THEN excluded.generation_time_ms
                    WHEN excluded.generation_time_ms IS NOT NULL
                         AND asset_metadata.generation_time_ms IS NULL
                    THEN excluded.generation_time_ms
                    ELSE asset_metadata.generation_time_ms
                END,
                positive_prompt = CASE
                    WHEN {should_upgrade} THEN excluded.positive_prompt
                    WHEN {same_quality}
                         AND COALESCE(asset_metadata.positive_prompt, '') = ''
                         AND COALESCE(excluded.positive_prompt, '') <> ''
                    THEN excluded.positive_prompt
                    ELSE asset_metadata.positive_prompt
                END,
                metadata_raw = CASE
                    WHEN {should_upgrade} THEN excluded.metadata_raw
                    WHEN {same_quality} AND {replace_raw_on_equal} THEN excluded.metadata_raw
                    ELSE asset_metadata.metadata_raw
                END
            WHERE EXISTS (SELECT 1 FROM assets WHERE id = excluded.asset_id)
            """,
            (
                asset_id,
                extracted_rating,
                extracted_tags_json,
                extracted_tags_text,
                db_has_workflow,
                db_has_generation,
                metadata_quality,
                workflow_type,
                generation_time_ms,
                positive_prompt,
                metadata_raw_json,
                asset_id,
            ),
        )

    @staticmethod
    async def refresh_metadata_if_needed(
        db: Sqlite,
        asset_id: int,
        metadata_result: Result[dict[str, Any]],
        filepath: str,
        base_dir: str,
        state_hash: str,
        mtime: int,
        size: int,
        write_journal_fn,
    ) -> bool:
        """
        Re-run metadata extraction for unchanged files if the metadata flags changed.

        Args:
            db: Database adapter instance
            asset_id: Asset ID to check
            metadata_result: New metadata result
            filepath: File path
            base_dir: Base directory
            state_hash: State hash for journaling
            mtime: File modification time
            size: File size
            write_journal_fn: Function to write journal entry

        Returns:
            True if metadata was refreshed, False otherwise
        """
        async with db.lock_for_asset(asset_id):
            result = await db.aquery(
                "SELECT has_workflow, has_generation_data, metadata_raw FROM asset_metadata WHERE asset_id = ?",
                (asset_id,)
            )
            if not result.ok:
                return False

            current = result.data[0] if result.data else None
            new_has_workflow, new_has_generation_data, _, new_metadata_raw = MetadataHelpers.prepare_metadata_fields(metadata_result)
            new_has_workflow_db = MetadataHelpers._bool_to_db(new_has_workflow)
            new_has_generation_db = MetadataHelpers._bool_to_db(new_has_generation_data)

            current_has_workflow = current.get("has_workflow") if current else None
            current_has_generation = current.get("has_generation_data") if current else None
            current_raw = current["metadata_raw"] if current else ""

            if (current_has_workflow == new_has_workflow_db and
                    current_has_generation == new_has_generation_db and
                    current_raw == new_metadata_raw):
                return False

            write_result = await MetadataHelpers.write_asset_metadata_row(db, asset_id, metadata_result, filepath=filepath)
            if write_result.ok:
                # We assume write_journal_fn is async now
                await write_journal_fn(filepath, base_dir, state_hash, mtime, size)
            return write_result.ok

    @staticmethod
    async def retrieve_cached_metadata(db: Sqlite, filepath: str, state_hash: str) -> Result[dict[str, Any]] | None:
        """
        Retrieve metadata from cache if available.

        Args:
            db: Database adapter instance
            filepath: File path
            state_hash: State hash to validate cache

        Returns:
            Cached metadata result or None if not found
        """
        if not state_hash:
            return None

        result = await db.aquery(
            "SELECT metadata_raw FROM metadata_cache WHERE filepath = ? AND state_hash = ?",
            (filepath, state_hash)
        )

        if not result.ok or not result.data:
            return None

        row = result.data[0] if result.data else None
        if not isinstance(row, dict):
            return None
        raw = row.get("metadata_raw")
        if not raw:
            return None

        try:
            payload = json.loads(raw)
            return Result.Ok(payload, source="cache")
        except json.JSONDecodeError:
            return None

    @staticmethod
    async def _maybe_cleanup_metadata_cache(db: Sqlite) -> None:
        global _METADATA_CACHE_LAST_CLEANUP
        max_entries, ttl_seconds, interval = _cache_cleanup_config()

        if max_entries <= 0 and ttl_seconds <= 0:
            return

        now = time.time()
        if interval > 0 and (now - _METADATA_CACHE_LAST_CLEANUP) < interval:
            return

        async with _METADATA_CACHE_CLEANUP_LOCK:
            now = time.time()
            if interval > 0 and (_METADATA_CACHE_LAST_CLEANUP and (now - _METADATA_CACHE_LAST_CLEANUP) < interval):
                return
            _METADATA_CACHE_LAST_CLEANUP = now

            if ttl_seconds > 0:
                await _cleanup_cache_by_ttl(db, ttl_seconds)

            if max_entries > 0:
                await _cleanup_cache_by_max_entries(db, max_entries)

    @staticmethod
    async def store_metadata_cache(db: Sqlite, filepath: str, state_hash: str, metadata_result: Result[dict[str, Any]]) -> Result[Any]:
        """
        Store metadata in cache for future use.
        """
        if not metadata_result.ok or not metadata_result.data:
            return Result.Err("CACHE_SKIPPED", "No metadata to cache")

        metadata_raw = MetadataHelpers._metadata_json_payload(metadata_result.data)
        size_check = MetadataHelpers._metadata_payload_size_guard(metadata_raw, filepath)
        if size_check is not None:
            return size_check
        metadata_hash = MetadataHelpers.compute_metadata_hash(metadata_raw)

        write_res = await db.aexecute(
            """
            INSERT INTO metadata_cache
            (filepath, state_hash, metadata_hash, metadata_raw)
            SELECT ?, ?, ?, ?
            WHERE EXISTS (SELECT 1 FROM assets WHERE filepath = ?)
            ON CONFLICT(filepath) DO UPDATE SET
                state_hash = excluded.state_hash,
                metadata_hash = excluded.metadata_hash,
                metadata_raw = excluded.metadata_raw,
                last_updated = CURRENT_TIMESTAMP
            WHERE EXISTS (SELECT 1 FROM assets WHERE filepath = excluded.filepath)
            """,
            (filepath, state_hash, metadata_hash, metadata_raw, filepath)
        )
        try:
            await MetadataHelpers._maybe_cleanup_metadata_cache(db)
        except Exception:
            pass
        return write_res

    @staticmethod
    def _metadata_json_payload(metadata: dict[str, Any]) -> str:
        return json.dumps(
            metadata,
            ensure_ascii=False,
            separators=(",", ":"),
            sort_keys=True,
        )

    @staticmethod
    def _metadata_payload_size_guard(metadata_raw: str, filepath: str) -> Result[Any] | None:
        max_bytes = MetadataHelpers._max_metadata_json_bytes()
        if not max_bytes:
            return None
        nbytes = MetadataHelpers._metadata_payload_size_bytes(metadata_raw)
        if nbytes <= max_bytes:
            return None
        MetadataHelpers._log_metadata_payload_too_large(filepath, nbytes, max_bytes)
        return Result.Err(
            "CACHE_SKIPPED",
            "Metadata JSON too large to cache",
            original_bytes=int(nbytes),
            max_bytes=int(max_bytes),
        )

    @staticmethod
    def _max_metadata_json_bytes() -> int:
        try:
            return int(MAX_METADATA_JSON_BYTES or 0)
        except (TypeError, ValueError):
            return 0

    @staticmethod
    def _metadata_payload_size_bytes(metadata_raw: str) -> int:
        try:
            return len(metadata_raw.encode("utf-8", errors="ignore"))
        except (AttributeError, TypeError, UnicodeError):
            return 0

    @staticmethod
    def _log_metadata_payload_too_large(filepath: str, nbytes: int, max_bytes: int) -> None:
        try:
            logger.warning(
                "Metadata cache skipped (payload too large) for %s (bytes=%s > max=%s)",
                filepath,
                int(nbytes),
                int(max_bytes),
            )
        except Exception:
            pass

    @staticmethod
    def compute_metadata_hash(raw_json: str) -> str:
        # Non-cryptographic cache key; MD5 keeps stable compact digests for legacy metadata entries.
        return hashlib.md5(raw_json.encode("utf-8"), usedforsecurity=False).hexdigest()

    @staticmethod
    async def set_metadata_value(db: Sqlite, key: str, value: str) -> Result[Any]:
        return await db.aexecute(
            "INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)",
            (key, value)
        )


def _cache_cleanup_config() -> tuple[int, float, float]:
    try:
        max_entries = int(METADATA_CACHE_MAX or 0)
    except (TypeError, ValueError):
        max_entries = 0
    try:
        ttl_seconds = float(METADATA_CACHE_TTL_SECONDS or 0)
    except (TypeError, ValueError):
        ttl_seconds = 0.0
    try:
        interval = float(METADATA_CACHE_CLEANUP_INTERVAL_SECONDS or 0)
    except (TypeError, ValueError):
        interval = 0.0
    return max_entries, ttl_seconds, interval


async def _cleanup_cache_by_ttl(db: Sqlite, ttl_seconds: float) -> None:
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(seconds=ttl_seconds)
        cutoff_str = cutoff.strftime("%Y-%m-%d %H:%M:%S")
        await db.aexecute("DELETE FROM metadata_cache WHERE last_updated < ?", (cutoff_str,))
    except Exception:
        return


async def _cleanup_cache_by_max_entries(db: Sqlite, max_entries: int) -> None:
    try:
        count_res = await db.aquery("SELECT COUNT(1) AS count FROM metadata_cache")
        row = count_res.data[0] if (count_res.ok and count_res.data) else None
        total = int(row.get("count") or 0) if isinstance(row, dict) else 0
        if total <= max_entries:
            return
        to_remove = max(0, total - max_entries)
        if not to_remove:
            return
        await db.aexecute(
            """
            DELETE FROM metadata_cache
            WHERE filepath IN (
                SELECT filepath
                FROM metadata_cache
                ORDER BY last_updated ASC
                LIMIT ?
            )
            """,
            (to_remove,),
        )
    except Exception:
        return
