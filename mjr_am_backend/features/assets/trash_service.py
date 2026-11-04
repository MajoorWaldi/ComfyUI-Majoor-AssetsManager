"""Freedesktop trash discovery and emptying for Majoor-managed roots.

Majoor deletes through ``send2trash``; on freedesktop platforms that moves
files into the freedesktop trash (``<mount>/.Trash-<uid>/``, ``<mount>/.Trash/<uid>/``
or ``$XDG_DATA_HOME/Trash``). Headless servers never empty it, so curation
never frees disk.

This module finds, among the trash directories relevant to Majoor's roots,
only the entries whose original path (recorded in the ``.trashinfo`` ``Path=``
field) lies inside a Majoor root, and permanently removes those on request.
Everything else — foreign entries, malformed metadata, orphans and anything
reachable only through a symlink — is never touched.

Hardening rules:

- A trash directory (and its ``files/`` and ``info/`` subdirectories) is used
  only when it is a real directory owned by the effective uid and not
  group/world-writable, so trashed state planted by another user on a shared
  mount is ignored.
- Removal never operates on absolute paths. The trash directory and its
  ``files/``/``info/`` subdirectories are opened with
  ``O_RDONLY|O_DIRECTORY|O_NOFOLLOW`` relative to their parent fd, ownership
  and mode are re-checked via ``fstat``, and unlink targets are addressed by
  bare name via ``dir_fd``. Directory payloads are never removed (Majoor only
  trashes files); they are reported in ``skipped_dirs``.

All filesystem state is injected via parameters (``uid``, ``home``,
``xdg_data_home``, and ``platform`` for :func:`is_supported`) so tests can
point the service at synthetic trees under ``tmp_path``.
"""

from __future__ import annotations

import os
import stat
import sys
from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.parse import unquote

from ...shared import Result, get_logger
from ...shared import sanitize_error_message as _safe_error_message

logger = get_logger(__name__)

_SUPPORTED_PLATFORM_PREFIXES = ("linux", "freebsd", "openbsd", "netbsd")
_TRASH_INFO_HEADER = "[Trash Info]"
_INFO_SUFFIX = ".trashinfo"
_MAX_INFO_BYTES = 64 * 1024
_FORBIDDEN_WRITE_BITS = 0o022
_OPEN_DIR_FLAGS = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW


def is_supported(platform: str | None = None) -> bool:
    """Return True only on freedesktop platforms (Linux and the BSDs)."""
    plat = sys.platform if platform is None else str(platform)
    return any(plat.startswith(prefix) for prefix in _SUPPORTED_PLATFORM_PREFIXES)


@dataclass(frozen=True)
class TrashDir:
    """A validated trash directory with the topdir used for relative paths."""

    path: Path
    topdir: Path
    info_dir: Path
    files_dir: Path


@dataclass(frozen=True)
class TrashEntry:
    """One selected trash entry: payload/info names inside its trash dir."""

    trash_dir: Path
    payload_name: str
    info_name: str
    size: int


@dataclass(frozen=True)
class TrashScan:
    """Aggregated scan result: selected entry count, total bytes and entries."""

    count: int
    bytes: int
    entries: tuple[TrashEntry, ...]


def _normalize_roots(roots: Iterable[Path | str] | None) -> list[Path]:
    """Resolve and deduplicate the Majoor roots; unresolvable roots are dropped."""
    out: list[Path] = []
    seen: set[str] = set()
    for root in roots or []:
        try:
            resolved = Path(str(root)).resolve(strict=False)
        except (OSError, ValueError, RuntimeError):
            logger.debug("trash: skipping unresolvable root %r", root)
            continue
        key = str(resolved)
        if key in seen:
            continue
        seen.add(key)
        out.append(resolved)
    return out


def _lexical_roots(roots: Iterable[Path | str] | None) -> list[Path]:
    """Absolute, lexically-normalised roots (symlinks NOT resolved)."""
    out: list[Path] = []
    seen: set[str] = set()
    for root in roots or []:
        normalized = Path(os.path.normpath(os.path.abspath(str(root))))
        key = str(normalized)
        if key in seen:
            continue
        seen.add(key)
        out.append(normalized)
    return out


