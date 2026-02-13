import os
import pytest

from mjr_am_backend.adapters.db.sqlite import Sqlite
from mjr_am_backend.routes.handlers.db_maintenance import _cleanup_assets_case_duplicates


async def _init_assets_only(db: Sqlite) -> None:
    await db.aexecutescript(
        """
        CREATE TABLE metadata (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        CREATE TABLE assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            subfolder TEXT DEFAULT '',
            filepath TEXT NOT NULL UNIQUE,
            source TEXT DEFAULT 'output',
            root_id TEXT,
            kind TEXT NOT NULL,
            ext TEXT NOT NULL,
            size INTEGER NOT NULL,
            mtime INTEGER NOT NULL
        );
        """
    )


@pytest.mark.asyncio
@pytest.mark.skipif(os.name != "nt", reason="Case duplicate cleanup applies on Windows only")
async def test_cleanup_assets_case_duplicates_keeps_latest(tmp_path):
    db = Sqlite(str(tmp_path / "case_cleanup.db"))
    await _init_assets_only(db)

    await db.aexecute(
        "INSERT INTO assets(filename, subfolder, filepath, source, root_id, kind, ext, size, mtime) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        ("Image.PNG", "", r"F:\Output\Image.PNG", "output", None, "image", ".png", 100, 10),
    )
    await db.aexecute(
        "INSERT INTO assets(filename, subfolder, filepath, source, root_id, kind, ext, size, mtime) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        ("image.png", "", r"f:\output\image.png", "output", None, "image", ".png", 100, 20),
    )

    res = await _cleanup_assets_case_duplicates(db)
    assert res.ok
    assert (res.data or {}).get("deleted") == 1

    q = await db.aquery("SELECT filepath, mtime FROM assets ORDER BY id")
    assert q.ok
    assert len(q.data or []) == 1
    assert int((q.data or [])[0]["mtime"]) == 20
    await db.aclose()
