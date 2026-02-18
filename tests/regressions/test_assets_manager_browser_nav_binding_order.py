from tests.repo_root import REPO_ROOT


def test_assets_manager_declares_unbind_before_first_use() -> None:
    p = REPO_ROOT / "js" / "features" / "panel" / "AssetsManagerPanel.js"
    s = p.read_text(encoding="utf-8", errors="replace")

    decl = s.find("let _unbindBrowserFolderNav = null;")
    use = s.find("_unbindBrowserFolderNav = browserNav.bindGridFolderNavigation();")

    assert decl != -1
    assert use != -1
    assert decl < use
