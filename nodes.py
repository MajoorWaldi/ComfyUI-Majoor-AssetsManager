"""
Majoor Assets Manager – ComfyUI custom nodes.

MajoorSaveImage : drop-in replacement for ComfyUI SaveImage that persists
                  ``generation_time_ms`` (and any extra metadata) inside the
                  PNG text chunks so Majoor can index it later.

MajoorSaveVideo : saves a VIDEO *or* a batch of IMAGE frames as a video file
                  (MP4 h264) using PyAV – same approach as ComfyUI's native
                  ``SaveVideo`` node – while embedding ``generation_time_ms``
                  directly in the MP4 container metadata alongside the full
                  prompt / workflow JSON.
                  Also supports GIF / WebP export via Pillow for animated
                  image formats.
"""

from __future__ import annotations

import datetime
import json
import logging
import math
import os
import re
import time
from fractions import Fraction
from typing import Any

import av  # type: ignore[import-untyped]
import folder_paths  # type: ignore[import-untyped]
import numpy as np
import torch
from comfy.cli_args import args  # type: ignore[import-untyped]
from PIL import Image
from PIL.PngImagePlugin import PngInfo

_log = logging.getLogger("majoor_assets_manager.nodes")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _get_generation_time_ms() -> int:
    """
    Compute elapsed time since the current prompt started.

    Uses *mjr_am_backend.runtime_activity* (which hooks into the ComfyUI
    prompt lifecycle) to know when the prompt was queued. Falls back to 0
    if the runtime module is unavailable.
    """
    try:
        from mjr_am_backend.runtime_activity import _LOCK, _STATE

        with _LOCK:
            started = float(_STATE.get("last_started_at") or 0.0)
        if started <= 0.0:
            return 0
        # last_started_at is time.monotonic(), so compare with same clock
        return max(0, int(round((time.monotonic() - started) * 1000)))
    except Exception:
        return 0


def _tensor_to_bytes(t: torch.Tensor) -> np.ndarray:
    """Convert a CHW/HWC float [0-1] tensor to uint8 HWC numpy array."""
    arr = 255.0 * t.cpu().numpy()
    return np.clip(arr, 0, 255).astype(np.uint8)


def _next_counter(directory: str, prefix: str) -> int:
    """Find the next available counter for *prefix_NNNNN* in *directory*."""
    max_counter = 0
    matcher = re.compile(rf"{re.escape(prefix)}_(\d+)\D*\..+", re.IGNORECASE)
    try:
        for entry in os.listdir(directory):
            m = matcher.fullmatch(entry)
            if m:
                max_counter = max(max_counter, int(m.group(1)))
    except FileNotFoundError:
        pass
    return max_counter + 1


def _build_metadata(
    prompt: Any | None,
    extra_pnginfo: dict | None,
    generation_time_ms: int,
) -> PngInfo:
    metadata = PngInfo()
    if prompt is not None:
        metadata.add_text("prompt", json.dumps(prompt))
    if extra_pnginfo is not None:
        for key in extra_pnginfo:
            metadata.add_text(key, json.dumps(extra_pnginfo[key]))
    metadata.add_text("generation_time_ms", str(generation_time_ms))
    metadata.add_text(
        "CreationTime",
        datetime.datetime.now().isoformat(" ")[:19],
    )
    return metadata


# ---------------------------------------------------------------------------
# MajoorSaveImage
# ---------------------------------------------------------------------------

