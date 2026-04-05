# Architecture Map

**Version**: 2.4.4  
**Last Updated**: April 5, 2026

This map is the working reference for backend refactors. It is intentionally short and operational.

## Package Responsibilities

- `mjr_am_backend/routes`
  - HTTP surface only.
  - Parse request data, apply auth/CSRF/rate-limit guards, call services, map `Result` payloads.
- `mjr_am_backend/routes/core`
  - Shared route helpers for security, path rules, JSON parsing, responses, and service resolution.
- `mjr_am_backend/features`
  - Business logic and orchestration by domain: index, metadata, collections, browser, health, tags, viewer.
- `mjr_am_backend/adapters`
  - Boundary code for SQLite, filesystem watchers, external tools, and other integration points.
- `mjr_am_shared`
  - Shared result types, error definitions, logging, time helpers, and cross-cutting utilities.

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
