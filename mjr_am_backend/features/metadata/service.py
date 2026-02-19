"""
Metadata service - coordinates metadata extraction from multiple sources.
"""
import asyncio
import logging
import os
import time
import functools
from typing import Dict, Any, Optional, Callable, Awaitable

from ...shared import Result, ErrorCode, get_logger, classify_file, log_structured
from ...config import METADATA_EXTRACT_CONCURRENCY
from ...adapters.tools import ExifTool, FFProbe
from ...settings import AppSettings
from ...probe_router import pick_probe_backend
from .extractors import (
    extract_png_metadata,
    extract_webp_metadata,
    extract_video_metadata,
    extract_rating_tags_from_exif,
)
from .fallback_readers import read_image_exif_like, read_media_probe_like
from ..audio import extract_audio_metadata
from ..geninfo.parser import parse_geninfo_from_prompt
from .parsing_utils import parse_auto1111_params

logger = get_logger(__name__)
_METADATA_TRANSIENT_RETRY_ATTEMPTS = 3
_METADATA_TRANSIENT_RETRY_BASE_DELAY_S = 0.15
_TRANSIENT_ERROR_HINTS = (
    "in use",
    "used by another process",
    "sharing violation",
    "permission denied",
    "resource busy",
    "temporarily unavailable",
    "cannot open",
    "i/o error",
    "input/output error",
    "file not found",
)


def _clean_model_name(value: Any) -> Optional[str]:
    if value is None:
        return None
    s = str(value).strip()
    if not s:
        return None
    s = s.replace("\\", "/").split("/")[-1]
    lower = s.lower()
    for ext in (".safetensors", ".ckpt", ".pt", ".pth", ".bin", ".gguf", ".json"):
        if lower.endswith(ext):
            return s[: -len(ext)]
    return s