class MajoorSaveImage:
    """
    Save images to the ComfyUI output directory with **generation_time_ms**
    persisted in the PNG text metadata.

    Behaves identically to the built-in *SaveImage* node but adds an
    optional ``generation_time_ms`` input.  When left unconnected the
    node automatically computes the time elapsed since the prompt started.
    """

    def __init__(self) -> None:
        self.output_dir = folder_paths.get_output_directory()
        self.type = "output"
        self.prefix_append = ""
        self.compress_level = 4

    @classmethod
    def INPUT_TYPES(cls):  # noqa: N802
        return {
            "required": {
                "images": ("IMAGE", {"tooltip": "The images to save."}),
                "filename_prefix": (
                    "STRING",
                    {
                        "default": "Majoor",
                        "tooltip": "Prefix for the saved file. Supports ComfyUI formatting placeholders.",
                    },
                ),
            },
            "optional": {
                "generation_time_ms": (
                    "INT",
                    {
                        "default": -1,
                        "min": -1,
                        "tooltip": "Generation time in milliseconds. -1 = auto-detect from prompt lifecycle.",
                    },
                ),
            },
            "hidden": {
                "prompt": "PROMPT",
                "extra_pnginfo": "EXTRA_PNGINFO",
            },
        }

    RETURN_TYPES = ()
    FUNCTION = "save_images"
    OUTPUT_NODE = True
    CATEGORY = "Majoor"
    DESCRIPTION = "Save images with generation_time_ms metadata for Majoor Assets Manager."

    def save_images(
        self,
        images: torch.Tensor,
        filename_prefix: str = "Majoor",
        generation_time_ms: int = -1,
        prompt: Any | None = None,
        extra_pnginfo: dict | None = None,
    ):
        filename_prefix += self.prefix_append
        full_output_folder, filename, counter, subfolder, filename_prefix = (
            folder_paths.get_save_image_path(
                filename_prefix,
                self.output_dir,
                images[0].shape[1],
                images[0].shape[0],
            )
        )

        gen_time = generation_time_ms if generation_time_ms >= 0 else _get_generation_time_ms()

        results: list[dict[str, str]] = []
        for batch_number, image in enumerate(images):
            img = Image.fromarray(_tensor_to_bytes(image))

            metadata: PngInfo | None = None
            if not args.disable_metadata:
                metadata = _build_metadata(prompt, extra_pnginfo, gen_time)

            fname = filename.replace("%batch_num%", str(batch_number))
            file = f"{fname}_{counter:05}_.png"
            img.save(
                os.path.join(full_output_folder, file),
                pnginfo=metadata,
                compress_level=self.compress_level,
            )
            results.append(
                {"filename": file, "subfolder": subfolder, "type": self.type}
            )
            counter += 1

        return {"ui": {"images": results}}


# ---------------------------------------------------------------------------
# MajoorSaveVideo
# ---------------------------------------------------------------------------

_SUPPORTED_VIDEO_FORMATS = [
    "mp4 (h264)",
    "gif",
    "webp",
]


def _resolve_video_inputs(
    video: Any | None,
    images: torch.Tensor | None,
    audio: dict | None,
    frame_rate: float,
) -> tuple[torch.Tensor, float, dict | None] | None:
    """Return (images, fps, audio) or None when nothing to encode."""

    def _coerce_audio_input(candidate: Any | None) -> dict | None:
        if candidate is None:
            return None
        if isinstance(candidate, dict):
            return candidate if candidate.get("waveform") is not None else None
        waveform = getattr(candidate, "waveform", None)
        if waveform is not None:
            return {
                "waveform": waveform,
                "sample_rate": getattr(candidate, "sample_rate", 44100),
            }
        if hasattr(candidate, "__getitem__"):
            try:
                waveform = candidate["waveform"]
                if waveform is not None:
                    sample_rate = candidate["sample_rate"] if "sample_rate" in candidate else 44100
                    return {
                        "waveform": waveform,
                        "sample_rate": sample_rate,
                    }
            except Exception:
                pass
        return None

    resolved_images: torch.Tensor | None = None
    resolved_audio: dict | None = audio
    resolved_fps: float = frame_rate

    if video is not None:
        get_components = getattr(video, "get_components", None)
        if callable(get_components):
            components = get_components()
            resolved_images = components.images
            resolved_fps = float(components.frame_rate) if components.frame_rate else frame_rate
            if resolved_audio is None and components.audio is not None:
                resolved_audio = components.audio
        else:
            # Accept AUDIO payloads accidentally/explicitly routed to the video socket.
            if resolved_audio is None:
                resolved_audio = _coerce_audio_input(video)
            if images is not None:
                resolved_images = images
            else:
                return None
    elif images is not None:
        resolved_images = images
    else:
        return None

    if resolved_images is None or (isinstance(resolved_images, torch.Tensor) and resolved_images.size(0) == 0):
        return None
    return resolved_images, resolved_fps, resolved_audio


