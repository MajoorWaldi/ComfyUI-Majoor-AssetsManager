/**
 * NodeStreamRegistry — adapter registry for the Node Stream system.
 *
 * Each adapter declares which ComfyUI node class_types it can handle and how
 * to extract viewable media from the node's output.  The registry resolves the
 * best adapter for a given node type at runtime.
 *
 * Adapters are matched in priority order (highest first).  The first adapter
 * whose `canHandle(classType, outputs)` returns true wins.
 *
 * Third-party code can register additional adapters at any time via
 * `registerAdapter()` — no existing code needs to change.
 */

/** @typedef {import("./adapters/BaseAdapter.js").NodeStreamAdapter} NodeStreamAdapter */

/** @type {NodeStreamAdapter[]} sorted by priority descending */
const _adapters = [];

/** Dirty flag — set when an adapter is added/removed so the sorted list is rebuilt. */
let _dirty = false;

function _ensureSorted() {
    if (!_dirty) return;
    _adapters.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    _dirty = false;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Register a new adapter.  Duplicates (same `name`) are silently replaced.
 * @param {NodeStreamAdapter} adapter
 */
export function registerAdapter(adapter) {
    if (!adapter?.name) {
        console.warn("[NodeStream] Cannot register adapter without a name");
        return;
    }
    // Replace existing adapter with the same name (hot-reload friendly)
    const idx = _adapters.findIndex((a) => a.name === adapter.name);
    if (idx >= 0) _adapters.splice(idx, 1);
    _adapters.push(adapter);
    _dirty = true;
    console.debug(`[NodeStream] Adapter registered: ${adapter.name} (priority ${adapter.priority ?? 0})`);
}

/**
 * Remove an adapter by name.
 * @param {string} name
 */
export function unregisterAdapter(name) {
    const idx = _adapters.findIndex((a) => a.name === name);
    if (idx >= 0) {
        _adapters.splice(idx, 1);
        _dirty = true;
    }
}

/**
 * Find the best adapter for a given node class type and its outputs.
 * @param {string} classType  ComfyUI node class_type (e.g. "SaveImage", "LayerColorCorrection")
 * @param {object} outputs    The outputs object from onNodeOutputsUpdated for this node
 * @returns {NodeStreamAdapter | null}
 */
export function findAdapter(classType, outputs) {
    _ensureSorted();
    for (const adapter of _adapters) {
        try {
            if (adapter.canHandle(classType, outputs)) return adapter;
        } catch (e) {
            console.debug?.(`[NodeStream] adapter.canHandle error (${adapter.name})`, e);
        }
    }
    return null;
}

/**
 * Return a snapshot of all registered adapters (for debug / UI listing).
 * @returns {ReadonlyArray<{name: string, priority: number, description: string}>}
 */
export function listAdapters() {
    _ensureSorted();
    return _adapters.map((a) => ({
        name: a.name,
        priority: a.priority ?? 0,
        description: a.description ?? "",
    }));
}
