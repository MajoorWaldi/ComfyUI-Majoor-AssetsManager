"""
ExifTool adapter for reading and writing metadata.
"""
import os
import asyncio
import subprocess
import json
import shutil
import re
from typing import Optional, List, Dict, Any, Tuple
from pathlib import Path

from ...config import EXIFTOOL_TIMEOUT
from ...shared import Result, ErrorCode, get_logger

logger = get_logger(__name__)

_TAG_SAFE_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_:-]*$")
_WINDOWS_CMDLINE_TOO_LONG = 206


def _decode_bytes_best_effort(blob: Optional[bytes]) -> Tuple[str, bool]:
    """
    Decode subprocess bytes robustly across Windows code pages.

    Returns:
      (text, had_replacement_chars)
    """
    if blob is None:
        return "", False
    if not isinstance(blob, (bytes, bytearray)):
        try:
            text = str(blob)
        except Exception:
            text = ""
        return text, ("\ufffd" in text)

    raw = bytes(blob)
    if not raw:
        return "", False

    # Preferred: UTF-8 strict (ExifTool JSON/output should be UTF-8 in our setup).
    for enc in ("utf-8", "utf-8-sig"):
        try:
            return raw.decode(enc, errors="strict"), False
        except UnicodeDecodeError:
            pass

    # Fallback for Windows environments where stderr/stdout may be emitted in local codepage.
    try:
        cp_text = raw.decode("cp1252", errors="strict")
        return cp_text, False
    except UnicodeDecodeError:
        pass

    utf_text = raw.decode("utf-8", errors="replace")
    had_rep = "\ufffd" in utf_text
    return utf_text, had_rep


def _is_safe_exiftool_tag(tag: str) -> bool:
    """
    Return True if a tag/key looks safe to pass to ExifTool as `-TAG` / `-TAG=...`.

    ExifTool tags commonly contain:
      - group separators: `XMP-xmp:Rating`
      - dashes and colons
      - underscores

    We disallow whitespace and other special characters to prevent passing
    unintended options or malformed arguments to ExifTool.
    """
    if not tag or not isinstance(tag, str):
        return False
    s = tag.strip()
    if not s:
        return False
    if "\x00" in s or "\n" in s or "\r" in s or "\t" in s:
        return False
    # Reject leading dash to avoid double-dash option style (- -something).
    if s.startswith("-"):
        return False
    return bool(_TAG_SAFE_PATTERN.match(s))


def _validate_exiftool_tags(tags: Optional[List[str]]) -> Result[List[str]]:
    """
    Validate a tag list and return a cleaned list, or Err on any invalid tags.

    Strict: invalid tags abort to avoid ambiguous or unsafe ExifTool invocations.
    """
    if tags is None:
        return Result.Ok([])
    if not isinstance(tags, list):
        return Result.Err(ErrorCode.INVALID_INPUT, "tags must be a list", quality="none")

    cleaned: List[str] = []
    invalid: List[str] = []
    for t in tags:
        if not isinstance(t, str):
            invalid.append(str(t))
            continue
        s = t.strip()
        if not _is_safe_exiftool_tag(s):
            invalid.append(s)
            continue
        cleaned.append(s)

    if invalid:
        return Result.Err(
            ErrorCode.INVALID_INPUT,
            "Invalid ExifTool tag format",
            invalid_tags=invalid,
            quality="none",
        )
    return Result.Ok(cleaned)


def _normalize_match_path(path_value: str) -> Optional[str]:
    """
    Normalize a filesystem path string for robust equality matching.

    ExifTool's `SourceFile` may differ from input paths by:
    - path separators
    - drive letter / case (Windows)
    - relative vs absolute forms
    """
    if not path_value or "\x00" in str(path_value):
        return None
    try:
        p = Path(str(path_value)).expanduser()
        # Use strict=False so a best-effort normalization still works even if ExifTool
        # returns a path format that isn't directly resolvable in the current context.
        resolved = p.resolve(strict=False)
        return os.path.normcase(os.path.normpath(str(resolved)))
    except Exception:
        try:
            return os.path.normcase(os.path.normpath(str(path_value)))
        except Exception:
            return None


