"""
Plugin System - Blueprint Format

Declarative manifest layer on top of the existing dynamic-module plugin loader.

A *Blueprint* is a self-contained plugin directory:

    my_plugin/
        blueprint.yaml          # manifest (or blueprint.json)
        my_extractor.py         # entrypoint module

The manifest declares plugin identity, capabilities, and the entrypoint class
to instantiate. The Python module is then loaded through the regular validated
loader, so all existing security constraints (validator, symlink guard, sys
modules isolation) still apply.

Manifest schema (v1):

    schema_version: 1
    name: my_plugin                 # required, unique slug [a-z0-9_]
    version: "1.0.0"                # required
    author: "Name <email>"          # required
    description: "Short summary"    # optional
    license: MIT                    # optional, default MIT
    homepage: "https://…"           # optional
    min_majoor_version: "2.4.0"     # optional
    type: metadata_extractor        # required, currently only this value
    entrypoint:                     # required
        module: my_extractor        # python module name inside the package
        class: MyExtractor          # class name implementing the plugin base
    capabilities:                   # optional informational block
        supported_extensions: [".png", ".webp"]
        priority: 100
    tags: ["wanvideo", "video"]     # optional, free-form labels

Back-compat: pre-existing flat ``*.py`` plugin files keep working unchanged.
Blueprints are discovered alongside them and take precedence when both exist
with the same name.

Only the standard library is required when manifests use JSON. YAML manifests
need PyYAML, which ships with ComfyUI Core; the loader degrades gracefully and
logs a warning if a ``.yaml`` manifest is found but PyYAML is missing.
"""

from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)


BLUEPRINT_SCHEMA_VERSION = 1
MANIFEST_FILENAMES: tuple[str, ...] = ("blueprint.yaml", "blueprint.yml", "blueprint.json")
_NAME_RE = re.compile(r"^[a-z][a-z0-9_]{1,63}$")
_VERSION_RE = re.compile(r"^\d+\.\d+\.\d+([+\-][0-9A-Za-z.\-]+)?$")
SUPPORTED_PLUGIN_TYPES: frozenset[str] = frozenset({"metadata_extractor"})


class BlueprintError(Exception):
    """Raised when a blueprint manifest is invalid or cannot be loaded."""


@dataclass(frozen=True)
class BlueprintEntrypoint:
    """Reference to the Python class implementing the plugin."""

    module: str
    class_name: str


@dataclass(frozen=True)
class Blueprint:
    """Parsed and validated blueprint manifest."""

    name: str
    version: str
    author: str
    plugin_type: str
    entrypoint: BlueprintEntrypoint
    schema_version: int = BLUEPRINT_SCHEMA_VERSION
    description: str = ""
    license: str = "MIT"
    homepage: str = ""
    min_majoor_version: str = "2.4.0"
    capabilities: dict[str, Any] = field(default_factory=dict)
    tags: tuple[str, ...] = ()
    source_path: Path | None = None
    package_dir: Path | None = None

    def to_info_dict(self) -> dict[str, Any]:
        """Serializable description (used by listing endpoints)."""
        return {
            "name": self.name,
            "version": self.version,
            "author": self.author,
            "type": self.plugin_type,
            "description": self.description,
            "license": self.license,
            "homepage": self.homepage,
            "min_majoor_version": self.min_majoor_version,
            "tags": list(self.tags),
            "capabilities": dict(self.capabilities),
            "manifest_path": str(self.source_path) if self.source_path else None,
        }


# --------------------------------------------------------------------------- #
# Discovery
# --------------------------------------------------------------------------- #


def find_manifest(package_dir: Path) -> Path | None:
    """Return the first manifest path found in *package_dir*, or ``None``."""
    if not package_dir.is_dir():
        return None
    for candidate in MANIFEST_FILENAMES:
        path = package_dir / candidate
        if path.is_file():
            return path
    return None


def iter_blueprint_packages(directory: Path) -> list[Path]:
    """Return subdirectories of *directory* that contain a blueprint manifest."""
    if not directory.is_dir():
        return []
    out: list[Path] = []
    for entry in sorted(directory.iterdir()):
        if not entry.is_dir() or entry.name.startswith("_") or entry.name.startswith("."):
            continue
        if find_manifest(entry) is not None:
            out.append(entry)
    return out


# --------------------------------------------------------------------------- #
# Parsing
# --------------------------------------------------------------------------- #


