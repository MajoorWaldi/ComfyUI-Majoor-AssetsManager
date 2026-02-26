from __future__ import annotations

from pathlib import Path

import pytest

from mjr_am_backend import deps


@pytest.mark.asyncio
async def test_scan_flow_incremental_and_remove(tmp_path: Path, monkeypatch):
    db_path = tmp_path / "scan.sqlite"
    root = tmp_path / "scan_root"
    root.mkdir()
    file_one = root / "one.png"
    file_two = root / "two.png"
    file_one.write_bytes(b"x")
    file_two.write_bytes(b"y")

    monkeypatch.setattr(deps, "WATCHER_ENABLED", False)
    services_res = await deps.build_services(str(db_path))
    assert services_res.ok, services_res.error
    services = services_res.data
    assert isinstance(services, dict)

    index = services["index"]
    db = services["db"]
    sync_worker = services.get("rating_tags_sync")

    try:
        first = await index.scan_directory(
            directory=str(root),
            recursive=False,
            incremental=False,
            source="output",
            root_id=None,
        )
        assert first.ok, first.error

        searched = await index.search_scoped("*", roots=[str(root)], limit=50, offset=0, filters=None, include_total=True)
        assert searched.ok, searched.error
        before_assets = searched.data.get("assets") or []
        assert len(before_assets) >= 2

        # Remove one file physically then remove the indexed row using the exact stored filepath.
        file_two.unlink()
        two_rows = [a for a in before_assets if str(a.get("filename") or "") == "two.png"]
        assert two_rows
        rem = await index.remove_file(str(two_rows[0].get("filepath") or ""))
        assert rem.ok, rem.error

        second = await index.scan_directory(
            directory=str(root),
            recursive=False,
            incremental=True,
            source="output",
            root_id=None,
        )
        assert second.ok, second.error

        after = await index.search_scoped("*", roots=[str(root)], limit=50, offset=0, filters=None, include_total=True)
        assert after.ok, after.error
        after_assets = after.data.get("assets") or []
        after_names = {str(a.get("filename") or "") for a in after_assets}
        assert "one.png" in after_names
        assert "two.png" not in after_names
    finally:
        if sync_worker is not None:
            try:
                sync_worker.stop()
            except Exception:
                pass
        await db.aclose()