def _mount_point(path: Path) -> Path:
    """Walk up to the mount point (topdir) owning *path*."""
    current = Path(path)
    while not os.path.ismount(current):
        parent = current.parent
        if parent == current:
            return current
        current = parent
    return current


def _lstat_safe(path: Path) -> os.stat_result | None:
    try:
        return os.lstat(path)
    except OSError:
        return None


def _owned_dir_mode_ok(st: os.stat_result) -> bool:
    return stat.S_ISDIR(st.st_mode) and (st.st_mode & _FORBIDDEN_WRITE_BITS) == 0


def _is_owned_dir(path: Path, uid: int) -> bool:
    """Real directory (never a symlink), owned by *uid*, not group/world-writable."""
    st = _lstat_safe(path)
    return st is not None and st.st_uid == uid and _owned_dir_mode_ok(st)


def _is_owned_dir_or_absent(path: Path, uid: int) -> bool:
    """Absent is fine; otherwise a real dir owned by *uid* with a safe mode."""
    st = _lstat_safe(path)
    return st is None or (st.st_uid == uid and _owned_dir_mode_ok(st))


def _fd_owned_safe(fd: int, uid: int) -> bool:
    """Re-check ownership/mode on an already-open directory fd."""
    try:
        st = os.fstat(fd)
    except OSError:
        return False
    return st.st_uid == uid and _owned_dir_mode_ok(st)


def trash_dirs(
    roots: Sequence[Path | str],
    *,
    uid: int | None = None,
    home: Path | None = None,
    xdg_data_home: Path | str | None = None,
) -> list[TrashDir]:
    """Enumerate the freedesktop trash dirs relevant to *roots*.

    Scans the home trash (``$XDG_DATA_HOME/Trash``) plus, for the mount of
    each root, ``<topdir>/.Trash-<uid>`` and the sticky-bit
    ``<topdir>/.Trash/<uid>``. Every candidate must be a real directory owned
    by *uid* with no group/world write bits (likewise its ``files/`` and
    ``info/``), and results are deduplicated by real path.
    """
    if uid is None:
        uid = os.getuid()
    if home is None:
        home = Path.home()
    if xdg_data_home is None:
        env_xdg = os.environ.get("XDG_DATA_HOME")
        xdg_data_home = Path(env_xdg) if env_xdg else Path(home) / ".local" / "share"

    candidates: list[tuple[Path, Path]] = [(Path(xdg_data_home) / "Trash", Path(xdg_data_home))]

    seen_topdirs: set[str] = set()
    for root in _normalize_roots(roots):
        topdir = _mount_point(root)
        key = os.path.realpath(topdir)
        if key in seen_topdirs:
            continue
        seen_topdirs.add(key)
        candidates.append((topdir / f".Trash-{uid}", topdir))
        sticky_parent = topdir / ".Trash"
        st = _lstat_safe(sticky_parent)
        if st is not None and stat.S_ISDIR(st.st_mode) and (st.st_mode & stat.S_ISVTX):
            candidates.append((sticky_parent / str(uid), topdir))

    out: list[TrashDir] = []
    seen: set[str] = set()
    for path, topdir in candidates:
        key = os.path.realpath(path)
        if key in seen:
            continue
        seen.add(key)
        if not _is_owned_dir(path, uid):
            continue
        if not (_is_owned_dir_or_absent(path / "files", uid) and _is_owned_dir_or_absent(path / "info", uid)):
            continue
        out.append(
            TrashDir(path=path, topdir=topdir, info_dir=path / "info", files_dir=path / "files")
        )
    return out


