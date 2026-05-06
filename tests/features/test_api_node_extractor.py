from mjr_am_backend.features.geninfo import api_node_extractor as x
from mjr_am_backend.features.geninfo import parser_impl as p

# ---------------------------------------------------------------------------
# Detection helpers
# ---------------------------------------------------------------------------

def test_detect_api_node_known_providers():
    assert x._detect_api_node("geminiimagenode") == "google_gemini"
    assert x._detect_api_node("openaiimagenode") == "openai"
    assert x._detect_api_node("claudenode") == "anthropic"
    assert x._detect_api_node("bytedanceseedancenode") == "bytedance_seedance"
    assert x._detect_api_node("klingtexttovideo") == "kling_ai"
    assert x._detect_api_node("lumaimagetovideo") == "luma_dream_machine"
    assert x._detect_api_node("minimaxhailuo") == "minimax_hailuo"
    assert x._detect_api_node("runwayimagetovideo") == "runway"
    assert x._detect_api_node("vidutexttovideo") == "vidu"
    assert x._detect_api_node("moonvalleytxt2video") == "moonvalley"
    assert x._detect_api_node("pixversetexttovideo") == "pixverse"
    assert x._detect_api_node("ideogramv2") == "ideogram"
    assert x._detect_api_node("recraftv4") == "recraft"
    assert x._detect_api_node("grokimage") == "xai_grok"
    assert x._detect_api_node("ltxvapitext") == "ltxv_api"
    assert x._detect_api_node("elevenlabstextto") == "eleven_labs"
    assert x._detect_api_node("wan2texttovideoapi") == "alibaba_wan"
    assert x._detect_api_node("happyhorseimagetovideoapi") == "happy_horse"
    assert x._detect_api_node("fluxkontext") == "black_forest_labs"
    assert x._detect_api_node("stabilitystableimage") == "stability_ai"
    assert x._detect_api_node("unknownnode") is None


def test_detect_api_node_specificity_order():
    # More specific fragments must match before the broad catch-all
    assert x._detect_api_node("bytedanceseedream") == "bytedance_seedance"
    assert x._detect_api_node("bytedance2referencenode") == "bytedance_seedance"
    assert x._detect_api_node("geminiimage2node") == "google_gemini"
    assert x._detect_api_node("veo3videogeneration") == "google_veo"


def test_provider_from_model_name():
    assert x._provider_from_model_name("seedance-2.0-pro") == "bytedance_seedance"
    assert x._provider_from_model_name("gemini-2.0-flash") == "google_gemini"
    assert x._provider_from_model_name("veo-3") == "google_veo"
    assert x._provider_from_model_name("gpt-4o") == "openai"
    assert x._provider_from_model_name("dall-e-3") == "openai"
    assert x._provider_from_model_name("claude-3-opus") == "anthropic"
    assert x._provider_from_model_name("flux-kontext-pro") == "black_forest_labs"
    assert x._provider_from_model_name("stable-diffusion-xl") == "stability_ai"
    assert x._provider_from_model_name("happyhorse-1.0-i2v") == "happy_horse"
    assert x._provider_from_model_name("wan-2.1") == "alibaba_wan"
    assert x._provider_from_model_name("kling-v2") == "kling_ai"
    assert x._provider_from_model_name("luma-dream-machine") == "luma_dream_machine"
    assert x._provider_from_model_name("minimax-01") == "minimax_hailuo"
    assert x._provider_from_model_name("runway-gen3") == "runway"
    assert x._provider_from_model_name("vidu-q1") == "vidu"
    assert x._provider_from_model_name("ideogram-v3") == "ideogram"
    assert x._provider_from_model_name("recraft-v3") == "recraft"
    assert x._provider_from_model_name("grok-aurora") == "xai_grok"
    assert x._provider_from_model_name("pixverse-v4") == "pixverse"
    assert x._provider_from_model_name("unknown-model-xyz") is None


def test_provider_from_model_name_wan_no_media_type_required():
    # Wan provider must be detected even without "video" or "image" in name
    assert x._provider_from_model_name("wan-2.1-14b") == "alibaba_wan"
    assert x._provider_from_model_name("wanx-turbo") == "alibaba_wan"


# ---------------------------------------------------------------------------
# Node classification
# ---------------------------------------------------------------------------

def test_is_api_image_node_known_class_type():
    node = {"class_type": "GeminiImageNode", "inputs": {}}
    assert x._is_api_image_node(node) is True


