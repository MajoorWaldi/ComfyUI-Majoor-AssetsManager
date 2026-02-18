# Majoor Assets Manager for ComfyUI

[![GitHub Repo](https://img.shields.io/badge/GitHub-Repo-181717?logo=github)](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager)
[![GitHub Stars](https://img.shields.io/github/stars/MajoorWaldi/ComfyUI-Majoor-AssetsManager?style=flat)](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/MajoorWaldi/ComfyUI-Majoor-AssetsManager?style=flat)](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/network/members)
[![GitHub Issues](https://img.shields.io/github/issues/MajoorWaldi/ComfyUI-Majoor-AssetsManager?style=flat)](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/issues)
[![License](https://img.shields.io/github/license/MajoorWaldi/ComfyUI-Majoor-AssetsManager?style=flat)](LICENSE)
[![Downloads](https://img.shields.io/github/downloads/MajoorWaldi/ComfyUI-Majoor-AssetsManager/total?style=flat)](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/releases)
[![CI](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/actions/workflows/python-tests.yml/badge.svg)](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/actions/workflows/python-tests.yml)
[![Buy Me a White Monster Drink](https://img.shields.io/badge/Ko--fi-Buy_Me_a_White_Monster_Drink-ff5e5b?logo=ko-fi)](https://ko-fi.com/majoorwaldi)

Advanced asset browser for ComfyUI: search, filter, preview, organize, and manage generated files directly in the UI.

![Majoor Assets Manager Demo](examples/ComfyUI_Majoor_AssetsManager_Video.gif)

## Quick Start

- Install from **ComfyUI Manager** (recommended), then restart ComfyUI.
- Open the **Assets Manager** tab.
- Pick a scope: **Outputs / Inputs / Custom / Collections**.
- Use search and filters, right-click for actions, double-click to open Viewer.

Useful links:
- User guide: `user_guide.html`
- Changelog: `CHANGELOG.md`
- Documentation index: `docs/DOCUMENTATION_INDEX.md`

## Main Features

- Fast grid browsing (virtual scrolling) for large libraries.
- Full-text search (SQLite FTS5) with filters and sorting.
- Viewer: image/video preview, compare modes, zoom/pan, overlays.
- Ratings and tags.
- Collections management.
- Drag and drop to ComfyUI canvas or OS (multi-select ZIP supported).

## Installation

### Method A: ComfyUI Manager (Recommended)

Install via ComfyUI Manager UI, then restart ComfyUI.

### Method B: Manual

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager ComfyUI-Majoor-AssetsManager
pip install -r ComfyUI-Majoor-AssetsManager/requirements.txt
```

Restart ComfyUI.

If dependencies are still missing:

```bash
python ComfyUI-Majoor-AssetsManager/scripts/install-requirements.py
```

## Optional Tools (Recommended)

For best metadata extraction and media probing:

- `exiftool`
- `ffprobe`

Check availability:

```bash
exiftool -ver
ffprobe -version
```

If not in PATH, configure tool paths with environment variables (see `docs/`).

## Basic Usage

- Search by filename/metadata.
- Filter by type, rating, workflow, date.
- Right-click asset for rename, delete, open folder, copy path, collections.
- Use Collections to save and reopen grouped selections.

## Hotkeys (Essential)

- `Ctrl/Cmd+S`: trigger index scan (current scope).
- `D`: toggle details sidebar.
- `0`-`5`: set rating.
- In Viewer: `Esc` closes viewer.

## Troubleshooting

### Database issues

If index DB is corrupted:

- Use endpoint: `POST /mjr/am/db/force-delete`
- Then re-scan.

Manual fallback (ComfyUI stopped):
- Delete `assets.sqlite`, `assets.sqlite-wal`, `assets.sqlite-shm`
- Location: `<output>/_mjr_index/`
- Restart ComfyUI and scan again.

## Data Locations

- Index DB: `<output>/_mjr_index/assets.sqlite`
- Custom roots: `<output>/_mjr_index/custom_roots.json`
- Collections: `<output>/_mjr_index/collections/*.json`
- Temp drag-out ZIPs: `<output>/_mjr_batch_zips/`

## Compatibility

- Recommended ComfyUI baseline: `0.13.0+`
- Python: `3.10` to `3.12`

## License

Copyright (c) 2026 Ewald ALOEBOETOE (MajoorWaldi).

Licensed under **GNU GPL v3.0** (`LICENSE`).
Optional attribution request: `NOTICE`.

## For Advanced / Dev Docs

For API, environment variables, security model, architecture, CI, and development workflows:

- `docs/DOCUMENTATION_INDEX.md`
