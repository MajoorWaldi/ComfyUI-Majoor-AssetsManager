"""
Additional coverage tests for parser_impl.py helper functions.
Targets uncovered lines: 61, 64, 71, 77, 79-80, 103, 105, 119-121, 125-127,
131-133, 145-152, 156-164, 168-175, 179-189, 200-218, 228-250, 256, 262,
270-307, 315-428, 432-494, 574-620, 636-640, ...
"""
from __future__ import annotations

from pathlib import Path

import pytest

from mjr_am_backend.features.geninfo import parser_impl as p


# ─── _clean_model_id edge cases ────────────────────────────────────────────

def test_clean_model_id_none():
    assert p._clean_model_id(None) is None


def test_clean_model_id_empty_string():
    assert p._clean_model_id("") is None
    assert p._clean_model_id("   ") is None


def test_clean_model_id_no_extension():
    assert p._clean_model_id("mymodel") == "mymodel"


def test_clean_model_id_backslash():
    assert p._clean_model_id("C:\\models\\foo.safetensors") == "foo"


# ─── _to_int edge cases ─────────────────────────────────────────────────────

def test_to_int_none():
    assert p._to_int(None) is None


def test_to_int_invalid():
    assert p._to_int("not_a_number") is None


def test_to_int_valid():
    assert p._to_int("42") == 42


# ─── _looks_like_prompt_string ─────────────────────────────────────────────

def test_looks_like_prompt_string_control_chars():
    # Has control char below \x09 → should return False
    assert p._looks_like_prompt_string("abcdefg\x01") is False


def test_looks_like_prompt_string_short():
    assert p._looks_like_prompt_string("ab") is False


def test_looks_like_prompt_string_non_string():
    assert p._looks_like_prompt_string(123) is False


# ─── _field family empty string paths ──────────────────────────────────────

def test_field_empty_string():
    assert p._field("", "high", "src") is None


def test_field_name_empty_string():
    assert p._field_name("", "high", "src") is None


def test_field_size_none_height():
    assert p._field_size(512, None, "high", "src") is None


# ─── _is_sampler ───────────────────────────────────────────────────────────

def test_is_sampler_no_class_type():
    assert p._is_sampler({}) is False


def test_is_sampler_ksampler():
    assert p._is_sampler({"class_type": "KSampler", "inputs": {"steps": 20, "cfg": 7, "seed": 1}}) is True


def test_is_sampler_core_signature():
    node = {"class_type": "CustomStep", "inputs": {"steps": 20, "cfg": 7.0, "seed": 42}}
    assert p._is_sampler(node) is True


# ─── _is_named_sampler_type ────────────────────────────────────────────────

def test_is_named_sampler_ksampler_select():
    # "ksampler" + "select" → False
    assert p._is_named_sampler_type("ksamplerselect") is False


def test_is_named_sampler_ksampler_only():
    assert p._is_named_sampler_type("ksampler") is True


def test_is_named_sampler_iterative():
    assert p._is_named_sampler_type("iterativelatentupscale") is True


def test_is_named_sampler_marigold():
    assert p._is_named_sampler_type("marigold_depth") is True


def test_is_named_sampler_flux_params():
    assert p._is_named_sampler_type("fluxparams") is True


def test_is_named_sampler_flux_sampler():
    assert p._is_named_sampler_type("fluxsampler") is True


def test_is_named_sampler_flux2():
    assert p._is_named_sampler_type("flux2") is True


def test_is_named_sampler_flux_2():
    assert p._is_named_sampler_type("my_flux_2_node") is True


def test_is_named_sampler_unrelated():
    assert p._is_named_sampler_type("saveimage") is False


# ─── _has_core_sampler_signature ───────────────────────────────────────────

def test_has_core_sampler_signature_exception():
    # Pass something where _inputs() would fail
    assert p._has_core_sampler_signature({"inputs": None}) is False


def test_has_core_sampler_signature_missing_cfg():
    node = {"inputs": {"steps": 10, "seed": 1}}
    assert p._has_core_sampler_signature(node) is False


def test_has_core_sampler_signature_complete():
    node = {"inputs": {"steps": 10, "cfg": 7.0, "seed": 1}}
    assert p._has_core_sampler_signature(node) is True