def _load_manifest_text(path: Path) -> dict[str, Any]:
    """Read and parse a manifest file (JSON or YAML)."""
    raw = path.read_text(encoding="utf-8")
    suffix = path.suffix.lower()
    if suffix == ".json":
        try:
            data = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise BlueprintError(f"Invalid JSON manifest {path}: {exc}") from exc
    elif suffix in (".yaml", ".yml"):
        try:
            import yaml  # type: ignore[import-untyped]
        except ImportError as exc:
            raise BlueprintError(
                f"YAML manifest {path} requires PyYAML; install it or convert to JSON"
            ) from exc
        try:
            data = yaml.safe_load(raw)
        except yaml.YAMLError as exc:
            raise BlueprintError(f"Invalid YAML manifest {path}: {exc}") from exc
    else:
        raise BlueprintError(f"Unsupported manifest extension: {path.name}")
    if not isinstance(data, dict):
        raise BlueprintError(f"Manifest root must be a mapping: {path}")
    return data


def _require_str(data: dict[str, Any], key: str, source: Path) -> str:
    value = data.get(key)
    if not isinstance(value, str) or not value.strip():
        raise BlueprintError(f"Manifest {source}: missing or invalid field '{key}'")
    return value.strip()


def _optional_str(data: dict[str, Any], key: str, default: str = "") -> str:
    value = data.get(key, default)
    if value is None:
        return default
    if not isinstance(value, str):
        raise BlueprintError(f"Field '{key}' must be a string, got {type(value).__name__}")
    return value


def parse_manifest(path: Path) -> Blueprint:
    """Parse and validate a manifest file into a :class:`Blueprint`."""
    data = _load_manifest_text(path)

    schema_version = data.get("schema_version", BLUEPRINT_SCHEMA_VERSION)
    if not isinstance(schema_version, int) or schema_version != BLUEPRINT_SCHEMA_VERSION:
        raise BlueprintError(
            f"Manifest {path}: unsupported schema_version {schema_version!r} "
            f"(expected {BLUEPRINT_SCHEMA_VERSION})"
        )

    name = _require_str(data, "name", path)
    if not _NAME_RE.match(name):
        raise BlueprintError(
            f"Manifest {path}: 'name' must match {_NAME_RE.pattern!r}, got {name!r}"
        )

    version = _require_str(data, "version", path)
    if not _VERSION_RE.match(version):
        raise BlueprintError(f"Manifest {path}: 'version' is not semver: {version!r}")

    author = _require_str(data, "author", path)
    plugin_type = _require_str(data, "type", path)
    if plugin_type not in SUPPORTED_PLUGIN_TYPES:
        raise BlueprintError(
            f"Manifest {path}: unsupported plugin type {plugin_type!r} "
            f"(supported: {sorted(SUPPORTED_PLUGIN_TYPES)})"
        )

    entrypoint_raw = data.get("entrypoint")
    if not isinstance(entrypoint_raw, dict):
        raise BlueprintError(f"Manifest {path}: 'entrypoint' must be a mapping")
    ep_module = _require_str(entrypoint_raw, "module", path)
    ep_class = _require_str(entrypoint_raw, "class", path)
    if "/" in ep_module or "\\" in ep_module or ep_module.startswith("."):
        raise BlueprintError(
            f"Manifest {path}: entrypoint.module must be a plain module name, "
            f"got {ep_module!r}"
        )

    capabilities = data.get("capabilities", {}) or {}
    if not isinstance(capabilities, dict):
        raise BlueprintError(f"Manifest {path}: 'capabilities' must be a mapping")

    tags_raw = data.get("tags", []) or []
    if not isinstance(tags_raw, list) or not all(isinstance(t, str) for t in tags_raw):
        raise BlueprintError(f"Manifest {path}: 'tags' must be a list of strings")

    return Blueprint(
        name=name,
        version=version,
        author=author,
        plugin_type=plugin_type,
        entrypoint=BlueprintEntrypoint(module=ep_module, class_name=ep_class),
        schema_version=schema_version,
        description=_optional_str(data, "description"),
        license=_optional_str(data, "license", "MIT"),
        homepage=_optional_str(data, "homepage"),
        min_majoor_version=_optional_str(data, "min_majoor_version", "2.4.0"),
        capabilities=dict(capabilities),
        tags=tuple(tags_raw),
        source_path=path,
        package_dir=path.parent,
    )


def discover_blueprints(directory: Path) -> list[Blueprint]:
    """Find and parse all blueprints under *directory*.

    Errors on individual manifests are logged and skipped; this function never
    raises so a single bad manifest cannot break plugin discovery.
    """
    found: list[Blueprint] = []
    for package_dir in iter_blueprint_packages(directory):
        manifest = find_manifest(package_dir)
        if manifest is None:  # pragma: no cover - guarded by iter_blueprint_packages
            continue
        try:
            found.append(parse_manifest(manifest))
        except BlueprintError as exc:
            logger.warning("Skipping invalid blueprint %s: %s", manifest, exc)
    return found
