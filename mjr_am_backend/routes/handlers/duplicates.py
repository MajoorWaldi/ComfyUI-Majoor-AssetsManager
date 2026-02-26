"""
Duplicate and similarity detection endpoints.
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

from mjr_am_backend.config import get_runtime_output_root
from mjr_am_backend.custom_roots import resolve_custom_root
from mjr_am_backend.shared import Result

from ..core import (
    _csrf_error,
    _json_response,
    _read_json,
    _require_services,
    _require_write_access,
    safe_error_message,
)
from .db_maintenance import is_db_maintenance_active


def _roots_for_scope(scope: str, custom_root_id: str = "") -> Result[list[str]]:
    s = str(scope or "output").strip().lower()
    if s in ("output", "outputs"):
        return Result.Ok([str(Path(get_runtime_output_root()).resolve(strict=False))])
    if s in ("input", "inputs"):
        return Result.Ok([str(Path(folder_paths.get_input_directory()).resolve(strict=False))])
    if s == "all":
        return Result.Ok([
            str(Path(get_runtime_output_root()).resolve(strict=False)),
            str(Path(folder_paths.get_input_directory()).resolve(strict=False)),
        ])
    if s == "custom":
        root = resolve_custom_root(str(custom_root_id or ""))
        if not root.ok:
            return Result.Err("INVALID_INPUT", root.error or "Invalid custom root")
        return Result.Ok([str(Path(str(root.data)).resolve(strict=False))])
    return Result.Err("INVALID_INPUT", f"Unknown scope: {scope}")


def _parse_int_query(request: web.Request, key: str, default: int) -> int:
    try:
        return int(request.query.get(key, str(default)))
    except Exception:
        return default


def _parse_keep_asset_id(raw_value: object) -> Result[int]:
    if not isinstance(raw_value, (int, float, str, bytes, bytearray)):
        return Result.Err("INVALID_INPUT", "Invalid keep_asset_id")
    try:
        return Result.Ok(int(raw_value))
    except Exception:
        return Result.Err("INVALID_INPUT", "Invalid keep_asset_id")


def _parse_merge_asset_ids(raw_value: object) -> Result[list]:
    if not isinstance(raw_value, list):
        return Result.Err("INVALID_INPUT", "merge_asset_ids must be a list")
    return Result.Ok(raw_value)


def _parse_merge_tags_body(body: dict) -> Result[tuple[int, list]]:
    keep_res = _parse_keep_asset_id(body.get("keep_asset_id"))
    if not keep_res.ok:
        return Result.Err(keep_res.code or "INVALID_INPUT", keep_res.error or "Invalid keep_asset_id")
    merge_res = _parse_merge_asset_ids(body.get("merge_asset_ids") or [])
    if not merge_res.ok:
        return Result.Err(merge_res.code or "INVALID_INPUT", merge_res.error or "merge_asset_ids must be a list")
    keep_id = int(keep_res.data or 0)
    merge_ids = merge_res.data if isinstance(merge_res.data, list) else []
    return Result.Ok((keep_id, merge_ids))


def _duplicates_service_or_error(svc: dict) -> Result[object]:
    dup = svc.get("duplicates") if isinstance(svc, dict) else None
    if not dup:
        return Result.Err("SERVICE_UNAVAILABLE", "Duplicate service unavailable")
    return Result.Ok(dup)


def _duplicate_alerts_params(request: web.Request) -> tuple[int, int, int]:
    return (
        _parse_int_query(request, "max_groups", 6),
        _parse_int_query(request, "max_pairs", 10),
        _parse_int_query(request, "phash_distance", 6),
    )


async def _get_duplicate_alerts_safe(
    dup: object,
    *,
    roots: list[str] | None,
    max_groups: int,
    max_pairs: int,
    phash_distance: int,
) -> Result:
    if not hasattr(dup, "get_alerts"):
        return Result.Err("SERVICE_UNAVAILABLE", "Duplicate service unavailable")
    try:
        return await dup.get_alerts(
            roots=roots,
            max_groups=max_groups,
            max_pairs=max_pairs,
            phash_distance=phash_distance,
        )
    except Exception as exc:
        msg = safe_error_message(exc, "Failed to get duplicate alerts")
        low = str(exc).lower()
        if "resetting" in low or "no active connection" in low:
            return Result.Err("DB_MAINTENANCE", "Database maintenance in progress. Please wait.")
        return Result.Err("DB_ERROR", msg)


def register_duplicates_routes(routes: web.RouteTableDef) -> None:
    @routes.post("/mjr/am/duplicates/analyze")
    async def start_duplicates_analysis(request):
        if is_db_maintenance_active():
            return _json_response(Result.Err("DB_MAINTENANCE", "Database maintenance in progress. Please wait."))
        csrf = _csrf_error(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))
        auth = _require_write_access(request)
        if not auth.ok:
            return _json_response(auth)

        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)
        dup_res = _duplicates_service_or_error(svc)
        if not dup_res.ok:
            return _json_response(dup_res)
        dup = dup_res.data

        body_res = await _read_json(request)
        if not body_res.ok:
            return _json_response(body_res)
        body = body_res.data or {}
        try:
            limit = int(body.get("limit", 250))
        except Exception:
            limit = 250
        result = await dup.start_background_analysis(limit=limit)
        return _json_response(result)

    @routes.get("/mjr/am/duplicates/status")
    async def duplicates_status(request):
        if is_db_maintenance_active():
            return _json_response(Result.Err("DB_MAINTENANCE", "Database maintenance in progress. Please wait."))
        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)
        dup = svc.get("duplicates")
        if not dup:
            return _json_response(Result.Err("SERVICE_UNAVAILABLE", "Duplicate service unavailable"))
        return _json_response(await dup.get_status())

    @routes.get("/mjr/am/duplicates/alerts")
    async def duplicates_alerts(request):
        if is_db_maintenance_active():
            return _json_response(Result.Err("DB_MAINTENANCE", "Database maintenance in progress. Please wait."))
        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)
        dup_res = _duplicates_service_or_error(svc)
        if not dup_res.ok:
            return _json_response(dup_res)
        dup = dup_res.data

        scope = (request.query.get("scope") or "output").strip().lower()
        custom_root_id = request.query.get("custom_root_id") or request.query.get("root_id") or ""
        roots_res = _roots_for_scope(scope, str(custom_root_id))
        if not roots_res.ok:
            return _json_response(roots_res)

        max_groups, max_pairs, phash_distance = _duplicate_alerts_params(request)
        result = await _get_duplicate_alerts_safe(
            dup,
            roots=roots_res.data,
            max_groups=max_groups,
            max_pairs=max_pairs,
            phash_distance=phash_distance,
        )
        return _json_response(result)

    @routes.post("/mjr/am/duplicates/merge-tags")
    async def duplicates_merge_tags(request):
        if is_db_maintenance_active():
            return _json_response(Result.Err("DB_MAINTENANCE", "Database maintenance in progress. Please wait."))
        csrf = _csrf_error(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))
        auth = _require_write_access(request)
        if not auth.ok:
            return _json_response(auth)

        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)
        dup_res = _duplicates_service_or_error(svc)
        if not dup_res.ok:
            return _json_response(dup_res)
        dup = dup_res.data

        body_res = await _read_json(request)
        if not body_res.ok:
            return _json_response(body_res)
        body = body_res.data or {}
        parsed = _parse_merge_tags_body(body)
        if not parsed.ok:
            return _json_response(parsed)
        keep_asset_id_val, merge_asset_ids = parsed.data or (0, [])
        result = await dup.merge_tags_for_group(int(keep_asset_id_val), merge_asset_ids)
        return _json_response(result)
