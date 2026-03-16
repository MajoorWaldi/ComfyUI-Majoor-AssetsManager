"""
Metadata extractors for 3D model files (.glb, .gltf, .obj, .ply, .stl, .fbx, .splat, .ksplat, .spz).

Extraction strategies:
1. GLB/GLTF: Parse the JSON chunk for ``extras`` containing ComfyUI workflow/prompt.
2. Sidecar files: Look for ``<filename>.json`` next to the 3D file (any format).

ComfyUI-3D-Pack (and similar) nodes embed workflow data in the GLB ``extras``
field or write a companion JSON sidecar when saving OBJ/PLY/STL outputs.
"""
import json
import os
import struct
from typing import Any

from ...shared import Result, get_logger
from .parsing_utils import (
    looks_like_comfyui_prompt_graph,
    looks_like_comfyui_workflow,
    try_parse_json_text,
)

logger = get_logger(__name__)

# Limits to prevent unbounded reads
_MAX_GLB_JSON_CHUNK_BYTES = 10 * 1024 * 1024  # 10 MB (reduced from 50 MB to limit DoS surface)
_MAX_SIDECAR_FILE_BYTES = 10 * 1024 * 1024  # 10 MB

# GLB binary container constants (glTF 2.0 spec)
_GLB_MAGIC = 0x46546C67  # "glTF" in little-endian
_GLB_CHUNK_TYPE_JSON = 0x4E4F534A  # "JSON"


def _read_glb_json_chunk(file_path: str) -> dict[str, Any] | None:
    """Read and parse the JSON chunk from a GLB (Binary glTF) file.

    GLB layout (little-endian):
        Header: magic(4) version(4) length(4)  = 12 bytes
        Chunk 0: chunkLength(4) chunkType(4) chunkData(chunkLength)
        The first chunk MUST be JSON per the spec.
    """
    try:
        with open(file_path, "rb") as f:
            header = f.read(12)
            if len(header) < 12:
                return None
            magic, version, total_length = struct.unpack_from("<III", header)
            if magic != _GLB_MAGIC:
                return None
            if version < 2:
                logger.debug(f"GLB version {version} < 2, skipping: {file_path}")
                return None

            # Read first chunk header
            chunk_header = f.read(8)
            if len(chunk_header) < 8:
                return None
            chunk_length, chunk_type = struct.unpack_from("<II", chunk_header)

            if chunk_type != _GLB_CHUNK_TYPE_JSON:
                logger.debug(f"First GLB chunk is not JSON (type=0x{chunk_type:08X}): {file_path}")
                return None
            if chunk_length > _MAX_GLB_JSON_CHUNK_BYTES:
                logger.warning(f"GLB JSON chunk too large ({chunk_length} bytes): {file_path}")
                return None

            json_bytes = f.read(chunk_length)
            if len(json_bytes) < chunk_length:
                return None

            # glTF JSON chunk is padded with spaces (0x20); strip before parsing
            return json.loads(json_bytes)

    except (OSError, json.JSONDecodeError, struct.error) as exc:
        logger.info(f"Failed to read GLB JSON chunk from {file_path}: {exc}")
        return None


def _extract_extras_from_gltf_json(gltf: dict[str, Any]) -> dict[str, Any] | None:
    """Extract workflow/prompt from the glTF JSON ``extras`` or ``asset.extras`` field."""
    if not isinstance(gltf, dict):
        return None

    # Try top-level extras first, then asset.extras (both are valid per spec)
    for extras_source in [gltf.get("extras"), (gltf.get("asset") or {}).get("extras")]:
        if not isinstance(extras_source, dict):
            continue
        # ComfyUI-3D-Pack stores under various key conventions
        workflow = None
        prompt = None
        for wf_key in ("comfyui_workflow", "workflow", "comfui_workflow"):
            val = extras_source.get(wf_key)
            if val is not None:
                if isinstance(val, str):
                    workflow = try_parse_json_text(val)
                elif isinstance(val, dict):
                    workflow = val
                if workflow:
                    break
        for pr_key in ("comfyui_prompt", "prompt", "comfui_prompt"):
            val = extras_source.get(pr_key)
            if val is not None:
                if isinstance(val, str):
                    prompt = try_parse_json_text(val)
                elif isinstance(val, dict):
                    prompt = val
                if prompt:
                    break
        if workflow or prompt:
            return {"workflow": workflow, "prompt": prompt}

    return None


