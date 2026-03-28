"""
Audit logging helpers for state-changing route handlers.
"""

from __future__ import annotations

import json
import time
from collections.abc import Mapping
from typing import Any

from aiohttp import web

from ...shared import get_logger
from .security import _current_user_id, _extract_peer_ip, _get_request_user_id, _resolve_client_ip

logger = get_logger(__name__)

_AUDIT_RETENTION_SECONDS = 90 * 24 * 60 * 60
_AUDIT_PURGE_INTERVAL_SECONDS = 24 * 60 * 60
_last_audit_purge_ts = 0.0


def _resolve_audit_db(db_or_services: Any) -> Any | None:
    if isinstance(db_or_services, Mapping):
        return db_or_services.get("db")
    return db_or_services


def _audit_target(value: Any, *, limit: int = 512) -> str:
    text = str(value or "").strip()
    if not text:
        return "unknown"
    return text[:limit]


def _audit_details_payload(result: Any, details: Mapping[str, Any] | None) -> str:
    payload: dict[str, Any] = {
        "ok": bool(getattr(result, "ok", False)),
        "code": str(getattr(result, "code", "") or ""),
    }
    error = getattr(result, "error", None)
    if error:
        payload["error"] = str(error)
    if isinstance(details, Mapping):
        payload.update({str(k): v for k, v in details.items()})
    encoded = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    if len(encoded) <= 4000:
        return encoded
    return json.dumps(
        {
            "ok": payload.get("ok", False),
            "code": payload.get("code", ""),
            "error": payload.get("error", ""),
            "truncated": True,
        },
        ensure_ascii=False,
        separators=(",", ":"),
    )


def _audit_result_label(result: Any) -> str:
    code = str(getattr(result, "code", "") or "").strip()
    if code:
        return code
    return "OK" if bool(getattr(result, "ok", False)) else "ERROR"


async def _maybe_purge_audit_log(db: Any, *, now: float) -> None:
    global _last_audit_purge_ts
    if now - _last_audit_purge_ts < _AUDIT_PURGE_INTERVAL_SECONDS:
        return
    cutoff = now - _AUDIT_RETENTION_SECONDS
    try:
        purge_res = await db.aexecute("DELETE FROM audit_log WHERE ts < ?", (cutoff,))
        if purge_res.ok:
            _last_audit_purge_ts = now
    except Exception as exc:
        logger.debug("Audit log purge skipped: %s", exc)


async def audit_log_write(
    db_or_services: Any,
    *,
    request: web.Request | None,
    operation: str,
    target: Any,
    result: Any,
    details: Mapping[str, Any] | None = None,
) -> bool:
    db = _resolve_audit_db(db_or_services)
    if db is None:
        return False

    headers: Mapping[str, str]
    try:
        headers = request.headers if request is not None else {}
    except Exception:
        headers = {}

    try:
        peer_ip = _extract_peer_ip(request) if request is not None else ""
    except Exception:
        peer_ip = ""
    client_ip = _resolve_client_ip(peer_ip, headers) if peer_ip else "unknown"
    user_ctx = _current_user_id() or _get_request_user_id(request)
    now = time.time()
    try:
        now = float(now)
    except (TypeError, ValueError):
        now = time.time()

    try:
        insert_res = await db.aexecute(
            """
            INSERT INTO audit_log (ts, ip, user_ctx, operation, target, result, details)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                now,
                client_ip,
                str(user_ctx or "")[:255],
                str(operation or "").strip()[:128],
                _audit_target(target),
                _audit_result_label(result)[:64],
                _audit_details_payload(result, details),
            ),
        )
        if not insert_res.ok:
            logger.debug("Audit log insert failed for %s: %s", operation, insert_res.error)
            return False
    except Exception as exc:
        logger.debug("Audit log insert raised for %s: %s", operation, exc)
        return False

    await _maybe_purge_audit_log(db, now=now)
    return True
