"""
Search result hydration helpers.
"""

from __future__ import annotations

import json
from typing import Any


def _json_list_field(value: Any) -> list[Any]:
    if not value:
        return []
    try:
        parsed = json.loads(value) if isinstance(value, str) else value
        return parsed if isinstance(parsed, list) else []
    except (ValueError, json.JSONDecodeError, TypeError):
        return []


def _json_object_field(value: Any) -> dict[str, Any]:
    if not value:
        return {}
    try:
        parsed = json.loads(value) if isinstance(value, str) else value
        return parsed if isinstance(parsed, dict) else {}
    except (ValueError, json.JSONDecodeError, TypeError):
        return {}


def hydrate_lookup_row(row: dict[str, Any]) -> tuple[str, dict[str, Any]] | None:
    fp = row.get("filepath")
    if not fp:
        return None
    item = dict(row)
    item["tags"] = _json_list_field(item.get("tags"))
    item["auto_tags"] = _json_list_field(item.get("auto_tags"))
    return str(fp), item


def hydrate_search_row(row: dict[str, Any], *, include_highlight: bool) -> dict[str, Any]:
    asset = dict(row)
    asset["tags"] = _json_list_field(asset.get("tags"))
    asset["auto_tags"] = _json_list_field(asset.get("auto_tags"))
    asset.setdefault("tags_text", "")
    if include_highlight:
        asset["highlight"] = asset.get("highlight") or None
    return asset


def hydrate_search_rows(rows: list[dict[str, Any]], *, include_highlight: bool) -> list[dict[str, Any]]:
    return [hydrate_search_row(row, include_highlight=include_highlight) for row in rows]


def hydrate_asset_payload(asset: dict[str, Any]) -> dict[str, Any]:
    asset["tags"] = _json_list_field(asset.get("tags") or "")
    asset["auto_tags"] = _json_list_field(asset.get("auto_tags") or "")

    metadata_obj = _json_object_field(asset.get("metadata_raw") or "{}")
    asset["metadata_raw"] = metadata_obj
    if isinstance(metadata_obj, dict):
        asset.setdefault("prompt", metadata_obj.get("prompt"))
        asset.setdefault("workflow", metadata_obj.get("workflow"))
        asset.setdefault("exif", metadata_obj.get("exif") or metadata_obj.get("raw"))
        asset.setdefault("geninfo", metadata_obj.get("geninfo"))
    return asset
