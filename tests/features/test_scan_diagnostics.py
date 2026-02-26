"""Tests for scan_diagnostics.py — covers all 4 functions."""
from mjr_am_backend.features.index import scan_diagnostics as sd
from mjr_am_backend.features.index import scan_batch_utils as sbu


def test_batch_error_messages_returns_str_pair() -> None:
    """Lines 10-14 — batch_error_messages returns (msg, lower)."""
    msg, lower = sd.batch_error_messages(ValueError("TEST Error"))
    assert msg == "TEST Error"
    assert lower == "test error"


def test_batch_error_messages_with_none() -> None:
    """Lines 10-14 — batch_error_messages with None-like error."""
    msg, lower = sd.batch_error_messages(Exception(""))
    assert msg == ""
    assert lower == ""


def test_is_unique_filepath_error_true() -> None:
    """Line 18 — detects UNIQUE constraint violation on assets.filepath."""
    assert sd.is_unique_filepath_error("unique constraint failed: assets.filepath")
    assert not sd.is_unique_filepath_error("unique constraint failed: other.field")
    assert not sd.is_unique_filepath_error("some other error")


def test_diagnose_unique_filepath_error_with_duplicate() -> None:
    """Lines 22-24 — when batch has duplicate filepath."""
    prepared = [
        {"filepath": "a.png"},
        {"filepath": "a.png"},
    ]
    result = sd.diagnose_unique_filepath_error(prepared)
    assert result is not None
    fp, reason = result
    assert fp == "a.png"
    assert "duplicate" in reason.lower()


def test_diagnose_unique_filepath_error_no_duplicate_but_has_fp() -> None:
    """Lines 25-27 — no duplicate, but has filepath (DB conflict)."""
    prepared = [{"filepath": "b.png"}]
    result = sd.diagnose_unique_filepath_error(prepared)
    assert result is not None
    fp, reason = result
    assert fp == "b.png"
    assert "filepath" in reason.lower()


def test_diagnose_unique_filepath_error_empty() -> None:
    """Line 28 — no prepared entries → fp is None."""
    result = sd.diagnose_unique_filepath_error([])
    assert result is not None
    fp, reason = result
    assert fp is None
    assert "UNIQUE" in reason


def test_diagnose_batch_failure_unique_constraint() -> None:
    """Lines 32-38 — detects unique constraint and delegates to diagnose_unique_filepath_error."""

    class _Scanner:
        pass

    prepared = [{"filepath": "c.png"}, {"filepath": "c.png"}]
    exc = Exception("unique constraint failed: assets.filepath")
    fp, reason = sd.diagnose_batch_failure(_Scanner(), prepared, exc)
    assert fp == "c.png"
    assert "duplicate" in reason.lower()


def test_diagnose_batch_failure_generic_error() -> None:
    """Lines 32-38 — non-unique error → returns filepath + error message."""

    class _Scanner:
        pass

    prepared = [{"filepath": "d.png"}]
    exc = ValueError("some other error")
    fp, reason = sd.diagnose_batch_failure(_Scanner(), prepared, exc)
    assert fp == "d.png"
    assert "some other error" in reason
