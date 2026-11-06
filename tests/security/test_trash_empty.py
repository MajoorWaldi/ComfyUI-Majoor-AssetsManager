# mypy: disable-error-code="index"
"""Security tests for emptying Majoor-owned freedesktop trash entries.

Every test builds a synthetic trash tree under pytest's tmp_path. The service
must never remove an entry whose original path is outside Majoor roots, an
orphan payload, or anything reached through a symlink.
"""

from __future__ import annotations

import os
import stat
from pathlib import Path

import pytest
from mjr_am_backend.features.assets import trash_service as ts

UID = os.getuid()


@pytest.fixture(autouse=True)
def isolate_trash_env(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("XDG_DATA_HOME", str(tmp_path / "no-xdg"))


@pytest.fixture(autouse=True)
def fake_mount(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    real_ismount = os.path.ismount

    def _fake_ismount(path):
        try:
            if Path(str(path)) == tmp_path:
                return True
        except Exception:
            pass
        return real_ismount(path)

    monkeypatch.setattr(os.path, "ismount", _fake_ismount)


def _make_trash(topdir: Path) -> Path:
    td = topdir / f".Trash-{UID}"
    (td / "info").mkdir(parents=True)
    (td / "files").mkdir(parents=True)
    return td


def _info(td: Path, name: str, path_value: str) -> Path:
    p = td / "info" / f"{name}.trashinfo"
    p.write_text(f"[Trash Info]\nPath={path_value}\n", encoding="utf-8")
    return p


class TestTrashEmptySecurity:
    def test_only_majoor_entries_removed_foreign_byte_identical(self, tmp_path: Path):
        """Acceptance: 3 Majoor entries removed; 2 foreign entries untouched."""
        root = tmp_path / "out"
        root.mkdir()
        td = _make_trash(tmp_path)
        for i in range(3):
            (td / "files" / f"m{i}.png").write_bytes(f"majoor{i}".encode())
            _info(td, f"m{i}.png", f"out/m{i}.png")
        (td / "files" / "outside.png").write_bytes(b"outside-bytes")
        outside_info = _info(td, "outside.png", "/home/attacker/outside.png")
        (td / "files" / "orphan.png").write_bytes(b"orphan-bytes")

        result = ts.empty([root], uid=UID)

        assert result.ok
        assert result.data["removed"] == 3
        assert (td / "files" / "outside.png").read_bytes() == b"outside-bytes"
        assert outside_info.exists()
        assert (td / "files" / "orphan.png").read_bytes() == b"orphan-bytes"
        for i in range(3):
            assert not (td / "files" / f"m{i}.png").exists()
            assert not (td / "info" / f"m{i}.png.trashinfo").exists()

    def test_etc_passwd_path_can_be_faked_but_never_matched(self, tmp_path: Path):
        """An attacker-controlled trashinfo claiming /etc/passwd stays ignored."""
        root = tmp_path / "out"
        root.mkdir()
        td = _make_trash(tmp_path)
        (td / "files" / "passwd").write_bytes(b"root:x:0:0")
        info = _info(td, "passwd", "/etc/passwd")
        result = ts.empty([root], uid=UID)
        assert result.ok and result.data["removed"] == 0
        assert (td / "files" / "passwd").exists()
        assert info.exists()

    def test_traversal_payload_name_is_not_a_path(self, tmp_path: Path):
        """Traversal in Path= normalises outside the root and is ignored."""
        root = tmp_path / "out"
        root.mkdir()
        secret = tmp_path / "secret.txt"
        secret.write_bytes(b"secret")
        td = _make_trash(tmp_path)
        (td / "files" / "t.png").write_bytes(b"z")
        info = _info(td, "t.png", "out/../../secret.txt")
        result = ts.empty([root], uid=UID)
        assert result.ok and result.data["removed"] == 0
        assert secret.read_bytes() == b"secret"
        assert info.exists()

    def test_symlink_payload_never_follows_target(self, tmp_path: Path):
        """Payload symlink to a file outside roots: link removed, target intact."""
        root = tmp_path / "out"
        root.mkdir()
        td = _make_trash(tmp_path)
        victim = tmp_path / "victim" / "private.png"
        victim.parent.mkdir()
        victim.write_bytes(b"private-data")
        os.symlink(victim, td / "files" / "a.png")
        _info(td, "a.png", "out/a.png")
        result = ts.empty([root], uid=UID)
        assert result.ok and result.data["removed"] == 1
        assert victim.read_bytes() == b"private-data"
        assert not (td / "files" / "a.png").exists()

    def test_directory_payloads_are_skipped_not_removed(self, tmp_path: Path):
        """Directory payloads (even with symlinks inside) are never removed."""
        root = tmp_path / "out"
        root.mkdir()
        td = _make_trash(tmp_path)
        victim_dir = tmp_path / "victimdir"
        victim_dir.mkdir()
        (victim_dir / "keep.png").write_bytes(b"keep-me")
        payload = td / "files" / "d"
        payload.mkdir()
        os.symlink(victim_dir, payload / "escape")
        _info(td, "d", "out/d")
        result = ts.empty([root], uid=UID)
        assert result.ok
        assert result.data["removed"] == 0
        assert result.data["skipped_dirs"] == 1
        assert (victim_dir / "keep.png").read_bytes() == b"keep-me"
        assert (payload / "escape").exists()

    def test_foreign_owned_trash_dir_never_used(self, tmp_path: Path):
        """A .Trash-<uid> planted by another user is ignored entirely."""
        root = tmp_path / "out"
        root.mkdir()
        td = _make_trash(tmp_path)
        (td / "files" / "planted.png").write_bytes(b"planted")
        _info(td, "planted.png", "out/planted.png")
        assert td.stat().st_uid == UID
        # Scan as a different (foreign) uid: the dir belongs to UID, not to them.
        result = ts.empty([root], uid=UID + 1)
        assert result.ok and result.data["removed"] == 0
        assert (td / "files" / "planted.png").exists()
        assert (td / "info" / "planted.png.trashinfo").exists()

    def test_group_writable_trash_dir_never_used(self, tmp_path: Path):
        """Group/world-writable trash dirs are refused (planted-state defence)."""
        root = tmp_path / "out"
        root.mkdir()
        td = _make_trash(tmp_path)
        (td / "files" / "a.png").write_bytes(b"a")
        _info(td, "a.png", "out/a.png")
        td.chmod(0o777)
        try:
            scan = ts.scan([root], uid=UID)
            result = ts.empty([root], uid=UID)
        finally:
            td.chmod(0o755)
        assert scan.count == 0
        assert result.ok and result.data["removed"] == 0
        assert (td / "files" / "a.png").exists()

    def test_nul_in_path_with_valid_entry_alongside(self, tmp_path: Path):
        """A NUL-bearing Path= entry is ignored without failing the scan."""
        root = tmp_path / "out"
        root.mkdir()
        td = _make_trash(tmp_path)
        (td / "files" / "a.png").write_bytes(b"abc")
        (td / "files" / "n.png").write_bytes(b"n")
        _info(td, "a.png", "out/a.png")
        _info(td, "n.png", "out/a%00.png")
        result = ts.empty([root], uid=UID)
        assert result.ok
        assert result.data["removed"] == 1
        assert not (td / "files" / "a.png").exists()
        assert (td / "files" / "n.png").exists()
        assert (td / "info" / "n.png.trashinfo").exists()

    def test_files_dir_swapped_for_symlink_after_scan(self, tmp_path: Path):
        """TOCTOU: files/ swapped for a symlink between scan and removal."""
        root = tmp_path / "out"
        root.mkdir()
        td = _make_trash(tmp_path)
        (td / "files" / "a.png").write_bytes(b"abc")
        _info(td, "a.png", "out/a.png")
        scan = ts.scan([root], uid=UID)
        assert scan.count == 1

        outside = tmp_path / "outside"
        outside.mkdir()
        (outside / "loot.png").write_bytes(b"loot")
        (td / "files" / "a.png").unlink()
        (td / "files").rmdir()
        os.symlink(outside, td / "files", target_is_directory=True)

        # empty() re-scans (and would reject the swapped dir), so target the
        # removal step directly to exercise the scan→removal race window.
        outcome, error = ts._remove_entry(scan.entries[0], uid=UID)
        assert outcome == "failed"
        assert error
        assert (outside / "loot.png").read_bytes() == b"loot"
        assert (td / "files").is_symlink()

    def test_symlinked_trash_dir_never_entered(self, tmp_path: Path):
        """A .Trash-<uid> symlink pointing at a sensitive dir is skipped."""
        root = tmp_path / "out"
        root.mkdir()
        sensitive = tmp_path / "sensitive"
        (sensitive / "info").mkdir(parents=True)
        (sensitive / "files").mkdir(parents=True)
        (sensitive / "files" / "a.png").write_bytes(b"a")
        _info(sensitive, "a.png", "out/a.png")
        os.symlink(sensitive, tmp_path / f".Trash-{UID}", target_is_directory=True)
        result = ts.empty([root], uid=UID)
        assert result.ok and result.data["removed"] == 0
        assert (sensitive / "files" / "a.png").exists()

    def test_non_sticky_dot_trash_skipped(self, tmp_path: Path):
        """Without the sticky bit, <topdir>/.Trash/<uid> must not be trusted."""
        root = tmp_path / "out"
        root.mkdir()
        shared = tmp_path / ".Trash"
        (shared / str(UID) / "info").mkdir(parents=True)
        (shared / str(UID) / "files").mkdir(parents=True)
        (shared / str(UID) / "files" / "a.png").write_bytes(b"a")
        _info(shared / str(UID), "a.png", "out/a.png")
        assert not (shared.stat().st_mode & stat.S_ISVTX)
        result = ts.empty([root], uid=UID)
        assert result.ok and result.data["removed"] == 0
        assert (shared / str(UID) / "files" / "a.png").exists()

    def test_symlinked_dot_trash_skipped(self, tmp_path: Path):
        """.Trash as a symlink is not a valid sticky admin trash parent."""
        root = tmp_path / "out"
        root.mkdir()
        evil = tmp_path / "evil"
        (evil / str(UID) / "info").mkdir(parents=True)
        (evil / str(UID) / "files").mkdir(parents=True)
        (evil / str(UID) / "files" / "a.png").write_bytes(b"a")
        _info(evil / str(UID), "a.png", "out/a.png")
        os.symlink(evil, tmp_path / ".Trash", target_is_directory=True)
        result = ts.empty([root], uid=UID)
        assert result.ok and result.data["removed"] == 0
        assert (evil / str(UID) / "files" / "a.png").exists()

    def test_malformed_and_binary_trashinfo_ignored(self, tmp_path: Path):
        root = tmp_path / "out"
        root.mkdir()
        td = _make_trash(tmp_path)
        (td / "files" / "a.png").write_bytes(b"a")
        (td / "info" / "a.png.trashinfo").write_bytes(b"\x00\x01\x02\xff garbage")
        result = ts.empty([root], uid=UID)
        assert result.ok and result.data["removed"] == 0
        assert (td / "files" / "a.png").exists()

    @pytest.mark.parametrize(
        "crafted",
        [".trashinfo", "..trashinfo", "...trashinfo"],
        ids=["empty-stem", "dot", "dot-dot"],
    )
    def test_crafted_info_names_never_widen_removal(self, tmp_path: Path, crafted: str):
        """Crafted info basenames must not remove files/, the trash dir, or foreign entries."""
        root = tmp_path / "out"
        root.mkdir()
        td = _make_trash(tmp_path)
        (td / "info" / crafted).write_text("[Trash Info]\nPath=out/a.png\n")
        (td / "files" / "foreign.png").write_bytes(b"foreign-payload")
        foreign_info = _info(td, "foreign.png", "/elsewhere/foreign.png")

        result = ts.empty([root], uid=UID)

        assert result.ok and result.data["removed"] == 0
        assert (td / "files" / "foreign.png").read_bytes() == b"foreign-payload"
        assert foreign_info.exists()
        assert (td / "info" / crafted).exists()
        assert (td / "files").is_dir() and (td / "info").is_dir()

    def test_trashinfo_larger_than_64kib_ignored(self, tmp_path: Path):
        """An oversized trashinfo (potential parse bomb) is treated as malformed."""
        root = tmp_path / "out"
        root.mkdir()
        td = _make_trash(tmp_path)
        (td / "files" / "big.png").write_bytes(b"b")
        (td / "info" / "big.png.trashinfo").write_text(
            f"[Trash Info]\nPath=out/big.png\nJunk={'y' * (70 * 1024)}\n", encoding="utf-8"
        )
        result = ts.empty([root], uid=UID)
        assert result.ok and result.data["removed"] == 0
        assert (td / "files" / "big.png").exists()

    def test_percent_encoded_absolute_path_selected(self, tmp_path: Path):
        """Encoded Path= referencing the root is selected (happy path, not a hole)."""
        root = tmp_path / "out"
        root.mkdir()
        td = _make_trash(tmp_path)
        (td / "files" / "my cat.png").write_bytes(b"abc")
        _info(td, "my cat.png", f"{root}/my%20cat.png")
        result = ts.empty([root], uid=UID)
        assert result.ok and result.data["removed"] == 1

    def test_home_trash_entries_outside_roots_untouched(self, tmp_path: Path):
        """Home trash scanned for reporting but foreign entries stay put."""
        root = tmp_path / "out"
        root.mkdir()
        xdg = tmp_path / "xdg"
        td = xdg / "Trash"
        (td / "info").mkdir(parents=True)
        (td / "files").mkdir(parents=True)
        (td / "files" / "notes.txt").write_bytes(b"not-majoor")
        _info(td, "notes.txt", "/home/user/Documents/notes.txt")
        scan = ts.scan([root], uid=UID, xdg_data_home=xdg)
        assert scan.count == 0
        result = ts.empty([root], uid=UID, xdg_data_home=xdg)
        assert result.ok and result.data["removed"] == 0
        assert (td / "files" / "notes.txt").read_bytes() == b"not-majoor"
