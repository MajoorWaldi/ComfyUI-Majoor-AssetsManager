"""
Logging utilities with consistent formatting and emoji indicators.
"""
import json
import logging
from datetime import datetime, timezone
from typing import Optional

# Emoji indicators for log levels
EMOJI_MAP = {
    "DEBUG": "🔍",      # Magnifying glass for debug
    "INFO": "ℹ️",       # Info symbol
    "WARNING": "⚠️",    # Warning sign
    "ERROR": "❌",      # Error cross
    "CRITICAL": "🔥",   # Fire for critical
    "SUCCESS": "✅",    # Success checkmark
}

# Global logger prefix
PREFIX = "📂 Majoor"

class EmojiFormatter(logging.Formatter):
    """Custom formatter that adds emoji based on log level."""

    def format(self, record):
        # Get emoji for log level
        emoji = EMOJI_MAP.get(record.levelname, "📂")

        # Format: 📂 Majoor [📂✅] module: message
        log_format = f"{PREFIX} [{emoji}] %(name)s: %(message)s"
        formatter = logging.Formatter(log_format)
        return formatter.format(record)

def get_logger(name: str, level: Optional[int] = None) -> logging.Logger:
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
logging.SUCCESS = 25  # Between INFO (20) and WARNING (30)
logging.addLevelName(logging.SUCCESS, "SUCCESS")

def log_success(logger, message: str):
    """
    Log a success message with ✅ emoji.

    Args:
        logger: Logger instance
        message: Success message
    """
    logger.log(logging.SUCCESS, message)

def log_structured(logger, level, message: str, **context):
    """Emit a structured JSON log entry with contextual fields."""
    payload = {
        "message": message,
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "context": context,
    }
    logger.log(level, json.dumps(payload, ensure_ascii=False))
