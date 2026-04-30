"""PromptServer compatibility helpers for route registration."""

from __future__ import annotations

from typing import ClassVar, Protocol, cast

from aiohttp import web


class _PromptServerInstance(Protocol):
    routes: web.RouteTableDef
    app: web.Application | None

    def send_sync(self, event: str, data: object) -> None: ...


class _PromptServer(Protocol):
    instance: ClassVar[_PromptServerInstance]


class _PromptServerInstanceStub:
    routes: web.RouteTableDef = web.RouteTableDef()
    app: web.Application | None = None

    def send_sync(self, event: str, data: object) -> None:
        _ = (event, data)
        return None


class _PromptServerStub:
    instance: ClassVar[_PromptServerInstanceStub] = _PromptServerInstanceStub()


def _get_prompt_server() -> type[_PromptServer]:
    # Never import ComfyUI's `server` module here; it can trigger heavy init cascades.
    import sys

    try:
        server_mod = sys.modules.get("server")
        if server_mod is None or not hasattr(server_mod, "PromptServer"):
            raise ImportError("ComfyUI server not loaded")
        return cast(type[_PromptServer], server_mod.PromptServer)
    except Exception:
        return cast(type[_PromptServer], _PromptServerStub)


class _PromptServerProxy:
    @property
    def instance(self) -> _PromptServerInstance:
        return _get_prompt_server().instance


PromptServer = _PromptServerProxy()

__all__ = [
    "PromptServer",
    "_PromptServer",
    "_PromptServerInstance",
    "_PromptServerInstanceStub",
    "_PromptServerProxy",
    "_PromptServerStub",
    "_get_prompt_server",
]
