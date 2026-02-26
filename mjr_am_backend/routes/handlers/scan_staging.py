"""
Stage-to-input handler and helpers.
"""
import asyncio
import os
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from aiohttp import web

try:
    import folder_paths  # type: ignore
except Exception:
    class _FolderPathsStub:
        @staticmethod
        def get_input_directory() -> str:
            return str((Path(__file__).resolve().parents[3] / "input").resolve())

    folder_paths = _FolderPathsStub()  # type: ignore

from mjr_am_backend.config import TO_THREAD_TIMEOUT_S
from mjr_am_backend.custom_roots import resolve_custom_root
from mjr_am_backend.shared import Result, get_logger, sanitize_error_message

from ..core import (
    _csrf_error,
    _is_path_allowed,
    _is_within_root,
    _json_response,
    _normalize_path,
    _read_json,
    _require_services,
    _require_write_access,
    safe_error_message,
)
from .scan_helpers import (
    _files_equal_content,
    _runtime_output_root,
    _schedule_index_task,
)

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# StageDestination dataclass
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class StageDestination:
    """Resolved destination for staging (path + whether it was reused)."""
    path: Path
    reused_existing: bool


def _resolve_stage_destination(dest_dir: Path, filename: str, src_path: Path) -> StageDestination:
    """
    Choose a destination path for staging.

    - If `<dest_dir>/<filename>` already exists and is byte-identical to `src_path`, reuse it.
    - Otherwise, use `<filename>`, `<stem>_1<ext>`, ... to avoid clobbering.
    """
    dest_path = dest_dir / filename
    if dest_path.exists():
        if _files_equal_content(src_path, dest_path):
            return StageDestination(path=dest_path, reused_existing=True)

        stem = dest_path.stem
        suffix = dest_path.suffix
        counter = 1
        while dest_path.exists():
            dest_path = dest_dir / f"{stem}_{counter}{suffix}"
            counter += 1

    return StageDestination(path=dest_path, reused_existing=False)


# ---------------------------------------------------------------------------
# Stage-to-input route handler
# ---------------------------------------------------------------------------

