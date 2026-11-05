// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
    get: vi.fn(),
    post: vi.fn(),
    deleteAsset: vi.fn(),
    deleteAssets: vi.fn(),
}));

vi.mock("../api/client.js", () => ({
    get: apiMocks.get,
    post: apiMocks.post,
    getAssetMetadata: vi.fn(),
    deleteAsset: apiMocks.deleteAsset,
    deleteAssets: apiMocks.deleteAssets,
    deleteWorkflow: vi.fn(),
    duplicateWorkflow: vi.fn(),
    moveWorkflow: vi.fn(),
    openInFolder: vi.fn(),
    markWorkflowLoaded: vi.fn(),
    getWorkflowContent: vi.fn(),
    listWorkflowThumbnailCandidates: vi.fn(),
    removeFilepathsFromCollection: vi.fn(),
    renameAsset: vi.fn(),
    setWorkflowThumbnail: vi.fn(),
    updateAssetRating: vi.fn(),
    browserFolderOp: vi.fn(),
    collectFiles: vi.fn(),
    VECTOR_BACKFILL_DEFAULT_POLL_INTERVAL_MS: 1000,
    VECTOR_BACKFILL_DEFAULT_POLL_TIMEOUT_MS: 1_800_000,
    VECTOR_BACKFILL_MAX_POLL_TIMEOUT_MS: 43_200_000,
}));

vi.mock("../app/toast.js", () => ({ comfyToast: vi.fn() }));
vi.mock("../app/i18n.js", () => ({
    t: (key: any, fallback: any, params: any) => {
        let text = String(fallback ?? key ?? "");
        if (params && typeof params === "object") {
            for (const [name, value] of Object.entries(params)) {
                text = text.split(`{${name}}`).join(String(value));
            }
        }
        return text;
    },
}));
vi.mock("../app/dialogs.js", () => ({
    comfyConfirm: vi.fn(async () => true),
    comfyPrompt: vi.fn(),
}));
vi.mock("../utils/deleteGuard.js", () => ({ confirmDeletion: vi.fn(async () => true) }));
vi.mock("../app/settings/settingsCore.js", () => ({
    loadMajoorSettings: vi.fn(async () => ({})),
}));
vi.mock("../app/hostAdapter.js", () => ({
    getRawHostApp: vi.fn(() => null),
    importWorkflowPreferHostTab: vi.fn(),
    isHostWorkflowDirty: vi.fn(() => false),
}));
vi.mock("../utils/filenames.js", () => ({
    normalizeRenameFilename: vi.fn((value: any) => value),
    validateFilename: vi.fn(() => ({ valid: true })),
}));
vi.mock("../utils/logging.js", () => ({ reportError: vi.fn() }));
vi.mock("../components/Badges.js", () => ({ createWorkflowDot: vi.fn(() => null) }));
vi.mock("../features/collections/contextmenu/addToCollectionMenu.js", () => ({
    showAddToCollectionMenu: vi.fn(),
}));
vi.mock("../features/panel/controllers/hotkeysState.js", () => ({
    getHotkeysState: vi.fn(() => ({ scope: "grid", ratingHotkeysActive: false })),
    isHotkeysSuspended: vi.fn(() => false),
}));
vi.mock("../features/panel/panelRuntimeRefs.js", () => ({
    clearActiveGridContainer: vi.fn(),
    getActiveGridContainer: vi.fn(() => null),
    setActiveGridContainer: vi.fn(),
}));
vi.mock("../features/viewer/viewerOpenRequest.js", () => ({ requestViewerOpen: vi.fn() }));
vi.mock("../features/dnd/canvasLoaderNode.js", () => ({ createCanvasLoaderNodes: vi.fn() }));
vi.mock("../features/dnd/staging/stageToInput.js", () => ({ stageToInputDetailed: vi.fn() }));
vi.mock("../features/viewer/workflowGraphMap/workflowGraphMapData.js", () => ({
    resolveAssetWorkflow: vi.fn(),
}));
vi.mock("../features/workflows/workflowPickerState.js", () => ({
    openWorkflowAssetPicker: vi.fn(),
    openWorkflowPicker: vi.fn(),
}));
vi.mock("../features/workflows/workflowInfoState.js", () => ({
    openWorkflowInfoDialog: vi.fn(),
}));

