// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest";

const panelRuntimeState = vi.hoisted(() => ({
    activeGrid: null,
}));

vi.mock("../app/toast.js", () => ({ comfyToast: vi.fn() }));
vi.mock("../app/i18n.js", () => ({
    t: (key, fallback, params) => fallback || key || params || "",
}));
vi.mock("../app/dialogs.js", () => ({ comfyPrompt: vi.fn() }));
vi.mock("../api/client.js", () => ({
    openInFolder: vi.fn(),
    updateAssetRating: vi.fn(),
    deleteAsset: vi.fn(),
    renameAsset: vi.fn(),
    removeFilepathsFromCollection: vi.fn(),
}));
vi.mock("../api/endpoints.js", () => ({ buildDownloadURL: vi.fn(() => "") }));
vi.mock("../utils/events.js", () => ({ safeDispatchCustomEvent: vi.fn() }));
vi.mock("../features/viewer/viewerOpenRequest.js", () => ({ requestViewerOpen: vi.fn() }));
vi.mock("../features/collections/contextmenu/addToCollectionMenu.js", () => ({
    showAddToCollectionMenu: vi.fn(),
}));
vi.mock("../utils/filenames.js", () => ({
    normalizeRenameFilename: vi.fn((value) => value),
    validateFilename: vi.fn(() => ({ valid: true })),
}));
vi.mock("../features/panel/controllers/hotkeysState.js", () => ({
    getHotkeysState: vi.fn(() => ({ scope: "grid", ratingHotkeysActive: false })),
    isHotkeysSuspended: vi.fn(() => false),
}));
vi.mock("../features/panel/panelRuntimeRefs.js", () => ({
    clearActiveGridContainer: vi.fn((container = null) => {
        if (!container || panelRuntimeState.activeGrid === container) {
            panelRuntimeState.activeGrid = null;
        }
    }),
    getActiveGridContainer: vi.fn(() => panelRuntimeState.activeGrid),
    setActiveGridContainer: vi.fn((container) => {
        panelRuntimeState.activeGrid = container || null;
        return panelRuntimeState.activeGrid;
    }),
}));

function createGridContainer(assetIds) {
    const grid = document.createElement("div");
    grid.className = "mjr-grid";

    const assets = assetIds.map((id) => ({ id }));
    grid._mjrAssets = assets;
    grid._mjrGetAssets = () => assets;
    grid._mjrGetRenderedCards = () =>
        assets.map((asset, index) => {
            const card = document.createElement("div");
            card.className = "mjr-asset-card";
            card.dataset.mjrAssetId = String(asset.id);
            card._mjrAsset = asset;
            card.getBoundingClientRect = () => ({
                top: 0,
                width: 100,
                left: index * 100,
                height: 100,
                right: index * 100 + 100,
                bottom: 100,
            });
            return card;
        });
    grid.getBoundingClientRect = () => ({
        top: 0,
        left: 0,
        width: 220,
        height: 100,
        right: 220,
        bottom: 100,
    });
    grid._mjrSetSelection = (ids, activeId = "") => {
        grid.dataset.mjrSelectedAssetIds = JSON.stringify(ids);
        if (activeId) grid.dataset.mjrSelectedAssetId = String(activeId);
        else delete grid.dataset.mjrSelectedAssetId;
        grid.dispatchEvent(
            new CustomEvent("mjr:selection-changed", {
                detail: { selectedIds: ids, activeId: activeId || ids[0] || "" },
            }),
        );
        window.dispatchEvent(
            new CustomEvent("mjr:selection-changed", {
                detail: { selectedIds: ids, activeId: activeId || ids[0] || "" },
            }),
        );
    };
    document.body.appendChild(grid);
    return grid;
}