def _save_animated(
    resolved_images: torch.Tensor,
    fmt: str,
    fps: float,
    loop_count: int,
    output_folder: str,
    filename: str,
    counter: int,
) -> str:
    """Save GIF / WebP via Pillow. Returns the output filename."""
    out_file = f"{filename}_{counter:05}.{fmt}"
    out_path = os.path.join(output_folder, out_file)
    num_frames = resolved_images.size(0)
    frames = [Image.fromarray(_tensor_to_bytes(resolved_images[i])) for i in range(num_frames)]
    save_kwargs: dict[str, Any] = {
        "save_all": True,
        "append_images": frames[1:],
        "duration": round(1000 / fps),
        "loop": loop_count,
    }
    if fmt == "gif":
        save_kwargs["disposal"] = 2
    if fmt == "webp":
        save_kwargs["lossless"] = False
    frames[0].save(out_path, format=fmt.upper(), **save_kwargs)
    return out_file


def _build_container_metadata(
    prompt: Any | None,
    extra_pnginfo: dict | None,
    generation_time_ms: int,
) -> dict[str, str]:
    """Build the metadata dict to embed into an MP4 container."""
    meta: dict[str, str] = {}
    if args.disable_metadata:
        return meta
    if prompt is not None:
        meta["prompt"] = json.dumps(prompt)
    if extra_pnginfo is not None:
        for key in extra_pnginfo:
            meta[key] = json.dumps(extra_pnginfo[key])
    meta["generation_time_ms"] = str(generation_time_ms)
    meta["CreationTime"] = datetime.datetime.now().isoformat(" ")[:19]
    return meta


def _prepare_audio(
    audio_input: Any | None,
    fps_fraction: Fraction,
    num_frames: int,
) -> tuple[Any, int, str] | None:
    """Extract waveform, sample_rate, layout from an AUDIO input. Returns None if no audio."""

    def _extract_audio_payload(candidate: Any | None) -> tuple[Any | None, int]:
        if candidate is None:
            return None, 44100

        if isinstance(candidate, dict):
            if candidate.get("waveform") is not None:
                return candidate.get("waveform"), int(candidate.get("sample_rate", 44100) or 44100)
            for key in ("audio", "sound", "data"):
                nested = candidate.get(key)
                if nested is not None:
                    waveform, sr = _extract_audio_payload(nested)
                    if waveform is not None:
                        return waveform, sr

        if isinstance(candidate, (list, tuple)):
            for item in candidate:
                waveform, sr = _extract_audio_payload(item)
                if waveform is not None:
                    return waveform, sr

        waveform = getattr(candidate, "waveform", None)
        if waveform is not None:
            return waveform, int(getattr(candidate, "sample_rate", 44100) or 44100)

        if hasattr(candidate, "__getitem__"):
            try:
                waveform = candidate["waveform"]
                sample_rate = candidate["sample_rate"] if "sample_rate" in candidate else 44100
                if waveform is not None:
                    return waveform, int(sample_rate or 44100)
            except Exception:
                pass

        return None, 44100

    def _normalize_waveform_channels_samples(waveform: Any) -> torch.Tensor | None:
        if not torch.is_tensor(waveform):
            return None

        w = waveform
        if w.ndim == 1:
            w = w.unsqueeze(0)
        elif w.ndim == 3:
            # Prefer first batch item.
            w = w[0]

        if w.ndim != 2:
            return None

        # Support both [channels, samples] and [samples, channels].
        if w.shape[0] > 8 and w.shape[1] <= 8:
            w = w.transpose(0, 1)

        return w.contiguous()

    if audio_input is None:
        return None

    waveform_raw, sample_rate = _extract_audio_payload(audio_input)
    waveform = _normalize_waveform_channels_samples(waveform_raw)
    if waveform is None:
        return None

    max_samples = math.ceil((float(sample_rate) / float(fps_fraction)) * num_frames)
    trimmed = waveform[:, :max_samples]
    channels = trimmed.shape[0]
    layout = {1: "mono", 2: "stereo", 6: "5.1"}.get(channels, "stereo")
    return trimmed, int(sample_rate), layout


