import json
from pathlib import Path
from types import SimpleNamespace

import pytest
from aiohttp import web
from aiohttp.test_utils import make_mocked_request

from mjr_am_backend.routes.handlers import scan as scan_mod
from mjr_am_backend.shared import Result


def _app():
    app = web.Application()
    routes = web.RouteTableDef()
    scan_mod.register_scan_routes(routes)
    app.add_routes(routes)
    return app


@pytest.mark.asyncio
async def test_index_files_rejects_invalid_files_list(monkeypatch) -> None:
    async def _require_services():
        return {"index": object()}, None

    async def _read_json(_request):
        return Result.Ok({"files": []})

    monkeypatch.setattr(scan_mod, "_require_services", _require_services)
    monkeypatch.setattr(scan_mod, "is_db_maintenance_active", lambda: False)
    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "_read_json", _read_json)

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/index-files", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("code") == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_watcher_status_returns_disabled_when_missing(monkeypatch) -> None:
    async def _require_services():
        return {"watcher": None}, None

    monkeypatch.setattr(scan_mod, "_require_services", _require_services)

    app = _app()
    req = make_mocked_request("GET", "/mjr/am/watcher/status", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is True
    assert payload.get("data", {}).get("enabled") is False


@pytest.mark.asyncio
async def test_watcher_flush_csrf(monkeypatch) -> None:
    async def _require_services():
        return {"watcher": None}, None

    monkeypatch.setattr(scan_mod, "_require_services", _require_services)
    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: "bad")

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/watcher/flush", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("code") == "CSRF"


@pytest.mark.asyncio
async def test_watcher_flush_calls_flush_pending(monkeypatch) -> None:
    watcher = SimpleNamespace(is_running=True, watched_directories=["C:/x"], flush_pending=lambda: True)

    async def _require_services():
        return {"watcher": watcher}, None

    monkeypatch.setattr(scan_mod, "_require_services", _require_services)
    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/watcher/flush", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is True
    assert payload.get("data", {}).get("flushed") is True


@pytest.mark.asyncio
async def test_watcher_toggle_start_missing_index(monkeypatch) -> None:
    async def _require_services():
        return {"watcher": None}, None

    async def _read_json(_request):
        return Result.Ok({"enabled": True})

    monkeypatch.setattr(scan_mod, "_require_services", _require_services)
    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "_read_json", _read_json)

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/watcher/toggle", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("code") == "SERVICE_UNAVAILABLE"


@pytest.mark.asyncio
async def test_watcher_toggle_stop_existing(monkeypatch) -> None:
    state = {"stopped": False}

    class _Watcher:
        is_running = True

        async def stop(self):
            state["stopped"] = True

    svc = {"watcher": _Watcher()}

    async def _require_services():
        return svc, None

    async def _read_json(_request):
        return Result.Ok({"enabled": False})

    monkeypatch.setattr(scan_mod, "_require_services", _require_services)
    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "_read_json", _read_json)

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/watcher/toggle", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is True
    assert state["stopped"] is True


@pytest.mark.asyncio
async def test_upload_input_invalid_first_field(monkeypatch) -> None:
    class _Reader:
        async def next(self):
            return SimpleNamespace(name="bad", filename="x.png")

    async def _multipart():
        return _Reader()

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/upload_input", app=app)
    req.multipart = _multipart

    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))

    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("code") == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_upload_input_write_failure_bubbles(monkeypatch) -> None:
    class _Reader:
        async def next(self):
            return SimpleNamespace(name="file", filename="x.png")

    async def _multipart():
        return _Reader()

    async def _write_fail(*args, **kwargs):
        _ = (args, kwargs)
        return Result.Err("UPLOAD_FAILED", "no")

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/upload_input", app=app)
    req.multipart = _multipart

    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "_write_multipart_file_atomic", _write_fail)

    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("code") == "UPLOAD_FAILED"


@pytest.mark.asyncio
async def test_watcher_scope_when_disabled_returns_ok(monkeypatch) -> None:
    svc = {"watcher": None, "db": None}

    async def _require_services():
        return svc, None

    async def _read_json(_request):
        return Result.Ok({"scope": "output"})

    monkeypatch.setattr(scan_mod, "_require_services", _require_services)
    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "_read_json", _read_json)

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/watcher/scope", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is True
    assert payload.get("data", {}).get("enabled") is False


@pytest.mark.asyncio
async def test_watcher_scope_custom_invalid_when_running(monkeypatch) -> None:
    class _Watcher:
        is_running = True
        watched_directories = ["C:/x"]

        async def stop(self):
            return None

    svc = {"watcher": _Watcher(), "db": None, "index": object()}

    async def _require_services():
        return svc, None

    async def _read_json(_request):
        return Result.Ok({"scope": "custom", "custom_root_id": "missing"})

    monkeypatch.setattr(scan_mod, "_require_services", _require_services)
    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "_read_json", _read_json)
    monkeypatch.setattr(scan_mod, "build_watch_paths", lambda scope, root_id: [])

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/watcher/scope", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("code") == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_index_files_success_with_metadata_enhancement(monkeypatch, tmp_path: Path) -> None:
    out_root = tmp_path / "out"
    out_root.mkdir()
    fp = out_root / "a.png"
    fp.write_bytes(b"x")

    class _Index:
        async def index_paths(self, paths, base_dir, incremental, source, root_id):
            _ = (paths, base_dir, incremental, source, root_id)
            return Result.Ok(
                {
                    "scanned": 1,
                    "added": 1,
                    "updated": 0,
                    "skipped": 0,
                    "errors": 0,
                    "start_time": "s",
                    "end_time": "e",
                }
            )

    class _Lock:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

    class _Tx:
        ok = True
        error = None

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

    class _DB:
        def atransaction(self):
            return _Tx()

        async def aexecute(self, sql, params=None):
            _ = (sql, params)
            return Result.Ok({})

        async def aexecutemany(self, sql, params):
            _ = (sql, params)
            return Result.Ok({})

        async def aquery(self, sql, params=None):
            _ = (sql, params)
            if "SELECT a.id, am.metadata_raw, t.gen_time" in sql:
                return Result.Ok([{"id": 1, "metadata_raw": "{}", "gen_time": 123}])
            return Result.Ok([{"metadata_raw": "{}"}])

        def lock_for_asset(self, _asset_id):
            return _Lock()

    svc = {"index": _Index(), "db": _DB()}

    async def _require_services():
        return svc, None

    async def _read_json(_request):
        return Result.Ok(
            {
                "files": [
                    {
                        "path": str(fp),
                        "type": "output",
                        "filename": "a.png",
                        "subfolder": "",
                        "generation_time_ms": 123,
                    }
                ],
                "incremental": True,
            }
        )

    monkeypatch.setattr(scan_mod, "_require_services", _require_services)
    monkeypatch.setattr(scan_mod, "is_db_maintenance_active", lambda: False)
    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "_read_json", _read_json)
    async def _runtime_output_root(_svc):
        return str(out_root)

    async def _write_asset_metadata_row(_db, _asset_id, _res):
        return Result.Ok({})

    monkeypatch.setattr(scan_mod, "_runtime_output_root", _runtime_output_root)
    monkeypatch.setattr(scan_mod.MetadataHelpers, "write_asset_metadata_row", staticmethod(_write_asset_metadata_row))
    monkeypatch.setattr(scan_mod, "_is_path_allowed", lambda _p: True)
    monkeypatch.setattr(scan_mod, "_is_path_allowed_custom", lambda _p: True)
    monkeypatch.setattr(scan_mod, "folder_paths", SimpleNamespace(get_input_directory=lambda: str(out_root)))

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/index-files", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is True
    assert payload.get("data", {}).get("scanned") == 1


