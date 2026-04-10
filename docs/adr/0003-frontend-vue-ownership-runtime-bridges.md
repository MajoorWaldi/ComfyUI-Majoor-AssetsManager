# ADR 0003: Frontend Vue Ownership And Runtime Bridges

Date: 2026-04-09

## Status
Accepted

## Context

The project has already completed the major UI migration to Vue 3 + Pinia for the main surfaces:
- panel shell,
- grid and sidebar,
- generated feed,
- context menus,
- viewer hosts,
- core runtime ownership for DnD and mounting.

What remains is not a second migration. The remaining complexity is in the bridge layer between Vue-owned UI and imperative runtime services:
- global events,
- ComfyUI integration points,
- viewer lifecycle hooks,
- a few `window.*` contracts used for compatibility or debugging.

Without an explicit rule, these bridges tend to regrow into hidden ownership leaks.

## Decision

- Vue owns the major UI surfaces and remains the default place for visible state and rendering.
- Imperative runtime services are allowed only for integration concerns that are awkward or unsafe to model directly as Vue component state.
- Runtime bridges must stay explicit, named, and localized rather than spread through ad hoc `window.*` access.
- Any bridge kept by design must be documented as either:
  - permanent integration infrastructure, or
  - temporary compatibility debt.

## Consequences

### Positive
- Prevents reopening a vague “finish the Vue migration” project.
- Keeps ownership boundaries reviewable.
- Makes teardown and lifecycle regressions easier to isolate.

### Negative
- Some legacy globals remain for a while and require explicit documentation.
- A few runtime adapters stay imperative even when most UI code is declarative.

## Notes

This ADR pairs with the refacto plan and the follow-up documentation task that classifies which remaining imperative pieces are kept by design.