function idAssets(...ids: any[]) {
    return ids.map((id) => ({ id, filename: `file-${id}.png` }));
}

function bulkOk(ids: any[], failedIds: any[] = []) {
    return {
        ok: true,
        data: {
            deleted: ids.length - failedIds.length,
            deleted_ids: ids.map(String),
            failed_ids: failedIds.map(String),
        },
    };
}

async function flushAsync() {
    await Promise.resolve();
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("bulk delete helper", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        apiMocks.deleteAssets.mockImplementation(async (ids: any[]) => bulkOk(ids));
        apiMocks.deleteAsset.mockResolvedValue({ ok: true });
    });

    it("deletes a small selection with one bulk call and no single deletes", async () => {
        const { deleteAssetsInChunks } = await import("../features/grid/bulkDelete.js");

        const result = await deleteAssetsInChunks(idAssets(1, 2, 3));

        expect(apiMocks.deleteAssets).toHaveBeenCalledTimes(1);
        expect(apiMocks.deleteAssets).toHaveBeenCalledWith(["1", "2", "3"]);
        expect(apiMocks.deleteAsset).not.toHaveBeenCalled();
        expect(result.deletedIds).toEqual(["1", "2", "3"]);
        expect(result.failedCount).toBe(0);
        expect(result.deletedByFilepath).toBe(0);
    });

    it("sends large selections in sequential chunks and reports progress", async () => {
        const { deleteAssetsInChunks } = await import("../features/grid/bulkDelete.js");

        const assets = idAssets(...Array.from({ length: 1201 }, (_, i) => i + 1));
        let releaseFirst: (value: any) => void = () => {};
        const firstChunkDone = new Promise((resolve) => {
            releaseFirst = resolve;
        });
        apiMocks.deleteAssets.mockImplementationOnce(() => firstChunkDone);

        const onProgress = vi.fn();
        const running = deleteAssetsInChunks(assets, { onProgress });

        await vi.waitFor(() => expect(apiMocks.deleteAssets).toHaveBeenCalledTimes(1));
        await flushAsync();
        // Sequential: the second chunk is not requested while the first is in flight.
        expect(apiMocks.deleteAssets).toHaveBeenCalledTimes(1);

        releaseFirst(bulkOk(assets.slice(0, 500).map((a) => a.id)));
        const result = await running;

        expect(apiMocks.deleteAssets).toHaveBeenCalledTimes(3);
        expect(apiMocks.deleteAssets.mock.calls.map((call: any[]) => call[0].length)).toEqual([
            500, 500, 201,
        ]);
        expect(onProgress).toHaveBeenCalledTimes(3);
        expect(onProgress).toHaveBeenLastCalledWith({
            done: 1201,
            total: 1201,
            deleted: 1201,
            failed: 0,
        });
        expect(result.deletedIds).toHaveLength(1201);
        expect(result.failedCount).toBe(0);
    });

    it("keeps only server-confirmed ids on a partial bulk result", async () => {
        const { deleteAssetsInChunks } = await import("../features/grid/bulkDelete.js");

        apiMocks.deleteAssets.mockResolvedValueOnce({
            ok: true,
            data: { deleted: 2, deleted_ids: [1, 2], failed_ids: [3] },
            meta: { partial: true },
        });

        const result = await deleteAssetsInChunks(idAssets(1, 2, 3));

        expect(apiMocks.deleteAssets).toHaveBeenCalledTimes(1);
        expect(apiMocks.deleteAsset).not.toHaveBeenCalled();
        expect(result.deletedIds).toEqual(["1", "2"]);
        expect(result.failedCount).toBe(1);
    });

    it("falls back to per-id deletes when a whole chunk is rejected", async () => {
        const { deleteAssetsInChunks } = await import("../features/grid/bulkDelete.js");

        apiMocks.deleteAssets.mockResolvedValue({
            ok: false,
            code: "NOT_FOUND",
            error: "Assets not found: [3]",
        });
        apiMocks.deleteAsset.mockImplementation(async (id: any) => {
            return String(id) === "3" ? { ok: false, error: "missing" } : { ok: true };
        });

        const result = await deleteAssetsInChunks(idAssets(1, 2, 3));

        expect(apiMocks.deleteAssets).toHaveBeenCalledTimes(1);
        expect(apiMocks.deleteAsset).toHaveBeenCalledTimes(3);
        expect(result.deletedIds).toEqual(["1", "2"]);
        expect(result.failedCount).toBe(1);
    });

    it("drops server-named ids and retries the rest of the chunk in bounded bulk attempts", async () => {
        const { deleteAssetsInChunks } = await import("../features/grid/bulkDelete.js");

        apiMocks.deleteAssets
            .mockResolvedValueOnce({
                ok: false,
                code: "NOT_FOUND",
                error: "Assets not found: [2]",
                meta: { missing_ids: [2] },
            })
            .mockResolvedValueOnce({
                ok: false,
                code: "FORBIDDEN",
                error: "Path for asset ID 4 is not within allowed roots",
                meta: { rejected_ids: [4] },
            })
            .mockImplementationOnce(async (ids: any[]) => bulkOk(ids));

        const result = await deleteAssetsInChunks(idAssets(1, 2, 3, 4));

        expect(apiMocks.deleteAssets).toHaveBeenCalledTimes(3);
        expect(apiMocks.deleteAssets).toHaveBeenNthCalledWith(1, ["1", "2", "3", "4"]);
        expect(apiMocks.deleteAssets).toHaveBeenNthCalledWith(2, ["1", "3", "4"]);
        expect(apiMocks.deleteAssets).toHaveBeenNthCalledWith(3, ["1", "3"]);
        expect(apiMocks.deleteAsset).not.toHaveBeenCalled();
        expect(result.deletedIds).toEqual(["1", "3"]);
        expect(result.failedCount).toBe(2);
    });

    it("falls back to per-id deletes when retries run out with ids still unnamed", async () => {
        const { deleteAssetsInChunks } = await import("../features/grid/bulkDelete.js");

        apiMocks.deleteAssets
            .mockResolvedValueOnce({
                ok: false,
                code: "NOT_FOUND",
                error: "Assets not found: [1]",
                meta: { missing_ids: [1] },
            })
            .mockResolvedValueOnce({
                ok: false,
                code: "NOT_FOUND",
                error: "Assets not found: [2]",
                meta: { missing_ids: [2] },
            })
            .mockResolvedValueOnce({
                ok: false,
                code: "NOT_FOUND",
                error: "Assets not found: [3]",
                meta: { missing_ids: [3] },
            });
        apiMocks.deleteAsset.mockResolvedValue({ ok: true });

        const result = await deleteAssetsInChunks(idAssets(1, 2, 3, 4));

        // 3 bulk attempts, each naming one id; the unnamed remainder falls back per-id.
        expect(apiMocks.deleteAssets).toHaveBeenCalledTimes(3);
        expect(apiMocks.deleteAsset).toHaveBeenCalledTimes(1);
        expect(apiMocks.deleteAsset).toHaveBeenCalledWith("4");
        expect(result.deletedIds).toEqual(["4"]);
        expect(result.failedCount).toBe(3);
    });

    it("treats ids not listed as failed as deleted when the response has no deleted_ids", async () => {
        const { deleteAssetsInChunks } = await import("../features/grid/bulkDelete.js");

        apiMocks.deleteAssets.mockResolvedValue({
            ok: true,
            data: { deleted: 1, failed_ids: [2] },
        });

        const result = await deleteAssetsInChunks(idAssets(1, 2));

        expect(apiMocks.deleteAssets).toHaveBeenCalledTimes(1);
        expect(apiMocks.deleteAsset).not.toHaveBeenCalled();
        expect(result.deletedIds).toEqual(["1"]);
        expect(result.failedCount).toBe(1);
    });

    it("counts a rate-limited chunk as failed without per-id fallback", async () => {
        const { deleteAssetsInChunks } = await import("../features/grid/bulkDelete.js");

        apiMocks.deleteAssets.mockResolvedValue({
            ok: false,
            code: "RATE_LIMITED",
            error: "Rate limit exceeded",
        });

        const result = await deleteAssetsInChunks(idAssets(1, 2, 3));

        expect(apiMocks.deleteAssets).toHaveBeenCalledTimes(1);
        expect(apiMocks.deleteAsset).not.toHaveBeenCalled();
        expect(result.deletedIds).toEqual([]);
        expect(result.failedCount).toBe(3);
    });

    it("counts ids missing from deleted_ids as failed on an ok response", async () => {
        const { deleteAssetsInChunks } = await import("../features/grid/bulkDelete.js");

        apiMocks.deleteAssets.mockResolvedValue({
            ok: true,
            data: { deleted: 1, deleted_ids: [1] },
        });

        const result = await deleteAssetsInChunks(idAssets(1, 2));

        expect(apiMocks.deleteAssets).toHaveBeenCalledTimes(1);
        expect(apiMocks.deleteAsset).not.toHaveBeenCalled();
        expect(result.deletedIds).toEqual(["1"]);
        expect(result.failedCount).toBe(1);
    });

    it("sends filepath-only assets through single deletes next to the bulk call", async () => {
        const { deleteAssetsInChunks } = await import("../features/grid/bulkDelete.js");

        const filepathAsset = {
            id: null,
            filename: "browser.png",
            filepath: "/browser/folder/browser.png",
        };

        const result = await deleteAssetsInChunks([...idAssets(1, 2), filepathAsset]);

        expect(apiMocks.deleteAssets).toHaveBeenCalledTimes(1);
        expect(apiMocks.deleteAssets).toHaveBeenCalledWith(["1", "2"]);
        expect(apiMocks.deleteAsset).toHaveBeenCalledTimes(1);
        expect(apiMocks.deleteAsset).toHaveBeenCalledWith(filepathAsset);
        expect(result.deletedIds).toEqual(["1", "2"]);
        expect(result.deletedByFilepath).toBe(1);
        expect(result.failedCount).toBe(0);
    });

    it("counts a failed chunk as failed and still attempts the remaining chunks", async () => {
        const { deleteAssetsInChunks } = await import("../features/grid/bulkDelete.js");

        apiMocks.deleteAssets
            .mockRejectedValueOnce(new Error("network down"))
            .mockImplementationOnce(async (ids: any[]) => bulkOk(ids));

        const result = await deleteAssetsInChunks(idAssets(1, 2, 3, 4), { chunkSize: 2 });

        expect(apiMocks.deleteAssets).toHaveBeenCalledTimes(2);
        expect(apiMocks.deleteAsset).not.toHaveBeenCalled();
        expect(result.deletedIds).toEqual(["3", "4"]);
        expect(result.failedCount).toBe(2);
    });
});

