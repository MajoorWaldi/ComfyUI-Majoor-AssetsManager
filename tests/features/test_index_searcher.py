import json
from types import SimpleNamespace

import pytest

from mjr_am_backend.features.index import searcher as m
from mjr_am_backend.shared import Result


class _DB:
    def __init__(self, q=None, qi=None, ex=None):
        self.q = list(q or [])
        self.qi = list(qi or [])
        self.ex = list(ex or [])

    async def aquery(self, _sql, _params=()):
        if self.q:
            return self.q.pop(0)
        return Result.Ok([])

    async def aquery_in(self, _sql, _col, _values):
        if self.qi:
            return self.qi.pop(0)
        return Result.Ok([])

    async def aexecute(self, _sql):
        if self.ex:
            r = self.ex.pop(0)
            if isinstance(r, Exception):
                raise r
            return r
        return Result.Ok({})


def _mk(db=None, has_tags=True):
    return m.IndexSearcher(db or _DB(), has_tags)


def test_helper_functions_cover_smoke():
    assert m._normalize_extension(".PNG") == "png"
    assert m._normalize_sort_key("name_desc") == "name_desc"
    assert "ORDER BY" in m._build_sort_sql("mtime_desc")
    c, p = m._build_filter_clauses({"kind": "image", "source": "OUTPUT", "extensions": ["png"]})
    assert c and p
    assert m._workflow_type_variants("TTS")
    assert m._normalize_pagination(999999, 99999999)[0] == m.SEARCH_MAX_LIMIT
    assert m._escape_like_pattern("a%_\\")
    assert m._resolve_search_roots(["."])
    where, params = m._build_roots_where_clause(["C:/tmp"])
    assert "LIKE" in where and params
    assert m._normalize_month_range("1", "2") == (1, 2)
    assert m._sanitize_histogram_filters({"mtime_start": 1, "x": 2}) == {"x": 2}
    sql, pr = m._build_histogram_query("1=1", [], 1, 2, {"kind": "image"})
    assert "SELECT" in sql and pr
    assert m._coerce_histogram_days([{"day": "2026-01-01", "count": 2}])["2026-01-01"] == 2
    assert m._normalize_asset_ids([1, "2", -1, 1]) == [1, 2]


@pytest.mark.asyncio
async def test_ensure_vocab_and_autocomplete_paths():
    s1 = _mk(_DB(ex=[Result.Ok({})]))
    await s1.ensure_vocab()
    assert s1.fts_vocab_ready is True

    s2 = _mk(_DB(ex=[RuntimeError("x")]))
    await s2.ensure_vocab()
    assert s2.fts_vocab_ready is False

    s3 = _mk(_DB(ex=[Result.Ok({})], q=[Result.Ok([{"term": "cat"}])]))
    out = await s3.autocomplete("ca", 5)
    assert out.ok and out.data == ["cat"]

    out2 = await s3.autocomplete("c", 5)
    assert out2.ok and out2.data == []


def test_validate_paths_and_sanitize():
    s = _mk()
    assert s._validate_search_query("   ").code == "EMPTY_QUERY"
    assert s._sanitize_fts_query("AND OR") == ""
    assert s._is_malformed_match_error("fts5: syntax error") is True
    assert s._build_tags_text_clause()
    s2 = _mk(has_tags=False)
    assert s2._build_tags_text_clause() == ""


@pytest.mark.asyncio
async def test_run_search_query_rows_error_mapping():
    s = _mk(_DB(q=[Result.Err("X", "malformed match expression")]))
    out = await s._run_search_query_rows("x", [], failure_message="f")
    assert out.code == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_search_global_browse_rows_and_search_browse():
    db = _DB(
        q=[
            Result.Ok([{"id": 1, "tags": "[]"}]),
            Result.Ok([{"total": 3}]),
            Result.Ok([{"id": 2, "tags": "[]"}]),
            Result.Ok([{"total": 1}]),
        ]
    )
    s = _mk(db)
    out = await s._search_global_browse_rows(limit=10, offset=0, filters={"kind": "image"}, include_total=True, metadata_tags_text_clause="")
    assert out.ok

    out2 = await s.search("*", 10, 0, {"kind": "image"}, include_total=True)
    assert out2.ok and isinstance(out2.data.get("assets"), list)


