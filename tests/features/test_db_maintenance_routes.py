import json
import os
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


def test_maintenance_flag_roundtrip():
    m.set_db_maintenance_active(True)
    assert m.is_db_maintenance_active() is True
    m.set_db_maintenance_active(False)
    assert m.is_db_maintenance_active() is False


def test_backup_name_and_collect_case_duplicate_ids():
    name = m._backup_name()
    assert name.startswith("assets_") and name.endswith(".sqlite")

    groups, delete_ids, kept = m._collect_case_duplicate_ids(
        [
            {"id": 3, "filepath": "A.png", "mtime": 2},
            {"id": 2, "filepath": "a.png", "mtime": 1},
            {"id": 4, "filepath": "B.png", "mtime": 1},
        ]
    )
    assert groups >= 1
    assert 2 in delete_ids
    assert kept >= 1


def test_list_backup_files(tmp_path: Path, monkeypatch):
    arc = tmp_path / "archive"
    arc.mkdir()
    p = arc / "a.sqlite"
    p.write_bytes(b"x")
    monkeypatch.setattr(m, "_DB_ARCHIVE_DIR", arc)

    rows = m._list_backup_files()
    assert len(rows) == 1
    assert rows[0]["name"] == "a.sqlite"


@pytest.mark.asyncio
async def test_stop_and_restart_watcher_if_needed(monkeypatch):
    state = {"stopped": 0, "started": 0}

    class _Watcher:
        is_running = True

        async def stop(self):
            state["stopped"] += 1

        async def start(self, _paths, _loop):
            state["started"] += 1

    svc = {"watcher": _Watcher(), "watcher_scope": {"scope": "output", "custom_root_id": ""}}
    assert await m._stop_watcher_if_running(svc) is True

    import mjr_am_backend.features.index.watcher_scope as watcher_scope_mod
    monkeypatch.setattr(watcher_scope_mod, "build_watch_paths", lambda *_args, **_kwargs: [{"path": "C:/x"}])
    await m._restart_watcher_if_needed(svc, True)
    assert state["started"] == 1


@pytest.mark.asyncio
async def test_remove_and_replace_db_from_backup(tmp_path: Path):
    src = tmp_path / "src.sqlite"
    dst = tmp_path / "dst.sqlite"
    src.write_bytes(b"abc")
    dst.write_bytes(b"old")

    await m._replace_db_from_backup(src, dst)
    assert dst.read_bytes() == b"abc"


@pytest.mark.asyncio
async def test_cleanup_assets_case_duplicates_paths():
    class _DB:
        def __init__(self):
            self.deleted = None

        async def aquery(self, _sql):
            return Result.Ok(
                [
                    {"id": 4, "filepath": "X.png", "mtime": 2},
                    {"id": 3, "filepath": "x.png", "mtime": 1},
                ]
            )

        async def aexecute(self, _sql, params):
            self.deleted = params
            return Result.Ok(1)

    db = _DB()
    out = await m._cleanup_assets_case_duplicates(db)
    assert out.ok is True
    assert out.data["deleted"] == 1
    assert db.deleted is not None


@pytest.mark.asyncio
async def test_db_optimize_route_success_and_service_unavailable(monkeypatch):
    class _DB:
        async def aquery(self, *_args, **_kwargs):
            return Result.Ok({})

    async def _require_services_ok():
        return {"db": _DB()}, None

    async def _require_services_none():
        return {}, None

    app = _app()
    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))

    monkeypatch.setattr(m, "_require_services", _require_services_ok)
    req1 = make_mocked_request("POST", "/mjr/am/db/optimize", app=app)
    match1 = await app.router.resolve(req1)
    resp1 = await match1.handler(req1)
    payload1 = json.loads(resp1.text)
    assert payload1.get("ok") is True

    monkeypatch.setattr(m, "_require_services", _require_services_none)
    req2 = make_mocked_request("POST", "/mjr/am/db/optimize", app=app)
    match2 = await app.router.resolve(req2)
    resp2 = await match2.handler(req2)
    payload2 = json.loads(resp2.text)
    assert payload2.get("code") == "SERVICE_UNAVAILABLE"


