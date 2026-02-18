from tests.repo_root import REPO_ROOT


def test_custom_roots_add_button_is_wired() -> None:
    p = REPO_ROOT / "js" / "features" / "panel" / "controllers" / "customRootsController.js"
    s = p.read_text(encoding="utf-8", errors="replace")
    assert "customAddBtn.disabled = false;" in s
    assert "ENDPOINTS.BROWSE_FOLDER" in s
    assert "await post(ENDPOINTS.CUSTOM_ROOTS" in s
