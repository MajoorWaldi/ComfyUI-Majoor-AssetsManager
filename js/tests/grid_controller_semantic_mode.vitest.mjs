import { beforeEach, describe, expect, it, vi } from "vitest";

const apiState = vi.hoisted(() => ({
  hybridSearch: vi.fn(),
  vectorSearch: vi.fn(),
  vectorStats: vi.fn(),
}));

vi.mock("../api/client.js", () => ({
  hybridSearch: apiState.hybridSearch,
  vectorSearch: apiState.vectorSearch,
  vectorStats: apiState.vectorStats,
}));

vi.mock("../app/toast.js", () => ({
  comfyToast: vi.fn(),
}));

vi.mock("../app/i18n.js", () => ({
  t: (_key, fallback, vars) => {
    if (!vars) return fallback;
    return String(fallback || "").replace(/\{(\w+)\}/g, (_m, key) => String(vars[key] ?? ""));
  },
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

describe("gridController semantic mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.window = {};
    globalThis.CustomEvent = class {
      constructor(type, init = {}) {
        this.type = type;
        this.detail = init.detail;
      }
    };
  });

  it("uses hybrid AI search when the semantic toggle is active", async () => {
    const { createGridController } = await import("../features/panel/controllers/gridController.js");

    apiState.hybridSearch.mockResolvedValue({
      ok: true,
      data: [{ id: 3, asset_id: 3, filename: "dino.png" }],
    });
    apiState.vectorSearch.mockResolvedValue({ ok: true, data: [] });
    apiState.vectorStats.mockResolvedValue({ ok: true, data: { total: 33 } });

    const loadAssets = vi.fn(async () => ({ ok: true, count: 0, total: 0 }));
    const loadAssetsFromList = vi.fn(async (_grid, assets) => ({
      ok: true,
      count: assets.length,
      total: assets.length,
    }));

    const controller = createGridController({
      gridContainer: createGridContainer(),
      loadAssets,
      loadAssetsFromList,
      getCollectionAssets: vi.fn(),
      disposeGrid: vi.fn(),
      getQuery: () => "dinosaure",
      searchInputEl: { dataset: { mjrSemanticMode: "1" } },
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
        viewScope: "",
      },
    });

    await controller.reloadGrid();

    expect(apiState.hybridSearch).toHaveBeenCalledWith("dinosaure", expect.objectContaining({
      topK: 100,
      scope: "output",
    }));
    expect(loadAssetsFromList).toHaveBeenCalledWith(
      expect.any(Object),
      [{ id: 3, asset_id: 3, filename: "dino.png" }],
      expect.objectContaining({ reset: true })
    );
    expect(loadAssets).not.toHaveBeenCalled();
  });
});
