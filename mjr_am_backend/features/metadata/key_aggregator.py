"""Aggregate metadata keys from indexed metadata JSON."""

from __future__ import annotations

import json
from collections import defaultdict
from typing import Any

from .section_catalog import get_metadata_section_catalog

MAX_ROWS = 5000
MAX_KEYS = 1200
MAX_NODE_TYPES = 300


def _walk_keys(value: Any, prefix: str = "", out: set[str] | None = None) -> set[str]:
    keys = out if out is not None else set()
    if len(keys) >= MAX_KEYS:
        return keys
    if isinstance(value, dict):
        for key, child in value.items():
            safe = str(key or "").strip()
            if not safe:
                continue
            path = f"{prefix}.{safe}" if prefix else safe
            keys.add(path)
            if len(keys) >= MAX_KEYS:
                break
            _walk_keys(child, path, keys)
    elif isinstance(value, list):
        for item in value[:25]:
            _walk_keys(item, prefix, keys)
            if len(keys) >= MAX_KEYS:
                break
    return keys


def _collect_workflow_nodes(meta: dict[str, Any], bucket: dict[str, set[str]]) -> None:
    candidates: list[Any] = []
    workflow = meta.get("workflow")
    if isinstance(workflow, dict):
        candidates.extend(workflow.get("nodes") or [])
    prompt = meta.get("prompt")
    if isinstance(prompt, dict):
        candidates.extend(prompt.values())
    gen_nodes = ((meta.get("geninfo") or {}).get("workflow_nodes") if isinstance(meta.get("geninfo"), dict) else None)
    if isinstance(gen_nodes, list):
        candidates.extend(gen_nodes)

    for node in candidates:
        if not isinstance(node, dict) or len(bucket) >= MAX_NODE_TYPES:
            continue
        node_type = str(node.get("type") or node.get("class_type") or node.get("title") or "Unknown").strip()
        if not node_type:
            continue
        params = bucket[node_type[:160]]
        inputs = node.get("inputs")
        if isinstance(inputs, dict):
            params.update(str(k) for k in inputs.keys())
        node_params = node.get("params")
        if isinstance(node_params, dict):
            params.update(str(k) for k in node_params.keys())
        widgets = node.get("widgets_values")
        if isinstance(widgets, list):
            params.add("widgets_values")


async def aggregate_metadata_keys(db: Any, *, limit: int = MAX_ROWS) -> dict[str, Any]:
    row_limit = max(1, min(MAX_ROWS, int(limit or MAX_ROWS)))
    result = await db.aquery(
        """
        SELECT metadata_raw
        FROM asset_metadata
        WHERE metadata_raw IS NOT NULL
          AND TRIM(metadata_raw) NOT IN ('', '{}', 'null', 'NULL')
        ORDER BY asset_id DESC
        LIMIT ?
        """,
        (row_limit,),
    )
    rows = result.data if result.ok and isinstance(result.data, list) else []
    keys: set[str] = set()
    node_params: dict[str, set[str]] = defaultdict(set)
    scanned = 0
    for row in rows:
        raw = row.get("metadata_raw") if isinstance(row, dict) else None
        try:
            meta = json.loads(raw) if isinstance(raw, str) else raw
        except Exception:
            continue
        if not isinstance(meta, dict):
            continue
        scanned += 1
        _walk_keys(meta, out=keys)
        _collect_workflow_nodes(meta, node_params)

    return {
        "catalog": get_metadata_section_catalog(),
        "scanned": scanned,
        "keys": sorted(keys),
        "workflow_nodes": {key: sorted(values) for key, values in sorted(node_params.items())},
    }
