"""FTS (full-text search) repair and management helpers."""
from ...shared import Result, get_logger
from .schema_sql import _is_safe_identifier, _quoted_identifier

logger = get_logger(__name__)


# ── asset_metadata_fts helpers ─────────────────────────────────────────────

async def _fts_has_column(db, table: str, col: str) -> bool:
    """Check if an FTS table has a specific column."""
    if not _is_safe_identifier(table) or not _is_safe_identifier(col):
        return False
    try:
        table_ident = _quoted_identifier(table)
        r = await db.aquery(f"PRAGMA table_info({table_ident})")
        if not r.ok or not r.data:
            return False
        return any((row.get("name") == col) for row in r.data)
    except Exception:
        return False


async def _sqlite_object_sql(db, obj_type: str, name: str) -> str:
    try:
        row = await db.aquery(
            "SELECT sql FROM sqlite_master WHERE type=? AND name=? LIMIT 1",
            (obj_type, name),
        )
        if row.ok and row.data:
            return str(row.data[0].get("sql") or "")
    except Exception:
        return ""
    return ""


async def _asset_metadata_fts_needs_repair(db) -> tuple[bool, bool]:
    ddl_lower = (await _sqlite_object_sql(db, "table", "asset_metadata_fts")).lower()
    trig_lower = (await _sqlite_object_sql(db, "trigger", "asset_metadata_fts_update")).lower()
    needs_table_rebuild = (
        ("content_rowid" in ddl_lower and "asset_id" in ddl_lower)
        or "content=''" in ddl_lower
        or 'content=""' in ddl_lower
    )
    # Old contentless triggers used VALUES('delete', rowid) for deletions; new triggers use DELETE/UPDATE.
    needs_trigger_rebuild = "values('delete'" in trig_lower
    missing_tags_text = not await _fts_has_column(db, "asset_metadata_fts", "tags_text")
    missing_metadata_text = not await _fts_has_column(db, "asset_metadata_fts", "metadata_text")
    if missing_tags_text or missing_metadata_text:
        needs_table_rebuild = True
    return needs_table_rebuild, needs_trigger_rebuild


async def _drop_asset_metadata_fts_objects(db, *, include_table: bool) -> None:
    script_parts = [
        "DROP TRIGGER IF EXISTS asset_metadata_fts_insert;",
        "DROP TRIGGER IF EXISTS asset_metadata_fts_delete;",
        "DROP TRIGGER IF EXISTS asset_metadata_fts_update;",
    ]
    if include_table:
        script_parts.append("DROP TABLE IF EXISTS asset_metadata_fts;")
    await db.aexecutescript("\n".join(script_parts))


async def _create_asset_metadata_fts_table_if_needed(db, *, needs_table_rebuild: bool) -> None:
    if not needs_table_rebuild:
        return
    await db.aexecutescript(
        """
        CREATE VIRTUAL TABLE IF NOT EXISTS asset_metadata_fts USING fts5(
            tags,
            tags_text,
            metadata_text
        );
        """
    )


async def _create_asset_metadata_fts_triggers(db) -> None:
    await db.aexecutescript(
        """
        CREATE TRIGGER IF NOT EXISTS asset_metadata_fts_insert AFTER INSERT ON asset_metadata BEGIN
            INSERT INTO asset_metadata_fts(rowid, tags, tags_text, metadata_text)
            VALUES (new.asset_id, COALESCE(new.tags, ''), COALESCE(new.tags_text, ''), COALESCE(new.metadata_text, ''));
        END;

        CREATE TRIGGER IF NOT EXISTS asset_metadata_fts_delete AFTER DELETE ON asset_metadata BEGIN
            DELETE FROM asset_metadata_fts WHERE rowid = old.asset_id;
        END;

        CREATE TRIGGER IF NOT EXISTS asset_metadata_fts_update AFTER UPDATE ON asset_metadata BEGIN
            UPDATE asset_metadata_fts
            SET tags = COALESCE(new.tags, ''),
                tags_text = COALESCE(new.tags_text, ''),
                metadata_text = COALESCE(new.metadata_text, '')
            WHERE rowid = new.asset_id;
        END;
        """
    )


async def _reindex_asset_metadata_fts(db) -> None:
    await db.aexecutescript(
        """
        DELETE FROM asset_metadata_fts;
        INSERT INTO asset_metadata_fts(rowid, tags, tags_text, metadata_text)
        SELECT asset_id, COALESCE(tags, ''), COALESCE(tags_text, ''), COALESCE(metadata_text, '')
        FROM asset_metadata;
        """
    )


