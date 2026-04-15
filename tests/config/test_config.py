"""
Tests for mjr_am_backend.config

Covers the env-var helper functions (_env_int, _env_float, _env_bool)
and basic validation of module-level constants.
"""

import pytest

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _set_env(monkeypatch, name: str, value: str) -> None:
    monkeypatch.setenv(name, value)


def _unset_env(monkeypatch, name: str) -> None:
    monkeypatch.delenv(name, raising=False)


# ---------------------------------------------------------------------------
# _env_int
# ---------------------------------------------------------------------------

class TestEnvInt:
    def test_returns_default_when_not_set(self, monkeypatch):
        from mjr_am_backend.config import _env_int  # type: ignore[attr-defined]
        _unset_env(monkeypatch, "MJR_TEST_INT")
        assert _env_int(42, "MJR_TEST_INT") == 42

    def test_parses_valid_int(self, monkeypatch):
        from mjr_am_backend.config import _env_int  # type: ignore[attr-defined]
        _set_env(monkeypatch, "MJR_TEST_INT", "99")
        assert _env_int(0, "MJR_TEST_INT") == 99

    def test_clamps_to_min(self, monkeypatch):
        from mjr_am_backend.config import _env_int  # type: ignore[attr-defined]
        _set_env(monkeypatch, "MJR_TEST_INT", "-5")
        assert _env_int(0, "MJR_TEST_INT", min_value=0) == 0

    def test_clamps_to_max(self, monkeypatch):
        from mjr_am_backend.config import _env_int  # type: ignore[attr-defined]
        _set_env(monkeypatch, "MJR_TEST_INT", "1000")
        assert _env_int(0, "MJR_TEST_INT", max_value=100) == 100

    def test_returns_default_on_invalid(self, monkeypatch):
        from mjr_am_backend.config import _env_int  # type: ignore[attr-defined]
        _set_env(monkeypatch, "MJR_TEST_INT", "not_a_number")
        assert _env_int(7, "MJR_TEST_INT") == 7


# ---------------------------------------------------------------------------
# _env_float
# ---------------------------------------------------------------------------

class TestEnvFloat:
    def test_returns_default_when_not_set(self, monkeypatch):
        from mjr_am_backend.config import _env_float  # type: ignore[attr-defined]
        _unset_env(monkeypatch, "MJR_TEST_FLOAT")
        assert _env_float(3.14, "MJR_TEST_FLOAT") == pytest.approx(3.14)

    def test_parses_valid_float(self, monkeypatch):
        from mjr_am_backend.config import _env_float  # type: ignore[attr-defined]
        _set_env(monkeypatch, "MJR_TEST_FLOAT", "2.5")
        assert _env_float(0.0, "MJR_TEST_FLOAT") == pytest.approx(2.5)

    def test_clamps_to_min(self, monkeypatch):
        from mjr_am_backend.config import _env_float  # type: ignore[attr-defined]
        _set_env(monkeypatch, "MJR_TEST_FLOAT", "-1.0")
        assert _env_float(0.0, "MJR_TEST_FLOAT", min_value=0.0) == pytest.approx(0.0)

    def test_clamps_to_max(self, monkeypatch):
        from mjr_am_backend.config import _env_float  # type: ignore[attr-defined]
        _set_env(monkeypatch, "MJR_TEST_FLOAT", "999.9")
        assert _env_float(1.0, "MJR_TEST_FLOAT", max_value=10.0) == pytest.approx(10.0)

    def test_returns_default_on_invalid(self, monkeypatch):
        from mjr_am_backend.config import _env_float  # type: ignore[attr-defined]
        _set_env(monkeypatch, "MJR_TEST_FLOAT", "bad")
        assert _env_float(1.5, "MJR_TEST_FLOAT") == pytest.approx(1.5)


# ---------------------------------------------------------------------------
# Module-level constants: basic sanity
# ---------------------------------------------------------------------------

class TestConfigConstants:
    def test_output_root_is_path_like(self):
        from pathlib import Path

        from mjr_am_backend.config import OUTPUT_ROOT  # type: ignore[attr-defined]
        assert isinstance(OUTPUT_ROOT, (str, Path))

    def test_search_max_limit_positive(self):
        from mjr_am_backend.config import SEARCH_MAX_LIMIT  # type: ignore[attr-defined]
        assert SEARCH_MAX_LIMIT > 0

    def test_to_thread_timeout_positive(self):
        from mjr_am_backend.config import TO_THREAD_TIMEOUT_S  # type: ignore[attr-defined]
        assert TO_THREAD_TIMEOUT_S > 0


def test_index_dir_override_from_env(monkeypatch, tmp_path):
    import mjr_am_backend.config as cfg

    monkeypatch.setenv("MJR_AM_INDEX_DIRECTORY", str(tmp_path))
    assert cfg.get_runtime_index_dir() == str(tmp_path.resolve())


def test_set_and_clear_index_dir_override(monkeypatch, tmp_path):
    import mjr_am_backend.config as cfg

    override_file = tmp_path / "override.txt"
    monkeypatch.setattr(cfg, "_INDEX_DIR_OVERRIDE_FILE_PATH", override_file)

    out = cfg.set_index_directory_override(str(tmp_path))
    assert out == str(tmp_path.resolve())
    assert override_file.exists()

    cleared = cfg.set_index_directory_override("")
    assert cleared == ""
    assert not override_file.exists()


def test_runtime_index_db_and_directory_helpers_follow_override_file(monkeypatch, tmp_path):
    import mjr_am_backend.config as cfg

    override_dir = tmp_path / "runtime-index"
    override_file = tmp_path / ".mjr_index_directory_override"
    override_file.write_text(str(override_dir) + "\n", encoding="utf-8")

    monkeypatch.delenv("MJR_AM_INDEX_DIRECTORY", raising=False)
    monkeypatch.delenv("MAJOOR_INDEX_DIRECTORY", raising=False)
    monkeypatch.setattr(cfg, "_INDEX_DIR_OVERRIDE_FILE_PATH", override_file)

    assert cfg.get_runtime_index_dir_path() == override_dir.resolve()
    assert cfg.get_runtime_index_db_path() == override_dir.resolve() / "assets.sqlite"
    assert cfg.get_runtime_collections_dir_path() == override_dir.resolve() / "collections"


def test_output_root_override_from_sidecar_file(monkeypatch, tmp_path):
    import mjr_am_backend.config as cfg

    override_root = tmp_path / "custom-output"
    override_root.mkdir()
    override_file = tmp_path / "output-override.txt"
    override_file.write_text(str(override_root) + "\n", encoding="utf-8")

    monkeypatch.delenv("MJR_AM_OUTPUT_DIRECTORY", raising=False)
    monkeypatch.delenv("MAJOOR_OUTPUT_DIRECTORY", raising=False)
    monkeypatch.setattr(cfg, "_OUTPUT_DIR_OVERRIDE_FILE_PATH", override_file)

    assert cfg._resolve_output_root_from_env() == override_root.resolve()
