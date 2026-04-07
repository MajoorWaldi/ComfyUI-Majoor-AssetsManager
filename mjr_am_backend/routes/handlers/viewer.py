"""
Viewer helper endpoints.

These endpoints provide lightweight media info for the frontend viewer without
requiring the full metadata payload.
"""

from __future__ import annotations

import os
from pathlib import Path
from urllib.parse import unquote

from aiohttp import web
from mjr_am_backend.config import get_runtime_output_root
from mjr_am_backend.custom_roots import list_custom_roots, resolve_custom_root
from mjr_am_backend.features.viewer.info import build_viewer_media_info
from mjr_am_backend.shared import Result, get_logger

from ..core import (
    _guess_content_type_for_file,
    _is_path_allowed,
    _is_path_allowed_custom,
    _is_within_root,
    _json_response,
    _normalize_path,
    _require_services,
    _safe_rel_path,
    safe_error_message,
)

logger = get_logger(__name__)

try:
    import folder_paths  # type: ignore
except Exception:
    class _FolderPathsStub:
        @staticmethod
        def get_input_directory() -> str:
            return str((Path(__file__).resolve().parents[3] / "input").resolve())

    folder_paths = _FolderPathsStub()  # type: ignore


def _runtime_output_root() -> Path | None:
    try:
        return Path(get_runtime_output_root()).resolve(strict=False)
    except Exception:
        return None


def _input_root() -> Path | None:
    try:
        return Path(folder_paths.get_input_directory()).resolve(strict=False)
    except Exception:
        return None


def _custom_view_roots() -> list[Path]:
    roots: list[Path] = []
    try:
        custom_res = list_custom_roots()
        if custom_res.ok:
            for item in custom_res.data or []:
                if not isinstance(item, dict):
                    continue
                raw_path = str(item.get("path") or "").strip()
                if not raw_path:
                    continue
                try:
                    roots.append(Path(raw_path).resolve(strict=False))
                except Exception:
                    continue
    except Exception:
        pass
    return roots


def _iter_view_allowed_roots() -> list[Path]:
    roots: list[Path] = []
    runtime_root = _runtime_output_root()
    if runtime_root is not None:
        roots.append(runtime_root)
    input_root = _input_root()
    if input_root is not None:
        roots.append(input_root)
    roots.extend(_custom_view_roots())
    return roots


def _find_best_view_root(path: Path) -> Path | None:
    try:
        resolved = path.resolve(strict=False)
    except Exception:
        resolved = path
    matches: list[Path] = []
    for root in _iter_view_allowed_roots():
        try:
            if _is_within_root(resolved, root):
                matches.append(root)
        except Exception:
            continue
    if not matches:
        return None
    matches.sort(key=lambda item: len(str(item)))
    return matches[-1]


def _normalize_viewer_resource_relpath(value: str) -> Path | None:
    raw = str(value or "").strip()
    # Decode percent-encoded characters (e.g. %00, %2F) before validation
    # to prevent bypass via double-encoding like %2500 → %00
    decoded = unquote(raw)
    # Reject empty values and paths containing NUL bytes outright
    if not decoded or "\x00" in decoded:
        return None
    # Normalize directory separators to a POSIX-style form for consistent handling
    text = decoded.replace("\\", "/")
    # Disallow absolute paths
    if text.startswith("/"):
        return None
    # Disallow Windows-style drive-prefixed paths (e.g. C:\, D:/)
    drive, _tail = os.path.splitdrive(text)
    if drive:
        return None
    # Rebuild a normalized relative path from components. Preserve ".." segments:
    # GLTF resources can legitimately live in sibling directories, and the final
    # resolved path is still checked against the allowed root before serving.
    parts = [p for p in text.split("/") if p not in ("", ".")]
    safe_rel = "/".join(parts)
    if not safe_rel:
        return None
    return Path(safe_rel)


async def _resolve_asset_from_id(asset_id: int) -> tuple[dict | None, Result | None]:
    svc, error_result = await _require_services()
    if error_result:
        return None, error_result
    if not isinstance(svc, dict):
        return None, Result.Err("SERVICE_UNAVAILABLE", "Index service unavailable")
    try:
        asset_res = await svc["index"].get_asset(asset_id)
    except Exception as exc:
        return None, Result.Err("QUERY_FAILED", safe_error_message(exc, "Failed to load asset"))
    if not asset_res.ok:
        return None, Result.Err(asset_res.code, asset_res.error or "Failed to load asset")
    asset = asset_res.data
    if not isinstance(asset, dict) or not asset:
        return None, Result.Err("NOT_FOUND", "Asset not found")
    return asset, None


def _strict_resolve(candidate: Path, fail_context: str) -> tuple[Path | None, Result | None]:
    """Resolve *candidate* to a real existing file path, returning (resolved, None) or (None, error)."""
    try:
        resolved = candidate.resolve(strict=True)
    except FileNotFoundError:
        return None, Result.Err("NOT_FOUND", "File not found")
    except Exception:
        return None, Result.Err("VIEW_FAILED", f"Failed to resolve {fail_context}")
    if not resolved.is_file():
        return None, Result.Err("NOT_FOUND", "File not found or not a regular file")
    return resolved, None


