"""
Shared types, enums, and constants.
"""
from enum import Enum
from typing import Literal

# File type classifications
FileKind = Literal["image", "video", "audio", "model3d", "unknown"]

# Metadata quality levels
MetadataQuality = Literal["full", "partial", "degraded", "none"]

# Error codes
class ErrorCode:
    """Standard error codes for Result pattern."""
    OK = "OK"
    NOT_FOUND = "NOT_FOUND"
    UNSUPPORTED = "UNSUPPORTED"
    DEGRADED = "DEGRADED"
    TOOL_MISSING = "TOOL_MISSING"
    DB_ERROR = "DB_ERROR"
    EXIFTOOL_ERROR = "EXIFTOOL_ERROR"
    FFPROBE_ERROR = "FFPROBE_ERROR"
    PARSE_ERROR = "PARSE_ERROR"
    INVALID_INPUT = "INVALID_INPUT"
    TIMEOUT = "TIMEOUT"

# File extensions by type
EXTENSIONS = {
    "image": {".png", ".jpg", ".jpeg", ".webp", ".gif"},
    "video": {".mp4", ".mov", ".webm", ".mkv"},
    "audio": {".wav", ".mp3", ".flac", ".ogg", ".m4a", ".aac"},
    "model3d": {".obj", ".fbx", ".glb", ".gltf", ".stl"},
}

def classify_file(filename: str) -> FileKind:
    """
    Classify file by extension.

    Args:
        filename: File name or path

    Returns:
        File kind (image, video, audio, model3d, unknown)
    """
    import os
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
