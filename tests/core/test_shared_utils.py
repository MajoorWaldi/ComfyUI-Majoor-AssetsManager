"""
Tests for mjr_am_shared: time.py, result.py, errors.py (uncovered paths).
"""
from __future__ import annotations

import logging
from enum import Enum

import pytest

from mjr_am_shared import errors as errors_mod
from mjr_am_shared import log as log_mod
from mjr_am_shared import result as result_mod
from mjr_am_shared import time as time_mod


# ─── time.py ───────────────────────────────────────────────────────────────


def test_ms_returns_int():
    v = time_mod.ms()
    assert isinstance(v, int) and v > 0


def test_format_timestamp_with_explicit_ts():
    ts = 1_735_000_000.0
    s = time_mod.format_timestamp(ts)
    assert "T" in s and len(s) == 19


def test_format_timestamp_no_arg():
    s = time_mod.format_timestamp()
    assert "T" in s


def test_timer_with_logger(caplog):
    log = logging.getLogger("test_timer")
    with caplog.at_level(logging.DEBUG, logger="test_timer"):
        with time_mod.timer("op", log):
            pass
    assert any("op" in r.message for r in caplog.records)


def test_timer_without_logger(capsys):
    with time_mod.timer("myop"):
        pass
    captured = capsys.readouterr()
    assert "myop" in captured.out


# ─── result.py ─────────────────────────────────────────────────────────────


class _EC(Enum):
    NOT_FOUND = "NOT_FOUND"
    DB_ERROR = "DB_ERROR"


def test_result_err_with_enum_code():
    r = result_mod.Result.Err(_EC.NOT_FOUND, "file missing")
    assert not r.ok
    assert r.code == "NOT_FOUND"
    assert r.error == "file missing"


def test_result_err_enum_code_exception_path(monkeypatch):
    """Force the try/except path in Err() by using a non-Enum object that raises."""

    class _Bad:
        @property
        def value(self):
            raise RuntimeError("boom")

    r = result_mod.Result.Err(_Bad(), "fallback")
    assert not r.ok


def test_result_map_ok():
    r = result_mod.Result.Ok(5)
    mapped = r.map(lambda x: x * 2)
    assert mapped.ok
    assert mapped.data == 10


def test_result_map_no_data():
    r = result_mod.Result.Ok(None)
    mapped = r.map(lambda x: x)
    # ok=True but data is None → cast(Result, self)
    assert mapped is r


def test_result_unwrap_ok():
    assert result_mod.Result.Ok(42).unwrap() == 42


def test_result_unwrap_raises_on_error():
    with pytest.raises(ValueError):
        result_mod.Result.Err("E", "bad").unwrap()


def test_result_unwrap_or_default():
    assert result_mod.Result.Err("E", "bad").unwrap_or(99) == 99


def test_result_unwrap_or_ok():
    assert result_mod.Result.Ok(7).unwrap_or(99) == 7


def test_get_logger_does_not_duplicate_correlation_filter() -> None:
    logger = log_mod.get_logger("test_shared_utils_logger")
    logger = log_mod.get_logger("test_shared_utils_logger")
    filters = [f for f in list(logger.filters or []) if isinstance(f, log_mod.CorrelationFilter)]
    assert len(filters) == 1


def test_sanitize_error_message_does_not_mask_mime_type() -> None:
    msg = errors_mod.sanitize_error_message(ValueError("application/json parse failed"), "bad")
    assert "application/json" in msg
