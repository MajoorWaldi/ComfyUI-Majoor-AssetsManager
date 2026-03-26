import json

import pytest
from aiohttp import web
from aiohttp.test_utils import make_mocked_request

from mjr_am_backend.routes.handlers import vector_search
from mjr_am_backend.shared import Result


def _build_vector_app() -> web.Application:
    app = web.Application()
    routes = web.RouteTableDef()
    vector_search.register_vector_search_routes(routes)
    app.add_routes(routes)
    return app


@pytest.mark.asyncio
async def test_vector_alignment_route_success(monkeypatch) -> None:
    class _Searcher:
        async def get_alignment_score(self, asset_id: int):
            return Result.Ok({"asset_id": asset_id, "score": 0.87})

    async def _require_services():
        return {"vector_searcher": _Searcher()}, None

    monkeypatch.setattr(vector_search, "_require_services", _require_services)
    monkeypatch.setattr(vector_search, "is_vector_search_enabled", lambda: True)

    app = _build_vector_app()
    req = make_mocked_request("GET", "/mjr/am/vector/alignment/42", app=app)
    match = await app.router.resolve(req)
    req._match_info = match
    resp = await match.handler(req)
    body = json.loads(resp.text)

    assert body.get("ok") is True
    assert (body.get("data") or {}).get("asset_id") == 42
    assert (body.get("data") or {}).get("score") == 0.87


@pytest.mark.asyncio
async def test_vector_alignment_route_invalid_asset_id(monkeypatch) -> None:
    class _Searcher:
        async def get_alignment_score(self, asset_id: int):
            return Result.Ok({"asset_id": asset_id, "score": 0.5})

    async def _require_services():
        return {"vector_searcher": _Searcher()}, None

    monkeypatch.setattr(vector_search, "_require_services", _require_services)
    monkeypatch.setattr(vector_search, "is_vector_search_enabled", lambda: True)

    app = _build_vector_app()
    req = make_mocked_request("GET", "/mjr/am/vector/alignment/not-an-int", app=app)
    match = await app.router.resolve(req)
    req._match_info = match
    resp = await match.handler(req)
    body = json.loads(resp.text)

    assert body.get("ok") is False
    assert body.get("code") == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_vector_alignment_route_respects_rate_limit(monkeypatch) -> None:
    async def _require_services():
        raise AssertionError("services should not be required when rate-limited")

    monkeypatch.setattr(vector_search, "_require_services", _require_services)
    monkeypatch.setattr(vector_search, "_check_rate_limit", lambda *_args, **_kwargs: (False, 9))

    app = _build_vector_app()
    req = make_mocked_request("GET", "/mjr/am/vector/alignment/1", app=app)
    match = await app.router.resolve(req)
    req._match_info = match
    resp = await match.handler(req)
    body = json.loads(resp.text)

    assert body.get("ok") is False
    assert body.get("code") == "RATE_LIMITED"
    assert resp.headers.get("Retry-After") == "9"


@pytest.mark.asyncio
async def test_vector_alignment_route_disabled_returns_503_payload(monkeypatch) -> None:
    async def _require_services():
        return {}, None

    monkeypatch.setattr(vector_search, "_require_services", _require_services)
    monkeypatch.setattr(vector_search, "is_vector_search_enabled", lambda: False)

    app = _build_vector_app()
    req = make_mocked_request("GET", "/mjr/am/vector/alignment/1", app=app)
    match = await app.router.resolve(req)
    req._match_info = match
    resp = await match.handler(req)
    body = json.loads(resp.text)

    assert body.get("ok") is False
    assert body.get("code") == "SERVICE_UNAVAILABLE"


@pytest.mark.asyncio
async def test_vector_search_route_handles_searcher_exception(monkeypatch) -> None:
    class _Searcher:
        async def search_by_text(self, _query: str, *, top_k: int = 20):
            raise RuntimeError("model load failed")

    async def _require_services():
        return {"vector_searcher": _Searcher()}, None

    monkeypatch.setattr(vector_search, "_require_services", _require_services)
    monkeypatch.setattr(vector_search, "is_vector_search_enabled", lambda: True)

    app = _build_vector_app()
    req = make_mocked_request("GET", "/mjr/am/vector/search?q=cat", app=app)
    match = await app.router.resolve(req)
    req._match_info = match
    resp = await match.handler(req)
    body = json.loads(resp.text)

    assert body.get("ok") is False
    assert body.get("code") == "SERVICE_UNAVAILABLE"


