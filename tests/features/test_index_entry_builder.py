from pathlib import Path

from mjr_am_backend.features.index import entry_builder as eb
from mjr_am_backend.shared import Result


def test_safe_relative_path_returns_fallback_relpath_for_unrelated_paths() -> None:
    file_path = Path("C:/outside/asset.png")
    rel = eb.safe_relative_path(file_path, "C:/base")
    assert isinstance(rel, Path)
    assert str(rel).endswith("outside\\asset.png") or str(rel).endswith("outside/asset.png")


def test_build_fast_batch_entry_for_existing_asset_is_updated() -> None:
    entry = eb.build_fast_batch_entry(
        existing_id=42,
        file_path=Path("C:/root/a.png"),
        base_dir="C:/root",
        filepath="C:/root/a.png",
        mtime_ns=10,
        mtime=1,
        size=2,
        state_hash="s",
    )
    assert entry["action"] == "updated"
    assert entry["asset_id"] == 42
    assert entry["fast"] is True
    assert entry["mtime_ns"] == 10


def test_build_fast_batch_entry_for_new_asset_is_added() -> None:
    entry = eb.build_fast_batch_entry(
        existing_id=0,
        file_path=Path("C:/root/a.png"),
        base_dir="C:/root",
        filepath="C:/root/a.png",
        mtime_ns=10,
        mtime=1,
        size=2,
        state_hash="s",
    )
    assert entry["action"] == "added"
    assert entry["filename"] == "a.png"
    assert entry["kind"] == "image"
    assert entry["mtime_ns"] == 10


def test_asset_ids_from_existing_rows_skips_invalid_ids() -> None:
    ids = eb.asset_ids_from_existing_rows(
        ["a", "b", "c"],
        {"a": {"id": "12"}, "b": {"id": "x"}, "c": {}},
    )
    assert ids == [12]


def test_extract_context_helpers_validate_input_shapes() -> None:
    ok_res = Result.Ok({"a": 1})
    update_ctx = eb.extract_update_entry_context({"asset_id": "7", "metadata_result": ok_res, "file_path": Path("x")})
    add_ctx = eb.extract_add_entry_context({"metadata_result": ok_res, "kind": "image", "file_path": Path("x")})
    assert update_ctx is not None and update_ctx["asset_id"] == 7
    assert add_ctx is not None and add_ctx["kind"] == "image"
    assert eb.extract_update_entry_context({"asset_id": 1}) is None
    assert eb.extract_add_entry_context({"kind": "image"}) is None

