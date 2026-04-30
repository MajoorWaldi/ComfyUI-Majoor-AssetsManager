"""Declarative route registration catalog used by ``routes.registry``."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from .handlers import (
    register_asset_docs_routes,
    register_asset_routes,
    register_audit_routes,
    register_batch_zip_routes,
    register_calendar_routes,
    register_collections_routes,
    register_custom_roots_routes,
    register_db_maintenance_routes,
    register_download_routes,
    register_duplicates_routes,
    register_health_routes,
    register_hybrid_search_routes,
    register_metadata_routes,
    register_plugin_routes,
    register_releases_routes,
    register_scan_routes,
    register_search_routes,
    register_stacks_routes,
    register_vector_search_routes,
    register_vendor_routes,
    register_version_routes,
    register_viewer_routes,
)

RouteRegisterFn = Callable[[Any], None]


@dataclass(frozen=True)
class RouteRegistration:
    label: str
    register_fn: RouteRegisterFn
    verbose_messages: tuple[str, ...] = ()


def register_download_and_duplicates(routes: Any) -> None:
    register_download_routes(routes)
    register_duplicates_routes(routes)


CORE_ROUTE_REGISTRATIONS: tuple[RouteRegistration, ...] = (
    RouteRegistration("health", register_health_routes),
    RouteRegistration("metadata", register_metadata_routes),
    RouteRegistration("custom roots", register_custom_roots_routes),
    RouteRegistration("search", register_search_routes),
    RouteRegistration("scan", register_scan_routes),
    RouteRegistration("assets", register_asset_routes),
    RouteRegistration("asset docs", register_asset_docs_routes),
    RouteRegistration("collections", register_collections_routes),
    RouteRegistration("batch zip", register_batch_zip_routes),
    RouteRegistration("calendar", register_calendar_routes),
    RouteRegistration("viewer", register_viewer_routes),
    RouteRegistration("stacks", register_stacks_routes),
    RouteRegistration("vendor", register_vendor_routes),
    RouteRegistration("db maintenance", register_db_maintenance_routes),
)


OPTIONAL_ROUTE_REGISTRATIONS: tuple[RouteRegistration, ...] = (
    RouteRegistration(
        "releases",
        register_releases_routes,
        ("  GET /mjr/am/releases (Added)",),
    ),
    RouteRegistration(
        "version",
        register_version_routes,
        (
            "  GET /mjr/am/version (Added)",
            "  GET /majoor/version (Legacy alias)",
        ),
    ),
    RouteRegistration(
        "download+duplicates",
        register_download_and_duplicates,
        ("  GET /mjr/am/download (Added)",),
    ),
    RouteRegistration(
        "vector search",
        register_vector_search_routes,
        (
            "  GET /mjr/am/vector/search (Added)",
            "  GET /mjr/am/vector/similar/{asset_id} (Added)",
            "  GET /mjr/am/vector/alignment/{asset_id} (Added)",
            "  GET /mjr/am/vector/auto-tags/{asset_id} (Added)",
            "  GET /mjr/am/vector/stats (Added)",
            "  POST /mjr/am/vector/index/{asset_id} (Added)",
            "  POST /mjr/am/vector/caption/{asset_id} (Added)",
            "  POST /mjr/am/vector/suggest-collections (Added)",
        ),
    ),
    RouteRegistration(
        "plugins",
        register_plugin_routes,
        (
            "  GET /mjr/am/plugins/list (Added)",
            "  POST /mjr/am/plugins/{name}/enable (Added)",
            "  POST /mjr/am/plugins/reload (Added)",
        ),
    ),
    RouteRegistration(
        "hybrid search",
        register_hybrid_search_routes,
        ("  GET /mjr/am/search/hybrid (Added)",),
    ),
    RouteRegistration(
        "audit",
        register_audit_routes,
        ("  GET /mjr/am/audit (Added)",),
    ),
)


__all__ = [
    "CORE_ROUTE_REGISTRATIONS",
    "OPTIONAL_ROUTE_REGISTRATIONS",
    "RouteRegistration",
]
