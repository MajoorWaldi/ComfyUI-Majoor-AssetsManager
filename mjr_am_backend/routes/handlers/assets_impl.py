"""
Asset management endpoints: ratings, tags, service retry.
"""
from pathlib import Path
from typing import Any

from aiohttp import web
from mjr_am_backend.config import TO_THREAD_TIMEOUT_S, get_runtime_output_root
from mjr_am_backend.custom_roots import list_custom_roots, resolve_custom_root
from mjr_am_backend.features.assets import (
    STRIP_SUPPORTED_EXTS,
    build_download_response,
    download_clean_exiftool,
    download_clean_png,
    download_rate_limit_response_or_none,
    enqueue_rating_tags_sync,
    filepath_db_keys,
    filepath_where_clause,
    find_asset_id_row_by_filepath,
    find_rename_row_by_filepath,
    handle_download_asset,
    handle_download_clean_asset,
    is_preview_download_request,
    load_asset_filepath_by_id as _load_asset_filepath_by_id,
    load_asset_row_by_id as _load_asset_row_by_id,
    parse_rating_value,
    prepare_asset_ids_context,
    prepare_asset_path_context,
    prepare_asset_rename_context,
    prepare_asset_route_context,
    resolve_download_path,
    resolve_rating_asset_id,
    resolve_delete_target,
    resolve_rename_target,
    safe_download_filename,
    sanitize_tags,
)
from mjr_am_backend.features.assets.delete_service import (
    delete_file_best_effort as _delete_file_safe,
)
from mjr_am_backend.features.assets.filename_validator import (
    validate_filename as _validate_filename,
)
from mjr_am_backend.features.assets.lookup_service import (
    folder_paths,
    infer_source_and_root_id_from_path as _infer_source_and_root_id,
    resolve_or_create_asset_id as _resolve_or_create_asset_id,
)
from mjr_am_backend.shared import Result, get_logger
from mjr_am_backend.shared import sanitize_error_message as _safe_error_message

from ..assets.path_guard import (
    is_resolved_path_allowed as _is_resolved_path_allowed,
)

from ..assets import route_actions as _route_actions  # noqa: E402

from ..core import (
    _build_services,
    _check_rate_limit,
    _csrf_error,
    _is_loopback_request,
    _is_path_allowed,
    _is_path_allowed_custom,
    _is_within_root,
    _json_response,
    _normalize_path,
    _read_json,
    _require_operation_enabled,
    _require_services,
    _require_write_access,
    _resolve_security_prefs,
    audit_log_write,
    get_services_error,
)

logger = get_logger(__name__)

MAX_TAGS_PER_ASSET = 50
MAX_TAG_LENGTH = 100
MAX_RENAME_LENGTH = 255


# ---------------------------------------------------------------------------
# Module-level helpers (previously closures inside register_asset_routes)
# ---------------------------------------------------------------------------

async def _audit_asset_write(
    request: web.Request,
    services: dict[str, Any],
    operation: str,
    target: Any,
    result: Result,
    **details: Any,
) -> None:
    try:
        await audit_log_write(
            services,
            request=request,
            operation=operation,
            target=target,
            result=result,
            details=details or None,
        )
    except Exception as exc:
        logger.debug("Audit logging skipped for %s: %s", operation, exc)


def _resolve_body_filepath(body: dict | None) -> Path | None:
    try:
        raw = ""
        if isinstance(body, dict):
            raw = body.get("filepath") or body.get("path") or ""
        candidate = _normalize_path(str(raw))
        if not candidate:
            return None
        return candidate
    except Exception:
        return None


def _normalize_result_error(res: Result[Any], default_code: str, default_error: str) -> Result[Any]:
    return Result.Err(res.code if res.code else default_code, res.error if res.error else default_error)


