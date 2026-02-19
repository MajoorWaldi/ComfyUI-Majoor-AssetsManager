"""
Dependency injection - builds services.
Simple, debug-friendly DI without framework magic.
"""

import asyncio
from pathlib import Path
from typing import Optional

from .shared import Result, get_logger, log_success
from .adapters.db.sqlite import Sqlite
from .adapters.db.schema import migrate_schema, table_has_column
from .adapters.tools import ExifTool, FFProbe
from .features.metadata import MetadataService
from .features.health import HealthService
from .features.index import IndexService
from .features.index.watcher import OutputWatcher
from .features.index.watcher_scope import load_watcher_scope, build_watch_paths
from .features.tags import RatingTagsSyncWorker
from .features.duplicates import DuplicatesService
from .settings import AppSettings
from .config import (
    INDEX_DB,
    EXIFTOOL_BIN,
    EXIFTOOL_TIMEOUT,
    FFPROBE_BIN,
    FFPROBE_TIMEOUT,
    DB_TIMEOUT,
    DB_MAX_CONNECTIONS,
    WATCHER_ENABLED,
)

logger = get_logger(__name__)

def _resolve_db_path(db_path: Optional[str]) -> str:
    return db_path if db_path is not None else INDEX_DB


def _init_db_or_error(db_path: str) -> Result[Sqlite]:
    logger.info(f"Initializing database: {db_path}")
    try:
        return Result.Ok(Sqlite(db_path, max_connections=DB_MAX_CONNECTIONS, timeout=DB_TIMEOUT))
    except Exception as exc:
        logger.error("Failed to initialize database: %s", exc)
        return Result.Err("DB_ERROR", f"Failed to initialize database: {exc}")


async def _migrate_db_or_error(db: Sqlite) -> Result[bool]:
    migrate_result = await migrate_schema(db)
    if not migrate_result.ok:
        logger.error(f"Schema migration failed: {migrate_result.error}")
        return Result.Err(migrate_result.code or "DB_ERROR", f"Failed to initialize database: {migrate_result.error}")
    return Result.Ok(True)


def _init_tools_and_settings(db: Sqlite) -> tuple[ExifTool, FFProbe, AppSettings]:
    exiftool = ExifTool(bin_name=EXIFTOOL_BIN or "exiftool", timeout=EXIFTOOL_TIMEOUT)
    ffprobe = FFProbe(bin_name=FFPROBE_BIN or "ffprobe", timeout=FFPROBE_TIMEOUT)
    settings_service = AppSettings(db)
    return exiftool, ffprobe, settings_service


def _log_tool_availability(exiftool: ExifTool, ffprobe: FFProbe) -> None:
    if exiftool.is_available():
        log_success(logger, "ExifTool is available")
    else:
        logger.warning("ExifTool not found - metadata extraction will be limited")
    if ffprobe.is_available():
        log_success(logger, "ffprobe is available")
    else:
        logger.warning("ffprobe not found - video metadata will be limited")


def _build_services_dict(
    db: Sqlite,
    exiftool: ExifTool,
    ffprobe: FFProbe,
    metadata_service: MetadataService,
    health_service: HealthService,
    index_service: IndexService,
    settings_service: AppSettings,
) -> dict:
    return {
        "db": db,
        "exiftool": exiftool,
        "ffprobe": ffprobe,
        "metadata": metadata_service,
        "health": health_service,
        "index": index_service,
        "settings": settings_service,
        "duplicates": DuplicatesService(db),
    }


