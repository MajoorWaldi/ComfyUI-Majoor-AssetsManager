"""
Index searcher - handles asset search and retrieval operations.
"""
import json
import os
import re
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

logger = get_logger(__name__)

def _normalize_extension(value) -> str:
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
VALID_SORT_KEYS = {"mtime_desc", "mtime_asc", "name_asc", "name_desc"}
_SAFE_SQL_FRAGMENT_RE = re.compile(r"^[\s\w\.\(\)=<>\?!,'\\%:-]+$")
_FTS_RESERVED = {"AND", "OR", "NOT", "NEAR"}


def _normalize_sort_key(sort: str | None) -> str:
    s = str(sort or "").strip().lower()
    if s in VALID_SORT_KEYS:
        return s
    return "mtime_desc"


def _build_sort_sql(sort: str | None, *, table_alias: str = "a", rank_alias: str | None = None) -> str:
    key = _normalize_sort_key(sort)
    if key == "name_asc":
        return f"ORDER BY LOWER({table_alias}.filename) ASC, {table_alias}.id DESC"
    if key == "name_desc":
        return f"ORDER BY LOWER({table_alias}.filename) DESC, {table_alias}.id DESC"
    if key == "mtime_asc":
        return f"ORDER BY {table_alias}.mtime ASC, {table_alias}.id ASC"
    if rank_alias:
        return f"ORDER BY {table_alias}.mtime DESC, {rank_alias} ASC, {table_alias}.id DESC"
    return f"ORDER BY {table_alias}.mtime DESC, {table_alias}.id DESC"


def _build_filter_clauses(filters: dict[str, Any] | None, alias: str = "a") -> tuple[list[str], list[Any]]:
    clauses: list[str] = []
    params: list[Any] = []
    if not filters:
        return clauses, params
    _append_kind_and_source_filters(filters, alias, clauses, params)
    _append_extension_filter(filters, alias, clauses, params)
    _append_numeric_range_filters(filters, alias, clauses, params)
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


