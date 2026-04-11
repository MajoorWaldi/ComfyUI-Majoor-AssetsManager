"""
Tests for degraded service states — Phase 2 chaos coverage.

Verifies that the system survives and reports correctly when:
 - DB cannot be opened (path unwritable / locked)
 - exiftool is absent from PATH
 - watcher crashes on start
 - services are built twice (idempotency)
 - DB migration fails
"""

from __future__ import annotations

from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _ok_health_result():
    from mjr_am_backend.shared import Result
    return Result.Ok({
        "overall": "healthy",
        "db": {"locked": False},
        "index": {"enrichment_active": False},
    })


def _err_result(code: str, msg: str):
    from mjr_am_backend.shared import Result
    return Result.Err(code, msg)


def _ok_bool_result():
    from mjr_am_backend.shared import Result
    return Result.Ok(True)


def _ok_db_result(tmp_path: Path):
    """Return a Result.Ok wrapping a minimal mock Sqlite-like object."""
    from mjr_am_backend.shared import Result

    db = MagicMock()
    db.aclose = AsyncMock()
    db.get_runtime_status = MagicMock(return_value={})
    return Result.Ok(db)


# ---------------------------------------------------------------------------
# 1. DB cannot be opened — build_services returns Err
# ---------------------------------------------------------------------------

class TestDBUnavailable:
    @pytest.mark.asyncio
    async def test_build_services_returns_err_on_db_failure(self, tmp_path):
        """Simulate SQLite refusing to open (e.g. path in a read-only dir)."""
        from mjr_am_backend import deps

        unwritable = tmp_path / "locked_dir" / "index.db"
        with patch.object(deps, "_init_db_or_error", return_value=_err_result("DB_ERROR", "DB locked")):
            result = await deps.build_services(str(unwritable))
            assert not result.ok
            assert result.code == "DB_ERROR"

    @pytest.mark.asyncio
    async def test_require_services_returns_err_when_services_none(self):
        """_require_services yields Err when services are None (uninitialized/failed)."""
        from mjr_am_backend.routes.core import services as svc_mod

        with patch.object(svc_mod, "_services", None):
            with patch.object(svc_mod, "_services_error", "DB_ERROR: DB locked"):
                with patch.object(svc_mod, "_build_services", AsyncMock(return_value=None)):
                    svc, err = await svc_mod._require_services()
                    assert svc is None
                    assert err is not None
                    assert not err.ok


# ---------------------------------------------------------------------------
# 2. ExifTool absent — metadata degrades gracefully
# ---------------------------------------------------------------------------

class TestExiftoolAbsent:
    def test_tool_detect_returns_false_when_binary_missing(self):
        """Simulate exiftool absent by patching the probe function and clearing cache."""
        from mjr_am_backend import tool_detect

        # Reset cache so the function actually checks
        original_cache = dict(tool_detect._TOOL_CACHE)
        tool_detect._TOOL_CACHE["exiftool"] = None
        try:
            with patch.object(tool_detect, "_probe_exiftool_candidates", return_value=(False, None, "")):
                assert not tool_detect.has_exiftool()
        finally:
            tool_detect._TOOL_CACHE.update(original_cache)

    def test_probe_router_returns_empty_when_no_tools(self):
        """probe_router imports has_exiftool/has_ffprobe directly — patch there."""
        from mjr_am_backend import probe_router

        with patch.object(probe_router, "has_exiftool", return_value=False):
            with patch.object(probe_router, "has_ffprobe", return_value=False):
                result = probe_router.pick_probe_backend("test.png")
                assert result == [], "should return empty list, not raise"

    def test_probe_router_falls_back_to_ffprobe_when_exiftool_missing(self):
        from mjr_am_backend import probe_router

        with patch.object(probe_router, "has_exiftool", return_value=False):
            with patch.object(probe_router, "has_ffprobe", return_value=True):
                result = probe_router.pick_probe_backend("video.mp4")
                assert "ffprobe" in result

    def test_probe_router_single_mode_falls_back_to_available(self):
        """When exiftool is requested but missing, fall back to ffprobe."""
        from mjr_am_backend import probe_router

        with patch.object(probe_router, "has_exiftool", return_value=False):
            with patch.object(probe_router, "has_ffprobe", return_value=True):
                result = probe_router.pick_probe_backend("test.png", settings_override="exiftool")
                assert result == ["ffprobe"]

    def test_probe_router_both_mode_empty_when_nothing_available(self):
        from mjr_am_backend import probe_router

        with patch.object(probe_router, "has_exiftool", return_value=False):
            with patch.object(probe_router, "has_ffprobe", return_value=False):
                result = probe_router.pick_probe_backend("test.png", settings_override="both")
                assert result == []


# ---------------------------------------------------------------------------
# 3. Watcher safe helpers — must never raise
# ---------------------------------------------------------------------------

