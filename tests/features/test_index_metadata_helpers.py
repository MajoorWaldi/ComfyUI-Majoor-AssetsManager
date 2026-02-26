import asyncio
import json
from types import SimpleNamespace

import pytest

from mjr_am_backend.features.index import metadata_helpers as mh
from mjr_am_backend.shared import Result


class _DummyLock:
    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False


class _DB:
    def __init__(self):
        self.exec_calls = []
        self.query_calls = []
        self.query_result = Result.Ok([])

    async def aexecute(self, sql, params=()):
        self.exec_calls.append((sql, params))
        return Result.Ok({"ok": True})

    async def aquery(self, sql, params=()):
        self.query_calls.append((sql, params))
        return self.query_result

    def lock_for_asset(self, _asset_id):
        return _DummyLock()


def test_json_guard_and_tag_helpers(monkeypatch):
    monkeypatch.setattr(mh, "MAX_METADATA_JSON_BYTES", 20)
    raw = json.dumps({"x": "y" * 100})
    truncated = mh._apply_metadata_json_size_guard(1, Result.Ok({"a": 1}), raw, filepath="x.png")
    assert '"_truncated"' in truncated

    assert mh._sanitize_metadata_tags(["a", "a", " ", "b"]) == ["a", "b"]
    r, tags_json, tags_txt = mh._extract_rating_and_tags(Result.Ok({"rating": 9, "tags": ["x", "y"]}))
    assert r == 5 and tags_json == '["x", "y"]' and tags_txt == "x y"


def test_geninfo_extras_and_presence_flags():
    meta = {
        "parameters": "x",
        "geninfo": {
            "models": {"a": {"name": "m1"}},
            "loras": [{"name": "l1"}],
            "positive": {"value": "prompt"},
            "engine": {"type": "tts"},
            "inputs": [{"filename": "i.wav"}],
        },
    }
    extras = mh._collect_geninfo_extras(meta)
    assert "m1" in extras and "l1" in extras and "i.wav" in extras
    enriched = mh._enrich_tags_text_with_metadata(Result.Ok(meta), "tag1")
    assert "tag1" in enriched and "prompt" in enriched

    has_wf, has_gen = mh._metadata_presence_flags({"parameters": "Steps:20"})
    assert has_wf is True and has_gen is True
    assert mh._graph_has_sampler({"1": {"class_type": "KSampler", "inputs": {"steps": 20}}}) is True


def test_prepare_and_error_payload_helpers():
    has_wf, has_gen, quality, raw = mh.MetadataHelpers.prepare_metadata_fields(Result.Ok({"quality": "partial", "parameters": "x"}))
    assert has_wf is True and has_gen is True and quality == "partial" and raw
    assert mh.MetadataHelpers._bool_to_db(True) == 1
    assert mh.MetadataHelpers._bool_to_db(False) == 0
    assert mh.MetadataHelpers._bool_to_db(None) is None

    err = Result.Err("E", "bad", quality="degraded", foo="x")
    payload = mh.MetadataHelpers.metadata_error_payload(err, "a.png")
    assert payload.ok and payload.data["quality"] == "degraded" and payload.data["foo"] == "x"


@pytest.mark.asyncio
async def test_write_row_retrieve_cache_and_store(monkeypatch):
    db = _DB()
    monkeypatch.setattr(mh, "MAX_METADATA_JSON_BYTES", 0)
    meta = Result.Ok({"quality": "full", "rating": 4, "tags": ["a"], "parameters": "x"})
    out = await mh.MetadataHelpers.write_asset_metadata_row(db, 10, meta, filepath="a.png")
    assert out.ok and db.exec_calls

    db.query_result = Result.Ok([{"metadata_raw": json.dumps({"x": 1})}])
    cached = await mh.MetadataHelpers.retrieve_cached_metadata(db, "a.png", "h")
    assert cached and cached.ok and cached.data["x"] == 1

    store = await mh.MetadataHelpers.store_metadata_cache(db, "a.png", "h", Result.Ok({"x": 1}))
    assert store.ok

    monkeypatch.setattr(mh, "MAX_METADATA_JSON_BYTES", 1)
    too_large = await mh.MetadataHelpers.store_metadata_cache(db, "a.png", "h", Result.Ok({"x": "long"}))
    assert too_large.code == "CACHE_SKIPPED"


@pytest.mark.asyncio
async def test_refresh_if_needed_and_cleanup_paths(monkeypatch):
    db = _DB()
    db.query_result = Result.Ok([{"has_workflow": 0, "has_generation_data": 0, "metadata_raw": "{}"}])
    called = {"journal": 0}

    async def _journal(*args, **kwargs):
        called["journal"] += 1

    res = await mh.MetadataHelpers.refresh_metadata_if_needed(
        db,
        asset_id=1,
        metadata_result=Result.Ok({"parameters": "x"}),
        filepath="a.png",
        base_dir=".",
        state_hash="h",
        mtime=1,
        size=2,
        write_journal_fn=_journal,
    )
    assert res is True and called["journal"] == 1

    monkeypatch.setattr(mh, "METADATA_CACHE_MAX", 10)
    monkeypatch.setattr(mh, "METADATA_CACHE_TTL_SECONDS", 10)
    monkeypatch.setattr(mh, "METADATA_CACHE_CLEANUP_INTERVAL_SECONDS", 0)
    db.query_result = Result.Ok([{"count": 20}])
    await mh.MetadataHelpers._maybe_cleanup_metadata_cache(db)
    assert db.query_calls and db.exec_calls

    assert mh._cache_cleanup_config()[0] >= 0
    await mh._cleanup_cache_by_ttl(db, 5)
    await mh._cleanup_cache_by_max_entries(db, 10)


def test_metadata_payload_size_helpers(monkeypatch):
    monkeypatch.setattr(mh, "MAX_METADATA_JSON_BYTES", 10)
    raw = mh.MetadataHelpers._metadata_json_payload({"b": 1, "a": 2})
    assert '"a":2' in raw and '"b":1' in raw
    assert mh.MetadataHelpers._metadata_payload_size_bytes(raw) > 0
    assert mh.MetadataHelpers.compute_metadata_hash(raw)

    guard = mh.MetadataHelpers._metadata_payload_size_guard("x" * 100, "a.png")
    assert guard and guard.code == "CACHE_SKIPPED"
