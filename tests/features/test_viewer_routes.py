import json
import os
import sys
from pathlib import Path

import pytest
from aiohttp import web
from aiohttp.test_utils import make_mocked_request

from mjr_am_backend.routes.handlers import viewer as m


def _app() -> web.Application:
    app = web.Application()
    routes = web.RouteTableDef()
    m.register_viewer_routes(routes)
    app.add_routes(routes)
    return app


def _json(resp):
    return json.loads(resp.text)


@pytest.mark.asyncio
async def test_viewer_info_includes_model3d_contract(monkeypatch, tmp_path: Path) -> None:
    app = _app()
    model = tmp_path / "mesh.glb"
    model.write_bytes(b"glb")

    async def _resolve(_request):
        return (
            {"id": 7, "kind": "model3d", "ext": ".glb", "filename": "mesh.glb", "size": 3},
            model,
            tmp_path,
            None,
        )

    monkeypatch.setattr(m, "_resolve_viewer_file_context", _resolve)

    req = make_mocked_request("GET", "/mjr/am/viewer/info?asset_id=7", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    body = _json(resp)
    assert body.get("ok") is True
    data = body.get("data") or {}
    assert data.get("kind") == "model3d"
    assert data.get("loader") == "gltf"
    assert data.get("previewable") is True
    assert data.get("interactive") is True
    assert data.get("mime") == "model/gltf-binary"


@pytest.mark.asyncio
async def test_viewer_resource_supports_relative_subpaths(monkeypatch, tmp_path: Path) -> None:
    app = _app()
    scene_root = tmp_path / "scene"
    models_dir = scene_root / "models"
    textures_dir = scene_root / "textures"
    models_dir.mkdir(parents=True)
    textures_dir.mkdir(parents=True)
    base_model = models_dir / "robot.gltf"
    texture = textures_dir / "albedo.png"
    base_model.write_text("{}", encoding="utf-8")
    texture.write_bytes(b"png")

    async def _resolve(_request):
        return (None, base_model, scene_root, None)

    monkeypatch.setattr(m, "_resolve_viewer_file_context", _resolve)

    req = make_mocked_request(
        "GET",
        "/mjr/am/viewer/resource?filename=robot.gltf&type=output&relpath=../textures/albedo.png",
        app=app,
    )
    resp = await (await app.router.resolve(req)).handler(req)
    assert resp.headers.get("Content-Type") == "image/png"


@pytest.mark.asyncio
async def test_viewer_resource_blocks_escape(monkeypatch, tmp_path: Path) -> None:
    app = _app()
    scene_root = tmp_path / "scene"
    models_dir = scene_root / "models"
    models_dir.mkdir(parents=True)
    base_model = models_dir / "robot.gltf"
    base_model.write_text("{}", encoding="utf-8")
    outside = tmp_path / "secret.txt"
    outside.write_text("secret", encoding="utf-8")

    async def _resolve(_request):
        return (None, base_model, scene_root, None)

    monkeypatch.setattr(m, "_resolve_viewer_file_context", _resolve)

    req = make_mocked_request(
        "GET",
        "/mjr/am/viewer/resource?filename=robot.gltf&type=output&relpath=../../secret.txt",
        app=app,
    )
    resp = await (await app.router.resolve(req)).handler(req)
    body = _json(resp)
    assert body.get("code") == "FORBIDDEN"


@pytest.mark.asyncio
async def test_viewer_resource_blocks_null_byte_in_relpath(monkeypatch, tmp_path: Path) -> None:
    """Null bytes (literal or percent-encoded) in relpath must be rejected."""
    app = _app()
    scene_root = tmp_path / "scene"
    models_dir = scene_root / "models"
    models_dir.mkdir(parents=True)
    base_model = models_dir / "robot.gltf"
    base_model.write_text("{}", encoding="utf-8")

    async def _resolve(_request):
        return (None, base_model, scene_root, None)

    monkeypatch.setattr(m, "_resolve_viewer_file_context", _resolve)

    for bad_relpath in ["tex\x00tures/albedo.png", "%00", "tex%00tures/albedo.png"]:
        req = make_mocked_request(
            "GET",
            f"/mjr/am/viewer/resource?filename=robot.gltf&type=output&relpath={bad_relpath}",
            app=app,
        )
        resp = await (await app.router.resolve(req)).handler(req)
        body = _json(resp)
        assert body.get("ok") is not True, f"Expected rejection for relpath={bad_relpath!r}"


@pytest.mark.skipif(sys.platform == "win32", reason="Symlinks require elevated privileges on Windows")
@pytest.mark.asyncio
async def test_viewer_resource_blocks_symlink_escape(monkeypatch, tmp_path: Path) -> None:
    """Symlinks pointing outside the allowed root must be blocked by path resolution."""
    app = _app()
    scene_root = tmp_path / "scene"
    models_dir = scene_root / "models"
    textures_dir = scene_root / "textures"
    models_dir.mkdir(parents=True)
    textures_dir.mkdir(parents=True)

    outside = tmp_path / "secret.txt"
    outside.write_text("secret", encoding="utf-8")

    # Create a symlink inside the allowed root that points outside
    symlink = textures_dir / "evil.txt"
    os.symlink(outside, symlink)

    base_model = models_dir / "robot.gltf"
    base_model.write_text("{}", encoding="utf-8")

    async def _resolve(_request):
        return (None, base_model, scene_root, None)

    monkeypatch.setattr(m, "_resolve_viewer_file_context", _resolve)

    req = make_mocked_request(
        "GET",
        "/mjr/am/viewer/resource?filename=robot.gltf&type=output&relpath=../textures/evil.txt",
        app=app,
    )
    resp = await (await app.router.resolve(req)).handler(req)
    body = _json(resp)
    # The symlink resolves to outside scene_root → must be FORBIDDEN
    assert body.get("code") == "FORBIDDEN"
