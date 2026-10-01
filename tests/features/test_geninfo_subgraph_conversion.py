from mjr_am_backend.features.geninfo import graph_converter as gc
from mjr_am_backend.features.geninfo.sampler_tracer import _sampler_name_from_class_type
from mjr_am_backend.features.geninfo.parser import parse_geninfo_from_prompt


def _inner_subgraph(sg_id: str, name: str) -> dict:
    # inputs: [text]; outputs: [CONDITIONING]. Dict-form links, as written by the current frontend.
    return {
        "id": sg_id,
        "name": name,
        "inputs": [{"name": "text", "type": "STRING", "linkIds": [1]}],
        "outputs": [{"name": "cond", "type": "CONDITIONING", "linkIds": [2]}],
        "nodes": [
            {"id": 6, "type": "CLIPTextEncode", "inputs": [{"name": "text", "type": "STRING", "link": 1}], "widgets_values": []},
        ],
        "links": [
            {"id": 1, "origin_id": -10, "origin_slot": 0, "target_id": 6, "target_slot": 0, "type": "STRING"},
            {"id": 2, "origin_id": 6, "origin_slot": 0, "target_id": -20, "target_slot": 0, "type": "CONDITIONING"},
        ],
    }


def test_dict_links_inside_subgraph_bridge_inputs_and_outputs():
    workflow = {
        "nodes": [
            {"id": 1, "type": "PrimitiveString", "widgets_values": ["a cat"], "inputs": []},
            {"id": 2, "type": "sg-a", "inputs": [{"name": "text", "type": "STRING", "link": 10}]},
            {"id": 3, "type": "SaveImage", "inputs": [{"name": "images", "type": "IMAGE", "link": 11}]},
        ],
        "links": [[10, 1, 0, 2, 0, "STRING"], [11, 2, 0, 3, 0, "CONDITIONING"]],
        "definitions": {"subgraphs": [_inner_subgraph("sg-a", "Prompt")]},
    }

    nodes = gc._normalize_graph_input(None, workflow)

    assert nodes["2:6"]["inputs"]["text"] == ["1", 0]
    assert nodes["3"]["inputs"]["images"] == ["2:6", 0]


def test_nested_subgraph_definitions_are_expanded():
    inner = _inner_subgraph("sg-inner", "Inner")
    outer = {
        "id": "sg-outer",
        "name": "Outer",
        "inputs": [],
        "outputs": [{"name": "cond", "type": "CONDITIONING", "linkIds": [5]}],
        "nodes": [{"id": 9, "type": "sg-inner", "inputs": [{"name": "text", "type": "STRING", "link": None}]}],
        "links": [{"id": 5, "origin_id": 9, "origin_slot": 0, "target_id": -20, "target_slot": 0, "type": "CONDITIONING"}],
    }
    workflow = {
        "nodes": [
            {"id": 4, "type": "sg-outer", "inputs": []},
            {"id": 3, "type": "SaveImage", "inputs": [{"name": "images", "type": "IMAGE", "link": 11}]},
        ],
        "links": [[11, 4, 0, 3, 0, "CONDITIONING"]],
        "definitions": {"subgraphs": [inner, outer]},
    }

    nodes = gc._normalize_graph_input(None, workflow)

    assert nodes["4:9:6"]["class_type"] == "CLIPTextEncode"
    assert nodes["3"]["inputs"]["images"] == ["4:9:6", 0]


def test_linked_widget_input_keeps_its_widgets_values_slot():
    node = {
        "id": 1,
        "type": "Flux2Scheduler",
        "inputs": [
            {"name": "steps", "type": "INT", "widget": {"name": "steps"}, "link": 7},
            {"name": "width", "type": "INT", "widget": {"name": "width"}, "link": None},
            {"name": "height", "type": "INT", "widget": {"name": "height"}, "link": None},
        ],
        "widgets_values": [20, 1024, 768],
    }

    converted = gc._convert_litegraph_node(node, {7: (5, 0)})

    assert converted["inputs"] == {"steps": ["5", 0], "width": 1024, "height": 768}


def test_control_after_generate_value_does_not_shift_widgets():
    node = {
        "id": 1,
        "type": "KSampler",
        "inputs": [
            {"name": "seed", "type": "INT", "widget": {"name": "seed"}, "link": None},
            {"name": "steps", "type": "INT", "widget": {"name": "steps"}, "link": None},
        ],
        "widgets_values": [123, "randomize", 30],
    }

    assert gc._convert_litegraph_node(node, {})["inputs"] == {"seed": 123, "steps": 30}


def test_core_media_sinks_missed_by_keyword_heuristic_are_recognized():
    for sink in (
        "SaveAnimatedPNG", "SaveWEBM", "SaveSVGNode", "SaveGaussianSplat", "SavePointCloud",
        "PreviewGaussianSplat", "PreviewPointCloud",
    ):
        assert gc._is_sink_node(sink.lower()), sink
    assert gc._workflow_sink_suffix("savewebm") == "V"
    assert gc._workflow_sink_suffix("savegaussiansplat") == "3D"
    assert not gc._is_sink_node("imageonlycheckpointsave")


