import pytest

from mjr_am_backend.features.geninfo import parser_impl as p


def test_sink_priority_helpers():
    node_v = {"class_type": "SaveVideo", "inputs": {"video": ["1", 0]}}
    node_i = {"class_type": "SaveImage", "inputs": {"images": ["1", 0]}}
    assert p._sink_is_video("savevideo") is True
    assert p._sink_is_audio("saveaudio") is True
    assert p._sink_is_image("saveimage") is True
    assert p._sink_is_preview("previewimage") is True
    assert p._sink_group("savevideo") < p._sink_group("saveimage")
    assert p._sink_priority(node_v, "5")[0] == 0
    assert p._sink_images_tiebreak(node_i) == 0
    assert p._sink_node_id_tiebreak("10") == -10


def test_core_scalar_and_link_helpers():
    assert p._clean_model_id("C:/m/model.safetensors") == "model"
    assert p._to_int("12") == 12
    assert p._is_link(["1", 0]) is True
    assert p._resolve_link(["1", 0]) == ("1", 0)
    assert p._node_type({"class_type": "X"}) == "X"
    assert p._inputs({"inputs": {"a": 1}}) == {"a": 1}
    assert p._lower("A") == "a"


def test_prompt_string_helpers():
    assert p._is_numeric_like_text("12, 34") is True
    assert p._has_control_chars("a\x01") is True
    assert p._looks_like_prompt_string("this is prompt text") is True
    assert p._looks_like_prompt_string("12345") is False


def test_walk_passthrough_and_reroute():
    nodes = {
        "1": {"class_type": "Reroute", "inputs": {"x": ["2", 0]}},
        "2": {"class_type": "Reroute", "inputs": {"x": ["3", 0]}},
        "3": {"class_type": "KSampler", "inputs": {}},
    }
    assert p._is_reroute(nodes["1"]) is True
    assert p._walk_passthrough(nodes, ["1", 0]) == "3"


def test_field_helpers():
    assert p._field(None, "h", "s") is None
    assert p._field(1, "h", "s")["value"] == 1
    assert p._field_name("n", "h", "s")["name"] == "n"
    assert p._field_size(1, 2, "h", "s")["width"] == 1


def test_pick_sink_inputs_and_find_candidate_sinks():
    n = {"inputs": {"images": ["1", 0], "x": ["2", 0]}}
    assert p._pick_sink_inputs(n) == ["1", 0]

    nodes = {
        "1": {"class_type": "SaveImage", "inputs": {}},
        "2": {"class_type": "CustomSaveVideo", "inputs": {}},
        "3": {"class_type": "Nope", "inputs": {}},
    }
    out = p._find_candidate_sinks(nodes)
    assert "1" in out and "2" in out and "3" not in out


def test_collect_upstream_nodes_bfs():
    nodes = {
        "3": {"inputs": {"a": ["2", 0]}},
        "2": {"inputs": {"a": ["1", 0]}},
        "1": {"inputs": {}},
    }
    dist = p._collect_upstream_nodes(nodes, "3", max_nodes=10, max_depth=10)
    assert dist["3"] == 0 and dist["1"] == 2


def test_sampler_detection_helpers():
    k = {"class_type": "KSampler", "inputs": {"steps": 20, "cfg": 7, "seed": 1}}
    c = {"class_type": "MySampler", "inputs": {"model": ["1", 0]}}
    a = {"class_type": "SamplerCustomAdvanced", "inputs": {"guider": ["1", 0], "sigmas": ["2", 0]}}
    assert p._is_named_sampler_type("ksampler") is True
    assert p._has_core_sampler_signature(k) is True
    assert p._is_custom_sampler(c, "mysampler") is True
    assert p._is_advanced_sampler(a) is True
    assert p._is_sampler(k) is True


def test_loader_and_input_kind_helpers():
    assert p._looks_like_loader_filename("x.png") is True
    assert p._looks_like_loader_filename("a") is False
    assert p._workflow_sink_suffix("saveaudio") == "A"
    assert p._is_image_loader_node_type("loadimage") is True
    assert p._is_video_loader_node_type("loadvideo") is True
    assert p._is_audio_loader_node_type("loadaudio") is True


def test_extract_input_files_and_scan_kinds():
    nodes = {
        "1": {"class_type": "LoadImage", "inputs": {"image": "a.png", "subfolder": "", "type": "input"}},
        "2": {"class_type": "LoadVideo", "inputs": {"video": "b.mp4"}},
        "3": {"class_type": "LoadAudio", "inputs": {"audio": "c.mp3"}},
    }
    files = p._extract_input_files(nodes)
    assert len(files) >= 2

    img, vid, aud = p._scan_graph_input_kinds(nodes)
    assert img is True and vid is True and aud is True


def test_litegraph_normalization_helpers():
    workflow = {
        "nodes": [
            {"id": 1, "type": "TextEncode", "inputs": [{"name": "text", "link": None, "widget": True}], "widgets_values": ["hello world text"]},
            {"id": 2, "type": "KSampler", "inputs": [{"name": "model", "link": 10}], "widgets_values": []},
        ],
        "links": [[10, 1, 0, 2, 0, "MODEL"]],
    }
    link_map = p._build_link_source_map(workflow["links"])
    assert link_map[10] == (1, 0)

    node = p._convert_litegraph_node(workflow["nodes"][0], link_map)
    assert "inputs" in node

    by_id = p._normalize_graph_input(None, workflow)
    assert by_id and "1" in by_id and "2" in by_id


