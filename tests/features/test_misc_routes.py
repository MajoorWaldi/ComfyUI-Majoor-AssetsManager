import datetime
import json
from typing import Any, cast

import pytest
from aiohttp import web
from aiohttp.test_utils import make_mocked_request
from mjr_am_backend.routes.handlers import calendar as cal_mod
from mjr_am_backend.routes.handlers import metadata as meta_mod
from mjr_am_backend.routes.handlers import plugins as plugins_mod
from mjr_am_backend.routes.handlers import releases as rel_mod
from mjr_am_backend.routes.handlers import stacks as stacks_mod
from mjr_am_backend.shared import Result


def _app_with(register_fn):
    app = web.Application()
    routes = web.RouteTableDef()
    register_fn(routes)
    app.add_routes(routes)
    return app


async def _call(app, method: str, path: str):
    req = make_mocked_request(method, path, app=app)
    match = await app.router.resolve(req)
    req._match_info = match
    resp = await match.handler(req)
    return json.loads(resp.text), resp.status


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
    assert res.data is not None
    start, end = res.data
    assert start == int(datetime.datetime(2026, 1, 1, tzinfo=datetime.timezone.utc).timestamp())
    assert end == int(datetime.datetime(2026, 2, 1, tzinfo=datetime.timezone.utc).timestamp())


@pytest.mark.asyncio
async def test_calendar_success_output_scope(monkeypatch) -> None:
    captured: dict[str, dict[str, Any] | None] = {"filters": None}

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
    mtime_start = cast(int, filters.get("mtime_start"))
    mtime_end = cast(int, filters.get("mtime_end"))
    assert mtime_start < mtime_end


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


@pytest.mark.asyncio
async def test_plugins_routes_success_and_errors(monkeypatch) -> None:
    class _PluginManager:
        def __init__(self) -> None:
            self.enabled: list[str] = []

        def list_plugins(self):
            return [{"name": "demo", "enabled": False}]

        def enable_plugin(self, name):
            self.enabled.append(name)
            return name == "demo"

        async def reload(self):
            return 3

    class _Metadata:
        plugin_manager = _PluginManager()

    async def _require_services():
        return {"metadata": _Metadata()}, None

    monkeypatch.setattr(plugins_mod, "_require_services", _require_services)

    app = _app_with(plugins_mod.register_plugin_routes)

    body, status = await _call(app, "GET", "/mjr/am/plugins/list")
    assert status == 200
    assert body["ok"] is True
    assert body["data"][0]["name"] == "demo"

    body, _status = await _call(app, "POST", "/mjr/am/plugins/demo/enable")
    assert body["ok"] is True
    assert body["data"] == {"enabled": True}

    body, _status = await _call(app, "POST", "/mjr/am/plugins/missing/enable")
    assert body["code"] == "NOT_FOUND"

    body, _status = await _call(app, "POST", "/mjr/am/plugins/reload")
    assert body["ok"] is True
    assert body["data"] == {"reloaded": 3}


@pytest.mark.asyncio
async def test_plugins_routes_report_unavailable_manager(monkeypatch) -> None:
    async def _require_services():
        return {"metadata": object()}, None

    monkeypatch.setattr(plugins_mod, "_require_services", _require_services)

    app = _app_with(plugins_mod.register_plugin_routes)
    body, _status = await _call(app, "GET", "/mjr/am/plugins/list")

    assert body["code"] == "NOT_AVAILABLE"


