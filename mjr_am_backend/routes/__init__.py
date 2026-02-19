"""
Modular route system for ComfyUI Majoor Assets Manager.
Importing this package is side-effect free; route registration is explicit.
"""
from mjr_am_backend.config import OUTPUT_ROOT, get_runtime_output_root
from mjr_am_backend.shared import get_logger

logger = get_logger(__name__)

# Expose COMFY_OUTPUT_DIR for backward compatibility
COMFY_OUTPUT_DIR = OUTPUT_ROOT


def get_comfy_output_dir() -> str:
    """Runtime output directory (supports live override)."""
    return str(get_runtime_output_root())

from .registry import (
    register_all_routes,
    register_routes,
    _install_observability_on_prompt_server,
)

__all__ = [
    "register_routes",
    "register_all_routes",
    "COMFY_OUTPUT_DIR",
    "get_comfy_output_dir",
    "_install_observability_on_prompt_server",
]
