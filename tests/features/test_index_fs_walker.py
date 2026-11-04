from pathlib import Path

import pytest
from mjr_am_backend.features.index.fs_walker import FileSystemWalker, _is_enabled_extension


def _make_symlink_or_skip(link: Path, target: Path) -> None:
    try:
        link.symlink_to(target)
    except (OSError, NotImplementedError):
        pytest.skip("Symlinks require elevated privileges on this platform")


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


def test_symlinked_file_outside_allowed_roots_is_not_indexed(tmp_path: Path) -> None:
    """A symlink whose target escapes the allowed roots must not be indexed.

    Indexing it would create a "ghost asset": a row in the grid that the
    viewer's open-time root check then refuses to serve.
    """
    outside = tmp_path / "outside"
    outside.mkdir()
    secret = outside / "secret.png"
    secret.write_bytes(b"png")

    root = tmp_path / "root"
    root.mkdir()
    (root / "real.png").write_bytes(b"png")
    _make_symlink_or_skip(root / "escapes.png", secret)

    walker = FileSystemWalker(
        scan_iops_limit=0.0,
        symlink_target_allowed=lambda p: root in Path(p).resolve().parents,
    )

    found = {p.name for p in walker.iter_files(root, recursive=True)}
    assert "real.png" in found
    assert "escapes.png" not in found


def test_symlinked_file_inside_allowed_roots_is_still_indexed(tmp_path: Path) -> None:
    """The guard must not regress the historical behaviour of indexing
    symlinked files whose target IS inside an allowed root."""
    root = tmp_path / "root"
    root.mkdir()
    target = root / "target.png"
    target.write_bytes(b"png")
    _make_symlink_or_skip(root / "alias.png", target)

    walker = FileSystemWalker(
        scan_iops_limit=0.0,
        symlink_target_allowed=lambda p: root in Path(p).resolve().parents,
    )

    found = {p.name for p in walker.iter_files(root, recursive=True)}
    assert {"target.png", "alias.png"} <= found


def test_walker_without_predicate_keeps_legacy_symlink_behaviour(tmp_path: Path) -> None:
    outside = tmp_path / "outside"
    outside.mkdir()
    secret = outside / "secret.png"
    secret.write_bytes(b"png")

    root = tmp_path / "root"
    root.mkdir()
    _make_symlink_or_skip(root / "escapes.png", secret)

    walker = FileSystemWalker(scan_iops_limit=0.0)
    found = {p.name for p in walker.iter_files(root, recursive=True)}
    assert "escapes.png" in found


class _FakeEntry:
    """Minimal os.DirEntry stand-in so the guard is covered on platforms where
    creating real symlinks needs elevated privileges (e.g. Windows)."""

    def __init__(self, symlink: bool, raises: bool = False) -> None:
        self._symlink = symlink
        self._raises = raises

    def is_symlink(self) -> bool:
        if self._raises:
            raise OSError("stat failed")
        return self._symlink


def test_symlink_guard_only_consults_predicate_for_symlinks() -> None:
    seen: list[Path] = []

    def _predicate(p: Path) -> bool:
        seen.append(p)
        return False

    walker = FileSystemWalker(scan_iops_limit=0.0, symlink_target_allowed=_predicate)
    target = Path("x.png")

    # Regular files short-circuit: the predicate is never called, so an
    # ordinary scan pays no extra resolve() cost.
    assert walker._symlink_target_is_allowed(_FakeEntry(symlink=False), target) is True
    assert seen == []

    # Symlinks are checked, and a rejecting predicate skips the entry.
    assert walker._symlink_target_is_allowed(_FakeEntry(symlink=True), target) is False
    assert seen == [target]


