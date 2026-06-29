from __future__ import annotations

import json
import sqlite3

from mjr_am_backend.features.index.searcher import _build_filter_clauses
from mjr_am_backend.features.metadata.key_aggregator import aggregate_metadata_keys
from mjr_am_backend.features.metadata.section_catalog import (
    get_metadata_section_catalog,
    paths_for_search_field,
)
from mjr_am_backend.features.search.prefix_query import parse_prefixed_query


def test_metadata_section_catalog_exposes_search_aliases() -> None:
    catalog = get_metadata_section_catalog()
    keys = {section["key"] for section in catalog["sections"]}
    assert {"prompt", "model", "sampler", "lora", "workflow_nodes"}.issubset(keys)
    assert "$.geninfo.checkpoint.name" in paths_for_search_field("checkpoint")
    assert "$.geninfo.positive.value" in paths_for_search_field("prompt")


def test_parse_prefixed_query_extracts_terms_and_keeps_plain_text() -> None:
    query, filters = parse_prefixed_query("cat model:flux -lora:bad OR sampler:euler")
    assert query == "cat"
    assert filters["metadata_terms_mode"] == "OR"
    assert filters["metadata_terms"] == [
        {"field": "model", "value": "flux", "exclude": False},
        {"field": "lora", "value": "bad", "exclude": True},
        {"field": "sampler", "value": "euler", "exclude": False},
    ]


class _FakeDb:
    async def aquery(self, _sql, _params):
        from mjr_am_backend.shared import Result

        return Result.Ok(
            [
                {
                    "metadata_raw": """
                    {
                      "geninfo": {
                        "positive": {"value": "a cat"},
                        "workflow_nodes": [{"class_type": "KSampler", "params": {"seed": 1}}]
                      },
                      "workflow": {"nodes": [{"type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "x"}}]}
                    }
                    """
                }
            ]
        )


def test_aggregate_metadata_keys_collects_paths_and_workflow_nodes() -> None:
    import asyncio

    data = asyncio.run(aggregate_metadata_keys(_FakeDb()))
    assert "geninfo.positive.value" in data["keys"]
    assert data["workflow_nodes"]["KSampler"] == ["seed"]
    assert data["workflow_nodes"]["CheckpointLoaderSimple"] == ["ckpt_name"]


def _metadata_search_rows(query: str) -> list[str]:
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    conn.executescript(
        """
        CREATE TABLE assets (
            id INTEGER PRIMARY KEY,
            filename TEXT,
            kind TEXT,
            source TEXT,
            ext TEXT,
            subfolder TEXT,
            size INTEGER,
            width INTEGER,
            height INTEGER,
            mtime INTEGER
        );
        CREATE TABLE asset_metadata (
            asset_id INTEGER PRIMARY KEY,
            metadata_text TEXT,
            metadata_raw TEXT,
            rating INTEGER
        );
        """
    )
    rows = [
        (
            1,
            "flux.png",
            "flux schnell detail",
            {"geninfo": {"checkpoint": {"name": "flux-schnell"}, "loras": [{"name": "detail"}]}},
        ),
        (
            2,
            "sdxl.png",
            "sdxl portrait badhands",
            {"geninfo": {"checkpoint": {"name": "sdxl-base"}, "loras": [{"name": "badhands"}]}},
        ),
        (
            3,
            "euler.png",
            "euler sampler",
            {"geninfo": {"sampler": "euler", "checkpoint": {"name": "other"}}},
        ),
    ]
    for asset_id, filename, text, raw in rows:
        conn.execute(
            "INSERT INTO assets (id, filename, kind, source, ext, subfolder, size, width, height, mtime) VALUES (?, ?, 'image', 'output', 'png', '', 1, 1, 1, 1)",
            (asset_id, filename),
        )
        conn.execute(
            "INSERT INTO asset_metadata (asset_id, metadata_text, metadata_raw, rating) VALUES (?, ?, ?, 0)",
            (asset_id, text, json.dumps(raw)),
        )
    plain_query, filters = parse_prefixed_query(query)
    assert plain_query == ""
    clauses, params = _build_filter_clauses(filters)
    sql = "SELECT a.filename FROM assets a JOIN asset_metadata m ON m.asset_id = a.id WHERE 1=1 " + " ".join(clauses)
    return [str(row["filename"]) for row in conn.execute(sql, params).fetchall()]


def test_metadata_prefix_sql_filters_model_lora_exclusion_and_or() -> None:
    assert _metadata_search_rows("model:flux") == ["flux.png"]
    assert _metadata_search_rows("lora:detail -lora:badhands") == ["flux.png"]
    assert _metadata_search_rows("model:flux OR sampler:euler") == ["flux.png", "euler.png"]
