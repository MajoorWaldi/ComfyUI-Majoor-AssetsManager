import { beforeEach, describe, expect, it, vi } from "vitest";

const bridgeState = vi.hoisted(() => ({
    values: {
        scope: "output",
        customRootId: "",
        currentFolderRelativePath: "",
        kindFilter: "",
        workflowOnly: false,
        minRating: 0,
        minSizeMB: 0,
        maxSizeMB: 0,
        resolutionCompare: "gte",
        minWidth: 0,
        minHeight: 0,
        maxWidth: 0,
        maxHeight: 0,
        workflowType: "",
        dateRangeFilter: "",
        dateExactFilter: "",
        sort: "mtime_desc",
        activeAssetId: "",
        selectedAssetIds: [],
        collectionId: "",
        collectionName: "",
        viewScope: "",
        similarResults: [],
        similarTitle: "",
        similarSourceAssetId: "",
        lastGridCount: 0,
        lastGridTotal: 0,
    },
}));

vi.mock("../stores/panelStateBridge.js", () => ({
    createPanelStateBridge: () => ({
        read: (key, fallback = "") =>
            Object.prototype.hasOwnProperty.call(bridgeState.values, key)
                ? bridgeState.values[key]
                : fallback,
        write: vi.fn((key, value) => {
            bridgeState.values[key] = value;
        }),
    }),
}));

vi.mock("../api/client.js", () => ({
    vectorSearch: vi.fn(),
    hybridSearch: vi.fn(),
    vectorStats: vi.fn(),
}));

vi.mock("../app/toast.js", () => ({
    comfyToast: vi.fn(),
}));

vi.mock("../app/i18n.js", () => ({
    t: (_key, fallback) => fallback,
}));

vi.mock("../app/settings.js", () => ({
    loadMajoorSettings: () => ({ ai: { vectorSearchEnabled: true } }),
}));

vi.mock("../app/config.js", () => ({
    APP_CONFIG: { EXECUTION_GROUPING_ENABLED: true },
}));

function createGridContainer() {
    return {
        dataset: { mjrViewScope: "", mjrScope: "output" },
        dispatchEvent: vi.fn(),
    };
}