@pytest.mark.asyncio
async def test_reset_index_csrf_short_circuit(monkeypatch) -> None:
    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: "bad")

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/index/reset", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("code") == "CSRF"


@pytest.mark.asyncio
async def test_reset_index_unknown_scope(monkeypatch) -> None:
    async def _require_services():
        return {"db": object()}, None

    async def _read_json(_request):
        return Result.Ok({"scope": "weird"})

    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "_require_services", _require_services)
    async def _resolve_security_prefs(_svc):
        return {}

    monkeypatch.setattr(scan_mod, "_resolve_security_prefs", _resolve_security_prefs)
    monkeypatch.setattr(scan_mod, "_require_operation_enabled", lambda *_args, **_kwargs: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "is_db_maintenance_active", lambda: False)
    monkeypatch.setattr(scan_mod, "_read_json", _read_json)

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/index/reset", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("code") == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_reset_index_scope_custom_requires_id(monkeypatch) -> None:
    async def _require_services():
        return {"db": object()}, None

    async def _read_json(_request):
        return Result.Ok({"scope": "custom"})

    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "_require_services", _require_services)
    async def _resolve_security_prefs(_svc):
        return {}

    monkeypatch.setattr(scan_mod, "_resolve_security_prefs", _resolve_security_prefs)
    monkeypatch.setattr(scan_mod, "_require_operation_enabled", lambda *_args, **_kwargs: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "is_db_maintenance_active", lambda: False)
    monkeypatch.setattr(scan_mod, "_read_json", _read_json)

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/index/reset", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("code") == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_reset_index_missing_db_service(monkeypatch) -> None:
    async def _require_services():
        return {"index": object()}, None

    async def _read_json(_request):
        return Result.Ok({"scope": "output"})

    async def _runtime_output_root(_svc):
        return "C:/out"

    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "_require_services", _require_services)
    async def _resolve_security_prefs(_svc):
        return {}

    monkeypatch.setattr(scan_mod, "_resolve_security_prefs", _resolve_security_prefs)
    monkeypatch.setattr(scan_mod, "_require_operation_enabled", lambda *_args, **_kwargs: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "is_db_maintenance_active", lambda: False)
    monkeypatch.setattr(scan_mod, "_read_json", _read_json)
    monkeypatch.setattr(scan_mod, "_runtime_output_root", _runtime_output_root)

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/index/reset", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("code") == "SERVICE_UNAVAILABLE"


@pytest.mark.asyncio
async def test_reset_index_hard_reset_path_no_reindex(monkeypatch, tmp_path: Path) -> None:
    out_root = tmp_path / "out"
    in_root = tmp_path / "in"
    out_root.mkdir()
    in_root.mkdir()

    class _DB:
        async def areset(self):
            return Result.Ok({}, file_ops={"deleted": 3})

    async def _runtime_output_root(_svc):
        return str(out_root)

    async def _require_services():
        return {"db": _DB(), "index": object()}, None

    async def _read_json(_request):
        return Result.Ok({"scope": "all", "reindex": False})

    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "_require_services", _require_services)
    async def _resolve_security_prefs(_svc):
        return {}

    monkeypatch.setattr(scan_mod, "_resolve_security_prefs", _resolve_security_prefs)
    monkeypatch.setattr(scan_mod, "_require_operation_enabled", lambda *_args, **_kwargs: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "is_db_maintenance_active", lambda: False)
    monkeypatch.setattr(scan_mod, "_read_json", _read_json)
    monkeypatch.setattr(scan_mod, "_runtime_output_root", _runtime_output_root)
    monkeypatch.setattr(scan_mod, "folder_paths", SimpleNamespace(get_input_directory=lambda: str(in_root)))

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/index/reset", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is True
    assert payload.get("data", {}).get("cleared", {}).get("hard_reset_db") is True


@pytest.mark.asyncio
async def test_reset_index_clear_and_reindex_success(monkeypatch, tmp_path: Path) -> None:
    out_root = tmp_path / "out"
    out_root.mkdir()
    (out_root / "x.txt").write_text("x")

    class _Tx:
        ok = True
        error = None

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

    class _DB:
        def atransaction(self, mode="immediate"):
            _ = mode
            return _Tx()

        async def aexecute(self, sql, params=None):
            _ = (sql, params)
            return Result.Ok(1)

        async def avacuum(self):
            return Result.Ok({})

    class _Index:
        async def stop_enrichment(self, clear_queue=True):
            _ = clear_queue
            return None

        async def scan_directory(self, *args, **kwargs):
            _ = (args, kwargs)
            return Result.Ok({"scanned": 1, "added": 1, "updated": 0, "skipped": 0, "errors": 0})

    async def _runtime_output_root(_svc):
        return str(out_root)

    async def _require_services():
        return {"db": _DB(), "index": _Index()}, None

    async def _read_json(_request):
        return Result.Ok(
            {
                "scope": "output",
                "reindex": True,
                "rebuild_fts": True,
                "clear_scan_journal": True,
                "clear_metadata_cache": True,
                "clear_asset_metadata": True,
                "clear_assets": True,
            }
        )

    async def _rebuild_fts(_db):
        return Result.Ok({})

    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "_require_services", _require_services)
    async def _resolve_security_prefs(_svc):
        return {}

    monkeypatch.setattr(scan_mod, "_resolve_security_prefs", _resolve_security_prefs)
    monkeypatch.setattr(scan_mod, "_require_operation_enabled", lambda *_args, **_kwargs: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "is_db_maintenance_active", lambda: False)
    monkeypatch.setattr(scan_mod, "_read_json", _read_json)
    monkeypatch.setattr(scan_mod, "_runtime_output_root", _runtime_output_root)
    monkeypatch.setattr(scan_mod, "rebuild_fts", _rebuild_fts)

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/index/reset", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is True
    assert payload.get("data", {}).get("scan_summary", {}).get("scanned") == 1


