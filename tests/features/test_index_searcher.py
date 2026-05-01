import sqlite3

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
    where, params = m._build_roots_where_clause(["/tmp"])
    assert "LIKE" in where and params
    assert m._normalize_month_range("1", "2") == (1, 2)
    assert m._sanitize_histogram_filters({"mtime_start": 1, "x": 2}) == {"x": 2}
    sql, pr = m._build_histogram_query("1=1", [], 1, 2, {"kind": "image"})
    assert "SELECT" in sql and pr
    assert "localtime" not in sql
    assert m._coerce_histogram_days([{"day": "2026-01-01", "count": 2}])["2026-01-01"] == 2
    assert m._normalize_asset_ids([1, "2", -1, 1]) == [1, 2]


def test_cursor_helpers_build_keyset_clauses():
    cursor = m._encode_page_cursor({"id": 42, "mtime": 123, "filename": "B.png"}, "mtime_desc")
    clause, params = m._build_cursor_where_clause(cursor, "mtime_desc")
    assert "a.mtime < ?" in clause
    assert params == [123, 123, 42]

    name_cursor = m._encode_page_cursor({"id": 7, "filename": "Bee.png"}, "name_asc")
    clause, params = m._build_cursor_where_clause(name_cursor, "name_asc")
    assert "LOWER(a.filename) > ?" in clause
    assert params == ["bee.png", "bee.png", 7]

    stale_clause, stale_params = m._build_cursor_where_clause(name_cursor, "mtime_desc")
    assert stale_clause == ""
    assert stale_params == []


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
            Result.Ok([{"id": 1, "tags": "[]", "rank": 1.0}]),
            Result.Ok([{"total": 7}]),
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


def test_workflow_filters_use_json_valid_guards():
    clauses, params = m._build_filter_clauses({"has_workflow": True, "workflow_type": "t2i"})
    sql = " ".join(clauses)

    assert "json_valid" in sql
    assert "CASE WHEN json_valid" in sql
    assert "m.workflow_type" in sql
    assert "$.workflow_type" in sql
    assert "$.workflow" in sql
    assert params == ["T2I"]


def test_workflow_filters_tolerate_malformed_metadata_json():
    conn = sqlite3.connect(":memory:")
    conn.execute("CREATE TABLE assets (id INTEGER PRIMARY KEY, source TEXT, mtime INTEGER)")
    conn.execute(
        "CREATE TABLE asset_metadata (asset_id INTEGER, has_workflow INTEGER, workflow_type TEXT, metadata_raw TEXT)"
    )
    conn.execute("INSERT INTO assets(id, source, mtime) VALUES (1, 'output', 1)")
    conn.execute("INSERT INTO assets(id, source, mtime) VALUES (2, 'output', 2)")
    conn.execute(
        "INSERT INTO asset_metadata(asset_id, has_workflow, workflow_type, metadata_raw) VALUES (1, 0, NULL, '{bad')"
    )
    conn.execute(
        "INSERT INTO asset_metadata(asset_id, has_workflow, workflow_type, metadata_raw) VALUES (2, 1, NULL, '{\"workflow_type\":\"T2I\"}')"
    )

    clauses, params = m._build_filter_clauses({"has_workflow": True, "workflow_type": "T2I"})
    sql = (
        "SELECT a.id "
        "FROM assets a "
        "LEFT JOIN asset_metadata m ON a.id = m.asset_id "
        "WHERE 1=1 "
        f"{' '.join(clauses)} "
        "ORDER BY a.id"
    )

    rows = conn.execute(sql, tuple(params)).fetchall()
    conn.close()

    assert rows == [(2,)]


def test_workflow_type_filter_prefers_denormalized_column_when_metadata_is_minimal():
    conn = sqlite3.connect(":memory:")
    conn.execute("CREATE TABLE assets (id INTEGER PRIMARY KEY, source TEXT, mtime INTEGER)")
    conn.execute(
        "CREATE TABLE asset_metadata (asset_id INTEGER, workflow_type TEXT, metadata_raw TEXT)"
    )
    conn.execute("INSERT INTO assets(id, source, mtime) VALUES (1, 'output', 1)")
    conn.execute("INSERT INTO assets(id, source, mtime) VALUES (2, 'output', 2)")
    conn.execute(
        "INSERT INTO asset_metadata(asset_id, workflow_type, metadata_raw) VALUES (1, 'I2I', '{bad')"
    )
    conn.execute(
        "INSERT INTO asset_metadata(asset_id, workflow_type, metadata_raw) VALUES (2, NULL, '{\"workflow_type\":\"T2I\"}')"
    )

    clauses, params = m._build_filter_clauses({"workflow_type": "I2I"})
    sql = (
        "SELECT a.id "
        "FROM assets a "
        "LEFT JOIN asset_metadata m ON a.id = m.asset_id "
        "WHERE 1=1 "
        f"{' '.join(clauses)} "
        "ORDER BY a.id"
    )

    rows = conn.execute(sql, tuple(params)).fetchall()
    conn.close()

    assert rows == [(1,)]


