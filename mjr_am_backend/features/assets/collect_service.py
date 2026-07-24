"""
Collect-files service: bundle an asset, its workflow JSON, the media inputs
referenced by the workflow, and a manifest into a ZIP written next to the
asset (with a safe fallback directory when the folder is not writable).
"""

from __future__ import annotations

import json
import os
import tempfile
import time
import uuid
import zipfile
from pathlib import Path
from typing import Any

from mjr_am_backend.adapters.comfy_core import (
    get_input_directory,
    get_model_full_path,
    get_temp_directory,
)
from mjr_am_backend.config import get_runtime_output_root
from mjr_am_backend.custom_roots import list_custom_roots
from mjr_am_backend.path_utils import is_within_root, safe_rel_path
from mjr_am_backend.shared import Result, get_logger, sanitize_error_message

logger = get_logger(__name__)

MEDIA_INPUT_EXTS = frozenset(
    {
        ".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".tif", ".tiff", ".avif", ".jxl",
        ".mp4", ".webm", ".mov", ".mkv", ".avi", ".m4v",
        ".wav", ".mp3", ".flac", ".ogg", ".m4a", ".aac", ".aiff", ".aif",
    }
)

MODEL_REF_EXTS = (".safetensors", ".ckpt", ".pt", ".pth", ".gguf", ".onnx", ".bin")

_MAX_REFS = 256
_MAX_TOTAL_COPY_BYTES = 4 * 1024 * 1024 * 1024  # 4 GB
_FALLBACK_SUBDIR = "_mjr_collected"
_ANNOTATION_TAGS = {"input", "output", "temp"}


# ---------------------------------------------------------------------------
# Reference extraction
# ---------------------------------------------------------------------------

def _iter_strings(value: Any, depth: int = 0) -> list[str]:
    if depth > 4:
        return []
    if isinstance(value, str):
        return [value]
    out: list[str] = []
    if isinstance(value, list):
        for item in value[:128]:
            out.extend(_iter_strings(item, depth + 1))
    elif isinstance(value, dict):
        for item in list(value.values())[:128]:
            out.extend(_iter_strings(item, depth + 1))
    return out


def _split_annotation(ref: str) -> tuple[str, str]:
    """Split ComfyUI annotated refs like ``sub/img.png [input]``."""
    text = ref.strip()
    if text.endswith("]") and " [" in text:
        name, _, tag = text.rpartition(" [")
        tag = tag[:-1].strip().lower()
        if tag in _ANNOTATION_TAGS:
            return name.strip(), tag
    return text, ""


def _has_ext(text: str, exts: Any) -> bool:
    lower = text.lower().rstrip()
    return any(lower.endswith(ext) for ext in exts)


def extract_workflow_refs(workflow: Any, prompt: Any) -> tuple[list[str], list[str]]:
    """Return (media_refs, model_refs) referenced by a workflow/prompt graph."""
    raw: list[str] = []
    if isinstance(prompt, dict):
        for node in list(prompt.values())[:2048]:
            if isinstance(node, dict):
                raw.extend(_iter_strings(node.get("inputs")))
    if isinstance(workflow, dict):
        nodes = workflow.get("nodes")
        if isinstance(nodes, list):
            for node in nodes[:2048]:
                if isinstance(node, dict):
                    raw.extend(_iter_strings(node.get("widgets_values")))

    media: list[str] = []
    models: list[str] = []
    seen_media: set[str] = set()
    seen_models: set[str] = set()
    for item in raw:
        text = str(item or "").strip()
        if not text or len(text) > 1024 or "\n" in text or "\x00" in text:
            continue
        name, _tag = _split_annotation(text)
        if _has_ext(name, MEDIA_INPUT_EXTS):
            key = text.lower()
            if key not in seen_media and len(media) < _MAX_REFS:
                seen_media.add(key)
                media.append(text)
        elif _has_ext(name, MODEL_REF_EXTS):
            key = name.replace("\\", "/").lower()
            if key not in seen_models and len(models) < _MAX_REFS:
                seen_models.add(key)
                models.append(name)
    return media, models


# ---------------------------------------------------------------------------
# Reference resolution
# ---------------------------------------------------------------------------

