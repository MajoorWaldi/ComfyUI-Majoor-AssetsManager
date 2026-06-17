import json
import tempfile

import pytest
from aiohttp import web
from aiohttp.test_utils import make_mocked_request
from mjr_am_backend.features.workflows import service as workflows_service
from mjr_am_backend.routes.handlers import workflows as workflows_routes
from mjr_am_backend.shared import Result


def _build_app() -> web.Application:
    app = web.Application()
    routes = web.RouteTableDef()
    workflows_routes.register_workflow_routes(routes)
    app.add_routes(routes)
    return app


@pytest.mark.asyncio
async def test_workflow_content_rejects_invalid_path(monkeypatch, tmp_path):
    workflow_dir = tmp_path / "workflows"
    workflow_dir.mkdir()
    outside = tmp_path / "outside.json"
    outside.write_text(json.dumps({"nodes": []}), encoding="utf-8")
    monkeypatch.setenv("MJR_AM_WORKFLOW_DIRECTORY", str(workflow_dir))

    app = _build_app()
    req = make_mocked_request(
        "GET",
        f"/mjr/am/workflows/content?filepath={outside.as_posix()}",
        app=app,
    )
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)

    assert body.get("ok") is False
    assert body.get("code") == "FORBIDDEN"


@pytest.mark.asyncio
async def test_workflow_save_rejects_bad_json(monkeypatch):
    monkeypatch.setattr(workflows_routes, "_csrf_error", lambda request: None)
    monkeypatch.setattr(workflows_routes, "_require_write_access", lambda request: Result.Ok(True))

    async def _bad_json(_request):
        return Result.Err("INVALID_JSON", "Invalid JSON body")

    monkeypatch.setattr(workflows_routes, "_read_json", _bad_json)

    app = _build_app()
    req = make_mocked_request("POST", "/mjr/am/workflows/save", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)

    assert body.get("ok") is False
    assert body.get("code") == "INVALID_JSON"


@pytest.mark.asyncio
async def test_workflow_thumbnail_missing_returns_not_found(monkeypatch, tmp_path):
    missing = tmp_path / "workflows" / "missing.png"

    monkeypatch.setattr(workflows_routes, "is_workflow_thumbnail_path", lambda _path: True)

    app = _build_app()
    req = make_mocked_request(
        "GET",
        f"/mjr/am/workflows/thumbnail?filepath={missing.as_posix()}",
        app=app,
    )
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)

    assert body.get("ok") is False
    assert body.get("code") == "NOT_FOUND"


@pytest.mark.asyncio
async def test_workflow_graph_map_thumbnail_returns_svg(monkeypatch, tmp_path):
    workflow_dir = tmp_path / "workflows"
    workflow_dir.mkdir()
    workflow_path = workflow_dir / "graph-map.json"
    workflow_path.write_text(json.dumps({"name": "Graph Map", "nodes": [{"id": 1, "type": "KSampler"}]}), encoding="utf-8")
    monkeypatch.setenv("MJR_AM_WORKFLOW_DIRECTORY", str(workflow_dir))

    app = _build_app()
    req = make_mocked_request(
        "GET",
        f"/mjr/am/workflows/graph-map-thumbnail?filepath={workflow_path.as_posix()}",
        app=app,
    )
    match = await app.router.resolve(req)
    resp = await match.handler(req)

    assert resp.content_type == "image/svg+xml"
    assert "<svg" in resp.text
    assert resp.headers.get("ETag")
    assert resp.headers.get("Cache-Control") == "private, max-age=300"


@pytest.mark.asyncio
async def test_workflow_graph_map_thumbnail_supports_conditional_cache(monkeypatch, tmp_path):
    workflow_dir = tmp_path / "workflows"
    workflow_dir.mkdir()
    workflow_path = workflow_dir / "graph-map.json"
    workflow_path.write_text(json.dumps({"name": "Graph Map", "nodes": [{"id": 1, "type": "KSampler"}]}), encoding="utf-8")
    monkeypatch.setenv("MJR_AM_WORKFLOW_DIRECTORY", str(workflow_dir))

    app = _build_app()
    first_req = make_mocked_request(
        "GET",
        f"/mjr/am/workflows/graph-map-thumbnail?filepath={workflow_path.as_posix()}",
        app=app,
    )
    first_match = await app.router.resolve(first_req)
    first_resp = await first_match.handler(first_req)
    etag = first_resp.headers.get("ETag")
    assert etag

    cached_req = make_mocked_request(
        "GET",
        f"/mjr/am/workflows/graph-map-thumbnail?filepath={workflow_path.as_posix()}",
        headers={"If-None-Match": etag},
        app=app,
    )
    cached_match = await app.router.resolve(cached_req)
    cached_resp = await cached_match.handler(cached_req)

    assert cached_resp.status == 304
    assert cached_resp.headers.get("ETag") == etag
    assert cached_resp.headers.get("Cache-Control") == "private, max-age=300"


@pytest.mark.asyncio
async def test_workflow_model_families_returns_indexed_values(monkeypatch, tmp_path):
    workflow_dir = tmp_path / "workflows"
    workflow_dir.mkdir()
    (workflow_dir / "flux.json").write_text(
        json.dumps({"name": "Flux Demo", "model_family": "Flux", "nodes": [{"id": 1, "type": "KSampler"}]}),
        encoding="utf-8",
    )
    monkeypatch.setenv("MJR_AM_WORKFLOW_DIRECTORY", str(workflow_dir))
    monkeypatch.setattr(workflows_routes, "list_workflow_model_families", lambda: Result.Ok({"model_families": [{"label": "Flux", "value": "Flux", "count": 1}]}))

    app = _build_app()
    req = make_mocked_request("GET", "/mjr/am/workflows/model-families", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)

    assert body.get("ok") is True
    families = body.get("data", {}).get("model_families", [])
    assert families and families[0]["value"] == "Flux"


