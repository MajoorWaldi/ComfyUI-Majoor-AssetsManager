# Majoor Assets Manager Compatibility Audit + Patch Plan

Date: 2026-02-12  
Target: `ComfyUI/custom_nodes/ComfyUI-Majoor-AssetsManager`  
ComfyUI baseline reviewed: local repo at `F:\__CLEAN_COMFY\ComfyUI-Easy-Install\ComfyUI` + upstream structure/patterns.

## Scope and method
- Reviewed Majoor extension import/bootstrap path, backend route registration, middleware behavior, namespace usage, and API path conventions.
- Cross-checked ComfyUI load lifecycle and extension mechanics:
  - Custom nodes loaded in `nodes.load_custom_node(...)` and `nodes.init_extra_nodes(...)`.
  - `WEB_DIRECTORY` handling through `nodes.EXTENSION_WEB_DIRS`.
  - Prompt server lifecycle (`PromptServer(...)` then `prompt_server.add_routes()`).
- Focused on compatibility, conflict prevention, and runtime bug-risk reduction.

## Key ComfyUI references used
- Local: `ComfyUI/nodes.py:2196`, `ComfyUI/nodes.py:2239`, `ComfyUI/nodes.py:2240`, `ComfyUI/nodes.py:2467`
- Local: `ComfyUI/main.py:386`, `ComfyUI/main.py:392`, `ComfyUI/main.py:401`
- Local: `ComfyUI/server.py:195`, `ComfyUI/server.py:993`, `ComfyUI/server.py:1012`, `ComfyUI/server.py:1016`
- Upstream links (same components):
  - https://github.com/comfyanonymous/ComfyUI/blob/master/nodes.py
  - https://github.com/comfyanonymous/ComfyUI/blob/master/main.py
  - https://github.com/comfyanonymous/ComfyUI/blob/master/server.py

## Findings (prioritized)

### 1) High: top-level namespace collision risk (`backend`, `shared`)
- Evidence:
  - `__init__.py:153` appends extension root to `sys.path`.
  - `__init__.py:170-173` removes foreign `backend*` modules from `sys.modules`.
  - 72 absolute imports reference `backend.*` across runtime modules.
- Why this is risky:
  - Any other extension using a top-level `backend` or `shared` package can conflict.
  - Current mitigation deletes other modules, which can break other loaded extensions.
- Patch plan:
  1. Migrate to a unique package namespace (example: `mjr_am_backend` and `mjr_am_shared`).
  2. Convert runtime imports to relative imports where feasible (`from .core...`) inside the package.
  3. Remove `sys.modules` cleanup for foreign `backend` modules after migration.

### 2) High: import-time side effects are still too heavy
- Evidence:
  - `__init__.py` runs Windows reserved-name cleanup and dependency probing/install checks during import.
  - `backend/routes/__init__.py` auto-registers routes on import.
- Why this is risky:
  - ComfyUI imports all custom nodes during startup; heavy side effects increase startup fragility.
- Patch plan:
  1. Keep import path minimal and deterministic.
  2. Move optional maintenance tasks (reserved-name cleanup) to explicit admin action or guarded lazy init.
  3. Keep route registration idempotent and only when `PromptServer` is available.

### 3) High: duplicate registration/middleware insertion bugs
- Evidence:
  - Re-imports or compatibility shims can call route registration more than once.
- Risk:
  - Duplicate route definitions, repeated middleware insertion, inconsistent behavior across reloads/tests.
- Patch status: **fixed in this pass**
  - `backend/routes/registry.py`
    - Added `_ROUTES_REGISTERED` idempotency guard.
    - Added app flags to prevent duplicate security middleware and observability middleware insertion.

### 4) Medium: route auto-registration should be gated by server availability
- Evidence:
  - `backend/routes/__init__.py` previously auto-registered unconditionally.
- Risk:
  - Non-ComfyUI runtime/test contexts register against stubs and create confusing state.
- Patch status: **fixed in this pass**
  - `backend/routes/__init__.py` now auto-registers only if `server` is already loaded.