def test_resolve_graph_target_and_metadata_only_result():
    assert p._resolve_graph_target({"1": {}}, None) == {"1": {}}
    assert p._resolve_graph_target(None, {"nodes": []}) == {"nodes": []}
    assert p._resolve_graph_target(None, None) is None

    assert p._geninfo_metadata_only_result({"a": 1}).ok
    assert p._geninfo_metadata_only_result(None).ok


def test_set_field_helpers():
    out = {}
    p._set_named_field(out, "sampler", "Euler", "x")
    p._set_value_field(out, "steps", 20, "x")
    assert out["sampler"]["name"] == "Euler"
    assert out["steps"]["value"] == 20


def test_find_tts_nodes_helpers():
    nodes = {
        "1": {"class_type": "UnifiedTTSTextNode", "inputs": {}},
        "2": {"class_type": "TTSEngine", "inputs": {}},
    }
    t_id, t_node, e_id, e_node = p._find_tts_nodes(nodes)
    assert t_id == "1" and e_id == "2"
    assert p._is_tts_text_node_type("tts_text_node") is True
    assert p._is_tts_engine_node_type("ttsengine") is True


def test_parse_geninfo_from_prompt_guard_paths():
    out1 = p.parse_geninfo_from_prompt(None)
    assert out1.ok

    out2 = p.parse_geninfo_from_prompt({"1": {"class_type": "NoSink", "inputs": {}}})
    assert out2.ok


def test_tts_widget_and_direct_helpers(monkeypatch):
    out = {}
    p._apply_tts_text_direct_fields(
        out,
        {
            "text": "hello tts",
            "seed": 12,
            "narrator_voice": "Alice",
            "batch_size": 2,
        },
        "src",
    )
    assert out["positive"]["value"] == "hello tts"
    assert out["seed"]["value"] == 12
    assert out["voice"]["name"] == "Alice"

    out2 = {}
    p._apply_tts_text_widget_fallback(out2, ["short", "VoiceA", 42, "a very long prompt text for fallback"], "src")
    assert "positive" in out2 and "seed" in out2

    assert p._first_long_widget_text(["x", "this is long enough text"]) == "this is long enough text"
    assert p._first_nonnegative_int_scalar(["x", -1, 5]) == 5
    assert p._widget_voice_name(["x", "VoiceA"]) == "VoiceA"


def test_tts_narrator_and_engine_helpers(monkeypatch):
    nodes = {"2": {"class_type": "NarratorNode", "inputs": {"voice_name": "NarratorX"}}}
    monkeypatch.setattr(p, "_is_link", lambda v: True)
    monkeypatch.setattr(p, "_walk_passthrough", lambda nodes_by_id, link, max_hops=50: "2")

    out = {}
    p._apply_tts_narrator_link_voice(out, nodes, {"opt_narrator": ["1", 0]})
    assert isinstance(out, dict)

    out2 = {}
    p._apply_tts_engine_direct_fields(
        out2,
        {"model": "C:/m/ckpt.safetensors", "language": "fr", "top_k": 50},
        "engine",
    )
    assert out2["checkpoint"]["name"] == "ckpt"
    assert out2["language"]["value"] == "fr"
    assert out2["top_k"]["value"] == 50

    out3 = {}
    node = {"class_type": "Qwen3TTSEngine", "widgets_values": ["q.safetensors", "cuda", "voiceA", "en", "", 5, 0.9, 0.7, 1.1, 128]}
    p._apply_tts_engine_widget_fields(out3, node, "engine")
    assert "checkpoint" in out3 and "language" in out3 and "device" in out3


def test_extract_tts_fallback_and_no_sampler(monkeypatch):
    nodes = {
        "1": {"class_type": "UnifiedTTSTextNode", "inputs": {"text": "hello world"}},
        "2": {"class_type": "TTSEngine", "inputs": {"model": "m.safetensors"}},
    }
    monkeypatch.setattr(p, "_extract_input_files", lambda nodes_by_id: [{"filename": "a.wav"}])
    out = p._extract_tts_geninfo_fallback(nodes, {"workflow_type": "audio"})
    assert out and out["engine"]["type"] == "tts"

    monkeypatch.setattr(p, "_extract_tts_geninfo_fallback", lambda n, w: None)
    out2 = p._build_no_sampler_result(nodes, {"workflow_type": "audio"})
    assert out2.ok and out2.data.get("metadata")


def test_prompt_source_and_conditioning_helpers(monkeypatch):
    assert p._source_from_items([]) is None
    assert p._source_from_items([("p1", "s1"), ("p2", "s1")])[0] == "p1\np2"
    assert "(+1)" in p._source_from_items([("p1", "s1"), ("p2", "s2")])[1]

    out = p._extract_prompt_from_conditioning({}, ["1", 0], branch="positive")
    assert out is None or isinstance(out, tuple)


def test_select_sampler_context_and_special(monkeypatch):
    sid, conf, mode = p._select_sampler_context({}, "1")
    assert mode in {"primary", "advanced", "global", "fallback"}
    assert conf in {"none", "low", "medium", "high"}
    assert sid is None or isinstance(sid, str)
