"""
Index searcher - handles asset search and retrieval operations.
"""
import os
import re
import unicodedata
from pathlib import Path
from typing import Any

from ...adapters.db.sqlite import Sqlite
from ...config import (
    SEARCH_MAX_BATCH_IDS,
    SEARCH_MAX_FILEPATH_LOOKUP,
    SEARCH_MAX_LIMIT,
    SEARCH_MAX_OFFSET,
    SEARCH_MAX_QUERY_LENGTH,
    SEARCH_MAX_TOKEN_LENGTH,
    SEARCH_MAX_TOKENS,
)
from ...shared import Result, get_logger
from . import search_hydration as _hydr

logger = get_logger(__name__)

def _normalize_extension(value) -> str:
    # NOTE: This is an intentional local copy of the same helper in
    # mjr_am_backend/routes/handlers/filesystem.py. A shared import would
    # create a cross-package dependency (features/index → routes/handlers)
    # which would invert the dependency hierarchy. Keep both copies in sync.
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

MAX_SEARCH_QUERY_LENGTH = SEARCH_MAX_QUERY_LENGTH
MAX_SEARCH_TOKENS = SEARCH_MAX_TOKENS
MAX_TOKEN_LENGTH = SEARCH_MAX_TOKEN_LENGTH
MAX_ASSET_BATCH_IDS = SEARCH_MAX_BATCH_IDS
MAX_FILEPATH_LOOKUP = SEARCH_MAX_FILEPATH_LOOKUP
VALID_SORT_KEYS = {"mtime_desc", "mtime_asc", "name_asc", "name_desc", "rating_desc", "size_desc", "size_asc"}
_SAFE_SQL_FRAGMENT_RE = re.compile(r"^[\s\w\.\(\)=<>\?!,'\\%:$-]+$")
_FTS_RESERVED = {"AND", "OR", "NOT", "NEAR"}
_LONG_QUERY_OR_THRESHOLD = 7
_MAX_PREFIX_TOKENS = 16
_STOPWORDS_FR_EN = {
    # English
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "in", "is", "it", "of",
    "on", "or", "that", "the", "to", "was", "were", "with", "without",
    # French
    "au", "aux", "avec", "ce", "ces", "dans", "de", "des", "du", "en", "et", "la", "le",
    "les", "leur", "leurs", "mais", "ou", "par", "pas", "pour", "sans", "se", "ses", "sur", "un",
    "une", "vos", "votre",
}
_AI_SELECT_SQL = """
                COALESCE(a.enhanced_caption, '') as enhanced_caption,
                COALESCE(ae.auto_tags, '[]') as auto_tags,
                CASE
                    WHEN LENGTH(TRIM(COALESCE(a.enhanced_caption, ''))) > 0 THEN 1
                    ELSE 0
                END as has_ai_enhanced_caption,
                CASE
                    WHEN TRIM(COALESCE(ae.auto_tags, '[]')) IN ('', '[]', '[ ]', 'null', 'NULL') THEN 0
                    ELSE 1
                END as has_ai_auto_tags,
                CASE
                    WHEN ae.vector IS NOT NULL AND LENGTH(ae.vector) > 0 THEN 1
                    ELSE 0
                END as has_ai_vector,
                CASE
                    WHEN LENGTH(TRIM(COALESCE(a.enhanced_caption, ''))) > 0
                         OR TRIM(COALESCE(ae.auto_tags, '[]')) NOT IN ('', '[]', '[ ]', 'null', 'NULL')
                         OR (ae.vector IS NOT NULL AND LENGTH(ae.vector) > 0)
                    THEN 1
                    ELSE 0
                END as has_ai_info,
"""


def _normalize_sort_key(sort: str | None) -> str:
    s = str(sort or "").strip().lower()
    if s in VALID_SORT_KEYS:
        return s
    return "mtime_desc"


def _strip_diacritics(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text)
    return "".join(ch for ch in normalized if not unicodedata.combining(ch))


def _extract_quoted_phrases(text: str) -> list[str]:
    phrases: list[str] = []
    for match in re.finditer(r'"([^"]+)"|\'([^\']+)\'', text):
        phrase = match.group(1) or match.group(2) or ""
        phrase = _strip_diacritics(phrase)
        phrase = re.sub(r"[\"'\-:&/\\|;@#*~()\[\]{}\.]+", " ", phrase)
        phrase = re.sub(r"[^\x20-\x7E]+", " ", phrase)
        phrase = re.sub(r"\s+", " ", phrase).strip().lower()
        if phrase:
            phrases.append(phrase)
    # Keep phrase clauses bounded for MATCH stability.
    return phrases[:4]


def _dedupe_tokens(tokens: list[str]) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for token in tokens:
        if token in seen:
            continue
        seen.add(token)
        out.append(token)
    return out


def _build_token_match_expression(tokens: list[str]) -> str:
    if not tokens:
        return ""
    terms = [f"{token}*" for token in tokens[:_MAX_PREFIX_TOKENS]]
    if len(terms) > _LONG_QUERY_OR_THRESHOLD:
        return " OR ".join(terms)
    return " ".join(terms)


def _is_meaningful_token(token: str) -> bool:
    if not token or len(token) <= 1:
        return False
    if token.upper() in _FTS_RESERVED:
        return False
    if token in _STOPWORDS_FR_EN:
        return False
    return True


def _build_sort_sql(sort: str | None, *, table_alias: str = "a", rank_alias: str | None = None) -> str:
    key = _normalize_sort_key(sort)
    if key == "name_asc":
        return f"ORDER BY LOWER({table_alias}.filename) ASC, {table_alias}.id DESC"
    if key == "name_desc":
        return f"ORDER BY LOWER({table_alias}.filename) DESC, {table_alias}.id DESC"
    if key == "mtime_asc":
        return f"ORDER BY {table_alias}.mtime ASC, {table_alias}.id ASC"
    if key == "rating_desc":
        return f"ORDER BY COALESCE(m.rating, 0) DESC, {table_alias}.mtime DESC, {table_alias}.id DESC"
    if key == "size_desc":
        return f"ORDER BY COALESCE({table_alias}.size, 0) DESC, {table_alias}.mtime DESC, {table_alias}.id DESC"
    if key == "size_asc":
        return f"ORDER BY COALESCE({table_alias}.size, 0) ASC, {table_alias}.mtime DESC, {table_alias}.id DESC"
    if rank_alias:
        return f"ORDER BY {table_alias}.mtime DESC, {rank_alias} ASC, {table_alias}.id DESC"
    return f"ORDER BY {table_alias}.mtime DESC, {table_alias}.id DESC"


def _append_tag_filter(filters: dict[str, Any], clauses: list[str], params: list[Any]) -> None:
    tags = filters.get("tags")
    if not isinstance(tags, list):
        return
    for tag in tags:
        tag_clean = str(tag or "").strip().lower()[:100]
        if not tag_clean:
            continue
        clauses.append(
            "AND EXISTS ("
            "SELECT 1 FROM json_each(NULLIF(m.tags, '')) "
            "WHERE LOWER(value) = ?"
            ")"
        )
        params.append(tag_clean)


def _build_filter_clauses(filters: dict[str, Any] | None, alias: str = "a") -> tuple[list[str], list[Any]]:
    clauses: list[str] = []
    params: list[Any] = []
    if not filters:
        return clauses, params
    _append_kind_and_source_filters(filters, alias, clauses, params)
    _append_extension_filter(filters, alias, clauses, params)
    _append_subfolder_filter(filters, alias, clauses, params)
    _append_numeric_range_filters(filters, alias, clauses, params)
    _append_tag_filter(filters, clauses, params)
    _append_workflow_type_filter(filters, clauses, params)
    _append_has_workflow_filter(filters, clauses)
    _append_mtime_filters(filters, alias, clauses, params)
    _append_exclude_root_filter(filters, alias, clauses, params)
    return clauses, params


def _append_kind_and_source_filters(
    filters: dict[str, Any],
    alias: str,
    clauses: list[str],
    params: list[Any],
) -> None:
    kind = filters.get("kind")
    if isinstance(kind, str) and kind:
        clauses.append(f"AND {alias}.kind = ?")
        params.append(kind)
    source = filters.get("source")
    if isinstance(source, str) and source.strip():
        clauses.append(f"AND LOWER({alias}.source) = ?")
        params.append(source.strip().lower())


def _append_extension_filter(filters: dict[str, Any], alias: str, clauses: list[str], params: list[Any]) -> None:
    extensions = filters.get("extensions")
    if not isinstance(extensions, list):
        return
    normalized_exts = [_normalize_extension(ext) for ext in extensions]
    normalized_exts = [ext for ext in normalized_exts if ext]
    if not normalized_exts:
        return
    placeholders = ", ".join("?" for _ in normalized_exts)
    clauses.append(f"AND LOWER({alias}.ext) IN ({placeholders})")
    params.extend(normalized_exts)


