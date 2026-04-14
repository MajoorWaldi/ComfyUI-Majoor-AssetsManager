# Majoor Assets Manager for ComfyUI

## Presentation Video

<video src="https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/releases/download/v2.4.4/COMFYUI.ASSETS.MANAGER.mp4" controls autoplay muted loop width="100%"></video>

[![GitHub Repo](https://img.shields.io/badge/GitHub-Repo-181717?logo=github)](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager)
[![GitHub Stars](https://img.shields.io/github/stars/MajoorWaldi/ComfyUI-Majoor-AssetsManager?style=flat)](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/MajoorWaldi/ComfyUI-Majoor-AssetsManager?style=flat)](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/network/members)
[![GitHub Issues](https://img.shields.io/github/issues/MajoorWaldi/ComfyUI-Majoor-AssetsManager?style=flat)](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/issues)
[![License](https://img.shields.io/github/license/MajoorWaldi/ComfyUI-Majoor-AssetsManager?style=flat)](LICENSE)
[![Downloads](https://img.shields.io/github/downloads/MajoorWaldi/ComfyUI-Majoor-AssetsManager/total?style=flat)](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/releases)
[![CI](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/actions/workflows/python-tests.yml/badge.svg)](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/actions/workflows/python-tests.yml)
[![Python Version](https://img.shields.io/badge/Python-3.10--3.12-blue)](https://www.python.org/)
[![ComfyUI](https://img.shields.io/badge/ComfyUI-%3E%3D0.13.0-brightgreen)](https://github.com/comfyanonymous/ComfyUI)
[![Frontend Tests](https://img.shields.io/badge/Frontend%20Tests-Vitest-6e9f18)](https://vitest.dev/)
[![Buy Me a White Monster Drink](https://img.shields.io/badge/Ko--fi-Buy_Me_a_White_Monster_Drink-ff5e5b?logo=ko-fi)](https://ko-fi.com/majoorwaldi)

**Advanced asset browser for ComfyUI** — Search, filter, preview, organize, and manage generated files directly in the UI with real-time generation tracking.

![Majoor Assets Manager Demo](examples/ComfyUI_Majoor_AssetsManager_Video.gif)

## Samples

![Majoor Assets Manager Sample](<examples/Capture d'écran 2026-02-28 210333.png>)

## Quick Start

- **Install** from [ComfyUI Manager](https://github.com/ltdrdata/ComfyUI-Manager) (recommended), then restart ComfyUI
- Open the **Assets Manager** tab in the ComfyUI sidebar
- Pick a scope: **Outputs** / **Inputs** / **Custom** / **Collections**
- Use search and filters, right-click for actions, double-click to open Viewer
- **NEW**: Try the **Majoor Floating Viewer (MFV)** for real-time generation comparison

Useful links:
- 📖 User guide: `user_guide.html`
- 📝 Changelog: [`CHANGELOG.md`](CHANGELOG.md)
- 📚 Documentation index: [`docs/DOCUMENTATION_INDEX.md`](docs/DOCUMENTATION_INDEX.md)
- 🔐 Privacy / Offline guide: [`docs/PRIVACY_OFFLINE.md`](docs/PRIVACY_OFFLINE.md)
- 🔧 API reference: [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md)
- 📦 Dependency policy: [`docs/DEPENDENCY_POLICY.md`](docs/DEPENDENCY_POLICY.md)
- 🏛️ ADR index: [`docs/adr/README.md`](docs/adr/README.md)
- 🤖 **AI Features Guide**: [`docs/AI_FEATURES.md`](docs/AI_FEATURES.md)

---

## Table of Contents

- [Main Features](#main-features)
- [What's New in v2.4.5](#whats-new-in-v245)
- [Installation](#installation)
- [ComfyUI Desktop Second-Screen Popup](#comfyui-desktop-second-screen-popup)
- [Basic Usage](#basic-usage)
- [Majoor Floating Viewer (MFV)](#majoor-floating-viewer-mfv)
- [Custom Nodes](#custom-nodes)
- [Hotkeys & Shortcuts](#hotkeys--shortcuts)
- [Advanced Features](#advanced-features)
- [AI Features (How to Use)](#ai-features-how-to-use)
- [Privacy And Offline Use](#privacy-and-offline-use)
- [Debug: Reset Index / Delete DB](#debug-reset-index--delete-db)
- [Backfill Warning (Important)](#backfill-warning-important)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Development & Testing](#development--testing)
- [Support](#support)

---

## Main Features

### Asset Management
- **Fast Grid Browsing**: Virtual scrolling for large libraries (thousands of assets)
- **Multi-Scope Support**: Browse Outputs, Inputs, Custom directories, and Collections
- **Drag & Drop**: To ComfyUI canvas or OS (multi-select ZIP supported)
- **File Operations**: Rename, delete, open folder, copy path, stage to input

### Search & Organization
- **Full-Text Search**: SQLite FTS5 with BM25 ranking across filenames and metadata
- **Advanced Filtering**: By type, rating, workflow, date, file size, resolution
- **Ratings System**: 0-5 stars with Windows Explorer sync support
- **Tags**: Custom hierarchical tags with autocomplete
- **Collections**: Save and reopen grouped selections across scopes

### Viewer & Analysis
- **Advanced Viewer**: Image/video preview with zoom, pan, and comparison modes
- **Enhancement Tools**: Exposure (EV), gamma correction, channel isolation
- **Analysis Tools**: False color, zebra patterns, histogram, waveform, vectorscope
- **Visual Overlays**: Grid overlays, pixel probe, loupe magnification
- **Workflow Minimap**: Visual representation of generation workflow

### Real-Time Features
- **Live Generation Tracking**: Automatic indexing of new outputs
- **Majoor Floating Viewer**: Real-time preview of generations with multi-pin references and node parameter editing
- **Event-Driven Updates**: Instant grid updates via ComfyUI events

---

## What's New in v2.4.5

### Latest Release Highlights
- **Floating Viewer — Multi-Pin (A/B/C/D)**: Pin up to 4 images and compare them simultaneously
- **Floating Viewer — Node Parameters Sidebar**: Edit prompts, seeds, and samplers directly inside the viewer; Run button for immediate re-queue
- **Floating Viewer — Sidebar Position Setting**: Place the Node Parameters sidebar on the right, left, or bottom
- **Documentation sync**: Main guides, API reference, testing docs, and user guide aligned with the current repository
- **Version bump**: Published project metadata and docs now target 2.4.5 consistently
- **Plugin docs refresh**: Plugin compatibility examples now reflect the current Majoor baseline

See [CHANGELOG.md](CHANGELOG.md) for the complete release notes.

### Key Feature Highlights

### 🤖 AI Features
Complete AI-powered asset discovery and organization:
- **Semantic Search**: Natural language queries ("sunset over mountains")
- **Find Similar**: Visual similarity matching
- **AI Auto-Tags**: Automatic tagging (portrait, landscape, cyberpunk, etc.)
- **Enhanced Captions**: Florence-2 generated descriptions
- **Prompt Alignment**: Score image-prompt matching quality
- **Smart Collections**: Auto-group by visual themes
- **Models**: SigLIP2 (image/text), X-CLIP (video), Florence-2 (caption)
- See full guide: [`docs/AI_FEATURES.md`](docs/AI_FEATURES.md)

### 🎉 Majoor Floating Viewer (MFV)
A lightweight floating viewer panel for real-time generation comparison:
- **Live Stream Mode**: Automatically follows new generations from Save/Load nodes
- **Compare Modes**: Simple, A/B Compare, and Side-by-Side views
- **Multi-Pin References (A/B/C/D)**: Pin up to 4 images with toggle buttons for simultaneous comparison
- **Node Parameters Sidebar**: View and edit workflow node widgets (prompts, seeds, samplers) directly inside the viewer
- **Run Button**: Queue prompt from the viewer toolbar without switching back to the canvas
- **Sidebar Position Setting**: Place the Node Parameters sidebar on the right, left, or bottom via Settings
- **Real-time Preview**: Watch generations as they complete
- **Node Tracking**: Click on LoadImage/SaveImage nodes to preview their content
- **Pan & Zoom**: Mouse wheel zoom and click-drag pan for detailed inspection
- **Gen Info Overlay**: Display prompt, seed, model, and LoRA for each generation; when the inline MFV player is present, the overlay automatically shifts above the player controls
- **Draggable Panel**: Position anywhere on screen, resizable
- **Keyboard Shortcuts**: Quick mode switching and focused player controls, including Space for play/pause and Left/Right for frame stepping

### 🔧 Major Improvements
- **Cross-Platform**: Full Linux support (Ubuntu 22.04+, Fedora, Debian)
- **Code Quality**: Moved inline styles to CSS, improved error handling
- **Performance**: Reduced redundant parsing, improved caching
- **Test Coverage**: Added pytest (backend) and Vitest (frontend) test suites

### 🐛 Bug Fixes
- Fixed CSS file corruption, gen info display, memory leaks
- Fixed race conditions, duplicate CSS rules, viewer lifecycle management
- Multiple indexing and metadata parsing improvements

See [`CHANGELOG.md`](CHANGELOG.md) for complete details.

---

## Recent Platform Improvements

The following improvements were delivered across the recent release cycle:

### 🔧 Core Improvements
- **Improved Assets Metadata Parsing**: Enhanced metadata extraction and parsing pipeline
- **Grid Compare up to 4 Assets**: Extended Floating Viewer Grid Compare mode supporting up to 4 simultaneous assets
- **Ping Pong Loop in Main Viewer**: Added ping-pong playback (forward then reverse) for videos in the main Viewer player
- **Job ID and Stack ID in Database**: Enhanced assets management with execution grouping via `job_id` and `stack_id` fields
- **Code Refactor for Maintainability**: Major codebase refactoring for improved long-term maintainability
- **Various Bug Fixes**: Multiple stability and correctness improvements

See [`CHANGELOG.md`](CHANGELOG.md) for the detailed release history.

---

## Installation

### Method A: ComfyUI Manager (Recommended)

1. Open **ComfyUI Manager** in your browser
2. Search for **"Majoor Assets Manager"**
3. Click **Install**, then restart ComfyUI completely
4. The extension appears in the sidebar as a folder icon

### Method B: Manual Installation

```bash
# Navigate to ComfyUI custom_nodes directory
cd ComfyUI/custom_nodes

# Clone the repository
git clone https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager ComfyUI-Majoor-AssetsManager

# Install Python dependencies
cd ComfyUI-Majoor-AssetsManager
pip install -r requirements.txt

# Optional: install AI/vector features
# pip install -r requirements.txt -r requirements-vector.txt

# Optional: install contributor tooling
# pip install -r requirements-dev.txt

# Restart ComfyUI
```

Dependency ownership is documented in [`docs/DEPENDENCY_POLICY.md`](docs/DEPENDENCY_POLICY.md). `requirements.txt` is the primary source of truth, `requirements-vector.txt` layers optional AI/vector dependencies on top, and `requirements-dev.txt` is reserved for contributor tooling.

### Optional Dependencies (Highly Recommended)

For full metadata extraction and media probing:

#### Windows
```powershell
# Using Scoop
scoop install ffmpeg exiftool

# OR using Chocolatey
choco install -y ffmpeg exiftool

# OR using WinGet
winget install -e --id Gyan.FFmpeg
winget install -e --id OliverBetz.ExifTool
```

#### macOS
```bash
brew install ffmpeg exiftool
```

#### Linux
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y ffmpeg libimage-exiftool-perl

# Fedora/RHEL
sudo dnf install -y ffmpeg perl-Image-ExifTool

# Arch Linux
sudo pacman -S ffmpeg exiftool
```

Verify installation:
```bash
exiftool -ver
ffprobe -version
```

See [`docs/INSTALLATION.md`](docs/INSTALLATION.md) for detailed instructions.

### ComfyUI Desktop Second-Screen Popup

If you use the official **ComfyUI Desktop / Electron** build and want the **Majoor Floating Viewer** to open in a real detachable window that can be moved to another monitor, the Desktop host must allow `window.open("about:blank")` popups.

The Majoor plugin already tries to open a real popup first on Desktop. However, some Desktop builds still block that popup in the Electron host and redirect it to the OS instead. In that case, add the popup allow-list below to the Desktop app host.

Typical file to patch in an extracted Desktop app:

```text
.vite/build/main.cjs
```

Find the `#shouldOpenInPopup(url2)` method and make sure it allows `about:blank`, `127.0.0.1`, and `localhost`:

```js
  #shouldOpenInPopup(url2) {
    return url2 === "about:blank"
      || url2.startsWith("http://127.0.0.1:")
      || url2.startsWith("http://localhost:")
      || url2.startsWith("https://dreamboothy.firebaseapp.com/")
      || url2.startsWith("https://checkout.comfy.org/")
      || url2.startsWith("https://accounts.google.com/")
      || url2.startsWith("https://github.com/login/oauth/");
  }
```

And ensure the window-open handler still allows popup creation for approved URLs:

```js
    this.window.webContents.setWindowOpenHandler(({ url: url2 }) => {
      if (this.#shouldOpenInPopup(url2)) {
        return {
          action: "allow",
          overrideBrowserWindowOptions: {
            webPreferences: { preload: void 0 },
          },
        };
      }

      electron.shell.openExternal(url2);
      return { action: "deny" };
    });
```

After patching the Desktop host:

1. Repack the Desktop app archive if needed.
2. Restart ComfyUI Desktop completely.
3. Reopen Majoor Assets Manager.
4. Use the MFV pop-out button. It should now open a real detachable window that can be moved to another screen.

Notes:

- This host-side patch is only needed for Desktop builds that still block `about:blank` popups.
- Browser-based ComfyUI does not require this Electron host patch.
- If your Desktop build already allows these popup URLs, no extra host change is required.

---

## Custom Nodes

Majoor Assets Manager ships two ComfyUI nodes that persist **generation timing metadata** directly inside the saved files. This allows the asset manager to index `generation_time_ms` alongside prompt/workflow data for every asset.

Full reference: [`docs/CUSTOM_NODES.md`](docs/CUSTOM_NODES.md)

### Majoor Save Image 💾

Drop-in replacement for the built-in **SaveImage** node. Saves PNG files with `generation_time_ms` embedded in the PNG text chunks.

| Input | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `images` | IMAGE | ✅ | — | The image batch to save |
| `filename_prefix` | STRING | ✅ | `Majoor` | Filename prefix (supports ComfyUI `%date%` placeholders) |
| `generation_time_ms` | INT | ❌ | `-1` (auto) | Generation time in ms. `-1` = auto-detect from prompt lifecycle |

**Metadata written to each PNG:**
- `prompt` — full ComfyUI prompt graph (JSON)
- `workflow` — full workflow (JSON)
- `generation_time_ms` — elapsed time since prompt start (ms)
- `CreationTime` — ISO timestamp

### Majoor Save Video 🎬

Saves a **VIDEO** input or a batch of **IMAGE** frames as a video file. Supports MP4 (h264 via PyAV), GIF, and WebP.

| Input | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `filename_prefix` | STRING | ✅ | `MajoorVideo` | Filename prefix |
| `format` | COMBO | ✅ | `mp4 (h264)` | Output format: `mp4 (h264)`, `gif`, `webp` |
| `images` | IMAGE | ❌ | — | Batch of frames (alternative to `video`) |
| `video` | VIDEO | ❌ | — | A VIDEO input from LoadVideo/CreateVideo |
| `frame_rate` | FLOAT | ❌ | `24.0` | FPS (ignored when VIDEO input carries its own rate) |
| `loop_count` | INT | ❌ | `0` | Loop count for GIF/WebP (0 = infinite) |
| `generation_time_ms` | INT | ❌ | `-1` (auto) | Generation time in ms. `-1` = auto-detect |
| `audio` | AUDIO | ❌ | — | Audio track to mux into MP4 |
| `crf` | INT | ❌ | `19` | Constant Rate Factor (0-63, lower = higher quality) |
| `save_first_frame` | BOOLEAN | ❌ | `true` | Save a PNG sidecar of the first frame with full metadata |

**MP4 container metadata:**
- `prompt`, `workflow`, `generation_time_ms`, `CreationTime` — written via PyAV with `movflags=use_metadata_tags`

**Notes:**
- At least one of `images` or `video` must be connected
- When a `video` input is connected, its native frame rate and audio are used automatically
- GIF/WebP outputs rely on the PNG sidecar for metadata persistence

### Auto-Detection of `generation_time_ms`

When `generation_time_ms` is left at `-1` (default), the node reads the prompt start time from Majoor's `runtime_activity` module, which hooks into the ComfyUI prompt lifecycle. This gives an accurate wall-clock measurement of generation time without any manual wiring.

If the Majoor nodes are **not** used, the asset manager falls back to its standard metadata extraction (EXIF dates, prompt graph analysis, etc.).

---

## Basic Usage

### First Steps
1. **Open Assets Manager**: Click the folder icon in ComfyUI sidebar
2. **Choose Scope**: Select Outputs, Inputs, Custom, or Collections
3. **Browse Assets**: Scroll through the grid view with virtual scrolling
4. **Search**: Type in the search bar for full-text search
5. **Filter**: Use dropdowns for kind, rating, workflow, date filters

### Asset Operations (Right-Click Menu)
- **Open in Viewer**: Double-click or right-click → Open in Viewer
- **Rate**: Assign 0-5 stars
- **Edit Tags**: Add/remove custom tags
- **Add to Collection**: Save to existing or new collection
- **Rename**: Change filename
- **Delete**: Remove asset (with confirmation)
- **Open in Folder**: Show in file explorer
- **Copy Path**: Copy full file path to clipboard
- **Stage to Input**: Copy to ComfyUI input directory

### Collections
1. Select assets (Ctrl/Cmd+click for multiple)
2. Right-click → **Add to Collection**
3. Create new or add to existing collection
4. Access via **Collections** scope

---

## Majoor Floating Viewer (MFV)

### Opening the Floating Viewer
- Click the **Floating Viewer** button in the Assets Manager toolbar
- Or use the viewer from the ComfyUI canvas context menu

### Live Stream Mode
- Automatically tracks new generations
- Follows Save/Load node outputs in real-time
- No manual refresh needed

### Compare Modes
- **Simple**: Single image view
- **A/B Compare**: Toggle between two images
- **Side-by-Side**: View both images simultaneously

### Node Tracking
- Click on any LoadImage/SaveImage node in ComfyUI
- Floating Viewer shows that node's content instantly
- Great for comparing intermediate results

### Controls
- **Zoom**: Mouse wheel
- **Pan**: Click and drag
- **Move Panel**: Drag from panel header
- **Resize**: Drag panel edges
- **Close**: ESC or close button
- **Focused Player Shortcuts**: Click once on the inline player, then use **Space** to play/pause and **Left/Right** to step frame by frame

See [`docs/VIEWER_FEATURE_TUTORIAL.md`](docs/VIEWER_FEATURE_TUTORIAL.md) for complete viewer documentation.

---

## Hotkeys & Shortcuts

### Global / Panel
| Shortcut | Action |
|----------|--------|
| **Ctrl+S** / **Cmd+S** | Trigger index scan |
| **Ctrl+F** / **Ctrl+K** | Focus search input |
| **Ctrl+H** | Clear search input |
| **D** | Toggle sidebar (details) |

### Grid View
| Shortcut | Action |
|----------|--------|
| **Arrow Keys** | Navigate selection |
| **Enter** / **Space** | Open Viewer |
| **Ctrl+A** | Select all |
| **Ctrl+D** | Deselect all |
| **Ctrl+Click** | Toggle selection |
| **Shift+Click** | Range selection |
| **0-5** | Set rating (0-5 stars) |
| **T** | Edit tags |
| **B** | Add to collection |
| **F2** | Rename file |
| **Delete** | Delete file |

### Viewer
| Shortcut | Action |
|----------|--------|
| **Esc** | Close viewer |
| **F** | Toggle fullscreen |
| **D** | Toggle info panel |
| **Space** | Play/pause video |
| **Left/Right** | Previous/next asset, or step frame when the focused MFV player is active |
| **Mouse Wheel** | Zoom in/out |
| **I** | Toggle pixel probe |
| **C** | Copy probed color |
| **L** | Toggle loupe |
| **Z** | Toggle zebra patterns |
| **G** | Cycle grid overlays |
| **Alt+1** | Toggle 1:1 pixel view |

See [`docs/HOTKEYS_SHORTCUTS.md`](docs/HOTKEYS_SHORTCUTS.md) and [`docs/SHORTCUTS.md`](docs/SHORTCUTS.md) for complete lists.

---

## Advanced Features

### Search & Filtering
- **Full-Text Search**: Search filenames, prompts, models, parameters
- **Attribute Filters**: Type `rating:5` or `ext:png` directly in search
- **Workflow Filter**: Show only assets with workflow data
- **Date Range**: Filter by creation/modification dates
- **File Size**: Filter by file weight
- **Resolution**: Filter by image dimensions

### Metadata Extraction
- **PNG/WEBP**: Embedded generation info (prompts, seeds, models)
- **Video**: FFprobe metadata (duration, codec, resolution)
- **Audio**: ID3 tags, duration, codec info
- **Workflow JSON**: Node graphs, parameters, custom nodes
- **Modern Workflows**: Flux, WanVideo, HunyuanVideo, Qwen, Marigold

### Ratings & Tags
- **5-Star Rating**: With Windows Explorer sync (RatingPercent)
- **Custom Tags**: Hierarchical tags (e.g., `style:anime:fantasy`)
- **Bulk Operations**: Apply ratings/tags to multiple assets
- **Sync to File**: Optional metadata sync via ExifTool

### Drag & Drop
- **To Canvas**: Drag assets to compatible nodes (LoadImage, LoadVideo, etc.)
- **To OS**: Drag to file explorer (single file or multi-select ZIP)
- **Staging**: Assets staged for immediate use in workflows

### Database Management
- **Index Location**: `<output>/_mjr_index/assets.sqlite`
- **Reset Index**: Clear and rebuild index (requires readable DB)
- **Delete DB**: Force-delete and rebuild (works on corrupted DB)
- **Optimize**: Run `PRAGMA optimize` and `ANALYZE`

See [`docs/DB_MAINTENANCE.md`](docs/DB_MAINTENANCE.md) for database recovery procedures.

---

## AI Features (How to Use)

📚 **Complete Guide**: See [`docs/AI_FEATURES.md`](docs/AI_FEATURES.md) for comprehensive documentation.

### What AI features are available

- **🔮 AI Semantic Search**: Natural-language search across your library (e.g., "sunset over mountains")
- **🔍 Find Similar**: Pick one asset and retrieve visually similar assets
- **🏷️ AI Auto-Tags**: Automatic tag suggestions (portrait, landscape, cyberpunk, anime, etc.)
- **📝 Enhanced Captions**: Florence-2 generated detailed image descriptions
- **📊 Prompt Alignment Score**: Measure how well an image matches its generation prompt
- **📁 Smart Collections**: Auto-create themed collections from AI suggestions
- **🔬 Discover Groups**: Cluster your library by visual similarity

### How to use AI features

1. **Enable AI**: Open **Settings** → Keep **Enable AI semantic search** enabled (default: ON)
2. **Build Vectors**: After indexing, click **Backfill vectors** in **Index Status**
3. **Use Features**:
   - **Search**: Click sparkles icon (🔮) → Type natural language queries
   - **Find Similar**: Select asset → Right-click → Find Similar
   - **Collections**: Open Collections → Smart Suggestions / Discover Groups
   - **Caption**: Open asset → Sidebar → Image Description → Generate
   - **Alignment**: Open asset → Sidebar → Prompt Alignment score

### Per-Asset Quick Actions

You can trigger scan and backfill vectors for **individual assets** directly from the grid:

| Action | How To |
|--------|--------|
| **Index Asset** | Click status dot on card → "Index Asset" |
| **Generate Vector** | Click status dot → "Generate Vector" |
| **Generate Caption** | Hover card → Click sparkles (🔮) → Generate Caption |
| **Compute Alignment** | Hover card → Click sparkles → Compute Alignment |
| **Suggest Tags** | Hover card → Click sparkles → Suggest Tags |
| **Find Similar** | Hover card → Click sparkles → Find Similar |

#### Visual Status Indicators

| Indicator | Meaning |
|-----------|---------|
| 🟢 Green dot | Asset fully indexed with vectors |
| 🟡 Yellow dot | Asset indexed, vectors pending |
| 🔴 Red dot | Indexing failed or vectors unavailable |
| 🔮 Sparkles visible | AI features available |
| ⏳ Spinning icon | Processing in progress |

### AI Models

| Model | Purpose | Size |
|-------|---------|------|
| **SigLIP2 SO400M** | Image & text embeddings | ~1.2 GB |
| **X-CLIP Base** | Video embeddings | ~600 MB |
| **Florence-2 Base** | Image captioning | ~800 MB |

Models are downloaded automatically on first use and cached locally.

### Quick Tips

- ✅ Non-AI features work independently if AI is disabled
- ✅ AI quality depends on metadata quality and vector coverage
- ✅ First backfill can take time (5-30 min for 1000 assets)
- ✅ GPU acceleration recommended for large libraries

---

## Privacy And Offline Use

### Short version

- AI inference is intended to run locally on your machine.
- Images and prompts are not uploaded to a hosted cloud inference API for semantic search, captions, similarity, or prompt alignment.
- Internet access is mainly needed for the initial HuggingFace model download.
- Once required models are cached locally, AI features can work offline.
- No usage telemetry is intentionally sent to the developer.

### What uses the network

- **Model download**: AI models are downloaded from HuggingFace on first use and then cached locally.
- **Optional HuggingFace token**: used only to improve HuggingFace Hub download access and rate limits.
- **Remote access security**: the Majoor API token protects remote write access when ComfyUI is exposed on a network.

### What the tokens mean

- **HuggingFace Token**: optional token for model downloads from HuggingFace Hub. It is not a cloud inference key.
- **Majoor: API Token**: token for securing remote write operations to the local Majoor backend. It is not used to send prompts or images to an external AI service.

### Important nuance

The privacy claim here is specifically about where inference runs and whether your assets or prompts are uploaded for AI processing. Model loading still relies on local HuggingFace/Transformers packages and downloaded model files.

See [docs/PRIVACY_OFFLINE.md](docs/PRIVACY_OFFLINE.md), [docs/AI_FEATURES.md](docs/AI_FEATURES.md), and [docs/SECURITY_ENV_VARS.md](docs/SECURITY_ENV_VARS.md) for the detailed version.

### Configuration

```bash
# Enable/disable AI features (default: ON)
export MJR_AM_ENABLE_VECTOR_SEARCH=1

# Adjust auto-tag sensitivity (0.0-1.0, default: 0.06)
export MJR_AM_VECTOR_AUTOTAG_THRESHOLD=0.06

# Verbose AI logging for debugging
export MJR_AM_AI_VERBOSE_LOGS=1
```

### Performance

| Library Size | Backfill Time (CPU) | Backfill Time (GPU) |
|--------------|---------------------|---------------------|
| 100 assets | 2-5 min | 30-60 sec |
| 500 assets | 10-25 min | 2-5 min |
| 1000 assets | 20-50 min | 5-10 min |
| 5000 assets | 2-4 hours | 25-50 min |

*GPU: NVIDIA RTX 3060 or equivalent*

---

## Debug: Reset Index / Delete DB

Use this when indexing behavior is inconsistent, after major updates, or when the DB is corrupted.

### Reset Index
- Rebuilds index data and rescans files.
- Best first step when DB is still readable.

### Delete DB
- Emergency recovery mode: force-delete DB files and rebuild from scratch.
- Use this when DB is corrupted or reset fails.

### Dialog behavior
When you click **Reset Index** or **Delete DB**, the UI first asks whether existing AI vectors should be kept, then shows a simple confirmation dialog.
- If you keep vectors, the reset/rebuild preserves the existing AI vector data.
- If you do not keep vectors, the reset is full and vectors will be recalculated later if needed.

---

## Backfill Warning (Important)

Backfilling vectors can take a long time on large libraries, especially over 1000 assets.

### How backfill works
- It scans indexed assets and computes missing AI embeddings (vectors).
- It runs as a background process, in batches.
- You can continue using **Assets Manager** and **ComfyUI** while it runs.

### Why it can be slow
- Number of assets and media type mix (images/videos)
- CPU/GPU availability and model load time
- Disk speed and overall system load
- Available system RAM (more RAM helps keep processing smoother)

### What you get after backfill
- Better semantic search coverage
- Better **Find Similar** results
- Better clustering/smart collection quality
- Better prompt-alignment and AI-assisted metadata workflows

---

## Configuration

### Browser Settings (localStorage)
- **Page Size**: Assets per request (default: 50-100)
- **Sidebar Position**: Left or Right
- **Hide PNG Siblings**: Hide PNGs when video previews exist
- **Auto-Scan on Startup**: Enable/disable automatic scanning
- **Status Poll Interval**: Background task check frequency (1-5s)

### Environment Variables (Backend)

#### Directory Configuration
```bash
# Override default output directory
export MAJOOR_OUTPUT_DIRECTORY="/path/to/your/output"
```

#### External Tool Paths
```bash
# Specify tool paths if not in PATH
export MAJOOR_EXIFTOOL_PATH="/path/to/exiftool"
export MAJOOR_FFPROBE_PATH="/path/to/ffprobe"
```

#### Media Processing
```bash
# Set media probe backend (auto, exiftool, ffprobe, both)
export MAJOOR_MEDIA_PROBE_BACKEND="auto"
```

#### Database Tuning
```bash
# Database operation timeout (seconds)
export MAJOOR_DB_TIMEOUT=60.0

# Maximum concurrent DB connections
export MAJOOR_DB_MAX_CONNECTIONS=12

# Query execution timeout (seconds)
export MAJOOR_DB_QUERY_TIMEOUT=45.0
```

#### Security & Performance
```bash
# Allow symlinks in custom roots (default: off)
export MJR_ALLOW_SYMLINKS=on

# Trusted proxies for X-Forwarded-For
export MAJOOR_TRUSTED_PROXIES=127.0.0.1,192.168.1.0/24

# Maximum metadata JSON size (bytes, default: 2MB)
export MAJOOR_MAX_METADATA_JSON_BYTES=4194304

# Max items per collection (default: 50000)
export MJR_COLLECTION_MAX_ITEMS=100000

# Disable automatic pip installs at startup
export MJR_AM_NO_AUTO_PIP=1
```

#### API Security
```bash
# Set API token for remote access
export MAJOOR_API_TOKEN="your-secret-token"

# Force token auth even for loopback
export MAJOOR_REQUIRE_AUTH=1

# Allow remote write without token (UNSAFE)
export MAJOOR_ALLOW_REMOTE_WRITE=1

# Enable initial bootstrap token endpoint
export MAJOOR_ALLOW_BOOTSTRAP=1
```

#### Safe Mode Operations
```bash
# Disable Safe Mode (default: enabled)
export MAJOOR_SAFE_MODE=0

# Allow specific operations while Safe Mode enabled
export MAJOOR_ALLOW_WRITE=1
export MAJOOR_ALLOW_DELETE=1
export MAJOOR_ALLOW_RENAME=1
export MAJOOR_ALLOW_OPEN_IN_FOLDER=1
```

See [`docs/SETTINGS_CONFIGURATION.md`](docs/SETTINGS_CONFIGURATION.md) and [`docs/SECURITY_ENV_VARS.md`](docs/SECURITY_ENV_VARS.md) for complete configuration guide.

---

## Troubleshooting

### Extension Not Appearing
- Verify installation in `custom_nodes/ComfyUI-Majoor-AssetsManager`
- Check ComfyUI console for import errors
- Ensure core dependencies are installed: `pip install -r requirements.txt`
- If you use AI/vector features, also install: `pip install -r requirements.txt -r requirements-vector.txt`
- Restart ComfyUI completely

### Database Corruption
If the index database is corrupted:

**Option 1: Use Delete DB Button** (Recommended)
1. Open Assets Manager → Index Status section
2. Click **Delete DB** button
3. Confirm the warning dialog
4. Database rebuilds automatically

**Option 2: Manual Recovery**
1. Stop ComfyUI completely
2. Navigate to `<output>/_mjr_index/`
3. Delete `assets.sqlite`, `assets.sqlite-wal`, `assets.sqlite-shm`
4. Restart ComfyUI

See [`docs/DB_MAINTENANCE.md`](docs/DB_MAINTENANCE.md) for detailed recovery procedures.

### External Tools Not Found
- Verify installation: `exiftool -ver` and `ffprobe -version`
- Check if tools are in system PATH
- Set environment variables for explicit paths
- Restart ComfyUI after installing tools

### Slow Performance
- First scan of large directories takes time (incremental indexing helps)
- Reduce page size in settings for lower memory usage
- Exclude very large directories from custom roots
- Ensure SSD storage for better database performance

### Search Not Working
- Trigger manual scan with **Ctrl+S**
- Verify the correct scope is selected
- Check if directory has been indexed (status indicator)
- Clear browser cache and reload

### Drag & Drop Issues
- Verify browser supports HTML5 drag & drop
- Check file permissions for source files
- For multi-select ZIP, ensure sufficient disk space
- Try a different browser if issues persist

### API / Remote Access
- Set `MAJOOR_API_TOKEN` for secure remote access
- Configure `MAJOOR_TRUSTED_PROXIES` if behind reverse proxy
- Check firewall settings for ComfyUI port
- Verify CORS settings if accessing from different origin

---

## Development & Testing

### Dependency Setup
```bash
# Runtime-only install
pip install -r requirements.txt

# Runtime + optional AI/vector features
pip install -r requirements.txt -r requirements-vector.txt

# Contributor tooling (tests, lint, typing, security checks)
pip install -r requirements-dev.txt
```

Dependency roles and update rules are defined in [`docs/DEPENDENCY_POLICY.md`](docs/DEPENDENCY_POLICY.md).

### Project Structure
```
ComfyUI-Majoor-AssetsManager/
├── __init__.py                 # Extension entry point
├── js/                         # Frontend (Vue 3 + Pinia, vanilla JS)
│   ├── entry.js               # Main entry
│   ├── app/                   # App initialization, settings
│   ├── components/            # UI components
│   ├── features/              # Feature modules
│   ├── stores/                # Pinia stores
│   ├── api/                   # API client
│   └── vue/                   # Vue.js source modules
├── mjr_am_backend/            # Backend (Python)
│   ├── routes/                # API routes, route_catalog.py (declarative)
│   ├── routes/core/           # Shared HTTP helpers (security, path, JSON)
│   ├── routes/assets/         # Thin compat facades → features/assets/
│   ├── features/assets/       # Asset domain: 9 sub-services
│   ├── features/              # Other backend features
│   ├── adapters/db/           # SQLite: facade + split sub-modules
│   └── shared.py              # Shared backend helpers
├── mjr_am_shared/             # Shared code (frontend/backend)
├── tests/                     # Test suites
│   ├── core/                  # Core functionality tests
│   ├── metadata/              # Metadata extraction tests
│   ├── features/              # Feature tests
│   ├── database/              # Database tests
│   └── security/              # Security tests
├── docs/                      # Documentation
└── scripts/                   # Utility scripts
```

> For detailed architecture and module responsibilities, see [docs/ARCHITECTURE_MAP.md](docs/ARCHITECTURE_MAP.md).

### Running Tests

#### Backend Tests (pytest)
```bash
# All tests
python -m pytest tests/ -q

# Single test file
python -m pytest tests/core/test_routes.py -v

# Single test function
python -m pytest tests/core/test_routes.py::test_routes -v

# With coverage
pytest tests/ --cov=mjr_am_backend --cov-report=html
```

#### Frontend Tests (Vitest)
```bash
# Run JavaScript tests
npm run test:js

# Watch mode
npm run test:js:watch
```

#### Windows Batch Runners
```bat
# Full test suite
run_tests.bat

# With JUnit XML and HTML reports
tests/run_tests_all.bat
```

Test reports: `tests/__reports__/index.html`

### Code Quality
```bash
# Install local git hooks once
python scripts/install_local_hooks.py

# Canonical repo quality gate
python scripts/run_quality_gate.py

# Fast Python-only gate
python scripts/run_quality_gate.py --python-only --skip-tests

# Fast local pre-push equivalent on changed files
python scripts/run_changed_quality_gate.py

# Individual checks
mypy --config-file mypy.ini
python -m ruff check --fix mjr_am_backend mjr_am_shared tests scripts __init__.py
bandit -r mjr_am_backend -ll -ii -x tests
pip-audit -r requirements.txt
python scripts/check_cc_changed.py
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Install contributor dependencies: `pip install -r requirements-dev.txt`
4. Install local hooks: `python scripts/install_local_hooks.py`
5. Make your changes
6. Run tests: `run_tests.bat`
7. Submit a pull request

See [`docs/TESTING.md`](docs/TESTING.md), [`tests/README.md`](tests/README.md), and [`docs/DEPENDENCY_POLICY.md`](docs/DEPENDENCY_POLICY.md) for detailed contributor guidance.

---

## Data Locations

| Data Type | Location |
|-----------|----------|
| Index Database | `<output>/_mjr_index/assets.sqlite` |
| Custom Roots Config | `<output>/_mjr_index/custom_roots.json` |
| Collections | `<output>/_mjr_index/collections/*.json` |
| Temp Batch ZIPs | `<output>/_mjr_batch_zips/` |
| Browser Settings | `localStorage.mjrSettings` |

---

## Compatibility

- **ComfyUI**: ≥ 0.13.0 (recommended baseline)
- **Python**: 3.10, 3.11, 3.12 (3.13 compatible)
- **Operating Systems**:
  - Windows 10/11
  - macOS 10.15+
  - Linux (Ubuntu 22.04+, Fedora, Debian)
- **Browsers**: Modern browsers with ES2020+ support

---

## Support

### Documentation
- 📚 [Documentation Index](docs/DOCUMENTATION_INDEX.md)
- 🔐 [Privacy / Offline Guide](docs/PRIVACY_OFFLINE.md)
- 📖 [User Guide (HTML)](user_guide.html)
- 🔧 [API Reference](docs/API_REFERENCE.md)
- 🛠️ [Installation Guide](docs/INSTALLATION.md)
- ⚙️ [Settings & Configuration](docs/SETTINGS_CONFIGURATION.md)
- 🔒 [Security Model](docs/SECURITY_ENV_VARS.md)
- 🗄️ [Database Maintenance](docs/DB_MAINTENANCE.md)
- 🎯 [Viewer Tutorial](docs/VIEWER_FEATURE_TUTORIAL.md)
- 🏷️ [Ratings & Tags](docs/RATINGS_TAGS_COLLECTIONS.md)
- 🔍 [Search & Filtering](docs/SEARCH_FILTERING.md)
- 🎹 [Hotkeys & Shortcuts](docs/HOTKEYS_SHORTCUTS.md)
- 📦 [Drag & Drop](docs/DRAG_DROP.md)
- 🧪 [Testing Guide](docs/TESTING.md)

### Community
- 🐛 [Report Issues](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/issues)
- 💡 Use GitHub Issues for bug reports, support requests, and security/privacy questions
- ☕ [Support the Developer](https://ko-fi.com/majoorwaldi)

### Notes
- GitHub Discussions may not be enabled or available at all times for this repository.
- If the Discussions link is unavailable, please open an Issue instead.

### Troubleshooting Resources
1. Check ComfyUI console for error messages
2. Review relevant documentation sections above
3. Search existing GitHub issues
4. Verify external tools installation
5. Try resetting/deleting the database

---

## License

Copyright (c) 2026 Ewald ALOEBOETOE (MajoorWaldi)

Licensed under the **GNU General Public License v3.0** ([`LICENSE`](LICENSE)).

Optional attribution request: See [`NOTICE`](NOTICE) file for details.

---

## Acknowledgments

- ComfyUI team for the amazing node-based UI
- ComfyUI Manager for easy extension distribution
- ExifTool and FFprobe developers for metadata extraction
- Vue.js team for the frontend framework
- All contributors and users of this extension

---

*Last updated: April 5, 2026*
*Version: 2.4.5*
