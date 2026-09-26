from __future__ import annotations

import re
import zlib
from functools import lru_cache
from pathlib import Path
from typing import TypedDict

from .log import get_logger
from mjr_am_shared.runtime_env import get_env
logger = get_logger(__name__)


class VersionInfo(TypedDict):
    version: str
    branch: str


_NIGHTLY_KEYWORDS = ("nightly", "dev", "alpha", "experimental")
_CHANNEL_MARKER_FILES = (".mjr_channel", ".majoor_channel", ".mjr_release_channel")


def _repo_root() -> Path:
    return Path(__file__).resolve().parent.parent


def _find_pyproject_version() -> str:
    try:
        root = _repo_root()
        pyproject_path = root / "pyproject.toml"
        if not pyproject_path.exists():
            return "0.0.0"
        raw = pyproject_path.read_text(encoding="utf-8")
        match = re.search(r'^version\s*=\s*"(.*?)"', raw, flags=re.MULTILINE)
        if match:
            return match.group(1).strip()
    except Exception:
        logger.debug("_find_pyproject_version: suppressed exception", exc_info=True)
    return "0.0.0"


def _resolve_branch_from_env() -> str:
    for key in (
        "MAJOR_ASSETS_MANAGER_BRANCH",
        "MAJOOR_ASSETS_MANAGER_BRANCH",
        "MAJOOR_ASSETS_MANAGER_CHANNEL",
        "MAJOR_ASSETS_MANAGER_CHANNEL",
    ):
        value = get_env(key)
        if value:
            return value.strip()
    return ""


def _git_dirs() -> tuple[Path, Path]:
    git_dir = _repo_root() / ".git"
    if git_dir.is_file():
        marker = git_dir.read_text(encoding="utf-8").strip()
        if not marker.startswith("gitdir: "):
            raise ValueError("Invalid git directory marker")
        git_dir = (git_dir.parent / marker[8:]).resolve()
    common = git_dir
    if (git_dir / "commondir").is_file():
        common = (git_dir / (git_dir / "commondir").read_text(encoding="utf-8").strip()).resolve()
    return git_dir, common


def _git_refs(common: Path) -> dict[str, tuple[str, str]]:
    # Keep the object id AND peeled id: replacing the former loses the
    # distinction between annotated and lightweight tags after pack-refs.
    refs: dict[str, tuple[str, str]] = {}
    packed = common / "packed-refs"
    previous = ""
    if packed.is_file():
        for line in packed.read_text(encoding="utf-8").splitlines():
            if line.startswith("^") and previous:
                refs[previous] = (refs[previous][0], line[1:])
            elif line and not line.startswith("#"):
                oid, previous = line.split(" ", 1)
                refs[previous] = (oid, "")
    root = common / "refs"
    if root.is_dir():
        for path in root.rglob("*"):
            if path.is_file():
                name = path.relative_to(common).as_posix()
                oid = path.read_text(encoding="utf-8").strip()
                packed_oid, peeled = refs.get(name, ("", ""))
                refs[name] = (oid, peeled if oid == packed_oid else "")
    return refs


def _tag_metadata(common: Path, oid: str, peeled: str) -> tuple[str, bool, int]:
    annotated = bool(peeled)
    timestamp = 0
    for _ in range(8):
        if not re.fullmatch(r"[0-9a-f]{40,64}", oid):
            return "", annotated, timestamp
        obj = common / "objects" / oid[:2] / oid[2:]
        if not obj.is_file():
            return peeled or oid, annotated, timestamp
        raw = zlib.decompress(obj.read_bytes())
        if not raw.startswith(b"tag "):
            return oid, annotated, timestamp
        body = raw.split(b"\0", 1)[1]
        if not annotated or not timestamp:
            match = re.search(rb"^tagger .* ([0-9]+) [+-][0-9]{4}$", body, re.MULTILINE)
            timestamp = int(match[1]) if match else 0
        annotated = True
        oid = body.splitlines()[0].removeprefix(b"object ").decode("ascii")
    return "", annotated, timestamp


