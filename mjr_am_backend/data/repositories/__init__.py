"""Data-access layer (Repository pattern) for the Majoor Assets Manager.

The repository layer isolates raw SQL from the service/route layers and
provides typed, intent-revealing methods. It is being introduced
incrementally (Phase 3.2) — new code should use repositories, while existing
service code keeps its direct DB calls until each domain is migrated.

Each repository takes the async SQLite facade in its constructor and exposes
``Result``-returning coroutines. Repositories own *only* DB I/O — business
rules, validation, and orchestration belong in service classes.
"""

from __future__ import annotations

from .base import Repository
from .tags_repository import TagsRepository

__all__ = ["Repository", "TagsRepository"]
