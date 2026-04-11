"""
Direct unit tests for mjr_am_backend.routes.db_maintenance.backfill_jobs.

These tests exercise every public function in the module in isolation,
resetting module-level state between tests via monkeypatching so test
order is irrelevant.
"""

from __future__ import annotations

import asyncio
import time
from typing import Any

import mjr_am_backend.routes.db_maintenance.backfill_jobs as bj
import pytest

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _reset(monkeypatch: pytest.MonkeyPatch) -> None:
    """Reset all module-level mutable state to a known-clean baseline."""
    monkeypatch.setattr(bj, "_VECTOR_BACKFILL_JOBS", {})
    monkeypatch.setattr(bj, "_VECTOR_BACKFILL_ACTIVE_JOB_ID", None)
    monkeypatch.setattr(bj, "_VECTOR_BACKFILL_PRIORITY_UNTIL_MONO", 0.0)
    monkeypatch.setattr(bj, "_VECTOR_BACKFILL_PRIORITY_REASON", "")


# ---------------------------------------------------------------------------
# Pure utility functions
# ---------------------------------------------------------------------------

class TestUtcNowIso:
    def test_returns_non_empty_string(self):
        result = bj.utc_now_iso()
        assert isinstance(result, str) and result

    def test_contains_timezone_offset(self):
        # ISO 8601 UTC timestamps end with +00:00
        assert bj.utc_now_iso().endswith("+00:00")


class TestParseBoolFlag:
    @pytest.mark.parametrize("value,expected", [
        (True, True),
        (False, False),
        ("true", True),
        ("yes", True),
        ("1", True),
        ("on", True),
        ("enabled", True),
        ("false", False),
        ("no", False),
        ("0", False),
        ("off", False),
        ("disabled", False),
        (None, False),
        ("", False),
        ("garbage", False),
    ])
    def test_known_values(self, value, expected):
        assert bj.parse_bool_flag(value) is expected

    def test_default_true(self):
        assert bj.parse_bool_flag(None, default=True) is True

    def test_exception_returns_default(self):
        # Pass an object whose str() raises — use a custom __str__ that raises.
        class Bad:
            def __str__(self):
                raise RuntimeError("boom")
        assert bj.parse_bool_flag(Bad(), default=True) is True


class TestNormalizeScope:
    @pytest.mark.parametrize("raw,expected", [
        ("output", "output"),
        ("outputs", "output"),
        ("input", "input"),
        ("inputs", "input"),
        ("custom", "custom"),
        ("all", "all"),
        ("OUTPUT", "output"),
        ("  output  ", "output"),
        ("unknown", ""),
        ("", "output"),   # empty → default "output"
        (None, "output"), # None → default "output"
    ])
    def test_scope_normalization(self, raw, expected):
        assert bj.normalize_scope(raw) == expected


# ---------------------------------------------------------------------------
# Job serialization
# ---------------------------------------------------------------------------

class TestJobPublic:
    def _make_job(self, **overrides: Any) -> dict[str, Any]:
        base: dict[str, Any] = {
            "backfill_id": "abc123",
            "status": "queued",
            "batch_size": 64,
            "scope": "output",
            "custom_root_id": None,
            "created_at": "2025-01-01T00:00:00+00:00",
            "updated_at": "2025-01-01T00:00:01+00:00",
            "started_at": "",
            "finished_at": "",
            "progress": {"candidates": 0, "indexed": 0},
            "result": None,
            "code": None,
            "error": None,
        }
        base.update(overrides)
        return base

    def test_full_serialization_keys(self):
        job = self._make_job()
        pub = bj.job_public(job)
        for key in ("backfill_id", "status", "async", "batch_size", "scope",
                     "created_at", "updated_at", "started_at", "finished_at",
                     "progress", "result", "code", "error"):
            assert key in pub, f"Missing key: {key}"

    def test_async_always_true(self):
        assert bj.job_public(self._make_job())["async"] is True

    def test_non_dict_returns_idle_stub(self):
        result = bj.job_public(None)
        assert result["status"] == "idle"
        assert result["backfill_id"] == ""

    def test_non_dict_progress_becomes_none(self):
        job = self._make_job(progress="bad")
        assert bj.job_public(job)["progress"] is None

    def test_non_dict_result_becomes_none(self):
        job = self._make_job(result=42)
        assert bj.job_public(job)["result"] is None


# ---------------------------------------------------------------------------
# Job registry reads (require clean state)
# ---------------------------------------------------------------------------

