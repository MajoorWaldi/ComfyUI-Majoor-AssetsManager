"""Runtime bootstrap helpers extracted from dependency wiring."""

from __future__ import annotations

from typing import Any, Awaitable, Callable


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
            "HuggingFace token restore failed: %s",
            "apply_huggingface_token_on_startup",
        ),
        (
            "AI verbose logs setting restore failed: %s",
            "apply_ai_verbose_logs_on_startup",
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
