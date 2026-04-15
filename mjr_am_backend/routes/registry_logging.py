"""Logging and route-introspection helpers for route registration."""

from __future__ import annotations

import os
import sqlite3

from aiohttp import web
from mjr_am_backend.config import get_runtime_index_db_path
from mjr_am_backend.shared import get_logger
from mjr_am_backend.utils import parse_bool

logger = get_logger(__name__)

_ROUTE_VERBOSE_LOG_ENV_KEYS = (
    "MAJOOR_ROUTE_VERBOSE_LOGS",
    "MJR_AM_ROUTE_VERBOSE_LOGS",
    "MAJOOR_VERBOSE_ROUTE_LOGS",
    "MJR_AM_VERBOSE_ROUTE_LOGS",
)
_ROUTE_VERBOSE_LOGS_DB_KEY = "route_verbose_logs"


def _route_verbose_logs_enabled() -> bool:
    env_value = _read_route_verbose_logs_env()
    if env_value is not None:
        return env_value
    return _read_route_verbose_logs_from_db()


def _read_route_verbose_logs_env() -> bool | None:
    for key in _ROUTE_VERBOSE_LOG_ENV_KEYS:
        try:
            raw = os.environ.get(key)
        except Exception:
            raw = None
        if raw is None or str(raw).strip() == "":
            continue
        return parse_bool(raw, False)
    return None


def _read_route_verbose_logs_from_db() -> bool:
    try:
        with sqlite3.connect(str(get_runtime_index_db_path())) as conn:
            row = conn.execute(
                "SELECT value FROM metadata WHERE key = ?",
                (_ROUTE_VERBOSE_LOGS_DB_KEY,),
            ).fetchone()
    except Exception:
        return False
    if not row:
        return False
    try:
        return parse_bool(row[0], False)
    except Exception:
        return False


def _log_route_registration_summary(verbose: bool) -> None:
    if not verbose:
        logger.info(
            "Routes registered: summary mode. Enable verbose route registration logs in Majoor Settings to list each endpoint at startup."
        )
        return

    logger.info("=" * 60)
    logger.info("Routes registered:")
    logger.info("  GET /mjr/am/health")
    logger.info("  GET /mjr/am/health/counters")
    logger.info("  GET /mjr/am/health/db")
    logger.info("  GET /mjr/am/config")
    logger.info("  GET /mjr/am/tools/status")
    logger.info("  GET /mjr/am/metadata?type=<scope>&filename=<name>&subfolder=<sub>&root_id=<id>")
    logger.info("  POST /mjr/am/scan")
    logger.info("  POST /mjr/am/index-files")
    logger.info("  POST /mjr/am/stage-to-input")
    logger.info("  POST /mjr/am/open-in-folder")
    logger.info("  GET /mjr/am/search?q=<query>")
    logger.info("  GET /mjr/am/asset/{asset_id}")
    logger.info("  POST /mjr/am/asset/rename")
    logger.info("  POST /mjr/am/assets/delete")
    logger.info("  POST /mjr/am/assets/rename")
    logger.info("  GET /mjr/am/collections")
    logger.info("  GET /mjr/am/date-histogram?month=YYYY-MM")
    logger.info("  POST /mjr/am/batch-zip")
    logger.info("  GET /mjr/am/batch-zip/{token}")
    logger.info("  GET /mjr/am/viewer/info?asset_id=<id>")
    logger.info("  POST /mjr/am/db/optimize")
    logger.info("  POST /mjr/am/db/cleanup-case-duplicates")
    logger.info("  POST /mjr/am/db/force-delete")
    logger.info("  GET /mjr/am/download")
    logger.info("  GET /mjr/am/releases")
    logger.info("  GET /mjr/am/duplicates/alerts")
    logger.info("=" * 60)


def _extract_app_paths(app: web.Application) -> set[str]:
    paths: set[str] = set()
    try:
        for route in app.router.routes():
            try:
                resource = getattr(route, "resource", None)
                canonical = getattr(resource, "canonical", None)
                if isinstance(canonical, str) and canonical:
                    paths.add(canonical)
            except Exception:
                continue
    except Exception:
        pass
    return paths


def _extract_table_paths(routes: web.RouteTableDef) -> set[str]:
    paths: set[str] = set()
    try:
        for item in routes:
            path = getattr(item, "path", None)
            if isinstance(path, str) and path:
                paths.add(path)
    except Exception:
        pass
    return paths


def _log_route_collisions(app: web.Application, routes: web.RouteTableDef) -> None:
    try:
        app_paths = _extract_app_paths(app)
        table_paths = _extract_table_paths(routes)
        overlaps = sorted(app_paths.intersection(table_paths))
        if overlaps:
            logger.warning(
                "Potential route path collisions detected before registration: %s",
                ", ".join(overlaps[:20]),
            )
    except Exception:
        pass


__all__ = [
    "_extract_app_paths",
    "_extract_table_paths",
    "_log_route_collisions",
    "_log_route_registration_summary",
    "_read_route_verbose_logs_env",
    "_read_route_verbose_logs_from_db",
    "_route_verbose_logs_enabled",
]
