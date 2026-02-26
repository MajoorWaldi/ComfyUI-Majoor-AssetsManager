"""
Shared helper functions and constants for scan/upload/stage handlers.
"""
import asyncio
import os
import tempfile
from pathlib import Path
from typing import Any

from mjr_am_backend.config import OUTPUT_ROOT
from mjr_am_backend.shared import Result, get_logger, sanitize_error_message
from mjr_am_backend.utils import env_float

from ..core import safe_error_message

logger = get_logger(__name__)

# ---------------------------------------------------------------------------
# Module-level constants (shared across sub-modules)
# ---------------------------------------------------------------------------

_DEFAULT_MAX_UPLOAD_SIZE_BYTES = 500 * 1024 * 1024
_DB_CONSISTENCY_SAMPLE = int(os.environ.get("MJR_DB_CONSISTENCY_SAMPLE", "32"))
_DB_CONSISTENCY_COOLDOWN_SECONDS = env_float("MJR_DB_CONSISTENCY_COOLDOWN_SECONDS", 3600.0)
_DEFAULT_MAX_RENAME_ATTEMPTS = 1000
_DEFAULT_MAX_CONCURRENT_INDEX = 10
_UPLOAD_READ_CHUNK_BYTES = 256 * 1024
_FILE_COMPARE_CHUNK_BYTES = 4 * 1024 * 1024
_MAX_FILENAME_LEN = 255

_MAX_UPLOAD_SIZE = int(os.environ.get("MJR_MAX_UPLOAD_SIZE", str(_DEFAULT_MAX_UPLOAD_SIZE_BYTES)))
_MAX_RENAME_ATTEMPTS = int(os.environ.get("MJR_MAX_RENAME_ATTEMPTS", str(_DEFAULT_MAX_RENAME_ATTEMPTS)))
_MAX_CONCURRENT_INDEX = int(os.environ.get("MJR_MAX_CONCURRENT_INDEX", str(_DEFAULT_MAX_CONCURRENT_INDEX)))
_INDEX_SEMAPHORE = asyncio.Semaphore(max(1, _MAX_CONCURRENT_INDEX))


# ---------------------------------------------------------------------------
# Maintenance status emitter
# ---------------------------------------------------------------------------

def _emit_maintenance_status(step: str, level: str = "info", message: str | None = None, **extra) -> None:
    try:
        from ..registry import PromptServer
        payload = {"step": str(step or ""), "level": str(level or "info")}
        if message:
            payload["message"] = str(message)
        if extra:
            payload.update(extra)
        PromptServer.instance.send_sync("mjr-db-restore-status", payload)
    except Exception:
        pass


# ---------------------------------------------------------------------------
# Runtime output root
# ---------------------------------------------------------------------------

async def _runtime_output_root(svc: dict | None) -> str:
    try:
        settings_service = (svc or {}).get("settings") if isinstance(svc, dict) else None
        if settings_service:
            override = await settings_service.get_output_directory()
            if override:
                return str(Path(override).resolve(strict=False))
    except Exception:
        pass
    return str(Path(OUTPUT_ROOT).resolve(strict=False))


# ---------------------------------------------------------------------------
# DB malformed result check
# ---------------------------------------------------------------------------

def _is_db_malformed_result(res: Any) -> bool:
    try:
        if not res or getattr(res, "ok", True):
            return False
        msg = str(getattr(res, "error", "") or "").lower()
        return (
            "database disk image is malformed" in msg
            or "malformed database schema" in msg
            or "file is not a database" in msg
        )
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Upload extension validation helpers
# ---------------------------------------------------------------------------

def _allowed_upload_exts() -> set[str]:
    allowed = _default_allowed_upload_exts()
    _add_env_upload_extensions(allowed)
    return allowed


def _default_allowed_upload_exts() -> set[str]:
    try:
        from mjr_am_backend.shared import EXTENSIONS  # type: ignore

        allowed: set[str] = set()
        for exts in (EXTENSIONS or {}).values():
            for ext in exts or []:
                allowed.add(str(ext).lower())
        allowed.update({".json", ".txt", ".csv"})
        return allowed
    except Exception:
        return {
            ".png",
            ".jpg",
            ".jpeg",
            ".webp",
            ".gif",
            ".mp4",
            ".webm",
            ".mov",
            ".mkv",
            ".wav",
            ".mp3",
            ".flac",
            ".ogg",
            ".m4a",
            ".aac",
            ".obj",
            ".fbx",
            ".glb",
            ".gltf",
            ".stl",
            ".json",
            ".txt",
            ".csv",
        }


