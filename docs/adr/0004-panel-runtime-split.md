# ADR 0004: Panel Runtime Split

Date: 2026-04-09

## Status
Accepted

## Context

`panelRuntime.js` became the post-migration orchestration point for the Assets Manager panel. As responsibilities accumulated, the file started mixing:
- bootstrap,
- filter initialization,
- grid event bindings,
- settings sync,
- pinned folders,
- similar search,
- context menu extras,
- runtime references.

Several focused modules have already been extracted, but the refacto still needs a stable rule for what stays inside `panelRuntime.js`.

## Decision

- `panelRuntime.js` remains an orchestration layer, not a feature dump.
- Feature-specific behavior must move to focused modules when it has its own lifecycle, side effects, or dedicated tests.
- New panel responsibilities should be extracted when they are independently testable or when they touch unrelated domains.
- The runtime panel is allowed to coordinate Vue mounting and imperative integration glue, but not to re-centralize feature logic.

## Consequences

### Positive
- Keeps the panel bootstrap readable.
- Makes future regressions easier to localize to one feature module.
- Encourages testable seams for panel lifecycle behavior.

### Negative
- Some orchestration indirection is unavoidable.
- Small features may feel slightly more fragmented than in a single-file implementation.

## Notes

This ADR does not require eliminating `panelRuntime.js`. It defines its role so future cleanup can measure whether a responsibility belongs there or in an extracted module.