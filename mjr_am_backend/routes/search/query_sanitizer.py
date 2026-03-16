"""Inline query/date/sort sanitization helpers extracted from handlers/search.py."""
import datetime
import math
import re
from collections.abc import Mapping
from typing import Any

from ...shared import Result

MAX_RATING = 5
MAX_TAG_LENGTH = 50
MAX_TAG_TOKENS = 10
VALID_KIND_FILTERS = {"image", "video", "audio", "model3d"}
VALID_SORT_KEYS = {"mtime_desc", "mtime_asc", "name_asc", "name_desc", "rating_desc", "size_desc", "size_asc", "none"}


def reference_as_utc(reference=None):
    if reference is None:
        return datetime.datetime.now(datetime.timezone.utc)
    if reference.tzinfo is None:
        return reference.replace(tzinfo=datetime.timezone.utc)
    return reference.astimezone(datetime.timezone.utc)


def date_bounds_for_range(range_name, reference=None):
    if not range_name:
        return (None, None)
    now = reference_as_utc(reference)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    if range_name == "today":
        start = today
        end = start + datetime.timedelta(days=1)
    elif range_name == "this_week":
        start = today - datetime.timedelta(days=today.weekday())
        end = start + datetime.timedelta(days=7)
    elif range_name == "this_month":
        start = today.replace(day=1)
        next_month = (start.replace(day=28) + datetime.timedelta(days=4)).replace(day=1)
        end = next_month
    else:
        return (None, None)
    return int(start.timestamp()), int(end.timestamp())


def date_bounds_for_exact(value):
    try:
        parsed = datetime.datetime.strptime(value, "%Y-%m-%d")
    except Exception:
        return (None, None)
    start = parsed.replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=datetime.timezone.utc)
    end = start + datetime.timedelta(days=1)
    return int(start.timestamp()), int(end.timestamp())


def normalize_extension(value):
    if value is None:
        return ""
    try:
        text = str(value).strip()
    except Exception:
        return ""
    if not text:
        return ""
    text = text.lstrip(".").strip(",;")
    return text.lower()


def consume_extension(value: str, filters: dict) -> bool:
    ext = normalize_extension(value)
    if not ext:
        return False
    filters.setdefault("extensions", [])
    if ext not in filters["extensions"]:
        filters["extensions"].append(ext)
    return True


def consume_kind(value: str, filters: dict) -> bool:
    kind_value = (value or "").strip().lower()
    if kind_value not in VALID_KIND_FILTERS:
        return False
    filters["kind"] = kind_value
    return True


def consume_rating(value: str, filters: dict) -> bool:
    match = re.match(r"^(\d+)", value)
    if not match:
        return False
    filters["min_rating"] = max(0, min(MAX_RATING, int(match.group(1))))
    return True


def consume_tag(value: str, filters: dict) -> bool:
    tag = re.sub(r"[\x00-\x1f\x7f]", "", str(value or "")).strip().lower()
    tag = tag[:MAX_TAG_LENGTH]
    if not tag:
        return False
    tags_list = filters.setdefault("tags", [])
    if len(tags_list) >= MAX_TAG_TOKENS:
        return True  # consumed but silently dropped over limit
    if tag not in tags_list:
        tags_list.append(tag)
    return True


def consume_filter_token(token: str, filters: dict) -> bool:
    if ":" not in token:
        return False
    key, _, value = token.partition(":")
    key = (key or "").strip().lower()
    value = (value or "").strip().strip(",;")
    if not key or not value:
        return False
    if key in ("ext", "extension"):
        return consume_extension(value, filters)
    if key == "kind":
        return consume_kind(value, filters)
    if key == "rating":
        return consume_rating(value, filters)
    if key in ("tag", "tags"):
        return consume_tag(value, filters)
    return False


def parse_inline_filters(raw_query):
    if not raw_query:
        return "", {}
    tokens = str(raw_query).strip().split()
    cleaned = []
    filters: dict[str, object] = {}
    for token in tokens:
        consumed = consume_filter_token(token, filters)
        if not consumed:
            cleaned.append(token)
    return " ".join(cleaned).strip(), filters


def normalize_sort_key(value: str | None) -> str:
    s = str(value or "").strip().lower()
    if s in VALID_SORT_KEYS:
        return s
    return "mtime_desc"