@pytest.mark.asyncio
async def test_paginate_grouped_assets_prefers_video_over_image_in_same_stack():
    """Video should be preferred over image as stack cover (video can show movement)."""
    async def _fetch_rows(_limit, _offset):
        return Result.Ok(
            {
                "rows": [
                    {
                        "id": 43,
                        "filename": "animatediff_00001.png",
                        "kind": "image",
                        "stack_id": 1,
                        "job_id": "job-1",
                        "size": 185981,
                        "mtime": 199,
                        "has_generation_data": 1,
                        "tags": "[]",
                    },
                    {
                        "id": 42,
                        "filename": "AnimateDiff_00001.mp4",
                        "kind": "video",
                        "stack_id": 1,
                        "job_id": "job-1",
                        "size": 20574,
                        "mtime": 200,
                        "has_generation_data": 1,
                        "tags": "[]",
                    },
                ]
            }
        )

    result = await m._paginate_grouped_assets(
        _fetch_rows,
        lambda rows: m._hydrate_search_rows(rows, include_highlight=True),
        limit=10,
        offset=0,
        include_total=True,
    )

    assert result.ok
    assets = result.data["assets"]
    assert len(assets) == 1
    assert assets[0]["filename"] == "AnimateDiff_00001.mp4"
    assert assets[0]["kind"] == "video"
    assert assets[0]["stack_asset_count"] == 2


@pytest.mark.asyncio
async def test_paginate_grouped_assets_prefers_video_with_audio_over_video_without():
    """Video with audio (detected by -audio suffix) should be preferred as stack cover."""
    async def _fetch_rows(_limit, _offset):
        return Result.Ok(
            {
                "rows": [
                    {
                        "id": 42,
                        "filename": "ltx-23_00001.mp4",
                        "kind": "video",
                        "stack_id": 1,
                        "job_id": "job-1",
                        "size": 20574,
                        "mtime": 200,
                        "has_generation_data": 1,
                        "tags": "[]",
                    },
                    {
                        "id": 43,
                        "filename": "ltx-23_00001.png",
                        "kind": "image",
                        "stack_id": 1,
                        "job_id": "job-1",
                        "size": 185981,
                        "mtime": 199,
                        "has_generation_data": 1,
                        "tags": "[]",
                    },
                    {
                        "id": 44,
                        "filename": "LTX-23_00001-audio.mp4",
                        "kind": "video",
                        "stack_id": 1,
                        "job_id": "job-1",
                        "size": 30000,
                        "mtime": 198,
                        "has_generation_data": 1,
                        "tags": "[]",
                    },
                ]
            }
        )

    result = await m._paginate_grouped_assets(
        _fetch_rows,
        lambda rows: m._hydrate_search_rows(rows, include_highlight=True),
        limit=10,
        offset=0,
        include_total=True,
    )

    assert result.ok
    assets = result.data["assets"]
    assert len(assets) == 1
    # Video with -audio suffix should be selected as representative
    assert assets[0]["filename"] == "LTX-23_00001-audio.mp4"
    assert assets[0]["kind"] == "video"
    assert assets[0]["stack_asset_count"] == 3


@pytest.mark.asyncio
async def test_paginate_grouped_assets_preserves_generation_time_on_selected_stack_representative():
    async def _fetch_rows(_limit, _offset):
        return Result.Ok(
            {
                "rows": [
                    {
                        "id": 42,
                        "filename": "ltx-23_00001.png",
                        "kind": "image",
                        "stack_id": 1,
                        "job_id": "job-1",
                        "size": 185981,
                        "mtime": 199,
                        "has_generation_data": 1,
                        "generation_time_ms": 218600,
                        "tags": "[]",
                    },
                    {
                        "id": 44,
                        "filename": "LTX-23_00001-audio.mp4",
                        "kind": "video",
                        "stack_id": 1,
                        "job_id": "job-1",
                        "size": 30000,
                        "mtime": 198,
                        "has_generation_data": 1,
                        "generation_time_ms": None,
                        "tags": "[]",
                    },
                ]
            }
        )

    result = await m._paginate_grouped_assets(
        _fetch_rows,
        lambda rows: m._hydrate_search_rows(rows, include_highlight=True),
        limit=10,
        offset=0,
        include_total=True,
    )

    assert result.ok
    assets = result.data["assets"]
    assert len(assets) == 1
    assert assets[0]["filename"] == "LTX-23_00001-audio.mp4"
    assert assets[0]["generation_time_ms"] == 218600
    assert assets[0]["stack_asset_count"] == 2