def test_has_core_sampler_signature_guidance():
    node = {"inputs": {"steps": 10, "guidance": 3.5, "noise_seed": 42}}
    assert p._has_core_sampler_signature(node) is True


# ─── _is_custom_sampler ────────────────────────────────────────────────────

def test_is_custom_sampler_no_sampler_in_ct():
    assert p._is_custom_sampler({"inputs": {}}, "saveimage") is False


def test_is_custom_sampler_select_in_ct():
    assert p._is_custom_sampler({"inputs": {}}, "mysamplerselect") is False


def test_is_custom_sampler_with_model_link():
    node = {"inputs": {"model": ["1", 0]}}
    assert p._is_custom_sampler(node, "mysampler") is True


def test_is_custom_sampler_with_text_embeds_link():
    node = {"inputs": {"text_embeds": ["2", 0]}}
    assert p._is_custom_sampler(node, "videosampler") is True


def test_is_custom_sampler_with_hyvid_embeds():
    node = {"inputs": {"hyvid_embeds": ["3", 0]}}
    assert p._is_custom_sampler(node, "hyvidsampler") is True


def test_is_custom_sampler_inputs_exception():
    # inputs=None triggers except path
    assert p._is_custom_sampler({"inputs": None}, "sampler") is False


# ─── _is_advanced_sampler ──────────────────────────────────────────────────

def test_is_advanced_sampler_no_ct():
    assert p._is_advanced_sampler({}) is False


def test_is_advanced_sampler_samplercustom():
    assert p._is_advanced_sampler({"class_type": "SamplerCustomAdvanced", "inputs": {}}) is True


def test_is_advanced_sampler_guider_sigmas():
    node = {"class_type": "FlowSampler", "inputs": {"guider": ["1", 0], "sigmas": ["2", 0]}}
    assert p._is_advanced_sampler(node) is True


def test_is_advanced_sampler_guider_sampler():
    node = {"class_type": "FlowSampler", "inputs": {"guider": ["1", 0], "sampler": ["2", 0]}}
    assert p._is_advanced_sampler(node) is True


def test_is_advanced_sampler_all_four():
    node = {"class_type": "X", "inputs": {
        "noise": ["1", 0], "guider": ["2", 0], "sampler": ["3", 0], "sigmas": ["4", 0]
    }}
    assert p._is_advanced_sampler(node) is True


def test_is_advanced_sampler_exception_path():
    # inputs=None → exception → False
    assert p._is_advanced_sampler({"class_type": "X", "inputs": None}) is False


# ─── _extract_posneg_from_text_embeds ──────────────────────────────────────

def test_extract_posneg_walk_returns_none():
    pos, neg = p._extract_posneg_from_text_embeds({}, None)
    assert pos is None and neg is None


def test_extract_posneg_node_not_found():
    nodes = {"1": {"class_type": "X", "inputs": {}}}
    pos, neg = p._extract_posneg_from_text_embeds(nodes, ["99", 0])
    assert pos is None and neg is None


def test_extract_posneg_with_prompts():
    nodes = {
        "1": {"class_type": "WanVideoTextEncode", "inputs": {
            "positive_prompt": "beautiful landscape",
            "negative_prompt": "ugly",
        }}
    }
    pos, neg = p._extract_posneg_from_text_embeds(nodes, ["1", 0])
    assert pos is not None and pos[0] == "beautiful landscape"
    assert neg is not None and neg[0] == "ugly"


def test_extract_posneg_no_prompts():
    nodes = {"2": {"class_type": "EmptyNode", "inputs": {"other": 1}}}
    pos, neg = p._extract_posneg_from_text_embeds(nodes, ["2", 0])
    assert pos is None and neg is None


# ─── _select_primary_sampler / _select_advanced_sampler ────────────────────

def test_select_primary_sampler_no_sink():
    nodes = {"1": {"class_type": "NoSink", "inputs": {}}}
    sid, conf = p._select_primary_sampler(nodes, "1")
    assert sid is None


def test_select_advanced_sampler_no_sink():
    nodes = {}
    sid, conf = p._select_advanced_sampler(nodes, "99")
    assert sid is None