def _allowed_roots() -> list[Path]:
    roots: list[Path] = []
    for getter in (get_runtime_output_root, get_input_directory, get_temp_directory):
        try:
            value = getter()
        except Exception:
            value = None
        if value:
            try:
                roots.append(Path(str(value)).resolve(strict=False))
            except Exception:
                continue
    try:
        custom = list_custom_roots()
        if custom.ok:
            for item in custom.data or []:
                root_path = item.get("path") if isinstance(item, dict) else None
                if root_path:
                    try:
                        roots.append(Path(str(root_path)).resolve(strict=False))
                    except Exception:
                        continue
    except Exception:
        logger.debug("Failed to list custom roots for collect", exc_info=True)
    return roots


def _is_in_allowed_roots(path: Path, roots: list[Path]) -> bool:
    for root in roots:
        try:
            if is_within_root(path, root):
                return True
        except Exception:
            continue
    return False


def _resolve_relative_ref(name: str, tag: str) -> Path | None:
    rel = safe_rel_path(name.replace("\\", "/"))
    if rel is None or not rel.parts:
        return None
    bases: list[str | None] = []
    if tag == "output":
        bases = [str(get_runtime_output_root())]
    elif tag == "temp":
        bases = [get_temp_directory()]
    else:
        bases = [get_input_directory(), str(get_runtime_output_root())]
    for base in bases:
        if not base:
            continue
        try:
            candidate = (Path(str(base)) / rel).resolve(strict=True)
        except Exception:
            continue
        if candidate.is_file():
            return candidate
    return None


def resolve_media_refs(refs: list[str]) -> list[dict[str, Any]]:
    """Resolve raw refs to files. Each entry: {ref, name, path, status}."""
    roots = _allowed_roots()
    entries: list[dict[str, Any]] = []
    seen_paths: set[str] = set()
    for ref in refs:
        name, tag = _split_annotation(ref)
        entry: dict[str, Any] = {"ref": ref, "name": Path(name.replace("\\", "/")).name, "path": "", "status": "missing"}
        resolved: Path | None = None
        try:
            if os.path.isabs(name):
                candidate = Path(name)
                try:
                    resolved = candidate.resolve(strict=True)
                except Exception:
                    resolved = None
                if resolved is not None and resolved.is_file():
                    if _is_in_allowed_roots(resolved, roots):
                        entry["status"] = "ok"
                    else:
                        entry["status"] = "skipped_outside_roots"
                    entry["path"] = str(resolved)
                    if entry["status"] != "ok":
                        resolved = None
                else:
                    resolved = None
            else:
                resolved = _resolve_relative_ref(name, tag)
                if resolved is not None:
                    entry["status"] = "ok"
                    entry["path"] = str(resolved)
        except Exception:
            resolved = None

        if resolved is not None:
            key = os.path.normcase(str(resolved))
            if key in seen_paths:
                continue
            seen_paths.add(key)
        entries.append(entry)
    return entries


def resolve_model_refs(refs: list[str]) -> list[dict[str, Any]]:
    entries: list[dict[str, Any]] = []
    for ref in refs:
        path = None
        try:
            path = get_model_full_path(ref)
        except Exception:
            path = None
        entries.append(
            {
                "name": ref,
                "path": str(path) if path else "",
                "status": "located" if path else "not_located",
            }
        )
    return entries


# ---------------------------------------------------------------------------
# Prompt text extraction
# ---------------------------------------------------------------------------

def _geninfo_text(geninfo: dict[str, Any], field: str) -> str:
    value = geninfo.get(field)
    if isinstance(value, dict):
        value = value.get("value")
    if isinstance(value, str) and value.strip():
        return value.strip()
    return ""


def _geninfo_text_list(geninfo: dict[str, Any], field: str) -> list[str]:
    raw = geninfo.get(field)
    if not isinstance(raw, list):
        return []
    out: list[str] = []
    for item in raw[:64]:
        if isinstance(item, str) and item.strip():
            out.append(item.strip())
    return out


