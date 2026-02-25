"""
Connection pool and runtime/lock-pruner helpers extracted from sqlite.py.
"""
import json
import os
import threading
import time
from pathlib import Path
from typing import Any

from ...shared import get_logger

logger = get_logger(__name__)


def init_db(sqlite_obj: Any) -> None:
    try:
        sqlite_obj._loop_thread.run(sqlite_obj._ensure_initialized_async())
        logger.info("Database initialized: %s", sqlite_obj.db_path)
    except Exception as exc:
        logger.error("Failed to initialize database: %s", exc)
        raise


def load_user_db_config(sqlite_obj: Any) -> dict[str, Any]:
    try:
        cfg_path = resolve_user_db_config_path(sqlite_obj)
        data = read_user_db_config_file(cfg_path)
        if not isinstance(data, dict):
            return {}
        return normalize_user_db_config(data)
    except Exception as exc:
        logger.debug("Ignoring invalid DB user config: %s", exc)
        return {}


def resolve_user_db_config_path(sqlite_obj: Any) -> Path:
    cfg_path_raw = os.getenv("MAJOOR_DB_CONFIG_PATH", "").strip()
    return Path(cfg_path_raw).expanduser() if cfg_path_raw else (sqlite_obj.db_path.parent / "db_config.json")


def read_user_db_config_file(cfg_path: Path) -> Any:
    if not cfg_path.exists() or not cfg_path.is_file():
        return {}
    with cfg_path.open("r", encoding="utf-8") as f:
        return json.load(f)


def normalize_user_db_config(data: dict[str, Any]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    maybe_set_config_number(out, data, "timeout", min_value=1.0, cast=float)
    maybe_set_config_number(out, data, "maxConnections", min_value=1, cast=int)
    maybe_set_config_number(out, data, "queryTimeout", min_value=0.0, cast=float)
    return out


def maybe_set_config_number(
    out: dict[str, Any],
    data: dict[str, Any],
    key: str,
    *,
    min_value: float,
    cast,
) -> None:
    try:
        if key not in data:
            return
        raw = data.get(key)
        if raw is None:
            return
        out[key] = max(min_value, cast(raw))
    except Exception:
        return


def start_asset_lock_pruner(sqlite_obj: Any, *, interval_s: float) -> None:
    interval = max(5.0, float(interval_s))
    if interval <= 0:
        return
    if sqlite_obj._asset_locks_pruner and sqlite_obj._asset_locks_pruner.is_alive():
        return
    sqlite_obj._asset_locks_stop.clear()

    def _run() -> None:
        while not sqlite_obj._asset_locks_stop.wait(interval):
            now = time.time()
            try:
                with sqlite_obj._asset_locks_lock:
                    prune_asset_locks_locked(sqlite_obj, now)
            except Exception:
                continue

    sqlite_obj._asset_locks_pruner = threading.Thread(target=_run, name="mjr-asset-lock-pruner", daemon=True)
    sqlite_obj._asset_locks_pruner.start()


def stop_asset_lock_pruner(sqlite_obj: Any) -> None:
    sqlite_obj._asset_locks_stop.set()
    t = sqlite_obj._asset_locks_pruner
    sqlite_obj._asset_locks_pruner = None
    if t and t.is_alive():
        try:
            t.join(timeout=1.0)
        except Exception:
            pass
    try:
        with sqlite_obj._asset_locks_lock:
            sqlite_obj._asset_locks.clear()
    except Exception:
        pass


def prune_asset_locks_locked(sqlite_obj: Any, now: float) -> None:
    if not sqlite_obj._asset_locks:
        return
    cutoff = now - float(sqlite_obj._asset_locks_ttl_s)
    prune_asset_locks_by_ttl(sqlite_obj, cutoff)
    prune_asset_locks_by_cap(sqlite_obj)


def prune_asset_locks_by_ttl(sqlite_obj: Any, cutoff: float) -> None:
    try:
        for key, entry in list(sqlite_obj._asset_locks.items()):
            last = asset_lock_last(entry)
            if not last or last >= cutoff:
                continue
            if asset_lock_is_locked(entry):
                continue
            sqlite_obj._asset_locks.pop(key, None)
    except Exception:
        return


def prune_asset_locks_by_cap(sqlite_obj: Any) -> None:
    max_locks = int(sqlite_obj._asset_locks_max)
    if max_locks <= 0 or len(sqlite_obj._asset_locks) <= max_locks:
        return
    try:
        items = sorted(sqlite_obj._asset_locks.items(), key=lambda kv: asset_lock_last(kv[1]))
        to_drop = max(0, len(items) - max_locks)
        for key, entry in items[:to_drop]:
            if asset_lock_is_locked(entry):
                continue
            sqlite_obj._asset_locks.pop(key, None)
    except Exception:
        return


def asset_lock_last(entry: dict[str, Any]) -> float:
    try:
        return float(entry.get("last") or 0)
    except Exception:
        return 0.0


def asset_lock_is_locked(entry: dict[str, Any]) -> bool:
    try:
        lock = entry.get("lock")
        return bool(lock is not None and getattr(lock, "locked", None) and lock.locked())
    except Exception:
        return False


def get_or_create_asset_lock(sqlite_obj: Any, asset_id: Any, key_builder) -> Any:
    key = key_builder(asset_id)
    now = time.time()
    with sqlite_obj._asset_locks_lock:
        entry = sqlite_obj._asset_locks.get(key)
        if entry:
            try:
                entry["last"] = now
                return entry["lock"]
            except Exception:
                pass
        import asyncio
        lock = asyncio.Lock()
        sqlite_obj._asset_locks[key] = {"lock": lock, "last": now}
        prune_asset_locks_locked(sqlite_obj, now)
        return lock


def runtime_status(sqlite_obj: Any, *, busy_timeout_ms: int) -> dict[str, Any]:
    try:
        active = len(sqlite_obj._active_conns)
    except Exception:
        active = 0
    try:
        pooled = int(sqlite_obj._pool.qsize())
    except Exception:
        pooled = 0
    return {
        "active_connections": int(active),
        "pooled_connections": int(pooled),
        "max_connections": int(sqlite_obj._max_conn_limit),
        "query_timeout_s": float(sqlite_obj._query_timeout),
        "busy_timeout_ms": int(busy_timeout_ms),
    }


def diagnostics(sqlite_obj: Any) -> dict[str, Any]:
    with sqlite_obj._diag_lock:
        data = dict(sqlite_obj._diag)
    try:
        last = float(data.get("last_locked_at") or 0.0)
        if last and (time.time() - last) > 10.0:
            data["locked"] = False
    except Exception:
        pass
    return data
