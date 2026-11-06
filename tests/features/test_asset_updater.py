import pytest
from mjr_am_backend.features.index import updater as updater_module
from mjr_am_backend.features.index.updater import MAX_TAG_LENGTH, AssetUpdater
from mjr_am_backend.shared import Result


def test_asset_updater_sanitize_tags_dedupes_case_insensitively() -> None:
    updater = AssetUpdater(db=object(), has_tags_text_column=False)  # type: ignore[arg-type]
    long_tag = "x" * (MAX_TAG_LENGTH + 1)

    sanitized = updater._sanitize_tags([" Cat ", "cat", "", "DOG", "dog", 42, long_tag])  # type: ignore[list-item]

    assert sanitized == ["Cat", "DOG"]


class _Db:
    async def aquery(self, _sql, _params=()):
        return Result.Ok(
            [
                {"name": "Bird"},
                {"name": "cat"},
                {"name": "Dog"},
            ]
        )


@pytest.mark.asyncio
async def test_asset_updater_get_all_tags_reads_normalized_table_order() -> None:
    updater = AssetUpdater(db=_Db(), has_tags_text_column=False)  # type: ignore[arg-type]

    result = await updater.get_all_tags()

    assert result.ok
    assert result.data == ["Bird", "cat", "Dog"]


class _FakeLock:
    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False


class _MergeDb:
    """Minimal DB fake driving merge_asset_tags: existence check, tag read, writes."""

    def __init__(self, *, exists=True, current_tags=None):
        self.exists = exists
        self.current_tags = list(current_tags or [])
        self.execs = []

    def lock_for_asset(self, _asset_id):
        return _FakeLock()

    async def aquery(self, sql, _params=()):
        if "SELECT id FROM assets WHERE id" in sql:
            return Result.Ok([{"id": 7}] if self.exists else [])
        if "asset_tags at JOIN tags t" in sql:
            return Result.Ok([{"name": tag} for tag in self.current_tags])
        return Result.Ok([])

    async def aexecute(self, sql, params=()):
        self.execs.append((sql, params))
        return Result.Ok(1)


class _RecordingTagsRepo:
    instances: list["_RecordingTagsRepo"] = []

    def __init__(self, db):
        self.db = db
        self.calls = []
        _RecordingTagsRepo.instances.append(self)

    async def replace_all(self, asset_id, names):
        self.calls.append((asset_id, list(names or [])))
        return Result.Ok([])


@pytest.fixture()
def _stub_tag_writes(monkeypatch):
    _RecordingTagsRepo.instances = []
    monkeypatch.setattr(updater_module, "TagsRepository", _RecordingTagsRepo)
    synced = []
    monkeypatch.setattr(
        updater_module, "sync_user_metadata_by_asset_id", _make_sync_stub(synced)
    )
    return synced


def _make_sync_stub(synced):
    async def _sync(db, asset_id, **_kwargs):
        synced.append(asset_id)

    return _sync


@pytest.mark.asyncio
async def test_merge_asset_tags_adds_to_existing_tags(_stub_tag_writes) -> None:
    db = _MergeDb(current_tags=["a"])
    updater = AssetUpdater(db=db, has_tags_text_column=False)  # type: ignore[arg-type]

    result = await updater.merge_asset_tags(7, ["b"], [])

    assert result.ok
    assert result.data == {"asset_id": 7, "changed": True, "tags": ["a", "b"]}
    assert _RecordingTagsRepo.instances[-1].calls == [(7, ["a", "b"])]
    assert _stub_tag_writes == [7]


@pytest.mark.asyncio
async def test_merge_asset_tags_removes_from_existing_tags(_stub_tag_writes) -> None:
    db = _MergeDb(current_tags=["a", "b"])
    updater = AssetUpdater(db=db, has_tags_text_column=False)  # type: ignore[arg-type]

    result = await updater.merge_asset_tags(7, [], ["b"])

    assert result.ok
    assert result.data == {"asset_id": 7, "changed": True, "tags": ["a"]}
    assert _RecordingTagsRepo.instances[-1].calls == [(7, ["a"])]


@pytest.mark.asyncio
async def test_merge_asset_tags_add_and_remove_together(_stub_tag_writes) -> None:
    db = _MergeDb(current_tags=["a", "b"])
    updater = AssetUpdater(db=db, has_tags_text_column=False)  # type: ignore[arg-type]

    result = await updater.merge_asset_tags(7, ["c"], ["a"])

    assert result.ok
    assert result.data == {"asset_id": 7, "changed": True, "tags": ["b", "c"]}


