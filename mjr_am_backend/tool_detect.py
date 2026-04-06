"""
Tool detection helpers for ExifTool and FFprobe.
Cached detection to avoid repeated subprocess calls.
"""
import re
import shutil
import subprocess
import threading
from pathlib import Path
from typing import Any

from mjr_am_backend.config import (
    EXIFTOOL_BIN,
    EXIFTOOL_MIN_VERSION,
    FFPROBE_BIN,
    FFPROBE_MIN_VERSION,
)
from mjr_am_backend.shared import get_logger
from mjr_am_backend.tool_candidates import (
    EXIFTOOL_CANDIDATE_NAMES,
    iter_exiftool_candidates,
    strip_optional_quotes,
)

logger = get_logger(__name__)

# Cache tool availability (None = not checked, True/False = result)
_TOOL_CACHE: dict[str, bool | None] = {
    "exiftool": None,
    "ffprobe": None,
}

# Cache tool versions
_TOOL_VERSIONS: dict[str, str | None] = {
    "exiftool": None,
    "ffprobe": None,
}
_TOOL_CACHE_LOCK = threading.Lock()
_FFPROBE_CANDIDATE_NAMES = ("ffprobe", "ffprobe.exe")


def parse_tool_version(value: str | None) -> tuple[int, ...]:
    if not value:
        return ()
    parts = re.findall(r"\d+", value)
    out: list[int] = []
    for part in parts:
        try:
            out.append(int(part))
        except ValueError:
            continue
    return tuple(out)


def version_satisfies_minimum(actual: str | None, minimum: str) -> bool:
    if not minimum:
        return True
    minimum_parts = parse_tool_version(minimum)
    if not minimum_parts:
        return True
    actual_parts = parse_tool_version(actual or "")
    if not actual_parts:
        return False
    length = max(len(actual_parts), len(minimum_parts))
    padded_actual = list(actual_parts) + [0] * (length - len(actual_parts))
    padded_minimum = list(minimum_parts) + [0] * (length - len(minimum_parts))
    return tuple(padded_actual) >= tuple(padded_minimum)


def _enforce_min_version(name: str, actual: str | None, minimum: str) -> bool:
    if not minimum:
        return True
    if version_satisfies_minimum(actual, minimum):
        return True
    logger.warning(
        "%s version %s does not meet minimum required %s",
        name,
        actual or "<unknown>",
        minimum,
    )
    return False


def _run_command(cmd: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        timeout=2,
        check=False,
    )


def _is_named_exiftool_candidate(candidate: str) -> bool:
    return Path(candidate).name.lower() in EXIFTOOL_CANDIDATE_NAMES


def _is_explicit_existing_path(candidate: str) -> bool:
    text = str(candidate or "").strip()
    if not text:
        return False
    path = Path(text)
    if not (path.is_absolute() or path.parent != Path(".")):
        return False
    try:
        return path.exists()
    except OSError:
        return False


def _can_try_candidate(candidate: str) -> bool:
    if _is_explicit_existing_path(candidate):
        return True
    if not _is_named_exiftool_candidate(candidate):
        return True
    return shutil.which(candidate) is not None


def _probe_exiftool_candidates() -> tuple[bool, subprocess.CompletedProcess[str] | None, str]:
    for candidate in iter_exiftool_candidates(EXIFTOOL_BIN):
        if not _can_try_candidate(candidate):
            continue
        try:
            probe = _run_command([candidate, "-ver"])
        except (FileNotFoundError, subprocess.TimeoutExpired):
            continue
        if probe.returncode == 0:
            return True, probe, candidate
    return False, None, ""


def _is_named_ffprobe_candidate(candidate: str) -> bool:
    return Path(candidate).name.lower() in _FFPROBE_CANDIDATE_NAMES


def _iter_ffprobe_candidates(raw: str | None) -> list[str]:
    configured = strip_optional_quotes(raw or "")
    out: list[str] = []

    def add(value: str) -> None:
        if value and value not in out:
            out.append(value)

    if configured:
        add(configured)
        name = Path(configured).name.lower()
        if name in _FFPROBE_CANDIDATE_NAMES:
            for alias in _FFPROBE_CANDIDATE_NAMES:
                add(alias)

            parent = Path(configured).parent
            for alias in _FFPROBE_CANDIDATE_NAMES:
                add(str(parent / alias))

    for alias in _FFPROBE_CANDIDATE_NAMES:
        add(alias)
    return out


