"""Simple TTL metadata cache extracted from service.py inline behavior."""
import threading
import time
from collections import OrderedDict
from typing import Any

_DEFAULT_MAX_SIZE = 4096


class MetadataCache:
    """Thread-safe TTL cache with LRU eviction and configurable max size.

    Fixes:
    - M-1: Added threading.RLock so concurrent get/put/invalidate/prune_expired
           are race-free even when called from a thread pool.
    - M-2: Added max_size cap with LRU eviction via OrderedDict so the cache
           never grows without bound (important for 10k+ asset databases).
    """

    def __init__(self, ttl_seconds: float = 300.0, max_size: int = _DEFAULT_MAX_SIZE):
        self._ttl = max(1.0, float(ttl_seconds))
        self._max_size = max(16, int(max_size))
        # OrderedDict preserves insertion order → oldest entries are at the front.
        self._store: OrderedDict[str, tuple[float, dict[str, Any]]] = OrderedDict()
        self._lock = threading.RLock()

    def get(self, path: str) -> dict[str, Any] | None:
        with self._lock:
            item = self._store.get(path)
            if not item:
                return None
            ts, data = item
            if (time.time() - ts) > self._ttl:
                self._store.pop(path, None)
                return None
            # Move to end (most recently used).
            self._store.move_to_end(path)
            return dict(data)

    def put(self, path: str, data: dict[str, Any]) -> None:
        with self._lock:
            if path in self._store:
                self._store.move_to_end(path)
            self._store[path] = (time.time(), dict(data or {}))
            # Evict oldest entries when over capacity.
            while len(self._store) > self._max_size:
                self._store.popitem(last=False)

    def invalidate(self, path: str) -> None:
        with self._lock:
            self._store.pop(path, None)

    def invalidate_batch(self, paths: list[str]) -> None:
        with self._lock:
            for p in paths:
                self._store.pop(p, None)

    def prune_expired(self) -> int:
        now = time.time()
        with self._lock:
            expired = [k for k, (ts, _) in self._store.items() if (now - ts) > self._ttl]
            for k in expired:
                self._store.pop(k, None)
        return len(expired)
