from tests.repo_root import REPO_ROOT


def test_duplicates_alerts_handles_reset_window_errors() -> None:
    p = REPO_ROOT / "mjr_am_backend" / "routes" / "handlers" / "duplicates.py"
    s = p.read_text(encoding="utf-8", errors="replace")
    assert "except Exception as exc:" in s
    assert '"DB_MAINTENANCE"' in s
    assert '"no active connection"' in s
