# mypy: disable-error-code="index,union-attr"
"""Unit tests for the freedesktop trash service (synthetic trees only)."""

from __future__ import annotations

import os
import stat
from pathlib import Path

import pytest
from mjr_am_backend.features.assets import trash_service as ts

UID = os.getuid()
FOREIGN_UID = UID + 1


@pytest.fixture(autouse=True)
def isolate_trash_env(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    """Keep the service away from the real home/XDG trash of the test host."""
    monkeypatch.setenv("XDG_DATA_HOME", str(tmp_path / "no-xdg"))


@pytest.fixture(autouse=True)
def fake_mount(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    """Treat tmp_path itself as a mount point; everything else uses the real check."""
    real_ismount = os.path.ismount

    def _fake_ismount(path):
        try:
            if Path(str(path)) == tmp_path:
                return True
        except Exception:
            pass
        return real_ismount(path)

    monkeypatch.setattr(os.path, "ismount", _fake_ismount)


def _make_admin_trash(topdir: Path, uid: int = UID) -> Path:
    td = topdir / f".Trash-{uid}"
    (td / "info").mkdir(parents=True)
    (td / "files").mkdir(parents=True)
    return td


def _write_trashinfo(td: Path, name: str, path_value: str) -> Path:
    info = td / "info" / f"{name}.trashinfo"
    info.write_text(
        f"[Trash Info]\nPath={path_value}\nDeletionDate=2026-01-01T00:00:00\n",
        encoding="utf-8",
    )
    return info


class TestIsSupported:
    def test_freedesktop_platforms_supported(self):
        assert ts.is_supported("linux") is True
        assert ts.is_supported("linux2") is True
        assert ts.is_supported("freebsd14") is True
        assert ts.is_supported("openbsd7") is True
        assert ts.is_supported("netbsd10") is True

    def test_windows_and_macos_unsupported(self):
        assert ts.is_supported("win32") is False
        assert ts.is_supported("darwin") is False

    def test_default_uses_sys_platform(self):
        import sys

        assert ts.is_supported() is ts.is_supported(sys.platform)


class TestTrashDirs:
    def test_home_trash_included_with_xdg_topdir(self, tmp_path: Path):
        xdg = tmp_path / "xdg"
        (xdg / "Trash" / "info").mkdir(parents=True)
        (xdg / "Trash" / "files").mkdir(parents=True)
        dirs = ts.trash_dirs([], uid=UID, xdg_data_home=xdg)
        assert len(dirs) == 1
        assert dirs[0].path == xdg / "Trash"
        assert dirs[0].topdir == xdg

    def test_home_trash_default_derived_from_home(self, tmp_path: Path, monkeypatch):
        home = tmp_path / "home"
        monkeypatch.delenv("XDG_DATA_HOME", raising=False)
        dirs = ts.trash_dirs([], uid=UID, home=home)
        assert dirs == []
        (home / ".local" / "share" / "Trash" / "info").mkdir(parents=True)
        dirs = ts.trash_dirs([], uid=UID, home=home)
        assert [d.path for d in dirs] == [home / ".local" / "share" / "Trash"]
        assert dirs[0].topdir == home / ".local" / "share"

    def test_home_trash_env_var_used(self, tmp_path: Path, monkeypatch):
        xdg = tmp_path / "envxdg"
        monkeypatch.setenv("XDG_DATA_HOME", str(xdg))
        home = tmp_path / "home"
        (xdg / "Trash" / "info").mkdir(parents=True)
        dirs = ts.trash_dirs([], uid=UID, home=home)
        assert [d.path for d in dirs] == [xdg / "Trash"]

    def test_home_trash_symlink_skipped(self, tmp_path: Path):
        xdg = tmp_path / "xdg"
        xdg.mkdir()
        target = tmp_path / "real-trash"
        target.mkdir()
        os.symlink(target, xdg / "Trash")
        dirs = ts.trash_dirs([], uid=UID, xdg_data_home=xdg)
        assert dirs == []

    def test_home_trash_foreign_owner_skipped(self, tmp_path: Path):
        xdg = tmp_path / "xdg"
        (xdg / "Trash" / "info").mkdir(parents=True)
        dirs = ts.trash_dirs([], uid=FOREIGN_UID, xdg_data_home=xdg)
        assert dirs == []

    def test_home_trash_group_writable_skipped(self, tmp_path: Path):
        xdg = tmp_path / "xdg"
        trash = xdg / "Trash"
        (trash / "info").mkdir(parents=True)
        trash.chmod(0o770)
        try:
            dirs = ts.trash_dirs([], uid=UID, xdg_data_home=xdg)
        finally:
            trash.chmod(0o755)
        assert dirs == []

    def test_admin_trash_uid_dir_for_root_mount(self, tmp_path: Path):
        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path)
        dirs = ts.trash_dirs([root], uid=UID)
        assert [d.path for d in dirs] == [td]
        assert dirs[0].topdir == tmp_path

    def test_admin_trash_foreign_owner_skipped(self, tmp_path: Path):
        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path)
        assert td.stat().st_uid == UID
        dirs = ts.trash_dirs([root], uid=FOREIGN_UID)
        assert dirs == []

    def test_admin_trash_world_writable_skipped(self, tmp_path: Path):
        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path)
        td.chmod(0o777)
        try:
            dirs = ts.trash_dirs([root], uid=UID)
        finally:
            td.chmod(0o755)
        assert dirs == []

    def test_group_writable_files_subdir_skips_dir(self, tmp_path: Path):
        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path)
        (td / "files").chmod(0o777)
        try:
            dirs = ts.trash_dirs([root], uid=UID)
        finally:
            (td / "files").chmod(0o755)
        assert dirs == []

    def test_foreign_owned_info_subdir_skips_dir(self, tmp_path: Path):
        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path)
        assert (td / "info").stat().st_uid == UID
        dirs = ts.trash_dirs([root], uid=FOREIGN_UID)
        assert dirs == []

    def test_missing_files_subdir_tolerated(self, tmp_path: Path):
        root = tmp_path / "out"
        root.mkdir()
        td = tmp_path / f".Trash-{UID}"
        (td / "info").mkdir(parents=True)
        dirs = ts.trash_dirs([root], uid=UID)
        assert [d.path for d in dirs] == [td]

    def test_sticky_trash_dir_included(self, tmp_path: Path):
        root = tmp_path / "out"
        root.mkdir()
        sticky = tmp_path / ".Trash"
        sticky.mkdir()
        sticky.chmod(sticky.stat().st_mode | stat.S_ISVTX)
        (sticky / str(UID) / "info").mkdir(parents=True)
        (sticky / str(UID) / "files").mkdir(parents=True)
        _make_admin_trash(tmp_path)
        dirs = ts.trash_dirs([root], uid=UID)
        assert {d.path for d in dirs} == {tmp_path / f".Trash-{UID}", sticky / str(UID)}
        sticky_entry = next(d for d in dirs if d.path == sticky / str(UID))
        assert sticky_entry.topdir == tmp_path

    def test_sticky_dir_foreign_uid_child_skipped(self, tmp_path: Path):
        """Sticky .Trash is fine for anyone, but .Trash/<uid> must be ours."""
        root = tmp_path / "out"
        root.mkdir()
        sticky = tmp_path / ".Trash"
        sticky.mkdir()
        sticky.chmod(sticky.stat().st_mode | stat.S_ISVTX)
        child = sticky / str(FOREIGN_UID)
        (child / "info").mkdir(parents=True)
        (child / "files").mkdir(parents=True)
        dirs = ts.trash_dirs([root], uid=FOREIGN_UID)
        assert dirs == []

    def test_non_sticky_trash_dir_skipped(self, tmp_path: Path):
        root = tmp_path / "out"
        root.mkdir()
        plain = tmp_path / ".Trash"
        (plain / str(UID) / "info").mkdir(parents=True)
        _make_admin_trash(tmp_path)
        dirs = ts.trash_dirs([root], uid=UID)
        assert {d.path for d in dirs} == {tmp_path / f".Trash-{UID}"}

    def test_symlinked_dot_trash_skipped(self, tmp_path: Path):
        root = tmp_path / "out"
        root.mkdir()
        other = tmp_path / "evil"
        other.mkdir()
        (other / str(UID) / "info").mkdir(parents=True)
        os.symlink(other, tmp_path / ".Trash", target_is_directory=True)
        _make_admin_trash(tmp_path)
        dirs = ts.trash_dirs([root], uid=UID)
        assert {d.path for d in dirs} == {tmp_path / f".Trash-{UID}"}

    def test_symlinked_trash_dir_skipped(self, tmp_path: Path):
        root = tmp_path / "out"
        root.mkdir()
        target = tmp_path / "realtrash"
        target.mkdir()
        os.symlink(target, tmp_path / f".Trash-{UID}", target_is_directory=True)
        dirs = ts.trash_dirs([root], uid=UID)
        assert dirs == []

    def test_symlinked_files_or_info_skips_dir(self, tmp_path: Path):
        root = tmp_path / "out"
        root.mkdir()
        td = tmp_path / f".Trash-{UID}"
        td.mkdir()
        (td / "files").mkdir()
        evil = tmp_path / "evilinfo"
        evil.mkdir()
        os.symlink(evil, td / "info")
        dirs = ts.trash_dirs([root], uid=UID)
        assert dirs == []

    def test_dedupe_same_mount_scanned_once(self, tmp_path: Path):
        root_a = tmp_path / "out"
        root_a.mkdir()
        root_b = tmp_path / "custom"
        root_b.mkdir()
        td = _make_admin_trash(tmp_path)
        dirs = ts.trash_dirs([root_a, root_b], uid=UID)
        assert [d.path for d in dirs] == [td]

    def test_root_alias_deduped(self, tmp_path: Path):
        root = tmp_path / "out"
        root.mkdir()
        alias = tmp_path / "link-out"
        os.symlink(root, alias, target_is_directory=True)
        td = _make_admin_trash(tmp_path)
        dirs = ts.trash_dirs([root, alias], uid=UID)
        assert [d.path for d in dirs] == [td]

    def test_invalid_root_skipped(self, tmp_path: Path):
        dirs = ts.trash_dirs(["/bad\x00root"], uid=UID)
        assert dirs == []

    def test_missing_trash_dirs_not_reported(self, tmp_path: Path):
        root = tmp_path / "out"
        root.mkdir()
        dirs = ts.trash_dirs([root], uid=UID)
        assert dirs == []

    def test_uid_defaults_to_current_user(self, tmp_path: Path):
        xdg = tmp_path / "xdg"
        (xdg / "Trash" / "info").mkdir(parents=True)
        dirs = ts.trash_dirs([], xdg_data_home=xdg)
        assert [d.path for d in dirs] == [xdg / "Trash"]

    def test_mount_point_fallback_when_no_mount_found(self, tmp_path: Path, monkeypatch):
        root = tmp_path / "deep" / "out"
        root.mkdir(parents=True)
        monkeypatch.setattr(os.path, "ismount", lambda _p: False)
        dirs = ts.trash_dirs([root], uid=UID)
        assert dirs == []

    def test_candidate_dedupe_symlinked_alias_trash_dir(self, tmp_path: Path, monkeypatch):
        m1 = tmp_path / "m1"
        m2 = tmp_path / "m2"
        (m1 / "out").mkdir(parents=True)
        (m2 / "out").mkdir(parents=True)
        real_trash = m1 / f".Trash-{UID}"
        (real_trash / "info").mkdir(parents=True)
        (real_trash / "files").mkdir(parents=True)
        os.symlink(real_trash, m2 / f".Trash-{UID}", target_is_directory=True)
        real_ismount = os.path.ismount

        def _fake_ismount(path):
            if Path(str(path)) in (m1, m2):
                return True
            return real_ismount(path)

        monkeypatch.setattr(os.path, "ismount", _fake_ismount)
        dirs = ts.trash_dirs([m1 / "out", m2 / "out"], uid=UID)
        assert [d.path for d in dirs] == [real_trash]


