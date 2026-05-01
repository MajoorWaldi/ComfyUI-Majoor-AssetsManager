# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### 🚀 Performance
- **Grid Performance Improvements**: Improved grid responsiveness, scrolling stability, and asset loading behavior for large libraries.

### 🎉 Major Features — Majoor Floating Viewer
- **MFV is now an advanced viewer**: The Floating Viewer is no longer a light viewer only; it now provides a richer workflow surface for inspecting, comparing, and controlling generation assets.
- **Node Stream**: Follow selected node previews directly inside the Floating Viewer, including supported live preview sources.
- **Node Parameters**: Open the workflow node sidebar from the viewer and inspect node parameters without leaving the MFV.
- **Edit Nodes from the Viewer**: Edit node widgets directly inside the Floating Viewer, including prompts and common workflow parameters.

### 🧰 Toolbox
- **New Toolbox Tools**: Added new tools to the toolbox for faster access to common asset and workflow operations.

### 🔧 Code Quality & Fixes
- **Code Corrections**: Applied code corrections and cleanup across the frontend/backend integration surface for better maintainability.

---

## [2.4.6] - 2026-04-20

### 🐛 Bug Fixes & Performance
- **Bug Fixes**: Various bug fixes
- **Performance and Fluidity**: Performance and fluidity improvements

### ✨ Improved
- **Concatenate Support**: Improved concatenate support for default and custom nodes — by Forsion07

### 🔌 API & Integrations
- **Api Node Helpers**: Add support helpers for Api Node
- **Ernie Image Helper**: Add support helper for Ernie Image

### ⚙️ Settings & Defaults
- **Live Stream disabled by default**: MFV Live Stream (green button) is now OFF by default; can be re-enabled permanently via Settings → Majoor Assets Manager › Viewer
- **Live Stream & KSampler Preview configurable by default**: Both toggles can be set as the default state via Settings → Viewer; when Live Stream is active, clicking a Load Image node or a generation end automatically opens the Floating Viewer

---

## [2.4.5] - 2026-04-10

### 🎉 New Features — Floating Viewer
- **Multi-Pin References (A/B/C/D)**: Pin up to 4 images simultaneously with toggle buttons; pinned slots hold their content while unpinned slots follow Live Stream
- **Node Parameters Sidebar**: View and edit workflow node widgets (prompts, seeds, samplers) directly inside the Floating Viewer
- **Run Button in Viewer**: Queue prompt from the viewer toolbar without switching back to the canvas
- **Expandable Text Areas**: Collapse/expand long text inputs with a toggle button
- **Sidebar Position Setting**: Choose right, left, or bottom placement for the Node Parameters sidebar via Settings; applies immediately without reload
- **Toolbar Layout**: Run and Node Parameters buttons placed at far right for ergonomic access
- **Topbar MFV Button**: New Viewer toggle button in the ComfyUI top action bar — open or close the Floating Viewer without opening the sidebar; highlights when the viewer is active

### 🎉 New Features — Custom Nodes
- **Majoor Save Image 💾**: Drop-in replacement for the built-in SaveImage node that persists `generation_time_ms` in PNG text chunks alongside prompt and workflow metadata; supports auto-detection of generation time from the prompt lifecycle
- **Majoor Save Video 🎬**: Save IMAGE batches or VIDEO inputs as MP4 (h264 via PyAV), GIF, or WebP; embeds `generation_time_ms`, prompt, and workflow directly in the MP4 container metadata; optional PNG sidecar for first frame; supports audio muxing and configurable CRF quality
- **Generation Time Extraction**: The metadata extraction pipeline now reads `generation_time_ms` from PNG text chunks and MP4 container format tags, so the value survives index resets and re-indexing

### ✨ Improved
- **MFV Gen Info Overlay Placement**: Keep Gen Info as the original overlay and automatically place it above the inline player controls when the player is visible
- **MFV Simple Player Keyboard Controls**: Support focused playback shortcuts with Space for play/pause and Left/Right for frame-by-frame stepping

### 🐛 Bug Fixes & Issue Resolutions
- **Realtime Vector Indexing**: Fixed newly generated assets not always entering automatic vector indexing after save/index events
- **Grid Reload Stability**: Fixed unnecessary full refreshes and parasitic reloads triggered by ambiguous settings sync and window events
- **Pagination Freeze at Bottom**: Fixed cases where scrolling could stall when a page returned results that were fully deduplicated or hidden
- **MFV Video Overlay Overlap**: Fixed Gen Info overlapping inline video player controls in simple player mode
- **GenInfo Pipeline Accuracy**: Fixed sampler pass deduping and rgthree Any Switch tracing so multi-pass workflow metadata stays in the correct order

