import asyncio
import json
import subprocess
from pathlib import Path

import pytest

from mjr_am_backend.adapters.tools import exiftool as m
from mjr_am_backend.shared import ErrorCode, Result


def _mk_completed(returncode=0, stdout=b"", stderr=b""):
    return subprocess.CompletedProcess(args=["x"], returncode=returncode, stdout=stdout, stderr=stderr)


def test_decode_bytes_best_effort_variants():
    assert m._decode_bytes_best_effort(None) == ("", False)
    assert m._decode_bytes_best_effort("x") == ("x", False)
    assert m._decode_bytes_best_effort(b"abc")[0] == "abc"


def test_tag_validation_helpers():
    assert m._is_safe_exiftool_tag("XMP:Rating") is True
    assert m._is_safe_exiftool_tag("-bad") is False
    assert m._is_safe_exiftool_tag("bad tag") is False

    ok = m._validate_exiftool_tags(["XMP:Rating", "EXIF:Artist"])
    assert ok.ok and len(ok.data) == 2
    bad = m._validate_exiftool_tags(["bad tag"])
    assert bad.code == ErrorCode.INVALID_INPUT


def test_path_match_helpers(tmp_path: Path):
    p = tmp_path / "a.png"
    p.write_text("x")
    key = m._normalize_match_path(str(p))
    assert key
    key2 = m._normalize_match_path("\x00")
    assert key2 is None

    mp, cmd = m._build_match_map([str(p), str(p)])
    assert len(cmd) == 1
    assert len(next(iter(mp.values()))) == 2


@pytest.fixture
def ex(monkeypatch):
    monkeypatch.setattr(m.ExifTool, "_check_available", lambda self: True)
    return m.ExifTool(bin_name="exiftool", timeout=1.0)


def test_executable_resolution_helpers(monkeypatch, tmp_path: Path):
    exep = tmp_path / "exiftool.exe"
    exep.write_text("x")

    monkeypatch.setattr(m.shutil, "which", lambda raw: str(exep) if raw == "exiftool" else None)
    assert m.ExifTool._is_safe_executable_name("exiftool") is True
    assert m.ExifTool._is_safe_executable_name("bad|x") is False
    assert m.ExifTool._resolve_executable_path("exiftool") == str(exep)
    assert m.ExifTool._looks_like_exiftool_name(str(exep)) is True


def test_trusted_roots_and_under_trusted_dirs(monkeypatch, tmp_path: Path):
    d = tmp_path / "bin"
    d.mkdir()
    f = d / "exiftool.exe"
    f.write_text("x")
    monkeypatch.setenv("MAJOOR_EXIFTOOL_TRUSTED_DIRS", str(d))
    assert m.ExifTool._trusted_roots(str(d))
    assert m.ExifTool._is_under_trusted_dirs(str(f)) is True


def test_collect_valid_batch_paths_and_validate_tags(ex, tmp_path: Path):
    p = tmp_path / "a.png"
    p.write_text("x")
    valid, results = ex._collect_valid_batch_paths([str(p), "", str(tmp_path / "missing")])
    assert valid == [str(p)]
    assert len(results) == 2

    safe = ex._validate_batch_tags(["XMP:Rating"], valid, results)
    assert safe == ["XMP:Rating"]
    safe2 = ex._validate_batch_tags(["bad tag"], valid, results)
    assert safe2 is None


def test_build_batch_command_windows(ex, monkeypatch):
    monkeypatch.setattr(m.os, "name", "nt")
    cmd, stdin_input, timeout_s = ex._build_batch_command(["a.png"], [])
    assert "-@" in cmd and isinstance(stdin_input, (bytes, bytearray))
    assert timeout_s == ex.timeout


def test_build_batch_command_non_windows(ex, monkeypatch):
    monkeypatch.setattr(m.os, "name", "posix")
    cmd, stdin_input, timeout_s = ex._build_batch_command(["a.png"], ["XMP:Rating"])
    assert "-XMP:Rating" in cmd
    assert stdin_input is None
    assert timeout_s == ex.timeout