@pytest.mark.asyncio
async def test_search_global_fts_rows_and_search_fts():
    db = _DB(
        q=[
            Result.Ok([{"id": 1, "tags": "[]", "_total": 7, "rank": 1.0}]),
            Result.Ok([{"id": 2, "tags": "[]", "rank": 2.0}]),
            Result.Ok([{"total": 2}]),
        ]
    )
    s = _mk(db)
    out = await s._search_global_fts_rows(fts_query="cat*", limit=10, offset=0, filters=None, include_total=True, metadata_tags_text_clause="")
    assert out.ok

    out2 = await s.search("cat", 10, 0, None, include_total=True)
    assert out2.ok


@pytest.mark.asyncio
async def test_search_scoped_paths():
    db = _DB(
        q=[
            Result.Ok([{"id": 1, "tags": "[]"}]),
            Result.Ok([{"total": 1}]),
            Result.Ok([{"id": 2, "tags": "[]", "rank": 1.0}]),
            Result.Ok([{"total": 1}]),
        ]
    )
    s = _mk(db)

    out = await s.search_scoped("*", roots=["."], include_total=True)
    assert out.ok

    out2 = await s.search_scoped("cat", roots=["."], include_total=True, sort="name_asc")
    assert out2.ok

    out3 = await s.search_scoped("cat", roots=[])
    assert out3.code == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_has_assets_under_root_and_histogram():
    s = _mk(_DB(q=[Result.Ok([{"x": 1}])]))
    out = await s.has_assets_under_root(".")
    assert out.ok and out.data is True

    s2 = _mk(_DB(q=[Result.Err("DB", "x")]))
    out2 = await s2.has_assets_under_root(".")
    assert out2.code == "DB_ERROR"

    s3 = _mk(_DB(q=[Result.Ok([{"day": "2026-01-01", "count": 3}])]))
    out3 = await s3.date_histogram_scoped(["."], 1, 2, {"kind": "image"})
    assert out3.ok and out3.data["2026-01-01"] == 3

    out4 = await s3.date_histogram_scoped([], 1, 2)
    assert out4.code == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_get_asset_get_assets_lookup_and_hydrate():
    db = _DB(
        q=[
            Result.Err("DB", "x"),
            Result.Ok([]),
            Result.Ok([{"id": 1, "tags": '["a"]', "metadata_raw": '{"workflow": {"n":1}}'}]),
        ],
        qi=[
            Result.Ok([{"id": 2, "tags": "[]", "metadata_raw": "{}"}]),
            Result.Ok([{"filepath": "C:/a.png", "id": 2, "tags": '["x"]', "rating": 5}]),
        ],
    )
    s = _mk(db)

    e1 = await s.get_asset(1)
    assert e1.code == "QUERY_FAILED"

    e2 = await s.get_asset(1)
    assert e2.ok and e2.data is None

    e3 = await s.get_asset(1)
    assert e3.ok and e3.data["tags"] == ["a"]

    e4 = await s.get_assets([2, 2, -1])
    assert e4.ok and len(e4.data) == 1

    e5 = await s.lookup_assets_by_filepaths(["C:/a.png", "", "C:/a.png"])
    assert e5.ok and "C:/a.png" in e5.data


def test_misc_helpers_mapping():
    by = m._map_assets_by_id([{"id": 1, "tags": "[]", "metadata_raw": "{}"}], lambda r: r)
    assert by[1]["id"] == 1
    assert len(m._assets_in_requested_order([1, 2], by)) == 1
    assert m._normalize_lookup_filepaths(["C:/a.png", "", "C:/a.png"]) == ["C:/a.png", "C:/a.png"]
    h = m._hydrate_lookup_row({"filepath": "C:/x.png", "tags": '["a"]', "rating": 1})
    assert h and h[0] == "C:/x.png"
    mapped = m._map_lookup_rows([{"filepath": "C:/x.png", "tags": "[]", "rating": 0}])
    assert "C:/x.png" in mapped
    hyd = m._hydrate_search_rows([{"tags": "[]"}], include_highlight=True)
    assert hyd[0]["tags"] == []