---

## [2.4.4] - 2026-04-05

### ✨ Improved
- Refactor frontend in Vue to match ComfyUI frontend evolution

### 📚 Documentation
- Sync documentation with the current repository layout and commands
- Update published documentation and user guide to version 2.4.4
- Refresh plugin compatibility examples and reference material

---

## [2.4.3] - 2026-03-29

### ✨ Improved
- Improve assets metadata parsing
- Add Grid Compare capability in floating viewer up to 4 Assets
- Add ping pong loop in main Viewer player
- Add job id and stack id in DB for better assets management
- Stack assets generated from same workflow job with same job ID
- Code refactor for maintainability
- Various bug fixes
- Add generated feed feature
- Add lite version of grid in bottom tab

---

## [2.4.2] - 2026-03-17

### 🎉 Major Features

#### 3D Model Viewing Support
- **Basic 3D Model Thumbnail Rendering** — Implemented 3D model thumbnail rendering with fallback icon support
- **Viewer Mode Selection** — Updated viewer logic to handle 3D model assets
- **3D Model Interactions** — Added checks for 3D model interactions in the viewer
- **Drag & Drop Extension** — Extended drag & drop support to include 3D model assets

#### Toast History Tab
- **History Tab Implementation** — Added new history tab to message popover alongside messages and shortcuts
- **Recent Toast Notifications** — Display recent toast notifications in the history panel
- **Clear History** — Included clear button to remove toast history
- **Unread Indicator** — Added unread indicator to history tab when there are new entries
- **Layout Updates** — Updated message popover layout and styling to accommodate new tab

#### Enhanced Floating Viewer
- **Document Picture-in-Picture** — Implemented PiP for always-on-top secondary monitor support
- **Pop-out Functionality** — Enhanced with fallback to `window.open()` for compatibility
- **Transitions & Interactions** — Refined pop-in/out transitions and user interface interactions
- **Media Loading** — Optimized media loading and error handling for various scenarios
- **Keyboard Shortcuts** — Improved keyboard shortcut integration and behavior
- **CSS Animations** — Updated animations and z-index hierarchy for better visual presentation
- **Backend Logging** — Enhanced logging for request handling

### 🐛 Bug Fixes & Resilience

#### Stability Improvements
- **Card.js Timeout Leak** — Fixed potential timeout leak in Card.js
- **AssetsManagerPanel Reload** — Enhanced reload logic for better stability
- **FloatingViewer Drag** — Optimized drag interactions
- **Plugin Loader** — Refined plugin loader and manager for hot-reload safety
- **Registry Configuration** — Improved configuration handling
- **File Existence Checks** — Removed redundant file existence checks in assets_impl
- **Asset Renaming** — Implemented rate limiting for asset renaming

---

## [2.4.1] - 2026-03-09

### ✨ Added
- Added CLIP-based semantic search engine with AI toggle, prompt alignment scoring in GenInfo panel, smart collection suggestions, and auto-tagging pipeline
- Added support for rgthree and easy use custom node parsing
- Added shortcut guide tab to message popover in panel
- Added linked model entry function for upscaler model extraction

### 🐛 Fixed
- Fixed download form viewers issues
- Fixed workflow filter bugs
- Fixed MFV memory leaks and hot-reload listener accumulation
- Fixed SQL placeholder count unbounded in generation-time batch query (capped at 500)
- Fixed numpy array dtype consistency (float32) in vector operations

### 🚀 Improved
- Enhanced compare overlay functionality
- Improved text search performance and accuracy
- Enhanced geninfo extraction for upscalers and samplers
- Enhanced tag handling and agenda calendar functionality
- Refactored upscaler model extraction logic

### 📚 Documentation
- Added comprehensive AI features guide and new documentation

## [2.4.0] - 2026-02-28

### 🎉 Major Features

#### Majoor Floating Viewer (MFV) — NEW! 🎯
A lightweight floating viewer panel for real-time generation comparison:
- **Live Stream Mode** — Automatically follows new generations from Save/Load nodes
- **Compare Modes** — Simple, A/B Compare, and Side-by-Side views
- **Real-time Preview** — Watch generations as they complete
- **Node Tracking** — Click on LoadImage/SaveImage nodes to preview their content
- **Pan & Zoom** — Mouse wheel zoom and click-drag pan for detailed inspection
- **Gen Info Overlay** — Display prompt, seed, model, and LoRA for each generation
- **Draggable Panel** — Position anywhere on screen, resizable
- **Keyboard Shortcuts** — Quick mode switching and controls

### 🔧 Refactoring & Code Quality

