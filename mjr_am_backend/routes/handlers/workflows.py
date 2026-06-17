"""Workflow library routes."""

from __future__ import annotations

import asyncio
import os
import shutil
import subprocess
import sys
from email.utils import formatdate
from pathlib import Path

from aiohttp import web
from mjr_am_backend.features.workflows import (
    delete_workflow,
    duplicate_workflow,
    is_workflow_thumbnail_path,
    list_workflow_model_families,
    list_workflow_thumbnail_candidates,
    managed_workflow_root,
    mark_workflow_loaded,
    move_or_rename_workflow,
    read_workflow_content,
    save_workflow,
    set_workflow_favorite,
    set_workflow_info,
    set_workflow_tags,
    set_workflow_thumbnail,
    workflow_graph_map_svg,
    workflow_roots,
)
from mjr_am_backend.shared import Result
from mjr_am_shared import get_logger

from ..core import (
    _check_rate_limit,
    _csrf_error,
    _guess_content_type_for_file,
    _json_response,
    _read_json,
    _require_services,
    _require_write_access,
    audit_log_write,
)

_WORKFLOW_WRITE_RATE_LIMIT_MAX_REQUESTS = 30
_WORKFLOW_WRITE_RATE_LIMIT_WINDOW_SECONDS = 60
_WORKFLOW_THUMBNAIL_CACHE_CONTROL = "private, max-age=300"


def _weak_file_etag(path: Path) -> str:
    try:
        stat = path.stat()
        return f'W/"{int(stat.st_mtime_ns):x}-{int(stat.st_size):x}"'
    except Exception:
        return 'W/"0-0"'


def _http_date_from_mtime(path: Path) -> str:
    try:
        return formatdate(path.stat().st_mtime, usegmt=True)
    except Exception:
        return formatdate(None, usegmt=True)


def _request_etag_matches(request: web.Request, etag: str) -> bool:
    try:
        raw = str(request.headers.get("If-None-Match") or "")
        if not raw:
            return False
        values = {part.strip() for part in raw.split(",")}
        return "*" in values or etag in values
    except Exception:
        return False


def _request_mtime_matches(request: web.Request, path: Path) -> bool:
    try:
        ims = request.if_modified_since
        if ims is None:
            return False
        stat = path.stat()
        return int(stat.st_mtime) <= int(ims.timestamp())
    except Exception:
        return False


def _cached_not_modified_response(etag: str, last_modified: str) -> web.Response:
    resp = web.Response(status=304)
    resp.headers["ETag"] = etag
    resp.headers["Last-Modified"] = last_modified
    resp.headers["Cache-Control"] = _WORKFLOW_THUMBNAIL_CACHE_CONTROL
    resp.headers["X-Content-Type-Options"] = "nosniff"
    return resp


def _set_cache_headers(resp: web.StreamResponse, *, etag: str, last_modified: str) -> None:
    resp.headers["ETag"] = etag
    resp.headers["Last-Modified"] = last_modified
    resp.headers["Cache-Control"] = _WORKFLOW_THUMBNAIL_CACHE_CONTROL
    resp.headers["X-Content-Type-Options"] = "nosniff"
logger = get_logger(__name__)


async def _guard_write_json(request: web.Request) -> Result[dict]:
    csrf = _csrf_error(request)
    if csrf:
        return Result.Err("CSRF", csrf)
    auth = _require_write_access(request)
    if not auth.ok:
        return Result.Err(auth.code or "AUTH_REQUIRED", auth.error or "Write access denied")
    body = await _read_json(request)
    if not body.ok:
        return Result.Err(body.code or "INVALID_JSON", body.error or "Invalid JSON body")
    return body


def _check_workflow_write_rate_limit(request: web.Request, endpoint: str) -> Result[bool]:
    allowed, retry_after = _check_rate_limit(
        request,
        endpoint,
        max_requests=_WORKFLOW_WRITE_RATE_LIMIT_MAX_REQUESTS,
        window_seconds=_WORKFLOW_WRITE_RATE_LIMIT_WINDOW_SECONDS,
    )
    if allowed:
        return Result.Ok(True)
    return Result.Err(
        "RATE_LIMITED",
        "Rate limit exceeded. Please wait before retrying.",
        retry_after=retry_after,
    )