async def _prepare_asset_op_request(
    request: web.Request, *, operation: str
) -> Result[tuple[dict[str, Any], dict[str, Any]]]:
    context_res = await prepare_asset_route_context(
        request,
        operation=operation,
        rate_limit_endpoint=operation,
        max_requests=30,
        window_seconds=60,
        require_services=_require_services,
        resolve_security_prefs=_resolve_security_prefs,
        require_operation_enabled=_require_operation_enabled,
        require_write_access=_require_write_access,
        check_rate_limit=_check_rate_limit,
        read_json=_read_json,
        csrf_error=_csrf_error,
    )
    if not context_res.ok:
        return _normalize_result_error(context_res, "INVALID_INPUT", "Invalid request body")
    context = context_res.data
    return Result.Ok(((context.services if context else {}), (context.body if context else {})))


async def _prepare_asset_rating_request(request: web.Request) -> Result[tuple[dict[str, Any], dict[str, Any]]]:
    return await _prepare_asset_op_request(request, operation="asset_rating")


async def _prepare_asset_tags_request(request: web.Request) -> Result[tuple[dict[str, Any], dict[str, Any]]]:
    return await _prepare_asset_op_request(request, operation="asset_tags")


# ---------------------------------------------------------------------------
# Factored DI wiring (previously duplicated inline lambdas)
# ---------------------------------------------------------------------------

def _wired_resolve_or_create(**kwargs: Any) -> Any:
    return _resolve_or_create_asset_id(
        **kwargs,
        normalize_path=_normalize_path,
        is_within_root=_is_within_root,
        get_runtime_output_root_fn=get_runtime_output_root,
        get_input_directory=folder_paths.get_input_directory,
        list_custom_roots_fn=list_custom_roots,
        resolve_custom_root_fn=resolve_custom_root,
        safe_error_message=_safe_error_message,
        logger=logger,
    )


def _wired_resolve_rating_asset_id(body: dict, svc: dict) -> Any:
    return resolve_rating_asset_id(
        body, svc,
        resolve_or_create_asset_id=_wired_resolve_or_create,
    )


def _wired_enqueue_rating_tags_sync(request_obj: Any, svc_obj: Any, asset_id: int) -> Any:
    return enqueue_rating_tags_sync(request_obj, svc_obj, asset_id, logger=logger)


def _wired_sanitize_tags(tags: Any) -> Any:
    return sanitize_tags(tags, max_tag_length=MAX_TAG_LENGTH, max_tags_per_asset=MAX_TAGS_PER_ASSET)


def _wired_resolve_download_path(filepath: Any) -> Any:
    return resolve_download_path(
        filepath,
        normalize_path=_normalize_path,
        is_resolved_path_allowed=_is_resolved_path_allowed,
        logger=logger,
    )


def _wired_rate_limit(request_obj: Any, *, preview: bool) -> Any:
    return download_rate_limit_response_or_none(
        request_obj,
        preview=preview,
        is_loopback_request=_is_loopback_request,
        check_rate_limit=_check_rate_limit,
    )


def _wired_build_download_attachment(path: Any) -> Any:
    return build_download_response(path, preview=False)


# ---------------------------------------------------------------------------
# Route registration
# ---------------------------------------------------------------------------

