"""Read-only workflow library discovery and listing."""

from __future__ import annotations

import hashlib
import html
import json
import os
import re
import shutil
import sqlite3
import subprocess
import tempfile
import time
from pathlib import Path
from typing import Any
from urllib.parse import quote

from mjr_am_backend.adapters.comfy_core import (
    get_available_node_types,
    get_model_filenames,
    get_output_directory,
)
from mjr_am_backend.config import FFPROBE_BIN, OUTPUT_ROOT, get_runtime_index_db_path
from mjr_am_shared import Result, get_logger

from .classifier import classify_workflow
from .parser import parse_workflow, workflow_node_text

logger = get_logger(__name__)

MAX_WORKFLOW_FILES = 2000
MAX_WORKFLOW_JSON_BYTES = 8 * 1024 * 1024
THUMBNAIL_EXTS = (".jpg", ".jpeg", ".png", ".webp", ".gif")
ANIMATED_EXTS = (".gif", ".webp", ".mp4")
LINKED_PREVIEW_EXTS = THUMBNAIL_EXTS + ANIMATED_EXTS
STATIC_THUMBNAIL_SOURCE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
VIDEO_THUMBNAIL_SOURCE_EXTS = {".mp4", ".webm", ".mov", ".mkv", ".avi", ".m4v"}
WORKFLOW_VIDEO_THUMBNAIL_SECONDS = 5
WORKFLOW_MANAGED_DIRNAME = "workflows"
WORKFLOW_HISTORY_DIRNAME = ".history"
SAFE_NAME_RE = re.compile(r"[^A-Za-z0-9._-]+")
WORKFLOW_INDEX_VERSION = 4


def _env_path(raw: Any = "") -> Path | None:
    try:
        value = raw if str(raw or "").strip() else (
            os.getenv("MJR_AM_WORKFLOW_DIRECTORY", "")
            or os.getenv("MAJOOR_WORKFLOW_DIRECTORY", "")
            or ""
        )
        if not str(value or "").strip():
            return None
        return Path(value).expanduser().resolve(strict=False)
    except Exception:
        return None


def _env_paths(raw: Any = "") -> list[Path]:
    try:
        value = raw if str(raw or "").strip() else (
            os.getenv("MJR_AM_WORKFLOW_DIRECTORIES", "")
            or os.getenv("MAJOOR_WORKFLOW_DIRECTORIES", "")
            or ""
        )
    except Exception:
        value = ""
    paths: list[Path] = []
    text = str(value or "").strip()
    if text:
        parts: list[str] = []
        for line in text.replace(";", "\n").splitlines():
            parts.extend(part for part in line.split(os.pathsep) if part)
        for part in parts:
            try:
                path = Path(part).expanduser().resolve(strict=False)
            except Exception:
                continue
            paths.append(path)
    legacy = _env_path()
    if legacy is not None:
        paths.insert(0, legacy)
    out: list[Path] = []
    seen: set[str] = set()
    for path in paths:
        key = str(path).lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(path)
    return out


def _detect_comfy_root() -> Path | None:
    candidates: list[Path] = []
    try:
        out_dir = get_output_directory() or OUTPUT_ROOT
        candidates.extend(Path(out_dir).resolve(strict=False).parents)
    except Exception:
        pass
    try:
        candidates.extend(Path(__file__).resolve().parents)
    except Exception:
        pass
    for parent in candidates:
        try:
            if (parent / "main.py").is_file() and (parent / "folder_paths.py").is_file():
                return parent
        except Exception:
            continue
    return None


def workflow_roots() -> list[Path]:
    roots: list[Path] = []
    roots.extend(_env_paths())
    comfy_root = _detect_comfy_root()
    if comfy_root is not None:
        roots.extend(
            [
                comfy_root / "user" / "default" / "workflows",
                comfy_root / "workflows",
            ]
        )
    try:
        package_root = Path(__file__).resolve().parents[3]
        roots.extend(
            [
                package_root / "workflows",
                package_root / "example_workflows",
            ]
        )
    except Exception:
        pass

    out: list[Path] = []
    seen: set[str] = set()
    for root in roots:
        try:
            resolved = root.resolve(strict=False)
            key = str(resolved).lower()
            if key in seen or not resolved.is_dir():
                continue
            seen.add(key)
            out.append(resolved)
        except Exception:
            continue
    return out


def managed_workflow_root(*, create: bool = False) -> Path | None:
    env_roots = _env_paths()
    if env_roots:
        root = env_roots[0]
    else:
        comfy_root = _detect_comfy_root()
        root = (
            comfy_root / "user" / "default" / WORKFLOW_MANAGED_DIRNAME
            if comfy_root is not None
            else Path(__file__).resolve().parents[3] / WORKFLOW_MANAGED_DIRNAME
        )
    try:
        resolved = root.resolve(strict=False)
        if create:
            resolved.mkdir(parents=True, exist_ok=True)
        return resolved
    except Exception:
        return None


def _sanitize_name(value: Any, fallback: str = "workflow") -> str:
    raw = str(value or "").strip()
    if not raw:
        raw = fallback
    raw = raw.replace("\\", " ").replace("/", " ")
    safe = SAFE_NAME_RE.sub("_", raw).strip(" ._")
    return safe[:120] or fallback


def _sanitize_category(value: Any) -> str:
    raw = str(value or "").strip().replace("\\", "/")
    parts = [_sanitize_name(part, "") for part in raw.split("/") if str(part or "").strip()]
    return "/".join(part for part in parts if part)[:240]


def _resolve_managed_target(name: Any, category: Any = "") -> Result[Path]:
    root = managed_workflow_root(create=True)
    if root is None:
        return Result.Err("WORKFLOW_ROOT_UNAVAILABLE", "Managed workflow root is unavailable")
    stem = _sanitize_name(name, "workflow")
    if stem.lower().endswith(".json"):
        stem = stem[:-5].strip(" ._") or "workflow"
    category_rel = _sanitize_category(category)
    folder = root / category_rel if category_rel else root
    try:
        folder = folder.resolve(strict=False)
        if root not in folder.parents and folder != root:
            return Result.Err("FORBIDDEN", "Workflow category path is not allowed")
        folder.mkdir(parents=True, exist_ok=True)
    except Exception:
        return Result.Err("WORKFLOW_WRITE_FAILED", "Failed to create workflow category")
    candidate = folder / f"{stem}.json"
    if not candidate.exists():
        return Result.Ok(candidate)
    suffix = int(time.time())
    for index in range(1, 1000):
        candidate = folder / f"{stem}-{suffix}-{index}.json"
        if not candidate.exists():
            return Result.Ok(candidate)
    return Result.Err("WORKFLOW_NAME_CONFLICT", "Could not create a unique workflow filename")


def _atomic_write_json(path: Path, payload: dict[str, Any]) -> Result[bool]:
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        text = json.dumps(payload, ensure_ascii=False, indent=2)
        fd, tmp = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=str(path.parent))
        tmp_path = Path(tmp)
        try:
            with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as handle:
                handle.write(text)
                handle.write("\n")
            os.replace(tmp_path, path)
        finally:
            try:
                if tmp_path.exists():
                    tmp_path.unlink()
            except Exception:
                pass
        return Result.Ok(True)
    except Exception as exc:
        logger.debug("Workflow write failed", exc_info=True)
        return Result.Err("WORKFLOW_WRITE_FAILED", f"Failed to write workflow: {exc.__class__.__name__}")


def _safe_read_workflow_json(path: Path) -> dict[str, Any] | None:
    try:
        if path.stat().st_size > MAX_WORKFLOW_JSON_BYTES:
            return None
        with path.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
        return data if isinstance(data, dict) else None
    except Exception:
        return None


def _to_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except Exception:
        return default


def _to_bool(value: Any, default: bool = False) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value != 0
    text = str(value or "").strip().lower()
    if text in {"1", "true", "yes", "on"}:
        return True
    if text in {"0", "false", "no", "off"}:
        return False
    return default


def _as_str_list(value: Any) -> list[str]:
    if isinstance(value, str):
        text = value.strip()
        return [text] if text else []
    if not isinstance(value, list):
        return []
    out: list[str] = []
    for entry in value:
        item = str(entry or "").strip()
        if item:
            out.append(item)
    return out


def _workflow_tags(workflow: dict[str, Any]) -> list[str]:
    tags = _as_str_list(workflow.get("tags"))
    if tags:
        return tags
    metadata = workflow.get("metadata")
    if isinstance(metadata, dict):
        return _as_str_list(metadata.get("tags"))
    return []


_WORKFLOW_LIBRARY_SCHEMA = """
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
CREATE INDEX IF NOT EXISTS idx_workflows_filepath ON workflows(filepath);
CREATE INDEX IF NOT EXISTS idx_workflows_workflow_hash ON workflows(workflow_hash);
"""


def _workflow_library_db_path() -> Path:
    return get_runtime_index_db_path()


def _ensure_workflow_library_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(_WORKFLOW_LIBRARY_SCHEMA)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS workflow_index_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)"
    )
    existing = {
        str(row[1])
        for row in conn.execute("PRAGMA table_info(workflows)").fetchall()
        if len(row) > 1
    }
    for column, ddl in {
        "detection_confidence": "ALTER TABLE workflows ADD COLUMN detection_confidence REAL NOT NULL DEFAULT 0",
        "detection_source": "ALTER TABLE workflows ADD COLUMN detection_source TEXT DEFAULT ''",
        "detection_signals_json": "ALTER TABLE workflows ADD COLUMN detection_signals_json TEXT DEFAULT '{}'",
        "detected_task": "ALTER TABLE workflows ADD COLUMN detected_task TEXT DEFAULT ''",
        "detected_model_family": "ALTER TABLE workflows ADD COLUMN detected_model_family TEXT DEFAULT ''",
        "detected_provider": "ALTER TABLE workflows ADD COLUMN detected_provider TEXT DEFAULT ''",
        "detected_runs_on": "ALTER TABLE workflows ADD COLUMN detected_runs_on TEXT DEFAULT ''",
        "user_task": "ALTER TABLE workflows ADD COLUMN user_task TEXT DEFAULT ''",
        "user_model_family": "ALTER TABLE workflows ADD COLUMN user_model_family TEXT DEFAULT ''",
        "user_provider": "ALTER TABLE workflows ADD COLUMN user_provider TEXT DEFAULT ''",
        "user_runs_on": "ALTER TABLE workflows ADD COLUMN user_runs_on TEXT DEFAULT ''",
        "notes": "ALTER TABLE workflows ADD COLUMN notes TEXT DEFAULT ''",
    }.items():
        if column not in existing:
            conn.execute(ddl)


def _workflow_index_needs_full_refresh(conn: sqlite3.Connection) -> bool:
    try:
        row = conn.execute(
            "SELECT value FROM workflow_index_meta WHERE key = 'version'"
        ).fetchone()
        return str(row[0] if row else "") != str(WORKFLOW_INDEX_VERSION)
    except Exception:
        return True


def _mark_workflow_index_version(conn: sqlite3.Connection) -> None:
    conn.execute(
        "INSERT OR REPLACE INTO workflow_index_meta(key, value) VALUES ('version', ?)",
        (str(WORKFLOW_INDEX_VERSION),),
    )


