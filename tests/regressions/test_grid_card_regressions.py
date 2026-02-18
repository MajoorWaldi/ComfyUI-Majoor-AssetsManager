from pathlib import Path

from tests.repo_root import REPO_ROOT


def _grid_view_source() -> str:
    p = REPO_ROOT / "js" / "features" / "grid" / "GridView.js"
    return p.read_text(encoding="utf-8", errors="replace")


def test_remove_assets_does_not_rewind_offset_cursor() -> None:
    s = _grid_view_source()
    assert "state.offset = Math.max(0, Number(state.offset) - removedCount)" not in s


def test_name_desc_uses_explicit_descending_comparator() -> None:
    s = _grid_view_source()
    assert "function compareAssets(a, b, sortKey)" in s
    assert 'if (sortKey === "name_desc")' in s
    assert "const sorted = list.slice().sort((a, b) => compareAssets(a, b, sortKey));" in s
    assert "state.assets.sort((a, b) => compareAssets(a, b, sortKey));" in s


def test_on_item_updated_rebuilds_card_and_rehydrates() -> None:
    s = _grid_view_source()
    assert "const replacement = String(asset?.kind || \"\").toLowerCase() === \"folder\"" in s
    assert "oldCard.parentElement?.replaceChild?.(replacement, oldCard);" in s
    assert "enqueueRatingTagsHydration(gridContainer, card, asset);" in s