def _open_folder_path(path: Path) -> Result[dict]:
    try:
        resolved = path.resolve(strict=True)
    except Exception:
        return Result.Err("NOT_FOUND", "Workflow root does not exist")
    if not resolved.is_dir():
        return Result.Err("INVALID_INPUT", "Workflow root is not a directory")

    def _execute(command: list[str]) -> None:
        if not shutil.which(command[0]):
            raise FileNotFoundError(command[0])
        subprocess.Popen(
            command,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            shell=False,
        )

    if sys.platform == "darwin":
        command = ["open", str(resolved)]
    elif os.name == "nt":
        command = ["explorer.exe", str(resolved)]
    else:
        command = ["xdg-open", str(resolved)]
    try:
        _execute(command)
    except Exception as exc:
        return Result.Err("DEGRADED", f"Failed to open workflow root: {exc.__class__.__name__}")
    return Result.Ok({"opened": True, "path": str(resolved)})


async def _audit_workflow_write(
    request: web.Request,
    *,
    operation: str,
    target: str,
    result: Result,
    details: dict | None = None,
) -> None:
    try:
        services, _ = await _require_services()
        await audit_log_write(
            services,
            request=request,
            operation=operation,
            target=target,
            result=result,
            details=details or {},
        )
    except Exception:
        logger.debug("Workflow audit write failed", exc_info=True)


def _resolve_path_under_roots(user_path: Path, safe_roots: list[Path]) -> Result[Path]:
    try:
        resolved = user_path.resolve(strict=True)
    except FileNotFoundError:
        return Result.Err("NOT_FOUND", "Thumbnail not found")
    except Exception:
        return Result.Err("FORBIDDEN", "Thumbnail path is not allowed")

    for root in safe_roots:
        try:
            root_resolved = root.resolve(strict=False)
        except Exception:
            continue
        if resolved == root_resolved or resolved.is_relative_to(root_resolved):
            return Result.Ok(resolved)
    return Result.Err("FORBIDDEN", "Thumbnail path is not allowed")


