import json
from types import SimpleNamespace

import pytest
from aiohttp import web
from aiohttp.test_utils import make_mocked_request

from mjr_am_backend.routes.handlers import scan as scan_mod
from mjr_am_backend.shared import Result


def _build_scan_app() -> web.Application:
    app = web.Application()
    routes = web.RouteTableDef()
    scan_mod.register_scan_routes(routes)
    app.add_routes(routes)
    return app


def _common_scan_monkeypatch(monkeypatch, *, svc: dict | None = None, body: dict | None = None):
    async def _require_services():
        return (svc or {"index": object()}), None

    async def _read_json(_request):
        return Result.Ok(body or {})

    monkeypatch.setattr(scan_mod, "_require_services", _require_services)
    monkeypatch.setattr(scan_mod, "_read_json", _read_json)
    monkeypatch.setattr(scan_mod, "is_db_maintenance_active", lambda: False)
    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "_check_rate_limit", lambda *args, **kwargs: (True, None))


@pytest.mark.asyncio
async def test_scan_route_rejects_unknown_scope(monkeypatch) -> None:
    _common_scan_monkeypatch(monkeypatch, body={"scope": "weird"})
    async def _runtime_output_root(_svc):
        return "/tmp"
    monkeypatch.setattr(scan_mod, "_runtime_output_root", _runtime_output_root)

    app = _build_scan_app()
    req = make_mocked_request("POST", "/mjr/am/scan", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is False
    assert payload.get("code") == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_scan_route_rate_limited(monkeypatch) -> None:
    _common_scan_monkeypatch(monkeypatch, body={"scope": "output"})
    monkeypatch.setattr(scan_mod, "_check_rate_limit", lambda *args, **kwargs: (False, 12))
    monkeypatch.setattr(scan_mod, "_runtime_output_root", lambda _svc: "/tmp")

    app = _build_scan_app()
    req = make_mocked_request("POST", "/mjr/am/scan", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is False
    assert payload.get("code") == "RATE_LIMITED"


@pytest.mark.asyncio
async def test_scan_route_scope_all_timeout(monkeypatch) -> None:
    class _Index:
        async def scan_directory(self, *args, **kwargs):
            return Result.Ok({"scanned": 0, "added": 0, "updated": 0, "skipped": 0, "errors": 0})

    async def _raise_timeout(*args, **kwargs):
        raise asyncio.TimeoutError()

    import asyncio

    _common_scan_monkeypatch(monkeypatch, svc={"index": _Index()}, body={"scope": "all"})
    async def _runtime_output_root(_svc):
        return "/tmp"
    monkeypatch.setattr(scan_mod, "_runtime_output_root", _runtime_output_root)
    monkeypatch.setattr(scan_mod.asyncio, "wait_for", _raise_timeout)

    app = _build_scan_app()
    req = make_mocked_request("POST", "/mjr/am/scan", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is False
    assert payload.get("code") == "TIMEOUT"


@pytest.mark.asyncio
async def test_watcher_settings_get_degraded_on_exception(monkeypatch) -> None:
    async def _require_services():
        return {"watcher": None}, None

    monkeypatch.setattr(scan_mod, "_require_services", _require_services)

    def _boom():
        raise RuntimeError("x")

    monkeypatch.setattr(scan_mod, "get_watcher_settings", _boom)

    app = _build_scan_app()
    req = make_mocked_request("GET", "/mjr/am/watcher/settings", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is False
    assert payload.get("code") == "DEGRADED"


@pytest.mark.asyncio
async def test_watcher_settings_update_rejects_invalid_int(monkeypatch) -> None:
    async def _require_services():
        return {"watcher": None}, None

    async def _read_json(_request):
        return Result.Ok({"debounce_ms": "nope"})

    monkeypatch.setattr(scan_mod, "_require_services", _require_services)
    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "_read_json", _read_json)

    app = _build_scan_app()
    req = make_mocked_request("POST", "/mjr/am/watcher/settings", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is False
    assert payload.get("code") == "INVALID_INPUT"
