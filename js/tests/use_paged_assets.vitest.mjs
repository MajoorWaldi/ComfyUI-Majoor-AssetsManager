import { describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import { useAssetCollection } from "../vue/grid/useAssetCollection.js";
import {
    loadPagesUntilVisible,
    resolvePageAdvance,
    usePagedAssets,
} from "../vue/grid/usePagedAssets.js";

describe("usePagedAssets", () => {
    it("advances by the backend page window when total is known", () => {
        expect(
            resolvePageAdvance({
                assets: [{ id: 1 }],
                count: 1,
                limit: 100,
                offset: 100,
                total: 500,
            }),
        ).toBe(100);
    });

    it("loads and appends pages through the collection", async () => {
        const collection = useAssetCollection();
        const query = ref({ q: "*" });
        const fetchPage = vi.fn(async ({ offset, limit }) => ({
            ok: true,
            assets: [{ id: offset + 1, filename: `${offset + 1}.png` }],
            count: limit,
            limit,
            total: 3,
        }));
        const paged = usePagedAssets({
            query,
            collection,
            fetchPage,
            pageSize: 1,
        });

        await paged.loadMore();
        await paged.loadMore();

        expect(fetchPage).toHaveBeenCalledTimes(2);
        expect(collection.items.value.map((asset) => asset.id)).toEqual([1, 2]);
        expect(paged.state.offset).toBe(2);
        expect(paged.state.done).toBe(false);

        await paged.loadMore();

        expect(paged.state.done).toBe(true);
        expect(collection.items.value.map((asset) => asset.id)).toEqual([1, 2, 3]);
    });

    it("can page through an 8000 asset library without stopping early", async () => {
        const total = 8000;
        const pageSize = 250;
        const collection = useAssetCollection();
        const fetchPage = vi.fn(async ({ offset, limit }) => {
            const end = Math.min(total, offset + limit);
            return {
                ok: true,
                assets: Array.from({ length: Math.max(0, end - offset) }, (_, index) => {
                    const id = offset + index + 1;
                    return { id, filename: `${String(id).padStart(5, "0")}.png` };
                }),
                count: end - offset,
                limit,
                offset,
                total,
            };
        });
        const paged = usePagedAssets({ collection, fetchPage, pageSize });

        while (paged.canLoadMore.value) {
            const result = await paged.loadMore();
            expect(result.ok).toBe(true);
        }

        expect(fetchPage).toHaveBeenCalledTimes(Math.ceil(total / pageSize));
        expect(collection.items.value).toHaveLength(total);
        expect(paged.state.offset).toBe(total);
        expect(paged.state.done).toBe(true);
    });

    it("passes and stores cursors when the backend provides them", async () => {
        const collection = useAssetCollection();
        const fetchPage = vi
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                assets: [{ id: 1, filename: "one.png" }],
                count: 1,
                limit: 1,
                offset: 0,
                total: null,
                next_cursor: "cursor-1",
                has_more: true,
            })
            .mockResolvedValueOnce({
                ok: true,
                assets: [{ id: 2, filename: "two.png" }],
                count: 1,
                limit: 1,
                offset: 0,
                total: null,
                next_cursor: "",
                has_more: false,
            });
        const paged = usePagedAssets({ collection, fetchPage, pageSize: 1 });

        await paged.loadMore();
        await paged.loadMore();

        expect(fetchPage.mock.calls[0][0]).toMatchObject({ cursor: null, offset: 0 });
        expect(fetchPage.mock.calls[1][0]).toMatchObject({ cursor: "cursor-1" });
        expect(collection.items.value.map((asset) => asset.id)).toEqual([1, 2]);
        expect(paged.state.cursor).toBeNull();
        expect(paged.state.done).toBe(true);
    });

    it("returns the collection append count and accepts legacy hasMore", () => {
        const collection = {
            items: ref([]),
            append: vi.fn(() => 0),
        };
        const paged = usePagedAssets({ collection, pageSize: 10 });

        const result = paged.applyPage({
            ok: true,
            assets: [{ id: 1 }],
            count: 10,
            limit: 10,
            total: null,
            hasMore: false,
        });

        expect(collection.append).toHaveBeenCalledWith([{ id: 1 }]);
        expect(result).toEqual({ added: 0, advanced: 10 });
        expect(paged.state.offset).toBe(10);
        expect(paged.state.done).toBe(true);
    });

    it("hydrates and snapshots pagination state without direct field writes", () => {
        const paged = usePagedAssets({ pageSize: 10 });

        expect(
            paged.setPageState({
                offset: "25",
                cursor: "cursor-2",
                total: "100",
                done: true,
                requestId: "7",
                loading: true,
                error: new Error("boom"),
            }),
        ).toMatchObject({
            offset: 25,
            cursor: "cursor-2",
            total: 100,
            done: true,
            requestId: 7,
            loading: true,
        });
        expect(paged.getPageState()).toMatchObject({
            offset: 25,
            cursor: "cursor-2",
            total: 100,
            done: true,
            requestId: 7,
            loading: true,
        });

        paged.setPageState({ cursor: "", total: null, loading: false, error: null });
        expect(paged.getPageState()).toMatchObject({ cursor: null, total: null, loading: false, error: null });
    });

    it("loads adaptive pages until one appends visible assets", async () => {
        const fetchPage = vi
            .fn()
            .mockResolvedValueOnce({ ok: true, assets: [{ id: 1 }], count: 10 })
            .mockResolvedValueOnce({ ok: true, assets: [{ id: 2 }], count: 20 });
        const applyPage = vi
            .fn()
            .mockReturnValueOnce({ added: 0, advanced: 10, count: 10, done: false })
            .mockReturnValueOnce({ added: 1, advanced: 20, count: 20, done: false });
        const onEmptyPage = vi.fn();

        const result = await loadPagesUntilVisible({
            fetchPage,
            applyPage,
            getLimit: (emptyPageIndex) => (emptyPageIndex + 1) * 10,
            onEmptyPage,
        });

        expect(fetchPage.mock.calls.map(([args]) => args.limit)).toEqual([10, 20]);
        expect(applyPage).toHaveBeenCalledTimes(2);
        expect(onEmptyPage).toHaveBeenCalledTimes(1);
        expect(result).toMatchObject({ ok: true, count: 20, added: 1, advanced: 20 });
    });

    it("exposes adaptive visible loading through the composable state machine", async () => {
        const collection = {
            items: ref([]),
            append: vi.fn().mockReturnValueOnce(0).mockReturnValueOnce(1),
        };
        const fetchPage = vi.fn(async ({ offset, limit }) => ({
            ok: true,
            assets: [{ id: offset + limit }],
            count: limit,
            limit,
            total: 100,
        }));
        const paged = usePagedAssets({ collection, fetchPage, pageSize: 10 });

        const result = await paged.loadUntilVisible({
            getLimit: (emptyPageIndex) => (emptyPageIndex + 1) * 10,
        });

        expect(fetchPage.mock.calls.map(([args]) => [args.offset, args.limit])).toEqual([
            [0, 10],
            [10, 20],
        ]);
        expect(collection.append).toHaveBeenCalledTimes(2);
        expect(result).toMatchObject({ ok: true, added: 1, advanced: 20, count: 20 });
        expect(paged.state.offset).toBe(30);
        expect(paged.state.loading).toBe(false);
    });

    it("ignores stale pages after reset changes request id", async () => {
        const collection = useAssetCollection();
        let resolveFirst;
        const fetchPage = vi
            .fn()
            .mockImplementationOnce(
                () =>
                    new Promise((resolve) => {
                        resolveFirst = resolve;
                    }),
            )
            .mockResolvedValueOnce({
                ok: true,
                assets: [{ id: 2, filename: "new.png" }],
                count: 1,
                limit: 1,
                total: 1,
            });
        const query = ref({ q: "*" });
        const paged = usePagedAssets({
            query,
            collection,
            fetchPage,
            pageSize: 1,
        });

        const staleLoad = paged.loadMore();
        const freshLoad = paged.reset({ q: "fresh" });
        resolveFirst({
            ok: true,
            assets: [{ id: 1, filename: "old.png" }],
            count: 1,
            limit: 1,
            total: 1,
        });

        await staleLoad;
        await freshLoad;

        expect(query.value).toEqual({ q: "fresh" });
        expect(collection.items.value.map((asset) => asset.filename)).toEqual(["new.png"]);
    });
});
