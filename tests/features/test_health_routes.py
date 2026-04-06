import asyncio
import json
from pathlib import Path
from unittest.mock import Mock

import pytest
from aiohttp import web
from aiohttp.test_utils import make_mocked_request
from mjr_am_backend.routes.handlers import health as health_mod
from mjr_am_backend.shared import Result


def _build_health_app() -> web.Application:
    app = web.Application()
    routes = web.RouteTableDef()
    health_mod.register_health_routes(routes)
    app.add_routes(routes)
    return app


def _make_request_with_peer(app: web.Application, method: str, path: str, peer_ip: str):
    transport = Mock()

    def _get_extra_info(name, default=None):
        if name == "peername":
            return (peer_ip, 12345)
        return default

    transport.get_extra_info.side_effect = _get_extra_info
    return make_mocked_request(method, path, app=app, transport=transport)


@pytest.mark.asyncio
async def test_health_returns_service_error(monkeypatch) -> None:
    async def _require_services():
        return None, Result.Err("SERVICE_UNAVAILABLE", "down")

    monkeypatch.setattr(health_mod, "_require_services", _require_services)

    app = _build_health_app()
    req = make_mocked_request("GET", "/mjr/am/health", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)
    assert body.get("code") == "SERVICE_UNAVAILABLE"


@pytest.mark.asyncio
async def test_health_counters_unknown_scope(monkeypatch) -> None:
    class _Health:
        async def get_counters(self, roots=None):
            _ = roots
            return Result.Ok({"total": 0})

    async def _require_services():
        return {"health": _Health()}, None

    monkeypatch.setattr(health_mod, "_require_services", _require_services)

    app = _build_health_app()
    req = make_mocked_request("GET", "/mjr/am/health/counters?scope=bad", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)
    assert body.get("code") == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_health_db_without_db_service(monkeypatch) -> None:
    async def _require_services():
        return {}, None

    monkeypatch.setattr(health_mod, "_require_services", _require_services)

    app = _build_health_app()
    req = make_mocked_request("GET", "/mjr/am/health/db", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)
    assert body.get("code") == "SERVICE_UNAVAILABLE"


@pytest.mark.asyncio
async def test_runtime_status_payload(monkeypatch) -> None:
    class _Watcher:
        is_running = True

        @staticmethod
        def get_pending_count():
            return 7

    class _Db:
        @staticmethod
        def get_runtime_status():
            return {"active_connections": 1}

    class _Index:
        @staticmethod
        def get_runtime_status():
            return {"enrichment_queue_length": 2}

    async def _require_services():
        return {"watcher": _Watcher(), "db": _Db(), "index": _Index()}, None

    monkeypatch.setattr(health_mod, "_require_services", _require_services)

    app = _build_health_app()
    req = make_mocked_request("GET", "/mjr/am/status", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)
    assert body.get("ok") is True
    data = body.get("data") or {}
    assert data.get("watcher", {}).get("pending_files") == 7


@pytest.mark.asyncio
async def test_runtime_status_watcher_callable_state(monkeypatch) -> None:
    class _Watcher:
        @staticmethod
        def is_running():
            return False

        @staticmethod
        def get_pending_count():
            return 2

    async def _require_services():
        return {"watcher": _Watcher(), "db": object(), "index": object()}, None

    monkeypatch.setattr(health_mod, "_require_services", _require_services)

    app = _build_health_app()
    req = make_mocked_request("GET", "/mjr/am/status", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)
    assert body.get("ok") is True
    data = body.get("data") or {}
    assert data.get("watcher", {}).get("enabled") is False
    assert data.get("watcher", {}).get("pending_files") == 2


@pytest.mark.asyncio
async def test_health_counters_watcher_callable_state(monkeypatch) -> None:
    class _Health:
        async def get_counters(self, roots=None):
            _ = roots
            return Result.Ok({"total_assets": 3})

    class _Watcher:
        @staticmethod
        def is_running():
            return False

        @staticmethod
        def watched_directories():
            return ["C:/x"]

    async def _require_services():
        return {
            "health": _Health(),
            "watcher": _Watcher(),
            "watcher_scope": {"scope": "output", "custom_root_id": ""},
            "index": object(),
        }, None

    monkeypatch.setattr(health_mod, "_require_services", _require_services)

    app = _build_health_app()
    req = make_mocked_request("GET", "/mjr/am/health/counters?scope=output", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)
    assert body.get("ok") is True
    watcher_data = (body.get("data") or {}).get("watcher") or {}
    assert watcher_data.get("enabled") is False
    assert watcher_data.get("directories") == ["C:/x"]


