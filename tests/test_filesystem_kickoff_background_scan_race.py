from __future__ import annotations

from typing import Any

import pytest

from backend.routes.handlers import filesystem


class _AliveThread:
    def is_alive(self) -> bool:
        return True


class _RaisingPending:
    def __init__(self) -> None:
        self._size = 0

    def __setitem__(self, key: str, value: Any) -> None:
        raise RuntimeError("boom")

    def move_to_end(self, key: str) -> None:
        raise AssertionError("should not be called if __setitem__ fails")

    def popitem(self, *, last: bool) -> tuple[str, Any]:
        raise AssertionError("not used in this test")

    def __len__(self) -> int:  # pragma: no cover
        return self._size


def test_kickoff_background_scan_does_not_update_throttle_marker_if_enqueue_fails(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    # Avoid starting a real background thread during this unit test.
    monkeypatch.setattr(filesystem, "_SCAN_WORKER", _AliveThread())

    # Force the enqueue path to fail deterministically.
    monkeypatch.setattr(filesystem, "_SCAN_PENDING", _RaisingPending())

    filesystem._BACKGROUND_SCAN_LAST.clear()

    filesystem._kickoff_background_scan(
        "C:/tmp",
        source="output",
        root_id=None,
        min_interval_seconds=9999.0,
    )

    key = "output||C:/tmp"
    assert key not in filesystem._BACKGROUND_SCAN_LAST

