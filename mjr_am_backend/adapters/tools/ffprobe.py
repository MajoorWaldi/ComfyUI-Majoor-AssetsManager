"""
FFprobe adapter for video metadata extraction.
"""
import subprocess
import json
import shutil
import os
import asyncio
from pathlib import Path
from typing import Optional, List, Dict

from ...config import FFPROBE_TIMEOUT
from ...shared import Result, ErrorCode, get_logger

logger = get_logger(__name__)

class FFProbe:
    """
    FFprobe wrapper for video metadata extraction.

    Never raises exceptions - always returns Result.
    """

    def __init__(self, bin_name: str = "ffprobe", timeout: Optional[float] = None):
        """
        Initialize FFprobe adapter.

        Args:
            bin_name: FFprobe binary name or path
            timeout: Command timeout in seconds
        """
        self.bin = bin_name
        self.timeout = float(timeout) if timeout is not None else float(FFPROBE_TIMEOUT)
        try:
            self._max_workers = max(1, int(os.getenv("MAJOOR_FFPROBE_MAX_WORKERS", "4")))
        except Exception:
            self._max_workers = 4
        self._resolved_bin: Optional[str] = None
        self._available = self._check_available()

    def _resolve_executable(self, bin_name: str) -> Optional[str]:
        """
        Resolve and validate the ffprobe executable.

        Defends against untrusted configuration values and ensures we're invoking an
        actual ffprobe binary (not an arbitrary command string).
        """
        raw = (bin_name or "").strip()
        if not self._is_safe_executable_token(raw):
            return None
        resolved = self._resolve_executable_path(raw)
        if not resolved:
            return None
        return resolved if self._is_ffprobe_name(resolved) else None

    @staticmethod
    def _is_safe_executable_token(raw: str) -> bool:
        if not raw:
            return False
        if "\x00" in raw or "\n" in raw or "\r" in raw:
            return False
        if any(ch in raw for ch in ("&", "|", ";", ">", "<")):
            return False
        return True

    @staticmethod
    def _resolve_executable_path(raw: str) -> Optional[str]:
        resolved = shutil.which(raw)
        if resolved:
            return resolved
        try:
            candidate = Path(raw)
            if candidate.is_file():
                return str(candidate.resolve(strict=True))
        except (OSError, RuntimeError, ValueError):
            return None
        return None

    @staticmethod
    def _is_ffprobe_name(resolved: str) -> bool:
        try:
            name = Path(resolved).name.lower()
        except Exception:
            name = str(resolved).lower()
        return name.startswith("ffprobe")

    def _check_available(self) -> bool:
        """Check if ffprobe is available in PATH."""
        resolved = self._resolve_executable(self.bin)
        if not resolved:
            return False
        self._resolved_bin = resolved
        return True

    def is_available(self) -> bool:
        """Check if ffprobe is available."""
        return self._available

    def read(self, path: str) -> Result[dict]:
        """
        Read video metadata using ffprobe.

        Args:
            path: Video file path

        Returns:
            Result with metadata dict containing 'format' and 'streams'
        """
        if not self._available:
            return Result.Err(
                ErrorCode.TOOL_MISSING,
                "ffprobe not found in PATH",
                quality="none"
            )

        try:
            process = self._run_ffprobe_cmd(self._build_ffprobe_cmd(path))
            return self._parse_ffprobe_output(process.stdout, process.stderr, process.returncode, path)
        except subprocess.TimeoutExpired:
            return self._ffprobe_timeout_error(path)
        except json.JSONDecodeError as e:
            logger.error(f"ffprobe JSON parse error: {e}")
            return Result.Err(
                ErrorCode.PARSE_ERROR,
                f"Failed to parse ffprobe output: {e}",
                quality="degraded"
            )
        except Exception as e:
            logger.error(f"ffprobe unexpected error: {e}")
            return Result.Err(
                ErrorCode.FFPROBE_ERROR,
                str(e),
                quality="degraded"
            )

    def _run_ffprobe_cmd(self, cmd: List[str]) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=False,
            timeout=self.timeout,
            shell=False,
            close_fds=os.name != "nt",
        )

    def _ffprobe_timeout_error(self, path: str) -> Result[dict]:
        logger.error(f"ffprobe timeout for {path}")
        return Result.Err(
            ErrorCode.TIMEOUT,
            f"ffprobe timeout after {self.timeout}s",
            quality="degraded",
        )

    async def aread(self, path: str) -> Result[dict]:
        """
        Async variant of read() using native asyncio subprocess execution.
        """
        if not self._available:
            return Result.Err(
                ErrorCode.TOOL_MISSING,
                "ffprobe not found in PATH",
                quality="none"
            )

        try:
            cmd = self._build_ffprobe_cmd(path)
            process = await self._spawn_ffprobe_process(cmd)
            communicated = await self._communicate_with_timeout(process, path)
            if not communicated.ok:
                return Result.Err(
                    communicated.code or ErrorCode.FFPROBE_ERROR,
                    communicated.error or "ffprobe communication failed",
                    **(communicated.meta or {}),
                )
            data = communicated.data
            if not isinstance(data, tuple) or len(data) != 2:
                return Result.Err(ErrorCode.FFPROBE_ERROR, "Invalid ffprobe process output", quality="degraded")
            stdout, stderr = data
            return self._parse_ffprobe_output(stdout, stderr, process.returncode, path)
        except json.JSONDecodeError as e:
            logger.error(f"ffprobe JSON parse error: {e}")
            return Result.Err(
                ErrorCode.PARSE_ERROR,
                f"Failed to parse ffprobe output: {e}",
                quality="degraded"
            )
        except Exception as e:
            logger.error(f"ffprobe unexpected error: {e}")
            return Result.Err(
                ErrorCode.FFPROBE_ERROR,
                str(e),
                quality="degraded"
            )

    def _build_ffprobe_cmd(self, path: str) -> List[str]:
        return [
            self._resolved_bin or self.bin,
            "-v", "error",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            path,
        ]

    async def _spawn_ffprobe_process(self, cmd: List[str]) -> asyncio.subprocess.Process:
        return await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            close_fds=os.name != "nt",
        )

    async def _communicate_with_timeout(
        self,
        process: asyncio.subprocess.Process,
        path: str,
    ) -> Result[tuple[str, str]]:
        try:
            stdout_b, stderr_b = await asyncio.wait_for(process.communicate(), timeout=self.timeout)
        except asyncio.TimeoutError:
            try:
                process.kill()
            except Exception:
                pass
            logger.error(f"ffprobe timeout for {path}")
            return Result.Err(
                ErrorCode.TIMEOUT,
                f"ffprobe timeout after {self.timeout}s",
                quality="degraded"
            )
        stdout = (stdout_b or b"").decode("utf-8", errors="replace")
        stderr = (stderr_b or b"").decode("utf-8", errors="replace")
        return Result.Ok((stdout, stderr), quality="full")

    def _parse_ffprobe_output(
        self,
        stdout: str,
        stderr: str,
        returncode: Optional[int],
        path: str,
    ) -> Result[dict]:
        if returncode != 0:
            stderr_msg = stderr.strip()
            logger.warning(f"ffprobe error for {path}: {stderr_msg}")
            return Result.Err(
                ErrorCode.FFPROBE_ERROR,
                stderr_msg or "ffprobe command failed",
                quality="degraded"
            )
        if not stdout.strip():
            logger.warning(f"ffprobe returned empty output for {path}")
            return Result.Err(
                ErrorCode.FFPROBE_ERROR,
                "No ffprobe output",
                quality="degraded"
            )
        data = json.loads(stdout)
        if not isinstance(data, dict):
            return Result.Err(
                ErrorCode.PARSE_ERROR,
                "Invalid ffprobe output format",
                quality="degraded"
            )
        result = {
            "format": data.get("format", {}),
            "streams": data.get("streams", []),
            "video_stream": self._find_video_stream(data.get("streams", [])),
            "audio_stream": self._find_audio_stream(data.get("streams", [])),
        }
        return Result.Ok(result, quality="full")

    def read_batch(self, paths: List[str]) -> Dict[str, Result[dict]]:
        """
        Read metadata from multiple video files.

        Note: FFProbe doesn't have native batch mode, so we use concurrent.futures
        for parallel execution to avoid sequential subprocess overhead.

        Args:
            paths: List of video file paths

        Returns:
            Dict mapping file path to Result with metadata
        """
        if not self._available:
            err: Result[dict] = Result.Err(ErrorCode.TOOL_MISSING, "ffprobe not found in PATH", quality="none")
            return {str(p): err for p in paths}

        if not paths:
            return {}

        from concurrent.futures import ThreadPoolExecutor, as_completed
        results: Dict[str, Result[dict]] = {}

        # Use thread pool for parallel execution (I/O bound)
        max_workers = min(self._max_workers, len(paths))

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_path = {executor.submit(self.read, path): path for path in paths}

            for future in as_completed(future_to_path):
                path = future_to_path[future]
                try:
                    results[str(path)] = future.result()
                except Exception as e:
                    logger.error(f"FFProbe batch error for {path}: {e}")
                    results[str(path)] = Result.Err(ErrorCode.FFPROBE_ERROR, str(e), quality="degraded")

        return results

    async def aread_batch(self, paths: List[str]) -> Dict[str, Result[dict]]:
        """
        Async batch variant using bounded asyncio concurrency.
        """
        if not self._available:
            err: Result[dict] = Result.Err(ErrorCode.TOOL_MISSING, "ffprobe not found in PATH", quality="none")
            return {str(p): err for p in paths}
        if not paths:
            return {}

        max_workers = min(self._max_workers, len(paths))
        sem = asyncio.Semaphore(max_workers)
        results: Dict[str, Result[dict]] = {}

        async def _one(path: str):
            async with sem:
                try:
                    results[str(path)] = await self.aread(path)
                except Exception as e:
                    logger.error(f"FFProbe async batch error for {path}: {e}")
                    results[str(path)] = Result.Err(ErrorCode.FFPROBE_ERROR, str(e), quality="degraded")

        await asyncio.gather(*[_one(p) for p in paths])
        return results

    def _find_video_stream(self, streams: list) -> dict:
        """Find first video stream in streams list."""
        for stream in streams:
            if stream.get("codec_type") == "video":
                return stream
        return {}

    def _find_audio_stream(self, streams: list) -> dict:
        """Find first audio stream in streams list."""
        for stream in streams:
            if stream.get("codec_type") == "audio":
                return stream
        return {}

    def get_duration(self, path: str) -> Result[float]:
        """
        Get video duration in seconds.

        Args:
            path: Video file path

        Returns:
            Result with duration as float
        """
        result = self.read(path)
        if not result.ok:
            return Result.Err(result.code or ErrorCode.FFPROBE_ERROR, result.error or "ffprobe failed")

        # Try format duration first
        data = result.data if isinstance(result.data, dict) else {}
        format_info = data.get("format", {})
        duration_str = format_info.get("duration")

        if duration_str:
            try:
                return Result.Ok(float(duration_str))
            except ValueError:
                pass

        # Try video stream duration
        video_stream = data.get("video_stream", {})
        duration_str = video_stream.get("duration")

        if duration_str:
            try:
                return Result.Ok(float(duration_str))
            except ValueError:
                pass

        return Result.Err(
            ErrorCode.PARSE_ERROR,
            "Duration not found in video metadata"
        )

    def get_resolution(self, path: str) -> Result[tuple[int, int]]:
        """
        Get video resolution (width, height).

        Args:
            path: Video file path

        Returns:
            Result with (width, height) tuple
        """
        result = self.read(path)
        if not result.ok:
            return Result.Err(result.code or ErrorCode.FFPROBE_ERROR, result.error or "ffprobe failed")

        data = result.data if isinstance(result.data, dict) else {}
        video_stream = data.get("video_stream", {})
        width = video_stream.get("width")
        height = video_stream.get("height")

        if width and height:
            return Result.Ok((int(width), int(height)))

        return Result.Err(
            ErrorCode.PARSE_ERROR,
            "Resolution not found in video metadata"
        )
