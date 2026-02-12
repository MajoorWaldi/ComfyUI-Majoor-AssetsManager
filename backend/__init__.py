"""Compatibility shim: expose `backend` as alias of `mjr_am_backend`."""
from __future__ import annotations

import importlib

_impl = importlib.import_module("mjr_am_backend")

# Re-export package attributes
for _k in dir(_impl):
    if _k.startswith("__") and _k not in {"__all__", "__doc__", "__path__", "__spec__"}:
        continue
    globals()[_k] = getattr(_impl, _k)

# Make submodule imports like `backend.routes...` resolve to `mjr_am_backend/...`
try:
    __path__ = _impl.__path__  # type: ignore[attr-defined]
except Exception:
    pass

__all__ = getattr(_impl, "__all__", [])
