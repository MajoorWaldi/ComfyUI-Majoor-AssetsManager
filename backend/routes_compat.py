"""
HTTP routes for ComfyUI integration.

BACKWARD COMPATIBILITY SHIM:

The HTTP layer was refactored into a package under `backend/routes/`.
This module keeps the previous re-exports for any external code that imported
symbols from the old `backend.routes` module.

Important:
Python can get ambiguous when a package directory and a module file share the
same name. This shim is deliberately named `backend.routes_compat` so the
canonical entry-point remains the `backend.routes` *package*.
"""

# Import the modular routes system which auto-registers everything.
from .routes import (  # noqa: F401
    register_routes,
    register_all_routes,
    COMFY_OUTPUT_DIR,
)

# Re-export core utilities for backward compatibility.
from .routes.core import (  # noqa: F401
    _json_response,
    _normalize_path,
    _is_path_allowed,
    _is_path_allowed_custom,
    _safe_rel_path,
    _is_within_root,
    _get_allowed_directories,
    _check_rate_limit,
    _csrf_error,
    _require_services,
    _build_services,
)

# Re-export filesystem utilities.
from .routes.handlers.filesystem import (  # noqa: F401
    _kickoff_background_scan,
    _list_filesystem_assets,
)

# Re-export for any code that might reference these.
from .config import OUTPUT_ROOT  # noqa: F401
from .shared import Result, get_logger  # noqa: F401

logger = get_logger(__name__)

# Expose folder_paths stub for compatibility.
try:
    import folder_paths  # type: ignore
except Exception:  # pragma: no cover
    from pathlib import Path

    class _FolderPathsStub:
        @staticmethod
        def get_input_directory() -> str:
            return str((Path(__file__).resolve().parents[2] / "input").resolve())

        @staticmethod
        def get_output_directory() -> str:
            return str((Path(__file__).resolve().parents[2] / "output").resolve())

    folder_paths = _FolderPathsStub()  # type: ignore

# Expose PromptServer stub for compatibility.
try:
    from server import PromptServer  # type: ignore
except Exception:  # pragma: no cover
    from aiohttp import web

    class _PromptServerStub:
        instance = type("PromptServerInstance", (), {"routes": web.RouteTableDef()})()

    PromptServer = _PromptServerStub  # type: ignore

__all__ = [
    # Main functions
    "register_routes",
    "register_all_routes",

    # Constants
    "COMFY_OUTPUT_DIR",
    "OUTPUT_ROOT",

    # Core utilities
    "_json_response",
    "_normalize_path",
    "_is_path_allowed",
    "_is_path_allowed_custom",
    "_safe_rel_path",
    "_is_within_root",
    "_get_allowed_directories",
    "_check_rate_limit",
    "_csrf_error",
    "_require_services",
    "_build_services",

    # Filesystem utilities
    "_kickoff_background_scan",
    "_list_filesystem_assets",

    # Dependencies
    "folder_paths",
    "PromptServer",
    "Result",
    "logger",
]

