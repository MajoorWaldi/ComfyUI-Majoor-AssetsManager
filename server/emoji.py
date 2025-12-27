"""
Emoji helpers for Majoor logs.
Prefixes log messages with folder + state-specific emoji.
"""
from __future__ import annotations

from typing import Dict

FOLDER_ICON = "📁"
EMOJI_MAP: Dict[str, str] = {
    "error": "❌",
    "warning": "⚠️",
    "success": "✅",
    "info": "ℹ️",
}


def emoji_prefix(level: str) -> str:
    icon = EMOJI_MAP.get(level.lower(), EMOJI_MAP["info"])
    return f"{FOLDER_ICON}{icon} "
