import { getOptionalRuntimeStore } from "./getOptionalRuntimeStore.js";

const RUNTIME_STATE_KEY = Symbol.for("majoor.assets_manager.runtime_state");

interface LegacyRuntimeState {
    api: unknown;
    assetsDeletedHandler: unknown;
    enrichmentActive: boolean;
    enrichmentQueueLength: number;
}

type RuntimeGlobal = typeof globalThis & {
    [RUNTIME_STATE_KEY]?: LegacyRuntimeState;
};

function createDefaultLegacyRuntimeState(): LegacyRuntimeState {
    return {
        api: null,
        assetsDeletedHandler: null,
        enrichmentActive: false,
        enrichmentQueueLength: 0,
    };
}

function getLegacyRuntimeState(): LegacyRuntimeState {
    try {
        const root: RuntimeGlobal = typeof globalThis !== "undefined" ? globalThis : ({} as RuntimeGlobal);
        if (!root[RUNTIME_STATE_KEY] || typeof root[RUNTIME_STATE_KEY] !== "object") {
            root[RUNTIME_STATE_KEY] = createDefaultLegacyRuntimeState();
        }
        return root[RUNTIME_STATE_KEY];
    } catch {
        return createDefaultLegacyRuntimeState();
    }
}

export function setRuntimeEnrichmentState(active: any, queueLength: any) {
    const store = getOptionalRuntimeStore();
    if (store) {
        store.setEnrichmentState(active, queueLength);
        return;
    }
    const state = getLegacyRuntimeState();
    state.enrichmentActive = !!active;
    state.enrichmentQueueLength = Math.max(0, Number(queueLength || 0) || 0);
}

export function getRuntimeEnrichmentState() {
    const store = getOptionalRuntimeStore();
    if (store) {
        return store.getEnrichmentState();
    }
    const state = getLegacyRuntimeState();
    return {
        active: !!state.enrichmentActive,
        queueLength: Math.max(0, Number(state.enrichmentQueueLength || 0) || 0),
    };
}
