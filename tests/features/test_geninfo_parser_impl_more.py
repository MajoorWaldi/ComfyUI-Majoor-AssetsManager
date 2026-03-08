from mjr_am_backend.features.geninfo import parser_impl as p
from mjr_am_backend.features.geninfo import upscaler_extractor as u


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


def test_parse_geninfo_subgraph_uuid_pipeline_yields_chained_passes():
    workflow = {
        "nodes": [
            {
                "id": 10,
                "type": "uuid-base",
                "title": "Base Custom Sampler",
                "inputs": [
                    {"name": "model", "link": 100},
                    {"name": "positive", "link": 101},
                    {"name": "negative", "link": 102},
                ],
                "widgets_values": [],
            },
            {
                "id": 20,
                "type": "uuid-detailer",
                "title": "Detailer",
                "inputs": [
                    {"name": "image", "link": 200},
                    {"name": "model", "link": 100},
                    {"name": "positive", "link": 101},
                    {"name": "negative", "link": 102},
                ],
                "widgets_values": [],
            },
            {
                "id": 30,
                "type": "SaveImage",
                "inputs": [
                    {"name": "images", "link": 300},
                ],
                "widgets_values": ["ComfyUI"],
            },
            {"id": 40, "type": "CheckpointLoaderSimple", "inputs": [], "widgets_values": ["m.safetensors"]},
            {"id": 41, "type": "CLIPTextEncode", "inputs": [{"name": "text", "widget": True}], "widgets_values": ["pos"]},
            {"id": 42, "type": "CLIPTextEncode", "inputs": [{"name": "text", "widget": True}], "widgets_values": ["neg"]},
        ],
        "links": [
            [100, 40, 0, 10, 0, "MODEL"],
            [101, 41, 0, 10, 1, "CONDITIONING"],
            [102, 42, 0, 10, 2, "CONDITIONING"],
            [200, 10, 0, 20, 0, "IMAGE"],
            [300, 20, 0, 30, 0, "IMAGE"],
        ],
        "definitions": {
            "subgraphs": [
                {"id": "uuid-base", "name": "Base Custom Sampler"},
                {"id": "uuid-detailer", "name": "Detailer"},
            ]
        },
    }

    res = p.parse_geninfo_from_prompt(None, workflow=workflow)
    assert res.ok and isinstance(res.data, dict)
    chained = res.data.get("chained_passes") or []
    assert len(chained) >= 2
    assert chained[0].get("pass_name") == "Base"
    assert any(item.get("pass_name") == "Detailer" for item in chained)


def test_prompt_extracted_through_show_text_cached_output():
    """ShowText|pysssss stores its cached text output as text_0.
    The prompt tracer must pick that up before following deeper links that
    could resolve to unrelated scalars (e.g. a seed on the LLM enhancer node)."""
    nodes = {
        "1": {
            "class_type": "AILab_QwenVL_GGUF_PromptEnhancer",
            "inputs": {"model_name": "model.gguf", "seed": 1670561155, "prompt_text": ["2", 0]},
        },
        "10": {
            "class_type": "ShowText|pysssss",
            "inputs": {
                "text": ["1", 0],
                "text_0": "A beautiful landscape with mountains and clouds in golden light.",
            },
        },
        "20": {
            "class_type": "CLIPTextEncode",
            "inputs": {"text": ["10", 0], "clip": ["30", 0]},
        },
        "30": {"class_type": "CLIPLoader", "inputs": {"clip_name": "clip.safetensors"}},
        "40": {
            "class_type": "KSampler",
            "inputs": {
                "seed": 999,
                "steps": 10,
                "cfg": 7.0,
                "sampler_name": "euler",
                "scheduler": "normal",
                "denoise": 1.0,
                "model": ["30", 0],
                "positive": ["20", 0],
                "negative": ["50", 0],
                "latent_image": ["60", 0],
            },
        },
        "50": {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["20", 0]}},
        "60": {"class_type": "EmptyLatentImage", "inputs": {"width": 512, "height": 512, "batch_size": 1}},
        "70": {"class_type": "SaveImage", "inputs": {"images": ["40", 0]}},
    }

    res = p.parse_geninfo_from_prompt(nodes)
    assert res.ok
    data = res.data
    assert isinstance(data, dict)
    pos = data.get("positive", {})
    assert "landscape" in pos.get("value", "").lower()


