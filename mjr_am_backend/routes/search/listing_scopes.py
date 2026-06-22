"""Compatibility facade for scope-specific listing helpers."""

from __future__ import annotations

from .listing_all_scope import handle_all_scope
from .listing_custom_scope import handle_custom_scope
from .listing_input_scope import handle_input_scope
from .listing_output_scope import handle_output_scope
from .listing_workflow_scope import handle_workflow_scope

__all__ = [
    "handle_input_scope",
    "handle_custom_scope",
    "handle_all_scope",
    "handle_output_scope",
    "handle_workflow_scope",
]
