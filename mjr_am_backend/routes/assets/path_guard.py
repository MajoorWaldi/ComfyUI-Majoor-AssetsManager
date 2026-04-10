"""Path and download guards — thin wrapper re-exporting from features.assets."""
from pathlib import Path

from mjr_am_backend.features.assets.delete_service import (  # noqa: F401
    delete_file_best_effort,
)
from mjr_am_backend.features.assets.download_service import (  # noqa: F401
    build_download_response,
    safe_download_filename,
    validate_no_symlink_open,
)

from ..core import _is_path_allowed, _is_path_allowed_custom


def is_resolved_path_allowed(path: Path) -> bool:
    try:
        return bool(_is_path_allowed(path) or _is_path_allowed_custom(path))
    except Exception:
        return False


__all__ = [
    "build_download_response",
    "delete_file_best_effort",
    "is_resolved_path_allowed",
    "safe_download_filename",
    "validate_no_symlink_open",
]
