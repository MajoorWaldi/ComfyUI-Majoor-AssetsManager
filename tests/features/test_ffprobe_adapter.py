import pytest

from mjr_am_backend.adapters.tools.ffprobe import FFProbe
from mjr_am_backend.shared import ErrorCode


def _new_probe() -> FFProbe:
    probe = FFProbe.__new__(FFProbe)
    probe.bin = "ffprobe"
    probe.timeout = 1.0
    probe._resolved_bin = "ffprobe"
    probe._available = True
    probe._max_workers = 1
    return probe


def test_validate_probe_path_rejects_invalid_inputs() -> None:
    probe = _new_probe()

    bad_inputs = ["", "   ", "-show_streams", "a\x00b", "a\nb", "a\rb"]
    for value in bad_inputs:
        out = FFProbe._validate_probe_path(probe, value)
        assert out.ok is False
        assert out.code == ErrorCode.INVALID_INPUT


def test_validate_probe_path_accepts_normal_file_path() -> None:
    probe = _new_probe()
    out = FFProbe._validate_probe_path(probe, "  ./video.mp4  ")
    assert out.ok is True
    assert out.data == "./video.mp4"


def test_read_rejects_invalid_path_before_subprocess(monkeypatch) -> None:
    probe = _new_probe()
    calls = {"run": 0}

    def _run(_cmd):
        calls["run"] += 1
        raise AssertionError("subprocess should not run for invalid paths")

    monkeypatch.setattr(probe, "_run_ffprobe_cmd", _run)
    out = probe.read("-bad")
    assert out.ok is False
    assert out.code == ErrorCode.INVALID_INPUT
    assert calls["run"] == 0


@pytest.mark.asyncio
async def test_aread_rejects_invalid_path_before_subprocess(monkeypatch) -> None:
    probe = _new_probe()
    calls = {"spawn": 0}

    async def _spawn(_cmd):
        calls["spawn"] += 1
        raise AssertionError("subprocess should not run for invalid paths")

    monkeypatch.setattr(probe, "_spawn_ffprobe_process", _spawn)
    out = await probe.aread("-bad")
    assert out.ok is False
    assert out.code == ErrorCode.INVALID_INPUT
    assert calls["spawn"] == 0