# ─── _select_sampler_from_sink / _sink_start_source ────────────────────────

def test_sink_start_source_not_dict():
    assert p._sink_start_source({}, "99") is None


def test_sink_start_source_no_input_link():
    nodes = {"1": {"class_type": "SaveImage", "inputs": {}}}
    assert p._sink_start_source(nodes, "1") is None


def test_sink_start_source_with_link():
    nodes = {
        "1": {"class_type": "SaveImage", "inputs": {"images": ["2", 0]}},
        "2": {"class_type": "KSampler", "inputs": {"steps": 20, "cfg": 7, "seed": 1}},
    }
    src = p._sink_start_source(nodes, "1")
    assert src == "2"


# ─── _best_candidate ───────────────────────────────────────────────────────

def test_best_candidate_empty():
    assert p._best_candidate([]) == (None, "none")


def test_best_candidate_single():
    assert p._best_candidate([("n1", 0)]) == ("n1", "high")


def test_best_candidate_multiple_same_depth():
    result = p._best_candidate([("n1", 2), ("n2", 2)])
    assert result[1] == "medium"


def test_best_candidate_multiple_different_depth():
    result = p._best_candidate([("n1", 3), ("n2", 1)])
    assert result[0] == "n2" and result[1] == "high"


# ─── _select_any_sampler ───────────────────────────────────────────────────

def test_select_any_sampler_no_candidates():
    nodes = {"1": {"class_type": "SaveImage", "inputs": {}}}
    nid, conf = p._select_any_sampler(nodes)
    assert nid is None and conf == "none"


def test_select_any_sampler_with_ksampler():
    nodes = {
        "5": {"class_type": "KSampler", "inputs": {"steps": 20, "cfg": 7, "seed": 1, "model": ["0", 0], "positive": ["1", 0]}},
    }
    nid, conf = p._select_any_sampler(nodes)
    assert nid == "5" and conf == "low"


# ─── _sampler_candidate_score ──────────────────────────────────────────────

def test_sampler_candidate_score_empty():
    assert p._sampler_candidate_score({}) == 0


def test_sampler_candidate_score_model_positive():
    ins = {"model": ["1", 0], "positive": ["2", 0], "steps": 20}
    score = p._sampler_candidate_score(ins)
    assert score >= 7


# ─── _stable_numeric_node_id ───────────────────────────────────────────────

def test_stable_numeric_node_id_valid():
    assert p._stable_numeric_node_id("42") == 42


def test_stable_numeric_node_id_invalid():
    assert p._stable_numeric_node_id("abc") == 10 ** 9


# ─── _trace_sampler_name ───────────────────────────────────────────────────

def test_trace_sampler_name_no_walk():
    assert p._trace_sampler_name({}, None) is None


def test_trace_sampler_name_node_not_dict():
    nodes = {}
    assert p._trace_sampler_name(nodes, ["99", 0]) is None


def test_trace_sampler_name_found():
    nodes = {"1": {"class_type": "KSamplerSelect", "inputs": {"sampler_name": "euler"}}}
    result = p._trace_sampler_name(nodes, ["1", 0])
    assert result is not None and result[0] == "euler"


# ─── _trace_noise_seed ─────────────────────────────────────────────────────

def test_trace_noise_seed_no_walk():
    assert p._trace_noise_seed({}, None) is None


def test_trace_noise_seed_node_not_dict():
    assert p._trace_noise_seed({}, ["99", 0]) is None


def test_trace_noise_seed_found():
    nodes = {"3": {"class_type": "RandomNoise", "inputs": {"noise_seed": 12345}}}
    result = p._trace_noise_seed(nodes, ["3", 0])
    assert result is not None and result[0] == 12345


# ─── _trace_scheduler_sigmas ───────────────────────────────────────────────

def test_trace_scheduler_sigmas_no_walk():
    result = p._trace_scheduler_sigmas({}, None)
    assert result[0] is None and result[1] is None


def test_trace_scheduler_sigmas_found():
    nodes = {
        "5": {"class_type": "BasicScheduler", "inputs": {"steps": 25, "scheduler": "karras", "denoise": 1.0}}
    }
    steps, scheduler, denoise, model_link, src_tuple, steps_conf = p._trace_scheduler_sigmas(nodes, ["5", 0])
    assert steps == 25 and scheduler == "karras" and denoise == 1.0


