"""Vec (vector embeddings) schema repair helpers."""
from ...shared import Result, get_logger

logger = get_logger(__name__)


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


async def repair_vec_embeddings_layout(db) -> Result[bool]:
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
