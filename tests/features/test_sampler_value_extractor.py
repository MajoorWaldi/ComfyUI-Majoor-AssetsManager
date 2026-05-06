from __future__ import annotations

from mjr_am_backend.features.geninfo import parser_impl as p


def test_resolve_model_link_for_chain_prefers_direct_model_link():
    ins = {"model": ["10", 0], "model_high_noise": ["11", 0], "model_low_noise": ["12", 0]}

    assert p._resolve_model_link_for_chain(ins, {}) == ["10", 0]


def test_resolve_model_link_for_chain_uses_wan_dual_model_inputs():
    ins = {"model_high_noise": ["11", 0], "model_low_noise": ["12", 0]}

    assert p._resolve_model_link_for_chain(ins, {}) == ["11", 0]


def test_resolve_model_link_for_chain_falls_back_to_guider_when_no_sampler_model():
    trace = {"guider_model_link": ["20", 0]}

    assert p._resolve_model_link_for_chain({}, trace) == ["20", 0]


def test_extract_sampler_values_resolves_linked_steps_and_wan_cfg_branches():
    nodes = {
        "103": {"class_type": "mxSlider", "inputs": {"Xi": 8, "Xf": 8.0, "isfloatX": 0}},
        "104": {
            "class_type": "WanMoeKSamplerAdvanced",
            "inputs": {
                "steps": ["103", 0],
                "cfg_high_noise": 1.0,
                "cfg_low_noise": 1.0,
                "noise_seed": 123,
                "sampler_name": "euler",
                "scheduler": "simple",
            },
        },
    }

    values = p._extract_sampler_values(
        nodes,
        nodes["104"],
        "104",
        nodes["104"]["inputs"],
        True,
        "high",
        {},
    )

    assert values["steps"] == 8
    assert values["cfg_high_noise"] == 1.0
    assert values["cfg_low_noise"] == 1.0
