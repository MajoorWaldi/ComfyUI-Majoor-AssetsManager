"""Backend-facing alias for shared utilities."""

try:
    # When loaded by ComfyUI as a package (e.g. <extension>.backend.*)
    from .. import shared as _root_shared  # type: ignore
except Exception:
    # When running tests or scripts that import `backend.*` as a top-level module
    import shared as _root_shared  # type: ignore

Result = _root_shared.Result
ErrorCode = _root_shared.ErrorCode
get_logger = _root_shared.get_logger
log_success = _root_shared.log_success
log_structured = _root_shared.log_structured
request_id_var = getattr(_root_shared, "request_id_var", None)
classify_file = _root_shared.classify_file
FileKind = _root_shared.FileKind
MetadataQuality = _root_shared.MetadataQuality
IndexMode = _root_shared.IndexMode
MetadataMode = _root_shared.MetadataMode
try:
    from ..shared.types import EXTENSIONS as EXTENSIONS  # type: ignore
except Exception:
    try:
        from shared.types import EXTENSIONS as EXTENSIONS  # type: ignore
    except Exception:
        EXTENSIONS = {}  # type: ignore

__all__ = _root_shared.__all__ + [
    "Result",
    "ErrorCode",
    "get_logger",
    "log_success",
    "log_structured",
    "request_id_var",
    "classify_file",
    "FileKind",
    "MetadataQuality",
    "IndexMode",
    "MetadataMode",
    "EXTENSIONS",
]
