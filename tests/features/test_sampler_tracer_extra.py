"""Extra tests for sampler_tracer.py — covering uncovered branches."""
import pytest

from mjr_am_backend.features.geninfo import sampler_tracer as st


def test_scalar_returns_none_for_non_scalar_types() -> None:
    """Line 25 — _scalar returns None when value is not int/float/str."""
    assert st._scalar(object()) is None
    assert st._scalar([1, 2]) is None
    assert st._scalar({"a": 1}) is None


def test_has_core_sampler_signature_exception_branch(monkeypatch) -> None:
    """Lines 54-55 — _inputs raises → returns False."""
    def _raise(*args):
        raise RuntimeError("inputs fail")

    monkeypatch.setattr(st, "_inputs", _raise)
    assert st._has_core_sampler_signature({"class_type": "X"}) is False


def test_is_custom_sampler_exception_branch(monkeypatch) -> None:
    """Lines 67-68 — _inputs raises → returns False."""
    def _raise(*args):
        raise RuntimeError("inputs fail")

    monkeypatch.setattr(st, "_inputs", _raise)
    # ct must contain "sampler" but not "select" or "ksamplerselect"
    assert st._is_custom_sampler({"class_type": "my_sampler"}, "my_sampler") is False


def test_is_custom_sampler_text_embeds_link(monkeypatch) -> None:
    """Line 72 — returns True when text_embeds is a link."""
    monkeypatch.setattr(st, "_inputs", lambda node: {"text_embeds": [1, 0]})
    monkeypatch.setattr(st, "_is_link", lambda v: isinstance(v, list))
    result = st._is_custom_sampler({"class_type": "my_sampler"}, "my_sampler")
    assert result is True


def test_is_advanced_sampler_exception_branch(monkeypatch) -> None:
    """Lines 90-91 — _inputs raises inside try → returns False."""
    def _raise(*args):
        raise RuntimeError("inputs fail")

    monkeypatch.setattr(st, "_inputs", _raise)
    assert st._is_advanced_sampler({"class_type": "AdvancedSampler"}) is False


def test_trace_sampler_name_returns_none_when_no_sampler_name() -> None:
    """Line 186 — node has no sampler_name or sampler → returns None."""
    nodes = {"1": {"class_type": "SomeNode", "inputs": {"model": [2, 0]}}}
    result = st._trace_sampler_name(nodes, [1, 0])
    assert result is None


def test_trace_noise_seed_returns_none_when_no_seed_keys() -> None:
    """Line 202 — node has no noise_seed/seed/value/int/number → returns None."""
    nodes = {"1": {"class_type": "SomeNode", "inputs": {"model": [2, 0]}}}
    result = st._trace_noise_seed(nodes, [1, 0])
    assert result is None


def test_trace_scheduler_sigmas_returns_none_when_no_link() -> None:
    """Line 236 — _walk_passthrough returns None → returns all-None tuple."""
    result = st._trace_scheduler_sigmas({}, None)
    assert result == (None, None, None, None, None, None)


def test_trace_scheduler_sigmas_manual_steps_from_sigmas() -> None:
    """Line 241 — steps is None from ins, falls back to _steps_from_manual_sigmas."""
    # Node with no "steps" but with sigmas string → manual steps
    nodes = {"1": {"class_type": "ManualSigmas", "inputs": {"sigmas": "1.0, 0.8, 0.5, 0.2"}}}
    result = st._trace_scheduler_sigmas(nodes, [1, 0])
    steps, scheduler, denoise, model_link, src, steps_conf = result
    assert steps is not None
    assert steps_conf == "low"


def test_resolve_sink_sampler_node_returns_none_for_empty_graph() -> None:
    """Lines 286-290 — no primary/advanced sampler → returns None."""
    result = st._resolve_sink_sampler_node({}, "99")
    assert result is None


def test_find_special_sampler_id_marigold() -> None:
    """Line 299 — marigold node found."""
    nodes = {"42": {"class_type": "MarigoldDepthEstimation", "inputs": {}}}
    result = st._find_special_sampler_id(nodes)
    assert result == "42"


def test_find_special_sampler_id_qwen_instruction() -> None:
    """Line 301 — instruction+qwen node found."""
    nodes = {"7": {"class_type": "InstructionQwenPipeline", "inputs": {}}}
    result = st._find_special_sampler_id(nodes)
    assert result == "7"


def test_find_special_sampler_id_no_match() -> None:
    """Returns None when no special node exists."""
    nodes = {"1": {"class_type": "KSampler", "inputs": {}}}
    result = st._find_special_sampler_id(nodes)
    assert result is None


def test_select_sampler_context_global_mode() -> None:
    """Line 315 — primary/advanced fail, any_sampler finds node → 'global' mode."""
    # KSampler node not connected to any sink via graph → primary/advanced fail
    # But _select_any_sampler finds it globally
    nodes = {
        "1": {
            "class_type": "KSampler",
            "inputs": {
                "steps": 20,
                "cfg": 7.0,
                "seed": 42,
                "sampler_name": "euler",
                "scheduler": "normal",
                "denoise": 1.0,
                "model": [10, 0],
                "positive": [11, 0],
                "negative": [12, 0],
                "latent_image": [13, 0],
            },
        }
    }
    sampler_id, conf, mode = st._select_sampler_context(nodes, "99")
    assert sampler_id == "1"
    assert mode == "global"


def test_select_sampler_context_fallback_mode() -> None:
    """Lines 319-321 — all selectors fail, special sampler found → 'fallback' mode."""
    # instruction+qwen node: _is_sampler returns False (not a ksampler pattern)
    # _find_special_sampler_id finds it via class_type check
    nodes = {
        "5": {
            "class_type": "InstructionQwenTTSPipeline",
            "inputs": {},
        }
    }
    sampler_id, conf, mode = st._select_sampler_context(nodes, "99")
    assert sampler_id == "5"
    assert mode == "fallback"
    assert conf == "low"
