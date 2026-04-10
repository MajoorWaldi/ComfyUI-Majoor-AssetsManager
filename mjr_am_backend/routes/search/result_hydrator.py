"""DB hydration helpers extracted from handlers/search.py."""
import json
import os
from typing import Any


def dedupe_key(asset: dict) -> str:
    fp = str((asset or {}).get("filepath") or "").strip()
    if not fp:
        return ""
    if os.name == "nt":
        try:
            return os.path.normcase(os.path.normpath(fp))
        except Exception:
            return fp.lower()
    return fp


def dedupe_by_filepath(assets: list[dict]) -> list[dict]:
    out: list[dict] = []
    seen: set[str] = set()
    for asset in assets or []:
        if not isinstance(asset, dict):
            continue
        key = dedupe_key(asset)
        if key:
            if key in seen:
                continue
            seen.add(key)
        out.append(asset)
    return out


def dedupe_result_payload(payload: dict | None) -> dict:
    data = dict(payload or {})
    assets = data.get("assets")
    if isinstance(assets, list):
        deduped = dedupe_by_filepath(assets)
        data["assets"] = deduped
        if "total" not in data or data.get("total") is None:
            return data
        try:
            db_total = int(data.get("total") or 0)
            deduped_count = len(deduped)
            # Keep total aligned with DB pagination semantics:
            # - never under-report below returned page size after dedupe
            # - do not clamp a valid DB total down to current page length
            data["total"] = deduped_count if db_total < deduped_count else db_total
        except Exception:
            data["total"] = len(deduped)
    return data


def norm_filepath(fp: str) -> str:
    try:
        if os.name == "nt":
            return os.path.normcase(os.path.normpath(str(fp or "")))
    except Exception:
        pass
    return str(fp or "")


def is_folder_asset(asset: dict) -> bool:
    return str((asset or {}).get("kind") or "").lower() == "folder"


def collect_hydration_paths(assets: list[dict]) -> list[str]:
    filepaths: list[str] = []
    for asset in assets:
        if not isinstance(asset, dict):
            continue
        if is_folder_asset(asset):
            continue
        fp = str(asset.get("filepath") or "").strip()
        if fp:
            filepaths.append(fp)
    return filepaths


async def query_browser_rows(db: Any, filepaths: list[str]) -> list[dict] | None:
    try:
        rows_res = await db.aquery_in(
            """
            SELECT
                a.id,
                a.filepath,
                COALESCE(m.rating, 0) AS rating,
                COALESCE(m.tags, '[]') AS tags,
                m.has_workflow AS has_workflow,
                m.has_generation_data AS has_generation_data,
                UPPER(COALESCE(
                    NULLIF(TRIM(COALESCE(m.workflow_type, '')), ''),
                    CASE WHEN json_valid(COALESCE(m.metadata_raw, '')) THEN json_extract(m.metadata_raw, '$.workflow_type') ELSE NULL END,
                    CASE WHEN json_valid(COALESCE(m.metadata_raw, '')) THEN json_extract(m.metadata_raw, '$.geninfo.engine.type') ELSE NULL END,
                    CASE WHEN json_valid(COALESCE(m.metadata_raw, '')) THEN json_extract(m.metadata_raw, '$.engine.type') ELSE NULL END,
                    ''
                )) AS workflow_type,
                COALESCE(
                    NULLIF(TRIM(COALESCE(m.positive_prompt, '')), ''),
                    CASE WHEN json_valid(COALESCE(m.metadata_raw, ''))
                        THEN SUBSTR(COALESCE(
                            NULLIF(TRIM(COALESCE(json_extract(m.metadata_raw, '$.positive_prompt'), '')), ''),
                            NULLIF(TRIM(COALESCE(json_extract(m.metadata_raw, '$.geninfo.positive.value'), '')), '')
                        ), 1, 250)
                        ELSE NULL
                    END
                ) AS positive_prompt,
                COALESCE(
                    m.generation_time_ms,
                    CASE WHEN json_valid(COALESCE(m.metadata_raw, ''))
                        THEN json_extract(m.metadata_raw, '$.generation_time_ms')
                        ELSE NULL
                    END
                ) AS generation_time_ms,
                CASE
                    WHEN LENGTH(TRIM(COALESCE(a.enhanced_caption, ''))) > 0 THEN 1
                    ELSE 0
                END AS has_ai_enhanced_caption,
                CASE
                    WHEN TRIM(COALESCE(e.auto_tags, '[]')) IN ('', '[]', '[ ]', 'null', 'NULL') THEN 0
                    ELSE 1
                END AS has_ai_auto_tags,
                CASE
                    WHEN e.vector IS NOT NULL AND LENGTH(e.vector) > 0 THEN 1
                    ELSE 0
                END AS has_ai_vector,
                CASE
                    WHEN LENGTH(TRIM(COALESCE(a.enhanced_caption, ''))) > 0
                         OR TRIM(COALESCE(e.auto_tags, '[]')) NOT IN ('', '[]', '[ ]', 'null', 'NULL')
                         OR (e.vector IS NOT NULL AND LENGTH(e.vector) > 0)
                    THEN 1
                    ELSE 0
                END AS has_ai_info
            FROM assets a
            LEFT JOIN asset_metadata m ON m.asset_id = a.id
            LEFT JOIN vec.asset_embeddings e ON e.asset_id = a.id
            WHERE {IN_CLAUSE}
            """,
            "a.filepath",
            filepaths,
        )
    except Exception:
        return None
    if not rows_res.ok:
        return None
    rows = rows_res.data or []
    return rows if isinstance(rows, list) else []


