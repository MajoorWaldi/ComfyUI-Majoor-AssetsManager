import json
from pathlib import Path

import pytest
from aiohttp import web
from aiohttp.test_utils import make_mocked_request

from mjr_am_backend.routes.core import security as sec
from mjr_am_backend.routes.handlers import collections as collections_mod
from mjr_am_backend.routes.handlers import custom_roots as custom_roots_mod
from mjr_am_backend.routes.handlers import health as health_mod
from mjr_am_backend.shared import Result


def _app(register_fn):
    app = web.Application()
    routes = web.RouteTableDef()
    register_fn(routes)
    app.add_routes(routes)
    return app


def _json(resp):
    return json.loads(resp.text)


@pytest.mark.asyncio
async def test_custom_view_filepath_mode_rejects_outside_roots(monkeypatch, tmp_path: Path) -> None:
    app = _app(custom_roots_mod.register_custom_roots_routes)
    f = tmp_path / "x.png"
    f.write_bytes(b"x")

    monkeypatch.setattr(custom_roots_mod, "_normalize_path", lambda _v: f)
    monkeypatch.setattr(custom_roots_mod, "_is_path_allowed", lambda *_a, **_k: False)
    monkeypatch.setattr(custom_roots_mod, "_is_path_allowed_custom", lambda *_a, **_k: False)

    req = make_mocked_request("GET", "/mjr/am/custom-view?filepath=x&browser_mode=0", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    assert _json(resp).get("code") == "FORBIDDEN"


@pytest.mark.asyncio
async def test_folder_info_filepath_mode_rejects_outside_roots(monkeypatch, tmp_path: Path) -> None:
    app = _app(custom_roots_mod.register_custom_roots_routes)
    d = tmp_path / "dir"
    d.mkdir()

    monkeypatch.setattr(custom_roots_mod, "_normalize_path", lambda _v: d)
    monkeypatch.setattr(custom_roots_mod, "_is_path_allowed", lambda *_a, **_k: False)
    monkeypatch.setattr(custom_roots_mod, "_is_path_allowed_custom", lambda *_a, **_k: False)

    req = make_mocked_request("GET", "/mjr/am/folder-info?filepath=x", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    assert _json(resp).get("code") == "FORBIDDEN"


@pytest.mark.asyncio
async def test_collections_mutations_require_csrf_and_write_access(monkeypatch) -> None:
    app = _app(collections_mod.register_collections_routes)

    monkeypatch.setattr(collections_mod, "_csrf_error", lambda _request: "csrf blocked")
    req1 = make_mocked_request("POST", "/mjr/am/collections", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    assert _json(resp1).get("code") == "CSRF"

    monkeypatch.setattr(collections_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(collections_mod, "_require_write_access", lambda _request: Result.Err("AUTH_REQUIRED", "auth required"))
    req2 = make_mocked_request("POST", "/mjr/am/collections", app=app)
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    assert _json(resp2).get("code") == "AUTH_REQUIRED"


@pytest.mark.asyncio
async def test_settings_mutation_requires_write_access(monkeypatch) -> None:
    class _Settings:
        async def set_probe_backend(self, mode):
            return Result.Ok(mode)

    async def _require_services():
        return {"settings": _Settings()}, None

    async def _read_json(_request):
        return Result.Ok({"mode": "auto"})

    app = _app(health_mod.register_health_routes)
    monkeypatch.setattr(health_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(health_mod, "_require_write_access", lambda _request: Result.Err("AUTH_REQUIRED", "auth required"))
    monkeypatch.setattr(health_mod, "_require_services", _require_services)
    monkeypatch.setattr(health_mod, "_read_json", _read_json)

    req = make_mocked_request("POST", "/mjr/am/settings/probe-backend", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    assert _json(resp).get("code") == "AUTH_REQUIRED"


@pytest.mark.asyncio
async def test_browser_routes_require_csrf(monkeypatch) -> None:
    app = _app(custom_roots_mod.register_custom_roots_routes)
    monkeypatch.setattr(custom_roots_mod, "_csrf_error", lambda _request: "csrf blocked")

    req1 = make_mocked_request("POST", "/mjr/sys/browse-folder", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    assert _json(resp1).get("code") == "CSRF"

    req2 = make_mocked_request("POST", "/mjr/am/browser/folder-op", app=app)
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    assert _json(resp2).get("code") == "CSRF"


def test_rate_limit_overflow_keeps_per_client_state(monkeypatch) -> None:
    class _Req:
        def __init__(self, cid: str):
            self.headers = {"X-Test-Client": cid}

    sec._reset_security_state_for_tests()
    monkeypatch.setattr(sec, "_MAX_RATE_LIMIT_CLIENTS", 2)
    monkeypatch.setattr(sec, "_get_client_identifier", lambda req: str(req.headers.get("X-Test-Client") or ""))

    assert sec._check_rate_limit(_Req("a"), "ep", max_requests=1, window_seconds=60)[0] is True
    assert sec._check_rate_limit(_Req("b"), "ep", max_requests=1, window_seconds=60)[0] is True
    assert sec._check_rate_limit(_Req("c"), "ep", max_requests=1, window_seconds=60)[0] is True

    # "b" should still have its own tracked state and be rate-limited on second request.
    assert sec._check_rate_limit(_Req("b"), "ep", max_requests=1, window_seconds=60)[0] is False
    # "a" was evicted as oldest, so it should be treated as new.
    assert sec._check_rate_limit(_Req("a"), "ep", max_requests=1, window_seconds=60)[0] is True
