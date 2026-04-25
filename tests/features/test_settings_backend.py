import os
import sys
from pathlib import Path

import pytest
from mjr_am_backend.routes.core import security as sec
from mjr_am_backend.settings import (
    _AI_VERBOSE_LOGS_KEY,
    _METADATA_FALLBACK_IMAGE_KEY,
    _METADATA_FALLBACK_MEDIA_KEY,
    _OUTPUT_DIRECTORY_KEY,
    _PROBE_BACKEND_KEY,
    _SECURITY_API_TOKEN_HASH_KEY,
    _SECURITY_API_TOKEN_KEY,
    _SETTINGS_VERSION_KEY,
    _VECTOR_CAPTION_ON_INDEX_KEY,
    AppSettings,
)
from mjr_am_backend.shared import Result


class _DB:
    def __init__(self):
        self.store = {}
        self.fail_write = False
        self.fail_delete = False

    async def aquery(self, sql, params=()):
        if "SELECT value FROM metadata" in sql:
            key = params[0]
            if key in self.store:
                return Result.Ok([{"value": self.store[key]}])
            return Result.Ok([])
        return Result.Ok([])

    async def aexecute(self, sql, params=()):
        if "INSERT OR REPLACE INTO metadata" in sql:
            if self.fail_write:
                return Result.Err("DB", "write-failed")
            self.store[str(params[0])] = str(params[1])
            return Result.Ok("ok")
        if "DELETE FROM metadata" in sql:
            if self.fail_delete:
                return Result.Err("DB", "delete-failed")
            self.store.pop(str(params[0]), None)
            return Result.Ok("ok")
        return Result.Ok("ok")


@pytest.fixture(autouse=True)
def _clean_token_env(monkeypatch):
    keys = (
        "MAJOOR_API_TOKEN",
        "MJR_API_TOKEN",
        "MAJOOR_API_TOKEN_HASH",
        "MJR_API_TOKEN_HASH",
        "MAJOOR_API_TOKEN_PEPPER",
    )
    for k in keys:
        monkeypatch.delenv(k, raising=False)
    yield
    try:
        sec._reset_security_state_for_tests()
    except Exception:
        pass
    for k in keys:
        monkeypatch.delenv(k, raising=False)


@pytest.mark.asyncio
async def test_read_write_delete_setting_smoke():
    db = _DB()
    s = AppSettings(db)
    assert await s._read_setting("x") is None
    w = await s._write_setting("x", "1")
    assert w.ok
    assert await s._read_setting("x") == "1"
    d = await s._delete_setting("x")
    assert d.ok
    assert await s._read_setting("x") is None


def test_hash_and_token_env(monkeypatch):
    s = AppSettings(_DB())
    monkeypatch.setenv("MAJOOR_API_TOKEN_PEPPER", "pep")
    h = s._hash_api_token("abc")
    assert h and len(h) == 64

    s._set_api_token_env("tok", "hash", include_plain=True)
    assert os.environ.get("MAJOOR_API_TOKEN") == "tok"
    s._set_api_token_env("tok", "hash2", include_plain=False)
    assert os.environ.get("MAJOOR_API_TOKEN") is None
    assert os.environ.get("MAJOOR_API_TOKEN_HASH") == "hash2"
    monkeypatch.delenv("MAJOOR_API_TOKEN_HASH", raising=False)
    monkeypatch.delenv("MJR_API_TOKEN_HASH", raising=False)
    monkeypatch.delenv("MJR_API_TOKEN", raising=False)


@pytest.mark.asyncio
async def test_get_or_create_api_token_from_env(monkeypatch):
    db = _DB()
    s = AppSettings(db)
    monkeypatch.setenv("MAJOOR_API_TOKEN", "envtok")
    t = await s._get_or_create_api_token_locked()
    assert t == "envtok"
    assert db.store.get(_SECURITY_API_TOKEN_HASH_KEY)


@pytest.mark.asyncio
async def test_get_or_create_api_token_from_hash_loads_hash_without_regeneration(monkeypatch):
    db = _DB()
    s = AppSettings(db)
    db.store[_SECURITY_API_TOKEN_HASH_KEY] = s._hash_api_token("old")
    monkeypatch.delenv("MAJOOR_API_TOKEN", raising=False)
    t = await s._get_or_create_api_token_locked()
    assert t == ""
    assert os.environ.get("MAJOOR_API_TOKEN") is None
    assert os.environ.get("MAJOOR_API_TOKEN_HASH") == db.store[_SECURITY_API_TOKEN_HASH_KEY]


