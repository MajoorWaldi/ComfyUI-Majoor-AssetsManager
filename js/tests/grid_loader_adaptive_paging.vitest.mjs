import { beforeEach, describe, expect, it, vi } from "vitest";

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

vi.mock("vue", () => ({
    nextTick: async () => {},
}));

vi.mock("../api/client.js", () => ({
    get: vi.fn(),
}));

vi.mock("../app/config.js", () => ({
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

describe("useGridLoader adaptive paging", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        globalThis.sessionStorage = makeStorage();
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

        const gridContainer = { dataset: {} };
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
            readScrollElement: () => null,
            readRenderedCards: () => [],
            scrollToAssetId: vi.fn(),
        });

        const result = await loader.loadNextPage();

        expect(result.ok).toBe(true);
        expect(requestedLimits).toEqual([100, 200, 400]);
        expect(requestedOffsets).toEqual([0, 100, 300]);
        expect(state.offset).toBe(700);
    });

    it("hydrates a persisted grid snapshot without marking partial pages as done", async () => {
        appendAssetsMock.mockImplementation((_grid, assets, state) => {
            state.assets = Array.isArray(assets) ? assets.map((asset) => ({ ...asset })) : [];
            return state.assets.length;
        });

        let module = await import("../vue/composables/useGridLoader.js");
        const gridContainer = {
            dataset: {
                mjrScope: "output",
                mjrQuery: "*",
                mjrSort: "mtime_desc",
            },
        };
        const state1 = {
            loading: false,
            done: false,
            total: 50,
            offset: 2,
            requestId: 1,
            abortController: null,
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
            readScrollElement: () => null,
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
            readScrollElement: () => null,
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
});
