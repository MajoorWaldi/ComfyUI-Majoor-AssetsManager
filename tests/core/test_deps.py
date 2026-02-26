import pytest

from mjr_am_backend import deps as deps_mod
from mjr_am_backend.shared import Result


def test_resolve_db_path_default_and_custom(monkeypatch):
    monkeypatch.setattr(deps_mod, "INDEX_DB", "C:/default.sqlite")
    assert deps_mod._resolve_db_path(None) == "C:/default.sqlite"
    assert deps_mod._resolve_db_path("C:/x.sqlite") == "C:/x.sqlite"


def test_init_db_or_error_failure(monkeypatch):
    class _BadSqlite:
        def __init__(self, *_args, **_kwargs):
            raise RuntimeError("boom")

    monkeypatch.setattr(deps_mod, "Sqlite", _BadSqlite)
    out = deps_mod._init_db_or_error("C:/db.sqlite")
    assert out.ok is False
    assert out.code == "DB_ERROR"


def test_build_services_dict_contains_core_keys(monkeypatch):
    class _Dup:
        def __init__(self, db):
            self.db = db

    monkeypatch.setattr(deps_mod, "DuplicatesService", _Dup)

    out = deps_mod._build_services_dict(
        db="db",
        exiftool="exif",
        ffprobe="ff",
        metadata_service="meta",
        health_service="health",
        index_service="index",
        settings_service="settings",
    )

    assert out["db"] == "db"
    assert out["duplicates"].db == "db"


@pytest.mark.asyncio
async def test_migrate_db_or_error_failure(monkeypatch):
    async def _migrate(_db):
        return Result.Err("DB_ERROR", "migrate failed")

    monkeypatch.setattr(deps_mod, "migrate_schema", _migrate)
    out = await deps_mod._migrate_db_or_error(object())
    assert out.ok is False


@pytest.mark.asyncio
async def test_build_services_migration_failure(monkeypatch):
    class _Sqlite:
        def __init__(self, *_args, **_kwargs):
            pass

    async def _migrate(_db):
        return Result.Err("DB_ERROR", "no")

    monkeypatch.setattr(deps_mod, "Sqlite", _Sqlite)
    monkeypatch.setattr(deps_mod, "migrate_schema", _migrate)

    out = await deps_mod.build_services("C:/db.sqlite")
    assert out.ok is False
    assert out.code == "DB_ERROR"


@pytest.mark.asyncio
async def test_build_services_success_without_watcher(monkeypatch):
    class _Sqlite:
        def __init__(self, *_args, **_kwargs):
            self.db = "ok"

    class _Exif:
        def __init__(self, *_args, **_kwargs):
            pass

        def is_available(self):
            return True

    class _Ff:
        def __init__(self, *_args, **_kwargs):
            pass

        def is_available(self):
            return True

    class _Settings:
        def __init__(self, _db):
            pass

        async def ensure_security_bootstrap(self):
            return None

    class _Metadata:
        def __init__(self, **_kwargs):
            pass

    class _Health:
        def __init__(self, **_kwargs):
            pass

    class _Index:
        def __init__(self, **kwargs):
            self.db = kwargs.get("db")

    class _Dup:
        def __init__(self, _db):
            pass

    class _Sync:
        def __init__(self, _exif):
            pass

    async def _migrate(_db):
        return Result.Ok(True)

    async def _has_column(_db, _table, _column):
        return True

    async def _load_scope(_db):
        return {"scope": "output", "custom_root_id": ""}

    monkeypatch.setattr(deps_mod, "WATCHER_ENABLED", False)
    monkeypatch.setattr(deps_mod, "Sqlite", _Sqlite)
    monkeypatch.setattr(deps_mod, "ExifTool", _Exif)
    monkeypatch.setattr(deps_mod, "FFProbe", _Ff)
    monkeypatch.setattr(deps_mod, "AppSettings", _Settings)
    monkeypatch.setattr(deps_mod, "MetadataService", _Metadata)
    monkeypatch.setattr(deps_mod, "HealthService", _Health)
    monkeypatch.setattr(deps_mod, "IndexService", _Index)
    monkeypatch.setattr(deps_mod, "DuplicatesService", _Dup)
    monkeypatch.setattr(deps_mod, "RatingTagsSyncWorker", _Sync)
    monkeypatch.setattr(deps_mod, "migrate_schema", _migrate)
    monkeypatch.setattr(deps_mod, "table_has_column", _has_column)
    monkeypatch.setattr(deps_mod, "load_watcher_scope", _load_scope)

    out = await deps_mod.build_services("C:/db.sqlite")
    assert out.ok is True
    data = out.data
    assert "index" in data
    assert data.get("watcher") is None


@pytest.mark.asyncio
async def test_create_watcher_starts_and_callbacks(monkeypatch):
    calls = {"index": 0, "remove": 0, "rename": 0}

    class _Idx:
        db = object()

        async def index_paths(self, *args, **kwargs):
            _ = (args, kwargs)
            calls["index"] += 1
            return Result.Ok({})

        async def remove_file(self, *_args, **_kwargs):
            calls["remove"] += 1
            return Result.Ok({})

        async def rename_file(self, *_args, **_kwargs):
            calls["rename"] += 1
            return Result.Ok({})

    class _Watcher:
        def __init__(self, index_callback, remove_callback=None, move_callback=None):
            self._index_callback = index_callback
            self._remove_callback = remove_callback
            self._move_callback = move_callback
            self.started = False

        async def start(self, _paths, _loop):
            self.started = True
            await self._index_callback(["C:/x.png"], "C:/", "watcher", None)
            if self._remove_callback:
                await self._remove_callback(["C:/x.png"], "C:/", "watcher", None)
            if self._move_callback:
                await self._move_callback([("C:/x.png", "C:/y.png")], "C:/", "watcher", None)

    async def _load_scope(_db):
        return {"scope": "output", "custom_root_id": ""}

    monkeypatch.setattr(deps_mod, "OutputWatcher", _Watcher)
    monkeypatch.setattr(deps_mod, "load_watcher_scope", _load_scope)
    monkeypatch.setattr(deps_mod, "build_watch_paths", lambda *_args, **_kwargs: [{"path": "C:/"}])

    watcher = await deps_mod._create_watcher(_Idx())
    assert watcher.started is True
    assert calls["index"] >= 1
    assert calls["remove"] >= 1
