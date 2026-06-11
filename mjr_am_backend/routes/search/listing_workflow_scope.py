"""Workflow-scope listing helper."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from aiohttp import web
from mjr_am_backend.features.workflows import list_workflows


def _parse_optional_bool(value: Any) -> bool | None:
    text = str(value or "").strip().lower()
    if not text:
        return None
    if text in {"1", "true", "yes", "on"}:
        return True
    if text in {"0", "false", "no", "off"}:
        return False
    return None


def _parse_tag_filter(value: Any) -> set[str]:
    raw = str(value or "").strip().lower()
    if not raw:
        return set()
    parts = [chunk.strip() for chunk in raw.replace(",", " ").split()]
    return {part for part in parts if part}


def _workflow_card_matches_text_filters(card: dict[str, Any], filters: dict[str, Any]) -> bool:
    task = str(filters.get("workflow_task") or "").strip().lower()
    model = str(filters.get("workflow_model") or "").strip().lower()
    provider = str(filters.get("workflow_provider") or "").strip().lower()
    runs_on = str(filters.get("runs_on") or "").strip().lower()
    if task and str(card.get("task") or "").strip().lower() != task:
        return False
    if model and str(card.get("model_family") or "").strip().lower() != model:
        return False
    if provider and str(card.get("provider") or "").strip().lower() != provider:
        return False
    if runs_on and str(card.get("runs_on") or "").strip().lower() != runs_on:
        return False
    return True


def _workflow_card_matches_state_filters(card: dict[str, Any], filters: dict[str, Any]) -> bool:
    missing = _parse_optional_bool(filters.get("missing"))
    favorite = _parse_optional_bool(filters.get("favorite"))

    if missing is not None:
        has_missing = int(card.get("missing_nodes_count") or 0) > 0 or int(card.get("missing_models_count") or 0) > 0
        if has_missing is not missing:
            return False
    if favorite is not None and bool(card.get("favorite")) is not favorite:
        return False
    return True


def _workflow_card_matches_tag_filters(card: dict[str, Any], filters: dict[str, Any]) -> bool:
    tags = _parse_tag_filter(filters.get("tag"))
    if tags:
        card_tags = {
            str(tag or "").strip().lower()
            for tag in (card.get("tags") or [])
            if str(tag or "").strip()
        }
        if not tags.issubset(card_tags):
            return False
    return True


def _workflow_card_matches_filters(card: dict[str, Any], filters: dict[str, Any]) -> bool:
    return (
        _workflow_card_matches_text_filters(card, filters)
        and _workflow_card_matches_state_filters(card, filters)
        and _workflow_card_matches_tag_filters(card, filters)
    )


def _filter_workflow_scope_cards(cards: list[dict[str, Any]], filters: dict[str, Any]) -> list[dict[str, Any]]:
    return [card for card in cards if _workflow_card_matches_filters(card, filters)]


async def handle_workflow_scope(
    *,
    query: str,
    limit: int,
    offset: int,
    sort_key: str,
    subfolder: str,
    filters: dict[str, Any],
    json_response: Callable[[Any], web.Response],
) -> web.Response:
    result = list_workflows(
        query=query,
        limit=limit,
        offset=offset,
        sort=sort_key,
        subfolder=subfolder,
    )
    if result.ok and isinstance(result.data, dict):
        cards = result.data.get("assets") or []
        filtered = _filter_workflow_scope_cards(cards, filters or {})
        if len(filtered) != len(cards):
            result.data["assets"] = filtered
            result.data["count"] = len(filtered)
            result.data["total"] = len(filtered)
    return json_response(result)
