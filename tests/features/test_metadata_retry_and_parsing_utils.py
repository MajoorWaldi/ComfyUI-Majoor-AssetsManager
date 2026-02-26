import base64
import zlib
from types import SimpleNamespace

from mjr_am_backend.features.metadata import parsing_utils as pu
from mjr_am_backend.features.metadata import retry_coordinator as rc
from mjr_am_backend.shared import ErrorCode, Result


def test_retry_coordinator_transient_fill_log_and_extract(monkeypatch, tmp_path):
    p = tmp_path / "a.png"
    p.write_text("x", encoding="utf-8")

    assert rc.is_transient_metadata_read_error(
        Result.Err(ErrorCode.NOT_FOUND, "x"),
        str(p),
        hints=("timeout",),
    ) is True
    assert rc.is_transient_metadata_read_error(
        Result.Err("X", "network timeout"),
        str(p),
        hints=("timeout",),
    ) is True

    results = {str(p): Result.Ok({"x": 1})}
    rc.fill_other_batch_results(results, [str(p), "b"], lambda path: {"filepath": path})
    assert "b" in results and results["b"].ok

    logs = []

    class _L:
        def log(self, level, fmt, *args):
            logs.append((level, fmt, args))

    rc.log_metadata_issue(_L(), 20, "msg", str(p), scan_id="s1", tool="exif", error="e", duration_seconds=1.23)
    assert logs

    monkeypatch.setattr(rc, "extract_rating_tags_from_exif", lambda data: (4, ["a", "b"]))
    exiftool = SimpleNamespace(read=lambda fp, tags=None: Result.Ok({"x": 1}))
    out = rc.extract_rating_tags_only(exiftool, str(p), _L(), scan_id="s")
    assert out.ok and out.data["rating"] == 4


def test_parsing_utils_json_and_graph_helpers(monkeypatch):
    obj = {"a": 1}
    monkeypatch.setattr(pu, "MIN_BASE64_CANDIDATE_LEN", 1)
    compressed = zlib.compress(b'{"a":1,"pad":"' + (b"x" * 200) + b'"}')
    b64 = base64.b64encode(compressed).decode("ascii")
    parsed = pu.try_parse_json_text(b64)
    assert parsed and parsed["a"] == 1
    assert pu.try_parse_json_text("workflow: {\"a\":1}") == obj
    assert pu.parse_json_value(["x", "{\"a\":1}"]) == obj

    wf = {"nodes": [{"id": 1, "type": "KSampler", "inputs": {}}], "links": []}
    assert pu.looks_like_comfyui_workflow(wf) is True
    pg = {"1": {"class_type": "KSampler", "inputs": {"steps": 1}}, "2": {"class_type": "SaveImage", "inputs": {}}}
    assert pu.looks_like_comfyui_prompt_graph(pg) is True
    assert pu.looks_like_prompt_node_id("91:68") is True


def test_parse_auto1111_params_helpers():
    text = "a prompt\nNegative prompt: bad\nSteps: 20, Sampler: Euler, CFG scale: 7.0, Seed: 123, Size: 512x768, Model: foo.safetensors"
    out = pu.parse_auto1111_params(text)
    assert out and out["steps"] == 20 and out["cfg"] == 7.0 and out["seed"] == 123
    assert out["width"] == 512 and out["height"] == 768 and out["model"] == "foo.safetensors"
