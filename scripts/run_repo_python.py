"""Run a Python command using the repository virtualenv when available."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def _repo_python() -> str:
    candidates = [
        ROOT / ".venv" / "Scripts" / "python.exe",
        ROOT / ".venv" / "bin" / "python",
    ]
    for candidate in candidates:
        if candidate.exists():
            return str(candidate)
    return sys.executable


def main() -> int:
    if len(sys.argv) <= 1:
        raise SystemExit("Usage: python scripts/run_repo_python.py <python args...>")
    env = None
    if len(sys.argv) >= 3 and sys.argv[1] == "-m" and sys.argv[2] == "ruff":
        env = {**os.environ, "RUFF_NO_CACHE": "true"}
    completed = subprocess.run([_repo_python(), *sys.argv[1:]], cwd=ROOT, check=False, env=env)
    return int(completed.returncode)


if __name__ == "__main__":
    raise SystemExit(main())
