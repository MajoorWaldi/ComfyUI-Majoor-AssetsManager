import { describe, expect, it } from "vitest";

import {
    getFeedAssetIdentityKey,
    mergeFeedAssetIntoMap,
} from "../features/bottomPanel/feed/feedHost.js";

describe("Generated feed asset upsert", () => {
    it("uses the same file identity for live placeholders and indexed assets", () => {
        expect(
            getFeedAssetIdentityKey({
                id: "live:output||shots|gen_live_0002.png",
                filename: "gen_live_0002.png",
                subfolder: "shots",
                type: "output",
                source: "output",
            }),
        ).toBe("output||shots|gen_live_0002.png");

        expect(
            getFeedAssetIdentityKey({
                id: 99,
                filename: "gen_live_0002.png",
                subfolder: "shots",
                type: "output",
                source: "output",
                filepath: "shots/gen_live_0002.png",
            }),
        ).toBe("output||shots|gen_live_0002.png");
    });

    it("replaces a live placeholder with the indexed feed asset instead of duplicating it", () => {
        const assetsByKey = new Map();

        mergeFeedAssetIntoMap(assetsByKey, {
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
        });

        const merged = mergeFeedAssetIntoMap(assetsByKey, {
            id: 99,
            filename: "gen_live_0002.png",
            subfolder: "shots",
            type: "output",
            source: "output",
            kind: "image",
            filepath: "shots/gen_live_0002.png",
            rating: 4,
            mtime: 200,
        });

        expect(assetsByKey).toHaveLength(1);
        expect(Array.from(assetsByKey.keys())).toEqual(["id:99"]);
        expect(merged).toMatchObject({
            id: 99,
            filename: "gen_live_0002.png",
            subfolder: "shots",
            rating: 4,
            mtime: 200,
        });
        expect(merged._mjrLivePlaceholder).toBeUndefined();
        expect(merged.is_live_placeholder).toBeUndefined();
    });
});
