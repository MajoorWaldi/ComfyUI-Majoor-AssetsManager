from pathlib import Path

from mjr_am_backend.adapters.tools.exiftool import ExifTool
from mjr_am_backend.shared import Result


class _Win206Error(OSError):
    def __init__(self):
        super().__init__(206, "Filename or extension is too long")
        self.winerror = 206


def test_exiftool_batch_fallback_on_win206(monkeypatch, tmp_path: Path):
    f1 = tmp_path / "a.png"
    f2 = tmp_path / "b.png"
    f1.write_bytes(b"x")
    f2.write_bytes(b"x")

    tool = ExifTool(bin_name="exiftool")
    tool._available = True
    tool.bin = "exiftool"

    def _raise_win206(*args, **kwargs):
        raise _Win206Error()

    monkeypatch.setattr("mjr_am_backend.adapters.tools.exiftool.subprocess.run", _raise_win206)
    monkeypatch.setattr(
        tool,
        "read",
        lambda path, tags=None: Result.Ok({"SourceFile": str(path)}),
    )

    out = tool.read_batch([str(f1), str(f2)])
    assert out[str(f1)].ok
    assert out[str(f2)].ok