# ─── _steps_from_manual_sigmas ─────────────────────────────────────────────

def test_steps_from_manual_sigmas_too_few():
    ins = {"sigmas": "0.9"}
    steps, conf = p._steps_from_manual_sigmas(ins)
    assert steps is None


def test_steps_from_manual_sigmas_enough():
    ins = {"sigmas": "1.0, 0.7, 0.4, 0.1"}
    steps, conf = p._steps_from_manual_sigmas(ins)
    assert steps == 3  # 4 values → max(1, 4-1)


# ─── _count_numeric_sigma_values ───────────────────────────────────────────

def test_count_numeric_sigma_values_non_string():
    assert p._count_numeric_sigma_values(None) == 0
    assert p._count_numeric_sigma_values(42) == 0


def test_count_numeric_sigma_values_csv():
    assert p._count_numeric_sigma_values("1.0, 0.5, 0.2") == 3


def test_count_numeric_sigma_values_mixed():
    assert p._count_numeric_sigma_values("1.0, bad, 0.2") == 2


# ─── _trace_guidance_from_conditioning ─────────────────────────────────────

def test_trace_guidance_from_conditioning_no_walk():
    assert p._trace_guidance_from_conditioning({}, None) is None


def test_trace_guidance_from_conditioning_found():
    nodes = {
        "1": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["9", 0], "text": "hi", "guidance": 3.5}},
    }
    result = p._trace_guidance_from_conditioning(nodes, ["1", 0])
    assert result is not None and result[0] == 3.5


# ─── _scalar ───────────────────────────────────────────────────────────────

def test_scalar_none():
    assert p._scalar(None) is None


def test_scalar_int():
    assert p._scalar(42) == 42


def test_scalar_float():
    assert p._scalar(3.14) == 3.14


def test_scalar_list():
    assert p._scalar([1, 2]) is None


# ─── _extract_ksampler_widget_params ───────────────────────────────────────

def test_extract_ksampler_widget_params_not_dict():
    assert p._extract_ksampler_widget_params("not_a_dict") == {}


def test_extract_ksampler_widget_params_not_ksampler():
    node = {"class_type": "SaveImage", "inputs": {}}
    assert p._extract_ksampler_widget_params(node) == {}


def test_extract_ksampler_widget_params_no_widgets():
    node = {"class_type": "KSampler", "inputs": {}}
    assert p._extract_ksampler_widget_params(node) == {}


def test_extract_ksampler_widget_params_full():
    node = {"class_type": "KSampler", "widgets_values": [111, "ctrl", 20, 7.5, "euler", "normal", 0.9]}
    out = p._extract_ksampler_widget_params(node)
    assert out["seed"] == 111 and out["steps"] == 20 and out["cfg"] == 7.5
    assert out["sampler_name"] == "euler"


# ─── _ksampler_values_from_widgets ─────────────────────────────────────────

def test_ksampler_values_from_widgets_short():
    out = p._ksampler_values_from_widgets([42])
    assert out["seed"] == 42
    assert "steps" not in out  # index 2 missing


# ─── _extract_lyrics_from_prompt_nodes ─────────────────────────────────────

def test_extract_lyrics_from_prompt_nodes_none():
    nodes = {"1": {"class_type": "SaveImage", "inputs": {}}}
    lyr, strength, src = p._extract_lyrics_from_prompt_nodes(nodes)
    assert lyr is None


def test_extract_lyrics_from_prompt_nodes_with_acestep():
    nodes = {
        "1": {
            "class_type": "AceStep15TaskTextEncode",
            "inputs": {"task_text": "hello lyrics", "lyrics_strength": 0.8},
        }
    }
    lyr, strength, src = p._extract_lyrics_from_prompt_nodes(nodes)
    assert lyr == "hello lyrics"
    assert strength == 0.8


# ─── _extract_lyrics_from_inputs ───────────────────────────────────────────

def test_extract_lyrics_from_inputs_no_key():
    assert p._extract_lyrics_from_inputs({}, "sometextencode") is None


