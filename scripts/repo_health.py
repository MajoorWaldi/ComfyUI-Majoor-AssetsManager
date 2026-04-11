"""
repo_health.py — Repository health metrics dashboard.

Tracks indicators that predict maintainability degradation before it becomes
visible.  Run weekly (or in CI) to get a trend view.

Usage
-----
    python scripts/repo_health.py              # print summary table
    python scripts/repo_health.py --json       # machine-readable output
    python scripts/repo_health.py --threshold  # exit 1 if any hard limit is exceeded

Tracked metrics
---------------
- Python bare-except count (``except Exception: pass`` or ``except: pass``)
- TODO / FIXME / HACK count across tracked files
- Number of lines in mjr_am_backend/utils.py  (must shrink over time)
- Number of lines in mjr_am_backend/shared.py (idem)
- Number of imports from routes_compat.py     (legacy adapter usage)
- Number of Python files with cyclomatic complexity > threshold (via radon, optional)
- js_dist committed status                    (must be absent from git index in dev)
- JS bundle size                               (js_dist/entry.js, if present)
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent

# ── hard limits (exit 1 when exceeded with --threshold) ──────────────────────
# Limits are intentionally set slightly above the current baseline so they
# act as "must not grow" guards rather than "must fix now" targets.
# See ADR 0006 for the failure taxonomy that drives these thresholds.
LIMITS: dict[str, int] = {
    # One-liner except:pass that swallow silently _on a single line_.
    "single_line_bare_except": 10,
    # Multi-line bare except blocks — ratchet, must not grow (ADR 0006).
    "multiline_bare_except": 250,
    "utils_py_lines": 300,        # mjr_am_backend/utils.py must not grow
    "shared_py_lines": 400,       # mjr_am_backend/shared.py idem
    "routes_compat_imports": 10,  # legacy adapter usage must shrink
    # Direct comfyApiBridge imports in js/features/ — must decrease toward
    # zero as files are migrated to hostAdapter.js (ADR 0007).
    "comfybridge_violations_in_features": 10,
}


# ── data model ────────────────────────────────────────────────────────────────

@dataclass
class Metric:
    name: str
    value: Any
    unit: str = ""
    limit: int | None = None
    note: str = ""

    @property
    def exceeded(self) -> bool:
        if self.limit is None:
            return False
        try:
            return int(self.value) > self.limit
        except (TypeError, ValueError):
            return False

    def status_icon(self) -> str:
        if self.exceeded:
            return "OVER_LIMIT"
        return "ok"


@dataclass
class HealthReport:
    metrics: list[Metric] = field(default_factory=list)

    def add(self, **kwargs: Any) -> None:
        self.metrics.append(Metric(**kwargs))

    def any_exceeded(self) -> bool:
        return any(m.exceeded for m in self.metrics)

    def as_dict(self) -> dict:
        return {
            "metrics": [
                {
                    "name": m.name,
                    "value": m.value,
                    "unit": m.unit,
                    "limit": m.limit,
                    "status": m.status_icon(),
                    "note": m.note,
                }
                for m in self.metrics
            ],
            "any_exceeded": self.any_exceeded(),
        }


# ── helpers ────────────────────────────────────────────────────────────────────

def _py_files() -> list[Path]:
    """All tracked Python files under mjr_am_backend/ and the root __init__.py."""
    return list(ROOT.rglob("mjr_am_backend/**/*.py")) + [ROOT / "__init__.py"]


def _js_files() -> list[Path]:
    return list(ROOT.rglob("js/**/*.js"))


# Files legitimately allowed to import comfyApiBridge directly.
# Mirrors ALLOWED_DIRECT_IMPORTERS in tests/quality/test_architecture_conformance.py.
_COMFYBRIDGE_ALLOWED: frozenset[str] = frozenset({
    "js/app/comfyApiBridge.js",
    "js/app/hostAdapter.js",
    "js/entry.js",
    "js/app/dialogs.js",
    "js/app/toast.js",
    "js/app/i18n.js",
    "js/features/runtime/entryUiRegistration.js",
})
_COMFYBRIDGE_IMPORT_RE = re.compile(
    r'^(?:import|export)\b.*["\'].*comfyApiBridge', re.MULTILINE
)


def _count_comfybridge_violations_in_features() -> int:
    """Count js/features/** files that import comfyApiBridge outside the allow-list."""
    features_root = ROOT / "js" / "features"
    total = 0
    for path in features_root.rglob("*.js"):
        rel = path.relative_to(ROOT).as_posix()
        if rel in _COMFYBRIDGE_ALLOWED:
            continue
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        if _COMFYBRIDGE_IMPORT_RE.search(text):
            total += 1
    return total


def _count_pattern_in_files(files: list[Path], pattern: str) -> int:
    rx = re.compile(pattern)
    total = 0
    for path in files:
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
            total += len(rx.findall(text))
        except OSError:
            pass
    return total


def _file_line_count(rel: str) -> int:
    p = ROOT / rel
    try:
        return len(p.read_text(encoding="utf-8", errors="ignore").splitlines())
    except OSError:
        return -1


def _git_tracked(path: Path) -> bool:
    """Return True if the path is currently tracked by git (staged or committed)."""
    try:
        result = subprocess.run(
            ["git", "ls-files", "--error-unmatch", str(path)],
            cwd=ROOT,
            capture_output=True,
            timeout=5,
        )
        return result.returncode == 0
    except Exception:
        return False


def _bundle_size_bytes(rel: str) -> int:
    p = ROOT / rel
    try:
        return p.stat().st_size
    except OSError:
        return -1


def _radon_complexity_violations(threshold: int = 10) -> int:
    """Count functions/methods above cyclomatic complexity `threshold` (requires radon)."""
    try:
        result = subprocess.run(
            ["radon", "cc", "-n", "B", "--total-average", "mjr_am_backend"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=30,
        )
        if result.returncode != 0:
            return -1
        # radon cc output: each violation line starts with a letter grade
        # Count lines with complexity > threshold by parsing radon's output lines
        count = 0
        for line in result.stdout.splitlines():
            m = re.search(r"\((\d+)\)$", line.strip())
            if m and int(m.group(1)) > threshold:
                count += 1
        return count
    except FileNotFoundError:
        return -1  # radon not installed


# ── metrics collection ────────────────────────────────────────────────────────

def collect(report: HealthReport) -> None:
    py = _py_files()

    # 1. Single-line bare excepts: `except Exception: pass` on one line
    # These are the truly silent swallows (no log, no record_stage).
    # Multi-line except/pass is also tech debt but handled by the ADR 0006
    # classification rule rather than a hard gate here.
    single_bare = _count_pattern_in_files(
        py,
        r"except\s*(?:Exception\s*)?:[^\S\n]*(pass|\.\.\.)[ \t]*(?:#.*)?$",
    )
    report.add(
        name="single_line_bare_except",
        value=single_bare,
        unit="occurrences",
        limit=LIMITS["single_line_bare_except"],
        note="one-liner `except: pass` — truly silent swallows (ADR 0006)",
    )

    # 1b. Multi-line bare excepts — ratchet (must not grow, ADR 0006)
    multiline_bare = _count_pattern_in_files(
        py,
        r"except\s*:\s*\n\s*(pass|\.\.\.)",
    )
    report.add(
        name="multiline_bare_except",
        value=multiline_bare,
        unit="occurrences",
        limit=LIMITS["multiline_bare_except"],
        note="multi-line `except:\n    pass` — must not grow, classify per ADR 0006",
    )

    # 2. TODO / FIXME / HACK in Python
    debt_py = _count_pattern_in_files(py, r"#\s*(TODO|FIXME|HACK)\b")
    report.add(
        name="python_debt_markers",
        value=debt_py,
        unit="occurrences",
        note="TODO/FIXME/HACK comments in Python files",
    )

    # 3. TODO / FIXME / HACK in JS
    js = _js_files()
    debt_js = _count_pattern_in_files(js, r"//\s*(TODO|FIXME|HACK)\b")
    report.add(
        name="js_debt_markers",
        value=debt_js,
        unit="occurrences",
        note="TODO/FIXME/HACK comments in JS files",
    )

    # 4. utils.py size
    utils_lines = _file_line_count("mjr_am_backend/utils.py")
    report.add(
        name="utils_py_lines",
        value=utils_lines,
        unit="lines",
        limit=LIMITS["utils_py_lines"],
        note="mjr_am_backend/utils.py must shrink over time",
    )

    # 5. shared.py size
    shared_lines = _file_line_count("mjr_am_backend/shared.py")
    report.add(
        name="shared_py_lines",
        value=shared_lines,
        unit="lines",
        limit=LIMITS["shared_py_lines"],
        note="mjr_am_backend/shared.py must shrink over time",
    )

    # 6. routes_compat.py import count (legacy adapter usage)
    compat_imports = _count_pattern_in_files(py, r"from\s+.*routes_compat\b|import\s+.*routes_compat\b")
    report.add(
        name="routes_compat_imports",
        value=compat_imports,
        unit="occurrences",
        limit=LIMITS["routes_compat_imports"],
        note="Imports from legacy routes_compat.py — must decrease toward zero",
    )

    # 7. js_dist tracked in git? (should be absent in dev branches)
    dist_tracked = _git_tracked(ROOT / "js_dist")
    report.add(
        name="js_dist_git_tracked",
        value="yes" if dist_tracked else "no",
        unit="",
        note="js_dist/ should NOT be committed in development branches (ADR 0005)",
    )

    # 8. JS bundle size (js_dist/entry.js)
    bundle_bytes = _bundle_size_bytes("js_dist/entry.js")
    if bundle_bytes >= 0:
        report.add(
            name="js_bundle_entry_kb",
            value=round(bundle_bytes / 1024, 1),
            unit="KB",
            note="js_dist/entry.js size — track for bundle bloat",
        )
    else:
        report.add(
            name="js_bundle_entry_kb",
            value="n/a",
            unit="KB",
            note="js_dist/entry.js not present (run npm run build to measure)",
        )

    # 10. comfyApiBridge violations in js/features/ (ADR 0007 ratchet)
    cb_violations = _count_comfybridge_violations_in_features()
    report.add(
        name="comfybridge_violations_in_features",
        value=cb_violations,
        unit="files",
        limit=LIMITS["comfybridge_violations_in_features"],
        note="js/features/ files importing comfyApiBridge directly — migrate to hostAdapter.js (ADR 0007)",
    )

    # 9. Cyclomatic complexity violations (optional, needs radon)
    cc_violations = _radon_complexity_violations(threshold=10)
    if cc_violations >= 0:
        report.add(
            name="py_high_complexity_functions",
            value=cc_violations,
            unit="functions",
            note="Python functions with cyclomatic complexity > 10 (needs radon)",
        )
    else:
        report.add(
            name="py_high_complexity_functions",
            value="n/a (radon not installed)",
            unit="",
            note="Install radon to measure: pip install radon",
        )


# ── output ─────────────────────────────────────────────────────────────────────

def _print_table(report: HealthReport) -> None:
    col_w = [35, 20, 15, 14]
    header = f"{'Metric':<{col_w[0]}} {'Value':>{col_w[1]}} {'Limit':>{col_w[2]}} {'Status':>{col_w[3]}}"
    sep = "-" * sum(col_w)
    print()
    print("  Majoor Assets Manager — Repo Health Metrics")
    print(f"  {sep}")
    print(f"  {header}")
    print(f"  {sep}")
    for m in report.metrics:
        limit_str = str(m.limit) if m.limit is not None else "—"
        status = "!! OVER LIMIT" if m.exceeded else "ok"
        row = f"  {m.name:<{col_w[0]}} {str(m.value):>{col_w[1]}} {limit_str:>{col_w[2]}} {status:>{col_w[3]}}"
        print(row)
        if m.note:
            print(f"  {'':>{col_w[0]}}   {m.note}")
    print(f"  {sep}")
    overall = "OVER LIMIT — action required" if report.any_exceeded() else "all within bounds"
    print(f"  Overall: {overall}")
    print()


# ── entry point ───────────────────────────────────────────────────────────────

def main() -> int:
    parser = argparse.ArgumentParser(description="Repo health metrics for Majoor Assets Manager")
    parser.add_argument("--json", action="store_true", help="Output JSON")
    parser.add_argument(
        "--threshold",
        action="store_true",
        help="Exit with code 1 if any hard limit is exceeded",
    )
    args = parser.parse_args()

    report = HealthReport()
    collect(report)

    if args.json:
        print(json.dumps(report.as_dict(), indent=2))
    else:
        _print_table(report)

    if args.threshold and report.any_exceeded():
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
