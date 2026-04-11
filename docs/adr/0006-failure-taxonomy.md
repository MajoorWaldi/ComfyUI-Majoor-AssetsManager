# ADR 0006: Failure Taxonomy — Classifying Errors and Degraded States

Date: 2026-04-11

## Status
Accepted

## Context

The project already enforces a `Result[T]` pattern (ADR 0001) and has a
`bootstrap_report.py` module that records startup stage outcomes.

However, there is no canonical vocabulary for **why** something failed or
**what impact** it has.  Without a shared taxonomy:

- Some failures die silently (swallowed in `except Exception: pass`).
- Callers cannot distinguish a recoverable tool absence from a fatal DB corruption.
- The health endpoint cannot summarise degradation clearly.
- Tests cannot assert on the correct severity class.

## Decision

Every failure recorded in `bootstrap_report.record_stage()`, every `Result.Err(...)`,
and every log call in a catch block **must map to one of five severity classes**.
The classes are defined in `mjr_am_backend.bootstrap_report.FailureSeverity`.

### Severity classes

| Class | Constant | Meaning | Surface |
|-------|----------|---------|---------|
| No issue | `NONE` | Stage succeeded, no action needed | — |
| Internal | `INTERNAL` | Operational detail, dev-only interest | Log only |
| Recoverable | `RECOVERABLE` | Transient; will resolve without restart or has a retry | Log + health detail |
| User-facing | `USER_FACING` | User may want to act (install dep, check config) | Health endpoint + optional UI notice |
| Degraded | `DEGRADED` | Plugin starts but a **capability** is unavailable | Health endpoint (overall = degraded) |
| Fatal | `FATAL` | Plugin cannot function; blocks the extension | Health endpoint (overall = fatal) + log.error |

### Mapping rules

- An absent optional dependency (e.g. `hnswlib`, `exiftool`) →
  `DEGRADED` if it disables a feature, `USER_FACING` if the user should install it.
- A DB file that cannot be opened → `FATAL`.
- Middleware that fails to install → `FATAL` (security properties are broken).
- A route group that fails to register → `DEGRADED` (core routes still function).
- A transient I/O error during prewarm → `RECOVERABLE`.
- An unexpected exception caught by a top-level handler → `INTERNAL` (log, never silent).

### Never acceptable

- `except Exception: pass` — a swallowed exception **must** at minimum call
  `logger.debug(...)` and optionally `record_stage(..., "degraded", "internal", ...)`.
- Silent degradation of a feature that the user is actively using.

## Consequences

### Positive
- `GET /mjr/am/health` returns a meaningful `bootstrap.overall` value that reflects
  the real plugin state (`ok`, `degraded`, or `fatal`).
- New contributors have a clear policy: every catch block has a severity label.
- Tests can assert on the right severity class, not just on "no exception raised".

### Negative
- Existing catch blocks must be audited and labelled over time (tracked as tech debt).
- Some borderline cases require judgement (DEGRADED vs USER_FACING).

## Migration

Existing `except Exception: pass` or bare `logger.debug` blocks are **tech debt**.
They should be labelled with a `# TODO(severity): classify` comment during the next
touch of the file, and converted in the same PR.

## Notes

- `bootstrap_report.FailureSeverity` is the canonical enum.
  Do not define alternative severity strings elsewhere.
- `Result.Err(code, message)` carries a `code` (business domain), not a severity.
  Severity is orthogonal and lives in the bootstrap report or in structured logs.
- The `vector_search` subsystem is a canonical example of a `DEGRADED` + `USER_FACING`
  failure: the plugin starts fine but semantic search is unavailable, and users should
  know they can install `hnswlib` to enable it.
