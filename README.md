# 📂 Majoor Assets Manager for ComfyUI

Advanced asset browser for ComfyUI outputs (images/videos) with **ratings & tags**, **full-text search**, **workflow fingerprinting**, and advanced metadata management.

## 💡 Why This Exists

I work daily in ComfyUI in real production contexts (VFX / generative pipelines), and asset management quickly became a problem.

I've tested several asset managers over time. Some are external tools. Some are partially integrated. Most of them are either too rigid, too opinionated, or disconnected from how ComfyUI is actually used in production.

Sometimes you need custom nodes. Sometimes external logic makes sense. But jumping outside ComfyUI just to understand what you generated breaks the flow.

**So I built an Assets Manager that lives directly inside ComfyUI.**

> ⚠️ **Work in Progress**: This extension is still under active development. Many things will move and change. Recommendations and feedback are welcomed!

![Majoor Assets Manager Demo](examples/ComfyUI_Majoor_AssetsManager_Video.gif)

---

## 🚀 Key Features

### 🔍 **Search & Discovery**
- **Full-text search** powered by SQLite FTS5 with BM25 ranking
- **Workflow fingerprinting**: find all assets generated with the same workflow (upcoming)
- **Smart filters**: Today, Yesterday, Last 7 Days, 5 Stars, 4+ Stars, Videos, Images
- **Advanced filtering**: by rating, tags (AND/OR logic), file type, workflow presence
- **Collections system**: save and organize filtered asset groups in `_mjr_collections`

### ⭐ **Ratings & Tags**
- Set ratings `0–5` on individual or bulk-selected assets
- Add custom tags with instant metadata updates
- Metadata stored in OS-native formats (Windows Property System, XMP) with optional `.mjr.json` sidecars
- Visual badges on cards and in viewer
- Bulk operations bar for multi-file rating/tagging

### ⚡ **Performance**
- **Virtualized grid** with lazy loading (handles thousands of assets)
- Paginated file listing (configurable page size, default 500)
- **Incremental indexing**: only re-scans changed files based on mtime
- LRU cache for thumbnails (200 items)
- Debounced search (300ms) and optimistic UI updates
- Optional auto-refresh with focus-aware polling

### 🧠 **Metadata Intelligence**
- **Prompt/workflow inspector**: extracts generation parameters from PNG, video, and EXIF UserComment
- **Workflow tracer v2**: recursive node graph reconstruction for ComfyUI workflows
- **Lossless PNG metadata injection**: preserves workflow JSON when writing ratings/tags
- Native EXIF parser with multi-encoding support (UTF-8, UTF-16, Latin-1)
- **Hybrid metadata mode**: tries advanced parsers first, falls back to legacy methods
- Reads model, sampler, steps, CFG, seed, LoRA, and custom node parameters

### 🖼️ **Viewer & A/B Compare**
- **Single viewer**: full-screen zoom/pan, video playback, rating HUD
- **A/B compare mode**: side-by-side comparison with synchronized controls
- **Frame-by-frame navigation** for videos (±1/30s step)
- Keyboard-driven navigation (`ArrowUp`/`Down` for prev/next, `0-5` for rating)
- Optional checkerboard background for transparency
- Autoplay, loop, and mute controls

### ⌨️ **Keyboard-First Workflow**
- `0`-`5`: set rating for selected files
- `Space`: open viewer (1 selected) or A/B compare (2 selected)
- `Ctrl/Cmd+A`: select all filtered files
- Explorer-like selection: `Ctrl`/`Shift` + Click for toggle/range
- Viewer hotkeys: `Esc`, `ArrowUp`/`Down`, `ArrowLeft`/`Right`, `F` (fit/reset)

### 🎨 **UI & Integration**
- **Flexible panel placement**: sidebar, bottom panel, or both
- Hover tooltips with file metadata (filename, folder, size, date, rating, tags, workflow state)
- Real-time index status indicator (green/yellow/red/gray dot)
- Workflow state badge on cards (green: full data, yellow: partial, red: corrupt, gray: none)
- Drag-and-drop support for files into ComfyUI canvas
- Context menu for quick actions (delete, open in explorer, stage to input)

---

## 📦 Installation

### Method 1: ComfyUI Manager (Recommended)

Install directly from the ComfyUI Manager interface.

### Method 2: Manual

```bash
cd ComfyUI/custom_nodes
git clone <this-repo-url> ComfyUI-Majoor-AssetsManager
pip install -r ComfyUI-Majoor-AssetsManager/requirements.txt
```

Restart ComfyUI.

---

## ✅ Requirements

### Python Dependencies

All Python dependencies are automatically installed via `requirements.txt`:

