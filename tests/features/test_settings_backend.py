import os
import sys
from pathlib import Path

import pytest

from mjr_am_backend.settings import (
    AppSettings,
    _METADATA_FALLBACK_IMAGE_KEY,
    _METADATA_FALLBACK_MEDIA_KEY,
    _OUTPUT_DIRECTORY_KEY,
    _PROBE_BACKEND_KEY,
    _SECURITY_API_TOKEN_HASH_KEY,
    _SETTINGS_VERSION_KEY,
)
from mjr_am_backend.shared import Result
from mjr_am_backend.routes.core import security as sec


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

    out = await s.set_security_prefs({"allow_write": True, "apiToken": "abc"})
    assert out.ok
    assert db.store.get("allow_write") == "1"
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

    boot = await s.bootstrap_api_token()
    assert boot.ok and boot.data.get("api_token")


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


def test_cached_probe_backend_helper_paths():
    s = AppSettings(_DB())
    s._cache[_PROBE_BACKEND_KEY] = "auto"
    s._cache_at[_PROBE_BACKEND_KEY] = 0.0
    s._cache_version[_PROBE_BACKEND_KEY] = 1
    assert s._cached_probe_backend(1) == ""

    s._cache_at[_PROBE_BACKEND_KEY] = 10**9
    assert s._cached_probe_backend(2) == ""


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


def test_metadata_helpers_direct():
    s = AppSettings(_DB())
    payload = s._normalize_metadata_fallback_write_payload(image="0", media="1")
    assert payload[_METADATA_FALLBACK_IMAGE_KEY] is False
    assert payload[_METADATA_FALLBACK_MEDIA_KEY] is True

    s._cache[_METADATA_FALLBACK_IMAGE_KEY] = "1"
    s._cache[_METADATA_FALLBACK_MEDIA_KEY] = "0"
    cur = s._current_metadata_fallback_prefs_from_cache()
    assert cur == {"image": True, "media": False}


@pytest.mark.asyncio
async def test_output_directory_set_get_clear(tmp_path: Path, monkeypatch):
    db = _DB()
    s = AppSettings(db)
    target = str(tmp_path)

    class _FP:
        output_directory = ""

        @staticmethod
        def set_output_directory(v):
            _FP.output_directory = v

        @staticmethod
        def get_output_directory():
            return "C:/orig"

    monkeypatch.setitem(sys.modules, "folder_paths", _FP)

    set_res = await s.set_output_directory(target)
    assert set_res.ok
    assert db.store[_OUTPUT_DIRECTORY_KEY]
    got = await s.get_output_directory()
    assert got

    clear_res = await s.set_output_directory("")
    assert clear_res.ok
    assert _OUTPUT_DIRECTORY_KEY not in db.store


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

    async def _bad_bump():
        return Result.Err("DB_ERROR", "x")

    monkeypatch.setattr(s, "_bump_settings_version_locked", _bad_bump)
    await s._warn_if_bump_fails("x")
