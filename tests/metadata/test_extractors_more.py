"""
Additional coverage tests for extractors.py.
Targets: 89, 93, 119, 122-125, 128-150, 302-408, 462-541, 552-605.
"""
from __future__ import annotations

import pytest

from mjr_am_backend.features.metadata import extractors as e


# ─── _inspect_json_field ────────────────────────────────────────────────────

def test_inspect_json_field_non_dict():
    assert e._inspect_json_field(None, ("key",)) is None
    assert e._inspect_json_field("string", ("key",)) is None


def test_inspect_json_field_found(monkeypatch):
    monkeypatch.setattr(e, "parse_json_value", lambda v: v if isinstance(v, dict) else None)
    container = {"Workflow": {"nodes": []}}
    result = e._inspect_json_field(container, ("Workflow",))
    assert result == {"nodes": []}


def test_inspect_json_field_not_found(monkeypatch):
    monkeypatch.setattr(e, "parse_json_value", lambda v: None)
    assert e._inspect_json_field({"x": 1}, ("y", "z")) is None


# ─── _unwrap_workflow_prompt_container ──────────────────────────────────────

def test_unwrap_non_dict():
    wf, pr = e._unwrap_workflow_prompt_container("notadict")
    assert wf is None and pr is None


def test_unwrap_with_workflow_and_prompt(monkeypatch):
    wf = {"nodes": []}
    pr = {"1": {"class_type": "KSampler", "inputs": {}}}
    monkeypatch.setattr(e, "looks_like_comfyui_workflow", lambda v: isinstance(v, dict) and "nodes" in v)
    monkeypatch.setattr(e, "looks_like_comfyui_prompt_graph", lambda v: isinstance(v, dict) and "1" in v)
    monkeypatch.setattr(e, "try_parse_json_text", lambda v: None)
    container = {"workflow": wf, "prompt": pr}
    out_wf, out_pr = e._unwrap_workflow_prompt_container(container)
    assert out_wf == wf
    assert out_pr == pr


def test_unwrap_with_prompt_as_json_string(monkeypatch):
    pr = {"1": {"class_type": "KSampler"}}
    monkeypatch.setattr(e, "looks_like_comfyui_workflow", lambda v: False)
    monkeypatch.setattr(e, "looks_like_comfyui_prompt_graph", lambda v: isinstance(v, dict) and "1" in v)
    monkeypatch.setattr(e, "try_parse_json_text", lambda v: pr if isinstance(v, str) else None)
    container = {"prompt": '{"1":{"class_type":"KSampler"}}'}
    _, out_pr = e._unwrap_workflow_prompt_container(container)
    assert out_pr == pr


# ─── _container_json_candidate ──────────────────────────────────────────────

def test_container_json_candidate_lowercase():
    assert e._container_json_candidate({"workflow": 1}, "workflow") == 1


def test_container_json_candidate_capitalized():
    assert e._container_json_candidate({"Workflow": 2}, "workflow") == 2


# ─── _prompt_graph_from_container_value ─────────────────────────────────────

def test_prompt_graph_from_container_value_not_str_not_dict():
    assert e._prompt_graph_from_container_value(42) is None


def test_prompt_graph_from_container_value_dict_match(monkeypatch):
    monkeypatch.setattr(e, "looks_like_comfyui_prompt_graph", lambda v: True)
    result = e._prompt_graph_from_container_value({"1": {}})
    assert result == {"1": {}}


def test_prompt_graph_from_container_value_string_parsed(monkeypatch):
    parsed = {"1": {"class_type": "X"}}
    monkeypatch.setattr(e, "looks_like_comfyui_prompt_graph", lambda v: isinstance(v, dict))
    monkeypatch.setattr(e, "try_parse_json_text", lambda v: parsed)
    result = e._prompt_graph_from_container_value('{"1":{}}')
    assert result == parsed


# ─── _merge_workflow_prompt_candidate ───────────────────────────────────────

def test_merge_workflow_prompt_no_match(monkeypatch):
    monkeypatch.setattr(e, "looks_like_comfyui_workflow", lambda v: False)
    monkeypatch.setattr(e, "looks_like_comfyui_prompt_graph", lambda v: False)
    wf, pr, matched = e._merge_workflow_prompt_candidate("garbage", None, None)
    assert matched is False and wf is None and pr is None


def test_merge_workflow_prompt_workflow_match(monkeypatch):
    wf_cand = {"nodes": []}
    monkeypatch.setattr(e, "looks_like_comfyui_workflow", lambda v: True)
    monkeypatch.setattr(e, "looks_like_comfyui_prompt_graph", lambda v: False)
    wf, pr, matched = e._merge_workflow_prompt_candidate(wf_cand, None, None)
    assert matched is True and wf == wf_cand


def test_merge_workflow_prompt_prompt_match(monkeypatch):
    pr_cand = {"1": {"class_type": "KSampler"}}
    monkeypatch.setattr(e, "looks_like_comfyui_workflow", lambda v: False)
    monkeypatch.setattr(e, "looks_like_comfyui_prompt_graph", lambda v: True)
    wf, pr, matched = e._merge_workflow_prompt_candidate(pr_cand, None, None)
    assert matched is True and pr == pr_cand


def test_merge_workflow_prompt_already_filled(monkeypatch):
    monkeypatch.setattr(e, "looks_like_comfyui_workflow", lambda v: True)
    monkeypatch.setattr(e, "looks_like_comfyui_prompt_graph", lambda v: True)
    existing_wf = {"nodes": [1]}
    existing_pr = {"2": {}}
    wf, pr, matched = e._merge_workflow_prompt_candidate({"nodes": [2]}, existing_wf, existing_pr)
    # already filled → not overwritten
    assert wf is existing_wf and pr is existing_pr


