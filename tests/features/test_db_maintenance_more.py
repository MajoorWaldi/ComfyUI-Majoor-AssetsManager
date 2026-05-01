import json
from pathlib import Path
from types import SimpleNamespace

import pytest
from aiohttp import web
from aiohttp.test_utils import make_mocked_request
from mjr_am_backend.routes.handlers import db_maintenance as m
from mjr_am_backend.shared import Result


def _app():
    app = web.Application()
    routes = web.RouteTableDef()
    m.register_db_maintenance_routes(routes)
    app.add_routes(routes)
    return app


def test_normalize_asset_row_and_collect_duplicates():
    assert m._normalize_asset_row_for_case_cleanup({"id": "2", "filepath": "A.png"}) == (2, "a.png")
    assert m._normalize_asset_row_for_case_cleanup({"id": 0, "filepath": "A.png"}) == (0, "")
    groups, delete_ids, kept = m._collect_case_duplicate_ids(
        [{"id": 3, "filepath": "a.png"}, {"id": 2, "filepath": "A.png"}, {"id": 1, "filepath": "b.png"}]
    )
    assert groups >= 1 and 2 in delete_ids and kept >= 1


def test_vector_backfill_priority_window_helpers():
    m._clear_vector_backfill_priority_window()
    try:
        requested = m.request_vector_backfill_priority_window(2.0, reason="test")
        assert requested > 0
        assert m._vector_backfill_priority_remaining_seconds() > 0
    finally:
        m._clear_vector_backfill_priority_window()
    assert m._vector_backfill_priority_remaining_seconds() == 0


@pytest.mark.asyncio
async def test_remove_with_retry_noop_and_emit_status():
    p = Path("tests") / "__non_existing__.tmp"
    await m._remove_with_retry(p)
    m._emit_restore_status("x", "info", "ok")


@pytest.mark.asyncio
async def test_cleanup_assets_case_duplicates_error_paths():
    class _DB1:
        async def aquery(self, *_args, **_kwargs):
            return Result.Err("DB_ERROR", "bad")

    out1 = await m._cleanup_assets_case_duplicates(_DB1())
    assert not out1.ok

    class _DB2:
        async def aquery(self, *_args, **_kwargs):
            return Result.Ok([{"id": 2, "filepath": "a.png"}, {"id": 1, "filepath": "A.png"}])

        async def aexecute(self, *_args, **_kwargs):
            return Result.Err("DB_ERROR", "del")

    out2 = await m._cleanup_assets_case_duplicates(_DB2())
    assert not out2.ok


@pytest.mark.asyncio
async def test_db_backup_restore_not_found_and_save_service_unavailable(monkeypatch):
    app = _app()
    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))

    async def _require_services_none():
        return {}, None

    monkeypatch.setattr(m, "_require_services", _require_services_none)
    req_save = make_mocked_request("POST", "/mjr/am/db/backup-save", app=app)
    match_save = await app.router.resolve(req_save)
    resp_save = await match_save.handler(req_save)
    body_save = json.loads(resp_save.text)
    assert body_save.get("code") == "SERVICE_UNAVAILABLE"

    monkeypatch.setattr(m, "_list_backup_files", lambda: [])

    async def _require_services_ok():
        return {"db": SimpleNamespace()}, None

    monkeypatch.setattr(m, "_require_services", _require_services_ok)
    req_restore = make_mocked_request("POST", "/mjr/am/db/backup-restore", app=app)

    async def _read_json(_request):
        return Result.Ok({"use_latest": True})

    monkeypatch.setattr(m, "_read_json", _read_json)
    match_restore = await app.router.resolve(req_restore)
    resp_restore = await match_restore.handler(req_restore)
    body_restore = json.loads(resp_restore.text)
    assert body_restore.get("code") == "NOT_FOUND"


@pytest.mark.asyncio
async def test_db_backup_save_rejected_while_generation_busy(monkeypatch):
    app = _app()
    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "is_generation_busy", lambda **_kwargs: True)

    req = make_mocked_request("POST", "/mjr/am/db/backup-save", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)

    assert body.get("ok") is False
    assert body.get("code") == "COMFY_BUSY"


