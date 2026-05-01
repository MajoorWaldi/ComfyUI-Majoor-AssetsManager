"""
Application settings persisted in the local metadata store.

Cache strategy
--------------
Settings reads are cached in a bounded ``_VersionedTTLCache`` (maxsize=256,
TTL=10 s).  Each entry is tagged with a per-scope *settings version* counter
so that writes on any node/process invalidate stale reads within the TTL
window.  The version counter itself is cached for 1 s to avoid hitting the
DB on every read.  Expired and over-capacity entries are evicted lazily on
the next ``get`` or ``put`` call — no background thread is required.
"""
from __future__ import annotations

import asyncio
import hashlib
import os
import re
import secrets
import time
from collections.abc import Mapping
from typing import Any

from .config import (
    _OUTPUT_DIR_OVERRIDE_FILE_PATH,
    MEDIA_PROBE_BACKEND,
    OUTPUT_ROOT,
    is_execution_grouping_enabled,
    is_vector_caption_on_index_enabled,
    is_vector_search_enabled,
)
from .shared import Result, get_logger
from .startup_logging import startup_log_info
from .utils import env_bool, parse_bool

logger = get_logger(__name__)

_PROBE_BACKEND_KEY = "media_probe_backend"
_OUTPUT_DIRECTORY_KEY = "output_directory_override"
_METADATA_FALLBACK_IMAGE_KEY = "metadata_fallback_image"
_METADATA_FALLBACK_MEDIA_KEY = "metadata_fallback_media"
_VECTOR_SEARCH_ENABLED_KEY = "vector_search_enabled"
_VECTOR_CAPTION_ON_INDEX_KEY = "vector_caption_on_index"
_EXECUTION_GROUPING_ENABLED_KEY = "execution_grouping_enabled"
_HUGGINGFACE_TOKEN_KEY = "huggingface_token"
_AI_VERBOSE_LOGS_KEY = "ai_verbose_logs"
_ROUTE_VERBOSE_LOGS_KEY = "route_verbose_logs"
_STARTUP_VERBOSE_LOGS_KEY = "startup_verbose_logs"
_LTXAV_RGB_FALLBACK_ENABLED_KEY = "ltxav_rgb_fallback_enabled"
_SETTINGS_VERSION_KEY = "__settings_version"
_SECURITY_API_TOKEN_KEY = "security_api_token"
_SECURITY_API_TOKEN_HASH_KEY = "security_api_token_hash"
_VALID_PROBE_MODES = {"auto", "exiftool", "ffprobe", "both"}
_SECURITY_PREFS_INFO: Mapping[str, dict[str, bool | str]] = {
    "safe_mode": {"env": "MAJOOR_SAFE_MODE", "default": True},
    "allow_write": {"env": "MAJOOR_ALLOW_WRITE", "default": False},
    "require_auth": {"env": "MAJOOR_REQUIRE_AUTH", "default": False},
    # Remote write/bootstrap and HTTP token delivery are opt-in. Loopback remains
    # convenient, while LAN/public exposure requires an explicit operator choice.
    "allow_remote_write": {"env": "MAJOOR_ALLOW_REMOTE_WRITE", "default": False},
    "allow_insecure_token_transport": {
        "env": "MAJOOR_ALLOW_INSECURE_TOKEN_TRANSPORT",
        "default": False,
    },
    "allow_delete": {"env": "MAJOOR_ALLOW_DELETE", "default": False},
    "allow_rename": {"env": "MAJOOR_ALLOW_RENAME", "default": False},
    "allow_open_in_folder": {"env": "MAJOOR_ALLOW_OPEN_IN_FOLDER", "default": False},
    "allow_reset_index": {"env": "MAJOOR_ALLOW_RESET_INDEX", "default": False},
}

_SETTINGS_CACHE_TTL_S = 10.0
_VERSION_CACHE_TTL_S = 1.0
_MS_PER_S = 1000.0
_ORIGINAL_OUTPUT_DIRECTORY_ENV = "MAJOOR_ORIGINAL_OUTPUT_DIRECTORY"
_USER_SCOPE_PREFIX = "__user__"
_USER_SCOPE_SEGMENT_RE = re.compile(r"^[A-Za-z0-9._-]{1,128}$")

# Frontend-consumed default settings payload (kept for cross-layer parity).
DEFAULT_SETTINGS: dict[str, Any] = {
    "ui": {
        "cardHoverColor": "#3d3d3d",
        "cardSelectionColor": "#4a90e2",
        "ratingColor": "#ff9500",
        "tagColor": "#4a90e2",
    }
}

_USER_SCOPED_SETTING_KEYS = frozenset(
    {
        *_SECURITY_PREFS_INFO.keys(),
        _PROBE_BACKEND_KEY,
        _METADATA_FALLBACK_IMAGE_KEY,
        _METADATA_FALLBACK_MEDIA_KEY,
    }
)


class _VersionedTTLCache:
    """Bounded TTL + version-aware cache.

    Entries expire after *ttl_s* seconds **or** when the stored version no
    longer matches the current version supplied at read time.  The cache
    automatically evicts stale entries and never grows beyond *maxsize*.
    """

    __slots__ = ("_data", "_maxsize", "_ttl_s")

    def __init__(self, *, ttl_s: float, maxsize: int = 256) -> None:
        self._data: dict[str, tuple[str, float, int]] = {}
        self._maxsize = max(1, maxsize)
        self._ttl_s = max(0.0, ttl_s)

    def get(self, key: str, *, version: int | None = None) -> str | None:
        entry = self._data.get(key)
        if entry is None:
            return None
        value, ts, ver = entry
        if version is not None and ver != version:
            self._data.pop(key, None)
            return None
        if (time.monotonic() - ts) >= self._ttl_s:
            self._data.pop(key, None)
            return None
        return value

    def put(self, key: str, value: str, *, version: int) -> None:
        if len(self._data) >= self._maxsize and key not in self._data:
            self._evict_oldest()
        self._data[key] = (value, time.monotonic(), version)

    def _evict_oldest(self) -> None:
        now = time.monotonic()
        # First pass: remove expired entries.
        expired = [k for k, (_, ts, _) in self._data.items() if (now - ts) >= self._ttl_s]
        for k in expired:
            self._data.pop(k, None)
        # Still full? Remove the oldest entry.
        if len(self._data) >= self._maxsize and self._data:
            oldest_key = min(self._data, key=lambda k: self._data[k][1])
            self._data.pop(oldest_key, None)


