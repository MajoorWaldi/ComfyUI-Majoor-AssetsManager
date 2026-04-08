"""
Database schema and migrations.
"""
import hashlib
import re

from ...shared import Result, get_logger, log_success
from ...startup_logging import startup_log_info, startup_log_success

logger = get_logger(__name__)


def _db_path(db) -> str | None:
    try:
        return str(getattr(db, "db_path", "") or "").strip() or None
    except Exception:
        return None

CURRENT_SCHEMA_VERSION = 15
# Schema version history (high-level):
# 1: initial assets + metadata tables
# 2-4: incremental columns and FTS/search support
# 5: workflow/generation flags, scan journal, and robustness fixes
# 6: asset sources (output/input/custom) + custom root id
# 7: metadata FTS (tags/metadata_raw) to improve search UX
# 8: duplicate analysis hashes (content_hash/phash/hash_state)
# 9: CLIP vector embeddings (asset_embeddings) for semantic search
# 10: auto_tags in asset_embeddings (AI-suggested tags, kept separate from user tags)
# 11: asset_embeddings now has explicit id PK + asset_id UNIQUE (legacy tables auto-rebuilt)
# 12: assets.enhanced_caption (Florence-2 long caption storage)
# 13: asset_embeddings moved to separate vectors.sqlite (attached as "vec")
# 14: audit_log table for write-operation audit trail
# 15: asset_stacks table + job_id/stack_id on assets (execution grouping)

# Schema definition
SCHEMA_V1 = """
CREATE TABLE IF NOT EXISTS metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    subfolder TEXT DEFAULT '',
    filepath TEXT NOT NULL UNIQUE,
    source TEXT DEFAULT 'output', -- output, input, custom
    root_id TEXT, -- for source=custom
    kind TEXT NOT NULL,  -- image, video, audio, model3d
    ext TEXT NOT NULL,
    size INTEGER NOT NULL,  -- File size in bytes
    mtime INTEGER NOT NULL,  -- File modification time (unix timestamp)
    width INTEGER,  -- Image/video width (NULL for non-visual assets)
    height INTEGER,  -- Image/video height (NULL for non-visual assets)
    duration REAL,  -- Video/audio duration in seconds (NULL for non-temporal assets)
    enhanced_caption TEXT DEFAULT '',  -- AI-generated long caption (Florence-2)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    content_hash TEXT,
    phash TEXT,
    hash_state TEXT
);

CREATE TABLE IF NOT EXISTS asset_metadata (
    asset_id INTEGER PRIMARY KEY,
    rating INTEGER DEFAULT 0,
    tags TEXT DEFAULT '',  -- JSON array stored as string
     tags_text TEXT DEFAULT '',  -- Legacy text column
     metadata_text TEXT DEFAULT '',  -- Full metadata text for FTS
    workflow_hash TEXT,
    has_workflow BOOLEAN DEFAULT 0,
    has_generation_data BOOLEAN DEFAULT 0,
    metadata_quality TEXT DEFAULT 'none',  -- full, partial, degraded, none
    workflow_type TEXT DEFAULT '',
    generation_time_ms INTEGER,
    positive_prompt TEXT DEFAULT '',
    metadata_raw TEXT DEFAULT '{}',  -- Full raw metadata as JSON
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

-- Scan journal to track last-processed state per file
CREATE TABLE IF NOT EXISTS scan_journal (
    filepath TEXT PRIMARY KEY,
    dir_path TEXT,
    state_hash TEXT,
    mtime INTEGER,
    size INTEGER,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (filepath) REFERENCES assets(filepath) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS metadata_cache (
    filepath TEXT PRIMARY KEY,
    state_hash TEXT,
    metadata_hash TEXT,
    metadata_raw TEXT DEFAULT '{}',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (filepath) REFERENCES assets(filepath) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts REAL NOT NULL,
    ip TEXT DEFAULT '',
    user_ctx TEXT DEFAULT '',
    operation TEXT NOT NULL,
    target TEXT DEFAULT '',
    result TEXT DEFAULT '',
    details TEXT DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS asset_stacks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id TEXT NOT NULL,
    cover_asset_id INTEGER,
    name TEXT DEFAULT '',
    asset_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cover_asset_id) REFERENCES assets(id) ON DELETE SET NULL
);
"""

