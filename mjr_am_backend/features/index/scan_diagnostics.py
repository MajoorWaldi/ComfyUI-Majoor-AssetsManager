"""
Batch failure diagnosis helpers.
"""
from typing import Any

from .scan_batch_utils import first_duplicate_filepath_in_batch, first_prepared_filepath


def batch_error_messages(batch_error: Exception) -> tuple[str, str]:
    try:
        message = str(batch_error or "")
    except Exception:
        return "", ""
    return message, message.lower()


def is_unique_filepath_error(message_lower: str) -> bool:
    return "unique constraint failed" in message_lower and "assets.filepath" in message_lower


def diagnose_unique_filepath_error(prepared: list[dict[str, Any]]) -> tuple[str | None, str] | None:
    duplicate = first_duplicate_filepath_in_batch(prepared)
    if duplicate:
        return duplicate, "duplicate filepath in batch payload (UNIQUE assets.filepath)"
    fp = first_prepared_filepath(prepared)
    if fp:
        return fp, "filepath conflicts with existing database row (UNIQUE assets.filepath)"
    return None, "UNIQUE constraint on assets.filepath"


def append_batch_context(reason: str, prepared: list[dict[str, Any]]) -> str:
    total = len(prepared or [])
    if total <= 0:
        return str(reason or "")

    ctx = [f"prepared={total}"]
    duplicate = first_duplicate_filepath_in_batch(prepared)
    if duplicate:
        ctx.append(f"batch_duplicate={duplicate}")
    else:
        first_fp = first_prepared_filepath(prepared)
        if first_fp:
            ctx.append(f"first_filepath={first_fp}")
    return f"{reason} [{' '.join(ctx)}]"


def diagnose_batch_failure(scanner: Any, prepared: list[dict[str, Any]], batch_error: Exception) -> tuple[str | None, str]:
    message, message_lower = batch_error_messages(batch_error)
    if is_unique_filepath_error(message_lower):
        diagnosed = diagnose_unique_filepath_error(prepared)
        if diagnosed is not None:
            fp, reason = diagnosed
            return fp, append_batch_context(reason, prepared)
    fp = first_prepared_filepath(prepared)
    return fp, append_batch_context((message or type(batch_error).__name__), prepared)
