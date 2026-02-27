const RUNTIME_STATE_KEY = Symbol.for("majoor.assets_manager.runtime_state");

function _runtimeRoot() {
    try {
        return typeof globalThis !== "undefined" ? globalThis : {};
    } catch {
        return {};
    }
}

export function getRuntimeState() {
    const root = _runtimeRoot();
    try {
        if (!root[RUNTIME_STATE_KEY] || typeof root[RUNTIME_STATE_KEY] !== "object") {
            root[RUNTIME_STATE_KEY] = {
                api: null,
                assetsDeletedHandler: null,
                enrichmentActive: false,
                enrichmentQueueLength: 0,
            };
        }
        return root[RUNTIME_STATE_KEY];
    } catch {
        return {
            api: null,
            assetsDeletedHandler: null,
            enrichmentActive: false,
            enrichmentQueueLength: 0,
        };
    }
}

export function setRuntimeStatePatch(patch = {}) {
    const state = getRuntimeState();
    try {
        Object.assign(state, patch || {});
    } catch (e) { console.debug?.(e); }
    return state;
}

export function setEnrichmentState(active, queueLength) {
    const state = getRuntimeState();
    state.enrichmentActive = !!active;
    state.enrichmentQueueLength = Math.max(0, Number(queueLength || 0) || 0);
}

export function getEnrichmentState() {
    const state = getRuntimeState();
    return {
        active: !!state.enrichmentActive,
        queueLength: Math.max(0, Number(state.enrichmentQueueLength || 0) || 0),
    };
}