@pytest.mark.asyncio
async def test_security_prefs_defaults_and_set(monkeypatch):
    db = _DB()
    s = AppSettings(db)
    monkeypatch.setenv("MAJOOR_ALLOW_DELETE", "0")

    prefs = await s.get_security_prefs()
    assert isinstance(prefs["allow_delete"], bool)

    out = await s.set_security_prefs(
        {
            "allow_write": True,
            "require_auth": True,
            "allow_insecure_token_transport": True,
            "apiToken": "abc",
        }
    )
    assert out.ok
    assert db.store.get("allow_write") == "1"
    assert db.store.get("require_auth") == "1"
    assert db.store.get("allow_insecure_token_transport") == "1"
    assert os.environ.get("MAJOOR_REQUIRE_AUTH") == "1"
    assert os.environ.get("MAJOOR_ALLOW_INSECURE_TOKEN_TRANSPORT") == "1"
    assert db.store.get(_SECURITY_API_TOKEN_KEY) == "abc"
    assert db.store.get(_SECURITY_API_TOKEN_HASH_KEY)


@pytest.mark.asyncio
async def test_security_prefs_invalid_and_db_error():
    db = _DB()
    s = AppSettings(db)
    bad = await s.set_security_prefs({})
    assert bad.code == "INVALID_INPUT"

    db.fail_write = True
    err = await s.set_security_prefs({"allow_write": True})
    assert err.code == "DB_ERROR"


@pytest.mark.asyncio
async def test_rotate_and_bootstrap_token():
    db = _DB()
    s = AppSettings(db)

    rot = await s.rotate_api_token()
    assert rot.ok and rot.data.get("api_token")
    assert db.store.get(_SECURITY_API_TOKEN_KEY) == rot.data.get("api_token")

    boot = await s.bootstrap_api_token()
    assert boot.ok and boot.data.get("api_token")


@pytest.mark.asyncio
async def test_bootstrap_token_can_be_recovered_after_restart_when_managed_by_settings():
    db = _DB()
    first = AppSettings(db)

    saved = await first.set_security_prefs({"apiToken": "persisted-token-123456"})
    assert saved.ok
    assert db.store.get(_SECURITY_API_TOKEN_KEY) == "persisted-token-123456"

    restarted = AppSettings(db)
    boot = await restarted.bootstrap_api_token()
    assert boot.ok
    assert boot.data.get("api_token") == "persisted-token-123456"


@pytest.mark.asyncio
async def test_bootstrap_token_recovers_legacy_hash_only_configuration():
    db = _DB()
    s = AppSettings(db)
    db.store[_SECURITY_API_TOKEN_HASH_KEY] = s._hash_api_token("old-legacy-token-123456")

    boot = await s.bootstrap_api_token()
    assert boot.ok
    assert boot.data.get("api_token")
    assert db.store.get(_SECURITY_API_TOKEN_KEY) == boot.data.get("api_token")
    assert db.store.get(_SECURITY_API_TOKEN_HASH_KEY) == s._hash_api_token(boot.data.get("api_token"))


@pytest.mark.asyncio
async def test_settings_version_read_get_bump_cache():
    db = _DB()
    s = AppSettings(db)

    db.store[_SETTINGS_VERSION_KEY] = "not-int"
    assert await s._read_settings_version() == 0

    bump = await s._bump_settings_version_locked()
    assert bump.ok and int(bump.data) > 0

    v1 = await s._get_settings_version()
    v2 = await s._get_settings_version()
    assert v1 == v2


@pytest.mark.asyncio
async def test_probe_backend_get_set_paths(monkeypatch):
    db = _DB()
    s = AppSettings(db)

    db.store[_PROBE_BACKEND_KEY] = "invalid"
    mode = await s.get_probe_backend()
    assert mode in {"auto", "exiftool", "ffprobe", "both"}

    bad = await s.set_probe_backend("xxx")
    assert bad.code == "INVALID_INPUT"

    ok = await s.set_probe_backend("ffprobe")
    assert ok.ok and ok.data == "ffprobe"

    monkeypatch.setattr(s, "_cache_ttl_s", -1)
    assert await s.get_probe_backend() == "ffprobe"


