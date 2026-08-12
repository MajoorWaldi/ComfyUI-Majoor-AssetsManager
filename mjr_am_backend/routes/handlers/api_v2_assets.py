"""
``/api/v2/assets/*`` — OpenAPI-aligned read-only compat layer (Phase 3.1).

This module exposes a small, schema-stable REST surface that mirrors the
ComfyUI core ``/api/assets/*`` endpoints defined in ``openapi.yaml`` (the
official spec used by Cloud and Desktop clients). We use the ``v2`` prefix
to avoid colliding with the core's own ``/api/assets/*`` routes when the
plugin is loaded alongside an asset-aware ComfyUI build.

Scope of this first cut (read-only, additive):

* ``HEAD /api/v2/assets/hash/{hash}``       — existence check by content hash
* ``GET  /api/v2/assets``                   — paginated list with basic filters
* ``GET  /api/v2/assets/{id}``              — single asset metadata
* ``GET  /api/v2/assets/{id}/content``      — binary file stream
* ``GET  /api/v2/assets/{id}/tags``         — tag list for one asset

Mutations (POST/PUT/PATCH/DELETE) are intentionally *not* implemented yet:
they would duplicate complex side-effecting flows already exposed under
``/mjr/am/*`` (asset rename, tag write, delete) and are out of scope for a
compat-only read surface. They can be layered on later without breaking
schema contracts.

Notes / deliberate gaps:

* Asset IDs are returned as **stringified integers** even though the OpenAPI
  schema uses ``uuid``. Clients should treat ``id`` opaquely. The lookup
  endpoints accept either a numeric ID or, when prefixed ``blake3:``, a
  content-hash lookup.
* ``hash`` is reported as ``blake3:<hex>`` only when ``hash_algo='blake3'``;
  otherwise omitted (spec allows nullable).
* ``preview_url`` points at our existing viewer endpoint so the compat layer
  stays self-contained.
"""

from __future__ import annotations

import json
import mimetypes
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from aiohttp import web
from mjr_am_backend.shared import Result, get_logger

from ..core import _is_path_allowed, _json_response, _require_services

logger = get_logger(__name__)


# --------------------------------------------------------------------------- #
# Constants
# --------------------------------------------------------------------------- #

# Cap defensively — the OpenAPI default is 50; we allow up to 500 like our
# existing /mjr/am/list endpoint to stay consistent with internal callers.
DEFAULT_LIMIT = 50
MAX_LIMIT = 500
MAX_OFFSET = 1_000_000

_ERROR_HTTP_STATUS = {
    "INVALID_INPUT": 400,
    "INVALID_JSON": 400,
    "AUTH_REQUIRED": 401,
    "CSRF": 403,
    "NOT_FOUND": 404,
    "CONFLICT": 409,
    "RATE_LIMIT": 429,
    "SERVICE_UNAVAILABLE": 503,
    "TOOL_MISSING": 503,
    "DB_ERROR": 503,
    "TIMEOUT": 504,
}


def _api_error_response(result: Result[Any]) -> web.Response:
    """Return an HTTP-semantic error for the versioned compatibility API."""
    code = str(result.code or "").upper()
    status = _ERROR_HTTP_STATUS.get(code, 500)
    return _json_response(result, status=status)

VALID_SORT_FIELDS = {
    "name": "a.filename",
    "size": "a.size",
    "created_at": "a.created_at",
    "updated_at": "a.updated_at",
    "mtime": "a.mtime",
}


# --------------------------------------------------------------------------- #
# Schema mapping helpers
# --------------------------------------------------------------------------- #


def _iso(value: Any) -> str | None:
    """Coerce SQLite TIMESTAMP / unix-epoch / ISO string to RFC3339 UTC."""
    if value in (None, ""):
        return None
    # Numeric epoch
    if isinstance(value, (int, float)):
        try:
            return datetime.fromtimestamp(float(value), tz=timezone.utc).isoformat()
        except (OverflowError, OSError, ValueError):
            return None
    text = str(value).strip()
    if not text:
        return None
    # SQLite "YYYY-MM-DD HH:MM:SS" → assume UTC
    try:
        if "T" in text:
            dt = datetime.fromisoformat(text.replace("Z", "+00:00"))
        else:
            dt = datetime.strptime(text, "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()
    except ValueError:
        return text  # last resort: pass through


def _guess_mime(filename: str, ext: str | None) -> str:
    mt, _ = mimetypes.guess_type(filename or f"_.{(ext or '').lstrip('.')}")
    return mt or "application/octet-stream"


def _parse_tags(raw: Any) -> list[str]:
    if isinstance(raw, list):
        return [str(t) for t in raw if isinstance(t, str)]
    if isinstance(raw, str) and raw.strip():
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            return []
        if isinstance(parsed, list):
            return [str(t) for t in parsed if isinstance(t, str)]
    return []


def _parse_user_metadata(raw: Any) -> dict[str, Any]:
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str) and raw.strip():
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            return {}
        if isinstance(parsed, dict):
            return parsed
    return {}


