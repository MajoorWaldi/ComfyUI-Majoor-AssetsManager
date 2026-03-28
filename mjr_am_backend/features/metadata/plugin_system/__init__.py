"""
Plugin System for Majoor Assets Manager

Provides extensible metadata extraction through third-party plugins.
"""

from .base import (
    ExtractionResult,
    ExtractorMetadata,
    MetadataExtractorPlugin,
)
from .loader import PluginLoader, PluginLoadError
from .manager import PluginManager
from .registry import PluginRegistry, PluginState
from .validator import PluginValidator

__all__ = [
    "MetadataExtractorPlugin",
    "ExtractionResult",
    "ExtractorMetadata",
    "PluginLoader",
    "PluginLoadError",
    "PluginRegistry",
    "PluginState",
    "PluginValidator",
    "PluginManager",
]