@pytest.mark.asyncio
async def test_workflow_graph_map_thumbnail_rejects_outside_path(monkeypatch, tmp_path):
    workflow_dir = tmp_path / "workflows"
    workflow_dir.mkdir()
    outside = tmp_path / "outside.json"
    outside.write_text(json.dumps({"name": "Outside", "nodes": []}), encoding="utf-8")
    monkeypatch.setenv("MJR_AM_WORKFLOW_DIRECTORY", str(workflow_dir))

    app = _build_app()
    req = make_mocked_request(
        "GET",
        f"/mjr/am/workflows/graph-map-thumbnail?filepath={outside.as_posix()}",
        app=app,
    )
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)

    assert body.get("ok") is False
    assert body.get("code") == "FORBIDDEN"


@pytest.mark.asyncio
async def test_workflow_write_remote_denial(monkeypatch):
    monkeypatch.setattr(workflows_routes, "_csrf_error", lambda request: None)
    monkeypatch.setattr(
        workflows_routes,
        "_require_write_access",
        lambda request: Result.Err("AUTH_REQUIRED", "Write access denied"),
    )

    app = _build_app()
    req = make_mocked_request("POST", "/mjr/am/workflows/delete", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)

    assert body.get("ok") is False
    assert body.get("code") == "AUTH_REQUIRED"


@pytest.mark.asyncio
async def test_workflow_favorite_rejects_missing_filepath(monkeypatch):
    monkeypatch.setattr(workflows_routes, "_csrf_error", lambda request: None)
    monkeypatch.setattr(workflows_routes, "_require_write_access", lambda request: Result.Ok(True))

    async def _json_without_filepath(_request):
        return Result.Ok({"favorite": True})

    monkeypatch.setattr(workflows_routes, "_read_json", _json_without_filepath)

    app = _build_app()
    req = make_mocked_request("POST", "/mjr/am/workflows/favorite", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)

    assert body.get("ok") is False
    assert body.get("code") == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_workflow_tags_rejects_missing_filepath(monkeypatch):
    monkeypatch.setattr(workflows_routes, "_csrf_error", lambda request: None)
    monkeypatch.setattr(workflows_routes, "_require_write_access", lambda request: Result.Ok(True))

    async def _json_without_filepath(_request):
        return Result.Ok({"tags": ["cinematic"]})

    monkeypatch.setattr(workflows_routes, "_read_json", _json_without_filepath)

    app = _build_app()
    req = make_mocked_request("POST", "/mjr/am/workflows/tags", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)

    assert body.get("ok") is False
    assert body.get("code") == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_workflow_tags_accepts_valid_payload(monkeypatch, tmp_path):
    workflow_dir = tmp_path / "workflows"
    index_db = tmp_path / "index.sqlite"
    workflow_dir.mkdir()
    workflow_path = workflow_dir / "taggable.json"
    original = json.dumps({"name": "Taggable", "nodes": [{"id": 1, "type": "KSampler"}]})
    workflow_path.write_text(original, encoding="utf-8")
    monkeypatch.setenv("MJR_AM_WORKFLOW_DIRECTORY", str(workflow_dir))
    monkeypatch.setattr(workflows_service, "get_runtime_index_db_path", lambda: index_db)
    monkeypatch.setattr(workflows_routes, "_csrf_error", lambda request: None)
    monkeypatch.setattr(workflows_routes, "_require_write_access", lambda request: Result.Ok(True))

    async def _json_with_tags(_request):
        return Result.Ok({"filepath": str(workflow_path), "tags": ["cinematic", "flux"]})

    monkeypatch.setattr(workflows_routes, "_read_json", _json_with_tags)

    app = _build_app()
    req = make_mocked_request("POST", "/mjr/am/workflows/tags", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)

    assert body.get("ok") is True
    assert body.get("data", {}).get("tags") == ["cinematic", "flux"]
    assert workflow_path.read_text(encoding="utf-8") == original


@pytest.mark.asyncio
async def test_workflow_thumbnail_candidates_rejects_missing_filepath(monkeypatch):
    app = _build_app()
    req = make_mocked_request("GET", "/mjr/am/workflows/thumbnail-candidates", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)

    assert body.get("ok") is False
    assert body.get("code") == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_workflow_thumbnail_rejects_missing_source(monkeypatch):
    workflow_dir = tempfile.mkdtemp()
    monkeypatch.setenv("MJR_AM_WORKFLOW_DIRECTORY", workflow_dir)
    monkeypatch.setattr(workflows_routes, "_csrf_error", lambda request: None)
    monkeypatch.setattr(workflows_routes, "_require_write_access", lambda request: Result.Ok(True))

    workflow_path = f"{workflow_dir}/demo.json"
    with open(workflow_path, "w", encoding="utf-8") as handle:
        json.dump({"name": "Demo", "nodes": []}, handle)

    async def _json_without_source(_request):
        return Result.Ok({"filepath": workflow_path})

    monkeypatch.setattr(workflows_routes, "_read_json", _json_without_source)

    app = _build_app()
    req = make_mocked_request("POST", "/mjr/am/workflows/thumbnail/set", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)

    assert body.get("ok") is False
    assert body.get("code") == "INVALID_INPUT"
