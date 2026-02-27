"""
Logging utilities with consistent formatting and emoji indicators.
"""
import json
import logging
from contextvars import ContextVar
from datetime import datetime, timezone
from typing import Any, Final

# Emoji indicators for log levels
EMOJI_MAP: Final[dict[str, str]] = {
    "DEBUG": "🔍",      # Magnifying glass for debug
    "INFO": "ℹ️",       # Info symbol
    "WARNING": "⚠️",    # Warning sign
    "ERROR": "❌",      # Error cross
    "CRITICAL": "🔥",   # Fire for critical
    "SUCCESS": "✅",    # Success checkmark
}

# Global logger prefix
PREFIX: Final[str] = "📂 Majoor"

request_id_var: ContextVar[str] = ContextVar("request_id", default="")


class CorrelationFilter(logging.Filter):
    """Inject `request_id` from `request_id_var` into each log record."""

    def filter(self, record: logging.LogRecord) -> bool:
        """Attach `record.request_id` for correlation; always returns True."""
        try:
            record.request_id = request_id_var.get("")
        except Exception:
            record.request_id = ""
        return True


class EmojiFormatter(logging.Formatter):
    """Custom formatter that adds emoji based on log level."""

    def format(self, record: logging.LogRecord) -> str:
        """Format a log record as a single line with a prefix and emoji."""
        # Get emoji for log level
        emoji = EMOJI_MAP.get(record.levelname, "📂")

        # Format: 📂 Majoor [📂✅] module: message
        try:
            rid = str(getattr(record, "request_id", "") or "").strip()
        except Exception:
            rid = ""
        rid_part = f" [{rid}]" if rid else ""
        log_format = f"{PREFIX} [{emoji}] %(name)s{rid_part}: %(message)s"
        formatter = logging.Formatter(log_format)
        return formatter.format(record)


def _has_correlation_filter(logger: logging.Logger) -> bool:
    try:
        return any(isinstance(f, CorrelationFilter) for f in list(logger.filters or []))
    except Exception:
        return False


def _ensure_correlation_filter(logger: logging.Logger) -> None:
    if _has_correlation_filter(logger):
        return
    try:
        logger.addFilter(CorrelationFilter())
    except Exception:
        pass

def get_logger(name: str, level: int | None = None) -> logging.Logger:
    """
    Get a logger with Majoor prefix and emoji indicators.

    Args:
        name: Logger name (usually __name__)
        level: Optional logging level (DEBUG, INFO, WARNING, ERROR)

    Returns:
        Configured logger instance with emoji formatting
    """
    # Clean name (remove module prefix if present)
    if name.startswith("__main__"):
        name = "main"
    elif "." in name:
        parts = name.split(".")
        if "server" in parts:
            idx = parts.index("server")
            name = ".".join(parts[idx:])
        elif "backend" in parts:
            idx = parts.index("backend")
            name = ".".join(parts[idx:])

    logger = logging.getLogger(f"majoor.{name}")
    _ensure_correlation_filter(logger)

    if level is not None:
        logger.setLevel(level)
    elif not logger.handlers:
        # Default to INFO if not configured
        logger.setLevel(logging.INFO)

    # Add console handler if none exists
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(EmojiFormatter())
        logger.addHandler(handler)

        # Prevent propagation to avoid duplicate logs
        logger.propagate = False

    return logger

# Add SUCCESS level
SUCCESS_LEVEL: Final[int] = 25  # Between INFO (20) and WARNING (30)
logging.addLevelName(SUCCESS_LEVEL, "SUCCESS")

def log_success(logger: logging.Logger, message: str) -> None:
    """
    Log a success message with ✅ emoji.

    Args:
        logger: Logger instance
        message: Success message
    """
    logger.log(SUCCESS_LEVEL, message)

def log_structured(logger: logging.Logger, level: int, message: str, **context: Any) -> None:
    """Emit a structured JSON log entry with contextual fields."""
    payload = {
        "message": message,
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "context": context,
    }
    logger.log(level, json.dumps(payload, ensure_ascii=False))