@pytest.mark.asyncio
async def test_vector_search_route_rejects_invalid_scope(monkeypatch) -> None:
    class _Searcher:
        async def search_by_text(self, _query: str, *, top_k: int = 20):
            return Result.Ok([{"asset_id": 1, "score": 0.99}])

    async def _require_services():
        return {"vector_searcher": _Searcher()}, None

    monkeypatch.setattr(vector_search, "_require_services", _require_services)
    monkeypatch.setattr(vector_search, "is_vector_search_enabled", lambda: True)
    monkeypatch.setattr(vector_search, "_check_rate_limit", lambda *_args, **_kwargs: (True, None))

    app = _build_vector_app()
    req = make_mocked_request("GET", "/mjr/am/vector/search?q=cat&scope=bad", app=app)
    match = await app.router.resolve(req)
    req._match_info = match
    resp = await match.handler(req)
    body = json.loads(resp.text)

    assert body.get("ok") is False
    assert body.get("code") == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_vector_search_route_filters_hits_by_scope(monkeypatch) -> None:
    class _DB:
        async def aquery(self, sql: str, params=()):
            if "SELECT a.id AS asset_id FROM assets a" in sql:
                # Only asset 2 belongs to requested scope.
                return Result.Ok([{"asset_id": 2}])
            return Result.Ok([])

    class _Searcher:
        async def search_by_text(self, _query: str, *, top_k: int = 20):
            assert top_k >= 20  # route oversamples to keep enough scoped hits.
            return Result.Ok(
                [
                    {"asset_id": 1, "score": 0.95},
                    {"asset_id": 2, "score": 0.93},
                    {"asset_id": 3, "score": 0.91},
                ]
            )

    async def _require_services():
        return {"vector_searcher": _Searcher(), "db": _DB()}, None

    async def _hydrate_passthrough(_services, result):
        return Result.Ok(result.data or [])

    monkeypatch.setattr(vector_search, "_require_services", _require_services)
    monkeypatch.setattr(vector_search, "_hydrate_vector_results", _hydrate_passthrough)
    monkeypatch.setattr(vector_search, "is_vector_search_enabled", lambda: True)
    monkeypatch.setattr(vector_search, "_check_rate_limit", lambda *_args, **_kwargs: (True, None))

    app = _build_vector_app()
    req = make_mocked_request("GET", "/mjr/am/vector/search?q=cat&scope=output&top_k=5", app=app)
    match = await app.router.resolve(req)
    req._match_info = match
    resp = await match.handler(req)
    body = json.loads(resp.text)

    assert body.get("ok") is True
    assert body.get("data") == [{"asset_id": 2, "score": 0.93}]


@pytest.mark.asyncio
async def test_vector_search_route_applies_asset_filters(monkeypatch) -> None:
    class _DB:
        async def aquery(self, sql: str, params=()):
            assert "COALESCE(a.subfolder, '') = ?" in sql
            assert "COALESCE(m.rating, 0) >= ?" in sql
            assert "COALESCE(a.size, 0) >= ?" in sql
            assert "json_extract(m.metadata_raw, '$.workflow_type')" in sql
            assert "a.mtime >= ?" in sql
            assert "a.mtime < ?" in sql
            assert 4 in params
            assert "animals" in params
            return Result.Ok([{"asset_id": 2}])

    class _Searcher:
        async def search_by_text(self, _query: str, *, top_k: int = 20):
            assert top_k >= 20
            return Result.Ok(
                [
                    {"asset_id": 1, "score": 0.95},
                    {"asset_id": 2, "score": 0.93},
                    {"asset_id": 3, "score": 0.91},
                ]
            )

    async def _require_services():
        return {"vector_searcher": _Searcher(), "db": _DB()}, None

    async def _hydrate_passthrough(_services, result):
        return Result.Ok(result.data or [])

    monkeypatch.setattr(vector_search, "_require_services", _require_services)
    monkeypatch.setattr(vector_search, "_hydrate_vector_results", _hydrate_passthrough)
    monkeypatch.setattr(vector_search, "is_vector_search_enabled", lambda: True)
    monkeypatch.setattr(vector_search, "_check_rate_limit", lambda *_args, **_kwargs: (True, None))

    app = _build_vector_app()
    req = make_mocked_request(
        "GET",
        "/mjr/am/vector/search?q=cat&scope=output&subfolder=animals&top_k=5&min_rating=4&min_size_mb=2&workflow_type=t2i&date_exact=2026-01-15",
        app=app,
    )
    match = await app.router.resolve(req)
    req._match_info = match
    resp = await match.handler(req)
    body = json.loads(resp.text)

    assert body.get("ok") is True
    assert body.get("data") == [{"asset_id": 2, "score": 0.93}]