@pytest.mark.asyncio
async def test_get_config_uses_defaults_without_settings(monkeypatch) -> None:
    async def _require_services():
        return {}, None

    monkeypatch.setattr(health_mod, "_require_services", _require_services)

    app = _build_health_app()
    req = make_mocked_request("GET", "/mjr/am/config", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)
    assert body.get("ok") is True
    assert "output_directory" in (body.get("data") or {})


@pytest.mark.asyncio
async def test_update_output_directory_csrf_block(monkeypatch) -> None:
    monkeypatch.setattr(health_mod, "_csrf_error", lambda _req: "csrf")

    app = _build_health_app()
    req = make_mocked_request("POST", "/mjr/am/settings/output-directory", app=app)
    match = await app.router.resolve(req)
    resp = await match.handler(req)
    body = json.loads(resp.text)
    assert body.get("code") == "CSRF"


@pytest.mark.asyncio
async def test_update_output_directory_writes_audit_log(monkeypatch, tmp_path) -> None:
    settings = _Settings()
    audit_calls = []

    async def _svc():
        return {"settings": settings}, None

    async def _read_json(_request):
        return Result.Ok({"output_directory": str(tmp_path)})

    async def _audit_log_write(_services, **kwargs):
        audit_calls.append(kwargs)
        return True

    monkeypatch.setattr(health_mod, "_require_services", _svc)
    monkeypatch.setattr(health_mod, "_csrf_error", lambda _req: None)
    monkeypatch.setattr(health_mod, "_require_write_access", lambda _req: Result.Ok({}))
    monkeypatch.setattr(health_mod, "_read_json", _read_json)
    monkeypatch.setattr(health_mod, "audit_log_write", _audit_log_write)
    monkeypatch.setattr(health_mod, "_invalidate_fs_list_cache", lambda: asyncio.sleep(0))
    monkeypatch.setattr(health_mod, "_kickoff_background_scan", lambda *_args, **_kwargs: asyncio.sleep(0))

    app = _build_health_app()
    req = make_mocked_request("POST", "/mjr/am/settings/output-directory", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    body = json.loads(resp.text)
    assert body.get("ok") is True
    assert audit_calls and audit_calls[0]["operation"] == "settings_output_directory"


@pytest.mark.asyncio
async def test_update_output_directory_real_csrf_and_auth_guards(monkeypatch) -> None:
    monkeypatch.setenv("MAJOOR_REQUIRE_AUTH", "1")
    monkeypatch.delenv("MAJOOR_API_TOKEN", raising=False)
    monkeypatch.delenv("MJR_API_TOKEN", raising=False)
    monkeypatch.delenv("MAJOOR_API_TOKEN_HASH", raising=False)
    monkeypatch.delenv("MJR_API_TOKEN_HASH", raising=False)

    app = _build_health_app()

    req_missing_csrf = make_mocked_request("POST", "/mjr/am/settings/output-directory", app=app)
    resp_missing_csrf = await (await app.router.resolve(req_missing_csrf)).handler(req_missing_csrf)
    body_missing_csrf = json.loads(resp_missing_csrf.text)
    assert body_missing_csrf.get("code") == "CSRF"

    req_missing_auth = make_mocked_request(
        "POST",
        "/mjr/am/settings/output-directory",
        headers={"X-Requested-With": "XMLHttpRequest"},
        app=app,
    )
    resp_missing_auth = await (await app.router.resolve(req_missing_auth)).handler(req_missing_auth)
    body_missing_auth = json.loads(resp_missing_auth.text)
    assert body_missing_auth.get("code") == "AUTH_REQUIRED"

class _Settings:
    def __init__(self):
        self.output = ""
        self.probe = "auto"
        self.prefs = {"image": True, "media": True}
        self.sec = {"allow_write": True}
        self.hf_token = ""
        self.ai_verbose_logs = False

    async def get_output_directory(self):
        return self.output

    async def set_output_directory(self, value):
        self.output = value
        return Result.Ok(value)

    async def get_probe_backend(self):
        return self.probe

    async def set_probe_backend(self, mode):
        self.probe = mode
        return Result.Ok(mode)

    async def get_metadata_fallback_prefs(self):
        return self.prefs

    async def set_metadata_fallback_prefs(self, image=None, media=None):
        if image is not None:
            self.prefs["image"] = bool(image)
        if media is not None:
            self.prefs["media"] = bool(media)
        return Result.Ok(dict(self.prefs))

    async def get_security_prefs(self, include_secret=False):
        _ = include_secret
        return dict(self.sec)

    async def set_security_prefs(self, prefs):
        self.sec.update(prefs)
        return Result.Ok(dict(self.sec))

    async def rotate_api_token(self):
        return Result.Ok({"api_token": "rotated"})

    async def bootstrap_api_token(self):
        return Result.Ok({"api_token": "boot"})

    async def get_huggingface_token_info(self):
        token = str(self.hf_token or "").strip()
        hint = f"...{token[-4:]}" if token else ""
        return {"has_token": bool(token), "token_hint": hint}

    async def set_huggingface_token(self, token_payload):
        self.hf_token = str(token_payload or "").strip()
        token = self.hf_token
        hint = f"...{token[-4:]}" if token else ""
        return Result.Ok({"has_token": bool(token), "token_hint": hint})

    async def get_ai_verbose_logs_enabled(self):
        return bool(self.ai_verbose_logs)

    async def set_ai_verbose_logs_enabled(self, enabled):
        self.ai_verbose_logs = bool(enabled)
        return Result.Ok(self.ai_verbose_logs)


@pytest.mark.asyncio
async def test_health_and_counters_success_timeout_degraded(monkeypatch, tmp_path: Path) -> None:
    class _Health:
        async def status(self):
            return Result.Ok({"up": True})

        async def get_counters(self, roots=None):
            _ = roots
            return Result.Ok({"total": 1})

    async def _svc():
        return {"health": _Health(), "index": object()}, None

    monkeypatch.setattr(health_mod, "_require_services", _svc)
    monkeypatch.setattr(health_mod, "resolve_custom_root", lambda _rid: Result.Ok(tmp_path))

    app = _build_health_app()
    req1 = make_mocked_request("GET", "/mjr/am/health", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    assert json.loads(resp1.text).get("ok") is True

    req2 = make_mocked_request("GET", "/mjr/am/health/counters?scope=custom&custom_root_id=r1", app=app)
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    assert json.loads(resp2.text).get("ok") is True

    class _HealthTimeout:
        async def status(self):
            raise asyncio.TimeoutError()

        async def get_counters(self, roots=None):
            _ = roots
            raise RuntimeError("x")

    async def _svc2():
        return {"health": _HealthTimeout(), "index": object()}, None

    monkeypatch.setattr(health_mod, "_require_services", _svc2)
    req3 = make_mocked_request("GET", "/mjr/am/health", app=app)
    resp3 = await (await app.router.resolve(req3)).handler(req3)
    assert json.loads(resp3.text).get("code") == "TIMEOUT"

    req4 = make_mocked_request("GET", "/mjr/am/health/counters?scope=output", app=app)
    resp4 = await (await app.router.resolve(req4)).handler(req4)
    assert json.loads(resp4.text).get("code") == "DEGRADED"


@pytest.mark.asyncio
async def test_health_db_success_and_error(monkeypatch) -> None:
    class _DB:
        def get_diagnostics(self):
            return {"locked": True}

        async def aexecute(self, _sql, fetch=False):
            _ = fetch
            return Result.Ok({"ok": 1})

    async def _svc():
        return {"db": _DB()}, None

    monkeypatch.setattr(health_mod, "_require_services", _svc)

    app = _build_health_app()
    req1 = make_mocked_request("GET", "/mjr/am/health/db", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    assert json.loads(resp1.text).get("ok") is True

    class _DB2:
        def get_diagnostics(self):
            raise RuntimeError("bad")

        async def aexecute(self, _sql, fetch=False):
            _ = fetch
            return Result.Err("DB", "x")

    async def _svc2():
        return {"db": _DB2()}, None

    monkeypatch.setattr(health_mod, "_require_services", _svc2)
    req2 = make_mocked_request("GET", "/mjr/am/health/db", app=app)
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    assert json.loads(resp2.text).get("ok") is True


@pytest.mark.asyncio
async def test_output_and_probe_settings_routes(monkeypatch, tmp_path: Path) -> None:
    settings = _Settings()

    async def _svc():
        return {"settings": settings}, None

    async def _read_json(_request):
        return Result.Ok({"output_directory": str(tmp_path), "mode": "ffprobe"})

    monkeypatch.setattr(health_mod, "_require_services", _svc)
    monkeypatch.setattr(health_mod, "_csrf_error", lambda _req: None)
    monkeypatch.setattr(health_mod, "_require_write_access", lambda _req: Result.Ok({}))
    monkeypatch.setattr(health_mod, "_read_json", _read_json)

    app = _build_health_app()
    req1 = make_mocked_request("GET", "/mjr/am/settings/output-directory", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    assert json.loads(resp1.text).get("ok") is True

    req2 = make_mocked_request("POST", "/mjr/am/settings/output-directory", app=app)
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    assert json.loads(resp2.text).get("ok") is True

    req3 = make_mocked_request("POST", "/mjr/am/settings/probe-backend", app=app)
    resp3 = await (await app.router.resolve(req3)).handler(req3)
    assert json.loads(resp3.text).get("ok") is True


@pytest.mark.asyncio
async def test_probe_backend_missing_mode(monkeypatch) -> None:
    settings = _Settings()

    async def _svc():
        return {"settings": settings}, None

    async def _read_json(_request):
        return Result.Ok({})

    monkeypatch.setattr(health_mod, "_require_services", _svc)
    monkeypatch.setattr(health_mod, "_csrf_error", lambda _req: None)
    monkeypatch.setattr(health_mod, "_require_write_access", lambda _req: Result.Ok({}))
    monkeypatch.setattr(health_mod, "_read_json", _read_json)

    app = _build_health_app()
    req = make_mocked_request("POST", "/mjr/am/settings/probe-backend", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    assert json.loads(resp.text).get("code") == "INVALID_INPUT"


@pytest.mark.asyncio
async def test_metadata_fallback_and_security_routes(monkeypatch) -> None:
    settings = _Settings()

    async def _svc():
        return {"settings": settings}, None

    async def _read_meta(_request):
        return Result.Ok({"prefs": {"image": False, "media": True}})

    async def _read_sec(_request):
        return Result.Ok({"allow_write": False, "apiToken": "abc"})

    monkeypatch.setattr(health_mod, "_require_services", _svc)
    monkeypatch.setattr(health_mod, "_csrf_error", lambda _req: None)
    monkeypatch.setattr(health_mod, "_require_write_access", lambda _req: Result.Ok({}))

    app = _build_health_app()

    req1 = make_mocked_request("GET", "/mjr/am/settings/metadata-fallback", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    assert json.loads(resp1.text).get("ok") is True

    monkeypatch.setattr(health_mod, "_read_json", _read_meta)
    req2 = make_mocked_request("POST", "/mjr/am/settings/metadata-fallback", app=app)
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    assert json.loads(resp2.text).get("ok") is True

    req3 = make_mocked_request("GET", "/mjr/am/settings/security", app=app)
    resp3 = await (await app.router.resolve(req3)).handler(req3)
    assert json.loads(resp3.text).get("ok") is True

    monkeypatch.setattr(health_mod, "_read_json", _read_sec)
    req4 = make_mocked_request("POST", "/mjr/am/settings/security", app=app)
    resp4 = await (await app.router.resolve(req4)).handler(req4)
    assert json.loads(resp4.text).get("ok") is True


@pytest.mark.asyncio
async def test_huggingface_settings_routes(monkeypatch) -> None:
    settings = _Settings()

    async def _svc():
        return {"settings": settings}, None

    async def _read_set(_request):
        return Result.Ok({"token": "hf_test_token_1234"})

    monkeypatch.setattr(health_mod, "_require_services", _svc)
    monkeypatch.setattr(health_mod, "_csrf_error", lambda _req: None)
    monkeypatch.setattr(health_mod, "_require_write_access", lambda _req: Result.Ok({}))

    app = _build_health_app()

    req1 = make_mocked_request("GET", "/mjr/am/settings/huggingface", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    body1 = json.loads(resp1.text)
    assert body1.get("ok") is True
    assert (body1.get("data") or {}).get("prefs", {}).get("has_token") is False

    monkeypatch.setattr(health_mod, "_read_json", _read_set)
    req2 = make_mocked_request("POST", "/mjr/am/settings/huggingface", app=app)
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    body2 = json.loads(resp2.text)
    assert body2.get("ok") is True
    assert (body2.get("data") or {}).get("prefs", {}).get("has_token") is True


@pytest.mark.asyncio
async def test_ai_logging_settings_routes(monkeypatch) -> None:
    settings = _Settings()

    async def _svc():
        return {"settings": settings}, None

    async def _read_set(_request):
        return Result.Ok({"enabled": True})

    monkeypatch.setattr(health_mod, "_require_services", _svc)
    monkeypatch.setattr(health_mod, "_csrf_error", lambda _req: None)
    monkeypatch.setattr(health_mod, "_require_write_access", lambda _req: Result.Ok({}))

    app = _build_health_app()

    req1 = make_mocked_request("GET", "/mjr/am/settings/ai-logging", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    body1 = json.loads(resp1.text)
    assert body1.get("ok") is True
    assert (body1.get("data") or {}).get("prefs", {}).get("enabled") is False

    monkeypatch.setattr(health_mod, "_read_json", _read_set)
    req2 = make_mocked_request("POST", "/mjr/am/settings/ai-logging", app=app)
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    body2 = json.loads(resp2.text)
    assert body2.get("ok") is True
    assert (body2.get("data") or {}).get("prefs", {}).get("enabled") is True


@pytest.mark.asyncio
async def test_security_empty_input_and_token_routes(monkeypatch) -> None:
    settings = _Settings()

    async def _svc():
        return {"settings": settings}, None

    async def _read_empty(_request):
        return Result.Ok({})

    monkeypatch.setattr(health_mod, "_require_services", _svc)
    monkeypatch.setattr(health_mod, "_csrf_error", lambda _req: None)
    monkeypatch.setattr(health_mod, "_require_write_access", lambda _req: Result.Ok({}))
    monkeypatch.setattr(health_mod, "_has_configured_write_token", lambda: False)
    monkeypatch.setattr(health_mod, "_read_json", _read_empty)
    monkeypatch.setattr(health_mod, "_is_secure_request_transport", lambda _req: True)
    monkeypatch.setattr(health_mod, "_bootstrap_enabled", lambda: True)

    app = _build_health_app()
    req1 = make_mocked_request("POST", "/mjr/am/settings/security", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    assert json.loads(resp1.text).get("code") == "INVALID_INPUT"

    req2 = make_mocked_request("POST", "/mjr/am/settings/security/rotate-token", app=app)
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    assert json.loads(resp2.text).get("ok") is True

    req3 = make_mocked_request("POST", "/mjr/am/settings/security/bootstrap-token", app=app)
    resp3 = await (await app.router.resolve(req3)).handler(req3)
    assert json.loads(resp3.text).get("ok") is True


@pytest.mark.asyncio
async def test_bootstrap_token_blocked_when_token_already_configured(monkeypatch) -> None:
    settings = _Settings()

    async def _svc():
        return {"settings": settings}, None

    monkeypatch.setattr(health_mod, "_require_services", _svc)
    monkeypatch.setattr(health_mod, "_csrf_error", lambda _req: None)
    monkeypatch.setattr(health_mod, "_require_write_access", lambda _req: Result.Ok({}))
    monkeypatch.setattr(health_mod, "_has_configured_write_token", lambda: True)
    monkeypatch.setattr(health_mod, "_bootstrap_enabled", lambda: True)

    app = _build_health_app()
    req = make_mocked_request("POST", "/mjr/am/settings/security/bootstrap-token", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    assert json.loads(resp.text).get("code") == "FORBIDDEN"


@pytest.mark.asyncio
async def test_bootstrap_token_disabled_without_env_gate(monkeypatch) -> None:
    settings = _Settings()

    async def _svc():
        return {"settings": settings}, None

    monkeypatch.setattr(health_mod, "_require_services", _svc)
    monkeypatch.setattr(health_mod, "_csrf_error", lambda _req: None)
    monkeypatch.setattr(health_mod, "_require_write_access", lambda _req: Result.Ok({}))
    monkeypatch.setattr(health_mod, "_has_configured_write_token", lambda: False)
    monkeypatch.setattr(health_mod, "_bootstrap_enabled", lambda: False)

    app = _build_health_app()
    req = make_mocked_request("POST", "/mjr/am/settings/security/bootstrap-token", app=app)
    resp = await (await app.router.resolve(req)).handler(req)
    assert json.loads(resp.text).get("code") == "BOOTSTRAP_DISABLED"


@pytest.mark.asyncio
async def test_bootstrap_token_allows_remote_initial_provisioning_for_authenticated_comfy_user(monkeypatch) -> None:
    settings = _Settings()

    async def _svc():
        return {"settings": settings}, None

    monkeypatch.setattr(health_mod, "_require_services", _svc)
    monkeypatch.setattr(health_mod, "_csrf_error", lambda _req: None)
    monkeypatch.setattr(health_mod, "_require_write_access", lambda _req: Result.Err("AUTH_REQUIRED", "missing"))
    monkeypatch.setattr(health_mod, "_require_authenticated_user", lambda _req: Result.Ok("user-1", auth_mode="comfy_user"))
    monkeypatch.setattr(health_mod, "_has_configured_write_token", lambda: False)
    monkeypatch.setattr(health_mod, "_is_secure_request_transport", lambda _req: True)
    monkeypatch.setattr(health_mod, "_bootstrap_enabled", lambda: False)

    app = _build_health_app()
    req = _make_request_with_peer(app, "POST", "/mjr/am/settings/security/bootstrap-token", "10.0.0.15")
    resp = await (await app.router.resolve(req)).handler(req)
    body = json.loads(resp.text)
    assert body.get("ok") is True


@pytest.mark.asyncio
async def test_bootstrap_token_remote_initial_provisioning_stays_blocked_without_comfy_auth(monkeypatch) -> None:
    settings = _Settings()

    async def _svc():
        return {"settings": settings}, None

    monkeypatch.setattr(health_mod, "_require_services", _svc)
    monkeypatch.setattr(health_mod, "_csrf_error", lambda _req: None)
    monkeypatch.setattr(health_mod, "_require_write_access", lambda _req: Result.Err("AUTH_REQUIRED", "missing"))
    monkeypatch.setattr(health_mod, "_require_authenticated_user", lambda _req: Result.Ok("", auth_mode="disabled"))
    monkeypatch.setattr(health_mod, "_has_configured_write_token", lambda: False)
    monkeypatch.setattr(health_mod, "_is_secure_request_transport", lambda _req: True)
    monkeypatch.setattr(health_mod, "_bootstrap_enabled", lambda: False)

    app = _build_health_app()
    req = _make_request_with_peer(app, "POST", "/mjr/am/settings/security/bootstrap-token", "10.0.0.15")
    resp = await (await app.router.resolve(req)).handler(req)
    body = json.loads(resp.text)
    assert body.get("code") == "BOOTSTRAP_DISABLED"


@pytest.mark.asyncio
async def test_bootstrap_token_requires_authenticated_comfy_user_when_write_auth_fails(monkeypatch) -> None:
    settings = _Settings()

    async def _svc():
        return {"settings": settings}, None

    monkeypatch.setattr(health_mod, "_require_services", _svc)
    monkeypatch.setattr(health_mod, "_csrf_error", lambda _req: None)
    monkeypatch.setattr(health_mod, "_require_write_access", lambda _req: Result.Err("AUTH_REQUIRED", "missing"))
    monkeypatch.setattr(health_mod, "_require_authenticated_user", lambda _req: Result.Ok("", auth_mode="disabled"))
    monkeypatch.setattr(health_mod, "_has_configured_write_token", lambda: False)
    monkeypatch.setattr(health_mod, "_is_secure_request_transport", lambda _req: True)
    monkeypatch.setattr(health_mod, "_bootstrap_enabled", lambda: True)

    app = _build_health_app()
    req = _make_request_with_peer(app, "POST", "/mjr/am/settings/security/bootstrap-token", "127.0.0.1")
    resp = await (await app.router.resolve(req)).handler(req)
    assert json.loads(resp.text).get("code") == "AUTH_REQUIRED"


@pytest.mark.asyncio
async def test_tools_and_roots(monkeypatch, tmp_path) -> None:
    async def _svc():
        return {}, None

    monkeypatch.setattr(health_mod, "_require_services", _svc)
    monkeypatch.setattr(health_mod, "get_tool_status", lambda: {"ok": True})
    monkeypatch.setattr(health_mod, "resolve_custom_root", lambda _rid: Result.Ok(tmp_path))

    import mjr_am_backend.custom_roots as cr
    monkeypatch.setattr(cr, "list_custom_roots", lambda: Result.Ok([{"id": "r1"}]))

    app = _build_health_app()
    req1 = make_mocked_request("GET", "/mjr/am/tools/status", app=app)
    resp1 = await (await app.router.resolve(req1)).handler(req1)
    assert json.loads(resp1.text).get("ok") is True

    req2 = make_mocked_request("GET", "/mjr/am/roots", app=app)
    resp2 = await (await app.router.resolve(req2)).handler(req2)
    assert json.loads(resp2.text).get("ok") is True
