import { beforeEach, describe, expect, it, vi } from "vitest";

import { EVENTS } from "../app/events.js";
import { APP_CONFIG } from "../app/config.js";
import { registerRealtimeListeners } from "../features/runtime/registerRealtimeListeners.js";
import {
    getSidebarAssetBadgeCount,
    resetSidebarAssetBadge,
} from "../features/runtime/sidebarAssetBadge.js";

function ensureBrowserShims() {
    if (typeof globalThis.CustomEvent === "undefined") {
        globalThis.CustomEvent = (class CustomEvent {
            constructor(type, init = {}) {
                (this as any).type = type;
                (this as any).detail = (init as any).detail;
            }
        } as any);
    }
    if (typeof globalThis.window === "undefined") {
        globalThis.window = ({
            dispatchEvent: () => true,
            addEventListener: () => {},
            removeEventListener: () => {},
        } as any);
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
    const upsertAssetNow = vi.fn(() => true);
    const pushGeneratedAsset = vi.fn();

    return {
        api,
        runtime,
        grid,
        upsertAsset,
        upsertAssetNow,
        pushGeneratedAsset,
        executionRuntime: createExecutionRuntimeMock({ defer, renderable }),
    };
}

describe("registerRealtimeListeners", () => {
    beforeEach(() => {
        APP_CONFIG.SIDEBAR_ASSET_BADGE_ENABLED = true;
        resetSidebarAssetBadge();
    });

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

        (harness.api as any)._mjrAssetIndexedHandler({ detail });

        expect(harness.pushGeneratedAsset).toHaveBeenCalledTimes(1);
        expect(harness.upsertAsset).toHaveBeenCalledTimes(1);
        expect(harness.upsertAsset).toHaveBeenCalledWith(
            harness.grid,
            expect.objectContaining(detail),
        );
    });

    it("ignore un asset indexe differe jusqu a la finalisation du gate", async () => {
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

        (harness.api as any)._mjrAssetIndexedHandler({
            detail: {
                id: 43,
                kind: "image",
                filename: "gen_0043.png",
                filepath: "output/gen_0043.png",
                type: "output",
            },
        });

        expect(harness.pushGeneratedAsset).not.toHaveBeenCalled();
        expect(harness.upsertAsset).not.toHaveBeenCalled();
    });

    it("upsert apres generation puis indexation sur la grille active", async () => {
        ensureBrowserShims();
        (window as any).__mjrLastAssetUpsert = 0;
        (window as any).__mjrLastAssetUpsertCount = 0;

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
        (harness.api as any)._mjrAssetAddedHandler({ detail });
        expect(harness.pushGeneratedAsset).toHaveBeenCalledTimes(1);
        expect(harness.upsertAsset).toHaveBeenCalledTimes(0);
        expect(getSidebarAssetBadgeCount()).toBe(0);

        // Phase indexation: l'asset final est upsert dans la grille active.
        (harness.api as any)._mjrAssetIndexedHandler({ detail });
        expect(harness.pushGeneratedAsset).toHaveBeenCalledTimes(2);
        expect(harness.upsertAsset).toHaveBeenCalledTimes(1);
        expect(harness.upsertAsset).toHaveBeenCalledWith(
            harness.grid,
            expect.objectContaining(detail),
        );
        expect(Number((window as any).__mjrLastAssetUpsertCount || 0)).toBeGreaterThan(0);
        expect(getSidebarAssetBadgeCount()).toBe(1);
    });

    it("alimente le feed meme sans grille active", async () => {
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
            getActiveGridContainer: () => null,
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
            id: 45,
            kind: "image",
            filename: "gen_0045.png",
            filepath: "output/gen_0045.png",
            type: "output",
        };

        (harness.api as any)._mjrAssetIndexedHandler({ detail });

        expect(harness.pushGeneratedAsset).toHaveBeenCalledTimes(1);
        expect(harness.pushGeneratedAsset).toHaveBeenCalledWith(expect.objectContaining(detail));
        expect(harness.upsertAsset).not.toHaveBeenCalled();
    });

    it("upsert un placeholder live instantane des la sortie executed", async () => {
        ensureBrowserShims();
        const harness = createRuntimeHarness();
        harness.grid.dataset = { mjrScope: "output", mjrQuery: "portrait" };

        const registered = [];
        const registerCleanableListener = (_runtime, target, event, handler) => {
            registered.push({ target, event, handler });
        };

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
            upsertAssetNow: harness.upsertAssetNow,
            removeAssetsFromGrid: () => {},
            getEnrichmentState: () => ({ active: false }),
            setEnrichmentState: () => {},
            comfyToast: () => {},
            t: (_k, fallback) => fallback,
            reportError: () => {},
            registerCleanableListener,
        });

        const liveHandler = registered.find(
            (entry) => entry.target === window && entry.event === EVENTS.NEW_GENERATION_OUTPUT,
        )?.handler;
        expect(typeof liveHandler).toBe("function");

        liveHandler({
            detail: {
                prompt_id: "job-live-1",
                files: [
                    {
                        filename: "gen_live_0001.png",
                        subfolder: "ComfyUI",
                        type: "output",
                        generation_time_ms: 1234,
                    },
                ],
            },
        });

        expect(harness.upsertAssetNow).toHaveBeenCalledTimes(1);
        expect(harness.upsertAssetNow).toHaveBeenCalledWith(
            harness.grid,
            expect.objectContaining({
                id: expect.stringMatching(/^live:/),
                filename: "gen_live_0001.png",
                subfolder: "ComfyUI",
                type: "output",
                source: "output",
                kind: "image",
                job_id: "job-live-1",
                generation_time_ms: 1234,
                is_live_placeholder: true,
                _mjrLivePlaceholder: true,
                _mjrLiveLabel: "In progress",
            }),
        );
        expect(harness.upsertAsset).not.toHaveBeenCalled();
    });

    it("classe les sorties live opus, aac, m4a et exr avec le bon kind", async () => {
        ensureBrowserShims();
        const harness = createRuntimeHarness();
        harness.grid.dataset = { mjrScope: "output", mjrQuery: "" };

        const registered = [];
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
            upsertAssetNow: harness.upsertAssetNow,
            removeAssetsFromGrid: () => {},
            getEnrichmentState: () => ({ active: false }),
            setEnrichmentState: () => {},
            comfyToast: () => {},
            t: (_k, fallback) => fallback,
            reportError: () => {},
            registerCleanableListener: (_runtime, target, event, handler) => {
                registered.push({ target, event, handler });
            },
        });
        const liveHandler = registered.find(
            (entry) => entry.target === window && entry.event === EVENTS.NEW_GENERATION_OUTPUT,
        )?.handler;

        const expectations = {
            "track_00001.opus": "audio",
            "track_00002.aac": "audio",
            "track_00003.m4a": "audio",
            "render_00001.exr": "image",
        };
        for (const [filename, kind] of Object.entries(expectations)) {
            harness.upsertAssetNow.mockClear();
            liveHandler({
                detail: { prompt_id: "job-kinds", files: [{ filename, subfolder: "", type: "output" }] },
            });
            expect(harness.upsertAssetNow).toHaveBeenCalledWith(
                harness.grid,
                expect.objectContaining({ filename, kind }),
            );
        }
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

        (harness.api as any)._mjrExecutionStartHandler({ detail: { prompt_id: "job-1" } });
        (harness.api as any)._mjrExecutionEndHandler({ detail: { prompt_id: "job-1" } });

        expect(syncExecutionBackendState).toHaveBeenNthCalledWith(1, {
            active: true,
            promptId: "job-1",
        });
        expect(syncExecutionBackendState).toHaveBeenNthCalledWith(2, {
            active: false,
            promptId: "job-1",
        });
    });

    it("recharge la grille quand les assets core de l execution sont prets", async () => {
        ensureBrowserShims();
        const harness = createRuntimeHarness();
        const dispatched = [];
        const previousDispatch = window.dispatchEvent;
        window.dispatchEvent = (event) => {
            dispatched.push(event);
            return true;
        };

        try {
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

            (harness.api as any)._mjrCoreExecutionAssetsReadyHandler({
                detail: { prompt_id: "job-2", indexed: 2 },
            });
        } finally {
            window.dispatchEvent = previousDispatch;
        }

        expect(dispatched.map((event) => event.type)).toContain(
            EVENTS.CORE_EXECUTION_ASSETS_READY,
        );
        expect(dispatched).toContainEqual(
            expect.objectContaining({
                type: EVENTS.RELOAD_GRID,
                detail: expect.objectContaining({
                    reason: "core-execution-assets-ready",
                    prompt_id: "job-2",
                    indexed: 2,
                }),
            }),
        );
    });
    describe("scan and removal surfaces", () => {
        let dispatched: any[];
        let toast: any;
        let harness: any;

        beforeEach(async () => {
            ensureBrowserShims();
            dispatched = [];
            (globalThis as any).window.dispatchEvent = (event: any) => {
                dispatched.push(event);
                return true;
            };
            (globalThis as any)._mjrMaintenanceActive = false;
            toast = vi.fn();
            harness = createRuntimeHarness();
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
                comfyToast: toast,
                t: (_k: any, fallback: any, params: any) =>
                    String(fallback).replace(/\{(\w+)\}/g, (_m: any, k: any) => String(params?.[k] ?? "")),
                reportError: () => {},
                registerCleanableListener: () => {},
            });
        });

        const ofType = (type: string) => dispatched.filter((e) => e?.type === type);

        it("summarises a directory scan in one core toast and reloads the grid once", () => {
            (harness.api as any)._mjrScanCompleteHandler({
                detail: { origin: "directory_scan", added: 12, pruned: 3, needs_refresh: true },
            });

            expect(ofType(EVENTS.RELOAD_GRID)).toHaveLength(1);
            expect(toast).toHaveBeenCalledTimes(1);
            expect(toast.mock.calls[0][0]).toMatchObject({ detail: "12 new, 3 removed" });
            expect(toast.mock.calls[0][1]).toBe("success");
        });

        it("stays silent for per-generation index_paths runs covered by live events", () => {
            (harness.api as any)._mjrScanCompleteHandler({
                detail: { origin: "index_paths", added: 1, pruned: 0, needs_refresh: false },
            });

            expect(ofType(EVENTS.RELOAD_GRID)).toHaveLength(0);
            expect(toast).not.toHaveBeenCalled();
        });

        it("does not toast or reload during DB maintenance", () => {
            (globalThis as any)._mjrMaintenanceActive = true;
            (harness.api as any)._mjrScanCompleteHandler({
                detail: { origin: "directory_scan", added: 50, needs_refresh: true },
            });
            (globalThis as any)._mjrMaintenanceActive = false;

            expect(ofType(EVENTS.RELOAD_GRID)).toHaveLength(0);
            expect(toast).not.toHaveBeenCalled();
        });

        it("turns backend removals into the same in-place card removal as UI deletes", () => {
            (harness.api as any)._mjrAssetsRemovedHandler({
                detail: { ids: [7, 9], count: 2, reason: "file_deleted" },
            });

            const deleted = ofType(EVENTS.ASSETS_DELETED);
            expect(deleted).toHaveLength(1);
            expect(deleted[0].detail.ids).toEqual(["7", "9"]);
            expect(ofType(EVENTS.RELOAD_GRID)).toHaveLength(0);

            (harness.api as any)._mjrAssetsRemovedHandler({
                detail: { ids: [1], count: 5000, truncated: true, reason: "scan_prune" },
            });
            expect(ofType(EVENTS.RELOAD_GRID)).toHaveLength(1);
        });
    });
});
