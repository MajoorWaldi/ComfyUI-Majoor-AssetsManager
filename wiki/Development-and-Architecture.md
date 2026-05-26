# Development and Architecture

## Architecture Overview

The project is split into a Python backend and a JavaScript frontend.

Main repository areas:
- `mjr_am_backend/` for routes, adapters, features, and service logic
- `mjr_am_shared/` for shared primitives such as logging, errors, and results
- `ui/` for frontend application code and UI components
- `tests/` for backend tests and integration coverage

## Backend Design Notes

The backend uses asynchronous aiohttp handlers, SQLite-based persistence, and a Result-oriented error handling pattern.

## Frontend Design Notes

The frontend handles grid browsing, viewer workflows, interaction surfaces, and feature-specific UI behavior.

## Quality Gates

Recommended validation commands are maintained in the repository docs, including pytest, frontend tests, linting, and complexity checks.

## Plugin Architecture

The repository now includes a documented plugin-system track for metadata extractors. That work is important enough to treat as a first-class architecture area rather than a footnote.

The plugin docs cover:
- discovery and validation
- runtime registry and lifecycle management
- security constraints for third-party extractor code
- example extractors and integration flow

## Canonical Docs

- [Architecture Map](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/blob/main/docs/ARCHITECTURE_MAP.md)
- [API Reference](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/blob/main/docs/API_REFERENCE.md)
- [Testing Guide](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/blob/main/docs/TESTING.md)
- [ADR Index](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/blob/main/docs/adr/README.md)
- [Plugin System Design](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/blob/main/docs/PLUGIN_SYSTEM_DESIGN.md)
- [Plugin Implementation Summary](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/blob/main/docs/PLUGIN_SYSTEM_IMPLEMENTATION_SUMMARY.md)
