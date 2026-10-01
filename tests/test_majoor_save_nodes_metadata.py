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

    # nodes.py defines its node classes with the ComfyUI Nodes V3 API
    # (comfy_api.latest.IO.ComfyNode / ComfyExtension). This test only exercises
    # module-level helper functions, not define_schema()/execute(), so a bare
    # subclassable stand-in for each base class is enough to let the import succeed.
    comfy_api_stub = types.ModuleType("comfy_api")
    comfy_api_latest_stub = types.ModuleType("comfy_api.latest")
    comfy_api_latest_stub.ComfyExtension = type("ComfyExtension", (), {})
    comfy_api_latest_stub.IO = types.SimpleNamespace(ComfyNode=type("ComfyNode", (), {}))
    sys.modules.setdefault("comfy_api", comfy_api_stub)
    sys.modules.setdefault("comfy_api.latest", comfy_api_latest_stub)

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


def test_progress_bar_uses_comfyui_surface_when_available(monkeypatch, nodes_module):
    updates = []

    class FakeProgressBar:
        def __init__(self, total):
            self.total = total

        def update(self, value=1):
            updates.append(value)

    monkeypatch.setattr(nodes_module, "_ComfyProgressBar", FakeProgressBar)

    progress = nodes_module._make_progress_bar(4)
    progress.update(1)

    assert progress.total == 4
    assert updates == [1]


class _FakeVideo:
    def __init__(self, bit_depth, color_space):
        self._bit_depth = bit_depth
        self._color_space = color_space

    def get_components(self):
        return types.SimpleNamespace(images=[object()], frame_rate=24, audio=None)

    def get_bit_depth(self):
        return self._bit_depth

    def get_color_space(self):
        return self._color_space


def test_resolve_video_inputs_keeps_video_bit_depth_and_color_space(nodes_module):
    torch_mod = pytest.importorskip("torch")
    video = _FakeVideo(10, "HDR")
    video.get_components = lambda: types.SimpleNamespace(
        images=torch_mod.zeros(1, 2, 2, 3), frame_rate=24, audio=None
    )
    _, fps, _, bit_depth, color_space = nodes_module._resolve_video_inputs(video, None, None, 12.0)
    assert (fps, bit_depth, color_space) == (24.0, 10, "HDR")

    video._color_space = "auto"
    assert nodes_module._resolve_video_inputs(video, None, None, 12.0)[4] == "sRGB"


def test_resolve_video_inputs_defaults_to_8bit_srgb_for_images(nodes_module):
    torch_mod = pytest.importorskip("torch")
    _, _, _, bit_depth, color_space = nodes_module._resolve_video_inputs(
        None, torch_mod.zeros(1, 2, 2, 3), None, 12.0
    )
    assert (bit_depth, color_space) == (8, "sRGB")



def test_video_format_specs_cover_all_containers(nodes_module):
    specs = nodes_module._VIDEO_FORMAT_SPECS
    assert specs["mp4 (h264)"] == ("mp4", "h264")
    assert specs["webm (av1)"] == ("webm", "av1")
    assert specs["mkv (av1)"] == ("mkv", "av1")
    assert nodes_module._SUPPORTED_VIDEO_FORMATS[-2:] == ["gif", "webp"]


def test_png_bytes_with_text_inserts_chunks_after_ihdr(nodes_module, tmp_path):
    import io

    buf = io.BytesIO()
    Image.new("RGB", (2, 2)).save(buf, format="PNG")

    def text_chunk(key, value):
        import struct
        import zlib

        data = key.encode("latin-1") + b"\x00" + value.encode("latin-1")
        return struct.pack(">I", len(data)) + b"tEXt" + data + struct.pack(">I", zlib.crc32(b"tEXt" + data))

    out = nodes_module._png_bytes_with_text(buf.getvalue(), {"generation_time_ms": "42"}, text_chunk)
    image = Image.open(io.BytesIO(out))
    assert image.text["generation_time_ms"] == "42"


def test_native_metadata_keeps_numeric_generation_time(nodes_module):
    meta = nodes_module._native_metadata({}, {"workflow": {"id": "w"}}, 1500, {"seed": 7})
    assert meta["workflow"] == {"id": "w"}
    assert meta["generation_time_ms"] == 1500
    assert meta["majoor_geninfo"]["seed"] == 7
