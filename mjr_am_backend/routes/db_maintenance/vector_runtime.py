"""Vector backfill and duplicate-cleanup helpers extracted from db_maintenance routes."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from ...shared import FileKind, Result
from ..core import safe_error_message


def normalize_asset_row_for_case_cleanup(row: dict) -> tuple[int, str]:
    try:
        asset_id = int(row.get("id") or 0)
    except Exception:
        return 0, ""
    if asset_id <= 0:
        return 0, ""
    key = str(row.get("filepath") or "").strip().lower()
    if not key:
        return 0, ""
    return asset_id, key


def collect_case_duplicate_ids(rows: list[dict]) -> tuple[int, list[int], int]:
    keep_ids: set[int] = set()
    delete_ids: list[int] = []
    groups = 0
    current_key = None
    seen_in_group = 0

    for row in rows:
        asset_id, key = normalize_asset_row_for_case_cleanup(row)
        if asset_id <= 0 or not key:
            continue
        if key != current_key:
            if seen_in_group > 1:
                groups += 1
            current_key = key
            seen_in_group = 1
            keep_ids.add(asset_id)
            continue
        delete_ids.append(asset_id)
        seen_in_group += 1

    if seen_in_group > 1:
        groups += 1
    return groups, delete_ids, len(keep_ids)


async def cleanup_assets_case_duplicates(db) -> Result[dict[str, int]]:
    """
    Remove duplicate assets that differ only by filepath casing.

    Keeps the most recent row per normalized filepath (mtime DESC, id DESC),
    then deletes other rows. Intended for Windows environments where paths are
    case-insensitive.
    """
    try:
        rows_res = await db.aquery(
            """
            SELECT id, filepath, mtime
            FROM assets
            WHERE filepath IS NOT NULL AND filepath != ''
            ORDER BY lower(filepath), mtime DESC, id DESC
            """
        )
        if not rows_res.ok:
            return Result.Err("DB_ERROR", rows_res.error or "Failed to scan assets for duplicates")
        rows = rows_res.data or []
        if not rows:
            return Result.Ok({"groups": 0, "deleted": 0, "kept": 0})

        groups, delete_ids, kept_count = collect_case_duplicate_ids(rows)

        if not delete_ids:
            return Result.Ok({"groups": 0, "deleted": 0, "kept": kept_count})

        placeholders = ",".join("?" for _ in delete_ids)
        del_res = await db.aexecute(f"DELETE FROM assets WHERE id IN ({placeholders})", tuple(delete_ids))
        if not del_res.ok:
            return Result.Err("DB_ERROR", del_res.error or "Failed to delete duplicate assets")

        return Result.Ok({"groups": int(groups), "deleted": len(delete_ids), "kept": kept_count})
    except Exception as exc:
        return Result.Err("DB_ERROR", safe_error_message(exc, "Failed to cleanup case duplicates"))


def extract_filename_prefix(filename: str) -> str:
    """
    Extract the base prefix of a filename for sibling grouping.

    Examples:
      - "ltx-23_audio_00001.png" -> "ltx-23_audio_00001"
      - "ltx-23_audio_00001-audio.mp4" -> "ltx-23_audio_00001"
      - "ltx-23_audio_00001_audio.mp4" -> "ltx-23_audio_00001"
      - "ComfyUI_00123.png" -> "comfyui_00123"
    """
    name = str(filename or "").strip()
    stem = name.rsplit(".", 1)[0] if "." in name else name
    stem_lower = stem.lower()
    for suffix in ["-audio", "_audio", "-merged", "_merged", "-final", "_final", "-video", "_video"]:
        if stem_lower.endswith(suffix):
            stem_lower = stem_lower[:-len(suffix)]
            break
    return stem_lower


async def backfill_job_ids_by_prefix(db) -> Result[dict[str, int]]:
    """
    Backfill missing job_ids by propagating from sibling files with same prefix.

    Groups files by (subfolder, source, root_id, filename_prefix) and propagates
    job_id from files that have one to files that don't.
    """
    try:
        rows_res = await db.aquery(
            """
            SELECT id, filename, subfolder, source, root_id, job_id
            FROM assets
            WHERE filename IS NOT NULL AND filename != ''
            ORDER BY subfolder, source, root_id, filename
            """
        )
        if not rows_res.ok:
            return Result.Err("DB_ERROR", rows_res.error or "Failed to scan assets")
        rows = rows_res.data or []
        if not rows:
            return Result.Ok({"groups": 0, "updated": 0, "skipped": 0})

        groups: dict[tuple[str, str, str, str], list[dict]] = {}
        for row in rows:
            prefix = extract_filename_prefix(row.get("filename") or "")
            if not prefix:
                continue
            key = (
                str(row.get("subfolder") or "").strip().lower(),
                str(row.get("source") or "output").strip().lower(),
                str(row.get("root_id") or "").strip().lower(),
                prefix,
            )
            groups.setdefault(key, []).append(row)

        updated_count = 0
        skipped_count = 0
        groups_with_updates = 0

        for _key, group_rows in groups.items():
            if len(group_rows) < 2:
                continue

            group_job_id = None
            for row in group_rows:
                job = str(row.get("job_id") or "").strip()
                if job:
                    group_job_id = job
                    break

            if not group_job_id:
                skipped_count += len(group_rows)
                continue

            group_updated = False
            for row in group_rows:
                if str(row.get("job_id") or "").strip():
                    continue
                asset_id = int(row.get("id") or 0)
                if not asset_id:
                    continue
                update_res = await db.aexecute(
                    "UPDATE assets SET job_id = ? WHERE id = ? AND (job_id IS NULL OR job_id = '')",
                    (group_job_id, asset_id),
                )
                if update_res.ok:
                    updated_count += 1
                    group_updated = True

            if group_updated:
                groups_with_updates += 1

        return Result.Ok(
            {
                "groups": groups_with_updates,
                "updated": updated_count,
                "skipped": skipped_count,
            }
        )
    except Exception as exc:
        return Result.Err("DB_ERROR", safe_error_message(exc, "Failed to backfill job_ids"))


def build_backfill_scope_clause(normalized_scope: str, normalized_custom_root: str) -> tuple[str, list[Any]]:
    where: list[str] = []
    params: list[Any] = []
    if normalized_scope in {"output", "input", "custom"}:
        where.append("LOWER(COALESCE(a.source, '')) = ?")
        params.append(normalized_scope)
    if normalized_scope == "custom":
        where.append("a.root_id = ?")
        params.append(normalized_custom_root)
    scope_sql = (" AND " + " AND ".join(where)) if where else ""
    return scope_sql, params


async def process_backfill_row(
    db: Any,
    vector_service: Any,
    row: dict[str, Any],
    index_asset_vector: Any,
    *,
    wait_for_priority_window_fn: Any,
) -> tuple[str, int]:
    await wait_for_priority_window_fn()
    asset_id = parse_backfill_asset_id(row)
    if asset_id <= 0:
        return "skip_invalid", 0

    filepath, kind = parse_backfill_file_context(row)
    if not filepath or not Path(filepath).is_file():
        return "skipped_missing", asset_id

    metadata_raw = parse_backfill_metadata_raw(row)
    result = await index_asset_vector(db, vector_service, asset_id, filepath, kind, metadata_raw=metadata_raw)
    if result.ok and bool(result.data):
        return "indexed", asset_id
    if result.ok:
        return "skipped", asset_id
    return "error", asset_id


def parse_backfill_asset_id(row: dict[str, Any]) -> int:
    try:
        return int(row.get("id") or 0)
    except Exception:
        return 0


def parse_backfill_file_context(row: dict[str, Any]) -> tuple[str, FileKind]:
    filepath = str(row.get("filepath") or "").strip()
    kind: FileKind = "video" if str(row.get("kind") or "").strip().lower() == "video" else "image"
    return filepath, kind


def parse_backfill_metadata_raw(row: dict[str, Any]) -> dict[str, Any] | None:
    raw = row.get("metadata_raw")
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str) and raw.strip():
        try:
            parsed = json.loads(raw)
            return parsed if isinstance(parsed, dict) else None
        except Exception:
            return None
    return None


async def init_backfill_counters(
    db: Any,
    scope_sql: str,
    scope_params: list[Any],
    batch_size: int,
    on_progress: Any | None,
) -> Result[BackfillCounters]:
    counters = BackfillCounters(batch_size=batch_size)
    totals_res = await count_backfill_scope_totals(db=db, scope_sql=scope_sql, scope_params=scope_params)
    if not totals_res.ok:
        return Result.Err(totals_res.code, totals_res.error or "Failed to count backfill totals")
    totals = totals_res.data or {}
    counters.eligible_total = int(totals.get("eligible_total") or 0)
    counters.candidate_total = int(totals.get("candidate_total") or 0)
    emit_backfill_progress(on_progress, counters)
    return Result.Ok(counters)


async def backfill_missing_asset_vectors(
    db: Any,
    vector_service: Any,
    *,
    batch_size: int = 64,
    scope: str = "output",
    custom_root_id: str = "",
    on_progress: Any | None = None,
    normalize_scope_fn: Any,
    wait_for_priority_window_fn: Any,
) -> Result[dict[str, int | str | None]]:
    try:
        from ...features.index.vector_indexer import index_asset_vector
    except Exception as exc:
        return Result.Err("SERVICE_UNAVAILABLE", safe_error_message(exc, "Vector indexer unavailable"))

    size = normalize_backfill_batch_size(batch_size)
    normalized_scope = normalize_scope_fn(scope)
    if not normalized_scope:
        return Result.Err("INVALID_INPUT", "Invalid scope. Must be one of: output, input, custom, all")
    normalized_custom_root = normalize_backfill_custom_root(normalized_scope, custom_root_id)
    if normalized_scope == "custom" and not normalized_custom_root:
        return Result.Err("INVALID_INPUT", "Missing custom_root_id for custom scope")

    scope_sql, scope_params = build_backfill_scope_clause(normalized_scope, normalized_custom_root)
    counters_res = await init_backfill_counters(db, scope_sql, scope_params, size, on_progress)
    if not counters_res.ok:
        return Result.Err(counters_res.code, counters_res.error or "Failed to initialize backfill counters")
    counters = counters_res.data
    if counters is None:
        return Result.Err("DB_ERROR", "Failed to initialize backfill counters")
    result = await run_backfill_vector_query_loop(
        db=db,
        vector_service=vector_service,
        index_asset_vector=index_asset_vector,
        scope_sql=scope_sql,
        scope_params=scope_params,
        counters=counters,
        on_progress=on_progress,
        wait_for_priority_window_fn=wait_for_priority_window_fn,
    )
    if not result.ok:
        return result
    return Result.Ok(
        {
            **counters.as_payload(),
            "scope": normalized_scope,
            "custom_root_id": normalized_custom_root or None,
        }
    )


def normalize_backfill_batch_size(batch_size: int) -> int:
    return max(1, min(200, int(batch_size or 64)))


_BACKFILL_SCOPE_TOTALS_SQL = """
        SELECT
            COUNT(*) AS eligible_total,
            COALESCE(
                SUM(
                    CASE
                        WHEN ae.asset_id IS NULL OR ae.vector IS NULL OR length(ae.vector) = 0 THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS candidate_total
        FROM assets a
        LEFT JOIN vec.asset_embeddings ae ON ae.asset_id = a.id
        WHERE a.kind IN ('image', 'video')
        """


def safe_row_int(row: Any, key: str) -> int:
    try:
        return int((row or {}).get(key) or 0)
    except Exception:
        return 0


async def count_backfill_scope_totals(
    *,
    db: Any,
    scope_sql: str,
    scope_params: list[Any],
) -> Result[dict[str, int]]:
    count_res = await db.aquery(
        _BACKFILL_SCOPE_TOTALS_SQL + scope_sql,
        tuple(scope_params),
    )
    if not count_res.ok:
        return Result.Err("DB_ERROR", count_res.error or "Failed to count eligible assets")
    rows = count_res.data or []
    row = rows[0] if rows else {}
    return Result.Ok(
        {
            "eligible_total": max(0, safe_row_int(row, "eligible_total")),
            "candidate_total": max(0, safe_row_int(row, "candidate_total")),
        }
    )


def normalize_backfill_custom_root(normalized_scope: str, custom_root_id: str) -> str:
    return str(custom_root_id or "").strip() if normalized_scope == "custom" else ""


class BackfillCounters:
    def __init__(self, *, batch_size: int) -> None:
        self.eligible_total = 0
        self.candidate_total = 0
        self.candidates = 0
        self.indexed = 0
        self.skipped = 0
        self.skipped_missing_files = 0
        self.errors = 0
        self.batch_size = int(batch_size)

    def as_payload(self) -> dict[str, int]:
        return {
            "eligible_total": int(self.eligible_total),
            "total_assets": int(self.eligible_total),
            "candidate_total": int(self.candidate_total),
            "candidates": int(self.candidates),
            "indexed": int(self.indexed),
            "skipped": int(self.skipped),
            "skipped_missing_files": int(self.skipped_missing_files),
            "errors": int(self.errors),
            "batch_size": int(self.batch_size),
        }


def emit_backfill_progress(on_progress: Any | None, counters: BackfillCounters) -> None:
    if not callable(on_progress):
        return
    try:
        on_progress(counters.as_payload())
    except Exception:
        return


async def run_backfill_vector_query_loop(
    *,
    db: Any,
    vector_service: Any,
    index_asset_vector: Any,
    scope_sql: str,
    scope_params: list[Any],
    counters: BackfillCounters,
    on_progress: Any | None,
    wait_for_priority_window_fn: Any,
) -> Result[dict[str, int | str | None]]:
    last_id = 0
    while True:
        await wait_for_priority_window_fn()
        rows_res = await query_missing_vector_rows(
            db=db,
            last_id=last_id,
            scope_sql=scope_sql,
            scope_params=scope_params,
            batch_size=counters.batch_size,
        )
        if not rows_res.ok:
            return Result.Err(rows_res.code, rows_res.error or "Failed to query missing vector rows")
        rows = rows_res.data or []
        if not rows:
            break
        last_id = await process_backfill_rows(
            rows,
            db,
            vector_service,
            index_asset_vector,
            counters,
            on_progress,
            wait_for_priority_window_fn=wait_for_priority_window_fn,
        )
        if len(rows) < counters.batch_size:
            break
        emit_backfill_progress(on_progress, counters)
    emit_backfill_progress(on_progress, counters)
    return Result.Ok({})


async def query_missing_vector_rows(
    *,
    db: Any,
    last_id: int,
    scope_sql: str,
    scope_params: list[Any],
    batch_size: int,
) -> Result[list[dict[str, Any]]]:
    rows_res = await db.aquery(
        """
        SELECT a.id, a.filepath, a.kind, m.metadata_raw
        FROM assets a
        LEFT JOIN vec.asset_embeddings ae ON ae.asset_id = a.id
        LEFT JOIN asset_metadata m ON m.asset_id = a.id
        WHERE a.id > ?
          AND a.kind IN ('image', 'video')
          AND (ae.asset_id IS NULL OR ae.vector IS NULL OR length(ae.vector) = 0)
        """
        + scope_sql
        + """
        ORDER BY a.id ASC
        LIMIT ?
        """,
        (int(last_id), *scope_params, int(batch_size)),
    )
    if not rows_res.ok:
        return Result.Err("DB_ERROR", rows_res.error or "Failed to query missing vectors")
    return Result.Ok(rows_res.data or [])


async def process_backfill_rows(
    rows: list[dict[str, Any]],
    db: Any,
    vector_service: Any,
    index_asset_vector: Any,
    counters: BackfillCounters,
    on_progress: Any | None,
    *,
    wait_for_priority_window_fn: Any,
) -> int:
    last_id = 0
    for row in rows:
        outcome, row_asset_id = await process_backfill_row(
            db,
            vector_service,
            row,
            index_asset_vector,
            wait_for_priority_window_fn=wait_for_priority_window_fn,
        )
        if outcome == "skip_invalid":
            continue
        last_id = row_asset_id
        accumulate_backfill_outcome(counters, outcome)
        emit_backfill_progress(on_progress, counters)
    return last_id


def accumulate_backfill_outcome(counters: BackfillCounters, outcome: str) -> None:
    counters.candidates += 1
    if outcome == "indexed":
        counters.indexed += 1
    elif outcome == "skipped_missing":
        counters.skipped += 1
        counters.skipped_missing_files += 1
    elif outcome == "skipped":
        counters.skipped += 1
    else:
        counters.errors += 1
