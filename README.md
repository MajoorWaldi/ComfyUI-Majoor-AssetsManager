# Majoor Assets Manager for ComfyUI

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
- 🔧 API reference: [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md)

---

## Table of Contents

- [Main Features](#main-features)
- [What's New in v2.4.0](#whats-new-in-v240)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Majoor Floating Viewer (MFV)](#majoor-floating-viewer-mfv)
- [Hotkeys & Shortcuts](#hotkeys--shortcuts)
- [Advanced Features](#advanced-features)
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
- **Majoor Floating Viewer**: Real-time preview of generations
- **Event-Driven Updates**: Instant grid updates via ComfyUI events

---

## What's New in v2.4.0

### 🎉 Majoor Floating Viewer (MFV) — NEW! 🎯
A lightweight floating viewer panel for real-time generation comparison:
- **Live Stream Mode**: Automatically follows new generations from Save/Load nodes
- **Compare Modes**: Simple, A/B Compare, and Side-by-Side views
- **Real-time Preview**: Watch generations as they complete
- **Node Tracking**: Click on LoadImage/SaveImage nodes to preview their content
- **Pan & Zoom**: Mouse wheel zoom and click-drag pan for detailed inspection
- **Gen Info Overlay**: Display prompt, seed, model, and LoRA for each generation
- **Draggable Panel**: Position anywhere on screen, resizable
- **Keyboard Shortcuts**: Quick mode switching and controls

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

# Restart ComfyUI
```

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
winget install -e --id PhilHarvey.ExifTool
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
| **Left/Right** | Previous/next asset |
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
- Ensure all dependencies are installed: `pip install -r requirements.txt`
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

### Project Structure
```
ComfyUI-Majoor-AssetsManager/
├── __init__.py                 # Extension entry point
├── js/                         # Frontend (Vue.js, vanilla JS)
│   ├── entry.js               # Main entry
│   ├── app/                   # App initialization, settings
│   ├── components/            # UI components
│   ├── features/              # Feature modules
│   ├── api/                   # API client
│   └── vue/                   # Vue.js build artifacts
├── mjr_am_backend/            # Backend (Python)
│   ├── routes/                # API routes
│   ├── features/              # Backend features
│   ├── adapters/              # Database adapters
│   └── shared/                # Shared utilities
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

### Running Tests

#### Backend Tests (pytest)
```bash
# All tests
python -m pytest tests/ -q

# Single test file
python -m pytest tests/core/test_index.py -v

# Single test function
python -m pytest tests/core/test_index.py::test_scan_recursive -v

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

# Quick suite (skips slow tests)
run_tests_quick.bat

# With JUnit XML and HTML reports
tests/run_tests_all.bat
```

Test reports: `tests/__reports__/index.html`

### Code Quality
```bash
# Type checking
mypy mjr_am_backend/

# Linting
flake8 mjr_am_backend/

# Code complexity
radon cc mjr_am_backend/

# Security audit
bandit -r mjr_am_backend/
pip-audit
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `run_tests.bat`
5. Submit a pull request

See [`docs/TESTING.md`](docs/TESTING.md) and [`tests/README.md`](tests/README.md) for detailed testing documentation.

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
- 💬 [Discussions](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/discussions)
- ☕ [Support the Developer](https://ko-fi.com/majoorwaldi)

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

*Last updated: February 28, 2026*  
*Version: 2.4.0*
