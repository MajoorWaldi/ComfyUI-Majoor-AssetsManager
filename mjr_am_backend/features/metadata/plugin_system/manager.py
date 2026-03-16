"""
Plugin System - Manager

High-level plugin management with lifecycle control.
"""

from __future__ import annotations

import asyncio
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Callable
import logging

from .base import MetadataExtractorPlugin, ExtractionResult
from .loader import PluginLoader
from .registry import PluginRegistry, PluginState

logger = logging.getLogger(__name__)


class PluginManager:
    """
    High-level plugin manager with lifecycle control.

    Provides:
    - Plugin discovery and loading
    - State persistence
    - Extraction with statistics tracking
    - Hot-reload support
    - Event hooks

    Usage:
        manager = PluginManager()
        await manager.initialize()

        # Extract metadata
        result = await manager.extract("image.png")

        # List plugins
        plugins = manager.list_plugins()

        # Reload plugins
        await manager.reload()
    """

    def __init__(
        self,
        plugin_dirs: Optional[List[Path]] = None,
        config_path: Optional[Path] = None,
        validation_mode: str = "strict"
    ):
        """
        Initialize plugin manager.

        Args:
            plugin_dirs: Directories to scan for plugins
            config_path: Path to persist configuration
            validation_mode: Security validation level
        """
        self.plugin_dirs = plugin_dirs
        self.config_path = config_path
        self.validation_mode = validation_mode

        self._loader: Optional[PluginLoader] = None
        self._registry: Optional[PluginRegistry] = None
        self._initialized = False

        # Event hooks
        self._on_extract_hooks: List[Callable] = []
        self._on_error_hooks: List[Callable] = []

    async def initialize(self) -> int:
        """
        Initialize plugin system.

        Returns:
            Number of plugins loaded
        """
        if self._initialized:
            logger.debug("PluginManager already initialized")
            return len(self._loader.all_extractors) if self._loader else 0

        logger.info("Initializing plugin system...")

        # Initialize registry
        self._registry = PluginRegistry(self.config_path)

        # Initialize loader
        self._loader = PluginLoader(
            plugin_dirs=self.plugin_dirs,
            auto_discover=True,
            validation_mode=self.validation_mode
        )

        # Register all loaded extractors in registry
        for extractor in self._loader.all_extractors:
            enabled = self._registry.is_enabled(extractor.name)
            self._registry.register_plugin(extractor, enabled=enabled)

        self._initialized = True

        stats = self.get_stats()
        logger.info(
            f"Plugin system initialized: "
            f"{stats['loader']['total_extractors']} extractors, "
            f"{stats['registry']['enabled_plugins']} enabled"
        )

        return stats['loader']['total_extractors']

    async def extract(
        self,
        filepath: str,
        fallback_extractor: Optional[Callable] = None
    ) -> ExtractionResult:
        """
        Extract metadata using plugin system.

        Args:
            filepath: Path to file
            fallback_extractor: Optional fallback if no plugin matches

        Returns:
            ExtractionResult
        """
        if not self._initialized:
            await self.initialize()

        if not self._loader or not self._registry:
            return ExtractionResult(
                success=False,
                error="Plugin system not initialized"
            )

        # Get best extractor for file
        extractor = self._loader.get_extractor(filepath)

        if not extractor:
            if fallback_extractor:
                logger.debug(f"No plugin for {filepath}, using fallback")
                return await fallback_extractor(filepath)
            return ExtractionResult(
                success=False,
                error="No suitable extractor found"
            )

        # Check if plugin is enabled
        if not self._registry.is_enabled(extractor.name):
            logger.debug(f"Plugin {extractor.name} is disabled")
            if fallback_extractor:
                return await fallback_extractor(filepath)
            return ExtractionResult(
                success=False,
                error=f"Plugin {extractor.name} is disabled"
            )

        # Pre-extraction hook
        try:
            if not await extractor.pre_extract(filepath):
                logger.debug(f"Plugin {extractor.name} pre_extract returned False")
                if fallback_extractor:
                    return await fallback_extractor(filepath)
                return ExtractionResult(
                    success=False,
                    error="Pre-extraction check failed"
                )
        except Exception as e:
            logger.warning(f"Plugin {extractor.name} pre_extract failed: {e}")
            self._registry.record_error(extractor.name, str(e))
            if fallback_extractor:
                return await fallback_extractor(filepath)
            return self._error_result(extractor.name, str(e))

        # Extract with timing
        start_time = time.perf_counter()
        try:
            result = await extractor.extract(filepath)

            extraction_time_ms = (time.perf_counter() - start_time) * 1000

            if result.success:
                # Record success
                self._registry.record_extraction(
                    extractor.name,
                    result.confidence,
                    extraction_time_ms
                )

                # Post-extraction hook
                try:
                    result = await extractor.post_extract(filepath, result)
                except Exception as e:
                    logger.warning(
                        f"Plugin {extractor.name} post_extract failed: {e}"
                    )

                # Fire success hooks
                await self._fire_extract_hooks(filepath, result)

                return result
            else:
                # Record error
                self._registry.record_error(
                    extractor.name,
                    result.error or "Unknown error"
                )
                logger.warning(
                    f"Plugin {extractor.name} extraction failed: {result.error}"
                )

                # Fire error hooks
                await self._fire_error_hooks(filepath, extractor.name, result.error)

                if fallback_extractor:
                    return await fallback_extractor(filepath)
                return result

        except Exception as e:
            extraction_time_ms = (time.perf_counter() - start_time) * 1000
            logger.exception(f"Plugin {extractor.name} raised exception: {e}")
            self._registry.record_error(extractor.name, str(e))
            self._registry.record_extraction(
                extractor.name,
                confidence=0.0,
                extraction_time_ms=extraction_time_ms
            )

            # Fire error hooks
            await self._fire_error_hooks(filepath, extractor.name, str(e))

            if fallback_extractor:
                return await fallback_extractor(filepath)
            return self._error_result(extractor.name, str(e))

    def _error_result(
        self,
        extractor_name: str,
        error: str
    ) -> ExtractionResult:
        """Create error result."""
        return ExtractionResult(
            success=False,
            error=error,
            extractor_name=extractor_name
        )

    # ─── Plugin Management ─────────────────────────────────────────────

    def list_plugins(self) -> List[Dict[str, Any]]:
        """List all registered plugins with state."""
        if not self._loader or not self._registry:
            return []

        plugins = []
        for extractor in self._loader.all_extractors:
            state = self._registry.get_state(extractor.name)
            plugins.append({
                "name": extractor.name,
                "version": extractor.metadata.version,
                "author": extractor.metadata.author,
                "description": extractor.metadata.description,
                "enabled": state.enabled if state else True,
                "priority": extractor.priority,
                "extensions": extractor.supported_extensions,
                "extractions": state.extraction_count if state else 0,
                "errors": state.error_count if state else 0,
                "avg_confidence": state.avg_confidence if state else 0.0,
                "avg_extraction_time_ms": (
                    state.avg_extraction_time_ms if state else 0.0
                ),
                "last_error": state.last_error if state else None,
            })
        return plugins

    def enable_plugin(self, name: str) -> bool:
        """Enable a plugin by name."""
        if not self._registry:
            return False
        return self._registry.enable_plugin(name)

    def disable_plugin(self, name: str) -> bool:
        """Disable a plugin by name."""
        if not self._registry:
            return False
        return self._registry.disable_plugin(name)

    async def reload(self) -> int:
        """
        Reload all plugins (hot-reload).

        Returns:
            Number of plugins loaded
        """
        if not self._loader:
            logger.warning("Cannot reload: loader not initialized")
            return 0

        logger.info("Reloading plugins...")
        count = self._loader.reload()

        # Re-register in registry
        for extractor in self._loader.all_extractors:
            self._registry.register_plugin(extractor)

        logger.info(f"Reloaded {count} plugins")
        return count

    def get_plugin_info(self, name: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a plugin."""
        if not self._loader:
            return None

        info = self._loader.plugin_info.get(name)
        if not info:
            return None

        state = self._registry.get_state(name) if self._registry else None

        return {
            **info,
            "enabled": state.enabled if state else True,
            "extractions": state.extraction_count if state else 0,
            "errors": state.error_count if state else 0,
        }

    def get_stats(self) -> Dict[str, Any]:
        """Get plugin system statistics."""
        return {
            "initialized": self._initialized,
            "loader": self._loader.get_stats() if self._loader else {},
            "registry": self._registry.get_stats() if self._registry else {},
        }

    # ─── Event Hooks ───────────────────────────────────────────────────

    def on_extract(self, callback: Callable) -> None:
        """
        Register hook for successful extractions.

        Callback signature: callback(filepath: str, result: ExtractionResult)
        """
        self._on_extract_hooks.append(callback)

    def on_error(self, callback: Callable) -> None:
        """
        Register hook for extraction errors.

        Callback signature: callback(filepath: str, plugin: str, error: str)
        """
        self._on_error_hooks.append(callback)

    async def _fire_extract_hooks(
        self,
        filepath: str,
        result: ExtractionResult
    ) -> None:
        """Fire success hooks."""
        for hook in self._on_extract_hooks:
            try:
                if asyncio.iscoroutinefunction(hook):
                    await hook(filepath, result)
                else:
                    hook(filepath, result)
            except Exception as e:
                logger.warning(f"Extract hook failed: {e}")

    async def _fire_error_hooks(
        self,
        filepath: str,
        plugin_name: str,
        error: str
    ) -> None:
        """Fire error hooks."""
        for hook in self._on_error_hooks:
            try:
                if asyncio.iscoroutinefunction(hook):
                    await hook(filepath, plugin_name, error)
                else:
                    hook(filepath, plugin_name, error)
            except Exception as e:
                logger.warning(f"Error hook failed: {e}")

    # ─── Cleanup ───────────────────────────────────────────────────────

    async def shutdown(self) -> None:
        """
        Shutdown plugin system gracefully.

        Calls cleanup() on all loaded plugins.
        """
        if not self._loader:
            return

        logger.info("Shutting down plugin system...")

        for extractor in self._loader.all_extractors:
            try:
                await extractor.cleanup()
            except Exception as e:
                logger.warning(f"Cleanup failed for {extractor.name}: {e}")

        self._initialized = False
        logger.info("Plugin system shutdown complete")
