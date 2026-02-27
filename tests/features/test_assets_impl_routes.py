import asyncio
import json
from pathlib import Path

import pytest
from aiohttp import web
from aiohttp.test_utils import make_mocked_request

from mjr_am_backend.routes.handlers import assets_impl as m
from mjr_am_backend.shared import Result


def _app():
    app = web.Application()
    routes = web.RouteTableDef()
    m.register_asset_routes(routes)
    app.add_routes(routes)
    return app


@pytest.mark.asyncio
async def test_assets_list_routes_success():
    app = _app()
    req = make_mocked_request("GET", "/mjr/am/routes", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is True
    assert any((r or {}).get("path") == "/mjr/am/asset/tags" for r in payload.get("data", {}).get("routes", []))


@pytest.mark.asyncio
async def test_retry_services_csrf_and_success_and_failure(monkeypatch):
    app = _app()

    monkeypatch.setattr(m, "_csrf_error", lambda _request: "bad")
    req1 = make_mocked_request("POST", "/mjr/am/retry-services", app=app)
    match1 = await app.router.resolve(req1)
    resp1 = await match1.handler(req1)
    payload1 = json.loads(resp1.text)
    assert payload1.get("code") == "CSRF"

    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    async def _build_services_ok(force=True):
        _ = force
        return {"ok": True}

    monkeypatch.setattr(m, "_build_services", _build_services_ok)
    req2 = make_mocked_request("POST", "/mjr/am/retry-services", app=app)
    match2 = await app.router.resolve(req2)
    resp2 = await match2.handler(req2)
    payload2 = json.loads(resp2.text)
    assert payload2.get("ok") is True

    async def _build_services_fail(force=True):
        _ = force
        return None

    monkeypatch.setattr(m, "_build_services", _build_services_fail)
    monkeypatch.setattr(m, "get_services_error", lambda: "boom")
    req3 = make_mocked_request("POST", "/mjr/am/retry-services", app=app)
    match3 = await app.router.resolve(req3)
    resp3 = await match3.handler(req3)
    payload3 = json.loads(resp3.text)
    assert payload3.get("code") == "SERVICE_UNAVAILABLE"


@pytest.mark.asyncio
async def test_asset_tags_validation_branches(monkeypatch):
    app = _app()

    class _Index:
        called = None

        async def update_asset_tags(self, asset_id, tags):
            self.called = (asset_id, tags)
            return Result.Err("UPDATE_FAILED", "forced")

    idx = _Index()

    async def _require_services():
        return {"index": idx}, None

    async def _read_json_not_list(_request):
        return Result.Ok({"asset_id": 1, "tags": "x"})

    async def _read_json_too_many(_request):
        return Result.Ok({"asset_id": 1, "tags": [str(i) for i in range(m.MAX_TAGS_PER_ASSET + 1)]})

    async def _read_json_sanitize(_request):
        return Result.Ok(
            {
                "asset_id": "7",
                "tags": [" Cat ", "cat", "", "Dog", 42, "x" * 300],
            }
        )

    async def _prefs(_svc):
        return {}

    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_services", _require_services)
    monkeypatch.setattr(m, "_resolve_security_prefs", _prefs)
    monkeypatch.setattr(m, "_require_operation_enabled", lambda *_args, **_kwargs: Result.Ok({}))
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "_check_rate_limit", lambda *_args, **_kwargs: (True, None))

    monkeypatch.setattr(m, "_read_json", _read_json_not_list)
    req1 = make_mocked_request("POST", "/mjr/am/asset/tags", app=app)
    match1 = await app.router.resolve(req1)
    resp1 = await match1.handler(req1)
    payload1 = json.loads(resp1.text)
    assert payload1.get("code") == "INVALID_INPUT"

    monkeypatch.setattr(m, "_read_json", _read_json_too_many)
    req2 = make_mocked_request("POST", "/mjr/am/asset/tags", app=app)
    match2 = await app.router.resolve(req2)
    resp2 = await match2.handler(req2)
    payload2 = json.loads(resp2.text)
    assert payload2.get("code") == "INVALID_INPUT"

    monkeypatch.setattr(m, "_read_json", _read_json_sanitize)
    req3 = make_mocked_request("POST", "/mjr/am/asset/tags", app=app)
    match3 = await app.router.resolve(req3)
    resp3 = await match3.handler(req3)
    payload3 = json.loads(resp3.text)
    assert payload3.get("ok") is False
    assert idx.called == (7, ["Cat", "Dog"])


