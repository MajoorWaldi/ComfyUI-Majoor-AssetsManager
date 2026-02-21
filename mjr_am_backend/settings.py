"""
Application settings persisted in the local metadata store.
"""
from __future__ import annotations

import asyncio
import hashlib
import os
import secrets
import time
from collections.abc import Mapping
from typing import Any

from .config import MEDIA_PROBE_BACKEND, OUTPUT_ROOT
from .shared import Result, get_logger
from .utils import env_bool, parse_bool

logger = get_logger(__name__)

_PROBE_BACKEND_KEY = "media_probe_backend"
_OUTPUT_DIRECTORY_KEY = "output_directory_override"
_METADATA_FALLBACK_IMAGE_KEY = "metadata_fallback_image"
_METADATA_FALLBACK_MEDIA_KEY = "metadata_fallback_media"
_SETTINGS_VERSION_KEY = "__settings_version"
_SECURITY_API_TOKEN_KEY = "security_api_token"
_SECURITY_API_TOKEN_HASH_KEY = "security_api_token_hash"
_VALID_PROBE_MODES = {"auto", "exiftool", "ffprobe", "both"}
_SECURITY_PREFS_INFO: Mapping[str, dict[str, bool | str]] = {
    "safe_mode": {"env": "MAJOOR_SAFE_MODE", "default": False},
    "allow_write": {"env": "MAJOOR_ALLOW_WRITE", "default": False},
    "allow_remote_write": {"env": "MAJOOR_ALLOW_REMOTE_WRITE", "default": False},
    "allow_delete": {"env": "MAJOOR_ALLOW_DELETE", "default": True},
    "allow_rename": {"env": "MAJOOR_ALLOW_RENAME", "default": True},
    "allow_open_in_folder": {"env": "MAJOOR_ALLOW_OPEN_IN_FOLDER", "default": True},
    "allow_reset_index": {"env": "MAJOOR_ALLOW_RESET_INDEX", "default": True},
}

_SETTINGS_CACHE_TTL_S = 10.0
_VERSION_CACHE_TTL_S = 1.0
_MS_PER_S = 1000.0
_ORIGINAL_OUTPUT_DIRECTORY_ENV = "MAJOOR_ORIGINAL_OUTPUT_DIRECTORY"

# Frontend-consumed default settings payload (kept for cross-layer parity).
DEFAULT_SETTINGS: dict[str, Any] = {
    "ui": {
        "cardHoverColor": "#3d3d3d",
        "cardSelectionColor": "#4a90e2",
        "ratingColor": "#ff9500",
        "tagColor": "#4a90e2",
    }
}



