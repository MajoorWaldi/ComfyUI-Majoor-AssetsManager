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
from .audit_log import audit_log_write
from .security import (
    _check_rate_limit,
    _current_user_id,
    _csrf_error,
    _get_request_user_id,
    _has_configured_write_token,
    _is_loopback_request,
    _push_request_user_context,
    _reset_request_user_context,
    _require_authenticated_user,
    _require_operation_enabled,
    _require_write_access,
    _resolve_security_prefs,
)
from .services import _build_services, _require_services, get_services_error

__all__ = [
    "_json_response",
    "audit_log_write",
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
    "_current_user_id",
    "_csrf_error",
    "_get_request_user_id",
    "_has_configured_write_token",
    "_is_loopback_request",
    "_push_request_user_context",
    "_reset_request_user_context",
    "_require_operation_enabled",
    "_resolve_security_prefs",
    "_require_authenticated_user",
    "_require_write_access",
    "_require_services",
    "_build_services",
    "get_services_error",
    "_read_json",
]
