import json

import pytest
from aiohttp import web
from aiohttp.test_utils import make_mocked_request

from mjr_am_backend.routes import registry as r
from mjr_am_backend.shared import Result


def test_request_helpers_and_requires_auth():
    req = make_mocked_request("POST", "/mjr/am/x")
    path, method = r._request_path_and_method(req)
    assert path == "/mjr/am/x" and method == "POST"
    assert r._requires_auth(path, method) is True
    assert r._requires_auth("/other", "POST") is False
    assert r._requires_auth("/mjr/am/x", "GET") is False


@pytest.mark.asyncio
async def test_api_versioning_and_security_headers_middlewares():
    req_v = make_mocked_request("GET", "/mjr/am/v1/test?a=1")

    async def _handler(_req):
        return web.Response(text="ok")

    with pytest.raises(web.HTTPPermanentRedirect):
        await r.api_versioning_middleware(req_v, _handler)

    req_api = make_mocked_request("GET", "/mjr/am/health")
    resp_api = await r.security_headers_middleware(req_api, _handler)
    assert resp_api.headers.get("X-Content-Type-Options") == "nosniff"

    req_other = make_mocked_request("GET", "/")
    resp_other = await r.security_headers_middleware(req_other, _handler)
    assert resp_other.text == "ok"


def test_auth_error_response_or_none(monkeypatch):
    req = make_mocked_request("POST", "/mjr/am/scan")
    monkeypatch.setattr(r, "_require_authenticated_user", lambda _req: Result.Err("AUTH_REQUIRED", "x"))
    out = r._auth_error_response_or_none(req)
    body = json.loads(out.text)
    assert body.get("code") == "AUTH_REQUIRED"

    monkeypatch.setattr(r, "_require_authenticated_user", lambda _req: Result.Ok("u1"))
    out2 = r._auth_error_response_or_none(req)
    assert out2 is None and req.get("mjr_user_id") == "u1"


def test_install_middlewares_and_bg_cleanup(monkeypatch):
    app = web.Application()
    r._install_security_middlewares(app)
    r._install_security_middlewares(app)
    assert app.get(r._APP_KEY_SECURITY_MIDDLEWARES_INSTALLED) is True
    assert len(app.middlewares) >= 3

    r._install_background_scan_cleanup(app)
    r._install_background_scan_cleanup(app)
    assert app.get(r._APP_KEY_BG_SCAN_CLEANUP_INSTALLED) is True


def test_extract_paths_helpers():
    app = web.Application()
    rt = web.RouteTableDef()

    @rt.get("/x")
    async def _x(_req):
        return web.Response(text="ok")

    app.add_routes(rt)
    app_paths = r._extract_app_paths(app)
    table_paths = r._extract_table_paths(rt)
    assert "/x" in app_paths and "/x" in table_paths