def _append_workflow_type_filter(filters: dict[str, Any], clauses: list[str], params: list[Any]) -> None:
    if "workflow_type" not in filters:
        return
    raw = str(filters.get("workflow_type") or "").strip().upper()
    variants = _workflow_type_variants(raw)
    if not variants:
        return
    placeholders = ", ".join("?" for _ in variants)
    clauses.append(
        "AND UPPER(COALESCE("
        "json_extract(m.metadata_raw, '$.workflow_type'), "
        "json_extract(m.metadata_raw, '$.geninfo.engine.type'), "
        "json_extract(m.metadata_raw, '$.engine.type'), "
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
    if want_workflow:
        clauses.append(
            "AND ("
            "COALESCE(m.has_workflow, 0) = 1 "
            "OR json_extract(m.metadata_raw, '$.workflow') IS NOT NULL "
            "OR json_extract(m.metadata_raw, '$.prompt') IS NOT NULL "
            "OR json_extract(m.metadata_raw, '$.parameters') IS NOT NULL"
            ")"
        )
        return
    clauses.append(
        "AND ("
        "COALESCE(m.has_workflow, 0) = 0 "
        "AND json_extract(m.metadata_raw, '$.workflow') IS NULL "
        "AND json_extract(m.metadata_raw, '$.prompt') IS NULL "
        "AND json_extract(m.metadata_raw, '$.parameters') IS NULL"
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
            strftime('%Y-%m-%d', a.mtime, 'unixepoch', 'localtime') AS day,
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
    fp = row.get("filepath")
    if not fp:
        return None
    item = dict(row)
    tags_raw = item.get("tags")
    if tags_raw:
        try:
            item["tags"] = json.loads(tags_raw) if isinstance(tags_raw, str) else tags_raw
        except Exception:
            item["tags"] = []
    else:
        item["tags"] = []
    return str(fp), item


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
    assets: list[dict[str, Any]] = []
    for row in rows:
        asset = dict(row)
        if asset.get("tags"):
            try:
                asset["tags"] = json.loads(asset["tags"])
            except (ValueError, json.JSONDecodeError, TypeError):
                asset["tags"] = []
        else:
            asset["tags"] = []
        asset.setdefault("tags_text", "")
        if include_highlight:
            asset["highlight"] = asset.get("highlight") or None
        assets.append(asset)
    return assets


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
            res = await self.db.aquery(
                "SELECT term FROM asset_metadata_vocab WHERE term LIKE ? ORDER BY doc DESC LIMIT ?",
                (f"{clean_prefix}%", limit)
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
    ) -> Result[dict[str, Any]]:
        sql_parts = [
            f"""
            SELECT
                a.id, a.filename, a.subfolder, a.filepath, a.kind,
                a.source, a.root_id,
                a.width, a.height, a.duration, a.size, a.mtime,
                COALESCE(m.rating, 0) as rating,
                COALESCE(m.tags, '[]') as tags,
{metadata_tags_text_clause}                    m.has_workflow as has_workflow,
                m.has_generation_data as has_generation_data,
                NULL as generation_time_ms,
                NULL as file_creation_time,
                NULL as file_birth_time
            FROM assets a
            LEFT JOIN asset_metadata m ON a.id = m.asset_id
            WHERE 1=1
            """
        ]
        params: list[Any] = []

        filter_clauses, filter_params = self._filter_clauses(filters)
        sql_parts.extend(filter_clauses)
        params.extend(filter_params)
        sql_parts.append("ORDER BY a.mtime DESC")
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
                SELECT rowid AS asset_id, bm25(assets_fts) AS rank
                FROM assets_fts
                WHERE assets_fts MATCH ?

                UNION ALL

                SELECT rowid AS asset_id, (bm25(asset_metadata_fts) + 8.0) AS rank
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
                a.source, a.root_id,
                a.width, a.height, a.duration, a.size, a.mtime,
                COALESCE(m.rating, 0) as rating,
                COALESCE(m.tags, '[]') as tags,
{metadata_tags_text_clause}                    m.has_workflow as has_workflow,
                m.has_generation_data as has_generation_data,
                NULL as generation_time_ms,
                NULL as file_creation_time,
                NULL as file_birth_time,
                best.rank as rank
            FROM best
            JOIN assets a ON best.asset_id = a.id
            LEFT JOIN asset_metadata m ON a.id = m.asset_id
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
                a.width, a.height, a.duration, a.size, a.mtime,
                COALESCE(m.rating, 0) as rating,
                COALESCE(m.tags, '[]') as tags,
{metadata_tags_text_clause}                    m.has_workflow as has_workflow,
                m.has_generation_data as has_generation_data,
                NULL as generation_time_ms,
                NULL as file_creation_time,
                NULL as file_birth_time
            FROM assets a
            LEFT JOIN asset_metadata m ON a.id = m.asset_id
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
                SELECT rowid AS asset_id, bm25(assets_fts) AS rank
                FROM assets_fts
                WHERE assets_fts MATCH ?

                UNION ALL

                SELECT rowid AS asset_id, (bm25(asset_metadata_fts) + 8.0) AS rank
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
                a.width, a.height, a.duration, a.size, a.mtime,
                COALESCE(m.rating, 0) as rating,
                COALESCE(m.tags, '[]') as tags,
{metadata_tags_text_clause}                    m.has_workflow as has_workflow,
                m.has_generation_data as has_generation_data,
                NULL as generation_time_ms,
                NULL as file_creation_time,
                NULL as file_birth_time,                    best.rank as rank
            FROM best
            JOIN assets a ON best.asset_id = a.id
            LEFT JOIN asset_metadata m ON a.id = m.asset_id
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

        if not rows_total_res.ok:
            return Result.Err(rows_total_res.code, rows_total_res.error or "Search query failed")

        rows, total = self._search_rows_total(rows_total_res.data)
        assets = _hydrate_search_rows(rows, include_highlight=True)
        logger.debug("Found %s results (total=%s)", len(assets), total if include_total else "skipped")
        return Result.Ok(
            self._build_search_payload(
                assets=assets,
                limit=limit,
                offset=offset,
                query=query,
                include_total=include_total,
                total=total,
            )
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

        is_browse_all = query.strip() == "*"
        roots_clause, roots_params = _build_roots_where_clause(cleaned_roots)
        if is_browse_all:
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

        if not rows_total_res.ok:
            return Result.Err(rows_total_res.code, rows_total_res.error or "Scoped search query failed")

        rows, total = self._search_rows_total(rows_total_res.data)
        assets = _hydrate_search_rows(rows, include_highlight=False)
        return Result.Ok(
            self._build_search_payload(
                assets=assets,
                limit=limit,
                offset=offset,
                query=query,
                include_total=include_total,
                total=total,
                sort=sort,
            )
        )

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
        - Uses localtime conversion to match the UI's date filters (which use local time).
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
            """
            SELECT
                a.*,
                COALESCE(m.rating, 0) AS rating,
                COALESCE(m.tags, '') AS tags,
                COALESCE(m.tags_text, '') AS tags_text,
                m.workflow_hash,
                m.has_workflow AS has_workflow,
                m.has_generation_data AS has_generation_data,
                json_extract(m.metadata_raw, '$.generation_time_ms') as generation_time_ms,
                COALESCE(m.metadata_raw, '{}') AS metadata_raw
            FROM assets a
            LEFT JOIN asset_metadata m ON m.asset_id = a.id
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
                COALESCE(m.metadata_quality, 'none') AS metadata_quality,
                COALESCE(m.metadata_raw, '{{}}') AS metadata_raw
            FROM assets a
            LEFT JOIN asset_metadata m ON m.asset_id = a.id
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
        # Parse tags JSON (stored as string in DB)
        tags_raw = asset.get("tags") or ""
        if tags_raw:
            try:
                asset["tags"] = json.loads(tags_raw)
            except (ValueError, json.JSONDecodeError, TypeError):
                asset["tags"] = []
        else:
            asset["tags"] = []

        # Parse metadata_raw JSON and expose common top-level fields for the UI.
        metadata_raw_text = asset.get("metadata_raw") or "{}"
        try:
            metadata_obj = json.loads(metadata_raw_text) if isinstance(metadata_raw_text, str) else metadata_raw_text
        except (ValueError, json.JSONDecodeError, TypeError):
            metadata_obj = {}

        asset["metadata_raw"] = metadata_obj
        if isinstance(metadata_obj, dict):
            # Common nested fields produced by our extractors
            asset.setdefault("prompt", metadata_obj.get("prompt"))
            asset.setdefault("workflow", metadata_obj.get("workflow"))
            asset.setdefault("exif", metadata_obj.get("exif") or metadata_obj.get("raw"))
            asset.setdefault("geninfo", metadata_obj.get("geninfo"))

        return asset

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
                m.has_generation_data as has_generation_data
            FROM assets a
            LEFT JOIN asset_metadata m ON a.id = m.asset_id
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
        Escape special characters for FTS5, collapse whitespace, and add wildcards
        for partial prefix matching (Google-like behavior).
        """
        text = query.strip()
        if not text:
            return "*"

        # Replace FTS5 special characters with spaces
        sanitized = re.sub(r"[\"'\-:&/\\|;@#*~()\[\]{}\.]+", " ", text)
        # Replace non-printable / control chars
        sanitized = re.sub(r"[^\x20-\x7E]+", " ", sanitized)
        # Collapse whitespace
        sanitized = re.sub(r"\s+", " ", sanitized).strip()

        if not sanitized:
            return "*"

        # Normalize case for stable behavior (FTS is case-insensitive anyway).
        sanitized = sanitized.lower()

        # Apply prefix matching to every token to allow partial matches (e.g. "dark" -> "dark*").
        # Avoid FTS reserved operators to prevent malformed MATCH expressions.
        tokens = [tok for tok in sanitized.split() if tok and tok.upper() not in _FTS_RESERVED]
        if not tokens:
            return ""
        return " ".join(f"{token}*" for token in tokens)

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
