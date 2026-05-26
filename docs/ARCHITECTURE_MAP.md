# Architecture Map

**Version**: 2.4.5
**Last Updated**: April 10, 2026

This map is the working reference for backend refactors. It is intentionally short and operational.

## Package Responsibilities

- `mjr_am_backend/routes`
  - HTTP surface only.
  - Parse request data, apply auth/CSRF/rate-limit guards, call services, map `Result` payloads.
  - `route_catalog.py` — declarative route registry (`RouteRegistration` dataclass, CORE + OPTIONAL catalogs).
- `mjr_am_backend/routes/core`
  - Shared route helpers for security, path rules, JSON parsing, responses, and service resolution.
- `mjr_am_backend/routes/assets`
  - Thin compatibility facades re-exporting from `features/assets/`.
- `mjr_am_backend/features`
  - Business logic and orchestration by domain: index, metadata, collections, browser, health, tags, viewer.
- `mjr_am_backend/features/assets`
  - Asset domain sub-services:
    - `lookup_service` — asset lookups and queries
    - `download_service` — download/streaming logic
    - `rating_tags_service` — ratings, tags, collections
    - `request_context_service` — request parsing and context extraction
    - `path_resolution_service` — root/subfolder/path resolution
    - `delete_service` — asset deletion
    - `rename_service` — asset renaming
    - `filename_validator` — filename validation rules
    - `models` — shared data models
    - `service` — thin compatibility facade
- `mjr_am_backend/adapters`
  - Boundary code for SQLite, filesystem watchers, external tools, and other integration points.
- `mjr_am_backend/adapters/db`
  - `sqlite_facade.py` — main entry point for DB access (~1900 L)
  - `sqlite_connections.py` — connection pool, pragmas, acquire/release
  - `sqlite_execution.py` — query execution, timeout, retry, batch
  - `sqlite_lifecycle.py` — transactions, reset, WAL, Windows file-handle management
  - `sqlite_recovery.py` — malformed recovery, FTS rebuild, schema repair
  - `schema.py` (331 L) + `schema_sql.py`, `schema_fts.py`, `schema_vec.py` — DDL and migration
  - `connection_pool.py`, `db_recovery.py`, `transaction_manager.py` — lower-level helpers
- `mjr_am_shared`
  - Shared result types, error definitions, logging, time helpers, and cross-cutting utilities.

## Frontend

- **Vue 3 + Pinia** for all major UI surfaces (grid, sidebar, feed, context menus, settings).
- `ui/vue/` — Vue components and stores.
- `ui/features/` — feature-scoped JS modules.
- `ui/stores/` — Pinia stores.
- Imperative runtime services remain for viewer, DnD, and ComfyUI integration (by design).

## Request Flow

UI action -> route handler -> route/core helper -> feature service -> adapter -> DB/filesystem/tool -> `Result` response -> UI mapping

Rules:
- Routes do not decide filesystem or security policy locally.
- Services own business rules and orchestration.
- Adapters isolate external side effects.
- `security.py` is the single policy entry point for auth, write access, safe mode, trusted proxies, and CSRF.

## Watcher And Index Flow

Filesystem event -> watcher scope/runtime -> index orchestration -> DB update -> UI refresh event

Hot zones:
- watcher lifecycle and scope resolution
- reset/rebuild orchestration
- metadata probing and vector backfill
- live viewer synchronization

These zones should be refactored behind stable service facades before adding new behavior.

## Security Rules

- Public API base stays `/mjr/am/*`.
- Backend returns structured `Result` payloads for expected errors.
- Safe mode is enabled by default.
- Remote write remains denied without a valid token.
- Loopback write is allowed by default in the current compatibility model unless `MAJOOR_REQUIRE_AUTH=1` is set.

## Naming And Internal API Conventions

- Public internal APIs should be thin, stable facades under `features/*` or `routes/core/*`.
- Route modules may import facades and helpers, but should not directly orchestrate storage internals across multiple subsystems.
- New security-sensitive mutations must call shared security and path helpers instead of duplicating checks.

## Tags Storage

- User tags are stored in normalized tags and asset_tags tables.
- mjr_am_backend/data/repositories/tags_repository.py owns tag persistence and asset/tag links.
- asset_metadata.tags and asset_metadata.tags_text are pre-v19 legacy columns only; application readers and writers must use normalized tags.
- FTS tag columns are populated from normalized tags by v18+ triggers.