def _parse_positive_int(raw_value: str, *, error_code: str, error_message: str) -> Result[int]:
    try:
        value = int(raw_value)
    except Exception:
        return Result.Err(error_code, error_message)
    if value <= 0:
        return Result.Err(error_code, error_message)
    return Result.Ok(value)


def _resolve_allowed_viewer_candidate(raw_path: str) -> tuple[Path | None, Result | None]:
    candidate = _normalize_path(raw_path)
    if not candidate:
        return None, Result.Err("INVALID_INPUT", "Invalid asset path")
    if not (_is_path_allowed(candidate) or _is_path_allowed_custom(candidate)):
        return None, Result.Err("FORBIDDEN", "Path is not within allowed roots")
    return candidate, None


def _resolve_viewer_filename_candidate(base_root: Path, rel: Path, filename: str) -> tuple[Path | None, Result | None]:
    candidate = base_root / rel / filename
    if not _is_within_root(candidate, base_root):
        return None, Result.Err("FORBIDDEN", "Path access denied (outside allowed scope)")

    resolved, err = _strict_resolve(candidate, "viewer path")
    if err:
        return None, err
    if resolved is None:
        return None, Result.Err("VIEW_FAILED", "Failed to resolve viewer path")
    if not _is_within_root(resolved, base_root):
        return None, Result.Err("FORBIDDEN", "Path access denied (outside allowed scope)")
    return resolved, None


def _default_view_root(path: Path | None) -> Path | None:
    if path is None:
        return None
    return _find_best_view_root(path) or path.parent


def _resolve_viewer_asset_path(raw_path: str) -> tuple[Path | None, Path | None, Result | None]:
    candidate, candidate_error = _resolve_allowed_viewer_candidate(raw_path)
    if candidate_error:
        return None, None, candidate_error
    if candidate is None:
        return None, None, Result.Err("VIEW_FAILED", "Failed to resolve viewer candidate")

    resolved, err = _strict_resolve(candidate, "asset path")
    if err:
        return None, None, err
    if resolved is None:
        return None, None, Result.Err("VIEW_FAILED", "Failed to resolve asset path")
    return resolved, _default_view_root(resolved), None


async def _resolve_viewer_asset_context(
    raw_id: str,
) -> tuple[dict | None, Path | None, Path | None, Result | None]:
    asset_id_res = _parse_positive_int(raw_id, error_code="INVALID_INPUT", error_message="Invalid asset_id")
    if not asset_id_res.ok:
        return None, None, None, asset_id_res

    asset, error = await _resolve_asset_from_id(asset_id_res.data or 0)
    if error:
        return None, None, None, error
    if asset is None:
        return None, None, None, Result.Err("NOT_FOUND", "Asset not found")

    raw_path = asset.get("filepath")
    if not raw_path or not isinstance(raw_path, str):
        return None, None, None, Result.Err("NOT_FOUND", "Asset path not available")

    resolved, root_limit, error = _resolve_viewer_asset_path(raw_path)
    if error:
        return asset, None, None, error
    return asset, resolved, root_limit, None


async def _resolve_by_asset_id(
    raw_id: str,
) -> tuple[dict | None, Path | None, Path | None, Result | None]:
    """Resolve viewer context from an asset_id query parameter."""
    return await _resolve_viewer_asset_context(raw_id)


async def _resolve_by_filepath(
    filepath: str,
) -> tuple[dict | None, Path | None, Path | None, Result | None]:
    """Resolve viewer context from a raw filepath query parameter."""
    candidate = _normalize_path(filepath)
    if not candidate:
        return None, None, None, Result.Err("INVALID_INPUT", "Invalid filepath")
    if not (_is_path_allowed(candidate, must_exist=True) or _is_path_allowed_custom(candidate)):
        return None, None, None, Result.Err("FORBIDDEN", "Path is not within allowed roots")

    resolved, err = _strict_resolve(candidate, "file path")
    if err:
        return None, None, None, err
    if resolved is None:
        return None, None, None, Result.Err("VIEW_FAILED", "Failed to resolve file path")
    return None, resolved, _default_view_root(resolved), None


def _resolve_base_root(root_id: str, asset_type: str) -> tuple[Path | None, Result | None]:
    """Resolve the base directory root for filename-based lookups."""
    if root_id:
        root_result = resolve_custom_root(root_id)
        if not root_result.ok:
            return None, root_result
        if root_result.data is None:
            return None, Result.Err("INVALID_INPUT", "Custom root not found")
        return Path(root_result.data).resolve(strict=False), None

    if asset_type == "input":
        try:
            return Path(folder_paths.get_input_directory()).resolve(strict=False), None
        except Exception:
            return None, Result.Err("VIEW_FAILED", "Input directory is unavailable")

    try:
        return Path(get_runtime_output_root()).resolve(strict=False), None
    except Exception:
        return None, Result.Err("VIEW_FAILED", "Output directory is unavailable")


