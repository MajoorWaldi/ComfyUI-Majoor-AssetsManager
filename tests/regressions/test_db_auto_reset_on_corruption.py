from tests.repo_root import REPO_ROOT


def test_db_auto_reset_defaults_enabled_with_disable_switch() -> None:
    p = REPO_ROOT / "mjr_am_backend" / "adapters" / "db" / "sqlite.py"
    s = p.read_text(encoding="utf-8", errors="replace")
    assert 'os.getenv("MAJOOR_DB_AUTO_RESET", "true")' in s
    assert "Auto-reset disabled (MAJOOR_DB_AUTO_RESET=false)" in s


def test_db_auto_reset_has_cooldown_and_diagnostics() -> None:
    p = REPO_ROOT / "mjr_am_backend" / "adapters" / "db" / "sqlite.py"
    s = p.read_text(encoding="utf-8", errors="replace")
    assert "_auto_reset_lock" in s
    assert "_auto_reset_cooldown_s" in s
    assert '"auto_reset_attempts"' in s
    assert '"auto_reset_successes"' in s
    assert '"auto_reset_failures"' in s
