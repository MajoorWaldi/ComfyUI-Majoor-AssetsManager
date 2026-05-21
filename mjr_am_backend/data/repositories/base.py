"""Base class for repositories.

A repository wraps the async :class:`Sqlite` facade and exposes intent-named
data-access methods. Subclasses must not import service/route modules — the
dependency direction is one-way: services depend on repositories, never the
other way around.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from ...adapters.db.sqlite_facade import Sqlite


class Repository:
    """Base class binding a repository to its DB facade."""

    def __init__(self, db: Sqlite) -> None:
        self._db = db

    @property
    def db(self) -> Sqlite:
        """Expose the underlying DB facade (read-only access)."""
        return self._db