class TestJobRegistryReads:
    def test_get_job_missing_returns_none(self, monkeypatch):
        _reset(monkeypatch)
        assert bj.get_job("nonexistent") is None

    def test_get_active_or_latest_empty_returns_none(self, monkeypatch):
        _reset(monkeypatch)
        assert bj.get_active_or_latest_job() is None

    def test_is_active_empty_returns_false(self, monkeypatch):
        _reset(monkeypatch)
        assert bj.is_active() is False


# ---------------------------------------------------------------------------
# Job lifecycle writes
# ---------------------------------------------------------------------------

class TestRegisterJob:
    def test_returns_queued_job(self, monkeypatch):
        _reset(monkeypatch)
        job = bj.register_job(batch_size=32, scope="output")
        assert job["status"] == "queued"
        assert job["batch_size"] == 32
        assert job["scope"] == "output"
        assert isinstance(job["backfill_id"], str) and job["backfill_id"]

    def test_job_stored_and_active(self, monkeypatch):
        _reset(monkeypatch)
        job = bj.register_job(batch_size=10)
        bid = job["backfill_id"]
        assert bj.get_job(bid) is job
        assert bj.is_active() is True

    def test_batch_size_clamped(self, monkeypatch):
        _reset(monkeypatch)
        job = bj.register_job(batch_size=9999)
        assert job["batch_size"] == 200  # max

        _reset(monkeypatch)
        job2 = bj.register_job(batch_size=0)
        assert job2["batch_size"] == 1  # min

    def test_custom_scope_stores_root(self, monkeypatch):
        _reset(monkeypatch)
        job = bj.register_job(batch_size=10, scope="custom", custom_root_id="root-x")
        assert job["scope"] == "custom"
        assert job["custom_root_id"] == "root-x"

    def test_non_custom_scope_clears_root(self, monkeypatch):
        _reset(monkeypatch)
        job = bj.register_job(batch_size=10, scope="output", custom_root_id="should-be-cleared")
        assert job["custom_root_id"] == ""


class TestUpdateJob:
    def test_update_sets_fields(self, monkeypatch):
        _reset(monkeypatch)
        job = bj.register_job(batch_size=10)
        bid = job["backfill_id"]
        bj.update_job(bid, status="running", progress={"candidates": 100})
        updated = bj.get_job(bid)
        assert updated["status"] == "running"
        assert updated["progress"]["candidates"] == 100

    def test_update_unknown_id_is_noop(self, monkeypatch):
        _reset(monkeypatch)
        # Should not raise
        bj.update_job("ghost-id", status="running")


class TestCompleteJob:
    def test_marks_succeeded(self, monkeypatch):
        _reset(monkeypatch)
        job = bj.register_job(batch_size=10)
        bid = job["backfill_id"]
        bj.complete_job(bid, scope="output", custom_root_id="", payload={"count": 5})
        done = bj.get_job(bid)
        assert done["status"] == "succeeded"
        assert done["finished_at"] != ""
        assert done["result"]["count"] == 5
        assert done["code"] is None
        assert done["error"] is None


class TestFailJob:
    def test_marks_failed(self, monkeypatch):
        _reset(monkeypatch)
        job = bj.register_job(batch_size=10)
        bid = job["backfill_id"]
        bj.fail_job(bid, "Something exploded", code="DB_ERROR")
        failed = bj.get_job(bid)
        assert failed["status"] == "failed"
        assert failed["error"] == "Something exploded"
        assert failed["code"] == "DB_ERROR"
        assert failed["finished_at"] != ""


# ---------------------------------------------------------------------------
# is_active after terminal states
# ---------------------------------------------------------------------------

class TestIsActive:
    def test_is_active_false_after_success(self, monkeypatch):
        _reset(monkeypatch)
        job = bj.register_job(batch_size=10)
        bid = job["backfill_id"]
        assert bj.is_active() is True
        bj.complete_job(bid, scope="output", custom_root_id="", payload={})
        # Active pointer still set but status is terminal → should return False
        assert bj.is_active() is False

    def test_is_active_false_after_fail(self, monkeypatch):
        _reset(monkeypatch)
        job = bj.register_job(batch_size=10)
        bid = job["backfill_id"]
        bj.fail_job(bid, "boom")
        assert bj.is_active() is False


# ---------------------------------------------------------------------------
# get_active_or_latest_job
# ---------------------------------------------------------------------------