def test_is_api_image_node_heuristic_fallback():
    node = {
        "class_type": "CustomExternalGen",
        "inputs": {"prompt": "a cat", "model": "custom-v1"},
    }
    assert x._is_api_image_node(node) is True


def test_is_api_image_node_heuristic_rejects_sampler_node():
    node = {
        "class_type": "CustomSampler",
        "inputs": {"prompt": "a cat", "model": "v1", "cfg": 7.5, "steps": 20},
    }
    assert x._is_api_image_node(node) is False


def test_is_api_image_node_rejects_non_api():
    node = {"class_type": "CLIPTextEncode", "inputs": {"text": "hello"}}
    assert x._is_api_image_node(node) is False


# ---------------------------------------------------------------------------
# Field extraction helpers
# ---------------------------------------------------------------------------

def test_extract_api_node_prompt_priority():
    assert x._extract_api_node_prompt({"prompt": "a cat"}) == "a cat"
    assert x._extract_api_node_prompt({"model.prompt": "a galloping horse"}) == "a galloping horse"
    assert x._extract_api_node_prompt({"text": "a dog"}) == "a dog"
    assert x._extract_api_node_prompt({"positive_prompt": "sun"}) == "sun"
    assert x._extract_api_node_prompt({}) is None
    assert x._extract_api_node_prompt({"prompt": "  "}) is None


def test_extract_api_node_negative():
    assert x._extract_api_node_negative({"negative_prompt": "blur"}) == "blur"
    assert x._extract_api_node_negative({"model.negative_prompt": "washed out"}) == "washed out"
    assert x._extract_api_node_negative({"negative": "ugly"}) == "ugly"
    assert x._extract_api_node_negative({}) is None


def test_extract_api_node_prompt_resolves_linked_text():
    nodes = {
        "1": {"class_type": "PrimitiveStringMultiline", "inputs": {"value": "galloping chrome horse"}},
    }
    assert x._extract_api_node_prompt({"model.prompt": ["1", 0]}, nodes) == "galloping chrome horse"


def test_extract_api_node_model():
    node = {"class_type": "GeminiImageNode"}
    m = x._extract_api_node_model({"model": "gemini-2.0-flash"}, "1", node)
    assert m is not None
    assert m["name"] == "gemini-2.0-flash"
    assert m["confidence"] == "high"
    assert x._extract_api_node_model({}, "1", node) is None
    assert x._extract_api_node_model({"model": "  "}, "1", node) is None


def test_extract_api_system_prompt():
    assert x._extract_api_system_prompt({"system_prompt": "be concise"}) == "be concise"
    assert x._extract_api_system_prompt({"system": "you are helpful"}) == "you are helpful"
    assert x._extract_api_system_prompt({}) is None


# ---------------------------------------------------------------------------
# Engine type refinement
# ---------------------------------------------------------------------------

def test_refine_engine_type_txt2img():
    out = {"engine": {"type": "txt2img"}}
    x._refine_engine_type(out, "openaitexttoimageapi", {})
    assert out["engine"]["type"] == "txt2img"


def test_refine_engine_type_img2vid():
    out = {"engine": {"type": "txt2vid"}}
    x._refine_engine_type(out, "klingimagetovideo", {})
    assert out["engine"]["type"] == "img2vid"


def test_refine_engine_type_img2vid_from_video_with_image_input():
    out = {"engine": {"type": "txt2vid"}}
    x._refine_engine_type(out, "somevideogen", {"image": ["1", 0]})
    assert out["engine"]["type"] == "img2vid"


def test_refine_engine_type_txt2vid_from_video_no_image_input():
    out = {"engine": {"type": "txt2img"}}
    x._refine_engine_type(out, "somevideogen", {"prompt": "a sunset"})
    assert out["engine"]["type"] == "txt2vid"


def test_refine_engine_type_audio():
    out = {"engine": {"type": "txt2img"}}
    x._refine_engine_type(out, "sonilotexttomusic", {})
    assert out["engine"]["type"] == "audio"


# ---------------------------------------------------------------------------
# Seedance helpers
# ---------------------------------------------------------------------------

def test_seedance_size_from_resolution():
    assert x._seedance_size_from_resolution("720p") == (1280, 720)
    assert x._seedance_size_from_resolution("1080p") == (1920, 1080)
    assert x._seedance_size_from_resolution("480p") == (854, 480)
    assert x._seedance_size_from_resolution("4k") == (3840, 2160)
    assert x._seedance_size_from_resolution("360p") is None


