from pathlib import Path

from mjr_am_backend import config


def test_get_runtime_output_root_uses_env_override(monkeypatch, tmp_path):
    override = str((tmp_path / "override_out").resolve())
    monkeypatch.setenv("MAJOOR_OUTPUT_DIRECTORY", override)
    got = config.get_runtime_output_root()
    assert str(Path(got).resolve()) == str(Path(override).resolve())


def test_get_runtime_output_root_falls_back_when_env_missing(monkeypatch):
    monkeypatch.delenv("MAJOOR_OUTPUT_DIRECTORY", raising=False)
    got = config.get_runtime_output_root()
    assert isinstance(got, str)
    assert got.strip() != ""
