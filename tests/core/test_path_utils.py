from pathlib import Path

from mjr_am_backend import path_utils


def test_normalize_path_rejects_null_byte() -> None:
    assert path_utils.normalize_path("abc\x00def") is None


def test_safe_rel_path_rejects_unsafe_inputs() -> None:
    assert path_utils.safe_rel_path(None) == Path("")
    assert path_utils.safe_rel_path("") == Path("")
    assert path_utils.safe_rel_path("../x") is None
    assert path_utils.safe_rel_path("C:/abs/path") is None
    assert path_utils.safe_rel_path("ok/sub") == Path("ok/sub")


def test_is_within_root_for_existing_paths(tmp_path: Path) -> None:
    root = tmp_path / "root"
    child = root / "a" / "b.txt"
    child.parent.mkdir(parents=True)
    child.write_text("x", encoding="utf-8")
    assert path_utils.is_within_root(child, root)

    outside = tmp_path / "outside.txt"
    outside.write_text("y", encoding="utf-8")
    assert not path_utils.is_within_root(outside, root)