def _add_env_upload_extensions(allowed: set[str]) -> None:
    try:
        extra = os.environ.get("MJR_UPLOAD_EXTRA_EXT", "")
    except Exception:
        return
    if not extra:
        return
    for item in extra.split(","):
        normalized = _normalize_upload_extension(item)
        if normalized:
            allowed.add(normalized)


def _normalize_upload_extension(value: str) -> str:
    ext = str(value or "").strip().lower()
    if not ext:
        return ""
    if not ext.startswith("."):
        ext = "." + ext
    return ext


# ---------------------------------------------------------------------------
# Atomic multipart file write helpers
# ---------------------------------------------------------------------------

async def _write_multipart_file_atomic(dest_dir: Path, filename: str, field) -> Result[Path]:
    """
    Write a multipart field to dest_dir using an atomic rename, enforcing max size.
    Never overwrites existing files.
    """
    try:
        dest_dir.mkdir(parents=True, exist_ok=True)
    except Exception as exc:
        return Result.Err(
            "UPLOAD_FAILED",
            sanitize_error_message(exc, "Cannot create destination directory"),
        )

    safe_name = _validate_upload_filename(filename)
    if safe_name is None:
        return Result.Err("INVALID_INPUT", "Invalid filename")

    ext = Path(safe_name).suffix.lower()
    if ext not in _allowed_upload_exts():
        return Result.Err("INVALID_INPUT", "File extension not allowed")

    fd = None
    tmp_path = None
    try:
        fd, tmp_path = tempfile.mkstemp(dir=str(dest_dir), prefix=".upload_", suffix=ext)
        with os.fdopen(fd, "wb") as handle:
            fd = None
            await _write_upload_chunks(field, handle)

        tmp_obj = Path(str(tmp_path))
        final = _unique_upload_destination(dest_dir, safe_name, ext)
        tmp_obj.replace(final)
        return Result.Ok(final)
    except Exception as exc:
        _cleanup_temp_upload_file(fd, tmp_path)
        return Result.Err("UPLOAD_FAILED", safe_error_message(exc, "Upload failed"))


def _validate_upload_filename(filename: str) -> str | None:
    safe_name = Path(str(filename)).name
    if not safe_name or "\x00" in safe_name or safe_name.startswith(".") or ".." in safe_name:
        return None
    return safe_name


async def _write_upload_chunks(field, handle) -> None:
    total = 0
    while True:
        chunk = await field.read_chunk(size=_UPLOAD_READ_CHUNK_BYTES)
        if not chunk:
            break
        total += len(chunk)
        if total > _MAX_UPLOAD_SIZE:
            raise ValueError(f"File exceeds maximum size ({_MAX_UPLOAD_SIZE} bytes)")
        # Avoid blocking the event loop on large writes.
        await asyncio.to_thread(handle.write, chunk)


def _unique_upload_destination(dest_dir: Path, safe_name: str, ext: str) -> Path:
    final = dest_dir / safe_name
    counter = 0
    while final.exists():
        counter += 1
        if counter > _MAX_RENAME_ATTEMPTS:
            raise RuntimeError("Too many rename attempts")
        final = dest_dir / f"{Path(safe_name).stem}_{counter}{ext}"
    return final


def _cleanup_temp_upload_file(fd: int | None, tmp_path: str | None) -> None:
    try:
        if fd is not None:
            os.close(fd)
    except Exception:
        pass
    try:
        if tmp_path:
            Path(str(tmp_path)).unlink(missing_ok=True)
    except Exception:
        pass


# ---------------------------------------------------------------------------
# Index task scheduler
# ---------------------------------------------------------------------------

def _schedule_index_task(fn) -> None:
    async def _runner():
        try:
            async with _INDEX_SEMAPHORE:
                await fn()
        except Exception:
            return

    try:
        asyncio.create_task(_runner())
    except Exception:
        return


# ---------------------------------------------------------------------------
# File comparison helpers
# ---------------------------------------------------------------------------

