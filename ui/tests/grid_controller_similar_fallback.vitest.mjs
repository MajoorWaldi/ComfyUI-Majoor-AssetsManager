import { beforeEach, describe, expect, it, vi } from "vitest";

const bridgeState = vi.hoisted(() => ({
    values: {
        viewScope: "similar",
        similarResults: [],
        similarSourceAssetId: "",
        similarTitle: "",
    },
}));

vi.mock("../stores/panelStateBridge.js", () => ({
    createPanelStateBridge: () => ({
        read: (key, fallback = "") =>
            Object.prototype.hasOwnProperty.call(bridgeState.values, key)
                ? bridgeState.values[key]
                : fallback,
        write: vi.fn(),
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
        dataset: {},
        dispatchEvent: vi.fn(),
    };
}

describe("gridController similar fallback", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        bridgeState.values = {
            viewScope: "similar",
            similarResults: [],
            similarSourceAssetId: "",
            similarTitle: "",
        };
        globalThis.window = {};
        globalThis.CustomEvent = class {
            constructor(type, init = {}) {
                this.type = type;
                this.detail = init.detail;
            }
        };
    });

    it("uses state similar results when bridge results are empty", async () => {
        const { createGridController } =
            await import("../features/panel/controllers/gridController.js");

        const listFromState = [
            { id: 194, filename: "ComfyUI_00004_.png" },
            { id: 193, filename: "AnimateDiff_00008.mp4" },
        ];

        const loadAssetsFromList = vi.fn(async (_grid, assets) => ({
            ok: true,
            count: assets.length,
            total: assets.length,
        }));
        const loadAssets = vi.fn(async () => ({ ok: true, count: 0, total: 0 }));

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
                selectedAssetIds: [],
                activeAssetId: "",
                collectionId: "",
                collectionName: "",
                viewScope: "similar",
                similarResults: listFromState,
                similarSourceAssetId: "194",
                similarTitle: "Generation group (2 assets)",
            },
        });

        await controller.reloadGrid();

        expect(loadAssetsFromList).toHaveBeenCalledWith(
            expect.any(Object),
            listFromState,
            expect.objectContaining({ reset: true }),
        );
        expect(loadAssets).not.toHaveBeenCalled();
    });
});