@pytest.mark.asyncio
async def test_stage_to_input_invalid_files_list(monkeypatch) -> None:
    async def _require_services():
        return {"index": object()}, None

    async def _read_json(_request):
        return Result.Ok({"files": []})

    monkeypatch.setattr(scan_mod, "_require_services", _require_services)
    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "_read_json", _read_json)

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/stage-to-input", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("code") == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_stage_to_input_reused_existing_file(monkeypatch, tmp_path: Path) -> None:
    out_root = tmp_path / "out"
    in_root = tmp_path / "in"
    src_sub = out_root / "s"
    src_sub.mkdir(parents=True)
    in_root.mkdir()
    src = src_sub / "a.png"
    src.write_bytes(b"abc")
    staged_dir = in_root / "mjr_staged" / "s"
    staged_dir.mkdir(parents=True)
    dst = staged_dir / "a.png"
    dst.write_bytes(b"abc")

    async def _runtime_output_root(_svc):
        return str(out_root)

    async def _require_services():
        return {"index": object()}, None

    async def _read_json(_request):
        return Result.Ok({"files": [{"filename": "a.png", "subfolder": "s", "type": "output"}], "index": False})

    monkeypatch.setattr(scan_mod, "_runtime_output_root", _runtime_output_root)
    monkeypatch.setattr(scan_mod, "_require_services", _require_services)
    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "_read_json", _read_json)
    monkeypatch.setattr(scan_mod, "_is_path_allowed", lambda _p: True)
    monkeypatch.setattr(scan_mod, "folder_paths", SimpleNamespace(get_input_directory=lambda: str(in_root)))

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/stage-to-input", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is True
    assert len(payload.get("data", {}).get("staged", [])) == 1


@pytest.mark.asyncio
async def test_stage_to_input_dest_subfolder_invalid(monkeypatch, tmp_path: Path) -> None:
    out_root = tmp_path / "out"
    in_root = tmp_path / "in"
    out_root.mkdir()
    in_root.mkdir()
    src = out_root / "a.png"
    src.write_bytes(b"x")

    async def _runtime_output_root(_svc):
        return str(out_root)

    async def _require_services():
        return {"index": object()}, None

    async def _read_json(_request):
        return Result.Ok(
            {"files": [{"filename": "a.png", "subfolder": "", "type": "output", "dest_subfolder": "../bad"}]}
        )

    monkeypatch.setattr(scan_mod, "_runtime_output_root", _runtime_output_root)
    monkeypatch.setattr(scan_mod, "_require_services", _require_services)
    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "_read_json", _read_json)
    monkeypatch.setattr(scan_mod, "_is_path_allowed", lambda _p: True)
    monkeypatch.setattr(scan_mod, "folder_paths", SimpleNamespace(get_input_directory=lambda: str(in_root)))

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/stage-to-input", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("code") == "STAGE_FAILED"


@pytest.mark.asyncio
async def test_stage_to_input_copy_success_and_index_scheduled(monkeypatch, tmp_path: Path) -> None:
    out_root = tmp_path / "out"
    in_root = tmp_path / "in"
    out_root.mkdir()
    in_root.mkdir()
    src = out_root / "a.png"
    src.write_bytes(b"abc")
    called = {"scheduled": 0}

    class _Index:
        async def index_paths(self, *_args, **_kwargs):
            return Result.Ok({})

    async def _runtime_output_root(_svc):
        return str(out_root)

    async def _require_services():
        return {"index": _Index()}, None

    async def _read_json(_request):
        return Result.Ok({"files": [{"filename": "a.png", "subfolder": "", "type": "output"}], "index": True})

    def _schedule(fn):
        called["scheduled"] += 1
        _ = fn

    monkeypatch.setattr(scan_mod, "_runtime_output_root", _runtime_output_root)
    monkeypatch.setattr(scan_mod, "_require_services", _require_services)
    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "_read_json", _read_json)
    monkeypatch.setattr(scan_mod, "_is_path_allowed", lambda _p: True)
    monkeypatch.setattr(scan_mod, "_schedule_index_task", _schedule)
    monkeypatch.setattr(scan_mod, "folder_paths", SimpleNamespace(get_input_directory=lambda: str(in_root)))

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/stage-to-input", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is True
    assert called["scheduled"] == 1


@pytest.mark.asyncio
async def test_stage_to_input_timeout(monkeypatch, tmp_path: Path) -> None:
    out_root = tmp_path / "out"
    in_root = tmp_path / "in"
    out_root.mkdir()
    in_root.mkdir()
    src = out_root / "a.png"
    src.write_bytes(b"x")

    async def _runtime_output_root(_svc):
        return str(out_root)

    async def _require_services():
        return {"index": object()}, None

    async def _read_json(_request):
        return Result.Ok({"files": [{"filename": "a.png", "subfolder": "", "type": "output"}]})

    import asyncio

    async def _raise_timeout(coro, *args, **kwargs):
        _ = (args, kwargs)
        try:
            coro.close()
        except Exception:
            pass
        raise asyncio.TimeoutError()

    monkeypatch.setattr(scan_mod, "_runtime_output_root", _runtime_output_root)
    monkeypatch.setattr(scan_mod, "_require_services", _require_services)
    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "_read_json", _read_json)
    monkeypatch.setattr(scan_mod, "_is_path_allowed", lambda _p: True)
    monkeypatch.setattr(scan_mod, "folder_paths", SimpleNamespace(get_input_directory=lambda: str(in_root)))
    monkeypatch.setattr(scan_mod.asyncio, "wait_for", _raise_timeout)

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/stage-to-input", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("code") == "TIMEOUT"


