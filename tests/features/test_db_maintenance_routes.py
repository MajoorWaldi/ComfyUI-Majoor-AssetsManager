import asyncio
import json
import os
import types
from pathlib import Path
from typing import Any, cast

import pytest
from aiohttp import web
from aiohttp.streams import StreamReader
from aiohttp.test_utils import make_mocked_request
from mjr_am_backend.features.assets import trash_service as _real_trash_service
from mjr_am_backend.routes.handlers import db_maintenance as m
from mjr_am_backend.shared import Result

ts_types = types.SimpleNamespace(TrashScan=_real_trash_service.TrashScan)


def _app():
    app = web.Application()
    routes = web.RouteTableDef()
    m.register_db_maintenance_routes(routes)
    app.add_routes(routes)
    return app


class _StreamProtocol:
    def __init__(self):
        self._reading_paused = False

    def pause_reading(self):
        self._reading_paused = True

    def resume_reading(self, *args, **kwargs):
        # aiohttp may call resume_reading(resume_parser=...) depending on version.
        self._reading_paused = False


def _json_post_request(
    app: web.Application,
    path: str,
    body: bytes,
    *,
    declared_content_length: int | None = None,
):
    payload = StreamReader(
        cast(Any, _StreamProtocol()),
        limit=2**16,
        loop=asyncio.get_running_loop(),
    )
    payload.feed_data(body)
    payload.feed_eof()
    headers = {
        "Content-Type": "application/json",
        "Content-Length": str(
            int(declared_content_length) if declared_content_length is not None else len(body)
        ),
    }
    return make_mocked_request("POST", path, headers=headers, payload=payload, app=app)


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


def test_next_backup_target_avoids_collision(tmp_path: Path, monkeypatch):
    arc = tmp_path / "archive"
    arc.mkdir()
    (arc / "b.sqlite").write_bytes(b"x")
    monkeypatch.setattr(m, "_DB_ARCHIVE_DIR", arc)
    monkeypatch.setattr(m, "_backup_name", lambda: "b.sqlite")

    target = m._next_backup_target()
    assert target.name == "b_2.sqlite"


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
    audit_calls = []

    class _DB:
        async def aquery(self, *_args, **_kwargs):
            return Result.Ok({})

    async def _require_services_ok():
        return {"db": _DB()}, None

    async def _require_services_none():
        return {}, None

    async def _audit_log_write(_services, **kwargs):
        audit_calls.append(kwargs)
        return True

    app = _app()
    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "audit_log_write", _audit_log_write)

    monkeypatch.setattr(m, "_require_services", _require_services_ok)
    req1 = make_mocked_request("POST", "/mjr/am/db/optimize", app=app)
    match1 = await app.router.resolve(req1)
    resp1 = await match1.handler(req1)
    payload1 = json.loads(resp1.text)
    assert payload1.get("ok") is True
    assert audit_calls and audit_calls[0]["operation"] == "db_optimize"

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
    scan_calls: list[dict] = []

    class _DB:
        async def areset(self):
            return Result.Ok({})

    class _Index:
        async def stop_enrichment(self, clear_queue=True):
            _ = clear_queue

        def scan_directory(self, *args, **kwargs):
            scan_calls.append({"args": args, "kwargs": dict(kwargs)})

            async def _coro():
                return Result.Ok({})

            return _coro()

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
    assert len(scan_calls) >= 1
    for call in scan_calls:
        kwargs = call.get("kwargs") or {}
        assert kwargs.get("fast") is True
        assert kwargs.get("background_metadata") is True


@pytest.mark.asyncio
async def test_db_force_delete_adapter_reset_result_error_falls_back_to_manual_delete(monkeypatch, tmp_path: Path):
    state = {"closed": 0}

    class _DB:
        async def areset(self):
            return Result.Err("RESET_FAILED", "boom")

        async def aclose(self):
            state["closed"] += 1

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

    def _create_task(coro):
        try:
            coro.close()
        except Exception:
            pass
        return None

    app = _app()
    import mjr_am_backend.config as cfg

    monkeypatch.setattr(cfg, "INDEX_DB_PATH", tmp_path / "assets.sqlite")
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
    assert payload.get("data", {}).get("method") == "manual_delete"
    assert state["closed"] == 1


