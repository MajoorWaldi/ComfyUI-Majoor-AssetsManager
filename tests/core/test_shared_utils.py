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
from mjr_am_shared import version as version_mod

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


def test_result_constructor_rejects_ok_with_error():
    with pytest.raises(ValueError, match="cannot have an error"):
        result_mod.Result(ok=True, data=1, error="bad")


def test_result_constructor_rejects_err_with_data():
    with pytest.raises(ValueError, match="should not carry data"):
        result_mod.Result(ok=False, data=1, error="bad", code="E")


def test_result_constructor_rejects_err_without_error_message():
    with pytest.raises(ValueError, match="requires an error message"):
        result_mod.Result(ok=False, code="E")


def test_get_logger_does_not_duplicate_correlation_filter() -> None:
    logger = log_mod.get_logger("test_shared_utils_logger")
    logger = log_mod.get_logger("test_shared_utils_logger")
    filters = [f for f in list(logger.filters or []) if isinstance(f, log_mod.CorrelationFilter)]
    assert len(filters) == 1


def test_get_logger_short_circuits_filter_scan_for_configured_name(monkeypatch) -> None:
    original = log_mod._has_correlation_filter
    calls = {"count": 0}

    def _counting(logger):
        calls["count"] += 1
        return original(logger)

    monkeypatch.setattr(log_mod, "_has_correlation_filter", _counting)
    log_mod._configured_loggers.clear()

    log_mod.get_logger("test_shared_utils_logger_once")
    log_mod.get_logger("test_shared_utils_logger_once")

    assert calls["count"] == 1


def test_sanitize_error_message_does_not_mask_mime_type() -> None:
    msg = errors_mod.sanitize_error_message(ValueError("application/json parse failed"), "bad")
    assert "application/json" in msg


def test_sanitize_error_message_does_not_mask_url_fragment_path() -> None:
    msg = errors_mod.sanitize_error_message(ValueError("navigate to #/settings/general"), "bad")
    assert "#/settings/general" in msg


def test_version_reads_pyproject_version(monkeypatch, tmp_path) -> None:
    (tmp_path / "pyproject.toml").write_text('[project]\nversion = "9.8.7"\n', encoding="utf-8")
    monkeypatch.setattr(version_mod, "_repo_root", lambda: tmp_path)

    assert version_mod._find_pyproject_version() == "9.8.7"


def test_version_missing_pyproject_falls_back(monkeypatch, tmp_path) -> None:
    monkeypatch.setattr(version_mod, "_repo_root", lambda: tmp_path)

    assert version_mod._find_pyproject_version() == "0.0.0"


def test_version_branch_env_precedence(monkeypatch) -> None:
    monkeypatch.setenv("MAJOOR_ASSETS_MANAGER_CHANNEL", "experimental-build")
    monkeypatch.setattr(version_mod, "_resolve_branch_from_channel_marker", lambda: "main")
    monkeypatch.setattr(version_mod, "_resolve_branch_from_git", lambda: "main")

    assert version_mod._resolve_branch("1.2.3") == "nightly"


def test_version_channel_marker_normalizes_stable(monkeypatch, tmp_path) -> None:
    (tmp_path / ".mjr_channel").write_text("release", encoding="utf-8")
    monkeypatch.setattr(version_mod, "_repo_root", lambda: tmp_path)

    assert version_mod._resolve_branch_from_channel_marker() == "main"


def test_version_branch_uses_git_when_no_env_or_marker(monkeypatch) -> None:
    monkeypatch.delenv("MAJOR_ASSETS_MANAGER_BRANCH", raising=False)
    monkeypatch.delenv("MAJOOR_ASSETS_MANAGER_BRANCH", raising=False)
    monkeypatch.delenv("MAJOOR_ASSETS_MANAGER_CHANNEL", raising=False)
    monkeypatch.delenv("MAJOR_ASSETS_MANAGER_CHANNEL", raising=False)
    monkeypatch.setattr(version_mod, "_resolve_branch_from_channel_marker", lambda: "")
    monkeypatch.setattr(version_mod, "_resolve_branch_from_git", lambda: "feature/dev-preview")
    monkeypatch.setattr(version_mod, "_resolve_branch_from_path", lambda: "")

    assert version_mod._resolve_branch("1.2.3") == "nightly"


def test_version_info_reports_nightly_for_non_release_tag(monkeypatch) -> None:
    monkeypatch.setattr(version_mod, "_find_pyproject_version", lambda: "1.2.3")
    monkeypatch.setattr(version_mod, "_resolve_branch", lambda version: "main")

    def fake_git(*args: str) -> str:
        if args == ("describe", "--tags", "--exact-match"):
            return "v9.9.9"
        return ""

    monkeypatch.setattr(version_mod, "_run_git", fake_git)

    assert version_mod.get_version_info() == {"version": "nightly", "branch": "nightly"}


def test_version_info_reports_stable_for_matching_release_tag(monkeypatch) -> None:
    monkeypatch.setattr(version_mod, "_find_pyproject_version", lambda: "1.2.3")
    monkeypatch.setattr(version_mod, "_resolve_branch", lambda version: "main")

    def fake_git(*args: str) -> str:
        if args == ("describe", "--tags", "--exact-match"):
            return "v1.2.3"
        return ""

    monkeypatch.setattr(version_mod, "_run_git", fake_git)

    assert version_mod.get_version_info() == {"version": "1.2.3", "branch": "main"}
