from tests.repo_root import REPO_ROOT


def test_asset_metadata_write_is_guarded_by_asset_exists() -> None:
    p = REPO_ROOT / "mjr_am_backend" / "features" / "index" / "metadata_helpers.py"
    s = p.read_text(encoding="utf-8", errors="replace")
    assert "INSERT INTO asset_metadata" in s
    assert "WHERE EXISTS (SELECT 1 FROM assets WHERE id = ?)" in s


def test_metadata_cache_write_is_guarded_by_asset_filepath_exists() -> None:
    p = REPO_ROOT / "mjr_am_backend" / "features" / "index" / "metadata_helpers.py"
    s = p.read_text(encoding="utf-8", errors="replace")
    assert "INSERT INTO metadata_cache" in s
    assert "WHERE EXISTS (SELECT 1 FROM assets WHERE filepath = ?)" in s


def test_scan_journal_write_is_guarded_by_asset_filepath_exists() -> None:
    p = REPO_ROOT / "mjr_am_backend" / "features" / "index" / "scanner.py"
    s = p.read_text(encoding="utf-8", errors="replace")
    assert "INSERT OR REPLACE INTO scan_journal" in s
    assert "WHERE EXISTS (SELECT 1 FROM assets WHERE filepath = ?)" in s


def test_updater_asset_metadata_upserts_are_fk_guarded() -> None:
    p = REPO_ROOT / "mjr_am_backend" / "features" / "index" / "updater.py"
    s = p.read_text(encoding="utf-8", errors="replace")
    assert "INSERT INTO asset_metadata (asset_id, rating, tags)" in s
    assert "WHERE EXISTS (SELECT 1 FROM assets WHERE id = ?)" in s
    assert "WHERE EXISTS (SELECT 1 FROM assets WHERE id = excluded.asset_id)" in s


def test_metadata_helpers_upserts_apply_conflict_guard() -> None:
    p = REPO_ROOT / "mjr_am_backend" / "features" / "index" / "metadata_helpers.py"
    s = p.read_text(encoding="utf-8", errors="replace")
    assert "ON CONFLICT(asset_id) DO UPDATE SET" in s
    assert "WHERE EXISTS (SELECT 1 FROM assets WHERE id = excluded.asset_id)" in s
    assert "ON CONFLICT(filepath) DO UPDATE SET" in s
    assert "WHERE EXISTS (SELECT 1 FROM assets WHERE filepath = excluded.filepath)" in s


def test_scan_handler_bulk_metadata_upsert_is_fk_guarded() -> None:
    p = REPO_ROOT / "mjr_am_backend" / "routes" / "handlers" / "scan.py"
    s = p.read_text(encoding="utf-8", errors="replace")
    assert "INSERT INTO asset_metadata (asset_id, metadata_raw)" in s
    assert "WHERE EXISTS (SELECT 1 FROM assets WHERE id = ?)" in s
    assert "WHERE EXISTS (SELECT 1 FROM assets WHERE id = excluded.asset_id)" in s
