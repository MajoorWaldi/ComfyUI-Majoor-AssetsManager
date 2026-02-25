from tests.repo_root import REPO_ROOT


def test_areset_does_not_call_sync_init_from_async_flow() -> None:
    p = REPO_ROOT / "mjr_am_backend" / "adapters" / "db" / "sqlite_facade.py"
    s = p.read_text(encoding="utf-8", errors="replace")
    marker = "async def areset(self) -> Result[bool]:"
    i = s.find(marker)
    assert i >= 0
    body = s[i : i + 3500]
    assert "await self._ensure_initialized_async(" in body
    assert "self._init_db()" not in body


def test_areset_unlocks_after_reinit_success() -> None:
    p = REPO_ROOT / "mjr_am_backend" / "adapters" / "db" / "sqlite_facade.py"
    s = p.read_text(encoding="utf-8", errors="replace")
    marker = "async def areset(self) -> Result[bool]:"
    i = s.find(marker)
    assert i >= 0
    body = s[i : i + 4500]
    assert "self._resetting = True" in body
    assert "Release reset guard before schema helpers" in body
    assert "self._resetting = False" in body
