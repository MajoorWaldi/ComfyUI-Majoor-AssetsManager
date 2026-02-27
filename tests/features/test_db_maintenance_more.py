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