def _encode_mp4(
    out_path: str,
    resolved_images: torch.Tensor,
    fps: float,
    crf: int,
    container_meta: dict[str, str],
    audio_input: Any | None,
    num_frames: int,
) -> None:
    """Encode frames + optional audio into an MP4 via PyAV."""
    fps_fraction = Fraction(round(fps * 1000), 1000)
    audio_info = _prepare_audio(audio_input, fps_fraction, num_frames)

    with av.open(out_path, mode="w", options={"movflags": "use_metadata_tags"}) as container:
        for key, value in container_meta.items():
            container.metadata[key] = value

        stream = container.add_stream("libx264", rate=fps_fraction)
        stream.width = resolved_images.shape[2]
        stream.height = resolved_images.shape[1]
        stream.pix_fmt = "yuv420p"
        stream.bit_rate = 0
        stream.options = {"crf": str(crf)}

        audio_stream = None
        if audio_info is not None:
            waveform, sample_rate, layout = audio_info
            audio_stream = container.add_stream("aac", rate=sample_rate, layout=layout)

        for frame_tensor in resolved_images:
            img = (frame_tensor * 255).clamp(0, 255).byte().cpu().numpy()
            video_frame = av.VideoFrame.from_ndarray(img, format="rgb24")
            video_frame = video_frame.reformat(format="yuv420p")
            for packet in stream.encode(video_frame):
                container.mux(packet)
        for packet in stream.encode():
            container.mux(packet)

        if audio_stream is not None and audio_info is not None:
            waveform, sample_rate, layout = audio_info
            audio_frame = av.AudioFrame.from_ndarray(
                waveform.float().cpu().contiguous().numpy(),
                format="fltp",
                layout=layout,
            )
            audio_frame.sample_rate = sample_rate
            audio_frame.pts = 0
            for packet in audio_stream.encode(audio_frame):
                container.mux(packet)
            for packet in audio_stream.encode():
                container.mux(packet)


