"""
Pytest-based code quality gates using radon.

These tests enforce complexity thresholds so regressions are caught
during normal ``pytest`` runs, not just in the CI quality job.
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_PACKAGES = ["mjr_am_backend", "mjr_am_shared"]
# Maximum cyclomatic complexity per function/method.
# Some existing parser/service functions reach CC ~21-25; keep the gate
# at the current max to prevent regressions without failing on
# already-shipped code.  Gradually lower this as complex functions are
# refactored.
MAX_CC_PER_FUNCTION = 25
# Maximum average complexity across all analysed modules.
MAX_AVG_COMPLEXITY = 5.0
# Minimum maintainability index (radon mi) — "A" grade is >= 20.
MIN_MAINTAINABILITY_INDEX = 15.0


def _existing_packages() -> list[str]:
    return [p for p in BACKEND_PACKAGES if (REPO_ROOT / p).is_dir()]


def _run_radon(subcommand: str, *extra_args: str) -> str:
    packages = _existing_packages()
    if not packages:
        pytest.skip("No backend packages found")
    cmd = [sys.executable, "-m", "radon", subcommand, *extra_args, *packages]
    result = subprocess.run(
        cmd, cwd=str(REPO_ROOT), capture_output=True, text=True, timeout=120,
    )
    return result.stdout.strip()


# -- Cyclomatic Complexity ---------------------------------------------------


def _parse_cc_json() -> dict:
    raw = _run_radon("cc", "--json", "--no-assert")
    if not raw:
        return {}
    return json.loads(raw)


def test_no_function_exceeds_max_cc():
    """Every function/method must have CC <= MAX_CC_PER_FUNCTION."""
    data = _parse_cc_json()
    violations: list[str] = []
    for filepath, items in data.items():
        if not isinstance(items, list):
            continue
        for item in items:
            if not isinstance(item, dict):
                continue
            cc = int(item.get("complexity") or 0)
            if cc > MAX_CC_PER_FUNCTION:
                name = item.get("name", "<unknown>")
                lineno = item.get("lineno", "?")
                violations.append(f"  {filepath}:{lineno} {name} (CC={cc})")
    assert not violations, (
        f"Functions exceeding CC>{MAX_CC_PER_FUNCTION}:\n" + "\n".join(violations)
    )


def test_average_complexity_within_threshold():
    """Average CC across all backend modules must stay below threshold."""
    data = _parse_cc_json()
    total_cc = 0
    count = 0
    for filepath, items in data.items():
        if not isinstance(items, list):
            continue
        for item in items:
            if not isinstance(item, dict):
                continue
            total_cc += int(item.get("complexity") or 0)
            count += 1
    if count == 0:
        pytest.skip("No functions analysed")
    avg = total_cc / count
    assert avg <= MAX_AVG_COMPLEXITY, (
        f"Average CC is {avg:.2f}, exceeds threshold {MAX_AVG_COMPLEXITY}"
    )


# -- Maintainability Index ---------------------------------------------------


def _parse_mi_json() -> dict:
    raw = _run_radon("mi", "--json")
    if not raw:
        return {}
    return json.loads(raw)


def test_no_module_below_min_maintainability():
    """Every module must have a maintainability index >= MIN_MAINTAINABILITY_INDEX."""
    data = _parse_mi_json()
    violations: list[str] = []
    for filepath, mi_score in data.items():
        if not isinstance(mi_score, (int, float)):
            continue
        if mi_score < MIN_MAINTAINABILITY_INDEX:
            violations.append(f"  {filepath} (MI={mi_score:.1f})")
    assert not violations, (
        f"Modules below MI<{MIN_MAINTAINABILITY_INDEX}:\n" + "\n".join(violations)
    )


# -- Raw Metrics Summary (informational, always passes) ----------------------


def test_raw_metrics_summary():
    """Collect and print raw metrics for visibility — always passes."""
    data = _parse_cc_json()
    total_functions = 0
    total_cc = 0
    max_cc = 0
    max_cc_name = ""
    for filepath, items in data.items():
        if not isinstance(items, list):
            continue
        for item in items:
            if not isinstance(item, dict):
                continue
            cc = int(item.get("complexity") or 0)
            total_functions += 1
            total_cc += cc
            if cc > max_cc:
                max_cc = cc
                max_cc_name = f"{filepath}:{item.get('lineno', '?')} {item.get('name', '?')}"
    if total_functions:
        avg = total_cc / total_functions
        print(f"\n[Quality] {total_functions} functions, avg CC={avg:.2f}, max CC={max_cc} ({max_cc_name})")
    else:
        print("\n[Quality] No functions analysed")
