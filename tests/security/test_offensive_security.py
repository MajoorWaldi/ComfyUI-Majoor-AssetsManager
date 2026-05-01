"""
Offensive security tests — Phase 2.

Covers:
  - Path traversal attacks (../../../etc/passwd, encoded variants, null bytes)
  - Hostile filenames (null bytes, path separators, control chars)
  - Symlink escape attempts via safe_rel_path/is_within_root
  - Forged X-Forwarded-For / X-Forwarded-Host headers
  - CSRF protection: missing anti-CSRF header, wrong Origin, null Origin
  - Malformed metadata payloads (no crash / structured Err)
  - Oversized inputs (no crash / truncation)
"""

from __future__ import annotations

from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

# ---------------------------------------------------------------------------
# 1. Path traversal — safe_rel_path rejects all traversal attempts
# ---------------------------------------------------------------------------

class TestPathTraversal:
    """
    safe_rel_path() must return None for any input that could escape
    the allowed root.  Tests use OWASP-inspired payload list.
    """

    @pytest.fixture(autouse=True)
    def _import(self):
        from mjr_am_backend import path_utils
        self.safe_rel_path = path_utils.safe_rel_path
        self.normalize_path = path_utils.normalize_path

    # NOTE: URL percent-encoded payloads (%2e%2e%2f…) are intentionally excluded —
    # URL decoding happens at the HTTP framework layer (aiohttp) BEFORE safe_rel_path
    # is ever called.  Testing them here would test the wrong layer.
    # NOTE: four-dot sequences (....//...) are valid directory names, not traversal.
    TRAVERSAL_PAYLOADS = [
        "../../../etc/passwd",
        "..\\..\\..\\windows\\system32\\drivers\\etc\\hosts",
        "subfolder/../../etc/passwd",
        "/etc/passwd",
        "C:\\Windows\\System32",
        "C:/Windows/System32",
        "\x00evil",                                    # null byte
        "a/../../b",
        "a\\..\\..\\b",
        "../",
        "..",
    ]

    @pytest.mark.parametrize("payload", TRAVERSAL_PAYLOADS)
    def test_safe_rel_path_rejects_traversal(self, payload: str):
        result = self.safe_rel_path(payload)
        assert result is None or result == Path(""), (
            f"safe_rel_path({payload!r}) should return None or Path(''), got {result!r}"
        )

    def test_normalize_path_rejects_null_byte(self):
        assert self.normalize_path("valid/path\x00injected") is None

    def test_normalize_path_resolves_dotdot(self, tmp_path: Path):
        """normalize_path resolves .. but the result may be outside root — caller must check."""
        result = self.normalize_path(str(tmp_path / "a" / ".." / ".."))
        # Result is a valid absolute path, but callers MUST use is_within_root to guard it
        assert result is not None
        assert result.is_absolute()


# ---------------------------------------------------------------------------
# 2. is_within_root — must block escape
# ---------------------------------------------------------------------------

class TestIsWithinRoot:
    @pytest.fixture(autouse=True)
    def _import(self):
        from mjr_am_backend import path_utils
        self.is_within_root = path_utils.is_within_root

    def test_path_within_root_is_allowed(self, tmp_path: Path):
        subdir = tmp_path / "outputs" / "image.png"
        subdir.parent.mkdir(parents=True, exist_ok=True)
        subdir.touch()
        assert self.is_within_root(subdir, tmp_path)

    def test_path_outside_root_is_blocked(self, tmp_path: Path):
        root = tmp_path / "outputs"
        root.mkdir()
        outside = tmp_path / "private" / "secret.txt"
        outside.parent.mkdir()
        outside.touch()
        assert not self.is_within_root(outside, root)

    def test_path_equal_to_root_is_allowed(self, tmp_path: Path):
        assert self.is_within_root(tmp_path, tmp_path)

    def test_nonexistent_path_does_not_raise(self, tmp_path: Path):
        """is_within_root must not raise if the path does not exist (strict=True returns False)."""
        nonexistent = tmp_path / "ghost" / "file.png"
        result = self.is_within_root(nonexistent, tmp_path)
        # Strict mode: unresolvable path → False, never raises
        assert isinstance(result, bool)


