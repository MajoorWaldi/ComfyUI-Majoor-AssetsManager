# ADR 0005: Frontend Source vs Distribution — Single Source of Truth

Date: 2026-04-11

## Status
Accepted

## Context

Two directories coexist in the repository:

| Directory | Role |
|-----------|------|
| `js/`     | Source — authored ES modules, Vue SFCs, Pinia stores. Version-controlled. |
| `js_dist/`| Artifact — Vite bundle output (`npm run build`). **Not version-controlled** in main branch development; produced by the release pipeline. |

`__init__.py` already falls back from `js_dist/` to `js/` when the dist directory is absent:

```python
_js_dist = root / "js_dist"
WEB_DIRECTORY = str(_js_dist if _js_dist.is_dir() else root / "js")
```

Without an explicit policy, contributors are unsure:
- whether `js_dist/` should be committed,
- whether to test against `js/` or `js_dist/`,
- how the release is packaged.

## Decision

1. **`js/`** is the single source of truth for frontend development.
   All editing, review, and test authorship targets `js/`.

2. **`js_dist/`** is a release artifact, produced by `npm run build` and committed
   **only at release time** (via the release pipeline / `scripts/make_release_zip.ps1`).
   It is listed in `.gitignore` for day-to-day development branches.

3. The `WEB_DIRECTORY` fallback (`js_dist/ → js/`) is intentional and permanent.
   It allows:
   - development without a build step,
   - production releases that serve the optimised bundle.

4. CI smoke tests for the frontend run against the **built bundle** (`js_dist/`)
   to catch build-time regressions.  Unit / component tests run against source (`js/`).

5. No other directory (e.g. `js_build/`, `dist/`, `public/`) is ever used as the
   frontend root.  Any addition must amend this ADR first.

## Consequences

### Positive
- Eliminates ambiguity about which directory is authoritative.
- Keeps the repo lean during development (no dist churn in PRs).
- Release bundles are reproducible from the Git tag + `npm run build`.

### Negative
- Developers must run `npm run build` to test production behaviour locally.
- Releases carry a committed `js_dist/` that diverges slightly from `js/` until
  the next build (acceptable: dist is always fresher than or equal to the last tag).

## Notes

- `vite.config.mjs` defines the build output as `js_dist/`.
- `vitest.config.mjs` targets source files under `js/`.
- Bundle size budget is tracked in `package.json` (`bundlesize` key or equivalent CI step).
- If `js_dist/` is accidentally committed during development, `git rm -r --cached js_dist/`
  restores the expected state.