@pytest.mark.asyncio
async def test_download_asset_not_found(monkeypatch, tmp_path: Path):
    app = web.Application()
    app.router.add_get("/mjr/am/asset/download", m.download_asset)
    monkeypatch.setattr(m, "_check_rate_limit", lambda *_args, **_kwargs: (True, None))
    monkeypatch.setattr(m, "_resolve_download_path", lambda _filepath: web.Response(status=404, text="File not found"))

    req = make_mocked_request("GET", "/mjr/am/asset/download?filepath=x.png", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    assert resp.status == 404


def _json(resp):
    return json.loads(resp.text)


class _DummyTx:
    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False


class _DummyDB:
    def __init__(self):
        self.queries = []
        self.execs = []
        self.query_rows = []

    async def aquery(self, sql, params=()):
        self.queries.append((sql, params))
        if "FROM assets WHERE id" in sql:
            return Result.Ok(self.query_rows)
        if "FROM asset_metadata" in sql:
            return Result.Ok([{"rating": 4, "tags": '["a","b"]'}])
        return Result.Ok([])

    async def aquery_in(self, _sql, _column, values):
        return Result.Ok([{"id": int(v), "filepath": str(Path("tmp") / f"{int(v)}.png")} for v in values])

    async def aexecute(self, sql, params=()):
        self.execs.append((sql, params))
        return Result.Ok(1)

    def atransaction(self, mode="immediate"):
        _ = mode
        return _DummyTx()


@pytest.mark.asyncio
async def test_asset_rating_paths(monkeypatch):
    app = _app()

    class _Index:
        async def update_asset_rating(self, asset_id, rating):
            return Result.Ok({"id": asset_id, "rating": rating})

    async def _prefs(_svc):
        return {}

    async def _require_services():
        return {"index": _Index()}, None

    async def _read_json_bad(_request):
        return Result.Ok({"asset_id": "x", "rating": 3})

    async def _read_json_good(_request):
        return Result.Ok({"asset_id": 8, "rating": 999})

    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_services", _require_services)
    monkeypatch.setattr(m, "_resolve_security_prefs", _prefs)
    monkeypatch.setattr(m, "_require_operation_enabled", lambda *_args, **_kwargs: Result.Ok({}))
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "_check_rate_limit", lambda *_args, **_kwargs: (True, None))

    monkeypatch.setattr(m, "_read_json", _read_json_bad)
    req1 = make_mocked_request("POST", "/mjr/am/asset/rating", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    assert _json(resp1).get("code") == "INVALID_INPUT"

    monkeypatch.setattr(m, "_read_json", _read_json_good)
    req2 = make_mocked_request("POST", "/mjr/am/asset/rating", app=app)
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    data2 = _json(resp2)
    assert data2.get("ok") is True


@pytest.mark.asyncio
async def test_asset_tags_rate_limit_and_read_error(monkeypatch):
    app = _app()

    async def _require_services():
        return {"index": object()}, None

    async def _prefs(_svc):
        return {}

    async def _read_json_err(_request):
        return Result.Err("INVALID_JSON", "bad")

    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_services", _require_services)
    monkeypatch.setattr(m, "_resolve_security_prefs", _prefs)
    monkeypatch.setattr(m, "_require_operation_enabled", lambda *_args, **_kwargs: Result.Ok({}))
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))

    monkeypatch.setattr(m, "_check_rate_limit", lambda *_args, **_kwargs: (False, 9))
    req1 = make_mocked_request("POST", "/mjr/am/asset/tags", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    assert _json(resp1).get("code") == "RATE_LIMITED"

    monkeypatch.setattr(m, "_check_rate_limit", lambda *_args, **_kwargs: (True, None))
    monkeypatch.setattr(m, "_read_json", _read_json_err)
    req2 = make_mocked_request("POST", "/mjr/am/asset/tags", app=app)
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    assert _json(resp2).get("code") == "INVALID_JSON"


@pytest.mark.asyncio
async def test_open_in_folder_main_branches(monkeypatch, tmp_path: Path):
    app = _app()
    f = tmp_path / "a.png"
    f.write_bytes(b"x")

    db = _DummyDB()
    db.query_rows = [{"filepath": str(f)}]

    async def _require_services():
        return {"db": db}, None

    async def _prefs(_svc):
        return {}

    async def _read_json(_request):
        return Result.Ok({"asset_id": 1})

    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_services", _require_services)
    monkeypatch.setattr(m, "_resolve_security_prefs", _prefs)
    monkeypatch.setattr(m, "_require_operation_enabled", lambda *_args, **_kwargs: Result.Ok({}))
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "_check_rate_limit", lambda *_args, **_kwargs: (True, None))
    monkeypatch.setattr(m, "_read_json", _read_json)
    monkeypatch.setattr(m, "_is_resolved_path_allowed", lambda _p: True)
    monkeypatch.setattr(m.shutil, "which", lambda _cmd: None)

    req1 = make_mocked_request("POST", "/mjr/am/open-in-folder", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    payload = _json(resp1)
    assert payload.get("code") in {"DEGRADED", "OK", None}


@pytest.mark.asyncio
async def test_get_tags_success_and_error(monkeypatch):
    app = _app()

    class _Index1:
        async def get_all_tags(self):
            return Result.Ok(["x", "y"])

    async def _s1():
        return {"index": _Index1()}, None

    monkeypatch.setattr(m, "_require_services", _s1)
    req1 = make_mocked_request("GET", "/mjr/am/tags", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    assert _json(resp1).get("ok") is True

    class _Index2:
        async def get_all_tags(self):
            raise RuntimeError("boom")

    async def _s2():
        return {"index": _Index2()}, None

    monkeypatch.setattr(m, "_require_services", _s2)
    req2 = make_mocked_request("GET", "/mjr/am/tags", app=app)
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    assert _json(resp2).get("code") == "DB_ERROR"


@pytest.mark.asyncio
async def test_delete_asset_validation_paths(monkeypatch, tmp_path: Path):
    app = _app()

    async def _prefs(_svc):
        return {}

    async def _svc_none():
        return {}, Result.Err("SERVICE_UNAVAILABLE", "x")

    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_services", _svc_none)
    req0 = make_mocked_request("POST", "/mjr/am/asset/delete", app=app)
    resp0 = await (await app.router.resolve(req0)).handler(req0)
    assert _json(resp0).get("code") == "SERVICE_UNAVAILABLE"

    db = _DummyDB()

    async def _svc_ok():
        return {"db": db}, None

    async def _read_json(_request):
        return Result.Ok({})

    monkeypatch.setattr(m, "_require_services", _svc_ok)
    monkeypatch.setattr(m, "_resolve_security_prefs", _prefs)
    monkeypatch.setattr(m, "_require_operation_enabled", lambda *_args, **_kwargs: Result.Ok({}))
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "_check_rate_limit", lambda *_args, **_kwargs: (True, None))
    monkeypatch.setattr(m, "_read_json", _read_json)

    req1 = make_mocked_request("POST", "/mjr/am/asset/delete", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    assert _json(resp1).get("code") == "INVALID_INPUT"

    f = tmp_path / "d.png"
    f.write_bytes(b"z")

    async def _read_json2(_request):
        return Result.Ok({"filepath": str(f)})

    monkeypatch.setattr(m, "_read_json", _read_json2)
    monkeypatch.setattr(m, "_normalize_path", lambda v: Path(v) if v else None)
    monkeypatch.setattr(m, "_is_resolved_path_allowed", lambda _p: True)
    monkeypatch.setattr(m, "_delete_file_best_effort", lambda _p: Result.Ok(True))

    req2 = make_mocked_request("POST", "/mjr/am/asset/delete", app=app)
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    assert _json(resp2).get("ok") is True


@pytest.mark.asyncio
async def test_rename_asset_validation_and_conflict(monkeypatch, tmp_path: Path):
    app = _app()
    f = tmp_path / "a.png"
    f.write_bytes(b"x")
    conflict = tmp_path / "b.png"
    conflict.write_bytes(b"y")

    db = _DummyDB()
    db.query_rows = [{"filepath": str(f), "filename": "a.png", "source": "output", "root_id": ""}]

    async def _svc_ok():
        return {"db": db, "index": object()}, None

    async def _prefs(_svc):
        return {}

    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_services", _svc_ok)
    monkeypatch.setattr(m, "_resolve_security_prefs", _prefs)
    monkeypatch.setattr(m, "_require_operation_enabled", lambda *_args, **_kwargs: Result.Ok({}))
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "_is_resolved_path_allowed", lambda _p: True)

    async def _read_missing(_request):
        return Result.Ok({"asset_id": 1})

    monkeypatch.setattr(m, "_read_json", _read_missing)
    req1 = make_mocked_request("POST", "/mjr/am/asset/rename", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    assert _json(resp1).get("code") == "INVALID_INPUT"

    async def _read_conflict(_request):
        return Result.Ok({"asset_id": 1, "new_name": conflict.name})

    monkeypatch.setattr(m, "_read_json", _read_conflict)
    req2 = make_mocked_request("POST", "/mjr/am/asset/rename", app=app)
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    assert _json(resp2).get("code") == "CONFLICT"


@pytest.mark.asyncio
async def test_assets_delete_bulk_paths(monkeypatch, tmp_path: Path):
    app = _app()

    files = []
    for i in [1, 2]:
        p = tmp_path / f"{i}.png"
        p.write_bytes(b"x")
        files.append(p)

    db = _DummyDB()

    async def _svc_ok():
        return {"db": db}, None

    async def _prefs(_svc):
        return {}

    async def _read_json_invalid(_request):
        return Result.Ok({"ids": "bad"})

    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_services", _svc_ok)
    monkeypatch.setattr(m, "_resolve_security_prefs", _prefs)
    monkeypatch.setattr(m, "_require_operation_enabled", lambda *_args, **_kwargs: Result.Ok({}))
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "_check_rate_limit", lambda *_args, **_kwargs: (True, None))
    monkeypatch.setattr(m, "_normalize_path", lambda v: Path(v) if v else None)
    monkeypatch.setattr(m, "_is_path_allowed", lambda *_args, **_kwargs: True)
    monkeypatch.setattr(m, "_is_path_allowed_custom", lambda *_args, **_kwargs: False)
    monkeypatch.setattr(m, "_is_resolved_path_allowed", lambda _p: True)

    monkeypatch.setattr(m, "_read_json", _read_json_invalid)
    req1 = make_mocked_request("POST", "/mjr/am/assets/delete", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    assert _json(resp1).get("code") == "INVALID_INPUT"

    async def _read_json_ok(_request):
        return Result.Ok({"ids": [1, 2]})

    async def _aquery_in(_sql, _col, values):
        return Result.Ok([{"id": 1, "filepath": str(files[0])}, {"id": 2, "filepath": str(files[1])}])

    db.aquery_in = _aquery_in
    monkeypatch.setattr(m, "_read_json", _read_json_ok)
    monkeypatch.setattr(m, "_delete_file_best_effort", lambda _p: Result.Ok(True))

    req2 = make_mocked_request("POST", "/mjr/am/assets/delete", app=app)
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    assert _json(resp2).get("ok") is True


def test_download_helpers_unit(monkeypatch, tmp_path: Path):
    req = make_mocked_request("GET", "/mjr/am/asset/download?preview=true")
    assert m._is_preview_download_request(req) is True

    monkeypatch.setattr(m, "_check_rate_limit", lambda *_args, **_kwargs: (False, 3))
    rl = m._download_rate_limit_response_or_none(req, preview=False)
    assert rl is not None and rl.status == 429

    f = tmp_path / "x.png"
    f.write_bytes(b"x")
    monkeypatch.setattr(m, "_normalize_path", lambda _v: f)
    monkeypatch.setattr(m, "_is_resolved_path_allowed", lambda _p: True)
    out = m._resolve_download_path("x")
    assert isinstance(out, Path)

    resp = m._build_download_response(f, preview=True)
    assert resp is not None
    assert m._safe_download_filename('a";\r\n') == "a"

@pytest.mark.asyncio
async def test_asset_rating_resolve_or_create_path(monkeypatch, tmp_path: Path):
    app = _app()
    f = tmp_path / "q.png"
    f.write_bytes(b"x")

    class _Index:
        async def index_paths(self, *_args, **_kwargs):
            return Result.Ok({})

        async def update_asset_rating(self, asset_id, rating):
            return Result.Ok({"asset_id": asset_id, "rating": rating})

    db = _DummyDB()
    async def _aquery(sql, params=()):
        _ = params
        if "SELECT id FROM assets WHERE filepath" in sql:
            return Result.Ok([{"id": 42}])
        return Result.Ok([])

    db.aquery = _aquery

    async def _svc():
        return {"index": _Index(), "db": db}, None

    async def _prefs(_svc):
        return {}

    async def _read_json(_request):
        return Result.Ok({"filepath": str(f), "type": "output", "rating": 2})

    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_services", _svc)
    monkeypatch.setattr(m, "_resolve_security_prefs", _prefs)
    monkeypatch.setattr(m, "_require_operation_enabled", lambda *_args, **_kwargs: Result.Ok({}))
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "_check_rate_limit", lambda *_args, **_kwargs: (True, None))
    monkeypatch.setattr(m, "_read_json", _read_json)
    monkeypatch.setattr(m, "_normalize_path", lambda v: Path(v) if v else None)
    monkeypatch.setattr(m, "get_runtime_output_root", lambda: str(tmp_path))
    monkeypatch.setattr(m.folder_paths, "get_input_directory", lambda: str(tmp_path / "in"))
    monkeypatch.setattr(m, "_is_within_root", lambda p, r: str(p).startswith(str(r)))

    req = make_mocked_request("POST", "/mjr/am/asset/rating", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    assert _json(resp).get("ok") is True


@pytest.mark.asyncio
async def test_rename_asset_success_path(monkeypatch, tmp_path: Path):
    app = _app()
    f = tmp_path / "old.png"
    f.write_bytes(b"x")

    db = _DummyDB()

    async def aquery(sql, params=()):
        if "SELECT filepath, filename, source, root_id FROM assets" in sql:
            return Result.Ok([{"filepath": str(f), "filename": "old.png", "source": "output", "root_id": ""}])
        if "SELECT a.id" in sql:
            return Result.Ok([{"id": 1, "filename": "new.png"}])
        return Result.Ok([])

    db.aquery = aquery

    class _Index:
        async def index_paths(self, *_args, **_kwargs):
            return Result.Ok({})

    async def _svc():
        return {"db": db, "index": _Index()}, None

    async def _prefs(_svc):
        return {}

    async def _read_json(_request):
        return Result.Ok({"asset_id": 1, "new_name": "new.png"})

    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_services", _svc)
    monkeypatch.setattr(m, "_resolve_security_prefs", _prefs)
    monkeypatch.setattr(m, "_require_operation_enabled", lambda *_args, **_kwargs: Result.Ok({}))
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "_read_json", _read_json)
    monkeypatch.setattr(m, "_is_resolved_path_allowed", lambda _p: True)

    req = make_mocked_request("POST", "/mjr/am/asset/rename", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    payload = _json(resp)
    assert payload.get("ok") is True
    assert payload.get("data", {}).get("new_name") == "new.png"


@pytest.mark.asyncio
async def test_rename_asset_db_error_rollbacks(monkeypatch, tmp_path: Path):
    app = _app()
    f = tmp_path / "old2.png"
    f.write_bytes(b"x")

    class _DB2(_DummyDB):
        async def aquery(self, sql, params=()):
            if "SELECT filepath, filename, source, root_id FROM assets" in sql:
                return Result.Ok([{"filepath": str(f), "filename": "old2.png", "source": "", "root_id": ""}])
            return Result.Ok([])

        async def aexecute(self, sql, params=()):
            if "UPDATE assets SET" in sql:
                return Result.Err("DB_ERROR", "boom")
            return Result.Ok(1)

    async def _svc():
        return {"db": _DB2(), "index": object()}, None

    async def _prefs(_svc):
        return {}

    async def _read_json(_request):
        return Result.Ok({"asset_id": 1, "new_name": "new2.png"})

    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_services", _svc)
    monkeypatch.setattr(m, "_resolve_security_prefs", _prefs)
    monkeypatch.setattr(m, "_require_operation_enabled", lambda *_args, **_kwargs: Result.Ok({}))
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "_read_json", _read_json)
    monkeypatch.setattr(m, "_is_resolved_path_allowed", lambda _p: True)

    req = make_mocked_request("POST", "/mjr/am/asset/rename", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    assert _json(resp).get("code") == "DB_ERROR"


@pytest.mark.asyncio
async def test_assets_delete_partial_errors(monkeypatch, tmp_path: Path):
    app = _app()

    f1 = tmp_path / "1.png"
    f2 = tmp_path / "2.png"
    f1.write_bytes(b"x")
    f2.write_bytes(b"y")

    db = _DummyDB()

    async def _aquery_in(_sql, _column, _vals):
        return Result.Ok([{"id": 1, "filepath": str(f1)}, {"id": 2, "filepath": str(f2)}])

    db.aquery_in = _aquery_in

    async def _svc():
        return {"db": db}, None

    async def _prefs(_svc):
        return {}

    async def _read_json(_request):
        return Result.Ok({"ids": [1, 2]})

    def _del(path):
        if str(path).endswith("1.png"):
            return Result.Err("DELETE_FAILED", "nope")
        return Result.Ok(True)

    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_services", _svc)
    monkeypatch.setattr(m, "_resolve_security_prefs", _prefs)
    monkeypatch.setattr(m, "_require_operation_enabled", lambda *_args, **_kwargs: Result.Ok({}))
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "_check_rate_limit", lambda *_args, **_kwargs: (True, None))
    monkeypatch.setattr(m, "_read_json", _read_json)
    monkeypatch.setattr(m, "_normalize_path", lambda v: Path(v) if v else None)
    monkeypatch.setattr(m, "_is_path_allowed", lambda *_args, **_kwargs: True)
    monkeypatch.setattr(m, "_is_path_allowed_custom", lambda *_args, **_kwargs: False)
    monkeypatch.setattr(m, "_is_resolved_path_allowed", lambda _p: True)
    monkeypatch.setattr(m, "_delete_file_best_effort", _del)

    req = make_mocked_request("POST", "/mjr/am/assets/delete", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    payload = _json(resp)
    assert payload.get("ok") is True
    assert payload.get("meta", {}).get("partial") is True


@pytest.mark.asyncio
async def test_open_in_folder_invalid_and_not_found(monkeypatch):
    app = _app()

    async def _svc():
        return {"db": _DummyDB()}, None

    async def _prefs(_svc):
        return {}

    async def _read_bad(_request):
        return Result.Ok({})

    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_services", _svc)
    monkeypatch.setattr(m, "_resolve_security_prefs", _prefs)
    monkeypatch.setattr(m, "_require_operation_enabled", lambda *_args, **_kwargs: Result.Ok({}))
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "_check_rate_limit", lambda *_args, **_kwargs: (True, None))
    monkeypatch.setattr(m, "_read_json", _read_bad)

    req1 = make_mocked_request("POST", "/mjr/am/open-in-folder", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    assert _json(resp1).get("code") == "INVALID_INPUT"

    async def _read_nf(_request):
        return Result.Ok({"filepath": "C:/not_there.png"})

    monkeypatch.setattr(m, "_read_json", _read_nf)
    monkeypatch.setattr(m, "_normalize_path", lambda v: Path(v) if v else None)
    req2 = make_mocked_request("POST", "/mjr/am/open-in-folder", app=app)
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    assert _json(resp2).get("code") == "NOT_FOUND"

@pytest.mark.asyncio
async def test_rename_infer_source_branch(monkeypatch, tmp_path: Path):
    app = _app()
    f = tmp_path / "old3.png"
    f.write_bytes(b"x")

    db = _DummyDB()

    async def aquery(sql, params=()):
        _ = params
        if "SELECT filepath, filename, source, root_id FROM assets" in sql:
            return Result.Ok([{"filepath": str(f), "filename": "old3.png", "source": "", "root_id": ""}])
        if "SELECT a.id" in sql:
            return Result.Ok([{"id": 9}])
        return Result.Ok([])

    db.aquery = aquery

    class _Index:
        async def index_paths(self, *_args, **_kwargs):
            return Result.Ok({})

    async def _svc():
        return {"db": db, "index": _Index()}, None

    async def _prefs(_svc):
        return {}

    async def _read_json(_request):
        return Result.Ok({"asset_id": 9, "new_name": "new3.png"})

    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_services", _svc)
    monkeypatch.setattr(m, "_resolve_security_prefs", _prefs)
    monkeypatch.setattr(m, "_require_operation_enabled", lambda *_args, **_kwargs: Result.Ok({}))
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "_read_json", _read_json)
    monkeypatch.setattr(m, "_is_resolved_path_allowed", lambda _p: True)
    monkeypatch.setattr(m, "get_runtime_output_root", lambda: str(tmp_path))
    monkeypatch.setattr(m.folder_paths, "get_input_directory", lambda: str(tmp_path / "in"))
    monkeypatch.setattr(m, "_is_within_root", lambda p, r: str(p).startswith(str(r)))
    monkeypatch.setattr(m, "list_custom_roots", lambda: Result.Ok([]))

    req = make_mocked_request("POST", "/mjr/am/asset/rename", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    assert _json(resp).get("ok") is True


@pytest.mark.asyncio
async def test_assets_delete_more_guards(monkeypatch):
    app = _app()

    async def _svc():
        return {"db": _DummyDB()}, None

    async def _prefs(_svc):
        return {}

    async def _read_json_bad_id(_request):
        return Result.Ok({"ids": ["x"]})

    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_services", _svc)
    monkeypatch.setattr(m, "_resolve_security_prefs", _prefs)
    monkeypatch.setattr(m, "_require_operation_enabled", lambda *_args, **_kwargs: Result.Ok({}))
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "_check_rate_limit", lambda *_args, **_kwargs: (True, None))
    monkeypatch.setattr(m, "_read_json", _read_json_bad_id)

    req1 = make_mocked_request("POST", "/mjr/am/assets/delete", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    assert _json(resp1).get("code") == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_download_asset_rate_and_missing_filepath(monkeypatch):
    app = web.Application()
    app.router.add_get("/mjr/am/asset/download", m.download_asset)

    monkeypatch.setattr(m, "_check_rate_limit", lambda *_args, **_kwargs: (False, 7))
    req1 = make_mocked_request("GET", "/mjr/am/asset/download?filepath=a.png", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    assert resp1.status == 429

    monkeypatch.setattr(m, "_check_rate_limit", lambda *_args, **_kwargs: (True, None))
    req2 = make_mocked_request("GET", "/mjr/am/asset/download", app=app)
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    assert resp2.status == 400


@pytest.mark.asyncio
async def test_download_asset_blocks_path_traversal_query(monkeypatch):
    app = web.Application()
    app.router.add_get("/mjr/am/asset/download", m.download_asset)
    monkeypatch.setattr(m, "_check_rate_limit", lambda *_args, **_kwargs: (True, None))
    monkeypatch.setattr(m, "_is_resolved_path_allowed", lambda _p: False)

    req = make_mocked_request("GET", "/mjr/am/asset/download?filepath=../../etc/passwd", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    assert resp.status in {403, 404}


@pytest.mark.asyncio
async def test_delete_asset_forbidden_path(monkeypatch, tmp_path: Path):
    app = _app()
    f = tmp_path / "zz.png"
    f.write_bytes(b"x")

    db = _DummyDB()

    async def _svc():
        return {"db": db}, None

    async def _prefs(_svc):
        return {}

    async def _read_json(_request):
        return Result.Ok({"filepath": str(f)})

    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_services", _svc)
    monkeypatch.setattr(m, "_resolve_security_prefs", _prefs)
    monkeypatch.setattr(m, "_require_operation_enabled", lambda *_args, **_kwargs: Result.Ok({}))
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "_check_rate_limit", lambda *_args, **_kwargs: (True, None))
    monkeypatch.setattr(m, "_read_json", _read_json)
    monkeypatch.setattr(m, "_normalize_path", lambda v: Path(v) if v else None)
    monkeypatch.setattr(m, "_is_resolved_path_allowed", lambda _p: False)

    req = make_mocked_request("POST", "/mjr/am/asset/delete", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    assert _json(resp).get("code") == "FORBIDDEN"

@pytest.mark.asyncio
async def test_rating_resolve_or_create_not_found(monkeypatch):
    app = _app()

    class _Index:
        async def index_paths(self, *_args, **_kwargs):
            return Result.Ok({})

        async def update_asset_rating(self, asset_id, rating):
            return Result.Ok({"asset_id": asset_id, "rating": rating})

    class _DB:
        async def aquery(self, _sql, _params=()):
            return Result.Ok([])

    async def _svc():
        return {"index": _Index(), "db": _DB()}, None

    async def _prefs(_svc):
        return {}

    async def _read_json(_request):
        return Result.Ok({"filepath": "C:/missing.png", "rating": 1})

    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_services", _svc)
    monkeypatch.setattr(m, "_resolve_security_prefs", _prefs)
    monkeypatch.setattr(m, "_require_operation_enabled", lambda *_args, **_kwargs: Result.Ok({}))
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "_check_rate_limit", lambda *_args, **_kwargs: (True, None))
    monkeypatch.setattr(m, "_read_json", _read_json)
    monkeypatch.setattr(m, "_normalize_path", lambda _v: None)

    req = make_mocked_request("POST", "/mjr/am/asset/rating", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    assert _json(resp).get("code") == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_rename_filename_validation_errors(monkeypatch, tmp_path: Path):
    app = _app()
    f = tmp_path / "a4.png"
    f.write_bytes(b"x")

    db = _DummyDB()
    db.query_rows = [{"filepath": str(f), "filename": "a4.png", "source": "output", "root_id": ""}]

    async def _svc():
        return {"db": db, "index": object()}, None

    async def _prefs(_svc):
        return {}

    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_services", _svc)
    monkeypatch.setattr(m, "_resolve_security_prefs", _prefs)
    monkeypatch.setattr(m, "_require_operation_enabled", lambda *_args, **_kwargs: Result.Ok({}))
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))

    async def _read_json_bad(_request):
        return Result.Ok({"asset_id": 1, "new_name": "bad/name.png"})

    monkeypatch.setattr(m, "_read_json", _read_json_bad)
    req1 = make_mocked_request("POST", "/mjr/am/asset/rename", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    assert _json(resp1).get("code") == "INVALID_INPUT"

    async def _read_json_long(_request):
        return Result.Ok({"asset_id": 1, "new_name": "x" * (m.MAX_RENAME_LENGTH + 1)})

    monkeypatch.setattr(m, "_read_json", _read_json_long)
    req2 = make_mocked_request("POST", "/mjr/am/asset/rename", app=app)
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    assert _json(resp2).get("code") == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_delete_asset_db_error_and_delete_failure(monkeypatch, tmp_path: Path):
    app = _app()
    f = tmp_path / "k.png"
    f.write_bytes(b"x")

    class _DB3(_DummyDB):
        async def aquery(self, sql, params=()):
            if "SELECT filepath FROM assets WHERE id" in sql:
                return Result.Ok([{"filepath": str(f)}])
            if "SELECT filename, subfolder" in sql:
                return Result.Ok([{"filename": "k.png", "filepath": str(f)}])
            return Result.Ok([])

    db = _DB3()

    async def _svc():
        return {"db": db}, None

    async def _prefs(_svc):
        return {}

    async def _read_json(_request):
        return Result.Ok({"asset_id": 1})

    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_services", _svc)
    monkeypatch.setattr(m, "_resolve_security_prefs", _prefs)
    monkeypatch.setattr(m, "_require_operation_enabled", lambda *_args, **_kwargs: Result.Ok({}))
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "_check_rate_limit", lambda *_args, **_kwargs: (True, None))
    monkeypatch.setattr(m, "_read_json", _read_json)
    monkeypatch.setattr(m, "_is_resolved_path_allowed", lambda _p: True)

    monkeypatch.setattr(m, "_delete_file_best_effort", lambda _p: Result.Err("DELETE_FAILED", "bad"))
    req = make_mocked_request("POST", "/mjr/am/asset/delete", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    assert _json(resp).get("code") == "DELETE_FAILED"


@pytest.mark.asyncio
async def test_open_in_folder_db_not_found(monkeypatch):
    app = _app()

    class _DB4:
        async def aquery(self, _sql, _params=()):
            return Result.Ok([])

    async def _svc():
        return {"db": _DB4()}, None

    async def _prefs(_svc):
        return {}

    async def _read_json(_request):
        return Result.Ok({"asset_id": 2})

    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_services", _svc)
    monkeypatch.setattr(m, "_resolve_security_prefs", _prefs)
    monkeypatch.setattr(m, "_require_operation_enabled", lambda *_args, **_kwargs: Result.Ok({}))
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "_check_rate_limit", lambda *_args, **_kwargs: (True, None))
    monkeypatch.setattr(m, "_read_json", _read_json)

    req = make_mocked_request("POST", "/mjr/am/open-in-folder", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    assert _json(resp).get("code") == "NOT_FOUND"


@pytest.mark.asyncio
async def test_asset_rating_filepath_resolve_paths(monkeypatch, tmp_path: Path):
    app = _app()
    f = tmp_path / "x.png"
    f.write_bytes(b"x")

    class _Index:
        async def update_asset_rating(self, asset_id, rating):
            return Result.Ok({"id": asset_id, "rating": rating})

        async def index_paths(self, *_args, **_kwargs):
            return None

    class _DB:
        def __init__(self, rows):
            self.rows = list(rows)

        async def aquery(self, *_args, **_kwargs):
            if self.rows:
                return self.rows.pop(0)
            return Result.Ok([])

    async def _prefs(_svc):
        return {}

    async def _read_json_missing(_request):
        return Result.Ok({"rating": 4})

    async def _read_json_not_found(_request):
        return Result.Ok({"filepath": str(tmp_path / "missing.png"), "rating": 3})

    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_resolve_security_prefs", _prefs)
    monkeypatch.setattr(m, "_require_operation_enabled", lambda *_args, **_kwargs: Result.Ok({}))
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "_check_rate_limit", lambda *_args, **_kwargs: (True, None))
    monkeypatch.setattr(m, "get_runtime_output_root", lambda: str(tmp_path))
    monkeypatch.setattr(m.folder_paths, "get_input_directory", lambda: str(tmp_path / "input"))
    monkeypatch.setattr(m, "list_custom_roots", lambda: Result.Ok([]))
    monkeypatch.setattr(m, "_is_within_root", lambda p, root: str(p).startswith(str(root)))

    async def _require_services_missing():
        return {"index": _Index(), "db": _DB([])}, None

    monkeypatch.setattr(m, "_require_services", _require_services_missing)
    monkeypatch.setattr(m, "_read_json", _read_json_missing)
    req1 = make_mocked_request("POST", "/mjr/am/asset/rating", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    assert _json(resp1).get("code") == "INVALID_INPUT"

    async def _require_services_not_found():
        return {"index": _Index(), "db": _DB([Result.Ok([])])}, None

    monkeypatch.setattr(m, "_require_services", _require_services_not_found)
    monkeypatch.setattr(m, "_read_json", _read_json_not_found)
    req2 = make_mocked_request("POST", "/mjr/am/asset/rating", app=app)
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    assert _json(resp2).get("code") == "NOT_FOUND"


@pytest.mark.asyncio
async def test_asset_tags_filepath_resolve_timeout_and_db_error(monkeypatch, tmp_path: Path):
    app = _app()
    f = tmp_path / "x.png"
    f.write_bytes(b"x")

    class _Index:
        async def update_asset_tags(self, asset_id, tags):
            return Result.Ok({"id": asset_id, "tags": tags})

        async def index_paths(self, *_args, **_kwargs):
            return None

    class _DBTimeout:
        async def aquery(self, *_args, **_kwargs):
            raise asyncio.TimeoutError()

    class _DBError:
        async def aquery(self, *_args, **_kwargs):
            raise RuntimeError("boom")

    async def _prefs(_svc):
        return {}

    async def _read_json(_request):
        return Result.Ok({"filepath": str(f), "tags": ["a"]})

    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_resolve_security_prefs", _prefs)
    monkeypatch.setattr(m, "_require_operation_enabled", lambda *_args, **_kwargs: Result.Ok({}))
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "_check_rate_limit", lambda *_args, **_kwargs: (True, None))
    monkeypatch.setattr(m, "_read_json", _read_json)
    monkeypatch.setattr(m, "get_runtime_output_root", lambda: str(tmp_path))
    monkeypatch.setattr(m.folder_paths, "get_input_directory", lambda: str(tmp_path / "input"))
    monkeypatch.setattr(m, "list_custom_roots", lambda: Result.Ok([]))
    monkeypatch.setattr(m, "_is_within_root", lambda p, root: str(p).startswith(str(root)))

    async def _require_services_timeout():
        return {"index": _Index(), "db": _DBTimeout()}, None

    monkeypatch.setattr(m, "_require_services", _require_services_timeout)
    req1 = make_mocked_request("POST", "/mjr/am/asset/tags", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    assert _json(resp1).get("code") == "TIMEOUT"

    async def _require_services_dberr():
        return {"index": _Index(), "db": _DBError()}, None

    monkeypatch.setattr(m, "_require_services", _require_services_dberr)
    req2 = make_mocked_request("POST", "/mjr/am/asset/tags", app=app)
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    assert _json(resp2).get("code") == "DB_ERROR"


@pytest.mark.asyncio
async def test_rating_tags_sync_header_modes(monkeypatch, tmp_path: Path):
    app = _app()
    f = tmp_path / "x.png"
    f.write_bytes(b"x")

    class _Index:
        async def update_asset_rating(self, asset_id, rating):
            return Result.Ok({"id": asset_id, "rating": rating})

    class _Worker:
        def __init__(self):
            self.calls = []

        def enqueue(self, filepath, rating, tags, mode):
            self.calls.append((filepath, rating, tags, mode))

    class _DB:
        async def aquery(self, sql, _params=()):
            if "FROM assets WHERE id" in sql:
                return Result.Ok([{"filepath": str(f)}])
            return Result.Ok([{"rating": 2, "tags": '["t1"]'}])

    worker = _Worker()

    async def _prefs(_svc):
        return {}

    async def _require_services():
        return {"index": _Index(), "db": _DB(), "rating_tags_sync": worker}, None

    async def _read_json(_request):
        return Result.Ok({"asset_id": 1, "rating": 4})

    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_services", _require_services)
    monkeypatch.setattr(m, "_resolve_security_prefs", _prefs)
    monkeypatch.setattr(m, "_require_operation_enabled", lambda *_args, **_kwargs: Result.Ok({}))
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "_check_rate_limit", lambda *_args, **_kwargs: (True, None))
    monkeypatch.setattr(m, "_read_json", _read_json)

    req1 = make_mocked_request("POST", "/mjr/am/asset/rating", app=app, headers={"X-MJR-RTSYNC": "off"})
    _ = await (await app.router.resolve(req1)).handler(req1)
    assert worker.calls == []

    req2 = make_mocked_request("POST", "/mjr/am/asset/rating", app=app, headers={"X-MJR-RTSYNC": "on"})
    _ = await (await app.router.resolve(req2)).handler(req2)
    assert worker.calls and worker.calls[-1][-1] == "on"

    req3 = make_mocked_request("POST", "/mjr/am/asset/rating", app=app, headers={"X-MJR-RTSYNC": "both"})
    _ = await (await app.router.resolve(req3)).handler(req3)
    assert worker.calls[-1][-1] == "both"
