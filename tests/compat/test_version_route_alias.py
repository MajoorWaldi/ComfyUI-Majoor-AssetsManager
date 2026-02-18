from aiohttp import web

from mjr_am_backend.routes.handlers.version import register_version_routes


def test_version_route_aliases_are_registered():
    routes = web.RouteTableDef()
    register_version_routes(routes)

    app = web.Application()
    app.add_routes(routes)

    canonical = {
        r.resource.canonical
        for r in app.router.routes()
        if getattr(r, "method", "") == "GET"
    }

    assert "/mjr/am/version" in canonical
    assert "/majoor/version" in canonical
