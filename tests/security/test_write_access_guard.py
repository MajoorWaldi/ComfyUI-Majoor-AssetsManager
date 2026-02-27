import pytest
from mjr_am_backend.routes.core.security import _check_write_access

TEST_TOKEN = "unit-test-token"


def _clear_auth_env(monkeypatch):
    for key in (
        "MAJOOR_API_TOKEN",
        "MJR_API_TOKEN",
        "MAJOOR_API_TOKEN_HASH",
        "MJR_API_TOKEN_HASH",
        "MAJOOR_API_TOKEN_PEPPER",
        "MAJOOR_SAFE_MODE",
        "MAJOOR_ALLOW_WRITE",
        "MAJOOR_ALLOW_DELETE",
        "MAJOOR_ALLOW_RENAME",
        "MAJOOR_ALLOW_OPEN_IN_FOLDER",
        "MAJOOR_REQUIRE_AUTH",
        "MAJOOR_ALLOW_REMOTE_WRITE",
    ):
        monkeypatch.delenv(key, raising=False)


@pytest.mark.asyncio
async def test_write_allowed_on_loopback_when_no_token(monkeypatch):
    _clear_auth_env(monkeypatch)
    res = _check_write_access(peer_ip="127.0.0.1", headers={})
    assert res.ok, res.error


@pytest.mark.asyncio
async def test_write_blocked_for_forwarded_remote_when_no_token_by_default(monkeypatch):
    _clear_auth_env(monkeypatch)
    # 127.0.0.1 is a trusted proxy by default (see MAJOOR_TRUSTED_PROXIES default),
    # so X-Forwarded-For should be honored and treated as the true client.
    res = _check_write_access(peer_ip="127.0.0.1", headers={"X-Forwarded-For": "8.8.8.8"})
    assert not res.ok
    assert res.code == "FORBIDDEN"
    assert (res.meta or {}).get("auth") == "loopback_only"


@pytest.mark.asyncio
async def test_write_allows_loopback_even_when_token_configured(monkeypatch):
    # Loopback is trusted by default regardless of token configuration.
    # A token is validated if provided, but never required from loopback unless
    # MAJOOR_REQUIRE_AUTH=1 is explicitly set.
    _clear_auth_env(monkeypatch)
    monkeypatch.setenv("MAJOOR_API_TOKEN", TEST_TOKEN)

    res = _check_write_access(peer_ip="127.0.0.1", headers={})
    assert res.ok, res.error
    assert (res.meta or {}).get("auth") == "loopback"

    res2 = _check_write_access(peer_ip="127.0.0.1", headers={"X-MJR-Token": TEST_TOKEN})
    assert res2.ok, res2.error
    assert (res2.meta or {}).get("auth") == "token"


@pytest.mark.asyncio
async def test_write_requires_token_on_loopback_when_require_auth_set(monkeypatch):
    # MAJOOR_REQUIRE_AUTH=1 forces token auth even for loopback clients.
    _clear_auth_env(monkeypatch)
    monkeypatch.setenv("MAJOOR_API_TOKEN", TEST_TOKEN)
    monkeypatch.setenv("MAJOOR_REQUIRE_AUTH", "1")

    res = _check_write_access(peer_ip="127.0.0.1", headers={})
    assert not res.ok
    assert res.code == "AUTH_REQUIRED"

    res2 = _check_write_access(peer_ip="127.0.0.1", headers={"X-MJR-Token": TEST_TOKEN})
    assert res2.ok, res2.error


@pytest.mark.asyncio
async def test_write_token_accepts_bearer_header(monkeypatch):
    _clear_auth_env(monkeypatch)
    monkeypatch.setenv("MAJOOR_API_TOKEN", TEST_TOKEN)

    res = _check_write_access(peer_ip="127.0.0.1", headers={"Authorization": f"Bearer {TEST_TOKEN}"})
    assert res.ok, res.error


@pytest.mark.asyncio
async def test_write_accepts_hashed_token_env(monkeypatch):
    _clear_auth_env(monkeypatch)
    import hashlib

    token = TEST_TOKEN
    token_hash = hashlib.sha256(f"\0{token}".encode()).hexdigest()
    monkeypatch.setenv("MAJOOR_API_TOKEN_HASH", token_hash)

    res = _check_write_access(peer_ip="127.0.0.1", headers={"X-MJR-Token": token})
    assert res.ok, res.error
    assert (res.meta or {}).get("auth") == "token"


@pytest.mark.asyncio
async def test_allow_remote_write_override(monkeypatch):
    _clear_auth_env(monkeypatch)
    monkeypatch.setenv("MAJOOR_ALLOW_REMOTE_WRITE", "1")

    res = _check_write_access(peer_ip="203.0.113.10", headers={})
    assert res.ok, res.error


@pytest.mark.asyncio
async def test_require_auth_without_token_blocks(monkeypatch):
    _clear_auth_env(monkeypatch)
    monkeypatch.setenv("MAJOOR_REQUIRE_AUTH", "1")

    res = _check_write_access(peer_ip="127.0.0.1", headers={})
    assert not res.ok
    assert res.code == "AUTH_REQUIRED"


@pytest.mark.asyncio
async def test_peer_ip_edge_cases_do_not_crash(monkeypatch):
    _clear_auth_env(monkeypatch)

    loopback_v6 = _check_write_access(peer_ip="::1", headers={})
    assert loopback_v6.ok

    empty_peer = _check_write_access(peer_ip="", headers={})
    assert not empty_peer.ok
    assert empty_peer.code == "FORBIDDEN"

    malformed_peer = _check_write_access(peer_ip="not-an-ip", headers={})
    assert not malformed_peer.ok
    assert malformed_peer.code == "FORBIDDEN"