def index_rows_by_filepath(rows: list[dict]) -> dict[str, dict]:
    by_fp: dict[str, dict] = {}
    for row in rows:
        try:
            key = norm_filepath(str((row or {}).get("filepath") or ""))
            if not key:
                continue
            by_fp[key] = row or {}
        except Exception:
            continue
    return by_fp


def coerce_browser_tags(raw_tags: Any) -> list[str]:
    if isinstance(raw_tags, str):
        try:
            parsed = json.loads(raw_tags)
        except Exception:
            return []
        if isinstance(parsed, list):
            return [str(t) for t in parsed if isinstance(t, str)]
        return []
    if isinstance(raw_tags, list):
        return [str(t) for t in raw_tags if isinstance(t, str)]
    return []


def _coerce_browser_generation_time_ms(value: Any) -> int | None:
    if value in (None, "", 0):
        return None
    if isinstance(value, bool):
        return None
    try:
        parsed = int(float(value))
    except (TypeError, ValueError):
        return None
    return parsed if parsed > 0 else None


def hydrate_asset_from_row(asset: dict, by_fp: dict[str, dict]) -> None:
    if is_folder_asset(asset):
        return
    key = norm_filepath(str(asset.get("filepath") or ""))
    row = by_fp.get(key)
    if not row:
        return
    rid = row.get("id")
    if rid is not None:
        asset["id"] = int(rid)
    asset["rating"] = int(row.get("rating") or 0)
    asset["tags"] = coerce_browser_tags(row.get("tags"))
    asset["has_workflow"] = row.get("has_workflow")
    asset["has_generation_data"] = row.get("has_generation_data")
    asset["workflow_type"] = row.get("workflow_type")
    positive_prompt = str(row.get("positive_prompt") or "").strip()
    if positive_prompt:
        asset["positive_prompt"] = positive_prompt
    generation_time_ms = _coerce_browser_generation_time_ms(row.get("generation_time_ms"))
    if generation_time_ms is not None:
        asset["generation_time_ms"] = generation_time_ms
    asset["has_ai_info"] = row.get("has_ai_info")
    asset["has_ai_vector"] = row.get("has_ai_vector")
    asset["has_ai_auto_tags"] = row.get("has_ai_auto_tags")
    asset["has_ai_enhanced_caption"] = row.get("has_ai_enhanced_caption")


def apply_hydration_rows(assets: list[dict], rows: list[dict]) -> None:
    by_fp = index_rows_by_filepath(rows)
    for asset in assets:
        try:
            if isinstance(asset, dict):
                hydrate_asset_from_row(asset, by_fp)
        except Exception:
            continue


async def hydrate_assets(svc: dict | None, assets: list[dict], search_db_from_services) -> list[dict]:
    normalized_assets = assets if isinstance(assets, list) else []
    if not normalized_assets:
        return normalized_assets
    db = search_db_from_services(svc)
    if not db:
        return normalized_assets
    filepaths = collect_hydration_paths(normalized_assets)
    if not filepaths:
        return normalized_assets
    rows = await query_browser_rows(db, filepaths)
    if rows is None:
        return normalized_assets
    apply_hydration_rows(normalized_assets, rows)
    return normalized_assets
