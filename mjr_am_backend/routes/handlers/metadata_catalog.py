"""Metadata catalog and discovery routes."""

from __future__ import annotations

from aiohttp import web
from mjr_am_backend.features.metadata.key_aggregator import aggregate_metadata_keys
from mjr_am_backend.features.metadata.parser_backfill import (
    metadata_parser_backfill_status,
    run_metadata_parser_backfill,
)
from mjr_am_backend.features.metadata.section_catalog import (
    PARSER_FAMILY_VERSION,
    get_metadata_section_catalog,
)
from mjr_am_backend.shared import Result, sanitize_error_message

from ..core import _json_response, _require_services


def register_metadata_catalog_routes(routes: web.RouteTableDef) -> None:
    @routes.get("/mjr/am/metadata/catalog")
    async def get_metadata_catalog(_request: web.Request) -> web.Response:
        return _json_response(Result.Ok(get_metadata_section_catalog()))

    @routes.get("/mjr/am/metadata/keys")
    async def get_metadata_keys(request: web.Request) -> web.Response:
        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)
        try:
            limit = int(request.query.get("limit", "5000"))
        except Exception:
            limit = 5000
        try:
            db = svc.get("db") if isinstance(svc, dict) else None
            if db is None:
                return _json_response(Result.Err("SERVICE_UNAVAILABLE", "Database service unavailable"))
            payload = await aggregate_metadata_keys(db, limit=limit)
            return _json_response(Result.Ok(payload))
        except Exception as exc:
            return _json_response(
                Result.Err("METADATA_KEYS_FAILED", sanitize_error_message(exc, "Failed to aggregate metadata keys"))
            )

    @routes.get("/mjr/am/metadata/parser-version")
    async def get_metadata_parser_version(_request: web.Request) -> web.Response:
        return _json_response(Result.Ok({"parser_family_version": PARSER_FAMILY_VERSION}))

    @routes.get("/mjr/am/metadata/backfill-parser-version")
    async def get_metadata_backfill_status(_request: web.Request) -> web.Response:
        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)
        try:
            db = svc.get("db") if isinstance(svc, dict) else None
            if db is None:
                return _json_response(Result.Err("SERVICE_UNAVAILABLE", "Database service unavailable"))
            return _json_response(await metadata_parser_backfill_status(db))
        except Exception as exc:
            return _json_response(
                Result.Err("METADATA_BACKFILL_STATUS_FAILED", sanitize_error_message(exc, "Failed to inspect metadata backfill status"))
            )

    @routes.post("/mjr/am/metadata/backfill-parser-version")
    async def post_metadata_backfill(request: web.Request) -> web.Response:
        svc, error_result = await _require_services()
        if error_result:
            return _json_response(error_result)
        try:
            db = svc.get("db") if isinstance(svc, dict) else None
            if db is None:
                return _json_response(Result.Err("SERVICE_UNAVAILABLE", "Database service unavailable"))
            try:
                payload = await request.json()
            except Exception:
                payload = {}
            limit = int(payload.get("limit") or request.query.get("limit") or 1000)
            return _json_response(await run_metadata_parser_backfill(db, limit=limit))
        except Exception as exc:
            return _json_response(
                Result.Err("METADATA_BACKFILL_FAILED", sanitize_error_message(exc, "Failed to backfill metadata parser version"))
            )
