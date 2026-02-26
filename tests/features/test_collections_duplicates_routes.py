import json
from pathlib import Path
from types import SimpleNamespace

import pytest
from aiohttp import web
from aiohttp.test_utils import make_mocked_request

from mjr_am_backend.routes.handlers import collections as collections_mod
from mjr_am_backend.routes.handlers import duplicates as duplicates_mod
from mjr_am_backend.shared import Result


def _app_with(register_fn):
    app = web.Application()
    routes = web.RouteTableDef()
    register_fn(routes)
    app.add_routes(routes)
    return app


def _ok_write(_request):
    return Result.Ok({})


@pytest.mark.asyncio
async def test_collections_create_csrf_short_circuit(monkeypatch) -> None:
    app = _app_with(collections_mod.register_collections_routes)
    monkeypatch.setattr(collections_mod, "_csrf_error", lambda _request: "bad")

    req = make_mocked_request("POST", "/mjr/am/collections", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)

    assert payload.get("ok") is False
    assert payload.get("code") == "CSRF"


@pytest.mark.asyncio
async def test_collections_list_handles_internal_exception(monkeypatch) -> None:
    class _FailSvc:
        def list(self):
            raise RuntimeError("boom")

    app = _app_with(collections_mod.register_collections_routes)
    monkeypatch.setattr(collections_mod, "_collections", _FailSvc())

    req = make_mocked_request("GET", "/mjr/am/collections", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)

    assert payload.get("ok") is False
    assert payload.get("code") == "COLLECTIONS_FAILED"


@pytest.mark.asyncio
async def test_collections_add_filters_invalid_assets(monkeypatch) -> None:
    captured = {}

    class _Svc:
        def add_assets(self, cid, assets):
            captured["cid"] = cid
            captured["assets"] = assets
            return Result.Ok({"count": len(assets)})

    async def _read_json(_request):
        return Result.Ok(
            {
                "assets": [
                    {"filepath": "  "},
                    {"filepath": "C:/ok/a.png", "kind": "image"},
                    "bad",
                    {},
                ]
            }
        )

    app = _app_with(collections_mod.register_collections_routes)
    monkeypatch.setattr(collections_mod, "_collections", _Svc())
    monkeypatch.setattr(collections_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(collections_mod, "_require_write_access", _ok_write)
    monkeypatch.setattr(collections_mod, "_read_json", _read_json)

    req = make_mocked_request("POST", "/mjr/am/collections/c1/add", app=app)
    req._match_info = {"collection_id": "c1"}
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)

    assert payload.get("ok") is True
    assert captured["cid"] == "c1"
    assert len(captured["assets"]) == 1
    assert captured["assets"][0]["filepath"] == "C:/ok/a.png"


@pytest.mark.asyncio
async def test_collections_get_assets_enriches_index_fields(monkeypatch, tmp_path: Path) -> None:
    fp = str(tmp_path / "x.png")

    class _Svc:
        def get(self, cid):
            _ = cid
            return Result.Ok({"name": "A", "items": [{"filepath": fp, "type": "output"}]})

    class _Index:
        async def lookup_assets_by_filepaths(self, filepaths):
            assert filepaths == [fp]
            return Result.Ok(
                {
                    fp: {
                        "id": 7,
                        "rating": 4,
                        "tags": ["t1"],
                        "has_workflow": True,
                        "has_generation_data": False,
                        "root_id": "r1",
                    }
                }
            )

    async def _require_services():
        return {"index": _Index()}, None

    app = _app_with(collections_mod.register_collections_routes)
    monkeypatch.setattr(collections_mod, "_collections", _Svc())
    monkeypatch.setattr(collections_mod, "_require_services", _require_services)

    req = make_mocked_request("GET", "/mjr/am/collections/c1/assets", app=app)
    req._match_info = {"collection_id": "c1"}
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)

    assert payload.get("ok") is True
    assets = payload.get("data", {}).get("assets", [])
    assert len(assets) == 1
    assert assets[0]["id"] == 7
    assert assets[0]["rating"] == 4
    assert assets[0]["root_id"] == "r1"


@pytest.mark.asyncio
async def test_collections_get_assets_tolerates_enrichment_failure(monkeypatch) -> None:
    class _Svc:
        def get(self, cid):
            _ = cid
            return Result.Ok({"name": "A", "items": [{"filepath": "C:/x.png"}]})

    async def _boom_services():
        raise RuntimeError("skip")

    app = _app_with(collections_mod.register_collections_routes)
    monkeypatch.setattr(collections_mod, "_collections", _Svc())
    monkeypatch.setattr(collections_mod, "_require_services", _boom_services)

    req = make_mocked_request("GET", "/mjr/am/collections/c1/assets", app=app)
    req._match_info = {"collection_id": "c1"}
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)

    assert payload.get("ok") is True
    assert len(payload.get("data", {}).get("assets", [])) == 1