def _exact_tag(common: Path, head: str, refs: dict[str, tuple[str, str]]) -> str:
    candidates: list[tuple[bool, int, str]] = []
    for ref, (target, peeled) in refs.items():
        if not ref.startswith("refs/tags/"):
            continue
        commit, annotated, timestamp = _tag_metadata(common, target, peeled)
        if commit == head:
            candidates.append((annotated, timestamp, ref[len("refs/tags/"):]))
    # git describe prefers annotated tags, then the newest tagger date.
    candidates.sort(key=lambda item: (-int(item[0]), -item[1], item[2]))
    return candidates[0][2] if candidates else ""


@lru_cache(maxsize=16)
def _run_git(*args: str) -> str:
    """Compatibility helper reading Git metadata without launching a process.

    Supports loose/packed refs, annotated loose tags, detached HEAD and worktrees.
    Missing metadata degrades to channel markers/environment/package version.
    """
    try:
        git_dir, common = _git_dirs()
        head = (git_dir / "HEAD").read_text(encoding="utf-8").strip()
        if args == ("rev-parse", "--abbrev-ref", "HEAD"):
            return head[16:] if head.startswith("ref: refs/heads/") else "HEAD"
        if args == ("describe", "--tags", "--exact-match"):
            refs = _git_refs(common)
            oid = refs.get(head[5:], ("", ""))[0] if head.startswith("ref: ") else head
            return _exact_tag(common, oid, refs)
    except (OSError, ValueError, zlib.error):
        pass
    return ""


def _resolve_branch_from_git() -> str:
    branch = _run_git("rev-parse", "--abbrev-ref", "HEAD")
    # Detached HEAD commonly returns literal "HEAD".
    if not branch or branch.upper() == "HEAD":
        return ""
    return branch


def _looks_nightly(value: str) -> bool:
    lowered = str(value or "").strip().lower()
    return any(k in lowered for k in _NIGHTLY_KEYWORDS)


def _normalize_channel(channel: str) -> str:
    value = str(channel or "").strip().lower()
    if not value:
        return ""
    if _looks_nightly(value):
        return "nightly"
    if value in {"stable", "latest", "release", "main", "master"}:
        return "main"
    return value


def _resolve_branch_from_channel_marker() -> str:
    root = _repo_root()
    for marker_name in _CHANNEL_MARKER_FILES:
        try:
            marker_path = root / marker_name
            if not marker_path.exists():
                continue
            raw = marker_path.read_text(encoding="utf-8").strip()
            normalized = _normalize_channel(raw)
            if normalized:
                return normalized
        except Exception:
            continue
    return ""


def _resolve_branch_from_path() -> str:
    try:
        root_name = _repo_root().name
        if _looks_nightly(root_name):
            return "nightly"
    except Exception:
        logger.debug("_resolve_branch_from_path: suppressed exception", exc_info=True)
    return ""


def _is_nightly_checkout(version: str, branch: str) -> bool:
    if _looks_nightly(branch) or _looks_nightly(version):
        return True

    # If running from git and HEAD isn't exactly the stable release tag,
    # treat it as nightly/development build.
    exact_tag = _run_git("describe", "--tags", "--exact-match")
    if exact_tag:
        if _looks_nightly(exact_tag):
            return True
        clean = str(version or "").strip().lstrip("v")
        return exact_tag not in {clean, f"v{clean}"}
    return False


def _resolve_branch(version: str) -> str:
    env_branch = _resolve_branch_from_env()
    if env_branch:
        return _normalize_channel(env_branch)

    marker_branch = _resolve_branch_from_channel_marker()
    if marker_branch:
        return marker_branch

    git_branch = _resolve_branch_from_git()
    if git_branch:
        return _normalize_channel(git_branch)

    path_branch = _resolve_branch_from_path()
    if path_branch:
        return path_branch

    if _is_nightly_checkout(version, ""):
        return "nightly"

    return "main"


def get_version_info() -> VersionInfo:
    version = _find_pyproject_version()
    branch = _resolve_branch(version)
    if _is_nightly_checkout(version, branch):
        return {"version": "nightly", "branch": "nightly"}
    return {
        "version": version,
        "branch": branch,
    }
