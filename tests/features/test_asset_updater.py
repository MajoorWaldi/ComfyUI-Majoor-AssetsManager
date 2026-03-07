import pytest

from mjr_am_backend.features.index.updater import AssetUpdater, MAX_TAG_LENGTH
from mjr_am_backend.shared import Result


def test_asset_updater_sanitize_tags_dedupes_case_insensitively() -> None:
    updater = AssetUpdater(db=object(), has_tags_text_column=False)
    long_tag = "x" * (MAX_TAG_LENGTH + 1)

    sanitized = updater._sanitize_tags([" Cat ", "cat", "", "DOG", "dog", 42, long_tag])  # type: ignore[list-item]

    assert sanitized == ["Cat", "DOG"]


class _Db:
    async def aquery(self, _sql, _params=()):
        return Result.Ok(
            [
                {"tags": '["Dog", "cat"]'},
                {"tags": '["dog", "Bird"]'},
                {"tags": '["CAT"]'},
            ]
        )


@pytest.mark.asyncio
async def test_asset_updater_get_all_tags_collapses_case_variants() -> None:
    updater = AssetUpdater(db=_Db(), has_tags_text_column=False)

    result = await updater.get_all_tags()

    assert result.ok
    assert result.data == ["Bird", "cat", "Dog"]
