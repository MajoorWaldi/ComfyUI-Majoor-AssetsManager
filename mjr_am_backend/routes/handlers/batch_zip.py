"""
Batch ZIP builder for drag-out (AssetsManager -> OS).

Used by the frontend to support multi-selection drag-out via "DownloadURL".
"""

from __future__ import annotations

import asyncio
import os
import threading
import time
import zipfile
from pathlib import Path
from typing import Any

from aiohttp import web
from mjr_am_backend.config import OUTPUT_ROOT_PATH
from mjr_am_backend.custom_roots import resolve_custom_root
from mjr_am_backend.routes.core.paths import _is_within_root, _safe_rel_path
from mjr_am_backend.routes.core.request_json import _read_json
from mjr_am_backend.routes.core.response import _json_response
from mjr_am_backend.routes.core.security import _check_rate_limit, _csrf_error
from mjr_am_backend.shared import Result, get_logger, sanitize_error_message

try:
    import folder_paths  # type: ignore
except Exception:
    folder_paths = None  # type: ignore

logger = get_logger(__name__)

_BATCH_DIR = Path(
    os.environ.get("MAJOOR_BATCH_ZIP_DIR") or str(OUTPUT_ROOT_PATH / "_mjr_batch_zips")
)
_BATCH_LOCK = threading.Lock()
_BATCH_CACHE: dict[str, dict[str, Any]] = {}
_TOKEN_LOCKS: dict[str, threading.Lock] = {}
_TOKEN_LOCKS_LOCK = threading.Lock()


def _get_token_lock(token: str) -> threading.Lock:
    with _TOKEN_LOCKS_LOCK:
        lock = _TOKEN_LOCKS.get(token)
        if lock is None:
            lock = threading.Lock()
            _TOKEN_LOCKS[token] = lock
        return lock


def _release_token_lock(token: str) -> None:
    with _TOKEN_LOCKS_LOCK:
        if token in _TOKEN_LOCKS:
            _TOKEN_LOCKS.pop(token, None)

_DEFAULT_BATCH_TTL_SECONDS = 300  # 5 minutes
_DEFAULT_BATCH_MAX = 50
_DEFAULT_MAX_ITEMS = 1000
_DEFAULT_BUILD_TIMEOUT_S = 120.0
_DEFAULT_ZIP_COPY_CHUNK_BYTES = 1024 * 1024  # 1MB

_TOKEN_MAX_LEN = 200
_TOKEN_MIN_LEN = 32
_ZIP_NAME_MAX_LEN = 255
_MAX_REQUEST_BYTES = 5 * 1024 * 1024

_RATE_LIMIT_MAX_REQUESTS = 30
_RATE_LIMIT_WINDOW_SECONDS = 60

_BATCH_TTL_SECONDS = int(os.environ.get("MAJOOR_BATCH_ZIP_TTL_SECONDS", str(_DEFAULT_BATCH_TTL_SECONDS)))
_BATCH_MAX = int(os.environ.get("MAJOOR_BATCH_ZIP_MAX", str(_DEFAULT_BATCH_MAX)))
_MAX_ITEMS = int(os.environ.get("MAJOOR_MAX_BATCH_SIZE", str(_DEFAULT_MAX_ITEMS)))
_BUILD_TIMEOUT_S = float(os.environ.get("MAJOOR_BATCH_ZIP_BUILD_TIMEOUT_S", str(_DEFAULT_BUILD_TIMEOUT_S)))
_ZIP_COPY_CHUNK_BYTES = int(os.environ.get("MAJOOR_BATCH_ZIP_CHUNK_BYTES", str(_DEFAULT_ZIP_COPY_CHUNK_BYTES)))


def _sanitize_token(token: Any) -> str:
    raw = str(token or "").strip()
    if not raw:
        return ""
    if len(raw) > _TOKEN_MAX_LEN:
        return ""
    allowed = []
    for ch in raw:
        if ch.isalnum() or ch in ("_", "-"):
            allowed.append(ch)
    out = "".join(allowed)
    if not out:
        return ""
    # Prevent trivially-guessable tokens (very short / enumerable).
    if len(out) < _TOKEN_MIN_LEN:
        return ""
    return out


def _cleanup_batch_zips() -> None:
    now = time.time()
    with _BATCH_LOCK:
        _cleanup_stale_batch_entries(now)
        _cleanup_batch_cache_cap()


def _get_batch_entry(token: str) -> dict[str, Any] | None:
    with _BATCH_LOCK:
        entry = _BATCH_CACHE.get(token)
    return entry if isinstance(entry, dict) else None


