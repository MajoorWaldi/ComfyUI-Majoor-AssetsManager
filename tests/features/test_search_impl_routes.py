import asyncio
import json

import pytest
from aiohttp import web
from aiohttp.test_utils import make_mocked_request

from mjr_am_backend.routes.handlers import search_impl
from mjr_am_backend.shared import Result


def _build_search_app() -> web.Application:
    app = web.Application()
    routes = web.RouteTableDef()
    search_impl.register_search_routes(routes)
    app.add_routes(routes)
    return app


@pytest.mark.asyncio
async def test_search_route_rejects_invalid_min_rating(monkeypatch) -> None:
    async def _require_services():
        return {"index": object()}, None

    monkeypatch.setattr(search_impl, "_require_services", _require_services)
    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    monkeypatch.setattr(search_impl, "_touch_enrichment_pause", lambda *args, **kwargs: None)

    app = _build_search_app()
    req = make_mocked_request("GET", "/mjr/am/search?q=x&min_rating=abc", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)
    assert body.get("ok") is False
    assert body.get("code") == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_search_route_dedupes_assets_in_payload(monkeypatch) -> None:
    class _Index:
        async def search(self, query, limit, offset, filters, include_total=True):
            return Result.Ok(
                {
                    "assets": [
                        {"filepath": "/a/x.png"},
                        {"filepath": "/a/x.png"},
                        {"filepath": "/a/y.png"},
                    ],
                    "total": 99,
                }
            )

    async def _require_services():
        return {"index": _Index()}, None

    monkeypatch.setattr(search_impl, "_require_services", _require_services)
    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    monkeypatch.setattr(search_impl, "_touch_enrichment_pause", lambda *args, **kwargs: None)

    app = _build_search_app()
    req = make_mocked_request("GET", "/mjr/am/search?q=cat", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)
    assert body.get("ok") is True
    payload = body.get("data") or {}
    assert len(payload.get("assets") or []) == 2
    assert payload.get("total") == 2


@pytest.mark.asyncio
async def test_list_route_rejects_unknown_scope(monkeypatch) -> None:
    class _Index:
        async def search_scoped(self, *args, **kwargs):
            return Result.Ok({"assets": [], "total": 0})

    async def _require_services():
        return {"index": _Index()}, None

    monkeypatch.setattr(search_impl, "_require_services", _require_services)
    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    monkeypatch.setattr(search_impl, "_touch_enrichment_pause", lambda *args, **kwargs: None)

    app = _build_search_app()
    req = make_mocked_request("GET", "/mjr/am/list?scope=unknown", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)
    assert body.get("ok") is False
    assert body.get("code") == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_autocomplete_rate_limited(monkeypatch) -> None:
    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (False, 3))

    app = _build_search_app()
    req = make_mocked_request("GET", "/mjr/am/autocomplete?q=ca", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)
    assert body.get("ok") is False
    assert body.get("code") == "RATE_LIMITED"


@pytest.mark.asyncio
async def test_batch_assets_requires_list_ids(monkeypatch) -> None:
    class _Index:
        async def get_assets_batch(self, _ids):
            return Result.Ok({"assets": []})

    async def _require_services():
        return {"index": _Index()}, None

    async def _read_json(_request, **_kwargs):
        return Result.Ok({"asset_ids": "bad"})

    monkeypatch.setattr(search_impl, "_require_services", _require_services)
    monkeypatch.setattr(search_impl, "_read_json", _read_json)

    app = _build_search_app()
    req = make_mocked_request("POST", "/mjr/am/assets/batch", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)
    assert body.get("ok") is False
    assert body.get("code") == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_workflow_quick_missing_filename(monkeypatch) -> None:
    async def _require_services():
        return {"index": object()}, None

    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    monkeypatch.setattr(search_impl, "_require_services", _require_services)

    app = _build_search_app()
    req = make_mocked_request("GET", "/mjr/am/workflow-quick", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)
    assert body.get("ok") is False
    assert body.get("code") == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_get_asset_returns_service_error(monkeypatch) -> None:
    async def _require_services():
        return None, Result.Err("SERVICE_UNAVAILABLE", "down")

    monkeypatch.setattr(search_impl, "_require_services", _require_services)

    app = _build_search_app()
    req = make_mocked_request("GET", "/mjr/am/asset/1", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)
    assert body.get("ok") is False
    assert body.get("code") == "SERVICE_UNAVAILABLE"


@pytest.mark.asyncio
async def test_search_route_rate_limited(monkeypatch) -> None:
    class _Index:
        async def search(self, *args, **kwargs):
            return Result.Ok({"assets": [], "total": 0})

    async def _require_services():
        return {"index": _Index()}, None

    monkeypatch.setattr(search_impl, "_require_services", _require_services)
    monkeypatch.setattr(search_impl, "_touch_enrichment_pause", lambda *args, **kwargs: None)
    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (False, 2))

    app = _build_search_app()
    req = make_mocked_request("GET", "/mjr/am/search?q=x", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)
    assert body.get("code") == "RATE_LIMITED"


