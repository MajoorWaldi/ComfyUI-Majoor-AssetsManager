import datetime
import json

import pytest
from aiohttp import web
from aiohttp.test_utils import make_mocked_request

from mjr_am_backend.routes.handlers import calendar as cal_mod
from mjr_am_backend.routes.handlers import metadata as meta_mod
from mjr_am_backend.routes.handlers import releases as rel_mod
from mjr_am_backend.shared import Result


def _app_with(register_fn):
    app = web.Application()
    routes = web.RouteTableDef()
    register_fn(routes)
    app.add_routes(routes)
    return app


@pytest.mark.asyncio
async def test_releases_route_success_with_fake_github(monkeypatch) -> None:
    class _Resp:
        def __init__(self, payload):
            self.status = 200
            self._payload = payload

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def json(self):
            return self._payload

        async def text(self):
            return "ok"

    class _Session:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        def get(self, url, headers=None, timeout=None):
            _ = (headers, timeout)
            if url.endswith("/tags?per_page=100"):
                return _Resp([{"name": "v1"}])
            return _Resp([{"name": "main"}])

    monkeypatch.setattr(rel_mod, "ClientSession", lambda: _Session())

    app = _app_with(rel_mod.register_releases_routes)
    req = make_mocked_request("GET", "/mjr/am/releases", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)
    assert body.get("ok") is True
    data = body.get("data") or {}
    assert data.get("tags") == ["v1"]
    assert data.get("branches") == ["main"]


@pytest.mark.asyncio
async def test_calendar_invalid_month_and_scope(monkeypatch) -> None:
    async def _require_services():
        return {"index": object()}, None

    monkeypatch.setattr(cal_mod, "_require_services", _require_services)

    app = _app_with(cal_mod.register_calendar_routes)
    req = make_mocked_request("GET", "/mjr/am/date-histogram?month=bad", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)
    assert body.get("code") == "INVALID_INPUT"

    req2 = make_mocked_request("GET", "/mjr/am/date-histogram?month=2026-01&scope=zzz", app=app)
    match2 = await app.router.resolve(req2)
    resp2 = await match2.handler(req2)
    body2 = json.loads(resp2.text)
    assert body2.get("code") == "DB_ERROR"


def test_calendar_month_bounds_use_utc() -> None:
    res = cal_mod._month_bounds("2026-01")

    assert res.ok
    start, end = res.data
    assert start == int(datetime.datetime(2026, 1, 1, tzinfo=datetime.timezone.utc).timestamp())
    assert end == int(datetime.datetime(2026, 2, 1, tzinfo=datetime.timezone.utc).timestamp())


@pytest.mark.asyncio
async def test_calendar_success_output_scope(monkeypatch) -> None:
    captured = {"filters": None}

    class _Index:
        async def date_histogram_scoped(self, roots, month_start, month_end, filters=None):
            _ = (roots, month_start, month_end)
            captured["filters"] = filters
            return Result.Ok({"2026-01-01": 2})

    async def _require_services():
        return {"index": _Index()}, None

    monkeypatch.setattr(cal_mod, "_require_services", _require_services)

    app = _app_with(cal_mod.register_calendar_routes)
    req = make_mocked_request(
        "GET",
        "/mjr/am/date-histogram?month=2026-01&scope=output&subfolder=animals&min_size_mb=2&max_size_mb=1&workflow_type=t2i&date_exact=2026-01-15",
        app=app,
    )
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)
    assert body.get("ok") is True
    filters = captured["filters"] or {}
    assert filters.get("subfolder") == "animals"
    assert filters.get("workflow_type") == "T2I"
    assert filters.get("max_size_bytes") == filters.get("min_size_bytes")
    assert filters.get("mtime_start") < filters.get("mtime_end")


@pytest.mark.asyncio
async def test_metadata_route_invalid_and_rate_limited(monkeypatch) -> None:
    async def _require_services():
        return {"metadata": object()}, None

    monkeypatch.setattr(meta_mod, "_require_services", _require_services)
    monkeypatch.setattr(meta_mod, "_check_rate_limit", lambda *args, **kwargs: (False, 4))

    app = _app_with(meta_mod.register_metadata_routes)
    req = make_mocked_request("GET", "/mjr/am/metadata?type=output&filename=x.png", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)
    assert body.get("code") == "RATE_LIMITED"

    monkeypatch.setattr(meta_mod, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    req2 = make_mocked_request("GET", "/mjr/am/metadata?type=bad&filename=x.png", app=app)
    match2 = await app.router.resolve(req2)
    resp2 = await match2.handler(req2)
    body2 = json.loads(resp2.text)
    assert body2.get("code") == "INVALID_INPUT"