def test_sampler_name_is_derived_from_sampler_selector_class_type():
    assert _sampler_name_from_class_type("SamplerEulerAncestral") == "euler_ancestral"
    assert _sampler_name_from_class_type("SamplerDPMPP_2M_SDE") == "dpmpp_2m_sde"
    assert _sampler_name_from_class_type("SamplerLCM") == "lcm"
    assert _sampler_name_from_class_type("SamplerCustomAdvanced") is None
    assert _sampler_name_from_class_type("KSamplerSelect") is None


def test_advanced_sampler_name_comes_from_selector_class():
    prompt = {
        "1": {"class_type": "SamplerEulerAncestral", "inputs": {"eta": 0, "s_noise": 1}},
        "2": {"class_type": "RandomNoise", "inputs": {"noise_seed": 42}},
        "3": {"class_type": "BasicScheduler", "inputs": {"steps": 8, "scheduler": "simple", "denoise": 1.0}},
        "4": {"class_type": "CFGGuider", "inputs": {"cfg": 1.0}},
        "5": {
            "class_type": "SamplerCustomAdvanced",
            "inputs": {"noise": ["2", 0], "guider": ["4", 0], "sampler": ["1", 0], "sigmas": ["3", 0], "latent_image": ["7", 0]},
        },
        "6": {"class_type": "VAEDecode", "inputs": {"samples": ["5", 0]}},
        "7": {"class_type": "EmptyLatentImage", "inputs": {"width": 512, "height": 512}},
        "8": {"class_type": "SaveImage", "inputs": {"images": ["6", 0]}},
    }

    result = parse_geninfo_from_prompt(prompt)

    assert result.ok
    assert result.data["sampler"]["name"] == "euler_ancestral"
    assert result.data["seed"]["value"] == 42


def _two_branch_prompt() -> dict:
    def branch(offset: int, seed: int, text: str) -> dict:
        n = str(offset)
        return {
            f"{n}1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "a.safetensors"}},
            f"{n}2": {"class_type": "CLIPTextEncode", "inputs": {"text": text, "clip": [f"{n}1", 1]}},
            f"{n}3": {"class_type": "EmptyLatentImage", "inputs": {"width": 512, "height": 512}},
            f"{n}4": {
                "class_type": "KSampler",
                "inputs": {
                    "seed": seed, "steps": 20, "cfg": 7.0, "sampler_name": "euler", "scheduler": "normal",
                    "denoise": 1.0, "model": [f"{n}1", 0], "positive": [f"{n}2", 0], "negative": [f"{n}2", 0],
                    "latent_image": [f"{n}3", 0],
                },
            },
            f"{n}5": {"class_type": "VAEDecode", "inputs": {"samples": [f"{n}4", 0], "vae": [f"{n}1", 2]}},
            f"{n}6": {"class_type": "SaveImage", "inputs": {"images": [f"{n}5", 0]}},
        }

    return {**branch(1, 111, "first cat"), **branch(2, 222, "second dog")}


def test_sink_node_id_selects_the_requested_branch():
    prompt = _two_branch_prompt()

    first = parse_geninfo_from_prompt(prompt, sink_node_id="16").data
    second = parse_geninfo_from_prompt(prompt, sink_node_id="26").data

    assert (first["seed"]["value"], first["positive"]["value"]) == (111, "first cat")
    assert (second["seed"]["value"], second["positive"]["value"]) == (222, "second dog")


def test_unknown_sink_node_id_falls_back_to_default_selection():
    result = parse_geninfo_from_prompt(_two_branch_prompt(), sink_node_id="999")

    assert result.ok and result.data["seed"]["value"] in (111, 222)


def test_runtime_metadata_payload_is_parsed_per_output_node(monkeypatch):
    from mjr_am_backend.features.runtime import post_execution as mod

    prompt = _two_branch_prompt()
    monkeypatch.setattr(mod, "get_prompt_metadata_for_prompt", lambda _pid: {"prompt": prompt, "workflow": None})

    first = mod._runtime_metadata_payload("p1", "16")
    second = mod._runtime_metadata_payload("p1", "26")

    assert first["geninfo"]["seed"]["value"] == 111
    assert second["geninfo"]["seed"]["value"] == 222


def test_single_node_prompt_is_recognized_as_a_prompt_graph():
    from mjr_am_backend.features.metadata.parsing_utils import looks_like_comfyui_prompt_graph

    assert looks_like_comfyui_prompt_graph({"3": {"class_type": "SaveText", "inputs": {"text": "hi"}}})
    assert not looks_like_comfyui_prompt_graph({"3": {"class_type": "SaveText"}})
    assert not looks_like_comfyui_prompt_graph({"seed": {"class_type": "X", "inputs": {}}})
    assert not looks_like_comfyui_prompt_graph({"nodes": [], "3": {"class_type": "X", "inputs": {}}})
