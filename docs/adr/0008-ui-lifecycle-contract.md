# ADR 0008 — UI Lifecycle Contract (Keep-Alive Strategy)

**Status**: Accepted
**Date**: 2026-04-11
**Deciders**: Frontend team

## Context

ComfyUI calls `render(el)` each time a sidebar or bottom-panel tab becomes
visible, and `destroy(el)` each time it is hidden.  A naïve implementation
that mounts a new Vue app on every `render()` call destroys and rebuilds all
reactive state on each tab switch, including:

- The virtualized asset grid (thousands of lazy-loaded card elements)
- Scroll position and scroll-trigger sentinel
- Grid selection state
- In-flight network requests (pagination, metadata prefetch)
- Pinia store state (active asset, filters, sort order)

Rebuilding all of this on every tab switch causes visible reloads (blank
frames, re-fetching the entire asset list) and user-visible glitches.

## Decision

### Keep-alive strategy

All Majoor Vue apps are mounted via `mountKeepAlive(container, component, mountKey)`:

```
First render()  → mounts Vue app into a host div, stores in _registry[mountKey]
Subsequent render() → re-attaches existing host div to the (possibly new) container
destroy()       → intentional NO-OP; the Vue app stays alive in the registry
unmountKeepAlive() → called ONLY on full extension teardown
```

### Mount key registry

| Mount key                  | Component          | Lifecycle             |
|----------------------------|--------------------|-----------------------|
| `_mjrGlobalRuntimeVueApp`  | GlobalRuntime.vue  | Entire browser session |
| `_mjrSidebarVueApp`        | App.vue            | Until extension teardown |
| `_mjrFeedVueApp`           | GeneratedFeedApp.vue | Until extension teardown |

The `GlobalRuntime.vue` app is mounted once into a fixed-position
`#mjr-global-runtime-root` element appended to `document.body`.  It owns the
viewer overlay and drag-and-drop runtime so they remain available even before
the sidebar tab is first opened.

### Vue component lifecycle rules

1. **`onMounted`** → subscribe to DOM events.  Prefer `AbortController` signal
   variant so listeners are cleaned up automatically:
   ```js
   const ac = new AbortController();
   window.addEventListener("mjr:event", handler, { signal: ac.signal });
   // No removeEventListener needed — ac.abort() cleans everything at once.
   ```

2. **`onUnmounted`** → call `.abort()`, dispose subscriptions, clear timers.
   This hook fires when `unmountKeepAlive()` is called (full teardown), NOT on
   every tab switch.

3. **No direct ComfyUI API calls from Vue components.**  All host capabilities
   must be accessed via `js/app/hostAdapter.js` (ADR 0007).

4. **Do not call `unmountKeepAlive()` inside a tab's `destroy()` callback.**
   This is a violation of the keep-alive contract.

### Teardown helpers (extension cleanup only)

```
teardownAssetsSidebar()     → unmountKeepAlive(null, "_mjrSidebarVueApp")
teardownGeneratedFeed()     → unmountKeepAlive(null, "_mjrFeedVueApp")
teardownGlobalRuntime()     → unmountKeepAlive(…) + removes #mjr-global-runtime-root
```

All teardown helpers are **idempotent** (safe to call multiple times) and
**safe when nothing was mounted** (no throw).

## Container re-attachment

When ComfyUI provides a different container element on a subsequent `render()`
call (which can happen after panel layout changes), `mountKeepAlive` simply
re-parents the existing host div into the new container.  The Vue app is not
re-mounted; only the host's parent changes.  A `mjr:keepalive-attached` DOM
event is dispatched each time the host is re-attached.

## Consequences

### Positive

- **Zero tab-switch flicker**: the grid, scroll position, and selections are
  preserved across any number of open/close cycles.
- **Single initialisation cost**: Vue + Pinia initialise once per session.
- **Predictable event listener lifetime**: `onUnmounted` runs exactly once
  (on teardown), not on every tab switch.

### Negative / trade-offs

- Vue app memory is not released during normal usage; it lives for the
  extension's lifetime.  Acceptable given the asset grid needs the state anyway.
- Developers must remember that `destroy()` is a no-op.  The contract is
  documented here and enforced by `tests/js/ui_registration_lifecycle.vitest.mjs`.

## Verification

The following test files verify this contract:

- `js/tests/ui_lifecycle_contract.vitest.mjs` — `mountKeepAlive` / `unmountKeepAlive`
  observable guarantees (null-safety, container styling, event dispatch, key isolation)
- `js/tests/ui_registration_lifecycle.vitest.mjs` — `entryUiRegistration.js`
  render/destroy no-op, teardown helpers, `mountGlobalRuntime` DOM lifecycle,
  `isMajoorTrackableNode` classifier, `consumeEarlyFetch` cache semantics
- `js/tests/create_vue_app_keep_alive.vitest.mjs` — original keep-alive host tests
  (container swap, full teardown, re-mount after unmount)

## Related ADRs

- ADR 0005 — Frontend source/dist truth
- ADR 0007 — Bounded contexts and layer vocabulary (hostAdapter contract)
