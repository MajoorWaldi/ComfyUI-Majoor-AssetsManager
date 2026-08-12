"""Tests for the ``/api/v2/assets/*`` OpenAPI compat layer."""

import json

import pytest
from aiohttp import web
from aiohttp.test_utils import make_mocked_request
from mjr_am_backend.routes.handlers import api_v2_assets
from mjr_am_backend.shared import Result

# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #


def _build_app() -> web.Application:
    app = web.Application()
    routes = web.RouteTableDef()
    api_v2_assets.register_api_v2_asset_routes(routes)
    app.add_routes(routes)
    return app


class _FakeDB:
    """Tiny stand-in for the SQLite facade used by the compat layer."""

    def __init__(self, query_handler) -> None:
        self._handler = query_handler

    async def aquery(self, sql, params=None):
        return self._handler(sql, params)


def _row(**overrides):
    base = {
        "id": 1,
        "filename": "pic.png",
        "filepath": "/tmp/pic.png",
        "subfolder": "",
        "source": "output",
        "root_id": None,
        "kind": "image",
        "ext": ".png",
        "size": 1024,
        "mtime": 1_700_000_000,
        "width": 512,
        "height": 512,
        "duration": None,
        "created_at": "2026-05-01 12:00:00",
        "updated_at": "2026-05-02 12:00:00",
        "indexed_at": "2026-05-02 12:00:00",
        "content_hash": "blake3:" + "a" * 64,
        "phash": None,
        "hash_algo": "blake3",
        "enrichment_level": 2,
        "job_id": "job-xyz",
        "stack_id": None,
        "workflow_id": "wf-1",
        "source_node_id": "9",
        "source_node_type": "SaveImage",
        "tags": '["cat","cute"]',
        "metadata_raw": '{"foo":"bar"}',
        "workflow_type": "T2I",
        "metadata_quality": "full",
        "has_workflow": 1,
        "has_generation_data": 1,
        "generation_time_ms": 4200,
    }
    base.update(overrides)
    return base


# --------------------------------------------------------------------------- #
# _row_to_asset (unit, no app)
# --------------------------------------------------------------------------- #


def test_row_to_asset_shapes_fields_correctly():
    asset = api_v2_assets._row_to_asset(_row())
    assert asset["id"] == "1"
    assert asset["name"] == "pic.png"
    assert asset["size"] == 1024
    assert asset["width"] == 512
    assert asset["height"] == 512
    assert asset["mime_type"] == "image/png"
    assert asset["tags"] == ["cat", "cute"]
    assert asset["user_metadata"] == {"foo": "bar"}
    assert asset["hash"] == "blake3:" + "a" * 64
    assert asset["asset_hash"] == asset["hash"]
    assert asset["job_id"] == "job-xyz"
    assert asset["prompt_id"] == "job-xyz"  # deprecated alias
    assert asset["is_immutable"] is False
    assert asset["created_at"].startswith("2026-05-01")
    assert asset["metadata"]["workflow_id"] == "wf-1"
    assert asset["metadata"]["source_node_type"] == "SaveImage"


def test_row_to_asset_omits_hash_when_algo_not_blake3():
    asset = api_v2_assets._row_to_asset(
        _row(hash_algo="sha256", content_hash="deadbeef")
    )
    assert "hash" not in asset
    assert "asset_hash" not in asset


def test_resolve_asset_id_numeric_vs_blake3():
    where, params = api_v2_assets._resolve_asset_id("42")
    assert "a.id = ?" in where
    assert params == (42,)

    where, params = api_v2_assets._resolve_asset_id("blake3:" + "b" * 64)
    assert "content_hash" in where
    assert params == ("b" * 64, "blake3:" + "b" * 64)


# --------------------------------------------------------------------------- #
# Route-level
# --------------------------------------------------------------------------- #


