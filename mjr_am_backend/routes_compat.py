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

from __future__ import annotations

from typing import Protocol, cast

# Re-export for any code that might reference these.
from .config import OUTPUT_ROOT  # noqa: F401

# Import the modular routes system which auto-registers everything.
from .routes import (  # noqa: F401
    COMFY_OUTPUT_DIR,
    register_all_routes,
    register_routes,
)

# Re-export core utilities for backward compatibility.
from .routes.core import (  # noqa: F401
    _build_services,
    _check_rate_limit,
    _csrf_error,
    _get_allowed_directories,
    _is_path_allowed,
    _is_path_allowed_custom,
    _is_within_root,
    _json_response,
    _normalize_path,
    _require_services,
    _safe_rel_path,
)

# Re-export filesystem utilities.
from .routes.handlers.filesystem import (  # noqa: F401
    _kickoff_background_scan,
    _list_filesystem_assets,
)
from .shared import Result, get_logger  # noqa: F401

logger = get_logger(__name__)

# Expose folder_paths stub for compatibility.
class _FolderPaths(Protocol):
    def get_input_directory(self) -> str: ...

    def get_output_directory(self) -> str: ...


try:
    import folder_paths as _folder_paths

    folder_paths: _FolderPaths
    folder_paths = cast(_FolderPaths, _folder_paths)
except Exception:  # pragma: no cover
    from pathlib import Path

    class _FolderPathsStub:
        @staticmethod
        def get_input_directory() -> str:
            return str((Path(__file__).resolve().parents[2] / "input").resolve())

        @staticmethod
        def get_output_directory() -> str:
            return str((Path(__file__).resolve().parents[2] / "output").resolve())

    folder_paths = cast(_FolderPaths, _FolderPathsStub())

# Expose PromptServer stub for compatibility.
try:
    # Do not import ComfyUI's `server.py` here: importing it can trigger heavy
    # initialization (nodes/torch/cuda) and may hard-crash outside the real
    # ComfyUI runtime. Prefer reusing the already-loaded module when present.
    import sys

    _server_mod = sys.modules.get("server")
    if _server_mod is None or not hasattr(_server_mod, "PromptServer"):
        raise ImportError("ComfyUI server not loaded")

    from aiohttp import web

    class _PromptServerInstance(Protocol):
        routes: web.RouteTableDef

    class _PromptServer(Protocol):
        instance: _PromptServerInstance

    PromptServer = cast(_PromptServer, _server_mod.PromptServer)
except Exception:  # pragma: no cover
    from aiohttp import web

    class _PromptServerStub:
        instance = type("PromptServerInstance", (), {"routes": web.RouteTableDef()})()

    PromptServer = _PromptServerStub

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