@pytest.mark.asyncio
async def test_db_cleanup_case_duplicates_non_windows(monkeypatch):
    async def _require_services():
        return {"db": object()}, None

    app = _app()
    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "_require_services", _require_services)
    monkeypatch.setattr(os, "name", "posix")

    req = make_mocked_request("POST", "/mjr/am/db/cleanup-case-duplicates", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is True
    assert payload.get("data", {}).get("ran") is False


@pytest.mark.asyncio
async def test_db_backups_list_route(monkeypatch, tmp_path: Path):
    arc = tmp_path / "archive"
    arc.mkdir()
    (arc / "a.sqlite").write_bytes(b"x")
    monkeypatch.setattr(m, "_DB_ARCHIVE_DIR", arc)

    app = _app()
    req = make_mocked_request("GET", "/mjr/am/db/backups", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is True
    assert len(payload.get("data", {}).get("items", [])) >= 1


@pytest.mark.asyncio
async def test_db_force_delete_adapter_reset_success(monkeypatch, tmp_path: Path):
    class _DB:
        async def areset(self):
            return Result.Ok({})

    class _Index:
        async def stop_enrichment(self, clear_queue=True):
            _ = clear_queue

        async def scan_directory(self, *args, **kwargs):
            _ = (args, kwargs)
            return Result.Ok({})

    async def _require_services():
        return {"db": _DB(), "index": _Index(), "watcher": None}, None

    def _create_task(coro):
        try:
            coro.close()
        except Exception:
            pass
        return None

    app = _app()
    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "_require_services", _require_services)
    monkeypatch.setattr(m.asyncio, "create_task", _create_task)
    monkeypatch.setattr(m, "get_runtime_output_root", lambda: str(tmp_path))

    req = make_mocked_request("POST", "/mjr/am/db/force-delete", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is True
    assert payload.get("data", {}).get("method") == "adapter_reset"


@pytest.mark.asyncio
async def test_db_backup_save_success(monkeypatch, tmp_path: Path):
    class _DB:
        async def aquery(self, *_args, **_kwargs):
            return Result.Ok({})

    async def _require_services():
        return {"db": _DB()}, None

    arc = tmp_path / "archive"
    arc.mkdir()
    monkeypatch.setattr(m, "_DB_ARCHIVE_DIR", arc)
    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "_require_services", _require_services)
    monkeypatch.setattr(m, "_backup_name", lambda: "b.sqlite")

    def _backup(_src, dst):
        Path(dst).write_bytes(b"x")

    monkeypatch.setattr(m, "_sqlite_backup_file", _backup)

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/db/backup-save", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is True
    assert payload.get("data", {}).get("name") == "b.sqlite"


@pytest.mark.asyncio
async def test_db_backup_restore_success(monkeypatch, tmp_path: Path):
    class _DB:
        async def areset(self):
            return Result.Ok({})

        async def _ensure_initialized_async(self):
            return None

    class _Index:
        async def stop_enrichment(self, clear_queue=True):
            _ = clear_queue

        async def scan_directory(self, *args, **kwargs):
            _ = (args, kwargs)
            return Result.Ok({})

    async def _require_services():
        return {"db": _DB(), "index": _Index(), "watcher": None}, None

    arc = tmp_path / "archive"
    arc.mkdir()
    bk = arc / "a.sqlite"
    bk.write_bytes(b"x")
    monkeypatch.setattr(m, "_DB_ARCHIVE_DIR", arc)
    monkeypatch.setattr(m, "_list_backup_files", lambda: [{"name": "a.sqlite"}])
    async def _replace(*_args, **_kwargs):
        return None

    monkeypatch.setattr(m, "_replace_db_from_backup", _replace)
    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "_require_services", _require_services)
    monkeypatch.setattr(m, "get_runtime_output_root", lambda: str(tmp_path))
    async def _read_json(_request):
        return Result.Ok({"use_latest": True})
    monkeypatch.setattr(m, "_read_json", _read_json)

    def _create_task(coro):
        try:
            coro.close()
        except Exception:
            pass
        return None

    monkeypatch.setattr(m.asyncio, "create_task", _create_task)

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/db/backup-restore", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is True
    assert payload.get("data", {}).get("restored") is True
