"""
Health check endpoints.
"""
import asyncio
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

from mjr_am_backend.config import OUTPUT_ROOT, get_tool_paths, MEDIA_PROBE_BACKEND
from mjr_am_backend.config import TO_THREAD_TIMEOUT_S
from mjr_am_backend.custom_roots import resolve_custom_root
from mjr_am_backend.shared import Result, ErrorCode, sanitize_error_message
from mjr_am_backend.tool_detect import get_tool_status
from mjr_am_backend.utils import parse_bool
from .db_maintenance import is_db_maintenance_active
from ..core import _json_response, _require_services, _csrf_error, _require_write_access, _read_json

SECURITY_PREF_KEYS = {
    "safe_mode",
    "allow_write",
    "allow_remote_write",
    "allow_delete",
    "allow_rename",
    "allow_open_in_folder",
    "allow_reset_index",
}


def register_health_routes(routes: web.RouteTableDef) -> None:
    """Register health and diagnostics routes."""
    async def _runtime_output_root(svc: dict | None) -> str:
        try:
            settings_service = (svc or {}).get("settings") if isinstance(svc, dict) else None
            if settings_service:
                override = await settings_service.get_output_directory()
                if override:
                    return str(Path(override).resolve(strict=False))
        except Exception:
            pass
        return str(Path(OUTPUT_ROOT).resolve(strict=False))

    @routes.get("/mjr/am/health")
    async def health(request):
        """Get health status."""
        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)

        try:
            result = await asyncio.wait_for(svc['health'].status(), timeout=TO_THREAD_TIMEOUT_S)
        except asyncio.TimeoutError:
            result = Result.Err(ErrorCode.TIMEOUT, "Health status timed out")
        except Exception as exc:
            result = Result.Err(
                ErrorCode.DEGRADED,
                sanitize_error_message(exc, "Health status failed"),
            )
        return _json_response(result)

    @routes.get("/mjr/am/health/counters")
    async def health_counters(request):
        """Get database counters."""
        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)

        scope = (request.query.get("scope") or "output").strip().lower()
        custom_root_id = request.query.get("custom_root_id") or request.query.get("root_id") or None

        roots = None
        out_root = await _runtime_output_root(svc)
        if scope == "output":
            roots = [out_root]
        elif scope == "input":
            roots = [str(Path(folder_paths.get_input_directory()).resolve(strict=False))]
        elif scope == "all":
            roots = [
                out_root,
                str(Path(folder_paths.get_input_directory()).resolve(strict=False)),
            ]
        elif scope == "custom":
            root_result = resolve_custom_root(str(custom_root_id or ""))
            if not root_result.ok:
                return _json_response(Result.Err(ErrorCode.INVALID_INPUT, root_result.error))
            roots = [str(Path(str(root_result.data)).resolve(strict=False))]
        else:
            return _json_response(Result.Err(ErrorCode.INVALID_INPUT, f"Unknown scope: {scope}"))

        try:
            result = await asyncio.wait_for(svc['health'].get_counters(roots=roots), timeout=TO_THREAD_TIMEOUT_S)
        except asyncio.TimeoutError:
            result = Result.Err(ErrorCode.TIMEOUT, "Health counters timed out")
        except Exception as exc:
            result = Result.Err(
                ErrorCode.DEGRADED,
                sanitize_error_message(exc, "Health counters failed"),
            )
        if result.ok:
            if isinstance(result.data, dict):
                result.data["scope"] = scope
                if scope == "custom":
                    result.data["custom_root_id"] = custom_root_id
                try:
                    watcher = svc.get("watcher") if isinstance(svc, dict) else None
                    watcher_scope = svc.get("watcher_scope") if isinstance(svc, dict) else None
                    result.data["watcher"] = {
                        "enabled": bool(watcher is not None and getattr(watcher, "is_running", False)),
                        "directories": watcher.watched_directories if watcher else [],
                        "scope": (watcher_scope or {}).get("scope") if isinstance(watcher_scope, dict) else None,
                        "custom_root_id": (watcher_scope or {}).get("custom_root_id") if isinstance(watcher_scope, dict) else None,
                    }
                except Exception:
                    result.data["watcher"] = {"enabled": False, "directories": [], "scope": None, "custom_root_id": None}
        return _json_response(result)

    @routes.get("/mjr/am/health/db")
    async def health_db(request):
        """
        DB-focused diagnostics endpoint.

        Exposes explicit lock/corruption/recovery state so operators can diagnose
        reset/scan issues without parsing logs.
        """
        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)

        db = svc.get("db") if isinstance(svc, dict) else None
        if not db:
            return _json_response(Result.Err(ErrorCode.SERVICE_UNAVAILABLE, "Database service unavailable"))

        # Safe defaults if adapter doesn't expose diagnostics yet.
        diagnostics = {
            "locked": False,
            "malformed": False,
            "recovery_state": "unknown",
            "maintenance_active": is_db_maintenance_active(),
        }

        try:
            getter = getattr(db, "get_diagnostics", None)
            if callable(getter):
                payload = getter()
                if isinstance(payload, dict):
                    diagnostics = payload
                    diagnostics["maintenance_active"] = is_db_maintenance_active()
        except Exception as exc:
            diagnostics = {
                "locked": False,
                "malformed": False,
                "recovery_state": "unknown",
                "maintenance_active": is_db_maintenance_active(),
                "error": sanitize_error_message(exc, "Failed to read DB diagnostics"),
            }

        # Include quick liveness check for context.
        available = False
        error = None
        try:
            q = await db.aexecute("SELECT 1 as ok", fetch=True)
            available = bool(q.ok)
            if not q.ok:
                error = q.error
        except Exception as exc:
            available = False
            error = sanitize_error_message(exc, "DB liveness check failed")

        return _json_response(
            Result.Ok(
                {
                    "available": available,
                    "error": error,
                    "diagnostics": diagnostics,
                }
            )
        )

    @routes.get("/mjr/am/status")
    async def runtime_status(request):
        """
        Lightweight runtime status for diagnostics/dashboard.

        Returns:
        - SQLite active connections
        - enrichment queue length
        - watcher pending files
        """
        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)

        db = svc.get("db") if isinstance(svc, dict) else None
        index = svc.get("index") if isinstance(svc, dict) else None
        watcher = svc.get("watcher") if isinstance(svc, dict) else None

        db_status = {}
        try:
            get_db_status = getattr(db, "get_runtime_status", None)
            if callable(get_db_status):
                db_status = get_db_status() or {}
        except Exception:
            db_status = {}

        index_status = {}
        try:
            get_index_status = getattr(index, "get_runtime_status", None)
            if callable(get_index_status):
                index_status = get_index_status() or {}
        except Exception:
            index_status = {}

        watcher_pending = 0
        try:
            if watcher:
                get_pending = getattr(watcher, "get_pending_count", None)
                if callable(get_pending):
                    watcher_pending = int(get_pending() or 0)
        except Exception:
            watcher_pending = 0

        payload = {
            "db": db_status,
            "index": index_status,
            "watcher": {
                "enabled": bool(watcher is not None and getattr(watcher, "is_running", False)),
                "pending_files": int(watcher_pending),
            },
            "maintenance_active": is_db_maintenance_active(),
        }
        return _json_response(Result.Ok(payload))

    @routes.get("/mjr/am/config")
    async def get_config(request):
        """
        Get configuration (output directory, etc.).
        """
        svc, _ = await _require_services()
        
        probe_mode = MEDIA_PROBE_BACKEND
        output_root = await _runtime_output_root(svc)
        
        settings_service = None
        if svc:
            settings_service = svc.get("settings")
            if settings_service:
                try:
                    # FIX: await the async method
                    probe_mode = await settings_service.get_probe_backend()
                except Exception:
                    # fallback to defaults
                    pass
                    
        return _json_response(Result.Ok({
            "output_directory": output_root,
            "tool_paths": get_tool_paths(),
            "media_probe_backend": probe_mode,
            "metadata_fallback": (
                await settings_service.get_metadata_fallback_prefs()
                if (svc and settings_service)
                else {"image": True, "media": True}
            ),
        }))

    @routes.get("/mjr/am/settings/output-directory")
    async def get_output_directory_setting(request):
        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)
        settings_service = svc.get("settings")
        if not settings_service:
            return _json_response(Result.Err("SERVICE_UNAVAILABLE", "Settings service unavailable"))
        value = await settings_service.get_output_directory()
        return _json_response(Result.Ok({"output_directory": value or ""}))

    @routes.post("/mjr/am/settings/output-directory")
    async def update_output_directory_setting(request):
        csrf = _csrf_error(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))
        auth = _require_write_access(request)
        if not auth.ok:
            return _json_response(auth)
        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)
        settings_service = svc.get("settings")
        if not settings_service:
            return _json_response(Result.Err("SERVICE_UNAVAILABLE", "Settings service unavailable"))
        body_res = await _read_json(request)
        if not body_res.ok:
            return _json_response(body_res)
        body = body_res.data or {}
        raw_value = body.get("output_directory")
        value = "" if raw_value is None else str(raw_value).strip()
        result = await settings_service.set_output_directory(value)
        if not result.ok:
            return _json_response(result)
        return _json_response(Result.Ok({"output_directory": result.data}))

    @routes.post("/mjr/am/settings/probe-backend")
    async def update_probe_backend(request):
        """
        Update media probe backend preference (ExifTool, FFprobe, Both, Auto).
        """
        csrf = _csrf_error(request)
        if csrf:
            return _json_response(Result.Err(ErrorCode.CSRF, csrf))

        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)

        settings_service = svc.get("settings")
        if not settings_service:
            return _json_response(Result.Err(ErrorCode.SERVICE_UNAVAILABLE, "Settings service unavailable"))

        body_res = await _read_json(request)
        if not body_res.ok:
            return _json_response(body_res)
        body = body_res.data or {}

        mode = (body.get("mode") or body.get("media_probe_backend") or "").strip()
        if not mode:
            return _json_response(Result.Err("INVALID_INPUT", "Missing probe backend mode"))

        result = await settings_service.set_probe_backend(mode)
        if result.ok:
            return _json_response(Result.Ok({"media_probe_backend": result.data}))
        return _json_response(result)

    @routes.get("/mjr/am/settings/metadata-fallback")
    async def get_metadata_fallback_settings(request):
        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)

        settings_service = svc.get("settings")
        if not settings_service:
            return _json_response(Result.Err("SERVICE_UNAVAILABLE", "Settings service unavailable"))

        prefs = await settings_service.get_metadata_fallback_prefs()
        return _json_response(Result.Ok({"prefs": prefs}))

    @routes.post("/mjr/am/settings/metadata-fallback")
    async def update_metadata_fallback_settings(request):
        csrf = _csrf_error(request)
        if csrf:
            return _json_response(Result.Err(ErrorCode.CSRF, csrf))

        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)

        settings_service = svc.get("settings")
        if not settings_service:
            return _json_response(Result.Err(ErrorCode.SERVICE_UNAVAILABLE, "Settings service unavailable"))

        body_res = await _read_json(request)
        if not body_res.ok:
            return _json_response(body_res)
        body = body_res.data or {}

        image = body.get("image", None)
        media = body.get("media", None)
        if image is None and media is None:
            prefs = body.get("prefs") if isinstance(body.get("prefs"), dict) else {}
            image = prefs.get("image", None) if isinstance(prefs, dict) else None
            media = prefs.get("media", None) if isinstance(prefs, dict) else None

        result = await settings_service.set_metadata_fallback_prefs(image=image, media=media)
        if not result.ok:
            return _json_response(result)
        return _json_response(Result.Ok({"prefs": result.data or {}}))

    @routes.get("/mjr/am/settings/security")
    async def get_security_settings(request):
        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)

        settings_service = svc.get("settings")
        if not settings_service:
            return _json_response(Result.Err("SERVICE_UNAVAILABLE", "Settings service unavailable"))

        prefs = await settings_service.get_security_prefs()
        return _json_response(Result.Ok({"prefs": prefs}))

    @routes.post("/mjr/am/settings/security")
    async def update_security_settings(request):
        csrf = _csrf_error(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))

        auth = _require_write_access(request)
        if not auth.ok:
            return _json_response(auth)

        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)

        settings_service = svc.get("settings")
        if not settings_service:
            return _json_response(Result.Err("SERVICE_UNAVAILABLE", "Settings service unavailable"))

        body_res = await _read_json(request)
        if not body_res.ok:
            return _json_response(body_res)
        body = body_res.data or {}

        prefs = {}
        for key in SECURITY_PREF_KEYS:
            if key in body:
                prefs[key] = parse_bool(body[key], False)
        if not prefs:
            return _json_response(Result.Err("INVALID_INPUT", "No security settings provided"))

        result = await settings_service.set_security_prefs(prefs)
        if result.ok:
            current_prefs = result.data or (await settings_service.get_security_prefs())
            return _json_response(Result.Ok({"prefs": current_prefs}))
        return _json_response(result)

    @routes.get("/mjr/am/tools/status")
    async def tools_status(request):
        """
        Get status of external tools (ExifTool, FFprobe).
        Returns availability and version info.
        """
        status = get_tool_status()
        return _json_response(Result.Ok(status))

    @routes.get("/mjr/am/roots")
    async def get_roots(request):
        """
        Get core roots and custom roots.
        """
        from mjr_am_backend.custom_roots import list_custom_roots

        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)

        roots = {
            "output_directory": await _runtime_output_root(svc),
            "input_directory": str(Path(folder_paths.get_input_directory()).resolve()),
        }

        custom = list_custom_roots()
        if custom.ok:
            roots["custom_roots"] = custom.data
        else:
            roots["custom_roots"] = []
            roots["custom_roots_error"] = custom.error

        return _json_response(Result.Ok(roots))

