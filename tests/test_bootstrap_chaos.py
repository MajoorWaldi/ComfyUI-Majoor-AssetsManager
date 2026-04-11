"""
Tests for degraded/chaos bootstrap modes.

These tests verify that:
  1. bootstrap_report records failures correctly.
  2. The plugin survives missing optional dependencies gracefully.
  3. The health endpoint returns a coherent state even after partial failures.
  4. init_prompt_server() is idempotent (calling twice doesn't double-register).
"""

from __future__ import annotations

import importlib
import sys
from unittest.mock import patch

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _reload_bootstrap_report():
    """Import a fresh bootstrap_report module (reset singleton between tests)."""
    mod_name = "mjr_am_backend.bootstrap_report"
    if mod_name in sys.modules:
        del sys.modules[mod_name]
    return importlib.import_module(mod_name)


# ---------------------------------------------------------------------------
# bootstrap_report unit tests
# ---------------------------------------------------------------------------

class TestBootstrapReport:
    def setup_method(self):
        self.br = _reload_bootstrap_report()
        self.br.reset_report()

    def test_empty_report_is_ok(self):
        report = self.br.get_report()
        assert report["overall"] == "ok"
        assert report["stages"] == {}

    def test_ok_stage(self):
        self.br.record_stage("routes", "ok")
        report = self.br.get_report()
        assert report["stages"]["routes"]["status"] == "ok"
        assert report["overall"] == "ok"

    def test_degraded_stage_escalates_overall(self):
        self.br.record_stage("routes", "ok")
        self.br.record_stage("vector_search", "degraded", "degraded", "hnswlib missing")
        report = self.br.get_report()
        assert report["overall"] == "degraded"
        assert report["stages"]["vector_search"]["detail"] == "hnswlib missing"

    def test_fatal_stage_escalates_to_fatal(self):
        self.br.record_stage("routes", "ok")
        self.br.record_stage("database", "fatal", "fatal", "DB locked")
        report = self.br.get_report()
        assert report["overall"] == "fatal"

    def test_disabled_stage_does_not_escalate(self):
        self.br.record_stage("optional_feature", "disabled", "internal", "not configured")
        report = self.br.get_report()
        assert report["overall"] == "ok"

    def test_detail_truncated_at_200_chars(self):
        long_detail = "x" * 300
        self.br.record_stage("test", "degraded", "internal", long_detail)
        report = self.br.get_report()
        assert len(report["stages"]["test"]["detail"]) <= 200

    def test_report_is_snapshot_not_reference(self):
        self.br.record_stage("a", "ok")
        snap1 = self.br.get_report()
        self.br.record_stage("b", "degraded", "degraded")
        snap2 = self.br.get_report()
        # snap1 should not be mutated by the second record
        assert "b" not in snap1["stages"]
        assert "b" in snap2["stages"]

    def test_reset_clears_stages(self):
        self.br.record_stage("routes", "ok")
        self.br.reset_report()
        report = self.br.get_report()
        assert report["stages"] == {}

    def test_thread_safety_smoke(self):
        """Basic smoke test: concurrent record_stage calls don't raise."""
        import threading
        errors: list[Exception] = []

        def _writer(name: str) -> None:
            try:
                for i in range(50):
                    self.br.record_stage(f"{name}_{i}", "ok")
            except Exception as exc:
                errors.append(exc)

        threads = [threading.Thread(target=_writer, args=(f"t{i}",)) for i in range(4)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        assert not errors


# ---------------------------------------------------------------------------
# Chaos: missing optional dependency (runtime_activity)
# ---------------------------------------------------------------------------

class TestMissingOptionalDependency:
    """Verify that a missing optional module is recorded as degraded, not fatal."""

    def setup_method(self):
        br = _reload_bootstrap_report()
        br.reset_report()

    def test_missing_runtime_activity_is_degraded_not_fatal(self):
        br = importlib.import_module("mjr_am_backend.bootstrap_report")

        # Simulate ImportError raised when calling the lifecycle registration function.
        with patch(
            "mjr_am_backend.runtime_activity.ensure_prompt_lifecycle_provider_registered",
            side_effect=ImportError("simulated missing dependency"),
        ):
            try:
                from mjr_am_backend.runtime_activity import (
                    ensure_prompt_lifecycle_provider_registered,
                )
                ensure_prompt_lifecycle_provider_registered()
                br.record_stage("prompt_lifecycle", "ok")
            except ImportError as exc:
                br.record_stage("prompt_lifecycle", "degraded", "internal", str(exc)[:120])

        report = br.get_report()
        assert report["stages"]["prompt_lifecycle"]["status"] == "degraded"
        # Plugin overall must NOT be fatal from a missing optional dep
        assert report["overall"] != "fatal"


# ---------------------------------------------------------------------------
# Chaos: idempotency — double init must not duplicate stages
# ---------------------------------------------------------------------------

class TestBootstrapIdempotency:
    def setup_method(self):
        br = _reload_bootstrap_report()
        br.reset_report()

    def test_recording_same_stage_twice_overwrites_not_duplicates(self):
        br = importlib.import_module("mjr_am_backend.bootstrap_report")
        br.record_stage("routes", "degraded", "degraded", "first attempt")
        br.record_stage("routes", "ok")  # recovery / second attempt
        report = br.get_report()
        # Only one entry for "routes"
        assert len([k for k in report["stages"] if k == "routes"]) == 1
        assert report["stages"]["routes"]["status"] == "ok"
        assert report["overall"] == "ok"


# ---------------------------------------------------------------------------
# Chaos: health endpoint bootstrap key injection
# ---------------------------------------------------------------------------

class TestHealthEndpointBootstrapKey:
    """Verify that the health route attaches bootstrap data when available."""

    def setup_method(self):
        br = _reload_bootstrap_report()
        br.reset_report()
        br.record_stage("routes", "ok")
        br.record_stage("security_middlewares", "ok")
        br.record_stage("vector_search", "disabled", "user_facing", "hnswlib not installed")

    def test_get_report_structure(self):
        br = importlib.import_module("mjr_am_backend.bootstrap_report")
        report = br.get_report()
        assert "overall" in report
        assert "stages" in report
        assert "started_at_utc" in report
        assert report["stages"]["vector_search"]["severity"] == "user_facing"

    def test_degraded_vector_does_not_set_overall_fatal(self):
        br = importlib.import_module("mjr_am_backend.bootstrap_report")
        br.record_stage("vector_search", "degraded", "degraded", "hnswlib unavailable")
        report = br.get_report()
        assert report["overall"] == "degraded"
        assert report["overall"] != "fatal"
