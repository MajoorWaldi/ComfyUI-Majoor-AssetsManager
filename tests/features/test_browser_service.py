from pathlib import Path

from mjr_am_backend.features.browser import list_filesystem_browser_entries, list_visible_subfolders


def test_list_visible_subfolders_filters_dot_hidden(tmp_path: Path) -> None:
    root = tmp_path / "root"
    root.mkdir()
    (root / "visible_a").mkdir()
    (root / ".hidden_a").mkdir()

    res = list_visible_subfolders(root, "", "rid-1")
    assert res.ok
    items = res.data or []
    names = {str(i.get("filename")) for i in items}
    assert "visible_a" in names
    assert ".hidden_a" not in names
    assert all(str(i.get("kind")) == "folder" for i in items)


def test_list_visible_subfolders_rejects_traversal(tmp_path: Path) -> None:
    root = tmp_path / "root"
    root.mkdir()
    outside = tmp_path / "outside"
    outside.mkdir()

    res = list_visible_subfolders(root, "../outside", "rid-1")
    assert not res.ok
    assert res.code == "INVALID_INPUT"


def test_browser_entries_roots_mode_ok() -> None:
    res = list_filesystem_browser_entries("", "*", 100, 0)
    assert res.ok
    data = res.data or {}
    assert isinstance(data.get("assets"), list)


def test_browser_entries_deep_nested_directory(tmp_path: Path) -> None:
    deep_dir = tmp_path / "a" / "b" / "c" / "d"
    deep_dir.mkdir(parents=True)
    media = deep_dir / "image.png"
    media.write_bytes(b"\x89PNG\r\n\x1a\n")

    root_res = list_filesystem_browser_entries(str(tmp_path), "*", 200, 0)
    assert root_res.ok
    root_assets = (root_res.data.get("assets") or []) if isinstance(root_res.data, dict) else []
    assert any(str(item.get("filename")) == "a" and str(item.get("kind")) == "folder" for item in root_assets)

    level2_res = list_filesystem_browser_entries(str(tmp_path / "a" / "b"), "*", 200, 0)
    assert level2_res.ok
    level2_assets = (level2_res.data.get("assets") or []) if isinstance(level2_res.data, dict) else []
    assert any(str(item.get("filename")) == "c" and str(item.get("kind")) == "folder" for item in level2_assets)

    level4_res = list_filesystem_browser_entries(str(deep_dir), "*", 200, 0)
    assert level4_res.ok
    level4_assets = (level4_res.data.get("assets") or []) if isinstance(level4_res.data, dict) else []
    assert any(str(item.get("filename")) == "image.png" for item in level4_assets)


def test_browser_entries_size_filters_apply_in_browser_mode(tmp_path: Path) -> None:
    small = tmp_path / "small.png"
    big = tmp_path / "big.png"
    small.write_bytes(b"\x89PNG\r\n\x1a\n" + b"a" * 8)
    big.write_bytes(b"\x89PNG\r\n\x1a\n" + b"b" * 4096)

    res = list_filesystem_browser_entries(
        str(tmp_path),
        "*",
        200,
        0,
        min_size_bytes=1024,
    )
    assert res.ok
    assets = (res.data.get("assets") or []) if isinstance(res.data, dict) else []
    names = {str(item.get("filename")) for item in assets if str(item.get("kind")) != "folder"}
    assert "big.png" in names
    assert "small.png" not in names


def test_browser_entries_size_max_lt_min_is_normalized(tmp_path: Path) -> None:
    f = tmp_path / "x.png"
    f.write_bytes(b"\x89PNG\r\n\x1a\n" + b"x" * 2048)
    res = list_filesystem_browser_entries(
        str(tmp_path),
        "*",
        200,
        0,
        min_size_bytes=1024,
        max_size_bytes=10,
    )
    assert res.ok
