/**
 * Vue application factory — Majoor Assets Manager
 *
 * Creates an isolated Vue 3 + Pinia application instance for each mounting
 * point (sidebar panel, bottom panel, etc.).  Each call returns a fresh app
 * so that multiple tabs can coexist without sharing reactive state.
 *
 * Usage:
 *   import { createMjrApp } from './vue/createVueApp.js'
 *   import AssetsManagerApp from './vue/App.vue'
 *
 *   const { app, pinia } = createMjrApp(AssetsManagerApp)
 *   app.mount(container)
 *   // later:
 *   app.unmount()
 */

import { createApp } from "vue";
import { createPinia } from "pinia";

/**
 * Creates a self-contained Vue + Pinia application.
 *
 * @param {object} rootComponent  - Vue component to use as the root.
 * @param {object} [props]        - Optional props passed to the root component.
 * @returns {{ app: import('vue').App, pinia: import('pinia').Pinia }}
 */
export function createMjrApp(rootComponent, props = undefined) {
    const pinia = createPinia();
    const app = createApp(rootComponent, props);
    app.use(pinia);
    return { app, pinia };
}

// Map<mountKey, { app, host, container }> — keep a single app/host pair alive
// across ComfyUI render() calls even when the framework swaps the outer
// container element between tab activations.
const _registry = new Map();

function _dispatchKeepAliveAttached(mountKey, host, container) {
    try {
        window.dispatchEvent(
            new CustomEvent("mjr:keepalive-attached", {
                detail: {
                    mountKey: String(mountKey || "_mjrVueApp"),
                    host: host || null,
                    container: container || null,
                },
            }),
        );
    } catch {
        /* ignore */
    }
}

function _createHost(mountKey) {
    const host = document.createElement("div");
    host.dataset.mjrKeepAliveHost = String(mountKey || "_mjrVueApp");
    host.style.height = "100%";
    host.style.width = "100%";
    host.style.minHeight = "0";
    host.style.display = "flex";
    host.style.flexDirection = "column";
    host.style.overflow = "hidden";
    return host;
}

function _attachHost(container, host) {
    if (!container || !host) return;
    // Constrain the ComfyUI-provided container so our host's height:100% works correctly.
    // Without this, the container expands to the full content height (200000+ px),
    // making scroll impossible inside el.mjr-am-grid-scroll.
    container.style.height = "100%";
    container.style.minHeight = "0";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.overflow = "hidden";
    if (container.firstChild === host && container.childNodes.length === 1) return;
    container.replaceChildren(host);
    _dispatchKeepAliveAttached(host?.dataset?.mjrKeepAliveHost, host, container);
}

/**
 * Mount helper that enforces keep-alive semantics.
 *
 * ComfyUI calls `render()` each time the sidebar tab becomes active, and
 * `destroy()` each time it's hidden.  We mount the Vue app only once and
 * keep it alive so that grid state, scroll position and selections survive
 * tab-switch cycles.
 *
 * @param {HTMLElement}  container     - DOM element provided by ComfyUI.
 * @param {object}       component     - Root Vue component.
 * @param {string}       [mountKey]    - Unique key used to identify the app.
 * @returns {boolean} true if a new app was mounted, false if already alive.
 */
export function mountKeepAlive(container, component, mountKey = "_mjrVueApp") {
    if (!container) return false;
    let record = _registry.get(mountKey);
    let created = false;
    if (!record) {
        const host = _createHost(mountKey);
        const { app } = createMjrApp(component);
        app.mount(host);
        record = { app, host, container: null };
        _registry.set(mountKey, record);
        created = true;
    }

    _attachHost(container, record.host);
    record.container = container;
    return created;
}

/**
 * Unmount and clean up a keep-alive Vue app.
 * Call this only when the container is being permanently removed (e.g. during
 * full extension teardown), not on every sidebar tab-switch.
 *
 * @param {HTMLElement} container
 * @param {string}      [mountKey]
 */
export function unmountKeepAlive(container, mountKey = "_mjrVueApp") {
    void container;
    const record = _registry.get(mountKey);
    if (!record?.app) return;
    try {
        record.app.unmount();
    } catch {
        /* ignore */
    }
    try {
        record.host?.remove?.();
    } catch {
        /* ignore */
    }
    _registry.delete(mountKey);
}