@pytest.mark.asyncio
async def test_vector_search_route_filters_weak_score_tail(monkeypatch) -> None:
    class _DB:
        async def aquery(self, sql: str, params=()):
            if "SELECT a.id AS asset_id FROM assets a" in sql:
                return Result.Ok(
                    [
                        {"asset_id": 1},
                        {"asset_id": 2},
                        {"asset_id": 3},
                    ]
                )
            return Result.Ok([])

    class _Searcher:
        async def search_by_text(self, _query: str, *, top_k: int = 20):
            assert top_k >= 20
            return Result.Ok(
                [
                    {"asset_id": 1, "score": 0.14},
                    {"asset_id": 2, "score": 0.10},
                    {"asset_id": 3, "score": 0.05},
                ]
            )

    async def _require_services():
        return {"vector_searcher": _Searcher(), "db": _DB()}, None

    async def _hydrate_passthrough(_services, result):
        return Result.Ok(result.data or [])

    monkeypatch.setattr(vector_search, "_require_services", _require_services)
    monkeypatch.setattr(vector_search, "_hydrate_vector_results", _hydrate_passthrough)
    monkeypatch.setattr(vector_search, "is_vector_search_enabled", lambda: True)
    monkeypatch.setattr(vector_search, "_check_rate_limit", lambda *_args, **_kwargs: (True, None))
    monkeypatch.setattr(vector_search, "VECTOR_TEXT_SEARCH_MIN_SCORE", 0.02)
    monkeypatch.setattr(vector_search, "VECTOR_TEXT_SEARCH_RELATIVE_RATIO", 0.7)

    app = _build_vector_app()
    req = make_mocked_request("GET", "/mjr/am/vector/search?q=dinosaure&scope=output&top_k=5", app=app)
    match = await app.router.resolve(req)
    req._match_info = match
    resp = await match.handler(req)
    body = json.loads(resp.text)

    assert body.get("ok") is True
    assert body.get("data") == [
        {"asset_id": 1, "score": 0.14},
        {"asset_id": 2, "score": 0.1},
    ]


@pytest.mark.asyncio
async def test_vector_similar_route_success(monkeypatch) -> None:
    class _Searcher:
        async def find_similar(self, asset_id: int, *, top_k: int = 20):
            assert asset_id == 42
            assert top_k >= 12
            return Result.Ok([{"asset_id": 77, "score": 0.91}])

    async def _require_services():
        return {"vector_searcher": _Searcher()}, None

    monkeypatch.setattr(vector_search, "_require_services", _require_services)
    monkeypatch.setattr(vector_search, "is_vector_search_enabled", lambda: True)
    monkeypatch.setattr(vector_search, "_check_rate_limit", lambda *_args, **_kwargs: (True, None))

    app = _build_vector_app()
    req = make_mocked_request("GET", "/mjr/am/vector/similar/42?top_k=12", app=app)
    match = await app.router.resolve(req)
    req._match_info = match
    resp = await match.handler(req)
    body = json.loads(resp.text)

    assert body.get("ok") is True
    assert isinstance(body.get("data"), list)
    assert (body.get("data") or [])[0]["asset_id"] == 77


