from types import SimpleNamespace

import pytest

from mjr_am_backend.features.metadata import extractors as e


def test_dim_helpers_and_pairs():
    assert e._coerce_dim(" 512px ") == 512
    assert e._coerce_dim("512x512") is None
    assert e._coerce_dim(-1) is None

    assert e._parse_size_pair("512x768") == (512, 768)
    assert e._parse_size_pair("512 768") == (512, 768)
    assert e._parse_size_pair(None) == (None, None)

    w, h = e._fill_missing_dims_from_pairs(None, None, {"ImageSize": "640x480"})
    assert (w, h) == (640, 480)


def test_apply_dimensions_from_exif():
    m = {"width": None, "height": None}
    e._apply_dimensions_from_exif(m, {"ImageSize": "320x240"})
    assert m["width"] == 320 and m["height"] == 240


def test_ffprobe_extractors_and_text_candidates():
    ff = {
        "format": {"tags": {"a": "b"}},
        "streams": [{"tags": {"x": "y"}}, {"n": 1}],
    }
    assert e._extract_ffprobe_format_tags(ff) == {"a": "b"}
    assert e._extract_ffprobe_stream_tag_dicts(ff) == [{"x": "y"}]

    cands = e._collect_text_candidates({"a": "x", "b": ["y", 1], "c": 2})
    assert ("a", "x") in cands and ("b", "y") in cands


def test_apply_auto1111_text_candidates(monkeypatch):
    monkeypatch.setattr(e, "parse_auto1111_params", lambda t: {"prompt": "p", "negative_prompt": "n", "steps": 20} if "ok" in t else None)
    meta = {"quality": "none", "prompt": None}
    e._apply_auto1111_text_candidates(meta, [("k", "not"), ("k", "ok text")], prompt_graph=None, preserve_existing_prompt_text=False)
    assert meta["parameters"] == "ok text"
    assert meta["prompt"] == "p"
    assert meta["negative_prompt"] == "n"
    assert meta["quality"] == "partial"


def test_workflow_small_helpers():
    links = e._workflow_build_link_lookup([[10, 1, 2, "positive", "x"]])
    assert links[10][0] == 1

    assert e._workflow_get_node_text({"widgets_values": ["a", "b"]}, "negative") == "b"
    assert e._workflow_get_node_text({"widgets_values": ["a"]}) == "a"
    assert e._workflow_get_node_text({"widgets_values": [1]}) is None

    assert e._workflow_input_context_allowed({"name": "negative"}, "positive") is False
    assert e._workflow_input_context_allowed({"name": "positive"}, "negative") is False
    assert e._workflow_input_context_allowed({"name": "x"}, "positive") is True


def test_sampler_widget_helpers():
    params = {}
    e._workflow_apply_sampler_widget_params(params, [123456, 25, 7.5, "euler_a", "x"])
    assert params["seed"] == 123456
    assert params["steps"] == 25
    assert params["cfg"] == 7.5
    assert params["sampler"] == "euler_a"


def test_workflow_prompt_detail_finalize():
    p = {"steps": 20, "sampler": "euler", "cfg": 7, "seed": 1, "model": "m"}
    e._workflow_finalize_params(p, {"hello"}, {"bad"})
    assert "positive_prompt" in p and "negative_prompt" in p
    assert "parameters" in p
    assert e._workflow_is_text_prompt_node("textencode") is True
    assert e._workflow_is_negative_prompt_node("my negative", "x") is True
    assert e._workflow_first_nontrivial_text(["a", "abc"]) == "abc"


def test_rating_and_tags_helpers():
    assert e._coerce_rating_to_stars("4") == 4
    assert e._coerce_rating_to_stars(90) == 5
    assert e._coerce_percent_rating_to_stars(40) == 3
    assert e._split_tags("a;b,c|d\n e")[:3] == ["a", "b", "c"]

    rating, tags = e._extract_rating_tags({
        "XMP:Rating": "5",
        "dc:subject": ["tag1;tag2", "tag1"],
    })
    assert rating == 5
    assert "tag1" in tags and "tag2" in tags


def test_norm_map_and_aliases_and_date_created():
    norm = e._build_exif_norm_map({"XMP:Rating": 5, "XMP-Microsoft:Category": "cat"})
    assert norm["xmp:rating"] == 5
    assert norm["rating"] == 5
    assert norm["category"] == "cat"
    assert e._extract_date_created({"CreateDate": "2026:01:01 10:00:00"}) == "2026:01:01 10:00:00"


