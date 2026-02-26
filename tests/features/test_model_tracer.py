"""
Coverage tests for model_tracer.py helper functions.
Targets: 34-47, 59-66, 77, 82, 87, 92, 103-114, 118-154, 158-183.
"""
from __future__ import annotations

import pytest

from mjr_am_backend.features.geninfo import model_tracer as mt


# ─── _is_nested_lora_key ────────────────────────────────────────────────────

def test_is_nested_lora_key_true():
    assert mt._is_nested_lora_key("lora_0") is True


def test_is_nested_lora_key_false():
    assert mt._is_nested_lora_key("strength_model") is False


# ─── _is_enabled_lora_value ─────────────────────────────────────────────────

def test_is_enabled_lora_value_true():
    assert mt._is_enabled_lora_value({"on": True, "lora": "x.safetensors"}) is True


def test_is_enabled_lora_value_false():
    assert mt._is_enabled_lora_value({"on": False}) is False


def test_is_enabled_lora_value_no_key():
    assert mt._is_enabled_lora_value({}) is True


# ─── _nested_lora_name ──────────────────────────────────────────────────────

def test_nested_lora_name_from_lora():
    assert mt._nested_lora_name({"lora": "C:/loras/style.safetensors"}) == "style"


def test_nested_lora_name_none():
    assert mt._nested_lora_name({}) is None


# ─── _nested_lora_strength ──────────────────────────────────────────────────

def test_nested_lora_strength_from_strength():
    assert mt._nested_lora_strength({"strength": 0.8}) == 0.8


def test_nested_lora_strength_none():
    assert mt._nested_lora_strength({}) is None


# ─── _build_lora_payload_from_nested_value ──────────────────────────────────

def test_build_lora_payload_not_nested_key():
    result = mt._build_lora_payload_from_nested_value(
        node={}, node_id="1", key="strength_model", value={"lora": "x"}, confidence="high"
    )
    assert result is None


def test_build_lora_payload_not_dict_value():
    result = mt._build_lora_payload_from_nested_value(
        node={}, node_id="1", key="lora_0", value="not_dict", confidence="high"
    )
    assert result is None


def test_build_lora_payload_disabled():
    result = mt._build_lora_payload_from_nested_value(
        node={}, node_id="1", key="lora_0", value={"on": False, "lora": "x.safetensors"}, confidence="high"
    )
    assert result is None


def test_build_lora_payload_no_name():
    result = mt._build_lora_payload_from_nested_value(
        node={}, node_id="1", key="lora_0", value={"on": True}, confidence="high"
    )
    assert result is None


def test_build_lora_payload_success():
    node = {"class_type": "LoraLoader"}
    result = mt._build_lora_payload_from_nested_value(
        node=node, node_id="5", key="lora_0",
        value={"on": True, "lora": "style.safetensors", "strength": 0.7},
        confidence="medium"
    )
    assert result is not None
    assert result["name"] == "style"
    assert result["strength_model"] == 0.7


# ─── _build_lora_payload_from_inputs ────────────────────────────────────────

def test_build_lora_payload_from_inputs_no_name():
    result = mt._build_lora_payload_from_inputs(
        node={}, node_id="1", ins={}, confidence="high"
    )
    assert result is None


def test_build_lora_payload_from_inputs_success():
    ins = {"lora_name": "detail.safetensors", "strength_model": 1.0}
    node = {"class_type": "LoraLoader"}
    result = mt._build_lora_payload_from_inputs(
        node=node, node_id="3", ins=ins, confidence="high"
    )
    assert result is not None and result["name"] == "detail"


# ─── _is_lora_loader_node ───────────────────────────────────────────────────

def test_is_lora_loader_node_ct():
    assert mt._is_lora_loader_node("loraloader", {}) is True


def test_is_lora_loader_node_lora_name():
    assert mt._is_lora_loader_node("custom", {"lora_name": "x", "model": ["1", 0]}) is True


def test_is_lora_loader_node_false():
    assert mt._is_lora_loader_node("saveimage", {}) is False


# ─── _is_diffusion_loader_node ──────────────────────────────────────────────

def test_is_diffusion_loader_true():
    assert mt._is_diffusion_loader_node("unetloader") is True
    assert mt._is_diffusion_loader_node("loaddiffusionmodel") is True
    assert mt._is_diffusion_loader_node("unet") is True
    assert mt._is_diffusion_loader_node("videomodelloader") is True


def test_is_diffusion_loader_false():
    assert mt._is_diffusion_loader_node("saveimage") is False


# ─── _is_generic_model_loader_node ──────────────────────────────────────────

def test_is_generic_model_loader_true():
    assert mt._is_generic_model_loader_node("ltxvideomodelloader") is True
    assert mt._is_generic_model_loader_node("wanvideomodelloader") is True
    assert mt._is_generic_model_loader_node("cogvideomodelloader") is True


def test_is_generic_model_loader_false():
    assert mt._is_generic_model_loader_node("ksamplernode") is False


# ─── _is_checkpoint_loader_node ─────────────────────────────────────────────

def test_is_checkpoint_loader_ckpt_name():
    assert mt._is_checkpoint_loader_node("custom", {"ckpt_name": "model.safetensors"}) is True


def test_is_checkpoint_loader_ct():
    assert mt._is_checkpoint_loader_node("checkpointloader", {}) is True
    assert mt._is_checkpoint_loader_node("loadcheckpoint", {}) is True


def test_is_checkpoint_loader_false():
    assert mt._is_checkpoint_loader_node("saveimage", {}) is False


# ─── _chain_result ──────────────────────────────────────────────────────────

def test_chain_result():
    link, stop = mt._chain_result(["1", 0], False)
    assert link == ["1", 0] and stop is False


# ─── _handle_lora_chain_node ────────────────────────────────────────────────

def test_handle_lora_chain_node_not_lora():
    node = {"class_type": "SaveImage", "inputs": {}}
    result = mt._handle_lora_chain_node(node, "1", "saveimage", {}, [], "high")
    assert result is None


def test_handle_lora_chain_node_with_model_link():
    node = {"class_type": "LoraLoader", "inputs": {"lora_name": "x.safetensors", "model": ["2", 0]}}
    ins = {"lora_name": "x.safetensors", "model": ["2", 0]}
    result = mt._handle_lora_chain_node(node, "1", "loraloader", ins, [], "high")
    assert result is not None
    link, stop = result
    assert stop is False and link == ["2", 0]


def test_handle_lora_chain_node_no_model_link():
    node = {"class_type": "LoraLoader", "inputs": {"lora_name": "x.safetensors"}}
    ins = {"lora_name": "x.safetensors"}
    result = mt._handle_lora_chain_node(node, "1", "loraloader", ins, [], "high")
    assert result is not None
    _, stop = result
    assert stop is True


# ─── _handle_modelsampling_chain_node ───────────────────────────────────────

def test_handle_modelsampling_not_applicable():
    assert mt._handle_modelsampling_chain_node("saveimage", {}) is None


def test_handle_modelsampling_with_model():
    ins = {"model": ["3", 0]}
    result = mt._handle_modelsampling_chain_node("modelsamplingnode", ins)
    assert result is not None
    link, stop = result
    assert link == ["3", 0] and stop is False


def test_handle_modelsampling_no_link():
    ins = {"model": "str_not_link"}
    result = mt._handle_modelsampling_chain_node("modelsampling", ins)
    assert result is None
