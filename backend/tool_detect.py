"""
Tool detection helpers for ExifTool and FFprobe.
Cached detection to avoid repeated subprocess calls.
"""
import shutil
import subprocess
from typing import Dict, Optional

from backend.config import EXIFTOOL_BIN, FFPROBE_BIN
from backend.shared import get_logger

logger = get_logger(__name__)

# Cache tool availability (None = not checked, True/False = result)
_TOOL_CACHE: Dict[str, Optional[bool]] = {
    "exiftool": None,
    "ffprobe": None,
}

# Cache tool versions
_TOOL_VERSIONS: Dict[str, Optional[str]] = {
    "exiftool": None,
    "ffprobe": None,
}


def has_exiftool() -> bool:
    """Check if ExifTool is available."""
    if _TOOL_CACHE["exiftool"] is not None:
        return _TOOL_CACHE["exiftool"]

    try:
        # Try using shutil.which first
        if shutil.which(EXIFTOOL_BIN):
            _TOOL_CACHE["exiftool"] = True
            try:
                # Try to get version
                result = subprocess.run(
                    [EXIFTOOL_BIN, "-ver"],
                    capture_output=True,
                    text=True,
                    timeout=2,
                    check=False
                )
                if result.returncode == 0:
                    _TOOL_VERSIONS["exiftool"] = result.stdout.strip()
            except Exception:
                pass
            return True

        # Fallback: try to execute it
        result = subprocess.run(
            [EXIFTOOL_BIN, "-ver"],
            capture_output=True,
            text=True,
            timeout=2,
            check=False
        )

        available = result.returncode == 0
        _TOOL_CACHE["exiftool"] = available

        if available:
            _TOOL_VERSIONS["exiftool"] = result.stdout.strip()
            logger.info(f"ExifTool detected: version {_TOOL_VERSIONS['exiftool']}")
        else:
            logger.warning("ExifTool not found in PATH")

        return available
    except (FileNotFoundError, subprocess.TimeoutExpired, Exception) as e:
        logger.warning(f"ExifTool detection failed: {e}")
        _TOOL_CACHE["exiftool"] = False
        return False


def has_ffprobe() -> bool:
    """Check if FFprobe is available."""
    if _TOOL_CACHE["ffprobe"] is not None:
        return _TOOL_CACHE["ffprobe"]

    try:
        # Try using shutil.which first
        if shutil.which(FFPROBE_BIN):
            _TOOL_CACHE["ffprobe"] = True
            try:
                # Try to get version
                result = subprocess.run(
                    [FFPROBE_BIN, "-version"],
                    capture_output=True,
                    text=True,
                    timeout=2,
                    check=False
                )
                if result.returncode == 0:
                    # Parse first line (version info)
                    version_line = result.stdout.split('\n')[0] if result.stdout else ""
                    _TOOL_VERSIONS["ffprobe"] = version_line.strip()
            except Exception:
                pass
            return True

        # Fallback: try to execute it
        result = subprocess.run(
            [FFPROBE_BIN, "-version"],
            capture_output=True,
            text=True,
            timeout=2,
            check=False
        )

        available = result.returncode == 0
        _TOOL_CACHE["ffprobe"] = available

        if available:
            # Parse first line (version info)
            version_line = result.stdout.split('\n')[0] if result.stdout else ""
            _TOOL_VERSIONS["ffprobe"] = version_line.strip()
            logger.info(f"FFprobe detected: {_TOOL_VERSIONS['ffprobe']}")
        else:
            logger.warning("FFprobe not found in PATH")

        return available
    except (FileNotFoundError, subprocess.TimeoutExpired, Exception) as e:
        logger.warning(f"FFprobe detection failed: {e}")
        _TOOL_CACHE["ffprobe"] = False
        return False


def get_tool_status() -> Dict[str, any]:
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
        }
    }


def reset_tool_cache():
    """Reset tool detection cache (for testing or manual refresh)."""
    global _TOOL_CACHE, _TOOL_VERSIONS
    _TOOL_CACHE = {"exiftool": None, "ffprobe": None}
    _TOOL_VERSIONS = {"exiftool": None, "ffprobe": None}