@pytest.mark.asyncio
async def test_db_force_delete_blocked_by_operation_gate(monkeypatch):
    async def _require_services():
        return {"settings": object(), "db": object()}, None

    app = _app()
    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "_require_services", _require_services)
    async def _prefs(_svc):
        return {"allow_reset_index": False}

    monkeypatch.setattr(m, "_resolve_security_prefs", _prefs)
    monkeypatch.setattr(
        m,
        "_require_operation_enabled",
        lambda *_args, **_kwargs: Result.Err("FORBIDDEN", "blocked by policy"),
    )

    req = make_mocked_request("POST", "/mjr/am/db/force-delete", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is False
    assert payload.get("code") == "FORBIDDEN"


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
    assert payload.get("data", {}).get("mtime") is not None


@pytest.mark.asyncio
async def test_db_backup_restore_success(monkeypatch, tmp_path: Path):
    scan_calls: list[dict] = []

    class _DB:
        async def areset(self):
            return Result.Ok({})

        async def _ensure_initialized_async(self):
            return None

    class _Index:
        async def stop_enrichment(self, clear_queue=True):
            _ = clear_queue

        def scan_directory(self, *args, **kwargs):
            scan_calls.append({"args": args, "kwargs": dict(kwargs)})

            async def _coro():
                return Result.Ok({})

            return _coro()

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

    def _create_task(coro):
        try:
            coro.close()
        except Exception:
            pass
        return None

    monkeypatch.setattr(m.asyncio, "create_task", _create_task)

    app = _app()
    req = _json_post_request(app, "/mjr/am/db/backup-restore", b'{"use_latest": true}')
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is True
    assert payload.get("data", {}).get("restored") is True
    assert len(scan_calls) >= 1
    for call in scan_calls:
        kwargs = call.get("kwargs") or {}
        assert kwargs.get("fast") is True
        assert kwargs.get("background_metadata") is True


@pytest.mark.asyncio
async def test_db_backup_restore_rejects_oversized_json_when_content_length_is_small(monkeypatch):
    monkeypatch.setenv("MJR_MAX_JSON_SIZE", "64")
    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))

    app = _app()
    large_body = b'{"name":"' + (b"x" * 4096) + b'"}'
    req = _json_post_request(
        app,
        "/mjr/am/db/backup-restore",
        large_body,
        declared_content_length=2,
    )
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is False
    assert payload.get("code") == "INVALID_INPUT"


# ---------------------------------------------------------------------------
# Trash status / empty routes
# ---------------------------------------------------------------------------


class _FakeTrashService:
    """Standalone fake for the trash_service module used by the routes."""

    def __init__(self, *, supported=True, scan=None, empty=None):
        self.supported = supported
        self.scan_result = scan if scan is not None else ts_types.TrashScan(0, 0, ())
        self.empty_result = empty
        self.empty_calls: list[list] = []

    def is_supported(self, platform=None):
        return self.supported

    def scan(self, roots, **_kwargs):
        return self.scan_result

    def empty(self, roots, **_kwargs):
        self.empty_calls.append(list(roots))
        if isinstance(self.empty_result, Exception):
            raise self.empty_result
        return self.empty_result if self.empty_result is not None else Result.Ok(
            {"removed": 0, "bytes": 0, "failed": [], "skipped_dirs": 0}
        )


def _install_trash(monkeypatch, fake: _FakeTrashService):
    monkeypatch.setattr(m, "trash_service", fake, raising=False)


def _reset_trash_rate_limit():
    from mjr_am_backend.routes.core.security_rate_limit import _reset_rate_limit_state_for_tests

    _reset_rate_limit_state_for_tests()


@pytest.fixture
def trash_rate_limit_clean():
    _reset_trash_rate_limit()
    yield
    _reset_trash_rate_limit()


