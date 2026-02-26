"""
Path validation and security utilities.
"""
import mimetypes
import os
import threading
from pathlib import Path

try:
    import folder_paths  # type: ignore
except Exception:
    class _FolderPathsStub:
        @staticmethod
        def get_input_directory() -> str:
            return str((Path(__file__).resolve().parents[3] / "input").resolve())

        @staticmethod
        def get_output_directory() -> str:
            return str((Path(__file__).resolve().parents[3] / "output").resolve())

    folder_paths = _FolderPathsStub()  # type: ignore

from mjr_am_backend.config import get_runtime_output_root
from mjr_am_backend.custom_roots import list_custom_roots
from mjr_am_backend.features.audio import AUDIO_VIEW_MIME_TYPES
from mjr_am_backend.shared import get_logger
from mjr_am_backend.path_utils import (
    is_within_root as shared_is_within_root,
    normalize_path as shared_normalize_path,
    safe_rel_path as shared_safe_rel_path,
)

logger = get_logger(__name__)

_ALLOWED_DIRECTORIES = None
_ALLOWED_DIRECTORIES_LOCK = threading.Lock()
_ALLOWED_DIRECTORIES_STATE = {"output": None, "input": None}


def _get_allowed_directories():
    """
    Resolve allowed base directories lazily.

    NOTE: ComfyUI can change input/output directories depending on configuration;
    this keeps the allowed list in sync across requests.
    """
    output_root = str(get_runtime_output_root())
    input_root = str(folder_paths.get_input_directory())
    global _ALLOWED_DIRECTORIES
    with _ALLOWED_DIRECTORIES_LOCK:
        if (
            _ALLOWED_DIRECTORIES is None
            or _ALLOWED_DIRECTORIES_STATE.get("output") != output_root
            or _ALLOWED_DIRECTORIES_STATE.get("input") != input_root
        ):
            _ALLOWED_DIRECTORIES_STATE["output"] = output_root
            _ALLOWED_DIRECTORIES_STATE["input"] = input_root
            roots = []
            try:
                roots.append(Path(output_root).resolve(strict=False))
            except Exception as exc:
                logger.warning("Failed to resolve output root for allowlist: %s", exc)
            try:
                roots.append(Path(input_root).resolve(strict=False))
            except Exception as exc:
                logger.warning("Failed to resolve input root for allowlist: %s", exc)
            _ALLOWED_DIRECTORIES = roots
        return list(_ALLOWED_DIRECTORIES or [])


def _normalize_path(value: str) -> Path | None:
    return shared_normalize_path(value)


def _is_path_allowed(candidate: Path | None, *, must_exist: bool = False) -> bool:
    if not candidate:
        return False
    cand_norm = _resolve_candidate_path(candidate, must_exist=must_exist)
    if cand_norm is None:
        return False

    for root in _get_allowed_directories():
        root_resolved = _resolve_root_path(root)
        if root_resolved is None:
            continue
        if _path_relative_to(cand_norm, root_resolved):
            return True

    return False


def _resolve_candidate_path(candidate: Path, *, must_exist: bool) -> Path | None:
    try:
        if must_exist:
            return candidate.resolve(strict=True)
        if candidate.exists():
            return candidate.resolve(strict=True)
        return candidate.resolve(strict=False)
    except (OSError, RuntimeError, ValueError):
        return None


def _resolve_root_path(root: Path) -> Path | None:
    try:
        return root.resolve(strict=True) if root.exists() else root.resolve(strict=False)
    except OSError:
        return None


def _path_relative_to(candidate: Path, root: Path) -> bool:
    try:
        return candidate == root or candidate.is_relative_to(root)
    except AttributeError:
        try:
            common = os.path.commonpath([str(candidate), str(root)])
            return os.path.normcase(common) == os.path.normcase(str(root))
        except ValueError:
            return False


def _is_path_allowed_custom(candidate: Path | None) -> bool:
    """
    Allow paths within any registered custom root.
    """
    if not candidate:
        return False
    custom = list_custom_roots()
    if not custom.ok:
        return False
    for item in custom.data or []:
        root_path = item.get("path") if isinstance(item, dict) else None
        if not root_path:
            continue
        try:
            root = Path(str(root_path)).resolve(strict=False)
        except OSError:
            continue
        if _is_within_root(candidate, root):
            return True
    return False


def _safe_rel_path(value: str) -> Path | None:
    return shared_safe_rel_path(value)


def _is_within_root(candidate: Path, root: Path) -> bool:
    return shared_is_within_root(candidate, root)


# -----------------------------------------------------------------------------
# Media validation helpers (viewer hardening)
# -----------------------------------------------------------------------------

_ALLOWED_VIEW_EXTS = {
    # Images
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".gif",
    ".bmp",
    ".tif",
    ".tiff",
    ".avif",
    # Videos
    ".mp4",
    ".webm",
    ".mov",
    ".mkv",
    ".avi",
    ".m4v",
    # Audio
    ".wav",
    ".mp3",
    ".flac",
    ".ogg",
    ".aiff",
    ".aif",
    ".m4a",
    ".aac",
}


def _guess_content_type_for_file(path: Path) -> str:
    """
    Best-effort content-type for media serving.

    Note: On Windows, `mimetypes` may not include modern media types (webp/webm/avif)
    depending on registry state. We keep a small explicit mapping for viewer-critical
    formats to ensure browsers can decode them.
    """
    try:
        ext = str(path.suffix or "").lower()
        if ext:
            known = {
                # Images
                ".png": "image/png",
                ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg",
                ".gif": "image/gif",
                ".webp": "image/webp",
                ".bmp": "image/bmp",
                ".tif": "image/tiff",
                ".tiff": "image/tiff",
                ".avif": "image/avif",
                # Videos
                ".mp4": "video/mp4",
                ".m4v": "video/x-m4v",
                ".webm": "video/webm",
                ".mov": "video/quicktime",
                ".mkv": "video/x-matroska",
                ".avi": "video/x-msvideo",
            }
            known.update(AUDIO_VIEW_MIME_TYPES)
            if ext in known:
                return known[ext]
    except Exception:
        pass
    try:
        ct, _ = mimetypes.guess_type(str(path))
        if ct:
            return ct
    except Exception:
        pass
    return "application/octet-stream"


def _is_allowed_view_media_file(path: Path) -> bool:
    """
    Restrict what the viewer-serving endpoints can return.

    This reduces the blast radius of custom roots by preventing the UI from
    fetching arbitrary file types through /mjr/am/custom-view.
    """
    try:
        ext = str(path.suffix or "").lower()
        if ext in _ALLOWED_VIEW_EXTS:
            return True
        # Fallback: allow if mimetype is clearly media.
        ct = _guess_content_type_for_file(path)
        return ct.startswith("image/") or ct.startswith("video/") or ct.startswith("audio/")
    except Exception:
        return False