@pytest.mark.asyncio
async def test_stage_to_input_custom_root_error(monkeypatch, tmp_path: Path) -> None:
    in_root = tmp_path / "in"
    in_root.mkdir()

    async def _runtime_output_root(_svc):
        return str(tmp_path / "out")

    async def _require_services():
        return {"index": object()}, None

    async def _read_json(_request):
        return Result.Ok({"files": [{"filename": "a.png", "type": "custom", "root_id": "missing"}]})

    monkeypatch.setattr(scan_mod, "_runtime_output_root", _runtime_output_root)
    monkeypatch.setattr(scan_mod, "_require_services", _require_services)
    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "_read_json", _read_json)
    monkeypatch.setattr(scan_mod, "resolve_custom_root", lambda _rid: Result.Err("INVALID_INPUT", "bad root"))
    monkeypatch.setattr(scan_mod, "folder_paths", SimpleNamespace(get_input_directory=lambda: str(in_root)))

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/stage-to-input", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("code") == "STAGE_FAILED"


@pytest.mark.asyncio
async def test_stage_to_input_all_failures_returns_stage_failed(monkeypatch, tmp_path: Path) -> None:
    out_root = tmp_path / "out"
    in_root = tmp_path / "in"
    out_root.mkdir()
    in_root.mkdir()
    src = out_root / "a.png"
    src.write_bytes(b"x")

    async def _runtime_output_root(_svc):
        return str(out_root)

    async def _require_services():
        return {"index": object()}, None

    async def _read_json(_request):
        return Result.Ok({"files": [{"filename": "a.png", "type": "output"}]})

    async def _fake_to_thread(fn, ops):
        _ = fn
        return [{"ok": False, "error": "copy failed"} for _ in ops]

    monkeypatch.setattr(scan_mod, "_runtime_output_root", _runtime_output_root)
    monkeypatch.setattr(scan_mod, "_require_services", _require_services)
    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "_read_json", _read_json)
    monkeypatch.setattr(scan_mod, "_is_path_allowed", lambda _p: True)
    monkeypatch.setattr(scan_mod, "folder_paths", SimpleNamespace(get_input_directory=lambda: str(in_root)))
    monkeypatch.setattr(scan_mod.asyncio, "to_thread", _fake_to_thread)

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/stage-to-input", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("code") == "STAGE_FAILED"


@pytest.mark.asyncio
async def test_upload_input_success_node_drop_skips_index(monkeypatch, tmp_path: Path) -> None:
    in_root = tmp_path / "in"
    in_root.mkdir()

    class _Reader:
        async def next(self):
            return SimpleNamespace(name="file", filename="x.png")

    async def _multipart():
        return _Reader()

    async def _write_ok(dest_dir, filename, field):
        _ = (filename, field)
        p = Path(dest_dir) / "x.png"
        p.write_bytes(b"x")
        return Result.Ok(p)

    called = {"scheduled": 0}

    def _schedule(_fn):
        called["scheduled"] += 1

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/upload_input?purpose=node_drop", app=app)
    req.multipart = _multipart

    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "_write_multipart_file_atomic", _write_ok)
    monkeypatch.setattr(scan_mod, "folder_paths", SimpleNamespace(get_input_directory=lambda: str(in_root)))
    monkeypatch.setattr(scan_mod, "_schedule_index_task", _schedule)

    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is True
    assert called["scheduled"] == 0


@pytest.mark.asyncio
async def test_watcher_status_enabled(monkeypatch) -> None:
    watcher = SimpleNamespace(is_running=True, watched_directories=["C:/x"])

    async def _require_services():
        return {"watcher": watcher}, None

    monkeypatch.setattr(scan_mod, "_require_services", _require_services)

    app = _app()
    req = make_mocked_request("GET", "/mjr/am/watcher/status", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("data", {}).get("enabled") is True


@pytest.mark.asyncio
async def test_watcher_toggle_enabled_already_running(monkeypatch) -> None:
    watcher = SimpleNamespace(is_running=True, watched_directories=["C:/x"])
    svc = {"watcher": watcher}

    async def _require_services():
        return svc, None

    async def _read_json(_request):
        return Result.Ok({"enabled": True})

    monkeypatch.setattr(scan_mod, "_require_services", _require_services)
    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "_read_json", _read_json)

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/watcher/toggle", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is True
    assert payload.get("data", {}).get("enabled") is True


@pytest.mark.asyncio
async def test_watcher_scope_running_without_index_service(monkeypatch) -> None:
    class _Watcher:
        is_running = True
        watched_directories = ["C:/x"]

    svc = {"watcher": _Watcher(), "db": None}

    async def _require_services():
        return svc, None

    async def _read_json(_request):
        return Result.Ok({"scope": "output"})

    monkeypatch.setattr(scan_mod, "_require_services", _require_services)
    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "_read_json", _read_json)
    monkeypatch.setattr(scan_mod, "build_watch_paths", lambda scope, root_id: [{"path": "C:/x"}])

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/watcher/scope", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("code") == "SERVICE_UNAVAILABLE"


@pytest.mark.asyncio
async def test_scan_route_scope_all_success(monkeypatch, tmp_path: Path) -> None:
    out_root = tmp_path / "out"
    in_root = tmp_path / "in"
    out_root.mkdir()
    in_root.mkdir()

    class _Index:
        async def scan_directory(self, *_args, **_kwargs):
            return Result.Ok({"scanned": 1, "added": 1, "updated": 0, "skipped": 0, "errors": 0})

    async def _require_services():
        return {"index": _Index()}, None

    async def _read_json(_request):
        return Result.Ok({"scope": "all", "recursive": True, "incremental": True})

    monkeypatch.setattr(scan_mod, "_require_services", _require_services)
    monkeypatch.setattr(scan_mod, "is_db_maintenance_active", lambda: False)
    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    monkeypatch.setattr(scan_mod, "_read_json", _read_json)
    async def _runtime_output_root(_svc):
        return str(out_root)

    monkeypatch.setattr(scan_mod, "_runtime_output_root", _runtime_output_root)
    monkeypatch.setattr(scan_mod, "folder_paths", SimpleNamespace(get_input_directory=lambda: str(in_root)))

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/scan", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is True
    assert payload.get("data", {}).get("scope") == "all"


