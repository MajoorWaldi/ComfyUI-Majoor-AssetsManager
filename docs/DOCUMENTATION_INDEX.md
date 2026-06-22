# Majoor Assets Manager - Documentation Index

Welcome to the documentation hub for **Majoor Assets Manager** for ComfyUI.

Majoor is best understood as one workflow:

1. **Browse** your ComfyUI media library.
2. **Inspect** prompts, metadata, workflows, and visual details.
3. **Reuse** useful assets and workflow context back in ComfyUI.

**Current Version**: 2.4.8
**Last Updated**: June 11, 2026

## Start Here

| Goal | Read This |
| --- | --- |
| Install the extension | **[Installation Guide](INSTALLATION.md)** |
| Learn the daily workflow | **[User Guide (HTML)](../user_guide.html)** |
| Find assets quickly | **[Search & Filtering](SEARCH_FILTERING.md)** |
| Learn shortcuts | **[Hotkeys & Shortcuts](HOTKEYS_SHORTCUTS.md)** |
| See what changed | **[Changelog](../CHANGELOG.md)** |

## Browse

Use these docs for the main library experience: grid browsing, search, organization, and file actions.

| Document | Description |
| --- | --- |
| **[SEARCH_FILTERING.md](SEARCH_FILTERING.md)** | Full-text search, filters, sorting, and discovery |
| **[WORKFLOWS.md](WORKFLOWS.md)** | Workflow tab library: save, import, load, inspect, categorize, thumbnail, and tag workflows |
| **[RATINGS_TAGS_COLLECTIONS.md](RATINGS_TAGS_COLLECTIONS.md)** | Ratings, tags, collections, and organization |
| **[DRAG_DROP.md](DRAG_DROP.md)** | Drag to canvas, staging, OS drag-out, clean export, ZIP download |
| **[DB_MAINTENANCE.md](DB_MAINTENANCE.md)** | Index database reset, recovery, and index directory configuration |

## Inspect

Use these docs when you want to understand how an asset was made or compare outputs.

| Document | Description |
| --- | --- |
| **[MFV_GUIDE.md](MFV_GUIDE.md)** | Majoor Floating Viewer: live review, compare modes, pins, streams |
| **[VIEWER_FEATURE_TUTORIAL.md](VIEWER_FEATURE_TUTORIAL.md)** | Viewer tools, analysis overlays, media controls |
| **[GRAPH_MAP.md](GRAPH_MAP.md)** | Workflow graph navigation and node detail inspection |
| **[FLOATING_VIEWER_WORKFLOW_SIDEBAR.md](FLOATING_VIEWER_WORKFLOW_SIDEBAR.md)** | Node Parameters sidebar in the Floating Viewer |

## Reuse

Use these docs for moving assets and workflow information back into ComfyUI.

| Document | Description |
| --- | --- |
| **[WORKFLOWS.md](WORKFLOWS.md)** | Save, import, load, inspect, and organize reusable ComfyUI workflows |
| **[DRAG_DROP.md](DRAG_DROP.md)** | Load assets onto nodes or canvas, stage files to input |
| **[CUSTOM_NODES.md](CUSTOM_NODES.md)** | Majoor Save Image, Majoor Save Video, and Majoor GenInfo Override node reference |
| **[SHORTCUTS.md](SHORTCUTS.md)** | Quick gestures such as S+Drag and L+Drop |

## Advanced Features

These are powerful capabilities, but they are not required for the basic Browse / Inspect / Reuse workflow.

| Document | Description |
| --- | --- |
| **[AI_FEATURES.md](AI_FEATURES.md)** | Semantic search, visual similarity, auto-tags, captions, vector backfill |
| **[PRIVACY_OFFLINE.md](PRIVACY_OFFLINE.md)** | Local AI behavior, model downloads, offline use, token clarification |
| **[SETTINGS_CONFIGURATION.md](SETTINGS_CONFIGURATION.md)** | Runtime settings, UI settings, index path overrides, environment variables |
| **[SECURITY_ENV_VARS.md](SECURITY_ENV_VARS.md)** | Remote access security, API tokens, safe defaults |
| **[THREAT_MODEL.md](THREAT_MODEL.md)** | Threats, mitigations, and residual risk |
| **[API_REFERENCE.md](API_REFERENCE.md)** | Backend endpoint reference |

## Development And Architecture

| Document | Description |
| --- | --- |
| **[ARCHITECTURE_MAP.md](ARCHITECTURE_MAP.md)** | Package responsibilities and internal boundaries |
| **[TESTING.md](TESTING.md)** | Tests, reports, and quality gate |
| **[CONTRIBUTING.md](CONTRIBUTING.md)** | Developer onboarding and contribution guidance |
| **[DEPENDENCY_POLICY.md](DEPENDENCY_POLICY.md)** | Runtime, optional, and contributor dependency rules |
| **[adr/](adr/)** | Architecture Decision Records |

## Plugin System

| Document | Description |
| --- | --- |
| **[PLUGIN_QUICK_REFERENCE.md](PLUGIN_QUICK_REFERENCE.md)** | Quick start for plugin development |
| **[PLUGIN_SYSTEM_DESIGN.md](PLUGIN_SYSTEM_DESIGN.md)** | Full plugin architecture design |
| **[PLUGIN_SYSTEM_IMPLEMENTATION_SUMMARY.md](PLUGIN_SYSTEM_IMPLEMENTATION_SUMMARY.md)** | Implementation status and details |

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

The quality gate covers backend tests, frontend tests, linting, typing, dependency checks, and security scans.
