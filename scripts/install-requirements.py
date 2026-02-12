"""Install Majoor Assets Manager runtime dependencies explicitly.

Usage:
    python scripts/install-requirements.py
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    req = root / "requirements.txt"
    if not req.exists():
        print(f"requirements file not found: {req}")
        return 1
    cmd = [sys.executable, "-m", "pip", "install", "-r", str(req)]
    print("running:", " ".join(cmd))
    return subprocess.call(cmd)


if __name__ == "__main__":
    raise SystemExit(main())
