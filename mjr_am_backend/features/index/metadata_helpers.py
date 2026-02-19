"""
Metadata helpers - shared utilities for metadata operations.
"""
import hashlib
import asyncio
import json
import time
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Tuple, Optional

from ...config import (
    MAX_METADATA_JSON_BYTES,
    METADATA_CACHE_MAX,
    METADATA_CACHE_TTL_SECONDS,
    METADATA_CACHE_CLEANUP_INTERVAL_SECONDS,
)
from ...shared import Result, get_logger
from ...adapters.db.sqlite import Sqlite
from ..metadata.parsing_utils import (
    looks_like_comfyui_workflow,
    looks_like_comfyui_prompt_graph,
    try_parse_json_text,
)

MAX_TAG_LENGTH = 100
logger = get_logger(__name__)
_METADATA_CACHE_CLEANUP_LOCK = asyncio.Lock()
_METADATA_CACHE_LAST_CLEANUP = 0.0


def _metadata_quality_should_upgrade_sql() -> str:
    quality_rank_excluded = (
        "CASE excluded.metadata_quality WHEN 'full' THEN 3 WHEN 'partial' THEN 2 "
        "WHEN 'degraded' THEN 1 ELSE 0 END"
    )
    quality_rank_current = (
        "CASE COALESCE(asset_metadata.metadata_quality, 'none') WHEN 'full' THEN 3 "
        "WHEN 'partial' THEN 2 WHEN 'degraded' THEN 1 ELSE 0 END"
    )
    return f"({quality_rank_excluded} >= {quality_rank_current})"


def _apply_metadata_json_size_guard(
    asset_id: int,
    metadata_result: Result[Dict[str, Any]],
    metadata_raw_json: str,
    filepath: Optional[str] = None,
) -> str:
    max_bytes = _safe_max_metadata_bytes()
    truncated, original_bytes, metadata_raw_json = _truncate_metadata_json_if_needed(
        metadata_raw_json, max_bytes
    )
    if not truncated:
        return metadata_raw_json
    _mark_metadata_truncated(metadata_result, original_bytes=original_bytes, max_bytes=max_bytes)
    _log_metadata_truncation(
        asset_id,
        metadata_result,
        filepath=filepath,
        original_bytes=original_bytes,
        max_bytes=max_bytes,
    )
    return metadata_raw_json


def _safe_max_metadata_bytes() -> int:
    try:
        return int(MAX_METADATA_JSON_BYTES or 0)
    except Exception:
        return 0


def _truncate_metadata_json_if_needed(metadata_raw_json: str, max_bytes: int) -> tuple[bool, int, str]:
    if not (max_bytes and isinstance(metadata_raw_json, str)):
        return False, 0, metadata_raw_json
    try:
        nbytes = len(metadata_raw_json.encode("utf-8", errors="ignore"))
    except Exception:
        nbytes = 0
    if nbytes <= max_bytes:
        return False, 0, metadata_raw_json
    try:
        truncated = json.dumps(
            {"_truncated": True, "original_bytes": int(nbytes)},
            ensure_ascii=False,
            separators=(",", ":"),
        )
    except Exception:
        truncated = "{}"
    return True, int(nbytes), truncated


def _mark_metadata_truncated(metadata_result: Result[Dict[str, Any]], *, original_bytes: int, max_bytes: int) -> None:
    try:
        metadata_result.meta["truncated"] = True
        metadata_result.meta["original_bytes"] = int(original_bytes)
        metadata_result.meta["max_bytes"] = int(max_bytes)
    except Exception:
        return


def _resolve_metadata_filepath(
    metadata_result: Result[Dict[str, Any]], filepath: Optional[str]
) -> Optional[str]:
    if filepath:
        return filepath
    if metadata_result and isinstance(metadata_result.data, dict):
        fp = metadata_result.data.get("filepath")
        return fp if isinstance(fp, str) and fp else None
    return None


def _log_metadata_truncation(
    asset_id: int,
    metadata_result: Result[Dict[str, Any]],
    *,
    filepath: Optional[str],
    original_bytes: int,
    max_bytes: int,
) -> None:
    try:
        fp = _resolve_metadata_filepath(metadata_result, filepath)
        suffix = f" filepath={fp}" if fp else ""
        logger.warning(
            "Metadata JSON truncated for asset_id=%s%s (bytes=%s > max=%s)",
            asset_id,
            suffix,
            original_bytes,
            max_bytes,
        )
    except Exception:
        return


