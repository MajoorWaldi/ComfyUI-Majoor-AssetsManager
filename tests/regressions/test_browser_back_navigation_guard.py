from tests.repo_root import REPO_ROOT


def test_browser_scope_back_button_has_path_fallback() -> None:
    p = REPO_ROOT / "js" / "features" / "panel" / "controllers" / "browserNavigationController.js"
    s = p.read_text(encoding="utf-8", errors="replace")
    assert "const folderBrowsingActive = isCustom || !!rel;" in s
    assert "const canBackByPath = !!rel;" in s
    assert "await navigateFolder(parent, { pushHistory: false });" in s
