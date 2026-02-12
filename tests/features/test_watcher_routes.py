import json

import pytest
from aiohttp import web
from aiohttp.test_utils import TestClient, TestServer

from backend.routes.handlers.scan import register_scan_routes

@pytest.mark.asyncio
async def test_watcher_scope_returns_ok_without_watcher(monkeypatch):
    import backend.routes.handlers.scan as scan_mod

    async def _mock_require_services():
        return ({"watcher": None, "db": None}, None)

    monkeypatch.setattr(scan_mod, "_require_services", _mock_require_services)

    routes = web.RouteTableDef()
    register_scan_routes(routes)
    app = web.Application()
    app.add_routes(routes)

    client = TestClient(TestServer(app))
    await client.start_server()
    try:
        resp = await client.post(
            "/mjr/am/watcher/scope",
            data=json.dumps({"scope": "output"}),
            headers={"Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest"},
        )
        payload = await resp.json()
        assert payload["ok"] is True, payload
        assert payload["data"]["enabled"] is False
    finally:
        await client.close()


@pytest.mark.asyncio
async def test_watcher_scope_forces_output_only(monkeypatch):
    import backend.routes.handlers.scan as scan_mod

    services = {"watcher": None, "db": None}

    async def _mock_require_services():
        return (services, None)

    monkeypatch.setattr(scan_mod, "_require_services", _mock_require_services)

    routes = web.RouteTableDef()
    register_scan_routes(routes)
    app = web.Application()
    app.add_routes(routes)

    client = TestClient(TestServer(app))
    await client.start_server()
    try:
        resp = await client.post(
            "/mjr/am/watcher/scope",
            data=json.dumps({"scope": "all", "custom_root_id": "abc123"}),
            headers={"Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest"},
        )
        payload = await resp.json()
        assert payload["ok"] is True, payload
        assert payload["data"]["scope"] == "output"
        assert services["watcher_scope"]["scope"] == "output"
        assert services["watcher_scope"]["custom_root_id"] == ""
    finally:
        await client.close()


@pytest.mark.asyncio
async def test_watcher_toggle_requires_index(monkeypatch):
    import backend.routes.handlers.scan as scan_mod

    async def _mock_require_services():
        return ({"watcher": None}, None)

    monkeypatch.setattr(scan_mod, "_require_services", _mock_require_services)

    routes = web.RouteTableDef()
    register_scan_routes(routes)
    app = web.Application()
    app.add_routes(routes)

    client = TestClient(TestServer(app))
    await client.start_server()
    try:
        resp = await client.post(
            "/mjr/am/watcher/toggle",
            data=json.dumps({"enabled": True}),
            headers={"Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest"},
        )
        payload = await resp.json()
        assert payload["ok"] is False, payload
        assert payload.get("code") == "SERVICE_UNAVAILABLE"
    finally:
        await client.close()


@pytest.mark.asyncio
async def test_watcher_flush_calls_flush_pending(monkeypatch):
    import backend.routes.handlers.scan as scan_mod

    class _WatcherStub:
        is_running = True

        def __init__(self):
            self.calls = 0

        def flush_pending(self):
            self.calls += 1
            return True

    watcher = _WatcherStub()

    async def _mock_require_services():
        return ({"watcher": watcher}, None)

    monkeypatch.setattr(scan_mod, "_require_services", _mock_require_services)

    routes = web.RouteTableDef()
    register_scan_routes(routes)
    app = web.Application()
    app.add_routes(routes)

    client = TestClient(TestServer(app))
    await client.start_server()
    try:
        resp = await client.post(
            "/mjr/am/watcher/flush",
            data=json.dumps({}),
            headers={"Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest"},
        )
        payload = await resp.json()
        assert payload["ok"] is True, payload
        assert payload["data"]["enabled"] is True
        assert payload["data"]["flushed"] is True
        assert watcher.calls == 1
    finally:
        await client.close()
