# Frontend: Imperative vs. Vue ownership

**Last updated**: April 10, 2026

## Summary

The frontend uses **Vue 3 + Pinia** for all major UI surfaces.
Certain runtime modules remain imperative **by design** because they orchestrate cross-cutting behavior that predates or spans multiple Vue component trees.

## Imperative by design

These modules are intentionally kept outside Vue's reactivity model:

| Module | Reason |
|--------|--------|
| `ui/app/bootstrap.js` | App init sequence, ComfyUI lifecycle hooks |
| `ui/app/comfyApiBridge.js` | Bridge to ComfyUI's API (external dependency, not ours) |
| `ui/app/events.js` | Central event bus for cross-feature communication |
| `ui/app/metrics.js` | Performance telemetry (no UI surface) |
| `ui/features/panel/panelRuntime.js` | Panel lifecycle orchestration: init, teardown, events |
| `ui/features/viewer/*` | Viewer runtime: canvas, zoom, playback — too stateful and performance-sensitive for Vue reactivity |
| `ui/features/dnd/*` | Drag-and-drop runtime: low-level DOM events, interop with ComfyUI DnD |
| `ui/features/runtime/*` | ComfyUI runtime integration (generation flow, progress, queue) |

## Provisionally imperative (may migrate later)

| Module | Notes |
|--------|-------|
| `ui/stores/panelStateBridge.js` | Bridge between Vue panel store and legacy non-Vue consumers. Remove when all consumers are Vue. |
| `ui/app/dialogs.js`, `ui/app/toast.js` | UI utilities currently used by both Vue and imperative code. Can move to Vue composables once all callers migrate. |

## Fully Vue-owned

All surfaces under `ui/vue/components/` and `ui/vue/composables/` are fully Vue-owned:
- Grid, sidebar, feed, settings panels, context menus
- All Pinia stores under `ui/stores/`

## Decision criteria

A module should stay imperative when:
1. It manages a lifecycle spanning multiple Vue app mounts/unmounts
2. It bridges to external APIs not under our control (ComfyUI)
3. It requires low-level DOM/canvas control where Vue overhead is measurable
4. Its mutation patterns don't map cleanly to reactive state (e.g. streaming events, Web Workers)
