"""Documentation and route-index endpoints extracted from ``assets_impl``."""

from __future__ import annotations

import html as _html_mod
import re
from pathlib import Path

from aiohttp import web
from mjr_am_backend.shared import Result
from mjr_am_backend.shared import sanitize_error_message as _safe_error_message

from ..core import _json_response

USER_GUIDE_FILE_NAME = "user_guide.html"
_DOC_FILENAME_RE = re.compile(r"^[A-Za-z0-9_\-]+\.md$")

_DOCS_HTML_TEMPLATE = """\
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title} - Majoor Assets Manager Docs</title>
<style>
:root {{
    --bg: #1e1e1e; --bg2: #2a2a2a; --fg: #ddd;
    --fg2: rgba(255,255,255,0.65); --accent: #5fb3ff;
    --border: rgba(255,255,255,0.12); --code-bg: #333;
    --font: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
}}
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
body {{ font-family: var(--font); background: var(--bg); color: var(--fg);
       line-height: 1.6; font-size: 14px; padding: 0; }}
.header {{ background: var(--bg2); padding: 16px 24px; border-bottom: 1px solid var(--border);
           display: flex; align-items: center; gap: 16px; }}
.header a {{ color: var(--accent); text-decoration: none; font-size: 13px; }}
.header a:hover {{ text-decoration: underline; }}
.header h1 {{ font-size: 16px; font-weight: 600; }}
.content {{ max-width: 960px; margin: 0 auto; padding: 24px 32px; }}
.content pre {{ background: var(--code-bg); padding: 16px; border-radius: 8px;
               overflow-x: auto; font-family: Consolas, Monaco, monospace;
               font-size: 13px; line-height: 1.5; white-space: pre-wrap;
               word-wrap: break-word; color: var(--fg2); }}
</style>
</head>
<body>
<div class="header">
    <a href="/mjr/am/user-guide">&larr; Back to User Guide</a>
    <h1>{title}</h1>
</div>
<div class="content"><pre>{content}</pre></div>
</body>
</html>
"""

_ROUTES_INFO = (
    {"method": "GET", "path": "/mjr/am/health", "description": "Get health status"},
    {"method": "GET", "path": "/mjr/am/health/counters", "description": "Get database counters"},
    {"method": "GET", "path": "/mjr/am/health/db", "description": "Get DB lock/corruption/recovery diagnostics"},
    {"method": "GET", "path": "/mjr/am/config", "description": "Get configuration"},
    {"method": "GET", "path": "/mjr/am/roots", "description": "Get core and custom roots"},
    {"method": "GET", "path": "/mjr/am/custom-roots", "description": "List custom roots"},
    {"method": "POST", "path": "/mjr/am/custom-roots", "description": "Add custom root"},
    {"method": "POST", "path": "/mjr/am/custom-roots/remove", "description": "Remove custom root"},
    {"method": "GET", "path": "/mjr/am/custom-view", "description": "Serve file from custom root"},
    {"method": "GET", "path": "/mjr/am/list", "description": "List assets (scoped)"},
    {"method": "POST", "path": "/mjr/am/scan", "description": "Scan a directory for assets"},
    {"method": "POST", "path": "/mjr/am/index-files", "description": "Index specific files"},
    {"method": "GET", "path": "/mjr/am/search", "description": "Search assets using FTS5"},
    {"method": "POST", "path": "/mjr/am/assets/batch", "description": "Batch fetch assets by ID"},
    {"method": "GET", "path": "/mjr/am/metadata", "description": "Get metadata for a file"},
    {"method": "POST", "path": "/mjr/am/stage-to-input", "description": "Copy files to input directory"},
    {"method": "GET", "path": "/mjr/am/asset/{asset_id}", "description": "Get single asset by ID"},
    {"method": "POST", "path": "/mjr/am/asset/rating", "description": "Update asset rating (0-5 stars)"},
    {"method": "POST", "path": "/mjr/am/asset/tags", "description": "Update asset tags"},
    {"method": "POST", "path": "/mjr/am/assets/tags", "description": "Bulk add/remove tags across assets"},
    {"method": "POST", "path": "/mjr/am/asset/rename", "description": "Rename a single asset file"},
    {"method": "POST", "path": "/mjr/am/assets/rename", "description": "Alias: rename a single asset file"},
    {"method": "POST", "path": "/mjr/am/open-in-folder", "description": "Open asset in OS file manager"},
    {"method": "GET", "path": "/mjr/am/tags", "description": "Get all unique tags for autocomplete"},
    {"method": "GET", "path": "/mjr/am/user-guide", "description": "Open local Assets Manager user guide"},
    {"method": "GET", "path": "/mjr/am/docs/{filename}", "description": "Serve a markdown documentation file"},
    {"method": "POST", "path": "/mjr/am/retry-services", "description": "Retry service initialization"},
    {"method": "GET", "path": "/mjr/am/routes", "description": "List all available routes (this endpoint)"},
)


def _resolve_local_user_guide_path() -> Path:
    try:
        return (Path(__file__).resolve().parents[3] / USER_GUIDE_FILE_NAME).resolve(strict=False)
    except Exception:
        return Path(USER_GUIDE_FILE_NAME)


def _resolve_docs_dir() -> Path:
    try:
        return (Path(__file__).resolve().parents[3] / "docs").resolve(strict=False)
    except Exception:
        return Path("docs")


def register_asset_docs_routes(routes: web.RouteTableDef) -> None:
    @routes.get("/mjr/am/user-guide")
    async def open_local_user_guide(_request: web.Request) -> web.StreamResponse:
        guide_path = _resolve_local_user_guide_path()
        try:
            if not guide_path.is_file():
                return web.Response(status=404, text="User guide not found")
            return web.FileResponse(path=str(guide_path))
        except Exception as exc:
            return _json_response(
                Result.Err("FS_ERROR", _safe_error_message(exc, "Failed to open user guide"))
            )

    @routes.get("/mjr/am/docs/{filename}")
    async def serve_doc_file(request: web.Request) -> web.StreamResponse:
        filename = request.match_info.get("filename", "")
        if not _DOC_FILENAME_RE.match(filename):
            return web.Response(status=400, text="Invalid document filename")
        docs_dir = _resolve_docs_dir()
        doc_path = (docs_dir / filename).resolve()
        if not str(doc_path).startswith(str(docs_dir.resolve())):
            return web.Response(status=403, text="Access denied")
        if not doc_path.is_file():
            return web.Response(status=404, text="Document not found")
        try:
            content = doc_path.read_text(encoding="utf-8")
            title = filename.replace("_", " ").replace(".md", "")
            html_page = _DOCS_HTML_TEMPLATE.format(
                title=_html_mod.escape(title),
                content=_html_mod.escape(content),
            )
            return web.Response(text=html_page, content_type="text/html")
        except Exception as exc:
            return _json_response(
                Result.Err("FS_ERROR", _safe_error_message(exc, "Failed to read document"))
            )

    @routes.get("/mjr/am/routes")
    async def list_routes(_request: web.Request) -> web.StreamResponse:
        return _json_response(Result.Ok({"routes": list(_ROUTES_INFO)}))


__all__ = ["register_asset_docs_routes"]