async def build_services(db_path: Optional[str] = None) -> Result[dict]:
    """
    Build all services (DI container).

    Args:
        db_path: Path to SQLite database (default: from config.INDEX_DB)

    Returns:
        Result[dict] of service instances
    """
    logger.info("Building services...")

    db_path = _resolve_db_path(db_path)
    db_res = _init_db_or_error(db_path)
    if not db_res.ok:
        return Result.Err(db_res.code or "DB_ERROR", db_res.error or "Failed to initialize database")
    db = db_res.data

    migrate_result = await _migrate_db_or_error(db)
    if not migrate_result.ok:
        return migrate_result  # type: ignore[return-value]

    exiftool, ffprobe, settings_service = _init_tools_and_settings(db)
    try:
        await settings_service.ensure_security_bootstrap()
    except Exception as exc:
        logger.warning("Security bootstrap failed: %s", exc)

    _log_tool_availability(exiftool, ffprobe)

    # Build services
    metadata_service = MetadataService(
        exiftool=exiftool,
        ffprobe=ffprobe,
        settings=settings_service,
    )

    health_service = HealthService(
        db=db,
        exiftool=exiftool,
        ffprobe=ffprobe
    )

    # Check for optional columns
    matches = await table_has_column(db, "asset_metadata", "tags_text")

    index_service = IndexService(
        db=db,
        metadata_service=metadata_service,
        has_tags_text_column=matches
    )

    services = _build_services_dict(
        db,
        exiftool,
        ffprobe,
        metadata_service,
        health_service,
        index_service,
        settings_service,
    )
    try:
        services["watcher_scope"] = await load_watcher_scope(db)
    except Exception:
        services["watcher_scope"] = {"scope": "output", "custom_root_id": ""}

    # Best-effort filesystem sync for rating/tags (sidecar / ExifTool).
    try:
        services["rating_tags_sync"] = RatingTagsSyncWorker(exiftool)
    except Exception as exc:
        logger.debug("RatingTagsSyncWorker disabled: %s", exc)

    # File watcher for manual additions (enabled by default; disable with MJR_ENABLE_WATCHER=0)
    if WATCHER_ENABLED:
        try:
            watcher = await _create_watcher(index_service)
            services["watcher"] = watcher
            log_success(logger, "File watcher enabled")
        except Exception as exc:
            logger.warning("File watcher disabled: %s", exc)

    log_success(logger, "All services initialized")
    return Result.Ok(services)


async def _create_watcher(index_service: IndexService) -> OutputWatcher:
    """Create and start the file watcher for output directories."""

    async def index_callback(filepaths: list, base_dir: str, source: str | None = None, root_id: str | None = None):
        """Called by watcher when files are ready to index."""
        if not filepaths:
            return
        paths = [Path(f) for f in filepaths if f]
        if paths:
            await index_service.index_paths(
                paths=paths,
                base_dir=base_dir,
                incremental=True,
                source=source or "watcher",
                root_id=root_id,
            )

    async def remove_callback(filepaths: list, _base_dir: str, _source: str | None = None, _root_id: str | None = None):
        if not filepaths:
            return
        for fp in filepaths:
            try:
                await index_service.remove_file(str(fp))
            except Exception:
                continue

    async def move_callback(moves: list, _base_dir: str, _source: str | None = None, _root_id: str | None = None):
        if not moves:
            return
        for move in moves:
            try:
                old_fp, new_fp = move
            except Exception:
                continue
            try:
                res = await index_service.rename_file(str(old_fp), str(new_fp))
                if not res.ok:
                    await index_service.remove_file(str(old_fp))
                    await index_service.index_paths(
                        paths=[Path(str(new_fp))],
                        base_dir=str(_base_dir),
                        incremental=True,
                        source=_source or "watcher",
                        root_id=_root_id,
                    )
            except Exception:
                continue

    watcher = OutputWatcher(index_callback, remove_callback=remove_callback, move_callback=move_callback)

    # Collect directories to watch
    try:
        scope_cfg = await load_watcher_scope(index_service.db)
    except Exception:
        scope_cfg = {"scope": "output", "custom_root_id": ""}

    scope = str((scope_cfg or {}).get("scope") or "output")
    custom_root_id = (scope_cfg or {}).get("custom_root_id")
    watch_paths = build_watch_paths(scope, custom_root_id)

    if watch_paths:
        loop = asyncio.get_event_loop()
        await watcher.start(watch_paths, loop)

    return watcher