describe("gridController scope switch cache behavior", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.assign(bridgeState.values, {
            scope: "output",
            customRootId: "",
            currentFolderRelativePath: "",
            kindFilter: "",
            workflowOnly: false,
            minRating: 0,
            minSizeMB: 0,
            maxSizeMB: 0,
            resolutionCompare: "gte",
            minWidth: 0,
            minHeight: 0,
            maxWidth: 0,
            maxHeight: 0,
            workflowType: "",
            dateRangeFilter: "",
            dateExactFilter: "",
            sort: "mtime_desc",
            activeAssetId: "",
            selectedAssetIds: [],
            collectionId: "",
            collectionName: "",
            viewScope: "",
            similarResults: [],
            similarTitle: "",
            similarSourceAssetId: "",
            lastGridCount: 0,
            lastGridTotal: 0,
        });
        globalThis.window = {};
        globalThis.CustomEvent = class {
            constructor(type, init = {}) {
                this.type = type;
                this.detail = init.detail;
            }
        };
    });

    it("writes mjrCollectionId to the dataset during reload", async () => {
        const { createGridController } = await import(
            "../features/panel/controllers/gridController.js"
        );

        bridgeState.values.collectionId = "col-123";
        bridgeState.values.collectionName = "Test Collection";

        const gridContainer = createGridContainer();
        const loadAssets = vi.fn(async () => ({ ok: true, count: 5, total: 5 }));
        const getCollectionAssets = vi.fn(async () => ({
            ok: true,
            data: { assets: [{ id: 1 }, { id: 2 }] },
        }));
        const loadAssetsFromList = vi.fn(async () => ({ ok: true, count: 2, total: 2 }));

        const controller = createGridController({
            gridContainer,
            loadAssets,
            loadAssetsFromList,
            getCollectionAssets,
            disposeGrid: vi.fn(),
            getQuery: () => "*",
            searchInputEl: { dataset: { mjrSemanticMode: "0" } },
            state: {},
        });

        await controller.reloadGrid();

        expect(gridContainer.dataset.mjrCollectionId).toBe("col-123");
    });

    it("loads collection assets when collectionId is set", async () => {
        const { createGridController } = await import(
            "../features/panel/controllers/gridController.js"
        );

        bridgeState.values.collectionId = "col-456";
        bridgeState.values.collectionName = "My Collection";

        const gridContainer = createGridContainer();
        const loadAssets = vi.fn(async () => ({ ok: true, count: 5, total: 5 }));
        const collectionAssets = [
            { id: 10, filename: "a.png" },
            { id: 11, filename: "b.png" },
        ];
        const getCollectionAssets = vi.fn(async () => ({
            ok: true,
            data: { assets: collectionAssets },
        }));
        const loadAssetsFromList = vi.fn(async () => ({ ok: true, count: 2, total: 2 }));

        const controller = createGridController({
            gridContainer,
            loadAssets,
            loadAssetsFromList,
            getCollectionAssets,
            disposeGrid: vi.fn(),
            getQuery: () => "*",
            searchInputEl: { dataset: { mjrSemanticMode: "0" } },
            state: {},
        });

        await controller.reloadGrid();

        expect(getCollectionAssets).toHaveBeenCalledWith("col-456");
        expect(loadAssetsFromList).toHaveBeenCalledWith(
            gridContainer,
            collectionAssets,
            expect.objectContaining({ title: "Collection: My Collection" }),
        );
        // Normal loadAssets should NOT be called when collection is active
        expect(loadAssets).not.toHaveBeenCalled();
    });

    it("falls back to normal load when collection fetch fails", async () => {
        const { createGridController } = await import(
            "../features/panel/controllers/gridController.js"
        );

        bridgeState.values.collectionId = "col-bad";

        const gridContainer = createGridContainer();
        const loadAssets = vi.fn(async () => ({ ok: true, count: 50, total: 50 }));
        const getCollectionAssets = vi.fn(async () => ({ ok: false, error: "Not found" }));
        const loadAssetsFromList = vi.fn();

        const controller = createGridController({
            gridContainer,
            loadAssets,
            loadAssetsFromList,
            getCollectionAssets,
            disposeGrid: vi.fn(),
            getQuery: () => "*",
            searchInputEl: { dataset: { mjrSemanticMode: "0" } },
            state: {},
        });

        await controller.reloadGrid();

        // Should fall back to normal loadAssets
        expect(loadAssets).toHaveBeenCalled();
        // collectionId should be cleared
        expect(bridgeState.values.collectionId).toBe("");
    });

    it("switches from output to input scope and reloads normally", async () => {
        const { createGridController } = await import(
            "../features/panel/controllers/gridController.js"
        );

        const gridContainer = createGridContainer();
        const loadAssets = vi.fn(async () => ({ ok: true, count: 100, total: 100 }));

        const controller = createGridController({
            gridContainer,
            loadAssets,
            loadAssetsFromList: vi.fn(async () => ({ ok: true })),
            getCollectionAssets: vi.fn(),
            disposeGrid: vi.fn(),
            getQuery: () => "*",
            searchInputEl: { dataset: { mjrSemanticMode: "0" } },
            state: {},
        });

        // First load in output scope
        await controller.reloadGrid();
        expect(gridContainer.dataset.mjrScope).toBe("output");

        // Switch to input scope
        bridgeState.values.scope = "input";
        loadAssets.mockClear();
        await controller.reloadGrid();

        expect(gridContainer.dataset.mjrScope).toBe("input");
        expect(loadAssets).toHaveBeenCalled();
    });

    it("does not dispose the live grid when entering browser root scope", async () => {
        const { createGridController } = await import(
            "../features/panel/controllers/gridController.js"
        );

        Object.assign(bridgeState.values, {
            scope: "custom",
            customRootId: "",
            currentFolderRelativePath: "",
        });

        const gridContainer = createGridContainer();
        const loadAssets = vi.fn(async () => ({ ok: true, count: 4, total: 4 }));
        const disposeGrid = vi.fn();

        const controller = createGridController({
            gridContainer,
            loadAssets,
            loadAssetsFromList: vi.fn(async () => ({ ok: true })),
            getCollectionAssets: vi.fn(),
            disposeGrid,
            getQuery: () => "*",
            searchInputEl: { dataset: { mjrSemanticMode: "0" } },
            state: {},
        });

        await controller.reloadGrid();

        expect(gridContainer.dataset.mjrScope).toBe("custom");
        expect(gridContainer.dataset.mjrCustomRootId).toBe("");
        expect(loadAssets).toHaveBeenCalled();
        expect(disposeGrid).not.toHaveBeenCalled();
    });
});
