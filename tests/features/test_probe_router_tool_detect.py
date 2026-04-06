import subprocess
from pathlib import Path
from types import SimpleNamespace

from mjr_am_backend import probe_router as pr
from mjr_am_backend import tool_detect as td


def test_probe_router_modes_and_description(monkeypatch):
    monkeypatch.setattr(pr, "has_exiftool", lambda: True)
    monkeypatch.setattr(pr, "has_ffprobe", lambda: False)
    assert pr.pick_probe_backend("a.png", settings_override="exiftool") == ["exiftool"]
    assert pr.pick_probe_backend("a.mp4", settings_override="both") == ["exiftool"]
    assert pr.pick_probe_backend("a.mp4", settings_override="ffprobe") == ["exiftool"]
    assert "Using" in pr.get_probe_strategy_description("a.png")

    monkeypatch.setattr(pr, "has_exiftool", lambda: False)
    monkeypatch.setattr(pr, "has_ffprobe", lambda: True)
    assert pr.pick_probe_backend("a.png", settings_override="auto") == ["ffprobe"]
    assert pr._normalize_probe_mode("bad") == "auto"
    assert pr._tool_available("x") is False


def test_tool_detect_versions_and_cache(monkeypatch):
    td.reset_tool_cache()
    assert td.parse_tool_version("ffprobe version 6.1.2") == (6, 1, 2)
    assert td.version_satisfies_minimum("6.1.2", "6.0") is True
    assert td.version_satisfies_minimum(None, "1.0") is False

    monkeypatch.setattr(td.shutil, "which", lambda _b: "ok")
    monkeypatch.setattr(
        td,
        "_run_command",
        lambda cmd: SimpleNamespace(returncode=0, stdout=("12.00\n" if "ffprobe" in cmd[0] else "13.20"), stderr=""),
    )
    assert td.has_exiftool() is True
    assert td.has_ffprobe() is True
    st = td.get_tool_status()
    assert st["exiftool"] and st["ffprobe"]


def test_tool_detect_failure_branches(monkeypatch):
    td.reset_tool_cache()
    monkeypatch.setattr(td.shutil, "which", lambda _b: None)
    monkeypatch.setattr(td, "_run_command", lambda cmd: (_ for _ in ()).throw(FileNotFoundError("x")))
    assert td.has_exiftool() is False

    td.reset_tool_cache()
    monkeypatch.setattr(td, "_run_command", lambda cmd: (_ for _ in ()).throw(subprocess.TimeoutExpired(cmd, timeout=1)))
    assert td.has_ffprobe() is False


def test_tool_detect_exiftool_alias_candidates(monkeypatch):
    td.reset_tool_cache()
    monkeypatch.setattr(td, "EXIFTOOL_BIN", '"C:/tools/exiftool"')
    monkeypatch.setattr(td.shutil, "which", lambda b: "ok" if b == "exiftool(-k).exe" else None)

    calls: list[str] = []

    def _run(cmd):
        calls.append(cmd[0])
        if cmd[0] == "exiftool(-k).exe":
            return SimpleNamespace(returncode=0, stdout="13.30", stderr="")
        raise FileNotFoundError("missing")

    monkeypatch.setattr(td, "_run_command", _run)
    assert td.has_exiftool() is True
    assert "exiftool(-k).exe" in calls


def test_tool_detect_exiftool_common_windows_dir(monkeypatch, tmp_path):
    td.reset_tool_cache()
    install_dir = tmp_path / "Programs" / "ExifTool"
    install_dir.mkdir(parents=True)
    exep = install_dir / "exiftool.exe"
    exep.write_text("x")

    monkeypatch.setenv("LOCALAPPDATA", str(tmp_path))
    monkeypatch.setattr(td.shutil, "which", lambda _b: None)

    calls: list[str] = []

    def _run(cmd):
        calls.append(cmd[0])
        if Path(cmd[0]).resolve() == exep.resolve():
            return SimpleNamespace(returncode=0, stdout="13.54", stderr="")
        raise FileNotFoundError("missing")

    monkeypatch.setattr(td, "_run_command", _run)
    assert td.has_exiftool() is True
    assert any("Programs" in call and "ExifTool" in call for call in calls)


def test_tool_detect_exiftool_explicit_path_bypasses_which(monkeypatch, tmp_path):
    td.reset_tool_cache()
    exep = tmp_path / "tools" / "exiftool.exe"
    exep.parent.mkdir(parents=True)
    exep.write_text("x")

    monkeypatch.setattr(td, "EXIFTOOL_BIN", str(exep))
    monkeypatch.setattr(td.shutil, "which", lambda _b: None)

    calls: list[str] = []

    def _run(cmd):
        calls.append(cmd[0])
        if Path(cmd[0]).resolve() == exep.resolve():
            return SimpleNamespace(returncode=0, stdout="13.54", stderr="")
        raise FileNotFoundError("missing")

    monkeypatch.setattr(td, "_run_command", _run)
    assert td.has_exiftool() is True
    assert calls[0] == str(exep)
