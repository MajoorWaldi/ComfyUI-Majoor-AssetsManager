"""Tests for route collision logging (regression: false-positive /embeddings).

The route table handed to ``_log_route_collisions`` is ComfyUI's shared
``PromptServer.instance.routes``, which also contains ComfyUI core routes
(e.g. ``/embeddings``). Those must not be reported as collisions caused by
Majoor (GitHub issue #167 log noise).
"""

from __future__ import annotations

from aiohttp import web
from mjr_am_backend.routes import registry_logging


async def _dummy_handler(_request):  # pragma: no cover - never invoked
    return web.Response()


def _app_with_routes(paths: list[str]) -> web.Application:
    app = web.Application()
    for path in paths:
        app.router.add_get(path, _dummy_handler)
    return app


def _table_with_routes(paths: list[str]) -> web.RouteTableDef:
    routes = web.RouteTableDef()
    for path in paths:
        routes.get(path)(_dummy_handler)
    return routes


def _capture_warnings(monkeypatch) -> list[str]:
    messages: list[str] = []

    def _warning(msg, *args, **_kwargs):
        messages.append(msg % args if args else str(msg))

    monkeypatch.setattr(registry_logging.logger, "warning", _warning)
    return messages


def test_core_route_overlap_is_not_reported(monkeypatch) -> None:
    # /embeddings exists both on the app (ComfyUI core) and in the shared
    # route table -- but it is not a Majoor route, so no warning is expected.
    messages = _capture_warnings(monkeypatch)
    app = _app_with_routes(["/embeddings"])
    table = _table_with_routes(["/embeddings", "/mjr/am/health"])

    registry_logging._log_route_collisions(app, table)

    assert not messages


def test_majoor_route_overlap_is_reported(monkeypatch) -> None:
    messages = _capture_warnings(monkeypatch)
    app = _app_with_routes(["/mjr/am/health"])
    table = _table_with_routes(["/mjr/am/health"])

    registry_logging._log_route_collisions(app, table)

    assert messages and "/mjr/am/health" in messages[0]