class TestScan:
    def test_relative_path_inside_root(self, tmp_path: Path):
        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path)
        (td / "files" / "a.png").write_bytes(b"12345")
        _write_trashinfo(td, "a.png", "out/a.png")
        scan = ts.scan([root], uid=UID)
        assert scan.count == 1
        assert scan.bytes == 5
        entry = scan.entries[0]
        assert entry.trash_dir == td
        assert entry.payload_name == "a.png"
        assert entry.info_name == "a.png.trashinfo"

    def test_absolute_encoded_path_home_trash(self, tmp_path: Path):
        root = tmp_path / "roots" / "out"
        root.mkdir(parents=True)
        xdg = tmp_path / "xdg"
        td = xdg / "Trash"
        (td / "info").mkdir(parents=True)
        (td / "files").mkdir(parents=True)
        (td / "files" / "my cat 2.png").write_bytes(b"x" * 7)
        _write_trashinfo(td, "my cat 2.png", f"{root}/my%20cat%202.png")
        scan = ts.scan([root], uid=UID, xdg_data_home=xdg)
        assert scan.count == 1
        assert scan.bytes == 7

    def test_outside_root_ignored(self, tmp_path: Path):
        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path)
        (td / "files" / "x.png").write_bytes(b"zz")
        _write_trashinfo(td, "x.png", "/etc/passwd")
        _write_trashinfo(td, "y.png", "other/app/x.png")
        scan = ts.scan([root], uid=UID)
        assert scan.count == 0

    def test_traversal_escape_ignored(self, tmp_path: Path):
        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path)
        (td / "files" / "t.png").write_bytes(b"z")
        _write_trashinfo(td, "t.png", "out/../../etc/x")
        scan = ts.scan([root], uid=UID)
        assert scan.count == 0

    def test_string_prefix_not_containment(self, tmp_path: Path):
        root = tmp_path / "out"
        root.mkdir()
        sibling = tmp_path / "outwardly"
        sibling.mkdir()
        td = _make_admin_trash(tmp_path)
        (td / "files" / "p.png").write_bytes(b"z")
        _write_trashinfo(td, "p.png", str(sibling / "p.png"))
        scan = ts.scan([root], uid=UID)
        assert scan.count == 0

    def test_nul_in_path_ignored_valid_entry_still_selected(self, tmp_path: Path):
        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path)
        (td / "files" / "a.png").write_bytes(b"abc")
        (td / "files" / "n.png").write_bytes(b"n")
        _write_trashinfo(td, "a.png", "out/a.png")
        _write_trashinfo(td, "n.png", "out/a%00.png")
        scan = ts.scan([root], uid=UID)
        assert scan.count == 1
        assert scan.entries[0].payload_name == "a.png"

    @pytest.mark.parametrize(
        "content",
        [
            "no header\nPath=/out/a.png\n",
            "[Trash Info]\nDeletionDate=2026-01-01T00:00:00\n",
            "[Trash Info]\nPath=\n",
            "\x00\x01\x02binary",
        ],
        ids=["no-header", "no-path", "empty-path", "binary"],
    )
    def test_malformed_info_ignored(self, tmp_path: Path, content: str):
        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path)
        (td / "files" / "m.png").write_bytes(b"z")
        (td / "info" / "m.png.trashinfo").write_bytes(content.encode("utf-8", errors="ignore"))
        scan = ts.scan([root], uid=UID)
        assert scan.count == 0

    def test_info_symlink_ignored(self, tmp_path: Path):
        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path)
        real_info = tmp_path / "elsewhere.trashinfo"
        real_info.write_text(f"[Trash Info]\nPath={root}/a.png\n")
        os.symlink(real_info, td / "info" / "a.png.trashinfo")
        (td / "files" / "a.png").write_bytes(b"z")
        scan = ts.scan([root], uid=UID)
        assert scan.count == 0

    def test_junk_file_in_info_dir_ignored(self, tmp_path: Path):
        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path)
        (td / "info" / "notes.txt").write_text("not a trashinfo")
        scan = ts.scan([root], uid=UID)
        assert scan.count == 0

    def test_info_lstat_error_ignored(self, tmp_path: Path, monkeypatch):
        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path)
        info = td / "info" / "a.png.trashinfo"
        info.write_text("[Trash Info]\nPath=out/a.png\n")
        real_lstat = os.lstat

        def _guarded_lstat(path, *args, **kwargs):
            if str(path) == str(info):
                raise PermissionError("denied")
            return real_lstat(path, *args, **kwargs)

        monkeypatch.setattr(os, "lstat", _guarded_lstat)
        scan = ts.scan([root], uid=UID)
        assert scan.count == 0

    def test_hostile_info_entry_never_fails_scan(self, tmp_path: Path):
        """A DirEntry whose metadata raises is skipped, not fatal."""

        class _Hostile:
            @property
            def name(self):
                raise ValueError("hostile name")

            path = "irrelevant"

        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path)
        (td / "files" / "a.png").write_bytes(b"abc")
        _write_trashinfo(td, "a.png", "out/a.png")

        real_scandir = os.scandir

        def _scandir_with_hostile(path, *args, **kwargs):
            listing = list(real_scandir(path, *args, **kwargs))
            if Path(str(path)) == td / "info":
                listing.append(_Hostile())
            return listing

        monkeypatch = pytest.MonkeyPatch()
        monkeypatch.setattr(os, "scandir", _scandir_with_hostile)
        try:
            scan = ts.scan([root], uid=UID)
        finally:
            monkeypatch.undo()
        assert scan.count == 1

    def test_directory_payload_size_zero(self, tmp_path: Path):
        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path)
        payload = td / "files" / "d"
        (payload / "sub").mkdir(parents=True)
        (payload / "one.png").write_bytes(b"a" * 10)
        (payload / "sub" / "two.png").write_bytes(b"b" * 20)
        _write_trashinfo(td, "d", "out/d")
        scan = ts.scan([root], uid=UID)
        assert scan.count == 1
        assert scan.bytes == 0

    def test_symlink_payload_size_from_lstat(self, tmp_path: Path):
        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path)
        target = tmp_path / "keep.png"
        target.write_bytes(b"x" * 100)
        os.symlink(target, td / "files" / "link.png")
        _write_trashinfo(td, "link.png", "out/link.png")
        scan = ts.scan([root], uid=UID)
        assert scan.count == 1
        # Size must come from the link itself (lstat), never from the target.
        assert scan.bytes == os.lstat(td / "files" / "link.png").st_size
        assert scan.bytes != 100

    def test_missing_payload_size_zero(self, tmp_path: Path):
        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path)
        _write_trashinfo(td, "gone.png", "out/gone.png")
        scan = ts.scan([root], uid=UID)
        assert scan.count == 1
        assert scan.bytes == 0

    def test_dedupe_two_roots_same_mount_counted_once(self, tmp_path: Path):
        out_root = tmp_path / "out"
        custom_root = tmp_path / "custom"
        out_root.mkdir()
        custom_root.mkdir()
        td = _make_admin_trash(tmp_path)
        (td / "files" / "a.png").write_bytes(b"123")
        _write_trashinfo(td, "a.png", "out/a.png")
        scan = ts.scan([out_root, custom_root], uid=UID)
        assert scan.count == 1

    def test_same_root_twice_deduped(self, tmp_path: Path):
        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path)
        (td / "files" / "a.png").write_bytes(b"123")
        _write_trashinfo(td, "a.png", "out/a.png")
        scan = ts.scan([root, root], uid=UID)
        assert scan.count == 1

    def test_missing_info_dir_tolerated(self, tmp_path: Path):
        root = tmp_path / "out"
        root.mkdir()
        td = tmp_path / f".Trash-{UID}"
        (td / "files").mkdir(parents=True)
        scan = ts.scan([root], uid=UID)
        assert scan.count == 0

    def test_info_scandir_oserror_tolerated(self, tmp_path: Path, monkeypatch):
        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path)
        _write_trashinfo(td, "a.png", "out/a.png")
        real_scandir = os.scandir

        def _raise_on_info(path, *args, **kwargs):
            if Path(str(path)) == td / "info":
                raise PermissionError("denied")
            return real_scandir(path, *args, **kwargs)

        monkeypatch.setattr(os, "scandir", _raise_on_info)
        scan = ts.scan([root], uid=UID)
        assert scan.count == 0

    def test_read_error_info_ignored(self, tmp_path: Path):
        """A directory as the info target: reading fails, treated as malformed."""
        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path)
        (td / "info" / "weird.trashinfo").mkdir()
        assert ts._parse_trashinfo(td / "info" / "weird.trashinfo") is None

    def test_info_swapped_for_symlink_malformed(self, tmp_path: Path):
        """A symlink swapped in after the lstat fails O_NOFOLLOW → malformed."""
        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path)
        target = tmp_path / "planted.trashinfo"
        target.write_text("[Trash Info]\nPath=out/a.png\n")
        os.symlink(target, td / "info" / "a.png.trashinfo")
        assert ts._parse_trashinfo(td / "info" / "a.png.trashinfo") is None

    @pytest.mark.parametrize(
        "crafted",
        [".trashinfo", "..trashinfo", "...trashinfo"],
        ids=["empty-stem", "dot", "dot-dot"],
    )
    def test_crafted_info_names_rejected(self, tmp_path: Path, crafted: str):
        """Info basenames whose stem is empty/./.. must never target files/ or the trash dir."""
        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path)
        (td / "info" / crafted).write_text("[Trash Info]\nPath=out/a.png\n")
        (td / "files" / "foreign.png").write_bytes(b"foreign")
        scan = ts.scan([root], uid=UID)
        assert scan.count == 0
        result = ts.empty([root], uid=UID)
        assert result.ok and result.data["removed"] == 0
        assert (td / "files" / "foreign.png").read_bytes() == b"foreign"
        assert (td / "info" / crafted).exists()
        assert (td / "info").is_dir()
        assert (td / "files").is_dir()

    def test_symlinked_root_prefix_path_selected(self, tmp_path: Path):
        """Path= recorded through a symlinked root prefix still matches the root."""
        real_root = tmp_path / "data" / "out"
        real_root.mkdir(parents=True)
        alias = tmp_path / "link"
        os.symlink(tmp_path / "data", alias, target_is_directory=True)
        td = _make_admin_trash(tmp_path)
        (td / "files" / "a.png").write_bytes(b"abc")
        _write_trashinfo(td, "a.png", str(alias / "out" / "a.png"))
        scan = ts.scan([alias / "out"], uid=UID)
        assert scan.count == 1
        result = ts.empty([alias / "out"], uid=UID)
        assert result.ok and result.data["removed"] == 1
        assert not (td / "files" / "a.png").exists()

    def test_path_realpath_outside_roots_ignored(self, tmp_path: Path):
        """A Path whose lexical and realpath forms both sit outside roots is ignored."""
        root = tmp_path / "out"
        root.mkdir()
        outside = tmp_path / "outside"
        outside.mkdir()
        decoy = tmp_path / "decoy"
        os.symlink(outside, decoy, target_is_directory=True)
        td = _make_admin_trash(tmp_path)
        (td / "files" / "x.png").write_bytes(b"x")
        _write_trashinfo(td, "x.png", str(decoy / "x.png"))
        scan = ts.scan([root], uid=UID)
        assert scan.count == 0

    def test_oversized_trashinfo_ignored(self, tmp_path: Path):
        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path)
        (td / "files" / "big.png").write_bytes(b"z")
        padding = "x" * (70 * 1024)
        (td / "info" / "big.png.trashinfo").write_text(
            f"[Trash Info]\nPath=out/big.png\nJunk={padding}\n", encoding="utf-8"
        )
        scan = ts.scan([root], uid=UID)
        assert scan.count == 0