# Migration from v1 to v2: Add metadata_raw column
COLUMN_DEFINITIONS = {
    "assets": [
        # Contract columns used by services/UI (self-heal for partially/old-created DBs)
        ("subfolder", "subfolder TEXT DEFAULT ''"),
        ("source", "source TEXT DEFAULT 'output'"),
        ("root_id", "root_id TEXT"),
        ("width", "width INTEGER"),
        ("height", "height INTEGER"),
        ("duration", "duration REAL"),
        ("enhanced_caption", "enhanced_caption TEXT DEFAULT ''"),
        ("created_at", "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
        ("updated_at", "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
        ("indexed_at", "indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
        ("content_hash", "content_hash TEXT"),
        ("phash", "phash TEXT"),
        ("hash_state", "hash_state TEXT"),
        ("job_id", "job_id TEXT"),
        ("stack_id", "stack_id INTEGER"),
        ("source_node_id", "source_node_id TEXT"),
        ("source_node_type", "source_node_type TEXT"),
    ],
    "asset_metadata": [
        ("rating", "rating INTEGER DEFAULT 0"),
        ("tags", "tags TEXT DEFAULT ''"),
        ("tags_text", "tags_text TEXT DEFAULT ''"),
        ("metadata_text", "metadata_text TEXT DEFAULT ''"),
        ("workflow_hash", "workflow_hash TEXT"),
        ("has_workflow", "has_workflow BOOLEAN DEFAULT 0"),
        ("has_generation_data", "has_generation_data BOOLEAN DEFAULT 0"),
        ("metadata_quality", "metadata_quality TEXT DEFAULT 'none'"),
        ("workflow_type", "workflow_type TEXT DEFAULT ''"),
        ("generation_time_ms", "generation_time_ms INTEGER"),
        ("positive_prompt", "positive_prompt TEXT DEFAULT ''"),
        ("metadata_raw", "metadata_raw TEXT DEFAULT '{}'"),
    ],
    "scan_journal": [
        ("dir_path", "dir_path TEXT"),
        ("state_hash", "state_hash TEXT"),
        ("mtime", "mtime INTEGER"),
        ("size", "size INTEGER"),
        ("last_seen", "last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
    ],
    "metadata_cache": [
        ("state_hash", "state_hash TEXT"),
        ("metadata_hash", "metadata_hash TEXT"),
        ("metadata_raw", "metadata_raw TEXT DEFAULT '{}'"),
        ("last_updated", "last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
    ],
}

INDEXES_AND_TRIGGERS = """
CREATE VIRTUAL TABLE IF NOT EXISTS assets_fts USING fts5(
    filename,
    subfolder,
    content='assets',
    content_rowid='id'
);

CREATE VIRTUAL TABLE IF NOT EXISTS asset_metadata_fts USING fts5(
    tags,
    tags_text,
    metadata_text
);

CREATE INDEX IF NOT EXISTS idx_assets_filename ON assets(filename);
CREATE INDEX IF NOT EXISTS idx_assets_subfolder ON assets(subfolder);
CREATE INDEX IF NOT EXISTS idx_assets_kind ON assets(kind);
CREATE INDEX IF NOT EXISTS idx_assets_mtime ON assets(mtime);
CREATE INDEX IF NOT EXISTS idx_assets_kind_mtime ON assets(kind, mtime);
CREATE INDEX IF NOT EXISTS idx_assets_source ON assets(source);
CREATE INDEX IF NOT EXISTS idx_assets_source_lower ON assets(LOWER(source));
CREATE INDEX IF NOT EXISTS idx_assets_root_id ON assets(root_id);
CREATE INDEX IF NOT EXISTS idx_assets_source_root_id ON assets(source, root_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_assets_filepath_source_root ON assets(filepath, source, root_id);
CREATE INDEX IF NOT EXISTS idx_metadata_rating ON asset_metadata(rating);
CREATE INDEX IF NOT EXISTS idx_metadata_workflow_hash ON asset_metadata(workflow_hash);
CREATE INDEX IF NOT EXISTS idx_metadata_quality_workflow ON asset_metadata(metadata_quality, has_workflow);
CREATE INDEX IF NOT EXISTS idx_metadata_workflow_type ON asset_metadata(workflow_type);
CREATE INDEX IF NOT EXISTS idx_assets_source_mtime_desc ON assets(source, mtime DESC);
CREATE INDEX IF NOT EXISTS idx_assets_content_hash ON assets(content_hash);
CREATE INDEX IF NOT EXISTS idx_assets_phash ON assets(phash);
CREATE INDEX IF NOT EXISTS idx_assets_hash_state ON assets(hash_state);
CREATE INDEX IF NOT EXISTS idx_asset_metadata_has_workflow_true ON asset_metadata(has_workflow) WHERE has_workflow = 1;
CREATE INDEX IF NOT EXISTS idx_asset_metadata_has_generation_data_true ON asset_metadata(has_generation_data) WHERE has_generation_data = 1;
CREATE INDEX IF NOT EXISTS idx_assets_list_cover ON assets(source, mtime DESC, id, filename, filepath, kind);
CREATE INDEX IF NOT EXISTS idx_assets_filename_lower ON assets(LOWER(filename), id DESC);
CREATE INDEX IF NOT EXISTS idx_assets_ext_lower ON assets(LOWER(ext));
CREATE INDEX IF NOT EXISTS idx_assets_source_size_desc ON assets(source, size DESC, mtime DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_assets_source_kind_mtime_desc ON assets(source, kind, mtime DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_scan_journal_dir ON scan_journal(dir_path);
CREATE INDEX IF NOT EXISTS idx_metadata_cache_state ON metadata_cache(state_hash);
CREATE INDEX IF NOT EXISTS idx_audit_log_ts ON audit_log(ts DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_operation_ts ON audit_log(operation, ts DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_stacks_job_id ON asset_stacks(job_id);
CREATE INDEX IF NOT EXISTS idx_stacks_created_at ON asset_stacks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assets_job_id ON assets(job_id);
CREATE INDEX IF NOT EXISTS idx_assets_stack_id ON assets(stack_id);

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

_SAFE_IDENT_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")
_SAFE_COLUMN_DEF_SUFFIX_RE = re.compile(r"^[A-Za-z0-9_(),{}\[\]'\s]+$")


def _is_safe_identifier(value: str) -> bool:
    return bool(value and isinstance(value, str) and _SAFE_IDENT_RE.match(value))


def _quoted_identifier(value: str) -> str:
    if not _is_safe_identifier(value):
        raise ValueError(f"Invalid identifier: {value!r}")
    safe = value.replace('"', '""')
    return f'"{safe}"'


def _safe_column_definition_parts(column_name: str, definition: str) -> tuple[str, str] | None:
    if not _is_safe_identifier(column_name):
        return None
    try:
        raw = str(definition or "")
    except Exception:
        return None
    prefix = f"{column_name} "
    if not raw.startswith(prefix):
        return None
    suffix = raw[len(prefix):].strip()
    if not suffix:
        return None
    if any(tok in suffix for tok in (";", "--", "/*", "*/")):
        return None
    if not _SAFE_COLUMN_DEF_SUFFIX_RE.match(suffix):
        return None
    return _quoted_identifier(column_name), suffix


async def _get_table_columns(db, table_name: str) -> Result[list[str]]:
    try:
        table_ident = _quoted_identifier(table_name)
    except ValueError:
        return Result.Err("INVALID_INPUT", f"Invalid table name: {table_name}")
    result = await db.aquery(f"PRAGMA table_info({table_ident})")
    if not result.ok:
        return Result.Err("PRAGMA_FAILED", f"Unable to inspect {table_name}: {result.error}")
    return Result.Ok([row["name"] for row in result.data or []])


async def table_has_column(db, table_name: str, column_name: str) -> bool:
    """Return True if `table_name` has `column_name` (best-effort)."""
    if not _is_safe_identifier(table_name) or not _is_safe_identifier(column_name):
        logger.warning("Invalid identifier in table_has_column: %s.%s", table_name, column_name)
        return False
    columns_result = await _get_table_columns(db, table_name)
    if not columns_result.ok:
        logger.warning(
            "Unable to determine columns for %s.%s: %s",
            table_name,
            column_name,
            columns_result.error
        )
        return False

    columns = columns_result.data or []
    return column_name in columns


async def _ensure_column(db, table_name: str, column_name: str, definition: str) -> Result[bool]:
    columns_result = await _get_table_columns(db, table_name)
    if not columns_result.ok:
        return Result.Err(columns_result.code or "PRAGMA_FAILED", columns_result.error or "Unable to inspect table")

    columns = columns_result.data or []
    if column_name in columns:
        return Result.Ok(True)

    logger.info("Adding missing column %s.%s", table_name, column_name)
    try:
        table_ident = _quoted_identifier(table_name)
    except ValueError:
        return Result.Err("INVALID_INPUT", f"Invalid table name: {table_name}")
    definition_parts = _safe_column_definition_parts(column_name, definition)
    if definition_parts is None:
        return Result.Err("INVALID_INPUT", f"Invalid column definition for {table_name}.{column_name}")
    column_ident, column_suffix = definition_parts
    alter_result = await db.aexecute(
        f"ALTER TABLE {table_ident} ADD COLUMN {column_ident} {column_suffix}"
    )
    return alter_result


async def ensure_columns_exist(db) -> Result[bool]:
    """Ensure required columns exist in existing tables (best-effort)."""
    for table, columns in COLUMN_DEFINITIONS.items():
        for column_name, definition in columns:
            result = await _ensure_column(db, table, column_name, definition)
            if not result.ok:
                logger.error("Failed to ensure column %s.%s: %s", table, column_name, result.error)
                return result
    return Result.Ok(True)


async def ensure_tables_exist(db) -> Result[bool]:
    """Ensure base schema tables exist (idempotent)."""
    startup_log_info(logger, "Ensuring tables exist...", db_path=_db_path(db))
    result = await db.aexecutescript(SCHEMA_V1)
    if not result.ok:
        logger.error("Failed to ensure base tables: %s", result.error)
    return result


# ── Vector (vec) schema ────────────────────────────────────────────────────

VEC_SCHEMA = """
CREATE TABLE IF NOT EXISTS vec.asset_embeddings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL UNIQUE,
    vector BLOB,
    aesthetic_score REAL,
    auto_tags TEXT DEFAULT '[]',
    model_name TEXT DEFAULT '',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS vec.idx_asset_embeddings_asset_id ON asset_embeddings(asset_id);
"""


async def ensure_vec_schema(db) -> Result[bool]:
    """Create the asset_embeddings table inside the attached 'vec' database."""
    startup_log_info(logger, "Ensuring vec schema (vectors.sqlite)...", db_path=_db_path(db))
    result = await db.aexecutescript(VEC_SCHEMA)
    if not result.ok:
        logger.error("Failed to ensure vec schema: %s", result.error)
    return result


async def _migrate_embeddings_to_vec(db) -> Result[bool]:
    """Move rows from main.asset_embeddings TABLE into vec.asset_embeddings.

    After migration the old table is dropped.  This is a one-time upgrade
    (schema v12 → v13) for users who had vectors in assets.sqlite.
    """
    # Check whether a TABLE (not view) named asset_embeddings exists in main
    check = await db.aquery(
        "SELECT type FROM sqlite_master WHERE name = 'asset_embeddings'"
    )
    if not check.ok or not check.data:
        return Result.Ok(True)  # nothing to migrate

    obj_type = str(check.data[0].get("type") or "").lower()
    if obj_type != "table":
        return Result.Ok(True)  # already a view or something else

    logger.warning("Migrating asset_embeddings from assets.sqlite to vectors.sqlite ...")
    migrate_script = """
    INSERT OR REPLACE INTO vec.asset_embeddings
        (asset_id, vector, aesthetic_score, auto_tags, model_name, updated_at)
    SELECT asset_id, vector, aesthetic_score,
           COALESCE(auto_tags, '[]'),
           COALESCE(model_name, ''),
           COALESCE(updated_at, CURRENT_TIMESTAMP)
    FROM main.asset_embeddings
    WHERE asset_id IS NOT NULL;

    DROP TABLE IF EXISTS main.asset_embeddings;
    """
    result = await db.aexecutescript(migrate_script)
    if not result.ok:
        logger.error("Migration of asset_embeddings to vec failed: %s", result.error)
        return result
    log_success(logger, "asset_embeddings migrated to vectors.sqlite")
    return Result.Ok(True)


async def purge_orphan_vec_embeddings(db) -> Result[bool]:
    """Delete vec.asset_embeddings rows whose asset_id no longer exists in assets."""
    result = await db.aexecute(
        "DELETE FROM vec.asset_embeddings WHERE asset_id NOT IN (SELECT id FROM assets)"
    )
    if not result.ok:
        logger.warning("Failed to purge orphan vec embeddings: %s", result.error)
    return result


async def ensure_indexes_and_triggers(db) -> Result[bool]:
    """Ensure indexes/triggers exist and repair FTS metadata (best-effort)."""
    startup_log_info(logger, "Ensuring indexes/triggers exist...", db_path=_db_path(db))
    result = await db.aexecutescript(INDEXES_AND_TRIGGERS)
    if not result.ok:
        logger.error("Failed to ensure indexes/triggers: %s", result.error)
        return result
    # Repair assets_fts first (content-backed FTS table), then asset_metadata_fts
    repair_assets = await _repair_assets_fts(db)
    if repair_assets and not repair_assets.ok:
        logger.warning("Failed to repair assets_fts: %s", repair_assets.error)

    repair_result = await _repair_asset_metadata_fts(db)
    if repair_result and not repair_result.ok:
        logger.warning("Failed to repair asset_metadata_fts: %s", repair_result.error)
    return result


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


async def _repair_asset_metadata_fts(db) -> Result[bool]:
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


def _schema_fingerprint() -> str:
    """
    Store a stable fingerprint of the schema DDL so we can detect "exotic" DBs.
    This is informational (self-heal is done via COLUMN_DEFINITIONS).
    """
    ddl = f"{SCHEMA_V1}\n{INDEXES_AND_TRIGGERS}"
    normalized = "\n".join(line.strip() for line in ddl.splitlines() if line.strip())
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


async def _ensure_schema_fingerprint(db) -> Result[bool]:
    if not await db.ahas_table("metadata"):
        return Result.Ok(True)

    try:
        fingerprint = _schema_fingerprint()
    except Exception as exc:
        logger.warning("Unable to compute schema fingerprint: %s", exc)
        return Result.Ok(True)

    existing = await db.aexecute(
        "SELECT value FROM metadata WHERE key = 'schema_ddl_hash'",
        fetch=True
    )
    if existing.ok and existing.data:
        try:
            current = (existing.data[0] or {}).get("value") or ""
        except Exception:
            current = ""
        if current and current != fingerprint:
            logger.warning(
                "Database schema fingerprint differs from expected (will self-heal columns anyway)"
            )

    return await db.aexecute(
        "INSERT OR REPLACE INTO metadata (key, value) VALUES ('schema_ddl_hash', ?)",
        (fingerprint,)
    )


def _parse_vec_table_columns(table_info: list[dict]) -> tuple[bool, bool, bool, bool]:
    """Parse vec table_info rows into (has_id, id_pk, has_asset_id, asset_id_pk)."""
    has_id = has_asset_id = False
    id_pk = asset_id_pk = False
    for row in table_info:
        name = str(row.get("name") or "").strip().lower()
        pk = int(row.get("pk") or 0)
        if name == "id":
            has_id = True
            id_pk = pk == 1
        elif name == "asset_id":
            has_asset_id = True
            asset_id_pk = pk == 1
    return has_id, id_pk, has_asset_id, asset_id_pk


def _needs_rebuild_from_columns(
    has_id: bool, id_pk: bool, has_asset_id: bool, asset_id_pk: bool
) -> bool:
    """Decide if the vec table layout is legacy and needs a rebuild."""
    if not has_asset_id:
        return False
    if not has_id:
        return True
    if asset_id_pk:
        return True
    return not id_pk


async def _vec_embeddings_needs_rebuild(db) -> bool:
    """Return True when vec.asset_embeddings still uses the legacy PK layout."""
    try:
        check = await db.aquery(
            "SELECT name FROM vec.sqlite_master WHERE type='table' AND name='asset_embeddings'"
        )
        if not check.ok or not check.data:
            return False
    except Exception:
        return False

    info = await db.aquery("PRAGMA vec.table_info(asset_embeddings)")
    if not info.ok or not info.data:
        return False

    has_id, id_pk, has_asset_id, asset_id_pk = _parse_vec_table_columns(info.data)
    return _needs_rebuild_from_columns(has_id, id_pk, has_asset_id, asset_id_pk)


_VEC_REBUILD_SCRIPT = """
CREATE TABLE IF NOT EXISTS vec.asset_embeddings__new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL UNIQUE,
    vector BLOB,
    aesthetic_score REAL,
    auto_tags TEXT DEFAULT '[]',
    model_name TEXT DEFAULT '',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT OR REPLACE INTO vec.asset_embeddings__new (asset_id, vector, aesthetic_score, auto_tags, model_name, updated_at)
SELECT asset_id,
       vector,
       aesthetic_score,
       COALESCE(auto_tags, '[]'),
       COALESCE(model_name, ''),
       COALESCE(updated_at, CURRENT_TIMESTAMP)
FROM vec.asset_embeddings
WHERE asset_id IS NOT NULL;

DROP TABLE vec.asset_embeddings;
ALTER TABLE vec.asset_embeddings__new RENAME TO asset_embeddings;
"""


async def _execute_vec_rebuild(db) -> Result[bool]:
    """Run the vec embeddings rebuild inside a transaction."""
    async with db.atransaction(mode="immediate") as tx:
        if not tx.ok:
            return Result.Err("DB_ERROR", tx.error or "Failed to begin transaction")
        rebuilt = await db.aexecutescript(_VEC_REBUILD_SCRIPT)
        if not rebuilt.ok:
            return Result.Err(
                rebuilt.code or "DB_ERROR",
                rebuilt.error or "Failed to rebuild vec.asset_embeddings",
            )
    if not tx.ok:
        return Result.Err("DB_ERROR", tx.error or "Commit failed")
    return Result.Ok(True)


async def _repair_vec_embeddings_layout(db) -> Result[bool]:
    """Rebuild legacy vec.asset_embeddings table to include id PK + asset_id UNIQUE."""
    try:
        needs_rebuild = await _vec_embeddings_needs_rebuild(db)
    except Exception:
        needs_rebuild = False
    if not needs_rebuild:
        return Result.Ok(True)

    logger.warning("Repairing vec.asset_embeddings layout (legacy PK -> id PK + asset_id UNIQUE)")
    try:
        return await _execute_vec_rebuild(db)
    except Exception as exc:
        logger.warning("Failed to repair vec.asset_embeddings layout: %s", exc)
        try:
            await db.aexecutescript("DROP TABLE IF EXISTS vec.asset_embeddings__new;")
        except Exception as cleanup_exc:
            logger.debug("Cleanup of vec.asset_embeddings__new failed: %s", cleanup_exc)
        return Result.Err("SCHEMA_REPAIR_FAILED", str(exc))


async def _ensure_schema(db) -> Result[bool]:
    result = await ensure_tables_exist(db)
    if not result.ok:
        return result

    result = await ensure_columns_exist(db)
    if not result.ok:
        return result

    # Vector embeddings live in the attached vec database (vectors.sqlite).
    result = await ensure_vec_schema(db)
    if not result.ok:
        return result

    # Migrate embeddings from main to vec (one-time v12→v13 upgrade).
    result = await _migrate_embeddings_to_vec(db)
    if not result.ok:
        return result

    result = await _repair_vec_embeddings_layout(db)
    if not result.ok:
        return result

    # Purge orphan embeddings (no cascade trigger across attached DBs).
    await purge_orphan_vec_embeddings(db)

    result = await ensure_indexes_and_triggers(db)
    if not result.ok:
        return result

    version_result = await db.aset_schema_version(CURRENT_SCHEMA_VERSION)
    if not version_result.ok:
        logger.error("Failed to set schema version: %s", version_result.error)
        return version_result

    fp_result = await _ensure_schema_fingerprint(db)
    if not fp_result.ok:
        logger.warning("Failed to store schema fingerprint: %s", fp_result.error)

    startup_log_success(logger, f"Schema ensured (version {CURRENT_SCHEMA_VERSION})", db_path=_db_path(db))
    return Result.Ok(True)


async def _repair_assets_fts(db) -> Result[bool]:
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


async def init_schema(db) -> Result[bool]:
    """
    Initialize the schema (useful for tests or first-time installs).
    """
    return await _ensure_schema(db)

async def migrate_schema(db) -> Result[bool]:
    """
    Repair schema to current version by ensuring expected tables, columns,
    indexes, and triggers exist.

    Args:
        db: Sqlite instance

    Returns:
        Result with success boolean
    """
    current_version = await db.aget_schema_version()
    startup_log_info(
        logger,
        "Ensuring schema (current version %s -> target %s)",
        current_version,
        CURRENT_SCHEMA_VERSION,
        db_path=_db_path(db),
    )

    repair_result = await _ensure_schema(db)
    if not repair_result.ok:
        return repair_result

    final_version = await db.aget_schema_version()

    if current_version == final_version:
        startup_log_info(logger, "Schema already reported up to date (%s)", final_version, db_path=_db_path(db))
    else:
        startup_log_success(
            logger,
            f"Schema repaired from version {current_version} to {final_version}",
            db_path=_db_path(db),
        )

    return Result.Ok(True)

async def rebuild_fts(db) -> Result[bool]:
    """
    Rebuild full-text search index.

    Args:
        db: Sqlite instance

    Returns:
        Result with success boolean
    """
    logger.info("Rebuilding FTS index...")

    result = await db.aexecute("INSERT INTO assets_fts(assets_fts) VALUES('rebuild')")
    if not result.ok:
        logger.error(f"Failed to rebuild assets_fts: {result.error}")
        return result

    repair_result = await _repair_asset_metadata_fts(db)
    if repair_result is not None and not repair_result.ok:
        logger.error(f"Failed to rebuild asset_metadata_fts: {repair_result.error}")
        return repair_result

    # Always fully reindex the contentless FTS table from source data.
    # contentless FTS5 (content='') does not support the 'rebuild' command, and
    # trigger-based inserts in autocommit mode can leave the FTS stats inconsistent.
    await _reindex_asset_metadata_fts(db)

    log_success(logger, "FTS index rebuilt")
    return Result.Ok(True)