def _sanitize_metadata_tags(raw_tags: Any) -> list[str]:
    if not isinstance(raw_tags, list):
        return []
    cleaned: list[str] = []
    seen: set[str] = set()
    for item in raw_tags:
        if not isinstance(item, str):
            continue
        tag = item.strip()
        if not tag or len(tag) > MAX_TAG_LENGTH or tag in seen:
            continue
        seen.add(tag)
        cleaned.append(tag)
    return cleaned


def _extract_rating_and_tags(metadata_result: Result[Dict[str, Any]]) -> tuple[int, str, str]:
    extracted_rating = 0
    extracted_tags_json = "[]"
    extracted_tags_text = ""
    if not (metadata_result and metadata_result.ok and metadata_result.data):
        return extracted_rating, extracted_tags_json, extracted_tags_text

    meta = metadata_result.data
    try:
        rating_val = meta.get("rating")
        if rating_val is not None:
            extracted_rating = max(0, min(5, int(rating_val)))
    except Exception:
        extracted_rating = 0

    try:
        cleaned = _sanitize_metadata_tags(meta.get("tags"))
        extracted_tags_json = json.dumps(cleaned, ensure_ascii=False)
        extracted_tags_text = " ".join(cleaned)
    except Exception:
        extracted_tags_json = "[]"
        extracted_tags_text = ""
    return extracted_rating, extracted_tags_json, extracted_tags_text


def _collect_geninfo_extras(meta: Dict[str, Any]) -> list[str]:
    extras: list[str] = []
    geninfo = meta.get("geninfo")
    if not isinstance(geninfo, dict):
        return extras

    extras.extend(_collect_named_values(geninfo.get("models"), "name"))
    extras.extend(_collect_named_values(geninfo.get("loras"), "name"))
    extras.extend(_collect_nested_text_values(geninfo, [("positive", "value"), ("engine", "type")]))
    extras.extend(_collect_input_filenames(geninfo.get("inputs")))
    return extras


def _collect_named_values(container: Any, field: str) -> list[str]:
    out: list[str] = []
    values: list[Any]
    if isinstance(container, dict):
        values = list(container.values())
    elif isinstance(container, list):
        values = container
    else:
        return out
    for item in values:
        if not isinstance(item, dict):
            continue
        value = str(item.get(field) or "").strip()
        if value:
            out.append(value)
    return out


def _collect_nested_text_values(geninfo: Dict[str, Any], paths: list[tuple[str, str]]) -> list[str]:
    out: list[str] = []
    for parent_key, child_key in paths:
        parent = geninfo.get(parent_key)
        if not isinstance(parent, dict):
            continue
        value = str(parent.get(child_key) or "").strip()
        if value:
            out.append(value)
    return out


def _collect_input_filenames(inputs: Any) -> list[str]:
    out: list[str] = []
    if not isinstance(inputs, list):
        return out
    for item in inputs:
        if not isinstance(item, dict):
            continue
        fname = str(item.get("filename") or "").strip()
        if fname:
            out.append(fname)
    return out


def _enrich_tags_text_with_metadata(
    metadata_result: Result[Dict[str, Any]],
    extracted_tags_text: str,
) -> str:
    if not (metadata_result and metadata_result.ok and metadata_result.data):
        return extracted_tags_text
    meta = metadata_result.data
    extras = _collect_geninfo_extras(meta)
    extracted_tags_text = _append_extra_tags(extracted_tags_text, extras)
    _build_metadata_payload_preview(meta, extracted_tags_text, extras)
    return extracted_tags_text


def _append_extra_tags(extracted_tags_text: str, extras: list[str]) -> str:
    if not extras:
        return extracted_tags_text
    extra_text = " ".join(extras)
    if extracted_tags_text:
        return f"{extracted_tags_text} {extra_text}"
    return extra_text


def _build_metadata_payload_preview(meta: Dict[str, Any], extracted_tags_text: str, extras: list[str]) -> None:
    # Keep this payload preparation for parity with previous behavior.
    meta_fields = [extracted_tags_text] + extras
    if meta.get("prompt"):
        meta_fields.append(str(meta.get("prompt")))
    if meta.get("parameters"):
        meta_fields.append(str(meta.get("parameters")))
    if meta.get("model"):
        meta_fields.append(str(meta.get("model")))
    if meta.get("workflow_type"):
        meta_fields.append(str(meta.get("workflow_type")))
    if meta.get("metadata_raw"):
        meta_fields.append(str(meta.get("metadata_raw")))
    " ".join([str(f) for f in meta_fields if f])


