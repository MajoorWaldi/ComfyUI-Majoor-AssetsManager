import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";

import { getEnrichmentState, setEnrichmentState } from "../app/runtimeState.js";
import { getOptionalRuntimeStore } from "../stores/getOptionalRuntimeStore.js";
import {
    getRuntimeEnrichmentState,
    setRuntimeEnrichmentState,
} from "../stores/runtimeEnrichmentState.js";
import { useRuntimeStore } from "../stores/useRuntimeStore.js";

describe("runtime store", () => {
    beforeEach(() => {
        setActivePinia(undefined);
    });

    it("returns null when Pinia is not active", () => {
        expect(getOptionalRuntimeStore()).toBeNull();
    });

    it("tracks execution status and computed progress", () => {
        setActivePinia(createPinia());
        const store = useRuntimeStore();

        store.setComfyApp({ id: "app" });
        store.setComfyApi({ id: "api" });
        store.applyExecutionStatus({
            active_prompt_id: "prompt-1",
            queue_remaining: 4,
            progress_node: "node-7",
            progress_value: 3,
            progress_max: 6,
            cached_nodes: ["a", "b"],
        });

        expect(store.comfyApp).toEqual({ id: "app" });
        expect(store.comfyApi).toEqual({ id: "api" });
        expect(store.isExecuting).toBe(true);
        expect(store.progressPercent).toBe(50);
        expect(store.queueRemaining).toBe(4);
        expect(store.cachedNodes).toEqual(["a", "b"]);

        store.resetExecution();
        expect(store.isExecuting).toBe(false);
        expect(store.progressPercent).toBe(0);
        expect(store.queueRemaining).toBeNull();
        expect(store.cachedNodes).toEqual([]);
    });

    it("lets runtimeState shim read and write enrichment state through Pinia", () => {
        setActivePinia(createPinia());
        const store = useRuntimeStore();

        expect(getEnrichmentState()).toEqual({ active: false, queueLength: 0 });

        setEnrichmentState(true, 3);

        expect(store.getEnrichmentState()).toEqual({ active: true, queueLength: 3 });
        expect(getEnrichmentState()).toEqual({ active: true, queueLength: 3 });
    });

    it("exposes enrichment helpers directly from the store bridge", () => {
        setActivePinia(createPinia());
        const store = useRuntimeStore();

        expect(getRuntimeEnrichmentState()).toEqual({ active: false, queueLength: 0 });

        setRuntimeEnrichmentState(true, 7);

        expect(store.getEnrichmentState()).toEqual({ active: true, queueLength: 7 });
        expect(getRuntimeEnrichmentState()).toEqual({ active: true, queueLength: 7 });
    });
});
