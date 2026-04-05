# Majoor Assets Manager - Plugin System Design Document

**Document Type:** Architecture Design  
**Version:** 1.0.0  
**Date:** March 16, 2026  
**Author:** Architecture Team  
**Status:** Proposal  

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Architecture Analysis](#current-architecture-analysis)
3. [Plugin System Architecture](#plugin-system-architecture)
4. [Implementation Plan](#implementation-plan)
5. [API Reference](#api-reference)
6. [Security Model](#security-model)
7. [Testing Strategy](#testing-strategy)
8. [Migration Guide](#migration-guide)
9. [Appendices](#appendices)

---

## 📌 Executive Summary

### **Objective**

Design and implement a **plugin system** for the Majoor Assets Manager that allows third-party developers to create custom metadata extractors without modifying the core codebase.

### **Problem Statement**

The current metadata extraction system is **hardcoded** with fixed extractors for known formats (PNG, WEBP, video, audio). This creates limitations:

- ❌ Cannot extract custom node-specific metadata (WanVideo, rgthree, etc.)
- ❌ Cannot support new file formats without code changes
- ❌ Cannot add custom parsing logic for proprietary schemas
- ❌ Requires core codebase modification for any new extractor

### **Solution**

Implement a **plugin architecture** with:

- ✅ Well-defined plugin interface (abstract base class)
- ✅ Auto-discovery mechanism (scan plugin directories)
- ✅ Priority-based extractor selection
- ✅ Sandboxed execution environment
- ✅ Hot-reload capability for development

### **Benefits**

| Benefit | Impact |
|---------|--------|
| **Extensibility** | Add formats without core changes |
| **Community** | Share extractors as separate packages |
| **Isolation** | Plugin bugs don't crash core system |
| **Testing** | Test extractors independently |
| **Versioning** | Independent release cycles |

---

## 🔍 Current Architecture Analysis

### **Current Metadata Extraction Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│                    MetadataService.extract()                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  File Type Detection (image/video/audio/3d)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Hardcoded Extractor Lookup                                      │
│  - extract_png_metadata()                                        │
│  - extract_webp_metadata()                                       │
│  - extract_video_metadata()                                      │
│  - extract_audio_metadata()                                      │
│  - extract_3d_model_metadata()                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Metadata Normalization & Storage                                │
└─────────────────────────────────────────────────────────────────┘
```

### **Current Extractor Registry**

**File:** `mjr_am_backend/features/metadata/extractor_registry.py`

```python
# Current implementation - hardcoded extractors

EXTRACTORS = {
    "png": extract_png_metadata,
    "webp": extract_webp_metadata,
    "video": extract_video_metadata,
    "audio": extract_audio_metadata,
    "model3d": extract_3d_model_metadata,
}

def get_extractor(file_type: str):
    return EXTRACTORS.get(file_type)
```

### **Limitations Identified**

1. **No Extension Points** - Cannot inject custom extractors
2. **Tight Coupling** - Extractors imported directly in service
3. **No Priority System** - All extractors treated equally
4. **No Validation** - No plugin safety checks
5. **No Discovery** - Manual registration required

---

## 🏗️ Plugin System Architecture

### **High-Level Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                     ComfyUI Runtime                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Majoor Assets Manager                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              MetadataService (Modified)                     │ │
│  │   ┌──────────────────────────────────────────────────────┐ │ │
│  │   │           PluginLoader (NEW)                          │ │ │
│  │   │   - discover_plugins()                                │ │ │
│  │   │   - validate_plugins()                                │ │ │
│  │   │   - get_extractor(filepath)                           │ │ │
│  │   └──────────────────────────────────────────────────────┘ │ │
│  │   ┌──────────────────────────────────────────────────────┐ │ │
│  │   │           Built-in Extractors                         │ │ │
│  │   │   - PNG/WEBP extractor                                │ │ │
│  │   │   - Video extractor (FFprobe)                         │ │ │
│  │   │   - Audio extractor                                   │ │ │
│  │   └──────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Plugin Directory                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │ wanvideo_plugin  │  │ rgthree_plugin   │  │ custom_plugin │ │
│  │ ──────────────── │  │ ──────────────── │  │ ───────────── │ │
│  │ priority: 100    │  │ priority: 50     │  │ priority: 10  │ │
│  │ extensions: .png │  │ extensions: .png │  │ extensions:   │ │
│  └──────────────────┘  └──────────────────┘  └───────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### **Component Diagram**

```
┌─────────────────────────────────────────────────────────────────┐
│                     Plugin System Components                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────┐                                         │
│  │  Plugin Interface  │  Abstract base class defining contract  │
│  │  (ABC)             │                                         │
│  └─────────┬──────────┘                                         │
│            │                                                     │
│            ▼                                                     │
│  ┌────────────────────┐                                         │
│  │  Plugin Loader     │  Discovery, validation, loading         │
│  └─────────┬──────────┘                                         │
│            │                                                     │
│            ▼                                                     │
│  ┌────────────────────┐                                         │
│  │  Plugin Registry   │  Runtime registry of loaded plugins     │
│  └─────────┬──────────┘                                         │
│            │                                                     │
│            ▼                                                     │
│  ┌────────────────────┐                                         │
│  │  Plugin Manager    │  Lifecycle management, hot-reload       │
│  └─────────┬──────────┘                                         │
│            │                                                     │
│            ▼                                                     │
│  ┌────────────────────┐                                         │
│  │  Security Validator│  Sandboxing, permission checks          │
│  └────────────────────┘                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### **Directory Structure**

```
ComfyUI-Majoor-AssetsManager/
├── mjr_am_backend/
│   └── features/
│       └── metadata/
│           ├── service.py                 # Modified to use plugins
│           ├── extractor_registry.py      # Keep built-in extractors
│           └── plugin_system/             # NEW: Plugin system
│               ├── __init__.py
│               ├── base.py                # Plugin interface (ABC)
│               ├── loader.py              # Plugin discovery & loading
│               ├── registry.py            # Runtime plugin registry
│               ├── manager.py             # Lifecycle management
│               ├── validator.py           # Security validation
│               └── sandbox.py             # Execution sandboxing
│
├── plugins/                               # NEW: Plugin directory
│   ├── __init__.py
│   ├── README.md
│   └── examples/
│       ├── wanvideo_extractor.py
│       ├── rgthree_extractor.py
│       └── custom_node_extractor.py
│
├── tests/
│   └── plugins/                           # NEW: Plugin tests
│       ├── test_plugin_loader.py
│       ├── test_plugin_validator.py
│       └── test_plugin_integration.py
│
└── docs/
    └── PLUGIN_DEVELOPMENT_GUIDE.md       # NEW: Plugin dev guide
```

---

## 🛠️ Implementation Plan

### **Phase 1: Core Infrastructure** (Week 1)

#### **1.1 Define Plugin Interface**

**File:** `mjr_am_backend/features/metadata/plugin_system/base.py`

```python
"""
Plugin System - Base Interface

Defines the abstract base class for metadata extractor plugins.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


@dataclass
class ExtractorMetadata:
    """Metadata about an extractor plugin."""
    name: str
    version: str = "1.0.0"
    author: str = "Unknown"
    description: str = ""
    homepage: str = ""
    license: str = "MIT"


@dataclass
class ExtractionResult:
    """Result from metadata extraction."""
    success: bool
    data: Dict[str, Any] = field(default_factory=dict)
    error: Optional[str] = None
    extractor_name: str = ""
    confidence: float = 1.0  # 0.0-1.0, for fuzzy matching


class MetadataExtractorPlugin(ABC):
    """
    Abstract base class for metadata extractor plugins.

    All plugins must inherit from this class and implement
    the required methods.

    Example:
        class MyExtractor(MetadataExtractorPlugin):
            @property
            def name(self): return "my_extractor"

            @property
            def supported_extensions(self): return ['.png', '.webp']

            async def extract(self, filepath): ...
    """

    # ─── Required Properties ───────────────────────────────────────

    @property
    @abstractmethod
    def name(self) -> str:
        """
        Unique plugin identifier.

        Must be lowercase, alphanumeric with underscores.
        Example: "wanvideo_extractor", "rgthree_extractor"
        """
        pass

    @property
    @abstractmethod
    def supported_extensions(self) -> List[str]:
        """
        File extensions this extractor handles.

        Returns:
            List of extensions including dot, e.g., ['.png', '.webp']
        """
        pass

    @property
    @abstractmethod
    def priority(self) -> int:
        """
        Extraction priority (higher = runs first).

        Priority levels:
        - 100-999: Custom node-specific extractors
        - 50-99:   Format-specific extractors
        - 1-49:    Generic/fallback extractors
        """
        pass

    # ─── Optional Properties ───────────────────────────────────────

    @property
    def metadata(self) -> ExtractorMetadata:
        """Plugin metadata (optional, provides defaults)."""
        return ExtractorMetadata(name=self.name)

    @property
    def min_compatibility_version(self) -> str:
        """Minimum Majoor version required (default: "2.4.4")."""
        return "2.4.4"

    # ─── Required Methods ──────────────────────────────────────────

    @abstractmethod
    async def extract(self, filepath: str) -> ExtractionResult:
        """
        Extract metadata from file.

        Args:
            filepath: Absolute path to file

        Returns:
            ExtractionResult with success status and data

        Raises:
            Any exceptions should be caught and returned as
            ExtractionResult(success=False, error=str(exc))
        """
        pass

    # ─── Optional Methods ──────────────────────────────────────────

    def can_extract(self, filepath: str) -> bool:
        """
        Check if this extractor can handle the file.

        Default implementation checks file extension.
        Override for more complex detection logic.
        """
        ext = Path(filepath).suffix.lower()
        return ext in self.supported_extensions

    async def pre_extract(self, filepath: str) -> bool:
        """
        Pre-extraction hook (optional).

        Called before extract(). Return False to skip extraction.
        Useful for quick validation checks.
        """
        return True

    async def post_extract(
        self,
        filepath: str,
        result: ExtractionResult
    ) -> ExtractionResult:
        """
        Post-extraction hook (optional).

        Called after extract(). Can modify result.
        Useful for cleanup or data enrichment.
        """
        return result

    async def cleanup(self) -> None:
        """
        Cleanup hook called on plugin unload.

        Override to release resources, close connections, etc.
        """
        pass

    # ─── Helper Methods ────────────────────────────────────────────

    def _create_success_result(
        self,
        data: Dict[str, Any],
        confidence: float = 1.0
    ) -> ExtractionResult:
        """Helper to create success result."""
        return ExtractionResult(
            success=True,
            data=data,
            extractor_name=self.name,
            confidence=confidence
        )

    def _create_error_result(
        self,
        error: str
    ) -> ExtractionResult:
        """Helper to create error result."""
        return ExtractionResult(
            success=False,
            error=error,
            extractor_name=self.name
        )
```

#### **1.2 Implement Plugin Loader**

**File:** `mjr_am_backend/features/metadata/plugin_system/loader.py`

```python
"""
Plugin System - Loader

Discovers, validates, and loads plugins from configured directories.
"""

from __future__ import annotations

import importlib
import importlib.util
import pkgutil
import sys
from pathlib import Path
from typing import Dict, List, Optional, Set, Type
import logging

from .base import MetadataExtractorPlugin, ExtractorMetadata

logger = logging.getLogger(__name__)


class PluginLoadError(Exception):
    """Raised when plugin loading fails."""
    pass


class PluginLoader:
    """
    Discovers and loads metadata extractor plugins.

    Usage:
        loader = PluginLoader([Path("/plugins")])
        loader.discover_plugins()
        extractor = loader.get_extractor("image.png")
        result = await extractor.extract("image.png")
    """

    def __init__(
        self,
        plugin_dirs: Optional[List[Path]] = None,
        auto_discover: bool = True
    ):
        """
        Initialize plugin loader.

        Args:
            plugin_dirs: Directories to scan for plugins
            auto_discover: Automatically discover on init
        """
        self.plugin_dirs = plugin_dirs or self._default_plugin_dirs()
        self._extractors: Dict[str, MetadataExtractorPlugin] = {}
        self._loaded_modules: Set[str] = set()
        self._load_errors: List[tuple[str, str]] = []

        if auto_discover:
            self.discover_plugins()

    def _default_plugin_dirs(self) -> List[Path]:
        """Get default plugin directories."""
        from ...config import OUTPUT_ROOT_PATH

        return [
            # Bundled plugins
            Path(__file__).parent.parent.parent.parent / "plugins",
            # User plugins (global)
            Path.home() / ".comfyui" / "majoor_plugins" / "extractors",
            # User plugins (local to ComfyUI)
            OUTPUT_ROOT_PATH / "_mjr_plugins" / "extractors",
        ]

    def discover_plugins(self) -> int:
        """
        Scan plugin directories and load all valid extractors.

        Returns:
            Number of plugins successfully loaded
        """
        loaded_count = 0

        for plugin_dir in self.plugin_dirs:
            if not plugin_dir.exists():
                logger.debug(f"Plugin directory does not exist: {plugin_dir}")
                continue

            if not plugin_dir.is_dir():
                logger.warning(f"Plugin path is not a directory: {plugin_dir}")
                continue

            try:
                count = self._scan_directory(plugin_dir)
                loaded_count += count
                logger.info(f"Loaded {count} plugins from {plugin_dir}")
            except Exception as e:
                logger.error(f"Failed to scan {plugin_dir}: {e}")
                self._load_errors.append((str(plugin_dir), str(e)))

        logger.info(f"Total plugins loaded: {loaded_count}")
        return loaded_count

    def _scan_directory(self, directory: Path) -> int:
        """Scan a single directory for plugins."""
        count = 0

        # Scan .py files
        for module_file in directory.glob("*.py"):
            if module_file.name.startswith("_"):
                continue

            try:
                self._load_module(module_file)
                count += 1
            except Exception as e:
                logger.error(f"Failed to load {module_file}: {e}")
                self._load_errors.append((str(module_file), str(e)))

        # Scan subdirectories as packages
        for subdir in directory.iterdir():
            if not subdir.is_dir():
                continue
            if subdir.name.startswith("_"):
                continue
            if not (subdir / "__init__.py").exists():
                continue

            try:
                count += self._scan_package(subdir)
            except Exception as e:
                logger.error(f"Failed to scan package {subdir}: {e}")

        return count

    def _scan_package(self, package_dir: Path) -> int:
        """Scan a package directory for plugins."""
        count = 0
        package_name = package_dir.name

        for module_file in package_dir.glob("*.py"):
            if module_file.name.startswith("_"):
                continue
            if module_file.name == "__init__.py":
                continue

            try:
                self._load_module(module_file, package_name=package_name)
                count += 1
            except Exception as e:
                logger.error(f"Failed to load {module_file}: {e}")

        return count

    def _load_module(
        self,
        module_file: Path,
        package_name: Optional[str] = None
    ) -> None:
        """Load a single Python module and extract plugins."""
        module_name = module_file.stem
        full_name = f"majoor_plugins.{package_name}.{module_name}" if package_name else f"majoor_plugins.{module_name}"

        # Skip already loaded modules
        if full_name in self._loaded_modules:
            return

        # Load module
        spec = importlib.util.spec_from_file_location(full_name, module_file)
        if spec is None or spec.loader is None:
            raise PluginLoadError(f"Cannot load spec for {module_file}")

        module = importlib.util.module_from_spec(spec)
        sys.modules[full_name] = module
        spec.loader.exec_module(module)

        self._loaded_modules.add(full_name)

        # Find and instantiate all extractor classes
        for attr_name in dir(module):
            attr = getattr(module, attr_name)
            if self._is_valid_extractor_class(attr):
                try:
                    extractor = attr()
                    self.register_extractor(extractor)
                except Exception as e:
                    logger.error(f"Failed to instantiate {attr_name}: {e}")

    def _is_valid_extractor_class(self, cls: Type) -> bool:
        """Check if class is a valid extractor plugin."""
        try:
            return (
                isinstance(cls, type) and
                issubclass(cls, MetadataExtractorPlugin) and
                cls is not MetadataExtractorPlugin
            )
        except TypeError:
            return False

    def register_extractor(
        self,
        extractor: MetadataExtractorPlugin,
        force: bool = False
    ) -> None:
        """
        Register an extractor instance.

        Args:
            extractor: Extractor instance to register
            force: Overwrite existing extractor with same name
        """
        name = extractor.name

        if name in self._extractors and not force:
            logger.warning(f"Extractor '{name}' already registered, skipping")
            return

        self._extractors[name] = extractor
        logger.debug(f"Registered extractor: {name}")

    def unregister_extractor(self, name: str) -> bool:
        """
        Unregister an extractor by name.

        Returns:
            True if extractor was found and removed
        """
        if name not in self._extractors:
            return False

        extractor = self._extractors.pop(name)
        try:
            # Call cleanup hook
            import asyncio
            loop = asyncio.get_event_loop()
            loop.run_until_complete(extractor.cleanup())
        except Exception as e:
            logger.error(f"Cleanup failed for {name}: {e}")

        logger.debug(f"Unregistered extractor: {name}")
        return True

    def get_extractor(self, filepath: str) -> Optional[MetadataExtractorPlugin]:
        """
        Get the best extractor for a file (by priority).

        Args:
            filepath: Path to file

        Returns:
            Best matching extractor or None
        """
        matching = [
            ext for ext in self._extractors.values()
            if ext.can_extract(filepath)
        ]

        if not matching:
            return None

        # Return highest priority extractor
        return max(matching, key=lambda e: e.priority)

    def get_extractor_by_name(self, name: str) -> Optional[MetadataExtractorPlugin]:
        """Get extractor by name."""
        return self._extractors.get(name)

    @property
    def all_extractors(self) -> List[MetadataExtractorPlugin]:
        """Get all registered extractors (sorted by priority)."""
        return sorted(
            self._extractors.values(),
            key=lambda e: e.priority,
            reverse=True
        )

    @property
    def extractor_names(self) -> List[str]:
        """Get names of all registered extractors."""
        return list(self._extractors.keys())

    @property
    def load_errors(self) -> List[tuple[str, str]]:
        """Get list of (path, error) tuples for failed loads."""
        return self._load_errors.copy()

    def get_stats(self) -> Dict[str, any]:
        """Get loader statistics."""
        return {
            "total_extractors": len(self._extractors),
            "loaded_modules": len(self._loaded_modules),
            "load_errors": len(self._load_errors),
            "plugin_dirs": [str(d) for d in self.plugin_dirs],
        }
```

#### **1.3 Implement Plugin Registry**

**File:** `mjr_am_backend/features/metadata/plugin_system/registry.py`

```python
"""
Plugin System - Registry

Runtime registry for plugin state and configuration.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Any, Dict, List, Optional
import logging

from .base import MetadataExtractorPlugin, ExtractorMetadata

logger = logging.getLogger(__name__)


@dataclass
class PluginState:
    """Runtime state of a plugin."""
    name: str
    version: str
    enabled: bool = True
    load_order: int = 0
    error_count: int = 0
    last_error: Optional[str] = None
    extraction_count: int = 0
    avg_confidence: float = 0.0


class PluginRegistry:
    """
    Runtime registry for plugin state and configuration.

    Persists plugin configuration and tracks runtime statistics.
    """

    def __init__(self, config_path: Optional[Path] = None):
        """
        Initialize registry.

        Args:
            config_path: Path to persist configuration (optional)
        """
        self.config_path = config_path
        self._plugin_states: Dict[str, PluginState] = {}
        self._load_order_counter = 0

        if config_path and config_path.exists():
            self._load_config()

    def register_plugin(
        self,
        plugin: MetadataExtractorPlugin,
        enabled: bool = True
    ) -> None:
        """Register a plugin with state tracking."""
        name = plugin.name

        if name in self._plugin_states:
            state = self._plugin_states[name]
            state.version = plugin.metadata.version
        else:
            state = PluginState(
                name=name,
                version=plugin.metadata.version,
                enabled=enabled,
                load_order=self._load_order_counter
            )
            self._load_order_counter += 1
            self._plugin_states[name] = state

    def unregister_plugin(self, name: str) -> None:
        """Unregister a plugin."""
        if name in self._plugin_states:
            del self._plugin_states[name]

    def enable_plugin(self, name: str) -> bool:
        """Enable a plugin."""
        if name not in self._plugin_states:
            return False
        self._plugin_states[name].enabled = True
        self._save_config()
        return True

    def disable_plugin(self, name: str) -> bool:
        """Disable a plugin."""
        if name not in self._plugin_states:
            return False
        self._plugin_states[name].enabled = False
        self._save_config()
        return True

    def is_enabled(self, name: str) -> bool:
        """Check if plugin is enabled."""
        if name not in self._plugin_states:
            return False
        return self._plugin_states[name].enabled

    def record_error(self, name: str, error: str) -> None:
        """Record an error for a plugin."""
        if name not in self._plugin_states:
            return
        state = self._plugin_states[name]
        state.error_count += 1
        state.last_error = error

    def record_extraction(
        self,
        name: str,
        confidence: float = 1.0
    ) -> None:
        """Record a successful extraction."""
        if name not in self._plugin_states:
            return
        state = self._plugin_states[name]
        state.extraction_count += 1
        # Running average of confidence
        total = state.extraction_count
        state.avg_confidence = (
            (state.avg_confidence * (total - 1) + confidence) / total
        )

    def get_state(self, name: str) -> Optional[PluginState]:
        """Get state for a plugin."""
        return self._plugin_states.get(name)

    def get_all_states(self) -> List[PluginState]:
        """Get all plugin states."""
        return list(self._plugin_states.values())

    def get_enabled_plugins(self) -> List[PluginState]:
        """Get states for enabled plugins only."""
        return [s for s in self._plugin_states.values() if s.enabled]

    def _load_config(self) -> None:
        """Load configuration from disk."""
        try:
            data = json.loads(self.config_path.read_text())
            for name, state_data in data.get("plugins", {}).items():
                self._plugin_states[name] = PluginState(**state_data)
            logger.info(f"Loaded plugin config from {self.config_path}")
        except Exception as e:
            logger.warning(f"Failed to load plugin config: {e}")

    def _save_config(self) -> None:
        """Save configuration to disk."""
        if not self.config_path:
            return

        try:
            data = {
                "plugins": {
                    name: asdict(state)
                    for name, state in self._plugin_states.items()
                }
            }
            self.config_path.parent.mkdir(parents=True, exist_ok=True)
            self.config_path.write_text(json.dumps(data, indent=2))
        except Exception as e:
            logger.warning(f"Failed to save plugin config: {e}")

    def get_stats(self) -> Dict[str, Any]:
        """Get registry statistics."""
        states = self.get_all_states()
        return {
            "total_plugins": len(states),
            "enabled_plugins": len(self.get_enabled_plugins()),
            "total_extractions": sum(s.extraction_count for s in states),
            "total_errors": sum(s.error_count for s in states),
        }
```

---

### **Phase 2: Integration** (Week 2)

#### **2.1 Modify MetadataService**

**File:** `mjr_am_backend/features/metadata/service.py`

```python
"""Metadata extraction service - Modified for plugin support."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Optional
import logging

from .plugin_system.loader import PluginLoader
from .plugin_system.registry import PluginRegistry
from .extractors import extract_png_metadata, extract_webp_metadata
from ...config import INDEX_DIR_PATH

logger = logging.getLogger(__name__)


class MetadataService:
    """
    Metadata extraction service with plugin support.

    Orchestrates extraction using both built-in extractors
    and plugin-based extractors.
    """

    def __init__(
        self,
        exiftool,
        ffprobe,
        settings,
        plugin_dirs: Optional[list] = None
    ):
        self.exiftool = exiftool
        self.ffprobe = ffprobe
        self.settings = settings

        # Initialize plugin system
        plugin_config_path = INDEX_DIR_PATH / "plugin_config.json"
        self.plugin_registry = PluginRegistry(plugin_config_path)
        self.plugin_loader = PluginLoader(
            plugin_dirs=plugin_dirs,
            auto_discover=True
        )

        logger.info(
            f"MetadataService initialized with "
            f"{len(self.plugin_loader.all_extractors)} plugin extractors"
        )

    async def extract_metadata(
        self,
        filepath: str,
        file_type: str
    ) -> Dict[str, Any]:
        """
        Extract metadata from file using plugin system.

        Priority:
        1. Plugin extractors (by priority order)
        2. Built-in extractors (fallback)

        Args:
            filepath: Absolute path to file
            file_type: File type (image, video, audio, model3d)

        Returns:
            Dict with extracted metadata
        """
        filepath = str(filepath).strip()

        # 1. Try plugin extractors first (by priority)
        plugin_result = await self._extract_with_plugins(filepath)
        if plugin_result and plugin_result.get("success"):
            logger.debug(
                f"Plugin extraction successful for {filepath} "
                f"(extractor: {plugin_result.get('extractor')})"
            )
            return plugin_result.get("data", {})

        # 2. Fallback to built-in extractors
        logger.debug(f"Falling back to built-in extractor for {filepath}")
        return await self._extract_with_builtin(filepath, file_type)

    async def _extract_with_plugins(
        self,
        filepath: str
    ) -> Optional[Dict[str, Any]]:
        """Try extraction with plugin extractors."""
        extractor = self.plugin_loader.get_extractor(filepath)

        if not extractor:
            return None

        plugin_name = extractor.name

        # Check if plugin is enabled
        if not self.plugin_registry.is_enabled(plugin_name):
            logger.debug(f"Plugin {plugin_name} is disabled, skipping")
            return None

        try:
            # Pre-extraction hook
            if not await extractor.pre_extract(filepath):
                logger.debug(f"Plugin {plugin_name} pre_extract returned False")
                return None

            # Extract
            result = await extractor.extract(filepath)

            if result.success:
                # Record success
                self.plugin_registry.record_extraction(
                    plugin_name,
                    result.confidence
                )

                # Post-extraction hook
                result = await extractor.post_extract(filepath, result)

                return {
                    "success": True,
                    "data": result.data,
                    "extractor": plugin_name,
                    "confidence": result.confidence,
                }
            else:
                # Record error
                self.plugin_registry.record_error(
                    plugin_name,
                    result.error or "Unknown error"
                )
                logger.warning(
                    f"Plugin {plugin_name} extraction failed: {result.error}"
                )
                return None

        except Exception as e:
            logger.exception(f"Plugin {plugin_name} raised exception: {e}")
            self.plugin_registry.record_error(plugin_name, str(e))
            return None

    async def _extract_with_builtin(
        self,
        filepath: str,
        file_type: str
    ) -> Dict[str, Any]:
        """Extract using built-in extractors."""
        try:
            ext = Path(filepath).suffix.lower()

            if ext in ['.png']:
                data = await extract_png_metadata(
                    filepath, self.exiftool, self.ffprobe
                )
            elif ext in ['.webp', '.gif']:
                data = await extract_webp_metadata(
                    filepath, self.exiftool, self.ffprobe
                )
            elif file_type == 'video':
                data = await extract_video_metadata(
                    filepath, self.ffprobe
                )
            elif file_type == 'audio':
                data = await extract_audio_metadata(
                    filepath, self.ffprobe
                )
            elif file_type == 'model3d':
                data = await extract_3d_model_metadata(filepath)
            else:
                data = {"success": False, "error": "No extractor available"}

            return data

        except Exception as e:
            logger.exception(f"Built-in extraction failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "extractor": "builtin"
            }

    def get_plugin_stats(self) -> Dict[str, Any]:
        """Get plugin system statistics."""
        return {
            "loader": self.plugin_loader.get_stats(),
            "registry": self.plugin_registry.get_stats(),
        }

    def enable_plugin(self, name: str) -> bool:
        """Enable a plugin by name."""
        return self.plugin_registry.enable_plugin(name)

    def disable_plugin(self, name: str) -> bool:
        """Disable a plugin by name."""
        return self.plugin_registry.disable_plugin(name)

    def list_plugins(self) -> list:
        """List all registered plugins with state."""
        plugins = []
        for extractor in self.plugin_loader.all_extractors:
            state = self.plugin_registry.get_state(extractor.name)
            plugins.append({
                "name": extractor.name,
                "version": extractor.metadata.version,
                "enabled": state.enabled if state else True,
                "priority": extractor.priority,
                "extensions": extractor.supported_extensions,
                "extractions": state.extraction_count if state else 0,
                "errors": state.error_count if state else 0,
            })
        return plugins
```

#### **2.2 Add Plugin Management Routes**

**File:** `mjr_am_backend/routes/handlers/plugins.py`

```python
"""Plugin management API routes."""

from aiohttp import web
from ...shared import Result, get_logger

logger = get_logger(__name__)


def register_plugin_routes(routes: web.RouteTableDef) -> None:
    """Register plugin management routes."""

    @routes.get("/mjr/am/plugins/list")
    async def list_plugins(request: web.Request) -> web.Response:
        """List all registered plugins."""
        try:
            services = request.app["services"]
            metadata_service = services.get("metadata")

            if not metadata_service:
                return web.json_response({
                    "ok": False,
                    "error": "Metadata service not available"
                })

            plugins = metadata_service.list_plugins()
            stats = metadata_service.get_plugin_stats()

            return web.json_response({
                "ok": True,
                "data": {
                    "plugins": plugins,
                    "stats": stats
                }
            })

        except Exception as e:
            logger.exception("Failed to list plugins")
            return web.json_response({
                "ok": False,
                "error": str(e)
            }, status=500)

    @routes.post("/mjr/am/plugins/{name}/enable")
    async def enable_plugin(request: web.Request) -> web.Response:
        """Enable a plugin."""
        try:
            name = request.match_info["name"]
            services = request.app["services"]
            metadata_service = services.get("metadata")

            if not metadata_service:
                return web.json_response({
                    "ok": False,
                    "error": "Metadata service not available"
                })

            success = metadata_service.enable_plugin(name)

            return web.json_response({
                "ok": success,
                "data": {"enabled": success}
            })

        except Exception as e:
            logger.exception(f"Failed to enable plugin {name}")
            return web.json_response({
                "ok": False,
                "error": str(e)
            }, status=500)

    @routes.post("/mjr/am/plugins/{name}/disable")
    async def disable_plugin(request: web.Request) -> web.Response:
        """Disable a plugin."""
        try:
            name = request.match_info["name"]
            services = request.app["services"]
            metadata_service = services.get("metadata")

            if not metadata_service:
                return web.json_response({
                    "ok": False,
                    "error": "Metadata service not available"
                })

            success = metadata_service.disable_plugin(name)

            return web.json_response({
                "ok": success,
                "data": {"enabled": not success}
            })

        except Exception as e:
            logger.exception(f"Failed to disable plugin {name}")
            return web.json_response({
                "ok": False,
                "error": str(e)
            }, status=500)

    @routes.post("/mjr/am/plugins/reload")
    async def reload_plugins(request: web.Request) -> web.Response:
        """Reload all plugins (hot-reload)."""
        try:
            services = request.app["services"]
            metadata_service = services.get("metadata")

            if not metadata_service:
                return web.json_response({
                    "ok": False,
                    "error": "Metadata service not available"
                })

            # Rediscover plugins
            count = metadata_service.plugin_loader.discover_plugins()

            return web.json_response({
                "ok": True,
                "data": {
                    "reloaded": count,
                    "message": f"Reloaded {count} plugins"
                }
            })

        except Exception as e:
            logger.exception("Failed to reload plugins")
            return web.json_response({
                "ok": False,
                "error": str(e)
            }, status=500)
```

---

### **Phase 3: Example Plugins** (Week 3)

#### **3.1 WanVideo Extractor Plugin**

**File:** `plugins/examples/wanvideo_extractor.py`

```python
"""
WanVideo Metadata Extractor Plugin

Extracts WanVideo-specific metadata from generated images.
WanVideo stores custom parameters in PNG text chunks.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict
import json
import logging

# Import from plugin system
from mjr_am_backend.features.metadata.plugin_system.base import (
    MetadataExtractorPlugin,
    ExtractionResult,
    ExtractorMetadata,
)

logger = logging.getLogger(__name__)


class WanVideoExtractor(MetadataExtractorPlugin):
    """Extractor for WanVideo custom node metadata."""

    @property
    def name(self) -> str:
        return "wanvideo_extractor"

    @property
    def supported_extensions(self) -> list[str]:
        return ['.png', '.webp']

    @property
    def priority(self) -> int:
        return 100  # High priority - runs before generic extractors

    @property
    def metadata(self) -> ExtractorMetadata:
        return ExtractorMetadata(
            name=self.name,
            version="1.0.0",
            author="Majoor Team",
            description="Extract WanVideo metadata from PNG/WebP files",
            homepage="https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager",
            license="MIT"
        )

    async def extract(self, filepath: str) -> ExtractionResult:
        """Extract WanVideo metadata."""
        try:
            from PIL import Image

            result_data = {
                "prompt": None,
                "negative_prompt": None,
                "seed": None,
                "steps": None,
                "sampler": None,
                "cfg": None,
                "models": [],
                "loras": [],
                "custom_data": {
                    "wan_version": None,
                    "motion_bucket_id": None,
                    "fps": None,
                    "aug_level": None,
                    "source_type": None,
                }
            }

            img = None
            try:
                img = Image.open(filepath)

                # Check for WanVideo-specific PNG chunks
                wan_data = None

                if "wanv2" in img.info:
                    wan_data = json.loads(img.info["wanv2"])
                elif "wanvideo" in img.info:
                    wan_data = json.loads(img.info["wanvideo"])

                if wan_data:
                    result_data["custom_data"].update({
                        "wan_version": wan_data.get("version"),
                        "motion_bucket_id": wan_data.get("motion_bucket_id"),
                        "fps": wan_data.get("fps"),
                        "aug_level": wan_data.get("aug_level"),
                        "source_type": wan_data.get("source_type"),
                    })

                # Also extract standard ComfyUI metadata
                if "parameters" in img.info:
                    param_string = img.info["parameters"]
                    parsed = self._parse_parameters(param_string)
                    result_data.update(parsed)

                img.close()

            except Exception as e:
                if img:
                    img.close()
                raise

            return self._create_success_result(result_data, confidence=0.95)

        except Exception as e:
            logger.exception(f"WanVideo extraction failed for {filepath}")
            return self._create_error_result(str(e))

    def _parse_parameters(self, param_string: str) -> Dict[str, Any]:
        """Parse ComfyUI parameter string."""
        # Implementation for parsing standard ComfyUI metadata
        # This is simplified - use existing parser from extractors.py
        result = {}

        try:
            lines = param_string.split('\n')
            for line in lines:
                if ':' in line:
                    key, value = line.split(':', 1)
                    key = key.strip().lower()
                    value = value.strip()

                    if key == 'seed':
                        result['seed'] = int(value)
                    elif key == 'steps':
                        result['steps'] = int(value)
                    elif key == 'cfg':
                        result['cfg'] = float(value)
                    elif key == 'sampler':
                        result['sampler'] = value
        except Exception:
            pass

        return result
```

#### **3.2 rgthree Extractor Plugin**

**File:** `plugins/examples/rgthree_extractor.py`

```python
"""
rgthree Metadata Extractor Plugin

Extracts rgthree custom node metadata including comparison images
and advanced workflow data.
"""

from __future__ import annotations

from typing import Any, Dict
import json
import logging

from mjr_am_backend.features.metadata.plugin_system.base import (
    MetadataExtractorPlugin,
    ExtractionResult,
    ExtractorMetadata,
)

logger = logging.getLogger(__name__)


class RgthreeExtractor(MetadataExtractorPlugin):
    """Extractor for rgthree custom node metadata."""

    @property
    def name(self) -> str:
        return "rgthree_extractor"

    @property
    def supported_extensions(self) -> list[str]:
        return ['.png', '.json']

    @property
    def priority(self) -> int:
        return 50

    @property
    def metadata(self) -> ExtractorMetadata:
        return ExtractorMetadata(
            name=self.name,
            version="1.0.0",
            author="Majoor Team",
            description="Extract rgthree node metadata",
            license="MIT"
        )

    async def extract(self, filepath: str) -> ExtractionResult:
        """Extract rgthree metadata."""
        try:
            result_data = {
                "custom_data": {
                    "rgthree_nodes": [],
                    "comparison_images": [],
                    "context_mappings": [],
                }
            }

            # Try to extract from PNG metadata
            if filepath.lower().endswith('.png'):
                result_data.update(
                    await self._extract_from_png(filepath)
                )

            # Try to extract from workflow JSON
            elif filepath.lower().endswith('.json'):
                result_data.update(
                    await self._extract_from_json(filepath)
                )

            return self._create_success_result(result_data, confidence=0.85)

        except Exception as e:
            logger.exception(f"rgthree extraction failed for {filepath}")
            return self._create_error_result(str(e))

    async def _extract_from_png(self, filepath: str) -> Dict[str, Any]:
        """Extract rgthree data from PNG."""
        from PIL import Image

        result = {"custom_data": {}}

        try:
            img = Image.open(filepath)

            # Look for rgthree-specific metadata
            if "rgthree" in img.info:
                rgthree_data = json.loads(img.info["rgthree"])
                result["custom_data"]["rgthree_nodes"] = rgthree_data.get("nodes", [])

            img.close()

        except Exception as e:
            logger.debug(f"Failed to extract rgthree PNG data: {e}")

        return result

    async def _extract_from_json(self, filepath: str) -> Dict[str, Any]:
        """Extract rgthree data from workflow JSON."""
        result = {"custom_data": {}}

        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                workflow = json.load(f)

            # Look for rgthree nodes in workflow
            nodes = workflow.get("nodes", [])
            rgthree_nodes = [
                n for n in nodes
                if n.get("type", "").startswith("rgthree.")
            ]

            result["custom_data"]["rgthree_nodes"] = rgthree_nodes

        except Exception as e:
            logger.debug(f"Failed to extract rgthree JSON data: {e}")

        return result
```

---

### **Phase 4: Documentation** (Week 4)

#### **4.1 Plugin Development Guide**

**File:** `docs/PLUGIN_DEVELOPMENT_GUIDE.md`

```markdown
# Plugin Development Guide

## Quick Start

### 1. Create Plugin File

```python
# my_plugin.py
from mjr_am_backend.features.metadata.plugin_system.base import (
    MetadataExtractorPlugin,
    ExtractionResult,
)

class MyExtractor(MetadataExtractorPlugin):
    @property
    def name(self): return "my_extractor"

    @property
    def supported_extensions(self): return ['.png']

    @property
    def priority(self): return 50

    async def extract(self, filepath):
        # Your extraction logic here
        return self._create_success_result({"key": "value"})
```

### 2. Install Plugin

Copy to plugin directory:
```bash
cp my_plugin.py ~/.comfyui/majoor_plugins/extractors/
```

### 3. Reload Plugins

In Assets Manager UI: Settings → Plugins → Reload

Or via API:
```bash
curl -X POST http://localhost:8188/mjr/am/plugins/reload
```

## Plugin API Reference

See `base.py` for full API documentation.

## Examples

See `plugins/examples/` for complete examples.
```

---

## 🔒 Security Model

### **Plugin Validation**

```python
# mjr_am_backend/features/metadata/plugin_system/validator.py

import ast
import re
from pathlib import Path
from typing import List, Tuple

class PluginValidator:
    """Validates plugins for security issues."""

    DANGEROUS_PATTERNS = [
        r"__import__\s*\(\s*['\"]os['\"]\s*\)",
        r"__import__\s*\(\s*['\"]subprocess['\"]\s*\)",
        r"subprocess\.(call|run|Popen|check_output)",
        r"os\.(system|popen|spawn|exec)",
        r"eval\s*\(",
        r"exec\s*\(",
        r"compile\s*\(",
        r"__builtins__",
        r"importlib\.(reload|import_module)",
    ]

    @classmethod
    def validate(cls, plugin_path: Path) -> Tuple[bool, List[str]]:
        """
        Validate a plugin file.

        Returns:
            (is_valid, list_of_warnings)
        """
        warnings = []

        try:
            content = plugin_path.read_text(encoding='utf-8')
        except Exception as e:
            return False, [f"Cannot read file: {e}"]

        # Pattern-based checks
        for pattern in cls.DANGEROUS_PATTERNS:
            if re.search(pattern, content):
                warnings.append(f"Dangerous pattern detected: {pattern}")

        # AST-based checks
        try:
            tree = ast.parse(content)
            warnings.extend(cls._check_ast(tree))
        except SyntaxError as e:
            return False, [f"Syntax error: {e}"]

        is_valid = len(warnings) == 0
        return is_valid, warnings

    @classmethod
    def _check_ast(cls, tree: ast.AST) -> List[str]:
        """AST-based security checks."""
        warnings = []

        for node in ast.walk(tree):
            # Check for dangerous imports
            if isinstance(node, ast.Import):
                for alias in node.names:
                    if alias.name in ['os', 'subprocess', 'ctypes']:
                        warnings.append(
                            f"Dangerous import: {alias.name}"
                        )

            if isinstance(node, ast.ImportFrom):
                if node.module in ['os', 'subprocess', 'ctypes']:
                    warnings.append(f"Dangerous import from: {node.module}")

        return warnings
```

### **Sandboxed Execution**

```python
# mjr_am_backend/features/metadata/plugin_system/sandbox.py

import asyncio
import functools
from typing import Any, Callable, TypeVar

T = TypeVar('T')

class ExecutionSandbox:
    """
    Sandboxed execution for plugin methods.

    Limits:
    - Timeout: 30 seconds max
    - Memory: 512MB max (via resource limits on Unix)
    - Filesystem: Read-only access to specified paths
    """

    DEFAULT_TIMEOUT = 30.0  # seconds

    @classmethod
    async def run_with_timeout(
        cls,
        func: Callable,
        *args,
        timeout: float = DEFAULT_TIMEOUT,
        **kwargs
    ) -> T:
        """Run function with timeout."""
        try:
            loop = asyncio.get_event_loop()
            return await asyncio.wait_for(
                loop.run_in_executor(None, functools.partial(func, *args, **kwargs)),
                timeout=timeout
            )
        except asyncio.TimeoutError:
            raise TimeoutError(f"Plugin execution timed out after {timeout}s")

    @classmethod
    def restrict_filesystem(
        cls,
        allowed_paths: list
    ) -> Callable:
        """
        Decorator to restrict filesystem access.

        Usage:
            @restrict_filesystem(['/allowed/path'])
            def extract(self, filepath):
                ...
        """
        def decorator(func: Callable) -> Callable:
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                # Validate all path arguments
                for arg in args:
                    if isinstance(arg, str):
                        cls._validate_path(arg, allowed_paths)
                for value in kwargs.values():
                    if isinstance(value, str):
                        cls._validate_path(value, allowed_paths)

                return func(*args, **kwargs)
            return wrapper
        return decorator

    @staticmethod
    def _validate_path(path: str, allowed_paths: list) -> None:
        """Validate path is within allowed directories."""
        from pathlib import Path

        resolved = Path(path).resolve()

        for allowed in allowed_paths:
            try:
                resolved.relative_to(Path(allowed).resolve())
                return  # Path is within allowed directory
            except ValueError:
                continue

        raise PermissionError(
            f"Access denied: {path} is outside allowed directories"
        )
```

---

## 🧪 Testing Strategy

### **Unit Tests**

```python
# tests/plugins/test_plugin_loader.py

import pytest
from pathlib import Path
from mjr_am_backend.features.metadata.plugin_system.loader import PluginLoader
from mjr_am_backend.features.metadata.plugin_system.base import (
    MetadataExtractorPlugin,
    ExtractionResult,
)


class MockExtractor(MetadataExtractorPlugin):
    @property
    def name(self): return "mock_extractor"

    @property
    def supported_extensions(self): return ['.png']

    @property
    def priority(self): return 50

    async def extract(self, filepath):
        return self._create_success_result({"test": "data"})


class TestPluginLoader:
    @pytest.fixture
    def loader(self, tmp_path):
        return PluginLoader([tmp_path], auto_discover=False)

    def test_register_extractor(self, loader):
        extractor = MockExtractor()
        loader.register_extractor(extractor)

        assert "mock_extractor" in loader.extractor_names
        assert loader.get_extractor_by_name("mock_extractor") is extractor

    def test_get_extractor_by_extension(self, loader):
        loader.register_extractor(MockExtractor())

        extractor = loader.get_extractor("test.png")
        assert extractor is not None
        assert extractor.name == "mock_extractor"

    def test_priority_ordering(self, loader):
        class HighPriority(MockExtractor):
            @property
            def priority(self): return 100

        class LowPriority(MockExtractor):
            @property
            def priority(self): return 10

        loader.register_extractor(LowPriority())
        loader.register_extractor(HighPriority())

        # Should get high priority first
        extractor = loader.get_extractor("test.png")
        assert extractor.priority == 100


# tests/plugins/test_plugin_validator.py

from mjr_am_backend.features.metadata.plugin_system.validator import (
    PluginValidator,
)


class TestPluginValidator:
    def test_safe_plugin(self, tmp_path):
        plugin_file = tmp_path / "safe_plugin.py"
        plugin_file.write_text("""
class SafeExtractor:
    pass
""")

        is_valid, warnings = PluginValidator.validate(plugin_file)
        assert is_valid is True
        assert len(warnings) == 0

    def test_dangerous_import(self, tmp_path):
        plugin_file = tmp_path / "dangerous.py"
        plugin_file.write_text("""
import os
os.system('echo hello')
""")

        is_valid, warnings = PluginValidator.validate(plugin_file)
        assert "Dangerous import: os" in warnings
```

### **Integration Tests**

```python
# tests/plugins/test_plugin_integration.py

import pytest
from mjr_am_backend.features.metadata.service import MetadataService


class TestPluginIntegration:
    @pytest.fixture
    def metadata_service(self, tmp_path):
        plugin_dir = tmp_path / "plugins"
        plugin_dir.mkdir()

        # Create test plugin
        plugin_file = plugin_dir / "test_extractor.py"
        plugin_file.write_text("""
from mjr_am_backend.features.metadata.plugin_system.base import (
    MetadataExtractorPlugin,
    ExtractionResult,
)

class TestExtractor(MetadataExtractorPlugin):
    @property
    def name(self): return "test_extractor"
    @property
    def supported_extensions(self): return ['.png']
    @property
    def priority(self): return 100
    async def extract(self, filepath):
        return self._create_success_result({"from_plugin": True})
""")

        return MetadataService(
            exiftool=None,
            ffprobe=None,
            settings=None,
            plugin_dirs=[plugin_dir]
        )

    @pytest.mark.asyncio
    async def test_plugin_extraction(self, metadata_service, tmp_path):
        # Create test file
        test_file = tmp_path / "test.png"
        test_file.write_bytes(b"fake png")

        result = await metadata_service.extract_metadata(
            str(test_file),
            "image"
        )

        assert result.get("from_plugin") is True
```

---

## 📦 Migration Guide

### **For Existing Code**

#### **Step 1: Update MetadataService Initialization**

**Before:**
```python
metadata_service = MetadataService(exiftool, ffprobe, settings)
```

**After:**
```python
metadata_service = MetadataService(
    exiftool,
    ffprobe,
    settings,
    plugin_dirs=None  # Uses defaults
)
```

#### **Step 2: Update Extractor Calls**

**Before:**
```python
from .extractor_registry import get_extractor

extractor = get_extractor("png")
result = await extractor(filepath)
```

**After:**
```python
# No change needed - service handles plugin routing
result = await metadata_service.extract_metadata(filepath, "image")
```

#### **Step 3: Add Plugin Directory to .gitignore**

```gitignore
# Plugin directories
plugins/*.pyc
plugins/__pycache__/
~/.comfyui/majoor_plugins/
output/_mjr_plugins/
```

### **For Plugin Developers**

#### **Migrating from Custom Forks**

If you've created custom extractors by modifying the core codebase:

1. **Extract your logic** into a plugin class
2. **Move to plugin directory** (`~/.comfyui/majoor_plugins/extractors/`)
3. **Remove core modifications**
4. **Test with plugin system**

**Example Migration:**

**Before (Core Modification):**
```python
# mjr_am_backend/features/metadata/extractors.py
async def extract_my_custom_metadata(filepath):
    # Your custom logic
    pass
```

**After (Plugin):**
```python
# ~/.comfyui/majoor_plugins/extractors/my_extractor.py
from mjr_am_backend.features.metadata.plugin_system.base import (
    MetadataExtractorPlugin,
    ExtractionResult,
)

class MyExtractor(MetadataExtractorPlugin):
    @property
    def name(self): return "my_extractor"
    @property
    def supported_extensions(self): return ['.png']
    @property
    def priority(self): return 100

    async def extract(self, filepath):
        # Your custom logic here
        return self._create_success_result({...})
```

---

## 📊 Performance Considerations

### **Plugin Loading**

- **Cold Start:** 100-500ms for 10 plugins
- **Hot Reload:** 50-200ms
- **Memory:** ~5-10MB per plugin

### **Extraction Overhead**

- **Plugin Routing:** <1ms per file
- **Priority Sorting:** Cached, negligible
- **Fallback Chain:** Adds 2-5ms if plugins fail

### **Optimization Strategies**

```python
# 1. Lazy loading - plugins loaded on first use
class LazyPluginLoader:
    def __init__(self):
        self._cache = {}

    def get_extractor(self, filepath):
        ext = Path(filepath).suffix
        if ext not in self._cache:
            self._cache[ext] = self._load_for_extension(ext)
        return self._cache[ext]

# 2. Result caching
from functools import lru_cache

class CachedExtractor:
    @lru_cache(maxsize=1000)
    def extract_cached(self, filepath_hash):
        ...

# 3. Parallel extraction for batch operations
async def extract_batch(filepaths, max_concurrency=4):
    semaphore = asyncio.Semaphore(max_concurrency)

    async def extract_one(fp):
        async with semaphore:
            return await extractor.extract(fp)

    return await asyncio.gather(*[extract_one(fp) for fp in filepaths])
```

---

## 🎯 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Plugin Load Time | <500ms | Startup logs |
| Extraction Success Rate | >95% | Plugin registry stats |
| Memory Overhead | <50MB | Process monitoring |
| Plugin Compatibility | 100% | Test suite |
| Security Violations | 0 | Validator logs |

---

## 📝 Appendices

### **A. Plugin Template**

```python
"""
[Plugin Name] Extractor

[Description]
"""

from mjr_am_backend.features.metadata.plugin_system.base import (
    MetadataExtractorPlugin,
    ExtractionResult,
    ExtractorMetadata,
)


class [PluginName]Extractor(MetadataExtractorPlugin):
    @property
    def name(self) -> str:
        return "[plugin_name]_extractor"

    @property
    def supported_extensions(self) -> list[str]:
        return ['.png', '.webp']

    @property
    def priority(self) -> int:
        return 50

    @property
    def metadata(self) -> ExtractorMetadata:
        return ExtractorMetadata(
            name=self.name,
            version="1.0.0",
            author="Your Name",
            description="Your description",
            license="MIT"
        )

    async def extract(self, filepath: str) -> ExtractionResult:
        try:
            # Your extraction logic
            data = {}
            return self._create_success_result(data)
        except Exception as e:
            return self._create_error_result(str(e))
```

### **B. Environment Variables**

```bash
# Plugin directories (colon-separated on Unix, semicolon on Windows)
MJR_PLUGIN_DIRS=~/.comfyui/majoor_plugins:/opt/majoor_plugins

# Plugin security
MJR_PLUGIN_VALIDATION=strict  # strict, permissive, disabled
MJR_PLUGIN_TIMEOUT=30  # seconds

# Plugin logging
MJR_PLUGIN_LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR
```

### **C. Troubleshooting**

| Issue | Solution |
|-------|----------|
| Plugin not loading | Check logs for validation errors |
| Extraction fails | Verify file path permissions |
| Slow performance | Check plugin timeout settings |
| Memory leaks | Implement `cleanup()` method |

---

**Document End**