describe("deleteAssets deleted event", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    it("emits only the server-confirmed deleted ids on a partial result", async () => {
        apiMocks.post.mockResolvedValue({
            ok: true,
            data: { deleted: 2, deleted_ids: [1, 2], failed_ids: [3] },
        });

        const { deleteAssets } = await import("../api/clientOps.js");
        const events: any[] = [];
        const listener = (event: any) => events.push(event.detail);
        window.addEventListener("mjr:assets-deleted", listener);
        try {
            await deleteAssets([1, 2, 3]);
        } finally {
            window.removeEventListener("mjr:assets-deleted", listener);
        }

        expect(apiMocks.post).toHaveBeenCalledWith("/mjr/am/assets/delete", {
            ids: ["1", "2", "3"],
        });
        expect(events).toHaveLength(1);
        expect(events[0].ids).toEqual(["1", "2"]);
    });

    it("falls back to the requested ids when the response carries no deleted_ids", async () => {
        apiMocks.post.mockResolvedValue({ ok: true, data: { deleted: 2 } });

        const { deleteAssets } = await import("../api/clientOps.js");
        const events: any[] = [];
        const listener = (event: any) => events.push(event.detail);
        window.addEventListener("mjr:assets-deleted", listener);
        try {
            await deleteAssets([7, 8]);
        } finally {
            window.removeEventListener("mjr:assets-deleted", listener);
        }

        expect(events).toHaveLength(1);
        expect(events[0].ids).toEqual(["7", "8"]);
    });
});