@pytest.mark.asyncio
async def test_list_endpoint_returns_paginated_payload(monkeypatch):
    def _handle(sql, params):
        if "COUNT(*)" in sql:
            return Result.Ok([{"n": 3}])
        return Result.Ok([_row(id=1), _row(id=2, filename="other.jpg", ext=".jpg")])

    async def _services():
        return {"db": _FakeDB(_handle)}, None

    monkeypatch.setattr(api_v2_assets, "_require_services", _services)

    app = _build_app()
    req = make_mocked_request("GET", "/api/v2/assets?limit=2&offset=0", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert resp.status == 200
    assert payload["total"] == 3
    assert payload["has_more"] is True
    assert len(payload["assets"]) == 2
    assert payload["assets"][0]["name"] == "pic.png"
    assert payload["assets"][1]["mime_type"] == "image/jpeg"


@pytest.mark.asyncio
async def test_get_endpoint_returns_404_when_missing(monkeypatch):
    def _handle(sql, params):
        return Result.Ok([])

    async def _services():
        return {"db": _FakeDB(_handle)}, None

    monkeypatch.setattr(api_v2_assets, "_require_services", _services)

    app = _build_app()
    req = make_mocked_request("GET", "/api/v2/assets/999", app=app)
    req.match_info["id"] = "999"
    resp = await api_v2_assets._get_asset(req)
    assert resp.status == 404


@pytest.mark.asyncio
async def test_get_endpoint_returns_asset(monkeypatch):
    def _handle(sql, params):
        return Result.Ok([_row()])

    async def _services():
        return {"db": _FakeDB(_handle)}, None

    monkeypatch.setattr(api_v2_assets, "_require_services", _services)
    req = make_mocked_request("GET", "/api/v2/assets/1")
    req.match_info["id"] = "1"
    resp = await api_v2_assets._get_asset(req)
    assert resp.status == 200
    body = json.loads(resp.text)
    assert body["id"] == "1"
    assert body["tags"] == ["cat", "cute"]


@pytest.mark.asyncio
async def test_hash_check_returns_200_on_match(monkeypatch):
    def _handle(sql, params):
        return Result.Ok([{"1": 1}])

    async def _services():
        return {"db": _FakeDB(_handle)}, None

    monkeypatch.setattr(api_v2_assets, "_require_services", _services)
    req = make_mocked_request("HEAD", f"/api/v2/assets/hash/{'a' * 64}")
    req.match_info["hash"] = "a" * 64
    resp = await api_v2_assets._check_asset_by_hash(req)
    assert resp.status == 200


@pytest.mark.asyncio
async def test_hash_check_returns_404_when_missing(monkeypatch):
    def _handle(sql, params):
        return Result.Ok([])

    async def _services():
        return {"db": _FakeDB(_handle)}, None

    monkeypatch.setattr(api_v2_assets, "_require_services", _services)
    req = make_mocked_request("HEAD", f"/api/v2/assets/hash/blake3:{'b' * 64}")
    req.match_info["hash"] = "blake3:" + "b" * 64
    resp = await api_v2_assets._check_asset_by_hash(req)
    assert resp.status == 404


@pytest.mark.asyncio
async def test_hash_check_rejects_malformed_input(monkeypatch):
    async def _services():
        return {"db": _FakeDB(lambda *_: Result.Ok([]))}, None

    monkeypatch.setattr(api_v2_assets, "_require_services", _services)
    req = make_mocked_request("HEAD", "/api/v2/assets/hash/notahash")
    req.match_info["hash"] = "notahash"
    resp = await api_v2_assets._check_asset_by_hash(req)
    assert resp.status == 404


@pytest.mark.asyncio
async def test_tags_endpoint_returns_tags(monkeypatch):
    def _handle(sql, params):
        return Result.Ok([_row()])

    async def _services():
        return {"db": _FakeDB(_handle)}, None

    monkeypatch.setattr(api_v2_assets, "_require_services", _services)
    req = make_mocked_request("GET", "/api/v2/assets/1/tags")
    req.match_info["id"] = "1"
    resp = await api_v2_assets._get_asset_tags(req)
    assert resp.status == 200
    body = json.loads(resp.text)
    assert body == {"tags": ["cat", "cute"]}


@pytest.mark.asyncio
async def test_content_endpoint_returns_404_when_path_disallowed(monkeypatch):
    def _handle(sql, params):
        return Result.Ok([_row(filepath="/nowhere/missing.png")])

    async def _services():
        return {"db": _FakeDB(_handle)}, None

    monkeypatch.setattr(api_v2_assets, "_require_services", _services)
    monkeypatch.setattr(api_v2_assets, "_is_path_allowed", lambda *a, **kw: False)

    req = make_mocked_request("GET", "/api/v2/assets/1/content")
    req.match_info["id"] = "1"
    resp = await api_v2_assets._get_asset_content(req)
    assert resp.status == 404


# --------------------------------------------------------------------------- #
# workflow_id hoist (top-level + user_metadata fallback)
# --------------------------------------------------------------------------- #


def test_row_to_asset_hoists_workflow_id_to_top_level():
    asset = api_v2_assets._row_to_asset(_row(workflow_id="wf-direct"))
    assert asset["workflow_id"] == "wf-direct"
    assert asset["metadata"]["workflow_id"] == "wf-direct"


def test_row_to_asset_falls_back_to_user_metadata_workflow_id():
    raw = json.dumps({"workflow": {"id": "wf-from-meta"}, "foo": "bar"})
    asset = api_v2_assets._row_to_asset(_row(workflow_id="", metadata_raw=raw))
    assert asset["workflow_id"] == "wf-from-meta"


def test_row_to_asset_omits_workflow_id_when_absent_everywhere():
    asset = api_v2_assets._row_to_asset(_row(workflow_id="", metadata_raw="{}"))
    assert "workflow_id" not in asset


# --------------------------------------------------------------------------- #
# /api/v2/assets/seed/status
# --------------------------------------------------------------------------- #


@pytest.mark.asyncio
async def test_seed_status_reports_totals_and_breakdown(monkeypatch):
    def _handle(sql, params):
        if "GROUP BY enrichment_level" in sql:
            return Result.Ok([
                {"lvl": 0, "n": 4},
                {"lvl": 1, "n": 7},
                {"lvl": 2, "n": 11},
            ])
        if "COUNT(*)" in sql:
            return Result.Ok([{"n": 22}])
        return Result.Ok([])

    async def _services():
        return {"db": _FakeDB(_handle)}, None

    monkeypatch.setattr(api_v2_assets, "_require_services", _services)
    req = make_mocked_request("GET", "/api/v2/assets/seed/status")
    resp = await api_v2_assets._seed_status(req)
    body = json.loads(resp.text)
    if resp.status != 200:
        pytest.fail(f"expected 200, got {resp.status}: {body}")
    if body["state"] != "idle":
        pytest.fail(f"expected state=idle, got {body['state']}")
    if body["total"] != 22:
        pytest.fail(f"expected total=22, got {body['total']}")
    if body["enriched"] != 18:
        pytest.fail(f"expected enriched=18 (lvl>=1 = 7+11), got {body['enriched']}")
    if body["pending"] != 4:
        pytest.fail(f"expected pending=4 (lvl 0), got {body['pending']}")
    if body["by_enrichment_level"] != {"0": 4, "1": 7, "2": 11}:
        pytest.fail(f"unexpected breakdown: {body['by_enrichment_level']}")


@pytest.mark.asyncio
async def test_seed_status_handles_empty_db(monkeypatch):
    def _handle(sql, params):
        if "GROUP BY enrichment_level" in sql:
            return Result.Ok([])
        if "COUNT(*)" in sql:
            return Result.Ok([{"n": 0}])
        return Result.Ok([])

    async def _services():
        return {"db": _FakeDB(_handle)}, None

    monkeypatch.setattr(api_v2_assets, "_require_services", _services)
    req = make_mocked_request("GET", "/api/v2/assets/seed/status")
    resp = await api_v2_assets._seed_status(req)
    body = json.loads(resp.text)
    if resp.status != 200:
        pytest.fail(f"expected 200, got {resp.status}: {body}")
    if body["total"] != 0 or body["enriched"] != 0 or body["pending"] != 0:
        pytest.fail(f"expected zeros, got {body}")
    if body["by_enrichment_level"] != {}:
        pytest.fail(f"expected empty dict, got {body['by_enrichment_level']}")


# --------------------------------------------------------------------------- #
# /api/v2/assets/tags/refine
# --------------------------------------------------------------------------- #


@pytest.mark.asyncio
async def test_tags_refine_returns_histogram(monkeypatch):
    captured: dict = {}

    def _handle(sql, params):
        captured["sql"] = sql
        captured["params"] = params
        return Result.Ok([
            {"name": "cat", "count": 12},
            {"name": "cute", "count": 9},
            {"name": "dog", "count": 4},
        ])

    async def _services():
        return {"db": _FakeDB(_handle)}, None

    monkeypatch.setattr(api_v2_assets, "_require_services", _services)
    req = make_mocked_request(
        "GET",
        "/api/v2/assets/tags/refine?include_tags=cat&exclude_tags=blurry&limit=10",
    )
    resp = await api_v2_assets._tags_refine(req)
    body = json.loads(resp.text)
    if resp.status != 200:
        pytest.fail(f"expected 200, got {resp.status}: {body}")
    if body["total"] != 3:
        pytest.fail(f"expected total=3, got {body['total']}")
    if body["tags"][0] != {"name": "cat", "count": 12}:
        pytest.fail(f"unexpected top tag: {body['tags'][0]}")
    # SQL should reference the normalized tables and pass the limit last.
    if "asset_tags at" not in captured["sql"] or "tags t" not in captured["sql"]:
        pytest.fail(f"SQL missing normalized joins: {captured['sql']}")
    if captured["params"][-1] != 10:
        pytest.fail(f"limit not appended, got params={captured['params']}")


@pytest.mark.asyncio
async def test_tags_refine_handles_no_filters(monkeypatch):
    def _handle(sql, params):
        return Result.Ok([])

    async def _services():
        return {"db": _FakeDB(_handle)}, None

    monkeypatch.setattr(api_v2_assets, "_require_services", _services)
    req = make_mocked_request("GET", "/api/v2/assets/tags/refine")
    resp = await api_v2_assets._tags_refine(req)
    body = json.loads(resp.text)
    if resp.status != 200:
        pytest.fail(f"expected 200, got {resp.status}: {body}")
    if body != {"tags": [], "total": 0}:
        pytest.fail(f"unexpected empty payload: {body}")


# --------------------------------------------------------------------------- #
# Route registration: static paths must resolve before /{id}
# --------------------------------------------------------------------------- #


@pytest.mark.asyncio
async def test_seed_status_is_not_eaten_by_id_route(monkeypatch):
    """Regression guard: /seed/status must hit _seed_status, not _get_asset."""

    async def _services():
        return {"db": _FakeDB(lambda *_: Result.Ok([{"n": 0}]))}, None

    monkeypatch.setattr(api_v2_assets, "_require_services", _services)
    app = _build_app()
    req = make_mocked_request("GET", "/api/v2/assets/seed/status", app=app)
    match = await app.router.resolve(req)
    if match.handler is not api_v2_assets._seed_status:
        pytest.fail(f"seed/status routed to {match.handler.__name__}")


@pytest.mark.asyncio
async def test_tags_refine_is_not_eaten_by_id_route(monkeypatch):
    async def _services():
        return {"db": _FakeDB(lambda *_: Result.Ok([]))}, None

    monkeypatch.setattr(api_v2_assets, "_require_services", _services)
    app = _build_app()
    req = make_mocked_request("GET", "/api/v2/assets/tags/refine", app=app)
    match = await app.router.resolve(req)
    if match.handler is not api_v2_assets._tags_refine:
        pytest.fail(f"tags/refine routed to {match.handler.__name__}")
# Versioned API errors use HTTP semantics even though legacy /mjr/am routes
# retain their historical HTTP-200 envelope for compatibility.
def test_api_error_response_maps_stable_codes_to_http_statuses():
    invalid = api_v2_assets._api_error_response(Result.Err("INVALID_INPUT", "Bad request"))
    unavailable = api_v2_assets._api_error_response(
        Result.Err("SERVICE_UNAVAILABLE", "Database unavailable")
    )

    assert invalid.status == 400
    assert unavailable.status == 503
