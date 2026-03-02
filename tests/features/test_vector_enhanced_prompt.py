import pytest


class _DB:
    def __init__(self):
        self.writes = []

    async def aquery(self, sql, params=()):
        from mjr_am_backend.shared import Result

        if "SELECT filepath, kind FROM assets" in sql:
            return Result.Ok([{"filepath": "C:/imgs/a.png", "kind": "image"}])
        return Result.Ok([])

    async def aexecute(self, sql, params=()):
        from mjr_am_backend.shared import Result

        self.writes.append((sql, params))
        return Result.Ok(True)


class _VS:
    async def generate_enhanced_caption(self, _filepath):
        from mjr_am_backend.shared import Result

        return Result.Ok("long enhanced caption")


@pytest.mark.asyncio
async def test_generate_enhanced_prompt_stores_caption():
    from mjr_am_backend.features.index import vector_indexer as m

    db = _DB()
    vs = _VS()

    out = await m.generate_enhanced_prompt(db, vs, 7)

    assert out.ok and out.data == "long enhanced caption"
    assert db.writes
    sql, params = db.writes[0]
    assert "UPDATE assets" in sql
    assert params == ("long enhanced caption", 7)


@pytest.mark.asyncio
async def test_generate_enhanced_prompt_rejects_non_image():
    from mjr_am_backend.features.index import vector_indexer as m

    class _DBVideo(_DB):
        async def aquery(self, sql, params=()):
            from mjr_am_backend.shared import Result

            if "SELECT filepath, kind FROM assets" in sql:
                return Result.Ok([{"filepath": "C:/vids/a.mp4", "kind": "video"}])
            return Result.Ok([])

    db = _DBVideo()
    vs = _VS()

    out = await m.generate_enhanced_prompt(db, vs, 8)

    assert out.ok is False
    assert out.code == "INVALID_INPUT"
