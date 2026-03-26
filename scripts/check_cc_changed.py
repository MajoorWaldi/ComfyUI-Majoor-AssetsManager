"""Fail CI when changed Python files exceed the configured complexity cap."""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path


DEFAULT_MAX_CC = 10


def _max_cc() -> int:
    try:
        raw = os.environ.get("MJR_COMPLEXITY_MAX_CC", "").strip()
        if raw:
            return max(1, int(raw))
    except Exception:
        pass
    return DEFAULT_MAX_CC


def _run(cmd: list[str]) -> str:
    return subprocess.check_output(cmd, text=True, stderr=subprocess.DEVNULL).strip()


def _new_python_files() -> list[Path]:
    base_ref = os.environ.get("GITHUB_BASE_REF", "").strip()
    if base_ref:
        try:
            diff = _run(["git", "diff", "--diff-filter=AM", "--name-only", f"origin/{base_ref}...HEAD"])
        except Exception:
            diff = ""
    else:
        try:
            diff = _run(["git", "diff", "--diff-filter=AM", "--name-only", "HEAD~1...HEAD"])
        except Exception:
            diff = ""
    files = []
    for raw in diff.splitlines():
        p = Path(raw.strip())
        if p.suffix == ".py" and p.exists():
            files.append(p)
    return files


def main() -> int:
    max_cc = _max_cc()
    files = _new_python_files()
    if not files:
        print("No changed Python files; complexity gate skipped.")
        return 0

    cmd = ["python", "-m", "radon", "cc", "--json", *[str(p) for p in files]]
    try:
        payload = _run(cmd)
        data = json.loads(payload) if payload else {}
    except Exception as exc:
        print(f"Failed to run radon: {exc}")
        return 1

    violations: list[tuple[str, str, int]] = []
    for path, items in data.items():
        if not isinstance(items, list):
            # radon reports {"error": "..."} for files with syntax errors — skip them
            if isinstance(items, dict) and "error" in items:
                print(f"Skipping {path}: radon error — {items['error']}")
            continue
        for item in items:
            if not isinstance(item, dict):
                continue
            complexity = int(item.get("complexity") or 0)
            if complexity > max_cc:
                violations.append((path, str(item.get("name") or "<unknown>"), complexity))

    if violations:
        print(f"Complexity gate failed: CC must be <= {max_cc} on changed files.")
        for path, name, complexity in violations:
            print(f"- {path}: {name} (CC={complexity})")
        return 1

    print(f"Complexity gate passed for {len(files)} changed Python file(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

