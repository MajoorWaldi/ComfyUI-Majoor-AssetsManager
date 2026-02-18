from tests.repo_root import REPO_ROOT


def test_folder_context_open_does_not_double_reload() -> None:
    p = REPO_ROOT / "js" / "features" / "contextmenu" / "GridContextMenu.js"
    s = p.read_text(encoding="utf-8", errors="replace")
    assert 'new CustomEvent("mjr:custom-subfolder-changed"' in s
    assert 'new CustomEvent("mjr:reload-grid", { bubbles: true })' not in s
