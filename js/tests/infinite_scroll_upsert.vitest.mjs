import { describe, expect, it, vi } from "vitest";

import {
    flushUpsertBatch,
    getUpsertBatchState,
    upsertAsset,
} from "../features/grid/InfiniteScroll.js";

function assetKey(asset) {
    const stackId = String(asset?.stack_id || "").trim();
    if (stackId) return `stack:${stackId}`;
    return `id:${String(asset?.id || "")}`;
}

describe("InfiniteScroll upsert", () => {
    it("refreshes seen keys when an existing asset gains a stack id", () => {
        const gridContainer = { dataset: { mjrSort: "mtime_desc" } };
        const state = {
            assets: [{ id: 1, filename: "one.png", mtime: 10 }],
            seenKeys: new Set(["id:1"]),
            assetIdSet: new Set(["1"]),
            hiddenPngSiblings: 0,
        };
        const setItems = vi.fn();
        const deps = {
            upsertState: new Map(),
            getOrCreateState: () => state,
            ensureVirtualGrid: () => ({ setItems }),
            assetKey,
            loadMajoorSettings: () => ({}),
        };

        const batchState = getUpsertBatchState(gridContainer, deps.upsertState);
        batchState.pending.set("1", { id: 1, stack_id: "stack-a", filename: "one.png", mtime: 10 });

        flushUpsertBatch(gridContainer, deps);

        expect(state.seenKeys.has("id:1")).toBe(false);
        expect(state.seenKeys.has("stack:stack-a")).toBe(true);
        expect(state.assets).toHaveLength(1);
        expect(state.assets[0].stack_id).toBe("stack-a");
        expect(setItems).toHaveBeenCalledTimes(1);
    });

    it("dedupes cards after a key change collides with an existing stack card", () => {
        const gridContainer = { dataset: { mjrSort: "mtime_desc" } };
        const state = {
            assets: [
                { id: 1, filename: "one.png", mtime: 20 },
                { id: 2, filename: "two.png", mtime: 10, stack_id: "stack-a" },
            ],
            seenKeys: new Set(["id:1", "stack:stack-a"]),
            assetIdSet: new Set(["1", "2"]),
            hiddenPngSiblings: 0,
        };
        const setItems = vi.fn();
        const deps = {
            upsertState: new Map(),
            getOrCreateState: () => state,
            ensureVirtualGrid: () => ({ setItems }),
            assetKey,
            loadMajoorSettings: () => ({}),
            maxBatchSize: 50,
            debounceMs: 0,
        };

        expect(upsertAsset(gridContainer, { id: 1, stack_id: "stack-a", mtime: 30 }, deps)).toBe(
            true,
        );
        flushUpsertBatch(gridContainer, deps);

        expect(state.assets).toHaveLength(1);
        expect(state.assets[0].id).toBe(1);
        expect(state.seenKeys.has("stack:stack-a")).toBe(true);
        expect(state.assetIdSet.has("1")).toBe(true);
        expect(state.assetIdSet.has("2")).toBe(false);
        expect(setItems).toHaveBeenCalledTimes(1);
    });
});
