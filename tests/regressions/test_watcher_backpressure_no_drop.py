from tests.repo_root import REPO_ROOT


def test_watcher_backpressure_defers_instead_of_skipping() -> None:
    p = REPO_ROOT / "mjr_am_backend" / "features" / "index" / "watcher.py"
    s = p.read_text(encoding="utf-8", errors="replace")
    assert "deferring %s" in s
    assert "deferring %d for next flush" in s
    assert "self._overflow[f] = now" in s
    assert "self._schedule_flush()" in s