# ---------------------------------------------------------------------------
# 3. Hostile filenames — safe_download_filename strips dangerous chars
# ---------------------------------------------------------------------------

class TestHostileFilenames:
    @pytest.fixture(autouse=True)
    def _import(self):
        from mjr_am_backend.routes.assets import path_guard
        self.safe_download_filename = path_guard.safe_download_filename

    HOSTILE_NAMES = [
        ('image "with" quotes.png', '"'),
        ('file\nwith\nnewlines.png', '\n'),
        ('file\rwith\rcr.png', '\r'),
        ('semi;colon.png', ';'),
        ('../traversal.png', '/'),
        ('..\\traversal.png', '\\'),
        ('C:drive.png', ':'),
        ('a' * 512 + '.png', None),          # oversized
    ]

    @pytest.mark.parametrize("name,banned_char", HOSTILE_NAMES)
    def test_safe_download_filename_sanitizes(self, name: str, banned_char: str | None):
        result = self.safe_download_filename(name)
        assert isinstance(result, str)
        if banned_char:
            assert banned_char not in result, (
                f"Banned char {banned_char!r} still present in {result!r}"
            )
        # Must not be empty
        assert len(result) > 0
        assert len(result) <= 255


# ---------------------------------------------------------------------------
# 4. CSRF protection tests
# ---------------------------------------------------------------------------

class TestCSRFProtection:
    @pytest.fixture(autouse=True)
    def _import(self):
        from mjr_am_backend.routes.core import security_csrf
        self.csrf_error = security_csrf._csrf_error

    def _make_request(self, method="POST", headers=None):
        req = MagicMock()
        req.method = method
        req.headers = headers or {}
        return req

    def test_get_request_is_not_csrf_protected(self):
        req = self._make_request(method="GET")
        assert self.csrf_error(req) is None

    def test_post_without_csrf_header_returns_error(self):
        req = self._make_request(method="POST", headers={"Host": "localhost:8188"})
        error = self.csrf_error(req)
        assert error is not None
        assert "CSRF" in error or "anti-CSRF" in error.lower() or "X-Requested-With" in error

    def test_post_with_x_requested_with_passes(self):
        req = self._make_request(
            method="POST",
            headers={"Host": "localhost:8188", "X-Requested-With": "XMLHttpRequest"},
        )
        assert self.csrf_error(req) is None

    def test_post_with_csrf_token_header_passes(self):
        req = self._make_request(
            method="POST",
            headers={"Host": "localhost:8188", "X-CSRF-Token": "some-value"},
        )
        assert self.csrf_error(req) is None

    def test_null_origin_is_blocked(self):
        req = self._make_request(
            method="POST",
            headers={
                "Host": "localhost:8188",
                "X-Requested-With": "XMLHttpRequest",
                "Origin": "null",   # sandboxed iframe / file:// attacker
            },
        )
        error = self.csrf_error(req)
        assert error is not None
        assert "null" in error.lower() or "blocked" in error.lower()

    def test_cross_origin_is_blocked(self):
        req = self._make_request(
            method="POST",
            headers={
                "Host": "localhost:8188",
                "X-Requested-With": "XMLHttpRequest",
                "Origin": "https://evil.com",
            },
        )
        error = self.csrf_error(req)
        assert error is not None
        assert "evil.com" in error or "blocked" in error.lower()

    def test_same_origin_loopback_passes(self):
        req = self._make_request(
            method="POST",
            headers={
                "Host": "localhost:8188",
                "X-Requested-With": "XMLHttpRequest",
                "Origin": "http://localhost:8188",
            },
        )
        assert self.csrf_error(req) is None

    def test_delete_without_csrf_header_is_blocked(self):
        req = self._make_request(method="DELETE", headers={"Host": "localhost:8188"})
        error = self.csrf_error(req)
        assert error is not None