def _parse_trashinfo(info_path: Path) -> str | None:
    """Return the raw ``Path=`` value, or None when the file is malformed.

    Reads at most 64 KiB; larger or undecodable files are treated as
    malformed rather than parsing unbounded attacker-supplied content.
    The open uses ``O_NOFOLLOW`` so a symlink swapped in after the lstat
    fails and is treated as malformed.
    """
    try:
        info_fd = os.open(info_path, os.O_RDONLY | os.O_NOFOLLOW)
    except OSError:
        return None
    try:
        with os.fdopen(info_fd, "rb") as handle:
            raw = handle.read(_MAX_INFO_BYTES + 1)
    except OSError:
        return None
    if len(raw) > _MAX_INFO_BYTES:
        return None
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        return None
    if _TRASH_INFO_HEADER not in text:
        return None
    for line in text.splitlines():
        if line.startswith("Path="):
            value = line[len("Path=") :].strip()
            return value or None
    return None


def _is_within(candidate: Path, roots: list[Path]) -> bool:
    """Component-wise containment: *candidate* equals or sits under a root."""
    for root in roots:
        if candidate == root or root in candidate.parents:
            return True
    return False


def _payload_size(payload: Path) -> int:
    """lstat-based size of a payload; directories and missing files count 0."""
    try:
        st = os.lstat(payload)
    except OSError:
        return 0
    if stat.S_ISDIR(st.st_mode):
        return 0
    return st.st_size


def _entry_from_info(
    item: os.DirEntry,
    trash_dir: TrashDir,
    resolved_roots: list[Path],
    lexical_roots: list[Path],
) -> TrashEntry | None:
    """Select a trash entry from one scandir item of the info directory."""
    name = item.name
    if not name.endswith(_INFO_SUFFIX):
        return None
    try:
        st = os.lstat(item.path)
    except OSError:
        return None
    if not stat.S_ISREG(st.st_mode):
        return None
    info_path = Path(item.path)
    raw = _parse_trashinfo(info_path)
    if not raw:
        return None
    original = unquote(raw)
    if "\x00" in original:
        return None
    if os.path.isabs(original):
        candidate = Path(os.path.normpath(original))
    else:
        candidate = Path(os.path.normpath(str(trash_dir.topdir / original)))
    # Match either the lexical form or the realpath form of the original
    # location against either root form, so entries recorded through a
    # symlinked root prefix are still recognised. Selection only decides
    # which trash payload to remove — it never touches the original path.
    forms = [candidate]
    real = Path(os.path.realpath(candidate))
    if real != candidate:
        forms.append(real)
    selected = False
    for form in forms:
        if _is_within(form, resolved_roots) or _is_within(form, lexical_roots):
            selected = True
            break
    if not selected:
        return None
    # The payload name is attacker-controlled: a crafted info basename
    # (".trashinfo", "..trashinfo", ...) must never resolve the payload to
    # the files dir, the trash dir, or anything outside files/.
    stem = name[: -len(_INFO_SUFFIX)]
    payload = trash_dir.files_dir / stem
    if (
        stem in ("", ".", "..")
        or os.sep in stem
        or (os.altsep and os.altsep in stem)
        or "\x00" in stem
        or payload.parent != trash_dir.files_dir
    ):
        return None
    return TrashEntry(
        trash_dir=trash_dir.path,
        payload_name=stem,
        info_name=name,
        size=_payload_size(payload),
    )


def scan(
    roots: Sequence[Path | str],
    *,
    uid: int | None = None,
    home: Path | None = None,
    xdg_data_home: Path | str | None = None,
) -> TrashScan:
    """Count (and collect) trash entries whose original path is inside *roots*."""
    resolved = _normalize_roots(roots)
    lexical = _lexical_roots(roots)
    entries: list[TrashEntry] = []
    for trash_dir in trash_dirs(resolved, uid=uid, home=home, xdg_data_home=xdg_data_home):
        try:
            listing = list(os.scandir(trash_dir.info_dir))
        except OSError as exc:
            logger.debug("trash scan: cannot list %s: %s", trash_dir.info_dir, exc)
            continue
        for item in listing:
            try:
                entry = _entry_from_info(item, trash_dir, resolved, lexical)
            except (OSError, ValueError):
                # A single hostile info entry must never fail the whole scan.
                continue
            if entry is not None:
                entries.append(entry)
    return TrashScan(count=len(entries), bytes=sum(e.size for e in entries), entries=tuple(entries))


