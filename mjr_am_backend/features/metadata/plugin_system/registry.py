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
    total_extraction_time_ms: float = 0.0

    @property
    def avg_extraction_time_ms(self) -> float:
        """Average extraction time in milliseconds."""
        if self.extraction_count == 0:
            return 0.0
        return self.total_extraction_time_ms / self.extraction_count


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

        logger.debug(f"Registered plugin {name} in registry")

    def unregister_plugin(self, name: str) -> None:
        """Unregister a plugin."""
        if name in self._plugin_states:
            del self._plugin_states[name]
            logger.debug(f"Unregistered plugin {name} from registry")

    def enable_plugin(self, name: str) -> bool:
        """Enable a plugin."""
        if name not in self._plugin_states:
            logger.warning(f"Cannot enable unknown plugin: {name}")
            return False
        self._plugin_states[name].enabled = True
        self._save_config()
        logger.info(f"Enabled plugin: {name}")
        return True

    def disable_plugin(self, name: str) -> bool:
        """Disable a plugin."""
        if name not in self._plugin_states:
            logger.warning(f"Cannot disable unknown plugin: {name}")
            return False
        self._plugin_states[name].enabled = False
        self._save_config()
        logger.info(f"Disabled plugin: {name}")
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
        logger.debug(f"Recorded error for plugin {name}: {error}")

    def record_extraction(
        self,
        name: str,
        confidence: float = 1.0,
        extraction_time_ms: float = 0.0
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
        state.total_extraction_time_ms += extraction_time_ms

    def get_state(self, name: str) -> Optional[PluginState]:
        """Get state for a plugin."""
        return self._plugin_states.get(name)

    def get_all_states(self) -> List[PluginState]:
        """Get all plugin states."""
        return list(self._plugin_states.values())

    def get_enabled_plugins(self) -> List[PluginState]:
        """Get states for enabled plugins only."""
        return [s for s in self._plugin_states.values() if s.enabled]

    def get_disabled_plugins(self) -> List[PluginState]:
        """Get states for disabled plugins only."""
        return [s for s in self._plugin_states.values() if not s.enabled]

    def _load_config(self) -> None:
        """Load configuration from disk."""
        try:
            if not self.config_path:
                return
            data = json.loads(self.config_path.read_text(encoding='utf-8'))
            for name, state_data in data.get("plugins", {}).items():
                # Handle missing fields gracefully
                state_data.setdefault('enabled', True)
                state_data.setdefault('load_order', 0)
                state_data.setdefault('error_count', 0)
                state_data.setdefault('extraction_count', 0)
                state_data.setdefault('avg_confidence', 0.0)
                state_data.setdefault('total_extraction_time_ms', 0.0)
                self._plugin_states[name] = PluginState(**state_data)
            logger.info(
                f"Loaded plugin config from {self.config_path} "
                f"({len(self._plugin_states)} plugins)"
            )
        except Exception as e:
            logger.warning(f"Failed to load plugin config: {e}")

    def _save_config(self) -> bool:
        """Save configuration to disk.

        Returns:
            True if config was persisted successfully.
        """
        if not self.config_path:
            return False

        try:
            data = {
                "plugins": {
                    name: asdict(state)
                    for name, state in self._plugin_states.items()
                },
                "metadata": {
                    "version": "1.0",
                }
            }
            self.config_path.parent.mkdir(parents=True, exist_ok=True)
            self.config_path.write_text(json.dumps(data, indent=2))
            logger.debug(f"Saved plugin config to {self.config_path}")
            return True
        except Exception as e:
            logger.warning(f"Failed to save plugin config: {e}")
            return False

    def get_stats(self) -> Dict[str, Any]:
        """Get registry statistics."""
        states = self.get_all_states()
        enabled_states = self.get_enabled_plugins()
        disabled_states = self.get_disabled_plugins()

        return {
            "total_plugins": len(states),
            "enabled_plugins": len(enabled_states),
            "disabled_plugins": len(disabled_states),
            "total_extractions": sum(s.extraction_count for s in states),
            "total_errors": sum(s.error_count for s in states),
            "avg_confidence": (
                sum(s.avg_confidence for s in states) / len(states)
                if states else 0.0
            ),
            "plugins_with_errors": len(
                [s for s in states if s.error_count > 0]
            ),
        }

    def reset_stats(self, name: Optional[str] = None) -> None:
        """
        Reset statistics for a plugin or all plugins.

        Args:
            name: Plugin name (None for all plugins)
        """
        if name:
            if name in self._plugin_states:
                state = self._plugin_states[name]
                state.extraction_count = 0
                state.error_count = 0
                state.avg_confidence = 0.0
                state.total_extraction_time_ms = 0.0
                state.last_error = None
        else:
            for state in self._plugin_states.values():
                state.extraction_count = 0
                state.error_count = 0
                state.avg_confidence = 0.0
                state.total_extraction_time_ms = 0.0
                state.last_error = None

        self._save_config()

    def export_config(self, output_path: Path) -> bool:
        """
        Export plugin configuration to a file.

        Args:
            output_path: Path to export to

        Returns:
            True if successful
        """
        try:
            data = {
                "plugins": {
                    name: asdict(state)
                    for name, state in self._plugin_states.items()
                }
            }
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text(json.dumps(data, indent=2))
            logger.info(f"Exported plugin config to {output_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to export plugin config: {e}")
            return False

    def import_config(self, input_path: Path, merge: bool = False) -> bool:
        """
        Import plugin configuration from a file.

        Args:
            input_path: Path to import from
            merge: Merge with existing config (otherwise replaces)

        Returns:
            True if successful
        """
        try:
            data = json.loads(input_path.read_text(encoding='utf-8'))
            plugins_data = data.get("plugins", {})

            if merge:
                for name, state_data in plugins_data.items():
                    if not isinstance(state_data, dict):
                        logger.warning(f"Skipping invalid plugin state for '{name}'")
                        continue
                    if name in self._plugin_states:
                        existing = self._plugin_states[name]
                        existing.enabled = state_data.get('enabled', True)
                    else:
                        try:
                            state_data.setdefault('name', name)
                            state_data.setdefault('version', '0.0.0')
                            self._plugin_states[name] = PluginState(**{
                                k: v for k, v in state_data.items()
                                if k in PluginState.__dataclass_fields__
                            })
                        except Exception as e:
                            logger.warning(f"Skipping malformed plugin state for '{name}': {e}")
            else:
                self._plugin_states.clear()
                for name, state_data in plugins_data.items():
                    if not isinstance(state_data, dict):
                        logger.warning(f"Skipping invalid plugin state for '{name}'")
                        continue
                    try:
                        state_data.setdefault('name', name)
                        state_data.setdefault('version', '0.0.0')
                        self._plugin_states[name] = PluginState(**{
                            k: v for k, v in state_data.items()
                            if k in PluginState.__dataclass_fields__
                        })
                    except Exception as e:
                        logger.warning(f"Skipping malformed plugin state for '{name}': {e}")

            self._save_config()
            logger.info(f"Imported plugin config from {input_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to import plugin config: {e}")
            return False
