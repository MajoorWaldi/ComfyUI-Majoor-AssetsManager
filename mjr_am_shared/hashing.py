"""
Content hashing helpers shared across services.

Prefers `blake3` when the optional dependency is installed (significantly
faster than SHA-256 and what ComfyUI core now uses for asset deduplication),
falls back to SHA-256 otherwise so the plugin keeps working on minimal envs.

Hash digests are returned as plain hex strings without a prefix. The
algorithm that produced them is reported separately so callers can persist
it alongside (e.g. into the `assets.hash_algo` column).
"""

from __future__ import annotations

import hashlib
from pathlib import Path
from typing import Literal, Protocol

try:  # pragma: no cover - optional fast path
    import blake3 as _blake3  # type: ignore[import-not-found]

    _HAS_BLAKE3 = True
except Exception:  # pragma: no cover
    _blake3 = None  # type: ignore[assignment]
    _HAS_BLAKE3 = False


HashAlgo = Literal["sha256", "blake3"]
_CHUNK = 1024 * 1024


class _Hasher(Protocol):
    def update(self, data: bytes) -> object: ...
    def hexdigest(self) -> str: ...


def preferred_algo() -> HashAlgo:
    """Algorithm used by `compute_file_hash` when no explicit choice is made."""
    return "blake3" if _HAS_BLAKE3 else "sha256"


def compute_file_hash(path: Path | str, *, algo: HashAlgo | None = None) -> tuple[str, HashAlgo]:
    """Hash a file's bytes, returning ``(hex_digest, algo_used)``.

    Falls back to SHA-256 silently when blake3 is requested but unavailable.
    """
    target = Path(path)
    chosen: HashAlgo = algo or preferred_algo()
    if chosen == "blake3" and not _HAS_BLAKE3:
        chosen = "sha256"

    if chosen == "blake3":
        hasher: _Hasher = _blake3.blake3()  # type: ignore[union-attr]
    else:
        hasher = hashlib.sha256()

    with target.open("rb") as fh:
        while True:
            chunk = fh.read(_CHUNK)
            if not chunk:
                break
            hasher.update(chunk)
    return hasher.hexdigest(), chosen


def parse_hash_uri(value: str) -> tuple[HashAlgo, str] | None:
    """Parse a ``blake3:xxx`` / ``sha256:xxx`` URI.

    Returns ``(algo, hex_digest)`` or ``None`` if the input is not a recognised
    hash URI. The hex digest is normalised to lowercase and validated to
    contain only hex characters.
    """
    raw = str(value or "").strip()
    if ":" not in raw:
        return None
    prefix, _, digest = raw.partition(":")
    algo = prefix.strip().lower()
    if algo not in ("sha256", "blake3"):
        return None
    digest = digest.strip().lower()
    if not digest or any(c not in "0123456789abcdef" for c in digest):
        return None
    return algo, digest  # type: ignore[return-value]


__all__ = [
    "HashAlgo",
    "compute_file_hash",
    "parse_hash_uri",
    "preferred_algo",
]
