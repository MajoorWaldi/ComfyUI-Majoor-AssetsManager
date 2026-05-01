import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ensureWindowStub, mockPartialVue } from "./helpers/vitestEnvironment.mjs";

const fetchGridPageMock = vi.hoisted(() => vi.fn());
const appendAssetsMock = vi.hoisted(() => vi.fn());

function makeStorage() {
    const data = new Map();
    return {
        getItem: vi.fn((key) => data.get(String(key)) ?? null),
        setItem: vi.fn((key, value) => data.set(String(key), String(value))),
        removeItem: vi.fn((key) => data.delete(String(key))),
        clear: vi.fn(() => data.clear()),
    };
}

mockPartialVue({
    nextTick: async () => {},
    reactive: (obj) => obj,
});

vi.mock("../api/client.js", () => ({
    get: vi.fn(),
}));

vi.mock("../app/config.js", () => ({
    APP_DEFAULTS: {
        DEFAULT_PAGE_SIZE: 100,
        MAX_PAGE_SIZE: 2000,
    },
    APP_CONFIG: {
        DEFAULT_PAGE_SIZE: 100,
        MAX_PAGE_SIZE: 2000,
        PREFETCH_NEXT_PAGE: true,
        PREFETCH_NEXT_PAGE_DELAY_MS: 700,
    },
}));

vi.mock("../app/settings.js", () => ({
    loadMajoorSettings: vi.fn(() => ({})),
}));

vi.mock("../components/Badges.js", () => ({
    setFileBadgeCollision: vi.fn(),
}));

vi.mock("../utils/ids.js", () => ({
    pickRootId: vi.fn(() => "root"),
}));

vi.mock("../features/grid/AssetCardRenderer.js", () => ({
    appendAssets: appendAssetsMock,
}));

vi.mock("../features/grid/StackGroupCards.js", () => ({
    getStackAwareAssetKey: vi.fn((_grid, _asset, fallback) => fallback),
    ensureDupStackCard: vi.fn(),
    disposeStackGroupCards: vi.fn(),
}));

vi.mock("../vue/composables/useVirtualGrid.js", async () => {
    const actual = await vi.importActual("../vue/composables/useVirtualGrid.js");
    return {
        ...actual,
        compareAssets: vi.fn(() => 0),
        fetchPage: fetchGridPageMock,
        getUpsertBatchState: vi.fn(() => null),
        queueUpsertAsset: vi.fn(() => false),
    };
});

function createVisibleElement({ dataset = {}, scrollTop = 0 } = {}) {
    return {
        dataset,
        scrollTop,
        isConnected: true,
        clientWidth: 320,
        clientHeight: 240,
        getClientRects: vi.fn(() => [{ width: 320, height: 240 }]),
    };
}

