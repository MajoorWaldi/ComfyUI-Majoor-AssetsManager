"""Parse scoped multi-token search expressions into indexed filter hints."""

from __future__ import annotations

import shlex
from dataclasses import asdict, dataclass
from typing import Any

from mjr_am_backend.features.metadata.section_catalog import iter_search_aliases

MAX_PREFIX_TERMS = 16
MAX_PREFIX_VALUE_LENGTH = 160


@dataclass(frozen=True, slots=True)
class PrefixTerm:
    field: str
    value: str
    exclude: bool = False


def _split_query(raw: str) -> list[str]:
    try:
        return shlex.split(str(raw or ""), posix=False)
    except Exception:
        return str(raw or "").split()


def _clean_value(value: str) -> str:
    text = str(value or "").strip().strip("\"'")
    text = "".join(ch for ch in text if ch >= " " and ch != "\x7f")
    return text[:MAX_PREFIX_VALUE_LENGTH]


def parse_prefixed_query(raw_query: str) -> tuple[str, dict[str, Any]]:
    aliases = iter_search_aliases()
    passthrough: list[str] = []
    terms: list[PrefixTerm] = []
    mode = "AND"

    for token in _split_query(raw_query):
        raw = str(token or "").strip()
        if not raw:
            continue
        upper = raw.upper()
        if upper in {"AND", "OR"}:
            mode = upper
            continue

        exclude = raw.startswith("-")
        token_body = raw[1:].strip() if exclude else raw
        if ":" not in token_body:
            passthrough.append(raw)
            continue

        key, _, value = token_body.partition(":")
        canonical = aliases.get(key.strip().lower())
        cleaned = _clean_value(value)
        if not canonical or not cleaned:
            passthrough.append(raw)
            continue
        if len(terms) < MAX_PREFIX_TERMS:
            terms.append(PrefixTerm(canonical, cleaned, exclude))

    filters: dict[str, Any] = {}
    if terms:
        filters["metadata_terms"] = [asdict(term) for term in terms]
        filters["metadata_terms_mode"] = mode
    return " ".join(passthrough).strip(), filters


def merge_prefixed_query(raw_query: str, filters: dict[str, Any] | None = None) -> tuple[str, dict[str, Any]]:
    query, prefix_filters = parse_prefixed_query(raw_query)
    merged = dict(filters or {})
    if prefix_filters.get("metadata_terms"):
        merged["metadata_terms"] = prefix_filters["metadata_terms"]
        merged["metadata_terms_mode"] = prefix_filters.get("metadata_terms_mode", "AND")
    return query, merged