def _build_match_map(valid_paths: List[str]) -> Tuple[Dict[str, List[str]], List[str]]:
    """
    Build:
    - a map from normalized path key -> list of original input paths to fill
    - a de-duplicated list of command paths (first occurrence per key)
    """
    key_to_paths: Dict[str, List[str]] = {}
    cmd_paths: List[str] = []

    for original in valid_paths:
        key = _normalize_match_path(original) or str(original)
        if key not in key_to_paths:
            key_to_paths[key] = []
            cmd_paths.append(original)
        key_to_paths[key].append(original)

    return key_to_paths, cmd_paths


class ExifTool:
    """
    ExifTool wrapper for metadata operations.

    Never raises exceptions - always returns Result.
    """

    def __init__(self, bin_name: str = "exiftool", timeout: Optional[float] = None):
        """
        Initialize ExifTool adapter.

        Args:
            bin_name: ExifTool binary name or path
            timeout: Command timeout in seconds
        """
        self.bin = bin_name
        self.timeout = float(timeout) if timeout is not None else float(EXIFTOOL_TIMEOUT)
        self._available = self._check_available()

    def _resolve_executable(self, bin_name: str) -> Optional[str]:
        """
        Resolve and validate the exiftool executable.

        This defends against untrusted configuration values and ensures we're
        invoking an actual exiftool binary (not an arbitrary command string).
        """
        raw = (bin_name or "").strip()
        if not self._is_safe_executable_name(raw):
            return None
        resolved = self._resolve_executable_path(raw)
        if not resolved:
            return None
        if not self._is_under_trusted_dirs(resolved):
            return None
        return resolved if self._looks_like_exiftool_name(resolved) else None

    @staticmethod
    def _is_safe_executable_name(raw: str) -> bool:
        if not raw:
            return False
        if "\x00" in raw or "\n" in raw or "\r" in raw:
            return False
        return not any(ch in raw for ch in ("&", "|", ";", ">", "<"))

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
    def _is_under_trusted_dirs(resolved: str) -> bool:
        trusted_dirs_raw = str(os.getenv("MAJOOR_EXIFTOOL_TRUSTED_DIRS", "") or "").strip()
        if not trusted_dirs_raw:
            return True
        try:
            resolved_path = Path(resolved).resolve(strict=True)
            trusted_roots = ExifTool._trusted_roots(trusted_dirs_raw)
            if not trusted_roots:
                return True
            return any(resolved_path == root or root in resolved_path.parents for root in trusted_roots)
        except Exception:
            return False

    @staticmethod
    def _trusted_roots(trusted_dirs_raw: str) -> List[Path]:
        roots: List[Path] = []
        for item in trusted_dirs_raw.split(os.pathsep):
            item = item.strip()
            if not item:
                continue
            try:
                roots.append(Path(item).expanduser().resolve(strict=True))
            except Exception:
                continue
        return roots

    @staticmethod
    def _looks_like_exiftool_name(resolved: str) -> bool:
        try:
            name = Path(resolved).name.lower()
        except Exception:
            name = str(resolved).lower()
        return name.startswith("exiftool")

    def _check_available(self) -> bool:
        """Check if ExifTool is available in PATH."""
        resolved = self._resolve_executable(self.bin)
        if not resolved:
            return False
        self.bin = resolved
        return True

    def is_available(self) -> bool:
        """Check if ExifTool is available."""
        return self._available

    @staticmethod
    def _assign_result_for_paths(
        paths: List[str],
        results: Dict[str, Result[Dict[str, Any]]],
        value: Result[Dict[str, Any]],
        *,
        only_missing: bool = False,
    ) -> None:
        for path in paths:
            if only_missing and path in results:
                continue
            results[path] = value

    @staticmethod
    def _collect_valid_batch_paths(
        paths: List[str],
    ) -> Tuple[List[str], Dict[str, Result[Dict[str, Any]]]]:
        valid_paths: List[str] = []
        results: Dict[str, Result[Dict[str, Any]]] = {}
        for path in paths:
            if not path or "\x00" in str(path):
                results[str(path)] = Result.Err(
                    ErrorCode.INVALID_INPUT, "Invalid file path", quality="none"
                )
                continue
            try:
                p = Path(str(path))
                if not p.exists() or not p.is_file():
                    results[str(path)] = Result.Err(
                        ErrorCode.NOT_FOUND, f"File not found: {path}", quality="none"
                    )
                    continue
                valid_paths.append(str(path))
            except Exception:
                results[str(path)] = Result.Err(
                    ErrorCode.INVALID_INPUT, "Invalid file path", quality="none"
                )
        return valid_paths, results

    def _validate_batch_tags(
        self,
        tags: Optional[List[str]],
        valid_paths: List[str],
        results: Dict[str, Result[Dict[str, Any]]],
    ) -> Optional[List[str]]:
        tags_res = _validate_exiftool_tags(tags)
        if tags_res.ok:
            return tags_res.data or []
        err: Result[Dict[str, Any]] = Result.Err(tags_res.code, tags_res.error or "Invalid tags", **(tags_res.meta or {}))
        self._assign_result_for_paths(valid_paths, results, err)
        return None

    def _build_batch_command(
        self,
        cmd_paths: List[str],
        safe_tags: List[str],
    ) -> Tuple[List[str], Optional[bytes], float]:
        cmd = [self.bin, "-j", "-G1", "-ee", "-a", "-U", "-s"]
        if safe_tags:
            cmd.extend([f"-{tag}" for tag in safe_tags])

        stdin_input: Optional[bytes] = None
        if os.name == "nt":
            cmd.extend(["-charset", "filename=utf8", "-@", "-"])
            stdin_lines = "".join(f"{p}\r\n" for p in cmd_paths)
            stdin_input = stdin_lines.encode("utf-8", errors="replace")
        else:
            cmd.extend(cmd_paths)

        timeout_s = self.timeout * len(cmd_paths)
        return cmd, stdin_input, timeout_s

    @staticmethod
    def _run_batch_subprocess(
        cmd: List[str],
        timeout_s: float,
        stdin_input: Optional[bytes],
    ) -> subprocess.CompletedProcess:
        return subprocess.run(
            cmd,
            capture_output=True,
            text=False,
            check=False,
            timeout=timeout_s,
            input=stdin_input,
            shell=False,
        )

    def _retry_windows_batch_file_not_found(
        self,
        process: subprocess.CompletedProcess,
        safe_tags: List[str],
        cmd_paths: List[str],
        timeout_s: float,
    ) -> subprocess.CompletedProcess:
        if os.name != "nt" or process.returncode == 0:
            return process
        stderr0, _ = _decode_bytes_best_effort(process.stderr)
        if "file not found" not in (stderr0 or "").lower():
            return process

        retry_cmd = [self.bin, "-j", "-G1", "-ee", "-a", "-U", "-s"]
        if safe_tags:
            retry_cmd.extend([f"-{tag}" for tag in safe_tags])
        retry_cmd.extend(["-charset", "filename=utf8", "-@", "-"])
        stdin_lines = "".join(f"{p}\r\n" for p in cmd_paths)
        retry_process = self._run_batch_subprocess(
            retry_cmd,
            timeout_s,
            stdin_lines.encode("utf-8", errors="replace"),
        )
        if retry_process.returncode == 0:
            return retry_process
        return process

    def _parse_batch_output(
        self,
        process: subprocess.CompletedProcess,
        valid_paths: List[str],
        results: Dict[str, Result[Dict[str, Any]]],
    ) -> Tuple[Optional[List[Dict[str, Any]]], bool]:
        stdout, stdout_rep = _decode_bytes_best_effort(process.stdout)
        stderr, stderr_rep = _decode_bytes_best_effort(process.stderr)
        had_replacements = bool(stdout_rep or stderr_rep)

        if had_replacements:
            logger.warning("ExifTool batch output contained decoding replacement characters")

        if process.returncode != 0:
            stderr_msg = stderr.strip()
            logger.warning(f"ExifTool batch error: {stderr_msg}")

        if not stdout.strip():
            if process.returncode != 0:
                err_result: Result[Dict[str, Any]] = Result.Err(
                    ErrorCode.EXIFTOOL_ERROR,
                    (stderr.strip() or f"ExifTool batch failed with return code {int(process.returncode)}"),
                    return_code=int(process.returncode),
                    quality="degraded",
                )
            else:
                err_result = Result.Err(
                    ErrorCode.PARSE_ERROR,
                    "ExifTool returned empty output",
                    quality="degraded",
                )
            self._assign_result_for_paths(valid_paths, results, err_result)
            return None, had_replacements

        try:
            data = json.loads(stdout)
        except json.JSONDecodeError as e:
            logger.error(f"ExifTool batch JSON parse error: {e}")
            err_result = Result.Err(
                ErrorCode.PARSE_ERROR,
                f"Failed to parse ExifTool output: {e}",
                quality="degraded",
            )
            self._assign_result_for_paths(valid_paths, results, err_result)
            return None, had_replacements

        if not isinstance(data, list):
            err_result = Result.Err(
                ErrorCode.PARSE_ERROR, "ExifTool batch returned non-list", quality="degraded"
            )
            self._assign_result_for_paths(valid_paths, results, err_result)
            return None, had_replacements
        return data, had_replacements

    @staticmethod
    def _map_batch_results(
        data: List[Dict[str, Any]],
        key_to_paths: Dict[str, List[str]],
        results: Dict[str, Result[Dict[str, Any]]],
        *,
        had_replacements: bool,
    ) -> None:
        for file_data in data:
            if not isinstance(file_data, dict):
                logger.warning(f"ExifTool batch returned non-dict item: {type(file_data)}")
                continue

            source_file = file_data.get("SourceFile")
            if not source_file:
                logger.warning("ExifTool result missing SourceFile field")
                continue

            source_key = _normalize_match_path(str(source_file))
            if not source_key:
                logger.warning(f"Failed to normalize SourceFile path {source_file}")
                continue

            matched_paths = key_to_paths.get(source_key)
            if matched_paths:
                for path in matched_paths:
                    results[path] = Result.Ok(
                        file_data,
                        quality="full" if not had_replacements else "degraded",
                    )
            else:
                logger.warning(f"ExifTool returned data for unexpected file: {source_file}")

    @staticmethod
    def _fill_missing_batch_results(
        valid_paths: List[str],
        results: Dict[str, Result[Dict[str, Any]]],
    ) -> None:
        for path in valid_paths:
            if path in results:
                continue
            results[path] = Result.Err(
                ErrorCode.PARSE_ERROR,
                "No metadata returned by ExifTool",
                quality="none",
            )

    def _handle_batch_exception(
        self,
        exc: Exception,
        valid_paths: List[str],
        results: Dict[str, Result[Dict[str, Any]]],
        safe_tags: List[str],
    ) -> Dict[str, Result[Dict[str, Any]]]:
        if getattr(exc, "winerror", None) == _WINDOWS_CMDLINE_TOO_LONG:
            logger.warning(
                "ExifTool batch hit WinError 206; falling back to per-file extraction for %d files",
                len(valid_paths),
            )
            for path in valid_paths:
                if path in results:
                    continue
                results[path] = self.read(path, safe_tags)
            return results

        logger.error(f"ExifTool batch unexpected error: {exc}")
        err: Result[Dict[str, Any]] = Result.Err(ErrorCode.EXIFTOOL_ERROR, str(exc), quality="degraded")
        self._assign_result_for_paths(valid_paths, results, err, only_missing=True)
        return results

    @staticmethod
    def _validate_single_read_path(path: str) -> Result[str]:
        if not path or "\x00" in str(path):
            return Result.Err(ErrorCode.INVALID_INPUT, "Invalid file path", quality="none")
        try:
            p = Path(str(path))
        except Exception:
            return Result.Err(ErrorCode.INVALID_INPUT, "Invalid file path", quality="none")
        if not p.exists() or not p.is_file():
            return Result.Err(ErrorCode.NOT_FOUND, f"File not found: {path}", quality="none")
        return Result.Ok(str(path))

    @staticmethod
    def _validate_single_read_tags(tags: Optional[List[str]]) -> Result[List[str]]:
        tags_res = _validate_exiftool_tags(tags)
        if tags_res.ok:
            return Result.Ok(tags_res.data or [])
        return Result.Err(tags_res.code, tags_res.error or "Invalid tags", **(tags_res.meta or {}))

    @staticmethod
    def _run_exiftool_process(
        cmd: List[str],
        *,
        timeout: float,
        stdin_input: Optional[str] = None,
    ) -> subprocess.CompletedProcess:
        stdin_bytes: Optional[bytes]
        if stdin_input is None:
            stdin_bytes = None
        else:
            stdin_bytes = str(stdin_input).encode("utf-8", errors="replace")
        return subprocess.run(
            cmd,
            capture_output=True,
            text=False,
            check=False,
            timeout=timeout,
            input=stdin_bytes,
            shell=False,
        )

    def _build_single_read_command(
        self,
        path: str,
        safe_tags: List[str],
    ) -> Tuple[List[str], Optional[str]]:
        cmd = [self.bin, "-j", "-G1", "-ee", "-a", "-U", "-s"]
        if safe_tags:
            cmd.extend([f"-{tag}" for tag in safe_tags])
        if os.name == "nt":
            cmd.extend(["-charset", "filename=utf8", str(path)])
            return cmd, None
        cmd.append(path)
        return cmd, None

    def _retry_windows_single_read_file_not_found(
        self,
        process: subprocess.CompletedProcess,
        path: str,
        safe_tags: List[str],
    ) -> subprocess.CompletedProcess:
        if os.name != "nt" or process.returncode == 0:
            return process
        stderr_msg, _ = _decode_bytes_best_effort(process.stderr)
        stderr_msg = stderr_msg.strip()
        if "file not found" not in stderr_msg.lower():
            return process

        retry_cmd = [self.bin, "-j", "-G1", "-ee", "-a", "-U", "-s"]
        if safe_tags:
            retry_cmd.extend([f"-{tag}" for tag in safe_tags])
        retry_cmd.extend(["-charset", "filename=utf8", "-@", "-"])
        retry_process = self._run_exiftool_process(
            retry_cmd,
            timeout=self.timeout,
            stdin_input=f"{path}\r\n",
        )
        if retry_process.returncode == 0:
            return retry_process
        return process

    @staticmethod
    def _parse_single_read_process(
        process: subprocess.CompletedProcess,
        path: str,
    ) -> Result[Dict[str, Any]]:
        stdout, stdout_rep = _decode_bytes_best_effort(process.stdout)
        stderr, stderr_rep = _decode_bytes_best_effort(process.stderr)
        had_replacements = bool(stdout_rep or stderr_rep)
        if had_replacements:
            logger.warning("ExifTool output contained decoding replacement characters for %s", path)

        if process.returncode != 0:
            stderr_msg = stderr.strip()
            logger.warning(f"ExifTool error for {path}: {stderr_msg}")
            return Result.Err(
                ErrorCode.EXIFTOOL_ERROR,
                stderr_msg or "ExifTool command failed",
                return_code=int(process.returncode),
                quality="degraded",
            )

        if not stdout.strip():
            return Result.Err(
                ErrorCode.PARSE_ERROR,
                "ExifTool returned empty output",
                quality="degraded",
            )
        try:
            data = json.loads(stdout)
        except json.JSONDecodeError as exc:
            logger.error(f"ExifTool JSON parse error: {exc}")
            return Result.Err(
                ErrorCode.PARSE_ERROR,
                f"Failed to parse ExifTool output: {exc}",
                quality="degraded",
            )
        if isinstance(data, list) and len(data) > 0:
            return Result.Ok(data[0], quality="full" if not had_replacements else "degraded")
        return Result.Err(
            ErrorCode.PARSE_ERROR,
            "No metadata found",
            quality="none",
        )

    def read(self, path: str, tags: Optional[List[str]] = None) -> Result[Dict[str, Any]]:
        """
        Read metadata from file using ExifTool.

        Args:
            path: File path
            tags: Optional list of specific tags to read

        Returns:
            Result with metadata dict or error
        """
        safe_tags_or_error = self._prepare_single_read_inputs(path, tags)
        if isinstance(safe_tags_or_error, Result):
            return safe_tags_or_error
        safe_tags = safe_tags_or_error

        try:
            process = self._run_single_read_process(path, safe_tags)
            return self._parse_single_read_process(process, path)
        except subprocess.TimeoutExpired:
            logger.error(f"ExifTool timeout for {path}")
            return Result.Err(
                ErrorCode.TIMEOUT,
                f"ExifTool timeout after {self.timeout}s",
                quality="degraded"
            )
        except json.JSONDecodeError as e:
            logger.error(f"ExifTool JSON parse error: {e}")
            return Result.Err(
                ErrorCode.PARSE_ERROR,
                f"Failed to parse ExifTool output: {e}",
                quality="degraded"
            )
        except Exception as e:
            logger.error(f"ExifTool unexpected error: {e}")
            return Result.Err(
                ErrorCode.EXIFTOOL_ERROR,
                str(e),
                quality="degraded"
            )

    def _prepare_single_read_inputs(
        self,
        path: str,
        tags: Optional[List[str]],
    ) -> Result[Dict[str, Any]] | List[str]:
        availability_error = self._single_read_availability_error()
        if availability_error is not None:
            return availability_error
        path_res = self._validate_single_read_path(path)
        if not path_res.ok:
            return Result.Err(path_res.code, path_res.error or "Invalid file path", **(path_res.meta or {}))
        tags_res = self._validate_single_read_tags(tags)
        if not tags_res.ok:
            return Result.Err(tags_res.code, tags_res.error or "Invalid tags", **(tags_res.meta or {}))
        return tags_res.data or []

    def _single_read_availability_error(self) -> Optional[Result[Dict[str, Any]]]:
        if self._available:
            return None
        return Result.Err(
            ErrorCode.TOOL_MISSING,
            "ExifTool not found in PATH",
            quality="none"
        )

    def _run_single_read_process(
        self,
        path: str,
        safe_tags: List[str],
    ) -> subprocess.CompletedProcess:
        cmd, stdin_input = self._build_single_read_command(path, safe_tags)
        process = self._run_exiftool_process(
            cmd,
            timeout=self.timeout,
            stdin_input=stdin_input,
        )
        return self._retry_windows_single_read_file_not_found(process, path, safe_tags)

    def read_batch(self, paths: List[str], tags: Optional[List[str]] = None) -> Dict[str, Result[Dict[str, Any]]]:
        """
        Read metadata from multiple files using a single ExifTool invocation.

        This is dramatically faster than calling read() per file due to subprocess overhead.

        Args:
            paths: List of file paths
            tags: Optional list of specific tags to read

        Returns:
            Dict mapping file path to Result with metadata
        """
        if not self._available:
            err: Result[Dict[str, Any]] = Result.Err(
                ErrorCode.TOOL_MISSING, "ExifTool not found in PATH", quality="none"
            )
            return {str(p): err for p in paths}

        if not paths:
            return {}

        valid_paths, results = self._collect_valid_batch_paths(paths)
        if not valid_paths:
            return results

        safe_tags = self._validate_batch_tags(tags, valid_paths, results)
        if safe_tags is None:
            return results

        key_to_paths, cmd_paths = _build_match_map(valid_paths)

        try:
            cmd, stdin_input, timeout_s = self._build_batch_command(cmd_paths, safe_tags)
            process = self._run_batch_subprocess(cmd, timeout_s, stdin_input)
            process = self._retry_windows_batch_file_not_found(process, safe_tags, cmd_paths, timeout_s)
            data, had_replacements = self._parse_batch_output(process, valid_paths, results)
            if data is None:
                return results
            self._map_batch_results(data, key_to_paths, results, had_replacements=had_replacements)
            self._fill_missing_batch_results(valid_paths, results)
            return results

        except subprocess.TimeoutExpired:
            logger.error(f"ExifTool batch timeout for {len(valid_paths)} files")
            err = Result.Err(ErrorCode.TIMEOUT, "ExifTool batch timeout", quality="degraded")
            self._assign_result_for_paths(valid_paths, results, err, only_missing=True)
            return results
        except Exception as e:
            return self._handle_batch_exception(e, valid_paths, results, safe_tags)

    def write(self, path: str, metadata: dict, preserve_workflow: bool = True) -> Result[bool]:
        """
        Write metadata to file using ExifTool.

        Args:
            path: File path
            metadata: Metadata key-value pairs to write
            preserve_workflow: Copy original metadata fields before writing

        Returns:
            Result with success boolean
        """
        availability_error = self._validate_write_preconditions(path)
        if availability_error is not None:
            return availability_error

        invalid_keys = self._invalid_write_keys(metadata)
        if invalid_keys:
            return Result.Err(
                ErrorCode.INVALID_INPUT,
                "Invalid ExifTool tag format",
                invalid_tags=invalid_keys,
            )

        cmd, stdin_input = self._build_write_command(path, metadata, preserve_workflow)
        try:
            process = self._run_write_command(cmd, stdin_input)
            return self._handle_write_process_result(process, path)

        except subprocess.TimeoutExpired:
            logger.error(f"ExifTool write timeout for {path}")
            return Result.Err(
                ErrorCode.TIMEOUT,
                f"ExifTool write timeout after {self.timeout}s"
            )
        except Exception as e:
            logger.error(f"ExifTool write error: {e}")
            return Result.Err(
                ErrorCode.EXIFTOOL_ERROR,
                str(e)
            )

    def _validate_write_preconditions(self, path: str) -> Optional[Result[bool]]:
        if not self._available:
            return Result.Err(ErrorCode.TOOL_MISSING, "ExifTool not found in PATH")
        if not path or "\x00" in str(path):
            return Result.Err(ErrorCode.INVALID_INPUT, "Invalid file path")
        try:
            file_path = Path(str(path))
        except Exception:
            return Result.Err(ErrorCode.INVALID_INPUT, "Invalid file path")
        if not file_path.exists() or not file_path.is_file():
            return Result.Err(ErrorCode.NOT_FOUND, f"File not found: {path}")
        return None

    @staticmethod
    def _invalid_write_keys(metadata: dict) -> List[str]:
        invalid_keys: List[str] = []
        for key in (metadata or {}).keys():
            if not isinstance(key, str):
                invalid_keys.append(str(key))
                continue
            if not _is_safe_exiftool_tag(key.strip()):
                invalid_keys.append(key.strip())
        return invalid_keys

    def _build_write_command(self, path: str, metadata: dict, preserve_workflow: bool) -> tuple[List[str], Optional[str]]:
        cmd = [self.bin]
        if preserve_workflow:
            cmd.extend(["-tagsFromFile", "@"])
        self._append_metadata_write_args(cmd, metadata)
        return self._append_write_target_args(cmd, path)

    @staticmethod
    def _append_metadata_write_args(cmd: List[str], metadata: dict) -> None:
        for key, value in (metadata or {}).items():
            if value is None:
                cmd.append(f"-{key}=")
                continue
            if isinstance(value, list):
                cmd.append(f"-{key}=")
                for item in value:
                    if item is None:
                        continue
                    text = str(item).strip()
                    if text:
                        cmd.append(f"-{key}+={text}")
                continue
            cmd.append(f"-{key}={value}")

    @staticmethod
    def _append_write_target_args(cmd: List[str], path: str) -> tuple[List[str], Optional[str]]:
        stdin_input: Optional[str] = None
        if os.name == "nt":
            cmd.extend(["-charset", "filename=utf8", "-@", "-"])
            stdin_input = f"{path}\n"
            cmd.append("-overwrite_original")
        else:
            cmd.extend(["-overwrite_original", path])
        return cmd, stdin_input

    def _run_write_command(self, cmd: List[str], stdin_input: Optional[str]):
        return subprocess.run(
            cmd,
            capture_output=True,
            text=False,
            check=False,
            timeout=self.timeout,
            input=(stdin_input.encode("utf-8", errors="replace") if stdin_input is not None else None),
            shell=False,
        )

    def _handle_write_process_result(self, process: subprocess.CompletedProcess, path: str) -> Result[bool]:
        stdout, stdout_rep = _decode_bytes_best_effort(process.stdout)
        stderr, stderr_rep = _decode_bytes_best_effort(process.stderr)
        if stdout_rep or stderr_rep:
            logger.warning("ExifTool write output contained decoding replacement characters for %s", path)
        if process.returncode != 0:
            stderr_msg = stderr.strip()
            logger.warning(f"ExifTool write error for {path}: {stderr_msg}")
            return Result.Err(
                ErrorCode.EXIFTOOL_ERROR,
                stderr_msg or "ExifTool write failed",
                return_code=int(process.returncode),
            )
        logger.debug(f"Metadata written to {path}")
        return Result.Ok(True)

    async def aread(self, path: str, tags: Optional[List[str]] = None) -> Result[Dict[str, Any]]:
        """Async wrapper for read() executed off the event loop thread."""
        return await asyncio.to_thread(self.read, path, tags)

    async def aread_batch(
        self, paths: List[str], tags: Optional[List[str]] = None
    ) -> Dict[str, Result[Dict[str, Any]]]:
        """Async wrapper for read_batch() executed off the event loop thread."""
        return await asyncio.to_thread(self.read_batch, paths, tags)

    async def awrite(self, path: str, metadata: dict, preserve_workflow: bool = True) -> Result[bool]:
        """Async wrapper for write() executed off the event loop thread."""
        return await asyncio.to_thread(self.write, path, metadata, preserve_workflow)