def test_extract_lyrics_from_inputs_lyrics_key():
    assert p._extract_lyrics_from_inputs({"lyrics": "song text"}, "textnode") == "song text"


# ─── _extract_lyrics_strength ──────────────────────────────────────────────

def test_extract_lyrics_strength_missing():
    assert p._extract_lyrics_strength({}) is None


def test_extract_lyrics_strength_present():
    assert p._extract_lyrics_strength({"lyrics_strength": 0.75}) == 0.75


# ─── _first_non_empty_string / _first_non_none_scalar ──────────────────────

def test_first_non_empty_string_not_found():
    assert p._first_non_empty_string({}, ("a", "b")) is None


def test_first_non_empty_string_found():
    assert p._first_non_empty_string({"b": "hi"}, ("a", "b")) == "hi"


def test_first_non_none_scalar_not_found():
    assert p._first_non_none_scalar({}, ("a", "b")) is None


def test_first_non_none_scalar_found():
    assert p._first_non_none_scalar({"a": 5}, ("a", "b")) == 5


# ─── _resolve_scalar_from_link ─────────────────────────────────────────────

def test_resolve_scalar_from_link_no_walk():
    assert p._resolve_scalar_from_link({}, None) is None


def test_resolve_scalar_from_link_node_not_dict():
    assert p._resolve_scalar_from_link({}, ["99", 0]) is None


def test_resolve_scalar_from_link_found():
    nodes = {"4": {"class_type": "Primitive", "inputs": {"value": 77}}}
    result = p._resolve_scalar_from_link(nodes, ["4", 0])
    assert result == 77


# ─── _extract_text ─────────────────────────────────────────────────────────

def test_extract_text_no_walk():
    assert p._extract_text({}, None) is None


def test_extract_text_node_not_dict():
    assert p._extract_text({}, ["99", 0]) is None


def test_extract_text_no_candidates():
    nodes = {"5": {"class_type": "Other", "inputs": {"x": 1}}}
    assert p._extract_text(nodes, ["5", 0]) is None


def test_extract_text_found():
    nodes = {"6": {"class_type": "CLIPTextEncode", "inputs": {"text": "my prompt", "clip": ["9", 0]}}}
    result = p._extract_text(nodes, ["6", 0])
    assert result is not None and "my prompt" in result[0]


# ─── _looks_like_conditioning_text ─────────────────────────────────────────

def test_looks_like_conditioning_text_wrong_ct():
    assert p._looks_like_conditioning_text({"class_type": "LoadImage", "inputs": {"text": "x" * 10}}) is False


def test_looks_like_conditioning_text_ok():
    node = {"class_type": "PromptNode", "inputs": {"text": "a nice prompt"}}
    assert p._looks_like_conditioning_text(node) is True


# ─── _conditioning_key_allowed ─────────────────────────────────────────────

def test_conditioning_key_allowed_positive_branch_rejects_negative():
    assert p._conditioning_key_allowed("negative_prompt", "positive") is False


def test_conditioning_key_allowed_negative_branch_rejects_positive():
    assert p._conditioning_key_allowed("positive_prompt", "negative") is False


def test_conditioning_key_allowed_no_branch():
    assert p._conditioning_key_allowed("anything", None) is True


# ─── _conditioning_should_expand ───────────────────────────────────────────

def test_conditioning_should_expand_zeroout_blocked():
    node = {"class_type": "ConditioningZeroOut", "inputs": {}}
    assert p._conditioning_should_expand(node, "negative") is False


def test_conditioning_should_expand_reroute():
    node = {"class_type": "Reroute", "inputs": {"x": ["1", 0]}}
    assert p._conditioning_should_expand(node, None) is True


def test_conditioning_should_expand_has_conditioning_input():
    node = {"class_type": "SomeNode", "inputs": {"conditioning": ["1", 0]}}
    assert p._conditioning_should_expand(node, None) is True


# ─── _select_sampler_context ───────────────────────────────────────────────

def test_select_sampler_context_no_sinks():
    nodes = {"1": {"class_type": "NoSink", "inputs": {}}}
    sid, conf, mode = p._select_sampler_context(nodes, "1")
    assert mode in {"primary", "advanced", "global", "fallback"}
