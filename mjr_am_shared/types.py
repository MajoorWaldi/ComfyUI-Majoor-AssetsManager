"""
Shared types, enums, and constants.
"""
import os
from enum import Enum
from typing import Final, Literal

# File type classifications
FileKind = Literal["image", "video", "audio", "model3d", "unknown"]

# Metadata quality levels
MetadataQuality = Literal["full", "partial", "degraded", "none"]

# Error codes
class ErrorCode(str, Enum):
    """Standardized error codes (string enum)."""

    # Client / validation
    INVALID_INPUT = "INVALID_INPUT"
    INVALID_JSON = "INVALID_JSON"
    NOT_FOUND = "NOT_FOUND"
    CSRF = "CSRF"

    # Feature / service availability
    DEGRADED = "DEGRADED"
    UNSUPPORTED = "UNSUPPORTED"
    TOOL_MISSING = "TOOL_MISSING"
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"

    # Server / infrastructure
    DB_ERROR = "DB_ERROR"
    TIMEOUT = "TIMEOUT"

    # Operation errors
    UPDATE_FAILED = "UPDATE_FAILED"
    METADATA_FAILED = "METADATA_FAILED"

    # Tool / parsing
    EXIFTOOL_ERROR = "EXIFTOOL_ERROR"
    FFPROBE_ERROR = "FFPROBE_ERROR"
    PARSE_ERROR = "PARSE_ERROR"

# File extensions by type
EXTENSIONS: Final[dict[FileKind, set[str]]] = {
    "image": {".png", ".jpg", ".jpeg", ".webp", ".gif"},
    "video": {".mp4", ".mov", ".webm", ".mkv"},
    "audio": {".wav", ".mp3", ".flac", ".ogg", ".aiff", ".aif", ".m4a", ".aac"},
    "model3d": {".obj", ".fbx", ".glb", ".gltf", ".stl"},
    "unknown": set(),
}

def classify_file(filename: str) -> FileKind:
    """
    Classify file by extension.

    Args:
        filename: File name or path

    Returns:
        File kind (image, video, audio, model3d, unknown)
    """
    ext = os.path.splitext(filename)[1].lower()

    for kind, exts in EXTENSIONS.items():
        if ext in exts:
            return kind

    return "unknown"

# Index modes
class IndexMode(str, Enum):
    """SQLite index modes."""
    AUTO = "auto"           # Try index first, fallback to scan
    INDEX = "index"         # Use SQLite index only
    FILESYSTEM = "filesystem"  # Direct filesystem scan

# Metadata modes
class MetadataMode(str, Enum):
    """Metadata extraction strategies."""
    LEGACY = "legacy"       # Windows props, ExifTool, sidecars only
    HYBRID = "hybrid"       # Try new parsers first, fallback to legacy
    NATIVE = "native"       # New native parsers only
