"""Tests for the library audit route handler."""

from __future__ import annotations

import json

import pytest
from aiohttp import web
from aiohttp.test_utils import make_mocked_request

from mjr_am_backend.routes.handlers import audit as m
from mjr_am_backend.shared import Result


def _build_app() -> web.Application:
    app = web.Application()
    routes = web.RouteTableDef()
    m.register_audit_routes(routes)
    app.add_routes(routes)
    return app


def _json(resp):
    return json.loads(resp.text)


async def _invoke(app, qs: str = ""):
    url = f"/mjr/am/audit{'?' + qs if qs else ''}"
    req = make_mocked_request("GET", url, app=app)
    match = await app.router.resolve(req)
    return await match.handler(req)


# -- Services unavailable -----------------------------------------------------


@pytest.mark.asyncio
async def test_audit_returns_error_when_services_unavailable(monkeypatch):
    async def _require_services():
        return None, Result.Err("SERVICE_UNAVAILABLE", "down")

    monkeypatch.setattr(m, "_require_services", _require_services)
    app = _build_app()
    resp = await _invoke(app)
    body = _json(resp)
    assert body.get("ok") is False
    assert body.get("code") == "SERVICE_UNAVAILABLE"


@pytest.mark.asyncio
async def test_audit_returns_error_when_services_not_dict(monkeypatch):
    async def _require_services():
        return "not-a-dict", None

    monkeypatch.setattr(m, "_require_services", _require_services)
    app = _build_app()
    resp = await _invoke(app)
    body = _json(resp)
    assert body.get("ok") is False
    assert body.get("code") == "SERVICE_UNAVAILABLE"


# -- DB unavailable ------------------------------------------------------------


@pytest.mark.asyncio
async def test_audit_returns_error_when_db_is_none(monkeypatch):
    async def _require_services():
        return {"db": None}, None

    monkeypatch.setattr(m, "_require_services", _require_services)
    app = _build_app()
    resp = await _invoke(app)
    body = _json(resp)
    assert body.get("ok") is False
    assert body.get("code") == "SERVICE_UNAVAILABLE"


# -- DB query failure ----------------------------------------------------------


@pytest.mark.asyncio
async def test_audit_returns_error_on_db_query_failure(monkeypatch):
    class _DB:
        async def aquery(self, *_args):
            raise RuntimeError("connection lost")

    async def _require_services():
        return {"db": _DB()}, None

    monkeypatch.setattr(m, "_require_services", _require_services)
    app = _build_app()
    resp = await _invoke(app)
    body = _json(resp)
    assert body.get("ok") is False
    assert body.get("code") == "DB_ERROR"


@pytest.mark.asyncio
async def test_audit_returns_error_on_db_result_not_ok(monkeypatch):
    class _DB:
        async def aquery(self, *_args):
            return Result.Err("DB_ERROR", "broken")

    async def _require_services():
        return {"db": _DB()}, None

    monkeypatch.setattr(m, "_require_services", _require_services)
    app = _build_app()
    resp = await _invoke(app)
    body = _json(resp)
    assert body.get("ok") is False
    assert body.get("code") == "DB_ERROR"


# -- Successful query with data ------------------------------------------------


@pytest.mark.asyncio
async def test_audit_returns_assets_on_success(monkeypatch):
    rows = [
        {
            "id": 1,
            "filename": "img.png",
            "subfolder": "",
            "filepath": "/out/img.png",
            "kind": "image",
            "type": "output",
            "mtime": 1700000000,
            "file_size": 12345,
            "width": 512,
            "height": 512,
            "rating": 0,
            "tags": "[]",
            "has_workflow": 0,
            "has_generation_data": 0,
            "aesthetic_score": None,
            "auto_tags": "[]",
        }
    ]

    class _DB:
        async def aquery(self, query, *_args):
            if "COUNT(*) AS total" in query:
                return Result.Ok([{"total": 1}])
            return Result.Ok(rows)

    async def _require_services():
        return {"db": _DB()}, None

    monkeypatch.setattr(m, "_require_services", _require_services)
    app = _build_app()
    resp = await _invoke(app)
    body = _json(resp)
    assert body.get("ok") is True
    data = body.get("data")
    assert isinstance(data, list)
    assert len(data) == 1
    asset = data[0]
    assert asset["id"] == 1
    assert asset["filename"] == "img.png"
    assert asset["completeness_score"] == 0.0
    assert asset["has_tags"] is False
    assert asset["has_rating"] is False
    assert resp.headers["X-Total-Count"] == "1"
    assert resp.headers["X-Limit"] == "200"
    assert resp.headers["X-Offset"] == "0"