@pytest.mark.asyncio
async def test_vector_similar_route_filters_hits_by_scope(monkeypatch) -> None:
    class _DB:
        async def aquery(self, sql: str, params=()):
            if "SELECT a.id AS asset_id FROM assets a" in sql:
                return Result.Ok([{"asset_id": 88}])
            return Result.Ok([])

    class _Searcher:
        async def find_similar(self, asset_id: int, *, top_k: int = 20):
            assert asset_id == 42
            assert top_k > 10
            return Result.Ok(
                [
                    {"asset_id": 77, "score": 0.91},
                    {"asset_id": 88, "score": 0.90},
                ]
            )

    async def _require_services():
        return {"vector_searcher": _Searcher(), "db": _DB()}, None

    async def _hydrate_passthrough(_services, result):
        return Result.Ok(result.data or [])

    monkeypatch.setattr(vector_search, "_require_services", _require_services)
    monkeypatch.setattr(vector_search, "_hydrate_vector_results", _hydrate_passthrough)
    monkeypatch.setattr(vector_search, "is_vector_search_enabled", lambda: True)
    monkeypatch.setattr(vector_search, "_check_rate_limit", lambda *_args, **_kwargs: (True, None))

    app = _build_vector_app()
    req = make_mocked_request("GET", "/mjr/am/vector/similar/42?top_k=10&scope=custom&custom_root_id=r1", app=app)
    match = await app.router.resolve(req)
    req._match_info = match
    resp = await match.handler(req)
    body = json.loads(resp.text)

    assert body.get("ok") is True
    assert body.get("data") == [{"asset_id": 88, "score": 0.9}]


@pytest.mark.asyncio
async def test_vector_similar_route_filters_by_kind_and_min_score(monkeypatch) -> None:
    class _DB:
        async def aquery(self, sql: str, params=()):
            if "SELECT LOWER(COALESCE(kind, '')) AS kind FROM assets WHERE id = ?" in sql:
                return Result.Ok([{"kind": "image"}])
            if "SELECT id AS asset_id FROM assets WHERE id IN" in sql and "LOWER(COALESCE(kind, '')) = ?" in sql:
                return Result.Ok([{"asset_id": 77}, {"asset_id": 88}])
            return Result.Ok([])

    class _Searcher:
        async def find_similar(self, asset_id: int, *, top_k: int = 20):
            assert asset_id == 42
            assert top_k > 10
            return Result.Ok(
                [
                    {"asset_id": 77, "score": 0.91},
                    {"asset_id": 88, "score": 0.55},
                    {"asset_id": 99, "score": 0.89},
                ]
            )

    async def _require_services():
        return {"vector_searcher": _Searcher(), "db": _DB()}, None

    async def _hydrate_passthrough(_services, result):
        return Result.Ok(result.data or [])

    monkeypatch.setattr(vector_search, "_require_services", _require_services)
    monkeypatch.setattr(vector_search, "_hydrate_vector_results", _hydrate_passthrough)
    monkeypatch.setattr(vector_search, "is_vector_search_enabled", lambda: True)
    monkeypatch.setattr(vector_search, "_check_rate_limit", lambda *_args, **_kwargs: (True, None))
    monkeypatch.setattr(vector_search, "VECTOR_SIMILAR_MIN_SCORE", 0.6)

    app = _build_vector_app()
    req = make_mocked_request("GET", "/mjr/am/vector/similar/42?top_k=10&scope=all", app=app)
    match = await app.router.resolve(req)
    req._match_info = match
    resp = await match.handler(req)
    body = json.loads(resp.text)

    assert body.get("ok") is True
    assert body.get("data") == [{"asset_id": 77, "score": 0.91}]


@pytest.mark.asyncio
async def test_vector_enhance_prompt_alias_route_success(monkeypatch) -> None:
    class _DB:
        pass

    class _VS:
        pass

    async def _require_services():
        return {"db": _DB(), "vector_service": _VS(), "vector_searcher": object()}, None

    async def _fake_generate(_db, _vs, asset_id: int):
        return Result.Ok(f"caption-{asset_id}")

    import mjr_am_backend.features.index.vector_indexer as vector_indexer

    monkeypatch.setattr(vector_indexer, "generate_enhanced_prompt", _fake_generate)
    monkeypatch.setattr(vector_search, "_require_services", _require_services)
    monkeypatch.setattr(vector_search, "is_vector_search_enabled", lambda: True)

    app = _build_vector_app()
    req = make_mocked_request("POST", "/mjr-am/assets/enhance-prompt", app=app)

    async def _json_body():
        return {"asset_id": 42}

    req.json = _json_body  # type: ignore[assignment]
    match = await app.router.resolve(req)
    req._match_info = match
    resp = await match.handler(req)
    body = json.loads(resp.text)

    assert body.get("ok") is True
    assert body.get("data") == "caption-42"