def test_seedance_media_type_txt2vid():
    assert x._seedance_media_type({"prompt": "a cat"}) == "txt2vid"


def test_seedance_media_type_img2vid():
    ins = {"model.reference_images": ["1", 0]}
    assert x._seedance_media_type(ins) == "img2vid"


# ---------------------------------------------------------------------------
# Full fallback entry-point
# ---------------------------------------------------------------------------

def _make_gemini_nodes(prompt="a golden retriever in sunlight", model="gemini-2.0-flash-preview-image-generation"):
    return {
        "1": {
            "class_type": "GeminiImageNode",
            "inputs": {"prompt": prompt, "model": model, "seed": 42},
        },
        "2": {"class_type": "SaveImage", "inputs": {"images": ["1", 0]}},
    }


def test_extract_api_node_geninfo_fallback_basic():
    nodes = _make_gemini_nodes()
    result = x._extract_api_node_geninfo_fallback(nodes, None)
    assert result is not None
    assert result["positive"]["value"] == "a golden retriever in sunlight"
    assert result["engine"]["api_provider"] == "google_gemini"
    assert result["engine"]["sampler_mode"] == "api"
    assert result["checkpoint"]["name"] == "gemini-2.0-flash-preview-image-generation"
    assert result["seed"]["value"] == 42


def test_extract_api_node_geninfo_fallback_no_api_nodes():
    nodes = {
        "1": {"class_type": "CLIPTextEncode", "inputs": {"text": "hello"}},
    }
    assert x._extract_api_node_geninfo_fallback(nodes, None) is None


def test_extract_api_node_geninfo_fallback_returns_none_if_no_meaningful_fields():
    # Node is detected as API type but has no extractable data
    nodes = {"1": {"class_type": "GeminiImageNode", "inputs": {}}}
    result = x._extract_api_node_geninfo_fallback(nodes, None)
    assert result is None


def test_extract_api_node_geninfo_fallback_with_workflow_meta():
    nodes = _make_gemini_nodes()
    meta = {"title": "Test Workflow"}
    result = x._extract_api_node_geninfo_fallback(nodes, meta)
    assert result is not None
    assert result.get("metadata") == meta


def test_extract_api_node_geninfo_fallback_multiple_nodes():
    nodes = {
        "1": {
            "class_type": "GeminiImageNode",
            "inputs": {"prompt": "first prompt", "model": "gemini-2.0"},
        },
        "2": {
            "class_type": "OpenAIImageNode",
            "inputs": {"prompt": "second prompt", "model": "dall-e-3"},
        },
        "3": {"class_type": "SaveImage", "inputs": {"images": ["1", 0]}},
    }
    result = x._extract_api_node_geninfo_fallback(nodes, None)
    assert result is not None
    extra = result.get("extra_api_passes", [])
    assert len(extra) == 1
    assert extra[0]["positive"]["value"] == "second prompt"


def test_extract_api_node_geninfo_fallback_openai():
    nodes = {
        "1": {
            "class_type": "OpenAIImageNode",
            "inputs": {"prompt": "a serene mountain lake", "model": "gpt-image-1", "seed": 7},
        },
    }
    result = x._extract_api_node_geninfo_fallback(nodes, None)
    assert result is not None
    assert result["engine"]["api_provider"] == "openai"
    assert result["positive"]["value"] == "a serene mountain lake"


def test_extract_api_node_geninfo_fallback_seedance_dotted_keys():
    nodes = {
        "1": {
            "class_type": "ByteDanceSeedanceNode",
            "inputs": {
                "model": "Seedance 2.0",
                "model.prompt": "cinematic ocean sunset",
                "model.negative_prompt": "blur, noisy",
                "model.resolution": "1080p",
                "model.duration": 5,
                "seed": 99,
            },
        },
    }
    result = x._extract_api_node_geninfo_fallback(nodes, None)
    assert result is not None
    assert result["engine"]["api_provider"] == "bytedance_seedance"
    assert result["positive"]["value"] == "cinematic ocean sunset"
    assert result["negative"]["value"] == "blur, noisy"
    assert result["size"]["width"] == 1920
    assert result["seed"]["value"] == 99


