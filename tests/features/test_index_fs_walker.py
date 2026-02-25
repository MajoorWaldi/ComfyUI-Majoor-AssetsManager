from pathlib import Path

from mjr_am_backend.features.index.fs_walker import FileSystemWalker


def test_iter_files_non_recursive_only_current_directory(tmp_path: Path) -> None:
    (tmp_path / "root_image.png").write_bytes(b"png")
    (tmp_path / "ignore.txt").write_text("ignore", encoding="utf-8")
    sub = tmp_path / "sub"
    sub.mkdir()
    (sub / "nested_image.jpg").write_bytes(b"jpg")

    walker = FileSystemWalker(scan_iops_limit=0.0)

    found = list(walker.iter_files(tmp_path, recursive=False))
    found_set = {p.name for p in found}

    assert "root_image.png" in found_set
    assert "nested_image.jpg" not in found_set
    assert "ignore.txt" not in found_set


def test_iter_files_recursive_includes_nested_supported_files(tmp_path: Path) -> None:
    (tmp_path / "top.webp").write_bytes(b"webp")
    sub = tmp_path / "sub"
    sub.mkdir()
    (sub / "nested.png").write_bytes(b"png")
    (sub / "nested.txt").write_text("ignore", encoding="utf-8")

    walker = FileSystemWalker(scan_iops_limit=0.0)

    found = list(walker.iter_files(tmp_path, recursive=True))
    found_set = {p.name for p in found}

    assert "top.webp" in found_set
    assert "nested.png" in found_set
    assert "nested.txt" not in found_set
