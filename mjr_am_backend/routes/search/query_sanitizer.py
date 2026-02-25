"""Inline query/date/sort sanitization helpers extracted from handlers/search.py."""
import datetime
import re

MAX_RATING = 5
VALID_KIND_FILTERS = {"image", "video", "audio", "model3d"}
VALID_SORT_KEYS = {"mtime_desc", "mtime_asc", "name_asc", "name_desc", "none"}


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
    return False


def parse_inline_filters(raw_query):
    if not raw_query:
        return "", {}
    tokens = str(raw_query).strip().split()
    cleaned = []
    filters = {}
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