async def _wait_batch_entry_ready(entry: dict[str, Any]) -> Result[bool]:
    event = entry.get("event")
    if not isinstance(event, asyncio.Event) or entry.get("ready"):
        return Result.Ok(True)
    try:
        await asyncio.wait_for(event.wait(), timeout=15.0)
        return Result.Ok(True)
    except asyncio.TimeoutError:
        return Result.Err("NOT_READY", "Zip not ready")
    except Exception:
        return Result.Err("NOT_READY", "Zip not ready")


def _batch_entry_ready_or_error(entry: dict[str, Any] | None) -> Result[dict[str, Any]]:
    if not entry or not entry.get("ready"):
        err = str((entry or {}).get("error") or "Not ready")
        return Result.Err("NOT_READY", err)
    return Result.Ok(entry)


def _batch_file_response(entry: dict[str, Any], token: str) -> web.StreamResponse:
    path = entry.get("path")
    if not isinstance(path, Path) or not path.exists():
        return _json_response(Result.Err("NOT_FOUND", "File missing"), status=404)
    name = entry.get("filename") or f"{token}.zip"
    safe_name = str(name).replace('"', "").replace(";", "").replace("\r", "").replace("\n", "")[:_ZIP_NAME_MAX_LEN]
    headers = {"Content-Disposition": f'attachment; filename="{safe_name}"'}
    try:
        return web.FileResponse(path, headers=headers)
    except Exception as exc:
        logger.debug("FileResponse failed: %s", exc)
        return _json_response(Result.Err("IO_ERROR", "Failed to serve zip"), status=500)


def _cleanup_stale_batch_entries(now: float) -> None:
    stale: list[str] = []
    for token, entry in list(_BATCH_CACHE.items()):
        created_at = float(entry.get("created_at") or 0)
        if created_at and now - created_at > _BATCH_TTL_SECONDS:
            stale.append(token)
    for token in stale:
        entry = _BATCH_CACHE.pop(token, {})
        _release_token_lock(token)
        _delete_batch_zip_path(entry, token, "Cleaned up stale batch zip: %s")


def _cleanup_batch_cache_cap() -> None:
    if len(_BATCH_CACHE) <= _BATCH_MAX:
        return
    items = sorted(_BATCH_CACHE.items(), key=lambda kv: float(kv[1].get("created_at") or 0))
    to_drop = items[: max(0, len(items) - _BATCH_MAX)]
    for token, entry in to_drop:
        _BATCH_CACHE.pop(token, None)
        _release_token_lock(token)
        _delete_batch_zip_path(entry, token, "Cleaned up batch zip (cache cap): %s")


def _delete_batch_zip_path(entry: Any, token: str, success_log: str) -> None:
    path = entry.get("path") if isinstance(entry, dict) else None
    if not isinstance(path, Path):
        return
    try:
        if path.exists():
            path.unlink()
            logger.debug(success_log, path.name)
    except Exception as exc:
        logger.warning("Failed to cleanup batch zip %s: %s", path.name if path else token, exc)


def _resolve_item_path(item: dict[str, Any]) -> Path | None:
    filename_rel, subfolder_rel, typ = _normalized_batch_zip_item_parts(item)
    if filename_rel is None or subfolder_rel is None:
        return None
    base_dir = _resolve_base_dir(item, typ)
    if base_dir is None:
        return None
    candidate = _resolve_candidate_path(base_dir, subfolder_rel, filename_rel)
    if not _is_valid_candidate_path(candidate, base_dir):
        return None
    return candidate


def _normalized_batch_zip_item_parts(item: dict[str, Any]) -> tuple[Path | None, Path | None, str]:
    filename_raw = (item or {}).get("filename")
    subfolder_raw = (item or {}).get("subfolder", "") or ""
    typ = str((item or {}).get("type") or "output").lower()
    filename_rel = _safe_rel_path(str(filename_raw or ""))
    if not filename_rel or len(filename_rel.parts) != 1:
        return None, None, typ
    subfolder_rel = _safe_rel_path(str(subfolder_raw))
    if subfolder_rel is None:
        return None, None, typ
    return filename_rel, subfolder_rel, typ


def _is_valid_candidate_path(candidate: Path | None, base_dir: Path) -> bool:
    if candidate is None:
        return False
    if not _is_within_root(candidate, base_dir):
        return False
    return candidate.exists() and candidate.is_file()


def _resolve_base_dir(item: dict[str, Any], typ: str) -> Path | None:
    if typ == "input":
        return _resolve_input_base_dir()
    if typ == "custom":
        return _resolve_custom_base_dir(item)
    try:
        return OUTPUT_ROOT_PATH.resolve(strict=True)
    except Exception:
        return None


