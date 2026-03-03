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

    assert out.ok
    assert out.data == "Title: Long enhanced caption\nCaption: long enhanced caption"
    assert db.writes
    sql, params = db.writes[0]
    assert "UPDATE assets" in sql
    assert params == ("Title: Long enhanced caption\nCaption: long enhanced caption", 7)


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


def test_normalise_title_caption_wraps_plain_caption():
    from mjr_am_backend.features.index import vector_indexer as m

    out = m._normalise_title_caption("a cinematic robot portrait in neon rain")
    assert out == (
        "Title: A cinematic robot portrait in neon rain\n"
        "Caption: a cinematic robot portrait in neon rain"
    )


def test_extract_prompt_from_metadata_prefers_geninfo_positive_value():
    from mjr_am_backend.features.index import vector_indexer as m

    prompt = m._extract_prompt_from_metadata({
        "geninfo": {
            "positive": {
                "value": "ultra detailed city skyline at sunset",
            }
        }
    })
    assert prompt == "ultra detailed city skyline at sunset"


def test_extract_prompt_from_metadata_strips_negative_and_steps():
    from mjr_am_backend.features.index import vector_indexer as m

    prompt = m._extract_prompt_from_metadata({
        "parameters": (
            "masterpiece, portrait of a traveler\n"
            "Negative prompt: lowres, blurry\n"
            "Steps: 30, Sampler: Euler"
        )
    })
    assert prompt == "masterpiece, portrait of a traveler"
