"""
tests/quality/test_repo_health.py

Validate that the repo health dashboard (scripts/repo_health.py) itself is
correct and that its thresholds stay coherent with the rest of the quality
gate infrastructure.

Tests
-----
1. collect() produces a HealthReport that contains every expected metric name.
2. No metric is exceeded today (baseline sanity — suite must stay green).
3. --json CLI produces valid JSON with the expected top-level schema.
4. --threshold exits 0 when nothing is exceeded.
5. comfybridge_violations_in_features value stays in sync with the
   KNOWN_FEATURE_VIOLATIONS set in test_architecture_conformance.py.
6. multiline_bare_except has a hard limit (is not informational-only).
7. The Metric.exceeded property correctly computes over-limit status.
"""

from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Load scripts/repo_health.py as a module (it lives outside the package tree)
# ---------------------------------------------------------------------------
REPO_ROOT = Path(__file__).resolve().parents[2]
_HEALTH_SCRIPT = REPO_ROOT / "scripts" / "repo_health.py"


def _load_health_module():
    spec = importlib.util.spec_from_file_location("repo_health", _HEALTH_SCRIPT)
    mod = importlib.util.module_from_spec(spec)  # type: ignore[arg-type]
    # Must register in sys.modules BEFORE exec so that dataclasses can resolve
    # the module for annotation lookup (Python 3.14 requirement).
    sys.modules.setdefault("repo_health", mod)
    spec.loader.exec_module(mod)  # type: ignore[union-attr]
    return mod


# ---------------------------------------------------------------------------
# Expected metric names — all must appear in every run
# ---------------------------------------------------------------------------
EXPECTED_METRICS = {
    "single_line_bare_except",
    "multiline_bare_except",
    "python_debt_markers",
    "js_debt_markers",
    "utils_py_lines",
    "shared_py_lines",
    "routes_compat_imports",
    "js_dist_git_tracked",
    "comfybridge_violations_in_features",
    # optional metrics may be present (js_bundle_entry_kb, py_high_complexity_functions)
}


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class TestCollect:
    """Unit tests for the collect() function."""

    def setup_method(self):
        self.mod = _load_health_module()
        self.report = self.mod.HealthReport()
        self.mod.collect(self.report)
        self.metric_map = {m.name: m for m in self.report.metrics}

    def test_all_expected_metrics_present(self):
        """collect() must emit every required metric."""
        missing = EXPECTED_METRICS - set(self.metric_map)
        assert not missing, f"Missing metrics: {sorted(missing)}"

    def test_no_metric_exceeded_at_baseline(self):
        """No metric must be over its limit on the current codebase baseline."""
        exceeded = [m.name for m in self.report.metrics if m.exceeded]
        assert not exceeded, (
            f"These metrics exceed their limits: {exceeded}\n"
            "Fix the underlying issue or raise the limit intentionally."
        )

    def test_comfybridge_violations_has_hard_limit(self):
        """comfybridge_violations_in_features must have a numeric limit (ADR 0007 ratchet)."""
        metric = self.metric_map["comfybridge_violations_in_features"]
        assert metric.limit is not None, "comfybridge_violations_in_features needs a hard limit"
        assert isinstance(metric.limit, int)

    def test_multiline_bare_except_has_hard_limit(self):
        """multiline_bare_except must now be a hard limit, not informational (ADR 0006 ratchet)."""
        metric = self.metric_map["multiline_bare_except"]
        assert metric.limit is not None, "multiline_bare_except must have a hard limit"
        assert metric.limit >= 200, "Limit should be ≥ 200 (current baseline ~228)"

    def test_metric_exceeded_property(self):
        """Metric.exceeded should return True only when value > limit."""
        mod = self.mod
        m_ok = mod.Metric(name="x", value=5, limit=10)
        m_over = mod.Metric(name="y", value=15, limit=10)
        m_no_limit = mod.Metric(name="z", value=9999)
        assert not m_ok.exceeded
        assert m_over.exceeded
        assert not m_no_limit.exceeded

    def test_metric_exceeded_at_exact_limit_is_ok(self):
        """A value equal to the limit is NOT exceeded (limit is inclusive upper bound)."""
        mod = self.mod
        m = mod.Metric(name="x", value=10, limit=10)
        assert not m.exceeded


class TestCli:
    """Integration tests for the CLI entry point."""

    def _run(self, *args: str) -> subprocess.CompletedProcess:
        return subprocess.run(
            [sys.executable, str(_HEALTH_SCRIPT), *args],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            timeout=30,
        )

    def test_json_output_schema(self):
        """--json must produce valid JSON with 'metrics' list and 'any_exceeded' bool."""
        result = self._run("--json")
        assert result.returncode == 0, f"Script failed: {result.stderr}"
        data = json.loads(result.stdout)
        assert "metrics" in data
        assert "any_exceeded" in data
        assert isinstance(data["metrics"], list)
        assert isinstance(data["any_exceeded"], bool)

    def test_json_each_metric_has_required_keys(self):
        """Each metric dict in JSON output must have name, value, status, limit keys."""
        result = self._run("--json")
        data = json.loads(result.stdout)
        for m in data["metrics"]:
            for key in ("name", "value", "status", "limit"):
                assert key in m, f"Metric {m.get('name', '?')} missing key '{key}'"

    def test_threshold_exits_zero_when_all_ok(self):
        """--threshold must exit 0 when all metrics are within bounds (current baseline)."""
        result = self._run("--threshold")
        assert result.returncode == 0, (
            f"--threshold exited with {result.returncode}.\n"
            f"stdout: {result.stdout}\nstderr: {result.stderr}"
        )

    def test_plain_output_contains_overall_line(self):
        """Plain text output must contain an 'Overall:' summary line."""
        result = self._run()
        assert result.returncode == 0
        assert "Overall:" in result.stdout


class TestComfybridgeSyncWithArchitectureTests:
    """
    The comfybridge_violations_in_features metric must stay in sync with
    KNOWN_FEATURE_VIOLATIONS in test_architecture_conformance.py.
    """

    def test_count_matches_known_violations_set(self):
        """
        The live count from _count_comfybridge_violations_in_features() must equal
        len(KNOWN_FEATURE_VIOLATIONS).

        If this test fails either:
        - a new violation was introduced (add to KNOWN_FEATURE_VIOLATIONS), or
        - a violation was fixed (remove from KNOWN_FEATURE_VIOLATIONS — celebrate!).
        """
        mod = _load_health_module()
        live_count = mod._count_comfybridge_violations_in_features()

        # Load KNOWN_FEATURE_VIOLATIONS from the architecture conformance module
        conformance_path = (
            REPO_ROOT / "tests" / "quality" / "test_architecture_conformance.py"
        )
        spec = importlib.util.spec_from_file_location(
            "test_architecture_conformance", conformance_path
        )
        conf_mod = importlib.util.module_from_spec(spec)  # type: ignore[arg-type]
        spec.loader.exec_module(conf_mod)  # type: ignore[union-attr]

        known_count = len(conf_mod.KNOWN_FEATURE_VIOLATIONS)
        assert live_count == known_count, (
            f"comfybridge live count ({live_count}) != KNOWN_FEATURE_VIOLATIONS "
            f"({known_count}).\n"
            "Update KNOWN_FEATURE_VIOLATIONS in test_architecture_conformance.py."
        )
