"""TTS extraction helpers extracted from parser.py."""

from __future__ import annotations

from collections import deque
from collections.abc import Callable
from typing import Any

from ...shared import Result, get_logger
from .graph_converter import _inputs, _is_link, _lower, _node_type, _resolve_link, _walk_passthrough, _collect_upstream_nodes
from .sampler_tracer import _scalar
from .graph_converter import _set_named_field, _set_value_field
from .parser_impl import _clean_model_id, _extract_input_files

logger = get_logger(__name__)

def _find_tts_nodes(nodes_by_id: dict[str, Any]) -> tuple[str | None, dict[str, Any] | None, str | None, dict[str, Any] | None]:
    text_node_id: str | None = None
    text_node: dict[str, Any] | None = None
    engine_node_id: str | None = None
    engine_node: dict[str, Any] | None = None

    for nid, node in nodes_by_id.items():
        if not isinstance(node, dict):
            continue
        ct = _lower(_node_type(node))
        if text_node is None and _is_tts_text_node_type(ct):
            text_node_id = str(nid)
            text_node = node
        if engine_node is None and _is_tts_engine_node_type(ct):
            engine_node_id = str(nid)
            engine_node = node
        if text_node is not None and engine_node is not None:
            break

    return text_node_id, text_node, engine_node_id, engine_node



def _is_tts_text_node_type(ct: str) -> bool:
    return "unifiedttstextnode" in ct or "tts_text_node" in ct or ("tts" in ct and "text" in ct)



def _is_tts_engine_node_type(ct: str) -> bool:
    return "ttsengine" in ct or ("qwen" in ct and "tts" in ct and "engine" in ct) or ("engine_node" in ct and "tts" in ct)



def _apply_tts_text_node_fields(
    out: dict[str, Any],
    nodes_by_id: dict[str, Any],
    text_node_id: str,
    text_node: dict[str, Any],
) -> None:
    tins = _inputs(text_node)
    source = f"{_node_type(text_node)}:{text_node_id}"
    out["sampler"] = {"name": str(_node_type(text_node) or "TTS"), "confidence": "high", "source": source}

    _apply_tts_text_direct_fields(out, tins, source)
    _apply_tts_text_widget_fallback(out, text_node.get("widgets_values"), source)
    _apply_tts_narrator_link_voice(out, nodes_by_id, tins)



def _apply_tts_text_direct_fields(out: dict[str, Any], tins: dict[str, Any], source: str) -> None:
    text_value = tins.get("text")
    if isinstance(text_value, str) and text_value.strip():
        out["positive"] = {"value": text_value.strip(), "confidence": "high", "source": source}
    _set_value_field(out, "seed", _scalar(tins.get("seed")) or _scalar(tins.get("noise_seed")), source)
    _set_named_field(out, "voice", _scalar(tins.get("narrator_voice")), source)
    for key in (
        "enable_chunking",
        "max_chars_per_chunk",
        "chunk_combination_method",
        "silence_between_chunks_ms",
        "enable_audio_cache",
        "batch_size",
        "control_after_generate",
    ):
        _set_value_field(out, key, _scalar(tins.get(key)), source)



def _apply_tts_text_widget_fallback(out: dict[str, Any], widgets: Any, source: str) -> None:
    if not isinstance(widgets, list):
        return
    if "positive" not in out:
        text = _first_long_widget_text(widgets)
        if text:
            out["positive"] = {"value": text, "confidence": "medium", "source": source}
    if "seed" not in out:
        seed = _first_nonnegative_int_scalar(widgets)
        if seed is not None:
            out["seed"] = {"value": seed, "confidence": "medium", "source": source}
    if "voice" not in out:
        voice_name = _widget_voice_name(widgets)
        if voice_name:
            out["voice"] = {"name": voice_name, "confidence": "medium", "source": source}



def _first_long_widget_text(widgets: list[Any]) -> str | None:
    for value in widgets:
        if not isinstance(value, str):
            continue
        stripped = value.strip()
        if len(stripped) > 20:
            return stripped
    return None



def _first_nonnegative_int_scalar(widgets: list[Any]) -> int | None:
    for value in widgets:
        scalar_value = _scalar(value)
        if isinstance(scalar_value, int) and scalar_value >= 0:
            return scalar_value
    return None



def _widget_voice_name(widgets: list[Any]) -> str | None:
    if len(widgets) < 2:
        return None
    voice = widgets[1]
    if isinstance(voice, str) and voice.strip():
        return voice.strip()
    return None



def _apply_tts_narrator_link_voice(out: dict[str, Any], nodes_by_id: dict[str, Any], tins: dict[str, Any]) -> None:
    narrator_link = tins.get("opt_narrator")
    narrator_id = _walk_passthrough(nodes_by_id, narrator_link) if _is_link(narrator_link) else None
    narrator_node = nodes_by_id.get(narrator_id) if narrator_id else None
    if not isinstance(narrator_node, dict):
        return
    voice_name = _scalar(_inputs(narrator_node).get("voice_name"))
    if voice_name is None or not str(voice_name).strip():
        return
    out["voice"] = {
        "name": str(voice_name).strip(),
        "confidence": "high",
        "source": f"{_node_type(narrator_node)}:{narrator_id}",
    }



