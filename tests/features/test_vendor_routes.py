"""Tests for the vendor static-file serving route handler."""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from aiohttp import web
from aiohttp.test_utils import make_mocked_request

from mjr_am_backend.routes.handlers import vendor as m


def _build_app() -> web.Application:
    app = web.Application()
    routes = web.RouteTableDef()
    m.register_vendor_routes(routes)
    app.add_routes(routes)
    return app


def _json(resp):
    return json.loads(resp.text)


async def _invoke(app, path_param: str):
    """Resolve and invoke the vendor route for the given path segment."""
    url = f"/mjr/am/vendor/{path_param}"
    req = make_mocked_request("GET", url, app=app, match_info={"path": path_param})
    match = await app.router.resolve(req)
    return await match.handler(req)


async def _invoke_legacy(app, path_param: str, prefix: str):
    url = f"{prefix}/{path_param}"
    req = make_mocked_request("GET", url, app=app, match_info={"path": path_param})
    match = await app.router.resolve(req)
    return await match.handler(req)


# -- Missing / empty path ----------------------------------------------------


@pytest.mark.asyncio
async def test_vendor_empty_path_returns_error():
    app = _build_app()
    resp = await _invoke(app, "")
    body = _json(resp)
    assert body.get("ok") is False
    assert body.get("code") == "INVALID_INPUT"


# -- File not found -----------------------------------------------------------


@pytest.mark.asyncio
async def test_vendor_nonexistent_file_returns_404(monkeypatch):
    monkeypatch.setattr(m, "_VENDOR_ROOT", Path("/nonexistent/vendor"))
    app = _build_app()
    resp = await _invoke(app, "missing.js")
    assert resp.status == 404


# -- Path traversal blocked ---------------------------------------------------


@pytest.mark.asyncio
async def test_vendor_path_traversal_blocked(monkeypatch, tmp_path: Path):
    vendor_dir = tmp_path / "vendor"
    vendor_dir.mkdir()
    secret = tmp_path / "secret.js"
    secret.write_text("alert('pwned')")

    monkeypatch.setattr(m, "_VENDOR_ROOT", vendor_dir)
    app = _build_app()
    resp = await _invoke(app, "../secret.js")
    # Should be either 404 (file not found within vendor) or 403 (outside root)
    assert resp.status in (403, 404)


# -- Forbidden file type ------------------------------------------------------


@pytest.mark.asyncio
async def test_vendor_forbidden_extension_returns_403(monkeypatch, tmp_path: Path):
    vendor_dir = tmp_path / "vendor"
    vendor_dir.mkdir()
    bad_file = vendor_dir / "payload.exe"
    bad_file.write_bytes(b"\x00")

    monkeypatch.setattr(m, "_VENDOR_ROOT", vendor_dir)
    app = _build_app()
    resp = await _invoke(app, "payload.exe")
    assert resp.status == 403


# -- Allowed file served successfully -----------------------------------------


@pytest.mark.asyncio
async def test_vendor_serves_allowed_js_file(monkeypatch, tmp_path: Path):
    vendor_dir = tmp_path / "vendor"
    vendor_dir.mkdir()
    js_file = vendor_dir / "three.mjs"
    js_file.write_text("export default {}")

    monkeypatch.setattr(m, "_VENDOR_ROOT", vendor_dir)
    app = _build_app()
    resp = await _invoke(app, "three.mjs")
    assert resp.status == 200
    assert resp.headers.get("Content-Type") == "text/javascript"
    assert resp.headers.get("X-Content-Type-Options") == "nosniff"


@pytest.mark.asyncio
async def test_vendor_serves_json_file(monkeypatch, tmp_path: Path):
    vendor_dir = tmp_path / "vendor"
    vendor_dir.mkdir()
    json_file = vendor_dir / "data.json"
    json_file.write_text('{"key": "value"}')

    monkeypatch.setattr(m, "_VENDOR_ROOT", vendor_dir)
    app = _build_app()
    resp = await _invoke(app, "data.json")
    assert resp.status == 200


# -- Subdirectory access -------------------------------------------------------


@pytest.mark.asyncio
async def test_vendor_serves_file_in_subdirectory(monkeypatch, tmp_path: Path):
    vendor_dir = tmp_path / "vendor"
    sub = vendor_dir / "libs"
    sub.mkdir(parents=True)
    js_file = sub / "util.js"
    js_file.write_text("// util")

    monkeypatch.setattr(m, "_VENDOR_ROOT", vendor_dir)
    app = _build_app()
    resp = await _invoke(app, "libs/util.js")
    assert resp.status == 200


# -- Directory (not a file) returns 404 ----------------------------------------


@pytest.mark.asyncio
async def test_vendor_directory_returns_404(monkeypatch, tmp_path: Path):
    vendor_dir = tmp_path / "vendor"
    sub = vendor_dir / "subdir"
    sub.mkdir(parents=True)

    monkeypatch.setattr(m, "_VENDOR_ROOT", vendor_dir)
    app = _build_app()
    resp = await _invoke(app, "subdir")
    assert resp.status == 404


# -- Cache headers set ---------------------------------------------------------


@pytest.mark.asyncio
async def test_vendor_sets_cache_headers(monkeypatch, tmp_path: Path):
    vendor_dir = tmp_path / "vendor"
    vendor_dir.mkdir()
    wasm_file = vendor_dir / "module.wasm"
    wasm_file.write_bytes(b"\x00asm")

    monkeypatch.setattr(m, "_VENDOR_ROOT", vendor_dir)
    app = _build_app()
    resp = await _invoke(app, "module.wasm")
    assert resp.status == 200
    assert "max-age" in (resp.headers.get("Cache-Control") or "")


@pytest.mark.asyncio
async def test_vendor_serves_legacy_extension_path(monkeypatch, tmp_path: Path):
    vendor_dir = tmp_path / "vendor"
    vendor_dir.mkdir()
    js_file = vendor_dir / "three.module.js"
    js_file.write_text("export const ok = true;")

    monkeypatch.setattr(m, "_VENDOR_ROOT", vendor_dir)
    app = _build_app()
    resp = await _invoke_legacy(app, "three.module.js", "/extensions/majoor-assetsmanager/vendor")
    assert resp.status == 200
    assert resp.headers.get("Content-Type") == "text/javascript"


@pytest.mark.asyncio
async def test_vendor_serves_repo_named_extension_path(monkeypatch, tmp_path: Path):
    vendor_dir = tmp_path / "vendor"
    vendor_dir.mkdir()
    js_file = vendor_dir / "three.module.js"
    js_file.write_text("export const ok = true;")

    monkeypatch.setattr(m, "_VENDOR_ROOT", vendor_dir)
    app = _build_app()
    resp = await _invoke_legacy(app, "three.module.js", "/extensions/ComfyUI-Majoor-AssetsManager/vendor")
    assert resp.status == 200