def _append_subfolder_filter(filters: dict[str, Any], alias: str, clauses: list[str], params: list[Any]) -> None:
    if "subfolder" not in filters:
        return
    clauses.append(f"AND COALESCE({alias}.subfolder, '') = ?")
    params.append(str(filters.get("subfolder") or ""))


def _append_numeric_range_filters(filters: dict[str, Any], alias: str, clauses: list[str], params: list[Any]) -> None:
    int_specs = [
        ("min_size_bytes", f"AND COALESCE({alias}.size, 0) >= ?"),
        ("max_size_bytes", f"AND COALESCE({alias}.size, 0) <= ?"),
        ("min_width", f"AND COALESCE({alias}.width, 0) >= ?"),
        ("min_height", f"AND COALESCE({alias}.height, 0) >= ?"),
        ("max_width", f"AND COALESCE({alias}.width, 0) <= ?"),
        ("max_height", f"AND COALESCE({alias}.height, 0) <= ?"),
    ]
    if "min_rating" in filters:
        clauses.append("AND COALESCE(m.rating, 0) >= ?")
        params.append(filters["min_rating"])
    for key, clause in int_specs:
        if key in filters:
            clauses.append(clause)
            params.append(int(filters[key]))


def _safe_metadata_json_extract(path: str, max_len: int | None = None) -> str:
    """Guard json_extract against malformed metadata_raw payloads.

    Some databases contain legacy rows where metadata_raw is not valid JSON.
    Direct json_extract(...) on those rows raises a SQLite error and breaks the
    whole query; CASE+json_valid keeps filtering resilient.

    Pass max_len to truncate the extracted value (useful for long text fields
    like positive_prompt to keep result rows compact).
    """
    safe_path = str(path or "")
    extract = f"json_extract(m.metadata_raw, '{safe_path}')"
    if max_len is not None and int(max_len) > 0:
        extract = f"SUBSTR({extract}, 1, {int(max_len)})"
    return (
        "CASE "
        "WHEN json_valid(COALESCE(m.metadata_raw, '')) "
        f"THEN {extract} "
        "ELSE NULL "
        "END"
    )


def _safe_positive_prompt_extract(max_len: int = 250) -> str:
    """Extract positive prompt from metadata_raw across multiple storage formats.

    - ComfyUI workflow images store it at $.positive_prompt
    - A1111/geninfo images store it at $.geninfo.positive.value
    COALESCE tries both; NULLIF+TRIM skips empty strings so a blank
    $.positive_prompt doesn't shadow a valid $.geninfo.positive.value.
    """
    n = int(max_len)
    return (
        "COALESCE("
        "NULLIF(TRIM(COALESCE(m.positive_prompt, '')), ''), "
        "CASE WHEN json_valid(COALESCE(m.metadata_raw, '')) THEN "
        f"SUBSTR(COALESCE("
        f"NULLIF(TRIM(COALESCE(json_extract(m.metadata_raw, '$.positive_prompt'), '')), ''), "
        f"NULLIF(TRIM(COALESCE(json_extract(m.metadata_raw, '$.geninfo.positive.value'), '')), '')"
        f"), 1, {n}) "
        "ELSE NULL END"
        ")"
    )


def _generation_time_ms_select() -> str:
    return f"COALESCE(m.generation_time_ms, {_safe_metadata_json_extract('$.generation_time_ms')})"


def _append_workflow_type_filter(filters: dict[str, Any], clauses: list[str], params: list[Any]) -> None:
    if "workflow_type" not in filters:
        return
    raw = str(filters.get("workflow_type") or "").strip().upper()
    variants = _workflow_type_variants(raw)
    if not variants:
        return
    placeholders = ", ".join("?" for _ in variants)
    denormalized_type_expr = "NULLIF(TRIM(COALESCE(m.workflow_type, '')), '')"
    workflow_type_expr = _safe_metadata_json_extract("$.workflow_type")
    geninfo_type_expr = _safe_metadata_json_extract("$.geninfo.engine.type")
    engine_type_expr = _safe_metadata_json_extract("$.engine.type")
    clauses.append(
        "AND UPPER(COALESCE("
        f"{denormalized_type_expr}, "
        f"{workflow_type_expr}, "
        f"{geninfo_type_expr}, "
        f"{engine_type_expr}, "
        "''"
        f")) IN ({placeholders})"
    )
    params.extend(variants)


def _workflow_type_variants(raw: str) -> list[str]:
    alias_map = {
        "T2I": ["T2I"],
        "I2I": ["I2I"],
        "T2V": ["T2V"],
        "I2V": ["I2V"],
        "V2V": ["V2V"],
        "A2A": ["A2A"],
        "TTS": ["TTS", "T2A"],
        "UPSCL": ["UPSCL", "UPSCALE", "UPSCALER"],
        "INPT": ["INPT", "INPUT", "LOAD_INPUT"],
        "FLF": ["FLF", "FIRST_LAST_FRAME", "FIRST_FRAME_LAST_FRAME"],
    }
    return alias_map.get(raw, [raw] if raw else [])


def _append_has_workflow_filter(filters: dict[str, Any], clauses: list[str]) -> None:
    if "has_workflow" not in filters:
        return
    want_workflow = bool(filters.get("has_workflow"))
    workflow_expr = _safe_metadata_json_extract("$.workflow")
    prompt_expr = _safe_metadata_json_extract("$.prompt")
    parameters_expr = _safe_metadata_json_extract("$.parameters")
    if want_workflow:
        clauses.append(
            "AND ("
            "COALESCE(m.has_workflow, 0) = 1 "
            f"OR {workflow_expr} IS NOT NULL "
            f"OR {prompt_expr} IS NOT NULL "
            f"OR {parameters_expr} IS NOT NULL"
            ")"
        )
        return
    clauses.append(
        "AND ("
        "COALESCE(m.has_workflow, 0) = 0 "
        f"AND {workflow_expr} IS NULL "
        f"AND {prompt_expr} IS NULL "
        f"AND {parameters_expr} IS NULL"
        ")"
    )


def _append_mtime_filters(filters: dict[str, Any], alias: str, clauses: list[str], params: list[Any]) -> None:
    if "mtime_start" in filters:
        clauses.append(f"AND {alias}.mtime >= ?")
        params.append(filters["mtime_start"])
    if "mtime_end" in filters:
        clauses.append(f"AND {alias}.mtime < ?")
        params.append(filters["mtime_end"])


def _append_exclude_root_filter(filters: dict[str, Any], alias: str, clauses: list[str], params: list[Any]) -> None:
    exclude_root = filters.get("exclude_root")
    if not isinstance(exclude_root, str) or not exclude_root.strip():
        return
    try:
        root = str(Path(exclude_root).resolve(strict=False))
        prefix = root.rstrip(os.sep) + os.sep
        esc = prefix.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        clauses.append(f"AND NOT ({alias}.filepath = ? OR {alias}.filepath LIKE ? ESCAPE '\\')")
        params.extend([root, f"{esc}%"])
    except Exception:
        return


def _assert_safe_sql_fragment(fragment: str, *, label: str = "sql_fragment") -> None:
    """
    Fail closed if a dynamically composed SQL fragment contains unexpected characters.
    """
    text = str(fragment or "")
    if not text:
        return
    if not _SAFE_SQL_FRAGMENT_RE.fullmatch(text):
        raise ValueError(f"Unsafe {label}")


def _normalize_pagination(limit: int, offset: int) -> tuple[int, int]:
    limit_i = max(0, min(SEARCH_MAX_LIMIT, int(limit)))
    offset_i = max(0, min(SEARCH_MAX_OFFSET, int(offset)))
    return limit_i, offset_i


def _escape_like_pattern(pattern: str) -> str:
    return pattern.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _resolve_search_roots(roots: list[str]) -> list[str]:
    cleaned_roots: list[str] = []
    for raw in roots or []:
        if not raw:
            continue
        try:
            cleaned_roots.append(str(Path(raw).resolve()))
        except Exception:
            continue
    return cleaned_roots


def _build_roots_where_clause(roots: list[str], alias: str = "a") -> tuple[str, list[Any]]:
    parts: list[str] = []
    params: list[Any] = []
    for root in roots:
        prefix = root.rstrip(os.sep) + os.sep
        escaped_prefix = _escape_like_pattern(prefix)
        parts.append(f"({alias}.filepath = ? OR {alias}.filepath LIKE ? ESCAPE '\\')")
        params.extend([root, f"{escaped_prefix}%"])
    clause = "(" + " OR ".join(parts) + ")"
    _assert_safe_sql_fragment(clause, label="roots_where")
    return clause, params