@pytest.mark.asyncio
async def test_vector_caption_on_index_get_set_and_startup_restore(monkeypatch):
    db = _DB()
    s = AppSettings(db)
    monkeypatch.delenv("MJR_AM_VECTOR_CAPTION_ON_INDEX", raising=False)
    monkeypatch.delenv("MAJOOR_VECTOR_CAPTION_ON_INDEX", raising=False)

    assert await s.get_vector_caption_on_index_enabled() is False

    out = await s.set_vector_caption_on_index_enabled(True)
    assert out.ok and out.data is True
    assert db.store.get(_VECTOR_CAPTION_ON_INDEX_KEY) == "1"
    assert os.environ.get("MJR_AM_VECTOR_CAPTION_ON_INDEX") == "1"

    monkeypatch.setenv("MJR_AM_VECTOR_CAPTION_ON_INDEX", "0")
    await s.apply_vector_search_override_on_startup()
    assert os.environ.get("MJR_AM_VECTOR_CAPTION_ON_INDEX") == "1"


def test_cached_probe_backend_helper_paths():
    s = AppSettings(_DB())
    cache_key = _PROBE_BACKEND_KEY
    # Seed with an expired entry (TTL already passed → monotonic timestamp 0)
    s._cache._data[cache_key] = ("auto", 0.0, 1)
    assert s._cached_probe_backend(cache_key, 1) == ""

    # Seed with fresh timestamp but wrong version → should also miss
    s._cache.put(cache_key, "auto", version=1)
    assert s._cached_probe_backend(cache_key, 2) == ""


def test_versioned_ttl_cache_evicts_oldest_entry():
    s = AppSettings(_DB())

    s._cache = s._cache.__class__(ttl_s=s._cache_ttl_s, maxsize=2)
    s._cache.put("first", "1", version=0)
    s._cache.put("second", "2", version=0)
    s._cache.put("third", "3", version=0)

    assert s._cache.get("first", version=0) is None
    assert s._cache.get("second", version=0) == "2"
    assert s._cache.get("third", version=0) == "3"


@pytest.mark.asyncio
async def test_metadata_fallback_get_set_paths():
    db = _DB()
    s = AppSettings(db)

    prefs = await s.get_metadata_fallback_prefs()
    assert set(prefs.keys()) == {"image", "media"}

    bad = await s.set_metadata_fallback_prefs()
    assert bad.code == "INVALID_INPUT"

    ok = await s.set_metadata_fallback_prefs(image=False, media=True)
    assert ok.ok
    assert db.store[_METADATA_FALLBACK_IMAGE_KEY] == "0"
    assert db.store[_METADATA_FALLBACK_MEDIA_KEY] == "1"


@pytest.mark.asyncio
async def test_metadata_fallback_db_error():
    db = _DB()
    s = AppSettings(db)
    db.fail_write = True
    out = await s.set_metadata_fallback_prefs(image=True)
    assert out.code == "DB_ERROR"


@pytest.mark.asyncio
async def test_user_scoped_settings_fallback_and_isolation(monkeypatch):
    db = _DB()
    s = AppSettings(db)
    db.store["allow_write"] = "1"
    db.store[_PROBE_BACKEND_KEY] = "ffprobe"
    db.store[_METADATA_FALLBACK_IMAGE_KEY] = "0"
    db.store[_METADATA_FALLBACK_MEDIA_KEY] = "1"
    monkeypatch.delenv("MAJOOR_ALLOW_WRITE", raising=False)

    token = sec._CURRENT_USER_ID.set("alice")
    try:
        assert await s.get_probe_backend() == "ffprobe"
        assert await s.get_metadata_fallback_prefs() == {"image": False, "media": True}
        assert (await s.get_security_prefs())["allow_write"] is True

        probe_res = await s.set_probe_backend("both")
        metadata_res = await s.set_metadata_fallback_prefs(image=True, media=False)
        prefs_res = await s.set_security_prefs({"allow_write": False})

        assert probe_res.ok is True
        assert metadata_res.ok is True
        assert prefs_res.ok is True
    finally:
        sec._CURRENT_USER_ID.reset(token)

    alice_probe_key = s._storage_key(_PROBE_BACKEND_KEY, user_scoped=True, user_id="alice")
    alice_image_key = s._storage_key(_METADATA_FALLBACK_IMAGE_KEY, user_scoped=True, user_id="alice")
    alice_media_key = s._storage_key(_METADATA_FALLBACK_MEDIA_KEY, user_scoped=True, user_id="alice")
    alice_version_key = s._settings_version_write_key(user_scoped=True, user_id="alice")

    assert db.store[_PROBE_BACKEND_KEY] == "ffprobe"
    assert db.store[_METADATA_FALLBACK_IMAGE_KEY] == "0"
    assert db.store[_METADATA_FALLBACK_MEDIA_KEY] == "1"
    assert db.store["allow_write"] == "0"
    assert db.store[alice_probe_key] == "both"
    assert db.store[alice_image_key] == "1"
    assert db.store[alice_media_key] == "0"
    assert alice_version_key in db.store
    assert os.environ.get("MAJOOR_ALLOW_WRITE") == "0"

    token = sec._CURRENT_USER_ID.set("bob")
    try:
        assert await s.get_probe_backend() == "ffprobe"
        assert await s.get_metadata_fallback_prefs() == {"image": False, "media": True}
        assert (await s.get_security_prefs())["allow_write"] is False
    finally:
        sec._CURRENT_USER_ID.reset(token)