def sanitize_tag_value(tag: str) -> str:
    """Strip control characters and excessive whitespace from a tag value."""
    return re.sub(r"[\x00-\x1f\x7f]", "", str(tag or "")).strip()


_CLAMP_PAIRS: list[tuple[str, str]] = [
    ("min_size_bytes", "max_size_bytes"),
    ("min_width", "max_width"),
    ("min_height", "max_height"),
]


def _merge_size_and_dimension_clamps(filters: dict[str, Any]) -> None:
    try:
        for min_key, max_key in _CLAMP_PAIRS:
            min_v = int(filters.get(min_key) or 0)
            max_v = int(filters.get(max_key) or 0)
            if min_v > 0 and max_v > 0 and max_v < min_v:
                filters[max_key] = min_v
    except Exception:
        return


def _apply_numeric_filter(
    query: "Mapping[str, Any]",
    raw_key: str,
    filter_key: str,
    caster: type,
    scale: int | float,
    error_text: str,
    filters: dict[str, Any],
) -> "Result[None] | None":
    if raw_key not in query:
        return None
    try:
        raw_value = caster(query[raw_key])  # type: ignore[operator]
    except Exception:
        return Result.Err("INVALID_INPUT", error_text)
    if isinstance(raw_value, float) and not math.isfinite(raw_value):
        return Result.Err("INVALID_INPUT", error_text)
    if raw_value > 0:
        try:
            filters[filter_key] = int(raw_value * scale) if scale != 1 else int(raw_value)
        except Exception:
            return Result.Err("INVALID_INPUT", error_text)
    return None


def _apply_date_filters(query: "Mapping[str, Any]", filters: dict[str, Any]) -> "Result[None] | None":
    date_exact = str(query.get("date_exact") or "").strip()
    date_range = str(query.get("date_range") or "").strip().lower()
    if date_exact:
        mtime_start, mtime_end = date_bounds_for_exact(date_exact)
        if mtime_start is None or mtime_end is None:
            return Result.Err("INVALID_INPUT", "Invalid date_exact")
        filters["mtime_start"] = mtime_start
        filters["mtime_end"] = mtime_end
    elif date_range:
        mtime_start, mtime_end = date_bounds_for_range(date_range)
        if mtime_start is None or mtime_end is None:
            return Result.Err("INVALID_INPUT", "Invalid date_range")
        filters["mtime_start"] = mtime_start
        filters["mtime_end"] = mtime_end
    return None


def parse_request_filters(
    query: Mapping[str, Any],
    inline_filters: dict[str, Any] | None = None,
) -> Result[dict[str, Any]]:
    filters: dict[str, Any] = dict(inline_filters or {})

    if "kind" in query:
        kind = str(query["kind"] or "").strip().lower()
        if kind not in VALID_KIND_FILTERS:
            return Result.Err(
                "INVALID_INPUT",
                f"Invalid kind. Must be one of: {', '.join(sorted(VALID_KIND_FILTERS))}",
            )
        filters["kind"] = kind

    if "min_rating" in query:
        try:
            filters["min_rating"] = max(0, min(MAX_RATING, int(query["min_rating"])))
        except Exception:
            return Result.Err("INVALID_INPUT", "Invalid min_rating")

    numeric_specs = [
        ("min_size_mb", "min_size_bytes", float, 1024 * 1024, "Invalid min_size_mb"),
        ("max_size_mb", "max_size_bytes", float, 1024 * 1024, "Invalid max_size_mb"),
        ("min_width", "min_width", int, 1, "Invalid min_width"),
        ("min_height", "min_height", int, 1, "Invalid min_height"),
        ("max_width", "max_width", int, 1, "Invalid max_width"),
        ("max_height", "max_height", int, 1, "Invalid max_height"),
    ]
    for raw_key, filter_key, caster, scale, error_text in numeric_specs:
        err = _apply_numeric_filter(query, raw_key, filter_key, caster, scale, error_text, filters)
        if err is not None:
            return err

    if "workflow_type" in query:
        workflow_type = str(query["workflow_type"] or "").strip().upper()
        if workflow_type:
            filters["workflow_type"] = workflow_type

    if "has_workflow" in query:
        filters["has_workflow"] = str(query["has_workflow"] or "").strip().lower() in ("true", "1", "yes")

    date_err = _apply_date_filters(query, filters)
    if date_err is not None:
        return date_err

    _merge_size_and_dimension_clamps(filters)
    return Result.Ok(filters)
