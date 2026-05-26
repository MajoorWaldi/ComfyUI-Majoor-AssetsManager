/**
 * NodeStreamRegistry â€” adapter registry for the Node Stream system.
 *
 * Each adapter declares which ComfyUI node class_types it can handle and how
 * to extract viewable media from the node's output.  The registry resolves the
 * best adapter for a given node type at runtime.
 *
 * Adapters are matched in priority order (highest first).  The first adapter
 * whose `canHandle(classType, outputs)` returns true wins.
 *
 * The registry remains available for built-in compatibility coverage and
 * debug inspection, but third-party adapter registration is not part of the
 * active selection-only Node Stream public contract.
 */

/** @typedef {import("./adapters/BaseAdapter.js").NodeStreamAdapter} NodeStreamAdapter */

/** @type {NodeStreamAdapter[]} sorted by priority descending */
const _adapters: any[] = [];

/** Dirty flag â€” set when an adapter is added/removed so the sorted list is rebuilt. */
let _dirty = false;

function _ensureSorted() {
    if (!_dirty) return;
    _adapters.sort((a: any, b: any) => (b.priority ?? 0) - (a.priority ?? 0));
    _dirty = false;
}

// â”€â”€ Public API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Register a new adapter for internal compatibility/debug purposes.
 * @param {NodeStreamAdapter} adapter
 */
export function registerAdapter(adapter: any): void {
    if (!adapter?.name) {
        console.warn("[NodeStream] Cannot register adapter without a name");
        return;
    }
    // Replace existing adapter with the same name (hot-reload friendly)
    const idx = _adapters.findIndex((a: any) => a.name === adapter.name);
    if (idx >= 0) _adapters.splice(idx, 1);
    _adapters.push(adapter);
    _dirty = true;
    console.debug(
        `[NodeStream] Adapter registered: ${adapter.name} (priority ${adapter.priority ?? 0})`,
    );
}

/**
 * Remove an adapter by name.
 * @param {string} name
 */
export function unregisterAdapter(name: string): void {
    const idx = _adapters.findIndex((a: any) => a.name === name);
    if (idx >= 0) {
        _adapters.splice(idx, 1);
        _dirty = true;
    }
}

/**
 * Find the best adapter in the compatibility registry.
 * @param {string} classType  ComfyUI node class_type (e.g. "SaveImage", "LayerColorCorrection")
 * @param {object} outputs    The outputs object from onNodeOutputsUpdated for this node
 * @returns {NodeStreamAdapter | null}
 */
export function findAdapter(classType: string, outputs: any): any {
    _ensureSorted();
    for (const adapter of _adapters) {
        try {
            if (adapter.canHandle(classType, outputs)) return adapter;
        } catch (e: any) {
            console.debug?.(`[NodeStream] adapter.canHandle error (${adapter.name})`, e);
        }
    }
    return null;
}

/**
 * Return a snapshot of all registered adapters (for debug / UI listing).
 * @returns {ReadonlyArray<{name: string, priority: number, description: string}>}
 */
export function listAdapters(): unknown[] {
    _ensureSorted();
    return _adapters.map((a: any) => ({
        name: a.name,
        priority: a.priority ?? 0,
        description: a.description ?? "",
    }));
}
