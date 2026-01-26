# ADR 0001: Error Handling via `Result` (No UI Exceptions)

Date: 2026-01-24

## Status
Accepted

## Context
ComfyUI loads custom nodes into a long-running server process. An uncaught exception inside an extension can:
- break the UI (failed endpoints / broken sidebar),
- force restarts, and/or
- hide partial but useful results (e.g. missing `exiftool`, partial metadata).

We need a consistent way to report *expected* failures (tool missing, unsupported format, partial metadata) without crashing the UI or relying on HTTP status codes.

## Decision
- Backend services and adapters return `Result[T]` instead of raising for expected errors.
- Route handlers **must not** let exceptions bubble to ComfyUI’s request handling. Any unexpected exception is caught and converted into `Result.Err(...)`.
- For business/expected errors, HTTP routes return **200** with `{ ok: false, code, error, meta }`.
- Non-200 status codes are reserved for true server bugs (uncaught exceptions), and we aim for “never” by design.

## Consequences
### Positive
- More resilient UI: missing tools or partial metadata does not crash the extension.
- Clear client behavior: the JS client can treat every response as a `Result` payload.
- Easier observability: errors are structured by `code`.

### Negative
- Requires discipline: any new code path must follow the `Result` pattern.
- Some integration tests must check `Result.ok` rather than HTTP status.

## Notes
This ADR pairs with a frontend convention: the JS API client must not throw and should return `{ ok, data, error, code, meta }`.

