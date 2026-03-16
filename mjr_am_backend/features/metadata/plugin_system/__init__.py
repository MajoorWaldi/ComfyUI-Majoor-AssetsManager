"""
Plugin System for Majoor Assets Manager

Provides extensible metadata extraction through third-party plugins.
"""

from .base import (
    MetadataExtractorPlugin,
    ExtractionResult,
    ExtractorMetadata,
)
from .loader import PluginLoader, PluginLoadError
from .registry import PluginRegistry, PluginState
from .validator import PluginValidator
from .manager import PluginManager

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
