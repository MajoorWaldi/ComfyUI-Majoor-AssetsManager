# Majoor Assets Manager Audit + Patch (Final)

Date: 2026-02-12

## Objective
Close all open findings from `AUDIT_AND_PATCHES.md` and `AUDIT_COMPATIBILITY_PATCH_PLAN.md` for compatibility, conflict prevention, and startup stability in ComfyUI.

## Completed fixes

1. Namespace conflict mitigation
- Migrated top-level runtime packages to unique names:
  - `backend/` -> `mjr_am_backend/`
  - `shared/` -> `mjr_am_shared/`
- Updated imports project-wide to use `mjr_am_backend.*` and `mjr_am_shared.*`.
- Removed aggressive foreign module purging from import bootstrap.

2. Import-time side effects reduced
- Reworked `__init__.py` startup path:
  - No import-time pip install path.
  - Dependency check is now informational only.
  - Added explicit public init APIs:
    - `init_prompt_server()`
    - `init(app_or_prompt_server=None)`
- Reserved-name cleanup is now opt-in only:
  - `MJR_AM_CLEANUP_RESERVED_NAMES=1`

3. Route registration and middleware idempotency
- Kept idempotent route guard and middleware guards in `mjr_am_backend/routes/registry.py`.
- Made `mjr_am_backend/routes/__init__.py` side-effect free (no auto registration on import).

4. API consistency
- Added canonical version endpoint:
  - `/mjr/am/version`
- Kept legacy alias:
  - `/majoor/version`

5. Dependency install flow moved to explicit script
- Added `scripts/install-requirements.py`.
- Updated `README.md` to direct manual explicit dependency install.

6. Compatibility smoke tests and CI
- Added tests:
  - `tests/compat/test_import_smoke.py`
  - `tests/compat/test_version_route_alias.py`
- Added workflow:
  - `.github/workflows/compat-smoke.yml`
  - Python matrix: 3.10, 3.11, 3.12

## Verification
- `python -m compileall -q __init__.py mjr_am_backend mjr_am_shared tests/compat scripts/install-requirements.py` -> pass
- `python -m pytest -q tests/compat/test_import_smoke.py tests/compat/test_version_route_alias.py` -> pass (`2 passed`)

## Notes
- Existing in-progress performance changes remain in working tree and were not reverted.
- This patch set is focused on compatibility/conflict hardening and safe initialization behavior.