#### Major Code Refactoring
- **Inline Styles → CSS Classes** — Moved all static inline styles to theme-comfy.css
- **Component Separation** — Better modularization of viewer components
- **Improved Error Handling** — Added proper error logging and user feedback
- **Code Cleanup** — Removed dead code, improved naming, added documentation
- **Performance Optimization** — Reduced redundant parsing, improved caching

### 🐛 Bug Fixes

#### Critical Fixes
- **CSS File Corruption** — Fixed null character corruption in theme-comfy.css
- **Gen Info Display** — Fixed field extraction and HTML escaping
- **Memory Leaks** — Fixed event listener cleanup in viewer components
- **Race Conditions** — Fixed async hydration in Floating Viewer
- **Duplicate CSS Rules** — Removed duplicate fullscreen rules

#### General Stability
- Multiple bug fixes across indexing and metadata parsing
- Fixed viewer overlay lifecycle management
- Fixed dropdown positioning and event handling
- Fixed cache invalidation issues

### 🐧 Linux Support

#### Cross-Platform Compatibility
- **Full Linux Support** — Tested on Ubuntu 22.04+, Fedora, Debian
- **Path Handling** — Fixed Windows-style path separators for Linux
- **File Permissions** — Proper handling of Linux file permissions
- **Case Sensitivity** — Fixed case-sensitive file system issues
- **Dependencies** — Updated requirements.txt for Linux compatibility

### 🧪 Test Coverage

#### New Test Suites
- **Unit Tests** — Added tests for geninfo parser, metadata extraction
- **Integration Tests** — Viewer component testing
- **Frontend Tests** — Vitest configuration for JavaScript testing
- **Backend Tests** — pytest for Python backend services
- **CI/CD** — GitHub Actions workflows for automated testing

#### Test Files Added
- `tests/parser/test_geninfo_flux.py` — GenInfo parser tests
- `tests/features/test_sampler_tracer_extra.py` — Sampler tracer tests
- `tests/features/test_role_classifier.py` — Role classifier tests
- `tests/metadata/test_extractors_helpers.py` — Metadata extractor tests
- `tests/database/test_schema_heal.py` — Database schema tests
- `vitest.config.mjs` — Frontend test configuration

### ⚙️ Technical Changes

#### Dependencies
- Added Vitest for frontend testing
- Updated mypy configuration for better type checking
- Added pre-commit hooks for code quality

#### Architecture
- Separated viewer concerns (FloatingViewer, floatingViewerManager, LiveStreamTracker)
- Improved metadata pipeline (genInfo.js hydration)
- Better event-driven architecture for viewer lifecycle

---

## [2.3.3] - 2026-02-13
### Added / Improved
- Enhanced metadata extraction for the AC-Step (Ace Step) custom node.
- Drag & Drop: stage dropped audio files to the node input (audio file staging).
- Added new filtering/sorting capabilities:
  - Filter by workflow type (I2I, I2V, T2I, T2V, V2V, FLF, UPSCL, INPT, TTS, A2A).
  - Filter by file size (weight).
  - Filter by image resolution/size.
- Added a settings option to configure the output path directly from the UI.
- Added grid settings to configure video preview behavior.
- Refactored frontend/backend integration paths for better ComfyUI compatibility.
### Fixed
- Fixed drag & drop issues for images and videos.
- Enhanced index status functionality and various bug fixes.
- Fixed multiple UI/filtering issues and improved overall stability.

---

## [2.3.2] - 2026-02-09
### Added / Improved
- Added language support for Chinese, Korean, Russian, Hindi, Spanish, French, and English. 🌍
- Added audio support for workflows such as AC-STEP, Stable Audio, and TTS. 🎵
- Improved metadata extraction. 🧠
- Improved UI design. 🎨
- Added database management. 🗄️

### Fixed
- Fixed multiple bugs across the extension. 🐛

---

## [2.3.1] - 2026-02-07
### Added / Improved
- UI parameters for **API token** and remote access: added settings in the UI to configure an API token and enable remote access to the Assets Manager (secure-by-default). 🔐

### Notes
- This is a non-breaking, minor patch focused on remote access configuration and UI exposure of token settings.

---

## [2.3.0] - 2026-02-07
### Added / Improved
- Improved GenInfo display in the Viewer: side-by-side generation info panel and clearer parameter presentation. 🔧
- Improved metadata parsing for complex workflows (better handling for nested/custom node graphs). 🧩
- Viewer enhancements: side-by-side generation info and better workflow minimap rendering. 👀
- Added "Reset Index" action to re-scan and rebuild the index. ✅
- Configurable settings for card display and grid layout (card size, density, details). ⚙️

### Fixed
- Multiple bug fixes across indexing, metadata parsing, and viewer interactions. 🐛

---

For previous history, see earlier tags/releases on GitHub.
