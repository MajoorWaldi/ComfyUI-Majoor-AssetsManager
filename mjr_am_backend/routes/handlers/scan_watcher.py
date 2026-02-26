"""
File watcher management and watcher route handlers.
"""
import asyncio
import os
from pathlib import Path
from typing import Any

from aiohttp import web

from mjr_am_backend.features.index.watcher_scope import (
    WATCHER_CUSTOM_ROOT_ID_KEY,
    WATCHER_SCOPE_KEY,
    build_watch_paths,
    normalize_scope,
)
from mjr_am_backend.features.index.metadata_helpers import MetadataHelpers
from mjr_am_backend.features.watcher_settings import get_watcher_settings, update_watcher_settings
from mjr_am_backend.shared import Result, get_logger

from ..core import (
    _csrf_error,
    _json_response,
    _read_json,
    _require_services,
    _require_write_access,
    safe_error_message,
)
from .scan_helpers import (
    _refresh_watcher_runtime_settings,
    _watcher_settings_from_body,
)

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# Watcher callback builders
# ---------------------------------------------------------------------------

def _watcher_scope_config(svc: dict[str, Any]) -> tuple[str, str | None]:
    scope_cfg = svc.get("watcher_scope") if isinstance(svc, dict) else None
    desired_scope = normalize_scope((scope_cfg or {}).get("scope"))
    desired_root_id = (scope_cfg or {}).get("custom_root_id") or (scope_cfg or {}).get("root_id")
    return desired_scope, desired_root_id


async def _delay_for_recent_generated_marker() -> None:
    try:
        await asyncio.sleep(0.2)
    except Exception:
        return


def _filter_recent_generated_files(filepaths: list[Any] | None) -> list[Any]:
    try:
        from mjr_am_backend.features.index.watcher import is_recent_generated

        return [f for f in (filepaths or []) if f and not is_recent_generated(f)]
    except Exception:
        return [f for f in (filepaths or []) if f]


def _build_watcher_callbacks(index_service: Any):
    async def index_callback(filepaths, base_dir, source=None, root_id=None):
        if not filepaths:
            return
        await _delay_for_recent_generated_marker()
        filepaths = _filter_recent_generated_files(filepaths)
        if not filepaths:
            return
        paths = [Path(f) for f in filepaths if f]
        if paths:
            await index_service.index_paths(
                paths=paths,
                base_dir=base_dir,
                incremental=True,
                source=source or "watcher",
                root_id=root_id,
            )

    async def remove_callback(filepaths, _base_dir, _source=None, _root_id=None):
        if not filepaths:
            return
        for fp in filepaths:
            try:
                await index_service.remove_file(str(fp))
            except Exception:
                continue

    async def move_callback(moves, _base_dir, source=None, root_id=None):
        if not moves:
            return
        for move in moves:
            try:
                old_fp, new_fp = move
            except Exception:
                continue
            try:
                res = await index_service.rename_file(str(old_fp), str(new_fp))
                if not res.ok:
                    await index_service.remove_file(str(old_fp))
                    await index_service.index_paths(
                        paths=[Path(str(new_fp))],
                        base_dir=str(_base_dir),
                        incremental=True,
                        source=source or "watcher",
                        root_id=root_id,
                    )
            except Exception:
                continue

    return index_callback, remove_callback, move_callback


# ---------------------------------------------------------------------------
# Watcher start / stop
# ---------------------------------------------------------------------------

async def _start_watcher_for_scope(svc: dict[str, Any], index_service: Any, *, _build_watch_paths=None) -> Result[dict[str, Any]]:
    from mjr_am_backend.features.index.watcher import OutputWatcher

    if _build_watch_paths is None:
        _build_watch_paths = build_watch_paths
    index_callback, remove_callback, move_callback = _build_watcher_callbacks(index_service)
    new_watcher = OutputWatcher(index_callback, remove_callback=remove_callback, move_callback=move_callback)
    desired_scope, desired_root_id = _watcher_scope_config(svc)
    watch_paths = _build_watch_paths(desired_scope, desired_root_id)
    if not watch_paths:
        return Result.Err("NO_DIRECTORIES", "No directories to watch")
    loop = asyncio.get_event_loop()
    await new_watcher.start(watch_paths, loop)
    svc["watcher"] = new_watcher
    svc["watcher_scope"] = {"scope": desired_scope, "custom_root_id": desired_root_id or ""}
    return Result.Ok({"enabled": True, "directories": new_watcher.watched_directories})