def _read_workflow_library_meta(path: Path) -> dict[str, Any]:
    try:
        db_path = _workflow_library_db_path()
        if not db_path.exists():
            return {}
        filepath = str(path.resolve(strict=False))
        with sqlite3.connect(str(db_path)) as conn:
            _ensure_workflow_library_schema(conn)
            row = conn.execute(
                """
                SELECT favorite, usage_count, last_loaded_at, tags_json,
                       user_task, user_model_family, user_provider, user_runs_on, notes
                FROM workflows WHERE filepath = ?
                """,
                (filepath,),
            ).fetchone()
        if not row:
            return {}
        try:
            tags = json.loads(str(row[3] or "[]"))
        except Exception:
            tags = []
        return {
            "favorite": bool(row[0]),
            "usage_count": max(0, _to_int(row[1], 0)),
            "last_loaded_at": max(0, _to_int(row[2], 0)),
            "tags": _as_str_list(tags),
            "user_task": str(row[4] or ""),
            "user_model_family": str(row[5] or ""),
            "user_provider": str(row[6] or ""),
            "user_runs_on": str(row[7] or ""),
            "notes": str(row[8] or ""),
        }
    except Exception:
        logger.debug("Workflow library metadata read failed", exc_info=True)
        return {}


def _workflow_library_card_values(card: dict[str, Any], now: int) -> tuple[Any, ...]:
    def text(key: str) -> str:
        return str(card.get(key) or "")

    def number(key: str) -> int:
        return int(card.get(key) or 0)

    return (
        str(card.get("filepath") or "").strip(),
        str(card.get("display_name") or card.get("filename") or "Workflow"),
        text("description"),
        text("workflow_id"),
        text("workflow_hash"),
        text("subfolder"),
        text("task"),
        text("model_family"),
        text("provider"),
        text("runs_on"),
        text("detected_task"),
        text("detected_model_family"),
        text("detected_provider"),
        text("detected_runs_on"),
        float(card.get("detection_confidence") or 0),
        text("detection_source"),
        json.dumps(card.get("detection_signals") or {}, ensure_ascii=False),
        text("thumbnail_path"),
        text("animated_thumbnail_path"),
        number("node_count"),
        number("link_count"),
        number("subgraph_count"),
        json.dumps(_as_str_list(card.get("missing_nodes")), ensure_ascii=False),
        json.dumps(_as_str_list(card.get("missing_models")), ensure_ascii=False),
        number("mtime"),
        number("size"),
        now,
    )


def _workflow_library_insert_values(card: dict[str, Any], now: int) -> tuple[Any, ...]:
    values = _workflow_library_card_values(card, now)
    return (
        *values[:24],
        json.dumps(_as_str_list(card.get("tags")), ensure_ascii=False),
        int(bool(card.get("favorite"))),
        max(0, _to_int(card.get("usage_count"), 0)),
        max(0, _to_int(card.get("last_loaded_at"), 0)) or None,
        *values[24:],
        now,
    )


def _workflow_library_update_values(card: dict[str, Any], now: int, filepath: str) -> tuple[Any, ...]:
    values = _workflow_library_card_values(card, now)
    return (*values[1:], filepath)


def _apply_workflow_library_updates(
    conn: sqlite3.Connection,
    *,
    filepath: str,
    updates: dict[str, Any] | None,
    now: int,
) -> None:
    if not updates:
        return
    allowed = (
        (
            "UPDATE workflows SET favorite = ?, updated_at = ? WHERE filepath = ?",
            int(bool(updates.get("favorite"))) if "favorite" in updates else None,
        ),
        (
            "UPDATE workflows SET usage_count = ?, updated_at = ? WHERE filepath = ?",
            max(0, _to_int(updates.get("usage_count"), 0)) if "usage_count" in updates else None,
        ),
        (
            "UPDATE workflows SET last_loaded_at = ?, updated_at = ? WHERE filepath = ?",
            max(0, _to_int(updates.get("last_loaded_at"), 0)) if "last_loaded_at" in updates else None,
        ),
        (
            "UPDATE workflows SET tags_json = ?, updated_at = ? WHERE filepath = ?",
            json.dumps(_as_str_list(updates.get("tags")), ensure_ascii=False) if "tags" in updates else None,
        ),
        (
            "UPDATE workflows SET user_task = ?, updated_at = ? WHERE filepath = ?",
            str(updates.get("task") or "").strip() if "task" in updates else None,
        ),
        (
            "UPDATE workflows SET user_model_family = ?, updated_at = ? WHERE filepath = ?",
            str(updates.get("model_family") or "").strip() if "model_family" in updates else None,
        ),
        (
            "UPDATE workflows SET user_provider = ?, updated_at = ? WHERE filepath = ?",
            str(updates.get("provider") or "").strip() if "provider" in updates else None,
        ),
        (
            "UPDATE workflows SET user_runs_on = ?, updated_at = ? WHERE filepath = ?",
            str(updates.get("runs_on") or "").strip().lower() if "runs_on" in updates else None,
        ),
        (
            "UPDATE workflows SET notes = ?, updated_at = ? WHERE filepath = ?",
            str(updates.get("notes") or "").strip() if "notes" in updates else None,
        ),
    )
    for statement, value in allowed:
        if value is not None:
            conn.execute(statement, (value, now, filepath))


def _workflow_library_row_meta(row: tuple[Any, ...] | None) -> Result[dict[str, Any]]:
    if not row:
        return Result.Err("WORKFLOW_DB_FAILED", "Workflow library metadata was not persisted")
    try:
        tags = json.loads(str(row[3] or "[]"))
    except Exception:
        tags = []
    return Result.Ok(
        {
            "favorite": bool(row[0]),
            "usage_count": max(0, _to_int(row[1], 0)),
            "last_loaded_at": max(0, _to_int(row[2], 0)),
            "tags": _as_str_list(tags),
        }
    )