def test_metadata_helpers_direct():
    s = AppSettings(_DB())
    payload = s._normalize_metadata_fallback_write_payload(image="0", media="1")
    assert payload[_METADATA_FALLBACK_IMAGE_KEY] is False
    assert payload[_METADATA_FALLBACK_MEDIA_KEY] is True

    s._cache.put(_METADATA_FALLBACK_IMAGE_KEY, "1", version=0)
    s._cache.put(_METADATA_FALLBACK_MEDIA_KEY, "0", version=0)
    cur = s._current_metadata_fallback_prefs_from_cache()
    assert cur == {"image": True, "media": False}


@pytest.mark.asyncio
async def test_output_directory_set_get_clear(tmp_path: Path, monkeypatch):
    db = _DB()
    s = AppSettings(db)
    target = str(tmp_path)
    override_file = tmp_path / "output-override.txt"

    class _FP:
        output_directory = ""

        @staticmethod
        def set_output_directory(v):
            _FP.output_directory = v

        @staticmethod
        def get_output_directory():
            return "C:/orig"

    monkeypatch.setitem(sys.modules, "folder_paths", _FP)
    monkeypatch.setattr("mjr_am_backend.settings._OUTPUT_DIR_OVERRIDE_FILE_PATH", override_file)

    set_res = await s.set_output_directory(target)
    assert set_res.ok
    assert db.store[_OUTPUT_DIRECTORY_KEY]
    assert override_file.read_text(encoding="utf-8").strip() == str(tmp_path.resolve())
    got = await s.get_output_directory()
    assert got

    clear_res = await s.set_output_directory("")
    assert clear_res.ok
    assert _OUTPUT_DIRECTORY_KEY not in db.store
    assert not override_file.exists()


@pytest.mark.asyncio
async def test_output_directory_db_errors(tmp_path: Path):
    db = _DB()
    s = AppSettings(db)

    db.fail_write = True
    out1 = await s.set_output_directory(str(tmp_path))
    assert out1.code == "DB_ERROR"

    db.fail_write = False
    db.fail_delete = True
    out2 = await s.set_output_directory("")
    assert out2.code == "DB_ERROR"


@pytest.mark.asyncio
async def test_huggingface_token_rejects_reused_security_api_token():
    db = _DB()
    s = AppSettings(db)
    s._runtime_api_token = "mjr_api_secret_123"

    blocked = await s.set_huggingface_token("mjr_api_secret_123")
    assert blocked.code == "INVALID_INPUT"
    assert "huggingface_token" not in db.store

    ok = await s.set_huggingface_token("hf_abcdefghijklmnopqrstuvwxyz")
    assert ok.ok is True
    assert db.store.get("huggingface_token") == "hf_abcdefghijklmnopqrstuvwxyz"


@pytest.mark.asyncio
async def test_ai_verbose_logs_get_set_and_startup_restore(monkeypatch):
    db = _DB()
    s = AppSettings(db)

    assert await s.get_ai_verbose_logs_enabled() is False

    out = await s.set_ai_verbose_logs_enabled(True)
    assert out.ok is True
    assert db.store.get(_AI_VERBOSE_LOGS_KEY) == "1"
    assert os.environ.get("MAJOOR_AI_VERBOSE_LOGS") == "1"

    monkeypatch.delenv("MAJOOR_AI_VERBOSE_LOGS", raising=False)
    monkeypatch.delenv("MJR_AM_AI_VERBOSE_LOGS", raising=False)
    monkeypatch.delenv("MAJOOR_VERBOSE_AI_LOGS", raising=False)
    monkeypatch.delenv("MJR_AM_VERBOSE_AI_LOGS", raising=False)

    await s.apply_ai_verbose_logs_on_startup()
    assert os.environ.get("MAJOOR_AI_VERBOSE_LOGS") == "1"


