"""
ProbeRouter: Decides which metadata extraction tools to use based on settings.
"""
from pathlib import Path

from mjr_am_backend.config import MEDIA_PROBE_BACKEND
from mjr_am_backend.features.audio import AUDIO_EXTENSIONS
from mjr_am_backend.shared import get_logger
from mjr_am_backend.tool_detect import has_exiftool, has_ffprobe

logger = get_logger(__name__)

# Video extensions
VIDEO_EXTS = {'.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.flv', '.wmv', '.mpg', '.mpeg'}


def pick_probe_backend(
    filepath: str | Path,
    want_generation_tags: bool = True,
    settings_override: str | None = None
) -> list[str]:
    """
    Pick which probe backend(s) to use for metadata extraction.

    Args:
        filepath: Path to the file being probed
        want_generation_tags: Whether generation metadata (prompt/workflow) is needed
        settings_override: Override the global MEDIA_PROBE_BACKEND setting

    Returns:
        List of backends to use, in order: ["exiftool"], ["ffprobe"], or ["exiftool", "ffprobe"]
    """
    mode = _normalize_probe_mode(settings_override or MEDIA_PROBE_BACKEND)
    is_media = _is_audio_or_video(filepath)
    if mode == "exiftool":
        return _single_mode_fallback(primary="exiftool", secondary="ffprobe")
    if mode == "ffprobe":
        return _single_mode_fallback(primary="ffprobe", secondary="exiftool")
    if mode == "both":
        return _available_tools_pair()
    return _auto_mode_tools(is_media=is_media, want_generation_tags=want_generation_tags)


def _normalize_probe_mode(mode: str) -> str:
    if mode in ("auto", "exiftool", "ffprobe", "both"):
        return mode
    logger.warning("Invalid media_probe_backend '%s', falling back to 'auto'", mode)
    return "auto"


def _is_audio_or_video(filepath: str | Path) -> bool:
    ext = Path(filepath).suffix.lower()
    return ext in VIDEO_EXTS or ext in AUDIO_EXTENSIONS


def _single_mode_fallback(primary: str, secondary: str) -> list[str]:
    if _tool_available(primary):
        return [primary]
    logger.warning("%s requested but not available, trying %s", primary.capitalize(), secondary)
    if _tool_available(secondary):
        return [secondary]
    return []


def _available_tools_pair() -> list[str]:
    tools: list[str] = []
    if has_exiftool():
        tools.append("exiftool")
    if has_ffprobe():
        tools.append("ffprobe")
    return tools


def _auto_mode_tools(*, is_media: bool, want_generation_tags: bool) -> list[str]:
    _ = want_generation_tags
    if is_media:
        return _available_tools_pair()
    if has_exiftool():
        return ["exiftool"]
    if has_ffprobe():
        logger.debug("Using ffprobe for image (ExifTool not available)")
        return ["ffprobe"]
    return []


def _tool_available(name: str) -> bool:
    if name == "exiftool":
        return has_exiftool()
    if name == "ffprobe":
        return has_ffprobe()
    return False


def get_probe_strategy_description(filepath: str | Path) -> str:
    """
    Get a human-readable description of the probe strategy for a file.
    Useful for debugging/logging.
    """
    backends = pick_probe_backend(filepath)
    if not backends:
        return "No probe backends available"
    if len(backends) == 1:
        return f"Using {backends[0]} only"
    return f"Using {' + '.join(backends)}"