@pytest.mark.asyncio
async def test_merge_asset_tags_case_insensitive_no_write(_stub_tag_writes) -> None:
    db = _MergeDb(current_tags=["Cat"])
    updater = AssetUpdater(db=db, has_tags_text_column=False)  # type: ignore[arg-type]

    result = await updater.merge_asset_tags(7, ["cat"], [])

    assert result.ok
    assert result.data == {"asset_id": 7, "changed": False, "tags": ["Cat"]}
    assert all(repo.calls == [] for repo in _RecordingTagsRepo.instances)
    assert _stub_tag_writes == []


@pytest.mark.asyncio
async def test_merge_asset_tags_remove_missing_tag_is_unchanged(_stub_tag_writes) -> None:
    db = _MergeDb(current_tags=["a"])
    updater = AssetUpdater(db=db, has_tags_text_column=False)  # type: ignore[arg-type]

    result = await updater.merge_asset_tags(7, [], ["z"])

    assert result.ok
    assert result.data == {"asset_id": 7, "changed": False, "tags": ["a"]}
    assert all(repo.calls == [] for repo in _RecordingTagsRepo.instances)


@pytest.mark.asyncio
async def test_merge_asset_tags_rejects_more_than_fifty_tags(_stub_tag_writes) -> None:
    db = _MergeDb(current_tags=[f"tag-{i}" for i in range(50)])
    updater = AssetUpdater(db=db, has_tags_text_column=False)  # type: ignore[arg-type]

    result = await updater.merge_asset_tags(7, ["new"], [])

    assert not result.ok
    assert result.code == "INVALID_INPUT"
    assert result.error == "Too many tags (max 50)"
    assert all(repo.calls == [] for repo in _RecordingTagsRepo.instances)
    assert db.execs == []


@pytest.mark.asyncio
async def test_merge_asset_tags_can_shrink_legacy_asset_over_cap(_stub_tag_writes) -> None:
    legacy_tags = [f"tag-{i}" for i in range(55)]
    db = _MergeDb(current_tags=legacy_tags)
    updater = AssetUpdater(db=db, has_tags_text_column=False)  # type: ignore[arg-type]

    result = await updater.merge_asset_tags(7, [], ["tag-0"])

    assert result.ok
    assert result.data == {
        "asset_id": 7,
        "changed": True,
        "tags": legacy_tags[1:],
    }
    assert _RecordingTagsRepo.instances[-1].calls == [(7, legacy_tags[1:])]


@pytest.mark.asyncio
async def test_merge_asset_tags_rejects_swap_on_legacy_asset_over_cap(_stub_tag_writes) -> None:
    legacy_tags = [f"tag-{i}" for i in range(55)]
    db = _MergeDb(current_tags=legacy_tags)
    updater = AssetUpdater(db=db, has_tags_text_column=False)  # type: ignore[arg-type]

    result = await updater.merge_asset_tags(7, ["x"], ["tag-0"])

    assert not result.ok
    assert result.code == "INVALID_INPUT"
    assert result.error == "Too many tags (max 50)"
    assert all(repo.calls == [] for repo in _RecordingTagsRepo.instances)
    assert db.execs == []


@pytest.mark.asyncio
async def test_merge_asset_tags_remove_wins_over_add_on_empty(_stub_tag_writes) -> None:
    db = _MergeDb(current_tags=[])
    updater = AssetUpdater(db=db, has_tags_text_column=False)  # type: ignore[arg-type]

    result = await updater.merge_asset_tags(7, ["b"], ["b"])

    assert result.ok
    assert result.data == {"asset_id": 7, "changed": False, "tags": []}
    assert all(repo.calls == [] for repo in _RecordingTagsRepo.instances)


@pytest.mark.asyncio
async def test_merge_asset_tags_remove_wins_over_existing_and_add(_stub_tag_writes) -> None:
    db = _MergeDb(current_tags=["b"])
    updater = AssetUpdater(db=db, has_tags_text_column=False)  # type: ignore[arg-type]

    result = await updater.merge_asset_tags(7, ["b"], ["b"])

    assert result.ok
    assert result.data == {"asset_id": 7, "changed": True, "tags": []}
    assert _RecordingTagsRepo.instances[-1].calls == [(7, [])]


@pytest.mark.asyncio
async def test_merge_asset_tags_missing_asset(_stub_tag_writes) -> None:
    db = _MergeDb(exists=False)
    updater = AssetUpdater(db=db, has_tags_text_column=False)  # type: ignore[arg-type]

    result = await updater.merge_asset_tags(7, ["b"], [])

    assert not result.ok
    assert result.code == "NOT_FOUND"
