import json
from urllib.parse import urlencode

import pytest
from aiohttp import web
from aiohttp.test_utils import make_mocked_request

from mjr_am_backend.routes.handlers import releases as rel


def _app() -> web.Application:
    app = web.Application()
    routes = web.RouteTableDef()
    rel.register_releases_routes(routes)
    app.add_routes(routes)
    return app


@pytest.mark.asyncio
async def test_releases_rejects_invalid_owner_repo_segments() -> None:
    app = _app()
    cases = [
        {"owner": "..", "repo": "repo"},
        {"owner": "owner", "repo": "bad..repo"},
        {"owner": "owner name", "repo": "repo"},
        {"owner": "owner", "repo": "bad@repo"},
    ]
    for case in cases:
        query = urlencode(case)
        req = make_mocked_request("GET", f"/mjr/am/releases?{query}", app=app)
        match = await app.router.resolve(req)
        resp = await match.handler(req)
        payload = json.loads(resp.text)
        assert payload.get("code") == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_releases_returns_refs_for_valid_owner_repo(monkeypatch) -> None:
    async def _fake_fetch(_session, url, _headers):
        if "/tags?" in url:
            return [{"name": "v1.0.0"}, {"name": "v1.0.1"}]
        if "/branches?" in url:
            return [{"name": "main"}, {"name": "dev"}]
        return []

    monkeypatch.setattr(rel, "_fetch_github_json", _fake_fetch)

    app = _app()
    req = make_mocked_request(
        "GET",
        "/mjr/am/releases?owner=MajoorWaldi&repo=ComfyUI-Majoor-AssetsManager&per_page=50",
        app=app,
    )
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is True
    data = payload.get("data") or {}
    assert data.get("owner") == "MajoorWaldi"
    assert data.get("repo") == "ComfyUI-Majoor-AssetsManager"
    assert data.get("tags") == ["v1.0.0", "v1.0.1"]
    assert data.get("branches") == ["main", "dev"]