def _system_metadata(row: dict[str, Any]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for key in (
        "filepath",
        "subfolder",
        "source",
        "root_id",
        "kind",
        "ext",
        "duration",
        "phash",
        "hash_algo",
        "enrichment_level",
        "source_node_id",
        "source_node_type",
        "stack_id",
        "workflow_id",
        "workflow_type",
        "metadata_quality",
        "has_workflow",
        "has_generation_data",
        "generation_time_ms",
    ):
        value = row.get(key)
        if value not in (None, ""):
            out[key] = value
    return out


def _format_hash(row: dict[str, Any]) -> str | None:
    """Return ``blake3:<hex>`` when applicable, else None."""
    algo = str(row.get("hash_algo") or "").strip().lower()
    raw = str(row.get("content_hash") or "").strip().lower()
    if not raw:
        return None
    # Strip an existing "algo:" prefix if present
    if ":" in raw:
        prefix, _, rest = raw.partition(":")
        algo = algo or prefix
        raw = rest
    if algo == "blake3" and len(raw) == 64 and all(c in "0123456789abcdef" for c in raw):
        return f"blake3:{raw}"
    return None


def _row_to_asset(row: dict[str, Any]) -> dict[str, Any]:
    """Map an ``assets`` JOIN ``asset_metadata`` row → OpenAPI ``Asset``."""
    filename = str(row.get("filename") or "").strip()
    ext = str(row.get("ext") or "").lstrip(".").lower() or None
    asset_id = str(row.get("id"))
    hash_str = _format_hash(row)

    asset: dict[str, Any] = {
        "id": asset_id,
        "name": filename or asset_id,
        "size": int(row.get("size") or 0),
        "mime_type": _guess_mime(filename, ext),
        "tags": _parse_tags(row.get("tags")),
        "user_metadata": _parse_user_metadata(row.get("metadata_raw")),
        "metadata": _system_metadata(row),
        "preview_url": f"/mjr/am/viewer/asset/{asset_id}",
        "created_at": _iso(row.get("created_at")),
        "updated_at": _iso(row.get("updated_at")),
        "last_access_time": _iso(row.get("mtime")),
        "is_immutable": False,
    }
    if hash_str:
        # Spec keeps `asset_hash` as a deprecated alias of `hash`.
        asset["hash"] = hash_str
        asset["asset_hash"] = hash_str

    width = row.get("width")
    height = row.get("height")
    if width is not None:
        asset["width"] = int(width)
    if height is not None:
        asset["height"] = int(height)

    job_id = str(row.get("job_id") or "").strip()
    if job_id:
        asset["job_id"] = job_id
        # `prompt_id` is the deprecated alias in the spec.
        asset["prompt_id"] = job_id

    # Hoist workflow_id to the top level. The column on ``assets`` is the
    # primary source; fall back to ``user_metadata.workflow.id`` for rows
    # whose ingestion landed before workflow_id was lifted into the schema.
    workflow_id = str(row.get("workflow_id") or "").strip()
    if not workflow_id:
        user_meta = asset.get("user_metadata") or {}
        wf = user_meta.get("workflow") if isinstance(user_meta, dict) else None
        if isinstance(wf, dict):
            workflow_id = str(wf.get("id") or "").strip()
    if workflow_id:
        asset["workflow_id"] = workflow_id
        # Also mirror it inside ``metadata`` so existing consumers that read
        # the system-metadata block keep working.
        if isinstance(asset.get("metadata"), dict):
            asset["metadata"].setdefault("workflow_id", workflow_id)

    return asset


# --------------------------------------------------------------------------- #
# DB queries
# --------------------------------------------------------------------------- #


_ASSETS_SELECT = """
SELECT
    a.id, a.filename, a.filepath, a.subfolder, a.source, a.root_id,
    a.kind, a.ext, a.size, a.mtime, a.width, a.height, a.duration,
    a.created_at, a.updated_at, a.indexed_at,
    a.content_hash, a.phash, a.hash_algo, a.enrichment_level,
    a.job_id, a.stack_id, a.workflow_id,
    a.source_node_id, a.source_node_type,
    COALESCE((
        SELECT '[' || group_concat(json_quote(name)) || ']'
        FROM (
            SELECT t.name AS name
            FROM asset_tags at
            JOIN tags t ON t.id = at.tag_id
            WHERE at.asset_id = a.id
            ORDER BY t.name
        )
    ), '[]') AS tags,
    COALESCE(m.metadata_raw, '') AS metadata_raw,
    COALESCE(m.workflow_type, '') AS workflow_type,
    COALESCE(m.metadata_quality, 'none') AS metadata_quality,
    COALESCE(m.has_workflow, 0) AS has_workflow,
    COALESCE(m.has_generation_data, 0) AS has_generation_data,
    m.generation_time_ms AS generation_time_ms
FROM assets a
LEFT JOIN asset_metadata m ON m.asset_id = a.id
"""


async def _query_one(db: Any, where: str, params: tuple) -> dict[str, Any] | None:
    sql = f"{_ASSETS_SELECT} WHERE {where} LIMIT 1"
    res = await db.aquery(sql, params)
    if not res.ok or not res.data:
        return None
    rows = res.data
    return rows[0] if isinstance(rows, list) and rows else None


async def _query_list(
    db: Any,
    *,
    limit: int,
    offset: int,
    name_contains: str | None,
    include_tags: list[str],
    exclude_tags: list[str],
    sort_col: str,
    order: str,
) -> tuple[list[dict[str, Any]], int]:
    clauses: list[str] = []
    params: list[Any] = []

    if name_contains:
        clauses.append("LOWER(a.filename) LIKE ?")
        params.append(f"%{name_contains.lower()}%")

    # Tag filters use the normalized ``asset_tags`` + ``tags`` tables
    # (case-insensitive via COLLATE NOCASE on tags.name; backed by
    # idx_asset_tags_tag and the UNIQUE index on tags.name).
    for tag in include_tags:
        clauses.append(
            "EXISTS (SELECT 1 FROM asset_tags at "
            "JOIN tags t ON t.id = at.tag_id "
            "WHERE at.asset_id = a.id AND t.name = ?)"
        )
        params.append(tag)
    for tag in exclude_tags:
        clauses.append(
            "NOT EXISTS (SELECT 1 FROM asset_tags at "
            "JOIN tags t ON t.id = at.tag_id "
            "WHERE at.asset_id = a.id AND t.name = ?)"
        )
        params.append(tag)

    where_sql = f"WHERE {' AND '.join(clauses)}" if clauses else ""

    count_sql = (
        f"SELECT COUNT(*) AS n FROM assets a "
        f"LEFT JOIN asset_metadata m ON m.asset_id = a.id {where_sql}"
    )
    count_res = await db.aquery(count_sql, tuple(params))
    total = 0
    if count_res.ok and count_res.data:
        try:
            total = int(count_res.data[0].get("n") or 0)
        except (TypeError, ValueError, AttributeError):
            total = 0

    order_kw = "DESC" if order.lower() == "desc" else "ASC"
    list_sql = (
        f"{_ASSETS_SELECT} {where_sql} "
        f"ORDER BY {sort_col} {order_kw} LIMIT ? OFFSET ?"
    )
    list_res = await db.aquery(list_sql, tuple([*params, limit, offset]))
    rows: list[dict[str, Any]] = []
    if list_res.ok and isinstance(list_res.data, list):
        rows = list_res.data
    return rows, total


# --------------------------------------------------------------------------- #
# Lookup helpers
# --------------------------------------------------------------------------- #


def _resolve_asset_id(asset_id: str) -> tuple[str, tuple]:
    """
    Map an opaque ``id`` from the URL to ``(where_clause, params)``.

    Numeric → primary key. ``blake3:<hex>`` → content-hash lookup.
    """
    asset_id = (asset_id or "").strip()
    if asset_id.lower().startswith("blake3:"):
        hex_part = asset_id.split(":", 1)[1].strip().lower()
        return "LOWER(a.content_hash) IN (?, ?) AND a.hash_algo = 'blake3'", (
            hex_part,
            f"blake3:{hex_part}",
        )
    try:
        return "a.id = ?", (int(asset_id),)
    except ValueError:
        # Treat anything else as filename match for forgiving clients.
        return "a.filename = ?", (asset_id,)


def _safe_resolve_filepath(filepath: str) -> Path | None:
    """Resolve and validate that the DB-recorded filepath is inside allowed roots."""
    if not filepath:
        return None
    try:
        path = Path(filepath).resolve(strict=False)
    except (OSError, ValueError):
        return None
    try:
        if not _is_path_allowed(path, must_exist=True):
            return None
    except Exception:
        # _is_path_allowed should not raise; defence in depth.
        return None
    return path


# --------------------------------------------------------------------------- #
# Query-string parsers
# --------------------------------------------------------------------------- #


def _parse_int(value: str | None, default: int, *, lo: int, hi: int) -> int:
    if value is None or value == "":
        return default
    try:
        parsed = int(value)
    except ValueError:
        return default
    return max(lo, min(hi, parsed))


def _parse_multi(query: dict[str, list[str]], key: str) -> list[str]:
    raw = query.get(key) or []
    out: list[str] = []
    for entry in raw:
        for token in str(entry).split(","):
            t = token.strip()
            if t:
                out.append(t)
    return out


# --------------------------------------------------------------------------- #
# Handlers
# --------------------------------------------------------------------------- #


async def _list_assets(request: web.Request) -> web.Response:
    services, err = await _require_services()
    if err is not None:
        return _api_error_response(err)
    if not isinstance(services, dict) or "db" not in services:
        return _api_error_response(Result.Err("SERVICE_UNAVAILABLE", "Database unavailable"))

    q = request.rel_url.query

    limit = _parse_int(q.get("limit"), DEFAULT_LIMIT, lo=1, hi=MAX_LIMIT)
    offset = _parse_int(q.get("offset"), 0, lo=0, hi=MAX_OFFSET)
    sort_field = (q.get("sort") or "created_at").strip().lower()
    sort_col = VALID_SORT_FIELDS.get(sort_field, VALID_SORT_FIELDS["created_at"])
    order = (q.get("order") or "desc").strip().lower()
    name_contains = (q.get("name_contains") or "").strip() or None

    # aiohttp's MultiDict supports `getall`; expose as plain dict[list] for parser.
    multi = {k: q.getall(k, []) for k in ("include_tags", "exclude_tags")}
    include_tags = _parse_multi(multi, "include_tags")
    exclude_tags = _parse_multi(multi, "exclude_tags")

    try:
        rows, total = await _query_list(
            services["db"],
            limit=limit,
            offset=offset,
            name_contains=name_contains,
            include_tags=include_tags,
            exclude_tags=exclude_tags,
            sort_col=sort_col,
            order=order,
        )
    except Exception as exc:
        logger.warning("api/v2/assets list failed: %s", exc, exc_info=True)
        return _api_error_response(Result.Err("DB_ERROR", "Asset listing failed"))

    assets = [_row_to_asset(row) for row in rows]
    payload = {
        "assets": assets,
        "total": total,
        "has_more": (offset + len(assets)) < total,
    }
    return web.json_response(payload)


async def _check_asset_by_hash(request: web.Request) -> web.Response:
    raw = request.match_info.get("hash", "")
    hash_input = (raw or "").strip().lower()
    if not hash_input:
        return web.Response(status=404)

    if hash_input.startswith("blake3:"):
        hex_part = hash_input.split(":", 1)[1].strip()
    else:
        hex_part = hash_input

    if len(hex_part) != 64 or not all(c in "0123456789abcdef" for c in hex_part):
        return web.Response(status=404)

    services, _err = await _require_services()
    if not isinstance(services, dict) or "db" not in services:
        return web.Response(status=503)

    try:
        res = await services["db"].aquery(
            "SELECT 1 FROM assets WHERE LOWER(content_hash) IN (?, ?) "
            "AND hash_algo = 'blake3' LIMIT 1",
            (hex_part, f"blake3:{hex_part}"),
        )
    except Exception as exc:
        logger.warning("api/v2/assets hash check failed: %s", exc, exc_info=True)
        return web.Response(status=500)

    found = bool(res.ok and res.data)
    return web.Response(status=200 if found else 404)


async def _get_asset(request: web.Request) -> web.Response:
    asset_id = request.match_info.get("id", "")
    services, err = await _require_services()
    if err is not None:
        return _api_error_response(err)
    if not isinstance(services, dict) or "db" not in services:
        return _api_error_response(Result.Err("SERVICE_UNAVAILABLE", "Database unavailable"))

    where, params = _resolve_asset_id(asset_id)
    try:
        row = await _query_one(services["db"], where, params)
    except Exception as exc:
        logger.warning("api/v2/assets get failed: %s", exc, exc_info=True)
        return _api_error_response(Result.Err("DB_ERROR", "Asset lookup failed"))

    if row is None:
        return web.json_response({"error": "Asset not found"}, status=404)
    return web.json_response(_row_to_asset(row))


async def _get_asset_content(request: web.Request) -> web.StreamResponse:
    asset_id = request.match_info.get("id", "")
    services, _err = await _require_services()
    if not isinstance(services, dict) or "db" not in services:
        return web.json_response({"error": "Database unavailable"}, status=503)

    where, params = _resolve_asset_id(asset_id)
    try:
        row = await _query_one(services["db"], where, params)
    except Exception as exc:
        logger.warning("api/v2/assets content lookup failed: %s", exc, exc_info=True)
        return web.json_response({"error": "Asset lookup failed"}, status=500)
    if row is None:
        return web.json_response({"error": "Asset not found"}, status=404)

    filepath = str(row.get("filepath") or "").strip()
    path = _safe_resolve_filepath(filepath)
    if path is None or not path.is_file():
        return web.json_response({"error": "Asset content unavailable"}, status=404)

    resp = web.FileResponse(path=str(path))
    resp.headers["Content-Type"] = _guess_mime(
        str(row.get("filename") or ""),
        str(row.get("ext") or "") or None,
    )
    resp.headers["X-Content-Type-Options"] = "nosniff"
    return resp


async def _get_asset_tags(request: web.Request) -> web.Response:
    asset_id = request.match_info.get("id", "")
    services, err = await _require_services()
    if err is not None:
        return _api_error_response(err)
    if not isinstance(services, dict) or "db" not in services:
        return _api_error_response(Result.Err("SERVICE_UNAVAILABLE", "Database unavailable"))

    where, params = _resolve_asset_id(asset_id)
    try:
        row = await _query_one(services["db"], where, params)
    except Exception as exc:
        logger.warning("api/v2/assets tags lookup failed: %s", exc, exc_info=True)
        return _api_error_response(Result.Err("DB_ERROR", "Asset lookup failed"))

    if row is None:
        return web.json_response({"error": "Asset not found"}, status=404)
    return web.json_response({"tags": _parse_tags(row.get("tags"))})


async def _seed_status(request: web.Request) -> web.Response:
    """Compat shim for ``GET /api/v2/assets/seed/status``.

    We do not run a background "seeder" the way ComfyUI core does; our
    ingestion pipeline is the scanner + watcher loop. This endpoint reports
    a derived snapshot so clients can poll for a stable, schema-aligned
    response. The ``state`` field is always ``"idle"`` because there is no
    pausable seeder process to surface here.
    """
    services, err = await _require_services()
    if err is not None:
        return _api_error_response(err)
    if not isinstance(services, dict) or "db" not in services:
        return _api_error_response(Result.Err("SERVICE_UNAVAILABLE", "Database unavailable"))
    db = services["db"]

    try:
        total_res = await db.aquery("SELECT COUNT(*) AS n FROM assets")
        level_res = await db.aquery(
            "SELECT enrichment_level AS lvl, COUNT(*) AS n FROM assets "
            "GROUP BY enrichment_level"
        )
    except Exception as exc:
        logger.warning("api/v2/assets seed/status failed: %s", exc, exc_info=True)
        return _api_error_response(Result.Err("DB_ERROR", "Seed status lookup failed"))

    total = 0
    if total_res.ok and total_res.data:
        try:
            total = int(total_res.data[0].get("n") or 0)
        except (TypeError, ValueError, AttributeError):
            total = 0

    by_level: dict[str, int] = {}
    enriched = 0
    if level_res.ok and isinstance(level_res.data, list):
        for row in level_res.data:
            raw_lvl = row.get("lvl")
            key = "unknown" if raw_lvl is None else str(raw_lvl)
            count = int(row.get("n") or 0)
            by_level[key] = count
            # ``enrichment_level`` ranges 0 (stub) → 2 (full).
            try:
                if int(raw_lvl) >= 1:
                    enriched += count
            except (TypeError, ValueError):
                continue

    return web.json_response({
        "state": "idle",
        "total": total,
        "enriched": enriched,
        "pending": max(0, total - enriched),
        "by_enrichment_level": by_level,
    })


async def _tags_refine(request: web.Request) -> web.Response:
    """``GET /api/v2/assets/tags/refine`` — tag histogram for filtered subset.

    Accepts the same filters as ``GET /api/v2/assets`` (``name_contains``,
    ``include_tags``, ``exclude_tags``) and returns the most-frequent tags
    among matching assets. Results are read from the normalized
    ``asset_tags`` + ``tags`` tables.
    """
    services, err = await _require_services()
    if err is not None:
        return _api_error_response(err)
    if not isinstance(services, dict) or "db" not in services:
        return _api_error_response(Result.Err("SERVICE_UNAVAILABLE", "Database unavailable"))
    db = services["db"]

    q = request.rel_url.query
    name_contains = (q.get("name_contains") or "").strip() or None
    multi = {k: q.getall(k, []) for k in ("include_tags", "exclude_tags")}
    include_tags = _parse_multi(multi, "include_tags")
    exclude_tags = _parse_multi(multi, "exclude_tags")
    limit = _parse_int(q.get("limit"), 100, lo=1, hi=1000)

    clauses: list[str] = []
    params: list[Any] = []
    if name_contains:
        clauses.append("LOWER(a.filename) LIKE ?")
        params.append(f"%{name_contains.lower()}%")
    for tag in include_tags:
        clauses.append(
            "EXISTS (SELECT 1 FROM asset_tags at2 "
            "JOIN tags t2 ON t2.id = at2.tag_id "
            "WHERE at2.asset_id = a.id AND t2.name = ?)"
        )
        params.append(tag)
    for tag in exclude_tags:
        clauses.append(
            "NOT EXISTS (SELECT 1 FROM asset_tags at2 "
            "JOIN tags t2 ON t2.id = at2.tag_id "
            "WHERE at2.asset_id = a.id AND t2.name = ?)"
        )
        params.append(tag)
    where_sql = f"WHERE {' AND '.join(clauses)}" if clauses else ""

    sql = (
        "SELECT t.name AS name, COUNT(*) AS count "
        "FROM assets a "
        "JOIN asset_tags at ON at.asset_id = a.id "
        "JOIN tags t ON t.id = at.tag_id "
        f"{where_sql} "
        "GROUP BY t.name ORDER BY count DESC, t.name ASC LIMIT ?"
    )
    try:
        res = await db.aquery(sql, tuple([*params, limit]))
    except Exception as exc:
        logger.warning("api/v2/assets tags/refine failed: %s", exc, exc_info=True)
        return _api_error_response(Result.Err("DB_ERROR", "Tag refine failed"))

    tags: list[dict[str, Any]] = []
    if res.ok and isinstance(res.data, list):
        for row in res.data:
            name = str(row.get("name") or "").strip()
            if not name:
                continue
            tags.append({"name": name, "count": int(row.get("count") or 0)})

    return web.json_response({"tags": tags, "total": len(tags)})


# --------------------------------------------------------------------------- #
# Registration
# --------------------------------------------------------------------------- #


def register_api_v2_asset_routes(routes: web.RouteTableDef) -> None:
    """Register the ``/api/v2/assets/*`` compat surface."""
    routes.head("/api/v2/assets/hash/{hash}")(_check_asset_by_hash)
    # Static-path routes MUST be declared before the catch-all ``/{id}``
    # variants so aiohttp doesn't route ``seed`` / ``tags`` to ``_get_asset``.
    routes.get("/api/v2/assets/seed/status")(_seed_status)
    routes.get("/api/v2/assets/tags/refine")(_tags_refine)
    routes.get("/api/v2/assets")(_list_assets)
    routes.get("/api/v2/assets/{id}")(_get_asset)
    routes.get("/api/v2/assets/{id}/content")(_get_asset_content)
    routes.get("/api/v2/assets/{id}/tags")(_get_asset_tags)
