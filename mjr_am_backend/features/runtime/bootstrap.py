"""Runtime bootstrap helpers extracted from dependency wiring."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any


async def apply_startup_settings(
    settings_service: Any,
    *,
    warn: Callable[[str, Exception], None],
) -> None:
    startup_steps = (
        ("Security bootstrap failed: %s", "ensure_security_bootstrap"),
        (
            "Output directory override restore failed: %s",
            "apply_output_directory_override_on_startup",
        ),
        (
            "Vector search setting restore failed: %s",
            "apply_vector_search_override_on_startup",
        ),
        (
            "Execution grouping setting restore failed: %s",
            "apply_execution_grouping_override_on_startup",
        ),
        (
            "HuggingFace token restore failed: %s",
            "apply_huggingface_token_on_startup",
        ),
        (
            "AI verbose logs setting restore failed: %s",
            "apply_ai_verbose_logs_on_startup",
        ),
        (
            "Verbose route registration logs setting restore failed: %s",
            "apply_route_verbose_logs_on_startup",
        ),
        (
            "Verbose startup logs setting restore failed: %s",
            "apply_startup_verbose_logs_on_startup",
        ),
        (
            "LTXAV RGB fallback setting restore failed: %s",
            "apply_ltxav_rgb_fallback_on_startup",
        ),
    )
    for message, attribute_name in startup_steps:
        step = getattr(settings_service, attribute_name, None)
        if not callable(step):
            continue
        try:
            await step()
        except Exception as exc:
            warn(message, exc)