def _normalize_month_range(month_start: int, month_end: int) -> tuple[int, int] | None:
    try:
        start_i = int(month_start)
        end_i = int(month_end)
    except Exception:
        return None
    if start_i <= 0 or end_i <= 0 or end_i <= start_i:
        return None
    return start_i, end_i


def _sanitize_histogram_filters(filters: dict[str, Any] | None) -> dict[str, Any]:
    safe_filters = dict(filters or {})
    safe_filters.pop("mtime_start", None)
    safe_filters.pop("mtime_end", None)
    return safe_filters


def _build_histogram_query(
    roots_clause: str,
    roots_params: list[Any],
    start_i: int,
    end_i: int,
    filters: dict[str, Any] | None,
) -> tuple[str, tuple[Any, ...]]:
    sql_parts = [
        """
        SELECT
            strftime('%Y-%m-%d', a.mtime, 'unixepoch') AS day,
            COUNT(*) AS count
        FROM assets a
        LEFT JOIN asset_metadata m ON a.id = m.asset_id
        WHERE
        """,
        roots_clause,
        "AND a.mtime >= ? AND a.mtime < ?",
    ]
    params: list[Any] = []
    params.extend(roots_params)
    params.extend([start_i, end_i])
    filter_clauses, filter_params = _build_filter_clauses(_sanitize_histogram_filters(filters))
    sql_parts.extend(filter_clauses)
    params.extend(filter_params)
    sql_parts.append("GROUP BY day ORDER BY day ASC")
    return " ".join(sql_parts), tuple(params)


def _coerce_histogram_days(rows: Any) -> dict[str, int]:
    days: dict[str, int] = {}
    for row in rows or []:
        try:
            day = str(row.get("day") or "").strip()
            count = int(row.get("count") or 0)
        except Exception:
            continue
        if day:
            days[day] = max(0, count)
    return days


def _normalize_asset_ids(asset_ids: list[int]) -> list[int]:
    cleaned: list[int] = []
    seen = set()
    for raw in asset_ids or []:
        try:
            n = int(raw)
        except Exception:
            continue
        if n <= 0 or n in seen:
            continue
        seen.add(n)
        cleaned.append(n)
        if len(cleaned) >= MAX_ASSET_BATCH_IDS:
            break
    return cleaned


def _map_assets_by_id(rows: Any, hydrator) -> dict[int, dict[str, Any]]:
    by_id: dict[int, dict[str, Any]] = {}
    for row in rows or []:
        try:
            asset = hydrator(dict(row))
            raw_id = asset.get("id")
            if raw_id is None:
                continue
            by_id[int(raw_id)] = asset
        except Exception:
            continue
    return by_id