def test_duplicates_roots_for_scope_variants(monkeypatch, tmp_path: Path) -> None:
    out_root = tmp_path / "out"
    in_root = tmp_path / "in"
    out_root.mkdir()
    in_root.mkdir()

    monkeypatch.setattr(duplicates_mod, "get_runtime_output_root", lambda: str(out_root))
    monkeypatch.setattr(
        duplicates_mod,
        "folder_paths",
        SimpleNamespace(get_input_directory=lambda: str(in_root)),
    )
    monkeypatch.setattr(duplicates_mod, "resolve_custom_root", lambda _cid: Result.Ok(str(tmp_path / "custom")))

    assert duplicates_mod._roots_for_scope("output").ok is True
    assert duplicates_mod._roots_for_scope("input").ok is True
    all_res = duplicates_mod._roots_for_scope("all")
    assert all_res.ok is True
    assert len(all_res.data) == 2
    assert duplicates_mod._roots_for_scope("custom", "r1").ok is True
    assert duplicates_mod._roots_for_scope("weird").code == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_duplicates_status_service_unavailable(monkeypatch) -> None:
    async def _require_services():
        return {}, None

    app = _app_with(duplicates_mod.register_duplicates_routes)
    monkeypatch.setattr(duplicates_mod, "is_db_maintenance_active", lambda: False)
    monkeypatch.setattr(duplicates_mod, "_require_services", _require_services)

    req = make_mocked_request("GET", "/mjr/am/duplicates/status", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)

    assert payload.get("code") == "SERVICE_UNAVAILABLE"


@pytest.mark.asyncio
async def test_duplicates_analyze_uses_default_limit_on_bad_input(monkeypatch) -> None:
    captured = {}

    class _Dup:
        async def start_background_analysis(self, limit=250):
            captured["limit"] = limit
            return Result.Ok({"started": True})

    async def _require_services():
        return {"duplicates": _Dup()}, None

    async def _read_json(_request):
        return Result.Ok({"limit": "abc"})

    app = _app_with(duplicates_mod.register_duplicates_routes)
    monkeypatch.setattr(duplicates_mod, "is_db_maintenance_active", lambda: False)
    monkeypatch.setattr(duplicates_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(duplicates_mod, "_require_write_access", _ok_write)
    monkeypatch.setattr(duplicates_mod, "_require_services", _require_services)
    monkeypatch.setattr(duplicates_mod, "_read_json", _read_json)

    req = make_mocked_request("POST", "/mjr/am/duplicates/analyze", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)

    assert payload.get("ok") is True
    assert captured["limit"] == 250


@pytest.mark.asyncio
async def test_duplicates_alerts_invalid_scope(monkeypatch) -> None:
    class _Dup:
        async def get_alerts(self, **kwargs):
            _ = kwargs
            return Result.Ok({})

    async def _require_services():
        return {"duplicates": _Dup()}, None

    app = _app_with(duplicates_mod.register_duplicates_routes)
    monkeypatch.setattr(duplicates_mod, "is_db_maintenance_active", lambda: False)
    monkeypatch.setattr(duplicates_mod, "_require_services", _require_services)

    req = make_mocked_request("GET", "/mjr/am/duplicates/alerts?scope=bad", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)

    assert payload.get("ok") is False
    assert payload.get("code") == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_duplicates_alerts_resetting_maps_to_maintenance(monkeypatch) -> None:
    class _Dup:
        async def get_alerts(self, **kwargs):
            _ = kwargs
            raise RuntimeError("database resetting")

    async def _require_services():
        return {"duplicates": _Dup()}, None

    monkeypatch.setattr(duplicates_mod, "is_db_maintenance_active", lambda: False)
    monkeypatch.setattr(duplicates_mod, "_require_services", _require_services)
    monkeypatch.setattr(duplicates_mod, "get_runtime_output_root", lambda: "C:/out")

    app = _app_with(duplicates_mod.register_duplicates_routes)
    req = make_mocked_request("GET", "/mjr/am/duplicates/alerts?scope=output", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)

    assert payload.get("ok") is False
    assert payload.get("code") == "DB_MAINTENANCE"


@pytest.mark.asyncio
async def test_duplicates_merge_tags_validates_inputs(monkeypatch) -> None:
    async def _require_services():
        return {"duplicates": object()}, None

    async def _read_json_bad_keep(_request):
        return Result.Ok({"keep_asset_id": "x", "merge_asset_ids": [1, 2]})

    async def _read_json_bad_list(_request):
        return Result.Ok({"keep_asset_id": 1, "merge_asset_ids": "x"})

    app = _app_with(duplicates_mod.register_duplicates_routes)
    monkeypatch.setattr(duplicates_mod, "is_db_maintenance_active", lambda: False)
    monkeypatch.setattr(duplicates_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(duplicates_mod, "_require_write_access", _ok_write)
    monkeypatch.setattr(duplicates_mod, "_require_services", _require_services)

    monkeypatch.setattr(duplicates_mod, "_read_json", _read_json_bad_keep)
    req1 = make_mocked_request("POST", "/mjr/am/duplicates/merge-tags", app=app)
    match1 = await app.router.resolve(req1)
    resp1 = await match1.handler(req1)
    payload1 = json.loads(resp1.text)
    assert payload1.get("code") == "INVALID_INPUT"

    monkeypatch.setattr(duplicates_mod, "_read_json", _read_json_bad_list)
    req2 = make_mocked_request("POST", "/mjr/am/duplicates/merge-tags", app=app)
    match2 = await app.router.resolve(req2)
    resp2 = await match2.handler(req2)
    payload2 = json.loads(resp2.text)
    assert payload2.get("code") == "INVALID_INPUT"
