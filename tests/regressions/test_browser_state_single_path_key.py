from tests.repo_root import REPO_ROOT


def test_browser_runtime_state_uses_single_folder_key() -> None:
    runtime_files = [
        REPO_ROOT / "js" / "features" / "panel" / "AssetsManagerPanel.js",
        REPO_ROOT / "js" / "features" / "panel" / "controllers" / "gridController.js",
        REPO_ROOT / "js" / "features" / "panel" / "controllers" / "scopeController.js",
        REPO_ROOT / "js" / "features" / "panel" / "controllers" / "contextController.js",
        REPO_ROOT / "js" / "features" / "panel" / "controllers" / "customRootsController.js",
        REPO_ROOT / "js" / "features" / "panel" / "controllers" / "browserNavigationController.js",
    ]
    for p in runtime_files:
        s = p.read_text(encoding="utf-8", errors="replace")
        assert "state.subfolder" not in s, f"legacy subfolder usage leaked in {p}"

    # Migration fallback is allowed only in persisted state loader.
    panel_state = (REPO_ROOT / "js" / "features" / "panel" / "state" / "panelState.js").read_text(
        encoding="utf-8", errors="replace"
    )
    assert "saved.subfolder" in panel_state