def _build_geninfo_from_parameters(meta: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Build a backend `geninfo` object from explicit A1111/Forge-style parameters data.

    Accuracy-first (no guessing): only uses fields already parsed by the extractor.
    """
    if not isinstance(meta, dict):
        return None

    parsed_meta = _merge_parsed_params(meta)
    pos = parsed_meta.get("prompt")
    neg = parsed_meta.get("negative_prompt")
    steps = parsed_meta.get("steps")
    sampler = parsed_meta.get("sampler")
    scheduler = parsed_meta.get("scheduler")
    cfg = parsed_meta.get("cfg")
    seed = parsed_meta.get("seed")
    w = parsed_meta.get("width")
    h = parsed_meta.get("height")
    model = parsed_meta.get("model")

    has_any = _has_any_parameter_signal(pos, neg, steps, sampler, cfg, seed, w, h, model)
    if not has_any:
        # Return an empty dict instead of None to ensure geninfo is always a dict
        return {}

    out: Dict[str, Any] = {"engine": {"parser_version": "geninfo-params-v1", "source": "parameters"}}

    _apply_prompt_fields(out, pos, neg)
    _apply_sampler_fields(out, sampler, scheduler)
    _apply_numeric_fields(out, steps, cfg, seed)
    _apply_size_field(out, w, h)
    _apply_checkpoint_fields(out, model)

    return out if len(out.keys()) > 1 else None


def _merge_parsed_params(meta: Dict[str, Any]) -> Dict[str, Any]:
    parsed_meta = dict(meta)
    params_text = parsed_meta.get("parameters")
    if not isinstance(params_text, str) or not params_text.strip():
        return parsed_meta
    parsed_params = parse_auto1111_params(params_text)
    if parsed_params:
        if logger.isEnabledFor(logging.DEBUG):
            logger.debug(
                "Parsed PNG:Parameters for geninfo fallback (%s keys)",
                ", ".join(sorted(parsed_params.keys())),
            )
        for key, value in parsed_params.items():
            if value is not None:
                parsed_meta[key] = value
        return parsed_meta
    if logger.isEnabledFor(logging.DEBUG):
        logger.debug("Auto1111 parameter parser returned no fields for provided PNG:Parameters text.")
    return parsed_meta


def _has_any_parameter_signal(*values: Any) -> bool:
    return any(value is not None and value != "" for value in values)


def _apply_prompt_fields(out: Dict[str, Any], pos: Any, neg: Any) -> None:
    if isinstance(pos, str) and pos.strip():
        out["positive"] = {"value": pos.strip(), "confidence": "high", "source": "parameters"}
    if isinstance(neg, str) and neg.strip():
        out["negative"] = {"value": neg.strip(), "confidence": "high", "source": "parameters"}


def _apply_sampler_fields(out: Dict[str, Any], sampler: Any, scheduler: Any) -> None:
    if sampler is not None:
        out["sampler"] = {"name": str(sampler), "confidence": "high", "source": "parameters"}
    if scheduler is not None:
        out["scheduler"] = {"name": str(scheduler), "confidence": "high", "source": "parameters"}


def _apply_numeric_fields(out: Dict[str, Any], steps: Any, cfg: Any, seed: Any) -> None:
    _set_numeric_field(out, "steps", steps, int)
    _set_numeric_field(out, "cfg", cfg, float)
    _set_numeric_field(out, "seed", seed, int)


def _set_numeric_field(out: Dict[str, Any], key: str, value: Any, caster: Callable[[Any], Any]) -> None:
    if value is None:
        return
    try:
        out[key] = {"value": caster(value), "confidence": "high", "source": "parameters"}
    except Exception:
        return


def _apply_size_field(out: Dict[str, Any], width: Any, height: Any) -> None:
    if width is None or height is None:
        return
    try:
        out["size"] = {"width": int(width), "height": int(height), "confidence": "high", "source": "parameters"}
    except Exception:
        return


def _apply_checkpoint_fields(out: Dict[str, Any], model: Any) -> None:
    ckpt = _clean_model_name(model)
    if not ckpt:
        return
    out["checkpoint"] = {"name": ckpt, "confidence": "high", "source": "parameters"}
    out["models"] = {"checkpoint": out["checkpoint"]}


def _looks_like_media_pipeline(prompt_graph: Any) -> bool:
    """
    Detect "media-only" graphs (load video -> combine/save) that do not represent generation.

    Used to avoid marking such assets as having generation data.
    """
    if not isinstance(prompt_graph, dict) or not prompt_graph:
        return False
    try:
        types = _collect_prompt_graph_types(prompt_graph)
        if not types:
            return False

        if _has_generation_sampler(types):
            return False

        has_load, has_combine, has_save = _classify_media_nodes(types)
        return has_load and (has_combine or has_save)
    except Exception:
        return False


def _collect_prompt_graph_types(prompt_graph: Dict[str, Any]) -> list[str]:
    types: list[str] = []
    for node in prompt_graph.values():
        if not isinstance(node, dict):
            continue
        ct = str(node.get("class_type") or node.get("type") or "").lower()
        if ct:
            types.append(ct)
    return types


def _has_generation_sampler(types: list[str]) -> bool:
    if any(("ksampler" in token and "select" not in token) or ("samplercustom" in token) for token in types):
        return True
    return any("sampler" in token and "select" not in token for token in types)


def _classify_media_nodes(types: list[str]) -> tuple[bool, bool, bool]:
    has_load = any("loadvideo" in token or "vhs_loadvideo" in token for token in types)
    has_combine = any("videocombine" in token or "video_combine" in token or "vhs_videocombine" in token for token in types)
    has_save = any(
        token.startswith("save") or "savevideo" in token or "savegif" in token or "saveanimatedwebp" in token
        for token in types
    )
    return has_load, has_combine, has_save


def _should_parse_geninfo(meta: Dict[str, Any]) -> bool:
    """
    Fast gate to avoid expensive geninfo parsing when generation signals are absent.
    """
    try:
        if not isinstance(meta, dict):
            return False
        prompt = meta.get("prompt")
        workflow = meta.get("workflow")
        if isinstance(prompt, dict) and prompt:
            return True
        if isinstance(workflow, dict) and workflow:
            return True
        params = meta.get("parameters")
        if isinstance(params, str) and params.strip():
            return True
    except Exception:
        return False
    return False


def _group_existing_paths(paths: list[str]) -> tuple[list[str], list[str], list[str], list[str]]:
    images: list[str] = []
    videos: list[str] = []
    audios: list[str] = []
    others: list[str] = []
    for path in paths:
        if not os.path.exists(path):
            continue
        kind = classify_file(path)
        if kind == "image":
            images.append(path)
        elif kind == "video":
            videos.append(path)
        elif kind == "audio":
            audios.append(path)
        else:
            others.append(path)
    return images, videos, audios, others


def _build_batch_probe_targets(paths: list[str], probe_mode: str) -> tuple[list[str], list[str]]:
    exif_targets: list[str] = []
    ffprobe_targets: list[str] = []
    seen_exif: set[str] = set()
    seen_ffprobe: set[str] = set()
    for path in paths:
        backends = pick_probe_backend(path, settings_override=probe_mode)
        if "exiftool" in backends and path not in seen_exif:
            seen_exif.add(path)
            exif_targets.append(path)
        if "ffprobe" in backends and path not in seen_ffprobe:
            seen_ffprobe.add(path)
            ffprobe_targets.append(path)
    return exif_targets, ffprobe_targets


def _batch_tool_data(
    result_map: Dict[str, Result[Dict[str, Any]]],
    path: str,
) -> Optional[Dict[str, Any]]:
    item = result_map.get(path)
    return item.data if item and item.ok else None


def _expand_resolution_scalars(payload: Dict[str, Any]) -> None:
    resolution = payload.get("resolution")
    if not resolution:
        return
    if payload.get("width") is not None and payload.get("height") is not None:
        return
    dims = _coerce_resolution_pair(resolution)
    if dims is None:
        return
    w, h = dims
    if payload.get("width") is None:
        payload["width"] = _coerce_dimension_value(w)
    if payload.get("height") is None:
        payload["height"] = _coerce_dimension_value(h)


def _coerce_resolution_pair(resolution: Any) -> Optional[tuple[Any, Any]]:
    try:
        w, h = resolution
        return w, h
    except Exception:
        return None


def _coerce_dimension_value(value: Any) -> Any:
    try:
        return int(value) if value is not None else None
    except Exception:
        return value

class MetadataService:
    """
    Metadata extraction service.

    Orchestrates extraction from multiple tools (ExifTool, FFProbe)
    and file-specific extractors.
    """

    def __init__(self, exiftool: ExifTool, ffprobe: FFProbe, settings: AppSettings):
        """
        Initialize metadata service.

        Args:
            exiftool: ExifTool adapter instance
            ffprobe: FFProbe adapter instance
            settings: Application settings service
        """
        self.exiftool = exiftool
        self.ffprobe = ffprobe
        self._settings = settings
        try:
            max_concurrency = int(METADATA_EXTRACT_CONCURRENCY or 1)
        except Exception:
            max_concurrency = 1
        if max_concurrency <= 0:
            max_concurrency = 1
        self._extract_sem = asyncio.Semaphore(max_concurrency)

    async def _exif_read(self, file_path: str) -> Result[Dict[str, Any]]:
        async def _invoke() -> Result[Dict[str, Any]]:
            aread = getattr(self.exiftool, "aread", None)
            if callable(aread):
                return await aread(file_path)
            return await asyncio.to_thread(self.exiftool.read, file_path)

        return await self._read_with_transient_retry(file_path, _invoke)

    async def _ffprobe_read(self, file_path: str) -> Result[Dict[str, Any]]:
        async def _invoke() -> Result[Dict[str, Any]]:
            aread = getattr(self.ffprobe, "aread", None)
            if callable(aread):
                return await aread(file_path)
            return await asyncio.to_thread(self.ffprobe.read, file_path)

        return await self._read_with_transient_retry(file_path, _invoke)

    async def _ffprobe_read_batch(self, paths: list[str]) -> Dict[str, Result[Dict[str, Any]]]:
        aread_batch = getattr(self.ffprobe, "aread_batch", None)
        if callable(aread_batch):
            return await aread_batch(paths)
        return await asyncio.to_thread(self.ffprobe.read_batch, paths)

    async def _read_with_transient_retry(
        self,
        file_path: str,
        read_once: Callable[[], Awaitable[Result[Dict[str, Any]]]],
    ) -> Result[Dict[str, Any]]:
        last_result: Result[Dict[str, Any]] | None = None
        attempts = max(1, int(_METADATA_TRANSIENT_RETRY_ATTEMPTS))
        for attempt in range(attempts):
            result = await read_once()
            last_result = result
            if result.ok:
                return result
            if attempt >= (attempts - 1):
                break
            if not self._is_transient_metadata_read_error(result, file_path):
                break
            delay = _METADATA_TRANSIENT_RETRY_BASE_DELAY_S * (2 ** attempt)
            await asyncio.sleep(max(0.01, float(delay)))
        return last_result if last_result is not None else Result.Err(ErrorCode.METADATA_FAILED, "Metadata read failed")

    def _is_transient_metadata_read_error(self, result: Result[Dict[str, Any]], file_path: str) -> bool:
        try:
            if not os.path.exists(file_path):
                return False
        except Exception:
            return False

        code = str(result.code or "").strip().upper()
        err_text = str(result.error or "").strip().lower()
        if code == ErrorCode.NOT_FOUND.value:
            return True
        transient_codes = {
            ErrorCode.TIMEOUT.value,
            ErrorCode.EXIFTOOL_ERROR.value,
            ErrorCode.FFPROBE_ERROR.value,
            ErrorCode.PARSE_ERROR.value,
            ErrorCode.METADATA_FAILED.value,
        }
        if code in transient_codes:
            return True
        return any(hint in err_text for hint in _TRANSIENT_ERROR_HINTS)

    async def _enrich_with_geninfo_async(self, combined: Dict[str, Any]) -> None:
        """Helper to parse geninfo from prompt/workflow in combined metadata (Worker Thread)."""
        prompt_graph = combined.get("prompt")
        workflow = combined.get("workflow")
        loop = asyncio.get_running_loop()
        geninfo_res = None

        try:
            # Offload heavy parsing to thread pool to prevent blocking the event loop
            geninfo_res = await loop.run_in_executor(
                None,
                functools.partial(parse_geninfo_from_prompt, prompt_graph, workflow=workflow)
            )
        except Exception as exc:
            logger.debug(f"GenInfo parse skipped: {exc}")

        if geninfo_res and geninfo_res.ok and geninfo_res.data:
            combined["geninfo"] = geninfo_res.data
        elif "geninfo" not in combined:
            gi = _build_geninfo_from_parameters(combined)
            # Always set geninfo to a dict (empty if nothing parsed)
            combined["geninfo"] = gi if gi is not None else {}
            if not gi and _looks_like_media_pipeline(prompt_graph):
                combined["geninfo_status"] = {"kind": "media_pipeline", "reason": "no_sampler"}

    async def _resolve_probe_mode(self, override: Optional[str]) -> str:
        if isinstance(override, str):
            normalized = override.strip().lower()
            if normalized in ("auto", "exiftool", "ffprobe", "both"):
                return normalized
        return await self._settings.get_probe_backend()

    async def _probe_backends(self, file_path: str, override: Optional[str]) -> tuple[str, list[str]]:
        mode = await self._resolve_probe_mode(override)
        return mode, pick_probe_backend(file_path, settings_override=mode)

    async def _resolve_fallback_prefs(self) -> tuple[bool, bool]:
        """
        Resolve runtime fallback toggles from settings.
        Returns (image_fallback_enabled, media_fallback_enabled).
        """
        image_enabled = True
        media_enabled = True
        try:
            getter = getattr(self._settings, "get_metadata_fallback_prefs", None)
            if callable(getter):
                prefs = await getter()
                if isinstance(prefs, dict):
                    image_enabled = bool(prefs.get("image", True))
                    media_enabled = bool(prefs.get("media", True))
        except Exception:
            pass
        return image_enabled, media_enabled

    async def get_metadata(
        self,
        file_path: str,
        scan_id: Optional[str] = None,
        probe_mode_override: Optional[str] = None
    ) -> Result[Dict[str, Any]]:
        """
        Extract metadata from file.

        Args:
            file_path: Path to file

        Returns:
            Result with metadata dict including:
                - file_info: Basic file information
                - exif: Raw EXIF data
                - workflow: ComfyUI workflow (if present)
                - prompt: Generation parameters
                - quality: Metadata quality (full, partial, degraded, none)
        """
        if not os.path.exists(file_path):
            return Result.Err(ErrorCode.NOT_FOUND, f"File not found: {file_path}")

        async with self._extract_sem:
            return await self._get_metadata_impl(file_path, scan_id=scan_id, probe_mode_override=probe_mode_override)

    async def _get_metadata_impl(
        self,
        file_path: str,
        scan_id: Optional[str] = None,
        probe_mode_override: Optional[str] = None
    ) -> Result[Dict[str, Any]]:
        # Get file kind
        kind = classify_file(file_path)
        if kind == "unknown":
            return Result.Err(
                ErrorCode.UNSUPPORTED,
                f"Unsupported file type: {file_path}",
                quality="none"
            )

        logger.debug(f"Extracting metadata from {kind} file: {file_path} (scan_id={scan_id})")

        try:
            # Dispatch to appropriate handler
            _, backends = await self._probe_backends(file_path, probe_mode_override)
            allow_exif = "exiftool" in backends
            allow_ffprobe = "ffprobe" in backends

            if kind == "image":
                return await self._extract_image_metadata(file_path, scan_id=scan_id, allow_exif=allow_exif)
            elif kind == "video":
                return await self._extract_video_metadata(
                    file_path,
                    scan_id=scan_id,
                    allow_exif=allow_exif,
                    allow_ffprobe=allow_ffprobe,
                )
            elif kind == "audio":
                return await self._extract_audio_metadata(
                    file_path,
                    scan_id=scan_id,
                    allow_exif=allow_exif,
                    allow_ffprobe=allow_ffprobe,
                )
            else:
                return Result.Ok({
                    "file_info": self._get_file_info(file_path),
                    "quality": "none"
                }, quality="none")

        except Exception as e:
            logger.error(f"Metadata extraction failed: {e}")
            return Result.Err(
                ErrorCode.PARSE_ERROR,
                f"Metadata extraction failed: {e}",
                quality="degraded"
            )

    async def get_workflow_only(self, file_path: str, scan_id: Optional[str] = None) -> Result[Dict[str, Any]]:
        """
        Fast path for extracting only embedded ComfyUI workflow/prompt (no ffprobe, no geninfo).

        Used for "drop on canvas" UX where we only need the workflow to load it into the graph.
        """
        if not os.path.exists(file_path):
            return Result.Err(ErrorCode.NOT_FOUND, f"File not found: {file_path}", quality="none")

        kind = classify_file(file_path)
        if kind not in ("image", "video"):
            return Result.Ok({"workflow": None, "prompt": None, "quality": "none"}, quality="none")

        ext = os.path.splitext(file_path)[1].lower()
        image_fallback_enabled, _ = await self._resolve_fallback_prefs()
        exif_data = await self._read_workflow_only_exif(
            file_path=file_path,
            kind=kind,
            image_fallback_enabled=image_fallback_enabled,
            scan_id=scan_id,
        )
        if not exif_data:
            return Result.Ok({"workflow": None, "prompt": None, "quality": "none"}, quality="none")
        res = self._extract_workflow_only_payload(kind, ext, file_path, exif_data)

        if not res.ok:
            return res

        data = res.data or {}
        payload = {
            "workflow": data.get("workflow"),
            "prompt": data.get("prompt"),
            "quality": data.get("quality", res.meta.get("quality", "none")),
        }
        return Result.Ok(payload, quality=payload.get("quality", "none"))

    async def _read_workflow_only_exif(
        self,
        *,
        file_path: str,
        kind: str,
        image_fallback_enabled: bool,
        scan_id: Optional[str],
    ) -> Dict[str, Any]:
        exif_start = time.perf_counter()
        exif_result = await self._exif_read(file_path)
        exif_duration = time.perf_counter() - exif_start
        exif_data = exif_result.data if exif_result.ok else None
        if exif_result.ok:
            return exif_data or {}
        self._log_metadata_issue(
            logging.DEBUG,
            "ExifTool failed while reading workflow-only metadata",
            file_path,
            scan_id=scan_id,
            tool="exiftool",
            error=exif_result.error,
            duration_seconds=exif_duration,
        )
        if kind == "image" and image_fallback_enabled:
            fallback = await asyncio.to_thread(read_image_exif_like, file_path)
            return fallback or {}
        return {}

    @staticmethod
    def _extract_workflow_only_payload(
        kind: str,
        ext: str,
        file_path: str,
        exif_data: Dict[str, Any],
    ) -> Result[Dict[str, Any]]:
        if kind == "image":
            if ext == ".png":
                return extract_png_metadata(file_path, exif_data)
            if ext == ".webp":
                return extract_webp_metadata(file_path, exif_data)
            return Result.Ok({"workflow": None, "prompt": None, "quality": "none"}, quality="none")
        # No ffprobe here (can be slow); extractor supports workflow/prompt from ExifTool tags.
        return extract_video_metadata(file_path, exif_data, ffprobe_data=None)

    async def _extract_image_metadata(
        self,
        file_path: str,
        scan_id: Optional[str] = None,
        allow_exif: bool = True
    ) -> Result[Dict[str, Any]]:
        """Extract metadata from image file."""
        ext = os.path.splitext(file_path)[1].lower()
        exif_data = await self._resolve_image_exif_data(file_path, scan_id=scan_id, allow_exif=allow_exif)
        metadata_result = self._extract_image_by_extension(file_path, ext, exif_data)
        if not metadata_result.ok:
            self._log_metadata_issue(
                logging.WARNING,
                "Image extractor failed",
                file_path,
                scan_id=scan_id,
                tool="extractor",
                error=metadata_result.error,
                duration_seconds=0.0,
            )
            return metadata_result

        combined = self._build_image_metadata_payload(file_path, exif_data, metadata_result)
        self._normalize_visual_dimensions(combined, exif_data=exif_data, ffprobe_data=None)

        # Optional: parse deterministic generation info from ComfyUI prompt graph (backend-first).
        # Uses worker thread to avoid blocking loop.
        await self._enrich_with_geninfo_async(combined)

        quality = metadata_result.meta.get("quality", "none")
        return Result.Ok(combined, quality=quality)

    async def _resolve_image_exif_data(
        self,
        file_path: str,
        *,
        scan_id: Optional[str],
        allow_exif: bool,
    ) -> Optional[Dict[str, Any]]:
        exif_data: Optional[Dict[str, Any]] = None
        image_fallback_enabled, _ = await self._resolve_fallback_prefs()
        if allow_exif:
            exif_data = await self._read_image_exif_if_allowed(file_path, scan_id=scan_id)
        if not exif_data and image_fallback_enabled:
            exif_data = await asyncio.to_thread(read_image_exif_like, file_path)
        return exif_data

    async def _read_image_exif_if_allowed(
        self,
        file_path: str,
        *,
        scan_id: Optional[str],
    ) -> Optional[Dict[str, Any]]:
        exif_start = time.perf_counter()
        exif_result = await self._exif_read(file_path)
        exif_duration = time.perf_counter() - exif_start
        if exif_result.ok:
            return exif_result.data if isinstance(exif_result.data, dict) else None
        self._log_metadata_issue(
            logging.WARNING,
            "ExifTool failed while reading image metadata",
            file_path,
            scan_id=scan_id,
            tool="exiftool",
            error=exif_result.error,
            duration_seconds=exif_duration,
        )
        return None

    @staticmethod
    def _extract_image_by_extension(file_path: str, ext: str, exif_data: Optional[Dict[str, Any]]) -> Result[Dict[str, Any]]:
        if ext == ".png":
            return extract_png_metadata(file_path, exif_data)
        if ext == ".webp":
            return extract_webp_metadata(file_path, exif_data)
        return Result.Ok(
            {
                "workflow": None,
                "prompt": None,
                "quality": "partial" if exif_data else "none",
            }
        )

    def _build_image_metadata_payload(
        self,
        file_path: str,
        exif_data: Optional[Dict[str, Any]],
        metadata_result: Result[Dict[str, Any]],
    ) -> Dict[str, Any]:
        return {
            "file_info": self._get_file_info(file_path),
            "exif": exif_data,
            **(metadata_result.data or {}),
        }

    async def _extract_video_metadata(
        self,
        file_path: str,
        scan_id: Optional[str] = None,
        allow_exif: bool = True,
        allow_ffprobe: bool = True,
    ) -> Result[Dict[str, Any]]:
        """Extract metadata from video file."""
        _, media_fallback_enabled = await self._resolve_fallback_prefs()
        exif_data, exif_duration = await self._read_video_exif_if_allowed(file_path, scan_id, allow_exif)
        ffprobe_data, ffprobe_duration = await self._read_video_ffprobe_if_allowed(file_path, scan_id, allow_ffprobe)
        if not ffprobe_data and media_fallback_enabled:
            ffprobe_data = await asyncio.to_thread(read_media_probe_like, file_path)

        # Extract video-specific metadata
        metadata_result = extract_video_metadata(file_path, exif_data, ffprobe_data)

        if not metadata_result.ok:
            self._log_metadata_issue(
                logging.WARNING,
                "Video extractor failed",
                file_path,
                scan_id=scan_id,
                tool="extractor",
                error=metadata_result.error,
                duration_seconds=(exif_duration + ffprobe_duration)
            )
            return metadata_result

        self._expand_video_resolution_fields(metadata_result)

        # Combine results
        combined = {
            "file_info": self._get_file_info(file_path),
            "exif": exif_data,
            "ffprobe": ffprobe_data,
            **(metadata_result.data or {})
        }
        self._normalize_visual_dimensions(combined, exif_data=exif_data, ffprobe_data=ffprobe_data)

        try:
            await self._enrich_with_geninfo_async(combined)
        except Exception as exc:
            logger.debug(f"GenInfo parse skipped: {exc}")

        quality = metadata_result.meta.get("quality", "none")
        return Result.Ok(combined, quality=quality)

    async def _extract_audio_metadata(
        self,
        file_path: str,
        scan_id: Optional[str] = None,
        allow_exif: bool = True,
        allow_ffprobe: bool = True,
    ) -> Result[Dict[str, Any]]:
        """Extract metadata from audio file."""
        if not allow_exif and not allow_ffprobe:
            return await self._extract_audio_metadata_fallback_only(file_path)

        exif_data, exif_duration = await self._read_audio_exif_if_allowed(file_path, scan_id, allow_exif)
        ffprobe_data, ffprobe_duration = await self._read_audio_ffprobe_if_allowed(file_path, scan_id, allow_ffprobe)
        ffprobe_data = await self._maybe_audio_ffprobe_fallback(file_path, ffprobe_data)

        metadata_result = extract_audio_metadata(file_path, exif_data=exif_data, ffprobe_data=ffprobe_data)
        if not metadata_result.ok:
            self._log_metadata_issue(
                logging.WARNING,
                "Audio extractor failed",
                file_path,
                scan_id=scan_id,
                tool="extractor",
                error=metadata_result.error,
                duration_seconds=(exif_duration + ffprobe_duration),
            )
            return metadata_result

        return await self._finalize_audio_metadata_ok(file_path, exif_data, ffprobe_data, metadata_result)

    async def _extract_audio_metadata_fallback_only(self, file_path: str) -> Result[Dict[str, Any]]:
        _, media_fallback_enabled = await self._resolve_fallback_prefs()
        fallback_ffprobe = await asyncio.to_thread(read_media_probe_like, file_path) if media_fallback_enabled else None
        metadata_result = extract_audio_metadata(file_path, exif_data=None, ffprobe_data=fallback_ffprobe or None)
        if not metadata_result.ok:
            return metadata_result
        combined = {
            "file_info": self._get_file_info(file_path),
            "exif": None,
            "ffprobe": fallback_ffprobe or None,
            **(metadata_result.data or {}),
        }
        quality = metadata_result.meta.get("quality", "none")
        return Result.Ok(combined, quality=quality)

    async def _read_video_exif_if_allowed(
        self, file_path: str, scan_id: Optional[str], allow_exif: bool
    ) -> tuple[Dict[str, Any] | None, float]:
        if not allow_exif:
            return {}, 0.0
        exif_start = time.perf_counter()
        exif_result = await self._exif_read(file_path)
        exif_duration = time.perf_counter() - exif_start
        if exif_result.ok:
            return exif_result.data or {}, exif_duration
        self._log_metadata_issue(
            logging.WARNING,
            "ExifTool failed while reading video metadata",
            file_path,
            scan_id=scan_id,
            tool="exiftool",
            error=exif_result.error,
            duration_seconds=exif_duration,
        )
        return None, exif_duration

    async def _read_video_ffprobe_if_allowed(
        self, file_path: str, scan_id: Optional[str], allow_ffprobe: bool
    ) -> tuple[Dict[str, Any] | None, float]:
        if not allow_ffprobe:
            return {}, 0.0
        ffprobe_start = time.perf_counter()
        ffprobe_result = await self._ffprobe_read(file_path)
        ffprobe_duration = time.perf_counter() - ffprobe_start
        if ffprobe_result.ok:
            return ffprobe_result.data or {}, ffprobe_duration
        self._log_metadata_issue(
            logging.WARNING,
            "FFprobe failed while reading video metadata",
            file_path,
            scan_id=scan_id,
            tool="ffprobe",
            error=ffprobe_result.error,
            duration_seconds=ffprobe_duration,
        )
        return None, ffprobe_duration

    @staticmethod
    def _expand_video_resolution_fields(metadata_result: Result[Dict[str, Any]]) -> None:
        data = metadata_result.data or {}
        if not data.get("resolution"):
            return
        try:
            w, h = data["resolution"]
            data["width"] = w
            data["height"] = h
        except (ValueError, TypeError):
            return

    async def _read_audio_exif_if_allowed(
        self,
        file_path: str,
        scan_id: Optional[str],
        allow_exif: bool,
    ) -> tuple[Optional[Dict[str, Any]], float]:
        if not allow_exif:
            return None, 0.0
        exif_start = time.perf_counter()
        exif_result = await self._exif_read(file_path)
        exif_duration = time.perf_counter() - exif_start
        exif_data = exif_result.data if exif_result.ok else None
        if not exif_result.ok:
            self._log_metadata_issue(
                logging.WARNING,
                "ExifTool failed while reading audio metadata",
                file_path,
                scan_id=scan_id,
                tool="exiftool",
                error=exif_result.error,
                duration_seconds=exif_duration,
            )
        return exif_data, exif_duration

    async def _read_audio_ffprobe_if_allowed(
        self,
        file_path: str,
        scan_id: Optional[str],
        allow_ffprobe: bool,
    ) -> tuple[Optional[Dict[str, Any]], float]:
        if not allow_ffprobe:
            return None, 0.0
        ffprobe_start = time.perf_counter()
        ffprobe_result = await self._ffprobe_read(file_path)
        ffprobe_duration = time.perf_counter() - ffprobe_start
        ffprobe_data = ffprobe_result.data if ffprobe_result.ok else None
        if not ffprobe_result.ok:
            self._log_metadata_issue(
                logging.WARNING,
                "FFprobe failed while reading audio metadata",
                file_path,
                scan_id=scan_id,
                tool="ffprobe",
                error=ffprobe_result.error,
                duration_seconds=ffprobe_duration,
            )
        return ffprobe_data, ffprobe_duration

    async def _maybe_audio_ffprobe_fallback(
        self,
        file_path: str,
        ffprobe_data: Optional[Dict[str, Any]],
    ) -> Optional[Dict[str, Any]]:
        if ffprobe_data:
            return ffprobe_data
        _, media_fallback_enabled = await self._resolve_fallback_prefs()
        if not media_fallback_enabled:
            return ffprobe_data
        return await asyncio.to_thread(read_media_probe_like, file_path)

    async def _finalize_audio_metadata_ok(
        self,
        file_path: str,
        exif_data: Optional[Dict[str, Any]],
        ffprobe_data: Optional[Dict[str, Any]],
        metadata_result: Result[Dict[str, Any]],
    ) -> Result[Dict[str, Any]]:
        combined = {
            "file_info": self._get_file_info(file_path),
            "exif": exif_data,
            "ffprobe": ffprobe_data,
            **(metadata_result.data or {}),
        }
        try:
            await self._enrich_with_geninfo_async(combined)
        except Exception:
            pass
        quality = metadata_result.meta.get("quality", "none")
        return Result.Ok(combined, quality=quality)

    async def get_metadata_batch(
        self,
        file_paths: list[str],
        scan_id: Optional[str] = None,
        probe_mode_override: Optional[str] = None,
    ) -> Dict[str, Result[Dict[str, Any]]]:
        """
        Extract metadata from multiple files in batch (much faster than individual calls).

        This uses batch ExifTool/FFProbe execution and native Python extractors (PNG)
        to dramatically reduce subprocess overhead.

        Args:
            file_paths: List of file paths to process
            scan_id: Optional scan ID for logging

        Returns:
            Dict mapping file path to Result with metadata
        """
        if not file_paths:
            return {}

        async with self._extract_sem:
            return await self._get_metadata_batch_impl(
                file_paths,
                scan_id=scan_id,
                probe_mode_override=probe_mode_override,
            )

    async def _finalize_batch_ok(
        self,
        combined: Dict[str, Any],
        metadata_result: Result[Dict[str, Any]],
    ) -> Result[Dict[str, Any]]:
        if _should_parse_geninfo(combined):
            await self._enrich_with_geninfo_async(combined)
        elif "geninfo" not in combined:
            combined["geninfo"] = {}
        quality = metadata_result.meta.get("quality", "none")
        return Result.Ok(combined, quality=quality)

    async def _process_image_batch_item(
        self,
        path: str,
        exif_data: Optional[Dict[str, Any]],
        image_fallback_enabled: bool,
    ) -> Result[Dict[str, Any]]:
        resolved_exif = exif_data
        if not resolved_exif and image_fallback_enabled:
            resolved_exif = read_image_exif_like(path)

        ext = os.path.splitext(path)[1].lower()
        if ext == ".png":
            metadata_result = extract_png_metadata(path, resolved_exif)
        elif ext == ".webp":
            metadata_result = extract_webp_metadata(path, resolved_exif)
        else:
            metadata_result = Result.Ok(
                {
                    "workflow": None,
                    "prompt": None,
                    "quality": "partial" if resolved_exif else "none",
                }
            )

        if not metadata_result.ok:
            return metadata_result

        combined = {
            "file_info": self._get_file_info(path),
            "exif": resolved_exif,
            **(metadata_result.data or {}),
        }
        self._normalize_visual_dimensions(combined, exif_data=resolved_exif, ffprobe_data=None)
        return await self._finalize_batch_ok(combined, metadata_result)

    async def _process_video_batch_item(
        self,
        path: str,
        exif_data: Optional[Dict[str, Any]],
        ffprobe_data: Optional[Dict[str, Any]],
        media_fallback_enabled: bool,
    ) -> Result[Dict[str, Any]]:
        resolved_ffprobe = ffprobe_data
        if not resolved_ffprobe and media_fallback_enabled:
            resolved_ffprobe = read_media_probe_like(path)

        metadata_result = extract_video_metadata(path, exif_data, resolved_ffprobe)
        if not metadata_result.ok:
            return metadata_result

        payload = dict(metadata_result.data or {})
        _expand_resolution_scalars(payload)

        combined = {
            "file_info": self._get_file_info(path),
            "exif": exif_data,
            "ffprobe": resolved_ffprobe,
            **payload,
        }
        self._normalize_visual_dimensions(combined, exif_data=exif_data, ffprobe_data=resolved_ffprobe)
        return await self._finalize_batch_ok(combined, metadata_result)

    async def _process_audio_batch_item(
        self,
        path: str,
        exif_data: Optional[Dict[str, Any]],
        ffprobe_data: Optional[Dict[str, Any]],
        media_fallback_enabled: bool,
    ) -> Result[Dict[str, Any]]:
        resolved_ffprobe = ffprobe_data
        if not resolved_ffprobe and media_fallback_enabled:
            resolved_ffprobe = read_media_probe_like(path)

        metadata_result = extract_audio_metadata(path, exif_data=exif_data, ffprobe_data=resolved_ffprobe)
        if not metadata_result.ok:
            return metadata_result

        combined = {
            "file_info": self._get_file_info(path),
            "exif": exif_data,
            "ffprobe": resolved_ffprobe,
            **(metadata_result.data or {}),
        }
        return await self._finalize_batch_ok(combined, metadata_result)

    async def _get_metadata_batch_impl(
        self,
        file_paths: list[str],
        scan_id: Optional[str] = None,
        probe_mode_override: Optional[str] = None,
    ) -> Dict[str, Result[Dict[str, Any]]]:
        if not file_paths:
            return {}

        images, videos, audios, others = _group_existing_paths(file_paths)
        results: Dict[str, Result[Dict[str, Any]]] = {}
        probe_mode = await self._resolve_probe_mode(probe_mode_override)
        image_fallback_enabled, media_fallback_enabled = await self._resolve_fallback_prefs()

        exif_targets, ffprobe_targets = _build_batch_probe_targets([*images, *videos, *audios], probe_mode)

        exif_results: Dict[str, Result[Dict[str, Any]]] = (
            await self.exiftool.aread_batch(exif_targets) if exif_targets else {}
        )
        ffprobe_results: Dict[str, Result[Dict[str, Any]]] = (
            await self._ffprobe_read_batch(ffprobe_targets) if ffprobe_targets else {}
        )

        await self._fill_image_batch_results(results, images, exif_results, image_fallback_enabled)
        await self._fill_video_batch_results(results, videos, exif_results, ffprobe_results, media_fallback_enabled)
        await self._fill_audio_batch_results(results, audios, exif_results, ffprobe_results, media_fallback_enabled)
        self._fill_other_batch_results(results, others)

        return results

    async def _fill_image_batch_results(
        self,
        results: Dict[str, Result[Dict[str, Any]]],
        paths: list[str],
        exif_results: Dict[str, Result[Dict[str, Any]]],
        image_fallback_enabled: bool,
    ) -> None:
        for path in paths:
            if path in results:
                continue
            results[path] = await self._process_image_batch_item(
                path,
                _batch_tool_data(exif_results, path),
                image_fallback_enabled,
            )

    async def _fill_video_batch_results(
        self,
        results: Dict[str, Result[Dict[str, Any]]],
        paths: list[str],
        exif_results: Dict[str, Result[Dict[str, Any]]],
        ffprobe_results: Dict[str, Result[Dict[str, Any]]],
        media_fallback_enabled: bool,
    ) -> None:
        for path in paths:
            if path in results:
                continue
            results[path] = await self._process_video_batch_item(
                path,
                _batch_tool_data(exif_results, path),
                _batch_tool_data(ffprobe_results, path),
                media_fallback_enabled,
            )

    async def _fill_audio_batch_results(
        self,
        results: Dict[str, Result[Dict[str, Any]]],
        paths: list[str],
        exif_results: Dict[str, Result[Dict[str, Any]]],
        ffprobe_results: Dict[str, Result[Dict[str, Any]]],
        media_fallback_enabled: bool,
    ) -> None:
        for path in paths:
            if path in results:
                continue
            results[path] = await self._process_audio_batch_item(
                path,
                _batch_tool_data(exif_results, path),
                _batch_tool_data(ffprobe_results, path),
                media_fallback_enabled,
            )

    def _fill_other_batch_results(
        self,
        results: Dict[str, Result[Dict[str, Any]]],
        paths: list[str],
    ) -> None:
        for path in paths:
            if path in results:
                continue
            results[path] = Result.Ok({"file_info": self._get_file_info(path), "quality": "none"}, quality="none")

    def extract_rating_tags_only(self, file_path: str, scan_id: Optional[str] = None) -> Result[Dict[str, Any]]:
        """
        Lightweight extraction for rating/tags only (no workflow/geninfo parsing).

        Used to "hydrate" missing rating/tags from existing OS/file metadata without running a full scan.
        """
        if not os.path.exists(file_path):
            return Result.Err(ErrorCode.NOT_FOUND, f"File not found: {file_path}", quality="none")

        exif_start = time.perf_counter()
        # Read a narrow tag set for performance; extractor normalizes grouped keys.
        tags = [
            # Ratings (XMP + Windows)
            "XMP-xmp:Rating",
            "XMP-microsoft:RatingPercent",
            "Microsoft:SharedUserRating",
            "Rating",
            "RatingPercent",
            # Tags/keywords
            "XMP-dc:Subject",
            "XMP:Subject",
            "IPTC:Keywords",
            "Keywords",
            "XPKeywords",
            "Microsoft:Category",
            "Subject",
        ]
        exif_result = self.exiftool.read(file_path, tags=tags)
        exif_duration = time.perf_counter() - exif_start
        exif_data = exif_result.data if exif_result.ok else None

        if not exif_result.ok:
            self._log_metadata_issue(
                logging.DEBUG,
                "ExifTool failed while reading rating/tags",
                file_path,
                scan_id=scan_id,
                tool="exiftool",
                error=exif_result.error,
                duration_seconds=exif_duration,
            )
            return Result.Ok({"rating": None, "tags": []}, quality="none")

        rating, tags_list = extract_rating_tags_from_exif(exif_data)
        return Result.Ok({"rating": rating, "tags": tags_list}, quality="partial")

    def _log_metadata_issue(
        self,
        level: int,
        message: str,
        file_path: str,
        scan_id: Optional[str] = None,
        tool: Optional[str] = None,
        error: Optional[str] = None,
        duration_seconds: Optional[float] = None
    ):
        context: Dict[str, Any] = {"file_path": file_path}
        if scan_id:
            context["scan_id"] = scan_id
        if tool:
            context["tool"] = tool
        if error:
            context["error"] = error
        if duration_seconds is not None:
            try:
                context["duration_seconds"] = round(float(duration_seconds), 3)
            except Exception:
                context["duration_seconds"] = duration_seconds
        log_structured(logger, level, message, **context)

    def _get_file_info(self, file_path: str) -> Dict[str, Any]:
        """Get basic file information."""
        stat = os.stat(file_path)
        info = {
            "filename": os.path.basename(file_path),
            "filepath": file_path,
            "size": stat.st_size,
            "mtime": stat.st_mtime,
            "ctime": stat.st_ctime,
            "kind": classify_file(file_path),
            "ext": os.path.splitext(file_path)[1].lower()
        }
        # st_birthtime is not available on all platforms/filesystems.
        birthtime = getattr(stat, "st_birthtime", None)
        if birthtime is not None:
            info["birthtime"] = birthtime
        return info

    @staticmethod
    def _normalize_visual_dimensions(payload: Dict[str, Any], exif_data: Optional[Dict[str, Any]] = None, ffprobe_data: Optional[Dict[str, Any]] = None) -> None:
        """
        Ensure payload has scalar width/height when visual dimensions are available.
        """
        def _coerce(v: Any) -> Optional[int]:
            try:
                if v is None:
                    return None
                if isinstance(v, str):
                    s = v.strip().lower().replace("px", "").strip()
                    if not s:
                        return None
                    v = s
                out = int(float(v))
                return out if out > 0 else None
            except Exception:
                return None

        w = _coerce(payload.get("width"))
        h = _coerce(payload.get("height"))
        w, h = MetadataService._fill_dims_from_resolution(payload, w, h, _coerce)
        w, h = MetadataService._fill_dims_from_ffprobe(ffprobe_data, w, h, _coerce)
        w, h = MetadataService._fill_dims_from_exif(exif_data, w, h, _coerce)

        if w is not None and h is not None:
            payload["width"] = int(w)
            payload["height"] = int(h)

    @staticmethod
    def _fill_dims_from_resolution(
        payload: Dict[str, Any],
        w: Optional[int],
        h: Optional[int],
        coerce: Callable[[Any], Optional[int]],
    ) -> tuple[Optional[int], Optional[int]]:
        if (w is not None and h is not None) or not payload.get("resolution"):
            return w, h
        try:
            rw, rh = payload.get("resolution")
            if w is None:
                w = coerce(rw)
            if h is None:
                h = coerce(rh)
        except Exception:
            return w, h
        return w, h

    @staticmethod
    def _fill_dims_from_ffprobe(
        ffprobe_data: Optional[Dict[str, Any]],
        w: Optional[int],
        h: Optional[int],
        coerce: Callable[[Any], Optional[int]],
    ) -> tuple[Optional[int], Optional[int]]:
        if w is not None and h is not None:
            return w, h
        if not isinstance(ffprobe_data, dict):
            return w, h
        try:
            video_stream = ffprobe_data.get("video_stream") or {}
            if w is None:
                w = coerce(video_stream.get("width"))
            if h is None:
                h = coerce(video_stream.get("height"))
        except Exception:
            return w, h
        return w, h

    @staticmethod
    def _fill_dims_from_exif(
        exif_data: Optional[Dict[str, Any]],
        w: Optional[int],
        h: Optional[int],
        coerce: Callable[[Any], Optional[int]],
    ) -> tuple[Optional[int], Optional[int]]:
        if w is not None and h is not None:
            return w, h
        if not isinstance(exif_data, dict):
            return w, h
        width_keys = (
            "Image:ImageWidth",
            "EXIF:ImageWidth",
            "EXIF:ExifImageWidth",
            "IFD0:ImageWidth",
            "Composite:ImageWidth",
            "QuickTime:ImageWidth",
            "PNG:ImageWidth",
            "File:ImageWidth",
            "width",
        )
        height_keys = (
            "Image:ImageHeight",
            "EXIF:ImageHeight",
            "EXIF:ExifImageHeight",
            "IFD0:ImageHeight",
            "Composite:ImageHeight",
            "QuickTime:ImageHeight",
            "PNG:ImageHeight",
            "File:ImageHeight",
            "height",
        )
        if w is None:
            w = MetadataService._pick_first_coerced(exif_data, width_keys, coerce)
        if h is None:
            h = MetadataService._pick_first_coerced(exif_data, height_keys, coerce)
        return w, h

    @staticmethod
    def _pick_first_coerced(source: Dict[str, Any], keys: tuple[str, ...], coerce: Callable[[Any], Optional[int]]) -> Optional[int]:
        for key in keys:
            value = coerce(source.get(key))
            if value is not None:
                return value
        return None