@pytest.mark.asyncio
async def test_search_route_rejects_invalid_max_size(monkeypatch) -> None:
    class _Index:
        async def search(self, *args, **kwargs):
            return Result.Ok({"assets": [], "total": 0})

    async def _require_services():
        return {"index": _Index()}, None

    monkeypatch.setattr(search_impl, "_require_services", _require_services)
    monkeypatch.setattr(search_impl, "_touch_enrichment_pause", lambda *args, **kwargs: None)
    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (True, None))

    app = _build_search_app()
    req = make_mocked_request("GET", "/mjr/am/search?q=x&max_size_mb=bad", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)
    assert body.get("code") == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_batch_assets_success_filters_ids(monkeypatch) -> None:
    captured = {"ids": None}

    class _Index:
        async def get_assets_batch(self, ids):
            captured["ids"] = ids
            return Result.Ok({"assets": []})

    async def _require_services():
        return {"index": _Index()}, None

    async def _read_json(_request, **_kwargs):
        return Result.Ok({"asset_ids": ["1", -2, "x", 3]})

    monkeypatch.setattr(search_impl, "_require_services", _require_services)
    monkeypatch.setattr(search_impl, "_read_json", _read_json)

    app = _build_search_app()
    req = make_mocked_request("POST", "/mjr/am/assets/batch", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)
    assert body.get("ok") is True
    assert captured["ids"] == [1, 3]

