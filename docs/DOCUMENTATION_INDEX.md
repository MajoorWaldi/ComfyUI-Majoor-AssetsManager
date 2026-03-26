# Majoor Assets Manager - Documentation Index

Welcome to the documentation hub for **Majoor Assets Manager** for ComfyUI.

**Current Version**: 2.4.2  
**Last Updated**: March 25, 2026

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

## Documentation Categories

### Getting Started
| Document | Description |
|----------|-------------|
| **[INSTALLATION.md](INSTALLATION.md)** | Detailed installation instructions |
| **[user_guide.html](../user_guide.html)** | Full visual user guide |
| **[HOTKEYS_SHORTCUTS.md](HOTKEYS_SHORTCUTS.md)** | Keyboard shortcuts |
| **[SHORTCUTS.md](SHORTCUTS.md)** | Extra gestures and shortcuts |

### Core Features
| Document | Description |
|----------|-------------|
| **[SEARCH_FILTERING.md](SEARCH_FILTERING.md)** | Full-text search, filters, and sorting |
| **[VIEWER_FEATURE_TUTORIAL.md](VIEWER_FEATURE_TUTORIAL.md)** | Viewer, MFV, and analysis tools |
| **[RATINGS_TAGS_COLLECTIONS.md](RATINGS_TAGS_COLLECTIONS.md)** | Ratings, tags, and collections |
| **[DRAG_DROP.md](DRAG_DROP.md)** | Drag and drop behavior |
| **[AI_FEATURES.md](AI_FEATURES.md)** | Semantic search, auto-tags, and enrichment |

### Configuration And Security
| Document | Description |
|----------|-------------|
| **[SETTINGS_CONFIGURATION.md](SETTINGS_CONFIGURATION.md)** | UI and runtime settings |
| **[SECURITY_ENV_VARS.md](SECURITY_ENV_VARS.md)** | Environment variables and security model |
| **[THREAT_MODEL.md](THREAT_MODEL.md)** | Threats, mitigations, and residual risk |
| **[ARCHITECTURE_MAP.md](ARCHITECTURE_MAP.md)** | Package responsibilities and internal boundaries |

### Maintenance And Development
| Document | Description |
|----------|-------------|
| **[DB_MAINTENANCE.md](DB_MAINTENANCE.md)** | Database maintenance and recovery |
| **[TESTING.md](TESTING.md)** | Tests, reports, and quality gate |
| **[QUALITY_IMPROVEMENT_PLAN.md](QUALITY_IMPROVEMENT_PLAN.md)** | Codebase metrics, hotspots, and improvement roadmap |
| **[API_REFERENCE.md](API_REFERENCE.md)** | Backend endpoint reference |
| **[adr/](adr/)** | Architecture Decision Records |

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

That nuance is intentional and is the documented target behavior for current releases.
