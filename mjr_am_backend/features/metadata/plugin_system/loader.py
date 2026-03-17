"""
Plugin System - Loader

Discovers, validates, and loads plugins from configured directories.
"""

from __future__ import annotations

import importlib
import importlib.util
import sys
from pathlib import Path
from typing import Dict, List, Optional, Set, Type, Any
import logging

from .base import MetadataExtractorPlugin, ExtractorMetadata
from .validator import PluginValidator

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
        auto_discover: bool = True,
        validation_mode: str = "strict"  # "strict", "permissive", "disabled"
    ):
        """
        Initialize plugin loader.

        Args:
            plugin_dirs: Directories to scan for plugins
            auto_discover: Automatically discover on init
            validation_mode: Security validation level
        """
        self.plugin_dirs = plugin_dirs or self._default_plugin_dirs()
        self.validation_mode = validation_mode
        self._extractors: Dict[str, MetadataExtractorPlugin] = {}
        self._loaded_modules: Set[str] = set()
        self._load_errors: List[tuple[str, str]] = []
        self._plugin_info: Dict[str, Dict[str, Any]] = {}

        if auto_discover:
            self.discover_plugins()

    def _default_plugin_dirs(self) -> List[Path]:
        """Get default plugin directories."""
        try:
            from ...config import OUTPUT_ROOT_PATH
            output_root = OUTPUT_ROOT_PATH
        except Exception:
            import os
            output_root = Path(os.getcwd()) / "output"

        return [
            # Bundled plugins
            Path(__file__).parent.parent.parent.parent / "plugins",
            # User plugins (global)
            Path.home() / ".comfyui" / "majoor_plugins" / "extractors",
            # User plugins (local to ComfyUI)
            output_root / "_mjr_plugins" / "extractors",
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
                if count > 0:
                    logger.info(f"Loaded {count} plugins from {plugin_dir}")
            except Exception as e:
                logger.error(f"Failed to scan {plugin_dir}: {e}")
                self._load_errors.append((str(plugin_dir), str(e)))

        if loaded_count > 0:
            logger.info(f"Total plugins loaded: {loaded_count}")
        return loaded_count

    def _scan_directory(self, directory: Path) -> int:
        """Scan a single directory for plugins."""
        count = 0

        # Validate that the directory is not a symlink pointing outside
        # the expected location (prevents loading arbitrary code).
        try:
            resolved_dir = directory.resolve(strict=True)
            if resolved_dir != directory.resolve() and directory.is_symlink():
                logger.warning(
                    f"Skipping symlinked plugin directory: {directory}"
                )
                return 0
        except (OSError, RuntimeError, ValueError):
            return 0

        # Scan .py files
        for module_file in resolved_dir.glob("*.py"):
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
        # Validate plugin before loading
        if self.validation_mode != "disabled":
            is_valid, warnings, info = PluginValidator.validate(module_file)

            if not is_valid:
                raise PluginLoadError(
                    f"Plugin validation failed: {'; '.join(warnings)}"
                )

            if warnings and self.validation_mode == "strict":
                logger.warning(
                    f"Plugin {module_file.name} has warnings: {warnings}"
                )

        module_name = module_file.stem
        full_name = (
            f"majoor_plugins.{package_name}.{module_name}"
            if package_name
            else f"majoor_plugins.{module_name}"
        )

        # Skip already loaded modules
        if full_name in self._loaded_modules:
            logger.debug(f"Module {full_name} already loaded, skipping")
            return

        # Load module
        spec = importlib.util.spec_from_file_location(full_name, module_file)
        if spec is None or spec.loader is None:
            raise PluginLoadError(f"Cannot load spec for {module_file}")

        module = importlib.util.module_from_spec(spec)
        sys.modules[full_name] = module
        try:
            spec.loader.exec_module(module)
        except Exception:
            # Remove broken module from sys.modules to avoid stale imports.
            sys.modules.pop(full_name, None)
            raise

        self._loaded_modules.add(full_name)

        # Find and instantiate all extractor classes
        found_count = 0
        for attr_name in dir(module):
            attr = getattr(module, attr_name)
            if self._is_valid_extractor_class(attr):
                try:
                    extractor = attr()
                    self.register_extractor(extractor)
                    self._plugin_info[extractor.name] = {
                        "module": str(module_file),
                        "version": extractor.metadata.version,
                        "author": extractor.metadata.author,
                        "priority": extractor.priority,
                        "extensions": extractor.supported_extensions,
                    }
                    found_count += 1
                except Exception as e:
                    logger.error(f"Failed to instantiate {attr_name}: {e}")
                    self._load_errors.append(
                        (f"{module_file}:{attr_name}", str(e))
                    )

        if found_count == 0:
            logger.debug(f"No extractor classes found in {module_file}")

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
            logger.warning(
                f"Extractor '{name}' already registered, skipping. "
                f"Use force=True to overwrite."
            )
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
            # Call cleanup hook.  We intentionally call the synchronous
            # fallback when no running loop is available.  When the loop IS
            # running (the common case during hot-reload) we schedule the
            # cleanup as a proper awaited task via ensure_future so it
            # actually completes before dereferencing the extractor.
            import asyncio
            try:
                loop = asyncio.get_running_loop()
                # Schedule and let it complete within the current event loop.
                asyncio.ensure_future(extractor.cleanup(), loop=loop)
            except RuntimeError:
                # No running loop — run synchronously in a throwaway loop.
                try:
                    asyncio.run(extractor.cleanup())
                except Exception as inner:
                    logger.debug(f"Sync cleanup fallback failed for {name}: {inner}")
        except Exception as e:
            logger.error(f"Cleanup failed for {name}: {e}")

        if name in self._plugin_info:
            del self._plugin_info[name]

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

    def get_extractor_by_name(
        self,
        name: str
    ) -> Optional[MetadataExtractorPlugin]:
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

    @property
    def plugin_info(self) -> Dict[str, Dict[str, Any]]:
        """Get information about loaded plugins."""
        return self._plugin_info.copy()

    def get_stats(self) -> Dict[str, Any]:
        """Get loader statistics."""
        return {
            "total_extractors": len(self._extractors),
            "loaded_modules": len(self._loaded_modules),
            "load_errors": len(self._load_errors),
            "plugin_dirs": [str(d) for d in self.plugin_dirs],
            "validation_mode": self.validation_mode,
            "plugin_info": self._plugin_info,
        }

    def reload(self) -> int:
        """
        Reload all plugins (clear cache and rediscover).

        Returns:
            Number of plugins loaded
        """
        # Unregister all extractors
        for name in list(self._extractors.keys()):
            self.unregister_extractor(name)

        # Remove previously loaded modules from sys.modules so reimport
        # picks up changes on disk and avoids stale module references.
        for mod_name in self._loaded_modules:
            sys.modules.pop(mod_name, None)

        self._loaded_modules.clear()
        self._load_errors.clear()
        self._plugin_info.clear()

        # Rediscover
        return self.discover_plugins()
