"""Token hashing and extraction helpers for write-access guards."""

from __future__ import annotations

import hashlib
import os
from collections.abc import Mapping
from http.cookies import SimpleCookie

from mjr_am_backend.shared import get_logger

from .security_policy import _validate_token_format

logger = get_logger(__name__)

_PBKDF2_TOKEN_PEPPER_FALLBACK = "mjr_api_token_pepper_fallback"


def _get_write_token() -> str:
    try:
        raw = (os.environ.get("MAJOOR_API_TOKEN") or os.environ.get("MJR_API_TOKEN") or "").strip()
    except Exception:
        raw = ""
    return _validate_token_format(raw, "MAJOOR_API_TOKEN") or ""


def _hash_token(value: str) -> str:
    try:
        normalized = str(value or "").strip()
    except Exception:
        normalized = ""
    try:
        pepper = str(os.environ.get("MAJOOR_API_TOKEN_PEPPER") or "").strip()
    except Exception:
        pepper = ""
    payload = f"{pepper}\0{normalized}".encode("utf-8", errors="ignore")
    return hashlib.pbkdf2_hmac(
        "sha256",
        payload,
        b"mjr_am_backend.api_token_salt",
        100_000,
    ).hex()


def _hash_token_pbkdf2(value: str) -> str:
    try:
        normalized = str(value or "").strip()
    except Exception:
        normalized = ""
    try:
        pepper = str(os.environ.get("MAJOOR_API_TOKEN_PEPPER") or "").strip()
    except Exception:
        pepper = ""
    if not pepper:
        pepper = _PBKDF2_TOKEN_PEPPER_FALLBACK
    return hashlib.pbkdf2_hmac(
        "sha256",
        normalized.encode("utf-8", errors="ignore"),
        pepper.encode("utf-8", errors="ignore"),
        100_000,
    ).hex()


def _token_hash_matches(provided: str, configured_hash: str) -> bool:
    import hmac

    token = str(provided or "").strip()
    expected = str(configured_hash or "").strip().lower()
    if not token or not expected:
        return False
    return hmac.compare_digest(_hash_token(token), expected) or hmac.compare_digest(
        _hash_token_pbkdf2(token),
        expected,
    )


def _get_write_token_hash() -> str:
    try:
        configured_hash = (
            (os.environ.get("MAJOOR_API_TOKEN_HASH") or os.environ.get("MJR_API_TOKEN_HASH") or "")
            .strip()
            .lower()
        )
    except Exception:
        configured_hash = ""
    if configured_hash:
        return configured_hash
    configured_plain = _get_write_token()
    if configured_plain:
        return _hash_token(configured_plain)
    return ""


def _extract_bearer_token(headers: Mapping[str, str]) -> str:
    try:
        auth = str(headers.get("Authorization") or "").strip()
    except Exception:
        auth = ""
    if not auth:
        return ""
    prefix = "bearer "
    if auth.lower().startswith(prefix):
        return auth[len(prefix) :].strip()
    return ""


def _extract_mjr_token_header(headers: Mapping[str, str]) -> str:
    try:
        return str(headers.get("X-MJR-Token") or "").strip()
    except Exception:
        return ""


def _extract_write_token_from_cookie(headers: Mapping[str, str]) -> str:
    try:
        cookie_header = str(headers.get("Cookie") or "").strip()
    except Exception:
        return ""
    if not cookie_header or len(cookie_header) > 4096:
        return ""
    try:
        parsed = SimpleCookie()
        parsed.load(cookie_header)
        raw = parsed.get("mjr_write_token")
        if raw is not None:
            return str(raw.value or "").strip()
    except Exception:
        logger.debug("_extract_write_token_from_cookie: suppressed exception", exc_info=True)
    return ""


def _extract_write_token_from_headers(headers: Mapping[str, str]) -> str:
    bearer = _extract_bearer_token(headers)
    if bearer:
        return bearer
    token = _extract_mjr_token_header(headers)
    if token:
        return token
    return _extract_write_token_from_cookie(headers)
