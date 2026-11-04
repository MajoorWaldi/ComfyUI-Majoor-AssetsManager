"""
Tests for the configurable write rate-limit knobs in mjr_am_backend.config.

Covers the I/O matrix for MJR_AM_DELETE_RATE_LIMIT and
MJR_AM_ASSET_WRITE_RATE_LIMIT (defaults, valid values, invalid values,
clamping).
"""

import importlib
import os

import pytest

_KNOB_VARS = ("MJR_AM_DELETE_RATE_LIMIT", "MJR_AM_ASSET_WRITE_RATE_LIMIT")


@pytest.fixture
def reloadable_config():
    """Yield the config module and restore env + module state afterwards."""
    import mjr_am_backend.config as cfg

    saved = {name: os.environ.get(name) for name in _KNOB_VARS}
    yield cfg
    for name, value in saved.items():
        if value is None:
            os.environ.pop(name, None)
        else:
            os.environ[name] = value
    importlib.reload(cfg)


def _reloaded(cfg):
    return importlib.reload(cfg)


def test_knobs_default_when_unset(reloadable_config, monkeypatch):
    for name in _KNOB_VARS:
        monkeypatch.delenv(name, raising=False)
    cfg = _reloaded(reloadable_config)
    assert cfg.DELETE_RATE_LIMIT_PER_MIN == 20
    assert cfg.ASSET_WRITE_RATE_LIMIT_PER_MIN == 30


def test_knobs_accept_valid_values(reloadable_config, monkeypatch):
    monkeypatch.setenv("MJR_AM_DELETE_RATE_LIMIT", "600")
    monkeypatch.setenv("MJR_AM_ASSET_WRITE_RATE_LIMIT", "600")
    cfg = _reloaded(reloadable_config)
    assert cfg.DELETE_RATE_LIMIT_PER_MIN == 600
    assert cfg.ASSET_WRITE_RATE_LIMIT_PER_MIN == 600


def test_delete_knob_falls_back_to_default_on_non_integer(reloadable_config, monkeypatch):
    monkeypatch.setenv("MJR_AM_DELETE_RATE_LIMIT", "abc")
    cfg = _reloaded(reloadable_config)
    assert cfg.DELETE_RATE_LIMIT_PER_MIN == 20


def test_asset_write_knob_clamps_below_range(reloadable_config, monkeypatch):
    monkeypatch.setenv("MJR_AM_ASSET_WRITE_RATE_LIMIT", "0")
    cfg = _reloaded(reloadable_config)
    assert cfg.ASSET_WRITE_RATE_LIMIT_PER_MIN == 1


def test_delete_knob_clamps_above_range(reloadable_config, monkeypatch):
    monkeypatch.setenv("MJR_AM_DELETE_RATE_LIMIT", "999999")
    cfg = _reloaded(reloadable_config)
    assert cfg.DELETE_RATE_LIMIT_PER_MIN == 10000