@pytest.mark.asyncio
async def test_watcher_toggle_start_no_directories(monkeypatch) -> None:
    svc = {"watcher": None, "index": object(), "watcher_scope": {"scope": "output"}}

    async def _require_services():
        return svc, None

    async def _read_json(_request):
        return Result.Ok({"enabled": True})

    monkeypatch.setattr(scan_mod, "_require_services", _require_services)
    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "_read_json", _read_json)
    monkeypatch.setattr(scan_mod, "build_watch_paths", lambda *_args, **_kwargs: [])

    class _OutputWatcher:
        def __init__(self, *_args, **_kwargs):
            self.watched_directories = []
            self.is_running = False

    import mjr_am_backend.features.index.watcher as watcher_mod
    monkeypatch.setattr(watcher_mod, "OutputWatcher", _OutputWatcher)

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/watcher/toggle", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("code") == "NO_DIRECTORIES"


@pytest.mark.asyncio
async def test_watcher_toggle_start_success(monkeypatch) -> None:
    class _Index:
        async def index_paths(self, *args, **kwargs):
            _ = (args, kwargs)
            return Result.Ok({})

        async def remove_file(self, *args, **kwargs):
            _ = (args, kwargs)
            return Result.Ok({})

        async def rename_file(self, *args, **kwargs):
            _ = (args, kwargs)
            return Result.Ok({})

    svc = {"watcher": None, "index": _Index(), "watcher_scope": {"scope": "output"}}

    async def _require_services():
        return svc, None

    async def _read_json(_request):
        return Result.Ok({"enabled": True})

    monkeypatch.setattr(scan_mod, "_require_services", _require_services)
    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "_read_json", _read_json)
    monkeypatch.setattr(scan_mod, "build_watch_paths", lambda *_args, **_kwargs: [{"path": "C:/x"}])

    class _OutputWatcher:
        def __init__(self, index_cb, remove_callback=None, move_callback=None):
            self._index_cb = index_cb
            self._remove_cb = remove_callback
            self._move_cb = move_callback
            self.watched_directories = []
            self.is_running = False

        async def start(self, watch_paths, loop):
            _ = loop
            await self._index_cb(["C:/x/a.png"], "C:/x", "watcher", None)
            if self._remove_cb:
                await self._remove_cb(["C:/x/a.png"], "C:/x", "watcher", None)
            if self._move_cb:
                await self._move_cb([("C:/x/a.png", "C:/x/b.png")], "C:/x", "watcher", None)
            self.watched_directories = [str((watch_paths or [{}])[0].get("path") or "C:/x")]
            self.is_running = True

    import mjr_am_backend.features.index.watcher as watcher_mod
    monkeypatch.setattr(watcher_mod, "OutputWatcher", _OutputWatcher)

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/watcher/toggle", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is True
    assert payload.get("data", {}).get("enabled") is True


@pytest.mark.asyncio
async def test_watcher_scope_idempotent(monkeypatch) -> None:
    class _Watcher:
        is_running = True
        watched_directories = ["C:/x"]

        async def stop(self):
            return None

    svc = {"watcher": _Watcher(), "db": None, "index": object()}

    async def _require_services():
        return svc, None

    async def _read_json(_request):
        return Result.Ok({"scope": "output"})

    monkeypatch.setattr(scan_mod, "_require_services", _require_services)
    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "_read_json", _read_json)
    monkeypatch.setattr(scan_mod, "build_watch_paths", lambda *_args, **_kwargs: [{"path": "C:/x"}])

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/watcher/scope", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is True
    assert payload.get("data", {}).get("enabled") is True


@pytest.mark.asyncio
async def test_watcher_scope_restart_success(monkeypatch) -> None:
    class _Index:
        async def index_paths(self, *args, **kwargs):
            _ = (args, kwargs)
            return Result.Ok({})

        async def remove_file(self, *args, **kwargs):
            _ = (args, kwargs)
            return Result.Ok({})

        async def rename_file(self, *args, **kwargs):
            _ = (args, kwargs)
            return Result.Ok({})

    class _Watcher:
        is_running = True
        watched_directories = ["C:/old"]

        async def stop(self):
            return None

    svc = {"watcher": _Watcher(), "db": None, "index": _Index()}

    async def _require_services():
        return svc, None

    async def _read_json(_request):
        return Result.Ok({"scope": "output"})

    monkeypatch.setattr(scan_mod, "_require_services", _require_services)
    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "_read_json", _read_json)
    monkeypatch.setattr(scan_mod, "build_watch_paths", lambda *_args, **_kwargs: [{"path": "C:/new"}])

    class _OutputWatcher:
        def __init__(self, index_cb, remove_callback=None, move_callback=None):
            self._index_cb = index_cb
            self._remove_cb = remove_callback
            self._move_cb = move_callback
            self.watched_directories = []
            self.is_running = False

        async def start(self, watch_paths, loop):
            _ = loop
            await self._index_cb(["C:/new/a.png"], "C:/new", "watcher", None)
            if self._remove_cb:
                await self._remove_cb(["C:/new/a.png"], "C:/new", "watcher", None)
            if self._move_cb:
                await self._move_cb([("C:/new/a.png", "C:/new/b.png")], "C:/new", "watcher", None)
            self.watched_directories = [str((watch_paths or [{}])[0].get("path") or "C:/new")]
            self.is_running = True

    import mjr_am_backend.features.index.watcher as watcher_mod
    monkeypatch.setattr(watcher_mod, "OutputWatcher", _OutputWatcher)

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/watcher/scope", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is True
    assert payload.get("data", {}).get("enabled") is True


@pytest.mark.asyncio
async def test_scan_route_scope_output_success(monkeypatch, tmp_path: Path) -> None:
    out_root = tmp_path / "out"
    out_root.mkdir()
    scheduled = {"n": 0}

    class _Index:
        async def scan_directory(self, *_args, **_kwargs):
            return Result.Ok({"scanned": 2, "added": 1, "updated": 0, "skipped": 1, "errors": 0})

    async def _require_services():
        return {"index": _Index(), "db": object()}, None

    async def _read_json(_request):
        return Result.Ok({"scope": "output"})

    async def _runtime_output_root(_svc):
        return str(out_root)

    def _create_task(coro):
        scheduled["n"] += 1
        coro.close()
        return None

    monkeypatch.setattr(scan_mod, "_require_services", _require_services)
    monkeypatch.setattr(scan_mod, "is_db_maintenance_active", lambda: False)
    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "_check_rate_limit", lambda *args, **kwargs: (True, None))
    monkeypatch.setattr(scan_mod, "_read_json", _read_json)
    monkeypatch.setattr(scan_mod, "_runtime_output_root", _runtime_output_root)
    monkeypatch.setattr(scan_mod, "_is_path_allowed", lambda _p: True)
    monkeypatch.setattr(scan_mod.asyncio, "create_task", _create_task)

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/scan", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is True
    assert scheduled["n"] == 1


