"""Tests for the collect-files service (workflow inputs bundling)."""

from __future__ import annotations

import json
import zipfile
from pathlib import Path

from mjr_am_backend.features.assets import collect_service as cs
from mjr_am_backend.shared import Result


def _patch_roots(monkeypatch, *, output_root: Path, input_root: Path) -> None:
    monkeypatch.setattr(cs, "get_runtime_output_root", lambda: str(output_root))
    monkeypatch.setattr(cs, "get_input_directory", lambda: str(input_root))
    monkeypatch.setattr(cs, "get_temp_directory", lambda: None)
    monkeypatch.setattr(cs, "list_custom_roots", lambda: Result.Ok([]))
    monkeypatch.setattr(cs, "get_model_full_path", lambda name: None)


def _sd_prompt_graph() -> dict:
    """Minimal valid API prompt graph: text encoders -> KSampler -> SaveImage."""
    return {
        "1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "sd.safetensors"}},
        "2": {"class_type": "CLIPTextEncode", "inputs": {"text": "a beautiful castle", "clip": ["1", 1]}},
        "3": {"class_type": "CLIPTextEncode", "inputs": {"text": "blurry, ugly", "clip": ["1", 1]}},
        "4": {
            "class_type": "KSampler",
            "inputs": {
                "model": ["1", 0],
                "positive": ["2", 0],
                "negative": ["3", 0],
                "latent_image": ["5", 0],
                "seed": 1,
                "steps": 20,
                "cfg": 7.5,
                "sampler_name": "euler",
                "scheduler": "normal",
                "denoise": 1.0,
            },
        },
        "5": {"class_type": "EmptyLatentImage", "inputs": {"width": 512, "height": 512, "batch_size": 1}},
        "6": {"class_type": "VAEDecode", "inputs": {"samples": ["4", 0], "vae": ["1", 2]}},
        "7": {"class_type": "SaveImage", "inputs": {"images": ["6", 0], "filename_prefix": "out"}},
    }


def test_extract_prompt_texts_traces_text_encoders():
    payload = cs.extract_prompt_texts(None, _sd_prompt_graph())
    assert payload is not None
    assert payload["positive"] == "a beautiful castle"
    assert payload["negative"] == "blurry, ugly"


def test_extract_prompt_texts_returns_none_without_prompts():
    prompt = {"1": {"class_type": "LoadImage", "inputs": {"image": "photo.png"}}}
    assert cs.extract_prompt_texts(None, prompt) is None


def test_extract_workflow_refs_media_and_models():
    prompt = {
        "1": {"class_type": "LoadImage", "inputs": {"image": "photo.png [input]"}},
        "2": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "sdxl.safetensors"}},
        "3": {"class_type": "KSampler", "inputs": {"seed": 42, "model": ["2", 0]}},
    }
    workflow = {
        "nodes": [
            {"type": "LoadImage", "widgets_values": ["photo.png [input]", "image"]},
            {"type": "VHS_LoadVideo", "widgets_values": {"video": "clips/intro.mp4"}},
            {"type": "LoraLoader", "widgets_values": ["style.safetensors", 1.0]},
        ]
    }
    media, models = cs.extract_workflow_refs(workflow, prompt)
    assert "photo.png [input]" in media
    assert "clips/intro.mp4" in media
    # Deduped: photo.png appears in prompt and workflow but only once.
    assert len([m for m in media if "photo.png" in m]) == 1
    assert "sdxl.safetensors" in models
    assert "style.safetensors" in models


def test_split_annotation():
    assert cs._split_annotation("img.png [input]") == ("img.png", "input")
    assert cs._split_annotation("sub/img.png [output]") == ("sub/img.png", "output")
    assert cs._split_annotation("plain.png") == ("plain.png", "")
    assert cs._split_annotation("weird [brackets].png") == ("weird [brackets].png", "")


def test_resolve_media_refs_relative_and_missing(monkeypatch, tmp_path: Path):
    input_root = tmp_path / "input"
    output_root = tmp_path / "output"
    (input_root / "clips").mkdir(parents=True)
    output_root.mkdir()
    (input_root / "photo.png").write_bytes(b"png")
    (input_root / "clips" / "intro.mp4").write_bytes(b"mp4")
    _patch_roots(monkeypatch, output_root=output_root, input_root=input_root)

    entries = cs.resolve_media_refs(["photo.png [input]", "clips/intro.mp4", "gone.png"])
    by_name = {e["name"]: e for e in entries}
    assert by_name["photo.png"]["status"] == "ok"
    assert by_name["intro.mp4"]["status"] == "ok"
    assert by_name["gone.png"]["status"] == "missing"


