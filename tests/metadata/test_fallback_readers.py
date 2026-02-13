from __future__ import annotations

import json

from PIL import Image
from PIL.PngImagePlugin import PngInfo

from mjr_am_backend.features.metadata.fallback_readers import read_image_exif_like


def test_read_image_exif_like_maps_png_text_fields(tmp_path):
    img_path = tmp_path / "fallback.png"

    pnginfo = PngInfo()
    pnginfo.add_text("parameters", "Steps: 20, Sampler: Euler, CFG scale: 7")
    pnginfo.add_text("workflow", json.dumps({"nodes": [{"id": 1}], "links": []}))
    pnginfo.add_text("prompt", json.dumps({"1": {"class_type": "KSampler", "inputs": {}}}))

    Image.new("RGB", (64, 32), "black").save(img_path, pnginfo=pnginfo)

    data = read_image_exif_like(str(img_path))
    assert isinstance(data, dict)
    assert data.get("PNG:Parameters")
    assert data.get("PNG:Workflow")
    assert data.get("PNG:Prompt")
    assert data.get("Image:ImageWidth") == 64
    assert data.get("Image:ImageHeight") == 32
