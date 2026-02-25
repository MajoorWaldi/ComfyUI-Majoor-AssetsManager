"""Simple TTL metadata cache extracted from service.py inline behavior."""
import time
from typing import Any


class MetadataCache:
    def __init__(self, ttl_seconds: float = 300.0):
        self._ttl = max(1.0, float(ttl_seconds))
        self._store: dict[str, tuple[float, dict[str, Any]]] = {}

    def get(self, path: str) -> dict[str, Any] | None:
        item = self._store.get(path)
        if not item:
            return None
        ts, data = item
        if (time.time() - ts) > self._ttl:
            self._store.pop(path, None)
            return None
        return dict(data)

    def put(self, path: str, data: dict[str, Any]) -> None:
        self._store[path] = (time.time(), dict(data or {}))

    def invalidate(self, path: str) -> None:
        self._store.pop(path, None)

    def invalidate_batch(self, paths: list[str]) -> None:
        for p in paths:
            self._store.pop(p, None)

    def prune_expired(self) -> int:
        now = time.time()
        expired = [k for k, (ts, _) in self._store.items() if (now - ts) > self._ttl]
        for k in expired:
            self._store.pop(k, None)
        return len(expired)
