// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    chunkAssetIds,
    rateAssetsInBulk,
    BULK_RATING_CHUNK_SIZE,
} from "../features/grid/bulkRating.js";
import { bindGridContextMenu } from "../features/contextmenu/GridContextMenu.js";
import {
    gridContextMenuState,
    closeAllGridContextMenus,
} from "../features/contextmenu/gridContextMenuState.js";
import { comfyToast } from "../app/toast.js";

const mocks = vi.hoisted(() => ({
    updateAssetRating: vi.fn().mockResolvedValue({ ok: true, data: { asset_id: 5, rating: 3 } }),
    updateAssetsRatingBulk: vi
        .fn()
        .mockResolvedValue({ ok: true, data: { updated_ids: [], failed: [] } }),
}));

const interpolateT = (key: any, defOrParams?: any, params?: any) => {
    let text = typeof defOrParams === "string" ? defOrParams : String(key ?? "");
    const p =
        (typeof defOrParams === "object" && defOrParams !== null ? defOrParams : params) || {};
    for (const [k, v] of Object.entries(p)) text = text.replaceAll(`{${k}}`, String(v));
    return text;
};

vi.mock("../api/client.js", () => ({
    updateAssetRating: mocks.updateAssetRating,
    updateAssetsRatingBulk: mocks.updateAssetsRatingBulk,
}));
vi.mock("../app/toast.js", () => ({ comfyToast: vi.fn() }));
vi.mock("../app/i18n.js", () => ({
    t: (key: any, defOrParams?: any, params?: any) => interpolateT(key, defOrParams, params),
}));
vi.mock("../app/dialogs.js", () => ({
    comfyConfirm: vi.fn().mockResolvedValue(true),
    comfyPrompt: vi.fn().mockResolvedValue(""),
}));
vi.mock("../app/settings/settingsCore.js", () => ({ loadMajoorSettings: () => ({}) }));
vi.mock("../app/hostAdapter.js", () => ({
    getRawHostApp: () => null,
    importWorkflowPreferHostTab: vi.fn(),
    isHostWorkflowDirty: () => false,
    fetchHostApi: vi.fn(),
}));
vi.mock("../features/grid/GridKeyboard.js", () => ({ getShortcutDisplay: () => "" }));
vi.mock("../features/viewer/workflowGraphMap/workflowGraphMapData.js", () => ({
    resolveAssetWorkflow: vi.fn(),
}));

function makeGrid(selectedIds: string[], assetCount: number) {
    const grid = document.createElement("div");
    grid.className = "mjr-assets-grid";
    const assets: any[] = [];
    for (let i = 0; i < assetCount; i += 1) {
        const id = String(i + 1);
        const card: HTMLDivElement & { _mjrAsset?: unknown } = document.createElement("div");
        card.className = "mjr-asset-card";
        card.dataset.mjrAssetId = id;
        const asset: any = {
            id: Number(id),
            filename: `file-${id}.png`,
            filepath: `/tmp/file-${id}.png`,
            type: "output",
            kind: "image",
            rating: 0,
        };
        card._mjrAsset = asset;
        if (selectedIds.includes(id)) card.classList.add("is-selected");
        grid.appendChild(card);
        assets.push(asset);
    }
    grid.dataset.mjrSelectedAssetIds = JSON.stringify(selectedIds);
    grid.dataset.mjrSelectedAssetId = selectedIds[0] || "";
    return { grid, assets };
}

function openMenuAndGetRatingItem(selectedIds: string[], assetCount: number, clickedId?: string) {
    const { grid, assets } = makeGrid(selectedIds, assetCount);
    const unbind = bindGridContextMenu({ gridContainer: grid });
    let card: any;
    if (clickedId) {
        card = Array.from(grid.querySelectorAll(".mjr-asset-card")).find(
            (el: any) => el.dataset.mjrAssetId === clickedId,
        );
    }
    if (!card) {
        card =
            grid.querySelector(".mjr-asset-card.is-selected") ||
            grid.querySelector(".mjr-asset-card");
    }
    const event = new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        clientX: 10,
        clientY: 10,
    });
    card.dispatchEvent(event);
    const items: any[] = gridContextMenuState.main.items || [];
    const ratingItem = items.find(
        (item: any) => item?.type === "item" && /Set rating/i.test(String(item?.label || "")),
    );
    return { grid, assets, unbind, ratingItem };
}

