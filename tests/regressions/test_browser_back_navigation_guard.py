from tests.repo_root import REPO_ROOT


def test_browser_scope_back_button_has_path_fallback() -> None:
    p = REPO_ROOT / "js" / "features" / "panel" / "controllers" / "browserNavigationController.js"
    s = p.read_text(encoding="utf-8", errors="replace")
    assert "const canBackByPath = !!rel;" in s
    assert "const folderBrowsingActive = isCustom || !!rel;" in s
    assert "const pushUniqueHistory = (stack, value) => {" in s
    assert "const popDistinctHistory = (stack, current) => {" in s
    assert "if (cur) {" in s
    assert "if (parent === cur) {" in s
    assert "await navigateFolder(parent, { pushHistory: false });" in s
    assert "upBtn.disabled = !rel || parentFolderPath(currentFolderPath()) === currentFolderPath();" in s
