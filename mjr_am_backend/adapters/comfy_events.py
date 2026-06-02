"""Structured Majoor websocket events over ComfyUI PromptServer.

ComfyUI custom events are emitted with ``PromptServer.instance.send_sync``.
This module keeps legacy event names intact while adding a stable ``mjr.event``
envelope for consumers that want one normalized stream.
"""

from __future__ import annotations

import time
from typing import Any

from mjr_am_backend.utils import sanitize_for_json

from .comfy_core import send_event

STRUCTURED_EVENT_NAME = "mjr.event"


def build_event_payload(event: str, payload: Any, *, category: str | None = None) -> dict[str, Any]:
    safe_event = str(event or "").strip()
    data = payload if isinstance(payload, dict) else {"value": payload}
    safe_data = sanitize_for_json(data)
    envelope: dict[str, Any] = {
        "event": safe_event,
        "category": category or _category_for_event(safe_event),
        "timestamp": time.time(),
        "data": safe_data,
    }
    if isinstance(safe_data, dict):
        for key in (
            "status",
            "scope",
            "origin",
            "prompt_id",
            "asset_id",
            "id",
            "filename",
            "stats",
        ):
            if key in safe_data:
                envelope[key] = safe_data.get(key)
    return sanitize_for_json(envelope)


def emit_event(event: str, payload: Any, *, category: str | None = None, sid: str | None = None) -> bool:
    safe_event = str(event or "").strip()
    if not safe_event:
        return False
    data = sanitize_for_json(payload if isinstance(payload, dict) else {"value": payload})
    sent = send_event(safe_event, data, sid)
    envelope = build_event_payload(safe_event, data, category=category)
    send_event(STRUCTURED_EVENT_NAME, envelope, sid)
    return sent


def _category_for_event(event: str) -> str:
    if event.startswith("mjr.scan") or event == "mjr-scan-complete":
        return "scan"
    if event.startswith("mjr.asset") or event in {"mjr-asset-added", "mjr-asset-updated"}:
        return "asset"
    if event.startswith("mjr.vector"):
        return "vector"
    if event.startswith("mjr-enrichment") or event == "mjr-enrichment-status":
        return "enrichment"
    if event.startswith("mjr.runtime"):
        return "runtime"
    return "general"


__all__ = ["STRUCTURED_EVENT_NAME", "build_event_payload", "emit_event"]
