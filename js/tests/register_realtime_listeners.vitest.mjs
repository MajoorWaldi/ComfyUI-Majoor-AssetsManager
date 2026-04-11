import { describe, expect, it, vi } from "vitest";

import { registerRealtimeListeners } from "../features/runtime/registerRealtimeListeners.js";

function ensureBrowserShims() {
    if (typeof globalThis.CustomEvent === "undefined") {
        globalThis.CustomEvent = class CustomEvent {
            constructor(type, init = {}) {
                this.type = type;
                this.detail = init.detail;
            }
        };
    }
    if (typeof globalThis.window === "undefined") {
        globalThis.window = {
            dispatchEvent: () => true,
            addEventListener: () => {},
            removeEventListener: () => {},
        };
    }
}

function createExecutionRuntimeMock({ defer = false, renderable = true } = {}) {
    return {
        prepareLiveAssetEvent(detail) {
            return { detail, defer };
        },
        isRenderableLiveAsset() {
            return renderable;
        },
        handleExecutedEvent() {},
        handleExecutionStart() {},
        handleExecutionEnd() {},
        notifyStacksUpdated() {},
    };
}

function createRuntimeHarness({ defer = false, renderable = true } = {}) {
    const api = {};
    const runtime = {};
    const grid = { dataset: {}, querySelector: () => null };
    const upsertAsset = vi.fn(() => true);
    const pushGeneratedAsset = vi.fn();

    return {
        api,
        runtime,
        grid,
        upsertAsset,
        pushGeneratedAsset,
        executionRuntime: createExecutionRuntimeMock({ defer, renderable }),
    };
}

