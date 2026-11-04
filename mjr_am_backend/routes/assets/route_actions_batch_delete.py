"""Batch-delete-oriented asset route action extracted from ``route_actions_crud``."""

from __future__ import annotations

from collections.abc import Awaitable, Callable, Mapping
from pathlib import Path
from typing import Any

from aiohttp import web
from mjr_am_backend.features.assets.request_context_service import PrepareAssetIdsContext
from mjr_am_backend.shared import Result
from mjr_am_backend.shared import sanitize_error_message as _safe_error_message


def _delete_audit_target(asset_ids: list[int]) -> str:
    return f"assets:{','.join(str(value) for value in asset_ids[:25])}"


def _result_err(result: Result[Any], default_code: str, default_error: str) -> Result[Any]:
    return Result.Err(
        result.code or default_code,
        str(result.error or default_error),
        **(result.meta or {}),
    )


def _coerce_asset_id(value: Any) -> int | None:
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


async def _load_found_assets(
    services: dict[str, Any],
    asset_ids: list[int],
    *,
    safe_error_message: Callable[[Exception, str], str],
) -> Result[list[dict[str, Any]]]:
    try:
        res = await services["db"].aquery_in(
            "SELECT id, filepath FROM assets WHERE {IN_CLAUSE}",
            "id",
            asset_ids,
        )
    except Exception as exc:
        return Result.Err("DB_ERROR", safe_error_message(exc, "Failed to validate assets"))

    if not res.ok:
        return Result.Err(res.code or "DB_ERROR", str(res.error or "Failed to validate assets"))

    found_assets = res.data or []
    found_ids = {row["id"] for row in found_assets if isinstance(row, dict) and "id" in row}
    missing_ids = set(asset_ids) - found_ids
    if missing_ids:
        return Result.Err(
            "NOT_FOUND",
            f"Assets not found: {sorted(missing_ids)}",
            missing_ids=sorted(missing_ids),
        )
    return Result.Ok(found_assets)


def _validate_asset_row(
    asset_row: dict[str, Any],
    *,
    normalize_path: Callable[[str], Path | None],
    is_path_allowed: Callable[[Path], bool],
    is_path_allowed_custom: Callable[[Path], bool],
    is_resolved_path_allowed: Callable[[Path], bool],
) -> Result[dict[str, Any]]:
    asset_id = asset_row.get("id")
    raw_path = asset_row.get("filepath")
    if asset_id is None:
        return Result.Err("DB_ERROR", "Missing asset id in DB row")
    if not raw_path or not isinstance(raw_path, str):
        return Result.Err(
            "INVALID_INPUT",
            f"Invalid path for asset ID {asset_id}",
            rejected_ids=[int(asset_id)],
        )

    candidate = normalize_path(raw_path)
    if not candidate:
        return Result.Err(
            "INVALID_INPUT",
            f"Invalid asset path for ID {asset_id}",
            rejected_ids=[int(asset_id)],
        )

    allowed_path = is_path_allowed(candidate) or is_path_allowed_custom(candidate)
    if not allowed_path:
        return Result.Err(
            "FORBIDDEN",
            f"Path for asset ID {asset_id} is not within allowed roots",
            rejected_ids=[int(asset_id)],
        )

    try:
        resolved = candidate.resolve(strict=True)
    except Exception:
        resolved = None
    if resolved is not None and not is_resolved_path_allowed(resolved):
        return Result.Err(
            "FORBIDDEN",
            f"Path for asset ID {asset_id} is not within allowed roots",
            rejected_ids=[int(asset_id)],
        )

    return Result.Ok({"id": int(asset_id), "filepath": str(raw_path), "resolved": resolved})


