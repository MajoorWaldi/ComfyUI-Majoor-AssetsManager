import pytest
from mjr_am_backend.features.index import vector_indexer as m
from mjr_am_backend.shared import Result


class _DB:
    def __init__(self):
        self.calls = []

    async def aexecute(self, sql, params=()):
        self.calls.append((sql, params))
        return Result.Ok(True)


class _VS:
    def __init__(self):
        self._model_name = "test-model"
        self.video_calls = 0
        self.image_calls = 0
        self.caption_calls = 0

    async def get_video_embedding(self, _filepath):
        self.video_calls += 1
        return Result.Ok([1.0, 0.0])

    async def get_image_embedding(self, _filepath):
        self.image_calls += 1
        return Result.Ok([1.0, 0.0])

    async def get_text_embedding(self, _prompt):
        return Result.Ok([1.0, 0.0])

    async def generate_enhanced_caption(self, _filepath):
        self.caption_calls += 1
        return Result.Ok("generated caption")


@pytest.mark.asyncio
async def test_index_asset_vector_video_stores_prompt_alignment(monkeypatch):
    db = _DB()
    vs = _VS()

    monkeypatch.setattr(m, "is_vector_search_enabled", lambda: True)

    async def _noop_autotags(_db, _vs, _asset_id, _image_vector):
        return None

    monkeypatch.setattr(m, "_apply_autotags", _noop_autotags)

    out = await m.index_asset_vector(
        db,
        vs,
        asset_id=123,
        filepath="C:/videos/sample.mp4",
        kind="video",
        metadata_raw={"prompt": "cinematic sunset over mountains"},
    )

    assert out.ok and out.data is True
    assert vs.video_calls == 1
    assert db.calls

    store_sql, store_params = db.calls[0]
    assert "INSERT INTO vec.asset_embeddings" in store_sql
    assert "WHERE EXISTS (SELECT 1 FROM assets WHERE id = ?)" in store_sql
    assert store_params[0] == 123
    # With identical image/text vectors (cosine=1.0), calibrated score is 1.0
    assert store_params[2] is not None
    assert store_params[2] >= 0.99


@pytest.mark.asyncio
async def test_index_asset_vector_video_without_prompt_stores_null_alignment(monkeypatch):
    db = _DB()
    vs = _VS()

    monkeypatch.setattr(m, "is_vector_search_enabled", lambda: True)

    async def _noop_autotags(_db, _vs, _asset_id, _image_vector):
        return None

    monkeypatch.setattr(m, "_apply_autotags", _noop_autotags)

    out = await m.index_asset_vector(
        db,
        vs,
        asset_id=456,
        filepath="C:/videos/sample-no-prompt.mp4",
        kind="video",
        metadata_raw={"workflow": {"nodes": []}},
    )

    assert out.ok and out.data is True
    assert db.calls
    _, store_params = db.calls[0]
    assert store_params[0] == 456
    assert store_params[2] is None


@pytest.mark.asyncio
async def test_index_asset_vector_video_filepath_prompt_stores_null_alignment(monkeypatch):
    db = _DB()
    vs = _VS()

    monkeypatch.setattr(m, "is_vector_search_enabled", lambda: True)

    async def _noop_autotags(_db, _vs, _asset_id, _image_vector):
        return None

    monkeypatch.setattr(m, "_apply_autotags", _noop_autotags)

    out = await m.index_asset_vector(
        db,
        vs,
        asset_id=789,
        filepath="C:/videos/sample-path-prompt.mp4",
        kind="video",
        metadata_raw={"prompt": "d:/__comfy_outputs/projects/veille/02_out/videos/260402/lidox.mp4"},
    )

    assert out.ok and out.data is True
    assert db.calls
    _, store_params = db.calls[0]
    assert store_params[0] == 789
    assert store_params[2] is None


@pytest.mark.asyncio
async def test_index_asset_vector_image_does_not_generate_caption_by_default(monkeypatch):
    db = _DB()
    vs = _VS()

    monkeypatch.setattr(m, "is_vector_search_enabled", lambda: True)
    monkeypatch.setattr(m, "is_vector_caption_on_index_enabled", lambda: False)

    async def _noop_autotags(_db, _vs, _asset_id, _image_vector):
        return None

    monkeypatch.setattr(m, "_apply_autotags", _noop_autotags)

    out = await m.index_asset_vector(
        db,
        vs,
        asset_id=321,
        filepath="C:/images/sample.png",
        kind="image",
        metadata_raw={"prompt": "cinematic robot portrait"},
    )

    assert out.ok and out.data is True
    assert vs.image_calls == 1
    assert vs.caption_calls == 0


@pytest.mark.asyncio
async def test_index_asset_vector_image_caption_generation_is_opt_in(monkeypatch):
    db = _DB()
    vs = _VS()

    monkeypatch.setattr(m, "is_vector_search_enabled", lambda: True)
    monkeypatch.setattr(m, "is_vector_caption_on_index_enabled", lambda: True)

    async def _noop_autotags(_db, _vs, _asset_id, _image_vector):
        return None

    monkeypatch.setattr(m, "_apply_autotags", _noop_autotags)

    out = await m.index_asset_vector(
        db,
        vs,
        asset_id=322,
        filepath="C:/images/sample.png",
        kind="image",
        metadata_raw={"prompt": "cinematic robot portrait"},
    )

    assert out.ok and out.data is True
    assert vs.image_calls == 1
    assert vs.caption_calls == 1
    assert any("UPDATE assets" in sql for sql, _params in db.calls)


class _AutotagVS:
    def __init__(self, model_name="model-a"):
        self._model_name = model_name
        self.text_calls = []

    async def get_text_embedding(self, prompt):
        self.text_calls.append(prompt)
        return Result.Ok([1.0, 0.0])


@pytest.mark.asyncio
async def test_autotag_embeddings_rebuild_when_vocabulary_changes(monkeypatch):
    vs = _AutotagVS()
    monkeypatch.setattr(m, "AUTOTAG_VOCABULARY", {"portrait": "prompt-a"})
    m.invalidate_autotag_cache()

    first = await m._get_autotag_embeddings(vs)
    assert set(first) == {"portrait"}
    assert len(vs.text_calls) == 1

    monkeypatch.setattr(m, "AUTOTAG_VOCABULARY", {"portrait": "prompt-a", "anime": "prompt-b"})
    second = await m._get_autotag_embeddings(vs)

    assert set(second) == {"portrait", "anime"}
    assert len(vs.text_calls) == 3
    m.invalidate_autotag_cache()


@pytest.mark.asyncio
async def test_autotag_embeddings_rebuild_when_model_changes(monkeypatch):
    monkeypatch.setattr(m, "AUTOTAG_VOCABULARY", {"portrait": "prompt-a"})
    m.invalidate_autotag_cache()

    vs_a = _AutotagVS("model-a")
    vs_b = _AutotagVS("model-b")

    await m._get_autotag_embeddings(vs_a)
    await m._get_autotag_embeddings(vs_b)

    assert len(vs_a.text_calls) == 1
    assert len(vs_b.text_calls) == 1
    m.invalidate_autotag_cache()