@pytest.mark.asyncio
async def test_route_verbose_logs_get_set_and_startup_restore(monkeypatch):
    db = _DB()
    s = AppSettings(db)

    assert await s.get_route_verbose_logs_enabled() is False

    out = await s.set_route_verbose_logs_enabled(True)
    assert out.ok is True
    assert db.store.get("route_verbose_logs") == "1"
    assert os.environ.get("MAJOOR_ROUTE_VERBOSE_LOGS") == "1"

    monkeypatch.delenv("MAJOOR_ROUTE_VERBOSE_LOGS", raising=False)
    monkeypatch.delenv("MJR_AM_ROUTE_VERBOSE_LOGS", raising=False)
    monkeypatch.delenv("MAJOOR_VERBOSE_ROUTE_LOGS", raising=False)
    monkeypatch.delenv("MJR_AM_VERBOSE_ROUTE_LOGS", raising=False)

    await s.apply_route_verbose_logs_on_startup()
    assert os.environ.get("MAJOOR_ROUTE_VERBOSE_LOGS") == "1"


@pytest.mark.asyncio
async def test_startup_verbose_logs_get_set_and_startup_restore(monkeypatch):
    db = _DB()
    s = AppSettings(db)

    assert await s.get_startup_verbose_logs_enabled() is False

    out = await s.set_startup_verbose_logs_enabled(True)
    assert out.ok is True
    assert db.store.get("startup_verbose_logs") == "1"
    assert os.environ.get("MAJOOR_STARTUP_VERBOSE_LOGS") == "1"

    monkeypatch.delenv("MAJOOR_STARTUP_VERBOSE_LOGS", raising=False)
    monkeypatch.delenv("MJR_AM_STARTUP_VERBOSE_LOGS", raising=False)
    monkeypatch.delenv("MAJOOR_VERBOSE_STARTUP_LOGS", raising=False)
    monkeypatch.delenv("MJR_AM_VERBOSE_STARTUP_LOGS", raising=False)

    await s.apply_startup_verbose_logs_on_startup()
    assert os.environ.get("MAJOOR_STARTUP_VERBOSE_LOGS") == "1"


def test_output_env_helpers(monkeypatch):
    s = AppSettings(_DB())
    monkeypatch.setenv("MAJOOR_OUTPUT_DIRECTORY", "x")
    monkeypatch.setenv("MJR_AM_OUTPUT_DIRECTORY", "x")
    s._clear_output_directory_env_vars()
    assert os.environ.get("MAJOOR_OUTPUT_DIRECTORY") is None

    monkeypatch.setenv("MAJOOR_ORIGINAL_OUTPUT_DIRECTORY", "C:/orig")
    assert s._restore_output_directory_target() == "C:/orig"

    s._clear_original_output_directory_env()
    assert os.environ.get("MAJOOR_ORIGINAL_OUTPUT_DIRECTORY") is None


def test_apply_comfy_output_directory_and_current(monkeypatch):
    s = AppSettings(_DB())

    class _FP1:
        output_directory = ""

        @staticmethod
        def set_output_directory(v):
            _FP1.output_directory = v

        @staticmethod
        def get_output_directory():
            return "C:/out"

    monkeypatch.setitem(sys.modules, "folder_paths", _FP1)
    s._apply_comfy_output_directory("C:/new")
    assert _FP1.output_directory == "C:/new"
    assert s._get_current_comfy_output_directory() == "C:/out"


def test_extract_token_payload_aliases():
    s = AppSettings(_DB())
    assert s._extract_token_from_prefs_payload({"api_token": "x"}) == "x"
    assert s._extract_token_from_prefs_payload({"apiToken": "y"}) == "y"
    assert s._extract_token_from_prefs_payload({}) is None


@pytest.mark.asyncio
async def test_ensure_security_bootstrap_and_warn_bump(monkeypatch):
    db = _DB()
    s = AppSettings(db)

    async def _tok():
        return "tok"

    monkeypatch.setattr(s, "_get_or_create_api_token_locked", _tok)
    await s.ensure_security_bootstrap()

    async def _bad_bump(*_args, **_kwargs):
        return Result.Err("DB_ERROR", "x")

    monkeypatch.setattr(s, "_bump_settings_version_locked", _bad_bump)
    await s._warn_if_bump_fails("x")