def _parse_viewer_filename_context(
    request: web.Request,
) -> tuple[str, str, Path | None, str | None, Result | None]:
    root_id = str(request.query.get("root_id", "") or "").strip()
    filename = str(request.query.get("filename", "") or "").strip()
    subfolder = str(request.query.get("subfolder", "") or "").strip()
    asset_type = str(request.query.get("type", "output") or "output").strip().lower()

    if not filename:
        return root_id, filename, None, asset_type, Result.Err("INVALID_INPUT", "Missing viewer file context")
    if Path(filename).name != filename:
        return root_id, filename, None, asset_type, Result.Err("INVALID_INPUT", "Invalid filename")

    rel = _safe_rel_path(subfolder)
    if rel is None:
        return root_id, filename, None, asset_type, Result.Err("INVALID_INPUT", "Invalid subfolder")
    return root_id, filename, rel, asset_type, None


async def _resolve_by_filename(
    request: web.Request,
) -> tuple[dict | None, Path | None, Path | None, Result | None]:
    """Resolve viewer context from filename + subfolder + type query parameters."""
    root_id, filename, rel, asset_type, error = _parse_viewer_filename_context(request)
    if error:
        return None, None, None, error

    asset_type_value = asset_type or "output"
    base_root, err = _resolve_base_root(root_id, asset_type_value)
    if err:
        return None, None, None, err
    if base_root is None:
        return None, None, None, Result.Err("VIEW_FAILED", "Root not available")

    resolved, err = _resolve_viewer_filename_candidate(base_root, rel or Path(), filename)
    if err:
        return None, None, None, err
    return None, resolved, base_root, None


async def _resolve_viewer_file_context(
    request: web.Request,
) -> tuple[dict | None, Path | None, Path | None, Result | None]:
    """Dispatch viewer file resolution to the appropriate strategy based on query params."""
    raw_id = str(request.query.get("asset_id", "")).strip()
    if raw_id:
        return await _resolve_by_asset_id(raw_id)

    filepath = str(request.query.get("filepath", "")).strip()
    if filepath:
        return await _resolve_by_filepath(filepath)

    return await _resolve_by_filename(request)


def register_viewer_routes(routes: web.RouteTableDef) -> None:
    """Register viewer info and file-serving routes."""

    @routes.get("/mjr/am/viewer/info")
    async def viewer_info(request: web.Request):
        """
        Get compact viewer-oriented media info by asset id.

        Query params:
          asset_id: int
        """
        try:
            raw_id = str(request.query.get("asset_id", "")).strip()
        except Exception:
            raw_id = ""
        if not raw_id:
            return _json_response(Result.Err("INVALID_INPUT", "Missing asset_id"))
        asset, resolved, _root_limit, error = await _resolve_viewer_file_context(request)
        if error:
            return _json_response(error)
        if not isinstance(asset, dict) or not asset:
            return _json_response(Result.Err("NOT_FOUND", "Asset not found"))

        refresh = (request.query.get("refresh") or "").strip().lower() in ("1", "true", "yes")

        info = build_viewer_media_info(asset, resolved_path=resolved, refresh=refresh)
        try:
            if resolved is not None:
                info["mime"] = _guess_content_type_for_file(resolved)
        except Exception:
            info["mime"] = None
        info["resource_endpoint"] = "/mjr/am/viewer/resource"

        return _json_response(Result.Ok(info))

    @routes.get("/mjr/am/viewer/resource")
    async def viewer_resource(request: web.Request):
        relpath = _normalize_viewer_resource_relpath(request.query.get("relpath", ""))
        if relpath is None:
            return _json_response(Result.Err("FORBIDDEN", "Path access denied (escape attempt or invalid relpath)"))

        _asset, resolved_base, root_limit, error = await _resolve_viewer_file_context(request)
        if error:
            return _json_response(error)
        if resolved_base is None:
            return _json_response(Result.Err("NOT_FOUND", "Base file not found"))
        if root_limit is None:
            root_limit = resolved_base.parent

        try:
            target = (resolved_base.parent / relpath).resolve(strict=False)
        except Exception:
            return _json_response(Result.Err("VIEW_FAILED", "Failed to resolve resource path"))

        if not _is_within_root(target, root_limit):
            return _json_response(Result.Err("FORBIDDEN", "Path access denied (outside allowed scope)"))
        if not target.is_file():
            return _json_response(Result.Err("NOT_FOUND", "Resource not found"))

        content_type = _guess_content_type_for_file(target)
        resp = web.FileResponse(path=str(target))
        try:
            resp.headers["Content-Type"] = content_type
            # Static linked resources (textures, .bin chunks) are immutable for a given
            # viewer session — allow short-lived caching to speed up repeated views.
            resp.headers["Cache-Control"] = "public, max-age=3600, stale-while-revalidate=60"
            resp.headers["X-Content-Type-Options"] = "nosniff"
        except Exception:
            pass
        return resp
