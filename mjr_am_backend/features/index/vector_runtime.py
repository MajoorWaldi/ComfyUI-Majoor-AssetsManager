"""
Shared lazy vector-service initialization.

Centralizes runtime creation of VectorService/VectorSearcher so route handlers
and indexing flows do not each build their own instances with divergent state.
"""

from __future__ import annotations

import asyncio
from typing import Any

from ...config import is_vector_search_enabled
from ...runtime_activity import is_generation_busy
from ...shared import Result


def _get_vector_runtime_lock(services: dict[str, Any]) -> asyncio.Lock:
    lock = services.get("_vector_runtime_lock")
    if isinstance(lock, asyncio.Lock):
        return lock
    lock = asyncio.Lock()
    services["_vector_runtime_lock"] = lock
    return lock


def _build_vector_runtime(db: Any) -> tuple[Any, Any]:
    from .vector_searcher import VectorSearcher
    from .vector_service import VectorService

    vector_service = VectorService()
    vector_searcher = VectorSearcher(db, vector_service)
    return vector_service, vector_searcher


def _current_runtime(services: dict[str, Any]) -> tuple[Any | None, Any | None]:
    return services.get("vector_service"), services.get("vector_searcher")


def _has_runtime(runtime: tuple[Any | None, Any | None]) -> bool:
    vector_service, vector_searcher = runtime
    return vector_service is not None and vector_searcher is not None


def _store_runtime(services: dict[str, Any], runtime: tuple[Any, Any]) -> tuple[Any, Any]:
    vector_service, vector_searcher = runtime
    services["vector_service"] = vector_service
    services["vector_searcher"] = vector_searcher
    return vector_service, vector_searcher


def _purge_comfy_model_memory() -> dict[str, Any]:
    released: dict[str, Any] = {
        "attempted": False,
        "unload_all_models": False,
        "soft_empty_cache": False,
    }
    try:
        import comfy.model_management as model_management  # type: ignore
    except Exception as exc:
        released["error"] = f"ComfyUI model management unavailable: {exc}"
        return released

    released["attempted"] = True
    try:
        unload_all = getattr(model_management, "unload_all_models", None)
        if callable(unload_all):
            unload_all()
            released["unload_all_models"] = True
    except Exception as exc:
        released["unload_error"] = str(exc)

    try:
        soft_empty_cache = getattr(model_management, "soft_empty_cache", None)
        if callable(soft_empty_cache):
            try:
                soft_empty_cache(force=True)
            except TypeError:
                soft_empty_cache()
            released["soft_empty_cache"] = True
    except Exception as exc:
        released["cache_error"] = str(exc)

    return released


def unload_vector_runtime_models(
    services: dict[str, Any] | None,
    *,
    purge_comfy_models: bool = False,
) -> Result[dict[str, Any]]:
    """Unload Majoor vector/AI models and optionally ask ComfyUI to purge loaded models."""
    if is_generation_busy(include_cooldown=False):
        return Result.Err(
            "COMFY_BUSY",
            "ComfyUI is currently executing. Retry unloading Majoor AI models when the queue is idle.",
        )
    released: dict[str, Any] = {
        "vector_service": False,
        "searcher_invalidated": False,
        "comfy_models": False,
    }
    try:
        from .vector_service import unload_global_model_cache

        if isinstance(services, dict):
            vector_service = services.get("vector_service")
            unload = getattr(vector_service, "unload_models", None)
            if callable(unload):
                released["vector_service"] = True
                released["models"] = unload()
            else:
                released["models"] = unload_global_model_cache()

            searcher = services.get("vector_searcher")
            invalidate = getattr(searcher, "invalidate", None)
            if callable(invalidate):
                invalidate()
                released["searcher_invalidated"] = True
        else:
            released["models"] = unload_global_model_cache()
        if purge_comfy_models:
            comfy_release = _purge_comfy_model_memory()
            released["comfy_model_management"] = comfy_release
            released["comfy_models"] = bool(
                comfy_release.get("unload_all_models") or comfy_release.get("soft_empty_cache")
            )
        return Result.Ok(released)
    except Exception as exc:
        return Result.Err("SERVICE_UNAVAILABLE", f"Failed to unload Majoor AI models: {exc}")


async def maybe_unload_vector_runtime_after_use(
    services: dict[str, Any] | None,
    *,
    logger: Any = None,
) -> Result[dict[str, Any]] | None:
    try:
        from ...config import is_vector_unload_after_use_enabled

        if not is_vector_unload_after_use_enabled():
            return None
        result = unload_vector_runtime_models(services)
        if logger is not None and result.ok:
            logger.debug("Majoor AI vector models unloaded after use: %s", result.data)
        return result
    except Exception as exc:
        if logger is not None:
            logger.debug("Majoor AI vector unload-after-use skipped: %s", exc)
        return None


async def ensure_vector_runtime(
    services: dict[str, Any] | None,
    *,
    logger: Any = None,
    reason: str = "runtime",
) -> tuple[Any | None, Any | None]:
    if not is_vector_search_enabled() or not isinstance(services, dict):
        return None, None

    runtime = _current_runtime(services)
    if _has_runtime(runtime):
        return runtime

    if is_generation_busy(include_cooldown=False):
        if logger is not None:
            try:
                logger.info(
                    "Vector runtime initialization deferred while ComfyUI is executing (%s)",
                    str(reason or "runtime"),
                )
            except Exception:
                pass
        return None, None

    if services.get("db") is None:
        return None, None

    lock = _get_vector_runtime_lock(services)
    async with lock:
        runtime = _current_runtime(services)
        if _has_runtime(runtime):
            return runtime
        vector_service, vector_searcher = _store_runtime(
            services,
            _build_vector_runtime(services["db"]),
        )
        if logger is not None:
            try:
                logger.info("Vector services initialized lazily (%s)", str(reason or "runtime"))
            except Exception:
                pass
        return vector_service, vector_searcher