def register_asset_routes(routes: web.RouteTableDef) -> None:
    """Register asset CRUD routes (get, delete, rename)."""

    @routes.post("/mjr/am/retry-services")
    async def retry_services(request):
        """
        Retry initializing the services if they previously failed.
        """
        return await _route_actions.handle_retry_services(
            request,
            csrf_error=_csrf_error,
            require_write_access=_require_write_access,
            build_services=_build_services,
            get_services_error=get_services_error,
            json_response=_json_response,
        )

    @routes.post("/mjr/am/asset/rating")
    async def update_asset_rating(request):
        """
        Update asset rating (0-5 stars).

        Body:
          - {"asset_id": int, "rating": int}
          - OR {"filepath": str, "type": "output|input|custom", "root_id"?: str, "rating": int}
        """
        return await _route_actions.handle_update_asset_rating(
            request,
            prepare_asset_rating_request=_prepare_asset_rating_request,
            resolve_rating_asset_id=_wired_resolve_rating_asset_id,
            parse_rating_value=parse_rating_value,
            enqueue_rating_tags_sync=_wired_enqueue_rating_tags_sync,
            audit_asset_write=_audit_asset_write,
            json_response=_json_response,
            safe_error_message=_safe_error_message,
        )

    @routes.post("/mjr/am/asset/tags")
    async def update_asset_tags(request):
        """
        Update asset tags.

        Body:
          - {"asset_id": int, "tags": list[str]}
          - OR {"filepath": str, "type": "output|input|custom", "root_id"?: str, "tags": list[str]}
        """
        return await _route_actions.handle_update_asset_tags(
            request,
            prepare_asset_tags_request=_prepare_asset_tags_request,
            resolve_rating_asset_id=_wired_resolve_rating_asset_id,
            sanitize_tags=_wired_sanitize_tags,
            enqueue_rating_tags_sync=_wired_enqueue_rating_tags_sync,
            audit_asset_write=_audit_asset_write,
            json_response=_json_response,
            safe_error_message=_safe_error_message,
        )

    @routes.post("/mjr/am/open-in-folder")
    async def open_in_folder(request):
        """
        Open the asset's folder in the OS file manager and (when supported) select the file.

        Body: {"asset_id": int} or {"filepath": str}
        """
        return await _route_actions.handle_open_in_folder(
            request,
            prepare_asset_path_context=prepare_asset_path_context,
            resolve_body_filepath=_resolve_body_filepath,
            load_asset_filepath_by_id=_load_asset_filepath_by_id,
            is_resolved_path_allowed=_is_resolved_path_allowed,
            normalize_path=lambda raw: _normalize_path(str(raw)),
            read_json=_read_json,
            require_services=_require_services,
            resolve_security_prefs=_resolve_security_prefs,
            require_operation_enabled=_require_operation_enabled,
            require_write_access=_require_write_access,
            check_rate_limit=_check_rate_limit,
            csrf_error=_csrf_error,
            json_response=_json_response,
            logger=logger,
        )

    @routes.get("/mjr/am/tags")
    async def get_all_tags(request):
        """
        Get all unique tags from the database for autocomplete.

        Returns: {"ok": true, "data": ["tag1", "tag2", ...]}
        """
        return await _route_actions.handle_get_all_tags(
            request,
            require_services=_require_services,
            json_response=_json_response,
            safe_error_message=_safe_error_message,
        )

    @routes.post("/mjr/am/asset/delete")
    async def delete_asset(request):
        """
        Delete a single asset file and its database record.

        Body: {"asset_id": int} or {"filepath": str}
        """
        return await _route_actions.handle_delete_asset(
            request,
            prepare_asset_path_context=prepare_asset_path_context,
            resolve_delete_target=resolve_delete_target,
            load_asset_filepath_by_id=_load_asset_filepath_by_id,
            find_asset_row_by_filepath=find_asset_id_row_by_filepath,
            filepath_db_keys=filepath_db_keys,
            filepath_where_clause=filepath_where_clause,
            delete_file_safe=_delete_file_safe,
            audit_asset_write=_audit_asset_write,
            json_response=_json_response,
            require_services=_require_services,
            resolve_security_prefs=_resolve_security_prefs,
            require_operation_enabled=_require_operation_enabled,
            require_write_access=_require_write_access,
            check_rate_limit=_check_rate_limit,
            read_json=_read_json,
            csrf_error=_csrf_error,
            normalize_path=_normalize_path,
            is_path_allowed=_is_path_allowed,
            is_path_allowed_custom=_is_path_allowed_custom,
            is_resolved_path_allowed=_is_resolved_path_allowed,
            safe_error_message=_safe_error_message,
            logger=logger,
        )

    @routes.post("/mjr/am/asset/rename")
    async def rename_asset(request):
        """
        Rename an asset file and update its database record.

        Body: {"asset_id": int, "new_name": str} or {"filepath": str, "new_name": str}
        """
        return await _route_actions.handle_rename_asset(
            request,
            prepare_asset_rename_context=prepare_asset_rename_context,
            validate_filename=_validate_filename,
            resolve_rename_target=resolve_rename_target,
            load_asset_row_by_id=_load_asset_row_by_id,
            find_asset_row_by_filepath=find_rename_row_by_filepath,
            filepath_db_keys=filepath_db_keys,
            filepath_where_clause=filepath_where_clause,
            audit_asset_write=_audit_asset_write,
            json_response=_json_response,
            require_services=_require_services,
            resolve_security_prefs=_resolve_security_prefs,
            require_operation_enabled=_require_operation_enabled,
            require_write_access=_require_write_access,
            check_rate_limit=_check_rate_limit,
            read_json=_read_json,
            csrf_error=_csrf_error,
            normalize_path=_normalize_path,
            is_resolved_path_allowed=_is_resolved_path_allowed,
            infer_source_and_root_id_from_path=_infer_source_and_root_id,
            is_within_root=_is_within_root,
            get_runtime_output_root=get_runtime_output_root,
            get_input_directory=folder_paths.get_input_directory,
            list_custom_roots=list_custom_roots,
            to_thread_timeout_s=TO_THREAD_TIMEOUT_S,
            safe_error_message=_safe_error_message,
            logger=logger,
        )

    @routes.post("/mjr/am/assets/delete")
    async def delete_assets(request):
        """
        Delete multiple assets by ID.

        Body: {"ids": [int, int, ...]}
        """
        return await _route_actions.handle_delete_assets(
            request,
            prepare_asset_ids_context=prepare_asset_ids_context,
            normalize_path=_normalize_path,
            is_path_allowed=_is_path_allowed,
            is_path_allowed_custom=_is_path_allowed_custom,
            is_resolved_path_allowed=_is_resolved_path_allowed,
            delete_file_safe=_delete_file_safe,
            audit_asset_write=_audit_asset_write,
            json_response=_json_response,
            require_services=_require_services,
            resolve_security_prefs=_resolve_security_prefs,
            require_operation_enabled=_require_operation_enabled,
            require_write_access=_require_write_access,
            check_rate_limit=_check_rate_limit,
            read_json=_read_json,
            csrf_error=_csrf_error,
            safe_error_message=_safe_error_message,
            logger=logger,
        )

    @routes.post("/mjr/am/assets/rename")
    async def rename_asset_endpoint(request):
        """
        Rename a single asset file and update its database record.
        This endpoint is aliased to match the client function name.

        Body: {"asset_id": int, "new_name": str}
        """
        return await rename_asset(request)