@pytest.mark.asyncio
async def test_index_files_absolute_path_success(monkeypatch, tmp_path: Path) -> None:
    out_root = tmp_path / "out"
    out_root.mkdir()
    fp = out_root / "a.png"
    fp.write_bytes(b"x")
    marked = {"n": 0}

    class _Index:
        async def index_paths(self, *_args, **_kwargs):
            return Result.Ok({"scanned": 1, "added": 0, "updated": 1, "skipped": 0, "errors": 0, "start_time": "s", "end_time": "e"})

    async def _require_services():
        return {"index": _Index(), "db": None}, None

    async def _read_json(_request):
        return Result.Ok({"files": [{"path": str(fp), "type": "output"}], "origin": "generation"})

    async def _runtime_output_root(_svc):
        return str(out_root)

    import mjr_am_backend.features.index.watcher as watcher_mod

    def _mark(paths):
        marked["n"] += len(paths or [])

    monkeypatch.setattr(watcher_mod, "mark_recent_generated", _mark)
    monkeypatch.setattr(scan_mod, "_require_services", _require_services)
    monkeypatch.setattr(scan_mod, "is_db_maintenance_active", lambda: False)
    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "_read_json", _read_json)
    monkeypatch.setattr(scan_mod, "_runtime_output_root", _runtime_output_root)
    monkeypatch.setattr(scan_mod, "_is_path_allowed", lambda _p: True)
    monkeypatch.setattr(scan_mod, "_is_path_allowed_custom", lambda _p: True)
    monkeypatch.setattr(scan_mod, "folder_paths", SimpleNamespace(get_input_directory=lambda: str(out_root)))

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/index-files", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is True
    assert marked["n"] == 1


@pytest.mark.asyncio
async def test_reset_index_malformed_fallback_then_reindex_and_cleanup(monkeypatch, tmp_path: Path) -> None:
    out_root = tmp_path / "out"
    in_root = tmp_path / "in"
    idx_root = tmp_path / "idx"
    out_root.mkdir()
    in_root.mkdir()
    idx_root.mkdir()
    (idx_root / "temp.bin").write_text("x")
    (idx_root / "assets.sqlite").write_text("keep")
    (idx_root / "custom_roots.json").write_text("keep2")

    class _Tx:
        ok = True
        error = None

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

    class _DB:
        def __init__(self):
            self.calls = 0

        def atransaction(self, mode="immediate"):
            _ = mode
            return _Tx()

        async def aexecute(self, sql, params=None):
            _ = (sql, params)
            self.calls += 1
            if self.calls == 1:
                return Result.Err("DB_ERROR", "database disk image is malformed")
            return Result.Ok(1)

        async def areset(self):
            return Result.Ok({}, file_ops={"deleted": 1})

        async def avacuum(self):
            return Result.Ok({})

    class _Index:
        async def stop_enrichment(self, clear_queue=True):
            _ = clear_queue
            return None

        async def scan_directory(self, *_args, **_kwargs):
            return Result.Ok({"scanned": 1, "added": 0, "updated": 1, "skipped": 0, "errors": 0})

    db = _DB()

    async def _runtime_output_root(_svc):
        return str(out_root)

    async def _require_services():
        return {"db": db, "index": _Index()}, None

    async def _read_json(_request):
        return Result.Ok(
            {
                "scope": "all",
                "reindex": True,
                "rebuild_fts": False,
                "clear_scan_journal": True,
                "clear_metadata_cache": True,
                "clear_asset_metadata": False,
                "clear_assets": False,
            }
        )

    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "_require_services", _require_services)
    monkeypatch.setattr(scan_mod, "is_db_maintenance_active", lambda: False)
    monkeypatch.setattr(scan_mod, "_read_json", _read_json)
    monkeypatch.setattr(scan_mod, "_runtime_output_root", _runtime_output_root)
    monkeypatch.setattr(scan_mod, "folder_paths", SimpleNamespace(get_input_directory=lambda: str(in_root)))
    monkeypatch.setattr(scan_mod, "INDEX_DIR_PATH", idx_root)
    monkeypatch.setattr(scan_mod, "COLLECTIONS_DIR_PATH", idx_root / "collections")

    async def _resolve_security_prefs(_svc):
        return {}

    monkeypatch.setattr(scan_mod, "_resolve_security_prefs", _resolve_security_prefs)
    monkeypatch.setattr(scan_mod, "_require_operation_enabled", lambda *_args, **_kwargs: Result.Ok({}))

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/index/reset", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is True
    assert payload.get("data", {}).get("cleared", {}).get("fallback_reason") == "malformed_db"
    assert (idx_root / "temp.bin").exists() is False


@pytest.mark.asyncio
async def test_reset_index_non_malformed_clear_error_returns_error(monkeypatch, tmp_path: Path) -> None:
    out_root = tmp_path / "out"
    out_root.mkdir()

    class _Tx:
        ok = True
        error = None

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

    class _DB:
        def atransaction(self, mode="immediate"):
            _ = mode
            return _Tx()

        async def aexecute(self, sql, params=None):
            _ = (sql, params)
            return Result.Err("DB_ERROR", "generic failure")

    class _Index:
        async def stop_enrichment(self, clear_queue=True):
            _ = clear_queue

    async def _runtime_output_root(_svc):
        return str(out_root)

    async def _require_services():
        return {"db": _DB(), "index": _Index()}, None

    async def _read_json(_request):
        return Result.Ok({"scope": "output", "reindex": False})

    async def _resolve_security_prefs(_svc):
        return {}

    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "_require_services", _require_services)
    monkeypatch.setattr(scan_mod, "_resolve_security_prefs", _resolve_security_prefs)
    monkeypatch.setattr(scan_mod, "_require_operation_enabled", lambda *_args, **_kwargs: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "is_db_maintenance_active", lambda: False)
    monkeypatch.setattr(scan_mod, "_read_json", _read_json)
    monkeypatch.setattr(scan_mod, "_runtime_output_root", _runtime_output_root)

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/index/reset", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is False
    assert payload.get("code") == "DB_ERROR"


