"""Sidecar JSON files that carry ComfyUI metadata for a media file.

Many save nodes and external tools write the generation data next to the file
instead of (or in addition to) embedding it, typically for formats that cannot
hold it (JPEG/MP4 from some savers, OBJ/PLY/STL meshes) or when embedding is
disabled. Two naming conventions are recognised, in this order:

* ``<file>.<ext>.json`` -- e.g. ``image.png.json``, ``mesh.obj.json``
* ``<stem>.json``       -- e.g. ``image.json`` next to ``image.png``

The JSON may be a UI workflow, an API prompt graph, or an object wrapping
them (``{"workflow": ..., "prompt": ...}``, values may be JSON strings), plus
optional ``parameters`` / ``geninfo`` / ``generation_time_ms``. Sidecars are
only a fallback: embedded metadata always wins.
"""

from __future__ import annotations

import json
import os
from typing import Any

from ...shared import get_logger
from .parsing_utils import (
    looks_like_comfyui_prompt_graph,
    looks_like_comfyui_workflow,
    try_parse_json_text,
)

logger = get_logger(__name__)

MAX_SIDECAR_FILE_BYTES = 10 * 1024 * 1024  # 10 MB
SIDECAR_EXTRA_KEYS = ("parameters", "geninfo", "generation_time_ms")


def sidecar_candidates(file_path: str) -> list[str]:
    """Candidate sidecar paths for ``file_path``, most specific first."""
    path = str(file_path or "")
    if not path:
        return []
    out = [path + ".json"]
    stem, ext = os.path.splitext(path)
    if ext and ext.lower() != ".json":
        out.append(stem + ".json")
    return out


def find_sidecar_json(file_path: str) -> str | None:
    for candidate in sidecar_candidates(file_path):
        try:
            if os.path.isfile(candidate):
                return candidate
        except OSError:
            continue
    return None


def read_sidecar_json(sidecar_path: str) -> dict[str, Any] | None:
    """Read a sidecar as a JSON object (size-capped, UTF-8 with or without BOM)."""
    try:
        size = os.path.getsize(sidecar_path)
        if size > MAX_SIDECAR_FILE_BYTES:
            logger.warning("Sidecar JSON too large (%s bytes): %s", size, sidecar_path)
            return None
        with open(sidecar_path, encoding="utf-8-sig") as handle:
            data = json.load(handle)
        return data if isinstance(data, dict) else None
    except (OSError, ValueError, UnicodeDecodeError) as exc:
        logger.debug("Failed to read sidecar JSON %s: %s", sidecar_path, exc)
        return None


def _typed_field(raw: Any, predicate: Any) -> Any | None:
    if isinstance(raw, dict) and predicate(raw):
        return raw
    if isinstance(raw, str):
        parsed = try_parse_json_text(raw)
        if parsed and predicate(parsed):
            return parsed
    return None


def classify_sidecar_data(data: dict[str, Any]) -> dict[str, Any]:
    """Split sidecar content into ``workflow`` / ``prompt`` (+ known extras)."""
    result: dict[str, Any] = {
        "workflow": _typed_field(data.get("workflow"), looks_like_comfyui_workflow),
        "prompt": _typed_field(data.get("prompt"), looks_like_comfyui_prompt_graph),
    }
    if not result["workflow"] and not result["prompt"]:
        if looks_like_comfyui_prompt_graph(data):
            result["prompt"] = data
        elif looks_like_comfyui_workflow(data):
            result["workflow"] = data
    for key in SIDECAR_EXTRA_KEYS:
        if key in data:
            result[key] = data[key]
    return result


def load_sidecar_metadata(file_path: str) -> dict[str, Any] | None:
    """Classified sidecar data for ``file_path`` with ``sidecar_path`` set, or None."""
    sidecar_path = find_sidecar_json(file_path)
    if not sidecar_path:
        return None
    data = read_sidecar_json(sidecar_path)
    if not data:
        return None
    classified = classify_sidecar_data(data)
    if not (classified.get("workflow") or classified.get("prompt") or any(
        classified.get(key) is not None for key in SIDECAR_EXTRA_KEYS
    )):
        return None
    classified["sidecar_path"] = sidecar_path
    return classified


def apply_sidecar_fallback(combined: dict[str, Any], file_path: str | None = None) -> bool:
    """Fill missing workflow/prompt/extras of ``combined`` from a sidecar.

    Embedded values are never overwritten. Returns True when anything was added.
    """
    if not isinstance(combined, dict):
        return False
    if combined.get("workflow") and combined.get("prompt"):
        return False
    path = file_path
    if not path:
        info = combined.get("file_info")
        path = info.get("filepath") if isinstance(info, dict) else None
    if not path:
        return False
    sidecar = load_sidecar_metadata(str(path))
    if not sidecar:
        return False
    added = False
    for key in ("workflow", "prompt", *SIDECAR_EXTRA_KEYS):
        value = sidecar.get(key)
        if value is not None and not combined.get(key):
            combined[key] = value
            added = True
    if added:
        combined["sidecar_path"] = sidecar["sidecar_path"]
    return added


__all__ = [
    "MAX_SIDECAR_FILE_BYTES",
    "apply_sidecar_fallback",
    "classify_sidecar_data",
    "find_sidecar_json",
    "load_sidecar_metadata",
    "read_sidecar_json",
    "sidecar_candidates",
]
