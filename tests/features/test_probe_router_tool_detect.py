import subprocess
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
