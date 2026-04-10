"""Lookup helpers for asset route preparation."""

from __future__ import annotations

import asyncio
from collections.abc import Callable
from pathlib import Path
from typing import Any

from ..index.scan_batch_utils import normalize_filepath_str
from ...shared import Result

try:
    import folder_paths  # type: ignore
except Exception:  # pragma: no cover

    class _FolderPathsStub:
        @staticmethod
        def get_input_directory() -> str:
            return str((Path(__file__).resolve().parents[3] / "input").resolve())

    folder_paths = _FolderPathsStub()  # type: ignore


async def load_asset_filepath_by_id(services: dict[str, Any], asset_id: int) -> Result[str]:
    """Load the filepath for an asset by its DB id."""
    from mjr_am_backend.shared import sanitize_error_message as _safe_error

    db = services.get("db") if isinstance(services, dict) else None
    if not db:
        return Result.Err("SERVICE_UNAVAILABLE", "Database service unavailable")
    try:
        res = await db.aquery("SELECT filepath FROM assets WHERE id = ?", (asset_id,))
        if not res.ok or not res.data:
            return Result.Err("NOT_FOUND", "Asset not found")
        raw_path = (res.data[0] or {}).get("filepath")
    except Exception as exc:
        return Result.Err("DB_ERROR", _safe_error(exc, "Failed to load asset"))
    if not raw_path or not isinstance(raw_path, str):
        return Result.Err("NOT_FOUND", "Asset path not available")
    return Result.Ok(raw_path)


async def load_asset_row_by_id(services: dict[str, Any], asset_id: int) -> Result[dict[str, Any]]:
    """Load filepath/filename/source/root_id for an asset by its DB id."""
    from mjr_am_backend.shared import sanitize_error_message as _safe_error

    db = services.get("db") if isinstance(services, dict) else None
    if not db:
        return Result.Err("SERVICE_UNAVAILABLE", "Database service unavailable")
    try:
        res = await db.aquery(
            "SELECT filepath, filename, source, root_id FROM assets WHERE id = ?",
            (asset_id,),
        )
        if not res.ok or not res.data:
            return Result.Err("NOT_FOUND", "Asset not found")
        row = res.data[0] or {}
    except Exception as exc:
        return Result.Err("DB_ERROR", _safe_error(exc, "Failed to load asset"))
    return Result.Ok(row if isinstance(row, dict) else {})


def filepath_db_keys(path_value: str | Path | None) -> tuple[str, ...]:
    raw = str(path_value or "").strip()
    if not raw:
        return tuple()
    keys: list[str] = []
    for candidate in (raw, normalize_filepath_str(raw)):
        value = str(candidate or "").strip()
        if value and value not in keys:
            keys.append(value)
    return tuple(keys)


def filepath_where_clause(
    keys: tuple[str, ...],
    column: str = "filepath",
) -> tuple[str, tuple[Any, ...]]:
    if not keys:
        return f"{column} = ''", tuple()
    placeholders = ",".join("?" * len(keys))
    where = f"{column} IN ({placeholders})"
    params: list[Any] = list(keys)
    where = f"{where} OR {column} = ? COLLATE NOCASE"
    params.append(keys[0])
    return where, tuple(params)


async def find_asset_row_by_filepath(
    db: Any,
    filepath: str,
    *,
    select_sql: str,
) -> dict[str, Any] | None:
    keys = filepath_db_keys(filepath)
    where_clause, where_params = filepath_where_clause(keys, column="filepath")
    res = await db.aquery(
        f"SELECT {select_sql} FROM assets WHERE {where_clause} ORDER BY id DESC LIMIT 1",
        where_params,
    )
    if not res.ok or not res.data:
        return None
    row = res.data[0] or {}
    return row if isinstance(row, dict) else None


async def find_asset_id_row_by_filepath(db: Any, filepath: str) -> dict[str, Any] | None:
    return await find_asset_row_by_filepath(db, filepath, select_sql="id")


async def find_rename_row_by_filepath(db: Any, filepath: str) -> dict[str, Any] | None:
    return await find_asset_row_by_filepath(
        db,
        filepath,
        select_sql="id, filename, source, root_id",
    )


def _custom_root_candidate(item: object) -> tuple[str, Path] | None:
    if not isinstance(item, dict):
        return None
    rid = str(item.get("id") or "").strip()
    root_path = str(item.get("path") or "").strip()
    if not rid or not root_path:
        return None
    try:
        return rid, Path(root_path).resolve(strict=False)
    except Exception:
        return None


def _match_custom_root_id_for_path(
    path: Path,
    *,
    is_within_root: Callable[[Path, Path], bool],
    list_custom_roots_fn: Callable[[], Result[Any]],
) -> str | None:
    roots_res = list_custom_roots_fn()
    if not roots_res.ok:
        return None
    for item in roots_res.data or []:
        candidate = _custom_root_candidate(item)
        if not candidate:
            continue
        rid, root_path = candidate
        if is_within_root(path, root_path):
            return rid
    return None


