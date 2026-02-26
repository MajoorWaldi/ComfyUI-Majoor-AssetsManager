"""
Upload handler for the /mjr/am/upload_input endpoint.
"""
from pathlib import Path

from aiohttp import web

try:
    import folder_paths  # type: ignore
except Exception:
    class _FolderPathsStub:
        @staticmethod
        def get_input_directory() -> str:
            return str((Path(__file__).resolve().parents[3] / "input").resolve())

    folder_paths = _FolderPathsStub()  # type: ignore

from mjr_am_backend.shared import Result, get_logger

from ..core import (
    _csrf_error,
    _json_response,
    _require_services,
    _require_write_access,
)
from .scan_helpers import (
    _read_upload_file_field,
    _schedule_index_task,
    _upload_skip_index,
    _write_multipart_file_atomic,
)

logger = get_logger(__name__)


async def _index_uploaded_input_best_effort(dest_path: Path, input_dir: Path) -> None:
    try:
        svc, _error_result = await _require_services()
        if svc and svc.get("index"):
            _schedule_index_task(
                lambda: svc["index"].index_paths(
                    [dest_path],
                    str(input_dir),
                    True,
                    "input",
                )
            )
    except Exception as exc:
        logger.debug("Indexing uploaded file skipped: %s", exc)


def register_upload_routes(routes: web.RouteTableDef, *, deps: dict | None = None) -> None:
    """Register the /mjr/am/upload_input route handler.

    deps: if provided (pass globals() from the calling scan module), the handler
          looks up patchable functions from this dict AT CALL TIME so that
          test patches applied after route registration are picked up correctly.
    """
    # _d is captured by reference — scan.__dict__ is live, so patches applied
    # at any point (even after _app() is called) are picked up at handler call time.
    _d = deps  # May be None; fallback to local names when None.

    @routes.post("/mjr/am/upload_input")
    async def upload_input_file(request):
        """
        Upload a file directly to the ComfyUI input directory.

        Multipart form data with 'file' field.
        Query params:
            - purpose: string (optional) - purpose of upload (e.g. "node_drop" for fast path)
        """
        # Live lookups from deps dict so test monkeypatches take effect at call time.
        _csrf_error_ = _d.get("_csrf_error", _csrf_error) if _d is not None else _csrf_error
        _require_write_access_ = _d.get("_require_write_access", _require_write_access) if _d is not None else _require_write_access
        _require_services_ = _d.get("_require_services", _require_services) if _d is not None else _require_services
        _write_multipart_file_atomic_ = _d.get("_write_multipart_file_atomic", _write_multipart_file_atomic) if _d is not None else _write_multipart_file_atomic
        _schedule_index_task_ = _d.get("_schedule_index_task", _schedule_index_task) if _d is not None else _schedule_index_task
        _folder_paths_ = _d.get("folder_paths", folder_paths) if _d is not None else folder_paths

        # CSRF protection
        csrf = _csrf_error_(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))
        auth = _require_write_access_(request)
        if not auth.ok:
            return _json_response(auth)

        try:
            field, filename, upload_err = await _read_upload_file_field(request)
            if upload_err:
                return _json_response(upload_err)
            if field is None or filename is None:
                return _json_response(Result.Err("UPLOAD_FAILED", "Upload failed"))

            skip_index = _upload_skip_index(request)

            input_dir = Path(_folder_paths_.get_input_directory()).resolve()

            write_res = await _write_multipart_file_atomic_(input_dir, filename, field)
            if not write_res.ok:
                return _json_response(write_res)
            dest_path = write_res.data

            # Optionally index the file (skip for fast path), using deps-resolved functions.
            if not skip_index:
                try:
                    svc, _ = await _require_services_()
                    if svc and svc.get("index"):
                        _schedule_index_task_(
                            lambda: svc["index"].index_paths(
                                [dest_path],
                                str(input_dir),
                                True,
                                "input",
                            )
                        )
                except Exception as exc:
                    logger.debug("Indexing uploaded file skipped: %s", exc)

            return _json_response(Result.Ok({
                "name": dest_path.name,
                "subfolder": "",
                "path": str(dest_path)
            }))

        except Exception as e:
            logger.error(f"Upload failed: {e}")
            return _json_response(Result.Err("UPLOAD_FAILED", "Upload failed"))
