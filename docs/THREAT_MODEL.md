# Threat Model — Majoor Assets Manager

**Version**: 2.3.3  
**Date**: February 28, 2026 (Updated from 2026-01-24)

## Scope
This model covers the Majoor Assets Manager backend routes under `/mjr/am/*` and the associated local filesystem/database operations.

**New in v2.3.3**: Enhanced API token authentication, improved CSRF protection, and better rate limiting for remote access scenarios.

## Assets to Protect
- User files on disk (input/output/custom roots).
- SQLite index database and collections JSON files.
- ComfyUI server availability (avoid crashes / runaway CPU / locks).
- Privacy of metadata (prompts/workflows embedded in images/videos).

## Trust Boundaries
- **Browser/UI** → **ComfyUI HTTP server**: untrusted inputs via query params and JSON bodies.
- **Extension backend** → **Filesystem**: path traversal and symlink/junction concerns.
- **Extension backend** → **External tools** (`exiftool`, `ffprobe`): command execution and parsing.
- **Extension backend** → **SQLite**: injection/locking/corruption risks.

## Threats & Mitigations

### 1) Path Traversal / Unauthorized File Access
**Threat:** An attacker (or malicious workflow) calls `/mjr/am/*` with paths pointing outside allowed roots.

**Mitigations:**
- Normalize paths and reject invalid/unsafe paths (`_safe_rel_path`, `_is_within_root`, allow-lists).
- Custom roots are resolved and validated (root-id → canonical directory).
- Avoid exposing arbitrary “open file” primitives; use explicit allow-listed actions.

### 2) Symlink/Junction Escape (TOCTOU)
**Threat:** A path initially validated as within root later resolves to a different location (symlink swap).

**Mitigations:**
- Resolve roots/targets with `resolve(strict=True)` where possible.
- Validate after resolution and before use.
- Treat mid-scan disappearance as a benign failure and continue (best-effort).

### 3) CSRF / Cross-Site Requests
**Threat:** A local web page triggers state-changing endpoints (delete/rename/stage) against `localhost`.

**Mitigations:**
- CSRF checks on state-changing routes.
- Prefer returning `Result.Err("CSRF", ...)` instead of throwing.

### 4) Denial of Service (Large Listings / Heavy Scans)
**Threat:** Repeated list/index requests cause CPU/disk thrash.

**Mitigations:**
- Bounded queues for background work (scan pending max).
- Rate limiting for expensive endpoints.
- TTL-based filesystem listing cache with bounded size.

### 5) External Tool Execution Risks
**Threat:** Tool invocation on untrusted media can be slow or crash; tool may be missing.

**Mitigations:**
- Timeouts and best-effort fallbacks (`code="DEGRADED"`).
- Never crash UI: return `Result.Err/Ok` with degraded metadata.
- Avoid shell string interpolation; prefer argv lists.

### 6) Data Corruption / Concurrent Writes
**Threat:** Concurrent updates corrupt JSON stores or SQLite schema state.

**Mitigations:**
- Atomic writes for JSON stores (write tmp + replace).
- SQLite locking strategy and bounded transactions.

## Residual Risk
- Localhost endpoints are inherently accessible to local malware.
- Media parsing remains a complex attack surface (mitigated by timeouts and least-privilege execution).

## Non-Goals
- Remote multi-user authentication/authorization (ComfyUI is typically local-only).
- Protecting against a fully compromised host OS.

