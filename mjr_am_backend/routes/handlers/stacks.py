"""
Stacks endpoints — group assets from the same workflow execution.

Routes:
    GET  /mjr/am/stacks                     — list stacks (paginated)
    GET  /mjr/am/stacks/{stack_id}          — single stack detail
    GET  /mjr/am/stacks/{stack_id}/members  — assets in a stack
    GET  /mjr/am/stacks/by-job/{job_id}     — look up stack by job_id
    POST /mjr/am/stacks/{stack_id}/cover    — set cover asset
    POST /mjr/am/stacks/{stack_id}/rename   — update stack display name
    POST /mjr/am/stacks/dissolve            — dissolve a stack
    POST /mjr/am/stacks/merge               — merge stacks together
    POST /mjr/am/stacks/auto-stack          — trigger automatic stacking
"""

from aiohttp import web
from mjr_am_backend.config import is_execution_grouping_enabled
from mjr_am_backend.shared import Result, get_logger

from ..core import (
    _csrf_error,
    _json_response,
    _read_json,
    _require_services,
    _require_write_access,
)

logger = get_logger(__name__)


def _send_stack_update_event(payload) -> None:
    try:
        from .. import registry as registry_mod

        prompt_server = getattr(registry_mod, "PromptServer", None)
        if prompt_server is not None:
            prompt_server.instance.send_sync("mjr.stacks.updated", payload)
    except Exception:
        pass


def _stacks_service(services):
    """Lazily obtain or create a StacksService from the service container."""
    if isinstance(services, dict):
        svc = services.get("_stacks_service")
        if svc is not None:
            return svc
        db = services.get("db")
        if db is None:
            raise RuntimeError("StacksService requires a 'db' service")
        from mjr_am_backend.features.stacks import StacksService
        svc = StacksService(db)
        services["_stacks_service"] = svc
        return svc

    svc = getattr(services, "_stacks_service", None)
    if svc is not None:
        return svc
    from mjr_am_backend.features.stacks import StacksService
    db = getattr(services, "db", None)
    if db is None:
        raise RuntimeError("StacksService requires a 'db' service")
    svc = StacksService(db)
    try:
        services._stacks_service = svc
    except Exception:
        pass
    return svc


def _require_stack_mutation(request: web.Request) -> Result[bool]:
    csrf = _csrf_error(request)
    if csrf:
        return Result.Err("CSRF", csrf)
    return _require_write_access(request)


