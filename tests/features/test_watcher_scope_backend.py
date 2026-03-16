import pytest

from mjr_am_backend.features.index import watcher_scope as watcher_scope_mod
from mjr_am_backend.routes.core import security as sec
from mjr_am_backend.shared import Result


class _DB:
    def __init__(self):
        self.store = {}

    async def aquery(self, sql, params=()):
        if "SELECT value FROM metadata WHERE key = ?" in sql:
            key = str((params or ("",))[0])
            if key in self.store:
                return Result.Ok([{"value": self.store[key]}])
            return Result.Ok([])
        return Result.Ok([])

    async def aexecute(self, sql, params=()):
        if "INSERT OR REPLACE INTO metadata" in sql:
            self.store[str(params[0])] = str(params[1])
        return Result.Ok("ok")


@pytest.mark.asyncio
async def test_load_watcher_scope_uses_user_scoped_store_with_legacy_fallback():
    db = _DB()
    db.store[watcher_scope_mod.WATCHER_SCOPE_KEY] = "custom"
    db.store[watcher_scope_mod.WATCHER_CUSTOM_ROOT_ID_KEY] = "legacy-root"

    token = sec._CURRENT_USER_ID.set("alice")
    try:
        scope = await watcher_scope_mod.load_watcher_scope(db)
        assert scope == {"scope": "custom", "custom_root_id": "legacy-root"}

        await watcher_scope_mod.persist_watcher_scope(db, "output", "ignored")
        scoped = await watcher_scope_mod.load_watcher_scope(db)
        assert scoped == {"scope": "output", "custom_root_id": ""}
    finally:
        sec._CURRENT_USER_ID.reset(token)

    alice_scope_key = watcher_scope_mod._storage_key(watcher_scope_mod.WATCHER_SCOPE_KEY, user_id="alice")
    alice_root_key = watcher_scope_mod._storage_key(watcher_scope_mod.WATCHER_CUSTOM_ROOT_ID_KEY, user_id="alice")
    assert db.store[watcher_scope_mod.WATCHER_SCOPE_KEY] == "custom"
    assert db.store[watcher_scope_mod.WATCHER_CUSTOM_ROOT_ID_KEY] == "legacy-root"
    assert db.store[alice_scope_key] == "output"
    assert db.store[alice_root_key] == ""

    token = sec._CURRENT_USER_ID.set("bob")
    try:
        assert await watcher_scope_mod.load_watcher_scope(db) == {
            "scope": "custom",
            "custom_root_id": "legacy-root",
        }
    finally:
        sec._CURRENT_USER_ID.reset(token)


def test_resolve_service_watcher_scope_prefers_current_user_scope():
    services = {
        "watcher_scope": {"scope": "output", "custom_root_id": ""},
        "watcher_scope_by_user": {
            "alice": {"scope": "custom", "custom_root_id": "root-a"},
        },
    }

    token = sec._CURRENT_USER_ID.set("alice")
    try:
        assert watcher_scope_mod.resolve_service_watcher_scope(services) == {
            "scope": "custom",
            "custom_root_id": "root-a",
        }
    finally:
        sec._CURRENT_USER_ID.reset(token)

    assert watcher_scope_mod.resolve_service_watcher_scope(services) == {
        "scope": "output",
        "custom_root_id": "",
    }
