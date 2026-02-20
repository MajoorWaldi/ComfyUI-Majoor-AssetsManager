"""
Time utilities for timestamps and performance measurement.
"""
from __future__ import annotations

import logging
import time
from collections.abc import Iterator
from contextlib import contextmanager


def now() -> float:
    """Get current timestamp in seconds (float)."""
    return time.time()

def ms() -> int:
    """Get current timestamp in milliseconds (int)."""
    return int(time.time() * 1000)

def format_timestamp(ts: float | None = None) -> str:
    """
    Format timestamp as ISO 8601 string.

    Args:
        ts: Timestamp in seconds (default: now())

    Returns:
        ISO 8601 formatted string (e.g., "2025-12-29T19:30:45")
    """
    if ts is None:
        ts = now()
    return time.strftime("%Y-%m-%dT%H:%M:%S", time.localtime(ts))

@contextmanager
def timer(label: str, logger: logging.Logger | None = None) -> Iterator[None]:
    """
    Context manager for timing operations.

    Usage:
        with timer("metadata extraction", logger):
            extract_metadata(path)
    """
    start = now()
    try:
        yield
    finally:
        elapsed = now() - start
        msg = f"{label} took {elapsed:.3f}s"
        if logger:
            logger.debug(msg)
        else:
            print(msg)
