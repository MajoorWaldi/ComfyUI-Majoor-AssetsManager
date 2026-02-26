import types

import pytest

from mjr_am_backend.routes.core import security as sec


class _DummyTransport:
    def __init__(self, peername):
        self._peername = peername

    def get_extra_info(self, key):
        if key == "peername":
            return self._peername
        return None


class _DummyRequest:
    def __init__(self, method="POST", headers=None, peername=("127.0.0.1", 8188)):
        self.method = method
        self.headers = headers or {}
        self.transport = _DummyTransport(peername)
        self.app = {}
        self.remote = None


def test_env_truthy_and_token_extractors(monkeypatch) -> None:
    monkeypatch.setenv("X_FLAG", "yes")
    assert sec._env_truthy("X_FLAG")
    monkeypatch.setenv("X_FLAG", "0")
    assert not sec._env_truthy("X_FLAG")

    assert sec._extract_bearer_token({"Authorization": "Bearer abc"}) == "abc"
    assert sec._extract_write_token_from_headers({"X-MJR-Token": "x"}) == "x"


def test_hash_and_write_token_hash(monkeypatch) -> None:
    monkeypatch.setenv("MAJOOR_API_TOKEN", "secret")
    monkeypatch.delenv("MAJOOR_API_TOKEN_HASH", raising=False)
    h = sec._get_write_token_hash()
    assert h
    assert h == sec._hash_token("secret")

    monkeypatch.setenv("MAJOOR_API_TOKEN_HASH", "deadbeef")
    assert sec._get_write_token_hash() == "deadbeef"


def test_ip_helpers_and_resolve_client_ip(monkeypatch) -> None:
    assert sec._is_valid_ip("127.0.0.1")
    assert not sec._is_valid_ip("bad")
    assert sec._is_loopback_ip("::1")

    monkeypatch.setattr(sec, "_is_trusted_proxy", lambda ip: ip == "127.0.0.1")
    headers = {"X-Forwarded-For": "8.8.8.8, 1.1.1.1"}
    assert sec._resolve_client_ip("127.0.0.1", headers) == "8.8.8.8"
    assert sec._resolve_client_ip("9.9.9.9", headers) == "9.9.9.9"


def test_require_operation_enabled_paths(monkeypatch) -> None:
    monkeypatch.delenv("MAJOOR_SAFE_MODE", raising=False)
    monkeypatch.delenv("MAJOOR_ALLOW_WRITE", raising=False)

    r = sec._require_operation_enabled("write", prefs={"safe_mode": True, "allow_write": True})
    assert r.ok

    r2 = sec._require_operation_enabled("delete", prefs={"allow_delete": False})
    assert not r2.ok
    assert r2.code == "FORBIDDEN"

    r3 = sec._require_operation_enabled("unknown-op", prefs={"safe_mode": False})
    assert r3.ok


def test_auth_helpers_and_authenticated_user() -> None:
    class _UM:
        enabled = True

        @staticmethod
        def get_request_user_id(_request):
            return "u1"

    req = _DummyRequest()
    req.app["_mjr_user_manager"] = _UM()
    res = sec._require_authenticated_user(req)
    assert res.ok
    assert res.data == "u1"

    req2 = _DummyRequest()
    req2.app["_mjr_user_manager"] = types.SimpleNamespace(enabled=True, get_request_user_id=lambda _r: "")
    res2 = sec._require_authenticated_user(req2)
    assert not res2.ok
    assert res2.code == "AUTH_REQUIRED"


def test_parse_trusted_proxies_and_is_trusted_proxy_cache(monkeypatch) -> None:
    monkeypatch.setenv("MAJOOR_TRUSTED_PROXIES", "127.0.0.1,10.0.0.0/8,0.0.0.0/0")
    monkeypatch.delenv("MAJOOR_ALLOW_INSECURE_TRUSTED_PROXIES", raising=False)

    nets = sec._parse_trusted_proxies()
    assert nets
    assert all(getattr(n, "prefixlen", 0) != 0 for n in nets)

    monkeypatch.setattr(sec, "_TRUSTED_PROXY_NETS", nets)
    sec._is_trusted_proxy.cache_clear()
    assert sec._is_trusted_proxy("127.0.0.1")
    assert not sec._is_trusted_proxy("8.8.8.8")


def test_client_identifier_and_rate_limit(monkeypatch) -> None:
    sec._reset_security_state_for_tests()
    monkeypatch.setattr(sec, "_is_trusted_proxy", lambda _ip: False)

    req = _DummyRequest(headers={})
    cid = sec._get_client_identifier(req)
    assert isinstance(cid, str)
    assert cid

    monkeypatch.setattr(sec.time, "time", lambda: 100.0)
    allowed, retry = sec._check_rate_limit(req, "ep", max_requests=2, window_seconds=60)
    assert allowed and retry is None
    allowed, retry = sec._check_rate_limit(req, "ep", max_requests=2, window_seconds=60)
    assert allowed and retry is None
    allowed, retry = sec._check_rate_limit(req, "ep", max_requests=2, window_seconds=60)
    assert not allowed
    assert isinstance(retry, int)


def test_csrf_and_origin_checks(monkeypatch) -> None:
    monkeypatch.setattr(sec, "_is_trusted_proxy", lambda _ip: False)

    req = _DummyRequest(method="POST", headers={"Host": "127.0.0.1:8188"})
    assert "Missing anti-CSRF" in str(sec._csrf_error(req))

    req2 = _DummyRequest(
        method="POST",
        headers={
            "Host": "127.0.0.1:8188",
            "X-Requested-With": "fetch",
            "Origin": "http://127.0.0.1:8188",
        },
    )
    assert sec._csrf_error(req2) is None

    req3 = _DummyRequest(
        method="POST",
        headers={
            "Host": "127.0.0.1:8188",
            "X-Requested-With": "fetch",
            "Origin": "http://evil.com",
        },
    )
    assert "Cross-site request blocked" in str(sec._csrf_error(req3))


def test_split_host_port_and_loopback_origin_match() -> None:
    assert sec._split_host_port("127.0.0.1:8188") == ("127.0.0.1", 8188)
    assert sec._split_host_port("localhost") == ("localhost", None)

    parsed = sec._parse_origin("http://127.0.0.1:8188")
    assert parsed is not None
    assert sec._is_loopback_origin_host_match(parsed, "localhost:8188")


@pytest.mark.asyncio
async def test_resolve_security_prefs_best_effort() -> None:
    class _Settings:
        async def get_security_prefs(self):
            return {"safe_mode": True}

    prefs = await sec._resolve_security_prefs({"settings": _Settings()})
    assert prefs == {"safe_mode": True}

    prefs2 = await sec._resolve_security_prefs(None)
    assert prefs2 is None