describe("GridKeyboard navigation", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        panelRuntimeState.activeGrid = null;
        document.body.innerHTML = "";
        Object.defineProperty(document, "activeElement", {
            configurable: true,
            get: () => document.body,
        });
        delete window.__MJR_LAST_SELECTION_GRID__;
    });

    it("handles arrow keys only for the active grid when multiple listeners are installed", async () => {
        const { installGridKeyboard } = await import("../features/grid/GridKeyboard.js");

        const mainGrid = createGridContainer(["main-1", "main-2", "main-3"]);
        const feedGrid = createGridContainer(["feed-1", "feed-2", "feed-3"]);

        mainGrid._mjrSetSelection(["main-1"], "main-1");
        feedGrid._mjrSetSelection(["feed-1"], "feed-1");

        const mainKeyboard = installGridKeyboard({
            gridContainer: mainGrid,
            getState: () => ({ assets: mainGrid._mjrAssets }),
            getSelectedAssets: () =>
                mainGrid._mjrAssets.filter(
                    (asset) => asset.id === mainGrid.dataset.mjrSelectedAssetId,
                ),
            getActiveAsset: () =>
                mainGrid._mjrAssets.find(
                    (asset) => asset.id === mainGrid.dataset.mjrSelectedAssetId,
                ) || null,
        });
        const feedKeyboard = installGridKeyboard({
            gridContainer: feedGrid,
            getState: () => ({ assets: feedGrid._mjrAssets }),
            getSelectedAssets: () =>
                feedGrid._mjrAssets.filter(
                    (asset) => asset.id === feedGrid.dataset.mjrSelectedAssetId,
                ),
            getActiveAsset: () =>
                feedGrid._mjrAssets.find(
                    (asset) => asset.id === feedGrid.dataset.mjrSelectedAssetId,
                ) || null,
        });

        mainKeyboard.bind();
        feedKeyboard.bind();

        mainGrid.dispatchEvent(new Event("pointerdown", { bubbles: true }));

        document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));

        expect(mainGrid.dataset.mjrSelectedAssetId).toBe("main-2");
        expect(feedGrid.dataset.mjrSelectedAssetId).toBe("feed-1");
        expect(panelRuntimeState.activeGrid).toBe(mainGrid);
        expect(window.__MJR_LAST_SELECTION_GRID__).toBe(mainGrid);

        mainKeyboard.dispose();
        feedKeyboard.dispose();
    });

    it("downloads with S on keyup and cancels when a drag starts", async () => {
        const { installGridKeyboard } = await import("../features/grid/GridKeyboard.js");

        const grid = createGridContainer(["asset-1"]);
        grid._mjrAssets[0].filename = "one.png";
        grid._mjrAssets[0].filepath = "C:/out/one.png";
        grid._mjrSetSelection(["asset-1"], "asset-1");

        const clicks = [];
        const originalCreateElement = document.createElement.bind(document);
        vi.spyOn(document, "createElement").mockImplementation((tag) => {
            const el = originalCreateElement(tag);
            if (String(tag).toLowerCase() === "a") {
                el.click = vi.fn(() => clicks.push(el.download));
            }
            return el;
        });

        const keyboard = installGridKeyboard({
            gridContainer: grid,
            getState: () => ({ assets: grid._mjrAssets }),
            getSelectedAssets: () => grid._mjrAssets,
            getActiveAsset: () => grid._mjrAssets[0],
        });
        keyboard.bind();

        document.dispatchEvent(new KeyboardEvent("keydown", { key: "s", bubbles: true }));
        expect(clicks).toEqual([]);
        document.dispatchEvent(new Event("dragstart", { bubbles: true }));
        document.dispatchEvent(new KeyboardEvent("keyup", { key: "s", bubbles: true }));
        expect(clicks).toEqual([]);

        document.dispatchEvent(new KeyboardEvent("keydown", { key: "s", bubbles: true }));
        document.dispatchEvent(new KeyboardEvent("keyup", { key: "s", bubbles: true }));
        expect(clicks).toEqual(["one.png"]);

        keyboard.dispose();
    });
});