@pytest.mark.asyncio
async def test_trash_status_success(monkeypatch, tmp_path: Path):
    scan = ts_types.TrashScan(3, 128, ())
    _install_trash(monkeypatch, _FakeTrashService(scan=scan))
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "_trash_roots", lambda: [tmp_path], raising=False)

    app = _app()
    req = make_mocked_request("GET", "/mjr/am/trash", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is True
    assert payload.get("data") == {"supported": True, "count": 3, "bytes": 128}


@pytest.mark.asyncio
async def test_trash_status_unsupported_platform(monkeypatch):
    _install_trash(monkeypatch, _FakeTrashService(supported=False))
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))

    app = _app()
    req = make_mocked_request("GET", "/mjr/am/trash", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is True
    assert payload.get("data") == {"supported": False, "count": 0, "bytes": 0}


@pytest.mark.asyncio
async def test_trash_status_requires_write_access(monkeypatch):
    _install_trash(monkeypatch, _FakeTrashService())
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Err("FORBIDDEN", "no"))

    app = _app()
    req = make_mocked_request("GET", "/mjr/am/trash", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is False
    assert payload.get("code") == "FORBIDDEN"


@pytest.mark.asyncio
async def test_trash_status_scan_error_reported(monkeypatch):
    def _boom(_roots, **_kwargs):
        raise PermissionError("scan failed")

    fake = _FakeTrashService()
    fake.scan = _boom
    _install_trash(monkeypatch, fake)
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "_trash_roots", lambda: [], raising=False)

    app = _app()
    req = make_mocked_request("GET", "/mjr/am/trash", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is False
    assert payload.get("code") == "TRASH_ERROR"


@pytest.mark.asyncio
async def test_trash_empty_success(monkeypatch, tmp_path: Path):
    audit_calls: list[dict] = []

    async def _audit(_services, *, request, operation, target, result, details=None):
        audit_calls.append(
            {
                "operation": operation,
                "target": target,
                "details": dict(details or {}),
                "ok": bool(result.ok),
            }
        )

    monkeypatch.setattr(m, "audit_log_write", _audit)
    fake = _FakeTrashService(
        empty=Result.Ok({"removed": 2, "bytes": 99, "failed": [], "skipped_dirs": 1})
    )
    _install_trash(monkeypatch, fake)
    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))

    async def _require_services():
        return {"settings": object()}, None

    monkeypatch.setattr(m, "_require_services", _require_services)

    async def _prefs(_svc):
        return {"safe_mode": False, "allow_delete": True}

    monkeypatch.setattr(m, "_resolve_security_prefs", _prefs)
    monkeypatch.delenv("MAJOOR_ALLOW_DELETE", raising=False)
    monkeypatch.delenv("MAJOOR_SAFE_MODE", raising=False)
    monkeypatch.setattr(m, "_trash_roots", lambda: [tmp_path], raising=False)
    _reset_trash_rate_limit()
    try:
        app = _app()
        req = make_mocked_request("POST", "/mjr/am/trash/empty", app=app)
        match = await app.router.resolve(req)
        resp = await match.handler(req)
        payload = json.loads(resp.text)
    finally:
        _reset_trash_rate_limit()
    assert payload.get("ok") is True
    assert payload.get("data") == {"removed": 2, "bytes": 99, "failed": [], "skipped_dirs": 1}
    assert fake.empty_calls == [[tmp_path]]
    assert len(audit_calls) == 1
    assert audit_calls[0]["operation"] == "trash_empty"
    assert audit_calls[0]["details"].get("removed") == 2
    assert audit_calls[0]["details"].get("bytes") == 99
    assert audit_calls[0]["details"].get("skipped_dirs") == 1


@pytest.mark.asyncio
async def test_trash_empty_reports_failed_entries(monkeypatch, tmp_path: Path):
    failed = [{"name": "a.png", "error": "permission denied"}]
    fake = _FakeTrashService(
        empty=Result.Ok({"removed": 1, "bytes": 5, "failed": failed, "skipped_dirs": 0})
    )
    _install_trash(monkeypatch, fake)
    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))

    async def _require_services():
        return {"settings": object()}, None

    monkeypatch.setattr(m, "_require_services", _require_services)

    async def _prefs(_svc):
        return {"safe_mode": False, "allow_delete": True}

    monkeypatch.setattr(m, "_resolve_security_prefs", _prefs)
    monkeypatch.delenv("MAJOOR_ALLOW_DELETE", raising=False)
    monkeypatch.delenv("MAJOOR_SAFE_MODE", raising=False)
    monkeypatch.setattr(m, "_trash_roots", lambda: [tmp_path], raising=False)
    _reset_trash_rate_limit()
    try:
        app = _app()
        req = make_mocked_request("POST", "/mjr/am/trash/empty", app=app)
        match = await app.router.resolve(req)
        resp = await match.handler(req)
        payload = json.loads(resp.text)
    finally:
        _reset_trash_rate_limit()
    assert payload.get("ok") is True
    assert payload.get("data", {}).get("failed") == failed