def test_symlink_guard_is_conservative_when_predicate_raises() -> None:
    def _boom(_p: Path) -> bool:
        raise RuntimeError("root registry exploded")

    walker = FileSystemWalker(scan_iops_limit=0.0, symlink_target_allowed=_boom)
    # Skip rather than index something the viewer may refuse to open.
    assert walker._symlink_target_is_allowed(_FakeEntry(symlink=True), Path("x.png")) is False

    # An entry whose is_symlink() itself fails must not abort the scan.
    assert walker._symlink_target_is_allowed(_FakeEntry(symlink=True, raises=True), Path("x.png")) is True


def test_jxl_extension_is_experimental_and_disabled_by_default(monkeypatch) -> None:
    monkeypatch.delenv("MAJOOR_ENABLE_JXL", raising=False)
    assert _is_enabled_extension(".jxl") is False


def test_jxl_extension_can_be_enabled(monkeypatch) -> None:
    monkeypatch.setenv("MAJOOR_ENABLE_JXL", "1")
    assert _is_enabled_extension(".jxl") is True


def test_iter_files_recursive_skips_trash_folder(tmp_path: Path) -> None:
    trash_files = tmp_path / ".Trash-1000" / "files"
    trash_files.mkdir(parents=True)
    (trash_files / "a.png").write_bytes(b"png")
    (tmp_path / "b.png").write_bytes(b"png")

    walker = FileSystemWalker(scan_iops_limit=0.0)

    found = list(walker.iter_files(tmp_path, recursive=True))
    found_set = {p.name for p in found}

    assert found_set == {"b.png"}


def test_iter_files_recursive_skips_windows_recycle_bin(tmp_path: Path) -> None:
    recycled = tmp_path / "$RECYCLE.BIN" / "S-1-5-21"
    recycled.mkdir(parents=True)
    (recycled / "$Rabc.png").write_bytes(b"png")
    (tmp_path / "b.png").write_bytes(b"png")

    walker = FileSystemWalker(scan_iops_limit=0.0)

    found = list(walker.iter_files(tmp_path, recursive=True))
    found_set = {p.name for p in found}

    assert found_set == {"b.png"}


def test_iter_files_recursive_skips_internal_folders(tmp_path: Path) -> None:
    index_dir = tmp_path / "_mjr_index"
    index_dir.mkdir()
    (index_dir / "x.png").write_bytes(b"png")
    pycache = tmp_path / "__pycache__"
    pycache.mkdir()
    (pycache / "y.png").write_bytes(b"png")

    walker = FileSystemWalker(scan_iops_limit=0.0)

    found = list(walker.iter_files(tmp_path, recursive=True))

    assert found == []


def test_iter_files_recursive_internal_folder_match_is_case_insensitive(tmp_path: Path) -> None:
    index_dir = tmp_path / "_MJR_Index"
    index_dir.mkdir()
    (index_dir / "x.png").write_bytes(b"png")

    walker = FileSystemWalker(scan_iops_limit=0.0)

    found = list(walker.iter_files(tmp_path, recursive=True))

    assert found == []


def test_iter_files_recursive_still_descends_into_normal_nested_folders(tmp_path: Path) -> None:
    sub = tmp_path / "sub"
    sub.mkdir()
    (sub / "c.png").write_bytes(b"png")

    walker = FileSystemWalker(scan_iops_limit=0.0)

    found = {p.name for p in walker.iter_files(tmp_path, recursive=True)}

    assert found == {"c.png"}


def test_iter_files_recursive_scans_dot_path_scan_root(tmp_path: Path) -> None:
    hidden_root = tmp_path / ".hidden_root"
    hidden_root.mkdir()
    (hidden_root / "d.png").write_bytes(b"png")

    walker = FileSystemWalker(scan_iops_limit=0.0)

    found = {p.name for p in walker.iter_files(hidden_root, recursive=True)}

    assert found == {"d.png"}


def test_iter_files_dot_prefixed_file_at_root_keeps_current_behaviour(tmp_path: Path) -> None:
    (tmp_path / ".e.png").write_bytes(b"png")

    walker = FileSystemWalker(scan_iops_limit=0.0)

    found = {p.name for p in walker.iter_files(tmp_path, recursive=True)}

    assert found == {".e.png"}