def extract_prompt_texts(workflow: Any, prompt: Any) -> dict[str, Any] | None:
    """
    Trace the generation text prompts (positive/negative) from the prompt
    graph / workflow, using the same geninfo parser as the sidebar (text
    encoders, conditioning chains, API nodes, ...). Returns None when no
    prompt text can be traced.
    """
    try:
        from mjr_am_backend.features.geninfo.parser import parse_geninfo_from_prompt

        res = parse_geninfo_from_prompt(prompt, workflow)
    except Exception:
        logger.debug("Collect: prompt text tracing failed", exc_info=True)
        return None
    if not res.ok or not isinstance(res.data, dict):
        return None
    geninfo = res.data

    positive = _geninfo_text(geninfo, "positive")
    negative = _geninfo_text(geninfo, "negative")
    all_positive = _geninfo_text_list(geninfo, "all_positive_prompts")
    all_negative = _geninfo_text_list(geninfo, "all_negative_prompts")
    if not positive and all_positive:
        positive = all_positive[0]
    if not negative and all_negative:
        negative = all_negative[0]
    if not (positive or negative or all_positive or all_negative):
        return None

    payload: dict[str, Any] = {"positive": positive, "negative": negative}
    if len(all_positive) > 1:
        payload["all_positive_prompts"] = all_positive
    if len(all_negative) > 1:
        payload["all_negative_prompts"] = all_negative
    return payload


# ---------------------------------------------------------------------------
# ZIP building
# ---------------------------------------------------------------------------

def _unique_arcname(base: str, used: set[str]) -> str:
    candidate = base
    stem = Path(base).stem
    suffix = Path(base).suffix
    n = 2
    while candidate.lower() in used:
        candidate = f"{stem} ({n}){suffix}"
        n += 1
        if n > 500:
            candidate = f"{stem}_{uuid.uuid4().hex[:8]}{suffix}"
            break
    used.add(candidate.lower())
    return candidate


def _unique_zip_path(directory: Path, stem: str) -> Path:
    base = f"{stem}_collected"
    candidate = directory / f"{base}.zip"
    n = 2
    while candidate.exists():
        candidate = directory / f"{base} ({n}).zip"
        n += 1
        if n > 500:
            return directory / f"{base}_{uuid.uuid4().hex[:8]}.zip"
    return candidate