def test_extract_api_node_geninfo_fallback_happy_horse_dotted_keys():
    nodes = {
        "13": {
            "class_type": "HappyHorseImageToVideoApi",
            "inputs": {
                "model": "happyhorse-1.0-i2v",
                "model.prompt": "a happy horse running in a meadow",
                "model.resolution": "720p",
                "model.duration": 5,
                "seed": 962403639,
                "first_frame": ["14", 0],
            },
        },
        "14": {
            "class_type": "LoadImage",
            "inputs": {"image": "horse.png"},
        },
    }
    result = x._extract_api_node_geninfo_fallback(nodes, None)
    assert result is not None
    assert result["engine"]["api_provider"] == "happy_horse"
    assert result["engine"]["type"] == "img2vid"
    assert result["positive"]["value"] == "a happy horse running in a meadow"
    assert result["checkpoint"]["name"] == "happyhorse-1.0-i2v"
    assert result["resolution"]["value"] == "720p"
    assert result["size"]["width"] == 1280
    assert result["size"]["height"] == 720
    assert result["duration"]["value"] == 5
    assert result["seed"]["value"] == 962403639


def test_extract_api_node_geninfo_fallback_with_negative_prompt():
    nodes = {
        "1": {
            "class_type": "StabilityStableImage",
            "inputs": {
                "prompt": "portrait of a warrior",
                "negative_prompt": "ugly, deformed",
                "model": "stable-diffusion-xl-1024-v1-0",
            },
        },
    }
    result = x._extract_api_node_geninfo_fallback(nodes, None)
    assert result is not None
    assert result["negative"]["value"] == "ugly, deformed"


def test_extract_api_node_geninfo_fallback_size_from_width_height():
    nodes = {
        "1": {
            "class_type": "RecraftV4",
            "inputs": {"prompt": "abstract art", "model": "recraft-v3", "width": 1024, "height": 768},
        },
    }
    result = x._extract_api_node_geninfo_fallback(nodes, None)
    assert result is not None
    assert result["size"]["width"] == 1024
    assert result["size"]["height"] == 768


def test_extract_api_node_geninfo_fallback_wan_provider():
    nodes = {
        "1": {
            "class_type": "Wan2TextToVideoAPI",
            "inputs": {"prompt": "a butterfly emerging from cocoon", "model": "wan-2.1"},
        },
    }
    result = x._extract_api_node_geninfo_fallback(nodes, None)
    assert result is not None
    assert result["engine"]["api_provider"] == "alibaba_wan"


def test_extract_api_node_geninfo_fallback_aspect_ratio():
    nodes = {
        "1": {
            "class_type": "KlingTextToVideo",
            "inputs": {"prompt": "flying eagle", "model": "kling-v2", "aspect_ratio": "16:9"},
        },
    }
    result = x._extract_api_node_geninfo_fallback(nodes, None)
    assert result is not None
    assert result.get("aspect_ratio", {}).get("value") == "16:9"


def test_extract_api_node_geninfo_fallback_full_integration_via_parser():
    """End-to-end: parse_geninfo_from_prompt must surface API node data when no sampler present."""
    nodes = {
        "1": {
            "class_type": "GeminiImageNode",
            "inputs": {"prompt": "a red fox in a snowy forest", "model": "gemini-2.0-flash", "seed": 12},
        },
        "2": {"class_type": "SaveImage", "inputs": {"images": ["1", 0]}},
    }
    res = p.parse_geninfo_from_prompt(nodes)
    assert res.ok
    data = res.data
    assert isinstance(data, dict)
    assert data.get("positive", {}).get("value") == "a red fox in a snowy forest"
    assert data.get("engine", {}).get("api_provider") == "google_gemini"


def test_parse_geninfo_from_prompt_surfaces_linked_happy_horse_prompt():
    nodes = {
        "1": {"class_type": "PrimitiveStringMultiline", "inputs": {"value": "cinematic happy horse across a foggy valley"}},
        "13": {
            "class_type": "HappyHorseImageToVideoApi",
            "inputs": {
                "model": "happyhorse-1.0-i2v",
                "model.prompt": ["1", 0],
                "model.resolution": "720P",
                "model.duration": 5,
                "seed": 962403639,
                "first_frame": ["14", 0],
            },
        },
        "14": {"class_type": "LoadImage", "inputs": {"image": "horse.png"}},
        "15": {"class_type": "VHS_VideoCombine", "inputs": {"images": ["13", 0]}},
    }

    res = p.parse_geninfo_from_prompt(nodes)
    assert res.ok
    data = res.data
    assert isinstance(data, dict)
    assert data.get("engine", {}).get("api_provider") == "happy_horse"
    assert data.get("positive", {}).get("value") == "cinematic happy horse across a foggy valley"
    assert data.get("checkpoint", {}).get("name") == "happyhorse-1.0-i2v"