def test_parse_batch_output_paths(ex):
    results = {}
    valid = ["a"]
    data, rep = ex._parse_batch_output(_mk_completed(0, stdout=b'[{"SourceFile":"a"}]', stderr=b""), valid, results)
    assert isinstance(data, list) and rep is False

    data2, _ = ex._parse_batch_output(_mk_completed(1, stdout=b"", stderr=b"err"), valid, results)
    assert data2 is None

    data3, _ = ex._parse_batch_output(_mk_completed(0, stdout=b"{}", stderr=b""), valid, results)
    assert data3 is None


def test_map_and_fill_missing_batch_results():
    results = {}
    key = m._normalize_match_path("a") or "a"
    m.ExifTool._map_batch_results([{"SourceFile": "a", "k": 1}], {key: ["a"]}, results, had_replacements=False)
    assert results["a"].ok
    m.ExifTool._fill_missing_batch_results(["a", "b"], results)
    assert "b" in results and not results["b"].ok


def test_handle_batch_exception_winerror_fallback(ex, monkeypatch):
    called = []
    monkeypatch.setattr(ex, "read", lambda p, t: (called.append((p, t)), Result.Ok({"x": 1}))[1])
    err = OSError("x")
    err.winerror = 206
    out = ex._handle_batch_exception(err, ["a", "b"], {}, ["Tag"])
    assert set(out.keys()) == {"a", "b"}
    assert len(called) == 2


def test_validate_single_read_helpers(tmp_path: Path):
    p = tmp_path / "a.png"
    p.write_text("x")
    ok = m.ExifTool._validate_single_read_path(str(p))
    assert ok.ok
    bad = m.ExifTool._validate_single_read_path("")
    assert bad.code == ErrorCode.INVALID_INPUT

    ok2 = m.ExifTool._validate_single_read_tags(["XMP:Rating"])
    assert ok2.ok
    bad2 = m.ExifTool._validate_single_read_tags(["bad tag"])
    assert bad2.code == ErrorCode.INVALID_INPUT


def test_retry_windows_single_read_file_not_found(ex, monkeypatch):
    monkeypatch.setattr(m.os, "name", "nt")
    first = _mk_completed(1, b"", b"File not found")
    second = _mk_completed(0, b'[{"x":1}]', b"")
    calls = {"n": 0}

    def _run(*_a, **_k):
        calls["n"] += 1
        return second

    monkeypatch.setattr(ex, "_run_exiftool_process", _run)
    out = ex._retry_windows_single_read_file_not_found(first, "a.png", [])
    assert out.returncode == 0 and calls["n"] == 1


def test_parse_single_read_process_branches():
    r1 = m.ExifTool._parse_single_read_process(_mk_completed(1, b"", b"err"), "a")
    assert r1.code == ErrorCode.EXIFTOOL_ERROR

    r2 = m.ExifTool._parse_single_read_process(_mk_completed(0, b"", b""), "a")
    assert r2.code == ErrorCode.PARSE_ERROR

    r3 = m.ExifTool._parse_single_read_process(_mk_completed(0, b"not-json", b""), "a")
    assert r3.code == ErrorCode.PARSE_ERROR

    r4 = m.ExifTool._parse_single_read_process(_mk_completed(0, b"[]", b""), "a")
    assert r4.code == ErrorCode.PARSE_ERROR

    r5 = m.ExifTool._parse_single_read_process(_mk_completed(0, b'[{"a":1}]', b""), "a")
    assert r5.ok


def test_prepare_single_read_inputs_and_read(ex, tmp_path: Path, monkeypatch):
    p = tmp_path / "a.png"
    p.write_text("x")

    monkeypatch.setattr(ex, "_run_single_read_process", lambda path, safe: _mk_completed(0, b'[{"x":1}]', b""))
    out = ex.read(str(p), ["XMP:Rating"])
    assert out.ok

    out2 = ex.read("", None)
    assert out2.code == ErrorCode.INVALID_INPUT


def test_read_handles_timeout_and_exception(ex, tmp_path: Path, monkeypatch):
    p = tmp_path / "a.png"
    p.write_text("x")

    def _to(*_a, **_k):
        raise subprocess.TimeoutExpired(cmd="x", timeout=1)

    monkeypatch.setattr(ex, "_run_single_read_process", _to)
    out = ex.read(str(p), None)
    assert out.code == ErrorCode.TIMEOUT

    monkeypatch.setattr(ex, "_run_single_read_process", lambda *_a, **_k: (_ for _ in ()).throw(RuntimeError("boom")))
    out2 = ex.read(str(p), None)
    assert out2.code == ErrorCode.EXIFTOOL_ERROR


