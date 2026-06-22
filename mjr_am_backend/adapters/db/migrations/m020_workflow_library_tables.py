"""Migration v20 - add workflow library tables and indexes."""

from __future__ import annotations

from typing import TYPE_CHECKING

from ....shared import Result
from .base import Migration

if TYPE_CHECKING:
    from ..sqlite_facade import Sqlite


_CREATE_WORKFLOW_CATEGORIES = """
CREATE TABLE IF NOT EXISTS workflow_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at REAL NOT NULL DEFAULT (strftime('%s','now')),
    updated_at REAL NOT NULL DEFAULT (strftime('%s','now'))
);
"""

_CREATE_WORKFLOWS = """
CREATE TABLE IF NOT EXISTS workflows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_id TEXT DEFAULT '',
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    filepath TEXT NOT NULL UNIQUE,
    source TEXT NOT NULL DEFAULT 'workflow',
    category TEXT DEFAULT '',
    task TEXT DEFAULT '',
    model_family TEXT DEFAULT '',
    provider TEXT DEFAULT '',
    runs_on TEXT DEFAULT '',
    detected_task TEXT DEFAULT '',
    detected_model_family TEXT DEFAULT '',
    detected_provider TEXT DEFAULT '',
    detected_runs_on TEXT DEFAULT '',
    user_task TEXT DEFAULT '',
    user_model_family TEXT DEFAULT '',
    user_provider TEXT DEFAULT '',
    user_runs_on TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    detection_confidence REAL NOT NULL DEFAULT 0,
    detection_source TEXT DEFAULT '',
    detection_signals_json TEXT DEFAULT '{}',
    thumbnail_path TEXT DEFAULT '',
    animated_thumbnail_path TEXT DEFAULT '',
    workflow_hash TEXT DEFAULT '',
    node_count INTEGER NOT NULL DEFAULT 0,
    link_count INTEGER NOT NULL DEFAULT 0,
    subgraph_count INTEGER NOT NULL DEFAULT 0,
    required_nodes_json TEXT DEFAULT '[]',
    required_models_json TEXT DEFAULT '[]',
    missing_nodes_json TEXT DEFAULT '[]',
    missing_models_json TEXT DEFAULT '[]',
    tags_json TEXT DEFAULT '[]',
    favorite INTEGER NOT NULL DEFAULT 0,
    usage_count INTEGER NOT NULL DEFAULT 0,
    last_loaded_at REAL,
    mtime REAL,
    size INTEGER NOT NULL DEFAULT 0,
    created_at REAL NOT NULL DEFAULT (strftime('%s','now')),
    updated_at REAL NOT NULL DEFAULT (strftime('%s','now'))
);
"""

_CREATE_WORKFLOW_INDEXES = """
CREATE INDEX IF NOT EXISTS idx_workflows_name ON workflows(name);
CREATE INDEX IF NOT EXISTS idx_workflows_task ON workflows(task);
CREATE INDEX IF NOT EXISTS idx_workflows_model_family ON workflows(model_family);
CREATE INDEX IF NOT EXISTS idx_workflows_provider ON workflows(provider);
CREATE INDEX IF NOT EXISTS idx_workflows_runs_on ON workflows(runs_on);
CREATE INDEX IF NOT EXISTS idx_workflows_mtime_desc ON workflows(mtime DESC);
CREATE INDEX IF NOT EXISTS idx_workflows_last_loaded_at_desc ON workflows(last_loaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflows_usage_count_desc ON workflows(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_workflows_favorite ON workflows(favorite);
CREATE INDEX IF NOT EXISTS idx_workflows_workflow_hash ON workflows(workflow_hash);
CREATE INDEX IF NOT EXISTS idx_workflows_category ON workflows(category);
"""


class WorkflowLibraryTablesMigration(Migration):
    """v20 - create workflow library tables for indexed workflow metadata."""

    version = 20
    name = "workflow_library_tables"

    async def upgrade(self, db: Sqlite) -> Result[bool]:
        res = await db.aexecutescript(
            "\n".join(
                [
                    _CREATE_WORKFLOW_CATEGORIES,
                    _CREATE_WORKFLOWS,
                    _CREATE_WORKFLOW_INDEXES,
                ]
            )
        )
        if not res.ok:
            return Result.Err("MIGRATION_DDL_FAILED", f"v20 create workflow tables failed: {res.error}")
        return Result.Ok(True)


MIGRATION = WorkflowLibraryTablesMigration()