def _probe_ffprobe_candidates() -> tuple[bool, subprocess.CompletedProcess[str] | None, str]:
    for candidate in _iter_ffprobe_candidates(FFPROBE_BIN):
        if _is_named_ffprobe_candidate(candidate) and shutil.which(candidate) is None:
            continue
        try:
            probe = _run_command([candidate, "-version"])
        except (FileNotFoundError, subprocess.TimeoutExpired):
            continue
        if probe.returncode == 0:
            return True, probe, candidate
    return False, None, ""


def has_exiftool() -> bool:
    """Check if ExifTool is available."""
    with _TOOL_CACHE_LOCK:
        if _TOOL_CACHE["exiftool"] is True:
            return True

        try:
            available, result, chosen_bin = _probe_exiftool_candidates()
            _TOOL_CACHE["exiftool"] = available

            if available:
                assert result is not None
                version = result.stdout.strip()
                _TOOL_VERSIONS["exiftool"] = version
                if not _enforce_min_version("ExifTool", version, EXIFTOOL_MIN_VERSION):
                    _TOOL_CACHE["exiftool"] = False
                    return False
                logger.info("ExifTool detected via %s: version %s", chosen_bin, version)
            else:
                logger.warning("ExifTool not found or failed to start")

            return available
        except (FileNotFoundError, subprocess.TimeoutExpired) as exc:
            logger.warning("ExifTool detection failed: %s", exc)
            _TOOL_CACHE["exiftool"] = False
            return False
        except Exception as exc:
            logger.warning("ExifTool detection raised unexpected error: %s", exc)
            _TOOL_CACHE["exiftool"] = False
            return False


def has_ffprobe() -> bool:
    """Check if FFprobe is available."""
    with _TOOL_CACHE_LOCK:
        if _TOOL_CACHE["ffprobe"] is not None:
            return bool(_TOOL_CACHE["ffprobe"])

        try:
            available, result, chosen_bin = _probe_ffprobe_candidates()
            _TOOL_CACHE["ffprobe"] = available

            if available:
                assert result is not None
                version_line = result.stdout.split("\n")[0] if result.stdout else ""
                version = version_line.strip()
                _TOOL_VERSIONS["ffprobe"] = version
                if not _enforce_min_version("FFprobe", version, FFPROBE_MIN_VERSION):
                    _TOOL_CACHE["ffprobe"] = False
                    return False
                logger.info("FFprobe detected via %s: %s", chosen_bin, version)
            else:
                logger.warning("FFprobe not found or failed to start")

            return available
        except (FileNotFoundError, subprocess.TimeoutExpired) as exc:
            logger.warning("FFprobe detection failed: %s", exc)
            _TOOL_CACHE["ffprobe"] = False
            return False
        except Exception as exc:
            logger.warning("FFprobe detection raised unexpected error: %s", exc)
            _TOOL_CACHE["ffprobe"] = False
            return False


def get_tool_status() -> dict[str, Any]:
    """
    Get the status of all tools.
    Returns: {
        "exiftool": bool,
        "ffprobe": bool,
        "versions": {
            "exiftool": str | null,
            "ffprobe": str | null
        }
    }
    """
    return {
        "exiftool": has_exiftool(),
        "ffprobe": has_ffprobe(),
        "versions": {
            "exiftool": _TOOL_VERSIONS.get("exiftool"),
            "ffprobe": _TOOL_VERSIONS.get("ffprobe"),
        },
    }


def reset_tool_cache():
    """Reset tool detection cache (for testing or manual refresh)."""
    global _TOOL_CACHE, _TOOL_VERSIONS
    with _TOOL_CACHE_LOCK:
        _TOOL_CACHE = {"exiftool": None, "ffprobe": None}
        _TOOL_VERSIONS = {"exiftool": None, "ffprobe": None}