class TestGetActiveOrLatestJob:
    def test_returns_active_when_running(self, monkeypatch):
        _reset(monkeypatch)
        job = bj.register_job(batch_size=10)
        result = bj.get_active_or_latest_job()
        assert result is job

    def test_returns_latest_by_created_at_when_no_active(self, monkeypatch):
        _reset(monkeypatch)
        j1 = bj.register_job(batch_size=10)
        bj.complete_job(j1["backfill_id"], scope="output", custom_root_id="", payload={})
        bj.clear_active_job_id(j1["backfill_id"])

        j2 = bj.register_job(batch_size=20)
        bj.complete_job(j2["backfill_id"], scope="output", custom_root_id="", payload={})
        bj.clear_active_job_id(j2["backfill_id"])

        latest = bj.get_active_or_latest_job()
        # Should be j2 — registered after j1
        assert latest["backfill_id"] == j2["backfill_id"]


# ---------------------------------------------------------------------------
# prune_history
# ---------------------------------------------------------------------------

class TestPruneHistory:
    def test_does_not_prune_below_limit(self, monkeypatch):
        _reset(monkeypatch)
        for _ in range(5):
            bj.register_job(batch_size=10)
        bj.prune_history()
        assert len(bj._VECTOR_BACKFILL_JOBS) == 5

    def test_prunes_excess_jobs(self, monkeypatch):
        _reset(monkeypatch)
        limit = bj._VECTOR_BACKFILL_HISTORY_LIMIT
        # Register limit + 5 jobs
        for _ in range(limit + 5):
            j = bj.register_job(batch_size=10)
            bj.complete_job(j["backfill_id"], scope="output", custom_root_id="", payload={})
        bj.prune_history()
        assert len(bj._VECTOR_BACKFILL_JOBS) <= limit


# ---------------------------------------------------------------------------
# Priority window
# ---------------------------------------------------------------------------

class TestPriorityWindow:
    def test_request_returns_positive_seconds(self, monkeypatch):
        _reset(monkeypatch)
        remaining = bj.request_priority_window(5.0, reason="test")
        assert remaining > 0

    def test_clear_resets_to_zero(self, monkeypatch):
        _reset(monkeypatch)
        bj.request_priority_window(30.0)
        bj.clear_priority_window()
        assert bj.priority_remaining_seconds() == 0.0

    def test_remaining_decreases_over_time(self, monkeypatch):
        _reset(monkeypatch)
        bj.request_priority_window(60.0)
        r1 = bj.priority_remaining_seconds()
        time.sleep(0.02)
        r2 = bj.priority_remaining_seconds()
        assert r2 <= r1

    def test_max_window_capped(self, monkeypatch):
        _reset(monkeypatch)
        cap = bj._VECTOR_BACKFILL_PRIORITY_MAX_WINDOW_S
        remaining = bj.request_priority_window(cap * 10)
        assert remaining <= cap + 0.5  # small tolerance for execution time

    @pytest.mark.asyncio
    async def test_wait_for_priority_window_returns_immediately_when_clear(self, monkeypatch):
        _reset(monkeypatch)
        # No window set → should return immediately
        await asyncio.wait_for(bj.wait_for_priority_window(), timeout=1.0)

    @pytest.mark.asyncio
    async def test_wait_for_priority_window_exits_after_clear(self, monkeypatch):
        _reset(monkeypatch)
        bj.request_priority_window(60.0)

        async def _clear_after(delay: float) -> None:
            await asyncio.sleep(delay)
            bj.clear_priority_window()

        await asyncio.gather(
            asyncio.wait_for(bj.wait_for_priority_window(), timeout=3.0),
            _clear_after(0.1),
        )


# ---------------------------------------------------------------------------
# clear_active_job_id
# ---------------------------------------------------------------------------

class TestClearActiveJobId:
    def test_clears_when_matches(self, monkeypatch):
        _reset(monkeypatch)
        job = bj.register_job(batch_size=10)
        bid = job["backfill_id"]
        bj.clear_active_job_id(bid)
        assert bj._VECTOR_BACKFILL_ACTIVE_JOB_ID is None

    def test_noop_when_different_id(self, monkeypatch):
        _reset(monkeypatch)
        job = bj.register_job(batch_size=10)
        bj.clear_active_job_id("wrong-id")
        assert bj._VECTOR_BACKFILL_ACTIVE_JOB_ID == job["backfill_id"]
