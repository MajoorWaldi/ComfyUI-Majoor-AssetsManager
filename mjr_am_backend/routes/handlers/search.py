"""Search handler facade.

Public route registration API remains stable.
Also re-exports selected helper symbols used by tests.
"""

from .search_impl import (
    _date_bounds_for_exact,
    _date_bounds_for_range,
    _normalize_sort_key,
    _parse_inline_query_filters,
    register_search_routes,
)

__all__ = [
    "register_search_routes",
    "_parse_inline_query_filters",
    "_date_bounds_for_range",
    "_date_bounds_for_exact",
    "_normalize_sort_key",
]