async def resolve_or_create_asset_id(
    *,
    services: dict[str, Any],
    filepath: str,
    file_type: str = "",
    root_id: str = "",
    normalize_path: Callable[[str], Path | None],
    is_within_root: Callable[[Path, Path], bool],
    get_runtime_output_root_fn: Callable[[], str],
    get_input_directory: Callable[[], str] | None = None,
    list_custom_roots_fn: Callable[[], Result[Any]],
    resolve_custom_root_fn: Callable[[str], Result[Any]],
    safe_error_message: Callable[[Exception, str], str],
    logger: Any,
    to_thread_timeout_s: int | float = 30,
) -> Result[int]:
    """Resolve an ``asset_id`` for a path, indexing on demand when needed."""
    if not filepath or not isinstance(filepath, str):
        return Result.Err("INVALID_INPUT", "Missing filepath")

    candidate = normalize_path(filepath)
    if not candidate:
        return Result.Err("INVALID_INPUT", "Invalid filepath")

    try:
        resolved = candidate.resolve(strict=True)
    except Exception:
        return Result.Err("NOT_FOUND", "File does not exist")

    source = str(file_type or "").strip().lower()
    base_dir: Path | None = None
    resolved_root_id: str | None = None

    if get_input_directory is None:
        get_input_directory = folder_paths.get_input_directory

    out_root = Path(get_runtime_output_root_fn()).resolve(strict=False)
    in_root = Path(get_input_directory()).resolve(strict=False)

    if source in ("output", "outputs", "") and is_within_root(resolved, out_root):
        source = "output"
        base_dir = out_root
    elif source in ("input", "inputs", "") and is_within_root(resolved, in_root):
        source = "input"
        base_dir = in_root
    else:
        roots_res = list_custom_roots_fn()
        if roots_res.ok:
            for item in roots_res.data or []:
                if not isinstance(item, dict):
                    continue
                rid = str(item.get("id") or "")
                if not rid:
                    continue
                root_result = resolve_custom_root_fn(rid)
                if not root_result.ok or not root_result.data:
                    continue
                try:
                    root_path = Path(str(root_result.data)).resolve(strict=False)
                except Exception:
                    continue
                if is_within_root(resolved, root_path):
                    base_dir = root_path
                    resolved_root_id = rid or None
                    source = "custom"
                    break

        if root_id:
            root_result = resolve_custom_root_fn(str(root_id))
            if root_result.ok:
                try:
                    candidate_root = Path(str(root_result.data)).resolve(strict=False)
                except Exception:
                    candidate_root = None
                if candidate_root and is_within_root(resolved, candidate_root):
                    base_dir = candidate_root
                    resolved_root_id = str(root_id)
                    source = "custom"

    if not base_dir:
        return Result.Err("FORBIDDEN", "Path is not within allowed roots")

    try:
        await asyncio.wait_for(
            services["index"].index_paths(
                [Path(resolved)],
                str(base_dir),
                True,
                source,
                (resolved_root_id or None),
            ),
            timeout=to_thread_timeout_s,
        )
    except asyncio.TimeoutError:
        logger.debug("Index-on-demand timed out for %s", filepath)
    except Exception as exc:
        logger.debug("Index-on-demand skipped for %s: %s", filepath, exc)

    try:
        row = await asyncio.wait_for(
            find_asset_row_by_filepath(
                services["db"],
                str(resolved),
                select_sql="id",
            ),
            timeout=to_thread_timeout_s,
        )
        if not row:
            return Result.Err("NOT_FOUND", "Asset not indexed")
        asset_id = row.get("id")
        if asset_id is None:
            return Result.Err("NOT_FOUND", "Asset id not available")
        return Result.Ok(int(asset_id))
    except asyncio.TimeoutError:
        return Result.Err("TIMEOUT", "Asset lookup timed out")
    except Exception as exc:
        return Result.Err(
            "DB_ERROR",
            safe_error_message(exc, "Failed to resolve asset id"),
        )


async def infer_source_and_root_id_from_path(
    path: Path,
    output_root: str,
    *,
    is_within_root: Callable[[Path, Path], bool],
    get_runtime_output_root_fn: Callable[[], str],
    get_input_directory: Callable[[], str] | None = None,
    list_custom_roots_fn: Callable[[], Result[Any]],
    logger: Any,
) -> tuple[str, str | None]:
    try:
        out_root = Path(output_root).resolve(strict=False)
    except Exception:
        out_root = Path(get_runtime_output_root_fn()).resolve(strict=False)
    if get_input_directory is None:
        get_input_directory = folder_paths.get_input_directory
    try:
        in_root = Path(get_input_directory()).resolve(strict=False)
    except Exception:
        in_root = (Path(__file__).resolve().parents[3] / "input").resolve(strict=False)

    if is_within_root(path, out_root):
        return "output", None
    if is_within_root(path, in_root):
        return "input", None

    custom_root_id = _match_custom_root_id_for_path(
        path,
        is_within_root=is_within_root,
        list_custom_roots_fn=list_custom_roots_fn,
    )
    if custom_root_id:
        return "custom", custom_root_id

    logger.warning(
        "Post-rename: could not classify %s under any known root; defaulting to 'output'",
        path,
    )
    return "output", None


__all__ = [
    "filepath_db_keys",
    "filepath_where_clause",
    "find_asset_id_row_by_filepath",
    "find_asset_row_by_filepath",
    "find_rename_row_by_filepath",
    "folder_paths",
    "infer_source_and_root_id_from_path",
    "load_asset_filepath_by_id",
    "load_asset_row_by_id",
    "resolve_or_create_asset_id",
]