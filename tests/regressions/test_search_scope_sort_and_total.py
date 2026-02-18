import pytest
from aiohttp import web
from aiohttp.test_utils import TestClient, TestServer

from mjr_am_backend.routes.handlers.search import register_search_routes, _dedupe_result_assets_payload
from mjr_am_backend.shared import Result
from mjr_am_backend.features.index.searcher import _build_filter_clauses


class _FakeIndexOutputTotal:
    async def search_scoped(self, *_args, **_kwargs):
        assets = [
            {"id": 1, "filename": "a.png", "filepath": r"C:\out\a.png", "mtime": 10, "source": "output"},
            {"id": 2, "filename": "b.png", "filepath": r"C:\out\b.png", "mtime": 9, "source": "output"},
        ]
        return Result.Ok({"assets": assets, "total": 123, "limit": 2, "offset": 0, "query": "*"})


class _FakeIndexAllFallback:
    def __init__(self):
        self._out = [
            {"id": 10, "filename": "b.png", "filepath": r"C:\out\b.png", "mtime": 10, "source": "output"},
            {"id": 11, "filename": "d.png", "filepath": r"C:\out\d.png", "mtime": 8, "source": "output"},
        ]

    async def has_assets_under_root(self, _root: str):
        return Result.Ok(False)

    async def search_scoped(self, _query, roots=None, limit=50, offset=0, **_kwargs):
        items = self._out[offset: offset + limit]
        return Result.Ok(
            {
                "assets": [dict(a) for a in items],
                "total": len(self._out),
                "limit": int(limit),
                "offset": int(offset),
                "query": _query,
            }
        )


@pytest.mark.asyncio
async def test_list_output_keeps_backend_total(monkeypatch, tmp_path):
    import mjr_am_backend.routes.handlers.search as mod

    out_root = tmp_path / "output"
    out_root.mkdir(parents=True, exist_ok=True)
    in_root = tmp_path / "input"
    in_root.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr(mod, "OUTPUT_ROOT", str(out_root), raising=True)
    monkeypatch.setattr(
        mod,
        "folder_paths",
        type("FP", (), {"get_input_directory": staticmethod(lambda: str(in_root))}),
        raising=True,
    )

    async def _mock_require_services():
        return ({"index": _FakeIndexOutputTotal()}, None)

    monkeypatch.setattr(mod, "_require_services", _mock_require_services, raising=True)

    routes = web.RouteTableDef()
    register_search_routes(routes)
    app = web.Application()
    app.add_routes(routes)
    client = TestClient(TestServer(app))
    await client.start_server()
    try:
        resp = await client.get("/mjr/am/list?scope=output&q=*&limit=2&offset=0")
        payload = await resp.json()
        assert payload["ok"] is True
        data = payload["data"]
        assert int(data.get("total") or 0) == 123
        assert len(data.get("assets") or []) == 2
    finally:
        await client.close()


@pytest.mark.asyncio
async def test_list_all_fallback_global_name_sort(monkeypatch, tmp_path):
    import mjr_am_backend.routes.handlers.search as mod

    out_root = tmp_path / "output"
    out_root.mkdir(parents=True, exist_ok=True)
    in_root = tmp_path / "input"
    in_root.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr(mod, "OUTPUT_ROOT", str(out_root), raising=True)
    monkeypatch.setattr(
        mod,
        "folder_paths",
        type("FP", (), {"get_input_directory": staticmethod(lambda: str(in_root))}),
        raising=True,
    )

    async def _mock_require_services():
        return ({"index": _FakeIndexAllFallback()}, None)

    async def _mock_fs(_root, _subfolder, _query, limit, offset, **_kwargs):
        in_assets = [
            {"filename": "a.png", "filepath": r"C:\in\a.png", "mtime": 11, "type": "input"},
            {"filename": "c.png", "filepath": r"C:\in\c.png", "mtime": 9, "type": "input"},
        ]
        page = in_assets[offset: offset + limit]
        return Result.Ok(
            {
                "assets": [dict(a) for a in page],
                "total": len(in_assets),
                "limit": int(limit),
                "offset": int(offset),
                "query": _query,
            }
        )

    async def _mock_kickoff(*_args, **_kwargs):
        return None

    monkeypatch.setattr(mod, "_require_services", _mock_require_services, raising=True)
    monkeypatch.setattr(mod, "_list_filesystem_assets", _mock_fs, raising=True)
    monkeypatch.setattr(mod, "_kickoff_background_scan", _mock_kickoff, raising=True)

    routes = web.RouteTableDef()
    register_search_routes(routes)
    app = web.Application()
    app.add_routes(routes)
    client = TestClient(TestServer(app))
    await client.start_server()
    try:
        resp = await client.get("/mjr/am/list?scope=all&q=*&limit=4&offset=0&sort=name_asc")
        payload = await resp.json()
        assert payload["ok"] is True
        names = [str(a.get("filename") or "") for a in (payload["data"].get("assets") or [])]
        assert names == ["a.png", "b.png", "c.png", "d.png"]
        assert int(payload["data"].get("total") or 0) == 4
    finally:
        await client.close()


def test_exclude_root_filter_uses_path_boundary():
    clauses, params = _build_filter_clauses({"exclude_root": r"C:\root\input"})
    where = " ".join(clauses)
    assert "LIKE ? ESCAPE" in where
    assert params[0] == r"C:\root\input"
    assert str(params[1]).endswith(r"input\\%")


def test_dedupe_payload_preserves_backend_total_when_larger():
    payload = {
        "assets": [
            {"id": 1, "filepath": r"C:\out\a.png"},
            {"id": 2, "filepath": r"C:\out\a.png"},
            {"id": 3, "filepath": r"C:\out\b.png"},
        ],
        "total": 123,
        "limit": 50,
        "offset": 0,
    }
    out = _dedupe_result_assets_payload(payload)
    assets = out.get("assets") or []
    assert len(assets) == 2
    assert int(out.get("total") or 0) == 123


def test_dedupe_payload_total_at_least_visible_assets():
    payload = {
        "assets": [
            {"id": 1, "filepath": r"C:\out\a.png"},
            {"id": 2, "filepath": r"C:\out\b.png"},
        ],
        "total": 1,
    }
    out = _dedupe_result_assets_payload(payload)
    assert len(out.get("assets") or []) == 2
    assert int(out.get("total") or 0) == 2