def _resolve_input_base_dir() -> Path | None:
    try:
        if folder_paths is None:
            return None
        return Path(str(folder_paths.get_input_directory())).resolve(strict=True)
    except Exception:
        return None


def _resolve_custom_base_dir(item: dict[str, Any]) -> Path | None:
    root_id = (item or {}).get("root_id") or (item or {}).get("rootId") or (item or {}).get("custom_root_id") or ""
    root_res = resolve_custom_root(str(root_id))
    if not root_res.ok or not isinstance(root_res.data, Path):
        return None
    try:
        return root_res.data.resolve(strict=True)
    except Exception:
        return None


def _resolve_candidate_path(base_dir: Path, subfolder_rel: Path, filename_rel: Path) -> Path | None:
    try:
        return (base_dir / subfolder_rel / filename_rel).resolve(strict=True)
    except Exception:
        return None


def register_batch_zip_routes(routes: web.RouteTableDef) -> None:
    """Register batch-zip creation and download routes."""
    @routes.post("/mjr/am/batch-zip")
    async def create_batch_zip(request: web.Request) -> web.Response:
        loop = asyncio.get_running_loop()
        csrf = _csrf_error(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))

        allowed, retry_after = _check_rate_limit(
            request,
            "batch_zip_create",
            max_requests=_RATE_LIMIT_MAX_REQUESTS,
            window_seconds=_RATE_LIMIT_WINDOW_SECONDS,
        )
        if not allowed:
            return _json_response(Result.Err("RATE_LIMITED", "Rate limit exceeded. Please wait before retrying.", retry_after=retry_after))

        # Simple payload guard (dragstart should be tiny).
        try:
            if request.content_length and int(request.content_length) > _MAX_REQUEST_BYTES:
                return _json_response(Result.Err("PAYLOAD_TOO_LARGE", "Payload too large"))
        except Exception:
            pass

        payload_res = await _read_json(request, max_bytes=_MAX_REQUEST_BYTES)
        if not payload_res.ok:
            return _json_response(payload_res)
        payload = payload_res.data or {}

        token = _sanitize_token((payload or {}).get("token"))
        items = (payload or {}).get("items") or []
        if not token:
            return _json_response(Result.Err("INVALID_INPUT", "Invalid token"))
        if not isinstance(items, list) or not items:
            return _json_response(Result.Err("INVALID_INPUT", "No items provided"))
        if len(items) > _MAX_ITEMS:
            return _json_response(Result.Err("INVALID_INPUT", f"Batch size exceeds limit ({_MAX_ITEMS})"))

        try:
            _BATCH_DIR.mkdir(parents=True, exist_ok=True)
        except Exception as exc:
            return _json_response(
                Result.Err("IO_ERROR", sanitize_error_message(exc, "Cannot create batch directory"))
            )

        _cleanup_batch_zips()

        token_lock = _get_token_lock(token)
        zip_path = (_BATCH_DIR / f".mjr_batch_{token}.zip").resolve()
        try:
            zip_path.relative_to(_BATCH_DIR.resolve(strict=True))
        except Exception:
            return _json_response(Result.Err("INVALID_INPUT", "Invalid zip path"))

        event = asyncio.Event()
        filename = f"Majoor_Batch_{len(items)}.zip"
        with _BATCH_LOCK:
            _BATCH_CACHE[token] = {
                "path": zip_path,
                "event": event,
                "ready": False,
                "created_at": time.time(),
                "filename": filename,
            }

        def _build_zip() -> int:
            with token_lock:
                try:
                    if zip_path.exists():
                        zip_path.unlink()
                except Exception:
                    pass

                count = 0
                used_names = set()
                with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
                    for raw in items:
                        if not isinstance(raw, dict):
                            continue
                        target = _resolve_item_path(raw)
                        if not target:
                            continue

                        # Flatten: never include subfolders in the ZIP. This matches drag-out UX
                        # expectations (a simple bundle of files).
                        arc_name_rel = _safe_rel_path(str(raw.get("filename") or ""))
                        if not arc_name_rel or len(arc_name_rel.parts) != 1:
                            arc_name_rel = Path(target.name)

                        arc_base = arc_name_rel.name or target.name
                        arc_base = arc_base.replace("\x00", "").replace("\r", "").replace("\n", "")
                        arc_base = arc_base.replace("/", "_").replace("\\", "_")
                        if not arc_base:
                            arc_base = target.name

                        # Avoid collisions when multiple folders contain the same filename.
                        stem = Path(arc_base).stem
                        suffix = Path(arc_base).suffix
                        if not stem and suffix:
                            stem = arc_base[: -len(suffix)] or arc_base
                        candidate = arc_base[:_ZIP_NAME_MAX_LEN]
                        if candidate in used_names:
                            n = 2
                            while True:
                                attempt = f"{stem} ({n}){suffix}" if suffix else f"{stem} ({n})"
                                attempt = attempt[:_ZIP_NAME_MAX_LEN]
                                if attempt not in used_names:
                                    candidate = attempt
                                    break
                                n += 1
                        used_names.add(candidate)

                        arc = candidate
                        try:
                            ok = _zip_add_file_open_handle(zf, target, arc)
                            if ok:
                                count += 1
                        except Exception:
                            continue
                return count

        def _zip_add_file_open_handle(zf: zipfile.ZipFile, path: Path, arcname: str) -> bool:
            """
            Avoid TOCTOU by opening the file once and streaming bytes into the zip entry.

            Using `ZipFile.write(path)` re-opens the file by name, which can race with
            rename/replace between checks and reads.
            """
            try:
                arc = str(arcname or "").replace("\x00", "")[:_ZIP_NAME_MAX_LEN]
                if not arc:
                    arc = path.name[:_ZIP_NAME_MAX_LEN]
            except Exception:
                arc = path.name[:_ZIP_NAME_MAX_LEN]

            try:
                with open(path, "rb") as f:
                    try:
                        st = os.fstat(f.fileno())
                    except Exception:
                        st = path.stat()

                    try:
                        dt = time.localtime(float(getattr(st, "st_mtime", time.time())))
                        date_time = (
                            int(dt[0]), int(dt[1]), int(dt[2]),
                            int(dt[3]), int(dt[4]), int(dt[5]),
                        )
                    except Exception:
                        dt_now = time.localtime(time.time())
                        date_time = (
                            int(dt_now[0]), int(dt_now[1]), int(dt_now[2]),
                            int(dt_now[3]), int(dt_now[4]), int(dt_now[5]),
                        )

                    zi = zipfile.ZipInfo(filename=arc, date_time=date_time)
                    zi.compress_type = zipfile.ZIP_DEFLATED
                    try:
                        zi.file_size = int(getattr(st, "st_size", 0) or 0)
                    except Exception:
                        pass

                    with zf.open(zi, "w") as out:
                        while True:
                            chunk = f.read(_ZIP_COPY_CHUNK_BYTES)
                            if not chunk:
                                break
                            out.write(chunk)
                return True
            except Exception:
                return False

        ok = False
        error = None
        count = 0
        try:
            try:
                count = await asyncio.wait_for(asyncio.to_thread(_build_zip), timeout=_BUILD_TIMEOUT_S)
            except asyncio.TimeoutError:
                count = 0
                error = "Batch zip build timed out"
            ok = count > 0
            if not ok:
                error = "No valid files to archive"
        except Exception as exc:
            error = sanitize_error_message(exc, "Batch zip creation failed")

        with _BATCH_LOCK:
            entry = _BATCH_CACHE.get(token)
            if entry:
                entry["ready"] = ok
                entry["error"] = error
                entry["count"] = count
                try:
                    loop.call_soon_threadsafe(entry["event"].set)
                except Exception:
                    pass

        if not ok:
            try:
                if zip_path.exists():
                    zip_path.unlink()
            except Exception:
                pass

        if ok:
            return _json_response(Result.Ok({"token": token, "count": count, "filename": filename}))
        return _json_response(Result.Err("NO_VALID_FILES", error or "No valid files to archive", token=token, count=count, filename=filename))

    @routes.get("/mjr/am/batch-zip/{token}")
    async def get_batch_zip(request: web.Request) -> web.StreamResponse:
        token = _sanitize_token(request.match_info.get("token"))
        if not token:
            return _json_response(Result.Err("INVALID_INPUT", "Invalid token"), status=404)

        _cleanup_batch_zips()

        entry = _get_batch_entry(token)
        if not entry:
            return _json_response(Result.Err("NOT_FOUND", "Not found"), status=404)

        ready_res = await _wait_batch_entry_ready(entry)
        if not ready_res.ok:
            return _json_response(ready_res, status=404)

        entry = _get_batch_entry(token)
        entry_res = _batch_entry_ready_or_error(entry)
        if not entry_res.ok:
            return _json_response(entry_res, status=404)
        return _batch_file_response(entry_res.data or {}, token)
