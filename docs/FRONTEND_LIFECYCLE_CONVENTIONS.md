# Frontend Lifecycle Conventions

**Last updated**: April 10, 2026

## Vue component lifecycle

- Vue apps are created via `ui/vue/createVueApp.js` with Pinia store injection.
- Components use `onMounted` / `onUnmounted` for DOM setup/teardown.
- Event listeners added in `onMounted` **must** be removed in `onUnmounted`.
- Pinia stores are the single source of truth for UI state.

## Imperative runtime lifecycle

- `panelRuntime.js` manages the top-level panel init/destroy cycle.
- Feature modules (viewer, DnD, grid) expose `init()` / `destroy()` or `start()` / `stop()`.
- The bootstrap sequence is:
  1. `bootstrap.js` initializes the app context
  2. `panelRuntime.js` sets up the panel shell
  3. Vue apps mount into panel slots
  4. Feature runtimes activate via events or direct calls

## Teardown rules

1. Every `addEventListener` must have a matching `removeEventListener` on destroy.
2. Every `setInterval` / `setTimeout` must be cleared on destroy.
3. Pinia store subscriptions are auto-cleaned when the Vue app unmounts.
4. Custom event buses (`events.js`) listeners must be unsubscribed explicitly.

## Bridge conventions

- `comfyApiBridge.js`: wraps ComfyUI API calls. Never call ComfyUI API directly from Vue components.
- `panelStateBridge.js`: syncs Pinia panel store with legacy imperative consumers. Will be removed when all consumers migrate to Vue.
- New bridges should be avoided. Prefer Pinia stores or composables for new features.
