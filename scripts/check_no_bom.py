"""Fail if repository text files use UTF-8 BOM or invalid UTF-8."""

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
TEXT_EXTENSIONS = {
    ".md",
    ".py",
    ".toml",
    ".yml",
    ".yaml",
    ".json",
}


def _iter_text_files(root: Path):
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if path.suffix.lower() not in TEXT_EXTENSIONS:
            continue
        yield path


def _has_utf8_bom(path: Path) -> bool:
    try:
        with path.open("rb") as fh:
            return fh.read(3) == UTF8_BOM
    except OSError:
        return False


def _is_valid_utf8(path: Path) -> bool:
    try:
        path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return False
    return True


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Check text files for UTF-8 without BOM."
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
    bom_offenders: list[Path] = []
    decode_offenders: list[Path] = []

    for raw in args.paths:
        target = Path(raw)
        if not target.exists():
            continue

        if target.is_file():
            if target.suffix.lower() in TEXT_EXTENSIONS and _has_utf8_bom(target):
                bom_offenders.append(target)
            if target.suffix.lower() in TEXT_EXTENSIONS and not _is_valid_utf8(target):
                decode_offenders.append(target)
            continue

        for path in _iter_text_files(target):
            if _has_utf8_bom(path):
                bom_offenders.append(path)
            if not _is_valid_utf8(path):
                decode_offenders.append(path)

    bom_offenders = sorted({p.resolve() for p in bom_offenders})
    decode_offenders = sorted({p.resolve() for p in decode_offenders})
    if bom_offenders or decode_offenders:
        if bom_offenders:
            print(f"Found UTF-8 BOM in {len(bom_offenders)} text file(s):")
            for path in bom_offenders:
                try:
                    rel = path.relative_to(cwd)
                except ValueError:
                    rel = path
                print(f"- {rel.as_posix()}")
        if decode_offenders:
            print(f"Found invalid UTF-8 in {len(decode_offenders)} text file(s):")
            for path in decode_offenders:
                try:
                    rel = path.relative_to(cwd)
                except ValueError:
                    rel = path
                print(f"- {rel.as_posix()}")
        return 1

    print("UTF-8 and BOM checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