@pytest.mark.asyncio
async def test_vector_caption_alias_route_success(monkeypatch) -> None:
    class _DB:
        pass

    class _VS:
        pass

    async def _require_services():
        return {"db": _DB(), "vector_service": _VS(), "vector_searcher": object()}, None

    async def _fake_generate(_db, _vs, asset_id: int):
        return Result.Ok(f"caption-{asset_id}")

    import mjr_am_backend.features.index.vector_indexer as vector_indexer

    monkeypatch.setattr(vector_indexer, "generate_enhanced_prompt", _fake_generate)
    monkeypatch.setattr(vector_search, "_require_services", _require_services)
    monkeypatch.setattr(vector_search, "is_vector_search_enabled", lambda: True)

    app = _build_vector_app()
    req = make_mocked_request("POST", "/mjr-am/assets/caption", app=app)

    async def _json_body():
        return {"asset_id": 42}

    req.json = _json_body  # type: ignore[assignment]
    match = await app.router.resolve(req)
    req._match_info = match
    resp = await match.handler(req)
    body = json.loads(resp.text)

    assert body.get("ok") is True
    assert body.get("data") == "caption-42"


@pytest.mark.asyncio
async def test_vector_generate_enhanced_prompt_route_success(monkeypatch) -> None:
    class _DB:
        pass

    class _VS:
        pass

    async def _require_services():
        return {"db": _DB(), "vector_service": _VS(), "vector_searcher": object()}, None

    async def _fake_generate(_db, _vs, asset_id: int):
        return Result.Ok(f"caption-{asset_id}")

    import mjr_am_backend.features.index.vector_indexer as vector_indexer

    monkeypatch.setattr(vector_indexer, "generate_enhanced_prompt", _fake_generate)
    monkeypatch.setattr(vector_search, "_require_services", _require_services)
    monkeypatch.setattr(vector_search, "is_vector_search_enabled", lambda: True)

    app = _build_vector_app()
    req = make_mocked_request("POST", "/mjr/am/vector/enhanced-prompt/42", app=app)
    match = await app.router.resolve(req)
    req._match_info = match
    resp = await match.handler(req)
    body = json.loads(resp.text)

    assert body.get("ok") is True
    assert body.get("data") == "caption-42"


@pytest.mark.asyncio
async def test_vector_generate_caption_route_success(monkeypatch) -> None:
    class _DB:
        pass

    class _VS:
        pass

    async def _require_services():
        return {"db": _DB(), "vector_service": _VS(), "vector_searcher": object()}, None

    async def _fake_generate(_db, _vs, asset_id: int):
        return Result.Ok(f"caption-{asset_id}")

    import mjr_am_backend.features.index.vector_indexer as vector_indexer

    monkeypatch.setattr(vector_indexer, "generate_enhanced_prompt", _fake_generate)
    monkeypatch.setattr(vector_search, "_require_services", _require_services)
    monkeypatch.setattr(vector_search, "is_vector_search_enabled", lambda: True)

    app = _build_vector_app()
    req = make_mocked_request("POST", "/mjr/am/vector/caption/42", app=app)
    match = await app.router.resolve(req)
    req._match_info = match
    resp = await match.handler(req)
    body = json.loads(resp.text)

    assert body.get("ok") is True
    assert body.get("data") == "caption-42"


@pytest.mark.asyncio
async def test_vector_caption_route_respects_rate_limit(monkeypatch) -> None:
    async def _require_services():
        raise AssertionError("services should not be required when rate-limited")

    monkeypatch.setattr(vector_search, "_require_services", _require_services)
    monkeypatch.setattr(vector_search, "_check_rate_limit", lambda *_args, **_kwargs: (False, 7))

    app = _build_vector_app()
    req = make_mocked_request("POST", "/mjr/am/vector/caption/42", app=app)
    match = await app.router.resolve(req)
    req._match_info = match
    resp = await match.handler(req)
    body = json.loads(resp.text)

    assert body.get("ok") is False
    assert body.get("code") == "RATE_LIMITED"
    assert resp.headers.get("Retry-After") == "7"