describe("useGridLoader adaptive paging", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        vi.useRealTimers();
        globalThis.sessionStorage = makeStorage();
        globalThis.localStorage = makeStorage();
        ensureWindowStub();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("increases page size when successive pages add no visible cards", async () => {
        const { useGridLoader } = await import("../vue/composables/useGridLoader.js");

        const requestedLimits = [];
        const requestedOffsets = [];
        fetchGridPageMock.mockImplementation(async (_grid, _query, limit, offset) => {
            requestedLimits.push(limit);
            requestedOffsets.push(offset);
            return {
                ok: true,
                assets: [{ id: `${offset}-${limit}` }],
                total: 7000,
                count: limit,
                limit,
                offset,
            };
        });

        appendAssetsMock.mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValueOnce(1);

        const state = {
            loading: false,
            done: false,
            total: 7000,
            offset: 0,
            requestId: 1,
            abortController: null,
            assets: [],
            activeId: "",
            statusMessage: "",
            statusError: false,
        };

        const gridContainer = createVisibleElement({ dataset: {} });
        const scrollElement = createVisibleElement();
        const loader = useGridLoader({
            gridContainerRef: { value: gridContainer },
            state,
            setLoadingMessage: vi.fn(),
            clearLoadingMessage: vi.fn(),
            setStatusMessage: vi.fn(),
            clearStatusMessage: vi.fn(),
            resetAssets: vi.fn(),
            setSelection: vi.fn(),
            reconcileSelection: vi.fn(),
            readScrollElement: () => scrollElement,
            readRenderedCards: () => [],
            scrollToAssetId: vi.fn(),
        });

        const result = await loader.loadNextPage();

        expect(result.ok).toBe(true);
        expect(requestedLimits).toEqual([100, 200, 400]);
        expect(requestedOffsets).toEqual([0, 100, 300]);
        expect(state.offset).toBe(700);
    });

    it("schedules another page attempt when consumed pages add no visible cards", async () => {
        vi.useFakeTimers();
        const { useGridLoader } = await import("../vue/composables/useGridLoader.js");

        const requestedOffsets = [];
        fetchGridPageMock.mockImplementation(async (_grid, _query, limit, offset) => {
            requestedOffsets.push(offset);
            return {
                ok: true,
                assets: Array.from({ length: limit }, (_, index) => ({
                    id: `${offset}-${index}`,
                })),
                total: 8000,
                count: limit,
                limit,
                offset,
            };
        });
        appendAssetsMock.mockReturnValue(0);

        const state = {
            loading: false,
            done: false,
            total: 8000,
            offset: 0,
            requestId: 1,
            abortController: null,
            query: "*",
            assets: [],
            activeId: "",
            statusMessage: "",
            statusError: false,
        };

        const loader = useGridLoader({
            gridContainerRef: { value: createVisibleElement({ dataset: {} }) },
            state,
            setLoadingMessage: vi.fn(),
            clearLoadingMessage: vi.fn(),
            setStatusMessage: vi.fn(),
            clearStatusMessage: vi.fn(),
            resetAssets: vi.fn(),
            setSelection: vi.fn(),
            reconcileSelection: vi.fn(),
            readScrollElement: () => createVisibleElement(),
            readRenderedCards: () => [],
            scrollToAssetId: vi.fn(),
        });

        const result = await loader.loadNextPage();

        expect(result).toMatchObject({ ok: true, skippedEmpty: true });
        expect(requestedOffsets).toEqual([0, 100, 300, 700, 1500, 3100]);

        await vi.advanceTimersByTimeAsync(251);
        await Promise.resolve();
        await Promise.resolve();

        expect(requestedOffsets.length).toBeGreaterThan(6);
    });

    it("does not stop infinite scroll when default output browse returns a page-sized total", async () => {
        const { useGridLoader } = await import("../vue/composables/useGridLoader.js");

        const requestedOffsets = [];
        fetchGridPageMock.mockImplementation(async (_grid, _query, limit, offset) => {
            requestedOffsets.push(offset);
            if (offset === 0) {
                return {
                    ok: true,
                    assets: Array.from({ length: 8 }, (_, index) => ({ id: `asset-${index}` })),
                    total: 8,
                    count: 8,
                    limit,
                    offset,
                };
            }
            return {
                ok: true,
                assets: [{ id: "asset-8" }],
                total: null,
                count: 1,
                limit,
                offset,
            };
        });
        appendAssetsMock.mockImplementation((_grid, assets, state) => {
            state.assets.push(...assets);
            return assets.length;
        });

        const state = {
            loading: false,
            done: false,
            total: null,
            offset: 0,
            requestId: 1,
            abortController: null,
            query: "*",
            assets: [],
            activeId: "",
            statusMessage: "",
            statusError: false,
        };
        const loader = useGridLoader({
            gridContainerRef: {
                value: createVisibleElement({
                    dataset: {
                        mjrScope: "output",
                        mjrQuery: "*",
                        mjrSort: "mtime_desc",
                    },
                }),
            },
            state,
            setLoadingMessage: vi.fn(),
            clearLoadingMessage: vi.fn(),
            setStatusMessage: vi.fn(),
            clearStatusMessage: vi.fn(),
            resetAssets: vi.fn(),
            setSelection: vi.fn(),
            reconcileSelection: vi.fn(),
            readScrollElement: () => createVisibleElement(),
            readRenderedCards: () => [],
            scrollToAssetId: vi.fn(),
        });

        await loader.loadNextPage();

        expect(state.offset).toBe(8);
        expect(state.total).toBeNull();
        expect(state.done).toBe(false);

        await loader.loadNextPage();

        expect(requestedOffsets).toEqual([0, 8]);
        expect(state.assets).toHaveLength(9);
    });

    it("keeps append paging from resetting scroll or selection", async () => {
        const { useGridLoader } = await import("../vue/composables/useGridLoader.js");

        fetchGridPageMock.mockResolvedValue({
            ok: true,
            assets: [{ id: "asset-2", filename: "two.png" }],
            total: 20,
            count: 1,
            limit: 100,
            offset: 1,
        });
        appendAssetsMock.mockImplementation((_grid, assets, state) => {
            state.assets.push(...assets);
            return assets.length;
        });

        const state = {
            loading: false,
            done: false,
            total: 20,
            offset: 1,
            requestId: 1,
            abortController: null,
            query: "*",
            assets: [{ id: "asset-1", filename: "one.png" }],
            selectedIds: ["asset-10"],
            activeId: "asset-10",
            selectionAnchorId: "asset-10",
            statusMessage: "",
            statusError: false,
        };
        const scrollElement = createVisibleElement({ scrollTop: 420 });
        scrollElement.scrollHeight = 2000;
        const resetAssets = vi.fn();
        const reconcileSelection = vi.fn();
        const setSelection = vi.fn((ids, activeId) => {
            state.selectedIds = ids;
            state.activeId = activeId;
        });
        const loader = useGridLoader({
            gridContainerRef: { value: createVisibleElement({ dataset: {} }) },
            state,
            setLoadingMessage: vi.fn(),
            clearLoadingMessage: vi.fn(),
            setStatusMessage: vi.fn(),
            clearStatusMessage: vi.fn(),
            resetAssets,
            setSelection,
            reconcileSelection,
            readScrollElement: () => scrollElement,
            readRenderedCards: () => [],
            scrollToAssetId: vi.fn(),
        });

        const result = await loader.appendNextPage();

        expect(result.ok).toBe(true);
        expect(resetAssets).not.toHaveBeenCalled();
        expect(reconcileSelection).not.toHaveBeenCalled();
        expect(scrollElement.scrollTop).toBe(420);
        expect(state.selectedIds).toEqual(["asset-10"]);
        expect(state.activeId).toBe("asset-10");
    });

    it("does not force the old scroll position back when the user scrolls during pagination", async () => {
        const { useGridLoader } = await import("../vue/composables/useGridLoader.js");

        let resolvePage;
        fetchGridPageMock.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolvePage = resolve;
                }),
        );
        appendAssetsMock.mockImplementation((_grid, assets, state) => {
            state.assets.push(...assets);
            return assets.length;
        });

        const state = {
            loading: false,
            done: false,
            total: 20,
            offset: 1,
            requestId: 1,
            abortController: null,
            query: "*",
            assets: [{ id: "asset-1", filename: "one.png" }],
            selectedIds: [],
            activeId: "",
            statusMessage: "",
            statusError: false,
        };
        const scrollElement = new EventTarget();
        scrollElement.scrollTop = 420;
        scrollElement.scrollHeight = 2000;
        scrollElement.clientHeight = 500;
        scrollElement.clientWidth = 320;
        scrollElement.isConnected = true;
        scrollElement.getClientRects = vi.fn(() => [{ width: 320, height: 500 }]);

        const loader = useGridLoader({
            gridContainerRef: { value: createVisibleElement({ dataset: {} }) },
            state,
            setLoadingMessage: vi.fn(),
            clearLoadingMessage: vi.fn(),
            setStatusMessage: vi.fn(),
            clearStatusMessage: vi.fn(),
            resetAssets: vi.fn(),
            setSelection: vi.fn(),
            reconcileSelection: vi.fn(),
            readScrollElement: () => scrollElement,
            readRenderedCards: () => [],
            scrollToAssetId: vi.fn(),
        });

        const pending = loader.appendNextPage();
        scrollElement.scrollTop = 900;
        scrollElement.dispatchEvent(new Event("scroll"));
        resolvePage({
            ok: true,
            assets: [{ id: "asset-2", filename: "two.png" }],
            total: 20,
            count: 1,
            limit: 100,
            offset: 1,
        });
        await pending;

        expect(scrollElement.scrollTop).toBe(900);
    });

    it("does not prune unloaded selections after a partial reload", async () => {
        const { useGridLoader } = await import("../vue/composables/useGridLoader.js");

        fetchGridPageMock.mockResolvedValue({
            ok: true,
            assets: [{ id: "asset-1", filename: "one.png" }],
            total: 500,
            count: 1,
            limit: 100,
            offset: 0,
        });
        appendAssetsMock.mockImplementation((_grid, assets, state) => {
            state.assets.push(...assets);
            return assets.length;
        });

        const state = {
            loading: false,
            done: false,
            total: null,
            offset: 0,
            requestId: 1,
            abortController: null,
            query: "*",
            assets: [],
            selectedIds: ["asset-40"],
            activeId: "asset-40",
            statusMessage: "",
            statusError: false,
        };
        const resetAssets = vi.fn(({ query = "*", total = null, done = false } = {}) => {
            state.query = query;
            state.total = total;
            state.done = done;
            state.offset = 0;
            state.assets = [];
        });
        const reconcileSelection = vi.fn();
        const loader = useGridLoader({
            gridContainerRef: { value: createVisibleElement({ dataset: {} }) },
            state,
            setLoadingMessage: vi.fn(),
            clearLoadingMessage: vi.fn(),
            setStatusMessage: vi.fn(),
            clearStatusMessage: vi.fn(),
            resetAssets,
            setSelection: vi.fn(),
            reconcileSelection,
            readScrollElement: () => createVisibleElement(),
            readRenderedCards: () => [],
            scrollToAssetId: vi.fn(),
        });

        await loader.reload("*", { preserveVisibleUntilReady: false });

        expect(reconcileSelection).not.toHaveBeenCalled();
        expect(state.selectedIds).toEqual(["asset-40"]);
        expect(state.activeId).toBe("asset-40");
    });

    it("exposes canonical grid state and debug metrics", async () => {
        const { useGridLoader } = await import("../vue/composables/useGridLoader.js");

        const state = {
            loading: false,
            done: false,
            total: 2,
            offset: 1,
            requestId: 7,
            abortController: null,
            query: "*",
            assets: [{ id: "asset-1", filename: "one.png" }],
            selectedIds: ["asset-1"],
            activeId: "asset-1",
            selectionAnchorId: "asset-1",
            statusMessage: "",
            statusError: false,
        };
        const gridContainer = createVisibleElement({
            dataset: {
                mjrScope: "output",
                mjrQuery: "*",
                mjrSort: "mtime_desc",
                mjrShown: "1",
            },
        });
        const scrollElement = createVisibleElement({ scrollTop: 64 });
        scrollElement.scrollHeight = 512;

        const loader = useGridLoader({
            gridContainerRef: { value: gridContainer },
            state,
            setLoadingMessage: vi.fn(),
            clearLoadingMessage: vi.fn(),
            setStatusMessage: vi.fn(),
            clearStatusMessage: vi.fn(),
            resetAssets: vi.fn(),
            setSelection: vi.fn(),
            reconcileSelection: vi.fn(),
            readScrollElement: () => scrollElement,
            readRenderedCards: () => [],
            scrollToAssetId: vi.fn(),
        });

        expect(loader.getCanonicalState()).toMatchObject({
            pagination: {
                query: "*",
                offset: 1,
                total: 2,
                loading: false,
                done: false,
                requestId: 7,
            },
            selection: {
                selectedIds: ["asset-1"],
                activeId: "asset-1",
                anchorId: "asset-1",
            },
            viewport: {
                scrollTop: 64,
            },
            context: {
                scope: "output",
                query: "*",
                sort: "mtime_desc",
            },
        });
        expect(loader.getDebugSnapshot()).toMatchObject({
            counts: {
                loaded: 1,
                visible: 1,
                total: 2,
            },
            metrics: {
                pagesRequested: 0,
                resetCount: 0,
            },
        });
    });

    it("preserves inline query syntax for advanced search tokens", async () => {
        const { useGridLoader } = await import("../vue/composables/useGridLoader.js");

        fetchGridPageMock.mockResolvedValue({
            ok: true,
            assets: [],
            total: 0,
            count: 0,
            limit: 100,
            offset: 0,
        });
        appendAssetsMock.mockReturnValue(0);

        const state = {
            loading: false,
            done: false,
            total: 0,
            offset: 0,
            requestId: 1,
            abortController: null,
            query: "*",
            assets: [],
            activeId: "",
            statusMessage: "",
            statusError: false,
        };

        const loader = useGridLoader({
            gridContainerRef: { value: createVisibleElement({ dataset: {} }) },
            state,
            setLoadingMessage: vi.fn(),
            clearLoadingMessage: vi.fn(),
            setStatusMessage: vi.fn(),
            clearStatusMessage: vi.fn(),
            resetAssets: vi.fn(({ query = "*", total = null, done = false } = {}) => {
                state.query = query;
                state.total = total;
                state.done = done;
                state.offset = 0;
                state.assets = [];
            }),
            setSelection: vi.fn(),
            reconcileSelection: vi.fn(),
            readScrollElement: () => createVisibleElement(),
            readRenderedCards: () => [],
            scrollToAssetId: vi.fn(),
        });

        const query = 'ext:png rating:5 "speed cinematic push-in"';
        await loader.loadAssets(query, { preserveVisibleUntilReady: false });

        expect(state.query).toBe(query);
        expect(fetchGridPageMock).toHaveBeenCalledWith(
            expect.anything(),
            query,
            expect.any(Number),
            0,
            expect.any(Object),
            expect.any(Object),
        );
    });

    it("does not hydrate persisted grid snapshots while the snapshot cache is disabled", async () => {
        appendAssetsMock.mockImplementation((_grid, assets, state) => {
            state.assets = Array.isArray(assets) ? assets.map((asset) => ({ ...asset })) : [];
            return state.assets.length;
        });

        let module = await import("../vue/composables/useGridLoader.js");
        const gridContainer = createVisibleElement({
            dataset: {
                mjrScope: "output",
                mjrQuery: "*",
                mjrSort: "mtime_desc",
            },
        });
        const scrollElement = createVisibleElement();
        const state1 = {
            loading: false,
            done: false,
            total: 50,
            offset: 2,
            requestId: 1,
            abortController: null,
            query: "*",
            assets: [
                { id: 1, filename: "one.png", kind: "image", source: "output" },
                { id: 2, filename: "two.png", kind: "image", source: "output" },
            ],
            activeId: "",
            statusMessage: "",
            statusError: false,
        };

        const loader1 = module.useGridLoader({
            gridContainerRef: { value: gridContainer },
            state: state1,
            setLoadingMessage: vi.fn(),
            clearLoadingMessage: vi.fn(),
            setStatusMessage: vi.fn(),
            clearStatusMessage: vi.fn(),
            resetAssets: vi.fn(),
            setSelection: vi.fn(),
            reconcileSelection: vi.fn(),
            readScrollElement: () => scrollElement,
            readRenderedCards: () => [],
            scrollToAssetId: vi.fn(),
        });
        loader1.dispose();

        vi.resetModules();
        module = await import("../vue/composables/useGridLoader.js");

        const state2 = {
            loading: false,
            done: false,
            total: null,
            offset: 0,
            requestId: 1,
            abortController: null,
            assets: [],
            activeId: "",
            statusMessage: "",
            statusError: false,
        };
        const resetAssets = vi.fn(({ query = "*", total = null, done = false } = {}) => {
            state2.query = query;
            state2.total = total;
            state2.done = done;
            state2.assets = [];
        });
        const loader2 = module.useGridLoader({
            gridContainerRef: { value: gridContainer },
            state: state2,
            setLoadingMessage: vi.fn(),
            clearLoadingMessage: vi.fn(),
            setStatusMessage: vi.fn(),
            clearStatusMessage: vi.fn(),
            resetAssets,
            setSelection: vi.fn(),
            reconcileSelection: vi.fn(),
            readScrollElement: () => scrollElement,
            readRenderedCards: () => [],
            scrollToAssetId: vi.fn(),
        });

        const restored = await loader2.hydrateFromSnapshot({
            scope: "output",
            query: "*",
            sort: "mtime_desc",
        });

        expect(restored).toBe(false);
        expect(state2.assets).toEqual([]);
        expect(state2.offset).toBe(0);
        expect(state2.total).toBeNull();
        expect(state2.done).toBe(false);
    });

    it("pages through an 8000+ asset library across repeated scroll loads", async () => {
        const { useGridLoader } = await import("../vue/composables/useGridLoader.js");

        const total = 8200;
        const requestedOffsets = [];
        fetchGridPageMock.mockImplementation(async (_grid, _query, limit, offset) => {
            requestedOffsets.push(offset);
            const end = Math.min(total, offset + limit);
            return {
                ok: true,
                assets: Array.from({ length: Math.max(0, end - offset) }, (_, index) => ({
                    id: `asset-${offset + index + 1}`,
                })),
                total,
                count: end - offset,
                limit,
                offset,
            };
        });
        appendAssetsMock.mockImplementation((_grid, assets, state) => {
            const list = Array.isArray(assets) ? assets : [];
            state.assets = [...(Array.isArray(state.assets) ? state.assets : []), ...list];
            return list.length;
        });

        const state = {
            loading: false,
            done: false,
            total,
            offset: 0,
            requestId: 1,
            abortController: null,
            query: "*",
            assets: [],
            activeId: "",
            statusMessage: "",
            statusError: false,
        };

        const loader = useGridLoader({
            gridContainerRef: { value: createVisibleElement({ dataset: {} }) },
            state,
            setLoadingMessage: vi.fn(),
            clearLoadingMessage: vi.fn(),
            setStatusMessage: vi.fn(),
            clearStatusMessage: vi.fn(),
            resetAssets: vi.fn(),
            setSelection: vi.fn(),
            reconcileSelection: vi.fn(),
            readScrollElement: () => createVisibleElement(),
            readRenderedCards: () => [],
            scrollToAssetId: vi.fn(),
        });

        for (let guard = 0; guard < 100 && !state.done; guard += 1) {
            const result = await loader.loadNextPage();
            expect(result.ok).toBe(true);
        }

        expect(state.done).toBe(true);
        expect(state.offset).toBe(total);
        expect(state.assets).toHaveLength(total);
        expect(requestedOffsets.length).toBeGreaterThan(10);
        expect(requestedOffsets.at(-1)).toBe(8200 - 100);
    });

    it("does not replace existing assets from snapshots while the snapshot cache is disabled", async () => {
        appendAssetsMock.mockImplementation((_grid, assets, state) => {
            state.assets = Array.isArray(assets) ? assets.map((asset) => ({ ...asset })) : [];
            return state.assets.length;
        });

        let module = await import("../vue/composables/useGridLoader.js");
        const gridContainer = createVisibleElement({
            dataset: {
                mjrScope: "output",
                mjrQuery: "*",
                mjrSort: "mtime_desc",
            },
        });
        const scrollElement = createVisibleElement();
        const snapshotSeedState = {
            loading: false,
            done: false,
            total: 2,
            offset: 2,
            requestId: 1,
            abortController: null,
            query: "*",
            assets: [
                { id: 1, filename: "out-one.png", kind: "image", source: "output" },
                { id: 2, filename: "out-two.png", kind: "image", source: "output" },
            ],
            activeId: "",
            statusMessage: "",
            statusError: false,
        };

        const seedLoader = module.useGridLoader({
            gridContainerRef: { value: gridContainer },
            state: snapshotSeedState,
            setLoadingMessage: vi.fn(),
            clearLoadingMessage: vi.fn(),
            setStatusMessage: vi.fn(),
            clearStatusMessage: vi.fn(),
            resetAssets: vi.fn(),
            setSelection: vi.fn(),
            reconcileSelection: vi.fn(),
            readScrollElement: () => scrollElement,
            readRenderedCards: () => [],
            scrollToAssetId: vi.fn(),
        });
        seedLoader.dispose();

        vi.resetModules();
        module = await import("../vue/composables/useGridLoader.js");
        appendAssetsMock.mockImplementation((_grid, assets, state) => {
            state.assets = Array.isArray(assets) ? assets.map((asset) => ({ ...asset })) : [];
            return state.assets.length;
        });

        const inputGridContainer = createVisibleElement({
            dataset: {
                mjrScope: "output",
                mjrQuery: "*",
                mjrSort: "mtime_desc",
            },
        });
        const state = {
            loading: false,
            done: false,
            total: 1,
            offset: 1,
            requestId: 1,
            abortController: null,
            query: "*",
            assets: [{ id: 9, filename: "input-one.png", kind: "image", source: "input" }],
            activeId: "",
            statusMessage: "",
            statusError: false,
        };
        const resetAssets = vi.fn(({ query = "*", total = null, done = false } = {}) => {
            state.query = query;
            state.total = total;
            state.done = done;
            state.offset = 0;
            state.assets = [];
        });
        const loader = module.useGridLoader({
            gridContainerRef: { value: inputGridContainer },
            state,
            setLoadingMessage: vi.fn(),
            clearLoadingMessage: vi.fn(),
            setStatusMessage: vi.fn(),
            clearStatusMessage: vi.fn(),
            resetAssets,
            setSelection: vi.fn(),
            reconcileSelection: vi.fn(),
            readScrollElement: () => scrollElement,
            readRenderedCards: () => [],
            scrollToAssetId: vi.fn(),
        });

        const restored = await loader.hydrateFromSnapshot(
            { scope: "output", query: "*", sort: "mtime_desc" },
            { allowReplaceExisting: true },
        );

        expect(restored).toBe(false);
        expect(state.assets.map((asset) => asset.filename)).toEqual(["input-one.png"]);
    });

    it("clears scope-switch assets immediately while grid caches are disabled", async () => {
        const { useGridLoader } = await import("../vue/composables/useGridLoader.js");

        let resolvePage;
        fetchGridPageMock.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolvePage = resolve;
                }),
        );
        appendAssetsMock.mockImplementation((_grid, assets, state) => {
            state.assets = Array.isArray(assets) ? assets.map((asset) => ({ ...asset })) : [];
            return state.assets.length;
        });

        const state = {
            loading: false,
            done: false,
            total: 1,
            offset: 1,
            requestId: 1,
            abortController: new AbortController(),
            query: "*",
            assets: [{ id: "input-1", filename: "input-one.png", kind: "image", source: "input" }],
            activeId: "",
            statusMessage: "",
            statusError: false,
        };
        const gridContainer = createVisibleElement({
            dataset: {
                mjrScope: "output",
                mjrQuery: "*",
                mjrSort: "mtime_desc",
            },
        });
        const scrollElement = createVisibleElement();
        const resetAssets = vi.fn(({ query = "*", total = null, done = false } = {}) => {
            state.query = query;
            state.total = total;
            state.done = done;
            state.offset = 0;
            state.assets = [];
        });

        const loader = useGridLoader({
            gridContainerRef: { value: gridContainer },
            state,
            setLoadingMessage: vi.fn(),
            clearLoadingMessage: vi.fn(),
            setStatusMessage: vi.fn(),
            clearStatusMessage: vi.fn(),
            resetAssets,
            setSelection: vi.fn(),
            reconcileSelection: vi.fn(),
            readScrollElement: () => scrollElement,
            readRenderedCards: () => [],
            scrollToAssetId: vi.fn(),
        });

        const previousController = state.abortController;
        loader.prepareGridForScopeSwitch();
        expect(resetAssets).toHaveBeenCalledTimes(1);
        expect(state.assets).toEqual([]);
        expect(previousController.signal.aborted).toBe(true);
        expect(state.abortController).toBeNull();
        expect(state.loading).toBe(true);

        const pendingLoad = loader.loadAssets("*", { reset: true });

        expect(resetAssets).toHaveBeenCalledTimes(2);
        expect(state.assets).toEqual([]);
        expect(fetchGridPageMock.mock.calls.at(-1)?.[3]).toBe(0);

        resolvePage({
            ok: true,
            assets: [
                { id: "output-1", filename: "output-one.png", kind: "image", source: "output" },
            ],
            total: 1,
            count: 1,
            limit: 100,
            offset: 0,
        });
        await pendingLoad;

        expect(resetAssets).toHaveBeenCalledTimes(2);
        expect(state.assets.map((asset) => asset.filename)).toEqual(["output-one.png"]);
    });

    it("does not let an aborted viewport fill skip the scope reload", async () => {
        const { useGridLoader } = await import("../vue/composables/useGridLoader.js");

        fetchGridPageMock.mockResolvedValue({
            ok: true,
            assets: [{ id: "output-1", filename: "output-one.png", kind: "image", source: "output" }],
            total: 1,
            count: 1,
            limit: 100,
            offset: 0,
        });
        appendAssetsMock.mockImplementation((_grid, assets, state) => {
            state.assets = Array.isArray(assets) ? assets.map((asset) => ({ ...asset })) : [];
            return state.assets.length;
        });

        const state = {
            loading: true,
            done: false,
            total: null,
            offset: 0,
            requestId: 5,
            abortController: new AbortController(),
            query: "*",
            assets: [],
            activeId: "",
            statusMessage: "",
            statusError: false,
        };
        const gridContainer = createVisibleElement({
            dataset: {
                mjrScope: "output",
                mjrQuery: "*",
                mjrSort: "mtime_desc",
            },
        });
        const resetAssets = vi.fn(({ query = "*", total = null, done = false } = {}) => {
            state.query = query;
            state.total = total;
            state.done = done;
            state.offset = 0;
            state.assets = [];
        });

        const loader = useGridLoader({
            gridContainerRef: { value: gridContainer },
            state,
            setLoadingMessage: vi.fn(),
            clearLoadingMessage: vi.fn(),
            setStatusMessage: vi.fn(),
            clearStatusMessage: vi.fn(),
            resetAssets,
            setSelection: vi.fn(),
            reconcileSelection: vi.fn(),
            readScrollElement: () => createVisibleElement(),
            readRenderedCards: () => [],
            scrollToAssetId: vi.fn(),
        });

        await loader.loadAssets("*", { reset: true });

        expect(fetchGridPageMock).toHaveBeenCalledTimes(1);
        expect(fetchGridPageMock.mock.calls[0]?.[3]).toBe(0);
        expect(state.assets.map((asset) => asset.filename)).toEqual(["output-one.png"]);
    });

    it("does not allow background refresh reasons to clear a populated grid immediately", async () => {
        const { useGridLoader } = await import("../vue/composables/useGridLoader.js");

        let resolvePage;
        fetchGridPageMock.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolvePage = resolve;
                }),
        );
        appendAssetsMock.mockImplementation((_grid, assets, state) => {
            state.assets = Array.isArray(assets) ? assets.map((asset) => ({ ...asset })) : [];
            return state.assets.length;
        });

        const state = {
            loading: false,
            done: false,
            total: 1,
            offset: 1,
            requestId: 1,
            abortController: null,
            query: "*",
            assets: [{ id: "old-1", filename: "old.png", kind: "image" }],
            activeId: "",
            statusMessage: "",
            statusError: false,
            _mjrLastGridContext: {
                scope: "output",
                query: "*",
                customRootId: "",
                subfolder: "",
                collectionId: "",
                viewScope: "",
                kind: "",
                workflowOnly: false,
                minRating: "",
                minSizeMB: "",
                maxSizeMB: "",
                resolutionCompare: "",
                minWidth: "",
                minHeight: "",
                maxWidth: "",
                maxHeight: "",
                workflowType: "",
                dateRange: "",
                dateExact: "",
                sort: "mtime_desc",
                semanticMode: false,
            },
        };
        const gridContainer = createVisibleElement({
            dataset: {
                mjrScope: "output",
                mjrQuery: "*",
                mjrSort: "mtime_desc",
            },
        });
        const resetAssets = vi.fn(({ query = "*", total = null, done = false } = {}) => {
            state.query = query;
            state.total = total;
            state.done = done;
            state.offset = 0;
            state.assets = [];
        });

        const loader = useGridLoader({
            gridContainerRef: { value: gridContainer },
            state,
            setLoadingMessage: vi.fn(),
            clearLoadingMessage: vi.fn(),
            setStatusMessage: vi.fn(),
            clearStatusMessage: vi.fn(),
            resetAssets,
            setSelection: vi.fn(),
            reconcileSelection: vi.fn(),
            readScrollElement: () => createVisibleElement(),
            readRenderedCards: () => [],
            scrollToAssetId: vi.fn(),
        });

        const pendingLoad = loader.loadAssets("*", {
            reset: true,
            preserveVisibleUntilReady: false,
            reason: "scan",
        });

        expect(resetAssets).not.toHaveBeenCalled();
        expect(state.assets.map((asset) => asset.filename)).toEqual(["old.png"]);

        resolvePage({
            ok: true,
            assets: [{ id: "new-1", filename: "new.png", kind: "image" }],
            total: 1,
            count: 1,
            limit: 100,
            offset: 0,
        });
        await pendingLoad;

        expect(resetAssets).toHaveBeenCalledTimes(1);
        expect(loader.getDebugSnapshot().metrics).toMatchObject({
            blockedImmediateResetCount: 1,
            lastResetReason: "scan",
        });
        expect(state.assets.map((asset) => asset.filename)).toEqual(["new.png"]);
    });

    it("allows immediate reset when sort/filter/search scope context changes", async () => {
        const { useGridLoader } = await import("../vue/composables/useGridLoader.js");

        let resolvePage;
        fetchGridPageMock.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolvePage = resolve;
                }),
        );
        appendAssetsMock.mockImplementation((_grid, assets, state) => {
            state.assets = Array.isArray(assets) ? assets.map((asset) => ({ ...asset })) : [];
            return state.assets.length;
        });

        const state = {
            loading: false,
            done: false,
            total: 1,
            offset: 1,
            requestId: 1,
            abortController: null,
            query: "*",
            assets: [{ id: "old-1", filename: "old.png", kind: "image" }],
            activeId: "",
            statusMessage: "",
            statusError: false,
            _mjrLastGridContext: {
                scope: "output",
                query: "*",
                customRootId: "",
                subfolder: "",
                collectionId: "",
                viewScope: "",
                kind: "",
                workflowOnly: false,
                sort: "mtime_desc",
                semanticMode: false,
            },
        };
        const gridContainer = createVisibleElement({
            dataset: {
                mjrScope: "output",
                mjrQuery: "*",
                mjrSort: "name_asc",
            },
        });
        const resetAssets = vi.fn(({ query = "*", total = null, done = false } = {}) => {
            state.query = query;
            state.total = total;
            state.done = done;
            state.offset = 0;
            state.assets = [];
        });

        const loader = useGridLoader({
            gridContainerRef: { value: gridContainer },
            state,
            setLoadingMessage: vi.fn(),
            clearLoadingMessage: vi.fn(),
            setStatusMessage: vi.fn(),
            clearStatusMessage: vi.fn(),
            resetAssets,
            setSelection: vi.fn(),
            reconcileSelection: vi.fn(),
            readScrollElement: () => createVisibleElement(),
            readRenderedCards: () => [],
            scrollToAssetId: vi.fn(),
        });

        const pendingLoad = loader.loadAssets("*", {
            reset: true,
            preserveVisibleUntilReady: false,
        });

        expect(resetAssets).toHaveBeenCalledTimes(1);
        expect(loader.getDebugSnapshot().metrics.lastResetReason).toBe("sort");

        resolvePage({
            ok: true,
            assets: [{ id: "new-1", filename: "new.png", kind: "image" }],
            total: 1,
            count: 1,
            limit: 100,
            offset: 0,
        });
        await pendingLoad;

        expect(resetAssets).toHaveBeenCalledTimes(1);
        expect(state.assets.map((asset) => asset.filename)).toEqual(["new.png"]);
    });

    it("skips next-page loading while the grid host is hidden", async () => {
        const { useGridLoader } = await import("../vue/composables/useGridLoader.js");

        const state = {
            loading: false,
            done: false,
            total: 7000,
            offset: 0,
            requestId: 1,
            abortController: null,
            assets: [],
            activeId: "",
            statusMessage: "",
            statusError: false,
        };
        const gridContainer = {
            dataset: {},
            isConnected: false,
            getClientRects: vi.fn(() => []),
        };
        const scrollElement = {
            clientWidth: 320,
            clientHeight: 240,
            isConnected: false,
            getClientRects: vi.fn(() => []),
        };

        const loader = useGridLoader({
            gridContainerRef: { value: gridContainer },
            state,
            setLoadingMessage: vi.fn(),
            clearLoadingMessage: vi.fn(),
            setStatusMessage: vi.fn(),
            clearStatusMessage: vi.fn(),
            resetAssets: vi.fn(),
            setSelection: vi.fn(),
            reconcileSelection: vi.fn(),
            readScrollElement: () => scrollElement,
            readRenderedCards: () => [],
            scrollToAssetId: vi.fn(),
        });

        const result = await loader.loadNextPage();

        expect(result).toMatchObject({ ok: true, skipped: true, hidden: true });
        expect(fetchGridPageMock).not.toHaveBeenCalled();
    });

    it("continues loading when only the scroll wrapper has a visible rect", async () => {
        const { useGridLoader } = await import("../vue/composables/useGridLoader.js");

        fetchGridPageMock.mockResolvedValue({
            ok: true,
            assets: [{ id: "asset-1" }],
            total: 1,
            count: 1,
            limit: 100,
            offset: 0,
        });
        appendAssetsMock.mockReturnValue(1);

        const state = {
            loading: false,
            done: false,
            total: 1,
            offset: 0,
            requestId: 1,
            abortController: null,
            assets: [],
            activeId: "",
            statusMessage: "",
            statusError: false,
        };
        const gridContainer = {
            dataset: {},
            isConnected: true,
            clientWidth: 0,
            clientHeight: 0,
            getClientRects: vi.fn(() => []),
        };
        const scrollElement = createVisibleElement();

        const loader = useGridLoader({
            gridContainerRef: { value: gridContainer },
            state,
            setLoadingMessage: vi.fn(),
            clearLoadingMessage: vi.fn(),
            setStatusMessage: vi.fn(),
            clearStatusMessage: vi.fn(),
            resetAssets: vi.fn(),
            setSelection: vi.fn(),
            reconcileSelection: vi.fn(),
            readScrollElement: () => scrollElement,
            readRenderedCards: () => [],
            scrollToAssetId: vi.fn(),
        });

        const result = await loader.loadNextPage();

        expect(result).toMatchObject({ ok: true, count: 1, total: 1 });
        expect(fetchGridPageMock).toHaveBeenCalledTimes(1);
    });
});