async def download_asset(request: web.Request) -> web.StreamResponse:
    return await handle_download_asset(
        request,
        is_preview_download_request=is_preview_download_request,
        download_rate_limit_response_or_none=_wired_rate_limit,
        resolve_download_path=_wired_resolve_download_path,
        build_download_response=lambda path: build_download_response(
            path,
            preview=is_preview_download_request(request),
        ),
    )

async def download_clean_asset(request: web.Request) -> web.StreamResponse:
    return await handle_download_clean_asset(
        request,
        download_rate_limit_response_or_none=_wired_rate_limit,
        resolve_download_path=_wired_resolve_download_path,
        strip_supported_exts=STRIP_SUPPORTED_EXTS,
        build_download_response=_wired_build_download_attachment,
        download_clean_png=lambda resolved_path: download_clean_png(
            resolved_path,
            logger=logger,
            build_download_response=_wired_build_download_attachment,
            safe_download_filename=safe_download_filename,
        ),
        require_services=_require_services,
        logger=logger,
        download_clean_exiftool=lambda resolved_path, ext, exiftool: download_clean_exiftool(
            resolved_path,
            ext,
            exiftool,
            logger=logger,
            build_download_response=_wired_build_download_attachment,
            safe_download_filename=safe_download_filename,
        ),
    )


def register_download_routes(routes: web.RouteTableDef):
    routes.get("/mjr/am/download")(download_asset)
    routes.get("/mjr/am/download-clean")(download_clean_asset)