@pytest.mark.asyncio
async def test_trash_empty_unsupported_platform(monkeypatch):
    fake = _FakeTrashService(supported=False)
    _install_trash(monkeypatch, fake)
    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    _reset_trash_rate_limit()
    try:
        app = _app()
        req = make_mocked_request("POST", "/mjr/am/trash/empty", app=app)
        match = await app.router.resolve(req)
        resp = await match.handler(req)
        payload = json.loads(resp.text)
    finally:
        _reset_trash_rate_limit()
    assert payload.get("ok") is False
    assert payload.get("code") == "UNSUPPORTED"
    assert fake.empty_calls == []


@pytest.mark.asyncio
async def test_trash_empty_blocked_when_delete_disabled(monkeypatch):
    """Acceptance: MAJOOR_ALLOW_DELETE unset → POST refused, nothing removed."""
    fake = _FakeTrashService()
    _install_trash(monkeypatch, fake)
    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))

    async def _require_services():
        return {"settings": object()}, None

    monkeypatch.setattr(m, "_require_services", _require_services)

    async def _prefs(_svc):
        return {"safe_mode": False, "allow_delete": True}

    monkeypatch.setattr(m, "_resolve_security_prefs", _prefs)
    monkeypatch.delenv("MAJOOR_ALLOW_DELETE", raising=False)
    monkeypatch.delenv("MAJOOR_SAFE_MODE", raising=False)
    monkeypatch.setattr(
        m,
        "_require_operation_enabled",
        lambda *_args, **_kwargs: Result.Err("FORBIDDEN", "Delete is disabled by default."),
    )
    _reset_trash_rate_limit()
    try:
        app = _app()
        req = make_mocked_request("POST", "/mjr/am/trash/empty", app=app)
        match = await app.router.resolve(req)
        resp = await match.handler(req)
        payload = json.loads(resp.text)
    finally:
        _reset_trash_rate_limit()
    assert payload.get("ok") is False
    assert payload.get("code") == "FORBIDDEN"
    assert fake.empty_calls == []


@pytest.mark.asyncio
async def test_trash_empty_csrf_required(monkeypatch):
    _install_trash(monkeypatch, _FakeTrashService())
    monkeypatch.setattr(m, "_csrf_error", lambda _request: "missing csrf token")
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    _reset_trash_rate_limit()
    try:
        app = _app()
        req = make_mocked_request("POST", "/mjr/am/trash/empty", app=app)
        match = await app.router.resolve(req)
        resp = await match.handler(req)
        payload = json.loads(resp.text)
    finally:
        _reset_trash_rate_limit()
    assert payload.get("ok") is False
    assert payload.get("code") == "CSRF"


@pytest.mark.asyncio
async def test_trash_empty_rate_limited(monkeypatch):
    fake = _FakeTrashService()
    _install_trash(monkeypatch, fake)
    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))

    async def _require_services():
        return {"settings": object()}, None

    monkeypatch.setattr(m, "_require_services", _require_services)

    async def _prefs(_svc):
        return {"safe_mode": False, "allow_delete": True}

    monkeypatch.setattr(m, "_resolve_security_prefs", _prefs)
    monkeypatch.delenv("MAJOOR_ALLOW_DELETE", raising=False)
    monkeypatch.delenv("MAJOOR_SAFE_MODE", raising=False)
    monkeypatch.setattr(m, "_trash_roots", lambda: [], raising=False)
    _reset_trash_rate_limit()
    try:
        app = _app()
        codes = []
        for _ in range(4):
            req = make_mocked_request("POST", "/mjr/am/trash/empty", app=app)
            match = await app.router.resolve(req)
            resp = await match.handler(req)
            codes.append(json.loads(resp.text).get("code"))
    finally:
        _reset_trash_rate_limit()
    assert codes[:3] == ["OK", "OK", "OK"]
    assert codes[3] == "RATE_LIMITED"


