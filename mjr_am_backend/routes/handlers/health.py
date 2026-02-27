"""
Health check endpoints.
"""
import asyncio
import hashlib
import os
import re
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

from mjr_am_backend.config import (
    MEDIA_PROBE_BACKEND,
    OUTPUT_ROOT,
    TO_THREAD_TIMEOUT_S,
    get_tool_paths,
)
from mjr_am_backend.custom_roots import resolve_custom_root
from mjr_am_backend.shared import ErrorCode, Result, get_logger, sanitize_error_message
from mjr_am_backend.tool_detect import get_tool_status
from mjr_am_backend.utils import parse_bool

from ..core import (
    _csrf_error,
    _has_configured_write_token,
    _is_loopback_request,
    _json_response,
    _read_json,
    _require_authenticated_user,
    _require_services,
    _require_write_access,
)
from ..core.security import _refresh_trusted_proxy_cache, _request_transport_is_secure, _safe_mode_enabled
from .db_maintenance import is_db_maintenance_active

SECURITY_PREF_KEYS = {
    "safe_mode",
    "allow_write",
    "allow_remote_write",
    "allow_delete",
    "allow_rename",
    "allow_open_in_folder",
    "allow_reset_index",
    "api_token",
}
_VALID_PROBE_MODES = {"auto", "exiftool", "ffprobe", "both"}
_CUSTOM_ROOT_ID_RE = re.compile(r"^[A-Za-z0-9._-]{1,128}$")
_WRITE_TOKEN_COOKIE_NAME = "mjr_write_token"
logger = get_logger(__name__)


def _extract_probe_mode(body: dict) -> str:
    raw_mode = body.get("mode") or body.get("media_probe_backend") or ""
    mode = str(raw_mode).strip().lower()
    return mode if mode in _VALID_PROBE_MODES else ""


def _hash_api_token(token: str) -> str:
    try:
        normalized = str(token or "").strip()
    except Exception:
        normalized = ""
    try:
        pepper = str(os.environ.get("MAJOOR_API_TOKEN_PEPPER") or "").strip()
    except Exception:
        pepper = ""
    payload = f"{pepper}\0{normalized}".encode("utf-8", errors="ignore")
    return hashlib.sha256(payload).hexdigest()


def _is_valid_custom_root_id(value: object) -> bool:
    try:
        return bool(_CUSTOM_ROOT_ID_RE.match(str(value or "")))
    except Exception:
        return False


def _is_secure_request_transport(request: web.Request) -> bool:
    try:
        peer = str(getattr(request, "remote", "") or "").strip()
    except Exception:
        peer = ""
    if not peer:
        try:
            peer = str(getattr(request.transport, "get_extra_info", lambda *_args, **_kwargs: None)("peername") or "")
        except Exception:
            peer = ""
    try:
        scheme = str(getattr(request, "scheme", "") or "").strip().lower()
    except Exception:
        scheme = ""
    try:
        headers = request.headers
    except Exception:
        headers = {}
    return bool(_request_transport_is_secure(peer_ip=peer, headers=headers, request_scheme=scheme))


def _bootstrap_enabled() -> bool:
    try:
        raw = str(os.environ.get("MAJOOR_ALLOW_BOOTSTRAP") or "").strip().lower()
    except Exception:
        raw = ""
    return raw in {"1", "true", "yes", "on"}


def _should_expose_token_response() -> bool:
    try:
        raw = str(os.environ.get("MAJOOR_EXPOSE_TOKEN_IN_RESPONSE") or "").strip().lower()
    except Exception:
        raw = ""
    return raw in {"1", "true", "yes", "on"}


def _token_hint(token: object) -> str:
    normalized = str(token or "").strip()
    if not normalized:
        return ""
    tail = normalized[-4:] if len(normalized) >= 4 else normalized
    return f"...{tail}"