def _read_gltf_file(file_path: str) -> dict[str, Any] | None:
    """Read and parse a .gltf (text-based glTF) file."""
    try:
        size = os.path.getsize(file_path)
        if size > _MAX_GLB_JSON_CHUNK_BYTES:
            logger.warning(f"GLTF file too large ({size} bytes): {file_path}")
            return None
        with open(file_path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError, UnicodeDecodeError) as exc:
        logger.debug(f"Failed to read GLTF file {file_path}: {exc}")
        return None


def _read_sidecar_json(file_path: str) -> dict[str, Any] | None:
    """Look for a sidecar JSON file next to the 3D file.

    Checks for ``<file>.json`` (e.g. ``model.glb.json``, ``mesh.obj.json``).
    """
    sidecar_path = file_path + ".json"
    if not os.path.isfile(sidecar_path):
        return None
    try:
        size = os.path.getsize(sidecar_path)
        if size > _MAX_SIDECAR_FILE_BYTES:
            logger.warning(f"Sidecar JSON too large ({size} bytes): {sidecar_path}")
            return None
        with open(sidecar_path, encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, dict) else None
    except (OSError, json.JSONDecodeError, UnicodeDecodeError) as exc:
        logger.debug(f"Failed to read sidecar JSON {sidecar_path}: {exc}")
        return None


def _classify_sidecar_data(data: dict[str, Any]) -> dict[str, Any]:
    """Classify sidecar JSON content as workflow, prompt, or parameters."""
    result: dict[str, Any] = {"workflow": None, "prompt": None}

    # Direct workflow/prompt keys
    wf = data.get("workflow")
    if isinstance(wf, dict) and looks_like_comfyui_workflow(wf):
        result["workflow"] = wf
    elif isinstance(wf, str):
        parsed = try_parse_json_text(wf)
        if parsed and looks_like_comfyui_workflow(parsed):
            result["workflow"] = parsed

    pr = data.get("prompt")
    if isinstance(pr, dict) and looks_like_comfyui_prompt_graph(pr):
        result["prompt"] = pr
    elif isinstance(pr, str):
        parsed = try_parse_json_text(pr)
        if parsed and looks_like_comfyui_prompt_graph(parsed):
            result["prompt"] = parsed

    # If the sidecar itself IS a prompt graph or workflow
    if not result["workflow"] and not result["prompt"]:
        if looks_like_comfyui_prompt_graph(data):
            result["prompt"] = data
        elif looks_like_comfyui_workflow(data):
            result["workflow"] = data

    # Copy through any extra metadata fields
    for key in ("parameters", "geninfo", "generation_time_ms"):
        if key in data and key not in result:
            result[key] = data[key]

    return result


def extract_model3d_metadata(
    file_path: str,
    exif_data: dict[str, Any] | None = None,  # noqa: ARG001 — reserved for future EXIF passthrough
) -> Result[dict[str, Any]]:
    """Extract metadata from a 3D model file.

    Returns a Result containing workflow, prompt, and quality fields
    following the same conventions as image/video extractors.
    """
    ext = os.path.splitext(file_path)[1].lower()
    workflow = None
    prompt = None
    extras: dict[str, Any] = {}

    # Strategy 1: Parse embedded data from GLB/GLTF
    if ext == ".glb":
        gltf_json = _read_glb_json_chunk(file_path)
        if gltf_json:
            embedded = _extract_extras_from_gltf_json(gltf_json)
            if embedded:
                workflow = embedded.get("workflow")
                prompt = embedded.get("prompt")
    elif ext == ".gltf":
        gltf_json = _read_gltf_file(file_path)
        if gltf_json:
            embedded = _extract_extras_from_gltf_json(gltf_json)
            if embedded:
                workflow = embedded.get("workflow")
                prompt = embedded.get("prompt")

    # Strategy 2: Sidecar JSON (works for all formats, also as fallback for GLB/GLTF)
    if not workflow and not prompt:
        sidecar = _read_sidecar_json(file_path)
        if sidecar:
            classified = _classify_sidecar_data(sidecar)
            workflow = classified.get("workflow")
            prompt = classified.get("prompt")
            for key in ("parameters", "geninfo", "generation_time_ms"):
                if key in classified and classified[key] is not None:
                    extras[key] = classified[key]

    # Determine quality
    has_workflow = workflow is not None and bool(workflow)
    has_prompt = prompt is not None and bool(prompt)
    if has_workflow or has_prompt:
        quality = "full"
    else:
        quality = "none"

    payload: dict[str, Any] = {
        "workflow": workflow,
        "prompt": prompt,
        "quality": quality,
        **extras,
    }

    return Result.Ok(payload, quality=quality)