def _validate_assets_for_deletion(
    found_assets: list[dict[str, Any]],
    *,
    normalize_path: Callable[[str], Path | None],
    is_path_allowed: Callable[[Path], bool],
    is_path_allowed_custom: Callable[[Path], bool],
    is_resolved_path_allowed: Callable[[Path], bool],
) -> Result[list[dict[str, Any]]]:
    validated_assets: list[dict[str, Any]] = []
    first_failure: Result[dict[str, Any]] | None = None
    rejected_ids: list[int] = []
    for asset_row in found_assets:
        asset_res = _validate_asset_row(
            asset_row,
            normalize_path=normalize_path,
            is_path_allowed=is_path_allowed,
            is_path_allowed_custom=is_path_allowed_custom,
            is_resolved_path_allowed=is_resolved_path_allowed,
        )
        if not asset_res.ok:
            row_rejected = (
                asset_res.meta.get("rejected_ids")
                if isinstance(asset_res.meta, dict)
                else None
            )
            if not row_rejected:
                # Rows without an idable rejection (e.g. DB_ERROR) cannot be aggregated.
                return _result_err(asset_res, "INVALID_INPUT", "Failed to validate asset for deletion")
            if first_failure is None:
                first_failure = asset_res
            rejected_ids.extend(int(value) for value in row_rejected)
            continue
        validated_assets.append(asset_res.data or {})
    if first_failure is not None:
        first_err = _result_err(first_failure, "INVALID_INPUT", "Failed to validate asset for deletion")
        return Result.Err(str(first_err.code), str(first_err.error), rejected_ids=sorted(rejected_ids))
    validated_assets.sort(key=lambda item: item["id"])
    return Result.Ok(validated_assets)