- `aiohttp` (REST API server)
- `pillow` (thumbnail generation)
- `send2trash` (safe delete to recycle bin)
- `watchdog` (real-time file system monitoring for automatic reindexing)
- `pywin32` (Windows only; enables Windows Property System metadata)

### External Tools (Strongly Recommended)

For full metadata capabilities, install these external tools:

- 🧰 **ExifTool** (video metadata read/write, XMP/IPTC support)
  - Windows: download from [exiftool.org](https://exiftool.org) and add `exiftool.exe` to `PATH`
  - macOS: `brew install exiftool`
  - Linux (Debian/Ubuntu): `sudo apt install libimage-exiftool-perl`
- 🎬 **ffprobe** (improved video metadata extraction; usually bundled with FFmpeg)
  - Windows: download FFmpeg from [ffmpeg.org](https://ffmpeg.org) and add to `PATH`
  - macOS: `brew install ffmpeg`
  - Linux (Debian/Ubuntu): `sudo apt install ffmpeg`

The extension will automatically detect and use these tools if available. Without them, metadata extraction will fall back to Python-only parsers with reduced capabilities.

---

## 🎬 Metadata Storage & Video Reliability

### Metadata Storage Strategies

- **Windows**: OS metadata via Property Store (default) + optional `.mjr.json` sidecars
- **macOS/Linux**: `.mjr.json` sidecar files (default) + ExifTool XMP when available
- **Configurable**: Set `MJR_ENABLE_SIDECAR=1` or `MJR_FORCE_SIDECAR=1` environment variables

### Video Metadata Redundancy

Windows Explorer and media players can be inconsistent with MP4/MOV/MKV/WEBM metadata. The manager uses a **redundant write strategy**:

- ✅ **Always writes**:
  - `XMP:Rating` (0–5 stars, industry standard)
  - `XMP:Subject` (tags list with `; ` separator)

- ✅ **Best-effort writes** (does not fail if unsupported):
  - `Microsoft:SharedUserRating` (0–99 "percent" scale for Windows Explorer)
  - `Microsoft:Category` (tags formatted for Explorer: `tag1; tag2`)

- 🛡️ **Workflow preservation**: Copies original metadata fields (`-tagsFromFile @ ...`) before writing, preserving embedded ComfyUI workflow JSON in comment-like fields

- ⏳ **Retry mechanism**: Handles "file not ready/locked" errors right after generation with exponential backoff (up to 5 retries)

- 📥 **Read priority**: ExifTool values (XMP > Microsoft) → Windows Property System → sidecar fallback

---

## ⌨️ Keyboard Shortcuts

**Note**: Hotkeys are ignored while typing in input fields or textareas.

### Grid View (Asset Browser)

| Key | Action |
|-----|--------|
| `0`–`5` | Set rating for selected files (`0` clears rating) |
| `Space` | Open viewer (1 selected) or A/B compare (2 selected) |
| `Ctrl`/`Cmd` + `A` | Select all filtered files |
| `Click` | Clear selection + select item |
| `Ctrl`/`Cmd` + `Click` | Toggle item selection |
| `Shift` + `Click` | Select range from last anchor |
| `Ctrl`/`Cmd` + `Shift` + `Click` | Add range to selection |

### Viewer Mode

| Key | Action | Requires Setting |
|-----|--------|------------------|
| `Esc` or `Space` | Close viewer | - |
| `ArrowUp` / `ArrowDown` | Previous/next asset | Navigation enabled |
| `0`–`5` (incl. numpad) | Set rating | Rating hotkeys enabled |
| `ArrowLeft` / `ArrowRight` | Step video ±1/30s | Frame-step hotkeys enabled |
| `F` | Fit/reset zoom | - |

---

## ⚙️ Settings (ComfyUI → Settings)

Access settings via the ComfyUI settings panel (gear icon).

### Panel & Display

- 🧩 **Panel Integration** (requires reload): `sidebar`, `bottom`, or `both` (default)
- 📄 **Page Size**: files per request (default: `500`)
- 🎴 **Card Size**: compact, medium, or large grid cards
- 🛈 **Hover Info Tooltips**: show/hide metadata tooltips on card hover
- 🏷️ **Show Tags on Cards**: display tag badges
- ⭐ **Show Ratings on Cards**: display rating badges

### Auto-Refresh

- 🔁 **Enable Auto-refresh**: automatically poll for new assets
- ⏱️ **Refresh Interval**: polling frequency in milliseconds (default: `5000`)
- 🔍 **Focus-Only Mode**: only refresh when ComfyUI window is active

### Viewer Settings

- ▶️ **Autoplay Videos**: start playback automatically
- 🔁 **Loop Videos**: repeat video playback
- 🔇 **Mute Videos**: disable audio by default
- ◀️▶️ **Show Navigation**: display prev/next arrows
- ⭐ **Show Rating HUD**: display rating overlay in viewer
- ⌨️ **Rating Hotkeys**: enable `0`-`5` keys in viewer
- ⌨️ **Frame-Step Hotkeys**: enable `ArrowLeft`/`Right` for video stepping
- 🎨 **Checkerboard Background**: show transparency pattern

---

---

## 🏗️ Architecture

The new codebase follows a clean, modular architecture:

### Backend Structure

- **`backend/`** - Core Python backend
  - **`adapters/`** - External integrations (database, tools)
    - `db/` - SQLite adapter with connection pooling
    - `tools/` - ExifTool and FFProbe wrappers
  - **`features/`** - Business logic modules
    - `index/` - File scanning, searching, and indexing
    - `metadata/` - Metadata extraction and enrichment
    - `geninfo/` - Generation info parsing (A1111, ComfyUI)
    - `tags/` - Rating and tags synchronization
    - `health/` - System health checks
    - `collections/` - Smart filter collections
  - **`routes/`** - HTTP API endpoints
    - `core/` - Path resolution and utilities
    - `handlers/` - Request handlers (filesystem, metadata, search)
  - `config.py` - Configuration and environment variables
  - `deps.py` - Dependency injection container
  - `observability.py` - Logging and performance tracing

### Frontend Structure

- **`js/`** - Modern JavaScript frontend
  - **`api/`** - Backend API client
  - **`app/`** - Application bootstrap and configuration
  - **`components/`** - Reusable UI components (Card, Sidebar, Viewer)
  - **`features/`** - Feature modules (grid, search, filters, viewer)
  - **`state/`** - Global state management
  - **`utils/`** - Helper utilities
  - **`theme/`** - UI theming
  - `entry.js` - Extension entry point

### Shared Modules

- **`shared/`** - Code shared between backend components
  - `log.py` - Structured logging
  - `result.py` - Result type for error handling
  - `types.py` - Common type definitions

---

## 🔧 Configuration

The extension can be configured via environment variables:

### Output Directory
- `MAJOOR_OUTPUT_DIRECTORY` - Override ComfyUI output directory

### External Tools
- `MAJOOR_EXIFTOOL_PATH` - Path to ExifTool binary
- `MAJOOR_FFPROBE_PATH` - Path to FFProbe binary
- `MAJOOR_MEDIA_PROBE_BACKEND` - Metadata backend: `auto`, `exiftool`, `ffprobe`, or `both` (default: `auto`)

### File Watcher
- `MAJOOR_ENABLE_FILE_WATCHER` - Enable automatic reindexing (default: `false`)
- `MAJOOR_WATCHER_INTERVAL` - Polling interval in seconds (default: `15.0`)
- `MAJOOR_WATCHER_PATHS` - Colon/semicolon-separated paths to watch

### Performance Tuning
- `MAJOOR_DB_TIMEOUT` - Database connection timeout (default: `30.0`)
- `MAJOOR_DB_MAX_CONNECTIONS` - Connection pool size (default: `8`)
- `MAJOOR_EXIFTOOL_TIMEOUT` - ExifTool command timeout (default: `15`)
- `MAJOOR_FFPROBE_TIMEOUT` - FFProbe command timeout (default: `10`)

---

## 📝 Notes & Tips

### 📌 Recent Changes (v2.0 Architecture Refactor)

This version represents a **complete rewrite** with:
- Clean separation between backend (Python) and frontend (JavaScript)
- Modular feature-based architecture
- Improved dependency injection and testability
- Better error handling with Result types
- Enhanced observability and logging
- Optimized database connection pooling
- Auto-detection of external tools

### General Tips

- **Index location**: The SQLite database is stored in `<output_directory>/_mjr_index/assets.sqlite`
- **Collections folder**: Smart filters and saved collections are stored in `_mjr_collections` inside your ComfyUI output directory
- **Workflow fingerprinting**: Uses SHA1 of canonicalized workflow JSON (excludes node IDs, positions, UI properties) for stable matching across workflow variations
- **Index freshness**: The SQLite FTS5 index auto-detects staleness based on file modification times and triggers incremental reindexing
- **Supported file types**:
  - Images: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`
  - Videos: `.mp4`, `.mov`, `.webm`, `.mkv`
  - Audio: `.wav`, `.mp3`, `.flac`, `.ogg`, `.m4a`, `.aac`
  - 3D Models: `.obj`, `.fbx`, `.glb`, `.gltf`, `.stl`
- **Bulk operations**: When selecting 100+ files, a progress modal appears with real-time updates and cancellation support
- **Connection handling**: Gracefully handles HTTP 499 (client closed request) and JSON serialization edge cases (NaN/Infinity)
- **Progressive enhancement**: Full-text search gracefully falls back to LIKE queries if FTS5 is unavailable
