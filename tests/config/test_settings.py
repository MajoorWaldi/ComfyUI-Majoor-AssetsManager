import pytest
from mjr_am_backend.adapters.db.sqlite import Sqlite
from mjr_am_backend.settings import AppSettings


async def _init_settings_db(db: Sqlite) -> None:
    await db.aexecutescript(
        """
        CREATE TABLE metadata (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        """
    )


@pytest.mark.asyncio
async def test_settings_cache_version_invalidation(tmp_path):
    db = Sqlite(str(tmp_path / "test.db"))
    await _init_settings_db(db)

    a = AppSettings(db)
    b = AppSettings(db)

    # Make the test deterministic: always re-check version.
    a._cache_ttl_s = 999.0
    a._version_cache_ttl_s = 0.0

    before = await a.get_probe_backend()
    assert before in ("auto", "exiftool", "ffprobe", "both")

    res = await b.set_probe_backend("ffprobe")
    assert res.ok

    after = await a.get_probe_backend()
    assert after == "ffprobe"

    await db.aclose()


@pytest.mark.asyncio
async def test_output_directory_persist_and_read(tmp_path):
    db = Sqlite(str(tmp_path / "test_output_dir.db"))
    await _init_settings_db(db)
    settings = AppSettings(db)

    custom = str((tmp_path / "CustomOutputDir").resolve())
    res = await settings.set_output_directory(custom)
    assert res.ok
    assert res.data == custom

    got = await settings.get_output_directory()
    assert got == custom

    cleared = await settings.set_output_directory("")
    assert cleared.ok
    assert cleared.data == ""
    got_after = await settings.get_output_directory()
    assert got_after is None
    await db.aclose()


