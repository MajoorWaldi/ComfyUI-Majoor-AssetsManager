import asyncio
import json
from pathlib import Path

import pytest
from aiohttp import web
from aiohttp.test_utils import make_mocked_request

from mjr_am_backend.routes.handlers import custom_roots as m
from mjr_am_backend.shared import Result


def _app():
    app = web.Application()
    routes = web.RouteTableDef()
    m.register_custom_roots_routes(routes)
    app.add_routes(routes)
    return app


@pytest.mark.asyncio
async def test_custom_roots_get_and_post_csrf(monkeypatch):
    app = _app()

    monkeypatch.setattr(m, "list_custom_roots", lambda: Result.Ok([{"id": "r1"}]))
    req1 = make_mocked_request("GET", "/mjr/am/custom-roots", app=app)
    match1 = await app.router.resolve(req1)
    resp1 = await match1.handler(req1)
    payload1 = json.loads(resp1.text)
    assert payload1.get("ok") is True

    monkeypatch.setattr(m, "_csrf_error", lambda _request: "bad")
    req2 = make_mocked_request("POST", "/mjr/am/custom-roots", app=app)
    match2 = await app.router.resolve(req2)
    resp2 = await match2.handler(req2)
    payload2 = json.loads(resp2.text)
    assert payload2.get("code") == "CSRF"