@pytest.mark.asyncio
async def test_autocomplete_success_and_internal_error(monkeypatch) -> None:
    class _Searcher:
        async def autocomplete(self, prefix, limit):
            return Result.Ok({"items": [prefix, limit]})

    class _Index:
        searcher = _Searcher()

    async def _svc_ok():
        return {"index": _Index()}, None

    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    monkeypatch.setattr(search_impl, "_require_services", _svc_ok)
    monkeypatch.setattr(search_impl, "_touch_enrichment_pause", lambda *args, **kwargs: None)

    app = _build_search_app()
    req1 = make_mocked_request("GET", "/mjr/am/autocomplete?q=ca&limit=7", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    assert json.loads(resp1.text).get("ok") is True

    class _Index2:
        pass

    async def _svc_bad():
        return {"index": _Index2()}, None

    monkeypatch.setattr(search_impl, "_require_services", _svc_bad)
    req2 = make_mocked_request("GET", "/mjr/am/autocomplete?q=ca", app=app)
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    assert json.loads(resp2.text).get("code") == "INTERNAL_ERROR"


@pytest.mark.asyncio
async def test_list_input_db_path(monkeypatch, tmp_path) -> None:
    class _Index:
        async def search_scoped(self, *args, **kwargs):
            return Result.Ok({"assets": [{"filepath": str(tmp_path / 'a.png')}], "total": 1})

    async def _svc():
        return {"index": _Index()}, None

    monkeypatch.setattr(search_impl, "_require_services", _svc)
    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    monkeypatch.setattr(search_impl, "_touch_enrichment_pause", lambda *args, **kwargs: None)
    monkeypatch.setattr(search_impl.folder_paths, "get_input_directory", lambda: str(tmp_path))

    app = _build_search_app()
    req = make_mocked_request("GET", "/mjr/am/list?scope=input&q=*&limit=5&offset=0", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    body = json.loads(resp.text)
    assert body.get("ok") is True
    assert (body.get("data") or {}).get("scope") == "input"


@pytest.mark.asyncio
async def test_list_custom_root_missing_and_browser_mode(monkeypatch) -> None:
    async def _svc():
        return {"db": object()}, None

    monkeypatch.setattr(search_impl, "_require_services", _svc)
    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    monkeypatch.setattr(search_impl, "_touch_enrichment_pause", lambda *args, **kwargs: None)
    monkeypatch.setattr(search_impl, "_is_loopback_request", lambda _request: True)

    def _browser_entries(*_args, **_kwargs):
        return Result.Ok({"assets": [{"kind": "image", "filepath": "C:/x.png"}], "total": 1})

    async def _hydrate(_svc, assets):
        return assets

    monkeypatch.setattr(search_impl, "_hydrate_browser_assets_from_db", _hydrate)
    monkeypatch.setattr(
        __import__("mjr_am_backend.features.browser", fromlist=["list_filesystem_browser_entries"]),
        "list_filesystem_browser_entries",
        _browser_entries,
    )

    app = _build_search_app()
    req = make_mocked_request("GET", "/mjr/am/list?scope=custom&q=cat&browser_mode=1", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    assert json.loads(resp.text).get("ok") is True

    monkeypatch.setattr(search_impl, "resolve_custom_root", lambda _rid: Result.Err("NOT_FOUND", "x"))
    req2 = make_mocked_request("GET", "/mjr/am/list?scope=custom&custom_root_id=r1", app=app)
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    assert json.loads(resp2.text).get("code") == "NOT_FOUND"


@pytest.mark.asyncio
async def test_list_all_indexed_path(monkeypatch, tmp_path) -> None:
    class _Index:
        async def has_assets_under_root(self, _root):
            return Result.Ok(True)

        async def search_scoped(self, *args, **kwargs):
            return Result.Ok({"assets": [{"filepath": str(tmp_path / 'a.png'), "source": "output"}], "total": 1})

    async def _svc():
        return {"index": _Index()}, None

    monkeypatch.setattr(search_impl, "_require_services", _svc)
    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    monkeypatch.setattr(search_impl, "_touch_enrichment_pause", lambda *args, **kwargs: None)
    async def _out_root(_svc):
        return str(tmp_path)

    monkeypatch.setattr(search_impl, "_runtime_output_root", _out_root)
    monkeypatch.setattr(search_impl.folder_paths, "get_input_directory", lambda: str(tmp_path / "in"))

    app = _build_search_app()
    req = make_mocked_request("GET", "/mjr/am/list?scope=all", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    assert json.loads(resp.text).get("ok") is True


@pytest.mark.asyncio
async def test_list_output_initial_filesystem_fallback(monkeypatch, tmp_path) -> None:
    class _Index:
        async def search_scoped(self, *args, **kwargs):
            return Result.Ok({"assets": [], "total": 0})

    async def _svc():
        return {"index": _Index()}, None

    async def _fs(*_args, **_kwargs):
        return Result.Ok({"assets": [{"filepath": str(tmp_path / 'o.png')}], "total": 1})

    monkeypatch.setattr(search_impl, "_require_services", _svc)
    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    monkeypatch.setattr(search_impl, "_touch_enrichment_pause", lambda *args, **kwargs: None)
    async def _out_root2(_svc):
        return str(tmp_path)

    monkeypatch.setattr(search_impl, "_runtime_output_root", _out_root2)
    monkeypatch.setattr(search_impl.folder_paths, "get_input_directory", lambda: str(tmp_path / "in"))
    async def _scan(*_args, **_kwargs):
        return None

    monkeypatch.setattr(search_impl, "_kickoff_background_scan", _scan)
    monkeypatch.setattr(search_impl, "_list_filesystem_assets", _fs)

    app = _build_search_app()
    req = make_mocked_request("GET", "/mjr/am/list?scope=output&q=*&offset=0", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    body = json.loads(resp.text)
    assert body.get("ok") is True
    assert (body.get("data") or {}).get("mode") == "filesystem"


@pytest.mark.asyncio
async def test_search_endpoint_success(monkeypatch) -> None:
    class _Index:
        async def search(self, *args, **kwargs):
            return Result.Ok({"assets": [{"filepath": "/x"}], "total": 1})

    async def _svc():
        return {"index": _Index()}, None

    monkeypatch.setattr(search_impl, "_require_services", _svc)
    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    monkeypatch.setattr(search_impl, "_touch_enrichment_pause", lambda *args, **kwargs: None)

    app = _build_search_app()
    req = make_mocked_request("GET", "/mjr/am/search?q=dog&include_total=0", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    assert json.loads(resp.text).get("ok") is True


@pytest.mark.asyncio
async def test_workflow_quick_success_and_query_error(monkeypatch) -> None:
    class _DB:
        async def aquery(self, _sql, _params):
            return Result.Ok([{"metadata_raw": '{"workflow": {"a":1}}', "has_workflow": True}])

    class _Index:
        db = _DB()

    async def _svc():
        return {"index": _Index()}, None

    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    monkeypatch.setattr(search_impl, "_require_services", _svc)

    app = _build_search_app()
    req1 = make_mocked_request("GET", "/mjr/am/workflow-quick?filename=x.png", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    assert json.loads(resp1.text).get("ok") is True

    class _DB2:
        async def aquery(self, _sql, _params):
            raise RuntimeError("boom")

    class _Index2:
        db = _DB2()

    async def _svc2():
        return {"index": _Index2()}, None

    monkeypatch.setattr(search_impl, "_require_services", _svc2)
    req2 = make_mocked_request("GET", "/mjr/am/workflow-quick?filename=x.png", app=app)
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    assert json.loads(resp2.text).get("code") == "QUERY_ERROR"


@pytest.mark.asyncio
async def test_get_asset_invalid_id_and_hydrate(monkeypatch) -> None:
    class _Index:
        async def get_asset(self, _aid):
            return Result.Ok({"id": 1, "filepath": "C:/x.png", "rating": 0, "tags": []})

    class _Meta:
        def extract_rating_tags_only(self, _fp):
            return Result.Ok({"rating": 5, "tags": ["t"]})

    class _DB:
        pass

    async def _svc():
        return {"index": _Index(), "metadata": _Meta(), "db": _DB()}, None

    monkeypatch.setattr(search_impl, "_require_services", _svc)
    monkeypatch.setattr(search_impl.MetadataHelpers, "write_asset_metadata_row", lambda *_args, **_kwargs: Result.Ok({}))

    app = _build_search_app()
    req1 = make_mocked_request("GET", "/mjr/am/asset/bad", app=app)
    req1._match_info = {"asset_id": "bad"}
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    assert json.loads(resp1.text).get("code") == "INVALID_INPUT"

    req2 = make_mocked_request("GET", "/mjr/am/asset/1?hydrate=rt", app=app)
    req2._match_info = {"asset_id": "1"}
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    assert json.loads(resp2.text).get("ok") is True

@pytest.mark.asyncio
async def test_list_all_fallback_merge_path(monkeypatch, tmp_path) -> None:
    class _Index:
        def __init__(self):
            self.calls = 0

        async def has_assets_under_root(self, _root):
            return Result.Ok(False)

        async def search_scoped(self, query, roots, limit, offset, filters=None, include_total=True, sort=None):
            _ = (query, roots, limit, filters, include_total, sort)
            self.calls += 1
            if offset == 0:
                return Result.Ok({"assets": [{"filepath": str(tmp_path / "o1.png"), "mtime": 20}], "total": 2})
            return Result.Ok({"assets": [{"filepath": str(tmp_path / "o2.png"), "mtime": 10}], "total": 2})

    idx = _Index()

    async def _svc():
        return {"index": idx}, None

    async def _fs(root_dir, subfolder, query, limit, offset, **kwargs):
        _ = (root_dir, subfolder, query, limit, kwargs)
        if offset == 0:
            return Result.Ok({"assets": [{"filepath": str(tmp_path / "i1.png"), "mtime": 15, "type": "input"}], "total": 2})
        return Result.Ok({"assets": [{"filepath": str(tmp_path / "i2.png"), "mtime": 5, "type": "input"}], "total": 2})

    async def _out_root(_svc):
        return str(tmp_path)

    async def _scan(*_args, **_kwargs):
        return None

    monkeypatch.setattr(search_impl, "_require_services", _svc)
    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    monkeypatch.setattr(search_impl, "_touch_enrichment_pause", lambda *args, **kwargs: None)
    monkeypatch.setattr(search_impl, "_runtime_output_root", _out_root)
    monkeypatch.setattr(search_impl.folder_paths, "get_input_directory", lambda: str(tmp_path / "in"))
    monkeypatch.setattr(search_impl, "_list_filesystem_assets", _fs)
    monkeypatch.setattr(search_impl, "_kickoff_background_scan", _scan)

    app = _build_search_app()
    req = make_mocked_request("GET", "/mjr/am/list?scope=all&limit=2&offset=0&sort=mtime_desc", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    body = json.loads(resp.text)
    assert body.get("ok") is True
    assert len((body.get("data") or {}).get("assets") or []) == 2


@pytest.mark.asyncio
async def test_list_all_limit_zero_path(monkeypatch, tmp_path) -> None:
    class _Index:
        async def has_assets_under_root(self, _root):
            return Result.Ok(False)

        async def search_scoped(self, *args, **kwargs):
            return Result.Ok({"assets": [], "total": 3})

    async def _svc():
        return {"index": _Index()}, None

    async def _fs(*_args, **_kwargs):
        return Result.Ok({"assets": [], "total": 4})

    async def _out_root(_svc):
        return str(tmp_path)

    monkeypatch.setattr(search_impl, "_require_services", _svc)
    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    monkeypatch.setattr(search_impl, "_touch_enrichment_pause", lambda *args, **kwargs: None)
    monkeypatch.setattr(search_impl, "_runtime_output_root", _out_root)
    monkeypatch.setattr(search_impl.folder_paths, "get_input_directory", lambda: str(tmp_path / "in"))
    monkeypatch.setattr(search_impl, "_list_filesystem_assets", _fs)

    app = _build_search_app()
    req = make_mocked_request("GET", "/mjr/am/list?scope=all&limit=0", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    data = json.loads(resp.text).get("data") or {}
    assert data.get("total") == 7


@pytest.mark.asyncio
async def test_list_custom_root_success_hybrid(monkeypatch, tmp_path) -> None:
    class _Index:
        pass

    async def _svc():
        return {"index": _Index()}, None

    async def _fs(*_args, **_kwargs):
        return Result.Ok({"assets": [{"filename": "f1", "filepath": str(tmp_path / 'f1.png')}], "total": 1})

    monkeypatch.setattr(search_impl, "_require_services", _svc)
    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    monkeypatch.setattr(search_impl, "_touch_enrichment_pause", lambda *args, **kwargs: None)
    monkeypatch.setattr(search_impl, "resolve_custom_root", lambda _rid: Result.Ok(tmp_path))
    monkeypatch.setattr(search_impl, "_list_filesystem_assets", _fs)

    browser_mod = __import__("mjr_am_backend.features.browser", fromlist=["list_visible_subfolders"])
    monkeypatch.setattr(browser_mod, "list_visible_subfolders", lambda *_args, **_kwargs: Result.Ok([{"filename": "folder", "kind": "folder"}]))

    app = _build_search_app()
    req = make_mocked_request("GET", "/mjr/am/list?scope=custom&custom_root_id=r1&offset=0", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    body = json.loads(resp.text)
    assert body.get("ok") is True
    assert (body.get("data") or {}).get("scope") == "custom"


@pytest.mark.asyncio
async def test_search_invalid_filters_more(monkeypatch) -> None:
    class _Index:
        async def search(self, *args, **kwargs):
            return Result.Ok({"assets": [], "total": 0})

    async def _svc():
        return {"index": _Index()}, None

    monkeypatch.setattr(search_impl, "_require_services", _svc)
    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    monkeypatch.setattr(search_impl, "_touch_enrichment_pause", lambda *args, **kwargs: None)

    app = _build_search_app()
    for q in [
        "/mjr/am/search?q=x&min_width=bad",
        "/mjr/am/search?q=x&min_height=bad",
        "/mjr/am/search?q=x&max_width=bad",
        "/mjr/am/search?q=x&max_height=bad",
        "/mjr/am/search?q=x&min_size_mb=bad",
    ]:
        req = make_mocked_request("GET", q, app=app)
        resp = await (await app.router.resolve(req)).handler(req)
        assert json.loads(resp.text).get("code") == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_list_invalid_date_and_offset(monkeypatch) -> None:
    class _Index:
        async def search_scoped(self, *args, **kwargs):
            return Result.Ok({"assets": [], "total": 0})

    async def _svc():
        return {"index": _Index()}, None

    monkeypatch.setattr(search_impl, "_require_services", _svc)
    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    monkeypatch.setattr(search_impl, "_touch_enrichment_pause", lambda *args, **kwargs: None)

    app = _build_search_app()
    req1 = make_mocked_request("GET", "/mjr/am/list?date_exact=bad", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    assert json.loads(resp1.text).get("code") == "INVALID_INPUT"

    req2 = make_mocked_request("GET", "/mjr/am/list?offset=99999999", app=app)
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    assert json.loads(resp2.text).get("code") == "INVALID_INPUT"

@pytest.mark.asyncio
async def test_autocomplete_invalid_limit_and_service_error(monkeypatch) -> None:
    async def _svc_err():
        return None, Result.Err("SERVICE_UNAVAILABLE", "x")

    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    monkeypatch.setattr(search_impl, "_require_services", _svc_err)
    monkeypatch.setattr(search_impl, "_touch_enrichment_pause", lambda *args, **kwargs: None)

    app = _build_search_app()
    req = make_mocked_request("GET", "/mjr/am/autocomplete?q=ca&limit=bad", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    assert json.loads(resp.text).get("code") == "SERVICE_UNAVAILABLE"


@pytest.mark.asyncio
async def test_list_input_fallback_filesystem(monkeypatch, tmp_path) -> None:
    class _Index:
        async def search_scoped(self, *args, **kwargs):
            return Result.Err("DB", "x")

    async def _svc():
        return {"index": _Index()}, None

    async def _fs(*_args, **_kwargs):
        return Result.Ok({"assets": [], "total": 0})

    async def _scan(*_args, **_kwargs):
        return None

    monkeypatch.setattr(search_impl, "_require_services", _svc)
    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    monkeypatch.setattr(search_impl, "_touch_enrichment_pause", lambda *args, **kwargs: None)
    monkeypatch.setattr(search_impl.folder_paths, "get_input_directory", lambda: str(tmp_path))
    monkeypatch.setattr(search_impl, "_list_filesystem_assets", _fs)
    monkeypatch.setattr(search_impl, "_kickoff_background_scan", _scan)

    app = _build_search_app()
    req = make_mocked_request("GET", "/mjr/am/list?scope=input&q=*&offset=0", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    assert json.loads(resp.text).get("ok") is True


@pytest.mark.asyncio
async def test_list_custom_folder_result_error(monkeypatch, tmp_path) -> None:
    async def _svc():
        return {"index": object()}, None

    async def _fs(*_args, **_kwargs):
        return Result.Ok({"assets": [], "total": 0})

    monkeypatch.setattr(search_impl, "_require_services", _svc)
    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    monkeypatch.setattr(search_impl, "_touch_enrichment_pause", lambda *args, **kwargs: None)
    monkeypatch.setattr(search_impl, "resolve_custom_root", lambda _rid: Result.Ok(tmp_path))
    monkeypatch.setattr(search_impl, "_list_filesystem_assets", _fs)

    browser_mod = __import__("mjr_am_backend.features.browser", fromlist=["list_visible_subfolders"])
    monkeypatch.setattr(browser_mod, "list_visible_subfolders", lambda *_args, **_kwargs: Result.Err("ERR", "x"))

    app = _build_search_app()
    req = make_mocked_request("GET", "/mjr/am/list?scope=custom&custom_root_id=r1", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    assert json.loads(resp.text).get("ok") is False


@pytest.mark.asyncio
async def test_list_all_indexed_scoped_error(monkeypatch, tmp_path) -> None:
    class _Index:
        async def has_assets_under_root(self, _root):
            return Result.Ok(True)

        async def search_scoped(self, *args, **kwargs):
            return Result.Err("DB", "x")

    async def _svc():
        return {"index": _Index()}, None

    async def _out_root(_svc):
        return str(tmp_path)

    monkeypatch.setattr(search_impl, "_require_services", _svc)
    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    monkeypatch.setattr(search_impl, "_touch_enrichment_pause", lambda *args, **kwargs: None)
    monkeypatch.setattr(search_impl, "_runtime_output_root", _out_root)
    monkeypatch.setattr(search_impl.folder_paths, "get_input_directory", lambda: str(tmp_path / "in"))

    app = _build_search_app()
    req = make_mocked_request("GET", "/mjr/am/list?scope=all", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    assert json.loads(resp.text).get("ok") is False


@pytest.mark.asyncio
async def test_list_all_limit_zero_error_paths(monkeypatch, tmp_path) -> None:
    class _Index:
        async def has_assets_under_root(self, _root):
            return Result.Ok(False)

        async def search_scoped(self, *args, **kwargs):
            return Result.Err("DB", "x")

    async def _svc():
        return {"index": _Index()}, None

    async def _out_root(_svc):
        return str(tmp_path)

    monkeypatch.setattr(search_impl, "_require_services", _svc)
    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    monkeypatch.setattr(search_impl, "_touch_enrichment_pause", lambda *args, **kwargs: None)
    monkeypatch.setattr(search_impl, "_runtime_output_root", _out_root)
    monkeypatch.setattr(search_impl.folder_paths, "get_input_directory", lambda: str(tmp_path / "in"))

    app = _build_search_app()
    req = make_mocked_request("GET", "/mjr/am/list?scope=all&limit=0", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    assert json.loads(resp.text).get("ok") is False


@pytest.mark.asyncio
async def test_list_output_out_res_error(monkeypatch, tmp_path) -> None:
    class _Index:
        async def search_scoped(self, *args, **kwargs):
            return Result.Err("DB", "x")

    async def _svc():
        return {"index": _Index()}, None

    async def _out_root(_svc):
        return str(tmp_path)

    monkeypatch.setattr(search_impl, "_require_services", _svc)
    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    monkeypatch.setattr(search_impl, "_touch_enrichment_pause", lambda *args, **kwargs: None)
    monkeypatch.setattr(search_impl, "_runtime_output_root", _out_root)
    monkeypatch.setattr(search_impl.folder_paths, "get_input_directory", lambda: str(tmp_path / "in"))

    app = _build_search_app()
    req = make_mocked_request("GET", "/mjr/am/list?scope=output&q=abc", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    assert json.loads(resp.text).get("ok") is False


@pytest.mark.asyncio
async def test_search_service_error_and_offset_guard(monkeypatch) -> None:
    async def _svc_err():
        return None, Result.Err("SERVICE_UNAVAILABLE", "x")

    monkeypatch.setattr(search_impl, "_require_services", _svc_err)
    app = _build_search_app()
    req1 = make_mocked_request("GET", "/mjr/am/search?q=x", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    assert json.loads(resp1.text).get("code") == "SERVICE_UNAVAILABLE"

    class _Index:
        async def search(self, *args, **kwargs):
            return Result.Ok({"assets": [], "total": 0})

    async def _svc_ok():
        return {"index": _Index()}, None

    monkeypatch.setattr(search_impl, "_require_services", _svc_ok)
    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    monkeypatch.setattr(search_impl, "_touch_enrichment_pause", lambda *args, **kwargs: None)
    req2 = make_mocked_request("GET", "/mjr/am/search?q=x&offset=99999999", app=app)
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    assert json.loads(resp2.text).get("code") == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_assets_batch_more_paths(monkeypatch) -> None:
    async def _svc_err():
        return None, Result.Err("SERVICE_UNAVAILABLE", "x")

    monkeypatch.setattr(search_impl, "_require_services", _svc_err)
    app = _build_search_app()
    req1 = make_mocked_request("POST", "/mjr/am/assets/batch", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    assert json.loads(resp1.text).get("code") == "SERVICE_UNAVAILABLE"

    class _Index:
        async def get_assets_batch(self, ids):
            return Result.Ok({"ids": ids})

    async def _svc_ok():
        return {"index": _Index()}, None

    async def _read_err(_req, **_kwargs):
        return Result.Err("INVALID_JSON", "x")

    monkeypatch.setattr(search_impl, "_require_services", _svc_ok)
    monkeypatch.setattr(search_impl, "_read_json", _read_err)
    req2 = make_mocked_request("POST", "/mjr/am/assets/batch", app=app)
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    assert json.loads(resp2.text).get("code") == "INVALID_JSON"


@pytest.mark.asyncio
async def test_workflow_quick_rate_and_service_error(monkeypatch) -> None:
    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (False, 1))
    app = _build_search_app()
    req1 = make_mocked_request("GET", "/mjr/am/workflow-quick?filename=x", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    assert json.loads(resp1.text).get("code") == "RATE_LIMITED"

    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (True, None))

    async def _svc_err():
        return None, Result.Err("SERVICE_UNAVAILABLE", "x")

    monkeypatch.setattr(search_impl, "_require_services", _svc_err)
    req2 = make_mocked_request("GET", "/mjr/am/workflow-quick?filename=x", app=app)
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    assert json.loads(resp2.text).get("code") == "SERVICE_UNAVAILABLE"


@pytest.mark.asyncio
async def test_get_asset_not_found_and_hydrate_timeout(monkeypatch) -> None:
    class _Index:
        async def get_asset(self, _aid):
            return Result.Ok({"id": 1, "filepath": "C:/x.png", "rating": 0, "tags": "[]"})

    class _Meta:
        def extract_rating_tags_only(self, _fp):
            return Result.Ok({"rating": 2, "tags": ["a"]})

    class _DB:
        pass

    async def _svc():
        return {"index": _Index(), "metadata": _Meta(), "db": _DB()}, None

    monkeypatch.setattr(search_impl, "_require_services", _svc)

    async def _wait_for(awaitable, *args, **kwargs):
        try:
            # Close the created coroutine to avoid "was never awaited" warning in test path.
            close = getattr(awaitable, "close", None)
            if callable(close):
                close()
        except Exception:
            pass
        raise asyncio.TimeoutError()

    monkeypatch.setattr(search_impl.asyncio, "wait_for", _wait_for)

    app = _build_search_app()
    req = make_mocked_request("GET", "/mjr/am/asset/1?hydrate=rt", app=app)
    req._match_info = {"asset_id": "1"}
    resp = await (await app.router.resolve(req)).handler(req)
    assert json.loads(resp.text).get("ok") is True

@pytest.mark.asyncio
async def test_list_invalid_filters_matrix(monkeypatch) -> None:
    class _Index:
        async def search_scoped(self, *args, **kwargs):
            return Result.Ok({"assets": [], "total": 0})

    async def _svc():
        return {"index": _Index()}, None

    monkeypatch.setattr(search_impl, "_require_services", _svc)
    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    monkeypatch.setattr(search_impl, "_touch_enrichment_pause", lambda *args, **kwargs: None)

    app = _build_search_app()
    bad_qs = [
        "/mjr/am/list?kind=bad",
        "/mjr/am/list?min_rating=bad",
        "/mjr/am/list?min_size_mb=bad",
        "/mjr/am/list?max_size_mb=bad",
        "/mjr/am/list?min_width=bad",
        "/mjr/am/list?min_height=bad",
        "/mjr/am/list?max_width=bad",
        "/mjr/am/list?max_height=bad",
        "/mjr/am/list?date_range=bad",
    ]
    for q in bad_qs:
        req = make_mocked_request("GET", q, app=app)
        resp = await (await app.router.resolve(req)).handler(req)
        assert json.loads(resp.text).get("code") == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_list_rate_and_invalid_limit_offset(monkeypatch) -> None:
    async def _svc():
        return {"index": object()}, None

    monkeypatch.setattr(search_impl, "_require_services", _svc)
    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (False, 5))

    app = _build_search_app()
    req1 = make_mocked_request("GET", "/mjr/am/list", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    assert json.loads(resp1.text).get("code") == "RATE_LIMITED"

    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    req2 = make_mocked_request("GET", "/mjr/am/list?limit=x&offset=y", app=app)
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    assert json.loads(resp2.text).get("code") == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_list_output_success_non_initial(monkeypatch, tmp_path) -> None:
    class _Index:
        async def search_scoped(self, *args, **kwargs):
            return Result.Ok({"assets": [{"filepath": str(tmp_path / 'a.png')}], "total": 1})

    async def _svc():
        return {"index": _Index()}, None

    async def _out_root(_svc):
        return str(tmp_path)

    monkeypatch.setattr(search_impl, "_require_services", _svc)
    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    monkeypatch.setattr(search_impl, "_touch_enrichment_pause", lambda *args, **kwargs: None)
    monkeypatch.setattr(search_impl, "_runtime_output_root", _out_root)
    monkeypatch.setattr(search_impl.folder_paths, "get_input_directory", lambda: str(tmp_path / "in"))

    app = _build_search_app()
    req = make_mocked_request("GET", "/mjr/am/list?scope=output&q=something", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    assert json.loads(resp.text).get("ok") is True


@pytest.mark.asyncio
async def test_search_invalid_filters_matrix(monkeypatch) -> None:
    class _Index:
        async def search(self, *args, **kwargs):
            return Result.Ok({"assets": [], "total": 0})

    async def _svc():
        return {"index": _Index()}, None

    monkeypatch.setattr(search_impl, "_require_services", _svc)
    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    monkeypatch.setattr(search_impl, "_touch_enrichment_pause", lambda *args, **kwargs: None)

    app = _build_search_app()
    bad_qs = [
        "/mjr/am/search?kind=bad",
        "/mjr/am/search?min_rating=bad",
        "/mjr/am/search?min_size_mb=bad",
        "/mjr/am/search?max_size_mb=bad",
        "/mjr/am/search?min_width=bad",
        "/mjr/am/search?min_height=bad",
        "/mjr/am/search?max_width=bad",
        "/mjr/am/search?max_height=bad",
    ]
    for q in bad_qs:
        req = make_mocked_request("GET", q, app=app)
        resp = await (await app.router.resolve(req)).handler(req)
        assert json.loads(resp.text).get("code") == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_workflow_quick_no_workflow_and_get_asset_not_found(monkeypatch) -> None:
    class _DB:
        async def aquery(self, _sql, _params):
            return Result.Ok([{"metadata_raw": "{}", "has_workflow": False}])

    class _Index:
        db = _DB()

        async def get_asset(self, _aid):
            return Result.Err("NOT_FOUND", "x")

    async def _svc():
        return {"index": _Index()}, None

    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    monkeypatch.setattr(search_impl, "_require_services", _svc)

    app = _build_search_app()
    req1 = make_mocked_request("GET", "/mjr/am/workflow-quick?filename=x.png", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    assert json.loads(resp1.text).get("workflow") is None

    req2 = make_mocked_request("GET", "/mjr/am/asset/1", app=app)
    req2._match_info = {"asset_id": "1"}
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    assert json.loads(resp2.text).get("ok") is False


@pytest.mark.asyncio
async def test_get_asset_hydrate_outer_exception_swallow(monkeypatch) -> None:
    class _Index:
        async def get_asset(self, _aid):
            return Result.Ok({"id": 1, "filepath": "C:/x.png", "rating": 0, "tags": []})

    async def _svc():
        return {"index": _Index(), "metadata": object(), "db": object()}, None

    monkeypatch.setattr(search_impl, "_require_services", _svc)

    app = _build_search_app()
    req = make_mocked_request("GET", "/mjr/am/asset/1?hydrate=rt", app=app)
    req._match_info = {"asset_id": "1"}
    resp = await (await app.router.resolve(req)).handler(req)
    assert json.loads(resp.text).get("ok") is True

@pytest.mark.asyncio
async def test_list_valid_filters_and_clamps(monkeypatch, tmp_path) -> None:
    class _Index:
        async def search_scoped(self, *args, **kwargs):
            return Result.Ok({"assets": [{"filepath": str(tmp_path / 'a.png')}], "total": 1})

    async def _svc():
        return {"index": _Index()}, None

    async def _out_root(_svc):
        return str(tmp_path)

    monkeypatch.setattr(search_impl, "_require_services", _svc)
    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    monkeypatch.setattr(search_impl, "_touch_enrichment_pause", lambda *args, **kwargs: None)
    monkeypatch.setattr(search_impl, "_runtime_output_root", _out_root)
    monkeypatch.setattr(search_impl.folder_paths, "get_input_directory", lambda: str(tmp_path / "in"))

    app = _build_search_app()
    q = "/mjr/am/list?scope=output&kind=image&min_size_mb=2&max_size_mb=1&min_width=100&max_width=10&min_height=50&max_height=5&workflow_type=abc&has_workflow=1&date_exact=2026-01-01&q=ext:png dog"
    req = make_mocked_request("GET", q, app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    assert json.loads(resp.text).get("ok") is True


@pytest.mark.asyncio
async def test_list_custom_query_filtering_lines(monkeypatch, tmp_path) -> None:
    async def _svc():
        return {"index": object()}, None

    async def _fs(*_args, **_kwargs):
        return Result.Ok({"assets": [{"filename": "cat.png", "filepath": str(tmp_path / 'cat.png')}], "total": 1})

    monkeypatch.setattr(search_impl, "_require_services", _svc)
    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    monkeypatch.setattr(search_impl, "_touch_enrichment_pause", lambda *args, **kwargs: None)
    monkeypatch.setattr(search_impl, "resolve_custom_root", lambda _rid: Result.Ok(tmp_path))
    monkeypatch.setattr(search_impl, "_list_filesystem_assets", _fs)

    browser_mod = __import__("mjr_am_backend.features.browser", fromlist=["list_visible_subfolders"])
    monkeypatch.setattr(browser_mod, "list_visible_subfolders", lambda *_args, **_kwargs: Result.Ok([{"filename": "dogfolder", "kind": "folder"}]))

    app = _build_search_app()
    req = make_mocked_request("GET", "/mjr/am/list?scope=custom&custom_root_id=r1&q=dog&kind=image", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    assert json.loads(resp.text).get("ok") is True


@pytest.mark.asyncio
async def test_list_all_indexed_unknown_source_type_infer(monkeypatch, tmp_path) -> None:
    class _Index:
        async def has_assets_under_root(self, _root):
            return Result.Ok(True)

        async def search_scoped(self, *args, **kwargs):
            return Result.Ok({"assets": [{"filepath": str(tmp_path / 'in' / 'x.png'), "source": ""}], "total": 1})

    async def _svc():
        return {"index": _Index()}, None

    async def _out_root(_svc):
        return str(tmp_path / "out")

    in_dir = tmp_path / "in"
    in_dir.mkdir(exist_ok=True)

    monkeypatch.setattr(search_impl, "_require_services", _svc)
    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    monkeypatch.setattr(search_impl, "_touch_enrichment_pause", lambda *args, **kwargs: None)
    monkeypatch.setattr(search_impl, "_runtime_output_root", _out_root)
    monkeypatch.setattr(search_impl.folder_paths, "get_input_directory", lambda: str(in_dir))

    app = _build_search_app()
    req = make_mocked_request("GET", "/mjr/am/list?scope=all", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    assert json.loads(resp.text).get("ok") is True


@pytest.mark.asyncio
async def test_search_valid_filters_and_clamps(monkeypatch) -> None:
    class _Index:
        async def search(self, *args, **kwargs):
            return Result.Ok({"assets": [{"filepath": "/x"}], "total": 1})

    async def _svc():
        return {"index": _Index()}, None

    monkeypatch.setattr(search_impl, "_require_services", _svc)
    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    monkeypatch.setattr(search_impl, "_touch_enrichment_pause", lambda *args, **kwargs: None)

    app = _build_search_app()
    q = "/mjr/am/search?q=kind:image rating:3 cat&kind=image&min_size_mb=2&max_size_mb=1&min_width=100&max_width=10&min_height=50&max_height=5&workflow_type=abc&has_workflow=1"
    req = make_mocked_request("GET", q, app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    assert json.loads(resp.text).get("ok") is True


@pytest.mark.asyncio
async def test_assets_batch_limit_break(monkeypatch) -> None:
    captured = {"n": 0}

    class _Index:
        async def get_assets_batch(self, ids):
            captured["n"] = len(ids)
            return Result.Ok({"assets": []})

    async def _svc():
        return {"index": _Index()}, None

    async def _read_json(_req, **_kwargs):
        return Result.Ok({"asset_ids": list(range(1, 400))})

    monkeypatch.setattr(search_impl, "_require_services", _svc)
    monkeypatch.setattr(search_impl, "_read_json", _read_json)

    app = _build_search_app()
    req = make_mocked_request("POST", "/mjr/am/assets/batch", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    assert json.loads(resp.text).get("ok") is True
    assert captured["n"] == search_impl.SEARCH_MAX_BATCH_IDS


@pytest.mark.asyncio
async def test_workflow_quick_root_id_and_bad_json(monkeypatch) -> None:
    class _DB:
        async def aquery(self, _sql, _params):
            return Result.Ok([{"metadata_raw": "{bad", "has_workflow": True}])

    class _Index:
        db = _DB()

    async def _svc():
        return {"index": _Index()}, None

    monkeypatch.setattr(search_impl, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    monkeypatch.setattr(search_impl, "_require_services", _svc)

    app = _build_search_app()
    req = make_mocked_request("GET", "/mjr/am/workflow-quick?filename=x.png&root_id=r1", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    assert json.loads(resp.text).get("workflow") is None
