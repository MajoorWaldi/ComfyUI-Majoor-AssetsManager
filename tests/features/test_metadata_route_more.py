import json
from pathlib import Path
from types import SimpleNamespace

import pytest
from aiohttp import web
from aiohttp.test_utils import make_mocked_request

from mjr_am_backend.routes.handlers import metadata as m
from mjr_am_backend.shared import Result


def _app():
    app = web.Application()
    routes = web.RouteTableDef()
    m.register_metadata_routes(routes)
    app.add_routes(routes)
    return app


@pytest.mark.asyncio
async def test_metadata_route_missing_filename_and_invalid_filename(monkeypatch):
    async def _require_services():
        return {"metadata": object()}, None

    monkeypatch.setattr(m, "_require_services", _require_services)
    monkeypatch.setattr(m, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    app = _app()

    req = make_mocked_request("GET", "/mjr/am/metadata?type=output", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)
    assert body.get("code") == "INVALID_INPUT"

    req2 = make_mocked_request("GET", "/mjr/am/metadata?type=output&filename=../x.png", app=app)
    match2 = await app.router.resolve(req2)
    resp2 = await match2.handler(req2)
    body2 = json.loads(resp2.text)
    assert body2.get("code") == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_metadata_route_custom_filepath_and_custom_root_branches(monkeypatch, tmp_path: Path):
    class _Meta:
        async def get_metadata(self, _fp):
            return Result.Ok({"ok": 1})

        async def get_workflow_only(self, _fp):
            return Result.Ok({"workflow": 1})

    async def _require_services():
        return {"metadata": _Meta()}, None

    app = _app()
    monkeypatch.setattr(m, "_require_services", _require_services)
    monkeypatch.setattr(m, "_check_rate_limit", lambda *args, **kwargs: (True, None))

    f = tmp_path / "a.png"
    f.write_bytes(b"x")
    monkeypatch.setattr(m, "_normalize_path", lambda p: Path(p))

    req = make_mocked_request("GET", f"/mjr/am/metadata?type=custom&filename=a.png&filepath={f}", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)
    assert body.get("ok") is True

    monkeypatch.setattr(m, "resolve_custom_root", lambda _rid: Result.Err("INVALID_INPUT", "bad root"))
    req2 = make_mocked_request("GET", "/mjr/am/metadata?type=custom&filename=a.png&root_id=r1", app=app)
    match2 = await app.router.resolve(req2)
    resp2 = await match2.handler(req2)
    body2 = json.loads(resp2.text)
    assert body2.get("code") == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_metadata_route_input_path_denied_and_timeout(monkeypatch, tmp_path: Path):
    class _Meta:
        async def get_metadata(self, _fp):
            raise TimeoutError("x")

        async def get_workflow_only(self, _fp):
            return Result.Ok({"workflow": 1})

    async def _require_services():
        return {"metadata": _Meta()}, None

    app = _app()
    monkeypatch.setattr(m, "_require_services", _require_services)
    monkeypatch.setattr(m, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    monkeypatch.setattr(m.folder_paths, "get_input_directory", lambda: str(tmp_path))

    f = tmp_path / "a.png"
    f.write_bytes(b"x")
    monkeypatch.setattr(m, "_normalize_path", lambda p: Path(p))
    monkeypatch.setattr(m, "_is_path_allowed", lambda _p: False)

    req = make_mocked_request("GET", "/mjr/am/metadata?type=input&filename=a.png", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)
    assert body.get("code") == "INVALID_INPUT"

    monkeypatch.setattr(m, "_is_path_allowed", lambda _p: True)

    async def _wait_for(*args, **kwargs):
        if args:
            c = args[0]
            try:
                c.close()
            except Exception:
                pass
        raise m.asyncio.TimeoutError()

    monkeypatch.setattr(m.asyncio, "wait_for", _wait_for)
    req2 = make_mocked_request("GET", "/mjr/am/metadata?type=input&filename=a.png", app=app)
    match2 = await app.router.resolve(req2)
    resp2 = await match2.handler(req2)
    body2 = json.loads(resp2.text)
    assert body2.get("code") == "TIMEOUT"