@pytest.mark.asyncio
async def test_db_backup_restore_requested_name_not_found_and_missing_db(monkeypatch):
    app = _app()
    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "_list_backup_files", lambda: [{"name": "a.sqlite"}])

    async def _require_services_missing_db():
        return {"index": object()}, None

    monkeypatch.setattr(m, "_require_services", _require_services_missing_db)
    req = make_mocked_request("POST", "/mjr/am/db/backup-restore", app=app)

    async def _read_json(_request):
        return Result.Ok({"name": "missing.sqlite"})

    monkeypatch.setattr(m, "_read_json", _read_json)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)
    assert body.get("code") == "NOT_FOUND"


@pytest.mark.asyncio
async def test_db_backup_restore_requires_reset_index_operation(monkeypatch):
    app = _app()
    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))

    async def _require_services():
        return {"db": object()}, None

    async def _resolve_security_prefs(_services):
        return {"allow_reset_index": False}

    monkeypatch.setattr(m, "_require_services", _require_services)
    monkeypatch.setattr(m, "_resolve_security_prefs", _resolve_security_prefs)
    monkeypatch.setattr(m, "_require_operation_enabled", lambda operation, *, prefs=None: Result.Err("FORBIDDEN", operation))

    async def _read_json(_request):
        return Result.Ok({"use_latest": True})

    monkeypatch.setattr(m, "_read_json", _read_json)
    req = make_mocked_request("POST", "/mjr/am/db/backup-restore", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)

    assert body.get("ok") is False
    assert body.get("code") == "FORBIDDEN"


@pytest.mark.asyncio
async def test_db_backup_restore_reset_fail_and_replace_fail(monkeypatch, tmp_path: Path):
    app = _app()
    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "_DB_ARCHIVE_DIR", tmp_path)
    (tmp_path / "a.sqlite").write_bytes(b"x")
    monkeypatch.setattr(m, "_list_backup_files", lambda: [{"name": "a.sqlite"}])

    class _DBResetFail:
        async def areset(self):
            return Result.Err("DB_ERROR", "reset failed")

    async def _require_services_reset_fail():
        return {"db": _DBResetFail(), "index": None, "watcher": None}, None

    monkeypatch.setattr(m, "_require_services", _require_services_reset_fail)
    req1 = make_mocked_request("POST", "/mjr/am/db/backup-restore", app=app)

    async def _read_json(_request):
        return Result.Ok({"use_latest": True})

    monkeypatch.setattr(m, "_read_json", _read_json)
    match1 = await app.router.resolve(req1)
    resp1 = await match1.handler(req1)
    body1 = json.loads(resp1.text)
    assert body1.get("code") in {"DB_ERROR", "NOT_FOUND"}

    class _DBOk:
        async def areset(self):
            return Result.Ok({})

        async def _ensure_initialized_async(self):
            return None

    async def _require_services_ok():
        return {"db": _DBOk(), "index": None, "watcher": None}, None

    monkeypatch.setattr(m, "_require_services", _require_services_ok)

    async def _replace_fail(*_args, **_kwargs):
        raise RuntimeError("replace failed")

    monkeypatch.setattr(m, "_replace_db_from_backup", _replace_fail)
    req2 = make_mocked_request("POST", "/mjr/am/db/backup-restore", app=app)
    match2 = await app.router.resolve(req2)
    resp2 = await match2.handler(req2)
    body2 = json.loads(resp2.text)
    assert body2.get("code") == "DB_ERROR"


@pytest.mark.asyncio
async def test_db_backfill_missing_vectors_success(monkeypatch, tmp_path):
    app = _app()
    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "is_vector_search_enabled", lambda: True)

    class _Searcher:
        def __init__(self):
            self.invalidated = 0

        def invalidate(self):
            self.invalidated += 1

    image_path = tmp_path / "img1.png"
    image_path.write_bytes(b"\x89PNG\r\n\x1a\n")

    class _DB:
        def __init__(self):
            self.calls = 0

        async def aquery(self, _sql, _params):
            self.calls += 1
            if self.calls == 1:
                return Result.Ok([
                    {"eligible_total": 25, "candidate_total": 1},
                ])
            if self.calls == 2:
                return Result.Ok([
                        {"id": 1, "filepath": str(image_path), "kind": "image", "metadata_raw": "{}"},
                ])
            return Result.Ok([])

    db = _DB()
    searcher = _Searcher()

    async def _require_services_ok():
        return {
            "db": db,
            "vector_service": object(),
            "vector_searcher": searcher,
            "watcher": None,
            "index": None,
        }, None

    monkeypatch.setattr(m, "_require_services", _require_services_ok)

    import mjr_am_backend.features.index.vector_indexer as vector_indexer_mod

    async def _index_ok(*_args, **_kwargs):
        return Result.Ok(True)

    monkeypatch.setattr(vector_indexer_mod, "index_asset_vector", _index_ok)

    req = make_mocked_request("POST", "/mjr/am/db/backfill-missing-vectors?batch_size=10", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)
    assert body.get("ok") is True
    assert body.get("data", {}).get("ran") is True
    assert body.get("data", {}).get("indexed") == 1
    assert body.get("data", {}).get("eligible_total") == 25
    assert body.get("data", {}).get("candidate_total") == 1
    assert searcher.invalidated == 1


