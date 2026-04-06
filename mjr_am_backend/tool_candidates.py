"""
Shared candidate helpers for external tool resolution.
"""
import os
from pathlib import Path
from typing import Callable

EXIFTOOL_CANDIDATE_NAMES = ("exiftool", "exiftool.exe", "exiftool(-k)", "exiftool(-k).exe")


def strip_optional_quotes(raw: str | None) -> str:
    text = str(raw or "").strip()
    if len(text) >= 2 and text[0] == text[-1] and text[0] in ('"', "'"):
        return text[1:-1].strip()
    return text


def iter_exiftool_candidates(raw: str | None) -> list[str]:
    configured = strip_optional_quotes(raw or "")
    out: list[str] = []

    def add(value: str) -> None:
        if value and value not in out:
            out.append(value)

    if configured:
        add(configured)
        _add_named_exiftool_aliases(configured, add)

    for alias in EXIFTOOL_CANDIDATE_NAMES:
        add(alias)

    for candidate in _iter_common_windows_exiftool_paths():
        add(candidate)

    return out


def _add_named_exiftool_aliases(raw: str, add: Callable[[str], None]) -> None:
    path = Path(raw)
    if path.name.lower() not in EXIFTOOL_CANDIDATE_NAMES:
        return
    for alias in EXIFTOOL_CANDIDATE_NAMES:
        add(alias)
        add(str(path.with_name(alias)))


def _iter_common_windows_exiftool_paths() -> list[str]:
    roots: list[str] = []

    local_app_data = strip_optional_quotes(os.getenv("LOCALAPPDATA"))
    if local_app_data:
        roots.append(str(Path(local_app_data) / "Programs" / "ExifTool"))
        roots.append(str(Path(local_app_data) / "Microsoft" / "WinGet" / "Links"))

    for env_name in ("ProgramFiles", "ProgramFiles(x86)"):
        root = strip_optional_quotes(os.getenv(env_name))
        if root:
            roots.append(str(Path(root) / "ExifTool"))

    out: list[str] = []
    for root in roots:
        for alias in EXIFTOOL_CANDIDATE_NAMES:
            candidate = str(Path(root) / alias)
            if candidate not in out:
                out.append(candidate)
    return out
