import sys
import types

import pytest
from PIL import Image


@pytest.fixture()
def nodes_module():
    folder_paths_stub = types.ModuleType("folder_paths")
    folder_paths_stub.get_output_directory = lambda: ""
    folder_paths_stub.get_save_image_path = lambda *args, **kwargs: ("", "Majoor", 1, "", "Majoor")
    sys.modules.setdefault("folder_paths", folder_paths_stub)

    comfy_stub = types.ModuleType("comfy")
    cli_args_stub = types.ModuleType("comfy.cli_args")
    cli_args_stub.args = types.SimpleNamespace(disable_metadata=False)
    sys.modules.setdefault("comfy", comfy_stub)
    sys.modules.setdefault("comfy.cli_args", cli_args_stub)

    av_stub = types.ModuleType("av")
    av_stub.open = lambda *args, **kwargs: None
    sys.modules.setdefault("av", av_stub)

    import importlib

    return importlib.import_module("nodes")


def test_resolve_execution_metadata_includes_source_node_type_from_prompt(monkeypatch, nodes_module):
    nodes = nodes_module
    monkeypatch.setattr(nodes, "_runtime_active_prompt_id", lambda: "runtime-job")

    metadata = nodes._resolve_execution_metadata(
        {
            "7": {
                "class_type": "MajoorSaveImage",
                "inputs": {},
            },
            "asset_id": "core-asset-1",
        },
        {"workflow": {"id": "workflow-1", "nodes": []}},
        unique_id="7",
    )

    assert metadata["asset_id"] == "core-asset-1"
    assert metadata["job_id"] == "runtime-job"
    assert metadata["prompt_id"] == "runtime-job"
    assert metadata["workflow_id"] == "workflow-1"
    assert metadata["source_node_id"] == "7"
    assert metadata["source_node_type"] == "MajoorSaveImage"


def test_resolve_execution_metadata_falls_back_to_workflow_node_type(monkeypatch, nodes_module):
    nodes = nodes_module
    monkeypatch.setattr(nodes, "_runtime_active_prompt_id", lambda: None)

    metadata = nodes._resolve_execution_metadata(
        {"prompt_id": "prompt-job"},
        {
            "asset_id": "core-asset-2",
            "workflow": {
                "id": "workflow-2",
                "nodes": [
                    {"id": 12, "type": "MajoorSaveVideo"},
                ],
            },
        },
        unique_id="12",
    )

    assert metadata["asset_id"] == "core-asset-2"
    assert metadata["job_id"] == "prompt-job"
    assert metadata["workflow_id"] == "workflow-2"
    assert metadata["source_node_id"] == "12"
    assert metadata["source_node_type"] == "MajoorSaveVideo"


def test_srgb_profile_is_valid_and_reusable(nodes_module, tmp_path):
    profile = nodes_module._srgb_icc_profile()
    assert profile
    assert profile == nodes_module._srgb_save_kwargs()["icc_profile"]

    path = tmp_path / "srgb.png"
    Image.new("RGB", (2, 2), "red").save(path, **nodes_module._srgb_save_kwargs())
    with Image.open(path) as saved:
        assert saved.info["icc_profile"] == profile