def register_stacks_routes(routes: web.RouteTableDef) -> None:

    @routes.get("/mjr/am/stacks")
    async def list_stacks(request: web.Request) -> web.Response:
        services, error_result = await _require_services()
        if error_result is not None or not services:
            return _json_response(error_result or Result.Err("SERVICE_UNAVAILABLE", "Backend not ready"), status=503)
        svc = _stacks_service(services)

        try:
            limit = int(request.query.get("limit", "50"))
        except (ValueError, TypeError):
            limit = 50
        try:
            offset = int(request.query.get("offset", "0"))
        except (ValueError, TypeError):
            offset = 0
        include_total = request.query.get("include_total", "1") != "0"

        result = await svc.list_stacks(limit=limit, offset=offset, include_total=include_total)
        return _json_response(result)

    @routes.get("/mjr/am/stacks/by-job/{job_id}")
    async def get_stack_by_job(request: web.Request) -> web.Response:
        services, error_result = await _require_services()
        if error_result is not None or not services:
            return _json_response(error_result or Result.Err("SERVICE_UNAVAILABLE", "Backend not ready"), status=503)
        svc = _stacks_service(services)

        job_id = request.match_info.get("job_id", "")
        result = await svc.get_stack_by_job_id(job_id)
        if not result.ok:
            return _json_response(result, status=404)
        return _json_response(result)

    @routes.get("/mjr/am/stacks/{stack_id}")
    async def get_stack(request: web.Request) -> web.Response:
        services, error_result = await _require_services()
        if error_result is not None or not services:
            return _json_response(error_result or Result.Err("SERVICE_UNAVAILABLE", "Backend not ready"), status=503)
        svc = _stacks_service(services)

        try:
            stack_id = int(request.match_info["stack_id"])
        except (KeyError, ValueError):
            return _json_response(Result.Err("INVALID_INPUT", "Invalid stack_id"), status=400)

        result = await svc.get_stack(stack_id)
        if not result.ok:
            return _json_response(result, status=404)
        return _json_response(result)

    @routes.get("/mjr/am/stacks/{stack_id}/members")
    async def get_stack_members(request: web.Request) -> web.Response:
        services, error_result = await _require_services()
        if error_result is not None or not services:
            return _json_response(error_result or Result.Err("SERVICE_UNAVAILABLE", "Backend not ready"), status=503)
        svc = _stacks_service(services)

        try:
            stack_id = int(request.match_info["stack_id"])
        except (KeyError, ValueError):
            return _json_response(Result.Err("INVALID_INPUT", "Invalid stack_id"), status=400)

        result = await svc.get_members(stack_id)
        return _json_response(result)

    @routes.post("/mjr/am/stacks/{stack_id}/cover")
    async def set_stack_cover(request: web.Request) -> web.Response:
        auth = _require_stack_mutation(request)
        if not auth.ok:
            return _json_response(auth)
        services, error_result = await _require_services()
        if error_result is not None or not services:
            return _json_response(error_result or Result.Err("SERVICE_UNAVAILABLE", "Backend not ready"), status=503)
        svc = _stacks_service(services)

        try:
            stack_id = int(request.match_info["stack_id"])
        except (KeyError, ValueError):
            return _json_response(Result.Err("INVALID_INPUT", "Invalid stack_id"), status=400)

        body = await _read_json(request)
        cover_asset_id = body.get("cover_asset_id") if isinstance(body, dict) else None
        if not cover_asset_id:
            return _json_response(Result.Err("INVALID_INPUT", "cover_asset_id required"), status=400)

        result = await svc.set_cover(stack_id, int(cover_asset_id))
        return _json_response(result)

    @routes.post("/mjr/am/stacks/{stack_id}/rename")
    async def rename_stack(request: web.Request) -> web.Response:
        auth = _require_stack_mutation(request)
        if not auth.ok:
            return _json_response(auth)
        services, error_result = await _require_services()
        if error_result is not None or not services:
            return _json_response(error_result or Result.Err("SERVICE_UNAVAILABLE", "Backend not ready"), status=503)
        svc = _stacks_service(services)

        try:
            stack_id = int(request.match_info["stack_id"])
        except (KeyError, ValueError):
            return _json_response(Result.Err("INVALID_INPUT", "Invalid stack_id"), status=400)

        body = await _read_json(request)
        name = body.get("name", "") if isinstance(body, dict) else ""
        result = await svc.update_name(stack_id, str(name))
        return _json_response(result)

    @routes.post("/mjr/am/stacks/dissolve")
    async def dissolve_stack(request: web.Request) -> web.Response:
        auth = _require_stack_mutation(request)
        if not auth.ok:
            return _json_response(auth)
        services, error_result = await _require_services()
        if error_result is not None or not services:
            return _json_response(error_result or Result.Err("SERVICE_UNAVAILABLE", "Backend not ready"), status=503)
        svc = _stacks_service(services)

        body = await _read_json(request)
        stack_id = body.get("stack_id") if isinstance(body, dict) else None
        if not stack_id:
            return _json_response(Result.Err("INVALID_INPUT", "stack_id required"), status=400)

        result = await svc.dissolve(int(stack_id))
        return _json_response(result)

    @routes.post("/mjr/am/stacks/merge")
    async def merge_stacks(request: web.Request) -> web.Response:
        auth = _require_stack_mutation(request)
        if not auth.ok:
            return _json_response(auth)
        services, error_result = await _require_services()
        if error_result is not None or not services:
            return _json_response(error_result or Result.Err("SERVICE_UNAVAILABLE", "Backend not ready"), status=503)
        svc = _stacks_service(services)

        body = await _read_json(request)
        if not isinstance(body, dict):
            return _json_response(Result.Err("INVALID_INPUT", "JSON body required"), status=400)

        target_id = body.get("target_stack_id")
        source_ids = body.get("source_stack_ids", [])
        if not target_id or not isinstance(source_ids, list):
            return _json_response(
                Result.Err("INVALID_INPUT", "target_stack_id and source_stack_ids[] required"),
                status=400,
            )

        result = await svc.merge_into(int(target_id), [int(s) for s in source_ids])
        return _json_response(result)

    @routes.post("/mjr/am/stacks/auto-stack")
    async def auto_stack(request: web.Request) -> web.Response:
        auth = _require_stack_mutation(request)
        if not auth.ok:
            return _json_response(auth)
        if not is_execution_grouping_enabled():
            return _json_response(
                Result.Ok(
                    {
                        "disabled": True,
                        "targeted_job_id": None,
                        "stacks": [],
                    }
                )
            )
        services, error_result = await _require_services()
        if error_result is not None or not services:
            return _json_response(error_result or Result.Err("SERVICE_UNAVAILABLE", "Backend not ready"), status=503)
        svc = _stacks_service(services)

        body = await _read_json(request)
        mode = (body.get("mode") or "job_id") if isinstance(body, dict) else "job_id"
        target_job_id = str(body.get("job_id") or "").strip() if isinstance(body, dict) else ""

        if mode == "workflow_hash":
            window = int(body.get("mtime_window_s", 30)) if isinstance(body, dict) else 30
            result = await svc.auto_stack_by_workflow_hash(mtime_window_s=window)
        else:
            result = await svc.auto_stack_by_job_id(target_job_id or None)

        if result.ok and isinstance(result.data, dict):
            try:
                stacks = result.data.get("stacks") or []
                if stacks:
                    _send_stack_update_event(result.data)
            except Exception:
                pass

        return _json_response(result)