def register_workflow_routes(routes: web.RouteTableDef) -> None:
    @routes.get("/mjr/am/workflows/content")
    async def workflow_content(request: web.Request):
        filepath = str(request.query.get("filepath") or "").strip()
        if not filepath:
            return _json_response(Result.Err("INVALID_INPUT", "Missing filepath"))
        return _json_response(read_workflow_content(Path(filepath)))

    @routes.post("/mjr/am/workflows/save")
    async def workflow_save(request: web.Request):
        rate = _check_workflow_write_rate_limit(request, "workflow_save")
        if not rate.ok:
            return _json_response(rate)
        body_res = await _guard_write_json(request)
        if not body_res.ok:
            return _json_response(body_res)
        body = body_res.data or {}
        workflow = body.get("workflow")
        if not isinstance(workflow, dict):
            return _json_response(Result.Err("INVALID_WORKFLOW", "Missing workflow object"))
        result = save_workflow(
            workflow=workflow,
            name=body.get("name") or "",
            category=body.get("category") or body.get("task") or "",
            overwrite=bool(body.get("overwrite")),
            filepath=body.get("filepath") or "",
        )
        await _audit_workflow_write(
            request,
            operation="workflow.save",
            target=str(body.get("filepath") or body.get("name") or "workflow"),
            result=result,
            details={"category": str(body.get("category") or "")},
        )
        return _json_response(result)

    @routes.post("/mjr/am/workflows/duplicate")
    async def workflow_duplicate(request: web.Request):
        rate = _check_workflow_write_rate_limit(request, "workflow_duplicate")
        if not rate.ok:
            return _json_response(rate)
        body_res = await _guard_write_json(request)
        if not body_res.ok:
            return _json_response(body_res)
        body = body_res.data or {}
        filepath = str(body.get("filepath") or "").strip()
        if not filepath:
            return _json_response(Result.Err("INVALID_INPUT", "Missing filepath"))
        result = duplicate_workflow(Path(filepath), name=body.get("name") or "")
        await _audit_workflow_write(
            request,
            operation="workflow.duplicate",
            target=filepath,
            result=result,
        )
        return _json_response(result)

    @routes.post("/mjr/am/workflows/move")
    async def workflow_move(request: web.Request):
        rate = _check_workflow_write_rate_limit(request, "workflow_move")
        if not rate.ok:
            return _json_response(rate)
        body_res = await _guard_write_json(request)
        if not body_res.ok:
            return _json_response(body_res)
        body = body_res.data or {}
        filepath = str(body.get("filepath") or "").strip()
        if not filepath:
            return _json_response(Result.Err("INVALID_INPUT", "Missing filepath"))
        result = move_or_rename_workflow(
            Path(filepath),
            name=body.get("name") or "",
            category=body.get("category") or "",
        )
        await _audit_workflow_write(
            request,
            operation="workflow.move",
            target=filepath,
            result=result,
            details={
                "name": str(body.get("name") or ""),
                "category": str(body.get("category") or ""),
            },
        )
        return _json_response(result)

    @routes.post("/mjr/am/workflows/delete")
    async def workflow_delete(request: web.Request):
        rate = _check_workflow_write_rate_limit(request, "workflow_delete")
        if not rate.ok:
            return _json_response(rate)
        body_res = await _guard_write_json(request)
        if not body_res.ok:
            return _json_response(body_res)
        filepath = str((body_res.data or {}).get("filepath") or "").strip()
        if not filepath:
            return _json_response(Result.Err("INVALID_INPUT", "Missing filepath"))
        result = delete_workflow(Path(filepath))
        await _audit_workflow_write(
            request,
            operation="workflow.delete",
            target=filepath,
            result=result,
        )
        return _json_response(result)

    @routes.post("/mjr/am/workflows/mark-loaded")
    async def workflow_mark_loaded(request: web.Request):
        rate = _check_workflow_write_rate_limit(request, "workflow_mark_loaded")
        if not rate.ok:
            return _json_response(rate)
        body_res = await _guard_write_json(request)
        if not body_res.ok:
            return _json_response(body_res)
        filepath = str((body_res.data or {}).get("filepath") or "").strip()
        if not filepath:
            return _json_response(Result.Err("INVALID_INPUT", "Missing filepath"))
        result = mark_workflow_loaded(Path(filepath))
        await _audit_workflow_write(
            request,
            operation="workflow.mark_loaded",
            target=filepath,
            result=result,
        )
        return _json_response(result)

    @routes.post("/mjr/am/workflows/favorite")
    async def workflow_favorite(request: web.Request):
        rate = _check_workflow_write_rate_limit(request, "workflow_favorite")
        if not rate.ok:
            return _json_response(rate)
        body_res = await _guard_write_json(request)
        if not body_res.ok:
            return _json_response(body_res)
        body = body_res.data or {}
        filepath = str(body.get("filepath") or "").strip()
        if not filepath:
            return _json_response(Result.Err("INVALID_INPUT", "Missing filepath"))
        result = set_workflow_favorite(
            Path(filepath),
            favorite=body.get("favorite"),
        )
        await _audit_workflow_write(
            request,
            operation="workflow.favorite",
            target=filepath,
            result=result,
            details={"favorite": bool(body.get("favorite"))},
        )
        return _json_response(result)

    @routes.post("/mjr/am/workflows/tags")
    async def workflow_tags(request: web.Request):
        rate = _check_workflow_write_rate_limit(request, "workflow_tags")
        if not rate.ok:
            return _json_response(rate)
        body_res = await _guard_write_json(request)
        if not body_res.ok:
            return _json_response(body_res)
        body = body_res.data or {}
        filepath = str(body.get("filepath") or "").strip()
        if not filepath:
            return _json_response(Result.Err("INVALID_INPUT", "Missing filepath"))
        result = set_workflow_tags(Path(filepath), tags=body.get("tags") or [])
        await _audit_workflow_write(
            request,
            operation="workflow.tags",
            target=filepath,
            result=result,
            details={"tag_count": len(body.get("tags") or [])},
        )
        return _json_response(result)

    @routes.post("/mjr/am/workflows/info")
    async def workflow_info(request: web.Request):
        rate = _check_workflow_write_rate_limit(request, "workflow_info")
        if not rate.ok:
            return _json_response(rate)
        body_res = await _guard_write_json(request)
        if not body_res.ok:
            return _json_response(body_res)
        body = body_res.data or {}
        filepath = str(body.get("filepath") or "").strip()
        if not filepath:
            return _json_response(Result.Err("INVALID_INPUT", "Missing filepath"))
        result = set_workflow_info(Path(filepath), info=body)
        await _audit_workflow_write(
            request,
            operation="workflow.info",
            target=filepath,
            result=result,
        )
        return _json_response(result)

    @routes.get("/mjr/am/workflows/thumbnail-candidates")
    async def workflow_thumbnail_candidates(request: web.Request):
        filepath = str(request.query.get("filepath") or "").strip()
        if not filepath:
            return _json_response(Result.Err("INVALID_INPUT", "Missing filepath"))
        limit_raw = str(request.query.get("limit") or "12").strip()
        try:
            limit = max(1, min(50, int(limit_raw or 12)))
        except Exception:
            limit = 12
        return _json_response(list_workflow_thumbnail_candidates(Path(filepath), limit=limit))

    @routes.get("/mjr/am/workflows/model-families")
    async def workflow_model_families(request: web.Request):
        return _json_response(list_workflow_model_families())

    @routes.post("/mjr/am/workflows/open-root")
    async def workflow_open_root(request: web.Request):
        csrf = _csrf_error(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))
        auth = _require_write_access(request)
        if not auth.ok:
            return _json_response(auth)
        rate = _check_workflow_write_rate_limit(request, "workflow_open_root")
        if not rate.ok:
            return _json_response(rate)
        roots = workflow_roots()
        root = managed_workflow_root(create=True)
        target = root or (roots[0] if roots else None)
        if target is None:
            return _json_response(Result.Err("WORKFLOW_ROOT_UNAVAILABLE", "Workflow root is unavailable"))
        result = _open_folder_path(target)
        await _audit_workflow_write(
            request,
            operation="workflow.open_root",
            target=str(target),
            result=result,
        )
        return _json_response(result)

    @routes.post("/mjr/am/workflows/thumbnail/set")
    async def workflow_set_thumbnail(request: web.Request):
        rate = _check_workflow_write_rate_limit(request, "workflow_thumbnail")
        if not rate.ok:
            return _json_response(rate)
        body_res = await _guard_write_json(request)
        if not body_res.ok:
            return _json_response(body_res)
        body = body_res.data or {}
        filepath = str(body.get("filepath") or "").strip()
        source_filepath = str(body.get("source_filepath") or body.get("thumbnail_path") or "").strip()
        if not filepath:
            return _json_response(Result.Err("INVALID_INPUT", "Missing filepath"))
        # set_workflow_thumbnail may run ffmpeg (up to 45s) and copy files;
        # run it in a worker thread so the event loop is never blocked.
        result = await asyncio.to_thread(
            set_workflow_thumbnail, Path(filepath), source_filepath=source_filepath
        )
        await _audit_workflow_write(
            request,
            operation="workflow.thumbnail",
            target=filepath,
            result=result,
        )
        return _json_response(result)

    @routes.get("/mjr/am/workflows/thumbnail")
    async def workflow_thumbnail(request: web.Request):
        filepath = str(request.query.get("filepath") or "").strip()
        if not filepath:
            return _json_response(Result.Err("INVALID_INPUT", "Missing filepath"))
        candidate = Path(filepath)
        if not is_workflow_thumbnail_path(candidate):
            return _json_response(Result.Err("FORBIDDEN", "Thumbnail path is not allowed"))
        safe_path_res = _resolve_path_under_roots(candidate, workflow_roots())
        if not safe_path_res.ok:
            return _json_response(safe_path_res)
        resolved = safe_path_res.data
        if resolved is None:
            return _json_response(Result.Err("NOT_FOUND", "Thumbnail not found"))
        try:
            etag = _weak_file_etag(resolved)
            last_modified = _http_date_from_mtime(resolved)
            if _request_etag_matches(request, etag) or _request_mtime_matches(request, resolved):
                return _cached_not_modified_response(etag, last_modified)
            resp = web.FileResponse(path=str(resolved))
            resp.headers["Content-Type"] = _guess_content_type_for_file(resolved)
            _set_cache_headers(resp, etag=etag, last_modified=last_modified)
            return resp
        except Exception:
            return _json_response(Result.Err("VIEW_FAILED", "Failed to serve thumbnail"))

    @routes.get("/mjr/am/workflows/graph-map-thumbnail")
    async def workflow_graph_map_thumbnail(request: web.Request):
        filepath = str(request.query.get("filepath") or "").strip()
        if not filepath:
            return _json_response(Result.Err("INVALID_INPUT", "Missing filepath"))
        content = read_workflow_content(Path(filepath))
        if not content.ok:
            return _json_response(content)
        workflow = dict(content.data or {}).get("workflow")
        if not isinstance(workflow, dict):
            return _json_response(Result.Err("INVALID_WORKFLOW", "Workflow JSON is missing or invalid"))
        source_path = Path(filepath)
        etag = _weak_file_etag(source_path)
        last_modified = _http_date_from_mtime(source_path)
        if _request_etag_matches(request, etag) or _request_mtime_matches(request, source_path):
            return _cached_not_modified_response(etag, last_modified)
        svg = workflow_graph_map_svg(workflow)
        resp = web.Response(text=svg, content_type="image/svg+xml")
        _set_cache_headers(resp, etag=etag, last_modified=last_modified)
        return resp
