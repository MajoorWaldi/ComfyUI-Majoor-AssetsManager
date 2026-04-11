# ADR 0007: Bounded Contexts, Layer Vocabulary, and Internal Module Contracts

Date: 2026-04-11

## Status
Accepted

## Context

The backend and frontend have grown organically through multiple refactoring
phases.  Each phase improved local structure, but without a **frozen vocabulary**
for layer names and a clear definition of which modules are public vs internal,
three problems recur:

1. New contributors face a long ramp-up to understand where a feature belongs.
2. Shared "utility" modules (`utils.py`, `shared.py`, `helpers/`) accumulate
   mixed responsibilities.
3. Import relationships are not contracted: any module can currently import from
   any other, creating invisible coupling.

## Decision

### 1. Bounded contexts (backend)

The backend is divided into the following **bounded contexts**.
Each context owns its services, DTOs, errors, and tests.
Cross-context communication goes through the public contract of the target context,
**never through internal helpers**.

| Context | Root package | Scope |
|---------|-------------|-------|
| **assets** | `mjr_am_backend/features/assets/` | Asset CRUD, scan, index |
| **metadata** | `mjr_am_backend/features/metadata/` | Probe, read, write metadata |
| **search** | `mjr_am_backend/features/search/` | Full-text and vector search |
| **collections** | `mjr_am_backend/features/collections/` | Ratings, tags, collections |
| **security** | `mjr_am_backend/routes/core/security*.py` | Auth, CSRF, rate-limit policy |
| **plugins** | `plugins/` | Third-party extension system |
| **ui-integration** | `js/features/runtime/` | ComfyUI host bridge, lifecycle |

A context must **not** import from `routes/handlers/` of another context.
Route handlers are thin shells that call into context services.

### 2. Layer vocabulary (frozen)

Each layer has exactly one responsibility.
Do not create new layers without amending this ADR.

| Layer name | Responsibility |
|------------|---------------|
| `route handler` | HTTP in/out, auth check, call service, return Result |
| `service` | Business logic, orchestrates adapters, returns Result |
| `adapter` | Wraps an external system (DB, filesystem, tool) behind a stable protocol |
| `DTO / type` | Plain data structures shared between layers (no logic) |
| `shared` / `utils` | Pure functions with no side effects; no I/O; **must shrink over time** |

**Forbidden synonyms**: `impl`, `helper`, `facade`, `misc`.
When naming a module, pick from the table above.

### 3. Module visibility contracts

Every Python module in the backend is classified as one of:

| Class | Marker | Meaning |
|-------|--------|---------|
| **Public** | Exported in `__all__` | Stable across versions; imported by tests and external consumers |
| **Internal** | Name starts with `_` or not in `__all__` | Subject to change; do not import from outside the context |
| **Legacy** | Comment `# LEGACY: <reason>` near imports | Still working but scheduled for removal; no new code should depend on it |
| **Experimental** | Comment `# EXPERIMENTAL` near imports | May change at any commit; not tested for backward compat |

`routes_compat.py` in the backend root is the **canonical legacy module**.
It must not receive new responsibilities.

### 4. Import discipline

- Route handlers may import services and shared utilities.
- Services may import adapters and DTOs.
- Adapters may import only stdlib, third-party libs, and DTOs.
- `mjr_am_shared` is the cross-cutting library; it has no runtime dependencies.
- Circular imports are forbidden.  Any circular import is a design signal, not a
  one-off to work around with `importlib`.

### 5. Frontend bounded contexts

The same principle applies on the JS side:

| Context | Directory | Scope |
|---------|-----------|-------|
| **host-adapter** | `js/app/comfyApiBridge.js` + `js/app/hostAdapter.js` | All ComfyUI / DOM host access |
| **grid** | `js/features/grid/` | Asset grid rendering and events |
| **viewer** | `js/features/viewer/` | Media viewer, floating viewer, live stream |
| **feed** | `js/features/bottomPanel/feed/` | Generated feed |
| **search** | `js/features/search/` | Search/filter UI |
| **stores** | `js/stores/` | Pinia state, never import DOM/host directly |

Vue components and Pinia stores **must not** import directly from `comfyApiBridge.js`
or ComfyUI globals.  They go through the host-adapter layer.

## Consequences

### Positive
- Onboarding time drops: the layer table answers "where does this go?"
- `utils.py` and `shared.py` become a measurable target to shrink.
- Import graph remains acyclic and reviewable.
- Tech debt is classified and owned, not just "somewhere in the codebase".

### Negative
- Migration of existing modules to this contract is incremental work.
- Some legacy cross-context imports exist today; they are tagged `# LEGACY` and
  tracked in the tech debt register.

## Migration plan

1. Tag all existing cross-context imports with `# LEGACY: <target ADR>` on next
   touch.
2. New features must respect this ADR from the date of acceptance.
3. `utils.py` size is tracked in the repo health metrics script
   (`scripts/repo_health.py`); it must not grow.

## Notes

This ADR does not require an immediate rewrite.
Compliance is verified at PR review time by the checklist in `docs/CONTRIBUTING.md`.
