from __future__ import annotations

from pathlib import Path

import pytest

from mjr_am_backend import deps


@pytest.mark.asyncio
async def test_search_flow_index_then_search(tmp_path: Path, monkeypatch):
    db_path = tmp_path / "idx.sqlite"
    root = tmp_path / "assets"
    root.mkdir()
    file_a = root / "alpha_image.png"
    file_b = root / "beta_photo.png"
    file_a.write_bytes(b"not-a-real-png")
    file_b.write_bytes(b"not-a-real-png")

    monkeypatch.setattr(deps, "WATCHER_ENABLED", False)
    services_res = await deps.build_services(str(db_path))
    assert services_res.ok, services_res.error
    services = services_res.data
    assert isinstance(services, dict)

    index = services["index"]
    db = services["db"]
    sync_worker = services.get("rating_tags_sync")

    try:
        idx = await index.index_paths(
            paths=[file_a, file_b],
            base_dir=str(root),
            incremental=False,
            source="output",
            root_id=None,
        )
        assert idx.ok, idx.error

        out = await index.search("alpha", limit=20, offset=0, filters=None, include_total=True)
        assert out.ok, out.error
        assets = out.data.get("assets") or []
        assert any("alpha_image.png" in str(a.get("filename") or "") for a in assets)

        # Scoped path search should include only files under the indexed root.
        scoped = await index.search_scoped("*", roots=[str(root)], limit=50, offset=0, filters=None, include_total=True)
        assert scoped.ok, scoped.error
        scoped_assets = scoped.data.get("assets") or []
        names = {str(a.get("filename") or "") for a in scoped_assets}
        assert "alpha_image.png" in names
        assert "beta_photo.png" in names
    finally:
        if sync_worker is not None:
            try:
                sync_worker.stop()
            except Exception:
                pass
        await db.aclose()