def test_json_merge_helpers(monkeypatch):
    workflow = {"nodes": []}
    prompt = {"1": {"class_type": "KSampler", "inputs": {}}}

    monkeypatch.setattr(e, "looks_like_comfyui_workflow", lambda v: isinstance(v, dict) and "nodes" in v)
    monkeypatch.setattr(e, "looks_like_comfyui_prompt_graph", lambda v: isinstance(v, dict) and "1" in v)
    monkeypatch.setattr(e, "parse_json_value", lambda v: v)

    wf, pr = e._extract_json_fields({"Workflow": workflow, "Prompt": prompt})
    assert wf == workflow and pr == prompt


def test_build_a1111_geninfo_and_numeric():
    parsed = {
        "prompt": "p",
        "negative_prompt": "n",
        "steps": "20",
        "cfg": "7.5",
        "seed": "42",
        "width": "512",
        "height": "768",
        "model": "C:/m/checkpoint.safetensors",
    }
    out = e._build_a1111_geninfo(parsed)
    assert out and out["positive"]["value"] == "p"
    assert out["size"]["width"] == 512
    assert out["checkpoint"]["name"] == "checkpoint"


def test_apply_common_exif_fields(monkeypatch):
    monkeypatch.setattr(e, "_resolve_workflow_prompt_fields", lambda exif, w, p: (w, p))
    monkeypatch.setattr(e, "_apply_workflow_prompt_quality", lambda m, w, p: m.update({"workflow": w, "prompt": p, "quality": "partial"}))
    monkeypatch.setattr(e, "_apply_reconstructed_workflow_params", lambda m: m.update({"parameters": m.get("parameters") or "x"}))
    monkeypatch.setattr(e, "_apply_rating_tags_and_generation_time", lambda m, exif: m.update({"rating": 4, "tags": ["a"]}))
    monkeypatch.setattr(e, "_apply_dimensions_from_exif", lambda m, exif: m.update({"width": 1, "height": 2}))

    m = {"quality": "none", "workflow": None, "prompt": None, "parameters": None, "width": None, "height": None}
    e._apply_common_exif_fields(m, {"a": 1}, workflow={"nodes": []}, prompt={"1": {}})
    assert m["rating"] == 4 and m["width"] == 1


def test_extract_png_webp_video_not_found(tmp_path):
    missing = str(tmp_path / "missing.png")
    assert e.extract_png_metadata(missing).ok is False
    assert e.extract_webp_metadata(missing).ok is False
    assert e.extract_video_metadata(missing).ok is False


def test_extract_png_webp_video_basic(monkeypatch, tmp_path):
    f = tmp_path / "f.bin"
    f.write_text("x")

    monkeypatch.setattr(e.os.path, "exists", lambda _p: True)
    monkeypatch.setattr(e, "parse_auto1111_params", lambda t: {"prompt": "p"} if t else None)
    monkeypatch.setattr(e, "_apply_common_exif_fields", lambda m, exif, workflow=None, prompt=None: m.update({"quality": "partial", "workflow": workflow, "prompt": prompt}))
    monkeypatch.setattr(e, "_scan_video_workflow_prompt_from_sources", lambda exif, ff: ({"nodes": []}, None, {}, []))

    png = e.extract_png_metadata(str(f), {"PNG:Parameters": "abc"})
    assert png.ok and png.data["quality"] == "partial"

    webp = e.extract_webp_metadata(str(f), {"ImageDescription": "Prompt: test"})
    assert webp.ok

    video = e.extract_video_metadata(str(f), {}, {"video_stream": {"width": 1, "height": 2, "r_frame_rate": "30/1"}, "format": {"duration": "1.0"}})
    assert video.ok and video.data["resolution"] == (1, 2)


def test_video_helpers_collect_candidates():
    m = {"quality": "none"}
    e._apply_video_ffprobe_fields(m, {"video_stream": {"width": 5, "height": 6, "r_frame_rate": "24/1"}, "format": {"duration": "9"}})
    assert m["fps"] == "24/1"

    cands = e._collect_video_text_candidates({"a": "x"}, {"b": "y"}, [{"c": "z"}])
    keys = [k for k, _ in cands]
    assert "a" in keys and "b" in keys and "c" in keys


def test_priority_helpers():
    items = e._priority_sorted_exif_items({"zz": 1, "UserComment": 2})
    assert items[0][0] == "UserComment"
    assert e._is_priority_key("abcWorkflow", ("Workflow",)) is True
    assert e._normalized_json_key("Prompt") == "prompt"
    assert e._looks_like_workflow_prefixed("workflow:{", "x") is True
    assert e._looks_like_prompt_prefixed("prompt:{", "x") is True
