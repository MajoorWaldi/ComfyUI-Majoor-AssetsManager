"""Public Sqlite facade.

Keep import path stable: `from ...adapters.db.sqlite import Sqlite`.
Implementation lives in `sqlite_facade.py`.
"""

from .sqlite_facade import Sqlite

__all__ = ["Sqlite"]