class TestEntryFromInfoSubGuards:
    """Defence-in-depth guards real scandir output can never reach."""

    def _trash_dir(self, tmp_path: Path) -> ts.TrashDir:
        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path)
        (td / "files" / "ok.png").write_bytes(b"z")
        _write_trashinfo(td, "ok.png", "out/ok.png")
        dirs = ts.trash_dirs([root], uid=UID)
        assert len(dirs) == 1
        return dirs[0]

    @pytest.mark.parametrize(
        "name",
        [
            "sub/a.png.trashinfo",
            "a\x00b.png.trashinfo",
            "a\\b.png.trashinfo",
        ],
        ids=["sep", "nul", "altsep"],
    )
    def test_separator_or_nul_stem_rejected(self, tmp_path: Path, name: str):
        trash_dir = self._trash_dir(tmp_path)
        fake = type("FakeDirEntry", (), {"name": name, "path": str(trash_dir.files_dir / "x")})()
        root = tmp_path / "out"
        entry = ts._entry_from_info(fake, trash_dir, [root], [root])
        assert entry is None

    def test_valid_fake_entry_selected(self, tmp_path: Path):
        trash_dir = self._trash_dir(tmp_path)
        (trash_dir.files_dir / "fake.png").write_bytes(b"1234")
        info_file = trash_dir.info_dir / "fake.png.trashinfo"
        info_file.write_text("[Trash Info]\nPath=out/fake.png\n")
        fake = type("FakeDirEntry", (), {"name": "fake.png.trashinfo", "path": str(info_file)})()
        root = tmp_path / "out"
        entry = ts._entry_from_info(fake, trash_dir, [root], [root])
        assert entry is not None
        assert entry.payload_name == "fake.png"
        assert entry.size == 4