async def repair_asset_metadata_fts(db) -> Result[bool]:
    """
    Repair legacy/incorrect FTS definition for asset metadata.

    Older versions used `content_rowid='asset_id'` on a contentless table, which can
    break updates with errors like "no such column: T.asset_id".
    Also check for missing `tags_text` column in existing FTS tables.
    """
    try:
        needs_table_rebuild, needs_trigger_rebuild = await _asset_metadata_fts_needs_repair(db)
        if not (needs_table_rebuild or needs_trigger_rebuild):
            return Result.Ok(True)
    except Exception:
        return Result.Ok(True)

    logger.warning("Repairing asset_metadata_fts (schema/triggers)")

    try:
        async with db.atransaction(mode="immediate") as tx:
            if not tx.ok:
                return Result.Err("DB_ERROR", tx.error or "Failed to begin transaction")
            await _drop_asset_metadata_fts_objects(db, include_table=needs_table_rebuild)
            await _create_asset_metadata_fts_table_if_needed(db, needs_table_rebuild=needs_table_rebuild)
            await _create_asset_metadata_fts_triggers(db)
            await _reindex_asset_metadata_fts(db)
        if not tx.ok:
            return Result.Err("DB_ERROR", tx.error or "Commit failed")
        return Result.Ok(True)
    except Exception as exc:
        logger.warning("Failed to repair asset_metadata_fts: %s", exc)
        return Result.Err("FTS_REPAIR_FAILED", str(exc))


# ── assets_fts helpers ─────────────────────────────────────────────────────

async def _assets_fts_needs_rebuild(db) -> bool:
    ddl_lower = (await _sqlite_object_sql(db, "table", "assets_fts")).lower()
    trig_row = await db.aquery("SELECT name FROM sqlite_master WHERE type='trigger' AND name LIKE 'assets_fts_%'")
    triggers_exist = bool(trig_row.ok and trig_row.data)
    return bool((not ddl_lower) or ("fts5" not in ddl_lower) or (not triggers_exist))


async def _drop_assets_fts_objects(db) -> None:
    await db.aexecutescript(
        """
        DROP TRIGGER IF EXISTS assets_fts_insert;
        DROP TRIGGER IF EXISTS assets_fts_delete;
        DROP TRIGGER IF EXISTS assets_fts_update;
        DROP TABLE IF EXISTS assets_fts;
        """
    )


async def _create_assets_fts_table(db) -> None:
    await db.aexecutescript(
        """
        CREATE VIRTUAL TABLE IF NOT EXISTS assets_fts USING fts5(
            filename,
            subfolder,
            content='assets',
            content_rowid='id'
        );
        """
    )


async def _create_assets_fts_triggers(db) -> None:
    await db.aexecutescript(
        """
        CREATE TRIGGER IF NOT EXISTS assets_fts_insert AFTER INSERT ON assets BEGIN
            INSERT INTO assets_fts(rowid, filename, subfolder)
            VALUES (new.id, new.filename, new.subfolder);
        END;

        CREATE TRIGGER IF NOT EXISTS assets_fts_delete AFTER DELETE ON assets BEGIN
            DELETE FROM assets_fts WHERE rowid = old.id;
        END;

        CREATE TRIGGER IF NOT EXISTS assets_fts_update AFTER UPDATE ON assets BEGIN
            UPDATE assets_fts SET filename = new.filename, subfolder = new.subfolder
            WHERE rowid = new.id;
        END;
        """
    )


async def _rebuild_assets_fts_content(db) -> None:
    await db.aexecutescript(
        """
        DELETE FROM assets_fts;
        INSERT INTO assets_fts(rowid, filename, subfolder)
        SELECT id, COALESCE(filename, ''), COALESCE(subfolder, '') FROM assets;
        """
    )


async def repair_assets_fts(db) -> Result[bool]:
    """
    Ensure the `assets_fts` virtual table and its triggers are correctly defined and
    repopulated from the `assets` table. This prevents stale/missing FTS rows when
    triggers were not present or the FTS table got out of sync.
    """
    try:
        if not await _assets_fts_needs_rebuild(db):
            return Result.Ok(True)
    except Exception:
        return Result.Ok(True)

    logger.warning("Repairing assets_fts (schema/triggers)")
    try:
        async with db.atransaction(mode="immediate") as tx:
            if not tx.ok:
                return Result.Err("DB_ERROR", tx.error or "Failed to begin transaction")

            await _drop_assets_fts_objects(db)
            await _create_assets_fts_table(db)
            await _create_assets_fts_triggers(db)
            await _rebuild_assets_fts_content(db)

        if not tx.ok:
            return Result.Err("DB_ERROR", tx.error or "Commit failed")
        return Result.Ok(True)
    except Exception as exc:
        logger.warning("Failed to repair assets_fts: %s", exc)
        return Result.Err("FTS_REPAIR_FAILED", str(exc))