# ─── _workflow_get_source_data ───────────────────────────────────────────────

def test_workflow_get_source_data_no_target_node():
    assert e._workflow_get_source_data({}, {}, "99", "positive") is None


def test_workflow_get_source_data_no_input_def():
    node_map = {1: {"id": 1, "inputs": []}}
    assert e._workflow_get_source_data(node_map, {}, 1, "missing") is None


def test_workflow_get_source_data_no_link_id():
    node_map = {1: {"id": 1, "inputs": [{"name": "positive", "link": None}]}}
    assert e._workflow_get_source_data(node_map, {}, 1, "positive") is None


def test_workflow_get_source_data_link_not_in_lookup():
    node_map = {1: {"id": 1, "inputs": [{"name": "positive", "link": 10}]}}
    assert e._workflow_get_source_data(node_map, {}, 1, "positive") is None


def test_workflow_get_source_data_success():
    node_map = {
        1: {"id": 1, "inputs": [{"name": "positive", "link": 10}]},
        5: {"id": 5, "type": "CLIPTextEncode", "widgets_values": ["hello"]},
    }
    link_lookup = {10: (5, 0, 1, "positive", "CONDITIONING")}
    result = e._workflow_get_source_data(node_map, link_lookup, 1, "positive")
    assert result is not None
    assert result[0] == node_map[5]


# ─── _workflow_trace_node_allowed ───────────────────────────────────────────

def test_workflow_trace_node_allowed_non_dict():
    assert e._workflow_trace_node_allowed("not_a_dict", 0, 100, set()) is False


def test_workflow_trace_node_allowed_depth_exceeded():
    assert e._workflow_trace_node_allowed({"id": 1}, 101, 100, set()) is False


def test_workflow_trace_node_allowed_already_seen():
    seen = {1}
    assert e._workflow_trace_node_allowed({"id": 1}, 0, 100, seen) is False


def test_workflow_trace_node_allowed_no_id():
    seen = set()
    assert e._workflow_trace_node_allowed({"type": "X"}, 0, 100, seen) is True


def test_workflow_trace_node_allowed_new_node():
    seen = set()
    assert e._workflow_trace_node_allowed({"id": 42}, 0, 100, seen) is True
    assert 42 in seen


# ─── _workflow_collect_node_text ────────────────────────────────────────────

def test_workflow_collect_node_text_loader_skipped():
    found = []
    e._workflow_collect_node_text({"type": "LoadImage", "widgets_values": ["hello"]}, None, found)
    assert found == []


def test_workflow_collect_node_text_text_added():
    found = []
    e._workflow_collect_node_text({"type": "CLIPTextEncode", "widgets_values": ["prompt text"]}, None, found)
    assert "prompt text" in found


def test_workflow_collect_node_text_no_text():
    found = []
    e._workflow_collect_node_text({"type": "PromptNode", "widgets_values": []}, None, found)
    assert found == []


# ─── _workflow_push_upstream_inputs ─────────────────────────────────────────

def test_workflow_push_upstream_inputs_empty_inputs():
    stack = []
    e._workflow_push_upstream_inputs({}, {}, {"inputs": []}, None, 0, stack)
    assert stack == []


def test_workflow_push_upstream_inputs_non_list_inputs():
    stack = []
    e._workflow_push_upstream_inputs({}, {}, {"inputs": None}, None, 0, stack)
    assert stack == []


def test_workflow_push_upstream_inputs_with_links():
    node_map = {5: {"id": 5, "type": "X"}}
    link_lookup = {10: (5, 0, 1, "positive", "COND")}
    node = {"inputs": [{"name": "positive", "link": 10}]}
    stack = []
    e._workflow_push_upstream_inputs(node_map, link_lookup, node, None, 0, stack)
    assert len(stack) == 1 and stack[0][0] == node_map[5]


def test_workflow_push_upstream_inputs_context_blocked():
    node_map = {5: {"id": 5}}
    link_lookup = {10: (5, 0, 1, "negative", "COND")}
    node = {"inputs": [{"name": "negative", "link": 10}]}
    stack = []
    # context="positive" → negative input blocked
    e._workflow_push_upstream_inputs(node_map, link_lookup, node, "positive", 0, stack)
    assert stack == []


# ─── _workflow_find_upstream_text ────────────────────────────────────────────

def test_workflow_find_upstream_text_non_dict():
    result = e._workflow_find_upstream_text({}, {}, "not_a_dict")
    assert result == []


def test_workflow_find_upstream_text_basic():
    node_map = {1: {"id": 1, "type": "CLIPTextEncode", "inputs": [], "widgets_values": ["positive prompt text"]}}
    result = e._workflow_find_upstream_text(node_map, {}, node_map[1])
    assert "positive prompt text" in result


# ─── _workflow_classify_unconnected_node ─────────────────────────────────────

def test_workflow_classify_unconnected_node_no_outputs():
    node = {"id": 1, "outputs": []}
    result = e._workflow_classify_unconnected_node(node, {}, {})
    assert result == "unknown"


def test_workflow_classify_unconnected_node_non_list_outputs():
    node = {"id": 1, "outputs": None}
    result = e._workflow_classify_unconnected_node(node, {}, {})
    assert result == "unknown"


def test_workflow_classify_unconnected_node_depth_limit():
    node = {"id": 1, "outputs": [{"links": [10]}]}
    result = e._workflow_classify_unconnected_node(node, {}, {}, depth=7)
    assert result == "unknown"
