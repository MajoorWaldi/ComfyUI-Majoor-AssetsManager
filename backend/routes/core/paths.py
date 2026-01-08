"""
Path validation and security utilities.
"""
import os
import threading
from pathlib import Path
from typing import Optional

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

from backend.config import OUTPUT_ROOT
from backend.custom_roots import list_custom_roots
from backend.shared import get_logger

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
    output_root = str(OUTPUT_ROOT)
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


def _normalize_path(value: str) -> Optional[Path]:
    if not value:
        return None
    if "\x00" in value:
        return None
    try:
        candidate = Path(value).expanduser()
        # Resolve without requiring file to exist (strict=False) to support directories pending creation
        return candidate.resolve(strict=False)
    except (OSError, ValueError):
        return None


def _is_path_allowed(candidate: Optional[Path]) -> bool:
    if not candidate:
        return False

    for root in _get_allowed_directories():
        try:
            root_resolved = root.resolve(strict=False)
        except OSError:
            continue

        try:
            if candidate == root_resolved or candidate.is_relative_to(root_resolved):
                return True
        except AttributeError:
            # Fallback when is_relative_to is unavailable
            try:
                if os.path.commonpath([str(candidate), str(root_resolved)]) == str(root_resolved):
                    return True
            except ValueError:
                continue

    return False


def _is_path_allowed_custom(candidate: Optional[Path]) -> bool:
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


def _safe_rel_path(value: str) -> Optional[Path]:
    if value is None:
        return Path("")
    raw = str(value).strip()
    if raw == "":
        return Path("")
    if "\x00" in raw:
        return None
    try:
        rel = Path(raw)
    except (OSError, ValueError):
        return None
    if getattr(rel, "drive", ""):
        return None
    if rel.is_absolute():
        return None
    # Disallow traversal
    if any(part == ".." for part in rel.parts):
        return None
    return rel


def _is_within_root(candidate: Path, root: Path) -> bool:
    try:
        # SECURITY: require strict resolution so symlinks are fully resolved.
        # If we cannot resolve a path to a real filesystem location, treat it as unsafe.
        root_resolved = root.resolve(strict=True)
        cand_resolved = candidate.resolve(strict=True)
    except (OSError, RuntimeError, ValueError):
        return False
    try:
        return cand_resolved == root_resolved or cand_resolved.is_relative_to(root_resolved)
    except AttributeError:
        try:
            return os.path.commonpath([str(cand_resolved), str(root_resolved)]) == str(root_resolved)
        except ValueError:
            return False