def _upsert_workflow_library_card(card: dict[str, Any], *, updates: dict[str, Any] | None = None) -> Result[dict[str, Any]]:
    try:
        db_path = _workflow_library_db_path()
        db_path.parent.mkdir(parents=True, exist_ok=True)
        filepath = str(card.get("filepath") or "").strip()
        if not filepath:
            return Result.Err("INVALID_INPUT", "Workflow filepath is missing")
        now = int(time.time())
        with sqlite3.connect(str(db_path)) as conn:
            _ensure_workflow_library_schema(conn)
            conn.execute(
                """
                INSERT OR IGNORE INTO workflows (
                    filepath, name, description, workflow_id, workflow_hash, source, category,
                    task, model_family, provider, runs_on,
                    detected_task, detected_model_family, detected_provider, detected_runs_on,
                    detection_confidence, detection_source,
                    detection_signals_json, thumbnail_path, animated_thumbnail_path,
                    node_count, link_count, subgraph_count, missing_nodes_json, missing_models_json,
                    tags_json, favorite, usage_count, last_loaded_at, mtime, size, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, 'workflow', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                _workflow_library_insert_values(card, now),
            )
            conn.execute(
                """
                UPDATE workflows SET
                    name = ?, description = ?, workflow_id = ?, workflow_hash = ?, category = ?,
                    task = ?, model_family = ?, provider = ?, runs_on = ?,
                    detected_task = ?, detected_model_family = ?, detected_provider = ?, detected_runs_on = ?,
                    detection_confidence = ?,
                    detection_source = ?, detection_signals_json = ?, thumbnail_path = ?,
                    animated_thumbnail_path = ?, node_count = ?, link_count = ?, subgraph_count = ?,
                    missing_nodes_json = ?, missing_models_json = ?, mtime = ?, size = ?, updated_at = ?
                WHERE filepath = ?
                """,
                _workflow_library_update_values(card, now, filepath),
            )
            _apply_workflow_library_updates(conn, filepath=filepath, updates=updates, now=now)
            _mark_workflow_index_version(conn)
            row = conn.execute(
                "SELECT favorite, usage_count, last_loaded_at, tags_json FROM workflows WHERE filepath = ?",
                (filepath,),
            ).fetchone()
        return _workflow_library_row_meta(row)
    except Exception as exc:
        logger.debug("Workflow library metadata write failed", exc_info=True)
        return Result.Err("WORKFLOW_DB_FAILED", f"Failed to update workflow library metadata: {exc.__class__.__name__}")


def _find_thumbnail(path: Path, animated: bool = False) -> str:
    suffixes = ANIMATED_EXTS if animated else THUMBNAIL_EXTS
    for ext in suffixes:
        candidate = path.with_suffix(ext)
        try:
            if candidate.is_file():
                return str(candidate)
        except Exception:
            continue
    return ""


def _thumbnail_url(path: str) -> str:
    if not path:
        return ""
    return f"/mjr/am/workflows/thumbnail?filepath={quote(path, safe='')}"


def _download_preview_url(path: str) -> str:
    if not path:
        return ""
    return f"/mjr/am/download?filepath={quote(path, safe='')}&preview=1"


def _workflow_graph_map_thumbnail_url(path: str) -> str:
    if not path:
        return ""
    return f"/mjr/am/workflows/graph-map-thumbnail?filepath={quote(path, safe='')}"


def _layout_graph_map_nodes(
    nodes: list[dict[str, Any]],
    *,
    grid_cols: int,
) -> tuple[dict[str, tuple[float, float]], list[tuple[float, float, dict[str, Any]]]]:
    positions: dict[str, tuple[float, float]] = {}
    rendered_nodes: list[tuple[float, float, dict[str, Any]]] = []
    for index, node in enumerate(nodes):
        pos = node.get("pos") if isinstance(node.get("pos"), list) else None
        if pos and len(pos) >= 2:
            try:
                x = float(pos[0])
                y = float(pos[1])
            except Exception:
                x = float((index % grid_cols) * 150)
                y = float((index // grid_cols) * 54)
        else:
            x = float((index % grid_cols) * 150)
            y = float((index // grid_cols) * 54)
        node_id = str(node.get("id") or node.get("ID") or index)
        positions[node_id] = (x, y)
        rendered_nodes.append((x, y, node))
    return positions, rendered_nodes


def _graph_map_svg_link_parts(
    links: list[Any],
    positions: dict[str, tuple[float, float]],
    *,
    min_x: float,
    min_y: float,
    scale: float,
    node_w: float,
    node_h: float,
    margin: float,
) -> list[str]:
    parts: list[str] = []
    for link in links[:72]:
        if not isinstance(link, (list, tuple)) or len(link) < 4:
            continue
        origin = positions.get(str(link[1]).strip())
        target = positions.get(str(link[3]).strip())
        if not origin or not target:
            continue
        x1 = margin + (origin[0] - min_x) * scale + node_w * scale
        y1 = margin + (origin[1] - min_y) * scale + (node_h * scale) / 2
        x2 = margin + (target[0] - min_x) * scale
        y2 = margin + (target[1] - min_y) * scale + (node_h * scale) / 2
        parts.append(
            f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="rgba(255,255,255,0.18)" stroke-width="1.4" />'
        )
    return parts


def _graph_map_svg_node_parts(
    rendered_nodes: list[tuple[float, float, dict[str, Any]]],
    *,
    min_x: float,
    min_y: float,
    scale: float,
    node_w: float,
    node_h: float,
    margin: float,
) -> list[str]:
    parts: list[str] = []
    for index, (x, y, node) in enumerate(rendered_nodes):
        mx = margin + (x - min_x) * scale
        my = margin + (y - min_y) * scale
        node_label = html.escape(str(node.get("title") or node.get("type") or node.get("class_type") or "Node")[:28] or "Node", quote=True)
        node_id = html.escape(str(node.get("id") or node.get("ID") or index), quote=True)
        parts.append(
            f'<g><rect x="{mx:.1f}" y="{my:.1f}" width="{node_w * scale:.1f}" height="{node_h * scale:.1f}" rx="7" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" stroke-width="1" />'
            f'<text x="{mx + 8:.1f}" y="{my + 11:.1f}" font-size="8" fill="rgba(255,255,255,0.48)" font-family="Inter, Segoe UI, sans-serif">#{node_id}</text>'
            f'<text x="{mx + 8:.1f}" y="{my + 22:.1f}" font-size="11" fill="rgba(255,255,255,0.92)" font-family="Inter, Segoe UI, sans-serif">{node_label}</text></g>'
        )
    return parts


def _workflow_graph_map_svg(workflow: dict[str, Any]) -> str:
    parsed = parse_workflow(workflow)
    parsed_nodes = parsed.nodes if isinstance(parsed.nodes, list) else []
    nodes = [node for node in parsed_nodes if isinstance(node, dict)][:24]
    links_raw = workflow.get("links")
    links: list[Any] = list(links_raw) if isinstance(links_raw, list) else []
    width = 480
    height = 270
    margin = 16
    node_w = 118
    node_h = 30
    grid_cols = 3

    def _esc(value: Any) -> str:
        return html.escape(str(value or ""), quote=True)

    positions, rendered_nodes = _layout_graph_map_nodes(nodes, grid_cols=grid_cols)
    if rendered_nodes:
        min_x = min(x for x, _, _ in rendered_nodes)
        min_y = min(y for _, y, _ in rendered_nodes)
        max_x = max(x for x, _, _ in rendered_nodes) + node_w
        max_y = max(y for _, y, _ in rendered_nodes) + node_h
        scale = min(
            (width - margin * 2) / max(1.0, max_x - min_x),
            (height - margin * 2) / max(1.0, max_y - min_y),
            1.0,
        )
    else:
        min_x = min_y = 0.0
        scale = 1.0

    parts: list[str] = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-label="{_esc(workflow.get("name") or workflow.get("title") or "Workflow")}">',
        '<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#171c25" /><stop offset="100%" stop-color="#0d1017" /></linearGradient></defs>',
        '<rect width="100%" height="100%" fill="url(#bg)" />',
        '<rect x="0" y="0" width="100%" height="100%" fill="none" stroke="rgba(255,255,255,0.08)" />',
        f'<text x="16" y="22" font-size="14" fill="rgba(255,255,255,0.95)" font-family="Inter, Segoe UI, sans-serif">{_esc(workflow.get("name") or workflow.get("title") or "Workflow")}</text>',
        f'<text x="16" y="39" font-size="10" fill="rgba(255,255,255,0.52)" font-family="Inter, Segoe UI, sans-serif">{len(nodes)} nodes · {len(links)} links</text>',
    ]
    parts.extend(
        _graph_map_svg_link_parts(
            links,
            positions,
            min_x=min_x,
            min_y=min_y,
            scale=scale,
            node_w=node_w,
            node_h=node_h,
            margin=margin,
        )
    )
    parts.extend(
        _graph_map_svg_node_parts(
            rendered_nodes,
            min_x=min_x,
            min_y=min_y,
            scale=scale,
            node_w=node_w,
            node_h=node_h,
            margin=margin,
        )
    )
    parts.append('</svg>')
    return "".join(parts)


def workflow_graph_map_thumbnail_url(path: str) -> str:
    return _workflow_graph_map_thumbnail_url(path)


def workflow_graph_map_svg(workflow: dict[str, Any]) -> str:
    return _workflow_graph_map_svg(workflow)


def _is_supported_linked_preview(path: Path) -> bool:
    return path.suffix.lower() in set(LINKED_PREVIEW_EXTS)


def _is_path_inside(path: Path, root: Path) -> bool:
    try:
        resolved = path.resolve(strict=True)
        root_resolved = root.resolve(strict=False)
        return resolved == root_resolved or root_resolved in resolved.parents
    except Exception:
        return False


def _is_allowed_thumbnail_source(path: Path) -> bool:
    try:
        resolved = path.resolve(strict=True)
    except Exception:
        return False
    ext = resolved.suffix.lower()
    if ext not in STATIC_THUMBNAIL_SOURCE_EXTS and ext not in VIDEO_THUMBNAIL_SOURCE_EXTS:
        return False
    roots: list[Path] = []
    try:
        out_dir = get_output_directory() or OUTPUT_ROOT
        roots.append(Path(out_dir))
    except Exception:
        pass
    try:
        roots.append(Path(OUTPUT_ROOT))
    except Exception:
        pass
    return any(_is_path_inside(resolved, root) for root in roots)


def _ffmpeg_bin() -> str:
    configured = str(FFPROBE_BIN or "ffprobe")
    if "ffprobe" in configured.lower():
        return configured.replace("ffprobe", "ffmpeg")
    return "ffmpeg"


def _convert_video_to_workflow_thumbnail(source: Path, target: Path) -> Result[dict[str, Any]]:
    target.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        _ffmpeg_bin(),
        "-y",
        "-t",
        str(WORKFLOW_VIDEO_THUMBNAIL_SECONDS),
        "-i",
        str(source),
        "-vf",
        "fps=8,scale='min(360,iw)':-2",
        "-loop",
        "0",
        "-an",
        "-compression_level",
        "6",
        "-quality",
        "72",
        str(target),
    ]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=45)
    except FileNotFoundError:
        return Result.Err("TOOL_MISSING", "ffmpeg is required to convert video thumbnails")
    except subprocess.TimeoutExpired:
        return Result.Err("WORKFLOW_WRITE_FAILED", "Video thumbnail conversion timed out")
    except Exception as exc:
        return Result.Err("WORKFLOW_WRITE_FAILED", f"Failed to convert video thumbnail: {exc.__class__.__name__}")
    if proc.returncode != 0 or not target.exists():
        logger.debug("Workflow video thumbnail conversion failed: %s", proc.stderr)
        return Result.Err("WORKFLOW_WRITE_FAILED", "Failed to convert video thumbnail")
    return Result.Ok({"target": str(target)})


def _clear_stale_workflow_thumbnails(workflow_path: Path, keep_suffix: str) -> None:
    for ext in set(THUMBNAIL_EXTS + ANIMATED_EXTS):
        if ext == keep_suffix.lower():
            continue
        stale = workflow_path.with_suffix(ext)
        if stale.exists():
            try:
                stale.unlink()
            except Exception:
                pass


def _collect_linked_preview_keys(cards: list[dict[str, Any]]) -> tuple[set[str], set[str]]:
    workflow_ids: set[str] = set()
    workflow_hashes: set[str] = set()
    for card in cards:
        if str(card.get("thumbnail_path") or "").strip() and str(card.get("animated_thumbnail_path") or "").strip():
            continue
        workflow_id = str(card.get("workflow_id") or "").strip()
        workflow_hash = str(card.get("workflow_hash") or "").strip()
        if workflow_id:
            workflow_ids.add(workflow_id)
        if workflow_hash:
            workflow_hashes.add(workflow_hash)
    return workflow_ids, workflow_hashes


def _build_linked_preview_sql(workflow_ids: set[str], workflow_hashes: set[str]) -> tuple[str, list[Any]] | tuple[None, None]:
    index_db_path = get_runtime_index_db_path()
    if not index_db_path.exists():
        return None, None

    clauses: list[str] = []
    params: list[Any] = []
    if workflow_ids:
        placeholders = ",".join("?" for _ in workflow_ids)
        clauses.append(f"a.workflow_id IN ({placeholders})")
        params.extend(sorted(workflow_ids))
    if workflow_hashes:
        placeholders = ",".join("?" for _ in workflow_hashes)
        clauses.append(f"m.workflow_hash IN ({placeholders})")
        params.extend(sorted(workflow_hashes))
    if not clauses:
        return None, None

    return (
        "SELECT a.filepath, COALESCE(a.workflow_id, '') AS workflow_id, "
        "COALESCE(m.workflow_hash, '') AS workflow_hash "
        "FROM assets a "
        "LEFT JOIN asset_metadata m ON m.asset_id = a.id "
        "WHERE COALESCE(a.filepath, '') <> '' AND ("
        + " OR ".join(clauses)
        + ") "
        "ORDER BY COALESCE(a.mtime, 0) DESC, a.id DESC",
        params,
    )


def _linked_preview_maps(cards: list[dict[str, Any]]) -> tuple[dict[str, str], dict[str, str]]:
    workflow_ids, workflow_hashes = _collect_linked_preview_keys(cards)
    if not workflow_ids and not workflow_hashes:
        return {}, {}

    sql_data = _build_linked_preview_sql(workflow_ids, workflow_hashes)
    if not sql_data[0]:
        return {}, {}
    sql, params = sql_data
    index_db_path = get_runtime_index_db_path()

    static_by_key: dict[str, str] = {}
    animated_by_key: dict[str, str] = {}
    try:
        with sqlite3.connect(str(index_db_path)) as conn:
            rows = conn.execute(sql, tuple(params or [])).fetchall()
    except Exception:
        return {}, {}

    for filepath_raw, wf_id_raw, wf_hash_raw in rows:
        filepath = str(filepath_raw or "").strip()
        if not filepath:
            continue
        candidate = Path(filepath)
        try:
            if not candidate.is_file() or not _is_supported_linked_preview(candidate):
                continue
        except Exception:
            continue
        ext = candidate.suffix.lower()
        is_animated = ext in set(ANIMATED_EXTS)
        keys = []
        wf_id = str(wf_id_raw or "").strip()
        wf_hash = str(wf_hash_raw or "").strip()
        if wf_id:
            keys.append(("id", wf_id))
        if wf_hash:
            keys.append(("hash", wf_hash))
        for key_type, value in keys:
            key = f"{key_type}:{value}"
            if not is_animated and key not in static_by_key:
                static_by_key[key] = filepath
            if is_animated and key not in animated_by_key:
                animated_by_key[key] = filepath

    return static_by_key, animated_by_key


def _apply_linked_preview_fallback(cards: list[dict[str, Any]]) -> None:
    static_by_key, animated_by_key = _linked_preview_maps(cards)
    if not static_by_key and not animated_by_key:
        return

    for card in cards:
        workflow_id = str(card.get("workflow_id") or "").strip()
        workflow_hash = str(card.get("workflow_hash") or "").strip()
        keys = []
        if workflow_id:
            keys.append(f"id:{workflow_id}")
        if workflow_hash:
            keys.append(f"hash:{workflow_hash}")

        if not str(card.get("thumbnail_path") or "").strip():
            linked_image = next((static_by_key.get(key, "") for key in keys if static_by_key.get(key)), "")
            if linked_image:
                card["thumbnail_path"] = linked_image
                card["thumbnail_url"] = _download_preview_url(linked_image)

        if not str(card.get("animated_thumbnail_path") or "").strip():
            linked_animated = next((animated_by_key.get(key, "") for key in keys if animated_by_key.get(key)), "")
            if linked_animated:
                card["animated_thumbnail_path"] = linked_animated
                card["animated_thumbnail_url"] = _download_preview_url(linked_animated)


def is_workflow_thumbnail_path(path: Path) -> bool:
    try:
        resolved = path.resolve(strict=True)
        if resolved.suffix.lower() not in set(THUMBNAIL_EXTS + ANIMATED_EXTS):
            return False
        for root in workflow_roots():
            root_resolved = root.resolve(strict=False)
            if resolved == root_resolved or root_resolved in resolved.parents:
                return True
    except Exception:
        return False
    return False


def is_workflow_json_path(path: Path) -> bool:
    try:
        resolved = path.resolve(strict=True)
        if resolved.suffix.lower() != ".json":
            return False
        for root in workflow_roots():
            root_resolved = root.resolve(strict=False)
            if resolved == root_resolved or root_resolved in resolved.parents:
                return True
    except Exception:
        return False
    return False


def is_managed_workflow_json_path(path: Path) -> bool:
    root = managed_workflow_root(create=False)
    if root is None:
        return False
    try:
        resolved = path.resolve(strict=True)
        root_resolved = root.resolve(strict=False)
        return resolved.suffix.lower() == ".json" and (
            resolved == root_resolved or root_resolved in resolved.parents
        )
    except Exception:
        return False


def read_workflow_content(path: Path) -> Result[dict[str, Any]]:
    if not is_workflow_json_path(path):
        return Result.Err("FORBIDDEN", "Workflow path is not allowed")
    workflow = _safe_read_workflow_json(path)
    if workflow is None:
        return Result.Err("INVALID_WORKFLOW", "Workflow JSON is missing or invalid")
    try:
        resolved = path.resolve(strict=True)
        stat = resolved.stat()
    except FileNotFoundError:
        return Result.Err("NOT_FOUND", "Workflow not found")
    except Exception:
        return Result.Err("WORKFLOW_READ_FAILED", "Failed to read workflow file")
    return Result.Ok(
        {
            "workflow": workflow,
            "filepath": str(resolved),
            "filename": resolved.name,
            "mtime": int(stat.st_mtime or 0),
            "size": int(stat.st_size or 0),
        }
    )


MODEL_REF_EXTS = (".safetensors", ".ckpt", ".pt", ".pth", ".gguf", ".onnx", ".bin")


def _workflow_node_type(node: dict[str, Any]) -> str:
    return str(node.get("type") or node.get("class_type") or node.get("comfyClass") or "").strip()


def _workflow_value_model_refs(value: Any) -> list[str]:
    refs: list[str] = []
    if isinstance(value, str):
        text = value.strip()
        lower = text.lower()
        if text and any(ext in lower for ext in MODEL_REF_EXTS):
            refs.append(text)
    elif isinstance(value, list):
        for item in value[:32]:
            refs.extend(_workflow_value_model_refs(item))
    elif isinstance(value, dict):
        for item in list(value.values())[:64]:
            refs.extend(_workflow_value_model_refs(item))
    return refs


def _workflow_required_models(nodes: list[dict[str, Any]]) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for node in nodes:
        for key in ("widgets_values", "inputs", "properties"):
            for ref in _workflow_value_model_refs(node.get(key)):
                normalized = ref.strip()
                if normalized and normalized.lower() not in seen:
                    seen.add(normalized.lower())
                    out.append(normalized)
    return out


def _workflow_missing_nodes(required_nodes: list[str]) -> tuple[list[str], bool]:
    available = get_available_node_types()
    if not available:
        return [], False
    available_lower = {item.lower() for item in available}
    missing = [node for node in required_nodes if node.lower() not in available_lower]
    return missing, True


def _workflow_missing_models(required_models: list[str]) -> tuple[list[str], bool]:
    available = get_model_filenames()
    if not available:
        return [], False
    available_lower = {item.lower().replace("\\", "/") for item in available}
    missing: list[str] = []
    for model in required_models:
        normalized = model.lower().replace("\\", "/")
        basename = Path(model).name.lower()
        if normalized not in available_lower and basename not in available_lower:
            missing.append(model)
    return missing, True


def _workflow_manager_registry_json_candidates(manager_root: Path) -> list[Path]:
    try:
        return [
            item
            for item in manager_root.rglob("*.json")
            if item.is_file()
            and item.stat().st_size <= 10 * 1024 * 1024
            and any(token in item.name.lower() for token in ("node", "custom", "extension", "registry"))
        ][:40]
    except Exception:
        return []


def _workflow_manager_registry_source(candidate: Path, text: str) -> str:
    source = candidate.name
    try:
        data = json.loads(text)
    except Exception:
        return source
    if not isinstance(data, dict):
        return source
    source = str(data.get("title") or data.get("name") or data.get("nickname") or source)
    repo = data.get("reference") or data.get("url") or data.get("files")
    if isinstance(repo, str) and repo.strip():
        return f"{source} ({repo.strip()})"
    return source


def _workflow_manager_registry_matches(
    candidate: Path,
    wanted: dict[str, str],
) -> tuple[list[str], str] | None:
    try:
        text = candidate.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return None
    lower = text.lower()
    matched = [original for needle, original in wanted.items() if needle in lower]
    if not matched:
        return None
    return matched, _workflow_manager_registry_source(candidate, text)


def _workflow_manager_registry_hints(missing_nodes: list[str]) -> tuple[dict[str, list[str]], bool]:
    if not missing_nodes:
        return {}, False
    comfy_root = _detect_comfy_root()
    if comfy_root is None:
        return {}, False
    manager_root = comfy_root / "custom_nodes" / "ComfyUI-Manager"
    if not manager_root.is_dir():
        return {}, False
    wanted = {node.lower(): node for node in missing_nodes}
    hints: dict[str, list[str]] = {node: [] for node in missing_nodes}
    scanned = False
    candidates = _workflow_manager_registry_json_candidates(manager_root)
    for candidate in candidates:
        match = _workflow_manager_registry_matches(candidate, wanted)
        if not match:
            continue
        scanned = True
        matched, source = match
        for node in matched:
            if source not in hints[node]:
                hints[node].append(source)
    return {node: values[:5] for node, values in hints.items() if values}, scanned or bool(candidates)


def _workflow_format(workflow: dict[str, Any]) -> str:
    if isinstance(workflow.get("nodes"), list):
        return "workflow-json"
    prompt = workflow.get("prompt")
    if isinstance(prompt, dict):
        return "prompt-graph-wrapper"
    if isinstance(workflow.get("prompt"), str):
        return "prompt-graph-wrapper"
    if all(isinstance(value, dict) and isinstance(value.get("inputs"), dict) for value in list(workflow.values())[:5]):
        return "prompt-graph"
    return "unknown"


def validate_workflow_content(workflow: dict[str, Any]) -> Result[dict[str, Any]]:
    if not isinstance(workflow, dict):
        return Result.Err("INVALID_WORKFLOW", "Workflow JSON must be an object")
    parsed = parse_workflow(workflow)
    required_nodes = sorted(
        {
            node_type
            for node_type in (_workflow_node_type(node) for node in parsed.nodes)
            if node_type
        },
        key=str.lower,
    )
    required_models = _workflow_required_models(parsed.nodes)
    detected_missing_nodes, node_check_available = _workflow_missing_nodes(required_nodes)
    detected_missing_models, model_check_available = _workflow_missing_models(required_models)
    missing_nodes = detected_missing_nodes if node_check_available else _as_str_list(workflow.get("missing_nodes"))
    missing_models = detected_missing_models if model_check_available else _as_str_list(workflow.get("missing_models"))
    manager_hints, manager_check_available = _workflow_manager_registry_hints(missing_nodes)
    api_nodes = [node_type for node_type in required_nodes if node_type.lower().endswith("api")]
    warnings: list[str] = []
    if _workflow_format(workflow) == "unknown":
        warnings.append("Workflow shape is not a standard ComfyUI workflow JSON.")
    if parsed.subgraph_count and parsed.qualified_node_ids:
        warnings.append("Subgraph node ids are graph-local; use qualified_node_ids for exact lookups.")
    return Result.Ok(
        {
            "valid": True,
            "format": _workflow_format(workflow),
            "node_count": parsed.node_count + parsed.subgraph_node_count,
            "root_node_count": parsed.node_count,
            "link_count": parsed.link_count,
            "subgraph_count": parsed.subgraph_count,
            "subgraph_node_count": parsed.subgraph_node_count,
            "qualified_node_ids": parsed.qualified_node_ids or [],
            "required_nodes": required_nodes,
            "required_models": required_models,
            "missing_nodes": missing_nodes,
            "missing_models": missing_models,
            "manager_registry_hints": manager_hints,
            "dependency_checks": {
                "nodes": "runtime" if node_check_available else "unavailable",
                "models": "folder_paths" if model_check_available else "unavailable",
                "manager_registry": "scanned" if manager_check_available else "unavailable",
            },
            "api_nodes": api_nodes,
            "warnings": warnings,
        }
    )


def validate_workflow(path: Path) -> Result[dict[str, Any]]:
    content = read_workflow_content(path)
    if not content.ok:
        return Result.Err(content.code or "INVALID_WORKFLOW", content.error or "Failed to read workflow")
    data = content.data or {}
    workflow = data.get("workflow")
    if not isinstance(workflow, dict):
        return Result.Err("INVALID_WORKFLOW", "Workflow JSON is missing or invalid")
    validated = validate_workflow_content(workflow)
    if not validated.ok:
        return validated
    result = dict(validated.data or {})
    result.update(
        {
            "filepath": data.get("filepath"),
            "filename": data.get("filename"),
            "mtime": data.get("mtime"),
            "size": data.get("size"),
        }
    )
    return Result.Ok(result)


def _workflow_history_dir(path: Path) -> Path:
    return path.parent / WORKFLOW_HISTORY_DIRNAME / path.stem


def _snapshot_workflow_version(path: Path, *, reason: str) -> Result[dict[str, Any]]:
    try:
        resolved = path.resolve(strict=True)
    except FileNotFoundError:
        return Result.Ok({"snapshotted": False, "reason": "missing"})
    if not is_managed_workflow_json_path(resolved):
        return Result.Ok({"snapshotted": False, "reason": "not-managed"})
    workflow = _safe_read_workflow_json(resolved)
    if workflow is None:
        return Result.Ok({"snapshotted": False, "reason": "invalid"})
    try:
        history_dir = _workflow_history_dir(resolved)
        history_dir.mkdir(parents=True, exist_ok=True)
        stamp = time.strftime("%Y%m%d-%H%M%S", time.localtime())
        safe_reason = _sanitize_name(reason, "change")
        target = history_dir / f"{stamp}-{safe_reason}.json"
        if target.exists():
            target = history_dir / f"{stamp}-{safe_reason}-{int(time.time() * 1000) % 1000}.json"
        write = _atomic_write_json(target, workflow)
        if not write.ok:
            return Result.Err(write.code or "WORKFLOW_HISTORY_FAILED", write.error or "Failed to snapshot workflow")
        return Result.Ok({"snapshotted": True, "filepath": str(target), "reason": reason})
    except Exception as exc:
        return Result.Err("WORKFLOW_HISTORY_FAILED", f"Failed to snapshot workflow: {exc.__class__.__name__}")


def list_workflow_versions(path: Path) -> Result[dict[str, Any]]:
    if not is_managed_workflow_json_path(path):
        return Result.Err("FORBIDDEN", "Workflow path is not allowed")
    try:
        resolved = path.resolve(strict=True)
    except FileNotFoundError:
        return Result.Err("NOT_FOUND", "Workflow not found")
    history_dir = _workflow_history_dir(resolved)
    versions: list[dict[str, Any]] = []
    if history_dir.is_dir():
        for candidate in sorted(history_dir.glob("*.json"), key=lambda item: item.stat().st_mtime, reverse=True):
            try:
                stat = candidate.stat()
            except Exception:
                continue
            versions.append(
                {
                    "filepath": str(candidate),
                    "filename": candidate.name,
                    "mtime": int(stat.st_mtime or 0),
                    "size": int(stat.st_size or 0),
                }
            )
    return Result.Ok({"filepath": str(resolved), "versions": versions, "count": len(versions)})


def _flatten_json(value: Any, prefix: str = "") -> dict[str, Any]:
    if isinstance(value, dict):
        out: dict[str, Any] = {}
        for key, item in value.items():
            child = f"{prefix}.{key}" if prefix else str(key)
            out.update(_flatten_json(item, child))
        return out
    if isinstance(value, list):
        out = {}
        for index, item in enumerate(value):
            child = f"{prefix}[{index}]"
            out.update(_flatten_json(item, child))
        return out
    return {prefix: value}


def diff_workflow_versions(path: Path, *, version_filepath: Any = "") -> Result[dict[str, Any]]:
    if not is_managed_workflow_json_path(path):
        return Result.Err("FORBIDDEN", "Workflow path is not allowed")
    try:
        current_path = path.resolve(strict=True)
    except FileNotFoundError:
        return Result.Err("NOT_FOUND", "Workflow not found")
    versions = list_workflow_versions(current_path)
    if not versions.ok:
        return versions
    requested = str(version_filepath or "").strip()
    if requested:
        try:
            version_path = Path(requested).resolve(strict=True)
        except FileNotFoundError:
            return Result.Err("NOT_FOUND", "Workflow version not found")
        history_root = _workflow_history_dir(current_path).resolve(strict=False)
        if version_path != history_root and history_root not in version_path.parents:
            return Result.Err("FORBIDDEN", "Workflow version path is not allowed")
    else:
        items = (versions.data or {}).get("versions") or []
        if not items:
            return Result.Ok({"filepath": str(current_path), "version": "", "added": [], "removed": [], "changed": [], "total": 0})
        version_path = Path(str(items[0].get("filepath") or ""))
    current = _safe_read_workflow_json(current_path)
    previous = _safe_read_workflow_json(version_path)
    if current is None or previous is None:
        return Result.Err("INVALID_WORKFLOW", "Workflow JSON is missing or invalid")
    current_flat = _flatten_json(current)
    previous_flat = _flatten_json(previous)
    current_keys = set(current_flat)
    previous_keys = set(previous_flat)
    added = sorted(current_keys - previous_keys)[:500]
    removed = sorted(previous_keys - current_keys)[:500]
    changed = sorted(key for key in current_keys & previous_keys if current_flat[key] != previous_flat[key])[:500]
    return Result.Ok(
        {
            "filepath": str(current_path),
            "version": str(version_path),
            "added": added,
            "removed": removed,
            "changed": changed,
            "total": len(added) + len(removed) + len(changed),
        }
    )


def _workflow_save_info_updates(card: dict[str, Any], *, info: dict[str, Any] | None = None) -> dict[str, str]:
    source = info or {}
    updates: dict[str, str] = {}
    for key in ("task", "model_family", "provider", "runs_on"):
        value = str(source.get(key) or "").strip()
        if not value:
            value = str(card.get(f"detected_{key}") or card.get(key) or "").strip()
        if key == "runs_on":
            value = value.lower()
        if value:
            updates[key] = value
    notes = str(source.get("notes") or "").strip()
    if notes:
        updates["notes"] = notes
    return updates


def save_workflow(
    *,
    workflow: dict[str, Any],
    name: Any = "",
    category: Any = "",
    overwrite: bool = False,
    filepath: Any = "",
    info: dict[str, Any] | None = None,
) -> Result[dict[str, Any]]:
    if not isinstance(workflow, dict):
        return Result.Err("INVALID_WORKFLOW", "Workflow JSON must be an object")
    if filepath:
        target = Path(str(filepath))
        if not is_managed_workflow_json_path(target):
            return Result.Err("FORBIDDEN", "Workflow path is not allowed")
        try:
            target = target.resolve(strict=True)
        except FileNotFoundError:
            return Result.Err("NOT_FOUND", "Workflow not found")
        if not overwrite:
            return Result.Err("WORKFLOW_EXISTS", "Workflow already exists")
        snapshot = _snapshot_workflow_version(target, reason="overwrite")
        if not snapshot.ok:
            return Result.Err(snapshot.code or "WORKFLOW_HISTORY_FAILED", snapshot.error or "Failed to snapshot workflow")
    else:
        target_res = _resolve_managed_target(name or workflow.get("name") or workflow.get("title"), category)
        if not target_res.ok:
            return Result.Err(target_res.code or "WORKFLOW_WRITE_FAILED", target_res.error or "Invalid workflow target")
        target_data = target_res.data
        if not isinstance(target_data, Path):
            return Result.Err("WORKFLOW_WRITE_FAILED", "Invalid workflow target")
        target = target_data
    write = _atomic_write_json(target, workflow)
    if not write.ok:
        return Result.Err(write.code or "WORKFLOW_WRITE_FAILED", write.error or "Failed to save workflow")
    root = managed_workflow_root(create=False) or target.parent
    card = _workflow_to_card(target, root)
    if card is None:
        return Result.Err("INVALID_WORKFLOW", "Workflow JSON is missing or invalid")
    metadata_updates = _workflow_save_info_updates(card, info=info)
    if metadata_updates:
        meta_write = _upsert_workflow_library_card(card, updates=metadata_updates)
        if not meta_write.ok:
            return Result.Err(
                meta_write.code or "WORKFLOW_DB_FAILED",
                meta_write.error or "Failed to save workflow info",
            )
        card = _workflow_to_card(target, root) or card
    return Result.Ok({"saved": True, "workflow": card, "filepath": str(target)})


def duplicate_workflow(path: Path, *, name: Any = "") -> Result[dict[str, Any]]:
    content = read_workflow_content(path)
    if not content.ok:
        return content
    content_data = content.data
    if not isinstance(content_data, dict):
        return Result.Err("INVALID_WORKFLOW", "Workflow JSON is missing or invalid")
    source = Path(str(content_data.get("filepath") or path))
    next_name = name or f"{source.stem} copy"
    workflow_data = content_data.get("workflow")
    if not isinstance(workflow_data, dict):
        return Result.Err("INVALID_WORKFLOW", "Workflow JSON is missing or invalid")
    return save_workflow(workflow=workflow_data, name=next_name, category=_category_for_path(source))


def _category_for_path(path: Path) -> str:
    root = managed_workflow_root(create=False)
    if root is None:
        return ""
    try:
        rel_parent = path.resolve(strict=False).parent.relative_to(root)
        rel = str(rel_parent).replace("\\", "/")
        return "" if rel == "." else rel
    except Exception:
        return ""


def _move_workflow_thumbnail_siblings(source: Path, target: Path) -> None:
    for ext in set(THUMBNAIL_EXTS + ANIMATED_EXTS):
        thumb = source.with_suffix(ext)
        if thumb.exists():
            shutil.move(str(thumb), str(target.with_suffix(ext)))


def _move_workflow_history_dir(source: Path, target: Path) -> None:
    source_history = _workflow_history_dir(source)
    target_history = _workflow_history_dir(target)
    if not source_history.exists() or source_history.resolve(strict=False) == target_history.resolve(strict=False):
        return
    target_history.parent.mkdir(parents=True, exist_ok=True)
    if not target_history.exists():
        shutil.move(str(source_history), str(target_history))
        return
    for item in source_history.glob("*.json"):
        shutil.move(str(item), str(target_history / item.name))
    try:
        source_history.rmdir()
    except Exception:
        pass


def _update_workflow_library_filepath(source: Path, target: Path) -> None:
    try:
        db_path = _workflow_library_db_path()
        if not db_path.exists():
            return
        with sqlite3.connect(str(db_path)) as conn:
            _ensure_workflow_library_schema(conn)
            conn.execute(
                "UPDATE workflows SET filepath = ?, updated_at = ? WHERE filepath = ?",
                (str(target), int(time.time()), str(source)),
            )
    except Exception:
        logger.debug("Workflow library filepath update failed after move", exc_info=True)


def move_or_rename_workflow(path: Path, *, name: Any = "", category: Any = "") -> Result[dict[str, Any]]:
    if not is_managed_workflow_json_path(path):
        return Result.Err("FORBIDDEN", "Workflow path is not allowed")
    try:
        source = path.resolve(strict=True)
    except FileNotFoundError:
        return Result.Err("NOT_FOUND", "Workflow not found")
    target_name = name or source.stem
    target_category = category if str(category or "").strip() else _category_for_path(source)
    root = managed_workflow_root(create=True)
    if root is None:
        return Result.Err("WORKFLOW_ROOT_UNAVAILABLE", "Managed workflow root is unavailable")
    stem = _sanitize_name(target_name, "workflow")
    if stem.lower().endswith(".json"):
        stem = stem[:-5].strip(" ._") or "workflow"
    category_rel = _sanitize_category(target_category)
    target_folder = (root / category_rel if category_rel else root).resolve(strict=False)
    intended_target = target_folder / f"{stem}.json"
    if intended_target.resolve(strict=False) == source.resolve(strict=False):
        card = _workflow_to_card(source, root)
        if card is None:
            return Result.Err("INVALID_WORKFLOW", "Workflow JSON is missing or invalid")
        return Result.Ok({"moved": False, "workflow": card, "filepath": str(source)})
    snapshot = _snapshot_workflow_version(source, reason="move")
    if not snapshot.ok:
        return Result.Err(snapshot.code or "WORKFLOW_HISTORY_FAILED", snapshot.error or "Failed to snapshot workflow")
    target_res = _resolve_managed_target(target_name, target_category)
    if not target_res.ok:
        return Result.Err(target_res.code or "WORKFLOW_MOVE_FAILED", target_res.error or "Invalid workflow target")
    target_data = target_res.data
    if not isinstance(target_data, Path):
        return Result.Err("WORKFLOW_MOVE_FAILED", "Invalid workflow target")
    target = target_data
    try:
        shutil.move(str(source), str(target))
        _move_workflow_thumbnail_siblings(source, target)
        _move_workflow_history_dir(source, target)
    except Exception as exc:
        return Result.Err("WORKFLOW_MOVE_FAILED", f"Failed to move workflow: {exc.__class__.__name__}")
    _update_workflow_library_filepath(source, target)
    root = managed_workflow_root(create=False) or target.parent
    return Result.Ok({"moved": True, "workflow": _workflow_to_card(target, root), "filepath": str(target)})


def delete_workflow(path: Path) -> Result[dict[str, Any]]:
    if not is_managed_workflow_json_path(path):
        return Result.Err("FORBIDDEN", "Workflow path is not allowed")
    try:
        resolved = path.resolve(strict=True)
    except FileNotFoundError:
        return Result.Err("NOT_FOUND", "Workflow not found")
    deleted = 0
    snapshot = _snapshot_workflow_version(resolved, reason="delete")
    if not snapshot.ok:
        return Result.Err(snapshot.code or "WORKFLOW_HISTORY_FAILED", snapshot.error or "Failed to snapshot workflow")
    try:
        resolved.unlink()
        deleted += 1
        for ext in set(THUMBNAIL_EXTS + ANIMATED_EXTS):
            thumb = resolved.with_suffix(ext)
            if thumb.exists():
                thumb.unlink()
                deleted += 1
    except Exception as exc:
        return Result.Err("WORKFLOW_DELETE_FAILED", f"Failed to delete workflow: {exc.__class__.__name__}")
    try:
        db_path = _workflow_library_db_path()
        if db_path.exists():
            with sqlite3.connect(str(db_path)) as conn:
                _ensure_workflow_library_schema(conn)
                conn.execute("DELETE FROM workflows WHERE filepath = ?", (str(resolved),))
    except Exception:
        logger.debug("Workflow library metadata delete failed", exc_info=True)
    return Result.Ok({"deleted": deleted, "filepath": str(resolved)})


def mark_workflow_loaded(path: Path) -> Result[dict[str, Any]]:
    if not is_managed_workflow_json_path(path):
        return Result.Err("FORBIDDEN", "Workflow path is not allowed")
    try:
        resolved = path.resolve(strict=True)
    except FileNotFoundError:
        return Result.Err("NOT_FOUND", "Workflow not found")

    workflow = _safe_read_workflow_json(resolved)
    if workflow is None:
        return Result.Err("INVALID_WORKFLOW", "Workflow JSON is missing or invalid")

    card = _workflow_to_card(resolved, managed_workflow_root(create=False) or resolved.parent)
    if card is None:
        return Result.Err("INVALID_WORKFLOW", "Workflow JSON is missing or invalid")
    usage_count = max(0, _to_int(card.get("usage_count"), 0)) + 1
    last_loaded_at = int(time.time())

    write = _upsert_workflow_library_card(card, updates={"usage_count": usage_count, "last_loaded_at": last_loaded_at})
    if not write.ok:
        return Result.Err(write.code or "WORKFLOW_DB_FAILED", write.error or "Failed to update workflow usage")

    return Result.Ok(
        {
            "updated": True,
            "filepath": str(resolved),
            "usage_count": usage_count,
            "last_loaded_at": last_loaded_at,
        }
    )


def set_workflow_favorite(path: Path, *, favorite: Any = False) -> Result[dict[str, Any]]:
    if not is_managed_workflow_json_path(path):
        return Result.Err("FORBIDDEN", "Workflow path is not allowed")
    try:
        resolved = path.resolve(strict=True)
    except FileNotFoundError:
        return Result.Err("NOT_FOUND", "Workflow not found")

    workflow = _safe_read_workflow_json(resolved)
    if workflow is None:
        return Result.Err("INVALID_WORKFLOW", "Workflow JSON is missing or invalid")

    card = _workflow_to_card(resolved, managed_workflow_root(create=False) or resolved.parent)
    if card is None:
        return Result.Err("INVALID_WORKFLOW", "Workflow JSON is missing or invalid")
    next_value = _to_bool(favorite, False)
    write = _upsert_workflow_library_card(card, updates={"favorite": next_value})
    if not write.ok:
        return Result.Err(write.code or "WORKFLOW_DB_FAILED", write.error or "Failed to update workflow favorite")

    return Result.Ok(
        {
            "updated": True,
            "filepath": str(resolved),
            "favorite": next_value,
        }
    )


def set_workflow_tags(path: Path, *, tags: Any = ()) -> Result[dict[str, Any]]:
    if not is_managed_workflow_json_path(path):
        return Result.Err("FORBIDDEN", "Workflow path is not allowed")
    try:
        resolved = path.resolve(strict=True)
    except FileNotFoundError:
        return Result.Err("NOT_FOUND", "Workflow not found")

    workflow = _safe_read_workflow_json(resolved)
    if workflow is None:
        return Result.Err("INVALID_WORKFLOW", "Workflow JSON is missing or invalid")

    card = _workflow_to_card(resolved, managed_workflow_root(create=False) or resolved.parent)
    if card is None:
        return Result.Err("INVALID_WORKFLOW", "Workflow JSON is missing or invalid")
    next_tags = _as_str_list(tags)
    write = _upsert_workflow_library_card(card, updates={"tags": next_tags})
    if not write.ok:
        return Result.Err(write.code or "WORKFLOW_DB_FAILED", write.error or "Failed to update workflow tags")

    return Result.Ok(
        {
            "updated": True,
            "filepath": str(resolved),
            "tags": next_tags,
        }
    )


def set_workflow_info(path: Path, *, info: dict[str, Any] | None = None) -> Result[dict[str, Any]]:
    if not is_managed_workflow_json_path(path):
        return Result.Err("FORBIDDEN", "Workflow path is not allowed")
    try:
        resolved = path.resolve(strict=True)
    except FileNotFoundError:
        return Result.Err("NOT_FOUND", "Workflow not found")
    workflow = _safe_read_workflow_json(resolved)
    if workflow is None:
        return Result.Err("INVALID_WORKFLOW", "Workflow JSON is missing or invalid")
    card = _workflow_to_card(resolved, managed_workflow_root(create=False) or resolved.parent)
    if card is None:
        return Result.Err("INVALID_WORKFLOW", "Workflow JSON is missing or invalid")
    updates = {
        "task": (info or {}).get("task", ""),
        "model_family": (info or {}).get("model_family", ""),
        "provider": (info or {}).get("provider", ""),
        "runs_on": (info or {}).get("runs_on", ""),
        "notes": (info or {}).get("notes", ""),
    }
    write = _upsert_workflow_library_card(card, updates=updates)
    if not write.ok:
        return Result.Err(write.code or "WORKFLOW_DB_FAILED", write.error or "Failed to update workflow info")
    next_card = _workflow_to_card(resolved, managed_workflow_root(create=False) or resolved.parent) or card
    return Result.Ok({"updated": True, "filepath": str(resolved), "workflow": next_card})


def list_workflow_thumbnail_candidates(path: Path, *, limit: int = 12) -> Result[list[dict[str, Any]]]:
    if not is_managed_workflow_json_path(path):
        return Result.Err("FORBIDDEN", "Workflow path is not allowed")
    try:
        resolved = path.resolve(strict=True)
    except FileNotFoundError:
        return Result.Err("NOT_FOUND", "Workflow not found")

    workflow = _safe_read_workflow_json(resolved)
    if workflow is None:
        return Result.Err("INVALID_WORKFLOW", "Workflow JSON is missing or invalid")

    workflow_id = str(workflow.get("id") or "").strip()
    workflow_hash = _workflow_hash(resolved)
    if not workflow_id and not workflow_hash:
        return Result.Ok([])

    index_db_path = get_runtime_index_db_path()
    if not index_db_path.exists():
        return Result.Ok([])

    clauses: list[str] = []
    params: list[Any] = []
    if workflow_id:
        clauses.append("a.workflow_id = ?")
        params.append(workflow_id)
    if workflow_hash:
        clauses.append("m.workflow_hash = ?")
        params.append(workflow_hash)
    if not clauses:
        return Result.Ok([])

    sql = (
        "SELECT a.filepath, a.filename, a.subfolder, a.mtime, a.size, a.kind, "
        "COALESCE(a.workflow_id, '') AS workflow_id, COALESCE(m.workflow_hash, '') AS workflow_hash "
        "FROM assets a "
        "LEFT JOIN asset_metadata m ON m.asset_id = a.id "
        "WHERE COALESCE(a.filepath, '') <> '' AND (" + " OR ".join(clauses) + ") "
        "ORDER BY COALESCE(a.mtime, 0) DESC, a.id DESC"
    )

    candidates: list[dict[str, Any]] = []
    seen: set[str] = set()
    try:
        with sqlite3.connect(str(index_db_path)) as conn:
            rows = conn.execute(sql, tuple(params)).fetchall()
    except Exception as exc:
        logger.debug("Workflow thumbnail candidates query failed", exc_info=True)
        return Result.Err("WORKFLOW_LIST_FAILED", f"Failed to list linked outputs: {exc.__class__.__name__}")

    def _row_to_candidate(row: tuple[Any, ...]) -> dict[str, Any] | None:
        filepath = str(row[0] or "").strip()
        if not filepath or filepath in seen:
            return None
        candidate = Path(filepath)
        try:
            if not candidate.is_file() or not _is_supported_linked_preview(candidate):
                return None
        except Exception:
            return None
        seen.add(filepath)
        return {
            "filepath": filepath,
            "filename": str(row[1] or candidate.name),
            "subfolder": str(row[2] or ""),
            "mtime": int(row[3] or 0),
            "size": int(row[4] or 0),
            "kind": str(row[5] or "").strip(),
            "workflow_id": str(row[6] or "").strip(),
            "workflow_hash": str(row[7] or "").strip(),
            "thumbnail_url": _download_preview_url(filepath),
        }

    for row in rows:
        candidate = _row_to_candidate(row)
        if candidate is None:
            continue
        candidates.append(candidate)
        if len(candidates) >= max(1, int(limit or 12)):
            break
    return Result.Ok(candidates)


def _resolve_workflow_thumbnail_source(workflow_path: Path, source_filepath: Any) -> Result[Path]:
    source_raw = str(source_filepath or "").strip()
    if not source_raw:
        return Result.Err("INVALID_INPUT", "Missing thumbnail source filepath")
    try:
        source = Path(source_raw).resolve(strict=True)
    except FileNotFoundError:
        return Result.Err("NOT_FOUND", "Thumbnail source not found")
    source_ext = source.suffix.lower()
    if source_ext not in STATIC_THUMBNAIL_SOURCE_EXTS and source_ext not in VIDEO_THUMBNAIL_SOURCE_EXTS:
        return Result.Err("FORBIDDEN", "Thumbnail source path is not allowed")
    candidates = list_workflow_thumbnail_candidates(workflow_path, limit=100)
    if not candidates.ok:
        return Result.Err(candidates.code or "FORBIDDEN", candidates.error or "Thumbnail source path is not allowed")
    if not _is_authorized_workflow_thumbnail_source(source, candidates.data or []):
        return Result.Err("FORBIDDEN", "Thumbnail source must be a linked output or an output asset")
    return Result.Ok(source)


def _is_authorized_workflow_thumbnail_source(source: Path, candidates: list[dict[str, Any]]) -> bool:
    allowed_sources = {
        str(Path(str(item.get("filepath") or "")).resolve(strict=False))
        for item in candidates
        if str(item.get("filepath") or "").strip()
    }
    return str(source) in allowed_sources or _is_allowed_thumbnail_source(source)


def _prepare_workflow_thumbnail_file(workflow_path: Path, source: Path) -> Result[tuple[Path, bool]]:
    is_video_source = source.suffix.lower() in VIDEO_THUMBNAIL_SOURCE_EXTS
    target = workflow_path.with_suffix(".webp" if is_video_source else source.suffix.lower())
    try:
        if is_video_source:
            converted = _convert_video_to_workflow_thumbnail(source, target)
            if not converted.ok:
                return Result.Err(
                    converted.code or "WORKFLOW_WRITE_FAILED",
                    converted.error or "Failed to convert video thumbnail",
                )
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(str(source), str(target))
        _clear_stale_workflow_thumbnails(workflow_path, target.suffix.lower())
    except Exception as exc:
        return Result.Err("WORKFLOW_WRITE_FAILED", f"Failed to prepare thumbnail: {exc.__class__.__name__}")
    return Result.Ok((target, is_video_source))


def _workflow_thumbnail_response(workflow_path: Path, source: Path, target: Path, *, converted: bool) -> dict[str, Any]:
    card = _workflow_to_card(workflow_path, managed_workflow_root(create=False) or workflow_path.parent)
    animated = target.suffix.lower() in set(ANIMATED_EXTS)
    return {
        "updated": True,
        "filepath": str(workflow_path),
        "thumbnail_path": str(target),
        "thumbnail_url": _thumbnail_url(str(target)),
        "animated_thumbnail_path": str(target) if animated else "",
        "animated_thumbnail_url": _thumbnail_url(str(target)) if animated else "",
        "source_filepath": str(source),
        "converted": converted,
        "max_video_seconds": WORKFLOW_VIDEO_THUMBNAIL_SECONDS if converted else 0,
        "workflow": card,
    }


def set_workflow_thumbnail(path: Path, *, source_filepath: Any = "") -> Result[dict[str, Any]]:
    if not is_managed_workflow_json_path(path):
        return Result.Err("FORBIDDEN", "Workflow path is not allowed")

    try:
        workflow_path = path.resolve(strict=True)
    except FileNotFoundError:
        return Result.Err("NOT_FOUND", "Workflow not found")
    source_res = _resolve_workflow_thumbnail_source(workflow_path, source_filepath)
    if not source_res.ok or not isinstance(source_res.data, Path):
        return Result.Err(source_res.code or "FORBIDDEN", source_res.error or "Thumbnail source path is not allowed")
    prepared = _prepare_workflow_thumbnail_file(workflow_path, source_res.data)
    if not prepared.ok or not isinstance(prepared.data, tuple):
        return Result.Err(prepared.code or "WORKFLOW_WRITE_FAILED", prepared.error or "Failed to prepare thumbnail")
    target, converted = prepared.data
    return Result.Ok(_workflow_thumbnail_response(workflow_path, source_res.data, target, converted=converted))


def _workflow_hash(path: Path) -> str:
    try:
        h = hashlib.sha256()
        with path.open("rb") as handle:
            for chunk in iter(lambda: handle.read(1024 * 1024), b""):
                h.update(chunk)
        return h.hexdigest()
    except Exception:
        return hashlib.sha256(str(path).encode("utf-8", errors="ignore")).hexdigest()


def _workflow_detection_fields(workflow: dict[str, Any], path: Path, parsed: Any, library_meta: dict[str, Any]) -> dict[str, Any]:
    text = workflow_node_text(parsed.nodes)
    classified = classify_workflow(
        text,
        parsed.nodes,
        metadata=workflow if isinstance(workflow, dict) else {},
        file_hint=f"{path.name} {path.parent.name}",
    )
    detected = {
        "detected_task": classified.task,
        "detected_model_family": classified.model_family,
        "detected_provider": classified.provider,
        "detected_runs_on": classified.runs_on,
    }
    return {
        **detected,
        "task": str(library_meta.get("user_task") or "").strip() or detected["detected_task"],
        "model_family": str(library_meta.get("user_model_family") or "").strip() or detected["detected_model_family"],
        "provider": str(library_meta.get("user_provider") or "").strip() or detected["detected_provider"],
        "runs_on": str(library_meta.get("user_runs_on") or "").strip().lower() or detected["detected_runs_on"],
        "user_task": str(library_meta.get("user_task") or ""),
        "user_model_family": str(library_meta.get("user_model_family") or ""),
        "user_provider": str(library_meta.get("user_provider") or ""),
        "user_runs_on": str(library_meta.get("user_runs_on") or ""),
        "notes": str(library_meta.get("notes") or ""),
        "detection_confidence": classified.confidence,
        "detection_source": classified.source,
        "detection_signals": classified.signals or {},
    }


def _workflow_subfolder(path: Path, root: Path) -> str:
    try:
        subfolder = str(path.parent.relative_to(root)).replace("\\", "/")
        return "" if subfolder == "." else subfolder
    except Exception:
        return ""


def _workflow_to_card(path: Path, root: Path, *, use_library_meta: bool = True) -> dict[str, Any] | None:
    workflow = _safe_read_workflow_json(path)
    if workflow is None:
        return None
    try:
        stat = path.stat()
    except Exception:
        return None
    parsed = parse_workflow(workflow)
    wf_hash = _workflow_hash(path)
    subfolder = _workflow_subfolder(path, root)
    display_name = str(workflow.get("name") or workflow.get("title") or path.stem).strip()
    description = str(workflow.get("description") or "").strip()
    thumbnail_path = _find_thumbnail(path)
    animated_thumbnail_path = _find_thumbnail(path, animated=True)
    missing_nodes = _as_str_list(workflow.get("missing_nodes"))
    missing_models = _as_str_list(workflow.get("missing_models"))
    library_meta = _read_workflow_library_meta(path) if use_library_meta else {}
    usage_count = _to_int(library_meta.get("usage_count"), _to_int(workflow.get("usage_count"), 0))
    last_loaded_at = _to_int(library_meta.get("last_loaded_at"), _to_int(workflow.get("last_loaded_at"), 0))
    tags = _as_str_list(library_meta.get("tags")) or _workflow_tags(workflow)
    favorite = _to_bool(library_meta.get("favorite"), _to_bool(workflow.get("favorite"), False))
    detection = _workflow_detection_fields(workflow, path, parsed, library_meta)
    return {
        "id": f"workflow:{wf_hash[:16]}",
        "asset_id": f"workflow:{wf_hash[:16]}",
        "kind": "workflow",
        "source": "workflow",
        "type": "workflow",
        "filename": path.name,
        "display_name": display_name,
        "description": description,
        "filepath": str(path),
        "subfolder": subfolder,
        "root_path": str(root),
        "ext": "JSON",
        "size": int(stat.st_size or 0),
        "mtime": int(stat.st_mtime or 0),
        "workflow_hash": wf_hash,
        "workflow_id": str(workflow.get("id") or wf_hash[:16]),
        "task": detection["task"],
        "workflow_task": detection["task"],
        "model_family": detection["model_family"],
        "provider": detection["provider"],
        "runs_on": detection["runs_on"],
        **detection,
        "node_count": parsed.node_count + parsed.subgraph_node_count,
        "link_count": parsed.link_count,
        "subgraph_count": parsed.subgraph_count,
        "missing_nodes": missing_nodes,
        "missing_models": missing_models,
        "missing_nodes_count": len(missing_nodes),
        "missing_models_count": len(missing_models),
        "favorite": favorite,
        "usage_count": max(0, usage_count),
        "last_loaded_at": max(0, last_loaded_at),
        "thumbnail_path": thumbnail_path,
        "animated_thumbnail_path": animated_thumbnail_path,
        "thumbnail_url": _thumbnail_url(thumbnail_path),
        "animated_thumbnail_url": _thumbnail_url(animated_thumbnail_path),
        "graph_map_thumbnail_url": _workflow_graph_map_thumbnail_url(str(path)) if not thumbnail_path and not animated_thumbnail_path else "",
        "tags": tags,
    }


def _matches_query(card: dict[str, Any], query: str) -> bool:
    q = str(query or "*").strip().lower()
    if not q or q == "*":
        return True
    haystack = " ".join(
        str(card.get(key) or "")
        for key in (
            "filename",
            "display_name",
            "description",
            "task",
            "model_family",
            "provider",
            "runs_on",
            "subfolder",
        )
    ).lower()
    return all(token in haystack for token in q.split())


def _workflow_display_name(card: dict[str, Any]) -> str:
    return str(card.get("display_name") or card.get("filename") or "").lower()


def _workflow_sort_strategies() -> dict[str, Any]:
    return {
        "workflow_default": lambda c: (
            0 if bool(c.get("favorite")) else 1,
            -int(c.get("last_loaded_at") or 0),
            -int(c.get("usage_count") or 0),
            -int(c.get("mtime") or 0),
            _workflow_display_name(c),
        ),
        "default": lambda c: (
            0 if bool(c.get("favorite")) else 1,
            -int(c.get("last_loaded_at") or 0),
            -int(c.get("usage_count") or 0),
            -int(c.get("mtime") or 0),
            _workflow_display_name(c),
        ),
        "name": lambda c: _workflow_display_name(c),
        "filename": lambda c: _workflow_display_name(c),
        "task": lambda c: (str(c.get("task") or "").lower(), _workflow_display_name(c)),
        "workflow_task": lambda c: (str(c.get("task") or "").lower(), _workflow_display_name(c)),
        "model": lambda c: (str(c.get("model_family") or "").lower(), _workflow_display_name(c)),
        "model_family": lambda c: (str(c.get("model_family") or "").lower(), _workflow_display_name(c)),
        "usage": lambda c: (-int(c.get("usage_count") or 0), -int(c.get("mtime") or 0), _workflow_display_name(c)),
        "usage_count": lambda c: (-int(c.get("usage_count") or 0), -int(c.get("mtime") or 0), _workflow_display_name(c)),
        "last_loaded": lambda c: (
            -int(c.get("last_loaded_at") or 0),
            -int(c.get("usage_count") or 0),
            -int(c.get("mtime") or 0),
            _workflow_display_name(c),
        ),
        "last_loaded_at": lambda c: (
            -int(c.get("last_loaded_at") or 0),
            -int(c.get("usage_count") or 0),
            -int(c.get("mtime") or 0),
            _workflow_display_name(c),
        ),
    }


def _sort_cards(cards: list[dict[str, Any]], sort_key: str) -> list[dict[str, Any]]:
    key = str(sort_key or "mtime_desc").lower()
    sorters = _workflow_sort_strategies()
    if key in sorters:
        return sorted(cards, key=sorters[key])
    return sorted(cards, key=lambda c: int(c.get("mtime") or 0), reverse=True)


def _workflow_root_for_path(path: Path, roots: list[Path]) -> Path:
    try:
        resolved = path.resolve(strict=False)
        for root in roots:
            root_resolved = root.resolve(strict=False)
            if resolved == root_resolved or root_resolved in resolved.parents:
                return root_resolved
    except Exception:
        pass
    return path.parent


def _workflow_db_existing_by_path(conn: sqlite3.Connection) -> dict[str, tuple[int, int]]:
    try:
        rows = conn.execute("SELECT filepath, COALESCE(mtime, 0), COALESCE(size, 0) FROM workflows").fetchall()
    except Exception:
        return {}
    return {
        str(row[0] or ""): (_to_int(row[1], 0), _to_int(row[2], 0))
        for row in rows
        if str(row[0] or "").strip()
    }


def _workflow_row_needs_legacy_hydration(conn: sqlite3.Connection, filepath: str) -> bool:
    try:
        row = conn.execute(
            """
            SELECT favorite, usage_count, last_loaded_at, tags_json
            FROM workflows WHERE filepath = ?
            """,
            (filepath,),
        ).fetchone()
        if not row:
            return False
        row_empty = (
            not bool(row[0])
            and _to_int(row[1], 0) <= 0
            and _to_int(row[2], 0) <= 0
            and not _json_list(row[3])
        )
        if row_empty:
            return True
        workflow = _safe_read_workflow_json(Path(filepath))
        if not isinstance(workflow, dict):
            return False
        file_favorite = _to_bool(workflow.get("favorite"), False)
        file_usage = _to_int(workflow.get("usage_count"), 0)
        file_last_loaded = _to_int(workflow.get("last_loaded_at"), 0)
        file_tags = _workflow_tags(workflow)
        return (
            (file_favorite and not bool(row[0]))
            or (file_usage > _to_int(row[1], 0))
            or (file_last_loaded > _to_int(row[2], 0))
            or (bool(file_tags) and not set(file_tags).issubset(set(_json_list(row[3]))))
        )
    except Exception:
        return False


def _refresh_workflow_index_path(
    conn: sqlite3.Connection,
    path: Path,
    root: Path,
    existing: dict[str, tuple[int, int]],
    *,
    force_full_refresh: bool,
) -> tuple[str | None, bool]:
    try:
        resolved = path.resolve(strict=True)
        stat = resolved.stat()
    except Exception:
        return None, False
    filepath = str(resolved)
    current_sig = (int(stat.st_mtime or 0), int(stat.st_size or 0))
    needs_legacy_hydration = _workflow_row_needs_legacy_hydration(conn, filepath)
    if not force_full_refresh and existing.get(filepath) == current_sig and not needs_legacy_hydration:
        return filepath, False
    card = _workflow_to_card(
        resolved,
        root,
        use_library_meta=not (force_full_refresh or needs_legacy_hydration),
    )
    if card is None:
        return filepath, False
    updates = None
    if force_full_refresh or needs_legacy_hydration:
        updates = {
            "favorite": bool(card.get("favorite")),
            "usage_count": max(0, _to_int(card.get("usage_count"), 0)),
            "last_loaded_at": max(0, _to_int(card.get("last_loaded_at"), 0)),
            "tags": _as_str_list(card.get("tags")),
        }
    write = _upsert_workflow_library_card(card, updates=updates)
    return filepath, bool(write.ok)


def _scan_workflow_index_roots(
    conn: sqlite3.Connection,
    scan_roots: list[Path],
    existing: dict[str, tuple[int, int]],
    *,
    force_full_refresh: bool,
) -> tuple[set[str], int, int]:
    seen: set[str] = set()
    indexed = 0
    updated = 0
    for root in scan_roots:
        try:
            paths = root.rglob("*.json")
        except Exception:
            continue
        for path in paths:
            if indexed >= MAX_WORKFLOW_FILES:
                break
            filepath, did_update = _refresh_workflow_index_path(
                conn,
                path,
                root,
                existing,
                force_full_refresh=force_full_refresh,
            )
            if filepath:
                seen.add(filepath)
                indexed += 1
            if did_update:
                updated += 1
        if indexed >= MAX_WORKFLOW_FILES:
            break
    return seen, indexed, updated


def _workflow_path_in_roots(path: Path, root_strings: list[str]) -> bool:
    candidate = str(path.resolve(strict=False)).lower()
    return any(candidate == root or candidate.startswith(root.rstrip("\\/") + os.sep.lower()) for root in root_strings)


def _remove_stale_workflow_index_rows(
    conn: sqlite3.Connection,
    existing: dict[str, tuple[int, int]],
    seen: set[str],
    scan_roots: list[Path],
) -> int:
    removed = 0
    root_strings = [str(root.resolve(strict=False)).lower() for root in scan_roots]
    for filepath in list(existing):
        try:
            if _workflow_path_in_roots(Path(filepath), root_strings) and filepath not in seen:
                conn.execute("DELETE FROM workflows WHERE filepath = ?", (filepath,))
                removed += 1
        except Exception:
            continue
    return removed


def refresh_workflow_library_index(*, roots: list[Path] | None = None) -> Result[dict[str, Any]]:
    """Synchronize the workflow DB with files, reparsing only changed JSON."""
    scan_roots = roots if roots is not None else workflow_roots()
    if not scan_roots:
        return Result.Ok({"indexed": 0, "updated": 0, "removed": 0, "roots": []})
    try:
        db_path = _workflow_library_db_path()
        db_path.parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(str(db_path)) as conn:
            _ensure_workflow_library_schema(conn)
            force_full_refresh = _workflow_index_needs_full_refresh(conn)
            existing = _workflow_db_existing_by_path(conn)
            seen, indexed, updated = _scan_workflow_index_roots(
                conn,
                scan_roots,
                existing,
                force_full_refresh=force_full_refresh,
            )
            removed = _remove_stale_workflow_index_rows(conn, existing, seen, scan_roots)
            _mark_workflow_index_version(conn)
        return Result.Ok({"indexed": indexed, "updated": updated, "removed": removed, "roots": [str(root) for root in scan_roots]})
    except Exception as exc:
        logger.debug("Workflow library index refresh failed", exc_info=True)
        return Result.Err("WORKFLOW_INDEX_FAILED", f"Failed to refresh workflow index: {exc.__class__.__name__}")


def _json_list(value: Any) -> list[str]:
    try:
        parsed = json.loads(str(value or "[]"))
    except Exception:
        parsed = []
    return _as_str_list(parsed)


def _json_dict(value: Any) -> dict[str, Any]:
    try:
        parsed = json.loads(str(value or "{}"))
        return parsed if isinstance(parsed, dict) else {}
    except Exception:
        return {}


def _workflow_card_detection_fields(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "task": str(row["task"] or ""),
        "workflow_task": str(row["task"] or ""),
        "model_family": str(row["model_family"] or ""),
        "provider": str(row["provider"] or ""),
        "runs_on": str(row["runs_on"] or ""),
        "detected_task": str(row["detected_task"] or ""),
        "detected_model_family": str(row["detected_model_family"] or ""),
        "detected_provider": str(row["detected_provider"] or ""),
        "detected_runs_on": str(row["detected_runs_on"] or ""),
        "user_task": str(row["user_task"] or ""),
        "user_model_family": str(row["user_model_family"] or ""),
        "user_provider": str(row["user_provider"] or ""),
        "user_runs_on": str(row["user_runs_on"] or ""),
        "notes": str(row["notes"] or ""),
        "detection_confidence": float(row["detection_confidence"] or 0),
        "detection_source": str(row["detection_source"] or ""),
        "detection_signals": _json_dict(row["detection_signals_json"]),
    }


def _workflow_card_media_fields(filepath: str, thumbnail_path: str, animated_thumbnail_path: str) -> dict[str, Any]:
    return {
        "thumbnail_path": thumbnail_path,
        "animated_thumbnail_path": animated_thumbnail_path,
        "thumbnail_url": _thumbnail_url(thumbnail_path),
        "animated_thumbnail_url": _thumbnail_url(animated_thumbnail_path),
        "graph_map_thumbnail_url": _workflow_graph_map_thumbnail_url(filepath) if not thumbnail_path and not animated_thumbnail_path else "",
    }


def _workflow_card_validation_fields(row: sqlite3.Row) -> dict[str, Any]:
    missing_nodes = _json_list(row["missing_nodes_json"])
    missing_models = _json_list(row["missing_models_json"])
    return {
        "node_count": _to_int(row["node_count"], 0),
        "link_count": _to_int(row["link_count"], 0),
        "subgraph_count": _to_int(row["subgraph_count"], 0),
        "missing_nodes": missing_nodes,
        "missing_models": missing_models,
        "missing_nodes_count": len(missing_nodes),
        "missing_models_count": len(missing_models),
    }


def _workflow_card_from_db_row(row: sqlite3.Row, roots: list[Path]) -> dict[str, Any]:
    filepath = str(row["filepath"] or "")
    path = Path(filepath)
    root = _workflow_root_for_path(path, roots)
    thumbnail_path = str(row["thumbnail_path"] or "")
    animated_thumbnail_path = str(row["animated_thumbnail_path"] or "")
    workflow_hash = str(row["workflow_hash"] or "")
    workflow_id = str(row["workflow_id"] or workflow_hash[:16])
    card = {
        "id": f"workflow:{workflow_hash[:16]}",
        "asset_id": f"workflow:{workflow_hash[:16]}",
        "kind": "workflow",
        "source": "workflow",
        "type": "workflow",
        "filename": path.name,
        "display_name": str(row["name"] or path.stem),
        "description": str(row["description"] or ""),
        "filepath": filepath,
        "subfolder": str(row["category"] or _workflow_subfolder(path, root)),
        "root_path": str(root),
        "ext": "JSON",
        "size": _to_int(row["size"], 0),
        "mtime": _to_int(row["mtime"], 0),
        "workflow_hash": workflow_hash,
        "workflow_id": workflow_id,
        "favorite": bool(row["favorite"]),
        "usage_count": max(0, _to_int(row["usage_count"], 0)),
        "last_loaded_at": max(0, _to_int(row["last_loaded_at"], 0)),
        "tags": _json_list(row["tags_json"]),
    }
    card.update(_workflow_card_detection_fields(row))
    card.update(_workflow_card_validation_fields(row))
    card.update(_workflow_card_media_fields(filepath, thumbnail_path, animated_thumbnail_path))
    return card


def _list_workflow_cards_from_index(roots: list[Path]) -> Result[list[dict[str, Any]]]:
    try:
        db_path = _workflow_library_db_path()
        if not db_path.exists():
            return Result.Ok([])
        with sqlite3.connect(str(db_path)) as conn:
            conn.row_factory = sqlite3.Row
            _ensure_workflow_library_schema(conn)
            rows = conn.execute("SELECT * FROM workflows WHERE source = 'workflow'").fetchall()
        root_resolved = [root.resolve(strict=False) for root in roots]
        cards = []
        for row in rows:
            try:
                path = Path(str(row["filepath"] or "")).resolve(strict=False)
                if root_resolved and not any(path == root or path.is_relative_to(root) for root in root_resolved):
                    continue
            except Exception:
                continue
            cards.append(_workflow_card_from_db_row(row, root_resolved))
        return Result.Ok(cards)
    except Exception as exc:
        logger.debug("Workflow library index read failed", exc_info=True)
        return Result.Err("WORKFLOW_LIST_FAILED", f"Failed to read workflow index: {exc.__class__.__name__}")


def _list_workflows_from_filesystem(
    *,
    roots: list[Path],
    query: str,
    limit: int,
    offset: int,
    sort: str,
    subfolder: str,
) -> Result[dict[str, Any]]:
    cards: list[dict[str, Any]] = []
    safe_subfolder = str(subfolder or "").strip().replace("\\", "/")
    try:
        for root in roots:
            for path in root.rglob("*.json"):
                if len(cards) >= MAX_WORKFLOW_FILES:
                    break
                try:
                    rel = str(path.parent.relative_to(root)).replace("\\", "/")
                    if rel == ".":
                        rel = ""
                    if safe_subfolder and rel != safe_subfolder:
                        continue
                except Exception:
                    pass
                card = _workflow_to_card(path, root)
                if card and _matches_query(card, query):
                    cards.append(card)
            if len(cards) >= MAX_WORKFLOW_FILES:
                break
    except Exception as exc:
        logger.debug("Workflow listing failed", exc_info=True)
        return Result.Err("WORKFLOW_LIST_FAILED", f"Failed to list workflows: {exc.__class__.__name__}")

    _apply_linked_preview_fallback(cards)
    sorted_cards = _sort_cards(cards, sort)
    safe_offset = max(0, int(offset or 0))
    safe_limit = max(1, int(limit or 200))
    page = sorted_cards[safe_offset : safe_offset + safe_limit]
    return Result.Ok(
        {
            "assets": page,
            "count": len(page),
            "total": len(sorted_cards),
            "limit": safe_limit,
            "offset": safe_offset,
            "scope": "workflow",
            "mode": "workflow",
            "roots": [str(root) for root in roots],
            "sort": sort,
        }
    )


def list_workflows(
    *,
    query: str = "*",
    limit: int = 200,
    offset: int = 0,
    sort: str = "mtime_desc",
    subfolder: str = "",
) -> Result[dict[str, Any]]:
    roots = workflow_roots()
    refresh = refresh_workflow_library_index(roots=roots)
    if not refresh.ok:
        return _list_workflows_from_filesystem(
            roots=roots,
            query=query,
            limit=limit,
            offset=offset,
            sort=sort,
            subfolder=subfolder,
        )

    indexed_cards = _list_workflow_cards_from_index(roots)
    if not indexed_cards.ok:
        return _list_workflows_from_filesystem(
            roots=roots,
            query=query,
            limit=limit,
            offset=offset,
            sort=sort,
            subfolder=subfolder,
        )

    safe_subfolder = str(subfolder or "").strip().replace("\\", "/")
    cards = [
        card
        for card in (indexed_cards.data or [])
        if (not safe_subfolder or str(card.get("subfolder") or "").replace("\\", "/") == safe_subfolder)
        and _matches_query(card, query)
    ][:MAX_WORKFLOW_FILES]

    _apply_linked_preview_fallback(cards)

    sorted_cards = _sort_cards(cards, sort)
    safe_offset = max(0, int(offset or 0))
    safe_limit = max(1, int(limit or 200))
    page = sorted_cards[safe_offset : safe_offset + safe_limit]
    return Result.Ok(
        {
            "assets": page,
            "count": len(page),
            "total": len(sorted_cards),
            "limit": safe_limit,
            "offset": safe_offset,
            "scope": "workflow",
            "mode": "workflow",
            "roots": [str(root) for root in roots],
            "sort": sort,
        }
    )


def list_workflow_model_families() -> Result[dict[str, Any]]:
    result = list_workflows(query="*", limit=MAX_WORKFLOW_FILES)
    if not result.ok:
        return Result.Err(result.code or "WORKFLOW_LIST_FAILED", result.error or "Failed to list workflows")

    counts: dict[str, int] = {}
    for card in (result.data or {}).get("assets", []):
        value = str(card.get("model_family") or "").strip()
        if not value:
            continue
        counts[value] = counts.get(value, 0) + 1

    families = [
        {"label": name, "value": name, "count": count}
        for name, count in sorted(counts.items(), key=lambda item: (-item[1], item[0].lower()))
    ]
    return Result.Ok({"model_families": families, "count": len(families)})