def _set_write_token_cookie(response: web.StreamResponse, request: web.Request, token: str) -> None:
    normalized = str(token or "").strip()
    if not normalized:
        return
    try:
        scheme = str(getattr(request, "scheme", "") or "").strip().lower()
    except Exception:
        scheme = ""
    secure_cookie = scheme == "https"
    try:
        response.set_cookie(
            _WRITE_TOKEN_COOKIE_NAME,
            normalized,
            httponly=True,
            samesite="Strict",
            secure=secure_cookie,
            path="/",
        )
    except Exception:
        return


def _extract_metadata_fallback_payload(body: dict) -> tuple[object | None, object | None]:
    image = body.get("image", None)
    media = body.get("media", None)
    if image is not None or media is not None:
        return image, media
    prefs = body.get("prefs") if isinstance(body.get("prefs"), dict) else {}
    image = prefs.get("image", None) if isinstance(prefs, dict) else None
    media = prefs.get("media", None) if isinstance(prefs, dict) else None
    return image, media


def _build_security_prefs(body: dict) -> dict[str, object]:
    prefs: dict[str, object] = {}
    for key in SECURITY_PREF_KEYS:
        if key not in body:
            continue
        if key == "api_token":
            token = str(body[key] or "").strip()
            if token:
                prefs["api_token_hash"] = _hash_api_token(token)
        else:
            prefs[key] = parse_bool(body[key], False)
    if "apiToken" in body and "api_token_hash" not in prefs:
        token = str(body.get("apiToken") or "").strip()
        if token:
            prefs["api_token_hash"] = _hash_api_token(token)
    return prefs


def _safe_runtime_status(service: object) -> dict:
    try:
        getter = getattr(service, "get_runtime_status", None)
        if callable(getter):
            payload = getter()
            if isinstance(payload, dict):
                return payload
    except Exception:
        pass
    return {}


def _safe_watcher_pending_count(watcher: object) -> int:
    try:
        get_pending = getattr(watcher, "get_pending_count", None)
        if callable(get_pending):
            return int(get_pending() or 0)
    except Exception:
        pass
    return 0


