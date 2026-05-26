"""
ComfyUI-Majoor-AssetsManager
Advanced asset browser for ComfyUI with ratings, tags, and metadata management.
"""

from __future__ import annotations

import importlib
import logging
import os
import re
import sys
from pathlib import Path
from typing import Any

# ComfyUI extension metadata – populated from nodes.py below.
NODE_CLASS_MAPPINGS: dict[str, Any] = {}
NODE_DISPLAY_NAME_MAPPINGS: dict[str, str] = {}

try:
    from .nodes import (
        NODE_CLASS_MAPPINGS as _ncm,
    )
    from .nodes import (
        NODE_DISPLAY_NAME_MAPPINGS as _ndnm,
    )
    NODE_CLASS_MAPPINGS.update(_ncm)
    NODE_DISPLAY_NAME_MAPPINGS.update(_ndnm)
except Exception:
    logging.getLogger("majoor_assets_manager").debug(
        "failed to import custom nodes", exc_info=True,
    )
# Resolved below after `root` is known; keep None as sentinel so imports
# executed before root assignment don't accidentally use a relative path.
WEB_DIRECTORY = None

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
    # ComfyUI only auto-loads browser-ready .js files from WEB_DIRECTORY.
    # The TypeScript/Vue source under ui/ must be bundled first with `npm run build`.
    _dist = root / "dist"
    WEB_DIRECTORY = str(_dist)
    if not (_dist / "entry.js").is_file():
        _logger.warning(
            "Majoor Assets Manager frontend bundle is missing at %s. "
            "Run `npm run build` before loading the custom node.",
            _dist / "entry.js",
        )

# Ensure extension-local packages (e.g. `mjr_am_backend`) are importable even when
# ComfyUI loads this module by file path without adding custom node root to sys.path.
try:
    root_str = str(root)
    if root_str not in sys.path:
        sys.path.append(root_str)
except Exception:
    _logger.debug("failed to ensure extension root on sys.path", exc_info=True)


def init_prompt_server() -> None:
    """
    Initialize routes against ComfyUI PromptServer.

    This is kept as a convenience wrapper for ComfyUI runtime.
    Bootstrap stages are recorded in ``mjr_am_backend.bootstrap_report``
    so their status is visible via ``/mjr/am/health``.
    """
    global _REGISTRY_HOOKS_DONE
    try:
        from mjr_am_backend.bootstrap_report import (
            record_stage,
        )
    except Exception:
        record_stage = None  # type: ignore[assignment]

    def _record(name: str, status: str, severity: str = "none", detail: str | None = None) -> None:
        if callable(record_stage):
            try:
                record_stage(name, status, severity, detail)
            except Exception:
                pass

    try:
        try:
            from mjr_am_backend.runtime_activity import ensure_prompt_lifecycle_provider_registered

            ensure_prompt_lifecycle_provider_registered()
            _record("prompt_lifecycle", "ok")
        except Exception as exc:
            _logger.debug("failed to register prompt lifecycle provider", exc_info=True)
            _record("prompt_lifecycle", "degraded", "internal", str(exc)[:120])

        _registry = importlib.import_module("mjr_am_backend.routes.registry")

        register_all_routes = getattr(_registry, "register_all_routes", None)
        register_routes = getattr(_registry, "register_routes", None)
        install_observability = getattr(_registry, "_install_observability_on_prompt_server", None)

        # Always register decorator-backed routes first; this does not require app.
        if not _REGISTRY_HOOKS_DONE and callable(register_all_routes):
            register_all_routes()
            _record("route_table", "ok")

        from server import PromptServer  # type: ignore
        prompt_server = getattr(PromptServer, "instance", None)
        app = getattr(prompt_server, "app", None)
        user_manager = getattr(prompt_server, "user_manager", None)
        if app is None:
            _logger.debug("PromptServer app is not available yet; route table registered only")
            _record("app_mount", "degraded", "internal", "PromptServer app not yet available")
            return
        if not _REGISTRY_HOOKS_DONE and callable(install_observability):
            try:
                install_observability()
                _record("observability", "ok")
            except Exception as exc:
                _record("observability", "degraded", "internal", str(exc)[:120])
        _REGISTRY_HOOKS_DONE = True
        if callable(register_routes):
            app_id = id(app)
            if app_id not in _REGISTERED_APPS:
                register_routes(app, user_manager=user_manager)
                _REGISTERED_APPS.add(app_id)
                _record("routes", "ok")
    except Exception as exc:
        _logger.exception("failed to initialize prompt server routes")
        _record("init", "fatal", "fatal", str(exc)[:120])


def init(app) -> None:
    """Public explicit initializer for host integrations and tests."""
    if app is None:
        raise ValueError("init(app) requires a valid aiohttp app instance")
    try:
        from mjr_am_backend.routes.registry import register_routes
        user_manager = None
        try:
            from server import PromptServer  # type: ignore

            user_manager = getattr(getattr(PromptServer, "instance", None), "user_manager", None)
        except Exception:
            user_manager = None
        app_id = id(app)
        if app_id not in _REGISTERED_APPS:
            register_routes(app, user_manager=user_manager)
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
