"""Extra tests for entry_builder.py — covering uncovered branches."""
from pathlib import Path

import pytest

from mjr_am_backend.features.index import entry_builder as eb
from mjr_am_backend.shared import Result


def test_build_cached_refresh_entry_returns_refresh_action() -> None:
    """Line 141 — build_cached_refresh_entry delegates to build_refresh_entry."""
    entry = eb.build_cached_refresh_entry(
        existing_id=7,
        cached_raw={"key": "val"},
        filepath="/tmp/a.png",
        file_path=Path("/tmp/a.png"),
        state_hash="abc",
        mtime=100,
        size=256,
        fast=False,
    )
    assert entry["action"] == "refresh"
    assert entry["asset_id"] == 7
    assert entry["cache_store"] is False
    assert entry["metadata_result"].ok


def test_build_added_entry_from_prepare_ctx_basic(tmp_path: Path) -> None:
    """Lines 204-208 — build_added_entry_from_prepare_ctx computes rel_path/kind."""
    file_path = tmp_path / "sub" / "img.png"
    prepare_ctx = {
        "filepath": str(file_path),
        "state_hash": "s1",
        "mtime": 200,
        "size": 512,
    }
    entry = eb.build_added_entry_from_prepare_ctx(
        prepare_ctx,
        file_path,
        str(tmp_path),
        Result.Ok({"metadata_raw": {}}),
        cache_store=True,
        fast=False,
    )
    assert entry["action"] == "added"
    assert entry["filename"] == "img.png"
    assert entry["kind"] == "image"
    assert entry["cache_store"] is True
    assert entry["subfolder"] == "sub"


def test_build_added_entry_from_prepare_ctx_no_subfolder(tmp_path: Path) -> None:
    """Lines 204-208 — subfolder is '' when file is directly under base_dir."""
    file_path = tmp_path / "root.png"
    prepare_ctx = {
        "filepath": str(file_path),
        "state_hash": "s2",
        "mtime": 100,
        "size": 64,
    }
    entry = eb.build_added_entry_from_prepare_ctx(
        prepare_ctx,
        file_path,
        str(tmp_path),
        Result.Ok({}),
        cache_store=False,
        fast=True,
    )
    assert entry["subfolder"] == ""


def test_extract_existing_asset_state_except_branch() -> None:
    """Lines 237-238 — int() conversion raises → returns (0, 0)."""
    result = eb.extract_existing_asset_state({"id": object(), "mtime": object()})
    assert result == (0, 0)


def test_asset_dimensions_from_metadata_false_result() -> None:
    """Line 246 — metadata_result.ok is False → returns (None, None, None)."""
    w, h, d = eb.asset_dimensions_from_metadata(Result.Err("META_FAIL", "no meta"))
    assert w is None and h is None and d is None


def test_asset_dimensions_from_metadata_no_data() -> None:
    """Line 246 — metadata_result.ok but data is empty falsy."""
    w, h, d = eb.asset_dimensions_from_metadata(Result.Ok({}))
    assert w is None and h is None and d is None


def test_added_asset_id_from_result_with_valid_id() -> None:
    """Lines 265-267 — Result has valid asset_id."""
    res = Result.Ok({"asset_id": "42"})
    assert eb.added_asset_id_from_result(res) == 42


def test_added_asset_id_from_result_without_id() -> None:
    """Line 270 — Result.data has no asset_id → returns None."""
    res = Result.Ok({"other_key": 1})
    assert eb.added_asset_id_from_result(res) is None


def test_added_asset_id_from_result_int_conversion_fails() -> None:
    """Lines 268-269 — int() conversion raises ValueError → caught → returns None."""
    res = Result.Ok({"asset_id": "not_a_number"})
    assert eb.added_asset_id_from_result(res) is None


def test_invalid_refresh_entry_stats_incremented_when_no_fallback() -> None:
    """Lines 331-332 — stats["skipped"] incremented when not fallback, invalid entry."""
    stats = {"skipped": 0}
    result = eb.invalid_refresh_entry(None, "not_result", stats, fallback_mode=False)
    assert result is True
    assert stats["skipped"] == 1


def test_handle_invalid_prepared_entry_errors_incremented_when_no_fallback() -> None:
    """Lines 342-343 — stats["errors"] incremented when not fallback."""
    stats = {"errors": 0}
    result = eb.handle_invalid_prepared_entry(stats, fallback_mode=False)
    assert result is True
    assert stats["errors"] == 1


def test_handle_update_or_add_failure_both_branches() -> None:
    """Lines 347-350 — both branches of handle_update_or_add_failure."""
    stats = {"errors": 0}
    # fallback_mode=True → returns False, does not increment errors
    assert eb.handle_update_or_add_failure(stats, fallback_mode=True) is False
    assert stats["errors"] == 0
    # fallback_mode=False → increments errors, returns True
    assert eb.handle_update_or_add_failure(stats, fallback_mode=False) is True
    assert stats["errors"] == 1
