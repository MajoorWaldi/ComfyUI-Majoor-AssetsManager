"""
ComfyUI-Majoor-AssetsManager
Advanced asset browser for ComfyUI with ratings, tags, and metadata management.
"""

from __future__ import annotations

import os
import re
import sys
import importlib
from pathlib import Path

# ComfyUI extension metadata
NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}
# Resolved below after `root` is known; keep None as sentinel so imports
# executed before root assignment don't accidentally use a relative path.
WEB_DIRECTORY = None
import logging
_logger = logging.getLogger("majoor_assets_manager")
_REGISTRY_HOOKS_DONE = False
_REGISTERED_APPS: set[int] = set()


def _read_version_from_pyproject() -> str:
    try:
        root = Path(__file__).resolve().parent
        pyproject_path = root / "pyproject.toml"
        if not pyproject_path.exists():
            return "0.0.0"
        raw = pyproject_path.read_text(encoding="utf-8")
        match = re.search(r'^version\s*=\s*"(.*?)"', raw, flags=re.MULTILINE)
        if match:
            return match.group(1).strip()
    except Exception:
        pass
    return "0.0.0"


def _detect_branch_from_env() -> str:
    candidates = (
        "MAJOR_ASSETS_MANAGER_BRANCH",
        "MAJOOR_ASSETS_MANAGER_BRANCH",
    )
    for key in candidates:
        value = os.environ.get(key)
        if value:
            return value.strip()
    return "main"


__version__ = _read_version_from_pyproject()
__branch__ = _detect_branch_from_env()

root = Path(__file__).resolve().parent
if WEB_DIRECTORY is None:
    WEB_DIRECTORY = str(root / "js")

# Ensure extension-local packages (e.g. `mjr_am_backend`) are importable even when
# ComfyUI loads this module by file path without adding custom node root to sys.path.
try:
    root_str = str(root)
    if root_str not in sys.path:
        sys.path.insert(0, root_str)
except Exception:
    _logger.debug("failed to ensure extension root on sys.path", exc_info=True)


def init_prompt_server() -> None:
    """
    Initialize routes against ComfyUI PromptServer.

    This is kept as a convenience wrapper for ComfyUI runtime.
    """
    global _REGISTRY_HOOKS_DONE
    try:
        _registry = importlib.import_module("mjr_am_backend.routes.registry")

        register_all_routes = getattr(_registry, "register_all_routes", None)
        register_routes = getattr(_registry, "register_routes", None)
        install_observability = getattr(_registry, "_install_observability_on_prompt_server", None)

        # Always register decorator-backed routes first; this does not require app.
        if not _REGISTRY_HOOKS_DONE and callable(register_all_routes):
            register_all_routes()

        # Keep legacy behavior expected by import-hook tests and older runtime wiring.
        if not _REGISTRY_HOOKS_DONE and callable(install_observability):
            install_observability()
        _REGISTRY_HOOKS_DONE = True

        from server import PromptServer  # type: ignore
        app = getattr(PromptServer.instance, "app", None)
        if app is None:
            _logger.debug("PromptServer app is not available yet; route table registered only")
            return
        if callable(register_routes):
            app_id = id(app)
            if app_id not in _REGISTERED_APPS:
                register_routes(app)
                _REGISTERED_APPS.add(app_id)
    except Exception:
        _logger.exception("failed to initialize prompt server routes")


def init(app) -> None:
    """Public explicit initializer for host integrations and tests."""
    if app is None:
        raise ValueError("init(app) requires a valid aiohttp app instance")
    try:
        from mjr_am_backend.routes.registry import register_routes
        app_id = id(app)
        if app_id not in _REGISTERED_APPS:
            register_routes(app)
            _REGISTERED_APPS.add(app_id)
    except Exception:
        _logger.exception("failed to initialize routes on provided app")


def register(app, user_manager=None) -> None:
    """
    Explicit host integration entrypoint.

    Args:
        app: aiohttp application instance
        user_manager: optional ComfyUI user manager for auth-aware route policies
    """
    if app is None:
        raise ValueError("register(app, user_manager=None) requires a valid aiohttp app instance")
    try:
        from mjr_am_backend.routes.registry import register_routes
        app_id = id(app)
        if app_id not in _REGISTERED_APPS:
            register_routes(app, user_manager=user_manager)
            _REGISTERED_APPS.add(app_id)
    except Exception:
        _logger.exception("failed to register routes on provided app")


try:
    # Minimal ComfyUI custom_nodes import-time behavior:
    # register routes/UI via explicit init path, no sys.modules mutation.
    init_prompt_server()
except Exception:
    _logger.exception("failed to initialize at import time")

__all__ = [
    "NODE_CLASS_MAPPINGS",
    "NODE_DISPLAY_NAME_MAPPINGS",
    "WEB_DIRECTORY",
    "__version__",
    "__branch__",
    "init",
    "register",
    "init_prompt_server",
]