def test_read_batch_main_paths(ex, tmp_path: Path, monkeypatch):
    p = tmp_path / "a.png"
    p.write_text("x")

    payload = json.dumps([{"SourceFile": str(p), "x": 1}]).encode()
    monkeypatch.setattr(ex, "_run_batch_subprocess", lambda *_a, **_k: _mk_completed(0, payload, b""))
    out = ex.read_batch([str(p)], ["XMP:Rating"])
    assert out[str(p)].ok


def test_read_batch_timeout_and_unexpected(ex, tmp_path: Path, monkeypatch):
    p = tmp_path / "a.png"
    p.write_text("x")

    def _timeout(*_a, **_k):
        raise subprocess.TimeoutExpired(cmd="x", timeout=1)

    monkeypatch.setattr(ex, "_run_batch_subprocess", _timeout)
    out = ex.read_batch([str(p)], None)
    assert out[str(p)].code == ErrorCode.TIMEOUT

    monkeypatch.setattr(ex, "_run_batch_subprocess", lambda *_a, **_k: (_ for _ in ()).throw(RuntimeError("boom")))
    out2 = ex.read_batch([str(p)], None)
    assert out2[str(p)].code in {ErrorCode.EXIFTOOL_ERROR, ErrorCode.PARSE_ERROR}


def test_write_helpers_and_write_flow(ex, tmp_path: Path, monkeypatch):
    p = tmp_path / "a.png"
    p.write_text("x")

    assert ex._validate_write_preconditions("") is not None
    assert ex._invalid_write_keys({"XMP:Rating": 5, "bad tag": 1}) == ["bad tag"]

    cmd, stdin_input = ex._build_write_command(str(p), {"XMP:Rating": 5, "XMP:Keywords": ["a", None, "b"]}, True)
    assert "-tagsFromFile" in cmd
    assert isinstance(stdin_input, (str, type(None)))

    monkeypatch.setattr(ex, "_run_write_command", lambda *_a, **_k: _mk_completed(0, b"", b""))
    out = ex.write(str(p), {"XMP:Rating": 5})
    assert out.ok

    monkeypatch.setattr(ex, "_run_write_command", lambda *_a, **_k: _mk_completed(1, b"", b"err"))
    out2 = ex.write(str(p), {"XMP:Rating": 5})
    assert out2.code == ErrorCode.EXIFTOOL_ERROR


def test_write_errors_and_tool_missing(tmp_path: Path, monkeypatch):
    monkeypatch.setattr(m.ExifTool, "_check_available", lambda self: False)
    ex = m.ExifTool()
    out = ex.write("x", {})
    assert out.code == ErrorCode.TOOL_MISSING

    monkeypatch.setattr(m.ExifTool, "_check_available", lambda self: True)
    ex2 = m.ExifTool(timeout=0.1)
    p = tmp_path / "a.png"
    p.write_text("x")

    monkeypatch.setattr(ex2, "_run_write_command", lambda *_a, **_k: (_ for _ in ()).throw(subprocess.TimeoutExpired(cmd="x", timeout=1)))
    out2 = ex2.write(str(p), {"XMP:Rating": 5})
    assert out2.code == ErrorCode.TIMEOUT


@pytest.mark.asyncio
async def test_async_wrappers(ex, tmp_path: Path, monkeypatch):
    p = tmp_path / "a.png"
    p.write_text("x")

    monkeypatch.setattr(ex, "read", lambda path, tags=None: Result.Ok({"p": path, "tags": tags}))
    monkeypatch.setattr(ex, "read_batch", lambda paths, tags=None: {paths[0]: Result.Ok({"tags": tags})})
    monkeypatch.setattr(ex, "write", lambda path, metadata, preserve_workflow=True: Result.Ok(True))

    r = await ex.aread(str(p), ["XMP:Rating"])
    assert r.ok
    b = await ex.aread_batch([str(p)], ["XMP:Rating"])
    assert b[str(p)].ok
    w = await ex.awrite(str(p), {"XMP:Rating": 5})
    assert w.ok
