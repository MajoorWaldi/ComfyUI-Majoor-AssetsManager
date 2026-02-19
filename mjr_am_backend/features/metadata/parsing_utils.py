"""
Shared parsing utilities for metadata extraction (used by both generic extractors.py and native_extractors.py).
"""
import json
import base64
import re
import zlib
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

MAX_METADATA_JSON_SIZE = 10 * 1024 * 1024  # 10MB
# 50MB Decompressed limit (Critical-003)
MAX_DECOMPRESSED_SIZE = 50 * 1024 * 1024
MIN_BASE64_CANDIDATE_LEN = 80

_BASE64_RE = re.compile(r"^[A-Za-z0-9+/=\s]+$")
_AUTO1111_KV_RE = re.compile(r"(?:^|,\s*)([^:,]+):\s*")


def _safe_zlib_decompress(data: bytes, max_size: int = MAX_DECOMPRESSED_SIZE) -> Optional[bytes]:
    """
    Safely decompress zlib data with size limit.
    """
    try:
        decompressor = zlib.decompressobj()
        result = bytearray()

        chunk_size = 81920 # 80KB chunks
        offset = 0

        while offset < len(data):
            chunk = decompressor.decompress(data[offset:offset + chunk_size])
            if chunk:
                result.extend(chunk)
                if len(result) > max_size:
                    return None
            offset += chunk_size

        chunk = decompressor.flush()
        if chunk:
            result.extend(chunk)

        if len(result) > max_size:
            return None

        return bytes(result)
    except Exception:
        return None


def try_parse_json_text(text: str) -> Optional[Dict[str, Any]]:
    """Parse JSON embedded in text, handling standard ComfyUI prefixes."""
    if not isinstance(text, str):
        return None
    raw = text.strip()
    if not raw:
        return None

    raw = _strip_known_json_prefix(raw)

    if len(raw) > MAX_METADATA_JSON_SIZE:
        return None

    direct = _loads_maybe_dict(raw)
    if direct is not None:
        return direct

    decoded = _decode_base64_candidate(raw)
    if decoded is None:
        return None

    decoded = _maybe_decompress_zlib(decoded)
    decoded_text = _decode_utf8_text(decoded)
    if decoded_text is None:
        return None

    if not decoded_text or len(decoded_text) > MAX_METADATA_JSON_SIZE:
        return None

    return _loads_maybe_dict(decoded_text)


def _strip_known_json_prefix(raw: str) -> str:
    lower_raw = raw.lower()
    if lower_raw.startswith("workflow:"):
        return raw[9:].strip()
    if lower_raw.startswith("prompt:"):
        return raw[7:].strip()
    if lower_raw.startswith("makeprompt:"):
        return raw[11:].strip()
    return raw


def _loads_maybe_dict(text: str) -> Optional[Dict[str, Any]]:
    try:
        parsed = json.loads(text)
    except Exception:
        return None
    if isinstance(parsed, dict):
        return parsed
    if isinstance(parsed, str):
        try:
            nested = json.loads(parsed)
        except Exception:
            return None
        return nested if isinstance(nested, dict) else None
    return None


def _decode_base64_candidate(raw: str) -> Optional[bytes]:
    if len(raw) < MIN_BASE64_CANDIDATE_LEN or len(raw) > (MAX_METADATA_JSON_SIZE * 2):
        return None
    if not _BASE64_RE.match(raw):
        return None
    try:
        return base64.b64decode(raw, validate=False)
    except Exception:
        return None


def _maybe_decompress_zlib(decoded: bytes) -> bytes:
    if not (decoded.startswith(b"x\x9c") or decoded.startswith(b"x\xda")):
        return decoded
    decompressed = _safe_zlib_decompress(decoded)
    return decompressed if decompressed is not None else decoded


def _decode_utf8_text(decoded: bytes) -> Optional[str]:
    try:
        return decoded.decode("utf-8", errors="replace").strip()
    except Exception:
        return None


def parse_json_value(value: Any) -> Optional[Dict[str, Any]]:
    """Try to parse a JSON payload from a tag value. Accept strings or lists."""
    candidates = []
    if isinstance(value, str):
        candidates = [value]
    elif isinstance(value, (list, tuple)):
        candidates = [v for v in value if isinstance(v, str)]
    else:
        return None

    for raw in candidates:
        parsed = try_parse_json_text(raw)
        if isinstance(parsed, dict):
            return parsed

    return None


def looks_like_prompt_node_id(value: Any) -> bool:
    """Accept plain integers or colon-delimited numeric ids (e.g. '91:68')."""
    if isinstance(value, int):
        return True
    if not isinstance(value, str):
        return False
    parts = value.split(":")
    if not parts:
        return False
    return all(part.isdigit() for part in parts)