def _delete_physical_files(
    validated_assets: list[dict[str, Any]],
    *,
    delete_file_safe: Callable[[Path], Result[Any]],
    safe_error_message: Callable[[Exception, str], str],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    file_deletion_errors: list[dict[str, Any]] = []
    assets_ready_for_db_delete: list[dict[str, Any]] = []
    for asset_info in validated_assets:
        resolved = asset_info["resolved"]
        if resolved and resolved.exists() and resolved.is_file():
            try:
                del_res = delete_file_safe(resolved)
            except Exception as exc:
                file_deletion_errors.append(
                    {
                        "asset_id": asset_info["id"],
                        "error": safe_error_message(exc, "File deletion failed"),
                    }
                )
                continue
            if not del_res.ok:
                file_deletion_errors.append(
                    {"asset_id": asset_info["id"], "error": str(del_res.error or "delete failed")}
                )
                continue
        assets_ready_for_db_delete.append(asset_info)
    return assets_ready_for_db_delete, file_deletion_errors


def _chunk_values(values: list[Any], size: int) -> list[list[Any]]:
    return [values[i:i + size] for i in range(0, len(values), size)] if size > 0 else [values]


async def _delete_where_in(services: dict[str, Any], column: str, table: str, values: list[Any]) -> Result[Any]:
    allowed = {
        "assets": frozenset({"id", "filepath"}),
        "scan_journal": frozenset({"id", "filepath"}),
        "metadata_cache": frozenset({"id", "filepath"}),
    }
    if table not in allowed or column not in allowed[table]:
        return Result.Err("INVALID_INPUT", f"Disallowed delete target: {table!r}.{column!r}")
    if not values:
        return Result.Ok(True)

    for chunk in _chunk_values(values, 900):
        placeholders = ",".join(["?"] * len(chunk))
        query = f"DELETE FROM {table} WHERE {column} IN ({placeholders})"
        delete_res = await services["db"].aexecute(query, tuple(chunk))
        if not delete_res.ok:
            return Result.Err("DB_ERROR", str(delete_res.error or f"Failed deleting from {table}"))
    return Result.Ok(True)


async def _delete_assets_batch(services: dict[str, Any], selected_assets: list[dict[str, Any]]) -> Result[dict[str, Any]]:
    if not selected_assets:
        return Result.Ok({"deleted_ids": [], "db_errors": [], "deleted": 0})

    unique_ids = sorted({int(asset_info["id"]) for asset_info in selected_assets})
    unique_paths = sorted({str(asset_info["filepath"]) for asset_info in selected_assets if asset_info.get("filepath")})

    async with services["db"].atransaction(mode="immediate"):
        assets_del = await _delete_where_in(services, "id", "assets", unique_ids)
        if not assets_del.ok:
            raise RuntimeError(str(assets_del.error or "assets batch delete failed"))
        sj_del = await _delete_where_in(services, "filepath", "scan_journal", unique_paths)
        if not sj_del.ok:
            raise RuntimeError(str(sj_del.error or "scan_journal batch delete failed"))
        mc_del = await _delete_where_in(services, "filepath", "metadata_cache", unique_paths)
        if not mc_del.ok:
            raise RuntimeError(str(mc_del.error or "metadata_cache batch delete failed"))

    return Result.Ok({"deleted_ids": unique_ids, "db_errors": [], "deleted": len(unique_ids)})


async def _delete_assets_fallback(
    services: dict[str, Any],
    selected_assets: list[dict[str, Any]],
    *,
    safe_error_message: Callable[[Exception, str], str],
) -> Result[dict[str, Any]]:
    deleted_ids: list[int] = []
    db_errors: list[dict[str, Any]] = []
    for asset_info in selected_assets:
        asset_id = int(asset_info["id"])
        filepath = str(asset_info["filepath"])
        try:
            del_res = await services["db"].aexecute("DELETE FROM assets WHERE id = ?", (asset_id,))
            if not del_res.ok:
                db_errors.append({"asset_id": asset_id, "error": str(del_res.error or "DB delete failed")})
                continue
            await services["db"].aexecute("DELETE FROM scan_journal WHERE filepath = ?", (filepath,))
            await services["db"].aexecute("DELETE FROM metadata_cache WHERE filepath = ?", (filepath,))
            deleted_ids.append(asset_id)
        except Exception as exc:
            db_errors.append({"asset_id": asset_id, "error": safe_error_message(exc, "DB delete failed")})
    return Result.Ok({"deleted_ids": deleted_ids, "db_errors": db_errors, "deleted": len(deleted_ids)})


async def _delete_asset_records(
    services: dict[str, Any],
    selected_assets: list[dict[str, Any]],
    *,
    safe_error_message: Callable[[Exception, str], str],
    logger: Any = None,
) -> Result[dict[str, Any]]:
    try:
        return await _delete_assets_batch(services, selected_assets)
    except Exception as exc:
        if logger:
            logger.warning("Batch delete failed, falling back to per-asset deletion: %s", exc)
    return await _delete_assets_fallback(services, selected_assets, safe_error_message=safe_error_message)


def _partial_delete_result(
    *,
    deleted_ids: list[int],
    file_deletion_errors: list[dict[str, Any]],
    db_errors: list[dict[str, Any]],
    attempted: int,
) -> Result[dict[str, Any]]:
    failed_ids = [
        asset_id
        for item in file_deletion_errors
        if isinstance(item, dict)
        for asset_id in [_coerce_asset_id(item.get("asset_id"))]
        if asset_id is not None
    ]
    failed_ids += [
        asset_id
        for item in db_errors
        if isinstance(item, dict)
        for asset_id in [_coerce_asset_id(item.get("asset_id"))]
        if asset_id is not None
    ]
    unique_failed_ids = sorted(set(failed_ids))
    return Result.Ok(
        {
            "deleted": len(deleted_ids),
            "deleted_ids": deleted_ids,
            "failed_ids": unique_failed_ids,
        },
        partial=True,
        errors=[*file_deletion_errors, *db_errors],
        attempted=attempted,
        deleted=len(deleted_ids),
        failed=len(unique_failed_ids),
    )


async def _audit_delete_result(
    request: web.Request,
    *,
    services: dict[str, Any],
    asset_ids: list[int],
    result: Result[Any],
    audit_asset_write: Callable[..., Awaitable[None]],
    attempted: int,
    deleted: int | None = None,
    failed: int | None = None,
) -> None:
    kwargs: dict[str, Any] = {"attempted": attempted}
    if deleted is not None:
        kwargs["deleted"] = deleted
    if failed is not None:
        kwargs["failed"] = failed
    await audit_asset_write(
        request,
        services,
        "assets_delete",
        _delete_audit_target(asset_ids),
        result,
        **kwargs,
    )


async def handle_delete_assets(
    request: web.Request,
    *,
    prepare_asset_ids_context: PrepareAssetIdsContext,
    normalize_path: Callable[[str], Path | None],
    is_path_allowed: Callable[[Path], bool],
    is_path_allowed_custom: Callable[[Path], bool],
    is_resolved_path_allowed: Callable[[Path], bool],
    delete_file_safe: Callable[[Path], Result[Any]],
    audit_asset_write: Callable[..., Awaitable[None]],
    json_response: Callable[[Any], web.Response],
    require_services: Callable[[], Awaitable[tuple[dict[str, Any], Result[Any] | None]]],
    resolve_security_prefs: Callable[[Mapping[str, Any] | None], Awaitable[Mapping[str, Any] | None]],
    require_operation_enabled: Callable[..., Result[Any]],
    require_write_access: Callable[[web.Request], Result[Any]],
    check_rate_limit: Callable[..., tuple[bool, int | None]],
    read_json: Callable[[web.Request], Awaitable[Any]],
    csrf_error: Callable[[web.Request], str | None],
    safe_error_message: Callable[[Exception, str], str] = _safe_error_message,
    logger: Any = None,
) -> web.Response:
    ids_ctx_res = await prepare_asset_ids_context(
        request,
        operation="assets_delete",
        rate_limit_endpoint="assets_delete",
        max_requests=10,
        window_seconds=60,
        require_services=require_services,
        resolve_security_prefs=resolve_security_prefs,
        require_operation_enabled=require_operation_enabled,
        require_write_access=require_write_access,
        check_rate_limit=check_rate_limit,
        read_json=read_json,
        csrf_error=csrf_error,
    )
    if not ids_ctx_res.ok:
        return json_response(ids_ctx_res)
    ids_ctx = ids_ctx_res.data
    svc = ids_ctx.services if ids_ctx else {}
    validated_ids = ids_ctx.asset_ids if ids_ctx else []

    found_assets_res = await _load_found_assets(svc, validated_ids, safe_error_message=safe_error_message)
    if not found_assets_res.ok:
        return json_response(found_assets_res)

    validated_assets_res = _validate_assets_for_deletion(
        found_assets_res.data or [],
        normalize_path=normalize_path,
        is_path_allowed=is_path_allowed,
        is_path_allowed_custom=is_path_allowed_custom,
        is_resolved_path_allowed=is_resolved_path_allowed,
    )
    if not validated_assets_res.ok:
        return json_response(validated_assets_res)
    validated_assets = validated_assets_res.data or []

    assets_ready_for_db_delete, file_deletion_errors = _delete_physical_files(
        validated_assets,
        delete_file_safe=delete_file_safe,
        safe_error_message=safe_error_message,
    )

    try:
        db_res = await _delete_asset_records(
            svc,
            assets_ready_for_db_delete,
            safe_error_message=safe_error_message,
            logger=logger,
        )
        if not db_res.ok:
            return json_response(db_res)

        payload = db_res.data or {}
        deleted_ids = [int(item) for item in (payload.get("deleted_ids") or [])]
        db_errors = payload.get("db_errors") or []

        if file_deletion_errors or db_errors:
            result = _partial_delete_result(
                deleted_ids=deleted_ids,
                file_deletion_errors=file_deletion_errors,
                db_errors=db_errors,
                attempted=len(validated_assets),
            )
            await _audit_delete_result(
                request,
                services=svc,
                asset_ids=validated_ids,
                result=result,
                audit_asset_write=audit_asset_write,
                attempted=len(validated_assets),
                deleted=len(deleted_ids),
                failed=int(result.meta.get("failed") or 0) if hasattr(result, "meta") else None,
            )
            return json_response(result)

        result = Result.Ok({"deleted": len(deleted_ids), "deleted_ids": deleted_ids})
        await _audit_delete_result(
            request,
            services=svc,
            asset_ids=validated_ids,
            result=result,
            audit_asset_write=audit_asset_write,
            attempted=len(validated_assets),
            deleted=len(deleted_ids),
            failed=0,
        )
        return json_response(result)
    except Exception as exc:
        if logger:
            logger.error("Database deletion failed: %s", exc)
        result = Result.Err("DB_ERROR", safe_error_message(exc, "Failed to delete asset records"))
        await _audit_delete_result(
            request,
            services=svc,
            asset_ids=validated_ids,
            result=result,
            audit_asset_write=audit_asset_write,
            attempted=len(validated_assets),
        )
        return json_response(result)