def _assets_in_requested_order(cleaned: list[int], by_id: dict[int, dict[str, Any]]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for aid in cleaned:
        item = by_id.get(aid)
        if item:
            out.append(item)
    return out


def _normalize_lookup_filepaths(filepaths: list[str]) -> list[str]:
    cleaned = [str(p) for p in (filepaths or []) if p]
    if len(cleaned) > MAX_FILEPATH_LOOKUP:
        return cleaned[:MAX_FILEPATH_LOOKUP]
    return cleaned


def _hydrate_lookup_row(row: dict[str, Any]) -> tuple[str, dict[str, Any]] | None:
    return _hydr.hydrate_lookup_row(row)


def _map_lookup_rows(rows: Any) -> dict[str, dict[str, Any]]:
    out: dict[str, dict[str, Any]] = {}
    for row in rows or []:
        if not isinstance(row, dict):
            continue
        hydrated = _hydrate_lookup_row(row)
        if hydrated is None:
            continue
        fp, item = hydrated
        out[fp] = item
    return out


def _hydrate_search_rows(rows: list[dict[str, Any]], *, include_highlight: bool) -> list[dict[str, Any]]:
    return _hydr.hydrate_search_rows(rows, include_highlight=include_highlight)


def _group_assets_by_stack(assets: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: list[dict[str, Any]] = []
    seen: set[str] = set()
    for asset in assets or []:
        if not isinstance(asset, dict):
            continue
        stack_id = asset.get("stack_id")
        stack_id_int = _safe_positive_int(stack_id)
        if stack_id_int is not None:
            key = f"stack:{stack_id_int}"
        else:
            key = f"asset:{_safe_positive_int(asset.get('id')) or 0}"
        if key in seen:
            continue
        seen.add(key)
        grouped.append(asset)
    return grouped


def _stack_group_key(asset: dict[str, Any]) -> str:
    stack_id_int = _safe_positive_int(asset.get("stack_id"))
    if stack_id_int is not None:
        return f"stack:{stack_id_int}"
    return f"asset:{_safe_positive_int(asset.get('id')) or 0}"


def _is_video_with_audio(asset: dict[str, Any]) -> bool:
    """Check if asset is a video that contains audio (detected by filename pattern)."""
    kind = str(asset.get("kind") or "").strip().lower()
    if kind != "video":
        return False
    filename = str(asset.get("filename") or "").lower()
    # Videos with audio typically have "-audio" or "_audio" suffix before extension
    # e.g., "video_00001-audio.mp4", "clip_audio.mp4"
    return "-audio" in filename or "_audio" in filename


def _group_priority(asset: dict[str, Any]) -> tuple[int, int, int, int]:
    kind = str(asset.get("kind") or "").strip().lower()
    # Priority for stack representatives:
    # - Video with audio (2) > Video (1) > Image (0)
    # This ensures video with audio is shown as the stack cover in the grid
    if _is_video_with_audio(asset):
        kind_priority = 2
    elif kind == "video":
        kind_priority = 1
    else:
        kind_priority = 0
    has_generation = 1 if int(asset.get("has_generation_data") or 0) else 0
    size = int(asset.get("size") or 0)
    mtime = int(asset.get("mtime") or 0)
    # Prioritize: video_with_audio > video > image, then most recent, generation data, size
    return (kind_priority, mtime, has_generation, size)


def _select_group_representative(current: dict[str, Any], candidate: dict[str, Any]) -> dict[str, Any]:
    current_priority = _group_priority(current)
    candidate_priority = _group_priority(candidate)
    if candidate_priority > current_priority:
        return candidate
    return current


def _generation_time_ms_value(asset: dict[str, Any] | None) -> int:
    if not isinstance(asset, dict):
        return 0
    raw = asset.get("generation_time_ms")
    if raw in (None, ""):
        return 0
    try:
        return max(0, int(float(raw)))
    except (TypeError, ValueError):
        return 0


def _preserve_group_generation_time(
    selected: dict[str, Any], *candidates: dict[str, Any] | None
) -> dict[str, Any]:
    if _generation_time_ms_value(selected) > 0:
        return selected
    for candidate in candidates:
        gen_time_ms = _generation_time_ms_value(candidate)
        if gen_time_ms > 0:
            selected["generation_time_ms"] = gen_time_ms
            if not selected.get("has_generation_data") and candidate and candidate.get("has_generation_data"):
                selected["has_generation_data"] = candidate.get("has_generation_data")
            return selected
    return selected


def _merge_asset_into_group(
    asset: dict[str, Any],
    grouped_assets: list[dict[str, Any]],
    grouped_by_key: dict[str, dict[str, Any]],
    stack_counts: dict[str, int],
) -> None:
    key = _stack_group_key(asset)
    stack_counts[key] = stack_counts.get(key, 0) + 1
    existing = grouped_by_key.get(key)
    if existing is None:
        grouped_by_key[key] = asset
        grouped_assets.append(asset)
        return
    selected = _select_group_representative(existing, asset)
    _preserve_group_generation_time(selected, existing, asset)
    if selected is existing:
        return
    grouped_by_key[key] = selected
    try:
        idx = grouped_assets.index(existing)
    except ValueError:
        grouped_assets.append(selected)
    else:
        grouped_assets[idx] = selected


def _apply_stack_counts(grouped_assets: list[dict[str, Any]], stack_counts: dict[str, int]) -> None:
    for asset in grouped_assets:
        key = _stack_group_key(asset)
        asset["stack_asset_count"] = stack_counts.get(key, 1)


def _adapt_raw_chunk(current_chunk: int, grouped_count: int, raw_processed: int, target: int) -> int:
    """Double chunk size when grouping ratio is poor to reduce DB round trips."""
    if grouped_count <= 0 or raw_processed <= 0 or target <= grouped_count:
        return current_chunk
    ratio = grouped_count / raw_processed
    if ratio <= 0:
        return current_chunk
    remaining = target - grouped_count
    estimated = int(remaining / ratio) * 2
    return max(current_chunk, min(5000, estimated))


async def _paginate_grouped_assets(
    fetch_rows,
    hydrate_rows,
    *,
    limit: int,
    offset: int,
    include_total: bool,
) -> Result[dict[str, Any]]:
    target = max(0, offset) + max(0, limit)
    raw_offset = 0
    raw_chunk = max(200, min(2000, max(limit, 1) * 10))
    grouped_assets: list[dict[str, Any]] = []
    grouped_by_key: dict[str, dict[str, Any]] = {}
    stack_counts: dict[str, int] = {}
    result = await _collect_grouped_assets(
        fetch_rows,
        hydrate_rows,
        grouped_assets,
        grouped_by_key,
        stack_counts,
        target=target,
        raw_chunk=raw_chunk,
        raw_offset=raw_offset,
        include_total=include_total,
    )
    if not result.ok:
        return Result.Err(result.code, result.error or "Grouped search query failed")

    _apply_stack_counts(grouped_assets, stack_counts)

    total = len(grouped_assets) if include_total else None
    page_assets = grouped_assets[offset: offset + limit] if limit > 0 else []
    return Result.Ok({"assets": page_assets, "total": total})


async def _collect_grouped_assets(
    fetch_rows,
    hydrate_rows,
    grouped_assets: list[dict[str, Any]],
    grouped_by_key: dict[str, dict[str, Any]],
    stack_counts: dict[str, int],
    *,
    target: int,
    raw_chunk: int,
    raw_offset: int,
    include_total: bool,
) -> Result[None]:
    while True:
        if not include_total and len(grouped_assets) >= target:
            return Result.Ok(None)
        raw_chunk = _adapt_raw_chunk(raw_chunk, len(grouped_assets), raw_offset, target)
        rows_res = await fetch_rows(raw_chunk, raw_offset)
        if not rows_res.ok:
            return Result.Err(rows_res.code, rows_res.error or "Grouped search query failed")
        rows = _rows_from_grouped_result(rows_res.data)
        if not rows:
            return Result.Ok(None)
        _merge_grouped_rows(rows, hydrate_rows, grouped_assets, grouped_by_key, stack_counts)
        row_count = len(rows)
        raw_offset += row_count
        if row_count < raw_chunk:
            return Result.Ok(None)


def _rows_from_grouped_result(data: Any) -> list[dict[str, Any]]:
    payload = data if isinstance(data, dict) else {}
    rows = payload.get("rows")
    return rows if isinstance(rows, list) else []


def _merge_grouped_rows(
    rows: list[dict[str, Any]],
    hydrate_rows,
    grouped_assets: list[dict[str, Any]],
    grouped_by_key: dict[str, dict[str, Any]],
    stack_counts: dict[str, int],
) -> None:
    for asset in hydrate_rows(rows):
        if isinstance(asset, dict):
            _merge_asset_into_group(asset, grouped_assets, grouped_by_key, stack_counts)


def _build_grouped_search_result(
    grouped_assets: list[dict[str, Any]],
    *,
    offset: int,
    limit: int,
    include_total: bool,
) -> dict[str, Any]:
    total = len(grouped_assets) if include_total else None
    page_assets = grouped_assets[offset: offset + limit] if limit > 0 else []
    return {"assets": page_assets, "total": total}


def _safe_positive_int(value: Any) -> int | None:
    if isinstance(value, int):
        return value if value > 0 else None
    if isinstance(value, str):
        raw = value.strip()
        if not raw:
            return None
        try:
            parsed = int(raw)
        except ValueError:
            return None
        return parsed if parsed > 0 else None
    return None


class IndexSearcher:
    """
    Handles asset search and retrieval operations.

    Provides FTS5 full-text search, scoped search, single asset lookup,
    and bulk filepath lookups for asset enrichment.
    """

    def __init__(self, db: Sqlite, has_tags_text_column: bool):
        """
        Initialize index searcher.

        Args:
            db: Database adapter instance
            has_tags_text_column: Whether the tags_text column exists in asset_metadata
        """
        self.db = db
        self._has_tags_text_column = has_tags_text_column
        self.fts_vocab_ready = False

    async def ensure_vocab(self):
        """Ensure FTS5 vocab table exists for autocomplete."""
        if self.fts_vocab_ready:
            return
        try:
            # Check if fts5 is available and creates the vocab table
            # fts5vocab('table_name', 'row'|'col'|'instance')
            await self.db.aexecute("CREATE VIRTUAL TABLE IF NOT EXISTS asset_metadata_vocab USING fts5vocab('asset_metadata_fts', 'row')")
            self.fts_vocab_ready = True
        except Exception:
            # Silent fail if fts5vocab not available
            self.fts_vocab_ready = False

    async def autocomplete(self, prefix: str, limit: int = 10) -> Result[list[str]]:
        """
        Suggest completions for the given prefix using FTS5 vocabulary.
        """
        await self.ensure_vocab()
        if not self.fts_vocab_ready:
            return Result.Ok([])

        clean_prefix = prefix.strip()
        if not clean_prefix or len(clean_prefix) < 2:
            return Result.Ok([])

        try:
            escaped_prefix = _escape_like_pattern(clean_prefix)
            res = await self.db.aquery(
                "SELECT term FROM asset_metadata_vocab WHERE term LIKE ? ESCAPE '\\' ORDER BY doc DESC LIMIT ?",
                (f"{escaped_prefix}%", limit)
            )
            if not res.ok:
                return Result.Ok([])

            terms = [str(r["term"]) for r in res.data or []]
            return Result.Ok(terms)
        except Exception:
            return Result.Ok([])

    def _validate_search_query(self, query: str) -> Result[Any] | None:
        if not query or not query.strip():
            return Result.Err("EMPTY_QUERY", "Search query cannot be empty")
        validation = self._validate_search_input(query)
        if validation and not validation.ok:
            return validation
        return None

    def _filter_clauses(
        self,
        filters: dict[str, Any] | None,
        *,
        assert_safe: bool = False,
    ) -> tuple[list[str], list[Any]]:
        filter_clauses, filter_params = _build_filter_clauses(filters)
        if assert_safe:
            for clause in filter_clauses:
                _assert_safe_sql_fragment(clause, label="filter_clause")
        return filter_clauses, filter_params

    async def _run_search_query_rows(
        self,
        sql: str,
        params: list[Any],
        *,
        failure_message: str,
    ) -> Result[list[dict[str, Any]]]:
        result = await self.db.aquery(sql, tuple(params))
        if result.ok:
            return Result.Ok(result.data or [])
        if self._is_malformed_match_error(result.error):
            return Result.Err("INVALID_INPUT", "Invalid search query syntax")
        return Result.Err("SEARCH_FAILED", result.error or failure_message)

    @staticmethod
    def _search_rows_total(data: Any) -> tuple[list[dict[str, Any]], int | None]:
        if not isinstance(data, dict):
            return [], None
        rows = data.get("rows")
        total = data.get("total")
        if not isinstance(rows, list):
            rows = []
        return rows, total

    def _build_search_payload(
        self,
        *,
        assets: list[dict[str, Any]],
        limit: int,
        offset: int,
        query: str,
        include_total: bool,
        total: int | None,
        sort: str | None = None,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "assets": assets,
            "limit": limit,
            "offset": offset,
            "query": query,
            "total": int(total or 0) if include_total else None,
        }
        if sort is not None:
            payload["sort"] = _normalize_sort_key(sort)
        return payload

    async def _search_global_browse_rows(
        self,
        *,
        limit: int,
        offset: int,
        filters: dict[str, Any] | None,
        include_total: bool,
        metadata_tags_text_clause: str,
        sort: str | None = None,
    ) -> Result[dict[str, Any]]:
        sql_parts = [
            f"""
            SELECT
                a.id, a.filename, a.subfolder, a.filepath, a.kind,
                a.source, a.root_id, a.job_id, a.stack_id,
                a.width, a.height, a.duration, a.size, a.mtime,
                COALESCE(m.rating, 0) as rating,
                COALESCE(m.tags, '[]') as tags,
{metadata_tags_text_clause}{_AI_SELECT_SQL}                    m.has_workflow as has_workflow,
                m.has_generation_data as has_generation_data,
                {_generation_time_ms_select()} as generation_time_ms,
                {_safe_positive_prompt_extract(250)} as positive_prompt,
                NULL as file_creation_time,
                NULL as file_birth_time
            FROM assets a
            LEFT JOIN asset_metadata m ON a.id = m.asset_id
            LEFT JOIN vec.asset_embeddings ae ON a.id = ae.asset_id
            WHERE 1=1
            """
        ]
        params: list[Any] = []

        filter_clauses, filter_params = self._filter_clauses(filters)
        sql_parts.extend(filter_clauses)
        params.extend(filter_params)
        sql_parts.append(_build_sort_sql(sort, table_alias="a"))
        sql_parts.append("LIMIT ? OFFSET ?")
        params.extend([limit, offset])

        rows_res = await self._run_search_query_rows(
            " ".join(sql_parts),
            params,
            failure_message="Search query failed",
        )
        if not rows_res.ok:
            return Result.Err(rows_res.code, rows_res.error or "Search query failed")
        rows = rows_res.data or []

        total: int | None = None
        if include_total:
            count_sql = "SELECT COUNT(*) as total FROM assets a LEFT JOIN asset_metadata m ON a.id = m.asset_id WHERE 1=1"
            count_params: list[Any] = []
            if filter_clauses:
                count_sql += " " + " ".join(filter_clauses)
                count_params.extend(filter_params)
            count_result = await self.db.aquery(count_sql, tuple(count_params))
            total = count_result.data[0]["total"] if count_result.ok and count_result.data else 0
        return Result.Ok({"rows": rows, "total": total})

    async def _search_global_fts_rows(
        self,
        *,
        fts_query: str,
        limit: int,
        offset: int,
        filters: dict[str, Any] | None,
        include_total: bool,
        metadata_tags_text_clause: str,
    ) -> Result[dict[str, Any]]:
        total_field = "COUNT(*) OVER() as _total," if include_total else ""
        sql_parts = [self._global_fts_select_sql(total_field, metadata_tags_text_clause)]
        params: list[Any] = [fts_query, fts_query]

        filter_clauses, filter_params = self._filter_clauses(filters)
        sql_parts.extend(filter_clauses)
        params.extend(filter_params)
        sql_parts.append("ORDER BY rank")
        sql_parts.append("LIMIT ? OFFSET ?")
        params.extend([limit, offset])

        rows_res = await self._run_search_query_rows(
            " ".join(sql_parts),
            params,
            failure_message="Search query failed",
        )
        if not rows_res.ok:
            return Result.Err(rows_res.code, rows_res.error or "Search query failed")
        rows = rows_res.data or []

        total: int | None = None
        if include_total and rows and "_total" in rows[0]:
            total = rows[0]["_total"]
        if include_total and total is None:
            total = await self._global_fts_total_count(fts_query, filter_clauses, filter_params)
        return Result.Ok({"rows": rows, "total": total})

    @staticmethod
    def _global_fts_select_sql(total_field: str, metadata_tags_text_clause: str) -> str:
        return f"""
            WITH matches AS (
                SELECT rowid AS asset_id, bm25(assets_fts, 8.0, 1.25) AS rank
                FROM assets_fts
                WHERE assets_fts MATCH ?

                UNION ALL

                SELECT rowid AS asset_id, (bm25(asset_metadata_fts, 7.0, 4.0, 1.5) + 2.0) AS rank
                FROM asset_metadata_fts
                WHERE asset_metadata_fts MATCH ?
            ),
            best AS (
                SELECT asset_id, MIN(rank) AS rank
                FROM matches
                GROUP BY asset_id
            )
            SELECT
                {total_field}
                a.id, a.filename, a.subfolder, a.filepath, a.kind,
                a.source, a.root_id, a.job_id, a.stack_id,
                a.width, a.height, a.duration, a.size, a.mtime,
                COALESCE(m.rating, 0) as rating,
                COALESCE(m.tags, '[]') as tags,
{metadata_tags_text_clause}{_AI_SELECT_SQL}                    m.has_workflow as has_workflow,
                m.has_generation_data as has_generation_data,
                {_generation_time_ms_select()} as generation_time_ms,
                {_safe_positive_prompt_extract(250)} as positive_prompt,
                NULL as file_creation_time,
                NULL as file_birth_time,
                best.rank as rank
            FROM best
            JOIN assets a ON best.asset_id = a.id
            LEFT JOIN asset_metadata m ON a.id = m.asset_id
            LEFT JOIN vec.asset_embeddings ae ON a.id = ae.asset_id
            WHERE 1=1
        """

    async def _global_fts_total_count(
        self,
        fts_query: str,
        filter_clauses: list[str],
        filter_params: list[Any],
    ) -> int:
        count_sql = """
            WITH matches AS (
                SELECT rowid AS asset_id
                FROM assets_fts
                WHERE assets_fts MATCH ?

                UNION

                SELECT rowid AS asset_id
                FROM asset_metadata_fts
                WHERE asset_metadata_fts MATCH ?
            )
            SELECT COUNT(*) as total
            FROM (SELECT DISTINCT asset_id FROM matches) t
            JOIN assets a ON t.asset_id = a.id
            LEFT JOIN asset_metadata m ON a.id = m.asset_id
            WHERE 1=1
        """
        count_params: list[Any] = [fts_query, fts_query]
        if filter_clauses:
            count_sql += " " + " ".join(filter_clauses)
            count_params.extend(filter_params)
        count_result = await self.db.aquery(count_sql, tuple(count_params))
        if count_result.ok and count_result.data:
            return count_result.data[0]["total"]
        return 0

    async def _search_scoped_browse_rows(
        self,
        *,
        roots_clause: str,
        roots_params: list[Any],
        limit: int,
        offset: int,
        filters: dict[str, Any] | None,
        include_total: bool,
        metadata_tags_text_clause: str,
        sort: str | None,
    ) -> Result[dict[str, Any]]:
        sql_parts = [
            f"""
            SELECT
                a.id, a.filename, a.subfolder, a.filepath, a.kind,
                a.source, a.root_id, a.job_id, a.stack_id,
                a.width, a.height, a.duration, a.size, a.mtime,
                COALESCE(m.rating, 0) as rating,
                COALESCE(m.tags, '[]') as tags,
{metadata_tags_text_clause}{_AI_SELECT_SQL}                    m.has_workflow as has_workflow,
                m.has_generation_data as has_generation_data,
                {_generation_time_ms_select()} as generation_time_ms,
                {_safe_positive_prompt_extract(250)} as positive_prompt,
                NULL as file_creation_time,
                NULL as file_birth_time
            FROM assets a
            LEFT JOIN asset_metadata m ON a.id = m.asset_id
            LEFT JOIN vec.asset_embeddings ae ON a.id = ae.asset_id
            WHERE {roots_clause}
            """
        ]
        params: list[Any] = list(roots_params)

        filter_clauses, filter_params = self._filter_clauses(filters, assert_safe=True)
        sql_parts.extend(filter_clauses)
        params.extend(filter_params)
        sql_parts.append(_build_sort_sql(sort, table_alias="a"))
        sql_parts.append("LIMIT ? OFFSET ?")
        params.extend([limit, offset])

        rows_res = await self._run_search_query_rows(
            " ".join(sql_parts),
            params,
            failure_message="Scoped search query failed",
        )
        if not rows_res.ok:
            return Result.Err(rows_res.code, rows_res.error or "Scoped search query failed")
        rows = rows_res.data or []

        total: int | None = None
        if include_total:
            count_sql = f"""
                SELECT COUNT(*) as total
                FROM assets a
                LEFT JOIN asset_metadata m ON a.id = m.asset_id
                WHERE {roots_clause}
            """
            count_params: list[Any] = list(roots_params)
            if filter_clauses:
                count_sql += " " + " ".join(filter_clauses)
                count_params.extend(filter_params)
            count_result = await self.db.aquery(count_sql, tuple(count_params))
            total = count_result.data[0]["total"] if count_result.ok and count_result.data else 0
        return Result.Ok({"rows": rows, "total": total})

    async def _search_scoped_fts_rows(
        self,
        *,
        fts_query: str,
        roots_clause: str,
        roots_params: list[Any],
        limit: int,
        offset: int,
        filters: dict[str, Any] | None,
        include_total: bool,
        metadata_tags_text_clause: str,
        sort: str | None,
    ) -> Result[dict[str, Any]]:
        sql_parts = [
            f"""
            WITH matches AS (
                SELECT rowid AS asset_id, bm25(assets_fts, 8.0, 1.25) AS rank
                FROM assets_fts
                WHERE assets_fts MATCH ?

                UNION ALL

                SELECT rowid AS asset_id, (bm25(asset_metadata_fts, 7.0, 4.0, 1.5) + 2.0) AS rank
                FROM asset_metadata_fts
                WHERE asset_metadata_fts MATCH ?
            ),
            best AS (
                SELECT asset_id, MIN(rank) AS rank
                FROM matches
                GROUP BY asset_id
            )
            SELECT
                a.id, a.filename, a.subfolder, a.filepath, a.kind,
                a.source, a.root_id, a.job_id, a.stack_id,
                a.width, a.height, a.duration, a.size, a.mtime,
                COALESCE(m.rating, 0) as rating,
                COALESCE(m.tags, '[]') as tags,
{metadata_tags_text_clause}{_AI_SELECT_SQL}                    m.has_workflow as has_workflow,
                m.has_generation_data as has_generation_data,
                {_generation_time_ms_select()} as generation_time_ms,
                {_safe_positive_prompt_extract(250)} as positive_prompt,
                NULL as file_creation_time,
                NULL as file_birth_time,                    best.rank as rank
            FROM best
            JOIN assets a ON best.asset_id = a.id
            LEFT JOIN asset_metadata m ON a.id = m.asset_id
            LEFT JOIN vec.asset_embeddings ae ON a.id = ae.asset_id
            WHERE {roots_clause}
            """
        ]
        params: list[Any] = [fts_query, fts_query]
        params.extend(roots_params)

        filter_clauses, filter_params = self._filter_clauses(filters, assert_safe=True)
        sql_parts.extend(filter_clauses)
        params.extend(filter_params)
        sql_parts.append(_build_sort_sql(sort, table_alias="a", rank_alias="best.rank"))
        sql_parts.append("LIMIT ? OFFSET ?")
        params.extend([limit, offset])

        rows_res = await self._run_search_query_rows(
            " ".join(sql_parts),
            params,
            failure_message="Scoped search query failed",
        )
        if not rows_res.ok:
            return Result.Err(rows_res.code, rows_res.error or "Scoped search query failed")
        rows = rows_res.data or []

        total: int | None = None
        if include_total:
            count_sql = f"""
                WITH matches AS (
                    SELECT rowid AS asset_id
                    FROM assets_fts
                    WHERE assets_fts MATCH ?

                    UNION

                    SELECT rowid AS asset_id
                    FROM asset_metadata_fts
                    WHERE asset_metadata_fts MATCH ?
                )
                SELECT COUNT(*) as total
                FROM (SELECT DISTINCT asset_id FROM matches) t
                JOIN assets a ON t.asset_id = a.id
                LEFT JOIN asset_metadata m ON a.id = m.asset_id
                WHERE {roots_clause}
            """
            count_params: list[Any] = [fts_query, fts_query]
            count_params.extend(roots_params)
            if filter_clauses:
                count_sql += " " + " ".join(filter_clauses)
                count_params.extend(filter_params)
            count_result = await self.db.aquery(count_sql, tuple(count_params))
            total = count_result.data[0]["total"] if count_result.ok and count_result.data else 0
        return Result.Ok({"rows": rows, "total": total})
    async def search(
        self,
        query: str,
        limit: int = 50,
        offset: int = 0,
        filters: dict[str, Any] | None = None,
        include_total: bool = False,
    ) -> Result[dict[str, Any]]:
        """
        Search assets using FTS5 or browse mode when query is '*'.
        """
        limit, offset = _normalize_pagination(limit, offset)
        validation = self._validate_search_query(query)
        if validation:
            return validation

        include_total = bool(include_total)
        logger.debug("Searching for: %s (limit=%s, offset=%s)", query, limit, offset)
        metadata_tags_text_clause = self._build_tags_text_clause()
        return await self._search_assets(
            query=query,
            limit=limit,
            offset=offset,
            filters=filters,
            include_total=include_total,
            metadata_tags_text_clause=metadata_tags_text_clause,
            include_highlight=True,
            roots=None,
        )
    async def search_scoped(
        self,
        query: str,
        roots: list[str],
        limit: int = 50,
        offset: int = 0,
        filters: dict[str, Any] | None = None,
        include_total: bool = False,
        sort: str | None = None,
    ) -> Result[dict[str, Any]]:
        """
        Search assets but restrict results to files whose absolute filepath is under one of the provided roots.

        This is used for UI scopes like Outputs / Inputs / All without breaking the existing DB structure.
        """
        cleaned_roots = _resolve_search_roots(roots)
        if not cleaned_roots:
            return Result.Err("INVALID_INPUT", "Missing or invalid roots")

        limit, offset = _normalize_pagination(limit, offset)
        validation = self._validate_search_query(query)
        if validation:
            return validation

        include_total = bool(include_total)
        logger.debug(f"Searching (scoped) for: {query} (limit={limit}, offset={offset}, roots={len(cleaned_roots)})")
        metadata_tags_text_clause = self._build_tags_text_clause()
        return await self._search_assets(
            query=query,
            limit=limit,
            offset=offset,
            filters=filters,
            include_total=include_total,
            metadata_tags_text_clause=metadata_tags_text_clause,
            include_highlight=False,
            roots=cleaned_roots,
            sort=sort,
        )

    async def _search_assets(
        self,
        *,
        query: str,
        limit: int,
        offset: int,
        filters: dict[str, Any] | None,
        include_total: bool,
        metadata_tags_text_clause: str,
        include_highlight: bool,
        roots: list[str] | None,
        sort: str | None = None,
    ) -> Result[dict[str, Any]]:
        if filters and filters.get("group_stacks"):
            return await self._search_grouped_assets(
                query=query,
                limit=limit,
                offset=offset,
                filters=filters,
                include_total=include_total,
                metadata_tags_text_clause=metadata_tags_text_clause,
                include_highlight=include_highlight,
                roots=roots,
                sort=sort,
            )
        if roots is None:
            return await self._search_unscoped_assets(
                query=query,
                limit=limit,
                offset=offset,
                filters=filters,
                include_total=include_total,
                metadata_tags_text_clause=metadata_tags_text_clause,
                include_highlight=include_highlight,
            )
        return await self._search_scoped_assets(
            query=query,
            roots=roots,
            limit=limit,
            offset=offset,
            filters=filters,
            include_total=include_total,
            metadata_tags_text_clause=metadata_tags_text_clause,
            include_highlight=include_highlight,
            sort=sort,
        )

    async def _search_grouped_assets(
        self,
        *,
        query: str,
        limit: int,
        offset: int,
        filters: dict[str, Any] | None,
        include_total: bool,
        metadata_tags_text_clause: str,
        include_highlight: bool,
        roots: list[str] | None,
        sort: str | None = None,
    ) -> Result[dict[str, Any]]:
        fetch_rows = self._build_grouped_fetch_rows(
            query=query,
            roots=roots,
            filters=filters,
            metadata_tags_text_clause=metadata_tags_text_clause,
            sort=sort,
        )
        grouped_res = await _paginate_grouped_assets(
            fetch_rows,
            lambda rows: _hydrate_search_rows(rows, include_highlight=include_highlight),
            limit=limit,
            offset=offset,
            include_total=include_total,
        )
        if not grouped_res.ok:
            return Result.Err(grouped_res.code, grouped_res.error or "Grouped search query failed")
        grouped_data = grouped_res.data or {}
        return Result.Ok(
            self._build_search_payload(
                assets=grouped_data.get("assets") or [],
                limit=limit,
                offset=offset,
                query=query,
                include_total=include_total,
                total=grouped_data.get("total"),
                sort=sort,
            )
        )

    def _build_grouped_fetch_rows(
        self,
        *,
        query: str,
        roots: list[str] | None,
        filters: dict[str, Any] | None,
        metadata_tags_text_clause: str,
        sort: str | None,
    ):
        is_browse_all = query.strip() == "*"
        if roots is None:

            async def _fetch_global_group_rows(raw_limit: int, raw_offset: int) -> Result[dict[str, Any]]:
                if is_browse_all:
                    return await self._search_global_browse_rows(
                        limit=raw_limit,
                        offset=raw_offset,
                        filters=filters,
                        include_total=False,
                        metadata_tags_text_clause=metadata_tags_text_clause,
                    )
                fts_query = self._sanitize_fts_query(query)
                if not fts_query:
                    return Result.Err("INVALID_INPUT", "Invalid search query syntax")
                return await self._search_global_fts_rows(
                    fts_query=fts_query,
                    limit=raw_limit,
                    offset=raw_offset,
                    filters=filters,
                    include_total=False,
                    metadata_tags_text_clause=metadata_tags_text_clause,
                )

            return _fetch_global_group_rows

        roots_clause, roots_params = _build_roots_where_clause(roots)

        async def _fetch_scoped_group_rows(raw_limit: int, raw_offset: int) -> Result[dict[str, Any]]:
            if is_browse_all:
                return await self._search_scoped_browse_rows(
                    roots_clause=roots_clause,
                    roots_params=roots_params,
                    limit=raw_limit,
                    offset=raw_offset,
                    filters=filters,
                    include_total=False,
                    metadata_tags_text_clause=metadata_tags_text_clause,
                    sort=sort,
                )
            fts_query = self._sanitize_fts_query(query)
            if not fts_query:
                return Result.Err("INVALID_INPUT", "Invalid search query syntax")
            return await self._search_scoped_fts_rows(
                fts_query=fts_query,
                roots_clause=roots_clause,
                roots_params=roots_params,
                limit=raw_limit,
                offset=raw_offset,
                filters=filters,
                include_total=False,
                metadata_tags_text_clause=metadata_tags_text_clause,
                sort=sort,
            )

        return _fetch_scoped_group_rows

    async def _search_unscoped_assets(
        self,
        *,
        query: str,
        limit: int,
        offset: int,
        filters: dict[str, Any] | None,
        include_total: bool,
        metadata_tags_text_clause: str,
        include_highlight: bool,
    ) -> Result[dict[str, Any]]:
        if query.strip() == "*":
            rows_total_res = await self._search_global_browse_rows(
                limit=limit,
                offset=offset,
                filters=filters,
                include_total=include_total,
                metadata_tags_text_clause=metadata_tags_text_clause,
            )
        else:
            fts_query = self._sanitize_fts_query(query)
            if not fts_query:
                return Result.Err("INVALID_INPUT", "Invalid search query syntax")
            rows_total_res = await self._search_global_fts_rows(
                fts_query=fts_query,
                limit=limit,
                offset=offset,
                filters=filters,
                include_total=include_total,
                metadata_tags_text_clause=metadata_tags_text_clause,
            )
        return self._rows_to_search_result(
            rows_total_res,
            query=query,
            limit=limit,
            offset=offset,
            include_total=include_total,
            include_highlight=include_highlight,
            sort=None,
            failure_message="Search query failed",
        )

    async def _search_scoped_assets(
        self,
        *,
        query: str,
        roots: list[str],
        limit: int,
        offset: int,
        filters: dict[str, Any] | None,
        include_total: bool,
        metadata_tags_text_clause: str,
        include_highlight: bool,
        sort: str | None,
    ) -> Result[dict[str, Any]]:
        roots_clause, roots_params = _build_roots_where_clause(roots)
        if query.strip() == "*":
            rows_total_res = await self._search_scoped_browse_rows(
                roots_clause=roots_clause,
                roots_params=roots_params,
                limit=limit,
                offset=offset,
                filters=filters,
                include_total=include_total,
                metadata_tags_text_clause=metadata_tags_text_clause,
                sort=sort,
            )
        else:
            fts_query = self._sanitize_fts_query(query)
            if not fts_query:
                return Result.Err("INVALID_INPUT", "Invalid search query syntax")
            rows_total_res = await self._search_scoped_fts_rows(
                fts_query=fts_query,
                roots_clause=roots_clause,
                roots_params=roots_params,
                limit=limit,
                offset=offset,
                filters=filters,
                include_total=include_total,
                metadata_tags_text_clause=metadata_tags_text_clause,
                sort=sort,
            )
        return self._rows_to_search_result(
            rows_total_res,
            query=query,
            limit=limit,
            offset=offset,
            include_total=include_total,
            include_highlight=include_highlight,
            sort=sort,
            failure_message="Scoped search query failed",
        )

    def _rows_to_search_result(
        self,
        rows_total_res: Result[dict[str, Any]],
        *,
        query: str,
        limit: int,
        offset: int,
        include_total: bool,
        include_highlight: bool,
        sort: str | None,
        failure_message: str,
    ) -> Result[dict[str, Any]]:
        if not rows_total_res.ok:
            return Result.Err(rows_total_res.code, rows_total_res.error or failure_message)
        rows, total = self._search_rows_total(rows_total_res.data)
        assets = _hydrate_search_rows(rows, include_highlight=include_highlight)
        payload = self._build_search_payload(
            assets=assets,
            limit=limit,
            offset=offset,
            query=query,
            include_total=include_total,
            total=total,
            sort=sort,
        )
        return Result.Ok(payload)

    async def has_assets_under_root(self, root: str) -> Result[bool]:
        """
        Return True if the DB contains at least one asset whose filepath is exactly `root`
        or is nested under it (prefix match).
        """
        try:
            resolved = str(Path(root).resolve())
        except Exception as exc:
            return Result.Err("INVALID_INPUT", f"Invalid root: {exc}")

        def _escape_like_pattern(pattern: str) -> str:
            return pattern.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")

        prefix = resolved.rstrip(os.sep) + os.sep
        escaped_prefix = _escape_like_pattern(prefix)
        sql = """
            SELECT 1
            FROM assets a
            WHERE (a.filepath = ? OR a.filepath LIKE ? ESCAPE '\\')
            LIMIT 1
        """
        result = await self.db.aquery(sql, (resolved, f"{escaped_prefix}%"))
        if not result.ok:
            return Result.Err("DB_ERROR", result.error or "Root lookup query failed")
        return Result.Ok(bool(result.data))

    async def date_histogram_scoped(
        self,
        roots: list[str],
        month_start: int,
        month_end: int,
        filters: dict[str, Any] | None = None,
    ) -> Result[dict[str, int]]:
        """
        Return a day->count mapping for assets whose mtime falls inside [month_start, month_end).

        Notes:
        - Uses UTC day buckets to stay aligned with list/search date filters.
        - Intended for calendar "days with assets" indicators (no query/FTS).
        """
        cleaned_roots = _resolve_search_roots(roots)
        if not cleaned_roots:
            return Result.Err("INVALID_INPUT", "Missing or invalid roots")

        month_range = _normalize_month_range(month_start, month_end)
        if month_range is None:
            return Result.Err("INVALID_INPUT", "Invalid month range")
        start_i, end_i = month_range
        roots_clause, roots_params = _build_roots_where_clause(cleaned_roots, alias="a")
        sql, params = _build_histogram_query(roots_clause, roots_params, start_i, end_i, filters)
        result = await self.db.aquery(sql, params)
        if not result.ok:
            return Result.Err("DB_ERROR", result.error or "Histogram query failed")
        return Result.Ok(_coerce_histogram_days(result.data))

    async def get_asset(self, asset_id: int) -> Result[dict[str, Any] | None]:
        """
        Get a single asset by ID.

        Args:
            asset_id: Asset database ID

        Returns:
            Result with asset data or None if not found
        """
        result = await self.db.aquery(
            f"""
            SELECT
                a.*,
                COALESCE(m.rating, 0) AS rating,
                COALESCE(m.tags, '') AS tags,
                COALESCE(m.tags_text, '') AS tags_text,
                m.workflow_hash,
                m.has_workflow AS has_workflow,
                m.has_generation_data AS has_generation_data,
                COALESCE(ae.auto_tags, '[]') as auto_tags,
                CASE
                    WHEN LENGTH(TRIM(COALESCE(a.enhanced_caption, ''))) > 0 THEN 1
                    ELSE 0
                END as has_ai_enhanced_caption,
                CASE
                    WHEN TRIM(COALESCE(ae.auto_tags, '[]')) IN ('', '[]', '[ ]', 'null', 'NULL') THEN 0
                    ELSE 1
                END as has_ai_auto_tags,
                CASE
                    WHEN ae.vector IS NOT NULL AND LENGTH(ae.vector) > 0 THEN 1
                    ELSE 0
                END as has_ai_vector,
                CASE
                    WHEN LENGTH(TRIM(COALESCE(a.enhanced_caption, ''))) > 0
                         OR TRIM(COALESCE(ae.auto_tags, '[]')) NOT IN ('', '[]', '[ ]', 'null', 'NULL')
                         OR (ae.vector IS NOT NULL AND LENGTH(ae.vector) > 0)
                    THEN 1
                    ELSE 0
                END as has_ai_info,
                {_generation_time_ms_select()} as generation_time_ms,
                {_safe_positive_prompt_extract(250)} as positive_prompt,
                COALESCE(m.metadata_raw, '{{}}') AS metadata_raw
            FROM assets a
            LEFT JOIN asset_metadata m ON m.asset_id = a.id
            LEFT JOIN vec.asset_embeddings ae ON ae.asset_id = a.id
            WHERE a.id = ?
            """,
            (asset_id,),
        )

        if not result.ok:
            return Result.Err("QUERY_FAILED", result.error or "Asset lookup failed")

        if not result.data:
            return Result.Ok(None)

        asset = self._hydrate_asset_payload(dict(result.data[0]))
        return Result.Ok(asset)

    async def get_assets(self, asset_ids: list[int]) -> Result[list[dict[str, Any]]]:
        """
        Batch fetch assets by ID (single query).

        Intended for UI batching (viewer preloading) without triggering per-asset metadata extraction.
        """
        cleaned = _normalize_asset_ids(asset_ids)
        if not cleaned:
            return Result.Ok([])

        result = await self.db.aquery_in(
            """
            SELECT
                a.*,
                COALESCE(m.rating, 0) AS rating,
                COALESCE(m.tags, '') AS tags,
                COALESCE(m.tags_text, '') AS tags_text,
                m.workflow_hash,
                m.has_workflow AS has_workflow,
                m.has_generation_data AS has_generation_data,
                COALESCE(ae.auto_tags, '[]') as auto_tags,
                CASE
                    WHEN LENGTH(TRIM(COALESCE(a.enhanced_caption, ''))) > 0 THEN 1
                    ELSE 0
                END as has_ai_enhanced_caption,
                CASE
                    WHEN TRIM(COALESCE(ae.auto_tags, '[]')) IN ('', '[]', '[ ]', 'null', 'NULL') THEN 0
                    ELSE 1
                END as has_ai_auto_tags,
                CASE
                    WHEN ae.vector IS NOT NULL AND LENGTH(ae.vector) > 0 THEN 1
                    ELSE 0
                END as has_ai_vector,
                CASE
                    WHEN LENGTH(TRIM(COALESCE(a.enhanced_caption, ''))) > 0
                         OR TRIM(COALESCE(ae.auto_tags, '[]')) NOT IN ('', '[]', '[ ]', 'null', 'NULL')
                         OR (ae.vector IS NOT NULL AND LENGTH(ae.vector) > 0)
                    THEN 1
                    ELSE 0
                END as has_ai_info,
                COALESCE(m.metadata_quality, 'none') AS metadata_quality,
                COALESCE(m.metadata_raw, '{{}}') AS metadata_raw
            FROM assets a
            LEFT JOIN asset_metadata m ON m.asset_id = a.id
            LEFT JOIN vec.asset_embeddings ae ON ae.asset_id = a.id
            WHERE {IN_CLAUSE}
            """,
            "a.id",
            cleaned,
        )

        if not result.ok:
            return Result.Err("QUERY_FAILED", result.error or "Batch asset lookup failed")

        by_id = _map_assets_by_id(result.data, self._hydrate_asset_payload)
        return Result.Ok(_assets_in_requested_order(cleaned, by_id))

    def _hydrate_asset_payload(self, asset: dict[str, Any]) -> dict[str, Any]:
        return _hydr.hydrate_asset_payload(asset)

    async def lookup_assets_by_filepaths(self, filepaths: list[str]) -> Result[dict[str, dict[str, Any]]]:
        """
        Lookup DB-enriched asset fields for a set of absolute filepaths.

        This is used to enrich filesystem listings (input/custom) without requiring
        a full directory scan on every request.
        """
        cleaned = _normalize_lookup_filepaths(filepaths)
        if not cleaned:
            return Result.Ok({})

        result = await self.db.aquery_in(
            """
            SELECT
                a.filepath,
                a.id,
                a.source,
                a.root_id,
                COALESCE(m.rating, 0) as rating,
                COALESCE(m.tags, '[]') as tags,
                m.has_workflow as has_workflow,
                m.has_generation_data as has_generation_data,
                COALESCE(ae.auto_tags, '[]') as auto_tags,
                CASE
                    WHEN LENGTH(TRIM(COALESCE(a.enhanced_caption, ''))) > 0 THEN 1
                    ELSE 0
                END as has_ai_enhanced_caption,
                CASE
                    WHEN TRIM(COALESCE(ae.auto_tags, '[]')) IN ('', '[]', '[ ]', 'null', 'NULL') THEN 0
                    ELSE 1
                END as has_ai_auto_tags,
                CASE
                    WHEN ae.vector IS NOT NULL AND LENGTH(ae.vector) > 0 THEN 1
                    ELSE 0
                END as has_ai_vector,
                CASE
                    WHEN LENGTH(TRIM(COALESCE(a.enhanced_caption, ''))) > 0
                         OR TRIM(COALESCE(ae.auto_tags, '[]')) NOT IN ('', '[]', '[ ]', 'null', 'NULL')
                         OR (ae.vector IS NOT NULL AND LENGTH(ae.vector) > 0)
                    THEN 1
                    ELSE 0
                END as has_ai_info,
                COALESCE(
                    NULLIF(TRIM(COALESCE(m.workflow_type, '')), ''),
                    CASE WHEN json_valid(COALESCE(m.metadata_raw, '')) THEN json_extract(m.metadata_raw, '$.workflow_type') ELSE NULL END
                ) as workflow_type
            FROM assets a
            LEFT JOIN asset_metadata m ON a.id = m.asset_id
            LEFT JOIN vec.asset_embeddings ae ON a.id = ae.asset_id
            WHERE {IN_CLAUSE}
            """,
            "a.filepath",
            cleaned,
        )
        if not result.ok:
            return Result.Err("DB_ERROR", result.error or "Filepath lookup failed")
        return Result.Ok(_map_lookup_rows(result.data))

    def _sanitize_fts_query(self, query: str) -> str:
        """
        Build a robust FTS5 MATCH query:
        - strips dangerous punctuation/control chars,
        - normalizes accents,
        - supports quoted phrase clauses,
        - and uses OR for very long queries to avoid over-constraining results.
        """
        text = query.strip()
        if not text:
            return "*"

        phrases = _extract_quoted_phrases(text)
        text_wo_quotes = re.sub(r'"[^"]*"|\'[^\']*\'', " ", text)

        sanitized = _strip_diacritics(text_wo_quotes)
        # Replace FTS5 special characters with spaces.
        sanitized = re.sub(r"[\"'\-:&/\\|;@#*~()\[\]{}\.]+", " ", sanitized)
        # Replace non-printable / control chars
        sanitized = re.sub(r"[^\x20-\x7E]+", " ", sanitized)
        # Collapse whitespace
        sanitized = re.sub(r"\s+", " ", sanitized).strip()

        # Normalize case for stable behavior (FTS is case-insensitive anyway).
        sanitized = sanitized.lower()

        # Apply prefix matching to every token to allow partial matches.
        # Avoid FTS reserved operators to prevent malformed MATCH expressions.
        tokens = [tok for tok in sanitized.split() if _is_meaningful_token(tok)]
        tokens = _dedupe_tokens(tokens)

        token_expr = _build_token_match_expression(tokens)
        phrase_terms = [f'"{phrase}"' for phrase in phrases]

        if phrase_terms and token_expr:
            return " OR ".join(phrase_terms + [token_expr])
        if phrase_terms:
            return " OR ".join(phrase_terms)
        if token_expr:
            return token_expr
        return ""

    def _is_malformed_match_error(self, err: Any) -> bool:
        try:
            msg = str(err or "").lower()
        except Exception:
            return False
        return "malformed match expression" in msg or "fts5: syntax error" in msg

    def _validate_search_input(self, query: str) -> Result[Any] | None:
        trimmed = query.strip()
        # Allow "browse all" queries.
        if trimmed == "*" or (trimmed and all(token == "*" for token in trimmed.split())):
            return None
        length_error = self._validate_query_length(trimmed)
        if length_error:
            return length_error
        tokens = trimmed.split()
        token_error = self._validate_query_tokens(tokens)
        if token_error:
            return token_error
        wildcard_error = self._validate_wildcard_mix(tokens)
        if wildcard_error:
            return wildcard_error

        return None

    @staticmethod
    def _validate_query_length(trimmed: str) -> Result[Any] | None:
        if len(trimmed) <= MAX_SEARCH_QUERY_LENGTH:
            return None
        return Result.Err(
            "QUERY_TOO_LONG",
            f"Search queries must be at most {MAX_SEARCH_QUERY_LENGTH} characters"
        )

    @staticmethod
    def _validate_query_tokens(tokens: list[str]) -> Result[Any] | None:
        if len(tokens) > MAX_SEARCH_TOKENS:
            return Result.Err(
                "QUERY_TOO_COMPLEX",
                f"Use at most {MAX_SEARCH_TOKENS} tokens for search queries"
            )
        if any(len(token) > MAX_TOKEN_LENGTH for token in tokens):
            return Result.Err(
                "TOKEN_TOO_LONG",
                f"Each search token must be under {MAX_TOKEN_LENGTH} characters"
            )
        return None

    @staticmethod
    def _validate_wildcard_mix(tokens: list[str]) -> Result[Any] | None:
        wildcard_hits = sum(1 for token in tokens if token == "*")
        if wildcard_hits > 0 and wildcard_hits >= len(tokens) - 1:
            return Result.Err(
                "QUERY_TOO_GENERAL",
                "Search query must contain at least one non-wildcard term"
            )
        return None

    def _build_tags_text_clause(self) -> str:
        if self._has_tags_text_column:
            return "                    COALESCE(m.tags_text, '') as tags_text,\n"
        return ""
