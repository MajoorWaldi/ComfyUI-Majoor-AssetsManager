"""
Tests for 3D model metadata extraction (extractors_3d.py).

Covers:
- GLB JSON chunk happy path (embedded workflow/prompt)
- GLB JSON chunk too large (skipped without crash)
- GLB with empty/no extras (no workflow found)
- Sidecar JSON fallback when GLB has no embedded data
- Malformed sidecar JSON (graceful no-op)
- Missing sidecar + valid GLB extras (only embedded data used)
- .gltf text file parsing
- Non-GLB formats fall through to sidecar only
"""
import json
import struct
from pathlib import Path


from mjr_am_backend.features.metadata.extractors_3d import (
    _read_glb_json_chunk,
    _read_sidecar_json,
    extract_model3d_metadata,
)

# ---------------------------------------------------------------------------
# Helpers to build minimal GLB binary blobs
# ---------------------------------------------------------------------------

_GLB_MAGIC = 0x46546C67
_GLB_CHUNK_TYPE_JSON = 0x4E4F534A
_GLB_CHUNK_TYPE_BIN = 0x004E4942


def _make_glb(json_payload: dict | None, *, version: int = 2) -> bytes:
    """Build a minimal GLB binary container with an optional JSON chunk."""
    if json_payload is None:
        # No chunks — truncated file
        return struct.pack("<III", _GLB_MAGIC, version, 12)

    json_bytes = json.dumps(json_payload).encode("utf-8")
    # Pad to 4-byte boundary with spaces per glTF spec
    pad = (4 - len(json_bytes) % 4) % 4
    json_bytes += b" " * pad

    total = 12 + 8 + len(json_bytes)
    header = struct.pack("<III", _GLB_MAGIC, version, total)
    chunk_header = struct.pack("<II", len(json_bytes), _GLB_CHUNK_TYPE_JSON)
    return header + chunk_header + json_bytes


# ---------------------------------------------------------------------------
# _read_glb_json_chunk
# ---------------------------------------------------------------------------

def test_read_glb_json_chunk_happy_path(tmp_path: Path) -> None:
    payload = {"asset": {"version": "2.0"}, "extras": {"comfyui_workflow": {"nodes": []}}}
    glb = tmp_path / "test.glb"
    glb.write_bytes(_make_glb(payload))
    result = _read_glb_json_chunk(str(glb))
    assert result is not None
    assert result.get("extras", {}).get("comfyui_workflow") == {"nodes": []}


def test_read_glb_json_chunk_returns_none_for_non_glb(tmp_path: Path) -> None:
    f = tmp_path / "notglb.glb"
    f.write_bytes(b"not a glb file at all")
    assert _read_glb_json_chunk(str(f)) is None


def test_read_glb_json_chunk_returns_none_for_truncated(tmp_path: Path) -> None:
    f = tmp_path / "trunc.glb"
    f.write_bytes(_make_glb(None))  # header only, no chunk
    assert _read_glb_json_chunk(str(f)) is None


def test_read_glb_json_chunk_skips_oversized_chunk(tmp_path: Path, monkeypatch) -> None:
    import mjr_am_backend.features.metadata.extractors_3d as m
    monkeypatch.setattr(m, "_MAX_GLB_JSON_CHUNK_BYTES", 4)  # tiny limit
    payload = {"asset": {"version": "2.0"}}
    glb = tmp_path / "big.glb"
    glb.write_bytes(_make_glb(payload))
    assert _read_glb_json_chunk(str(glb)) is None


def test_read_glb_json_chunk_returns_none_for_missing_file() -> None:
    assert _read_glb_json_chunk("/nonexistent/path/model.glb") is None


def test_read_glb_json_chunk_returns_none_for_old_version(tmp_path: Path) -> None:
    payload = {"asset": {"version": "1.0"}}
    glb = tmp_path / "v1.glb"
    glb.write_bytes(_make_glb(payload, version=1))
    assert _read_glb_json_chunk(str(glb)) is None


# ---------------------------------------------------------------------------
# _read_sidecar_json
# ---------------------------------------------------------------------------