class AppSettings:
    """
    Simple settings manager backed by the metadata table.
    """

    def __init__(self, db) -> None:
        self._db = db
        self._lock = asyncio.Lock()
        self._cache = _VersionedTTLCache(ttl_s=_SETTINGS_CACHE_TTL_S, maxsize=256)
        self._cache_ttl_s = _SETTINGS_CACHE_TTL_S
        self._version_cache_ttl_s = _VERSION_CACHE_TTL_S
        self._version_cached: dict[str, int] = {}
        self._version_cached_at: dict[str, float] = {}
        self._default_probe_mode = MEDIA_PROBE_BACKEND
        self._default_metadata_fallback_image = True
        self._default_metadata_fallback_media = True
        self._default_vector_search_enabled = bool(is_vector_search_enabled())
        self._default_vector_caption_on_index = bool(is_vector_caption_on_index_enabled())
        self._default_execution_grouping_enabled = bool(is_execution_grouping_enabled())
        self._default_ai_verbose_logs = self._env_ai_verbose_logs_enabled()
        self._default_route_verbose_logs = self._env_route_verbose_logs_enabled()
        self._default_startup_verbose_logs = self._env_startup_verbose_logs_enabled()
        self._default_ltxav_rgb_fallback_enabled = self._env_ltxav_rgb_fallback_enabled()
        self._runtime_api_token: str = ""
        self._runtime_api_token_hash: str = ""

    @staticmethod
    def _current_request_user_id() -> str:
        try:
            from .routes.core import _current_user_id

            return str(_current_user_id() or "").strip()
        except Exception:
            return ""

    def _effective_user_id(self, user_id: str | None = None) -> str:
        explicit = str(user_id or "").strip()
        if explicit:
            return explicit
        return self._current_request_user_id()

    @staticmethod
    def _safe_user_scope_segment(user_id: str) -> str:
        normalized = str(user_id or "").strip()
        if not normalized:
            return ""
        if _USER_SCOPE_SEGMENT_RE.match(normalized):
            return normalized
        return hashlib.sha256(normalized.encode("utf-8", errors="ignore")).hexdigest()

    def _storage_key(self, key: str, *, user_scoped: bool = False, user_id: str | None = None) -> str:
        if not user_scoped:
            return key
        effective_user_id = self._effective_user_id(user_id)
        if not effective_user_id or key not in _USER_SCOPED_SETTING_KEYS:
            return key
        return f"{_USER_SCOPE_PREFIX}:{self._safe_user_scope_segment(effective_user_id)}:{key}"

    def _read_candidate_keys(self, key: str, *, user_scoped: bool = False, user_id: str | None = None) -> tuple[str, ...]:
        storage_key = self._storage_key(key, user_scoped=user_scoped, user_id=user_id)
        if storage_key == key:
            return (key,)
        return (storage_key, key)

    def _settings_version_read_keys(self, *, user_scoped: bool = False, user_id: str | None = None) -> tuple[str, ...]:
        if not user_scoped:
            return (_SETTINGS_VERSION_KEY,)
        effective_user_id = self._effective_user_id(user_id)
        if not effective_user_id:
            return (_SETTINGS_VERSION_KEY,)
        return (
            f"{_USER_SCOPE_PREFIX}:{self._safe_user_scope_segment(effective_user_id)}:{_SETTINGS_VERSION_KEY}",
            _SETTINGS_VERSION_KEY,
        )

    def _settings_version_write_key(self, *, user_scoped: bool = False, user_id: str | None = None) -> str:
        return self._settings_version_read_keys(user_scoped=user_scoped, user_id=user_id)[0]

    def _generate_api_token(self) -> str:
        # 256-bit token (URL-safe) for write authorization.
        return secrets.token_urlsafe(32)

    def _token_pepper(self) -> str:
        try:
            return str(os.environ.get("MAJOOR_API_TOKEN_PEPPER") or "").strip()
        except Exception:
            return ""

    def _hash_api_token(self, token: str) -> str:
        """
        Derive a stable, computationally expensive hash for the API token.

        Uses PBKDF2-HMAC-SHA256 with a pepper from the environment as salt,
        so the resulting value can be safely stored and compared.
        """
        try:
            normalized = str(token or "").strip()
        except Exception:
            normalized = ""
        pepper = self._token_pepper()
        # Fall back to a fixed, non-empty pepper to ensure a stable salt value.
        if not pepper:
            pepper = "mjr_api_token_pepper_fallback"
        dk = hashlib.pbkdf2_hmac(
            "sha256",
            normalized.encode("utf-8", errors="ignore"),
            pepper.encode("utf-8", errors="ignore"),
            100_000,
        )
        return dk.hex()

    async def _get_stored_api_token_hash_locked(self) -> str:
        token_hash = str(await self._read_setting(_SECURITY_API_TOKEN_HASH_KEY) or "").strip().lower()
        if token_hash:
            return token_hash
        legacy_token = str(await self._read_setting(_SECURITY_API_TOKEN_KEY) or "").strip()
        if not legacy_token:
            return ""
        token_hash = self._hash_api_token(legacy_token)
        write_res = await self._write_setting(_SECURITY_API_TOKEN_HASH_KEY, token_hash)
        if not write_res.ok:
            logger.warning("Failed to migrate legacy API token to hash: %s", write_res.error)
            return ""
        return token_hash

    async def _get_stored_api_token_plain_locked(self, expected_hash: str = "") -> str:
        token = str(await self._read_setting(_SECURITY_API_TOKEN_KEY) or "").strip()
        if not token:
            return ""
        if expected_hash:
            try:
                if self._hash_api_token(token).lower() != str(expected_hash or "").strip().lower():
                    return ""
            except Exception:
                return ""
        return token

    async def _get_or_create_api_token_locked(self) -> str:
        runtime_token = str(self._runtime_api_token or "").strip()
        runtime_hash = str(self._runtime_api_token_hash or "").strip().lower()
        if runtime_token and runtime_hash:
            return runtime_token

        token = self._env_api_token()
        if token:
            token_hash = await self._persist_api_token_hash_with_warning(token, "Failed to persist API token hash")
            self._set_runtime_api_token(token, token_hash)
            self._set_api_token_env(token, token_hash, include_plain=False)
            return token

        token_hash = await self._get_stored_api_token_hash_locked()
        if token_hash:
            token = await self._get_stored_api_token_plain_locked(token_hash)
            self._set_runtime_api_token(token, token_hash)
            self._set_api_token_env(token, token_hash, include_plain=False)
            return token

        # Auto-generate a session token.
        # Not persisted to DB, not injected into env — this keeps loopback connections
        # accessible without any token by default (no user action required).
        # The token is held in memory only and delivered to the frontend via the
        # bootstrap endpoint on loopback, which caches it in sessionStorage.
        token = self._generate_api_token()
        token_hash = self._hash_api_token(token)
        self._set_runtime_api_token(token, token_hash)
        return token

    def _env_api_token(self) -> str:
        try:
            return (os.environ.get("MAJOOR_API_TOKEN") or os.environ.get("MJR_API_TOKEN") or "").strip()
        except Exception:
            return ""

    def _env_huggingface_token(self) -> str:
        try:
            return (
                os.environ.get("HF_TOKEN")
                or os.environ.get("HUGGING_FACE_HUB_TOKEN")
                or os.environ.get("HUGGINGFACEHUB_API_TOKEN")
                or os.environ.get("MAJOOR_HF_TOKEN")
                or os.environ.get("MJR_AM_HF_TOKEN")
                or ""
            ).strip()
        except Exception:
            return ""

    @staticmethod
    def _env_ai_verbose_logs_enabled() -> bool:
        try:
            raw = (
                os.environ.get("MAJOOR_AI_VERBOSE_LOGS")
                or os.environ.get("MJR_AM_AI_VERBOSE_LOGS")
                or os.environ.get("MAJOOR_VERBOSE_AI_LOGS")
                or os.environ.get("MJR_AM_VERBOSE_AI_LOGS")
                or ""
            )
        except Exception:
            raw = ""
        return parse_bool(raw, False)

    @staticmethod
    def _env_route_verbose_logs_enabled() -> bool:
        try:
            raw = (
                os.environ.get("MAJOOR_ROUTE_VERBOSE_LOGS")
                or os.environ.get("MJR_AM_ROUTE_VERBOSE_LOGS")
                or os.environ.get("MAJOOR_VERBOSE_ROUTE_LOGS")
                or os.environ.get("MJR_AM_VERBOSE_ROUTE_LOGS")
                or ""
            )
        except Exception:
            raw = ""
        return parse_bool(raw, False)

    @staticmethod
    def _env_startup_verbose_logs_enabled() -> bool:
        try:
            raw = (
                os.environ.get("MAJOOR_STARTUP_VERBOSE_LOGS")
                or os.environ.get("MJR_AM_STARTUP_VERBOSE_LOGS")
                or os.environ.get("MAJOOR_VERBOSE_STARTUP_LOGS")
                or os.environ.get("MJR_AM_VERBOSE_STARTUP_LOGS")
                or ""
            )
        except Exception:
            raw = ""
        return parse_bool(raw, False)

    @staticmethod
    def _env_ltxav_rgb_fallback_enabled() -> bool:
        try:
            raw = (
                os.environ.get("MJR_ENABLE_LTXAV_RGB_FALLBACK")
                or os.environ.get("MAJOOR_ENABLE_LTXAV_RGB_FALLBACK")
                or ""
            )
        except Exception:
            raw = ""
        return parse_bool(raw, False)

    @staticmethod
    def _set_huggingface_token_env(token: str) -> None:
        normalized = str(token or "").strip()
        try:
            if normalized:
                os.environ["HF_TOKEN"] = normalized
                os.environ["HUGGING_FACE_HUB_TOKEN"] = normalized
                os.environ["HUGGINGFACEHUB_API_TOKEN"] = normalized
                os.environ["MAJOOR_HF_TOKEN"] = normalized
                os.environ["MJR_AM_HF_TOKEN"] = normalized
            else:
                os.environ.pop("HF_TOKEN", None)
                os.environ.pop("HUGGING_FACE_HUB_TOKEN", None)
                os.environ.pop("HUGGINGFACEHUB_API_TOKEN", None)
                os.environ.pop("MAJOOR_HF_TOKEN", None)
                os.environ.pop("MJR_AM_HF_TOKEN", None)
        except Exception:
            return

    @staticmethod
    def _token_hint(token: str) -> str:
        normalized = str(token or "").strip()
        if not normalized:
            return ""
        tail = normalized[-4:] if len(normalized) >= 4 else normalized
        return f"...{tail}"

    def _env_api_token_hash(self) -> str:
        try:
            return (
                os.environ.get("MAJOOR_API_TOKEN_HASH")
                or os.environ.get("MJR_API_TOKEN_HASH")
                or ""
            ).strip().lower()
        except Exception:
            return ""

    async def _get_security_token_status_locked(self) -> tuple[bool, str]:
        plain_token = self._env_api_token()
        configured_hash = self._hash_api_token(plain_token) if plain_token else self._env_api_token_hash()
        if not configured_hash:
            configured_hash = await self._get_stored_api_token_hash_locked()
        if not plain_token and configured_hash:
            runtime_token = str(self._runtime_api_token or "").strip()
            runtime_hash = str(self._runtime_api_token_hash or "").strip().lower()
            if runtime_token and runtime_hash == configured_hash:
                plain_token = runtime_token
            else:
                plain_token = await self._get_stored_api_token_plain_locked(configured_hash)
        return bool(configured_hash), self._token_hint(plain_token)

    async def _persist_api_token_hash_with_warning(self, token: str, warning_message: str) -> str:
        token_hash = self._hash_api_token(token)
        write_res = await self._write_setting(_SECURITY_API_TOKEN_HASH_KEY, token_hash)
        if not write_res.ok:
            logger.warning("%s: %s", warning_message, write_res.error)
        return token_hash

    def _set_runtime_api_token(self, token: str, token_hash: str) -> None:
        try:
            self._runtime_api_token = str(token or "").strip()
        except Exception:
            self._runtime_api_token = ""
        try:
            self._runtime_api_token_hash = str(token_hash or "").strip().lower()
        except Exception:
            self._runtime_api_token_hash = ""

    @staticmethod
    def _set_api_token_env(token: str, token_hash: str, *, include_plain: bool) -> None:
        try:
            if include_plain:
                os.environ["MAJOOR_API_TOKEN"] = token
                os.environ["MJR_API_TOKEN"] = token
            else:
                os.environ.pop("MAJOOR_API_TOKEN", None)
                os.environ.pop("MJR_API_TOKEN", None)
            os.environ["MAJOOR_API_TOKEN_HASH"] = token_hash
            os.environ["MJR_API_TOKEN_HASH"] = token_hash
        except Exception:
            pass

    async def _read_setting_exact(self, key: str) -> str | None:
        result = await self._db.aquery("SELECT value FROM metadata WHERE key = ?", (key,))
        if not result.ok or not result.data:
            return None
        raw = result.data[0].get("value")
        if isinstance(raw, str):
            return raw.strip()
        return None

    async def _read_setting(self, key: str, *, user_scoped: bool = False, user_id: str | None = None) -> str | None:
        for storage_key in self._read_candidate_keys(key, user_scoped=user_scoped, user_id=user_id):
            raw = await self._read_setting_exact(storage_key)
            if raw is not None:
                return raw
        return None

    async def _write_setting_exact(self, key: str, value: str) -> Result[str]:
        return await self._db.aexecute(
            "INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)",
            (key, value),
        )

    async def _write_setting(self, key: str, value: str, *, user_scoped: bool = False, user_id: str | None = None) -> Result[str]:
        storage_key = self._storage_key(key, user_scoped=user_scoped, user_id=user_id)
        return await self._write_setting_exact(storage_key, value)

    async def _delete_setting_exact(self, key: str) -> Result[str]:
        return await self._db.aexecute("DELETE FROM metadata WHERE key = ?", (key,))

    async def _delete_setting(self, key: str, *, user_scoped: bool = False, user_id: str | None = None) -> Result[str]:
        storage_key = self._storage_key(key, user_scoped=user_scoped, user_id=user_id)
        return await self._delete_setting_exact(storage_key)

    async def ensure_security_bootstrap(self) -> None:
        """
        Ensure write-token security is initialized at startup.
        """
        async with self._lock:
            await self._get_or_create_api_token_locked()
            try:
                prefs = await self._get_security_prefs_locked(include_secret=False)
                self._publish_security_prefs_snapshot(prefs)
            except Exception as exc:
                logger.debug("Failed to hydrate security prefs snapshot: %s", exc)

    @staticmethod
    def _publish_security_prefs_snapshot(prefs: Mapping[str, Any] | None) -> None:
        if not prefs:
            return
        try:
            from .routes.core.security_prefs_snapshot import update_security_prefs_snapshot

            update_security_prefs_snapshot(prefs)
        except Exception as exc:
            logger.debug("Failed to publish security prefs snapshot: %s", exc)

    async def _get_security_prefs_locked(self, *, include_secret: bool = False) -> dict[str, Any]:
        output: dict[str, Any] = {}
        for key, info in _SECURITY_PREFS_INFO.items():
            raw = await self._read_setting(key, user_scoped=False)
            if raw is not None:
                output[key] = parse_bool(raw, bool(info.get("default", False)))
            else:
                default = bool(info.get("default", False))
                env_var = str(info.get("env") or "")
                output[key] = env_bool(env_var, default)
        token_configured, token_hint = await self._get_security_token_status_locked()
        output["token_configured"] = token_configured
        if token_hint:
            output["token_hint"] = token_hint
        if include_secret:
            output["api_token"] = await self._get_or_create_api_token_locked()
        return output

    async def get_security_prefs(self, *, include_secret: bool = False) -> dict[str, Any]:
        async with self._lock:
            return await self._get_security_prefs_locked(include_secret=include_secret)

    async def set_security_prefs(self, prefs: Mapping[str, Any]) -> Result[dict[str, Any]]:
        to_write = self._extract_security_prefs_to_write(prefs)
        token_in_payload = self._extract_token_from_prefs_payload(prefs)
        token_hash_in_payload = self._extract_token_hash_from_prefs_payload(prefs)
        if not to_write and token_in_payload is None and token_hash_in_payload is None:
            return Result.Err("INVALID_INPUT", "No security settings provided")
        async with self._lock:
            write_err = await self._persist_security_pref_flags(to_write)
            if write_err is not None:
                return write_err
            if token_hash_in_payload is not None:
                token_err = await self._persist_security_api_token_hash(token_hash_in_payload)
                if token_err is not None:
                    return token_err
            elif token_in_payload is not None:
                token_err = await self._persist_security_api_token(token_in_payload)
                if token_err is not None:
                    return token_err
            await self._warn_if_bump_fails("Failed to bump settings version")
            current = await self._get_security_prefs_locked(include_secret=False)
            self._publish_security_prefs_snapshot(current)
            return Result.Ok(current)

    def _extract_security_prefs_to_write(self, prefs: Mapping[str, Any]) -> dict[str, bool]:
        to_write: dict[str, bool] = {}
        for key in _SECURITY_PREFS_INFO:
            if key in prefs:
                to_write[key] = parse_bool(prefs[key], False)
        return to_write

    def _extract_token_from_prefs_payload(self, prefs: Mapping[str, Any]) -> Any:
        if isinstance(prefs, Mapping) and "api_token" in prefs:
            return prefs.get("api_token")
        if isinstance(prefs, Mapping) and "apiToken" in prefs:
            return prefs.get("apiToken")
        return None

    def _extract_token_hash_from_prefs_payload(self, prefs: Mapping[str, Any]) -> str | None:
        if not isinstance(prefs, Mapping):
            return None
        raw = prefs.get("api_token_hash")
        if raw is None:
            return None
        value = str(raw or "").strip().lower()
        if len(value) != 64:
            return None
        if any(ch not in "0123456789abcdef" for ch in value):
            return None
        return value

    async def _persist_security_pref_flags(
        self,
        to_write: Mapping[str, bool],
    ) -> Result[dict[str, Any]] | None:
        for key, value in to_write.items():
            res = await self._write_setting(key, "1" if value else "0", user_scoped=False)
            if not res.ok:
                return Result.Err("DB_ERROR", res.error or f"Failed to persist {key}")
            self._set_security_pref_env_var(key, value)
        return None

    def _set_security_pref_env_var(self, key: str, value: bool) -> None:
        try:
            info = _SECURITY_PREFS_INFO.get(key) or {}
            env_var = str(info.get("env") or "").strip()
            if env_var:
                os.environ[env_var] = "1" if value else "0"
        except Exception:
            return

    async def _persist_security_api_token(self, token_payload: Any) -> Result[dict[str, Any]] | None:
        token = str(token_payload or "").strip() or self._generate_api_token()
        token_hash = self._hash_api_token(token)
        token_res = await self._write_setting(_SECURITY_API_TOKEN_KEY, token)
        if not token_res.ok:
            return Result.Err("DB_ERROR", token_res.error or "Failed to persist api_token")
        hash_res = await self._write_setting(_SECURITY_API_TOKEN_HASH_KEY, token_hash)
        if not hash_res.ok:
            return Result.Err("DB_ERROR", hash_res.error or "Failed to persist api_token")
        self._set_runtime_api_token(token, token_hash)
        self._set_api_token_env(token, token_hash, include_plain=False)
        return None

    async def _persist_security_api_token_hash(self, token_hash: str) -> Result[dict[str, Any]] | None:
        value = str(token_hash or "").strip().lower()
        if len(value) != 64 or any(ch not in "0123456789abcdef" for ch in value):
            return Result.Err("INVALID_INPUT", "Invalid api_token_hash")
        clear_res = await self._delete_setting(_SECURITY_API_TOKEN_KEY)
        if not clear_res.ok:
            return Result.Err("DB_ERROR", clear_res.error or "Failed to clear api_token")
        hash_res = await self._write_setting(_SECURITY_API_TOKEN_HASH_KEY, value)
        if not hash_res.ok:
            return Result.Err("DB_ERROR", hash_res.error or "Failed to persist api_token_hash")
        self._set_runtime_api_token("", value)
        self._set_api_token_env("", value, include_plain=False)
        return None

    async def _warn_if_bump_fails(self, message: str, *, user_scoped: bool = False, user_id: str | None = None) -> None:
        bump = await self._bump_settings_version_locked(user_scoped=user_scoped, user_id=user_id)
        if not bump.ok:
            try:
                logger.warning("%s: %s", message, bump.error)
            except Exception:
                return

    async def rotate_api_token(self) -> Result[dict[str, str]]:
        async with self._lock:
            token = self._generate_api_token()
            token_hash = self._hash_api_token(token)
            token_res = await self._write_setting(_SECURITY_API_TOKEN_KEY, token)
            if not token_res.ok:
                return Result.Err("DB_ERROR", token_res.error or "Failed to persist rotated api token")
            hash_res = await self._write_setting(_SECURITY_API_TOKEN_HASH_KEY, token_hash)
            if not hash_res.ok:
                return Result.Err("DB_ERROR", hash_res.error or "Failed to persist rotated api token")
            self._set_runtime_api_token(token, token_hash)
            self._set_api_token_env(token, token_hash, include_plain=False)
            bump = await self._bump_settings_version_locked()
            if not bump.ok:
                try:
                    logger.warning("Failed to bump settings version after rotate: %s", bump.error)
                except Exception:
                    pass
            return Result.Ok({"api_token": token})

    async def bootstrap_api_token(self) -> Result[dict[str, str]]:
        async with self._lock:
            token = await self._get_or_create_api_token_locked()
            if not token:
                # Legacy recovery path: older builds stored only the token hash.
                # In trusted bootstrap contexts, rotate to a fresh plaintext token so
                # the browser can re-establish its write session.
                legacy_hash = await self._get_stored_api_token_hash_locked()
                if legacy_hash:
                    token = self._generate_api_token()
                    token_hash = self._hash_api_token(token)
                    token_res = await self._write_setting(_SECURITY_API_TOKEN_KEY, token)
                    if not token_res.ok:
                        return Result.Err("DB_ERROR", token_res.error or "Failed to persist recovery api token")
                    hash_res = await self._write_setting(_SECURITY_API_TOKEN_HASH_KEY, token_hash)
                    if not hash_res.ok:
                        return Result.Err("DB_ERROR", hash_res.error or "Failed to persist recovery api token")
                    self._set_runtime_api_token(token, token_hash)
                    self._set_api_token_env(token, token_hash, include_plain=False)
                else:
                    return Result.Err("AUTH_REQUIRED", "API token bootstrap unavailable")
            return Result.Ok({"api_token": token})

    async def _read_settings_version_exact(self, storage_key: str) -> int:
        try:
            raw = await self._read_setting_exact(storage_key)
            n = int(str(raw or "0").strip() or "0")
            return max(0, n)
        except Exception:
            return 0

    async def _read_settings_version(self, *, user_scoped: bool = False, user_id: str | None = None) -> int:
        versions = [await self._read_settings_version_exact(key) for key in self._settings_version_read_keys(user_scoped=user_scoped, user_id=user_id)]
        return max(versions, default=0)

    async def _get_settings_version_for_key(self, storage_key: str) -> int:
        now = time.monotonic()
        try:
            ts = float(self._version_cached_at.get(storage_key) or 0.0)
        except Exception:
            ts = 0.0
        if ts and (now - ts) < float(self._version_cache_ttl_s):
            return int(self._version_cached.get(storage_key) or 0)
        v = await self._read_settings_version_exact(storage_key)
        self._version_cached[storage_key] = int(v or 0)
        self._version_cached_at[storage_key] = now
        return int(v or 0)

    async def _get_settings_version(self, *, user_scoped: bool = False, user_id: str | None = None) -> int:
        versions = [
            await self._get_settings_version_for_key(key)
            for key in self._settings_version_read_keys(user_scoped=user_scoped, user_id=user_id)
        ]
        return max(versions, default=0)

    async def _bump_settings_version_locked(self, *, user_scoped: bool = False, user_id: str | None = None) -> Result[int]:
        """
        Bump a monotonically increasing settings version in the DB.

        Used to reduce stale caches in multi-instance deployments.
        """
        try:
            # Unix ms timestamp is monotonic enough for our purposes and works across processes.
            v = int(time.time() * _MS_PER_S)
        except Exception:
            v = int(time.time())
        version_key = self._settings_version_write_key(user_scoped=user_scoped, user_id=user_id)
        res = await self._write_setting_exact(version_key, str(v))
        if not res.ok:
            return Result.Err("DB_ERROR", res.error or "Failed to bump settings version")
        self._version_cached[version_key] = v
        self._version_cached_at[version_key] = time.monotonic()
        return Result.Ok(v)

    async def get_probe_backend(self) -> str:
        """Return the configured media probe backend mode."""
        user_id = self._effective_user_id()
        cache_key = self._storage_key(_PROBE_BACKEND_KEY, user_scoped=True, user_id=user_id)
        async with self._lock:
            current_version = await self._get_settings_version(user_scoped=True, user_id=user_id)
            cached = self._cached_probe_backend(cache_key, current_version)
            if cached:
                return cached
            mode_raw = await self._read_setting(_PROBE_BACKEND_KEY, user_scoped=True, user_id=user_id)
            mode = str(mode_raw or "").strip().lower()
            if mode not in _VALID_PROBE_MODES:
                mode = self._default_probe_mode
            self._store_probe_backend_cache(cache_key, mode, current_version)
            return mode

    def _cached_probe_backend(self, cache_key: str, current_version: int) -> str:
        cached = self._cache.get(cache_key, version=current_version)
        return cached or ""

    def _store_probe_backend_cache(self, cache_key: str, mode: str, current_version: int) -> None:
        self._cache.put(cache_key, mode, version=current_version)

    async def set_probe_backend(self, mode: str) -> Result[str]:
        """Persist the media probe backend mode and bump the settings version."""
        normalized = (mode or "").strip().lower()
        if not normalized:
            normalized = self._default_probe_mode
        if normalized not in _VALID_PROBE_MODES:
            return Result.Err("INVALID_INPUT", f"Invalid probe mode: {mode}")
        user_id = self._effective_user_id()
        cache_key = self._storage_key(_PROBE_BACKEND_KEY, user_scoped=True, user_id=user_id)
        async with self._lock:
            result = await self._write_setting(_PROBE_BACKEND_KEY, normalized, user_scoped=True, user_id=user_id)
            if result.ok:
                bump = await self._bump_settings_version_locked(user_scoped=True, user_id=user_id)
                if not bump.ok:
                    try:
                        logger.warning("Failed to bump settings version: %s", bump.error)
                    except Exception:
                        pass
                self._cache.put(cache_key, normalized, version=int(
                    bump.data or await self._get_settings_version(user_scoped=True, user_id=user_id) or 0
                ))
                logger.info("Media probe backend set to %s", normalized)
                return Result.Ok(normalized)
            return Result.Err("DB_ERROR", result.error or "Failed to persist probe backend")

    async def get_metadata_fallback_prefs(self) -> dict[str, bool]:
        """
        Return fallback preferences for metadata extraction.

        - image: Pillow-based fallback for image metadata
        - media: hachoir-based fallback for audio/video metadata
        """
        user_id = self._effective_user_id()
        async with self._lock:
            current_version = await self._get_settings_version(user_scoped=True, user_id=user_id)
            return await self._read_metadata_fallback_prefs_locked(current_version, user_id=user_id)

    async def _read_metadata_fallback_prefs_locked(
        self,
        current_version: int,
        *,
        user_id: str | None = None,
    ) -> dict[str, bool]:
        out: dict[str, bool] = {}
        defaults = {
            "image": self._default_metadata_fallback_image,
            "media": self._default_metadata_fallback_media,
        }
        key_map = {
            "image": _METADATA_FALLBACK_IMAGE_KEY,
            "media": _METADATA_FALLBACK_MEDIA_KEY,
        }
        for logical_key, storage_key in key_map.items():
            cache_key = self._storage_key(storage_key, user_scoped=True, user_id=user_id)
            cached_pref = self._cached_metadata_fallback_pref(cache_key, defaults[logical_key], current_version)
            if cached_pref is not None:
                out[logical_key] = cached_pref
                continue
            parsed = await self._read_and_cache_metadata_fallback_pref(
                storage_key,
                cache_key,
                defaults[logical_key],
                current_version,
                user_id=user_id,
            )
            out[logical_key] = parsed
        return out

    def _cached_metadata_fallback_pref(
        self,
        storage_key: str,
        default: bool,
        current_version: int,
    ) -> bool | None:
        cached = self._cache.get(storage_key, version=current_version)
        if cached is None:
            return None
        return parse_bool(cached, default)

    async def _read_and_cache_metadata_fallback_pref(
        self,
        storage_key: str,
        cache_key: str,
        default: bool,
        current_version: int,
        *,
        user_id: str | None = None,
    ) -> bool:
        raw = await self._read_setting(storage_key, user_scoped=True, user_id=user_id)
        parsed = parse_bool(raw, default) if raw is not None else default
        self._cache.put(cache_key, "1" if parsed else "0", version=current_version)
        return parsed

    async def set_metadata_fallback_prefs(
        self,
        *,
        image: Any = None,
        media: Any = None,
    ) -> Result[dict[str, bool]]:
        """
        Persist metadata fallback preferences and bump settings version.
        """
        to_write = self._normalize_metadata_fallback_write_payload(image=image, media=media)
        if not to_write:
            return Result.Err("INVALID_INPUT", "No metadata fallback settings provided")

        user_id = self._effective_user_id()
        async with self._lock:
            write_error = await self._write_metadata_fallback_payload(to_write, user_id=user_id)
            if write_error:
                return write_error

            bump = await self._bump_settings_version_locked(user_scoped=True, user_id=user_id)
            if not bump.ok:
                try:
                    logger.warning("Failed to bump settings version: %s", bump.error)
                except Exception:
                    pass

            current_version = int(bump.data or await self._get_settings_version(user_scoped=True, user_id=user_id) or 0)
            for key, value in to_write.items():
                cache_key = self._storage_key(key, user_scoped=True, user_id=user_id)
                self._cache.put(cache_key, "1" if value else "0", version=current_version)

            return Result.Ok(self._current_metadata_fallback_prefs_from_cache(user_id=user_id))

    async def get_vector_search_enabled(self) -> bool:
        """Return persisted vector-search enable preference."""
        async with self._lock:
            current_version = await self._get_settings_version()
            cached = self._cached_vector_search_pref(current_version)
            if cached is not None:
                return cached
            raw = await self._read_setting(_VECTOR_SEARCH_ENABLED_KEY)
            enabled = parse_bool(raw, self._default_vector_search_enabled) if raw is not None else self._default_vector_search_enabled
            self._cache.put(_VECTOR_SEARCH_ENABLED_KEY, "1" if enabled else "0", version=current_version)
            return enabled

    async def get_vector_caption_on_index_enabled(self) -> bool:
        """Return persisted automatic vector-caption preference."""
        async with self._lock:
            current_version = await self._get_settings_version()
            cached = self._cache.get(_VECTOR_CAPTION_ON_INDEX_KEY, version=current_version)
            if cached is not None:
                return parse_bool(cached, self._default_vector_caption_on_index)
            raw = await self._read_setting(_VECTOR_CAPTION_ON_INDEX_KEY)
            enabled = (
                parse_bool(raw, self._default_vector_caption_on_index)
                if raw is not None
                else self._default_vector_caption_on_index
            )
            self._cache.put(_VECTOR_CAPTION_ON_INDEX_KEY, "1" if enabled else "0", version=current_version)
            return enabled

    def _cached_vector_search_pref(self, current_version: int) -> bool | None:
        cached = self._cache.get(_VECTOR_SEARCH_ENABLED_KEY, version=current_version)
        if cached is None:
            return None
        return parse_bool(cached, self._default_vector_search_enabled)

    def _cached_execution_grouping_pref(self, current_version: int) -> bool | None:
        cached = self._cache.get(_EXECUTION_GROUPING_ENABLED_KEY, version=current_version)
        if cached is None:
            return None
        return parse_bool(cached, self._default_execution_grouping_enabled)

    async def set_vector_search_enabled(self, enabled: Any) -> Result[bool]:
        """Persist vector-search enable preference and apply runtime env vars."""
        normalized = parse_bool(enabled, self._default_vector_search_enabled)
        async with self._lock:
            res = await self._write_setting(_VECTOR_SEARCH_ENABLED_KEY, "1" if normalized else "0")
            if not res.ok:
                return Result.Err("DB_ERROR", res.error or "Failed to persist vector_search_enabled")
            self._set_vector_search_env_vars(normalized)
            bump = await self._bump_settings_version_locked()
            if not bump.ok:
                try:
                    logger.warning("Failed to bump settings version: %s", bump.error)
                except Exception:
                    pass
            current_version = int(bump.data or await self._get_settings_version() or 0)
            self._cache.put(_VECTOR_SEARCH_ENABLED_KEY, "1" if normalized else "0", version=current_version)
            return Result.Ok(normalized)

    async def set_vector_caption_on_index_enabled(self, enabled: Any) -> Result[bool]:
        """Persist automatic vector-caption preference and apply runtime env vars."""
        normalized = parse_bool(enabled, self._default_vector_caption_on_index)
        async with self._lock:
            res = await self._write_setting(_VECTOR_CAPTION_ON_INDEX_KEY, "1" if normalized else "0")
            if not res.ok:
                return Result.Err("DB_ERROR", res.error or "Failed to persist vector_caption_on_index")
            self._set_vector_caption_on_index_env_vars(normalized)
            bump = await self._bump_settings_version_locked()
            if not bump.ok:
                try:
                    logger.warning("Failed to bump settings version: %s", bump.error)
                except Exception:
                    pass
            current_version = int(bump.data or await self._get_settings_version() or 0)
            self._cache.put(_VECTOR_CAPTION_ON_INDEX_KEY, "1" if normalized else "0", version=current_version)
            return Result.Ok(normalized)

    async def get_execution_grouping_enabled(self) -> bool:
        """Return persisted execution-grouping enable preference."""
        async with self._lock:
            current_version = await self._get_settings_version()
            cached = self._cached_execution_grouping_pref(current_version)
            if cached is not None:
                return cached
            raw = await self._read_setting(_EXECUTION_GROUPING_ENABLED_KEY)
            enabled = (
                parse_bool(raw, self._default_execution_grouping_enabled)
                if raw is not None
                else self._default_execution_grouping_enabled
            )
            self._cache.put(_EXECUTION_GROUPING_ENABLED_KEY, "1" if enabled else "0", version=current_version)
            return enabled

    @staticmethod
    def _set_execution_grouping_env_vars(enabled: bool) -> None:
        normalized = "1" if parse_bool(enabled, True) else "0"
        try:
            os.environ["MJR_AM_EXECUTION_GROUPING_ENABLED"] = normalized
            os.environ["MAJOOR_EXECUTION_GROUPING_ENABLED"] = normalized
        except Exception:
            pass

    async def set_execution_grouping_enabled(self, enabled: Any) -> Result[bool]:
        """Persist execution-grouping enable preference and apply runtime env vars."""
        normalized = parse_bool(enabled, self._default_execution_grouping_enabled)
        async with self._lock:
            res = await self._write_setting(
                _EXECUTION_GROUPING_ENABLED_KEY, "1" if normalized else "0"
            )
            if not res.ok:
                return Result.Err(
                    "DB_ERROR", res.error or "Failed to persist execution_grouping_enabled"
                )
            self._set_execution_grouping_env_vars(normalized)
            bump = await self._bump_settings_version_locked()
            if not bump.ok:
                try:
                    logger.warning("Failed to bump settings version: %s", bump.error)
                except Exception:
                    pass
            current_version = int(bump.data or await self._get_settings_version() or 0)
            self._cache.put(_EXECUTION_GROUPING_ENABLED_KEY, "1" if normalized else "0", version=current_version)
            return Result.Ok(normalized)

    async def get_huggingface_token_info(self) -> dict[str, Any]:
        async with self._lock:
            token = self._env_huggingface_token()
            if not token:
                token = str(await self._read_setting(_HUGGINGFACE_TOKEN_KEY) or "").strip()
                if token:
                    self._set_huggingface_token_env(token)
            return {
                "has_token": bool(token),
                "token_hint": self._token_hint(token),
            }

    def _safe_runtime_api_token(self) -> str:
        try:
            return str(self._runtime_api_token or "").strip()
        except Exception:
            return ""

    async def _is_security_api_token_locked(self, token: str) -> bool:
        normalized = str(token or "").strip()
        if not normalized:
            return False
        sources = [
            self._safe_runtime_api_token(),
            self._env_api_token(),
            await self._get_stored_api_token_plain_locked(),
        ]
        return any(s and normalized == s for s in sources)

    async def set_huggingface_token(self, token_payload: Any) -> Result[dict[str, Any]]:
        token = str(token_payload or "").strip()
        async with self._lock:
            if token:
                if await self._is_security_api_token_locked(token):
                    return Result.Err(
                        "INVALID_INPUT",
                        "HuggingFace token must be independent from Majoor API token",
                    )
                write_res = await self._write_setting(_HUGGINGFACE_TOKEN_KEY, token)
                if not write_res.ok:
                    return Result.Err("DB_ERROR", write_res.error or "Failed to persist huggingface_token")
                self._set_huggingface_token_env(token)
            else:
                delete_res = await self._delete_setting(_HUGGINGFACE_TOKEN_KEY)
                if not delete_res.ok:
                    return Result.Err("DB_ERROR", delete_res.error or "Failed to clear huggingface_token")
                self._set_huggingface_token_env("")

            bump = await self._bump_settings_version_locked()
            if not bump.ok:
                try:
                    logger.warning("Failed to bump settings version: %s", bump.error)
                except Exception:
                    pass

            return Result.Ok({
                "has_token": bool(token),
                "token_hint": self._token_hint(token),
            })

    async def get_ai_verbose_logs_enabled(self) -> bool:
        """Return persisted AI verbose-log preference."""
        async with self._lock:
            current_version = await self._get_settings_version()
            cached = self._cached_ai_verbose_logs_pref(current_version)
            if cached is not None:
                return cached
            raw = await self._read_setting(_AI_VERBOSE_LOGS_KEY)
            enabled = parse_bool(raw, self._default_ai_verbose_logs) if raw is not None else self._default_ai_verbose_logs
            self._cache.put(_AI_VERBOSE_LOGS_KEY, "1" if enabled else "0", version=current_version)
            return enabled

    def _cached_ai_verbose_logs_pref(self, current_version: int) -> bool | None:
        cached = self._cache.get(_AI_VERBOSE_LOGS_KEY, version=current_version)
        if cached is None:
            return None
        return parse_bool(cached, self._default_ai_verbose_logs)

    async def set_ai_verbose_logs_enabled(self, enabled: Any) -> Result[bool]:
        """Persist AI verbose-log preference and apply runtime env vars."""
        normalized = parse_bool(enabled, self._default_ai_verbose_logs)
        async with self._lock:
            res = await self._write_setting(_AI_VERBOSE_LOGS_KEY, "1" if normalized else "0")
            if not res.ok:
                return Result.Err("DB_ERROR", res.error or "Failed to persist ai_verbose_logs")
            self._set_ai_verbose_logs_env_vars(normalized)
            bump = await self._bump_settings_version_locked()
            if not bump.ok:
                try:
                    logger.warning("Failed to bump settings version: %s", bump.error)
                except Exception:
                    pass
            current_version = int(bump.data or await self._get_settings_version() or 0)
            self._cache.put(_AI_VERBOSE_LOGS_KEY, "1" if normalized else "0", version=current_version)
            return Result.Ok(normalized)

    async def get_route_verbose_logs_enabled(self) -> bool:
        """Return persisted verbose route-registration log preference."""
        async with self._lock:
            current_version = await self._get_settings_version()
            cached = self._cached_route_verbose_logs_pref(current_version)
            if cached is not None:
                return cached
            raw = await self._read_setting(_ROUTE_VERBOSE_LOGS_KEY)
            enabled = (
                parse_bool(raw, self._default_route_verbose_logs)
                if raw is not None
                else self._default_route_verbose_logs
            )
            self._cache.put(_ROUTE_VERBOSE_LOGS_KEY, "1" if enabled else "0", version=current_version)
            return enabled

    def _cached_route_verbose_logs_pref(self, current_version: int) -> bool | None:
        cached = self._cache.get(_ROUTE_VERBOSE_LOGS_KEY, version=current_version)
        if cached is None:
            return None
        return parse_bool(cached, self._default_route_verbose_logs)

    async def set_route_verbose_logs_enabled(self, enabled: Any) -> Result[bool]:
        """Persist verbose route-registration log preference and apply env vars."""
        normalized = parse_bool(enabled, self._default_route_verbose_logs)
        async with self._lock:
            res = await self._write_setting(_ROUTE_VERBOSE_LOGS_KEY, "1" if normalized else "0")
            if not res.ok:
                return Result.Err("DB_ERROR", res.error or "Failed to persist route_verbose_logs")
            self._set_route_verbose_logs_env_vars(normalized)
            bump = await self._bump_settings_version_locked()
            if not bump.ok:
                try:
                    logger.warning("Failed to bump settings version: %s", bump.error)
                except Exception:
                    pass
            current_version = int(bump.data or await self._get_settings_version() or 0)
            self._cache.put(_ROUTE_VERBOSE_LOGS_KEY, "1" if normalized else "0", version=current_version)
            return Result.Ok(normalized)

    async def get_startup_verbose_logs_enabled(self) -> bool:
        """Return persisted verbose startup-log preference."""
        async with self._lock:
            current_version = await self._get_settings_version()
            cached = self._cached_startup_verbose_logs_pref(current_version)
            if cached is not None:
                return cached
            raw = await self._read_setting(_STARTUP_VERBOSE_LOGS_KEY)
            enabled = (
                parse_bool(raw, self._default_startup_verbose_logs)
                if raw is not None
                else self._default_startup_verbose_logs
            )
            self._cache.put(_STARTUP_VERBOSE_LOGS_KEY, "1" if enabled else "0", version=current_version)
            return enabled

    def _cached_startup_verbose_logs_pref(self, current_version: int) -> bool | None:
        cached = self._cache.get(_STARTUP_VERBOSE_LOGS_KEY, version=current_version)
        if cached is None:
            return None
        return parse_bool(cached, self._default_startup_verbose_logs)

    async def set_startup_verbose_logs_enabled(self, enabled: Any) -> Result[bool]:
        """Persist verbose startup-log preference and apply env vars."""
        normalized = parse_bool(enabled, self._default_startup_verbose_logs)
        async with self._lock:
            res = await self._write_setting(_STARTUP_VERBOSE_LOGS_KEY, "1" if normalized else "0")
            if not res.ok:
                return Result.Err("DB_ERROR", res.error or "Failed to persist startup_verbose_logs")
            self._set_startup_verbose_logs_env_vars(normalized)
            bump = await self._bump_settings_version_locked()
            if not bump.ok:
                try:
                    logger.warning("Failed to bump settings version: %s", bump.error)
                except Exception:
                    pass
            current_version = int(bump.data or await self._get_settings_version() or 0)
            self._cache.put(_STARTUP_VERBOSE_LOGS_KEY, "1" if normalized else "0", version=current_version)
            return Result.Ok(normalized)

    async def get_ltxav_rgb_fallback_enabled(self) -> bool:
        """Return persisted LTXAV RGB fallback preference."""
        async with self._lock:
            current_version = await self._get_settings_version()
            cached = self._cache.get(_LTXAV_RGB_FALLBACK_ENABLED_KEY, version=current_version)
            if cached is not None:
                return parse_bool(cached, self._default_ltxav_rgb_fallback_enabled)
            raw = await self._read_setting(_LTXAV_RGB_FALLBACK_ENABLED_KEY)
            enabled = (
                parse_bool(raw, self._default_ltxav_rgb_fallback_enabled)
                if raw is not None
                else self._default_ltxav_rgb_fallback_enabled
            )
            self._cache.put(
                _LTXAV_RGB_FALLBACK_ENABLED_KEY,
                "1" if enabled else "0",
                version=current_version,
            )
            return enabled

    async def set_ltxav_rgb_fallback_enabled(self, enabled: Any) -> Result[bool]:
        """Persist LTXAV RGB fallback preference and apply runtime env vars."""
        normalized = parse_bool(enabled, self._default_ltxav_rgb_fallback_enabled)
        async with self._lock:
            res = await self._write_setting(
                _LTXAV_RGB_FALLBACK_ENABLED_KEY,
                "1" if normalized else "0",
            )
            if not res.ok:
                return Result.Err(
                    "DB_ERROR",
                    res.error or "Failed to persist ltxav_rgb_fallback_enabled",
                )
            self._set_ltxav_rgb_fallback_env_vars(normalized)
            bump = await self._bump_settings_version_locked()
            if not bump.ok:
                try:
                    logger.warning("Failed to bump settings version: %s", bump.error)
                except Exception:
                    pass
            current_version = int(bump.data or await self._get_settings_version() or 0)
            self._cache.put(
                _LTXAV_RGB_FALLBACK_ENABLED_KEY,
                "1" if normalized else "0",
                version=current_version,
            )
            return Result.Ok(normalized)

    def _set_vector_search_env_vars(self, enabled: bool) -> None:
        value = "1" if enabled else "0"
        try:
            os.environ["MJR_AM_ENABLE_VECTOR_SEARCH"] = value
            os.environ["MJR_ENABLE_VECTOR_SEARCH"] = value
            os.environ["MAJOOR_ENABLE_VECTOR_SEARCH"] = value
        except Exception:
            return

    def _set_vector_caption_on_index_env_vars(self, enabled: bool) -> None:
        value = "1" if enabled else "0"
        try:
            os.environ["MJR_AM_VECTOR_CAPTION_ON_INDEX"] = value
            os.environ["MAJOOR_VECTOR_CAPTION_ON_INDEX"] = value
        except Exception:
            return

    def _set_ai_verbose_logs_env_vars(self, enabled: bool) -> None:
        value = "1" if enabled else "0"
        try:
            os.environ["MAJOOR_AI_VERBOSE_LOGS"] = value
            os.environ["MJR_AM_AI_VERBOSE_LOGS"] = value
            os.environ["MAJOOR_VERBOSE_AI_LOGS"] = value
            os.environ["MJR_AM_VERBOSE_AI_LOGS"] = value
        except Exception:
            return

    def _set_route_verbose_logs_env_vars(self, enabled: bool) -> None:
        value = "1" if enabled else "0"
        try:
            os.environ["MAJOOR_ROUTE_VERBOSE_LOGS"] = value
            os.environ["MJR_AM_ROUTE_VERBOSE_LOGS"] = value
            os.environ["MAJOOR_VERBOSE_ROUTE_LOGS"] = value
            os.environ["MJR_AM_VERBOSE_ROUTE_LOGS"] = value
        except Exception:
            return

    def _set_startup_verbose_logs_env_vars(self, enabled: bool) -> None:
        value = "1" if enabled else "0"
        try:
            os.environ["MAJOOR_STARTUP_VERBOSE_LOGS"] = value
            os.environ["MJR_AM_STARTUP_VERBOSE_LOGS"] = value
            os.environ["MAJOOR_VERBOSE_STARTUP_LOGS"] = value
            os.environ["MJR_AM_VERBOSE_STARTUP_LOGS"] = value
        except Exception:
            return

    def _set_ltxav_rgb_fallback_env_vars(self, enabled: bool) -> None:
        value = "1" if enabled else "0"
        try:
            os.environ["MJR_ENABLE_LTXAV_RGB_FALLBACK"] = value
            os.environ["MAJOOR_ENABLE_LTXAV_RGB_FALLBACK"] = value
        except Exception:
            return

    def _normalize_metadata_fallback_write_payload(
        self,
        *,
        image: Any,
        media: Any,
    ) -> dict[str, bool]:
        to_write: dict[str, bool] = {}
        if image is not None:
            to_write[_METADATA_FALLBACK_IMAGE_KEY] = parse_bool(image, self._default_metadata_fallback_image)
        if media is not None:
            to_write[_METADATA_FALLBACK_MEDIA_KEY] = parse_bool(media, self._default_metadata_fallback_media)
        return to_write

    async def _write_metadata_fallback_payload(
        self,
        to_write: dict[str, bool],
        *,
        user_id: str | None = None,
    ) -> Result[Any] | None:
        for key, value in to_write.items():
            res = await self._write_setting(key, "1" if value else "0", user_scoped=True, user_id=user_id)
            if not res.ok:
                return Result.Err("DB_ERROR", res.error or f"Failed to persist {key}")
        return None

    def _current_metadata_fallback_prefs_from_cache(self, *, user_id: str | None = None) -> dict[str, bool]:
        image_key = self._storage_key(_METADATA_FALLBACK_IMAGE_KEY, user_scoped=True, user_id=user_id)
        media_key = self._storage_key(_METADATA_FALLBACK_MEDIA_KEY, user_scoped=True, user_id=user_id)
        return {
            "image": parse_bool(self._cache.get(image_key), self._default_metadata_fallback_image),
            "media": parse_bool(self._cache.get(media_key), self._default_metadata_fallback_media),
        }

    async def get_output_directory(self) -> str | None:
        """Return persisted output directory override, or None when unset."""
        async with self._lock:
            raw = await self._read_setting(_OUTPUT_DIRECTORY_KEY)
            if not raw:
                return None
            try:
                from pathlib import Path
                return str(Path(raw).expanduser().resolve())
            except Exception:
                return raw

    async def set_output_directory(self, path: str) -> Result[str]:
        """Persist output directory override and bump settings version."""
        normalized = str(path or "").strip()
        if not normalized:
            return await self._clear_output_directory_override()
        try:
            from pathlib import Path
            p = Path(normalized).expanduser().resolve()
            normalized = str(p)
        except Exception:
            return Result.Err("INVALID_INPUT", "Invalid output directory path")
        return await self._persist_output_directory_override(normalized)

    async def _clear_output_directory_override(self) -> Result[str]:
        async with self._lock:
            result = await self._delete_setting(_OUTPUT_DIRECTORY_KEY)
            if not result.ok:
                return Result.Err("DB_ERROR", result.error or "Failed to clear output directory")
            self._clear_output_directory_env_vars()
            self._clear_output_directory_override_file()
            restore_target = self._restore_output_directory_target()
            if restore_target:
                self._apply_comfy_output_directory(restore_target)
            self._clear_original_output_directory_env()
            await self._warn_if_bump_fails("Failed to bump settings version")
            return Result.Ok("")

    async def _persist_output_directory_override(self, normalized: str) -> Result[str]:
        async with self._lock:
            result = await self._write_setting(_OUTPUT_DIRECTORY_KEY, normalized)
            if not result.ok:
                return Result.Err("DB_ERROR", result.error or "Failed to persist output directory")
            self._set_output_directory_env_vars(normalized)
            self._write_output_directory_override_file(normalized)
            self._apply_comfy_output_directory(normalized)
            await self._warn_if_bump_fails("Failed to bump settings version")
            return Result.Ok(normalized)

    def _clear_output_directory_env_vars(self) -> None:
        try:
            os.environ.pop("MAJOOR_OUTPUT_DIRECTORY", None)
            os.environ.pop("MJR_AM_OUTPUT_DIRECTORY", None)
        except Exception:
            return

    def _clear_output_directory_override_file(self) -> None:
        try:
            if _OUTPUT_DIR_OVERRIDE_FILE_PATH.exists():
                _OUTPUT_DIR_OVERRIDE_FILE_PATH.unlink()
        except Exception:
            return

    def _restore_output_directory_target(self) -> str:
        try:
            original = str(os.environ.get(_ORIGINAL_OUTPUT_DIRECTORY_ENV) or "").strip()
        except Exception:
            original = ""
        return original or str(OUTPUT_ROOT or "").strip()

    def _clear_original_output_directory_env(self) -> None:
        try:
            os.environ.pop(_ORIGINAL_OUTPUT_DIRECTORY_ENV, None)
        except Exception:
            return

    def _set_output_directory_env_vars(self, normalized: str) -> None:
        try:
            if not str(os.environ.get(_ORIGINAL_OUTPUT_DIRECTORY_ENV) or "").strip():
                current = self._get_current_comfy_output_directory()
                if current:
                    os.environ[_ORIGINAL_OUTPUT_DIRECTORY_ENV] = current
            os.environ["MAJOOR_OUTPUT_DIRECTORY"] = normalized
            os.environ["MJR_AM_OUTPUT_DIRECTORY"] = normalized
        except Exception:
            return

    def _write_output_directory_override_file(self, normalized: str) -> None:
        try:
            _OUTPUT_DIR_OVERRIDE_FILE_PATH.write_text(normalized + "\n", encoding="utf-8")
        except Exception:
            return

    def _apply_comfy_output_directory(self, target: str) -> None:
        try:
            import folder_paths  # type: ignore
        except Exception:
            return
        normalized_target = str(target or "").strip()
        if not normalized_target:
            return
        setter = getattr(folder_paths, "set_output_directory", None)
        if callable(setter):
            try:
                setter(normalized_target)
                return
            except Exception:
                pass
        try:
            folder_paths.output_directory = normalized_target
        except Exception:
            return

    def _get_current_comfy_output_directory(self) -> str:
        try:
            import folder_paths  # type: ignore

            getter = getattr(folder_paths, "get_output_directory", None)
            if callable(getter):
                cur = str(getter() or "").strip()
                if cur:
                    return cur
        except Exception:
            return ""
        return ""

    async def apply_output_directory_override_on_startup(self) -> None:
        """
        Re-apply the persisted output directory override to folder_paths and
        env vars after a server restart.

        At startup the ComfyUI process starts fresh — env vars and
        ``folder_paths.output_directory`` revert to their defaults.  This
        method reads the stored override from the DB and, if one is present,
        re-applies it so that ``get_runtime_output_root()`` continues to return
        the user-configured value before any request is handled.
        """
        try:
            async with self._lock:
                raw = await self._read_setting(_OUTPUT_DIRECTORY_KEY)
                if not raw:
                    return
                try:
                    from pathlib import Path as _Path
                    normalized = str(_Path(raw).expanduser().resolve())
                except Exception:
                    normalized = str(raw).strip()
                if normalized:
                    self._set_output_directory_env_vars(normalized)
                    self._apply_comfy_output_directory(normalized)
                    startup_log_info(
                        logger,
                        "Restored output directory override on startup: %s",
                        normalized,
                    )
        except Exception as exc:
            logger.warning("Failed to restore output directory override on startup: %s", exc)

    async def apply_vector_search_override_on_startup(self) -> None:
        """Restore vector-search preferences into environment on startup."""
        try:
            async with self._lock:
                raw = await self._read_setting(_VECTOR_SEARCH_ENABLED_KEY)
                enabled = parse_bool(raw, self._default_vector_search_enabled) if raw is not None else self._default_vector_search_enabled
                self._set_vector_search_env_vars(enabled)
                self._cache.put(_VECTOR_SEARCH_ENABLED_KEY, "1" if enabled else "0", version=int(await self._get_settings_version() or 0))
                caption_raw = await self._read_setting(_VECTOR_CAPTION_ON_INDEX_KEY)
                caption_enabled = (
                    parse_bool(caption_raw, self._default_vector_caption_on_index)
                    if caption_raw is not None
                    else self._default_vector_caption_on_index
                )
                self._set_vector_caption_on_index_env_vars(caption_enabled)
                self._cache.put(
                    _VECTOR_CAPTION_ON_INDEX_KEY,
                    "1" if caption_enabled else "0",
                    version=int(await self._get_settings_version() or 0),
                )
                startup_log_info(
                    logger,
                    "Restored vector search settings on startup: search=%s caption_on_index=%s",
                    "enabled" if enabled else "disabled",
                    "enabled" if caption_enabled else "disabled",
                )
        except Exception as exc:
            logger.warning("Failed to restore vector search settings on startup: %s", exc)

    async def apply_execution_grouping_override_on_startup(self) -> None:
        """Restore execution-grouping enabled preference into environment on startup."""
        try:
            async with self._lock:
                raw = await self._read_setting(_EXECUTION_GROUPING_ENABLED_KEY)
                enabled = (
                    parse_bool(raw, self._default_execution_grouping_enabled)
                    if raw is not None
                    else self._default_execution_grouping_enabled
                )
                self._set_execution_grouping_env_vars(enabled)
                self._cache.put(_EXECUTION_GROUPING_ENABLED_KEY, "1" if enabled else "0", version=int(
                    await self._get_settings_version() or 0
                ))
                startup_log_info(
                    "Restored execution grouping setting on startup: %s",
                    "enabled" if enabled else "disabled",
                )
        except Exception as exc:
            logger.warning("Failed to restore execution grouping setting on startup: %s", exc)

    async def apply_huggingface_token_on_startup(self) -> None:
        try:
            async with self._lock:
                token = self._env_huggingface_token()
                if not token:
                    token = str(await self._read_setting(_HUGGINGFACE_TOKEN_KEY) or "").strip()
                if token:
                    self._set_huggingface_token_env(token)
                    startup_log_info(
                        logger,
                        "Restored HuggingFace token on startup: %s",
                        self._token_hint(token),
                    )
        except Exception as exc:
            logger.warning("Failed to restore HuggingFace token on startup: %s", exc)

    async def apply_ai_verbose_logs_on_startup(self) -> None:
        """Restore AI verbose-logs preference into environment on startup."""
        try:
            async with self._lock:
                raw = await self._read_setting(_AI_VERBOSE_LOGS_KEY)
                enabled = parse_bool(raw, self._default_ai_verbose_logs) if raw is not None else self._default_ai_verbose_logs
                self._set_ai_verbose_logs_env_vars(enabled)
                self._cache.put(_AI_VERBOSE_LOGS_KEY, "1" if enabled else "0", version=int(await self._get_settings_version() or 0))
                startup_log_info(
                    logger,
                    "Restored AI verbose logs setting on startup: %s",
                    "enabled" if enabled else "disabled",
                )
        except Exception as exc:
            logger.warning("Failed to restore AI verbose logs setting on startup: %s", exc)

    async def apply_route_verbose_logs_on_startup(self) -> None:
        """Restore verbose route-registration log preference into environment on startup."""
        try:
            async with self._lock:
                raw = await self._read_setting(_ROUTE_VERBOSE_LOGS_KEY)
                enabled = (
                    parse_bool(raw, self._default_route_verbose_logs)
                    if raw is not None
                    else self._default_route_verbose_logs
                )
                self._set_route_verbose_logs_env_vars(enabled)
                self._cache.put(_ROUTE_VERBOSE_LOGS_KEY, "1" if enabled else "0", version=int(
                    await self._get_settings_version() or 0
                ))
                startup_log_info(
                    logger,
                    "Restored verbose route registration logs setting on startup: %s",
                    "enabled" if enabled else "disabled",
                )
        except Exception as exc:
            logger.warning("Failed to restore verbose route registration logs setting on startup: %s", exc)

    async def apply_startup_verbose_logs_on_startup(self) -> None:
        """Restore verbose startup-log preference into environment on startup."""
        try:
            async with self._lock:
                raw = await self._read_setting(_STARTUP_VERBOSE_LOGS_KEY)
                enabled = (
                    parse_bool(raw, self._default_startup_verbose_logs)
                    if raw is not None
                    else self._default_startup_verbose_logs
                )
                self._set_startup_verbose_logs_env_vars(enabled)
                self._cache.put(_STARTUP_VERBOSE_LOGS_KEY, "1" if enabled else "0", version=int(
                    await self._get_settings_version() or 0
                ))
                startup_log_info(
                    logger,
                    "Restored verbose startup logs setting on startup: %s",
                    "enabled" if enabled else "disabled",
                )
        except Exception as exc:
            logger.warning("Failed to restore verbose startup logs setting on startup: %s", exc)

    async def apply_ltxav_rgb_fallback_on_startup(self) -> None:
        """Restore LTXAV RGB fallback preference into environment on startup."""
        try:
            async with self._lock:
                raw = await self._read_setting(_LTXAV_RGB_FALLBACK_ENABLED_KEY)
                enabled = (
                    parse_bool(raw, self._default_ltxav_rgb_fallback_enabled)
                    if raw is not None
                    else self._default_ltxav_rgb_fallback_enabled
                )
                self._set_ltxav_rgb_fallback_env_vars(enabled)
                self._cache.put(
                    _LTXAV_RGB_FALLBACK_ENABLED_KEY,
                    "1" if enabled else "0",
                    version=int(await self._get_settings_version() or 0),
                )
                startup_log_info(
                    logger,
                    "Restored LTXAV RGB fallback setting on startup: %s",
                    "enabled" if enabled else "disabled",
                )
        except Exception as exc:
            logger.warning("Failed to restore LTXAV RGB fallback setting on startup: %s", exc)
