import json

import pytest

from mjr_am_backend.features.metadata import extractor_registry as reg

PROMPT = {
    "1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "a.safetensors"}},
    "2": {"class_type": "CLIPTextEncode", "inputs": {"text": "hi", "clip": ["1", 1]}},
    "3": {"class_type": "KSampler", "inputs": {"seed": 5, "steps": 20, "model": ["1", 0], "positive": ["2", 0]}},
}
WORKFLOW = {"id": "wf1", "nodes": [{"id": 3, "type": "KSampler"}], "links": [], "version": 0.4}


@pytest.mark.parametrize("ext", [".jpg", ".jpeg", ".tif", ".tiff", ".webp"])
def test_comfyui_exif_text_is_read_from_jpeg_tiff_and_webp(tmp_path, ext):
    path = tmp_path / f"was_00001{ext}"
    path.write_bytes(b"x")
    exif = {
        "IFD0:Make": "Prompt:" + json.dumps(PROMPT),
        "IFD0:ImageDescription": "Workflow:" + json.dumps(WORKFLOW),
    }

    result = reg.extract_image_by_extension(str(path), ext, exif)

    assert result.ok
    assert result.data["workflow"]["id"] == "wf1"
    assert result.data["prompt"]["3"]["class_type"] == "KSampler"


def test_a1111_parameters_in_jpeg_user_comment_are_parsed(tmp_path):
    path = tmp_path / "forge.jpg"
    path.write_bytes(b"x")
    parameters = (
        "a red fox\nNegative prompt: blurry\n"
        "Steps: 25, Sampler: Euler a, CFG scale: 6.5, Seed: 1234, Size: 512x768, Model: dreamshaper"
    )

    result = reg.extract_image_by_extension(str(path), ".jpg", {"EXIF:UserComment": parameters})

    assert result.ok
    assert result.data["parameters"] == parameters
    assert result.data.get("steps") == 25 or result.data.get("seed") == 1234


def test_jpeg_without_exif_text_stays_empty(tmp_path):
    path = tmp_path / "plain.jpg"
    path.write_bytes(b"x")

    result = reg.extract_image_by_extension(str(path), ".jpg", {"File:ImageWidth": 16})

    assert result.ok
    assert not result.data.get("workflow") and not result.data.get("prompt")
