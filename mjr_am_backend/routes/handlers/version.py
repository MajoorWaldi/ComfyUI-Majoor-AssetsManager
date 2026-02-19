"""
Version reporting endpoint.
"""
from aiohttp import web

from mjr_am_backend.shared import Result
from mjr_am_shared.version import get_version_info
from ..core import _json_response


def register_version_routes(routes: web.RouteTableDef) -> None:
    """
    Expose the currently installed Majoor Assets Manager version.
    """
    async def _get_version(_request: web.Request) -> web.Response:
        data = get_version_info()
        return _json_response(Result.Ok(data))

    routes.get("/mjr/am/version")(_get_version)
    routes.get("/majoor/version")(_get_version)
