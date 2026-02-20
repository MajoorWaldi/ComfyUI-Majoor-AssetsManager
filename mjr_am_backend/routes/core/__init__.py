"""
Core utilities for route handlers.
"""
from .paths import (
    _get_allowed_directories,
    _guess_content_type_for_file,
    _is_allowed_view_media_file,
    _is_path_allowed,
    _is_path_allowed_custom,
    _is_within_root,
    _normalize_path,
    _safe_rel_path,
)
from .request_json import _read_json
from .response import _json_response, safe_error_message
from .security import (
    _check_rate_limit,
    _csrf_error,
    _require_authenticated_user,
    _require_operation_enabled,
    _require_write_access,
    _resolve_security_prefs,
)
from .services import _build_services, _require_services, get_services_error

__all__ = [
    "_json_response",
    "safe_error_message",
    "_normalize_path",
    "_is_path_allowed",
    "_is_path_allowed_custom",
    "_safe_rel_path",
    "_is_within_root",
    "_get_allowed_directories",
    "_guess_content_type_for_file",
    "_is_allowed_view_media_file",
    "_check_rate_limit",
    "_csrf_error",
    "_require_operation_enabled",
    "_resolve_security_prefs",
    "_require_authenticated_user",
    "_require_write_access",
    "_require_services",
    "_build_services",
    "get_services_error",
    "_read_json",
]