def register_staging_routes(routes: web.RouteTableDef, *, deps: dict | None = None) -> None:
    """Register the /mjr/am/stage-to-input route handler.

    deps: if provided (pass globals() from the calling scan module), the handler
          looks up patchable functions from this dict AT CALL TIME so that test patches
          applied after route registration (e.g. _app() called before monkeypatch) work.
    """
    # _d captured by reference — scan.__dict__ is live, so patches applied
    # at any point (even after _app() is called) are picked up at handler call time.
    _d = deps  # May be None; fallback to local names when None.

    @routes.post("/mjr/am/stage-to-input")
    async def stage_to_input(request):
        """
        Copy files into the ComfyUI input directory.

        JSON body:
            files: [{ filename, subfolder?, type? }]
            index: bool (optional, default true) - whether to index staged files into the DB
            purpose: string (optional) - purpose of staging (e.g. "node_drop" for fast path)
        """
        # Live lookups from deps dict so test monkeypatches take effect at call time.
        _require_services_ = _d.get("_require_services", _require_services) if _d is not None else _require_services
        _csrf_error_ = _d.get("_csrf_error", _csrf_error) if _d is not None else _csrf_error
        _require_write_access_ = _d.get("_require_write_access", _require_write_access) if _d is not None else _require_write_access
        _read_json_ = _d.get("_read_json", _read_json) if _d is not None else _read_json
        _runtime_output_root_ = _d.get("_runtime_output_root", _runtime_output_root) if _d is not None else _runtime_output_root
        _resolve_stage_destination_ = _d.get("_resolve_stage_destination", _resolve_stage_destination) if _d is not None else _resolve_stage_destination
        _resolve_custom_root_ = _d.get("resolve_custom_root", resolve_custom_root) if _d is not None else resolve_custom_root
        _folder_paths_ = _d.get("folder_paths", folder_paths) if _d is not None else folder_paths
        _is_path_allowed_ = _d.get("_is_path_allowed", _is_path_allowed) if _d is not None else _is_path_allowed
        _schedule_index_task_ = _d.get("_schedule_index_task", _schedule_index_task) if _d is not None else _schedule_index_task

        svc, error_result = await _require_services_()
        if error_result:
            return _json_response(error_result)

        csrf = _csrf_error_(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))
        auth = _require_write_access_(request)
        if not auth.ok:
            return _json_response(auth)

        body_res = await _read_json_(request)
        if not body_res.ok:
            return _json_response(body_res)
        body = body_res.data or {}

        # Check if this is a fast path request (e.g., for node drop)
        purpose = body.get("purpose", "").lower().strip()
        skip_index = (purpose == "node_drop")

        # Allow explicit index override to take precedence
        index_staged = body.get("index", not skip_index)  # Default to not indexing if purpose is node_drop
        if isinstance(index_staged, str):
            index_staged = index_staged.strip().lower() in ("1", "true", "yes", "on")
        else:
            index_staged = bool(index_staged)

        files = body.get("files")
        if not isinstance(files, list) or not files:
            result = Result.Err("INVALID_INPUT", "Missing or invalid 'files' list")
            return _json_response(result)

        input_root = Path(_folder_paths_.get_input_directory()).resolve()
        output_root = await _runtime_output_root_(svc)
        staged = []
        staged_paths = []
        errors = []
        pending_ops = []

        def _safe_filename(name: str) -> str | None:
            if not name or "\x00" in name:
                return None
            cleaned = Path(name).name
            if cleaned != name:
                return None
            return cleaned

        def _safe_rel_subfolder(value: Any) -> Path | None:
            if value is None:
                return None
            if not isinstance(value, str):
                return None
            text = value.strip()
            if text == "":
                return Path(".")
            if "\x00" in text:
                return None
            p = Path(text)
            # Windows drive paths like "C:..." or absolute paths are not allowed.
            if getattr(p, "drive", ""):
                return None
            if p.is_absolute():
                return None
            # Disallow traversal
            if any(part == ".." for part in p.parts):
                return None
            return p

        for item in files:
            if not isinstance(item, dict):
                continue
            raw_filename = item.get("filename") or item.get("name")
            filename = _safe_filename(raw_filename)
            if not filename:
                errors.append({"file": raw_filename, "error": "Invalid filename"})
                continue

            subfolder = item.get("subfolder") or ""
            file_type = (item.get("type") or "output").lower()
            root_id = item.get("root_id") or item.get("custom_root_id")
            dest_subfolder = _safe_rel_subfolder(item.get("dest_subfolder", None))
            if "dest_subfolder" in item and dest_subfolder is None:
                errors.append({"file": raw_filename, "error": "Invalid dest_subfolder"})
                continue

            if file_type == "input":
                base_root = _folder_paths_.get_input_directory()
            elif file_type == "custom":
                root_result = _resolve_custom_root_(str(root_id or ""))
                if not root_result.ok:
                    errors.append({"file": raw_filename, "error": root_result.error})
                    continue
                base_root = str(root_result.data)
            else:
                base_root = output_root
            base_dir = str(Path(base_root).resolve())

            candidate = Path(base_dir) / subfolder / filename if subfolder else Path(base_dir) / filename
            normalized = _normalize_path(str(candidate))
            if not normalized or not normalized.exists():
                errors.append({"file": raw_filename, "error": "Source file not found"})
                continue

            if file_type == "custom":
                if not _is_within_root(normalized, Path(base_dir)):
                    errors.append({"file": raw_filename, "error": "Source file outside custom root"})
                    continue
            else:
                if not _is_path_allowed_(normalized):
                    errors.append({"file": raw_filename, "error": "Source file not allowed"})
                    continue

            # Destination:
            # - default: keep current behavior under input/mjr_staged/<source_subfolder?>
            # - if dest_subfolder is provided: stage under input/<dest_subfolder> (no extra prefix)
            if dest_subfolder is None:
                dest_dir = input_root / "mjr_staged"
                if subfolder:
                    dest_dir = dest_dir / subfolder
            else:
                dest_dir = (input_root / dest_subfolder).resolve()
                if not _is_within_root(dest_dir, input_root):
                    errors.append({"file": raw_filename, "error": "Invalid dest_subfolder"})
                    continue
            dest_dir.mkdir(parents=True, exist_ok=True)
            if not dest_dir.is_dir():
                errors.append({"file": raw_filename, "error": "Destination path exists but is not a directory"})
                continue

            resolved = _resolve_stage_destination_(dest_dir, filename, Path(str(normalized)))
            dest_path = resolved.path
            if resolved.reused_existing:
                try:
                    staged_paths.append(dest_path)
                except Exception as exc:
                    logger.debug("Failed to track staged path: %s", exc)

                staged.append({
                    "name": dest_path.name,
                    "subfolder": "" if dest_dir == input_root else str(dest_dir.relative_to(input_root)),
                    "path": str(dest_path)
                })
                continue

            # Batch file ops into a single threadpool task to reduce overhead and avoid threadpool pressure.
            try:
                pending_ops.append({
                    "raw_filename": raw_filename,
                    "src": str(normalized),
                    "dst": str(dest_path),
                    "name": dest_path.name,
                    "subfolder": "" if dest_dir == input_root else str(dest_dir.relative_to(input_root)),
                })
            except Exception:
                errors.append({"file": raw_filename, "error": "Failed to stage file (internal error)"})
                continue

        if pending_ops:
            def _link_or_copy_many(ops: list[dict[str, Any]]) -> list[dict[str, Any]]:
                results: list[dict[str, Any]] = []
                for op in ops:
                    try:
                        src = Path(str(op.get("src") or ""))
                        dst = Path(str(op.get("dst") or ""))
                        did_link = False
                        try:
                            same_drive = True
                            try:
                                if getattr(src, "drive", "") and getattr(dst, "drive", ""):
                                    same_drive = src.drive.lower() == dst.drive.lower()
                            except Exception:
                                same_drive = True

                            if same_drive:
                                os.link(str(src), str(dst))
                                did_link = True
                        except Exception:
                            did_link = False

                        if not did_link:
                            shutil.copy2(str(src), str(dst))

                        results.append({"ok": True})
                    except Exception as exc:
                        results.append(
                            {"ok": False, "error": sanitize_error_message(exc, "Failed to stage file")}
                        )
                return results

            try:
                results = await asyncio.wait_for(asyncio.to_thread(_link_or_copy_many, pending_ops), timeout=TO_THREAD_TIMEOUT_S)
            except asyncio.TimeoutError as exc:
                result = Result.Err("TIMEOUT", safe_error_message(exc, "Staging timed out"), errors=errors)
                return _json_response(result)
            except Exception as exc:
                result = Result.Err("STAGE_FAILED", safe_error_message(exc, "Failed to stage files"), errors=errors)
                return _json_response(result)

            for op, r in zip(pending_ops, results, strict=True):
                if not isinstance(r, dict) or not r.get("ok"):
                    errors.append(
                        {
                            "file": op.get("raw_filename"),
                            "error": sanitize_error_message(
                                (r or {}).get("error") or "Failed to stage file",
                                "Failed to stage file",
                            ),
                        }
                    )
                    continue
                try:
                    dest_path = Path(str(op.get("dst") or ""))
                    staged_paths.append(dest_path)
                except Exception as exc:
                    logger.debug("Failed to track staged path: %s", exc)
                staged.append({
                    "name": op.get("name"),
                    "subfolder": op.get("subfolder") or "",
                    "path": str(op.get("dst") or ""),
                })

        if not staged:
            result = Result.Err("STAGE_FAILED", "No files staged", errors=errors)
            return _json_response(result)

        # Ensure staged files are indexed in DB as input assets (best-effort).
        try:
            if index_staged and staged_paths:
                # Index in the background so staging returns quickly (DnD UX),
                # and avoid blocking the aiohttp event loop on ExifTool/FFprobe.
                _schedule_index_task_(
                    lambda: svc['index'].index_paths(
                        staged_paths,
                        str(input_root),
                        True,  # incremental
                        "input",
                    )
                )
        except Exception as exc:
            logger.debug("Indexing staged files skipped: %s", exc)

        return _json_response(Result.Ok({"staged": staged, "errors": errors}))
