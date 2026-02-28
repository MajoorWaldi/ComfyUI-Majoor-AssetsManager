# Majoor Assets Manager - Documentation Index

Welcome to the comprehensive documentation for the **Majoor Assets Manager** for ComfyUI. This collection of guides covers all features, from basic usage to advanced configuration and development.

**Current Version**: 2.3.3  
**Last Updated**: February 28, 2026

---

## 🚀 Quick Start

### New Users
1. **[Installation Guide](INSTALLATION.md)** — Install and set up the extension
2. **[User Guide (HTML)](../user_guide.html)** — Visual walkthrough with screenshots
3. **[Hotkeys & Shortcuts](HOTKEYS_SHORTCUTS.md)** — Essential keyboard shortcuts
4. **[Basic Search](SEARCH_FILTERING.md)** — Find your assets quickly

### Returning Users (v2.3.3)
- **[Majoor Floating Viewer](VIEWER_FEATURE_TUTORIAL.md#majoor-floating-viewer-mfv)** — NEW real-time preview panel
- **[Changelog](../CHANGELOG.md)** — What's new in this version
- **[Linux Support](INSTALLATION.md#linux-installation)** — Now fully supported on Linux

---

## 📚 Documentation Categories

### Getting Started
| Document | Description |
|----------|-------------|
| **[INSTALLATION.md](INSTALLATION.md)** | Detailed installation instructions (Manager + Manual) |
| **[USER_GUIDE.md](../user_guide.html)** | Full HTML user guide with visual examples |
| **[HOTKEYS_SHORTCUTS.md](HOTKEYS_SHORTCUTS.md)** | Keyboard shortcuts and hotkeys reference |
| **[SHORTCUTS.md](SHORTCUTS.md)** | Additional shortcuts and gestures |

### Core Features
| Document | Description |
|----------|-------------|
| **[SEARCH_FILTERING.md](SEARCH_FILTERING.md)** | Full-text search, filters, and sorting |
| **[VIEWER_FEATURE_TUTORIAL.md](VIEWER_FEATURE_TUTORIAL.md)** | Advanced viewer, MFV, and analysis tools |
| **[RATINGS_TAGS_COLLECTIONS.md](RATINGS_TAGS_COLLECTIONS.md)** | Organization with ratings, tags, and collections |
| **[DRAG_DROP.md](DRAG_DROP.md)** | Drag & drop to canvas and OS |

### Configuration & Settings
| Document | Description |
|----------|-------------|
| **[SETTINGS_CONFIGURATION.md](SETTINGS_CONFIGURATION.md)** | Browser settings and UI configuration |
| **[SECURITY_ENV_VARS.md](SECURITY_ENV_VARS.md)** | Environment variables and security model |
| **[SECURITY_ENV_VARS.md#api-security](SECURITY_ENV_VARS.md#api-security)** | API token and remote access setup |

### Maintenance & Troubleshooting
| Document | Description |
|----------|-------------|
| **[DB_MAINTENANCE.md](DB_MAINTENANCE.md)** | Database maintenance, corruption recovery |
| **[TESTING.md](TESTING.md)** | Running tests and reading reports |
| **[INSTALLATION.md#troubleshooting](INSTALLATION.md#troubleshooting)** | Common installation issues |

### Advanced Documentation
| Document | Description |
|----------|-------------|
| **[API_REFERENCE.md](API_REFERENCE.md)** | Complete API endpoint reference |
| **[THREAT_MODEL.md](THREAT_MODEL.md)** | Security architecture and threat analysis |
| **[ADR/](adr/)** | Architecture Decision Records |

---

## 🎯 Feature-Specific Guides

### Majoor Floating Viewer (MFV) — NEW! 🎉
**[VIEWER_FEATURE_TUTORIAL.md](VIEWER_FEATURE_TUTORIAL.md)** — Complete guide to the floating viewer:
- Live Stream Mode for real-time generation tracking
- Compare modes (Simple, A/B, Side-by-Side)
- Node tracking for LoadImage/SaveImage preview
- Pan, zoom, and gen info overlay
- Keyboard shortcuts and controls

### Asset Browser
**[SEARCH_FILTERING.md](SEARCH_FILTERING.md)** — Browse and filter your assets:
- Full-text search with FTS5 and BM25 ranking
- Kind filter (image, video, audio, model3d)
- Rating, workflow, and date filters
- Inline attribute filters (`rating:5`, `ext:png`)
- Sort options and pagination

### Viewer & Analysis Tools
**[VIEWER_FEATURE_TUTORIAL.md](VIEWER_FEATURE_TUTORIAL.md)** — Advanced viewing and analysis:
- Image enhancement (exposure, gamma, channel isolation)
- Analysis tools (false color, zebra, histogram, waveform, vectorscope)
- Visual overlays (grid, pixel probe, loupe)
- Video playback controls and in/out points
- Export capabilities (save frame, copy to clipboard)

### Organization System
**[RATINGS_TAGS_COLLECTIONS.md](RATINGS_TAGS_COLLECTIONS.md)** — Organize your assets:
- 5-star rating system with Windows sync
- Custom hierarchical tags
- Collections for grouping assets
- Bulk operations and synchronization

### Drag & Drop
**[DRAG_DROP.md](DRAG_DROP.md)** — Drag and drop functionality:
- Drag to ComfyUI canvas (single/multiple)
- Drag to OS (auto-ZIP for multi-select)
- Node compatibility and staging
- File transfer mechanisms

---

## 🔧 Configuration Guides

### Browser Settings (localStorage)
**[SETTINGS_CONFIGURATION.md](SETTINGS_CONFIGURATION.md)** — UI and performance settings:
- Page size and sidebar position
- Auto-scan and poll intervals
- Hide PNG siblings option
- Tags cache TTL

### Environment Variables (Backend)
**[SECURITY_ENV_VARS.md](SECURITY_ENV_VARS.md)** — Server-side configuration:

#### Directory & Tools
```bash
MAJOOR_OUTPUT_DIRECTORY="/path/to/output"
MAJOOR_EXIFTOOL_PATH="/path/to/exiftool"
MAJOOR_FFPROBE_PATH="/path/to/ffprobe"
MAJOOR_MEDIA_PROBE_BACKEND="auto"
```

#### Database Tuning
```bash
MAJOOR_DB_TIMEOUT=60.0
MAJOOR_DB_MAX_CONNECTIONS=12
MAJOOR_DB_QUERY_TIMEOUT=45.0
```

#### Security & API
```bash
MAJOOR_API_TOKEN="your-secret-token"
MAJOOR_REQUIRE_AUTH=1
MAJOOR_TRUSTED_PROXIES=127.0.0.1,192.168.1.0/24
MAJOOR_ALLOW_REMOTE_WRITE=1  # ⚠️ Unsafe
```

#### Safe Mode Operations
```bash
MAJOOR_SAFE_MODE=0
MAJOOR_ALLOW_DELETE=1
MAJOOR_ALLOW_RENAME=1
```

---

## 🗄️ Database & Maintenance

### Index Database
**[DB_MAINTENANCE.md](DB_MAINTENANCE.md)** — Database management:
- Location: `<output>/_mjr_index/assets.sqlite`
- Reset Index button (requires readable DB)
- Delete DB button (works on corrupted DB)
- Optimize endpoint (`PRAGMA optimize`)

### Corruption Recovery
**[DB_MAINTENANCE.md#delete-db-emergency-recovery](DB_MAINTENANCE.md#delete-db-emergency-recovery)**:
1. Click **Delete DB** button in UI
2. Or manually delete SQLite files
3. Restart ComfyUI for rebuild

### Data Locations
| Data Type | Location |
|-----------|----------|
| Index DB | `<output>/_mjr_index/assets.sqlite` |
| Custom Roots | `<output>/_mjr_index/custom_roots.json` |
| Collections | `<output>/_mjr_index/collections/*.json` |
| Batch ZIPs | `<output>/_mjr_batch_zips/` |

---

## 🔒 Security Documentation

### Security Model
**[SECURITY_ENV_VARS.md](SECURITY_ENV_VARS.md)** — Comprehensive security guide:
- Authentication & authorization
- CSRF protection and origin validation
- Rate limiting on expensive endpoints
- Path containment and traversal prevention
- File operation security

### Threat Model
**[THREAT_MODEL.md](THREAT_MODEL.md)** — Security architecture:
- Identified threats and mitigations
- Attack vectors and protections
- Security monitoring and logging
- Incident response procedures

### API Security
**[SECURITY_ENV_VARS.md#api-security](SECURITY_ENV_VARS.md#api-security)**:
- Token-based authentication
- Safe Mode for write operations
- Remote access configuration
- Trusted proxy support

---

## 🧪 Testing & Development

### Running Tests
**[TESTING.md](TESTING.md)** — Test suite documentation:

#### Backend (pytest)
```bash
# All tests
python -m pytest tests/ -q

# Single file
python -m pytest tests/core/test_index.py -v

# With coverage
pytest tests/ --cov=mjr_am_backend --cov-report=html
```

#### Frontend (Vitest)
```bash
npm run test:js
npm run test:js:watch
```

#### Windows Batch Runners
```bat
run_tests.bat          # Full suite
run_tests_quick.bat    # Quick suite (skips slow tests)
```

### Test Reports
- Location: `tests/__reports__/index.html`
- Formats: JUnit XML + HTML report

### Test Categories
**[tests/README.md](../tests/README.md)** — Test structure:
- `core/` — Core functionality (index, search, routes)
- `metadata/` — Metadata extraction (ExifTool, FFprobe, geninfo)
- `features/` — Feature tests (collections, batch ZIP, viewer)
- `database/` — Database schema and migrations
- `security/` — Security and configuration tests
- `regressions/` — Regression tests for bug fixes

### Code Quality
```bash
mypy mjr_am_backend/           # Type checking
flake8 mjr_am_backend/         # Linting
radon cc mjr_am_backend/       # Complexity
bandit -r mjr_am_backend/      # Security audit
pip-audit                      # Dependency audit
```

---

## 📖 API Reference

**[API_REFERENCE.md](API_REFERENCE.md)** — Complete API documentation:

### Core Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/mjr/am/health` | Health summary |
| `GET` | `/mjr/am/health/counters` | Indexed counters |
| `GET` | `/mjr/am/health/db` | DB diagnostics |
| `GET` | `/mjr/am/config` | Runtime config |
| `GET` | `/mjr/am/version` | Version info |
| `GET` | `/mjr/am/tools/status` | Tool availability |

### Search & Assets
| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/mjr/am/search` | Search with filters |
| `GET` | `/mjr/am/asset/{id}` | Asset details |
| `POST` | `/mjr/am/scan` | Scan scope/root |
| `POST` | `/mjr/am/index/reset` | Reset index |
| `POST` | `/mjr/am/assets/delete` | Bulk delete |

### Operations
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/mjr/am/asset/rating` | Update rating |
| `POST` | `/mjr/am/asset/tags` | Update tags |
| `POST` | `/mjr/am/asset/rename` | Rename file |
| `POST` | `/mjr/am/open-in-folder` | Open location |
| `POST` | `/mjr/am/stage-to-input` | Stage to input |

### Collections & Custom
| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/mjr/am/collections` | List collections |
| `POST` | `/mjr/am/collections/*` | Manage collections |
| `GET` | `/mjr/am/custom-roots` | List custom roots |
| `POST` | `/mjr/am/custom-roots` | Manage custom roots |

### Utilities
| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/mjr/am/download` | Download asset |
| `POST` | `/mjr/am/batch-zip` | Create batch ZIP |
| `GET` | `/mjr/am/date-histogram` | Calendar histogram |
| `POST` | `/mjr/am/db/optimize` | Optimize DB |
| `POST` | `/mjr/am/db/force-delete` | Force-delete DB |

---

## 🎯 Workflow-Specific Guides

### Modern Workflow Support
The metadata parser now understands:
- **Flux** (Advanced/GGUF variants)
- **WanVideo/Kijai** workflows
- **HunyuanVideo/Kijai** workflows
- **Qwen** (Edit workflows)
- **Marigold** (Depth estimation)
- **AC-Step** (Ace Step custom node)
- **Stable Audio** and TTS workflows

### Video & Audio
- Video metadata extraction via FFprobe
- Audio file staging for TTS workflows
- Timeline controls and in/out points
- Frame extraction and export

---

## 🌍 Internationalization

Supported languages (UI):
- 🇺🇸 English
- 🇨🇳 Chinese
- 🇰🇷 Korean
- 🇷🇺 Russian
- 🇮🇳 Hindi
- 🇪🇸 Spanish
- 🇫🇷 French

Language selection via ComfyUI settings.

---

## 🐛 Troubleshooting Quick Reference

### Common Issues

| Issue | Solution | Reference |
|-------|----------|-----------|
| Extension not appearing | Check console, reinstall dependencies | [INSTALLATION.md](INSTALLATION.md#troubleshooting) |
| Database corrupted | Use Delete DB button | [DB_MAINTENANCE.md](DB_MAINTENANCE.md) |
| External tools not found | Install ExifTool/FFprobe | [INSTALLATION.md](INSTALLATION.md#optional-dependencies) |
| Slow performance | Reduce page size, exclude large dirs | [SEARCH_FILTERING.md](SEARCH_FILTERING.md#performance) |
| Search not working | Trigger scan (Ctrl+S) | [SEARCH_FILTERING.md](SEARCH_FILTERING.md#troubleshooting) |
| Drag & drop fails | Check browser support | [DRAG_DROP.md](DRAG_DROP.md#troubleshooting) |
| API access denied | Configure API token | [SECURITY_ENV_VARS.md](SECURITY_ENV_VARS.md#api-security) |

### Diagnostic Commands
```bash
# Verify tools
exiftool -ver
ffprobe -version

# Check dependencies
pip list | grep -E "aiohttp|aiosqlite|pillow"

# Run tests
python -m pytest tests/ -q
```

---

## 📦 Compatibility

### System Requirements
- **ComfyUI**: ≥ 0.13.0
- **Python**: 3.10, 3.11, 3.12 (3.13 compatible)
- **Operating Systems**:
  - Windows 10/11
  - macOS 10.15+
  - Linux (Ubuntu 22.04+, Fedora, Debian)
- **Browsers**: Modern browsers with ES2020+ support

### Optional Dependencies
- **ExifTool**: Metadata extraction (images, documents)
- **FFprobe**: Video/audio metadata extraction
- **tkinter**: Native folder browser (included in standard Python)

---

## 🔗 External Resources

### Official Links
- **GitHub Repository**: [Majoor Assets Manager](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager)
- **ComfyUI Manager**: [Extension Listing](https://github.com/ltdrdata/ComfyUI-Manager)
- **Issue Tracker**: [Report Bugs](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/issues)
- **Discussions**: [Community Forum](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/discussions)

### Support the Developer
- **Ko-fi**: [Buy a White Monster Drink](https://ko-fi.com/majoorwaldi)

### ComfyUI Ecosystem
- **ComfyUI**: [Official Repository](https://github.com/comfyanonymous/ComfyUI)
- **ComfyUI Manager**: [Manager Repository](https://github.com/ltdrdata/ComfyUI-Manager)
- **ComfyUI Custom Nodes**: [Node Directory](https://comfyworkflows.com/)

---

## 📝 Documentation Maintenance

### Updating Documentation
When adding new features or changing behavior:
1. Update relevant feature guides
2. Update API reference if endpoints change
3. Update changelog with version and date
4. Update this index if new documents are added
5. Cross-reference between documents

### Documentation Standards
- Use clear, concise language
- Include code examples where applicable
- Provide troubleshooting sections
- Link to related documents
- Keep version information current

---

## 📋 Checklist for Users

### First-Time Setup
- [ ] Install extension via ComfyUI Manager
- [ ] Install ExifTool and FFprobe (optional but recommended)
- [ ] Restart ComfyUI
- [ ] Open Assets Manager tab
- [ ] Trigger initial scan (Ctrl+S)
- [ ] Browse outputs and test search

### Power User Setup
- [ ] Configure environment variables for tuning
- [ ] Set up API token for remote access
- [ ] Create custom roots for additional directories
- [ ] Set up ratings and tags system
- [ ] Create collections for frequently used assets
- [ ] Learn keyboard shortcuts for efficiency

### Development Setup
- [ ] Clone repository to custom_nodes
- [ ] Install dev dependencies (`pip install -r requirements.txt`)
- [ ] Run test suite (`run_tests.bat`)
- [ ] Review architecture decision records (ADR)
- [ ] Set up pre-commit hooks

---

*Documentation Index Version: 2.0*  
*Last Updated: February 28, 2026*  
*Maintained by: MajoorWaldi*
