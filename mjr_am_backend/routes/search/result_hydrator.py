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
        try:
            db_total = int(data.get("total") or 0)
            deduped_count = len(deduped)
            data["total"] = min(db_total, deduped_count) if deduped_count < db_total else db_total
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
            SELECT a.id, a.filepath, COALESCE(m.rating, 0) AS rating, COALESCE(m.tags, '[]') AS tags
            FROM assets a
            LEFT JOIN asset_metadata m ON m.asset_id = a.id
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