class TestEmpty:
    def test_removes_only_majoor_entries(self, tmp_path: Path):
        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path)
        for i in range(3):
            (td / "files" / f"m{i}.png").write_bytes(f"content{i}".encode())
            _write_trashinfo(td, f"m{i}.png", f"out/m{i}.png")
        (td / "files" / "foreign.png").write_bytes(b"foreign-bytes")
        foreign_info = _write_trashinfo(td, "foreign.png", "/elsewhere/foreign.png")
        (td / "files" / "orphan.png").write_bytes(b"orphan-bytes")

        scan = ts.scan([root], uid=UID)
        assert scan.count == 3
        result = ts.empty([root], uid=UID)
        assert result.ok
        assert result.data["removed"] == 3
        assert result.data["bytes"] == len("content0") + len("content1") + len("content2")
        assert result.data["failed"] == []
        assert result.data["skipped_dirs"] == 0
        for i in range(3):
            assert not (td / "files" / f"m{i}.png").exists()
            assert not (td / "info" / f"m{i}.png.trashinfo").exists()
        assert (td / "files" / "foreign.png").read_bytes() == b"foreign-bytes"
        assert foreign_info.exists()
        assert (td / "files" / "orphan.png").read_bytes() == b"orphan-bytes"

    def test_symlink_payload_unlinked_target_intact(self, tmp_path: Path):
        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path)
        target = tmp_path / "outside" / "keep.png"
        target.parent.mkdir()
        target.write_bytes(b"precious")
        os.symlink(target, td / "files" / "a.png")
        _write_trashinfo(td, "a.png", "out/a.png")
        result = ts.empty([root], uid=UID)
        assert result.ok and result.data["removed"] == 1
        assert not (td / "files" / "a.png").is_symlink()
        assert target.read_bytes() == b"precious"

    def test_directory_payload_skipped_never_removed(self, tmp_path: Path):
        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path)
        payload = td / "files" / "d"
        (payload / "inner.png").mkdir(parents=True)
        (payload / "inner.png" / "x.png").write_bytes(b"xxx")
        _write_trashinfo(td, "d", "out/d")
        result = ts.empty([root], uid=UID)
        assert result.ok
        assert result.data["removed"] == 0
        assert result.data["skipped_dirs"] == 1
        assert (payload / "inner.png" / "x.png").read_bytes() == b"xxx"
        assert (td / "info" / "d.trashinfo").exists()

    def test_fifo_payload_skipped(self, tmp_path: Path):
        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path)
        os.mkfifo(td / "files" / "pipe")
        _write_trashinfo(td, "pipe", "out/pipe")
        try:
            result = ts.empty([root], uid=UID)
            assert result.ok
            assert result.data["removed"] == 0
            assert result.data["skipped_dirs"] == 1
            assert (td / "files" / "pipe").exists()
        finally:
            (td / "files" / "pipe").unlink()

    def test_vanished_payload_still_removes_info(self, tmp_path: Path):
        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path)
        info = _write_trashinfo(td, "a.png", "out/a.png")
        result = ts.empty([root], uid=UID)
        assert result.ok
        assert result.data["removed"] == 1
        assert result.data == {"removed": 1, "bytes": 0, "failed": [], "skipped_dirs": 0}
        assert not info.exists()

    def test_payload_unlink_file_not_found_tolerated(self, tmp_path: Path, monkeypatch):
        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path)
        payload = td / "files" / "a.png"
        payload.write_bytes(b"x")
        info = _write_trashinfo(td, "a.png", "out/a.png")

        real_unlink = os.unlink

        def _vanishing_unlink(path, *args, **kwargs):
            if str(path) == "a.png":
                raise FileNotFoundError("vanished")
            return real_unlink(path, *args, **kwargs)

        monkeypatch.setattr(os, "unlink", _vanishing_unlink)
        try:
            result = ts.empty([root], uid=UID)
        finally:
            monkeypatch.undo()
        assert result.ok and result.data["removed"] == 1
        assert not info.exists()

    def test_info_unlink_file_not_found_tolerated(self, tmp_path: Path, monkeypatch):
        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path)
        payload = td / "files" / "a.png"
        payload.write_bytes(b"x")
        _write_trashinfo(td, "a.png", "out/a.png")

        real_unlink = os.unlink

        def _vanishing_unlink(path, *args, **kwargs):
            if str(path) == "a.png.trashinfo":
                raise FileNotFoundError("vanished")
            return real_unlink(path, *args, **kwargs)

        monkeypatch.setattr(os, "unlink", _vanishing_unlink)
        try:
            result = ts.empty([root], uid=UID)
        finally:
            monkeypatch.undo()
        assert result.ok and result.data["removed"] == 1
        assert not payload.exists()

    def test_payload_unlink_permission_error_recorded(self, tmp_path: Path, monkeypatch):
        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path)
        blocked = td / "files" / "blocked.png"
        blocked.write_bytes(b"secret")
        _write_trashinfo(td, "blocked.png", "out/blocked.png")
        (td / "files" / "fine.png").write_bytes(b"f")
        _write_trashinfo(td, "fine.png", "out/fine.png")

        real_unlink = os.unlink

        def _guarded_unlink(path, *args, **kwargs):
            if str(path) == "blocked.png":
                raise PermissionError("permission denied")
            return real_unlink(path, *args, **kwargs)

        monkeypatch.setattr(os, "unlink", _guarded_unlink)
        try:
            result = ts.empty([root], uid=UID)
        finally:
            monkeypatch.undo()
        assert result.ok
        assert result.data["removed"] == 1
        assert len(result.data["failed"]) == 1
        failure = result.data["failed"][0]
        assert failure["name"] == "blocked.png"
        assert "permission denied" in failure["error"].lower()
        assert blocked.exists()
        assert (td / "info" / "blocked.png.trashinfo").exists()
        assert not (td / "info" / "fine.png.trashinfo").exists()

    def test_info_unlink_error_recorded(self, tmp_path: Path, monkeypatch):
        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path)
        (td / "files" / "a.png").write_bytes(b"x")
        info = _write_trashinfo(td, "a.png", "out/a.png")

        real_unlink = os.unlink

        def _guarded_unlink(path, *args, **kwargs):
            if str(path) == "a.png.trashinfo":
                raise PermissionError("info denied")
            return real_unlink(path, *args, **kwargs)

        monkeypatch.setattr(os, "unlink", _guarded_unlink)
        try:
            result = ts.empty([root], uid=UID)
        finally:
            monkeypatch.undo()
        assert result.ok
        assert result.data["removed"] == 0
        assert result.data["failed"][0]["name"] == "a.png"
        assert info.exists()

    def test_payload_lstat_error_recorded(self, tmp_path: Path, monkeypatch):
        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path)
        payload = td / "files" / "a.png"
        payload.write_bytes(b"x")
        _write_trashinfo(td, "a.png", "out/a.png")

        real_lstat = os.lstat

        def _guarded_lstat(path, *args, **kwargs):
            if str(path) == "a.png" and kwargs.get("dir_fd") is not None:
                raise PermissionError("stat denied")
            return real_lstat(path, *args, **kwargs)

        monkeypatch.setattr(os, "lstat", _guarded_lstat)
        try:
            result = ts.empty([root], uid=UID)
        finally:
            monkeypatch.undo()
        assert result.ok
        assert result.data["removed"] == 0
        assert result.data["failed"][0]["name"] == "a.png"
        assert (td / "info" / "a.png.trashinfo").exists()

    def test_missing_trash_dir_open_failed(self, tmp_path: Path):
        root = tmp_path / "out"
        root.mkdir()
        entry = ts.TrashEntry(
            trash_dir=tmp_path / "no-such-trash",
            payload_name="a.png",
            info_name="a.png.trashinfo",
            size=1,
        )
        outcome, error = ts._remove_entry(entry, uid=UID)
        assert outcome == "failed"
        assert error

    def test_files_swapped_for_symlink_after_scan(self, tmp_path: Path):
        """TOCTOU: files/ replaced by a symlink after scan → failed, outside untouched."""
        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path)
        (td / "files" / "a.png").write_bytes(b"abc")
        _write_trashinfo(td, "a.png", "out/a.png")
        scan = ts.scan([root], uid=UID)
        assert scan.count == 1

        outside = tmp_path / "outside"
        outside.mkdir()
        (outside / "loot.png").write_bytes(b"loot")
        (td / "files" / "a.png").unlink()  # empty files/ so rmdir works
        (td / "files").rmdir()
        os.symlink(outside, td / "files", target_is_directory=True)

        outcome, error = ts._remove_entry(scan.entries[0], uid=UID)
        assert outcome == "failed"
        assert error
        assert (outside / "loot.png").read_bytes() == b"loot"

    def test_info_swapped_for_symlink_after_scan(self, tmp_path: Path):
        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path)
        (td / "files" / "a.png").write_bytes(b"abc")
        _write_trashinfo(td, "a.png", "out/a.png")
        scan = ts.scan([root], uid=UID)
        assert scan.count == 1

        outside = tmp_path / "outside-info"
        outside.mkdir()
        (td / "info" / "a.png.trashinfo").unlink()
        (td / "info").rmdir()
        os.symlink(outside, td / "info", target_is_directory=True)

        outcome, error = ts._remove_entry(scan.entries[0], uid=UID)
        assert outcome == "failed"
        assert error
        assert (td / "files" / "a.png").exists()

    def test_ownership_recheck_fails_after_mode_change(self, tmp_path: Path):
        """files/ chmod'd group-writable after scan → refused, payload kept."""
        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path)
        (td / "files" / "a.png").write_bytes(b"abc")
        _write_trashinfo(td, "a.png", "out/a.png")
        scan = ts.scan([root], uid=UID)
        assert scan.count == 1

        (td / "files").chmod(0o770)
        try:
            outcome, error = ts._remove_entry(scan.entries[0], uid=UID)
        finally:
            (td / "files").chmod(0o755)
        assert outcome == "failed"
        assert "ownership" in error.lower()
        assert (td / "files" / "a.png").exists()

    def test_fstat_error_fails_recheck(self, tmp_path: Path, monkeypatch):
        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path)
        (td / "files" / "a.png").write_bytes(b"abc")
        _write_trashinfo(td, "a.png", "out/a.png")
        scan = ts.scan([root], uid=UID)
        assert scan.count == 1

        # Scope the failure to the service's own re-check: pytest's capture
        # machinery also calls os.fstat before monkeypatch teardown.
        import sys as _sys

        real_fstat = os.fstat

        def _raise_for_owned_check(fd, *args, **kwargs):
            if _sys._getframe(1).f_code.co_name == "_fd_owned_safe":
                raise PermissionError("fstat denied")
            return real_fstat(fd, *args, **kwargs)

        monkeypatch.setattr(os, "fstat", _raise_for_owned_check)
        outcome, error = ts._remove_entry(scan.entries[0], uid=UID)
        assert outcome == "failed"
        assert "ownership" in error.lower()

    def test_empty_trash_no_entries(self, tmp_path: Path):
        root = tmp_path / "out"
        root.mkdir()
        _make_admin_trash(tmp_path)
        result = ts.empty([root], uid=UID)
        assert result.ok
        assert result.data == {"removed": 0, "bytes": 0, "failed": [], "skipped_dirs": 0}

    def test_empty_uid_defaults_to_current_user(self, tmp_path: Path):
        root = tmp_path / "out"
        root.mkdir()
        td = _make_admin_trash(tmp_path, uid=os.getuid())
        (td / "files" / "a.png").write_bytes(b"ab")
        _write_trashinfo(td, "a.png", "out/a.png")
        result = ts.empty([root])
        assert result.ok and result.data["removed"] == 1