@pytest.mark.asyncio
async def test_trash_empty_real_gate_refuses_when_delete_disabled(monkeypatch, tmp_path: Path):
    """Wire the REAL operation gate: trash_empty refused while delete is off."""
    monkeypatch.delenv("MAJOOR_ALLOW_DELETE", raising=False)
    monkeypatch.delenv("MAJOOR_SAFE_MODE", raising=False)
    fake = _FakeTrashService()
    _install_trash(monkeypatch, fake)
    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))

    async def _require_services():
        return {"settings": object()}, None

    monkeypatch.setattr(m, "_require_services", _require_services)

    async def _prefs(_svc):
        return {"safe_mode": False, "allow_delete": False}

    monkeypatch.setattr(m, "_resolve_security_prefs", _prefs)
    monkeypatch.setattr(m, "_trash_roots", lambda: [tmp_path], raising=False)
    _reset_trash_rate_limit()
    try:
        app = _app()
        req = make_mocked_request("POST", "/mjr/am/trash/empty", app=app)
        match = await app.router.resolve(req)
        resp = await match.handler(req)
        payload = json.loads(resp.text)
    finally:
        _reset_trash_rate_limit()
    assert payload.get("ok") is False
    assert payload.get("code") == "FORBIDDEN"
    assert fake.empty_calls == []


@pytest.mark.asyncio
async def test_trash_empty_real_gate_allows_when_delete_enabled(monkeypatch, tmp_path: Path):
    """Wire the REAL operation gate: allow_delete permits trash_empty in safe mode."""
    monkeypatch.delenv("MAJOOR_ALLOW_DELETE", raising=False)
    monkeypatch.delenv("MAJOOR_SAFE_MODE", raising=False)
    fake = _FakeTrashService(
        empty=Result.Ok({"removed": 1, "bytes": 2, "failed": [], "skipped_dirs": 0})
    )
    _install_trash(monkeypatch, fake)
    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))

    async def _require_services():
        return {"settings": object()}, None

    monkeypatch.setattr(m, "_require_services", _require_services)

    async def _prefs(_svc):
        return {"safe_mode": True, "allow_delete": True}

    monkeypatch.setattr(m, "_resolve_security_prefs", _prefs)
    monkeypatch.setattr(m, "_trash_roots", lambda: [tmp_path], raising=False)
    _reset_trash_rate_limit()
    try:
        app = _app()
        req = make_mocked_request("POST", "/mjr/am/trash/empty", app=app)
        match = await app.router.resolve(req)
        resp = await match.handler(req)
        payload = json.loads(resp.text)
    finally:
        _reset_trash_rate_limit()
    assert payload.get("ok") is True
    assert payload.get("data") == {"removed": 1, "bytes": 2, "failed": [], "skipped_dirs": 0}
    assert fake.empty_calls == [[tmp_path]]


@pytest.mark.asyncio
async def test_trash_empty_real_gate_allows_via_env(monkeypatch, tmp_path: Path):
    """MAJOOR_ALLOW_DELETE=1 unlocks trash_empty like deletion."""
    monkeypatch.setenv("MAJOOR_ALLOW_DELETE", "1")
    monkeypatch.delenv("MAJOOR_SAFE_MODE", raising=False)
    fake = _FakeTrashService()
    _install_trash(monkeypatch, fake)
    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))

    async def _require_services():
        return {"settings": object()}, None

    monkeypatch.setattr(m, "_require_services", _require_services)

    async def _prefs(_svc):
        return {"safe_mode": True}

    monkeypatch.setattr(m, "_resolve_security_prefs", _prefs)
    monkeypatch.setattr(m, "_trash_roots", lambda: [tmp_path], raising=False)
    _reset_trash_rate_limit()
    try:
        app = _app()
        req = make_mocked_request("POST", "/mjr/am/trash/empty", app=app)
        match = await app.router.resolve(req)
        resp = await match.handler(req)
        payload = json.loads(resp.text)
    finally:
        _reset_trash_rate_limit()
    assert payload.get("ok") is True
    assert fake.empty_calls == [[tmp_path]]


@pytest.mark.asyncio
async def test_trash_status_rate_limited(monkeypatch):
    """GET /mjr/am/trash is rate-limited to 20 requests per 60 seconds."""
    _install_trash(monkeypatch, _FakeTrashService())
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    _reset_trash_rate_limit()
    try:
        app = _app()
        codes = []
        for _ in range(21):
            req = make_mocked_request("GET", "/mjr/am/trash", app=app)
            match = await app.router.resolve(req)
            resp = await match.handler(req)
            codes.append(json.loads(resp.text).get("code"))
    finally:
        _reset_trash_rate_limit()
    assert codes[:20] == ["OK"] * 20
    assert codes[20] == "RATE_LIMITED"
