# ADR 0002: Avoid Importing `ComfyUI/server.py` from Extension Code

Date: 2026-01-24

## Status
Accepted

## Context
Importing ComfyUI’s `server.py` can trigger heavy initialization (e.g. `nodes -> torch -> cuda init`).
In non-ComfyUI contexts (unit tests, documentation scripts, or misconfigured CUDA setups), importing `server.py` can cause hard crashes (native access violations) rather than a Python exception.

The extension needs to register routes in ComfyUI, but also remain importable in test/script contexts.

## Decision
- Do **not** `import server` (or `from server import PromptServer`) inside extension modules.
- When running inside ComfyUI, `server` is already imported; reuse it via `sys.modules["server"]`.
- When not running inside ComfyUI, fall back to a safe stub that provides a `routes` table for tests.

## Consequences
### Positive
- Prevents hard crashes during import outside ComfyUI.
- Keeps unit tests and scripts safe and fast.

### Negative
- Requires small amount of compatibility/protocol typing code (stubs/protocols).

