import json

import pytest
from aiohttp import web
from aiohttp.test_utils import make_mocked_request

from mjr_am_backend.routes.handlers import scan_upload as upload_mod
from mjr_am_backend.shared import Result


def _app(deps: dict) -> web.Application:
    app = web.Application()
    routes = web.RouteTableDef()
    upload_mod.register_upload_routes(routes, deps=deps)
    app.add_routes(routes)
    return app


@pytest.mark.asyncio
async def test_upload_input_rejects_oversized_content_length(monkeypatch) -> None:
    monkeypatch.setattr(upload_mod, "_MAX_UPLOAD_SIZE", 1024)

    deps = {
        "_csrf_error": lambda _req: None,
        "_require_write_access": lambda _req: Result.Ok({}),
    }
    app = _app(deps)
    req = make_mocked_request(
        "POST",
        "/mjr/am/upload_input",
        headers={"Content-Length": "2048"},
        app=app,
    )
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("code") == "FILE_TOO_LARGE"