def _files_equal_content(src: Path, dst: Path, *, chunk_size: int = _FILE_COMPARE_CHUNK_BYTES) -> bool:
    """
    Return True if two files have identical bytes.

    Used to avoid creating *_1 duplicates when re-staging the exact same file.
    """
    if not _files_exist_and_are_regular(src, dst):
        return False

    if _paths_are_same_file(src, dst):
        return True
    if not _file_sizes_equal(src, dst):
        return False

    return _stream_content_equal(src, dst, chunk_size)


def _files_exist_and_are_regular(src: Path, dst: Path) -> bool:
    try:
        return src.exists() and dst.exists() and src.is_file() and dst.is_file()
    except Exception:
        return False


def _paths_are_same_file(src: Path, dst: Path) -> bool:
    try:
        import os
        return os.path.samefile(str(src), str(dst))
    except Exception:
        return False


def _file_sizes_equal(src: Path, dst: Path) -> bool:
    try:
        return src.stat().st_size == dst.stat().st_size
    except Exception:
        return False


def _stream_content_equal(src: Path, dst: Path, chunk_size: int) -> bool:
    try:
        with open(src, "rb") as fs, open(dst, "rb") as fd:
            while True:
                left = fs.read(chunk_size)
                right = fd.read(chunk_size)
                if left != right:
                    return False
                if not left:
                    return True
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Scan root resolver
# ---------------------------------------------------------------------------

def _resolve_scan_root(directory: str) -> Result[Path]:
    """
    Resolve a scan root strictly (follow symlinks/junctions) and ensure it exists.

    This prevents scanning arbitrary paths via symlink escapes inside allowed roots.
    """
    if not directory or "\x00" in str(directory):
        return Result.Err("INVALID_INPUT", "Invalid directory")
    try:
        resolved = Path(str(directory)).expanduser().resolve(strict=True)
    except (OSError, RuntimeError, ValueError) as exc:
        return Result.Err(
            "DIR_NOT_FOUND",
            sanitize_error_message(exc, "Directory not found"),
        )
    if not resolved.exists() or not resolved.is_dir():
        return Result.Err("DIR_NOT_FOUND", "Directory not found")
    return Result.Ok(resolved)


# ---------------------------------------------------------------------------
# Input directory resolver
# ---------------------------------------------------------------------------

def _resolve_input_directory() -> Path:
    try:
        try:
            import folder_paths  # type: ignore
        except Exception:
            class _FolderPathsStub:
                @staticmethod
                def get_input_directory() -> str:
                    return str((Path(__file__).resolve().parents[3] / "input").resolve())
            folder_paths = _FolderPathsStub()  # type: ignore
        return Path(folder_paths.get_input_directory()).resolve()
    except Exception:
        return (Path(__file__).parent.parent.parent.parent / "input").resolve()


# ---------------------------------------------------------------------------
# Watcher config helpers
# ---------------------------------------------------------------------------

def _upload_skip_index(request) -> bool:
    purpose = str(request.query.get("purpose", "") or "").lower().strip()
    return purpose == "node_drop"


def _watcher_settings_from_body(body: dict[str, Any]) -> tuple[int | None, int | None]:
    def _parse_int(name: str) -> int | None:
        if name not in body:
            return None
        value = body.get(name)
        if value is None:
            return None
        try:
            return int(value)
        except (TypeError, ValueError) as exc:
            raise ValueError(f"Invalid value for {name}") from exc

    return _parse_int("debounce_ms"), _parse_int("dedupe_ttl_ms")


def _refresh_watcher_runtime_settings(svc: dict[str, Any]) -> None:
    watcher = svc.get("watcher")
    refresh_fn = getattr(watcher, "refresh_runtime_settings", None)
    if not callable(refresh_fn):
        return
    try:
        refresh_fn()
    except Exception as exc:
        logger.debug("Failed to refresh watcher settings: %s", exc)


async def _read_upload_file_field(request) -> tuple[Any | None, str | None, Result[Any] | None]:
    try:
        reader = await request.multipart()
        field = await reader.next()
    except Exception as exc:
        return None, None, Result.Err("UPLOAD_FAILED", sanitize_error_message(exc, "Upload failed"))
    field_obj: Any = field
    if str(getattr(field_obj, "name", "") or "") != "file":
        return None, None, Result.Err("INVALID_INPUT", "Expected 'file' field")
    filename = getattr(field_obj, "filename", None)
    if not filename:
        return None, None, Result.Err("INVALID_INPUT", "No filename provided")
    return field_obj, str(filename), None
