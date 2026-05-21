"""Post-execution ingestion from ComfyUI core history into Majoor index."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from ...adapters.comfy_core import PromptOutputFile, get_prompt_output_files, send_event
from ...adapters.core_assets import fetch_by_job_id
from ...config import get_runtime_output_root
from ...shared import Result, get_logger

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
    for path, ref in refs:
        try:
            await db.aexecute(
                "UPDATE assets "
                "SET job_id = ?, source_node_id = COALESCE(NULLIF(?, ''), source_node_id), "
                "source_node_type = COALESCE(NULLIF(?, ''), source_node_type), "
                "updated_at = CURRENT_TIMESTAMP "
                "WHERE filepath = ?",
                (prompt_id, ref.node_id, ref.node_type, str(path)),
            )
        except Exception as exc:
            logger.debug("Failed to assign execution context to indexed output: %s", exc)


async def ingest_prompt_outputs_from_services(services: dict[str, Any] | None, prompt_id: str) -> Result[dict[str, Any]]:
    index_service = (services or {}).get("index") if isinstance(services, dict) else None
    if index_service is None:
        return Result.Err("SERVICE_UNAVAILABLE", "index service unavailable")
    return await ingest_prompt_outputs(index_service, prompt_id)


__all__ = ["ingest_prompt_outputs", "ingest_prompt_outputs_from_services"]