def test_upscaler_extractor_is_standalone_upscaler_node():
    upscaler = {"class_type": "SeedVR2TilingUpscaler", "inputs": {"image": ["5", 0], "dit": ["1", 0]}}
    latent_upscaler = {"class_type": "LatentUpscale", "inputs": {"samples": ["1", 0]}}
    no_image = {"class_type": "MyUpscaler", "inputs": {"data": ["1", 0]}}

    assert u._is_standalone_upscaler_node(upscaler) is True
    assert u._is_standalone_upscaler_node(latent_upscaler) is False
    assert u._is_standalone_upscaler_node(no_image) is False


def test_upscaler_extractor_extracts_primary_model():
    nodes = {
        "1": {
            "class_type": "SeedVR2LoadDiTModel",
            "inputs": {"model": "seedvr2_ema_3b_fp8_e4m3fn.safetensors", "device": "cuda:0"},
        },
        "3": {
            "class_type": "SeedVR2TilingUpscaler",
            "inputs": {"image": ["5", 0], "dit": ["1", 0], "vae": ["4", 0], "seed": 100, "new_resolution": 4096},
        },
        "4": {
            "class_type": "SeedVR2LoadVAEModel",
            "inputs": {"model": "ema_vae_fp16.safetensors"},
        },
    }
    ins = nodes["3"]["inputs"]
    model = u._extract_upscaler_primary_model(nodes, ins)
    assert model is not None
    assert model["name"] == "seedvr2_ema_3b_fp8_e4m3fn"
    assert "SeedVR2LoadDiTModel" in model["source"]


def test_upscaler_extractor_extracts_vae():
    nodes = {
        "4": {"class_type": "SeedVR2LoadVAEModel", "inputs": {"model": "ema_vae_fp16.safetensors"}},
        "3": {"class_type": "SeedVR2TilingUpscaler", "inputs": {"image": ["5", 0], "vae": ["4", 0]}},
    }
    ins = nodes["3"]["inputs"]
    vae = u._extract_upscaler_vae(nodes, ins)
    assert vae is not None
    assert vae["name"] == "ema_vae_fp16"


def test_upscaler_extractor_extracts_size():
    node = {"class_type": "SeedVR2TilingUpscaler", "inputs": {"new_resolution": 4096}}
    ins = node["inputs"]
    size = u._extract_upscaler_size(ins, "3", node)
    assert size is not None
    assert size["width"] == 4096 and size["height"] == 4096


def test_parse_geninfo_seedvr2_upscaler_workflow():
    """Full integration test: SeedVR2 upscaler prompt graph produces a geninfo payload."""
    prompt = {
        "1": {
            "class_type": "SeedVR2LoadDiTModel",
            "inputs": {
                "model": "seedvr2_ema_3b_fp8_e4m3fn.safetensors",
                "device": "cuda:0",
                "blocks_to_swap": 0,
                "attention_mode": "sdpa",
            },
        },
        "3": {
            "class_type": "SeedVR2TilingUpscaler",
            "inputs": {
                "seed": 100,
                "new_resolution": 4096,
                "tile_width": 512,
                "tile_height": 512,
                "tiling_strategy": "Chess",
                "image": ["5", 0],
                "dit": ["1", 0],
                "vae": ["4", 0],
            },
        },
        "4": {
            "class_type": "SeedVR2LoadVAEModel",
            "inputs": {"model": "ema_vae_fp16.safetensors", "device": "cuda:0"},
        },
        "5": {
            "class_type": "LoadImage",
            "inputs": {"image": "input_image.png"},
        },
        "6": {
            "class_type": "SaveImage",
            "inputs": {"images": ["3", 0], "filename_prefix": "output_"},
        },
    }

    res = p.parse_geninfo_from_prompt(prompt)
    assert res.ok
    data = res.data
    assert isinstance(data, dict)

    # Engine metadata
    engine = data.get("engine", {})
    assert engine.get("sampler_mode") == "upscaler"
    assert engine.get("type") == "I2I"

    # Primary upscaler model
    ckpt = data.get("checkpoint", {})
    assert ckpt.get("name") == "seedvr2_ema_3b_fp8_e4m3fn"

    # VAE
    vae = data.get("vae", {})
    assert vae.get("name") == "ema_vae_fp16"

    # Seed
    seed = data.get("seed", {})
    assert seed.get("value") == 100

    # Size
    size = data.get("size", {})
    assert size.get("width") == 4096 and size.get("height") == 4096

    # Sampler name = upscaler node type
    sampler = data.get("sampler", {})
    assert "SeedVR2TilingUpscaler" in sampler.get("name", "")

    # Input files (LoadImage)
    inputs = data.get("inputs", [])
    assert any(f.get("filename") == "input_image.png" for f in inputs)