@pytest.mark.asyncio
async def test_stacks_read_routes_and_invalid_ids(monkeypatch) -> None:
    class _Stacks:
        async def list_stacks(self, *, limit, offset, include_total):
            return Result.Ok({"limit": limit, "offset": offset, "include_total": include_total})

        async def get_stack_by_job_id(self, job_id):
            return Result.Ok({"job_id": job_id})

        async def get_stack(self, stack_id):
            return Result.Ok({"id": stack_id})

        async def get_members(self, stack_id):
            return Result.Ok([{"stack_id": stack_id}])

    services = {"_stacks_service": _Stacks()}

    async def _require_services():
        return services, None

    monkeypatch.setattr(stacks_mod, "_require_services", _require_services)

    app = _app_with(stacks_mod.register_stacks_routes)

    body, _status = await _call(app, "GET", "/mjr/am/stacks?limit=bad&offset=bad&include_total=0")
    assert body["data"] == {"limit": 50, "offset": 0, "include_total": False}

    body, _status = await _call(app, "GET", "/mjr/am/stacks/by-job/job-1")
    assert body["data"] == {"job_id": "job-1"}

    body, _status = await _call(app, "GET", "/mjr/am/stacks/12")
    assert body["data"] == {"id": 12}

    body, _status = await _call(app, "GET", "/mjr/am/stacks/not-an-int")
    assert body["code"] == "INVALID_INPUT"

    body, _status = await _call(app, "GET", "/mjr/am/stacks/12/members")
    assert body["data"] == [{"stack_id": 12}]


@pytest.mark.asyncio
async def test_stacks_write_routes_validate_and_call_service(monkeypatch) -> None:
    calls: list[tuple[str, object]] = []

    class _Stacks:
        async def set_cover(self, stack_id, cover_asset_id):
            calls.append(("cover", (stack_id, cover_asset_id)))
            return Result.Ok(True)

        async def update_name(self, stack_id, name):
            calls.append(("rename", (stack_id, name)))
            return Result.Ok(True)

        async def dissolve(self, stack_id):
            calls.append(("dissolve", stack_id))
            return Result.Ok(True)

        async def merge_into(self, target_id, source_ids):
            calls.append(("merge", (target_id, source_ids)))
            return Result.Ok(True)

        async def auto_stack_by_job_id(self, job_id):
            calls.append(("auto_job", job_id))
            return Result.Ok({"stacks": [{"id": 1}]})

        async def auto_stack_by_workflow_hash(self, *, mtime_window_s):
            calls.append(("auto_workflow", mtime_window_s))
            return Result.Ok({"stacks": []})

    body_queue = [
        {},
        {"cover_asset_id": 7},
        {"name": "New name"},
        {},
        {"stack_id": 9},
        {"target_stack_id": 1, "source_stack_ids": [2, 3]},
        {"mode": "workflow_hash", "mtime_window_s": 44},
        {"mode": "job_id", "job_id": "abc"},
    ]

    async def _require_services():
        return {"_stacks_service": _Stacks()}, None

    async def _read_json(_request):
        return body_queue.pop(0)

    monkeypatch.setattr(stacks_mod, "_require_services", _require_services)
    monkeypatch.setattr(stacks_mod, "_require_write_access", lambda _request: Result.Ok(True))
    monkeypatch.setattr(stacks_mod, "_read_json", _read_json)
    monkeypatch.setattr(stacks_mod, "is_execution_grouping_enabled", lambda: True)
    monkeypatch.setattr(stacks_mod, "_send_stack_update_event", lambda payload: calls.append(("event", payload)))

    app = _app_with(stacks_mod.register_stacks_routes)

    body, _status = await _call(app, "POST", "/mjr/am/stacks/1/cover")
    assert body["code"] == "INVALID_INPUT"

    body, _status = await _call(app, "POST", "/mjr/am/stacks/1/cover")
    assert body["ok"] is True

    body, _status = await _call(app, "POST", "/mjr/am/stacks/1/rename")
    assert body["ok"] is True

    body, _status = await _call(app, "POST", "/mjr/am/stacks/dissolve")
    assert body["code"] == "INVALID_INPUT"

    body, _status = await _call(app, "POST", "/mjr/am/stacks/dissolve")
    assert body["ok"] is True

    body, _status = await _call(app, "POST", "/mjr/am/stacks/merge")
    assert body["ok"] is True

    body, _status = await _call(app, "POST", "/mjr/am/stacks/auto-stack")
    assert body["ok"] is True

    body, _status = await _call(app, "POST", "/mjr/am/stacks/auto-stack")
    assert body["ok"] is True

    assert ("cover", (1, 7)) in calls
    assert ("rename", (1, "New name")) in calls
    assert ("dissolve", 9) in calls
    assert ("merge", (1, [2, 3])) in calls
    assert ("auto_workflow", 44) in calls
    assert ("auto_job", "abc") in calls
    assert any(name == "event" for name, _payload in calls)
