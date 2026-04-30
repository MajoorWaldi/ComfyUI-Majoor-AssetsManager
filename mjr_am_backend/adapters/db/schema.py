"""
Database schema and migrations.
"""
import hashlib

from ...shared import Result, get_logger, log_success
from ...startup_logging import startup_log_info, startup_log_success
from .schema_fts import (
    _reindex_asset_metadata_fts,
)
from .schema_fts import (
    repair_asset_metadata_fts as _repair_asset_metadata_fts,
)
from .schema_fts import (
    repair_assets_fts as _repair_assets_fts,
)
from .schema_sql import (
    COLUMN_DEFINITIONS,
    CURRENT_SCHEMA_VERSION,
    INDEXES_AND_TRIGGERS,
    SCHEMA_V1,
    VEC_SCHEMA,
    _db_path,
    _is_safe_identifier,
    _quoted_identifier,
    _safe_column_definition_parts,
)
from .schema_vec import (
    repair_vec_embeddings_layout as _repair_vec_embeddings_layout,
)

logger = get_logger(__name__)


# ── Column / table helpers ─────────────────────────────────────────────────

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


# ── Schema fingerprint ─────────────────────────────────────────────────────

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


# ── Main orchestration ─────────────────────────────────────────────────────

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


# ── Public API ─────────────────────────────────────────────────────────────

async def init_schema(db) -> Result[bool]:
    """Initialize the schema (useful for tests or first-time installs)."""
    return await _ensure_schema(db)


async def migrate_schema(db) -> Result[bool]:
    """
    Repair schema to current version by ensuring expected tables, columns,
    indexes, and triggers exist.
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
    """Rebuild full-text search index."""
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
