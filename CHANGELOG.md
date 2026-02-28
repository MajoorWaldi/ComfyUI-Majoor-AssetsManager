# Changelog

All notable changes to this project are documented in this file.

## [Unreleased] - 2026-02-28

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