def test_resolve_media_refs_absolute_outside_roots_not_copied(monkeypatch, tmp_path: Path):
    input_root = tmp_path / "input"
    output_root = tmp_path / "output"
    outside = tmp_path / "outside"
    for d in (input_root, output_root, outside):
        d.mkdir()
    secret = outside / "secret.png"
    secret.write_bytes(b"png")
    _patch_roots(monkeypatch, output_root=output_root, input_root=input_root)

    entries = cs.resolve_media_refs([str(secret)])
    assert entries[0]["status"] == "skipped_outside_roots"


def test_build_collect_zip_end_to_end(monkeypatch, tmp_path: Path):
    input_root = tmp_path / "input"
    output_root = tmp_path / "output"
    input_root.mkdir()
    output_root.mkdir()
    asset = output_root / "render.png"
    asset.write_bytes(b"fake png")
    (input_root / "photo.png").write_bytes(b"input bytes")
    _patch_roots(monkeypatch, output_root=output_root, input_root=input_root)

    workflow = {"nodes": [{"type": "LoadImage", "widgets_values": ["photo.png [input]"]}]}
    prompt = _sd_prompt_graph()
    prompt["0"] = {"class_type": "LoadImage", "inputs": {"image": "photo.png [input]"}}

    res = cs.build_collect_zip(asset, workflow=workflow, prompt=prompt)
    assert res.ok, res.error
    data = res.data or {}
    zip_path = Path(data["zip_path"])
    assert zip_path.exists()
    assert zip_path.parent == output_root  # next to the asset
    assert data["fallback_used"] is False
    assert data["missing"] == []
    assert data["has_prompt_text"] is True

    with zipfile.ZipFile(zip_path) as zf:
        names = set(zf.namelist())
        assert "render.png" in names
        assert "workflow.json" in names
        assert "prompt_graph.json" in names
        assert "prompt.json" in names
        assert "inputs/photo.png" in names
        assert "collected_files.txt" in names
        manifest = zf.read("collected_files.txt").decode("utf-8")
        assert "photo.png" in manifest
        assert "copied" in manifest
        parsed = json.loads(zf.read("workflow.json").decode("utf-8"))
        assert parsed == workflow
        graph = json.loads(zf.read("prompt_graph.json").decode("utf-8"))
        assert graph == prompt
        texts = json.loads(zf.read("prompt.json").decode("utf-8"))
        assert texts["positive"] == "a beautiful castle"
        assert texts["negative"] == "blurry, ugly"


def test_build_collect_zip_missing_inputs_listed(monkeypatch, tmp_path: Path):
    input_root = tmp_path / "input"
    output_root = tmp_path / "output"
    input_root.mkdir()
    output_root.mkdir()
    asset = output_root / "render.png"
    asset.write_bytes(b"fake png")
    _patch_roots(monkeypatch, output_root=output_root, input_root=input_root)

    workflow = {"nodes": [{"type": "LoadImage", "widgets_values": ["gone.png [input]"]}]}
    res = cs.build_collect_zip(asset, workflow=workflow, prompt=None)
    assert res.ok, res.error
    data = res.data or {}
    assert data["missing"] == ["gone.png"]
    with zipfile.ZipFile(Path(data["zip_path"])) as zf:
        manifest = zf.read("collected_files.txt").decode("utf-8")
        assert "MISSING" in manifest


def test_build_collect_zip_unique_name(monkeypatch, tmp_path: Path):
    input_root = tmp_path / "input"
    output_root = tmp_path / "output"
    input_root.mkdir()
    output_root.mkdir()
    asset = output_root / "render.png"
    asset.write_bytes(b"fake png")
    (output_root / "render_collected.zip").write_bytes(b"existing")
    _patch_roots(monkeypatch, output_root=output_root, input_root=input_root)

    res = cs.build_collect_zip(asset, workflow=None, prompt=None)
    assert res.ok, res.error
    assert Path((res.data or {})["zip_path"]).name == "render_collected (2).zip"


def test_writable_dest_dir_fallback(monkeypatch, tmp_path: Path):
    output_root = tmp_path / "output"
    output_root.mkdir()
    monkeypatch.setattr(cs, "get_runtime_output_root", lambda: str(output_root))

    missing_dir = tmp_path / "does-not-exist"
    dest, fallback_used = cs._writable_dest_dir(missing_dir)
    assert fallback_used is True
    assert dest == output_root / cs._FALLBACK_SUBDIR
    assert dest.is_dir()

    dest2, fallback2 = cs._writable_dest_dir(output_root)
    assert fallback2 is False
    assert dest2 == output_root
