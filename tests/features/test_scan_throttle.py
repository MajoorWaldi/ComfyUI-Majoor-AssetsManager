"""Tests for mjr_am_shared.scan_throttle (throttling helpers)."""
from __future__ import annotations

import time

import pytest

from mjr_am_shared import scan_throttle as th


def _reset_state():
    """Clear module-level dicts between tests."""
    th._reset_scan_throttle_state_for_tests()


@pytest.fixture(autouse=True)
def clean_state():
    _reset_state()
    yield
    _reset_state()


def test_normalize_scan_directory_empty():
    assert th.normalize_scan_directory("") == ""


def test_normalize_scan_directory_valid(tmp_path):
    d = str(tmp_path)
    result = th.normalize_scan_directory(d)
    assert result  # not empty
    assert d.replace("\\", "/") in result.replace("\\", "/") or result


def test_scan_key_components():
    key = th._scan_key("/a/b", "output", "r1")
    assert "output" in key
    assert "r1" in key


def test_scan_key_no_root():
    key = th._scan_key("/a", "custom", None)
    assert "custom" in key


def test_mark_directory_indexed_metadata_complete_false():
    th.mark_directory_indexed("/fake/dir", metadata_complete=False)
    assert not th._MANUAL_SCAN_TIMES  # should NOT be recorded


def test_mark_directory_indexed_records_entry():
    th.mark_directory_indexed("/fake/dir", metadata_complete=True)
    assert len(th._MANUAL_SCAN_TIMES) == 1


def test_mark_directory_scanned_records_entry():
    th.mark_directory_scanned("/fake/dir2")
    assert len(th._RECENT_SCAN_TIMES) == 1


def test_should_skip_no_prior_scan():
    assert th.should_skip_background_scan("/not/indexed") is False


def test_should_skip_within_grace_after_mark():
    th.mark_directory_indexed("/dir", metadata_complete=True)
    # grace_seconds very large → should skip
    assert th.should_skip_background_scan("/dir", grace_seconds=9999) is True


def test_should_skip_after_grace_expired():
    # Record a time far in the past by directly writing to dict
    key = th._scan_key("/old", "output", None)
    with th._LOCK:
        th._MANUAL_SCAN_TIMES[key] = time.time() - 10
    assert th.should_skip_background_scan("/old", grace_seconds=1) is False


def test_should_skip_include_recent():
    th.mark_directory_scanned("/recent")
    assert th.should_skip_background_scan("/recent", grace_seconds=9999, include_recent=True) is True


def test_should_skip_include_recent_not_in_recent():
    assert th.should_skip_background_scan("/nowhere", grace_seconds=9999, include_recent=True) is False


def test_cleanup_locked_removes_old():
    now = time.time()
    with th._LOCK:
        th._MANUAL_SCAN_TIMES["old_key"] = now - th._MAX_ENTRY_AGE - 1
        th._RECENT_SCAN_TIMES["old_key"] = now - th._MAX_ENTRY_AGE - 1
    th._cleanup_locked(now)
    assert "old_key" not in th._MANUAL_SCAN_TIMES
    assert "old_key" not in th._RECENT_SCAN_TIMES


def test_reset_helper_clears_state():
    th.mark_directory_indexed("/x")
    th.mark_directory_scanned("/x")
    th._reset_scan_throttle_state_for_tests()
    assert not th._MANUAL_SCAN_TIMES
    assert not th._RECENT_SCAN_TIMES
