import pytest
from pathlib import Path
from tests.repo_root import REPO_ROOT


def _read_backend_file(*parts: str) -> str:
    """
    Read backend file content from migrated path first, then legacy shim path.
    """
    migrated = REPO_ROOT / "mjr_am_backend" / "routes" / "handlers" / Path(*parts)
    legacy = REPO_ROOT / "backend" / "routes" / "handlers" / Path(*parts)
    target = migrated if migrated.exists() else legacy
    return target.read_text(encoding="utf-8", errors="replace")


@pytest.mark.asyncio
async def test_entry_runtime_cleanup_present() -> None:
    entry_js = REPO_ROOT / "js" / "entry.js"
    s = entry_js.read_text(encoding="utf-8", errors="replace")

    assert "ENTRY_RUNTIME_KEY" in s
    assert "AbortController" in s


@pytest.mark.asyncio
async def test_gridview_hydration_queue_is_per_grid() -> None:
    grid_js = REPO_ROOT / "js" / "features" / "grid" / "GridView.js"
    s = grid_js.read_text(encoding="utf-8", errors="replace")

    assert "RT_HYDRATE_STATE" in s
    assert "new WeakMap" in s
    assert "enqueueRatingTagsHydration(gridContainer" in s


@pytest.mark.asyncio
async def test_search_endpoints_rate_limited() -> None:
    s = _read_backend_file("search.py")

    assert "_check_rate_limit" in s
    assert '"list_assets"' in s or "list_assets" in s
    assert '"search_assets"' in s or "search_assets" in s
    assert "RATE_LIMITED" in s


@pytest.mark.asyncio
async def test_assets_tags_error_does_not_leak_exception() -> None:
    s = _read_backend_file("assets.py")

    assert 'Failed to update tags: {exc}' not in s
    assert "_safe_error_message" in s


@pytest.mark.asyncio
async def test_output_directory_cache_has_ttl() -> None:
    cfg_js = REPO_ROOT / "js" / "app" / "config.js"
    s = cfg_js.read_text(encoding="utf-8", errors="replace")

    assert "OUTPUT_DIR_CACHE_TTL_MS" in s
    assert "outputDirectoryAt" in s


@pytest.mark.asyncio
async def test_output_scope_uses_runtime_output_root_in_key_handlers() -> None:
    files = [
        REPO_ROOT / "mjr_am_backend" / "routes" / "core" / "paths.py",
        REPO_ROOT / "mjr_am_backend" / "routes" / "handlers" / "metadata.py",
        REPO_ROOT / "mjr_am_backend" / "routes" / "handlers" / "assets.py",
        REPO_ROOT / "mjr_am_backend" / "routes" / "handlers" / "calendar.py",
        REPO_ROOT / "mjr_am_backend" / "routes" / "handlers" / "duplicates.py",
        REPO_ROOT / "mjr_am_backend" / "features" / "index" / "watcher_scope.py",
    ]
    joined = "\n".join(p.read_text(encoding="utf-8", errors="replace") for p in files)
    assert "get_runtime_output_root" in joined


@pytest.mark.asyncio
async def test_client_retry_does_not_retry_all_typeerrors() -> None:
    client_js = REPO_ROOT / "js" / "api" / "client.js"
    s = client_js.read_text(encoding="utf-8", errors="replace")

    assert 'if (name === "TypeError") return true;' not in s


@pytest.mark.asyncio
async def test_popovers_do_not_use_max_int_zindex() -> None:
    rating_js = REPO_ROOT / "js" / "components" / "RatingEditor.js"
    tags_js = REPO_ROOT / "js" / "components" / "TagsEditor.js"
    s1 = rating_js.read_text(encoding="utf-8", errors="replace")
    s2 = tags_js.read_text(encoding="utf-8", errors="replace")

    assert "2147483647" not in s1
    assert "2147483647" not in s2
    assert "MENU_Z_INDEX" in s1
    assert "MENU_Z_INDEX" in s2


@pytest.mark.asyncio
async def test_filesystem_pagination_no_full_filtered_slice() -> None:
    s = _read_backend_file("filesystem.py")

    assert "filtered_entries[offset" not in s


@pytest.mark.asyncio
async def test_scan_stage_batches_file_ops() -> None:
    s = _read_backend_file("scan.py")

    assert "_MAX_RENAME_ATTEMPTS" in s
    assert "_link_or_copy_many" in s
