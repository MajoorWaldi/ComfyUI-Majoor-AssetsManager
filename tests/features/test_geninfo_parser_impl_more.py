from mjr_am_backend.features.geninfo import parser_impl as p


def test_ksampler_widget_and_widget_value_helpers():
    node = {"class_type": "KSampler", "widgets_values": [1, "x", 20, 7.5, "euler", "normal", 1.0]}
    out = p._extract_ksampler_widget_params(node)
    assert out["seed"] == 1 and out["steps"] == 20 and out["cfg"] == 7.5
    assert p._widget_value_at([1], 2) is None


def test_lyrics_extractors_and_fallbacks():
    nodes = {"1": {"class_type": "AceStep15TaskTextEncode", "inputs": {"task_text": "hello lyrics", "lyrics_strength": 0.8}}}
    lyr, strength, src = p._extract_lyrics_from_prompt_nodes(nodes)
    assert lyr == "hello lyrics" and strength == 0.8 and "1" in src

    l2, s2 = p._apply_lyrics_widget_fallback(["x", "from_widget", 0.5], None, None)
    assert l2 == "from_widget" and s2 == 0.5
    l3, s3 = p._apply_lyrics_widget_fallback({"lyrics": "from_dict", "lyrics_strength": 0.9}, None, None)
    assert l3 == "from_dict" and s3 == 0.9


def test_scalar_link_and_text_extraction_helpers(monkeypatch):
    nodes = {"2": {"class_type": "Primitive", "inputs": {"value": 42}}, "3": {"class_type": "TextEncode", "inputs": {"text": "hello"}}}
    monkeypatch.setattr(p, "_walk_passthrough", lambda *_args, **_kwargs: "2")
    assert p._resolve_scalar_from_link(nodes, ["2", 0]) == 42

    monkeypatch.setattr(p, "_walk_passthrough", lambda *_args, **_kwargs: "3")
    txt = p._extract_text(nodes, ["3", 0])
    assert txt and txt[0] == "hello"


def test_parse_geninfo_from_litegraph_and_metadata_only():
    workflow = {
        "nodes": [
            {"id": 1, "type": "LoadImage", "inputs": [{"name": "image", "widget": True}], "widgets_values": ["a.png"]},
            {"id": 2, "type": "SaveImage", "inputs": [{"name": "images", "link": 10}]},
        ],
        "links": [[10, 1, 0, 2, 0, "IMAGE"]],
    }
    out = p.parse_geninfo_from_prompt(None, workflow=workflow)
    assert out.ok

    out2 = p.parse_geninfo_from_prompt(None, workflow={"x": 1})
    assert out2.ok


def test_conditioning_text_encoder_helpers(monkeypatch):
    n_text = {"class_type": "CLIPTextEncode", "inputs": {"clip": ["9", 0], "text": "hello"}}
    n_cond = {"class_type": "ConditioningCombine", "inputs": {"positive": ["1", 0], "negative": ["2", 0]}}
    n_zero = {"class_type": "ConditioningZeroOut", "inputs": {"positive": ["1", 0]}}
    assert p._looks_like_text_encoder(n_text) is True
    assert p._looks_like_conditioning_text({"class_type": "PromptNode", "inputs": {"text": "hello world"}}) is True
    assert p._conditioning_should_expand(n_cond, branch=None) is True
    assert p._conditioning_should_expand(n_zero, branch="negative") is False
    assert p._conditioning_key_allowed("positive_prompt", "negative") is False

    nodes = {
        "10": n_cond,
        "1": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["9", 0], "text": "pos prompt"}},
        "2": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["9", 0], "text": "neg prompt"}},
    }
    monkeypatch.setattr(p, "_walk_passthrough", lambda _nodes, link, max_hops=50: str(link[0]) if isinstance(link, list) else None)
    ids = p._collect_text_encoder_nodes_from_conditioning(nodes, ["10", 0], branch=None)
    assert "1" in ids and "2" in ids
    txt = p._collect_texts_from_conditioning(nodes, ["10", 0], branch="positive")
    assert txt and "prompt" in txt[0][0]


def test_frontier_and_model_lora_helpers(monkeypatch):
    nodes = {"1": {}, "2": {}}
    stack = []
    visited = set()
    monkeypatch.setattr(p, "_walk_passthrough", lambda _n, v, max_hops=50: str(v[0]) if isinstance(v, list) else None)
    p._expand_conditioning_frontier(nodes, stack, visited, {"positive": ["1", 0], "negative": ["2", 0]}, depth=0, branch="positive")
    assert stack and stack[0][0] == "1"

    assert p._first_model_string_from_inputs({"model": "x.safetensors"}) == "x.safetensors"
    assert p._first_model_string_from_inputs({"any": "C:/m/model.ckpt"}).lower().endswith(".ckpt")
    assert p._is_lora_loader_node("loraloader", {"model": ["1", 0], "lora_name": "x"}) is True
