"""Run the canonical repository quality gate."""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

import tomllib
from packaging.specifiers import SpecifierSet
from packaging.version import Version

ROOT = Path(__file__).resolve().parents[1]
PYTHON_TEXT_PATHS = [
    "mjr_am_backend",
    "mjr_am_shared",
    "tests",
    "scripts",
    "__init__.py",
    "pyproject.toml",
    "mypy.ini",
    "pytest.ini",
    "tox.ini",
    ".pre-commit-config.yaml",
]
DOC_TEXT_PATHS = [
    "README.md",
    "CHANGELOG.md",
    "docs",
    ".github",
]
PYTHON_COMPLEXITY_PATHS = [
    "mjr_am_backend",
    "mjr_am_shared",
    "tests",
    "__init__.py",
]
RUFF_TARGETS = ["mjr_am_backend", "mjr_am_shared", "tests", "scripts", "__init__.py"]
BANDIT_TARGETS = ["mjr_am_backend"]
DEFAULT_PYTEST_ARGS = [
    "-q",
    "--cov=mjr_am_backend",
    "--cov=mjr_am_shared",
    "--cov-fail-under=60",
    "--cov-report=xml",
    "--cov-report=term-missing:skip-covered",
]
PIP_AUDIT_REQUIREMENTS = ["requirements.txt"]


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run lint, typecheck, security, complexity, and test gates.")
    parser.add_argument("--skip-tests", action="store_true", help="Skip backend pytest execution.")
    parser.add_argument("--skip-js-tests", action="store_true", help="Skip frontend vitest execution.")
    parser.add_argument("--skip-js-lint", action="store_true", help="Skip ESLint and Prettier checks.")
    parser.add_argument("--skip-js-audit", action="store_true", help="Skip npm audit.")
    parser.add_argument("--skip-pip-audit", action="store_true", help="Skip pip-audit.")
    parser.add_argument("--skip-bandit", action="store_true", help="Skip bandit.")
    parser.add_argument("--skip-mypy", action="store_true", help="Skip mypy.")
    parser.add_argument("--skip-ruff", action="store_true", help="Skip ruff.")
    parser.add_argument("--skip-complexity", action="store_true", help="Skip xenon/radon checks.")
    parser.add_argument(
        "--python-only",
        action="store_true",
        help="Shortcut for skipping JS tests and npm audit.",
    )
    parser.add_argument(
        "--changed-only-complexity",
        action="store_true",
        help="Run the stricter changed-file complexity guard in addition to repo thresholds.",
    )
    parser.add_argument(
        "--pytest-args",
        nargs=argparse.REMAINDER,
        default=None,
        help="Additional args passed through to pytest after '--pytest-args'.",
    )
    return parser.parse_args()


def _git_output(cmd: list[str]) -> str:
    return subprocess.check_output(cmd, cwd=ROOT, text=True, stderr=subprocess.DEVNULL).strip()


def _changed_python_files() -> list[str]:
    diff = ""
    base_ref = os.environ.get("GITHUB_BASE_REF", "").strip()
    try:
        if base_ref:
            diff = _git_output(["git", "diff", "--name-only", f"origin/{base_ref}...HEAD"])
        else:
            diff = _git_output(["git", "diff", "--name-only", "HEAD~1...HEAD"])
    except Exception:
        diff = ""

    changed: list[str] = []
    for raw in diff.splitlines():
        candidate = raw.strip()
        if not candidate:
            continue
        if " -> " in candidate:
            candidate = candidate.split(" -> ", 1)[1].strip()
        if not candidate.endswith(".py"):
            continue
        path = ROOT / candidate
        if path.exists():
            changed.append(candidate)
    return sorted(dict.fromkeys(changed))


def _run(cmd: list[str], *, label: str, env: dict[str, str] | None = None) -> None:
    print(f"\n==> {label}")
    print(" ".join(cmd))
    subprocess.run(cmd, cwd=ROOT, check=True, env=env)


def _python_cmd(module: str, *args: str) -> list[str]:
    return [sys.executable, "-m", module, *args]


def _npm_cmd(*args: str) -> list[str]:
    candidates = ["npm.cmd", "npm"] if os.name == "nt" else ["npm"]
    for candidate in candidates:
        if shutil.which(candidate):
            return [candidate, *args]
    raise SystemExit("npm is required for JS checks but was not found in PATH.")


def _existing_paths(values: list[str]) -> list[str]:
    existing: list[str] = []
    for value in values:
        if (ROOT / value).exists():
            existing.append(value)
    return existing