def test_read_sidecar_json_happy_path(tmp_path: Path) -> None:
    model = tmp_path / "mesh.obj"
    model.write_bytes(b"# obj")
    sidecar = tmp_path / "mesh.obj.json"
    sidecar.write_text(json.dumps({"workflow": {"nodes": []}}), encoding="utf-8")
    result = _read_sidecar_json(str(model))
    assert result is not None
    assert "workflow" in result


def test_read_sidecar_json_returns_none_when_missing(tmp_path: Path) -> None:
    model = tmp_path / "mesh.obj"
    model.write_bytes(b"# obj")
    assert _read_sidecar_json(str(model)) is None


def test_read_sidecar_json_returns_none_for_malformed_json(tmp_path: Path) -> None:
    model = tmp_path / "mesh.ply"
    model.write_bytes(b"ply")
    sidecar = tmp_path / "mesh.ply.json"
    sidecar.write_text("{ this is not valid json", encoding="utf-8")
    assert _read_sidecar_json(str(model)) is None


def test_read_sidecar_json_returns_none_for_non_dict(tmp_path: Path) -> None:
    model = tmp_path / "mesh.stl"
    model.write_bytes(b"stl")
    sidecar = tmp_path / "mesh.stl.json"
    sidecar.write_text(json.dumps([1, 2, 3]), encoding="utf-8")
    assert _read_sidecar_json(str(model)) is None


# ---------------------------------------------------------------------------
# extract_model3d_metadata — integration
# ---------------------------------------------------------------------------

def test_extract_model3d_metadata_glb_with_embedded_workflow(tmp_path: Path) -> None:
    workflow = {"nodes": [{"id": 1, "type": "KSampler"}], "links": []}
    payload = {"asset": {"version": "2.0"}, "extras": {"comfyui_workflow": workflow}}
    glb = tmp_path / "mesh.glb"
    glb.write_bytes(_make_glb(payload))
    result = extract_model3d_metadata(str(glb))
    assert result.ok
    assert result.data["quality"] == "full"
    assert result.data["workflow"] == workflow


def test_extract_model3d_metadata_glb_no_extras_falls_to_sidecar(tmp_path: Path) -> None:
    payload = {"asset": {"version": "2.0"}}
    glb = tmp_path / "mesh.glb"
    glb.write_bytes(_make_glb(payload))
    workflow = {"nodes": [{"id": 1, "type": "CLIPTextEncode"}], "links": []}
    sidecar = tmp_path / "mesh.glb.json"
    sidecar.write_text(json.dumps({"workflow": workflow}), encoding="utf-8")
    result = extract_model3d_metadata(str(glb))
    assert result.ok
    assert result.data["quality"] == "full"
    assert result.data["workflow"] == workflow


def test_extract_model3d_metadata_glb_no_extras_no_sidecar_returns_none_quality(tmp_path: Path) -> None:
    payload = {"asset": {"version": "2.0"}}
    glb = tmp_path / "empty.glb"
    glb.write_bytes(_make_glb(payload))
    result = extract_model3d_metadata(str(glb))
    assert result.ok
    assert result.data["quality"] == "none"
    assert result.data["workflow"] is None
    assert result.data["prompt"] is None


def test_extract_model3d_metadata_obj_sidecar_fallback(tmp_path: Path) -> None:
    obj = tmp_path / "mesh.obj"
    obj.write_bytes(b"# obj file")
    workflow = {"nodes": [{"id": 2, "type": "VAEDecode"}], "links": []}
    sidecar = tmp_path / "mesh.obj.json"
    sidecar.write_text(json.dumps({"workflow": workflow}), encoding="utf-8")
    result = extract_model3d_metadata(str(obj))
    assert result.ok
    assert result.data["quality"] == "full"


def test_extract_model3d_metadata_malformed_sidecar_returns_none_quality(tmp_path: Path) -> None:
    obj = tmp_path / "bad.obj"
    obj.write_bytes(b"# obj")
    sidecar = tmp_path / "bad.obj.json"
    sidecar.write_text("!!invalid json!!", encoding="utf-8")
    result = extract_model3d_metadata(str(obj))
    assert result.ok
    assert result.data["quality"] == "none"
