"""Resolved delete/rename targets for asset route operations."""

from __future__ import annotations

from collections.abc import Awaitable, Callable, Mapping
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from ...shared import Result
from .models import AssetDeleteTarget, AssetPathContext, AssetRenameContext, AssetRenameTarget


@dataclass(slots=True)
class _RenameState:
    current_filepath: str
    current_filename: str
    current_source: str
    current_root_id: str


def _result_error(result: Result[Any], default_code: str, default_error: str) -> Result[Any]:
    return Result.Err(result.code or default_code, result.error or default_error)


def _rename_state_from_row(row: Mapping[str, Any] | None) -> _RenameState:
    row_dict = row if isinstance(row, Mapping) else {}
    return _RenameState(
        current_filepath=str(row_dict.get("filepath") or ""),
        current_filename=str(row_dict.get("filename") or ""),
        current_source=str(row_dict.get("source") or "").strip().lower(),
        current_root_id=str(row_dict.get("root_id") or "").strip(),
    )


def _rename_lookup_details(
    lookup_row: dict[str, Any] | None,
    *,
    current_filename: str,
    current_source: str,
    current_root_id: str,
) -> tuple[int | None, str, str, str]:
    lookup_dict = lookup_row if isinstance(lookup_row, dict) else {}
    matched_asset_id: int | None = None
    try:
        raw_id = lookup_dict.get("id")
        if raw_id is not None:
            matched_asset_id = int(raw_id)
    except Exception:
        matched_asset_id = None
    if not current_filename:
        current_filename = str(lookup_dict.get("filename") or current_filename)
    if not current_source:
        current_source = str(lookup_dict.get("source") or "").strip().lower()
    if not current_root_id:
        current_root_id = str(lookup_dict.get("root_id") or "").strip()
    return matched_asset_id, current_filename, current_source, current_root_id


async def resolve_delete_target(
    *,
    context: AssetPathContext,
    find_asset_row_by_filepath: Callable[[Any, str], Awaitable[dict[str, Any] | None]],
    filepath_db_keys: Callable[[str], tuple[str, ...]],
    filepath_where_clause: Callable[[tuple[str, ...], str], tuple[str, tuple[Any, ...]]],
    is_resolved_path_allowed: Callable[[Path], bool],
) -> Result[AssetDeleteTarget]:
    try:
        resolved = context.candidate_path.resolve(strict=True)
    except Exception:
        return Result.Err("NOT_FOUND", "File does not exist")
    if not is_resolved_path_allowed(resolved):
        return Result.Err("FORBIDDEN", "Path is not within allowed roots")

    matched_asset_id = context.asset_id
    resolved_str = str(resolved)
    filepath_keys = filepath_db_keys(resolved_str)
    filepath_where, filepath_params = filepath_where_clause(filepath_keys, "filepath")

    if matched_asset_id is None:
        try:
            asset_row = await find_asset_row_by_filepath(context.services["db"], resolved_str)
        except Exception as exc:
            if isinstance(exc, TimeoutError):
                return Result.Err("TIMEOUT", "Asset lookup timed out")
            return Result.Err("DB_ERROR", f"Failed to resolve asset id: {exc}")
        try:
            raw_id = asset_row.get("id") if isinstance(asset_row, dict) else None
            if raw_id is not None:
                matched_asset_id = int(raw_id)
        except Exception:
            matched_asset_id = None

    return Result.Ok(
        AssetDeleteTarget(
            services=context.services,
            matched_asset_id=matched_asset_id,
            resolved_path=resolved,
            filepath_where=filepath_where,
            filepath_params=filepath_params,
        )
    )


async def _load_initial_rename_state(
    *,
    context: AssetRenameContext,
    resolve_body_filepath: Callable[[dict[str, Any] | None], Path | None],
    load_asset_row_by_id: Callable[[dict[str, Any], int], Awaitable[Result[dict[str, Any]]]],
) -> Result[_RenameState]:
    if context.asset_id is not None:
        row_res = await load_asset_row_by_id(context.services, context.asset_id)
        if not row_res.ok:
            return _result_error(row_res, "NOT_FOUND", "Asset not found")
        return Result.Ok(_rename_state_from_row(row_res.data))

    fp = resolve_body_filepath(context.body)
    current_filepath = str(fp) if fp else ""
    current_filename = Path(current_filepath).name if current_filepath else ""
    return Result.Ok(
        _RenameState(
            current_filepath=current_filepath,
            current_filename=current_filename,
            current_source="",
            current_root_id="",
        )
    )


