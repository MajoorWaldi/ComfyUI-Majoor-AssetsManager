import { describe, expect, it } from "vitest";

import {
    createAssetCollectionIndex,
    defaultAssetKey,
    removeAssetsFromState,
    syncAssetCollectionState,
    useAssetCollection,
} from "../vue/grid/useAssetCollection.js";

describe("useAssetCollection", () => {
    it("builds stable asset identity keys", () => {
        expect(
            defaultAssetKey({
                source: "Output",
                root_id: "Root",
                subfolder: "Shots",
                filename: "Image.PNG",
            }),
        ).toBe("output|root|shots|image.png");
    });

    it("indexes assets by id and identity key", () => {
        const asset = { id: 1, source: "output", filename: "one.png" };
        const index = createAssetCollectionIndex([asset]);

        expect(index.byId.get("1")).toBe(asset);
        expect(index.byKey.get("output|||one.png")).toBe(asset);
    });

    it("appends new assets and skips duplicate ids or keys", () => {
        const collection = useAssetCollection();

        expect(
            collection.append([
                { id: 1, source: "output", filename: "one.png" },
                { id: 1, source: "output", filename: "one-copy.png" },
                { id: 2, source: "output", filename: "one.png" },
                { id: 3, source: "output", filename: "three.png" },
            ]),
        ).toBe(2);

        expect(collection.items.value.map((asset) => asset.id)).toEqual([1, 3]);
    });

    it("upserts by id or key without scanning callers needing to know the index", () => {
        const collection = useAssetCollection();
        collection.append([{ id: 1, source: "output", filename: "one.png", rating: 1 }]);

        expect(collection.upsert({ id: 1, rating: 5 })).toBe(true);
        expect(collection.getById(1)).toMatchObject({ filename: "one.png", rating: 5 });

        expect(
            collection.upsert({
                id: 2,
                source: "output",
                filename: "one.png",
                tags: ["same-key"],
            }),
        ).toBe(true);
        expect(collection.items.value).toHaveLength(1);
        expect(collection.items.value[0]).toMatchObject({ id: 2, tags: ["same-key"] });
    });

    it("removes assets and rebuilds lookup indexes", () => {
        const collection = useAssetCollection();
        collection.append([
            { id: 1, source: "output", filename: "one.png" },
            { id: 2, source: "output", filename: "two.png" },
        ]);

        expect(collection.remove([1])).toBe(1);
        expect(collection.items.value.map((asset) => asset.id)).toEqual([2]);
        expect(collection.has({ id: 1, source: "output", filename: "one.png" })).toBe(false);
        expect(collection.has({ id: 2, source: "output", filename: "two.png" })).toBe(true);
    });

    it("syncs legacy grid state lookup sets from assets", () => {
        const state = {
            assets: [
                { id: 1, source: "output", filename: "one.png" },
                { id: 2, source: "input", filename: "two.png" },
            ],
            assetIdSet: new Set(),
            seenKeys: new Set(),
        };

        syncAssetCollectionState(state);

        expect(Array.from(state.assetIdSet)).toEqual(["1", "2"]);
        expect(state.seenKeys.has("output|||one.png")).toBe(true);
        expect(state.seenKeys.has("input|||two.png")).toBe(true);
    });

    it("removes assets from legacy state and refreshes indexes", () => {
        const state = {
            assets: [
                { id: 1, source: "output", filename: "one.png" },
                { id: 2, source: "output", filename: "two.png" },
            ],
            assetIdSet: new Set(["1", "2"]),
            seenKeys: new Set(["output|||one.png", "output|||two.png"]),
        };

        expect(removeAssetsFromState(state, [{ id: 1 }])).toBe(1);
        expect(state.assets.map((asset) => asset.id)).toEqual([2]);
        expect(Array.from(state.assetIdSet)).toEqual(["2"]);
        expect(state.seenKeys.has("output|||one.png")).toBe(false);
        expect(state.seenKeys.has("output|||two.png")).toBe(true);
    });
});