def _apply_tts_engine_node_fields(out: dict[str, Any], engine_node_id: str, engine_node: dict[str, Any]) -> None:
    eins = _inputs(engine_node)
    source = f"{_node_type(engine_node)}:{engine_node_id}"
    _apply_tts_engine_direct_fields(out, eins, source)
    _apply_tts_engine_widget_fields(out, engine_node, source)



def _apply_tts_engine_direct_fields(out: dict[str, Any], eins: dict[str, Any], source: str) -> None:
    model_name = _clean_model_id(eins.get("model_size") or eins.get("model") or eins.get("checkpoint") or eins.get("model_name"))
    if model_name:
        out["checkpoint"] = {"name": model_name, "confidence": "high", "source": source}
        out["models"] = {"checkpoint": out["checkpoint"]}
    for key in ("device", "voice_preset", "instruct", "language"):
        _set_value_field(out, key, _scalar(eins.get(key)), source)
    for key in (
        "temperature",
        "top_p",
        "top_k",
        "repetition_penalty",
        "max_new_tokens",
        "dtype",
        "attn_implementation",
        "x_vector_only_mode",
        "use_torch_compile",
        "use_cuda_graphs",
        "compile_mode",
    ):
        _set_value_field(out, key, _scalar(eins.get(key)), source)



def _apply_tts_engine_widget_fields(out: dict[str, Any], engine_node: dict[str, Any], source: str) -> None:
    ewidgets = engine_node.get("widgets_values")
    if not isinstance(ewidgets, list):
        return
    ect = _lower(_node_type(engine_node))
    _apply_tts_engine_widget_checkpoint(out, ewidgets, source)
    _apply_tts_engine_widget_language(out, ewidgets, ect, source)
    if "qwen3ttsengine" in ect:
        _apply_tts_engine_qwen_widgets(out, ewidgets, source)



def _apply_tts_engine_widget_checkpoint(out: dict[str, Any], ewidgets: list[Any], source: str) -> None:
    if "checkpoint" in out or not ewidgets:
        return
    guess_model = _clean_model_id(ewidgets[0])
    if not guess_model:
        return
    out["checkpoint"] = {"name": guess_model, "confidence": "medium", "source": source}
    out["models"] = {"checkpoint": out["checkpoint"]}



def _apply_tts_engine_widget_language(out: dict[str, Any], ewidgets: list[Any], ect: str, source: str) -> None:
    if "language" in out:
        return
    guess_lang = _scalar(ewidgets[3]) if "qwen3ttsengine" in ect and len(ewidgets) > 3 else None
    if guess_lang is None:
        for value in ewidgets:
            if isinstance(value, str) and value.strip() and value.strip().lower() not in ("auto", "default"):
                guess_lang = value
                break
    if guess_lang is not None:
        out["language"] = {"value": str(guess_lang).strip(), "confidence": "medium", "source": source}



def _apply_tts_engine_qwen_widgets(out: dict[str, Any], ewidgets: list[Any], source: str) -> None:
    qwen_widget_indices = {
        "device": 1,
        "voice_preset": 2,
        "top_k": 5,
        "top_p": 6,
        "temperature": 7,
        "repetition_penalty": 8,
        "max_new_tokens": 9,
    }
    for key, idx in qwen_widget_indices.items():
        if key in out or len(ewidgets) <= idx:
            continue
        value = _scalar(ewidgets[idx])
        if value is None:
            continue
        out[key] = {
            "value": value if key not in ("device", "voice_preset") else str(value).strip(),
            "confidence": "medium",
            "source": source,
        }



def _extract_tts_geninfo_fallback(nodes_by_id: dict[str, Any], workflow_meta: dict[str, Any] | None) -> dict[str, Any] | None:
    text_node_id, text_node, engine_node_id, engine_node = _find_tts_nodes(nodes_by_id)
    if not text_node and not engine_node:
        return None

    out: dict[str, Any] = {
        "engine": {
            "parser_version": "geninfo-tts-v1",
            "type": "tts",
            "sink": "audio",
        }
    }
    if workflow_meta:
        out["metadata"] = workflow_meta

    _apply_tts_text_node_fields_safe(out, nodes_by_id, text_node_id, text_node)
    _apply_tts_engine_node_fields_safe(out, engine_node_id, engine_node)
    _apply_tts_input_files(out, nodes_by_id)

    if len(out.keys()) <= 1:
        return None
    return out



def _apply_tts_text_node_fields_safe(
    out: dict[str, Any],
    nodes_by_id: dict[str, Any],
    text_node_id: str | None,
    text_node: Any,
) -> None:
    try:
        if text_node_id and isinstance(text_node, dict):
            _apply_tts_text_node_fields(out, nodes_by_id, text_node_id, text_node)
    except Exception:
        pass



def _apply_tts_engine_node_fields_safe(
    out: dict[str, Any],
    engine_node_id: str | None,
    engine_node: Any,
) -> None:
    try:
        if engine_node_id and isinstance(engine_node, dict):
            _apply_tts_engine_node_fields(out, engine_node_id, engine_node)
    except Exception:
        pass



def _apply_tts_input_files(out: dict[str, Any], nodes_by_id: dict[str, Any]) -> None:
    input_files = _extract_input_files(nodes_by_id)
    if input_files:
        out["inputs"] = input_files