def _pip_audit_cmd() -> list[str]:
    requirement_files = _existing_paths(PIP_AUDIT_REQUIREMENTS)
    cmd = _python_cmd("pip_audit", "--strict", "--skip-editable")
    if requirement_files:
        for requirement_file in requirement_files:
            cmd.extend(["-r", requirement_file])
        return cmd
    return cmd


def _npm_available() -> bool:
    return any(shutil.which(candidate) for candidate in (("npm.cmd", "npm") if os.name == "nt" else ("npm",)))


def _current_python_supported_by_project() -> bool:
    pyproject_path = ROOT / "pyproject.toml"
    if not pyproject_path.exists():
        return True
    try:
        data = tomllib.loads(pyproject_path.read_text(encoding="utf-8"))
    except Exception:
        return True

    requires_python = ((data.get("project") or {}).get("requires-python") or "").strip()
    if not requires_python:
        return True

    try:
        supported_versions = SpecifierSet(requires_python)
        current_version = Version(f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}")
    except Exception:
        return True
    return current_version in supported_versions


def _clear_mypy_cache() -> None:
    cache_dir = ROOT / ".mypy_cache"
    if not cache_dir.exists():
        return
    shutil.rmtree(cache_dir, ignore_errors=True)


def main() -> int:
    args = _parse_args()
    if args.python_only:
        args.skip_js_tests = True
        args.skip_js_lint = True
        args.skip_js_audit = True

    text_paths = _existing_paths(PYTHON_TEXT_PATHS + DOC_TEXT_PATHS)
    complexity_paths = _existing_paths(PYTHON_COMPLEXITY_PATHS)
    bandit_targets = _existing_paths(BANDIT_TARGETS)
    changed_python = _changed_python_files()

    _run([sys.executable, "scripts/check_no_bom.py", *text_paths], label="UTF-8 and BOM hygiene")

    if not args.skip_ruff:
        if changed_python:
            changed_python_existing = _existing_paths(changed_python)
            if not changed_python_existing:
                print("\n==> Ruff lint")
                print("No existing changed Python files detected; skipping incremental Ruff gate.")
            else:
                _run(
                    _python_cmd("ruff", "check", *changed_python_existing),
                    label="Ruff lint (changed Python files)",
                )
        else:
            print("\n==> Ruff lint")
            print("No changed Python files detected; skipping incremental Ruff gate.")

    if not args.skip_mypy:
        _clear_mypy_cache()
        _run(_python_cmd("mypy", "--config-file", "mypy.ini"), label="Mypy")

    if not args.skip_bandit:
        _run(_python_cmd("bandit", "-r", *bandit_targets, "-ll", "-ii", "-x", "tests"), label="Bandit")

    if not args.skip_pip_audit:
        if _current_python_supported_by_project():
            _run(
                _pip_audit_cmd(),
                label="pip-audit",
            )
        else:
            print("\n==> pip-audit")
            print(
                "Skipping pip-audit because the active Python interpreter is outside the supported "
                "range declared in pyproject.toml."
            )

    if not args.skip_complexity:
        _run(
            _python_cmd("xenon", "-b", "D", "-m", "D", "-a", "B", *complexity_paths),
            label="Xenon repository complexity gate",
        )
        _run(
            [sys.executable, "scripts/check_cc_changed.py"],
            label="Changed-file complexity gate",
            env={**os.environ, "MJR_COMPLEXITY_MAX_CC": "25"},
        )

    if not args.skip_tests:
        pytest_args = args.pytest_args if args.pytest_args else DEFAULT_PYTEST_ARGS
        _run(_python_cmd("pytest", *pytest_args), label="Pytest")

    if not args.skip_js_lint:
        if not _npm_available():
            raise SystemExit("npm is required for JS lint but was not found in PATH.")
        _run(_npm_cmd("run", "lint:js"), label="ESLint")
        _run(_npm_cmd("run", "format:check"), label="Prettier")

    if not args.skip_js_tests:
        if not _npm_available():
            raise SystemExit("npm is required for JS tests but was not found in PATH.")
        _run(_npm_cmd("run", "test:js"), label="Vitest")

    if not args.skip_js_audit:
        if not _npm_available():
            raise SystemExit("npm is required for npm audit but was not found in PATH.")
        _run(_npm_cmd("audit", "--audit-level=high"), label="npm audit")

    print("\nQuality gate passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
