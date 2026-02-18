from __future__ import annotations

import os
import re
import subprocess
from pathlib import Path
from typing import TypedDict


class VersionInfo(TypedDict):
    version: str
    branch: str


_NIGHTLY_KEYWORDS = ("nightly", "dev", "alpha", "experimental")


def _find_pyproject_version() -> str:
    try:
        root = Path(__file__).resolve().parent.parent
        pyproject_path = root / "pyproject.toml"
        if not pyproject_path.exists():
            return "0.0.0"
        raw = pyproject_path.read_text(encoding="utf-8")
        match = re.search(r'^version\s*=\s*"(.*?)"', raw, flags=re.MULTILINE)
        if match:
            return match.group(1).strip()
    except Exception:
        pass
    return "0.0.0"


def _resolve_branch_from_env() -> str:
    for key in (
        "MAJOR_ASSETS_MANAGER_BRANCH",
        "MAJOOR_ASSETS_MANAGER_BRANCH",
        "MAJOOR_ASSETS_MANAGER_CHANNEL",
        "MAJOR_ASSETS_MANAGER_CHANNEL",
    ):
        value = os.environ.get(key)
        if value:
            return value.strip()
    return ""


def _run_git(args: list[str]) -> str:
    try:
        root = Path(__file__).resolve().parent.parent
        result = subprocess.run(
            ["git", "-C", str(root), *args],
            capture_output=True,
            text=True,
            timeout=1.5,
            check=False,
        )
        if result.returncode != 0:
            return ""
        return str(result.stdout or "").strip()
    except Exception:
        return ""


def _resolve_branch_from_git() -> str:
    branch = _run_git(["rev-parse", "--abbrev-ref", "HEAD"])
    # Detached HEAD commonly returns literal "HEAD".
    if not branch or branch.upper() == "HEAD":
        return ""
    return branch


def _looks_nightly(value: str) -> bool:
    lowered = str(value or "").strip().lower()
    return any(k in lowered for k in _NIGHTLY_KEYWORDS)


def _is_nightly_checkout(version: str, branch: str) -> bool:
    if _looks_nightly(branch) or _looks_nightly(version):
        return True

    # If running from git and HEAD isn't exactly the stable release tag,
    # treat it as nightly/development build.
    exact_tag = _run_git(["describe", "--tags", "--exact-match"])
    if exact_tag:
        clean = str(version or "").strip().lstrip("v")
        return exact_tag not in {clean, f"v{clean}"}
    return False


def _resolve_branch(version: str) -> str:
    env_branch = _resolve_branch_from_env()
    if env_branch:
        return env_branch

    git_branch = _resolve_branch_from_git()
    if git_branch:
        return git_branch

    if _is_nightly_checkout(version, ""):
        return "nightly"

    return "main"


def get_version_info() -> VersionInfo:
    version = _find_pyproject_version()
    branch = _resolve_branch(version)
    if _is_nightly_checkout(version, branch):
        return {"version": "nightly", "branch": "nightly"}
    return {
        "version": version,
        "branch": branch,
    }

