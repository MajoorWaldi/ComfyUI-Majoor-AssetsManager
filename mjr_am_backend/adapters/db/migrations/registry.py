"""Ordered registry of all versioned migrations managed by the runner.

Add new migrations by importing them here and appending the module-level
``MIGRATION`` instance to :data:`MIGRATIONS`. The runner sorts by version
anyway, but keeping the list in version order aids readability and review.
"""

from __future__ import annotations

from .base import Migration
from .m017_normalize_tags import MIGRATION as M017

MIGRATIONS: list[Migration] = [M017]
