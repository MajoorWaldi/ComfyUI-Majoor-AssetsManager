"""Which JSON files are workflows, and which are not, in the Workflow tab."""

from __future__ import annotations

import json
from pathlib import Path

from mjr_am_backend.features.workflows import service as svc

UI = {"last_node_id": 1, "nodes": [{"id": 1, "type": "KSampler"}], "links": [], "version": 0.4}
API = {"3": {"class_type": "KSampler", "inputs": {"seed": 1}}}


def _write(path: Path, data, *, bom: bool = False) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    raw = json.dumps(data).encode()
    path.write_bytes((b"\xef\xbb\xbf" if bom else b"") + raw)
    return path


def _listed(root: Path) -> dict[str, dict]:
    res = svc._list_workflows_from_filesystem(
        roots=[root], query="", limit=100, offset=0, sort="name", subfolder=""
    )
    assert res.ok, res.error
    return {f"{c['subfolder']}/{c['filename']}".lstrip("/"): c for c in res.data["assets"]}


def test_formats():
    assert svc.workflow_json_format(UI) == "ui"
    assert svc.workflow_json_format({"nodes": [], "links": [], "version": 0.4}) == "ui"
    assert svc.workflow_json_format(API) == "api"
    assert svc.workflow_json_format({"prompt": json.dumps(API)}) == "api"
    assert svc.workflow_json_format({"workflow": UI}) == "ui"
    assert svc.workflow_json_format({"theme": "dark"}) == ""
    assert svc.workflow_json_format({"nodes": [1, 2, 3]}) == ""
    assert svc.workflow_json_format([UI]) == ""


def test_listing_skips_snapshots_and_non_workflows(tmp_path: Path, monkeypatch):
    root = tmp_path / "workflows"
    monkeypatch.setenv("MJR_AM_WORKFLOW_DIRECTORIES", str(root))
    _write(root / "flow.json", UI)
    _write(root / ".history" / "flow" / "20260101-save.json", UI)
    _write(root / "sub" / ".hidden.json", UI)
    _write(root / "settings.json", {"theme": "dark"})
    _write(root / "bom.json", UI, bom=True)
    _write(root / "api.json", API)

    listed = _listed(root)

    assert set(listed) == {"flow.json", "bom.json", "api.json"}
    assert listed["api.json"]["workflow_format"] == "api"
    assert listed["api.json"]["node_count"] == 1
    assert listed["flow.json"]["workflow_format"] == "ui"


def test_invalid_json_is_not_kept_as_seen_in_index(tmp_path: Path):
    root = tmp_path / "workflows"
    bogus = _write(root / "settings.json", {"theme": "dark"})
    filepath, updated = svc._refresh_workflow_index_path(
        None, bogus, root, {}, force_full_refresh=True  # type: ignore[arg-type]
    )
    assert filepath is None and updated is False


def test_read_refuses_files_outside_workflow_roots(tmp_path: Path, monkeypatch):
    root = tmp_path / "workflows"
    inside = _write(root / "flow.json", UI)
    outside = _write(tmp_path / "elsewhere" / "flow.json", UI)
    monkeypatch.setenv("MJR_AM_WORKFLOW_DIRECTORIES", str(root))

    assert svc._safe_read_workflow_json(inside) is not None
    assert svc._safe_read_workflow_json(outside) is None
    assert svc._safe_read_workflow_json(root / ".." / "elsewhere" / "flow.json") is None
