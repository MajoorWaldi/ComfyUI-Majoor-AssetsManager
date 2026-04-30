import { describe, expect, it } from "vitest";

import { shouldHideSiblingAsset } from "../features/grid/AssetCardRenderer.js";

function enabledSettings() {
    return { siblings: { hidePngSiblings: true } };
}

describe("hide siblings", () => {
    it("hides generated png siblings for video, audio, and model3d assets in the same context", () => {
        const state = {
            seenKeys: new Set(),
            assetIdSet: new Set(),
            stemMap: new Map(),
            nonImageSiblingKeys: new Set(),
            hiddenPngSiblings: 0,
            assetKeyFn: (asset) => String(asset?.id || ""),
        };

        expect(
            shouldHideSiblingAsset(
                {
                    id: "v1",
                    filename: "clip.mp4",
                    subfolder: "gen",
                    source: "output",
                    kind: "video",
                },
                state,
                enabledSettings,
            ),
        ).toMatchObject({ hidden: false });
        expect(
            shouldHideSiblingAsset(
                {
                    id: "a1",
                    filename: "sound.wav",
                    subfolder: "gen",
                    source: "output",
                    kind: "audio",
                },
                state,
                enabledSettings,
            ),
        ).toMatchObject({ hidden: false });
        expect(
            shouldHideSiblingAsset(
                {
                    id: "m1",
                    filename: "mesh.glb",
                    subfolder: "gen",
                    source: "output",
                    kind: "model3d",
                },
                state,
                enabledSettings,
            ),
        ).toMatchObject({ hidden: false });

        expect(
            shouldHideSiblingAsset(
                {
                    id: "p1",
                    filename: "clip.png",
                    subfolder: "gen",
                    source: "output",
                    kind: "image",
                },
                state,
                enabledSettings,
            ),
        ).toMatchObject({ hidden: true });
        expect(
            shouldHideSiblingAsset(
                {
                    id: "p2",
                    filename: "sound.png",
                    subfolder: "gen",
                    source: "output",
                    kind: "image",
                },
                state,
                enabledSettings,
            ),
        ).toMatchObject({ hidden: true });
        expect(
            shouldHideSiblingAsset(
                {
                    id: "p3",
                    filename: "mesh.glb.png",
                    subfolder: "gen",
                    source: "output",
                    kind: "image",
                },
                state,
                enabledSettings,
            ),
        ).toMatchObject({ hidden: true });
    });

    it("does not hide png files from a different folder context", () => {
        const state = {
            seenKeys: new Set(),
            assetIdSet: new Set(),
            stemMap: new Map(),
            nonImageSiblingKeys: new Set(),
            hiddenPngSiblings: 0,
            assetKeyFn: (asset) => String(asset?.id || ""),
        };

        shouldHideSiblingAsset(
            { id: "v1", filename: "clip.mp4", subfolder: "gen-a", source: "output", kind: "video" },
            state,
            enabledSettings,
        );

        expect(
            shouldHideSiblingAsset(
                {
                    id: "p1",
                    filename: "clip.png",
                    subfolder: "gen-b",
                    source: "output",
                    kind: "image",
                },
                state,
                enabledSettings,
            ),
        ).toMatchObject({ hidden: false });
    });
});
