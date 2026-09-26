"""Process boundary for trusted media-tool commands, always without a shell.

Adapters retain tool-specific executable/argument validation. Media readers must
resolve an existing filesystem file and restrict nested FFmpeg protocols too.
Mounted shares remain supported; URLs and device/pipe inputs are not accepted.
"""
from __future__ import annotations

import asyncio
import re
import subprocess
from pathlib import Path
from typing import Any


def local_media_path(path: str | Path) -> str:
    raw = str(path or "").strip()
    if not raw or raw.startswith("-") or any(c in raw for c in "\x00\r\n"):
        raise ValueError("Invalid file path")
    if re.match(r"^[A-Za-z][A-Za-z0-9+.-]*:", raw) and not re.match(r"^[A-Za-z]:[\\/]", raw):
        raise ValueError("Media URLs are not supported")
    resolved = Path(raw).expanduser().resolve(strict=True)
    if not resolved.is_file():
        raise ValueError("Only existing filesystem files are supported")
    return str(resolved)


def _argv(cmd: list[str]) -> list[str]:
    if not isinstance(cmd, list) or not cmd or not all(isinstance(arg, str) for arg in cmd):
        raise ValueError("Expected a nonempty argument list")
    return cmd


def run(cmd: list[str], **kwargs: Any) -> subprocess.CompletedProcess:
    kwargs["shell"] = False
    return subprocess.run(_argv(cmd), **kwargs)


def popen(cmd: list[str], **kwargs: Any) -> subprocess.Popen:
    kwargs["shell"] = False
    return subprocess.Popen(_argv(cmd), **kwargs)


async def spawn(cmd: list[str], **kwargs: Any) -> asyncio.subprocess.Process:
    return await asyncio.create_subprocess_exec(*_argv(cmd), **kwargs)


def run_ffmpeg(cmd: list[str], **kwargs: Any) -> subprocess.CompletedProcess:
    """Validate every input and disable network protocols, including playlists."""
    safe = list(cmd)
    for index in range(len(safe) - 1, 0, -1):
        if safe[index] == "-i":
            safe[index + 1] = local_media_path(safe[index + 1])
            safe[index:index] = ["-protocol_whitelist", "file,pipe"]
    return run(safe, **kwargs)


def ffmpeg_from_probe(configured: str) -> str:
    path = Path(str(configured).strip().strip('"'))
    suffix = ".exe" if path.suffix.lower() == ".exe" else ""
    return str(path.with_name("ffmpeg" + suffix))