async def _resolve_rename_lookup_overrides(
    *,
    context: AssetRenameContext,
    current_resolved_str: str,
    current_filename: str,
    current_source: str,
    current_root_id: str,
    matched_asset_id: int | None,
    find_asset_row_by_filepath: Callable[[Any, str], Awaitable[dict[str, Any] | None]],
) -> Result[tuple[int | None, str, str, str]]:
    if matched_asset_id is not None:
        return Result.Ok((matched_asset_id, current_filename, current_source, current_root_id))
    try:
        lookup_row = await find_asset_row_by_filepath(context.services["db"], current_resolved_str)
    except Exception as exc:
        if isinstance(exc, TimeoutError):
            return Result.Err("TIMEOUT", "Asset lookup timed out")
        return Result.Err("DB_ERROR", f"Failed to resolve asset id: {exc}")

    return Result.Ok(
        _rename_lookup_details(
            lookup_row,
            current_filename=current_filename,
            current_source=current_source,
            current_root_id=current_root_id,
        )
    )


def _resolve_existing_rename_path(
    current_filepath: str,
    *,
    normalize_path: Callable[[str], Path | None],
    is_resolved_path_allowed: Callable[[Path], bool],
) -> Result[Path]:
    current_path = normalize_path(current_filepath)
    if not current_path:
        return Result.Err("INVALID_INPUT", "Invalid current asset path")

    try:
        current_resolved = current_path.resolve(strict=True)
    except Exception:
        return Result.Err("NOT_FOUND", "Current file does not exist")
    if not is_resolved_path_allowed(current_resolved):
        return Result.Err("FORBIDDEN", "Path is not within allowed roots")
    if not current_resolved.exists() or not current_resolved.is_file():
        return Result.Err("NOT_FOUND", "Current file does not exist")
    return Result.Ok(current_resolved)


async def resolve_rename_target(
    *,
    context: AssetRenameContext,
    normalize_path: Callable[[str], Path | None],
    resolve_body_filepath: Callable[[dict[str, Any] | None], Path | None],
    load_asset_row_by_id: Callable[[dict[str, Any], int], Awaitable[Result[dict[str, Any]]]],
    find_asset_row_by_filepath: Callable[[Any, str], Awaitable[dict[str, Any] | None]],
    filepath_db_keys: Callable[[str], tuple[str, ...]],
    filepath_where_clause: Callable[[tuple[str, ...], str], tuple[str, tuple[Any, ...]]],
    is_resolved_path_allowed: Callable[[Path], bool],
) -> Result[AssetRenameTarget]:
    state_res = await _load_initial_rename_state(
        context=context,
        resolve_body_filepath=resolve_body_filepath,
        load_asset_row_by_id=load_asset_row_by_id,
    )
    if not state_res.ok:
        return _result_error(state_res, "NOT_FOUND", "Asset not found")
    state = state_res.data or _RenameState("", "", "", "")
    current_filepath = state.current_filepath
    current_filename = state.current_filename
    current_source = state.current_source
    current_root_id = state.current_root_id
    if not current_filepath:
        return Result.Err("INVALID_INPUT", "Missing filepath or asset_id")

    current_resolved_res = _resolve_existing_rename_path(
        current_filepath,
        normalize_path=normalize_path,
        is_resolved_path_allowed=is_resolved_path_allowed,
    )
    if not current_resolved_res.ok:
        return _result_error(current_resolved_res, "NOT_FOUND", "Current file does not exist")
    current_resolved = current_resolved_res.data
    if current_resolved is None:
        return Result.Err("NOT_FOUND", "Current file does not exist")

    current_resolved_str = str(current_resolved)
    filepath_keys = filepath_db_keys(current_resolved_str)
    filepath_where, filepath_params = filepath_where_clause(filepath_keys, "filepath")
    lookup_res = await _resolve_rename_lookup_overrides(
        context=context,
        current_resolved_str=current_resolved_str,
        current_filename=current_filename,
        current_source=current_source,
        current_root_id=current_root_id,
        matched_asset_id=context.asset_id,
        find_asset_row_by_filepath=find_asset_row_by_filepath,
    )
    if not lookup_res.ok:
        return _result_error(lookup_res, "DB_ERROR", "Failed to resolve asset id")
    matched_asset_id, current_filename, current_source, current_root_id = lookup_res.data or (
        context.asset_id,
        current_filename,
        current_source,
        current_root_id,
    )

    return Result.Ok(
        AssetRenameTarget(
            services=context.services,
            matched_asset_id=matched_asset_id,
            current_resolved=current_resolved,
            current_filename=current_filename,
            current_source=current_source,
            current_root_id=current_root_id,
            filepath_where=filepath_where,
            filepath_params=filepath_params,
            new_name=context.new_name,
        )
    )


__all__ = [
    "resolve_delete_target",
    "resolve_rename_target",
]