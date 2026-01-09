"""
Application settings persisted in the local metadata store.
"""
from __future__ import annotations

import threading
from typing import Optional

from .shared import Result, get_logger
from .config import MEDIA_PROBE_BACKEND

logger = get_logger(__name__)

_PROBE_BACKEND_KEY = "media_probe_backend"
_VALID_PROBE_MODES = {"auto", "exiftool", "ffprobe", "both"}


class AppSettings:
    """
    Simple settings manager backed by the metadata table.
    """

    def __init__(self, db):
        self._db = db
        self._lock = threading.Lock()
        self._cache: dict[str, str] = {}
        self._default_probe_mode = MEDIA_PROBE_BACKEND

    def _read_setting(self, key: str) -> Optional[str]:
        result = self._db.query("SELECT value FROM metadata WHERE key = ?", (key,))
        if not result.ok or not result.data:
            return None
        raw = result.data[0].get("value")
        if isinstance(raw, str):
            return raw.strip().lower()
        return None

    def _write_setting(self, key: str, value: str) -> Result[str]:
        return self._db.execute(
            "INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)",
            (key, value),
        )

    def get_probe_backend(self) -> str:
        with self._lock:
            cached = self._cache.get(_PROBE_BACKEND_KEY)
            if cached:
                return cached
            mode = self._read_setting(_PROBE_BACKEND_KEY)
            if mode not in _VALID_PROBE_MODES:
                mode = self._default_probe_mode
            self._cache[_PROBE_BACKEND_KEY] = mode
            return mode

    def set_probe_backend(self, mode: str) -> Result[str]:
        normalized = (mode or "").strip().lower()
        if not normalized:
            normalized = self._default_probe_mode
        if normalized not in _VALID_PROBE_MODES:
            return Result.Err("INVALID_INPUT", f"Invalid probe mode: {mode}")
        with self._lock:
            result = self._write_setting(_PROBE_BACKEND_KEY, normalized)
            if result.ok:
                self._cache[_PROBE_BACKEND_KEY] = normalized
                logger.info("Media probe backend set to %s", normalized)
                return Result.Ok(normalized)
            return Result.Err("DB_ERROR", result.error or "Failed to persist probe backend")
