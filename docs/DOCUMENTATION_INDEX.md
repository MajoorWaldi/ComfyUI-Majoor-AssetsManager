# Majoor Assets Manager - Documentation Index

Welcome to the documentation hub for **Majoor Assets Manager** for ComfyUI.

**Current Version**: 2.4.5
**Last Updated**: April 14, 2026

## Quick Start

### New users
1. **[Installation Guide](INSTALLATION.md)** - Install and set up the extension
2. **[User Guide (HTML)](../user_guide.html)** - Visual walkthrough with screenshots
3. **[Hotkeys & Shortcuts](HOTKEYS_SHORTCUTS.md)** - Essential keyboard shortcuts
4. **[Basic Search](SEARCH_FILTERING.md)** - Find assets quickly

### Returning users
- **[AI Features Guide](AI_FEATURES.md)** - AI-assisted search and enrichment features
- **[Viewer Feature Tutorial](VIEWER_FEATURE_TUTORIAL.md)** - Floating viewer and analysis tools
- **[Changelog](../CHANGELOG.md)** - Recent releases and fixes
- **[Architecture Map](ARCHITECTURE_MAP.md)** - Backend boundaries and refactor guide

### Privacy And Offline Use
- **[PRIVACY_OFFLINE.md](PRIVACY_OFFLINE.md)** - Dedicated privacy, offline, and token explanation page
- **[AI_FEATURES.md](AI_FEATURES.md)** - Local AI processing, model downloads, offline behavior, and token clarification
- **[SECURITY_ENV_VARS.md](SECURITY_ENV_VARS.md)** - Remote access security, API token behavior, and safe defaults
- **[SETTINGS_CONFIGURATION.md](SETTINGS_CONFIGURATION.md)** - UI security settings and token storage behavior

## Documentation Categories

### Getting Started
| Document | Description |
|----------|-------------|
| **[INSTALLATION.md](INSTALLATION.md)** | Detailed installation and network-drive guidance |
| **[user_guide.html](../user_guide.html)** | Full visual user guide |
| **[HOTKEYS_SHORTCUTS.md](HOTKEYS_SHORTCUTS.md)** | Keyboard shortcuts |
| **[SHORTCUTS.md](SHORTCUTS.md)** | Extra gestures and shortcuts |

### Core Features
| Document | Description |
|----------|-------------|
| **[SEARCH_FILTERING.md](SEARCH_FILTERING.md)** | Full-text search, filters, and sorting |
| **[VIEWER_FEATURE_TUTORIAL.md](VIEWER_FEATURE_TUTORIAL.md)** | Viewer, MFV, and analysis tools |
| **[FLOATING_VIEWER_WORKFLOW_SIDEBAR.md](FLOATING_VIEWER_WORKFLOW_SIDEBAR.md)** | Node Parameters sidebar in Floating Viewer |
| **[RATINGS_TAGS_COLLECTIONS.md](RATINGS_TAGS_COLLECTIONS.md)** | Ratings, tags, and collections |
| **[DRAG_DROP.md](DRAG_DROP.md)** | Drag and drop behavior |
| **[AI_FEATURES.md](AI_FEATURES.md)** | Semantic search, auto-tags, and enrichment |
| **[CUSTOM_NODES.md](CUSTOM_NODES.md)** | MajoorSaveImage & MajoorSaveVideo node reference |

### Plugin System
| Document | Description |
|----------|-------------|
| **[PLUGIN_QUICK_REFERENCE.md](PLUGIN_QUICK_REFERENCE.md)** | Quick start for plugin development |
| **[PLUGIN_SYSTEM_DESIGN.md](PLUGIN_SYSTEM_DESIGN.md)** | Full plugin architecture design |
| **[PLUGIN_SYSTEM_IMPLEMENTATION_SUMMARY.md](PLUGIN_SYSTEM_IMPLEMENTATION_SUMMARY.md)** | Implementation status and details |

### Configuration And Security
| Document | Description |
|----------|-------------|
| **[PRIVACY_OFFLINE.md](PRIVACY_OFFLINE.md)** | Dedicated privacy, offline behavior, and token clarification guide |
| **[SETTINGS_CONFIGURATION.md](SETTINGS_CONFIGURATION.md)** | UI and runtime settings, index DB path, env vars |
| **[SECURITY_ENV_VARS.md](SECURITY_ENV_VARS.md)** | Environment variables and security model |
| **[THREAT_MODEL.md](THREAT_MODEL.md)** | Threats, mitigations, and residual risk |
| **[ARCHITECTURE_MAP.md](ARCHITECTURE_MAP.md)** | Package responsibilities and internal boundaries |

### Maintenance And Development
| Document | Description |
|----------|-------------|
| **[DB_MAINTENANCE.md](DB_MAINTENANCE.md)** | Database maintenance, recovery, and configurable index directory |
| **[TESTING.md](TESTING.md)** | Tests, reports, and quality gate |
| **[API_REFERENCE.md](API_REFERENCE.md)** | Backend endpoint reference |
| **[CONTRIBUTING.md](CONTRIBUTING.md)** | Developer onboarding and contribution guidelines |
| **[adr/](adr/)** | Architecture Decision Records |

### Frontend Architecture
| Document | Description |
|----------|-------------|
| **[FRONTEND_IMPERATIVE_DESIGN.md](FRONTEND_IMPERATIVE_DESIGN.md)** | Design rationale for imperative modules |
| **[FRONTEND_LIFECYCLE_CONVENTIONS.md](FRONTEND_LIFECYCLE_CONVENTIONS.md)** | Component lifecycle conventions |
| **[VUE_MIGRATION_PLAN.md](VUE_MIGRATION_PLAN.md)** | Vue 3 migration plan (archival) |
| **[node-stream-reactivation.md](node-stream-reactivation.md)** | Node Stream feature reactivation guide |

### Historical Documents
| Document | Description |
|----------|-------------|
| **[PLAN_REFACTO_COMPLET_MAJOOR_ASSETS_MANAGER.md](PLAN_REFACTO_COMPLET_MAJOOR_ASSETS_MANAGER.md)** | V1 refactoring completion plan (archival) |
| **[PLAN_REFACTO_V2_LONG_TERME.md](PLAN_REFACTO_V2_LONG_TERME.md)** | V2 long-term refactoring plan (archival) |

## Quality And Verification

Use the canonical gate from the repo root:

```bash
python scripts/run_quality_gate.py
```

Useful variants:

```bash
python scripts/run_quality_gate.py --python-only --skip-tests
tox -e quality
npm run test:js
```

The quality gate enforces:
- UTF-8 text files without BOM
- `ruff` linting on changed Python files during the migration window
- `mypy`
- `bandit`
- `pip-audit`
- xenon/radon complexity checks
- backend tests
- frontend tests
- `npm audit`

## Security Note

The backend keeps a compatibility-first local security model:
- loopback writes remain allowed by default
- remote writes are denied unless explicitly authorized
- `MAJOOR_REQUIRE_AUTH=1` switches to strict token-auth for local writes too

Current releases also support a Settings-first remote setup flow:
- `Recommended Remote LAN Setup` is the preferred one-click LAN path
- the current browser session exposes its state through the runtime `Write auth:` indicator inside Assets Manager

That nuance is intentional and is the documented target behavior for current releases.
