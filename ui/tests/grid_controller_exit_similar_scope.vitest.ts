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

function createGridContainer() {
    return {
        dataset: { mjrViewScope: "similar" },
        dispatchEvent: vi.fn(),
    };
}

describe("gridController exiting similar scope", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        bridgeState.values = {
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
        };
        globalThis.window = {};
        globalThis.CustomEvent = class {
            constructor(type, init = {}) {
                this.type = type;
                this.detail = init.detail;
            }
        };
    });

    it("does not preserve stale similar cards when switching back to normal scope", async () => {
        const { createGridController } =
            await import("../features/panel/controllers/gridController.js");

        const loadAssets = vi.fn(async () => ({ ok: true, count: 175, total: 175 }));
        const loadAssetsFromList = vi.fn(async () => ({ ok: true, count: 2, total: 2 }));

        const controller = createGridController({
            gridContainer: createGridContainer(),
            loadAssets,
            loadAssetsFromList,
            getCollectionAssets: vi.fn(),
            disposeGrid: vi.fn(),
            getQuery: () => "*",
            searchInputEl: { dataset: { mjrSemanticMode: "0" } },
            state: {
                scope: "output",
                viewScope: "",
            },
        });

        await controller.reloadGrid();

        expect(loadAssets).toHaveBeenCalledWith(
            expect.any(Object),
            "*",
            expect.objectContaining({ preserveVisibleUntilReady: false }),
        );
        expect(loadAssetsFromList).not.toHaveBeenCalled();
    });
});
