import types
from pathlib import Path

from mjr_am_backend.routes.assets import path_guard as g


def test_is_resolved_path_allowed_and_safe_download_filename(monkeypatch, tmp_path: Path):
    monkeypatch.setattr(g, "_is_path_allowed", lambda p: True)
    monkeypatch.setattr(g, "_is_path_allowed_custom", lambda p: False)
    assert g.is_resolved_path_allowed(tmp_path) is True

    monkeypatch.setattr(g, "_is_path_allowed", lambda p: (_ for _ in ()).throw(RuntimeError("x")))
    assert g.is_resolved_path_allowed(tmp_path) is False

    assert '"' not in g.safe_download_filename('a";\n\rb.png')


def test_delete_file_best_effort_branches(monkeypatch, tmp_path: Path):
    missing = tmp_path / "missing.png"
    assert g.delete_file_best_effort(missing).ok

    existing = tmp_path / "a.txt"
    existing.write_text("x", encoding="utf-8")

    mod = types.SimpleNamespace(send2trash=lambda _p: None)
    monkeypatch.setitem(__import__("sys").modules, "send2trash", mod)
    out = g.delete_file_best_effort(existing)
    assert out.ok and out.data is True

    existing2 = tmp_path / "b.txt"
    existing2.write_text("x", encoding="utf-8")
    mod2 = types.SimpleNamespace(send2trash=lambda _p: (_ for _ in ()).throw(RuntimeError("x")))
    monkeypatch.setitem(__import__("sys").modules, "send2trash", mod2)
    out2 = g.delete_file_best_effort(existing2)
    assert out2.ok and out2.meta.get("method") in {"unlink_fallback", "unlink"}


def test_resolve_download_path_and_build_response(monkeypatch, tmp_path: Path):
    f = tmp_path / "a.png"
    f.write_text("x", encoding="utf-8")

    monkeypatch.setattr(g, "_normalize_path", lambda fp: Path(fp))
    monkeypatch.setattr(g, "is_resolved_path_allowed", lambda p: True)
    resolved = g.resolve_download_path(str(f))
    assert isinstance(resolved, Path)

    not_found = g.resolve_download_path(str(tmp_path / "missing.png"))
    assert getattr(not_found, "status", None) == 404

    monkeypatch.setattr(g, "is_resolved_path_allowed", lambda p: False)
    forbidden = g.resolve_download_path(str(f))
    assert getattr(forbidden, "status", None) == 403

    monkeypatch.setattr(g, "_normalize_path", lambda fp: None)
    bad = g.resolve_download_path("x")
    assert getattr(bad, "status", None) == 400

    resp = g.build_download_response(f, preview=True)
    assert resp.headers.get("X-Content-Type-Options") == "nosniff"


def test_resolve_download_path_rejects_when_final_open_detects_symlink_swap(monkeypatch, tmp_path: Path):
    f = tmp_path / "a.png"
    f.write_bytes(b"x")

    monkeypatch.setattr(g, "_normalize_path", lambda _fp: f)
    monkeypatch.setattr(g, "is_resolved_path_allowed", lambda _p: True)
    monkeypatch.setattr(g, "_validate_no_symlink_open", lambda _p: False)

    out = g.resolve_download_path(str(f))
    assert getattr(out, "status", None) == 403