async def _stop_watcher_if_running(svc: dict[str, Any], watcher: Any) -> Result[dict[str, Any]]:
    if watcher:
        await watcher.stop()
        svc["watcher"] = None
    return Result.Ok({"enabled": False, "directories": []})


# ---------------------------------------------------------------------------
# Watcher route handlers (registered via register_watcher_routes)
# ---------------------------------------------------------------------------

def register_watcher_routes(routes: web.RouteTableDef, *, deps: dict | None = None) -> None:
    """Register all /mjr/am/watcher/* route handlers.

    deps: if provided (pass globals() from the calling scan module), the handlers
          look up patchable functions from this dict AT CALL TIME so that test patches
          applied after route registration (e.g. _app() called before monkeypatch) work.
    """
    # _d captured by reference — scan.__dict__ is live, so patches applied
    # at any point (even after _app() is called) are picked up at handler call time.
    _d = deps  # May be None; fallback to local names when None.

    @routes.get("/mjr/am/watcher/status")
    async def watcher_status(request):
        """Get watcher status."""
        _require_services_ = _d.get("_require_services", _require_services) if _d is not None else _require_services
        svc, error_result = await _require_services_()
        if error_result:
            return _json_response(error_result)

        watcher = svc.get("watcher")
        return _json_response(Result.Ok({
            "enabled": watcher is not None and watcher.is_running,
            "directories": watcher.watched_directories if watcher else [],
        }))

    @routes.post("/mjr/am/watcher/flush")
    async def watcher_flush(request):
        """Flush watcher pending queue immediately (best-effort)."""
        _require_services_ = _d.get("_require_services", _require_services) if _d is not None else _require_services
        _csrf_error_ = _d.get("_csrf_error", _csrf_error) if _d is not None else _csrf_error
        _require_write_access_ = _d.get("_require_write_access", _require_write_access) if _d is not None else _require_write_access

        svc, error_result = await _require_services_()
        if error_result:
            return _json_response(error_result)

        csrf = _csrf_error_(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))
        auth = _require_write_access_(request)
        if not auth.ok:
            return _json_response(auth)

        watcher = svc.get("watcher")
        if not watcher:
            return _json_response(Result.Ok({"enabled": False, "flushed": False}))

        flushed = False
        try:
            flush_fn = getattr(watcher, "flush_pending", None)
            if callable(flush_fn):
                flushed = bool(flush_fn())
        except Exception:
            flushed = False
        return _json_response(Result.Ok({"enabled": bool(watcher.is_running), "flushed": flushed}))

    @routes.post("/mjr/am/watcher/toggle")
    async def watcher_toggle(request):
        """Start or stop the file watcher."""
        _require_services_ = _d.get("_require_services", _require_services) if _d is not None else _require_services
        _csrf_error_ = _d.get("_csrf_error", _csrf_error) if _d is not None else _csrf_error
        _require_write_access_ = _d.get("_require_write_access", _require_write_access) if _d is not None else _require_write_access
        _read_json_ = _d.get("_read_json", _read_json) if _d is not None else _read_json
        _build_watch_paths_ = _d.get("build_watch_paths", build_watch_paths) if _d is not None else build_watch_paths

        svc, error_result = await _require_services_()
        if error_result:
            return _json_response(error_result)

        csrf = _csrf_error_(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))
        auth = _require_write_access_(request)
        if not auth.ok:
            return _json_response(auth)

        body_res = await _read_json_(request)
        if not body_res.ok:
            return _json_response(body_res)
        body = body_res.data or {}

        enabled = body.get("enabled", True)
        watcher = svc.get("watcher")

        if enabled:
            if watcher and watcher.is_running:
                return _json_response(Result.Ok({"enabled": True, "directories": watcher.watched_directories}))

            index_service = svc.get("index")
            if not index_service:
                return _json_response(Result.Err("SERVICE_UNAVAILABLE", "Index service not available"))
            return _json_response(await _start_watcher_for_scope(svc, index_service, _build_watch_paths=_build_watch_paths_))
        return _json_response(await _stop_watcher_if_running(svc, watcher))

    @routes.get("/mjr/am/watcher/settings")
    async def watcher_settings_get(request):
        _require_services_ = _d.get("_require_services", _require_services) if _d is not None else _require_services
        _get_watcher_settings_ = _d.get("get_watcher_settings", get_watcher_settings) if _d is not None else get_watcher_settings

        svc, error_result = await _require_services_()
        if error_result:
            return _json_response(error_result)
        try:
            settings = _get_watcher_settings_()
        except Exception as exc:
            logger.debug("Failed to read watcher settings: %s", exc)
            return _json_response(Result.Err("DEGRADED", "Watcher settings unavailable"))
        return _json_response(
            Result.Ok(
                {
                    "debounce_ms": settings.debounce_ms,
                    "dedupe_ttl_ms": settings.dedupe_ttl_ms,
                }
            )
        )

    @routes.post("/mjr/am/watcher/settings")
    async def watcher_settings_update(request):
        _require_services_ = _d.get("_require_services", _require_services) if _d is not None else _require_services
        _csrf_error_ = _d.get("_csrf_error", _csrf_error) if _d is not None else _csrf_error
        _require_write_access_ = _d.get("_require_write_access", _require_write_access) if _d is not None else _require_write_access
        _read_json_ = _d.get("_read_json", _read_json) if _d is not None else _read_json
        _update_watcher_settings_ = _d.get("update_watcher_settings", update_watcher_settings) if _d is not None else update_watcher_settings

        svc, error_result = await _require_services_()
        if error_result:
            return _json_response(error_result)

        csrf = _csrf_error_(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))
        auth = _require_write_access_(request)
        if not auth.ok:
            return _json_response(auth)

        body_res = await _read_json_(request)
        if not body_res.ok:
            return _json_response(body_res)
        body = body_res.data or {}

        try:
            debounce_ms, dedupe_ttl_ms = _watcher_settings_from_body(body)
        except ValueError as exc:
            return _json_response(Result.Err("INVALID_INPUT", str(exc)))

        if debounce_ms is None and dedupe_ttl_ms is None:
            return _json_response(Result.Err("INVALID_INPUT", "No watcher settings provided"))

        try:
            settings = _update_watcher_settings_(
                debounce_ms=debounce_ms,
                dedupe_ttl_ms=dedupe_ttl_ms,
            )
        except Exception as exc:
            return _json_response(Result.Err("DEGRADED", safe_error_message(exc, "Failed to update watcher settings")))

        _refresh_watcher_runtime_settings(svc)

        return _json_response(
            Result.Ok(
                {
                    "debounce_ms": settings.debounce_ms,
                    "dedupe_ttl_ms": settings.dedupe_ttl_ms,
                }
            )
        )

    @routes.post("/mjr/am/watcher/scope")
    async def watcher_scope(request):
        """Configure watcher to follow a single scope (global mode)."""
        _require_services_ = _d.get("_require_services", _require_services) if _d is not None else _require_services
        _csrf_error_ = _d.get("_csrf_error", _csrf_error) if _d is not None else _csrf_error
        _require_write_access_ = _d.get("_require_write_access", _require_write_access) if _d is not None else _require_write_access
        _read_json_ = _d.get("_read_json", _read_json) if _d is not None else _read_json
        _build_watch_paths_ = _d.get("build_watch_paths", build_watch_paths) if _d is not None else build_watch_paths

        svc, error_result = await _require_services_()
        if error_result:
            return _json_response(error_result)

        csrf = _csrf_error_(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))
        auth = _require_write_access_(request)
        if not auth.ok:
            return _json_response(auth)

        body_res = await _read_json_(request)
        if not body_res.ok:
            return _json_response(body_res)
        body = body_res.data or {}

        scope = normalize_scope(body.get("scope"))
        custom_root_id = str(body.get("custom_root_id") or body.get("root_id") or "").strip()
        if scope != "custom":
            custom_root_id = ""

        # Persist desired scope in memory even if watcher is disabled.
        svc["watcher_scope"] = {"scope": scope, "custom_root_id": custom_root_id}
        try:
            db = svc.get("db")
            if db:
                await MetadataHelpers.set_metadata_value(db, WATCHER_SCOPE_KEY, str(scope))
                await MetadataHelpers.set_metadata_value(db, WATCHER_CUSTOM_ROOT_ID_KEY, str(custom_root_id or ""))
        except Exception:
            pass

        # If watcher is not enabled, just acknowledge.
        watcher = svc.get("watcher")
        if not watcher or not watcher.is_running:
            return _json_response(Result.Ok({"enabled": False, "directories": [], "scope": scope}))

        from mjr_am_backend.features.index.watcher import OutputWatcher

        index_service = svc.get("index")
        if not index_service:
            return _json_response(Result.Err("SERVICE_UNAVAILABLE", "Index service not available"))

        watch_paths = _build_watch_paths_(scope, custom_root_id)
        if not watch_paths:
            if scope == "custom":
                return _json_response(Result.Err("INVALID_INPUT", "Invalid or missing custom_root_id for watcher scope"))
            try:
                if watcher and watcher.is_running:
                    await watcher.stop()
                    svc["watcher"] = None
            except Exception:
                pass
            return _json_response(Result.Ok({"enabled": False, "directories": [], "scope": scope}))

        # Idempotent scope update: avoid watcher stop/start churn when the
        # requested scope resolves to the exact same set of directories.
        try:
            current_dirs = []
            if watcher and watcher.is_running:
                current_dirs = [os.path.normcase(os.path.normpath(str(p))) for p in (watcher.watched_directories or []) if p]

            desired_dirs = []
            for entry in watch_paths:
                path_value = None
                if isinstance(entry, dict):
                    path_value = entry.get("path")
                else:
                    path_value = entry
                if path_value:
                    desired_dirs.append(os.path.normcase(os.path.normpath(str(path_value))))

            if watcher and watcher.is_running and set(current_dirs) == set(desired_dirs):
                return _json_response(Result.Ok({"enabled": True, "directories": watcher.watched_directories, "scope": scope}))
        except Exception:
            pass

        try:
            await watcher.stop()
        except Exception:
            pass

        async def index_callback(filepaths, base_dir, source=None, root_id=None):
            if not filepaths:
                return
            try:
                # Give executed-event a moment to mark generated files.
                await asyncio.sleep(0.2)
            except Exception:
                pass
            try:
                from mjr_am_backend.features.index.watcher import is_recent_generated
                filepaths = [f for f in (filepaths or []) if f and not is_recent_generated(f)]
            except Exception:
                pass
            if not filepaths:
                return
            paths = [Path(f) for f in filepaths if f]
            if paths:
                await index_service.index_paths(
                    paths=paths,
                    base_dir=base_dir,
                    incremental=True,
                    source=source or "watcher",
                    root_id=root_id,
                )

        async def remove_callback(filepaths, _base_dir, _source=None, _root_id=None):
            if not filepaths:
                return
            for fp in filepaths:
                try:
                    await index_service.remove_file(str(fp))
                except Exception:
                    continue

        async def move_callback(moves, _base_dir, source=None, root_id=None):
            if not moves:
                return
            for move in moves:
                try:
                    old_fp, new_fp = move
                except Exception:
                    continue
                try:
                    res = await index_service.rename_file(str(old_fp), str(new_fp))
                    if not res.ok:
                        await index_service.remove_file(str(old_fp))
                        await index_service.index_paths(
                            paths=[Path(str(new_fp))],
                            base_dir=str(_base_dir),
                            incremental=True,
                            source=source or "watcher",
                            root_id=root_id,
                        )
                except Exception:
                    continue

        new_watcher = OutputWatcher(index_callback, remove_callback=remove_callback, move_callback=move_callback)
        loop = asyncio.get_event_loop()
        await new_watcher.start(watch_paths, loop)
        svc["watcher"] = new_watcher
        return _json_response(Result.Ok({"enabled": True, "directories": new_watcher.watched_directories, "scope": scope}))