class AppSettings:
    """
    Simple settings manager backed by the metadata table.
    """

    def __init__(self, db):
        self._db = db
        self._lock = asyncio.Lock()
        self._cache: dict[str, str] = {}
        self._cache_at: dict[str, float] = {}
        self._cache_version: dict[str, int] = {}
        self._cache_ttl_s = _SETTINGS_CACHE_TTL_S
        self._version_cache_ttl_s = _VERSION_CACHE_TTL_S
        self._version_cached: int = 0
        self._version_cached_at: float = 0.0
        self._default_probe_mode = MEDIA_PROBE_BACKEND
        self._default_metadata_fallback_image = True
        self._default_metadata_fallback_media = True
        self._runtime_api_token: str = ""
        self._runtime_api_token_hash: str = ""

    def _generate_api_token(self) -> str:
        # 256-bit token (URL-safe) for write authorization.
        return secrets.token_urlsafe(32)

    def _token_pepper(self) -> str:
        try:
            return str(os.environ.get("MAJOOR_API_TOKEN_PEPPER") or "").strip()
        except Exception:
            return ""

    def _hash_api_token(self, token: str) -> str:
        try:
            normalized = str(token or "").strip()
        except Exception:
            normalized = ""
        payload = f"{self._token_pepper()}\0{normalized}".encode("utf-8", errors="ignore")
        return hashlib.sha256(payload).hexdigest()

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
        await self._delete_setting(_SECURITY_API_TOKEN_KEY)
        return token_hash

    async def _get_or_create_api_token_locked(self) -> str:
        runtime_token = str(self._runtime_api_token or "").strip()
        runtime_hash = str(self._runtime_api_token_hash or "").strip().lower()
        if runtime_token and runtime_hash:
            return runtime_token

        token = self._env_api_token()
        if token:
            token_hash = await self._persist_api_token_hash_with_warning(token, "Failed to persist API token hash")
            await self._delete_setting(_SECURITY_API_TOKEN_KEY)
            self._set_runtime_api_token(token, token_hash)
            self._set_api_token_env(token, token_hash, include_plain=False)
            return token

        token_hash = await self._get_stored_api_token_hash_locked()
        if token_hash:
            # Hash-only persistence means we cannot recover the previous plaintext token.
            # Regenerate a fresh token so authenticated clients can bootstrap automatically.
            token = self._generate_api_token()
            new_hash = await self._persist_api_token_hash_with_warning(token, "Failed to persist regenerated API token hash")
            self._set_runtime_api_token(token, new_hash)
            self._set_api_token_env(token, new_hash, include_plain=False)
            return token

        token = self._generate_api_token()
        token_hash = await self._persist_api_token_hash_with_warning(token, "Failed to persist auto-generated API token hash")
        await self._delete_setting(_SECURITY_API_TOKEN_KEY)
        self._set_runtime_api_token(token, token_hash)
        self._set_api_token_env(token, token_hash, include_plain=False)
        return token

    def _env_api_token(self) -> str:
        try:
            return (os.environ.get("MAJOOR_API_TOKEN") or os.environ.get("MJR_API_TOKEN") or "").strip()
        except Exception:
            return ""

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

    async def _read_setting(self, key: str) -> str | None:
        result = await self._db.aquery("SELECT value FROM metadata WHERE key = ?", (key,))
        if not result.ok or not result.data:
            return None
        raw = result.data[0].get("value")
        if isinstance(raw, str):
            return raw.strip()
        return None

    async def _write_setting(self, key: str, value: str) -> Result[str]:
        return await self._db.aexecute(
            "INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)",
            (key, value),
        )

    async def _delete_setting(self, key: str) -> Result[str]:
        return await self._db.aexecute("DELETE FROM metadata WHERE key = ?", (key,))

    async def ensure_security_bootstrap(self) -> None:
        """
        Ensure write-token security is initialized at startup.
        """
        async with self._lock:
            await self._get_or_create_api_token_locked()

    async def _get_security_prefs_locked(self, *, include_secret: bool = False) -> dict[str, Any]:
        output: dict[str, Any] = {}
        for key, info in _SECURITY_PREFS_INFO.items():
            raw = await self._read_setting(key)
            if raw is not None:
                output[key] = parse_bool(raw, bool(info.get("default", False)))
            else:
                default = bool(info.get("default", False))
                env_var = str(info.get("env") or "")
                output[key] = env_bool(env_var, default)
        if include_secret:
            output["api_token"] = await self._get_or_create_api_token_locked()
        return output

    async def get_security_prefs(self, *, include_secret: bool = False) -> dict[str, Any]:
        async with self._lock:
            return await self._get_security_prefs_locked(include_secret=include_secret)

    async def set_security_prefs(self, prefs: Mapping[str, Any]) -> Result[dict[str, Any]]:
        to_write = self._extract_security_prefs_to_write(prefs)
        token_in_payload = self._extract_token_from_prefs_payload(prefs)
        if not to_write and token_in_payload is None:
            return Result.Err("INVALID_INPUT", "No security settings provided")
        async with self._lock:
            write_err = await self._persist_security_pref_flags(to_write)
            if write_err is not None:
                return write_err
            if token_in_payload is not None:
                token_err = await self._persist_security_api_token(token_in_payload)
                if token_err is not None:
                    return token_err
            await self._warn_if_bump_fails("Failed to bump settings version")
            return Result.Ok(await self._get_security_prefs_locked(include_secret=False))

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

    async def _persist_security_pref_flags(self, to_write: Mapping[str, bool]) -> Result[dict[str, Any]] | None:
        for key, value in to_write.items():
            res = await self._write_setting(key, "1" if value else "0")
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
        res = await self._write_setting(_SECURITY_API_TOKEN_HASH_KEY, token_hash)
        if not res.ok:
            return Result.Err("DB_ERROR", res.error or "Failed to persist api_token")
        await self._delete_setting(_SECURITY_API_TOKEN_KEY)
        self._set_runtime_api_token(token, token_hash)
        self._set_api_token_env(token, token_hash, include_plain=False)
        return None

    async def _warn_if_bump_fails(self, message: str) -> None:
        bump = await self._bump_settings_version_locked()
        if not bump.ok:
            try:
                logger.warning("%s: %s", message, bump.error)
            except Exception:
                return

    async def rotate_api_token(self) -> Result[dict[str, str]]:
        async with self._lock:
            token = self._generate_api_token()
            token_hash = self._hash_api_token(token)
            res = await self._write_setting(_SECURITY_API_TOKEN_HASH_KEY, token_hash)
            if not res.ok:
                return Result.Err("DB_ERROR", res.error or "Failed to persist rotated api token")
            await self._delete_setting(_SECURITY_API_TOKEN_KEY)
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
                return Result.Err("AUTH_REQUIRED", "API token bootstrap unavailable")
            return Result.Ok({"api_token": token})

    async def _read_settings_version(self) -> int:
        try:
            raw = await self._read_setting(_SETTINGS_VERSION_KEY)
            n = int(str(raw or "0").strip() or "0")
            return max(0, n)
        except Exception:
            return 0

    async def _get_settings_version(self) -> int:
        now = time.monotonic()
        try:
            ts = float(self._version_cached_at or 0.0)
        except Exception:
            ts = 0.0
        if ts and (now - ts) < float(self._version_cache_ttl_s):
            return int(self._version_cached or 0)
        v = await self._read_settings_version()
        self._version_cached = int(v or 0)
        self._version_cached_at = now
        return self._version_cached

    async def _bump_settings_version_locked(self) -> Result[int]:
        """
        Bump a monotonically increasing settings version in the DB.

        Used to reduce stale caches in multi-instance deployments.
        """
        try:
            # Unix ms timestamp is monotonic enough for our purposes and works across processes.
            v = int(time.time() * _MS_PER_S)
        except Exception:
            v = int(time.time())
        res = await self._write_setting(_SETTINGS_VERSION_KEY, str(v))
        if not res.ok:
            return Result.Err("DB_ERROR", res.error or "Failed to bump settings version")
        self._version_cached = v
        self._version_cached_at = time.monotonic()
        return Result.Ok(v)

    async def get_probe_backend(self) -> str:
        """Return the configured media probe backend mode."""
        async with self._lock:
            current_version = await self._get_settings_version()
            cached = self._cached_probe_backend(current_version)
            if cached:
                return cached
            mode_raw = await self._read_setting(_PROBE_BACKEND_KEY)
            mode = str(mode_raw or "").strip().lower()
            if mode not in _VALID_PROBE_MODES:
                mode = self._default_probe_mode
            self._store_probe_backend_cache(mode, current_version)
            return mode

    def _cached_probe_backend(self, current_version: int) -> str:
        cached = str(self._cache.get(_PROBE_BACKEND_KEY) or "")
        if not cached:
            return ""
        try:
            ts = float(self._cache_at.get(_PROBE_BACKEND_KEY) or 0.0)
        except Exception:
            ts = 0.0
        cached_ver = int(self._cache_version.get(_PROBE_BACKEND_KEY) or 0)
        if cached_ver != int(current_version or 0):
            return ""
        if not ts or (time.monotonic() - ts) >= self._cache_ttl_s:
            return ""
        return cached

    def _store_probe_backend_cache(self, mode: str, current_version: int) -> None:
        self._cache[_PROBE_BACKEND_KEY] = mode
        self._cache_at[_PROBE_BACKEND_KEY] = time.monotonic()
        self._cache_version[_PROBE_BACKEND_KEY] = int(current_version or 0)

    async def set_probe_backend(self, mode: str) -> Result[str]:
        """Persist the media probe backend mode and bump the settings version."""
        normalized = (mode or "").strip().lower()
        if not normalized:
            normalized = self._default_probe_mode
        if normalized not in _VALID_PROBE_MODES:
            return Result.Err("INVALID_INPUT", f"Invalid probe mode: {mode}")
        async with self._lock:
            result = await self._write_setting(_PROBE_BACKEND_KEY, normalized)
            if result.ok:
                bump = await self._bump_settings_version_locked()
                if not bump.ok:
                    try:
                        logger.warning("Failed to bump settings version: %s", bump.error)
                    except Exception:
                        pass
                self._cache[_PROBE_BACKEND_KEY] = normalized
                self._cache_at[_PROBE_BACKEND_KEY] = time.monotonic()
                self._cache_version[_PROBE_BACKEND_KEY] = int(bump.data or await self._get_settings_version() or 0)
                logger.info("Media probe backend set to %s", normalized)
                return Result.Ok(normalized)
            return Result.Err("DB_ERROR", result.error or "Failed to persist probe backend")

    async def get_metadata_fallback_prefs(self) -> dict[str, bool]:
        """
        Return fallback preferences for metadata extraction.

        - image: Pillow-based fallback for image metadata
        - media: hachoir-based fallback for audio/video metadata
        """
        async with self._lock:
            current_version = await self._get_settings_version()
            return await self._read_metadata_fallback_prefs_locked(current_version)

    async def _read_metadata_fallback_prefs_locked(self, current_version: int) -> dict[str, bool]:
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
            cached_pref = self._cached_metadata_fallback_pref(storage_key, defaults[logical_key], current_version)
            if cached_pref is not None:
                out[logical_key] = cached_pref
                continue
            parsed = await self._read_and_cache_metadata_fallback_pref(storage_key, defaults[logical_key], current_version)
            out[logical_key] = parsed
        return out

    def _cached_metadata_fallback_pref(
        self,
        storage_key: str,
        default: bool,
        current_version: int,
    ) -> bool | None:
        cached = self._cache.get(storage_key)
        if cached is None:
            return None
        try:
            ts = float(self._cache_at.get(storage_key) or 0.0)
        except Exception:
            ts = 0.0
        cached_ver = int(self._cache_version.get(storage_key) or 0)
        if cached_ver != int(current_version or 0):
            return None
        if not ts or (time.monotonic() - ts) >= self._cache_ttl_s:
            return None
        return parse_bool(cached, default)

    async def _read_and_cache_metadata_fallback_pref(
        self,
        storage_key: str,
        default: bool,
        current_version: int,
    ) -> bool:
        raw = await self._read_setting(storage_key)
        parsed = parse_bool(raw, default) if raw is not None else default
        self._cache[storage_key] = "1" if parsed else "0"
        self._cache_at[storage_key] = time.monotonic()
        self._cache_version[storage_key] = int(current_version or 0)
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

        async with self._lock:
            write_error = await self._write_metadata_fallback_payload(to_write)
            if write_error:
                return write_error

            bump = await self._bump_settings_version_locked()
            if not bump.ok:
                try:
                    logger.warning("Failed to bump settings version: %s", bump.error)
                except Exception:
                    pass

            current_version = int(bump.data or await self._get_settings_version() or 0)
            for key, value in to_write.items():
                self._cache[key] = "1" if value else "0"
                self._cache_at[key] = time.monotonic()
                self._cache_version[key] = current_version

            return Result.Ok(self._current_metadata_fallback_prefs_from_cache())

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

    async def _write_metadata_fallback_payload(self, to_write: dict[str, bool]) -> Result[Any] | None:
        for key, value in to_write.items():
            res = await self._write_setting(key, "1" if value else "0")
            if not res.ok:
                return Result.Err("DB_ERROR", res.error or f"Failed to persist {key}")
        return None

    def _current_metadata_fallback_prefs_from_cache(self) -> dict[str, bool]:
        return {
            "image": parse_bool(self._cache.get(_METADATA_FALLBACK_IMAGE_KEY), self._default_metadata_fallback_image),
            "media": parse_bool(self._cache.get(_METADATA_FALLBACK_MEDIA_KEY), self._default_metadata_fallback_media),
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
            self._apply_comfy_output_directory(normalized)
            await self._warn_if_bump_fails("Failed to bump settings version")
            return Result.Ok(normalized)

    def _clear_output_directory_env_vars(self) -> None:
        try:
            os.environ.pop("MAJOOR_OUTPUT_DIRECTORY", None)
            os.environ.pop("MJR_AM_OUTPUT_DIRECTORY", None)
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