describe("bulk rating helper", () => {
    beforeEach(() => {
        mocks.updateAssetRating.mockClear();
        mocks.updateAssetsRatingBulk.mockReset();
        mocks.updateAssetsRatingBulk.mockResolvedValue({
            ok: true,
            data: { updated_ids: [], failed: [] },
        });
        vi.mocked(comfyToast).mockClear();
    });

    it("chunks ids into batches of 500", () => {
        expect(BULK_RATING_CHUNK_SIZE).toBe(500);
        const ids = Array.from({ length: 1201 }, (_v, i) => String(i + 1));
        const chunks = chunkAssetIds(ids);
        expect(chunks.map((chunk) => chunk.length)).toEqual([500, 500, 201]);
        expect(chunks.flat()).toEqual(ids);
    });

    it("dispatches events for updated ids and warns on partial failure", async () => {
        mocks.updateAssetsRatingBulk.mockResolvedValue({
            ok: true,
            data: {
                updated_ids: [1, 2],
                failed: [{ id: 3, code: "NOT_FOUND", error: "Asset not found: 3" }],
            },
        });
        const events: any[] = [];
        window.addEventListener("mjr:asset-rating-changed", (ev: any) => events.push(ev.detail));
        const result = await rateAssetsInBulk(["1", "2", "3"], 4);
        expect(result.rated).toEqual(["1", "2"]);
        expect(result.failed).toEqual(["3"]);
        expect(events.map((d) => d.assetId)).toEqual(["1", "2"]);
        expect(
            vi
                .mocked(comfyToast)
                .mock.calls.some((call: any[]) => String(call[0]) === "2 rated, 1 failed"),
        ).toBe(true);
    });

    it("uses the server-applied rating for events when it clamps the requested value", async () => {
        mocks.updateAssetsRatingBulk.mockResolvedValue({
            ok: true,
            data: { updated_ids: [7], failed: [], rating: 5 },
        });
        const events: any[] = [];
        const onEvent = (ev: any) => events.push(ev.detail);
        window.addEventListener("mjr:asset-rating-changed", onEvent);
        await rateAssetsInBulk(["7"], 9);
        expect(events).toEqual([{ assetId: "7", rating: 5 }]);
        window.removeEventListener("mjr:asset-rating-changed", onEvent);
    });

    it("falls back to the requested rating when the server omits data.rating", async () => {
        mocks.updateAssetsRatingBulk.mockResolvedValue({
            ok: true,
            data: { updated_ids: [7], failed: [] },
        });
        const events: any[] = [];
        const onEvent = (ev: any) => events.push(ev.detail);
        window.addEventListener("mjr:asset-rating-changed", onEvent);
        await rateAssetsInBulk(["7"], 3);
        expect(events).toEqual([{ assetId: "7", rating: 3 }]);
        window.removeEventListener("mjr:asset-rating-changed", onEvent);
    });

    it("counts chunk ids reported as neither updated nor failed as failed", async () => {
        mocks.updateAssetsRatingBulk.mockResolvedValue({
            ok: true,
            data: { updated_ids: [1], failed: [], rating: 3 },
        });
        const result = await rateAssetsInBulk(["1", "2"], 3);
        expect(result.rated).toEqual(["1"]);
        expect(result.failed).toEqual(["2"]);
    });

    it("does not double count a listed failure that is also absent from updated_ids", async () => {
        mocks.updateAssetsRatingBulk.mockResolvedValue({
            ok: true,
            data: {
                updated_ids: [1],
                failed: [{ id: 2, code: "NOT_FOUND", error: "Asset not found: 2" }],
                rating: 3,
            },
        });
        const result = await rateAssetsInBulk(["1", "2"], 3);
        expect(result.rated).toEqual(["1"]);
        expect(result.failed).toEqual(["2"]);
    });

    it("bases the progress toast total on the normalised id count", async () => {
        const ids = Array.from({ length: 1001 }, (_v, i) => String(i + 1));
        ids.push("");
        await rateAssetsInBulk(ids, 2);
        expect(mocks.updateAssetsRatingBulk).toHaveBeenCalledTimes(3);
        expect(
            vi
                .mocked(comfyToast)
                .mock.calls.some((call: any[]) => String(call[0]).includes("500/1001")),
        ).toBe(true);
        expect(
            vi
                .mocked(comfyToast)
                .mock.calls.some((call: any[]) => String(call[0]).includes("1002")),
        ).toBe(false);
    });

    it("serializes runs latest-wins: superseded queued runs send nothing", async () => {
        const deferreds: Array<(value: any) => void> = [];
        mocks.updateAssetsRatingBulk.mockImplementation(
            () =>
                new Promise((resolve) => {
                    deferreds.push(resolve);
                }),
        );
        const events: any[] = [];
        const onEvent = (ev: any) => events.push(ev.detail);
        window.addEventListener("mjr:asset-rating-changed", onEvent);

        const a = rateAssetsInBulk(["1"], 4);
        const b = rateAssetsInBulk(["2"], 2);
        const c = rateAssetsInBulk(["3"], 3);

        // A started immediately and is in flight; B and C are queued.
        expect(deferreds.length).toBe(1);
        deferreds[0]({ ok: true, data: { updated_ids: [1], failed: [], rating: 4 } });
        const resultA = await a;
        expect(resultA.rated).toEqual(["1"]);
        expect(resultA.superseded).toBeFalsy();

        // B was superseded by C before it started: no request, no toast.
        const resultB = await b;
        expect(resultB).toEqual({ rated: [], failed: [], superseded: true });

        // C sends after A finished and its events win last.
        await vi.waitFor(() => expect(deferreds.length).toBe(2));
        expect(
            mocks.updateAssetsRatingBulk.mock.calls.some(
                (call: any[]) => call[0].length === 1 && call[0][0] === "2",
            ),
        ).toBe(false);
        deferreds[1]({ ok: true, data: { updated_ids: [3], failed: [], rating: 3 } });
        const resultC = await c;
        expect(resultC.rated).toEqual(["3"]);
        expect(events.map((d) => d.rating)).toEqual([4, 3]);
        expect(
            vi
                .mocked(comfyToast)
                .mock.calls.some((call: any[]) => String(call[0]).includes("2 stars")),
        ).toBe(false);
        window.removeEventListener("mjr:asset-rating-changed", onEvent);
    });

    it("shows an error toast when the whole batch fails", async () => {
        mocks.updateAssetsRatingBulk.mockResolvedValue({
            ok: false,
            code: "DB_ERROR",
            error: "boom",
        });
        const result = await rateAssetsInBulk(["1", "2"], 3);
        expect(result.rated).toEqual([]);
        expect(result.failed).toEqual(["1", "2"]);
        expect(vi.mocked(comfyToast).mock.calls.some((call: any[]) => call[1] === "error")).toBe(
            true,
        );
    });
});

