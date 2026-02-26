from pathlib import Path

import pytest

from mjr_am_backend import custom_roots as cr
from mjr_am_backend.shared import Result


def test_normalize_and_canonical_helpers(monkeypatch, tmp_path: Path):
    monkeypatch.setenv("MJR_ALLOW_SYMLINKS", "1")
    d = tmp_path / "a"
    d.mkdir()
    n = cr._normalize_dir_path(str(d))
    assert n is not None
    assert cr._canonical_path_key(str(d)).lower().endswith("a")
    assert cr._path_is_relative_to(d, tmp_path)


def test_read_write_store_and_normalize_row(monkeypatch, tmp_path: Path):
    store = tmp_path / "custom_roots.json"
    monkeypatch.setattr(cr, "_STORE_PATH", store)
    w = cr._write_store({"version": 1, "roots": [{"id": "r1", "path": str(tmp_path)}]})
    assert w.ok
    data = cr._read_store()
    assert isinstance(data.get("roots"), list)
    row = cr._normalize_custom_root_row({"id": "r1", "path": str(tmp_path)})
    assert row and row["id"] == "r1"


def test_add_list_remove_and_resolve_custom_root(monkeypatch, tmp_path: Path):
    store = tmp_path / "custom_roots.json"
    monkeypatch.setattr(cr, "_STORE_PATH", store)
    monkeypatch.setattr(cr, "OUTPUT_ROOT", str(tmp_path / "output"))
    out = tmp_path / "out_root"
    out.mkdir()
    monkeypatch.setattr(cr, "_resolve_builtin_roots", lambda: (None, None))

    add = cr.add_custom_root(str(out), label="X")
    assert add.ok
    rid = add.data["id"]

    listed = cr.list_custom_roots()
    assert listed.ok and listed.data

    resolved = cr.resolve_custom_root(rid)
    assert resolved.ok and isinstance(resolved.data, Path)

    rem = cr.remove_custom_root(rid)
    assert rem.ok
    miss = cr.remove_custom_root(rid)
    assert miss.code == "NOT_FOUND"


def test_overlap_and_invalid_paths(monkeypatch, tmp_path: Path):
    store = tmp_path / "custom_roots.json"
    monkeypatch.setattr(cr, "_STORE_PATH", store)
    root = tmp_path / "root"
    sub = root / "sub"
    sub.mkdir(parents=True)
    monkeypatch.setattr(cr, "_resolve_builtin_roots", lambda: (root, None))
    ov = cr.add_custom_root(str(sub))
    assert ov.code == "OVERLAP"

    inv = cr.add_custom_root(str(tmp_path / "missing"))
    assert inv.code in {"DIR_NOT_FOUND", "INVALID_INPUT"}