class TestWatcherHelpers:
    def test_safe_watcher_is_running_false_for_stopped_watcher(self):
        from mjr_am_backend.routes.handlers.health import _safe_watcher_is_running

        watcher = MagicMock()
        watcher.is_running = False
        assert _safe_watcher_is_running(watcher) is False

    def test_safe_watcher_is_running_callable_returns_false(self):
        from mjr_am_backend.routes.handlers.health import _safe_watcher_is_running

        watcher = MagicMock()
        watcher.is_running = lambda: False
        assert _safe_watcher_is_running(watcher) is False

    def test_safe_watcher_is_running_crash_returns_false(self):
        """Even if watcher.is_running raises, the helper must return False."""
        from mjr_am_backend.routes.handlers.health import _safe_watcher_is_running

        broken = MagicMock()
        broken.is_running = MagicMock(side_effect=RuntimeError("crash"))
        assert _safe_watcher_is_running(broken) is False

    def test_safe_watcher_pending_count_crash_returns_zero(self):
        from mjr_am_backend.routes.handlers.health import _safe_watcher_pending_count

        broken = MagicMock()
        broken.get_pending_count = MagicMock(side_effect=RuntimeError("crash"))
        assert _safe_watcher_pending_count(broken) == 0

    def test_safe_watcher_directories_crash_returns_empty(self):
        from mjr_am_backend.routes.handlers.health import _safe_watcher_directories

        broken = MagicMock()
        broken.watched_directories = MagicMock(side_effect=RuntimeError("crash"))
        result = _safe_watcher_directories(broken)
        assert result == []


# ---------------------------------------------------------------------------
# 4. Services built twice — idempotency of register_routes
# ---------------------------------------------------------------------------

class TestRoutesIdempotency:
    @pytest.mark.asyncio
    async def test_register_routes_twice_same_app_no_raise(self):
        """
        Calling register_routes(app) twice for the same app must not raise and
        must not double-register (the AppKey guard prevents it).
        """
        from aiohttp import web
        from mjr_am_backend.routes import registry

        app = web.Application()
        call_count = {"n": 0}

        def _mock_prepare(a, um):
            call_count["n"] += 1
            return False  # simulate "already registered"

        with patch.object(registry, "_prepare_route_table", side_effect=_mock_prepare):
            registry.register_routes(app)
            registry.register_routes(app)

        assert call_count["n"] == 2  # called twice but both returned False → no double-register

    def test_registry_routes_registered_flag_is_idempotent(self):
        """
        register_all_routes() must skip silently if called a second time.
        """
        from mjr_am_backend.routes import registry

        original_flag = registry._ROUTES_REGISTERED
        try:
            registry._ROUTES_REGISTERED = True
            # Should return without raising and without doing any work
            with patch.object(registry, "_get_prompt_server") as mock_ps:
                mock_routes = MagicMock()
                mock_ps.return_value.instance.routes = mock_routes
                registry.register_all_routes()
                # register_fn on any route group must NOT have been called
                mock_routes.assert_not_called()
        finally:
            registry._ROUTES_REGISTERED = original_flag


# ---------------------------------------------------------------------------
# 5. DB migration failure — structured Err, not raw exception
# ---------------------------------------------------------------------------

class TestDBMigrationFailure:
    @pytest.mark.asyncio
    async def test_build_services_returns_err_on_migration_failure(self, tmp_path):
        """Migration failure must produce Result.Err, not an uncaught exception."""
        from mjr_am_backend import deps

        db_path = str(tmp_path / "index.db")

        with patch.object(deps, "_migrate_db_or_error", AsyncMock(
            return_value=_err_result("DB_ERROR", "migration: no such table")
        )):
            result = await deps.build_services(db_path)
            assert not result.ok
            assert result.code == "DB_ERROR"


# ---------------------------------------------------------------------------
# 6. Vector service absent — health endpoint stays ok/degraded, not fatal
# ---------------------------------------------------------------------------

class TestVectorServiceAbsent:
    def test_vector_runtime_diagnostics_no_service_returns_disabled(self):
        from mjr_am_backend.routes.handlers.health import _vector_runtime_diagnostics

        diag = _vector_runtime_diagnostics({"vector_service": None})
        assert diag["enabled"] is False
        assert diag["degraded"] is False  # absent ≠ broken

    def test_vector_runtime_diagnostics_with_degraded_service(self):
        from mjr_am_backend.routes.handlers.health import _vector_runtime_diagnostics

        svc = MagicMock()
        svc.get_runtime_status = MagicMock(return_value={"degraded": True, "last_error": "OOM"})
        diag = _vector_runtime_diagnostics({"vector_service": svc})
        assert diag["degraded"] is True
        assert diag["last_error"] == "OOM"

    def test_vector_runtime_diagnostics_crash_in_service_returns_fallback(self):
        from mjr_am_backend.routes.handlers.health import _vector_runtime_diagnostics

        svc = MagicMock()
        svc.get_runtime_status = MagicMock(side_effect=RuntimeError("crash"))
        diag = _vector_runtime_diagnostics({"vector_service": svc})
        # Must return a safe dict, not raise
        assert isinstance(diag, dict)
        assert "enabled" in diag
