import pytest
from tests.repo_root import REPO_ROOT


@pytest.mark.asyncio
async def test_viewer_info_cache_is_bounded_and_ttl_based() -> None:
    viewer_js = REPO_ROOT / "js" / "components" / "Viewer.js"
    s = viewer_js.read_text(encoding="utf-8", errors="replace")

    assert "VIEWER_INFO_CACHE_TTL_MS" in s
    assert "VIEWER_INFO_CACHE_MAX" in s
    assert "_viewerInfoCachePrune" in s
    assert "_viewerInfoCacheGet" in s
    assert "_viewerInfoCacheSet" in s


@pytest.mark.asyncio
async def test_viewer_side_by_side_dual_geninfo_is_exactly_two_assets() -> None:
    viewer_js = REPO_ROOT / "js" / "components" / "Viewer.js"
    s = viewer_js.read_text(encoding="utf-8", errors="replace")

    assert "const canSide = state.assets.length === 2;" in s


@pytest.mark.asyncio
async def test_viewer_prev_next_labels_are_ascii_safe() -> None:
    viewer_js = REPO_ROOT / "js" / "components" / "Viewer.js"
    s = viewer_js.read_text(encoding="utf-8", errors="replace")

    assert 'createIconButton("<", "Previous (Left Arrow)")' in s
    assert 'createIconButton(">", "Next (Right Arrow)")' in s
    assert "â€¹" not in s
    assert "â€º" not in s


@pytest.mark.asyncio
async def test_viewer_hotkey_scope_restores_previous_scope() -> None:
    viewer_js = REPO_ROOT / "js" / "components" / "Viewer.js"
    s = viewer_js.read_text(encoding="utf-8", errors="replace")

    assert "state._prevHotkeyScope = window._mjrHotkeysState.scope || null;" in s
    assert "window._mjrHotkeysState.scope = prevScope || \"panel\";" in s