def _remove_entry(entry: TrashEntry, *, uid: int) -> tuple[str, str | None]:
    """Remove one payload plus its trashinfo using fd-relative operations only.

    Returns ``(outcome, error)`` where outcome is ``"removed"``,
    ``"skipped_dir"`` (directory payload — never removed) or ``"failed"``.
    """
    try:
        trash_fd = os.open(entry.trash_dir, _OPEN_DIR_FLAGS)
    except OSError as exc:
        return "failed", _safe_error_message(exc, "Failed to open trash directory")
    try:
        try:
            files_fd = os.open("files", _OPEN_DIR_FLAGS, dir_fd=trash_fd)
        except OSError as exc:
            return "failed", _safe_error_message(exc, "Failed to open trash files directory")
        try:
            try:
                info_fd = os.open("info", _OPEN_DIR_FLAGS, dir_fd=trash_fd)
            except OSError as exc:
                return "failed", _safe_error_message(exc, "Failed to open trash info directory")
            try:
                if not (
                    _fd_owned_safe(trash_fd, uid)
                    and _fd_owned_safe(files_fd, uid)
                    and _fd_owned_safe(info_fd, uid)
                ):
                    return "failed", "Trash directory failed ownership or mode re-check"
                try:
                    st = os.lstat(entry.payload_name, dir_fd=files_fd)
                except FileNotFoundError:
                    st = None
                except OSError as exc:
                    return "failed", _safe_error_message(exc, "Failed to stat trashed entry")
                if st is not None:
                    if stat.S_ISREG(st.st_mode) or stat.S_ISLNK(st.st_mode):
                        try:
                            os.unlink(entry.payload_name, dir_fd=files_fd)
                        except FileNotFoundError:
                            pass  # vanished concurrently — treat as removed
                        except OSError as exc:
                            return "failed", _safe_error_message(exc, "Failed to remove trashed entry")
                    else:
                        # Majoor only ever trashes files; directory payloads
                        # (and any other non-file type) are skipped, not removed.
                        return "skipped_dir", None
                try:
                    os.unlink(entry.info_name, dir_fd=info_fd)
                except FileNotFoundError:
                    pass
                except OSError as exc:
                    return "failed", _safe_error_message(exc, "Failed to remove trashinfo")
                return "removed", None
            finally:
                os.close(info_fd)
        finally:
            os.close(files_fd)
    finally:
        os.close(trash_fd)


def empty(
    roots: Sequence[Path | str],
    *,
    uid: int | None = None,
    home: Path | None = None,
    xdg_data_home: Path | str | None = None,
) -> Result[dict[str, Any]]:
    """Permanently remove every selected trash entry for *roots*.

    Failures on individual entries are reported and skipped; the rest of the
    batch still proceeds. Directory payloads are never removed and are
    counted in ``skipped_dirs``.
    """
    if uid is None:
        uid = os.getuid()
    scan_result = scan(roots, uid=uid, home=home, xdg_data_home=xdg_data_home)
    removed = 0
    freed = 0
    skipped_dirs = 0
    failed: list[dict[str, str]] = []
    for entry in scan_result.entries:
        outcome, error = _remove_entry(entry, uid=uid)
        if outcome == "skipped_dir":
            skipped_dirs += 1
            continue
        if error is not None:
            failed.append({"name": entry.payload_name, "error": error})
            continue
        removed += 1
        freed += entry.size
    return Result.Ok(
        {"removed": removed, "bytes": freed, "failed": failed, "skipped_dirs": skipped_dirs}
    )


__all__ = [
    "TrashDir",
    "TrashEntry",
    "TrashScan",
    "empty",
    "is_supported",
    "scan",
    "trash_dirs",
]