function createKeyboardGrid(assetIds: string[]) {
    const grid: any = document.createElement("div");
    grid.className = "mjr-grid";
    const assets = assetIds.map((id) => ({ id, filename: `file-${id}.png` }));
    grid._mjrAssets = assets;
    grid._mjrGetAssets = () => assets;
    grid._mjrRemoveAssets = vi.fn();
    grid._mjrSetSelection = (ids: any[]) => {
        grid.dataset.mjrSelectedAssetIds = JSON.stringify(ids);
    };
    document.body.appendChild(grid);
    return grid;
}

describe("grid delete wiring", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        apiMocks.deleteAssets.mockImplementation(async (ids: any[]) => bulkOk(ids));
        apiMocks.deleteAsset.mockResolvedValue({ ok: true });
        document.body.innerHTML = "";
        Object.defineProperty(document, "activeElement", {
            configurable: true,
            get: () => document.body,
        });
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("deletes a keyboard selection with one bulk request and no single deletes", async () => {
        const { installGridKeyboard } = await import("../features/grid/GridKeyboard.js");

        const grid = createKeyboardGrid(["1", "2", "3"]);
        const selected = grid._mjrAssets.filter((asset: any) => asset.id !== "2");
        const keyboard = installGridKeyboard({
            gridContainer: grid,
            getState: () => ({ assets: grid._mjrAssets }),
            getSelectedAssets: () => selected,
            getActiveAsset: () => selected[0],
        });
        keyboard.bind();
        grid.dispatchEvent(new Event("pointerdown", { bubbles: true }));

        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Delete", bubbles: true }));
        await vi.waitFor(() => expect(apiMocks.deleteAssets).toHaveBeenCalledTimes(1));
        await flushAsync();

        expect(apiMocks.deleteAssets).toHaveBeenCalledWith(["1", "3"]);
        expect(apiMocks.deleteAsset).not.toHaveBeenCalled();
        expect(grid._mjrRemoveAssets).toHaveBeenCalledWith(["1", "3"]);
        keyboard.dispose();
    });

    it("deletes a multi-card menu selection with one bulk request and no single deletes", async () => {
        const { bindGridContextMenu } = await import("../features/contextmenu/GridContextMenu.js");
        const { gridContextMenuState } =
            await import("../features/contextmenu/gridContextMenuState.js");

        const grid: any = document.createElement("div");
        grid.className = "mjr-grid";
        const assets = idAssets(1, 2, 3);
        grid._mjrAssets = assets;
        grid._mjrGetAssets = () => assets;
        grid._mjrGetSelectedAssets = () => assets;
        grid.dataset.mjrSelectedAssetIds = JSON.stringify(["1", "2", "3"]);
        const card = document.createElement("div");
        card.className = "mjr-asset-card is-selected";
        card.dataset.mjrAssetId = "1";
        (card as any)._mjrAsset = assets[0];
        grid.appendChild(card);
        document.body.appendChild(grid);

        const unbind = bindGridContextMenu({ gridContainer: grid, getState: () => ({}) });
        card.dispatchEvent(
            new MouseEvent("contextmenu", {
                bubbles: true,
                cancelable: true,
                clientX: 10,
                clientY: 10,
            }),
        );
        await flushAsync();

        const deleteItem = gridContextMenuState.main.items.find((item: any) =>
            /^Delete 3 files\.\.\.$/.test(item.label),
        );
        expect(deleteItem).toBeTruthy();
        await deleteItem.action();
        await vi.waitFor(() => expect(apiMocks.deleteAssets).toHaveBeenCalledTimes(1));
        await flushAsync();

        expect(apiMocks.deleteAssets).toHaveBeenCalledWith(["1", "2", "3"]);
        expect(apiMocks.deleteAsset).not.toHaveBeenCalled();
        unbind?.();
    });
});
