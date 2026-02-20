"""Fail if any Python source file is encoded with UTF-8 BOM."""

from __future__ import annotations

import argparse
from pathlib import Path

UTF8_BOM = b"\xef\xbb\xbf"
SKIP_DIRS = {
    ".git",
    ".venv",
    "node_modules",
    "__pycache__",
    ".pytest_cache",
}


def _iter_python_files(root: Path):
    for path in root.rglob("*.py"):
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        yield path


def _has_utf8_bom(path: Path) -> bool:
    try:
        with path.open("rb") as fh:
            return fh.read(3) == UTF8_BOM
    except OSError:
        return False


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Check that Python files do not contain a UTF-8 BOM."
    )
    parser.add_argument(
        "paths",
        nargs="*",
        default=["."],
        help="Files or directories to scan (default: repository root).",
    )
    return parser.parse_args()


def main() -> int:
    args = _parse_args()
    cwd = Path.cwd().resolve()
    offenders: list[Path] = []

    for raw in args.paths:
        target = Path(raw)
        if not target.exists():
            continue

        if target.is_file():
            if target.suffix == ".py" and _has_utf8_bom(target):
                offenders.append(target)
            continue

        for path in _iter_python_files(target):
            if _has_utf8_bom(path):
                offenders.append(path)

    offenders = sorted({p.resolve() for p in offenders})
    if offenders:
        print(f"Found UTF-8 BOM in {len(offenders)} Python file(s):")
        for path in offenders:
            try:
                rel = path.relative_to(cwd)
            except ValueError:
                rel = path
            print(f"- {rel.as_posix()}")
        return 1

    print("No UTF-8 BOM detected in Python files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