@pytest.mark.asyncio
async def test_vector_auto_tags_route_returns_tags(monkeypatch) -> None:
    class _DB:
        async def aquery(self, sql: str, params=()):
            assert "SELECT auto_tags FROM vec.asset_embeddings" in sql
            assert params == (42,)
            return Result.Ok([{"auto_tags": '["portrait", "anime"]'}])

    async def _require_services():
        return {"db": _DB(), "vector_searcher": object()}, None

    monkeypatch.setattr(vector_search, "_require_services", _require_services)
    monkeypatch.setattr(vector_search, "is_vector_search_enabled", lambda: True)

    app = _build_vector_app()
    req = make_mocked_request("GET", "/mjr/am/vector/auto-tags/42", app=app)
    match = await app.router.resolve(req)
    req._match_info = match
    resp = await match.handler(req)
    body = json.loads(resp.text)

    assert body.get("ok") is True
    assert body.get("data") == ["portrait", "anime"]


@pytest.mark.asyncio
async def test_vector_auto_tags_route_disabled_when_vector_off(monkeypatch) -> None:
    class _DB:
        async def aquery(self, _sql: str, _params=()):
            return Result.Ok([])

    async def _require_services():
        return {"db": _DB(), "vector_searcher": object()}, None

    monkeypatch.setattr(vector_search, "_require_services", _require_services)
    monkeypatch.setattr(vector_search, "is_vector_search_enabled", lambda: False)

    app = _build_vector_app()
    req = make_mocked_request("GET", "/mjr/am/vector/auto-tags/42", app=app)
    match = await app.router.resolve(req)
    req._match_info = match
    resp = await match.handler(req)
    body = json.loads(resp.text)

    assert body.get("ok") is False
    assert body.get("code") == "SERVICE_UNAVAILABLE"


@pytest.mark.asyncio
async def test_vector_suggest_collections_route_returns_clusters(monkeypatch) -> None:
    from mjr_am_backend.features.index.vector_service import vector_to_blob

    vec_a = vector_to_blob([1.0, 0.0, 0.0])
    vec_b = vector_to_blob([0.9, 0.1, 0.0])
    vec_c = vector_to_blob([0.0, 1.0, 0.0])

    class _DB:
        async def aquery(self, sql: str, params=()):
            if "FROM vec.asset_embeddings ae" in sql:
                return Result.Ok([
                    {"asset_id": 1, "vector": vec_a, "auto_tags": '["portrait"]'},
                    {"asset_id": 2, "vector": vec_b, "auto_tags": '["portrait"]'},
                    {"asset_id": 3, "vector": vec_c, "auto_tags": '["landscape"]'},
                ])
            if "FROM assets WHERE id IN" in sql:
                return Result.Ok([
                    {"id": 1, "filepath": "/a.png", "filename": "a.png", "subfolder": "", "type": "output", "kind": "image"},
                    {"id": 2, "filepath": "/b.png", "filename": "b.png", "subfolder": "", "type": "output", "kind": "image"},
                    {"id": 3, "filepath": "/c.png", "filename": "c.png", "subfolder": "", "type": "output", "kind": "image"},
                ])
            return Result.Ok([])

    class _Searcher:
        _dim = 3

    async def _require_services():
        return {"db": _DB(), "vector_searcher": _Searcher()}, None

    monkeypatch.setattr(vector_search, "_require_services", _require_services)
    monkeypatch.setattr(vector_search, "is_vector_search_enabled", lambda: True)
    monkeypatch.setattr(vector_search, "_require_vector_services", lambda services: (services.get("vector_searcher"), None))
    monkeypatch.setattr(vector_search, "_check_rate_limit", lambda *_args, **_kwargs: (True, None))

    app = _build_vector_app()
    req = make_mocked_request("POST", "/mjr/am/vector/suggest-collections", app=app)

    async def _json_body():
        return {"k": 2}

    req.json = _json_body  # type: ignore[assignment]
    match = await app.router.resolve(req)
    req._match_info = match
    resp = await match.handler(req)
    body = json.loads(resp.text)

    assert body.get("ok") is True
    assert isinstance(body.get("data"), list)
    assert len(body.get("data") or []) >= 1
