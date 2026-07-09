"""Post-execution ingestion from ComfyUI core history into Majoor index."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from ...adapters.comfy_core import (
    PromptOutputFile,
    get_prompt_metadata_for_prompt,
    get_prompt_output_files,
    get_workflow_id_for_prompt,
    send_event,
)
from ...adapters.core_assets import fetch_by_job_id
from ...config import get_runtime_output_root
from ...shared import Result, get_logger
from ..geninfo.parser_impl import parse_geninfo_from_prompt
from ..index.metadata_helpers import MetadataHelpers

logger = get_logger(__name__)


def _existing_refs(refs: list[PromptOutputFile]) -> list[tuple[Path, PromptOutputFile]]:
    out: list[tuple[Path, PromptOutputFile]] = []
    seen: set[str] = set()
    for ref in refs:
        try:
            path = Path(str(ref.path)).resolve(strict=False)
        except Exception:
            continue
        key = str(path)
        if key in seen or not path.is_file():
            continue
        seen.add(key)
        out.append((path, ref))
    return out


def _base_dir_for_paths(paths: list[Path]) -> str:
    try:
        output_root = Path(str(get_runtime_output_root())).resolve(strict=False)
        if all(path == output_root or output_root in path.parents for path in paths):
            return str(output_root)
    except Exception:
        pass
    try:
        return str(os.path.commonpath([str(path) for path in paths]))
    except Exception:
        try:
            return str(paths[0].parent)
        except Exception:
            return str(get_runtime_output_root())


async def ingest_prompt_outputs(index_service: Any, prompt_id: str) -> Result[dict[str, Any]]:
    """Index files produced by one ComfyUI prompt using core history."""
    safe_prompt_id = str(prompt_id or "").strip()
    if not safe_prompt_id:
        return Result.Err("INVALID_INPUT", "prompt_id is required")

    refs = _existing_refs(await _collect_prompt_output_files(safe_prompt_id))
    if not refs:
        payload = {"prompt_id": safe_prompt_id, "indexed": 0, "paths": []}
        send_event("mjr-core-execution-assets-ready", payload)
        return Result.Ok(payload)

    paths = [path for path, _ref in refs]
    base_dir = _base_dir_for_paths(paths)
    index_paths = getattr(index_service, "index_paths", None)
    if not callable(index_paths):
        return Result.Err("SERVICE_UNAVAILABLE", "index service does not support index_paths")

    result = await index_paths(
        paths,
        base_dir=base_dir,
        incremental=True,
        source="output",
        root_id=None,
    )
    if not result.ok:
        return Result.Err(result.code or "INDEX_ERROR", result.error or "Failed to index prompt outputs")

    await _assign_execution_context(index_service, refs, safe_prompt_id)
    await _write_runtime_metadata(index_service, refs, safe_prompt_id)
    await _assign_rodin_package_context(index_service, refs, safe_prompt_id)
    await _finalize_execution_stack(index_service, safe_prompt_id)
    payload = {
        "prompt_id": safe_prompt_id,
        "indexed": len(paths),
        "paths": [str(path) for path in paths],
        "stats": result.data if isinstance(result.data, dict) else {},
    }
    send_event("mjr-core-execution-assets-ready", payload)
    return Result.Ok(payload)


async def _collect_prompt_output_files(prompt_id: str) -> list[PromptOutputFile]:
    refs = list(get_prompt_output_files(prompt_id))
    seen = {str(ref.path) for ref in refs if str(ref.path or "").strip()}
    try:
        core_refs = await fetch_by_job_id(prompt_id)
    except Exception as exc:
        logger.debug("Core asset prompt lookup skipped for prompt_id=%s: %s", prompt_id, exc)
        core_refs = []
    for core_ref in core_refs:
        file_path = str(getattr(core_ref, "file_path", "") or "").strip()
        if not file_path or file_path in seen:
            continue
        seen.add(file_path)
        refs.append(
            PromptOutputFile(
                path=file_path,
                node_id="",
                node_type="",
                item_type="output",
            )
        )
    return refs


async def _assign_execution_context(
    index_service: Any,
    refs: list[tuple[Path, PromptOutputFile]],
    prompt_id: str,
) -> None:
    db = getattr(index_service, "db", None)
    if db is None or not refs:
        return
    # Looked up once per prompt — extract_workflow_id touches ComfyUI history.
    try:
        workflow_id = get_workflow_id_for_prompt(prompt_id)
    except Exception:
        workflow_id = None
    for path, ref in refs:
        try:
            await db.aexecute(
                "UPDATE assets "
                "SET job_id = ?, source_node_id = COALESCE(NULLIF(?, ''), source_node_id), "
                "source_node_type = COALESCE(NULLIF(?, ''), source_node_type), "
                "workflow_id = COALESCE(NULLIF(?, ''), workflow_id), "
                "updated_at = CURRENT_TIMESTAMP "
                "WHERE filepath = ?",
                (prompt_id, ref.node_id, ref.node_type, workflow_id or "", str(path)),
            )
        except Exception as exc:
            logger.debug("Failed to assign execution context to indexed output: %s", exc)


def _runtime_metadata_payload(prompt_id: str) -> dict[str, Any]:
    payload = get_prompt_metadata_for_prompt(prompt_id)
    if not payload:
        return {}
    out = dict(payload)
    out["quality"] = "full"
    out["job_id"] = prompt_id
    out["prompt_id"] = prompt_id
    try:
        geninfo_res = parse_geninfo_from_prompt(out.get("prompt"), workflow=out.get("workflow"))
        if geninfo_res.ok and geninfo_res.data:
            out["geninfo"] = geninfo_res.data
    except Exception:
        logger.debug("Runtime geninfo parse skipped for prompt_id=%s", prompt_id, exc_info=True)
    return out


async def _write_runtime_metadata(
    index_service: Any,
    refs: list[tuple[Path, PromptOutputFile]],
    prompt_id: str,
) -> None:
    db = getattr(index_service, "db", None)
    if db is None or not refs:
        return
    metadata = _runtime_metadata_payload(prompt_id)
    if not metadata:
        return
    metadata_result: Result[dict[str, Any]] = Result.Ok(metadata, quality="full", source="comfy_history")
    for path, _ref in refs:
        try:
            row = await db.aquery("SELECT id FROM assets WHERE filepath = ? LIMIT 1", (str(path),))
            if not row.ok or not row.data:
                continue
            asset_id = int(row.data[0].get("id") or 0)
            if asset_id:
                await MetadataHelpers.write_asset_metadata_row(db, asset_id, metadata_result, filepath=str(path))
        except Exception as exc:
            logger.debug("Failed to write runtime metadata for indexed output: %s", exc)


def _is_rodin_final_glb(path: Path) -> bool:
    name = path.name.lower()
    return path.suffix.lower() == ".glb" and name.startswith("rodin3d_")


def _rodin_package_candidates(path: Path) -> list[Path]:
    try:
        output_root = Path(str(get_runtime_output_root())).resolve(strict=False)
    except Exception:
        output_root = path.parent.parent
    try:
        stat = path.stat()
    except OSError:
        return []
    candidates: list[Path] = []
    for folder in output_root.glob("Rodin3D_Gen25_*"):
        if not folder.is_dir():
            continue
        base_glb = folder / "base_basic_shaded.glb"
        preview = folder / "preview.webp"
        try:
            base_stat = base_glb.stat()
        except OSError:
            continue
        if int(base_stat.st_size) != int(stat.st_size):
            continue
        if abs(float(base_stat.st_mtime) - float(stat.st_mtime)) > 10:
            continue
        candidates.append(base_glb)
        if preview.is_file():
            candidates.append(preview)
    return candidates


async def _assign_rodin_package_context(
    index_service: Any,
    refs: list[tuple[Path, PromptOutputFile]],
    prompt_id: str,
) -> None:
    db = getattr(index_service, "db", None)
    if db is None or not callable(getattr(db, "aexecute", None)):
        return
    for path, ref in refs:
        if not _is_rodin_final_glb(path):
            continue
        for candidate in _rodin_package_candidates(path):
            try:
                await db.aexecute(
                    "UPDATE assets "
                    "SET job_id = ?, source_node_id = COALESCE(NULLIF(?, ''), source_node_id), "
                    "source_node_type = COALESCE(NULLIF(?, ''), source_node_type), "
                    "updated_at = CURRENT_TIMESTAMP "
                    "WHERE filepath = ?",
                    (prompt_id, ref.node_id, ref.node_type, str(candidate).lower()),
                )
            except Exception as exc:
                logger.debug("Failed to assign Rodin package context: %s", exc)


async def _finalize_execution_stack(index_service: Any, prompt_id: str) -> None:
    db = getattr(index_service, "db", None)
    if db is None:
        return
    try:
        from ..stacks import StacksService

        await StacksService(db).auto_stack_by_job_id(prompt_id)
    except Exception as exc:
        logger.debug("Failed to finalize execution stack for prompt_id=%s: %s", prompt_id, exc)


async def ingest_prompt_outputs_from_services(services: dict[str, Any] | None, prompt_id: str) -> Result[dict[str, Any]]:
    index_service = (services or {}).get("index") if isinstance(services, dict) else None
    if index_service is None:
        return Result.Err("SERVICE_UNAVAILABLE", "index service unavailable")
    return await ingest_prompt_outputs(index_service, prompt_id)


__all__ = ["ingest_prompt_outputs", "ingest_prompt_outputs_from_services"]
