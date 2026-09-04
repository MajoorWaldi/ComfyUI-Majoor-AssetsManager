import json
import sqlite3

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
    # Reads are guarded too: they leak custom-root paths, tags, ratings and
    # generation metadata, so GET must sit behind the same boundary as writes.
    assert r._requires_auth("/mjr/am/x", "GET") is True


def test_requires_auth_covers_comfy_api_mirror():
    """ComfyUI's PromptServer.add_routes() mirrors every route under "/api",
    so /api/mjr/am/<mutation> reaches the same handler as /mjr/am/<mutation>.
    Both spellings must demand authentication, or the mirror is a bypass."""
    assert r._requires_auth("/api/mjr/am/assets/delete", "POST") is True
    assert r._requires_auth("/api/mjr/am/assets/rename", "PATCH") is True
    assert r._requires_auth("/api/mjr/am/list", "GET") is True


def test_requires_auth_covers_v2_compat_surface_and_its_mirror():
    # The v2 compat layer is read-only, but reads still require auth -- same
    # boundary as writes, gated on Comfy's own auth being enabled.
    assert r._is_majoor_path("/api/v2/assets") is True
    assert r._is_majoor_path("/api/v2/assets/1/content") is True
    assert r._is_majoor_path("/api/api/v2/assets") is True
    assert r._requires_auth("/api/v2/assets", "DELETE") is True


def test_security_boundary_does_not_capture_comfyui_core_routes():
    """The boundary must not swallow ComfyUI's own routes - applying our CSP /
    auth rules to core endpoints would break the host application."""
    for path in ("/prompt", "/api/prompt", "/view", "/api/view", "/userdata/x", "/"):
        assert r._is_majoor_path(path) is False


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


@pytest.mark.asyncio
async def test_security_headers_applied_to_mirror_and_compat_surface():
    async def _handler(_req):
        return web.Response(text="ok")

    # ComfyUI's "/api" mirror and the v2 compat layer must get the same
    # hardening headers as the canonical /mjr/am/ prefix.
    for path in ("/api/mjr/am/health", "/api/v2/assets", "/api/v2/assets/1/content"):
        resp = await r.security_headers_middleware(make_mocked_request("GET", path), _handler)
        assert resp.headers.get("X-Content-Type-Options") == "nosniff", path
        assert resp.headers.get("Content-Security-Policy") == "default-src 'none'", path
        assert resp.headers.get("X-Frame-Options") == "DENY", path


@pytest.mark.asyncio
async def test_api_versioning_redirect_preserves_mirror_prefix():
    async def _handler(_req):
        return web.Response(text="ok")

    with pytest.raises(web.HTTPPermanentRedirect) as excinfo:
        await r.api_versioning_middleware(
            make_mocked_request("GET", "/api/mjr/am/v1/test?a=1"), _handler
        )
    # A caller who used the mirrored spelling must stay on it after the redirect.
    assert excinfo.value.location == "/api/mjr/am/test?a=1"


def test_auth_error_response_or_none(monkeypatch):
    req = make_mocked_request("POST", "/mjr/am/scan")
    monkeypatch.setattr(r, "_require_authenticated_user", lambda _req: Result.Err("AUTH_REQUIRED", "x"))
    out = r._auth_error_response_or_none(req)
    body = json.loads(out.text)
    assert body.get("code") == "AUTH_REQUIRED"

    monkeypatch.setattr(r, "_require_authenticated_user", lambda _req: Result.Ok("u1"))
    out2 = r._auth_error_response_or_none(req)
    assert out2 is None and req.get("mjr_user_id") == "u1"


@pytest.mark.asyncio
async def test_auth_middleware_pushes_request_user_context(monkeypatch):
    req = make_mocked_request("GET", "/mjr/am/custom-roots")
    seen = {"user_id": ""}

    from mjr_am_backend.routes.core import security as sec

    monkeypatch.setattr(sec, "_get_request_user_id", lambda _req: "u-ctx")
    monkeypatch.setattr(r, "_requires_auth", lambda *_args, **_kwargs: False)

    async def _handler(_req):
        from mjr_am_backend.routes.core import _current_user_id

        seen["user_id"] = _current_user_id()
        return web.Response(text="ok")

    resp = await r.auth_required_middleware(req, _handler)
    assert resp.text == "ok"
    assert seen["user_id"] == "u-ctx"


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


def test_route_verbose_logs_enabled_from_env_and_db(monkeypatch):
    monkeypatch.setenv("MAJOOR_ROUTE_VERBOSE_LOGS", "1")
    assert r._route_verbose_logs_enabled() is True

    monkeypatch.delenv("MAJOOR_ROUTE_VERBOSE_LOGS", raising=False)
    monkeypatch.delenv("MJR_AM_ROUTE_VERBOSE_LOGS", raising=False)
    monkeypatch.delenv("MAJOOR_VERBOSE_ROUTE_LOGS", raising=False)
    monkeypatch.delenv("MJR_AM_VERBOSE_ROUTE_LOGS", raising=False)

    class _Conn:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def execute(self, _sql, _params):
            class _Cursor:
                @staticmethod
                def fetchone():
                    return ("1",)

            return _Cursor()

    monkeypatch.setattr(sqlite3, "connect", lambda *_args, **_kwargs: _Conn())
    assert r._route_verbose_logs_enabled() is True