describe("registerRealtimeListeners", () => {
    it("upsert un asset indexe pour couvrir le flux post-generation", async () => {
        ensureBrowserShims();
        const harness = createRuntimeHarness();

        await registerRealtimeListeners({
            api: harness.api,
            runtime: harness.runtime,
            executionRuntime: harness.executionRuntime,
            appRef: {},
            liveStreamModule: null,
            ensureExecutionRuntime: () => ({ queue_remaining: 0, active_prompt_id: null }),
            emitRuntimeStatus: () => {},
            getActiveGridContainer: () => harness.grid,
            pushGeneratedAsset: harness.pushGeneratedAsset,
            upsertAsset: harness.upsertAsset,
            removeAssetsFromGrid: () => {},
            getEnrichmentState: () => ({ active: false }),
            setEnrichmentState: () => {},
            comfyToast: () => {},
            t: (_k, fallback) => fallback,
            reportError: () => {},
            registerCleanableListener: () => {},
        });

        const detail = {
            id: 42,
            kind: "image",
            filename: "gen_0042.png",
            filepath: "output/gen_0042.png",
            type: "output",
        };

        harness.api._mjrAssetIndexedHandler({ detail });

        expect(harness.pushGeneratedAsset).toHaveBeenCalledTimes(1);
        expect(harness.upsertAsset).toHaveBeenCalledTimes(1);
        expect(harness.upsertAsset).toHaveBeenCalledWith(harness.grid, expect.objectContaining(detail));
    });

    it("upsert un asset indexe differe tout en laissant la finalisation lourde au gate", async () => {
        ensureBrowserShims();
        const harness = createRuntimeHarness({ defer: true });

        await registerRealtimeListeners({
            api: harness.api,
            runtime: harness.runtime,
            executionRuntime: harness.executionRuntime,
            appRef: {},
            liveStreamModule: null,
            ensureExecutionRuntime: () => ({ queue_remaining: 0, active_prompt_id: null }),
            emitRuntimeStatus: () => {},
            getActiveGridContainer: () => harness.grid,
            pushGeneratedAsset: harness.pushGeneratedAsset,
            upsertAsset: harness.upsertAsset,
            removeAssetsFromGrid: () => {},
            getEnrichmentState: () => ({ active: false }),
            setEnrichmentState: () => {},
            comfyToast: () => {},
            t: (_k, fallback) => fallback,
            reportError: () => {},
            registerCleanableListener: () => {},
        });

        harness.api._mjrAssetIndexedHandler({
            detail: {
                id: 43,
                kind: "image",
                filename: "gen_0043.png",
                filepath: "output/gen_0043.png",
                type: "output",
            },
        });

        expect(harness.pushGeneratedAsset).toHaveBeenCalledTimes(1);
        expect(harness.upsertAsset).toHaveBeenCalledTimes(1);
        expect(harness.upsertAsset).toHaveBeenCalledWith(harness.grid, expect.objectContaining({
            id: 43,
            kind: "image",
            filename: "gen_0043.png",
            filepath: "output/gen_0043.png",
            type: "output",
        }));
    });

    it("upsert apres generation puis indexation sur la grille active", async () => {
        ensureBrowserShims();
        window.__mjrLastAssetUpsert = 0;
        window.__mjrLastAssetUpsertCount = 0;

        const harness = createRuntimeHarness();
        harness.grid.dataset = { mjrScope: "output", mjrQuery: "portrait" };

        await registerRealtimeListeners({
            api: harness.api,
            runtime: harness.runtime,
            executionRuntime: harness.executionRuntime,
            appRef: {},
            liveStreamModule: null,
            ensureExecutionRuntime: () => ({ queue_remaining: 0, active_prompt_id: null }),
            emitRuntimeStatus: () => {},
            getActiveGridContainer: () => harness.grid,
            pushGeneratedAsset: harness.pushGeneratedAsset,
            upsertAsset: harness.upsertAsset,
            removeAssetsFromGrid: () => {},
            getEnrichmentState: () => ({ active: false }),
            setEnrichmentState: () => {},
            comfyToast: () => {},
            t: (_k, fallback) => fallback,
            reportError: () => {},
            registerCleanableListener: () => {},
        });

        const detail = {
            id: 44,
            kind: "image",
            filename: "gen_0044.png",
            filepath: "output/gen_0044.png",
            type: "output",
        };

        // Phase generation live: pousse au feed mais n'upsert pas directement quand la query n'est pas "*".
        harness.api._mjrAssetAddedHandler({ detail });
        expect(harness.pushGeneratedAsset).toHaveBeenCalledTimes(1);
        expect(harness.upsertAsset).toHaveBeenCalledTimes(0);

        // Phase indexation: l'asset final est upsert dans la grille active.
        harness.api._mjrAssetIndexedHandler({ detail });
        expect(harness.pushGeneratedAsset).toHaveBeenCalledTimes(2);
        expect(harness.upsertAsset).toHaveBeenCalledTimes(1);
        expect(harness.upsertAsset).toHaveBeenCalledWith(harness.grid, expect.objectContaining(detail));
        expect(Number(window.__mjrLastAssetUpsertCount || 0)).toBeGreaterThan(0);
    });

    it("synchronise l etat d execution vers le backend au start et a la fin", async () => {
        ensureBrowserShims();
        const harness = createRuntimeHarness();
        const syncExecutionBackendState = vi.fn(() => Promise.resolve());

        await registerRealtimeListeners({
            api: harness.api,
            runtime: harness.runtime,
            executionRuntime: harness.executionRuntime,
            appRef: {},
            liveStreamModule: null,
            ensureExecutionRuntime: () => ({ queue_remaining: 0, active_prompt_id: null }),
            emitRuntimeStatus: () => {},
            getActiveGridContainer: () => harness.grid,
            pushGeneratedAsset: harness.pushGeneratedAsset,
            upsertAsset: harness.upsertAsset,
            removeAssetsFromGrid: () => {},
            getEnrichmentState: () => ({ active: false }),
            setEnrichmentState: () => {},
            comfyToast: () => {},
            t: (_k, fallback) => fallback,
            reportError: () => {},
            registerCleanableListener: () => {},
            syncExecutionBackendState,
        });

        harness.api._mjrExecutionStartHandler({ detail: { prompt_id: "job-1" } });
        harness.api._mjrExecutionEndHandler({ detail: { prompt_id: "job-1" } });

        expect(syncExecutionBackendState).toHaveBeenNthCalledWith(1, {
            active: true,
            promptId: "job-1",
        });
        expect(syncExecutionBackendState).toHaveBeenNthCalledWith(2, {
            active: false,
            promptId: "job-1",
        });
    });
});