class MajoorSaveVideo:
    """
    Save a VIDEO or a batch of IMAGE frames as a video file.

    For MP4 output the node uses **PyAV** (same as ComfyUI's native SaveVideo)
    and writes all metadata – including ``generation_time_ms`` – directly into
    the MP4 container so it persists long-term.

    For GIF / WebP the node uses Pillow, with a PNG sidecar for metadata.
    """

    def __init__(self) -> None:
        self.output_dir = folder_paths.get_output_directory()
        self.type = "output"

    @classmethod
    def INPUT_TYPES(cls):  # noqa: N802
        return {
            "required": {
                "filename_prefix": ("STRING", {"default": "MajoorVideo"}),
                "format": (_SUPPORTED_VIDEO_FORMATS, {"default": "mp4 (h264)"}),
            },
            "optional": {
                "images": ("IMAGE", {"tooltip": "Batch of frames to encode as video."}),
                "video": (
                    "*",
                    {"tooltip": "A VIDEO input, or AUDIO routed into this socket (native SaveVideo style)."},
                ),
                "frame_rate": (
                    "FLOAT",
                    {"default": 24.0, "min": 1.0, "max": 120.0, "step": 1.0,
                     "tooltip": "FPS – ignored when a VIDEO input already carries its own frame rate."},
                ),
                "loop_count": ("INT", {"default": 0, "min": 0, "max": 100, "step": 1}),
                "generation_time_ms": (
                    "INT",
                    {"default": -1, "min": -1,
                     "tooltip": "Generation time in ms. -1 = auto-detect."},
                ),
                "audio": ("AUDIO", {"tooltip": "Audio to mux into the video."}),
                "crf": (
                    "INT",
                    {"default": 19, "min": 0, "max": 63,
                     "tooltip": "Constant Rate Factor (lower = higher quality)."},
                ),
                "save_first_frame": (
                    "BOOLEAN",
                    {"default": True,
                     "tooltip": "Save a PNG sidecar of the first frame with full metadata."},
                ),
            },
            "hidden": {
                "prompt": "PROMPT",
                "extra_pnginfo": "EXTRA_PNGINFO",
            },
        }

    RETURN_TYPES = ()
    FUNCTION = "save_video"
    OUTPUT_NODE = True
    CATEGORY = "Majoor"
    DESCRIPTION = "Save images or video with generation_time_ms metadata for Majoor Assets Manager."

    # ------------------------------------------------------------------ #

    def save_video(
        self,
        filename_prefix: str = "MajoorVideo",
        format: str = "mp4 (h264)",
        images: torch.Tensor | None = None,
        video: Any | None = None,
        frame_rate: float = 24.0,
        loop_count: int = 0,
        generation_time_ms: int = -1,
        audio: dict | None = None,
        crf: int = 19,
        save_first_frame: bool = True,
        prompt: Any | None = None,
        extra_pnginfo: dict | None = None,
    ):
        resolved = _resolve_video_inputs(video, images, audio, frame_rate)
        if resolved is None:
            return {"ui": {"videos": []}}
        resolved_images, resolved_fps, resolved_audio = resolved

        gen_time = generation_time_ms if generation_time_ms >= 0 else _get_generation_time_ms()
        num_frames = resolved_images.size(0)

        full_output_folder, filename, _counter, subfolder, _prefix = (
            folder_paths.get_save_image_path(
                filename_prefix,
                self.output_dir,
                resolved_images[0].shape[1],
                resolved_images[0].shape[0],
            )
        )
        counter = _next_counter(full_output_folder, filename)

        # --- PNG sidecar with full metadata ---
        png_metadata = _build_metadata(prompt, extra_pnginfo, gen_time)

        if save_first_frame:
            sidecar_file = f"{filename}_{counter:05}.png"
            Image.fromarray(_tensor_to_bytes(resolved_images[0])).save(
                os.path.join(full_output_folder, sidecar_file),
                pnginfo=png_metadata,
                compress_level=4,
            )

        # --- GIF / WebP via Pillow ---
        if format in ("gif", "webp"):
            out_file = _save_animated(
                resolved_images, format, resolved_fps, loop_count,
                full_output_folder, filename, counter,
            )
            return {"ui": {"videos": [{"filename": out_file, "subfolder": subfolder, "type": self.type}]}}

        # --- MP4 via PyAV ---
        container_meta = _build_container_metadata(prompt, extra_pnginfo, gen_time)
        out_file = f"{filename}_{counter:05}_.mp4"
        out_path = os.path.join(full_output_folder, out_file)

        _encode_mp4(out_path, resolved_images, resolved_fps, crf, container_meta, resolved_audio, num_frames)

        return {"ui": {"videos": [{"filename": out_file, "subfolder": subfolder, "type": self.type}]}}

# ---------------------------------------------------------------------------
# Registration helpers
# ---------------------------------------------------------------------------

NODE_CLASS_MAPPINGS: dict[str, type] = {
    "MajoorSaveImage": MajoorSaveImage,
    "MajoorSaveVideo": MajoorSaveVideo,
}

NODE_DISPLAY_NAME_MAPPINGS: dict[str, str] = {
    "MajoorSaveImage": "〽️ Majoor Save Image 💾",
    "MajoorSaveVideo": "〽️ Majoor Save Video 🎬",
}
