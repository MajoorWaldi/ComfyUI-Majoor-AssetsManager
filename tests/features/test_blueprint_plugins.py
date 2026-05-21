"""Tests for the blueprint manifest parser and loader integration."""

from __future__ import annotations

import json
import textwrap
from pathlib import Path

import pytest
from mjr_am_backend.features.metadata.plugin_system.blueprint import (
    BLUEPRINT_SCHEMA_VERSION,
    BlueprintError,
    discover_blueprints,
    find_manifest,
    parse_manifest,
)
from mjr_am_backend.features.metadata.plugin_system.loader import PluginLoader

# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #


_MIN_MANIFEST = {
    "schema_version": BLUEPRINT_SCHEMA_VERSION,
    "name": "demo_plugin",
    "version": "1.0.0",
    "author": "tester",
    "type": "metadata_extractor",
    "entrypoint": {"module": "demo_extractor", "class": "DemoExtractor"},
}


_ENTRYPOINT_CODE = textwrap.dedent(
    '''
    from mjr_am_backend.features.metadata.plugin_system.base import (
        ExtractionResult,
        MetadataExtractorPlugin,
    )


    class DemoExtractor(MetadataExtractorPlugin):
        @property
        def name(self) -> str:
            return "demo_plugin"

        @property
        def supported_extensions(self) -> list[str]:
            return [".png"]

        @property
        def priority(self) -> int:
            return 10

        async def extract(self, filepath: str) -> ExtractionResult:
            return ExtractionResult(success=True, data={"ok": True}, extractor_name=self.name)
    '''
)


def _write_blueprint(root: Path, manifest: dict, *, manifest_name: str = "blueprint.json") -> Path:
    pkg = root / manifest["name"]
    pkg.mkdir(parents=True, exist_ok=True)
    (pkg / f"{manifest['entrypoint']['module']}.py").write_text(_ENTRYPOINT_CODE)
    manifest_path = pkg / manifest_name
    manifest_path.write_text(json.dumps(manifest))
    return manifest_path


# --------------------------------------------------------------------------- #
# Manifest parsing
# --------------------------------------------------------------------------- #


def test_parse_manifest_minimal_ok(tmp_path: Path) -> None:
    manifest = _write_blueprint(tmp_path, dict(_MIN_MANIFEST))
    bp = parse_manifest(manifest)
    assert bp.name == "demo_plugin"
    assert bp.version == "1.0.0"
    assert bp.plugin_type == "metadata_extractor"
    assert bp.entrypoint.module == "demo_extractor"
    assert bp.entrypoint.class_name == "DemoExtractor"
    assert bp.package_dir == manifest.parent


def test_parse_manifest_rejects_bad_name(tmp_path: Path) -> None:
    bad = dict(_MIN_MANIFEST, name="Bad-Name")
    pkg = tmp_path / "pkg"
    pkg.mkdir()
    path = pkg / "blueprint.json"
    path.write_text(json.dumps(bad))
    with pytest.raises(BlueprintError, match="name"):
        parse_manifest(path)


def test_parse_manifest_rejects_unsupported_schema(tmp_path: Path) -> None:
    bad = dict(_MIN_MANIFEST, schema_version=999)
    path = tmp_path / "blueprint.json"
    path.write_text(json.dumps(bad))
    with pytest.raises(BlueprintError, match="schema_version"):
        parse_manifest(path)


def test_parse_manifest_rejects_unknown_type(tmp_path: Path) -> None:
    bad = dict(_MIN_MANIFEST, type="something_else")
    path = tmp_path / "blueprint.json"
    path.write_text(json.dumps(bad))
    with pytest.raises(BlueprintError, match="plugin type"):
        parse_manifest(path)


def test_parse_manifest_rejects_path_traversal_in_module(tmp_path: Path) -> None:
    bad = dict(_MIN_MANIFEST)
    bad["entrypoint"] = {"module": "../evil", "class": "X"}
    path = tmp_path / "blueprint.json"
    path.write_text(json.dumps(bad))
    with pytest.raises(BlueprintError, match="entrypoint.module"):
        parse_manifest(path)


def test_parse_manifest_rejects_non_semver(tmp_path: Path) -> None:
    bad = dict(_MIN_MANIFEST, version="not.a.version")
    path = tmp_path / "blueprint.json"
    path.write_text(json.dumps(bad))
    with pytest.raises(BlueprintError, match="semver"):
        parse_manifest(path)


def test_parse_manifest_yaml_when_pyyaml_available(tmp_path: Path) -> None:
    pytest.importorskip("yaml")
    pkg = tmp_path / "demo_plugin"
    pkg.mkdir()
    (pkg / "demo_extractor.py").write_text(_ENTRYPOINT_CODE)
    yaml_text = textwrap.dedent(
        """
        schema_version: 1
        name: demo_plugin
        version: "1.0.0"
        author: tester
        type: metadata_extractor
        entrypoint:
          module: demo_extractor
          class: DemoExtractor
        capabilities:
          priority: 10
        """
    )
    manifest = pkg / "blueprint.yaml"
    manifest.write_text(yaml_text)
    bp = parse_manifest(manifest)
    assert bp.name == "demo_plugin"
    assert bp.capabilities == {"priority": 10}


# --------------------------------------------------------------------------- #
# Discovery
# --------------------------------------------------------------------------- #


def test_find_manifest_prefers_yaml_over_json(tmp_path: Path) -> None:
    pkg = tmp_path / "p"
    pkg.mkdir()
    (pkg / "blueprint.yaml").write_text("ignored")
    (pkg / "blueprint.json").write_text("ignored")
    found = find_manifest(pkg)
    assert found is not None
    assert found.name == "blueprint.yaml"


def test_discover_blueprints_skips_invalid(tmp_path: Path) -> None:
    _write_blueprint(tmp_path, dict(_MIN_MANIFEST))
    # Add an invalid one alongside.
    bad = tmp_path / "broken"
    bad.mkdir()
    (bad / "blueprint.json").write_text("{ not json")

    blueprints = discover_blueprints(tmp_path)
    names = [b.name for b in blueprints]
    assert "demo_plugin" in names
    assert all(n != "broken" for n in names)


# --------------------------------------------------------------------------- #
# PluginLoader integration
# --------------------------------------------------------------------------- #


def test_loader_loads_blueprint_extractor(tmp_path: Path) -> None:
    _write_blueprint(tmp_path, dict(_MIN_MANIFEST))
    loader = PluginLoader(
        plugin_dirs=[tmp_path],
        auto_discover=True,
        validation_mode="disabled",
    )
    assert "demo_plugin" in loader.extractor_names
    bp = loader.blueprints.get("demo_plugin")
    assert bp is not None
    assert bp.version == "1.0.0"
    stats = loader.get_stats()
    assert "demo_plugin" in stats["blueprints"]


def test_loader_warns_on_missing_entrypoint_module(tmp_path: Path) -> None:
    manifest = dict(_MIN_MANIFEST, name="ghost")
    manifest["entrypoint"] = {"module": "missing_module", "class": "GhostExtractor"}
    pkg = tmp_path / "ghost"
    pkg.mkdir()
    (pkg / "blueprint.json").write_text(json.dumps(manifest))

    loader = PluginLoader(
        plugin_dirs=[tmp_path],
        auto_discover=True,
        validation_mode="disabled",
    )
    assert "ghost" not in loader.extractor_names
    assert any("ghost" in entry[0] or "missing_module" in entry[1] for entry in loader.load_errors)
