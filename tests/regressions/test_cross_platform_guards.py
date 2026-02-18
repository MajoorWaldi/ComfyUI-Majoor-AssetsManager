from tests.repo_root import REPO_ROOT


def test_custom_roots_headless_guard_is_linux_only() -> None:
    p = REPO_ROOT / "mjr_am_backend" / "routes" / "handlers" / "custom_roots.py"
    s = p.read_text(encoding="utf-8", errors="replace")
    assert 'sys.platform.startswith("linux")' in s
    assert 'os.getenv("DISPLAY") is None' in s
    assert "os.name == 'posix'" not in s