@pytest.mark.asyncio
async def test_upload_input_csrf_and_auth(monkeypatch) -> None:
    app = _app()

    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: "bad")
    req1 = make_mocked_request("POST", "/mjr/am/upload_input", app=app)
    match1 = await app.router.resolve(req1)
    resp1 = await match1.handler(req1)
    payload1 = json.loads(resp1.text)
    assert payload1.get("code") == "CSRF"

    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Err("FORBIDDEN", "no"))
    req2 = make_mocked_request("POST", "/mjr/am/upload_input", app=app)
    match2 = await app.router.resolve(req2)
    resp2 = await match2.handler(req2)
    payload2 = json.loads(resp2.text)
    assert payload2.get("code") == "FORBIDDEN"


@pytest.mark.asyncio
async def test_upload_input_no_filename_and_exception(monkeypatch) -> None:
    class _Reader:
        async def next(self):
            return SimpleNamespace(name="file", filename="")

    async def _multipart():
        return _Reader()

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/upload_input", app=app)
    req.multipart = _multipart

    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))

    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("code") == "INVALID_INPUT"

    async def _boom_multipart():
        raise RuntimeError("x")

    req2 = make_mocked_request("POST", "/mjr/am/upload_input", app=app)
    req2.multipart = _boom_multipart
    match2 = await app.router.resolve(req2)
    resp2 = await match2.handler(req2)
    payload2 = json.loads(resp2.text)
    assert payload2.get("code") == "UPLOAD_FAILED"


@pytest.mark.asyncio
async def test_watcher_settings_get_success_and_error(monkeypatch) -> None:
    async def _require_services_ok():
        return {"watcher": None}, None

    async def _require_services_err():
        return None, Result.Err("SERVICE_UNAVAILABLE", "no")

    app = _app()

    monkeypatch.setattr(scan_mod, "_require_services", _require_services_ok)
    monkeypatch.setattr(scan_mod, "get_watcher_settings", lambda: SimpleNamespace(debounce_ms=1, dedupe_ttl_ms=2))
    req = make_mocked_request("GET", "/mjr/am/watcher/settings", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is True

    monkeypatch.setattr(scan_mod, "_require_services", _require_services_err)
    req2 = make_mocked_request("GET", "/mjr/am/watcher/settings", app=app)
    match2 = await app.router.resolve(req2)
    resp2 = await match2.handler(req2)
    payload2 = json.loads(resp2.text)
    assert payload2.get("code") == "SERVICE_UNAVAILABLE"


@pytest.mark.asyncio
async def test_watcher_settings_update_branches(monkeypatch) -> None:
    svc = {"watcher": SimpleNamespace(refresh_runtime_settings=lambda: None)}

    async def _require_services():
        return svc, None

    app = _app()
    monkeypatch.setattr(scan_mod, "_require_services", _require_services)

    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: "bad")
    req1 = make_mocked_request("POST", "/mjr/am/watcher/settings", app=app)
    match1 = await app.router.resolve(req1)
    resp1 = await match1.handler(req1)
    payload1 = json.loads(resp1.text)
    assert payload1.get("code") == "CSRF"

    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    async def _read_json_empty(_request):
        return Result.Ok({})

    monkeypatch.setattr(scan_mod, "_read_json", _read_json_empty)
    req2 = make_mocked_request("POST", "/mjr/am/watcher/settings", app=app)
    match2 = await app.router.resolve(req2)
    resp2 = await match2.handler(req2)
    payload2 = json.loads(resp2.text)
    assert payload2.get("code") == "INVALID_INPUT"

    async def _read_json_one(_request):
        return Result.Ok({"debounce_ms": 5})

    monkeypatch.setattr(scan_mod, "_read_json", _read_json_one)
    monkeypatch.setattr(scan_mod, "update_watcher_settings", lambda **kwargs: SimpleNamespace(debounce_ms=kwargs.get("debounce_ms"), dedupe_ttl_ms=0))
    req3 = make_mocked_request("POST", "/mjr/am/watcher/settings", app=app)
    match3 = await app.router.resolve(req3)
    resp3 = await match3.handler(req3)
    payload3 = json.loads(resp3.text)
    assert payload3.get("ok") is True


@pytest.mark.asyncio
async def test_upload_input_success_with_index_schedule_and_services_error(monkeypatch, tmp_path: Path) -> None:
    in_root = tmp_path / "in"
    in_root.mkdir()

    class _Reader:
        async def next(self):
            return SimpleNamespace(name="file", filename="x.png")

    async def _multipart():
        return _Reader()

    async def _write_ok(dest_dir, filename, field):
        _ = (filename, field)
        p = Path(dest_dir) / "x.png"
        p.write_bytes(b"x")
        return Result.Ok(p)

    class _Index:
        async def index_paths(self, *_args, **_kwargs):
            return Result.Ok({})

    called = {"n": 0}

    def _schedule(_fn):
        called["n"] += 1

    async def _require_services_ok():
        return {"index": _Index()}, None

    app = _app()
    req = make_mocked_request("POST", "/mjr/am/upload_input", app=app)
    req.multipart = _multipart
    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(scan_mod, "_write_multipart_file_atomic", _write_ok)
    monkeypatch.setattr(scan_mod, "_require_services", _require_services_ok)
    monkeypatch.setattr(scan_mod, "_schedule_index_task", _schedule)
    monkeypatch.setattr(scan_mod, "folder_paths", SimpleNamespace(get_input_directory=lambda: str(in_root)))
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is True
    assert called["n"] == 1

    async def _require_services_boom():
        raise RuntimeError("x")

    req2 = make_mocked_request("POST", "/mjr/am/upload_input", app=app)
    req2.multipart = _multipart
    monkeypatch.setattr(scan_mod, "_require_services", _require_services_boom)
    match2 = await app.router.resolve(req2)
    resp2 = await match2.handler(req2)
    payload2 = json.loads(resp2.text)
    assert payload2.get("ok") is True


@pytest.mark.asyncio
async def test_watcher_status_flush_toggle_guard_branches(monkeypatch) -> None:
    app = _app()

    async def _require_services_err():
        return None, Result.Err("SERVICE_UNAVAILABLE", "no")

    monkeypatch.setattr(scan_mod, "_require_services", _require_services_err)
    req1 = make_mocked_request("GET", "/mjr/am/watcher/status", app=app)
    match1 = await app.router.resolve(req1)
    resp1 = await match1.handler(req1)
    payload1 = json.loads(resp1.text)
    assert payload1.get("code") == "SERVICE_UNAVAILABLE"

    req2 = make_mocked_request("POST", "/mjr/am/watcher/flush", app=app)
    match2 = await app.router.resolve(req2)
    resp2 = await match2.handler(req2)
    payload2 = json.loads(resp2.text)
    assert payload2.get("code") == "SERVICE_UNAVAILABLE"

    req3 = make_mocked_request("POST", "/mjr/am/watcher/toggle", app=app)
    match3 = await app.router.resolve(req3)
    resp3 = await match3.handler(req3)
    payload3 = json.loads(resp3.text)
    assert payload3.get("code") == "SERVICE_UNAVAILABLE"