def _graph_has_sampler(graph: Any) -> bool:
    try:
        # Workflow export: dict with `nodes: []` and nodes have `type`.
        if isinstance(graph, dict) and isinstance(graph.get("nodes"), list):
            for node in graph.get("nodes") or []:
                if _node_looks_like_sampler(node, require_sampling_inputs=False):
                    return True
            return False

        # Prompt graph: dict of nodes with `class_type`.
        if isinstance(graph, dict):
            for node in graph.values():
                if _node_looks_like_sampler(node, require_sampling_inputs=True):
                    return True
            return False
    except Exception:
        return False
    return False


def _node_looks_like_sampler(node: Any, *, require_sampling_inputs: bool) -> bool:
    if not isinstance(node, dict):
        return False
    ct = _sampler_class_type(node)
    if not ct or not _sampler_class_matches(ct):
        return False
    if not require_sampling_inputs:
        return True
    return _sampler_inputs_look_sampling(node.get("inputs"))


def _sampler_class_type(node: Dict[str, Any]) -> str:
    return str(node.get("class_type") or node.get("type") or "").lower()


def _sampler_class_matches(ct: str) -> bool:
    if "select" in ct:
        return False
    if "ksampler" in ct or "samplercustom" in ct:
        return True
    return "sampler" in ct


def _sampler_inputs_look_sampling(inputs: Any) -> bool:
    if not isinstance(inputs, dict):
        return False
    return any(key in inputs for key in ("steps", "cfg", "cfg_scale", "seed", "denoise"))


def _coerce_json_dict(value: Any) -> Optional[Dict[str, Any]]:
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        parsed = try_parse_json_text(value)
        return parsed if isinstance(parsed, dict) else None
    return None


def _metadata_presence_flags(meta: Dict[str, Any]) -> Tuple[bool, bool]:
    raw_workflow = meta.get("workflow")
    raw_prompt = meta.get("prompt")
    workflow_obj = _coerce_json_dict(raw_workflow)
    prompt_obj = _coerce_json_dict(raw_prompt)

    has_workflow = _has_workflow_payload(meta, raw_workflow, raw_prompt, workflow_obj, prompt_obj)
    has_generation_data = _has_generation_payload(meta, raw_workflow, raw_prompt, workflow_obj, prompt_obj)
    return has_workflow, has_generation_data


def _has_workflow_payload(
    meta: Dict[str, Any],
    raw_workflow: Any,
    raw_prompt: Any,
    workflow_obj: Optional[Dict[str, Any]],
    prompt_obj: Optional[Dict[str, Any]],
) -> bool:
    workflow_ok = bool(workflow_obj and looks_like_comfyui_workflow(workflow_obj))
    prompt_ok = bool(prompt_obj and looks_like_comfyui_prompt_graph(prompt_obj))
    return bool(workflow_ok or prompt_ok or raw_workflow or raw_prompt or meta.get("parameters"))


def _has_generation_payload(
    meta: Dict[str, Any],
    raw_workflow: Any,
    raw_prompt: Any,
    workflow_obj: Optional[Dict[str, Any]],
    prompt_obj: Optional[Dict[str, Any]],
) -> bool:
    if meta.get("parameters") or meta.get("geninfo") or meta.get("model") or meta.get("seed"):
        return True
    if _graph_has_sampler(prompt_obj or raw_prompt):
        return True
    return _graph_has_sampler(workflow_obj or raw_workflow)


