from aiohttp import web

from mjr_am_backend.routes.handlers.version import register_version_routes


def test_version_routes_have_canonical_and_legacy_alias():
    routes = web.RouteTableDef()
    register_version_routes(routes)
    app = web.Application()
    app.add_routes(routes)
    resources = {str(r) for r in app.router.resources()}
    assert any("/mjr/am/version" in r for r in resources)
    assert any("/majoor/version" in r for r in resources)