# -- Query params: limit clamping ----------------------------------------------


@pytest.mark.asyncio
async def test_audit_clamps_limit(monkeypatch):
    captured_params = {}

    class _DB:
        async def aquery(self, query, params):
            if "COUNT(*) AS total" in query:
                return Result.Ok([{"total": 0}])
            captured_params["limit"] = params[-2]
            captured_params["offset"] = params[-1]
            return Result.Ok([])

    async def _require_services():
        return {"db": _DB()}, None

    monkeypatch.setattr(m, "_require_services", _require_services)
    app = _build_app()

    # Over maximum
    await _invoke(app, "limit=9999")
    assert captured_params["limit"] == 500
    assert captured_params["offset"] == 0

    # Under minimum
    await _invoke(app, "limit=-5")
    assert captured_params["limit"] == 1

    # Invalid value falls back to default 200
    await _invoke(app, "limit=abc")
    assert captured_params["limit"] == 200


@pytest.mark.asyncio
async def test_audit_clamps_offset_and_passes_headers(monkeypatch):
    captured = {}

    class _DB:
        async def aquery(self, query, params):
            if "COUNT(*) AS total" in query:
                return Result.Ok([{"total": 321}])
            captured["limit"] = params[-2]
            captured["offset"] = params[-1]
            return Result.Ok([])

    async def _require_services():
        return {"db": _DB()}, None

    monkeypatch.setattr(m, "_require_services", _require_services)
    app = _build_app()

    resp = await _invoke(app, "limit=25&offset=999999")
    assert captured["limit"] == 25
    assert captured["offset"] == 100000
    assert resp.headers["X-Total-Count"] == "321"
    assert resp.headers["X-Limit"] == "25"
    assert resp.headers["X-Offset"] == "100000"


# -- Query params: filter modes ------------------------------------------------


@pytest.mark.asyncio
async def test_audit_filter_modes_generate_valid_queries(monkeypatch):
    captured_queries = []

    class _DB:
        async def aquery(self, query, params):
            captured_queries.append(query)
            if "COUNT(*) AS total" in query:
                return Result.Ok([{"total": 0}])
            return Result.Ok([])

    async def _require_services():
        return {"db": _DB()}, None

    monkeypatch.setattr(m, "_require_services", _require_services)
    app = _build_app()

    for mode in ("no_tags", "no_rating", "no_workflow", "low_alignment", "incomplete"):
        await _invoke(app, f"filter={mode}")

    assert len(captured_queries) == 10
    # Each query should be valid SQL (no unclosed parens, etc.)
    for q in captured_queries:
        assert "SELECT" in q
        assert "WHERE" in q


# -- Empty result set ----------------------------------------------------------


@pytest.mark.asyncio
async def test_audit_returns_empty_list_when_no_matches(monkeypatch):
    class _DB:
        async def aquery(self, query, *_args):
            if "COUNT(*) AS total" in query:
                return Result.Ok([{"total": 0}])
            return Result.Ok([])

    async def _require_services():
        return {"db": _DB()}, None

    monkeypatch.setattr(m, "_require_services", _require_services)
    app = _build_app()
    resp = await _invoke(app)
    body = _json(resp)
    assert body.get("ok") is True
    assert body.get("data") == []