def _runtime_status_payload(db: object, index: object, watcher: object) -> dict:
    return {
        "db": _safe_runtime_status(db),
        "index": _safe_runtime_status(index),
        "watcher": {
            "enabled": bool(watcher is not None and getattr(watcher, "is_running", False)),
            "pending_files": _safe_watcher_pending_count(watcher),
        },
        "maintenance_active": is_db_maintenance_active(),
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
            if not _is_valid_custom_root_id(custom_root_id):
                return _json_response(Result.Err(ErrorCode.INVALID_INPUT, "Invalid custom_root_id"))
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
                    index_svc = svc.get("index") if isinstance(svc, dict) else None
                    if index_svc and hasattr(index_svc, "get_runtime_status"):
                        idx_rt = index_svc.get_runtime_status() or {}
                        result.data["enrichment_queue_length"] = int(idx_rt.get("enrichment_queue_length") or 0)
                except Exception:
                    result.data["enrichment_queue_length"] = 0
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

        payload = _runtime_status_payload(db, index, watcher)
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
        if value:
            try:
                normalized_path = Path(value).expanduser().resolve(strict=True)
            except Exception:
                return _json_response(Result.Err("INVALID_INPUT", "output_directory must be an existing directory"))
            if not normalized_path.is_dir():
                return _json_response(Result.Err("INVALID_INPUT", "output_directory must be a directory"))
            value = str(normalized_path)
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
        auth = _require_write_access(request)
        if not auth.ok:
            return _json_response(auth)

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

        mode = _extract_probe_mode(body)
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
        auth = _require_write_access(request)
        if not auth.ok:
            return _json_response(auth)

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

        image, media = _extract_metadata_fallback_payload(body)

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

        prefs = await settings_service.get_security_prefs(include_secret=False)
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

        prefs = _build_security_prefs(body)
        if not prefs:
            return _json_response(Result.Err("INVALID_INPUT", "No security settings provided"))

        result = await settings_service.set_security_prefs(prefs)
        if result.ok:
            try:
                _safe_mode_enabled.cache_clear()
            except Exception:
                pass
            try:
                _refresh_trusted_proxy_cache()
            except Exception:
                pass
            current_prefs = result.data or (await settings_service.get_security_prefs())
            return _json_response(Result.Ok({"prefs": current_prefs}))
        return _json_response(result)

    @routes.post("/mjr/am/settings/security/rotate-token")
    async def rotate_security_token(request):
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
        if not _is_secure_request_transport(request):
            return _json_response(
                Result.Err(
                    "FORBIDDEN",
                    "Token rotation response is only allowed over HTTPS or loopback transport.",
                )
            )

        result = await settings_service.rotate_api_token()
        if not result.ok:
            return _json_response(result)
        token = str((result.data or {}).get("api_token") or "").strip()
        if _is_loopback_request(request):
            try:
                scheme = str(getattr(request, "scheme", "") or "").strip().lower()
            except Exception:
                scheme = ""
            if scheme != "https":
                logger.warning("Token rotation requested over plain HTTP loopback transport.")
        payload = {"token_hint": _token_hint(token)}
        if token and _should_expose_token_response():
            payload["token"] = token
        response = _json_response(Result.Ok(payload))
        _set_write_token_cookie(response, request, token)
        return response

    @routes.post("/mjr/am/settings/security/bootstrap-token")
    async def bootstrap_security_token(request):
        csrf = _csrf_error(request)
        if csrf:
            return _json_response(Result.Err("CSRF", csrf))

        is_loopback = _is_loopback_request(request)

        # Remote requests must explicitly opt-in via MAJOOR_ALLOW_BOOTSTRAP=1.
        # Loopback is always allowed: only local processes can reach it, and the
        # auto-generated session token must be deliverable without user configuration.
        if not is_loopback and not _bootstrap_enabled():
            return _json_response(
                Result.Err(
                    "BOOTSTRAP_DISABLED",
                    "Bootstrap token is disabled. Set MAJOOR_ALLOW_BOOTSTRAP=1 for initial token provisioning.",
                )
            )

        auth = _require_write_access(request)
        if not auth.ok:
            if not is_loopback:
                return _json_response(auth)
            user_auth = _require_authenticated_user(request)
            auth_mode = str((user_auth.meta or {}).get("auth_mode") or "").strip().lower()
            if not (user_auth.ok and auth_mode == "comfy_user"):
                return _json_response(
                    Result.Err(
                        "AUTH_REQUIRED",
                        "Bootstrap requires an authenticated ComfyUI user on loopback when API token auth is unavailable.",
                    )
                )

        # Remote: block when a persistent token is already configured (use rotate-token instead).
        # Loopback: always deliver the session token — the user never configured it manually.
        if not is_loopback and _has_configured_write_token():
            return _json_response(
                Result.Err(
                    "FORBIDDEN",
                    "Bootstrap token is disabled when an API token is already configured. Use rotate-token instead.",
                )
            )

        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)

        settings_service = svc.get("settings")
        if not settings_service:
            return _json_response(Result.Err("SERVICE_UNAVAILABLE", "Settings service unavailable"))
        if not _is_secure_request_transport(request):
            return _json_response(
                Result.Err(
                    "FORBIDDEN",
                    "Token bootstrap response is only allowed over HTTPS or loopback transport.",
                )
            )

        result = await settings_service.bootstrap_api_token()
        if not result.ok:
            return _json_response(result)
        token = str((result.data or {}).get("api_token") or "").strip()
        if is_loopback:
            try:
                scheme = str(getattr(request, "scheme", "") or "").strip().lower()
            except Exception:
                scheme = ""
            if scheme != "https":
                logger.warning("Token bootstrap requested over plain HTTP loopback transport.")
        payload = {"token_hint": _token_hint(token)}
        # Include plain token in body for loopback: only local processes can reach loopback,
        # so returning the token in the JSON body is safe and allows the frontend to cache
        # it in sessionStorage without any user action.
        if token and (is_loopback or _should_expose_token_response()):
            payload["token"] = token
        response = _json_response(Result.Ok(payload))
        _set_write_token_cookie(response, request, token)
        return response

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
