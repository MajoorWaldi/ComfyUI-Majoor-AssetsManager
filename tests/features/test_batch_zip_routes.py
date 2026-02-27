import json
import tempfile
from pathlib import Path

import pytest
from aiohttp import web
from aiohttp.test_utils import make_mocked_request

from mjr_am_backend.routes.handlers import batch_zip as bz
from mjr_am_backend.shared import Result


def _app():
    app = web.Application()
    routes = web.RouteTableDef()
    bz.register_batch_zip_routes(routes)
    app.add_routes(routes)
    return app


def test_batch_zip_sanitize_and_cleanup_helpers(monkeypatch):
    with tempfile.TemporaryDirectory() as td:
        tmp_path = Path(td)
        monkeypatch.setattr(bz, "_BATCH_CACHE", {})
        monkeypatch.setattr(bz, "_BATCH_MAX", 1)
        monkeypatch.setattr(bz, "_BATCH_TTL_SECONDS", 0)
        monkeypatch.setattr(bz, "_BATCH_DIR", tmp_path)
        assert bz._sanitize_token("short") == ""
        token = "a" * 40
        assert bz._sanitize_token(token) == token

        z = tmp_path / "x.zip"
        z.write_bytes(b"x")
        bz._BATCH_CACHE[token] = {"path": z, "created_at": 1.0}
        bz._cleanup_batch_zips()
        assert token not in bz._BATCH_CACHE


def test_batch_file_response_sanitizes_content_disposition(tmp_path: Path) -> None:
    token = "a" * 40
    zip_path = tmp_path / "payload.zip"
    zip_path.write_bytes(b"zip")
    entry = {"path": zip_path, "filename": 'bad\r\nname";\x01.zip'}
    response = bz._batch_file_response(entry, token)
    header = str(response.headers.get("Content-Disposition") or "")
    assert "\r" not in header
    assert "\n" not in header
    assert '"' in header


@pytest.mark.asyncio
async def test_batch_zip_create_invalid_and_get_not_found(monkeypatch):
    app = _app()
    monkeypatch.setattr(bz, "_csrf_error", lambda _r: None)
    monkeypatch.setattr(bz, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    monkeypatch.setattr(bz, "_require_write_access", lambda _r: Result.Ok({}))

    async def _read_json(_request, max_bytes=None):
        _ = max_bytes
        return Result.Ok({"token": "bad", "items": []})

    monkeypatch.setattr(bz, "_read_json", _read_json)

    req = make_mocked_request("POST", "/mjr/am/batch-zip", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)
    assert body.get("code") == "INVALID_INPUT"

    req2 = make_mocked_request("GET", "/mjr/am/batch-zip/" + ("a" * 40), app=app)
    req2._match_info = {"token": "a" * 40}
    match2 = await app.router.resolve(req2)
    resp2 = await match2.handler(req2)
    body2 = json.loads(resp2.text)
    assert body2.get("code") in {"NOT_FOUND", "NOT_READY"}


@pytest.mark.asyncio
async def test_batch_zip_create_and_fetch_ready(monkeypatch, tmp_path: Path):
    app = _app()
    monkeypatch.setattr(bz, "_csrf_error", lambda _r: None)
    monkeypatch.setattr(bz, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    monkeypatch.setattr(bz, "_require_write_access", lambda _r: Result.Ok({}))
    monkeypatch.setattr(bz, "_BATCH_DIR", tmp_path)
    monkeypatch.setattr(bz, "_BATCH_CACHE", {})

    src = tmp_path / "a.png"
    src.write_bytes(b"data")
    token = "b" * 40

    async def _read_json(_request, max_bytes=None):
        _ = max_bytes
        return Result.Ok({"token": token, "items": [{"filename": "a.png", "subfolder": "", "type": "output"}]})

    monkeypatch.setattr(bz, "_read_json", _read_json)
    monkeypatch.setattr(bz, "_resolve_item_path", lambda _item: (src, tmp_path))

    req = make_mocked_request("POST", "/mjr/am/batch-zip", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)
    assert body.get("ok") is True

    req2 = make_mocked_request("GET", f"/mjr/am/batch-zip/{token}", app=app)
    req2._match_info = {"token": token}
    match2 = await app.router.resolve(req2)
    resp2 = await match2.handler(req2)
    assert getattr(resp2, "status", 200) in {200, 206}