class MetadataHelpers:
    """
    Shared utilities for metadata operations.

    Provides static methods for metadata caching, field preparation,
    and error handling that are used across multiple components.
    """

    @staticmethod
    def prepare_metadata_fields(metadata_result: Result[Dict[str, Any]]) -> Tuple[Optional[bool], Optional[bool], str, str]:
        """
        Extract the workflow/generation metadata attributes and JSON payload.

        Args:
            metadata_result: Result from metadata extraction

        Returns:
            Tuple of (has_workflow, has_generation_data, metadata_quality, metadata_raw_json)
        """
        has_workflow: Optional[bool] = None
        has_generation_data: Optional[bool] = None
        metadata_quality = "none"
        metadata_raw_json = "{}"

        if metadata_result and metadata_result.ok and isinstance(metadata_result.data, dict) and metadata_result.data:
            meta = metadata_result.data
            has_workflow, has_generation_data = _metadata_presence_flags(meta)

            metadata_quality = meta.get("quality", "none")
            metadata_raw_json = json.dumps(meta)

        return has_workflow, has_generation_data, metadata_quality, metadata_raw_json

    @staticmethod
    def _bool_to_db(value: Optional[bool]) -> Optional[int]:
        if value is True:
            return 1
        if value is False:
            return 0
        return None

    @staticmethod
    def metadata_error_payload(metadata_result: Result[Dict[str, Any]], filepath: str) -> Result[Dict[str, Any]]:
        """
        Build a degraded metadata payload when extraction failed.

        Args:
            metadata_result: Failed result from metadata extraction
            filepath: File path for context

        Returns:
            Result with degraded payload
        """
        quality = metadata_result.meta.get("quality", "degraded")
        payload = {
            "filepath": filepath,
            "error": metadata_result.error or "Metadata extraction failed",
            "code": metadata_result.code,
            # Persist quality in the payload so downstream DB writes can avoid treating
            # degraded results as "none" and inadvertently downgrading existing metadata.
            "quality": quality,
        }

        for key, value in metadata_result.meta.items():
            if key == "quality" or value is None:
                continue
            payload[key] = value

        return Result.Ok(payload, quality=quality)

    @staticmethod
    async def write_asset_metadata_row(
        db: Sqlite,
        asset_id: int,
        metadata_result: Result[Dict[str, Any]],
        filepath: Optional[str] = None,
    ) -> Result[Any]:
        """
        Insert or update the asset_metadata row with the latest metadata flags.

        Args:
            db: Database adapter instance
            asset_id: Asset ID to update
            metadata_result: Result from metadata extraction

        Returns:
            Result from database operation
        """
        has_workflow, has_generation_data, metadata_quality, metadata_raw_json = MetadataHelpers.prepare_metadata_fields(metadata_result)
        db_has_workflow = MetadataHelpers._bool_to_db(has_workflow)
        db_has_generation = MetadataHelpers._bool_to_db(has_generation_data)

        metadata_raw_json = _apply_metadata_json_size_guard(
            asset_id,
            metadata_result,
            metadata_raw_json,
            filepath=filepath,
        )
        extracted_rating, extracted_tags_json, extracted_tags_text = _extract_rating_and_tags(metadata_result)
        extracted_tags_text = _enrich_tags_text_with_metadata(metadata_result, extracted_tags_text)

        # Import existing OS/file metadata when DB has defaults, without overriding user edits.
        # - rating: only set if current rating is 0
        # - tags: only set if current tags are empty ('[]' or '')
        # Never downgrade metadata flags/raw on transient tool failures.
        # We keep the best known metadata_quality for a file unless a newer extraction
        # yields an equal-or-better quality. This prevents counters/progress from
        # "going backwards" during background enrichment retries.
        should_upgrade = _metadata_quality_should_upgrade_sql()

        return await db.aexecute(
            """
            INSERT INTO asset_metadata
            (asset_id, rating, tags, tags_text, has_workflow, has_generation_data, metadata_quality, metadata_raw)
            SELECT ?, ?, ?, ?, ?, ?, ?, ?
            WHERE EXISTS (SELECT 1 FROM assets WHERE id = ?)
            ON CONFLICT(asset_id) DO UPDATE SET
                rating = CASE
                    WHEN COALESCE(asset_metadata.rating, 0) = 0 THEN excluded.rating
                    ELSE asset_metadata.rating
                END,
                tags = CASE
                    WHEN COALESCE(asset_metadata.tags, '[]') IN ('[]', '') THEN excluded.tags
                    ELSE asset_metadata.tags
                END,
                tags_text = CASE
                    WHEN COALESCE(asset_metadata.tags, '[]') IN ('[]', '') THEN excluded.tags_text
                    ELSE asset_metadata.tags_text
                END,
                has_workflow = CASE
                    WHEN {should_upgrade} THEN excluded.has_workflow
                    ELSE asset_metadata.has_workflow
                END,
                has_generation_data = CASE
                    WHEN {should_upgrade} THEN excluded.has_generation_data
                    ELSE asset_metadata.has_generation_data
                END,
                metadata_quality = CASE
                    WHEN {should_upgrade} THEN excluded.metadata_quality
                    ELSE asset_metadata.metadata_quality
                END,
                metadata_raw = CASE
                    WHEN {should_upgrade} THEN excluded.metadata_raw
                    ELSE asset_metadata.metadata_raw
                END
            WHERE EXISTS (SELECT 1 FROM assets WHERE id = excluded.asset_id)
            """.format(should_upgrade=should_upgrade),
            (
                asset_id,
                extracted_rating,
                extracted_tags_json,
                extracted_tags_text,
                db_has_workflow,
                db_has_generation,
                metadata_quality,
                metadata_raw_json,
                asset_id,
            ),
        )

    @staticmethod
    async def refresh_metadata_if_needed(
        db: Sqlite,
        asset_id: int,
        metadata_result: Result[Dict[str, Any]],
        filepath: str,
        base_dir: str,
        state_hash: str,
        mtime: int,
        size: int,
        write_journal_fn,
    ) -> bool:
        """
        Re-run metadata extraction for unchanged files if the metadata flags changed.

        Args:
            db: Database adapter instance
            asset_id: Asset ID to check
            metadata_result: New metadata result
            filepath: File path
            base_dir: Base directory
            state_hash: State hash for journaling
            mtime: File modification time
            size: File size
            write_journal_fn: Function to write journal entry

        Returns:
            True if metadata was refreshed, False otherwise
        """
        async with db.lock_for_asset(asset_id):
            result = await db.aquery(
                "SELECT has_workflow, has_generation_data, metadata_raw FROM asset_metadata WHERE asset_id = ?",
                (asset_id,)
            )
            if not result.ok:
                return False

            current = result.data[0] if result.data else None
            new_has_workflow, new_has_generation_data, _, new_metadata_raw = MetadataHelpers.prepare_metadata_fields(metadata_result)
            new_has_workflow_db = MetadataHelpers._bool_to_db(new_has_workflow)
            new_has_generation_db = MetadataHelpers._bool_to_db(new_has_generation_data)

            current_has_workflow = current.get("has_workflow") if current else None
            current_has_generation = current.get("has_generation_data") if current else None
            current_raw = current["metadata_raw"] if current else ""

            if (current_has_workflow == new_has_workflow_db and
                    current_has_generation == new_has_generation_db and
                    current_raw == new_metadata_raw):
                return False

            write_result = await MetadataHelpers.write_asset_metadata_row(db, asset_id, metadata_result, filepath=filepath)
            if write_result.ok:
                # We assume write_journal_fn is async now
                await write_journal_fn(filepath, base_dir, state_hash, mtime, size)
            return write_result.ok

    @staticmethod
    async def retrieve_cached_metadata(db: Sqlite, filepath: str, state_hash: str) -> Optional[Result[Dict[str, Any]]]:
        """
        Retrieve metadata from cache if available.

        Args:
            db: Database adapter instance
            filepath: File path
            state_hash: State hash to validate cache

        Returns:
            Cached metadata result or None if not found
        """
        if not state_hash:
            return None

        result = await db.aquery(
            "SELECT metadata_raw FROM metadata_cache WHERE filepath = ? AND state_hash = ?",
            (filepath, state_hash)
        )

        if not result.ok or not result.data:
            return None

        raw = result.data[0].get("metadata_raw")
        if not raw:
            return None

        try:
            payload = json.loads(raw)
            return Result.Ok(payload, source="cache")
        except json.JSONDecodeError:
            return None

    @staticmethod
    async def _maybe_cleanup_metadata_cache(db: Sqlite) -> None:
        global _METADATA_CACHE_LAST_CLEANUP
        max_entries, ttl_seconds, interval = _cache_cleanup_config()

        if max_entries <= 0 and ttl_seconds <= 0:
            return

        now = time.time()
        if interval > 0 and (now - _METADATA_CACHE_LAST_CLEANUP) < interval:
            return

        async with _METADATA_CACHE_CLEANUP_LOCK:
            now = time.time()
            if interval > 0 and (_METADATA_CACHE_LAST_CLEANUP and (now - _METADATA_CACHE_LAST_CLEANUP) < interval):
                return
            _METADATA_CACHE_LAST_CLEANUP = now

            if ttl_seconds > 0:
                await _cleanup_cache_by_ttl(db, ttl_seconds)

            if max_entries > 0:
                await _cleanup_cache_by_max_entries(db, max_entries)

    @staticmethod
    async def store_metadata_cache(db: Sqlite, filepath: str, state_hash: str, metadata_result: Result[Dict[str, Any]]) -> Result[Any]:
        """
        Store metadata in cache for future use.
        """
        if not metadata_result.ok or not metadata_result.data:
            return Result.Err("CACHE_SKIPPED", "No metadata to cache")

        metadata_raw = MetadataHelpers._metadata_json_payload(metadata_result.data)
        size_check = MetadataHelpers._metadata_payload_size_guard(metadata_raw, filepath)
        if size_check is not None:
            return size_check
        metadata_hash = MetadataHelpers.compute_metadata_hash(metadata_raw)

        write_res = await db.aexecute(
            """
            INSERT INTO metadata_cache
            (filepath, state_hash, metadata_hash, metadata_raw)
            SELECT ?, ?, ?, ?
            WHERE EXISTS (SELECT 1 FROM assets WHERE filepath = ?)
            ON CONFLICT(filepath) DO UPDATE SET
                state_hash = excluded.state_hash,
                metadata_hash = excluded.metadata_hash,
                metadata_raw = excluded.metadata_raw,
                last_updated = CURRENT_TIMESTAMP
            WHERE EXISTS (SELECT 1 FROM assets WHERE filepath = excluded.filepath)
            """,
            (filepath, state_hash, metadata_hash, metadata_raw, filepath)
        )
        try:
            await MetadataHelpers._maybe_cleanup_metadata_cache(db)
        except Exception:
            pass
        return write_res

    @staticmethod
    def _metadata_json_payload(metadata: Dict[str, Any]) -> str:
        return json.dumps(
            metadata,
            ensure_ascii=False,
            separators=(",", ":"),
            sort_keys=True,
        )

    @staticmethod
    def _metadata_payload_size_guard(metadata_raw: str, filepath: str) -> Optional[Result[Any]]:
        max_bytes = MetadataHelpers._max_metadata_json_bytes()
        if not max_bytes:
            return None
        nbytes = MetadataHelpers._metadata_payload_size_bytes(metadata_raw)
        if nbytes <= max_bytes:
            return None
        MetadataHelpers._log_metadata_payload_too_large(filepath, nbytes, max_bytes)
        return Result.Err(
            "CACHE_SKIPPED",
            "Metadata JSON too large to cache",
            original_bytes=int(nbytes),
            max_bytes=int(max_bytes),
        )

    @staticmethod
    def _max_metadata_json_bytes() -> int:
        try:
            return int(MAX_METADATA_JSON_BYTES or 0)
        except Exception:
            return 0

    @staticmethod
    def _metadata_payload_size_bytes(metadata_raw: str) -> int:
        try:
            return len(metadata_raw.encode("utf-8", errors="ignore"))
        except Exception:
            return 0

    @staticmethod
    def _log_metadata_payload_too_large(filepath: str, nbytes: int, max_bytes: int) -> None:
        try:
            logger.warning(
                "Metadata cache skipped (payload too large) for %s (bytes=%s > max=%s)",
                filepath,
                int(nbytes),
                int(max_bytes),
            )
        except Exception:
            pass

    @staticmethod
    def compute_metadata_hash(raw_json: str) -> str:
        return hashlib.md5(raw_json.encode("utf-8")).hexdigest()

    @staticmethod
    async def set_metadata_value(db: Sqlite, key: str, value: str) -> Result[Any]:
        return await db.aexecute(
            "INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)",
            (key, value)
        )


