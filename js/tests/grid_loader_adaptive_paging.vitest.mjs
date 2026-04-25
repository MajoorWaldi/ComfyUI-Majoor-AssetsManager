import { beforeEach, describe, expect, it, vi } from "vitest";

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
        globalThis.sessionStorage = makeStorage();
        globalThis.localStorage = makeStorage();
        ensureWindowStub();
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

    it("hydrates a persisted grid snapshot without marking partial pages as done", async () => {
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

        expect(restored).toBe(true);
        expect(state2.assets.map((asset) => asset.filename)).toEqual(["one.png", "two.png"]);
        expect(state2.offset).toBe(2);
        expect(state2.total).toBe(50);
        expect(state2.done).toBe(false);
    });

    it("can replace existing assets from a cached snapshot during a scope switch", async () => {
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

        expect(restored).toBe(true);
        expect(state.assets.map((asset) => asset.filename)).toEqual(["out-one.png", "out-two.png"]);
    });

    it("defers the scope-switch visual reset until the first new page arrives", async () => {
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

        loader.prepareGridForScopeSwitch();
        const pendingLoad = loader.loadAssets("*", { reset: true });

        expect(resetAssets).not.toHaveBeenCalled();
        expect(state.assets.map((asset) => asset.filename)).toEqual(["input-one.png"]);

        resolvePage({
            ok: true,
            assets: [{ id: "output-1", filename: "output-one.png", kind: "image", source: "output" }],
            total: 1,
            count: 1,
            limit: 100,
            offset: 0,
        });
        await pendingLoad;

        expect(resetAssets).toHaveBeenCalledTimes(1);
        expect(state.assets.map((asset) => asset.filename)).toEqual(["output-one.png"]);
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
