# 📂 Majoor Assets Manager for ComfyUI

**A fast, modern asset browser for ComfyUI outputs with native OS metadata.**

Majoor Assets Manager is a UI extension (no custom nodes) to browse, inspect, and organize images, videos, audio, and 3D exports without leaving ComfyUI. It runs asynchronously and writes ratings/tags directly to your files' Windows properties (with ExifTool/JSON sidecar fallback), so your organization survives outside of ComfyUI.

---

## Prerequisites / System Requirements

- **ExifTool required for video metadata (MP4/MOV/M4V/WEBM/MKV):** Without ExifTool, video workflows/prompts fall back to a degraded raw scan and some embedded metadata may be missed. PNG parsing still works, but install ExifTool for best results.
- **Windows:** Download from exiftool.org and ensure `exiftool.exe` is on your PATH.
- **macOS:** `brew install exiftool`
- **Linux (Debian/Ubuntu):** `sudo apt install libimage-exiftool-perl`
- ffprobe is used when available; timeouts are configurable via `MJR_META_FFPROBE_TIMEOUT` and `MJR_META_EXIFTOOL_TIMEOUT`.

---

## ✨ Key Features

- ⚡ **Async, cached scans:** Non-blocking backend, virtualized grid, lazy metadata fetch, auto-refresh, and queue listener so new renders pop in instantly.
- 🏷️ **Native ratings & tags:** Edit 1–5★ ratings and tags that sync to Windows Explorer; ExifTool or JSON sidecars on Linux/Mac; badges on cards and in the viewer.
- 🔎 **Prompt/workflow inspector:** View prompts, seed, sampler, CFG, checkpoint, LoRAs, and parsed workflow. Video parsing scans common comment/description/parameters tags via ffprobe/ExifTool and reconstructs a workflow from a prompt graph when needed. Sibling PNG fallback is used if video metadata is empty. Copy any field; drop sibling PNGs onto the graph to reload the workflow.
- 🧭 **Filters, search, collections:** Search bar, type filter (image/video/audio/3D), min rating, tag filter, smart views (Today, Yesterday, Last 7 Days, 4★+/5★, Videos, Images), and custom collections stored in `_mjr_collections`.
- 🖼️ **Viewer + A/B compare:** Lightbox viewer with filmstrip nav, zoom/pan, video/audio playback, rating HUD + hotkeys, and side-by-side slider compare for two selected files.
- 🗂️ **Sibling-aware actions:** Detects PNG companions for videos/audio/3D to reuse metadata; drag video cards to load workflows on the canvas; open in Explorer, delete/send to trash, and add to collections from the context menu.
- 🎹 **Productivity hotkeys:** `1`–`5` to rate, `0` to clear, `Enter` to open viewer, optional frame-step for videos, Tab to jump to the sidebar, and drag/drop helpers for workflows.

---

## 📥 Installation

### Method 1: Via ComfyUI Manager (Recommended)
1. Open **ComfyUI Manager**.
2. Search for **"Majoor Assets Manager"** or choose **Install via Git URL**.
3. Paste this repository URL (the URL of this repo).
4. Click **Install** and restart ComfyUI.

### Method 2: Manual Installation
1. Navigate to your ComfyUI `custom_nodes` folder:
   ```bash
   cd ComfyUI/custom_nodes
   ```
2. Clone the repository:
   ```bash
   git clone <this-repo-url> ComfyUI-Majoor-AssetsManager
   ```
3. Install Python requirements:
   ```bash
   pip install -r ComfyUI-Majoor-AssetsManager/requirements.txt
   ```
4. Restart ComfyUI.

---

## ℹ️ Notes
- Windows uses native shell metadata; Linux/Mac fall back to ExifTool or JSON sidecars (`.mjr.json` and `_mjr_collections` live in your output folder).
- Drag & drop: video card drags carry a workflow payload plus path/URL; drop onto the graph canvas loads the workflow; native ComfyUI drops from the OS remain intact.
- No custom nodes are added; the manager runs entirely in the UI and the REST API under `/mjr/filemanager/*`.