@pytest.mark.asyncio
async def test_watcher_toggle_csrf_auth_and_bad_json(monkeypatch) -> None:
    async def _require_services():
        return {"watcher": None}, None

    app = _app()
    monkeypatch.setattr(scan_mod, "_require_services", _require_services)

    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: "bad")
    req1 = make_mocked_request("POST", "/mjr/am/watcher/toggle", app=app)
    match1 = await app.router.resolve(req1)
    resp1 = await match1.handler(req1)
    payload1 = json.loads(resp1.text)
    assert payload1.get("code") == "CSRF"

    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Err("FORBIDDEN", "no"))
    req2 = make_mocked_request("POST", "/mjr/am/watcher/toggle", app=app)
    match2 = await app.router.resolve(req2)
    resp2 = await match2.handler(req2)
    payload2 = json.loads(resp2.text)
    assert payload2.get("code") == "FORBIDDEN"

    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    async def _read_json_bad(_request):
        return Result.Err("INVALID_INPUT", "bad json")
    monkeypatch.setattr(scan_mod, "_read_json", _read_json_bad)
    req3 = make_mocked_request("POST", "/mjr/am/watcher/toggle", app=app)
    match3 = await app.router.resolve(req3)
    resp3 = await match3.handler(req3)
    payload3 = json.loads(resp3.text)
    assert payload3.get("code") == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_watcher_settings_update_error_paths(monkeypatch) -> None:
    app = _app()

    async def _require_services_err():
        return None, Result.Err("SERVICE_UNAVAILABLE", "x")

    monkeypatch.setattr(scan_mod, "_require_services", _require_services_err)
    req1 = make_mocked_request("POST", "/mjr/am/watcher/settings", app=app)
    match1 = await app.router.resolve(req1)
    resp1 = await match1.handler(req1)
    payload1 = json.loads(resp1.text)
    assert payload1.get("code") == "SERVICE_UNAVAILABLE"

    async def _require_services_ok():
        return {"watcher": None}, None

    monkeypatch.setattr(scan_mod, "_require_services", _require_services_ok)
    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    async def _read_json_bad(_request):
        return Result.Err("INVALID_INPUT", "bad")
    monkeypatch.setattr(scan_mod, "_read_json", _read_json_bad)
    req2 = make_mocked_request("POST", "/mjr/am/watcher/settings", app=app)
    match2 = await app.router.resolve(req2)
    resp2 = await match2.handler(req2)
    payload2 = json.loads(resp2.text)
    assert payload2.get("code") == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_watcher_flush_remaining_branches(monkeypatch) -> None:
    app = _app()

    async def _require_services():
        return {"watcher": None}, None

    monkeypatch.setattr(scan_mod, "_require_services", _require_services)
    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Err("FORBIDDEN", "no"))
    req1 = make_mocked_request("POST", "/mjr/am/watcher/flush", app=app)
    match1 = await app.router.resolve(req1)
    resp1 = await match1.handler(req1)
    payload1 = json.loads(resp1.text)
    assert payload1.get("code") == "FORBIDDEN"

    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    req2 = make_mocked_request("POST", "/mjr/am/watcher/flush", app=app)
    match2 = await app.router.resolve(req2)
    resp2 = await match2.handler(req2)
    payload2 = json.loads(resp2.text)
    assert payload2.get("ok") is True
    assert payload2.get("data", {}).get("enabled") is False

    class _Watcher:
        is_running = True

        def flush_pending(self):
            raise RuntimeError("x")

    async def _require_services_boom():
        return {"watcher": _Watcher()}, None

    monkeypatch.setattr(scan_mod, "_require_services", _require_services_boom)
    req3 = make_mocked_request("POST", "/mjr/am/watcher/flush", app=app)
    match3 = await app.router.resolve(req3)
    resp3 = await match3.handler(req3)
    payload3 = json.loads(resp3.text)
    assert payload3.get("ok") is True
    assert payload3.get("data", {}).get("flushed") is False


@pytest.mark.asyncio
async def test_watcher_settings_update_more_branches(monkeypatch) -> None:
    app = _app()

    async def _require_services():
        return {"watcher": SimpleNamespace(refresh_runtime_settings=lambda: (_ for _ in ()).throw(RuntimeError("x")) )}, None

    monkeypatch.setattr(scan_mod, "_require_services", _require_services)
    monkeypatch.setattr(scan_mod, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Err("FORBIDDEN", "no"))
    req1 = make_mocked_request("POST", "/mjr/am/watcher/settings", app=app)
    match1 = await app.router.resolve(req1)
    resp1 = await match1.handler(req1)
    payload1 = json.loads(resp1.text)
    assert payload1.get("code") == "FORBIDDEN"

    monkeypatch.setattr(scan_mod, "_require_write_access", lambda _request: Result.Ok({}))
    async def _read_json_ok(_request):
        return Result.Ok({"debounce_ms": 1})
    monkeypatch.setattr(scan_mod, "_read_json", _read_json_ok)
    monkeypatch.setattr(scan_mod, "update_watcher_settings", lambda **_kwargs: (_ for _ in ()).throw(RuntimeError("bad")))
    req2 = make_mocked_request("POST", "/mjr/am/watcher/settings", app=app)
    match2 = await app.router.resolve(req2)
    resp2 = await match2.handler(req2)
    payload2 = json.loads(resp2.text)
    assert payload2.get("code") == "DEGRADED"

    monkeypatch.setattr(scan_mod, "update_watcher_settings", lambda **kwargs: SimpleNamespace(debounce_ms=kwargs.get("debounce_ms"), dedupe_ttl_ms=0))
    req3 = make_mocked_request("POST", "/mjr/am/watcher/settings", app=app)
    match3 = await app.router.resolve(req3)
    resp3 = await match3.handler(req3)
    payload3 = json.loads(resp3.text)
    assert payload3.get("ok") is True
