"""
Tests for database corruption detection and recovery state tracking.

Covers the full event cycle:
  - is_malformed_error / is_locked_error classification
  - mark_malformed_event / mark_locked_event diagnostic recording
  - set_recovery_state counter increments (in_progress, success, failed)
  - is_auto_reset_throttled cooldown window
  - mark_auto_reset_attempt / record_auto_reset_result diag updates
"""

import sqlite3
import threading
from types import SimpleNamespace

from mjr_am_backend.adapters.db import db_recovery as dr
from mjr_am_backend.shared import Result

# ---------------------------------------------------------------------------
# Fixture: minimal sqlite_obj-like namespace
# ---------------------------------------------------------------------------

def _make_sqlite_obj():
    return SimpleNamespace(
        _diag_lock=threading.Lock(),
        _diag={},
        _auto_reset_lock=threading.Lock(),
        _auto_reset_last_ts=0.0,
        _auto_reset_cooldown_s=5.0,
    )


# ---------------------------------------------------------------------------
# Error classification
# ---------------------------------------------------------------------------

class TestIsMalformedError:
    def test_recognises_disk_image_malformed(self):
        exc = sqlite3.DatabaseError("database disk image is malformed")
        assert dr.is_malformed_error(exc) is True

    def test_recognises_file_is_not_a_database(self):
        exc = sqlite3.DatabaseError("file is not a database")
        assert dr.is_malformed_error(exc) is True

    def test_recognises_malformed_database_schema(self):
        exc = Exception("malformed database schema at offset 0")
        assert dr.is_malformed_error(exc) is True

    def test_rejects_unrelated_error(self):
        exc = ValueError("no such table: assets")
        assert dr.is_malformed_error(exc) is False

    def test_handles_non_string_exception_gracefully(self):
        exc = Exception()
        exc.args = ()
        # Should not raise even if str(exc) is unusual
        result = dr.is_malformed_error(exc)
        assert isinstance(result, bool)


class TestIsLockedError:
    def test_recognises_database_is_locked(self):
        exc = sqlite3.OperationalError("database is locked")
        assert dr.is_locked_error(exc) is True

    def test_recognises_table_is_locked(self):
        exc = Exception("database table is locked")
        assert dr.is_locked_error(exc) is True

    def test_recognises_sqlite_busy_string(self):
        exc = Exception("SQLITE_BUSY: database is busy")
        assert dr.is_locked_error(exc) is True

    def test_rejects_unrelated_error(self):
        exc = RuntimeError("connection refused")
        assert dr.is_locked_error(exc) is False


# ---------------------------------------------------------------------------
# Diagnostic event recording
# ---------------------------------------------------------------------------

class TestMarkMalformedEvent:
    def test_sets_malformed_flag_and_records_error(self):
        obj = _make_sqlite_obj()
        exc = sqlite3.DatabaseError("database disk image is malformed")

        dr.mark_malformed_event(obj, exc)

        assert obj._diag["malformed"] is True
        assert "last_malformed_at" in obj._diag
        assert "malformed" in obj._diag["last_malformed_error"]

    def test_overwrites_previous_entry_on_repeated_call(self):
        obj = _make_sqlite_obj()
        dr.mark_malformed_event(obj, Exception("first"))
        dr.mark_malformed_event(obj, Exception("second"))

        assert "second" in obj._diag["last_malformed_error"]


class TestMarkLockedEvent:
    def test_sets_locked_flag_and_records_error(self):
        obj = _make_sqlite_obj()
        exc = sqlite3.OperationalError("database is locked")

        dr.mark_locked_event(obj, exc)

        assert obj._diag["locked"] is True
        assert "last_locked_at" in obj._diag
        assert "locked" in obj._diag["last_locked_error"]


# ---------------------------------------------------------------------------
# Recovery state machine
# ---------------------------------------------------------------------------

