from __future__ import annotations

import json
import shutil
from pathlib import Path
from typing import Any

import pytest
from mjr_am_backend.adapters.tools.exiftool import ExifTool
from mjr_am_backend.features.tags import sync
from PIL import Image
from PIL.PngImagePlugin import PngInfo

pytestmark = pytest.mark.skipif(shutil.which("exiftool") is None, reason="exiftool not on PATH")


def _make_png(path: Path, prompt: dict[str, Any], workflow: dict[str, Any]) -> None:
    info = PngInfo()
    info.add_text("prompt", json.dumps(prompt))
    info.add_text("workflow", json.dumps(workflow))
    Image.new("RGB", (16, 16), (128, 64, 32)).save(path, format="PNG", pnginfo=info)


def _png_text(path: Path) -> dict[str, str]:
    with Image.open(path) as img:
        return dict(img.text or {})


def _list_tag(meta: dict[str, Any], suffix: str) -> list[Any] | None:
    # ExifTool JSON returns single-item list tags as a scalar string.
    for key, value in meta.items():
        if key.endswith(suffix):
            if isinstance(value, list):
                return value
            return [value]
    return None


def _exiftool() -> ExifTool:
    exiftool = ExifTool()
    if not exiftool.is_available():
        pytest.skip("exiftool not available")
    return exiftool


def test_repeated_saves_replace_tags_roundtrip(tmp_path: Path):
    exiftool = _exiftool()
    p = tmp_path / "roundtrip.png"
    prompt = {"3": {"class_type": "KSampler", "inputs": {"seed": 1}}}
    workflow = {"nodes": [{"id": 3, "type": "KSampler"}]}
    _make_png(p, prompt, workflow)

    for tags in (["cat"], ["cat", "dog"], ["dog"]):
        res = sync.write_exif_rating_tags(exiftool, str(p), 5, tags)
        assert res.ok, res.error

    meta = exiftool.read(str(p), ["XMP:Subject", "IPTC:Keywords"])
    assert meta.ok, meta.error
    assert _list_tag(meta.data, "Subject") == ["dog"]
    assert _list_tag(meta.data, "Keywords") == ["dog"]

    res = sync.write_exif_rating_tags(exiftool, str(p), 5, ["dog", "bird"])
    assert res.ok, res.error
    meta = exiftool.read(str(p), ["XMP:Subject", "IPTC:Keywords"])
    assert meta.ok, meta.error
    assert _list_tag(meta.data, "Subject") == ["dog", "bird"]
    assert _list_tag(meta.data, "Keywords") == ["dog", "bird"]

    text = _png_text(p)
    assert json.loads(text["prompt"]) == prompt
    assert json.loads(text["workflow"]) == workflow


def test_clear_tags_roundtrip(tmp_path: Path):
    exiftool = _exiftool()
    p = tmp_path / "clear.png"
    _make_png(p, {"p": 1}, {"w": 1})

    res = sync.write_exif_rating_tags(exiftool, str(p), 4, ["cat", "dog"])
    assert res.ok, res.error
    res2 = sync.write_exif_rating_tags(exiftool, str(p), 4, [])
    assert res2.ok, res2.error

    meta = exiftool.read(str(p), ["XMP:Subject", "IPTC:Keywords"])
    assert meta.ok, meta.error
    assert _list_tag(meta.data, "Subject") is None
    assert _list_tag(meta.data, "Keywords") is None
