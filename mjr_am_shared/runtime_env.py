"""Auditable runtime environment access; values (including secrets) are never logged.

Reads remain live so settings changes and embedded-host environment updates are
visible immediately. Missing and empty values retain os.environ.get semantics.
"""
from __future__ import annotations

import os
from typing import TypeVar, overload

_T = TypeVar("_T")


@overload
def get_env(name: str) -> str | None: ...


@overload
def get_env(name: str, default: _T) -> str | _T: ...


def get_env(name: str, default: _T | None = None) -> str | _T | None:
    return os.environ.get(name, default)


def has_env(name: str) -> bool:
    return name in os.environ


def set_env(name: str, value: str) -> None:
    os.environ[name] = value


def unset_env(name: str) -> None:
    os.environ.pop(name, None)
