"""
Utility helpers for walking graph-like metadata payloads.

Some exporters wrap the actual workflow/prompt dictionaries inside nested structures
such as groups, subgraphs, or wrapper objects. These helpers recursively visit every
dictionary in the payload so that downstream extractors can spot the real data no matter
how deeply it is tucked in.
"""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from typing import Any, Dict, Iterator, Set


def iter_nested_dicts(obj: Any, *, _seen: Set[int] | None = None) -> Iterator[Dict[str, Any]]:
    """
    Recursively yield every dictionary contained within ``obj``.

    Args:
        obj: Any Python object.
        _seen: Internal recursion guard (do not set manually).
    """
    if _seen is None:
        _seen = set()

    obj_id = id(obj)
    if obj_id in _seen:
        return
    _seen.add(obj_id)

    if isinstance(obj, Mapping):
        yield obj
        for value in obj.values():
            yield from iter_nested_dicts(value, _seen=_seen)
    elif isinstance(obj, Iterable) and not isinstance(obj, (str, bytes, bytearray)):
        for item in obj:
            yield from iter_nested_dicts(item, _seen=_seen)
