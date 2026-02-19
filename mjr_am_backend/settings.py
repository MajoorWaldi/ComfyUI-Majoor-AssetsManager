"""
Application settings persisted in the local metadata store.
"""
from __future__ import annotations

import os
import asyncio
import time
import secrets
import hashlib
from typing import Any, Mapping, Optional

from .shared import Result, get_logger
from .config import MEDIA_PROBE_BACKEND, OUTPUT_ROOT
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
    "allow_remote_write": {"env": "MAJOOR_ALLOW_REMOTE_WRITE", "default": True},
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
        token = ""
        try:
            token = (os.environ.get("MAJOOR_API_TOKEN") or os.environ.get("MJR_API_TOKEN") or "").strip()
        except Exception:
            token = ""
        if token:
            token_hash = self._hash_api_token(token)
            write_res = await self._write_setting(_SECURITY_API_TOKEN_HASH_KEY, token_hash)
            if not write_res.ok:
                logger.warning("Failed to persist API token hash: %s", write_res.error)
            await self._delete_setting(_SECURITY_API_TOKEN_KEY)
            try:
                os.environ["MAJOOR_API_TOKEN_HASH"] = token_hash
                os.environ["MJR_API_TOKEN_HASH"] = token_hash
            except Exception:
                pass
            return token

        token_hash = await self._get_stored_api_token_hash_locked()
        if token_hash:
            # Hash-only persistence means we cannot recover the previous plaintext token.
            # Regenerate a fresh token so authenticated clients can bootstrap automatically.
            token = self._generate_api_token()
            new_hash = self._hash_api_token(token)
            write_res = await self._write_setting(_SECURITY_API_TOKEN_HASH_KEY, new_hash)
            if not write_res.ok:
                logger.warning("Failed to persist regenerated API token hash: %s", write_res.error)
            try:
                os.environ["MAJOOR_API_TOKEN"] = token
                os.environ["MJR_API_TOKEN"] = token
                os.environ["MAJOOR_API_TOKEN_HASH"] = new_hash
                os.environ["MJR_API_TOKEN_HASH"] = new_hash
            except Exception:
                pass
            return token

        token = self._generate_api_token()
        token_hash = self._hash_api_token(token)
        write_res = await self._write_setting(_SECURITY_API_TOKEN_HASH_KEY, token_hash)
        if not write_res.ok:
            logger.warning("Failed to persist auto-generated API token hash: %s", write_res.error)
        await self._delete_setting(_SECURITY_API_TOKEN_KEY)

        try:
            os.environ["MAJOOR_API_TOKEN"] = token
            os.environ["MJR_API_TOKEN"] = token
            os.environ["MAJOOR_API_TOKEN_HASH"] = token_hash
            os.environ["MJR_API_TOKEN_HASH"] = token_hash
        except Exception:
            pass
        return token

    async def _read_setting(self, key: str) -> Optional[str]:
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
        to_write: dict[str, bool] = {}
        for key in _SECURITY_PREFS_INFO:
            if key in prefs:
                to_write[key] = parse_bool(prefs[key], False)
        token_in_payload = (
            prefs.get("api_token")
            if isinstance(prefs, Mapping) and "api_token" in prefs
            else prefs.get("apiToken")
            if isinstance(prefs, Mapping) and "apiToken" in prefs
            else None
        )
        if not to_write and token_in_payload is None:
            return Result.Err("INVALID_INPUT", "No security settings provided")
        async with self._lock:
            for key, value in to_write.items():
                res = await self._write_setting(key, "1" if value else "0")
                if not res.ok:
                    return Result.Err("DB_ERROR", res.error or f"Failed to persist {key}")
                try:
                    info = _SECURITY_PREFS_INFO.get(key) or {}
                    env_var = str(info.get("env") or "").strip()
                    if env_var:
                        os.environ[env_var] = "1" if value else "0"
                except Exception:
                    pass
            if token_in_payload is not None:
                token = str(token_in_payload or "").strip()
                if not token:
                    token = self._generate_api_token()
                token_hash = self._hash_api_token(token)
                res = await self._write_setting(_SECURITY_API_TOKEN_HASH_KEY, token_hash)
                if not res.ok:
                    return Result.Err("DB_ERROR", res.error or "Failed to persist api_token")
                await self._delete_setting(_SECURITY_API_TOKEN_KEY)
                try:
                    os.environ["MAJOOR_API_TOKEN"] = token
                    os.environ["MJR_API_TOKEN"] = token
                    os.environ["MAJOOR_API_TOKEN_HASH"] = token_hash
                    os.environ["MJR_API_TOKEN_HASH"] = token_hash
                except Exception:
                    pass
            bump = await self._bump_settings_version_locked()
            if not bump.ok:
                try:
                    logger.warning("Failed to bump settings version: %s", bump.error)
                except Exception:
                    pass
            return Result.Ok(await self._get_security_prefs_locked(include_secret=False))

    async def rotate_api_token(self) -> Result[dict[str, str]]:
        async with self._lock:
            token = self._generate_api_token()
            token_hash = self._hash_api_token(token)
            res = await self._write_setting(_SECURITY_API_TOKEN_HASH_KEY, token_hash)
            if not res.ok:
                return Result.Err("DB_ERROR", res.error or "Failed to persist rotated api token")
            await self._delete_setting(_SECURITY_API_TOKEN_KEY)
            try:
                os.environ["MAJOOR_API_TOKEN"] = token
                os.environ["MJR_API_TOKEN"] = token
                os.environ["MAJOOR_API_TOKEN_HASH"] = token_hash
                os.environ["MJR_API_TOKEN_HASH"] = token_hash
            except Exception:
                pass
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
            cached = self._cache.get(_PROBE_BACKEND_KEY)
            if cached:
                try:
                    ts = float(self._cache_at.get(_PROBE_BACKEND_KEY) or 0.0)
                except Exception:
                    ts = 0.0
                cached_ver = int(self._cache_version.get(_PROBE_BACKEND_KEY) or 0)
                if cached_ver == int(current_version or 0) and ts and (time.monotonic() - ts) < self._cache_ttl_s:
                    return cached
            mode_raw = await self._read_setting(_PROBE_BACKEND_KEY)
            mode = str(mode_raw or "").strip().lower()
            if mode not in _VALID_PROBE_MODES:
                mode = self._default_probe_mode
            self._cache[_PROBE_BACKEND_KEY] = mode
            self._cache_at[_PROBE_BACKEND_KEY] = time.monotonic()
            self._cache_version[_PROBE_BACKEND_KEY] = int(current_version or 0)
            return mode

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
                cached = self._cache.get(storage_key)
                if cached is not None:
                    try:
                        ts = float(self._cache_at.get(storage_key) or 0.0)
                    except Exception:
                        ts = 0.0
                    cached_ver = int(self._cache_version.get(storage_key) or 0)
                    if cached_ver == int(current_version or 0) and ts and (time.monotonic() - ts) < self._cache_ttl_s:
                        out[logical_key] = parse_bool(cached, defaults[logical_key])
                        continue
                raw = await self._read_setting(storage_key)
                parsed = parse_bool(raw, defaults[logical_key]) if raw is not None else defaults[logical_key]
                out[logical_key] = parsed
                self._cache[storage_key] = "1" if parsed else "0"
                self._cache_at[storage_key] = time.monotonic()
                self._cache_version[storage_key] = int(current_version or 0)
            return out

    async def set_metadata_fallback_prefs(
        self,
        *,
        image: Any = None,
        media: Any = None,
    ) -> Result[dict[str, bool]]:
        """
        Persist metadata fallback preferences and bump settings version.
        """
        to_write: dict[str, bool] = {}
        if image is not None:
            to_write[_METADATA_FALLBACK_IMAGE_KEY] = parse_bool(image, self._default_metadata_fallback_image)
        if media is not None:
            to_write[_METADATA_FALLBACK_MEDIA_KEY] = parse_bool(media, self._default_metadata_fallback_media)
        if not to_write:
            return Result.Err("INVALID_INPUT", "No metadata fallback settings provided")

        async with self._lock:
            for key, value in to_write.items():
                res = await self._write_setting(key, "1" if value else "0")
                if not res.ok:
                    return Result.Err("DB_ERROR", res.error or f"Failed to persist {key}")

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

            return Result.Ok(
                {
                    "image": parse_bool(self._cache.get(_METADATA_FALLBACK_IMAGE_KEY), self._default_metadata_fallback_image),
                    "media": parse_bool(self._cache.get(_METADATA_FALLBACK_MEDIA_KEY), self._default_metadata_fallback_media),
                }
            )

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
        def _apply_comfy_output_directory(target: str) -> None:
            """
            Best-effort runtime sync with ComfyUI output directory.
            """
            try:
                import folder_paths  # type: ignore
            except Exception:
                return
            try:
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
                # Fallback for Comfy versions exposing a module-level variable.
                try:
                    setattr(folder_paths, "output_directory", normalized_target)
                except Exception:
                    pass
            except Exception:
                return

        def _get_current_comfy_output_directory() -> str:
            try:
                import folder_paths  # type: ignore
                getter = getattr(folder_paths, "get_output_directory", None)
                if callable(getter):
                    cur = str(getter() or "").strip()
                    if cur:
                        return cur
            except Exception:
                pass
            return ""

        normalized = str(path or "").strip()
        if not normalized:
            async with self._lock:
                result = await self._delete_setting(_OUTPUT_DIRECTORY_KEY)
                if not result.ok:
                    return Result.Err("DB_ERROR", result.error or "Failed to clear output directory")
                try:
                    os.environ.pop("MAJOOR_OUTPUT_DIRECTORY", None)
                    os.environ.pop("MJR_AM_OUTPUT_DIRECTORY", None)
                except Exception:
                    pass
                try:
                    original = str(os.environ.get(_ORIGINAL_OUTPUT_DIRECTORY_ENV) or "").strip()
                except Exception:
                    original = ""
                try:
                    restore_target = original or str(OUTPUT_ROOT or "").strip()
                    if restore_target:
                        _apply_comfy_output_directory(restore_target)
                except Exception:
                    pass
                try:
                    os.environ.pop(_ORIGINAL_OUTPUT_DIRECTORY_ENV, None)
                except Exception:
                    pass
                bump = await self._bump_settings_version_locked()
                if not bump.ok:
                    try:
                        logger.warning("Failed to bump settings version: %s", bump.error)
                    except Exception:
                        pass
                return Result.Ok("")
        try:
            from pathlib import Path
            p = Path(normalized).expanduser().resolve()
            normalized = str(p)
        except Exception:
            return Result.Err("INVALID_INPUT", "Invalid output directory path")
        async with self._lock:
            result = await self._write_setting(_OUTPUT_DIRECTORY_KEY, normalized)
            if not result.ok:
                return Result.Err("DB_ERROR", result.error or "Failed to persist output directory")
            try:
                if not str(os.environ.get(_ORIGINAL_OUTPUT_DIRECTORY_ENV) or "").strip():
                    current = _get_current_comfy_output_directory()
                    if current:
                        os.environ[_ORIGINAL_OUTPUT_DIRECTORY_ENV] = current
                os.environ["MAJOOR_OUTPUT_DIRECTORY"] = normalized
                os.environ["MJR_AM_OUTPUT_DIRECTORY"] = normalized
            except Exception:
                pass
            try:
                _apply_comfy_output_directory(normalized)
            except Exception:
                pass
            bump = await self._bump_settings_version_locked()
            if not bump.ok:
                try:
                    logger.warning("Failed to bump settings version: %s", bump.error)
                except Exception:
                    pass
            return Result.Ok(normalized)