def looks_like_comfyui_workflow(value: Optional[Dict[str, Any]]) -> bool:
    """Heuristic check for ComfyUI workflow graph."""
    if not isinstance(value, dict):
        return False

    nodes = value.get("nodes")
    if not isinstance(nodes, list) or not nodes:
        return False

    links = value.get("links")
    if links is not None and not isinstance(links, list):
        return False

    sample = nodes[:5]
    valid_nodes = sum(1 for node in sample if _looks_like_workflow_node(node))
    min_required = max(1, len(sample) // 2)
    return valid_nodes >= min_required


def _looks_like_workflow_node(node: Any) -> bool:
    if not isinstance(node, dict):
        return False
    if "type" in node and "id" in node:
        return True
    if "id" not in node:
        return False
    return any(key in node for key in ("title", "outputs", "inputs"))


def looks_like_comfyui_prompt_graph(value: Optional[Dict[str, Any]]) -> bool:
    """Heuristic check for ComfyUI prompt graph (runtime prompt dict)."""
    if not isinstance(value, dict) or not value:
        return False

    # Avoid confusing workflow exports (they have `nodes: []`).
    if "nodes" in value and isinstance(value.get("nodes"), list):
        return False

    keys = list(value.keys())[:8]
    digit_keys, valid_nodes = _prompt_graph_key_and_node_counts(value, keys)
    threshold = max(2, len(keys) // 2)
    return digit_keys >= threshold and valid_nodes >= threshold


def _prompt_graph_key_and_node_counts(graph: Dict[str, Any], keys: list[Any]) -> tuple[int, int]:
    digit_keys = 0
    valid_nodes = 0
    for key in keys:
        if looks_like_prompt_node_id(key):
            digit_keys += 1
        if _prompt_graph_node_looks_valid(graph.get(key)):
            valid_nodes += 1
    return digit_keys, valid_nodes


def _prompt_graph_node_looks_valid(node: Any) -> bool:
    if not isinstance(node, dict):
        return False
    ct = node.get("class_type") or node.get("type")
    ins = node.get("inputs")
    return isinstance(ct, str) and isinstance(ins, dict)


def parse_auto1111_params(params_text: str) -> Optional[Dict[str, Any]]:
    """Parse Auto1111/Forge parameters text."""
    if not params_text:
        return None

    try:
        text = params_text.strip()
        if not text:
            return None

        result: Dict[str, Any] = {}
        remaining = _split_auto1111_prompt_and_remaining(text, result)
        if remaining:
            _parse_auto1111_kv_block(remaining, result)

        return result or None

    except Exception as e:
        logger.debug(f"Failed to parse Auto1111 params: {e}")
        return None


def _split_auto1111_prompt_and_remaining(text: str, result: Dict[str, Any]) -> str:
    neg_marker = "Negative prompt:"
    neg_idx = text.find(neg_marker)
    if neg_idx != -1:
        result["prompt"] = text[:neg_idx].strip()
        after = text[neg_idx + len(neg_marker) :].lstrip()
        split_idx = _find_auto1111_params_start(after)
        if split_idx is not None:
            result["negative_prompt"] = after[:split_idx].strip()
            return after[split_idx:].strip()
        result["negative_prompt"] = after.strip()
        return ""
    split_idx = _find_auto1111_params_start(text)
    if split_idx is not None:
        result["prompt"] = text[:split_idx].strip()
        return text[split_idx:].strip()
    return _fallback_split_prompt_and_remaining(text, result)


def _find_auto1111_params_start(text: str) -> Optional[int]:
    match = re.search(r"\n(?:Steps|Size|Model|Seed|CFG|Sampler|Denoising|Ens|Version):", text)
    if not match:
        return None
    return match.start()


def _fallback_split_prompt_and_remaining(text: str, result: Dict[str, Any]) -> str:
    steps_idx = text.find("\nSteps:")
    if steps_idx == -1:
        if text.startswith("Steps:"):
            result["prompt"] = ""
            return text
        result["prompt"] = text
        return ""
    result["prompt"] = text[:steps_idx].strip()
    return text[steps_idx:].lstrip()


def _parse_auto1111_kv_block(remaining: str, result: Dict[str, Any]) -> None:
    matches = list(_AUTO1111_KV_RE.finditer(remaining))
    for i, match in enumerate(matches):
        key = match.group(1).strip().lower().replace(" ", "_")
        if not key:
            continue
        value = _extract_auto1111_kv_value(remaining, matches, i, match)
        _apply_auto1111_kv(result, key, value)


def _extract_auto1111_kv_value(remaining: str, matches: list[Any], idx: int, match: Any) -> str:
    value_start = match.end()
    value_end = matches[idx + 1].start() if (idx + 1) < len(matches) else len(remaining)
    return remaining[value_start:value_end].strip().strip(",").strip()


def _apply_auto1111_kv(result: Dict[str, Any], key: str, value: str) -> None:
    if key == "steps":
        _set_int_kv(result, "steps", value)
        return
    if key == "sampler":
        result["sampler"] = value
        return
    if key in ("cfg_scale", "cfg"):
        _set_float_kv(result, "cfg", value)
        return
    if key == "seed":
        _set_int_kv(result, "seed", value)
        return
    if key in ("size", "hires_resize"):
        _set_size_kv(result, value)
        return
    if key == "model":
        result["model"] = value


def _set_int_kv(result: Dict[str, Any], key: str, value: str) -> None:
    try:
        result[key] = int(value)
    except (ValueError, TypeError):
        return


def _set_float_kv(result: Dict[str, Any], key: str, value: str) -> None:
    try:
        result[key] = float(value)
    except (ValueError, TypeError):
        return


def _set_size_kv(result: Dict[str, Any], value: str) -> None:
    if "x" not in value:
        return
    w, h = value.split("x", 1)
    try:
        result["width"] = int(w.strip())
        result["height"] = int(h.strip())
    except (ValueError, TypeError):
        return