class TestSetRecoveryState:
    def test_in_progress_increments_attempts(self):
        obj = _make_sqlite_obj()
        dr.set_recovery_state(obj, "in_progress")
        dr.set_recovery_state(obj, "in_progress")

        assert obj._diag["recovery_attempts"] == 2
        assert obj._diag["recovery_state"] == "in_progress"

    def test_success_increments_successes_not_failures(self):
        obj = _make_sqlite_obj()
        dr.set_recovery_state(obj, "in_progress")
        dr.set_recovery_state(obj, "success")

        assert obj._diag.get("recovery_successes") == 1
        assert obj._diag.get("recovery_failures", 0) == 0

    def test_failed_increments_failures(self):
        obj = _make_sqlite_obj()
        dr.set_recovery_state(obj, "failed", error="VACUUM failed")

        assert obj._diag.get("recovery_failures") == 1
        assert obj._diag["last_recovery_error"] == "VACUUM failed"

    def test_skipped_locked_increments_failures(self):
        obj = _make_sqlite_obj()
        dr.set_recovery_state(obj, "skipped_locked")

        assert obj._diag.get("recovery_failures") == 1

    def test_unknown_state_sets_without_incrementing_counters(self):
        obj = _make_sqlite_obj()
        dr.set_recovery_state(obj, "idle")

        assert obj._diag["recovery_state"] == "idle"
        assert obj._diag.get("recovery_attempts", 0) == 0

    def test_records_timestamp(self):
        obj = _make_sqlite_obj()
        dr.set_recovery_state(obj, "success")

        assert isinstance(obj._diag.get("last_recovery_at"), float)
        assert obj._diag["last_recovery_at"] > 0


# ---------------------------------------------------------------------------
# Auto-reset throttle
# ---------------------------------------------------------------------------

class TestIsAutoResetThrottled:
    def test_first_call_is_not_throttled(self):
        obj = _make_sqlite_obj()
        assert dr.is_auto_reset_throttled(obj, now=100.0) is False

    def test_second_call_within_cooldown_is_throttled(self):
        obj = _make_sqlite_obj()
        dr.is_auto_reset_throttled(obj, now=100.0)  # stamps last_ts = 100
        assert dr.is_auto_reset_throttled(obj, now=103.0) is True  # 3s < 5s cooldown

    def test_call_after_cooldown_is_not_throttled(self):
        obj = _make_sqlite_obj()
        dr.is_auto_reset_throttled(obj, now=100.0)
        assert dr.is_auto_reset_throttled(obj, now=110.0) is False  # 10s > 5s cooldown

    def test_custom_cooldown_is_respected(self):
        obj = _make_sqlite_obj()
        obj._auto_reset_cooldown_s = 30.0
        dr.is_auto_reset_throttled(obj, now=0.0)
        assert dr.is_auto_reset_throttled(obj, now=20.0) is True
        assert dr.is_auto_reset_throttled(obj, now=35.0) is False


# ---------------------------------------------------------------------------
# Auto-reset attempt / result recording
# ---------------------------------------------------------------------------

class TestMarkAutoResetAttempt:
    def test_increments_attempt_counter(self):
        obj = _make_sqlite_obj()
        dr.mark_auto_reset_attempt(obj, now=50.0)
        dr.mark_auto_reset_attempt(obj, now=55.0)

        assert obj._diag["auto_reset_attempts"] == 2
        assert obj._diag["last_auto_reset_at"] == 55.0


class TestRecordAutoResetResult:
    def test_success_increments_success_counter(self):
        obj = _make_sqlite_obj()
        ok_result = Result.Ok({})

        dr.record_auto_reset_result(obj, ok_result)

        assert obj._diag.get("auto_reset_successes") == 1
        assert obj._diag.get("auto_reset_failures", 0) == 0

    def test_failure_increments_failure_counter_and_stores_error(self):
        obj = _make_sqlite_obj()
        err_result = Result.Err("DB_ERROR", "VACUUM failed on corrupt file")

        dr.record_auto_reset_result(obj, err_result)

        assert obj._diag.get("auto_reset_failures") == 1
        assert "VACUUM failed" in str(obj._diag.get("last_auto_reset_error", ""))

    def test_none_result_treated_as_failure(self):
        obj = _make_sqlite_obj()
        dr.record_auto_reset_result(obj, None)

        assert obj._diag.get("auto_reset_failures") == 1