# ---------------------------------------------------------------------------
# 5. Forged X-Forwarded-For / X-Forwarded-Host
# ---------------------------------------------------------------------------

class TestForgedProxyHeaders:
    @pytest.fixture(autouse=True)
    def _import(self):
        from mjr_am_backend.routes.core import security as sec
        self.resolve_client_ip = sec._resolve_client_ip
        self.is_loopback_ip = sec._is_loopback_ip
        self.sec = sec

    def test_xff_from_untrusted_proxy_is_ignored(self, monkeypatch):
        """X-Forwarded-For from a non-trusted proxy must not be trusted."""
        from mjr_am_backend.routes.core import security as sec

        # Peer is a non-trusted external IP
        with patch.object(sec, "_is_trusted_proxy", return_value=False):
            client_ip = self.resolve_client_ip("203.0.113.1", {"X-Forwarded-For": "8.8.8.8"})
            # When peer is NOT trusted, XFF must be ignored
            assert client_ip == "203.0.113.1"

    def test_xff_from_trusted_proxy_is_respected(self, monkeypatch):
        """X-Forwarded-For from a trusted proxy must resolve to the claimed client IP."""
        from mjr_am_backend.routes.core import security as sec

        with patch.object(sec, "_is_trusted_proxy", lambda ip: ip in {"127.0.0.1"}):
            client_ip = self.resolve_client_ip("127.0.0.1", {"X-Forwarded-For": "8.8.8.8, 127.0.0.1"})
            assert client_ip == "8.8.8.8"

    def test_forged_xff_claims_loopback_but_peer_is_external(self, monkeypatch):
        """
        An attacker may forge X-Forwarded-For: 127.0.0.1 from an external IP.
        The resolved client IP must NOT be loopback in that case.
        """
        from mjr_am_backend.routes.core import security as sec

        with patch.object(sec, "_is_trusted_proxy", return_value=False):
            client_ip = self.resolve_client_ip("203.0.113.99", {"X-Forwarded-For": "127.0.0.1"})
            # XFF is ignored because peer is not a trusted proxy
            assert client_ip == "203.0.113.99"
            assert not self.is_loopback_ip(client_ip)

    def test_write_access_blocked_for_forged_loopback_xff(self, monkeypatch):
        """
        Even if an attacker sends X-Forwarded-For: 127.0.0.1, write access
        must not be granted when the actual peer is external and not a trusted proxy.
        """
        from mjr_am_backend.routes.core import security as sec

        with patch.object(sec, "_is_trusted_proxy", return_value=False):
            result = sec._check_write_access(
                peer_ip="203.0.113.99",
                headers={"X-Forwarded-For": "127.0.0.1"},
            )
            assert not result.ok
            assert result.code in {"FORBIDDEN", "AUTH_REQUIRED"}


# ---------------------------------------------------------------------------
# 6. Malformed metadata payloads — no crash, structured Err
# ---------------------------------------------------------------------------

class TestMalformedMetadataPayloads:
    HOSTILE_FILENAME_PAYLOADS = [
        "",
        "\x00",
        "../../../etc/passwd",
        "a" * 10_000,                 # oversized path string
        "C:\\windows\\system32\\cmd.exe",
    ]

    def test_safe_rel_path_never_raises(self):
        from mjr_am_backend import path_utils

        for payload in self.HOSTILE_FILENAME_PAYLOADS:
            try:
                result = path_utils.safe_rel_path(payload)
                # Result is None, Path(""), or a safe relative path — never raises
                assert result is None or isinstance(result, Path)
            except Exception as exc:
                pytest.fail(f"safe_rel_path({payload!r:.40}) raised: {exc}")

    def test_normalize_path_never_raises(self):
        from mjr_am_backend import path_utils

        for payload in self.HOSTILE_FILENAME_PAYLOADS:
            try:
                result = path_utils.normalize_path(payload)
                assert result is None or isinstance(result, Path)
            except Exception as exc:
                pytest.fail(f"normalize_path({payload!r:.40}) raised: {exc}")