def _cache_cleanup_config() -> tuple[int, float, float]:
    try:
        max_entries = int(METADATA_CACHE_MAX or 0)
    except Exception:
        max_entries = 0
    try:
        ttl_seconds = float(METADATA_CACHE_TTL_SECONDS or 0)
    except Exception:
        ttl_seconds = 0.0
    try:
        interval = float(METADATA_CACHE_CLEANUP_INTERVAL_SECONDS or 0)
    except Exception:
        interval = 0.0
    return max_entries, ttl_seconds, interval


async def _cleanup_cache_by_ttl(db: Sqlite, ttl_seconds: float) -> None:
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(seconds=ttl_seconds)
        cutoff_str = cutoff.strftime("%Y-%m-%d %H:%M:%S")
        await db.aexecute("DELETE FROM metadata_cache WHERE last_updated < ?", (cutoff_str,))
    except Exception:
        return


async def _cleanup_cache_by_max_entries(db: Sqlite, max_entries: int) -> None:
    try:
        count_res = await db.aquery("SELECT COUNT(1) AS count FROM metadata_cache")
        total = int(count_res.data[0].get("count") or 0) if count_res.ok and count_res.data else 0
        if total <= max_entries:
            return
        to_remove = max(0, total - max_entries)
        if not to_remove:
            return
        await db.aexecute(
            """
            DELETE FROM metadata_cache
            WHERE filepath IN (
                SELECT filepath
                FROM metadata_cache
                ORDER BY last_updated ASC
                LIMIT ?
            )
            """,
            (to_remove,),
        )
    except Exception:
        return