@pytest.mark.asyncio
async def test_custom_roots_post_success_with_watcher(monkeypatch, tmp_path: Path):
    app = _app()
    calls = {"added": 0, "scan": 0}

    class _Watcher:
        def add_path(self, path, source=None, root_id=None):
            _ = (path, source, root_id)
            calls["added"] += 1

    async def _require_services():
        return {"watcher": _Watcher()}, None

    async def _read_json(_request):
        return Result.Ok({"path": str(tmp_path / "abc"), "label": "abc"})

    async def _scan(*_args, **_kwargs):
        calls["scan"] += 1
        return None

    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "_read_json", _read_json)
    monkeypatch.setattr(m, "add_custom_root", lambda path, label=None: Result.Ok({"id": "rid", "path": path, "label": label}))
    monkeypatch.setattr(m, "_require_services", _require_services)
    monkeypatch.setattr(m, "_kickoff_background_scan", _scan)

    req = make_mocked_request("POST", "/mjr/am/custom-roots", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("ok") is True
    assert calls["added"] == 1
    assert calls["scan"] == 1


@pytest.mark.asyncio
async def test_browse_folder_tkinter_unavailable(monkeypatch):
    app = _app()
    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_check_rate_limit", lambda *_args, **_kwargs: (True, None))
    monkeypatch.setattr(m, "_require_authenticated_user", lambda _request: Result.Ok({"user_id": "u1"}))
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "tk", None)
    monkeypatch.setattr(m, "filedialog", None)

    req = make_mocked_request("POST", "/mjr/sys/browse-folder", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("code") == "TKINTER_UNAVAILABLE"


@pytest.mark.asyncio
async def test_folder_info_missing_input():
    app = _app()
    req = make_mocked_request("GET", "/mjr/am/folder-info", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    payload = json.loads(resp.text)
    assert payload.get("code") == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_browser_folder_op_invalid_path_and_invalid_name(monkeypatch, tmp_path: Path):
    app = _app()

    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "_check_rate_limit", lambda *_args, **_kwargs: (True, None))

    async def _read_json_bad(_request):
        return Result.Ok({"op": "create", "path": "", "name": "x"})

    monkeypatch.setattr(m, "_read_json", _read_json_bad)
    req1 = make_mocked_request("POST", "/mjr/am/browser/folder-op", app=app)
    match1 = await app.router.resolve(req1)
    resp1 = await match1.handler(req1)
    payload1 = json.loads(resp1.text)
    assert payload1.get("code") == "INVALID_INPUT"

    async def _read_json_create(_request):
        return Result.Ok({"op": "create", "path": str(tmp_path), "name": ".."})

    monkeypatch.setattr(m, "_read_json", _read_json_create)
    monkeypatch.setattr(m, "_normalize_path", lambda v: Path(v) if v else None)
    monkeypatch.setattr(m, "_is_path_allowed", lambda *_args, **_kwargs: True)
    monkeypatch.setattr(m, "_is_path_allowed_custom", lambda *_args, **_kwargs: False)

    req2 = make_mocked_request("POST", "/mjr/am/browser/folder-op", app=app)
    match2 = await app.router.resolve(req2)
    resp2 = await match2.handler(req2)
    payload2 = json.loads(resp2.text)
    assert payload2.get("code") == "INVALID_INPUT"


def _json(resp):
    return json.loads(resp.text)


class _DummyReq:
    def __init__(self, remote):
        self.remote = remote


class _DummyTx:
    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False


class _DummyDB:
    def __init__(self):
        self.execs = []

    async def aexecute(self, sql, params=()):
        self.execs.append((sql, params))
        return Result.Ok(1)


def test_folder_stats_helpers(tmp_path: Path):
    d = tmp_path / "root"
    d.mkdir()
    (d / "a.txt").write_bytes(b"hello")
    sub = d / "sub"
    sub.mkdir()
    (sub / "b.txt").write_bytes(b"x")

    stats = m._compute_folder_stats(d, max_entries=100)
    assert stats["files"] >= 2
    assert stats["folders"] >= 1


@pytest.mark.asyncio
async def test_browse_folder_csrf_and_rate_limit(monkeypatch):
    app = _app()

    monkeypatch.setattr(m, "_csrf_error", lambda _request: "bad")
    req1 = make_mocked_request("POST", "/mjr/sys/browse-folder", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    assert _json(resp1).get("code") == "CSRF"

    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_check_rate_limit", lambda *_args, **_kwargs: (False, 5))
    monkeypatch.setattr(m, "_require_authenticated_user", lambda _request: Result.Ok({"user_id": "u1"}))
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    req2 = make_mocked_request("POST", "/mjr/sys/browse-folder", app=app)
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    assert _json(resp2).get("code") == "RATE_LIMIT"


@pytest.mark.asyncio
async def test_custom_roots_remove_success(monkeypatch, tmp_path: Path):
    app = _app()
    calls = {"removed": 0}

    class _Watcher:
        def remove_path(self, _path):
            calls["removed"] += 1

    db = _DummyDB()

    async def _services():
        return {"watcher": _Watcher(), "db": db}, None

    async def _read_json(_request):
        return Result.Ok({"id": "rid"})

    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "_read_json", _read_json)
    monkeypatch.setattr(m, "resolve_custom_root", lambda _rid: Result.Ok(tmp_path / "root"))
    monkeypatch.setattr(m, "remove_custom_root", lambda _rid: Result.Ok({"removed": True}))
    monkeypatch.setattr(m, "_require_services", _services)

    req = make_mocked_request("POST", "/mjr/am/custom-roots/remove", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    payload = _json(resp)
    assert payload.get("ok") is True
    assert calls["removed"] == 1
    assert db.execs


@pytest.mark.asyncio
async def test_custom_view_guards(monkeypatch, tmp_path: Path):
    app = _app()

    req1 = make_mocked_request("GET", "/mjr/am/custom-view", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    assert _json(resp1).get("code") == "INVALID_INPUT"

    monkeypatch.setattr(m, "resolve_custom_root", lambda _rid: Result.Ok(tmp_path))
    monkeypatch.setattr(m, "_safe_rel_path", lambda _s: None)
    req2 = make_mocked_request("GET", "/mjr/am/custom-view?root_id=r1&filename=a.png&subfolder=..", app=app)
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    assert _json(resp2).get("code") == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_custom_view_filepath_mode_forbidden(monkeypatch, tmp_path: Path):
    app = _app()
    f = tmp_path / "x.png"
    f.write_bytes(b"x")

    monkeypatch.setattr(m, "_normalize_path", lambda _v: f)
    monkeypatch.setattr(m, "_is_path_allowed", lambda *_args, **_kwargs: False)
    monkeypatch.setattr(m, "_is_path_allowed_custom", lambda *_args, **_kwargs: False)

    req = make_mocked_request("GET", "/mjr/am/custom-view?filepath=x&browser_mode=0", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    assert _json(resp).get("code") == "FORBIDDEN"


@pytest.mark.asyncio
async def test_custom_view_success(monkeypatch, tmp_path: Path):
    app = _app()
    f = tmp_path / "img.png"
    f.write_bytes(b"x")

    monkeypatch.setattr(m, "_normalize_path", lambda _v: f)
    monkeypatch.setattr(m, "_is_path_allowed", lambda *_args, **_kwargs: True)
    monkeypatch.setattr(m, "_is_path_allowed_custom", lambda *_args, **_kwargs: False)
    monkeypatch.setattr(m, "_is_allowed_view_media_file", lambda _p: True)
    monkeypatch.setattr(m, "_guess_content_type_for_file", lambda _p: "image/png")

    req = make_mocked_request("GET", "/mjr/am/custom-view?filepath=x", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    assert hasattr(resp, "headers")


@pytest.mark.asyncio
async def test_folder_info_filepath_and_root_modes(monkeypatch, tmp_path: Path):
    app = _app()
    d = tmp_path / "dir"
    d.mkdir()

    monkeypatch.setattr(m, "_normalize_path", lambda _v: d)
    monkeypatch.setattr(m, "_is_path_allowed", lambda *_args, **_kwargs: True)
    monkeypatch.setattr(m, "_is_path_allowed_custom", lambda *_args, **_kwargs: False)

    req1 = make_mocked_request("GET", "/mjr/am/folder-info?filepath=x", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    assert _json(resp1).get("ok") is True

    monkeypatch.setattr(m, "resolve_custom_root", lambda _rid: Result.Ok(tmp_path))
    monkeypatch.setattr(m, "_safe_rel_path", lambda _s: Path("dir"))
    monkeypatch.setattr(m, "_is_within_root", lambda *_args, **_kwargs: True)
    req2 = make_mocked_request("GET", "/mjr/am/folder-info?root_id=r1&subfolder=dir", app=app)
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    assert _json(resp2).get("ok") is True


@pytest.mark.asyncio
async def test_browser_folder_op_create_rename_delete(monkeypatch, tmp_path: Path):
    app = _app()
    source = tmp_path / "src"
    source.mkdir()

    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "_check_rate_limit", lambda *_args, **_kwargs: (True, None))
    monkeypatch.setattr(m, "_normalize_path", lambda v: Path(v) if v else None)
    monkeypatch.setattr(m, "_is_path_allowed", lambda *_args, **_kwargs: True)
    monkeypatch.setattr(m, "_is_path_allowed_custom", lambda *_args, **_kwargs: False)
    monkeypatch.setattr(m, "_invalidate_fs_list_cache", lambda: asyncio.sleep(0))
    monkeypatch.setattr(m, "_kickoff_background_scan", lambda *_args, **_kwargs: asyncio.sleep(0))
    monkeypatch.setattr(m, "_is_within_root", lambda *_args, **_kwargs: False)

    async def _read_create(_request):
        return Result.Ok({"op": "create", "path": str(source), "name": "newdir"})

    monkeypatch.setattr(m, "_read_json", _read_create)
    req1 = make_mocked_request("POST", "/mjr/am/browser/folder-op", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    assert _json(resp1).get("ok") is True

    to_rename = source / "newdir"

    async def _read_rename(_request):
        return Result.Ok({"op": "rename", "path": str(to_rename), "name": "renamed"})

    monkeypatch.setattr(m, "_read_json", _read_rename)
    req2 = make_mocked_request("POST", "/mjr/am/browser/folder-op", app=app)
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    assert _json(resp2).get("ok") is True

    renamed = source / "renamed"

    async def _read_delete(_request):
        return Result.Ok({"op": "delete", "path": str(renamed), "recursive": False})

    monkeypatch.setattr(m, "_read_json", _read_delete)
    req3 = make_mocked_request("POST", "/mjr/am/browser/folder-op", app=app)
    resp3 = await (await app.router.resolve(req3)).handler(req3)
    assert _json(resp3).get("ok") is True


@pytest.mark.asyncio
async def test_browser_folder_op_move_and_invalid(monkeypatch, tmp_path: Path):
    app = _app()
    source = tmp_path / "a"
    source.mkdir()
    dest = tmp_path / "b"
    dest.mkdir()

    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))
    monkeypatch.setattr(m, "_check_rate_limit", lambda *_args, **_kwargs: (True, None))
    monkeypatch.setattr(m, "_normalize_path", lambda v: Path(v) if v else None)
    monkeypatch.setattr(m, "_is_path_allowed", lambda *_args, **_kwargs: True)
    monkeypatch.setattr(m, "_is_path_allowed_custom", lambda *_args, **_kwargs: False)
    monkeypatch.setattr(m, "_invalidate_fs_list_cache", lambda: asyncio.sleep(0))
    monkeypatch.setattr(m, "_kickoff_background_scan", lambda *_args, **_kwargs: asyncio.sleep(0))
    monkeypatch.setattr(m, "_is_within_root", lambda *_args, **_kwargs: False)

    async def _read_move(_request):
        return Result.Ok({"op": "move", "path": str(source), "destination": str(dest)})

    monkeypatch.setattr(m, "_read_json", _read_move)
    req1 = make_mocked_request("POST", "/mjr/am/browser/folder-op", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    assert _json(resp1).get("ok") is True

    async def _read_invalid(_request):
        return Result.Ok({"op": "unknown", "path": str(dest)})

    monkeypatch.setattr(m, "_read_json", _read_invalid)
    req2 = make_mocked_request("POST", "/mjr/am/browser/folder-op", app=app)
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    assert _json(resp2).get("code") == "INVALID_INPUT"

@pytest.mark.asyncio
async def test_browse_folder_headless_and_success_and_cancel(monkeypatch, tmp_path: Path):
    app = _app()
    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_check_rate_limit", lambda *_args, **_kwargs: (True, None))
    monkeypatch.setattr(m, "_require_authenticated_user", lambda _request: Result.Ok({"user_id": "u1"}))
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))

    class _Tk:
        def withdraw(self):
            return None

        def attributes(self, *_args, **_kwargs):
            return None

        def destroy(self):
            return None

    class _TkMod:
        Tk = _Tk

    class _FD:
        @staticmethod
        def askdirectory(title=None):
            _ = title
            return ""

    monkeypatch.setattr(m, "tk", _TkMod)
    monkeypatch.setattr(m, "filedialog", _FD)
    monkeypatch.setattr(m.sys, "platform", "linux")
    monkeypatch.setattr(m.os, "getenv", lambda _k: None)

    req1 = make_mocked_request("POST", "/mjr/sys/browse-folder", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    assert _json(resp1).get("code") == "HEADLESS_ENV"

    monkeypatch.setattr(m.sys, "platform", "win32")
    req2 = make_mocked_request("POST", "/mjr/sys/browse-folder", app=app)
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    assert _json(resp2).get("code") == "CANCELLED"

    class _FD2:
        @staticmethod
        def askdirectory(title=None):
            _ = title
            return str(tmp_path)

    monkeypatch.setattr(m, "filedialog", _FD2)
    req3 = make_mocked_request("POST", "/mjr/sys/browse-folder", app=app)
    resp3 = await (await app.router.resolve(req3)).handler(req3)
    assert _json(resp3).get("ok") is True


@pytest.mark.asyncio
async def test_custom_view_unsupported_and_not_found(monkeypatch, tmp_path: Path):
    app = _app()
    f = tmp_path / "f.bin"
    f.write_bytes(b"x")

    monkeypatch.setattr(m, "_normalize_path", lambda _v: f)
    monkeypatch.setattr(m, "_is_path_allowed", lambda *_args, **_kwargs: True)
    monkeypatch.setattr(m, "_is_path_allowed_custom", lambda *_args, **_kwargs: False)
    monkeypatch.setattr(m, "_is_allowed_view_media_file", lambda _p: False)

    req1 = make_mocked_request("GET", "/mjr/am/custom-view?filepath=x", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    assert _json(resp1).get("code") == "UNSUPPORTED"

    monkeypatch.setattr(m, "_normalize_path", lambda _v: tmp_path / "missing.bin")
    req2 = make_mocked_request("GET", "/mjr/am/custom-view?filepath=x", app=app)
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    assert _json(resp2).get("code") in {"NOT_FOUND", "VIEW_FAILED"}


@pytest.mark.asyncio
async def test_folder_info_forbidden_and_not_found(monkeypatch, tmp_path: Path):
    app = _app()

    monkeypatch.setattr(m, "_normalize_path", lambda _v: tmp_path / "x")
    monkeypatch.setattr(m, "_is_path_allowed", lambda *_args, **_kwargs: False)
    monkeypatch.setattr(m, "_is_path_allowed_custom", lambda *_args, **_kwargs: False)

    req1 = make_mocked_request("GET", "/mjr/am/folder-info?filepath=x", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    assert _json(resp1).get("code") == "FORBIDDEN"

    monkeypatch.setattr(m, "resolve_custom_root", lambda _rid: Result.Ok(tmp_path))
    monkeypatch.setattr(m, "_safe_rel_path", lambda _s: Path("missing"))
    req2 = make_mocked_request("GET", "/mjr/am/folder-info?root_id=r1&subfolder=missing", app=app)
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    assert _json(resp2).get("code") == "DIR_NOT_FOUND"


@pytest.mark.asyncio
async def test_browser_folder_op_rate_and_forbidden_and_root(monkeypatch, tmp_path: Path):
    app = _app()
    d = tmp_path / "d"
    d.mkdir()

    monkeypatch.setattr(m, "_csrf_error", lambda _request: None)
    monkeypatch.setattr(m, "_require_write_access", lambda _request: Result.Ok({}))

    monkeypatch.setattr(m, "_check_rate_limit", lambda *_args, **_kwargs: (False, 2))
    req0 = make_mocked_request("POST", "/mjr/am/browser/folder-op", app=app)
    resp0 = await (await app.router.resolve(req0)).handler(req0)
    assert _json(resp0).get("code") == "RATE_LIMIT"

    monkeypatch.setattr(m, "_check_rate_limit", lambda *_args, **_kwargs: (True, None))
    monkeypatch.setattr(m, "_normalize_path", lambda v: Path(v) if v else None)
    monkeypatch.setattr(m, "_is_path_allowed", lambda *_args, **_kwargs: False)
    monkeypatch.setattr(m, "_is_path_allowed_custom", lambda *_args, **_kwargs: False)

    async def _read_json(_request):
        return Result.Ok({"op": "delete", "path": str(d)})

    monkeypatch.setattr(m, "_read_json", _read_json)
    req1 = make_mocked_request("POST", "/mjr/am/browser/folder-op", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    assert _json(resp1).get("code") == "FORBIDDEN"

    monkeypatch.setattr(m, "_is_path_allowed", lambda *_args, **_kwargs: True)
    req2 = make_mocked_request("POST", "/mjr/am/browser/folder-op", app=app)
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    assert _json(resp2).get("ok") is True