describe("grid context menu rating", () => {
    let unbind: any;

    beforeEach(() => {
        mocks.updateAssetRating.mockClear();
        mocks.updateAssetsRatingBulk.mockReset();
        mocks.updateAssetsRatingBulk.mockResolvedValue({
            ok: true,
            data: { updated_ids: [], failed: [] },
        });
        vi.mocked(comfyToast).mockClear();
        vi.useRealTimers();
    });

    afterEach(() => {
        if (typeof unbind === "function") unbind();
        unbind = null;
        closeAllGridContextMenus();
        gridContextMenuState.main.items = [];
        document.body.innerHTML = "";
    });

    it("labels the submenu for multi selections and rates the selection in one batch", async () => {
        const ctx = openMenuAndGetRatingItem(["1", "2", "3"], 3);
        unbind = ctx.unbind;
        expect(ctx.ratingItem.label).toBe("Set rating (3 selected)");
        expect(ctx.ratingItem.submenu.length).toBeGreaterThan(0);
        const twoStars = ctx.ratingItem.submenu.find((item: any) => item.label === "**ooo");
        expect(twoStars).toBeTruthy();
        mocks.updateAssetsRatingBulk.mockResolvedValue({
            ok: true,
            data: { updated_ids: [1, 2, 3], failed: [] },
        });
        const events: any[] = [];
        window.addEventListener("mjr:asset-rating-changed", (ev: any) => events.push(ev.detail));
        await twoStars.action();
        expect(mocks.updateAssetsRatingBulk).toHaveBeenCalledTimes(1);
        expect(mocks.updateAssetsRatingBulk).toHaveBeenCalledWith(["1", "2", "3"], 2);
        expect(events.map((d) => d.assetId).sort()).toEqual(["1", "2", "3"]);
        expect(events.every((d) => d.rating === 2)).toBe(true);
        expect(mocks.updateAssetRating).not.toHaveBeenCalled();
        window.removeEventListener("mjr:asset-rating-changed", () => {});
    });

    it("keeps the single-card path when right-clicking an unselected card with 3 selected", async () => {
        vi.useFakeTimers();
        const ctx = openMenuAndGetRatingItem(["1", "2", "3"], 4, "4");
        unbind = ctx.unbind;
        expect(ctx.ratingItem.label).toBe("Set rating");
        const twoStars = ctx.ratingItem.submenu.find((item: any) => item.label === "**ooo");
        expect(twoStars).toBeTruthy();
        await twoStars.action();
        expect(mocks.updateAssetsRatingBulk).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(500);
        expect(mocks.updateAssetRating).toHaveBeenCalledTimes(1);
        expect(mocks.updateAssetRating.mock.calls[0].slice(0, 2)).toEqual(["4", 2]);
        vi.useRealTimers();
    });

    it("does not optimistically render the rating before the batch responds", async () => {
        let resolveBatch: (value: any) => void = () => {};
        mocks.updateAssetsRatingBulk.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveBatch = resolve;
                }),
        );
        const ctx = openMenuAndGetRatingItem(["1", "2", "3"], 3, "1");
        unbind = ctx.unbind;
        expect(ctx.ratingItem.label).toBe("Set rating (3 selected)");
        const clickedAsset = ctx.assets[0];
        const threeStars = ctx.ratingItem.submenu.find((item: any) => item.label === "***oo");
        expect(threeStars).toBeTruthy();
        const actionPromise = threeStars.action();
        expect(mocks.updateAssetsRatingBulk).toHaveBeenCalledWith(["1", "2", "3"], 3);
        expect(clickedAsset.rating).toBe(0);
        resolveBatch({ ok: true, data: { updated_ids: [1, 2, 3], failed: [], rating: 3 } });
        await actionPromise;
        expect(clickedAsset.rating).toBe(0);
    });

    it("keeps the single-card submenu on the per-asset path", async () => {
        vi.useFakeTimers();
        const ctx = openMenuAndGetRatingItem(["2"], 3);
        unbind = ctx.unbind;
        expect(ctx.ratingItem.label).toBe("Set rating");
        const threeStars = ctx.ratingItem.submenu.find((item: any) => item.label === "***oo");
        expect(threeStars).toBeTruthy();
        await threeStars.action();
        await vi.advanceTimersByTimeAsync(500);
        expect(mocks.updateAssetRating).toHaveBeenCalledTimes(1);
        expect(mocks.updateAssetRating.mock.calls[0].slice(0, 2)).toEqual(["2", 3]);
        expect(mocks.updateAssetsRatingBulk).not.toHaveBeenCalled();
        expect(vi.isFakeTimers()).toBe(true);
        vi.useRealTimers();
    });
});