### 5) Medium: inconsistent API namespace (`/majoor/version`)
- Evidence:
  - `backend/routes/handlers/version.py` registers `@routes.get("/majoor/version")` while most endpoints are `/mjr/am/...`.
- Risk:
  - Client confusion and endpoint discoverability inconsistency.
- Patch plan:
  1. Add canonical endpoint `/mjr/am/version`.
  2. Keep `/majoor/version` as backward-compatible alias for one release cycle.
  3. Update frontend endpoint constants and docs.

### 6) Medium: import-time dependency install path still present (even if opt-in)
- Evidence:
  - `__init__.py` includes install logic controlled by `MJR_AM_AUTO_PIP`.
- Risk:
  - Unexpected install attempts in constrained environments; policy/security concerns.
- Patch plan:
  1. Move install logic to explicit script (`scripts/install_requirements.py`) and README instructions.
  2. Keep startup checks informational only.

### 7) Medium: Windows reserved-name cleanup can affect sibling extension entries
- Evidence:
  - `__init__.py:_cleanup_windows_reserved_custom_nodes` scans parent `custom_nodes` and deletes entries.
- Risk:
  - Cross-extension side effects in shared folder.
- Patch plan:
  1. Default this behavior off.
  2. Enable only with explicit env flag (example: `MJR_AM_CLEANUP_RESERVED_NAMES=1`).
  3. Log detected candidates without deleting unless flag is enabled.

### 8) Medium: logging consistency and host-friendly diagnostics
- Evidence:
  - Prior use of `print(...)` in import path.
- Patch status: **partially fixed in this pass**
  - `__init__.py` switched remaining startup prints to logger-based messages and exception logging.
- Remaining plan:
  - Normalize noisy startup logs to `debug/info`, keep warnings actionable.

### 9) Low: compatibility shim path can still trigger route registration transitively
- Evidence:
  - `backend/routes_compat.py` imports `.routes` package.
- Risk:
  - Depends on import order and can still contribute to repeated setup if called unexpectedly.
- Patch plan:
  1. Keep compatibility shim minimal (pure symbol re-export).
  2. Document that runtime should import canonical package only.

### 10) Low: no dedicated compatibility CI matrix vs ComfyUI versions
- Evidence:
  - No explicit compatibility test harness for route registration/import lifecycle against multiple ComfyUI versions.
- Risk:
  - Regressions when ComfyUI internals evolve.
- Patch plan:
  1. Add CI smoke tests for: import, route registration, `WEB_DIRECTORY` serving, and key endpoints.
  2. Test against at least stable + latest ComfyUI branches.

## Patches applied in this audit session
1. `backend/routes/registry.py`
- Added registration idempotency (`_ROUTES_REGISTERED`).
- Added middleware installation guards via app flags:
  - `_mjr_security_middlewares_installed`
  - `_mjr_observability_installed`

2. `backend/routes/__init__.py`
- Gated route auto-registration to only run when `server` is already loaded.

3. `__init__.py`
- Replaced remaining import-path `print(...)` calls with logger calls.
- Improved failure logging via `_logger.exception(...)` on backend-route import failure.

Validation run:
- `python -m py_compile __init__.py backend/routes/__init__.py backend/routes/registry.py` (pass)

## Recommended next patch set (high impact)
1. Namespace migration (`backend` -> unique package namespace) and remove foreign module purge.
2. Add canonical version route `/mjr/am/version` + keep alias.
3. Convert reserved-name cleanup to explicit opt-in behavior.
4. Move dependency installation flow from import path to explicit script/command.
5. Add compatibility CI smoke tests against ComfyUI stable/latest.

## Suggested rollout strategy
1. Release `compat-hardening` patch (already applied here).
2. Release `namespace-migration` as a clearly versioned breaking/internal change with shim aliases.
3. Release `api-consistency` patch with endpoint aliasing and frontend updates.
4. Add CI compatibility gate before next feature release.