@pytest.mark.asyncio
async def test_db_backfill_missing_vectors_custom_scope_filters_sql(monkeypatch, tmp_path):
    app = _app()
    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "is_vector_search_enabled", lambda: True)
    monkeypatch.setattr(m, "resolve_custom_root", lambda _rid: Result.Ok(str(tmp_path)))

    class _Searcher:
        def __init__(self):
            self.invalidated = 0

        def invalidate(self):
            self.invalidated += 1

    image_path = tmp_path / "img_custom.png"
    image_path.write_bytes(b"\x89PNG\r\n\x1a\n")

    class _DB:
        def __init__(self):
            self.calls = 0
            self.first_sql = ""
            self.first_params = ()

        async def aquery(self, sql, params):
            self.calls += 1
            if self.calls == 1:
                self.first_sql = str(sql)
                self.first_params = tuple(params or ())
                return Result.Ok([
                    {"eligible_total": 12, "candidate_total": 1},
                ])
            if self.calls == 2:
                return Result.Ok([
                    {"id": 11, "filepath": str(image_path), "kind": "image", "metadata_raw": "{}"},
                ])
            return Result.Ok([])

    db = _DB()
    searcher = _Searcher()

    async def _require_services_ok():
        return {
            "db": db,
            "vector_service": object(),
            "vector_searcher": searcher,
            "watcher": None,
            "index": None,
        }, None

    monkeypatch.setattr(m, "_require_services", _require_services_ok)

    import mjr_am_backend.features.index.vector_indexer as vector_indexer_mod

    async def _index_ok(*_args, **_kwargs):
        return Result.Ok(True)

    monkeypatch.setattr(vector_indexer_mod, "index_asset_vector", _index_ok)

    req = make_mocked_request(
        "POST",
        "/mjr/am/db/backfill-missing-vectors?batch_size=10&scope=custom&custom_root_id=root-1",
        app=app,
    )
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)
    assert body.get("ok") is True
    assert body.get("data", {}).get("scope") == "custom"
    assert body.get("data", {}).get("custom_root_id") == "root-1"
    assert body.get("data", {}).get("indexed") == 1
    assert body.get("data", {}).get("eligible_total") == 12
    assert body.get("data", {}).get("candidate_total") == 1
    assert searcher.invalidated == 1
    assert "LOWER(COALESCE(a.source, '')) = ?" in db.first_sql
    assert "a.root_id = ?" in db.first_sql
    assert db.first_params[0] == "custom"
    assert db.first_params[1] == "root-1"


@pytest.mark.asyncio
async def test_db_backfill_missing_vectors_custom_scope_requires_root(monkeypatch):
    app = _app()
    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "is_vector_search_enabled", lambda: True)

    async def _require_services_ok():
        return {
            "db": object(),
            "vector_service": object(),
            "vector_searcher": None,
            "watcher": None,
            "index": None,
        }, None

    monkeypatch.setattr(m, "_require_services", _require_services_ok)

    req = make_mocked_request("POST", "/mjr/am/db/backfill-missing-vectors?scope=custom", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)
    assert body.get("ok") is False
    assert body.get("code") == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_db_backfill_missing_vectors_disabled(monkeypatch):
    app = _app()
    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "is_vector_search_enabled", lambda: False)

    req = make_mocked_request("POST", "/mjr/am/db/backfill-missing-vectors", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)
    assert body.get("ok") is False
    assert body.get("code") == "SERVICE_UNAVAILABLE"
