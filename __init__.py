"""
ComfyUI-Majoor-AssetsManager
Advanced asset browser for ComfyUI with ratings, tags, and metadata management.
"""

from __future__ import annotations

import os
import re
import shutil
import subprocess
import sys
from typing import Optional
from pathlib import Path

# ComfyUI extension metadata
NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}
# Resolved below after `root` is known; keep None as sentinel so imports
# executed before root assignment don't accidentally use a relative path.
WEB_DIRECTORY = None
import logging
_logger = logging.getLogger("majoor_assets_manager")


def _read_version_from_pyproject() -> str:
    try:
        root = Path(__file__).resolve().parent
        pyproject_path = root / "pyproject.toml"
        if not pyproject_path.exists():
            return "0.0.0"
        raw = pyproject_path.read_text(encoding="utf-8")
        match = re.search(r'^version\\s*=\\s*"(.*?)"', raw, flags=re.MULTILINE)
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

# ---- Windows safety guard -------------------------------------------------
# Optional maintenance helper. Disabled by default to avoid mutating sibling
# entries in a shared `custom_nodes/` directory.


def _windows_extended_path(path: str) -> str:
    if path.startswith("\\\\?\\"):
        return path
    if path.startswith("\\\\"):
        # UNC path: \\server\share\... -> \\?\UNC\server\share\...
        return "\\\\?\\UNC\\" + path.lstrip("\\")
    return "\\\\?\\" + path


def _try_delete_windows_path(path: str) -> None:
    nt_path = _windows_extended_path(path)
    try:
        os.unlink(nt_path)
        return
    except IsADirectoryError:
        pass
    except FileNotFoundError:
        return
    except OSError:
        # Fall through to directory removal / cmd fallback.
        pass

    try:
        shutil.rmtree(nt_path)
        return
    except FileNotFoundError:
        return
    except OSError:
        pass

    # Last-resort fallback via cmd builtins (kept best-effort and silent).
    try:
        subprocess.run(["cmd", "/c", f'del /f /q "{nt_path}"'], check=False, capture_output=True)
        subprocess.run(["cmd", "/c", f'rd /s /q "{nt_path}"'], check=False, capture_output=True)
    except Exception:
        pass


def _cleanup_windows_reserved_custom_nodes() -> Optional[str]:
    try:
        if os.name != "nt":
            return None
        custom_nodes_dir = Path(__file__).resolve().parent.parent
        if not custom_nodes_dir.exists():
            return None

        try:
            entries = os.listdir(str(custom_nodes_dir))
        except OSError:
            return None

        reserved = {"CON", "PRN", "AUX", "NUL"}
        reserved.update({f"COM{i}" for i in range(1, 10)})
        reserved.update({f"LPT{i}" for i in range(1, 10)})

        for name in entries:
            # Windows device names are reserved even with extensions and trailing dots/spaces.
            cleaned = str(name or "").strip().rstrip(". ")
            base = cleaned.split(".", 1)[0].strip().upper()
            if base not in reserved:
                continue
            try:
                victim = str((custom_nodes_dir / name).resolve())
            except Exception:
                victim = str(custom_nodes_dir / name)
            _try_delete_windows_path(victim)
            return victim
    except Exception:
        return None
    return None


root = Path(__file__).resolve().parent
if str(root) not in sys.path:
    sys.path.append(str(root))
if WEB_DIRECTORY is None:
    WEB_DIRECTORY = str(root / "js")


def _warn_missing_dependencies() -> None:
    try:
        import importlib.util as _ilu
        required_modules = ["aiohttp", "PIL", "send2trash", "aiosqlite"]
        if os.name == "nt":
            required_modules.append("win32api")
        missing = [m for m in required_modules if _ilu.find_spec(m) is None]
        if missing:
            _logger.warning(
                "missing dependencies: %s. install manually: \"%s\" -m pip install -r \"%s\"",
                ", ".join(missing),
                sys.executable,
                root / "requirements.txt",
            )
    except Exception:
        pass


def init_prompt_server() -> None:
    try:
        from mjr_am_backend.routes.registry import register_all_routes, _install_observability_on_prompt_server
        register_all_routes()
        _install_observability_on_prompt_server()
    except Exception:
        _logger.exception("failed to initialize prompt server routes")


def init(app_or_prompt_server=None) -> None:
    """Public explicit initializer for host integrations and tests."""
    if app_or_prompt_server is None:
        init_prompt_server()
        return
    try:
        from mjr_am_backend.routes.registry import register_routes
        register_routes(app_or_prompt_server)
    except Exception:
        _logger.exception("failed to initialize routes on provided app")


_warn_missing_dependencies()
if str(os.environ.get("MJR_AM_CLEANUP_RESERVED_NAMES", "")).strip().lower() in ("1", "true", "yes", "on"):
    try:
        removed = _cleanup_windows_reserved_custom_nodes()
        if removed:
            _logger.info("removed Windows reserved custom node entry: %s", removed)
    except Exception:
        pass
try:
    if "server" in sys.modules:
        init_prompt_server()
except Exception:
    _logger.exception("failed to auto-initialize prompt server routes")

__all__ = [
    "NODE_CLASS_MAPPINGS",
    "NODE_DISPLAY_NAME_MAPPINGS",
    "WEB_DIRECTORY",
    "__version__",
    "__branch__",
    "init",
    "init_prompt_server",
]
