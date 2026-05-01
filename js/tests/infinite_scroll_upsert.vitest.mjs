import { describe, expect, it, vi } from "vitest";

import {
    fetchPage,
    flushUpsertBatch,
    getUpsertBatchState,
    resolvePageAdvanceCount,
    upsertAsset,
} from "../vue/composables/useVirtualGrid.js";

function assetKey(asset) {
    const stackId = String(asset?.stack_id || "").trim();
    if (stackId) return `stack:${stackId}`;
    return `id:${String(asset?.id || "")}`;
}

describe("InfiniteScroll upsert", () => {
    it("advances by the consumed backend page window when dedupe shrinks a page", () => {
        expect(
            resolvePageAdvanceCount({
                count: 16,
                limit: 100,
                offset: 100,
                total: 7000,
            }),
        ).toBe(100);
    });

    it("clamps the page advance to the remaining total on the last page", () => {
        expect(
            resolvePageAdvanceCount({
                count: 16,
                limit: 100,
                offset: 7000,
                total: 7050,
            }),
        ).toBe(50);
    });

    it("falls back to the returned count when total is unknown", () => {
        expect(
            resolvePageAdvanceCount({
                count: 16,
                limit: 100,
                offset: 100,
                total: null,
            }),
        ).toBe(16);
    });

    it("skips total counts for default output browse and later output pages only", async () => {
        const buildListURL = vi.fn(() => "/mjr/am/list");
        const deps = {
            sanitizeQuery: (value) => value,
            buildListURL,
            get: vi.fn(async () => ({
                ok: true,
                data: { assets: [], total: 0, limit: 100, offset: 0 },
            })),
            getGridState: () => ({ requestId: 1 }),
        };

        const cases = [
            [{ dataset: { mjrScope: "output", mjrSort: "mtime_desc" } }, "*", 0, false],
            [{ dataset: { mjrScope: "output", mjrSort: "mtime_desc" } }, "*", 100, false],
            [{ dataset: { mjrScope: "output", mjrSort: "mtime_desc" } }, "portrait", 0, true],
            [
                { dataset: { mjrScope: "output", mjrSort: "mtime_desc", mjrFilterMinRating: "3" } },
                "*",
                0,
                true,
            ],
            [{ dataset: { mjrScope: "all", mjrSort: "mtime_desc" } }, "*", 100, true],
            [{ dataset: { mjrScope: "input", mjrSort: "mtime_desc" } }, "*", 100, true],
            [{ dataset: { mjrScope: "custom", mjrSort: "mtime_desc" } }, "*", 100, true],
        ];

        for (const [gridContainer, query, offset, includeTotal] of cases) {
            await fetchPage(gridContainer, query, 100, offset, deps, {
                requestId: 1,
            });
            const lastCall = buildListURL.mock.calls[buildListURL.mock.calls.length - 1]?.[0];
            expect(lastCall).toMatchObject({
                scope: gridContainer.dataset.mjrScope,
                offset,
                includeTotal,
            });
        }
    });

    it("uses offset pagination without sending stale cursors on later pages", async () => {
        const buildListURL = vi.fn(() => "/mjr/am/list");
        const deps = {
            sanitizeQuery: (value) => value,
            buildListURL,
            get: vi.fn(async () => ({
                ok: true,
                data: { assets: [], limit: 100, offset: 80 },
            })),
            getGridState: () => ({ requestId: 1 }),
        };

        await fetchPage(
            { dataset: { mjrScope: "output", mjrSort: "mtime_desc" } },
            "*",
            100,
            80,
            deps,
            { requestId: 1, cursor: "cursor-from-previous-page" },
        );

        expect(buildListURL).toHaveBeenCalledWith(
            expect.objectContaining({ offset: 80, cursor: null }),
        );
    });

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

    it("skips inserting an upsert that does not match active grid filters", () => {
        const gridContainer = {
            dataset: {
                mjrSort: "mtime_desc",
                mjrScope: "output",
                mjrSubfolder: "shots/final",
                mjrFilterKind: "image",
                mjrFilterMinRating: "4",
            },
        };
        const state = {
            assets: [],
            seenKeys: new Set(),
            assetIdSet: new Set(),
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

        expect(
            upsertAsset(
                gridContainer,
                { id: 3, kind: "video", subfolder: "shots/wip", rating: 2, mtime: 10 },
                deps,
            ),
        ).toBe(true);
        flushUpsertBatch(gridContainer, deps);

        expect(state.assets).toHaveLength(0);
        expect(setItems).not.toHaveBeenCalled();
    });

    it("keeps an existing filtered card when a sparse upsert omits filter fields", () => {
        const gridContainer = {
            dataset: {
                mjrSort: "mtime_desc",
                mjrScope: "custom",
                mjrSubfolder: "shots/final",
                mjrFilterKind: "image",
                mjrFilterWorkflowOnly: "1",
                mjrFilterWorkflowType: "T2I",
                mjrFilterMinRating: "4",
            },
        };
        const state = {
            assets: [
                {
                    id: 4,
                    filename: "four.png",
                    source: "custom",
                    subfolder: "shots/final",
                    kind: "image",
                    rating: 5,
                    has_workflow: true,
                    workflow_type: "T2I",
                    mtime: 10,
                },
            ],
            seenKeys: new Set(["id:4"]),
            assetIdSet: new Set(["4"]),
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

        expect(upsertAsset(gridContainer, { id: 4, mtime: 20 }, deps)).toBe(true);
        flushUpsertBatch(gridContainer, deps);

        expect(state.assets).toHaveLength(1);
        expect(state.assets[0]).toMatchObject({
            id: 4,
            source: "custom",
            subfolder: "shots/final",
            rating: 5,
            has_workflow: true,
            workflow_type: "T2I",
            mtime: 20,
        });
        expect(setItems).toHaveBeenCalledTimes(1);
    });

    it("merges a live placeholder with the indexed asset that shares the same file identity", () => {
        const gridContainer = { dataset: { mjrSort: "mtime_desc" } };
        const state = {
            assets: [
                {
                    id: "live:output||shots|gen_live_0002.png",
                    filename: "gen_live_0002.png",
                    subfolder: "shots",
                    type: "output",
                    source: "output",
                    kind: "image",
                    mtime: 100,
                    is_live_placeholder: true,
                    _mjrLivePlaceholder: true,
                    _mjrLiveLabel: "In progress",
                },
            ],
            seenKeys: new Set(["id:live:output||shots|gen_live_0002.png"]),
            assetIdSet: new Set(["live:output||shots|gen_live_0002.png"]),
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

        expect(
            upsertAsset(
                gridContainer,
                {
                    id: 99,
                    filename: "gen_live_0002.png",
                    subfolder: "shots",
                    type: "output",
                    source: "output",
                    kind: "image",
                    filepath: "shots/gen_live_0002.png",
                    rating: 4,
                    mtime: 200,
                },
                deps,
            ),
        ).toBe(true);
        flushUpsertBatch(gridContainer, deps);

        expect(state.assets).toHaveLength(1);
        expect(state.assets[0]).toMatchObject({
            id: 99,
            filename: "gen_live_0002.png",
            subfolder: "shots",
            rating: 4,
            mtime: 200,
        });
        expect(state.assets[0]._mjrLivePlaceholder).toBeUndefined();
        expect(state.assets[0].is_live_placeholder).toBeUndefined();
        expect(state.assetIdSet.has("99")).toBe(true);
        expect(state.assetIdSet.has("live:output||shots|gen_live_0002.png")).toBe(false);
        expect(setItems).toHaveBeenCalledTimes(1);
    });
});
