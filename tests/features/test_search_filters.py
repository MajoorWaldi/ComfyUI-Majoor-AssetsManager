import datetime

import pytest
from mjr_am_backend.features.index import searcher as searcher_mod
from mjr_am_backend.routes.handlers import search as search_mod
from mjr_am_backend.routes.search import query_sanitizer as qs


def test_parse_inline_query_filters_extracts_extensions_and_rating():
    query, filters = search_mod._parse_inline_query_filters("ext:PNG rating:5 forest")
    assert filters["extensions"] == ["png"]
    assert filters["min_rating"] == 5
    assert query == "forest"


def test_parse_inline_query_filters_handles_kind_and_clamps_rating():
    query, filters = search_mod._parse_inline_query_filters("kind:Video ext:.WebP rating:6 stray")
    assert filters["kind"] == "video"
    assert filters["extensions"] == ["webp"]
    assert filters["min_rating"] == 5
    assert query == "stray"


def test_parse_inline_query_filters_leaves_unhandled_tokens():
    query, filters = search_mod._parse_inline_query_filters("foo:bar rating:two ext:")
    assert query == "foo:bar rating:two ext:"
    assert not filters


def test_date_bounds_range_uses_utc_reference():
    reference = datetime.datetime(2026, 2, 7, 23, 45, tzinfo=datetime.timezone.utc)
    start, end = search_mod._date_bounds_for_range("today", reference=reference)
    expected = int(datetime.datetime(2026, 2, 7, tzinfo=datetime.timezone.utc).timestamp())
    assert start == expected
    assert end == expected + 86400


def test_date_bounds_exact_anchors_to_utc_midnight():
    start, end = search_mod._date_bounds_for_exact("2026-02-01")
    expected = int(datetime.datetime(2026, 2, 1, tzinfo=datetime.timezone.utc).timestamp())
    assert start == expected
    assert end == expected + 86400


def test_sql_fragment_guard_rejects_unsafe_characters():
    with pytest.raises(ValueError):
        searcher_mod._assert_safe_sql_fragment("a.id = 1; DROP TABLE assets;")


def test_parse_request_filters_merges_inline_filters_and_clamps_ranges():
    res = qs.parse_request_filters(
        {
            "kind": "image",
            "min_rating": "4",
            "min_size_mb": "2",
            "max_size_mb": "1",
            "min_width": "1920",
            "max_width": "100",
            "workflow_type": "t2i",
            "has_workflow": "1",
            "date_exact": "2026-02-01",
        },
        {"extensions": ["png"]},
    )

    assert res.ok
    data = res.data or {}
    assert data["kind"] == "image"
    assert data["min_rating"] == 4
    assert data["extensions"] == ["png"]
    assert data["max_size_bytes"] == data["min_size_bytes"]
    assert data["max_width"] == data["min_width"]
    assert data["workflow_type"] == "T2I"
    assert data["has_workflow"] is True
    assert data["mtime_start"] < data["mtime_end"]


def test_parse_request_filters_rejects_bad_date_range():
    res = qs.parse_request_filters({"date_range": "last_9000_days"})

    assert not res.ok
    assert res.code == "INVALID_INPUT"