describe("bulk rating client call", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("posts normalized ids and clamped rating to the batch endpoint", async () => {
        const fetchCalls: any[] = [];
        const fetchMock = vi.fn(async (input: any, init: any = {}) => {
            fetchCalls.push({ input: String(input), init });
            return {
                status: 200,
                headers: {
                    get: (name: string) => (name === "content-type" ? "application/json" : null),
                },
                json: async () => ({ ok: true, data: { updated_ids: [7, 9], failed: [] } }),
            };
        });
        vi.stubGlobal("fetch", fetchMock);
        const clientModule: any = await vi.importActual("../api/client.js");
        const result = await clientModule.updateAssetsRatingBulk(["7", "x", 9], 9);
        expect(result?.ok).toBe(true);
        const batchCall = fetchCalls.find((call) => call.input === "/mjr/am/assets/rating");
        expect(batchCall).toBeTruthy();
        expect(batchCall.init.method).toBe("POST");
        expect(JSON.parse(batchCall.init.body)).toEqual({ ids: ["7", "9"], rating: 5 });
        const headers = batchCall.init.headers;
        const rtSync =
            typeof headers?.get === "function"
                ? headers.get("X-MJR-RTSYNC")
                : headers?.["X-MJR-RTSYNC"];
        expect(rtSync).toBe("on");
    });
});
