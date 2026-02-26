"""
Fail CI when newly added Python files contain functions with cyclomatic complexity > 10.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path


MAX_CC = 10


def _run(cmd: list[str]) -> str:
    return subprocess.check_output(cmd, text=True, stderr=subprocess.DEVNULL).strip()


def _new_python_files() -> list[Path]:
    base_ref = os.environ.get("GITHUB_BASE_REF", "").strip()
    if base_ref:
        try:
            diff = _run(["git", "diff", "--diff-filter=A", "--name-only", f"origin/{base_ref}...HEAD"])
        except Exception:
            diff = ""
    else:
        try:
            diff = _run(["git", "diff", "--diff-filter=A", "--name-only", "HEAD~1...HEAD"])
        except Exception:
            diff = ""
    files = []
    for raw in diff.splitlines():
        p = Path(raw.strip())
        if p.suffix == ".py" and p.exists():
            files.append(p)
    return files


def main() -> int:
    files = _new_python_files()
    if not files:
        print("No newly added Python files; complexity gate skipped.")
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
        for item in items or []:
            complexity = int(item.get("complexity") or 0)
            if complexity > MAX_CC:
                violations.append((path, str(item.get("name") or "<unknown>"), complexity))

    if violations:
        print(f"Complexity gate failed: CC must be <= {MAX_CC} on newly added files.")
        for path, name, complexity in violations:
            print(f"- {path}: {name} (CC={complexity})")
        return 1

    print(f"Complexity gate passed for {len(files)} newly added Python file(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