def _build_manifest(
    asset_path: Path,
    *,
    has_workflow: bool,
    has_prompt: bool,
    prompt_texts: dict[str, Any] | None,
    inputs: list[dict[str, Any]],
    models: list[dict[str, Any]],
) -> str:
    lines: list[str] = []
    lines.append("Majoor Assets Manager - Collected files manifest")
    lines.append(f"Date: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append(f"Asset: {asset_path.name}")
    lines.append(f"Asset path: {asset_path}")
    lines.append(f"Workflow JSON embedded: {'yes' if has_workflow else 'no'}")
    lines.append(f"Prompt graph embedded: {'yes' if has_prompt else 'no'}")
    lines.append(f"Prompt text traced: {'yes (see prompt.json)' if prompt_texts else 'no'}")
    lines.append("")
    lines.append("[Inputs / media]")
    if not inputs:
        lines.append("(none referenced by the workflow)")
    for item in inputs:
        status = {
            "ok": "copied",
            "missing": "MISSING (not found on disk)",
            "skipped_outside_roots": "NOT COPIED (outside allowed folders)",
            "copy_failed": "NOT COPIED (read error)",
        }.get(str(item.get("status")), str(item.get("status")))
        path = item.get("path") or item.get("ref") or ""
        lines.append(f"- {item.get('name')} | {status} | {path}")
    lines.append("")
    lines.append("[Models referenced]")
    if not models:
        lines.append("(none referenced by the workflow)")
    for item in models:
        path = item.get("path") or "not located"
        lines.append(f"- {item.get('name')} | {path}")
    lines.append("")
    return "\n".join(lines)


def _zip_add_file(zf: zipfile.ZipFile, source: Path, arcname: str) -> bool:
    try:
        with open(source, "rb") as f:
            zi = zipfile.ZipInfo(filename=arcname, date_time=time.localtime(time.time())[:6])
            zi.compress_type = zipfile.ZIP_DEFLATED
            with zf.open(zi, "w") as out:
                while True:
                    chunk = f.read(1024 * 1024)
                    if not chunk:
                        break
                    out.write(chunk)
        return True
    except Exception as exc:
        logger.debug("Collect zip: failed to add %s: %s", source, exc)
        return False


def _writable_dest_dir(preferred: Path) -> tuple[Path, bool]:
    """Return (directory, fallback_used). Never raises."""
    try:
        probe = preferred / f".mjr_collect_probe_{uuid.uuid4().hex[:8]}"
        probe.touch()
        probe.unlink()
        return preferred, False
    except Exception:
        pass
    fallback = Path(str(get_runtime_output_root())) / _FALLBACK_SUBDIR
    fallback.mkdir(parents=True, exist_ok=True)
    return fallback, True


def build_collect_zip(
    asset_path: Path,
    *,
    workflow: Any,
    prompt: Any,
) -> Result[dict[str, Any]]:
    """Build the collected ZIP. Blocking: run in a worker thread."""
    try:
        resolved_asset = asset_path.resolve(strict=True)
    except Exception:
        return Result.Err("NOT_FOUND", "Asset file not found")

    media_refs, model_refs = extract_workflow_refs(workflow, prompt)
    inputs = resolve_media_refs(media_refs)
    models = resolve_model_refs(model_refs)
    prompt_texts = extract_prompt_texts(workflow, prompt)

    dest_dir, fallback_used = _writable_dest_dir(resolved_asset.parent)
    zip_path = _unique_zip_path(dest_dir, resolved_asset.stem)

    tmp_path: Path | None = None
    copied = 0
    total_bytes = 0
    try:
        fd, tmp_name = tempfile.mkstemp(prefix=".mjr_collect_", suffix=".zip", dir=str(dest_dir))
        os.close(fd)
        tmp_path = Path(tmp_name)
        used_names: set[str] = set()
        with zipfile.ZipFile(tmp_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
            # 1. The asset itself.
            asset_arc = _unique_arcname(resolved_asset.name, used_names)
            if _zip_add_file(zf, resolved_asset, asset_arc):
                copied += 1

            # 2. Workflow / prompt JSON.
            if isinstance(workflow, dict) and workflow:
                zf.writestr("workflow.json", json.dumps(workflow, indent=2, ensure_ascii=False))
            if isinstance(prompt, dict) and prompt:
                zf.writestr("prompt_graph.json", json.dumps(prompt, indent=2, ensure_ascii=False))
            # prompt.json holds the traced generation text (text encoders / parser).
            if prompt_texts:
                zf.writestr("prompt.json", json.dumps(prompt_texts, indent=2, ensure_ascii=False))

            # 3. Referenced media inputs.
            used_input_names: set[str] = set()
            for item in inputs:
                if item.get("status") != "ok" or not item.get("path"):
                    continue
                source = Path(str(item["path"]))
                try:
                    size = source.stat().st_size
                except Exception:
                    item["status"] = "copy_failed"
                    continue
                if total_bytes + size > _MAX_TOTAL_COPY_BYTES:
                    item["status"] = "skipped_size_limit"
                    continue
                arc = "inputs/" + _unique_arcname(source.name, used_input_names)
                if _zip_add_file(zf, source, arc):
                    total_bytes += size
                    copied += 1
                else:
                    item["status"] = "copy_failed"

            # 4. Manifest.
            manifest = _build_manifest(
                resolved_asset,
                has_workflow=bool(isinstance(workflow, dict) and workflow),
                has_prompt=bool(isinstance(prompt, dict) and prompt),
                prompt_texts=prompt_texts,
                inputs=inputs,
                models=models,
            )
            zf.writestr("collected_files.txt", manifest)

        os.replace(str(tmp_path), str(zip_path))
        tmp_path = None
    except Exception as exc:
        return Result.Err("IO_ERROR", sanitize_error_message(exc, "Failed to build collect zip"))
    finally:
        if tmp_path is not None:
            try:
                tmp_path.unlink()
            except Exception:
                pass

    missing = [item["name"] for item in inputs if item.get("status") == "missing"]
    return Result.Ok(
        {
            "zip_path": str(zip_path),
            "zip_name": zip_path.name,
            "directory": str(dest_dir),
            "fallback_used": fallback_used,
            "copied": copied,
            "inputs": inputs,
            "models": models,
            "missing": missing,
            "has_workflow": bool(isinstance(workflow, dict) and workflow),
            "has_prompt": bool(isinstance(prompt, dict) and prompt),
            "has_prompt_text": bool(prompt_texts),
        }
    )
