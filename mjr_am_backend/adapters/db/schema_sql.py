"""SQL constants and identifier-safety helpers for the database schema."""
import re

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


def _db_path(db) -> str | None:
    try:
        return str(getattr(db, "db_path", "") or "").strip() or None
    except Exception:
        return None


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
