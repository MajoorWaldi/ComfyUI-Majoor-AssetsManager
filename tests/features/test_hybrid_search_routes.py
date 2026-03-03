import json

import pytest
from aiohttp import web
from aiohttp.test_utils import make_mocked_request

from mjr_am_backend.routes.handlers import hybrid_search
from mjr_am_backend.shared import Result


def _build_hybrid_app() -> web.Application:
    app = web.Application()
    routes = web.RouteTableDef()
    hybrid_search.register_hybrid_search_routes(routes)
    app.add_routes(routes)
    return app


@pytest.mark.asyncio
async def test_hybrid_search_rejects_invalid_scope(monkeypatch) -> None:
    async def _require_services():
        return {"db": object(), "vector_searcher": object()}, None

    monkeypatch.setattr(hybrid_search, "_require_services", _require_services)
    monkeypatch.setattr(hybrid_search, "_check_rate_limit", lambda *_args, **_kwargs: (True, None))

    app = _build_hybrid_app()
    req = make_mocked_request("GET", "/mjr/am/search/hybrid?q=cat&scope=bad", app=app)
    match = await app.router.resolve(req)
    req._match_info = match
    resp = await match.handler(req)
    body = json.loads(resp.text)

    assert body.get("ok") is False
    assert body.get("code") == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_hybrid_search_filters_semantic_hits_by_scope(monkeypatch) -> None:
    class _DB:
        async def aquery(self, sql: str, params=()):
            # FTS side returns nothing, so result relies on semantic path.
            if "FROM assets_fts" in sql:
                return Result.Ok([])
            # Semantic hit post-filtering should keep only asset_id=2.
            if "SELECT a.id AS asset_id" in sql and "WHERE a.id IN" in sql:
                return Result.Ok([{"asset_id": 2}])
            return Result.Ok([])

    class _Searcher:
        async def search_by_text(self, _query: str, *, top_k: int = 20):
            assert top_k >= 20
            return Result.Ok(
                [
                    {"asset_id": 1, "score": 0.97},
                    {"asset_id": 2, "score": 0.95},
                    {"asset_id": 3, "score": 0.93},
                ]
            )

    async def _require_services():
        return {"db": _DB(), "vector_searcher": _Searcher()}, None

    async def _hydrate_passthrough(_services, result):
        return Result.Ok(result.data or [])

    monkeypatch.setattr(hybrid_search, "_require_services", _require_services)
    monkeypatch.setattr(hybrid_search, "_hydrate_vector_results", _hydrate_passthrough)
    monkeypatch.setattr(hybrid_search, "_check_rate_limit", lambda *_args, **_kwargs: (True, None))

    app = _build_hybrid_app()
    req = make_mocked_request("GET", "/mjr/am/search/hybrid?q=cat&scope=output&top_k=5", app=app)
    match = await app.router.resolve(req)
    req._match_info = match
    resp = await match.handler(req)
    body = json.loads(resp.text)

    assert body.get("ok") is True
    data = body.get("data") or []
    assert len(data) == 1
    assert data[0].get("asset_id") == 2
    assert data[0].get("_matchType") == "semantic"


@pytest.mark.asyncio
async def test_hybrid_search_scope_all_does_not_force_source_all(monkeypatch) -> None:
    seen = {"checked": False}

    class _DB:
        async def aquery(self, sql: str, params=()):
            if "FROM assets_fts" in sql:
                # Regression guard: scope=all must not emit "a.source = 'all'" filtering.
                assert "a.source = ?" not in sql
                seen["checked"] = True
                return Result.Ok([{"asset_id": 9, "_rank": 0.4}])
            return Result.Ok([])

    async def _require_services():
        return {"db": _DB(), "vector_searcher": None}, None

    async def _hydrate_passthrough(_services, result):
        return Result.Ok(result.data or [])

    monkeypatch.setattr(hybrid_search, "_require_services", _require_services)
    monkeypatch.setattr(hybrid_search, "_hydrate_vector_results", _hydrate_passthrough)
    monkeypatch.setattr(hybrid_search, "_check_rate_limit", lambda *_args, **_kwargs: (True, None))

    app = _build_hybrid_app()
    req = make_mocked_request("GET", "/mjr/am/search/hybrid?q=cat&scope=all&top_k=5", app=app)
    match = await app.router.resolve(req)
    req._match_info = match
    resp = await match.handler(req)
    body = json.loads(resp.text)

    assert body.get("ok") is True
    assert seen["checked"] is True
    data = body.get("data") or []
    assert data and data[0].get("asset_id") == 9
