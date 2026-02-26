from pathlib import Path

from mjr_am_backend.features.metadata import extractor_registry as r
from mjr_am_backend.shared import Result


def test_clean_model_name_and_signal_helpers():
    assert r.clean_model_name(None) is None
    assert r.clean_model_name("  ") is None
    assert r.clean_model_name(r"C:\m\model.safetensors") == "model"
    assert r.has_any_parameter_signal(None, "", 0) is True
    assert r.has_any_parameter_signal(None, "") is False


def test_apply_helpers_and_build_geninfo_from_parameters():
    out = {}
    r.apply_prompt_fields(out, " p ", " n ")
    r.apply_sampler_fields(out, "euler", "normal")
    r.apply_numeric_fields(out, "20", "7.5", "123")
    r.apply_size_field(out, "512", "768")
    r.apply_checkpoint_fields(out, "m.ckpt")
    assert out["positive"]["value"] == "p"
    assert out["checkpoint"]["name"] == "m"
    assert out["size"]["width"] == 512

    assert r.build_geninfo_from_parameters({"x": 1}) == {}
    built = r.build_geninfo_from_parameters({"prompt": "p", "steps": "20", "model": "z.safetensors"})
    assert built and built["steps"]["value"] == 20 and built["checkpoint"]["name"] == "z"


def test_merge_and_graph_classification_helpers(monkeypatch):
    monkeypatch.setattr(r, "parse_auto1111_params", lambda _txt: {"steps": 20, "cfg": 7.0, "x": None})
    merged = r.merge_parsed_params({"parameters": "Steps:20"})
    assert merged["steps"] == 20 and "x" not in merged

    types = r.collect_prompt_graph_types({"1": {"class_type": "LoadVideo"}, "2": {"type": "VHS_VideoCombine"}})
    assert "loadvideo" in types
    assert r.has_generation_sampler(["ksampler"]) is True
    assert r.has_generation_sampler(["samplerselect"]) is False
    assert r.classify_media_nodes(["loadvideo", "videocombine"])[0] is True
    assert r.looks_like_media_pipeline({"1": {"class_type": "LoadVideo"}, "2": {"class_type": "SaveVideo"}}) is True
    assert r.looks_like_media_pipeline({"1": {"class_type": "KSampler"}}) is False
    assert r.should_parse_geninfo({"prompt": {"1": {}}, "workflow": None}) is True
    assert r.should_parse_geninfo({"parameters": "x"}) is True
    assert r.should_parse_geninfo(None) is False


def test_group_batch_and_resolution_helpers(monkeypatch, tmp_path: Path):
    p_img = tmp_path / "a.png"
    p_vid = tmp_path / "a.mp4"
    p_aud = tmp_path / "a.mp3"
    p_oth = tmp_path / "a.bin"
    for p in (p_img, p_vid, p_aud, p_oth):
        p.write_text("x", encoding="utf-8")

    monkeypatch.setattr(r, "classify_file", lambda p: "image" if p.endswith(".png") else ("video" if p.endswith(".mp4") else ("audio" if p.endswith(".mp3") else "unknown")))
    i, v, a, o = r.group_existing_paths([str(p_img), str(p_vid), str(p_aud), str(p_oth), str(tmp_path / "missing.png")])
    assert i == [str(p_img)] and v == [str(p_vid)] and a == [str(p_aud)] and o == [str(p_oth)]

    monkeypatch.setattr(r, "pick_probe_backend", lambda p, settings_override=None: ["exiftool", "ffprobe"] if p.endswith(".mp4") else ["exiftool"])
    ex, ff = r.build_batch_probe_targets([str(p_img), str(p_vid), str(p_vid)], "auto")
    assert ex == [str(p_img), str(p_vid)] and ff == [str(p_vid)]

    payload = {"resolution": ("100", "200")}
    r.expand_resolution_scalars(payload)
    assert payload["width"] == 100 and payload["height"] == 200
    assert r.coerce_resolution_pair(1) is None
    assert r.coerce_dimension_value("9") == 9


def test_extract_payload_dispatch_and_batch_tool_data(monkeypatch):
    monkeypatch.setattr(r, "extract_png_metadata", lambda fp, ex: Result.Ok({"kind": "png", "fp": fp, "ex": ex}))
    monkeypatch.setattr(r, "extract_webp_metadata", lambda fp, ex: Result.Ok({"kind": "webp", "fp": fp, "ex": ex}))
    monkeypatch.setattr(r, "extract_video_metadata", lambda fp, ex, ffprobe_data=None: Result.Ok({"kind": "video", "fp": fp, "ex": ex}))

    p = r.extract_workflow_only_payload("image", ".png", "a.png", {"x": 1})
    assert p.ok and p.data["kind"] == "png"
    p2 = r.extract_workflow_only_payload("video", ".mp4", "a.mp4", {"x": 1})
    assert p2.ok and p2.data["kind"] == "video"
    p3 = r.extract_image_by_extension("a.jpg", ".jpg", None)
    assert p3.ok and p3.data["quality"] == "none"
    p4 = r.extract_image_by_extension("a.webp", ".webp", {"x": 1})
    assert p4.ok and p4.data["kind"] == "webp"

    merged = r.build_image_metadata_payload("a.png", {"size": 1}, {"x": 1}, Result.Ok({"workflow": {"a": 1}}))
    assert merged["file_info"]["size"] == 1 and merged["workflow"] == {"a": 1}

    vr = Result.Ok({"resolution": (12, 34)})
    r.expand_video_resolution_fields(vr)
    assert vr.data["width"] == 12 and vr.data["height"] == 34
    assert r.batch_tool_data({"a": Result.Ok({"ok": 1}), "b": Result.Err("E", "x")}, "a") == {"ok": 1}
    assert r.batch_tool_data({"b": Result.Err("E", "x")}, "b") is None
